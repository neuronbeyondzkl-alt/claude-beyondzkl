"""时间轴：配乐与画面共用的唯一节拍来源。

120 BPM、4/4 拍：1 拍 = 0.5 s，1 小节 = 2 s，30 fps 下 1 拍正好 15 帧。
music.py 按这里的事件合成声音，scenes.py 按同一份事件驱动画面，所以卡点是"同源"的。
"""
import numpy as np

BPM = 120
BEAT = 60.0 / BPM
BAR = 4 * BEAT
FPS = 30
SR = 48000
TOTAL_BARS = 92
DURATION = TOTAL_BARS * BAR  # 184 s


def T(bar, beat=0.0):
    return bar * BAR + beat * BEAT


# ---------------------------------------------------------------- 段落
# (起始小节, 结束小节, 名称)
SECTIONS = [
    (0, 6, "intro"),          # 冷开场：心跳、钟表滴答、一颗火花
    (6, 14, "assemble"),      # 片名 + 粒子聚成大脑
    (14, 34, "past"),         # 01 回忆过去
    (34, 54, "future"),       # 02 想象未来
    (54, 76, "present"),      # 03 专注当下
    (76, 86, "finale"),       # 合：时间机器
    (86, 92, "credits"),      # 参考文献
]

# ---------------------------------------------------------------- 和声（每小节一个和弦，D 小调）
_CH = {}


def _fill(start, seq):
    for i, c in enumerate(seq):
        _CH[start + i] = c


_fill(0, ["Dpow"] * 8)
_fill(8, ["Dm", "Dm", "Bb", "Bb", "Gm", "A"])
_fill(14, ["Dm", "Bb", "F", "C"] * 4 + ["Dm", "Bb", "Gm", "A"])
_fill(34, ["Bb", "F", "C", "Dm"] * 4 + ["Gm", "Bb", "C", "C"])
_fill(54, ["Dm", "Dm", "Dm", "Dm", "Dm", "Bb", "Gm", "A"])
_fill(62, ["Dm", "Bb", "F", "C"] * 2 + ["Dm", "Dm", "Bb", "C", "Gm", "A"])
_fill(76, ["Bb", "C", "Dm", "F", "Bb", "C", "Bb", "C", "D", "D"])
_fill(86, ["D", "Bm", "G", "A", "D", "D"])


def chord(bar):
    return _CH.get(int(bar), "Dm")


# ---------------------------------------------------------------- 旋律（小节, [(拍, 音名, 时值拍)])
THEME_PAST = [
    [(0, "D5", 2), (2, "A4", 1), (3, "D5", 1)],
    [(0, "F5", 1.5), (1.5, "E5", .5), (2, "D5", 1), (3, "F5", 1)],
    [(0, "A5", 2), (2, "G5", 1), (3, "F5", 1)],
    [(0, "E5", 1.5), (1.5, "D5", .5), (2, "C5", 1), (3, "E5", 1)],
    [(0, "D5", 2), (2, "A4", 1), (3, "D5", 1)],
    [(0, "F5", 1.5), (1.5, "G5", .5), (2, "A5", 1), (3, "Bb5", 1)],
    [(0, "A5", 1.5), (1.5, "G5", .5), (2, "F5", 1), (3, "C5", 1)],
    [(0, "E5", 2), (2, "G5", 1), (3, "E5", 1)],
]
THEME_FUTURE = [
    [(0, "D5", 1), (1, "F5", 1), (2, "Bb5", 2)],
    [(0, "A5", 1.5), (1.5, "G5", .5), (2, "F5", 1), (3, "C5", 1)],
    [(0, "E5", 1), (1, "G5", 1), (2, "C6", 2)],
    [(0, "A5", 2), (2, "F5", 1), (3, "D5", 1)],
    [(0, "F5", 1), (1, "Bb5", 1), (2, "D6", 2)],
    [(0, "C6", 1.5), (1.5, "A5", .5), (2, "F5", 1), (3, "A5", 1)],
    [(0, "G5", 1), (1, "C6", 1), (2, "E6", 1.5), (3.5, "D6", .5)],
    [(0, "D6", 4)],
]
THEME_FINALE = [
    [(0, "D5", 4)],
    [(0, "E5", 4)],
    [(0, "F5", 2), (2, "A5", 2)],
    [(0, "C6", 2), (2, "A5", 1), (3, "F5", 1)],
    [(0, "D6", 2), (2, "C6", 1), (3, "Bb5", 1)],
    [(0, "C6", 1.5), (1.5, "Bb5", .5), (2, "A5", 1), (3, "G5", 1)],
    [(0, "F5", 2), (2, "Bb5", 2)],
    [(0, "G5", 1), (1, "A5", 1), (2, "C6", 2)],
    [(0, "D6", 8)],
]

MELODY = {}
for i, b in enumerate(THEME_PAST):
    MELODY[22 + i] = ("lead", b)
for i, b in enumerate(THEME_FUTURE):
    MELODY[38 + i] = ("lead", b)
for i, b in enumerate(THEME_FUTURE[4:]):
    MELODY[46 + i] = ("lead", b)
for i, b in enumerate(THEME_PAST[:4]):
    MELODY[66 + i] = ("horn", b)
for i, b in enumerate(THEME_FINALE):
    MELODY[76 + i] = ("lead", b)


# ---------------------------------------------------------------- 节奏事件
class Events:
    def __init__(self):
        self.kick, self.snare, self.hat, self.ohat = [], [], [], []
        self.tom, self.taiko, self.crash = [], [], []
        self.hit = []          # (t, size) size: 1 普通重击, 2 大重击（带 braam）
        self.tick, self.heart = [], []
        self.riser = []        # (t0, t1)
        self.revcym = []       # (t0, t1) 反向镲片，结束于 t1
        self.ping = []
        self.ripple = []       # 海马尖波涟漪
        self.arp = []          # (t, note)
        self.stab = []         # 铜管短促和弦
        self.whoosh = []       # (t, dir)
        self.rewind = []       # (t0, t1)
        self.tapestop = None   # (t0, t1)
        self.muffle = None     # (t0, t_closed, t_open)


def _beats(bar, beats, vel=1.0):
    return [(T(bar, b), vel) for b in beats]


def build_events():
    E = Events()
    # --- 冷开场：心跳 (每 2 拍 lub-dub) + 钟表滴答
    for bar in range(0, 14):
        for b in (0, 2):
            E.heart.append((T(bar, b), 1.0 if bar < 8 else 0.6))
    for bar in range(2, 14):
        for b in range(4):
            E.tick.append((T(bar, b), 1.0 if b == 0 else 0.7))
    E.riser.append((T(3), T(6)))
    E.revcym.append((T(5), T(6)))
    E.hit.append((T(6), 2))

    # --- 片名后：太鼓
    for bar in (7,):
        E.taiko += _beats(bar, [0, 2], 0.9)
    for bar in range(8, 12):
        E.kick += _beats(bar, [0, 2], 0.85)
        E.taiko += _beats(bar, [0, 1.5, 2.5, 3], 0.95)
        if bar % 2 == 1:
            E.tom += _beats(bar, [3.5, 3.75], 0.8)
    # --- 构建：军鼓滚奏加速 + 上升音
    E.kick += _beats(12, [0, 1, 2, 3], 0.9) + _beats(13, [0, 1, 2, 3], 1.0)
    E.snare += [(T(12, b * 0.5), 0.35 + 0.02 * b) for b in range(8)]
    E.snare += [(T(13, b * 0.25), 0.5 + 0.03 * b) for b in range(8)]
    E.snare += [(T(13, 2 + b * 0.125), 0.75 + 0.02 * b) for b in range(14)]
    E.riser.append((T(12), T(14) - BEAT * 0.25))
    E.revcym.append((T(13), T(14)))
    E.hit.append((T(14), 2))

    # --- 01 回忆过去：史诗半摇滚律动
    for bar in range(14, 33):
        E.kick += _beats(bar, [0, 1.75, 2.5], 1.0)
        E.snare += _beats(bar, [1, 3], 0.95)
        E.hat += _beats(bar, [0.5 * i for i in range(8) if i != 7], 0.55)
        E.ohat += _beats(bar, [3.5], 0.6)
        if bar in (17, 21, 25, 29):
            E.tom += [(T(bar, 3 + 0.25 * i), 0.9 - 0.05 * i) for i in range(4)]
    for bar in (18, 22, 26):
        E.crash.append((T(bar), 1.0))
    # 尖波涟漪：落在军鼓上（第 18-21 小节）
    for bar in range(18, 22):
        for b in (1, 3):
            E.ripple.append((T(bar, b), 1.0))
            E.ripple.append((T(bar, b + 0.25), 0.6))
    E.hit.append((T(30), 1))   # 再巩固：记忆被打散
    E.hit.append((T(32), 1))   # 再巩固：记忆重组
    E.rewind.append((T(33), T(34) - BEAT * 0.25))
    E.riser.append((T(33), T(34) - BEAT * 0.25))
    E.hit.append((T(34), 2))

    # --- 02 想象未来：四踩 + 反拍开镲 + 琶音
    for bar in range(34, 50):
        E.kick += _beats(bar, [0, 1, 2, 3], 1.0)
        E.snare += _beats(bar, [1, 3], 0.95)
        E.ohat += _beats(bar, [0.5, 1.5, 2.5, 3.5], 0.55)
        E.hat += _beats(bar, [0.25, 0.75, 1.25, 1.75, 2.25, 2.75, 3.25, 3.75], 0.35)
        if bar in (37, 41, 45, 49):
            E.tom += [(T(bar, 3 + 0.25 * i), 0.9 - 0.05 * i) for i in range(4)]
    for bar in (38, 42, 46):
        E.crash.append((T(bar), 1.0))
    E.crash.append((T(36), 0.8))   # 三块记忆碎片在海马汇合
    for bar in range(42, 54):
        for i in range(16):
            E.arp.append((T(bar, i * 0.25), i))
    E.whoosh += [(T(35, 0), 1), (T(35, 1), 1), (T(35, 2), 1), (T(36), -1)]
    for bar in range(50, 53):
        E.kick += _beats(bar, [0, 1, 2, 3], 1.0)
    E.snare += [(T(51, b * 0.5), 0.45 + 0.03 * b) for b in range(8)]
    E.snare += [(T(52, b * 0.25), 0.6 + 0.02 * b) for b in range(16)]
    E.snare += [(T(53, b * 0.125), 0.8 + 0.01 * b) for b in range(24)]
    E.kick += _beats(53, [0, 0.5, 1, 1.5, 2, 2.5], 1.0)
    E.riser.append((T(51), T(53, 3)))
    E.tapestop = (T(53, 3), T(54))

    # --- 03 专注当下：先静止，再重建，最强一段 drop
    for bar in range(54, 62):
        for b in (0, 2):
            E.heart.append((T(bar, b), 1.0 if bar < 58 else 0.7))
    for bar in range(54, 60):
        for b in range(4):
            E.tick.append((T(bar, b), 1.0 if b == 0 else 0.7))
    E.ping += [(T(54), 1.0), (T(56), 0.6)]
    E.kick += _beats(58, [0, 2], 0.9) + _beats(59, [0, 2, 2.75], 0.95)
    E.taiko += _beats(58, [1.5, 3], 0.8) + _beats(59, [1.5, 3, 3.5], 0.9)
    E.kick += _beats(60, [0, 1, 2, 3], 1.0)
    E.snare += _beats(60, [1, 3], 0.9)
    E.taiko += _beats(60, [0, 1.5, 2.5, 3.5], 0.9)
    E.kick += _beats(61, [0, 1, 2, 3], 1.0)
    E.snare += [(T(61, b * 0.25), 0.55 + 0.03 * b) for b in range(15)]
    E.riser.append((T(60), T(62) - BEAT * 0.25))
    E.revcym.append((T(61), T(62)))
    E.hit.append((T(62), 2))
    for bar in list(range(62, 70)) + [72, 73]:
        E.kick += _beats(bar, [0, 1, 2, 3], 1.0)
        E.snare += _beats(bar, [1, 3], 1.0)
        E.hat += _beats(bar, [0.25 * i for i in range(16)], 0.32)
        E.taiko += _beats(bar, [0.75, 2.75], 0.7)
        E.stab += [(T(bar, b), 1.0) for b in (0, 0.75, 1.5, 2.5, 3.25)]
    for bar in (66,):
        E.crash.append((T(bar), 1.0))
    # 走神：整体被低通"闷住"，只剩稀疏底鼓
    for bar in (70, 71):
        E.kick += _beats(bar, [0, 2], 0.8)
    E.muffle = (T(70), T(71, 2), T(72))
    E.revcym.append((T(71), T(72)))
    E.hit.append((T(72), 1))   # 觉察 → 拉回
    E.kick += _beats(74, [0, 1, 2, 3], 1.0) + _beats(75, [0, 1, 2, 3], 1.0)
    E.snare += [(T(74, b * 0.5), 0.5 + 0.03 * b) for b in range(8)]
    E.snare += [(T(75, b * 0.25), 0.7 + 0.02 * b) for b in range(15)]
    E.riser.append((T(74), T(76) - BEAT * 0.25))
    E.revcym.append((T(75), T(76)))

    # --- 合：三连重击 + 终章主题 + D 大调终止
    E.hit += [(T(76), 2), (T(77), 2), (T(78), 2)]
    for bar in range(79, 83):
        E.kick += _beats(bar, [0, 1.75, 2.5], 1.0)
        E.snare += _beats(bar, [1, 3], 1.0)
        E.hat += _beats(bar, [0.5 * i for i in range(8)], 0.5)
        E.taiko += _beats(bar, [0, 2], 0.8)
    E.crash += [(T(79), 1.0), (T(81), 1.0)]
    E.tom += [(T(82, 3 + 0.25 * i), 0.95) for i in range(4)]
    E.kick += _beats(83, [0, 1, 2, 3], 1.0)
    E.snare += [(T(83, b * 0.25), 0.6 + 0.025 * b) for b in range(15)]
    E.revcym.append((T(83), T(84)))
    E.hit.append((T(84), 2))

    # 重击前 1/4 拍的"留白"：音乐全部静音、画面压暗，让重击更炸
    E.gaps = [(T(b) - BEAT * 0.25, T(b)) for b in (14, 34, 62, 76, 84)]

    for name in ("kick", "snare", "hat", "ohat", "tom", "taiko", "crash", "tick", "heart",
                 "ping", "ripple", "stab", "hit", "arp", "whoosh"):
        getattr(E, name).sort()
    return E


EVENTS = build_events()


# ---------------------------------------------------------------- 给画面用的包络
def decay_env(t, events, tau, attack=0.0):
    """events: [(time, weight)]；返回 t 时刻所有已发生事件的指数衰减之和。"""
    v = 0.0
    for et, w in events:
        dt = t - et
        if dt < -attack:
            break
        if dt < 0:
            v += w * (1 + dt / attack) if attack > 0 else 0.0
        elif dt < tau * 8:
            v += w * np.exp(-dt / tau)
    return v


def last_event(t, events):
    """返回 t 之前最近一次事件 (time, weight)，没有则 None。"""
    best = None
    for et, w in events:
        if et <= t + 1e-9:
            best = (et, w)
        else:
            break
    return best


def section_at(t):
    bar = t / BAR
    for s, e, name in SECTIONS:
        if s <= bar < e:
            return name, (bar - s) / (e - s)
    return SECTIONS[-1][2], 1.0
