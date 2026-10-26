"""场景公用工具：相机、版式（章节标题/正文/引用/标注）、树状结构绘制、节拍包络。"""
import numpy as np

from engine import C, D, D_WHITE, W, H, env, seg, ease_out, ramp, text, text_cue, text_size
from shapes import tree_point
from timeline import BEAT, BAR, heartbeat_times

HB = heartbeat_times()


def hb_env(t, times=HB):
    """心跳 lub-dub 包络。"""
    v = 0.0
    for t0 in times:
        if t0 <= t < t0 + 1.2:
            d = t - t0
            v = max(v, np.exp(-d / 0.11) + (0.6 * np.exp(-(d - 0.24) / 0.1) if d >= 0.24 else 0.0))
    return v


def beat_env(t, decay=0.16):
    return float(np.exp(-(t % BEAT) / decay))


def bar_env(t, decay=0.45):
    return float(np.exp(-(t % BAR) / decay))


class Cam:
    """平移/缩放/旋转 + 可选的向心吸入与漩涡（用于转场）。"""

    def __init__(self, focus=None, zoom=1.0, screen=None, rot=0.0, extra=(0.0, 0.0)):
        self.f = np.array(focus if focus is not None else (W / 2, H / 2), np.float32)
        self.s = np.array(screen if screen is not None else self.f, np.float32)
        self.z = zoom
        self.rot = rot
        self.e = np.asarray(extra, np.float32)
        self.pull = 0.0
        self.swirl = 0.0
        self.pc = np.array((W / 2, H / 2), np.float32)

    def __call__(self, x, y):
        x = (np.asarray(x, np.float32) - self.f[0]) * self.z
        y = (np.asarray(y, np.float32) - self.f[1]) * self.z
        if self.rot:
            c, s = np.cos(self.rot), np.sin(self.rot)
            x, y = x * c - y * s, x * s + y * c
        x = x + self.s[0] + self.e[0]
        y = y + self.s[1] + self.e[1]
        if self.pull > 0 or self.swirl != 0:
            dx, dy = x - self.pc[0], y - self.pc[1]
            r = np.sqrt(dx * dx + dy * dy) + 1.0
            a = self.swirl * 400.0 / (r + 250.0)
            c, s = np.cos(a), np.sin(a)
            dx, dy = dx * c - dy * s, dx * s + dy * c
            k = 1.0 - self.pull * (0.6 + 0.4 * np.clip(1 - r / 1400.0, 0, 1))
            x, y = self.pc[0] + dx * k, self.pc[1] + dy * k
        return x, y

    def scale(self):
        return self.z * (1 - self.pull)


def P(fr, cam, x, y, w, col, layer=0):
    xx, yy = cam(x, y)
    fr.pts(xx, yy, w, col, layer)


# ------------------------------------------------------------------ 版式
TX = 130  # 文字栏左边距


def header(fr, t, num, title, en, t_in, t_out, x=TX, y=700):
    a = env(t, t_in, t_out, 0.7, 0.5)
    if a <= 0:
        return y
    sl = (1 - ease_out(seg(t, t_in, t_in + 1.0))) * 18
    text(fr, num, "oswaldm", 30, x, y + sl, a, D[40], tracking=4, glow=0.5)
    nw, _ = text_size(num, "oswaldm", 30, 4)
    # 标题前的光线
    k = ease_out(seg(t, t_in + 0.1, t_in + 1.1))
    lx = np.linspace(0, 1, 160)
    xs = x + nw + 16 + lx * 90 * k
    fr.pts(xs, np.full_like(xs, y + 22 + sl), 0.5 * a * (1 - lx * 0.8), C[40], 0)
    text(fr, title, "bold", 54, x, y + 46 + sl * 1.4, a, D_WHITE, glow=0.45)
    text(fr, en, "oswald", 22, x + 2, y + 122 + sl * 1.8, a * 0.95, D[40], tracking=5, glow=0.2)
    return y + 175


def body(fr, t, lines, t_in, t_out, x=TX, y=880, size=31, gap=1.62, col=None, stagger=0.18, fname="light"):
    col = D[20] if col is None else col
    for i, s in enumerate(lines):
        text_cue(fr, t, s, fname, size, x, y + i * size * gap, t_in + i * stagger, t_out, col=col, glow=0.18,
                 shadow=0.6)
    return y + len(lines) * size * gap


def cite(fr, t, s, t_in, t_out, x=TX, y=990, size=21):
    text_cue(fr, t, s, "light", size, x, y, t_in, t_out, col=D[40], glow=0.15, shadow=0.5, rise=8)


def label(fr, t, s, x, y, t_in, t_out, anchor=None, size=24, col=None, fname="med", align="l", cam=None):
    """小标注；anchor 给出时绘制一条粒子引线和锚点圆环。"""
    a = env(t, t_in, t_out, 0.5, 0.5)
    if a <= 0:
        return
    col = D[30] if col is None else col
    text(fr, s, fname, size, x, y, a, col, anchor="c" if align == "c" else ("r" if align == "r" else "l"),
         glow=0.25, shadow=0.6)
    if anchor is not None:
        ax, ay = anchor if cam is None else [float(v) for v in cam(anchor[0], anchor[1])]
        tw, th = text_size(s, fname, size)
        sx = x - 10 if align == "l" else (x + 10 if align == "r" else x)
        sy = y + th * 0.6
        k = ease_out(seg(t, t_in, t_in + 0.6))
        u = np.linspace(0, 1, 120) * k
        fr.pts(sx + (ax - sx) * u, sy + (ay - sy) * u, 0.35 * a, C[40], 0)
        ang = np.linspace(0, 2 * np.pi, 40)
        fr.pts(ax + 9 * np.cos(ang), ay + 9 * np.sin(ang), 0.4 * a * k, C[30], 0)


# ------------------------------------------------------------------ 树
def tree_normals(T):
    P = T["P"]
    d = np.zeros_like(P)
    d[1:-1] = P[2:] - P[:-2]
    d[0] = P[1] - P[0]
    d[-1] = P[-1] - P[-2]
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-6
    return n


def tree_flow_init(T, n, rng, vmin=120, vmax=240):
    w = T["L"] * (0.4 + T["width"] / T["width"].max())
    b = rng.choice(len(T["L"]), n, p=w / w.sum())
    return dict(b=b, u=rng.random(n).astype(np.float32), v=rng.uniform(vmin, vmax, n).astype(np.float32),
                c=rng.random(n).astype(np.float32), off=rng.normal(0, 0.35, n).astype(np.float32))


def tree_grown(T, t):
    return np.clip((t - T["t0"]) * T["speed"], 0, T["L"] + 1e-3)


def draw_tree(fr, cam, T, t, w=0.35, col=None, alpha=1.0, thick=True, glow=0.25, tip=0.0, normals=None,
              bright=None):
    if alpha <= 0:
        return
    col = C[50] if col is None else col
    grown = tree_grown(T, t)
    vis = T["S"] <= grown[T["B"]]
    if not vis.any():
        return
    Pv = T["P"][vis]
    wid = T["width"][T["B"][vis]]
    rel = np.clip(wid / T["width"].max(), 0, 1)
    ww = w * alpha * (0.35 + 0.65 * rel)
    if bright is not None:
        ww = ww * bright[vis]
    P(fr, cam, Pv[:, 0], Pv[:, 1], ww, col, 0)
    if glow > 0:
        P(fr, cam, Pv[:, 0], Pv[:, 1], ww * glow, col, 1)
    if thick and normals is not None:
        big = wid > 2.5
        if big.any():
            nv = normals[vis][big]
            for sgn in (-0.5, 0.5):
                q = Pv[big] + nv * (wid[big] * sgn)[:, None]
                P(fr, cam, q[:, 0], q[:, 1], ww[big] * 0.7, col, 0)
    if tip > 0:
        growing = np.nonzero((grown > 0) & (grown < T["L"]))[0]
        if len(growing):
            q = tree_point(T, growing, grown[growing])
            P(fr, cam, q[:, 0], q[:, 1], tip * alpha, C[10], 0)
            P(fr, cam, q[:, 0], q[:, 1], tip * alpha * 0.6, C[30], 1)


def draw_tree_flow(fr, cam, T, F, t, w=0.8, alpha=1.0, normals=None, layer=0):
    if alpha <= 0:
        return
    grown = tree_grown(T, t)
    L = T["L"][F["b"]]
    s = (F["u"] * L + F["v"] * t) % np.maximum(L, 1)
    vis = s <= grown[F["b"]]
    if not vis.any():
        return
    q = tree_point(T, F["b"][vis], s[vis])
    if normals is not None:
        f = np.clip(s[vis] / T["ds"], 0, None).astype(int) + T["start"][F["b"][vis]]
        f = np.minimum(f, len(normals) - 1)
        q = q + normals[f] * (F["off"][vis] * T["width"][F["b"][vis]])[:, None]
    col = ramp(0.45 + 0.5 * F["c"][vis])
    P(fr, cam, q[:, 0], q[:, 1], w * alpha, col, layer)
