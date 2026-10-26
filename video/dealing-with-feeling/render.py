"""Renders the picture for the video, cue-locked to timeline.py.

Look: darkness + god rays from above (light and shadow), ~12k fluorescent
particles that assemble into titles, numbers and icons, glowing type,
anamorphic flares, shockwaves and camera punches on every impact.
Colours come only from the Loyel gradient-blue palette (plus white).

  python3 render.py video build/video.mp4         # full render (no audio)
  python3 render.py preview 8.5 42 60 ...         # PNG stills into build/
"""
import math
import os
import subprocess
import sys
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import timeline as TL
from timeline import W, H, FPS, LOYEL, rgb

cv2.setNumThreads(1)
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_FILES = {
    "sans4": "NotoSansSC-400.ttf", "sans7": "NotoSansSC-700.ttf",
    "sans9": "NotoSansSC-900.ttf", "serif9": "NotoSerifSC-900.ttf",
    "cinzel7": "Cinzel-700.ttf", "cinzel9": "Cinzel-900.ttf",
    "mont5": "Montserrat-500.ttf", "mont7": "Montserrat-700.ttf",
}
CX, CY = W / 2, H / 2
QW, QH = W // 4, H // 4
HW, HH = W // 2, H // 2

C = {k: np.array(rgb(v), np.float32) for k, v in LOYEL.items()}
C_WHITE = np.ones(3, np.float32)

rng = np.random.default_rng(11)
NP = 12000


# ====================================================================== utils
def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def smooth(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def ease_io3(x):
    x = clamp01(x)
    return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)


def ease_out_expo(x):
    x = clamp01(x)
    return np.where(x >= 1, 1.0, 1 - 2.0 ** (-10 * x))


def ease_out_back(x, s=1.9):
    x = clamp01(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def bump(tau, tau0):
    """Fast attack / exponential release pulse shape, peak 1 at tau0."""
    tau = np.maximum(tau, 0)
    return (tau / tau0) * np.exp(1 - tau / tau0)


_fonts = {}


def font(key, size):
    k = (key, size)
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(os.path.join(HERE, "fonts", FONT_FILES[key]), size)
    return _fonts[k]


def text_canvas(text, fkey, size, spacing=0, pad=0):
    """Rasterise text; returns float mask cropped to ink + pad, ink box."""
    f = font(fkey, size)
    total = sum(f.getlength(ch) for ch in text) + spacing * max(len(text) - 1, 0)
    cw, ch_ = int(total + size * 2), int(size * 2.2)
    img = Image.new("L", (cw, ch_), 0)
    d = ImageDraw.Draw(img)
    x = size * 0.5
    base = size * 1.5
    if spacing:
        for c in text:
            d.text((x, base), c, font=f, fill=255, anchor="ls")
            x += f.getlength(c) + spacing
    else:
        d.text((x, base), text, font=f, fill=255, anchor="ls")
    bb = img.getbbox()
    if bb is None:
        bb = (0, 0, 1, 1)
    img = img.crop((bb[0] - pad, bb[1] - pad, bb[2] + pad, bb[3] + pad))
    return np.asarray(img, np.float32) / 255.0, (bb[2] - bb[0], bb[3] - bb[1])


def screen_mask_text(text, fkey, size, cx, cy, spacing=0):
    m, (iw, ih) = text_canvas(text, fkey, size, spacing, pad=0)
    full = np.zeros((H, W), np.float32)
    x0, y0 = int(round(cx - iw / 2)), int(round(cy - ih / 2))
    paste_max(full, m, x0, y0)
    return full


def paste_max(dst, src, x0, y0):
    h, w = src.shape[:2]
    xa, ya = max(x0, 0), max(y0, 0)
    xb, yb = min(x0 + w, dst.shape[1]), min(y0 + h, dst.shape[0])
    if xa >= xb or ya >= yb:
        return
    dst[ya:yb, xa:xb] = np.maximum(dst[ya:yb, xa:xb], src[ya - y0:yb - y0, xa - x0:xb - x0])


def sample_mask(mask, n, jitter=0.7, edge_bias=0.0):
    ys, xs = np.nonzero(mask > 0.45)
    wts = None
    if edge_bias > 0:
        lap = np.abs(cv2.Laplacian(mask, cv2.CV_32F))
        wts = (1 - edge_bias) + edge_bias * 4 * lap[ys, xs]
        wts = wts / wts.sum()
    idx = rng.choice(len(xs), n, replace=len(xs) < n, p=wts)
    pts = np.stack([xs[idx], ys[idx]], 1).astype(np.float32)
    return pts + rng.uniform(-jitter, jitter, pts.shape).astype(np.float32)


# ====================================================================== particles
U1, U2, U3, U4 = (rng.random(NP).astype(np.float32) for _ in range(4))
G1, G2, G3 = (rng.standard_normal(NP).astype(np.float32) for _ in range(3))
PH = (rng.random(NP) * 2 * np.pi).astype(np.float32)
DL = rng.random(NP).astype(np.float32) ** 1.4          # per-particle delay
CV = rng.uniform(-0.28, 0.28, NP).astype(np.float32)   # path curvature
pal_keys = [10, 30, 40, 50, 60]
pal_p = [0.12, 0.30, 0.28, 0.20, 0.10]
PCOL = np.stack([C[k] for k in rng.choice(pal_keys, NP, p=pal_p)])
SPARK = np.where(rng.random(NP) < 0.05, 2.6, 1.0).astype(np.float32)
TWK_F = rng.uniform(1.5, 5.0, NP).astype(np.float32)


def twinkle(t, depth=0.3):
    return 1 - depth + depth * np.sin(TWK_F * t + PH)


def polar(cx, cy, r, a):
    return np.stack([cx + r * np.sin(a), cy - r * np.cos(a)], 1).astype(np.float32)


# --- static targets
TXT_TITLE = sample_mask(screen_mask_text("DEALING WITH FEELING", "cinzel9", 112, CX, 440), NP, 1.0)
TXT_N = {
    "n100": sample_mask(screen_mask_text("100%", "mont7", 330, CX, 400), NP, 1.0),
    "n13": sample_mask(screen_mask_text("1/3", "mont7", 340, CX, 400), NP, 1.0),
    "n10": sample_mask(screen_mask_text("10%", "mont7", 340, CX, 400), NP, 1.0),
}

NEB = np.stack([G1 * 520, G2 * 240], 1).astype(np.float32)
NEB_B = (0.18 + 0.32 * U3).astype(np.float32)

# Fibonacci sphere
_i = np.arange(NP) + 0.5
SPH_PHI = np.arccos(1 - 2 * _i / NP).astype(np.float32)
SPH_TH = (np.pi * (1 + 5 ** 0.5) * _i).astype(np.float32)

# heart
_ht = np.linspace(0, 2 * np.pi, 2000)
_hx = 16 * np.sin(_ht) ** 3
_hy = -(13 * np.cos(_ht) - 5 * np.cos(2 * _ht) - 2 * np.cos(3 * _ht) - np.cos(4 * _ht))
HEART_POLY = np.stack([_hx, _hy], 1) * 12.0


def heart_points():
    img = Image.new("L", (800, 800), 0)
    poly = [(400 + x, 400 + y) for x, y in HEART_POLY]
    ImageDraw.Draw(img).polygon(poly, fill=255)
    fill = sample_mask(np.asarray(img, np.float32) / 255, NP, 1.0) - 400
    k = (U1 * (len(HEART_POLY) - 1)).astype(int)
    outline = HEART_POLY[k].astype(np.float32) + np.stack([G1, G2], 1) * 3.0
    sel = (U2 < 0.55)[:, None]
    return np.where(sel, outline, fill).astype(np.float32), np.where(sel[:, 0], 0.6, 0.32)


HEART_P, HEART_B = heart_points()

# grid lattice 9x9
_node = (np.arange(NP) % 81)
GRID_P = np.stack([(_node % 9 - 4) * 54.0, (_node // 9 - 4) * 54.0], 1).astype(np.float32)
GRID_P += np.stack([G1, G2], 1) * 2.6


def square_perim(side, s):
    """s in [0,4) -> point on square perimeter centred at 0."""
    s = s % 4
    e = np.floor(s)
    f = s - e
    h = side / 2
    x = np.select([e == 0, e == 1, e == 2, e == 3], [-h + f * side, h * np.ones_like(f), h - f * side, -h * np.ones_like(f)])
    y = np.select([e == 0, e == 1, e == 2, e == 3], [-h * np.ones_like(f), -h + f * side, h * np.ones_like(f), h - f * side])
    return np.stack([x, y], 1)


def rot(P, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([P[:, 0] * c - P[:, 1] * s, P[:, 0] * s + P[:, 1] * c], 1)


# stairs
_steps_n = 5
_sw, _sh = 78.0, 66.0
_x0, _y0 = -230.0, 200.0
_stair_pts = [(_x0, _y0)]
for k in range(_steps_n):
    x, y = _stair_pts[-1]
    _stair_pts.append((x, y - _sh))
    _stair_pts.append((x + _sw, y - _sh))
STAIR_POLY = np.array(_stair_pts, np.float32)
_seg_len = np.hypot(*np.diff(STAIR_POLY, axis=0).T)
_cum = np.concatenate([[0], np.cumsum(_seg_len)])


def stair_points():
    s = U1 * _cum[-1]
    seg = np.clip(np.searchsorted(_cum, s) - 1, 0, len(_seg_len) - 1)
    f = (s - _cum[seg]) / _seg_len[seg]
    P = STAIR_POLY[seg] + (STAIR_POLY[seg + 1] - STAIR_POLY[seg]) * f[:, None]
    P = P + np.stack([G1, G2], 1) * 3.0
    step_idx = np.clip(seg // 2, 0, _steps_n - 1)
    return P.astype(np.float32), step_idx


STAIR_P, STAIR_STEP = stair_points()
_star_c = STAIR_POLY[-1] + np.array([10, -120], np.float32)
_sa = np.linspace(0, 2 * np.pi, 11)[:-1]
_sr = np.where(np.arange(10) % 2 == 0, 62, 26)
STAR_POLY = np.stack([np.sin(_sa) * _sr, -np.cos(_sa) * _sr], 1) + _star_c
STAR_POLY = np.vstack([STAR_POLY, STAR_POLY[:1]])
_ssl = np.hypot(*np.diff(STAR_POLY, axis=0).T)
_scum = np.concatenate([[0], np.cumsum(_ssl)])
_ss = U3 * _scum[-1]
_sseg = np.clip(np.searchsorted(_scum, _ss) - 1, 0, len(_ssl) - 1)
_sf = (_ss - _scum[_sseg]) / _ssl[_sseg]
STAR_P = (STAR_POLY[_sseg] + (STAR_POLY[_sseg + 1] - STAR_POLY[_sseg]) * _sf[:, None]
          + np.stack([G2, G3], 1) * 2.5).astype(np.float32)
IS_STAR = U4 < 0.22


# --- formation functions: f(t) -> (P (NP,2), B (NP,))
def f_nebula(t):
    P = rot(NEB, 0.035 * t) * np.array([1.0, 0.55], np.float32)
    P = P + np.stack([np.sin(t * 0.3 + PH) * 6, np.cos(t * 0.27 + PH) * 6], 1)
    return P + [CX, CY], NEB_B * twinkle(t, 0.4)


def f_core(t):
    r = 6 + 10 * U1 ** 2
    a = PH + t * (2 + 3 * U2)
    P = np.stack([CX + r * np.sin(a), CY + r * np.cos(a) * 0.9], 1)
    return P.astype(np.float32), np.full(NP, 0.22, np.float32)


def f_title(t):
    P = TXT_TITLE + np.stack([np.sin(t * 2 + PH), np.cos(t * 1.7 + PH)], 1) * 0.8
    return P, (0.5 * twinkle(t, 0.35)).astype(np.float32)


def f_num(key):
    def f(t):
        P = TXT_N[key] + np.stack([np.sin(t * 2 + PH), np.cos(t * 1.7 + PH)], 1) * 0.8
        return P, (0.55 * twinkle(t, 0.35)).astype(np.float32)
    return f


def f_ring(t):
    a = U1 * 2 * np.pi + 0.15 * t
    r = 420 + G1 * 5
    inner = U2 < 0.18
    r = np.where(inner, 120 + 290 * U3, r)
    P = polar(CX, CY + 20, r, a)
    return P, np.where(inner, 0.12, 0.5).astype(np.float32) * twinkle(t, 0.3)


def f_sphere(t):
    tt = max(t - 32.0, 0.0)
    ang = 0.3 * tt + 2.5 * 7 / 3 * (min(tt, 7.5) / 7) ** 3
    R = 430 - 120 * smooth(tt / 7.3)
    x = R * np.sin(SPH_PHI) * np.cos(SPH_TH + ang)
    y = R * np.cos(SPH_PHI)
    z = R * np.sin(SPH_PHI) * np.sin(SPH_TH + ang)
    tilt = 0.38
    y, z = y * math.cos(tilt) - z * math.sin(tilt), y * math.sin(tilt) + z * math.cos(tilt)
    s = 1400 / (1400 - z)
    P = np.stack([CX + x * s, CY + y * s], 1)
    B = 0.12 + 0.3 * (z + R) / (2 * R)
    return P.astype(np.float32), B.astype(np.float32) * twinkle(t, 0.25)


SEG = (np.arange(NP) % 7)
SEG_HALF = np.pi / 7 - 0.07


def wheel_core(t, R, lit, rot_=0.0, flow=0.05):
    pos = (U1 + flow * t) % 1.0
    a = 2 * np.pi * SEG / 7 + (pos * 2 - 1) * SEG_HALF + rot_
    inner = U2 < 0.2
    r = np.where(inner, R * 0.76 + G2 * 3, R + G1 * 9)
    P = polar(TL.WHEEL_C[0], TL.WHEEL_C[1], r, a)
    B = lit[SEG] * np.where(inner, 0.35, 1.0)
    return P, (B * twinkle(t, 0.3)).astype(np.float32)


def f_wheel(t):
    lit = np.array([0.16 + (0.55 + 1.3 * math.exp(-(t - ti) / 0.25) if t >= ti else 0)
                    for ti in TL.WHEEL_IGNITE], np.float32)
    spin = 3.2 * max(t - 47.0, 0) ** 2
    return wheel_core(t, TL.WHEEL_R, lit, spin)


def f_wheelspin(t):
    tt = max(t - 116.0, 0)
    spin = 0.6 * tt + 1.4 * tt ** 2
    R = TL.WHEEL_R - 90 * smooth(tt / 3.4)
    return wheel_core(t, R, np.full(7, 0.6, np.float32), spin)


def f_wheelfull(t):
    return wheel_core(t, TL.WHEEL_R, np.full(7, 0.62, np.float32))


def f_dissolve(t):
    P0, B0 = f_wheelfull(TL.FINAL_HIT)
    tau = max(t - TL.FINAL_HIT, 0)
    d = P0 - TL.WHEEL_C
    d = d / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-3)
    dist = (500 + 900 * U3) * (1 - math.exp(-tau / 0.7))
    P = P0 + d * dist[:, None] + np.stack([G1 * 30, -40 * tau - G2 * 20], 1) * min(tau, 1)
    return P.astype(np.float32), B0 * math.exp(-tau / 1.0) * (1 + 1.5 * math.exp(-tau / 0.12))


def icon_wrap(fn):
    def f(t):
        P, B = fn(t)
        return (P + np.array(TL.ICON_C, np.float32)).astype(np.float32), B
    return f


def area_t0(t):
    k = int(np.clip((t - 48.0) // 8, 0, 6))
    return TL.AREA_T0[k]


def point_steps(t, t0, dur=0.35):
    return sum(float(smooth((t - (t0 + o)) / dur)) for o in TL.POINT_OFFSETS)


def f_heart(t):
    t0 = TL.AREA_T0[0]
    pulse = 1 + 0.06 * sum(float(bump(t - (t0 + o), 0.08)) for o in TL.POINT_OFFSETS)
    pulse += 0.025 * float(bump((t - t0) % 0.5, 0.06))
    return HEART_P * pulse, HEART_B * twinkle(t, 0.3)


def f_chaos(t):
    x = 300 * np.sin(U1 * 6.28 + t * (0.7 + U2)) * np.cos(U3 * 3 + t * (0.5 + 0.4 * U4))
    y = 260 * np.sin(U2 * 6.28 + t * (0.6 + U3)) * np.cos(U4 * 3 + t * 0.45)
    return np.stack([x, y], 1).astype(np.float32), (0.55 * twinkle(t, 0.5)).astype(np.float32)


def f_grid(t):
    P = GRID_P + np.stack([np.sin(t * 2 + PH), np.cos(t * 2.3 + PH)], 1) * 0.7
    return P, (0.55 * twinkle(t, 0.25)).astype(np.float32)


def f_breath(t):
    t0 = TL.AREA_T0[2]
    ph = 2 * np.pi * (t - t0) / 4.0
    R = 175 * (1 + 0.3 * (0.5 - 0.5 * math.cos(ph)))
    a = U1 * 2 * np.pi + 0.2 * t
    grp = np.where(U2 < 0.5, 0, np.where(U2 < 0.8, 1, 2))
    r = np.select([grp == 0, grp == 1, grp == 2],
                  [R + G1 * 4, np.abs(G2) * R * 0.33, R * 1.28 + G3 * 6])
    P = polar(0, 0, r, a)
    B = np.select([grp == 0, grp == 1, grp == 2], [0.62, 0.22, 0.14])
    return P, (B * twinkle(t, 0.3)).astype(np.float32)


def f_frame(t):
    t0 = TL.AREA_T0[3]
    st = point_steps(t, t0)
    a1 = math.pi / 4 * st + 0.05 * (t - t0)
    outer = U2 < 0.6
    P1 = rot(square_perim(380, U1 * 4), a1)
    P2 = rot(square_perim(230, U1 * 4), -1.5 * a1 + math.pi / 4)
    P = np.where(outer[:, None], P1, P2) + np.stack([G1, G2], 1) * 2.5
    return P.astype(np.float32), np.where(outer, 0.55, 0.42).astype(np.float32) * twinkle(t, 0.3)


def f_orbit(t):
    t0 = TL.AREA_T0[4]
    st = point_steps(t, t0, 0.5)
    d = 180 - 40 * st
    phi = 0.8 * (t - t0)
    c1 = np.array([math.cos(phi), math.sin(phi)]) * d
    c2 = -c1
    grp = np.where(U2 < 0.42, 0, np.where(U2 < 0.84, 1, 2))
    a = U1 * 2 * np.pi + 0.6 * t
    circ = np.stack([np.sin(a), -np.cos(a)], 1) * (108 + G1[:, None] * 3)
    s = (U3 + 0.55 * t) % 1.0
    line = c1 + (c2 - c1) * s[:, None]
    perp = np.array([-(c2 - c1)[1], (c2 - c1)[0]]) / (np.linalg.norm(c2 - c1) + 1e-6)
    line = line + perp * (np.sin(s * 2 * np.pi * 2 + t * 4) * 14)[:, None] + np.stack([G1, G2], 1) * 2
    P = np.select([grp[:, None] == 0, grp[:, None] == 1, grp[:, None] == 2],
                  [circ + c1, circ + c2, line])
    B = np.select([grp == 0, grp == 1, grp == 2], [0.55, 0.55, 0.3 + 0.25 * st / 3])
    return P.astype(np.float32), (B * twinkle(t, 0.3)).astype(np.float32)


BAR_J = (np.arange(NP) % 3)
BAR_OUT = U4 < 0.16


def f_bars(t):
    t0 = TL.AREA_T0[5]
    lvl = np.array([0.1 + 0.9 * float(ease_io3((t - (t0 + o)) / 0.6)) for o in TL.POINT_OFFSETS],
                   np.float32)
    bx = (BAR_J - 1) * 150.0
    bw, bh, bottom = 84.0, 400.0, 200.0
    u = U1
    P_in = np.stack([bx + (U2 - 0.5) * bw, bottom - u * bh], 1)
    per = square_perim(1.0, U3 * 4) * np.array([bw + 14, bh + 14]) + np.stack([bx, np.full(NP, bottom - bh / 2)], 1)
    L = lvl[BAR_J]
    B_in = np.where(u < L, 0.62, 0.05) + 1.1 * np.exp(-((u - L) / 0.018) ** 2)
    P = np.where(BAR_OUT[:, None], per, P_in) + np.stack([G1, G2], 1) * 1.2
    B = np.where(BAR_OUT, 0.22, B_in)
    return P.astype(np.float32), (B * twinkle(t, 0.25)).astype(np.float32)


def f_stairs(t):
    t0 = TL.AREA_T0[6]
    lit_steps = 2 + 2 * float(smooth((t - (t0 + 2.0)) / 0.3)) + float(smooth((t - (t0 + 3.5)) / 0.3))
    star_on = float(smooth((t - (t0 + 5.0)) / 0.15))
    stepB = np.clip(lit_steps - STAIR_STEP, 0, 1) * 0.55 + 0.1
    flash = 1 + 2.0 * float(np.exp(-max(t - (t0 + 5.0), 0) / 0.3)) * star_on
    starB = 0.08 + 0.9 * star_on * flash
    P = np.where(IS_STAR[:, None], STAR_P, STAIR_P)
    B = np.where(IS_STAR, starB, stepB)
    return P, (B * twinkle(t, 0.3)).astype(np.float32)


def f_galaxy(t):
    arm = (np.arange(NP) % 2)
    r = 40 + 660 * U1 ** 0.8
    th = arm * np.pi + 1.9 * np.log(r / 40) + G1 * 0.28 + 0.1 * t
    P = np.stack([CX + r * np.cos(th), CY + 30 + r * np.sin(th) * 0.4], 1)
    B = 0.1 + 0.28 * (1 - r / 700)
    return P.astype(np.float32), (B * twinkle(t, 0.45)).astype(np.float32)


FORM_FUNCS = {
    "nebula": f_nebula, "core": f_core, "title": f_title,
    "n100": f_num("n100"), "n13": f_num("n13"), "n10": f_num("n10"),
    "ring": f_ring, "sphere": f_sphere, "wheel": f_wheel,
    "wheelspin": f_wheelspin, "wheelfull": f_wheelfull, "dissolve": f_dissolve,
    "heart": icon_wrap(f_heart), "chaos": icon_wrap(f_chaos), "grid": icon_wrap(f_grid),
    "breath": icon_wrap(f_breath), "frame": icon_wrap(f_frame), "orbit": icon_wrap(f_orbit),
    "bars": icon_wrap(f_bars), "stairs": icon_wrap(f_stairs), "galaxy": f_galaxy,
}
FORMS = TL.FORMATIONS


def hero_state(t):
    k = 0
    for i, f in enumerate(FORMS):
        if f[0] <= t:
            k = i
    ts, tl, name, style = FORMS[k]
    Pn, Bn = FORM_FUNCS[name](t)
    if style == "cut" or t >= tl or k == 0:
        return Pn, Bn
    Pp, Bp = FORM_FUNCS[FORMS[k - 1][2]](t)
    D = tl - ts
    u = (t - ts) / D
    if style in ("converge", "snap"):
        spread = 0.35 if style == "converge" else 0.15
        x = (u - spread * DL) / (1 - spread)
        w = ease_io3(x) if style == "converge" else ease_out_expo(x)
        d = Pn - Pp
        perp = np.stack([-d[:, 1], d[:, 0]], 1) * CV[:, None]
        P = Pp + d * w[:, None] + perp * np.sin(np.pi * w)[:, None]
        B = Bp + (Bn - Bp) * w + 0.25 * np.sin(np.pi * w)
    elif style == "spiral":
        w = clamp01((u - 0.2 * DL) / 0.8) ** 2.0
        dp = Pp - [CX, CY]
        rp = np.hypot(dp[:, 0], dp[:, 1])
        ap = np.arctan2(dp[:, 1], dp[:, 0])
        dn = Pn - [CX, CY]
        rn = np.hypot(dn[:, 0], dn[:, 1])
        r = rp + (rn - rp) * w
        a = ap + w * (2.4 * np.pi) * (0.7 + 0.6 * U1)
        P = np.stack([CX + r * np.cos(a), CY + r * np.sin(a)], 1)
        B = Bp + (Bn - Bp) * w + 0.5 * w
    else:  # explode
        tau = t - ts
        dp = Pp - [CX, CY]
        dp = dp / (np.linalg.norm(dp, axis=1, keepdims=True) + 1e-3)
        burst = dp * ((380 + 520 * U3) * (1 - math.exp(-tau / 0.09)))[:, None]
        w = ease_io3((u - 0.1 - 0.3 * DL) / 0.6)
        P = (Pp + burst) * (1 - w)[:, None] + Pn * w[:, None]
        B = (0.5 + 1.5 * math.exp(-tau / 0.15)) * (1 - w) + Bn * w
    return P.astype(np.float32), B.astype(np.float32)


# --- pulses: impacts + kicks in drop sections
IMP_PULSE = {"huge": (0, 1.2), "big": (42, 0.9), "med": (30, 0.7), "small": (20, 0.5), "soft": (10, 0.3)}
PULSES = []
for t_, s_ in TL.IMPACTS:
    amp, bb = IMP_PULSE[s_]
    c_ = TL.ICON_C if 48 <= t_ < 104 else (CX, CY)
    PULSES.append((t_, amp, bb, c_))
_drop = [(40, 104), (120, 134)]
for k_ in TL.KICKS:
    if any(a <= k_ < b for a, b in _drop) and not any(abs(k_ - p[0]) < 0.01 for p in PULSES):
        c_ = TL.ICON_C if 48 <= k_ < 104 else (CX, CY)
        PULSES.append((k_, 6, 0.28, c_))
PULSES.sort()
PULSE_T = np.array([p[0] for p in PULSES])


def apply_pulses(t, P, B):
    i1 = np.searchsorted(PULSE_T, t, side="right")
    i0 = np.searchsorted(PULSE_T, t - 0.7)
    gain = np.ones(NP, np.float32)
    for p in PULSES[i0:i1]:
        tau = t - p[0]
        if p[1]:
            d = P - np.array(p[3], np.float32)
            d /= (np.linalg.norm(d, axis=1, keepdims=True) + 1e-3)
            P = P + d * (p[1] * float(bump(tau, 0.06)))
        gain += p[2] * math.exp(-tau / 0.12)
    return P, B * gain


def hero_gain(t):
    return float(smooth(t / 1.8))


# ====================================================================== dust / bokeh
ND = 2200
D_X = rng.uniform(-100, W + 100, ND).astype(np.float32)
D_Y = rng.uniform(0, H + 140, ND).astype(np.float32)
D_Z = rng.uniform(0.35, 1.6, ND).astype(np.float32)
D_V = (12 + 22 * rng.random(ND)).astype(np.float32) / D_Z
D_SW = rng.uniform(0.15, 0.5, ND).astype(np.float32)
D_PH = (rng.random(ND) * 6.28).astype(np.float32)
D_B = (rng.uniform(0.06, 0.3, ND) / D_Z).astype(np.float32)
D_COL = np.stack([C[k] for k in rng.choice([30, 40, 50, 60], ND, p=[0.25, 0.35, 0.25, 0.15])])
D_NEAR = D_Z < 0.6

NB = 26
B_X = rng.uniform(0, QW, NB)
B_Y = rng.uniform(0, QH, NB)
B_R = rng.uniform(7, 26, NB)
B_V = rng.uniform(-1.5, 1.5, (NB, 2))
B_A = rng.uniform(0.025, 0.07, NB)
B_COL = [C[k] for k in rng.choice([60, 70, 50, 40], NB)]


def disc_sprite(r):
    s = int(math.ceil(r)) + 3
    y, x = np.mgrid[-s:s + 1, -s:s + 1]
    d = np.hypot(x, y)
    body = clamp01(r - d + 0.5)
    rim = np.exp(-((d - r + 1.5) / 1.2) ** 2) * 0.6
    return (body * 0.7 + rim).astype(np.float32)


B_SPR = [disc_sprite(r) for r in B_R]

# ====================================================================== static layers
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.hypot((_xx - CX) / 1.15, _yy - 600) / 1000
BG = (C[100][None, None, :] * (0.42 * np.exp(-_r ** 2 * 2.2))[:, :, None]).astype(np.float32)
BG_Q = cv2.resize(BG, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
del BG
_rv = np.hypot((_xx - CX) / CX, (_yy - CY) / CY)
VIGNETTE3 = np.repeat((1 - 0.6 * smooth((_rv - 0.42) / 1.0))[:, :, None], 3, 2).astype(np.float32)
del _yy, _xx, _r, _rv

_qy, _qx = np.mgrid[0:QH, 0:QW].astype(np.float32)
_sx, _sy = QW / 2, -0.35 * QH
RAY_TH = np.arctan2(_qx - _sx, _qy - _sy).astype(np.float32)
RAY_R = np.hypot(_qx - _sx, _qy - _sy).astype(np.float32)
RAY_ENV = (np.exp(-(RAY_TH / 0.62) ** 2) * np.exp(-RAY_R / 290)).astype(np.float32)
QX, QY = _qx, _qy
_hy, _hx = np.mgrid[0:HH, 0:HW].astype(np.float32)
HX, HY = _hx, _hy
RAY_F = [(9, 0.9, 0.11), (14, 0.7, -0.07), (23, 0.55, 0.05), (37, 0.4, -0.13), (55, 0.3, 0.09)]
RAY_PH = rng.random(len(RAY_F)) * 6.28
COL_RAY = (C[50] * 0.6 + C[40] * 0.4)

# tone-mapping LUT
_lx = np.linspace(0, 8, 4096, dtype=np.float32)
_knee = 0.62
TONE_LUT = np.where(_lx < _knee, _lx, _knee + (1 - _knee) * (1 - np.exp(-(_lx - _knee) / (1 - _knee)))).astype(np.float32)
TONE_LUT8 = np.clip(TONE_LUT * 255 + 0.5, 0, 255).astype(np.uint8)

GRAIN = [np.repeat(rng.normal(0, 0.0045, (H, W, 1)), 3, 2).astype(np.float32) for _ in range(3)]

IMP_SIZE = {"huge": 1.0, "big": 0.62, "med": 0.45, "small": 0.32, "soft": 0.2}
SHAKE = {"huge": 16, "big": 8, "med": 5, "small": 3, "soft": 1}
ZOOM = {"huge": 0.055, "big": 0.028, "med": 0.02, "small": 0.012, "soft": 0.006}


def impact_center(t):
    return TL.ICON_C if 48 <= t < 104 else (CX, CY)


# ====================================================================== text
class TextItem:
    def __init__(self, d):
        self.__dict__.update(d)
        pad = int(self.size * 0.5) + 24
        m, (iw, ih) = text_canvas(self.text, self.font, self.size, self.spacing, pad)
        self.mask = m
        self.iw, self.ih, self.pad = iw, ih, pad
        s1 = self.size * 0.08 + 2.5
        s2 = self.size * 0.35 + 6
        g = 0.65 * cv2.GaussianBlur(m, (0, 0), s1) + 0.55 * cv2.GaussianBlur(m, (0, 0), s2)
        self.glowm = g.astype(np.float32)
        self.col = np.array(rgb(self.color), np.float32)
        self.gcol = (C[50] * 0.7 + self.col * 0.3)
        self.exit_dur = {"fade": 0.35, "fly": 0.4, "cut": 0.03}[self.exit]

    def state(self, t):
        if t < self.t_in or t > self.t_out + self.exit_dur:
            return None
        u = t - self.t_in
        a, dx, dy, s, sx, boost = 1.0, 0.0, 0.0, 1.0, 1.0, 0.0
        if self.anim == "rise":
            a = float(smooth(u / 0.35))
            dy = 30 * (1 - float(ease_out_expo(u / 0.6)))
        elif self.anim == "slam":
            a = float(clamp01(u / 0.05))
            s = 1 + 0.4 * (1 - float(ease_out_expo(u / 0.25)))
            boost = 2.2 * math.exp(-u / 0.2)
        elif self.anim == "fade":
            a = float(smooth(u / 0.7))
        elif self.anim == "pop":
            a = float(clamp01(u / 0.08))
            s = float(0.4 + 0.6 * ease_out_back(u / 0.32))
            boost = 1.5 * math.exp(-u / 0.2)
        elif self.anim == "slide":
            a = float(smooth(u / 0.22))
            dx = 70 * (1 - float(ease_out_expo(u / 0.45)))
            boost = 1.0 * math.exp(-u / 0.25)
        if t > self.t_out:
            v = (t - self.t_out) / self.exit_dur
            if self.exit == "fly":
                a *= (1 - v) ** 2
                dx -= 260 * v * v
                sx *= 1 + 0.5 * v
                boost += 1.5 * v
            else:
                a *= 1 - v
        sweep = None
        if self.sweep is not None and self.sweep <= t <= self.sweep + 1.1:
            sweep = (t - self.sweep) / 1.1
        return a, dx, dy, s, sx, boost, sweep


TEXTS = [TextItem(d) for d in TL.TEXTS]


def place_xy(it, st, w, h):
    a, dx, dy, s, sx, boost, sweep = st
    if it.anchor == "lm":
        ax = it.x - it.pad * s * sx
        x0 = ax + dx
    else:
        x0 = it.x - w / 2 + dx
    y0 = it.y - h / 2 + dy
    return int(round(x0)), int(round(y0))


def scaled(it, st, arr):
    a, dx, dy, s, sx, boost, sweep = st
    if abs(s - 1) < 1e-3 and abs(sx - 1) < 1e-3:
        return arr
    return cv2.resize(arr, None, fx=s * sx, fy=s, interpolation=cv2.INTER_LINEAR)


def sweep_band(w, h, u):
    xs = np.arange(w, dtype=np.float32)[None, :] + 0.35 * np.arange(h, dtype=np.float32)[:, None]
    pos = -0.2 * w + 1.5 * w * u
    return np.exp(-((xs - pos) / (0.07 * w + 20)) ** 2)


def region(dst, x0, y0, w, h):
    xa, ya = max(x0, 0), max(y0, 0)
    xb, yb = min(x0 + w, dst.shape[1]), min(y0 + h, dst.shape[0])
    if xa >= xb or ya >= yb:
        return None
    return (slice(ya, yb), slice(xa, xb)), (slice(ya - y0, yb - y0), slice(xa - x0, xb - x0))


def text_pass(t, hdr, ldr=None):
    for it in TEXTS:
        st = it.state(t)
        if st is None:
            continue
        a, dx, dy, s, sx, boost, sweep = st
        if a <= 0.003:
            continue
        src = it.glowm if ldr is None else it.mask
        m = scaled(it, st, src)
        h, w = m.shape
        x0, y0 = place_xy(it, st, w, h)
        rg = region(hdr if ldr is None else ldr, x0, y0, w, h)
        if rg is None:
            continue
        dsl, ssl = rg
        mm = m[ssl]
        band = sweep_band(w, h, sweep)[ssl] if sweep is not None else None
        if ldr is None:
            k = a * it.glow * (0.55 + boost)
            g = mm * k
            if band is not None:
                g = g * (1 + 2.5 * band)
            hdr[dsl] += g[:, :, None] * it.gcol
        else:
            col = np.broadcast_to(it.col * 255, mm.shape + (3,))
            if band is not None:
                col = col + (255 - col) * band[:, :, None]
            al = (mm * a)[:, :, None]
            reg = ldr[dsl].astype(np.float32)
            ldr[dsl] = (reg + (col - reg) * al + 0.5).astype(np.uint8)


# ====================================================================== frame
def splat(buf, P, wts):
    h, w = buf.shape[:2]
    x, y = P[:, 0], P[:, 1]
    ok = (x >= 0) & (x < w - 1) & (y >= 0) & (y < h - 1)
    x, y, wts = x[ok], y[ok], wts[ok]
    x0 = x.astype(np.int32)
    y0 = y.astype(np.int32)
    fx, fy = x - x0, y - y0
    idx = y0 * w + x0
    flat = buf.reshape(-1)
    corner = np.concatenate([idx, idx + 1, idx + w, idx + w + 1])
    k = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
    vals = np.tile(wts, (4, 1)) * k[:, None]
    ii = (corner[:, None] * 3 + np.arange(3)).ravel()
    np.add.at(flat, ii, vals.ravel())


def render_frame(fi):
    t = fi / FPS
    e = TL.energy(t)

    # impacts active now
    act = [(ti, sz) for ti, sz in TL.IMPACTS if 0 <= t - ti < 1.6]

    # ---- quarter-res light layer: haze, rays, bokeh, near dust, flare glow, light sweep
    q = BG_Q * (0.4 + 0.6 * e)
    flash = sum(IMP_SIZE[sz] * math.exp(-(t - ti) / 0.25) for ti, sz in act)
    pat = np.zeros((QH, QW), np.float32)
    for (f, amp, spd), ph in zip(RAY_F, RAY_PH):
        pat += amp * (0.5 + 0.5 * np.cos(f * RAY_TH + ph + spd * t * 6)) ** 8
    ray_gain = 0.035 + 0.15 * e + 0.45 * flash
    q += (pat * RAY_ENV * ray_gain)[:, :, None] * COL_RAY
    bok_gain = 0.45 + 0.6 * e
    for i in range(NB):
        bx = (B_X[i] + B_V[i, 0] * t) % (QW + 60) - 30
        by = (B_Y[i] + B_V[i, 1] * t) % (QH + 60) - 30
        spr = B_SPR[i]
        sh = spr.shape[0]
        rg = region(q, int(bx) - sh // 2, int(by) - sh // 2, sh, sh)
        if rg:
            q[rg[0]] += (spr[rg[1]] * B_A[i] * bok_gain)[:, :, None] * B_COL[i]
    dy = (D_Y - D_V * t) % (H + 140) - 70
    dx = D_X + np.sin(t * D_SW + D_PH) * 18 / D_Z
    dB = D_B * (0.5 + 0.5 * np.sin(t * 2.2 * D_SW * 4 + D_PH)) * (0.35 + 0.65 * e)
    near = D_NEAR
    splat(q, np.stack([dx[near] / 4, dy[near] / 4], 1), (dB[near] * 1.6)[:, None] * D_COL[near])
    for ti, sz in act:
        tau = t - ti
        I = IMP_SIZE[sz]
        cx, cy = impact_center(ti)
        g = np.exp(-((QX - cx / 4) ** 2 + (QY - cy / 4) ** 2) / (2 * 34 ** 2))
        q += (g * I * 1.0 * math.exp(-tau / 0.12))[:, :, None] * C[30]
        if sz in ("huge", "big"):
            pos = -150 + (QW + 300) * (tau / 0.65)
            band = np.exp(-(((QX + 0.55 * QY) - pos) / 40) ** 2)
            q += (band * 0.2 * I * (tau < 0.7))[:, :, None] * C[60]
    q = cv2.GaussianBlur(q, (0, 0), 1.2)

    # ---- full-res emission: far dust + hero particles (motion blurred)
    far = ~near
    em = np.zeros((H, W, 3), np.float32)
    splat(em, np.stack([dx[far], dy[far]], 1), dB[far][:, None] * D_COL[far])
    hg = hero_gain(t)
    Ps, Ws = [], []
    for sub in (0.0, 1 / 120, 1 / 60):
        P, B = hero_state(t - sub)
        P, B = apply_pulses(t - sub, P, B)
        Ps.append(P)
        Ws.append((B * SPARK * hg * 0.62 / 3)[:, None] * PCOL)
    splat(em, np.concatenate(Ps), np.concatenate(Ws))

    # fluorescent halo (half res) and bloom (quarter res)
    eh = cv2.GaussianBlur(cv2.resize(em, (HW, HH), interpolation=cv2.INTER_AREA), (0, 0), 1.6)
    b1 = q + cv2.resize(eh, (QW, QH), interpolation=cv2.INTER_AREA) * 3.4
    b2 = cv2.resize(b1, (QW // 2, QH // 2), interpolation=cv2.INTER_AREA)
    b3 = cv2.resize(b2, (QW // 4, QH // 4), interpolation=cv2.INTER_AREA)
    lowq = (q + cv2.GaussianBlur(b1, (0, 0), 2.5) * 0.45 +
            cv2.resize(cv2.GaussianBlur(b2, (0, 0), 3.0), (QW, QH)) * 0.5 +
            cv2.resize(cv2.GaussianBlur(b3, (0, 0), 3.0), (QW, QH)) * 0.6)

    # ---- shockwave rings (half res, added to halo layer)
    for ti, sz in act:
        tau = t - ti
        if tau < 1.2 and sz != "soft":
            I = IMP_SIZE[sz]
            cx, cy = impact_center(ti)
            R = 760 * (1 - math.exp(-tau / 0.42))
            wdt = 5 + 22 * tau
            rr = np.hypot(HX - cx / 2, HY - cy / 2)
            ring = np.exp(-((rr - R) / wdt) ** 2) * (I * 0.55 * math.exp(-tau / 0.38) / 2.4)
            eh += ring[:, :, None] * C[30]

    # ---- assemble full-res HDR
    hdr = cv2.resize(lowq, (W, H), interpolation=cv2.INTER_LINEAR)
    cv2.add(hdr, em, dst=hdr)
    cv2.scaleAdd(cv2.resize(eh, (W, H), interpolation=cv2.INTER_LINEAR), 2.4, hdr, dst=hdr)

    # anamorphic streaks
    for ti, sz in act:
        tau = t - ti
        I = IMP_SIZE[sz]
        cx, cy = impact_center(ti)
        amp = I * 1.3 * math.exp(-tau / 0.28)
        if amp > 0.01:
            y0, y1 = int(max(cy - 50, 0)), int(min(cy + 50, H))
            ys = np.arange(y0, y1, dtype=np.float32)[:, None] - cy
            xs = np.arange(W, dtype=np.float32)[None, :] - cx
            prof = (np.exp(-(ys / 3.0) ** 2) + 0.25 * np.exp(-(ys / 16) ** 2)) * np.exp(-np.abs(xs) / 650)
            hdr[y0:y1] += (prof * amp)[:, :, None] * C[40]

    # text glow
    text_pass(t, hdr)

    # flash
    fl = sum(IMP_SIZE[sz] ** 1.5 * 0.85 * math.exp(-(t - ti) / 0.07) for ti, sz in act)
    if fl > 0.004:
        hdr += C[10] * fl

    # vignette + grain, then tone-map straight to 8 bit
    cv2.multiply(hdr, VIGNETTE3, dst=hdr)
    cv2.add(hdr, GRAIN[fi % len(GRAIN)], dst=hdr)
    np.multiply(hdr, 4095 / 8.0, out=hdr)
    np.clip(hdr, 0, 4095, out=hdr)
    out = TONE_LUT8[hdr.astype(np.uint16)]

    # crisp text
    text_pass(t, None, out)

    # camera: shake + zoom punch
    zm = 1.0 + 0.012 * math.sin(t * 0.21)
    ox = oy = 0.0
    for ti, sz in act:
        tau = t - ti
        a = SHAKE[sz] * math.exp(-tau / 0.2)
        ox += a * math.sin(97 * tau + ti)
        oy += a * math.cos(83 * tau + 2 * ti)
        zm += ZOOM[sz] * math.exp(-tau / 0.17)
    for k in TL.KICKS:
        if 0 <= t - k < 0.4 and any(a <= k < b for a, b in _drop):
            zm += 0.005 * math.exp(-(t - k) / 0.09)
    M = cv2.getRotationMatrix2D((CX, CY), 0.0, zm)
    M[0, 2] += ox
    M[1, 2] += oy
    return cv2.warpAffine(out, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def _render_bytes(fi):
    return render_frame(fi).tobytes()


def render_video(out, start=0, end=None, procs=4):
    import multiprocessing as mp
    n = int(round(TL.DURATION * FPS)) if end is None else end
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
           "-crf", "17", "-pix_fmt", "yuv420p", out]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    with mp.get_context("fork").Pool(procs) as pool:
        for i, b in enumerate(pool.imap(_render_bytes, range(start, n), chunksize=2)):
            ff.stdin.write(b)
            if i % 150 == 0:
                el = time.time() - t0
                print(f"frame {start + i}/{n}  {el:.0f}s  ({(i + 1) / max(el, 1e-6):.1f} fps)", flush=True)
    ff.stdin.close()
    ff.wait()
    print(f"done in {time.time() - t0:.0f}s -> {out}")


def preview(times, outdir="build/preview"):
    os.makedirs(outdir, exist_ok=True)
    for t in times:
        t0 = time.time()
        img = render_frame(int(round(float(t) * FPS)))
        Image.fromarray(img).save(f"{outdir}/t{float(t):07.2f}.png")
        print(f"t={t}: {time.time() - t0:.2f}s")


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "video":
        out = sys.argv[2]
        a = int(sys.argv[3]) if len(sys.argv) > 3 else 0
        b = int(sys.argv[4]) if len(sys.argv) > 4 else None
        render_video(out, a, b)
    else:
        preview(sys.argv[2:])
