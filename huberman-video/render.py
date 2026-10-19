"""Light, shadow and fluorescent particles, rendered frame by frame.

Everything is a pure function of time t, so frames can be rendered in any
order and split across processes.  Scenes write *luminance* into float
buffers; one tone curve and one Loyel gradient-blue LUT turn it into colour.

Usage:
  python3 render.py stills 3.5 14 25 ...      # PNG test frames into build/stills
  python3 render.py video build/music.wav out.mp4 [workers]
"""
import math
import os
import subprocess
import sys
from multiprocessing import Process

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy.ndimage import gaussian_filter1d

import timeline as TL
from timeline import BAR, BEAT, T

W, H, FPS = TL.W, TL.H, TL.FPS
NF = int(round(TL.DURATION * FPS))
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.environ.get("FONT_DIR", os.path.join(HERE, ".fonts"))
SANS_SC = os.path.join(FONT_DIR, "NotoSansSC.ttf")
INTER = "/usr/share/fonts/opentype/inter/Inter-{}.otf"
LETTERBOX = 96
cv2.setNumThreads(1)

# --------------------------------------------------------------------------
# Loyel gradient-blue LUT (the only colours used; black is the shadow end)
# --------------------------------------------------------------------------
LOYEL = ["#263B54", "#2B4868", "#2E5076", "#376392", "#497DAE",
         "#6C9AC4", "#9FBDDA", "#CCDBEB", "#E8EEF6", "#F4F7FB"]
STOPS = [(0.00, "#000000"), (0.17, LOYEL[0]), (0.27, LOYEL[1]), (0.35, LOYEL[2]),
         (0.44, LOYEL[3]), (0.53, LOYEL[4]), (0.62, LOYEL[5]), (0.72, LOYEL[6]),
         (0.82, LOYEL[7]), (0.90, LOYEL[8]), (0.955, LOYEL[9]), (1.00, "#FFFFFF")]


def _hex(c):
    return [int(c[i:i + 2], 16) for i in (1, 3, 5)]


def build_lut():
    xs = np.linspace(0, 1, 256)
    pos = [p for p, _ in STOPS]
    cols = np.array([_hex(c) for _, c in STOPS], dtype=np.float64)
    lut = np.stack([np.interp(xs, pos, cols[:, k]) for k in range(3)], axis=1)
    # OpenCV frames are BGR-free here: we write RGB, so keep channel order RGB
    return np.clip(lut + 0.5, 0, 255).astype(np.uint8).reshape(256, 1, 3)


LUT = build_lut()


# --------------------------------------------------------------------------
# small math helpers
# --------------------------------------------------------------------------
def smoothstep(e0, e1, x):
    if e1 == e0:
        return np.where(np.asarray(x) >= e0, 1.0, 0.0) if np.ndim(x) else float(x >= e0)
    u = np.clip((np.asarray(x, dtype=np.float64) - e0) / (e1 - e0), 0.0, 1.0)
    return u * u * (3 - 2 * u)


def ease(p, kind):
    p = min(max(p, 0.0), 1.0)
    if kind == "in":
        return p ** 3
    if kind == "out":
        return 1 - (1 - p) ** 3
    if kind == "io":
        return 4 * p ** 3 if p < 0.5 else 1 - (-2 * p + 2) ** 3 / 2
    return p


def window(t, t0, t1, fin=0.0, fout=0.3):
    a = 1.0 if fin <= 0 else float(smoothstep(t0 - fin, t0, t))
    if t < t0 and fin <= 0:
        a = 0.0
    b = 1.0 - float(smoothstep(t1, t1 + fout, t))
    return a * b


class Events:
    def __init__(self, pairs):
        self.t = np.array([p[0] for p in pairs], dtype=np.float64)
        self.v = np.array([p[1] for p in pairs], dtype=np.float64)

    def env(self, t, tau, back=8):
        i = int(np.searchsorted(self.t, t, side="right"))
        s = 0.0
        for k in range(max(0, i - back), i):
            s += self.v[k] * math.exp(-(t - self.t[k]) / tau)
        return s

    def last(self, t):
        i = int(np.searchsorted(self.t, t, side="right")) - 1
        return (self.t[i], self.v[i]) if i >= 0 else (None, 0.0)


EV_KICK = Events(TL.KICKS)
EV_SNARE = Events(TL.SNARES)
EV_HAT = Events([(h[0], h[1]) for h in TL.HATS])
EV_IMPACT = Events(TL.IMPACTS)
EV_STAB = Events([(s[0], 1.0) for s in TL.STABS] + [(b[0], 0.6) for b in TL.BELLS])
EV_STAB.t, EV_STAB.v = EV_STAB.t[np.argsort(EV_STAB.t)], EV_STAB.v[np.argsort(EV_STAB.t)]
EV_HEART = Events(sorted([(t, v) for t, v in TL.HEARTBEATS] + [(t + 0.19, 0.7 * v) for t, v in TL.HEARTBEATS]))
EV_ZAP = Events(TL.ZAPS)
EV_TAIKO = Events([(x[0], x[1]) for x in TL.TAIKOS])


def in_gate(t):
    return any(a <= t < b for a, b in TL.GATES)


def section_at(t):
    for name, b0, n in TL.SECTIONS:
        if T(b0) <= t < T(b0 + n):
            return name
    return "outro"


# --------------------------------------------------------------------------
# grids & static layers
# --------------------------------------------------------------------------
H2, W2, H4, W4 = H // 2, W // 2, H // 4, W // 4
YQ, XQ = np.mgrid[0:H4, 0:W4].astype(np.float32) * 4 + 2       # quarter res, full-res units
YH, XH = np.mgrid[0:H2, 0:W2].astype(np.float32) * 2 + 1       # half res
rng0 = np.random.default_rng(7)


def ray_texture(seed, sigma, lo, hi, power):
    r = np.random.default_rng(seed).random(2048)
    r = gaussian_filter1d(r, sigma, mode="wrap")
    r = (r - r.min()) / (r.max() - r.min())
    return (np.clip((r - lo) / (hi - lo), 0, 1) ** power).astype(np.float32)


TEX1 = ray_texture(11, 5, 0.30, 0.85, 1.4)
TEX2 = ray_texture(23, 14, 0.15, 0.9, 1.0)


class RaySource:
    """Volumetric god rays from (sx, sy); geometry cached when the source is static."""

    def __init__(self, sx, sy, falloff, inner):
        self.sx, self.sy, self.falloff, self.inner = sx, sy, falloff, inner
        self._geo = None

    def geometry(self, sx, sy):
        dx, dy = XH - sx, YH - sy
        u = (np.arctan2(dy, dx) / (2 * np.pi) + 0.5) * 2048
        r = np.sqrt(dx * dx + dy * dy)
        fall = np.exp(-r / self.falloff) * np.clip((r - self.inner) / self.inner, 0, 1)
        return u.astype(np.float32), fall.astype(np.float32)

    def field(self, t, spin1=5.0, spin2=-3.0, sx=None, sy=None):
        if sx is None:
            if self._geo is None:
                self._geo = self.geometry(self.sx, self.sy)
            u, fall = self._geo
        else:
            u, fall = self.geometry(sx, sy)
        a = TEX1[np.floor(u + spin1 * t).astype(np.int64) % 2048]
        b = TEX2[np.floor(u + spin2 * t).astype(np.int64) % 2048]
        return a * (0.35 + 0.65 * b) * fall

    def at(self, x, y, t, sx, sy, spin1=5.0, spin2=-3.0):
        dx, dy = x - sx, y - sy
        u = (np.arctan2(dy, dx) / (2 * np.pi) + 0.5) * 2048
        r = np.sqrt(dx * dx + dy * dy)
        fall = np.exp(-r / self.falloff) * np.clip((r - self.inner) / self.inner, 0, 1)
        a = TEX1[np.floor(u + spin1 * t).astype(np.int64) % 2048]
        b = TEX2[np.floor(u + spin2 * t).astype(np.int64) % 2048]
        return a * (0.35 + 0.65 * b) * fall


LEAK = RaySource(250, -360, 1500, 120)
SUN_RAYS = RaySource(0, 0, 1100, 70)
WARP_RAYS = RaySource(1280, 520, 900, 40)
FINALE_RAYS = RaySource(960, 470, 1000, 40)
OUTRO_RAYS = RaySource(960, -260, 1700, 120)

# mountain silhouette for the sunrise (pure shadow)
_xs = np.arange(W, dtype=np.float64)
RIDGE = (842 + 46 * np.sin(_xs / 210 + 0.5) + 26 * np.sin(_xs / 83 + 1.7) + 11 * np.sin(_xs / 31 + 0.3)
         + 70 * np.exp(-((_xs - 1450) / 230) ** 2) - 40 * np.exp(-((_xs - 300) / 260) ** 2))
RIDGE = np.minimum(RIDGE, H - LETTERBOX - 10)
_yy = np.arange(H, dtype=np.float64)[:, None]
MOUNTAIN = np.clip((_yy - RIDGE[None, :]) / 1.5 + 0.5, 0, 1).astype(np.float32)

_vy, _vx = np.mgrid[0:H, 0:W].astype(np.float32)
_rv = np.sqrt(((_vx - W / 2) / (W / 2)) ** 2 + ((_vy - H / 2) / (H / 2)) ** 2)
VIGNETTE = (1 - 0.42 * np.clip(_rv / 1.25, 0, 1) ** 2.4).astype(np.float32)
GRAIN = [np.random.default_rng(100 + k).standard_normal((H, W)).astype(np.float32) for k in range(4)]
del _vy, _vx, _rv


# --------------------------------------------------------------------------
# frame buffers + splatting
# --------------------------------------------------------------------------
class Frame:
    def __init__(self):
        self.fine = np.zeros((H, W), np.float32)
        self.mid = np.zeros((H2, W2), np.float32)
        self.soft = np.zeros((H4, W4), np.float32)
        self.bg = np.zeros((H4, W4), np.float32)
        self.rays = np.zeros((H2, W2), np.float32)
        self.mountain = 0.0

    @staticmethod
    def _splat(buf, x, y, w):
        h, wd = buf.shape
        m = (x >= 0) & (x < wd - 1.001) & (y >= 0) & (y < h - 1.001) & (w > 1e-5)
        if not np.any(m):
            return
        x, y, w = x[m], y[m], w[m]
        x0, y0 = x.astype(np.int64), y.astype(np.int64)
        fx, fy = x - x0, y - y0
        idx = y0 * wd + x0
        ii = np.concatenate([idx, idx + 1, idx + wd, idx + wd + 1])
        ww = np.concatenate([w * (1 - fx) * (1 - fy), w * fx * (1 - fy), w * (1 - fx) * fy, w * fx * fy])
        buf += np.bincount(ii, ww, minlength=h * wd).reshape(h, wd).astype(np.float32)

    # brightness is given in "peak" units after the layer blur
    def dots(self, x, y, b, layer="fine"):
        x, y, b = np.asarray(x, np.float64), np.asarray(y, np.float64), np.asarray(b, np.float64)
        if layer == "fine":
            self._splat(self.fine, x, y, b * 9.0)
        elif layer == "mid":
            self._splat(self.mid, x / 2 - 0.5, y / 2 - 0.5, b * 25.0)
        else:
            self._splat(self.soft, x / 4 - 0.5, y / 4 - 0.5, b * 56.0)

    def blob(self, cx, cy, sigma, amp):
        if amp <= 1e-4:
            return
        r = 3.2 * sigma
        x0, x1 = max(0, int((cx - r) / 4)), min(W4, int((cx + r) / 4) + 1)
        y0, y1 = max(0, int((cy - r) / 4)), min(H4, int((cy + r) / 4) + 1)
        if x0 >= x1 or y0 >= y1:
            return
        dx = XQ[y0:y1, x0:x1] - cx
        dy = YQ[y0:y1, x0:x1] - cy
        self.bg[y0:y1, x0:x1] += amp * np.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))

    def ring(self, cx, cy, radius, width, amp, squash=1.0):
        if amp <= 1e-4:
            return
        r = np.sqrt((XH - cx) ** 2 + ((YH - cy) / squash) ** 2)
        self.rays += amp * np.exp(-((r - radius) / width) ** 2)

    def hline(self, cy, sigma_y, amp, cx=W / 2, sigma_x=900):
        if amp <= 1e-4:
            return
        self.rays += amp * np.exp(-((YH - cy) / sigma_y) ** 2) * np.exp(-np.abs(XH - cx) / sigma_x)

    def line_pts(self, P, spacing=2.0):
        """Densify a polyline (n, 2) into evenly spaced points."""
        P = np.asarray(P, np.float64)
        d = np.diff(P, axis=0)
        L = np.hypot(d[:, 0], d[:, 1])
        n = np.maximum(1, np.ceil(L / spacing)).astype(int)
        seg = np.repeat(np.arange(len(d)), n)
        frac = np.concatenate([np.arange(k) / k for k in n])
        pts = P[seg] + d[seg] * frac[:, None]
        return pts[:, 0], pts[:, 1], seg, frac


# --------------------------------------------------------------------------
# text
# --------------------------------------------------------------------------
_font_cache = {}


def font(key, size):
    k = (key, size)
    if k not in _font_cache:
        if key.startswith("sc"):
            f = ImageFont.truetype(SANS_SC, size)
            f.set_variation_by_axes([int(key[2:])])
        else:
            f = ImageFont.truetype(INTER.format(key), size)
        _font_cache[k] = f
    return _font_cache[k]


def run_width(f, text, tracking):
    return sum(f.getlength(ch) for ch in text) + tracking * max(0, len(text) - 1)


class TextItem:
    """Pre-rendered text block, animated by keyframes (t, x, y, scale, alpha, ease)."""

    def __init__(self, runs, keys, align="left", hit=None, sweep=True, glow=1.0):
        # runs: (text, font_key, size, lum, dx, dy_baseline, tracking)
        boxes = []
        for text, fk, size, lum, dx, dy, tr in runs:
            f = font(fk, size)
            asc, desc = f.getmetrics()
            wdt = run_width(f, text, tr)
            boxes.append((dx, dy - asc, dx + wdt, dy + desc))
        x0 = min(b[0] for b in boxes)
        x1 = max(b[2] for b in boxes)
        y0 = min(b[1] for b in boxes)
        y1 = max(b[3] for b in boxes)
        if align == "center":
            shift = -(x0 + x1) / 2
            boxes = [(b[0] + shift, b[1], b[2] + shift, b[3]) for b in boxes]
            x0, x1 = x0 + shift, x1 + shift
        else:
            shift = 0.0
        pad = 48
        cw, chh = int(x1 - x0 + 2 * pad), int(y1 - y0 + 2 * pad)
        img = np.zeros((chh, cw), np.float32)
        alpha = np.zeros((chh, cw), np.float32)
        for (text, fk, size, lum, dx, dy, tr) in runs:
            f = font(fk, size)
            im = Image.new("L", (cw, chh), 0)
            d = ImageDraw.Draw(im)
            x = dx + shift - x0 + pad
            yb = dy - y0 + pad
            for ch in text:
                d.text((x, yb), ch, font=f, fill=255, anchor="ls")
                x += f.getlength(ch) + tr
            m = np.asarray(im, np.float32) / 255.0
            img = np.maximum(img, m * lum)
            alpha = np.maximum(alpha, m)
        self.img, self.alpha = img, alpha
        sh = cv2.GaussianBlur(alpha, (0, 0), 13)
        self.shadow = np.clip(sh / (sh.max() + 1e-6) * 1.6, 0, 1)
        self.ox, self.oy = pad - x0, pad - y0          # anchor inside the canvas
        self.keys = keys
        self.hit = hit if hit is not None else keys[1][0]
        self.sweep = sweep
        self.glow = glow
        self.t0, self.t1 = keys[0][0], keys[-1][0]

    def state(self, t):
        ks = self.keys
        if t <= ks[0][0]:
            k = ks[0]
            return k[1], k[2], k[3], k[4]
        for a, b in zip(ks[:-1], ks[1:]):
            if t <= b[0]:
                p = ease((t - a[0]) / max(1e-6, b[0] - a[0]), b[5])
                return tuple(a[i] + (b[i] - a[i]) * p for i in range(1, 5))
        k = ks[-1]
        return k[1], k[2], k[3], k[4]

    def draw(self, L, t):
        if t < self.t0 or t > self.t1:
            return
        x, y, s, a = self.state(t)
        if a <= 0.003:
            return
        img, al, sh = self.img, self.alpha, self.shadow
        ox, oy = self.ox, self.oy
        if abs(s - 1.0) > 0.002:
            nw, nh = max(2, int(img.shape[1] * s)), max(2, int(img.shape[0] * s))
            img = cv2.resize(img, (nw, nh), interpolation=cv2.INTER_AREA if s < 1 else cv2.INTER_LINEAR)
            al = cv2.resize(al, (nw, nh), interpolation=cv2.INTER_LINEAR)
            sh = cv2.resize(sh, (nw, nh), interpolation=cv2.INTER_LINEAR)
            ox, oy = ox * s, oy * s
        gx, gy = int(round(x - ox)), int(round(y - oy))
        h, w = img.shape
        X0, Y0 = max(0, gx), max(0, gy)
        X1, Y1 = min(W, gx + w), min(H, gy + h)
        if X0 >= X1 or Y0 >= Y1:
            return
        sl = (slice(Y0 - gy, Y1 - gy), slice(X0 - gx, X1 - gx))
        im, shd = img[sl], sh[sl]
        boost = 1.0
        if t >= self.hit:
            boost += 0.9 * self.glow * math.exp(-(t - self.hit) / 0.22)
        if self.sweep and 0 <= t - self.hit <= 0.9:
            p = (t - self.hit) / 0.9
            cols = (np.arange(X0 - gx, X1 - gx, dtype=np.float32) / w)[None, :]
            rows = (np.arange(Y0 - gy, Y1 - gy, dtype=np.float32) / h)[:, None]
            c = -0.25 + 1.5 * p
            im = im * (1 + 1.3 * np.exp(-(((cols + 0.18 * rows) - c) / 0.06) ** 2))
        region = L[Y0:Y1, X0:X1]
        region *= 1 - 0.72 * a * shd
        region += a * boost * im


def slam_keys(x, y, t_in, t_out, s0=1.25, pre=0.12, fade=0.35, drift=0.012):
    return [(t_in - pre, x, y, s0, 0.0, "lin"),
            (t_in, x, y, 1.0, 1.0, "in"),
            (t_out - fade, x, y, 1.0 - drift, 1.0, "lin"),
            (t_out, x, y - 8, 1.0 - drift, 0.0, "out")]


def fade_keys(x, y, t_in, t_out, rise=14, fin=0.5, fade=0.4):
    return [(t_in, x, y + rise, 1.0, 0.0, "lin"),
            (t_in + fin, x, y, 1.0, 1.0, "out"),
            (t_out - fade, x, y, 1.0, 1.0, "lin"),
            (t_out, x, y, 1.0, 0.0, "lin")]


def build_texts():
    items = []
    X0 = 150
    # ---- intro ----------------------------------------------------------
    for t_in, t_out, cn, en in [
        (T(2), T(4, 3), "你的视网膜，是长在颅骨之外的大脑。", "Your retinas are brain tissue living outside the skull."),
        (T(5), T(7, 3.5), "而你的神经系统 —— 可以被训练。", "And your nervous system can be trained."),
    ]:
        items.append(TextItem([(cn, "sc500", 50, 1.15, 0, 0, 4), (en, "Light", 24, 0.62, 0, 50, 1)],
                              slam_keys(W / 2, 810, t_in, t_out, s0=1.12, pre=0.25), align="center",
                              hit=t_in, glow=0.6))
    # ---- title ----------------------------------------------------------
    t8 = T(8)
    items.append(TextItem([("ANDREW HUBERMAN", "ExtraBold", 124, 1.35, 0, 0, 16)],
                          slam_keys(W / 2, 530, t8, T(12) - 0.06, s0=1.6, pre=0.14, fade=0.25), align="center",
                          hit=t8, glow=1.2))
    items.append(TextItem([("神经科学 · 每天可执行的工具", "sc700", 52, 1.1, 0, 0, 10)],
                          slam_keys(W / 2, 640, T(9), T(12) - 0.06, s0=1.15, fade=0.25), align="center"))
    items.append(TextItem([("斯坦福大学神经生物学与眼科学教授  ·  Huberman Lab 主理人", "sc400", 26, 0.72, 0, 0, 3)],
                          slam_keys(W / 2, 700, T(10), T(12) - 0.06, s0=1.08, fade=0.25), align="center",
                          glow=0.5))
    # ---- chapters -------------------------------------------------------
    for name, ch in TL.CHAPTERS.items():
        b0, n = TL.SEC[name]
        t_start, t_end = T(b0), T(b0 + n) - 0.04
        f_cn = font("sc900", 120)
        cn_w = run_width(f_cn, ch["cn"], 6)
        items.append(TextItem([(f"{ch['num']} / 05", "Medium", 26, 0.75, 0, 0, 7),
                               (ch["cn"], "sc900", 120, 1.3, 0, 138, 6),
                               (ch["en"], "Light", 52, 0.92, cn_w + 34, 138, 14)],
                              slam_keys(X0, 196, t_start, t_end, s0=1.35, pre=0.12), hit=t_start, glow=1.1))
        items.append(TextItem([(ch["sub"], "sc500", 40, 0.98, 0, 0, 4)],
                              slam_keys(X0, 410, T(b0, 2), t_end, s0=1.1), glow=0.5))
        for k, (cn, en) in enumerate(ch["lines"]):
            t_in = T(b0 + 2 + 2 * k)
            yb = 560 + 128 * k
            items.append(TextItem([(cn, "sc500", 42, 1.18, 0, 0, 2), (en, "Regular", 22, 0.62, 0, 40, 0.5)],
                                  slam_keys(X0, yb, t_in, t_end, s0=1.14), hit=t_in))
    # breath phase labels under the sphere
    labels = {"in1": "吸气  ·  INHALE", "in2": "再吸一口  ·  TOP-UP", "out": "长长呼气  ·  EXHALE"}
    for t0, kind, dur in TL.BREATHS:
        items.append(TextItem([(labels[kind], "sc500", 30, 0.95, 0, 0, 6)],
                              fade_keys(1450, 880, t0, t0 + dur, rise=10, fin=0.18, fade=0.15),
                              align="center", hit=t0, sweep=False, glow=0.4))
    # dopamine graph labels
    items.append(TextItem([("基线  BASELINE", "sc400", 20, 0.55, 0, 0, 4)],
                          fade_keys(GX1 - 175, GB + 34, T(29), T(36) - 0.04), sweep=False, glow=0.2))
    items.append(TextItem([("冷水暴露  COLD", "sc500", 22, 0.8, 0, 0, 4)],
                          fade_keys(gx_of(4.3), GB + 108, T(32), T(36) - 0.04), sweep=False, glow=0.4))
    items.append(TextItem([("≈ 2.5×", "Bold", 46, 1.2, 0, 0, 2)],
                          slam_keys(gx_of(6.1), GB - 1.5 * GS - 42, T(33, 2), T(36) - 0.04, s0=1.4), hit=T(33, 2)))
    # ---- finale: six words slam in, then line up -------------------------
    widths = [run_width(font("sc900", 170), cn, 10) * 0.42 for cn, _ in TL.FINALE_WORDS]
    gap = 78
    left = W / 2 - (sum(widths) + gap * (len(widths) - 1)) / 2
    for i, (cn, en) in enumerate(TL.FINALE_WORDS):
        t_in = TL.FINALE_SLAMS[i]
        slot_x = left + sum(widths[:i]) + gap * i + widths[i] / 2
        keys = [(t_in - 0.12, W / 2, 520, 1.6, 0.0, "lin"),
                (t_in, W / 2, 520, 1.0, 1.0, "in"),
                (t_in + 0.72 * BAR, W / 2, 516, 0.97, 1.0, "lin"),
                (t_in + 0.72 * BAR + 0.3, slot_x, 300, 0.42, 0.95, "io"),
                (T(60) - 0.3, slot_x, 300, 0.42, 0.95, "lin"),
                (T(60) - 0.04, slot_x, 292, 0.42, 0.0, "out")]
        items.append(TextItem([(cn, "sc900", 170, 1.35, 0, 0, 10), (en, "Medium", 30, 0.8, 0, 66, 12)],
                              keys, align="center", hit=t_in, glow=1.2))
    for t_in, cn, en, yb, sz in [
        (T(58), "你的神经系统，可以被你亲手重塑。", "Your nervous system is changeable  ·  by you.", 690, 64),
        (T(59), "从明天的第一缕晨光开始。", "Start with tomorrow's first light.", 830, 50),
    ]:
        items.append(TextItem([(cn, "sc700", sz, 1.25, 0, 0, 4), (en, "Light", 26, 0.7, 0, 50, 2)],
                              slam_keys(W / 2, yb, t_in, T(60) - 0.04, s0=1.2), align="center", hit=t_in))
    # ---- outro card ------------------------------------------------------
    t60, tend = T(60), TL.DURATION - 1.2
    items.append(TextItem([("ANDREW HUBERMAN", "Bold", 64, 1.2, 0, 0, 16)],
                          slam_keys(W / 2, 470, t60, tend, s0=1.3, fade=1.2), align="center", hit=t60))
    items.append(TextItem([("Science-based tools for everyday life", "LightItalic", 32, 0.88, 0, 0, 3)],
                          fade_keys(W / 2, 530, t60 + 0.6, tend, fin=0.9, fade=1.2), align="center", sweep=False))
    items.append(TextItem([("致敬  ·  本片整理自 Huberman Lab 公开节目及所引研究的核心观点", "sc400", 25, 0.74, 0, 0, 3)],
                          fade_keys(W / 2, 650, T(61), tend, fin=0.9, fade=1.2), align="center", sweep=False))
    items.append(TextItem([("部分建议的证据等级不一，请批判性地使用；不构成医疗建议", "sc400", 22, 0.6, 0, 0, 3)],
                          fade_keys(W / 2, 698, T(61, 2), tend, fin=0.9, fade=1.2), align="center", sweep=False))
    return items


# --------------------------------------------------------------------------
# particle sets (seeded, stateless)
# --------------------------------------------------------------------------
R = np.random.default_rng(2026)

# ambient dust with depth
NA = 1800
A_x0, A_y0 = R.uniform(0, W + 200, NA), R.uniform(0, H + 200, NA)
A_d = R.uniform(0.25, 1.7, NA)
A_ph, A_om = R.uniform(0, 2 * np.pi, NA), R.uniform(0.5, 2.0, NA)
A_b = R.uniform(0.35, 1.0, NA) ** 1.5
VEL_KEYS = [(0, 3, -5), (T(8), 0, -14), (T(12), 5, -30), (T(20), 0, -7), (T(28), 9, -12),
            (T(36), 0, -5), (T(44), 0, -5), (T(52), 0, -20), (T(60), 0, -10), (TL.DURATION, 0, -6)]
_tg = np.arange(0, TL.DURATION + 1, 0.01)
_vx = np.interp(_tg, [k[0] for k in VEL_KEYS], [k[1] for k in VEL_KEYS])
_vy = np.interp(_tg, [k[0] for k in VEL_KEYS], [k[2] for k in VEL_KEYS])
FXI, FYI = np.cumsum(_vx) * 0.01, np.cumsum(_vy) * 0.01

# intro gathering / title explosion
NG = 2600
G_r0 = 240 + 900 * R.random(NG) ** 0.8
G_th0 = R.uniform(0, 2 * np.pi, NG)
G_spin = R.choice([-1.0, 1.0], NG) * R.uniform(0.6, 1.4, NG)
G_b = R.uniform(0.35, 1.0, NG)
G_v = R.uniform(200, 1500, NG) ** 1.0
CENTER = (W / 2, 470)

# breath sphere (Fibonacci)
NS = 2600
_i = np.arange(NS) + 0.5
_phi = np.arccos(1 - 2 * _i / NS)
_th = np.pi * (1 + 5 ** 0.5) * _i
SPH = np.stack([np.cos(_th) * np.sin(_phi), np.cos(_phi), np.sin(_th) * np.sin(_phi)], 1)
SPH_n = R.random(NS)
BREATH_C = (1450, 500)

# dopamine graph
GX0, GX1, GB, GS = 1180, 1800, 760, 110
S_FROM, S_TO = 1.0, 7.6


def gx_of(s):
    return GX0 + (s - S_FROM) / (S_TO - S_FROM) * (GX1 - GX0)


DOPA_PEAKS_LOCAL = [(tp - T(28)) / BAR for tp in TL.DOPA_PEAKS]


def dopa_value(s):
    s = np.asarray(s, np.float64)
    v = 1.0 + 0.035 * np.sin(9 * s) + 0.02 * np.sin(23 * s)
    for sp in DOPA_PEAKS_LOCAL:
        d = s - sp
        v = v + np.where(d >= 0, 1.55 * np.exp(-d / 0.07), 1.55 * np.exp(d / 0.012))
    v = v - 0.55 * smoothstep(2.0, 3.9, s) * (1 - smoothstep(4.0, 4.9, s))
    v = v + 1.5 * smoothstep(4.0, 5.9, s)
    return v


BURST_N = 140
BURST_DIR = R.uniform(-np.pi, 0.0, (len(TL.DOPA_PEAKS), BURST_N))
BURST_V = R.uniform(80, 420, (len(TL.DOPA_PEAKS), BURST_N))
SNOW_N = 520
SN_x, SN_y, SN_sp, SN_ph = R.uniform(0, W, SNOW_N), R.uniform(0, H, SNOW_N), R.uniform(30, 90, SNOW_N), R.uniform(0, 6.3, SNOW_N)

# focus vortex + neural network
NV = 3200
V_u, V_th0, V_b = R.random(NV), R.uniform(0, 2 * np.pi, NV), R.uniform(0.35, 1.0, NV)
FOCUS_C = (1450, 540)


def _k_focus(t):
    return np.interp(t, [T(36), T(42), T(43, 3), T(44)], [0.16, 0.2, 1.3, 2.4])


_kf = _k_focus(_tg)
KFI = np.cumsum(_kf) * 0.01

nodes = []
_r = np.random.default_rng(99)
while len(nodes) < 64:
    a, rr = _r.uniform(0, 2 * np.pi), np.sqrt(_r.random())
    p = (FOCUS_C[0] + 420 * rr * np.cos(a), FOCUS_C[1] + 330 * rr * np.sin(a))
    if all((p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 > 62 ** 2 for q in nodes):
        nodes.append(p)
NODES = np.array(nodes)
_d = np.hypot(NODES[:, None, 0] - NODES[None, :, 0], NODES[:, None, 1] - NODES[None, :, 1])
EDGES = set()
for i in range(len(NODES)):
    for j in np.argsort(_d[i])[1:4]:
        EDGES.add((min(i, j), max(i, j)))
EDGES = sorted(EDGES)
LONG_EDGES = []
while len(LONG_EDGES) < 14:
    i, j = _r.integers(0, len(NODES), 2)
    if 240 < _d[i, j] < 520 and (min(i, j), max(i, j)) not in EDGES:
        LONG_EDGES.append((min(i, j), max(i, j)))


def _edge_points(edges):
    xs, ys, ids = [], [], []
    for k, (i, j) in enumerate(edges):
        a, b = NODES[i], NODES[j]
        n = max(2, int(np.hypot(*(b - a)) / 2.5))
        f = np.linspace(0, 1, n)
        xs.append(a[0] + (b[0] - a[0]) * f)
        ys.append(a[1] + (b[1] - a[1]) * f)
        ids.append(np.full(n, k))
    return np.concatenate(xs), np.concatenate(ys), np.concatenate(ids)


EP = _edge_points(EDGES)
LEP = _edge_points(LONG_EDGES)
PULSES = []
for (th, v, _o) in TL.HATS:
    if T(40) <= th < T(43, 3):
        for _ in range(2):
            e = int(_r.integers(0, len(EDGES)))
            PULSES.append((th, e, bool(_r.integers(0, 2))))
for (ts, v) in TL.SNARES:
    if T(42) <= ts < T(43, 3):
        e = int(_r.integers(0, len(LONG_EDGES)))
        PULSES.append((ts, -1 - e, bool(_r.integers(0, 2))))
PULSE_T = np.array([p[0] for p in PULSES])

# warp starfield
NW = 2400
WS_x, WS_y = R.uniform(-1, 1, NW), R.uniform(-1, 1, NW)
WS_z0, WS_b = R.random(NW), R.uniform(0.5, 1.0, NW)


def _warp_speed(t):
    base = np.interp(t, [T(43, 3), T(44), T(52), T(60), T(61)], [0.0, 1.0, 1.0, 0.55, 0.05])
    return base


_ws = np.array([_warp_speed(x) * (1 + 0.9 * EV_KICK.env(x, 0.12)) for x in _tg])
WZI = np.cumsum(_ws) * 0.01


def integ(arr, t):
    return float(np.interp(t, _tg, arr))


# finale burst particles from each slam
FB_N = 260
FB_dir = R.uniform(0, 2 * np.pi, (len(TL.FINALE_SLAMS) + 1, FB_N))
FB_v = R.uniform(120, 900, (len(TL.FINALE_SLAMS) + 1, FB_N))


# --------------------------------------------------------------------------
# scenes
# --------------------------------------------------------------------------
def ambient(fr, t, level, lit=None):
    if level <= 0.01:
        return
    x = (A_x0 + integ(FXI, t) * A_d + 16 * np.sin(0.33 * A_om * t + A_ph)) % (W + 200) - 100
    y = (A_y0 + integ(FYI, t) * A_d + 11 * np.cos(0.29 * A_om * t + 1.3 * A_ph)) % (H + 200) - 100
    b = A_b * (0.55 + 0.45 * np.sin(2.1 * A_om * t + 3 * A_ph)) * level
    b = b * (1 + 0.5 * EV_KICK.env(t, 0.12))
    if lit is not None:
        b = b * lit(x, y)
    f, m, s = A_d < 0.7, (A_d >= 0.7) & (A_d < 1.25), A_d >= 1.25
    fr.dots(x[f], y[f], b[f] * 0.42, "fine")
    fr.dots(x[m], y[m], b[m] * 0.30, "mid")
    fr.dots(x[s], y[s], b[s] * 0.20, "soft")


def scene_intro(fr, t):
    cx, cy = CENTER
    heart = EV_HEART.env(t, 0.13)
    p = float(smoothstep(T(3), T(7, 3.5), t))
    pp = p * p
    if t < T(8):
        r = G_r0 * (1 - 0.95 * pp)
        if in_gate(t):
            r = r * (1 - 0.6 * (t - T(7, 3.5)) / (T(8) - T(7, 3.5)))
        th = G_th0 + 0.05 * t * G_spin + 3.2 * pp * G_spin
        lvl = 0.32 * float(smoothstep(0.8, T(3), t)) + 1.1 * pp
        lvl *= 1 + 0.35 * heart
        x, y = cx + r * np.cos(th), cy + r * np.sin(th) * 0.62
        dense = 1 - 0.82 * pp * pp
        fr.dots(x, y, G_b * lvl * 0.5 * dense, "fine")
        fr.dots(x[::5], y[::5], G_b[::5] * lvl * 0.25 * dense, "mid")
        seed = (0.35 + 1.6 * heart + 2.2 * pp) * float(smoothstep(0.0, 1.2, t))
        fr.dots([cx], [cy], [seed * 1.6], "fine")
        fr.dots([cx], [cy], [seed * 0.8], "mid")
        fr.blob(cx, cy, 26 + 16 * heart, 0.35 * seed)
        fr.blob(cx, cy, 160 + 120 * pp, 0.05 + 0.10 * heart + 0.22 * pp)
        fr.hline(cy, 2.5 + 3 * pp, 0.05 * heart + 0.35 * pp * pp, cx=cx, sigma_x=300 + 600 * pp)


def scene_title(fr, t):
    t0 = T(8)
    if not (t0 <= t < T(12) + 0.3):
        return
    cx, cy = CENTER
    dt = t - t0
    fade = 1 - float(smoothstep(T(11), T(12) + 0.2, t))
    e = 1 - math.exp(-dt / 0.5)
    r_end = G_r0 * 0.05
    th = G_th0 + 3.2 * G_spin + 0.05 * t * G_spin
    b = G_b * (1.8 * math.exp(-dt / 0.7) + 0.35 * math.exp(-dt / 3.5)) * fade
    for k in range(4):
        rk = r_end + G_v * (1 - math.exp(-max(0.0, dt - 0.012 * k) / 0.5)) * (1 + 0.08 * dt)
        x, y = cx + rk * np.cos(th), cy + rk * np.sin(th) * 0.7
        fr.dots(x, y, b * (0.5 - 0.1 * k), "fine")
    rk = r_end + G_v * e * (1 + 0.08 * dt)
    fr.dots((cx + rk * np.cos(th))[::4], (cy + rk * np.sin(th) * 0.7)[::4], b[::4] * 0.25, "mid")
    fr.blob(cx, cy, 300, 0.10 * fade)
    fr.rays += 0.10 * fade * LEAK.field(t)


def scene_light(fr, t):
    t0, t1 = T(12), T(20)
    w = window(t, t0, t1, 0, 0.25)
    if w <= 0:
        return None
    dt = t - t0
    rise = float(1 - (1 - smoothstep(0, 2.6 * BAR, dt)) ** 3)
    sx = 1450
    sy = 1010 - 420 * rise - 30 * float(smoothstep(2.6 * BAR, 8 * BAR, dt))
    sn = EV_SNARE.env(t, 0.16)
    fr.bg += w * (0.05 + 0.11 * rise) * np.exp(-((YQ - 850) / 260) ** 2) * np.exp(-((XQ - sx) / 750) ** 2)
    fr.blob(sx, sy, 34, w * 2.4)
    fr.blob(sx, sy, 130, w * 0.5)
    fr.blob(sx, sy, 420, w * 0.14)
    fr.rays += w * (0.62 + 0.18 * sn) * (0.35 + 0.65 * rise) * SUN_RAYS.field(t, 4.0, -2.5, sx, sy)
    fr.hline(sy, 2.5, w * 0.35 * (0.4 + 0.6 * rise), cx=sx, sigma_x=700)
    # rim light on the ridge
    xs = np.arange(0, W, 1.0)
    rim = w * 1.1 * np.exp(-((xs - sx) / 300) ** 2) * (0.35 + 0.65 * rise)
    fr.dots(xs, RIDGE - 1.0, rim * 0.55, "fine")
    fr.mountain = w
    return lambda x, y: 0.3 + 3.2 * SUN_RAYS.at(x, y, t, sx, sy, 4.0, -2.5) * (y < np.interp(x, _xs, RIDGE))


def breath_level(t):
    for t0, kind, dur in TL.BREATHS:
        if t0 <= t < t0 + dur:
            p = (t - t0) / dur
            if kind == "in1":
                return 0.62 * ease(p, "io"), kind, p
            if kind == "in2":
                return 0.62 + 0.38 * ease(p, "out"), kind, p
            return 1.0 - ease(p, "io"), kind, p
    idle = 0.05 * (1 - math.cos(2 * math.pi * (t - T(20)) / 3.2)) / 2
    return idle, None, 0.0


def scene_breath(fr, t):
    t0, t1 = T(20), T(28)
    w = window(t, t0, t1, 0, 0.25)
    if w <= 0:
        return
    b, kind, p = breath_level(t)
    cx, cy = BREATH_C
    Rr = 175 * (1 + 0.55 * b)
    scat = 0.0
    if kind == "out":
        scat = math.sin(math.pi * min(1.0, p * 1.3)) * 0.45
    ang, tilt = 0.3 * (t - t0) + 0.7 * b, 0.42
    v = SPH
    ca, sa = math.cos(ang), math.sin(ang)
    x1 = v[:, 0] * ca + v[:, 2] * sa
    z1 = -v[:, 0] * sa + v[:, 2] * ca
    ct, st = math.cos(tilt), math.sin(tilt)
    y2 = v[:, 1] * ct - z1 * st
    z2 = v[:, 1] * st + z1 * ct
    rad = Rr * (1 + scat * SPH_n)
    X, Y, Z = x1 * rad, y2 * rad, z2 * rad
    per = 1000 / (1000 + Z)
    px, py = cx + X * per, cy + Y * per
    front = 0.25 + 0.75 * (0.5 - 0.5 * z2)
    br = w * (0.35 + 0.95 * b) * front * (1 - 0.5 * scat * SPH_n)
    fr.dots(px, py, br * 0.8, "fine")
    fr.dots(px[::6], py[::6], br[::6] * 0.4, "mid")
    fr.blob(cx, cy, Rr * 0.75, w * (0.08 + 0.30 * b))
    fr.blob(cx, cy, 30, w * (0.3 + 0.9 * b))
    fr.ring(cx, cy, Rr * 1.32, 2.5, w * (0.05 + 0.22 * b))
    fr.rays += w * 0.12 * LEAK.field(t)


def scene_dopamine(fr, t):
    t0, t1 = T(28), T(36)
    w = window(t, t0, t1, 0, 0.25)
    if w <= 0:
        return
    s_now = (t - t0) / BAR
    # dashed baseline
    xs = np.arange(GX0, GX1, 3.0)
    dash = ((xs - GX0) // 12) % 2 == 0
    fr.dots(xs[dash], np.full(dash.sum(), GB), np.full(dash.sum(), w * 0.22 * float(smoothstep(0.6, 1.2, s_now))), "fine")
    if s_now > S_FROM:
        s = np.linspace(S_FROM, min(s_now, S_TO), int(60 + 900 * min(1, (s_now - S_FROM) / (S_TO - S_FROM))))
        P = np.stack([gx_of(s), GB - (dopa_value(s) - 1.0) * GS], 1)
        x, y, seg, frac = fr.line_pts(P, 1.6)
        age = (min(s_now, S_TO) - (s[seg] + (s[np.minimum(seg + 1, len(s) - 1)] - s[seg]) * frac))
        bri = w * (0.55 + 0.65 * np.exp(-age / 0.35))
        fr.dots(x, y, bri * 0.7, "fine")
        fr.dots(x[::3], y[::3], bri[::3] * 0.25, "mid")
        hx, hy = P[-1]
        if s_now <= S_TO + 0.05:
            fr.dots([hx], [hy], [w * 2.2], "fine")
            fr.blob(hx, hy, 22, w * 0.6)
    # spike bursts
    for k, tp in enumerate(TL.DOPA_PEAKS):
        dt = t - tp
        if 0 <= dt < 1.6:
            sp = DOPA_PEAKS_LOCAL[k]
            ox, oy = gx_of(sp), GB - (dopa_value(sp + 0.001) - 1.0) * GS
            rr = BURST_V[k] * (1 - math.exp(-dt / 0.3))
            bx = ox + rr * np.cos(BURST_DIR[k])
            by = oy + rr * np.sin(BURST_DIR[k]) + 40 * dt * dt
            fr.dots(bx, by, np.full(BURST_N, w * 1.3 * math.exp(-dt / 0.45)), "fine")
            fr.blob(ox, oy, 60, w * 0.5 * math.exp(-dt / 0.25))
    # cold: falling frost
    cold = float(smoothstep(4.0, 4.7, s_now)) * w
    if cold > 0:
        y = (SN_y + SN_sp * t) % (H + 40) - 20
        x = SN_x + 18 * np.sin(0.8 * t + SN_ph)
        fr.dots(x, y, np.full(SNOW_N, cold * 0.5) * (0.6 + 0.4 * np.sin(3 * t + SN_ph)), "fine")
        fr.dots(x[::3], y[::3], np.full(len(x[::3]), cold * 0.2), "mid")
    plateau = float(smoothstep(5.0, 6.0, s_now))
    if plateau > 0:
        fr.blob(gx_of(6.6), GB - 1.5 * GS, 240, w * 0.10 * plateau)
    fr.rays += w * 0.1 * LEAK.field(t)


def scene_focus(fr, t):
    t0, t1 = T(36), T(44)
    w = window(t, t0, t1, 0, 0.06)
    if w <= 0:
        return
    cx, cy = FOCUS_C
    K = integ(KFI, t)
    net = float(smoothstep(T(39, 3), T(40), t))
    build = float(smoothstep(T(42), T(43, 3), t))
    gate = in_gate(t)
    ph = (V_u + K) % 1.0
    rmax = 980 * (0.3 if gate else 1.0)
    vort = w * (1.0 - 0.45 * net + 0.9 * build)
    for k in range(3):
        phk = np.clip(ph - 0.006 * k, 0, 1)
        r = rmax * (1 - phk) ** 1.1
        th = V_th0 + 6.0 * phk ** 1.6 + 0.35 * t
        x, y = cx + r * np.cos(th), cy + r * np.sin(th) * 0.8
        edge = smoothstep(0, 0.08, phk) * (1 - smoothstep(0.97, 1.0, phk))
        bb = V_b * (0.12 + 1.0 * phk ** 2) * edge * vort * (1 - 0.3 * k)
        fr.dots(x, y, bb * 0.5, "fine")
    fr.blob(cx, cy, 16 + 20 * build, w * (0.9 + 2.5 * build))
    fr.blob(cx, cy, 120 + 200 * build, w * (0.08 + 0.3 * build))
    if net > 0 and not gate:
        hat = EV_HAT.env(t, 0.06)
        ex, ey, eid = EP
        fr.dots(ex, ey, np.full(len(ex), w * net * (0.16 + 0.08 * hat)), "fine")
        rew = float(smoothstep(T(42), T(42, 2), t))
        if rew > 0:
            lx, ly, _ = LEP
            fr.dots(lx, ly, np.full(len(lx), w * rew * (0.14 + 0.22 * EV_SNARE.env(t, 0.1))), "fine")
        nb = np.full(len(NODES), 0.55)
        i1 = int(np.searchsorted(PULSE_T, t, side="right"))
        for (tp, e, rev) in PULSES[max(0, i1 - 60):i1]:
            dt = t - tp
            if dt < 0 or dt > 0.6:
                continue
            if e >= 0:
                a, bnode = EDGES[e]
            else:
                a, bnode = LONG_EDGES[-1 - e]
            if rev:
                a, bnode = bnode, a
            pa, pb = NODES[a], NODES[bnode]
            q = min(1.0, dt / 0.3)
            for j in range(6):
                qj = max(0.0, q - 0.04 * j)
                fr.dots([pa[0] + (pb[0] - pa[0]) * qj], [pa[1] + (pb[1] - pa[1]) * qj],
                        [w * net * 1.4 * (1 - j / 6) * (1 if q < 1 else math.exp(-(dt - 0.3) / 0.1))], "fine")
            if dt >= 0.3:
                nb[bnode] += 1.6 * math.exp(-(dt - 0.3) / 0.15)
        fr.dots(NODES[:, 0], NODES[:, 1], w * net * nb * 1.2, "fine")
        fr.dots(NODES[:, 0], NODES[:, 1], w * net * nb * 0.35, "mid")
    fr.rays += w * 0.08 * LEAK.field(t)


def scene_warp(fr, t):
    if t < T(43, 3) or t > T(61):
        return
    if t < T(52):
        cx, cy, lvl = 1280, 520, 1.0
        rays = WARP_RAYS
    else:
        cx, cy = CENTER
        lvl = 0.5 * (1 - float(smoothstep(T(60), T(60.6), t)))
        rays = FINALE_RAYS
    if t < T(44):
        return
    Z = integ(WZI, t)
    spd = _warp_speed(t) * (1 + 0.9 * EV_KICK.env(t, 0.12))
    D = 0.035 + ((WS_z0 - 0.3 * Z) % 1.0) * 0.965
    dD = 0.3 * spd * 0.1
    near = np.clip(0.06 / D, 0, 1.6) * (1 - smoothstep(0.7, 1.0, D)) * WS_b * lvl
    hx, hy = cx + 300 * WS_x / D, cy + 186 * WS_y / D
    tx, ty = cx + 300 * WS_x / (D + dD), cy + 186 * WS_y / (D + dD)
    n = np.clip(np.ceil(np.hypot(hx - tx, hy - ty) / 2.0), 1, 220).astype(int)
    idx = np.repeat(np.arange(NW), n)
    frac = np.concatenate([np.arange(k) / k for k in n])
    fr.dots(hx[idx] + (tx - hx)[idx] * frac, hy[idx] + (ty - hy)[idx] * frac,
            near[idx] * (1 - frac) ** 1.5 * 0.8, "fine")
    sn = EV_SNARE.env(t, 0.14)
    fr.blob(cx, cy, 26, lvl * (1.3 + 0.8 * sn))
    fr.blob(cx, cy, 180, lvl * (0.18 + 0.12 * sn))
    fr.rays += lvl * (0.22 + 0.25 * sn) * rays.field(t, 9.0, -6.0)
    fr.hline(cy, 2.0, lvl * (0.18 + 0.4 * sn), cx=cx, sigma_x=1100)


def scene_finale(fr, t):
    t0, t1 = T(52), T(60)
    w = window(t, t0, t1, 0, 0.1)
    if w <= 0:
        return
    cx, cy = CENTER
    for k, ts in enumerate(TL.FINALE_SLAMS):
        dt = t - ts
        if 0 <= dt < 2.0:
            rr = FB_v[k] * (1 - math.exp(-dt / 0.35))
            x = cx + rr * np.cos(FB_dir[k])
            y = cy + 50 + rr * np.sin(FB_dir[k]) * 0.6
            fr.dots(x, y, np.full(FB_N, w * 1.1 * math.exp(-dt / 0.6)), "fine")
    fr.rays += w * 0.08 * LEAK.field(t)


def scene_outro(fr, t):
    t0 = T(60)
    if t < t0:
        return
    dt = t - t0
    end = 1 - float(smoothstep(TL.DURATION - 4.5, TL.DURATION - 0.6, t))
    cx, cy = CENTER
    k = len(TL.FINALE_SLAMS)
    rr = FB_v[k] * 1.4 * (1 - math.exp(-dt / 0.6))
    x = cx + rr * np.cos(FB_dir[k])
    y = cy + rr * np.sin(FB_dir[k]) * 0.6 - 12 * dt
    fr.dots(x, y, np.full(FB_N, 1.2 * math.exp(-dt / 1.5) + 0.15 * end), "fine")
    fr.blob(cx, 470, 260, 0.12 * end)
    fr.rays += 0.42 * end * OUTRO_RAYS.field(t, 2.0, -1.5)


def impact_fx(fr, t):
    focus = {"title": CENTER, "light": (1450, 640), "breath": BREATH_C, "dopamine": (1450, 650),
             "focus": FOCUS_C, "courage": (1280, 520), "finale": CENTER, "outro": CENTER}
    i = int(np.searchsorted(EV_IMPACT.t, t, side="right"))
    flash = 0.0
    for k in range(max(0, i - 3), i):
        ti, s = EV_IMPACT.t[k], EV_IMPACT.v[k]
        dt = t - ti
        if dt > 1.6:
            continue
        cx, cy = focus.get(section_at(ti + 0.01), CENTER)
        Rr = 40 + 1500 * (1 - math.exp(-dt / 0.45))
        fr.ring(cx, cy, Rr, 10 + 60 * dt, 0.5 * s * math.exp(-dt / 0.33), squash=0.8)
        fr.hline(cy, 3 + 5 * dt, 0.9 * s * math.exp(-dt / 0.4), cx=cx, sigma_x=1200)
        flash += 0.95 * s * math.exp(-dt / 0.085)
    # small flashes for text stabs
    ts, v = EV_STAB.last(t)
    if ts is not None and t - ts < 0.5:
        flash += 0.10 * v * math.exp(-(t - ts) / 0.09)
    return flash


# --------------------------------------------------------------------------
# frame assembly
# --------------------------------------------------------------------------
TEXTS = None


def tone(L):
    knee = 0.8
    hi = L > knee
    v = L.copy()
    v[hi] = knee + (1 - knee) * (1 - np.exp(-(L[hi] - knee) / (1 - knee)))
    return v


def camera(t):
    imp = 0.0
    i = int(np.searchsorted(EV_IMPACT.t, t, side="right"))
    for k in range(max(0, i - 2), i):
        imp += EV_IMPACT.v[k] * math.exp(-(t - EV_IMPACT.t[k]) / 0.35)
    sec = section_at(t)
    drive = 1.0 if sec in ("courage", "finale") else (0.5 if sec in ("light", "dopamine", "focus") else 0.15)
    kick = EV_KICK.env(t, 0.1) * drive
    build = float(smoothstep(T(42), T(43, 3), t)) * (0 if in_gate(t) else 1)
    amp = 14 * imp + 3.0 * kick + 5 * build
    sx = amp * (math.sin(41 * t) + 0.5 * math.sin(97 * t + 1.3))
    sy = amp * (math.cos(37 * t + 0.4) + 0.5 * math.sin(83 * t + 2.1)) * 0.7
    b0, n = TL.SEC.get(sec, (60, 4))
    prog = (t - T(b0)) / (n * BAR)
    zoom = 1 + 0.03 * imp + 0.006 * kick + 0.025 * prog + 0.06 * build
    return sx, sy, zoom


def render_frame(t):
    global TEXTS
    if TEXTS is None:
        TEXTS = build_texts()
    fr = Frame()
    sec = section_at(t)
    lit = None
    scene_intro(fr, t)
    scene_title(fr, t)
    r = scene_light(fr, t)
    if r is not None:
        lit = r
    scene_breath(fr, t)
    scene_dopamine(fr, t)
    scene_focus(fr, t)
    scene_warp(fr, t)
    scene_finale(fr, t)
    scene_outro(fr, t)
    amb = {"intro": 0.35 * float(smoothstep(1.0, T(4), t)), "title": 0.8, "light": 0.95, "breath": 0.6,
           "dopamine": 0.7, "focus": 0.35, "courage": 0.12, "finale": 0.45, "outro": 0.55}[sec]
    if sec == "breath":
        amb *= 0.7 + 0.6 * breath_level(t)[0]
    ambient(fr, t, amb, lit)
    flash = impact_fx(fr, t)

    L = cv2.GaussianBlur(fr.fine, (0, 0), 1.15)
    L += cv2.resize(cv2.GaussianBlur(fr.mid, (0, 0), 2.0), (W, H), interpolation=cv2.INTER_LINEAR)
    L += cv2.resize(cv2.GaussianBlur(fr.soft, (0, 0), 3.0), (W, H), interpolation=cv2.INTER_LINEAR)
    L += cv2.resize(fr.bg, (W, H), interpolation=cv2.INTER_LINEAR)
    L += cv2.resize(fr.rays, (W, H), interpolation=cv2.INTER_LINEAR)
    L += 0.025  # faint atmosphere so shadows read as deep navy, not dead black
    if fr.mountain > 0:
        L *= 1 - 0.985 * fr.mountain * MOUNTAIN
    for it in TEXTS:
        it.draw(L, t)

    sx, sy, zoom = camera(t)
    if abs(zoom - 1) > 1e-4 or abs(sx) + abs(sy) > 0.05:
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, zoom)
        M[0, 2] += sx
        M[1, 2] += sy
        L = cv2.warpAffine(L, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    small = cv2.resize(L, (W4, H4), interpolation=cv2.INTER_AREA)
    bright = np.maximum(small - 0.35, 0)
    b1 = cv2.GaussianBlur(bright, (0, 0), 5)
    b2 = cv2.GaussianBlur(cv2.resize(bright, (W // 16, H // 16), interpolation=cv2.INTER_AREA), (0, 0), 4)
    bloom = 0.55 * b1 + 0.5 * cv2.resize(b2, (W4, H4), interpolation=cv2.INTER_LINEAR)
    L += cv2.resize(bloom, (W, H), interpolation=cv2.INTER_LINEAR)

    L *= VIGNETTE
    L += flash
    if in_gate(t):
        L *= 0.35
    L *= float(smoothstep(0.0, 1.4, t)) * (1 - float(smoothstep(TL.DURATION - 2.6, TL.DURATION - 0.2, t)))
    v = tone(np.maximum(L, 0))
    v += GRAIN[int(t * FPS) % 4] * 0.006
    v8 = np.clip(v * 255 + 0.5, 0, 255).astype(np.uint8)
    rgb = cv2.LUT(cv2.merge([v8, v8, v8]), LUT)
    rgb[:LETTERBOX] = 0
    rgb[H - LETTERBOX:] = 0
    return rgb


# --------------------------------------------------------------------------
# entry points
# --------------------------------------------------------------------------
def worker(f0, f1, out):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
           "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-tune", "film",
           "-pix_fmt", "yuv420p", "-x264-params", "keyint=60:min-keyint=30", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(f0, f1):
        p.stdin.write(render_frame(f / FPS).tobytes())
        if (f - f0) % 150 == 0:
            print(f"  [{os.path.basename(out)}] frame {f}/{f1}", flush=True)
    p.stdin.close()
    p.wait()


def main():
    mode = sys.argv[1]
    os.makedirs(os.path.join(HERE, "build"), exist_ok=True)
    if mode == "stills":
        os.makedirs(os.path.join(HERE, "build", "stills"), exist_ok=True)
        for a in sys.argv[2:]:
            t = float(a)
            Image.fromarray(render_frame(t)).save(os.path.join(HERE, "build", "stills", f"t{t:06.2f}.png"))
            print("still", t)
        return
    audio, out = sys.argv[2], sys.argv[3]
    workers = int(sys.argv[4]) if len(sys.argv) > 4 else os.cpu_count()
    bounds = np.linspace(0, NF, workers + 1).astype(int)
    segs = [os.path.join(HERE, "build", f"seg{k:02d}.mp4") for k in range(workers)]
    procs = [Process(target=worker, args=(bounds[k], bounds[k + 1], segs[k])) for k in range(workers)]
    for p in procs:
        p.start()
    for p in procs:
        p.join()
    if any(p.exitcode != 0 for p in procs):
        sys.exit("a render worker failed")
    lst = os.path.join(HERE, "build", "segments.txt")
    with open(lst, "w") as fh:
        fh.writelines(f"file '{s}'\n" for s in segs)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-i", audio, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-movflags", "+faststart", "-t", f"{TL.DURATION:.3f}", out], check=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
