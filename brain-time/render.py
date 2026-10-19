"""渲染引擎：粒子泼溅 + 景深 + 辉光 + 体积光 + 变形光斑 + 冲击波 + HUD 排版。

画面状态全部由 scenes.state(t) 给出，这里只负责"怎么画"。
所有颜色都取自 Loyel 渐变蓝十档色板（另加纯白高光）。
"""
import os
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

import geometry as G

W, H = 1920, 1080


def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.0


LOYEL = {10: "#F4F7FB", 20: "#E8EEF6", 30: "#CCDBEB", 40: "#9FBDDA", 50: "#6C9AC4",
         60: "#497DAE", 70: "#376392", 80: "#2E5076", 90: "#2B4868", 100: "#263B54"}
C = {k: hexrgb(v) for k, v in LOYEL.items()}
WHITE = np.ones(3, np.float32)


# ---------------------------------------------------------------- 相机
class Camera:
    def __init__(self, yaw=0.0, pitch=0.0, roll=0.0, dist=820.0, focal=4000.0,
                 look=(0, 0, 0), cx=W / 2, cy=H / 2, **_):
        a, b, r = np.radians([yaw, pitch, roll])
        Rz = np.array([[np.cos(a), -np.sin(a), 0], [np.sin(a), np.cos(a), 0], [0, 0, 1]])
        M0 = np.array([[0, 1, 0], [0, 0, 1], [1, 0, 0]], float)   # 默认：右半球朝向镜头，额叶在画面右侧
        Rx = np.array([[1, 0, 0], [0, np.cos(b), -np.sin(b)], [0, np.sin(b), np.cos(b)]])
        Rr = np.array([[np.cos(r), -np.sin(r), 0], [np.sin(r), np.cos(r), 0], [0, 0, 1]])
        self.M = (Rr @ Rx @ M0 @ Rz).astype(np.float32)
        self.look = np.asarray(look, np.float32)
        self.dist, self.f, self.cx, self.cy = dist, focal, cx, cy

    def view(self, P):
        return (P - self.look) @ self.M.T

    def project(self, P):
        V = self.view(P)
        z = np.maximum(self.dist - V[:, 2], 30.0)
        return self.cx + self.f * V[:, 0] / z, self.cy - self.f * V[:, 1] / z, z, V

    def project1(self, p):
        x, y, z, _ = self.project(np.asarray(p, np.float32)[None])
        return float(x[0]), float(y[0]), float(z[0])


# ---------------------------------------------------------------- 粒子累积缓冲
class Accum:
    SCALE = (1, 1, 2, 4)
    SIGMA = (0.65, 1.5, 1.5, 2.2)

    def __init__(self):
        self.items = [[] for _ in range(4)]

    def add(self, x, y, rgb, size):
        """x, y：像素坐标；rgb：(n,3) 能量；size：等效半径（像素）。"""
        cls = np.digitize(size, (1.25, 2.6, 6.5))
        for k in range(4):
            m = cls == k
            if m.any():
                self.items[k].append((x[m], y[m], rgb[m]))

    def resolve(self):
        out = np.zeros((H, W, 3), np.float32)
        for k in range(4):
            if not self.items[k]:
                continue
            s = self.SCALE[k]
            w, h = W // s, H // s
            x = np.concatenate([i[0] for i in self.items[k]]) / s - 0.5
            y = np.concatenate([i[1] for i in self.items[k]]) / s - 0.5
            rgb = np.concatenate([i[2] for i in self.items[k]]).astype(np.float32) / (s * s)
            m = (x > -1) & (x < w) & (y > -1) & (y < h)
            x, y, rgb = x[m], y[m], rgb[m]
            x0 = np.floor(x).astype(np.int32)
            y0 = np.floor(y).astype(np.int32)
            fx, fy = (x - x0)[:, None], (y - y0)[:, None]
            idx, wts = [], []
            for dx, dy, wt in ((0, 0, (1 - fx) * (1 - fy)), (1, 0, fx * (1 - fy)),
                               (0, 1, (1 - fx) * fy), (1, 1, fx * fy)):
                xi, yi = x0 + dx, y0 + dy
                ok = (xi >= 0) & (xi < w) & (yi >= 0) & (yi < h)
                idx.append((yi * w + xi)[ok])
                wts.append((rgb * wt)[ok])
            idx = np.concatenate(idx)
            wts = np.concatenate(wts)
            buf = np.empty((w * h, 3), np.float32)
            for c in range(3):
                buf[:, c] = np.bincount(idx, wts[:, c], minlength=w * h)
            buf = buf.reshape(h, w, 3)
            buf = cv2.GaussianBlur(buf, (0, 0), self.SIGMA[k])
            if s > 1:
                buf = cv2.resize(buf, (W, H), interpolation=cv2.INTER_LINEAR)
            out += buf
        return out


# ---------------------------------------------------------------- 文字
class Fonts:
    def __init__(self, font_dir):
        self.paths = {
            "sans": os.path.join(font_dir, "NotoSansSC.ttf"),
            "osw": os.path.join(font_dir, "Oswald.ttf"),
            "mont": os.path.join(font_dir, "Montserrat.ttf"),
        }
        self._f, self._img = {}, {}

    def font(self, fam, size, weight):
        key = (fam, size, weight)
        if key not in self._f:
            f = ImageFont.truetype(self.paths[fam], size)
            try:
                f.set_variation_by_axes([weight])
            except Exception:
                pass
            self._f[key] = f
        return self._f[key]

    def render(self, text, fam="sans", size=40, weight=400, tracking=0.0):
        """返回 (alpha 浮点图, 发光图)。tracking 为字距（相对字号）。"""
        key = (text, fam, size, weight, tracking)
        if key in self._img:
            return self._img[key]
        f = self.font(fam, size, weight)
        pad = int(size * 0.6) + 16
        if tracking == 0:
            l, t, r, b = f.getbbox(text)
            w, h = r - l, b - t
            im = Image.new("L", (w + 2 * pad, int(size * 1.5) + 2 * pad), 0)
            ImageDraw.Draw(im).text((pad - l, pad), text, font=f, fill=255)
        else:
            adv = [f.getlength(ch) for ch in text]
            w = int(sum(adv) + tracking * size * (len(text) - 1))
            im = Image.new("L", (w + 2 * pad, int(size * 1.5) + 2 * pad), 0)
            d = ImageDraw.Draw(im)
            x = pad
            for ch, a in zip(text, adv):
                d.text((x, pad), ch, font=f, fill=255)
                x += a + tracking * size
        a = np.asarray(im, np.float32) / 255.0
        ys, xs = np.nonzero(a > 0.002)
        if len(ys):
            y0, y1 = max(ys.min() - pad // 2, 0), min(ys.max() + pad // 2, a.shape[0])
            x0, x1 = max(xs.min() - pad // 2, 0), min(xs.max() + pad // 2, a.shape[1])
            a = a[y0:y1, x0:x1]
        glow = cv2.GaussianBlur(a, (0, 0), max(2.0, size * 0.18))
        self._img[key] = (a, glow)
        return a, glow


def blit(out, alpha, x, y, color, opacity=1.0, glow=None, glow_color=None, glow_gain=0.9,
         anchor="lt", scale=1.0):
    """把 alpha 图按颜色合成到 out（浮点 0..1）。anchor: lt/ct/cc/rt。"""
    if opacity <= 0.003:
        return
    if scale != 1.0:
        nh, nw = max(1, int(alpha.shape[0] * scale)), max(1, int(alpha.shape[1] * scale))
        alpha = cv2.resize(alpha, (nw, nh), interpolation=cv2.INTER_LINEAR)
        if glow is not None:
            glow = cv2.resize(glow, (nw, nh), interpolation=cv2.INTER_LINEAR)
    h, w = alpha.shape
    if anchor[0] == "c":
        x -= w / 2
    elif anchor[0] == "r":
        x -= w
    if anchor[1] == "c":
        y -= h / 2
    elif anchor[1] == "b":
        y -= h
    x, y = int(round(x)), int(round(y))
    x0, y0, x1, y1 = max(x, 0), max(y, 0), min(x + w, W), min(y + h, H)
    if x1 <= x0 or y1 <= y0:
        return
    a = alpha[y0 - y:y1 - y, x0 - x:x1 - x, None] * opacity
    region = out[y0:y1, x0:x1]
    if glow is not None:
        gc = glow_color if glow_color is not None else C[50]
        region += glow[y0 - y:y1 - y, x0 - x:x1 - x, None] * gc * glow_gain * opacity
    region *= (1 - a)
    region += a * color


# ---------------------------------------------------------------- 渲染器
class Renderer:
    def __init__(self, cache_dir, font_dir):
        geo = G.load(cache_dir)
        self.P = geo["P"] - G.CENTER.astype(np.float32)
        self.N, self.B, self.Gr, self.R = geo["N"], geo["B"], geo["G"], geo["R"]
        self.has_n = np.linalg.norm(self.N, axis=1) > 0.5
        self.Wn = G.node_weights(geo["P"]).tocsr()
        self.NODE_P = (G.NODE_POS - G.CENTER).astype(np.float32)
        self.fonts = Fonts(font_dir)
        rng = np.random.default_rng(5)
        # 粒子基色：#497DAE ↔ #9FBDDA 之间随机
        mix = self.R[:, 1:2]
        self.base_col = (C[60] * (1 - mix) + C[40] * mix).astype(np.float32)
        g = self.Gr
        self.base_col[g == G.GROUPS["dust"]] = C[70]
        self.base_col[g == G.GROUPS["hippo"]] = C[30]
        self.explode_dir = rng.normal(size=self.P.shape).astype(np.float32)
        self.explode_dir /= np.linalg.norm(self.explode_dir, axis=1, keepdims=True)
        self.explode_r = rng.uniform(140, 520, len(self.P)).astype(np.float32)
        self.wander_dir = rng.normal(size=self.P.shape).astype(np.float32)
        # 环境荧光尘埃（相机空间）
        n = 5200
        self.dust = np.stack([rng.uniform(-1300, 1300, n), rng.uniform(-620, 620, n),
                              rng.uniform(-1400, 640, n)], -1).astype(np.float32)
        self.dust_b = rng.uniform(0.2, 1.0, n).astype(np.float32) ** 2
        self.dust_ph = rng.uniform(0, 2 * np.pi, n).astype(np.float32)
        # 背景、暗角、星云、颗粒
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        r = np.sqrt(((xx - W * 0.5) / W) ** 2 + ((yy - H * 0.46) / H) ** 2 * 1.3)
        self.bg = (np.clip(1 - r * 1.55, 0, 1) ** 1.6)[..., None] * C[100] * 0.30 + C[100] * 0.018
        self.vignette = (1 - 0.55 * np.clip(r * 1.25 - 0.18, 0, 1) ** 1.5)[..., None].astype(np.float32)
        neb = np.zeros((270, 960), np.float32)
        for octv, amp in ((8, 1.0), (16, 0.5), (32, 0.25)):
            z = rng.uniform(0, 1, (270 // octv + 2, 960 // octv + 2)).astype(np.float32)
            neb += amp * cv2.resize(z, (960, 270), interpolation=cv2.INTER_CUBIC)
        neb = cv2.GaussianBlur(neb, (0, 0), 6)
        neb = (neb - neb.min()) / (neb.max() - neb.min())
        self.nebula = np.clip(neb - 0.35, 0, 1) ** 1.5
        self.grain = [rng.normal(0, 1, (H // 2, W // 2)).astype(np.float32) for _ in range(6)]
        self.xx, self.yy = xx, yy

    # ------------------------------------------------------------ 大脑
    def draw_brain(self, acc, cam, S):
        b = S["brain"]
        if b["alpha"] <= 0.001:
            return None
        P = self.P
        t = S["t"]
        morph = b.get("morph", 1.0)
        if morph < 0.999:
            # 爆炸 → 聚合：每个粒子错峰
            boom = b.get("boom", 1.0)
            ex = self.explode_dir * (self.explode_r * boom)[:, None]
            sw = b.get("swirl", 0.0)
            if sw:
                ca, sa = np.cos(sw), np.sin(sw)
                ex = np.stack([ex[:, 0] * ca - ex[:, 1] * sa, ex[:, 0] * sa + ex[:, 1] * ca, ex[:, 2]], -1)
            stagger = self.R[:, 3]
            k = np.clip((morph * 1.6 - stagger * 0.6), 0, 1)
            k = (k * k * (3 - 2 * k))[:, None]
            P = ex * (1 - k) + P * k
        if b.get("wander", 0) > 0:
            w = b["wander"]
            P = P + self.wander_dir * (w * 26.0) * (0.5 + 0.5 * np.sin(t * 0.7 + self.R[:, 0:1] * 6.28))
        if b.get("scale", 1.0) != 1.0:
            P = P * b["scale"]
        x, y, z, V = cam.project(P)

        # 光照：视空间固定主光 + 边缘光（玻璃感）
        Nv = self.N @ cam.M.T
        L = np.array([-0.35, 0.65, 0.68], np.float32)
        L /= np.linalg.norm(L)
        lam = np.clip(Nv @ L, 0, 1)
        rim = (1 - np.abs(Nv[:, 2])) ** 3
        shade = np.where(self.has_n, 0.22 + 0.85 * lam + 0.9 * rim, 0.75)
        fog = np.exp(-(z - cam.dist + 90) / 260.0).clip(0.25, 1.4)
        inten = self.B * shade * fog * b.get("gain", 1.0)

        # 节点激活 → 局部点亮
        acts = S["acts"]
        act = np.asarray(self.Wn @ acts).ravel().astype(np.float32) if acts.any() else 0.0
        # 扫描波（太鼓 / 去甲肾上腺素波等）
        for (kind, pos, front, width, amp) in b.get("waves", []):
            if kind == "plane":
                d = P[:, 1] - front
            else:
                d = np.linalg.norm(P - pos, axis=1) - front
            act = act + amp * np.exp(-(d / width) ** 2)
        # 随机放电闪烁
        rate = b.get("sparkle", 0.0)
        if rate > 0:
            fr = S["frame"]
            fl = ((self.R[:, 2] * 977.13 + fr * 0.61803) % 1.0) < rate
            act = act + fl * 1.6
        rgb = self.base_col * (inten * b["alpha"])[:, None]
        if np.ndim(act):
            hot = np.clip(act, 0, 2.2)[:, None]
            rgb = rgb + (C[30] * 0.55 + WHITE * 0.45) * hot * (0.32 * b["alpha"]) * fog[:, None]
        size = 1.05 * (cam.dist / z) * (cam.f / 4000.0) * (0.75 + 0.5 * self.R[:, 1])
        size = self.dof(size, z, S)
        streak = b.get("streak", 0.0)
        acc.add(x, y, rgb, size)
        if streak > 0:
            for i in range(1, 5):
                acc.add(x - streak * i * 0.25, y, rgb * (0.45 * (1 - i / 5.5)), size)
        return x, y, z

    def dof(self, size, z, S):
        d = S["fx"].get("dof", 0.0)
        if d <= 0:
            return size
        fz = S["fx"].get("focus_z", 820.0)
        blur = d * np.abs(z - fz) / 60.0
        return np.sqrt(size ** 2 + blur ** 2)

    # ------------------------------------------------------------ 其它点集
    def draw_points(self, acc, cam, S, P, rgb, size=1.3):
        if len(P) == 0:
            return
        x, y, z, _ = cam.project(np.asarray(P, np.float32))
        s = np.broadcast_to(np.asarray(size, np.float32), (len(P),)) * (cam.dist / z) * (cam.f / 4000.0)
        acc.add(x, y, np.asarray(rgb, np.float32), self.dof(s, z, S))

    def draw_dust(self, acc, cam, S):
        d = S["dust"]
        if d["alpha"] <= 0:
            return
        P = self.dust.copy()
        span = 2600.0
        P[:, 0] = (P[:, 0] + d["x"] + 1300) % span - 1300
        P[:, 1] = P[:, 1] + 14 * np.sin(S["t"] * 0.21 + self.dust_ph)
        vort = d.get("vortex", 0.0)
        if vort:
            r = np.hypot(P[:, 0], P[:, 1])
            ang = np.arctan2(P[:, 1], P[:, 0]) + d.get("spin", 0.0) * (1.2 - np.clip(r / 1300, 0, 1))
            r = r * vort
            P[:, 0], P[:, 1] = r * np.cos(ang), r * np.sin(ang)
        z = np.maximum(cam.dist - P[:, 2], 40.0)
        x = W / 2 + cam.f * P[:, 0] / z
        y = H / 2 - cam.f * P[:, 1] / z
        twinkle = 0.65 + 0.35 * np.sin(S["t"] * 1.7 + self.dust_ph * 3)
        b = self.dust_b * twinkle * d["alpha"] * (900.0 / z) ** 0.5
        col = np.where((self.dust_ph > 4.2)[:, None], C[30], C[50])
        rgb = col * b[:, None] * 0.55
        size = 1.0 * (900.0 / z) ** 1.15
        near = cam.dist - P[:, 2]
        size = np.where(near < 420, size + (420 - near) / 22.0, size)   # 前景粒子虚化成光斑
        streak = d.get("streak", 0.0)
        if streak > 1:
            k = 6
            for i in range(k):
                acc.add(x - streak * i / k * (900.0 / z), y, rgb / k * 1.4, size)
        else:
            acc.add(x, y, rgb, size)

    # ------------------------------------------------------------ 2D 光晕
    @staticmethod
    def add_glow(img_q, x, y, radius, rgb):
        """在 1/4 分辨率缓冲上叠加高斯光晕；x, y, radius 为全分辨率像素。"""
        hq, wq = img_q.shape[:2]
        xq, yq, rq = x / 4.0, y / 4.0, max(radius / 4.0, 0.6)
        r3 = int(rq * 3.2) + 2
        x0, x1 = int(max(xq - r3, 0)), int(min(xq + r3 + 1, wq))
        y0, y1 = int(max(yq - r3, 0)), int(min(yq + r3 + 1, hq))
        if x1 <= x0 or y1 <= y0:
            return
        gx = np.exp(-((np.arange(x0, x1) - xq) / rq) ** 2 / 2)
        gy = np.exp(-((np.arange(y0, y1) - yq) / rq) ** 2 / 2)
        img_q[y0:y1, x0:x1] += (gy[:, None] * gx[None, :])[..., None] * np.asarray(rgb, np.float32)

    # ------------------------------------------------------------ 主流程
    def render(self, S):
        cam = Camera(**S["cam"])
        acc = Accum()
        self.draw_dust(acc, cam, S)
        self.draw_brain(acc, cam, S)
        for P, rgb, size in S["points"]:
            self.draw_points(acc, cam, S, P, rgb, size)
        img = acc.resolve()

        # 节点 / 物体光晕（1/4 分辨率）
        q = np.zeros((H // 4, W // 4, 3), np.float32)
        for g in S["glows"]:
            pos, radius, rgb = g
            if len(pos) == 3:
                x, y, z = cam.project1(pos)
                radius = radius * (cam.f / 4000.0) * (cam.dist / z)
            else:
                x, y = pos
            self.add_glow(q, x, y, radius, rgb)
        fx = S["fx"]
        # 冲击波（1/4 分辨率环）
        for (cx, cy, rad, width, amp) in fx.get("shock", []):
            yy, xx = self.yy[::4, ::4], self.xx[::4, ::4]
            rr = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
            ring = np.exp(-((rr - rad) / width) ** 2) * amp
            q += ring[..., None] * (C[30] * 0.6 + WHITE * 0.4)
        img += cv2.resize(cv2.GaussianBlur(q, (0, 0), 1.2), (W, H), interpolation=cv2.INTER_LINEAR)

        # 辉光
        bloom = fx.get("bloom", 1.0)
        half = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        b1 = cv2.GaussianBlur(half, (0, 0), 5)
        quarter = cv2.resize(b1, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        b2 = cv2.GaussianBlur(quarter, (0, 0), 7)
        eighth = cv2.resize(b2, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
        b3 = cv2.GaussianBlur(eighth, (0, 0), 9)
        b2u = cv2.resize(b2 + cv2.resize(b3, (W // 4, H // 4)) * 0.8, (W // 2, H // 2))
        bl = cv2.resize(b1 * 0.5 + b2u * 0.55, (W, H))
        img += bl * bloom

        # 体积光（径向模糊）
        rays = fx.get("rays", 0.0)
        if rays > 0.01:
            rc = fx.get("ray_center", (W / 2, H / 2))
            if len(rc) == 3:
                rx, ry, _ = cam.project1(rc)
            else:
                rx, ry = rc
            src = np.maximum(quarter - 0.04, 0)
            accr = np.zeros_like(src)
            cxq, cyq = rx / 4, ry / 4
            n = 14
            for i in range(n):
                s = 1.0 - i * 0.032
                M = np.float32([[s, 0, cxq * (1 - s)], [0, s, cyq * (1 - s)]])
                accr += cv2.warpAffine(src, M, (W // 4, H // 4), flags=cv2.INTER_LINEAR) * (0.93 ** i)
            img += cv2.resize(accr * (rays / n * 2.2), (W, H)) * C[40] / max(C[40].max(), 1e-3)

        # 变形镜头横向光斑
        an = fx.get("anamorphic", 0.35)
        if an > 0.01:
            br = np.maximum(quarter.max(axis=2) - 0.22, 0)
            st = cv2.GaussianBlur(br, (0, 0), sigmaX=38, sigmaY=0.6)
            img += cv2.resize(st, (W, H))[..., None] * C[40] * an * 2.5

        # 色调映射 + 背景
        exposure = fx.get("exposure", 1.0)
        out = 1.0 - np.exp(-img * exposure)
        bgk = fx.get("bg", 1.0)
        if bgk > 0:
            neb_shift = int(S["t"] * 6) % 960
            neb = np.roll(self.nebula, -neb_shift, axis=1)
            neb = cv2.resize(neb, (W, H))[..., None] * C[80] * 0.10
            out += (self.bg + neb) * bgk * (1 - out)

        # 闪白
        fl = fx.get("flash", 0.0)
        if fl > 0:
            out += (C[10] - out) * min(fl, 1.0) * 0.9

        # HUD（由 scenes 提供的绘制回调）
        for draw in S["hud"]:
            draw(self, out, cam)

        # 暗角、颗粒
        out *= self.vignette
        g = self.grain[S["frame"] % len(self.grain)]
        out += cv2.resize(g, (W, H), interpolation=cv2.INTER_NEAREST)[..., None] * fx.get("grain", 0.012)

        # 遮幅
        lb = int(fx.get("letterbox", 0))
        if lb > 0:
            out[:lb] = 0
            out[H - lb:] = 0
        # 全局淡入淡出
        fade = fx.get("fade", 1.0)
        if fade < 1:
            out *= fade
        # 震动
        sx, sy = fx.get("shake", (0.0, 0.0))
        if abs(sx) + abs(sy) > 0.3:
            M = np.float32([[1, 0, sx], [0, 1, sy]])
            out = cv2.warpAffine(out, M, (W, H), borderMode=cv2.BORDER_REFLECT)
        return (np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)
