"""从 MNI ICBM152 2009a 标准脑模板生成大脑粒子点云与脑区标签。

模板随 nilearn 一同发布（灰质 / 白质概率图，1 mm 各向同性）。
皮层表面用 marching cubes 提取后按面积加权采样；深部结构（杏仁核、海马、
岛叶、扣带回等）按 MNI 坐标在灰质体素中采样。所有坐标单位为 mm，最后
统一缩放到世界坐标（约 ±1）。
"""
import os

import numpy as np
from scipy import ndimage

CACHE = os.path.join(os.path.dirname(__file__), "..", ".cache")
SCALE = 1.0 / 78.0          # mm → 世界坐标
CENTER_MM = np.array([0.0, -18.0, 12.0])

# 区域编号（REGION 数组里的值）
R_CORTEX, R_INTERIOR, R_PFC, R_ACC, R_AMY, R_HIP, R_INS, R_MPFC, R_PCC, R_ANG, R_DLPFC, R_LINK = range(12)
REGION_NAMES = ["cortex", "interior", "pfc", "acc", "amygdala", "hippocampus", "insula",
                "mpfc", "pcc", "angular", "dlpfc", "link"]


def _load():
    from nilearn import datasets
    gm = datasets.load_mni152_gm_template(resolution=1)
    wm = datasets.load_mni152_wm_template(resolution=1)
    g = np.asarray(gm.get_fdata(), np.float32)
    w = np.asarray(wm.get_fdata(), np.float32)
    if g.max() > 1.5:
        g /= 255.0
        w /= 255.0
    return g, w, gm.affine


def _vox2mm(ijk, aff):
    return ijk @ aff[:3, :3].T + aff[:3, 3]


def _sample_surface(verts, faces, normals, n, rng):
    a, b, c = verts[faces[:, 0]], verts[faces[:, 1]], verts[faces[:, 2]]
    area = 0.5 * np.linalg.norm(np.cross(b - a, c - a), axis=1)
    idx = rng.choice(len(faces), size=n, p=area / area.sum())
    u, v = rng.random(n), rng.random(n)
    flip = u + v > 1
    u[flip], v[flip] = 1 - u[flip], 1 - v[flip]
    pts = a[idx] + u[:, None] * (b[idx] - a[idx]) + v[:, None] * (c[idx] - a[idx])
    na, nb, nc = normals[faces[idx, 0]], normals[faces[idx, 1]], normals[faces[idx, 2]]
    nrm = (1 - u - v)[:, None] * na + u[:, None] * nb + v[:, None] * nc
    nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-6
    return pts, nrm


def _sample_voxels(mask, aff, n, rng, weight=None):
    ijk = np.argwhere(mask).astype(np.float32)
    if len(ijk) == 0:
        raise ValueError("empty ROI")
    p = None
    if weight is not None:
        wv = weight[mask]
        p = wv / wv.sum()
    idx = rng.choice(len(ijk), size=n, p=p)
    jit = rng.random((n, 3)).astype(np.float32) - 0.5
    return _vox2mm(ijk[idx] + jit, aff)


def _tube_mask(shape, aff, pts, radii):
    """沿折线（mm）生成管状掩膜。"""
    ijk = np.indices(shape).reshape(3, -1).T.astype(np.float32)
    mm = _vox2mm(ijk, aff)
    best = np.full(len(mm), np.inf, np.float32)
    for (p0, r0), (p1, r1) in zip(zip(pts[:-1], radii[:-1]), zip(pts[1:], radii[1:])):
        p0, p1 = np.asarray(p0, np.float32), np.asarray(p1, np.float32)
        d = p1 - p0
        t = np.clip(((mm - p0) @ d) / (d @ d), 0, 1)
        q = p0 + t[:, None] * d
        r = r0 + (r1 - r0) * t
        dist = np.linalg.norm(mm - q, axis=1) / r
        best = np.minimum(best, dist)
    return (best <= 1.0).reshape(shape)


def build(n_surface=44000, n_interior=4400, n_link=2400, seed=7):
    """返回 dict：pos (N,3) 世界坐标、region (N,) 区域编号、side (N,) -1 左 / +1 右、
    expo (N,) 0..1 暴露度（脑回 1、脑沟 0）、link_t (N,) 连线参数、link_id (N,)。"""
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"brain3_{n_surface}_{n_interior}_{n_link}_{seed}.npz")
    if os.path.exists(path):
        d = np.load(path)
        return {k: d[k] for k in d.files}

    from skimage import measure
    rng = np.random.default_rng(seed)
    g, w, aff = _load()
    brain = ndimage.gaussian_filter(g + w, 0.6)
    verts, faces, vnorm, _ = measure.marching_cubes(brain, level=0.5, step_size=1)
    verts_mm = _vox2mm(verts.astype(np.float32), aff)
    vnorm = vnorm @ aff[:3, :3].T  # skimage 的法线已指向数值减小的方向，即脑外
    surf, nrm = _sample_surface(verts_mm, faces, vnorm, n_surface, rng)

    # 暴露度：在平滑的脑掩膜里，脑沟深处被更多脑组织包围 → 值更高；两个尺度混合
    inv = np.linalg.inv(aff)
    ijk = surf @ inv[:3, :3].T + inv[:3, 3]
    expo = np.zeros(n_surface, np.float32)
    for sig, wgt in ((1.6, 0.6), (4.0, 0.4)):
        smooth = ndimage.gaussian_filter((brain > 0.5).astype(np.float32), sig)
        s = ndimage.map_coordinates(smooth, ijk.T, order=1)
        e = 1.0 - (s - np.percentile(s, 3)) / (np.percentile(s, 97) - np.percentile(s, 3))
        expo += wgt * np.clip(e, 0, 1)
    expo = expo.astype(np.float32)

    x, y, z = surf[:, 0], surf[:, 1], surf[:, 2]
    region = np.full(n_surface, R_CORTEX, np.int16)
    # 前额叶（额极 + 背外侧 + 眶额外侧），只取外表面
    region[(y > 22) & (z > -22)] = R_PFC
    # 默认模式网络外侧节点：双侧角回
    ang = np.linalg.norm(np.c_[np.abs(x) - 46, y + 64, z - 32], axis=1) < 19
    region[ang] = R_ANG
    dl = np.linalg.norm(np.c_[np.abs(x) - 40, y - 30, z - 30], axis=1) < 13
    surf_dl = dl.copy()

    # 深部结构（体素采样）
    shape = g.shape
    ijk_all = np.indices(shape).reshape(3, -1).T.astype(np.float32)
    mm_all = _vox2mm(ijk_all, aff).reshape(shape + (3,))
    X, Y, Z = mm_all[..., 0], mm_all[..., 1], mm_all[..., 2]
    gm = g > 0.35

    rois = []
    # 杏仁核：中心 (±23, -5, -18)
    for sx in (-1, 1):
        m = gm & ((((X - sx * 23) / 8) ** 2 + ((Y + 5) / 9) ** 2 + ((Z + 18) / 8) ** 2) <= 1)
        rois.append((R_AMY, sx, m, 700))
    # 海马：头 → 体 → 尾
    for sx in (-1, 1):
        line = [(sx * 25, -12, -21), (sx * 29, -22, -15), (sx * 30, -32, -8), (sx * 24, -40, 1)]
        m = _tube_mask(shape, aff, line, [6.0, 5.0, 4.5, 3.5]) & (g > 0.25)
        rois.append((R_HIP, sx, m, 800))
    # 岛叶
    for sx in (-1, 1):
        m = gm & (np.abs(X) > 30) & (np.abs(X) < 43) & (np.sign(X) == sx) & (Y > -24) & (Y < 26) & (Z > -14) & (Z < 20)
        m &= (((Y - 2) / 26) ** 2 + ((Z - 3) / 18) ** 2) <= 1
        rois.append((R_INS, sx, m, 900))
    # 前扣带回：环绕胼胝体膝部 (y≈18, z≈8) 的带状区
    r = np.hypot(Y - 16, Z - 6)
    ang_acc = np.degrees(np.arctan2(Z - 6, Y - 16))
    for sx in (-1, 1):
        m = gm & (np.abs(X) < 10) & (np.sign(X + 0.01) == sx) & (r > 11) & (r < 25) & (ang_acc > -55) & (ang_acc < 105)
        rois.append((R_ACC, sx, m, 800))
    # 内侧前额叶
    for sx in (-1, 1):
        m = gm & (np.abs(X) < 12) & (np.sign(X + 0.01) == sx) & (Y > 40) & (Y < 66) & (Z > -14) & (Z < 26)
        rois.append((R_MPFC, sx, m, 700))
    # 后扣带回 / 楔前叶
    for sx in (-1, 1):
        m = gm & (np.abs(X) < 12) & (np.sign(X + 0.01) == sx) & (Y > -66) & (Y < -36) & (Z > 12) & (Z < 44)
        rois.append((R_PCC, sx, m, 700))

    pts, regs, sides = [surf], [region], [np.sign(x + 1e-3).astype(np.int8)]
    for rid, sx, m, n in rois:
        p = _sample_voxels(m, aff, n, rng)
        pts.append(p)
        regs.append(np.full(n, rid, np.int16))
        sides.append(np.full(n, sx, np.int8))

    # 内部填充（白质，暗）
    wmask = w > 0.6
    p = _sample_voxels(wmask, aff, n_interior, rng)
    pts.append(p)
    regs.append(np.full(n_interior, R_INTERIOR, np.int16))
    sides.append(np.sign(p[:, 0] + 1e-3).astype(np.int8))

    # 节点中心（mm），用于连线与标签
    centers = {}
    allp = np.concatenate(pts)
    allr = np.concatenate(regs)
    alls = np.concatenate(sides)
    for rid in (R_PFC, R_ACC, R_AMY, R_HIP, R_INS, R_MPFC, R_PCC, R_ANG):
        for sx in (-1, 1):
            sel = (allr == rid) & (alls == sx)
            centers[(rid, sx)] = allp[sel].mean(axis=0)
    dl_l = surf[surf_dl & (x < 0)].mean(axis=0)
    dl_r = surf[surf_dl & (x > 0)].mean(axis=0)
    # dACC 节点取 ACC 的背侧部分
    acc_sel = (allr == R_ACC) & (allp[:, 2] > 14)
    dacc = allp[acc_sel].mean(axis=0)
    mpfc = allp[allr == R_MPFC].mean(axis=0)
    pcc = allp[allr == R_PCC].mean(axis=0)
    angL, angR = centers[(R_ANG, -1)], centers[(R_ANG, 1)]

    # 连线：DMN（mPFC–PCC、PCC–角回、mPFC–角回）+ 冥想者增强的耦合（PCC–dACC、PCC–dlPFC）
    links = [(mpfc, pcc, 0), (pcc, angL, 0), (pcc, angR, 0), (mpfc, angL, 0), (mpfc, angR, 0),
             (pcc, dacc, 1), (pcc, dl_l, 1), (pcc, dl_r, 1), (dacc, dl_l, 1), (dacc, dl_r, 1)]
    per = n_link // len(links)
    lpts, ltt, lid = [], [], []
    for k, (a, b, kind) in enumerate(links):
        t = rng.random(per).astype(np.float32)
        mid = (a + b) / 2 + np.array([0, 0, 22.0 + 6 * kind])  # 向上拱起的弧
        q = ((1 - t) ** 2)[:, None] * a + (2 * (1 - t) * t)[:, None] * mid + (t ** 2)[:, None] * b
        q += rng.normal(0, 0.9, q.shape)
        lpts.append(q)
        ltt.append(t)
        lid.append(np.full(per, k * 2 + kind, np.int16))  # 偶数 = DMN 连线，奇数 = 耦合连线
    nl = per * len(links)
    pts.append(np.concatenate(lpts))
    regs.append(np.full(nl, R_LINK, np.int16))
    sides.append(np.zeros(nl, np.int8))

    pos = (np.concatenate(pts) - CENTER_MM) * SCALE
    region = np.concatenate(regs)
    side = np.concatenate(sides)
    n_total = len(pos)
    expo_all = np.full(n_total, 0.55, np.float32)
    expo_all[:n_surface] = expo
    nrm_all = np.zeros((n_total, 3), np.float32)
    nrm_all[:n_surface] = np.c_[nrm[:, 0], nrm[:, 2], nrm[:, 1]]
    link_t = np.zeros(n_total, np.float32)
    link_id = np.full(n_total, -1, np.int16)
    link_t[-nl:] = np.concatenate(ltt)
    link_id[-nl:] = np.concatenate(lid)
    # MNI: x 右, y 前, z 上 → 世界: x 右, y 上, z 朝向观众（前方）
    world = np.c_[pos[:, 0], pos[:, 2], pos[:, 1]].astype(np.float32)

    cen = {f"{REGION_NAMES[k[0]]}_{'L' if k[1] < 0 else 'R'}": v for k, v in centers.items()}
    cen.update(dacc=dacc, mpfc_c=mpfc, pcc_c=pcc, dlpfc_L=dl_l, dlpfc_R=dl_r)
    cen_world = {k: np.array([(v[0] - CENTER_MM[0]) * SCALE, (v[2] - CENTER_MM[2]) * SCALE,
                              (v[1] - CENTER_MM[1]) * SCALE], np.float32) for k, v in cen.items()}

    out = dict(pos=world, normal=nrm_all, region=region, side=side, expo=expo_all, link_t=link_t, link_id=link_id,
               **{"c_" + k: v for k, v in cen_world.items()})
    np.savez_compressed(path, **out)
    return out


if __name__ == "__main__":
    import time
    t0 = time.time()
    b = build()
    print("points", len(b["pos"]), "time", round(time.time() - t0, 1))
    print("extent", b["pos"].min(0), b["pos"].max(0))
    for i, nme in enumerate(REGION_NAMES):
        print(nme, int((b["region"] == i).sum()))
    print([k for k in b if k.startswith("c_")])
