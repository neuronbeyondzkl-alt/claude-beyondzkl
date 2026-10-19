"""《芒格的宝藏》渲染器：skia 逐帧绘制画面，管道送入 ffmpeg 编码。

用法：
  python3 render.py --still 12.5,80        # 导出指定时刻的 PNG 预览到 build/stills/
  python3 render.py --scene compound       # 只渲染一个场景（无声，便于检查动画）
  python3 render.py                        # 渲染全片 build/video.mp4（4 进程并行分段）
环境变量：
  FONT_DIR  放 NotoSansSC_*.ttf / NotoSerifSC_*.ttf 的目录
"""

import argparse
import math
import os
import random
import re
import subprocess
from concurrent.futures import ProcessPoolExecutor
from contextlib import contextmanager
from pathlib import Path

import numpy as np
import skia

from script import SOURCES
from timeline import XFADE, build, subtitle_events

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"
FONT_DIR = Path(os.environ.get("FONT_DIR", HERE / "fonts"))
W, H, FPS = 1920, 1080, 30

# Loyel 渐变蓝十档：全片只用这些颜色（外加深色背景上的白字）
L10, L20, L30, L40, L50 = "#F4F7FB", "#E8EEF6", "#CCDBEB", "#9FBDDA", "#6C9AC4"
L60, L70, L80, L90, L100 = "#497DAE", "#376392", "#2E5076", "#2B4868", "#263B54"
WHITE = "#FFFFFF"

LEFT, RIGHT = 120, 1800

# ---------------------------------------------------------------- 基础绘图


def rgba(hex_: str, a: float = 1.0) -> int:
    h = hex_.lstrip("#")
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), max(0, min(255, round(a * 255))))


def paint(color: str, a: float = 1.0, stroke: float = 0, round_cap: bool = False) -> skia.Paint:
    p = skia.Paint(AntiAlias=True, Color=rgba(color, a))
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        if round_cap:
            p.setStrokeCap(skia.Paint.kRound_Cap)
            p.setStrokeJoin(skia.Paint.kRound_Join)
    return p


FACES = {
    "sans": "NotoSansSC_400Regular.ttf",
    "sans_l": "NotoSansSC_300Light.ttf",
    "sans_m": "NotoSansSC_500Medium.ttf",
    "sans_b": "NotoSansSC_700Bold.ttf",
    "serif": "NotoSerifSC_500Medium.ttf",
    "serif_b": "NotoSerifSC_700Bold.ttf",
    "serif_k": "NotoSerifSC_900Black.ttf",
}
_typefaces, _fonts = {}, {}


def font(face: str, size: float) -> skia.Font:
    key = (face, size)
    if key not in _fonts:
        if face not in _typefaces:
            tf = skia.Typeface.MakeFromFile(str(FONT_DIR / FACES[face]))
            if tf is None:
                raise SystemExit(f"找不到字体 {FONT_DIR / FACES[face]}（设置 FONT_DIR）")
            _typefaces[face] = tf
        f = skia.Font(_typefaces[face], size)
        f.setSubpixel(True)
        f.setEdging(skia.Font.Edging.kAntiAlias)
        _fonts[key] = f
    return _fonts[key]


def tw(s: str, f: skia.Font, track: float = 0) -> float:
    return f.measureText(s) + track * max(0, len(s) - 1)


def text(c, s, x, y, f, color, a=1.0, align="l", track=0.0) -> float:
    """在基线 y 处绘制单行文字，返回宽度。"""
    w = tw(s, f, track)
    if a <= 0.003 or not s:
        return w
    if align == "c":
        x -= w / 2
    elif align == "r":
        x -= w
    p = paint(color, a)
    if track:
        for ch in s:
            c.drawString(ch, x, y, f, p)
            x += f.measureText(ch) + track
    else:
        c.drawString(s, x, y, f, p)
    return w


NO_START = set("，。、；：？！）》」』”’…—·%,.;:!?)")
NO_END = set("（《「『“‘(")
TOKEN = re.compile(r"[A-Za-z0-9.%’'\-–×]+ ?|\s|.")


def wrap(s: str, f: skia.Font, maxw: float) -> list[str]:
    """中文按字折行，英文按词折行，带简单的避头尾。"""
    lines, cur = [], ""
    for tok in TOKEN.findall(s):
        if not cur or f.measureText((cur + tok).rstrip()) <= maxw:
            cur += tok
            continue
        if tok[0] in NO_START and len(cur) > 1:
            tok, cur = cur[-1] + tok, cur[:-1]
        if cur and cur[-1] in NO_END:
            tok, cur = cur[-1] + tok, cur[:-1]
        lines.append(cur.rstrip())
        cur = tok.lstrip()
    if cur.strip():
        lines.append(cur.rstrip())
    return lines


def wrap_balanced(s: str, f: skia.Font, maxw: float) -> list[str]:
    lines = wrap(s, f, maxw)
    if len(lines) <= 1:
        return lines
    w = f.measureText(s) / len(lines)
    while w < maxw:
        trial = wrap(s, f, w)
        if len(trial) <= len(lines):
            return trial
        w += 10
    return lines


def para(c, s, x, y, f, color, maxw, lh, a=1.0, align="l", balance=False) -> float:
    """多行文字，y 为首行基线；返回占用高度。"""
    lines = []
    for part in s.split("\n"):
        lines += (wrap_balanced if balance else wrap)(part, f, maxw)
    for i, ln in enumerate(lines):
        text(c, ln, x, y + i * lh, f, color, a, align)
    return len(lines) * lh


def rrect(c, x, y, w, h, r, fill=None, a=1.0, stroke=None, sw=2.0, shadow=0.0):
    if shadow and a > 0:
        p = paint(L90, 0.10 * a * shadow)
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, 16))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y + 10, w, h), r, r), p)
    rr = skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r)
    if fill:
        c.drawRRect(rr, paint(fill, a))
    if stroke:
        c.drawRRect(rr, paint(stroke, a, stroke=sw))


def circle(c, x, y, r, fill=None, a=1.0, stroke=None, sw=2.0):
    if r <= 0:
        return
    if fill:
        c.drawCircle(x, y, r, paint(fill, a))
    if stroke:
        c.drawCircle(x, y, r, paint(stroke, a, stroke=sw))


def line(c, x1, y1, x2, y2, color, a=1.0, w=2.0):
    c.drawLine(x1, y1, x2, y2, paint(color, a, stroke=w, round_cap=True))


def poly(c, pts, fill=None, a=1.0, stroke=None, sw=2.0):
    path = skia.Path()
    path.addPoly([skia.Point(*p) for p in pts], True)
    if fill:
        c.drawPath(path, paint(fill, a))
    if stroke:
        c.drawPath(path, paint(stroke, a, stroke=sw, round_cap=True))


def arrow(c, x1, y1, x2, y2, color, a=1.0, w=3.0, head=14.0):
    ang = math.atan2(y2 - y1, x2 - x1)
    bx, by = x2 - head * 0.8 * math.cos(ang), y2 - head * 0.8 * math.sin(ang)
    line(c, x1, y1, bx, by, color, a, w)
    pts = [(x2, y2)]
    for s in (-1, 1):
        pts.append((x2 - head * math.cos(ang + s * 0.45), y2 - head * math.sin(ang + s * 0.45)))
    poly(c, [pts[1], pts[0], pts[2]], fill=color, a=a)


def glow(c, x, y, r, color, a):
    p = paint(color, a)
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, r * 0.5))
    c.drawCircle(x, y, r, p)


def dashed_circle(c, x, y, r, color, a, w, dash, phase):
    p = paint(color, a, stroke=w, round_cap=True)
    p.setPathEffect(skia.DashPathEffect.Make([dash, dash * 0.8], phase))
    c.drawCircle(x, y, r, p)


# ---------------------------------------------------------------- 动画曲线


def clamp(x, lo=0.0, hi=1.0):
    return lo if x < lo else hi if x > hi else x


def ease(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def pin(t, t0, d=0.6):
    return ease((t - t0) / d)


def pout(t, t1, d=0.45):
    return 1 - smooth((t - t1) / d)


@contextmanager
def group(c, k=1.0, dx=0.0, dy=0.0, scale=1.0, origin=(W / 2, H / 2)):
    """整组透明度/位移/缩放；k 为透明度。"""
    c.save()
    layered = k < 0.997
    if layered:
        c.saveLayerAlpha(None, max(0, int(k * 255)))
    c.translate(dx, dy)
    if scale != 1.0:
        c.translate(*origin)
        c.scale(scale, scale)
        c.translate(-origin[0], -origin[1])
    try:
        yield
    finally:
        if layered:
            c.restore()
        c.restore()


def rise(c, k, dy=26):
    return group(c, k, dy=(1 - k) * dy)


# ---------------------------------------------------------------- 图标


def gem(c, cx, cy, s, fill=L70, a=1.0, halo=0.0):
    w, h = s, s * 0.82
    top, mid, bot = cy - h * 0.45, cy - h * 0.1, cy + h * 0.55
    if halo:
        glow(c, cx, cy, s * 0.75, L40, 0.55 * halo * a)
    outline = [(cx - w * 0.5, mid), (cx - w * 0.28, top), (cx + w * 0.28, top), (cx + w * 0.5, mid), (cx, bot)]
    poly(c, outline, fill=fill, a=a)
    poly(c, [(cx - w * 0.28, top), (cx, top), (cx - w * 0.14, mid), (cx - w * 0.5, mid)], fill=L50, a=a * 0.85)
    poly(c, [(cx - w * 0.5, mid), (cx - w * 0.14, mid), (cx, bot)], fill=L60, a=a * 0.9)
    sw = max(1.2, s * 0.022)
    for p, q in [((cx - w * 0.5, mid), (cx + w * 0.5, mid)), ((cx - w * 0.14, mid), (cx, bot)), ((cx + w * 0.14, mid), (cx, bot)),
                 ((cx - w * 0.14, mid), (cx, top)), ((cx + w * 0.14, mid), (cx, top)), ((cx - w * 0.28, top), (cx - w * 0.14, mid)),
                 ((cx + w * 0.28, top), (cx + w * 0.14, mid))]:
        line(c, *p, *q, L30, a * 0.75, sw)
    poly(c, outline, stroke=L30, a=a * 0.6, sw=sw)


def compass(c, cx, cy, r, rot, a=1.0):
    c.save()
    c.translate(cx, cy)
    c.rotate(rot)
    circle(c, 0, 0, r, stroke=L40, a=0.55 * a, sw=2)
    circle(c, 0, 0, r * 0.84, stroke=L50, a=0.4 * a, sw=1.2)
    for i in range(72):
        ang = math.radians(i * 5)
        l = 0.12 if i % 6 == 0 else 0.05
        line(c, (r * 0.84) * math.cos(ang), (r * 0.84) * math.sin(ang), (r * (0.84 + l)) * math.cos(ang),
             (r * (0.84 + l)) * math.sin(ang), L40, 0.5 * a, 1.5)
    for i, (length, wid) in enumerate([(0.98, 0.13)] * 4 + [(0.62, 0.09)] * 4):
        ang = math.radians(i * 90 + (45 if i >= 4 else 0) - 90)
        tip = (length * r * math.cos(ang), length * r * math.sin(ang))
        side = ang + math.pi / 2
        lft = (wid * r * math.cos(side), wid * r * math.sin(side))
        poly(c, [(0, 0), tip, lft], fill=L30 if i < 4 else L50, a=a * 0.9)
        poly(c, [(0, 0), tip, (-lft[0], -lft[1])], fill=L60 if i < 4 else L70, a=a * 0.9)
    circle(c, 0, 0, r * 0.07, fill=L20, a=a)
    c.restore()
    text(c, "N", cx + r * 1.12 * math.sin(math.radians(rot)), cy - r * 1.12 * math.cos(math.radians(rot)) + 10,
         font("sans_b", 26), L30, a * 0.8, "c")


def cross_icon(c, x, y, r, a=1.0):
    circle(c, x, y, r, fill=L20, a=a, stroke=L50, sw=2)
    d = r * 0.42
    line(c, x - d, y - d, x + d, y + d, L70, a, 3.5)
    line(c, x - d, y + d, x + d, y - d, L70, a, 3.5)


def check_box(c, x, y, s, k, a=1.0):
    rrect(c, x, y, s, s, 6, fill=L10, a=a, stroke=L60, sw=2.5)
    if k > 0:
        pts = [(x + s * 0.2, y + s * 0.52), (x + s * 0.42, y + s * 0.74), (x + s * 0.82, y + s * 0.26)]
        path = skia.Path()
        path.moveTo(*pts[0])
        path.lineTo(*pts[1])
        path.lineTo(*pts[2])
        meas = skia.PathMeasure(path, False)
        seg = skia.Path()
        meas.getSegment(0, meas.getLength() * k, seg, True)
        c.drawPath(seg, paint(L70, a, stroke=s * 0.13, round_cap=True))


def pill(c, s, cx, cy, f, fill=L20, color=L90, a=1.0, stroke=L30, padx=22, h=None):
    h = h or f.getSize() * 1.9
    w = tw(s, f) + 2 * padx
    rrect(c, cx - w / 2, cy - h / 2, w, h, h / 2, fill=fill, a=a, stroke=stroke, sw=2)
    text(c, s, cx, cy + f.getSize() * 0.36, f, color, a, "c")
    return w


def tag(c, s, x, y, a=1.0, dark=False):
    """小标签：左上角对齐，返回宽度。"""
    f = font("sans_m", 22)
    w = tw(s, f) + 28
    rrect(c, x, y, w, 38, 19, fill=L80 if dark else L20, a=a, stroke=None if dark else L30)
    text(c, s, x + 14, y + 27, f, L20 if dark else L70, a)
    return w


def quote_card(c, x, y, w, h, quote, source, k, dark=False, size=40):
    if k <= 0:
        return
    with rise(c, k):
        rrect(c, x, y, w, h, 22, fill=L70 if dark else L20, stroke=None if dark else L30, shadow=1.0)
        text(c, "“", x + 26, y + 92, font("serif_k", 96), L50 if dark else L30, 1.0)
        para(c, quote, x + 64, y + 74, font("serif_b", size), WHITE if dark else L100, w - 110, size * 1.45)
        if source:
            text(c, source, x + 64, y + h - 30, font("sans_m", 22), L30 if dark else L60)


# ---------------------------------------------------------------- 背景与外框

_bg_cache = {}


def background(c, theme, t):
    if theme not in _bg_cache:
        surf = skia.Surface(W, H)
        bc = surf.getCanvas()
        if theme == "light":
            bc.clear(rgba(L10))
            p = skia.Paint(Shader=skia.GradientShader.MakeRadial(
                skia.Point(1680, 60), 980, [rgba(L20), rgba(L20, 0.0)]))
            bc.drawRect(skia.Rect.MakeWH(W, H), p)
            for gx in range(36, W, 48):
                for gy in range(36, H, 48):
                    bc.drawCircle(gx, gy, 1.5, paint(L30, 0.45))
        else:
            p = skia.Paint(Shader=skia.GradientShader.MakeLinear(
                [skia.Point(0, 0), skia.Point(0, H)], [rgba(L100), rgba(L90), rgba(L80)], [0.0, 0.55, 1.0]))
            bc.drawRect(skia.Rect.MakeWH(W, H), p)
            p = skia.Paint(Shader=skia.GradientShader.MakeRadial(
                skia.Point(W / 2, 330), 760, [rgba(L70, 0.55), rgba(L70, 0.0)]))
            bc.drawRect(skia.Rect.MakeWH(W, H), p)
        _bg_cache[theme] = surf.makeImageSnapshot()
    c.drawImage(_bg_cache[theme], 0, 0)
    if theme == "dark":
        plankton(c, t)


_rng = np.random.default_rng(7)
_PX, _PY, _PS = _rng.uniform(0, W, 150), _rng.uniform(0, H, 150), _rng.uniform(6, 26, 150)
_PR, _PP = _rng.uniform(1.0, 3.4, 150), _rng.uniform(0, 2 * math.pi, 150)


def plankton(c, t):
    """深色场景里缓慢上浮的发光浮游粒子。"""
    ys = (_PY - _PS * t) % (H + 40) - 20
    xs = _PX + 16 * np.sin(t * 0.25 + _PP)
    al = 0.18 + 0.3 * (0.5 + 0.5 * np.sin(t * 1.1 + _PP * 3))
    for x, y, r, a in zip(xs, ys, _PR, al):
        c.drawCircle(float(x), float(y), float(r), paint(L40 if r < 2.4 else L30, float(a)))


def chrome(c, s, t):
    """浅色场景的章节标题与右上角标识。"""
    if not s.chapter:
        return
    num, zh, en = s.chapter
    k = pin(t, 0.1, 0.7)
    with group(c, k, dx=(1 - k) * -20):
        rrect(c, LEFT, 78, 74, 46, 23, fill=L70)
        text(c, num, LEFT + 37, 110, font("sans_b", 24), WHITE, 1, "c")
        w = text(c, zh, LEFT + 96, 113, font("sans_b", 36), L90)
        text(c, en, LEFT + 96 + w + 22, 111, font("sans_m", 19), L50, 1, track=3)
    text(c, "查理·芒格的智慧", RIGHT, 110, font("sans_m", 22), L40, k, "r")
    gem(c, RIGHT - tw("查理·芒格的智慧", font("sans_m", 22)) - 24, 101, 22, a=k)
    lk = pin(t, 0.2, 1.0)
    line(c, LEFT, 150, LEFT + (RIGHT - LEFT) * lk, 150, L30, 1, 2)


def subtitles(c, T, events, theme):
    for a, b, s in events:
        if a <= T <= b:
            k = min(clamp((T - a) / 0.14), clamp((b - T) / 0.18))
            f = font("sans_m", 38)
            lines = wrap_balanced(s, f, 1500)
            wmax = max(tw(ln, f) for ln in lines)
            h = 56 * len(lines) + 30
            x, y = W / 2 - wmax / 2 - 36, 1040 - h
            rrect(c, x, y, wmax + 72, h, 18, fill=L100, a=0.86 * k if theme == "light" else 0.62 * k)
            for i, ln in enumerate(lines):
                text(c, ln, W / 2, y + 56 + i * 56 - 4, f, WHITE, k, "c")
            return


def progress(c, T, total, scenes):
    line(c, 0, H - 3, W, H - 3, L30, 0.9, 6)
    c.drawRect(skia.Rect.MakeXYWH(0, H - 6, W * T / total, 6), paint(L70))
    for s in scenes[1:]:
        x = W * s.start / total
        c.drawRect(skia.Rect.MakeXYWH(x - 1, H - 6, 2, 6), paint(L10, 0.9))


# ---------------------------------------------------------------- 场景


def scene_open(c, s, t):
    rot = t * 3.0
    k0 = pin(t, 0.3, 2.0)
    for i in range(3):
        ph = ((t * 0.32 + i / 3) % 1.0)
        circle(c, W / 2, 360, 140 + ph * 520, stroke=L40, a=0.28 * (1 - ph) * k0, sw=2)
    glow(c, W / 2, 360, 170, L50, 0.25 * k0)
    compass(c, W / 2, 360, 150, rot, k0)

    big = font("serif_b", 60)
    k1 = pin(t, s.cues[0], 0.8) * pout(t, s.cues[1] - 0.5)
    if k1:
        with rise(c, k1):
            tag(c, "传说 · 壹", W / 2 - 60, 572, dark=True)
            text(c, "海贼王的宝藏，埋在大海深处", W / 2, 690, big, WHITE, 1, "c")
    k2 = pin(t, s.cues[1], 0.8) * pout(t, s.cues[2] - 0.5)
    if k2:
        with rise(c, k2):
            tag(c, "传说 · 贰", W / 2 - 60, 572, dark=True)
            text(c, "芒格的 100 个思维模型", W / 2, 690, big, WHITE, 1, "c")
    k3 = pin(t, s.cues[2], 1.2)
    if k3:
        with group(c, k3, dy=(1 - k3) * 30):
            text(c, "芒格的宝藏", W / 2, 700, font("serif_k", 132), WHITE, 1, "c", track=10)
            text(c, "查理·芒格的智慧、思维模型与人生观", W / 2, 776, font("sans_m", 34), L30, 1, "c", track=4)
            text(c, "THE LATTICEWORK OF CHARLIE MUNGER", W / 2, 832, font("sans_m", 22), L40, 1, "c", track=9)


_LAT_LABELS = ["复利", "概率", "排列组合", "临界质量", "冗余备份", "安全边际", "进化", "适应", "机会成本",
               "规模优势", "护城河", "激励", "社会认同", "能力圈", "逆向思考", "误判心理学"]


def _lattice():
    rnd = random.Random(11)
    pts = []
    cols, rows = 7, 4
    for r in range(rows):
        for q in range(cols):
            x = 230 + q * 243 + (121 if r % 2 else 0) + rnd.uniform(-34, 34)
            if x > 1740:
                continue
            y = 380 + r * 140 + rnd.uniform(-26, 26)
            pts.append((x, y))
    edges = set()
    for i, p in enumerate(pts):
        near = sorted(range(len(pts)), key=lambda j: (pts[j][0] - p[0]) ** 2 + (pts[j][1] - p[1]) ** 2)[1:4]
        for j in near:
            edges.add((min(i, j), max(i, j)))
    order = sorted(range(len(pts)), key=lambda i: (pts[i][0] - 960) ** 2 + (pts[i][1] - 590) ** 2)
    rank = {i: n for n, i in enumerate(order)}
    labeled = sorted(rnd.sample(range(len(pts)), len(_LAT_LABELS)))
    labels = {i: _LAT_LABELS[n] for n, i in enumerate(labeled)}
    return pts, sorted(edges), rank, labels


LATTICE = _lattice()


def draw_lattice(c, t, t0, light_t=None, a=1.0):
    pts, edges, rank, labels = LATTICE
    appear = lambda i: t0 + rank[i] * 0.09
    for i, j in edges:
        ts = max(appear(i), appear(j)) + 0.2
        k = ease((t - ts) / 0.6)
        if k <= 0:
            continue
        (x1, y1), (x2, y2) = pts[i], pts[j]
        line(c, x1, y1, x1 + (x2 - x1) * k, y1 + (y2 - y1) * k, L40, 0.8 * a, 2.5)
    for i, (x, y) in enumerate(pts):
        k = pin(t, appear(i), 0.5)
        if k <= 0:
            continue
        lit = 0.0
        if light_t is not None:
            dist = math.hypot(x - 960, y - 590)
            lit = clamp((t - light_t) * 520 - dist, 0, 120) / 120
        if i in labels:
            f = font("sans_m", 25)
            with group(c, k * a, scale=0.6 + 0.4 * k, origin=(x, y)):
                pill(c, labels[i], x, y, f, fill=L70 if lit > 0.5 else L20, color=WHITE if lit > 0.5 else L90,
                     stroke=L70 if lit > 0.5 else L30)
        else:
            circle(c, x, y, 9 * k, fill=L70 if lit > 0.5 else L40, a=a)
            circle(c, x, y, 15 * k, stroke=L40, a=0.5 * a, sw=1.5)


def scene_truth(c, s, t):
    ka = pout(t, s.cues[2] - 0.4, 0.6)
    if ka > 0:
        with group(c, ka):
            # 左：100 → 80～90
            k100 = pin(t, 0.2, 0.8)
            fade100 = pout(t, s.cues[1] + 0.3, 0.7)
            with group(c, k100 * (0.35 + 0.65 * fade100)):
                text(c, "100", 520, 560, font("serif_k", 300), L40, 1, "c")
                text(c, "个思维模型？", 520, 650, font("sans_m", 40), L60, 1, "c")
            ks = ease((t - s.cues[0] - 2.2) / 0.7)
            if ks > 0:
                line(c, 290, 470, 290 + 470 * ks, 470 - 120 * ks, L90, 1, 14)
            k80 = pin(t, s.cues[1] + 2.0, 0.8)
            if k80:
                with rise(c, k80):
                    rrect(c, 250, 690, 540, 170, 24, fill=L70, shadow=1)
                    text(c, "80～90", 520, 790, font("serif_k", 92), WHITE, 1, "c")
                    text(c, "个重要模型 ≈ 九成的工作", 520, 838, font("sans_m", 26), L30, 1, "c")
            # 右：原话卡片
            kq = pin(t, s.cues[1] + 0.3, 0.8)
            if kq:
                with rise(c, kq):
                    rrect(c, 960, 240, 820, 560, 26, fill=L20, stroke=L30, shadow=1)
                    tag(c, "芒格原话 · 1994 南加州大学商学院演讲", 1010, 282)
                    text(c, "“", 1000, 430, font("serif_k", 120), L30)
                    para(c, "大约八九十个重要模型，就能承担起让你成为“普世智慧”之人九成的工作。", 1060, 410,
                         font("serif_b", 44), L100, 680, 66)
                    para(c, "“80 or 90 important models will carry about 90% of the freight in making you "
                            "a worldly-wise person.”", 1060, 640, font("sans_l", 27), L60, 680, 40)
    kb = pin(t, s.cues[2] - 0.2, 0.6)
    if kb:
        with group(c, kb):
            draw_lattice(c, t, s.cues[2], light_t=s.cues[3] + 0.4)
            kc = pin(t, s.cues[3], 0.7)
            if kc:
                with rise(c, kc):
                    rrect(c, 560, 200, 800, 92, 46, fill=L90, shadow=1)
                    text(c, "宝藏 = 一张格栅，而不是一份清单", 960, 260, font("serif_b", 40), WHITE, 1, "c")
            kt = pin(t, s.cues[2] + 0.4) * pout(t, s.cues[3] - 0.3)
            if kt:
                text(c, "LATTICEWORK OF MENTAL MODELS", 960, 254, font("sans_m", 24), L50, kt, "c", track=8)


_BIO = [
    ("1924", "出生于内布拉斯加州\n奥马哈", (0, 1.8)),
    ("1948", "哈佛法学院毕业\n（优异成绩）", (1, 0.62)),
    ("1959", "在家乡奥马哈\n结识巴菲特", (2, 0.0)),
    ("1962", "创办律师事务所\n与投资合伙企业", (2, 0.3)),
    ("1978", "出任伯克希尔\n副董事长", (2, 0.42)),
    ("2023", "11 月 28 日辞世\n享年 99 岁", (3, 0.0)),
]


def scene_bio(c, s, t):
    k = pin(t, 0.25, 0.8)
    with rise(c, k):
        text(c, "查理·芒格", LEFT + 40, 296, font("serif_k", 88), L90)
        text(c, "Charles T. Munger  ·  1924 – 2023", LEFT + 44, 352, font("sans_m", 30), L60)
        text(c, "伯克希尔·哈撒韦副董事长 · 巴菲特半个多世纪的搭档", LEFT + 44, 400, font("sans", 28), L100)
    ke = pin(t, s.cues[1] + 0.3, 0.6)
    if ke:
        x = LEFT + 44
        for n, label in enumerate(["密歇根大学 · 数学", "加州理工 · 气象学", "哈佛法学院 · 法学博士"]):
            kk = pin(t, s.cues[1] + 0.3 + n * 1.6, 0.6)
            with rise(c, kk, 14):
                f = font("sans_m", 24)
                w = tw(label, f) + 44
                pill(c, label, x + w / 2, 462, f, fill=L20 if n < 2 else L70, color=L80 if n < 2 else WHITE,
                     stroke=L30 if n < 2 else L70)
            x += w + 18
    kb = pin(t, s.cues[3] + 0.6, 0.9)
    if kb:
        with group(c, kb, scale=0.8 + 0.2 * kb, origin=(1560, 330)):
            glow(c, 1560, 330, 150, L40, 0.5)
            circle(c, 1560, 330, 140, fill=L70)
            circle(c, 1560, 330, 154, stroke=L40, sw=3)
            text(c, "99", 1560, 362, font("serif_k", 120), WHITE, 1, "c")
            text(c, "岁 · 离百岁仅 34 天", 1560, 412, font("sans_m", 22), L30, 1, "c")

    x0, x1, y = 230, 1690, 640
    times = [s.cues[i] + s.lens[i] * f for _, _, (i, f) in _BIO]
    line(c, x0 - 40, y, x1 + 40, y, L30, pin(t, 0.6, 1.0), 5)
    shown = [n for n, tt in enumerate(times) if t >= tt]
    if shown:
        xn = x0 + (x1 - x0) * shown[-1] / (len(_BIO) - 1)
        prev = x0 + (x1 - x0) * max(0, shown[-1] - 1) / (len(_BIO) - 1)
        kk = pin(t, times[shown[-1]], 0.8)
        line(c, x0 - 40, y, prev + (xn - prev) * kk, y, L70, 1, 5)
    for n, (year, label, _) in enumerate(_BIO):
        kn = pin(t, times[n], 0.6)
        if kn <= 0:
            continue
        x = x0 + (x1 - x0) * n / (len(_BIO) - 1)
        with rise(c, kn, 18):
            circle(c, x, y, 17, fill=L70)
            circle(c, x, y, 17, stroke=L10, sw=4)
            text(c, year, x, y - 42, font("serif_k", 50), L90, 1, "c")
            for i, ln in enumerate(label.split("\n")):
                text(c, ln, x, y + 66 + i * 38, font("sans" if i else "sans_m", 26), L100 if i == 0 else L60, 1, "c")


def hammer(c, px, py, ang, a=1.0):
    c.save()
    c.translate(px, py)
    c.rotate(ang)
    rrect(c, 0, -13, 300, 26, 13, fill=L60, a=a)
    rrect(c, 40, -13, 60, 26, 8, fill=L80, a=a)
    rrect(c, 276, -86, 70, 172, 14, fill=L90, a=a)
    rrect(c, 284, -78, 16, 156, 8, fill=L80, a=a)
    c.restore()


def scene_hammer(c, s, t):
    kh = pin(t, 0.3, 0.8) * pout(t, s.cues[2] - 0.2, 0.6)
    if kh:
        with group(c, kh):
            rrect(c, 260, 640, 640, 40, 12, fill=L30)
            phase = (t * 1.05) % 1.0
            swing = (0.5 + 0.5 * math.cos(2 * math.pi * phase)) ** 1.6
            hits = math.floor(t * 1.05 + 0.5)
            sink = min(36, hits * 4)
            for n, nx in enumerate([430, 580, 730]):
                d = sink if n == 1 else 8 + n * 6
                c.drawRect(skia.Rect.MakeXYWH(nx - 5, 640 - 74 + d, 10, 74), paint(L80))
                rrect(c, nx - 22, 640 - 82 + d, 44, 10, 4, fill=L90)
            hammer(c, 255, 470 + sink, -46 * swing)
            text(c, "铁锤人倾向", 580, 770, font("serif_k", 58), L90, 1, "c")
            text(c, "MAN-WITH-A-HAMMER SYNDROME", 580, 818, font("sans_m", 21), L50, 1, "c", track=5)
    kt = pin(t, s.cues[2] - 0.1, 0.8)
    if kt:
        with group(c, kt):
            cx, cy = 560, 520
            items = ["数学", "物理", "工程", "生物学", "心理学", "经济学", "会计", "历史"]
            for n, name in enumerate(items):
                kk = pin(t, s.cues[2] + 0.5 + n * 0.35, 0.6)
                ang = -math.pi / 2 + n * 2 * math.pi / len(items)
                x, y = cx + 290 * math.cos(ang), cy + 250 * math.sin(ang)
                line(c, cx, cy, cx + (x - cx) * kk, cy + (y - cy) * kk, L40, 0.9, 3)
                if kk:
                    with group(c, kk, scale=0.6 + 0.4 * kk, origin=(x, y)):
                        pill(c, name, x, y, font("sans_m", 28), fill=L20, color=L90)
            glow(c, cx, cy, 110, L40, 0.45)
            circle(c, cx, cy, 86, fill=L70)
            text(c, "问题", cx, cy + 16, font("serif_k", 46), WHITE, 1, "c")
    kq = pin(t, s.cues[0] + 0.6, 0.8)
    if kq:
        q2 = pin(t, s.cues[2] - 0.1, 0.8)
        with rise(c, kq):
            rrect(c, 1040, 250, 740, 300, 26, fill=L20, stroke=L30, shadow=1)
            text(c, "“", 1078, 372, font("serif_k", 120), L30)
            with group(c, 1 - q2):
                para(c, "在手里只有锤子的人看来，\n每个问题都像一颗钉子。", 1130, 360, font("serif_b", 46), L100, 620, 70)
            if q2:
                with group(c, q2):
                    para(c, "解药：掌握各学科的核心道理，\n并且习惯性地一起使用。", 1130, 360, font("serif_b", 42), L70, 640, 70)
            text(c, "1994 · 南加州大学商学院演讲", 1130, 516, font("sans_m", 22), L60)
    k2 = pin(t, s.cues[1] + 0.4, 0.8)
    if k2:
        with rise(c, k2):
            steps = ["只懂一门学科", "只有一套框架", "系统性盲点"]
            y = 690
            x = 1060
            for n, st in enumerate(steps):
                kk = pin(t, s.cues[1] + 0.4 + n * 0.8, 0.6)
                f = font("sans_m", 28)
                w = tw(st, f) + 48
                with group(c, kk):
                    dark = n == 2
                    rrect(c, x, y - 36, w, 72, 36, fill=L70 if dark else L20, stroke=None if dark else L30)
                    text(c, st, x + w / 2, y + 10, f, WHITE if dark else L80, 1, "c")
                    if n < 2:
                        arrow(c, x + w + 10, y, x + w + 50, y, L50, 1, 3, 13)
                x += w + 60


_DISC = [
    ("数学", "数", ["复利", "排列组合", "概率"], (0, 0.0)),
    ("物理·工程", "理", ["临界质量", "冗余备份", "安全边际"], (1, 0.0)),
    ("生物学", "生", ["进化", "适应"], (2, 0.0)),
    ("经济学", "经", ["机会成本", "规模优势", "护城河"], (2, 0.45)),
    ("心理学", "心", ["误判心理学", "25 种倾向", "激励"], (3, 0.2)),
]
_GEMS = ["复利", "逆向思考", "能力圈", "激励", "误判心理学"]


def scene_disciplines(c, s, t):
    cw, gap, x0, y0, ch = 300, 30, 150, 205, 500
    dim = 1 - 0.35 * pin(t, s.cues[4], 0.8)
    for n, (name, glyph, chips, (li, frac)) in enumerate(_DISC):
        ts = s.cues[li] + s.lens[li] * frac
        k = pin(t, ts, 0.7)
        if k <= 0:
            continue
        x = x0 + n * (cw + gap)
        hi = n == 4
        with group(c, k * dim, dy=(1 - k) * 30):
            rrect(c, x, y0, cw, ch, 26, fill=L70 if hi else L20, stroke=None if hi else L30, shadow=1)
            circle(c, x + cw / 2, y0 + 92, 52, fill=L10 if hi else L70)
            text(c, glyph, x + cw / 2, y0 + 110, font("serif_k", 50), L70 if hi else WHITE, 1, "c")
            text(c, name, x + cw / 2, y0 + 210, font("serif_k", 40), WHITE if hi else L90, 1, "c")
            for m, chip in enumerate(chips):
                kk = pin(t, ts + 0.3 + m * 0.35, 0.5)
                with group(c, kk):
                    pill(c, chip, x + cw / 2, y0 + 286 + m * 62, font("sans_m", 26),
                         fill=L80 if hi else L10, color=WHITE if hi else L80, stroke=L60 if hi else L30)
        if hi and k > 0.5:
            text(c, "—— 被严重低估 ——", x + cw / 2, y0 + ch - 26, font("sans_b", 24), L30, pin(t, ts + 0.6), "c")
    kg = pin(t, s.cues[4], 0.7)
    if kg:
        with rise(c, kg):
            rrect(c, 150, 750, 1620, 130, 30, fill=L90, shadow=1)
            text(c, "五颗宝石", 210, 828, font("serif_k", 38), WHITE)
            for n, g in enumerate(_GEMS):
                kk = pin(t, s.cues[4] + 0.5 + n * 0.45, 0.5)
                x = 520 + n * 262
                with group(c, kk, scale=0.5 + 0.5 * kk, origin=(x, 815)):
                    gem(c, x, 812, 46, halo=0.6)
                    text(c, g, x + 38, 826, font("sans_m", 28), L20)


def scene_compound(c, s, t):
    x0, y0, x1, y1 = 200, 260, 1150, 810
    X = lambda yr: x0 + (x1 - x0) * yr / 40
    Y = lambda v: y1 - (y1 - y0) * v / 50
    ka = pin(t, 0.3, 0.8)
    with group(c, ka):
        for v in range(10, 51, 10):
            line(c, x0, Y(v), x1, Y(v), L30, 0.7, 1.5)
            text(c, f"{v}", x0 - 18, Y(v) + 8, font("sans_m", 22), L60, 1, "r")
        line(c, x0, y1, x1 + 10, y1, L60, 1, 2.5)
        line(c, x0, y0 - 10, x0, y1, L60, 1, 2.5)
        for yr in range(0, 41, 10):
            text(c, f"{yr}", X(yr), y1 + 38, font("sans_m", 22), L60, 1, "c")
        text(c, "年", x1 + 34, y1 + 38, font("sans_m", 22), L60, 1, "c")
        text(c, "1 元本金的价值（年化 10%）", x0 + 10, y0 - 22, font("sans_m", 24), L80)
    prog_yr = 40 * smooth((t - s.cues[1] - 0.2) / 5.0)
    if prog_yr > 0:
        split = pin(t, s.cues[2], 0.8)
        for lo, hi, col, al in [(0, 20, L30, 0.75), (20, 40, L40, 0.6)]:
            top = min(prog_yr, hi)
            if top <= lo:
                continue
            path = skia.Path()
            path.moveTo(X(lo), y1)
            yr = lo
            while yr <= top:
                path.lineTo(X(yr), Y(1.1 ** yr))
                yr += 0.25
            path.lineTo(X(top), Y(1.1 ** top))
            path.lineTo(X(top), y1)
            path.close()
            c.drawPath(path, paint(col, al * (0.35 + 0.65 * split)))
        path = skia.Path()
        path.moveTo(X(0), Y(1))
        yr = 0.0
        while yr <= prog_yr:
            path.lineTo(X(yr), Y(1.1 ** yr))
            yr += 0.2
        path.lineTo(X(prog_yr), Y(1.1 ** prog_yr))
        c.drawPath(path, paint(L70, 1, stroke=6, round_cap=True))
        for yr, lab in [(10, "×2.6"), (20, "×6.7"), (30, "×17.4"), (40, "×45.3")]:
            if prog_yr >= yr - 0.01:
                kk = pin(t, s.cues[1] + 0.2 + 5.0 * (yr / 40) ** 0.7 * 0.9, 0.4)
                circle(c, X(yr), Y(1.1 ** yr), 11 * kk, fill=L70)
                circle(c, X(yr), Y(1.1 ** yr), 11 * kk, stroke=L10, sw=3)
                text(c, lab, X(yr) - 18, Y(1.1 ** yr) - 22, font("sans_b", 28), L90, kk, "r")
        if split:
            line(c, X(20), y0 + 40, X(20), y1, L50, split * 0.9, 2)
            text(c, "前 20 年", X(10), Y(16), font("serif_b", 32), L60, split, "c")
            text(c, "1 → 6.7", X(10), Y(16) + 44, font("sans_b", 30), L60, split, "c")
            text(c, "后 20 年", X(27.5), Y(40), font("serif_b", 32), L80, split, "c")
            text(c, "6.7 → 45.3", X(27.5), Y(40) + 44, font("sans_b", 30), L80, split, "c")
    rx, rw = 1250, 540
    quote_card(c, rx, 230, rw, 210, "复利的第一条规则：永远不要不必要地打断它。", "芒格", pin(t, s.cues[0] + 0.8), size=36)
    k1 = pin(t, s.cues[1] + 0.5, 0.8)
    if k1:
        with rise(c, k1):
            rrect(c, rx, 470, rw, 190, 22, fill=L20, stroke=L30, shadow=1)
            text(c, "10% × 40 年", rx + 40, 540, font("sans_b", 34), L60)
            text(c, "≈ 45 倍", rx + 40, 628, font("serif_k", 80), L70)
    quote_card(c, rx, 690, rw, 190, "大钱不在买进卖出之间，\n而在耐心等待之中。", None, pin(t, s.cues[3] + 2.6), dark=True, size=36)


_MISERY = ["依赖改变情绪的药物", "心怀嫉妒与怨恨", "做一个不可靠的人", "只从自己的经历中学习", "跌倒以后一蹶不振"]


def scene_inversion(c, s, t):
    ka = pin(t, 0.3, 0.8) * pout(t, s.cues[2] - 0.3, 0.6)
    if ka:
        with group(c, ka):
            text(c, "INVERT,  ALWAYS  INVERT", W / 2, 300, font("sans_l", 34), L50, 1, "c", track=10)
            k = pin(t, s.cues[0] + 3.0, 0.9)
            with rise(c, k):
                text(c, "反过来想，总是反过来想。", W / 2, 420, font("serif_k", 84), L90, 1, "c")
                text(c, "—— 卡尔·雅可比（数学家），芒格最爱引用的格言之一", W / 2, 486, font("sans_m", 26), L60, 1, "c")
            quote_card(c, 400, 560, 1120, 220, "我只想知道自己将来会死在哪里，\n这样我就永远不去那儿。", "芒格常讲的乡下人笑话",
                       pin(t, s.cues[1] + 0.3), size=40)
    kb = pin(t, s.cues[2] - 0.2, 0.7)
    if not kb:
        return
    with group(c, kb):
        # 左：翻转的问题 + 痛苦处方
        flip = smooth((t - s.cues[2] - 1.2) / 0.8)
        sy = abs(math.cos(flip * math.pi))
        q = "如何过上幸福成功的一生？" if flip < 0.5 else "如何确保过上痛苦的一生？"
        c.save()
        c.translate(0, 268)
        c.scale(1, max(0.02, sy))
        rrect(c, LEFT + 40, -60, 780, 110, 26, fill=L20 if flip < 0.5 else L70, stroke=L30 if flip < 0.5 else None)
        text(c, q, LEFT + 430, 16, font("serif_k", 46), L90 if flip < 0.5 else WHITE, 1, "c")
        c.restore()
        tag(c, "1986 · 哈佛学校毕业典礼演讲", LEFT + 40, 350)
        for n, item in enumerate(_MISERY):
            ts = s.cues[3] + s.lens[3] * n / len(_MISERY)
            kk = pin(t, ts, 0.5)
            if kk <= 0:
                continue
            y = 450 + n * 82
            with group(c, kk, dx=(1 - kk) * -24):
                cross_icon(c, LEFT + 66, y - 12, 22)
                text(c, item, LEFT + 108, y, font("sans_m", 34), L100)
                if t > s.cues[4] + 0.6:
                    ks = ease((t - s.cues[4] - 0.6 - n * 0.15) / 0.4)
                    line(c, LEFT + 104, y - 12, LEFT + 108 + (tw(item, font("sans_m", 34)) + 6) * ks, y - 12, L70, 0.85, 3)
        # 右：避开失败之路 + 名言
        k4 = pin(t, s.cues[4], 0.7)
        if k4:
            with rise(c, k4):
                bx = 1060
                boxes = [("列出所有通往失败的路", L20, L80), ("逐一避开", L30, L90), ("剩下的，才是成功之路", L70, WHITE)]
                for n, (lab, fill, col) in enumerate(boxes):
                    kk = pin(t, s.cues[4] + n * 0.7, 0.5)
                    y = 220 + n * 128
                    with group(c, kk):
                        rrect(c, bx, y, 700, 88, 44, fill=fill, stroke=L30 if n < 2 else None)
                        text(c, lab, bx + 350, y + 56, font("sans_b", 32), col, 1, "c")
                        if n < 2:
                            arrow(c, bx + 350, y + 92, bx + 350, y + 124, L50, 1, 3, 12)
        quote_card(c, 1060, 600, 700, 250, "长期优势来自始终努力不做蠢事，而不是努力变得非常聪明。", "芒格",
                   pin(t, s.cues[5] + 0.3), dark=True, size=36)


def scene_circle(c, s, t):
    cx, cy = 600, 545
    ks = [pin(t, 0.3 + n * 0.35, 0.9) for n in range(3)]
    circle(c, cx, cy, 330 * ks[0], fill=L20, stroke=L30, sw=2)
    circle(c, cx, cy, 235 * ks[1], fill=L30)
    circle(c, cx, cy, 140 * ks[2], fill=L70)
    if ks[2] > 0.5:
        text(c, "不懂的领域", cx, cy - 268, font("sans_m", 28), L60, ks[0], "c")
        text(c, "似懂非懂", cx, cy - 176, font("sans_m", 28), L80, ks[1], "c")
        text(c, "真正懂的", cx, cy + 16, font("serif_k", 44), WHITE, ks[2], "c")
    kb = pin(t, s.cues[1] + 1.5, 0.8)
    if kb:
        pulse = 0.5 + 0.5 * math.sin(t * 4)
        glow(c, cx, cy, 150, L40, 0.0)
        dashed_circle(c, cx, cy, 146, L90, kb, 6 + 2 * pulse, 22, -t * 40)
        with group(c, kb):
            arrow(c, cx + 214, cy + 262, cx + 110, cy + 112, L90, 1, 3.5, 16)
            rrect(c, cx + 126, cy + 268, 248, 64, 32, fill=L90)
            text(c, "边界，才是关键", cx + 250, cy + 311, font("sans_b", 28), WHITE, 1, "c")
    rx = 1080
    quote_card(c, rx, 220, 700, 250, "能力圈有多大并不重要，\n清楚它的边界，才至关重要。", "巴菲特 · 1996 年致股东信",
               pin(t, s.cues[1] + 0.3), size=38)
    quote_card(c, rx, 500, 700, 250, "如果你去玩那些别人有天赋、而你没有的游戏，你注定会输。", "芒格 · 1994 南加大演讲",
               pin(t, s.cues[2] + 0.3), size=36)
    k3 = pin(t, s.cues[3], 0.7)
    if k3:
        with rise(c, k3):
            rrect(c, rx, 780, 700, 84, 42, fill=L70, shadow=1)
            text(c, "知道自己不知道什么，往往比聪明更有用", rx + 350, 834, font("sans_b", 30), WHITE, 1, "c")


def flow_row(c, labels, x, y, k_list, dark):
    f = font("sans_b", 30)
    for n, lab in enumerate(labels):
        kk = k_list[n]
        w = 400
        bx = x + n * (w + 90)
        if kk <= 0:
            continue
        with group(c, kk, dx=(1 - kk) * -20):
            rrect(c, bx, y, w, 100, 24, fill=L70 if dark else L20, stroke=None if dark else L40, sw=2.5,
                  shadow=1 if dark else 0)
            text(c, lab, bx + w / 2, y + 62, f, WHITE if dark else L60, 1, "c")
            if n < len(labels) - 1:
                arrow(c, bx + w + 14, y + 50, bx + w + 76, y + 50, L70 if dark else L40, 1, 4, 16)


def scene_incentive(c, s, t):
    k0 = pin(t, s.cues[0] + 1.0, 0.8)
    if k0:
        with rise(c, k0):
            rrect(c, LEFT + 40, 205, 1640, 220, 28, fill=L20, stroke=L30, shadow=1)
            text(c, "前 5%", LEFT + 100, 350, font("serif_k", 120), L70)
            text(c, "芒格自评：一辈子都是同龄人里最懂激励的人之一，", LEFT + 520, 300, font("sans_m", 32), L80)
            k = pin(t, s.cues[0] + s.lens[0] * 0.7, 0.7)
            text(c, "却还是一辈子都在低估它。", LEFT + 520, 370, font("serif_k", 50), L90, k)
            text(c, "1995 · 人类误判心理学", LEFT + 520, 410, font("sans_m", 22), L60, k)
    if t > s.cues[1]:
        tag(c, "案例 · 联邦快递夜班分拣", LEFT + 40, 466, pin(t, s.cues[1], 0.5))
        text(c, "改革前", LEFT + 40, 590, font("sans_b", 30), L50, pin(t, s.cues[1], 0.5))
        flow_row(c, ["按小时付薪", "拖得越久，挣得越多", "分拣总是延误"], LEFT + 180, 528,
                 [pin(t, s.cues[1] + 0.3 + n * 0.9, 0.5) for n in range(3)], False)
        kx = pin(t, s.cues[1] + s.lens[1] * 0.6, 0.5)
        if kx:
            pill(c, "讲道理、做动员：统统无效", 1560, 486, font("sans_m", 22), fill=L10, color=L60, a=kx)
    if t > s.cues[2]:
        text(c, "改革后", LEFT + 40, 722, font("sans_b", 30), L70, pin(t, s.cues[2], 0.5))
        flow_row(c, ["按班次付薪", "干完就能回家", "问题迎刃而解"], LEFT + 180, 660,
                 [pin(t, s.cues[2] + s.lens[2] * f, 0.5) for f in (0.35, 0.6, 0.85)], True)
    k3 = pin(t, s.cues[3], 0.7)
    if k3:
        with rise(c, k3):
            text(c, "想预测一个人的行为，先看清他的激励。", W / 2, 850, font("serif_k", 46), L90, 1, "c")


_TENDENCIES = ["奖惩超级反应", "喜欢 / 热爱", "讨厌 / 憎恨", "避免怀疑", "避免不一致", "好奇心", "康德式公平",
               "艳羡 / 妒忌", "回馈倾向", "简单联想", "心理否认", "自视过高", "过度乐观", "被剥夺超级反应",
               "社会认同", "对比错误反应", "压力影响", "易得性误判", "不用就忘", "化学物质影响", "衰老影响",
               "权威误导", "废话倾向", "重视理由", "Lollapalooza"]
_NAMED = [(0, "奖励与惩罚"), (4, "避免不一致"), (14, "社会认同"), (13, "被剥夺"), (21, "权威误导")]


def scene_biases(c, s, t):
    tw_, th, gap = 300, 86, 14
    gx = (W - (5 * tw_ + 4 * gap)) / 2
    gy = 214
    hl_t = {idx: s.word(1, w) for idx, w in _NAMED}
    merge = smooth((t - s.word(2, "同时出现")) / 1.4)
    fade = 1 - 0.78 * merge
    f = font("sans_m", 26)
    for n, name in enumerate(_TENDENCIES):
        k = pin(t, s.cues[0] + 0.6 + n * 0.06, 0.4)
        if k <= 0:
            continue
        x, y = gx + (n % 5) * (tw_ + gap), gy + (n // 5) * (th + gap)
        hi = n in hl_t and t >= hl_t[n]
        last = n == 24
        with group(c, k * (fade if not hi else 1 - merge)):
            rrect(c, x, y, tw_, th, 18, fill=L70 if hi else (L30 if last else L20), stroke=None if hi else L30)
            text(c, f"{n + 1:02d}", x + 22, y + 54, font("sans_b", 20), L30 if hi else L50)
            text(c, name, x + 64, y + 55, f, WHITE if hi else L100)
    if merge > 0:
        cx, cy = W / 2, 480
        for n, (idx, _) in enumerate(_NAMED):
            x0 = gx + (idx % 5) * (tw_ + gap) + tw_ / 2
            y0 = gy + (idx // 5) * (th + gap) + th / 2
            ang = -math.pi / 2 + n * 2 * math.pi / 5
            tx, ty = cx + 420 * math.cos(ang), cy + 230 * math.sin(ang)
            x, y = x0 + (tx - x0) * merge, y0 + (ty - y0) * merge
            line(c, cx, cy, x, y, L40, 0.6 * merge, 2)
            pill(c, _TENDENCIES[idx], x, y, font("sans_b", 24), fill=L70, color=WHITE, stroke=L50)
        burst = smooth((t - s.word(2, "同时出现") - 1.0) / 1.0)
        if burst:
            for r in range(4):
                ph = (t * 0.5 + r / 4) % 1.0
                circle(c, cx, cy, 120 + ph * 330, stroke=L50, a=0.45 * (1 - ph) * burst, sw=3)
            glow(c, cx, cy, 170, L40, 0.6 * burst)
            with group(c, burst, scale=0.7 + 0.3 * burst, origin=(cx, cy)):
                rrect(c, cx - 250, cy - 70, 500, 140, 70, fill=L90, shadow=1)
                text(c, "Lollapalooza 效应", cx, cy + 4, font("serif_k", 46), WHITE, 1, "c")
                text(c, "多种倾向叠加 · 相互放大", cx, cy + 46, font("sans_m", 24), L30, 1, "c")
    for n, (lab, x, y) in enumerate([("拍卖会上的疯狂竞价", 330, 780), ("邪教的控制", 960, 820), ("资产泡沫", 1590, 780)]):
        kk = pin(t, s.cues[3] + s.lens[3] * n * 0.28, 0.6)
        if kk:
            line(c, W / 2 + (x - W / 2) * 0.2, 560, x, y - 40, L40, kk * 0.8, 2.5)
            with group(c, kk, scale=0.7 + 0.3 * kk, origin=(x, y)):
                pill(c, lab, x, y, font("sans_b", 30), fill=L20, color=L90, stroke=L40)


def scene_dualtrack(c, s, t):
    tag(c, "跨学科解读 · Kahneman《思考，快与慢》2011", LEFT + 40, 190, pin(t, 0.3))
    k0 = pin(t, s.cues[0] + 1.2, 0.8)
    if k0:
        with rise(c, k0):
            for n, (name, desc, col, speed, dots) in enumerate([
                ("系统 1", "快速 · 自动 · 直觉 · 省力", L70, 430, 7),
                ("系统 2", "缓慢 · 费力 · 推理 · 易疲劳", L50, 70, 4),
            ]):
                y = 300 + n * 170
                text(c, name, LEFT + 40, y, font("serif_k", 50), col)
                text(c, desc, LEFT + 240, y - 4, font("sans_m", 28), L80)
                lx0, lx1 = LEFT + 40, 900
                rrect(c, lx0, y + 36, lx1 - lx0, 20, 10, fill=L20, stroke=L30)
                for d in range(dots):
                    px = lx0 + 10 + ((t * speed + d * (lx1 - lx0) / dots) % (lx1 - lx0 - 20))
                    circle(c, px, y + 46, 7, fill=col)
    k1 = pin(t, s.cues[1] + 0.4, 0.7)
    if k1:
        with rise(c, k1):
            pill(c, "系统 1 先下判断", 330, 700, font("sans_b", 30), fill=L70, color=WHITE, stroke=L70, padx=30)
            arrow(c, 495, 700, 590, 700, L50, 1, 4, 16)
            k = pin(t, s.cues[1] + s.lens[1] * 0.55, 0.6)
            with group(c, k):
                pill(c, "系统 2 事后背书", 760, 700, font("sans_b", 30), fill=L20, color=L80, stroke=L40, padx=30)
            text(c, "芒格的误判清单，可以看作系统 1 的“使用说明书”", 540, 790, font("sans_m", 26), L60, k, "c")
    rx, rw = 1040, 740
    kh = pin(t, s.cues[2], 0.6)
    if kh:
        text(c, "芒格 · 两步分析法（1996）", rx, 268, font("sans_b", 28), L70, kh)
    for n, (title, body, li) in enumerate([("第一步 · 理性", "真正起决定作用的因素是什么？", 2),
                                           ("第二步 · 心理", "哪些潜意识倾向正在左右我？", 3)]):
        k = pin(t, s.cues[li] + (0.6 if n == 0 else 0.2), 0.7)
        if k:
            y = 300 + n * 190
            with rise(c, k):
                rrect(c, rx, y, rw, 160, 24, fill=L20 if n == 0 else L70, stroke=L30 if n == 0 else None, shadow=1)
                text(c, f"{n + 1}", rx + 60, y + 108, font("serif_k", 86), L40 if n == 0 else L50, 1, "c")
                text(c, title, rx + 124, y + 62, font("sans_b", 30), L70 if n == 0 else L30)
                text(c, body, rx + 124, y + 118, font("serif_b", 36), L100 if n == 0 else WHITE)
    k4 = pin(t, s.cues[4], 0.7)
    if k4:
        with rise(c, k4):
            y = 690
            rrect(c, rx, y, rw, 190, 24, fill=L20, stroke=L30, shadow=1)
            text(c, "检查清单", rx + 40, y + 52, font("sans_b", 28), L70)
            for n, item in enumerate(["激励是否扭曲了判断？", "是否还在能力圈之内？", "反过来想过了吗？"]):
                kk = ease((t - s.cues[4] - 0.8 - n * 0.9) / 0.5)
                yy = y + 74 + n * 38
                check_box(c, rx + 40 + (n % 3) * 0, yy, 28, kk)
                text(c, item, rx + 84, yy + 24, font("sans_m", 26), L100)


def hourglass(c, cx, cy, s, t):
    h, w = s, s * 0.62
    rrect(c, cx - w / 2 - 14, cy - h / 2 - 16, w + 28, 16, 6, fill=L80)
    rrect(c, cx - w / 2 - 14, cy + h / 2, w + 28, 16, 6, fill=L80)
    top = [(cx - w / 2, cy - h / 2), (cx + w / 2, cy - h / 2), (cx + 6, cy), (cx - 6, cy)]
    bot = [(cx - 6, cy), (cx + 6, cy), (cx + w / 2, cy + h / 2), (cx - w / 2, cy + h / 2)]
    poly(c, top, fill=L10, stroke=L60, sw=3)
    poly(c, bot, fill=L10, stroke=L60, sw=3)
    f = (t / 7.0) % 1.0
    ty = cy - h / 2 + (h / 2) * (0.25 + 0.75 * f)
    hw = (w / 2) * (1 - (ty - (cy - h / 2)) / (h / 2)) + 6 * (ty - (cy - h / 2)) / (h / 2)
    poly(c, [(cx - hw, ty), (cx + hw, ty), (cx + 6, cy - 2), (cx - 6, cy - 2)], fill=L50)
    fill_h = (h / 2) * 0.75 * f
    by = cy + h / 2 - fill_h
    bw = (w / 2) * (by - cy) / (h / 2)
    poly(c, [(cx - bw, by), (cx + bw, by), (cx + w / 2 - 3, cy + h / 2 - 2), (cx - w / 2 + 3, cy + h / 2 - 2)], fill=L50)
    line(c, cx, cy, cx, cy + h / 2 - fill_h, L50, 0.9, 3)


def scene_invest(c, s, t):
    cw, gap, x0, y0, ch = 510, 45, 150, 200, 670
    for n, li in enumerate([1, 3, 4]):
        k = pin(t, s.cues[li], 0.7)
        if k <= 0:
            continue
        x = x0 + n * (cw + gap)
        with rise(c, k, 34):
            rrect(c, x, y0, cw, ch, 28, fill=L20, stroke=L30, shadow=1)
            text(c, f"0{n + 1}", x + 40, y0 + 92, font("serif_k", 72), L40)
            title = ["伟大企业 × 合理价格", "少而精 · 下重注", "耐心 · 坐等投资法"][n]
            text(c, title, x + 40, y0 + 164, font("serif_k", 38), L90)
            line(c, x + 40, y0 + 196, x + cw - 40, y0 + 196, L30, 1, 2)
            if n == 0:
                pill(c, "伟大企业 · 合理价格", x + cw / 2, y0 + 262, font("sans_b", 28), fill=L70, color=WHITE, stroke=L70)
                text(c, "远胜于", x + cw / 2, y0 + 330, font("sans_m", 26), L60, 1, "c")
                pill(c, "平庸企业 · 便宜价格", x + cw / 2, y0 + 386, font("sans_m", 28), fill=L10, color=L60, stroke=L40)
                k2 = pin(t, s.cues[2] + 0.4, 0.7)
                if k2:
                    with rise(c, k2, 16):
                        rrect(c, x + 30, y0 + 446, cw - 60, 196, 20, fill=L70)
                        text(c, "1972 · 喜诗糖果", x + 60, y0 + 500, font("serif_k", 34), WHITE)
                        text(c, "约 2500 万美元买下", x + 60, y0 + 548, font("sans_m", 26), L20)
                        text(c, "推动巴菲特告别“捡烟蒂”", x + 60, y0 + 594, font("sans_m", 26), L20)
            elif n == 1:
                rnd = random.Random(5)
                for d in range(26):
                    circle(c, x + 70 + rnd.uniform(0, 160), y0 + 250 + rnd.uniform(0, 150), 8, fill=L40)
                for d, (dx, dy, r) in enumerate([(340, 290, 52), (420, 380, 40), (320, 395, 30)]):
                    circle(c, x + dx, y0 + dy, r, fill=L70)
                text(c, "撒胡椒面", x + 150, y0 + 450, font("sans_m", 24), L60, 1, "c")
                text(c, "重仓少数", x + 370, y0 + 470, font("sans_b", 24), L70, 1, "c")
                para(c, "好机会出现时下重注，\n其余时间按兵不动。", x + 40, y0 + 540, font("serif_b", 32), L100, cw - 80, 50)
            else:
                hourglass(c, x + 130, y0 + 350, 210, t)
                for m, item in enumerate(["交易少", "手续费少", "废话少"]):
                    kk = pin(t, s.cues[4] + s.lens[4] * (0.45 + m * 0.16), 0.5)
                    with group(c, kk, dx=(1 - kk) * 16):
                        check_box(c, x + 270, y0 + 262 + m * 70, 30, kk)
                        text(c, item, x + 316, y0 + 288 + m * 70, font("sans_b", 30), L90)
                para(c, "大钱在等待之中。", x + 40, y0 + 590, font("serif_b", 32), L100, cw - 80, 50)
    k0 = pin(t, s.cues[0] + 0.3, 0.6) * pout(t, s.cues[1] - 0.2)
    if k0:
        text(c, "把宝石放进投资里", W / 2, 540, font("serif_k", 76), L90, k0, "c")


def scene_life(c, s, t):
    k0 = pin(t, s.cues[0], 0.7)
    with rise(c, k0):
        text(c, "芒格的智慧，从来不只关于钱", W / 2, 248, font("serif_k", 54), L90, 1, "c")
    cards = [
        ("要得到一样东西，最好的办法，\n是让自己配得上它。", "2007 · 南加州大学法学院毕业演讲", 1),
        ("每天睡觉前，都努力比当天\n醒来时更聪明一点点。", "2007 · 南加州大学法学院毕业演讲", 2),
        ("嫉妒是唯一一种你完全\n享受不到任何乐趣的罪。", "远离嫉妒 · 怨恨 · 自怜", 3),
    ]
    cw, chh = 790, 270
    pos = [(150, 300), (980, 300), (150, 600)]
    for (q, src, li), (x, y) in zip(cards, pos):
        quote_card(c, x, y, cw, chh, q, src, pin(t, s.cues[li] + 0.2), size=38)
    k4 = pin(t, s.cues[4] + 0.2, 0.7)
    if k4:
        x, y = 980, 600
        with rise(c, k4):
            rrect(c, x, y, cw, chh, 22, fill=L70, shadow=1)
            text(c, "职业三原则", x + 50, y + 66, font("serif_k", 38), WHITE)
            for m, item in enumerate(["不卖自己不会买的东西", "不为自己不尊敬的人工作", "只和自己喜欢的人共事"]):
                kk = pin(t, s.cues[4] + s.lens[4] * (0.2 + m * 0.27), 0.5)
                with group(c, kk, dx=(1 - kk) * 16):
                    gem(c, x + 66, y + 118 + m * 52, 26, fill=L50)
                    text(c, item, x + 100, y + 130 + m * 52, font("sans_m", 31), WHITE)


def scene_critique(c, s, t):
    k0 = pin(t, s.cues[0] + 0.2, 0.7)
    with rise(c, k0):
        text(c, "把芒格本人，也反过来想一想", W / 2, 258, font("serif_k", 60), L90, 1, "c")
        text(c, "用芒格的方法审视芒格：方法 · 证据 · 风险", W / 2, 306, font("sans_m", 26), L60, 1, "c")
    cards = [
        ("方法", "收集 ≠ 智慧", "背下 100 个名词，不等于能在真实决策里熟练调用它们。芒格要的是“习惯性地使用”。"),
        ("证据", "幸存者偏差", "美国战后的长期繁荣、保险浮存金的结构优势、与巴菲特的搭档关系，都是难以复制的条件。"),
        ("风险", "芒格也会犯错", "他坦言投资阿里巴巴是自己最严重的错误之一（2023）；集中持仓，意味着波动同样集中。"),
    ]
    cw, gap, x0, y0, ch = 510, 45, 150, 340, 520
    for n, (tg, title, body) in enumerate(cards):
        k = pin(t, s.cues[n + 1] + 0.2, 0.7)
        if k <= 0:
            continue
        x = x0 + n * (cw + gap)
        with rise(c, k, 34):
            rrect(c, x, y0, cw, ch, 28, fill=L20, stroke=L30, shadow=1)
            tag(c, f"【{tg}】", x + 36, y0 + 36)
            text(c, title, x + 40, y0 + 150, font("serif_k", 46), L90)
            line(c, x + 40, y0 + 182, x + 120, y0 + 182, L70, 1, 5)
            para(c, body, x + 40, y0 + 250, font("sans", 30), L100, cw - 80, 48)


def scene_treasure(c, s, t):
    fin = pin(t, s.cues[3] - 0.2, 0.9)
    k0 = pin(t, s.cues[0], 0.7) * (1 - fin)
    if k0:
        with rise(c, k0):
            text(c, "芒格的宝藏，到底是什么？", W / 2, 260, font("serif_k", 64), WHITE, 1, "c")
    items = [("思维格栅", "LATTICEWORK", "一张"), ("逆向思考", "INVERSION", "一个"), ("学习机器", "LEARNING MACHINE", "一辈子")]
    for n, (zh, en, w) in enumerate(items):
        ts = s.word(1, w) if n == 0 else s.word(1, "一个反过来") if n == 1 else s.word(1, "以及")
        k = pin(t, ts, 0.8) * (1 - fin)
        if k <= 0:
            continue
        x = W / 2 + (n - 1) * 480
        with group(c, k, scale=0.7 + 0.3 * k, origin=(x, 470)):
            gem(c, x, 450, 150, halo=0.9 + 0.1 * math.sin(t * 2 + n))
            text(c, zh, x, 620, font("serif_k", 52), WHITE, 1, "c")
            text(c, en, x, 664, font("sans_m", 20), L40, 1, "c", track=5)
    k2 = pin(t, s.cues[2] + 0.4, 0.8) * (1 - fin)
    if k2:
        with rise(c, k2):
            para(c, "“他们不一定最聪明，甚至不一定最勤奋，但他们都是学习机器。”", W / 2, 770, font("serif_b", 36), L30, 1500, 54,
                 align="c")
            text(c, "—— 芒格 · 2007 南加州大学法学院毕业演讲", W / 2, 830, font("sans_m", 22), L40, 1, "c")
    if fin:
        with group(c, fin):
            compass(c, W / 2, 330, 120, t * 3, 0.8)
            text(c, "宝藏不在大海深处，", W / 2, 600, font("serif_k", 66), WHITE, 1, "c")
            text(c, "而在每天都比醒来时更聪明一点的航程里。", W / 2, 700, font("serif_k", 54), L20, 1, "c")


def scene_end(c, s, t):
    k0 = pin(t, 0.2, 0.8)
    with rise(c, k0):
        tag(c, "一句话记住芒格", W / 2 - 92, 160, dark=True)
        text(c, "用多学科的格栅看世界，反过来想，", W / 2, 290, font("serif_k", 58), WHITE, 1, "c")
        text(c, "避免愚蠢，然后耐心地让复利发生。", W / 2, 376, font("serif_k", 58), WHITE, 1, "c")
    ks = pin(t, s.end(0) + 0.4, 0.9)
    if ks:
        with rise(c, ks):
            line(c, 360, 450, 1560, 450, L60, 1, 2)
            text(c, "参考资料", 360, 506, font("sans_b", 28), L30)
            for n, (year, title) in enumerate(SOURCES):
                y = 562 + n * 46
                text(c, year, 360, y, font("sans_b", 24), L40)
                text(c, title, 460, y, font("sans", 24), L20)
            text(c, "旁白为离线合成语音（Piper · 小雅）· 画面配色：Loyel 渐变蓝", W / 2, 960, font("sans", 20), L40, 1, "c")
    out = smooth((t - (s.dur - 1.6)) / 1.4)
    if out:
        c.drawRect(skia.Rect.MakeWH(W, H), paint(L100, out))


SCENE_FN = {
    "open": scene_open, "truth": scene_truth, "bio": scene_bio, "hammer": scene_hammer,
    "disciplines": scene_disciplines, "compound": scene_compound, "inversion": scene_inversion,
    "circle": scene_circle, "incentive": scene_incentive, "biases": scene_biases, "dualtrack": scene_dualtrack,
    "invest": scene_invest, "life": scene_life, "critique": scene_critique, "treasure": scene_treasure, "end": scene_end,
}

# ---------------------------------------------------------------- 合成


def draw_scene(c, s, t):
    background(c, s.theme, s.start + t)
    SCENE_FN[s.id](c, s, t)
    if s.theme == "light":
        chrome(c, s, t)


class Renderer:
    def __init__(self):
        self.scenes, self.total = build()
        self.events = subtitle_events(self.scenes)
        self.surf = skia.Surface(W, H)
        self.aux = skia.Surface(W, H)

    def scene_at(self, T):
        for s in self.scenes:
            if T < s.start + s.dur:
                return s
        return self.scenes[-1]

    def frame(self, T) -> skia.Image:
        c = self.surf.getCanvas()
        s = self.scene_at(T)
        t = T - s.start
        draw_scene(c, s, t)
        if s.index > 0 and t < XFADE:
            prev = self.scenes[s.index - 1]
            ac = self.aux.getCanvas()
            draw_scene(ac, prev, prev.dur + t)
            p = skia.Paint(Alphaf=1 - smooth(t / XFADE))
            c.drawImage(self.aux.makeImageSnapshot(), 0, 0, skia.SamplingOptions(), p)
        if s.id != "end" or t < s.end(0) + 0.4:
            subtitles(c, T, self.events, s.theme)
        progress(c, T, self.total, self.scenes)
        return self.surf.makeImageSnapshot()


def encode_segment(args):
    i, f0, f1, out = args
    r = Renderer()
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-tune", "animation",
           "-pix_fmt", "yuv420p", "-threads", "1", str(out)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fr in range(f0, f1):
        img = r.frame(fr / FPS)
        proc.stdin.write(img.toarray().tobytes())
        if (fr - f0) % 300 == 0:
            print(f"  seg {i}: {fr - f0}/{f1 - f0}", flush=True)
    proc.stdin.close()
    proc.wait()
    return out


def render_all(jobs=4):
    r = Renderer()
    n = int(math.ceil(r.total * FPS))
    seg_dir = BUILD / "segments"
    seg_dir.mkdir(parents=True, exist_ok=True)
    bounds = [round(n * k / jobs) for k in range(jobs + 1)]
    tasks = [(k, bounds[k], bounds[k + 1], seg_dir / f"seg{k}.mp4") for k in range(jobs)]
    with ProcessPoolExecutor(jobs) as ex:
        outs = list(ex.map(encode_segment, tasks))
    lst = seg_dir / "list.txt"
    lst.write_text("".join(f"file '{o.name}'\n" for o in outs))
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy",
                    str(BUILD / "video.mp4")], check=True)
    print(f"video: {n} frames, {r.total:.1f}s")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--still", help="逗号分隔的时刻（秒），导出 PNG")
    ap.add_argument("--scene", help="只渲染一个场景为无声 mp4")
    ap.add_argument("--jobs", type=int, default=4)
    a = ap.parse_args()
    if a.still:
        r = Renderer()
        out = BUILD / "stills"
        out.mkdir(parents=True, exist_ok=True)
        for x in a.still.split(","):
            T = float(x)
            r.frame(T).save(str(out / f"t{T:07.2f}.png"))
            print(out / f"t{T:07.2f}.png")
    elif a.scene:
        r = Renderer()
        s = next(sc for sc in r.scenes if sc.id == a.scene)
        out = BUILD / f"scene_{s.id}.mp4"
        encode_segment((0, int(s.start * FPS), int((s.start + s.dur) * FPS), out))
        print(out)
    else:
        render_all(a.jobs)


if __name__ == "__main__":
    main()
