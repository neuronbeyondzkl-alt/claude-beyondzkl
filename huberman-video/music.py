"""Procedural epic-hybrid score (150 BPM, D minor), synthesized from scratch.

Every hit comes from timeline.py, so the picture and the music share one clock.
Usage:  python3 music.py build/music.wav
"""
import sys
import wave

import numpy as np
from scipy import ndimage, signal

import timeline as TL

SR = 44100
N = int(TL.DURATION * SR)
rng = np.random.default_rng(20261019)


# --------------------------------------------------------------------------
# DSP helpers
# --------------------------------------------------------------------------
def tarr(dur):
    return np.arange(int(dur * SR)) / SR


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def sos_filter(x, kind, fc, order=2):
    sos = signal.butter(order, fc, kind, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def lp(x, fc, order=2):
    return sos_filter(x, "low", fc, order)


def hp(x, fc, order=2):
    return sos_filter(x, "high", fc, order)


def bp(x, lo, hi, order=2):
    return sos_filter(x, "band", [lo, hi], order)


def tv_filter(x, mask_fn, nper=2048, hop=512):
    """Time-varying filter in the STFT domain; mask_fn(freqs[:,None], times[None,:])."""
    n = x.shape[-1]
    f, t, Z = signal.stft(x, fs=SR, nperseg=nper, noverlap=nper - hop)
    Z = Z * mask_fn(f[:, None], t[None, :])
    _, y = signal.istft(Z, fs=SR, nperseg=nper, noverlap=nper - hop)
    out = np.zeros(n)
    m = min(n, y.shape[-1])
    out[:m] = y[:m]
    return out


def lp_mask(fc_fn, order=2):
    def m(f, t):
        fc = fc_fn(t)
        return 1.0 / np.sqrt(1.0 + (f / fc) ** (2 * order))
    return m


def bp_mask(fc_fn, width_oct=0.9):
    def m(f, t):
        fc = fc_fn(t)
        return np.exp(-0.5 * (np.log2(np.maximum(f, 1.0) / fc) / width_oct) ** 2)
    return m


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def pink(dur):
    n = int(dur * SR)
    X = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    X /= np.sqrt(np.maximum(f, 20.0))
    y = np.fft.irfft(X, n)
    return y / (np.std(y) + 1e-9)


def saw_from_freq(freq_arr, phase0=0.0):
    ph = phase0 + np.cumsum(freq_arr) / SR
    return 2.0 * (ph % 1.0) - 1.0


def saw(f, dur, phase0=None):
    t = tarr(dur)
    p0 = rng.random() if phase0 is None else phase0
    return 2.0 * ((p0 + f * t) % 1.0) - 1.0


def supersaw(f, dur, voices=7, spread=0.22):
    out = np.zeros(int(dur * SR))
    for k in range(voices):
        d = (k / (voices - 1) - 0.5) * 2 * spread if voices > 1 else 0.0
        out += saw(f * 2 ** (d / 12), dur)
    return out / np.sqrt(voices)


def adsr(n, a=0.01, r=0.1, sustain_level=1.0):
    env = np.full(n, sustain_level)
    na, nr = int(a * SR), int(r * SR)
    if na > 0:
        env[:na] = np.linspace(0, sustain_level, na)
    if nr > 0 and nr < n:
        env[-nr:] *= np.linspace(1, 0, nr)
    return env


def pan_gains(p):
    a = (p + 1) * np.pi / 4
    return np.cos(a), np.sin(a)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain=1.0, pan=0.0):
        i0 = int(round(t * SR))
        if sig.ndim == 1:
            gl, gr = pan_gains(pan)
            sig = np.vstack([sig * gl, sig * gr]) * np.sqrt(2)
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        n = min(sig.shape[1], N - i0)
        if n > 0:
            self.x[:, i0:i0 + n] += gain * sig[:, :n]

    def peak(self):
        return np.max(np.abs(self.x)) + 1e-12

    def norm_peak(self, target):
        self.x *= target / self.peak()
        return self

    def norm_rms(self, target):
        a = np.abs(self.x).mean(axis=0)
        active = a > 1e-4 * a.max()
        r = np.sqrt(np.mean(self.x[:, active] ** 2)) + 1e-12
        self.x *= target / r
        return self


def stereo_delay(x, delay, fb=0.35, taps=4, mix=0.35):
    """Ping-pong style delay for a stereo signal (2, n)."""
    out = x.copy()
    d = int(delay * SR)
    for k in range(1, taps + 1):
        g = mix * fb ** (k - 1)
        src = x[(k % 2), :-d * k] if d * k < x.shape[1] else None
        if src is None:
            break
        ch = k % 2
        out[1 - ch, d * k:] += g * src
    return out


def make_ir(dur=3.2, rt=2.6, pre=0.02, bright=0.25):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = np.zeros((2, n))
    for c in range(2):
        tail = rng.standard_normal(n) * np.exp(-6.9 * t / rt)
        tail = tv_filter(tail, lp_mask(lambda tt: 9000 * np.exp(-tt / 0.9) + 900))
        er = np.zeros(n)
        for _ in range(14):
            i = int(rng.uniform(0.004, 0.07) * SR)
            er[i] += rng.uniform(-1, 1) * bright
        ir[c] = np.concatenate([np.zeros(int(pre * SR)), (tail + er)[: n - int(pre * SR)]])
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    y = np.zeros_like(x)
    for c in range(2):
        y[c] = signal.oaconvolve(x[c], ir[c])[: x.shape[1]]
    return y


# --------------------------------------------------------------------------
# Instruments
# --------------------------------------------------------------------------
def kick(vel=1.0):
    t = tarr(0.7)
    f = 46 + 140 * np.exp(-t / 0.022) + 38 * np.exp(-t / 0.11)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.36)
    click = hp(rng.standard_normal(len(t)) * np.exp(-t / 0.0035), 2500) * 0.45
    return np.tanh(1.9 * (body + click)) * vel


def heartbeat(vel=1.0):
    t = tarr(0.5)
    f = 42 + 30 * np.exp(-t / 0.04)
    lub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14)
    lub = lp(lub + 0.2 * lp(rng.standard_normal(len(t)), 300) * np.exp(-t / 0.03), 180)
    out = np.zeros(int(0.8 * SR))
    out[: len(lub)] += lub
    i = int(0.19 * SR)
    out[i:i + len(lub)] += 0.7 * lub[: len(out) - i]
    return np.tanh(1.5 * out) * vel


def snare(vel=1.0):
    t = tarr(0.55)
    nz = bp(rng.standard_normal(len(t)), 1100, 9500) * np.exp(-t / 0.13)
    tone = (np.sin(2 * np.pi * 182 * t) + 0.5 * np.sin(2 * np.pi * 331 * t)) * np.exp(-t / 0.06)
    return np.tanh(1.6 * (0.9 * nz + 0.7 * tone)) * vel


def clap(vel=1.0):
    t = tarr(0.4)
    out = np.zeros(len(t))
    for k, d in enumerate((0.0, 0.011, 0.022, 0.031)):
        i = int(d * SR)
        seg = rng.standard_normal(len(t) - i) * np.exp(-t[: len(t) - i] / (0.006 if k < 3 else 0.12))
        out[i:] += seg
    return bp(out, 900, 4200) * vel


def hat(vel=1.0, open_=False):
    t = tarr(0.35 if open_ else 0.08)
    x = hp(rng.standard_normal(len(t)), 7500, 3) * np.exp(-t / (0.12 if open_ else 0.022))
    return x * vel


def taiko(vel=1.0, kind=0):
    t = tarr(1.6)
    f0 = 62 if kind == 0 else 118
    f = f0 * (1 + 0.7 * np.exp(-t / 0.025))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 if kind == 0 else 0.25))
    skin = lp(rng.standard_normal(len(t)), 1200) * np.exp(-t / 0.04)
    return np.tanh(2.2 * (body + 0.55 * skin)) * vel


def impact(strength=1.0):
    t = tarr(5.0)
    f = 24 + 75 * np.exp(-t / 0.3)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.5)
    blast = lp(rng.standard_normal(len(t)), 1600) * np.exp(-t / 0.22)
    crash = hp(rng.standard_normal(len(t)), 3800) * np.exp(-t / 1.8)
    ring = sum(np.sin(2 * np.pi * fr * t + rng.random() * 6) for fr in (3150, 4420, 5870, 7310))
    crash = crash + 0.06 * hp(ring * rng.standard_normal(len(t)), 3000) * np.exp(-t / 1.2)
    x = 1.0 * sub + 0.55 * blast + 0.22 * crash * min(1.0, strength)
    return np.tanh(1.4 * x) * strength


def downlifter(dur=2.5):
    x = pink(dur)
    x = tv_filter(x, bp_mask(lambda tt: 7000 * np.exp(-tt / 0.6) + 150, 0.8))
    return x * np.exp(-tarr(dur) / 0.9)


def braam(dur=3.8):
    t = tarr(dur)
    x = np.zeros(len(t))
    for m, g in ((26, 1.0), (38, 0.9), (45, 0.6), (50, 0.4)):
        x += g * supersaw(midi_hz(m), dur, voices=5, spread=0.3)
    x = tv_filter(x, lp_mask(lambda tt: 180 + 2600 * np.exp(-tt / 0.5) * (1 - np.exp(-tt / 0.03))))
    x = np.tanh(2.5 * x / (np.max(np.abs(x)) + 1e-9))
    return x * adsr(len(t), 0.02, 1.4)


def riser(dur, strength=1.0):
    t = tarr(dur)
    p = t / dur
    nz = tv_filter(pink(dur), bp_mask(lambda tt: 250 * (36.0 ** (tt / dur)), 0.7))
    f = 110 * 8 ** p
    vib = 1 + 0.01 * np.sin(2 * np.pi * (3 + 9 * p) * t)
    tone = saw_from_freq(f * vib) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.25
    tone = lp(tone, 4000)
    return (nz * 0.8 + tone) * (p ** 2.2) * strength * adsr(len(t), 0.0, 0.006)


def whoosh(dur, strength=1.0):
    """Reverse swell that ends exactly at its own end."""
    t = tarr(dur)
    p = t / dur
    nz = tv_filter(pink(dur), bp_mask(lambda tt: 400 * (15.0 ** (tt / dur)), 0.9))
    crash = hp(rng.standard_normal(len(t)), 4000) * 0.5
    return (nz + crash * (p ** 2)) * (p ** 3) * strength * adsr(len(t), 0.0, 0.006)


def bell(m, vel=1.0):
    t = tarr(3.0)
    f0 = midi_hz(m)
    x = np.zeros(len(t))
    for ratio, amp, dec in ((1, 1, 2.2), (2.0, 0.45, 1.3), (2.76, 0.32, 0.9),
                            (5.4, 0.18, 0.45), (8.93, 0.1, 0.25)):
        x += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / dec)
    return x * adsr(len(t), 0.002, 0.05) * vel


def zap(vel=1.0):
    t = tarr(0.35)
    f = 260 * 10 ** np.minimum(t / 0.14, 1.0)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.12)
    x += 0.3 * saw_from_freq(f * 0.5) * np.exp(-t / 0.06)
    return lp(x * adsr(len(t), 0.003, 0.02), 6000) * vel


def brass_stab(chord, vel=1.0):
    dur = 0.9
    t = tarr(dur)
    x = np.zeros(len(t))
    for m in CHORD_STAB(chord):
        x += supersaw(midi_hz(m), dur, voices=5, spread=0.18)
    x = tv_filter(x, lp_mask(lambda tt: 500 + 3800 * np.exp(-tt / 0.18)))
    x = np.tanh(1.8 * x / (np.max(np.abs(x)) + 1e-9))
    return x * np.exp(-t / 0.3) * adsr(len(t), 0.006, 0.08) * vel


def CHORD_STAB(chord):
    notes = TL.CHORD_NOTES[chord]
    return [n - 12 for n in notes[:3]] + notes


def breath_sound(kind, dur):
    t = tarr(dur)
    p = t / dur
    if kind == "in1":
        x = tv_filter(pink(dur), bp_mask(lambda tt: 500 * 3.2 ** (tt / dur), 0.8))
        env = np.sin(np.pi * 0.5 * p) ** 1.5 * (1 - np.clip((p - 0.9) / 0.1, 0, 1) * 0.8)
    elif kind == "in2":
        x = tv_filter(pink(dur), bp_mask(lambda tt: 1100 * 2.4 ** (tt / dur), 0.7))
        env = np.sin(np.pi * 0.5 * p) * (1 - np.clip((p - 0.85) / 0.15, 0, 1) * 0.8)
    else:
        x = tv_filter(pink(dur), bp_mask(lambda tt: 2600 * 0.12 ** (tt / dur), 1.0))
        x += 0.6 * np.sin(2 * np.pi * 78 * t) * np.exp(-t / 1.2)
        env = (1 - np.exp(-t / 0.05)) * np.exp(-t / (dur * 0.45))
    return x * env


# --------------------------------------------------------------------------
# Arrangement
# --------------------------------------------------------------------------
def chord_runs():
    runs, start = [], 0
    for b in range(1, TL.TOTAL_BARS + 1):
        if b == TL.TOTAL_BARS or TL.CHORDS[b] != TL.CHORDS[start]:
            runs.append((start, b, TL.CHORDS[start]))
            start = b
    return runs


def section_of_bar(b):
    for name, b0, n in TL.SECTIONS:
        if b0 <= b < b0 + n:
            return name
    return "outro"


def build_pads():
    pad, choir = Bus(), Bus()
    for b0, b1, ch in chord_runs():
        sec = section_of_bar(b0)
        t0 = TL.T(b0)
        dur = TL.T(b1) - t0 + (3.5 if b1 >= TL.TOTAL_BARS else 0.5)
        notes = TL.CHORD_NOTES[ch]
        if sec == "intro":
            notes = [notes[0] - 12, notes[0], notes[2]]
        for side, pn in ((0, -0.6), (1, 0.6)):
            x = np.zeros(int(dur * SR))
            for m in notes:
                x += supersaw(midi_hz(m), dur, voices=5, spread=0.2)
            x *= adsr(len(x), 0.25 if b0 else 2.5, 0.5)
            pad.add(x, t0, 1.0, pn)
        if sec in ("title", "breath", "courage", "finale", "outro"):
            for m in notes:
                tt = tarr(dur)
                f = midi_hz(m + 12) * (1 + 0.005 * np.sin(2 * np.pi * 5.2 * tt + rng.random() * 6))
                v = sum(saw_from_freq(f * 2 ** (d / 1200), rng.random()) for d in (-9, 0, 9))
                choir.add(v * adsr(len(v), 0.6, 0.6), t0, 1.0, rng.uniform(-0.5, 0.5))

    def pad_fc(t):
        t = np.asarray(t)
        fc = np.interp(t, [0, TL.T(7, 3), TL.T(8), TL.T(20), TL.T(28), TL.T(36), TL.T(42), TL.T(43, 3),
                           TL.T(44), TL.T(60), TL.DURATION],
                       [500, 2000, 3600, 2400, 3300, 2200, 4200, 9000, 5200, 6000, 1300])
        return fc
    for c in range(2):
        pad.x[c] = tv_filter(pad.x[c], lp_mask(pad_fc, 2))
    pad.x = hp(pad.x, 140)
    formants = [(730, 1.0, 0.35), (1090, 0.6, 0.3), (2440, 0.25, 0.25)]

    def formant_mask(f, t):
        return sum(g * np.exp(-0.5 * (np.log2(np.maximum(f, 1) / fc) / w) ** 2) for fc, g, w in formants)
    for c in range(2):
        choir.x[c] = tv_filter(choir.x[c], formant_mask)
    return pad, choir


def build_bass():
    bus = Bus()
    # intro drone
    dur = TL.T(8) + 0.3
    t = tarr(dur)
    drone = np.sin(2 * np.pi * midi_hz(26) * t) + 0.25 * lp(saw(midi_hz(26), dur), 220)
    drone *= np.clip(t / 6.0, 0, 1) ** 1.5
    bus.add(drone, 0.0, 0.8)

    def note(m, t0, length, pluck):
        d = length + 0.08
        tt = tarr(d)
        f = midi_hz(m)
        x = np.sin(2 * np.pi * f * tt) + 0.55 * lp(saw(f, d), 420) + 0.12 * lp(saw(2 * f, d), 900)
        env = np.exp(-tt / 0.2) * 0.6 + 0.4 if pluck else np.ones(len(tt))
        x *= env * adsr(len(tt), 0.004, 0.06)
        bus.add(np.tanh(1.3 * x), t0, 1.0)

    for b in range(8, TL.TOTAL_BARS):
        sec = section_of_bar(b)
        m = TL.BASS_NOTE[TL.CHORDS[b]]
        if sec in ("title", "light"):
            note(m, TL.T(b), TL.BAR * 0.375, False)
            note(m, TL.T(b, 1.5), TL.BAR * 0.625, False)
        elif sec == "breath":
            note(m - 12 if m > 35 else m, TL.T(b), TL.BAR, False)
        elif sec in ("dopamine", "focus", "courage", "finale"):
            for e in range(8):
                mm = m + (12 if (sec in ("courage", "finale") and e in (3, 7)) else 0)
                note(mm, TL.T(b, e * 0.5), 0.5 * TL.BEAT * 0.9, True)
        elif sec == "outro":
            if b == 60:
                note(26, TL.T(60), 4 * TL.BAR + 2.0, False)
    return bus


def build_lead():
    bus = Bus()
    for start_bar, octave_double in ((44, False), (52, True)):
        for beat, length, m in TL.THEME:
            t0 = TL.T(start_bar, beat)
            d = length * TL.BEAT + 0.12
            tt = tarr(d)
            f = midi_hz(m) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt) * np.clip((tt - 0.18) / 0.2, 0, 1))
            x = sum(saw_from_freq(f * 2 ** (dd / 1200), rng.random()) for dd in (-12, -5, 0, 5, 12)) / 2.2
            x += 0.5 * saw_from_freq(f * 0.5, rng.random())
            if octave_double:
                x += 0.45 * saw_from_freq(f * 0.5 * 2 ** (7 / 1200), rng.random())
            x = lp(x, 5200)
            x *= adsr(len(tt), 0.01, 0.1) * (0.85 + 0.15 * np.exp(-tt / 0.25))
            bus.add(x, t0, 1.0, 0.0)
    bus.x = stereo_delay(bus.x, 0.3 * TL.BEAT / 0.4, fb=0.4, taps=4, mix=0.3)
    return bus


def build_ostinato():
    bus = Bus()
    pattern = [0, 0, 12, 0, 7, 0, 12, 0, 0, 0, 12, 0, 7, 12, 7, 0]
    bars = list(range(42, 44)) + list(range(44, 60))
    for b in bars:
        if b == 43:
            steps = range(12)
        elif b == 59:
            steps = range(14)
        else:
            steps = range(16)
        root = TL.BASS_NOTE[TL.CHORDS[b]] + 12
        for s in steps:
            t0 = TL.T(b, s * 0.25)
            d = 0.11
            tt = tarr(d)
            f = midi_hz(root + pattern[s])
            x = saw(f, d) + saw(f * 1.004, d) + saw(f * 0.996, d)
            x = lp(x, 2600) * np.exp(-tt / 0.055) * adsr(len(tt), 0.002, 0.02)
            bus.add(x, t0, 1.0 if s % 4 == 0 else 0.75, -0.35 if s % 2 else 0.35)
    return bus


def build_arps():
    bus = Bus()
    # focus: 16th-note arpeggio that opens up into the build
    for b in range(36, 44):
        notes = TL.CHORD_NOTES[TL.CHORDS[b]]
        seq = [notes[0] + 12, notes[1] + 12, notes[2] + 12, notes[3] + 12,
               notes[0] + 24, notes[3] + 12, notes[2] + 12, notes[1] + 12]
        steps = 12 if b == 43 else 16
        for s in range(steps):
            d = 0.2
            tt = tarr(d)
            f = midi_hz(seq[s % 8])
            x = saw(f, d) - saw(f, d, phase0=0.5) * 0.6
            x *= np.exp(-tt / 0.09) * adsr(len(tt), 0.002, 0.03)
            bus.add(x, TL.T(b, s * 0.25), 1.0, 0.45 * np.sin(s * 0.9))

    def fc(t):
        return np.interp(t, [TL.T(36), TL.T(42), TL.T(43, 3)], [700, 2600, 8000])
    for c in range(2):
        bus.x[c] = tv_filter(bus.x[c], lp_mask(fc, 2))
    # light: high crystalline sparkle on 8th notes
    sp = Bus()
    for b in range(12, 20):
        notes = TL.CHORD_NOTES[TL.CHORDS[b]]
        for e in range(8):
            m = int(rng.choice(notes)) + int(rng.choice([24, 36]))
            sp.add(bell(m, 0.5 + 0.3 * rng.random()) * 0.35, TL.T(b, e * 0.5), 1.0, rng.uniform(-0.8, 0.8))
    sp.x = stereo_delay(sp.x, 0.3, fb=0.45, taps=5, mix=0.4)
    return bus, sp


def build_drums():
    kb, sb, hb, tb = Bus(), Bus(), Bus(), Bus()
    for t, v in TL.KICKS:
        kb.add(kick(v), t)
    for t, v in TL.HEARTBEATS:
        kb.add(heartbeat(v), t, 1.0)
    for t, v in TL.SNARES:
        sb.add(snare(v), t, 1.0, rng.uniform(-0.1, 0.1))
    for t, v in TL.CLAPS:
        sb.add(clap(v), t + 0.004, 0.6, rng.uniform(-0.3, 0.3))
    for t, v, o in TL.HATS:
        hb.add(hat(v, o), t, 1.0, 0.3)
    for t, v, k in TL.TAIKOS:
        tb.add(taiko(v, k), t, 1.0, rng.uniform(-0.4, 0.4) if k else 0.0)
    return kb, sb, hb, tb


def build_fx():
    imp, fx, br = Bus(), Bus(), Bus()
    for t, s in TL.IMPACTS:
        imp.add(impact(s), t, 1.0)
        if s >= 1.0:
            imp.add(braam(), t, 0.55 * s)
            fx.add(downlifter(), t + 0.05, 0.35 * s)
    for t0, t1, s in TL.RISERS:
        fx.add(riser(t1 - t0, s), t0, 1.0)
    for t_end, dur, s in TL.WHOOSHES:
        fx.add(whoosh(dur, s), t_end - dur, 0.8, rng.uniform(-0.3, 0.3))
    for t, kind in TL.STABS:
        bar = int(t // TL.BAR + 1e-6)
        ch = TL.CHORDS[min(bar, TL.TOTAL_BARS - 1)]
        if kind == "brass":
            imp.add(brass_stab(ch, 1.0), t, 0.5)
            imp.add(taiko(0.9, 0), t, 0.55)
        else:
            imp.add(taiko(0.7, 0), t, 0.45)
            imp.add(bell(74, 0.8), t, 0.35)
    for t, v in TL.BELLS:
        br.add(bell(81, v), t, 0.6, -0.2)
        br.add(bell(86, v * 0.6), t + 0.003, 0.4, 0.3)
    for t, v in TL.ZAPS:
        fx.add(zap(v), t, 0.55, rng.uniform(-0.4, 0.4))
    for t, kind, dur in TL.BREATHS:
        br.add(breath_sound(kind, dur), t, 1.0 if kind != "out" else 1.1)
    # final shimmer: bell chord ringing out at the very end
    for i, m in enumerate((62, 69, 74, 77, 81)):
        br.add(bell(m, 0.6), TL.T(60) + 0.02 * i, 0.5, (i - 2) * 0.3)
    return imp, fx, br


def sidechain_env():
    env = np.ones(N)
    tt = np.arange(int(0.35 * SR)) / SR
    for t, v in TL.KICKS:
        i0 = int(t * SR)
        shape = 1 - 0.55 * v * np.exp(-tt / 0.11) * np.clip(tt / 0.004, 0, 1)
        n = min(len(shape), N - i0)
        env[i0:i0 + n] = np.minimum(env[i0:i0 + n], shape[:n])
    return env


def gate_env():
    g = np.ones(N)
    fade = int(0.006 * SR)
    for t0, t1 in TL.GATES:
        i0, i1 = int(t0 * SR), int(t1 * SR)
        g[i0:i1] = 0.0
        g[max(0, i0 - fade):i0] = np.linspace(1, 0, min(fade, i0))
    return g


def limiter(x, ceiling=0.89, release=0.08):
    a = np.max(np.abs(x), axis=0)
    look = int(0.004 * SR)
    peak = ndimage.maximum_filter1d(a, size=2 * look + 1)
    alpha = np.exp(-1.0 / (release * SR))
    env = signal.lfilter([1 - alpha], [1, -alpha], peak)
    env = np.maximum(env, peak)
    gain = np.minimum(1.0, ceiling / (env + 1e-9))
    gain = ndimage.uniform_filter1d(gain, size=look)
    return x * gain


def main(out_path):
    print("drums...")
    kb, sb, hb, tb = build_drums()
    print("pads + choir...")
    pad, choir = build_pads()
    print("bass / lead / ostinato / arps...")
    bass = build_bass()
    lead = build_lead()
    ost = build_ostinato()
    arp, sparkle = build_arps()
    print("fx...")
    imp, fx, br = build_fx()

    kb.norm_peak(0.9)
    sb.norm_peak(0.62)
    hb.norm_peak(0.22)
    tb.norm_peak(0.7)
    pad.norm_rms(0.075)
    choir.norm_rms(0.045)
    bass.norm_rms(0.095)
    lead.norm_rms(0.11)
    ost.norm_rms(0.07)
    arp.norm_rms(0.05)
    sparkle.norm_rms(0.03)
    imp.norm_peak(1.0)
    fx.norm_peak(0.42)
    br.norm_peak(0.45)

    sc = sidechain_env()
    gate = gate_env()
    for bus, depth in ((pad, 1.0), (choir, 0.6), (bass, 1.0), (lead, 0.5), (ost, 0.8), (arp, 0.8)):
        bus.x *= 1 - depth * (1 - sc)

    music = (pad.x + choir.x + bass.x + lead.x + ost.x + arp.x + sparkle.x
             + kb.x + sb.x + hb.x + tb.x)
    music *= gate
    print("reverb...")
    hall = make_ir()
    send = (0.35 * pad.x + 0.5 * choir.x + 0.35 * lead.x + 0.2 * ost.x + 0.3 * arp.x
            + 0.6 * sparkle.x + 0.22 * sb.x + 0.35 * tb.x + 0.3 * imp.x + 0.25 * fx.x + 0.6 * br.x)
    wet = convolve(send * (0.3 + 0.7 * gate), hall)
    mix = music + imp.x + fx.x + br.x + 0.55 * wet

    # master EQ (zero-phase, STFT): tighter sub, more presence and air for small speakers
    eq_f = [10, 35, 70, 140, 400, 1200, 3000, 7000, 12000, 22050]
    eq_db = [-24, -5, -3.5, -1.5, 0, 1.5, 4, 4.5, 3, 1]

    def eq_mask(f, t):
        return 10 ** (np.interp(f, eq_f, eq_db) / 20) + 0 * t
    mix = np.vstack([tv_filter(mix[c], eq_mask) for c in range(2)])
    mix *= 1.0 / (np.max(np.abs(mix)) + 1e-9) * 1.6
    mix = limiter(mix, 0.89)
    mix = np.tanh(mix * 1.05) / np.tanh(1.05)
    # ring-out fade
    tt = np.arange(N) / SR
    mix *= np.clip((TL.DURATION - tt) / 4.5, 0, 1) ** 1.5
    # normalise to -1 dBTP (4x oversampled peak)
    tp = max(np.max(np.abs(signal.resample_poly(mix[c], 4, 1))) for c in range(2))
    mix *= 0.89 / tp

    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16).T
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", out_path, f"{TL.DURATION:.1f}s")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "build/music.wav")
