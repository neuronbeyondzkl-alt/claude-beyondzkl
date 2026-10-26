"""Procedural "epic / hype" score for the REWIRE video.

D minor, 128 BPM. Every drum hit and sound effect comes from timeline.EVENTS,
the same list the renderer uses, so audio and picture stay locked together.

    python3 music.py            -> out/music.wav
"""
import os
import numpy as np
from scipy import signal

from timeline import (BAR, SPB, SR, DURATION, STOPS, EVENTS, tb, breath_curve)

rng = np.random.default_rng(20240613)
N = int(np.ceil(DURATION * SR))
TT = np.arange(N) / SR


def T(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def noise(n, ch=1):
    return rng.standard_normal((ch, n) if ch > 1 else n)


def flt(x, kind, fc, order=2):
    sos = signal.butter(order, fc, kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def tv_filter(x, fc_of_t, kind="low", order=2, bw=0.8):
    """Time-varying filter in the STFT domain. fc_of_t(times)->cutoff (Hz)."""
    nper, hop = 1024, 256
    f, tt, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nper - hop, axis=-1)
    fc = np.maximum(np.asarray(fc_of_t(tt), dtype=float), 20.0)
    F = np.maximum(f[:, None], 1.0)
    C = fc[None, :]
    if kind == "low":
        M = 1.0 / np.sqrt(1.0 + (F / C) ** (2 * order))
    elif kind == "high":
        M = 1.0 / np.sqrt(1.0 + (C / F) ** (2 * order))
    else:
        M = np.exp(-0.5 * (np.log2(F / C) / bw) ** 2)
    _, y = signal.istft(Z * M, fs=SR, nperseg=nper, noverlap=nper - hop, input_onesided=True)
    n = x.shape[-1]
    if y.shape[-1] < n:
        pad = [(0, 0)] * (y.ndim - 1) + [(0, n - y.shape[-1])]
        y = np.pad(y, pad)
    return y[..., :n]


def saw(freq, n, phase0=0.0):
    """PolyBLEP band-limited sawtooth. freq: scalar or per-sample array."""
    dt = np.broadcast_to(np.asarray(freq, dtype=float) / SR, (n,))
    ph = (phase0 + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def sine_sweep(freq):
    return np.sin(2 * np.pi * np.cumsum(freq) / SR)


def ar_env(n, a, r):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4))
    e *= np.clip((n / SR - t) / max(r, 1e-4), 0.0, 1.0)
    return e


def pan2(x, p):
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)]) * np.sqrt(2)


class Stem:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, t0, sig, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            sig = pan2(sig, pan)
        i0 = int(round(t0 * SR))
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], N - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += gain * sig[:, :n]


# ---------------------------------------------------------------- drums ----
def kick(vel):
    t = T(0.55)
    f = 46 + 130 * np.exp(-t * 32) + 30 * np.exp(-t * 7)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6.0)
    click = flt(noise(len(t)) * np.exp(-t * 260), "high", 1800) * 0.35
    return (np.tanh(2.4 * body) * 0.95 + click) * vel


def heart(vel):
    t = T(0.9)
    out = np.zeros(len(t))
    for off, g, f0 in ((0.0, 1.0, 42), (0.24, 0.7, 48)):
        tt = np.clip(t - off, 0, None)
        f = f0 + 55 * np.exp(-tt * 24)
        out += g * (t >= off) * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
    return flt(np.tanh(1.8 * out), "low", 260) * vel


def snare(vel, roll=False):
    t = T(0.3 if roll else 0.6)
    tone = (np.sin(2 * np.pi * 186 * t) * 0.6 + np.sin(2 * np.pi * 332 * t) * 0.3) * np.exp(-t * 26)
    nz = flt(noise(len(t)), "bandpass", [1100, 9500]) * np.exp(-t * (24 if roll else 13))
    return np.tanh(1.6 * (tone + nz * 1.2)) * vel


def clap(vel):
    t = T(0.5)
    env = np.zeros(len(t))
    for off in (0.0, 0.011, 0.023):
        tt = t - off
        env += (tt >= 0) * np.exp(-np.clip(tt, 0, None) * 120)
    env += (t >= 0.03) * np.exp(-np.clip(t - 0.03, 0, None) * 11) * 0.8
    return flt(noise(len(t)), "bandpass", [900, 5200]) * env * vel * 1.4


def hat(vel, open_=False):
    t = T(0.4 if open_ else 0.07)
    s = flt(noise(len(t)), "high", 7200) * np.exp(-t * (8.5 if open_ else 60))
    return s * vel


def tom(vel):
    t = T(1.6)
    f = 78 * (1 + 0.7 * np.exp(-t * 18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.6)
    skin = flt(noise(len(t)), "low", 900) * np.exp(-t * 28) * 0.6
    return np.tanh(1.8 * (body + skin)) * vel


def crash(length=3.6):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for c in range(2):
        nz = flt(noise(n), "high", 3200) * np.exp(-t * 1.7)
        metal = sum(np.sin(2 * np.pi * f * t + rng.random() * 6.28) for f in rng.uniform(3000, 9000, 14))
        out[c] = nz + 0.05 * metal * np.exp(-t * 2.5)
    return out * 0.6


# ------------------------------------------------------------------ fx -----
def impact(vel):
    t = T(5.0)
    n = len(t)
    f = 28 + 75 * np.exp(-t * 5)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 0.95)
    out = np.zeros((2, n))
    for c in range(2):
        body = flt(noise(n), "low", 2400) * np.exp(-t * 5.5) * 0.7
        crack = flt(noise(n), "high", 1800) * np.exp(-t * 26) * 0.6
        out[c] = np.tanh(2.2 * (boom * 1.1 + body + crack))
    return out * vel


def braam(vel, root=38):
    t = T(4.2)
    n = len(t)
    out = np.zeros((2, n))
    for m in (root - 12, root, root + 7, root + 12):
        for d in (-0.12, 0.0, 0.12):
            p = rng.uniform(-0.6, 0.6)
            out += pan2(saw(mtof(m + d), n, rng.random()), p) * (0.6 if m < root else 1.0)
    cut = lambda tt: 160 + 2600 * np.clip(tt / 0.22, 0, 1) * np.exp(-np.clip(tt - 0.22, 0, None) * 1.3)
    out = tv_filter(out, cut, "low", order=3)
    env = np.minimum(1, t / 0.025) * np.exp(-t * 0.85)
    return np.tanh(2.5 * out / 6) * env * vel


def riser(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    u = t / length
    out = np.zeros((2, n))
    for c in range(2):
        out[c] = noise(n)
    out = tv_filter(out, lambda tt: 350 * (26 ** np.clip(tt / length, 0, 1)), "band", bw=0.9)
    tone = saw(220 * 2 ** (2.2 * u ** 1.6), n) * 0.25
    tone = flt(tone, "low", 3500)
    out += pan2(tone, 0)
    return out * (u ** 2.2) * 1.1


def revcym(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    out = np.zeros((2, n))
    for c in range(2):
        out[c] = flt(noise(n), "high", 2500) * np.exp(-t * 4.5 / length)
    return out[:, ::-1] * 0.9


def whoosh(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    u = t / length
    x = noise(n)
    x = tv_filter(x, lambda tt: 300 * (18 ** np.sin(np.pi * np.clip(tt / length, 0, 1) * 0.85)), "band", bw=1.0)
    env = np.sin(np.pi * u) ** 1.6
    return np.stack([x * env * (1 - u), x * env * u]) * 1.6


def downlifter():
    t = T(3.2)
    f = 50 + 900 * np.exp(-t * 2.0)
    tone = sine_sweep(f) * np.exp(-t * 0.9) * 0.7
    nz = tv_filter(noise(len(t)), lambda tt: 200 + 6000 * np.exp(-tt * 1.6), "low", order=2) * np.exp(-t * 1.0)
    return pan2(tone + nz * 0.5, 0)


def ping(vel, f0=1174.66):
    t = T(2.6)
    idx = 3.0 * np.exp(-t * 5)
    s = np.sin(2 * np.pi * f0 * t + idx * np.sin(2 * np.pi * f0 * 1.4 * t)) * np.exp(-t * 2.6)
    s += 0.35 * np.sin(2 * np.pi * f0 * 1.5 * t) * np.exp(-t * 3.5)
    s += 0.15 * np.sin(2 * np.pi * f0 * 2.76 * t) * np.exp(-t * 9)
    return s * vel


def hit(vel):
    t = T(1.4)
    n = len(t)
    f = 55 + 160 * np.exp(-t * 22)
    thump = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)
    clang = np.sin(2 * np.pi * 293.66 * t + 2.5 * np.exp(-t * 6) * np.sin(2 * np.pi * 293.66 * 1.41 * t)) * np.exp(-t * 4)
    out = np.zeros((2, n))
    for c in range(2):
        shh = flt(noise(n), "bandpass", [2000, 9000]) * np.exp(-t * 14)
        out[c] = np.tanh(1.8 * thump) * 0.8 + 0.5 * shh + 0.28 * clang
    return out * vel


def tick(vel):
    t = T(0.05)
    return (np.sin(2 * np.pi * 2900 * t) * np.exp(-t * 260) + flt(noise(len(t)), "high", 5000) * np.exp(-t * 400) * 0.4) * vel


def breath(kind, length):
    n = int(length * SR)
    t = np.arange(n) / SR
    u = t / length
    x = noise(n)
    if kind in ("inhale", "inhale2"):
        x = tv_filter(x, lambda tt: 700 * (3.2 ** np.clip(tt / length, 0, 1)), "band", bw=1.1)
        env = np.sin(np.pi * 0.5 * u) ** 1.2 * np.clip((1 - u) / 0.08, 0, 1)
    else:
        x = tv_filter(x, lambda tt: 1900 * (0.28 ** np.clip(tt / length, 0, 1)), "band", bw=1.2)
        env = np.clip(u / 0.06, 0, 1) * (1 - u) ** 1.4
    return np.stack([x, np.roll(x, 211)]) * env * 0.9


# ------------------------------------------------------------- harmony -----
VOICING = {
    "Dm": [57, 62, 65, 69], "Bb": [58, 62, 65, 70], "F": [57, 60, 65, 69],
    "C": [55, 60, 64, 67], "Gm": [55, 58, 62, 67], "A": [57, 61, 64, 69],
}
BASS = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "Gm": 43, "A": 45}
MAIN = ["Dm", "Bb", "F", "C"]
DARK = ["Dm", "Bb", "Gm", "A"]

PROG = {}
for b in range(0, 4):
    PROG[b] = "Dm"
for b in (4, 5):
    PROG[b] = "Bb"
for b in (6, 7):
    PROG[b] = "C"
for start, seq, reps in ((8, MAIN, 1), (12, MAIN, 2), (20, DARK, 2), (28, MAIN, 2), (44, MAIN, 2)):
    for i in range(4 * reps):
        PROG[start + i] = seq[i % 4]
for b, c in zip(range(36, 40), ["Bb", "F", "C", "C"]):
    PROG[b] = c
for b, c in zip(range(40, 44), ["Bb", "C", "Dm", "C"]):
    PROG[b] = c
PROG[52] = "Dm"


def supersaw(freq, n, voices=7, detune=0.22, spread=0.85):
    out = np.zeros((2, n))
    for i in range(voices):
        d = (i - (voices - 1) / 2) / ((voices - 1) / 2)
        out += pan2(saw(freq * 2 ** (d * detune / 12), n, rng.random()), d * spread)
    return out / voices


def pluck(freq, dur, bright=1.0):
    t = T(dur)
    s = np.zeros(len(t))
    for k in range(1, 13):
        if freq * k > 12000:
            break
        s += np.sin(2 * np.pi * freq * k * t + rng.random()) / k * np.exp(-t * (4 + k * 2.2 / bright))
    return s * np.minimum(1, t / 0.003)


def keypoints(points):
    """Exponential interpolation through (time, Hz) keypoints."""
    ts = np.array([p[0] for p in points])
    ls = np.log(np.array([p[1] for p in points]))
    return lambda tt: np.exp(np.interp(tt, ts, ls))


def sidechain(depth=0.6, rel=0.16):
    src = sorted([e["t"] for e in EVENTS if e["kind"] in ("kick", "impact")])
    src = np.array(src)
    idx = np.searchsorted(src, TT, side="right") - 1
    dt = np.where(idx >= 0, TT - src[np.clip(idx, 0, None)], 10.0)
    return 1.0 - depth * np.exp(-dt / rel) * np.minimum(1, dt / 0.004)


def stop_mask():
    g = np.ones(N)
    for a, b in STOPS:
        i0, i1 = int(a * SR), int(b * SR)
        g[i0:i1] = 0.0
        f = int(0.006 * SR)
        g[max(0, i0 - f):i0] *= np.linspace(1, 0, min(f, i0))
    return g


def rms_active(x):
    m = x.mean(axis=0) if x.ndim == 2 else x
    hop = int(0.05 * SR)
    fr = m[: len(m) // hop * hop].reshape(-1, hop)
    r = np.sqrt((fr ** 2).mean(axis=1))
    act = r[r > r.max() * 0.03]
    return np.sqrt((act ** 2).mean()) if len(act) else 1.0


def norm_rms(x, target):
    return x * (target / max(rms_active(x), 1e-9))


def make_ir(rt60=2.8, lo=0.018):
    n = int(rt60 * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal((2, n)) * np.exp(-6.9 * t / rt60)
    ir = tv_filter(ir, lambda tt: 9000 * np.exp(-tt * 1.4) + 900, "low", order=1)
    ir[:, : int(lo * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True)) * 0.5


def delay(x, time, fb=0.38, taps=5):
    out = np.zeros_like(x)
    d = int(time * SR)
    for k in range(1, taps + 1):
        ch_from, ch_to = (0, 1) if k % 2 else (1, 0)
        out[ch_to, d * k:] += (fb ** k) * x[ch_from, : N - d * k]
    return out


def build():
    kicks, snares, hats, toms, bass, chords, pads, arps, leads, fx, light = (Stem() for _ in range(11))
    rev_send = Stem()

    # ---- events -----------------------------------------------------------
    for e in EVENTS:
        k, t0, v = e["kind"], e["t"], e.get("vel", 1.0)
        if k == "kick":
            kicks.add(t0, kick(v))
        elif k == "heart":
            kicks.add(t0, heart(v), 1.1)
        elif k == "snare":
            s = snare(v, e.get("roll", False))
            snares.add(t0, s, 1.0)
            rev_send.add(t0, s, 0.35)
        elif k == "clap":
            s = clap(v)
            snares.add(t0, s, 0.8)
            rev_send.add(t0, s, 0.3)
        elif k in ("hat", "ohat"):
            hats.add(t0, hat(v, k == "ohat"), pan=rng.uniform(-0.3, 0.3))
        elif k == "tom":
            s = tom(v)
            toms.add(t0, s, pan=rng.uniform(-0.25, 0.25))
            rev_send.add(t0, s, 0.4)
        elif k == "tick":
            light.add(t0, tick(v), 0.5, pan=0.3)
        elif k == "impact":
            s = impact(v)
            fx.add(t0, s, 1.0)
            rev_send.add(t0, s, 0.45)
        elif k == "braam":
            s = braam(v, e.get("root", 38))
            fx.add(t0, s, 0.8)
            rev_send.add(t0, s, 0.4)
        elif k == "crash":
            s = crash()
            fx.add(t0, s, 0.33 * v)
            rev_send.add(t0, s, 0.12 * v)
        elif k == "riser":
            s = riser(e["length"])
            fx.add(t0, s, 0.42)
            rev_send.add(t0, s, 0.2)
        elif k == "revcym":
            fx.add(t0, revcym(e["length"]), 0.38)
        elif k == "whoosh":
            s = whoosh(e["length"])
            fx.add(t0, s, 0.32)
            rev_send.add(t0, s, 0.3)
        elif k == "downlifter":
            s = downlifter()
            fx.add(t0, s, 0.5 * v)
            rev_send.add(t0, s, 0.4)
        elif k == "ping":
            s = ping(v)
            light.add(t0, s, 0.35, pan=rng.uniform(-0.2, 0.2))
            rev_send.add(t0, s, 0.5)
        elif k == "hit":
            s = hit(v)
            fx.add(t0, s, 0.45)
            rev_send.add(t0, s, 0.25)
        elif k in ("inhale", "inhale2", "exhale"):
            s = breath(k, e["length"])
            light.add(t0, s, 0.32 if k != "exhale" else 0.28)
            rev_send.add(t0, s, 0.25)

    # ---- pads (intro, breakdown, tail) ------------------------------------
    pad_bars = list(range(0, 8)) + list(range(36, 44))
    for b in pad_bars:
        c = PROG[b]
        n = int(BAR * SR) + int(0.6 * SR)
        x = sum(supersaw(mtof(m), n, voices=5, detune=0.16) for m in VOICING[c] + [BASS[c] + 12])
        x *= ar_env(n, 0.35, 0.6)
        pads.add(tb(b), x, 0.4 if b < 8 else 0.55)
    n = int(3.6 * SR)
    x = sum(supersaw(mtof(m), n, voices=7) for m in VOICING["Dm"] + [50, 74])
    pads.add(tb(52), x * ar_env(n, 0.01, 3.2) * np.exp(-np.arange(n) / SR * 0.9), 0.75)

    pad_cut = keypoints([
        (0, 260), (tb(4), 500), (tb(7, 3), 2400), (tb(8), 2400), (tb(36), 900),
        (tb(40), 700), (tb(43, 3), 6000), (tb(52), 6000), (tb(52) + 3.5, 900),
    ])
    pads_f = tv_filter(pads.x, pad_cut, "low", order=2)
    # breathing: the pad opens on each inhale and closes on the exhale
    bc = np.array([breath_curve(t) for t in TT[::64]])
    bc = np.interp(TT, TT[::64], bc)
    in_breath = (TT >= tb(36)) & (TT < tb(40))
    pads_f[:, in_breath] *= (0.55 + 0.75 * bc[in_breath])

    # ---- supersaw chords ---------------------------------------------------
    chord_bars = list(range(8, 36)) + list(range(40, 52))
    for b in chord_bars:
        c = PROG[b]
        n = int(BAR * SR) + int(0.25 * SR)
        x = sum(supersaw(mtof(m), n) for m in VOICING[c])
        x += supersaw(mtof(VOICING[c][1] + 12), n) * 0.5
        chords.add(tb(b), x * ar_env(n, 0.01, 0.25))
    chord_cut = keypoints([
        (tb(8), 3800), (tb(12), 2600), (tb(20), 2600), (tb(20) + 0.01, 1100), (tb(26), 1100),
        (tb(26) + 0.01, 3500), (tb(28), 5200), (tb(36), 5200), (tb(40), 380), (tb(43, 3), 7000),
        (tb(44), 7500), (tb(53), 7500),
    ])
    chords_f = tv_filter(chords.x, chord_cut, "low", order=2)

    # ---- bass ----------------------------------------------------------------
    onsets = []
    for b in range(8, 52):
        c = PROG[b]
        f = mtof(BASS[c])
        if 8 <= b < 12:  # title: long notes
            n = int(BAR * SR)
            x = (saw(f, n, 0) * 0.6 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.8) * ar_env(n, 0.01, 0.2)
            bass.add(tb(b), x)
            onsets.append(tb(b))
        elif 36 <= b < 40:
            continue
        elif 40 <= b < 44:  # build: quarter notes
            for i in range(4):
                n = int(SPB * 0.9 * SR)
                x = (saw(f, n) * 0.6 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.8) * ar_env(n, 0.003, 0.03)
                bass.add(tb(b, i), x)
                onsets.append(tb(b, i))
        else:  # rolling 8ths (16ths with octave ghosts in the dark section)
            step = 0.5
            for i in range(int(4 / step)):
                n = int(SPB * step * 0.92 * SR)
                ff = f * (2 if (20 <= b < 26 and i % 4 == 3) else 1)
                x = (saw(ff, n) * 0.6 + np.sin(2 * np.pi * ff * np.arange(n) / SR) * 0.8) * ar_env(n, 0.003, 0.02)
                bass.add(tb(b, i * step), x)
                onsets.append(tb(b, i * step))
    on = np.array(sorted(onsets))

    def bass_cut(tt):
        idx = np.searchsorted(on, tt, side="right") - 1
        dt = np.where(idx >= 0, tt - on[np.clip(idx, 0, None)], 1.0)
        return 260 + 1500 * np.exp(-dt / 0.09)
    bass_f = np.tanh(1.6 * tv_filter(bass.x, bass_cut, "low", order=2))

    # ---- arp -----------------------------------------------------------------
    pattern = [0, 1, 2, 3, 2, 1, 3, 2]
    arp_bars = [(range(4, 8), 0.25, 0.6), (range(12, 20), 0.25, 1.0), (range(28, 36), 0.25, 1.0),
                (range(36, 40), 0.5, 0.7), (range(44, 52), 0.25, 1.0)]
    for bars, step, br in arp_bars:
        for b in bars:
            notes = [m + 12 for m in VOICING[PROG[b]]]
            for i in range(int(4 / step)):
                tt = tb(b, i * step)
                if any(a <= tt < z for a, z in STOPS):
                    continue
                m = notes[pattern[i % 8]]
                arps.add(tt, pluck(mtof(m), 0.45, br), 1.0, pan=0.35 * np.sin(i * 0.9))
    arp_cut = keypoints([(tb(4), 300), (tb(7, 3), 3200), (tb(12), 3600), (tb(36), 5000), (tb(36) + 0.01, 2200),
                         (tb(44), 6500), (tb(53), 6500)])
    arps_f = tv_filter(arps.x, arp_cut, "low", order=2)

    # ---- anthem lead (final) -------------------------------------------------
    melody = [  # (bar, beat, midi, beats)
        (44, 0, 74, 1.5), (44, 1.5, 69, 0.5), (44, 2, 74, 1), (44, 3, 76, 1),
        (45, 0, 77, 1.5), (45, 1.5, 76, 0.5), (45, 2, 74, 1), (45, 3, 72, 1),
        (46, 0, 72, 1.5), (46, 1.5, 69, 0.5), (46, 2, 72, 1), (46, 3, 77, 1),
        (47, 0, 76, 2), (47, 2, 79, 1), (47, 3, 76, 1),
        (48, 0, 77, 1.5), (48, 1.5, 76, 0.5), (48, 2, 74, 1), (48, 3, 81, 1),
        (49, 0, 77, 2), (49, 2, 74, 1), (49, 3, 77, 1),
        (50, 0, 81, 1.5), (50, 1.5, 79, 0.5), (50, 2, 77, 1), (50, 3, 72, 1),
        (51, 0, 76, 1), (51, 1, 77, 0.5), (51, 1.5, 79, 0.5), (51, 2, 81, 2),
        (52, 0, 86, 6),
    ]
    for bar, beat, m, beats in melody:
        dur = beats * SPB * (0.95 if beats < 6 else 1.0)
        n = int(dur * SR)
        t = np.arange(n) / SR
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.12) / 0.2, 0, 1)
        f = mtof(m) * vib
        x = supersaw(f, n, voices=5, detune=0.14, spread=0.5)
        x += pan2(saw(f / 2, n) * 0.5, 0)
        env = ar_env(n, 0.008, 0.06) if beats < 6 else ar_env(n, 0.008, 2.2) * np.exp(-t * 0.5)
        leads.add(tb(bar, beat), x * env)
    leads_f = flt(flt(leads.x, "low", 6500), "high", 180)

    # ---- mix -------------------------------------------------------------
    sc = sidechain()
    stop = stop_mask()
    stems = {
        "kick": norm_rms(kicks.x, 0.17),
        "snare": norm_rms(snares.x, 0.095),
        "hats": norm_rms(hats.x, 0.032),
        "toms": norm_rms(toms.x, 0.11),
        "bass": norm_rms(bass_f, 0.09) * sc * stop,
        "chords": norm_rms(chords_f, 0.075) * sc * stop,
        "pads": norm_rms(pads_f, 0.06) * stop,
        "arps": norm_rms(arps_f, 0.04) * sc * stop,
        "leads": norm_rms(leads_f, 0.085) * sc,
        "fx": fx.x / max(np.abs(fx.x).max(), 1e-9) * 0.75,
        "light": norm_rms(light.x, 0.05),
    }
    rev_send.x += stems["chords"] * 0.25 + stems["pads"] * 0.5 + stems["arps"] * 0.6 + stems["leads"] * 0.35
    ir = make_ir()
    wet = np.stack([signal.fftconvolve(rev_send.x[c], ir[c])[:N] for c in range(2)])
    dly = delay(stems["arps"] * 0.6 + stems["leads"] * 0.35 + stems["light"] * 0.5, SPB * 0.75)

    mix = sum(stems.values()) + (wet * 0.55 + dly * 0.5) * stop
    mix = flt(mix, "high", 28)
    mix = mix + 0.35 * flt(mix, "high", 3800)  # air / presence shelf
    drive = 1.25
    mix = np.tanh(mix * drive) / np.tanh(drive)
    # fade the tail
    fade_start = tb(52) + 2.2
    g = np.clip(1 - (TT - fade_start) / (DURATION - fade_start), 0, 1) ** 1.5
    mix *= g
    mix *= 0.96 / np.abs(mix).max()
    return mix, stems


def write_wav(path, x):
    from scipy.io import wavfile
    y = np.clip(x.T, -1, 1)
    wavfile.write(path, SR, (y * 32767).astype(np.int16))


if __name__ == "__main__":
    os.makedirs("out", exist_ok=True)
    mix, stems = build()
    write_wav("out/music.wav", mix)
    for name, s in stems.items():
        print(f"{name:7s} peak {np.abs(s).max():.3f}  rms {rms_active(s):.3f}")
    print("duration", DURATION, "samples", mix.shape)
