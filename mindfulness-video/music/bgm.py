"""《正念：重塑大脑的力量》原创配乐：史诗混合管弦风格，全部程序合成。

不使用任何采样或第三方音频，所有声音都由振荡器、噪声、滤波器和卷积混响
在这里生成，因此可自由商用（见 README）。

D 小调，120 BPM（1 小节 = 2 秒），与画面时间线严格对齐：
重击读取 render/timeline.py 里的 HITS，呼吸段读取 BREATH_T0。

    python bgm.py            # 生成 bgm.wav（48 kHz / 16 bit 立体声）
"""
import os
import sys

import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "render"))
from timeline import BREATH_T0, DURATION, HITS  # noqa: E402

SR = 48000
BAR = 2.0
BEAT = 0.5
TAIL = 4.0
NS = int((DURATION + TAIL) * SR)
RNG = np.random.default_rng(1979)


def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m, float) - 69) / 12)


# ====================================================================== 基础构件
class Bus:
    def __init__(self):
        self.x = np.zeros((2, NS), np.float32)

    def add(self, sig, t, pan=0.0, gain=1.0):
        sig = np.asarray(sig, np.float32)
        i0 = int(round(t * SR))
        if sig.ndim == 1:
            a = (pan + 1) * np.pi / 4
            sig = np.stack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
        nf = min(int(0.015 * SR), sig.shape[1])
        if nf > 1:
            sig = sig.copy()
            sig[:, -nf:] *= np.linspace(1, 0, nf, dtype=np.float32)
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], NS - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += sig[:, :n] * gain


def env_adsr(n, a, d, s, r, sustain_len=None):
    """n 个采样的 ADSR（秒）。"""
    t = np.arange(n) / SR
    hold = (n / SR - r) if sustain_len is None else sustain_len
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - hold) / max(r, 1e-4), 0, 1)
    e = e * (1 - rel) ** 2
    return e.astype(np.float32)


def saw(freq, n, phase=None):
    """PolyBLEP 锯齿波；freq 可以是常数或逐采样数组。"""
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    dt = f / SR
    ph0 = RNG.random() if phase is None else phase
    ph = (ph0 + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y.astype(np.float32)


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    return np.sin(2 * np.pi * (np.cumsum(f) / SR) + phase).astype(np.float32)


_sos_cache = {}


def sos(kind, fc, order=2):
    key = (kind, tuple(np.atleast_1d(fc)), order)
    if key not in _sos_cache:
        _sos_cache[key] = signal.butter(order, fc, btype=kind, fs=SR, output="sos")
    return _sos_cache[key]


def lp(x, fc, order=2):
    return signal.sosfilt(sos("lowpass", min(fc, SR * 0.45), order), x, axis=-1).astype(np.float32)


def hp(x, fc, order=2):
    return signal.sosfilt(sos("highpass", fc, order), x, axis=-1).astype(np.float32)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos("bandpass", (lo, min(hi, SR * 0.45)), order), x, axis=-1).astype(np.float32)


def noise(n):
    return RNG.standard_normal(n).astype(np.float32)


def vib(n, rate=5.2, depth=0.004, delay=0.25):
    t = np.arange(n) / SR
    return 1 + depth * np.clip(t / delay, 0, 1) * np.sin(2 * np.pi * rate * t + RNG.random() * 6.28)


# ====================================================================== 乐器
def taiko(vel=1.0, f0=62.0, size=1.0):
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 1.3 * np.exp(-t / 0.035))
    body = sine(f, n) * np.exp(-t / (0.42 * size))
    mode2 = sine(f * 1.58, n) * np.exp(-t / 0.12) * 0.35
    click = lp(noise(n), 2600) * np.exp(-t / 0.012) * 0.9
    slap = bp(noise(n), 300, 1100) * np.exp(-t / 0.05) * 0.5
    y = body + mode2 + click + slap
    return np.tanh(1.6 * y * vel) / 1.2


def taiko_ens(bus, t, vel=1.0, n=3, pan_spread=0.5, f0=60.0):
    for k in range(n):
        dtm = RNG.uniform(0, 0.014) if k else 0.0
        bus.add(taiko(vel * RNG.uniform(0.8, 1.0), f0 * RNG.uniform(0.9, 1.12), RNG.uniform(0.9, 1.25)),
                t + dtm, pan=RNG.uniform(-pan_spread, pan_spread), gain=0.75 / np.sqrt(n) * 1.4)


def snare(vel=1.0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    y = bp(noise(n), 1200, 7000) * np.exp(-t / 0.13) + sine(185 * (1 + 0.4 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.06) * 0.7
    return (y * vel * 0.6).astype(np.float32)


def timpani(m, vel=1.0, dur=1.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = sum(a * sine(f * r * (1 + 0.04 * np.exp(-t / 0.05)), n) * np.exp(-t / d)
            for r, a, d in ((1.0, 1.0, 0.9), (1.5, 0.45, 0.6), (1.99, 0.3, 0.45), (2.44, 0.15, 0.3)))
    y += lp(noise(n), 900) * np.exp(-t / 0.02) * 0.4
    return (np.tanh(y * vel * 1.2) * 0.7).astype(np.float32)


def crash(vel=1.0, dur=3.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = hp(noise(n), 3500, 2) + 0.5 * bp(noise(n), 5500, 9500)
    return (x * np.exp(-t / 1.1) * (1 - np.exp(-t / 0.004)) * vel * 0.35).astype(np.float32)


def reverse_swell(dur=2.0, vel=1.0):
    x = crash(vel, dur + 0.5)[: int(dur * SR)][::-1].copy()
    return x * np.linspace(0.2, 1, len(x)) ** 2


def riser(dur, vel=1.0, f_lo=250, f_hi=7000):
    n = int(dur * SR)
    out = np.zeros(n, np.float32)
    x = noise(n)
    blk = 1024
    zi = None
    for i in range(0, n, blk):
        k = i / n
        fc = f_lo * (f_hi / f_lo) ** k
        s_ = signal.butter(2, (fc * 0.7, min(fc * 1.4, SR * 0.45)), btype="bandpass", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((s_.shape[0], 2))
        y, zi = signal.sosfilt(s_, x[i:i + blk], zi=zi)
        out[i:i + blk] = y
    t = np.arange(n) / n
    tone = saw(mtof(50) * 2 ** (2 * t), n) * 0.12
    tone = lp(tone, 3000)
    return ((out * 1.4 + tone) * t ** 2.2 * vel).astype(np.float32)


def boom(vel=1.0, dur=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 30 + 55 * np.exp(-t / 0.25)
    y = sine(f, n) * np.exp(-t / 1.0) * (1 - np.exp(-t / 0.003))
    return (np.tanh(y * 1.5) * vel * 0.9).astype(np.float32)


def shaker(vel=1.0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    y = hp(noise(n), 6500, 2) * np.exp(-t / 0.025) * (1 - np.exp(-t / 0.003))
    return (y * vel * 0.25).astype(np.float32)


def heartbeat(vel=1.0):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    y = sine(52 * (1 + 0.3 * np.exp(-t / 0.02)), n) * np.exp(-t / 0.09)
    return (y * vel).astype(np.float32)


def braam(notes, vel=1.0, dur=4.0):
    """低音铜管群奏：多声部失谐锯齿 + 滤波开合 + 饱和。"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    dry = np.zeros(n, np.float32)
    for m in notes:
        for d in (-0.12, -0.05, 0.0, 0.06, 0.13):
            dry += saw(mtof(m) * 2 ** (d / 12) * vib(n, 4.0, 0.002, 0.6), n)
    dry /= len(notes) * 2.5
    dark, bright = lp(dry, 260, 4), lp(dry, 2600, 2)
    k = np.exp(-t / 0.55) * 0.85 + 0.15 * np.exp(-t / 3.0)
    y = dark * (1 - k) + bright * k
    a = (1 - np.exp(-t / 0.03)) * np.exp(-t / 2.4)
    y = np.tanh(y * 3.0) * a
    return (y * vel * 0.8).astype(np.float32)


def string_note(m, dur, vel, bright=0.5, attack=0.35, release=0.7, voices=4):
    n = int((dur + release) * SR)
    y = np.zeros(n, np.float32)
    for k in range(voices):
        cents = (k - (voices - 1) / 2) * 7
        y += saw(mtof(m) * 2 ** (cents / 1200) * vib(n, 5.0 + 0.4 * k, 0.003, 0.4), n)
    y /= voices
    fc = 900 + 3200 * bright
    y = lp(y, fc, 2)
    return y * env_adsr(n, attack, 0.6, 0.85, release, dur) * vel


def pluck(m, vel, bright=0.5, dur=0.16):
    """弦乐顽固音型（短弓）。"""
    n = int((dur + 0.12) * SR)
    t = np.arange(n) / SR
    y = 0.6 * saw(mtof(m) * 0.998, n) + 0.6 * saw(mtof(m) * 1.003, n)
    y = lp(y, 700 + 3600 * bright, 2)
    e = (1 - np.exp(-t / 0.004)) * np.exp(-t / (0.06 + 0.06 * bright))
    return (y * e * vel).astype(np.float32)


def brass_note(m, dur, vel, release=0.5):
    n = int((dur + release) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n, np.float32)
    for d in (-0.07, 0.0, 0.08):
        y += saw(mtof(m) * 2 ** (d / 12) * vib(n, 4.6, 0.0025, 0.5), n)
    y /= 3
    dark, bright = lp(y, 500, 2), lp(y, 2400, 2)
    k = 0.25 + 0.75 * np.exp(-t / 0.18)
    y = dark * (1 - k) + bright * k * 0.8
    return np.tanh(y * 1.8) * env_adsr(n, 0.06, 0.4, 0.8, release, dur) * vel


def choir_note(m, dur, vel, vowel="a", release=1.0, voices=5):
    n = int((dur + release) * SR)
    y = np.zeros(n, np.float32)
    for k in range(voices):
        cents = RNG.uniform(-12, 12)
        y += saw(mtof(m) * 2 ** (cents / 1200) * vib(n, RNG.uniform(4.8, 5.8), 0.006, 0.5), n)
    y /= voices
    return y * env_adsr(n, 0.7, 1.0, 0.9, release, dur) * vel


def bell(m, vel, dur=2.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    y = sum(a * sine(f * r, n) * np.exp(-t / d) for r, a, d in ((1, 1, 1.1), (2.0, 0.35, 0.5), (3.01, 0.18, 0.3), (4.17, 0.1, 0.18)))
    y *= 1 - np.exp(-t / 0.002)
    return (y * vel * 0.5).astype(np.float32)


def lead_note(m, dur, vel, release=0.35):
    """主旋律：圆号 + 弦乐八度叠加。"""
    n = int((dur + release) * SR)
    v = vib(n, 5.0, 0.005, 0.45)
    horn = 0.6 * saw(mtof(m) * v, n) + 0.4 * saw(mtof(m) * 1.004 * v, n)
    horn = np.tanh(lp(horn, 1400, 2) * 1.6)
    strg = 0.5 * saw(mtof(m + 12) * 0.998 * v, n) + 0.5 * saw(mtof(m + 12) * 1.002 * v, n)
    strg = lp(strg, 4200, 2) * 0.35
    return (horn + strg) * env_adsr(n, 0.05, 0.5, 0.85, release, dur) * vel


# ====================================================================== 和声与结构
PC = {"D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "C": 0}
CHORD = {
    "Dm": ("D", (0, 3, 7)), "Bb": ("Bb", (0, 4, 7)), "F": ("F", (0, 4, 7)), "C": ("C", (0, 4, 7)),
    "Gm": ("G", (0, 3, 7)), "A": ("A", (0, 4, 7)), "D": ("D", (0, 4, 7)), "Asus": ("A", (0, 5, 7)),
}
BASS = {"D": 38, "Bb": 34, "F": 41, "C": 36, "G": 43, "A": 45}


def harmony():
    h = []
    h += ["Dm"] * 4 + ["Bb"] * 2 + ["Asus", "A"]                    # b0–7 冷开场
    h += ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"]              # b8–15 标题
    h += ["Dm", "Bb", "F", "C"] * 3 + ["Dm", "Bb", "Gm", "A"]       # b16–31 什么是正念
    h += ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"] * 5          # b32–71 神经机制
    h += ["Gm", "Gm", "Dm", "Dm", "Bb", "A"]                        # b72–77 争议
    h += ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A", "Dm", "Bb", "Gm", "A"]   # b78–89 为什么
    h += ["Bb", "F", "C", "Dm"]                                     # b90–93 意义
    h += ["Dm", "Dm"] + ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"] * 3 + ["Gm", "Gm", "A", "A"]  # b94–123 如何练
    h += ["Dm", "Bb", "F", "C", "Bb", "A"] + ["D"] * 4 + ["Dm", "Dm"]   # b124–135 终章
    h += ["Dm", "Bb", "F", "C", "Dm", "Bb", "Dm", "Dm"]             # b136–143 片尾
    assert len(h) == 144, len(h)
    return h


H = harmony()


def chord_notes(name, octave_base=50):
    root, iv = CHORD[name]
    r = PC[root]
    base = octave_base + ((r - octave_base) % 12)
    return [base + i for i in iv]


# 主题（8 小节，(音高, 拍数)）
THEME = [
    [(74, 2), (69, 1), (74, 1)], [(77, 3), (76, 0.5), (74, 0.5)], [(72, 2), (69, 1), (72, 1)], [(76, 2), (74, 1), (72, 1)],
    [(74, 1.5), (76, 0.5), (77, 2)], [(79, 1.5), (77, 0.5), (74, 2)], [(82, 2), (81, 1), (79, 1)], [(81, 4)],
]
# 终章后四小节：B♭ – A – D – D（皮卡第三度，结束在 D 大三和弦）
THEME_END = [[(77, 2), (74, 1), (77, 1)], [(76, 2), (73, 1), (76, 1)], [(81, 4)], [(78, 2), (74, 2)]]


def intensity(b):
    """每小节的总体能量 0..1（决定各声部是否出现、力度、明暗）。"""
    if b < 8:
        return 0.15
    if b < 16:
        return 0.55
    if b < 28:
        return 0.3
    if b < 32:
        return 0.3 + 0.35 * (b - 28) / 4
    if b < 72:
        return 0.95 if b >= 36 else 0.85
    if b < 78:
        return 0.35
    if b < 90:
        return 0.6 if b < 86 else 0.7
    if b < 94:
        return 0.75
    if b < 110:
        return 0.25
    if b < 120:
        return 0.3 + 0.3 * (b - 110) / 10
    if b < 124:
        return 0.65
    if b < 134:
        return 1.0
    if b < 136:
        return 0.5
    return 0.22


# ====================================================================== 编曲
def compose():
    drums, orch, choir_b, keys, fx, sub = Bus(), Bus(), Bus(), Bus(), Bus(), Bus()

    # ---------------- 冷开场：持续音、心跳、念头般的碎片
    n = int(16.5 * SR)
    t = np.arange(n) / SR
    drone = (sine(mtof(38), n) * 0.5 + lp(saw(mtof(38), n) + saw(mtof(45) * 1.002, n), 300) * 0.25)
    drone *= np.clip(t / 3, 0, 1) * (1 - np.clip((t - 15.6) / 0.4, 0, 1))
    orch.add(drone, 0.0, gain=0.55)
    for tb in (0.6, 1.6, 2.6):
        sub.add(heartbeat(1.0), tb, gain=0.9)
        sub.add(heartbeat(0.6), tb + 0.28, gain=0.9)
    sub.add(boom(0.8, 3.0), 3.0)
    fx.add(reverse_swell(1.2, 0.8), 3.0 - 1.2, gain=0.8)
    pent = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]
    tt = 3.2
    while tt < 14.0:
        dens = 0.18 - 0.1 * min(1, (tt - 3) / 9)
        keys.add(bell(RNG.choice(pent) + 12 * RNG.integers(0, 2) - 0, RNG.uniform(0.25, 0.55)), tt, pan=RNG.uniform(-0.8, 0.8), gain=0.5)
        tt += RNG.exponential(dens) + 0.05
    sub.add(boom(0.6, 3.0), 8.4)
    for m in chord_notes("Dm", 50):
        orch.add(string_note(m, 5.6, 0.22, bright=0.2, attack=1.2, release=1.5), 8.4, pan=RNG.uniform(-0.5, 0.5))
    fx.add(reverse_swell(2.0, 1.2), 14.0, gain=1.0)
    fx.add(riser(3.6, 0.8), 12.4, gain=0.6)

    # ---------------- 逐小节编排
    for b in range(8, 144):
        t0 = b * BAR
        ch = H[b]
        I = intensity(b)
        root_pc = PC[CHORD[ch][0]]
        bass = BASS[CHORD[ch][0]]
        # 弦乐铺底
        if b >= 8:
            for m in chord_notes(ch, 55 if b < 124 else 57):
                orch.add(string_note(m, BAR, 0.12 + 0.18 * I, bright=0.25 + 0.75 * I, attack=0.25), t0,
                         pan=RNG.uniform(-0.6, 0.6), gain=0.9)
                if I > 0.8:
                    orch.add(string_note(m + 12, BAR, 0.1 * I, bright=1.0, attack=0.3, voices=3), t0, pan=RNG.uniform(-0.8, 0.8), gain=0.8)
            orch.add(string_note(bass, BAR, 0.18 + 0.25 * I, bright=0.2 + 0.4 * I, attack=0.15, voices=3), t0, gain=0.9)
        # 低音弦乐顽固音型（16 分音符）
        osti = (10 <= b < 16) or (20 <= b < 72) or (78 <= b < 94) or (104 <= b < 136)
        if osti:
            pat = [0, 0, 7, 0, 12, 0, 7, 0, 0, 0, 7, 0, 12, 7, 3 if CHORD[ch][1][1] == 3 else 4, 0]
            lvl = 0.12 + 0.68 * I ** 1.4
            if 104 <= b < 112:
                lvl *= 0.5
            for k, iv in enumerate(pat):
                acc = 1.0 if k % 4 == 0 else 0.7
                m = bass + 12 + iv
                orch.add(pluck(m, lvl * acc, bright=0.2 + 0.7 * I), t0 + k * BAR / 16, pan=-0.25 + 0.5 * (k % 2), gain=0.55)
                if I > 0.55:
                    orch.add(pluck(m + 12, lvl * acc * 0.5, bright=0.7), t0 + k * BAR / 16, pan=0.3 - 0.6 * (k % 2), gain=0.45)
                if I > 0.8:
                    orch.add(pluck(m + 24, lvl * acc * 0.32, bright=0.9, dur=0.12), t0 + k * BAR / 16, pan=0.45 - 0.9 * (k % 2), gain=0.4)
                    fx.add(shaker(0.5 if k % 2 == 0 else 0.3), t0 + k * BAR / 16, pan=0.5, gain=0.5)
        # 铜管和弦（能量高时）
        if I >= 0.6 and not (90 <= b < 94):
            for m in [bass + 12, bass + 19, bass + 24]:
                orch.add(brass_note(m, BAR - 0.1, 0.22 * I), t0, pan=RNG.uniform(-0.3, 0.3), gain=0.8)
        # 合唱
        if (8 <= b < 16) or (32 <= b < 94) or (124 <= b < 136) or (72 <= b < 78):
            vowel_lvl = 0.10 + 0.12 * I
            for m in chord_notes(ch, 60):
                choir_b.add(choir_note(m, BAR, vowel_lvl), t0, pan=RNG.uniform(-0.7, 0.7))
            choir_b.add(choir_note(bass + 12, BAR, vowel_lvl * 0.8), t0)
        # 太鼓律动
        if 32 <= b < 72 or 124 <= b < 130:
            grid = "X..x..X.X..x.X.." if b % 2 == 0 else "X..x..X.X.xxX.x."
            for k, c in enumerate(grid):
                if c != ".":
                    v = 1.0 if c == "X" else 0.55
                    taiko_ens(drums, t0 + k * BAR / 16, v * (0.85 if b < 36 else 1.0), n=3 if c == "X" else 2)
            for k in (4, 12):
                drums.add(snare(0.8), t0 + k * BAR / 16, pan=0.15, gain=0.7)
        elif 78 <= b < 94 or 112 <= b < 124:
            for k in (0, 8) if b < 116 else (0, 6, 8, 14):
                taiko_ens(drums, t0 + k * BAR / 16, 0.75 if b < 94 else 0.55 + 0.4 * (b - 112) / 12, n=2)
        elif 20 <= b < 28 and b % 2 == 0:
            taiko_ens(drums, t0, 0.45, n=2, f0=55)
        # 定音鼓：句首
        if b % 4 == 0 and (32 <= b < 94 or 124 <= b < 134):
            drums.add(timpani(bass, 0.8), t0, gain=0.6)
        # 镲：每 8 小节的句首
        if b % 8 == 0 and (32 <= b < 72 or 124 <= b < 134):
            fx.add(crash(0.6), t0, pan=0.4)

    # ---------------- 主旋律
    def play_theme(b0, bars, gain=1.0, octave=0, end=False):
        for i in range(bars):
            phrase = THEME[i % 8]
            if end and i >= bars - 4:
                phrase = THEME_END[i - (bars - 4)]
            tb = (b0 + i) * BAR
            for m, beats in phrase:
                orch.add(lead_note(m + octave, beats * BEAT * 0.98, 0.32 * gain), tb, pan=0.05, gain=1.0)
                tb += beats * BEAT
    # 主题只从 8 小节和声循环的句首进入，保证旋律与和弦对位
    play_theme(40, 8, 0.85)
    play_theme(56, 8, 1.0)
    play_theme(64, 8, 1.05)
    play_theme(78, 8, 0.75, octave=-12)
    play_theme(124, 8, 1.15, end=True)
    # 钢片琴动机（安静段）
    for b0, stretch in ((16, 1), (24, 1), (96, 2), (104, 2), (112, 2), (136, 1)):
        tb = b0 * BAR
        for phrase in THEME[:4]:
            for m, beats in phrase:
                keys.add(bell(m + 12, 0.32 if b0 < 90 else 0.26, dur=2.2 * stretch), tb, pan=0.3, gain=0.6)
                tb += beats * BEAT * stretch

    # ---------------- 呼吸段（188–248）：铺底随吸气增亮、随呼气变暗
    t_b = BREATH_T0["meditator"]
    n = int((248 - 188) * SR)
    t = np.arange(n) / SR + 188
    br = 0.5 - 0.5 * np.cos(2 * np.pi * (t - t_b) / 8)
    pad = np.zeros(n, np.float32)
    for m in (50, 57, 62, 69, 74):     # 空五度：与 Dm / B♭ / F / C 都相容
        pad += saw(mtof(m) * 2 ** (RNG.uniform(-6, 6) / 1200), n) + saw(mtof(m) * 2 ** (RNG.uniform(-6, 6) / 1200), n)
    pad /= 10
    dark, bright = lp(pad, 350, 2), lp(pad, 2400, 2)
    k = br ** 1.5
    breath_pad = (dark * (1 - k) + bright * k) * (0.35 + 0.65 * br) * np.clip((t - 188) / 2, 0, 1) * np.clip((248 - t) / 1.5, 0, 1)
    orch.add(breath_pad, 188.0, gain=0.35)
    # 终章深呼吸（260–268）
    n = int(9.0 * SR)
    t = np.arange(n) / SR
    br = 0.5 - 0.5 * np.cos(2 * np.pi * t / 8)
    for m in (50, 54, 57, 62, 66, 69):
        orch.add(string_note(m, 7.5, 0.16, bright=0.8, attack=0.05, release=1.5) * 1.0, 260.0, pan=RNG.uniform(-0.6, 0.6))
        choir_b.add(choir_note(m + 12 if m < 60 else m, 7.5, 0.16), 260.0, pan=RNG.uniform(-0.7, 0.7))

    # ---------------- 重击、上升音效
    for th, s in HITS:
        if s >= 0.5:
            notes = [26, 38, 45, 50] + ([54] if th == 260.0 else [53])
            orch.add(braam(notes, vel=0.75 + 0.35 * s, dur=4.5), th, gain=0.9)
            sub.add(boom(min(1.0, 0.6 + 0.4 * s)), th)
            taiko_ens(drums, th, 1.0, n=5, pan_spread=0.7, f0=52)
            fx.add(crash(0.9 * s, 4.0), th, pan=-0.3)
            fx.add(crash(0.7 * s, 4.0), th + 0.01, pan=0.3)
            pre = 2.0 if s >= 0.9 else 1.2
            fx.add(reverse_swell(pre, 1.1 * s), th - pre, gain=0.9)
        else:
            taiko_ens(drums, th, 0.9, n=3, f0=56)
            fx.add(crash(0.45), th, pan=RNG.uniform(-0.5, 0.5))
    for t_end, dur, v in ((64.0, 8.0, 1.0), (156.0, 4.0, 0.6), (180.0, 4.0, 0.7), (248.0, 8.0, 1.0), (260.0, 4.0, 1.0), (16.0, 3.0, 0.5)):
        fx.add(riser(dur, v), t_end - dur, gain=0.55)
    # 小军鼓滚奏（推向 1:04 与 4:08）
    for t_end, dur in ((64.0, 4.0), (248.0, 4.0), (156.0, 2.0)):
        k = 0
        tt = t_end - dur
        while tt < t_end - 0.02:
            v = 0.15 + 0.85 * ((tt - (t_end - dur)) / dur) ** 2
            drums.add(snare(v * 0.7), tt, pan=RNG.uniform(-0.2, 0.2), gain=0.8)
            tt += BAR / 32
            k += 1
    # 定音鼓滚奏（标题段末）
    tt = 28.0
    while tt < 32.0:
        drums.add(timpani(38, 0.2 + 0.5 * (tt - 28) / 4, 0.6), tt, gain=0.5)
        tt += BAR / 24
    # 片尾最后的低音
    sub.add(boom(0.5, 4.0), 268.0)
    for m in (38, 50, 57, 62):
        orch.add(string_note(m, 3.5, 0.18, bright=0.3, attack=0.4, release=2.0), 268.0)
    return dict(drums=drums, orch=orch, choir=choir_b, keys=keys, fx=fx, sub=sub)


# ====================================================================== 混音
def make_ir(rt60=2.8, pre=0.025, bright=0.6, seed=4242):
    # 混响用独立的随机源：若与乐器噪声同源，会与某段噪声“匹配滤波”出巨大的相干峰
    rng = np.random.default_rng(seed + int(rt60 * 100))
    n = int(rt60 * 1.3 * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / rt60)
    out = []
    for ch in range(2):
        x = rng.standard_normal(n).astype(np.float32) * env
        dark = lp(x, 1800, 2)
        mix = np.exp(-t / 0.35)
        x = x * mix * bright + dark * (1 - mix * bright)
        x[: int(pre * SR)] = 0
        for d, a in ((0.011, 0.5), (0.019, 0.35), (0.027, 0.3), (0.041, 0.22), (0.057, 0.15)):
            x[int((pre + d + ch * 0.003) * SR)] += a
        out.append(x / np.sqrt(np.sum(x ** 2)))
    return np.stack(out).astype(np.float32)


def convolve(x, ir):
    return np.stack([signal.oaconvolve(x[c], ir[c])[: x.shape[1]] for c in range(2)]).astype(np.float32)


def formant(x, vowel="a"):
    F = {"a": ((700, 1.0, 110), (1150, 0.6, 130), (2800, 0.25, 220)), "o": ((420, 1.0, 90), (850, 0.5, 120), (2600, 0.15, 200))}[vowel]
    y = np.zeros_like(x)
    for f, a, bw in F:
        y += a * bp(x, f - bw, f + bw, 2) * 3.0
    return y + 0.08 * lp(x, 500)


def compress(x, thresh_db=-16, ratio=2.5, att=0.02, rel=0.25):
    lvl = np.sqrt(lp(np.mean(x ** 2, axis=0), 8, 1).clip(1e-9))
    db = 20 * np.log10(lvl)
    over = np.maximum(db - thresh_db, 0)
    gain_db = -over * (1 - 1 / ratio)
    # 攻击 / 释放平滑
    g = np.empty_like(gain_db)
    a_a, a_r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    blk = 64
    gd = gain_db[::blk]
    out = np.empty_like(gd)
    prev = 0.0
    aa, ar = a_a ** blk, a_r ** blk
    for i, v in enumerate(gd):
        coef = aa if v < prev else ar
        prev = coef * prev + (1 - coef) * v
        out[i] = prev
    g = np.repeat(out, blk)[: len(gain_db)]
    return x * (10 ** (g / 20))[None, :].astype(np.float32)


# 段落目标电平（dB RMS，近似）：让安静段与爆发段之间有足够的落差
SECTION_TARGET = [(0, -24), (16, -18), (32, -24), (56, -21), (63, -19), (64, -14.5), (144, -21), (156, -17.5),
                  (180, -16), (188, -24.5), (220, -22), (238, -19), (248, -14), (260, -15), (268, -20), (272, -25),
                  (DURATION + TAIL, -25)]
BUS_GAIN = dict(drums=0.42, orch=1.0, choir=0.8, keys=0.7, fx=0.6, sub=0.55)


def automation(y):
    """按段落把电平拉到 SECTION_TARGET（段落交界 1.5 秒交叉渐变）。"""
    t = np.arange(y.shape[1]) / SR
    mono = hp(y.mean(0), 60, 2)
    gain_db = np.zeros(len(t), np.float32)
    knots_t, knots_g = [], []
    for (a, tgt), (b, _) in zip(SECTION_TARGET[:-1], SECTION_TARGET[1:]):
        seg = mono[int(a * SR):int(b * SR)]
        lvl = 20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-9)
        g = np.clip(tgt - lvl, -18, 12)
        knots_t += [a + (0.0 if a == 0 else 0.0), b - 1.5 if b - a > 3 else b - 0.2]
        knots_g += [g, g]
    gain_db = np.interp(t, knots_t, knots_g)
    return y * (10 ** (gain_db / 20)).astype(np.float32)[None, :]


def mix(b):
    ir_hall = make_ir(3.0)
    ir_room = make_ir(1.2, bright=0.8)
    choir = b["choir"].x
    choir = np.stack([formant(choir[0]), formant(choir[1])])
    g = BUS_GAIN
    drums = hp(b["drums"].x, 38, 2)
    dry = drums * g["drums"] + b["orch"].x * g["orch"] + choir * g["choir"] + b["keys"].x * g["keys"] + b["fx"].x * g["fx"] + b["sub"].x * g["sub"]
    send = drums * g["drums"] * 0.4 + b["orch"].x * 0.35 + choir * g["choir"] * 0.7 + b["keys"].x * 0.7 + b["fx"].x * 0.3
    wet = convolve(send, ir_hall) * 1.1 + convolve(drums * g["drums"] * 0.3, ir_room) * 0.6
    y = hp(dry + wet, 28, 2)
    y = y + 0.7 * hp(y, 3200, 2)      # 高频“空气感”搁架提升，约 +4.6 dB
    y = automation(y)
    y = compress(y, -14, 2.0)
    y = y / (np.max(np.abs(y)) + 1e-9) * 1.15
    y = np.tanh(y) / np.tanh(1.15)
    t = np.arange(NS) / SR
    y *= np.clip((DURATION + 0.5 - t) / 2.5, 0, 1)
    y *= 10 ** (-1.0 / 20) / (np.max(np.abs(y)) + 1e-9)
    return y


class _Cached:
    def __init__(self, x):
        self.x = x


def main(out=os.path.join(HERE, "bgm.wav"), cache=None):
    import time
    t0 = time.time()
    if cache and os.path.exists(cache):
        d = np.load(cache)
        buses = {k: _Cached(d[k]) for k in d.files}
    else:
        buses = compose()
    print(f"compose {time.time() - t0:.1f}s")
    y = mix(buses)
    print(f"mix {time.time() - t0:.1f}s")
    y = y[:, : int(DURATION * SR)]
    pcm = np.clip(y.T * 32767 + RNG.uniform(-0.5, 0.5, y.T.shape), -32768, 32767).astype(np.int16)
    wavfile.write(out, SR, pcm)
    print("wrote", out)


if __name__ == "__main__":
    main(*sys.argv[1:])
