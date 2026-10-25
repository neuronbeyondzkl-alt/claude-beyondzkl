"""粒子渲染器：透视投影 → 分层双线性溅射（景深）→ 辉光 → 色调映射。

全部是 t 的纯函数，没有帧间状态，所以可以多进程并行渲染任意帧。
"""
import cv2
import numpy as np

cv2.setNumThreads(1)

# ---------------------------------------------------------------- Loyel 色板
LOYEL = {
    10: "#F4F7FB", 20: "#E8EEF6", 30: "#CCDBEB", 40: "#9FBDDA", 50: "#6C9AC4",
    60: "#497DAE", 70: "#376392", 80: "#2E5076", 90: "#2B4868", 100: "#263B54",
}


def hex2rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], np.float32)


def srgb2lin(c):
    c = np.asarray(c, np.float32)
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4).astype(np.float32)


def _lin2srgb_exact(c):
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055).astype(np.float32)


_SRGB_N = 65536
_SRGB_LUT = _lin2srgb_exact(np.linspace(0, 1, _SRGB_N, dtype=np.float32))


def lin2srgb(c):
    """查表版 sRGB 编码（整帧用 np.power 太慢）。"""
    c = np.asarray(c, np.float32)
    if c.size < 4096:
        return _lin2srgb_exact(c)
    i = np.clip(c * (_SRGB_N - 1) + 0.5, 0, _SRGB_N - 1).astype(np.int32)
    return _SRGB_LUT[i]


def loyel(k, lin=True):
    c = hex2rgb(LOYEL[k])
    return srgb2lin(c) if lin else c


def _grade_lut():
    # (亮度, 颜色)：最暗处是 Color 100 压暗，往上依次经过 90 → 10
    stops = [(0.0, hex2rgb(LOYEL[100]) * 0.06), (0.06, hex2rgb(LOYEL[100]) * 0.45),
             (0.16, hex2rgb(LOYEL[90])), (0.27, hex2rgb(LOYEL[80])), (0.37, hex2rgb(LOYEL[70])),
             (0.47, hex2rgb(LOYEL[60])), (0.57, hex2rgb(LOYEL[50])), (0.69, hex2rgb(LOYEL[40])),
             (0.80, hex2rgb(LOYEL[30])), (0.90, hex2rgb(LOYEL[20])), (1.0, hex2rgb(LOYEL[10]))]
    x = np.linspace(0, 1, 1024)
    xs = np.array([p[0] for p in stops])
    cs = np.stack([p[1] for p in stops])
    return np.stack([np.interp(x, xs, cs[:, c]) for c in range(3)], 1).astype(np.float32)


GRADE_LUT = _grade_lut()


# ---------------------------------------------------------------- 几何工具
def rot_y(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]], np.float32)


def rot_x(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]], np.float32)


def rot_z(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], np.float32)


class Camera:
    def __init__(self, w, h, dist=4.2, fov_deg=34.0):
        self.w, self.h, self.dist = w, h, dist
        self.f = (h * 0.5) / np.tan(np.radians(fov_deg) / 2)

    def project(self, p):
        zc = self.dist - p[:, 2]
        zc = np.maximum(zc, 0.05)
        inv = self.f / zc
        xs = self.w * 0.5 + p[:, 0] * inv
        ys = self.h * 0.5 - p[:, 1] * inv
        return xs, ys, zc, inv

    def world_at(self, sx, sy, z=0.0):
        """屏幕像素 → z 平面上的世界坐标（用于把形体放到画面某处）。"""
        zc = self.dist - z
        return np.array([(sx - self.w * 0.5) * zc / self.f, -(sy - self.h * 0.5) * zc / self.f, z], np.float32)


# ---------------------------------------------------------------- 溅射
def splat(buf, xs, ys, rgb):
    """双线性溅射到 buf (h, w, 3)，rgb 为每粒子能量 (n, 3)。"""
    h, w = buf.shape[:2]
    x0 = np.floor(xs).astype(np.int32)
    y0 = np.floor(ys).astype(np.int32)
    fx = (xs - x0).astype(np.float32)
    fy = (ys - y0).astype(np.float32)
    ok = (x0 >= 0) & (x0 < w - 1) & (y0 >= 0) & (y0 < h - 1)
    if not ok.any():
        return
    x0, y0, fx, fy, rgb = x0[ok], y0[ok], fx[ok], fy[ok], rgb[ok]
    base = y0 * w + x0
    idx = np.concatenate([base, base + 1, base + w, base + w + 1])
    wts = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
    n = h * w
    flat = buf.reshape(n, 3)
    for c in range(3):
        flat[:, c] += np.bincount(idx, weights=wts * np.tile(rgb[:, c], 4), minlength=n).astype(np.float32)


# 景深层：(降采样倍数, 该分辨率下的高斯 σ, 对应全分辨率的模糊半径 px)
LAYERS = [(1, 0.75, 0.0), (2, 1.0, 2.2), (4, 1.15, 5.0), (8, 1.4, 11.0)]


class Renderer:
    def __init__(self, w=1920, h=1080, bloom=0.55):
        self.w, self.h = w, h
        self.cam = Camera(w, h)
        self.bloom = bloom
        self.sc = w / 1920.0
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2))
        self.vignette = (1.0 - 0.38 * np.clip(r - 0.35, 0, None) ** 1.6)[..., None].astype(np.float32)
        self.r = r
        self.vignette3 = np.repeat(self.vignette, 3, axis=2)
        self.lum_m = np.array([[0.2126, 0.7152, 0.0722]], np.float32)
        rng = np.random.default_rng(3)
        # 静态三角分布抖动，防止暗部色带（静态图案几乎不增加码率）
        self.dither = ((rng.random((h, w, 1)) + rng.random((h, w, 1)) - 1.0) / 255.0).astype(np.float32)

    def background(self, glow=1.0, tone=(90, 100), center=(0.5, 0.45)):
        """Loyel 色按亮度系数压暗的径向渐变（线性光）。"""
        c_in = srgb2lin(hex2rgb(LOYEL[tone[0]]) * 0.17 * glow)
        c_out = srgb2lin(hex2rgb(LOYEL[tone[1]]) * 0.045)
        cx, cy = center
        yy, xx = np.ogrid[0:self.h, 0:self.w]
        r = np.hypot((xx / self.w - cx) * 1.6, (yy / self.h - cy) * 1.0)
        k = np.clip(1.0 - r / 0.95, 0, 1) ** 1.8
        return (c_out + (c_in - c_out) * k[..., None]).astype(np.float32)

    def render(self, P, rgb, energy, blur_extra=None, focus=None, dof=1.0, bg=None, exposure=1.0,
               bloom=None, fog=0.0):
        """P (n,3) 世界坐标；rgb (n,3) 线性色；energy (n,) 亮度；blur_extra (n,) 额外模糊半径 px。
        返回线性光 HDR 图像 (h, w, 3)。"""
        cam = self.cam
        xs, ys, zc, inv = cam.project(P)
        vis = (energy > 1e-4) & (zc > 0.3)
        xs, ys, zc, inv, rgb, energy = xs[vis], ys[vis], zc[vis], inv[vis], rgb[vis], energy[vis]
        if blur_extra is not None:
            blur_extra = blur_extra[vis]
        focus = cam.dist if focus is None else focus
        coc = np.abs(zc - focus) * 7.5 * dof * self.sc
        if blur_extra is not None:
            coc = np.hypot(coc, blur_extra * self.sc)
        # 离镜头越近越亮一点
        e = energy * np.clip(inv / cam.f * cam.dist, 0.4, 2.5) ** 1.2
        if fog > 0:
            e = e * np.exp(-fog * np.maximum(zc - focus, 0))
        radii = np.array([l[2] for l in LAYERS], np.float32) * self.sc
        li = np.clip(np.searchsorted(radii, coc) - 1, 0, len(LAYERS) - 1)
        nxt = np.clip(li + 1, 0, len(LAYERS) - 1)
        span = np.maximum(radii[nxt] - radii[li], 1e-3)
        frac = np.where(nxt > li, np.clip((coc - radii[li]) / span, 0, 1), 0.0)
        out = np.zeros((self.h, self.w, 3), np.float32)
        for k, (ds, sig, _) in enumerate(LAYERS):
            wk = np.where(li == k, 1 - frac, 0) + np.where((nxt == k) & (nxt > li), frac, 0)
            sel = wk > 1e-3
            if not sel.any():
                continue
            hh, ww = self.h // ds, self.w // ds
            buf = np.zeros((hh, ww, 3), np.float32)
            # 在低分辨率层里，同样能量覆盖的面积更大，保持总能量守恒
            en = (e[sel] * wk[sel])[:, None] * rgb[sel]
            splat(buf, xs[sel] / ds - 0.5, ys[sel] / ds - 0.5, en)
            buf = cv2.GaussianBlur(buf, (0, 0), sig * max(self.sc, 0.5) if ds == 1 else sig)
            if ds > 1:
                buf = cv2.resize(buf, (self.w, self.h), interpolation=cv2.INTER_CUBIC) / (ds * ds)
            out += np.maximum(buf, 0)
        # 辉光
        bl = self.bloom if bloom is None else bloom
        if bl > 0:
            small = cv2.resize(out, (self.w // 4, self.h // 4), interpolation=cv2.INTER_AREA)
            b1 = cv2.GaussianBlur(small, (0, 0), 2.5)
            b2 = cv2.GaussianBlur(cv2.resize(small, (self.w // 16, self.h // 16), interpolation=cv2.INTER_AREA), (0, 0), 2.2)
            b2 = cv2.resize(b2, (self.w // 4, self.h // 4), interpolation=cv2.INTER_CUBIC)
            bb = cv2.resize(b1 * 0.55 + b2 * 0.45, (self.w, self.h), interpolation=cv2.INTER_CUBIC)
            out += np.maximum(bb, 0) * bl
        out *= exposure
        if bg is not None:
            out += bg
        return out

    def finish(self, hdr, grade=0.6):
        """色调映射 + 暗角 + Loyel 渐变映射 → sRGB 浮点 (h, w, 3)。

        渐变映射按亮度把画面重新着色到 Loyel 十档色阶上（暗 → 亮），再与原色按
        grade 混合，保证叠加发光后的颜色仍落在色板内，而不是泛成灰白。"""
        y = cv2.exp(-np.asarray(hdr, np.float32))
        y = cv2.multiply(1.0 - y, self.vignette3)
        s = lin2srgb(y)
        if grade > 0:
            lum = cv2.transform(s, self.lum_m)
            gm = GRADE_LUT[np.clip(lum * 1023, 0, 1023).astype(np.int32)[..., 0] if lum.ndim == 3 else np.clip(lum * 1023, 0, 1023).astype(np.int32)]
            s = cv2.addWeighted(s, 1 - grade, gm, grade, 0)
        return s

    def to_u8(self, srgb):
        return np.clip((srgb + self.dither) * 255.0 + 0.5, 0, 255).astype(np.uint8)
