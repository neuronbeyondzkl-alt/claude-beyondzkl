"""逐帧渲染《Behave》浓缩视频，并与 build/score.wav 合成为 MP4。

画面管线（每帧）：
  粒子形体插值（贝塞尔弧线 + 错峰）→ 重音爆发位移 → 相机投影（含运动模糊采样）
  → 三层景深（清晰 / 半分辨率柔焦 / 四分之一分辨率散景）→ 顶光体积光束 + 粒子光柱 + 多级辉光
  → 横向变形镜头光晕 → 色调映射 → 字幕 → 镜头震动 / 冲击缩放 / 色散 → 暗角与胶片颗粒

用法：
  python3 render.py                    完整渲染 → behave.mp4
  python3 render.py --stills 8,64,100  只导出指定秒数的静帧（检查用）
  python3 render.py --start 60 --end 70 --scale 0.5   局部低清预览
"""
import argparse
import math
import multiprocessing as mp
import os
import subprocess
import sys
import time

import cv2
import numba
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import shapes as S
from timeline import (BAR, BEAT, DURATION, FPS, H as H0, HITS, LADDER, LADDER_NODES, LADDER_START, LOYEL,
                      SECTIONS, SHAPES, T, TEXTS, W as W0)

cv2.setNumThreads(1)
HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
NP = S.NP
ND = 1600
NF = int(round(DURATION * FPS))
rng = np.random.default_rng(7)

CFG = {"scale": 1.0}
W, H, SC = W0, H0, 1.0


def set_scale(s):
    global W, H, SC
    CFG["scale"] = s
    W, H, SC = int(W0 * s) // 2 * 2, int(H0 * s) // 2 * 2, s


def srgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.0


L = S.L
LD = {k: srgb(v) for k, v in LOYEL.items()}   # 显示空间颜色（字幕、界面）

# ---------------------------------------------------------------- 形体时间线
KEYS = []
_prev = None
for ts, name, dur, mode, params in SHAPES:
    _prev = S.build(name, params, _prev)
    KEYS.append((ts, _prev, dur, mode))
KEY_T = np.array([k[0] for k in KEYS])

R0, R1, R2, R3 = rng.random((4, NP)).astype(np.float32)
RDIR = rng.normal(0, 1, (NP, 3)).astype(np.float32)
RDIR /= np.linalg.norm(RDIR, axis=1, keepdims=True)
TW_F = rng.uniform(1.5, 6.0, NP).astype(np.float32)
TW_P = rng.uniform(0, 6.28, NP).astype(np.float32)
WOB = rng.uniform(0.4, 1.3, (NP, 3)).astype(np.float32)
SIZE_BIG = R3 < 0.2

STAGGER = {"swarm": 0.45, "burst": 0.22, "snap": 0.12}


def ease(mode, u):
    if mode == "burst":
        return np.where(u < 0.5, 4 * u ** 3, 1 - (-2 * u + 2) ** 3 / 2)
    if mode == "snap":
        return 1 - (1 - u) ** 4
    return u * u * (3 - 2 * u)


def particles(t, ctx):
    k = int(np.searchsorted(KEY_T, t, side="right") - 1)
    ts, sh, dur, mode = KEYS[k]
    tl = t - ts
    pc, cc = sh(t, tl, ctx)
    center = sh.center
    if k == 0 or tl >= dur:
        return pc, cc, center, 1.0
    pts, psh = KEYS[k - 1][0], KEYS[k - 1][1]
    pp, cp = psh(t, t - pts, ctx)
    st = STAGGER[mode]
    u = np.clip((tl - R0 * st * dur) / (dur * (1 - st)), 0, 1)
    e = ease(mode, u)[:, None]
    if mode == "burst":
        out = pp - psh.center
        n = np.linalg.norm(out, axis=1, keepdims=True) + 1e-4
        ctrl = pp + (out / n * 0.7 + RDIR * 0.5) * (0.25 + 0.55 * R1)[:, None]
    elif mode == "swarm":
        ctrl = (pp + pc) / 2 + RDIR * (0.12 + 0.3 * R1)[:, None]
    else:
        ctrl = (pp + pc) / 2 + RDIR * (0.05 + 0.12 * R1)[:, None]
    pos = (1 - e) ** 2 * pp + 2 * (1 - e) * e * ctrl + e ** 2 * pc
    col = cp * (1 - e) + cc * e
    if mode in ("burst", "snap"):
        col = col * (1 + 0.8 * np.sin(np.pi * e))
    mid = float(np.mean(e))
    return pos.astype(np.float32), col.astype(np.float32), psh.center * (1 - mid) + center * mid, mid


# ---------------------------------------------------------------- 重音包络（逐帧预计算）
def hit_envelopes():
    tt = np.arange(NF + 2) / FPS
    env = {k: np.zeros(NF + 2, np.float32) for k in
           ("flash", "shake", "zoom", "ca", "kick", "streak", "suck", "glow")}
    P = {  # kind: flash, shake(px), zoom, ca, kick, streak, glow
        "big": (0.55, 16, 0.045, 0.007, 0.26, 1.6, 1.0),
        "button": (0.35, 8, 0.03, 0.004, 0.12, 1.0, 0.7),
        "step": (0.2, 7, 0.022, 0.0035, 0.12, 0.7, 0.5),
        "word": (0.16, 8, 0.03, 0.005, 0.09, 0.6, 0.45),
        "pulse": (0.08, 3, 0.012, 0.002, 0.05, 0.35, 0.3),
    }
    for th, kind, s in HITS:
        fl, sh, zo, ca, ki, stk, gl = P[kind]
        tau = tt - th
        on = tau >= 0
        tp = np.where(on, tau, 0)
        env["flash"] += on * s * fl * np.exp(-tp / 0.07)
        env["shake"] += on * s * sh * np.exp(-tp / 0.16)
        env["zoom"] += on * s * zo * np.exp(-tp / 0.22)
        env["ca"] += on * s * ca * np.exp(-tp / 0.14)
        env["kick"] += on * s * ki * (tp / 0.06) * np.exp(1 - tp / 0.06) * (tp < 1.5)
        env["streak"] += on * s * stk * np.exp(-tp / 0.3)
        env["glow"] += on * s * gl * np.exp(-tp / 0.35)
        if kind == "big":
            pre = np.clip((tau + 0.45) / 0.45, 0, 1) * (tau < 0)
            env["suck"] += s * 0.07 * pre ** 2
    return env


ENV = hit_envelopes()


def keyframes(pairs):
    xs = np.array([p[0] for p in pairs])
    ys = np.array([p[1] for p in pairs])
    return lambda t: float(np.interp(t, xs, ys))


BLOOM = keyframes([(0, 0.8), (T(4), 1.4), (T(6), 1.0), (T(12), 0.9), (T(30), 1.2), (T(32), 1.0), (T(40), 0.9),
                   (T(48), 1.25), (T(56), 1.4), (T(62), 1.0)])
RAYS = keyframes([(0, 0.0), (T(3), 0.12), (T(4), 0.6), (T(6), 0.3), (T(8), 0.18), (T(12), 0.22), (T(29), 0.3),
                  (T(30), 0.5), (T(32), 0.32), (T(40), 0.12), (T(46), 0.3), (T(48), 0.55), (T(54), 0.75),
                  (T(56), 0.85), (T(60), 0.3), (T(62), 0.0)])
SHAFTS = keyframes([(0, 0.35), (T(4), 1.0), (T(8), 0.5), (T(12), 0.5), (T(30), 0.85), (T(32), 0.6), (T(40), 0.45),
                    (T(48), 0.85), (T(54), 1.2), (T(56), 1.05), (T(62), 0.6)])
DUSTG = keyframes([(0, 0.15), (T(2), 0.45), (T(4), 1.0), (T(40), 0.75), (T(48), 1.2), (T(60), 0.8), (T(62), 0.3)])
FADE = keyframes([(0, 0.0), (0.12, 1.0), (T(60, 3), 1.0), (T(61, 3.8), 0.0), (DURATION, 0.0)])
EXPOSURE = 2.4


def section_push(t):
    for name, a, b in SECTIONS:
        if T(a) <= t < T(b):
            u = (t - T(a)) / (T(b) - T(a))
            return 1 + 0.045 * (u * u * (3 - 2 * u))
    return 1.0


# ---------------------------------------------------------------- 环境尘埃（散景）
DUST_P = np.stack([rng.uniform(-2.6, 2.6, ND), rng.uniform(-1.6, 1.6, ND), rng.uniform(-1.8, 4.5, ND)], 1)
DUST_V = rng.uniform(0.015, 0.06, ND)
DUST_C = S.mix_colors([L[30], L[40], L[50], S.CG, S.CO], [3, 3, 3, 1, 1], ND) * \
    rng.uniform(0.05, 0.22, ND)[:, None].astype(np.float32)


def dust(t):
    p = DUST_P.copy()
    p[:, 1] = (p[:, 1] + 1.6 + DUST_V * t) % 3.2 - 1.6
    p[:, 0] += 0.06 * np.sin(t * 0.3 + DUST_P[:, 2] * 3)
    tw = 0.6 + 0.4 * np.sin(t * 1.3 + DUST_P[:, 0] * 7)
    return p.astype(np.float32), (DUST_C * tw[:, None]).astype(np.float32)


# ---------------------------------------------------------------- 投影与泼溅
CAM_D = 4.0


def project(p, t, zoom, yaw, pitch):
    ca, sa = math.cos(yaw), math.sin(yaw)
    x = p[:, 0] * ca + p[:, 2] * sa
    z = -p[:, 0] * sa + p[:, 2] * ca
    cp, sp = math.cos(pitch), math.sin(pitch)
    y = p[:, 1] * cp - z * sp
    z = p[:, 1] * sp + z * cp
    zc = z + CAM_D
    s = np.where(zc > 0.2, CAM_D / np.maximum(zc, 0.2), 0)
    sx = W / 2 + x * s * (H / 2) * zoom
    sy = H / 2 - y * s * (H / 2) * zoom
    return sx.astype(np.float32), sy.astype(np.float32), zc.astype(np.float32), s.astype(np.float32)


@numba.njit(cache=True)
def splat(img, xs, ys, cols, k):
    """双线性泼溅；xs/ys 已按图层分辨率缩放。"""
    h, w = img.shape[0], img.shape[1]
    for i in range(xs.shape[0]):
        x = xs[i] * k - 0.5
        y = ys[i] * k - 0.5
        if x < 0 or y < 0 or x >= w - 1 or y >= h - 1:
            continue
        x0 = int(x)
        y0 = int(y)
        fx = x - x0
        fy = y - y0
        for c in range(3):
            v = cols[i, c]
            img[y0, x0, c] += v * (1 - fx) * (1 - fy)
            img[y0, x0 + 1, c] += v * fx * (1 - fy)
            img[y0 + 1, x0, c] += v * (1 - fx) * fy
            img[y0 + 1, x0 + 1, c] += v * fx * fy


# ---------------------------------------------------------------- 背景光
class Background:
    def __init__(self):
        self.qw, self.qh = W // 4, H // 4
        yy, xx = np.mgrid[0:self.qh, 0:self.qw].astype(np.float32)
        sx, sy = self.qw * 0.5, -self.qh * 0.35
        self.theta = np.arctan2(xx - sx, yy - sy)
        dist = np.hypot(xx - sx, yy - sy) / self.qh
        self.fall = (np.exp(-dist / 0.6) * np.clip((dist - 0.15) / 0.35, 0, 1)).astype(np.float32)
        r = np.hypot((xx - self.qw / 2) / self.qw, (yy - self.qh * 0.55) / self.qh)
        self.base = (np.exp(-r * r / 0.12)[..., None] * L[100] * 0.05 + L[100] * 0.004).astype(np.float32)
        self.freq = rng.uniform(5, 23, 7)
        self.ph = rng.uniform(0, 6.28, 7)
        self.om = rng.uniform(-0.25, 0.25, 7)
        self.amp = rng.uniform(0.4, 1.0, 7)

    def __call__(self, t, gain, kick):
        rays = np.zeros_like(self.theta)
        for f, p, o, a in zip(self.freq, self.ph, self.om, self.amp):
            rays += a * (0.5 + 0.5 * np.sin(f * self.theta + p + o * t)) ** 16
        rays = rays * self.fall * gain * (1 + 0.7 * kick)
        col = L[50] * 0.6 + L[40] * 0.4
        return self.base + rays[..., None] * col * 0.07


# ---------------------------------------------------------------- 字幕
STYLE = {  # font, size, color, tracking(em), glow color, glow strength, line spacing
    "big": ("serif_black", 74, LOYEL[10], 0.06, LOYEL[50], 0.55, 1.5),
    "line": ("serif_bold", 52, LOYEL[20], 0.05, LOYEL[60], 0.45, 1.55),
    "sub": ("sans", 34, LOYEL[30], 0.22, LOYEL[60], 0.35, 1.5),
    "body": ("sans", 36, LOYEL[20], 0.04, LOYEL[70], 0.25, 1.7),
    "en": ("garamond", 24, LOYEL[40], 0.3, LOYEL[60], 0.3, 1.4),
    "tag": ("serif_bold", 44, LOYEL[30], 0.1, LOYEL[60], 0.45, 1.4),
    "counter": ("serif_black", 100, LOYEL[10], 0.02, LOYEL[50], 0.6, 1.3),
    "tagline": ("garamond_italic", 48, LOYEL[30], 0.04, LOYEL[50], 0.4, 1.3),
    "note": ("sans", 20, LOYEL[50], 0.12, LOYEL[80], 0.0, 1.4),
    "node": ("sans", 19, LOYEL[40], 0.08, LOYEL[80], 0.0, 1.4),
}


def render_text(text, style, color=None):
    font, size, c, track, gc, gs, lh = STYLE[style]
    if style == "en" and len(text) > 34:
        size, track = 21, 0.16
    size = max(8, int(round(size * SC)))
    f = ImageFont.truetype(S.FONT[font], size)
    lines = text.split("\n")
    widths = [sum(f.getlength(ch) for ch in ln) + track * size * max(len(ln) - 1, 0) for ln in lines]
    pad = int(size * 0.9)
    w = int(max(widths) + 2 * pad)
    h = int(size * lh * len(lines) + 2 * pad)
    img = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(img)
    for li, ln in enumerate(lines):
        x = pad
        y = pad + li * size * lh
        for ch in ln:
            d.text((x, y), ch, font=f, fill=255)
            x += f.getlength(ch) + track * size
    a = np.asarray(img, np.float32) / 255.0
    glow = cv2.GaussianBlur(a, (0, 0), size * 0.35) * 1.6 + cv2.GaussianBlur(a, (0, 0), size * 1.1) * 0.9
    col = srgb(color or c)
    gcol = srgb(gc)
    return {"a": a, "glow": glow * gs, "col": col, "gcol": gcol, "w": w, "h": h, "pad": pad,
            "line_w": widths, "size": size}


class TextLayer:
    def __init__(self):
        self.cache = {}
        self.items = TEXTS
        nodes = [render_text(n, "node") for n in LADDER_NODES]
        self.nodes = nodes

    def get(self, it):
        key = (it["text"], it["style"], it.get("color"))
        if key not in self.cache:
            self.cache[key] = render_text(it["text"], it["style"], it.get("color"))
        return self.cache[key]

    def draw(self, img, t):
        for it in self.items:
            if not (it["t0"] - 0.01 <= t < it["t1"] + 0.25):
                continue
            r = self.get(it)
            anim = it.get("anim", "slam" if it["style"] in ("counter",) else "rise")
            a_in = t - it["t0"]
            a_out = t - it["t1"]
            scale, dy, wipe, alpha, ghost = 1.0, 0.0, 1.0, 1.0, 0.0
            if anim == "slam":
                u = np.clip(a_in / 0.14, 0, 1)
                scale = 1 + 0.32 * (1 - u) ** 3
                alpha = min(1.0, a_in / 0.04)
                ghost = math.exp(-a_in / 0.12)
                if a_out > 0:
                    alpha *= max(0.0, 1 - a_out / 0.12)
            else:
                u = np.clip(a_in / 0.45, 0, 1)
                alpha = u * u * (3 - 2 * u)
                dy = 16 * SC * (1 - alpha)
                wipe = np.clip(a_in / 0.55, 0, 1)
                if a_out > 0:
                    v = np.clip(a_out / 0.22, 0, 1)
                    alpha *= 1 - v
                    dy -= 14 * SC * v
            if alpha <= 0.002:
                continue
            self.blit(img, r, it["pos"], it.get("anchor", "c"), alpha, scale, dy, wipe, ghost)

    def blit(self, img, r, pos, anchor, alpha, scale=1.0, dy=0.0, wipe=1.0, ghost=0.0):
        a, glow = r["a"], r["glow"]
        if abs(scale - 1) > 1e-3:
            a = cv2.resize(a, None, fx=scale, fy=scale, interpolation=cv2.INTER_LINEAR)
            glow = cv2.resize(glow, (a.shape[1], a.shape[0]), interpolation=cv2.INTER_LINEAR)
        h, w = a.shape
        if wipe < 1:
            ramp = np.clip((wipe * (w + 0.3 * w) - np.arange(w)) / (0.3 * w), 0, 1).astype(np.float32)
            a = a * ramp[None]
            glow = glow * ramp[None]
        cx, cy = pos[0] * W, pos[1] * H + dy
        if anchor == "l":
            x0 = int(cx - r["pad"] * scale)
        else:
            x0 = int(cx - w / 2)
        y0 = int(cy - h / 2)
        xa, ya = max(0, x0), max(0, y0)
        xb, yb = min(W, x0 + w), min(H, y0 + h)
        if xb <= xa or yb <= ya:
            return
        sa = a[ya - y0:yb - y0, xa - x0:xb - x0, None] * alpha
        sg = glow[ya - y0:yb - y0, xa - x0:xb - x0, None] * alpha
        reg = img[ya:yb, xa:xb]
        reg[:] = 1 - (1 - reg) * (1 - np.clip(sg * r["gcol"], 0, 1))
        if ghost > 0.01:
            off = int(10 * SC * ghost) + 1
            for sh, gc in ((-off, srgb(LOYEL[50])), (off, srgb("#E08A3C"))):
                g = np.roll(sa, sh, axis=1) * ghost * 0.6
                reg[:] = 1 - (1 - reg) * (1 - g * gc)
        reg[:] = reg * (1 - sa) + r["col"] * sa

    def ladder_bar(self, img, t):
        """倒带阶梯底部的时间轴：9 个节点，随每次冲击点亮。"""
        a = min(1.0, max(0.0, (t - T(LADDER_START)) / 0.4)) * min(1.0, max(0.0, (T(30) - t) / 0.3))
        if a <= 0:
            return
        y = int(0.925 * H)
        x0, x1 = 0.085 * W, 0.915 * W
        xs = [x0 + (x1 - x0) * i / (len(LADDER) - 1) for i in range(len(LADDER))]
        cur = min(len(LADDER) - 1, int((t - T(LADDER_START)) // (2 * BAR)))
        tcur = t - T(LADDER_START + 2 * cur)
        fill = xs[max(cur - 1, 0)] + (xs[cur] - xs[max(cur - 1, 0)]) * min(1.0, tcur / 0.3)
        ov = np.zeros_like(img)
        th = max(1, int(round(2 * SC)))
        cv2.line(ov, (int(x0), y), (int(x1), y), tuple(float(v) for v in LD[80] * 0.9), th, cv2.LINE_AA)
        cv2.line(ov, (int(x0), y), (int(fill), y), tuple(float(v) for v in LD[40]), th + 1, cv2.LINE_AA)
        for i, x in enumerate(xs):
            on = i <= cur
            rad = int((7 if i == cur else 5) * SC)
            col = LD[30] if on else LD[80]
            cv2.circle(ov, (int(x), y), rad, tuple(float(v) for v in col), -1 if on else th, cv2.LINE_AA)
            if i == cur:
                pr = int((10 + 16 * min(1.0, tcur / 0.5)) * SC)
                fade = max(0.0, 1 - tcur / 0.5)
                cv2.circle(ov, (int(x), y), pr, tuple(float(v) * fade for v in LD[40]), th, cv2.LINE_AA)
        img[:] = 1 - (1 - img) * (1 - ov * a)
        for i, x in enumerate(xs):
            r = self.nodes[i]
            al = a * (1.0 if i == cur else 0.55 if i < cur else 0.3)
            self.blit(img, r, (x / W, (y + 26 * SC) / H), "c", al)


# ---------------------------------------------------------------- 帧渲染
STATE = {}


def init_worker():
    cv2.setNumThreads(1)
    STATE["bg"] = Background()
    STATE["text"] = TextLayer()
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.hypot((xx - W / 2) / (W / 2), (yy - H / 2) / (H / 2))
    STATE["vig"] = np.clip(1 - 0.42 * r ** 2.4, 0, 1)[..., None].astype(np.float32)
    g = np.random.default_rng(3)
    STATE["grain"] = [cv2.GaussianBlur(g.normal(0, 1, (H, W)).astype(np.float32), (0, 0), 0.7)
                      for _ in range(6)]
    path = os.path.join(BUILD, "features.npz")
    if os.path.exists(path):
        f = np.load(path)
        STATE["kick"], STATE["level"] = f["kick"], f["level"]
    else:
        STATE["kick"] = STATE["level"] = np.zeros(NF + 2, np.float32)


def feat(name, f):
    a = STATE[name]
    return float(a[min(max(f, 0), len(a) - 1)])


def blur(img, sigma):
    return cv2.GaussianBlur(img, (0, 0), sigma)


def render_frame(f):
    t = f / FPS
    fi = min(f, NF)
    kick = feat("kick", f)
    ctx = {"kick": kick, "level": feat("level", f)}

    # 相机
    zoom = section_push(t) * (1 + ENV["zoom"][fi])
    yaw = 0.07 * math.sin(2 * math.pi * t / 19) + 0.03 * math.sin(2 * math.pi * t / 7.3)
    pitch = 0.035 * math.sin(2 * math.pi * t / 13)

    # 粒子（当前帧与半个快门之前，用于运动模糊）
    layers = [np.zeros((H, W, 3), np.float32), np.zeros((H // 2, W // 2, 3), np.float32),
              np.zeros((H // 4, W // 4, 3), np.float32)]
    shutter = 0.5 / FPS
    samples = []
    for k, ts in enumerate((t, t - shutter)):
        pos, col, center, mid = particles(ts, ctx)
        fk = min(max(int(round(ts * FPS)), 0), NF)
        d = pos - center
        n = np.linalg.norm(d, axis=1, keepdims=True) + 1e-4
        kdir = d / n * 0.7 + RDIR * 0.3
        pos = pos + kdir * (ENV["kick"][fk] * (0.5 + R2))[:, None]
        pos = center + (pos - center) * (1 - ENV["suck"][fk])
        wob = 0.0015 + 0.0025 * ctx["level"]
        pos = pos + np.sin(WOB * ts * 1.7 + TW_P[:, None] * np.array([1, 2, 3], np.float32)) * wob
        samples.append(project(pos, ts, zoom, yaw, pitch) + (col,))
    (x1, y1, z1, s1, col), (x0, y0, _, _, _) = samples
    tw = 0.78 + 0.22 * np.sin(TW_F * t + TW_P)
    gain = (0.9 + 0.55 * kick + 0.6 * ENV["glow"][fi]) * tw
    col = col * gain[:, None] * (s1 ** 2)[:, None]
    dz = np.abs(z1 - CAM_D)
    near_dz = CAM_D - z1
    lay = np.where(near_dz > 1.6, 2, np.where((np.abs(dz) > 0.55) | SIZE_BIG, 1, 0))
    NS = 4
    for j in range(NS):
        u = j / (NS - 1)
        xs = x1 * (1 - u) + x0 * u
        ys = y1 * (1 - u) + y0 * u
        for li, k in ((0, 1.0), (1, 0.5), (2, 0.25)):
            m = lay == li
            if m.any():
                splat(layers[li], xs[m], ys[m], np.ascontiguousarray(col[m] / NS * (1.0 if li == 0 else 1.25 if li == 1 else 0.8)), k)

    # 尘埃散景
    dp, dc = dust(t)
    dx, dy, dzc, ds = project(dp, t, zoom, yaw * 1.4, pitch)
    dc = dc * DUSTG(t) * (1 + 0.8 * kick) * (ds ** 2)[:, None]
    near = dzc < 3.0
    splat(layers[2], dx[near], dy[near], np.ascontiguousarray(dc[near] * 3.0), 0.25)
    splat(layers[1], dx[~near], dy[~near], np.ascontiguousarray(dc[~near] * 0.8), 0.5)

    l1 = cv2.resize(blur(layers[1], 1.1), (W, H), interpolation=cv2.INTER_LINEAR)
    l2 = cv2.resize(blur(layers[2], 2.6), (W, H), interpolation=cv2.INTER_LINEAR)
    hdr = layers[0] + l1 + l2

    # 光：辉光、光柱、顶光、镜头光晕
    half = cv2.resize(np.maximum(hdr - 0.015, 0), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    q = cv2.resize(half, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    e8 = cv2.resize(q, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    e16 = cv2.resize(e8, (W // 16, H // 16), interpolation=cv2.INTER_AREA)
    hs = (W // 2, H // 2)
    bloom = blur(half, 2.0 * SC) * 0.5 \
        + cv2.resize(blur(q, 3.0 * SC), hs) * 0.4 \
        + cv2.resize(blur(e8, 3.5 * SC), hs) * 0.25 \
        + cv2.resize(blur(e16, 4.0 * SC), hs) * 0.12
    bq = np.maximum(q - 0.1, 0)
    _, _, _, cs = project(np.array([[0, 0, 0]], np.float32), t, zoom, yaw, pitch)
    cpos = particles_center(t)
    cx, cy, _, _ = project(cpos[None], t, zoom, yaw, pitch)
    c = (float(cx[0]) / 4, float(cy[0]) / 4 - H / 4 * 0.06)
    bq = cv2.GaussianBlur(bq, (0, 0), 1.5 * SC)
    shafts = np.zeros_like(bq)
    for i in range(1, 25):
        M = cv2.getRotationMatrix2D(c, 0, 1 + i * 0.016)
        shafts += cv2.warpAffine(bq, M, (W // 4, H // 4), flags=cv2.INTER_LINEAR) * (0.93 ** i) * 0.5
    shafts = cv2.GaussianBlur(shafts, (0, 0), 1.2 * SC)
    streak_src = cv2.GaussianBlur(np.maximum(q - 0.5, 0), (0, 0), 1.5 * SC)
    streak = cv2.GaussianBlur(streak_src, (0, 0), 38 * SC, sigmaY=1.2 * SC) * 8
    st_gain = 0.08 + 0.6 * ENV["streak"][fi]
    sh_gain = SHAFTS(t) * (1 + 0.6 * kick + ENV["glow"][fi])
    bgq = STATE["bg"](t, RAYS(t) * (1 + 1.2 * ENV["glow"][fi]), kick)
    lowq = bgq + shafts * 0.05 * sh_gain + streak * (L[40] * 0.6 + L[30] * 0.4) * 1.6 * st_gain
    light = cv2.resize(lowq, hs) + bloom * BLOOM(t) * (1 + 0.5 * ENV["glow"][fi]) * 0.3
    hdr += cv2.resize(light, (W, H), interpolation=cv2.INTER_LINEAR)

    # 色调映射 → 显示空间
    img = 1 - np.exp(-hdr * EXPOSURE)
    img = np.power(np.clip(img, 0, 1), 1 / 2.2, dtype=np.float32)

    # 字幕与界面
    STATE["text"].draw(img, t)
    STATE["text"].ladder_bar(img, t)

    # 闪光
    fl = ENV["flash"][fi]
    if fl > 0.002:
        img = 1 - (1 - img) * (1 - np.clip(fl, 0, 1) * LD[20] * 0.85)

    # 镜头：震动 + 冲击缩放 + 色散（三通道不同缩放）
    shk = ENV["shake"][fi] * SC
    ox = shk * math.sin(t * 91.3) * 0.8 + shk * math.sin(t * 57.1 + 1)
    oy = shk * math.sin(t * 77.7 + 2) * 0.8 + shk * math.sin(t * 43.9)
    ca = 0.0007 + ENV["ca"][fi]
    out = np.empty_like(img)
    for ch, kz in ((0, 1 + ca), (1, 1.0), (2, 1 - ca)):
        M = cv2.getRotationMatrix2D((W / 2, H / 2), 0, kz * (1 + 0.5 * ENV["zoom"][fi]))
        M[0, 2] += ox
        M[1, 2] += oy
        out[..., ch] = cv2.warpAffine(img[..., ch], M, (W, H), flags=cv2.INTER_LINEAR,
                                      borderMode=cv2.BORDER_REFLECT)
    out *= STATE["vig"]
    out += STATE["grain"][f % 6][..., None] * 0.012
    out *= FADE(t)
    return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)


def particles_center(t):
    k = int(np.searchsorted(KEY_T, t, side="right") - 1)
    ts, sh, dur, mode = KEYS[k]
    if k == 0:
        return sh.center
    u = min(1.0, (t - ts) / dur)
    return KEYS[k - 1][1].center * (1 - u) + sh.center * u


def render_bytes(f):
    return render_frame(f).tobytes()


# ---------------------------------------------------------------- 主程序
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=DURATION)
    ap.add_argument("--scale", type=float, default=1.0)
    ap.add_argument("--stills", type=str, default="")
    ap.add_argument("--workers", type=int, default=max(1, os.cpu_count() - 1))
    ap.add_argument("--crf", type=int, default=26)
    ap.add_argument("--out", type=str, default=os.path.join(HERE, "behave.mp4"))
    args = ap.parse_args()
    set_scale(args.scale)
    os.makedirs(BUILD, exist_ok=True)

    if args.stills:
        init_worker()
        for s in args.stills.split(","):
            f = int(round(float(s) * FPS))
            t0 = time.time()
            img = render_frame(f)
            p = os.path.join(BUILD, f"still_{float(s):06.2f}.png")
            cv2.imwrite(p, img[..., ::-1])
            print(f"{p}  {time.time() - t0:.2f}s")
        return

    f0, f1 = int(args.start * FPS), min(NF, int(args.end * FPS))
    video = os.path.join(BUILD, "video.mp4")
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", str(args.crf),
         "-tune", "film", "-pix_fmt", "yuv420p", video], stdin=subprocess.PIPE)
    t0 = time.time()
    ctx = mp.get_context("fork")
    with ctx.Pool(args.workers, initializer=init_worker) as pool:
        for i, buf in enumerate(pool.imap(render_bytes, range(f0, f1), chunksize=4)):
            enc.stdin.write(buf)
            if i % 150 == 0:
                el = time.time() - t0
                print(f"frame {f0 + i}/{f1}  {el:.0f}s elapsed  {(i + 1) / max(el, 1e-3):.1f} fps", flush=True)
    enc.stdin.close()
    enc.wait()
    score = os.path.join(BUILD, "score.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-ss", str(f0 / FPS), "-t",
                    str((f1 - f0) / FPS), "-i", score, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-shortest", args.out], check=True)
    print(f"done: {args.out}  ({time.time() - t0:.0f}s)")


if __name__ == "__main__":
    main()
