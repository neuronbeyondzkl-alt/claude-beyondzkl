"""程序化合成史诗配乐（D 小调，120 BPM），与 timeline.py 的段落、冲击点逐拍对齐。

声部：太鼓/通鼓/军鼓、铜管轰鸣（braam）、弦乐断奏固定音型、弦乐长音、合唱元音共振峰、
英雄主题铜管、钢琴、上升音效与反向镲、心跳，最后经大厅混响、总线压缩与限幅。

用法：python3 music.py build/score.wav
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile

from timeline import BAR, DURATION, HITS, GAPS, heartbeat_times

SR = 48000
N = int(SR * (DURATION + 1.0))
RNG = np.random.default_rng(20261025)


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, float) - 69.0) / 12.0)


def T(bar, step=0.0):
    """小节 + 十六分音符步 → 秒。"""
    return bar * BAR + step * BAR / 16.0


def in_gap(t):
    return any(a - 1e-6 <= t < b for a, b in GAPS)


# ---------------------------------------------------------------- 滤波与振荡器
def _sos(kind, f, order=2):
    if kind == "band":
        lo, hi = f
        return signal.butter(order, [max(lo, 10), min(hi, SR * 0.45)], "bandpass", fs=SR, output="sos")
    return signal.butter(order, min(max(f, 10), SR * 0.45), kind, fs=SR, output="sos")


def lp(x, f, order=2):
    return signal.sosfilt(_sos("low", f, order), x)


def hp(x, f, order=2):
    return signal.sosfilt(_sos("high", f, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos("band", (lo, hi), order), x)


def sweep(x, fcs, kind="low", block=256, width=0.35):
    """分块时变滤波：fcs 为每块的截止（或带通中心）频率。"""
    out = np.empty_like(x)
    zi = None
    for b, fc in enumerate(fcs):
        seg = x[b * block:(b + 1) * block]
        if seg.size == 0:
            break
        if kind == "band":
            sos = _sos("band", (fc * (1 - width), fc * (1 + width)))
        else:
            sos = _sos(kind, fc)
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[b * block:b * block + seg.size] = y
    return out


def block_curve(n, fn, block=256):
    tb = (np.arange((n + block - 1) // block) * block) / SR
    return fn(tb)


def saw(freq, n, phase=0.0):
    """PolyBLEP 抗混叠锯齿波；freq 可为标量或长度 n 的数组。"""
    dt = np.broadcast_to(np.asarray(freq, np.float64) / SR, (n,))
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def supersaw(freq, n, cents=(-14, -8, -3, 0, 3, 8, 14), vib=None, rng=RNG):
    out = np.zeros(n)
    for c in cents:
        f = freq * 2 ** (c / 1200.0)
        if vib is not None:
            f = f * vib
        out += saw(f, n, rng.random())
    return out / np.sqrt(len(cents))


def adsr(n, a, r, hold):
    """attack a 秒，保持到 hold 秒，指数释放 r 秒。"""
    t = np.arange(n) / SR
    env = np.minimum(1.0, t / max(a, 1e-4))
    rel = t > hold
    env[rel] *= np.exp(-(t[rel] - hold) / max(r, 1e-4))
    return env


def pan2(x, pan):
    a = (pan + 1.0) * np.pi / 4.0
    return np.stack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2.0)


# ---------------------------------------------------------------- 混音台
class Mix:
    SEND = dict(drums=0.22, hits=0.35, braam=0.30, ost=0.18, pad=0.55, choir=0.65,
                brass=0.35, piano=0.55, fx=0.45, heart=0.08)
    GAIN = dict(drums=1.0, hits=1.0, braam=1.0, ost=0.55, pad=0.8, choir=2.0,
                brass=1.0, piano=1.3, fx=1.2, heart=1.3)

    def __init__(self):
        self.buses = {k: np.zeros((2, N), np.float32) for k in self.SEND}

    def add(self, bus, sig, t0, pan=0.0, gain=1.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i0 = int(round(t0 * SR))
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], N - i0)
        if n > 0:
            self.buses[bus][:, i0:i0 + n] += (gain * sig[:, :n]).astype(np.float32)


# ---------------------------------------------------------------- 打击乐
def taiko(vel=1.0, pitch=1.0, dur=1.8, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = pitch * (1 + r.normal(0, 0.02))
    f = (46 + 95 * np.exp(-t / 0.03)) * p
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.5) + 0.35 * np.sin(1.6 * ph + 0.5) * np.exp(-t / 0.15)
    nz = r.standard_normal(n)
    skin = bp(nz, 150, 1800) * np.exp(-t / 0.018) * 1.2
    slap = hp(nz, 2500) * np.exp(-t / 0.004) * 0.35
    x = np.tanh(1.8 * (body + skin + slap)) * np.minimum(1, t / 0.0015)
    return x * vel


def hidrum(vel=1.0, pitch=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = (150 + 120 * np.exp(-t / 0.02)) * pitch * (1 + r.normal(0, 0.03))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.12)
    skin = bp(r.standard_normal(n), 400, 4500) * np.exp(-t / 0.012)
    return np.tanh(1.5 * (body + 0.8 * skin)) * vel


def tom(vel=1.0, pitch=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(1.0 * SR)
    t = np.arange(n) / SR
    f = (85 + 70 * np.exp(-t / 0.04)) * pitch
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.32)
    skin = bp(r.standard_normal(n), 200, 2500) * np.exp(-t / 0.015)
    return np.tanh(1.6 * (body + 0.7 * skin)) * vel


def snare(vel=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    tone = 0.6 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) + 0.3 * np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.03)
    nz = bp(r.standard_normal(n), 1200, 8000) * np.exp(-t / 0.11)
    return np.tanh(1.5 * (tone + nz)) * vel


def crash(dur=5.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):
        nz = r.standard_normal(n)
        x = hp(nz, 3500) * np.exp(-t / 1.3) + 0.4 * bp(nz, 6000, 13000) * np.exp(-t / 0.5)
        out.append(x * np.minimum(1, t / 0.002))
    return np.array(out) * 0.6


def boom(dur=4.0, f0=95, f1=30, decay=1.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t / 0.25)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / decay)
    return np.tanh(2.5 * x) * np.minimum(1, t / 0.003)


def anvil(dur=3.0, seed=0):
    """金属质感的冲击泛音层。"""
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for f in r.uniform(300, 2600, 9):
        x += np.sin(2 * np.pi * f * t + r.random() * 6.28) * np.exp(-t / r.uniform(0.3, 1.2))
    return x / 9.0


def heartbeat(gain=1.0):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for off, f0, f1, dec, amp in ((0.0, 75, 44, 0.09, 1.0), (0.24, 62, 40, 0.07, 0.65)):
        tt = t - off
        m = tt >= 0
        f = f1 + (f0 - f1) * np.exp(-tt[m] / 0.03)
        out[m] += amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt[m] / dec)
    return np.tanh(2.0 * lp(out, 180)) * gain


# ---------------------------------------------------------------- 音色
def braam(notes, dur, bright=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    growl = 1 + 0.35 * np.sin(2 * np.pi * 29 * t) * np.exp(-t / 0.7)
    fcs = block_curve(n, lambda tb: 380 + 2600 * bright * (1 - np.exp(-tb / 0.07)) * np.exp(-tb / 1.1))
    env = adsr(n, 0.03, 0.9, dur)
    for ch in range(2):
        src = np.zeros(n)
        for m in notes:
            src += supersaw(mtof(m), n, cents=(-16, -6, 0, 7, 15), rng=r)
        src = src * growl / np.sqrt(len(notes))
        y = sweep(sweep(src, fcs), fcs)
        out[ch] = np.tanh(2.2 * y) * env
    sub = np.sin(2 * np.pi * mtof(min(notes)) * t) * env
    return out + 0.4 * sub


def lowbrass(notes, dur, level=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int((dur + 1.0) * SR)
    env = adsr(n, 0.25, 0.6, dur)
    out = np.zeros((2, n))
    for ch in range(2):
        src = np.zeros(n)
        for m in notes:
            src += supersaw(mtof(m), n, cents=(-9, 0, 9), rng=r)
        out[ch] = np.tanh(1.4 * lp(src / np.sqrt(len(notes)), 650, order=4)) * env
    return out * level


def strings_pad(notes, dur, fc=3200, attack=0.6, release=1.2, seed=0):
    r = np.random.default_rng(seed)
    n = int((dur + release * 2.5) * SR)
    t = np.arange(n) / SR
    env = adsr(n, attack, release, dur)
    out = np.zeros((2, n))
    for ch in range(2):
        src = np.zeros(n)
        for m in notes:
            vib = 1 + 0.0018 * np.sin(2 * np.pi * r.uniform(4.6, 5.6) * t + r.random() * 6.28)
            src += supersaw(mtof(m), n, vib=vib, rng=r)
        out[ch] = hp(lp(src / np.sqrt(len(notes)), fc), 110) * env
    return out


FORMANTS = {"a": ((730, 1.0, 9), (1090, 0.55, 10), (2440, 0.28, 14)),
            "o": ((570, 1.0, 8), (840, 0.5, 9), (2410, 0.2, 14))}


def choir(notes, dur, vowel="a", attack=0.5, release=1.2, seed=0):
    r = np.random.default_rng(seed)
    n = int((dur + release * 2.5) * SR)
    t = np.arange(n) / SR
    env = adsr(n, attack, release, dur)
    out = np.zeros((2, n))
    fm = [(signal.iirpeak(f, q, fs=SR), g) for f, g, q in FORMANTS[vowel]]
    for ch in range(2):
        src = np.zeros(n)
        for m in notes:
            for _ in range(3):
                vib = 1 + 0.004 * np.sin(2 * np.pi * r.uniform(5.0, 6.0) * t + r.random() * 6.28)
                src += saw(mtof(m) * 2 ** (r.normal(0, 9) / 1200) * vib, n, r.random())
        src += 0.15 * r.standard_normal(n)
        y = sum(g * signal.lfilter(b, a, src) for (b, a), g in fm)
        out[ch] = hp(y, 150) * env / np.sqrt(len(notes) * 3)
    return out


def spic(m, vel, seed=0):
    """弦乐断奏。"""
    r = np.random.default_rng(seed)
    n = int(0.32 * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    s = saw(f * 1.003, n, r.random()) + saw(f * 0.997, n, r.random()) + 0.45 * saw(2 * f, n, r.random())
    s = lp(s, 1500 + 1800 * vel)
    env = (1 - np.exp(-t / 0.004)) * np.exp(-t / 0.085)
    return s * env * vel


def piano(m, vel=0.7, dur=5.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    B = 0.0004
    x = np.zeros(n)
    for k in range(1, 11):
        fk = k * f * np.sqrt(1 + B * k * k)
        if fk > SR * 0.45:
            break
        tau = 3.2 / (1 + 0.55 * k) * (440.0 / max(f, 110)) ** 0.3
        amp = (1.0 / k ** 1.1) * (0.6 + 0.4 * vel ** (0.5 * k))
        x += amp * (np.sin(2 * np.pi * fk * t + r.random()) + 0.5 * np.sin(2 * np.pi * fk * 1.0008 * t)) * np.exp(-t / tau)
    hammer = lp(r.standard_normal(n), 3000) * np.exp(-t / 0.005) * 0.15
    return (x / 4.0 + hammer) * vel * np.minimum(1, t / 0.002)


def melody_line(notes, timbre="brass", transpose=0, seed=0):
    """连奏旋律线：音高滑音、起音变亮、延迟颤音。notes = [(t0, dur, midi), ...]（绝对时间）。"""
    r = np.random.default_rng(seed)
    t_start = notes[0][0]
    t_end = notes[-1][0] + notes[-1][1]
    rel = 0.9
    n = int((t_end - t_start + rel) * SR)
    tt = np.arange(n) / SR
    target = np.zeros(n)
    gate = np.zeros(n)
    onset = np.zeros(n)
    since = np.zeros(n)
    for t0, d, m in notes:
        i0 = int((t0 - t_start) * SR)
        i1 = int((t0 + d - t_start) * SR)
        target[i0:i1] = mtof(m + transpose)
        gate[i0:i1] = 1.0
        onset[i0:] = np.exp(-(tt[i0:] - tt[i0]) / 0.28)
        since[i0:] = tt[i0:] - tt[i0]
    last = np.maximum.accumulate(np.where(target > 0, np.arange(n), 0))
    target = target[last]
    lf = np.log2(target)
    a = 1 - np.exp(-1 / (0.035 * SR))
    lf, _ = signal.lfilter([a], [1, -(1 - a)], lf, zi=[lf[0] * (1 - a)])
    vib = 1 + 0.0045 * np.clip((since - 0.3) / 0.5, 0, 1) * np.sin(2 * np.pi * 5.2 * tt)
    freq = 2 ** lf * vib
    ga = 1 - np.exp(-1 / (0.07 * SR))
    amp, _ = signal.lfilter([ga], [1, -(1 - ga)], gate, zi=[0.0])
    out = np.zeros((2, n))
    for ch in range(2):
        if timbre == "brass":
            src = supersaw(freq, n, cents=(-8, -3, 0, 4, 9), rng=r)
            b = 0.35 + 0.65 * onset
            y = lp(src, 950) * (1 - b) + lp(src, 4200) * b
            y = np.tanh(1.3 * y) * amp * (0.85 + 0.15 * onset)
        else:
            src = supersaw(freq, n, rng=r)
            y = hp(lp(src, 3600), 150) * amp
        out[ch] = y
    return out


def riser(dur, f_lo=300, f_hi=9000, tonal=True, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    prog = t / dur
    out = np.zeros((2, n))
    fcs = block_curve(n, lambda tb: f_lo * (f_hi / f_lo) ** np.clip(tb / dur, 0, 1) ** 1.4)
    for ch in range(2):
        x = sweep(r.standard_normal(n), fcs, kind="band", width=0.3) * prog ** 2.2
        if tonal:
            f = mtof(50) * (mtof(74) / mtof(50)) ** prog ** 1.6
            x += 0.35 * lp(saw(f, n, r.random()) + saw(f * 1.5, n, r.random()), 2500) * prog ** 3
        out[ch] = x
    return out


def reverse_swell(dur, seed=0):
    c = crash(dur + 0.3, seed)[:, ::-1][:, -int(dur * SR):]
    n = c.shape[1]
    t = np.arange(n) / SR
    rumble = lp(np.random.default_rng(seed + 1).standard_normal(n), 220) * (t / dur) ** 3 * 2.0
    return c * 1.4 + rumble


def drone(dur, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 36.71 * t) + 0.6 * np.sin(2 * np.pi * 73.42 * t) + 0.25 * np.sin(2 * np.pi * 110.0 * t))
    x *= 1 + 0.15 * np.sin(2 * np.pi * 0.21 * t)
    wind = lp(r.standard_normal(n), 380) * (1 + 0.5 * np.sin(2 * np.pi * 0.13 * t)) * 0.6
    fade = np.minimum(1, t / 3.0) * np.minimum(1, (dur - t) / 1.0)
    return np.stack([x + wind, x + np.roll(wind, 4800)]) * fade


# ---------------------------------------------------------------- 和声
PC = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "Bb": 10, "B": 11}
CHORD_PCS = {"Dm": (2, 5, 9), "Bb": (10, 2, 5), "F": (5, 9, 0), "C": (0, 4, 7), "Gm": (7, 10, 2),
             "A": (9, 1, 4), "D": (2, 6, 9), "G": (7, 11, 2), "Bm": (11, 2, 6)}

CHORDS = {}


def _set(b0, names):
    for i, nme in enumerate(names):
        CHORDS[b0 + i] = nme


_set(0, ["Dm"] * 8)
_set(8, ["Dm", "Dm", "Bb", "Bb", "F", "F", "C", "C"])
_set(16, ["Dm", "Dm", "Bb", "C"])
_set(20, ["Dm", "Bb", "F", "C"] * 2)
_set(28, ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"] * 2)
_set(44, ["Bb", "C", "Gm", "A"])
_set(48, ["Dm", "Dm", "Bb", "A"])
_set(52, ["Dm", "Bb", "F", "C"] * 3)
_set(64, ["Bb", "C", "Dm", "Dm", "Bb", "C", "Gm", "A"])
_set(72, ["A"] * 4)
_set(76, ["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A", "Bb", "C", "Bb", "A"])
_set(88, ["D", "D", "G", "D", "Bm", "G", "A", "D"])
_set(96, ["D"] * 4)


def root(ch):
    return CHORD_PCS[ch][0]


def bass_note(ch):
    m = 36 + root(ch)
    return m - 12 if m > 44 else m


def ost_root(ch):
    m = 48 + root(ch)
    return m - 12 if m > 56 else m


def voicing(ch, lo, count=4):
    """在 lo 以上取和弦音（根、三、五、根八度）。"""
    pcs = CHORD_PCS[ch]
    notes = []
    m = lo
    while len(notes) < count:
        if m % 12 in pcs:
            notes.append(m)
        m += 1
    return notes


def third(ch):
    pcs = CHORD_PCS[ch]
    return (pcs[1] - pcs[0]) % 12


# 英雄主题（拍, 时值拍, MIDI）：Dm Bb F C | Dm Bb Gm A
THEME = [(0, 3, 74), (3, 1, 69), (4, 2, 70), (6, 1, 72), (7, 1, 74), (8, 3, 72), (11, 1, 77), (12, 4, 76),
         (16, 2, 74), (18, 1, 77), (19, 1, 81), (20, 3, 82), (23, 1, 81), (24, 2, 79), (26, 1, 77), (27, 1, 79),
         (28, 4, 81)]
THEME_END = [(32, 2, 82), (34, 2, 81), (36, 2, 79), (38, 2, 84), (40, 4, 86), (44, 4, 85)]


def theme_at(bar0, phrase, beat=0.5):
    return [(T(bar0) + b * beat, d * beat, m) for b, d, m in phrase]


# ---------------------------------------------------------------- 编曲
def arrange(mx):
    seed = iter(range(1, 10 ** 6))

    def impact(t, s):
        mx.add("hits", boom(4.5, 90 + 25 * s, 28, 0.8 + 0.8 * s), t, gain=0.85 * s)
        for k, (dt, p) in enumerate(((0.0, 0.85), (0.012, 1.0), (0.024, 1.25))):
            mx.add("hits", taiko(1.0, p, seed=next(seed)), t + dt, pan=(k - 1) * 0.35, gain=0.55 * s)
        mx.add("hits", crash(5.0, next(seed)), t, gain=0.5 * s)
        mx.add("hits", anvil(3.0, next(seed)), t, gain=0.12 * s)

    for t, s in HITS:
        impact(t, s)
    # 第二次大冲击额外加厚
    mx.add("hits", boom(5.0, 120, 26, 2.0), 152.0, gain=0.6)
    mx.add("hits", crash(6.0, 999), 152.0, gain=0.4)

    def ostinato(b0, b1, v0, v1):
        acc = {0: 1.0, 3: 0.85, 6: 0.9, 10: 0.85, 12: 0.95}
        for b in range(b0, b1):
            ch = CHORDS[b]
            r = ost_root(ch)
            pat = [r + 12, r, r + 7, r, r + 12, r, r + 7, r, r + 12, r, r + 7, r, r + third(ch) + 12, r, r + 7, r]
            v = v0 + (v1 - v0) * (b - b0) / max(1, b1 - b0 - 1)
            for s, m in enumerate(pat):
                t = T(b, s)
                if in_gap(t):
                    continue
                vel = v * acc.get(s, 0.62)
                mx.add("ost", spic(m, vel, next(seed)), t, pan=-0.35, gain=1.0)
                mx.add("ost", spic(m + 12 if s % 4 == 0 else m, vel * 0.7, next(seed)), t + 0.008, pan=0.35, gain=1.0)

    ostinato(8, 16, 0.4, 0.85)
    ostinato(18, 48, 0.6, 0.95)
    ostinato(52, 74, 0.8, 1.0)
    ostinato(76, 88, 1.0, 1.0)

    def drums(b, pattern, gain=1.0, pitch=1.0):
        for s, v in pattern:
            t = T(b, s)
            if not in_gap(t):
                mx.add("drums", taiko(v, pitch * (0.92 + 0.16 * RNG.random()), seed=next(seed)), t,
                       pan=RNG.uniform(-0.25, 0.25), gain=0.5 * gain)

    P_LIGHT = [(0, 0.8), (8, 0.6)]
    P_MID = [(0, 1.0), (6, 0.6), (8, 0.9), (11, 0.5), (14, 0.6)]
    P_DRIVE = [(0, 1.0), (3, 0.55), (6, 0.75), (8, 0.95), (10, 0.5), (12, 0.8), (14, 0.65), (15, 0.5)]
    P_EPIC = [(0, 1.0), (3, 0.7), (6, 0.85), (8, 1.0), (11, 0.7), (12, 0.9), (14, 0.8), (15, 0.6)]
    P_TITLE = [(0, 1.0), (6, 0.5), (8, 0.85), (10, 0.6), (12, 0.45)]

    for b in range(8, 12):
        drums(b, P_LIGHT, 0.8)
    for b in range(12, 16):
        drums(b, P_MID, 0.9)
    for b in range(16, 20):
        drums(b, P_TITLE, 1.0, 0.9)
    for b in range(20, 28):
        drums(b, P_MID, 0.95)
    for b in range(28, 48):
        drums(b, P_DRIVE, 1.0)
    for b in range(51, 52):
        drums(b, [(s, 0.4 + 0.04 * s) for s in range(0, 16, 2)], 0.9)
    for b in range(52, 64):
        drums(b, P_DRIVE, 1.0)
    for b in range(64, 72):
        drums(b, P_EPIC, 1.0)
    for b in range(76, 86):
        drums(b, P_EPIC, 1.1)
    for b in (88, 89, 90, 91):
        drums(b, [(0, 0.9 - 0.15 * (b - 88))], 1.0, 0.85)

    # 高音小鼓的十六分律动
    for b in list(range(28, 48)) + list(range(52, 74)) + list(range(76, 88)):
        dense = b >= 64
        for s in range(16):
            if s % 2 == 1 or dense:
                t = T(b, s)
                if not in_gap(t):
                    v = (0.35 if s % 4 == 2 else 0.22) * (1.3 if b >= 76 else 1.0)
                    mx.add("drums", hidrum(v, 1.0 + 0.3 * (s % 3 == 0), next(seed)), t,
                           pan=0.45 if s % 2 else -0.45, gain=0.35)

    # 段落前的通鼓加花
    def tom_fill(t_end, length=1.0, steps=8):
        for i in range(steps):
            t = t_end - length + i * length / steps
            mx.add("drums", tom(0.5 + 0.5 * i / steps, 1.4 - 0.6 * i / steps, next(seed)), t,
                   pan=0.5 - i / steps, gain=0.45)

    for te in (44, 56, 72, 84, 118, 128):
        tom_fill(te)
    tom_fill(31.75, 2.0, 16)
    tom_fill(176.0, 2.0, 16)
    tom_fill(148.0, 2.0, 16)

    def snare_roll(t0, t1, v0=0.1, v1=0.8):
        t = t0
        while t < t1:
            p = (t - t0) / (t1 - t0)
            mx.add("drums", snare(v0 + (v1 - v0) * p ** 1.5, next(seed)), t, pan=0.1, gain=0.3)
            t += 0.125 if p < 0.4 else (0.0625 if p < 0.8 else 0.03125)

    snare_roll(29.75, 31.75)
    snare_roll(94.0, 95.9, 0.05, 0.5)
    snare_roll(102.0, 104.0)
    snare_roll(146.0, 148.0, 0.15, 0.9)
    snare_roll(174.0, 176.0, 0.15, 0.9)
    for b in (86, 87):
        for s in range(0, 16, 2):
            mx.add("drums", snare(0.5, next(seed)), T(b, s), gain=0.25)

    # 铜管轰鸣
    mx.add("braam", braam([26, 38, 45, 50, 53], 3.6, 1.0, next(seed)), 32.0, gain=0.42)
    mx.add("braam", braam([34, 46, 53, 58, 62], 3.4, 0.8, next(seed)), 36.0, gain=0.36)
    mx.add("braam", braam([26, 38, 45, 50, 53], 3.8, 1.0, next(seed)), 152.0, gain=0.48)
    mx.add("braam", braam([26, 38, 45, 50, 53], 3.6, 0.8, next(seed)), 160.0, gain=0.34)
    mx.add("braam", braam([34, 46, 53, 58, 62], 3.6, 0.8, next(seed)), 168.0, gain=0.34)
    mx.add("braam", braam([26, 38, 45, 50, 54, 57], 5.5, 1.0, next(seed)), 176.0, gain=0.45)
    for t in (44, 56, 72, 84, 104, 118, 128):
        ch = CHORDS[int(t // BAR)]
        mx.add("braam", braam([bass_note(ch), bass_note(ch) + 7, bass_note(ch) + 12], 1.6, 0.6, next(seed)), t, gain=0.22)

    # 低音铜管长音（随和弦）
    def low_brass(b0, b1, level):
        for b in range(b0, b1):
            ch = CHORDS[b]
            r = bass_note(ch)
            t = T(b)
            if in_gap(t):
                continue
            mx.add("braam", lowbrass([r, r + 7, r + 12], BAR * 0.98, level, next(seed)), t, gain=0.5)

    low_brass(10, 16, 0.25)
    low_brass(20, 48, 0.32)
    low_brass(52, 74, 0.38)
    low_brass(76, 88, 0.5)
    mx.add("braam", lowbrass([33, 40, 45], 3.4, 0.5, next(seed)), 148.0, gain=0.5)

    # 弦乐长音
    def pads(b0, b1, lo, gain, fc=3200, every=1):
        for b in range(b0, b1, every):
            ch = CHORDS[b]
            mx.add("pad", strings_pad(voicing(ch, lo), BAR * every, fc, 0.4, 0.9, next(seed)), T(b),
                   gain=gain)

    mx.add("pad", strings_pad([50, 57, 62, 65], 14.0, 900, 3.0, 1.5, next(seed)), 2.0, gain=0.2)
    pads(12, 16, 55, 0.35, 2200, 2)
    pads(16, 20, 62, 0.4, 3200)
    pads(20, 28, 57, 0.25, 2600, 2)
    pads(28, 48, 62, 0.32, 3400)
    mx.add("pad", strings_pad([50, 57, 62, 65], 7.5, 1100, 1.5, 1.5, next(seed)), 96.0, gain=0.2)
    pads(52, 74, 62, 0.34, 3600)
    pads(76, 88, 62, 0.40, 4200)
    pads(88, 96, 62, 0.24, 2400)
    mx.add("pad", strings_pad([50, 57, 62, 66, 69], 7.0, 1800, 0.5, 2.0, next(seed)), 192.0, gain=0.2)

    # 合唱
    def choirs(b0, b1, lo, gain, vowel="a", every=1):
        for b in range(b0, b1, every):
            ch = CHORDS[b]
            mx.add("choir", choir(voicing(ch, lo, 5), BAR * every, vowel, 0.4, 1.0, next(seed)), T(b), gain=gain)

    mx.add("choir", choir([50, 57, 62, 65, 69], 3.8, "a", 0.3, 1.2, next(seed)), 32.0, gain=1.0)
    mx.add("choir", choir([46, 53, 58, 62, 65], 3.8, "a", 0.3, 1.2, next(seed)), 36.0, gain=0.9)
    choirs(36 + 0, 48, 55, 0.45, "o", 2)
    choirs(59, 74, 55, 0.6, "a")
    choirs(76, 88, 55, 0.95, "a")
    mx.add("choir", choir([50, 57, 62, 66, 69, 74], 7.0, "a", 0.2, 2.5, next(seed)), 176.0, gain=1.0)
    mx.add("choir", choir([50, 57, 62, 66], 6.0, "o", 1.5, 2.5, next(seed)), 184.0, gain=0.55)

    # 英雄主题
    def line(notes, timbre, transpose, gain):
        mx.add("brass", melody_line(notes, timbre, transpose, next(seed)), notes[0][0], gain=gain)

    line(theme_at(28, THEME), "brass", -12, 0.55)
    line(theme_at(36, THEME), "strings", 0, 0.45)
    line(theme_at(36, THEME), "brass", -12, 0.32)
    rise = [(T(64 + i), BAR, m) for i, m in enumerate((74, 76, 77, 81, 77, 79, 82, 81))]
    line(rise, "strings", 0, 0.45)
    line(rise, "brass", -12, 0.3)
    climax = theme_at(76, THEME + THEME_END) + [(176.0, 4.0, 86)]
    line(climax, "brass", 0, 0.6)
    line(climax, "brass", -12, 0.5)
    line(climax, "strings", 0, 0.45)
    line(theme_at(76, THEME[8:] + THEME_END) + [(176.0, 4.0, 86)], "strings", 12, 0.22)

    # 钢琴（开头、呼吸段、结尾）
    def pno(seq, gain=1.0):
        for t, m, v in seq:
            mx.add("piano", piano(m, v, 5.0, next(seed)), t, pan=0.15 * np.sign(m - 66), gain=gain)

    pno([(4, 74, .55), (5, 69, .45), (6, 77, .55), (7, 76, .5), (8, 74, .55), (9, 72, .45), (10, 69, .5),
         (12, 74, .6), (13, 69, .5), (14, 77, .6), (14.5, 79, .6), (15, 81, .7),
         (4, 50, .45), (4, 57, .35), (8, 46, .45), (8, 53, .35), (12, 50, .5), (12, 57, .4)])
    pno([(96, 74, .5), (97, 69, .42), (98, 77, .5), (99, 76, .45), (100, 74, .5), (101, 72, .45),
         (102, 70, .5), (103, 69, .55), (96, 50, .4), (100, 46, .4), (102, 45, .4)])
    pno([(180, 74, .5), (181, 69, .42), (182, 78, .5), (183, 76, .45), (184, 74, .5), (185, 71, .45),
         (186, 74, .45), (187, 78, .5), (188, 76, .5), (190, 74, .55), (192, 62, .45), (192, 50, .4),
         (180, 50, .4), (184, 47, .4), (186, 43, .4), (188, 45, .4)], 0.9)

    # 心跳
    for t in heartbeat_times():
        g = 0.55
        if t < 16:
            g = 0.3 + 0.4 * t / 16
        elif t < 20:
            g = 0.6 * (20 - t) / 4 + 0.1
        elif t >= 180:
            g = 0.4 * (1 - (t - 180) / 14)
        mx.add("heart", heartbeat(g), t, gain=1.0)

    # 氛围与音效
    mx.add("pad", drone(16.5, next(seed)), 0.0, gain=0.1)
    mx.add("pad", drone(8.5, next(seed)), 96.0, gain=0.09)
    for t0, t1, g in ((12.0, 16.0, 0.25), (27.75, 31.75, 0.45), (92.0, 95.9, 0.3), (100.0, 104.0, 0.4),
                      (144.0, 148.0, 0.55), (172.0, 176.0, 0.4)):
        mx.add("fx", riser(t1 - t0, seed=next(seed)), t0, gain=g)
    for t1, d, g in ((16.0, 3.0, 0.3), (31.75, 2.5, 0.45), (104.0, 2.5, 0.4), (151.5, 3.5, 0.6), (176.0, 2.0, 0.35)):
        mx.add("fx", reverse_swell(d, next(seed)), t1 - d, gain=g)


# ---------------------------------------------------------------- 母带
def hall_ir(rt60=3.4, length=4.5, seed=5):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    pre = int(0.025 * SR)
    for ch in range(2):
        nz = r.standard_normal(n)
        x = lp(nz, 1500) * np.exp(-6.9 * t / rt60) + 0.5 * hp(nz, 1500) * np.exp(-6.9 * t / (rt60 * 0.4))
        x = np.roll(x, pre)
        x[:pre] = 0
        for _ in range(10):
            k = pre + int(r.uniform(0.005, 0.08) * SR)
            x[k] += r.uniform(-1, 1) * 3.0
        ir[ch] = x / np.sqrt(np.sum(x ** 2))
    return ir


def master(mx):
    ir = hall_ir()
    dry = np.zeros((2, N))
    send = np.zeros((2, N))
    for k, b in mx.buses.items():
        dry += b * Mix.GAIN[k]
        send += b * Mix.SEND[k]
    wet = np.stack([signal.oaconvolve(send[c], ir[c])[:N] for c in range(2)])
    x = dry + 0.9 * wet
    x = np.stack([hp(c, 28) for c in x])

    # 静默空拍
    t = np.arange(N) / SR
    g = np.ones(N)
    for a, b in GAPS:
        g *= 1 - np.clip((t - a) / 0.02, 0, 1) * (t < b)
    x *= g

    # 总线压缩（10 ms 块 RMS，2:1，起 30 ms 释 250 ms）
    blk = 480
    nb = N // blk
    mono = np.sqrt(np.mean((x[:, :nb * blk] ** 2).reshape(2, nb, blk), axis=(0, 2)) + 1e-12)
    thr = np.percentile(mono[mono > 1e-4], 90)
    gain = np.ones(nb)
    gcur = 1.0
    aa, ar = np.exp(-blk / (0.03 * SR)), np.exp(-blk / (0.25 * SR))
    for i in range(nb):
        target = 1.0 if mono[i] <= thr else (mono[i] / thr) ** (1 / 2 - 1)
        k = aa if target < gcur else ar
        gcur = k * gcur + (1 - k) * target
        gain[i] = gcur
    gs = np.interp(np.arange(N), np.arange(nb) * blk + blk / 2, gain)
    x *= gs

    x /= np.percentile(np.abs(x), 99.95) + 1e-9
    x = np.tanh(1.1 * x) / np.tanh(1.1)
    x *= 0.89 / (np.max(np.abs(x)) + 1e-9)
    fade = np.clip((DURATION + 0.5 - t) / 4.0, 0, 1)
    x *= fade
    return x, {k: float(np.sqrt(np.mean(b ** 2))) for k, b in mx.buses.items()}


def main(path):
    mx = Mix()
    arrange(mx)
    x, rms = master(mx)
    print("bus RMS:", {k: round(v, 4) for k, v in rms.items()})
    d = (RNG.random(x.shape) - RNG.random(x.shape)) / 32768.0
    pcm = np.clip((x + d) * 32767, -32768, 32767).astype(np.int16)
    wavfile.write(path, SR, pcm.T[: int(SR * DURATION)])
    print("wrote", path)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "build/score.wav")
