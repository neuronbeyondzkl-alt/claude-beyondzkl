"""程序合成的“热血 / 燃”系配乐：D 小调，150 BPM，混合预告片风格。

不用任何采样：鼓、太鼓、braam、冲击、上升音、反向镲、嗖声、合唱、铜管主旋律、
弦乐断奏和铃音全部由振荡器 + 噪声 + 滤波器现场合成。所有落点都来自 timeline.py。

用法：python3 music.py build/music.wav
"""
import sys
import numpy as np
from scipy.signal import lfilter, fftconvolve
from scipy.ndimage import minimum_filter1d
from scipy.io import wavfile

import timeline as TL

SR = 48000
STATS = None   # 设为路径时输出逐小节电平统计
RNG = np.random.default_rng(20111025)   # 《思考，快与慢》英文版出版日


# ============================================================ 基础工具
def midi_hz(m):
    return 440.0 * 2.0 ** ((np.asarray(m, dtype=np.float64) - 69.0) / 12.0)


def tarr(n):
    return np.arange(n) / SR


def ns(sec_):
    return int(round(sec_ * SR))


def noise(n):
    return RNG.standard_normal(n)


def biquad(kind, f, q=0.707, gain_db=0.0):
    f = min(max(f, 10.0), SR * 0.45)
    w0 = 2 * np.pi * f / SR
    c, s = np.cos(w0), np.sin(w0)
    al = s / (2 * q)
    if kind in ("ls", "hs"):
        A = 10 ** (gain_db / 40)
        sq = 2 * np.sqrt(A) * al
        if kind == "ls":
            b = [A * ((A + 1) - (A - 1) * c + sq), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sq)]
            a = [(A + 1) + (A - 1) * c + sq, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sq]
        else:
            b = [A * ((A + 1) + (A - 1) * c + sq), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sq)]
            a = [(A + 1) - (A - 1) * c + sq, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sq]
        return np.array(b) / a[0], np.array(a) / a[0]
    if kind == "lp":
        b = [(1 - c) / 2, 1 - c, (1 - c) / 2]
    elif kind == "hp":
        b = [(1 + c) / 2, -(1 + c), (1 + c) / 2]
    elif kind == "bp":
        b = [al, 0.0, -al]
    else:
        raise ValueError(kind)
    a = [1 + al, -2 * c, 1 - al]
    return np.array(b) / a[0], np.array(a) / a[0]


def filt(x, kind, f, q=0.707, gain_db=0.0):
    b, a = biquad(kind, f, q, gain_db)
    return lfilter(b, a, x, axis=0)


def tv_filt(x, kind, fc, q=0.707, block=128):
    """随时间变化的双二阶滤波（逐块更新系数）。x 可以是单声道或 (n,2)。"""
    if x.ndim == 2:
        return np.stack([tv_filt(x[:, c], kind, fc, q, block) for c in range(x.shape[1])], axis=1)
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, dtype=np.float64), (n,))
    y = np.empty(n)
    zi = np.zeros(2)
    for i in range(0, n, block):
        b, a = biquad(kind, float(fc[i]), q)
        y[i:i + block], zi = lfilter(b, a, x[i:i + block], zi=zi)
    return y


def saw(freq, n, phase0=None):
    """PolyBLEP 带限锯齿波，freq 可为标量或逐样本数组。"""
    if phase0 is None:
        phase0 = RNG.random()
    inc = np.broadcast_to(np.asarray(freq, dtype=np.float64) / SR, (n,))
    ph = (phase0 + np.cumsum(inc)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < inc
    t = ph[m] / inc[m]
    y[m] -= t + t - t * t - 1.0
    m = ph > 1.0 - inc
    t = (ph[m] - 1.0) / inc[m]
    y[m] -= t * t + t + t + 1.0
    return y


def pulse(freq, n, duty=0.5):
    p0 = RNG.random()
    return 0.5 * (saw(freq, n, p0) - saw(freq, n, (p0 + duty) % 1.0))


def sine_sweep(f, n):
    f = np.broadcast_to(np.asarray(f, dtype=np.float64), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def pan2(x, pan=0.0):
    th = (pan + 1.0) * np.pi / 4
    return np.stack([x * np.cos(th), x * np.sin(th)], axis=1) * np.sqrt(2)


def fade_edges(x, a=0.002, r=0.01):
    n = len(x)
    na, nr = min(n, ns(a)), min(n, ns(r))
    env = np.ones(n)
    if na:
        env[:na] = np.linspace(0, 1, na)
    if nr:
        env[-nr:] = np.minimum(env[-nr:], np.linspace(1, 0, nr))
    return x * (env[:, None] if x.ndim == 2 else env)


def interp_keys(keys, t_bars):
    xs = np.array([k[0] for k in keys], dtype=np.float64)
    ys = np.array([k[1] for k in keys], dtype=np.float64)
    return np.interp(t_bars, xs, ys)


# ============================================================ 和声数据
QUAL = {"Dm": (2, 3), "Bb": (10, 4), "F": (5, 4), "C": (0, 4), "Gm": (7, 3), "A": (9, 4)}
PAD_VOICE = {
    "Dm": [50, 57, 62, 65, 69], "Bb": [46, 53, 58, 62, 65], "F": [53, 57, 60, 65, 69],
    "C": [48, 55, 60, 64, 67], "Gm": [55, 58, 62, 67, 70], "A": [57, 61, 64, 69, 73],
}
CHOIR_VOICE = {
    "Dm": [62, 65, 69, 74], "Bb": [58, 62, 65, 70], "F": [60, 65, 69, 72],
    "C": [60, 64, 67, 72], "Gm": [62, 67, 70, 74], "A": [61, 64, 69, 73],
}
BASS_ROOT = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "Gm": 43, "A": 33}
OST_ROOT = {"Dm": 62, "Bb": 58, "F": 65, "C": 60, "Gm": 55, "A": 57}


def chord_tones(ch, octave_midi=72):
    root, third = QUAL[ch]
    base = octave_midi + ((root - octave_midi) % 12)
    return [base, base + third, base + 7]


# 主旋律（D 小调），(midi, 拍数)
PHRASE_A = [
    (74, 2), (77, 1), (81, 1), (81, 3), (79, .5), (77, .5),
    (77, 2), (74, 1), (77, 1), (79, 3), (77, .5), (79, .5),
    (81, 2), (84, 1), (81, 1), (79, 2), (77, 1), (79, 1),
    (76, 2), (79, 1), (84, 1), (79, 2), (76, 2),
]
PHRASE_B = [
    (86, 2), (84, 1), (81, 1), (81, 2), (77, 1), (81, 1),
    (82, 2), (81, 1), (77, 1), (77, 2), (74, 1), (77, 1),
    (84, 2), (81, 1), (84, 1), (84, 1), (82, 1), (81, 1), (79, 1),
    (79, 2), (76, 1), (79, 1), (84, 1), (86, 1), (None, 2),
]
for ph in (PHRASE_A, PHRASE_B):
    assert abs(sum(d for _, d in ph) - 32) < 1e-9


def phrase_notes(phrase, start_bar):
    out, b = [], start_bar
    for m, d in phrase:
        if m is not None:
            out.append((b, m, d))
        b += d / 4.0
    return out


# ============================================================ 鼓与打击乐
def kick():
    n = ns(0.6)
    t = tarr(n)
    f = 44 + 130 * np.exp(-t / 0.04) + 500 * np.exp(-t / 0.004)
    body = sine_sweep(f, n) * np.exp(-t / 0.36) * np.minimum(1, t / 0.0015)
    click = filt(noise(n), "hp", 3000) * np.exp(-t / 0.0035) * 0.5
    return np.tanh(2.2 * (0.9 * body + click)) * 0.9


def snare():
    n = ns(0.55)
    t = tarr(n)
    f = 190 * (1 + 0.35 * np.exp(-t / 0.012))
    tone = sine_sweep(f, n) * np.exp(-t / 0.06) + 0.5 * sine_sweep(f * 1.79, n) * np.exp(-t / 0.04)
    nz = noise(n)
    body = filt(nz, "bp", 1800, 0.7) * np.exp(-t / 0.16) * 2.2
    sizzle = filt(nz, "hp", 5000) * np.exp(-t / 0.09) * 0.6
    clap = np.zeros(n)
    cn = filt(noise(n), "bp", 1300, 1.2) * 2.5
    for k in range(3):
        tk = t - k * 0.009
        clap += np.where(tk >= 0, np.exp(-np.maximum(tk, 0) / 0.006), 0)
    clap = cn * (clap + 0.45 * np.exp(-t / 0.12))
    x = 0.55 * tone + 0.9 * body + sizzle + 0.6 * clap
    return np.tanh(1.5 * x) * 0.85


def hat(open_=False):
    n = ns(0.4 if open_ else 0.09)
    t = tarr(n)
    met = sum(pulse(330 * r, n) for r in (1, 1.4471, 1.617, 1.9265, 2.5028, 2.6637))
    x = filt(0.5 * met / 6 + 0.7 * noise(n), "hp", 7000)
    return x * np.exp(-t / (0.22 if open_ else 0.026)) * 0.8


def taiko(f0=62, dec=0.45):
    n = ns(1.4)
    t = tarr(n)
    f = f0 + f0 * 0.9 * np.exp(-t / 0.05)
    body = sine_sweep(f, n) * np.exp(-t / dec)
    skin = filt(noise(n), "lp", 700) * np.exp(-t / 0.06) * 0.9
    slap = filt(noise(n), "bp", 2500, 1.0) * np.exp(-t / 0.008) * 0.6
    return np.tanh(1.8 * (body + skin + slap)) * 0.9


def crash():
    n = ns(3.2)
    t = tarr(n)
    out = []
    for _ in range(2):
        x = filt(noise(n), "hp", 3800) * (0.65 * np.exp(-t / 1.3) + 0.35 * np.exp(-t / 0.12))
        shimmer = sum(np.sin(2 * np.pi * RNG.uniform(3000, 11000) * t + RNG.random() * 6)
                      * np.exp(-t / RNG.uniform(0.4, 1.6)) for _ in range(10)) * 0.04
        out.append(filt(x + shimmer, "lp", 13000))
    return np.stack(out, axis=1) * 0.7


def impact():
    n = ns(4.0)
    t = tarr(n)
    f = 30 + 45 * np.exp(-t / 0.3)
    boom = sine_sweep(f, n) * np.exp(-t / 1.0) * np.minimum(1, t / 0.002)
    crack = filt(noise(n), "lp", 4000) * np.exp(-t / 0.05) + filt(noise(n), "hp", 1500) * np.exp(-t / 0.015) * 0.5
    thud = filt(noise(n), "lp", 180) * np.exp(-t / 0.2) * 3.0
    return np.tanh(1.5 * (boom + 0.6 * crack + 0.6 * thud)) * 0.9


def subdrop(dur=1.8):
    n = ns(dur)
    t = tarr(n)
    p = t / dur
    f = 72 * (24 / 72) ** p
    return sine_sweep(f, n) * (1 - p) ** 1.2 * np.minimum(1, t / 0.004)


def supersaw(midi, n, voices=7, spread=0.22, width=1.0):
    """立体声超级锯齿，spread 为最大失谐（半音）。"""
    det = np.linspace(-spread, spread, voices)
    out = np.zeros((n, 2))
    for k, d in enumerate(det):
        g = 1.0 if abs(d) < 1e-9 else 0.72
        v = saw(midi_hz(midi + d), n) * g
        pan = (k / max(1, voices - 1) * 2 - 1) * width
        out += pan2(v, pan * 0.9)
    return out / np.sqrt(voices)


def braam(big=False, length=4.6):
    n = ns(length)
    t = tarr(n)
    notes = [(26, 1.0), (38, 0.9), (45, 0.7), (50, 0.6), (53, 0.45)] + ([(57, 0.4), (62, 0.25)] if big else [])
    src = sum(supersaw(m, n, voices=5, spread=0.12) * g for m, g in notes)
    fc = 150 + 2600 * (1 - np.exp(-t / 0.05)) * np.exp(-t / 0.8) + 350 * np.exp(-t / 2.5)
    y = tv_filt(src, "lp", fc, q=1.3)
    amp = np.minimum(1, t / 0.015) * (0.6 * np.exp(-t / 2.4) + 0.4 * np.exp(-t / 0.6))
    y = np.tanh(2.0 * y * amp[:, None])
    sub = np.sin(2 * np.pi * midi_hz(26) * t) * np.exp(-t / 2.0) * 0.6 * np.minimum(1, t / 0.01)
    return (y + sub[:, None]) * 0.8


def stab(ch, length=1.3):
    n = ns(length)
    t = tarr(n)
    notes = PAD_VOICE[ch] + [m + 12 for m in PAD_VOICE[ch][-3:]] + [BASS_ROOT[ch]]
    src = sum(supersaw(m, n, voices=5, spread=0.15) for m in notes) / np.sqrt(len(notes))
    fc = 350 + 5200 * np.exp(-t / 0.16)
    y = tv_filt(src, "lp", fc, q=1.1)
    amp = np.minimum(1, t / 0.004) * (0.7 * np.exp(-t / 0.22) + 0.3 * np.exp(-t / 0.9))
    return np.tanh(2.2 * y * amp[:, None]) * 0.8


def glass():
    n = ns(1.6)
    t = tarr(n)
    out = np.zeros((n, 2))
    for _ in range(26):
        d = RNG.uniform(0, 0.35)
        f = RNG.uniform(2500, 9000)
        k = ns(d)
        m = n - k
        tt = tarr(m)
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / RNG.uniform(0.05, 0.4))
        out[k:] += pan2(s, RNG.uniform(-0.8, 0.8)) * RNG.uniform(0.2, 0.6)
    out += pan2(filt(noise(n), "hp", 3000) * np.exp(-t / 0.08), 0) * 0.8
    return out * 0.25


# ============================================================ 效果音
def riser(dur):
    n = ns(dur)
    t = tarr(n)
    p = t / dur
    fc = 250 * (9500 / 250) ** p
    nz = np.stack([noise(n), noise(n)], axis=1)
    y = tv_filt(nz, "bp", fc, q=1.4) * (p ** 2.2)[:, None] * 2.0
    rate = (2 + 6 * p ** 2) / TL.BEAT            # 8 分 → 32 分
    gate = 0.6 + 0.4 * np.cos(2 * np.pi * np.cumsum(rate) / SR)
    y *= gate[:, None]
    tone = np.zeros((n, 2))
    for m in (62, 69, 74):
        f = midi_hz(m) * 2 ** p
        v = saw(f, n) + saw(f * 1.004, n)
        tone += pan2(v, RNG.uniform(-0.5, 0.5))
    tone = tv_filt(tone, "lp", 300 + 6000 * p ** 2, q=0.8) * (p ** 3)[:, None] * 0.25
    out = (y + tone) * 0.9
    out[-ns(0.004):] *= np.linspace(1, 0, ns(0.004))[:, None]
    return out


def swell(dur, ir):
    """反向镲：混响尾巴倒放，峰值正好落在终点。"""
    c = crash()[:, 0] + 0.5 * impact()[: len(crash())]
    w = fftconvolve(c, ir[:, 0])[: ns(5.0)]
    w = w[::-1]
    n = ns(dur)
    w = w[-n:] if len(w) >= n else np.concatenate([np.zeros(n - len(w)), w])
    w = filt(w, "hp", 300)
    p = np.linspace(0, 1, n)
    w = w * p ** 1.5
    w /= np.max(np.abs(w)) + 1e-9
    st = np.stack([w, np.roll(w, 37)], axis=1)
    st[-ns(0.003):] *= np.linspace(1, 0, ns(0.003))[:, None]
    return st * 0.55


def whoosh(dur=0.8, peak=0.62):
    n = ns(dur)
    p = np.linspace(0, 1, n)
    env = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.6)
    fc = np.where(p < peak, 350 * (4800 / 350) ** (p / peak), 4800 * (1400 / 4800) ** ((p - peak) / (1 - peak)))
    y = tv_filt(noise(n), "bp", fc, q=2.2) * env * 3.0
    th = (0.15 + 0.7 * p) * np.pi / 2
    return np.stack([y * np.cos(th), y * np.sin(th)], axis=1) * 0.6


def downlifter(dur):
    n = ns(dur)
    t = tarr(n)
    p = t / dur
    y = tv_filt(noise(n), "bp", 7000 * (150 / 7000) ** p, q=1.3) * (1 - p) ** 1.5 * 2.0
    s = sine_sweep(300 * (40 / 300) ** p, n) * (1 - p) * 0.5
    return pan2(y + s, 0) * 0.5


def fm_bell(midi, dur=3.0, ratio=3.5, idx=3.0, decay=1.6):
    n = ns(dur)
    t = tarr(n)
    f = float(midi_hz(midi))
    mod = np.sin(2 * np.pi * f * ratio * t) * (idx * np.exp(-t / 0.4) + 0.3)
    car = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / decay) * np.minimum(1, t / 0.002)
    car += np.sin(2 * np.pi * 2 * f * t) * 0.15 * np.exp(-t / (decay * 0.4))
    return car


def keys(midi, dur=2.5):
    n = ns(dur)
    t = tarr(n)
    f = float(midi_hz(midi))
    mod = np.sin(2 * np.pi * f * t) * (1.8 * np.exp(-t / 0.35) + 0.25)
    car = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 1.4) * np.minimum(1, t / 0.003)
    tine = np.sin(2 * np.pi * 14 * f * t) * np.exp(-t / 0.02) * 0.06
    return (car + tine) * 0.8


def pop(midi):
    n = ns(0.5)
    t = tarr(n)
    f = float(midi_hz(midi))
    mod = np.sin(2 * np.pi * 2 * f * t) * 2.0 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.12) * np.minimum(1, t / 0.001)
    x += filt(noise(n), "hp", 4000) * np.exp(-t / 0.003) * 0.3
    return x * 0.7


def tick():
    n = ns(0.12)
    t = tarr(n)
    return (filt(noise(n), "hp", 2500) * np.exp(-t / 0.002) + 0.5 * np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.008)) * 0.6


def shimmer(ch):
    tones = chord_tones(ch, 84) + chord_tones(ch, 96)
    out = np.zeros((ns(2.6), 2))
    for k in range(9):
        m = tones[k % len(tones)]
        s = fm_bell(m, 2.0, ratio=2.0, idx=1.2, decay=0.7) * (0.9 - 0.06 * k)
        i = ns(0.035 * k)
        out[i:i + len(s)] += pan2(s, -0.7 + 0.17 * k)
    return out * 0.18


def heartbeat():
    n = ns(0.7)
    out = np.zeros(n)
    for d, g in ((0.0, 1.0), (0.22, 0.7)):
        k = ns(d)
        tt = tarr(n - k)
        out[k:] += sine_sweep(46 + 32 * np.exp(-tt / 0.03), n - k) * np.exp(-tt / 0.09) * g
    return filt(out, "lp", 220) * 1.2


def glitch(ch, dur=0.9):
    n = ns(dur)
    out = np.zeros((n, 2))
    step = ns(TL.STEP / 2)
    tones = chord_tones(ch, 60) + chord_tones(ch, 72)
    for k in range(n // step):
        if RNG.random() < 0.25:
            continue
        seg = step if RNG.random() < 0.7 else step // 2
        tt = tarr(seg)
        kind = RNG.integers(3)
        if kind == 0:
            s = saw(midi_hz(tones[RNG.integers(len(tones))]) * RNG.choice([1, 2, 4]), seg)
            s = np.round(s * 6) / 6                       # 降位深
        elif kind == 1:
            s = filt(noise(seg), "bp", RNG.uniform(800, 6000), 3.0) * 3
        else:
            s = np.sign(np.sin(2 * np.pi * RNG.uniform(60, 400) * tt))
        s = fade_edges(s, 0.0005, 0.001) * RNG.uniform(0.4, 1.0)
        out[k * step:k * step + seg] += pan2(s, RNG.uniform(-0.8, 0.8))
    return out * 0.3


def tape_stop(dur=0.32):
    n = ns(dur)
    p = np.linspace(0, 1, n)
    r = (1 - p) ** 1.6
    x = sum(saw(midi_hz(m) * r, n) for m in (50, 57, 62, 65))
    x = tv_filt(x, "lp", 100 + 3500 * (1 - p), 0.8) * (1 - p) * 0.3
    return pan2(x, 0)


# ============================================================ 乐器
def pad_chord(ch, dur, rel=0.9, att=0.35):
    n = ns(dur + rel)
    t = tarr(n)
    out = sum(supersaw(m, n, voices=7, spread=0.2) for m in PAD_VOICE[ch]) / 2.0
    env = np.minimum(1, t / att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    return out * env[:, None]


def choir_chord(ch, dur, rel=1.0, att=0.5):
    n = ns(dur + rel)
    t = tarr(n)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.0 * t + RNG.random() * 6)
    out = np.zeros((n, 2))
    for m in CHOIR_VOICE[ch]:
        for d in (-0.08, 0.0, 0.08):
            out += pan2(saw(midi_hz(m + d) * vib, n), RNG.uniform(-0.7, 0.7))
    env = np.minimum(1, t / att) * np.where(t < dur, 1.0, np.exp(-(t - dur) / (rel / 3)))
    return out * env[:, None] / 4.0


_OST = {}


def ost_note(midi, length=0.16):
    key = (midi, length)
    if key not in _OST:
        n = ns(length)
        t = tarr(n)
        f = float(midi_hz(midi))
        x = 0.6 * saw(f, n) + 0.4 * pulse(f, n, 0.3)
        e = np.exp(-t / 0.045)
        y = filt(x, "lp", 900) * (1 - e) + filt(x, "lp", 5000) * e
        amp = np.minimum(1, t / 0.002) * np.exp(-t / 0.085)
        _OST[key] = fade_edges(y * amp, 0.0005, 0.01)
    return _OST[key]


def lead_note(midi, dur):
    n = ns(dur + 0.28)
    t = tarr(n)
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.18) / 0.25, 0, 1)
    f = float(midi_hz(midi)) * vib
    out = []
    for side in (-1, 1):
        x = saw(f * 2 ** (side * 7 / 1200), n) + saw(f * 2 ** (-side * 3 / 1200), n) + 0.7 * saw(f, n)
        x += 0.25 * pulse(f / 2, n, 0.5)
        fc = 650 + 3300 * (1 - np.exp(-t / 0.06)) * (0.55 + 0.45 * np.exp(-t / 0.45))
        out.append(tv_filt(x, "lp", fc, q=0.9, block=256))
    x = np.stack(out, axis=1)
    amp = np.minimum(1, t / 0.025) * (0.78 + 0.22 * np.exp(-t / 0.25))
    amp *= np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.06))
    return np.tanh(1.4 * x * amp[:, None] * 0.5)


def bass_note(midi, dur, kind):
    n = ns(dur + (0.02 if kind == "8th" else 0.3))
    t = tarr(n)
    f = float(midi_hz(midi))
    sub = np.sin(2 * np.pi * f * t)
    grit = filt(saw(f, n) + saw(f * 1.005, n), "lp", 380 if kind == "8th" else 200)
    if kind == "8th":
        amp = np.minimum(1, t / 0.003) * np.where(t < dur * 0.85, 1.0, np.exp(-(t - dur * 0.85) / 0.01))
    else:
        amp = np.minimum(1, t / 0.05) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.08))
    lvl = 1.0 if kind == "8th" else 0.5
    return np.tanh(1.3 * (0.8 * sub + 0.6 * grit)) * amp * lvl


def drone(dur):
    n = ns(dur)
    t = tarr(n)
    low = saw(midi_hz(26), n) + saw(midi_hz(38) * 1.002, n) + 0.6 * saw(midi_hz(45), n)
    low = tv_filt(low, "lp", 160 + 140 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)), q=1.0, block=512)
    air = filt(noise(n), "lp", 1200) * 0.08
    hi = (np.sin(2 * np.pi * midi_hz(74) * t) + 0.7 * np.sin(2 * np.pi * midi_hz(81) * t)
          + 0.4 * np.sin(2 * np.pi * midi_hz(86) * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.21 * t)) * 0.06
    x = 0.5 * low + air
    return np.stack([x + hi, x + np.roll(hi, ns(0.013))], axis=1)


def make_ir(rt60, length, predelay=0.015, bright=0.6, cut=2500):
    n = ns(length)
    t = tarr(n)
    ir = np.stack([noise(n), noise(n)], axis=1)
    lo = filt(ir, "lp", cut)
    hi = ir - lo
    ir = lo * (10 ** (-3 * t / rt60))[:, None] + hi * (10 ** (-3 * t / (rt60 * 0.5)))[:, None] * bright
    k = ns(0.01)
    ir[:k] *= np.linspace(0, 1, k)[:, None]
    ir = np.concatenate([np.zeros((ns(predelay), 2)), ir])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


# ============================================================ 混音台
class Mixer:
    def __init__(self, n):
        self.n = n
        self.bus = {}
        self.sends = {"hall": np.zeros((n, 2)), "room": np.zeros((n, 2))}

    def get(self, name):
        if name not in self.bus:
            self.bus[name] = np.zeros((self.n, 2))
        return self.bus[name]

    def add(self, name, x, t, gain=1.0, pan=0.0, hall=0.0, room=0.0):
        x = pan2(x, pan) if x.ndim == 1 else x
        i = ns(t)
        if i >= self.n:
            return
        if i < 0:
            x = x[-i:]
            i = 0
        m = min(len(x), self.n - i)
        seg = x[:m] * gain
        self.get(name)[i:i + m] += seg
        if hall:
            self.sends["hall"][i:i + m] += seg * hall
        if room:
            self.sends["room"][i:i + m] += seg * room


def k_weight(x):
    b1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]
    a1 = [1.0, -1.69065929318241, 0.73248077421585]
    b2 = [1.0, -2.0, 1.0]
    a2 = [1.0, -1.99004745483398, 0.99007225036621]
    return lfilter(b2, a2, lfilter(b1, a1, x, axis=0), axis=0)


def lufs(x):
    y = k_weight(x)
    blk, hop = ns(0.4), ns(0.1)
    ms = np.array([np.sum(np.mean(y[i:i + blk] ** 2, axis=0)) for i in range(0, len(y) - blk, hop)])
    ld = -0.691 + 10 * np.log10(ms + 1e-12)
    g = ms[ld > -70]
    rel = -0.691 + 10 * np.log10(np.mean(g)) - 10
    g = ms[(ld > -70) & (ld > rel)]
    return -0.691 + 10 * np.log10(np.mean(g))


def limiter(x, ceiling=0.84, look=0.004, rel=0.08):
    peak = np.max(np.abs(x), axis=1)
    g = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    g = minimum_filter1d(g, size=2 * ns(look) + 1)
    a = np.exp(-1 / (rel * SR))
    gs = lfilter([1 - a], [1, -a], g, zi=[g[0] * a])[0]
    gs = np.minimum(gs, g)
    # 二次平滑，避免增益阶跃
    gs = lfilter([0.5, 0.5], [1], gs)
    return x * np.minimum(gs, g)[:, None]


# ============================================================ 编曲
AUTO = {
    "pad_gain": [(8, 0.9), (11.9, 0.9), (12, 0.6), (27.9, 0.7), (28, 0.8), (47.9, 0.8), (48, 0.85),
                 (59.4, 0.9), (60, 0.9), (77.9, 0.9), (78, 0.8), (79.9, 0.45), (80, 0.65), (91.9, 0.8),
                 (92, 1.0), (103, 0.85), (106, 0.0)],
    "pad_cut": [(8, 700), (12, 1400), (26, 1800), (27.9, 3200), (28, 4200), (47.9, 4200), (48, 850),
                (55.9, 1000), (59.4, 4200), (60, 5200), (77.9, 5200), (79.9, 700), (80, 1100),
                (87.9, 1300), (91.9, 3600), (92, 6000), (103, 2600), (106, 700)],
    "ost_gain": [(11, 0.35), (11.9, 0.5), (12, 0.9), (27.9, 0.95), (28, 0.85), (47.9, 0.85), (56, 0.25),
                 (59.4, 1.0), (60, 0.85), (77.9, 0.85), (80, 0.4), (87.9, 0.45), (88, 0.35), (91.9, 0.9),
                 (92, 0.9), (99.4, 0.9)],
    "ost_cut": [(11, 1500), (12, 2800), (27.9, 4400), (28, 5000), (56, 1200), (59.4, 6500), (60, 5500),
                (80, 1600), (88, 1500), (91.9, 5200), (92, 6200)],
    "choir_gain": [(28, 0.35), (47.9, 0.35), (60, 0.8), (77.9, 0.8), (92, 1.0), (103.9, 0.6)],
    "sc_depth": [(0, 0.0), (12, 0.35), (27.9, 0.35), (28, 0.6), (47.9, 0.6), (48, 0.0), (56, 0.3),
                 (59.9, 0.3), (60, 0.62), (77.9, 0.62), (78, 0.0), (80, 0.2), (91.9, 0.2), (92, 0.66),
                 (99.9, 0.66), (100, 0.0)],
}

OST_MODE = {}
for b in range(11, 12):
    OST_MODE[b] = "8th"
for rng_, m in [((12, 28), "8th"), ((28, 48), "16th"), ((56, 60), "16th"), ((60, 78), "16th"),
                ((80, 88), "8th"), ((88, 92), "16th"), ((92, 100), "16th")]:
    for b in range(*rng_):
        OST_MODE[b] = m

BASS_MODE = {}
for rng_, m in [((8, 28), "long"), ((28, 48), "8th"), ((48, 60), "long"), ((60, 78), "8th"),
                ((78, 80), "long"), ((80, 92), "long"), ((92, 100), "8th"), ((100, 104), "long")]:
    for b in range(*rng_):
        BASS_MODE[b] = m

CHOIR_BARS = set(range(28, 48)) | set(range(60, 78)) | set(range(92, 104))
PAD_BARS = set(range(8, 106))

INTRO_BELLS = [(0, 74), (0.5, 81), (1.0, 77), (1.5, 76), (2.0, 74), (3.0, 69),
               (4, 74), (4.5, 81), (5.0, 82), (5.5, 81), (6.0, 77), (6.5, 76), (7.0, 74), (7.5, 69)]
TITLE_BELLS = [(9.0, 86), (9.5, 81), (10.0, 84), (10.5, 81)]
OUTRO_BELLS = [(104, 74), (104.5, 81), (105, 77), (105.5, 76), (106, 74), (106.75, 62)]


def segments(bars_set, chords):
    """把相邻且和弦相同的小节合并成段：[(起小节, 小节数, 和弦)]"""
    segs = []
    for b in sorted(bars_set):
        ch = chords[b] if b < len(chords) else chords[-1]
        if segs and segs[-1][0] + segs[-1][1] == b and segs[-1][2] == ch:
            segs[-1][1] += 1
        else:
            segs.append([b, 1, ch])
    return segs


def gate_curve(n):
    g = np.ones(n)
    for a, b in TL.SILENCES:
        i, j = ns(TL.sec(a)), ns(TL.sec(b))
        r = ns(0.006)
        g[i:j] = 0.0
        g[max(0, i - r):i] = np.minimum(g[max(0, i - r):i], np.linspace(1, 0, i - max(0, i - r)))
    return g


def build(out_path):
    n = ns(TL.DURATION + 0.3)
    mx = Mixer(n)
    t_bars = np.arange(n) / SR / TL.BAR
    hall_ir = make_ir(3.2, 4.5, 0.02, 0.55)
    room_ir = make_ir(0.9, 1.2, 0.006, 0.8, cut=5000)
    print("· 鼓")

    drum_bank = {
        "kick": [kick() for _ in range(3)],
        "snare": [snare() for _ in range(4)],
        "hat": [hat() for _ in range(4)],
        "taiko": [taiko() for _ in range(3)],
        "crash": [crash() for _ in range(2)],
    }
    for i, f0 in enumerate([140, 115, 95, 78]):
        drum_bank["tom%d" % i] = [taiko(f0, 0.3) for _ in range(2)]
    rr = {k: 0 for k in drum_bank}
    hat_pan = 0
    kicks = []
    for (t, inst, v) in TL.drum_events():
        bank = drum_bank[inst]
        x = bank[rr[inst] % len(bank)]
        rr[inst] += 1
        if inst == "kick":
            mx.add("drums", x, t, 0.95 * v, room=0.06)
            kicks.append((t, v))
        elif inst == "snare":
            mx.add("drums", x, t, 0.62 * v, pan=0.05, hall=0.22, room=0.15)
        elif inst == "hat":
            hat_pan ^= 1
            mx.add("drums", x, t, 0.20 * v, pan=0.28 if hat_pan else 0.18, room=0.05)
        elif inst == "taiko":
            mx.add("drums", x, t, 0.75 * v, pan=-0.1, hall=0.25)
        elif inst.startswith("tom"):
            k = int(inst[-1])
            mx.add("drums", x, t, 0.6 * v, pan=[-0.45, -0.15, 0.15, 0.45][k], hall=0.2)
        elif inst == "crash":
            mx.add("drums", x, t, 0.32 * v, hall=0.12)

    print("· 重击 / braam / 效果音")
    imp_bank = [impact() for _ in range(3)]
    for k, (bar, s, kind) in enumerate(TL.HITS):
        t = TL.sec(bar)
        ch = TL.CHORDS[min(int(bar), TL.TOTAL_BARS - 1)]
        imp = imp_bank[k % 3]
        if kind in ("braam", "braam_big"):
            big = kind == "braam_big"
            mx.add("braam", braam(big), t, 0.85, hall=0.35)
            mx.add("sfx", imp, t, 0.85, hall=0.3)
            mx.add("drums", drum_bank["crash"][0], t, 0.5, hall=0.2)
            mx.add("sfx", subdrop(2.2), t, 0.55)
            if big:
                mx.add("braam", stab(ch, 2.0), t, 0.45, hall=0.3)
        elif kind == "hit":
            mx.add("sfx", imp, t, 0.62 * s, hall=0.25 * s)
            if s >= 0.5:
                mx.add("drums", drum_bank["crash"][1], t, 0.28 * s, hall=0.1)
        elif kind in ("stab", "stab_big"):
            mx.add("braam", stab(ch), t, 0.62 * s, hall=0.25)
            mx.add("sfx", imp, t, 0.45 * s, hall=0.2)
            mx.add("drums", drum_bank["snare"][0], t, 0.55 * s, hall=0.4)
            mx.add("drums", drum_bank["crash"][k % 2], t, 0.35 * s, hall=0.1)
            if kind == "stab_big":
                for d, p in ((0.0, -0.3), (0.012, 0.3), (0.024, 0.0)):
                    mx.add("drums", drum_bank["taiko"][int(d * 1000) % 3], t + d, 0.6, pan=p, hall=0.35)
                mx.add("sfx", subdrop(1.2), t, 0.4)
        elif kind == "slam":
            mx.add("sfx", imp, t, 1.0, hall=0.45)
            mx.add("sfx", impact(), t + 0.004, 0.6, hall=0.3)
            mx.add("braam", stab("Dm", 1.6), t, 0.7, hall=0.35)
            mx.add("sfx", glass(), t, 0.9, hall=0.3)
            mx.add("sfx", subdrop(2.0), t, 0.7)
            mx.add("drums", drum_bank["crash"][0], t, 0.55, hall=0.2)
        elif kind == "glitch":
            mx.add("sfx", glitch(ch), t, 0.75)
        elif kind == "tail":
            mx.add("sfx", imp, t, 0.8 * s, hall=0.6)
            mx.add("drums", drum_bank["crash"][0], t, 0.45, hall=0.3)
            mx.add("braam", braam(False, 4.0), t, 0.45 * s, hall=0.5)
        elif kind == "soft":
            mx.add("sfx", filt(imp, "lp", 400), t, 0.5 * s, hall=0.3)
            mx.add("bell", fm_bell(chord_tones(ch, 84)[0], 3.0), t, 0.18, pan=0.2, hall=0.5)

    print("· 字幕音效")
    pop_i = 0
    for it in TL.TEXTS:
        sfx = it.get("sfx")
        if not sfx:
            continue
        times = [s[1] for s in it["segs"]] if it.get("segs") else [it["t0"]]
        for tb in times:
            t = TL.sec(tb)
            ch = TL.CHORDS[min(int(tb), TL.TOTAL_BARS - 1)]
            if sfx == "pop":
                tones = chord_tones(ch, 84) + chord_tones(ch, 96)
                mx.add("sfx", pop(tones[pop_i % len(tones)]), t, 0.32, pan=-0.3 + 0.2 * (pop_i % 4), hall=0.25)
                pop_i += 1
            elif sfx == "tick":
                mx.add("sfx", tick(), t, 0.35, pan=0.15, room=0.2)
            elif sfx == "whoosh":
                d = 0.8
                mx.add("sfx", whoosh(d), t - 0.62 * d, 0.5, hall=0.15)
            elif sfx == "shimmer":
                mx.add("sfx", shimmer(ch), t, 0.8, hall=0.4)

    print("· 上升音 / 反向镲 / 下降音")
    for a, b in TL.RISERS:
        mx.add("sfx", riser(TL.sec(b) - TL.sec(a)), TL.sec(a), 0.42, hall=0.15)
    for a, b in TL.SWELLS:
        dur = TL.sec(b) - TL.sec(a)
        mx.add("post", swell(dur, hall_ir), TL.sec(a), 0.75)
    for a, b in TL.DOWNLIFTERS:
        mx.add("sfx", downlifter(TL.sec(b) - TL.sec(a)), TL.sec(a), 0.6, hall=0.3)
    mx.add("post", tape_stop(), TL.sec(21.0) - 0.02, 0.6)

    # 引子：心跳（每 2 拍一次，与 150 BPM 半拍律动一致）与秒针
    hb = heartbeat()
    for k in range(int(TL.sec(8) / (2 * TL.BEAT))):
        t = k * 2 * TL.BEAT
        mx.add("sfx", hb, t, 0.3 + 0.45 * (t / TL.sec(8)), hall=0.05)
    for k in range(16, 32):
        mx.add("sfx", tick(), k * TL.BEAT, 0.12 + 0.12 * (k - 16) / 16, pan=0.35 if k % 2 else -0.35, room=0.3)

    print("· 铃音 / 键盘")
    for b, m in INTRO_BELLS + TITLE_BELLS + OUTRO_BELLS:
        mx.add("bell", fm_bell(m, 4.0), TL.sec(b), 0.33, pan=RNG.uniform(-0.35, 0.35), hall=0.55)
    # 第三章 breakdown：八音盒式分解和弦
    for b in range(48, 60):
        ch = TL.CHORDS[b]
        tones = chord_tones(ch, 72) + [chord_tones(ch, 84)[0]]
        per = 4 if b < 56 else 8
        for k in range(per):
            m = [tones[0], tones[2], tones[1] + 12 if tones[1] + 12 < 90 else tones[1], tones[3]][k % 4]
            mx.add("bell", fm_bell(m, 2.5, ratio=2.0, idx=1.5, decay=1.0), TL.sec(b + k / per), 0.16,
                   pan=-0.4 + 0.27 * (k % 4), hall=0.5)
    # 第五章：键盘弹主题
    for b, m, d in phrase_notes(PHRASE_A, 80):
        mx.add("keys", keys(m, 2.8), TL.sec(b), 0.42, pan=0.1, hall=0.45)
    for b, m in [(88, 79), (89, 82), (90, 81), (91, 85), (91.5, 88)]:
        mx.add("keys", keys(m, 3.0), TL.sec(b), 0.42, pan=-0.1, hall=0.45)

    print("· 引子长音")
    mx.add("drone", drone(TL.sec(8) + 0.4), 0.0, 1.0, hall=0.2)
    mx.add("drone", drone(TL.sec(4) + 1.0), TL.sec(104), 1.0, hall=0.2)

    print("· 铺底和声 / 合唱")
    for b, length, ch in segments(PAD_BARS, TL.CHORDS):
        dur = length * TL.BAR
        mx.add("pad", pad_chord(ch, dur, rel=1.6 if b + length >= 104 else 0.9), TL.sec(b), 1.0, hall=0.25)
    for b, length, ch in segments(CHOIR_BARS, TL.CHORDS):
        mx.add("choir", choir_chord(ch, length * TL.BAR), TL.sec(b), 1.0, hall=0.4)

    print("· 低音")
    for b, length, ch in segments(set(BASS_MODE), TL.CHORDS):
        mode = BASS_MODE[b]
        root = BASS_ROOT[ch]
        if mode == "long":
            mx.add("bass", bass_note(root, length * TL.BAR, "long"), TL.sec(b), 1.0)
        else:
            for k in range(length * 8):
                m = root + (12 if k % 4 == 3 else 0)
                mx.add("bass", bass_note(m, TL.BEAT / 2, "8th"), TL.sec(b) + k * TL.BEAT / 2, 1.0 if k % 2 else 0.85)

    print("· 弦乐断奏")
    patt = [0, 7, 12, 7, None, 7, 12, 7]
    for b, mode in sorted(OST_MODE.items()):
        ch = TL.CHORDS[b]
        r = OST_ROOT[ch]
        third = QUAL[ch][1]
        offs = [o if o is not None else 12 + third for o in patt]
        nstep = 16 if mode == "16th" else 8
        dt = TL.BAR / nstep
        for k in range(nstep):
            m = r + offs[k % 8]
            v = 1.0 if k % 4 == 0 else 0.72
            mx.add("ost", ost_note(m, 0.16 if mode == "16th" else 0.24), TL.sec(b) + k * dt, v,
                   pan=0.3 if k % 2 else -0.3, hall=0.12)

    print("· 铜管主旋律")
    for a, b, which in TL.LEAD:
        notes = []
        if which == "A+B":
            notes = phrase_notes(PHRASE_A, a) + phrase_notes(PHRASE_B, a + 8)
        else:
            notes = phrase_notes(PHRASE_B, a)
        for nb, m, d in notes:
            x = lead_note(m - 12, d * TL.BEAT)
            mx.add("lead", x, TL.sec(nb), 1.0, hall=0.3)
            mx.add("lead", lead_note(m, d * TL.BEAT), TL.sec(nb), 0.33, hall=0.3)

    # -------------------------------------------------- 总线处理
    print("· 总线处理")
    B = mx.bus
    # 侧链：按底鼓时刻生成压缩包络
    duck = np.zeros(n)
    for t, v in kicks:
        i = ns(t)
        m = min(n - i, ns(0.42))
        tt = tarr(m)
        duck[i:i + m] = np.maximum(duck[i:i + m], v * np.exp(-tt / 0.13) * np.minimum(1, tt / 0.004 + 0.3))
    sc = 1 - interp_keys(AUTO["sc_depth"], t_bars) * duck
    B["pad"] = tv_filt(filt(B["pad"], "hp", 140), "lp", interp_keys(AUTO["pad_cut"], t_bars), q=0.8, block=512)
    B["pad"] *= (interp_keys(AUTO["pad_gain"], t_bars) * sc)[:, None]
    B["ost"] = tv_filt(filt(B["ost"], "hp", 180), "lp", interp_keys(AUTO["ost_cut"], t_bars), q=0.9, block=512)
    B["ost"] *= (interp_keys(AUTO["ost_gain"], t_bars) * sc)[:, None]
    ch = B["choir"]
    ch = filt(ch, "bp", 700, 4.0) * 1.0 + filt(ch, "bp", 1150, 5.0) * 0.6 + filt(ch, "bp", 2700, 7.0) * 0.3
    B["choir"] = ch * (interp_keys(AUTO["choir_gain"], t_bars) * sc)[:, None]
    B["bass"] = filt(B["bass"], "lp", 900) * sc[:, None]
    B["lead"] = filt(B["lead"], "hp", 160)
    # 主旋律附点八分乒乓延迟
    d = ns(TL.BEAT * 0.75)
    lead = B["lead"]
    echo = np.zeros_like(lead)
    src = filt(lead, "lp", 3500) * 0.32
    for k in range(1, 5):
        sh = d * k
        side = 0 if k % 2 else 1
        echo[sh:, side] += src[:-sh, 0 if side else 1] * (0.55 ** (k - 1))
    B["lead"] = lead + echo

    # 自动电平：参考窗口里把各轨推到目标 RMS（dBFS）
    def rms_db(x, a, b):
        seg = x[ns(TL.sec(a)):ns(TL.sec(b))]
        return 10 * np.log10(np.mean(seg ** 2) + 1e-12)

    targets = {
        "drums": (60, 74, -15.0), "bass": (60, 74, -19.5), "pad": (60, 74, -22.0), "ost": (60, 74, -23.5),
        "choir": (60, 74, -26.0), "lead": (60, 74, -19.5), "keys": (80, 88, -23.0),
        "drone": (1, 8, -24.0),
    }
    gains = {}
    for name, (a, b, tgt) in targets.items():
        if name in B:
            g = 10 ** ((tgt - rms_db(B[name], a, b)) / 20)
            gains[name] = g
            B[name] = B[name] * g
    print("  电平增益:", {k: round(20 * np.log10(v), 1) for k, v in gains.items()})
    # 效果类总线是按“相对鼓组”的增益写的，跟随鼓组的自动电平一起缩放
    for name in ("sfx", "braam", "bell", "post"):
        if name in B and name != "post":
            B[name] = B[name] * gains["drums"]
    if STATS:
        import json
        stats = {}
        for name, x in B.items():
            per_bar = []
            for b in range(TL.TOTAL_BARS):
                seg = x[ns(TL.sec(b)):ns(TL.sec(b + 1))]
                per_bar.append([round(10 * np.log10(np.mean(seg ** 2) + 1e-12), 1),
                                round(20 * np.log10(np.max(np.abs(seg)) + 1e-12), 1)])
            stats[name] = per_bar
        json.dump(stats, open(STATS, "w"))
    # 发送到混响的量也按轨增益缩放已不可行（发送在放置时累积），因此用固定湿声比
    print("· 混响")
    wet_hall = np.stack([fftconvolve(mx.sends["hall"][:, c], hall_ir[:, c])[:n] for c in range(2)], axis=1)
    wet_room = np.stack([fftconvolve(mx.sends["room"][:, c], room_ir[:, c])[:n] for c in range(2)], axis=1)
    wet_hall = filt(filt(wet_hall, "hp", 180), "lp", 7000)

    dry = sum(v for k, v in B.items() if k != "post")
    # 混响电平：相对干声的经验值
    dry_rms = np.sqrt(np.mean(dry[ns(TL.sec(60)):ns(TL.sec(74))] ** 2))
    hall_rms = np.sqrt(np.mean(wet_hall[ns(TL.sec(60)):ns(TL.sec(74))] ** 2)) + 1e-9
    room_rms = np.sqrt(np.mean(wet_room[ns(TL.sec(60)):ns(TL.sec(74))] ** 2)) + 1e-9
    mix = dry + wet_hall * (0.33 * dry_rms / hall_rms) + wet_room * (0.12 * dry_rms / room_rms)
    mix *= gate_curve(n)[:, None]
    post = B.get("post", np.zeros_like(mix))
    post_scale = 0.5 * np.max(np.abs(mix)) / (np.max(np.abs(post)) + 1e-9)
    mix = mix + post * post_scale

    # -------------------------------------------------- 母带
    print("· 母带")
    mix = filt(filt(mix, "hp", 30), "hp", 30)
    mix = filt(mix, "ls", 70, gain_db=-2.5)
    mix = filt(mix, "hs", 4000, gain_db=2.5)
    # 粘合压缩（RMS 包络，2:1，阈值 -14 dBFS）
    env = np.sqrt(lfilter([1 - np.exp(-1 / (0.05 * SR))], [1, -np.exp(-1 / (0.05 * SR))],
                          np.mean(mix ** 2, axis=1)) + 1e-12)
    ref = np.max(env)
    thr = ref * 10 ** (-10 / 20)
    gr = np.where(env > thr, (thr / env) ** 0.5, 1.0)
    mix *= gr[:, None]
    target = -12.0
    gain = 1.0
    for it in range(4):
        y = limiter(np.tanh(mix * gain * 1.1) / 1.1)
        L = lufs(y)
        print("  迭代 %d: %.2f LUFS, 峰值 %.3f" % (it, L, np.max(np.abs(y))))
        if abs(L - target) < 0.3:
            break
        gain *= 10 ** ((target - L) / 20)
    # 收尾淡出
    fo = ns(1.2)
    end = ns(TL.sec(TL.TOTAL_BARS)) + ns(0.6)
    y[end - fo:end] *= np.linspace(1, 0, fo)[:, None] ** 2
    y[end:] = 0
    wavfile.write(out_path, SR, y.astype(np.float32))
    print("写出", out_path, "%.1f s" % (len(y) / SR))


if __name__ == "__main__":
    if len(sys.argv) > 2:
        STATS = sys.argv[2]
    build(sys.argv[1] if len(sys.argv) > 1 else "build/music.wav")
