"""HUD 与排版：每个函数返回一个 draw(renderer, out, cam) 回调，由 scenes 组装。"""
import numpy as np
import cv2

import timeline as TL
from render import W, H, C, WHITE, blit

SS = 4                      # cv2 抗锯齿亚像素位数
K = 1 << SS


def _pt(x, y):
    return (int(round(x * K)), int(round(y * K)))


_MASK = np.zeros((H, W), np.uint8)


def _lines(out, draw_fn, color, alpha, glow=0.6, glow_sigma=3.0):
    """在独立 8 位遮罩上用抗锯齿画线，再按颜色混合进画面，并叠一层辉光（只处理包围盒）。"""
    if alpha <= 0.003:
        return
    m = _MASK
    draw_fn(m)
    x, y, w, h = cv2.boundingRect(m)
    if w == 0 or h == 0:
        return
    pad = int(glow_sigma * 3) + 2 if glow > 0 else 0
    x0, y0, x1, y1 = max(x - pad, 0), max(y - pad, 0), min(x + w + pad, W), min(y + h + pad, H)
    a = m[y0:y1, x0:x1].astype(np.float32) * (1.0 / 255.0)
    m[y0:y1, x0:x1] = 0
    region = out[y0:y1, x0:x1]
    if glow > 0:
        region += cv2.GaussianBlur(a, (0, 0), glow_sigma)[..., None] * (C[50] * (glow * alpha))
    a = a[..., None] * alpha
    region *= (1 - a)
    region += a * color


def line(m, p0, p1, th=1):
    cv2.line(m, _pt(*p0), _pt(*p1), 255, th, cv2.LINE_AA, SS)


def circle(m, c, r, th=1, fill=False):
    cv2.circle(m, _pt(*c), int(r * K), 255, -1 if fill else th, cv2.LINE_AA, SS)


def poly(m, pts, th=1, closed=False):
    p = np.array([_pt(x, y) for x, y in pts], np.int32)
    cv2.polylines(m, [p], closed, 255, th, cv2.LINE_AA, SS)


def safe_bottom(fx):
    return H - max(int(fx.get("letterbox", 0)), 0)


# ---------------------------------------------------------------- 文字类
def caption(main, sub, alpha, slide=0.0, y_off=0):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        x0 = 118 + slide * 30
        y0 = H - 222 + y_off
        a, g = R.fonts.render(main, "sans", 46, 500)
        blit(out, a, x0, y0, C[10], alpha, g, C[60], 0.8)
        if sub:
            a2, g2 = R.fonts.render(sub, "sans", 25, 350)
            blit(out, a2, x0 + 2, y0 + a.shape[0] + 6, C[40], alpha * 0.95)
        hh = a.shape[0] + (40 if sub else 0)
        _lines(out, lambda m: line(m, (x0 - 26, y0 + 10), (x0 - 26, y0 + hh - 4), 3), C[40], alpha, 0.8)
    return draw


def card(num, cn, en, alpha, scale=1.0, sweep=-1.0):
    """章节卡：编号 + 中文大标题 + 英文副标题。"""
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        cy = H / 2 - 20
        a1, g1 = R.fonts.render(num, "osw", 64, 300, 0.25)
        blit(out, a1, W / 2, cy - 150, C[40], alpha, g1, C[60], 0.7, anchor="cc", scale=scale)
        a2, g2 = R.fonts.render(cn, "sans", 128, 900, 0.18)
        blit(out, a2, W / 2, cy, C[10], alpha, g2, C[50], 1.1, anchor="cc", scale=scale)
        a3, g3 = R.fonts.render(en, "osw", 34, 400, 0.55)
        blit(out, a3, W / 2, cy + 112, C[30], alpha * 0.95, g3, C[60], 0.6, anchor="cc", scale=scale)
        w = a2.shape[1] * scale * 0.5 + 60
        _lines(out, lambda m: (line(m, (W / 2 - w, cy + 74), (W / 2 - 40, cy + 74), 1),
                               line(m, (W / 2 + 40, cy + 74), (W / 2 + w, cy + 74), 1)),
               C[40], alpha * 0.8)
        if 0 < sweep < 1:     # 一道光扫过标题
            sx = W / 2 - w + sweep * 2 * w
            xs = np.arange(W, dtype=np.float32)
            band = np.exp(-((xs - sx) / 70.0) ** 2)
            y0, y1 = int(cy - 130), int(cy + 120)
            ys = np.arange(y0, y1, dtype=np.float32)
            vert = np.exp(-((ys - cy) / 70.0) ** 2)
            out[y0:y1] += (vert[:, None] * band[None, :])[..., None] * C[20] * 0.22 * alpha * np.sin(np.pi * sweep)
    return draw


def title(cn, en, sub, alpha, scale=1.0, y=None, sub_alpha=None):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        cy = H / 2 if y is None else y
        a, g = R.fonts.render(cn, "sans", 150, 900, 0.22)
        blit(out, a, W / 2, cy - 30, C[10], alpha, g, C[50], 1.3, anchor="cc", scale=scale)
        a2, g2 = R.fonts.render(en, "osw", 40, 500, 0.62)
        blit(out, a2, W / 2, cy + 92, C[30], alpha, g2, C[60], 0.8, anchor="cc", scale=scale)
        if sub:
            sa = alpha if sub_alpha is None else sub_alpha
            a3, _ = R.fonts.render(sub, "sans", 28, 350, 0.12)
            blit(out, a3, W / 2, cy + 160, C[40], sa, anchor="cc")
    return draw


def bigtext(text, x, y, alpha, size=64, weight=700, color=None, anchor="cc", scale=1.0,
            fam="sans", tracking=0.0, glow=0.9):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        a, g = R.fonts.render(text, fam, size, weight, tracking)
        blit(out, a, x, y, C[10] if color is None else color, alpha, g, C[50], glow,
             anchor=anchor, scale=scale)
    return draw


def callout(pos3, cn, en, alpha, prog=1.0, side=None, dy=-70):
    """脑区标注：节点处小圆 + 折线 + 中英文。"""
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        x, y, z = cam.project1(pos3)
        sd = side if side is not None else (1 if x > W * 0.5 else -1)
        p1 = (x + sd * 46, y + dy * 0.66)
        p2 = (x + sd * (46 + 150), y + dy * 0.66)
        k = np.clip(prog, 0, 1)

        def fn(m):
            circle(m, (x, y), 7, 1)
            circle(m, (x, y), 2.2, fill=True)
            if k > 0:
                k1 = min(k / 0.4, 1)
                q1 = (x + (p1[0] - x) * k1, y + (p1[1] - y) * k1)
                line(m, (x + sd * 5, y - 5), q1, 1)
                if k > 0.4:
                    k2 = (k - 0.4) / 0.6
                    line(m, p1, (p1[0] + (p2[0] - p1[0]) * k2, p1[1]), 1)
        _lines(out, fn, C[30], alpha)
        if k > 0.55:
            ta = alpha * min((k - 0.55) / 0.3, 1)
            a, g = R.fonts.render(cn, "sans", 26, 500)
            tx = p1[0] + (8 if sd > 0 else -8)
            blit(out, a, tx, p1[1] - 4, C[10], ta, g, C[60], 0.6, anchor="lb" if sd > 0 else "rb")
            a2, _ = R.fonts.render(en, "mont", 14, 500, 0.2)
            blit(out, a2, tx, p1[1] + 6, C[40], ta, anchor="lt" if sd > 0 else "rt")
    return draw


# ---------------------------------------------------------------- 常驻 HUD
CHAPTER = {"intro": "", "assemble": "", "past": "01 · 回忆过去", "future": "02 · 想象未来",
           "present": "03 · 专注当下", "finale": "∞ · 时间机器", "credits": ""}


def frame_hud(t, alpha, cursor, chapter, tick_flash, beat_flash):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        # 左上：片名 + 章节
        a, _ = R.fonts.render("THE TEMPORAL BRAIN", "osw", 17, 400, 0.38)
        blit(out, a, 112, 46, C[40], alpha * 0.9)
        if chapter:
            a2, g2 = R.fonts.render(chapter, "sans", 22, 500, 0.08)
            blit(out, a2, 112, 72, C[20], alpha, g2, C[60], 0.4)
        # 顶部时间轴：过去 ←—— 当下 ——→ 未来
        cx, y, half = W / 2, 62, 300
        px = cx + cursor * half

        def fn(m):
            line(m, (cx - half, y), (cx + half, y), 1)
            for i in range(-15, 16):
                hgt = 9 if i % 5 == 0 else 4
                line(m, (cx + i * 20, y - hgt), (cx + i * 20, y), 1)
            poly(m, [(cx - half + 10, y - 6), (cx - half, y), (cx - half + 10, y + 6)])
            poly(m, [(cx + half - 10, y - 6), (cx + half, y), (cx + half - 10, y + 6)])
        _lines(out, fn, C[40], alpha * (0.55 + 0.45 * tick_flash))
        _lines(out, lambda m: (circle(m, (px, y), 5, fill=True), circle(m, (px, y), 11 + 6 * beat_flash, 1)),
               WHITE, alpha, 1.2, 4)
        for txt, en, xx in (("过去", "PAST", cx - half - 20), ("未来", "FUTURE", cx + half + 20)):
            a, _ = R.fonts.render(txt, "sans", 20, 500)
            an = "rc" if xx < cx else "lc"
            blit(out, a, xx, y - 2, C[20], alpha, anchor=an)
            a, _ = R.fonts.render(en, "osw", 12, 400, 0.3)
            blit(out, a, xx, y + 18, C[50], alpha, anchor=an)
        a, _ = R.fonts.render("当下 NOW", "sans", 15, 400, 0.1)
        blit(out, a, cx, y + 22, C[40], alpha * 0.85, anchor="ct")
    return draw


def spike_strip(t, alpha, fx):
    """右下角"神经放电序列"：鼓点即放电，向左滚动，直观呈现卡点。"""
    E = TL.EVENTS
    win = 3.0

    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        x1, x0 = W - 112, W - 112 - 420
        y = safe_bottom(fx) - 76
        evs = []
        for lst, hgt in ((E.hit, 56), (E.kick, 34), (E.snare, 24), (E.taiko, 28), (E.tom, 18),
                         (E.hat, 8), (E.ohat, 10), (E.heart, 16), (E.tick, 6), (E.stab, 14)):
            for et, v in lst:
                if t - win <= et <= t:
                    evs.append((et, hgt * (v if isinstance(v, float) and v <= 2 else 1.0)))

        def fn(m):
            line(m, (x0, y), (x1, y), 1)
            for et, hgt in evs:
                xx = x1 - (t - et) / win * (x1 - x0)
                line(m, (xx, y), (xx, y - hgt), 1)
        _lines(out, fn, C[40], alpha, 0.9)
        # 最新的放电更亮
        fresh = [(et, h) for et, h in evs if t - et < 0.15]
        if fresh:
            _lines(out, lambda m: [line(m, (x1 - (t - et) / win * (x1 - x0), y),
                                        (x1 - (t - et) / win * (x1 - x0), y - h), 2) for et, h in fresh],
                   WHITE, alpha, 1.5, 4)
        a, _ = R.fonts.render("SPIKE TRAIN", "osw", 13, 400, 0.35)
        blit(out, a, x0, y + 10, C[50], alpha)
        a, _ = R.fonts.render("神经放电 · 与鼓点同步", "sans", 14, 400)
        blit(out, a, x1, y + 10, C[50], alpha, anchor="rt")
    return draw


# ---------------------------------------------------------------- 信息面板
def panel_box(R, out, x, y, w, h, alpha, head_cn, head_en):
    def fn(m):
        c = 14
        for (ax, ay), (bx, by) in (((x, y + c), (x, y)), ((x, y), (x + c, y)),
                                   ((x + w - c, y), (x + w, y)), ((x + w, y), (x + w, y + c)),
                                   ((x, y + h - c), (x, y + h)), ((x, y + h), (x + c, y + h)),
                                   ((x + w - c, y + h), (x + w, y + h)), ((x + w, y + h), (x + w, y + h - c))):
            line(m, (ax, ay), (bx, by), 1)
    out[int(y):int(y + h), int(x):int(x + w)] *= (1 - 0.35 * alpha)
    _lines(out, fn, C[40], alpha, 0.5)
    a, _ = R.fonts.render(head_cn, "sans", 20, 500)
    blit(out, a, x + 18, y + 14, C[20], alpha)
    a, _ = R.fonts.render(head_en, "osw", 12, 400, 0.3)
    blit(out, a, x + w - 18, y + 20, C[50], alpha, anchor="rt")


def panel_completion(lit, alpha, flash=0.0, x=1450, y=300):
    """模式补全：12 个神经元，部分线索 → 全部点亮。"""
    n = 12
    rng = np.random.default_rng(4)
    ang = np.linspace(0, 2 * np.pi, n, endpoint=False) - np.pi / 2
    edges = [(i, j) for i in range(n) for j in range(i + 1, n) if rng.uniform() < 0.32]

    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        w, h = 360, 380
        panel_box(R, out, x, y, w, h, alpha, "CA3 模式补全", "PATTERN COMPLETION")
        cx, cy, r = x + w / 2, y + 200, 118
        pts = [(cx + r * np.cos(a), cy + r * np.sin(a)) for a in ang]
        on = np.arange(n) < lit
        _lines(out, lambda m: [line(m, pts[i], pts[j], 1) for i, j in edges], C[60], alpha * 0.5, 0)
        _lines(out, lambda m: [line(m, pts[i], pts[j], 1) for i, j in edges if on[i] and on[j]],
               C[30], alpha, 0.8)
        _lines(out, lambda m: [circle(m, p, 9, 1) for p in pts], C[50], alpha, 0)
        _lines(out, lambda m: [circle(m, p, 8, fill=True) for p, o in zip(pts, on) if o],
               WHITE, alpha, 1.4 + flash, 5)
        txt = f"{min(lit, n):02d} / {n}"
        a, _ = R.fonts.render(txt, "osw", 30, 500, 0.1)
        blit(out, a, cx, cy, C[10], alpha, anchor="cc")
        lab = "部分线索" if lit < n else "完整回忆"
        a, _ = R.fonts.render(lab, "sans", 18, 400)
        blit(out, a, cx, y + h - 22, C[40], alpha, anchor="cb")
    return draw


def panel_wave(kind, t, alpha, params, x=1400, y=650, w=410, h=230):
    """脑电/局部场电位示意：swr（尖波涟漪）或 alpha_gamma（α 抑制 + γ 同步）。"""
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        if kind == "swr":
            panel_box(R, out, x, y, w, h, alpha, "海马局部场电位", "LFP · CA1")
        else:
            panel_box(R, out, x, y, w, h, alpha, "节律门控", "ALPHA / GAMMA")
        xs = np.linspace(x + 20, x + w - 20, 360)
        tt = t - (x + w - 20 - xs) / (w - 40) * 1.2       # 最近 1.2 s
        traces = []
        if kind == "swr":
            ev = params.get("events", [])
            sig = 0.08 * np.sin(tt * 2 * np.pi * 7) + 0.04 * np.sin(tt * 2 * np.pi * 2.3)
            for et, v in ev:
                d = tt - et
                env = np.exp(-(d / 0.035) ** 2) * v
                sig = sig - 0.55 * np.exp(-(d / 0.05) ** 2) * v + 0.45 * env * np.sin(d * 2 * np.pi * 140)
            traces.append((sig, y + h / 2 + 18, 70, "SWR 80–150 Hz"))
        else:
            a_amp = params.get("alpha_amp", 1.0)
            g_ev = params.get("gamma", [])
            al = a_amp * 0.6 * np.sin(tt * 2 * np.pi * 10)
            gm = 0.05 * np.sin(tt * 2 * np.pi * 43)
            for et, v in g_ev:
                d = tt - et
                gm = gm + 0.6 * v * np.exp(-((d - 0.06) / 0.07) ** 2) * np.sin(d * 2 * np.pi * 45)
            traces.append((al, y + 95, 34, "α 8–12 Hz · 无关输入"))
            traces.append((gm, y + 178, 34, "γ 30–80 Hz · 注意焦点"))

        def fn(m):
            for sig, yc, amp, _ in traces:
                poly(m, list(zip(xs, yc - sig * amp)))
        _lines(out, fn, C[20], alpha, 0.9)
        for sig, yc, amp, lab in traces:
            a, _ = R.fonts.render(lab, "sans", 15, 400)
            blit(out, a, x + 20, yc - amp - 2 if kind != "swr" else y + h - 30, C[40], alpha)
    return draw


def seesaw(dan, dmn, alpha, x=1470, y=560):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        w, h = 330, 330
        panel_box(R, out, x, y, w, h, alpha, "网络跷跷板", "ANTI-CORRELATION")
        base = y + h - 60
        for i, (v, cn, en) in enumerate(((dan, "注意网络", "DAN"), (dmn, "默认网络", "DMN"))):
            bx = x + 80 + i * 170
            top = base - 165 * np.clip(v, 0, 1)
            _lines(out, lambda m: (line(m, (bx - 26, base), (bx + 26, base), 1),
                                   cv2.rectangle(m, _pt(bx - 22, top), _pt(bx + 22, base), 255, -1, cv2.LINE_AA, SS)),
                   C[30] if i == 0 else C[60], alpha, 0.9)
            a, _ = R.fonts.render(cn, "sans", 18, 500)
            blit(out, a, bx, base + 12, C[20], alpha, anchor="ct")
            a, _ = R.fonts.render(en, "osw", 13, 400, 0.3)
            blit(out, a, bx, base + 38, C[50], alpha, anchor="ct")
            arrow = "↑" if v > 0.5 else "↓"
            a, _ = R.fonts.render(arrow, "sans", 28, 700)
            blit(out, a, bx, top - 10, C[10], alpha, anchor="cb")
    return draw


def counter(value, alpha, x=1460, y=640):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        a, g = R.fonts.render(f"{value:4.1f}%", "osw", 120, 600, 0.02)
        blit(out, a, x, y, C[10], alpha, g, C[50], 1.0, anchor="lc")
        a, _ = R.fonts.render("清醒时间里在走神", "sans", 24, 500)
        blit(out, a, x + 6, y + 80, C[30], alpha)
    return draw


def venn(alpha, k, x=1560, y=640):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        d = 120 - 60 * k
        _lines(out, lambda m: (circle(m, (x - d / 2, y), 95, 2), circle(m, (x + d / 2, y), 95, 2)),
               C[30], alpha, 1.0)
        for txt, xx in (("回忆", x - d / 2 - 52), ("想象", x + d / 2 + 52)):
            a, _ = R.fonts.render(txt, "sans", 24, 600)
            blit(out, a, xx, y, C[10], alpha, anchor="cc")
        a, _ = R.fonts.render("共享核心网络", "sans", 18, 500)
        blit(out, a, x, y + 128, C[30], alpha * k, anchor="ct")
    return draw


def meter(v, alpha, label_cn, label_en, x=1470, y=660):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        w = 330
        panel_box(R, out, x, y, w, 150, alpha, label_cn, label_en)
        bx0, bx1, by = x + 24, x + w - 24, y + 92
        _lines(out, lambda m: cv2.rectangle(m, _pt(bx0, by - 10), _pt(bx1, by + 10), 255, 1, cv2.LINE_AA, SS),
               C[50], alpha, 0)
        xe = bx0 + (bx1 - bx0) * np.clip(v, 0, 1)
        _lines(out, lambda m: cv2.rectangle(m, _pt(bx0 + 3, by - 7), _pt(max(xe - 3, bx0 + 3), by + 7), 255, -1,
                                            cv2.LINE_AA, SS), C[30], alpha, 1.0)
    return draw


def reticle(x, y, r, alpha, spin=0.0, label=None):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return

        def fn(m):
            circle(m, (x, y), r, 1)
            circle(m, (x, y), r * 0.18, 1)
            for i in range(4):
                a = spin + i * np.pi / 2
                line(m, (x + np.cos(a) * r * 0.75, y + np.sin(a) * r * 0.75),
                     (x + np.cos(a) * r * 1.25, y + np.sin(a) * r * 1.25), 1)
            for i in range(24):
                a = -spin * 0.5 + i * np.pi / 12
                line(m, (x + np.cos(a) * r * 1.38, y + np.sin(a) * r * 1.38),
                     (x + np.cos(a) * r * 1.45, y + np.sin(a) * r * 1.45), 1)
        _lines(out, fn, C[20], alpha, 1.0)
        if label:
            a, _ = R.fonts.render(label, "sans", 16, 500, 0.3)
            blit(out, a, x, y + r * 1.6, C[40], alpha, anchor="ct")
    return draw


def beam(src_pts3, dst_xy, alpha):
    """注意"聚光灯"：从额叶眼区/顶内沟射向目标的光锥。"""
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        mask = np.zeros((H // 2, W // 2), np.float32)
        for p in src_pts3:
            x, y, _ = cam.project1(p)
            pts = np.array([[x / 2, y / 2 - 3], [x / 2, y / 2 + 3],
                            [dst_xy[0] / 2, dst_xy[1] / 2 + 34], [dst_xy[0] / 2, dst_xy[1] / 2 - 34]], np.int32)
            cv2.fillConvexPoly(mask, pts, 1.0, cv2.LINE_AA)
        mask = cv2.GaussianBlur(mask, (0, 0), 6)
        out += cv2.resize(mask, (W, H))[..., None] * (C[40] * 0.25) * alpha
    return draw


def xmark(pos3, alpha, label="海马受损"):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        x, y, _ = cam.project1(pos3)
        _lines(out, lambda m: (line(m, (x - 26, y - 26), (x + 26, y + 26), 3),
                               line(m, (x - 26, y + 26), (x + 26, y - 26), 3), circle(m, (x, y), 40, 1)),
               C[10], alpha, 1.2)
        a, g = R.fonts.render(label, "sans", 24, 600)
        blit(out, a, x, y + 52, C[10], alpha, g, C[60], 0.6, anchor="ct")
    return draw


def dim(amount):
    def draw(R, out, cam):
        out *= (1 - amount)
    return draw


def credits(alpha, items, y0=150):
    def draw(R, out, cam):
        if alpha <= 0.003:
            return
        a, g = R.fonts.render("参考文献 · REFERENCES", "sans", 30, 600, 0.1)
        blit(out, a, W / 2, y0, C[10], alpha, g, C[60], 0.6, anchor="ct")
        col_w = 820
        for i, txt in enumerate(items):
            col = i // 12
            row = i % 12
            xx = W / 2 - col_w - 20 + col * (col_w + 60)
            yy = y0 + 80 + row * 48
            a, _ = R.fonts.render(txt, "sans", 19, 350)
            blit(out, a, xx, yy, C[30], alpha)
        a, _ = R.fonts.render("画面与配乐全部由代码程序化生成 · 脑区位置为示意性 MNI 坐标", "sans", 18, 400)
        blit(out, a, W / 2, H - 120, C[50], alpha, anchor="ct")
    return draw
