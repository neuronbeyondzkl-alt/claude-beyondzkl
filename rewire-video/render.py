"""Frame renderer for the REWIRE video: light, shadow and fluorescent particles.

Every frame is a pure function of its time t, so frames render in parallel.
Colours are the Loyel gradient-blue palette (plus neutral black/white light).

    python3 render.py --frames 0 100 200   -> out/frames/*.png  (stills)
    python3 render.py                      -> out/video.mp4     (with out/music.wav)
"""
import argparse
import math
import os
import subprocess
import sys
from functools import lru_cache
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from timeline import (BAR, SPB, FPS, W, H, DURATION, STOPS, EVENTS, SCRIPT, tb, times, breath_curve)

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_ZH = os.path.join(HERE, "fonts", "NotoSansSC-900.ttf")
FONT_ZH_M = os.path.join(HERE, "fonts", "NotoSansSC-500.ttf")
FONT_EN = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FONT_EN_M = "/usr/share/fonts/opentype/inter/InterDisplay-SemiBold.otf"


# ------------------------------------------------------------ palette -------
def _lin(hexs):
    c = np.array([int(hexs[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


C10, C20, C30, C40, C50 = (_lin(h) for h in ("#F4F7FB", "#E8EEF6", "#CCDBEB", "#9FBDDA", "#6C9AC4"))
C60, C70, C80, C90, C100 = (_lin(h) for h in ("#497DAE", "#376392", "#2E5076", "#2B4868", "#263B54"))
WHITE = np.ones(3, np.float32)
GLOW = [C40, C50, C60, C50, C30, C20, C60, WHITE]  # fluorescent particle tints (blue-weighted)

# ------------------------------------------------------------- helpers ------
KICKS = np.array(sorted(times("kick") + times("heart")))
CLAPS = np.array(sorted(times("clap") + times("snare")))
IMPACTS = np.array(sorted(times("impact")))
HITS = np.array(sorted(times("hit")))
TOMS = np.array(sorted(times("tom")))


def since(arr, t):
    """Seconds since the most recent event in arr (inf if none)."""
    i = np.searchsorted(arr, t + 1e-6) - 1
    return t - arr[i] if i >= 0 else 1e9


def pulse(arr, t, decay):
    return math.exp(-since(arr, t) / decay)


def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def smooth(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp01(x)
    return x ** 3


def window(t, a, b, fin=0.3, fout=0.3):
    """1 inside [a,b] with smooth fades."""
    return float(smooth((t - a) / fin) * smooth((b - t) / fout)) if fin > 0 else float(a <= t <= b)


def in_stop(t):
    return any(a <= t < b for a, b in STOPS)


def hash_rng(*k):
    return np.random.default_rng(abs(hash(k)) % (2 ** 32))


# ------------------------------------------------------- splat buffers -----
class Canvas:
    """Emissive (additive) light buffer in linear RGB."""

    def __init__(self):
        self.E = np.zeros((H, W, 3), np.float32)
        self.Tx = np.zeros((H, W, 3), np.float32)  # crisp text, kept out of the shadow
        self.S4 = np.zeros((H // 4, W // 4), np.float32)  # shadow cast behind text
        self.pts = []  # (x, y, w, color)  fine 1-px particles
        self.soft = []  # big soft particles (quarter res)

    @staticmethod
    def _prep(x, y, w, color):
        x = np.asarray(x, np.float32).ravel()
        y = np.asarray(y, np.float32).ravel()
        n = x.size
        w = np.broadcast_to(np.asarray(w, np.float32).ravel(), (n,))
        c = np.asarray(color, np.float32).reshape(-1, 3)
        return x, y, w, np.broadcast_to(c, (n, 3))

    def add_points(self, x, y, w, color):
        self.pts.append(self._prep(x, y, w, color))

    def add_soft(self, x, y, w, color):
        self.soft.append(self._prep(x, y, w, color))

    @staticmethod
    def _splat(items, w, h, scale):
        if not items:
            return None
        xs = np.concatenate([i[0] for i in items]) * scale
        ys = np.concatenate([i[1] for i in items]) * scale
        ws = np.concatenate([i[2] for i in items])
        cols = np.concatenate([i[3] for i in items])
        ok = (xs >= 0) & (xs < w - 1) & (ys >= 0) & (ys < h - 1) & (ws > 1e-4)
        xs, ys, ws, cols = xs[ok], ys[ok], ws[ok], cols[ok]
        x0 = np.floor(xs).astype(np.int64)
        y0 = np.floor(ys).astype(np.int64)
        fx = xs - x0
        fy = ys - y0
        idx = np.concatenate([y0 * w + x0, y0 * w + x0 + 1, (y0 + 1) * w + x0, (y0 + 1) * w + x0 + 1])
        wt = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy]) * np.tile(ws, 4)
        cc = np.tile(cols, (4, 1))
        out = np.empty((h * w, 3), np.float32)
        for c in range(3):
            out[:, c] = np.bincount(idx, weights=wt * cc[:, c], minlength=h * w)
        return out.reshape(h, w, 3)

    def resolve(self):
        fine = self._splat(self.pts, W, H, 1.0)
        if fine is not None:
            self.E += cv2.GaussianBlur(fine, (0, 0), 0.9) * 2.2
        soft = self._splat(self.soft, W // 4, H // 4, 0.25)
        if soft is not None:
            soft = cv2.GaussianBlur(soft, (0, 0), 1.6)
            self.E += cv2.resize(soft, (W, H), interpolation=cv2.INTER_LINEAR) * 1.0


# ------------------------------------------------------------ text ---------
@lru_cache(maxsize=None)
def font(path, size):
    return ImageFont.truetype(path, size)


@lru_cache(maxsize=None)
def text_mask(txt, path, size, spacing=0):
    f = font(path, size)
    if spacing:
        widths = [f.getlength(ch) for ch in txt]
        tw = int(sum(widths) + spacing * (len(txt) - 1)) + 8
    else:
        tw = int(f.getlength(txt)) + 8
    asc, desc = f.getmetrics()
    th = asc + desc + 8
    img = Image.new("L", (tw, th), 0)
    d = ImageDraw.Draw(img)
    if spacing:
        x = 4
        for ch, wch in zip(txt, widths):
            d.text((x, 4), ch, font=f, fill=255)
            x += wch + spacing
    else:
        d.text((4, 4), txt, font=f, fill=255)
    a = np.asarray(img, np.float32) / 255.0
    ys, xs = np.nonzero(a > 0.02)
    if len(xs):
        a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    return a


class Block:
    """A laid-out text block: list of (mask, x, y, color, weight) + particle targets."""

    def __init__(self, item, idx):
        self.item = item
        self.idx = idx
        self.layers = []
        y = item.get("y", 540)
        align = item.get("align", "center")
        x_left = 380
        zs, es = item.get("zs", 64), item.get("es", 24)

        def place(mask, yc, color, gain=1.0, x=None):
            hh, ww = mask.shape
            if x is None:
                x = (W - ww) // 2 if align == "center" else x_left
            self.layers.append((mask, int(x), int(yc - hh / 2), color, gain))
            return hh

        if "logo" in item:
            m = text_mask(item["logo"], FONT_EN, item.get("size", 240), spacing=int(item.get("size", 240) * 0.08))
            place(m, y, C10, 1.35)
        elif "tag" in item:
            m1 = text_mask(item["tag"], FONT_EN, 30, spacing=10)
            m2 = text_mask(item["zh"], FONT_ZH, 66)
            m3 = text_mask(item["en"], FONT_EN_M, 20, spacing=7)
            place(m1, y - 62, C40, 1.0)
            place(m2, y, C10, 1.1)
            place(m3, y + 58, C30, 0.9)
        elif "chips" in item:
            n = len(item["chips"])
            cw = 440
            gap = 110
            x0 = (W - (n * cw + (n - 1) * gap)) // 2
            self.chip_boxes = []
            for i, (zh, en) in enumerate(item["chips"]):
                cx = x0 + i * (cw + gap)
                m1 = text_mask(zh, FONT_ZH, 64)
                m2 = text_mask(en, FONT_EN_M, 18, spacing=5)
                place(m1, y - 14, C10, 1.15, x=cx + (cw - m1.shape[1]) // 2)
                place(m2, y + 50, C30, 0.9, x=cx + (cw - m2.shape[1]) // 2)
                self.chip_boxes.append((cx, y - 80, cx + cw, y + 90))
        elif "en_big" in item:
            m1 = text_mask(item["en_big"], FONT_EN, es, spacing=int(es * 0.06))
            m2 = text_mask(item["zh"], FONT_ZH_M if zs < 40 else FONT_ZH, zs, spacing=int(zs * 0.25))
            place(m1, y - 30, C10, 1.3)
            place(m2, y + es * 0.55 + 10, C30, 1.0)
        else:
            m1 = text_mask(item["zh"], FONT_ZH, zs)
            h1 = m1.shape[0]
            m2 = text_mask(item["en"], FONT_EN_M, es, spacing=max(2, es // 4))
            if "sub" in item:
                m3 = text_mask(item["sub"], FONT_ZH_M, 40, spacing=6)
                place(m1, y - 40, C10, 1.2)
                place(m2, y + h1 / 2 + 6, C40, 1.0)
                place(m3, y + h1 / 2 + 70, C30, 0.9)
            else:
                place(m1, y, C10, 1.1)
                place(m2, y + h1 / 2 + es * 0.9 + 6, C30, 0.95)

        # particle targets sampled from the glyph masks
        rng = np.random.default_rng(1000 + idx)
        pts = []
        for mask, x, yy, col, g in self.layers:
            ys, xs = np.nonzero(mask > 0.5)
            if len(xs) == 0:
                continue
            k = min(len(xs), max(300, int(len(xs) * 0.09)))
            sel = rng.choice(len(xs), k, replace=False)
            pts.append(np.stack([xs[sel] + x, ys[sel] + yy], 1))
        self.targets = np.concatenate(pts).astype(np.float32)
        n = len(self.targets)
        self.n = n
        ang = rng.uniform(0, 2 * np.pi, n)
        rad = rng.uniform(300, 1100, n)
        self.start = np.stack([W / 2 + np.cos(ang) * rad * 1.3, H / 2 + np.sin(ang) * rad * 0.8], 1).astype(np.float32)
        self.delay = rng.uniform(0, 0.35, n).astype(np.float32)
        self.vel = (rng.normal(0, 1, (n, 2)) * [120, 80] + [0, -70]).astype(np.float32)
        self.phase = rng.uniform(0, 2 * np.pi, n).astype(np.float32)
        self.col = np.array(GLOW, np.float32)[rng.integers(0, len(GLOW), n)]
        self.bbox = (min(l[1] for l in self.layers), min(l[2] for l in self.layers),
                     max(l[1] + l[0].shape[1] for l in self.layers), max(l[2] + l[0].shape[0] for l in self.layers))


BLOCKS = None


def blocks():
    global BLOCKS
    if BLOCKS is None:
        BLOCKS = [Block(it, i) for i, it in enumerate(SCRIPT)]
    return BLOCKS


def draw_block(cv, blk, t):
    it = blk.item
    t0, t1 = it["t0"], it["t1"]
    mode = it.get("mode", "assemble")
    exit_kind = it.get("exit", "drift")
    if t < t0 - 0.01 or t > t1 + 1.2:
        return
    asm_dur = SPB * 1.6
    tl = t - t0
    out_t = t - t1
    rng_j = blk.phase

    # crisp text alpha + particle alpha
    if mode == "slam":
        crisp = 1.0 if tl >= 0 else 0.0
        part_a = math.exp(-max(tl, 0) / 0.25) if tl >= 0 else 0.0
        scale = 1.0 + 0.22 * math.exp(-max(tl, 0) / 0.09)
        flash = math.exp(-max(tl, 0) / 0.12)
    else:
        crisp = float(smooth((tl - asm_dur * 0.55) / (asm_dur * 0.45)))
        part_a = 1.0 - 0.75 * crisp
        scale = 1.0
        flash = 0.0
    if out_t > 0:
        fade = math.exp(-out_t / 0.08)
        crisp *= fade
        part_a = 1.0 * math.exp(-out_t / 0.6) if exit_kind == "drift" else 1.0 * math.exp(-out_t / 0.3)
    if it.get("final") and t > tb(52):
        crisp *= 1.0 - smooth((t - tb(52) - 1.6) / 1.6)

    beat_glow = 0.12 * pulse(KICKS, t, 0.12)

    # ---- particles -------------------------------------------------------
    n = blk.n
    if part_a > 0.003:
        tgt = blk.targets
        if mode == "slam" and out_t <= 0:
            k = 1 - math.exp(-max(tl, 0) / 0.18)
            pos = tgt + blk.vel * 1.4 * k + (tgt - [W / 2, H / 2]) * 0.25 * k
            w = np.full(n, 0.9 * part_a, np.float32)
        elif out_t <= 0:
            p = ease_out((tl - blk.delay * asm_dur) / (asm_dur * 0.65))
            swirl = np.sin(np.pi * p)[:, None] * np.stack([-(tgt[:, 1] - H / 2), tgt[:, 0] - W / 2], 1) * 0.25
            pos = blk.start + (tgt - blk.start) * p[:, None] + swirl
            pos = pos + np.stack([np.sin(t * 3 + rng_j), np.cos(t * 2.3 + rng_j)], 1) * 0.8
            w = (0.25 + 0.75 * p) * part_a
        else:
            if exit_kind == "implode":
                k = ease_in(out_t / (SPB * 0.9))
                pos = tgt + ([W / 2, H / 2] - tgt) * k
            else:
                k = 1 - math.exp(-out_t / 0.5)
                pos = tgt + blk.vel * 1.5 * k + np.stack([np.sin(out_t * 4 + rng_j), np.cos(out_t * 3 + rng_j)], 1) * 10 * k
            w = np.full(n, part_a, np.float32)
        tw = 0.6 + 0.4 * np.sin(t * 9 + rng_j * 3)
        cv.add_points(pos[:, 0], pos[:, 1], w * tw * (0.9 + beat_glow), blk.col)

    # ---- crisp glyphs ------------------------------------------------------
    if crisp > 0.003:
        sweep_x = ((t - t0) * 900) % (W + 1200) - 600
        for mask, x, y, col, g in blk.layers:
            m = mask
            hh, ww = m.shape
            xx, yy = x, y
            if abs(scale - 1) > 1e-3:
                nh, nw = int(hh * scale), int(ww * scale)
                m = cv2.resize(m, (nw, nh), interpolation=cv2.INTER_LINEAR)
                xx = int(x - (nw - ww) / 2)
                yy = int(y - (nh - hh) / 2)
                hh, ww = nh, nw
            xa, ya, xb, yb = max(0, xx), max(0, yy), min(W, xx + ww), min(H, yy + hh)
            if xb <= xa or yb <= ya:
                continue
            sub = m[ya - yy:yb - yy, xa - xx:xb - xx]
            cols = np.arange(xa, xb, dtype=np.float32)
            band = np.exp(-((cols - sweep_x) / 90.0) ** 2)[None, :] * 1.6
            inten = crisp * g * (1.0 + beat_glow + 2.5 * flash)
            cv.Tx[ya:yb, xa:xb] += (sub * inten)[..., None] * col + (sub * band * crisp)[..., None] * C20
            # soft shadow behind the glyphs keeps them legible over busy light
            sa, sb = max(0, ya // 4 - 6), min(H // 4, yb // 4 + 6)
            sc, sd = max(0, xa // 4 - 10), min(W // 4, xb // 4 + 10)
            cv.S4[sa:sb, sc:sd] = np.maximum(cv.S4[sa:sb, sc:sd], crisp * blk.item.get("shadow", 0.85))

        if "chips" in it:
            for i, (x0, y0, x1, y1) in enumerate(blk.chip_boxes):
                a = crisp * float(smooth((t - t0 - i * SPB * 0.5) / 0.1))
                cv2.rectangle(cv.Tx, (x0, y0), (x1, y1), (C50 * 0.9 * a).tolist(), 2, cv2.LINE_AA)
                if i < len(blk.chip_boxes) - 1:
                    xa, xb = x1 + 18, blk.chip_boxes[i + 1][0] - 18
                    yc = (y0 + y1) // 2
                    cv2.line(cv.Tx, (xa, yc), (xb, yc), (C40 * a).tolist(), 2, cv2.LINE_AA)
                    cv2.line(cv.Tx, (xb - 16, yc - 12), (xb, yc), (C40 * a).tolist(), 2, cv2.LINE_AA)
                    cv2.line(cv.Tx, (xb - 16, yc + 12), (xb, yc), (C40 * a).tolist(), 2, cv2.LINE_AA)
            # light packet running through the chips on every beat
            u = ((t - t0) / SPB) % 1.0
            x0 = blk.chip_boxes[0][0]
            x1 = blk.chip_boxes[-1][2]
            px = x0 + (x1 - x0) * ease_out(u)
            py = (blk.chip_boxes[0][1] + blk.chip_boxes[0][3]) / 2
            cv.add_soft([px], [py], [60 * crisp], [C20])


# ------------------------------------------------------- background ---------
def fbm(seed, w, h, octaves=5):
    rng = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp = 1.0
    for o in range(octaves):
        s = 2 ** (o + 2)
        g = rng.random((s, int(s * w / h) + 1)).astype(np.float32)
        out += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * amp
        amp *= 0.5
    out -= out.min()
    return out / out.max()


BG = None


def background():
    global BG
    if BG is None:
        w, h = W // 4 + 64, H // 4 + 64
        n1 = fbm(1, w, h)
        n2 = fbm(2, w, h)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        vign = np.clip(1.15 - r ** 1.6, 0.0, 1.0).astype(np.float32)
        grad = (0.25 + 0.75 * (1 - yy / H)).astype(np.float32)
        BG = dict(n1=n1, n2=n2, vign=vign, grad=grad)
    return BG


def draw_background(t, energy):
    bg = background()
    ox = int(16 + 14 * math.sin(t * 0.07))
    oy = int(16 + 10 * math.cos(t * 0.05))
    a = bg["n1"][oy:oy + H // 4, ox:ox + W // 4]
    b = bg["n2"][32 - oy // 2:32 - oy // 2 + H // 4, 32 - ox // 2: 32 - ox // 2 + W // 4]
    neb = (a ** 3 * 0.9 + b ** 4 * 0.6)
    neb = cv2.resize(neb, (W, H), interpolation=cv2.INTER_LINEAR)
    # deep navy (C100/C90 in low light) with drifting C80/C70 nebula
    base = (bg["grad"] * 0.42)[..., None] * C100 + (neb * (0.10 + 0.05 * energy))[..., None] * C80 \
        + (neb ** 2 * 0.05)[..., None] * C70
    return base.astype(np.float32)


# ------------------------------------------------------------- scenes -------
RNG = np.random.default_rng(42)
ND = 2600
DUST = dict(x=RNG.uniform(0, W, ND), y=RNG.uniform(0, H, ND), z=RNG.uniform(0.15, 1.0, ND),
            ph=RNG.uniform(0, 2 * np.pi, ND), col=np.array(GLOW, np.float32)[RNG.integers(0, len(GLOW), ND)])


def scene_dust(cv, t, amount, speed=1.0, beam=None, warp=0.0):
    d = DUST
    z = d["z"]
    x = (d["x"] + t * 18 * z * speed + 30 * np.sin(t * 0.3 * z + d["ph"])) % W
    y = (d["y"] - t * 10 * z * speed + 20 * np.cos(t * 0.25 + d["ph"] * 2)) % H
    tw = 0.5 + 0.5 * np.sin(t * (1.5 + 2 * z) + d["ph"] * 5)
    w = amount * (0.15 + 0.6 * z) * tw
    if beam is not None:
        w = w * (0.25 + 3.5 * beam(x, y))
    big = z > 0.82
    cv.add_points(x[~big], y[~big], w[~big], d["col"][~big])
    cv.add_soft(x[big], y[big], w[big] * 9, d["col"][big])


def god_rays(cv, t, cx, cy, strength, nrays=26, spread=0.45, rot=0.0, tint=C60, falloff=900.0):
    if strength < 0.003:
        return
    w4, h4 = W // 4, H // 4
    yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
    xx = xx * 4 - cx
    yy = yy * 4 - cy
    ang = np.arctan2(yy, xx) + rot
    rad = np.sqrt(xx ** 2 + yy ** 2)
    r = (np.sin(ang * nrays + 0.6 * np.sin(t * 0.7)) * 0.5 + 0.5) ** 6
    r += (np.sin(ang * nrays * 0.37 + t * 0.4 + 1.3) * 0.5 + 0.5) ** 10 * 0.7
    r *= np.exp(-rad / falloff) * spread
    img = cv2.resize((r * strength).astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    cv.E += img[..., None] * tint


def top_beam(cv, t, strength, x_center=W / 2, width=420):
    """Volumetric light cone from the top edge."""
    if strength < 0.003:
        return None
    w4, h4 = W // 4, H // 4
    yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
    xx = xx * 4
    yy = yy * 4
    half = width * 0.25 + yy * 0.42
    d = np.abs(xx - x_center) / half
    cone = np.exp(-d ** 2 * 2.2) * np.exp(-yy / 1300.0)
    flick = 0.9 + 0.1 * math.sin(t * 7.0)
    img = cv2.resize((cone * strength * flick).astype(np.float32), (W, H))
    cv.E += img[..., None] * (C40 * 0.4 + C60 * 0.6) * 0.3

    def beam(x, y):
        hh = width * 0.25 + y * 0.42
        return np.exp(-(np.abs(x - x_center) / hh) ** 2 * 2.2) * strength
    return beam


def sunburst(cv, t, t0, cx, cy, strength, r0=230, r1=470, n=150, rot_speed=0.05):
    if strength < 0.003:
        return
    grow = ease_out((t - t0) / 0.45)
    kp = pulse(KICKS, t, 0.15)
    base = rot_speed * (t - t0)
    for ring, (ra, rb, nn, off) in enumerate(((r0 * 0.55, r0 * 0.98, n, 0.0), (r0, r1, n, 0.5 / n))):
        for i in range(nn):
            a = 2 * np.pi * (i / nn + off) + base * (1 if ring else -1)
            jitter = 0.86 + 0.14 * math.sin(i * 7.31)
            rb_i = ra + (rb - ra) * grow * jitter
            p0 = (int((cx + math.cos(a) * ra) * 16), int((cy + math.sin(a) * ra) * 16))
            p1 = (int((cx + math.cos(a) * rb_i) * 16), int((cy + math.sin(a) * rb_i) * 16))
            c = (C50 if ring else C40) * strength * (0.55 + 0.6 * kp) * 0.9
            cv2.line(cv.E, p0, p1, c.tolist(), 2, cv2.LINE_AA, shift=4)
    core = strength * (0.9 + 0.8 * kp)
    cv.add_soft([cx], [cy], [core * 200], [C30])


def shockwave(cv, t, t0, cx, cy, strength=1.0, speed=1900):
    dt = t - t0
    if dt < 0 or dt > 1.2:
        return
    r = speed * dt ** 0.7
    a = strength * (1 - dt / 1.2) ** 2
    cv2.circle(cv.E, (int(cx), int(cy)), int(r), (C20 * a * 2.0).tolist(), 6, cv2.LINE_AA)
    cv2.circle(cv.E, (int(cx), int(cy)), int(r * 0.82), (C40 * a * 0.8).tolist(), 3, cv2.LINE_AA)


# explosion particles (title drop, cycle break, final)
NE = 6000
EXP = dict(ang=RNG.uniform(0, 2 * np.pi, NE), spd=RNG.gamma(2.0, 260, NE), ph=RNG.uniform(0, 6.28, NE),
           col=np.array(GLOW, np.float32)[RNG.integers(0, len(GLOW), NE)], big=RNG.random(NE) > 0.93)


def explosion(cv, t, t0, cx, cy, strength=1.0, r0=0.0):
    dt = t - t0
    if dt < 0 or dt > 4.0:
        return
    e = EXP
    dist = r0 + e["spd"] * (1 - np.exp(-dt * 1.6)) / 1.6 * 1.3
    x = cx + np.cos(e["ang"]) * dist + 6 * np.sin(dt * 3 + e["ph"])
    y = cy + np.sin(e["ang"]) * dist * 0.9 + dt * 22 + 6 * np.cos(dt * 2.5 + e["ph"])
    w = strength * np.exp(-dt / 1.3) * (0.6 + 0.4 * np.sin(dt * 12 + e["ph"] * 3))
    b = e["big"]
    cv.add_points(x[~b], y[~b], w[~b] * 1.4, e["col"][~b])
    cv.add_soft(x[b], y[b], w[b] * 10, e["col"][b])


# --- neural network (plasticity) ---
NET_RNG = np.random.default_rng(7)


def _make_net():
    pts = []
    for _ in range(20000):  # dart throwing; ~45 nodes fit at this spacing
        p = NET_RNG.uniform([80, 80], [W - 80, H - 80])
        if all(np.hypot(*(p - q)) > 145 for q in pts):
            pts.append(p)
    pts = np.array(pts, np.float32)
    edges = set()
    for i, p in enumerate(pts):
        d = np.hypot(*(pts - p).T)
        for j in np.argsort(d)[1:4]:
            edges.add((min(i, j), max(i, j)))
    # the "highway": a left-to-right chain through the lower third
    chain = []
    for k, xg in enumerate(np.linspace(140, W - 140, 9)):
        yg = 820 + 70 * math.sin(k * 1.3)
        chain.append(int(np.argmin(np.hypot(pts[:, 0] - xg, pts[:, 1] - yg))))
    chain = list(dict.fromkeys(chain))
    return pts, sorted(edges), chain


NET = _make_net()


def scene_network(cv, t, a):
    if a < 0.003:
        return
    pts, edges, chain = NET
    t0 = tb(12)
    beat = (t - t0) / SPB
    bi = int(math.floor(beat))
    frac = beat - bi
    kp = pulse(KICKS, t, 0.18)
    for (i, j) in edges:
        p, q = pts[i], pts[j]
        cv2.line(cv.E, (int(p[0] * 16), int(p[1] * 16)), (int(q[0] * 16), int(q[1] * 16)),
                 (C50 * 0.55 * a).tolist(), 2, cv2.LINE_AA, shift=4)
    # signals: each beat fires a few random edges, arriving on the next beat
    xs, ys, ws = [], [], []
    flare = np.zeros(len(pts), np.float32)
    for b in (bi - 1, bi):
        if b < 0:
            continue
        r = np.random.default_rng(500 + b)
        sel = r.choice(len(edges), 7, replace=False)
        u = (beat - b)
        for s in sel:
            i, j = edges[s]
            if r.random() < 0.5:
                i, j = j, i
            if 0 <= u <= 1:
                k = ease_out(u)
                xs.append(pts[i][0] + (pts[j][0] - pts[i][0]) * k)
                ys.append(pts[i][1] + (pts[j][1] - pts[i][1]) * k)
                ws.append(1.0)
            if u >= 1:
                flare[j] = max(flare[j], math.exp(-(u - 1) * 4))
            flare[i] = max(flare[i], math.exp(-u * 5))
    if xs:
        cv.add_soft(xs, ys, np.array(ws) * 26 * a, [C20])
    # highway: thickens with every bar of repetition
    reps = max(0, int((t - t0) / BAR)) + 1
    thick = 1 + min(reps, 8) * 0.9
    glow = 0.25 + 0.12 * min(reps, 8)
    for i, j in zip(chain[:-1], chain[1:]):
        p, q = pts[i], pts[j]
        cv2.line(cv.E, (int(p[0] * 16), int(p[1] * 16)), (int(q[0] * 16), int(q[1] * 16)),
                 (C40 * glow * a).tolist(), int(round(thick)), cv2.LINE_AA, shift=4)
    ub = ((t - t0) % BAR) / BAR
    seg = ub * (len(chain) - 1)
    k = int(seg)
    if k < len(chain) - 1:
        p, q = pts[chain[k]], pts[chain[k + 1]]
        f = seg - k
        cv.add_soft([p[0] + (q[0] - p[0]) * f], [p[1] + (q[1] - p[1]) * f], [80 * a], [WHITE])
    # nodes
    nw = (0.6 + 2.5 * flare + 0.4 * kp) * a
    cv.add_soft(pts[:, 0], pts[:, 1], nw * 14, np.broadcast_to(C30, (len(pts), 3)))
    cv.add_points(pts[:, 0], pts[:, 1], nw * 3, np.broadcast_to(C10, (len(pts), 3)))


# --- the cycle ring (negativity loop) ---
NR = 5000
RING = dict(a=RNG.uniform(0, 2 * np.pi, NR), dr=RNG.normal(0, 1, NR), spd=RNG.uniform(0.6, 1.4, NR),
            ph=RNG.uniform(0, 6.28, NR), col=np.array([C40, C50, C60, C30], np.float32)[RNG.integers(0, 4, NR)])


def scene_ring(cv, t, a):
    if a < 0.003:
        return
    cx, cy = W / 2, 470
    t_break = tb(26)
    tension = smooth((t - tb(24)) / (tb(25, 3) - tb(24)))
    R = 300 - 110 * tension
    om = 0.9 + 2.6 * tension
    kp = pulse(KICKS, t, 0.15)
    r = RING
    if t < t_break:
        ang = r["a"] + t * om * r["spd"]
        rad = R + r["dr"] * (14 + 10 * kp) + np.sin(ang * 6 + t * 3) * 6 * (1 + 4 * tension)
        jitter = tension * 5 * np.sin(t * 60 + r["ph"])
        x = cx + np.cos(ang) * rad + jitter
        y = cy + np.sin(ang) * rad * 0.92
        w = a * (0.35 + 0.35 * kp) * (0.6 + 0.4 * np.sin(r["ph"] + t * 5))
        cv.add_points(x, y, w * 2.4, r["col"])
        cv.add_soft(x[::25], y[::25], w[::25] * 10, r["col"][::25])
        # inner shadow halo
        cv2.circle(cv.E, (int(cx), int(cy)), int(R + 40), (C80 * 0.12 * a).tolist(), 2, cv2.LINE_AA)
    else:
        dt = t - t_break
        ang = r["a"] + t_break * om * r["spd"]
        spd = 500 + 900 * r["spd"] ** 2
        rad = R + spd * (1 - np.exp(-dt * 2.2)) / 2.2
        x = cx + np.cos(ang) * rad + 8 * np.sin(dt * 3 + r["ph"])
        y = cy + np.sin(ang) * rad * 0.92 + dt * 20
        w = a * np.exp(-dt / 1.1) * 1.1
        cv.add_points(x, y, w, r["col"])


# --- attention searchlight (narrative) ---
NF = 9000
FIELD = dict(x=RNG.uniform(0, W, NF), y=RNG.uniform(0, H, NF), ph=RNG.uniform(0, 6.28, NF),
             z=RNG.uniform(0.2, 1, NF), col=np.array(GLOW, np.float32)[RNG.integers(0, len(GLOW), NF)])


def scene_searchlight(cv, t, a):
    if a < 0.003:
        return None
    f = FIELD
    x = (f["x"] + 12 * np.sin(t * 0.4 + f["ph"]) + t * 8 * f["z"]) % W
    y = (f["y"] + 10 * np.cos(t * 0.35 + f["ph"])) % H
    ox, oy = W * 0.86, H + 40
    hb = since(HITS, t)

    def aim_at(k):
        return math.atan2(360 + 130 * k - oy, 760 - ox) + math.pi / 2

    if tb(30) <= t < tb(34):
        k = int((t - tb(30)) / BAR)
        prev = aim_at(k - 1) if k > 0 else math.sin((tb(30) - tb(28)) * 0.9) * 0.55
        sweep = prev + (aim_at(k) - prev) * ease_out(hb / 0.15) + 0.02 * math.sin(t * 2)
    else:
        sweep = math.sin((t - tb(28)) * 0.9) * 0.55
    ang = sweep - math.pi / 2
    dx, dy = math.cos(ang), math.sin(ang)
    vx, vy = x - ox, y - oy
    along = vx * dx + vy * dy
    perp = np.abs(-vx * dy + vy * dx)
    half = 40 + along * 0.2
    inside = np.exp(-(perp / np.maximum(half, 1)) ** 2 * 1.8) * (along > 0)
    w = a * (0.14 + 2.4 * inside) * (0.6 + 0.4 * np.sin(t * 4 + f["ph"])) * (0.4 + 0.6 * f["z"])
    cv.add_points(x, y, w, f["col"])
    # volumetric cone (quarter res)
    w4, h4 = W // 4, H // 4
    yy, xx = np.mgrid[0:h4, 0:w4].astype(np.float32)
    vx4, vy4 = xx * 4 - ox, yy * 4 - oy
    al = vx4 * dx + vy4 * dy
    pp = np.abs(-vx4 * dy + vy4 * dx)
    cone = np.exp(-(pp / np.maximum(40 + al * 0.2, 1)) ** 2 * 1.8) * (al > 0) * np.exp(-al / 2200)
    flash = 1 + 1.5 * math.exp(-hb / 0.15)
    cv.E += cv2.resize((cone * 0.16 * a * flash).astype(np.float32), (W, H))[..., None] * (C50 * 0.7 + C40 * 0.3)
    return None


# --- breathing ring ---
NB = 4200
BR = dict(a=RNG.uniform(0, 2 * np.pi, NB), dr=RNG.normal(0, 1, NB), ph=RNG.uniform(0, 6.28, NB),
          col=np.array([C20, C30, C40, WHITE], np.float32)[RNG.integers(0, 4, NB)])


def scene_breath(cv, t, a):
    if a < 0.003:
        return
    b = breath_curve(t)
    cx, cy = W / 2, 540
    R = 150 + 230 * b
    r = BR
    ang = r["a"] + t * 0.12
    rad = R + r["dr"] * (10 + 25 * b) + 5 * np.sin(ang * 5 + t)
    x = cx + np.cos(ang) * rad
    y = cy + np.sin(ang) * rad
    w = a * (0.35 + 0.9 * b) * (0.6 + 0.4 * np.sin(t * 3 + r["ph"]))
    cv.add_points(x, y, w, r["col"])
    cv.add_soft([cx], [cy], [a * (8 + 50 * b)], [C50])
    # breath cue words in the ring
    u = ((t - tb(36)) % (2 * BAR)) / SPB
    cue = "吸气" if u < 2 else ("再吸一口" if u < 3 else "缓缓长呼")
    ca = a * (smooth(u / 0.3) if u < 2 else 1.0) * (1 - smooth((u - 7.4) / 0.6))
    m = text_mask(cue, FONT_ZH_M, 44, spacing=10)
    hh, ww = m.shape
    x0, y0 = int(cx - ww / 2), int(cy - hh / 2)
    cv.E[y0:y0 + hh, x0:x0 + ww] += (m * ca * 0.9)[..., None] * C20


# --- warp tunnel (build) ---
NW = 2200
WARP = dict(x=RNG.normal(0, 1, NW), y=RNG.normal(0, 1, NW), z0=RNG.uniform(0, 1, NW),
            col=np.array(GLOW, np.float32)[RNG.integers(0, len(GLOW), NW)])


def warp_pos(t):
    """Distance travelled: speed doubles every bar of the build."""
    u = (t - tb(40)) / BAR
    return (2 ** np.clip(u, 0, 5) - 1) / math.log(2) * 0.35


def scene_warp(cv, t, a):
    if a < 0.003:
        return
    wv = WARP
    cx, cy = W / 2, H / 2
    xs, ys, ws, cs = [], [], [], []
    s_now = warp_pos(t)
    for k in range(6):
        s = s_now - k * 0.012 * (1 + 2 ** ((t - tb(40)) / BAR))
        z = (wv["z0"] - s) % 1.0 + 0.02
        px = cx + wv["x"] * 260 / z
        py = cy + wv["y"] * 260 / z
        xs.append(px)
        ys.append(py)
        ws.append(a * (1 - k / 6) * np.clip(0.95 - z, 0, 1) * (3.0 + 1.5 * (t - tb(40)) / BAR))
        cs.append(wv["col"])
    cv.add_points(np.concatenate(xs), np.concatenate(ys), np.concatenate(ws), np.concatenate(cs))
    near = ((wv["z0"] - s_now) % 1.0) < 0.12
    cv.add_soft(xs[0][near], ys[0][near], ws[0][near] * 6, wv["col"][near])


# --- final galaxy swirl (44-50) ---
NG = 7000
GAL = dict(r=RNG.gamma(2.2, 160, NG), a=RNG.uniform(0, 2 * np.pi, NG), ph=RNG.uniform(0, 6.28, NG),
           col=np.array(GLOW, np.float32)[RNG.integers(0, len(GLOW), NG)], big=RNG.random(NG) > 0.96)


def scene_galaxy(cv, t, a):
    if a < 0.003:
        return
    g = GAL
    kp = pulse(KICKS, t, 0.14)
    om = 0.9 / (0.4 + g["r"] / 300)
    ang = g["a"] + t * om * 0.6 + g["r"] * 0.004
    rad = g["r"] * (1 + 0.07 * kp)
    x = W / 2 + np.cos(ang) * rad * 1.45
    y = H / 2 + np.sin(ang) * rad * 0.55
    w = a * (0.35 + 0.5 * kp) * (0.6 + 0.4 * np.sin(t * 5 + g["ph"]))
    b = g["big"]
    cv.add_points(x[~b], y[~b], w[~b], g["col"][~b])
    cv.add_soft(x[b], y[b], w[b] * 8, g["col"][b])


def light_streak(cv, t, t0, length=SPB * 2):
    """Horizontal anamorphic light streak wiping across (transitions)."""
    u = (t - t0) / length
    if not 0 <= u <= 1:
        return
    x = -400 + (W + 800) * ease_in(u) if u < 0.5 else -400 + (W + 800) * u
    a = math.sin(math.pi * u)
    yy = np.arange(H, dtype=np.float32)
    xx = np.arange(W, dtype=np.float32)
    band = np.exp(-((xx - x) / 260) ** 2)[None, :] * np.exp(-((yy - H / 2) / 9) ** 2)[:, None]
    soft = np.exp(-((xx - x) / 500) ** 2)[None, :] * np.exp(-((yy - H / 2) / 160) ** 2)[:, None]
    cv.E += (band * 3.0 * a + soft * 0.35 * a)[..., None].astype(np.float32) * C20


# ----------------------------------------------------------- composite ------
def bloom(E):
    small = cv2.resize(E, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    acc = np.zeros_like(small)
    cur = small
    for i, (wgt, sig) in enumerate(((0.55, 2.0), (0.45, 3.0), (0.35, 4.0), (0.3, 6.0))):
        cur = cv2.resize(cur, (cur.shape[1] // 2, cur.shape[0] // 2), interpolation=cv2.INTER_AREA)
        bl = cv2.GaussianBlur(cur, (0, 0), sig)
        acc += cv2.resize(bl, (W // 2, H // 2), interpolation=cv2.INTER_LINEAR) * wgt
    return E + cv2.resize(acc, (W, H), interpolation=cv2.INTER_LINEAR) * 0.9


GRAIN = np.random.default_rng(3).normal(0, 1, (8, H // 2, W // 2)).astype(np.float32)


def render_frame(f):
    t = f / FPS
    cv = Canvas()
    stop = in_stop(t)
    kp = pulse(KICKS, t, 0.13)
    imp = pulse(IMPACTS, t, 0.35)
    energy = 0.0
    for name, a, b in (("title", 8, 12), ("plast", 12, 20), ("neg", 20, 28), ("narr", 28, 36), ("build", 40, 44), ("final", 44, 52)):
        if tb(a) <= t < tb(b):
            energy = 1.0
    bgimg = draw_background(t, energy * kp)

    # ---- INTRO -------------------------------------------------------------
    if t < tb(8):
        hb = pulse(np.array(times("heart")), t, 0.25)
        beam_s = 0.25 + 0.75 * smooth((t - tb(1)) / (tb(7) - tb(1)))
        beam = top_beam(cv, t, beam_s * (1 - stop * 1.0))
        conv = smooth((t - tb(6)) / (tb(7, 3) - tb(6)))
        if not stop:
            scene_dust(cv, t, 1.0 - 0.6 * conv, beam=beam)
            # the first spark of consciousness
            cv.add_soft([W / 2], [H / 2 + 20], [30 + 110 * hb + 300 * conv], [C20])
            god_rays(cv, t, W / 2, H / 2, 0.06 + 0.5 * conv, nrays=22, rot=t * 0.15, falloff=700)
            # toms -> radial pulses
            tp = pulse(TOMS, t, 0.18)
            if tp > 0.01 and t > tb(6):
                cv.add_soft([W / 2], [H / 2], [tp * 420], [C40])
        else:
            u = (t - STOPS[0][0]) / (STOPS[0][1] - STOPS[0][0])
            cv.add_soft([W / 2], [H / 2], [80 + 900 * u ** 3], [WHITE])

    # ---- TITLE (8-12) --------------------------------------------------------
    if tb(8) <= t < tb(12, 0.5):
        a = window(t, tb(8), tb(11, 3.5), 0.01, 0.25)
        sunburst(cv, t, tb(8), W / 2, 430, a * 0.85, r0=250, r1=500)
        god_rays(cv, t, W / 2, 430, a * (0.2 + 0.6 * imp), nrays=30, rot=t * 0.05, falloff=900)
        explosion(cv, t, tb(8), W / 2, 430, 1.0, r0=60)
        shockwave(cv, t, tb(8), W / 2, 430)
        scene_dust(cv, t, 0.7 * a, speed=2.0)
    light_streak(cv, t, tb(11, 2))

    # ---- PLASTICITY (12-20) --------------------------------------------------
    if tb(11, 3) <= t < tb(20, 0.5):
        a = window(t, tb(12), tb(19, 3.6), 0.4, 0.3)
        scene_network(cv, t, a)
        scene_dust(cv, t, 0.25 * a)

    # ---- NEGATIVE (20-28) ------------------------------------------------------
    if tb(19, 3) <= t < tb(28, 0.5):
        a = window(t, tb(20), tb(27, 3.6), 0.3, 0.3)
        if not stop:
            scene_ring(cv, t, a)
            scene_dust(cv, t, 0.35 * a)
        explosion(cv, t, tb(26), W / 2, 470, 0.55, r0=180)
        shockwave(cv, t, tb(26), W / 2, 470, 1.2)
        if tb(26) <= t < tb(27, 2):
            god_rays(cv, t, W / 2, 470, 0.35 * math.exp(-(t - tb(26)) / 1.0), nrays=34, rot=0.2)
    light_streak(cv, t, tb(27, 2))

    # ---- NARRATIVE (28-36) -----------------------------------------------------
    if tb(27, 3) <= t < tb(36, 0.5):
        a = window(t, tb(28), tb(35, 3.8), 0.15, 0.3)
        scene_searchlight(cv, t, a)

    # ---- BREATH (36-40) --------------------------------------------------------
    if tb(36) <= t < tb(40, 0.3):
        a = window(t, tb(36), tb(39, 3.8), 0.6, 0.2)
        scene_breath(cv, t, a)
        god_rays(cv, t, W / 2, 540, a * (0.04 + 0.14 * breath_curve(t)), nrays=18, rot=t * 0.08, falloff=800, tint=C50)
        scene_dust(cv, t, 0.6 * a, speed=0.5)

    # ---- BUILD (40-44) ---------------------------------------------------------
    if tb(40) <= t < tb(44):
        a = window(t, tb(40), tb(43, 3), 0.05, 0.02)
        scene_warp(cv, t, a)
        god_rays(cv, t, W / 2, H / 2, a * 0.25 * pulse(TOMS, t, 0.3), nrays=40, rot=t * 0.6)
        if stop:
            u = (t - STOPS[2][0]) / (STOPS[2][1] - STOPS[2][0])
            cv.add_soft([W / 2], [H / 2], [80 + 900 * u ** 3], [WHITE])

    # ---- FINAL (44-52+) --------------------------------------------------------
    if t >= tb(44):
        a = window(t, tb(44), tb(50), 0.01, 0.6)
        scene_galaxy(cv, t, a)
        for t0 in (tb(44), tb(46)):
            explosion(cv, t, t0, W / 2, H / 2, 1.0, r0=80)
            shockwave(cv, t, t0, W / 2, H / 2, 1.2)
        god_rays(cv, t, W / 2, H / 2, a * (0.15 + 0.6 * imp), nrays=36, rot=t * 0.1)
        if t >= tb(50):
            fade = 1 - smooth((t - tb(52) - 1.4) / 1.8)
            boost = 1 + 1.4 * pulse(np.array([tb(52)]), t, 0.5)
            sunburst(cv, t, tb(50), W / 2, 470, 0.9 * fade * boost, r0=260, r1=520)
            god_rays(cv, t, W / 2, 470, fade * (0.2 + 0.5 * imp), nrays=30, rot=t * 0.05)
            explosion(cv, t, tb(50), W / 2, 470, 0.8, r0=120)
            explosion(cv, t, tb(52), W / 2, 470, 1.2, r0=200)
            shockwave(cv, t, tb(52), W / 2, 470, 1.4)
            scene_dust(cv, t, 0.6 * fade, speed=1.5)

    # ---- text ----------------------------------------------------------------
    for blk in blocks():
        draw_block(cv, blk, t)

    cv.resolve()
    S = cv2.resize(np.clip(cv2.GaussianBlur(cv.S4, (0, 0), 6), 0, 1), (W, H), interpolation=cv2.INTER_LINEAR)
    E = bloom(cv.E * (1 - 0.85 * S)[..., None] + cv.Tx)

    # ---- shadow / light shaping ----------------------------------------------
    img = bgimg * (1 - 0.6 * S)[..., None] + E
    vign = background()["vign"]
    img *= (0.35 + 0.65 * vign)[..., None]
    # camera flash on impacts and slams
    hp = pulse(HITS, t, 0.08)
    flash = 1.3 * math.exp(-since(IMPACTS, t) / 0.075) + 0.25 * hp
    img += flash * (C20 * 0.8 + WHITE * 0.2)
    img *= 1.0 + 0.10 * kp * energy

    exposure = 1.25
    img = 1.0 - np.exp(-img * exposure)
    img = np.clip(img, 0, 1) ** (1 / 2.2)

    # chromatic aberration + shake + zoom punch on impacts
    shock = math.exp(-since(IMPACTS, t) / 0.18) + 0.4 * hp
    if shock > 0.02:
        r = hash_rng(f)
        dx, dy = r.normal(0, 14 * shock, 2)
        z = 1 + 0.035 * shock
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, z)
        M[:, 2] += (dx, dy)
        img = cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        ca = 6 * shock
        Mr = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 + ca / W * 2)
        Mb = cv2.getRotationMatrix2D((W / 2, H / 2), 0, 1 - ca / W * 2)
        img[..., 0] = cv2.warpAffine(img[..., 0], Mr, (W, H), borderMode=cv2.BORDER_REFLECT)
        img[..., 2] = cv2.warpAffine(img[..., 2], Mb, (W, H), borderMode=cv2.BORDER_REFLECT)

    g = cv2.resize(GRAIN[f % 8], (W, H), interpolation=cv2.INTER_NEAREST)
    img = img + g[..., None] * 0.012
    if t > DURATION - 0.6:
        img *= max(0.0, (DURATION - t) / 0.6)
    out = (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, nargs="*")
    ap.add_argument("--times", type=float, nargs="*")
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    ap.add_argument("--out", default="out/video.mp4")
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=DURATION)
    args = ap.parse_args()
    os.makedirs("out/frames", exist_ok=True)
    blocks()
    background()
    if args.frames or args.times:
        fl = list(args.frames or []) + [int(round(x * FPS)) for x in (args.times or [])]
        for f in fl:
            img = render_frame(f)
            p = f"out/frames/f{f:05d}.png"
            Image.fromarray(img).save(p)
            print(p)
        return
    f0, f1 = int(args.start * FPS), int(math.ceil(args.end * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-ss", f"{args.start:.4f}", "-i", "out/music.wav",
           "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", args.out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(args.workers) as pool:
        for i, img in enumerate(pool.imap(render_frame, range(f0, f1), chunksize=4)):
            ff.stdin.write(img.tobytes())
            if i % 60 == 0:
                print(f"frame {f0 + i}/{f1}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("wrote", args.out)


if __name__ == "__main__":
    main()
