"""粒子形体：每个形体给出 NP 个三维目标点及其颜色（线性光强），可随时间变化。

坐标系：y 向上，画面高度的一半 = 1 个单位，x ∈ [-1.78, 1.78]，z 越大越远。
没有使用任何外部模型或图片，全部由几何体、文字遮罩与递归分枝程序化生成。
"""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from timeline import BAR, BEAT, GREEN, LOYEL, MONTAGE, ORANGE, T

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = {
    "serif_black": os.path.join(HERE, "fonts", "NotoSerifSC-Black.ttf"),
    "serif_bold": os.path.join(HERE, "fonts", "NotoSerifSC-Bold.ttf"),
    "sans": os.path.join(HERE, "fonts", "NotoSansSC-Regular.ttf"),
    "garamond": os.path.join(HERE, "fonts", "CormorantGaramond-SemiBold.ttf"),
    "garamond_italic": os.path.join(HERE, "fonts", "CormorantGaramond-MediumItalic.ttf"),
}
NP = 18000
rng = np.random.default_rng(42)


def lin(h):
    c = np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


L = {k: lin(v) for k, v in LOYEL.items()}
CG, CO, CW = lin(GREEN), lin(ORANGE), lin("#FFFFFF")


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def rot_y(p, a, c=(0, 0, 0)):
    c = np.asarray(c, np.float32)
    q = p - c
    ca, sa = math.cos(a), math.sin(a)
    x = q[:, 0] * ca + q[:, 2] * sa
    z = -q[:, 0] * sa + q[:, 2] * ca
    return np.stack([x, q[:, 1], z], 1) + c


def rot_x(p, a, c=(0, 0, 0)):
    c = np.asarray(c, np.float32)
    q = p - c
    ca, sa = math.cos(a), math.sin(a)
    y = q[:, 1] * ca - q[:, 2] * sa
    z = q[:, 1] * sa + q[:, 2] * ca
    return np.stack([q[:, 0], y, z], 1) + c


def rot_z(p, a):
    ca, sa = math.cos(a), math.sin(a)
    return np.stack([p[:, 0] * ca - p[:, 1] * sa, p[:, 0] * sa + p[:, 1] * ca, p[:, 2]], 1)


def mix_colors(choices, weights, n):
    idx = rng.choice(len(choices), n, p=np.asarray(weights) / np.sum(weights))
    return np.stack(choices)[idx]


def counts(n, fracs):
    c = [int(n * f) for f in fracs]
    c[-1] = n - sum(c[:-1])
    return c


# ---------------------------------------------------------------- 采样工具
def mask_sample(mask, n, height, edge=1.5, fill=1.0, depth=0.15):
    """在遮罩内采样 n 个点；返回 (n,3) 与“离边缘深度” 0..1。"""
    m = (mask > 127).astype(np.uint8)
    dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    ys, xs = np.nonzero(m)
    d = dist[ys, xs]
    w = fill + edge * np.exp(-d / 2.5)
    idx = rng.choice(len(xs), n, p=w / w.sum())
    x = xs[idx] + rng.random(n)
    y = ys[idx] + rng.random(n)
    s = height / (ys.max() + 1 - ys.min())
    px = (x - (xs.min() + xs.max() + 1) / 2) * s
    py = -(y - (ys.min() + ys.max() + 1) / 2) * s
    dn = d[idx] / (d.max() + 1e-6)
    pz = depth * height * np.sqrt(dn) * rng.uniform(-1, 1, n)
    return np.stack([px, py, pz], 1).astype(np.float32), dn.astype(np.float32)


def seg_sample(segs, n, thick=0.004, weights=None):
    """沿线段采样：segs 形如 (M,2,3)；返回点与所属线段的参数 (段号, 段内位置)。"""
    segs = np.asarray(segs, np.float32)
    ln = np.linalg.norm(segs[:, 1] - segs[:, 0], axis=1) + 1e-6
    w = ln * (1 if weights is None else np.asarray(weights))
    k = rng.choice(len(segs), n, p=w / w.sum())
    u = rng.random(n).astype(np.float32)
    p = segs[k, 0] + (segs[k, 1] - segs[k, 0]) * u[:, None]
    th = thick if np.isscalar(thick) else np.asarray(thick)[k]
    p += rng.normal(0, 1, (n, 3)).astype(np.float32) * np.asarray(th, np.float32).reshape(-1, 1)
    return p.astype(np.float32), k, u


def polyline(pts):
    pts = np.asarray(pts, np.float32)
    if pts.shape[1] == 2:
        pts = np.concatenate([pts, np.zeros((len(pts), 1), np.float32)], 1)
    return np.stack([pts[:-1], pts[1:]], 1)


def circle_pts(n, r, c=(0, 0, 0), thick=0.004, a0=0.0, a1=2 * np.pi):
    a = rng.uniform(a0, a1, n)
    p = np.stack([np.cos(a) * r, np.sin(a) * r, np.zeros(n)], 1) + np.asarray(c)
    return (p + rng.normal(0, thick, (n, 3))).astype(np.float32), a


def text_mask(text, font, size, tracking=0.0):
    f = ImageFont.truetype(FONT[font], size)
    widths = [f.getlength(ch) for ch in text]
    w = int(sum(widths) + tracking * size * (len(text) - 1) + size)
    img = Image.new("L", (w, int(size * 1.6)), 0)
    d = ImageDraw.Draw(img)
    x = size / 2
    for ch, cw in zip(text, widths):
        d.text((x, size * 0.2), ch, font=f, fill=255)
        x += cw + tracking * size
    a = np.array(img)
    ys, xs = np.nonzero(a > 127)
    return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


class Shape:
    """静态形体（可附加整体自转）。dynamic 形体重写 __call__。"""

    def __init__(self, pos, col, center=(0, 0, 0), spin=0.0, sway=0.0):
        assert len(pos) == NP, len(pos)
        perm = rng.permutation(NP)
        self.pos = np.ascontiguousarray(pos[perm], np.float32)
        self.col = np.ascontiguousarray(col[perm], np.float32)
        self.perm = perm
        self.center = np.asarray(center, np.float32)
        self.spin = spin
        self.sway = sway

    def take(self, arr):
        return np.asarray(arr)[self.perm]

    def transform(self, p, t, tl):
        if self.spin or self.sway:
            p = rot_y(p, self.spin * tl + self.sway * math.sin(t * 0.45), self.center)
        return p

    def __call__(self, t, tl, ctx):
        return self.transform(self.pos, t, tl), self.col


def place(p, x=0.0, y=0.0, z=0.0, s=1.0):
    return (p * s + np.array([x, y, z], np.float32)).astype(np.float32)


# ---------------------------------------------------------------- 人形（封面意象：左绿右橙）
def figure_mask():
    W, H = 1000, 2000
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    d.ellipse([422, 70, 578, 262], fill=255)
    d.polygon([(462, 240), (538, 240), (548, 330), (452, 330)], fill=255)
    d.polygon([(372, 318), (628, 318), (690, 352), (700, 420), (668, 560), (626, 720), (618, 820), (646, 930),
               (354, 930), (382, 820), (374, 720), (332, 560), (300, 420), (310, 352)], fill=255)

    def limb(path, r0, r1):
        path = np.asarray(path, float)
        seg = np.linalg.norm(np.diff(path, axis=0), axis=1)
        total = seg.sum()
        for i in range(len(seg)):
            for u in np.linspace(0, 1, int(seg[i] / 4) + 2):
                p = path[i] + (path[i + 1] - path[i]) * u
                r = r0 + (r1 - r0) * (seg[:i].sum() + seg[i] * u) / total
                d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=255)

    for sgn in (-1, 1):
        cx = 500
        limb([(cx + sgn * 178, 380), (cx + sgn * 232, 640), (cx + sgn * 262, 905)], 58, 36)
        d.ellipse([cx + sgn * 262 - 34, 890, cx + sgn * 262 + 34, 1010], fill=255)
        limb([(cx + sgn * 82, 900), (cx + sgn * 96, 1380), (cx + sgn * 104, 1840)], 88, 44)
        d.ellipse([cx + sgn * 104 - 46 + sgn * 18, 1810, cx + sgn * 104 + 46 + sgn * 18, 1880], fill=255)
    d.rectangle([494, 1000, 506, 1900], fill=0)
    return np.array(img)


FIG_MASK = figure_mask()


def figure_points(n, height, halo=0.3, depth=0.12):
    nb, nh = counts(n, [1 - halo, halo])
    body, dn = mask_sample(FIG_MASK, nb, height, edge=2.2, fill=1.0, depth=depth)
    base = body[rng.integers(0, nb, nh)]
    dirv = rng.normal(0, 1, (nh, 3)).astype(np.float32)
    dirv[:, 2] *= 0.4
    dirv /= np.linalg.norm(dirv, axis=1, keepdims=True)
    dist = rng.exponential(0.11, nh).astype(np.float32) * height
    hp = base + dirv * dist[:, None]
    pos = np.concatenate([body, hp])
    inten = np.concatenate([0.45 + 0.4 * np.exp(-dn * 6), 0.5 * np.exp(-dist / (0.18 * height)) + 0.06])
    return pos, inten.astype(np.float32), np.concatenate([np.zeros(nb), np.ones(nh)]).astype(bool)


def side_colors(x, soft=0.015):
    w = smooth((x + soft) / (2 * soft))[:, None]
    return CG * (1 - w) + CO * w


class Figure(Shape):
    def __init__(self, scale=1.0, y=0.12, mode="cover"):
        h = 1.25 * scale
        pos, inten, halo = figure_points(NP, h)
        pos = place(pos, 0, y)
        col = side_colors(pos[:, 0]) * inten[:, None]
        if mode == "light":
            tint = mix_colors([L[10], L[20], L[30], L[40]], [3, 3, 2, 1], NP)
            col = tint * inten[:, None] * 1.25
        super().__init__(pos, col, center=(0, y, 0), sway=0.10)
        self.inten = self.take(inten)
        self.mode = mode
        self.xs = self.pos[:, 0].copy()
        self.ys = self.pos[:, 1].copy()
        self.r = rng.random(NP).astype(np.float32)

    def __call__(self, t, tl, ctx):
        p = self.transform(self.pos, t, tl)
        col = self.col
        if T(2) <= t < T(4):                     # 序幕：先亮橙（最坏），再亮绿（最好）
            right = self.xs > 0
            k = smooth((t - T(2)) / 0.25) if t < T(3) else 1.0
            if t < T(3):
                g = np.where(right, 1 + 0.9 * k, 1 - 0.55 * k)
            else:
                k2 = smooth((t - T(3)) / 0.25)
                g = np.where(right, 1.9 - 1.45 * k2, 0.45 + 1.45 * k2)
            col = col * g[:, None].astype(np.float32)
        if self.mode == "cover" and T(52) <= t < T(56):  # “少一些最坏”：橙色由下而上转绿，留下零星火种
            front = -0.75 + 1.7 * smooth((t - T(52, 1)) / (3.2 * 2 * BEAT))
            conv = (self.ys < front) & (self.xs > 0) & (self.r > 0.12)
            col = col.copy()
            col[conv] = (CG * 0.85 + L[30] * 0.15) * self.inten[conv, None]
        if self.mode == "light":
            col = col * (0.75 + 0.6 * smooth(tl / 3.5))
        return p, col


# ---------------------------------------------------------------- 片名
class Title(Shape):
    def __init__(self, final=False):
        mask = text_mask("BEHAVE", "garamond", 420, tracking=0.2)
        nt, nh = counts(NP, [0.86, 0.14])
        pts, dn = mask_sample(mask, nt, 0.30, edge=2.0, fill=0.8, depth=0.25)
        pts = place(pts, 0, 0.2)
        base = pts[rng.integers(0, nt, nh)]
        halo = base + rng.normal(0, 0.05, (nh, 3)).astype(np.float32) * np.array([1.6, 1, 0.5], np.float32)
        pos = np.concatenate([pts, halo])
        c_text = mix_colors([L[10], L[20], L[30]], [2, 2, 1], nt) * (0.55 + 0.35 * np.exp(-dn * 5))[:, None]
        c_halo = side_colors(halo[:, 0], 0.4) * rng.uniform(0.08, 0.3, nh)[:, None].astype(np.float32)
        super().__init__(pos, np.concatenate([c_text, c_halo]), center=(0, 0.2, 0), sway=0.06)
        self.xs = self.pos[:, 0].copy()
        self.final = final

    def __call__(self, t, tl, ctx):
        p = self.transform(self.pos, t, tl)
        sx = -1.6 + 3.2 * smooth((tl - 0.5) / 1.6)       # 一道扫光掠过字母
        g = 1 + (1.8 if self.final else 1.3) * np.exp(-((self.xs - sx) / 0.1) ** 2)
        return p, self.col * g[:, None].astype(np.float32)


# ---------------------------------------------------------------- 钟（倒带）
class Clock(Shape):
    def __init__(self):
        n_ring, n_tick, n_arc, n_tun = counts(NP, [0.22, 0.13, 0.17, 0.48])
        ring, _ = circle_pts(n_ring, 0.78, thick=0.004)
        segs = []
        for k in range(60):
            a = k / 60 * 2 * np.pi
            r0 = 0.66 if k % 5 == 0 else 0.71
            segs.append([[r0 * np.cos(a), r0 * np.sin(a), 0], [0.75 * np.cos(a), 0.75 * np.sin(a), 0]])
        ticks, k_, _ = seg_sample(segs, n_tick, 0.003, weights=[2.5 if i % 5 == 0 else 1 for i in range(60)])
        self.arc_u = rng.random(n_arc).astype(np.float32) ** 1.5      # 0 = 彗星头部
        self.tun_z = rng.uniform(0, 1, n_tun).astype(np.float32)
        self.tun_a = rng.uniform(0, 2 * np.pi, n_tun).astype(np.float32)
        self.tun_ring = rng.integers(0, 14, n_tun)
        self.n = (n_ring, n_tick, n_arc, n_tun)
        pos = np.concatenate([ring, ticks, np.zeros((n_arc, 3), np.float32), np.zeros((n_tun, 3), np.float32)])
        col = np.concatenate([
            mix_colors([L[20], L[30]], [1, 1], n_ring) * 0.5,
            mix_colors([L[30], L[40]], [1, 1], n_tick) * 0.45,
            np.zeros((n_arc, 3), np.float32), np.zeros((n_tun, 3), np.float32)])
        self.static_pos, self.static_col = pos, col
        Shape.__init__(self, pos, col)

    def __call__(self, t, tl, ctx):
        n_ring, n_tick, n_arc, n_tun = self.n
        pos = self.static_pos.copy()
        col = self.static_col.copy()
        head = np.pi / 2 + 0.9 * tl + 0.22 * tl ** 2.4          # 逆时针 = 时间倒流，越转越快
        a = head - self.arc_u * 1.7
        i0 = n_ring + n_tick
        r = 0.84 + rng_noise(self.arc_u, 0.006)
        pos[i0:i0 + n_arc] = np.stack([np.cos(a) * r, np.sin(a) * r, np.zeros(n_arc)], 1)
        arc_col = CG * (1 - self.arc_u[:, None]) + L[40] * self.arc_u[:, None]
        col[i0:i0 + n_arc] = arc_col * (1.1 * (1 - self.arc_u[:, None]) ** 1.5 + 0.05)
        travel = 0.12 * tl + 0.05 * tl ** 2.6
        z = ((self.tun_ring / 14 + travel) % 1.0)
        zz = 0.3 + (1 - z) * 7.0
        rr = 0.78 + 0.004 * np.sin(self.tun_a * 9)
        aa = self.tun_a + 0.4 * tl
        i1 = i0 + n_arc
        pos[i1:] = np.stack([np.cos(aa) * rr, np.sin(aa) * rr, zz], 1)
        fade = smooth(z / 0.2) * smooth((1 - z) / 0.1)
        col[i1:] = L[50] * (0.32 * fade)[:, None]
        return pos[self.perm], col[self.perm]


def rng_noise(u, amp):
    return amp * np.sin(u * 91.7)


# ---------------------------------------------------------------- 大脑（侧面，额叶朝左）
def brain_mask():
    W, H = 1400, 1050
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    for c, rx, ry in [((660, 420), 500, 315), ((640, 600), 385, 170), ((370, 455), 255, 255),
                      ((1010, 470), 205, 215)]:
        d.ellipse([c[0] - rx, c[1] - ry, c[0] + rx, c[1] + ry], fill=255)
    cereb = Image.new("L", (W, H), 0)
    dc = ImageDraw.Draw(cereb)
    dc.ellipse([820, 610, 1200, 840], fill=255)
    stem = Image.new("L", (W, H), 0)
    ds = ImageDraw.Draw(stem)
    ds.polygon([(780, 640), (900, 640), (905, 760), (880, 1000), (810, 1000), (800, 780)], fill=255)
    return np.array(img), np.array(cereb), np.array(stem)


BRAIN = brain_mask()


def brain_points():
    cer, cbl, stem = BRAIN
    hgt = 1050 / 650.0                                        # 让大脑主体高度约为 1
    n_out, n_gyr, n_fill, n_cb, n_st, n_amy = counts(NP, [0.2, 0.42, 0.1, 0.12, 0.05, 0.11])
    s = hgt / 1050

    def to_world(xs, ys):
        return np.stack([(xs - 700) * s, -(ys - 525) * s, np.zeros_like(xs)], 1).astype(np.float32)

    m = (cer > 127).astype(np.uint8)
    dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    edge = (dist > 0) & (dist < 7)
    ys, xs = np.nonzero(edge)
    k = rng.integers(0, len(xs), n_out)
    out = to_world(xs[k] + rng.random(n_out), ys[k] + rng.random(n_out))

    field = cv2.resize(rng.normal(0, 1, (22, 30)).astype(np.float32), (1400, 1050), interpolation=cv2.INTER_CUBIC)
    field = cv2.GaussianBlur(field, (0, 0), 9)
    field /= field.std()
    lines = (np.abs(np.sin(field * 2.6)) < 0.11) & (dist > 9)
    ys, xs = np.nonzero(lines)
    k = rng.integers(0, len(xs), n_gyr)
    gyr = to_world(xs[k] + rng.random(n_gyr), ys[k] + rng.random(n_gyr))

    ys, xs = np.nonzero(dist > 3)
    k = rng.integers(0, len(xs), n_fill)
    fill = to_world(xs[k] + rng.random(n_fill), ys[k] + rng.random(n_fill))

    cb = cbl > 127
    cb &= ~(dist > 0)
    yy, xx = np.mgrid[0:1050, 0:1400]
    folia = cb & (np.abs(np.sin((yy - 0.25 * (xx - 1000)) / 7.5)) < 0.35)
    ys, xs = np.nonzero(folia)
    k = rng.integers(0, len(xs), n_cb)
    cbp = to_world(xs[k] + rng.random(n_cb), ys[k] + rng.random(n_cb))

    ys, xs = np.nonzero((stem > 127) & ~(dist > 0) & ~(cbl > 127))
    k = rng.integers(0, len(xs), n_st)
    stp = to_world(xs[k] + rng.random(n_st), ys[k] + rng.random(n_st))

    amy = rng.normal(0, 1, (n_amy, 3)).astype(np.float32) * np.array([0.045, 0.032, 0.03], np.float32)
    amy += to_world(np.array([430.0]), np.array([612.0]))

    pos = np.concatenate([out, gyr, fill, cbp, stp, amy])
    # 体积感：按到中心的椭圆距离给 z
    rx = (pos[:, 0] + 0.02) / 0.85
    ry = (pos[:, 1] - 0.05) / 0.55
    bulge = np.sqrt(np.clip(1 - rx ** 2 - ry ** 2, 0, 1))
    pos[:, 2] = bulge * 0.35 * rng.uniform(-1, 1, NP)
    kind = np.concatenate([np.full(n_out, 0), np.full(n_gyr, 1), np.full(n_fill, 2), np.full(n_cb, 3),
                           np.full(n_st, 4), np.full(n_amy, 5)])
    return pos, kind


BRAIN_PTS = brain_points()


class Brain(Shape):
    def __init__(self, x=0.62, mature=False):
        pos, kind = BRAIN_PTS
        pos = place(pos, x, 0.06, s=0.92)
        bx, by = pos[:, 0] - x, pos[:, 1] - 0.06
        pfc = (bx < -0.30 - 0.22 * by + 0.03 * np.sin(by * 25)) & (by > -0.16 - 0.25 * (bx + 0.5)) & (kind < 3)
        base = mix_colors([L[20], L[30], L[40]], [1, 2, 2], NP)
        inten = np.select([kind == 0, kind == 1, kind == 2, kind == 3, kind == 4, kind == 5],
                          [0.55, 0.42, 0.12, 0.35, 0.3, 0.9]).astype(np.float32)
        col = base * inten[:, None]
        col[pfc] = (CG * 0.7 + L[30] * 0.3) * inten[pfc, None] * 1.25
        col[kind == 5] = CO * 0.95
        super().__init__(pos, col, center=(x, 0.06, 0), sway=0.0)
        self.kind = self.take(kind)
        self.pfc = self.take(pfc)
        self.bx = self.pos[:, 0] - x
        self.mature = mature
        self.x = x
        self.inten = self.take(inten)

    def __call__(self, t, tl, ctx):
        p = rot_y(self.pos, 0.38 * math.sin(0.55 * tl + 0.6) - 0.1, self.center)
        col = self.col.copy()
        amy = self.kind == 5
        col[amy] *= 1 + 1.6 * ctx["kick"]
        if not self.mature:
            col[self.pfc] *= 0.7 + 0.6 * smooth((tl - 1.0) / 0.6)    # 先杏仁核，后前额叶“踩刹车”
            return p, col
        front = 0.85 - 1.8 * smooth((tl - 0.3) / 3.0)               # 成熟波：从后往前
        ahead = self.bx < front
        g = np.where(ahead, 0.16, 1.0).astype(np.float32)
        wave = np.exp(-((self.bx - front) / 0.05) ** 2) * 2.0
        g = g + wave
        col = col * g[:, None]
        col[self.pfc & ahead] = L[50] * 0.08
        return p, col


# ---------------------------------------------------------------- 眼睛
class Eye(Shape):
    def __init__(self, x=0.62):
        n_lid, n_lash, n_iris, n_ring, n_hi, n_glow = counts(NP, [0.28, 0.08, 0.38, 0.12, 0.03, 0.11])
        xs = rng.uniform(-1, 1, n_lid)
        top = rng.random(n_lid) < 0.55
        y = np.where(top, 0.40 * (1 - xs ** 2) ** 0.85, -0.30 * (1 - xs ** 2) ** 0.95)
        lid = np.stack([xs * 0.68, y * 0.68, np.zeros(n_lid)], 1) + rng.normal(0, 0.004, (n_lid, 3))
        la = rng.uniform(-0.85, 0.85, n_lash)
        k = rng.integers(0, 26, n_lash)
        lx = np.linspace(-0.82, 0.82, 26)[k]
        ly = 0.40 * (1 - lx ** 2) ** 0.85
        u = rng.random(n_lash)
        ang = np.pi / 2 + lx * 0.9
        lash = np.stack([(lx + u * 0.09 * np.cos(ang)) * 0.68, (ly + u * 0.11 * np.sin(ang)) * 0.68,
                         np.zeros(n_lash)], 1)
        self.fib_r = rng.uniform(0, 1, n_iris).astype(np.float32)
        fib_a = (rng.integers(0, 150, n_iris) / 150 * 2 * np.pi + rng.normal(0, 0.012, n_iris)).astype(np.float32)
        self.fib_a = fib_a + 0.08 * np.sin(self.fib_r * 9 + fib_a * 3)
        ring_a = rng.uniform(0, 2 * np.pi, n_ring)
        ring_r = np.where(rng.random(n_ring) < 0.6, 0.235, 0.085)
        ring = np.stack([np.cos(ring_a) * ring_r, np.sin(ring_a) * ring_r, np.zeros(n_ring)], 1)
        hi = rng.normal(0, 0.012, (n_hi, 3)) + np.array([0.06, 0.07, 0])
        glow = np.stack([rng.normal(0, 0.45, n_glow), rng.normal(0, 0.2, n_glow), rng.normal(0, 0.1, n_glow)], 1)
        self.n = (n_lid, n_lash, n_iris, n_ring, n_hi, n_glow)
        pos = np.concatenate([lid, lash, np.zeros((n_iris, 3)), ring, hi, glow]).astype(np.float32)
        col = np.concatenate([
            mix_colors([L[20], L[30]], [1, 1], n_lid) * 0.55,
            mix_colors([L[30], L[40]], [1, 1], n_lash) * 0.4,
            mix_colors([L[40], L[50], CG], [3, 3, 1], n_iris) * 0.5,
            mix_colors([L[20], L[30]], [1, 1], n_ring) * 0.6,
            np.tile(CW, (n_hi, 1)) * 1.2,
            mix_colors([L[50], L[60]], [1, 1], n_glow) * 0.07]).astype(np.float32)
        self.x = x = x + 0.1
        self.static_pos, self.static_col = pos, col
        Shape.__init__(self, pos, col, center=(x, 0.05, 0))

    def __call__(self, t, tl, ctx):
        n_lid, n_lash, n_iris, n_ring, n_hi, n_glow = self.n
        pos = self.static_pos.copy()
        pupil = 0.085 + 0.025 * ctx["kick"] + 0.01 * math.sin(tl * 2)
        r = pupil + (0.235 - pupil) * self.fib_r
        i0 = n_lid + n_lash
        pos[i0:i0 + n_iris, 0] = np.cos(self.fib_a) * r
        pos[i0:i0 + n_iris, 1] = np.sin(self.fib_a) * r
        i1 = i0 + n_iris
        rr = np.linalg.norm(pos[i1:i1 + n_ring, :2], axis=1, keepdims=True)
        inner = rr < 0.15
        pos[i1:i1 + n_ring, :2] = np.where(inner, pos[i1:i1 + n_ring, :2] / rr * pupil, pos[i1:i1 + n_ring, :2])
        col = self.static_col.copy()
        hidden = (pos[:, 1] > 0.40 * 0.68 * np.clip(1 - (pos[:, 0] / 0.68) ** 2, 0, 1) ** 0.85 + 0.005)
        hidden[:n_lid + n_lash] = False
        hidden[i1 + n_ring:] = False
        col[hidden] *= 0.08
        pos = place(pos, self.x, 0.05, s=1.25)
        pos = rot_y(pos, 0.18 * math.sin(tl * 0.7), (self.x, 0.05, 0))
        return pos[self.perm], col[self.perm]


# ---------------------------------------------------------------- 激素：甾体母核（睾酮）
def steroid_segments():
    s = 0.2
    hexc = lambda c: [np.array(c) + s * np.array([math.cos(math.radians(30 + 60 * k)),
                                                    math.sin(math.radians(30 + 60 * k))]) for k in range(6)]
    A = np.array([0.0, 0.0])
    B = A + np.array([math.sqrt(3) * s, 0])
    C = B + np.array([math.sqrt(3) / 2 * s, 1.5 * s])
    rings = [hexc(A), hexc(B), hexc(C)]
    p1 = C + s * np.array([math.cos(math.radians(-30)), math.sin(math.radians(-30))])
    p2 = C + s * np.array([math.cos(math.radians(30)), math.sin(math.radians(30))])
    mid = (p1 + p2) / 2
    ap = s / (2 * math.tan(math.radians(36)))
    cen = mid + np.array([ap, 0])
    R = s / (2 * math.sin(math.radians(36)))
    base = math.atan2(p1[1] - cen[1], p1[0] - cen[0])
    pent = [cen + R * np.array([math.cos(base + k * 2 * math.pi / 5), math.sin(base + k * 2 * math.pi / 5)])
            for k in range(5)]
    segs, atoms = [], []
    for ring in rings + [pent]:
        for k in range(len(ring)):
            segs.append([ring[k], ring[(k + 1) % len(ring)]])
            atoms.append(ring[k])
    # 取代基：C3 酮基(=O)、C17 羟基(-OH)、C10/C13 甲基
    c3 = rings[0][3]
    o3 = c3 + np.array([-0.17, 0])
    segs += [[c3 + [0, 0.018], o3 + [0, 0.018]], [c3 - [0, 0.018], o3 - [0, 0.018]]]
    c17 = pent[2]
    o17 = c17 + (c17 - cen) / np.linalg.norm(c17 - cen) * 0.17
    segs.append([c17, o17])
    c10 = rings[0][0]
    c13 = rings[2][5]
    segs += [[c10, c10 + [0, 0.17]], [c13, c13 + [0, 0.17]]]
    segs = np.array([[[a[0], a[1], 0], [b[0], b[1], 0]] for a, b in segs], np.float32)
    atoms = np.array([[a[0], a[1], 0] for a in atoms], np.float32)
    oxy = np.array([[o3[0], o3[1], 0], [o17[0], o17[1], 0]], np.float32)
    shift = -np.concatenate([segs.reshape(-1, 3), oxy]).mean(0)
    return segs + shift, atoms + shift, oxy + shift


class Steroid(Shape):
    def __init__(self, x=0.62):
        segs, atoms, oxy = steroid_segments()
        n_b, n_a, n_o, n_glow = counts(NP, [0.55, 0.22, 0.08, 0.15])
        bonds, _, _ = seg_sample(segs, n_b, 0.006)
        a = atoms[rng.integers(0, len(atoms), n_a)] + rng.normal(0, 0.016, (n_a, 3)).astype(np.float32)
        o = oxy[rng.integers(0, 2, n_o)] + rng.normal(0, 0.024, (n_o, 3)).astype(np.float32)
        g = rng.normal(0, 1, (n_glow, 3)).astype(np.float32) * np.array([0.5, 0.35, 0.25], np.float32)
        pos = np.concatenate([bonds, a, o, g]) * 1.12
        x += 0.12
        col = np.concatenate([mix_colors([L[20], L[30], L[40]], [1, 2, 1], n_b) * 0.5,
                              mix_colors([L[10], L[20]], [1, 1], n_a) * 0.75,
                              np.where((o[:, 0] < 0)[:, None], CO, CG) * 0.95,
                              mix_colors([L[50], L[60], CO], [3, 3, 1], n_glow) * 0.08])
        pos = place(pos, x, 0.05)
        super().__init__(pos, col.astype(np.float32), center=(x, 0.05, 0))
        self.x = x

    def __call__(self, t, tl, ctx):
        p = rot_x(self.pos, 0.35 * math.sin(tl * 0.8), self.center)
        p = rot_y(p, 0.5 * tl - 0.6, self.center)
        return p, self.col * (1 + 0.5 * ctx["kick"])


# ---------------------------------------------------------------- 神经元（可塑性：树突生长 + 动作电位）
def branches(origin, angle, length, depth, spread, ratio, segs, meta, path=0.0, z_amp=0.08, level=0):
    if depth == 0 or length < 0.012:
        return
    n = 5
    pts = [np.array(origin, np.float32)]
    for k in range(n):
        a = angle + rng.normal(0, 0.12)
        p = pts[-1] + np.array([math.cos(a), math.sin(a), rng.normal(0, z_amp / n)], np.float32) * length / n
        pts.append(p)
    for k in range(n):
        segs.append([pts[k], pts[k + 1]])
        meta.append((path + length * k / n, level))
    end = pts[-1]
    kids = 2 if rng.random() < 0.85 else 3
    for j in range(kids):
        da = spread * (j - (kids - 1) / 2) * (0.8 + 0.4 * rng.random())
        branches(end, angle + da, length * ratio * (0.85 + 0.3 * rng.random()), depth - 1, spread, ratio,
                 segs, meta, path + length, z_amp, level + 1)


class Neuron(Shape):
    def __init__(self, x=0.62):
        soma = np.array([-0.35, 0.02, 0], np.float32)
        segs, meta = [], []
        for k in range(7):
            ang = np.radians(100 + k * 160 / 6 + rng.normal(0, 6))
            branches(soma, ang, 0.2 + 0.05 * rng.random(), 5, 0.62, 0.7, segs, meta)
        dend = np.array(segs, np.float32)
        dmeta = np.array(meta, np.float32)
        axp = [soma]
        for k in range(1, 40):
            u = k / 39
            axp.append(np.array([-0.35 + 1.05 * u, 0.02 - 0.12 * math.sin(u * 3.0) + 0.03 * math.sin(u * 13),
                                 0.0], np.float32))
        axon = polyline(axp)
        tsegs, tmeta = [], []
        for k in range(5):
            branches(axp[-1], np.radians(-50 + 25 * k), 0.08, 3, 0.7, 0.7, tsegs, tmeta, z_amp=0.03)
        term = np.array(tsegs, np.float32)
        n_d, n_s, n_soma, n_ax, n_my, n_t, n_b = counts(NP, [0.42, 0.06, 0.09, 0.1, 0.13, 0.12, 0.08])
        dpts, dk, du = seg_sample(dend, n_d, 0.0035, weights=1.0 / (1 + dmeta[:, 1]) ** 0.4)
        dpath = dmeta[dk, 0] + du * np.linalg.norm(dend[dk, 1] - dend[dk, 0], axis=1)
        spk = dend[rng.integers(0, len(dend), n_s)]
        sp = (spk[:, 0] + spk[:, 1]) / 2 + rng.normal(0, 0.012, (n_s, 3)).astype(np.float32)
        so = soma + rng.normal(0, 1, (n_soma, 3)).astype(np.float32) * 0.045
        ax, ak, au = seg_sample(axon, n_ax, 0.003)
        my_k = rng.integers(0, 39, n_my)
        my_k = my_k - my_k % 2 + 1
        my_k = np.clip(my_k, 0, 38)
        my_u = rng.uniform(0.1, 0.9, n_my)
        my = axon[my_k, 0] + (axon[my_k, 1] - axon[my_k, 0]) * my_u[:, None]
        my += rng.normal(0, 0.011, (n_my, 3)).astype(np.float32)
        tp, _, _ = seg_sample(term, n_t, 0.003)
        bout = term[rng.integers(0, len(term), n_b), 1] + rng.normal(0, 0.008, (n_b, 3)).astype(np.float32)
        pos = np.concatenate([dpts, sp, so, ax, my, tp, bout])
        self.grow = np.concatenate([dpath / dpath.max(), np.full(n_s, 0.7), np.zeros(n_soma),
                                    np.zeros(n_ax), np.zeros(n_my), np.zeros(n_t), np.zeros(n_b)]).astype(np.float32)
        axs = np.concatenate([np.full(n_d + n_s + n_soma, -1.0), (ak + au) / 39, (my_k + my_u) / 39,
                              np.full(n_t + n_b, 1.0)]).astype(np.float32)
        col = np.concatenate([mix_colors([L[20], L[30], L[40]], [1, 2, 2], n_d) * 0.5,
                              mix_colors([L[30], CO], [3, 1], n_s) * 0.5,
                              np.tile(L[10], (n_soma, 1)) * 0.7,
                              mix_colors([L[30], L[40]], [1, 1], n_ax) * 0.45,
                              mix_colors([L[40], L[50]], [1, 1], n_my) * 0.5,
                              mix_colors([L[30], L[40]], [1, 1], n_t) * 0.45,
                              mix_colors([CG, L[20]], [1, 1], n_b) * 0.9]).astype(np.float32)
        x += 0.13
        pos = place(pos, x, 0.02, s=1.1)
        super().__init__(pos, col, center=(x, 0.02, 0))
        self.grow = self.take(self.grow)
        self.axs = self.take(axs)
        self.soma = place(soma[None], x, 0.02, s=1.1)[0]

    def __call__(self, t, tl, ctx):
        g = smooth((tl - 0.2) / 2.6) * 1.05
        k = np.clip(g / np.maximum(self.grow, 1e-3), 0, 1)[:, None]
        p = self.soma + (self.pos - self.soma) * k
        p = rot_y(p, 0.25 * math.sin(tl * 0.6), self.center)
        ph = ((t - T(18)) / BEAT) % 1.0                         # 每一拍发放一次动作电位
        spike = np.exp(-((self.axs - ph * 1.1) / 0.035) ** 2) * (self.axs >= 0)
        col = self.col * (1 + 3.0 * spike)[:, None]
        col = col * (0.25 + 0.75 * (k > 0.98))
        return p, col.astype(np.float32)


# ---------------------------------------------------------------- 子宫与胎儿
def fetus_mask():
    W, H = 1000, 1000
    img = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(img)
    d.ellipse([430, 170, 690, 430], fill=255)                     # 头
    body = Image.new("L", (W, H), 0)
    db = ImageDraw.Draw(body)
    db.ellipse([300, 330, 620, 780], fill=255)
    body = body.rotate(28, center=(460, 555))
    img = Image.fromarray(np.maximum(np.array(img), np.array(body)))
    d = ImageDraw.Draw(img)
    d.ellipse([470, 560, 720, 760], fill=255)                     # 蜷起的腿
    d.ellipse([560, 420, 690, 560], fill=255)                     # 手臂
    d.ellipse([600, 700, 770, 790], fill=255)                     # 脚
    return np.array(img)


class Womb(Shape):
    def __init__(self, x=0.62):
        n_f, n_ring, n_in, n_cord = counts(NP, [0.5, 0.25, 0.17, 0.08])
        fet, dn = mask_sample(fetus_mask(), n_f, 0.72, edge=2.5, fill=0.6, depth=0.2)
        ring, ra = circle_pts(n_ring, 0.62, thick=0.005)
        ring[:, 2] = 0.05 * np.sin(ra * 3)
        r_in = 0.6 * np.sqrt(rng.random(n_in))
        a_in = rng.uniform(0, 2 * np.pi, n_in)
        inner = np.stack([r_in * np.cos(a_in), r_in * np.sin(a_in), rng.normal(0, 0.08, n_in)], 1)
        u = rng.random(n_cord)
        cord = np.stack([0.02 - 0.2 * u + 0.05 * np.sin(u * 9), -0.05 - 0.5 * u, 0.02 * np.sin(u * 7)], 1)
        cord += rng.normal(0, 0.006, (n_cord, 3))
        pos = np.concatenate([fet, ring, inner, cord]).astype(np.float32)
        col = np.concatenate([
            mix_colors([L[10], L[20], L[30]], [1, 2, 1], n_f) * (0.4 + 0.45 * np.exp(-dn * 6))[:, None],
            mix_colors([L[40], L[50], CO], [3, 3, 1], n_ring) * 0.5,
            mix_colors([L[50], L[60], CO], [3, 3, 1], n_in) * 0.07,
            mix_colors([L[30], CO], [2, 1], n_cord) * 0.45]).astype(np.float32)
        self.is_ring = np.concatenate([np.zeros(n_f), np.ones(n_ring), np.zeros(n_in + n_cord)]).astype(bool)
        pos = place(pos, x, 0.04)
        super().__init__(pos, col, center=(x, 0.04, 0))
        self.is_ring = self.take(self.is_ring)

    def __call__(self, t, tl, ctx):
        p = self.pos.copy()
        p[self.is_ring] = rot_z(p[self.is_ring] - self.center, 0.2 * tl) + self.center
        p = rot_y(p, 0.3 * math.sin(tl * 0.6), self.center)
        beat = ((t - T(22)) / (2 * BEAT)) % 1.0
        hb = np.exp(-beat / 0.08) + 0.6 * np.exp(-max(beat - 0.22, 0) / 0.08) * (beat > 0.22)
        return p, self.col * (1 + 0.6 * hb + 0.4 * ctx["kick"])


# ---------------------------------------------------------------- DNA 双螺旋
class DNA(Shape):
    def __init__(self, x=0.62):
        n_s, n_r, n_g = counts(NP, [0.56, 0.36, 0.08])
        turns, hgt, rad = 2.4, 1.55, 0.27
        u = rng.random(n_s)
        strand = rng.integers(0, 2, n_s)
        a = 2 * np.pi * turns * u + strand * np.pi
        sp = np.stack([rad * np.cos(a), (u - 0.5) * hgt, rad * np.sin(a)], 1) + rng.normal(0, 0.007, (n_s, 3))
        nb = 30
        k = rng.integers(0, nb, n_r)
        uk = (k + 0.5) / nb
        ak = 2 * np.pi * turns * uk
        v = rng.random(n_r)
        p0 = np.stack([rad * np.cos(ak), (uk - 0.5) * hgt, rad * np.sin(ak)], 1)
        p1 = np.stack([rad * np.cos(ak + np.pi), (uk - 0.5) * hgt, rad * np.sin(ak + np.pi)], 1)
        rp = p0 + (p1 - p0) * v[:, None] + rng.normal(0, 0.005, (n_r, 3))
        pair = rng.permutation(nb) % 4
        left = v < 0.5
        cpair = np.where(((pair[k] % 2 == 0) == left)[:, None], CG, CO)
        cpair = np.where((pair[k] >= 2)[:, None], cpair * 0.6 + L[30] * 0.4, cpair)
        g = np.stack([rng.normal(0, 0.35, n_g), rng.uniform(-0.8, 0.8, n_g), rng.normal(0, 0.35, n_g)], 1)
        pos = np.concatenate([sp, rp, g]).astype(np.float32)
        col = np.concatenate([mix_colors([L[10], L[20], L[30]], [1, 2, 2], n_s) * 0.6,
                              cpair * 0.55, mix_colors([L[50], L[60]], [1, 1], n_g) * 0.06]).astype(np.float32)
        pos = rot_z(pos, -0.32)
        pos = place(pos, x, 0.02)
        super().__init__(pos, col, center=(x, 0.02, 0))

    def __call__(self, t, tl, ctx):
        q = rot_z(self.pos - self.center, 0.32)
        q = rot_y(q, 1.1 * tl)
        q = rot_z(q, -0.32) + self.center
        return q, self.col * (1 + 0.35 * ctx["kick"])


# ---------------------------------------------------------------- 人群（文化）
SMALL_FIG = None


def small_figure(n):
    global SMALL_FIG
    if SMALL_FIG is None:
        SMALL_FIG, _ = mask_sample(FIG_MASK, 60000, 1.0, edge=3.0, fill=0.5, depth=0.05)
    return SMALL_FIG[rng.integers(0, len(SMALL_FIG), n)]


def crowd(specs, n, glow_frac=0.08):
    """specs: [(x, y, z, height, color, intensity)]"""
    ng = int(n * glow_frac)
    per = counts(n - ng, [1 / len(specs)] * len(specs))
    pos, col, who = [], [], []
    for i, ((x, y, z, h, c, it), m) in enumerate(zip(specs, per)):
        pos.append(small_figure(m) * h + np.array([x, y + h / 2, z], np.float32))
        col.append(np.tile(c, (m, 1)) * it)
        who.append(np.full(m, i))
    g = np.stack([rng.normal(0, 0.9, ng), rng.normal(0, 0.35, ng), rng.normal(0.3, 0.4, ng)], 1)
    pos.append(g.astype(np.float32))
    col.append(mix_colors([L[50], L[60]], [1, 1], ng) * 0.05)
    who.append(np.full(ng, -1))
    return np.concatenate(pos).astype(np.float32), np.concatenate(col).astype(np.float32), np.concatenate(who)


class Crowd(Shape):
    def __init__(self, x=0.62):
        x += 0.12
        specs = []
        for r in range(3):                                   # 左：整齐划一的集体
            for c in range(4):
                specs.append((x - 0.78 + c * 0.17 + r * 0.06, -0.62 + r * 0.12, -0.35 + r * 0.55, 0.4,
                              L[30] * 0.55 + CG * 0.45, 0.55 - 0.07 * r))
        for k in range(12):                                  # 右：各不相同的个体
            r = rng.uniform(0, 2.2)
            specs.append((x + 0.08 + rng.uniform(0, 0.7), -0.62 + r * 0.12 + rng.uniform(-0.03, 0.03),
                          -0.35 + r * 0.55, rng.uniform(0.26, 0.5), [L[20], L[40], CO, L[30]][k % 4],
                          rng.uniform(0.4, 0.62)))
        pos, col, who = crowd(specs, NP)
        super().__init__(pos, col, center=(x, -0.2, 0))
        self.who = self.take(who)
        self.ind = self.who >= 12
        self.ph = rng.uniform(0, 6.28, 64)

    def __call__(self, t, tl, ctx):
        p = self.pos.copy()
        w = np.clip(self.who, 0, 63)
        bob = 0.012 * np.sin(tl * 3.0 + self.ph[w])
        p[:, 1] += np.where(self.ind, bob, 0.004 * math.sin(tl * 3.0))
        p = rot_y(p, -0.15 + 0.15 * math.sin(tl * 0.5), self.center)
        return p, self.col


# ---------------------------------------------------------------- 生命之树（进化）
class Tree(Shape):
    def __init__(self, x=0.62):
        segs, meta = [], []

        def grow(o, d, length, depth, path):
            if depth == 0:
                return
            e = o + d * length
            segs.append([o, e])
            meta.append((path, path + length, depth))
            for j in range(2 if rng.random() < 0.8 else 3):
                axis = rng.normal(0, 1, 3)
                axis -= axis.dot(d) * d
                axis /= np.linalg.norm(axis)
                ang = np.radians(rng.uniform(24, 44))
                nd = d * math.cos(ang) + axis * math.sin(ang)
                nd[1] = abs(nd[1]) * 0.75 + 0.12
                nd /= np.linalg.norm(nd)
                grow(e, nd, length * rng.uniform(0.7, 0.84), depth - 1, path + length)

        grow(np.array([0, -0.82, 0.0]), np.array([0, 1.0, 0]), 0.34, 8, 0.0)
        segs = np.array(segs, np.float32)
        meta = np.array(meta, np.float32)
        n_b, n_l, n_g = counts(NP, [0.8, 0.12, 0.08])
        bp, bk, bu = seg_sample(segs, n_b, 0.0025 * (1 + meta[:, 2] / 3), weights=(meta[:, 2] / 8) ** 1.1)
        bpath = meta[bk, 0] + (meta[bk, 1] - meta[bk, 0]) * bu
        tips = segs[meta[:, 2] <= 2, 1]
        lt = tips[rng.integers(0, len(tips), n_l)] + rng.normal(0, 0.008, (n_l, 3)).astype(np.float32)
        lpath = np.full(n_l, meta[:, 1].max())
        g = np.stack([rng.normal(0, 0.5, n_g), rng.uniform(-0.6, 0.8, n_g), rng.normal(0, 0.4, n_g)], 1)
        pos = np.concatenate([bp, lt, g]).astype(np.float32)
        tipc = mix_colors([CG, CO, L[20], L[40]], [3, 2, 2, 2], n_l)
        col = np.concatenate([mix_colors([L[20], L[30], L[40]], [1, 2, 2], n_b) * (0.3 + 0.05 * meta[bk, 2])[:, None],
                              tipc * 0.75, mix_colors([L[50], CG], [3, 1], n_g) * 0.06]).astype(np.float32)
        self.path = np.concatenate([bpath, lpath, np.zeros(n_g)]).astype(np.float32)
        self.path /= self.path.max()
        pos = place(pos, x, 0.0)
        super().__init__(pos, col, center=(x, 0, 0))
        self.path = self.take(self.path)
        self.root = np.array([x, -0.78, 0], np.float32)

    def __call__(self, t, tl, ctx):
        g = smooth((tl - 0.1) / 2.4) * 1.02
        k = np.clip(g / np.maximum(self.path, 1e-3), 0, 1)[:, None]
        p = self.root + (self.pos - self.root) * k
        p = rot_y(p, 0.35 * tl, self.center)
        col = self.col * (0.2 + 0.8 * (k > 0.98)) * (1 + 0.3 * ctx["kick"])
        return p, col.astype(np.float32)


# ---------------------------------------------------------------- 人形 + 时间尺度光环
class FigureRings(Shape):
    def __init__(self, big=False):
        nrings = 7 if big else 5
        n_f, n_r = counts(NP, [0.58 if big else 0.62, 0.42 if big else 0.38])
        fp, inten, _ = figure_points(n_f, 1.25, halo=0.22)
        fp = place(fp, 0, 0.12)
        fc = side_colors(fp[:, 0]) * inten[:, None]
        ring = rng.integers(0, nrings, n_r)
        self.ra = rng.uniform(0, 2 * np.pi, n_r).astype(np.float32)
        self.ring = ring
        self.rr = (0.78 + 0.13 * ring + rng.normal(0, 0.006, n_r)).astype(np.float32)
        palette = [L[40], CG, L[30], CO, L[50], L[20], CG]
        rc = np.stack([palette[r % len(palette)] for r in ring]) * 0.5
        self.tilt = [(0.25 + 0.35 * k, 0.6 * k) for k in range(nrings)]
        self.speed = [0.5 / (1 + 0.25 * k) * (-1) ** k for k in range(nrings)]
        self.nf, self.nr = n_f, n_r
        self.big = big
        pos = np.concatenate([fp, np.zeros((n_r, 3), np.float32)])
        col = np.concatenate([fc, rc]).astype(np.float32)
        self.static_pos, self.static_col = pos, col
        Shape.__init__(self, pos, col, center=(0, 0.12, 0))

    def __call__(self, t, tl, ctx):
        pos = self.static_pos.copy()
        col = self.static_col.copy()
        q = np.zeros((self.nr, 3), np.float32)
        for k, (tx, ty) in enumerate(self.tilt):
            m = self.ring == k
            a = self.ra[m] + self.speed[k] * tl
            ring = np.stack([np.cos(a) * self.rr[m], np.zeros(m.sum()), np.sin(a) * self.rr[m]], 1)
            ring = rot_x(ring, tx)
            ring = rot_z(ring, ty)
            q[m] = ring
            if self.big:
                ti = T(50 + k // 4, k % 4)
                on = smooth((t - ti) / 0.12) if t >= ti else 0.0
                col[self.nf:][m] *= 0.45 + 1.4 * on * (1 + 1.5 * math.exp(-max(t - ti, 0) / 0.25))
        pos[self.nf:] = q + np.array([0, 0.12, 0], np.float32)
        pos[:self.nf] = rot_y(pos[:self.nf], 0.12 * math.sin(t * 0.45), (0, 0.12, 0))
        return pos[self.perm], col[self.perm]


# ---------------------------------------------------------------- 内爆 / 漂散
class Implode(Shape):
    def __init__(self):
        d = rng.normal(0, 1, (NP, 3)).astype(np.float32)
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        pos = d * (rng.random(NP) ** 0.5 * 0.06)[:, None].astype(np.float32) + np.array([0, 0.05, 0], np.float32)
        col = mix_colors([L[10], L[20], CG, CO], [3, 3, 1, 1], NP) * 0.05
        super().__init__(pos, col.astype(np.float32), center=(0, 0.05, 0))

    def __call__(self, t, tl, ctx):
        jit = 0.01 + 0.03 * smooth(tl / 0.5)
        p = self.pos + np.sin(self.pos * 900 + t * 60) * jit
        return p, self.col * (1 + 2 * smooth(tl / 0.5))


class Word(Shape):
    def __init__(self, text, idx=0):
        mask = text_mask(text, "serif_black", 300, tracking=0.08)
        nt, nh = counts(NP, [0.9, 0.1])
        pts, dn = mask_sample(mask, nt, 0.52, edge=2.4, fill=0.7, depth=0.3)
        pts = place(pts, 0, 0.12)
        halo = pts[rng.integers(0, nt, nh)] + rng.normal(0, 0.045, (nh, 3)).astype(np.float32)
        accent = CG if idx % 2 == 0 else CO
        c = mix_colors([L[10], L[20], accent], [3, 3, 2], nt) * (0.5 + 0.4 * np.exp(-dn * 5))[:, None]
        ch = mix_colors([L[40], accent], [1, 1], nh) * 0.12
        super().__init__(np.concatenate([pts, halo]), np.concatenate([c, ch]).astype(np.float32),
                         center=(0, 0.12, 0), sway=0.1)


class TwoGroups(Shape):
    def __init__(self):
        specs = []
        for side, c in ((-1, CG), (1, CO)):
            for r in range(3):
                for k in range(5):
                    specs.append((side * (0.45 + k * 0.19 + r * 0.05), -0.2 + r * 0.05, 0.5 - r * 0.35, 0.42,
                                  c, 0.55 - 0.08 * r))
        pos, col, who = crowd(specs, NP)
        super().__init__(pos, col, center=(0, 0, 0))
        self.side = self.take(np.where(who < 0, 0, np.where(who < 15, -1, 1))).astype(np.float32)

    def __call__(self, t, tl, ctx):
        p = self.pos.copy()
        push = 0.06 * smooth(tl / 1.5) + 0.03 * ctx["kick"]
        p[:, 0] += self.side * push
        return rot_y(p, 0.08 * math.sin(tl * 0.5)), self.col


class CircleOfUs(Shape):
    def __init__(self):
        specs = []
        k = 24
        for i in range(k):
            specs.append((0, 0, 0, 0.3, [CG, CO, L[30]][i % 3], 0.55))
        pos, col, who = crowd(specs, NP, glow_frac=0.06)
        self.who = who
        self.k = k
        self.local = pos.copy()
        for i in range(k):
            m = who == i
            self.local[m] -= np.array([0, 0.15, 0], np.float32)
        super().__init__(pos, col, center=(0, 0, 0))
        self.who = self.take(self.who)
        self.local = self.take(self.local)

    def __call__(self, t, tl, ctx):
        p = self.local.copy()
        m = self.who >= 0
        a = self.who[m] / self.k * 2 * np.pi + 0.25 * tl
        rx, rz = 1.15, 0.9
        p[m, 0] += rx * np.cos(a)
        p[m, 2] += rz * np.sin(a) + 0.4
        p[m, 1] += -0.12 + 0.3 * np.sin(a)
        return p, self.col


# ---------------------------------------------------------------- 狒狒群（希望）
class Troop(Shape):
    """24 个光团代表 24 只狒狒：橙色好斗者先躁动，再因结核病相继熄灭；
    余下的群体变得平和，新来的个体（复用熄灭的粒子）从右侧进入并被“同化”成绿色/蓝色；最后全部上升蓄力。"""

    def __init__(self):
        nb = 24
        self.home = np.stack([rng.uniform(-1.35, 1.35, nb), rng.uniform(-0.38, 0.4, nb),
                              rng.uniform(-0.3, 0.6, nb)], 1).astype(np.float32)
        self.aggr = np.zeros(nb, bool)
        self.aggr[rng.choice(nb, 6, replace=False)] = True
        who = rng.integers(0, nb, NP)
        off = rng.normal(0, 1, (NP, 3)).astype(np.float32) * 0.055
        spike = rng.normal(0, 1, (NP, 3)).astype(np.float32)
        spike /= np.linalg.norm(spike, axis=1, keepdims=True)
        self.spike = spike * rng.exponential(0.06, NP)[:, None].astype(np.float32)
        self.who, self.off = who, off
        a = self.aggr[who]
        self.calm_col = mix_colors([L[20], L[30], L[40]], [1, 2, 2], NP) * 0.5
        self.aggr_col = np.tile(CO, (NP, 1)) * 0.6
        self.new_home = np.stack([rng.uniform(0.3, 1.2, nb), rng.uniform(-0.3, 0.35, nb),
                                  rng.uniform(-0.2, 0.5, nb)], 1).astype(np.float32)
        self.r = rng.random(NP).astype(np.float32)
        self.ph = rng.uniform(0, 6.28, nb).astype(np.float32)
        pos = self.home[who] + off
        col = np.where(a[:, None], self.aggr_col, self.calm_col).astype(np.float32)
        Shape.__init__(self, pos, col)
        self.perm = np.arange(NP)

    def __call__(self, t, tl, ctx):
        who = self.who
        a = self.aggr[who]
        ph = self.ph[who]
        home = self.home[who].copy()
        home[:, 0] += 0.03 * np.sin(tl * 0.4 + ph)
        home[:, 1] += 0.02 * np.sin(tl * 0.9 + ph * 2)
        pos = home + self.off * (1 + 0.08 * np.sin(tl * 2 + ph))[:, None]
        col = np.where(a[:, None], self.aggr_col, self.calm_col).astype(np.float32)
        jit = (0.02 + 0.04 * ctx["kick"]) * np.sin(t * 37 + self.r[:, None] * 50 + np.arange(3) * 2)
        pos = np.where(a[:, None], pos + self.spike * (1 + ctx["kick"]) + jit, pos)
        # 第 42–44 小节：好斗者相继熄灭（下沉、变暗）
        die_t = T(42) + (who % 6) * 0.45
        dying = smooth((t - die_t) / 1.6) * a
        pos[:, 1] -= 0.35 * dying ** 1.5
        col *= (1 - dying)[:, None]
        # 第 44–46 小节：熄灭的粒子化作新成员，从右侧进入并被同化
        born = smooth((t - T(44) - (who % 6) * 0.3) / 2.2) * a
        newp = self.new_home[who] + self.off
        entry = newp + np.array([1.4, 0, 0], np.float32)
        npos = entry + (newp - entry) * born[:, None]
        assim = smooth((t - T(45) - (who % 6) * 0.25) / 1.2)
        ncol = self.aggr_col * (1 - assim)[:, None] + (CG * 0.5)[None] * assim[:, None]
        show = born > 0.001
        pos = np.where(show[:, None], npos, pos)
        col = np.where(show[:, None], ncol * born[:, None], col)
        # 平和者两两靠近（理毛）
        calm_pair = smooth((t - T(44)) / 2.5) * (~a)
        partner = self.home[(who // 2) * 2]
        pos = pos + (partner - self.home[who]) * 0.35 * calm_pair[:, None]
        col = col * (1 + 0.6 * calm_pair[:, None] * (self.r[:, None] < 0.3))
        # 第 46–48 小节：全部上升、旋转、变亮
        rise = smooth((t - T(46)) / (2 * BAR))
        if rise > 0:
            ang = rise * 2.5 + self.r * 0.6
            rx = pos[:, 0] * np.cos(ang) - pos[:, 2] * np.sin(ang)
            rz = pos[:, 0] * np.sin(ang) + pos[:, 2] * np.cos(ang)
            pos = np.stack([rx * (1 - 0.6 * rise), pos[:, 1] + rise * (0.4 + 0.9 * self.r), rz * (1 - 0.6 * rise)], 1)
            col = col * (1 + 1.2 * rise) + (L[20] * 0.25 * rise)[None]
        return pos.astype(np.float32), col.astype(np.float32)


class Drift(Shape):
    def __init__(self, base):
        self.base = base
        self.v = (rng.normal(0, 1, (NP, 3)) * np.array([0.08, 0.05, 0.1]) + np.array([0, 0.12, 0])).astype(np.float32)
        Shape.__init__(self, base.pos, base.col)
        self.perm = np.arange(NP)

    def __call__(self, t, tl, ctx):
        p, c = self.base(t, tl + 3.0, ctx)
        p = p + self.v * tl * (1 + 0.4 * tl)
        return p, c * math.exp(-tl / 1.6)


class Seed(Shape):
    def __init__(self):
        d = rng.normal(0, 1, (NP, 3)).astype(np.float32) * 0.01 + np.array([0, 0.12, 0], np.float32)
        col = mix_colors([L[10], L[20], CG, CO], [4, 4, 1, 1], NP) * 0.0045
        super().__init__(d, col.astype(np.float32), center=(0, 0.12, 0))

    def __call__(self, t, tl, ctx):
        beat = (t / (2 * BEAT)) % 1.0
        hb = math.exp(-beat / 0.07) + 0.6 * math.exp(-max(beat - 0.24, 0) / 0.08) * (beat > 0.24)
        return self.pos, self.col * (0.6 + 0.9 * hb)


class Dust(Shape):
    def __init__(self):
        d = rng.normal(0, 1, (NP, 3)).astype(np.float32)
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        r = rng.random(NP).astype(np.float32) ** 0.6 * 0.75
        pos = d * r[:, None] * np.array([0.8, 1.1, 0.8], np.float32) + np.array([0, 0.12, 0], np.float32)
        col = mix_colors([L[20], L[30], L[40], CG, CO], [2, 2, 2, 1, 1], NP) * 0.13
        super().__init__(pos.astype(np.float32), col.astype(np.float32), center=(0, 0.12, 0), spin=0.35)


# ---------------------------------------------------------------- 工厂
def build(name, params, prev=None):
    x = params.get("x", 0.62)
    if name.startswith("word:"):
        text = name[5:]
        idx = [m[0] for m in MONTAGE].index(text)
        return Word(text, idx)
    return {
        "seed": lambda: Seed(),
        "dust": lambda: Dust(),
        "figure": lambda: Figure(params.get("scale", 1.0)),
        "figure_light": lambda: Figure(1.15, mode="light"),
        "title": lambda: Title(bool(params.get("final"))),
        "clock": lambda: Clock(),
        "brain": lambda: Brain(x),
        "brain_mature": lambda: Brain(x, mature=True),
        "eye": lambda: Eye(x),
        "steroid": lambda: Steroid(x),
        "neuron": lambda: Neuron(x),
        "womb": lambda: Womb(x),
        "dna": lambda: DNA(x),
        "crowd": lambda: Crowd(x),
        "tree": lambda: Tree(x),
        "figure_rings": lambda: FigureRings(bool(params.get("big"))),
        "implode": lambda: Implode(),
        "two_groups": lambda: TwoGroups(),
        "circle_of_us": lambda: CircleOfUs(),
        "troop": lambda: Troop(),
        "drift": lambda: Drift(prev),
    }[name]()
