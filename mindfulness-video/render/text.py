"""文字排版：中英混排、关键词高亮、荧光描边，渲染成可缓存的 RGBA 精灵。

标记语法：**加粗高亮**，[[次要色]]。中文走 Noto CJK，拉丁字母和数字走
Montserrat / Oswald（按样式指定），按基线对齐。
"""
import os
import re

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from engine import LOYEL, hex2rgb

FONT_DIR = os.path.join(os.path.dirname(__file__), "..", ".cache", "fonts")

FONTS = {
    "serif_black": "NotoSerifCJKsc-Black.otf",
    "serif_bold": "NotoSerifCJKsc-Bold.otf",
    "sans_bold": "NotoSansCJKsc-Bold.otf",
    "sans": "NotoSansCJKsc-Regular.otf",
    "sans_light": "NotoSansCJKsc-Light.otf",
    "oswald": ("Oswald-VF.ttf", 500),
    "oswald_light": ("Oswald-VF.ttf", 300),
    "mont": ("Montserrat-VF.ttf", 500),
    "mont_light": ("Montserrat-VF.ttf", 300),
    "mont_bold": ("Montserrat-VF.ttf", 700),
}
_font_cache = {}


def font(name, size):
    key = (name, size)
    if key not in _font_cache:
        spec = FONTS[name]
        if isinstance(spec, tuple):
            f = ImageFont.truetype(os.path.join(FONT_DIR, spec[0]), size)
            f.set_variation_by_axes([spec[1]])
        else:
            f = ImageFont.truetype(os.path.join(FONT_DIR, spec), size)
        _font_cache[key] = f
    return _font_cache[key]


# 文字样式：cjk 字体、拉丁字体、字号、颜色、高亮色、字距、行距、荧光
STYLES = {
    "title":    dict(cjk="serif_black", lat="oswald", size=210, color=10, hi=10, track=0.12, glow=1.0),
    "subtitle": dict(cjk="serif_bold", lat="oswald", size=60, color=20, hi=10, track=0.18, glow=0.7),
    "eng":      dict(cjk="sans", lat="oswald_light", size=30, color=40, hi=30, track=0.32, glow=0.4),
    "chapnum":  dict(cjk="sans", lat="oswald_light", size=120, color=40, hi=30, track=0.05, glow=0.6),
    "chapter":  dict(cjk="serif_bold", lat="oswald", size=84, color=10, hi=10, track=0.10, glow=0.8),
    "caption":  dict(cjk="sans", lat="mont", size=46, color=20, hi=10, hi_font="sans_bold", track=0.04, glow=0.45),
    "big":      dict(cjk="serif_bold", lat="oswald", size=64, color=10, hi=10, track=0.06, glow=0.7),
    "label":    dict(cjk="sans_bold", lat="mont_bold", size=48, color=10, hi=10, track=0.04, glow=0.6),
    "label_en": dict(cjk="sans", lat="oswald_light", size=26, color=40, hi=30, track=0.30, glow=0.3),
    "body":     dict(cjk="sans", lat="mont", size=33, color=30, hi=10, hi_font="sans_bold", track=0.03, glow=0.25, lead=1.62),
    "cite":     dict(cjk="sans_light", lat="mont_light", size=24, color=40, hi=30, track=0.02, glow=0.15),
    "small":    dict(cjk="sans", lat="mont", size=26, color=30, hi=10, track=0.03, glow=0.2, lead=1.6),
    "num":      dict(cjk="sans", lat="oswald", size=96, color=10, hi=10, track=0.02, glow=0.8),
    "tag":      dict(cjk="sans_bold", lat="mont_bold", size=30, color=10, hi=10, track=0.06, glow=0.4),
}


def _is_cjk(ch):
    o = ord(ch)
    return (0x2E80 <= o <= 0x9FFF or 0x3000 <= o <= 0x303F or 0xFF00 <= o <= 0xFFEF
            or 0x2000 <= o <= 0x206F and ch in "“”‘’—…" or ch in "①②③④⑤≠≈→【】「」《》·")


def _runs(text):
    """拆成 (文字, 是否高亮, 是否次要) 段。"""
    out = []
    for part in re.split(r"(\*\*.+?\*\*|\[\[.+?\]\])", text):
        if not part:
            continue
        if part.startswith("**"):
            out.append((part[2:-2], True, False))
        elif part.startswith("[["):
            out.append((part[2:-2], False, True))
        else:
            out.append((part, False, False))
    return out


def _layout_line(text, st, scale):
    size = int(round(st["size"] * scale))
    items = []  # (ch, font, color_key)
    for seg, hi, dim in _runs(text):
        for ch in seg:
            cjk = _is_cjk(ch) or ord(ch) > 0x2FFF
            if hi and st.get("hi_font") and cjk:
                fname = st["hi_font"]
            else:
                fname = st["cjk"] if cjk else st["lat"]
            col = st["hi"] if hi else (50 if dim else st["color"])
            items.append((ch, fname, col, hi))
    return size, items


def render_line(text, style, scale=1.0):
    """渲染单行，返回 (rgba float32 (h,w,4) 预乘, baseline_y)。"""
    st = STYLES[style]
    size, items = _layout_line(text, st, scale)
    track = st["track"] * size
    # 量宽度与上下界
    asc_max, desc_max, x = 0, 0, 0.0
    placed = []
    for ch, fname, col, hi in items:
        f = font(fname, size)
        asc, desc = f.getmetrics()
        asc_max, desc_max = max(asc_max, asc), max(desc_max, desc)
        adv = f.getlength(ch)
        placed.append((x, ch, f, col, hi))
        x += adv + track
    width = int(np.ceil(x - track)) if placed else 1
    pad = int(size * 0.6)
    h = asc_max + desc_max + 2 * pad
    w = width + 2 * pad
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for x0, ch, f, col, hi in placed:
        rgb = tuple(int(v * 255) for v in hex2rgb(LOYEL[col]))
        d.text((pad + x0, pad + asc_max), ch, font=f, fill=rgb + (255,), anchor="ls")
    a = np.asarray(img, np.float32) / 255.0
    a[..., :3] *= a[..., 3:4]
    return a, pad + asc_max, pad


class Block:
    """多行文字块，每行单独渲染，可按行错峰出现。"""

    def __init__(self, lines, style, scale=1.0, align="center", lead=None):
        st = STYLES[style]
        self.style = style
        self.lines = []
        lead = lead or st.get("lead", 1.45)
        self.line_h = st["size"] * scale * lead
        for ln in lines:
            if ln == "":
                self.lines.append(None)
                continue
            rgba, base, pad = render_line(ln, style, scale)
            self.lines.append((rgba, base, pad))
        self.align = align
        self.glow = st["glow"]
        widths = [l[0].shape[1] - 2 * l[2] for l in self.lines if l]
        self.width = max(widths) if widths else 0
        self.height = self.line_h * len(self.lines)
        self._glow_cache = {}

    def glow_of(self, i):
        if i not in self._glow_cache:
            rgba = self.lines[i][0]
            g = cv2.GaussianBlur(rgba[..., 3], (0, 0), max(2.0, rgba.shape[0] * 0.07))
            self._glow_cache[i] = g
        return self._glow_cache[i]


def composite(img, block, x, y, alpha=1.0, stagger=0.0, progress=None, rise=14.0, wipe=True,
              glow_color=60, glow=None):
    """把 Block 画到 img (h,w,3) sRGB 浮点上。(x, y) 为块的锚点：
    align=center 时是首行中心，align=left 时是首行左端；y 为首行基线。
    progress: 0..1 入场进度（含逐行错峰）；alpha: 整体不透明度。"""
    H, W = img.shape[:2]
    g_rgb = hex2rgb(LOYEL[glow_color])
    gl = block.glow if glow is None else glow
    n = len(block.lines)
    for i, ln in enumerate(block.lines):
        if ln is None:
            continue
        rgba, base, pad = ln
        p = 1.0 if progress is None else float(np.clip(progress * (1 + stagger * (n - 1)) - i * stagger, 0, 1))
        if p <= 0 or alpha <= 0:
            continue
        e = 1 - (1 - p) ** 3
        a_line = alpha * e
        lw = rgba.shape[1] - 2 * pad
        if block.align == "center":
            x0 = x - lw / 2 - pad
        elif block.align == "right":
            x0 = x - lw - pad
        else:
            x0 = x - pad
        y0 = y + i * block.line_h - base + rise * (1 - e)
        xi, yi = int(round(x0)), int(round(y0))
        h, w = rgba.shape[:2]
        sx0, sy0 = max(0, -xi), max(0, -yi)
        sx1, sy1 = min(w, W - xi), min(h, H - yi)
        if sx1 <= sx0 or sy1 <= sy0:
            continue
        src = rgba[sy0:sy1, sx0:sx1]
        mask = np.full((sy1 - sy0, sx1 - sx0), a_line, np.float32)
        if wipe and p < 1:
            xs = np.arange(sx0, sx1, dtype=np.float32) - pad
            edge = (p * 1.25) * lw
            m = np.clip((edge - xs) / (0.25 * lw + 1), 0, 1)
            mask = mask * m[None, :]
        dst = img[yi + sy0:yi + sy1, xi + sx0:xi + sx1]
        if gl > 0:
            gg = block.glow_of(i)[sy0:sy1, sx0:sx1] * mask * gl
            dst += (g_rgb[None, None, :] * gg[..., None]) * 0.9
        dst *= 1 - src[..., 3:4] * mask[..., None]
        dst += src[..., :3] * mask[..., None]
    return img


def text_mask(text, style_font, size, pad=20):
    """为粒子文字生成灰度掩膜 (h, w) 0..1。"""
    f = font(style_font, size)
    l, t, r, b = f.getbbox(text)
    w, h = r - l + 2 * pad, b - t + 2 * pad
    img = Image.new("L", (w, h), 0)
    ImageDraw.Draw(img).text((pad - l, pad - t), text, font=f, fill=255)
    return np.asarray(img, np.float32) / 255.0
