"""Renders the video: light, shadow and fluorescent particles, every motion
driven by the same cue list as the soundtrack (timeline.py).

    python render.py --preview 120,560,1200      -> build/preview/f0120.png ...
    python render.py --all --workers 4            -> build/video.mp4 (no audio)

Everything is drawn as a single luminance channel and only coloured at the
very end through a gradient map of the Loyel gradient-blue palette, so every
pixel of the film sits on that ramp.
"""
import argparse
import os
import subprocess
import sys
from multiprocessing import Pool

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from timeline import (FPS, W, H, BAR, BEAT, DURATION, TOTAL_FRAMES, T, SCENES, TEXT_KINDS,
                      KICKS, TAIKOS, SNARES, IMPACTS, WHOOSHES, RISERS, HEARTS, SHIMMERS)

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
FONTS = {"black": os.path.join(HERE, "fonts", "NotoSansCJKsc-Black.otf"),
         "light": os.path.join(HERE, "fonts", "NotoSansCJKsc-Light.otf")}

Q = 4
WQ, HQ = W // Q, H // Q
WH, HH = W // 2, H // 2
N_P, N_D, N_B = 14000, 1800, 36
CENTER = (960.0, 480.0)
cv2.setNumThreads(1)
GRAIN_AMP = float(os.environ.get("GRAIN", 0.004))
CRF = int(os.environ.get("CRF", 21))

# ------------------------------------------------------- Loyel ramp -------
RAMP = [(0.00, "#030509"), (0.08, "#0E1623"), (0.20, "#263B54"), (0.32, "#2B4868"),
        (0.42, "#2E5076"), (0.52, "#376392"), (0.62, "#497DAE"), (0.72, "#6C9AC4"),
        (0.81, "#9FBDDA"), (0.88, "#CCDBEB"), (0.94, "#E8EEF6"), (0.97, "#F4F7FB"),
        (1.00, "#FFFFFF")]


def _lut():
    xs = np.array([p for p, _ in RAMP])
    cs = np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for _, c in RAMP], float)
    u = np.linspace(0, 1, 1024)
    return np.stack([np.interp(u, xs, cs[:, k]) for k in range(3)], 1).round().astype(np.uint8)


LUT = _lut()


# ------------------------------------------------------------ helpers -----
def smooth(a, b, x):
    u = np.clip((x - a) / (b - a), 0, 1)
    return u * u * (3 - 2 * u)


def track(*pts):
    return np.array([p[0] for p in pts]), np.array([p[1] for p in pts])


def tr(name, t):
    xs, ys = TR[name]
    return float(np.interp(t, xs, ys))


def env_sum(times, t, tau, weights=None, horizon=6.0):
    times = np.asarray(times)
    m = (times <= t) & (times > t - horizon * tau)
    if not m.any():
        return 0.0
    w = 1.0 if weights is None else np.asarray(weights)[m]
    return float(np.sum(w * np.exp(-(t - times[m]) / tau)))


# ------------------------------------------------------------- tracks -----
TR = dict(
    core=track((0, 0), (0.03, 0), (0.12, 0.6), (T(1), 0.35), (T(3), 0.6), (T(4) - 0.05, 1.3),
               (T(4) + 0.4, 0.85), (T(8), 0.7), (T(16) - 0.05, 0.9), (T(24), 0.6), (T(28), 0.55),
               (T(31, 3) - 0.02, 1.0), (T(31, 3) + 0.04, 0), (T(32) - 0.02, 0), (T(32), 1.1),
               (T(40), 1.0), (T(42), 0.6), (T(43, 3), 0.7), (T(43, 3) + 0.04, 0), (T(44) - 0.02, 0),
               (T(44), 1.7), (T(44) + 3.5, 0), (DURATION, 0)),
    beams=track((0, 0), (T(2), 0), (T(4) - 0.1, 0.2), (T(4), 0.55), (T(8), 0.45), (T(16) - 0.1, 0.5),
                (T(16), 0.85), (T(24) - 0.1, 0.85), (T(24), 0), (T(28), 0), (T(28) + 0.2, 0.45),
                (T(31, 3), 0.6), (T(31, 3) + 0.03, 0), (T(32) - 0.01, 0), (T(32), 1.0),
                (T(40) - 0.1, 1.0), (T(40), 0.8), (T(42), 0.6), (T(42) + 0.5, 0.15), (T(43, 3), 0.15),
                (T(43, 3) + 0.03, 0), (T(44) - 0.01, 0), (T(44), 0.9), (T(44) + 3.2, 0), (DURATION, 0)),
    spot=track((0, 0), (T(24) - 0.2, 0), (T(24), 0.9), (T(28) - 0.1, 0.9), (T(28), 0), (T(42), 0),
               (T(42) + 0.3, 0.7), (T(43, 3), 0.7), (T(43, 3) + 0.03, 0), (DURATION, 0)),
    fog=track((0, 0.15), (T(4), 0.35), (T(4) + 0.1, 0.6), (T(24), 0.6), (T(24) + 0.5, 0.9),
              (T(28), 0.6), (DURATION, 0.5)),
    rays=track((0, 0.4), (T(4), 1.0), (T(16), 0.9), (T(24), 0.55), (T(28), 0.8), (T(32), 1.2),
               (T(44), 1.4), (DURATION, 1.0)),
    dust=track((0, 0.3), (T(4), 0.7), (T(24), 1.0), (T(28), 0.75), (DURATION, 0.6)),
    exposure=track((0, 1), (T(44) + 1.6, 1), (DURATION - 0.25, 0), (DURATION, 0)),
    vign=track((0, 0.85), (T(4), 0.55), (T(44) + 1, 0.55), (DURATION, 0.9)),
    speed=track((0, 0.25), (T(4), 0.4), (T(16), 1.1), (T(24), 0.2), (T(28), 0.7), (T(32), 1.7),
                (T(40), 0.6), (DURATION, 0.3)),
)
BLACKOUTS = [(T(15, 3), T(16), 0.45), (T(31, 3), T(32), 0.03), (T(43, 3), T(44), 0.05)]
PUSH_SEGMENTS = [0, T(4), T(16), T(32), T(40), T(44), DURATION]
STROBE = [(T(16), T(24)), (T(32), T(40))]

# beam sweep phase integrates the speed track so speed changes never jump
_ft = np.arange(TOTAL_FRAMES + 1) / FPS
BEAM_PHASE = np.cumsum([tr("speed", x) for x in _ft]) / FPS

# ----------------------------------------------------------- textures -----
R = np.random.default_rng(7)


def periodic_noise(seed, beta):
    r = np.random.default_rng(seed)
    F = np.fft.rfft2(r.standard_normal((HQ, WQ)))
    ky = np.fft.fftfreq(HQ)[:, None]
    kx = np.fft.rfftfreq(WQ)[None, :]
    k = np.sqrt(kx ** 2 + ky ** 2)
    k[0, 0] = 1
    F *= k ** (-beta / 2)
    F[0, 0] = 0
    f = np.fft.irfft2(F, s=(HQ, WQ))
    f = (f - f.min()) / (f.max() - f.min())
    return f.astype(np.float32)


FOG_A, FOG_B = periodic_noise(1, 3.2), periodic_noise(2, 2.6)
XQ, YQ = np.meshgrid((np.arange(WQ) + 0.5) * Q, (np.arange(HQ) + 0.5) * Q)
XQ, YQ = XQ.astype(np.float32), YQ.astype(np.float32)
_yy, _xx = np.mgrid[0:H, 0:W].astype(np.float32)
_r = np.sqrt(((_xx - W / 2) / (W / 2)) ** 2 + ((_yy - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
VIGNETTE_R = _r.astype(np.float32)
del _yy, _xx, _r
GRAIN = [np.random.default_rng(100 + i).standard_normal((H, W)).astype(np.float32) for i in range(6)]

# --------------------------------------------------------- particles ------
PH = R.uniform(0, 2 * np.pi, N_P)
PH2 = R.uniform(0, 2 * np.pi, N_P)
OM = R.uniform(1.0, 3.2, N_P)
BASE = np.clip(R.lognormal(0, 0.55, N_P), 0.2, 4.0)
DL = R.random(N_P)
_a = R.uniform(0, 2 * np.pi, N_P)
RDX, RDY = np.cos(_a), np.sin(_a)
BM = R.uniform(0.35, 1.0, N_P)
PR = 3 + np.abs(R.standard_normal(N_P)) * 20
POM = R.uniform(0.8, 2.6, N_P) * R.choice([-1, 1], N_P)
CLX = R.uniform(-300, W + 300, N_P)
CLY = R.uniform(-300, H + 300, N_P)
_a = R.uniform(0, 2 * np.pi, N_P)
SDX, SDY, SDR = np.cos(_a), np.sin(_a), R.uniform(700, 2600, N_P)
SPARK = R.random(N_P) < 0.12

DX0, DY0 = R.uniform(0, W, N_D), R.uniform(0, H, N_D)
DVX, DVY = R.normal(0, 6, N_D), R.uniform(-16, -3, N_D)
DPH, DOM = R.uniform(0, 2 * np.pi, N_D), R.uniform(0.2, 0.9, N_D)
DB = np.clip(R.lognormal(-0.3, 0.6, N_D), 0.1, 3.0)

BX0, BY0 = R.uniform(0, W, N_B), R.uniform(0, H, N_B)
BVX, BVY = R.normal(0, 4, N_B), R.uniform(-8, -2, N_B)
BRAD = R.integers(7, 24, N_B)
BBR = R.uniform(0.04, 0.12, N_B)


def _sprite(r):
    s = 2 * r + 5
    y, x = np.mgrid[0:s, 0:s] - (s - 1) / 2
    d = np.sqrt(x * x + y * y)
    disc = np.clip(r + 0.8 - d, 0, 1)
    rim = np.exp(-((d - r + 1) / 1.2) ** 2) * 0.5
    return (disc * 0.8 + rim).astype(np.float32)


SPRITES = {r: _sprite(r) for r in range(7, 24)}


# --------------------------------------------------------------- text -----
_font_cache = {}


def font(weight, size):
    k = (weight, size)
    if k not in _font_cache:
        _font_cache[k] = ImageFont.truetype(FONTS[weight], size)
    return _font_cache[k]


def text_arr(text, weight, size, tracking=0):
    f = font(weight, size)
    asc, desc = f.getmetrics()
    adv = [f.getlength(c) for c in text]
    width = int(sum(adv) + tracking * (len(text) - 1)) + 40
    img = Image.new("L", (width, asc + desc + 40), 0)
    d = ImageDraw.Draw(img)
    x = 20.0
    for c, a in zip(text, adv):
        d.text((x, 20 + asc), c, font=f, fill=255, anchor="ls")
        x += a + tracking
    arr = np.asarray(img, np.float32) / 255
    ys, xs = np.nonzero(arr > 0.02)
    return arr[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def with_rules(arr, length=150, gap=36):
    """Thin horizontal rules on both sides of a small label."""
    h, w = arr.shape
    out = np.zeros((max(h, 3), w + 2 * (length + gap)), np.float32)
    y0 = (out.shape[0] - h) // 2
    out[y0:y0 + h, length + gap:length + gap + w] = arr
    yc = out.shape[0] // 2
    out[yc - 1:yc + 1, :length] = np.linspace(0, 0.8, length)
    out[yc - 1:yc + 1, -length:] = np.linspace(0.8, 0, length)
    return out


def layer(arr, cx, cy, gain=1.0):
    h, w = arr.shape
    return dict(arr=arr, x0=int(round(cx - w / 2)), y0=int(round(cy - h / 2)), gain=gain)


def prepare_scene(sc):
    k = sc["kind"]
    subs = []
    if k == "card":
        hero = layer(text_arr(sc["zh"], "black", 150), 960, 488)
        subs = [layer(with_rules(text_arr(sc["idx"], "light", 44, 8)), 960, 318, 0.9),
                layer(text_arr(sc["act"], "light", 26, 6), 960, 368, 0.72),
                layer(text_arr(sc["en"], "black", 34, 12), 960, 602, 0.85),
                layer(text_arr(sc["line"], "light", 36, 2), 960, 678, 0.78)]
    elif k == "word":
        hero = layer(text_arr(sc["hero"], "black", 300), 960, 470)
        subs = [layer(text_arr(sc["en"], "light", 54, 36), 960, 690, 0.9)]
    elif k == "title":
        hero = layer(text_arr(sc["hero"], "black", 230, 36), 960, 455)
    else:  # quote
        hero = layer(text_arr(sc["hero"], "black", sc["size"]), 960, 488)
    if k in ("title", "quote"):
        subs = [layer(text_arr(txt, w, s, trk), 960, cy, g) for txt, w, s, trk, cy, g in sc["subs"]]

    a = hero["arr"]
    ys, xs = np.nonzero(a > 0.5)
    wts = a[ys, xs]
    idx = R.choice(len(ys), N_P, replace=len(ys) < N_P, p=wts / wts.sum())
    sc["tx"] = xs[idx] + hero["x0"] + R.uniform(-0.5, 0.5, N_P)
    sc["ty"] = ys[idx] + hero["y0"] + R.uniform(-0.5, 0.5, N_P)
    sc["center"] = (hero["x0"] + a.shape[1] / 2, hero["y0"] + a.shape[0] / 2)
    hero["soft"] = cv2.GaussianBlur(a, (0, 0), 2.0)
    full = np.zeros((H, W), np.float32)
    _paste(full, hero["soft"], hero["x0"], hero["y0"])
    sc["occ_q"] = cv2.resize(full, (WQ, HQ), interpolation=cv2.INTER_AREA)
    sc["hero"], sc["subs"] = hero, subs


def _paste(dst, src, x0, y0, gain=1.0, op="add"):
    h, w = src.shape
    X0, Y0 = max(x0, 0), max(y0, 0)
    X1, Y1 = min(x0 + w, dst.shape[1]), min(y0 + h, dst.shape[0])
    if X1 <= X0 or Y1 <= Y0:
        return
    s = src[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0]
    if op == "add":
        dst[Y0:Y1, X0:X1] += s * gain
    else:  # darken (occlusion)
        dst[Y0:Y1, X0:X1] *= 1 - s * gain


SC = [dict(s) for s in SCENES]
for _s in SC:
    if _s["kind"] in TEXT_KINDS:
        prepare_scene(_s)
    else:
        _s["center"] = CENTER
SC_AT = np.array([s["at"] for s in SC])


def scene_index(t):
    return max(int(np.searchsorted(SC_AT, t, side="right")) - 1, 0)


def targets(k, t, kick_e=0.0):
    s = SC[k]
    kind = s["kind"]
    cx, cy = s["center"]
    if kind in TEXT_KINDS:
        x = s["tx"] + 0.9 * np.sin(t * 1.7 * OM + PH)
        y = s["ty"] + 0.9 * np.cos(t * 1.3 * OM + PH2)
        x = x + (x - cx) * 0.014 * kick_e
        y = y + (y - cy) * 0.014 * kick_e
        return x, y
    if kind == "point":
        a = PH + POM * t
        return cx + PR * np.cos(a), cy + 0.6 * PR * np.sin(a)
    if kind == "cloud":
        return CLX + 40 * np.sin(0.2 * t * OM + PH), CLY + 40 * np.cos(0.17 * t * OM + PH2)
    return cx + SDX * SDR, cy + SDY * SDR   # scatter


def scene_progress(k, t):
    s = SC[k]
    u = (t - s["at"]) / s["conv"]
    ui = np.clip((u - DL * 0.3) / 0.7, 0, 1)
    ease = s.get("ease")
    if ease == "slow":
        e = ui * ui * ui * (ui * (ui * 6 - 15) + 10)
    elif ease == "implode":
        e = ui ** 2.2
    else:
        e = 1 - (1 - ui) ** 3
    return u, e


def particles(t, kick_e):
    k = scene_index(t)
    s = SC[k]
    u, e = scene_progress(k, t)
    B = targets(k, t, kick_e)
    if k == 0 or np.all(e >= 1):
        return B[0], B[1], np.zeros(N_P), k, u
    A = targets(k - 1, s["at"])
    pcx, pcy = SC[k - 1]["center"]
    dx, dy = A[0] - pcx, A[1] - pcy
    dn = np.sqrt(dx * dx + dy * dy) + 1e-3
    if s.get("ease") in ("slow", "implode"):
        # spiral in: control point is perpendicular to the radius
        sw = 0.55 if s.get("ease") == "slow" else 0.35
        Cx, Cy = A[0] - dy * sw, A[1] + dx * sw
    else:
        ox, oy = 0.6 * dx / dn + 0.8 * RDX, 0.6 * dy / dn + 0.8 * RDY
        on = np.sqrt(ox * ox + oy * oy) + 1e-6
        mag = BM * s["burst"] * 430
        Cx, Cy = A[0] + ox / on * mag, A[1] + oy / on * mag
    a, b, c = (1 - e) ** 2, 2 * (1 - e) * e, e ** 2
    x = a * A[0] + b * Cx + c * B[0]
    y = a * A[1] + b * Cy + c * B[1]
    return x, y, 4 * e * (1 - e), k, u


def splat(x, y, w, width, height):
    """Bilinear point splat via one bincount."""
    x0 = np.floor(x).astype(np.int64)
    y0 = np.floor(y).astype(np.int64)
    fx, fy = x - x0, y - y0
    m = (x0 >= 0) & (y0 >= 0) & (x0 < width - 1) & (y0 < height - 1) & (w > 0)
    x0, y0, fx, fy, w = x0[m], y0[m], fx[m], fy[m], w[m]
    i = y0 * width + x0
    idx = np.concatenate([i, i + 1, i + width, i + width + 1])
    ww = np.concatenate([w * (1 - fx) * (1 - fy), w * fx * (1 - fy), w * (1 - fx) * fy, w * fx * fy])
    return np.bincount(idx, ww, minlength=width * height).reshape(height, width).astype(np.float32)


def radial_blur(src, cx, cy, n=40, step=0.013, decay=0.965):
    acc = np.zeros_like(src)
    wsum = 0.0
    w = 1.0
    for i in range(n):
        s = 1 - i * step
        M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
        acc += cv2.warpAffine(src, M, (src.shape[1], src.shape[0]), flags=cv2.INTER_LINEAR) * w
        wsum += w
        w *= decay
    return acc / wsum * 3.0


def beam(ox, oy, th, hw):
    vx, vy = XQ - ox, YQ - oy
    dx, dy = np.sin(th), np.cos(th)
    along = vx * dx + vy * dy
    perp = vx * dy - vy * dx
    wid = np.maximum(along, 0) * np.tan(hw) + 10
    return np.exp(-(perp / wid) ** 2) * (along > 0) * np.exp(-np.maximum(along, 0) / 2600)


BEAM_ORIGINS = [(240, -160), (760, -220), (1160, -220), (1680, -160)]


# ------------------------------------------------------------- frame ------
def render(fi):
    t = fi / FPS
    kick_e = env_sum(KICKS, t, 0.10) + 0.8 * env_sum(TAIKOS, t, 0.14)
    snare_e = env_sum(SNARES, t, 0.08)
    imp_t = [a for a, _ in IMPACTS]
    imp_s = [b for _, b in IMPACTS]
    imp_e = env_sum(imp_t, t, 0.5, imp_s)
    imp_f = env_sum(imp_t, t, 0.12, imp_s)
    heart_e = env_sum(HEARTS + [h + 0.17 for h in HEARTS], t, 0.12)
    shim_e = env_sum(SHIMMERS, t, 0.35)
    riser_e = 0.0
    for a, b in RISERS:
        if a <= t < b:
            riser_e = ((t - a) / (b - a)) ** 2
    strobe = any(a <= t < b for a, b in STROBE)
    gain = 1.0
    for a, b, g in BLACKOUTS:
        if a <= t < b:
            gain = g

    k = scene_index(t)
    s = SC[k]
    px, py, speed, _, u = particles(t, kick_e)
    _, eg = scene_progress(k, t)
    eg = float(np.mean(eg))
    pc = SC[k - 1]["center"] if k > 0 else CENTER
    cx = pc[0] + (s["center"][0] - pc[0]) * eg
    cy = pc[1] + (s["center"][1] - pc[1]) * eg

    # ---- crisp text phases: silhouette (shadow) first, then lit
    occ_a = em_a = sub_a = 0.0
    if s["kind"] in TEXT_KINDS:
        el = t - s["at"]
        fade = 0.12 if s["kind"] == "word" else 0.22
        out = 1 - smooth(s["end"] - fade, s["end"], t)
        occ_a = smooth(s["conv"] * 0.45, s["conv"] * 0.9, el) * out
        lit0 = s["conv"] * 0.85
        em_a = smooth(lit0, lit0 + 0.35, el) * out
        sub_a = smooth(lit0 + 0.1, lit0 + 0.6, el) * out

    # ---- quarter-res light field: beams, spot, core glow, fog
    core = tr("core", t) * (1 + 0.35 * kick_e + 0.25 * snare_e) + 0.6 * heart_e * (t < T(4)) \
        + 0.5 * riser_e + 0.6 * heart_e * (t >= T(42))
    core *= 1 - 0.8 * em_a     # once the type is lit the backlight steps down so it stays legible
    dq = np.sqrt((XQ - cx) ** 2 + (YQ - cy) ** 2)
    glow = (np.exp(-(dq / 46) ** 2) * 1.3 + np.exp(-(dq / 190) ** 2) * 0.45
            + 0.16 / (1 + (dq / 110) ** 2)) * core
    ph = BEAM_PHASE[fi]
    bi = tr("beams", t) * ((0.5 + 0.9 * min(kick_e, 1.2)) if strobe else 1.0)
    beams = np.zeros((HQ, WQ), np.float32)
    if bi > 0.003:
        for j, (ox, oy) in enumerate(BEAM_ORIGINS):
            base = np.arctan2(960 - ox, 1250) * 0.85
            th = base + 0.33 * np.sin(ph * (0.9 + 0.23 * j) + j * 1.7)
            beams += beam(ox, oy, th, 0.05 + 0.012 * j) * (0.8 if j in (1, 2) else 1.0)
        beams *= bi
    sp = tr("spot", t)
    if sp > 0.003:
        beams += beam(960, -320, 0.0, 0.11) * sp * 0.95
    # light swipe on every whoosh
    for tw in WHOOSHES:
        if tw - 0.4 <= t <= tw + 0.12:
            pos = -400 + (t - (tw - 0.4)) / 0.52 * 2900
            beams += np.exp(-((XQ + 0.45 * YQ - pos) / 110) ** 2) * 0.55
    fa = cv2.warpAffine(FOG_A, np.float32([[1, 0, -t * 3.1], [0, 1, -t * 0.9]]), (WQ, HQ),
                        borderMode=cv2.BORDER_WRAP)
    fb = cv2.warpAffine(FOG_B, np.float32([[1, 0, t * 2.3], [0, 1, -t * 1.6]]), (WQ, HQ),
                        borderMode=cv2.BORDER_WRAP)
    fog = 0.6 * fa + 0.4 * fb
    fogk = tr("fog", t)
    light = beams + glow * 0.6
    Lq = beams * (0.35 + 1.1 * fog * fogk) + light * fog * fogk * 0.25 + glow + 0.035 * fog * fogk

    # ---- god rays: core light occluded by the text silhouette
    occ_q = s["occ_q"] if s["kind"] in TEXT_KINDS else None
    src = glow * 0.9
    if occ_q is not None:
        src = src * (1 - occ_q * occ_a)
    pq = splat(px / Q, py / Q, np.full(N_P, 0.004), WQ, HQ)
    src = src + pq * (0.4 + speed.mean() * 2.0)
    if occ_q is not None:
        src = src + occ_q * em_a * 0.35
    Lq += radial_blur(src, cx / Q, cy / Q) * tr("rays", t) * (1 + 0.4 * kick_e * strobe + 0.5 * riser_e)

    # ---- shockwave rings + flash
    for ti, st in IMPACTS:
        dt = t - ti
        if 0 <= dt < 1.6:
            r = 1500 * (1 - np.exp(-dt / 0.45))
            wdt = 14 + 110 * dt
            Lq += np.exp(-((dq - r) / wdt) ** 2) * st * 1.4 * np.exp(-dt / 0.4)
    Lq += imp_f * (0.12 + 0.45 * np.exp(-(dq / 380) ** 2))
    Lq *= gain

    L = cv2.resize(Lq, (W, H), interpolation=cv2.INTER_CUBIC)
    np.maximum(L, 0, out=L)

    # ---- shadow: text silhouette darkens whatever is behind it
    if occ_q is not None and occ_a > 0:
        h = s["hero"]
        _paste(L, h["soft"], h["x0"], h["y0"], 0.96 * occ_a, op="darken")

    # ---- dust & bokeh (half res), lit by the light field
    dk = tr("dust", t) * gain
    dpush_x = np.zeros(N_D)
    dpush_y = np.zeros(N_D)
    dxr = DX0 + DVX * t + 10 * np.sin(t * DOM + DPH)
    dyr = DY0 + DVY * t + 10 * np.cos(t * DOM * 0.8 + DPH)
    dxr = np.mod(dxr, W + 100) - 50
    dyr = np.mod(dyr, H + 100) - 50
    for ti, st in IMPACTS:
        dt = t - ti
        if 0 <= dt < 4:
            vx, vy = dxr - cx, dyr - cy
            vn = np.sqrt(vx * vx + vy * vy) + 1
            f = st * 260 * (1 - np.exp(-dt / 0.07)) * np.exp(-dt / 1.1) * np.exp(-vn / 1400)
            dpush_x += vx / vn * f
            dpush_y += vy / vn * f
    dxr, dyr = dxr + dpush_x, dyr + dpush_y
    ix = np.clip((dxr / Q).astype(int), 0, WQ - 1)
    iy = np.clip((dyr / Q).astype(int), 0, HQ - 1)
    lit = 0.25 + 2.2 * light[iy, ix]
    tw = 0.5 + 0.5 * np.sin(t * 2.3 * DOM * 3 + DPH) ** 2
    dust = splat(dxr / 2, dyr / 2, DB * lit * tw * 0.9 * dk, WH, HH)
    dust = cv2.GaussianBlur(dust, (0, 0), 0.9)
    bx = np.mod(BX0 + BVX * t, W + 200) - 100
    by = np.mod(BY0 + BVY * t, H + 200) - 100
    bix = np.clip((bx / Q).astype(int), 0, WQ - 1)
    biy = np.clip((by / Q).astype(int), 0, HQ - 1)
    blit = (0.3 + 1.5 * light[biy, bix]) * BBR * dk
    for j in range(N_B):
        r = int(BRAD[j])
        sp_ = SPRITES[r]
        _paste(dust, sp_, int(bx[j] / 2) - sp_.shape[1] // 2, int(by[j] / 2) - sp_.shape[0] // 2, blit[j])
    L += cv2.resize(dust, (W, H), interpolation=cv2.INTER_LINEAR)

    # ---- formation particles with motion trails (4 sub-samples per frame)
    pg = {"cloud": 0.25, "point": 0.32, "scatter": 0.9}.get(s["kind"], 0.55 + 0.5 * (1 - em_a))
    if s["kind"] == "point" and s.get("ease") == "slow":
        pg = 0.2 + 0.25 * smooth(0, 1, u)
    if s["kind"] == "scatter":
        pg *= max(0.0, 1 - u)
    twk = 0.45 + 0.55 * np.sin(t * OM * 1.3 + PH) ** 2
    bri = BASE * twk * (1 + 1.4 * speed) * (1 + 2.5 * shim_e * SPARK) * pg * (1 + 0.3 * kick_e)
    pbuf = np.zeros((H, W), np.float32)
    shutter = 1.4 / FPS
    for j, wj in enumerate((0.4, 0.27, 0.19, 0.14)):
        if j == 0:
            x, y = px, py
        else:
            x, y, _, _, _ = particles(t - shutter * j / 3, kick_e)
        pbuf += splat(x, y, bri * wj * 7.0, W, H)
    pbuf = 6.0 * np.tanh(pbuf / 6.0)    # dense clusters saturate instead of blowing out
    pcore = cv2.GaussianBlur(pbuf, (0, 0), 0.75)
    ph_ = cv2.resize(pbuf, (WH, HH), interpolation=cv2.INTER_AREA)
    pglow = cv2.GaussianBlur(ph_, (0, 0), 3.0) * 1.6
    L += pcore + cv2.resize(pglow, (W, H), interpolation=cv2.INTER_LINEAR)

    # ---- lit text with a specular sweep
    if s["kind"] in TEXT_KINDS and (em_a > 0 or sub_a > 0):
        h = s["hero"]
        a = h["arr"]
        if em_a > 0:
            hh, ww = a.shape
            gx = np.arange(ww, dtype=np.float32)[None, :] + h["x0"]
            gy = np.arange(hh, dtype=np.float32)[:, None] + h["y0"]
            lit0 = s["at"] + s["conv"] * 0.85
            sweeps = [lit0]
            if s["end"] - s["at"] > 2 * BAR - 0.01:
                sweeps.append(s["at"] + BAR)
            sw = np.zeros_like(a)
            for t0 in sweeps:
                q = (t - t0) / 0.75
                if 0 <= q <= 1:
                    pos = h["x0"] - 250 + q * (ww + 500)
                    sw += np.exp(-((gx + 0.35 * (gy - cy) - pos) / 70) ** 2)
            _paste(L, a * (0.95 + 1.8 * sw + 0.25 * kick_e), h["x0"], h["y0"], 1.45 * em_a)
        for sl in s["subs"]:
            arr = sl["arr"]
            sig = 6.0 * (1 - sub_a)
            if sig > 0.3:
                arr = cv2.GaussianBlur(arr, (0, 0), sig)
            _paste(L, arr, sl["x0"], sl["y0"], 1.25 * sl["gain"] * sub_a)

    # ---- bloom + anamorphic streak
    Lh = cv2.resize(L, (WH, HH), interpolation=cv2.INTER_AREA)
    Lh = Lh / (1 + Lh / 5)
    bp = np.maximum(Lh - 1.1, 0)
    b1 = cv2.GaussianBlur(bp, (0, 0), 3.5)
    bq = cv2.resize(bp, (WQ // 2, HQ // 2), interpolation=cv2.INTER_AREA)
    b2 = cv2.resize(cv2.GaussianBlur(bq, (0, 0), 5), (WH, HH), interpolation=cv2.INTER_LINEAR)
    hot = np.maximum(cv2.resize(Lh, (WQ, HQ), interpolation=cv2.INTER_AREA) - 2.2, 0)
    st_ = cv2.blur(cv2.blur(hot, (71, 1)), (71, 1))
    streak = cv2.resize(st_, (WH, HH), interpolation=cv2.INTER_LINEAR) * (0.25 + 1.2 * imp_e + 0.3 * snare_e)
    L += cv2.resize(0.4 * b1 + 0.45 * b2 + streak, (W, H), interpolation=cv2.INTER_LINEAR)

    # ---- camera: slow push-in per section, punch on hits, shake on impacts
    seg = np.searchsorted(PUSH_SEGMENTS, t, side="right") - 1
    a0, a1 = PUSH_SEGMENTS[seg], PUSH_SEGMENTS[min(seg + 1, len(PUSH_SEGMENTS) - 1)]
    push = 0.045 * (t - a0) / max(a1 - a0, 1e-3)
    z = 1 + push + 0.012 * min(kick_e, 1.5) * (strobe or t >= T(40)) + 0.06 * imp_f + 0.02 * riser_e
    shake = 11 * imp_e + 2.5 * riser_e + (1.2 * kick_e if strobe else 0)
    sx = shake * (np.sin(t * 57.0) + 0.5 * np.sin(t * 31.0 + 1.3))
    sy = shake * (np.cos(t * 49.0) + 0.5 * np.sin(t * 23.0 + 0.7))
    ccx, ccy = 960, 500
    M = np.float32([[z, 0, ccx - z * ccx + sx], [0, z, ccy - z * ccy + sy]])
    L = cv2.warpAffine(L, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)

    vg = tr("vign", t)
    L *= 1 - vg * np.clip(VIGNETTE_R * 1.25, 0, 1) ** 2.2
    L += GRAIN[fi % len(GRAIN)] * GRAIN_AMP   # light dither against banding in the dark gradients
    Lm = 1 - np.exp(-1.6 * np.maximum(L, 0) * tr("exposure", t))
    return LUT[(np.clip(Lm, 0, 1) * 1023).astype(np.int32)]


# ------------------------------------------------------------- output -----
def encode(args):
    a, b, path = args
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
           "-crf", str(CRF), "-pix_fmt", "yuv420p", "-x264-params", "aq-mode=3:keyint=60", path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fi in range(a, b):
        p.stdin.write(render(fi).tobytes())
        if (fi - a) % 100 == 0:
            print(f"  chunk {os.path.basename(path)}: frame {fi}", flush=True)
    p.stdin.close()
    p.wait()
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", help="comma separated frame numbers")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--range", help="a:b frame range for --all")
    o = ap.parse_args()
    os.makedirs(BUILD, exist_ok=True)
    if o.preview:
        d = os.path.join(BUILD, "preview")
        os.makedirs(d, exist_ok=True)
        for f in [int(x) for x in o.preview.split(",")]:
            img = render(f)
            cv2.imwrite(os.path.join(d, f"f{f:04d}.png"), img[:, :, ::-1])
            print("preview", f)
    if o.all:
        a, b = (0, TOTAL_FRAMES) if not o.range else map(int, o.range.split(":"))
        n = o.workers * 3
        edges = np.linspace(a, b, n + 1).astype(int)
        cd = os.path.join(BUILD, "chunks")
        os.makedirs(cd, exist_ok=True)
        jobs = [(edges[i], edges[i + 1], os.path.join(cd, f"c{i:02d}.mp4")) for i in range(n)]
        with Pool(o.workers) as pool:
            paths = pool.map(encode, jobs, chunksize=1)
        lst = os.path.join(cd, "list.txt")
        with open(lst, "w") as f:
            f.writelines(f"file '{p}'\n" for p in paths)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
                        "-i", lst, "-c", "copy", os.path.join(BUILD, "video.mp4")], check=True)
        print("wrote", os.path.join(BUILD, "video.mp4"))


if __name__ == "__main__":
    sys.exit(main())
