"""Shared beat grid for the Dan Koe video.

music.py and render.py both read every cue from this file, so a drum hit in
the audio and the frame that reacts to it come from the same number.

Tempo is chosen so one beat is exactly 14 video frames at 30 fps
(128.57 BPM) and exactly 22,400 audio samples at 48 kHz: every cue lands on
a whole frame and a whole sample.
"""

FPS = 30
SR = 48000
W, H = 1920, 1080

BEAT_FRAMES = 14
BEAT = BEAT_FRAMES / FPS          # 0.4667 s
BPM = 60 / BEAT                   # 128.57
BAR = 4 * BEAT                    # 1.8667 s
END_BAR = 44                      # final hit
TOTAL_FRAMES = 2600               # 86.67 s, leaves a 4.5 s tail after the final hit
DURATION = TOTAL_FRAMES / FPS


def T(bar, beat=0.0):
    """Time in seconds of `beat` (0-based, may be fractional) inside `bar`."""
    return bar * BAR + beat * BEAT


def beats(bars, offsets):
    return [T(b, o) for b in bars for o in offsets]


# ---------------------------------------------------------------- harmony ---
# (bass root MIDI, chord voicing MIDI)
CHORDS = {
    "Dm": (38, [62, 65, 69]),
    "Bb": (34, [62, 65, 70]),
    "F":  (41, [60, 65, 69]),
    "C":  (36, [60, 64, 67]),
    "Gm": (43, [62, 67, 70]),
    "A":  (45, [61, 64, 69]),
    "D":  (38, [62, 66, 69]),
}

PROG = (["Dm"] * 4                                    # 0-3   intro
        + ["Dm", "Bb", "F", "C"]                      # 4-7   title
        + ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"]    # 8-15  act I
        + ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"]    # 16-23 drop 1
        + ["Dm", "Bb", "F", "C"]                      # 24-27 breakdown
        + ["Dm", "Bb", "Gm", "A"]                     # 28-31 build 2
        + ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]   # 32-39 drop 2
        + ["Dm", "Dm", "Bb", "A"]                     # 40-43 finale
        + ["D", "D", "D"])                            # 44-   final hit (Picardy D major)

SECTIONS = [
    ("intro", 0, 4), ("title", 4, 8), ("act1", 8, 16), ("drop1", 16, 24),
    ("break", 24, 28), ("build2", 28, 32), ("drop2", 32, 40),
    ("finale", 40, 44), ("tail", 44, 47),
]

# ------------------------------------------------------------- drum cues ---
KICKS = (beats(range(8, 12), [0, 2])
         + beats(range(12, 15), [0, 1, 2, 3]) + beats([15], [0, 1, 2])
         + beats(range(16, 24), [0, 1, 2, 3])
         + beats(range(28, 31), [0, 1, 2, 3]) + beats([31], [0, 1, 2])
         + beats(range(32, 40), [0, 1, 2, 3])
         + beats([40, 41], [0, 2.5]))

TAIKOS = (beats(range(4, 7), [0, 2.5]) + beats([7], [0, 2.5, 3, 3.5])
          + beats(range(32, 40), [0])
          + beats([40, 41], [0, 1.5, 2.5])
          + beats([42], [0]) + beats([43], [0, 1, 2]))

SNARES = (beats(range(12, 15), [1, 3])
          + [T(15, i / 4) for i in range(12)]                 # 16th roll into drop 1
          + beats(range(16, 24), [1, 3])
          + beats([28], [0, 1, 2, 3])
          + beats([29], [i / 2 for i in range(8)])
          + beats([30], [i / 4 for i in range(16)])
          + [T(31, i / 8) for i in range(24)]                 # 32nd roll, stops at beat 3
          + beats(range(32, 40), [1, 3])
          + beats([40, 41], [2]))

HATS_CLOSED = (beats(range(12, 15), [i / 2 for i in range(8)])
               + beats([15], [i / 2 for i in range(6)])
               + beats(range(16, 24), [i / 4 for i in range(16)])
               + beats(range(28, 31), [i / 2 for i in range(8)])
               + beats(range(32, 40), [i / 4 for i in range(16)]))
HATS_OPEN = beats(range(16, 24), [0.5, 1.5, 2.5, 3.5]) + beats(range(32, 40), [0.5, 1.5, 2.5, 3.5])

CRASHES = [T(4), T(16), T(18), T(20), T(22), T(24)] + [T(b) for b in range(32, 40)] + [T(40), T(44)]

# ------------------------------------------------------------- sfx cues ----
# (time, strength): low boom + noise burst + shockwave on screen
IMPACTS = [(T(0), 0.45), (T(4), 1.0), (T(16), 1.0), (T(24), 0.35),
           (T(32), 1.3), (T(40), 1.0), (T(44), 1.4)]
BRAAMS = [T(4), T(32), T(44)]
# whoosh peaks exactly on the card change
WHOOSHES = ([T(8), T(10), T(12), T(14), T(18), T(20), T(22), T(26), T(28), T(30), T(42)]
            + [T(b) for b in range(33, 40)])
RISERS = [(T(2), T(4)), (T(14), T(15, 3)), (T(28), T(31, 3)), (T(42), T(43, 3))]
# particles collapse to a single point during the last beat before a drop
IMPLODES = [(T(15, 3), T(16)), (T(31, 3), T(32)), (T(43, 3), T(44))]
# music fully muted for one beat before drop 2 and the final hit
SILENCES = [(T(31, 3), T(32)), (T(43, 3), T(44))]
HEARTS = beats([0], [2]) + beats([1, 2, 3], [0, 2]) + beats([42], [0, 2]) + beats([43], [0, 2])
STAB_HITS = [T(16), T(18), T(20), T(22)] + [T(b) for b in range(32, 40)] + [T(40)]

# ------------------------------------------------------------ scenes -------
# Each scene is a particle formation. `at` = when particles start moving,
# `conv` = seconds until they settle. Text scenes also fade in crisp type.
SCENES = [
    dict(at=-1.0, kind="cloud", conv=0.1, burst=0.0),
    dict(at=T(0, 2), kind="point", conv=T(3, 3) - T(0, 2), burst=0.0, ease="slow"),
    dict(at=T(4), kind="title", conv=1.15, burst=1.0,
         hero="DAN KOE",
         subs=[("一人企业 · 专注的艺术 · 重塑人生", "light", 44, 12, 652, 0.95),
               ("THE PHILOSOPHY OF FOCUS, CREATION & REINVENTION", "light", 24, 9, 718, 0.7)]),

    dict(at=T(8), kind="card", conv=0.8, burst=0.55, idx="01", act="ACT I  ·  重塑自我",
         zh="身份先于行动", en="IDENTITY BEFORE ACTION", line="真正的改变，从改变“我是谁”开始"),
    dict(at=T(10), kind="card", conv=0.8, burst=0.55, idx="02", act="ACT I  ·  重塑自我",
         zh="反愿景", en="ANTI-VISION", line="看清你绝不想过的人生——那是你的赌注"),
    dict(at=T(12), kind="card", conv=0.8, burst=0.55, idx="03", act="ACT I  ·  重塑自我",
         zh="愿景", en="VISION", line="写下你真正想要的人生——那是你的胜利条件"),
    dict(at=T(14), kind="card", conv=0.8, burst=0.55, idx="04", act="ACT I  ·  重塑自我",
         zh="目标即透镜", en="GOALS ARE A LENS", line="目标决定你看见什么，所见塑造你成为谁"),
    dict(at=T(15, 3), kind="point", conv=0.4, burst=0.0, ease="implode"),

    dict(at=T(16), kind="card", conv=0.75, burst=1.0, idx="05", act="ACT II  ·  专注的艺术",
         zh="专注", en="THE ART OF FOCUS", line="把持续的注意力，投向你自己选择的目标"),
    dict(at=T(18), kind="card", conv=0.75, burst=0.6, idx="06", act="ACT II  ·  专注的艺术",
         zh="对抗精神熵", en="ORDER OUT OF PSYCHIC ENTROPY", line="没有目标，心智归于混乱；目标带来秩序"),
    dict(at=T(20), kind="card", conv=0.75, burst=0.6, idx="07", act="ACT II  ·  专注的艺术",
         zh="人生即游戏", en="TURN YOUR LIFE INTO A GAME", line="愿景是胜利条件 · 反愿景是赌注 · 约束是规则"),
    dict(at=T(22), kind="card", conv=0.75, burst=0.6, idx="08", act="ACT II  ·  专注的艺术",
         zh="年 · 月 · 日", en="ONE YEAR · ONE MONTH · EVERY DAY", line="一年的目标 → 一个月的项目 → 每天的杠杆行动"),

    dict(at=T(24), kind="quote", conv=1.6, burst=0.35, hero="在 AI 内容泛滥的时代", size=96,
         subs=[("IN A WORLD FLOODED WITH AI CONTENT", "light", 30, 10, 618, 0.8)]),
    dict(at=T(26), kind="quote", conv=1.3, burst=0.4, hero="唯一无法复制的，是你", size=120,
         subs=[("THE ONLY THING THAT CAN'T BE COPIED IS YOU", "light", 30, 10, 626, 0.85)]),

    dict(at=T(28), kind="card", conv=0.8, burst=0.55, idx="09", act="ACT III  ·  一人企业",
         zh="一人企业", en="THE ONE-PERSON BUSINESS", line="技能 × 受众 × 数字工具 = 你的杠杆"),
    dict(at=T(30), kind="card", conv=0.8, burst=0.55, idx="10", act="ACT III  ·  一人企业",
         zh="成为通才", en="BE A GENERALIST", line="专才容易被自动化，通才驾驭变化"),
    dict(at=T(31, 3), kind="point", conv=0.4, burst=0.0, ease="implode"),
]
WORDS = [("自学", "SELF-EDUCATE"), ("写作", "WRITE"), ("创造", "CREATE"), ("杠杆", "LEVERAGE"),
         ("实验", "EXPERIMENT"), ("进化", "EVOLVE"), ("自由", "FREEDOM"), ("成为", "BECOME")]
for i, (zh, en) in enumerate(WORDS):
    SCENES.append(dict(at=T(32 + i), kind="word", conv=0.45, burst=1.0 if i == 0 else 0.7,
                       hero=zh, en=en))
SCENES += [
    dict(at=T(40), kind="quote", conv=0.85, burst=1.0, hero="改变身份，人生随之改变", size=118,
         subs=[("CHANGE WHO YOU ARE — AND YOUR LIFE FOLLOWS", "light", 32, 10, 612, 0.9)]),
    dict(at=T(42), kind="title", conv=1.0, burst=0.5, hero="DAN KOE",
         subs=[("专注  ·  创造  ·  成为", "light", 50, 20, 640, 0.95),
               ("观点提炼自 Dan Koe 的公开文章与著作《The Art of Focus》", "light", 22, 4, 990, 0.45)]),
    dict(at=T(43, 3), kind="point", conv=0.4, burst=0.0, ease="implode"),
    dict(at=T(44), kind="scatter", conv=3.6, burst=1.6),
]
for i, sc in enumerate(SCENES):
    sc["end"] = SCENES[i + 1]["at"] if i + 1 < len(SCENES) else DURATION + 1
TEXT_KINDS = ("title", "card", "quote", "word")
SHIMMERS = [sc["at"] + sc["conv"] * 0.9 for sc in SCENES if sc["kind"] in TEXT_KINDS]
