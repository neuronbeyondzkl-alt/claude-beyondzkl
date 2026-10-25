"""粒子形体。每个形体对同一组 N 个粒子给出目标状态 (位置, 颜色, 亮度, 模糊)，
可以随时间变化。形体之间的切换由 scene.py 里的 morph() 完成。"""
import numpy as np

import brain as brainmod
from engine import loyel, rot_x, rot_y, rot_z
from text import text_mask

N = 60000
RNG = np.random.default_rng(2026)
RAND = RNG.random((N, 6)).astype(np.float32)          # 每粒子固定随机数
_d = RNG.normal(size=(N, 3)).astype(np.float32)
RDIR = _d / np.linalg.norm(_d, axis=1, keepdims=True)  # 每粒子固定随机方向

RAMP_KEYS = (80, 70, 60, 50, 40, 30, 20, 10)
RAMP = np.stack([loyel(k) for k in RAMP_KEYS])


def ramp(level):
    """0..1 → Loyel 色阶（深 → 浅），线性光。"""
    level = np.clip(level, 0, 1) * (len(RAMP) - 1)
    i0 = np.floor(level).astype(np.int32)
    i1 = np.minimum(i0 + 1, len(RAMP) - 1)
    f = (level - i0)[:, None].astype(np.float32)
    return RAMP[i0] * (1 - f) + RAMP[i1] * f


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def ease_io(x):
    x = np.clip(x, 0, 1)
    return np.where(x < 0.5, 4 * x ** 3, 1 - (-2 * x + 2) ** 3 / 2)


def breath(t, t0=0.0, period=8.0):
    """0 = 呼尽，1 = 吸满；吸 4 秒、呼 4 秒。"""
    return 0.5 - 0.5 * np.cos(2 * np.pi * (t - t0) / period)


class State:
    __slots__ = ("P", "rgb", "e", "blur")

    def __init__(self, P, rgb, e, blur=None):
        self.P, self.rgb, self.e = P, rgb, e
        self.blur = blur if blur is not None else np.zeros(len(P), np.float32)


def _shuffle(arrs, seed):
    perm = np.random.default_rng(seed).permutation(N)
    return [a[perm] for a in arrs]


def _fill(points, n=N, seed=0):
    """把任意数量的点重采样到 n 个。"""
    rng = np.random.default_rng(seed)
    if len(points) >= n:
        idx = rng.choice(len(points), n, replace=False)
    else:
        idx = np.concatenate([np.arange(len(points)), rng.choice(len(points), n - len(points))])
    return idx


# ====================================================================== 光点
class PointForm:
    def __init__(self, center=(0, 0, 0), radius=0.018):
        self.c = np.asarray(center, np.float32)
        self.r = radius
        rr = RAND[:, 0] ** 2.2
        self.off = RDIR * rr[:, None]
        self.rgb = ramp(0.75 + 0.25 * RAND[:, 1])
        self.e = (0.012 + 0.02 * (1 - rr)).astype(np.float32)

    def __call__(self, t, pulse=0.0, radius=None):
        r = (self.r if radius is None else radius) * (1 + 0.6 * pulse)
        return State(self.c + self.off * r, self.rgb, self.e * (1 + 1.2 * pulse))


# ====================================================================== 思绪风暴
class SwarmForm:
    def __init__(self, n_streams=16, stream_frac=0.32):
        rng = np.random.default_rng(11)
        self.is_stream = RAND[:, 2] < stream_frac
        # 云：椭球内的基准位置
        u = RAND[:, 3] ** (1 / 3)
        self.base = RDIR * u[:, None] * np.array([2.5, 1.35, 1.6], np.float32)
        self.k = rng.normal(size=(4, 3)).astype(np.float32) * 1.3
        self.w = rng.uniform(0.25, 0.6, 4).astype(np.float32)
        self.ph = rng.uniform(0, 2 * np.pi, 4).astype(np.float32)
        self.ax = rng.normal(size=(4, 3)).astype(np.float32)
        self.ax /= np.linalg.norm(self.ax, axis=1, keepdims=True)
        # 念头之流：3D 利萨如曲线
        self.sid = (RAND[:, 4] * n_streams).astype(np.int32)
        self.amp = rng.uniform([1.2, 0.6, 0.6], [2.6, 1.3, 1.4], (n_streams, 3)).astype(np.float32)
        self.freq = rng.choice([1.0, 2.0, 3.0], (n_streams, 3)).astype(np.float32)
        self.phs = rng.uniform(0, 2 * np.pi, (n_streams, 3)).astype(np.float32)
        self.spd = rng.uniform(0.05, 0.11, n_streams).astype(np.float32) * rng.choice([-1, 1], n_streams)
        self.s0 = (RAND[:, 5] * 0.16).astype(np.float32)        # 每条流只占曲线的一段
        self.soff = rng.random(n_streams).astype(np.float32)
        lvl = np.where(self.is_stream, 0.72 + 0.28 * RAND[:, 0], 0.35 + 0.45 * RAND[:, 0])
        self.rgb = ramp(lvl)
        self.e0 = np.where(self.is_stream, 0.85 + 0.6 * RAND[:, 1], 0.22 + 0.4 * RAND[:, 1]).astype(np.float32)

    def __call__(self, t, chaos=1.0, scale=1.0, center=(0, 0, 0)):
        b = self.base
        d = np.zeros_like(b)
        for j in range(4):
            phase = b @ self.k[j] + self.w[j] * t * (0.6 + chaos) + self.ph[j]
            d += np.cross(self.ax[j], b) * (0.18 * np.sin(phase))[:, None]
            d += self.ax[j] * (0.22 * np.cos(phase * 0.7))[:, None]
        ang = t * 0.12 * (0.5 + chaos)
        P = (b + d * chaos) @ rot_y(ang).T
        # 念头之流
        sid = self.sid
        s = (self.soff[sid] + self.s0 + self.spd[sid] * t * (0.5 + chaos)) * 2 * np.pi
        A, F, PH = self.amp[sid], self.freq[sid], self.phs[sid]
        q = A * np.sin(F * s[:, None] + PH)
        q += RDIR * 0.035
        P = np.where(self.is_stream[:, None], q @ rot_y(ang * 0.5).T, P)
        P = P * scale + np.asarray(center, np.float32)
        tw = 0.75 + 0.25 * np.sin(t * (2 + 3 * RAND[:, 2]) + RAND[:, 3] * 40)
        return State(P.astype(np.float32), self.rgb, self.e0 * tw)


# ====================================================================== 粒子文字
class TextForm:
    def __init__(self, text, fontname, px=420, height=1.15, center=(0, 0, 0), seed=5, depth=0.05):
        m = text_mask(text, fontname, px)
        ys, xs = np.nonzero(m > 0.25)
        w = m[ys, xs]
        rng = np.random.default_rng(seed)
        idx = rng.choice(len(xs), N, p=w / w.sum())
        jx = rng.random(N) - 0.5
        jy = rng.random(N) - 0.5
        h, wd = m.shape
        s = height / h
        x = (xs[idx] + jx - wd / 2) * s
        y = -(ys[idx] + jy - h / 2) * s
        z = rng.normal(0, depth, N)
        self.P0 = np.c_[x, y, z].astype(np.float32) + np.asarray(center, np.float32)
        # 边缘更亮：用掩膜梯度近似
        gy, gx = np.gradient(m)
        edge = np.hypot(gx, gy)[ys[idx], xs[idx]]
        edge = np.clip(edge / (edge.max() + 1e-6) * 3, 0, 1)
        self.rgb = ramp(0.7 + 0.3 * np.maximum(RAND[:, 0], edge))
        self.e0 = (0.32 + 0.25 * RAND[:, 1] + 0.45 * edge).astype(np.float32)
        self.width = wd * s

    def __call__(self, t, shimmer=1.0):
        wob = np.c_[np.sin(t * 1.3 + RAND[:, 0] * 30), np.sin(t * 1.1 + RAND[:, 1] * 30),
                    np.sin(t * 0.9 + RAND[:, 2] * 30)].astype(np.float32) * 0.006 * shimmer
        tw = 0.8 + 0.2 * np.sin(t * (3 + 4 * RAND[:, 3]) + RAND[:, 4] * 50)
        return State(self.P0 + wob, self.rgb, self.e0 * tw)


# ====================================================================== 大脑
class BrainForm:
    HL_KEYS = ("pfc", "acc", "amygdala", "hippocampus", "insula", "dmn", "cpl", "scan", "all")

    def __init__(self):
        b = brainmod.build()
        self.b = b
        n = len(b["pos"])
        assert n == N, n
        perm = np.random.default_rng(99).permutation(N)
        self.P0 = b["pos"][perm]
        self.N0 = b["normal"][perm]
        self.reg = b["region"][perm]
        self.side = b["side"][perm]
        self.expo = b["expo"][perm]
        self.lt = b["link_t"][perm]
        self.lid = b["link_id"][perm]
        self.surface = np.linalg.norm(self.N0, axis=1) > 0.5
        R = brainmod
        self.masks = {
            "pfc": self.reg == R.R_PFC,
            "acc": self.reg == R.R_ACC,
            "amygdala": self.reg == R.R_AMY,
            "hippocampus": self.reg == R.R_HIP,
            "insula": self.reg == R.R_INS,
            "dmn": np.isin(self.reg, [R.R_MPFC, R.R_PCC, R.R_ANG]),
            "link": self.reg == R.R_LINK,
            "interior": self.reg == R.R_INTERIOR,
        }
        self.deep = ~self.surface & ~self.masks["link"] & ~self.masks["interior"]
        self.centers = {k[2:]: v for k, v in b.items() if k.startswith("c_")}
        g = self.expo ** 1.5
        self.g = g
        self.base_lvl = np.clip(0.18 + 0.6 * g + 0.12 * RAND[:, 0], 0, 1)

    def transform(self, yaw, pitch, scale, offset, roll=0.0):
        M = (rot_z(roll) @ rot_x(pitch) @ rot_y(yaw)).astype(np.float32)
        return M, np.asarray(offset, np.float32), scale

    def point(self, key, prm):
        M, off, sc = self.transform(prm["yaw"], prm["pitch"], prm["scale"], prm["offset"], prm.get("roll", 0))
        return (self.centers[key] @ M.T) * sc + off

    def __call__(self, t, prm):
        M, off, sc = self.transform(prm["yaw"], prm["pitch"], prm["scale"], prm["offset"], prm.get("roll", 0))
        P = (self.P0 @ M.T) * sc + off
        Nn = self.N0 @ M.T
        rim = np.where(self.surface, 1 - np.abs(Nn[:, 2]), 0.45)
        lvl = np.clip(self.base_lvl + 0.35 * rim ** 2, 0, 1)
        e = (0.16 + 0.85 * self.g + 0.85 * rim ** 3) * self.surface
        e = e + self.deep * 0.16 + self.masks["interior"] * 0.08
        dim = prm.get("dim", 1.0)
        e = e * dim
        hl = prm.get("hl", {})
        pulse = 0.75 + 0.25 * np.sin(t * 2 * np.pi * 0.5)
        boost = np.zeros(N, np.float32)
        for k, w in hl.items():
            if w <= 0 or k not in self.masks:
                continue
            m = self.masks[k]
            side_bias = prm.get("side_bias", {}).get(k)
            ww = np.full(N, w, np.float32)
            if side_bias is not None:   # 例如右侧更亮
                ww = np.where(self.side == side_bias, w, w * 0.55)
            boost += m * ww
        e = e + boost * (1.6 + 0.9 * self.surface) * pulse * (0.7 + 0.6 * RAND[:, 2])
        lvl = np.where(boost > 0, np.clip(lvl + boost * 0.7, 0, 1), lvl)
        # 连线：DMN（偶数）与耦合（奇数），沿弧线奔走的光脉冲
        lw_d, lw_c = prm.get("links_dmn", 0.0), prm.get("links_cpl", 0.0)
        if lw_d > 0 or lw_c > 0:
            lm = self.masks["link"]
            kind = self.lid % 2
            ph = (t * 0.55 + (self.lid // 2) * 0.17) % 1.0
            dd = np.abs(self.lt - ph)
            dd = np.minimum(dd, 1 - dd)
            pulse_l = 0.35 + 1.6 * np.exp(-(dd / 0.07) ** 2)
            wl = np.where(kind == 0, lw_d, lw_c)
            e = np.where(lm, wl * pulse_l * 1.1, e)
            lvl = np.where(lm, 0.85 + 0.15 * RAND[:, 3], lvl)
        else:
            e = np.where(self.masks["link"], 0.0, e)
        # MRI 扫描面（沿前后轴）
        scan = prm.get("scan")
        if scan is not None:
            band = np.exp(-((self.P0[:, 2] - scan) / 0.06) ** 2)
            e = e + band * 3.2 * self.surface + band * 1.6
            lvl = np.clip(lvl + band * 0.5, 0, 1)
        e = e * prm.get("gain", 1.0)
        return State(P.astype(np.float32), ramp(lvl), e.astype(np.float32))


# ====================================================================== 呼吸球
class SphereForm:
    def __init__(self, radius=0.55, core_frac=0.5):
        n = N
        self.core = RAND[:, 0] < core_frac
        i = np.arange(n, dtype=np.float32)
        ga = np.pi * (3 - np.sqrt(5))
        yy = 1 - 2 * (i + 0.5) / n
        rr = np.sqrt(1 - yy * yy)
        fib = np.c_[np.cos(ga * i) * rr, yy, np.sin(ga * i) * rr].astype(np.float32)
        fib = fib[np.random.default_rng(4).permutation(n)]
        shell = RAND[:, 1] < 0.8
        rad = np.where(shell, 1.0 + 0.02 * (RAND[:, 2] - 0.5), RAND[:, 2] ** (1 / 3) * 0.95)
        self.core_p = fib * rad[:, None]
        self.shell = shell
        self.r0 = radius
        # 轨道：随机倾角的圆环
        rng = np.random.default_rng(21)
        k = 7
        self.ring_id = (RAND[:, 3] * k).astype(np.int32)
        ax = rng.normal(size=(k, 3))
        ax[:, 1] = np.abs(ax[:, 1]) + 1.5
        ax /= np.linalg.norm(ax, axis=1, keepdims=True)
        self.ring_ax = ax.astype(np.float32)
        self.ring_r = rng.uniform(1.45, 2.6, k).astype(np.float32)
        self.ring_w = rng.uniform(0.18, 0.4, k).astype(np.float32) * rng.choice([-1, 1], k)
        self.theta0 = (RAND[:, 4] * 2 * np.pi).astype(np.float32)
        self.chaos_off = RDIR * (0.5 + RAND[:, 5:6])
        # 每条轨道的基向量
        u = np.cross(self.ring_ax, np.array([1, 0, 0], np.float32))
        u /= np.linalg.norm(u, axis=1, keepdims=True)
        v = np.cross(self.ring_ax, u)
        self.ru, self.rv = u.astype(np.float32), v.astype(np.float32)
        self.rgb_core = ramp(0.55 + 0.45 * RAND[:, 0] ** 0.5)
        self.rgb_orb = ramp(0.45 + 0.4 * RAND[:, 1])
        self.e_core = np.where(rad > 0.97, 0.55, 0.18) * (0.7 + 0.6 * RAND[:, 5])
        self.e_orb = 0.35 + 0.5 * RAND[:, 2]
        self.swarm = None

    def __call__(self, t, calm=1.0, br=0.5, scale=1.0, center=(0, 0, 0), orbit_gain=1.0, radius=None,
                 swarm=None):
        r = (self.r0 if radius is None else radius) * (1 + 0.16 * (br - 0.5))
        ang = t * 0.1
        core = (self.core_p @ rot_y(ang).T) * r
        rid = self.ring_id
        th = self.theta0 + self.ring_w[rid] * t
        R = self.ring_r[rid] * self.r0 * (1 + 0.04 * np.sin(t * 0.8 + rid))
        orb = (self.ru[rid] * np.cos(th)[:, None] + self.rv[rid] * np.sin(th)[:, None]) * R[:, None]
        orb += RDIR * 0.03
        if calm < 1 and swarm is not None:
            sw = swarm(t, chaos=1.0, scale=0.8).P
            orb = orb * calm + sw * (1 - calm)
        elif calm < 1:
            orb = orb + self.chaos_off * (1 - calm) * np.sin(t * (0.7 + RAND[:, 0:1]) + RAND[:, 1:2] * 9)
        P = np.where(self.core[:, None], core, orb) * scale + np.asarray(center, np.float32)
        glow = 0.85 + 0.35 * br
        nz = (self.core_p @ rot_y(ang).T)[:, 2] / (np.linalg.norm(self.core_p, axis=1) + 1e-6)
        rim = 1 - np.abs(nz)
        ec = np.where(self.shell, 0.12 + 1.0 * rim ** 2.2, 0.1) * (0.7 + 0.6 * RAND[:, 5])
        e = np.where(self.core, ec * glow, self.e_orb * orbit_gain * (0.6 + 0.4 * calm))
        tw = 0.8 + 0.2 * np.sin(t * (2 + 3 * RAND[:, 4]) + RAND[:, 0] * 60)
        rgb = np.where(self.core[:, None], self.rgb_core, self.rgb_orb)
        return State(P.astype(np.float32), rgb, (e * tw).astype(np.float32))


# ====================================================================== 柱状图
class BarsForm:
    VALUES = (0.38, 0.30, 0.33)

    def __init__(self, xs=(-1.05, 0.0, 1.05), base_y=-0.62, unit=3.0, width=0.42):
        self.xs, self.base_y, self.unit, self.width = xs, base_y, unit, width
        r = RAND[:, 0]
        self.kind = np.where(r < 0.84, (r / 0.28).astype(np.int32), np.where(r < 0.93, 3, 4))  # 0-2 柱，3 坐标轴，4 星尘
        rng = np.random.default_rng(31)
        # 柱体内：表面为主
        u = rng.random((N, 3)).astype(np.float32)
        face = rng.integers(0, 3, N)
        on_surf = rng.random(N) < 0.75
        for ax in range(3):
            sel = on_surf & (face == ax)
            u[sel, ax] = np.where(rng.random(sel.sum()) < 0.5, 0.0, 1.0)
        self.u = u
        self.rgb = ramp(np.where(self.kind < 3, 0.55 + 0.45 * RAND[:, 1], 0.6 + 0.3 * RAND[:, 1]))
        self.e0 = np.where(self.kind < 3, 0.5 + 0.4 * RAND[:, 2], np.where(self.kind == 3, 0.7, 0.25)).astype(np.float32)
        self.dust = (RDIR * np.array([2.4, 1.2, 0.8], np.float32) * RAND[:, 3:4]).astype(np.float32)

    def top(self, i, g):
        return self.xs[i], self.base_y + self.VALUES[i] * self.unit * g

    def __call__(self, t, grow=(1, 1, 1), center=(0, 0, 0), yaw=0.0):
        P = np.zeros((N, 3), np.float32)
        e = self.e0.copy()
        for i in range(3):
            m = self.kind == i
            h = self.VALUES[i] * self.unit * grow[i]
            P[m, 0] = self.xs[i] + (self.u[m, 0] - 0.5) * self.width
            P[m, 1] = self.base_y + self.u[m, 1] * max(h, 0.003)
            P[m, 2] = (self.u[m, 2] - 0.5) * self.width
            top = self.u[m, 1] > 0.985
            e[np.where(m)[0][top]] *= 2.2
        m = self.kind == 3
        P[m, 0] = (self.u[m, 0] - 0.5) * 3.6
        P[m, 1] = self.base_y - 0.02 + (self.u[m, 1] - 0.5) * 0.012
        P[m, 2] = (self.u[m, 2] - 0.5) * 0.02
        m = self.kind == 4
        P[m] = self.dust[m] + np.c_[np.zeros(m.sum()), 0.05 * np.sin(t * 0.6 + RAND[m, 4] * 9), np.zeros(m.sum())]
        P = P @ rot_y(yaw).T + np.asarray(center, np.float32)
        tw = 0.85 + 0.15 * np.sin(t * (2 + 3 * RAND[:, 4]) + RAND[:, 5] * 40)
        return State(P, self.rgb, e * tw)


# ====================================================================== 风险环
class RingForm:
    def __init__(self, radius=0.95):
        self.r = radius
        self.th = (RAND[:, 0] * 2 * np.pi).astype(np.float32)
        self.tube = RDIR * (0.035 + 0.05 * RAND[:, 1:2] ** 2)
        self.inner = RAND[:, 2] < 0.18
        self.rgb = ramp(0.6 + 0.4 * RAND[:, 3])
        self.e0 = np.where(self.inner, 0.25, 0.55 + 0.4 * RAND[:, 4]).astype(np.float32)

    def __call__(self, t, cut=0.0, center=(0, 0, 0), tilt=0.25, frac=0.31):
        th = self.th + t * 0.05
        # 从 12 点方向顺时针：最后 frac 的弧段在 cut→1 时飞散并熄灭
        a = ((np.pi / 2 - th) % (2 * np.pi)) / (2 * np.pi)
        lost = a > (1 - frac)
        r = np.where(self.inner, self.r * (0.3 + 0.6 * RAND[:, 5]), self.r)
        P = np.c_[np.cos(th) * r, np.sin(th) * r, np.zeros(N)].astype(np.float32) + self.tube
        fly = lost[:, None] * cut * (RDIR * 0.25 + np.c_[np.cos(th), np.sin(th), np.zeros(N)] * 0.5)
        P = P + fly.astype(np.float32)
        P = P @ rot_x(tilt).T + np.asarray(center, np.float32)
        e = self.e0 * np.where(lost, (1 - cut) ** 2 * 0.9 + 0.1 * (1 - cut), 1.0)
        e = np.where(self.inner, self.e0 * (0.6 + 0.4 * np.sin(t * 2 + RAND[:, 0] * 20)), e)
        return State(P, self.rgb, e.astype(np.float32))


# ====================================================================== 神经元网络
def _branch(rng, p, d, length, radius, depth, segs, path, s0):
    """递归生成树突分枝，返回线段列表 (p0, p1, r, path_id, s0, s1)。"""
    n = 5
    pts = [p]
    for _ in range(n):
        d = d + rng.normal(0, 0.35, 3)
        d /= np.linalg.norm(d)
        pts.append(pts[-1] + d * length / n)
    for k in range(n):
        segs.append((pts[k], pts[k + 1], radius * (1 - 0.5 * k / n), path, s0 + k / n * 0.2, s0 + (k + 1) / n * 0.2))
    if depth > 0:
        for _ in range(2):
            nd = d + rng.normal(0, 0.8, 3)
            _branch(rng, pts[-1], nd / np.linalg.norm(nd), length * 0.62, radius * 0.6, depth - 1, segs, path, s0 + 0.2)


class NeuronForm:
    def __init__(self, seed=8):
        rng = np.random.default_rng(seed)
        somas = np.array([[-1.6, 0.35, -0.2], [-0.55, -0.45, 0.25], [0.45, 0.5, -0.1], [1.5, -0.25, 0.15],
                          [-0.9, 0.95, -0.5], [0.95, -0.95, -0.4], [0.0, 0.0, 0.6]], np.float32)
        segs = []
        for i, s in enumerate(somas):
            for _ in range(5):
                d = rng.normal(size=3)
                _branch(rng, s, d / np.linalg.norm(d), 0.55, 0.035, 2, segs, -1 - i, 0.0)
        # 轴突：相邻神经元之间
        pairs = [(0, 1), (1, 2), (2, 3), (4, 2), (1, 5), (6, 3), (0, 6), (4, 0), (5, 3)]
        for k, (a, b) in enumerate(pairs):
            p0, p1 = somas[a], somas[b]
            mid = (p0 + p1) / 2 + rng.normal(0, 0.3, 3)
            m = 24
            for j in range(m):
                t0, t1 = j / m, (j + 1) / m
                q0 = (1 - t0) ** 2 * p0 + 2 * (1 - t0) * t0 * mid + t0 ** 2 * p1
                q1 = (1 - t1) ** 2 * p0 + 2 * (1 - t1) * t1 * mid + t1 ** 2 * p1
                segs.append((q0, q1, 0.022, k, t0, t1))
        p0 = np.array([s[0] for s in segs], np.float32)
        p1 = np.array([s[1] for s in segs], np.float32)
        rad = np.array([s[2] for s in segs], np.float32)
        pid = np.array([s[3] for s in segs], np.int32)
        sa = np.array([s[4] for s in segs], np.float32)
        sb = np.array([s[5] for s in segs], np.float32)
        L = np.linalg.norm(p1 - p0, axis=1)
        n_soma = int(N * 0.16)
        n_seg = N - n_soma
        wseg = L * (rad + 0.01) * np.where(pid >= 0, 1.6, 1.0)
        idx = rng.choice(len(segs), n_seg, p=wseg / wseg.sum())
        f = rng.random(n_seg).astype(np.float32)
        P = p0[idx] + (p1[idx] - p0[idx]) * f[:, None] + RDIR[:n_seg] * (rad[idx] * rng.random(n_seg))[:, None]
        si = rng.integers(0, len(somas), n_soma)
        Ps = somas[si] + RDIR[n_seg:] * (0.11 * rng.random(n_soma) ** 0.6)[:, None]
        self.P0 = np.concatenate([P, Ps]).astype(np.float32)
        self.pid = np.concatenate([pid[idx], -1 - si]).astype(np.int32)
        self.s = np.concatenate([sa[idx] + (sb[idx] - sa[idx]) * f, np.zeros(n_soma)]).astype(np.float32)
        self.is_soma = np.r_[np.zeros(n_seg, bool), np.ones(n_soma, bool)]
        self.is_axon = self.pid >= 0
        self.n_axon = len(pairs)
        self.pairs = pairs
        perm = np.random.default_rng(77).permutation(N)
        for a in ("P0", "pid", "s", "is_soma", "is_axon"):
            setattr(self, a, getattr(self, a)[perm])
        self.rgb = ramp(np.where(self.is_soma, 0.8 + 0.2 * RAND[:, 0], np.where(self.is_axon, 0.55 + 0.3 * RAND[:, 0], 0.4 + 0.3 * RAND[:, 0])))
        self.e0 = np.where(self.is_soma, 0.55, np.where(self.is_axon, 0.4, 0.3)).astype(np.float32)
        self.somas = somas

    def __call__(self, t, activity=1.0, scale=1.0, center=(0, 0, 0)):
        P = (self.P0 @ (rot_y(t * 0.08) @ rot_x(0.15)).T) * scale + np.asarray(center, np.float32)
        e = self.e0.copy()
        k = np.clip(self.pid, 0, None)
        ph = (t * 0.7 + k * 0.37) % 1.4
        pulse = np.exp(-((self.s - ph) / 0.06) ** 2)
        e = np.where(self.is_axon, e * (0.6 + 3.0 * activity * pulse), e)
        # 突触后神经元在脉冲抵达时闪亮
        flash = np.zeros(N, np.float32)
        for j, (a, b) in enumerate(self.pairs):
            phj = (t * 0.7 + j * 0.37) % 1.4
            amt = np.exp(-((phj - 1.0) / 0.08) ** 2)
            flash += (self.pid == -1 - b) * amt
        e = e * (1 + 2.2 * activity * flash)
        return State(P.astype(np.float32), self.rgb, e.astype(np.float32))


# ====================================================================== 打坐的人
def _ellipsoid(c, r, n, rng):
    d = rng.normal(size=(n, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    return np.asarray(c) + d * np.asarray(r), d


def _tube(p0, p1, r0, r1, n, rng):
    p0, p1 = np.asarray(p0, float), np.asarray(p1, float)
    ax = p1 - p0
    L = np.linalg.norm(ax)
    ax /= L
    u = np.cross(ax, [0, 0, 1.0])
    if np.linalg.norm(u) < 1e-3:
        u = np.cross(ax, [1.0, 0, 0])
    u /= np.linalg.norm(u)
    v = np.cross(ax, u)
    t = rng.random(n)
    th = rng.random(n) * 2 * np.pi
    r = r0 + (r1 - r0) * t
    nrm = np.cos(th)[:, None] * u + np.sin(th)[:, None] * v
    return p0 + ax * (t * L)[:, None] + nrm * r[:, None], nrm


class MeditatorForm:
    def __init__(self, seed=12):
        rng = np.random.default_rng(seed)
        n_fig = int(N * 0.60)
        parts = []
        # (类型, 参数, 面积权重)
        prims = [
            ("e", ((0, 0.72, 0.02), (0.125, 0.155, 0.14)), 1.0),
            ("t", ((0, 0.49, 0), (0, 0.61, 0.01), 0.058, 0.052), 0.3),
        ]
        # 躯干：分层椭圆放样（肩线向内收，避免方肩）
        torso_y = np.array([-0.34, -0.22, -0.10, 0.02, 0.14, 0.25, 0.35, 0.43, 0.50])
        torso_rx = np.array([0.24, 0.225, 0.205, 0.215, 0.245, 0.265, 0.27, 0.24, 0.10])
        torso_rz = np.array([0.17, 0.16, 0.145, 0.145, 0.155, 0.16, 0.15, 0.12, 0.07])
        for k in range(8):
            prims.append(("l", (torso_y[k], torso_y[k + 1], torso_rx[k], torso_rx[k + 1], torso_rz[k], torso_rz[k + 1]), 0.5))
        for sx in (-1, 1):
            prims += [
                ("e", ((sx * 0.26, 0.41, 0), (0.085, 0.07, 0.085)), 0.3),
                ("t", ((sx * 0.29, 0.40, 0), (sx * 0.40, 0.05, 0.07), 0.062, 0.05), 0.6),
                ("t", ((sx * 0.40, 0.05, 0.07), (sx * 0.43, -0.25, 0.31), 0.048, 0.038), 0.5),
                ("e", ((sx * 0.44, -0.29, 0.35), (0.05, 0.03, 0.065)), 0.12),
                ("t", ((sx * 0.13, -0.36, 0.02), (sx * 0.58, -0.43, 0.34), 0.125, 0.10), 1.0),
                ("t", ((sx * 0.58, -0.45, 0.36), (-sx * 0.12, -0.46, 0.50), 0.085, 0.06), 0.8),
                ("e", ((-sx * 0.20, -0.46, 0.52), (0.10, 0.045, 0.06)), 0.15),
            ]
        prims.append(("e", ((0, -0.60, 0.12), (0.66, 0.07, 0.52)), 0.6))
        areas = []
        for kind, prm, wgt in prims:
            if kind == "e":
                r = np.array(prm[1])
                areas.append(4 * np.pi * (np.prod(r) ** (2 / 3)) * wgt * 6)
            elif kind == "t":
                L = np.linalg.norm(np.subtract(prm[1], prm[0]))
                areas.append(2 * np.pi * (prm[2] + prm[3]) / 2 * L * wgt * 6)
            else:
                areas.append(2 * np.pi * (prm[2] + prm[3]) / 2 * (prm[1] - prm[0]) * 6)
        areas = np.array(areas)
        counts = np.floor(areas / areas.sum() * n_fig).astype(int)
        counts[0] += n_fig - counts.sum()
        pts, nrms = [], []
        for (kind, prm, _), c in zip(prims, counts):
            if kind == "e":
                p, nr = _ellipsoid(prm[0], prm[1], c, rng)
            elif kind == "t":
                p, nr = _tube(prm[0], prm[1], prm[2], prm[3], c, rng)
            else:
                y0, y1, rx0, rx1, rz0, rz1 = prm
                f = rng.random(c)
                th = rng.random(c) * 2 * np.pi
                rx, rz = rx0 + (rx1 - rx0) * f, rz0 + (rz1 - rz0) * f
                p = np.c_[np.cos(th) * rx, y0 + (y1 - y0) * f, np.sin(th) * rz]
                nr = np.c_[np.cos(th) * rz, np.zeros(c), np.sin(th) * rx]
                nr /= np.linalg.norm(nr, axis=1, keepdims=True)
            pts.append(p)
            nrms.append(nr)
        fig = np.concatenate(pts).astype(np.float32)
        fig_n = np.concatenate(nrms).astype(np.float32)
        # 其余部件
        n_breath = int(N * 0.07)
        n_nose = int(N * 0.03)
        n_ring = int(N * 0.15)
        n_tick = int(N * 0.10)
        n_stray = N - n_fig - n_breath - n_nose - n_ring - n_tick
        self.counts = dict(fig=n_fig, breath=n_breath, nose=n_nose, ring=n_ring, tick=n_tick, stray=n_stray)
        kinds = np.concatenate([np.full(n, k, np.int8) for k, n in enumerate(self.counts.values())])
        self.kind = kinds
        P = np.zeros((N, 3), np.float32)
        Nn = np.zeros((N, 3), np.float32)
        P[:n_fig], Nn[:n_fig] = fig, fig_n
        i0 = n_fig
        d = rng.normal(size=(n_breath, 3))
        d /= np.linalg.norm(d, axis=1, keepdims=True)
        self.breath_dir = d.astype(np.float32)
        self.breath_r = (0.7 + 0.3 * rng.random(n_breath) ** 0.3).astype(np.float32)
        i0 += n_breath
        self.nose_t = rng.random(n_nose).astype(np.float32)
        self.nose_j = (rng.normal(size=(n_nose, 3)) * 0.02).astype(np.float32)
        i0 += n_nose
        self.ring_th = (rng.random(n_ring) * 2 * np.pi).astype(np.float32)
        self.ring_j = (rng.normal(size=(n_ring, 3)) * 0.018).astype(np.float32)
        i0 += n_ring
        self.tick_k = rng.integers(0, 8, n_tick)
        self.tick_d = rng.normal(size=(n_tick, 3)).astype(np.float32)
        self.tick_d /= np.linalg.norm(self.tick_d, axis=1, keepdims=True)
        self.tick_d *= (0.05 * rng.random(n_tick) ** 0.5)[:, None]
        self.stray_t = rng.random(n_stray).astype(np.float32)
        self.stray_j = (rng.normal(size=(n_stray, 3)) * 0.03).astype(np.float32)
        self.P_fig = P
        self.N_fig = Nn
        self.spine = (np.abs(P[:, 0]) < 0.06) & (P[:, 1] > -0.3) & (P[:, 1] < 0.62) & (kinds == 0) & (P[:, 2] < 0)
        self.cushion = (kinds == 0) & (P[:, 1] < -0.52) & (np.abs(P[:, 0]) > 0.0) & (np.hypot(P[:, 0] / 0.66, (P[:, 2] - 0.12) / 0.52) > 0.0)
        self.cushion &= np.arange(N) >= n_fig - counts[-1]
        self.rgb_fig = ramp(0.45 + 0.35 * RAND[:, 0])
        self.ring_center = np.array([0, 0.08, 0], np.float32)
        self.ring_R = 0.94

    # 四个阶段节点在圆环上的角度（顶部开始顺时针）
    NODE_ANG = (np.pi / 2, 0.0, -np.pi / 2, np.pi)

    def node_pos(self, k, prm):
        a = self.NODE_ANG[k]
        p = self.ring_center + np.array([np.cos(a), np.sin(a), 0], np.float32) * self.ring_R
        return self._xf(p[None], prm)[0]

    def tick_pos(self, k, prm):
        a = np.pi + (k + 0.5) / 8 * np.pi
        p = np.array([np.cos(a) * 1.0, -0.78, np.sin(a) * 0.45 + 0.1], np.float32)
        return self._xf(p[None], prm)[0]

    def _xf(self, P, prm):
        M = rot_x(prm.get("pitch", 0.2)) @ rot_y(prm.get("yaw", 0.0))
        return (P @ M.T) * prm.get("scale", 1.0) + np.asarray(prm.get("offset", (0, 0, 0)), np.float32)

    def __call__(self, t, prm):
        c = self.counts
        kind = self.kind
        br = prm.get("br", 0.5)
        P = self.P_fig.copy()
        e = np.zeros(N, np.float32)
        lvl = np.zeros(N, np.float32)
        # 人形
        M = rot_x(prm.get("pitch", 0.2)) @ rot_y(prm.get("yaw", 0.0))
        Nn = self.N_fig @ M.T
        rim = 1 - np.abs(Nn[:, 2])
        f = kind == 0
        chest = np.clip(1 - np.hypot(P[:, 0] / 0.3, (P[:, 1] - 0.05) / 0.35), 0, 1)
        P[f] += (np.c_[P[f, 0] * 0.04, np.zeros(f.sum()), P[f, 2] * 0.05] * (br - 0.5) * chest[f, None]).astype(np.float32)
        e[f] = 0.2 + 0.95 * rim[f] ** 2.5 + 0.08 * RAND[f, 1]
        e[self.cushion] *= 0.35
        lvl[f] = 0.4 + 0.5 * rim[f] + 0.1 * RAND[f, 0]
        sp = prm.get("spine", 0.0)
        if sp > 0:
            ph = (t * 0.6) % 1.4 - 0.2
            yy = (P[:, 1] + 0.3) / 0.92
            band = np.exp(-((yy - ph) / 0.12) ** 2)
            e = np.where(self.spine, e + sp * (0.8 + 2.5 * band), e)
            lvl = np.where(self.spine, 1.0, lvl)
        # 呼吸球（胸腹之间）
        b = kind == 1
        rb = 0.085 + 0.055 * br
        P[b] = np.array([0, -0.02, 0.05], np.float32) + self.breath_dir * (self.breath_r * rb)[:, None]
        e[b] = (0.22 + 0.4 * br) * prm.get("breath_gain", 1.0)
        lvl[b] = 0.85 + 0.15 * RAND[b, 2]
        # 鼻息：吸气时沿弧线流入，呼气时流出
        nz = kind == 2
        flow = prm.get("nose", 0.0)
        dirn = np.sign(np.sin(2 * np.pi * (t - prm.get("br_t0", 0.0)) / 8)) if flow > 0 else 0
        s = (self.nose_t + t * 0.5 * (dirn if dirn != 0 else 1)) % 1.0
        nose = np.array([0, 0.70, 0.16], np.float32)
        spread = np.c_[self.nose_j[:, 0] * 18, -0.12 + self.nose_j[:, 1] * 10, 0.85 + self.nose_j[:, 2] * 5]
        q = nose[None] + spread * s[:, None]
        P[nz] = q
        e[nz] = flow * (1 - s) * 0.9
        lvl[nz] = 0.9
        # 四阶段环
        rg = kind == 3
        cw = prm.get("cycle", 0.0)
        th = self.ring_th
        rp = self.ring_center + np.c_[np.cos(th), np.sin(th), np.zeros(len(th))] * self.ring_R + self.ring_j
        halo = self.ring_center + np.c_[np.cos(th), np.sin(th), np.zeros(len(th))] * (self.ring_R * (0.85 + 0.5 * RAND[rg, 3:4]) ) + self.ring_j * 8
        P[rg] = (rp * cw + halo * (1 - cw)).astype(np.float32)
        node = np.zeros(len(th), np.float32)
        for a in self.NODE_ANG:
            da = np.angle(np.exp(1j * (th - a)))
            node += np.exp(-(da / 0.06) ** 2)
        comet_a = np.pi / 2 - prm.get("comet", 0.0) * 2 * np.pi
        dc = np.angle(np.exp(1j * (th - comet_a)))
        trail = np.where(dc > 0, np.exp(-dc / 0.5), np.exp(dc / 0.06)) * (cw > 0.5)
        e[rg] = 0.08 * (1 - cw) + cw * (0.3 + 1.6 * node + 2.0 * trail)
        lvl[rg] = 0.6 + 0.4 * np.clip(node + trail, 0, 1)
        # 8 周刻度：地面弧线上的 8 个光团
        tk = kind == 4
        tw = prm.get("ticks", 0.0)
        lit = prm.get("ticks_lit", 0.0)
        a = np.pi + (self.tick_k + 0.5) / 8 * np.pi
        tp = np.c_[np.cos(a) * 1.0, np.full(len(a), -0.78), np.sin(a) * 0.45 + 0.1] + self.tick_d
        floor = np.c_[np.cos(a + RAND[tk, 0] * 0.5) * (0.9 + 0.5 * RAND[tk, 1]), np.full(len(a), -0.8),
                      np.sin(a + RAND[tk, 0] * 0.5) * (0.5 + 0.3 * RAND[tk, 1])]
        P[tk] = (tp * tw + floor * (1 - tw)).astype(np.float32)
        on = np.clip(lit - self.tick_k, 0, 1)
        e[tk] = 0.06 * (1 - tw) + tw * (0.25 + 1.4 * on)
        lvl[tk] = 0.5 + 0.5 * on
        # 走神的粒子：离开后被温和地牵回
        st = kind == 5
        sw = prm.get("stray", 0.0)
        ph = prm.get("stray_phase", 0.0)
        u = self.stray_t
        out_pos = np.array([1.0, 0.75, 0.3], np.float32) + np.c_[np.sin(u * 9 + t), np.cos(u * 7 + t), np.sin(u * 5)] * 0.25
        home = np.array([0, -0.02, 0.05], np.float32) + self.stray_j * 3
        k = ease_io(np.clip(ph * 1.3 - u * 0.3, 0, 1))[:, None]
        curve = np.c_[np.zeros(len(u)), 0.35 * np.sin(np.pi * k[:, 0]), np.zeros(len(u))]
        P[st] = (out_pos * (1 - k) + home * k + curve).astype(np.float32)
        e[st] = sw * (0.6 + 0.6 * RAND[st, 2])
        lvl[st] = 0.85
        P = self._xf(P, prm)
        return State(P.astype(np.float32), ramp(lvl), (e * prm.get("gain", 1.0)).astype(np.float32))


# ====================================================================== 背景星尘
class Dust:
    def __init__(self, n=3200):
        rng = np.random.default_rng(55)
        self.P0 = (rng.random((n, 3)) * np.array([12, 7, 9]) - np.array([6, 3.5, 7.5])).astype(np.float32)
        self.v = (rng.normal(size=(n, 3)) * 0.02).astype(np.float32)
        self.rgb = ramp(0.45 + 0.4 * rng.random(n))
        self.e = (0.25 + 0.6 * rng.random(n) ** 3).astype(np.float32)
        self.ph = rng.random(n).astype(np.float32) * 50

    def __call__(self, t, gain=1.0, speed=1.0):
        P = self.P0 + self.v * t * speed + np.c_[np.zeros(len(self.P0)), 0.012 * t * speed * np.ones(len(self.P0)), np.zeros(len(self.P0))]
        P = (P + np.array([6, 3.5, 7.5])) % np.array([12, 7, 9]) - np.array([6, 3.5, 7.5])
        P = P @ rot_y(t * 0.01).T
        tw = 0.6 + 0.4 * np.sin(t * 0.8 + self.ph)
        return State(P.astype(np.float32), self.rgb, self.e * tw * gain)


# ====================================================================== 片尾星系
class GalaxyForm:
    def __init__(self, arms=3):
        rng = np.random.default_rng(66)
        self.r = (RAND[:, 0] ** 0.7 * 1.7 + 0.05).astype(np.float32)
        arm = (RAND[:, 1] * arms).astype(np.int32)
        self.th0 = (arm * 2 * np.pi / arms + self.r * 2.6 + rng.normal(0, 0.28, N) / (self.r + 0.4)).astype(np.float32)
        self.h = (rng.normal(0, 0.04, N) * (1.4 - self.r / 1.75)).astype(np.float32)
        bulge = RAND[:, 2] < 0.14
        self.r[bulge] = (RAND[bulge, 3] ** 1.5 * 0.35).astype(np.float32)
        self.h[bulge] = rng.normal(0, 0.09, bulge.sum()).astype(np.float32)
        self.rgb = ramp(np.clip(1.0 - self.r / 2.2 + 0.15 * RAND[:, 4], 0, 1))
        self.e0 = (0.18 + 0.45 * np.exp(-self.r * 1.5) + 0.15 * RAND[:, 5]).astype(np.float32)

    def __call__(self, t, center=(1.45, 0.0, -0.6)):
        th = self.th0 + t * 0.07 / (self.r + 0.35)
        P = np.c_[np.cos(th) * self.r, self.h, np.sin(th) * self.r].astype(np.float32)
        P = P @ (rot_z(0.35) @ rot_x(1.05)).T + np.asarray(center, np.float32)
        tw = 0.8 + 0.2 * np.sin(t * (1 + 2 * RAND[:, 3]) + RAND[:, 4] * 30)
        return State(P, self.rgb, self.e0 * tw)
