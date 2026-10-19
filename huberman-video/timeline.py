"""Shared timeline: the single source of truth for music events and visual cues.

Both music.py and render.py import this module, so every drum hit, impact,
breath and text slam lands on the same sample / frame.
"""

BPM = 150
BEAT = 60.0 / BPM          # 0.4 s
BAR = 4 * BEAT             # 1.6 s
FPS = 30
W, H = 1920, 1080
TOTAL_BARS = 64
DURATION = TOTAL_BARS * BAR + 4.0   # 106.4 s, last 4 s is the ring-out


def T(bar, beat=0.0):
    return bar * BAR + beat * BEAT


# name, first bar, length in bars
SECTIONS = [
    ("intro", 0, 8),
    ("title", 8, 4),
    ("light", 12, 8),
    ("breath", 20, 8),
    ("dopamine", 28, 8),
    ("focus", 36, 8),
    ("courage", 44, 8),
    ("finale", 52, 8),
    ("outro", 60, 4),
]
SEC = {name: (b0, n) for name, b0, n in SECTIONS}


def sec_start(name):
    return T(SEC[name][0])


def sec_end(name):
    b0, n = SEC[name]
    return T(b0 + n)


# --------------------------------------------------------------------------
# Harmony: D minor, one chord per bar
# --------------------------------------------------------------------------
CHORD_NOTES = {
    "Dm": [50, 53, 57, 62],
    "Bb": [50, 53, 58, 62],
    "F": [48, 53, 57, 60],
    "C": [48, 52, 55, 60],
    "A": [49, 52, 57, 61],
}
BASS_NOTE = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "A": 33}

CHORDS = (
    ["Dm"] * 4 + ["Bb"] * 2 + ["C"] * 2                       # intro
    + ["Dm", "Bb", "F", "C"]                                   # title
    + ["Dm", "Bb", "F", "C"] * 2                               # light
    + ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"]             # breath
    + ["Dm", "Bb", "F", "C"] * 2                               # dopamine
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "C", "A"]             # focus
    + ["Dm", "Bb", "F", "C"] * 2                               # courage
    + ["Dm", "Bb", "F", "C", "Dm", "Bb", "C", "A"]             # finale
    + ["Dm"] * 4                                               # outro
)
assert len(CHORDS) == TOTAL_BARS

# heroic 8-bar theme: (beat offset, length in beats, midi)
THEME = [
    (0, 1.5, 74), (1.5, 0.5, 76), (2, 1, 77), (3, 1, 81),
    (4, 2, 77), (6, 1, 76), (7, 1, 74),
    (8, 1.5, 72), (9.5, 0.5, 77), (10, 2, 81),
    (12, 2, 79), (14, 1, 76), (15, 1, 72),
    (16, 1.5, 74), (17.5, 0.5, 76), (18, 1, 77), (19, 1, 81),
    (20, 2, 86), (22, 1, 84), (23, 1, 82),
    (24, 2, 81), (26, 1, 77), (27, 1, 84),
    (28, 2, 79), (30, 2, 76),
]

# --------------------------------------------------------------------------
# Events
# --------------------------------------------------------------------------
KICKS, SNARES, CLAPS, HATS, TAIKOS = [], [], [], [], []
IMPACTS, STABS, WHOOSHES, RISERS = [], [], [], []
HEARTBEATS, ZAPS, BREATHS, BELLS = [], [], [], []
# silent gaps right before the big drops: (t0, t1)
GATES = [(T(7, 3.5), T(8)), (T(43, 3), T(44)), (T(59, 3.5), T(60))]


def _bars(name):
    b0, n = SEC[name]
    return range(b0, b0 + n)


# --- intro: heartbeat in the dark, then accelerating pulses + riser -------
for b in range(0, 6):
    for beat in (0, 2):
        HEARTBEATS.append((T(b, beat), 0.55 + 0.08 * b))
for beat in range(4):
    KICKS.append((T(6, beat), 0.55))
for i in range(7):
    KICKS.append((T(7, i * 0.5), 0.6 + 0.05 * i))
RISERS.append((T(5), T(7, 3.5), 1.0))

# --- title: taiko hits under the name reveal -----------------------------
for b, beat, v in [(8, 0, 1.0), (9, 0, 0.9), (9, 2, 0.8), (10, 0, 0.9),
                   (10, 1.5, 0.7), (10, 2, 0.8), (11, 0, 0.9),
                   (11, 2, 0.7), (11, 2.5, 0.75), (11, 3, 0.85), (11, 3.5, 0.95)]:
    TAIKOS.append((T(b, beat), v, 0))
    KICKS.append((T(b, beat), 0.5 * v))


def halftime(bars, last_fill=True):
    for b in bars:
        KICKS.append((T(b, 0), 1.0))
        KICKS.append((T(b, 1.5), 0.8))
        SNARES.append((T(b, 2), 1.0))
        CLAPS.append((T(b, 2), 0.8))
        for e in range(8):
            HATS.append((T(b, e * 0.5), 0.35 if e % 2 else 0.55, e == 7))
    if last_fill:
        b = bars[-1]
        for s in range(4):
            SNARES.append((T(b, 3 + s * 0.25), 0.5 + 0.15 * s))


def drive(bars, crash_every=4):
    for i, b in enumerate(bars):
        for beat, v in [(0, 1.0), (1.5, 0.75), (2, 0.95), (3.5, 0.7)]:
            KICKS.append((T(b, beat), v))
        for beat in (1, 3):
            SNARES.append((T(b, beat), 1.0))
            CLAPS.append((T(b, beat), 0.9))
        for e in range(8):
            HATS.append((T(b, e * 0.5), 0.6 if e % 2 else 0.4, e % 2 == 1))
        if i % crash_every == crash_every - 1:
            for s in range(8):
                TAIKOS.append((T(b, 2 + s * 0.25), 0.55 + 0.05 * s, 1))


# --- light ----------------------------------------------------------------
halftime(list(_bars("light")))

# --- breath: breakdown, soft pulse + breathing ---------------------------
for b in range(20, 27):
    KICKS.append((T(b, 0), 0.45))
BREATH_CYCLES = [T(21), T(24)]       # each cycle = 3 bars
for c0 in BREATH_CYCLES:
    BREATHS.append((c0, "in1", 3 * BEAT))
    BREATHS.append((c0 + 3 * BEAT, "in2", BEAT))
    BREATHS.append((c0 + 4 * BEAT, "out", 8 * BEAT))
for beat in range(4):
    KICKS.append((T(27, beat), 0.7))
for s in range(8):
    SNARES.append((T(27, s * 0.5), 0.35 + 0.06 * s))
for s in range(4):
    SNARES.append((T(27, 2 + s * 0.25), 0.6 + 0.08 * s))
RISERS.append((T(27), T(28), 0.7))

# --- dopamine: spikes, then the cold-exposure plateau --------------------
halftime(list(_bars("dopamine")))
DOPA_PEAKS = [T(30, 0), T(30, 2), T(31, 0), T(31, 2)]
for tp in DOPA_PEAKS:
    ZAPS.append((tp, 1.0))
RISERS.append((T(32), T(34), 0.45))

# --- focus: four-on-the-floor, arps, then the build ----------------------
for b in range(36, 42):
    for beat in range(4):
        KICKS.append((T(b, beat), 0.62 + 0.04 * (b - 36)))
    for beat in (1, 3):
        SNARES.append((T(b, beat), 0.75))
    for s in range(16):
        HATS.append((T(b, s * 0.25), 0.22 + (0.18 if s % 4 == 2 else 0), False))
for beat in range(4):
    KICKS.append((T(42, beat), 0.95))
for s in range(8):
    SNARES.append((T(42, s * 0.5), 0.45 + 0.04 * s))
for s in range(8):
    SNARES.append((T(43, s * 0.25), 0.6 + 0.04 * s))
for s in range(4):
    SNARES.append((T(43, 2 + s * 0.125), 0.9 + 0.03 * s))
for beat in (0, 1, 2):
    KICKS.append((T(43, beat), 1.0))
RISERS.append((T(42), T(43, 3), 1.2))

# --- courage + finale: full drive -----------------------------------------
drive(list(_bars("courage")))
drive(list(_bars("finale")))
FINALE_SLAMS = [T(52 + i) for i in range(6)]
for tp in FINALE_SLAMS[1:]:
    TAIKOS.append((tp, 1.0, 0))
RISERS.append((T(59), T(59, 3.5), 0.9))

# --- impacts (section downbeats) ------------------------------------------
IMPACTS += [
    (sec_start("title"), 1.15),
    (sec_start("light"), 0.85),
    (sec_start("breath"), 0.55),
    (sec_start("dopamine"), 0.9),
    (sec_start("focus"), 0.9),
    (sec_start("courage"), 1.35),
    (sec_start("finale"), 1.0),
    (sec_start("outro"), 1.4),
]
IMPACTS += [(tp, 0.6) for tp in FINALE_SLAMS[1:]]
IMPACTS.sort()

# --- text-hit stabs: every line of text lands on a downbeat --------------
for name in ("light", "dopamine", "focus", "courage"):
    b0, _ = SEC[name]
    for k in (2, 4, 6):
        STABS.append((T(b0 + k), "brass"))
for k in (2, 4, 6):
    BELLS.append((T(20 + k), 0.8))
BELLS += [(T(2), 0.7), (T(5), 0.8)]
STABS += [(T(9), "soft"), (T(10), "soft"), (T(58), "brass"), (T(59), "brass")]
STABS.sort()

# reverse swells that end exactly on every impact / stab
for tp, s in IMPACTS:
    WHOOSHES.append((tp, 1.2 if s > 0.8 else 0.7, min(1.0, s)))
for tp, _ in STABS:
    WHOOSHES.append((tp, 0.45, 0.45))
for tp, _ in BELLS:
    WHOOSHES.append((tp, 0.6, 0.25))
WHOOSHES.sort()

for lst in (KICKS, SNARES, CLAPS, HATS, TAIKOS, HEARTBEATS, ZAPS, BREATHS, BELLS):
    lst.sort(key=lambda e: e[0])

# --------------------------------------------------------------------------
# On-screen text.  Each line slams in so that it lands exactly on t_in.
# --------------------------------------------------------------------------
CHAPTERS = {
    "light": dict(
        num="01", cn="光", en="LIGHT", sub="第一把钥匙：用晨光校准生物钟",
        lines=[
            ("醒来 1 小时内，到户外看晨光 5–10 分钟（阴天更久）",
             "View morning sunlight within an hour of waking"),
            ("视网膜 ipRGC → 视交叉上核 SCN：校准全身时钟",
             "Melanopsin cells in the eye set your master circadian clock"),
            ("夜里调暗灯光：睡眠，是一切表现的地基",
             "Dim the lights at night. Sleep is the foundation"),
        ]),
    "breath": dict(
        num="02", cn="息", en="BREATH", sub="生理性叹息 · 最快的实时减压工具",
        lines=[
            ("鼻子连吸两次，再用嘴巴长长呼出",
             "Double inhale through the nose, long exhale through the mouth"),
            ("撑开塌陷的肺泡，高效排出二氧化碳",
             "Re-inflates collapsed alveoli and offloads CO₂"),
            ("每天 5 分钟循环叹息：情绪更好，生理唤醒更低",
             "Cyclic sighing, 5 min/day  ·  Balban et al., Cell Rep Med 2023"),
        ]),
    "dopamine": dict(
        num="03", cn="多巴胺", en="DOPAMINE", sub="动机的货币，而不只是快乐",
        lines=[
            ("高峰之后必有低谷：别透支你的基线",
             "Every peak is followed by a trough. Guard your baseline"),
            ("冷水暴露：多巴胺可持续升至基线约 2.5 倍",
             "Cold water immersion: ~2.5× sustained dopamine  ·  Šrámek et al., 2000"),
            ("把奖赏，绑定在“努力本身”",
             "Learn to attach the reward to the effort itself"),
        ]),
    "focus": dict(
        num="04", cn="专注", en="FOCUS", sub="打开神经可塑性的开关",
        lines=[
            ("目光聚焦之处，心智随之聚焦",
             "Where your eyes focus, your mind follows"),
            ("挫败与犯错，是可塑性窗口打开的信号",
             "Frustration and errors open the window for plasticity"),
            ("专注触发改变，睡眠与 NSDR 完成重塑",
             "Focus triggers the change. Sleep and NSDR consolidate it"),
        ]),
    "courage": dict(
        num="05", cn="勇气", en="COURAGE", sub="迎向摩擦，而不是绕开它",
        lines=[
            ("迎击还是僵住？丘脑中线有回路参与抉择",
             "A midline thalamic circuit shapes responses to threat  ·  Salay, Ishiko & Huberman, Nature 2018"),
            ("向前走、左右扫视的眼动，能让杏仁核降温",
             "Forward motion and lateral eye movements quiet the amygdala"),
            ("每一次穿越“边缘摩擦”，都在重塑你",
             "Every push through limbic friction rewires you"),
        ]),
}

FINALE_WORDS = [("晨光", "LIGHT"), ("呼吸", "BREATH"), ("多巴胺", "DOPAMINE"),
                ("专注", "FOCUS"), ("睡眠", "SLEEP"), ("勇气", "COURAGE")]
