"""无状态粒子渲染引擎：每一帧都只是时间 t 的函数，便于多进程分段渲染。

图层：sharp（全分辨率）/ soft（1/2 分辨率模糊）/ bokeh（1/4 分辨率大光斑），
后期：多级辉光（bloom）、横向镜头光晕、体积光、Loyel 深蓝底雾、暗角、色调映射、文字合成。
配色严格取自 Loyel 渐变蓝十档色板。
"""
import os
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from timeline import W, H, HITS

cv2.setNumThreads(1)
HERE = os.path.dirname(os.path.abspath(__file__))

# ------------------------------------------------------------------ 色板
LOYEL = {10: "#F4F7FB", 20: "#E8EEF6", 30: "#CCDBEB", 40: "#9FBDDA", 50: "#6C9AC4",
         60: "#497DAE", 70: "#376392", 80: "#2E5076", 90: "#2B4868", 100: "#263B54"}


def srgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.0


def lin(h):
    return srgb(h) ** 2.2


C = {k: lin(v) for k, v in LOYEL.items()}          # 线性光颜色（用于粒子叠加）
D = {k: srgb(v) for k, v in LOYEL.items()}         # 显示空间颜色（用于文字）
D_WHITE = np.ones(3, np.float32)

_RAMP_KEYS = [70, 60, 50, 40, 30, 20, 10]
_RAMP = np.stack([C[k] for k in _RAMP_KEYS])


def ramp(v):
    """0→1 映射到 Loyel 70 → 10（深蓝到近白）。"""
    v = np.clip(np.asarray(v, np.float32), 0, 1) * (len(_RAMP) - 1)
    i0 = np.floor(v).astype(int)
    i1 = np.minimum(i0 + 1, len(_RAMP) - 1)
    f = (v - i0)[..., None]
    return _RAMP[i0] * (1 - f) + _RAMP[i1] * f


# ------------------------------------------------------------------ 缓动与包络
def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def seg(t, a, b):
    return clamp01((t - a) / (b - a))


def smooth(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def ease_out(x, p=3):
    return 1 - (1 - clamp01(x)) ** p


def ease_in(x, p=3):
    return clamp01(x) ** p


def ease_io(x):
    x = clamp01(x)
    return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)


def env(t, a, b, fi=0.6, fo=0.6):
    """[a, b] 区间内的淡入淡出包络。"""
    return float(smooth((t - a) / fi) * smooth((b - t) / fo))


def pulse_train(t, times, decay=0.25, width=0.0):
    v = 0.0
    for tt in times:
        if tt - width <= t:
            v = max(v, np.exp(-(t - tt) / decay)) if t >= tt else max(v, smooth((t - tt + width) / width))
    return v


def hit_level(t, decay=0.35):
    v = 0.0
    for th, s in HITS:
        if t >= th:
            v = max(v, s * np.exp(-(t - th) / decay))
    return v


def shake(t):
    v = hit_level(t, 0.18)
    return np.array([np.sin(t * 91.0) + 0.5 * np.sin(t * 57.0), np.cos(t * 83.0) + 0.5 * np.sin(t * 41.0)]) * 9.0 * v


# ------------------------------------------------------------------ 帧
class Frame:
    def __init__(self, t):
        self.t = t
        self.layers = ([], [], [])
        self.add_img = []          # (img(h,w,3) 线性光, x, y) 直接叠加
        self.texts = []            # 文字（显示空间合成）
        self.dark = []             # 文字后方压暗
        self.look = dict(bloom=0.9, streak=0.0, rays=0.0, rays_center=(W / 2, H / 2), fog=1.0,
                         exposure=1.0, flash=0.0, vignette=1.0)

    def pts(self, x, y, w, col, layer=0):
        self.layers[layer].append((x, y, w, col))

    def streaks(self, x, y, vx, vy, w, col, n=6, layer=0):
        """沿速度方向复制若干采样，形成运动拖尾。"""
        for k in range(n):
            f = k / max(n - 1, 1)
            self.pts(x - vx * f, y - vy * f, w * (1 - 0.8 * f) / n * 2, col, layer)


def _splat(items, s):
    Wl, Hl = W // s, H // s
    out = np.zeros((Hl, Wl, 3), np.float32)
    idxs, wts = [], []
    for x, y, w, col in items:
        x = np.asarray(x, np.float32).ravel() / s - 0.5
        y = np.asarray(y, np.float32).ravel() / s - 0.5
        w = np.broadcast_to(np.asarray(w, np.float32), x.shape)
        col = np.asarray(col, np.float32)
        x0 = np.floor(x)
        y0 = np.floor(y)
        fx = x - x0
        fy = y - y0
        x0 = x0.astype(np.int32)
        y0 = y0.astype(np.int32)
        m = (x0 >= 0) & (y0 >= 0) & (x0 < Wl - 1) & (y0 < Hl - 1) & (w > 1e-5)
        if not m.any():
            continue
        x0, y0, fx, fy, w = x0[m], y0[m], fx[m], fy[m], w[m]
        base = y0 * Wl + x0
        idxs.append(np.concatenate([base, base + 1, base + Wl, base + Wl + 1]))
        w4 = np.concatenate([w * (1 - fx) * (1 - fy), w * fx * (1 - fy), w * (1 - fx) * fy, w * fx * fy])
        if col.ndim == 1:
            wts.append(w4[:, None] * col[None, :])
        else:
            wts.append(w4[:, None] * np.tile(col[m], (4, 1)))
    if idxs:
        I = np.concatenate(idxs)
        Wt = np.concatenate(wts)
        for c in range(3):
            out[..., c] = np.bincount(I, Wt[:, c], minlength=Hl * Wl).reshape(Hl, Wl)
    return out


def _up(img):
    return cv2.resize(img, (W, H), interpolation=cv2.INTER_LINEAR)


@lru_cache(None)
def _statics():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    nx = (xx - W / 2) / (W / 2)
    ny = (yy - H / 2) / (H / 2)
    r2 = nx * nx * 0.8 + ny * ny
    vig = (1 - 0.42 * np.clip(r2, 0, 2) ** 1.1).astype(np.float32)
    fog = (np.exp(-r2 / 0.9) * 0.55 + 0.25 * np.exp(-((ny + 1.1) ** 2) / 0.5)).astype(np.float32)
    fog = fog[..., None] * C[100][None, None, :] * 0.40
    rng = np.random.default_rng(3)
    grain = [(rng.random((H, W)) - rng.random((H, W))).astype(np.float32) * 1.6 / 255 for _ in range(6)]
    flash = (0.08 + 0.92 * np.exp(-r2 / 0.12)).astype(np.float32)[..., None]
    return vig[..., None], fog.astype(np.float32), grain, flash


def _radial_blur(img, center, strength, samples=18):
    h, w = img.shape[:2]
    cx, cy = center[0] * w / W, center[1] * h / H
    acc = img.copy()
    for k in range(1, samples):
        s = 1 + strength * k / samples
        M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
        acc += cv2.warpAffine(img, M, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT) * (1 - k / samples)
    return acc / samples * 2.0


def finish(fr):
    lk = fr.look
    sharp = _splat(fr.layers[0], 1)
    soft = _splat(fr.layers[1], 2)
    bok = _splat(fr.layers[2], 4)
    img = sharp
    img += _up(cv2.GaussianBlur(soft, (0, 0), 1.3))
    img += _up(cv2.GaussianBlur(bok, (0, 0), 2.4))
    for a, x, y in fr.add_img:
        _blit_add(img, a, x, y)

    q = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    b1 = cv2.GaussianBlur(q, (0, 0), 3)
    q8 = cv2.resize(q, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    b2 = cv2.GaussianBlur(q8, (0, 0), 5)
    q16 = cv2.resize(q8, (W // 16, H // 16), interpolation=cv2.INTER_AREA)
    b3 = cv2.GaussianBlur(q16, (0, 0), 6)
    bq = b1 * 0.55 + cv2.resize(b2, (W // 4, H // 4)) * 0.45 + cv2.resize(b3, (W // 4, H // 4)) * 0.45
    if lk["streak"] > 0:
        s = np.maximum(q - 0.35, 0)
        s = cv2.GaussianBlur(s, (0, 0), sigmaX=55, sigmaY=0.7)
        bq += s.mean(axis=2, keepdims=True) * C[40][None, None, :] * (lk["streak"] * 6.0)
    if lk["rays"] > 0:
        bq += _radial_blur(cv2.GaussianBlur(np.maximum(q - 0.05, 0), (0, 0), 2.0), lk["rays_center"], 0.4) * lk["rays"]
    img += _up(bq) * lk["bloom"]

    vig, fog, grain, flash = _statics()
    img += fog * lk["fog"]
    for m, x, y, a in fr.dark:
        _blit_mul(img, 1 - m * a, x, y)
    if lk["flash"] > 0:
        img += flash * C[30][None, None, :] * lk["flash"]
    img = 1.0 - np.exp(-img * lk["exposure"])
    img *= vig if lk["vignette"] >= 1 else (1 - (1 - vig) * lk["vignette"])
    img = cv2.pow(np.maximum(img, 0), 1 / 2.2)
    for m, x, y, a, col in fr.texts:
        _blit_over(img, m, x, y, a, col)
    img += grain[int(fr.t * 30) % len(grain)][..., None]
    return np.clip(img * 255 + 0.5, 0, 255).astype(np.uint8)


def _clip_box(h, w, x, y):
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(x, 0), max(y, 0)
    x1, y1 = min(x + w, W), min(y + h, H)
    if x0 >= x1 or y0 >= y1:
        return None
    return (y0 - y, y1 - y, x0 - x, x1 - x), (y0, y1, x0, x1)


def _blit_add(img, a, x, y):
    b = _clip_box(a.shape[0], a.shape[1], x, y)
    if b:
        (sy0, sy1, sx0, sx1), (dy0, dy1, dx0, dx1) = b
        img[dy0:dy1, dx0:dx1] += a[sy0:sy1, sx0:sx1]


def _blit_mul(img, m, x, y):
    b = _clip_box(m.shape[0], m.shape[1], x, y)
    if b:
        (sy0, sy1, sx0, sx1), (dy0, dy1, dx0, dx1) = b
        img[dy0:dy1, dx0:dx1] *= m[sy0:sy1, sx0:sx1, None]


def _blit_over(img, m, x, y, a, col):
    b = _clip_box(m.shape[0], m.shape[1], x, y)
    if b:
        (sy0, sy1, sx0, sx1), (dy0, dy1, dx0, dx1) = b
        k = m[sy0:sy1, sx0:sx1, None] * a
        reg = img[dy0:dy1, dx0:dx1]
        img[dy0:dy1, dx0:dx1] = reg * (1 - k) + np.asarray(col, np.float32)[None, None, :] * k


# ------------------------------------------------------------------ 文字
FONTS = {
    "serif": "NotoSerifSC-Black.ttf",
    "bold": "NotoSansSC-Bold.ttf",
    "med": "NotoSansSC-Medium.ttf",
    "light": "NotoSansSC-Light.ttf",
    "cinzel": "Cinzel-Bold.ttf",
    "oswald": "Oswald-Light.ttf",
    "oswaldm": "Oswald-Medium.ttf",
}


@lru_cache(None)
def font(name, size):
    return ImageFont.truetype(os.path.join(HERE, "fonts", FONTS[name]), size)


PAD = 24


@lru_cache(None)
def text_mask(text, fname, size, tracking=0):
    f = font(fname, size)
    asc, desc = f.getmetrics()
    if tracking == 0:
        w = int(f.getlength(text))
    else:
        w = int(sum(f.getlength(ch) + tracking for ch in text) - tracking)
    img = Image.new("L", (w + 2 * PAD, asc + desc + 2 * PAD), 0)
    d = ImageDraw.Draw(img)
    if tracking == 0:
        d.text((PAD, PAD), text, font=f, fill=255)
    else:
        x = PAD
        for ch in text:
            d.text((x, PAD), ch, font=f, fill=255)
            x += f.getlength(ch) + tracking
    m = np.asarray(img, np.float32) / 255.0
    return m


@lru_cache(None)
def text_glow(text, fname, size, tracking, sigma):
    m = text_mask(text, fname, size, tracking)
    return cv2.GaussianBlur(m, (0, 0), sigma)


def text_size(text, fname, size, tracking=0):
    m = text_mask(text, fname, size, tracking)
    return m.shape[1] - 2 * PAD, m.shape[0] - 2 * PAD


def text(fr, s, fname, size, x, y, alpha=1.0, col=None, anchor="l", tracking=0, glow=0.35,
         glow_col=None, shadow=0.55, slide=0.0):
    """在显示空间合成文字；x,y 为文字框左上（anchor='c' 时 x 为中心）。"""
    if alpha <= 0.003:
        return
    col = D_WHITE if col is None else col
    m = text_mask(s, fname, size, tracking)
    w = m.shape[1]
    ox = x - PAD - (w - 2 * PAD) / 2 if anchor == "c" else (x - PAD - (w - 2 * PAD) if anchor == "r" else x - PAD)
    oy = y - PAD + slide
    if shadow > 0:
        g = text_glow(s, fname, size, tracking, max(6, size * 0.35))
        fr.dark.append((np.clip(g * 2.2, 0, 1), ox, oy, shadow * alpha))
    if glow > 0:
        g = text_glow(s, fname, size, tracking, max(3, size * 0.12))
        gc = C[40] if glow_col is None else glow_col
        fr.add_img.append((g[..., None] * gc[None, None, :] * (glow * alpha * 1.6), ox, oy))
    fr.texts.append((m, ox, oy, alpha, col))


def text_cue(fr, t, s, fname, size, x, y, t_in, t_out, col=None, anchor="l", tracking=0, glow=0.35,
             fade=0.6, rise=16, shadow=0.55):
    a = env(t, t_in, t_out, fade, fade * 0.8)
    if a <= 0:
        return
    slide = (1 - ease_out(seg(t, t_in, t_in + fade * 1.4))) * rise
    text(fr, s, fname, size, x, y, a, col, anchor, tracking, glow, None, shadow, slide)


def mask_points(mask, n, rng, thresh=0.35):
    ys, xs = np.nonzero(mask > thresh)
    k = rng.integers(0, len(xs), n)
    return np.stack([xs[k] + rng.random(n) - 0.5, ys[k] + rng.random(n) - 0.5], 1).astype(np.float32)


# ------------------------------------------------------------------ 公共元素
@lru_cache(None)
def _dust():
    rng = np.random.default_rng(11)
    n = 1500
    return dict(x=rng.uniform(0, W + 200, n), y=rng.uniform(0, H + 200, n), z=rng.uniform(0.1, 1.0, n) ** 1.5,
                vx=rng.normal(0, 5, n), vy=-rng.uniform(3, 12, n), ph=rng.uniform(0, 6.28, n),
                tw=rng.uniform(0.3, 1.4, n), c=rng.random(n))


def dust(fr, t, amount=1.0, wind=(0.0, 0.0), zoom=1.0):
    if amount <= 0:
        return
    d = _dust()
    z = d["z"]
    x = (d["x"] + (d["vx"] + wind[0]) * z * t + 25 * np.sin(0.21 * t + d["ph"])) % (W + 200) - 100
    y = (d["y"] + (d["vy"] + wind[1]) * z * t + 18 * np.cos(0.17 * t + d["ph"])) % (H + 200) - 100
    if zoom != 1.0:
        x = (x - W / 2) * (1 + (zoom - 1) * z) + W / 2
        y = (y - H / 2) * (1 + (zoom - 1) * z) + H / 2
    tw = 0.55 + 0.45 * np.sin(t * d["tw"] + d["ph"])
    col = ramp(0.25 + 0.6 * d["c"])
    near = z > 0.62
    mid = (z > 0.3) & ~near
    far = ~(near | mid)
    fr.pts(x[near], y[near], (amount * 0.9 * tw * z)[near], col[near], 2)
    fr.pts(x[mid], y[mid], (amount * 0.5 * tw)[mid], col[mid], 1)
    fr.pts(x[far], y[far], (amount * 0.35 * tw)[far], col[far], 0)


def glow_blob(fr, x, y, r, w, col):
    """用若干 bokeh 粒子构成柔和光团。"""
    xs, ys, ws = [x], [y], [1.0]
    for rr, k, ww in ((0.35, 10, 0.8), (0.7, 16, 0.55), (1.0, 24, 0.3)):
        a = np.linspace(0, 2 * np.pi, k, endpoint=False) + rr
        xs += list(x + r * rr * np.cos(a))
        ys += list(y + r * rr * np.sin(a))
        ws += [ww] * k
    ws = np.array(ws, np.float32)
    fr.pts(np.array(xs), np.array(ys), ws * (w * 4.0 / ws.sum() * 3), col, 2 if r > 12 else 1)


def ring(fr, x, y, r, w, col, n=None, layer=0, jitter=0.0, rng=None):
    n = n or max(32, int(r * 1.2))
    a = np.linspace(0, 2 * np.pi, n, endpoint=False)
    rr = r if jitter == 0 else r + (rng.normal(0, jitter, n) if rng is not None else 0)
    fr.pts(x + rr * np.cos(a), y + rr * np.sin(a), w, col, layer)


def polyline_pts(P, spacing=2.0):
    """把折线按固定间距重采样。"""
    P = np.asarray(P, np.float32)
    d = np.sqrt(((P[1:] - P[:-1]) ** 2).sum(1))
    s = np.concatenate([[0], np.cumsum(d)])
    if s[-1] <= 0:
        return P[:1]
    u = np.arange(0, s[-1], spacing)
    return np.stack([np.interp(u, s, P[:, 0]), np.interp(u, s, P[:, 1])], 1)


def bezier(p0, p1, p2, p3, n=200):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(lambda p: np.asarray(p, np.float32), (p0, p1, p2, p3))
    return ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 + 3 * (1 - t) * t * t * p2 + t ** 3 * p3


def catmull_closed(P, n_per=24):
    P = np.asarray(P, np.float32)
    n = len(P)
    out = []
    for i in range(n):
        p0, p1, p2, p3 = P[i - 1], P[i], P[(i + 1) % n], P[(i + 2) % n]
        for t in np.linspace(0, 1, n_per, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    return np.array(out)


def catmull_open(P, n_per=24):
    P = np.asarray(P, np.float32)
    P = np.vstack([2 * P[0] - P[1], P, 2 * P[-1] - P[-2]])
    out = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, n_per, endpoint=False):
            t2, t3 = t * t, t * t * t
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    out.append(P[-2])
    return np.array(out)
