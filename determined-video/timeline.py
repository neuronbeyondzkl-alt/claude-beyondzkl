"""Shared timeline for the Determined video.

audio.py and render.py both import this module, so every drum hit, impact,
whoosh and text slam is placed on the same beat grid. 120 BPM at 30 fps puts
every beat exactly on a frame boundary (one beat = 15 frames).
"""

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s
BAR = 4 * BEAT             # 2.0 s
FPS = 30
W, H = 1920, 1080
BARS = 64
DURATION = BARS * BAR      # 128 s


def T(bar, beat=0.0):
    """Seconds at a bar (and beat inside that bar)."""
    return bar * BAR + beat * BEAT


# ---------------------------------------------------------------- sections
SECTIONS = [
    ("intro", 0, 4),       # 黑暗、心跳、一粒光
    ("title", 4, 8),       # 书名、粒子头像
    ("thesis", 8, 12),     # 核心论点
    ("chain", 12, 22),     # 因果链倒推：1 秒前 → 数百万年前
    ("turtles", 22, 24),   # 乌龟一路驮到底 + 起飞前的静默
    ("drop1", 24, 32),     # 混沌 / 涌现 / 量子 都不是出路
    ("schop", 32, 36),     # 叔本华、电影最后三分钟
    ("breakdown", 36, 44), # 女巫之锤 → 神经科学
    ("build2", 44, 52),    # 刹车失灵的车、隔离、功绩
    ("final", 52, 60),     # 你可以被改变 → 慈悲
    ("outro", 60, 64),     # 片尾书名
]


def section_at(t):
    for name, b0, b1 in SECTIONS:
        if T(b0) <= t < T(b1):
            return name, (t - T(b0)) / (T(b1) - T(b0))
    return SECTIONS[-1][0], 1.0


# ---------------------------------------------------------------- harmony (D minor)
_PROG = (
    ["Dm"] * 4                                   # intro
    + ["Dm", "Bb", "F", "C"]                     # title
    + ["Dm", "Bb", "Gm", "A"]                    # thesis
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "F", "C", "Gm", "A"]  # chain
    + ["Bb", "A"]                                # turtles
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]            # drop1
    + ["Dm", "Bb", "F", "A"]                     # schop
    + ["Bb", "F", "C", "Dm", "Bb", "F", "Gm", "A"]             # breakdown
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]            # build2
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "C", "A"]             # final
    + ["D"] * 4                                  # outro: Picardy third, hopeful
)
assert len(_PROG) == BARS

VOICING = {   # MIDI notes, smooth voice leading around D4
    "Dm": [50, 57, 62, 65, 69],
    "Bb": [46, 53, 58, 62, 65],
    "F":  [41, 48, 57, 60, 65],
    "C":  [48, 55, 60, 64, 67],
    "Gm": [43, 50, 58, 62, 67],
    "A":  [45, 52, 61, 64, 69],
    "D":  [50, 57, 62, 66, 69],
}
ROOT = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "Gm": 31, "A": 33, "D": 38}


def chord_at_bar(bar):
    return _PROG[max(0, min(BARS - 1, int(bar)))]


# ---------------------------------------------------------------- drums
# Every hit is (time_s, instrument, velocity). render.py reads the same list
# for particle pulses, so a kick you hear is a pulse you see.

def _steps(bar, pattern, inst, vel=1.0, accent=None):
    out = []
    for s, ch in enumerate(pattern):
        if ch == "x" or ch == "X":
            v = vel * (1.0 if ch == "X" else 0.72)
            if accent and s in accent:
                v *= 1.15
            out.append((T(bar, s / 4.0), inst, v))
    return out


def build_drums():
    hits = []
    # intro: heartbeat that slowly gets louder
    for bar in range(0, 4):
        for beat in (0.0, 2.0):
            v = 0.45 + 0.15 * bar + 0.05 * (beat > 0)
            hits.append((T(bar, beat), "heart", v))
            hits.append((T(bar, beat + 0.36), "heart2", v * 0.8))
    # title: one taiko per bar, soft
    for bar in range(5, 8):
        hits.append((T(bar), "taiko", 0.55))
        hits.append((T(bar, 2.5), "tom", 0.35))
    # thesis: half-time kick + clock ticks
    for bar in range(8, 12):
        hits += _steps(bar, "X.......x.......", "kick", 0.85)
        hits += _steps(bar, "x.x.x.x.x.x.x.x.", "tick", 0.55)
        if bar in (10, 11):
            hits += _steps(bar, "........X.......", "snare", 0.6)
    # chain: one taiko per layer + a build
    for bar in range(12, 22):
        hits.append((T(bar), "taiko", 1.0))
        if bar < 16:
            hits += _steps(bar, "X.......X.......", "kick", 0.9)
            hits += _steps(bar, "x.x.x.x.x.x.x.x.", "tick", 0.6)
        elif bar < 20:
            hits += _steps(bar, "X...X...X...X...", "kick", 0.95)
            hits += _steps(bar, "....X.......X...", "snare", 0.8)
            hits += _steps(bar, "x.x.x.x.x.x.x.x.", "hat", 0.6)
            hits += _steps(bar, "..x...x...x...x.", "tick", 0.5)
        else:
            hits += _steps(bar, "X...X...X...X...", "kick", 1.0)
            hits += _steps(bar, "....X.......X.x.", "snare", 0.9)
            hits += _steps(bar, "xxxxxxxxxxxxxxxx", "hat", 0.55)
            hits += _steps(bar, "............x.xx", "tom", 0.7)
    # turtles: snare roll that accelerates, then one beat of silence
    for i in range(16):
        hits.append((T(22, i / 4.0), "snare", 0.35 + 0.02 * i))
    for i in range(24):           # 32nds through beat 3 of bar 23
        hits.append((T(23, i / 8.0), "snare", 0.55 + 0.018 * i))
    hits.append((T(22), "taiko", 0.9))
    # drop1: full kit, a braam every two bars (scene changes)
    for bar in range(24, 32):
        hits += _steps(bar, "X..x..X.X...X..x", "kick", 1.0)
        hits += _steps(bar, "....X.......X...", "snare", 1.0)
        hits += _steps(bar, "xxXxxxXxxxXxxxXx", "hat", 0.55)
        hits += _steps(bar, "X.....x.....x.x.", "taiko", 0.8)
        if bar % 2 == 1:
            hits += _steps(bar, "............xxxx", "tom", 0.75)
    # schop: half time
    for bar in range(32, 36):
        hits += _steps(bar, "X.........x.....", "kick", 0.85)
        hits += _steps(bar, "........X.......", "snare", 0.85)
        hits += _steps(bar, "x.x.x.x.x.x.x.x.", "hat", 0.4)
    # breakdown: almost nothing; deep pulses under the fire and the turn
    for bar in (38, 39):
        hits.append((T(bar), "taiko", 0.7))
        hits.append((T(bar, 2), "taiko", 0.45))
    for bar in (40, 41):
        hits.append((T(bar), "heart", 0.7))
        hits.append((T(bar, 0.36), "heart2", 0.55))
    for bar in (42, 43):
        hits += _steps(bar, "X.......X.......", "taiko", 0.6)
        if bar == 43:
            hits += _steps(bar, "........x.x.xxxx", "tom", 0.6)
    # build2: rebuilds the kit, roll, one beat of silence
    for bar in range(44, 52):
        hits.append((T(bar), "taiko", 0.95))
        if bar < 48:
            hits += _steps(bar, "X.......X.......", "kick", 0.9)
            hits += _steps(bar, "x.x.x.x.x.x.x.x.", "tick", 0.5)
            hits += _steps(bar, "........X.......", "snare", 0.75)
        elif bar < 50:
            hits += _steps(bar, "X...X...X...X...", "kick", 0.95)
            hits += _steps(bar, "....X.......X...", "snare", 0.9)
            hits += _steps(bar, "x.x.x.x.x.x.x.x.", "hat", 0.55)
        elif bar == 50:
            hits += _steps(bar, "X...X...X...X...", "kick", 1.0)
            for i in range(16):
                hits.append((T(bar, i / 4.0), "snare", 0.45 + 0.02 * i))
        else:
            for i in range(24):
                hits.append((T(bar, i / 8.0), "snare", 0.6 + 0.016 * i))
    # final: everything + taiko gallop
    for bar in range(52, 60):
        hits += _steps(bar, "X..x..X.X...X..x", "kick", 1.0)
        hits += _steps(bar, "....X.......X...", "snare", 1.0)
        hits += _steps(bar, "xxXxxxXxxxXxxxXx", "hat", 0.6)
        hits += _steps(bar, "X.xxX.x.X.xxX.x.", "taiko", 0.75)
        if bar % 2 == 1:
            hits += _steps(bar, "........x.x.xxxx", "tom", 0.8)
    # outro: the heartbeat returns
    for bar, v in ((61, 0.55), (62, 0.45), (63, 0.3)):
        hits.append((T(bar), "heart", v))
        hits.append((T(bar, 0.36), "heart2", v * 0.8))
    hits.sort(key=lambda h: h[0])
    return hits


DRUMS = build_drums()

# ---------------------------------------------------------------- sync events
# Big moments get a matching sound AND a matching picture:
#   impact  -> sub boom + braam + crash   | white flash, shockwave, shake, RGB split
#   hit     -> taiko + whoosh              | flash ring, particle burst
#   riser   -> noise/pitch riser           | zoom-in, brightness build
#   silence -> everything cut for one beat | blackout, only text remains
#   glitch  -> bit-crushed stutter          | scanline displacement
#   sparkle -> glassy chimes               | particles landing in text
IMPACTS = [T(4), T(9), T(24), T(26), T(28), T(30), T(52), T(60)]
HITS = [T(b) for b in range(12, 22)] + [T(44), T(46), T(48), T(38), T(40), T(42), T(56)]
RISERS = [(T(3), T(4)), (T(10), T(12)), (T(20), T(23, 3)), (T(43), T(44)),
          (T(48), T(51, 3))]
SILENCES = [(T(23, 3), T(24)), (T(51, 3), T(52))]
GLITCHES = [T(30, 1.5), T(30, 2.75), T(31, 0.5), T(31, 1.25), T(31, 2.0), T(31, 2.5), T(31, 3.25)]
BRAAMS = [T(4), T(9), T(24), T(26), T(28), T(30), T(32), T(52), T(56), T(60)]
CRASHES = [T(4), T(12), T(16), T(20), T(24), T(26), T(28), T(30), T(44), T(48),
           T(52), T(54), T(56), T(58), T(60)]

# ---------------------------------------------------------------- colours (sRGB)
# 封面双色：Loyel 冷光蓝（因果、决定论） + 封面橙余烬（人、情绪、温度）
ABYSS = "#03060C"
NAVY = "#0B1A2E"        # cover navy #1A365D pushed into the dark
L10, L20, L30, L40, L50, L60, L70 = ("#F4F7FB", "#E8EEF6", "#CCDBEB", "#9FBDDA",
                                     "#6C9AC4", "#497DAE", "#376392")
EMBER = "#D3643E"       # sampled from the cover's orange dots
EMBER_HI = "#F0915E"
TEXT = L10
TEXT_BLUE = L40
TEXT_EMBER = "#F29A6B"

# ---------------------------------------------------------------- fonts
SERIF = "NotoSerifSC-Black.ttf"
SANS_B = "NotoSansSC-Black.ttf"
SANS_L = "NotoSansSC-Light.ttf"
LAT_B = "Montserrat-ExtraBold.ttf"
LAT_L = "Montserrat-Light.ttf"
OSW = "Oswald-Bold.ttf"


def L(segs, font, size, track=0):
    """One text line. segs is a str or a list of (text, colour)."""
    if isinstance(segs, str):
        segs = [(segs, TEXT)]
    return {"segs": segs, "font": font, "size": size, "track": track}


def cue(t0, t1, lines, pos=(960, 540), style="fade", out="fade", glow=1.0, gap=None):
    return {"t0": t0, "t1": t1, "lines": lines, "pos": pos, "style": style,
            "out": out, "glow": glow, "gap": gap}


CX, CY = W // 2, H // 2

CUES = [
    # ---- intro
    cue(T(0, 2), T(3, 3), [L("你以为，", SANS_L, 46, 6)], (CX, 470), "fade", "dissolve"),
    cue(T(1, 2), T(3, 3), [L([("每一个选择，都出自「", TEXT), ("你", TEXT_EMBER), ("」。", TEXT)], SANS_L, 58, 6)],
        (CX, 560), "fade", "dissolve"),
    # ---- title
    cue(T(4), T(7, 3), [L("DETERMINED", LAT_B, 150, 14)], (CX, 820), "assemble", "dissolve", 1.3),
    cue(T(5), T(7, 3), [L("THE SCIENCE OF LIFE WITHOUT FREE WILL", LAT_L, 30, 9)], (CX, 922), "flicker", "fade"),
    cue(T(5, 2), T(7, 3), [L("一门没有自由意志的生命科学", SANS_L, 32, 10)], (CX, 972), "fade", "fade"),
    cue(T(6), T(7, 3), [L([("ROBERT SAPOLSKY", TEXT_BLUE)], LAT_L, 26, 12)], (CX, 120), "flicker", "fade"),
    # ---- thesis
    cue(T(8), T(8, 3.5), [L("斯坦福神经生物学家 · 萨波尔斯基的结论", SANS_L, 40, 6)], (CX, 880), "fade", "fade"),
    cue(T(9), T(10, 0), [L([("自由意志", TEXT), (" · ", TEXT_BLUE), ("并不存在", TEXT_EMBER)], SERIF, 132, 8)],
        (CX, 540), "slam", "dissolve", 1.4),
    cue(T(10), T(11, 3.6), [L([("你，是一切", TEXT), ("你无法掌控之物", TEXT_EMBER), ("的总和", TEXT)], SERIF, 70, 4)],
        (CX, 500), "fade", "dissolve"),
    cue(T(10, 3), T(11, 3.6), [L("生物学  ×  环境  ×  二者的相互作用", SANS_L, 38, 8)], (CX, 600), "flicker", "fade"),
]

CHAIN = [  # bar 12..21 — time label, content
    ("1 秒前", "神经元放电，行为发生"),
    ("几秒 ~ 几分钟前", "气味、声音、面孔，悄悄左右判断"),
    ("几小时 ~ 几天前", "睾酮、皮质醇，调校大脑的敏感度"),
    ("几周 ~ 几年前", "经历重塑神经元之间的连接"),
    ("青春期", "前额叶，直到 25 岁左右才成熟"),
    ("童年", "逆境与贫困，刻进大脑的发育"),
    ("胎儿期", "子宫里的激素与营养，已在塑造你"),
    ("受孕那一刻", "基因——你从未挑选过"),
    ("数百年前", "祖先的文化，决定你被如何养育"),
    ("数百万年前", "进化，塑造了这一切"),
]
for i, (lab, sub) in enumerate(CHAIN):
    b = 12 + i
    CUES.append(cue(T(b), T(b, 3.7), [L(lab, SANS_B, 96, 6)], (CX, 760), "slam", "fade", 1.1))
    CUES.append(cue(T(b, 0.5), T(b, 3.7), [L(sub, SANS_L, 40, 6)], (CX, 860), "fade", "fade"))

CUES += [
    # ---- turtles
    cue(T(22), T(22, 3.7), [L("每一个原因背后，都还有原因", SERIF, 72, 4)], (CX, 520), "fade", "dissolve"),
    cue(T(22, 1.5), T(22, 3.7), [L("TURTLES ALL THE WAY DOWN", OSW, 40, 18)], (CX, 620), "flicker", "fade"),
    cue(T(23), T(24, 0), [L([("自由意志，需要一个「", TEXT), ("无因之因", TEXT_EMBER), ("」", TEXT)], SERIF, 76, 4)],
        (CX, 690), "slam", "cut", 1.2),
    # ---- drop1
    cue(T(24), T(25, 3.6), [L("科学，找不到它", SERIF, 140, 10)], (CX, 500), "slam", "dissolve", 1.5),
    cue(T(24, 2), T(25, 3.6), [L("没有一个神经元，能脱离它的过去而放电", SANS_L, 40, 6)], (CX, 640), "fade", "fade"),
    cue(T(26), T(27, 3.7), [L([("混沌", TEXT), ("  ≠  ", TEXT_BLUE), ("自由", TEXT_EMBER)], SERIF, 120, 10)], (CX, 820), "slam", "dissolve", 1.3),
    cue(T(26, 1), T(27, 3.7), [L("不可预测，不等于不被决定", SANS_L, 40, 8)], (CX, 930), "fade", "fade"),
    cue(T(28), T(29, 3.7), [L([("涌现", TEXT), ("  ≠  ", TEXT_BLUE), ("自由", TEXT_EMBER)], SERIF, 120, 10)], (CX, 820), "slam", "dissolve", 1.3),
    cue(T(28, 1), T(29, 3.7), [L("整体再神奇，零件依旧服从规律", SANS_L, 40, 8)], (CX, 930), "fade", "fade"),
    cue(T(30), T(31, 3.7), [L([("量子随机", TEXT), ("  ≠  ", TEXT_BLUE), ("自由", TEXT_EMBER)], SERIF, 120, 10)], (CX, 820), "slam", "dissolve", 1.3),
    cue(T(30, 1), T(31, 3.7), [L("随机，也不是「你」在做主", SANS_L, 40, 8)], (CX, 930), "fade", "fade"),
    # ---- schopenhauer / final three minutes
    cue(T(32), T(33, 3.6), [L("人能做他想做的，", SERIF, 78, 4)], (690, 430), "fade", "dissolve"),
    cue(T(33), T(33, 3.6), [L([("却不能决定，", TEXT), ("自己想要什么", TEXT_EMBER), ("。", TEXT)], SERIF, 78, 4)], (690, 540), "fade", "dissolve"),
    cue(T(33, 1), T(33, 3.6), [L("—— 叔本华", SANS_L, 34, 8)], (690, 640), "fade", "fade"),
    cue(T(34), T(35, 3.7), [L("别只盯着电影的最后三分钟", SERIF, 70, 4)], (690, 470), "fade", "dissolve"),
    cue(T(34, 2), T(35, 3.7), [L([("要问：这份意图，", TEXT), ("从哪里来", TEXT_EMBER), ("？", TEXT)], SANS_L, 46, 6)], (690, 570), "fade", "fade"),
    # ---- breakdown
    cue(T(36), T(37, 3.6), [L("没有自由意志，世界会失控吗？", SERIF, 72, 4)], (CX, 540), "fade", "dissolve"),
    cue(T(38), T(39, 3.7), [L([("15 世纪 ·《女巫之锤》", TEXT_EMBER)], SANS_B, 60, 6)], (CX, 800), "fade", "fade"),
    cue(T(38, 1), T(39, 3.7), [L("癫痫发作，被当作与魔鬼勾结的证据", SANS_L, 40, 6)], (CX, 890), "fade", "dissolve"),
    cue(T(40), T(41, 3.7), [L([("今天 · 我们知道", TEXT_BLUE)], SANS_B, 60, 6)], (CX, 800), "fade", "fade"),
    cue(T(40, 1), T(41, 3.7), [L("那只是一群神经元的异常同步放电", SANS_L, 40, 6)], (CX, 890), "fade", "dissolve"),
    cue(T(42), T(43, 3.6), [L("我们早已做到过一次：", SERIF, 70, 4)], (1250, 490), "fade", "dissolve"),
    cue(T(42, 1.5), T(43, 3.6), [L([("看清机制，", TEXT), ("便放下审判", TEXT_EMBER)], SERIF, 70, 4)], (1250, 600), "fade", "dissolve"),
    # ---- build2
    cue(T(44), T(45, 3.6), [L([("一辆刹车失灵的车，并不「", TEXT), ("邪恶", TEXT_EMBER), ("」", TEXT)], SERIF, 68, 4)], (CX, 810), "slam", "dissolve", 1.1),
    cue(T(45), T(45, 3.6), [L("但我们仍要让它停下来", SANS_L, 42, 8)], (CX, 910), "fade", "fade"),
    cue(T(46), T(47, 3.6), [L([("惩罚", TEXT_EMBER), ("  →  ", TEXT_BLUE), ("隔离", TEXT)], SERIF, 120, 10)], (CX, 820), "slam", "dissolve", 1.3),
    cue(T(46, 1), T(47, 3.6), [L("像对待传染病：保护他人，而不是报复", SANS_L, 40, 6)], (CX, 930), "fade", "fade"),
    cue(T(48), T(49, 3.6), [L([("功绩，也不是「", TEXT), ("挣", TEXT_EMBER), ("」来的", TEXT)], SERIF, 84, 4)], (CX, 160), "slam", "dissolve", 1.2),
    cue(T(48, 1.5), T(49, 3.6), [L("没有人天生应得惩罚，也没有人天生应得奖赏", SANS_L, 38, 6)], (CX, 262), "fade", "fade"),
    cue(T(50), T(52), [L("那我们，还能改变吗？", SERIF, 84, 6)], (CX, 540), "fade", "cut"),
    # ---- final
    cue(T(52), T(53, 3.6), [L([("你无法「", TEXT), ("选择", TEXT_BLUE), ("」改变——", TEXT)], SERIF, 96, 4)], (CX, 470), "slam", "dissolve", 1.4),
    cue(T(53), T(53, 3.6), [L([("但你可以「", TEXT), ("被", TEXT_EMBER), ("」改变", TEXT)], SERIF, 96, 4)], (CX, 600), "slam", "dissolve", 1.4),
    cue(T(54), T(55, 3.6), [L("一本书、一次相遇、一段经历", SERIF, 72, 4)], (CX, 480), "fade", "dissolve"),
    cue(T(55), T(55, 3.6), [L([("都在重写你的神经元——", TEXT), ("包括此刻", TEXT_EMBER)], SANS_L, 48, 6)], (CX, 590), "fade", "dissolve"),
    cue(T(56), T(57, 3.6), [L("看清因果的人，", SERIF, 84, 4)], (1300, 460), "slam", "dissolve", 1.2),
    cue(T(57), T(57, 3.6), [L([("没有理由去", TEXT), ("恨", TEXT_EMBER), ("。", TEXT)], SERIF, 84, 4)], (1300, 580), "slam", "dissolve", 1.2),
    cue(T(58), T(59, 3.7), [L("我们没有自由意志——", SERIF, 80, 4)], (1300, 460), "fade", "dissolve"),
    cue(T(58, 2), T(59, 3.7), [L([("却可以拥有更多", TEXT), ("慈悲", TEXT_EMBER)], SERIF, 80, 4)], (1300, 580), "fade", "dissolve"),
    # ---- outro
    cue(T(60), T(63, 2), [L("DETERMINED", LAT_B, 150, 14)], (CX, 820), "assemble", "dissolve", 1.3),
    cue(T(60, 2), T(63, 2), [L("ROBERT SAPOLSKY · 2023", LAT_L, 30, 12)], (CX, 920), "flicker", "fade"),
    cue(T(61), T(63, 2), [L("我们，是一切无法掌控之物的总和；也因此，没有人应当被憎恨。", SANS_L, 32, 4)], (CX, 980), "fade", "fade"),
]

# ---------------------------------------------------------------- particle formations
# (start time, formation, morph duration, kind). kind: flow | burst | implode
MORPHS = [
    (0.0, "dust", 0.1, "flow"),
    (T(3, 2), "point", 1.0, "implode"),
    (T(4), "head", 1.4, "burst"),
    (T(8), "head_lit", 1.0, "flow"),
    (T(9), "network", 1.6, "burst"),
    (T(12), "neuron", 0.9, "burst"),
    (T(13), "waves", 0.9, "burst"),
    (T(14), "molecule", 0.9, "burst"),
    (T(15), "dendrite", 0.9, "burst"),
    (T(16), "brain", 0.9, "burst"),
    (T(17), "rings", 0.9, "burst"),
    (T(18), "embryo", 0.9, "burst"),
    (T(19), "dna", 0.9, "burst"),
    (T(20), "globe", 0.9, "burst"),
    (T(21), "tree", 0.9, "burst"),
    (T(22), "tunnel", 1.2, "flow"),
    (T(23), "point", 1.4, "implode"),
    (T(24), "network", 1.3, "burst"),
    (T(26), "lorenz", 1.1, "burst"),
    (T(28), "swarm", 1.1, "burst"),
    (T(30), "quantum", 1.0, "burst"),
    (T(32), "puppet", 1.5, "flow"),
    (T(36), "dust_calm", 1.6, "flow"),
    (T(38), "fire", 1.4, "flow"),
    (T(40), "brain_blue", 1.6, "flow"),
    (T(42), "head_soft", 1.6, "flow"),
    (T(44), "stream", 1.0, "burst"),
    (T(46), "contain", 1.0, "burst"),
    (T(48), "pyramid", 1.0, "burst"),
    (T(49), "plain", 1.4, "flow"),
    (T(50), "vortex", 1.6, "flow"),
    (T(52), "synapse", 1.3, "burst"),
    (T(56), "head_warm", 1.4, "burst"),
    (T(60), "head_title", 1.4, "burst"),
    (T(62, 2), "dust_out", 2.5, "flow"),
]
