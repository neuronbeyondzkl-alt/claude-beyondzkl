"""Frame renderer for the Determined video.

Each frame is a pure function of its index: particles (formations.py),
light shafts, god rays behind silhouettes, bloom, text, sparks and
shockwaves are all derived from time and from timeline.py, the same
module the score is built from.

    python3 render.py --stills 8.2,18.4,49        # preview PNGs
    python3 render.py --out build/determined.mp4  # full video + score
"""
import argparse
import math
import os
import subprocess
import sys
import time
import zlib
from multiprocessing import Pool

import cv2
import numexpr as ne
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import formations as FM
import timeline as TL

W, H, FPS = TL.W, TL.H, TL.FPS
NF = int(round(TL.DURATION * FPS))
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts")
BUILD = os.path.join(HERE, "build")
T = TL.T
lin = FM.lin
F_FOCAL = 2160.0           # 1 world unit = 540 px at z = 0, camera distance 4


def smooth(e0, e1, x):
    u = np.clip((x - e0) / (e1 - e0), 0.0, 1.0)
    return u * u * (3 - 2 * u)


def ease_out(u):
    u = np.clip(u, 0, 1)
    return 1 - (1 - u) ** 3


def frac_hash(*xs):
    v = math.sin(sum(x * k for x, k in zip(xs, (12.9898, 78.233, 37.719, 4.581)))) * 43758.5453
    return v - math.floor(v)


# ================================================================ timeline lookups
def _times(kind):
    a = [(t, v) for t, k, v in TL.DRUMS if k == kind]
    return np.array([x[0] for x in a]), np.array([x[1] for x in a])


KICK_T, KICK_V = _times("kick")
SNARE_T, SNARE_V = _times("snare")
TAIKO_T, TAIKO_V = _times("taiko")
HEART_T, HEART_V = _times("heart")
IMP_T = np.array(TL.IMPACTS)
HIT_T = np.array(sorted(TL.HITS))


def env(times, t, tau, vels=None, window=3.0):
    i1 = np.searchsorted(times, t, "right")
    i0 = np.searchsorted(times, t - window, "left")
    if i1 <= i0:
        return 0.0
    dt = t - times[i0:i1]
    v = 1.0 if vels is None else vels[i0:i1]
    return float((v * np.exp(-dt / tau)).sum())


def since(times, t):
    i = np.searchsorted(times, t, "right") - 1
    return (t - times[i], i) if i >= 0 else (1e9, -1)


# ================================================================ look keyframes
LOOK_DEFAULT = dict(shafts=0.05, warm=0.15, godray=0.6, bloom=1.0, bgl=0.4, dust=0.3,
                    lx=960.0, ly=540.0, blob=1.0, brad=34.0)
LOOK_KEYS = [
    (0.0, {}),
    (T(3), dict(shafts=0.12, godray=0.7, blob=1.3, brad=46.0)),
    (T(4), dict(shafts=0.45, warm=0.12, godray=0.6, bgl=0.8, dust=0.6, blob=0.3, brad=140.0)),
    (T(8), dict(shafts=0.35, godray=0.6)),
    (T(9), dict(godray=0.5, lx=960.0, ly=540.0, warm=0.2)),
    (T(12), dict(shafts=0.35, godray=0.6, lx=960.0, ly=345.0)),
    (T(22), dict(shafts=0.2, godray=1.0, lx=960.0, ly=540.0, warm=0.25)),
    (T(24), dict(shafts=0.35, godray=0.45, lx=960.0, ly=380.0, bloom=1.1, warm=0.2)),
    (T(32), dict(shafts=0.25, warm=0.4, godray=0.95, bloom=1.0)),
    (T(36), dict(shafts=0.15, warm=0.2, godray=0.35, lx=960.0, ly=540.0)),
    (T(38), dict(shafts=0.3, warm=0.95, godray=0.75, lx=960.0, ly=430.0)),
    (T(40), dict(shafts=0.3, warm=0.12, godray=0.6, lx=960.0, ly=370.0)),
    (T(42), dict(shafts=0.3, warm=0.25, godray=0.95)),
    (T(44), dict(shafts=0.35, warm=0.4, godray=0.55, lx=960.0, ly=380.0)),
    (T(48), dict(shafts=0.4, warm=0.3, godray=0.85, lx=960.0, ly=430.0)),
    (T(49), dict(godray=0.5, lx=960.0, ly=330.0)),
    (T(50), dict(shafts=0.3, godray=0.95, lx=960.0, ly=540.0)),
    (T(52), dict(shafts=0.6, warm=0.35, godray=0.75, lx=960.0, ly=540.0, bloom=1.2)),
    (T(56), dict(shafts=0.5, warm=0.6, godray=0.7)),
    (T(60), dict(shafts=0.45, warm=0.4, godray=0.6, bloom=1.1)),
]
_full = []
_cur = dict(LOOK_DEFAULT)
for _t, _d in LOOK_KEYS:
    _cur = dict(_cur, **_d)
    _full.append((_t, dict(_cur)))


def look(t):
    k = max(i for i, (tk, _) in enumerate(_full) if tk <= t)
    tk, cur = _full[k]
    prev = _full[k - 1][1] if k > 0 else cur
    u = float(smooth(0.0, 0.8, t - tk))
    out = {}
    for key, v in cur.items():
        out[key] = prev[key] + (v - prev[key]) * u
    return out


# ================================================================ text
FONT_CACHE = {}


def font(name, size):
    k = (name, size)
    if k not in FONT_CACHE:
        FONT_CACHE[k] = ImageFont.truetype(os.path.join(FONTS, name), size)
    return FONT_CACHE[k]


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


class TextCue:
    PAD = 90

    def __init__(self, idx, c):
        self.i = idx
        self.c = c
        lines = c["lines"]
        metrics = []
        for ln in lines:
            f = font(ln["font"], ln["size"])
            w = sum(f.getlength(ch) + ln["track"] for txt, _ in ln["segs"] for ch in txt) - ln["track"]
            asc, desc = f.getmetrics()
            metrics.append((f, w, asc, desc))
        gap = c["gap"] if c["gap"] is not None else int(lines[0]["size"] * 0.3)
        bw = int(max(m[1] for m in metrics)) + 2 * self.PAD
        bh = int(sum(m[2] + m[3] for m in metrics) + gap * (len(lines) - 1)) + 2 * self.PAD
        rgb = Image.new("RGB", (bw, bh), (0, 0, 0))
        msk = Image.new("L", (bw, bh), 0)
        dr, dm = ImageDraw.Draw(rgb), ImageDraw.Draw(msk)
        y = self.PAD
        for ln, (f, w, asc, desc) in zip(lines, metrics):
            x = (bw - w) / 2
            for txt, col in ln["segs"]:
                for ch in txt:
                    dr.text((x, y), ch, font=f, fill=hex_rgb(col))
                    dm.text((x, y), ch, font=f, fill=255)
                    x += f.getlength(ch) + ln["track"]
            y += asc + desc + gap
        self.rgb = np.asarray(rgb, np.float32) / 255.0
        a = np.asarray(msk, np.float32) / 255.0
        self.alpha = a
        # PIL draws colour * coverage on black: un-premultiply the antialiased edge, and bleed
        # colour outward so resizing never pulls in black fringes
        straight = self.rgb / np.maximum(a, 1e-3)[..., None]
        cov = cv2.GaussianBlur(a, (0, 0), 2) + 1e-4
        bleed = cv2.GaussianBlur(self.rgb, (0, 0), 2) / cov[..., None]
        self.rgb = np.clip(np.where(a[..., None] > 0.02, straight, bleed), 0, 1).astype(np.float32)
        self.lin = self.rgb ** 2.2
        self.glow = (cv2.GaussianBlur(a, (0, 0), 5) * 0.75 + cv2.GaussianBlur(a, (0, 0), 18) * 0.55)
        self.shadow = cv2.GaussianBlur(cv2.dilate(a, np.ones((9, 9), np.uint8)), (0, 0), 26)
        self.shadow /= self.shadow.max() + 1e-6
        self.w, self.h = bw, bh
        cx, cy = c["pos"]
        self.cx, self.cy = cx, cy
        self.x0, self.y0 = int(round(cx - bw / 2)), int(round(cy - bh / 2))
        ys, xs = np.nonzero(a > 0.5)
        r = np.random.default_rng(zlib.crc32(str(idx).encode()))
        M = min(5200 if c["style"] == "assemble" else 3200, len(xs))
        k = r.choice(len(xs), M, replace=False)
        self.px = xs[k] + r.random(M) + self.x0
        self.py = ys[k] + r.random(M) + self.y0
        self.pcol = self.lin[ys[k], xs[k]] * 1.0 + 0.15
        self.pxn = (xs[k] - xs.min()) / max(1, xs.max() - xs.min())
        self.r = r.random((M, 8))
        self.out_dur = {"fade": 0.35, "dissolve": 0.75, "cut": 0.0}[c["out"]]

    def active(self, t):
        return self.c["t0"] - 0.05 <= t <= self.c["t1"] + (0.9 if self.c["out"] == "dissolve" else 0.05)

    def state(self, t, fi):
        c = self.c
        t0, t1 = c["t0"], c["t1"]
        a, scale, blur, dy, chroma, flash = 1.0, 1.0, 0.0, 0.0, 0.0, 0.0
        st = c["style"]
        u = t - t0
        if st == "fade":
            e = ease_out(u / 0.5)
            a, blur, dy = e, 5.0 * (1 - e), 18 * (1 - e)
        elif st == "flicker":
            if u < 0.6:
                a = 1.0 if frac_hash(fi, self.i) < u / 0.6 * 1.25 else 0.08
            elif frac_hash(fi, self.i, 3) < 0.015:
                a = 0.45
        elif st == "slam":
            k = np.clip(u / 0.2, 0, 1)
            s1 = 1.70158 * 1.3
            back = 1 + (s1 + 1) * (k - 1) ** 3 + s1 * (k - 1) ** 2
            scale = 1.55 - 0.55 * back
            a = min(1.0, 0.35 + 3.0 * k)
            flash = 1.5 * math.exp(-max(0, u) / 0.18)
            chroma = 16 * math.exp(-max(0, u) / 0.16)
        elif st == "assemble":
            a = float(smooth(0.85, 1.5, u))
            flash = 1.6 * float(smooth(0.8, 1.05, u)) * math.exp(-max(0, u - 1.05) / 0.4)
        sweep = None
        if t > t1 - self.out_dur and self.out_dur > 0:
            v = (t - (t1 - self.out_dur)) / self.out_dur
            if c["out"] == "fade":
                a *= 1 - float(smooth(0, 1, v))
                blur += 4 * v
                dy -= 10 * v
            else:
                sweep = v * 1.3 - 0.15
        if c["out"] == "cut" and t >= t1:
            a = 0.0
        if t > t1 and c["out"] != "dissolve":
            a = 0.0
        return a, scale, blur, dy, chroma, flash, sweep


# ================================================================ renderer
class Renderer:
    def __init__(self):
        self.F = FM.Formations()
        self.cues = [TextCue(i, c) for i, c in enumerate(TL.CUES)]
        try:
            e = np.load(os.path.join(BUILD, "envelope.npz"))
            self.low = e["low"]
        except OSError:
            self.low = np.zeros(NF)
        self._background()
        self.grain = [np.random.default_rng(i).normal(0, 1, (H // 2, W // 2)).astype(np.float32) for i in range(6)]
        r = np.random.default_rng(5)
        nb = 520
        self.bok = np.stack([r.uniform(-3.4, 3.4, nb), r.uniform(-2.0, 2.0, nb), r.uniform(-1.0, 3.2, nb)], 1)
        self.bok_c = FM.colors(r, nb, [("b2", 3), ("b1", 2), ("ember", 1.2), ("ice", 1)])
        self.bok_r = r.random((nb, 4))
        self.spark_rng = {}
        sq = np.linspace(0, 4, 4096, dtype=np.float64)
        x = sq * sq
        y = np.clip((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0, 1) ** (1 / 2.2)
        self.lut = y.astype(np.float32)

    # ------------------------------------------------------------ static layers
    def _background(self):
        h, w = H // 4, W // 4
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        xx = (xx + 0.5) * 4
        yy = (yy + 0.5) * 4
        d = np.sqrt(((xx - 960) / 1100) ** 2 + ((yy - 760) / 800) ** 2)
        abyss, navy = lin(TL.ABYSS), lin(TL.NAVY)
        g = np.clip(1 - d, 0, 1) ** 1.6
        self.bg_q = (abyss[None, None] + (navy - abyss)[None, None] * g[..., None] * 1.6).astype(np.float32)
        self.beams = []
        r = np.random.default_rng(11)
        for j in range(7):
            ox = r.uniform(-200, 2100)
            ang = math.radians(r.uniform(68, 112))
            dx, dy = math.cos(ang), math.sin(ang)
            vx, vy = xx - ox, yy + 80
            along = vx * dx + vy * dy
            perp = np.abs(vx * dy - vy * dx)
            width = r.uniform(30, 110) * (1 + along / 900)
            b = np.exp(-(perp / width) ** 2) * np.exp(-np.maximum(along, 0) / 1100) * (along > 0)
            self.beams.append((b.astype(np.float32), r.uniform(0, 6.28), r.uniform(0.2, 0.7)))
        n = np.zeros((h, w), np.float32)
        for k, (gh, amp) in enumerate(((5, 1.0), (9, 0.5), (17, 0.25))):
            g0 = r.random((gh, int(gh * 1.8) + 2)).astype(np.float32)
            n += cv2.resize(g0, (w * 2, h), interpolation=cv2.INTER_CUBIC)[:, :w] * amp
        self.fog = np.tile(n / n.max(), (1, 2))
        vy_, vx_ = np.mgrid[0:H // 2, 0:W // 2].astype(np.float32)
        vd = np.sqrt(((vx_ - W / 4) / (W / 4)) ** 2 + ((vy_ - H / 4) / (H / 4)) ** 2)
        self.vignette = cv2.resize((1 - 0.55 * smooth(0.55, 1.45, vd)).astype(np.float32), (W, H))

    # ------------------------------------------------------------ particles
    def particle_state(self, t):
        M = TL.MORPHS
        k = max(i for i, m in enumerate(M) if m[0] <= t)
        t0, name, dur, kind = M[k]
        pB, cB, iB = self.F.get(name, t)
        if k == 0 or t >= t0 + dur:
            return pB, cB, iB
        pA, cA, iA = self.F.get(M[k - 1][1], t)
        R = self.F.R
        u = (t - t0) / dur
        p = np.clip((u - R[:, 6] * 0.35) / 0.65, 0, 1)
        if kind == "burst":
            e = 1 - (1 - p) ** 3
        elif kind == "implode":
            e = p ** 2.2
        else:
            e = p * p * (3 - 2 * p)
        pos = pA + (pB - pA) * e[:, None]
        bump = np.sin(np.pi * p)
        if kind == "burst":
            c = pA.mean(0)
            dv = pA - c
            dv /= np.linalg.norm(dv, axis=1, keepdims=True) + 1e-6
            dv += (R[:, 0:3] - 0.5) * 0.9
            pos += dv * (0.35 + 0.55 * R[:, 7:8]) * bump[:, None]
        elif kind == "flow":
            sw = np.stack([np.sin(3 * pos[:, 1] + 2 * t), np.cos(3 * pos[:, 0] + 1.7 * t), np.sin(2 * pos[:, 0] + t)], 1)
            pos += sw * 0.22 * bump[:, None]
        else:
            pos = FM.rot_z(pos, (1 - e) * 2.2 * np.where(R[:, 4] < 0.5, 1, -1))
        col = cA + (cB - cA) * e[:, None]
        inten = (iA + (iB - iA) * e) * (1 + (0.9 if kind == "burst" else 0.3) * bump)
        return pos, col, inten

    def camera(self, t):
        D = 4.0 + 0.05 * math.sin(0.1 * t)
        for a, b in TL.RISERS:
            if a <= t < b:
                D -= 0.55 * float(smooth(a, b, t)) ** 2
        D -= 0.05 * env(KICK_T, t, 0.12, KICK_V)
        A = (24 * env(IMP_T, t, 0.22) + 7 * env(HIT_T, t, 0.15)
             + 3.0 * env(TAIKO_T, t, 0.12, TAIKO_V))
        sec, _ = TL.section_at(t)
        if sec in ("drop1", "final"):
            A += 2.5 * env(KICK_T, t, 0.1, KICK_V)
        dx = A * (math.sin(91 * t) + 0.5 * math.sin(173 * t + 2))
        dy = A * (math.cos(77 * t + 1) + 0.5 * math.sin(151 * t))
        return D, dx, dy

    def project(self, pos, D, dx, dy):
        depth = D - pos[:, 2]
        ok = depth > 0.25
        depth = np.where(ok, depth, 1.0)
        sx = W / 2 + F_FOCAL * pos[:, 0] / depth + dx
        sy = H / 2 - F_FOCAL * pos[:, 1] / depth + dy
        return sx, sy, depth, ok

    @staticmethod
    def splat(buf, x, y, rgb):
        h, w, _ = buf.shape
        x = x - 0.5
        y = y - 0.5
        x0 = np.floor(x)
        y0 = np.floor(y)
        m = (x0 >= 0) & (x0 < w - 1) & (y0 >= 0) & (y0 < h - 1)
        if not m.any():
            return
        x, y, x0, y0, rgb = x[m], y[m], x0[m], y0[m], rgb[m]
        fx, fy = x - x0, y - y0
        base = y0.astype(np.int64) * w + x0.astype(np.int64)
        idx = np.concatenate([base, base + 1, base + w, base + w + 1])
        wt = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
        lo, hi = int(idx.min()), int(idx.max()) + 1
        flat = buf.reshape(-1, 3)
        for c in range(3):
            v = np.tile(rgb[:, c], 4) * wt
            flat[lo:hi, c] += np.bincount(idx - lo, weights=v, minlength=hi - lo).astype(np.float32)

    def draw_particles(self, layers, pos, col, inten, D, dx, dy, gain):
        full, half, quar = layers
        sx, sy, depth, ok = self.project(pos, D, dx, dy)
        persp = (F_FOCAL / depth) / 540.0
        coc = np.abs(1.0 / depth - 1.0 / D) * 55.0
        rad = np.sqrt((1.0 * persp) ** 2 + coc ** 2)
        I = inten * gain * np.sqrt(np.clip(persp, 0.2, 2.0)) * ok
        rgb = col * I[:, None]
        s = rad < 1.9
        b = rad >= 5.5
        m = ~s & ~b
        self.splat(full, sx[s], sy[s], rgb[s])
        self.splat(half, sx[m] / 2, sy[m] / 2, rgb[m] * 0.8)
        self.splat(quar, sx[b] / 4, sy[b] / 4, rgb[b] * (0.55 * np.clip(6.0 / rad[b], 0.15, 1.0))[:, None] * 3.2)

    # ------------------------------------------------------------ helpers for light
    def head_screen(self, name, D, dx, dy):
        off, s, _ = FM.HEADS[name]
        P = np.concatenate([FM.HEAD_LOCAL * s + np.array(off[:2]), np.full((len(FM.HEAD_LOCAL), 1), off[2])], 1)
        sx, sy, _, _ = self.project(P, D, dx, dy)
        L = np.array([[off[0] + 0.0 * s, off[1] + 0.05 * s, off[2] - 0.3]])
        lx, ly, _, _ = self.project(L, D, dx, dy)
        return np.stack([sx, sy], 1), (float(lx[0]), float(ly[0])), s

    def occluders(self, t):
        """Head silhouettes that block the back light, faded with the particle morph."""
        M = TL.MORPHS
        k = max(i for i, m in enumerate(M) if m[0] <= t)
        t0, name, dur, _ = M[k]
        u = (t - t0) / dur
        out = []
        if name in FM.HEADS:
            out.append((name, float(smooth(0.25, 0.9, u))))
        if k > 0 and M[k - 1][1] in FM.HEADS and M[k - 1][1] != name:
            out.append((M[k - 1][1], float(1 - smooth(0.0, 0.35, u))))
        return out

    def godrays(self, hdr_q, lk, D, dx, dy, t, fog):
        h, w = hdr_q.shape[:2]
        if lk["godray"] < 0.01:
            return None
        occ = np.zeros((h, w), np.float32)
        lx, ly = lk["lx"] + dx, lk["ly"] + dy
        rad = lk["brad"]
        bw = lk["blob"]
        best = 0.0
        for name, a in self.occluders(t):
            if a <= 0.01:
                continue
            poly, (hx, hy), s = self.head_screen(name, D, dx, dy)
            m = np.zeros((h, w), np.float32)
            cv2.fillPoly(m, [np.round(poly / 4 * 8).astype(np.int32)], 1.0, lineType=cv2.LINE_AA, shift=3)
            occ = np.maximum(occ, m * a)
            if a > best:
                best = a
                lx = lx + (hx - lx) * a
                ly = ly + (hy - ly) * a
                rad = rad + (s * 430 - rad) * a
                bw = bw + (1.0 - bw) * a
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        blob = np.exp(-(((xx - lx / 4) ** 2 + (yy - ly / 4) ** 2) / (rad / 4) ** 2))
        lum = hdr_q.mean(axis=2)
        if t < T(4):
            bw *= 1 + 1.4 * env(HEART_T, t, 0.16, HEART_V)
        src = (blob * bw * (0.25 + 1.1 * fog ** 2) + np.minimum(lum, 3.0) * 0.3) * (1 - occ)
        src = cv2.GaussianBlur(src, (0, 0), 1.2)
        acc = np.zeros_like(src)
        cx, cy = lx / 4, ly / 4
        wsum = 0.0
        for i in range(14):
            sc = 1.0 - 0.045 * i
            M = np.float32([[sc, 0, cx * (1 - sc)], [0, sc, cy * (1 - sc)]])
            wi = 0.93 ** i
            acc += cv2.warpAffine(src, M, (w, h), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP) * wi
            wsum += wi
        acc /= wsum
        warm = lk["warm"]
        colr = lin(TL.L30) * (1 - warm) + lin("#F6C08A") * warm
        return acc[..., None] * colr[None, None].astype(np.float32) * lk["godray"] * 0.4, occ

    # ------------------------------------------------------------ fx
    def sparks(self, full, half, t):
        for times, n, rmax, base in ((IMP_T, 1100, 1500, 1.0), (HIT_T, 380, 750, 0.7)):
            for i, te in enumerate(times):
                tau = t - te
                if tau < 0 or tau > 1.6:
                    continue
                key = (rmax, i)
                if key not in self.spark_rng:
                    r = np.random.default_rng(zlib.crc32(repr(key).encode()))
                    ang = r.uniform(0, 2 * np.pi, n)
                    sp = r.uniform(150, 1.15 * rmax, n) * r.random(n) ** 0.5
                    c = FM.colors(r, n, [("white", 2), ("ice", 3), ("ember_hi", 2), ("gold", 1)])
                    self.spark_rng[key] = (np.cos(ang) * sp, np.sin(ang) * sp, c, r.uniform(0.3, 1.0, n))
                vx, vy, c, k = self.spark_rng[key]
                ox, oy = (960.0, 540.0) if rmax > 1000 else (960.0, 380.0)
                for j, lag in enumerate((0.0, 0.012, 0.024, 0.036)):
                    tt = max(0.0, tau - lag)
                    f = (1 - math.exp(-2.4 * tt)) / 2.4
                    x = ox + vx * f
                    y = oy + vy * f + 140 * tt * tt
                    I = base * 2.2 * math.exp(-tau / 0.38) * k * (1 - 0.22 * j)
                    self.splat(full, x, y, c * I[:, None])

    def rings(self, full, t):
        for times, rmax, I0, th in ((IMP_T, 1500, 1.4, 3), (HIT_T, 700, 0.6, 2)):
            tau, i = since(times, t)
            if tau > 0.9:
                continue
            r = rmax * (1 - math.exp(-tau * 4.5))
            I = I0 * math.exp(-tau / 0.18)
            cy = 540 if rmax > 1000 else 380
            col = tuple(float(v) * I for v in lin(TL.L30))
            cv2.circle(full, (960 * 8, cy * 8), int(r * 8), col, int(th + 6 * tau), cv2.LINE_AA, 3)
            colw = tuple(float(v) * I * 0.25 for v in lin(TL.L40))
            cv2.circle(full, (960 * 8, cy * 8), int(r * 0.95 * 8), colw, int(8 + 14 * tau), cv2.LINE_AA, 3)

    def chain_axis(self, full, t):
        if not (T(12) - 0.3 <= t < T(22) + 0.4):
            return
        a = float(smooth(T(12) - 0.3, T(12) + 0.4, t) * (1 - smooth(T(22), T(22) + 0.4, t)))
        y = 688
        xs = [1620 - k * 1320 / 9 for k in range(10)]
        bar = (t - T(12)) / TL.BAR
        k = int(np.clip(math.floor(bar), 0, 9))
        u = float(ease_out((bar - k) / 0.15)) if k > 0 else 1.0
        mx = xs[k - 1] + (xs[k] - xs[k - 1]) * u if k > 0 else xs[0]
        base = lin(TL.L50) * 0.35 * a
        cv2.line(full, (int(300 * 8), y * 8), (int(1620 * 8), y * 8), tuple(map(float, base)), 2, cv2.LINE_AA, 3)
        for i, x in enumerate(xs):
            lit = i <= k
            c = (lin(TL.L30) * 0.9 if lit else lin(TL.L60) * 0.35) * a
            cv2.line(full, (int(x * 8), (y - 10) * 8), (int(x * 8), (y + 10) * 8), tuple(map(float, c)), 2, cv2.LINE_AA, 3)
        hot = lin(TL.EMBER_HI) * 3.0 * a
        cv2.line(full, (int(mx * 8), y * 8), (int(1620 * 8), y * 8), tuple(map(float, lin(TL.L40) * 0.8 * a)), 3, cv2.LINE_AA, 3)
        cv2.circle(full, (int(mx * 8), y * 8), 7 * 8, tuple(map(float, hot)), -1, cv2.LINE_AA, 3)

    def bokeh(self, quar, t, D, dx, dy, level):
        r = self.bok_r
        p = self.bok + 0.12 * np.sin(0.25 * t + 6.28 * r[:, :3])
        sx, sy, depth, ok = self.project(p, D, dx * 1.6, dy * 1.6)
        I = level * (0.5 + 0.5 * np.sin(0.8 * t + 6.28 * r[:, 3])) * ok * 0.16
        self.splat(quar, sx / 4, sy / 4, self.bok_c * I[:, None])

    # ------------------------------------------------------------ text
    def text_pass(self, hdr, t, fi):
        crisp = []
        for cue in self.cues:
            if not cue.active(t):
                continue
            a, scale, blur, dy, chroma, flash, sweep = cue.state(t, fi)
            c = cue.c
            colmask = None
            if sweep is not None:
                xn = np.linspace(0, 1, cue.w, dtype=np.float32)
                colmask = np.clip((xn - sweep) / 0.12, 0, 1)[None, :]
            if c["style"] == "assemble":
                self.assemble_particles(hdr, cue, t)
            if sweep is not None:
                self.dissolve_particles(hdr, cue, t)
            if a <= 0.003:
                continue
            alpha, glow, shadow, rgb, lin_c = cue.alpha, cue.glow, cue.shadow, cue.rgb, cue.lin
            if colmask is not None:
                alpha, glow, shadow = alpha * colmask, glow * colmask, shadow * colmask
            if blur > 0.4:
                alpha = cv2.GaussianBlur(alpha, (0, 0), blur)
            bw, bh = cue.w, cue.h
            if abs(scale - 1) > 1e-3:
                nw, nh = int(bw * scale), int(bh * scale)
                alpha = cv2.resize(alpha, (nw, nh))
                glow = cv2.resize(glow, (nw, nh))
                shadow = cv2.resize(shadow, (nw, nh))
                rgb = cv2.resize(rgb, (nw, nh))
                lin_c = cv2.resize(lin_c, (nw, nh))
                bw, bh = nw, nh
            x0 = int(round(cue.cx - bw / 2))
            y0 = int(round(cue.cy - bh / 2 + dy))
            X0, Y0, X1, Y1 = max(0, x0), max(0, y0), min(W, x0 + bw), min(H, y0 + bh)
            if X1 <= X0 or Y1 <= Y0:
                continue
            sl = (slice(Y0 - y0, Y1 - y0), slice(X0 - x0, X1 - x0))
            reg = hdr[Y0:Y1, X0:X1]
            reg *= (1 - 0.72 * a * shadow[sl])[..., None]
            g = c["glow"] * (1 + flash) * a
            reg += lin_c[sl] * (glow[sl] * g * 0.55)[..., None]
            reg += lin_c[sl] * (alpha[sl] * a * 0.35)[..., None]
            crisp.append((X0, Y0, X1, Y1, rgb[sl], alpha[sl] * a, chroma))
        return crisp

    def assemble_particles(self, hdr, cue, t):
        u = t - cue.c["t0"]
        r = cue.r
        M = len(cue.px)
        ang = r[:, 0] * 2 * np.pi
        rad = 260 + 900 * r[:, 1]
        sx = 960 + np.cos(ang) * rad * 1.4
        sy = 330 + np.sin(ang) * rad * 0.7
        d = r[:, 2] * 0.5
        p = np.clip((u - d) / 0.85, 0, 1)
        e = ease_out(p)
        bump = np.sin(np.pi * p)
        tx, ty = cue.px, cue.py
        nx, ny = -(ty - sy), (tx - sx)
        nn = np.sqrt(nx ** 2 + ny ** 2) + 1e-6
        sw = (r[:, 3] - 0.5) * 320 * bump
        x = sx + (tx - sx) * e + nx / nn * sw
        y = sy + (ty - sy) * e + ny / nn * sw
        land = p >= 1
        tw = 0.5 + 0.5 * np.sin(9 * t + 30 * r[:, 4])
        I = np.where(land, 0.22 + 0.35 * tw * (r[:, 5] < 0.35) + 1.4 * np.exp(-(u - d - 0.85) / 0.12), 1.3) * (p > 0)
        t1 = cue.c["t1"]
        if t > t1 - cue.out_dur:
            I = I * 0.0
        self.splat(hdr, x, y, cue.pcol * I[:, None])

    def dissolve_particles(self, hdr, cue, t):
        t1, od = cue.c["t1"], cue.out_dur
        ts = t1 - od + (cue.pxn + 0.15) / 1.3 * od
        tau = t - ts
        m = tau > 0
        if not m.any():
            return
        r = cue.r[m]
        tau = tau[m]
        vx = (r[:, 0] - 0.5) * 120 + 40
        vy = -(30 + 160 * r[:, 1])
        sw = 18 * np.sin(5 * tau + 6.28 * r[:, 2])
        x = cue.px[m] + vx * tau + sw
        y = cue.py[m] + vy * tau - 60 * tau * tau
        I = 1.6 * np.exp(-tau / (0.25 + 0.35 * r[:, 3]))
        self.splat(hdr, x, y, cue.pcol[m] * I[:, None])

    # ------------------------------------------------------------ frame
    def frame(self, fi):
        t = fi / FPS
        lk = look(t)
        sec, _ = TL.section_at(t)
        D, dx, dy = self.camera(t)

        full = np.zeros((H, W, 3), np.float32)
        half = np.zeros((H // 2, W // 2, 3), np.float32)
        quar = np.zeros((H // 4, W // 4, 3), np.float32)

        # global particle level
        gain = 1.0
        if t < T(4):
            gain = 0.2 + 0.65 * float(smooth(0, 7.4, t)) + 0.6 * env(HEART_T, t, 0.14, HEART_V)
        if any(a <= t < b for a, b in TL.SILENCES):
            gain = 0.18
        gain *= 1 - float(smooth(T(62), T(64) - 0.2, t))
        gain *= 0.92 + 0.16 * float(self.low[min(fi, len(self.low) - 1)])
        gain *= 1 + 0.25 * env(KICK_T, t, 0.1, KICK_V) + 0.15 * env(SNARE_T, t, 0.08, SNARE_V)

        pos, col, inten = self.particle_state(t)
        self.draw_particles((full, half, quar), pos, col, inten, D, dx, dy, gain)
        self.bokeh(quar, t, D, dx, dy, lk["dust"] * (1 - float(smooth(T(62), T(64), t))))
        if not any(a <= t < b for a, b in TL.SILENCES):
            self.sparks(full, half, t)
            self.rings(full, t)
        self.chain_axis(full, t)

        # background: gradient + light shafts through drifting fog
        silent = any(a <= t < b for a, b in TL.SILENCES)
        bgm = 0.15 if silent else (1 - float(smooth(T(62, 2), T(64), t)))
        if t < T(4):
            bgm *= 0.35 + 0.65 * float(smooth(0, 8, t))
        h4, w4 = H // 4, W // 4
        off = int(t * 9) % w4
        fog = self.fog[:, off:off + w4]
        sh = np.zeros((h4, w4), np.float32)
        beat = env(KICK_T, t, 0.15, KICK_V) + env(TAIKO_T, t, 0.2, TAIKO_V)
        for b, ph, sp in self.beams:
            sh += b * (0.55 + 0.45 * math.sin(sp * t + ph))
        sh *= (0.35 + 0.9 * fog) * lk["shafts"] * (1 + 0.5 * beat)
        warm = lk["warm"]
        sc = lin(TL.L40) * (1 - warm) + lin(TL.EMBER) * warm
        bgq = self.bg_q * (lk["bgl"] * 1.4) + sh[..., None] * sc[None, None].astype(np.float32) * 0.09
        # quarter-res light layer: bokeh (blurred) + background + god rays + flash
        q = cv2.GaussianBlur(quar, (0, 0), 2.2) + bgq * bgm

        # god rays from the particle light, eclipsed by head silhouettes
        q_src = cv2.resize(full, (w4, h4), interpolation=cv2.INTER_AREA) * 4 + q
        gr = self.godrays(q_src, lk, D, dx, dy, t, fog)
        if gr is not None:
            rays, occ = gr
            q += rays * (0.25 if silent else 1.0) * (1 - float(smooth(T(62), T(63, 3), t)))
            q *= (1 - 0.7 * occ)[..., None]

        ti, _ = since(IMP_T, t)
        th, _ = since(HIT_T, t)
        flash = 0.9 * math.exp(-ti / 0.045) + 0.06 * math.exp(-th / 0.04)
        if flash > 0.004:
            q += lin(TL.L10)[None, None].astype(np.float32) * flash * 0.35

        # compose layers
        hdr = full
        hdr += cv2.resize(cv2.GaussianBlur(half, (0, 0), 1.0), (W, H), interpolation=cv2.INTER_LINEAR)
        hdr += cv2.resize(q, (W, H), interpolation=cv2.INTER_LINEAR)

        crisp = self.text_pass(hdr, t, fi)

        # bloom
        b2 = cv2.resize(hdr, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        acc = np.zeros_like(b2)
        lvl = b2
        for i, wgt in enumerate((0.55, 0.45, 0.4, 0.35, 0.3, 0.25)):
            if i:
                lvl = cv2.pyrDown(lvl)
            bl = cv2.GaussianBlur(lvl, (0, 0), 1.6)
            acc += cv2.resize(bl, (W // 2, H // 2), interpolation=cv2.INTER_LINEAR) * wgt
        bloom = lk["bloom"] * (1 + 0.35 * beat)
        hdr += cv2.resize(acc, (W, H), interpolation=cv2.INTER_LINEAR) * (0.42 * bloom)

        # tone map (ACES fit) + gamma + vignette
        ex = 1.0 + 0.12 * env(KICK_T, t, 0.1, KICK_V)
        vig = self.vignette[..., None]
        x = hdr
        idx = ne.evaluate("where(x*ex > 16, 4095, sqrt(where(x < 0, 0, x*ex)) * 1023.75)").astype(np.int32)
        out = self.lut[idx]
        out *= vig
        g = self.grain[fi % len(self.grain)]
        out += cv2.resize(g, (W, H), interpolation=cv2.INTER_NEAREST)[..., None] * 0.006

        # crisp text on top
        for X0, Y0, X1, Y1, rgb, al, chroma in crisp:
            reg = out[Y0:Y1, X0:X1]
            al3 = al[..., None]
            if chroma > 0.6:
                k = int(round(chroma))
                sh_r = np.roll(al, k, axis=1)
                sh_b = np.roll(al, -k, axis=1)
                reg[..., 0] = reg[..., 0] * (1 - sh_r) + rgb[..., 0] * sh_r
                reg[..., 1] = reg[..., 1] * (1 - al) + rgb[..., 1] * al
                reg[..., 2] = reg[..., 2] * (1 - sh_b) + rgb[..., 2] * sh_b
            else:
                reg[:] = reg * (1 - al3) + rgb * al3

        # impact chromatic aberration
        ca = 9 * env(IMP_T, t, 0.12) + 3 * env(HIT_T, t, 0.1)
        if ca > 0.7:
            k = int(round(ca))
            out[..., 0] = np.roll(out[..., 0], k, axis=1)
            out[..., 2] = np.roll(out[..., 2], -k, axis=1)

        # glitch slices in the quantum section
        for tg in TL.GLITCHES:
            if 0 <= t - tg < 0.2:
                r = np.random.default_rng(fi)
                for _ in range(9):
                    y0 = int(r.integers(0, H - 40))
                    hh = int(r.integers(6, 60))
                    sft = int(r.integers(-90, 90))
                    out[y0:y0 + hh] = np.roll(out[y0:y0 + hh], sft, axis=1)
                    out[y0:y0 + hh, :, int(r.integers(0, 3))] *= 0.4
                k = int(r.integers(6, 16))
                out[..., 0] = np.roll(out[..., 0], k, axis=1)
                break

        return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


# ================================================================ driver
_R = None


def _init():
    global _R
    cv2.setNumThreads(1)
    ne.set_num_threads(1)
    _R = Renderer()


def _render(fi):
    return _R.frame(fi).tobytes()


def stills(times):
    os.makedirs(os.path.join(BUILD, "stills"), exist_ok=True)
    _init()
    for tt in times:
        fi = int(round(tt * FPS))
        t0 = time.time()
        img = _R.frame(fi)
        p = os.path.join(BUILD, "stills", f"f{fi:05d}.png")
        Image.fromarray(img).save(p)
        print(f"{p}  ({time.time() - t0:.2f}s)")


def video(out, workers, a, b, crf, preset):
    audio = os.path.join(BUILD, "score.wav")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-"]
    if a == 0 and b == NF and os.path.exists(audio):
        cmd += ["-i", audio, "-c:a", "aac", "-b:a", "256k", "-shortest"]
    cmd += ["-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
            "-tune", "grain", "-movflags", "+faststart", out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    with Pool(workers, initializer=_init) as pool:
        for i, buf in enumerate(pool.imap(_render, range(a, b), chunksize=4)):
            ff.stdin.write(buf)
            if i % 150 == 0:
                el = time.time() - t0
                print(f"frame {a + i}/{b}  {el:.0f}s  eta {el / (i + 1) * (b - a - i - 1):.0f}s", flush=True)
    ff.stdin.close()
    ff.wait()
    print("wrote", out, f"in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--stills")
    ap.add_argument("--out", default=os.path.join(BUILD, "determined.mp4"))
    ap.add_argument("--workers", type=int, default=3)
    ap.add_argument("--range", default=f"0:{NF}")
    ap.add_argument("--crf", type=int, default=19)
    ap.add_argument("--preset", default="medium")
    args = ap.parse_args()
    if args.stills:
        stills([float(x) for x in args.stills.split(",")])
    else:
        a, b = (int(x) for x in args.range.split(":"))
        video(args.out, args.workers, a, b, args.crf, args.preset)
