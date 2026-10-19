"""程序化生成的 3D 粒子"玻璃脑"。

坐标系沿用 MNI（单位 mm）：x 左(-)右(+)，y 后(-)前(+)，z 下(-)上(+)。
外形由若干隐式曲面（椭球、胶囊）平滑并集而成，再在表面上均匀撒点；
脑沟用"随机正弦和"的零值等高线近似，中央沟与外侧裂单独刻画。
脑区节点坐标取自常见 fMRI 文献中的近似 MNI 峰值坐标，仅用于示意。
"""
import os
import numpy as np

GROUPS = dict(cortex=0, medial=1, cerebellum=2, stem=3, hippo=4, thalamus=5,
              amygdala=6, callosum=7, dust=8)

# 名称: (MNI 坐标, 中文, 英文, 所属网络)
NODES = {
    "HC_L": ((-28, -22, -14), "海马", "HIPPOCAMPUS", "mtl"),
    "HC_R": ((28, -22, -14), "海马", "HIPPOCAMPUS", "mtl"),
    "PHC_R": ((26, -38, -12), "海马旁回", "PARAHIPPOCAMPAL", "mtl"),
    "vmPFC": ((0, 46, -10), "腹内侧前额叶", "vmPFC", "dmn"),
    "mPFC": ((0, 54, 20), "内侧前额叶", "mPFC", "dmn"),
    "PCC": ((0, -54, 30), "后扣带 / 楔前叶", "PCC / PRECUNEUS", "dmn"),
    "AG_L": ((-46, -68, 34), "角回", "ANGULAR GYRUS", "dmn"),
    "AG_R": ((48, -64, 34), "角回", "ANGULAR GYRUS", "dmn"),
    "LTC_L": ((-60, -12, -18), "外侧颞叶", "LATERAL TEMPORAL", "dmn"),
    "LTC_R": ((60, -10, -18), "外侧颞叶", "LATERAL TEMPORAL", "dmn"),
    "V1_L": ((-12, -94, 4), "初级视皮层", "V1", "sensory"),
    "V1_R": ((12, -94, 4), "初级视皮层 V1", "VISUAL CORTEX", "sensory"),
    "A1_R": ((52, -22, 8), "听觉皮层", "AUDITORY CORTEX", "sensory"),
    "AMY_R": ((24, -4, -18), "杏仁核", "AMYGDALA", "mtl"),
    "FEF_L": ((-28, -4, 56), "额叶眼区", "FEF", "dan"),
    "FEF_R": ((30, -4, 56), "额叶眼区 FEF", "FRONTAL EYE FIELD", "dan"),
    "IPS_L": ((-28, -58, 52), "顶内沟", "IPS", "dan"),
    "IPS_R": ((30, -56, 52), "顶内沟 IPS", "INTRAPARIETAL SULCUS", "dan"),
    "AI_L": ((-36, 18, 2), "前岛叶", "ANTERIOR INSULA", "sal"),
    "AI_R": ((38, 18, 2), "前岛叶", "ANTERIOR INSULA", "sal"),
    "dACC": ((0, 22, 38), "背侧前扣带", "dACC", "sal"),
    "dlPFC_L": ((-44, 34, 28), "背外侧前额叶", "dlPFC", "fpcn"),
    "dlPFC_R": ((44, 36, 28), "背外侧前额叶", "dlPFC", "fpcn"),
    "aIPL_R": ((50, -46, 46), "前顶下小叶", "aIPL", "fpcn"),
    "THAL_R": ((12, -20, 6), "丘脑", "THALAMUS", "sub"),
    "THAL_L": ((-12, -20, 6), "丘脑", "THALAMUS", "sub"),
    "LGN_R": ((22, -25, -4), "外侧膝状体", "LGN", "sub"),
    "LC": ((4, -37, -27), "蓝斑", "LOCUS COERULEUS", "sub"),
}
NODE_NAMES = list(NODES)
NODE_POS = np.array([NODES[k][0] for k in NODE_NAMES], dtype=np.float64)
NODE_INDEX = {k: i for i, k in enumerate(NODE_NAMES)}
CENTER = np.array([0.0, -17.0, 4.0])


# ---------------------------------------------------------------- 隐式曲面
def sd_ellipsoid(p, c, r):
    q = (p - np.asarray(c, float)) / np.asarray(r, float)
    k0 = np.linalg.norm(q, axis=-1)
    k1 = np.linalg.norm(q / np.asarray(r, float), axis=-1)
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)


def sd_capsule(p, a, b, r):
    a, b = np.asarray(a, float), np.asarray(b, float)
    pa, ba = p - a, b - a
    h = np.clip(pa @ ba / (ba @ ba), 0, 1)
    return np.linalg.norm(pa - h[:, None] * ba, axis=-1) - r


def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)


def smax(a, b, k):
    return -smin(-a, -b, k)


def rot_x(p, c, deg):
    c = np.asarray(c, float)
    a = np.radians(deg)
    q = p - c
    y = q[:, 1] * np.cos(a) - q[:, 2] * np.sin(a)
    z = q[:, 1] * np.sin(a) + q[:, 2] * np.cos(a)
    return np.stack([q[:, 0], y, z], -1) + c


def sd_hemisphere(p, h):
    y = p[:, 1]
    q = p.copy()
    q[:, 0] = p[:, 0] / (1 + 0.10 * np.clip(-(y + 17) / 87, -1, 1))   # 顶枕部略宽、额部略窄
    d = sd_ellipsoid(q, (h * 34, -17, 12), (37, 87, 66))
    zcut = -21 + np.clip((y - 15) / 55, 0, 1) * 8 + np.clip(-(y + 35) / 55, 0, 1) * 15
    d = smax(d, zcut - p[:, 2], 9)
    tc = (h * 47, -18, -19)
    dt = sd_ellipsoid(rot_x(p, tc, 12), tc, (22, 45, 19))
    d = smin(d, dt, 4)
    d = d - 2.6 * (np.minimum(np.abs(gyri_field(p)), 1.2) - 0.55)      # 脑回隆起、脑沟下陷
    return smax(d, -h * p[:, 0] + 1.0, 2.0)


def sd_cerebrum(p):
    return np.minimum(sd_hemisphere(p, -1), sd_hemisphere(p, 1))


def sd_cerebellum(p):
    d = smin(sd_ellipsoid(p, (-24, -64, -36), (27, 26, 18)),
             sd_ellipsoid(p, (24, -64, -36), (27, 26, 18)), 8)
    return smin(d, sd_ellipsoid(p, (0, -60, -34), (12, 24, 17)), 6)


def sd_stem(p):
    d = sd_capsule(p, (0, -22, -10), (0, -36, -68), 9.5)
    return smin(d, sd_ellipsoid(p, (0, -27, -32), (15, 13, 12)), 6)


def _grad(f, p, e=0.4):
    g = np.empty_like(p)
    for i in range(3):
        dp = np.zeros(3)
        dp[i] = e
        g[:, i] = (f(p + dp) - f(p - dp)) / (2 * e)
    return g


def sample_surface(f, n, lo, hi, rng, band=0.9):
    pts, nrm = [], []
    have = 0
    while have < n:
        p = rng.uniform(lo, hi, size=(500000, 3))
        d = f(p)
        m = np.abs(d) < 4
        p, d = p[m], d[m]
        g = _grad(f, p)
        gn = np.linalg.norm(g, axis=1) + 1e-9
        keep = np.abs(d / gn) < band
        p, d, g, gn = p[keep], d[keep], g[keep], gn[keep]
        p = p - (d / gn ** 2)[:, None] * g
        pts.append(p)
        nrm.append(g / gn[:, None])
        have += len(p)
    return np.concatenate(pts)[:n], np.concatenate(nrm)[:n]


def sample_volume(f, n, lo, hi, rng, inside=-2.0):
    out, have = [], 0
    while have < n:
        p = rng.uniform(lo, hi, size=(300000, 3))
        p = p[f(p) < inside]
        out.append(p)
        have += len(p)
    return np.concatenate(out)[:n]


# ---------------------------------------------------------------- 纹理
def gyri_field(p, seed=7, k=11):
    rng = np.random.default_rng(seed)
    d = rng.normal(size=(k, 3))
    d /= np.linalg.norm(d, axis=1, keepdims=True)
    f = rng.uniform(0.15, 0.27, size=k)
    ph = rng.uniform(0, 2 * np.pi, size=k)
    v = np.sin(p @ (d * f[:, None]).T + ph).sum(1)
    return v / np.sqrt(k / 2)


def dist_to_polyline(p, pts):
    pts = np.asarray(pts, float)
    best = np.full(len(p), 1e9)
    for a, b in zip(pts[:-1], pts[1:]):
        ba = b - a
        h = np.clip((p - a) @ ba / (ba @ ba), 0, 1)
        best = np.minimum(best, np.linalg.norm(p - a - h[:, None] * ba, axis=1))
    return best


def catmull(ctrl, s):
    ctrl = np.asarray(ctrl, float)
    n = len(ctrl) - 1
    x = np.clip(s, 0, 1) * n
    i = np.minimum(x.astype(int), n - 1)
    u = (x - i)[:, None]
    p0 = ctrl[np.maximum(i - 1, 0)]
    p1, p2 = ctrl[i], ctrl[i + 1]
    p3 = ctrl[np.minimum(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u ** 2
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)


# ---------------------------------------------------------------- 组装
def build(seed=3):
    rng = np.random.default_rng(seed)
    P, N, B, G = [], [], [], []

    def add(p, n, b, g):
        P.append(p)
        N.append(n if n is not None else np.zeros_like(p))
        B.append(b)
        G.append(np.full(len(p), GROUPS[g], np.int8))

    lo, hi = np.array([-75, -110, -50.0]), np.array([75, 78, 82.0])
    p, n = sample_surface(sd_cerebrum, 74000, lo, hi, rng)
    medial = np.abs(p[:, 0]) < 2.5
    gy = np.abs(gyri_field(p))
    b = 0.10 + 0.90 * np.clip((gy - 0.10) / 0.45, 0, 1) ** 0.8
    for h in (-1, 1):
        cs = [(h * 4, -40, 76), (h * 25, -30, 70), (h * 45, -20, 56), (h * 58, -12, 38), (h * 63, -6, 24)]
        sf = [(h * 40, 20, -6), (h * 55, 2, 0), (h * 61, -20, 6), (h * 59, -38, 16), (h * 52, -52, 28)]
        side = (p[:, 0] * h) > 0
        for line, depth in ((cs, 0.85), (sf, 0.95)):
            d = dist_to_polyline(p, line)
            b = np.where(side, b * (1 - depth * np.exp(-(d / 2.6) ** 2)), b)
    add(p[~medial], n[~medial], b[~medial], "cortex")
    add(p[medial], n[medial], 0.3 * b[medial], "medial")

    lo2, hi2 = np.array([-55, -95, -58.0]), np.array([55, -30, -14.0])
    p, n = sample_surface(sd_cerebellum, 11000, lo2, hi2, rng)
    r = np.linalg.norm((p - np.array([0, -40, -32]))[:, 1:], axis=1)
    b = 0.15 + 0.85 * np.abs(np.sin(r * 1.35)) ** 3
    add(p, n, b, "cerebellum")

    lo3, hi3 = np.array([-20, -50, -80.0]), np.array([20, -8, -2.0])
    p, n = sample_surface(sd_stem, 3500, lo3, hi3, rng)
    b = 0.35 + 0.3 * np.abs(np.sin(p[:, 0] * 0.9))
    add(p, n, b, "stem")

    for h in (-1, 1):
        ctrl = [(h * 30, -6, -21), (h * 31, -18, -16), (h * 29, -30, -9), (h * 22, -39, 1), (h * 13, -41, 10)]
        s = rng.uniform(0, 1, 1800)
        c = catmull(ctrl, s)
        rad = (5.0 - 3.0 * s) * np.sqrt(rng.uniform(0, 1, len(s)))
        v = rng.normal(size=(len(s), 3))
        v /= np.linalg.norm(v, axis=1, keepdims=True)
        add(c + v * rad[:, None], None, np.full(len(s), 0.55), "hippo")

        q = rng.normal(size=(800, 3))
        q /= np.linalg.norm(q, axis=1, keepdims=True)
        q *= rng.uniform(0, 1, (800, 1)) ** (1 / 3)
        add(q * np.array([8, 14, 8]) + np.array([h * 11, -19, 6]), None, np.full(800, 0.35), "thalamus")

        q = rng.normal(size=(320, 3))
        q /= np.linalg.norm(q, axis=1, keepdims=True)
        q *= rng.uniform(0, 1, (320, 1)) ** (1 / 3)
        add(q * 6 + np.array([h * 23, -5, -18]), None, np.full(320, 0.45), "amygdala")

    s = rng.uniform(0, 1, 2400)
    cc = catmull([(0, 32, 6), (0, 28, 18), (0, 8, 24), (0, -18, 24), (0, -36, 16), (0, -40, 8)], s)
    cc = cc + np.stack([rng.uniform(-15, 15, len(s)) * (1 - 0.4 * np.abs(2 * s - 1)),
                        rng.normal(0, 0.8, len(s)), rng.normal(0, 1.4, len(s))], -1)
    add(cc, None, np.full(len(s), 0.28), "callosum")

    p = sample_volume(sd_cerebrum, 7000, lo, hi, rng)
    add(p, None, rng.uniform(0.05, 0.16, len(p)), "dust")

    P = np.concatenate(P).astype(np.float32)
    N = np.concatenate(N).astype(np.float32)
    B = np.concatenate(B).astype(np.float32)
    G = np.concatenate(G)
    R = rng.uniform(0, 1, (len(P), 4)).astype(np.float32)  # 相位、尺寸抖动、闪烁、错峰
    return dict(P=P, N=N, B=B, G=G, R=R)


def node_weights(P, sigma=10.0, cutoff=3.0):
    """稀疏矩阵 W[i, k]：粒子 i 受节点 k 激活点亮的权重。"""
    from scipy.sparse import csr_matrix
    rows, cols, vals = [], [], []
    for k, c in enumerate(NODE_POS):
        d2 = ((P - c) ** 2).sum(1)
        m = np.where(d2 < (cutoff * sigma) ** 2)[0]
        rows.append(m)
        cols.append(np.full(len(m), k))
        vals.append(np.exp(-d2[m] / (2 * sigma ** 2)))
    return csr_matrix((np.concatenate(vals).astype(np.float32),
                       (np.concatenate(rows), np.concatenate(cols))),
                      shape=(len(P), len(NODE_POS)))


def load(cache_dir):
    os.makedirs(cache_dir, exist_ok=True)
    f = os.path.join(cache_dir, "brain_v1.npz")
    if not os.path.exists(f):
        np.savez_compressed(f, **build())
    d = dict(np.load(f))
    return d


if __name__ == "__main__":
    import time
    t = time.time()
    d = build()
    print({k: v.shape for k, v in d.items()}, f"{time.time() - t:.1f}s")
    for name, g in GROUPS.items():
        print(name, int((d["G"] == g).sum()))
