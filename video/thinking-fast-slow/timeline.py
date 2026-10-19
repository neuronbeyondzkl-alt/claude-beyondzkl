"""《思考，快与慢》浓缩视频的唯一时间表。

配乐（music.py）和画面（render.py）都只从这里读时间，所以每一次鼓点、
重击、嗖声和字幕出现都落在同一个节拍网格上。时间单位是“小节”，
150 BPM、4/4 拍：1 拍 = 0.4 s，1 小节 = 1.6 s，30 fps 下 1 拍正好 12 帧。
"""

BPM = 150.0
BEAT = 60.0 / BPM            # 0.4 s
BAR = 4 * BEAT               # 1.6 s
STEP = BEAT / 4              # 16 分音符 0.1 s
FPS = 30
TOTAL_BARS = 108
DURATION = TOTAL_BARS * BAR + 1.2   # 末尾留 1.2 s 黑场
W, H = 1920, 1080


def sec(bar):
    """小节（可带小数，21.5 = 第 21 小节第 3 拍）→ 秒。"""
    return bar * BAR


# ---------------------------------------------------------------- 段落
SECTIONS = [
    ("intro", 0, 8),     # 你以为你在思考
    ("title", 8, 12),    # 书名
    ("p1", 12, 28),      # 两个系统（半拍律动）
    ("p2", 28, 48),      # 启发法与偏差（第一次 drop）
    ("p3", 48, 60),      # 过度自信（breakdown → build）
    ("p4", 60, 80),      # 前景理论（主高潮）
    ("p5", 80, 92),      # 两个自我（抒情半拍）
    ("fin", 92, 104),    # 终章
    ("outro", 104, 108), # 尾声引言
]


def section_at(bar):
    for name, a, b in SECTIONS:
        if a <= bar < b:
            return name
    return "outro"


# ---------------------------------------------------------------- 和声（D 小调）
PROG = ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"]
CHORDS = (
    ["Dm"] * 8 + ["Dm"] * 4 + PROG * 2 + PROG * 2
    + ["Gm", "Bb", "C", "A"]
    + PROG + ["Gm", "Gm", "A", "A"]
    + PROG * 2 + ["Bb", "A", "Dm", "Dm"]
    + PROG + ["Gm", "Gm", "A", "A"]
    + PROG + ["Dm"] * 4 + ["Dm"] * 4
)
assert len(CHORDS) == TOTAL_BARS, len(CHORDS)

# 编配上的特殊段
SILENCES = [(21.0, 21.5), (59.5, 60.0), (99.5, 100.0)]   # 整体静音，重击之前“吸一口气”
RISERS = [(6, 8), (26, 28), (56, 59.5), (90, 92)]          # 上升音效（画面：粒子跃迁）
ROLLS = [(26, 28), (47, 48), (58, 59.5), (90, 92)]        # 军鼓滚奏
SWELLS = [(7, 8), (21.0, 21.5), (27, 28), (91, 92)]       # 反向镲（起点, 落点）
DOWNLIFTERS = [(78, 80)]
LEAD = [(60, 76, "A+B"), (92, 100, "B")]                   # 主旋律铜管出现的位置

# 重击：(小节, 强度, 类型)。配乐据此放 braam/冲击/镲，画面据此闪光、震屏、炸开粒子
HITS = [
    (8, 1.0, "braam"),
    (12, 0.6, "hit"), (14, 0.5, "hit"), (16, 0.5, "hit"), (18, 0.3, "hit"),
    (20, 0.55, "glitch"),
    (21.5, 1.0, "slam"),
    (22, 0.45, "hit"), (24, 0.6, "hit"), (26, 0.4, "hit"),
    (28, 1.0, "braam"),
    (30, 0.6, "hit"), (32, 0.5, "hit"), (34, 0.6, "hit"), (36, 0.5, "hit"),
    (38, 0.6, "hit"), (40, 0.45, "hit"), (42, 0.7, "hit"),
    (44, 0.85, "stab"), (45, 0.85, "stab"), (46, 0.85, "stab"), (47, 0.9, "stab"),
    (48, 0.9, "tail"),
    (50, 0.3, "soft"), (52, 0.3, "soft"), (54, 0.3, "soft"), (56, 0.45, "soft"),
    (60, 1.0, "braam_big"),
    (62, 0.7, "hit"), (66, 0.6, "hit"), (70, 0.7, "hit"),
    (74, 0.85, "stab"), (75, 0.85, "stab"), (76, 0.85, "stab"), (77, 0.9, "stab"),
    (80, 0.6, "tail"),
    (82, 0.3, "soft"), (84, 0.35, "soft"), (87, 0.3, "soft"), (89, 0.3, "soft"),
    (92, 1.0, "stab_big"), (93, 1.0, "stab_big"), (94, 1.0, "stab_big"),
    (96, 0.75, "hit"), (98, 0.75, "hit"),
    (100, 1.0, "braam_big"),
    (104, 0.25, "soft"),
]


# ---------------------------------------------------------------- 鼓
def drum_mode(bar):
    s = section_at(bar)
    if s in ("p2", "p4", "fin") and not (78 <= bar < 80) and bar < 100:
        return "full"
    if s in ("p1",):
        return "half"
    if s == "p3" and bar >= 56:
        return "half"
    if s == "p5":
        return "soft"
    return None


def in_ranges(bar, ranges):
    return any(a <= bar < b for a, b in ranges)


def drum_events():
    """返回 [(秒, 乐器, 力度)]，鼓谱完全由段落类型推出。"""
    ev = []
    for bar in range(TOTAL_BARS):
        mode = drum_mode(bar)
        t0 = sec(bar)
        roll = next(((a, b) for a, b in ROLLS if a <= bar < b), None)
        phrase_end = (bar % 8) == 7
        if mode == "half":
            kicks = [0, 10] + ([6] if bar % 2 else [])
            for s in kicks:
                ev.append((t0 + s * STEP, "kick", 1.0 if s == 0 else 0.8))
            if not roll:
                ev.append((t0 + 8 * STEP, "snare", 1.0))
            for s in range(0, 16, 2):
                ev.append((t0 + s * STEP, "hat", 0.55 if s % 4 == 0 else 0.32))
            if bar % 2 == 0:
                ev.append((t0, "taiko", 0.9))
            if bar % 4 == 3 and not roll:
                for i, s in enumerate([12, 13, 14, 15]):
                    ev.append((t0 + s * STEP, "tom%d" % i, 0.65 + 0.1 * i))
        elif mode == "full":
            kicks = [0, 6, 8] + ([10] if bar % 2 else [])
            for s in kicks:
                ev.append((t0 + s * STEP, "kick", 1.0 if s in (0, 8) else 0.85))
            snares = [4, 12]
            if phrase_end and not roll:
                snares = [4, 12, 13, 14, 15]
            if not roll:
                for s in snares:
                    ev.append((t0 + s * STEP, "snare", 1.0 if s in (4, 12) else 0.6 + 0.1 * (s - 12)))
            for s in range(16):
                ev.append((t0 + s * STEP, "hat", 0.5 if s % 4 == 0 else (0.38 if s % 2 == 0 else 0.22)))
            ev.append((t0, "taiko", 0.8))
            ev.append((t0 + 8 * STEP, "taiko", 0.6))
            if bar % 4 == 0:
                ev.append((t0, "crash", 0.75))
        elif mode == "soft":
            ev.append((t0, "taiko", 0.7))
            ev.append((t0, "kick", 0.7))
            if not roll:
                ev.append((t0 + 8 * STEP, "snare", 0.55))
            for s in range(0, 16, 4):
                ev.append((t0 + s * STEP, "hat", 0.22))
        if roll:
            a, b = roll
            # 前一半 8 分、后一半 16 分、最后一拍 32 分，力度渐强
            n_steps = int(round((b - a) * 16))
            for k in range(n_steps):
                tb = a + k / 16.0
                if not (bar <= tb < bar + 1):
                    continue
                p = k / max(1, n_steps - 1)
                if p < 0.5 and k % 2:
                    continue
                v = 0.25 + 0.75 * p ** 1.3
                ev.append((sec(tb), "snare", v))
                if b - tb <= 0.25:  # 最后一拍加 32 分
                    ev.append((sec(tb) + STEP / 2, "snare", v * 0.9))
                if k % 4 == 0:
                    ev.append((sec(tb), "kick", 0.6 + 0.4 * p))
    # 静音段里的鼓全部去掉
    ev = [e for e in ev if not any(sec(a) - 1e-6 <= e[0] < sec(b) for a, b in SILENCES)]
    ev.sort(key=lambda e: e[0])
    return ev


# ---------------------------------------------------------------- 字幕
# 每条字幕：文字、样式、位置、进出时间（小节），进/出动画，以及要不要带音效。
# 音效由 music.py 从这里收集，保证“字一出现，声音就到”。

def T(text, style, x, y, t0, t1, inn="rise", out="fade", **kw):
    d = dict(text=text, style=style, x=x, y=y, t0=t0, t1=t1, inn=inn, out=out)
    d.update(kw)
    return d


def F(kind, t0, t1, **kw):
    d = dict(kind=kind, t0=t0, t1=t1)
    d.update(kw)
    return d


def chapter(t0, t1, part, zh, en, sweep=True):
    return [
        T(part, "label", 0.5, 0.345, t0, t1, inn="rise", out="fade"),
        T(zh, "chapter", 0.5, 0.47, t0, t1, inn="slam", out="shatter",
          sweep=(t0 + 0.5) if sweep else None, rays=0.55),
        T(en, "en", 0.5, 0.60, t0 + 0.25, t1, inn="reveal", out="fade", stagger=0.025, sfx="shimmer"),
    ]


def rapid(bar, name, sub):
    return [
        T(name, "rapid", 0.5, 0.45, bar, bar + 0.94, inn="slam", out="shatter", rays=0.35),
        T(sub, "sub", 0.5, 0.62, bar + 0.125, bar + 0.94, inn="rise", out="cut"),
    ]


TEXTS = []
FORMS = []

# ---- 引子
TEXTS += [
    T("你以为，你在思考。", "intro", 0.5, 0.5, 1.0, 3.75, inn="reveal", out="blur", stagger=0.09, sweep=2.5),
    T("其实，大多数时候——", "intro", 0.5, 0.5, 4.0, 5.75, inn="reveal", out="blur", stagger=0.08),
    T("是另一个你，在替你做决定。", "intro", 0.5, 0.5, 6.0, 7.92, inn="reveal", out="implode", stagger=0.07),
]
FORMS += [F("point", 7.25, 8.0, x=0.5, y=0.5, all=True, ease="in", release="explode", power=1.4)]

# ---- 书名
TEXTS += [
    T("思考，快与慢", "title", 0.5, 0.44, 8.0, 11.8, inn="slam", out="blur", rays=1.0, sweep=9.0),
    T("THINKING,  FAST  AND  SLOW", "en_big", 0.5, 0.585, 9.0, 11.8, inn="reveal", stagger=0.025, out="blur", sfx="shimmer"),
    T("丹尼尔·卡尼曼（1934–2024）  ·  2002 年诺贝尔经济学奖得主", "label", 0.5, 0.655, 9.5, 11.8, inn="rise", out="blur"),
]
FORMS += [F("text", 8.0, 11.8, text="思考，快与慢", style="title", x=0.5, y=0.44, frac=0.85, dur_in=0.3, release="explode")]

# ---- 第一章 两个系统
TEXTS += chapter(12.0, 13.85, "PART ONE  ·  第一章", "两个系统", "TWO SYSTEMS")
FORMS += [F("text", 12.0, 13.85, text="两个系统", style="chapter", x=0.5, y=0.47, frac=0.7, release="explode")]

TEXTS += [
    T("系统 1", "heading", 0.50, 0.36, 14.0, 15.85, align="left", inn="slam", out="shatter"),
    T("", "body_big", 0.50, 0.52, 14.25, 15.85, align="left", inn="pop", out="fade",
      segs=[("快", 14.25), ("  ·  自动", 14.5), ("  ·  直觉", 14.75), ("  ·  毫不费力", 15.0)], sfx="pop"),
    T("2 + 2 = 4", "mono", 0.50, 0.66, 15.25, 15.85, align="left", inn="slam", out="fade", sfx="pop"),
    T("系统 2", "heading", 0.50, 0.36, 16.0, 17.85, align="left", inn="slam", out="shatter"),
    T("", "body_big", 0.50, 0.52, 16.25, 17.85, align="left", inn="pop", out="fade",
      segs=[("慢", 16.25), ("  ·  刻意", 16.5), ("  ·  专注", 16.75), ("  ·  耗费心力", 17.0)], sfx="pop"),
    T("17 × 24 = 408", "mono", 0.50, 0.66, 17.25, 17.85, align="left", inn="reveal", stagger=0.05, out="fade", sfx="tick"),
]
FORMS += [
    F("text", 14.0, 15.85, text="1", style="digit", x=0.29, y=0.5, frac=0.6, dur_in=0.22, release="explode"),
    F("text", 16.0, 17.85, text="2", style="digit", x=0.29, y=0.5, frac=0.6, dur_in=0.9, release="explode"),
]

TEXTS += [
    T("球拍 + 球 = 1.10 元", "body_big", 0.5, 0.35, 18.0, 19.9, inn="rise", out="fade", sfx="whoosh"),
    T("球拍比球贵 1.00 元", "body_big", 0.5, 0.47, 18.5, 19.9, inn="rise", out="fade", sfx="tick"),
    T("球多少钱？", "big", 0.5, 0.63, 19.0, 19.9, inn="slam", out="fade", sfx="pop"),
    T("系统 1 脱口而出", "label", 0.5, 0.33, 20.0, 21.0, inn="rise", out="cut"),
    T("0.10 元", "stat_cn", 0.5, 0.5, 20.0, 21.0, inn="glitch", out="cut", reglitch=[20.75]),
    T("错", "giant", 0.5, 0.48, 21.5, 21.97, inn="slam", out="shatter", glitch=True),
    T("球 = 0.05 元", "heading", 0.5, 0.42, 22.0, 23.9, inn="slam", out="fade"),
    T("1.05 + 0.05 = 1.10", "mono", 0.5, 0.58, 22.5, 23.9, inn="reveal", stagger=0.04, out="fade", sfx="tick"),
    T("50%+", "stat", 0.5, 0.40, 24.0, 25.9, inn="slam", out="shatter"),
    T("超过一半的哈佛、MIT、普林斯顿学生，都答错了", "body", 0.5, 0.62, 24.5, 25.9, inn="rise", out="fade"),
    T("系统 2 很懒", "heading", 0.5, 0.41, 26.0, 27.92, inn="slam", out="implode"),
    T("它常常只是，批准了系统 1 的答案", "body_big", 0.5, 0.57, 26.5, 27.85, inn="rise", out="fade"),
]
FORMS += [
    F("text", 21.5, 21.97, text="错", style="giant", x=0.5, y=0.48, frac=0.9, dur_in=0.1, release="explode", power=1.6),
    F("text", 24.0, 25.9, text="50%+", style="stat", x=0.5, y=0.40, frac=0.6, release="explode"),
    F("point", 27.5, 28.0, x=0.5, y=0.49, all=True, ease="in", release="explode", power=1.2),
]

# ---- 第二章 启发法与偏差
TEXTS += chapter(28.0, 29.85, "PART TWO  ·  第二章", "启发法与偏差", "HEURISTICS  &  BIASES")
FORMS += [F("text", 28.0, 29.85, text="启发法与偏差", style="chapter", x=0.5, y=0.47, frac=0.75, release="explode")]

TEXTS += [
    T("锚定效应", "heading", 0.5, 0.25, 30.0, 33.9, inn="slam", out="fade"),
    T("ANCHORING", "en", 0.5, 0.335, 30.25, 33.9, inn="reveal", stagger=0.03),
    T("一个随意的数字，就能拖动你的判断", "body_big", 0.5, 0.44, 30.5, 33.9, inn="rise", sfx="whoosh"),
    T("转盘停在 10", "sub", 0.29, 0.79, 32.0, 33.9, inn="rise", sfx="tick"),
    T("估计 25%", "big", 0.29, 0.87, 32.5, 33.9, inn="slam", sfx="pop"),
    T("转盘停在 65", "sub", 0.71, 0.79, 33.0, 33.9, inn="rise", sfx="tick"),
    T("估计 45%", "big", 0.71, 0.87, 33.25, 33.9, inn="slam", sfx="pop"),
    T("问：非洲国家在联合国中占多少比例？（Tversky & Kahneman, 1974）", "note", 0.5, 0.955, 32.0, 33.9),
]
FORMS += [
    F("text", 32.0, 33.9, text="10", style="num", x=0.29, y=0.62, frac=0.42, release="explode"),
    F("text", 33.0, 33.9, text="65", style="num", x=0.71, y=0.62, frac=0.42, offset=0.5, release="explode"),
]

TEXTS += [
    T("可得性启发", "heading", 0.5, 0.25, 34.0, 37.9, inn="slam", out="fade"),
    T("AVAILABILITY", "en", 0.5, 0.335, 34.25, 37.9, inn="reveal", stagger=0.03),
    T("越容易想起的事，越觉得它常见", "body_big", 0.5, 0.46, 34.5, 35.9, inn="rise", out="fade", sfx="whoosh"),
    T("中风致死人数 ≈ 所有意外事故的 2 倍", "body_big", 0.5, 0.46, 36.0, 37.9, inn="rise", sfx="tick"),
    T("80%", "stat", 0.5, 0.64, 36.5, 37.9, inn="slam", out="shatter"),
    T("的人却认为：意外更常见", "body", 0.5, 0.80, 37.0, 37.9, inn="rise"),
]
FORMS += [F("text", 36.5, 37.9, text="80%", style="stat", x=0.5, y=0.64, frac=0.55, release="explode")]

TEXTS += [
    T("代表性启发", "heading", 0.5, 0.2, 38.0, 43.9, inn="slam", out="fade"),
    T("REPRESENTATIVENESS", "en", 0.5, 0.285, 38.25, 43.9, inn="reveal", stagger=0.02),
    T("琳达，31 岁，单身，直率，非常聪明", "body_big", 0.5, 0.43, 38.5, 39.9, inn="rise", out="fade", sfx="whoosh"),
    T("主修哲学，深切关注歧视与社会正义", "body_big", 0.5, 0.53, 39.0, 39.9, inn="rise", out="fade"),
    T("A   琳达是银行柜员", "body_big", 0.5, 0.42, 40.0, 41.9, inn="rise", out="fade", sfx="tick"),
    T("B   琳达是银行柜员，并热衷女权运动", "body_big", 0.5, 0.51, 40.5, 41.9, inn="rise", out="fade", sfx="tick"),
    T("哪一个可能性更大？", "big", 0.5, 0.65, 41.0, 41.9, inn="slam", out="fade", sfx="pop"),
    T("85%–90% 的大学生选了 B", "big", 0.5, 0.39, 42.0, 43.9, inn="slam"),
    T("A", "big", 0.385, 0.53, 42.25, 43.9, inn="rise", sfx="tick"),
    T("B", "sub", 0.535, 0.645, 42.5, 43.9, inn="rise"),
    T("可 B 被 A 包含——它不可能比 A 更大", "body_big", 0.5, 0.87, 43.0, 43.9, inn="rise"),
]
FORMS += [F("rings", 42.0, 43.9, x=0.5, y=0.64, frac=0.5, release="explode")]

TEXTS += rapid(44, "光环效应", "第一印象，染色一切")
TEXTS += rapid(45, "小数定律", "小样本，也被当成真相")
TEXTS += rapid(46, "忽视基础概率", "只看描述，忘了比例")
TEXTS += rapid(47, "回归均值", "极端之后，往往回归平常")
for b, w in [(44, "光环效应"), (45, "小数定律"), (46, "忽视基础概率"), (47, "回归均值")]:
    FORMS.append(F("text", b, b + 0.94, text=w, style="rapid", x=0.5, y=0.45, frac=0.8, dur_in=0.16, release="explode"))

# ---- 第三章 过度自信
TEXTS += chapter(48.0, 49.85, "PART THREE  ·  第三章", "过度自信", "OVERCONFIDENCE")
FORMS += [F("text", 48.0, 49.85, text="过度自信", style="chapter", x=0.5, y=0.47, frac=0.7, release="dissolve")]

TEXTS += [
    T("WYSIATI", "en_huge", 0.5, 0.38, 50.0, 51.9, inn="reveal", stagger=0.06, out="blur", rays=0.6, sweep=50.6),
    T("WHAT  YOU  SEE  IS  ALL  THERE  IS", "en", 0.5, 0.49, 50.25, 51.9, inn="reveal", stagger=0.015, out="blur"),
    T("眼见即为事实", "big", 0.5, 0.62, 50.75, 51.9, inn="rise", out="blur", sfx="whoosh"),
    T("后见之明", "heading", 0.5, 0.36, 52.0, 53.9, inn="rise", out="blur"),
    T("「我早就知道」——于是以为，未来也能预知", "body_big", 0.5, 0.55, 52.5, 53.9, inn="rise", out="blur", sfx="whoosh"),
    T("规划谬误", "heading", 0.5, 0.36, 54.0, 55.9, inn="rise", out="blur"),
    T("一切总比计划更久、更贵、更难", "body_big", 0.5, 0.55, 54.5, 55.9, inn="rise", out="blur", sfx="whoosh"),
    T("专家的直觉，何时可信？", "big", 0.5, 0.38, 56.0, 57.9, inn="rise", out="blur"),
    T("", "body_big", 0.5, 0.56, 56.5, 57.9, inn="pop", out="blur",
      segs=[("规律稳定的环境", 56.5), ("  ·  长期练习", 56.875), ("  ·  及时反馈", 57.25)], sfx="pop"),
    T("但在不确定之中，", "big", 0.5, 0.43, 58.0, 59.45, inn="rise", out="cut", sfx="whoosh"),
    T("我们最怕的，是——", "big", 0.5, 0.56, 58.75, 59.45, inn="rise", out="cut"),
]

# ---- 第四章 前景理论
TEXTS += [
    T("失去。", "giant", 0.5, 0.45, 60.0, 61.85, inn="slam", out="shatter", rays=0.6),
    T("PART FOUR  ·  第四章  ·  前景理论  PROSPECT THEORY", "label", 0.5, 0.76, 60.75, 61.85, inn="rise", out="fade", sfx="shimmer"),
]
FORMS += [F("text", 60.0, 61.85, text="失去。", style="giant", x=0.5, y=0.45, frac=0.85, dur_in=0.12, release="explode", power=1.5)]

TEXTS += [
    T("损失厌恶", "heading", 0.70, 0.30, 62.0, 65.9, inn="slam", out="fade"),
    T("LOSS AVERSION", "en", 0.70, 0.385, 62.25, 65.9, inn="reveal", stagger=0.03),
    T("失去的痛苦，约是同等收益快乐的", "body", 0.70, 0.52, 63.0, 65.9, inn="rise", sfx="whoosh"),
    T("1.5 – 2.5 倍", "stat_cn", 0.70, 0.65, 63.75, 65.9, inn="slam", out="shatter"),
    T("收益", "note_b", 0.52, 0.425, 62.5, 65.9, inn="rise"),
    T("损失", "note_b", 0.08, 0.425, 62.5, 65.9, inn="rise"),
    T("参照点", "note_b", 0.345, 0.535, 62.75, 65.9, inn="rise", sfx="tick"),
]
FORMS += [F("value_curve", 62.0, 65.9, x=0.30, y=0.46, frac=0.55, dur_in=0.7, release="dissolve")]

TEXTS += [
    T("参照点", "heading", 0.5, 0.24, 66.0, 69.9, inn="slam", out="fade"),
    T("REFERENCE POINT", "en", 0.5, 0.325, 66.25, 69.9, inn="reveal", stagger=0.03),
    T("快乐取决于变化，而不是总量", "body_big", 0.5, 0.44, 66.5, 69.9, inn="rise", sfx="whoosh"),
    T("今天，杰克和吉尔都有 500 万", "body", 0.5, 0.58, 68.0, 69.9, inn="rise", sfx="tick"),
    T("昨天：杰克只有 100 万，吉尔有 900 万", "body", 0.5, 0.66, 68.5, 69.9, inn="rise", sfx="tick"),
    T("他们一样快乐吗？", "big", 0.5, 0.79, 69.0, 69.9, inn="slam", sfx="pop"),
]

TEXTS += [
    T("框架效应", "heading", 0.5, 0.22, 70.0, 73.9, inn="slam", out="fade"),
    T("FRAMING", "en", 0.5, 0.305, 70.25, 73.9, inn="reveal", stagger=0.04),
    T("「术后一个月存活率 90%」", "body_big", 0.29, 0.44, 70.75, 73.9, inn="rise", sfx="tick"),
    T("「术后一个月死亡率 10%」", "body_big", 0.71, 0.44, 71.25, 73.9, inn="rise", sfx="tick"),
    T("选择手术的医生", "label", 0.5, 0.555, 72.0, 73.9, inn="rise"),
    T("84%", "stat", 0.29, 0.66, 72.25, 73.9, inn="slam", out="shatter"),
    T("50%", "stat", 0.71, 0.66, 72.75, 73.9, inn="slam", out="shatter"),
    T("同一个事实，换个说法，换个选择", "body_big", 0.5, 0.86, 73.25, 73.9, inn="rise"),
]
FORMS += [
    F("text", 72.25, 73.9, text="84%", style="stat", x=0.29, y=0.66, frac=0.4, release="explode"),
    F("text", 72.75, 73.9, text="50%", style="stat", x=0.71, y=0.66, frac=0.4, offset=0.5, release="explode"),
]

TEXTS += rapid(74, "禀赋效应", "一旦拥有，就不肯放手")
TEXTS += rapid(75, "确定性效应", "为了 100% 的确定，宁愿多付代价")
TEXTS += rapid(76, "沉没成本", "为已经失去的，继续下注")
TEXTS += rapid(77, "心理账户", "钱，被分进不同的抽屉")
for b, w in [(74, "禀赋效应"), (75, "确定性效应"), (76, "沉没成本"), (77, "心理账户")]:
    FORMS.append(F("text", b, b + 0.94, text=w, style="rapid", x=0.5, y=0.45, frac=0.8, dur_in=0.16, release="explode"))

TEXTS += [
    T("说到底，", "big", 0.5, 0.43, 78.0, 79.85, inn="rise", out="blur", sfx="whoosh"),
    T("做选择的，是哪一个「你」？", "big", 0.5, 0.56, 78.75, 79.85, inn="rise", out="blur"),
]

# ---- 第五章 两个自我
TEXTS += chapter(80.0, 81.85, "PART FIVE  ·  第五章", "两个自我", "TWO SELVES")
FORMS += [F("text", 80.0, 81.85, text="两个自我", style="chapter", x=0.5, y=0.47, frac=0.7, release="dissolve")]

TEXTS += [
    T("体验自我", "heading", 0.29, 0.42, 82.0, 83.9, inn="rise", out="blur"),
    T("活在每一个当下", "body_big", 0.29, 0.56, 82.5, 83.9, inn="rise", out="blur", sfx="whoosh"),
    T("记忆自我", "heading", 0.71, 0.42, 83.0, 83.9, inn="rise", out="blur", sfx="tick"),
    T("只记得一个故事", "body_big", 0.71, 0.56, 83.4, 83.9, inn="rise", out="blur"),
    T("峰终定律", "heading", 0.5, 0.17, 84.0, 86.9, inn="slam", out="blur"),
    T("PEAK – END  RULE", "en", 0.5, 0.25, 84.25, 86.9, inn="reveal", stagger=0.03),
    T("峰值", "sub", 0.40, 0.33, 84.75, 86.9, inn="rise", sfx="pop"),
    T("结尾", "sub", 0.815, 0.515, 85.25, 86.9, inn="rise", sfx="pop"),
    T("记忆只保留：最强烈的一刻 + 结尾", "body_big", 0.5, 0.86, 85.5, 86.9, inn="rise", sfx="whoosh"),
    T("冷水实验", "heading", 0.5, 0.32, 87.0, 88.9, inn="rise", out="blur"),
    T("60 秒冰水   vs   60 秒冰水 + 30 秒稍暖", "body_big", 0.5, 0.47, 87.25, 88.9, inn="rise", out="blur", sfx="whoosh"),
    T("多数人，宁愿重来更长的那一次", "big", 0.5, 0.61, 88.0, 88.9, inn="rise", out="blur", sfx="tick"),
    T("我们选择的，不是体验", "big", 0.5, 0.44, 89.0, 90.9, inn="rise", out="blur", sfx="whoosh"),
    T("而是对体验的记忆", "big", 0.5, 0.57, 89.75, 90.9, inn="rise", out="blur"),
    T("那么，如何与直觉相处？", "big", 0.5, 0.5, 91.0, 91.92, inn="reveal", stagger=0.05, out="implode"),
]
FORMS += [
    F("peak_end", 84.0, 86.9, x=0.5, y=0.53, frac=0.55, dur_in=1.2, release="dissolve"),
    F("point", 91.4, 92.0, x=0.5, y=0.5, all=True, ease="in", release="explode", power=1.3),
]

# ---- 终章
TEXTS += [
    T("识别雷区", "rapid", 0.5, 0.45, 92.0, 92.94, inn="slam", out="shatter", rays=0.6),
    T("察觉认知陷阱的信号", "sub", 0.5, 0.62, 92.125, 92.94, inn="rise", out="cut"),
    T("放慢脚步", "rapid", 0.5, 0.45, 93.0, 93.94, inn="slam", out="shatter", rays=0.6),
    T("别急着相信第一反应", "sub", 0.5, 0.62, 93.125, 93.94, inn="rise", out="cut"),
    T("召唤系统 2", "rapid", 0.5, 0.45, 94.0, 95.9, inn="slam", out="shatter", rays=0.8),
    T("让理性，在关键时刻接管", "sub", 0.5, 0.62, 94.25, 95.9, inn="rise", out="fade"),
    T("快，是本能。", "chapter", 0.5, 0.48, 96.0, 97.9, inn="slam", out="shatter", rays=0.6, sweep=96.6),
    T("慢，是能力。", "chapter", 0.5, 0.48, 98.0, 99.45, inn="slam", out="cut", rays=0.6, sweep=98.6),
    T("思考，快与慢", "title", 0.5, 0.44, 100.0, 103.9, inn="slam", out="blur", rays=1.0, sweep=101.0),
    T("THINKING,  FAST  AND  SLOW", "en_big", 0.5, 0.585, 100.5, 103.9, inn="reveal", stagger=0.025, out="blur", sfx="shimmer"),
    T("DANIEL  KAHNEMAN", "en", 0.5, 0.655, 101.0, 103.9, inn="reveal", stagger=0.03, out="blur"),
    T("「当你正想着它的时候，", "quote", 0.5, 0.43, 104.25, 107.6, inn="reveal", stagger=0.06, out="blur"),
    T("生活中没有什么事，像你以为的那么重要。」", "quote", 0.5, 0.52, 105.0, 107.6, inn="reveal", stagger=0.06, out="blur"),
    T("—— 丹尼尔·卡尼曼", "label", 0.5, 0.63, 106.0, 107.6, inn="rise", out="blur"),
]
for b, w in [(92, "识别雷区"), (93, "放慢脚步")]:
    FORMS.append(F("text", b, b + 0.94, text=w, style="rapid", x=0.5, y=0.45, frac=0.8, dur_in=0.14, release="explode"))
FORMS += [
    F("text", 94.0, 95.9, text="召唤系统 2", style="rapid", x=0.5, y=0.45, frac=0.85, dur_in=0.14, release="explode"),
    F("text", 96.0, 97.9, text="快，是本能。", style="chapter", x=0.5, y=0.48, frac=0.75, dur_in=0.2, release="explode"),
    F("text", 98.0, 99.45, text="慢，是能力。", style="chapter", x=0.5, y=0.48, frac=0.75, dur_in=0.8, release="explode"),
    F("text", 100.0, 103.9, text="思考，快与慢", style="title", x=0.5, y=0.44, frac=0.9, dur_in=0.25, release="dissolve"),
]


# ---------------------------------------------------------------- 画面参数关键帧（小节, 值）
VIS = {
    # 可见粒子比例
    "density": [(0, 0.02), (1, 0.06), (6, 0.35), (7.9, 0.6), (8, 1.0), (12, 0.85), (28, 1.0),
                (48, 0.7), (60, 1.0), (80, 0.75), (92, 1.0), (104, 0.45), (108, 0.0)],
    "bright": [(0, 0.8), (8, 1.0), (12, 0.9), (28, 1.05), (48, 0.75), (60, 1.1), (80, 0.8),
               (92, 1.15), (104, 0.7), (108, 0.25)],
    # 漂移速度（被积分成“粒子时间”，0 = 冻结）
    "speed": [(0, 0.3), (8, 1.3), (9.5, 0.7), (12, 0.8), (13.98, 0.8), (14, 2.8), (15.98, 2.8),
              (16, 0.12), (17.98, 0.12), (18, 0.7), (20.98, 0.9), (21, 0.0), (21.48, 0.0), (21.5, 1.8),
              (22.5, 0.8), (26, 0.9), (28, 1.4), (47.9, 1.4), (48, 0.5), (56, 0.6), (59.48, 0.9),
              (59.5, 0.0), (59.98, 0.0), (60, 1.7), (78, 0.6), (80, 0.45), (88, 0.5), (92, 1.7),
              (99.48, 1.6), (99.5, 0.0), (99.98, 0.0), (100, 1.3), (104, 0.3), (108, 0.2)],
    # 风（像素/秒），系统 1 那两小节横向疾驰
    "wind_x": [(0, 0), (13.9, 0), (14.0, 1500), (15.8, 1500), (16.0, 0), (108, 0)],
    "wind_y": [(0, -12), (26, -12), (27.9, -260), (28, -20), (56, -15), (59.45, -300), (59.5, 0),
               (60, -30), (90, -15), (91.9, -260), (92, -40), (104, -10), (108, -10)],
    "fog": [(0, 0.25), (8, 0.6), (12, 0.45), (28, 0.5), (48, 0.85), (60, 0.55), (80, 0.85),
            (92, 0.55), (104, 0.5), (108, 0.0)],
    "rays": [(0, 0.12), (7, 0.3), (8, 1.0), (11, 0.6), (12, 0.35), (28, 0.45), (48, 0.95),
             (60, 0.55), (80, 0.95), (92, 0.6), (100, 1.0), (104, 0.7), (108, 0.0)],
    "pulse": [(0, 0), (12, 0.25), (28, 0.5), (47.9, 0.5), (48, 0.05), (56, 0.3), (60, 0.55),
              (78, 0.1), (80, 0.15), (92, 0.6), (100, 0.2), (104, 0)],
    "warp": [(0, 0), (6, 0), (7.95, 1), (8, 0), (26, 0), (27.95, 1), (28, 0), (56, 0), (59.45, 1),
             (59.5, 0), (90, 0), (91.95, 1), (92, 0), (108, 0)],
    "exposure": [(0, 0.0), (0.7, 1.0), (20.98, 1.0), (21.0, 0.28), (21.48, 0.28), (21.5, 1.0),
                 (59.48, 1.0), (59.5, 0.25), (59.98, 0.25), (60, 1.0), (99.48, 1.0), (99.5, 0.22),
                 (99.98, 0.22), (100, 1.0), (106.8, 1.0), (108, 0.0)],
}
