"""上半部分：序幕、光之跑者、片名、第一章（神经机制）。"""
from functools import lru_cache

import numpy as np

from engine import (C, D, D_WHITE, W, H, dust, ease_in, ease_io, ease_out, env, glow_blob, mask_points, ramp,
                    ring, seg, shake, smooth, text, text_cue, text_mask, PAD)
from scenelib import (HB, Cam, P, beat_env, body, cite, draw_tree, draw_tree_flow, hb_env, header, label,
                      tree_flow_init, tree_normals)
from shapes import brain2d, grow_tree, pack_tree, runner_points, skeleton, tree_point
from timeline import BEAT


# ================================================================== 序幕 0–16 s
NEURON_C = (960, 420)


@lru_cache(None)
def _intro_neuron():
    rng = np.random.default_rng(21)
    br = []
    for i in range(8):
        a = -np.pi / 2 + i * 2 * np.pi / 8 + rng.normal(0, 0.18)
        if abs(np.cos(a - 0.35)) > 0.93 and np.cos(a - 0.35) > 0:
            continue
        br += grow_tree(rng, NEURON_C, a, rng.uniform(140, 210), 4, t0=3.6 + i * 0.22, speed=60, spread=0.7,
                        wiggle=0.12, width=3.6, shrink=(0.5, 0.75), seglen=3.0)
    br += grow_tree(rng, NEURON_C, 0.12, 520, 2, t0=4.6, speed=80, spread=0.45, wiggle=0.025, width=3.0,
                    child_range=(0.75, 0.97), seglen=3.0)
    T = pack_tree(br, 2.5)
    return T, tree_normals(T)


def s_intro(fr, t):
    k = env(t, -1.0, 16.3, 1.0, 0.35)
    if k <= 0:
        return
    hb = hb_env(t)
    c = ease_in(seg(t, 14.3, 16.0), 3)
    cam = Cam()
    cam.pc = np.array(NEURON_C, np.float32)
    cam.pull = 0.985 * c
    cam.swirl = 1.6 * c
    dust(fr, t, 0.55 * k * (1 - c))
    T, N = _intro_neuron()
    draw_tree(fr, cam, T, t, w=0.24 * (1 + 1.3 * hb), col=C[50], alpha=k, normals=N, glow=0.5, tip=0.8)
    g = seg(t, 0.5, 2.4)
    core = (0.35 + 2.0 * hb) * g * k + 5.0 * c
    P(fr, cam, [NEURON_C[0]], [NEURON_C[1]], [5.0 * core], C[10], 0)
    glow_blob(fr, NEURON_C[0], NEURON_C[1], 14 + 18 * hb + 26 * c, 2.2 * core, C[40])
    for t0 in HB:
        if t0 < 16 and t0 <= t < t0 + 2.2:
            d = t - t0
            ring(fr, NEURON_C[0], NEURON_C[1], 30 + d * 250, 0.16 * np.exp(-d * 2.0) * k * (1 - c), C[50], layer=1)
    text_cue(fr, t, "人脑约有 860 亿个神经元", "light", 50, 960, 760, 2.8, 7.6, col=D[20], anchor="c")
    text_cue(fr, t, "Azevedo et al., 2009 · J Comp Neurol", "oswald", 22, 960, 838, 3.4, 7.6, col=D[40],
             anchor="c", rise=8)
    text_cue(fr, t, "它们，一直在等待一个信号", "light", 50, 960, 760, 8.6, 14.1, col=D[20], anchor="c")


# ================================================================== 光之跑者 16–32 s
RUN_HIP = np.array((840.0, 600.0), np.float32)
RUN_SCALE = 0.85
GROUND = 884.0
PHI0 = -np.pi / 2 + 0.3


def run_phi(t):
    return 2 * np.pi * (np.asarray(t) - 16.0) + PHI0


@lru_cache(None)
def _runner_aux():
    rng = np.random.default_rng(12)
    n = 18500
    ang = rng.uniform(0, 2 * np.pi, n)
    joints = ["head", "neck", "hip", "kneeR", "kneeL", "ankleR", "ankleL", "wriR", "wriL", "elbR", "toeR", "toeL",
              "heart"]
    jw = np.array([1.2, 0.8, 1.2, 1, 0.6, 1, 0.6, 1, 0.6, 0.6, 0.8, 0.5, 0.8])
    m = 4000
    return dict(dir=np.stack([np.cos(ang), np.sin(ang)], 1).astype(np.float32),
                rad=(rng.random(n) ** 0.5 * 520).astype(np.float32), delay=(rng.random(n) * 0.7).astype(np.float32),
                c=rng.random(n).astype(np.float32),
                joints=joints, sj=rng.choice(len(joints), m, p=jw / jw.sum()),
                soff=rng.uniform(0, 3, m), slife=rng.uniform(0.6, 1.6, m),
                svx=-(260 + 320 * rng.random(m)), svy=-(20 + 70 * rng.random(m)), sjit=rng.normal(0, 7, (m, 2)),
                st=rng.random(m),
                streak_y=rng.uniform(60, 1020, 300), streak_x=rng.uniform(0, 2400, 300),
                streak_v=rng.uniform(900, 1900, 300), streak_c=rng.random(300),
                blood_u=rng.random(400), blood_w=rng.normal(0, 1, 400),
                rise_i=rng.integers(0, 16000, 2600), rise_u=rng.random(2600), rise_s=rng.uniform(-1, 1, 2600),
                splash=rng.normal(0, 1, (40, 64, 2)), bsub=rng.choice(42000, 6000, replace=False))


def s_ignite(fr, t):
    if not (15.95 <= t <= 32.05):
        return
    A = _runner_aux()
    ph = float(run_phi(t))
    pts, b, J = runner_points(ph, RUN_SCALE)
    X = pts[:, 0] + RUN_HIP[0]
    Y = pts[:, 1] + RUN_HIP[1]
    n = len(X)
    burst = ease_out(seg(t, 16.0, 16.55))
    sx = NEURON_C[0] + A["dir"][:n, 0] * A["rad"][:n] * burst
    sy = NEURON_C[1] + A["dir"][:n, 1] * A["rad"][:n] * burst
    asm = ease_io(seg(t - A["delay"][:n] * 0.7, 16.1, 17.1))
    X = sx + (X - sx) * asm
    Y = sy + (Y - sy) * asm
    head = np.array([float(J["head"][0]), float(J["head"][1])], np.float32) + RUN_HIP
    heart = np.array([float(J["heart"][0]), float(J["heart"][1])], np.float32) + RUN_HIP

    zk = ease_in(seg(t, 28.8, 31.75), 2.6)
    cam = Cam(focus=head, zoom=1 + 6.5 * zk, screen=head + (np.array((960, 520)) - head) * smooth(seg(t, 28.8, 31.0)),
              extra=shake(t))
    be = beat_env(t)
    a = smooth(seg(t, 16.0, 16.4))
    on = seg(t, 17.2, 18.0)

    dust(fr, t, 0.45, wind=(-140 * on, 0), zoom=1 + 2.0 * zk)
    # 速度线
    sv = A["streak_v"]
    sxx = (A["streak_x"] - sv * (t - 16.0)) % 2400 - 240
    ws = 0.32 * seg(t, 18.0, 22.0) * (1 - zk)
    if ws > 0:
        xx, yy = cam(sxx, A["streak_y"])
        fr.streaks(xx, yy, -sv * 0.06 * cam.z, 0, ws, ramp(0.3 + 0.5 * A["streak_c"]), n=6)

    # 身体
    col = ramp(0.45 + 0.5 * A["c"][:n])
    wb = (0.32 + 0.18 * be * on) * b * a
    P(fr, cam, X, Y, wb, col, 0)
    P(fr, cam, X, Y, wb * 0.10, C[40], 1)
    # 地面倒影与地面线
    refl = 2 * GROUND - Y
    P(fr, cam, X, refl, wb * 0.07 * on, C[60], 1)
    gx = np.linspace(-100, W + 100, 1400)
    gw = 0.07 + 0.08 * (0.5 + 0.5 * np.sin((gx + 700 * t) / 37.0)) ** 8
    P(fr, cam, gx, np.full_like(gx, GROUND), gw * on, C[50], 0)

    # 脱落拖尾粒子
    age = (t - 16.0 + A["soff"]) % A["slife"]
    te = t - age
    ok = te > 17.3
    if ok.any():
        Js = skeleton(run_phi(te), RUN_SCALE)
        jx = np.stack([Js[j][0] for j in A["joints"]])
        jy = np.stack([Js[j][1] for j in A["joints"]])
        idx = np.arange(len(age))
        px = jx[A["sj"], idx] + RUN_HIP[0] + A["sjit"][:, 0] + A["svx"] * age * (1 + 0.4 * age)
        py = jy[A["sj"], idx] + RUN_HIP[1] + A["sjit"][:, 1] + A["svy"] * age
        lw = 0.42 * (1 - age / A["slife"]) ** 1.5 * ok
        P(fr, cam, px, py, lw, ramp(0.4 + 0.5 * A["st"]), 0)

    # 落地光环
    for bt in np.arange(17.5, 31.6, BEAT):
        if bt <= t < bt + 0.7:
            d = t - bt
            Jb = skeleton(run_phi(bt), RUN_SCALE)
            tx = max(float(Jb["toeR"][0]), float(Jb["toeL"][0])) if float(Jb["toeR"][1]) > float(Jb["toeL"][1]) else float(Jb["toeL"][0])
            tx += RUN_HIP[0] - 700 * d * 0.4
            r = 18 + d * 320
            aa = np.linspace(0, 2 * np.pi, 120)
            P(fr, cam, tx + r * np.cos(aa), GROUND + 0.18 * r * np.sin(aa), 0.32 * np.exp(-d * 5), C[40], 0)
            sp = A["splash"][int(bt * 2) % 40]
            P(fr, cam, tx - 260 * d + sp[:, 0] * 90 * d, GROUND - np.abs(sp[:, 1]) * 220 * d + 600 * d * d,
              0.5 * np.exp(-d * 4), C[30], 0)

    # 心脏与血流
    hbp = max(hb_env(t), be * on)
    glow_blob(fr, *cam(heart[0], heart[1]), (16 + 12 * hbp) * cam.z ** 0.5, (0.9 + 1.6 * hbp) * a, C[30])
    for bt in np.arange(16.0, 31.6, BEAT):
        if bt <= t < bt + 0.9:
            d = t - bt
            aa = np.linspace(0, 2 * np.pi, 90)
            r = 20 + d * 380
            P(fr, cam, heart[0] + r * np.cos(aa), heart[1] + r * np.sin(aa), 0.1 * np.exp(-d * 3.5) * on, C[50], 1)
    bu = (A["blood_u"] + 1.4 * t) % 1.0
    bp = heart[None, :] + (head - heart)[None, :] * bu[:, None]
    perp = np.array([-(head - heart)[1], (head - heart)[0]]) / (np.linalg.norm(head - heart) + 1e-6)
    bp += perp[None, :] * (A["blood_w"] * 7 * np.sin(np.pi * bu))[:, None]
    P(fr, cam, bp[:, 0], bp[:, 1], 0.55 * seg(t, 19.5, 22.0), C[20], 0)
    # 能量汇聚到头部
    rk = seg(t, 23.5, 25.5)
    if rk > 0:
        ri = A["rise_i"] % n
        u = (A["rise_u"] + 0.75 * t) % 1.0
        e = ease_in(u, 2)
        px = X[ri] + (head[0] - X[ri]) * e + A["rise_s"] * 40 * np.sin(np.pi * u)
        py = Y[ri] + (head[1] - Y[ri]) * e
        P(fr, cam, px, py, 0.5 * rk * (0.3 + 0.7 * u), C[30], 0)
    # 头部里的大脑
    bk = seg(t, 21.0, 27.0)
    hg = 0.25 + 2.6 * seg(t, 21.5, 30.5) ** 2
    glow_blob(fr, *cam(head[0], head[1]), 40 * cam.z ** 0.6, hg * (0.7 + 0.3 * be) * a, C[40])
    if bk > 0:
        B = brain2d()
        sub = A["bsub"]
        bs = 30.0 * RUN_SCALE
        P(fr, cam, head[0] + 2 + B["p"][sub, 0] * bs, head[1] - 2 + B["p"][sub, 1] * bs,
          (0.15 + 0.5 * B["b"][sub]) * bk * (0.4 + 0.6 * zk + 0.25 * be), ramp(0.5 + 0.5 * B["b"][sub]), 0)

    text_cue(fr, t, "当你开始奔跑——", "bold", 62, 1250, 300, 18.3, 23.4, glow=0.4)
    text_cue(fr, t, "心率攀升，血液奔涌", "bold", 58, 1250, 300, 24.0, 29.0, glow=0.4)
    text_cue(fr, t, "大脑，正在被重新点亮", "light", 40, 1252, 392, 24.6, 29.0, col=D[20])
    fr.look["streak"] = max(fr.look["streak"], 0.25 * zk)


# ================================================================== 片名 32–40 s
TITLE = "运动 · 重塑大脑"
TITLE_Y = 470


@lru_cache(None)
def _title_pts():
    rng = np.random.default_rng(33)
    m = text_mask(TITLE, "serif", 150, 8)
    pts = mask_points(m, 26000, rng)
    pts[:, 0] += 960 - m.shape[1] / 2
    pts[:, 1] += TITLE_Y - m.shape[0] / 2
    n = len(pts)
    ang = rng.uniform(0, 2 * np.pi, n)
    return dict(p=pts, dir=np.stack([np.cos(ang), np.sin(ang)], 1), r=rng.random(n) ** 0.6 * 1000,
                d=rng.random(n) * 0.7, d2=rng.random(n) * 0.9, vx=rng.uniform(150, 650, n),
                vy=-rng.uniform(80, 420, n), c=rng.random(n), ph=rng.uniform(0, 6.28, n), m_h=m.shape[0])


def s_title(fr, t):
    if not (31.95 <= t <= 40.4):
        return
    T = _title_pts()
    p = T["p"]
    c0 = np.array((960, 540), np.float32)
    bs = ease_out(seg(t, 32.0, 32.7))
    bx = c0[0] + T["dir"][:, 0] * T["r"] * bs
    by = c0[1] + T["dir"][:, 1] * T["r"] * bs
    k = ease_io(seg(t - T["d"], 32.45, 34.0))
    perp = np.stack([-(p[:, 1] - by), p[:, 0] - bx], 1) * 0.25
    x = bx + (p[:, 0] - bx) * k + perp[:, 0] * np.sin(np.pi * k)
    y = by + (p[:, 1] - by) * k + perp[:, 1] * np.sin(np.pi * k)
    x += 1.4 * np.sin(t * 3 + T["ph"])
    y += 1.4 * np.cos(t * 2.6 + T["ph"])
    u = seg(t - T["d2"], 38.4, 40.0)
    x += T["vx"] * u * u
    y += T["vy"] * u * u
    w = (1 - u) * (0.95 * (1 - k) + 0.42 * k)
    sw = 400 + (t - 35.3) * 950
    w = w * (1 + 2.2 * np.exp(-((p[:, 0] - sw) / 45) ** 2) * (35.3 < t < 36.6))
    cam = Cam(extra=shake(t))
    if t < 33.2:
        v = (1 - seg(t, 32.0, 32.7)) * 3.0 * (1 - k)
        P(fr, cam, x - T["dir"][:, 0] * T["r"] * 0.05 * v, y - T["dir"][:, 1] * T["r"] * 0.05 * v, w * 0.6,
          C[40], 0)
    P(fr, cam, x, y, w, ramp(0.5 + 0.5 * T["c"]), 0)
    P(fr, cam, x, y, w * 0.12, C[40], 1)
    dust(fr, t, 0.5)
    for th, s in ((32.0, 1.0), (36.0, 0.5)):
        if th <= t < th + 1.6:
            d = t - th
            r = 40 + d * 1500
            ring(fr, 960, 540, r, 0.22 * s * np.exp(-d * 2.4), C[40], n=int(r * 1.5), layer=0)
            ring(fr, 960, 540, r * 0.97, 0.12 * s * np.exp(-d * 2.4), C[50], n=int(r * 0.8), layer=1)
    ty = TITLE_Y - T["m_h"] / 2 + PAD
    text(fr, TITLE, "serif", 150, 960, ty, env(t, 33.9, 38.9, 0.9, 0.6) * 0.92, D_WHITE, anchor="c", tracking=8,
         glow=0.6, shadow=0.0)
    text_cue(fr, t, "HOW EXERCISE REWIRES YOUR BRAIN", "cinzel", 34, 960, 612, 34.6, 39.2, col=D[30], anchor="c",
             tracking=10, glow=0.35, shadow=0.0)
    text_cue(fr, t, "运动重塑大脑的神经机制与分子机制", "light", 26, 960, 676, 35.2, 39.2, col=D[40], anchor="c",
             tracking=6, glow=0.15, shadow=0.0)
    fr.look["streak"] = max(fr.look["streak"], 0.55)


# ================================================================== 章节页
@lru_cache(None)
def _chapter_aux():
    rng = np.random.default_rng(44)
    return dict(x=rng.uniform(0, W, 1200), u=rng.random(1200), side=rng.choice([-1, 1], 1200),
                c=rng.random(1200), amp=rng.uniform(150, 520, 1200))


def chapter(fr, t, a, num, cn, en):
    k = env(t, a, a + 4.2, 0.6, 0.7)
    if k <= 0:
        return
    A = _chapter_aux()
    L = 660 * ease_out(seg(t, a + 0.1, a + 1.3))
    u = np.linspace(-1, 1, 1100)
    fr.pts(960 + u * L, np.full_like(u, 602), 0.5 * k * (1 - u * u) ** 1.5, C[30], 0)
    fr.pts(960 + u * L, np.full_like(u, 602), 0.12 * k * (1 - u * u), C[40], 1)
    f = (A["u"] + (t - a) * 0.35) % 1.0
    y = 602 + A["side"] * A["amp"] * (1 - f) ** 2
    fr.pts(A["x"], y, 0.3 * k * f * (1 - f) * 4 * (np.abs(A["x"] - 960) < L + 40), ramp(0.3 + 0.6 * A["c"]), 0)
    dust(fr, t, 0.45 * k)
    text_cue(fr, t, num, "med", 28, 960, 395, a + 0.2, a + 3.6, col=D[40], anchor="c", tracking=10, glow=0.3,
             shadow=0)
    text_cue(fr, t, cn, "serif", 118, 960, 438, a + 0.4, a + 3.6, col=D_WHITE, anchor="c", tracking=10, glow=0.5,
             shadow=0)
    text_cue(fr, t, en, "cinzel", 30, 960, 628, a + 0.7, a + 3.6, col=D[30], anchor="c", tracking=14, glow=0.3,
             shadow=0)
    fr.look["streak"] = max(fr.look["streak"], 0.6 * k)


def s_ch1(fr, t):
    chapter(fr, t, 40.0, "第一章 · CHAPTER I", "神经机制", "NEURAL MECHANISMS")


# ================================================================== ① 脑血流 · 血管新生 44–56 s
@lru_cache(None)
def _vessels():
    rng = np.random.default_rng(31)
    br = grow_tree(rng, (1260, 1140), -np.pi / 2, 430, 6, t0=44.3, speed=430, spread=0.75, wiggle=0.07, width=10,
                   seglen=5, shrink=(0.6, 0.8))
    br += grow_tree(rng, (1720, 1140), -np.pi / 2 - 0.35, 380, 5, t0=45.0, speed=400, spread=0.75, wiggle=0.07,
                    width=8, seglen=5, shrink=(0.6, 0.8))
    br += grow_tree(rng, (780, 1140), -np.pi / 2 + 0.3, 330, 5, t0=45.6, speed=380, spread=0.75, wiggle=0.07,
                    width=7, seglen=5, shrink=(0.6, 0.8))
    T = pack_tree(br, 3.0)
    deep = [i for i, b in enumerate(br) if b["depth"] >= 3]
    sp = []
    starts = []
    for k in range(30):
        i = deep[rng.integers(len(deep))]
        pts = br[i]["pts"]
        j = rng.integers(len(pts) // 3, len(pts) - 1)
        tang = pts[j + 1] - pts[j]
        ang = np.arctan2(tang[1], tang[0]) + rng.choice([-1, 1]) * rng.uniform(1.1, 1.9)
        t0 = 49.0 + 5.6 * k / 30 + rng.uniform(0, 0.2)
        if t0 < br[i]["t0"] + j * 5 / br[i]["speed"] + 0.3:
            t0 = br[i]["t0"] + j * 5 / br[i]["speed"] + 0.3
        sp += grow_tree(rng, pts[j], ang, rng.uniform(45, 85), 1, t0=t0, speed=40, spread=0.6, wiggle=0.15,
                        width=1.6, seglen=3, nchild=(1, 2))
        starts.append((float(pts[j][0]), float(pts[j][1]), t0))
    TS = pack_tree(sp, 2.0)
    return T, tree_normals(T), tree_flow_init(T, 9000, rng, 140, 300), TS, starts


def s_vessels(fr, t):
    k = env(t, 44.0, 56.6, 0.6, 0.6)
    if k <= 0:
        return
    T, N, F, TS, starts = _vessels()
    cam = Cam(focus=(1260, 560), zoom=1.0 + 0.15 * smooth(seg(t, 44, 56)), extra=shake(t))
    dust(fr, t, 0.35 * k)
    draw_tree(fr, cam, T, t, w=0.3, col=C[50], alpha=k, normals=N, glow=0.35, tip=1.2)
    draw_tree_flow(fr, cam, T, F, t, w=0.75, alpha=k, normals=N)
    draw_tree(fr, cam, TS, t, w=0.45, col=C[30], alpha=k, glow=0.6, tip=1.6)
    vegf = []
    for (x, y, t0) in starts:
        if t0 <= t < t0 + 1.0:
            d = t - t0
            xx, yy = cam(x, y)
            ring(fr, float(xx), float(yy), 4 + d * 60, 0.35 * np.exp(-d * 3.5) * k, C[30], layer=0)
        if x > 820 and 0 < y < 900:
            vegf.append((x, y, t0))
    for i, (x, y, t0) in enumerate(vegf[2:12:3]):
        xx, yy = [float(v) for v in cam(x, y)]
        label(fr, t, "VEGF", xx + 26, yy - 52, t0, 55.6, anchor=(xx, yy), size=22, fname="oswaldm", col=D[30])

    y = header(fr, t, "01", "脑血流 · 血管新生", "CEREBRAL BLOOD FLOW · ANGIOGENESIS", 44.4, 55.6, y=620)
    body(fr, t, ["运动使心输出量上升，海马齿状回血容量随之增加",
                 "血管内皮生长因子（VEGF）驱动新生毛细血管",
                 "为神经元输送更多氧气与能量"], 45.2, 55.6, y=y + 8, size=30)
    cite(fr, t, "Pereira et al., 2007 · PNAS  ｜  Fabel et al., 2003 · Eur J Neurosci", 46.4, 55.6, y=y + 160)


# ================================================================== ② 海马 · 神经发生 56–72 s
BC = np.array((1200.0, 500.0), np.float32)
BS = 400.0
HIP_C = np.array((0.06, 0.15), np.float32)


@lru_cache(None)
def _brain_aux():
    rng = np.random.default_rng(55)
    B = brain2d()
    n = len(B["p"])
    ang = rng.uniform(0, 2 * np.pi, n)
    return dict(off=np.stack([np.cos(ang), np.sin(ang)], 1) * rng.uniform(200, 900, (n, 1)),
                d=rng.random(n) * 0.9, c=rng.random(n))


@lru_cache(None)
def _dg():
    rng = np.random.default_rng(57)
    cx, cy, ax, ay = 1200.0, 360.0, 340.0, 310.0
    n = 3200
    th = rng.uniform(0.04 * np.pi, 0.96 * np.pi, n)
    base = np.stack([cx + ax * np.cos(th), cy + ay * np.sin(th)], 1)
    nr = np.stack([np.cos(th) / ax, np.sin(th) / ay], 1)
    nr /= np.linalg.norm(nr, axis=1, keepdims=True)
    cells = base + nr * rng.uniform(-24, 24, (n, 1))
    den = []
    for i in rng.choice(n, 110, replace=False):
        den += grow_tree(rng, cells[i], np.arctan2(nr[i, 1], nr[i, 0]) + rng.normal(0, 0.2), rng.uniform(55, 100),
                         1, t0=0, speed=1e6, spread=0.5, wiggle=0.12, width=1.0, seglen=3)
    TD = pack_tree(den, 2.5)
    births = []
    nb = []
    for k in range(28):
        tk = 64.0 + k * 0.27 + rng.uniform(0, 0.1)
        a = rng.uniform(0.12 * np.pi, 0.88 * np.pi)
        b0 = np.array([cx + ax * np.cos(a), cy + ay * np.sin(a)])
        nn = np.array([np.cos(a) / ax, np.sin(a) / ay])
        nn /= np.linalg.norm(nn)
        start, end = b0 - nn * 36, b0 - nn * 6
        births.append((tk, start, end))
        nb += grow_tree(rng, end, np.arctan2(nn[1], nn[0]) + rng.normal(0, 0.15), rng.uniform(120, 175), 3,
                        t0=tk + 0.55, speed=130, spread=0.55, wiggle=0.1, width=2.2, seglen=3, shrink=(0.5, 0.75))
    TN = pack_tree(nb, 2.0)
    return dict(cells=cells.astype(np.float32), c=rng.random(n), TD=TD, births=births, TN=TN, TNn=tree_normals(TN))


def draw_brain2d(fr, cam, t, center, scale, alpha, assemble=None, bright=None, aux=True):
    B = brain2d()
    X = center[0] + B["p"][:, 0] * scale
    Y = center[1] + B["p"][:, 1] * scale
    if assemble is not None:
        A = _brain_aux()
        k = ease_io(seg(t - A["d"], assemble, assemble + 1.6))[:, None]
        X = X + A["off"][:, 0] * (1 - k[:, 0])
        Y = Y + A["off"][:, 1] * (1 - k[:, 0])
    w = (0.16 + 0.55 * B["b"]) * alpha
    if bright is not None:
        w = w * bright
    P(fr, cam, X, Y, w, ramp(0.3 + 0.6 * B["b"]), 0)
    P(fr, cam, X, Y, w * 0.06, C[50], 1)
    return X, Y


def s_hippo(fr, t):
    if not (55.9 <= t <= 72.6):
        return
    B = brain2d()
    be = beat_env(t)
    aA = env(t, 56.0, 64.2, 0.8, 0.9)
    zk = ease_in(seg(t, 61.6, 64.0), 2.2)
    hc = BC + BS * HIP_C
    cam = Cam(focus=hc, zoom=1 + 3.8 * zk, screen=hc + (np.array((1200, 540)) - hc) * smooth(seg(t, 61.6, 64.0)),
              extra=shake(t))
    dust(fr, t, 0.35, zoom=1 + zk)
    if aA > 0:
        draw_brain2d(fr, cam, t, BC, BS, aA, assemble=56.0)
        hk = seg(t, 58.2, 59.0) * aA
        if hk > 0:
            hx = BC[0] + B["hip"][:, 0] * BS
            hy = BC[1] + B["hip"][:, 1] * BS
            P(fr, cam, hx, hy, (0.55 + 0.5 * be) * hk, C[20], 0)
            P(fr, cam, hx, hy, 0.12 * hk, C[30], 1)
            label(fr, t, "海马 Hippocampus", 1440, 300, 59.2, 61.8, anchor=(hc[0], hc[1]), cam=cam, size=26)

    aB = env(t, 63.3, 72.6, 1.0, 0.6)
    if aB > 0:
        G = _dg()
        cam2 = Cam(focus=(1200, 520), zoom=1.0 + 0.08 * seg(t, 63.3, 72.5), extra=shake(t))
        cells = G["cells"]
        P(fr, cam2, cells[:, 0], cells[:, 1], 0.3 * aB, ramp(0.3 + 0.35 * G["c"]), 0)
        P(fr, cam2, cells[:, 0], cells[:, 1], 0.05 * aB, C[50], 1)
        draw_tree(fr, cam2, G["TD"], 100.0, w=0.07, col=C[60], alpha=aB, glow=0.0)
        for tk, st, en in G["births"]:
            if t >= tk:
                d = t - tk
                p = st + (en - st) * ease_out(seg(t, tk, tk + 0.8))
                xx, yy = [float(v) for v in cam2(p[0], p[1])]
                if d < 1.2:
                    ring(fr, xx, yy, 6 + d * 80, 0.45 * np.exp(-d * 3) * aB, C[30], layer=0)
                fr.pts([xx], [yy], [(1.6 + 2.5 * np.exp(-d * 2.5)) * aB], C[10], 0)
                glow_blob(fr, xx, yy, 10, (0.6 + 1.5 * np.exp(-d * 2)) * aB, C[30])
        draw_tree(fr, cam2, G["TN"], t, w=0.55, col=C[30], alpha=aB, normals=G["TNn"], glow=0.5, tip=1.2)
        label(fr, t, "齿状回 Dentate gyrus", 1200, 420, 64.4, 71.6, size=26, align="c")
        tk, st, en = G["births"][3]
        ax, ay = [float(v) for v in cam2(en[0], en[1])]
        label(fr, t, "新生神经元 New neurons", 1560, 170, 66.0, 71.6, anchor=(ax, ay), size=26)

    y = header(fr, t, "02", "海马 · 神经发生", "HIPPOCAMPUS · NEUROGENESIS", 56.4, 71.6, y=620)
    body(fr, t, ["海马：学习与记忆的核心枢纽", "也是成年大脑中少数可产生新神经元的区域"], 57.2, 63.2, y=y + 8)
    body(fr, t, ["跑步使小鼠齿状回新生神经元数量约翻倍"], 63.8, 67.8, y=y + 8)
    cite(fr, t, "van Praag et al., 1999 · Nat Neurosci", 64.2, 67.8, y=y + 64)
    body(fr, t, ["老年人坚持 1 年有氧运动：海马体积 +2%", "约相当于逆转 1–2 年的增龄性萎缩"], 68.0, 71.6, y=y + 8)
    cite(fr, t, "Erickson et al., 2011 · PNAS  ｜  注：人类成年神经发生的规模仍有争议", 68.4, 71.6, y=y + 116)


# ================================================================== ③ 突触可塑性 72–84 s
SA = np.array((520.0, 300.0), np.float32)
SYN = np.array((1240.0, 540.0), np.float32)
SB = np.array((1600.0, 720.0), np.float32)
AX_V = 1100.0


@lru_cache(None)
def _synapse():
    rng = np.random.default_rng(41)
    brA = []
    for i in range(6):
        a = 0.6 + i * (2 * np.pi - 1.2) / 6 + rng.normal(0, 0.15)
        brA += grow_tree(rng, SA, a, rng.uniform(140, 200), 3, t0=72.0 + i * 0.08, speed=520, spread=0.6, width=3.5,
                         wiggle=0.1, seglen=3)
    TA = pack_tree(brA, 2.5)
    d = SYN + np.array((22, 6)) - SB
    L0 = float(np.linalg.norm(d))
    prim = grow_tree(rng, SB, float(np.arctan2(d[1], d[0])), L0, 2, t0=72.1, speed=520, spread=0.6, width=4.0,
                     wiggle=0.03, seglen=3, child_range=(0.15, 0.6))
    p = prim[0]["pts"]
    corr = (SYN + np.array((22, 6)) - p[-1])
    p += corr[None, :] * np.linspace(0, 1, len(p))[:, None]
    brB = list(prim)
    for i in range(6):
        a = float(np.arctan2(d[1], d[0])) + 0.7 + i * (2 * np.pi - 1.4) / 6 + rng.normal(0, 0.12)
        brB += grow_tree(rng, SB, a, rng.uniform(150, 220), 3, t0=72.2 + i * 0.08, speed=520, spread=0.6, width=3.5,
                         wiggle=0.1, seglen=3)
    TB = pack_tree(brB, 2.5)
    from engine import bezier, polyline_pts
    ax = polyline_pts(bezier(SA, SA + (300, -30), SYN + (-330, 60), SYN - (14, 0)), 3.0)
    s_ax = np.arange(len(ax)) * 3.0
    sites = []
    for T, cnt in ((TB, 460), (TA, 150)):
        nrm = tree_normals(T)
        ok = np.nonzero((T["S"] > 25))[0]
        idx = rng.choice(ok, cnt, replace=False)
        sites.append(np.concatenate([T["P"][idx], nrm[idx] * rng.choice([-1, 1], (cnt, 1)),
                                     rng.uniform(7, 13, (cnt, 1))], 1))
    sites = np.concatenate(sites)
    ts = 73.2 + 10.2 * rng.random(len(sites)) ** 0.75
    prim_n = int(TB["count"][0])
    disc = rng.normal(0, 1, (900, 2))
    disc = disc / np.maximum(1, np.linalg.norm(disc, axis=1, keepdims=True)) * 24
    ves = rng.normal(0, 1, (60, 2)) * [0.6, 1.0] + [1.6, 0]
    return dict(TA=TA, TB=TB, NA=tree_normals(TA), NB=tree_normals(TB), ax=ax.astype(np.float32), s_ax=s_ax,
                sites=sites.astype(np.float32), ts=ts, prim_n=prim_n, disc=disc.astype(np.float32),
                ves=ves.astype(np.float32), vs=rng.uniform(40, 120, 60))


def s_synapse(fr, t):
    a = env(t, 72.0, 84.6, 0.8, 0.6)
    if a <= 0:
        return
    S = _synapse()
    zk = smooth(seg(t, 75.5, 84.0))
    cam = Cam(focus=SYN, zoom=1 + 0.55 * zk, screen=SYN + (np.array((1160, 470)) - SYN) * 0.6 * zk, extra=shake(t))
    dust(fr, t, 0.35 * a)
    draw_tree(fr, cam, S["TA"], t, w=0.45, col=C[50], alpha=a, normals=S["NA"], glow=0.5, tip=0.8)
    TB = S["TB"]
    bright = np.ones(len(TB["P"]), np.float32)
    L_ax = S["s_ax"][-1]
    for soma in (SA, SB):
        q = soma + S["disc"]
        P(fr, cam, q[:, 0], q[:, 1], 0.32 * a, C[40], 0)
    ax = S["ax"]
    P(fr, cam, ax[:, 0], ax[:, 1], 0.4 * a, C[50], 0)
    P(fr, cam, ax[:, 0], ax[:, 1], 0.05 * a, C[50], 1)
    soma_flash = 0.0
    syn_flash = 0.0
    prim = slice(0, S["prim_n"])
    sp = TB["S"][prim]
    Lp = sp[-1]
    for tf in np.arange(73.4, 83.6, BEAT):
        sf = (t - tf) * AX_V
        if -10 < sf < L_ax + 200:
            d = sf - S["s_ax"]
            pw = 2.4 * np.exp(-(d / 18) ** 2) + 0.5 * np.exp(-np.clip(d, 0, None) / 110) * (d > 0)
            m = pw > 0.01
            P(fr, cam, ax[m, 0], ax[m, 1], pw[m] * a, C[10], 0)
            P(fr, cam, ax[m, 0], ax[m, 1], pw[m] * 0.2 * a, C[30], 1)
        ta = tf + L_ax / AX_V
        if ta <= t < ta + 1.4:
            dd = t - ta
            syn_flash = max(syn_flash, np.exp(-dd / 0.15))
            vp = SYN + S["ves"] * (S["vs"][:, None] * min(dd, 0.6))
            P(fr, cam, vp[:, 0], vp[:, 1], 0.9 * np.exp(-dd / 0.3) * a, C[20], 0)
            sw = Lp - dd * 700
            if sw > -40:
                bright[prim] += 3.5 * np.exp(-((sp - sw) / 26) ** 2)
            else:
                soma_flash = max(soma_flash, np.exp(-(dd - Lp / 700) / 0.22))
    draw_tree(fr, cam, TB, t, w=0.45, col=C[50], alpha=a, normals=S["NB"], glow=0.5, tip=0.8, bright=bright)
    gx, gy = [float(v) for v in cam(SYN[0], SYN[1])]
    glow_blob(fr, gx, gy, 14, (0.8 + 2.5 * syn_flash) * a, C[30])
    bx, by = [float(v) for v in cam(SB[0], SB[1])]
    glow_blob(fr, bx, by, 26, (0.5 + 2.2 * soma_flash) * a, C[40])
    sx, sy = [float(v) for v in cam(SA[0], SA[1])]
    glow_blob(fr, sx, sy, 26, 0.5 * a, C[40])
    st = S["sites"]
    on = t >= S["ts"]
    if on.any():
        s = st[on]
        g = ease_out(seg(t, S["ts"][on], S["ts"][on] + 0.45))
        fl = np.exp(-(t - S["ts"][on]) / 0.15)
        for f in (0.35, 0.65):
            q = s[:, :2] + s[:, 2:4] * (s[:, 4] * g * f)[:, None]
            P(fr, cam, q[:, 0], q[:, 1], 0.45 * a, C[40], 0)
        q = s[:, :2] + s[:, 2:4] * (s[:, 4] * g)[:, None]
        P(fr, cam, q[:, 0], q[:, 1], (1.1 + 2.5 * fl) * a, C[20], 0)
        P(fr, cam, q[:, 0], q[:, 1], (0.08 + 0.4 * fl) * a, C[30], 1)
    label(fr, t, "突触 Synapse", 1150, 360, 74.0, 77.4, anchor=(gx, gy), size=26)
    text_cue(fr, t, "LTP", "oswaldm", 40, gx + 50, gy - 120, 77.6, 83.6, col=D[20], glow=0.8, shadow=0.3)
    sp_i = int(np.argmin(np.hypot(st[:, 0] - 1430, st[:, 1] - 650) + 1e4 * (S["ts"] > 78.0)))
    qx, qy = [float(v) for v in cam(st[sp_i, 0], st[sp_i, 1])]
    label(fr, t, "树突棘 Dendritic spines", 1260, 960, 78.2, 83.6, anchor=(qx, qy), size=24)

    y = header(fr, t, "03", "突触可塑性", "SYNAPTIC PLASTICITY", 72.4, 83.6, y=620)
    body(fr, t, ["运动使树突棘增多，长时程增强（LTP）更易诱导", "——记忆被“写入”的物理基础"], 73.2, 83.6, y=y + 8)
    body(fr, t, ["并调动多巴胺、去甲肾上腺素、5-羟色胺与内源性大麻素"], 77.6, 83.6, y=y + 112, size=26,
         col=D[30])
    cite(fr, t, "van Praag et al., 1999 · PNAS  ｜  Fuss et al., 2015 · PNAS", 74.0, 83.6, y=y + 170)


# ================================================================== ④ 脑网络 84–96 s
NC = np.array((1180.0, 520.0), np.float32)
NS = 420.0
DMN = {"mPFC": (-0.80, -0.20), "dlPFC": (-0.62, -0.45), "PCC": (0.42, -0.50), "AG": (0.64, -0.20),
       "LTC": (0.10, 0.34), "HPC": (0.04, 0.17)}
DMN_EDGES = [("mPFC", "PCC"), ("PCC", "AG"), ("AG", "LTC"), ("LTC", "HPC"), ("HPC", "mPFC"), ("mPFC", "AG"),
             ("dlPFC", "mPFC"), ("dlPFC", "HPC"), ("HPC", "PCC")]


@lru_cache(None)
def _network():
    rng = np.random.default_rng(51)
    B = brain2d()
    cand = B["p"][B["reg"] == 0]
    w = 1 + 2.0 * (cand[:, 0] < -0.3)
    nodes = [np.array(v, np.float32) for v in DMN.values()]
    for i in rng.choice(len(cand), 600, p=w / w.sum()):
        q = cand[i]
        if all(np.linalg.norm(q - n) > 0.16 for n in nodes):
            nodes.append(q)
        if len(nodes) >= 46:
            break
    nodes = np.array(nodes)
    nd = len(DMN)
    edges = set()
    for i in range(len(nodes)):
        d = np.linalg.norm(nodes - nodes[i], axis=1)
        for j in np.argsort(d)[1:4]:
            edges.add((min(i, j), max(i, j)))
    names = list(DMN)
    dmn_e = set()
    for a, b in DMN_EDGES:
        i, j = names.index(a), names.index(b)
        edges.add((min(i, j), max(i, j)))
        dmn_e.add((min(i, j), max(i, j)))
    pts, eid = [], []
    edges = sorted(edges)
    for k, (i, j) in enumerate(edges):
        p0, p1 = nodes[i], nodes[j]
        mid = (p0 + p1) / 2
        perp = np.array([-(p1 - p0)[1], (p1 - p0)[0]])
        ctrl = mid + perp * rng.uniform(-0.25, 0.25)
        u = np.linspace(0, 1, max(24, int(np.linalg.norm(p1 - p0) * 260)))[:, None]
        pts.append((1 - u) ** 2 * p0 + 2 * (1 - u) * u * ctrl + u * u * p1)
        eid.append(np.full(len(u), k))
    E = len(edges)
    return dict(nodes=nodes.astype(np.float32), nd=nd, pts=np.concatenate(pts).astype(np.float32),
                eid=np.concatenate(eid), u=np.concatenate([np.linspace(0, 1, len(p)) for p in pts]).astype(np.float32),
                ton=84.3 + rng.random(E) * 4.5, rate=rng.uniform(0.5, 1.3, E), ph=rng.random(E),
                dmn=np.array([e in dmn_e for e in edges]), nph=rng.uniform(0, 6.28, len(nodes)))


def s_network(fr, t):
    a = env(t, 84.0, 96.4, 0.8, 0.4)
    if a <= 0:
        return
    B = brain2d()
    Nw = _network()
    cam = Cam(focus=NC, zoom=1.0 + 0.08 * seg(t, 84, 96), extra=shake(t))
    cam.pc = NC.copy()
    cam.pull = 0.97 * ease_in(seg(t, 95.3, 96.4), 2.5)
    cam.swirl = 1.2 * ease_in(seg(t, 95.3, 96.4), 2)
    dust(fr, t, 0.35 * a)
    pk = seg(t, 86.0, 88.0)
    br = 0.55 + 1.2 * B["pfc"] * pk
    draw_brain2d(fr, cam, t, NC, NS, a * 0.55, bright=br)
    ek = 1 + 1.5 * seg(t, 94.0, 96.0)
    s = 0.2 + 0.8 * smooth((t - Nw["ton"]) / 6.0)
    e = Nw["eid"]
    u = Nw["u"]
    pu = (Nw["rate"] * t + Nw["ph"]) % 1.0
    dd = np.abs(u - pu[e])
    pw = np.exp(-(dd / 0.035) ** 2)
    dm = Nw["dmn"][e] & (t > 89.5)
    w = (0.13 * s[e] + 1.1 * pw * s[e]) * a * ek * (1 + 0.8 * dm)
    X = NC[0] + Nw["pts"][:, 0] * NS
    Y = NC[1] + Nw["pts"][:, 1] * NS
    col = np.where(dm[:, None], C[20][None, :], C[40][None, :])
    P(fr, cam, X, Y, w, col, 0)
    P(fr, cam, X, Y, w * 0.12, C[40], 1)
    nodes = Nw["nodes"]
    nx = NC[0] + nodes[:, 0] * NS
    ny = NC[1] + nodes[:, 1] * NS
    isd = np.arange(len(nodes)) < Nw["nd"]
    nw = (0.9 + 0.6 * np.sin(t * 3 + Nw["nph"])) * a * (1 + 1.4 * isd * (t > 89.5))
    xx, yy = cam(nx, ny)
    for i in range(len(nodes)):
        glow_blob(fr, float(xx[i]), float(yy[i]), 6 + 6 * isd[i], float(nw[i]) * 0.6, C[30])
    fr.pts(xx, yy, nw * 1.6, C[10], 0)
    pfc = NC + NS * np.array((-0.68, -0.30))
    px, py = [float(v) for v in cam(pfc[0], pfc[1])]
    glow_blob(fr, px, py, 120, 1.6 * pk * a * (0.8 + 0.2 * beat_env(t)), C[50])
    label(fr, t, "前额叶皮层 PFC", 560, 170, 86.4, 95.4, anchor=(px, py), size=26)
    pcc = NC + NS * np.array(DMN["PCC"])
    qx, qy = [float(v) for v in cam(pcc[0], pcc[1])]
    label(fr, t, "默认模式网络 DMN", 1480, 110, 89.6, 95.4, anchor=(qx, qy), size=26)

    y = header(fr, t, "04", "脑网络重塑", "NETWORK REORGANIZATION", 84.4, 95.4, y=620)
    body(fr, t, ["前额叶执行功能提升，默认模式网络连接增强"], 85.2, 95.4, y=y + 8)
    cite(fr, t, "Colcombe & Kramer, 2003 · Psychol Sci（元分析） ｜ Voss et al., 2010 · Front Aging Neurosci",
         85.8, 95.4, y=y + 62)
    body(fr, t, ["单次运动后，执行功能等认知表现即可出现小幅、短暂提升"], 89.0, 95.4, y=y + 110, size=27,
         col=D[30])
    cite(fr, t, "Chang et al., 2012 · Brain Res（元分析）", 89.4, 95.4, y=y + 160)
