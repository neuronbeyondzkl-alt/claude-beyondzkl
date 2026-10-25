"""全片时间线：粒子形体的切换、各形体的参数、屏幕文字与引线。

时间全部以秒计（与 script.md 的分镜一致），配乐的重音也从这里读取 HITS。
"""
import cv2
import numpy as np

import forms as F
from engine import LOYEL, Renderer, hex2rgb, loyel
from forms import N, RAND, RDIR, State, breath, ease_io, smooth
from text import Block, composite

from timeline import DURATION, FPS, HITS  # noqa: F401  （FPS 供 render.py 使用）

# ====================================================================== 形体实例
_FORMS = {}


def form(name):
    if name not in _FORMS:
        _FORMS[name] = {
            "point": lambda: F.PointForm(),
            "swarm": lambda: F.SwarmForm(),
            "num": lambda: F.TextForm("46.9%", "oswald", px=420, height=1.25, center=(0, 0.30, 0)),
            "title": lambda: F.TextForm("正念", "serif_black", px=420, height=1.42, center=(0, 0.36, 0)),
            "brain": lambda: F.BrainForm(),
            "sphere": lambda: F.SphereForm(),
            "bars": lambda: F.BarsForm(),
            "ring": lambda: F.RingForm(radius=0.74),
            "neurons": lambda: F.NeuronForm(),
            "med": lambda: F.MeditatorForm(),
            "galaxy": lambda: F.GalaxyForm(),
            "dust": lambda: F.Dust(),
        }[name]()
    return _FORMS[name]


def heartbeat(t, beats):
    return sum(np.exp(-((t - b) / 0.07) ** 2) + 0.6 * np.exp(-((t - b - 0.28) / 0.07) ** 2) for b in beats)


def lerp(a, b, k):
    return a + (b - a) * k


# ---------------------------------------------------------------------- 大脑参数
REGION_VIEWS = [
    # (起始时间, yaw, pitch, 高亮, 偏侧, dim)
    (72.0, -0.55, 0.18, {"pfc": 1.0}, {}, 0.42),
    (84.0, -1.57, 0.10, {"acc": 1.0}, {}, 0.30),
    (96.0, -1.25, 0.05, {"amygdala": 1.0}, {"amygdala": 1}, 0.27),
    (108.0, -1.85, -0.18, {"hippocampus": 1.0}, {"hippocampus": -1}, 0.27),
    (120.0, -1.57, 0.08, {"insula": 1.0}, {"insula": 1}, 0.30),
    (132.0, -1.15, 0.55, {"dmn": 1.0}, {}, 0.30),
    (144.0, -1.05, 0.30, {}, {}, 0.5),
]
LABEL_KEY = {72.0: "pfc_R", 84.0: "acc_R", 96.0: "amygdala_R", 108.0: "hippocampus_L", 120.0: "insula_R"}


def brain_prm(t):
    if t < 50:          # 标题段
        k = smooth((t - 24) / 6)
        return dict(yaw=-0.9 + 0.22 * (t - 24), pitch=0.16, scale=lerp(0.70, 0.84, k), offset=(0, 0.22, 0), dim=1.0,
                    gain=1.0)
    if t < 200:         # 机制段
        if t < 72:
            k = smooth((t - 70.5) / 2.2)
            yaw = -0.4 + 0.12 * (t - 64)
            return dict(yaw=lerp(yaw, -0.55, k), pitch=lerp(0.2, 0.18, k), scale=lerp(0.80, 0.80, k),
                        offset=(lerp(0, 0.80, k), lerp(0.24, 0.02, k), 0), dim=1.0,
                        hl={"all": 0}, gain=1.0 + 0.4 * np.exp(-(t - 64) / 1.5))
        i = max(i for i, v in enumerate(REGION_VIEWS) if v[0] <= t)
        t0, yaw1, pit1, hl, sb, dim1 = REGION_VIEWS[i]
        yaw0, pit0, _, _, dim0 = REGION_VIEWS[i - 1][1:] if i > 0 else (-0.55, 0.18, None, None, 1.0)
        k = smooth((t - t0) / 1.8)
        yaw = lerp(yaw0, yaw1, k) + 0.05 * np.sin((t - t0) * 0.5)
        pitch = lerp(pit0, pit1, k)
        dim = lerp(dim0, dim1, k) if i > 0 else lerp(1.0, dim1, k)
        hlk = {kk: v * smooth((t - t0 - 0.6) / 1.2) * (1 - smooth((t - t0 - 11.2) / 0.8)) for kk, v in hl.items()}
        prm = dict(yaw=yaw, pitch=pitch, scale=0.80, offset=(0.80, 0.02, 0), dim=dim, hl=hlk, side_bias=sb)
        if t0 == 132.0:     # DMN：先亮网络，6 秒后节点变暗、耦合连线变亮
            c = smooth((t - 138.5) / 1.5)
            fade = 1 - smooth((t - 143.2) / 0.8)
            prm["hl"] = {"dmn": (1.0 - 0.55 * c) * smooth((t - 132.6) / 1.2) * fade}
            prm["links_dmn"] = (1.0 - 0.6 * c) * smooth((t - 133.2) / 1.2) * fade
            prm["links_cpl"] = c * fade
            prm["hl"]["acc"] = 0.5 * c * fade
        if t0 == 144.0:     # 扫描面
            prm["scan"] = lerp(1.25, -1.25, np.clip((t - 145.0) / 9.5, 0, 1))
        return prm
    # 终章 248–260：加速旋转，各脑区依次点亮
    u = t - 248
    keys = ["pfc", "acc", "amygdala", "hippocampus", "insula", "dmn"]
    hl = {k: smooth((u - 2.5 - 1.2 * i) / 0.6) * 0.8 for i, k in enumerate(keys)}
    return dict(yaw=-0.7 + 0.08 * u + 0.012 * u * u, pitch=0.18, scale=lerp(0.72, 0.86, smooth(u / 4)),
                offset=(0, 0.24, 0), dim=lerp(0.7, 1.0, smooth((u - 9) / 2)), hl=hl,
                links_dmn=smooth((u - 6) / 2), links_cpl=smooth((u - 8) / 2), gain=1.0 + 0.25 * smooth((u - 9) / 2))


# ---------------------------------------------------------------------- 打坐人形参数
MED_OFF = (0.95, 0.0, 0.0)


def med_prm(t):
    u = t - 188
    prm = dict(yaw=0.18 * np.sin(u * 0.15), pitch=0.2, scale=0.9, offset=MED_OFF, br=breath(t, 192.0), br_t0=192.0)
    prm["spine"] = smooth((t - 193) / 1.0) * (1 - smooth((t - 199.4) / 0.6))
    prm["nose"] = smooth((t - 200.6) / 1.0) * (1 - smooth((t - 207.4) / 0.6))
    prm["breath_gain"] = 1.0 + 0.8 * smooth((t - 200.6) / 1.0) * (1 - smooth((t - 207.4) / 0.6))
    prm["cycle"] = smooth((t - 208.4) / 1.2) * (1 - smooth((t - 219.2) / 0.8))
    prm["comet"] = max(0.0, (t - 209.5) / 4.5)
    prm["stray"] = smooth((t - 220.3) / 0.8) * (1 - smooth((t - 227.2) / 0.8))
    prm["stray_phase"] = np.clip((t - 222.6) / 3.6, 0, 1)
    prm["ticks"] = smooth((t - 228.4) / 1.0) * (1 - smooth((t - 235.4) / 0.6))
    prm["ticks_lit"] = np.clip((t - 229.0) / 0.7, 0, 8)
    prm["gain"] = 1.0
    return prm


# ---------------------------------------------------------------------- 时间线
def _state(name, t):
    f = form(name)
    if name == "point":
        if t < 8:
            return f(t, pulse=heartbeat(t, [0.6, 1.6, 2.6]) * 0.8 + 0.15)
        if t < 100:
            return f(t, pulse=0.3 + 2.5 * smooth((t - 14.6) / 1.4), radius=0.02)
        return f(t, pulse=0.4 + 0.3 * np.sin((t - 268) * 3), radius=0.025)
    if name == "swarm":
        return f(t, chaos=1.0 + 0.8 * smooth((t - 5.5) / 2.5), scale=1.0)
    if name in ("num", "title"):
        return f(t)
    if name == "brain":
        return f(t, brain_prm(t))
    if name == "sphere":
        if t < 100:
            calm = smooth((t - 41) / 12)
            if t > 59:
                calm = calm * (1 - 0.5 * smooth((t - 59.5) / 3))
            return f(t, calm=calm, br=breath(t, 32.0), center=(0, 0.20, 0), scale=1.0 + 0.1 * smooth((t - 60) / 4),
                     swarm=form("swarm"), orbit_gain=1.0)
        return f(t, calm=1.0, br=breath(t, 260.0), center=(0, 0.12, 0), radius=0.62, scale=1.0, orbit_gain=0.7)
    if name == "bars":
        g = tuple(float(ease_io((t - 160.4 - 0.6 * i) / 1.8)) for i in range(3))
        return f(t, grow=g, center=(0, 0.16, 0), yaw=0.12 * np.sin((t - 156) * 0.2))
    if name == "ring":
        return f(t, cut=float(smooth((t - 175.0) / 2.0)), center=(0, 0.22, 0))
    if name == "neurons":
        return f(t, activity=smooth((t - 181) / 2), scale=0.82, center=(0, 0.32, 0))
    if name == "med":
        return f(t, med_prm(t))
    if name == "galaxy":
        return f(t)
    raise KeyError(name)


# (开始时间, 形体, 切换时长, 飞散幅度)
SEGMENTS = [
    (0.0, "point", 0.0, 0.0),
    (3.0, "swarm", 1.6, 1.6),
    (8.4, "num", 2.2, 0.6),
    (14.3, "point", 1.6, 0.4),
    (16.0, "title", 1.15, 1.4),
    (24.2, "brain", 2.8, 0.6),
    (32.2, "sphere", 2.8, 0.7),
    (64.0, "brain", 2.2, 1.2),
    (156.2, "bars", 2.6, 0.9),
    (172.0, "ring", 2.2, 0.6),
    (180.0, "neurons", 2.4, 0.8),
    (188.2, "med", 3.0, 0.7),
    (248.0, "brain", 3.2, 0.9),
    (260.0, "sphere", 1.1, 1.6),
    (268.0, "point", 2.8, 0.3),
    (271.6, "galaxy", 3.2, 0.8),
]


def morph(A, B, u, amp, t):
    d = RAND[:, 5] * 0.45
    p = np.clip((u - d) / 0.55, 0, 1)
    e = ease_io(p)
    s = np.sin(np.pi * e)
    P = A.P + (B.P - A.P) * e[:, None]
    swirl = RDIR * 0.32 + np.cross(np.array([0, 1, 0], np.float32), P) * 0.22
    P = P + swirl * (s * amp)[:, None]
    rgb = A.rgb + (B.rgb - A.rgb) * e[:, None]
    en = (A.e + (B.e - A.e) * e) * (1 + 0.3 * s)
    blur = A.blur + (B.blur - A.blur) * e + s * 0.8 * amp
    return State(P.astype(np.float32), rgb, en, blur)


def particles(t):
    i = max(k for k, s in enumerate(SEGMENTS) if s[0] <= t)
    t0, name, dur, amp = SEGMENTS[i]
    B = _state(name, t)
    if i > 0 and dur > 0 and t < t0 + dur:
        A = _state(SEGMENTS[i - 1][1], t)
        return morph(A, B, (t - t0) / dur, amp, t)
    return B


def impulses(st, t):
    """冲击波 + 轻微震屏。"""
    shake = np.zeros(3, np.float32)
    for th, s in HITS:
        age = t - th
        if age < 0 or age > 3.0:
            continue
        r = age * 2.6
        P = st.P
        d = np.linalg.norm(P[:, :2] - np.array([0.0, 0.1]), axis=1) + 1e-4
        band = np.exp(-((d - r) / 0.28) ** 2) * np.exp(-age * 1.4) * s
        dirv = np.c_[(P[:, 0]) / d, (P[:, 1] - 0.1) / d, np.zeros(len(d))]
        st.P = P + dirv * (band * 0.22)[:, None]
        st.e = st.e * (1 + 1.4 * band)
        shake += np.array([np.sin(age * 47), np.cos(age * 39), 0], np.float32) * 0.03 * s * np.exp(-age * 6)
    st.P = st.P + shake
    return st


# ====================================================================== 屏幕文字
SCRIM = {"caption": 0.5, "big": 0.5, "subtitle": 0.35, "chapter": 0.6, "chapnum": 0.35, "num": 0.4}


class Txt:
    def __init__(self, t0, t1, lines, style, x, y, align="center", fin=0.9, fout=0.6, stagger=0.22,
                 glow_color=60, rise=14.0, wipe=True, scrim=None):
        self.t0, self.t1, self.lines, self.style = t0, t1, lines, style
        # 压在粒子上的大字默认带暗底
        self.scrim = SCRIM.get(style, 0.0) if scrim is None else scrim
        self._scrim_mask = None
        self.x, self.y, self.align = x, y, align
        self.fin, self.fout, self.stagger, self.glow_color, self.rise, self.wipe = fin, fout, stagger, glow_color, rise, wipe
        self.block = None

    def draw(self, img, t, sc):
        if t < self.t0 or t > self.t1:
            return
        if self.block is None:
            self.block = Block(self.lines, self.style, scale=sc, align=self.align)
        n = len(self.lines)
        prog = (t - self.t0) / (self.fin * (1 + self.stagger * (n - 1)))
        a = 1 - smooth((t - (self.t1 - self.fout)) / self.fout)
        x = self.x(t) if callable(self.x) else self.x
        y = self.y(t) if callable(self.y) else self.y
        if self.scrim > 0:
            self._draw_scrim(img, x * sc, y * sc, float(a) * float(smooth(prog * 1.5)), sc)
        composite(img, self.block, x * sc, y * sc, alpha=float(a), stagger=self.stagger, progress=min(prog, 1.0),
                  rise=self.rise * sc, wipe=self.wipe, glow_color=self.glow_color)


    def _draw_scrim(self, img, x, y, a, sc):
        """文字背后的柔和暗区，保证压在明亮粒子上时仍然可读。"""
        b = self.block
        size = b.line_h / 1.45
        w = b.width + 220 * sc
        h = b.line_h * len(b.lines) + size * 1.4 + 90 * sc
        if self._scrim_mask is None:
            mh, mw = int(h), int(w)
            m = np.zeros((mh, mw), np.float32)
            cv2.ellipse(m, (mw // 2, mh // 2), (int(mw * 0.42), int(mh * 0.34)), 0, 0, 360, 1.0, -1)
            self._scrim_mask = cv2.GaussianBlur(m, (0, 0), max(4.0, mh * 0.16))
        m = self._scrim_mask
        mh, mw = m.shape
        cx = x if b.align == "center" else x + b.width / 2
        cy = y - size * 0.85 + (b.line_h * len(b.lines)) / 2
        x0, y0 = int(cx - mw / 2), int(cy - mh / 2)
        H, W = img.shape[:2]
        sx0, sy0 = max(0, -x0), max(0, -y0)
        sx1, sy1 = min(mw, W - x0), min(mh, H - y0)
        if sx1 <= sx0 or sy1 <= sy0:
            return
        img[y0 + sy0:y0 + sy1, x0 + sx0:x0 + sx1] *= (1 - self.scrim * a * m[sy0:sy1, sx0:sx1])[..., None]


class Rule:
    """一条会“画出来”的细线（章节卡、面板分隔线）。"""

    def __init__(self, t0, t1, x0, y0, x1, y1, color=40, width=2, dur=0.8):
        self.t0, self.t1, self.p0, self.p1, self.color, self.width, self.dur = t0, t1, (x0, y0), (x1, y1), color, width, dur

    def draw(self, img, t, sc):
        if t < self.t0 or t > self.t1:
            return
        k = float(ease_io((t - self.t0) / self.dur))
        a = 1 - smooth((t - (self.t1 - 0.5)) / 0.5)
        (x0, y0), (x1, y1) = self.p0, self.p1
        draw_poly(img, [(x0 * sc, y0 * sc), ((x0 + (x1 - x0) * k) * sc, (y0 + (y1 - y0) * k) * sc)],
                  self.color, self.width * sc, float(a))


def draw_poly(img, pts, color, width, alpha, dot=None):
    if alpha <= 0:
        return
    H, W = img.shape[:2]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    pad = 24
    x0, x1 = int(max(0, min(xs) - pad)), int(min(W, max(xs) + pad))
    y0, y1 = int(max(0, min(ys) - pad)), int(min(H, max(ys) + pad))
    if x1 <= x0 or y1 <= y0:
        return
    m = np.zeros((y1 - y0, x1 - x0), np.uint8)
    q = np.array([[(p[0] - x0) * 16, (p[1] - y0) * 16] for p in pts], np.int32)
    cv2.polylines(m, [q], False, 255, max(1, int(round(width))), cv2.LINE_AA, shift=4)
    if dot is not None:
        cx, cy, r = dot
        cv2.circle(m, (int((cx - x0) * 16), int((cy - y0) * 16)), int(r * 16), 255, max(1, int(round(width))), cv2.LINE_AA, shift=4)
    a = m.astype(np.float32)[..., None] / 255.0 * alpha
    col = hex2rgb(LOYEL[color])
    glow = cv2.GaussianBlur(a, (0, 0), 3.0)[..., None] if a.ndim == 3 else cv2.GaussianBlur(a, (0, 0), 3.0)
    if glow.ndim == 2:
        glow = glow[..., None]
    reg = img[y0:y1, x0:x1]
    reg += hex2rgb(LOYEL[60]) * glow * 0.6
    reg *= 1 - a
    reg += col * a


def card(t0, t1, num, title, eng):
    return [
        Txt(t0, t1, [num], "chapnum", 960, 420, fin=0.8),
        Rule(t0 + 0.3, t1, 960 - 70, 470, 960 + 70, 470, color=40, width=2),
        Txt(t0 + 0.35, t1, [title], "chapter", 960, 575, fin=1.0),
        Txt(t0 + 0.7, t1, [eng], "eng", 960, 645, fin=1.0),
    ]


PX = 140   # 左侧信息栏 x


def panel(t0, t1, label, role, body, cites, top=340):
    items = [
        Txt(t0 + 0.4, t1, [label], "label", PX, top, align="left", fin=0.8, glow_color=60),
        Txt(t0 + 0.7, t1, [role], "tag", PX, top + 58, align="left", fin=0.8),
        Rule(t0 + 0.9, t1, PX, top + 88, PX + 150, top + 88, color=50, width=2),
        Txt(t0 + 1.2, t1, body, "body", PX, top + 150, align="left", fin=1.4, stagger=0.25),
    ]
    by = top + 150 + len(body) * 33 * 1.62 + 22
    items.append(Txt(t0 + 2.0, t1, cites, "cite", PX, by, align="left", fin=1.0, stagger=0.2))
    return items


class Leader:
    """从脑区（或任意 3D 点）引到信息栏的折线。"""

    def __init__(self, t0, t1, point_fn, anchor):
        self.t0, self.t1, self.point_fn, self.anchor = t0, t1, point_fn, anchor

    def draw(self, img, t, sc, cam):
        if t < self.t0 or t > self.t1:
            return
        p = self.point_fn(t)
        xs, ys, _, _ = cam.project(p[None])
        x, y = float(xs[0]), float(ys[0])
        ax, ay = self.anchor[0] * sc, self.anchor[1] * sc
        ex = x - 70 * sc
        pts = [(ax, ay), (ex, ay), (x, y)]
        k = float(ease_io((t - self.t0) / 1.0))
        L = [np.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(2)]
        tot = sum(L) * k
        out = [pts[0]]
        for i in range(2):
            if tot >= L[i]:
                out.append(pts[i + 1])
                tot -= L[i]
            else:
                f = tot / max(L[i], 1e-3)
                out.append((pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f))
                break
        a = 1 - smooth((t - (self.t1 - 0.6)) / 0.6)
        draw_poly(img, out, 30, 1.6 * sc, float(a) * 0.9, dot=(x, y, 9 * sc) if k > 0.98 else None)


class Tag:
    """跟随 3D 点的小标签。"""

    def __init__(self, t0, t1, lines, point_fn, dx, dy, style="tag", align="center"):
        self.txt = Txt(t0, t1, lines, style, 0, 0, align=align, fin=0.7, stagger=0.15)
        self.point_fn, self.dx, self.dy = point_fn, dx, dy

    def draw(self, img, t, sc, cam):
        if t < self.txt.t0 or t > self.txt.t1:
            return
        p = self.point_fn(t)
        xs, ys, _, _ = cam.project(p[None])
        self.txt.x = float(xs[0]) / sc + self.dx
        self.txt.y = float(ys[0]) / sc + self.dy
        self.txt.draw(img, t, sc)


def _bp(key):
    bf = form("brain")
    return lambda t: bf.point(key, brain_prm(t))


def _mp(k):
    mf = form("med")
    return lambda t: mf.node_pos(k, med_prm(t))


def build_overlay():
    O = []
    # ---------------- S0 冷开场
    O += [Txt(3.4, 7.9, ["你的大脑，一刻不停。"], "caption", 960, 930)]
    O += [Txt(9.0, 14.3, ["清醒时，我们约有 **46.9%** 的时间在走神。"], "caption", 960, 905),
          Txt(9.6, 14.3, ["Killingsworth & Gilbert, 2010 · Science"], "cite", 960, 968)]
    # ---------------- S1 标题
    O += [Txt(17.0, 23.8, ["重塑大脑的力量"], "subtitle", 960, 770, fin=1.2),
          Txt(17.8, 23.8, ["MINDFULNESS · REWIRE YOUR BRAIN"], "eng", 960, 838, fin=1.2),
          Txt(27.0, 31.7, ["注意力可以被训练，", "大脑也会随之改变。"], "caption", 960, 895)]
    # ---------------- S2 什么是正念
    O += card(32.5, 36.8, "01", "什么是正念", "WHAT IS MINDFULNESS")
    O += [Txt(37.0, 45.7, ["正念，是**有意地**、**不加评判地**，", "把注意力放在**当下**这一刻。"], "caption", 960, 880),
          Txt(38.0, 45.7, ["Kabat-Zinn, 2003 · Clinical Psychology: Science and Practice"], "cite", 960, 1000),
          Txt(46.4, 53.7, ["它不是清空念头，而是看清念头：", "念头来了，看见它；念头走了，放下它。"], "caption", 960, 880),
          Txt(54.3, 59.8, ["1979 年，卡巴金在麻省大学医学院创立正念减压课程（MBSR），", "把冥想带进了医院与实验室。"], "caption", 960, 880),
          Txt(60.2, 63.6, ["科学家开始追问：**正念，会改变大脑吗？**"], "caption", 960, 910)]
    # ---------------- S3 神经机制
    O += card(64.3, 68.3, "02", "正念如何重塑大脑", "HOW MINDFULNESS RESHAPES THE BRAIN")
    O += [Txt(68.5, 71.9, ["神经可塑性：一起放电的神经元，会连接在一起。", "你反复练习什么，大脑就强化什么。"], "caption", 960, 880, fin=0.7),
          Txt(68.9, 71.9, ["Hebb, 1949 · The Organization of Behavior"], "cite", 960, 1000, fin=0.7)]
    P = [
        (72.0, "前额叶皮层 PFC", "注意力的「指挥官」",
         ["长期冥想者的前额叶与右侧前岛叶皮层更厚；", "年长者的差异更明显，", "提示冥想或可延缓皮层随年龄变薄。"],
         ["Lazar et al., 2005 · NeuroReport", "横断面研究，n = 20 · 初步证据"]),
        (84.0, "前扣带回 ACC", "冲突与走神的「监测器」",
         ["随机对照试验：每天 20 分钟、连续 5 天，", "注意冲突表现改善，皮质醇下降；", "累计约 11 小时训练后，", "连接 ACC 的白质完整性提高。"],
         ["Tang et al., 2007; 2010 · PNAS", "随机对照试验 · 中等证据"]),
        (96.0, "杏仁核 Amygdala", "大脑的「警报器」",
         ["8 周正念减压后，压力感下降越多，", "右侧基底外侧杏仁核灰质密度下降越多；", "正念注意训练后，", "杏仁核对情绪图片的反应也降低。"],
         ["Hölzel et al., 2010 · SCAN", "Desbordes et al., 2012 · Front Hum Neurosci"]),
        (108.0, "海马 Hippocampus", "学习、记忆与情绪调节",
         ["8 周正念减压后，左侧海马灰质密度增加；", "后扣带回、颞顶联合区与小脑也有增加。"],
         ["Hölzel et al., 2011 · Psychiatry Res Neuroimaging", "等待组对照，n = 16 vs 17 · 初步证据"]),
        (120.0, "岛叶 Insula", "感受身体的「内感受雷达」",
         ["正念训练后，大脑从「讲故事的自我」", "（内侧前额叶）更多切换到", "「体验此刻的自我」", "（右侧岛叶与外侧前额叶网络）。"],
         ["Farb et al., 2007 · SCAN", "Lazar et al., 2005 · NeuroReport"]),
        (132.0, "默认模式网络 DMN", "走神的「自动驾驶」",
         ["有经验的冥想者，DMN 核心节点", "（内侧前额叶、后扣带回）活动更低；", "后扣带回与背侧前扣带回、背外侧前额叶", "耦合更强：更少走神，更多自我监控。"],
         ["Brewer et al., 2011 · PNAS", "横断面研究 · 初步证据"]),
        (144.0, "【争议】证据有多强？", "科学的谨慎",
         ["荟萃分析（21 项研究，约 300 名冥想者）：", "多个脑区有中等程度的结构差异（d ≈ 0.46），", "但存在发表偏倚。",
          "2022 年两项合并的随机对照试验（218 人）", "未能重复出 8 周 MBSR 带来的脑结构变化。",
          "**功能与体验层面的证据更充分，**", "**结构改变仍需更严格的研究。**"],
         ["Fox et al., 2014 · Neurosci Biobehav Rev", "Kral et al., 2022 · Science Advances"]),
    ]
    for t0, label, role, body, cites in P:
        top = 300 if len(body) > 5 else 340
        O += panel(t0, t0 + 11.8, label, role, body, cites, top=top)
        if t0 in LABEL_KEY:
            O += [Leader(t0 + 1.6, t0 + 11.6, _bp(LABEL_KEY[t0]), (PX + 640, top - 16))]
    O += [Tag(133.0, 143.6, ["内侧前额叶"], _bp("mpfc_c"), 0, -38),
          Tag(133.3, 143.6, ["后扣带回"], _bp("pcc_c"), 0, -38),
          Tag(133.6, 143.6, ["角回"], _bp("angular_R"), 0, 52),
          Tag(139.0, 143.6, ["背侧前扣带回"], _bp("dacc"), 0, 52)]
    # ---------------- S4 为什么
    O += card(156.4, 160.0, "03", "为什么要练习正念", "WHY PRACTICE")
    bars = form("bars")
    names = ("焦虑", "抑郁", "疼痛")
    for i in range(3):
        def topfn(t, i=i):
            g = float(ease_io((t - 160.4 - 0.6 * i) / 1.8))
            x, y = bars.top(i, g)
            return np.array([x, y + 0.16, 0], np.float32)

        def basefn(t, i=i):
            return np.array([bars.xs[i], bars.base_y + 0.16, 0], np.float32)
        O += [Tag(160.6 + 0.6 * i, 171.6, [f"{bars.VALUES[i]:.2f}"], topfn, 0, -26, style="label"),
              Tag(160.6 + 0.6 * i, 171.6, [names[i]], basefn, 0, 58, style="tag")]
    O += [Txt(160.8, 171.6, ["效应量 · 标准化均差（8 周时；疼痛为合并估计）"], "cite", 960, 190),
          Txt(161.6, 171.7, ["47 项随机对照试验、3,515 人：正念冥想对焦虑、抑郁、疼痛", "有中等强度的改善证据，但并不优于药物、运动等其他积极疗法。"], "caption", 960, 880, fin=1.0),
          Txt(162.4, 171.7, ["Goyal et al., 2014 · JAMA Internal Medicine"], "cite", 960, 1000)]
    O += [Txt(175.6, 179.7, ["−31%"], "num", 960, 470, fin=0.8),
          Txt(176.2, 179.7, ["HR 0.69 · 60 周"], "cite", 960, 530, fin=0.8),
          Txt(172.6, 179.7, ["复发性抑郁：接受正念认知疗法（MBCT）的人，", "60 周内复发风险降低约 31%。"], "caption", 960, 880),
          Txt(173.4, 179.7, ["Kuyken et al., 2016 · JAMA Psychiatry · 9 项 RCT，1,258 人"], "cite", 960, 1000)]
    O += [Txt(180.8, 187.7, ["正念的意义，不是逃离生活，", "而是在念头与反应之间，留出一个**选择的空间**。"], "big", 960, 870, fin=1.4)]
    # ---------------- S5 如何练习
    O += card(188.5, 192.0, "04", "如何正确练习", "HOW TO PRACTICE")
    steps = [
        (192.0, 200.0, "① 坐稳", "SIT", ["脊背挺直，肩膀放松，", "像一座山。"], []),
        (200.0, 208.0, "② 锚定", "ANCHOR", ["把注意力轻轻放在呼吸上：", "感受鼻尖的凉意、腹部的起伏。"], []),
        (208.0, 220.0, "③ 觉察", "NOTICE", ["发现「我走神了」的那一刻，", "就是正念本身。", "走神时，默认模式网络活跃；", "觉察时，突显网络亮起；",
                                           "带回注意力时，执行控制网络接管。"], ["Hasenkamp et al., 2012 · NeuroImage", "n = 14 · 初步证据"]),
        (220.0, 228.0, "④ 回来", "RETURN", ["不评判、不责备，", "温和地回到呼吸。", "每一次回来，", "都是一次大脑的「举重」。"], []),
        (228.0, 236.0, "⑤ 坚持", "PRACTICE", ["从每天 5–10 分钟开始；", "研究中的经典课程（MBSR）", "为期 8 周。"], []),
        (236.0, 242.0, "常见误区", "MYTHS", ["正念 ≠ 放空大脑", "正念 ≠ 必须很放松", "走神 ≠ 失败"], []),
        (242.0, 248.0, "温馨提示", "SAFETY", ["冥想也可能带来不适：", "系统综述中不良事件总体发生率约 8.3%。", "有创伤史或严重心理困扰者，", "请在专业人士指导下练习。"],
         ["Farias et al., 2020 · Acta Psychiatr Scand"]),
    ]
    for t0, t1, label, en, body, cites in steps:
        O += panel(t0, t1 - 0.2, label, en, body, cites or [""], top=360)
    labels = [("走神", "默认模式网络", 0, -70), ("觉察", "突显网络", 70, -50), ("转移", "执行控制网络", 0, 62), ("专注", "执行控制网络", -64, -50)]
    for k, (a, b, dx, dy) in enumerate(labels):
        O += [Tag(209.2 + 0.5 * k, 219.4, [a, f"[[{b}]]"], _mp(k), dx, dy, style="tag")]
    mf = form("med")
    O += [Tag(234.0, 235.6, ["8 周"], lambda t: mf.tick_pos(7, med_prm(t)), 40, 44, style="tag")]
    # 呼吸提示
    O += [BreathCue(200.8, 207.6, 192.0, lambda t: MED_OFF, -0.0, 1.05), BreathCue(260.6, 267.6, 260.0, lambda t: (0, 0.12, 0), 0.0, 0.0)]
    # ---------------- S6 终章
    O += [Txt(249.2, 259.5, ["每一次把注意力带回此刻，", "都是在重塑你的大脑。"], "big", 960, 875, fin=1.6),
          Txt(261.0, 267.6, ["现在，从一次呼吸开始。"], "big", 960, 905, fin=1.4),
          Txt(268.8, 272.0, ["正念 · 重塑大脑的力量"], "subtitle", 960, 730, fin=1.2, fout=0.9),
          Txt(269.3, 272.0, ["MINDFULNESS · REWIRE YOUR BRAIN"], "eng", 960, 795, fin=1.2, fout=0.9)]
    # ---------------- S7 参考文献
    refs1 = ["Killingsworth MA, Gilbert DT. Science 2010;330:932",
             "Kabat-Zinn J. Clin Psychol Sci Pract 2003;10:144–156",
             "Hebb DO. The Organization of Behavior. Wiley, 1949",
             "Lazar SW et al. NeuroReport 2005;16:1893–1897",
             "Tang YY et al. PNAS 2007;104:17152–17156",
             "Tang YY et al. PNAS 2010;107:15649–15652",
             "Hölzel BK et al. Soc Cogn Affect Neurosci 2010;5:11–17",
             "Desbordes G et al. Front Hum Neurosci 2012;6:292",
             "Hölzel BK et al. Psychiatry Res Neuroimaging 2011;191:36–43"]
    refs2 = ["Farb NAS et al. Soc Cogn Affect Neurosci 2007;2:313–322",
             "Brewer JA et al. PNAS 2011;108:20254–20259",
             "Fox KCR et al. Neurosci Biobehav Rev 2014;43:48–73",
             "Kral TRA et al. Science Advances 2022;8:eabk3316",
             "Goyal M et al. JAMA Intern Med 2014;174:357–368",
             "Kuyken W et al. JAMA Psychiatry 2016;73:565–574",
             "Hasenkamp W et al. NeuroImage 2012;59:750–760",
             "Farias M et al. Acta Psychiatr Scand 2020;142:374–393",
             "Tang YY, Hölzel BK, Posner MI. Nat Rev Neurosci 2015;16:213–225"]
    CX = 200
    O += [Txt(272.4, 280.2, ["参考文献 · REFERENCES"], "tag", CX, 200, align="left"),
          Txt(272.8, 280.2, [f"{i + 1:>2}  {r}" for i, r in enumerate(refs1)], "small", CX, 275, align="left", stagger=0.06, fin=1.5),
          Txt(280.4, 287.6, ["参考文献 · REFERENCES"], "tag", CX, 200, align="left"),
          Txt(280.6, 287.6, [f"{i + 10:>2}  {r}" for i, r in enumerate(refs2)], "small", CX, 275, align="left", stagger=0.06, fin=1.5),
          Txt(281.6, 287.6, ["画面：程序生成粒子；脑模板 MNI ICBM152 2009a © McConnell Brain Imaging Centre, MNI",
                             "字体：Noto Serif / Sans CJK SC、Oswald、Montserrat（SIL OFL）  配乐：程序合成原创，可商用",
                             "本视频为科普内容，不替代专业医疗建议。"], "cite", CX, 830, align="left", stagger=0.1, fin=1.2)]
    return O


class BreathCue:
    """“吸气 / 呼气”提示，随呼吸周期切换。"""

    def __init__(self, t0, t1, br_t0, center_fn, dx, dy):
        self.t0, self.t1, self.br_t0 = t0, t1, br_t0
        self.center_fn, self.dx, self.dy = center_fn, dx, dy
        self.blocks = {}

    def draw(self, img, t, sc, cam):
        if t < self.t0 or t > self.t1:
            return
        ph = ((t - self.br_t0) % 8.0) / 8.0
        word = "吸气" if ph < 0.5 else "呼气"
        local = (ph % 0.5) / 0.5
        a = smooth(local / 0.15) * (1 - smooth((local - 0.82) / 0.18))
        a *= smooth((t - self.t0) / 0.6) * (1 - smooth((t - (self.t1 - 0.5)) / 0.5))
        if word not in self.blocks:
            self.blocks[word] = Block([word], "tag", scale=sc)
        c = np.asarray(self.center_fn(t), np.float32) + np.array([self.dx, self.dy, 0], np.float32)
        xs, ys, _, _ = cam.project(c[None])
        composite(img, self.blocks[word], float(xs[0]), float(ys[0]), alpha=float(a), progress=1.0, glow_color=50)


# ====================================================================== 帧
class Scene:
    def __init__(self, w=1920, h=1080):
        self.R = Renderer(w, h)
        self.sc = w / 1920.0
        self.overlay = build_overlay()
        self.cards = [(o.t0, o.t1) for o in self.overlay if isinstance(o, Txt) and o.style == "chapter"]
        self.dust = form("dust")
        self.bg0 = self.R.background()
        self.bg_hot = self.R.background(glow=2.4, tone=(70, 100))

    def frame(self, t):
        st = impulses(particles(t), t)
        # 章节卡出现时压暗粒子，让标题清楚
        cd = max([smooth((t - a) / 0.6) * (1 - smooth((t - b + 0.5) / 0.6)) for a, b in self.cards] + [0.0])
        if cd > 0:
            st.e = st.e * np.float32(1 - 0.45 * cd)
        d = self.dust(t, gain=1.0)
        P = np.concatenate([st.P, d.P])
        rgb = np.concatenate([st.rgb, d.rgb])
        e = np.concatenate([st.e, d.e])
        blur = np.concatenate([st.blur, np.zeros(len(d.P), np.float32)])
        flash = sum(s * np.exp(-max(t - th, 0) / 0.6) * (t >= th) for th, s in HITS)
        bg = self.bg0 + (self.bg_hot - self.bg0) * min(1.0, flash * 0.8)
        # 曝光：开场淡入、结尾淡出
        expo = smooth(t / 1.2) * (1 - smooth((t - (DURATION - 1.6)) / 1.6))
        fog, dof = 0.9, 0.55
        hdr = self.R.render(P, rgb, e, blur_extra=blur, bg=bg, exposure=1.0, fog=fog, dof=dof)
        img = self.R.finish(hdr * np.float32(expo))
        for o in self.overlay:
            if isinstance(o, (Leader, Tag, BreathCue)):
                o.draw(img, t, self.sc, self.R.cam)
            else:
                o.draw(img, t, self.sc)
        img *= np.float32(smooth(t / 0.8) * (1 - smooth((t - (DURATION - 1.2)) / 1.2)))
        return self.R.to_u8(img)
