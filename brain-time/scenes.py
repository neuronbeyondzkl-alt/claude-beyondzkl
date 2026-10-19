"""分镜：state(t) 把时间映射成一帧画面的全部参数（纯函数，可并行渲染）。

每一段的视觉事件都直接读取 timeline.EVENTS，保证画面与配乐同源卡点。
"""
import numpy as np

import geometry as G
import hud
import timeline as TL
from render import C, WHITE, W, H
from timeline import T, EVENTS as E, decay_env

NP = {k: (np.array(v[0], np.float32) - G.CENTER.astype(np.float32)) for k, v in G.NODES.items()}
NI = G.NODE_INDEX
HOT = C[30] * 0.5 + WHITE * 0.5

ENG_C = np.array([22, -120, 54], np.float32)      # 记忆印迹：画面左上（后方 = 过去）
CRY_C = np.array([22, 126, 40], np.float32)       # 未来情景：画面右上（前方 = 未来）
EYE = np.array([32, 95, -32], np.float32)
CHIASM = np.array([0, 21, -20], np.float32)

DMN = ["mPFC", "vmPFC", "PCC", "AG_L", "AG_R", "LTC_L", "LTC_R", "HC_L", "HC_R"]
DMN_EDGES = [("mPFC", "PCC"), ("PCC", "AG_L"), ("PCC", "AG_R"), ("mPFC", "LTC_L"), ("mPFC", "LTC_R"),
             ("PCC", "HC_L"), ("PCC", "HC_R"), ("AG_R", "LTC_R"), ("AG_L", "LTC_L"), ("vmPFC", "HC_R"),
             ("mPFC", "vmPFC")]
DAN = ["FEF_L", "FEF_R", "IPS_L", "IPS_R"]
DAN_EDGES = [("FEF_L", "FEF_R"), ("FEF_R", "IPS_R"), ("FEF_L", "IPS_L"), ("IPS_L", "IPS_R"), ("FEF_R", "IPS_L")]
SAL = ["AI_L", "AI_R", "dACC"]
SAL_EDGES = [("AI_R", "dACC"), ("AI_L", "dACC"), ("AI_L", "AI_R")]

REFS = [
    "Azevedo et al. (2009) J Comp Neurol 513:532",
    "Marr (1971) Phil Trans R Soc B 262:23",
    "Horner et al. (2015) Nat Commun 6:7462",
    "Norman et al. (2019) Science 365:eaax1030",
    "Wheeler, Petersen & Buckner (2000) PNAS 97:11125",
    "Danker & Anderson (2010) Psychol Bull 136:87",
    "Raichle et al. (2001) PNAS 98:676",
    "Andrews-Hanna et al. (2010) Neuron 65:550",
    "Nader, Schafe & LeDoux (2000) Nature 406:722",
    "Bartlett (1932) Remembering. Cambridge UP",
    "Schacter & Addis (2007) Phil Trans R Soc B 362:773",
    "Addis, Wong & Schacter (2007) Neuropsychologia 45:1363",
    "Szpunar, Watson & McDermott (2007) PNAS 104:642",
    "Benoit & Schacter (2015) Neuropsychologia 75:450",
    "Hassabis et al. (2007) PNAS 104:1726",
    "Pfeiffer & Foster (2013) Nature 497:74",
    "Dragoi & Tonegawa (2011) Nature 469:397",
    "Peters & Büchel (2010) Neuron 66:138",
    "Benoit, Gilbert & Burgess (2011) J Neurosci 31:6771",
    "Spreng et al. (2010) NeuroImage 53:303",
    "Saalmann & Kastner (2011) Neuron 71:209",
    "Menon & Uddin (2010) Brain Struct Funct 214:655",
    "Seeley et al. (2007) J Neurosci 27:2349",
    "Fox et al. (2005) PNAS 102:9673",
    "Corbetta & Shulman (2002) Nat Rev Neurosci 3:201",
    "Aston-Jones & Cohen (2005) Annu Rev Neurosci 28:403",
    "Jensen & Mazaheri (2010) Front Hum Neurosci 4:186",
    "Fries (2005) Trends Cogn Sci 9:474",
    "Killingsworth & Gilbert (2010) Science 330:932",
    "Hasenkamp et al. (2012) NeuroImage 59:750",
    "Brewer et al. (2011) PNAS 108:20254",
]


# ---------------------------------------------------------------- 小工具
def clamp(x, a=0.0, b=1.0):
    return min(max(x, a), b)


def ramp(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else float(t >= a)


def sm(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def eo(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def win(t, a, b, fi=0.35, fo=0.35):
    return sm(ramp(t, a, a + fi)) * (1 - sm(ramp(t, b - fo, b)))


def lerp(a, b, k):
    return a + (b - a) * k


def env(evs, t, tau, attack=0.0):
    return decay_env(t, evs, tau, attack)


def beats_between(t, a, b, step=TL.BEAT):
    """从 a 开始每 step 一个拍点，截至 min(t, b) 已经发生的拍点数。"""
    if t < a:
        return 0
    return int((min(t, b) - a + 1e-6) / step) + 1


def slam(t, t0, dur=0.28, s0=1.32):
    """重击时文字从放大到原尺寸"砸"进画面。"""
    k = eo(ramp(t, t0, t0 + dur))
    return lerp(s0, 1.0, k), clamp((t - t0) / 0.06)


def bez(p0, p1, p2, u):
    u = np.asarray(u, np.float32)[:, None]
    return (1 - u) ** 2 * p0 + 2 * (1 - u) * u * p1 + u ** 2 * p2


def outward(mid, amount):
    n = np.linalg.norm(mid)
    return mid + (mid / n if n > 1e-3 else np.array([0, 0, 1], np.float32)) * amount


# ---------------------------------------------------------------- 粒子构件
def stream(src, dst, t, t0, travel=0.8, n=220, bulge=30.0, b=1.0, seed=0, mode="flow",
           tail=0.4, speed=0.9, width=1.6, color=None, t1=None):
    """src→dst 的贝塞尔光流。mode=flow：持续流动；comet：只有一颗带尾巴的彗星。"""
    if t < t0 or b <= 0.002 or (t1 is not None and t > t1 + 0.6):
        return None
    rng = np.random.default_rng(seed)
    src, dst = np.asarray(src, np.float32), np.asarray(dst, np.float32)
    mid = outward((src + dst) / 2, bulge)
    head = clamp((t - t0) / travel)
    jit = rng.normal(0, width, (n, 3)).astype(np.float32)
    k = rng.uniform(0, 1, n).astype(np.float32)
    if mode == "comet":
        u = head - k * tail
        bright = (1 - k) ** 2 * (u > 0)
        u = np.clip(u, 0, 1)
        if head >= 1:
            fade = clamp(1 - (t - t0 - travel) / 0.35)
            bright = bright * fade
    else:
        u = (k + (t - t0) * speed) % 1.0
        bright = (u <= head) * (0.35 + 0.65 * np.exp(-((u - head) / 0.08) ** 2))
    if t1 is not None:
        bright = bright * clamp(1 - (t - t1) / 0.6)
    P = bez(src, mid, dst, u) + jit * (0.4 + 0.6 * np.sin(np.pi * u))[:, None]
    col = HOT if color is None else color
    return P, np.outer(bright * b, col).astype(np.float32), 1.25


def graph(nodes, edges, node_b, edge_b, t, seed=1, pulse=0.0, node_r=2.6, per_edge=26, edge_gain=1.0):
    """节点-连线结构（记忆印迹、未来晶体、网络连线）。返回点集与光晕。"""
    rng = np.random.default_rng(seed)
    pts, cols, glows = [], [], []
    node_b = np.broadcast_to(np.asarray(node_b, np.float32), (len(nodes),))
    for i, p in enumerate(nodes):
        if node_b[i] < 0.01:
            continue
        q = rng.normal(0, node_r, (30, 3)).astype(np.float32) + p
        pts.append(q)
        cols.append(np.outer(np.full(30, node_b[i] * 0.9), HOT))
        glows.append((tuple(p), 9.0, HOT * node_b[i] * 0.22))
        glows.append((tuple(p), 2.4, WHITE * node_b[i] * 0.28))
    edge_b = np.broadcast_to(np.asarray(edge_b, np.float32), (len(edges),))
    for e, (i, j) in enumerate(edges):
        if edge_b[e] < 0.01:
            continue
        u = np.linspace(0, 1, per_edge, dtype=np.float32)
        q = nodes[i][None] * (1 - u[:, None]) + nodes[j][None] * u[:, None]
        q = q + rng.normal(0, 0.5, q.shape).astype(np.float32)
        travel = (t * 0.9 + e * 0.37) % 1.0
        br = (0.45 + pulse * np.exp(-((u - travel) / 0.12) ** 2)) * edge_gain
        pts.append(q)
        cols.append(np.outer(br * edge_b[e], C[30]))
    if not pts:
        return None, []
    return (np.concatenate(pts), np.concatenate(cols).astype(np.float32), 1.2), glows


def knn_edges(nodes, k=3):
    d = np.linalg.norm(nodes[:, None] - nodes[None], axis=-1)
    es = set()
    for i in range(len(nodes)):
        for j in np.argsort(d[i])[1:k + 1]:
            es.add((min(i, j), max(i, j)))
    return sorted(es)


def _engram(seed, n=14, r=24.0):
    rng = np.random.default_rng(seed)
    i = np.arange(n) + 0.5
    phi = np.arccos(1 - 2 * i / n)
    th = np.pi * (1 + 5 ** 0.5) * i
    p = np.stack([np.cos(th) * np.sin(phi), np.sin(th) * np.sin(phi), np.cos(phi)], -1) * r
    return (p + rng.normal(0, 5, p.shape)).astype(np.float32)


ENG_A = _engram(11)
ENG_B = ENG_A + np.random.default_rng(12).normal(0, 7, ENG_A.shape).astype(np.float32)
ENG_B[[3, 9]] = _engram(13)[[5, 11]] * 1.2       # 两个节点被"改写"
ENG_EDGES_A = knn_edges(ENG_A)
ENG_EDGES_B = knn_edges(ENG_B)
SHATTER = np.random.default_rng(14).normal(size=ENG_A.shape).astype(np.float32)
SHATTER /= np.linalg.norm(SHATTER, axis=1, keepdims=True)

_phi = (1 + 5 ** 0.5) / 2
ICO = np.array([[-1, _phi, 0], [1, _phi, 0], [-1, -_phi, 0], [1, -_phi, 0], [0, -1, _phi], [0, 1, _phi],
                [0, -1, -_phi], [0, 1, -_phi], [_phi, 0, -1], [_phi, 0, 1], [-_phi, 0, -1], [-_phi, 0, 1]],
               np.float32)
ICO = ICO / np.linalg.norm(ICO[0]) * 26
ICO_EDGES = [(i, j) for i in range(12) for j in range(i + 1, 12)
             if abs(np.linalg.norm(ICO[i] - ICO[j]) - np.linalg.norm(ICO[0] - ICO[1])) < 1.0]
TETRA = np.array([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], np.float32) * 6
TETRA_EDGES = [(0, 1), (0, 2), (0, 3), (1, 2), (1, 3), (2, 3)]

PATH_CTRL = [NP["HC_R"], np.array([42, 22, -26], np.float32), np.array([56, 66, -10], np.float32),
             np.array([46, 104, 22], np.float32), CRY_C]


def rotz(P, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([P[:, 0] * c - P[:, 1] * s, P[:, 0] * s + P[:, 1] * c, P[:, 2]], -1)


# ---------------------------------------------------------------- 相机关键帧
HCv = NP["HC_R"]
# (t, yaw, pitch, dist, look, roll, cx)；相邻两帧间隔 <0.05 s 视为硬切
CAM_KEYS = [
    (0.0, 70, 18, 1050, (0, 0, 0), 0, 960),
    (12.0, 70, 18, 1050, (0, 0, 0), 0, 960),
    (19.5, 8, 10, 860, (0, 0, 0), 0, 960),
    (24.0, -12, 8, 820, (0, 0, 0), 0, 940),
    (27.8, -18, 6, 640, tuple(HCv * 0.6), 0, 900),
    (28.0, -12, 8, 760, tuple(HCv * 0.3), 0, 900),
    (35.0, -6, 8, 760, tuple(HCv * 0.3), 0, 880),
    (37.0, 16, 12, 560, tuple(HCv * 0.85), 0, 860),
    (43.0, 22, 12, 540, tuple(HCv * 0.85), 0, 860),
    (45.0, -8, 10, 900, (0, -24, 12), 0, 900),
    (51.0, -2, 10, 900, (0, -24, 12), 0, 900),
    (53.0, 28, 36, 900, (0, 0, 0), 0, 880),
    (59.0, 34, 38, 900, (0, 0, 0), 0, 880),
    (61.0, -8, 14, 860, (0, -36, 18), 0, 900),
    (67.8, -14, 12, 840, (0, -30, 15), 0, 900),
    (68.0, -6, 10, 920, (0, 22, 10), 0, 940),
    (75.5, 8, 10, 920, (0, 30, 10), 0, 940),
    (77.5, -22, 30, 880, (0, 0, 0), 0, 880),
    (83.5, -26, 30, 880, (0, 0, 0), 0, 880),
    (85.5, 0, 12, 960, (0, 34, 6), 0, 900),
    (91.5, 6, 12, 960, (0, 34, 6), 0, 900),
    (93.5, 38, 14, 800, (0, 18, 0), 0, 860),
    (99.5, 44, 16, 800, (0, 18, 0), 0, 860),
    (100.5, 10, 8, 860, (0, 24, 6), 0, 940),
    (107.5, 4, 6, 560, (0, 12, 0), 4, 960),
    (108.0, 0, 8, 880, (0, 0, 0), 0, 900),
    (115.5, 6, 8, 820, (0, 10, 0), 0, 880),
    (117.5, -26, 20, 820, (0, 0, 0), 0, 860),
    (123.9, -30, 20, 760, (0, 0, 0), 0, 860),
    (124.0, 20, 24, 820, (0, 0, 10), 0, 820),
    (131.9, 26, 26, 820, (0, 0, 10), 0, 820),
    (132.0, 0, 10, 780, (0, -10, 0), 0, 840),
    (139.5, 6, 10, 760, (0, -10, 0), 0, 840),
    (143.9, -16, 18, 860, (0, 0, 0), -5, 860),
    (144.0, 0, 10, 760, (0, 0, 0), 0, 840),
    (147.5, 8, 12, 760, (0, 0, 0), 0, 860),
    (151.9, 46, 20, 700, (0, 0, 0), 0, 900),
    (152.0, -30, 14, 980, (0, 0, 8), 0, 960),
    (166.0, 26, 16, 900, (0, 0, 8), 0, 960),
    (168.0, 34, 16, 820, (0, 0, 8), 0, 960),
    (172.0, 58, 20, 960, (0, 0, 8), 0, 960),
    (172.05, -20, 16, 1500, (0, 0, 0), 0, 1380),
    (184.0, 50, 16, 1500, (0, 0, 0), 0, 1380),
]


def camera(t):
    keys = CAM_KEYS
    for i in range(len(keys) - 1):
        a, b = keys[i], keys[i + 1]
        if a[0] <= t < b[0]:
            k = 1.0 if b[0] - a[0] < 0.06 else sm((t - a[0]) / (b[0] - a[0]))
            break
    else:
        a = b = keys[-1]
        k = 0.0
    yaw = lerp(a[1], b[1], k) + 2.0 * np.sin(t * 0.13)
    pitch = lerp(a[2], b[2], k) + 1.2 * np.sin(t * 0.09 + 1)
    dist = lerp(a[3], b[3], k)
    look = np.array(a[4], np.float32) * (1 - k) + np.array(b[4], np.float32) * k
    return dict(yaw=yaw, pitch=pitch, dist=dist, look=look, roll=lerp(a[5], b[5], k),
                cx=lerp(a[6], b[6], k), cy=505.0, focal=4000.0)


# ---------------------------------------------------------------- 尘埃水平漂移（预积分）
def _dust_velocity(t):
    if t < 28:
        return 6.0
    if t < 66:
        return -70.0
    if t < 68:
        return lerp(-70, -900, sm(ramp(t, 66, 67.2)))
    if t < 100:
        return 95.0
    if t < 107.5:
        return lerp(95, 1300, sm(ramp(t, 100, 106)))
    if t < 140:
        return 2.0
    if t < 144:
        return 25.0
    if t < 152:
        return 4.0
    return 20.0


_DT = 1.0 / 240
_DUST_X = np.cumsum([_dust_velocity(i * _DT) * _DT for i in range(int(TL.DURATION / _DT) + 10)])


def dust_x(t):
    return float(_DUST_X[min(int(t / _DT), len(_DUST_X) - 1)])


# ---------------------------------------------------------------- 主函数
def state(t):
    fr = int(round(t * TL.FPS))
    S = dict(t=t, frame=fr, acts=np.zeros(len(G.NODE_NAMES), np.float32), points=[], glows=[], hud=[],
             brain=dict(alpha=1.0, gain=1.0, morph=1.0, waves=[], sparkle=0.0015, scale=1.0),
             dust=dict(alpha=0.85, x=dust_x(t), streak=abs(_dust_velocity(t)) * 0.05),
             fx=dict(bloom=1.0, exposure=1.0, rays=0.0, anamorphic=0.3, grain=0.004, flash=0.0,
                     shake=(0.0, 0.0), letterbox=0, shock=[], dof=0.0, focus_z=820.0, fade=1.0),
             cam=camera(t), edges=[], hud_cursor=0.0, hud_alpha=1.0, chapter="")
    global_music(S, t)
    for fn in (intro, assemble, past, future, present, finale, credits):
        fn(S, t)
    finish(S, t)
    return S


def global_music(S, t):
    b, fx = S["brain"], S["fx"]
    kick = env(E.kick, t, 0.12)
    snare = env(E.snare, t, 0.10)
    taiko = env(E.taiko, t, 0.18)
    b["gain"] += 0.22 * kick + 0.12 * snare + 0.18 * taiko
    b["scale"] += 0.008 * kick + 0.006 * taiko
    b["sparkle"] += 0.006 * snare
    # 重击：闪白 + 冲击波 + 震动
    for th, size in E.hit:
        dt = t - th
        if -0.001 <= dt < 2.0:
            fx["flash"] += (0.95 if size == 2 else 0.65) * np.exp(-dt / 0.11)
            amp = (12.0 if size == 2 else 7.0) * np.exp(-dt / 0.16)
            fx["shake"] = (fx["shake"][0] + amp * np.sin(dt * 91), fx["shake"][1] + amp * np.cos(dt * 77))
            fx["shock"].append((S["cam"]["cx"], 505.0, 60 + 1500 * eo(dt / 1.4), 18 + 30 * dt,
                                0.6 * np.exp(-dt / 0.4)))
            b["gain"] += 1.4 * np.exp(-dt / 0.25)
            b["scale"] += 0.03 * np.exp(-dt / 0.3)
            b["sparkle"] += 0.05 * np.exp(-dt / 0.3)
    for tc, v in E.crash:
        dt = t - tc
        if 0 <= dt < 1.5:
            fx["flash"] += 0.25 * np.exp(-dt / 0.08)
            b["gain"] += 0.5 * np.exp(-dt / 0.3)
    # 上升音：亮度与光线逐渐增强
    for r0, r1 in E.riser:
        if r0 <= t < r1:
            k = ramp(t, r0, r1) ** 2
            fx["rays"] += 0.9 * k
            b["sparkle"] += 0.02 * k
            fx["bloom"] += 0.4 * k
    for g0, g1 in E.gaps:                            # 重击前的"留白"：一瞬间压暗
        if g0 <= t < g1:
            fx["fade"] = 0.45
    S["kick"], S["snare"] = kick, snare


# ---------------------------------------------------------------- 00 冷开场
def intro(S, t):
    if t >= 19:
        return
    b, fx, d = S["brain"], S["fx"], S["dust"]
    heart = env(E.heart, t, 0.16)
    if t < 12:
        b["alpha"] = 0.0
        fx["letterbox"] = 130
        S["hud_alpha"] = 0.0
        d["alpha"] = 0.35 + 0.5 * ramp(t, 0, 4)
        k = sm(ramp(t, 6, 11.95)) ** 1.6
        d["vortex"] = 1 - 0.92 * k
        d["spin"] = 3.5 * k ** 1.5
        # 中心火花：一个神经元，随心跳搏动
        rise = ramp(t, 3, 12) ** 2
        S["glows"].append(((0.0, 0.0, 0.0), 14 + 14 * heart + 26 * rise, HOT * (0.25 + 0.45 * heart + 0.7 * rise)))
        rng = np.random.default_rng(3)
        P = rng.normal(0, 2.5 + 3 * heart, (220, 3)).astype(np.float32)
        S["points"].append((P, np.outer(np.full(220, 0.6 + heart + 2 * rise), HOT), 1.1))
        for th, v in E.heart:
            dt = t - th
            if 0 <= dt < 1.2 and th < 12:
                fx["shock"].append((S["cam"]["cx"], 505.0, 30 + 260 * eo(dt / 1.2), 10, 0.18 * v * (1 - dt / 1.2)))
        fx["rays"] += 0.15 + 1.1 * rise
        fx["ray_center"] = (0.0, 0.0, 0.0)
        lines = [(1.0, 4.8, "闭上眼，你可以回到童年的那个夏天"),
                 (5.0, 8.8, "也可以提前站上明天的舞台"),
                 (9.0, 11.85, "而这一切，都发生在此刻的大脑里")]
        for a0, a1, txt in lines:
            al = win(t, a0, a1, 0.5, 0.4)
            S["hud"].append(hud.bigtext(txt, W / 2, H - 230, al, 40, 300, C[20], glow=0.5))
        S["hud"].append(hud.frame_hud(t, ramp(t, 4, 6) * 0.9, 0.0, "", env(E.tick, t, 0.08), heart))
        S["hud_alpha"] = 0.0
    else:
        # 片名重击：粒子从中心炸开
        d["vortex"] = lerp(0.08, 1.7, eo(ramp(t, 12, 14))) if t < 14 else lerp(1.7, 1.0, sm(ramp(t, 14, 18)))
        d["spin"] = 3.5 * (1 - sm(ramp(t, 12, 16)))
        fx["letterbox"] = int(130 * (1 - sm(ramp(t, 14, 16.5))))
        sc, al = slam(t, 12.0, 0.32, 1.4)
        al *= 1 - sm(ramp(t, 16.6, 17.6))
        S["hud"].append(hud.title("时间之脑", "THE TEMPORAL BRAIN", "回忆过去 · 想象未来 · 专注当下", al, sc,
                                  y=H / 2 - 20, sub_alpha=al * ramp(t, 12.6, 13.2)))
        fx["rays"] += 1.4 * np.exp(-(t - 12) / 1.2)
        fx["ray_center"] = (0.0, 0.0, 0.0)


# ---------------------------------------------------------------- 片名后：聚成大脑
def assemble(S, t):
    if not 12 <= t < 28.2:
        return
    b, fx = S["brain"], S["fx"]
    S["hud_alpha"] = ramp(t, 17, 19)
    if t < 19.6:
        boom = eo(ramp(t, 12, 13.8))
        b["boom"] = boom
        b["morph"] = sm(ramp(t, 13.6, 19.5)) * 0.999
        b["swirl"] = 1.4 * (1 - b["morph"]) + 0.6 * boom
        b["gain"] += 1.6 * np.exp(-(t - 12) / 0.9)
    # 太鼓：每一击都有一道从前往后扫过的光波
    for th, v in E.taiko:
        dt = t - th
        if 0 <= dt < 1.0 and th < 25:
            b["waves"].append(("plane", None, 95 - 280 * dt, 9.0, 0.9 * v * (1 - dt)))
    S["hud"].append(hud.caption("人脑约有 860 亿个神经元，每一个都在放电、沉默、再放电",
                                "Azevedo et al., 2009 · Journal of Comparative Neurology",
                                win(t, 18.3, 21.8, 0.35, 0.35), 1 - eo(ramp(t, 18.3, 18.8))))
    # 三种时间模式：落在 22、23、24 秒的鼓点上
    words = [(22.0, "回忆过去", 600, ["HC_R", "HC_L"]), (23.0, "想象未来", 1320, ["vmPFC", "mPFC"]),
             (24.0, "专注当下", 960, ["FEF_R", "IPS_R", "FEF_L", "IPS_L"])]
    for t0, txt, x, nodes in words:
        if t >= t0:
            sc, al = slam(t, t0, 0.22, 1.5)
            al *= 1 - sm(ramp(t, 27.2, 27.75))
            S["hud"].append(hud.bigtext(txt, x, 905, al, 60, 800, scale=sc, tracking=0.1))
            for n in nodes:
                S["acts"][NI[n]] += 1.6 * np.exp(-(t - t0) / 0.5) + 0.25 * al
    if t >= 24:
        k = ramp(t, 24, 27.85)
        b["sparkle"] += 0.03 * k ** 2
        b["gain"] += 0.4 * k
        fx["ray_center"] = tuple(NP["HC_R"])


# ---------------------------------------------------------------- 01 回忆过去
def past(S, t):
    if not 27.9 <= t < 68.3:
        return
    b, fx, acts = S["brain"], S["fx"], S["acts"]
    S["chapter"] = hud.CHAPTER["past"] if t >= 28 else ""
    S["hud_cursor"] = -0.75 * sm(ramp(t, 28, 30))
    fx["grain"] = 0.006
    sc, al = slam(t, 28.0)
    al *= 1 - sm(ramp(t, 31.0, 31.6))
    S["hud"].append(hud.card("01", "回忆过去", "REMEMBERING THE PAST", al, sc, ramp(t, 28.3, 29.4) if t < 29.4 else -1))

    # 线索 → 视觉皮层 → 海马
    if 30 <= t < 33:
        st = stream(NP["V1_R"] + np.array([0, -150, 60], np.float32), NP["V1_R"], t, 30.0, 0.5, 160,
                    bulge=10, b=2.2, seed=21, mode="comet", tail=0.5)
        st2 = stream(NP["V1_R"], NP["HC_R"], t, 30.5, 1.4, 160, bulge=18, b=2.0, seed=22, mode="comet", tail=0.45)
        for s in (st, st2):
            if s:
                S["points"].append(s)
        acts[NI["V1_R"]] += 1.4 * env([(30.5, 1)], t, 0.5)
    # 模式补全面板：4/12 → 12/12，每拍点亮一个
    lit = 4 + beats_between(t, 32.5, 36.0) if t >= 32 else 0
    pevs = [(32.0 + 0.5 * i, 1.0) for i in range(9)]
    pf = env(pevs, t, 0.12)
    S["hud"].append(hud.panel_completion(lit, win(t, 31.6, 37.2, 0.4, 0.4), pf))
    if 31.5 <= t < 44:
        acts[NI["HC_R"]] += (0.55 + 0.5 * pf) * ramp(t, 31.5, 32) + 1.4 * env([(36.0, 1)], t, 0.4)
        acts[NI["HC_L"]] += 0.35 * ramp(t, 32, 33)
    S["hud"].append(hud.callout(NP["HC_R"], "海马", "HIPPOCAMPUS", win(t, 31.8, 43.5), ramp(t, 31.8, 32.6)))
    S["hud"].append(hud.caption("线索 → 海马 CA3“模式补全”：一点碎片，唤起整段记忆",
                                "Marr, 1971 · Horner et al., 2015, Nature Communications",
                                win(t, 32.2, 35.8), 1 - eo(ramp(t, 32.2, 32.7))))

    # 尖波涟漪 SWR（落在军鼓上）
    if 35.8 <= t < 44.2:
        for te, v in E.ripple:
            dt = t - te
            if 0 <= dt < 0.6:
                acts[NI["HC_R"]] += 1.7 * v * np.exp(-dt / 0.09)
                x, y, _ = _proj(S, NP["HC_R"])
                fx["shock"].append((x, y, 20 + 330 * eo(dt / 0.6), 6, 0.55 * v * (1 - dt / 0.6)))
                rng = np.random.default_rng(int(te * 100))
                dirs = rng.normal(size=(160, 3)).astype(np.float32)
                dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
                P = NP["HC_R"] + dirs * (4 + 26 * eo(dt / 0.5))
                S["points"].append((P, np.outer(np.full(160, 1.4 * v * (1 - dt / 0.6)), HOT), 1.1))
        S["hud"].append(hud.panel_wave("swr", t, win(t, 36.3, 43.7), dict(events=E.ripple)))
    S["hud"].append(hud.caption("尖波涟漪（SWR）：回忆浮现前 1–2 秒，海马的涟漪放电率先升高",
                                "Norman et al., 2019 · Science（人脑颅内记录）",
                                win(t, 36.4, 43.6), 1 - eo(ramp(t, 36.4, 36.9))))

    # 皮层复现：海马 → 感觉皮层；记忆印迹逐渐成形
    eng_b = np.zeros(len(ENG_A), np.float32)
    if 43.8 <= t < 60.5:
        tgt = [(44.5, "V1_R"), (45.5, "A1_R"), (46.5, "AMY_R"), (47.5, "LTC_R")]
        for i, (t0, n) in enumerate(tgt):
            s = stream(NP["HC_R"], NP[n], t, t0, 0.5, 200, bulge=24, b=1.1, seed=30 + i, t1=59.5)
            if s:
                S["points"].append(s)
            acts[NI[n]] += (0.65 + 0.9 * np.exp(-(t - t0 - 0.5) / 0.35)) * ramp(t, t0 + 0.4, t0 + 0.55) \
                * (1 - sm(ramp(t, 58.5, 60)))
        s = stream(NP["HC_R"], ENG_C, t, 44.0, 0.9, 260, bulge=40, b=0.9, seed=40, t1=59.5)
        if s:
            S["points"].append(s)
        acts[NI["HC_R"]] += 0.7
        eng_b = np.array([ramp(t, 45.0 + 0.5 * i, 45.25 + 0.5 * i) for i in range(len(ENG_A))], np.float32)
    S["hud"].append(hud.callout(NP["V1_R"], "视觉皮层", "VISUAL CORTEX", win(t, 45.0, 51.6), ramp(t, 45.0, 45.8), side=-1))
    S["hud"].append(hud.callout(NP["A1_R"], "听觉皮层", "AUDITORY CORTEX", win(t, 46.0, 51.6), ramp(t, 46.0, 46.8), side=1, dy=-110))
    S["hud"].append(hud.callout(NP["AMY_R"], "杏仁核 · 情绪", "AMYGDALA", win(t, 47.0, 51.6), ramp(t, 47.0, 47.8), side=1, dy=80))
    S["hud"].append(hud.caption("皮层复现：回忆时，编码那一刻的感觉皮层被重新点亮",
                                "Wheeler, Petersen & Buckner, 2000 · PNAS；Danker & Anderson, 2010",
                                win(t, 44.3, 51.7), 1 - eo(ramp(t, 44.3, 44.8))))

    # 默认模式网络：每拍点亮一个节点
    if 51.8 <= t < 60.2:
        order = ["mPFC", "PCC", "AG_L", "AG_R", "LTC_L", "LTC_R", "HC_L", "HC_R", "vmPFC"]
        on = {}
        for i, n in enumerate(order):
            t0 = 52.0 + 0.5 * i
            k = ramp(t, t0, t0 + 0.12) * (1 - sm(ramp(t, 59.2, 60.2)))
            on[n] = k
            acts[NI[n]] += (0.7 + 1.2 * np.exp(-max(t - t0, 0) / 0.3)) * k + 0.5 * S["kick"] * k
        for a, c in DMN_EDGES:
            S["edges"].append((a, c, min(on.get(a, 0), on.get(c, 0)), 1.0 + 1.5 * S["kick"]))
    for n, cn, en, t0, sd in (("mPFC", "内侧前额叶", "mPFC", 52.0, 1), ("PCC", "后扣带 / 楔前叶", "PCC / PRECUNEUS", 52.5, -1),
                              ("AG_R", "角回", "ANGULAR GYRUS", 53.5, -1)):
        S["hud"].append(hud.callout(NP[n], cn, en, win(t, t0, 59.4), ramp(t, t0, t0 + 0.8), side=sd,
                                    dy=80 if n == "AG_R" else -70))
    S["hud"].append(hud.caption("默认模式网络（DMN）：把散落的细节，编织成“我”的故事",
                                "mPFC · PCC/楔前叶 · 角回 · 外侧颞叶 · 内侧颞叶 —— Raichle et al., 2001；Andrews-Hanna et al., 2010",
                                win(t, 52.3, 59.6), 1 - eo(ramp(t, 52.3, 52.8))))

    # 记忆印迹：成形 → 再巩固（60 s 打散，64 s 重组）
    if 44.9 <= t < 68.3:
        rot = t * 0.25
        if t < 60:
            nodes = ENG_A
            nb = eng_b if t < 52 else np.ones(len(ENG_A), np.float32)
            nb = nb * (0.8 + 0.6 * S["kick"])
            eb = np.array([min(nb[i], nb[j]) for i, j in ENG_EDGES_A]) * 0.9
            edges = ENG_EDGES_A
            pulse = 1.2
        elif t < 64:
            k = eo(ramp(t, 60, 60.7))
            flick = 0.55 + 0.45 * np.sin(t * 37 + np.arange(len(ENG_A)) * 1.7)
            nodes = ENG_A + SHATTER * (44 * k) + SHATTER * 4 * np.sin(t * 9)
            nb = flick * (1.3 - 0.4 * k)
            eb = np.full(len(ENG_EDGES_A), max(0, 1 - k * 3))
            edges = ENG_EDGES_A
            pulse = 0.0
        else:
            k = eo(ramp(t, 64, 64.5))
            nodes = (ENG_A + SHATTER * 44) * (1 - k) + ENG_B * k
            nb = np.ones(len(ENG_A), np.float32) * (0.9 + 1.2 * np.exp(-(t - 64) / 0.4))
            eb = np.full(len(ENG_EDGES_B), k)
            edges = ENG_EDGES_B
            pulse = 1.2
        if t >= 66:                                   # 倒带：印迹被拉回"过去"
            k2 = sm(ramp(t, 66, 67.8))
            nodes = nodes + np.array([0, -260, 0], np.float32) * k2 ** 2
            nb = nb * (1 - k2)
            eb = eb * (1 - k2)
        P = rotz(nodes, rot) + ENG_C
        g, gl = graph(P, edges, nb, eb, t, seed=5, pulse=pulse)
        if g:
            S["points"].append(g)
            S["glows"] += gl
        lab_a = win(t, 46.0, 66.0, 0.5, 0.4)
        S["hud"].append(_label3(ENG_C + np.array([0, 0, 40], np.float32), "记忆印迹", "ENGRAM", lab_a))
        if 60.15 <= t < 63.9 and int(t * 8) % 2 == 0:
            S["hud"].append(_label3(ENG_C - np.array([0, 0, 46], np.float32), "不稳定", "LABILE", 1.0))
        if 64.1 <= t < 66.0:
            S["hud"].append(_label3(ENG_C - np.array([0, 0, 46], np.float32), "已重写", "RESTORED · CHANGED",
                                    win(t, 64.1, 66.0, 0.15, 0.3)))
    S["hud"].append(hud.caption("再巩固：被提取的记忆会暂时变得不稳定，随后被“重写”保存",
                                "Nader, Schafe & LeDoux, 2000 · Nature",
                                win(t, 60.3, 63.8), 1 - eo(ramp(t, 60.3, 60.8))))
    S["hud"].append(hud.caption("记忆不是录像，而是每一次的重建",
                                "Bartlett, 1932；Schacter & Addis, 2007",
                                win(t, 64.2, 65.9), 1 - eo(ramp(t, 64.2, 64.7))))
    al = win(t, 66.0, 67.85, 0.3, 0.2)
    S["hud"].append(hud.bigtext("过去，是未来的原材料", W / 2, H - 205, al, 58, 700, tracking=0.08))
    if t >= 66:
        b["streak"] = -90 * sm(ramp(t, 66, 67.8))
        fx["anamorphic"] += 0.4 * ramp(t, 66, 67.8)


# ---------------------------------------------------------------- 02 想象未来
def future(S, t):
    if not 67.9 <= t < 108.2:
        return
    b, fx, acts = S["brain"], S["fx"], S["acts"]
    S["chapter"] = hud.CHAPTER["future"] if t >= 68 else hud.CHAPTER["past"]
    S["hud_cursor"] = lerp(-0.75, 0.75, sm(ramp(t, 68, 70.2))) if t >= 68 else -0.75
    sc, al = slam(t, 68.0)
    al *= 1 - sm(ramp(t, 71.0, 71.6))
    S["hud"].append(hud.card("02", "想象未来", "IMAGINING THE FUTURE", al, sc, ramp(t, 68.3, 69.4) if t < 69.4 else -1))

    # 建构性情景模拟：三块碎片 → 海马 → 新的未来情景
    frags = [(70.0, "PCC"), (70.5, "LTC_R"), (71.0, "V1_R")]
    if 69.9 <= t < 73.0:
        for i, (t0, n) in enumerate(frags):
            if t < t0:
                continue
            k = sm(ramp(t, t0, 72.0))
            src = NP[n] + (NP[n] / np.linalg.norm(NP[n])) * 26
            mid = outward((src + NP["HC_R"]) / 2, 70)
            c = bez(src, mid, NP["HC_R"], [k])[0]
            nodes = rotz(TETRA, t * 3 + i) * (1 - 0.6 * k) + c
            g, gl = graph(nodes, TETRA_EDGES, 1.2, 1.0, t, seed=60 + i, pulse=1.0, per_edge=14)
            if g and k < 0.999:
                S["points"].append(g)
                S["glows"] += gl
            acts[NI[n]] += 1.3 * np.exp(-max(t - t0, 0) / 0.4)
        acts[NI["HC_R"]] += 0.5 + 2.2 * env([(72.0, 1)], t, 0.35)
    if 72.0 <= t < 74.0:
        s = stream(NP["HC_R"], CRY_C, t, 72.0, 1.0, 200, bulge=40, b=2.0, seed=70, mode="comet", tail=0.5)
        if s:
            S["points"].append(s)
    crystal_on = 0.0
    if 73.0 <= t < 108.2:
        vt = np.array([ramp(t, 73.0 + 0.2 * i, 73.15 + 0.2 * i) for i in range(12)], np.float32)
        crystal_on = 1.0
        nodes = rotz(ICO, t * 0.4)
        nodes = np.stack([nodes[:, 0], nodes[:, 1] * np.cos(0.5) - nodes[:, 2] * np.sin(0.5),
                          nodes[:, 1] * np.sin(0.5) + nodes[:, 2] * np.cos(0.5)], -1)
        nb = vt * (0.85 + 0.7 * S["kick"] + 1.5 * env([(76.0, 1)], t, 0.3))
        eb = np.array([min(vt[i], vt[j]) for i, j in ICO_EDGES])
        if 80.0 <= t < 84.0:                          # 海马受损：未来情景碎裂
            rng = np.random.default_rng(int(t * 30))
            k = sm(ramp(t, 80.0, 80.6)) * (1 - sm(ramp(t, 83.6, 84.0)))
            nodes = nodes * (1 + 0.5 * k) + rng.normal(0, 7 * k, nodes.shape).astype(np.float32)
            eb = eb * (rng.uniform(0, 1, len(eb)) > 0.75 * k)
            nb = nb * (1 - 0.6 * k)
        if t >= 100:
            nb = nb * (1 + 1.5 * ramp(t, 100, 107.5))
        g, gl = graph(nodes + CRY_C, ICO_EDGES, nb, eb, t, seed=71, pulse=1.4, per_edge=44, edge_gain=0.8)
        if g:
            S["points"].append(g)
            S["glows"] += gl
        S["glows"].append((tuple(CRY_C), 38.0, C[40] * 0.07 * crystal_on * (1 + S["kick"])))
        S["hud"].append(_label3(CRY_C + np.array([0, 0, 44], np.float32), "未来情景", "SIMULATION",
                                win(t, 74.5, 99.5, 0.5, 0.5)))
    S["hud"].append(hud.caption("建构性情景模拟：把过去的碎片重新组合，预演从未发生的未来",
                                "Schacter & Addis, 2007 · Philosophical Transactions of the Royal Society B",
                                win(t, 70.3, 75.8), 1 - eo(ramp(t, 70.3, 70.8))))

    # 回忆与想象共享核心网络；海马受损也就难以想象
    if 75.8 <= t < 84.2:
        k = ramp(t, 76.0, 76.8) * (1 - sm(ramp(t, 83.5, 84.2)))
        for n in DMN:
            acts[NI[n]] += (0.75 + 0.5 * S["kick"]) * k
        for a, c in DMN_EDGES:
            S["edges"].append((a, c, k, 1.0 + 1.5 * S["kick"]))
        if 80.0 <= t < 84.0:
            dmg = sm(ramp(t, 80.0, 80.4)) * (1 - sm(ramp(t, 83.6, 84.0)))
            acts[NI["HC_R"]] -= 1.4 * dmg
            acts[NI["HC_L"]] -= 1.4 * dmg
    S["hud"].append(hud.venn(win(t, 76.4, 79.8), sm(ramp(t, 76.6, 78.6)), x=1580, y=700))
    S["hud"].append(hud.caption("回忆过去与想象未来，调用的是同一个核心网络",
                                "Addis, Wong & Schacter, 2007；Szpunar et al., 2007 · PNAS；Benoit & Schacter, 2015",
                                win(t, 76.3, 79.8), 1 - eo(ramp(t, 76.3, 76.8))))
    S["hud"].append(hud.xmark(NP["HC_R"], win(t, 80.2, 83.7, 0.2, 0.3)))
    S["hud"].append(hud.caption("海马受损的遗忘症患者，同样难以想象新的情景",
                                "Hassabis, Kumaran, Vann & Maguire, 2007 · PNAS",
                                win(t, 80.3, 83.8), 1 - eo(ramp(t, 80.3, 80.8))))

    # 海马"预演"：16 个位置细胞，跟着十六分音符琶音依次放电
    if 83.8 <= t < 108.2:
        u = np.linspace(0, 1, 16)
        cells = _path(u)
        k = ramp(t, 84.0, 84.6)
        nb = np.full(16, 0.22 * k, np.float32)
        for ta, i in E.arp:
            dt = t - ta
            if 0 <= dt < 0.6:
                nb[i] += 1.6 * np.exp(-dt / 0.13)
        if t >= 100:
            nb += 0.6 * ramp(t, 100, 106)
        trail = _path(np.linspace(0, 1, 220))
        S["points"].append((trail + np.random.default_rng(7).normal(0, 0.8, trail.shape).astype(np.float32),
                            np.outer(np.full(220, 0.25 * k), C[40]), 1.0))
        g, gl = graph(cells, [], nb, [], t, seed=80, node_r=1.8)
        if g:
            S["points"].append(g)
            S["glows"] += gl
        acts[NI["HC_R"]] += 0.6 * k + 0.6 * S["kick"] * k
    S["hud"].append(hud.caption("海马“预演”：位置细胞沿通往目标的路径依次放电，提前走一遍未来",
                                "Pfeiffer & Foster, 2013 · Nature；Dragoi & Tonegawa, 2011 · Nature",
                                win(t, 84.3, 91.7), 1 - eo(ramp(t, 84.3, 84.8))))
    S["hud"].append(_label3(_path([0.55])[0] + np.array([0, 0, -22], np.float32), "位置细胞序列", "PLACE-CELL SEQUENCE",
                            win(t, 85.0, 91.5)))

    # vmPFC 估值 → DMN 与额顶控制网络耦合
    if 91.8 <= t < 100.3:
        k = ramp(t, 92.0, 92.5) * (1 - sm(ramp(t, 99.6, 100.3)))
        acts[NI["vmPFC"]] += (0.7 + 1.0 * S["kick"]) * k
        acts[NI["HC_R"]] += 0.5 * k
        for i in range(8):
            t0 = 92.5 + i
            s = stream(NP["HC_R"] if i % 2 == 0 else NP["vmPFC"], NP["vmPFC"] if i % 2 == 0 else NP["HC_R"],
                       t, t0, 0.5, 140, bulge=-12, b=1.4 * k, seed=90 + i, mode="comet", tail=0.6)
            if s:
                S["points"].append(s)
        if t >= 96:
            k2 = ramp(t, 96.0, 96.6) * (1 - sm(ramp(t, 99.6, 100.3)))
            for n in ("dlPFC_R", "aIPL_R", "PCC", "mPFC"):
                acts[NI[n]] += (0.8 + 0.6 * S["snare"]) * k2
            for a, c in (("PCC", "dlPFC_R"), ("mPFC", "dlPFC_R"), ("aIPL_R", "AG_R"), ("HC_R", "dlPFC_R"),
                         ("dlPFC_R", "aIPL_R"), ("vmPFC", "dlPFC_R")):
                S["edges"].append((a, c, k2, 1.2 + 2.0 * S["snare"]))
            acts[NI["AG_R"]] += 0.6 * k2
    steps = beats_between(t, 92.5, 96.0)
    S["hud"].append(hud.meter(min(0.12 * steps, 0.9), win(t, 92.4, 95.8), "未来奖励的主观价值", "VALUE · vmPFC"))
    S["hud"].append(hud.callout(NP["vmPFC"], "腹内侧前额叶", "vmPFC", win(t, 92.2, 95.8), ramp(t, 92.2, 93.0), side=1, dy=90))
    S["hud"].append(hud.caption("腹内侧前额叶为未来估值：越生动地想象未来，越愿意为它等待",
                                "Peters & Büchel, 2010 · Neuron；Benoit, Gilbert & Burgess, 2011 · J Neurosci",
                                win(t, 92.3, 95.8), 1 - eo(ramp(t, 92.3, 92.8))))
    S["hud"].append(hud.callout(NP["dlPFC_R"], "背外侧前额叶", "dlPFC · FPCN", win(t, 96.2, 99.7), ramp(t, 96.2, 97.0), side=1))
    S["hud"].append(hud.caption("目标导向规划：默认网络与额顶控制网络耦合，把想象变成计划",
                                "Spreng et al., 2010 · NeuroImage",
                                win(t, 96.3, 99.8), 1 - eo(ramp(t, 96.3, 96.8))))

    # 加速冲向未来 → 107.5 s 磁带停转，一切冻结
    if t >= 100:
        k = ramp(t, 100, 107.5)
        b["streak"] = 70 * k ** 1.5
        S["dust"]["alpha"] = 0.85 + 2.2 * k
        b["sparkle"] += 0.04 * k
        fx["rays"] += 1.2 * k
        fx["ray_center"] = tuple(CRY_C)
        fx["anamorphic"] += 0.5 * k
        for n in DMN:
            acts[NI[n]] += 0.4 * k
        S["hud"].append(hud.bigtext("未来，从想象开始", W / 2, H - 205, win(t, 100.2, 104.0, 0.3, 0.4), 62, 800,
                                    tracking=0.1))
        if t >= 107.5:
            stop = sm(ramp(t, 107.5, 108.0))
            fx["fade"] = min(fx["fade"], 1 - 0.85 * stop)
            b["streak"] *= 1 - stop
            S["dust"]["streak"] *= 1 - stop


# ---------------------------------------------------------------- 03 专注当下
def present(S, t):
    if not 107.95 <= t < 152.3:
        return
    b, fx, acts, d = S["brain"], S["fx"], S["acts"], S["dust"]
    S["chapter"] = hud.CHAPTER["present"]
    S["hud_cursor"] = lerp(0.75, 0.0, sm(ramp(t, 108, 109.2)))
    heart = env(E.heart, t, 0.15)
    if t < 116:
        b["alpha"] = lerp(0.15, 1.0, sm(ramp(t, 108.0, 110.5)))
        d["alpha"] = 0.4
        b["gain"] += 0.35 * heart
    al = win(t, 108.3, 111.8, 0.7, 0.6)
    S["hud"].append(hud.card("03", "专注当下", "BEING PRESENT", al, 1.0, ramp(t, 109.0, 110.2) if t < 110.2 else -1))

    # 感官洪流 → 丘脑闸门 → 视觉皮层
    if 110.8 <= t < 116.5:
        k = ramp(t, 110.8, 111.6) * (1 - sm(ramp(t, 115.6, 116.5)))
        rng = np.random.default_rng(100)
        n = 700
        uu = (rng.uniform(0, 1, n) + (t - 110.8) * 0.9) % 1.0
        seg1 = np.where(uu < 0.5, uu * 2, 1.0)
        p1 = bez(EYE, CHIASM, NP["LGN_R"], np.clip(seg1, 0, 1))
        passed = rng.uniform(0, 1, n) < 0.3                 # 只有约三成被放行
        seg2 = np.clip((uu - 0.5) * 2, 0, 1)
        mid2 = np.array([40, -55, 2], np.float32)
        p2 = bez(NP["LGN_R"], mid2, NP["V1_R"], seg2)
        scat = rng.normal(size=(n, 3)).astype(np.float32)
        scat /= np.linalg.norm(scat, axis=1, keepdims=True)
        p3 = NP["LGN_R"] + scat * (seg2[:, None] * 40)
        P = np.where((uu < 0.5)[:, None], p1, np.where(passed[:, None], p2, p3))
        br = np.where(uu < 0.5, 0.9, np.where(passed, 1.1, 0.7 * (1 - seg2)))
        gate = 0.5 + 0.8 * heart
        S["points"].append((P + rng.normal(0, 1.4, P.shape).astype(np.float32),
                            np.outer(br * k * gate * 1.8, HOT).astype(np.float32), 1.3))
        eye = rng.normal(size=(260, 3)).astype(np.float32)
        eye = EYE + eye / np.linalg.norm(eye, axis=1, keepdims=True) * 12
        S["points"].append((eye, np.outer(np.full(260, 0.9 * k), C[30]), 1.1))
        S["glows"].append((tuple(EYE), 14.0, HOT * 0.25 * k * (1 + heart)))
        acts[NI["LGN_R"]] += (0.5 + 1.2 * heart) * k
        acts[NI["THAL_R"]] += (0.3 + 0.8 * heart) * k
        acts[NI["V1_R"]] += 0.7 * k
        fx["rays"] += 0.8 * k
        fx["ray_center"] = tuple(EYE)
    S["hud"].append(_label3(EYE + np.array([0, 0, -22], np.float32), "眼睛", "RETINA", win(t, 111.2, 115.8)))
    S["hud"].append(hud.callout(NP["LGN_R"], "丘脑 · 外侧膝状体", "THALAMUS / LGN", win(t, 111.5, 115.8), ramp(t, 111.5, 112.3), side=1, dy=110))
    S["hud"].append(hud.callout(NP["V1_R"], "视觉皮层", "VISUAL CORTEX", win(t, 112.3, 115.8), ramp(t, 112.3, 113.1), side=-1))
    S["hud"].append(hud.caption("此刻，感官洪流涌入：丘脑像一道闸门，只放行其中一部分",
                                "Saalmann & Kastner, 2011 · Neuron",
                                win(t, 111.3, 115.8), 1 - eo(ramp(t, 111.3, 111.8))))

    # 突显网络：开关
    if 115.8 <= t < 124.1:
        k = ramp(t, 116.0, 116.5)
        for n in DMN:
            acts[NI[n]] += lerp(0.8, 0.15, ramp(t, 117, 123.5)) * k
        for n in DAN:
            acts[NI[n]] += lerp(0.0, 0.7, ramp(t, 118, 123.8)) * k
        for n in SAL:
            acts[NI[n]] += (0.4 + 1.4 * S["kick"] + 0.8 * env(E.taiko, t, 0.15)) * k
        for a, c in SAL_EDGES:
            S["edges"].append((a, c, k, 1.0 + 2 * S["kick"]))
    S["hud"].append(hud.callout(NP["AI_R"], "前岛叶", "ANTERIOR INSULA", win(t, 116.3, 123.6), ramp(t, 116.3, 117.1), side=1, dy=100))
    S["hud"].append(hud.callout(NP["dACC"], "背侧前扣带", "dACC", win(t, 116.8, 123.6), ramp(t, 116.8, 117.6), side=-1))
    S["hud"].append(hud.caption("突显网络（前岛叶 + 背侧前扣带）：像一个开关，在“走神”与“专注”之间切换",
                                "Menon & Uddin, 2010；Seeley et al., 2007",
                                win(t, 116.3, 123.6), 1 - eo(ramp(t, 116.3, 116.8))))

    # 124 s 重击：跷跷板翻转
    dan_lvl, dmn_lvl = 0.0, 0.0
    if 124 <= t < 140:
        k = eo(ramp(t, 124.0, 124.3))
        dan_lvl, dmn_lvl = lerp(0.3, 1.0, k), lerp(0.7, 0.12, k)
    elif 140 <= t < 144:
        w = sm(ramp(t, 140.0, 143.5))
        dan_lvl, dmn_lvl = lerp(1.0, 0.3, w), lerp(0.12, 0.85, w)
    elif 144 <= t < 148:
        k = eo(ramp(t, 144.0, 144.2))
        dan_lvl, dmn_lvl = lerp(0.3, 1.0, k), lerp(0.85, 0.12, k)
    if 124 <= t < 148:
        for n in DAN:
            acts[NI[n]] += dan_lvl * (0.9 + 0.8 * env(E.stab, t, 0.1))
        for a, c in DAN_EDGES:
            S["edges"].append((a, c, dan_lvl, 1.0 + 2.0 * env(E.stab, t, 0.1)))
        for n in DMN:
            acts[NI[n]] += dmn_lvl * 0.7
        b["sparkle"] += 0.004
        sh = 2.5 * S["kick"]
        fx["shake"] = (fx["shake"][0] + sh * np.sin(t * 60), fx["shake"][1] + sh * np.cos(t * 53))
    S["hud"].append(hud.seesaw(dan_lvl, dmn_lvl, win(t, 124.0, 131.6, 0.1, 0.4)))
    S["hud"].append(hud.callout(NP["FEF_R"], "额叶眼区", "FRONTAL EYE FIELD", win(t, 124.4, 131.6), ramp(t, 124.4, 125.2), side=1))
    S["hud"].append(hud.callout(NP["IPS_R"], "顶内沟", "INTRAPARIETAL SULCUS", win(t, 124.9, 131.6), ramp(t, 124.9, 125.7), side=-1))
    S["hud"].append(hud.caption("此消彼长：注意网络 ↑ 默认网络 ↓",
                                "Fox et al., 2005 · PNAS（自发活动中的两大反相关网络）",
                                win(t, 124.3, 127.8), 1 - eo(ramp(t, 124.3, 124.8))))

    # 聚焦光锥 + 蓝斑-去甲肾上腺素增益波
    ret_x, ret_y, ret_a = 1560.0, 300.0, 0.0
    if 108.5 <= t < 124:
        ret_x, ret_y = 960.0 + 0 * t, 505.0
        ret_a = win(t, 108.6, 110.6, 0.6, 0.5) * 0.8
    if 127.8 <= t < 152:
        ret_a = win(t, 128.0, 151.6, 0.4, 0.3)
        if 140 <= t < 144:
            w = sm(ramp(t, 140, 143.5))
            ret_x += 180 * w * np.sin(t * 0.9)
            ret_y += 120 * w * np.cos(t * 0.7) + 60 * w
            ret_a *= 1 - 0.6 * w
    if ret_a > 0:
        S["hud"].append(hud.reticle(ret_x, ret_y, 64 + 10 * heart + 8 * S["kick"], ret_a, t * 0.6,
                                    "FOCUS · 此刻" if t >= 127.8 else None))
    if 128 <= t < 152:
        bk = win(t, 128.0, 151.6, 0.4, 0.3) * (1 - 0.8 * sm(ramp(t, 140, 143.5)) * (t < 144))
        S["hud"].append(hud.beam([NP["FEF_R"], NP["IPS_R"]], (ret_x, ret_y), bk * (0.8 + 0.6 * S["kick"])))
    if 127.8 <= t < 132.2:
        k = win(t, 128.0, 132.0, 0.3, 0.3)
        for tk, v in E.kick:
            dt = t - tk
            if 0 <= dt < 0.9 and 128 <= tk < 132:
                b["waves"].append(("sphere", NP["LC"], 10 + 230 * dt, 10.0, 0.8 * k * (1 - dt / 0.9)))
        acts[NI["LC"]] += (0.8 + 1.6 * S["kick"]) * k
    S["hud"].append(hud.callout(NP["LC"], "蓝斑", "LOCUS COERULEUS", win(t, 128.3, 131.7), ramp(t, 128.3, 129.1), side=1, dy=70))
    S["hud"].append(hud.caption("背侧注意网络锁定目标；蓝斑释放去甲肾上腺素，调高神经“增益”",
                                "Corbetta & Shulman, 2002；Aston-Jones & Cohen, 2005",
                                win(t, 128.3, 131.8), 1 - eo(ramp(t, 128.3, 128.8))))

    # 节律门控
    if 132 <= t < 140.2:
        for n in ("V1_R", "IPS_R"):
            acts[NI[n]] += 0.6 + 1.0 * S["kick"]
    S["hud"].append(hud.panel_wave("ag", t, win(t, 132.2, 139.8),
                                   dict(alpha_amp=lerp(1.0, 0.25, sm(ramp(t, 132.5, 136))),
                                        gamma=[e for e in E.kick if 131 < e[0] < 141])))
    S["hud"].append(hud.caption("节律门控：α 波压低无关信息，γ 波同步，把此刻的感知绑在一起",
                                "Jensen & Mazaheri, 2010；Fries, 2005 · Trends in Cognitive Sciences",
                                win(t, 132.3, 139.7), 1 - eo(ramp(t, 132.3, 132.8))))

    # 走神 → 觉察 → 拉回
    if 140 <= t < 144:
        w = sm(ramp(t, 140.0, 143.6))
        b["wander"] = w
        fx["dof"] = 1.5 * w
        fx["focus_z"] = 820.0
        fx["exposure"] *= 1 - 0.25 * w
    elif 144 <= t < 144.4:
        b["wander"] = 1 - eo(ramp(t, 144.0, 144.2))
    S["hud"].append(hud.counter(46.9 * eo(ramp(t, 140.3, 141.8)), win(t, 140.2, 143.9, 0.3, 0.1), x=1430, y=620))
    S["hud"].append(hud.caption("而人在清醒时，约有 47% 的时间在走神",
                                "Killingsworth & Gilbert, 2010 · Science（约 2,250 名成人的经验取样）",
                                win(t, 140.3, 143.85, 0.35, 0.1), 1 - eo(ramp(t, 140.3, 140.8))))
    sc, al = slam(t, 144.0, 0.25, 1.25)
    al *= 1 - sm(ramp(t, 145.6, 146.3))
    if t >= 144:
        S["hud"].append(hud.dim(0.4 * al))
        S["hud"].append(hud.bigtext("觉察，然后拉回", W / 2, 505, al, 84, 900, scale=sc, tracking=0.12))
    S["hud"].append(hud.caption("每一次把注意力拉回当下，都是一次注意力训练",
                                "Hasenkamp et al., 2012 · NeuroImage；Brewer et al., 2011 · PNAS（冥想者 DMN 活动更低）",
                                win(t, 145.8, 147.8), 1 - eo(ramp(t, 145.8, 146.3))))

    # 积蓄：三大网络轮流闪烁，跟着军鼓滚奏
    if 148 <= t < 152:
        groups = [DMN, DAN, SAL]
        for i, (ts, v) in enumerate([e for e in E.snare if 148 <= e[0] < 152]):
            dt = t - ts
            if 0 <= dt < 0.5:
                for n in groups[i % 3]:
                    acts[NI[n]] += 1.3 * v * np.exp(-dt / 0.12)
        k = ramp(t, 148, 151.85)
        b["sparkle"] += 0.03 * k
        fx["rays"] += 0.8 * k
        fx["ray_center"] = (0.0, 0.0, 0.0)


# ---------------------------------------------------------------- 合：时间机器
def finale(S, t):
    if not 151.95 <= t < 172.2:
        return
    b, fx, acts = S["brain"], S["fx"], S["acts"]
    S["chapter"] = hud.CHAPTER["finale"]
    S["dust"]["alpha"] = 0.9
    cur = -0.8 if t < 154 else (0.8 if t < 156 else 0.0)
    S["hud_cursor"] = cur
    words = [(152.0, "过去 · 给你素材", 430), (154.0, "未来 · 给你方向", 1490), (156.0, "当下 · 给你行动", 960)]
    for t0, txt, x in words:
        if t >= t0:
            sc, al = slam(t, t0, 0.25, 1.45)
            al *= 1 - sm(ramp(t, 157.6, 158.2))
            S["hud"].append(hud.bigtext(txt, x, H - 210, al, 56, 800, scale=sc, tracking=0.08))
    conv = sm(ramp(t, 158.0, 163.0))
    # 过去：记忆印迹回来了
    if t >= 152:
        pos = ENG_C * (1 - conv) + NP["HC_R"] * conv
        nodes = rotz(ENG_B * (1 - 0.7 * conv), t * 0.3) + pos
        g, gl = graph(nodes, ENG_EDGES_B, (1.0 + S["kick"]) * (1 - 0.6 * conv) * ramp(t, 152, 152.3), 0.9, t, seed=5, pulse=1.4)
        if g and conv < 0.99:
            S["points"].append(g)
            S["glows"] += gl
        s = stream(ENG_C, NP["HC_R"], t, 152.0, 0.6, 220, bulge=30, b=1.2, seed=150, t1=162)
        if s:
            S["points"].append(s)
        acts[NI["HC_R"]] += 1.0
    if t >= 154:
        pos = CRY_C * (1 - conv) + NP["vmPFC"] * conv
        nodes = rotz(ICO * (1 - 0.7 * conv), t * 0.4) + pos
        g, gl = graph(nodes, ICO_EDGES, (1.0 + S["kick"]) * (1 - 0.6 * conv) * ramp(t, 154, 154.3), 0.9, t, seed=71, pulse=1.4)
        if g and conv < 0.99:
            S["points"].append(g)
            S["glows"] += gl
        s = stream(NP["HC_R"], CRY_C, t, 154.0, 0.6, 220, bulge=40, b=1.2, seed=151, t1=162)
        if s:
            S["points"].append(s)
        acts[NI["vmPFC"]] += 1.0
    if t >= 156:
        for n in DAN:
            acts[NI[n]] += 1.0
        S["hud"].append(hud.reticle(W / 2, 505, 90 + 12 * S["kick"], win(t, 156.0, 158.2, 0.1, 0.4) * 0.9, t * 0.8))
    if t >= 158:
        k = ramp(t, 158, 159)
        for n in DMN + DAN + SAL + ["dlPFC_R", "aIPL_R"]:
            acts[NI[n]] += (0.75 + 0.6 * S["kick"]) * k * (1 - sm(ramp(t, 169, 171.5)))
        for a, c in DMN_EDGES + DAN_EDGES + SAL_EDGES:
            S["edges"].append((a, c, k * (1 - sm(ramp(t, 169, 171.5))), 1.0 + 1.5 * S["snare"]))
        S["hud"].append(hud.bigtext("你的大脑，是一台时间机器", W / 2, H - 230, win(t, 158.3, 165.8, 0.5, 0.5),
                                    66, 800, tracking=0.08))
        S["hud"].append(hud.bigtext("在过去与未来之间穿梭——只为让你更好地活在此刻", W / 2, H - 150,
                                    win(t, 160.8, 165.8, 0.6, 0.5), 30, 400, C[30], glow=0.4))
    if 166 <= t < 168:
        k = ramp(t, 166, 167.85)
        b["sparkle"] += 0.04 * k
        fx["rays"] += 1.2 * k
        fx["ray_center"] = (0.0, 0.0, 0.0)
        fx["letterbox"] = int(130 * sm(ramp(t, 166, 168)))
    if t >= 168:
        fx["letterbox"] = 130
        S["hud_alpha"] = 1 - sm(ramp(t, 168, 169))
        sc, al = slam(t, 168.0, 0.35, 1.5)
        al *= 1 - sm(ramp(t, 171.0, 172.0))
        S["hud"].append(hud.title("时间之脑", "THE TEMPORAL BRAIN", "此刻，即是一切时间的入口", al, sc, y=H / 2 - 20,
                                  sub_alpha=al * ramp(t, 168.8, 169.6)))
        b["gain"] += 1.2 * np.exp(-(t - 168) / 1.0)
        b["wander"] = 0.8 * sm(ramp(t, 169, 172))
        fx["rays"] += 1.6 * np.exp(-(t - 168) / 1.4)
        fx["ray_center"] = (0.0, 0.0, 0.0)
        fx["fade"] = min(fx["fade"], 1 - 0.9 * sm(ramp(t, 171.2, 172.2)))


def credits(S, t):
    if t < 172:
        return
    b, fx = S["brain"], S["fx"]
    fx["letterbox"] = 0
    S["hud_alpha"] = 0.0
    b["alpha"] = 0.55 * sm(ramp(t, 172.2, 174))
    S["dust"]["alpha"] = 0.5
    al = win(t, 172.6, 183.2, 0.9, 1.0)
    S["hud"].append(hud.dim(0.25 * al))
    S["hud"].append(_credits_draw(al))
    fx["fade"] = min(fx["fade"], ramp(t, 172.0, 172.8) * (1 - sm(ramp(t, 182.8, 184.0))))


def _credits_draw(alpha):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        a, g = R.fonts.render("参考文献 · REFERENCES", "sans", 30, 600, 0.1)
        from render import blit
        blit(out, a, 140, 120, C[10], alpha, g, C[60], 0.6)
        for i, txt in enumerate(REFS):
            col, row = divmod(i, 16)
            a, _ = R.fonts.render(txt, "mont", 17, 400)
            blit(out, a, 140 + col * 560, 196 + row * 44, C[30], alpha)
        a, _ = R.fonts.render("画面与配乐均由代码程序化生成；脑区位置为示意性 MNI 坐标，非个体扫描数据。", "sans", 18, 400)
        blit(out, a, 140, H - 110, C[50], alpha)
    return draw


# ---------------------------------------------------------------- 收尾：节点光晕、网络连线、常驻 HUD
def _proj(S, p):
    from render import Camera
    return Camera(**S["cam"]).project1(p)


def _label3(pos3, cn, en, alpha):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        from render import blit
        x, y, _ = cam.project1(pos3)
        a, g = R.fonts.render(cn, "sans", 22, 600)
        blit(out, a, x, y, C[10], alpha, g, C[60], 0.6, anchor="cb")
        a, _ = R.fonts.render(en, "osw", 12, 400, 0.35)
        blit(out, a, x, y + 4, C[40], alpha, anchor="ct")
    return draw


def _path(u):
    u = np.asarray(u, np.float32)
    from geometry import catmull
    return catmull(np.array(PATH_CTRL), u).astype(np.float32)


def finish(S, t):
    acts = S["acts"]
    np.clip(acts, 0, 4, out=acts)
    for i, a in enumerate(acts):
        if a > 0.04:
            p = tuple(NP[G.NODE_NAMES[i]])
            S["glows"].append((p, 9 + 9 * min(a, 2), HOT * min(a, 2.5) * 0.22))
            S["glows"].append((p, 2.6, WHITE * min(a, 2.5) * 0.30))
    for a, c, k, pulse in S["edges"]:
        if k <= 0.01:
            continue
        p0, p1 = NP[a], NP[c]
        u = np.linspace(0, 1, 60, dtype=np.float32)
        mid = outward((p0 + p1) / 2, 14)
        P = bez(p0, mid, p1, u)
        trav = (t * 0.8 + (sum(map(ord, a + c)) % 7) * 0.13) % 1.0
        br = k * (0.22 + 0.5 * pulse * np.exp(-((u - trav) / 0.08) ** 2))
        S["points"].append((P, np.outer(br, C[30]).astype(np.float32), 1.0))
    if S["hud_alpha"] > 0.003:
        S["hud"].append(hud.frame_hud(t, S["hud_alpha"], S["hud_cursor"], S["chapter"],
                                      env(E.tick, t, 0.08) + 0.6 * env(E.kick, t, 0.08),
                                      env(E.kick, t, 0.1) + env(E.heart, t, 0.12)))
        S["hud"].append(hud.spike_strip(t, S["hud_alpha"], S["fx"]))
