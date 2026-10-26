"""Single source of truth for the video: beat grid, script, cues.

Both music.py and render.py import this module, so every impact, whoosh,
text reveal and particle landing sits on exactly the same timestamp in the
audio and the picture.
"""

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s
BAR = 4 * BEAT             # 2.0 s
STEP = BEAT / 4            # 16th note
FPS = 30
W, H = 1920, 1080
DURATION = 138.0


def bar(b, beat=0.0):
    """Start time of bar `b` (1-indexed) plus `beat` beats."""
    return (b - 1) * BAR + beat * BEAT


# ---------------------------------------------------------------- palette
# Loyel gradient blue, 10 steps. No other blue is used anywhere.
LOYEL = {
    10: "#F4F7FB", 20: "#E8EEF6", 30: "#CCDBEB", 40: "#9FBDDA", 50: "#6C9AC4",
    60: "#497DAE", 70: "#376392", 80: "#2E5076", 90: "#2B4868", 100: "#263B54",
}
WHITE = "#FFFFFF"


def rgb(hex_):
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


# ---------------------------------------------------------------- sections
SECTIONS = [
    ("intro",   0.0,   8.0),
    ("title",   8.0,  16.0),
    ("premise", 16.0, 32.0),
    ("build1",  32.0, 40.0),
    ("wheel",   40.0, 48.0),
    ("areas",   48.0, 104.0),
    ("break",  104.0, 112.0),
    ("build2", 112.0, 120.0),
    ("finale", 120.0, DURATION),
]

AREA_T0 = [48.0 + 8.0 * k for k in range(7)]
POINT_OFFSETS = (2.0, 3.5, 5.0)
WHEEL_IGNITE = [40.5 + 1.0 * k for k in range(7)]   # on the claps (beats 2 & 4)
COUNTDOWN = [118.0, 118.5, 119.0]
FINAL_STABS = [132.0, 132.75, 133.5]
FINAL_HIT = 134.0

# ---------------------------------------------------------------- areas
# The seven areas of the "Dealing with Feeling Wheel" (book, pp. 270-276).
AREAS = [
    dict(short="情绪信念", en="THE HIDDEN DRIVER · YOUR BELIEFS ABOUT EMOTION",
         title="信念：隐形的驱动力", icon="heart",
         points=["给自己和他人“去感受”的许可",
                 "所有情绪都有意义，包括不愉快的",
                 "以好奇代替评判，不给情绪贴好坏标签"]),
    dict(short="精准标记", en="FROM CHAOS TO CLARITY · LABELING EMOTIONS",
         title="标记：从混乱到清晰", icon="grid",
         points=["回应之前，先停下来识别感受",
                 "区分相近情绪：愤怒与挫败、快乐与满足",
                 "情绪词汇越精确，调节越有效"]),
    dict(short="安顿身心", en="QUIETING YOUR MIND AND BODY",
         title="身心：呼吸与正念", icon="breath",
         points=["深呼吸是“主策略”：激活副交感神经",
                 "从“战或逃”切换到“休息与消化”",
                 "但呼吸只是开始——必要，但不充分"]),
    dict(short="重塑思维", en="REDIRECTING YOUR THOUGHTS",
         title="思维：换个框架看", icon="frame",
         points=["积极自我对话：像朋友那样鼓励自己",
                 "心理距离：用名字或第二、三人称称呼自己",
                 "重新评估：用“重构”代替“责怪”"]),
    dict(short="关系联结", en="EMOTIONAL STRENGTH THROUGH RELATIONSHIPS",
         title="关系：彼此的力量", icon="orbit",
         points=["共同调节：帮助他人，也在调节自己",
                 "别独自担忧：向信任的人寻求支持",
                 "压力时刻，一起回忆共同的美好经历"]),
    dict(short="调节预算", en="OPTIMIZING YOUR EMOTION REGULATION BUDGET",
         title="预算：身体是底层能源", icon="bars",
         points=["睡眠：每晚 7–8 小时的优质睡眠",
                 "运动：每天 20–30 分钟，选你喜欢的",
                 "饮食：天然食物、充足蛋白与饮水"]),
    dict(short="最好的自己", en="BECOMING THE BEST VERSION OF YOURSELF",
         title="成为最好的自己", icon="stairs",
         points=["让行动与价值观保持一致",
                 "失败时复盘而非自责，善待自己",
                 "练习，使之恒久 · Practice makes permanent"]),
]

# ---------------------------------------------------------------- text
# font keys: sans4/sans7/sans9 (Noto Sans SC), serif9 (Noto Serif SC 900),
# cinzel7/cinzel9, mont5/mont7.  anchor: "mm" centred, "lm" left-middle.
# anim: rise | slam | fade | pop | slide


def T(text, t_in, t_out, x=W / 2, y=H / 2, font="sans7", size=48,
      color=LOYEL[10], anchor="mm", anim="rise", spacing=0, glow=0.5,
      sweep=None, exit="fade"):
    return dict(text=text, t_in=t_in, t_out=t_out, x=x, y=y, font=font,
                size=size, color=color, anchor=anchor, anim=anim,
                spacing=spacing, glow=glow, sweep=sweep, exit=exit)


TEXTS = []
add = TEXTS.append

# intro
add(T("你如何对待自己的情绪，", 1.0, 3.75, y=490, size=54))
add(T("决定了你将过怎样的人生。", 2.5, 3.75, y=575, size=54, color=WHITE))
add(T("愤怒、焦虑、失落、恐惧……", 4.5, 7.6, y=745, size=44, color=LOYEL[40]))
add(T("它们从来不是你的敌人。", 5.5, 7.6, y=830, size=60, color=WHITE, font="sans9",
      glow=0.8))

# title
add(T("DEALING WITH FEELING", 9.2, 15.5, y=440, font="cinzel9", size=112,
      color=LOYEL[10], anim="fade", glow=1.0, sweep=9.3, exit="fly"))
add(T("用情绪，创造你想要的人生", 10.0, 15.5, y=585, size=54, color=WHITE,
      exit="fly"))
add(T("USE YOUR EMOTIONS TO CREATE THE LIFE YOU WANT", 11.0, 15.5, y=655,
      font="mont5", size=24, spacing=6, color=LOYEL[40], exit="fly"))
add(T("MARC BRACKETT", 12.0, 15.5, y=790, font="mont7", size=36, spacing=14,
      color=WHITE, sweep=12.1, exit="fly"))
add(T("耶鲁大学情绪智力中心 创始主任 ·《Permission to Feel》作者", 12.5, 15.5,
      y=845, font="sans4", size=28, color=LOYEL[40], exit="fly"))

# premise — Introduction: "A Life-Changing Skill That Must Be Learned"
add(T("INTRODUCTION · 一项必须后天习得的技能", 16.0, 31.6, y=150, font="sans4",
      size=26, spacing=4, color=LOYEL[50], anim="fade", glow=0.2))
PREMISE = [
    (16.0, "100%", "情绪调节，是 100% 后天习得的技能",
     "我们从父母、老师和同伴身上，学会了如何应对情绪"),
    (20.0, "1/3", "只有约三分之一的人，童年时被允许“去感受”",
     "更多人学会的，是压抑与回避"),
    (24.0, "10%", "只有约 10% 的人，受过扎实的情绪调节教育",
     "好消息：学来的习惯，就能被重新学习"),
]
for t0, _num, cap, sub in PREMISE:
    add(T(cap, t0 + 0.5, t0 + 3.6, y=735, size=50, color=WHITE, font="sans9",
          exit="fly"))
    add(T(sub, t0 + 1.5, t0 + 3.6, y=810, size=32, color=LOYEL[40], exit="fly"))
add(T("没有坏情绪", 28.0, 31.6, y=490, font="serif9", size=120, color=WHITE,
      anim="slam", glow=1.0, sweep=28.2, exit="fly"))
add(T("只有尚未被理解、尚未被引导的情绪", 29.0, 31.6, y=640, size=42,
      color=LOYEL[30], exit="fly"))

# build 1 — Part Two: Definitions
add(T("DEFINITIONS · 定义", 32.0, 38.9, y=150, font="sans4", size=26, spacing=6,
      color=LOYEL[50], anim="fade", glow=0.2))
add(T("情绪调节", 32.0, 35.6, y=440, font="serif9", size=110, color=WHITE,
      anim="slam", glow=0.9, exit="fly"))
add(T("EMOTION REGULATION", 32.25, 35.6, y=540, font="mont7", size=28, spacing=12,
      color=LOYEL[40], exit="fly"))
add(T("管理情绪，以实现你的目标", 33.0, 35.6, y=625, size=44, color=LOYEL[10],
      exit="fly"))
add(T("共同调节", 36.0, 38.9, y=440, font="serif9", size=110, color=WHITE,
      anim="slam", glow=0.9, exit="fly"))
add(T("CO-REGULATION", 36.25, 38.9, y=540, font="mont7", size=28, spacing=12,
      color=LOYEL[40], exit="fly"))
add(T("在关系中，我们也在调节彼此的情绪", 37.0, 38.9, y=625, size=44,
      color=LOYEL[10], exit="fly"))
add(T("七 大 领 域", 39.0, 39.5, y=540, font="serif9", size=96, color=WHITE,
      anim="slam", glow=1.2, exit="cut"))

# wheel
add(T("七大调节领域", 40.0, 47.6, y=515, font="sans9", size=58, color=WHITE,
      anim="slam", glow=0.8, exit="fly"))
add(T("THE DEALING WITH FEELING WHEEL", 40.25, 47.6, y=580, font="mont5", size=20,
      spacing=5, color=LOYEL[40], exit="fly"))

WHEEL_C = (W / 2, H / 2)
WHEEL_R = 300
WHEEL_LABEL_R = 425


def wheel_angle(k):
    """Centre angle (radians, screen coords, 0 = up, clockwise) of segment k."""
    import math
    return 2 * math.pi * k / 7.0


def wheel_label_pos(k, r=WHEEL_LABEL_R, c=WHEEL_C):
    import math
    a = wheel_angle(k)
    return c[0] + r * math.sin(a), c[1] - r * math.cos(a)


for k, a in enumerate(AREAS):
    x, y = wheel_label_pos(k)
    add(T(f"{k + 1:02d}  {a['short']}", WHEEL_IGNITE[k], 47.6, x=x, y=y,
          font="sans7", size=32, color=WHITE, anim="pop", glow=0.7, exit="fly"))

# seven areas
ICON_C = (520, 560)
TX = 900
for k, (t0, a) in enumerate(zip(AREA_T0, AREAS)):
    end = t0 + 7.6
    add(T(f"{k + 1:02d} / 07", t0, end, x=TX, y=318, font="mont7", size=30,
          spacing=6, color=LOYEL[50], anchor="lm", anim="slide", glow=0.4,
          exit="fly"))
    add(T(a["en"], t0 + 0.1, end, x=TX, y=362, font="mont5", size=20, spacing=3,
          color=LOYEL[40], anchor="lm", anim="slide", glow=0.2, exit="fly"))
    add(T(a["title"], t0, end, x=TX, y=445, font="sans9", size=76, color=WHITE,
          anchor="lm", anim="slam", glow=0.9, sweep=t0 + 0.15, exit="fly"))
    for j, (off, p) in enumerate(zip(POINT_OFFSETS, a["points"])):
        add(T(p, t0 + off, end, x=TX + 34, y=560 + 78 * j, font="sans4", size=37,
              color=LOYEL[20], anchor="lm", anim="slide", glow=0.35, exit="fly"))

# labels under the three "budget" bars
for j, lab in enumerate(("睡眠", "运动", "饮食")):
    add(T(lab, AREA_T0[5] + POINT_OFFSETS[j], AREA_T0[5] + 7.6,
          x=ICON_C[0] + (j - 1) * 150, y=ICON_C[1] + 250, font="sans7", size=30,
          color=LOYEL[30], anim="pop", glow=0.5, exit="fly"))

# breakdown
add(T("不是控制情绪，而是管理它", 104.0, 111.6, y=455, size=56, color=WHITE,
      anim="fade", glow=0.6))
add(T("不是消除情绪，而是接纳并善用它", 106.0, 111.6, y=550, size=56,
      color=WHITE, anim="fade", glow=0.6))
add(T("每一种情绪，都携带着信息", 108.0, 111.6, y=670, size=40,
      color=LOYEL[40], anim="fade", glow=0.4))

# build 2 — Part Five: Practice Makes Permanent
add(T("从七个领域中，选一两个开始练习", 112.0, 115.6, y=455, size=52,
      color=WHITE, anim="rise", glow=0.6, exit="fly"))
add(T("PRACTICE MAKES PERMANENT", 114.0, 115.6, y=575, font="cinzel9", size=72,
      color=LOYEL[10], anim="slam", glow=1.0, sweep=114.1, exit="fly"))
add(T("练习，使之恒久", 114.5, 115.6, y=660, size=38, color=LOYEL[40],
      exit="fly"))
for t, n in zip(COUNTDOWN, ("3", "2", "1")):
    add(T(n, t, t + 0.46, y=545, font="mont7", size=230, color=WHITE,
          anim="slam", glow=1.4, exit="cut"))

# finale
add(T("DEALING WITH FEELING", 120.7, 127.6, y=440, font="cinzel9", size=112,
      color=LOYEL[10], anim="fade", glow=1.0, sweep=120.8, exit="fly"))
add(T("让情绪为你所用，而不是与你为敌", 121.0, 127.6, y=590, size=58,
      color=WHITE, font="sans9", glow=0.8, exit="fly"))
add(T("USE YOUR EMOTIONS TO CREATE THE LIFE YOU WANT", 124.0, 127.6, y=665,
      font="mont5", size=24, spacing=6, color=LOYEL[40], exit="fly"))
add(T("DEALING WITH", 128.2, 137.2, y=515, font="cinzel9", size=50,
      color=LOYEL[10], anim="fade", glow=0.9, sweep=128.3))
add(T("FEELING", 128.2, 137.2, y=575, font="cinzel9", size=64,
      color=WHITE, anim="fade", glow=1.0, sweep=128.4))
for k, a in enumerate(AREAS):
    x, y = wheel_label_pos(k, r=WHEEL_LABEL_R + 10)
    add(T(f"{k + 1:02d}  {a['short']}", 128.5 + 0.08 * k, 133.9, x=x, y=y,
          font="sans7", size=30, color=WHITE, anim="pop", glow=0.6, exit="fly"))
add(T("MARC BRACKETT · DEALING WITH FEELING · 2025", 129.0, 137.2, y=1000,
      font="mont5", size=22, spacing=6, color=LOYEL[40], anim="fade", glow=0.3))
add(T("用情绪，创造你想要的人生", 134.0, 137.2, y=680, size=46, color=WHITE,
      anim="rise", glow=0.7))

# ---------------------------------------------------------------- particles
# (t_start, t_land, formation, transition)
FORMATIONS = [
    (0.0, 0.0, "nebula", "cut"),
    (4.0, 7.8, "core", "spiral"),
    (8.0, 9.2, "title", "explode"),
    (15.5, 16.0, "n100", "converge"),
    (19.5, 20.0, "n13", "converge"),
    (23.5, 24.0, "n10", "converge"),
    (27.5, 28.0, "ring", "converge"),
    (31.5, 32.0, "sphere", "converge"),
    (39.0, 39.5, "core", "spiral"),
    (40.0, 40.7, "wheel", "explode"),
]
for k, (t0, a) in enumerate(zip(AREA_T0, AREAS)):
    if a["icon"] == "grid":
        FORMATIONS.append((t0 - 0.5, t0, "chaos", "converge"))
        FORMATIONS.append((t0 + 1.75, t0 + 2.0, "grid", "snap"))
    else:
        FORMATIONS.append((t0 - 0.5, t0, a["icon"], "converge"))
FORMATIONS += [
    (103.6, 105.5, "galaxy", "converge"),
    (115.6, 116.0, "wheelspin", "converge"),
    (119.1, 119.5, "core", "spiral"),
    (120.0, 120.7, "title", "explode"),
    (127.6, 128.0, "wheelfull", "converge"),
    (134.0, 137.5, "dissolve", "cut"),
]

# ---------------------------------------------------------------- cues
# impacts: (t, size) size in {"huge","big","med","small","soft"}
IMPACTS = [(8.0, "huge"), (16.0, "med"), (20.0, "med"), (24.0, "med"),
           (28.0, "big"), (32.0, "med"), (36.0, "med"), (39.0, "small"),
           (40.0, "huge")]
IMPACTS += [(t, "big") for t in AREA_T0]
IMPACTS += [(104.0, "soft"), (112.0, "med"), (114.0, "small")]
IMPACTS += [(t, "med") for t in COUNTDOWN]
IMPACTS += [(120.0, "huge"), (128.0, "big")]
IMPACTS += [(t, "big") for t in FINAL_STABS]
IMPACTS += [(FINAL_HIT, "huge")]

# whooshes leading into each converging formation, and on text fly-outs
WHOOSHES = []   # (t_start, t_end)
for ts, tl, name, style in FORMATIONS:
    if style == "converge" and tl - ts <= 0.6:
        WHOOSHES.append((ts - 0.05, tl))
WHOOSHES.append((3.6, 4.4))

# small accents for text reveals
TICKS = [t0 + off for t0 in AREA_T0 for off in POINT_OFFSETS]
TICKS += [t0 + 0.5 for t0, *_ in PREMISE] + [t0 + 1.5 for t0, *_ in PREMISE]
TICKS += [33.0, 37.0, 29.0, 121.0, 124.0]
SHIMMERS = [1.0, 2.5, 4.5, 5.5, 9.2, 10.0, 12.0, 106.0, 108.0, 114.5, 128.2,
            134.0]
STABS = list(WHEEL_IGNITE)
RISERS = [(4.0, 7.85), (32.0, 39.5), (112.0, 119.45)]
REVERSE_CYMBALS = [(6.4, 8.0), (38.0, 40.0), (118.3, 120.0)]

# gaps of silence right before the big drops
SILENCE = [(7.86, 8.0), (39.5, 40.0), (119.5, 120.0)]


# ---------------------------------------------------------------- drums
def _steps(b, steps, sub=16):
    return [bar(b) + s * BAR / sub for s in steps]


def drum_pattern():
    """Returns dict of instrument -> list of (time, velocity)."""
    d = {k: [] for k in ("kick", "snare", "clap", "hat", "ohat", "taiko",
                         "tom", "heart")}

    def put(k, times, v=1.0):
        d[k].extend((t, v) for t in times)

    # intro: heartbeat, 60 bpm
    for b in range(1, 5):
        for beat in (0, 2):
            t = bar(b, beat)
            put("heart", [t], 0.9 if b < 4 else 1.0)
    # title: taiko half time
    for b in range(5, 9):
        put("taiko", _steps(b, [0, 8]), 1.0)
        put("kick", _steps(b, [0]), 0.9)
        if b in (6, 8):
            put("taiko", _steps(b, [14]), 0.6)
            put("tom", _steps(b, [12, 13, 15]), 0.7)
    # premise groove
    for b in range(9, 17):
        put("kick", _steps(b, [0, 8] + ([10] if b % 2 == 0 else [])), 0.95)
        put("snare", _steps(b, [4, 12]), 0.85)
        put("hat", _steps(b, range(0, 16, 2)), 0.5)
        if b >= 13:
            put("hat", _steps(b, range(1, 16, 2)), 0.25)
        if b % 4 == 0:
            put("taiko", _steps(b, [12, 14]), 0.8)
    # build 1 / build 2
    for b0 in (17, 57):
        put("kick", _steps(b0, [0, 4, 8, 12]), 0.9)
        put("kick", _steps(b0 + 1, [0, 4, 8, 12]), 0.95)
        put("kick", _steps(b0 + 2, range(0, 16, 2)), 0.95)
        put("kick", _steps(b0 + 3, range(0, 12)), 1.0)
        roll = (_steps(b0, [0, 4, 8, 12]) + _steps(b0 + 1, range(0, 16, 2)) +
                _steps(b0 + 2, range(16)))
        roll32 = [bar(b0 + 3) + i * BAR / 32 for i in range(24)]
        allr = roll + roll32
        for i, t in enumerate(allr):
            put("snare", [t], 0.35 + 0.6 * i / len(allr))
        if b0 == 57:
            put("taiko", _steps(57, [0, 8]) + _steps(58, [0, 8]) +
                _steps(59, [0, 4, 8, 12]), 1.0)
    # drop sections
    drop_bars = list(range(21, 53)) + list(range(61, 67))
    half_time = set(range(41, 45))      # area 5, relationships: half time
    for b in drop_bars:
        if b in half_time:
            put("kick", _steps(b, [0, 10]), 1.0)
            put("snare", _steps(b, [8]), 1.0)
            put("taiko", _steps(b, [0, 4, 12]), 0.8)
            put("hat", _steps(b, range(0, 16, 2)), 0.45)
        else:
            put("kick", _steps(b, [0, 4, 8, 12]), 1.0)
            put("clap", _steps(b, [4, 12]), 0.95)
            put("hat", _steps(b, range(16)), 0.32)
            put("ohat", _steps(b, [2, 6, 10, 14]), 0.45)
        if b % 4 == 0 and b not in (52, 66):
            put("snare", _steps(b, range(8, 16)), 0.75)
            put("tom", _steps(b, [12, 13, 14, 15]), 0.85)
    # final bar of areas into the breakdown
    put("tom", _steps(52, [8, 10, 12, 14]), 0.9)
    # breakdown heartbeat
    for b in range(53, 57):
        for beat in (0, 2):
            put("heart", [bar(b, beat)], 0.8)
    # finale tail: bar 66 fill, bar 67 stabs, final hit
    put("snare", _steps(66, range(8, 16)), 0.9)
    put("tom", _steps(66, [8, 10, 12, 13, 14, 15]), 1.0)
    for t in FINAL_STABS + [FINAL_HIT]:
        put("kick", [t], 1.0)
        put("taiko", [t], 1.0)
    for t in COUNTDOWN:
        put("taiko", [t], 1.0)
        put("kick", [t], 1.0)

    # never anything in the pre-drop silences
    for k in d:
        d[k] = sorted((t, v) for t, v in d[k]
                      if not any(a <= t < b for a, b in SILENCE))
    return d


DRUMS = drum_pattern()
KICKS = [t for t, _ in DRUMS["kick"]]

# chord per bar (D minor; i-VI-III-VII)
PROG = ["Dm", "Bb", "F", "C"]


def chord_at(b):
    if 17 <= b <= 20 or 57 <= b <= 60:
        return ["Bb", "Bb", "C", "C"][(b - 17) % 4 if b <= 20 else (b - 57)]
    if b >= 68:
        return "D"
    if b == 67:
        return "Dm"
    return PROG[(b - 1) % 4]


def energy(t):
    """Overall visual energy 0..1 used for light rays / haze / dust."""
    keys = [(0, 0.12), (7.8, 0.45), (8.0, 0.75), (16, 0.6), (31.9, 0.65),
            (32, 0.55), (39.4, 1.0), (39.5, 0.1), (40, 1.0), (103.5, 0.95),
            (104, 0.3), (111.9, 0.35), (112, 0.5), (119.4, 1.0), (119.5, 0.08),
            (120, 1.0), (134, 1.0), (138, 0.0)]
    for (t0, e0), (t1, e1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = (t - t0) / max(t1 - t0, 1e-6)
            return e0 + (e1 - e0) * u
    return keys[-1][1]
