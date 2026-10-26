"""程序化合成“热血、燃”的史诗配乐与全部音效，输出 build/score.wav 与逐帧能量曲线。

不使用任何采样素材：太鼓、低频冲击、Braam 铜管、弦乐顿弓、合唱、钢琴、上升音、
呼啸、心跳、钟摆、倒带、故障音全部由振荡器 + 滤波器 + 卷积混响合成。
所有音符与音效都按 timeline.py 的节拍网格摆放，与画面逐帧对齐。
"""
import os

import numba
import numpy as np
from scipy import signal
from scipy.io import wavfile

from timeline import BAR, BEAT, DURATION, FPS, HITS, LADDER, LADDER_START, MONTAGE, FINALE_WORDS, SR, T

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
N = int((DURATION + 0.5) * SR)
rng = np.random.default_rng(20170502)


def mtof(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=np.float64) - 69.0) / 12.0)


def tt(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


# ---------------------------------------------------------------- DSP 基元
@numba.njit(cache=True)
def _svf(x, fc, q, mode):
    """Zavalishin TPT 状态变量滤波器，截止频率可逐样本变化。mode: 0 低通 1 带通 2 高通"""
    out = np.empty_like(x)
    ic1 = 0.0
    ic2 = 0.0
    k = 1.0 / q
    for i in range(x.shape[0]):
        g = np.tan(np.pi * min(fc[i], 20000.0) / 48000.0)
        a1 = 1.0 / (1.0 + g * (g + k))
        a2 = g * a1
        a3 = g * a2
        v3 = x[i] - ic2
        v1 = a1 * ic1 + a2 * v3
        v2 = ic2 + a2 * ic1 + a3 * v3
        ic1 = 2.0 * v1 - ic1
        ic2 = 2.0 * v2 - ic2
        if mode == 0:
            out[i] = v2
        elif mode == 1:
            out[i] = v1
        else:
            out[i] = x[i] - k * v1 - v2
    return out


def svf(x, fc, q=0.707, mode="lp"):
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), x.shape).copy()
    return _svf(x.astype(np.float64), fc, float(q), {"lp": 0, "bp": 1, "hp": 2}[mode])


@numba.njit(cache=True)
def _follow(x, att, rel):
    out = np.empty_like(x)
    e = 0.0
    a = np.exp(-1.0 / (att * 48000.0))
    r = np.exp(-1.0 / (rel * 48000.0))
    for i in range(x.shape[0]):
        v = abs(x[i])
        c = a if v > e else r
        e = c * e + (1.0 - c) * v
        out[i] = e
    return out


@numba.njit(cache=True)
def _limit(x, ceiling, look, rel):
    """前视峰值限幅器：x 形如 (2, n)。"""
    n = x.shape[1]
    peak = np.empty(n)
    for i in range(n):
        peak[i] = max(abs(x[0, i]), abs(x[1, i]))
    # 前视窗口内的最大值
    need = np.ones(n)
    for i in range(n):
        m = 0.0
        for j in range(i, min(n, i + look)):
            if peak[j] > m:
                m = peak[j]
        if m > ceiling:
            need[i] = ceiling / m
    out = np.empty_like(x)
    g = 1.0
    r = np.exp(-1.0 / (rel * 48000.0))
    for i in range(n):
        if need[i] < g:
            g = need[i]
        else:
            g = r * g + (1.0 - r) * need[i]
        out[0, i] = x[0, i] * g
        out[1, i] = x[1, i] * g
    return out


def saw(freq, n, phase=None):
    """PolyBLEP 带限锯齿波，freq 可为数组。"""
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    dt = f / SR
    ph = ((rng.random() if phase is None else phase) + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * (phase + np.cumsum(f) / SR))


def adsr(n, a=0.01, d=0.1, s=0.8, r=0.2, hold=None):
    """hold = 音符时长（秒），之后进入释放段。"""
    t = tt(n)
    hold = n / SR - r if hold is None else hold
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - hold) / max(r, 1e-4), 0, 1)
    return e * (1 - rel) ** 2


def expdec(n, tau, attack=0.002):
    t = tt(n)
    return np.minimum(t / attack, 1.0) * np.exp(-t / tau)


def fade_tail(x, sec=0.01):
    k = min(len(x), int(sec * SR))
    x = x.copy()
    x[-k:] *= np.linspace(1, 0, k)
    return x


def pan2(x, pan):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


# ---------------------------------------------------------------- 混音总线
class Mix:
    def __init__(self):
        self.bus = {}

    def add(self, name, x, t, gain=1.0, pan=0.0):
        b = self.bus.setdefault(name, np.zeros((2, N)))
        if x.ndim == 1:
            x = pan2(x, pan)
        i0 = int(round(t * SR))
        if i0 < 0:
            x = x[:, -i0:]
            i0 = 0
        n = min(x.shape[1], N - i0)
        if n > 0:
            b[:, i0:i0 + n] += x[:, :n] * gain


mix = Mix()


# ---------------------------------------------------------------- 打击乐与冲击
def taiko(vel=1.0, pitch=1.0, dur=1.8):
    n = int(dur * SR)
    t = tt(n)
    f = pitch * (54 + 52 * np.exp(-t / 0.045))
    body = sine(f, n) * np.exp(-t / 0.42)
    over = 0.45 * sine(f * 2.27, n) * np.exp(-t / 0.13)
    skin = filt(noise(n), "bandpass", [140, 1400]) * np.exp(-t / 0.03) * 0.9
    slap = filt(noise(n), "highpass", 2500) * np.exp(-t / 0.005) * 0.35
    y = body + over + skin + slap
    y = np.tanh(1.6 * y) / np.tanh(1.6)
    return fade_tail(y * min(t[0] + 1, 1) * vel ** 1.4)


def boom(dur=3.5, f0=75, f1=29, tau=1.1, drive=2.0):
    n = int(dur * SR)
    t = tt(n)
    f = f1 + (f0 - f1) * np.exp(-t / 0.22)
    y = sine(f, n) * expdec(n, tau, 0.002)
    y += filt(noise(n), "lowpass", 180) * np.exp(-t / 0.06) * 2.5
    return fade_tail(np.tanh(drive * y) / np.tanh(drive))


def metal(dur=3.0, base=97.0):
    n = int(dur * SR)
    t = tt(n)
    y = np.zeros(n)
    for k, r in enumerate([1, 1.59, 2.33, 3.21, 4.47, 5.83, 7.37, 9.1]):
        y += np.sin(2 * np.pi * base * r * (1 + 0.004 * rng.standard_normal()) * t
                    + rng.random() * 6.28) * np.exp(-t / (2.2 / (1 + 0.45 * k))) / (1 + 0.3 * k)
    y += filt(noise(n), "highpass", 900) * np.exp(-t / 0.07) * 0.8
    return fade_tail(y * 0.35)


def crash(dur=3.0, bright=1.0):
    n = int(dur * SR)
    t = tt(n)
    out = []
    for _ in range(2):
        x = filt(noise(n), "highpass", 2800 + 1500 * bright, 3)
        x += 0.5 * filt(noise(n), "bandpass", [5000, 9000])
        out.append(x * expdec(n, 1.1, 0.003) * 0.35)
    return np.stack(out)


def snare(vel=1.0):
    n = int(1.2 * SR)
    t = tt(n)
    body = sine(185 * (1 + 0.3 * np.exp(-t / 0.01)), n) * np.exp(-t / 0.07)
    nz = filt(noise(n), "bandpass", [1200, 9000]) * np.exp(-t / 0.17) * 0.9
    clap = np.zeros(n)
    for k, d in enumerate([0.0, 0.011, 0.023]):
        i = int(d * SR)
        clap[i:] += filt(noise(n - i), "bandpass", [900, 3500]) * np.exp(-tt(n - i) / (0.012 if k < 2 else 0.12))
    y = np.tanh(1.4 * (body + nz + 0.6 * clap))
    return fade_tail(y * vel)


def tick(high=True, vel=1.0):
    n = int(0.12 * SR)
    x = noise(n) * expdec(n, 0.002, 0.0003)
    y = svf(x, 3300 if high else 2350, 14, "bp") * 3 + filt(x, "highpass", 6000) * 0.3
    return fade_tail(y * vel)


def hat(vel=1.0, open_=False):
    n = int((0.35 if open_ else 0.09) * SR)
    x = filt(noise(n), "highpass", 7000, 3) + 0.35 * filt(noise(n), "bandpass", [9000, 14000])
    return fade_tail(x * expdec(n, 0.09 if open_ else 0.022, 0.0005) * vel * 0.5)


def heartbeat(vel=1.0):
    n = int(0.7 * SR)
    t = tt(n)
    lub = sine(52 + 20 * np.exp(-t / 0.02), n) * expdec(n, 0.09, 0.004)
    i = int(0.24 * SR)
    dub = np.zeros(n)
    dub[i:] = sine(46 + 14 * np.exp(-tt(n - i) / 0.02), n - i) * expdec(n - i, 0.12, 0.004) * 0.7
    y = np.tanh(2.2 * (lub + dub)) * vel
    return fade_tail(filt(y, "lowpass", 220))


# ---------------------------------------------------------------- 乐器
def braam(notes, dur=4.5, bright=1.0):
    n = int(dur * SR)
    t = tt(n)
    out = np.zeros((2, n))
    for m in notes:
        for v in range(5):
            det = (v - 2) * 0.07 + 0.03 * rng.standard_normal()
            x = saw(mtof(m + det) * (1 + 0.002 * np.sin(2 * np.pi * 6.5 * t)), n)
            out += pan2(x, (v - 2) * 0.35)
    fc = 110 + bright * 1900 * (1 - np.exp(-t / 0.035)) * np.exp(-t / 0.55) + 330 * np.exp(-t / 3)
    amp = adsr(n, 0.025, 1.6, 0.35, 1.2)
    for c in range(2):
        y = svf(out[c] / (5 * len(notes)) ** 0.5, fc, 1.4, "lp")
        out[c] = np.tanh(2.6 * y) * amp
    return out


def pad_note(m, dur, bright=1800, attack=0.35, release=0.8, voices=5):
    n = int((dur + release) * SR)
    t = tt(n)
    out = np.zeros((2, n))
    vib = 1 + 0.0035 * np.sin(2 * np.pi * 4.8 * t + rng.random() * 6)
    for v in range(voices):
        x = saw(mtof(m + (v - (voices - 1) / 2) * 0.09) * vib, n)
        out += pan2(x, (v / (voices - 1) - 0.5) * 1.4)
    env = adsr(n, attack, 0.5, 0.85, release, hold=dur)
    for c in range(2):
        out[c] = filt(out[c], "lowpass", bright) * env / voices
    return out


VOWEL_A = [(700, 90, 1.0), (1150, 110, 0.55), (2800, 170, 0.22), (3500, 200, 0.12)]


def choir_note(m, dur, attack=0.5, release=1.0, voices=6):
    n = int((dur + release) * SR)
    t = tt(n)
    out = np.zeros((2, n))
    for v in range(voices):
        vib = 1 + 0.012 * np.sin(2 * np.pi * (5.2 + 0.4 * rng.random()) * t + rng.random() * 6) \
            * np.clip(t / 0.8, 0, 1)
        src = saw(mtof(m + 0.12 * rng.standard_normal()) * vib, n) + 0.08 * noise(n)
        y = np.zeros(n)
        for f, bw, g in VOWEL_A:
            y += g * signal.sosfilt(signal.butter(2, [f - bw, f + bw], "bandpass", fs=SR, output="sos"), src)
        out += pan2(y, (v / (voices - 1) - 0.5) * 1.5)
    env = adsr(n, attack, 0.6, 0.9, release, hold=dur)
    return out * env / voices * 2.2


def brass_note(m, dur, vel=1.0):
    rel = 0.35
    n = int((dur + rel) * SR)
    t = tt(n)
    scoop = 1 - 0.035 * np.exp(-t / 0.05)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.35) / 0.4, 0, 1)
    x = sum(saw(mtof(m + d) * scoop * vib, n) for d in (-0.08, 0.0, 0.07)) / 3
    x += 0.5 * saw(mtof(m - 12) * scoop, n)
    fc = 500 + vel * 2600 * (1 - np.exp(-t / 0.05)) * (0.55 + 0.45 * np.exp(-t / 0.4))
    y = svf(x, fc, 1.1, "lp")
    y = np.tanh(1.8 * y) * adsr(n, 0.04, 0.4, 0.85, rel, hold=dur)
    return y * vel


def string_hit(m, dur=0.16, accent=0.0):
    n = int((dur + 0.12) * SR)
    t = tt(n)
    x = sum(saw(mtof(m + d), n) for d in (-0.06, 0.0, 0.05)) / 3
    x += 0.6 * saw(mtof(m - 12), n)
    y = filt(x, "lowpass", 1700 + 1900 * accent)
    env = np.minimum(t / 0.004, 1) * np.exp(-t / (0.075 + 0.04 * accent))
    return fade_tail(y * env * (0.75 + 0.35 * accent), 0.03)


def bass_note(m, dur, vel=1.0):
    n = int((dur + 0.08) * SR)
    t = tt(n)
    x = saw(mtof(m), n) * 0.6 + sine(mtof(m), n) * 0.9
    y = svf(x, 160 + 700 * np.exp(-t / 0.06), 1.2, "lp")
    env = np.minimum(t / 0.004, 1) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.02))
    return fade_tail(np.tanh(1.5 * y) * env * vel, 0.02)


def piano_note(m, vel=0.7, dur=3.5):
    n = int(dur * SR)
    t = tt(n)
    f0 = float(mtof(m))
    y = np.zeros(n)
    for k in range(1, 14):
        fk = k * f0 * np.sqrt(1 + 0.00035 * k * k)
        if fk > 16000:
            break
        tau = 2.6 / (1 + 0.35 * k) * (440 / f0) ** 0.25
        a = (1 / k ** 1.15) * (0.6 + 0.4 * vel) ** (k * 0.3)
        y += a * (np.sin(2 * np.pi * fk * t) + 0.6 * np.sin(2 * np.pi * fk * 1.0007 * t + 1.0)) * np.exp(-t / tau)
    y += filt(noise(n), "bandpass", [800, 4000]) * np.exp(-t / 0.004) * 0.25
    return fade_tail(y * np.minimum(t / 0.002, 1) * vel * 0.4)


def bell(f, vel=0.5, dur=3.0):
    n = int(dur * SR)
    t = tt(n)
    y = np.zeros(n)
    for r, a, tau in [(1, 1, 2.2), (2.0, 0.45, 1.3), (3.01, 0.25, 0.8), (4.17, 0.2, 0.5), (5.43, 0.12, 0.35)]:
        y += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / tau)
    return fade_tail(y * np.minimum(t / 0.001, 1) * vel * 0.3)


# ---------------------------------------------------------------- 音效
def riser(dur, top=7500):
    n = int(dur * SR)
    t = tt(n)
    u = t / dur
    nz = svf(noise(n), 250 * (top / 250) ** (u ** 1.4), 2.5, "bp") * 1.6
    tone = sum(sine(70 * 2 ** (o + 4.2 * u ** 1.7), n) * (0.5 if o else 1) for o in (0, 1, 2))
    tone = filt(tone, "lowpass", 3000) * 0.25
    y = (nz + tone) * u ** 2.4
    return fade_tail(y, 0.004)


def reverse_cymbal(dur=2.0):
    c = crash(dur + 0.3, 1.2)[:, ::-1][:, -int(dur * SR):]
    return c * 1.4


def whoosh(dur=0.7, lo=300, hi=4500, pan_from=-0.8, pan_to=0.8):
    n = int(dur * SR)
    u = tt(n) / dur
    fc = lo * (hi / lo) ** np.sin(np.pi * u * 0.5) ** 2
    x = svf(noise(n), fc, 1.3, "bp") * 1.8
    env = np.sin(np.pi * np.clip(u, 0, 1) ** 1.3) ** 2
    y = x * env
    pans = pan_from + (pan_to - pan_from) * u
    a = (pans + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)]) * np.sqrt(2)


def downlifter(dur=2.5):
    n = int(dur * SR)
    t = tt(n)
    u = t / dur
    nz = svf(noise(n), 6000 * (80 / 6000) ** u, 1.5, "bp") * (1 - u) ** 1.5 * 1.3
    tone = sine(500 * (40 / 500) ** u, n) * (1 - u) ** 2 * 0.35
    return fade_tail(nz + tone)


def rewind(dur=2.0):
    n = int(dur * SR)
    t = tt(n)
    u = t / dur
    rate = 3 + 34 * u ** 1.6
    wob = 0.5 + 0.5 * np.sin(2 * np.pi * np.cumsum(rate) / SR)
    whirr = svf(noise(n), 900 + 3500 * u ** 1.5 + 600 * wob, 4, "bp") * (0.4 + 0.6 * wob)
    tone = saw(180 * 2 ** (3 * u ** 1.5) * (1 + 0.05 * wob), n)
    tone = filt(tone, "lowpass", 2500) * 0.25 * wob
    return fade_tail((whirr * 1.4 + tone) * (0.25 + 0.75 * u), 0.003)


def stutter(m=62, reps=6, grain=0.022):
    out = []
    for k in range(reps):
        n = int(grain * SR)
        g = saw(mtof(m - k * 1.5), n) * 0.5 + noise(n) * 0.3
        g *= np.hanning(n) ** 0.3
        out.append(g * (0.5 + 0.5 * k / reps))
        out.append(np.zeros(int(grain * 0.4 * SR)))
    return filt(np.concatenate(out), "bandpass", [300, 6000])


def sparkle(count=7, spread=0.7, base=1174.7):
    n = int((spread + 2.5) * SR)
    y = np.zeros((2, n))
    scale = [0, 3, 5, 7, 10, 12, 15, 17, 19]
    for _ in range(count):
        f = base * 2 ** (scale[rng.integers(len(scale))] / 12)
        i = int(rng.random() * spread * SR)
        b = bell(f, 0.25 + 0.25 * rng.random(), 2.4)
        y[:, i:i + len(b)] += pan2(b, rng.uniform(-0.8, 0.8))[:, : n - i]
    return y


def suck(dur=1.0):
    """反向混响吸气：爆点前的“抽空”。"""
    n = int(dur * SR)
    x = filt(noise(n), "bandpass", [400, 6000]) * expdec(n, 0.25)
    x = (x + 0.6 * np.convolve(x, np.exp(-tt(int(0.4 * SR)) / 0.15) * noise(int(0.4 * SR)) * 0.05, "same"))
    return fade_tail(x[::-1] * 0.8, 0.003)


# ---------------------------------------------------------------- 和声
CH = {  # 根音（低音区）、和弦音（中音区）、三度音程
    "Dm": (38, [50, 53, 57], 3), "Bb": (34, [50, 53, 58], 4), "F": (41, [48, 53, 57], 4),
    "C": (36, [48, 52, 55], 4), "Gm": (31, [50, 55, 58], 3), "A": (33, [49, 52, 57], 4),
    "D": (38, [50, 54, 57], 4),
}
OST_ROOT = {"Dm": 50, "Bb": 46, "F": 53, "C": 48, "Gm": 43, "A": 45, "D": 50}

CHORDS = {}
for b in range(0, 4):
    CHORDS[b] = "Dm"
CHORDS.update({4: "Dm", 5: "Dm", 6: "Bb", 7: "A", 8: "Dm", 9: "Bb", 10: "Gm", 11: "A"})
for i, b in enumerate(range(12, 28)):
    CHORDS[b] = ["Dm", "Bb", "F", "C"][i % 4]
CHORDS.update({28: "Gm", 29: "A", 30: "Dm", 31: "A", 32: "Dm", 33: "Bb", 34: "Gm", 35: "A",
               36: "Dm", 37: "Bb", 38: "Gm", 39: "A", 40: "Dm", 41: "Bb", 42: "F", 43: "C",
               44: "Dm", 45: "Bb", 46: "Gm", 47: "A", 48: "Dm", 49: "Bb", 50: "F", 51: "C",
               52: "Gm", 53: "Bb", 54: "C", 55: "A", 56: "D", 57: "D", 58: "D", 59: "D", 60: "D", 61: "D"})

OST_PATTERN = [0, 0, 12, 0, 0, 12, 0, 7, 0, 0, 12, 0, 0, 12, 7, "3"]
OST_ACCENT = {0, 3, 6, 8, 11, 14}


def ostinato(bars, gain=1.0, octave=0, bright=0.0):
    for b in bars:
        ch = CHORDS[b]
        root = OST_ROOT[ch] + 12 * octave
        third = CH[ch][2]
        for s, off in enumerate(OST_PATTERN):
            m = root + (12 + third if off == "3" else off)
            acc = 1.0 if s in OST_ACCENT else 0.0
            x = string_hit(m, 0.14, min(1, acc * 0.7 + bright))
            mix.add("ost", x, T(b, s / 4), gain * (1.0 if acc else 0.7), pan=-0.3 if s % 2 else 0.3)


def bassline(bars, gain=1.0, pattern="8ths"):
    for b in bars:
        root = CH[CHORDS[b]][0]
        if pattern == "8ths":
            for k in range(8):
                mix.add("bass", bass_note(root + (12 if k in (3, 7) else 0), BEAT / 2 * 0.9,
                                          1.0 if k % 2 == 0 else 0.75), T(b, k / 2), gain)
        else:
            mix.add("bass", bass_note(root, BAR * 0.98, 1.0), T(b), gain)


def pads(bars, gain=1.0, bright=1800, octave=0):
    for b in bars:
        for m in CH[CHORDS[b]][1]:
            mix.add("pad", pad_note(m + 12 * octave, BAR, bright), T(b), gain)


def choirs(bars, gain=1.0, octave=0):
    for b in bars:
        notes = CH[CHORDS[b]][1]
        for m in notes:
            mix.add("choir", choir_note(m + 12 * octave, BAR, attack=0.35, release=0.9), T(b), gain)


TAIKO_A = {0: 1.0, 6: 0.7, 8: 0.85, 11: 0.5, 14: 0.6}
TAIKO_B = {0: 1.0, 3: 0.5, 6: 0.75, 8: 0.9, 10: 0.5, 11: 0.55, 14: 0.7}
TAIKO_FILL = {0: 1.0, 4: 0.6, 6: 0.7, 8: 0.9, 10: 0.55, 12: 0.65, 13: 0.7, 14: 0.8, 15: 0.9}


def taikos(bars, pattern, gain=1.0, fill_every=None):
    for b in bars:
        pat = TAIKO_FILL if fill_every and (b - bars[0]) % fill_every == fill_every - 1 else pattern
        for s, v in pat.items():
            mix.add("drums", taiko(v, 1.0 + 0.08 * (s % 3 == 1)), T(b, s / 4), gain, pan=rng.uniform(-0.25, 0.25))
        mix.add("drums", boom(1.2, 62, 38, 0.35, 1.5), T(b), 0.55 * gain)


def snares(bars, gain=1.0):
    for b in bars:
        for beat in (1, 3):
            mix.add("drums", snare(0.9), T(b, beat), gain)


def hats(bars, gain=1.0, sixteenths=False):
    for b in bars:
        for k in range(16 if sixteenths else 8):
            pos = k / (4 if sixteenths else 2)
            v = 0.9 if k % 2 == 0 else 0.55
            mix.add("drums", hat(v, open_=(k == (14 if sixteenths else 7))), T(b, pos), gain * 0.55,
                    pan=0.35 if k % 2 else -0.35)


def melody(notes, gain=1.0, choir=False):
    for bar, beat, dur, m in notes:
        mix.add("brass", brass_note(m, dur * BEAT * 0.95, 1.0), T(bar, beat), gain)
        if choir:
            mix.add("choir", choir_note(m, dur * BEAT, 0.08, 0.5, 5), T(bar, beat), gain * 0.7)


# ---------------------------------------------------------------- 编曲
def arrange():
    # —— 0–4 小节：黑暗、心跳、玻璃铃
    mix.add("pad", np.concatenate([pad_note(m, 8.0, 600, attack=2.5, release=1.5) for m in [38]], axis=1), 0.0, 0.9)
    for m in (50, 57):
        mix.add("pad", pad_note(m, 7.5, 900, attack=3.0, release=1.0), 0.3, 0.35)
    for b in range(0, 4):
        for beat in (0, 2):
            mix.add("sfx", heartbeat(0.75 + 0.08 * b), T(b, beat), 0.9)
    for (bar, beat, m) in [(0, 2, 81), (1, 2, 77), (2, 0, 74), (2, 2, 76), (3, 0, 72), (3, 2, 81)]:
        mix.add("bell", bell(mtof(m), 0.6), T(bar, beat), 0.8, pan=rng.uniform(-0.5, 0.5))
    mix.add("sfx", riser(3.0), T(2, 2), 0.9)
    mix.add("sfx", reverse_cymbal(2.0), T(3), 0.8)

    # —— 4–8 小节：片名
    pads(range(4, 8), 0.8, 1400)
    choirs(range(4, 8), 0.55)
    bassline(range(4, 8), 0.7, "long")
    for b, beats in [(6, [0, 2]), (7, [0, 1, 2, 3])]:
        for bt in beats:
            mix.add("drums", taiko(0.55 + 0.12 * bt), T(b, bt), 0.8)
    mix.add("sfx", whoosh(1.0), T(7, 2), 0.7)

    # —— 8–12 小节：提问、钟摆、倒带
    pads(range(8, 12), 0.55, 1200)
    for b in range(8, 11):
        for k in range(8):
            mix.add("sfx", tick(k % 2 == 0, 0.8), T(b, k / 2), 0.55, pan=-0.3 if k % 2 else 0.3)
    for k in range(32):  # 第 11 小节：钟摆加速
        pos = 4 * (1 - (1 - k / 32) ** 1.7)
        mix.add("sfx", tick(k % 2 == 0, 0.6 + 0.4 * k / 32), T(11, pos), 0.5)
    for b in range(9, 12):
        for k in range(8):
            mix.add("bass", bass_note(CH[CHORDS[b]][0], BEAT / 2 * 0.8, 0.5 + 0.1 * (b - 9)), T(b, k / 2), 0.6)
    mix.add("sfx", rewind(2.0), T(11), 0.9)
    mix.add("sfx", riser(4.0), T(10), 0.8)
    mix.add("sfx", reverse_cymbal(2.0), T(11), 0.9)
    mix.add("bell", bell(mtof(74), 0.5), T(8), 0.7)
    mix.add("bell", bell(mtof(77), 0.5), T(10), 0.7)

    # —— 12–30 小节：倒带阶梯（三段递进）
    A, B, C = range(12, 18), range(18, 24), range(24, 30)
    ostinato(A, 0.75)
    ostinato(B, 0.85, bright=0.2)
    ostinato(B, 0.35, octave=1)
    ostinato(C, 0.9, bright=0.45)
    ostinato(C, 0.5, octave=1, bright=0.3)
    bassline(range(12, 30), 0.8)
    pads(range(12, 30), 0.45, 1500)
    taikos(list(A), TAIKO_A, 0.9)
    taikos(list(B), TAIKO_B, 0.95, fill_every=2)
    taikos(list(C), TAIKO_B, 1.0, fill_every=2)
    snares(list(B) + list(C), 0.55)
    hats(A, 0.6)
    hats(list(B) + list(C), 0.7, sixteenths=True)
    choirs(C, 0.6)
    melody([(24, 0, 2, 69), (24, 2, 2, 74), (25, 0, 3, 77), (25, 3, 1, 74), (26, 0, 2, 72), (26, 2, 2, 69),
            (27, 0, 2, 67), (27, 2, 2, 76), (28, 0, 4, 74), (29, 0, 2, 73), (29, 2, 2, 76)], 0.55)
    for i in range(len(LADDER)):
        t = T(LADDER_START + 2 * i)
        mix.add("sfx", sparkle(6, 0.6), t + BEAT, 0.5)
    mix.add("sfx", riser(4.0), T(28), 1.0)
    for k in range(16):  # 第 29 小节后半：太鼓滚奏
        mix.add("drums", taiko(0.5 + 0.5 * k / 16, 1.1), T(29, 2 + k / 8), 0.75)

    # —— 30–32 小节：汇聚 + 抽空
    pads([30], 0.7, 2200)
    choirs([30, 31], 0.8)
    ostinato([30], 1.0, bright=0.6)
    ostinato([30], 0.55, octave=1, bright=0.5)
    bassline([30], 0.9)
    taikos([30], TAIKO_B, 1.0)
    for k in range(8):  # 31 小节前两拍：16 分音符推进
        mix.add("drums", taiko(0.6 + 0.4 * k / 8, 1.15), T(31, k / 4), 0.85)
    mix.add("sfx", suck(1.0), T(31, 2), 1.0)

    # —— 32–36 小节：主题词蒙太奇
    ostinato(range(32, 36), 0.95, bright=0.5)
    ostinato(range(32, 36), 0.5, octave=1, bright=0.4)
    bassline(range(32, 36), 0.9)
    pads(range(32, 36), 0.55, 2000)
    choirs(range(32, 36), 0.55)
    hats(range(32, 36), 0.8, sixteenths=True)
    snares(range(32, 36), 0.5)
    for i in range(len(MONTAGE)):
        t = T(32 + i // 2, 2 * (i % 2))
        mix.add("drums", taiko(1.0, 0.95), t, 1.0)
        mix.add("impact", boom(1.6, 80, 34, 0.45), t, 0.7)
        if i:
            mix.add("sfx", stutter(62 + i), t - 0.11, 0.35)
        mix.add("sfx", whoosh(0.35, 800, 6000, -0.6 + 0.15 * i, 0.6 - 0.15 * i), t - 0.3, 0.45)

    # —— 36–40 小节：我们与他们 → 渐弱
    ostinato(range(36, 38), 0.9, bright=0.4)
    ostinato(range(38, 40), 0.6, bright=0.0)
    bassline(range(36, 39), 0.8)
    pads(range(36, 40), 0.6, 1600)
    choirs(range(36, 40), 0.45)
    taikos([36, 37], TAIKO_A, 0.9)
    taikos([38], {0: 0.8, 8: 0.6}, 0.7)
    mix.add("sfx", downlifter(3.0), T(39), 0.8)

    # —— 40–48 小节：希望（钢琴 + 心跳），最后两小节蓄力
    for b in range(40, 48):
        root = OST_ROOT[CHORDS[b]] - 12 if OST_ROOT[CHORDS[b]] > 48 else OST_ROOT[CHORDS[b]]
        third = CH[CHORDS[b]][2]
        arp = [0, 7, 12, 12 + third, 19, 24, 19, 12 + third]
        for k, off in enumerate(arp):
            mix.add("piano", piano_note(root + 12 + off, 0.55 if k else 0.7), T(b, k / 2), 0.9,
                    pan=-0.3 + 0.6 * k / 7)
    melody_p = [(44, 0, 2, 69), (44, 2, 1, 65), (44, 3, 1, 67), (45, 0, 3, 69), (45, 3, 1, 72),
                (46, 0, 2, 70), (46, 2, 1, 69), (46, 3, 1, 67), (47, 0, 4, 69)]
    for bar, beat, dur, m in melody_p:
        mix.add("piano", piano_note(m + 12, 0.8, 4.0), T(bar, beat), 1.0)
    pads(range(40, 48), 0.5, 1100)
    choirs(range(44, 48), 0.35)
    for b in range(40, 46):
        mix.add("sfx", heartbeat(0.55), T(b), 0.6)
    ostinato([46], 0.45)
    ostinato([47], 0.7, bright=0.4)
    for k in range(32):  # 47 小节：军鼓滚奏渐强
        mix.add("drums", snare(0.2 + 0.8 * (k / 32) ** 1.5), T(47, k / 8), 0.5)
    taikos([46], TAIKO_A, 0.7)
    taikos([47], TAIKO_FILL, 0.9)
    mix.add("sfx", riser(4.0), T(46), 1.0)
    mix.add("sfx", reverse_cymbal(2.0), T(47), 0.9)

    # —— 48–56 小节：终章（合唱 + 铜管主题 + 全编制）
    F = range(48, 56)
    ostinato(F, 1.0, bright=0.6)
    ostinato(F, 0.55, octave=1, bright=0.5)
    bassline(F, 0.95)
    pads(F, 0.6, 2400)
    pads(F, 0.3, 2600, octave=1)
    choirs(F, 0.75)
    taikos(list(F), TAIKO_B, 1.0, fill_every=2)
    snares(F, 0.6)
    hats(F, 0.8, sixteenths=True)
    theme = [(48, 0, 2, 74), (48, 2, 1, 69), (48, 3, 1, 74), (49, 0, 3, 77), (49, 3, 1, 74),
             (50, 0, 2, 72), (50, 2, 1, 69), (50, 3, 1, 72), (51, 0, 2, 76), (51, 2, 1, 74), (51, 3, 1, 72),
             (52, 0, 2, 74), (52, 2, 1, 70), (52, 3, 1, 74), (53, 0, 3, 77), (53, 3, 1, 79),
             (54, 0, 2, 79), (54, 2, 1, 76), (54, 3, 1, 72), (55, 0, 4, 76)]
    melody(theme, 0.7, choir=True)
    melody([(bar, beat, dur, m - 12) for bar, beat, dur, m in theme], 0.35)
    for i in range(len(FINALE_WORDS)):
        mix.add("bell", bell(mtof([74, 77, 81, 79, 74, 81, 86][i]), 0.6), T(50 + i // 4, i % 4), 0.55)
    mix.add("sfx", riser(4.0), T(54), 1.0)
    mix.add("sfx", reverse_cymbal(2.0), T(55), 1.0)

    # —— 56–62 小节：片尾（D 大调解决）
    for m in (50, 54, 57, 62, 66):
        mix.add("pad", pad_note(m, 7.5, 2600, attack=0.05, release=3.0), T(56), 0.45)
        mix.add("choir", choir_note(m, 7.0, 0.1, 3.0), T(56), 0.5)
    mix.add("brass", brass_note(78, 3.8, 1.0), T(56), 0.8)
    mix.add("brass", brass_note(66, 3.8, 1.0), T(56), 0.5)
    for k, v in enumerate([1.0, 0.0, 0.7, 0.0, 0.9, 0.5, 0.0, 0.0]):
        if v:
            mix.add("drums", taiko(v), T(56, k / 2), 0.9)
    mix.add("bass", bass_note(38, 6.0, 1.0), T(56), 0.9)
    mix.add("piano", piano_note(38, 0.9, 6.0), T(58), 1.2)
    mix.add("piano", piano_note(50, 0.7, 6.0), T(58), 0.8)
    mix.add("bell", bell(mtof(86), 0.5, 4.0), T(58), 0.6)
    mix.add("sfx", sparkle(10, 1.5, 1174.7), T(56, 1), 0.6)

    # —— 重音层：冲击 + 呼啸
    for t, kind, s in HITS:
        if kind in ("big", "button"):
            mix.add("impact", boom(4.0, 78, 27, 1.3), t, 1.0 * s)
            mix.add("impact", metal(3.5, rng.uniform(85, 110)), t, 0.55 * s)
            mix.add("impact", crash(3.5), t, 0.9 * s)
            mix.add("drums", taiko(1.0, 0.9), t, 1.0)
            if kind == "big":
                mix.add("sfx", whoosh(0.9, 250, 5000), t - 0.75, 0.6)
        elif kind == "step":
            mix.add("impact", boom(2.2, 76, 32, 0.6), t, 0.75 * s)
            mix.add("impact", crash(2.0, 0.8), t, 0.45 * s)
            mix.add("impact", metal(2.0, rng.uniform(120, 160)), t, 0.3 * s)
            mix.add("sfx", whoosh(0.6, 400, 6000, rng.choice([-0.8, 0.8]), 0.0), t - 0.5, 0.55)
        elif kind == "pulse":
            mix.add("impact", boom(1.4, 80, 36, 0.35), t, 0.6 * s)
    for t, notes, bright in [(T(4), [26, 38, 45, 50], 1.0), (T(30), [26, 38, 45, 50, 53], 1.0),
                             (T(32), [22, 34, 41, 46], 1.1), (T(48), [26, 38, 45, 50, 53], 1.2),
                             (T(56), [26, 38, 45, 50, 54], 1.3)]:
        mix.add("brass", braam(notes, 5.0, bright), t, 0.75)
    mix.add("sfx", downlifter(3.0), T(4, 1), 0.5)


# ---------------------------------------------------------------- 混响、压缩、母带
def make_ir(sec, t60, predelay, seed, bright=6000):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = tt(n)
    env = 10 ** (-3 * t / t60)
    out = []
    for _ in range(2):
        x = r.standard_normal(n) * env
        dark = filt(x, "lowpass", 1200)
        x = filt(x, "lowpass", bright)
        w = np.clip(t / (t60 * 0.6), 0, 1)
        x = x * (1 - w) + dark * w * 1.6
        x[: int(predelay * SR)] = 0
        out.append(x / np.sqrt(np.sum(x ** 2)))
    return np.stack(out)


def reverb(x, ir):
    return np.stack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)])


SENDS = {  # bus: (hall, room, gain dB)
    "drums": (0.22, 0.35, -4.5), "impact": (0.35, 0.1, -2.5), "bass": (0.0, 0.0, -6.5),
    "ost": (0.25, 0.25, -1.0), "pad": (0.45, 0.0, -7.0), "choir": (0.55, 0.0, -2.0),
    "brass": (0.35, 0.1, -6.0), "piano": (0.45, 0.15, -6.0), "bell": (0.7, 0.0, -6.0),
    "sfx": (0.3, 0.1, -7.0),
}
DUCKED = {"bass": 0.55, "ost": 0.3, "pad": 0.5, "choir": 0.4, "brass": 0.25, "piano": 0.2}


def music_gate():
    """31 小节第 3 拍到 32 小节：全曲抽空，只留吸气声（经典预告片停顿）。"""
    g = np.ones(N)
    a, b = int(T(31, 2) * SR), int(T(32) * SR)
    g[a:b] = 0.0
    k = int(0.02 * SR)
    g[a - k:a] = np.linspace(1, 0, k)
    return g


def master():
    hall = make_ir(4.0, 3.2, 0.03, 1)
    room = make_ir(1.2, 0.8, 0.008, 2, 9000)
    buses = {k: v * 10 ** (SENDS[k][2] / 20) for k, v in mix.bus.items()}

    trig = np.abs(buses.get("drums", 0)[0]) + np.abs(buses.get("impact", 0)[0])
    duck_env = _follow(trig, 0.003, 0.22)
    duck_env /= np.percentile(duck_env, 99.5) + 1e-9
    duck_env = np.clip(duck_env, 0, 1)
    gate = music_gate()
    for k, depth in DUCKED.items():
        if k in buses:
            buses[k] *= (1 - depth * duck_env) * gate
    for k in ("drums", "impact"):
        a, b = int(T(31, 2) * SR), int(T(32) * SR) - 1
        buses[k][:, a:b] *= np.linspace(1, 0, b - a) ** 3

    hall_in = sum(v * SENDS[k][0] for k, v in buses.items())
    room_in = sum(v * SENDS[k][1] for k, v in buses.items())
    dry = sum(buses.values())
    wet = reverb(hall_in, hall) * 0.9 + reverb(room_in, room) * 0.7
    wet_gate = np.convolve(gate, np.ones(int(0.06 * SR)) / int(0.06 * SR), "same") * 0.85 + 0.15
    sfx_wet = reverb(buses["sfx"] * SENDS["sfx"][0], hall) * 0.9
    out = dry + (wet - sfx_wet) * wet_gate + sfx_wet
    out = np.stack([filt(out[c], "highpass", 24) for c in range(2)])

    # 胶水压缩
    env = _follow(np.max(np.abs(out), axis=0), 0.01, 0.18)
    thr = np.percentile(env, 70)
    gain = np.where(env > thr, (thr / np.maximum(env, 1e-9)) ** (1 - 1 / 2.2), 1.0)
    out *= gain
    out /= np.percentile(np.abs(out), 99.9)
    out *= 0.92
    out = _limit(out, 0.89, int(0.004 * SR), 0.08)

    fade_in = int(0.05 * SR)
    out[:, :fade_in] *= np.linspace(0, 1, fade_in)
    end_a, end_b = int(T(60) * SR), N
    out[:, end_a:end_b] *= np.linspace(1, 0, end_b - end_a) ** 2
    return out, buses


def features(out, buses):
    """逐帧能量曲线，供画面做音频反应（粒子亮度、辉光、光束随鼓点跳动）。"""
    nf = int(DURATION * FPS)
    hop = SR // FPS
    drums = np.abs(buses["drums"][0]) + np.abs(buses["impact"][0])
    env = _follow(drums, 0.002, 0.12)
    lvl = _follow(np.abs(out[0]) + np.abs(out[1]), 0.02, 0.3)
    idx = np.minimum(np.arange(nf) * hop + hop // 2, N - 1)
    kick = env[idx] / (np.percentile(env[idx], 99) + 1e-9)
    level = lvl[idx] / (np.percentile(lvl[idx], 99) + 1e-9)
    return np.clip(kick, 0, 1.5).astype(np.float32), np.clip(level, 0, 1.5).astype(np.float32)


def bus_stats(buses):
    secs = [("intro", 0, 4), ("title", 4, 8), ("ladderA", 12, 18), ("ladderC", 24, 30),
            ("montage", 32, 36), ("hope", 40, 46), ("finale", 48, 56)]
    print("bus        " + " ".join(f"{s[0]:>8s}" for s in secs))
    for k in sorted(buses):
        row = []
        for _, a, b in secs:
            seg = buses[k][:, int(T(a) * SR):int(T(b) * SR)]
            row.append(20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12))
        print(f"{k:10s} " + " ".join(f"{v:8.1f}" for v in row))


def main():
    os.makedirs(BUILD, exist_ok=True)
    arrange()
    out, buses = master()
    kick, level = features(out, buses)
    if "--stats" in os.sys.argv:
        bus_stats(buses)
    np.savez(os.path.join(BUILD, "features.npz"), kick=kick, level=level)
    wavfile.write(os.path.join(BUILD, "score.wav"), SR, out.T.astype(np.float32))
    peak = 20 * np.log10(np.max(np.abs(out)) + 1e-12)
    rms = 20 * np.log10(np.sqrt(np.mean(out ** 2)) + 1e-12)
    print(f"score.wav  {N / SR:.1f}s  peak {peak:.2f} dBFS  rms {rms:.1f} dBFS")
    for name, s0, s1 in [("intro", 0, 4), ("title", 4, 8), ("question", 8, 12), ("ladder", 12, 30),
                         ("montage", 32, 36), ("hope", 40, 46), ("finale", 48, 56), ("end", 56, 61)]:
        seg = out[:, int(T(s0) * SR):int(T(s1) * SR)]
        print(f"  {name:9s} rms {20 * np.log10(np.sqrt(np.mean(seg ** 2)) + 1e-12):6.1f} dBFS")


if __name__ == "__main__":
    main()
