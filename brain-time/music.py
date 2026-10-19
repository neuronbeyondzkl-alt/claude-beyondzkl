"""程序化配乐："热血 / 燃"的混合史诗预告片风格（D 小调，120 BPM）。

所有鼓点、重击、上升音、反向镲、磁带停转、低通"走神"都读取 timeline.EVENTS，
与画面共用同一份时间表，因此卡点是采样级精确的。
"""
import numpy as np
from scipy import signal
from scipy.ndimage import maximum_filter1d

import timeline as TL
from timeline import T, EVENTS as E, BEAT, BAR, SR, MELODY, chord

N = int((TL.DURATION + 1.0) * SR)
RNG = np.random.default_rng(2024)

PC = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
      "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
TONES = {"Dm": ["D", "F", "A"], "Bb": ["Bb", "D", "F"], "F": ["F", "A", "C"], "C": ["C", "E", "G"],
         "Gm": ["G", "Bb", "D"], "A": ["A", "C#", "E"], "D": ["D", "F#", "A"], "Bm": ["B", "D", "F#"],
         "G": ["G", "B", "D"], "Dpow": ["D", "A", "D"]}


def midi(name):
    p, o = (name[:2], name[2:]) if len(name) > 2 and name[1] in "#b" else (name[:1], name[1:])
    return (int(o) + 1) * 12 + PC[p]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def pc_hz(p, octave):
    return hz((octave + 1) * 12 + PC[p])


def chord_hz(name, octave):
    """和弦音（根音在 octave 八度），保证三音、五音在根音之上。"""
    tones = TONES[name]
    root = (octave + 1) * 12 + PC[tones[0]]
    out = []
    for p in tones:
        m = (octave + 1) * 12 + PC[p]
        while m < root:
            m += 12
        out.append(hz(m))
    return out


# ---------------------------------------------------------------- 基础构件
def tt(d):
    return np.arange(int(d * SR)) / SR


def noise(n):
    return RNG.standard_normal(n)


def sos(kind, fc, order=2):
    return signal.butter(order, fc, btype=kind, fs=SR, output="sos")


def lp(x, fc, order=2):
    return signal.sosfilt(sos("lowpass", min(fc, SR * 0.45), order), x)


def hp(x, fc, order=2):
    return signal.sosfilt(sos("highpass", fc, order), x)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos("bandpass", [lo, min(hi, SR * 0.45)], order), x)


def saw(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def square(freq, n, phase=0.0):
    return 0.5 * (saw(freq, n, phase) - saw(freq, n, phase + 0.5))


def supersaw(freq, n, voices=5, detune=0.12, spread=1.0):
    """返回立体声 (2, n)。detune 以半音为单位。"""
    L, R = np.zeros(n), np.zeros(n)
    for i in range(voices):
        k = (i / (voices - 1) - 0.5) * 2 if voices > 1 else 0
        f = freq * 2 ** (k * detune / 12)
        s = saw(f, n, RNG.uniform())
        pan = 0.5 + 0.5 * k * spread
        L += s * np.sqrt(1 - pan)
        R += s * np.sqrt(pan)
    return np.stack([L, R]) / np.sqrt(voices)


def adsr(n, a=0.01, d=0.1, s=0.7, r=0.2, hold=None):
    hold = n / SR if hold is None else hold
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = np.clip((t - hold) / max(r, 1e-4), 0, 1)
    return e * (1 - rel) ** 2


def sweep_filter(x, f0, f1, kind="bandpass", q=1.2, block=256, curve="exp"):
    """块状更新系数的扫频滤波（RBJ 双二阶）。"""
    y = np.zeros_like(x)
    zi = np.zeros(2)
    nb = int(np.ceil(len(x) / block))
    for i in range(nb):
        k = i / max(nb - 1, 1)
        fc = f0 * (f1 / f0) ** k if curve == "exp" else f0 + (f1 - f0) * k
        w = 2 * np.pi * min(fc, SR * 0.45) / SR
        al = np.sin(w) / (2 * q)
        cw = np.cos(w)
        if kind == "bandpass":
            b = np.array([al, 0, -al])
        else:
            b = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2])
        a = np.array([1 + al, -2 * cw, 1 - al])
        seg = x[i * block:(i + 1) * block]
        out, zi = signal.lfilter(b / a[0], a / a[0], seg, zi=zi)
        y[i * block:(i + 1) * block] = out
    return y


def stereo(x, pan=0.0):
    if x.ndim == 2:
        return x
    p = (pan + 1) / 2
    return np.stack([x * np.sqrt(1 - p), x * np.sqrt(p)])


SPLIT = E.tapestop[1]   # 磁带停转点：之前与之后分开混音，停转后才能真正"静止"


class Bus:
    def __init__(self, name):
        self.name = name
        self.pre = np.zeros((2, N))
        self.post = np.zeros((2, N))

    def add(self, t, sig, gain=1.0, pan=0.0):
        s = stereo(np.asarray(sig, float), pan) * gain
        i = int(round(t * SR))
        if i >= N:
            return
        dst = self.pre if t < SPLIT - 1e-6 else self.post
        fl = min(int(0.015 * SR), s.shape[1])
        s = s.copy()
        s[:, -fl:] *= np.linspace(1, 0, fl)
        j = min(i + s.shape[1], N)
        if i < 0:
            s = s[:, -i:]
            i = 0
            j = min(s.shape[1], N)
        dst[:, i:j] += s[:, :j - i]


# ---------------------------------------------------------------- 鼓与打击乐
def kick(v):
    t = tt(0.6)
    f = 52 + 140 * np.exp(-t / 0.03) + 40 * np.exp(-t / 0.1)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.2)
    click = hp(noise(len(t)), 2500) * np.exp(-t / 0.005) * 0.8
    return np.tanh(2.3 * (body + click)) * v


def snare(v):
    t = tt(0.5)
    n = len(t)
    tone = (0.65 * np.sin(2 * np.pi * 182 * t) + 0.3 * np.sin(2 * np.pi * 329 * t)) * np.exp(-t / 0.07)
    nz = bp(noise(n), 1300, 9500) * np.exp(-t / 0.17)
    clap = np.zeros(n)
    for k, d in enumerate((0.0, 0.011, 0.023)):
        i = int(d * SR)
        seg = np.exp(-np.arange(n - i) / SR / (0.008 if k < 2 else 0.11))
        clap[i:] += seg
    clap = bp(noise(n), 900, 5200) * clap
    return np.tanh(1.6 * (0.9 * tone + 1.1 * nz + 0.7 * clap)) * v


def hat(v, open_=False):
    t = tt(0.4 if open_ else 0.08)
    metal = sum(square(f, len(t)) for f in (3140, 4670, 5810, 7230)) * 0.25
    x = hp(noise(len(t)) * 0.6 + metal, 7000, 4)
    return x * np.exp(-t / (0.2 if open_ else 0.022)) * v


def tom(v, f0=96):
    t = tt(0.7)
    f = f0 + 55 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.32)
    x += lp(noise(len(t)), 1500) * np.exp(-t / 0.04) * 0.4
    return np.tanh(1.5 * x) * v


def taiko(v):
    t = tt(1.1)
    f = 58 + 52 * np.exp(-t / 0.06)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    x += lp(noise(len(t)), 700) * np.exp(-t / 0.09) * 0.9
    x += bp(noise(len(t)), 1500, 4000) * np.exp(-t / 0.012) * 0.3
    return np.tanh(1.8 * x) * v


def crash(v, d=2.6):
    t = tt(d)
    x = hp(noise(len(t)), 3800, 2) * np.exp(-t / 0.9)
    x += sum(np.sin(2 * np.pi * f * t + RNG.uniform(0, 6)) for f in (3311, 4127, 5571, 6917)) * 0.05 * np.exp(-t / 1.4)
    return stereo(x * v * 0.8, 0.0) + stereo(hp(noise(len(t)), 5000) * np.exp(-t / 0.7) * 0.25 * v, 0.6)


def impact(size):
    d = 5.0
    t = tt(d)
    n = len(t)
    f = 30 + 40 * np.exp(-t / 0.7)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    boom = kick(1.0)
    nz = sweep_filter(noise(n) * np.exp(-t / 1.0), 6000, 180, "lowpass", 0.7) * 0.9
    metal = sum(np.sin(2 * np.pi * fr * t) * np.exp(-t / tau) * a
                for fr, tau, a in ((181, 1.4, 0.25), (487, 1.0, 0.15), (1013, 0.7, 0.08), (1631, 0.5, 0.05)))
    x = 0.6 * sub + metal * 1.4 + nz * 1.2
    x[:len(boom)] += boom * 1.1
    out = stereo(np.tanh(1.4 * x) * 0.9)
    if size >= 2:
        br = braam(3.6)
        out[:, :br.shape[1]] += br * 0.75
    return out


def braam(d):
    t = tt(d)
    n = len(t)
    x = np.zeros((2, n))
    for m, a in ((midi("D1"), 1.0), (midi("A1"), 0.8), (midi("D2"), 0.7), (midi("F2"), 0.35)):
        x += supersaw(hz(m), n, 5, 0.18) * a
    env = np.minimum(t / 0.015, 1) * np.exp(-t / 1.4)
    bright = np.exp(-t / 0.5)
    y = np.stack([hp(lp(x[c], 320) * (1 - bright) + lp(x[c], 2200) * bright, 45) for c in range(2)])
    return np.tanh(2.2 * y * env) * 0.6


def riser(d):
    t = tt(d)
    n = len(t)
    k = t / d
    nz = sweep_filter(noise(n), 250, 7000, "bandpass", 1.6) * 0.9
    f = pc_hz("D", 3) * 2 ** (3 * k ** 1.6)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(5 + 30 * k ** 2) / SR)
    tone = lp(saw(f, n) * trem, 7000) * 0.35
    shep = sum(np.sin(2 * np.pi * np.cumsum(f * r) / SR) for r in (0.5, 2.0)) * 0.12
    x = (nz + tone + shep) * k ** 2.2
    return np.stack([x, np.roll(x, 240)])


def revcym(d):
    c = crash(1.0, d + 0.2)
    c = c[:, :int(d * SR)][:, ::-1]
    return c * (np.linspace(0, 1, c.shape[1]) ** 1.5)


def whoosh(direction):
    d = 0.7
    t = tt(d)
    n = len(t)
    x = sweep_filter(noise(n), 300, 4500, "bandpass", 1.4) * np.sin(np.pi * t / d) ** 2
    p = np.linspace(-direction, direction, n) * 0.9
    return np.stack([x * np.sqrt((1 - p) / 2), x * np.sqrt((1 + p) / 2)])


def heartbeat(v):
    out = np.zeros(int(0.6 * SR))
    for off, f, a in ((0.0, 52, 1.0), (0.27, 60, 0.7)):
        t = tt(0.28)
        x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t)) * np.exp(-t / 0.075)
        x *= np.minimum(t / 0.006, 1)
        i = int(off * SR)
        out[i:i + len(x)] += x * a
    return lp(np.tanh(1.8 * out), 260) * v


def tick(v, hi=True):
    t = tt(0.05)
    f = 2900 if hi else 2200
    x = hp(noise(len(t)), 3000) * np.exp(-t / 0.0025) * 0.7 + np.sin(2 * np.pi * f * t) * np.exp(-t / 0.007)
    return x * v


def ping(v):
    t = tt(3.0)
    f = 1318.5 * (1 - 0.01 * (1 - np.exp(-t / 0.4)))
    x = (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.2 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)) * np.exp(-t / 1.1)
    return x * np.minimum(t / 0.004, 1) * v


def ripple_snd(v):
    t = tt(0.12)
    x = np.sin(2 * np.pi * 3100 * t) * (0.5 + 0.5 * np.sin(2 * np.pi * 140 * t)) * np.exp(-((t - 0.04) / 0.03) ** 2)
    return x * v


def rewind(d):
    t = tt(d)
    n = len(t)
    k = t / d
    trem = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * np.cumsum(14 + 40 * k) / SR))
    nz = sweep_filter(noise(n), 5000, 700, "bandpass", 2.0) * trem
    f = 700 * 2 ** (-3.2 * k)
    tone = lp(saw(f, n), 3000) * 0.3 * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    return stereo((nz * 0.8 + tone) * (0.4 + 0.6 * k), 0.0)


# ---------------------------------------------------------------- 有音高的声部
def string_note(f, d, v):
    n = int((d + 0.12) * SR)
    x = sum(saw(f * 2 ** (c / 1200), n, RNG.uniform()) for c in (-7, 0, 7)) / 3
    x = x + 0.15 * hp(noise(n), 2000)
    x = lp(x, 5200)
    e = adsr(n, 0.003, 0.07, 0.25, 0.05, hold=d)
    return x * e * v


def bass_note(f, d, v, bright=900):
    n = int((d + 0.08) * SR)
    x = saw(f, n) * 0.8 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.45
    x = hp(lp(x, bright), 36)
    return np.tanh(1.6 * x * adsr(n, 0.004, 0.18, 0.7, 0.06, hold=d)) * v


def pad_chord(name, d, v, octave=3, formant=True):
    n = int((d + 0.9) * SR)
    out = np.zeros((2, n))
    fs = chord_hz(name, octave) + [f * 2 for f in chord_hz(name, octave)]
    for f in fs:
        out += supersaw(f, n, 5, 0.22)
    out /= len(fs) ** 0.5
    env = adsr(n, 0.35, 0.6, 0.85, 0.8, hold=d)
    y = np.stack([lp(out[c], 2200) for c in range(2)])
    if formant:
        y = y * 0.55 + np.stack([bp(out[c], 650, 900) + 0.7 * bp(out[c], 1050, 1300) for c in range(2)]) * 1.4
    return y * env * v


def brass_note(f, d, v, dark=False):
    n = int((d + 0.22) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    x = np.zeros((2, n))
    for c, pan in ((-5, -0.5), (0, 0.0), (5, 0.5)):
        s = saw(f * vib * 2 ** (c / 1200), n, RNG.uniform())
        x += stereo(s, pan)
    x += stereo(square(f * vib / 2, n) * 0.35)
    e_f = np.exp(-t / 0.25)
    lo, hi = (500, 1800) if dark else (1200, 4200)
    y = np.stack([lp(x[ch], lo) * (1 - e_f) * 0.9 + lp(x[ch], hi) * e_f + lp(x[ch], (lo + hi) / 2) * 0.35
                  for ch in range(2)])
    return np.tanh(1.3 * y * adsr(n, 0.035, 0.3, 0.8, 0.18, hold=d)) * v


def stab(name, v):
    d = 0.16
    n = int(0.3 * SR)
    x = np.zeros((2, n))
    for f in chord_hz(name, 3) + [chord_hz(name, 4)[0]]:
        x += supersaw(f, n, 3, 0.1)
    y = np.stack([lp(x[c], 3500) for c in range(2)])
    return np.tanh(1.6 * y * adsr(n, 0.002, 0.08, 0.3, 0.06, hold=d)) * v * 0.6


def pluck(f, v):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    x = saw(f, n) * 0.6 + square(f, n) * 0.4
    e = np.exp(-t / 0.08)
    y = lp(x, 900) * (1 - e) + lp(x, 5200) * e
    return y * np.exp(-t / 0.16) * v


def piano(f, v, d=2.2):
    n = int(d * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > SR * 0.45:
            break
        x += np.sin(2 * np.pi * fk * t) / k ** 1.3 * np.exp(-t / (1.8 / k ** 0.6))
    x += hp(noise(n), 3000) * np.exp(-t / 0.004) * 0.1
    return x * np.minimum(t / 0.003, 1) * v


# ---------------------------------------------------------------- 混音工具
def reverb_ir(rt=2.6, seed=9):
    r = np.random.default_rng(seed)
    n = int(rt * SR)
    t = np.arange(n) / SR
    env = np.exp(-6.9 * t / rt)
    ir = np.stack([r.standard_normal(n), r.standard_normal(n)]) * env
    ir = np.stack([lp(ir[c], 7000) for c in range(2)])
    ir[:, :int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum() / 2)


def reverb(x, rt=2.6, seed=9):
    ir = reverb_ir(rt, seed)
    out = np.stack([signal.oaconvolve(x[0], ir[0])[:N], signal.oaconvolve(x[1], ir[1])[:N]])
    return out * 0.35


def duck_env(depth=0.55, tau=0.13):  # 侧链：底鼓一响，铺底让路
    g = np.ones(N)
    for tk, v in E.kick:
        i = int(tk * SR)
        m = int(0.6 * SR)
        j = min(i + m, N)
        a = np.arange(j - i) / SR
        g[i:j] = np.minimum(g[i:j], 1 - depth * v * np.exp(-a / tau))
    return g


def gate_env():
    """重击前 1/4 拍的全静音（带 4 ms 斜坡）。"""
    g = np.ones(N)
    rmp = int(0.004 * SR)
    for g0, g1 in E.gaps:
        i, j = int(g0 * SR), int(g1 * SR)
        g[i:j] = 0
        g[i - rmp:i] = np.minimum(g[i - rmp:i], np.linspace(1, 0, rmp))
    return g


def muffle(x):
    """走神：主音乐被低通"闷住"，觉察时瞬间打开。"""
    t0, tc, t1 = E.muffle
    i0, i1 = int(t0 * SR), int(t1 * SR)
    seg = x[:, i0:i1].copy()
    nb = (i1 - i0) // 256
    out = np.zeros_like(seg)
    for c in range(2):
        zi = np.zeros(2)
        for b in range(nb + 1):
            tb = t0 + b * 256 / SR
            k = min(max((tb - t0) / (tc - t0), 0), 1)
            fc = 16000 * (500 / 16000) ** (k ** 0.7)
            w = 2 * np.pi * fc / SR
            al = np.sin(w) / (2 * 0.9)
            cw = np.cos(w)
            bb = np.array([(1 - cw) / 2, 1 - cw, (1 - cw) / 2])
            aa = np.array([1 + al, -2 * cw, 1 - al])
            s = seg[c, b * 256:(b + 1) * 256]
            if len(s) == 0:
                break
            o, zi = signal.lfilter(bb / aa[0], aa / aa[0], s, zi=zi)
            out[c, b * 256:b * 256 + len(o)] = o
    x[:, i0:i1] = out
    return x


def tapestop(x):
    t0, t1 = E.tapestop
    i0, i1 = int(t0 * SR), int(t1 * SR)
    n = i1 - i0
    tau = np.arange(n) / SR
    d = t1 - t0
    speed = (1 - tau / d) ** 1.6
    pos = i0 + np.cumsum(speed)
    for c in range(2):
        x[c, i0:i1] = np.interp(pos, np.arange(len(x[c])), x[c]) * (1 - (tau / d) ** 4)
    x[:, i1:i1 + int(0.02 * SR)] *= np.linspace(0, 1, int(0.02 * SR))
    return x


def limiter(x, ceiling=0.76, look=0.004, release=0.08):
    peak = maximum_filter1d(np.abs(x).max(0), int(look * SR) * 2 + 1)
    g = np.minimum(1.0, ceiling / np.maximum(peak, 1e-9))
    a = np.exp(-1 / (release * SR))
    g = signal.lfilter([1 - a], [1, -a], g[::-1])[::-1]
    g = np.minimum(g, np.minimum(1.0, ceiling / np.maximum(peak, 1e-9)))
    y = x * g
    k = 0.7 * ceiling                             # 软拐点：拐点以下保持线性
    ay = np.abs(y)
    soft = k + (ceiling - k) * np.tanh((ay - k) / (ceiling - k))
    return np.where(ay < k, y, np.sign(y) * soft)


# ---------------------------------------------------------------- 编曲
def bars_where(fn):
    return [b for b in range(TL.TOTAL_BARS) if fn(b)]


def compose():
    drums, perc, fx = Bus("drums"), Bus("perc"), Bus("fx")
    bass, strings, pad, lead, arp, keys = Bus("bass"), Bus("strings"), Bus("pad"), Bus("lead"), Bus("arp"), Bus("keys")

    for t, v in E.kick:
        drums.add(t, kick(v), 0.8)
    for t, v in E.snare:
        drums.add(t, snare(v), 0.8, pan=0.05)
    for t, v in E.hat:
        drums.add(t, hat(v), 0.3, pan=0.25)
    for t, v in E.ohat:
        drums.add(t, hat(v, True), 0.22, pan=-0.2)
    for i, (t, v) in enumerate(E.tom):
        perc.add(t, tom(v, 110 - (i % 4) * 14), 0.6, pan=0.4 - (i % 4) * 0.25)
    for i, (t, v) in enumerate(E.taiko):
        perc.add(t, taiko(v), 0.7, pan=(-0.25, 0.25)[i % 2])
    for t, v in E.crash:
        perc.add(t, crash(v), 0.42)
    for t, size in E.hit:
        perc.add(t, impact(size), 1.0)
        perc.add(t, crash(1.0, 3.0), 0.45)
    for r0, r1 in E.riser:
        fx.add(r0, riser(r1 - r0), 0.42)
    for r0, r1 in E.revcym:
        fx.add(r0, revcym(r1 - r0), 0.5)
    for t, d in E.whoosh:
        fx.add(t - 0.35, whoosh(d), 0.45)
    for r0, r1 in E.rewind:
        fx.add(r0, rewind(r1 - r0), 0.45)
    for i, (t, v) in enumerate(E.heart):
        fx.add(t, heartbeat(v), 0.75)
    for i, (t, v) in enumerate(E.tick):
        fx.add(t, tick(v, i % 2 == 0), 0.22, pan=0.3)
    for t, v in E.ping:
        fx.add(t, ping(v), 0.28)
    for t, v in E.ripple:
        fx.add(t, ripple_snd(v), 0.10, pan=RNG.uniform(-0.5, 0.5))

    # 低音
    for b in range(TL.TOTAL_BARS):
        root = TONES[chord(b)][0]
        f1 = pc_hz(root, 1)
        while f1 < 41:
            f1 *= 2
        while f1 >= 82:
            f1 /= 2
        t0 = T(b)
        if 0 <= b < 6:
            bass.add(t0, bass_note(pc_hz("D", 1), BAR, 0.35 * (b + 1) / 6, 220))
        elif 8 <= b < 12:
            bass.add(t0, bass_note(f1, BAR * 0.98, 0.5, 300))
        elif b in range(12, 14) or 14 <= b < 33 or 34 <= b < 53 or 62 <= b < 70 or 72 <= b < 76 or 79 <= b < 84:
            for i in range(8):
                acc = 1.0 if i % 2 == 0 else 0.8
                f = f1 * (2 if (34 <= b < 53 and i % 2 == 1) else 1)
                bass.add(t0 + i * BEAT / 2, bass_note(f, BEAT / 2 * 0.8, 0.55 * acc, 800))
        elif 58 <= b < 62 or 70 <= b < 72:
            bass.add(t0, bass_note(f1, BAR * 0.95, 0.5, 400))
        elif 76 <= b < 79:
            bass.add(t0, bass_note(f1, BAR * 0.95, 0.6, 500))
        elif 84 <= b < 86:
            if b == 84:
                bass.add(t0, bass_note(pc_hz("D", 1), BAR * 2, 0.6, 400))
        elif 86 <= b < 91:
            bass.add(t0, bass_note(f1, BAR, 0.3, 250))

    # 弦乐顿弓十六分音符
    pat = [2, 2, 0, 2, 2, 2, 0, 2, 3, 3, 1, 3, 2, 2, 1, 2]
    for b in bars_where(lambda b: 10 <= b < 33 or 34 <= b < 53 or 62 <= b < 70 or 72 <= b < 76 or 79 <= b < 84):
        c = chord(b)
        r3, t3, f3 = chord_hz(c, 3)
        notes = [r3, f3, r3 * 2, t3 * 2, f3 * 2]
        cres = (b - 9) / 5 if b < 14 else 1.0
        for i, p in enumerate(pat):
            v = (1.0 if i % 4 == 0 else 0.62) * cres
            strings.add(T(b, i * 0.25), string_note(notes[p], BEAT / 4 * 0.7, v), 0.44,
                        pan=-0.35 if i % 2 == 0 else 0.35)
            if i % 4 == 0:
                strings.add(T(b, i * 0.25), string_note(notes[0] / 2, BEAT * 0.5, v), 0.26)

    # 合唱 / 铺底
    for b in range(8, TL.TOTAL_BARS):
        if 54 <= b < 58:
            lvl, fm = 0.10, False
        elif b < 14:
            lvl, fm = 0.06 + 0.03 * (b - 8), True
        elif b < 22 or 34 <= b < 38 or 58 <= b < 62:
            lvl, fm = 0.12, True
        elif b == 33 or 53 <= b < 54:
            continue
        elif b >= 86:
            lvl, fm = 0.10, True
        else:
            lvl, fm = 0.17, True
        if 70 <= b < 72:
            lvl = 0.13
        pad.add(T(b), pad_chord(chord(b), BAR, lvl * 1.5, 3, fm))
    pad.add(T(84), pad_chord("D", BAR * 2, 0.2, 3, True))

    # 主旋律（铜管）与圆号
    for b, (kind, notes) in MELODY.items():
        for beat, nm, length in notes:
            f = hz(midi(nm))
            d = length * BEAT * 0.95
            if kind == "lead":
                lead.add(T(b, beat), brass_note(f, d, 0.44))
                lead.add(T(b, beat), brass_note(f / 2, d, 0.2, dark=True))
            else:
                lead.add(T(b, beat), brass_note(f / 2, d, 0.36, dark=True))

    # 当下段的铜管顿音
    for t, v in E.stab:
        b = int(t / BAR)
        lead.add(t, stab(chord(b), v), 0.55)

    # 未来段的琶音 + 乒乓延迟
    for t, i in E.arp:
        b = int(t / BAR)
        tones = chord_hz(chord(b), 5) + [f * 2 for f in chord_hz(chord(b), 5)]
        idx = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1][i]
        f = tones[idx] / 2
        k = 0.8 if b < 50 else 0.8 + 0.1 * (b - 50)
        p = pluck(f, 0.26 * k)
        arp.add(t, p, pan=-0.3)
        arp.add(t + BEAT * 0.75, p * 0.45, pan=0.7)
        arp.add(t + BEAT * 1.5, p * 0.2, pan=-0.7)

    # 钢琴：当下段的静止时刻、片尾
    calm = {54: ["D5", "A4"], 55: ["F5", "A4"], 56: ["E5", "A4"], 57: ["D5", "F4"]}
    for b, (n1, n2) in calm.items():
        keys.add(T(b, 0), piano(hz(midi(n1)), 0.32))
        keys.add(T(b, 1.5), piano(hz(midi(n2)), 0.2))
        keys.add(T(b, 2), piano(hz(midi(n1)) / 2, 0.16))
    for b in range(86, 91):
        fs = chord_hz(chord(b), 4)
        seq = [fs[0], fs[1], fs[2], fs[0] * 2, fs[2], fs[1]]
        for i, f in enumerate(seq):
            keys.add(T(b, i * 0.66), piano(f, 0.2 * (1 - (b - 86) / 7)))
    keys.add(T(91), piano(pc_hz("D", 4), 0.18, 4.0))

    return dict(drums=drums, perc=perc, fx=fx, bass=bass, strings=strings, pad=pad, lead=lead, arp=arp, keys=keys)


def mixdown(buses, part, duck, gate):
    x = {k: getattr(b, part) for k, b in buses.items()}
    music = (x["bass"] + x["strings"] + x["pad"] + x["arp"]) * duck + x["lead"]
    drums = x["drums"] + x["perc"]
    wet = reverb(x["drums"] * 0.12 + x["perc"] * 0.45 + (x["strings"] * 0.25 + x["pad"] * 0.45) * duck
                 + x["lead"] * 0.35 + x["arp"] * 0.35 + x["fx"] * 0.35 + x["keys"] * 0.5, 2.8)
    mix = music + drums + wet + x["keys"]
    if part == "post":
        mix = muffle(mix)
    mix += x["fx"]                                # 心跳、滴答不受"走神"低通影响
    return mix * gate


def master(buses):
    duck, gate = duck_env(), gate_env()
    pre = tapestop(mixdown(buses, "pre", duck, gate))
    pre[:, int(SPLIT * SR):] = 0
    mix = pre + mixdown(buses, "post", duck, gate)
    mix = np.stack([hp(mix[c], 30, 2) for c in range(2)]) * dynamics()
    mix /= np.abs(mix).max() + 1e-9
    mix *= DRIVE                                  # 推进限幅器，换取响度
    mix = limiter(mix, 0.76)
    fade = np.ones(N)
    end = int(TL.DURATION * SR)
    fl = int(2.5 * SR)
    fade[end - fl:end] = np.linspace(1, 0, fl) ** 2
    fade[end:] = 0
    return (mix * fade).astype(np.float32)


DRIVE = 1.6


def dynamics():
    """指挥式力度曲线（限幅前）：让开场、静止段真正安静，让 drop 真正炸开。"""
    keys = [(0, 0.55), (6, 0.55), (6.01, 0.95), (7, 0.6), (8, 0.55), (12, 0.62), (13.9, 0.85),
            (14, 1.0), (33, 1.0), (34, 1.0), (53.75, 1.0), (54, 0.42), (58, 0.42), (58.01, 0.6), (61.9, 0.85),
            (62, 1.05), (70, 1.05), (70.01, 0.72), (72, 0.72), (72.01, 1.05), (76, 1.08), (84, 1.1), (86, 0.75),
            (92, 0.6)]
    tb = np.arange(N) / SR / BAR
    return np.interp(tb, [k[0] for k in keys], [k[1] for k in keys])


def render(path):
    from scipy.io import wavfile
    buses = compose()
    out = master(buses)
    wavfile.write(path, SR, out.T)
    return out


if __name__ == "__main__":
    import sys
    import time
    t = time.time()
    render(sys.argv[1] if len(sys.argv) > 1 else "score.wav")
    print(f"done in {time.time() - t:.1f}s")
