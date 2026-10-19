#!/usr/bin/env python3
"""最会用脑 · 配乐

完全程序化合成的史诗 / 热血风格配乐：120 BPM，D 小调，高潮处升到 E 小调。
乐器全部由振荡器、噪声和滤波器合成——太鼓、军鼓、弦乐固定音型、铜管、合唱、上升音效与冲击音。
段落与 timeline.json 的画面节点逐拍对齐（一小节 = 2 秒）。

用法：python3 music.py  → 生成 music.wav
"""
import json
from pathlib import Path

import numpy as np
from scipy import signal as sg
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, minimum_filter1d, uniform_filter1d

HERE = Path(__file__).parent
TL = json.loads((HERE / 'timeline.json').read_text())
SR = 44100
DUR = TL['duration']
BEAT = 60 / TL['bpm']
BAR = 4 * BEAT
S16 = BEAT / 4
N = int(SR * DUR)
rng = np.random.default_rng(7)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------- 混音总线 ----------
BUS = {k: np.zeros((2, N)) for k in ('drums', 'music', 'fx')}
VERB = np.zeros((2, N))
KICKS = []


def place(sig, t, bus='music', gain=1.0, pan=0.0, verb=0.2):
    """把单声道或立体声信号放到时间 t（秒）处。"""
    i0 = int(round(t * SR))
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        st = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    else:
        st = sig
    st = st * gain
    if i0 < 0:
        st, i0 = st[:, -i0:], 0
    n = min(st.shape[1], N - i0)
    if n <= 0:
        return
    BUS[bus][:, i0:i0 + n] += st[:, :n]
    if verb:
        VERB[:, i0:i0 + n] += st[:, :n] * verb


# ---------- 基础构件 ----------
def tt(n):
    return np.arange(n) / SR


def env(dur, a=0.005, d=0.0, s=1.0, r=0.1):
    n = int((dur + r) * SR)
    t = tt(n)
    att = np.clip(t / a, 0, 1) if a > 0 else np.ones(n)
    dec = s + (1 - s) * np.exp(-np.maximum(t - a, 0) / d) if d > 0 else np.ones(n)
    rel = np.clip(1 - (t - dur) / r, 0, 1) ** 2 if r > 0 else (t < dur).astype(float)
    return att * dec * rel


def saw(freq, n):
    """polyBLEP 抗混叠锯齿波；freq 可以是常数或逐样本数组。"""
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    p = (np.cumsum(dt) + rng.random()) % 1.0
    y = 2 * p - 1
    m = p < dt
    x = p[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = p > 1 - dt
    x = (p[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def noise(n):
    return rng.standard_normal(n)


def lp(x, fc, order=2):
    return sg.sosfilt(sg.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)


def hp(x, fc, order=2):
    return sg.sosfilt(sg.butter(order, fc, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sg.sosfilt(sg.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)


def tv_lp(x, fc, q=0.85, block=128):
    """随时间变化截止频率的低通（逐块更新系数，携带滤波器状态）。"""
    y = np.zeros_like(x)
    zi = np.zeros(2)
    for s in range(0, len(x), block):
        f = float(np.clip(fc[min(s + block // 2, len(fc) - 1)], 30, SR * 0.45))
        w0 = 2 * np.pi * f / SR
        al, cw = np.sin(w0) / (2 * q), np.cos(w0)
        b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2]) / (1 + al)
        a = np.array([1 + al, -2 * cw, 1 - al]) / (1 + al)
        y[s:s + block], zi = sg.lfilter(b, a, x[s:s + block], zi=zi)
    return y


def fit(x, n):
    return x[:n] if len(x) >= n else np.pad(x, (0, n - len(x)))


# ---------- 和声 ----------
CHORDS = {
    'Dm': (38, [0, 3, 7]), 'Bb': (34, [0, 4, 7]), 'F': (41, [0, 4, 7]), 'C': (36, [0, 4, 7]),
    'A': (33, [0, 4, 7]), 'Em': (40, [0, 3, 7]), 'G': (43, [0, 4, 7]), 'D': (38, [0, 4, 7]),
    'B': (35, [0, 4, 7]), 'E': (40, [0, 4, 7]),
}
PROG = {}


def setp(b0, names):
    for k, nm in enumerate(names):
        PROG[b0 + k] = nm


setp(0, ['Dm', 'Dm', 'Dm', 'Dm', 'Bb', 'F', 'C', 'A'])
for c in range(3):
    setp(8 + 4 * c, ['Dm', 'Bb', 'F', 'C'])
setp(20, ['Bb', 'C', 'A', 'A'])
for c in range(6):
    setp(24 + 4 * c, ['Dm', 'Bb', 'F', 'C'])
setp(48, ['Bb', 'C', 'D', 'B'])
for c in range(2):
    setp(52 + 4 * c, ['Em', 'C', 'G', 'D'])
setp(60, ['E'] * 6)


def into(m, lo, hi):
    while m < lo:
        m += 12
    while m > hi:
        m -= 12
    return m


def voicing(ch, lo, hi):
    root, iv = CHORDS[ch]
    return sorted({root + i + 12 * k for i in iv for k in range(-2, 7) if lo <= root + i + 12 * k <= hi})


# ---------- 乐器 ----------
def kick(v=1.0):
    n = int(0.6 * SR)
    t = tt(n)
    f = 45 + 110 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3)
    click = lp(noise(n), 5000) * np.exp(-t / 0.004) * 0.35
    return (body + click) * v


def taiko(v=1.0, base=62.0, length=1.4):
    n = int(length * SR)
    t = tt(n)
    f = base * (1 + 0.55 * np.exp(-t / 0.045))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t / 0.42) + 0.35 * np.sin(2.32 * ph) * np.exp(-t / 0.12)
    skin = bp(noise(n), 120, 1400) * np.exp(-t / 0.05) * 0.6
    return np.tanh((body + skin) * 1.4) * v


def snare(v=1.0):
    n = int(0.9 * SR)
    t = tt(n)
    nz = bp(noise(n), 1100, 9500) * np.exp(-t / 0.17)
    tone = np.sin(2 * np.pi * 186 * t) * np.exp(-t / 0.06) * 0.7
    return (nz * 0.8 + tone) * v


def hat(v=1.0):
    n = int(0.12 * SR)
    return hp(noise(n), 7500) * np.exp(-tt(n) / 0.03) * v


def crash(v=1.0, length=3.2):
    n = int(length * SR)
    t = tt(n)
    nz = hp(noise(n), 3200) * np.exp(-t / 0.95)
    ring = sum(np.sin(2 * np.pi * f * t + rng.random() * 6) for f in (3127, 4271, 5533, 6949, 8212)) * 0.08
    att = np.clip(t / 0.002, 0, 1)
    return lp(nz + ring * np.exp(-t / 1.3), 13000) * att * v


def reverse_crash(length=1.6, v=1.0):
    c = crash(1.0, length)[::-1]
    return c * np.clip(np.linspace(0, 1, len(c)) ** 1.5, 0, 1) * v


def boom(v=1.0, length=3.5):
    n = int(length * SR)
    t = tt(n)
    f = 28 + 34 * np.exp(-t / 0.5)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.2)
    thud = lp(noise(n), 300) * np.exp(-t / 0.15) * 1.2
    return np.tanh((sub + thud) * 1.5) * v


def heartbeat(v=1.0):
    n = int(0.6 * SR)
    t = tt(n)

    def thump(delay, a):
        tt_ = np.maximum(t - delay, 0)
        f = 38 + 22 * np.exp(-tt_ / 0.04)
        s = np.sin(2 * np.pi * np.cumsum(f * (t >= delay)) / SR)
        return s * np.exp(-tt_ / 0.09) * np.clip(tt_ / 0.004, 0, 1) * (t >= delay) * a

    return (thump(0, 1.0) + thump(0.22, 0.7)) * v


def bell(m, v=1.0, decay=2.6):
    n = int((decay * 1.6) * SR)
    t = tt(n)
    f0 = mtof(m)
    out = np.zeros(n)
    for ratio, amp, dk in ((1, 1, 1), (2, 0.45, 1.6), (3, 0.25, 2.2), (4.18, 0.16, 3), (5.43, 0.1, 3.8), (6.8, 0.06, 4.6)):
        if f0 * ratio < SR * 0.45:
            out += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t * dk / decay)
    return out * np.clip(t / 0.003, 0, 1) * v


def riser(length=4.0, v=1.0):
    n = int(length * SR)
    t = tt(n)
    x = t / length
    nz = tv_lp(hp(noise(n), 200), 300 * (40 ** x), q=2.5)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (2.5 * x)) / SR) * 0.25
    tone2 = np.sin(2 * np.pi * np.cumsum(330 * 2 ** (2.5 * x)) / SR) * 0.15
    return (nz * 0.8 + tone + tone2) * x ** 2.2 * v


def string_note(m, dur, cutoff, stereo=True):
    """弦乐断奏音（固定音型用）：左右声道各一层失谐锯齿。"""
    e = env(dur, a=0.004, d=0.06, s=0.55, r=0.05)
    n = len(e)
    f = mtof(m)
    L = lp(saw(f * 2 ** (-6 / 1200), n) + 0.4 * saw(f * 2, n), cutoff) * e
    R = lp(saw(f * 2 ** (6 / 1200), n) + 0.4 * saw(f * 2, n), cutoff) * e
    return np.vstack([L, R])


def pad_chord(notes, dur, cutoff=2400, a=0.25, r=0.6, vib=0.003):
    e = env(dur, a=a, r=r)
    n = len(e)
    t = tt(n)
    out = np.zeros((2, n))
    for k, m in enumerate(notes):
        f = mtof(m)
        for d, side in ((-9, 0), (0, None), (9, 1)):
            fv = f * 2 ** (d / 1200) * (1 + vib * np.sin(2 * np.pi * (4.6 + 0.3 * k) * t + rng.random() * 6))
            s = saw(fv, n)
            if side is None:
                out += s * 0.5
            else:
                out[side] += s
    out = np.vstack([lp(hp(ch, 110), cutoff) for ch in out]) * e / max(1, len(notes))
    return out


def choir_chord(notes, dur, a=0.4, r=0.8):
    e = env(dur, a=a, r=r)
    n = len(e)
    t = tt(n)
    raw = np.zeros((2, n))
    for k, m in enumerate(notes):
        f = mtof(m)
        for side in (0, 1):
            for d in (-7, 7):
                fv = f * 2 ** ((d + (side - 0.5) * 4) / 1200) * (1 + 0.004 * np.sin(2 * np.pi * (5.1 + 0.2 * k + side * 0.13) * t + rng.random() * 6))
                raw[side] += saw(fv, n)
    out = np.vstack([bp(ch, 600, 860) + 0.6 * bp(ch, 1000, 1300) + 0.3 * bp(ch, 2400, 3000) + 0.12 * lp(ch, 900) for ch in raw])
    return out * e / max(1, len(notes))


def brass(notes, dur, v=1.0, bright=7.0, a=0.02, scoop=True):
    """铜管：失谐锯齿 + 滤波包络，带一点起音滑音。"""
    e = env(dur, a=a, d=0.35, s=0.75, r=0.18)
    n = len(e)
    t = tt(n)
    fenv = np.clip(t / 0.05, 0, 1) * (0.45 + 0.55 * np.exp(-t / 0.35))
    sc = 2 ** ((-30 * np.exp(-t / 0.04)) / 1200) if scoop else 1.0
    out = np.zeros((2, n))
    for m in notes:
        f = mtof(m)
        for side, d in ((0, -7), (1, 7)):
            out[side] += saw(f * 2 ** (d / 1200) * sc, n) + 0.6 * saw(f * 2 ** (-d / 2400) * sc, n)
    base = mtof(min(notes))
    fc = base * (1.2 + bright * fenv)
    out = np.vstack([np.tanh(tv_lp(ch, fc) * 0.9) for ch in out])
    return out * e * v / max(1, len(notes)) ** 0.5


def lead_note(m, dur, v=1.0):
    e = env(dur, a=0.03, d=0.4, s=0.8, r=0.22)
    n = len(e)
    t = tt(n)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.25) / 0.3, 0, 1)
    f = mtof(m) * vib
    fenv = np.clip(t / 0.06, 0, 1) * (0.6 + 0.4 * np.exp(-t / 0.5))
    out = np.zeros((2, n))
    for side, d in ((0, -5), (1, 5)):
        s = saw(f * 2 ** (d / 1200), n) + 0.5 * saw(f * 2 ** ((-d) / 1200) * 0.5, n)
        out[side] = np.tanh(tv_lp(s, mtof(m) * (2 + 5 * fenv)) * 1.1)
    return out * e * v


def braam(root, v=1.0, length=3.0):
    notes = [root - 12, root, root + 7, root + 12]
    n = int((length + 0.8) * SR)
    t = tt(n)
    e = env(length, a=0.01, d=1.2, s=0.5, r=0.8)
    fc = 80 + 2200 * np.clip(t / 0.12, 0, 1) * np.exp(-t / 0.9)
    out = np.zeros(n)
    for m in notes:
        for d in (-12, -4, 4, 12):
            out += saw(mtof(m) * 2 ** (d / 1200), n)
    out = np.tanh(tv_lp(out / 8, fc, q=1.4) * 2.5)
    return out * e[:n] * v


# ---------- 编排 ----------
def bt(b, step=0):
    return b * BAR + step * S16


def K(t, v=1.0):
    place(kick(v), t, 'drums', gain=0.55, verb=0.04)
    KICKS.append((t, v))


def TK(t, v=1.0, base=62.0, pan=0.0):
    place(taiko(v, base), t, 'drums', gain=0.45 if base < 70 else 0.55, pan=pan, verb=0.3)
    if base < 70:
        KICKS.append((t, v * 0.6))


def SN(t, v=1.0):
    place(snare(v), t, 'drums', gain=0.55, verb=0.45)


def HH(t, v=1.0, pan=0.25):
    place(hat(v), t, 'drums', gain=0.18, pan=pan, verb=0.05)


def CR(t, v=1.0, pan=0.0):
    place(crash(v), t, 'drums', gain=0.32, pan=pan, verb=0.25)


def TOM(t, v, base, pan):
    place(taiko(v, base, 0.8), t, 'drums', gain=0.45, pan=pan, verb=0.3)


def fill(b):
    for k, (st, base, pan) in enumerate(((12, 150, 0.5), (13, 125, 0.25), (14, 100, -0.25), (15, 82, -0.5))):
        TOM(bt(b, st), 0.75 + 0.06 * k, base, pan)


def epic_bar(b, big=False):
    for st in (0, 6, 10) + ((14,) if big else ()):
        K(bt(b, st), 1.0 if st == 0 else 0.8)
    for st, v in ((0, 1.0), (3, 0.6), (6, 0.85), (8, 0.7), (11, 0.6), (14, 0.75)):
        TK(bt(b, st), v, 60 if st in (0, 6) else 72, pan=(-0.2 if st % 2 else 0.2))
    SN(bt(b, 8), 1.0)
    if big:
        SN(bt(b, 8) - 0.03, 0.4)
    for st in range(0, 16, 2):
        HH(bt(b, st), 1.0 if st % 4 == 0 else 0.6)
    if big:
        for st in range(1, 16, 2):
            HH(bt(b, st), 0.35, pan=-0.25)


# 1) 序章：低频持续音 + 心跳 + 光点爆开
def intro():
    n = int(16.5 * SR)
    t = tt(n)
    f = mtof(26)
    drone = (np.sin(2 * np.pi * f * t) + 0.5 * lp(saw(f * 2, n), 300)) * (1 + 0.15 * np.sin(2 * np.pi * 0.25 * t))
    drone *= np.clip(t / 2.5, 0, 1) * np.clip((16.3 - t) / 0.6, 0, 1)
    place(drone, 0, 'music', gain=0.28, verb=0.1)
    for b in (1, 2, 3):
        place(heartbeat(1.0), b, 'fx', gain=0.9, verb=0.12)
    place(reverse_crash(1.0, 0.8), 3.0, 'fx', gain=0.35, verb=0.3)
    place(boom(0.6), 4.0, 'fx', gain=0.6, verb=0.3)
    for k, m in enumerate((74, 81, 86, 89)):
        place(bell(m, 0.5, 3.5), 4.0 + k * 0.06, 'music', gain=0.16, pan=(k - 1.5) * 0.3, verb=0.7)
    # 钟琴琶音
    for b in range(4, 8):
        notes = voicing(PROG[b], 62, 81)
        for k in range(8):
            m = notes[[0, 2, 3, 1, 2, 4, 3, 2][k] % len(notes)]
            place(bell(m, 0.6 + 0.2 * (k % 2 == 0)), bt(b, 2 * k), 'music', gain=0.09, pan=0.4 * np.sin(k), verb=0.55)
    # 太鼓渐强 + 上升音效
    for k, (tm, v) in enumerate(((12, 0.4), (13, 0.5), (14, 0.6), (14.5, 0.6), (15, 0.75), (15.25, 0.7), (15.5, 0.85), (15.75, 0.95))):
        TK(tm, v, 64, pan=0.2 * (-1) ** k)
    place(riser(4.0), 12.0, 'fx', gain=0.38, verb=0.3)
    place(reverse_crash(1.5), 14.5, 'fx', gain=0.45, verb=0.2)


# 2) 弦乐固定音型
OST = [0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 2, 0, 3, 2, 1, 2]


def ost_params(t):
    def ramp(a, b, x0, x1):
        return a + (b - a) * np.clip((t - x0) / (x1 - x0), 0, 1)

    if 16 <= t < 40:
        return ramp(700, 2600, 16, 40), ramp(0.22, 0.36, 16, 40)
    if 40 <= t < 47.5:
        return ramp(2600, 5200, 40, 47.5), 0.4
    if 48 <= t < 88:
        return 4200, 0.38
    if 88 <= t < 96:
        return 520, 0.26
    if 96 <= t < 103.75:
        return ramp(600, 5200, 96, 103.75), ramp(0.24, 0.4, 96, 103.75)
    if 104 <= t < 120:
        return 6000, 0.42
    return None


def ostinato():
    cache = {}
    for b in range(8, 60):
        root, iv = CHORDS[PROG[b]]
        r0 = into(root, 46, 57)
        tones = [r0, r0 + iv[1], r0 + iv[2], r0 + 12]
        for st in range(16):
            t = bt(b, st)
            p = ost_params(t)
            if p is None:
                continue
            fc, g = p
            m = tones[OST[st]]
            key = (m, int(fc // 150))
            if key not in cache:
                cache[key] = string_note(m, 0.1, fc)
            acc = 1.0 if st % 4 == 0 else 0.72
            place(cache[key], t, 'music', gain=g * acc * 1.5, verb=0.15)


# 3) 低音
def bass():
    for b in range(12, 61):
        t0 = bt(b)
        if 47.5 <= t0 < 48 or 88 <= t0 < 96:
            continue
        root = into(CHORDS[PROG[b]][0], 26, 37)
        if b == 60:
            place(bass_note(root, 6.0, 1.0), t0, 'music', gain=0.35, verb=0)
            continue
        if 24 <= t0 < 40 or (16 <= t0 < 24):
            steps, length = (range(0, 16, 2) if t0 >= 24 else (0, 8)), (0.22 if t0 >= 24 else 0.9)
        elif 40 <= t0 < 48:
            steps, length = range(0, 16, 2), 0.22
        elif 96 <= t0 < 104:
            steps, length = ((0, 4, 8, 12) if t0 >= 100 else (0,)), (0.45 if t0 >= 100 else 1.9)
        else:
            steps, length = range(0, 16, 2), 0.22
        for st in steps:
            t = bt(b, st)
            if 47.5 <= t < 48 or 103.75 <= t < 104:
                continue
            up = 12 if (st % 4 == 2 and t >= 48) else 0
            place(bass_note(root + up, length, 0.9 if st % 4 == 0 else 0.75), t, 'music', gain=0.3, verb=0)


def bass_note(m, dur, v):
    e = env(dur, a=0.004, d=0.25, s=0.65, r=0.06)
    n = len(e)
    f = mtof(m)
    s = np.sin(2 * np.pi * f * tt(n)) + 0.45 * lp(saw(f, n), 420)
    return np.tanh(s * 1.3) * e * v


# 4) 和声铺底：弦乐 + 合唱
def pads():
    for b in range(2, 66):
        t0 = bt(b)
        ch = PROG[b]
        if b < 8:
            g, fc = 0.15 + 0.03 * (b - 2), 1800
        elif b < 20:
            g, fc = 0.17, 2000
        elif b < 24:
            g, fc = 0.2 + 0.02 * (b - 20), 2600
        elif b < 44:
            g, fc = 0.17, 3000
        elif b < 48:
            g, fc = 0.2, 1200
        elif b < 52:
            g, fc = 0.17 + 0.03 * (b - 48), 2400
        elif b < 60:
            g, fc = 0.21, 3400
        else:
            if b > 60:
                continue
            notes = voicing('E', 52, 76)
            place(pad_chord(notes, 9.5, 2600, a=0.05, r=2.5), t0, 'music', gain=0.3, verb=0.5)
            place(choir_chord(voicing('E', 59, 83), 9.0, a=0.05, r=2.5), t0, 'music', gain=0.55, verb=0.6)
            continue
        dur = BAR
        if b in (23, 51):
            dur = BAR - 0.5  # 为 47.5 / 103.75 的静默让路
        place(pad_chord(voicing(ch, 50, 72), dur, fc, a=0.3 if b < 24 else 0.12, r=0.35), t0, 'music', gain=g * 1.3, verb=0.35)
        if 24 <= b < 44 or b >= 52 or (20 <= b < 24):
            cg = 0.42 if b >= 52 else (0.3 if b < 24 else 0.34)
            place(choir_chord(voicing(ch, 57, 79), dur, a=0.2, r=0.4), t0, 'music', gain=cg * 1.5, verb=0.5)


# 5) 铜管
def brass_part():
    def power(ch, lo=38, hi=49):
        root, iv = CHORDS[ch]
        r = into(root, lo, hi)
        return [r, r + 7, r + 12, r + 12 + iv[1]]

    for b in list(range(24, 44)) + list(range(52, 60)):
        ch = PROG[b]
        g = 0.32 if b >= 52 else (0.26 if b < 28 else 0.22)
        for st, ln in ((0, 5), (6, 4), (10, 6)):
            place(brass(power(ch), ln * S16, v=1.0 if st == 0 else 0.8), bt(b, st), 'music', gain=g * 1.6, verb=0.3)
    for t, ch in ((16, 'Dm'), (18, 'Dm'), (26, 'Bb'), (34, 'F'), (52, 'Dm')):
        place(brass(power(ch), 0.6, bright=9), t, 'music', gain=0.3, verb=0.4)
    for b in (20, 21):  # 转折：长音渐强
        place(brass(power(PROG[b]), BAR * 0.95, a=0.6, bright=5), bt(b), 'music', gain=0.22, verb=0.4)
    place(brass(power('A', 33, 44), 3.4, a=1.2, bright=8), 44.0, 'music', gain=0.26, verb=0.4)
    place(brass(power('E', 40, 51), 7.0, a=0.02, bright=9), 120.0, 'music', gain=0.36, verb=0.5)


# 6) 主题旋律（英雄动机）
THEME = [
    [(0, 2, 74), (2, 1, 69), (3, 1, 74)],
    [(0, 3, 77), (3, 0.5, 76), (3.5, 0.5, 74)],
    [(0, 2, 72), (2, 1, 69), (3, 1, 72)],
    [(0, 4, 76)],
    [(0, 2, 74), (2, 1, 69), (3, 1, 74)],
    [(0, 2, 77), (2, 1, 79), (3, 1, 81)],
    [(0, 2, 81), (2, 1, 84), (3, 1, 81)],
    [(0, 3, 79), (3, 1, 76)],
]


def melody():
    def play(b0, bars, shift, gain, octave_double=False):
        for k in bars:
            for beat, dur, m in THEME[k]:
                t = bt(b0 + k - bars[0], beat * 4)
                place(lead_note(m + shift, dur * BEAT * 0.95), t, 'music', gain=gain * 1.6, verb=0.38)
                if octave_double:
                    place(lead_note(m + shift - 12, dur * BEAT * 0.95, 0.6), t, 'music', gain=gain * 1.6, verb=0.3)

    play(24, range(0, 4), -12, 0.2)            # 定义段：低音铜管先亮出动机
    play(36, range(0, 8), 0, 0.17)             # 能力 3–4：完整主题
    play(52, range(0, 8), 2, 0.2, True)        # 高潮：升到 E 小调，八度叠加
    place(lead_note(76, 5.0), 120.0, 'music', gain=0.2, verb=0.5)


# 7) 鼓组与冲击
def drums():
    # 误区段
    for b in range(8, 20):
        TK(bt(b), 0.75, 60)
        TK(bt(b, 8), 0.6, 64)
        if b >= 12:
            TK(bt(b, 14), 0.45, 72, pan=0.3)
            for st in range(0, 16, 2):
                HH(bt(b, st), 0.8 if st % 4 == 0 else 0.5)
        if b >= 16:
            K(bt(b)); K(bt(b, 8), 0.8); SN(bt(b, 8), 0.8)
            for st in range(1, 16, 2):
                HH(bt(b, st), 0.3, pan=-0.25)
        if b % 4 == 3 and b >= 11:
            fill(b)
    # 转折：渐强 → 军鼓滚奏 → 静默
    for b in (20, 21):
        for st in range(0, 16, 4):
            TK(bt(b, st), 0.55 + 0.1 * (b - 20) + 0.03 * st / 4, 62)
        for st in range(16):
            HH(bt(b, st), 0.5)
    t, rate = 44.0, 2
    while t < 47.5:
        x = (t - 44) / 3.5
        SN(t, 0.25 + 0.65 * x)
        t += BEAT / (2 if t < 45 else 4 if t < 46 else 8)
    for k in range(6):
        TOM(46.75 + k * S16, 0.7 + 0.05 * k, 150 - k * 14, 0.5 - 0.2 * k)
    place(riser(3.5), 44.0, 'fx', gain=0.42, verb=0.3)
    place(reverse_crash(1.6), 45.9, 'fx', gain=0.5, verb=0.2)
    # 爆发 + 五种能力
    for b in range(24, 44):
        epic_bar(b)
        if b % 4 == 3:
            fill(b)
    # 充电：心跳
    for k in range(8):
        place(heartbeat(0.55), 88.5 + k, 'fx', gain=0.75, verb=0.15)
    # 收束：太鼓回归 → 滚奏 → 静默
    for b in (48, 49):
        TK(bt(b), 0.5 + 0.1 * (b - 48), 60); TK(bt(b, 8), 0.45 + 0.1 * (b - 48), 64)
    for b in (50, 51):
        for st in range(0, 16, 4):
            TK(bt(b, st), 0.75, 60)
            K(bt(b, st), 0.8)
        for st in range(0, 16, 2):
            HH(bt(b, st), 0.6)
    t = 102.0
    while t < 103.75:
        SN(t, 0.35 + 0.6 * (t - 102) / 1.75)
        t += BEAT / (4 if t < 103 else 8)
    place(riser(3.75), 100.0, 'fx', gain=0.45, verb=0.3)
    place(reverse_crash(1.6), 102.15, 'fx', gain=0.5, verb=0.2)
    # 高潮
    for b in range(52, 60):
        epic_bar(b, big=True)
        if b % 2 == 1:
            fill(b)
    # 冲击点
    for t in (16, 18, 26, 34):
        TK(t, 1.0, 56); CR(t, 0.8)
        place(boom(0.5), t, 'fx', gain=0.25, verb=0.2)
    for t in (52, 56, 64, 72, 80, 108, 112):
        CR(t, 0.9, pan=0.2 if int(t) % 8 else -0.2)
        place(boom(0.4), t, 'fx', gain=0.2, verb=0.2)
    for t, root in ((48, 38), (104, 40), (116, 40), (120, 40)):
        place(braam(root, 1.0, 3.2 if t != 120 else 5.0), t, 'fx', gain=0.7, verb=0.45)
        place(boom(1.0, 4.0 if t == 120 else 3.0), t, 'fx', gain=0.5, verb=0.3)
        CR(t, 1.0, -0.3); CR(t + 0.01, 0.9, 0.3)
        TK(t, 1.0, 52); K(t, 1.0)
    for k, tm in enumerate((120.5, 121.0, 121.5)):  # 结尾三连击
        TK(tm, 0.9 - 0.15 * k, 54)
    # 结尾：余韵中的钟声与最后一次心跳
    for k, m in enumerate((64, 71, 76, 80, 83, 88)):
        place(bell(m, 0.6, 4.0), 122.0 + k * 0.75, 'music', gain=0.1, pan=(k - 2.5) * 0.25, verb=0.7)
    place(heartbeat(0.7), 128.6, 'fx', gain=0.8, verb=0.2)


def breakdown_bells():
    for b in range(44, 48):
        notes = voicing(PROG[b], 62, 81)
        for k in range(8):
            m = notes[[0, 2, 3, 1, 2, 4, 3, 2][k] % len(notes)]
            place(bell(m, 0.55, 3.0), bt(b, 2 * k), 'music', gain=0.1, pan=0.4 * np.sin(k + b), verb=0.6)


# ---------- 母带 ----------
def make_ir(t60=2.6, length=3.6, predelay=0.028):
    n = int(length * SR)
    t = tt(n)
    ir = np.zeros((2, n))
    for ch in range(2):
        nz = noise(n)
        lo = lp(nz, 1800)
        ir[ch] = lo * np.exp(-6.9 * t / t60) + 0.55 * (nz - lo) * np.exp(-6.9 * t / (t60 * 0.4))
    ir *= np.clip(t / 0.012, 0, 1)
    pd = int(predelay * SR)
    ir = np.pad(ir, ((0, 0), (pd, 0)))[:, :n]
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def duck_curve():
    g = np.zeros(N)
    k = np.exp(-tt(int(0.35 * SR)) / 0.11)
    for t, v in KICKS:
        i0 = int(t * SR)
        n = min(len(k), N - i0)
        if n > 0:
            g[i0:i0 + n] = np.maximum(g[i0:i0 + n], k[:n] * v)
    return 1 - 0.38 * g


def gate():
    g = np.ones(N)
    for a, b in ((47.5, 48.0), (103.75, 104.0)):
        i0, i1 = int(a * SR), int(b * SR)
        g[i0:i1] = 0
        r = int(0.01 * SR)
        g[i0 - r:i0] = np.linspace(1, 0, r)
    return g


def master(mix, ceiling=0.93, drive_pct=99.7):
    mix = np.vstack([hp(ch, 28) for ch in mix])
    # 总线压缩（RMS 包络，比例 2.5:1）
    mono = np.sqrt(uniform_filter1d((mix ** 2).mean(axis=0), int(0.03 * SR)))
    thr = np.percentile(mono, 70)
    gr = np.where(mono > thr, (mono / thr) ** (1 / 2.5 - 1), 1.0)
    mix = mix * uniform_filter1d(gr, int(0.05 * SR))
    # 推响度：让最响的 0.3% 进入限制器；前瞻峰值限制（窗口居中即前瞻）
    w = int(0.008 * SR)
    pk = maximum_filter1d(np.abs(mix).max(axis=0), w)
    gain = ceiling / np.percentile(pk, drive_pct)
    mix, pk = mix * gain, pk * gain
    lim = uniform_filter1d(minimum_filter1d(np.minimum(1.0, ceiling / (pk + 1e-9)), w), w)
    return np.clip(mix * lim, -0.99, 0.99)


def main():
    intro(); ostinato(); bass(); pads(); brass_part(); melody(); breakdown_bells(); drums()
    g = gate()
    duck = duck_curve()
    music = BUS['music'] * duck * g
    drums_ = BUS['drums'] * g
    send = np.vstack([hp(ch, 160) for ch in VERB])
    ir = make_ir()
    wet = np.vstack([sg.fftconvolve(send[c], ir[c])[:N] for c in range(2)])
    mix = drums_ + music + BUS['fx'] * g + 0.28 * wet
    fade = np.clip((DUR - tt(N)) / 1.2, 0, 1)
    mix = master(mix) * fade
    wavfile.write(HERE / 'music.wav', SR, (mix.T * 32767).astype(np.int16))
    # 每 8 秒的响度，方便检查段落起伏
    rms = [20 * np.log10(np.sqrt(np.mean(mix[:, int(a * SR):int((a + 8) * SR)] ** 2)) + 1e-9) for a in range(0, int(DUR), 8)]
    print('RMS dB per 8s:', ' '.join(f'{r:.0f}' for r in rms))


if __name__ == '__main__':
    main()
