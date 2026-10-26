"""程序化几何：二维/三维大脑点云、分支树（血管/树突）、光之跑者骨架。"""
from functools import lru_cache

import cv2
import numpy as np

from engine import catmull_closed, catmull_open, smooth

# ------------------------------------------------------------------ 二维大脑（矢状位外侧面，额叶在左）
CEREBRUM = [(-0.98, 0.05), (-0.95, -0.28), (-0.80, -0.53), (-0.57, -0.69), (-0.27, -0.78), (0.05, -0.79),
            (0.36, -0.73), (0.61, -0.60), (0.81, -0.42), (0.95, -0.18), (0.99, 0.07), (0.92, 0.25),
            (0.74, 0.31), (0.52, 0.32), (0.32, 0.40), (0.06, 0.48), (-0.19, 0.47), (-0.37, 0.40),
            (-0.44, 0.27), (-0.56, 0.19), (-0.76, 0.24), (-0.93, 0.20)]
STEM = [(0.20, 0.40), (0.40, 0.42), (0.43, 0.66), (0.39, 0.98), (0.26, 0.98), (0.23, 0.68)]
HIPPO = [(-0.30, 0.31), (-0.14, 0.24), (0.05, 0.19), (0.22, 0.14), (0.34, 0.06), (0.40, -0.04), (0.36, -0.13)]

G = 500
U0, V0 = -1.15, -0.95
GW, GH = int(2.3 * G), int(2.0 * G)


def _to_grid(P):
    P = np.asarray(P, np.float32)
    return np.stack([(P[:, 0] - U0) * G, (P[:, 1] - V0) * G], 1)


def _waves(rng, k, fmin, fmax, dim=2):
    d = rng.normal(size=(k, dim))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    f = rng.uniform(fmin, fmax, (k, 1))
    return d * f, rng.uniform(0, 2 * np.pi, k), rng.uniform(0.6, 1.0, k)


def _sumsin(P, waves):
    F, ph, a = waves
    return (np.sin(P @ F.T + ph) * a).sum(-1)


def labyrinth(h, w, sigma, seed, iters=30):
    """带通滤波 + 饱和迭代生成迷宫状条纹（脑回/脑沟纹理）。"""
    rng = np.random.default_rng(seed)
    z = rng.standard_normal((h, w)).astype(np.float32)
    for _ in range(iters):
        z = cv2.GaussianBlur(z, (0, 0), sigma) - cv2.GaussianBlur(z, (0, 0), sigma * 2)
        z = np.tanh(2.5 * z / (z.std() + 1e-6))
    return z


@lru_cache(None)
def _brain_grids(seed=5):
    outline = catmull_closed(CEREBRUM, 30)
    mc = np.zeros((GH, GW), np.uint8)
    cv2.fillPoly(mc, [np.round(_to_grid(outline)).astype(np.int32)], 1)
    mb = np.zeros((GH, GW), np.uint8)
    cx, cy = _to_grid([(0.62, 0.50)])[0]
    cv2.ellipse(mb, (int(cx), int(cy)), (int(0.31 * G), int(0.165 * G)), -8, 0, 360, 1, -1)
    mb[mc > 0] = 0
    ms = np.zeros((GH, GW), np.uint8)
    cv2.fillPoly(ms, [np.round(_to_grid(catmull_closed(STEM, 10))).astype(np.int32)], 1)
    ms[(mc > 0) | (mb > 0)] = 0
    yy, xx = np.mgrid[0:GH, 0:GW].astype(np.float32)
    U = xx / G + U0
    V = yy / G + V0
    z = labyrinth(GH, GW, 9.0, seed)
    gyri = smooth((z + 0.55) / 0.5)
    folia = smooth((np.abs(np.sin(V * 55 + 2.5 * np.sin(U * 7))) - 0.15) / 0.5)
    return dict(outline=outline, mc=mc, mb=mb, ms=ms, U=U, V=V, gyri=gyri, folia=folia,
                dc=cv2.distanceTransform(mc, cv2.DIST_L2, 5), db=cv2.distanceTransform(mb, cv2.DIST_L2, 5),
                ds=cv2.distanceTransform(ms, cv2.DIST_L2, 5))


@lru_cache(None)
def brain2d(n=42000, seed=5):
    rng = np.random.default_rng(seed)
    g = _brain_grids()
    mc, mb, ms, U, V, gyri, folia = g["mc"], g["mb"], g["ms"], g["U"], g["V"], g["gyri"], g["folia"]
    rim = np.exp(-g["dc"] / 6.0) * mc
    light = np.clip(0.62 - 0.30 * U - 0.42 * V, 0.25, 1.0)
    dens = mc * ((0.04 + 0.96 * gyri) * light + 2.2 * rim) + mb * (0.08 + 0.7 * folia) * 0.9 + ms * 0.35
    bright = mc * ((0.25 + 0.75 * gyri) * light + 0.9 * rim) + mb * (0.25 + 0.6 * folia) * 0.8 + ms * 0.4
    region = np.where(mc > 0, 0, np.where(mb > 0, 1, 2))

    flat = dens.ravel().astype(np.float64)
    idx = rng.choice(flat.size, n, p=flat / flat.sum())
    gy, gx = np.divmod(idx, GW)
    pts = np.stack([(gx + rng.random(n) - 0.5) / G + U0, (gy + rng.random(n) - 0.5) / G + V0], 1).astype(np.float32)
    b = bright.ravel()[idx].astype(np.float32)
    reg = region.ravel()[idx]

    hc = catmull_open(HIPPO, 40)
    m = 3500
    k = rng.integers(0, len(hc) - 1, m)
    tang = hc[k + 1] - hc[k]
    tang /= np.linalg.norm(tang, axis=1, keepdims=True) + 1e-9
    nrm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    u = k / len(hc)
    r = 0.05 * (1 - 0.55 * u) * np.sqrt(rng.random(m)) * rng.choice([-1, 1], m)
    hip = (hc[k] + nrm * r[:, None] + rng.normal(0, 0.006, (m, 2))).astype(np.float32)
    pfc = (pts[:, 0] < -0.45) & (pts[:, 1] < 0.18) & (reg == 0)
    return dict(p=pts, b=b, reg=reg, hip=hip, hip_curve=hc.astype(np.float32), pfc=pfc,
                outline=g["outline"].astype(np.float32))


# ------------------------------------------------------------------ 三维大脑（X 前、Y 左右、Z 上）
def _heightfield(rng, mask, dist, thick, dmax, dens, n, sides, gap, region, bright):
    """以外侧面轮廓为剪影、按到边界距离隆起成圆润曲面的高度场采样。"""
    h = thick * np.sqrt(1 - (1 - np.clip(dist / (dmax * G), 0, 1)) ** 2) * mask
    gv, gu = np.gradient(h, 1.0 / G)
    gm = np.sqrt(gu * gu + gv * gv)
    sc = np.minimum(1.0, 6.0 / (gm + 1e-6))
    gu, gv = gu * sc, gv * sc
    flat = (dens * mask).ravel().astype(np.float64)
    idx = rng.choice(flat.size, n, p=flat / flat.sum())
    gy, gx = np.divmod(idx, GW)
    u = (gx + rng.random(n) - 0.5) / G + U0
    v = (gy + rng.random(n) - 0.5) / G + V0
    side = rng.choice(sides, n)
    hh = h.ravel()[idx]
    X, Z = -u, -v
    Y = side * (gap + hh)
    nr = np.stack([gu.ravel()[idx], side, gv.ravel()[idx]], 1)
    nr /= np.linalg.norm(nr, axis=1, keepdims=True)
    return np.stack([X, Y, Z], 1), nr, bright.ravel()[idx], np.full(n, region)


@lru_cache(None)
def brain3d(n=80000, seed=8):
    rng = np.random.default_rng(seed)
    g = _brain_grids()
    out = [
        _heightfield(rng, g["mc"], g["dc"], 0.40, 0.30, 0.03 + 0.97 * g["gyri"], int(n * 0.8), (-1, 1), 0.03, 0,
                     0.3 + 0.7 * g["gyri"]),
        _heightfield(rng, g["mb"], g["db"], 0.33, 0.12, 0.08 + 0.9 * g["folia"], int(n * 0.15), (-1, 1), 0.0, 2,
                     0.3 + 0.5 * g["folia"]),
        _heightfield(rng, g["ms"], g["ds"], 0.12, 0.05, np.ones_like(g["folia"]), int(n * 0.05), (-1, 1), 0.0, 3,
                     np.full_like(g["folia"], 0.35)),
    ]
    P = np.concatenate([o[0] for o in out]).astype(np.float32)
    P[:, 2] += 0.12
    reg = np.concatenate([o[3] for o in out])
    reg = np.where((reg == 0) & (P[:, 0] > 0.45), 1, reg)
    return dict(p=P, n=np.concatenate([o[1] for o in out]).astype(np.float32),
                b=np.concatenate([o[2] for o in out]).astype(np.float32), reg=reg)


def rot3(P, yaw, pitch, roll=0.0):
    cy, sy = np.cos(yaw), np.sin(yaw)
    cp, sp = np.cos(pitch), np.sin(pitch)
    cr, sr = np.cos(roll), np.sin(roll)
    Rz = np.array([[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]], np.float32)
    Rx = np.array([[1, 0, 0], [0, cp, -sp], [0, sp, cp]], np.float32)
    Ry = np.array([[cr, 0, sr], [0, 1, 0], [-sr, 0, cr]], np.float32)
    return P @ (Rx @ Rz @ Ry).T


def project(P, cx, cy, f, dist):
    """相机沿 -Y 方向观察：屏幕 x ← -X? 这里取 屏幕x = X，屏幕y = -Z，深度 = Y。"""
    zc = P[:, 1] + dist
    s = f / zc
    return cx + P[:, 0] * s, cy - P[:, 2] * s, zc, s


# ------------------------------------------------------------------ 分支树
def grow_tree(rng, root, ang, length, maxdepth, t0=0.0, speed=300.0, spread=0.6, wiggle=0.09, seglen=4.0,
              width=6.0, child_range=(0.3, 0.95), nchild=(1, 3), shrink=(0.55, 0.8), gravity=None):
    branches = []

    def rec(p, a, L, depth, tb, wdt):
        n = max(3, int(L / seglen))
        pts = [np.array(p, np.float32)]
        angs = [a]
        for _ in range(n):
            a += rng.normal(0, wiggle)
            if gravity is not None:
                a += gravity * np.sin(np.arctan2(np.sin(-np.pi / 2 - a), np.cos(-np.pi / 2 - a)))
            pts.append(pts[-1] + seglen * np.array([np.cos(a), np.sin(a)], np.float32))
            angs.append(a)
        pts = np.array(pts)
        branches.append(dict(pts=pts, t0=tb, speed=speed, depth=depth, width=wdt, length=n * seglen))
        if depth < maxdepth:
            for _ in range(rng.integers(nchild[0], nchild[1])):
                u = rng.uniform(*child_range)
                k = int(u * n)
                ca = angs[k] + rng.choice([-1, 1]) * rng.uniform(spread * 0.4, spread)
                rec(pts[k], ca, L * rng.uniform(*shrink), depth + 1, tb + k * seglen / speed, wdt * 0.65)

    rec(root, ang, length, 0, t0, width)
    return branches


def pack_tree(branches, ds=3.0):
    """把分支打包成全局数组以便向量化绘制。"""
    P, S, B = [], [], []
    starts, counts = [], []
    k = 0
    for i, br in enumerate(branches):
        pts = br["pts"]
        d = np.sqrt(((pts[1:] - pts[:-1]) ** 2).sum(1))
        s = np.concatenate([[0], np.cumsum(d)])
        u = np.arange(0, s[-1], ds)
        q = np.stack([np.interp(u, s, pts[:, 0]), np.interp(u, s, pts[:, 1])], 1)
        P.append(q)
        S.append(u)
        B.append(np.full(len(u), i))
        starts.append(k)
        counts.append(len(u))
        k += len(u)
    return dict(P=np.concatenate(P).astype(np.float32), S=np.concatenate(S).astype(np.float32),
                B=np.concatenate(B), start=np.array(starts), count=np.array(counts),
                t0=np.array([b["t0"] for b in branches], np.float32),
                speed=np.array([b["speed"] for b in branches], np.float32),
                depth=np.array([b["depth"] for b in branches]),
                width=np.array([b["width"] for b in branches], np.float32),
                L=np.array([(c - 1) * ds for c in counts], np.float32), ds=ds)


def tree_point(T, b, s):
    """第 b 支、弧长 s 处的位置（向量化）。"""
    f = np.clip(s / T["ds"], 0, T["count"][b] - 1.001)
    i0 = np.floor(f).astype(int)
    fr = (f - i0)[:, None]
    g = T["start"][b] + i0
    return T["P"][g] * (1 - fr) + T["P"][np.minimum(g + 1, len(T["P"]) - 1)] * fr


# ------------------------------------------------------------------ 光之跑者
BONES = [  # (起点, 终点, 半宽, 亮度)
    ("hip", "neck", 36, 1.0), ("neck", "head", 11, 1.0),
    ("hipR", "kneeR", 24, 1.0), ("kneeR", "ankleR", 15, 1.0), ("ankleR", "toeR", 8, 1.0),
    ("hipL", "kneeL", 24, 0.45), ("kneeL", "ankleL", 15, 0.45), ("ankleL", "toeL", 8, 0.45),
    ("shR", "elbR", 13, 1.0), ("elbR", "wriR", 10, 1.0),
    ("shL", "elbL", 13, 0.4), ("elbL", "wriL", 10, 0.4),
]


def skeleton(phi, scale=1.0):
    """跑步周期解析骨架。phi 为步态相位（弧度，可为数组）。返回 关节 → (x, y)，y 向下，原点在髋。"""
    phi = np.asarray(phi, np.float32)
    lean = 0.22
    bounce = -9 * np.cos(2 * phi)
    J = {}
    hx, hy = np.zeros_like(phi), bounce
    J["hip"] = (hx, hy)
    nx, ny = hx + 205 * np.sin(lean), hy - 205 * np.cos(lean)
    J["neck"] = (nx, ny)
    J["head"] = (nx + 52 * np.sin(lean + 0.15), ny - 52 * np.cos(lean + 0.15))
    J["heart"] = (hx + 140 * np.sin(lean) + 14, hy - 140 * np.cos(lean))
    for side, ph in (("R", phi), ("L", phi + np.pi)):
        th = 0.18 + 0.62 * np.sin(ph)
        kx, ky = hx + 158 * np.sin(th), hy + 158 * np.cos(th)
        flex = 0.25 + 1.55 * smooth((np.sin(ph - 1.15) + 0.35) / 1.35) ** 1.3
        sa = th - flex
        ax, ay = kx + 150 * np.sin(sa), ky + 150 * np.cos(sa)
        ta = sa + 1.45 + 0.25 * np.sin(ph)
        J["hip" + side] = (hx, hy)
        J["knee" + side] = (kx, ky)
        J["ankle" + side] = (ax, ay)
        J["toe" + side] = (ax + 42 * np.sin(ta), ay + 42 * np.cos(ta))
        sx, sy = hx + 185 * np.sin(lean), hy - 185 * np.cos(lean)
        ua = -0.75 * np.sin(ph) - 0.1
        ex, ey = sx + 112 * np.sin(ua), sy + 112 * np.cos(ua)
        fa = ua + 1.65 + 0.25 * np.sin(ph)
        J["sh" + side] = (sx, sy)
        J["elb" + side] = (ex, ey)
        J["wri" + side] = (ex + 100 * np.sin(fa), ey + 100 * np.cos(fa))
    return {k: (v[0] * scale, v[1] * scale) for k, v in J.items()}


@lru_cache(None)
def runner_body(n=16000, seed=4):
    rng = np.random.default_rng(seed)
    lens = np.array([1.0, 0.3, 0.8, 0.75, 0.2, 0.8, 0.75, 0.2, 0.55, 0.5, 0.55, 0.5])
    wts = lens * np.array([b[2] for b in BONES]) ** 0.6
    k = rng.choice(len(BONES), n - 2500, p=wts / wts.sum())
    u = rng.random(n - 2500)
    v = rng.uniform(-1, 1, n - 2500)
    head_a = rng.uniform(0, 2 * np.pi, 2500)
    head_r = np.sqrt(rng.random(2500)) * 40
    head_r[:700] = 40 + rng.normal(0, 1.2, 700)
    return dict(k=k, u=u.astype(np.float32), v=v.astype(np.float32), ha=head_a, hr=head_r,
                c=rng.random(n).astype(np.float32))


def runner_points(phi, scale=1.0):
    """返回粒子 (x, y, 亮度) —— phi 为标量。"""
    J = skeleton(np.float32(phi), scale)
    rb = runner_body()
    P0 = np.array([[float(J[a][0]), float(J[a][1])] for a, _, _, _ in BONES], np.float32)
    P1 = np.array([[float(J[b][0]), float(J[b][1])] for _, b, _, _ in BONES], np.float32)
    hw = np.array([b[2] for b in BONES], np.float32) * scale
    br = np.array([b[3] for b in BONES], np.float32)
    k, u, v = rb["k"], rb["u"], rb["v"]
    d = P1[k] - P0[k]
    nrm = np.stack([-d[:, 1], d[:, 0]], 1) / (np.linalg.norm(d, axis=1, keepdims=True) + 1e-6)
    taper = np.where(k == 0, 0.8 + 0.35 * np.sin(np.pi * np.clip(u * 1.1, 0, 1)), 1 - 0.3 * u)
    p = P0[k] + d * u[:, None] + nrm * (v * hw[k] * taper)[:, None]
    bb = br[k] * (0.35 + 0.65 * np.abs(v) ** 4)
    hx, hy = float(J["head"][0]), float(J["head"][1])
    hp = np.stack([hx + rb["hr"] * np.cos(rb["ha"]) * scale, hy + rb["hr"] * np.sin(rb["ha"]) * scale], 1)
    hb = np.where(rb["hr"] > 38, 1.0, 0.6)
    return np.vstack([p, hp]).astype(np.float32), np.concatenate([bb, hb]).astype(np.float32), J
