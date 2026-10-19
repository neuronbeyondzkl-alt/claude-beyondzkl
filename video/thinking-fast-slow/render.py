"""《思考，快与慢》视频画面渲染器：光、影、荧光粒子。

所有动画都是时间的解析函数（没有逐帧积分的状态），所以任意一帧都能单独算出来，
可以把整片切成几段并行渲染。节拍、重击、字幕时间全部来自 timeline.py。

用法：
  python3 render.py --still 8.2 21.6 63      # 按小节号导出预览帧 PNG
  python3 render.py --out build/video.mp4 --audio build/music.wav --workers 4
"""
import argparse
import os
import subprocess
import sys
import time

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import timeline as TL

cv2.setNumThreads(1)
W, H, FPS = TL.W, TL.H, TL.FPS
HERE = os.path.dirname(os.path.abspath(__file__))


# ============================================================ Loyel 渐变蓝
def hexrgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.float32) / 255.0


C10, C20, C30, C40, C50 = (hexrgb(h) for h in ("#F4F7FB", "#E8EEF6", "#CCDBEB", "#9FBDDA", "#6C9AC4"))
C60, C70, C80, C90, C100 = (hexrgb(h) for h in ("#497DAE", "#376392", "#2E5076", "#2B4868", "#263B54"))
PCOL = np.stack([C10, C30, C40, C50, C60])          # 粒子颜色
PCOL_W = np.array([0.14, 0.28, 0.30, 0.20, 0.08])

NOTO = "/usr/share/fonts/opentype/noto/"
INTER = "/usr/share/fonts/opentype/inter/"
FONTS = {
    "serif_black": (NOTO + "NotoSerifCJK-Black.ttc", 2),
    "serif_bold": (NOTO + "NotoSerifCJK-Bold.ttc", 2),
    "serif_light": (NOTO + "NotoSerifCJK-Light.ttc", 2),
    "sans_black": (NOTO + "NotoSansCJK-Black.ttc", 2),
    "sans_medium": (NOTO + "NotoSansCJK-Medium.ttc", 2),
    "sans_light": (NOTO + "NotoSansCJK-Light.ttc", 2),
    "inter_light": (INTER + "Inter-Light.otf", 0),
    "interd_bold": (INTER + "InterDisplay-Bold.otf", 0),
    "interd_black": (INTER + "InterDisplay-Black.otf", 0),
}


def S(font, size, color, glow=C50, gk=0.5, track=0, **kw):
    d = dict(font=font, size=size, color=color, glow=glow, gk=gk, track=track)
    d.update(kw)
    return d


STYLES = {
    "intro": S("serif_light", 66, C30, C50, 0.55, 6),
    "title": S("serif_black", 176, C10, C40, 0.8, 10),
    "chapter": S("serif_black", 132, C10, C40, 0.9, 8),
    "heading": S("serif_bold", 104, C10, C50, 0.7, 4),
    "rapid": S("serif_black", 156, C10, C40, 1.0, 6),
    "giant": S("serif_black", 330, C10, C40, 1.1, 0),
    "big": S("serif_bold", 78, C10, C50, 0.55, 3),
    "body_big": S("sans_medium", 54, C20, C60, 0.35, 2),
    "body": S("sans_medium", 46, C30, C60, 0.3, 2),
    "sub": S("sans_light", 44, C30, C60, 0.35, 6),
    "label": S("sans_light", 30, C40, C60, 0.3, 8),
    "en": S("inter_light", 30, C40, C60, 0.35, 12, upper=True),
    "en_big": S("inter_light", 42, C30, C50, 0.45, 16),
    "en_huge": S("interd_bold", 150, C10, C40, 0.9, 22),
    "mono": S("interd_bold", 72, C10, C50, 0.5, 4),
    "stat": S("interd_black", 200, C10, C40, 1.0, 4),
    "stat_cn": S("sans_black", 150, C10, C40, 0.9, 4),
    "num": S("interd_black", 300, C10, C40, 1.0, 4),
    "digit": S("interd_black", 620, C10, C40, 1.0, 0),
    "note": S("sans_light", 26, C50, C60, 0.2, 2),
    "note_b": S("sans_medium", 32, C40, C60, 0.35, 4),
    "quote": S("serif_light", 58, C20, C50, 0.45, 4),
}

_FONT_CACHE, _GLYPH_CACHE, _VC_CACHE = {}, {}, {}


def get_font(key, size):
    k = (key, size)
    if k not in _FONT_CACHE:
        path, idx = FONTS[key]
        _FONT_CACHE[k] = ImageFont.truetype(path, size, index=idx)
    return _FONT_CACHE[k]


def glyph(key, size, ch):
    k = (key, size, ch)
    if k not in _GLYPH_CACHE:
        font = get_font(key, size)
        asc, desc = font.getmetrics()
        pad = int(size * 0.3)
        adv = font.getlength(ch)
        w, h = int(np.ceil(adv)) + 2 * pad, asc + desc + 2 * pad
        img = Image.new("L", (w, h))
        if ch.strip():
            ImageDraw.Draw(img).text((pad, pad + asc), ch, font=font, fill=255, anchor="ls")
        _GLYPH_CACHE[k] = (np.asarray(img, np.float32) / 255.0, adv, pad)
    return _GLYPH_CACHE[k]


def visual_center(key, size):
    """用参考字“国”的墨迹算出行的视觉中心（相对画布顶部）。"""
    k = (key, size)
    if k not in _VC_CACHE:
        m, _, _ = glyph(key, size, "国" if "inter" not in key else "H")
        rows = np.where(m.max(axis=1) > 0.3)[0]
        _VC_CACHE[k] = 0.5 * (rows[0] + rows[-1]) if len(rows) else m.shape[0] / 2
    return _VC_CACHE[k]


def clamp01(x):
    return np.clip(x, 0.0, 1.0)


def ease_out_cubic(p):
    return 1 - (1 - p) ** 3


def ease_out_expo(p):
    return np.where(p >= 1, 1.0, 1 - 2.0 ** (-10 * p))


def hash01(*a):
    h = 2166136261
    for v in a:
        h = ((h ^ (int(v) & 0xFFFFFFFF)) * 16777619) & 0xFFFFFFFF
    return (h % 100000) / 100000.0


# ============================================================ 文字
class TextItem:
    def __init__(self, d, idx=0):
        self.d, self.idx = d, idx
        st = self.st = STYLES[d["style"]]
        key, size = st["font"], st["size"]
        if d.get("segs"):
            chars, times = [], []
            for s, tb in d["segs"]:
                chars += list(s)
                times += [TL.sec(tb)] * len(s)
        else:
            chars = list(d["text"])
            times = [TL.sec(d["t0"])] * len(chars)
        if st.get("upper"):
            chars = [c.upper() for c in chars]
        self.glyphs = []
        x = 0.0
        pad = 0
        for ch, ts in zip(chars, times):
            m, adv, pad = glyph(key, size, ch)
            self.glyphs.append([m, x, ts, ch.strip() != ""])
            x += adv + st["track"]
        self.pad = pad
        self.width = max(1.0, x - st["track"])
        gh = glyph(key, size, "国")[0].shape[0]
        self.cw = int(np.ceil(self.width)) + 2 * pad + 2
        self.chh = gh
        self.vc = visual_center(key, size)
        self.t_in, self.t_out = TL.sec(d["t0"]), TL.sec(d["t1"])
        self.align = d.get("align", "center")
        self.lx = pad + (self.width / 2 if self.align == "center" else 0.0)
        self._steady = None

    def steady(self):
        """全部字形就位时的画布（rgb 预乘、alpha），缓存起来。"""
        if self._steady is None:
            rgb = np.zeros((self.chh, self.cw, 3), np.float32)
            a = np.zeros((self.chh, self.cw), np.float32)
            for m, gx, ts, ink in self.glyphs:
                if not ink:
                    continue
                x0 = int(round(gx))
                h, w = m.shape
                w = min(w, self.cw - x0)
                a[:h, x0:x0 + w] = np.maximum(a[:h, x0:x0 + w], m[:, :w])
            rgb[:] = a[..., None] * self.st["color"]
            self._steady = (rgb, a)
        return self._steady

    def mask_points(self, n, rng):
        """粒子聚字用：在字形墨迹里采样 n 个屏幕坐标。"""
        _, a = self.steady()
        ys, xs = np.nonzero(a > 0.45)
        if len(xs) == 0:
            return np.full((n, 2), [W / 2, H / 2], np.float32)
        k = rng.integers(0, len(xs), n)
        px = xs[k] + rng.random(n)
        py = ys[k] + rng.random(n)
        ox = self.d["x"] * W - self.lx
        oy = self.d["y"] * H - self.vc
        return np.stack([px + ox, py + oy], axis=1).astype(np.float32)

    def render(self, t, frame):
        d = self.d
        if t < self.t_in - 1e-6 or t > self.t_out + 0.02:
            return None
        inn, out = d.get("inn", "rise"), d.get("out", "fade")
        size = self.st["size"]
        alpha, scale, blur, dy, boost = 1.0, 1.0, 0.0, 0.0, 1.0
        per_glyph = False
        age = t - self.t_in
        if inn == "rise":
            p = clamp01(age / 0.42)
            e = ease_out_cubic(p)
            alpha, dy, blur = e, (1 - e) * 36, (1 - e) * 6
        elif inn == "fade":
            alpha = clamp01(age / 0.35)
        elif inn == "slam":
            p = clamp01(age / 0.22)
            scale = 1 + 0.42 * (1 - float(ease_out_expo(p)))
            alpha = clamp01(age / 0.05)
            boost = 1 + 1.3 * np.exp(-age / 0.25)
        elif inn == "glitch":
            boost = 1 + 1.0 * np.exp(-age / 0.2)
            if age < 0.3:
                alpha = 1.0 if hash01(frame, self.idx, 7) > 0.3 else 0.25
        elif inn in ("reveal", "pop"):
            per_glyph = age < (len(self.glyphs) * d.get("stagger", 0.05) + 0.6 if inn == "reveal" else
                               max(g[2] for g in self.glyphs) - self.t_in + 0.3)
            if inn == "pop":
                boost = 1.0
        # 退场
        rem = self.t_out - t
        if out == "cut":
            if rem <= 0:
                return None
        elif out == "fade":
            k = clamp01(rem / 0.3)
            alpha *= k
            blur += (1 - k) * 5
        elif out == "blur":
            k = clamp01(rem / 0.35)
            alpha *= k
            blur += (1 - k) * 14
            scale *= 1 + 0.05 * (1 - k)
        elif out == "shatter":
            k = clamp01(rem / 0.1)
            alpha *= k
            boost *= 1 + (1 - k) * 1.5
        elif out == "implode":
            k = clamp01(rem / 0.28)
            alpha *= k ** 0.6
            scale *= 0.2 + 0.8 * k ** 1.5
            blur += (1 - k) * 6
        if alpha <= 0.003:
            return None

        if per_glyph:
            rgb = np.zeros((self.chh + 60, self.cw, 3), np.float32)
            a = np.zeros((self.chh + 60, self.cw), np.float32)
            stg = d.get("stagger", 0.05)
            for i, (m, gx, ts, ink) in enumerate(self.glyphs):
                if not ink:
                    continue
                if inn == "reveal":
                    g0 = self.t_in + i * stg
                    p = clamp01((t - g0) / 0.45)
                    e = ease_out_cubic(p)
                    ga, gdy, gbl, gs, gb = e, (1 - e) * 0.22 * size, (1 - e) * 7, 1.0, 1 + 0.8 * (1 - p) * (p > 0)
                else:
                    p = clamp01((t - ts) / 0.16)
                    ga = clamp01((t - ts) / 0.05)
                    gdy, gbl = 0.0, 0.0
                    gs = 1 + 0.5 * (1 - ease_out_cubic(p))
                    gb = 1 + 1.4 * np.exp(-max(0.0, t - ts) / 0.2) * (t >= ts)
                if ga <= 0.003:
                    continue
                mm = m
                if gbl > 0.6:
                    mm = cv2.GaussianBlur(mm, (0, 0), gbl)
                if abs(gs - 1) > 0.01:
                    hh, ww = mm.shape
                    big = cv2.resize(mm, (int(ww * gs), int(hh * gs)), interpolation=cv2.INTER_LINEAR)
                    oy, ox = (big.shape[0] - hh) // 2, (big.shape[1] - ww) // 2
                    mm = big[oy:oy + hh, ox:ox + ww]
                x0, y0 = int(round(gx)), int(round(gdy)) + 30
                hh, ww = mm.shape
                ww = min(ww, self.cw - x0)
                hh = min(hh, a.shape[0] - y0)
                if ww <= 0 or hh <= 0:
                    continue
                sub = mm[:hh, :ww] * ga
                a[y0:y0 + hh, x0:x0 + ww] = np.maximum(a[y0:y0 + hh, x0:x0 + ww], sub)
                rgb[y0:y0 + hh, x0:x0 + ww] += sub[..., None] * self.st["color"] * gb
            rgb = np.minimum(rgb, 1.6)
            vc = self.vc + 30
        else:
            rgb, a = self.steady()
            vc = self.vc
        return dict(rgb=rgb, a=a, alpha=alpha, scale=scale, blur=blur, dy=dy, boost=boost, vc=vc)


# ============================================================ 背景纹理
def tile_noise(n, sigma, rng):
    x = rng.standard_normal((n, n))
    f = np.fft.fftfreq(n)
    g = np.exp(-(f[:, None] ** 2 + f[None, :] ** 2) * (2 * np.pi * sigma) ** 2 / 2)
    y = np.real(np.fft.ifft2(np.fft.fft2(x) * g))
    y = (y - y.mean()) / (y.std() + 1e-9)
    return y.astype(np.float32)


def periodic_noise1d(n, sigma, rng):
    x = rng.standard_normal(n)
    f = np.fft.fftfreq(n)
    y = np.real(np.fft.ifft(np.fft.fft(x) * np.exp(-(f * 2 * np.pi * sigma) ** 2 / 2)))
    return ((y - y.mean()) / (y.std() + 1e-9)).astype(np.float32)


def sample_wrap(tex2, ox, oy, w, h):
    """在 2×2 平铺的纹理上做亚像素平移采样。"""
    n = tex2.shape[0] // 2
    ox, oy = ox % n, oy % n
    ix, iy = int(ox), int(oy)
    fx, fy = ox - ix, oy - iy
    a = tex2[iy:iy + h + 1, ix:ix + w + 1]
    top = a[:-1, :-1] * (1 - fx) + a[:-1, 1:] * fx
    bot = a[1:, :-1] * (1 - fx) + a[1:, 1:] * fx
    return top * (1 - fy) + bot * fy


# ============================================================ 渲染器
class Renderer:
    def __init__(self, seed=7):
        rng = np.random.default_rng(seed)
        self.rng = rng
        t0 = time.time()
        # ---- 时间轴上的积分量（速度 → 粒子时间，风 → 位移）
        dt = 1.0 / (FPS * 8)
        self.tg = np.arange(0, TL.DURATION + 1, dt)
        tb = self.tg / TL.BAR
        self.VK = {k: np.array(v, np.float64) for k, v in TL.VIS.items()}
        sp = self.vis("speed", tb)
        self.TAU = np.cumsum(sp) * dt
        self.WX = np.cumsum(self.vis("wind_x", tb)) * dt
        self.WY = np.cumsum(self.vis("wind_y", tb)) * dt
        self.WARP = np.cumsum(self.vis("warp", tb) * (0.3 + 1.2 * self.vis("warp", tb))) * dt
        # ---- 鼓点与重击
        ev = TL.drum_events()
        self.kicks = np.array([(t, v) for t, i, v in ev if i in ("kick", "taiko")])
        self.snares = np.array([(t, v) for t, i, v in ev if i == "snare"])
        self.hits = [(TL.sec(b), s, k) for b, s, k in TL.HITS]
        # ---- 粒子
        self.NH, self.NB, self.NK = 16000, 7400, 600
        N = self.N = self.NH + self.NB + self.NK
        z = np.concatenate([rng.uniform(0.35, 0.8, self.NH), rng.uniform(0.0, 0.35, self.NB),
                            rng.uniform(0.88, 1.0, self.NK)]).astype(np.float32)
        self.z = z
        M = 140
        self.M = M
        self.hx = rng.uniform(-M, W + M, N).astype(np.float32)
        self.hy = rng.uniform(-M, H + M, N).astype(np.float32)
        ang = rng.uniform(0, 2 * np.pi, N)
        vm = rng.uniform(4, 18, N) * (0.4 + 0.6 * z)
        self.vx, self.vy = (np.cos(ang) * vm).astype(np.float32), (np.sin(ang) * vm).astype(np.float32)
        self.A1 = (rng.uniform(8, 40, N) * (0.4 + 0.6 * z)).astype(np.float32)
        self.A2 = rng.uniform(4, 16, N).astype(np.float32)
        self.w1 = rng.uniform(0.15, 0.6, N).astype(np.float32)
        self.w2 = rng.uniform(0.5, 1.4, N).astype(np.float32)
        self.p = rng.uniform(0, 2 * np.pi, (4, N)).astype(np.float32)
        b = 0.25 + 0.75 * rng.random(N) ** 2
        b[rng.random(N) < 0.04] *= 2.2
        b[self.NH:self.NH + self.NB] *= 0.6
        b[self.NH + self.NB:] *= 0.22
        self.b = b.astype(np.float32)
        self.col = PCOL[rng.choice(len(PCOL), N, p=PCOL_W)].astype(np.float32)
        self.twf = rng.uniform(0.5, 3.0, N).astype(np.float32)
        self.rank = rng.random(N).astype(np.float32)
        self.layer = np.zeros(N, np.int8)                 # 0 细 1 柔 2 散景
        self.layer[: self.NH][rng.random(self.NH) < 0.22] = 1
        self.layer[self.NH + self.NB:] = 2
        self.dfac = (0.25 + 0.75 * z).astype(np.float32)
        # ---- 跃迁星（上升音段）
        K = self.WK = 1500
        self.wth = rng.uniform(0, 2 * np.pi, K).astype(np.float32)
        self.wu0 = rng.random(K).astype(np.float32)
        self.wsp = rng.uniform(0.5, 1.2, K).astype(np.float32)
        self.wcol = PCOL[rng.choice(3, K)].astype(np.float32)
        # ---- 字幕
        self.items = [TextItem(d, i) for i, d in enumerate(TL.TEXTS)]
        # ---- 粒子聚形
        self.forms = [self.build_form(f, i) for i, f in enumerate(TL.FORMS)]
        # ---- 背景
        self.bw, self.bh = W // 4, H // 4
        yy, xx = np.mgrid[0:self.bh, 0:self.bw].astype(np.float32)
        r = np.sqrt(((xx - self.bw / 2) / self.bw) ** 2 + ((yy - self.bh * 0.45) / self.bh) ** 2)
        g = np.exp(-r ** 2 / 0.18)[..., None]
        self.base = (C100 * (0.07 + 0.26 * g) + C90 * 0.02 * (1 - yy / self.bh)[..., None]).astype(np.float32)
        self.bxx, self.byy = xx, yy
        n1 = tile_noise(512, 18, rng)
        n2 = tile_noise(512, 7, rng)
        self.fog1 = np.tile(n1, (2, 2))
        self.fog2 = np.tile(n2, (2, 2))
        self.ray1 = periodic_noise1d(4096, 6, rng)
        self.ray2 = periodic_noise1d(4096, 20, rng)
        Yf, Xf = np.mgrid[0:H, 0:W].astype(np.float32)
        rr = np.sqrt(((Xf - W / 2) / (W / 2)) ** 2 + ((Yf - H / 2) / (H / 2)) ** 2) / np.sqrt(2)
        self.vig = (1 - 0.48 * rr ** 2.2).astype(np.float32)[..., None]
        # 胶片颗粒：逐帧随机噪声会让码率翻倍，默认关闭，可用环境变量 TFS_GRAIN=0.011 打开
        ga = float(os.environ.get("TFS_GRAIN", "0"))
        self.grain = [(rng.standard_normal((H, W)).astype(np.float32) * ga) for _ in range(6)] if ga > 0 else None
        self.ax4096 = np.arange(4096, dtype=np.float32)
        self.txt_rgb = np.zeros((H, W, 3), np.float32)
        self.txt_a = np.zeros((H, W), np.float32)
        self.last_box = (0, 0, 0, 0)
        print("renderer ready %.1fs" % (time.time() - t0), file=sys.stderr)

    # ---------------------------------------------------- 参数
    def vis(self, key, tb):
        k = self.VK[key]
        return np.interp(tb, k[:, 0], k[:, 1])

    def integ(self, arr, t):
        return np.interp(t, self.tg, arr)

    def env(self, events, t, tau, window=0.8):
        if len(events) == 0:
            return 0.0
        dtv = t - events[:, 0]
        m = (dtv >= 0) & (dtv < window)
        return float(np.sum(events[m, 1] * np.exp(-dtv[m] / tau)))

    def hit_fx(self, t):
        flash = shake = zoom = 0.0
        sx = sy = 0.0
        stream = 0.0
        FL = {"braam": 0.9, "braam_big": 1.15, "slam": 1.3, "stab": 0.55, "stab_big": 0.85, "hit": 0.35,
              "soft": 0.12, "glitch": 0.35, "tail": 0.6}
        SH = {"braam": 22, "braam_big": 30, "slam": 34, "stab": 12, "stab_big": 20, "hit": 7, "soft": 0,
              "glitch": 10, "tail": 14}
        for k, (th, s, kind) in enumerate(self.hits):
            d = t - th
            if d < 0 or d > 2.5:
                continue
            flash += s * FL[kind] * np.exp(-d / 0.07)
            a = s * SH[kind] * np.exp(-d / 0.17)
            sx += a * np.sin(2 * np.pi * 21 * d + k * 1.7)
            sy += a * np.cos(2 * np.pi * 17 * d + k * 2.3)
            zoom += s * (0.05 if SH[kind] > 15 else 0.025) * np.exp(-d / 0.24)
            stream += s * FL[kind] * np.exp(-d / 0.5)
        return flash, sx, sy, zoom, stream

    # ---------------------------------------------------- 聚形
    def build_form(self, f, fi):
        rng = np.random.default_rng(1000 + fi)
        if f.get("all"):
            idx = np.arange(self.N)
        else:
            start = int(f.get("offset", 0.0) * self.NH)
            m = min(int(f.get("frac", 0.6) * self.NH), self.NH - start)
            idx = np.arange(start, start + m)
        M = len(idx)
        kind = f["kind"]
        cx, cy = f.get("x", 0.5) * W, f.get("y", 0.5) * H
        if kind == "text":
            ti = TextItem(dict(text=f["text"], style=f["style"], x=f["x"], y=f["y"], t0=f["t0"], t1=f["t1"]))
            pts = ti.mask_points(M, rng)
        elif kind == "point":
            r = 4 + 34 * np.sqrt(rng.random(M))
            a = rng.uniform(0, 2 * np.pi, M)
            pts = np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1)
        elif kind == "rings":
            k = (rng.random(M) < 0.68)
            a = rng.uniform(0, 2 * np.pi, M)
            R = np.where(k, 0.17 * H, 0.06 * H) + rng.normal(0, 2.8, M)
            ox = np.where(k, 0.0, 0.04 * W)
            oy = np.where(k, 0.0, 0.006 * H)
            pts = np.stack([cx + ox + R * np.cos(a), cy + oy + R * np.sin(a)], 1)
        elif kind == "value_curve":
            hw, vs = 0.20 * W, 0.12 * H
            n_c = int(M * 0.62)
            xs = rng.uniform(-1, 1, n_c)
            v = np.where(xs >= 0, np.abs(xs) ** 0.88, -2.25 * np.abs(xs) ** 0.88)
            curve = np.stack([cx + xs * hw, cy - v * vs], 1) + rng.normal(0, 2.4, (n_c, 2))
            n_a = M - n_c
            na1 = n_a // 2
            ax = np.stack([cx + rng.uniform(-1.08, 1.08, na1) * hw, cy + rng.normal(0, 1.0, na1)], 1)
            ay = np.stack([cx + rng.normal(0, 1.0, n_a - na1), cy + rng.uniform(-0.2, 0.3, n_a - na1) * H], 1)
            pts = np.concatenate([curve, ax, ay])
        elif kind == "peak_end":
            x0, x1 = cx - 0.28 * W, cx + 0.28 * W
            base = cy + 0.15 * H
            ctrl_x = [0, 0.15, 0.32, 0.5, 0.7, 0.85, 1.0]
            ctrl_y = [0.1, 0.3, 1.0, 0.45, 0.5, 0.35, 0.55]
            u = np.linspace(0, 1, 2000)
            v = np.interp(u, ctrl_x, ctrl_y)
            v = np.convolve(np.pad(v, 60, mode="edge"), np.ones(121) / 121, mode="valid")
            n_c = int(M * 0.6)
            uu = rng.random(n_c)
            vv = np.interp(uu, u, v)
            curve = np.stack([x0 + uu * (x1 - x0), base - vv * 0.30 * H], 1) + rng.normal(0, 2.2, (n_c, 2))
            n_m = int(M * 0.18)
            pk_u = u[np.argmax(v[: len(u) // 2])]
            marks = []
            for mu in (pk_u, 1.0):
                mx_ = x0 + mu * (x1 - x0)
                my_ = base - np.interp(mu, u, v) * 0.30 * H
                a = rng.uniform(0, 2 * np.pi, n_m // 2)
                rr = 15 + rng.normal(0, 1.5, n_m // 2)
                marks.append(np.stack([mx_ + rr * np.cos(a), my_ + rr * np.sin(a)], 1))
            n_a = M - n_c - 2 * (n_m // 2)
            axis = np.stack([rng.uniform(x0 - 20, x1 + 20, n_a), base + rng.normal(0, 1.0, n_a)], 1)
            pts = np.concatenate([curve] + marks + [axis])
        else:
            raise ValueError(kind)
        pts = pts[rng.permutation(len(pts))][:M].astype(np.float32)
        cen = pts.mean(axis=0)
        dvec = pts - cen
        dn = np.linalg.norm(dvec, axis=1, keepdims=True) + 1e-3
        dirs = dvec / dn * rng.uniform(0.5, 1.3, (M, 1)) + rng.normal(0, 0.35, (M, 2))
        if kind == "point":
            a = rng.uniform(0, 2 * np.pi, M)
            dirs = np.stack([np.cos(a), np.sin(a)], 1) * rng.uniform(0.4, 1.4, (M, 1))
        return dict(idx=idx, tx=pts[:, 0], ty=pts[:, 1], dirs=dirs.astype(np.float32),
                    delay=(rng.random(M) * (0.0 if kind == "point" else 0.12)).astype(np.float32),
                    ph=rng.uniform(0, 6.28, M).astype(np.float32),
                    t0=TL.sec(f["t0"]), t1=TL.sec(f["t1"]), dur=f.get("dur_in", 0.35),
                    ease=f.get("ease", "out"), release=f.get("release", "explode"),
                    power=f.get("power", 1.0), cx=cx, cy=cy, kind=kind,
                    dim=0.3 if (kind == "text" and f["style"] not in ("digit", "num")) or kind == "point" else 1.0)

    # ---------------------------------------------------- 粒子位置
    def positions(self, t, burst=True):
        tau = self.integ(self.TAU, t)
        wx, wy = self.integ(self.WX, t), self.integ(self.WY, t)
        p = self.p
        x = (self.hx + self.vx * tau + self.A1 * np.sin(self.w1 * tau + p[0]) + self.A2 * np.sin(self.w2 * tau + p[1])
             + wx * self.dfac)
        y = (self.hy + self.vy * tau + self.A1 * np.cos(self.w1 * 0.8 * tau + p[2]) + self.A2 * np.sin(self.w2 * 1.1 * tau + p[3])
             + wy * self.dfac)
        M = self.M
        x = np.mod(x + M, W + 2 * M) - M
        y = np.mod(y + M, H + 2 * M) - M
        boost = np.zeros(self.N, np.float32)
        vis = np.zeros(self.N, np.float32)
        # 重击冲击波：只推自由粒子
        if burst:
            for th, s, kind in self.hits:
                d = t - th
                if d < 0 or d > 2.5 or s < 0.45 or kind == "soft":
                    continue
                g = s * 150 * (1 - np.exp(-d / 0.05)) * np.exp(-d / 0.8)
                dx, dy = x - W / 2, y - H / 2
                r = np.sqrt(dx * dx + dy * dy) + 30
                fall = np.exp(-r / 900)
                x = x + dx / r * g * fall * self.dfac
                y = y + dy / r * g * fall * self.dfac
        for f in self.forms:
            if t < f["t0"] or t > f["t1"] + 4.0:
                continue
            idx = f["idx"]
            pp = clamp01((t - f["t0"] - f["delay"]) / f["dur"])
            w = pp ** 2.2 if f["ease"] == "in" else ease_out_cubic(pp)
            tr = t - f["t1"]
            ox = oy = 0.0
            if tr >= 0:
                if f["release"] == "explode":
                    w = w * np.exp(-tr / 0.07)
                    e = f["power"] * 340 * (1 - np.exp(-tr / 0.12)) * np.exp(-tr / 1.6)
                    ox, oy = f["dirs"][:, 0] * e, f["dirs"][:, 1] * e
                    boost[idx] += (0.35 if f["kind"] == "point" else 1.6) * np.exp(-tr / 0.25)
                else:
                    w = w * np.exp(-tr / 0.6)
                    e = (1 - np.exp(-tr / 1.0)) * np.exp(-tr / 3.0)
                    ox, oy = f["dirs"][:, 0] * 50 * e, -60 * e + 0 * f["dirs"][:, 1]
            tx = f["tx"] + 1.3 * np.sin(2.3 * t + f["ph"])
            ty = f["ty"] + 1.3 * np.cos(1.9 * t + f["ph"])
            x[idx] = x[idx] + (tx - x[idx]) * w + ox
            y[idx] = y[idx] + (ty - y[idx]) * w + oy
            if f["dim"] < 1:
                boost[idx] += (f["dim"] - 1) * w * (tr < 0)
            else:
                boost[idx] += 0.5 * w
            vis[idx] = np.maximum(vis[idx], np.maximum(w, np.exp(-max(tr, 0) / 0.8) * (tr >= 0)))
        return x, y, boost, vis

    # ---------------------------------------------------- 一帧
    def frame(self, fi):
        t = fi / FPS
        tb = t / TL.BAR
        V = {k: float(self.vis(k, tb)) for k in self.VK}
        flash, shx, shy, zpunch, stream = self.hit_fx(t)
        kenv = self.env(self.kicks, t, 0.11)
        senv = self.env(self.snares, t, 0.09)
        pulse = V["pulse"]
        # 缓慢推镜 + 重击冲镜
        sec_ = next((s for s in TL.SECTIONS if s[1] <= tb < s[2]), TL.SECTIONS[-1])
        prog = (tb - sec_[1]) / max(1e-6, sec_[2] - sec_[1])
        Z = 1.0 + 0.03 * prog + zpunch + 0.006 * pulse * kenv

        def cam(x, y):
            return (x - W / 2) * Z + W / 2 + shx, (y - H / 2) * Z + H / 2 + shy

        W2, H2 = W // 2, H // 2
        # ---- 背景（1/4 分辨率）：底色 + 流动的雾 + 体积光束
        bw, bh = self.bw, self.bh
        fogv = V["fog"]
        f1 = sample_wrap(self.fog1, t * 2.0, t * 0.7, bw, bh)
        f2 = sample_wrap(self.fog2, -t * 3.5 + 100, t * 1.2, bw, bh)
        fog = np.clip(0.5 + 0.22 * f1 + 0.12 * f2, 0, 1) ** 2.0
        if 8 <= tb < 12 or 100 <= tb < 104:
            sx, sy = 0.5 * bw, 0.44 * bh
        else:
            sx, sy = (0.5 + 0.18 * np.sin(t * 0.07)) * bw, -0.3 * bh
        ang = np.arctan2(self.byy - sy, self.bxx - sx)
        rad = np.sqrt((self.bxx - sx) ** 2 + (self.byy - sy) ** 2)
        u = (ang / (2 * np.pi) % 1.0) * 4096
        r1 = np.interp((u + t * 9) % 4096, self.ax4096, self.ray1)
        r2 = np.interp((u - t * 4) % 4096, self.ax4096, self.ray2)
        rays = np.clip(0.55 * r1 + 0.45 * r2 + 0.3, 0, None) ** 2.2
        rays *= np.exp(-rad / (0.95 * bh)) * (1 - np.exp(-rad / 8))
        rays *= (0.45 + 0.75 * fog)
        rv = V["rays"] * (1 + 0.6 * stream + 0.25 * pulse * senv)
        bg = self.base * (0.75 + 0.25 * fogv) + fog[..., None] * C70 * (0.10 * fogv) + rays[..., None] * C40 * (0.16 * rv)
        half = cv2.resize(bg, (W2, H2), interpolation=cv2.INTER_LINEAR)

        # ---- 粒子：细粒（全分辨率）、柔光（半分辨率）、散景（1/4）
        dt_sh = 0.5 / FPS
        x1, y1, boost, fvis = self.positions(t)
        x0, y0, _, _ = self.positions(t - dt_sh)
        x1, y1 = cam(x1, y1)
        x0, y0 = cam(x0, y0)
        dens = V["density"]
        vis = np.maximum(clamp01((dens - self.rank) / 0.04), fvis)
        tw = 0.75 + 0.25 * np.sin(2 * np.pi * self.twf * t + self.p[0])
        br = self.b * V["bright"] * tw * vis * np.maximum(1 + boost, 0) * (1 + pulse * kenv * 0.9) * (1 + 0.4 * flash)
        hdr = None
        for lay, sc, sig, gain in ((0, 1.0, 0.85, 3.2), (1, 0.5, 1.1, 3.0), (2, 0.25, 5.0, 26.0)):
            m = (self.layer == lay) & (br > 0.004)
            if not m.any():
                continue
            img = self.splat_streaks(x0[m] * sc, y0[m] * sc, x1[m] * sc, y1[m] * sc, br[m] * gain,
                                     self.col[m], int(W * sc), int(H * sc))
            img = cv2.GaussianBlur(img, (0, 0), sig)
            if lay == 0:
                hdr = img
            elif lay == 1:
                half += img
            else:
                half += cv2.resize(img, (W2, H2), interpolation=cv2.INTER_LINEAR)
        if hdr is None:
            hdr = np.zeros((H, W, 3), np.float32)
        # ---- 跃迁星（上升音段）
        wv = V["warp"]
        if wv > 0.01:
            ph1 = self.integ(self.WARP, t)
            ph0 = self.integ(self.WARP, t - dt_sh * 2)
            u1 = (self.wu0 + ph1 * self.wsp) % 1.0
            u0 = u1 - (ph1 - ph0) * self.wsp
            ok = u0 > 0
            rmin, rmax = 20.0, 1400.0
            r1_ = rmin * (rmax / rmin) ** u1
            r0_ = rmin * (rmax / rmin) ** np.where(ok, u0, u1)
            cxw, cyw = W / 2 + shx, H * 0.48 + shy
            c, s_ = np.cos(self.wth), np.sin(self.wth)
            img = self.splat_streaks(cxw + c * r0_, cyw + s_ * r0_, cxw + c * r1_, cyw + s_ * r1_,
                                     (u1 ** 1.5) * wv * 6.0, self.wcol, W, H)
            hdr += cv2.GaussianBlur(img, (0, 0), 0.9)

        # ---- 字幕：文字层、辉光、光束（只在包围盒里处理）
        bx0, by0, bx1, by1 = self.last_box
        if bx1 > bx0:
            self.txt_rgb[by0:by1, bx0:bx1] = 0
            self.txt_a[by0:by1, bx0:bx1] = 0
        box = [W, H, 0, 0]
        glow = np.zeros((H // 4, W // 4, 3), np.float32)
        rays_src = np.zeros((H // 4, W // 4), np.float32)
        ray_c, ray_w = None, 0.0
        for it in self.items:
            r = it.render(t, fi)
            if r is None:
                continue
            bb = self.blit_text(it, r, t, fi, cam, Z, self.txt_rgb, self.txt_a, glow, rays_src)
            if bb:
                box = [min(box[0], bb[0]), min(box[1], bb[1]), max(box[2], bb[2]), max(box[3], bb[3])]
            rs = it.d.get("rays", 0) * r["alpha"] * r["boost"]
            if rs > ray_w:
                ray_w = rs
                ray_c = cam(it.d["x"] * W, it.d["y"] * H)
        self.last_box = box
        any_text = box[2] > box[0]
        if any_text:
            g = cv2.GaussianBlur(glow, (0, 0), 4) * 0.9 + cv2.GaussianBlur(glow, (0, 0), 12) * 0.7
            if ray_w > 0.02:
                rb = self.radial_blur(rays_src, ray_c[0] / 4, ray_c[1] / 4)
                g += rb[..., None] * C40 * (0.75 * min(ray_w, 1.2))
            half += cv2.resize(g, (W2, H2), interpolation=cv2.INTER_LINEAR)
        hdr += cv2.resize(half, (W, H), interpolation=cv2.INTER_LINEAR)

        # ---- 闪光、辉光、横向镜头光晕（在半分辨率上算）
        if flash > 0.002:
            hdr += flash * 0.55 * C10
        hh = cv2.resize(hdr, (W2, H2), interpolation=cv2.INTER_AREA)
        hh -= 0.55
        np.maximum(hh, 0, out=hh)
        l2 = cv2.resize(hh, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
        l3 = cv2.resize(l2, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
        l4 = cv2.resize(l3, (W // 16, H // 16), interpolation=cv2.INTER_AREA)
        acc = cv2.GaussianBlur(l4, (0, 0), 3)
        acc = cv2.resize(acc, (W // 8, H // 8)) + cv2.GaussianBlur(l3, (0, 0), 3) * 0.9
        streak = cv2.blur(cv2.blur(np.maximum(l3 - 0.25, 0), (61, 1)), (61, 1))
        lum = streak.mean(axis=2, keepdims=True)
        streak = lum * C50 + streak * 0.3
        acc = acc * 0.24 + streak * (0.3 + 0.45 * min(stream, 1.5))
        acc = cv2.resize(acc, (W // 4, H // 4)) + cv2.GaussianBlur(l2, (0, 0), 2.5) * (0.8 * 0.24)
        acc = cv2.resize(acc, (W2, H2)) + cv2.GaussianBlur(hh, (0, 0), 2) * (0.6 * 0.24)
        hdr += cv2.resize(acc, (W, H), interpolation=cv2.INTER_LINEAR)

        # ---- 文字背后的阴影（影），让字从光里浮出来
        if any_text:
            m_ = 64
            X0, Y0 = max(0, box[0] - m_), max(0, box[1] - m_)
            X1, Y1 = min(W, box[2] + m_), min(H, box[3] + m_)
            sw_, sh_ = max(1, (X1 - X0) // 4), max(1, (Y1 - Y0) // 4)
            a4 = cv2.resize(self.txt_a[Y0:Y1, X0:X1], (sw_, sh_), interpolation=cv2.INTER_AREA)
            shadow = cv2.GaussianBlur(a4, (0, 0), 5)
            shadow = cv2.resize(np.minimum(shadow * 1.6, 1.0), (X1 - X0, Y1 - Y0), interpolation=cv2.INTER_LINEAR)
            hdr[Y0:Y1, X0:X1] *= (1 - 0.75 * shadow)[..., None]

        # ---- 色调映射（原地运算）
        k = 0.75
        hdr *= V["exposure"]
        over = hdr - k
        np.maximum(over, 0, out=over)
        np.minimum(hdr, k, out=hdr)
        over *= -1.0 / (1 - k)
        cv2.exp(over, over)
        hdr += (1 - k)
        over *= (1 - k)
        hdr -= over
        if any_text:
            X0, Y0, X1, Y1 = box
            ta = self.txt_a[Y0:Y1, X0:X1] * V["exposure"]
            reg = hdr[Y0:Y1, X0:X1]
            reg *= (1 - ta)[..., None]
            reg += self.txt_rgb[Y0:Y1, X0:X1] * V["exposure"]
        hdr *= self.vig
        if self.grain is not None:
            hdr += self.grain[fi % 6][..., None]
        return cv2.convertScaleAbs(hdr, alpha=255.0)

    def splat_streaks(self, x0, y0, x1, y1, w, col, ww, hh):
        dx, dy = x1 - x0, y1 - y0
        L = np.sqrt(dx * dx + dy * dy)
        jump = L > 300
        x0 = np.where(jump, x1, x0)
        y0 = np.where(jump, y1, y0)
        L = np.where(jump, 0, L)
        K = np.clip(np.ceil(L / 1.2), 1, 28).astype(np.int32)
        rep = np.repeat(np.arange(len(K)), K)
        start = np.repeat(np.cumsum(K) - K, K)
        f = (np.arange(len(rep)) - start + 0.5) / K[rep]
        xs = x0[rep] + dx[rep] * np.where(jump[rep], 0, f)
        ys = y0[rep] + dy[rep] * np.where(jump[rep], 0, f)
        ws = w[rep] / K[rep] ** 0.55
        cs = col[rep]
        xi = np.floor(xs).astype(np.int64)
        yi = np.floor(ys).astype(np.int64)
        m = (xi >= 0) & (xi < ww - 1) & (yi >= 0) & (yi < hh - 1)
        xi, yi, fx, fy, ws, cs = xi[m], yi[m], (xs - np.floor(xs))[m], (ys - np.floor(ys))[m], ws[m], cs[m]
        idx = yi * ww + xi
        I = np.concatenate([idx, idx + 1, idx + ww, idx + ww + 1])
        Wt = np.concatenate([(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy])
        out = np.empty((hh * ww, 3), np.float32)
        for c in range(3):
            vals = np.tile(ws * cs[:, c], 4)
            out[:, c] = np.bincount(I, weights=Wt * vals, minlength=hh * ww)
        return out.reshape(hh, ww, 3)

    def radial_blur(self, img, cx, cy, n=26, step=0.028, decay=0.93):
        img = cv2.GaussianBlur(img, (0, 0), 1.5)
        acc = img.copy()
        tot = 1.0
        for k in range(1, n + 1):
            s = 1 + k * step
            M = np.float32([[s, 0, cx * (1 - s)], [0, s, cy * (1 - s)]])
            wk = decay ** k
            acc += cv2.warpAffine(img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_LINEAR) * wk
            tot += wk
        return acc / tot * 2.2

    def blit_text(self, it, r, t, fi, cam, Z, txt_rgb, txt_a, glow, rays_src):
        d = it.d
        rgb, a = r["rgb"], r["a"]
        s = r["scale"] * Z
        al = r["alpha"]
        blur = r["blur"]
        # 扫光：一道高光从左到右掠过字面
        sw = d.get("sweep")
        if sw is not None:
            ts = TL.sec(sw)
            u = (t - ts) / 0.9
            if 0 <= u <= 1:
                h_, w_ = a.shape
                X = np.arange(w_, dtype=np.float32)[None, :]
                Y = np.arange(h_, dtype=np.float32)[:, None]
                bx = -0.2 * w_ + 1.4 * w_ * u
                band = np.exp(-(((X - bx) + 0.35 * (Y - h_ / 2)) / (0.07 * w_ + 20)) ** 2)
                rgb = rgb + (a * band)[..., None] * C10 * 0.9
        # 故障：横向切片错位 + 两档 Loyel 蓝分色
        glitching = False
        if d.get("inn") == "glitch" and t - it.t_in < 0.3:
            glitching = True
        for rg in d.get("reglitch", []):
            if 0 <= t - TL.sec(rg) < 0.18:
                glitching = True
        if d.get("glitch") and t - it.t_in < 0.16:
            glitching = True
        if glitching:
            rgb, a = rgb.copy(), a.copy()
            h_ = a.shape[0]
            yv = 0
            k = 0
            while yv < h_:
                hh = int(8 + 40 * hash01(fi, k, it.idx))
                dx = int((hash01(fi, k, 99) - 0.5) * 70)
                rgb[yv:yv + hh] = np.roll(rgb[yv:yv + hh], dx, axis=1)
                a[yv:yv + hh] = np.roll(a[yv:yv + hh], dx, axis=1)
                yv += hh
                k += 1
            sh = int(10 + 10 * hash01(fi, 5))
            rgb = rgb + np.roll(a, -sh, axis=1)[..., None] * C50 * 0.7 + np.roll(a, sh, axis=1)[..., None] * C30 * 0.5
        if blur > 0.6:
            rgb = cv2.GaussianBlur(rgb, (0, 0), blur)
            a = cv2.GaussianBlur(a, (0, 0), blur)
        if abs(s - 1) > 0.003:
            nw, nh = max(1, int(a.shape[1] * s)), max(1, int(a.shape[0] * s))
            rgb = cv2.resize(rgb, (nw, nh), interpolation=cv2.INTER_LINEAR)
            a = cv2.resize(a, (nw, nh), interpolation=cv2.INTER_LINEAR)
        ax_, ay_ = cam(d["x"] * W, d["y"] * H + r["dy"])
        x0 = int(round(ax_ - it.lx * s))
        y0 = int(round(ay_ - r["vc"] * s))
        h_, w_ = a.shape
        X0, Y0 = max(0, x0), max(0, y0)
        X1, Y1 = min(W, x0 + w_), min(H, y0 + h_)
        if X1 <= X0 or Y1 <= Y0:
            return None
        sa = a[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] * al
        srgb = rgb[Y0 - y0:Y1 - y0, X0 - x0:X1 - x0] * al
        txt_a[Y0:Y1, X0:X1] = np.maximum(txt_a[Y0:Y1, X0:X1], sa)
        bbox = (X0, Y0, X1, Y1)
        txt_rgb[Y0:Y1, X0:X1] += srgb
        gk = it.st["gk"] * r["boost"]
        q0, q1 = X0 // 4, max(X0 // 4 + 1, X1 // 4)
        p0, p1 = Y0 // 4, max(Y0 // 4 + 1, Y1 // 4)
        sa4 = cv2.resize(sa, (q1 - q0, p1 - p0), interpolation=cv2.INTER_AREA)
        glow[p0:p1, q0:q1] += sa4[..., None] * it.st["glow"] * gk
        if d.get("rays"):
            rays_src[p0:p1, q0:q1] += sa4 * d["rays"] * r["boost"]
        return bbox


# ============================================================ 输出
def ffmpeg_writer(path, crf=16, preset="fast"):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-threads", "1", path]
    return subprocess.Popen(cmd, stdin=subprocess.PIPE)


def render_range(a, b, path):
    R = Renderer()
    p = ffmpeg_writer(path)
    t0 = time.time()
    for fi in range(a, b):
        p.stdin.write(R.frame(fi).tobytes())
        if (fi - a) % 150 == 0:
            el = time.time() - t0
            print("[%d-%d] %d/%d  %.2fs/帧" % (a, b, fi - a, b - a, el / max(1, fi - a)), file=sys.stderr, flush=True)
    p.stdin.close()
    p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--still", nargs="*", type=float)
    ap.add_argument("--range", nargs=3)
    ap.add_argument("--out")
    ap.add_argument("--audio")
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--from-bar", type=float, default=0)
    ap.add_argument("--to-bar", type=float, default=None)
    args = ap.parse_args()
    os.makedirs(os.path.join(HERE, "build"), exist_ok=True)
    if args.still:
        R = Renderer()
        for b in args.still:
            fi = int(round(TL.sec(b) * FPS))
            t0 = time.time()
            img = R.frame(fi)
            out = os.path.join(HERE, "build", "still_%06.2f.png" % b)
            cv2.imwrite(out, cv2.cvtColor(img, cv2.COLOR_RGB2BGR))
            print(out, "%.2fs" % (time.time() - t0))
        return
    if args.range:
        render_range(int(args.range[0]), int(args.range[1]), args.range[2])
        return
    total = int(round(TL.DURATION * FPS))
    fa = int(round(TL.sec(args.from_bar) * FPS))
    fb = total if args.to_bar is None else int(round(TL.sec(args.to_bar) * FPS))
    n = args.workers
    bounds = np.linspace(fa, fb, n + 1).astype(int)
    segs, procs = [], []
    for i in range(n):
        sp = os.path.join(HERE, "build", "seg_%02d.mp4" % i)
        segs.append(sp)
        procs.append(subprocess.Popen([sys.executable, __file__, "--range", str(bounds[i]), str(bounds[i + 1]), sp]))
    for p in procs:
        if p.wait() != 0:
            sys.exit("渲染进程失败")
    lst = os.path.join(HERE, "build", "segs.txt")
    with open(lst, "w") as f:
        f.writelines("file '%s'\n" % s for s in segs)
    # 主版 1080p，外加一个便于在手机 / 聊天软件里分享的 720p 版
    for out, extra in ((args.out, ["-crf", "22"]),
                       (args.out.replace(".mp4", "_720p.mp4"), ["-vf", "scale=1280:720:flags=lanczos", "-crf", "23"])):
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst]
        if args.audio:
            cmd += ["-ss", "%.3f" % (fa / FPS), "-i", args.audio, "-map", "0:v", "-map", "1:a", "-c:a", "aac",
                    "-b:a", "256k", "-shortest"]
        cmd += ["-c:v", "libx264", "-preset", "slow"] + extra + ["-pix_fmt", "yuv420p", "-movflags", "+faststart", out]
        subprocess.check_call(cmd)
        print("写出", out)


if __name__ == "__main__":
    main()
