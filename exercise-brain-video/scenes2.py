"""下半部分：第二章（分子机制）、高潮三维大脑、运动处方、参考文献。"""
from functools import lru_cache

import numpy as np

from engine import (C, D, D_WHITE, W, H, bezier, dust, ease_in, ease_io, ease_out, env, glow_blob, polyline_pts,
                    ramp, ring, seg, shake, smooth, text, text_cue)
from scenelib import (Cam, P, bar_env, beat_env, body, cite, draw_tree, hb_env, header, label, tree_normals)
from scenes1 import chapter, draw_brain2d
from shapes import brain3d, grow_tree, pack_tree, project, rot3


# ================================================================== 第二章 96–104 s
@lru_cache(None)
def _stars():
    rng = np.random.default_rng(61)
    n = 2600
    return dict(x=rng.uniform(-1.7, 1.7, n), y=rng.uniform(-1.0, 1.0, n), z=rng.random(n), c=rng.random(n))


def _star_D(t):
    d = 0.05 * (t - 96.0)
    if t > 100.5:
        d += 1.3 * 3.5 / 4 * ((t - 100.5) / 3.5) ** 4
    return d


def _star_v(t):
    return 0.05 + (1.3 * ((t - 100.5) / 3.5) ** 3 if t > 100.5 else 0.0)


def s_ch2(fr, t):
    k = env(t, 96.0, 104.3, 0.8, 0.3)
    if k <= 0:
        return
    S = _stars()
    dd = _star_D(t)
    v = _star_v(t)
    z = 0.04 + 0.96 * ((S["z"] - dd) % 1.0)
    zp = np.minimum(z + v * 0.045, 1.2)
    sx, sy = 960 + S["x"] / z * 420, 540 + S["y"] / z * 420
    px, py = 960 + S["x"] / zp * 420, 540 + S["y"] / zp * 420
    w = k * 1.1 * (1 - z) ** 1.2 * (0.5 + 0.5 * S["c"])
    fr.streaks(sx, sy, sx - px, sy - py, w * (1 + 3 * v), ramp(0.35 + 0.6 * S["c"]), n=6)
    hb = hb_env(t)
    glow_blob(fr, 960, 540, 60 + 30 * hb, (0.3 + 0.8 * hb) * k, C[60])
    chapter(fr, t, 96.8, "第二章 · CHAPTER II", "分子机制", "MOLECULAR MECHANISMS", dur=6.8)
    fr.look["rays"] = max(fr.look["rays"], 0.25 * seg(t, 101.0, 104.0))


# ================================================================== ⑤ 外周 → 大脑 104–118 s
MB_C = np.array((1260.0, 250.0), np.float32)
MB_S = 230.0
PATH_M = polyline_pts(bezier((640, 840), (600, 610), (1000, 520), (1185, 420), 300), 2.0)
PATH_L = polyline_pts(bezier((1480, 790), (1490, 600), (1390, 500), (1315, 420), 300), 2.0)
SPECIES = [  # 名称, 路径, 数量, 亮度, 颜色档, 标签出发时间
    ("鸢尾素 Irisin", "m", 900, 0.75, 20, 105.0),
    ("组织蛋白酶 B  Cathepsin B", "m", 650, 0.65, 30, 106.4),
    ("乳酸 Lactate", "m", 2200, 0.45, 40, 107.8),
    ("β-羟丁酸 β-HB", "l", 900, 0.7, 20, 105.7),
    ("IGF-1", "l", 650, 0.65, 30, 107.1),
    ("GPLD1", "l", 650, 0.7, 10, 108.5),
]


def _path_frame(path):
    d = np.gradient(path, axis=0)
    n = np.stack([-d[:, 1], d[:, 0]], 1)
    n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-6
    return n


@lru_cache(None)
def _messenger():
    rng = np.random.default_rng(71)
    fib = []
    for i in range(7):
        m = 1500
        x = rng.uniform(160, 860, m)
        dy = rng.normal(0, 5.0, m).clip(-9, 9)
        band = 0.3 + 0.7 * np.cos(np.pi * x / 14) ** 8 * (np.abs(dy) < 7.5)
        fib.append(np.stack([x, dy, np.full(m, i), band], 1))
    fib = np.concatenate(fib)
    pts = []
    while len(pts) < 7000:
        q = rng.uniform(-1.1, 1.1, (4000, 2))
        r = np.hypot(q[:, 0], q[:, 1])
        th = np.arctan2(q[:, 1], q[:, 0])
        ok = r < 1 + 0.12 * np.sin(2 * th + 1) + 0.06 * np.sin(3 * th + 2)
        pts += list(q[ok])
    lv = np.array(pts[:7000]) * [300, 120] + [1540, 905]
    lx, ly = lv[:, 0] - 1540, lv[:, 1] - 905
    lob = 0.5 + 0.5 * np.cos(lx / 22) * np.cos((lx * 0.5 + ly * 0.866) / 22) * np.cos((lx * 0.5 - ly * 0.866) / 22)
    flows = []
    for si, (_, p, cnt, w, cc, _) in enumerate(SPECIES):
        flows.append(np.stack([np.full(cnt, si), rng.random(cnt), rng.normal(0, 1, cnt), rng.random(cnt)], 1))
    flows = np.concatenate(flows)
    return dict(fib=fib, liver=lv, lob=0.35 + 0.65 * lob, flows=flows,
                NM=_path_frame(PATH_M), NL=_path_frame(PATH_L))


def s_messenger(fr, t):
    a = env(t, 104.0, 118.5, 0.7, 0.5)
    if a <= 0:
        return
    M = _messenger()
    cam = Cam(extra=shake(t))
    dust(fr, t, 0.3 * a)
    arrive = seg(t, 107.5, 114.0)
    draw_brain2d(fr, cam, t, MB_C, MB_S, a * (0.55 + 0.5 * arrive))
    glow_blob(fr, *cam(MB_C[0], MB_C[1] + 40), 150, (0.4 + 1.2 * arrive) * a * (0.8 + 0.2 * beat_env(t)), C[50])
    label(fr, t, "大脑 Brain", 1530, 90, 104.6, 117.6, size=24)

    be = beat_env(t, 0.12)
    f = M["fib"]
    sc = 1 - 0.035 * be
    X = 510 + (f[:, 0] - 510) * sc
    Y = 850 + f[:, 2] * 22 + f[:, 1] + 6 * np.sin(f[:, 0] / 120 + f[:, 2])
    P(fr, cam, X, Y, 0.34 * f[:, 3] * a * (1 + 0.6 * be), ramp(0.35 + 0.5 * f[:, 3]), 0)
    P(fr, cam, X, Y, 0.04 * a, C[50], 1)
    lv = M["liver"]
    P(fr, cam, lv[:, 0], lv[:, 1], 0.3 * M["lob"] * a, ramp(0.3 + 0.5 * M["lob"]), 0)
    P(fr, cam, lv[:, 0], lv[:, 1], 0.04 * a, C[50], 1)
    label(fr, t, "骨骼肌 Skeletal muscle", 160, 790, 104.6, 117.6, size=24)
    label(fr, t, "肝脏 Liver", 1700, 760, 104.6, 117.6, size=24)

    fl = M["flows"]
    si = fl[:, 0].astype(int)
    raw = 0.24 * (t - 104.5) - fl[:, 1]
    vis = raw >= 0
    u = raw % 1.0
    for path, nrm, key in ((PATH_M, M["NM"], "m"), (PATH_L, M["NL"], "l")):
        m = vis & np.array([SPECIES[i][1] == key for i in si])
        if not m.any():
            continue
        uu = u[m]
        idx = np.minimum((uu * (len(path) - 1)).astype(int), len(path) - 1)
        spread = (0.4 + 0.9 * np.sin(np.pi * uu)) * 22
        q = path[idx] + nrm[idx] * (fl[m, 2] * spread + 4 * np.sin(t * 3 + fl[m, 3] * 6))[:, None]
        ww = np.array([SPECIES[i][3] for i in si[m]]) * smooth(uu / 0.05) * smooth((1 - uu) / 0.12) * a
        col = np.stack([C[SPECIES[i][4]] for i in si[m]])
        P(fr, cam, q[:, 0], q[:, 1], ww, col, 0)
    for name, key, _, _, cc, tl in SPECIES:
        uu = (t - tl) / 4.6
        if 0 < uu < 0.92:
            path, nrm = (PATH_M, M["NM"]) if key == "m" else (PATH_L, M["NL"])
            idx = int(uu * (len(path) - 1))
            q = path[idx]
            al = smooth(uu / 0.06) * smooth((0.92 - uu) / 0.1) * a
            off = -60 if key == "m" else 46
            glow_blob(fr, float(q[0]), float(q[1]), 10, 1.6 * al, C[20])
            fr.pts([q[0]], [q[1]], [2.5 * al], C[10], 0)
            text(fr, name, "med", 25, float(q[0]) + off * (1 if key == "l" else 1), float(q[1]) - 18, al,
                 D[20], anchor="r" if key == "m" else "l", glow=0.3)

    y = header(fr, t, "05", "外周 → 大脑：血液中的信使", "MUSCLE · LIVER · BRAIN CROSSTALK", 104.4, 117.6, y=70)
    body(fr, t, ["运动中的骨骼肌是一个内分泌器官", "鸢尾素、组织蛋白酶 B、乳酸随血流奔向大脑"], 105.0, 117.6, y=y + 8,
         size=29)
    body(fr, t, ["肝脏来源的 GPLD1 可将运动获益“转移”给衰老小鼠"], 109.4, 117.6, y=y + 102, size=29)
    cite(fr, t, "Wrann 2013 · Cell Metab ｜ Moon 2016 · Cell Metab ｜ Horowitz 2020 · Science", 106.0, 117.6,
         y=y + 156)


# ================================================================== ⑥ 血脑屏障 118–128 s
BAR_Y = 600.0
CELL_X = [-100 + i * 265 for i in range(9)]
PORES = [x + d for x in CELL_X for d in (70, 195) if 0 < x + d < W]
NEURONS = [(960.0, 330.0), (1350.0, 250.0), (1720.0, 380.0)]
GLIA = [(830.0, 470.0), (1120.0, 430.0), (1530.0, 470.0), (1180.0, 150.0), (1830.0, 200.0), (1600.0, 150.0)]


@lru_cache(None)
def _bbb():
    rng = np.random.default_rng(81)
    cell = []
    for x0 in CELL_X:
        x1 = x0 + 262
        per = []
        for xx in np.arange(x0 + 12, x1 - 12, 3.0):
            per += [(xx, BAR_Y - 25), (xx, BAR_Y + 25)]
        for a in np.linspace(-np.pi / 2, np.pi / 2, 20):
            per += [(x1 - 12 + 12 * np.cos(a), BAR_Y + 25 * np.sin(a)), (x0 + 12 - 12 * np.cos(a), BAR_Y + 25 * np.sin(a))]
        per = np.array(per)
        nuc = rng.normal(0, 1, (260, 2)) * [26, 6] + [x0 + 131, BAR_Y]
        fill = np.stack([rng.uniform(x0 + 6, x1 - 6, 160), rng.uniform(BAR_Y - 20, BAR_Y + 20, 160)], 1)
        cell.append((per, nuc, fill))
    per = np.concatenate([c[0] for c in cell])
    nuc = np.concatenate([c[1] for c in cell])
    fill = np.concatenate([c[2] for c in cell])
    nb = 3400
    lumen = dict(x=rng.uniform(0, 2200, nb), y=rng.uniform(648, 1010, nb), c=rng.random(nb))
    lumen["v"] = 110 + 170 * (1 - ((lumen["y"] - 830) / 180) ** 2)
    rbc = dict(x=rng.uniform(0, 2200, 46), y=rng.uniform(680, 990, 46), r=rng.uniform(0, 3.14, 46))
    rbc["v"] = 110 + 170 * (1 - ((rbc["y"] - 830) / 180) ** 2)
    nl = 460
    pi = rng.integers(0, len(PORES), nl)
    lac = dict(p=np.array(PORES, np.float32)[pi], tc=np.sort(rng.uniform(118.6, 127.8, nl)),
               sx=rng.uniform(120, 320, nl), sy=rng.uniform(680, 960, nl), j=rng.normal(0, 1, (nl, 2)))
    tgt = np.array(NEURONS)[np.argmin(np.abs(np.array(NEURONS)[:, 0][None, :] - lac["p"][:, None]), axis=1)]
    lac["tx"], lac["ty"] = tgt[:, 0], tgt[:, 1]
    ncl = 170
    clu = dict(x=rng.uniform(900, 1900, ncl), y=rng.uniform(700, 960, ncl), td=np.sort(rng.uniform(120.4, 123.6, ncl)),
               ph=rng.uniform(0, 6.28, ncl))
    clu["dx"] = clu["x"] + rng.normal(0, 30, ncl)
    gl = []
    for gi, (gx, gy) in enumerate(GLIA):
        for k in range(6):
            gl += grow_tree(rng, (gx, gy), k * np.pi / 3 + rng.normal(0, 0.3), rng.uniform(45, 75), 2, t0=0,
                            speed=1e6, spread=0.7, wiggle=0.18, width=1.6, seglen=2.5)
    TG = pack_tree(gl, 2.0)
    owner = np.array([int(np.argmin([np.hypot(p[0] - g[0], p[1] - g[1]) for g in GLIA]))
                      for p in TG["P"][TG["start"]]])
    TG["owner"] = owner[TG["B"]]
    nr = []
    for nx, ny in NEURONS:
        for k in range(5):
            nr += grow_tree(rng, (nx, ny), -np.pi / 2 + (k - 2) * 0.7 + rng.normal(0, 0.2), rng.uniform(80, 130), 2,
                            t0=0, speed=1e6, spread=0.6, wiggle=0.12, width=2.0, seglen=3)
    TN = pack_tree(nr, 2.5)
    disc = rng.normal(0, 1, (300, 2))
    disc = disc / np.maximum(1, np.linalg.norm(disc, axis=1, keepdims=True))
    return dict(per=per, nuc=nuc, fill=fill, lumen=lumen, rbc=rbc, lac=lac, clu=clu, TG=TG,
                gph=rng.uniform(0, 6.28, len(TG["P"])), TN=TN, disc=disc)


def s_bbb(fr, t):
    a = env(t, 118.0, 128.5, 0.7, 0.5)
    if a <= 0:
        return
    B = _bbb()
    cam = Cam(extra=shake(t))
    dust(fr, t, 0.25 * a)
    P(fr, cam, B["per"][:, 0], B["per"][:, 1], 0.42 * a, C[40], 0)
    P(fr, cam, B["per"][:, 0], B["per"][:, 1], 0.06 * a, C[50], 1)
    P(fr, cam, B["nuc"][:, 0], B["nuc"][:, 1], 0.28 * a, C[50], 0)
    P(fr, cam, B["fill"][:, 0], B["fill"][:, 1], 0.1 * a, C[60], 0)
    for x in CELL_X:
        fr.pts(np.full(5, x + 263.5), np.linspace(BAR_Y - 20, BAR_Y + 20, 5), 1.0 * a, C[20], 0)
    pk = 0.6 + 0.4 * beat_env(t)
    for x in PORES:
        yy = np.linspace(BAR_Y - 24, BAR_Y + 24, 18)
        fr.pts(np.concatenate([np.full(18, x - 5), np.full(18, x + 5)]), np.concatenate([yy, yy]), 0.55 * a * pk, C[30], 0)
    gx = np.linspace(0, W, 700)
    fr.pts(gx, np.full_like(gx, BAR_Y - 40), 0.08 * a, C[50], 0)

    L = B["lumen"]
    lx = (L["x"] + L["v"] * t) % 2200 - 140
    P(fr, cam, lx, L["y"], 0.22 * a, ramp(0.25 + 0.4 * L["c"]), 0)
    R = B["rbc"]
    ang = np.linspace(0, 2 * np.pi, 18, endpoint=False)
    rx = ((R["x"] + R["v"] * t) % 2200 - 140)[:, None] + 13 * np.cos(ang)[None, :] * np.cos(R["r"])[:, None]
    ry = R["y"][:, None] + 6 * np.sin(ang)[None, :]
    P(fr, cam, rx.ravel(), ry.ravel(), 0.28 * a, C[60], 0)

    lac = B["lac"]
    s = t - lac["tc"]
    m1 = (s > -1.3) & (s < 0)
    if m1.any():
        u = ease_io((s[m1] + 1.3) / 1.3)
        x0, y0 = lac["p"][m1] - lac["sx"][m1], lac["sy"][m1]
        cx, cy = lac["p"][m1] - 40, 700.0
        x1, y1 = lac["p"][m1], BAR_Y + 32
        qx = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * cx + u * u * x1
        qy = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * cy + u * u * y1
        P(fr, cam, qx, qy, 0.8 * a, C[20], 0)
    m2 = (s >= 0) & (s < 0.35)
    if m2.any():
        u = s[m2] / 0.35
        P(fr, cam, lac["p"][m2], BAR_Y + 32 - 64 * u, 2.4 * a, C[10], 0)
        P(fr, cam, lac["p"][m2], BAR_Y + 32 - 64 * u, 0.6 * a, C[30], 1)
    m3 = (s >= 0.35) & (s < 3.0)
    if m3.any():
        u = ease_out((s[m3] - 0.35) / 2.65)
        x0, y0 = lac["p"][m3], BAR_Y - 32
        x1 = lac["tx"][m3] + lac["j"][m3, 0] * 18
        y1 = lac["ty"][m3] + lac["j"][m3, 1] * 18
        P(fr, cam, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, 0.75 * a * (1 - 0.7 * u), C[20], 0)
    fed = seg(t, 120.0, 127.5)
    draw_tree(fr, cam, B["TN"], 1.0, w=0.22 + 0.25 * fed, col=C[50], alpha=a, glow=0.4)
    for nx, ny in NEURONS:
        q = np.array((nx, ny)) + B["disc"] * 16
        P(fr, cam, q[:, 0], q[:, 1], 0.35 * a, C[40], 0)
        glow_blob(fr, nx, ny, 22, (0.4 + 1.6 * fed) * a, C[40])

    calm = smooth(seg(t, 122.6, 125.6))
    act = 1 - calm
    TG = B["TG"]
    own = np.array(GLIA)[TG["owner"]]
    sc = 0.45 + 0.55 * calm
    jit = act * 6 * np.stack([np.sin(37 * t + B["gph"]), np.cos(31 * t + B["gph"] * 1.3)], 1)
    q = own + (TG["P"] - own) * sc + jit
    P(fr, cam, q[:, 0], q[:, 1], 0.3 * a, C[50], 0)
    for gi, (gx, gy) in enumerate(GLIA):
        fl = 1 + act * 0.9 * abs(np.sin(13 * t + gi))
        glow_blob(fr, gx, gy, 12, 0.55 * fl * a, C[50])
        fr.pts([gx], [gy], [1.0 * fl * a], C[30], 0)

    clu = B["clu"]
    sd = t - clu["td"]
    m = sd > -1.2
    if m.any():
        u = ease_io(np.clip((sd[m] + 1.2) / 1.2, 0, 1))
        qx = clu["x"][m] + (clu["dx"][m] - clu["x"][m]) * u
        qy = clu["y"][m] + (BAR_Y + 30 - clu["y"][m]) * u
        ww = (0.7 + 0.5 * (u >= 1) * (0.5 + 0.5 * np.sin(4 * t + clu["ph"][m]))) * a
        P(fr, cam, qx, qy, ww, C[20], 0)
        P(fr, cam, qx, qy, ww * 0.2, C[30], 1)

    label(fr, t, "血脑屏障 BBB", 150, 650, 118.8, 127.6, anchor=(300, BAR_Y + 26), size=24)
    label(fr, t, "血液 Blood", 150, 960, 118.8, 127.6, size=22, col=D[40])
    label(fr, t, "MCT 转运体", 1010, 690, 120.0, 127.6, anchor=(PORES[4], BAR_Y + 18), size=24)
    label(fr, t, "Clusterin", 1640, 700, 122.0, 127.6, anchor=(1560, BAR_Y + 32), size=24, fname="oswaldm")
    label(fr, t, "小胶质细胞趋于静息 · 神经炎症↓", 1010, 40, 123.6, 127.6, anchor=GLIA[3], size=24)

    y = header(fr, t, "06", "跨越血脑屏障", "CROSSING THE BLOOD–BRAIN BARRIER", 118.4, 127.6, y=70)
    body(fr, t, ["乳酸经 MCT 转运体入脑", "既是神经元的燃料，也是诱导 BDNF 的信号"], 119.0, 127.6, y=y + 8, size=29)
    cite(fr, t, "El Hayek et al., 2019 · J Neurosci", 119.6, 127.6, y=y + 102)
    body(fr, t, ["运动血浆中的 Clusterin 作用于脑血管内皮", "抑制神经炎症"], 122.6, 127.6, y=y + 148, size=29)
    cite(fr, t, "De Miguel et al., 2021 · Nature", 123.0, 127.6, y=y + 242)


# ================================================================== ⑦ BDNF 信号级联 128–148 s（151.5 s 前被吸入）
REC_X = [980.0, 1260.0, 1540.0]
NUC = np.array((1260.0, 1010.0), np.float32)
NUC_R = 190.0
PATHS = [
    ([(980, 470), (900, 570), (930, 690), (1120, 845)], ("PI3K", "Akt"), "存活 Survival"),
    ([(1260, 470), (1260, 565), (1260, 690), (1260, 822)], ("Ras", "MAPK / ERK"), "生长 Growth"),
    ([(1540, 470), (1620, 570), (1580, 690), (1400, 845)], ("PLCγ", "IP3 / Ca2+"), "可塑性 Plasticity"),
]


def mem_y(x, t):
    return 400 + 10 * np.sin(x / 170 + 0.6 * t)


@lru_cache(None)
def _bdnf():
    rng = np.random.default_rng(91)
    from engine import catmull_open
    paths = []
    for pts, names, fn in PATHS:
        c = polyline_pts(catmull_open(pts, 30), 2.0)
        s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(c, axis=0), axis=1))])
        node_s = [s[np.argmin(np.linalg.norm(c - np.array(p), axis=1))] for p in pts[1:3]]
        paths.append(dict(c=c, s=s, L=s[-1], node_s=node_s, node_p=pts[1:3], names=names, fn=fn,
                          fu=rng.random(500), fo=rng.normal(0, 1, 500)))
    mx = rng.uniform(600, 2000, 5200)
    lay = rng.choice([-1, 1], 5200)
    arc = polyline_pts(bezier((1430, 900), (1880, 860), (1880, 470), (1660, 418), 300), 2.0)
    sphere = rng.normal(0, 1, (220, 2))
    sphere = sphere / np.linalg.norm(sphere, axis=1, keepdims=True) * np.sqrt(rng.random((220, 1)))
    nuc_a = rng.uniform(0, 2 * np.pi, 1400)
    nuc_in = rng.normal(0, 1, (900, 2)) * 70
    return dict(paths=paths, mx=mx, lay=lay, arc=arc, au=rng.random(400), ao=rng.normal(0, 1, 400),
                sphere=sphere, nuc_a=nuc_a, nuc_in=nuc_in, mr=rng.random(500), mj=rng.normal(0, 1, (500, 2)))


def _sph(fr, cam, x, y, r, w, col, S):
    q = np.array((x, y)) + S["sphere"] * r
    P(fr, cam, q[:, 0], q[:, 1], w, col, 0)


def s_bdnf(fr, t):
    a = env(t, 128.0, 151.6, 0.8, 0.15)
    if a <= 0:
        return
    S = _bdnf()
    boost = 1 + 0.8 * seg(t, 144.0, 148.0)
    imp = ease_in(seg(t, 147.4, 151.45), 2.4)
    cam = Cam(focus=(1260, 640), zoom=1 + 0.12 * smooth(seg(t, 143.0, 148.0)), extra=shake(t))
    cam.pc = np.array((960.0, 540.0), np.float32)
    cam.pull = 0.99 * imp
    cam.swirl = 2.4 * imp
    aw = a * boost
    dust(fr, t, 0.3 * a * (1 - imp))

    mx = S["mx"]
    my = mem_y(mx, t) + S["lay"] * 12
    fade = smooth((mx - 640) / 260)
    P(fr, cam, mx, my, 0.3 * aw * fade, C[40], 0)
    P(fr, cam, mx, my, 0.04 * aw * fade, C[50], 1)
    for x in (np.linspace(640, 2000, 700),):
        P(fr, cam, x, mem_y(x, t), 0.05 * aw * smooth((x - 640) / 260), C[60], 0)

    tb = [130.6 + 0.4 * k for k in range(3)]
    for k, xr in enumerate(REC_X):
        ym = float(mem_y(xr, t))
        dim = ease_out(seg(t, tb[k], tb[k] + 0.45))
        sep = 30 - 18 * dim
        act = seg(t, tb[k] + 0.3, tb[k] + 0.6)
        for sgn in (-1, 1):
            bx = xr + sgn * sep
            arm = np.linspace(0, 1, 30)
            P(fr, cam, bx + sgn * 22 * arm, ym - 14 - 56 * arm, 0.6 * aw, C[30], 0)
            _sph(fr, cam, bx + sgn * 22, ym - 74, 9, 0.35 * aw, C[40], S)
            stem = np.linspace(-14, 14, 14)
            P(fr, cam, np.full(14, bx), ym + stem, 0.7 * aw, C[30], 0)
            for dy in (40, 72):
                _sph(fr, cam, bx, ym + dy, 12, (0.3 + 0.7 * act) * aw, C[30] if act < 0.5 else C[10], S)
                if act > 0:
                    gx, gy = [float(v) for v in cam(bx + sgn * 16, ym + dy)]
                    fr.pts([gx], [gy], [2.0 * act * aw], C[10], 0)
        if t >= tb[k]:
            d = t - tb[k]
            if d < 1.2:
                gx, gy = [float(v) for v in cam(xr, ym - 60)]
                ring(fr, gx, gy, 10 + d * 160, 0.4 * np.exp(-d * 3) * a, C[30])
        st = tb[k] - 2.0
        u = ease_out(seg(t, st, tb[k]))
        if t > st - 0.2:
            bx = xr + 60 * np.sin(3 * (1 - u)) * (1 - u)
            by = -80 + (ym - 92 + 80) * u
            for sgn in (-1, 1):
                gx, gy = bx + sgn * 11, by
                _sph(fr, cam, gx, gy, 11, 0.9 * aw, C[20], S)
                cx, cy = [float(v) for v in cam(gx, gy)]
                glow_blob(fr, cx, cy, 14, 0.9 * aw, C[30])
        label(fr, t, "BDNF", xr + 48, ym - 150, tb[k] - 0.6, 146.8, size=22, fname="oswaldm") if k == 1 else None
        if k == 0:
            label(fr, t, "TrkB 受体", xr - 160, ym + 40, tb[0] + 0.3, 146.8, anchor=(xr - 20, ym + 40), size=22,
                  cam=cam)

    na = seg(t, 129.5, 131.0) * aw
    th = S["nuc_a"]
    for rr, ww in ((NUC_R, 0.45), (NUC_R - 9, 0.25)):
        P(fr, cam, NUC[0] + rr * np.cos(th), NUC[1] + rr * np.sin(th), ww * na, C[40], 0)
    P(fr, cam, NUC[0] + S["nuc_in"][:, 0], NUC[1] + S["nuc_in"][:, 1] * 0.6, 0.06 * na, C[60], 0)
    dx = np.linspace(1090, 1430, 300)
    phs = 0.045 * dx + 2 * t
    for off in (0, np.pi):
        y = 960 + 26 * np.sin(phs + off)
        P(fr, cam, dx, y, (0.25 + 0.35 * (0.5 + 0.5 * np.cos(phs + off))) * na, C[30], 0)
    rx = dx[::6]
    ry0 = 960 + 26 * np.sin(phs[::6])
    ry1 = 960 + 26 * np.sin(phs[::6] + np.pi)
    for f in np.linspace(0, 1, 6):
        P(fr, cam, rx, ry0 + (ry1 - ry0) * f, 0.1 * na, C[50], 0)
    loosen = seg(t, 140.4, 142.0)
    for bxp in (1120, 1190, 1350, 1410):
        r = 17 + 7 * loosen
        ang = np.linspace(0, 2 * np.pi, 40)
        P(fr, cam, bxp + r * np.cos(ang), 960 + r * np.sin(ang), (0.4 - 0.2 * loosen) * na, C[50], 0)
    gene = (dx > 1255) & (dx < 1315)
    P(fr, cam, dx[gene], 960 + 26 * np.sin(phs[gene]), 1.6 * loosen * na, C[10], 0)
    creb = seg(t, 133.9, 134.3)
    cx, cy = [float(v) for v in cam(1222, 960)]
    glow_blob(fr, cx, cy, 20, (0.2 + 2.5 * creb * (0.7 + 0.3 * beat_env(t))) * na, C[20])
    label(fr, t, "CREB", 1150, 870, 134.0, 146.8, anchor=(1222, 948), size=24, fname="oswaldm", cam=cam)
    label(fr, t, "Bdnf 基因", 1300, 1015, 141.0, 146.8, size=22, col=D[20])

    for k, pth in enumerate(S["paths"]):
        ts = tb[k] + 0.6
        front = pth["L"] * ease_io(seg(t, ts, ts + 1.9))
        if front <= 0:
            continue
        c, s = pth["c"], pth["s"]
        m = s <= front
        P(fr, cam, c[m, 0], c[m, 1], 0.35 * aw, C[40], 0)
        P(fr, cam, c[m, 0], c[m, 1], 0.06 * aw, C[40], 1)
        hi = np.argmax(s >= front) if front < pth["L"] else len(s) - 1
        hx, hy = [float(v) for v in cam(c[hi, 0], c[hi, 1])]
        if front < pth["L"]:
            glow_blob(fr, hx, hy, 12, 1.4 * aw, C[20])
        uu = (pth["fu"] + 0.4 * t) % 1.0
        fs = uu * pth["L"]
        mm = fs <= front
        idx = np.minimum((fs[mm] / 2.0).astype(int), len(c) - 1)
        q = c[idx] + pth["fo"][mm, None] * 5
        P(fr, cam, q[:, 0], q[:, 1], 0.8 * aw, C[20], 0)
        for j, (ns, npnt) in enumerate(zip(pth["node_s"], pth["node_p"])):
            if front >= ns:
                tn = ts + 1.9 * (ns / pth["L"])
                d = t - tn
                nx, ny = [float(v) for v in cam(*npnt)]
                glow_blob(fr, nx, ny, 16, (0.9 + 1.8 * np.exp(-max(d, 0) * 2)) * aw, C[30])
                _sph(fr, cam, npnt[0], npnt[1], 13, 0.6 * aw, C[20], S)
                label(fr, t, pth["names"][j], npnt[0] - 26, npnt[1] - 18, tn, 146.8, size=24, fname="med",
                      align="r", col=D[20])
                if j == 1:
                    label(fr, t, pth["fn"], npnt[0] - 26, npnt[1] + 16, tn + 0.3, 146.8, size=20, align="r",
                          col=D[40], fname="light")

    fb = seg(t, 136.0, 137.0)
    if fb > 0:
        m = S["mr"] < 1.0
        u = (S["mr"] + 0.5 * t) % 1.0
        st = np.array((1222.0, 960.0))
        en = np.array((1360.0, 860.0))
        q = st + (en - st) * u[:, None] + S["mj"] * 10
        P(fr, cam, q[:, 0], q[:, 1], 0.5 * fb * aw, C[20], 0)
        arc = S["arc"]
        ua = (S["au"] + 0.32 * t) % 1.0
        idx = (ua * (len(arc) - 1)).astype(int)
        q = arc[idx] + S["ao"][:, None] * 6
        P(fr, cam, q[:, 0], q[:, 1], 0.7 * fb * aw, C[30], 0)
        P(fr, cam, arc[:, 0], arc[:, 1], 0.12 * fb * aw, C[40], 0)
        label(fr, t, "正反馈：更多 BDNF 与突触蛋白", 1890, 980, 137.2, 146.8, size=22, align="r", col=D[30])

    y = header(fr, t, "07", "BDNF：大脑的“肥料”", "BRAIN-DERIVED NEUROTROPHIC FACTOR", 128.4, 146.8, y=70)
    body(fr, t, ["运动提升海马 BDNF 表达"], 129.0, 134.4, y=y + 8)
    cite(fr, t, "Neeper et al., 1995 · Nature", 129.4, 134.4, y=y + 62)
    body(fr, t, ["BDNF 结合 TrkB 受体", "→ PI3K/Akt · MAPK/ERK · PLCγ", "→ CREB → 基因转录"], 134.6, 140.2, y=y + 8,
         size=29)
    body(fr, t, ["表观遗传开关：β-羟丁酸抑制 HDAC", "使 Bdnf 启动子组蛋白乙酰化、基因开放"], 140.4, 146.8, y=y + 8,
         size=29)
    cite(fr, t, "Sleiman et al., 2016 · eLife", 140.8, 146.8, y=y + 102)


# ================================================================== 高潮 148–176 s
BR_C = np.array((960.0, 440.0), np.float32)
WAVE_SRC = np.array([(0.0, 0.0, 0.0), (0.75, 0.3, 0.25), (-0.7, -0.3, 0.3), (0.1, 0.45, -0.25), (0.3, -0.4, 0.45),
                     (-0.2, 0.2, -0.1)], np.float32)
WORDS = ["脑血流 ↑", "神经发生", "突触可塑性", "网络重塑", "BDNF ↑"]


@lru_cache(None)
def _climax():
    rng = np.random.default_rng(101)
    B = brain3d()
    n = len(B["p"])
    inner = B["p"][rng.choice(np.nonzero(B["reg"] <= 1)[0], 40, replace=False)] * [0.62, 0.5, 0.62]
    E = set()
    for i in range(len(inner)):
        d = np.linalg.norm(inner - inner[i], axis=1)
        for j in np.argsort(d)[1:4]:
            E.add((min(i, j), max(i, j)))
    seg_pts, seg_u, seg_e = [], [], []
    for k, (i, j) in enumerate(sorted(E)):
        u = np.linspace(0, 1, 40)[:, None]
        seg_pts.append(inner[i] * (1 - u) + inner[j] * u)
        seg_u.append(u[:, 0])
        seg_e.append(np.full(40, k))
    ang = rng.uniform(0, 2 * np.pi, 5000)
    return dict(delay=rng.random(n) * 0.9, spark=rng.choice(n, 500, replace=False), srate=rng.uniform(0.4, 1.2, 500),
                sph=rng.random(500), inner=inner, ep=np.concatenate(seg_pts).astype(np.float32),
                eu=np.concatenate(seg_u), ee=np.concatenate(seg_e), erate=rng.uniform(0.5, 1.3, len(E)),
                eph=rng.random(len(E)), bdir=np.stack([np.cos(ang), np.sin(ang)], 1),
                bsp=rng.uniform(200, 1400, 5000), bc=rng.random(5000), c=rng.random(n))


def brain_view(t):
    yaw = -1.25 + 0.085 * (t - 152.0)
    pitch = 0.20 + 0.04 * np.sin(0.3 * t)
    f = 1450 + 120 * seg(t, 152.0, 176.0)
    return yaw, pitch, f, 4.2


def brain_project(t, P3=None, N3=None):
    B = brain3d()
    yaw, pitch, f, dist = brain_view(t)
    Pr = rot3(B["p"] if P3 is None else P3, yaw, pitch)
    x, y, z, s = project(Pr, BR_C[0], BR_C[1], f, dist)
    Nr = rot3(B["n"] if N3 is None else N3, yaw, pitch)
    return x, y, z, Pr, Nr


def s_climax(fr, t):
    if not (147.9 <= t <= 176.6):
        return
    Cx = _climax()
    sing = seg(t, 148.0, 151.45)
    if t < 152.0:
        k = 1.0 if t < 151.5 else 0.25
        glow_blob(fr, 960, 540, 20 + 60 * sing, (0.5 + 5 * sing ** 2) * k, C[30])
        fr.pts([960], [540], [10 * sing * k], C[10], 0)
        dust(fr, t, 0.4, zoom=1 - 0.8 * sing)
        fr.look["rays"] = max(fr.look["rays"], 0.6 * sing)
        fr.look["rays_center"] = (960, 540)
        return
    a = env(t, 152.0, 176.7, 0.05, 0.5)
    B = brain3d()
    x, y, z, Pr, Nr = brain_project(t)
    d0 = t - 152.0
    k = ease_out(seg(t - Cx["delay"], 152.05, 153.4))
    sx = 960 + (x - 960) * k
    sy = 540 + (y - 540) * k
    light = np.clip(Nr @ np.array([0.4, -0.55, 0.73], np.float32), 0, 1)
    facing = -Nr[:, 1]
    rim = (1 - np.abs(facing)) ** 3
    w = (0.12 + 0.55 * light + 0.9 * rim) * B["b"] * (4.5 / z) ** 2 * smooth((facing + 0.15) / 0.5)
    boost = np.zeros(len(w), np.float32)
    for kk in range(12):
        tk = 152.0 + 2.0 * kk
        if tk <= t < tk + 2.4:
            src = WAVE_SRC[kk % len(WAVE_SRC)]
            dist = np.linalg.norm(B["p"] - src, axis=1)
            r = 1.15 * (t - tk)
            boost += 1.6 * np.exp(-((dist - r) / 0.07) ** 2) * np.exp(-(t - tk) / 1.3)
    for th in (152.0, 160.0, 168.0):
        if th <= t < th + 2.0:
            dist = np.linalg.norm(B["p"], axis=1)
            boost += 2.5 * np.exp(-((dist - 1.6 * (t - th)) / 0.12) ** 2)
    sp = Cx["spark"]
    on = ((Cx["srate"] * t + Cx["sph"]) % 1.0) < 0.05
    boost[sp[on]] += 3.0
    ww = (w * (1 + boost) + 0.15 * boost * smooth((facing + 0.4) / 0.6)) * a * (0.6 + 0.4 * k)
    col = ramp(0.35 + 0.35 * light + 0.3 * np.clip(boost, 0, 1))
    fr.pts(sx, sy, ww, col, 0)
    fr.pts(sx, sy, ww * 0.08, C[50], 1)

    yaw, pitch, f, dist = brain_view(t)
    ep = rot3(Cx["ep"], yaw, pitch)
    ex, ey, ez, _ = project(ep, BR_C[0], BR_C[1], f, dist)
    pu = (Cx["erate"] * t + Cx["eph"]) % 1.0
    pw = np.exp(-((Cx["eu"] - pu[Cx["ee"]]) / 0.05) ** 2)
    ka = seg(t, 153.0, 155.0) * a
    fr.pts(ex, ey, (0.1 + 1.2 * pw) * ka * (4.5 / ez) ** 2, C[20], 0)
    ip = rot3(Cx["inner"], yaw, pitch)
    ix, iy, iz, _ = project(ip, BR_C[0], BR_C[1], f, dist)
    for i in range(len(ix)):
        glow_blob(fr, float(ix[i]), float(iy[i]), 7, 0.6 * ka, C[30])

    if d0 < 1.8:
        bs = Cx["bsp"] * (1 - np.exp(-d0 * 3)) / 3
        bx = 960 + Cx["bdir"][:, 0] * bs
        by = 540 + Cx["bdir"][:, 1] * bs
        vv = Cx["bsp"] * np.exp(-d0 * 3) * 0.04
        fr.streaks(bx, by, Cx["bdir"][:, 0] * vv, Cx["bdir"][:, 1] * vv, 1.0 * np.exp(-d0 * 2),
                   ramp(0.5 + 0.5 * Cx["bc"]), n=5)
        for th, s in ((152.0, 1.0),):
            r = 40 + d0 * 1600
            ring(fr, 960, 540, r, 0.3 * np.exp(-d0 * 2.2), C[40], n=int(r * 1.5))
    for th in (160.0, 168.0):
        if th <= t < th + 1.5:
            d = t - th
            ring(fr, 960, 470, 60 + d * 1300, 0.2 * np.exp(-d * 2.4), C[40], n=int((60 + d * 1300) * 1.4))

    dust(fr, t, 0.4 * a)
    fr.look["rays"] = max(fr.look["rays"], 0.32 * a * (0.8 + 0.4 * bar_env(t)))
    fr.look["rays_center"] = (960, 440)
    fr.look["streak"] = max(fr.look["streak"], 0.3)

    wa = env(t, 160.0, 175.4, 1.2, 0.6)
    if wa > 0:
        th0 = 0.38 * (t - 160.0)
        for i, wd in enumerate(WORDS):
            ang = th0 + 2 * np.pi * i / len(WORDS)
            p3 = np.array([[1.45 * np.cos(ang), 1.45 * np.sin(ang), -0.05]], np.float32)
            q = rot3(p3, 0.0, pitch)
            qx, qy, qz, _ = project(q, BR_C[0], BR_C[1], f, dist)
            front = smooth((0.9 - q[0, 1]) / 1.6)
            text(fr, wd, "med", 30, float(qx[0]), float(qy[0]) - 20, wa * (0.1 + 0.9 * front ** 2), D_WHITE, anchor="c",
                 glow=0.5, shadow=0.0)
    text_cue(fr, t, "每一次心跳加速", "serif", 80, 960, 868, 153.6, 158.8, anchor="c", tracking=8, glow=0.5)
    text_cue(fr, t, "都在重塑你的大脑", "serif", 80, 960, 868, 159.2, 165.6, anchor="c", tracking=8, glow=0.5)
    text_cue(fr, t, "MOVE · REWIRE · RISE", "cinzel", 62, 960, 872, 166.2, 175.4, anchor="c", tracking=16,
             col=D[20], glow=0.6)
    text_cue(fr, t, "运动 · 重塑 · 新生", "light", 28, 960, 968, 166.8, 175.4, anchor="c", tracking=12, col=D[40])


# ================================================================== 尾声 176–192 s
ECG_Y = 610.0
ECG_A = 140.0
X0 = 80.0
SCAN_T0 = 179.69


def ecg(ph):
    return (0.12 * np.exp(-((ph - 0.15) / 0.025) ** 2) - 0.12 * np.exp(-((ph - 0.29) / 0.008) ** 2)
            + 1.0 * np.exp(-((ph - 0.31) / 0.010) ** 2) - 0.25 * np.exp(-((ph - 0.335) / 0.010) ** 2)
            + 0.3 * np.exp(-((ph - 0.55) / 0.05) ** 2))


@lru_cache(None)
def _outro():
    rng = np.random.default_rng(111)
    B = brain3d()
    n = len(B["p"])
    sel = rng.choice(n, 14000, replace=False)
    rest = np.setdiff1d(np.arange(n), sel)[::3]
    tx = np.sort(rng.uniform(X0, W - X0, len(sel)))
    ty = ECG_Y - ECG_A * ecg(((tx - X0) / 300.0) % 1.0) + rng.normal(0, 1.2, len(sel))
    rng.shuffle(sel)
    x, y, z, Pr, Nr = brain_project(176.0)
    ang = rng.uniform(0, 2 * np.pi, len(rest))
    return dict(sel=sel, rest=rest, tx=tx, ty=ty, sx=x[sel], sy=y[sel], rx=x[rest], ry=y[rest],
                rd=np.stack([np.cos(ang), np.sin(ang)], 1) * rng.uniform(100, 600, (len(rest), 1)),
                d=rng.random(len(sel)) * 0.8)


def s_outro(fr, t):
    if not (175.95 <= t <= 192.2):
        return
    O = _outro()
    a = env(t, 176.0, 192.0, 0.05, 1.4)
    k = ease_io(seg(t - O["d"], 176.1, 177.9))
    x = O["sx"] + (O["tx"] - O["sx"]) * k
    y = O["sy"] + (O["ty"] - O["sy"]) * k
    xh = X0 + 300.0 * (t - SCAN_T0)
    dx = xh - O["tx"]
    trail = np.where(dx >= 0, np.exp(-dx / 260.0), 0.0) * (t > SCAN_T0) * (t < 186.4)
    head = np.exp(-(dx / 10.0) ** 2) * (t > SCAN_T0) * (t < 186.0)
    base = 0.22 + 0.4 * (1 - seg(t, 178.0, 180.0)) - 0.08 * seg(t, 186.0, 190.0)
    w = (base + 1.4 * trail + 3.0 * head) * a
    fr.pts(x, y, w, ramp(0.5 + 0.4 * np.clip(trail, 0, 1)), 0)
    fr.pts(x, y, w * 0.12, C[40], 1)
    if SCAN_T0 < t < 186.0:
        hx = xh
        hy = ECG_Y - ECG_A * ecg(((hx - X0) / 300.0) % 1.0)
        glow_blob(fr, hx, hy, 18, 2.0 * a, C[20])
    r = seg(t, 176.0, 177.6)
    if r < 1:
        fr.pts(O["rx"] + O["rd"][:, 0] * ease_out(r), O["ry"] + O["rd"][:, 1] * ease_out(r), 0.4 * (1 - r), C[40], 0)
    dust(fr, t, 0.35 * a)
    text_cue(fr, t, "运动处方 · EXERCISE PRESCRIPTION", "med", 26, 960, 150, 178.8, 184.8, anchor="c", tracking=6,
             col=D[40])
    text_cue(fr, t, "每周 150–300 分钟中等强度有氧运动", "bold", 54, 960, 200, 179.0, 184.8, anchor="c", glow=0.45)
    text_cue(fr, t, "或 75–150 分钟高强度有氧运动，并每周 ≥2 天力量训练", "light", 30, 960, 290, 179.4, 184.8,
             anchor="c", col=D[20])
    text_cue(fr, t, "世界卫生组织《身体活动和久坐行为指南》，2020", "light", 22, 960, 346, 179.8, 184.8, anchor="c",
             col=D[40])
    text_cue(fr, t, "从今天起，让每一步都重塑大脑", "serif", 66, 960, 790, 185.4, 190.6, anchor="c", tracking=6,
             glow=0.5)
    text_cue(fr, t, "MOVE · REWIRE · RISE", "cinzel", 28, 960, 900, 186.0, 190.6, anchor="c", tracking=14,
             col=D[30])


# ================================================================== 参考文献 192–200 s
REFS = [
    "Azevedo FAC, et al. J Comp Neurol. 2009;513:532  ｜ 人脑神经元数量",
    "Neeper SA, et al. Nature. 1995;373:109  ｜ 运动与海马 BDNF",
    "van Praag H, et al. Nat Neurosci. 1999;2:266  ｜ 跑步与神经发生",
    "van Praag H, et al. PNAS. 1999;96:13427  ｜ 神经发生、学习与 LTP",
    "Fabel K, et al. Eur J Neurosci. 2003;18:2803  ｜ VEGF 与神经发生",
    "Pereira AC, et al. PNAS. 2007;104:5638  ｜ 齿状回脑血容量",
    "Erickson KI, et al. PNAS. 2011;108:3017  ｜ 海马体积 +2%",
    "Colcombe S, Kramer AF. Psychol Sci. 2003;14:125  ｜ 元分析",
    "Voss MW, et al. Front Aging Neurosci. 2010;2:32  ｜ 脑网络连接",
    "Chang YK, et al. Brain Res. 2012;1453:87  ｜ 急性运动元分析",
    "Fuss J, et al. PNAS. 2015;112:13105  ｜ 内源性大麻素",
    "Wrann CD, et al. Cell Metab. 2013;18:649  ｜ FNDC5/鸢尾素",
    "Moon HY, et al. Cell Metab. 2016;24:332  ｜ 组织蛋白酶 B",
    "Sleiman SF, et al. eLife. 2016;5:e15092  ｜ β-羟丁酸与 BDNF",
    "El Hayek L, et al. J Neurosci. 2019;39:2369  ｜ 乳酸与 BDNF",
    "Horowitz AM, et al. Science. 2020;369:167  ｜ GPLD1",
    "De Miguel Z, et al. Nature. 2021;600:494  ｜ Clusterin 抗炎",
    "WHO. Guidelines on Physical Activity and Sedentary Behaviour. 2020",
]


def s_refs(fr, t):
    a = env(t, 192.0, 200.2, 1.0, 0.8)
    if a <= 0:
        return
    dust(fr, t, 0.3 * a)
    text(fr, "参考文献 · References", "bold", 36, 130, 70, a, D_WHITE, glow=0.35)
    lx = np.linspace(130, 1790, 900)
    fr.pts(lx, np.full_like(lx, 140), 0.18 * a, C[40], 0)
    for i, r in enumerate(REFS):
        col, row = divmod(i, 9)
        text(fr, f"{i + 1:>2}.  {r}", "light", 21, 130 + col * 860, 175 + row * 78, a * env(t, 192.1 + 0.04 * i, 200.2, 0.6, 0.8),
             D[30], glow=0.0, shadow=0.0)
    text(fr, "本片为科普用途，不构成个体化医疗建议  ·  画面与配乐均为程序化生成  ·  配色：Loyel 渐变蓝", "light", 21, 960,
         950, a, D[40], anchor="c", glow=0.0, shadow=0.0)
