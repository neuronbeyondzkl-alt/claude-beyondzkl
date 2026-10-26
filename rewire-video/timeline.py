"""Single source of truth for timing.

Both music.py (audio) and render.py (picture) read the beat grid, the event list
and the text script from here, so every hit, flash and caption lands on the same
sample/frame.
"""

BPM = 128.0
SPB = 60.0 / BPM          # seconds per beat
BAR = 4 * SPB             # seconds per bar (4/4)
FPS = 30
W, H = 1920, 1080
SR = 44100
END_BAR = 52
TAIL = 3.6
DURATION = END_BAR * BAR + TAIL


def tb(bar, beat=0.0):
    """Time (s) of a bar/beat position."""
    return (bar * 4 + beat) * SPB


SECTIONS = [
    ("intro", 0, 8), ("title", 8, 12), ("plast", 12, 20), ("neg", 20, 28),
    ("narr", 28, 36), ("breath", 36, 40), ("build", 40, 44), ("final", 44, 52),
]

# Windows of total silence right before a drop ("breath before the hit").
STOPS = [(tb(7, 3), tb(8)), (tb(25, 3), tb(26)), (tb(43, 3), tb(44))]


def build_events():
    ev = []

    def add(bar, beat, kind, **kw):
        ev.append(dict(t=tb(bar, beat), kind=kind, **kw))

    def groove(bar, open_hats=False, vel=1.0):
        for b in range(4):
            add(bar, b, "kick", vel=vel)
        add(bar, 1, "clap", vel=vel)
        add(bar, 3, "clap", vel=vel)
        for i in range(16):
            beat = i * 0.25
            if i % 4 == 2:
                add(bar, beat, "ohat" if open_hats else "hat", vel=0.9 * vel)
            elif i % 2 == 1:
                add(bar, beat, "hat", vel=0.45 * vel)
            else:
                add(bar, beat, "hat", vel=0.3 * vel)

    def roll(bar, step, start, end, v0, v1):
        n = int(round((end - start) / step))
        for i in range(n):
            add(bar, start + i * step, "snare", vel=v0 + (v1 - v0) * i / max(1, n - 1), roll=True)

    # ---- INTRO (0-8): heartbeat, ticking clock, toms, riser, stop -----------
    for b in range(0, 6):
        add(b, 0, "heart", vel=0.55 + 0.08 * b)
    for b in (2, 3):
        for i in range(4):
            add(b, i, "tick", vel=0.6)
    for b in (4, 5):
        for i in range(8):
            add(b, i * 0.5, "tick", vel=0.8 if i % 2 == 0 else 0.5)
    add(1, 3, "revcym", length=SPB)
    for b in (2, 4, 6):
        add(b, 0, "ping", vel=0.8)
    add(4, 0, "riser", length=tb(7, 3) - tb(4))
    for i in range(4):
        add(6, i, "tom", vel=0.65 + 0.08 * i)
        add(6, i, "kick", vel=0.7)
    for i in range(6):
        add(7, i * 0.5, "tom", vel=0.85 + 0.03 * i)
    for i in range(3):
        add(7, i, "kick", vel=0.85)
    roll(6, 0.5, 0, 4, 0.25, 0.45)
    roll(7, 0.25, 0, 3, 0.5, 1.0)
    add(7, 2, "revcym", length=2 * SPB)

    # ---- TITLE (8-12): impact + braam, half-time epic feel ----------------
    add(8, 0, "impact", vel=1.0)
    add(8, 0, "braam", vel=1.0, root=38)
    add(8, 0, "crash", vel=1.0)
    for b in range(8, 12):
        add(b, 0, "kick", vel=1.0)
        add(b, 2.5, "kick", vel=0.8)
        add(b, 2, "snare", vel=1.0)
        if b > 8:
            for i in range(8):
                add(b, i * 0.5, "hat", vel=0.35)
    add(9, 0, "ping", vel=0.7)
    add(10, 0, "ping", vel=0.7)
    for i in range(4):
        add(11, 3 + i * 0.25, "tom", vel=0.7 + 0.1 * i)
    add(11, 2, "whoosh", length=2 * SPB)

    # ---- PLASTICITY (12-20): main groove ---------------------------------
    add(12, 0, "crash", vel=0.8)
    add(12, 0, "hit", vel=0.7)
    add(16, 0, "crash", vel=0.7)
    for b in range(12, 20):
        groove(b, open_hats=b >= 16, vel=0.9)
    for b in (13, 16, 18):
        add(b, 0, "ping", vel=0.8)
    roll(19, 0.25, 3, 4, 0.6, 0.9)

    # ---- NEGATIVE (20-28): darker, tension, stop, shatter ---------------
    add(20, 0, "braam", vel=0.8, root=38)
    add(20, 0, "crash", vel=0.8)
    add(20, 0, "hit", vel=0.8)
    for b in range(20, 26):
        if b == 25:
            for i in range(3):
                add(b, i, "kick", vel=1.0)
        else:
            groove(b, vel=0.95)
    add(21, 2, "ping", vel=0.8)
    add(23, 2, "ping", vel=0.8)
    add(24, 0, "riser", length=tb(25, 3) - tb(24))
    roll(24, 0.5, 0, 4, 0.3, 0.55)
    roll(25, 0.125, 0, 3, 0.55, 1.0)
    add(25, 2, "revcym", length=2 * SPB)
    add(26, 0, "impact", vel=1.0)
    add(26, 0, "braam", vel=1.0, root=38)
    add(26, 0, "crash", vel=1.0)
    add(26, 0, "hit", vel=1.0)
    for b in (26, 27):
        groove(b, open_hats=True)
    add(27, 2, "whoosh", length=2 * SPB)

    # ---- NARRATIVE (28-36): full energy, list hits -----------------------
    add(28, 0, "braam", vel=0.7, root=41)
    add(28, 0, "crash", vel=0.9)
    add(28, 0, "hit", vel=0.8)
    for b in range(28, 36):
        groove(b, open_hats=True)
    for b in (30, 31, 32, 33):
        add(b, 0, "hit", vel=0.9)
    add(32, 0, "crash", vel=0.7)
    add(34, 0, "crash", vel=0.8)
    add(34, 0, "ping", vel=0.9)
    roll(35, 0.25, 2, 4, 0.5, 1.0)

    # ---- BREATH (36-40): breakdown, physiological sigh --------------------
    add(36, 0, "crash", vel=0.6)
    add(36, 0, "downlifter", vel=0.9)
    for b in (36, 38):
        add(b, 0, "inhale", length=2 * SPB)
        add(b, 2, "inhale2", length=1 * SPB)
        add(b, 3, "exhale", length=5 * SPB)
    for b in range(36, 40):
        add(b, 0, "heart", vel=0.45)
    add(39, 0, "revcym", length=4 * SPB)

    # ---- BUILD (40-44): words slam per bar, roll accelerates --------------
    for b in (40, 41, 42, 43):
        add(b, 0, "hit", vel=1.0)
        add(b, 0, "tom", vel=1.0)
    for b in (40, 41, 42):
        for i in range(4):
            add(b, i, "kick", vel=0.9)
    for i in range(6):
        add(43, i * 0.5, "kick", vel=1.0)
    roll(40, 1.0, 0, 4, 0.35, 0.45)
    roll(41, 0.5, 0, 4, 0.45, 0.6)
    roll(42, 0.25, 0, 4, 0.6, 0.8)
    roll(43, 0.125, 0, 3, 0.8, 1.0)
    add(40, 0, "riser", length=tb(43, 3) - tb(40))
    add(43, 2, "revcym", length=2 * SPB)

    # ---- FINAL (44-52): double impact, anthem, logo -----------------------
    for b in (44, 46):
        add(b, 0, "impact", vel=1.0)
        add(b, 0, "braam", vel=1.0, root=38 if b == 44 else 34)
        add(b, 0, "crash", vel=1.0)
        add(b, 0, "hit", vel=1.0)
    for b in range(44, 52):
        groove(b, open_hats=True)
    add(48, 0, "crash", vel=0.9)
    add(48, 0, "hit", vel=1.0)
    add(50, 0, "crash", vel=1.0)
    add(50, 0, "hit", vel=1.0)
    add(50, 0, "impact", vel=0.6)
    add(51, 0, "ping", vel=0.9)
    roll(51, 0.25, 2, 4, 0.6, 1.0)
    for i in range(4):
        add(51, 3 + i * 0.25, "tom", vel=0.8 + 0.06 * i)
    add(52, 0, "impact", vel=1.0)
    add(52, 0, "braam", vel=1.0, root=38)
    add(52, 0, "crash", vel=1.0)
    add(52, 0, "kick", vel=1.0)

    # nothing may sound inside a stop window except reverse cymbals
    def in_stop(t):
        return any(a - 1e-6 <= t < b - 1e-6 for a, b in STOPS)

    ev = [e for e in ev if e["kind"] == "revcym" or not in_stop(e["t"])]
    ev.sort(key=lambda e: e["t"])
    return ev


EVENTS = build_events()


def _smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def breath_curve(t):
    """Lung volume 0..1 for the physiological-sigh section (bars 36-40):
    inhale (2 beats) -> second top-up inhale (1 beat) -> long exhale (5 beats)."""
    if not tb(36) <= t < tb(40):
        return 0.0
    u = ((t - tb(36)) % (2 * BAR)) / SPB
    if u < 2:
        return 0.72 * _smooth(u / 2)
    if u < 3:
        return 0.72 + 0.28 * _smooth(u - 2)
    return 1.0 - _smooth((u - 3) / 5)


def times(kind):
    return [e["t"] for e in EVENTS if e["kind"] == kind]


# --------------------------------------------------------------------------
# Text script (picture). mode: "assemble" = particles fly in and form text,
# "slam" = appears on the hit with a punch-in. Times are on the beat grid.
# --------------------------------------------------------------------------
SCRIPT = [
    # intro
    dict(zh="你的大脑，并非一成不变", en="YOUR BRAIN IS NOT FIXED", t0=tb(2), t1=tb(3, 3)),
    dict(zh="大脑是硬件，心智是软件", en="BRAIN = HARDWARE  ·  MIND = SOFTWARE", t0=tb(4), t1=tb(5, 3)),
    dict(zh="而软件，可以被重写", en="AND SOFTWARE CAN BE REWRITTEN", t0=tb(6), t1=tb(7, 3), exit="implode"),
    # title
    dict(logo="REWIRE", t0=tb(8), t1=tb(11, 2), mode="slam", y=430, size=250),
    dict(zh="打破循环 · 改写思维 · 创造持久改变",
         en="BREAK THE CYCLE  ·  ALTER YOUR THOUGHTS  ·  CREATE LASTING CHANGE",
         t0=tb(9), t1=tb(11, 2), y=650, zs=50, es=22),
    dict(en_big="NICOLE VIGNOLA", zh="神经科学家 著", t0=tb(10), t1=tb(11, 2), y=800, zs=30, es=40),
    # plasticity
    dict(tag="01", zh="神经可塑性", en="NEUROPLASTICITY", t0=tb(12), t1=tb(19, 3), mode="slam", y=150),
    dict(zh="反复走过的小径，会变成高速公路", en="REPETITION TURNS A TRAIL INTO A HIGHWAY", t0=tb(13), t1=tb(15, 3), y=600),
    dict(zh="一起放电的神经元，会连在一起", en="NEURONS THAT FIRE TOGETHER, WIRE TOGETHER  ·  HEBB, 1949", t0=tb(16), t1=tb(17, 3), y=600),
    dict(zh="注意力 × 一致性 ＝ 重塑", en="ATTENTION  ×  CONSISTENCY  =  REWIRING", t0=tb(18), t1=tb(19, 3), y=600),
    # negative
    dict(tag="PHASE 1", zh="甩掉负面", en="DITCH THE NEGATIVE", t0=tb(20), t1=tb(25, 3), mode="slam", y=150),
    dict(zh="负面偏好：大脑天生更容易记住坏事", en="NEGATIVITY BIAS  ·  THE BRAIN HOLDS ON TO THE BAD", t0=tb(21, 2), t1=tb(23, 1), y=880, zs=52),
    dict(zh="但压力并非敌人，它也是必要的信号", en="YET STRESS IS ALSO NECESSARY", t0=tb(23, 2), t1=tb(25, 3), y=880, zs=52, exit="implode"),
    dict(zh="打破循环", en="BREAK THE CYCLE", t0=tb(26), t1=tb(27, 3), mode="slam", y=540, zs=150, es=40),
    # narrative
    dict(tag="PHASE 2", zh="改写叙事", en="SHIFT YOUR NARRATIVE", t0=tb(28), t1=tb(35, 3), mode="slam", y=150),
    dict(zh="①  放下手机，夺回注意力", en="RECLAIM YOUR ATTENTION", t0=tb(30), t1=tb(33, 3), mode="slam", y=360, align="left", zs=50),
    dict(zh="②  书写日记，让念头显形", en="JOURNAL YOUR THOUGHTS", t0=tb(31), t1=tb(33, 3), mode="slam", y=490, align="left", zs=50),
    dict(zh="③  视觉化，为大脑画出蓝图", en="VISUALISE THE BLUEPRINT", t0=tb(32), t1=tb(33, 3), mode="slam", y=620, align="left", zs=50),
    dict(zh="④  审视捷思，旧捷径未必适用", en="QUESTION YOUR HEURISTICS", t0=tb(33), t1=tb(33, 3), mode="slam", y=750, align="left", zs=50),
    dict(zh="你专注于什么，就在强化什么", en="WHERE ATTENTION GOES, WIRING GROWS", t0=tb(34), t1=tb(35, 3), y=560, zs=72),
    # breath
    dict(tag="PHASE 3", zh="强化正向", en="BOOST THE POSITIVE", t0=tb(36), t1=tb(39, 3), y=150),
    dict(zh="生理叹息：最快让神经系统平静下来", en="THE PHYSIOLOGICAL SIGH  ·  INHALE, INHALE AGAIN, LONG EXHALE",
         t0=tb(36, 2), t1=tb(39, 3), y=930, zs=40, es=20),
    # build
    dict(zh="睡眠", en="SLEEP", sub="巩固记忆 · 清理大脑", t0=tb(40), t1=tb(40, 3.7), mode="slam", y=520, zs=170, es=36),
    dict(zh="运动", en="EXERCISE", sub="为神经可塑性供能", t0=tb(41), t1=tb(41, 3.7), mode="slam", y=520, zs=170, es=36),
    dict(zh="冥想", en="MEDITATION", sub="拔除反刍的杂草", t0=tb(42), t1=tb(42, 3.7), mode="slam", y=520, zs=170, es=36),
    dict(zh="成长型思维", en="GROWTH MINDSET", sub="能力可以被培养", t0=tb(43), t1=tb(43, 3), mode="slam", y=520, zs=170, es=36, exit="implode"),
    # final
    dict(en_big="CHANGE YOUR MIND", zh="改变你的思维", t0=tb(44), t1=tb(45, 3.5), mode="slam", y=540, zs=60, es=150),
    dict(en_big="CHANGE YOUR LIFE", zh="改变你的人生", t0=tb(46), t1=tb(47, 3.5), mode="slam", y=540, zs=60, es=150),
    dict(chips=[("甩掉负面", "DITCH THE NEGATIVE"), ("改写叙事", "SHIFT YOUR NARRATIVE"), ("强化正向", "BOOST THE POSITIVE")],
         t0=tb(48), t1=tb(49, 3.5), mode="slam", y=470),
    dict(zh="每天一点点，大脑靠一致性重塑自己", en="THE BRAIN REWIRES ITSELF ON CONSISTENCY", t0=tb(48, 2), t1=tb(49, 3.5), y=720, zs=48),
    dict(logo="REWIRE", t0=tb(50), t1=DURATION + 1, mode="slam", y=470, size=230, final=True),
    dict(zh="今天，就开始重塑", en="NICOLE VIGNOLA  ·  REWIRE", t0=tb(51), t1=DURATION + 1, y=700, zs=54, es=26, final=True),
]
