"""Synthesizes the soundtrack: an epic, hot-blooded trailer cue in D minor,
plus every sound effect, all placed on the grid from timeline.py.

    python music.py            -> build/audio.wav (48 kHz, 16-bit stereo)
"""
import os
import wave

import numpy as np
from scipy import signal

from timeline import (SR, BEAT, BAR, DURATION, T, CHORDS, PROG, KICKS, TAIKOS, SNARES,
                      HATS_CLOSED, HATS_OPEN, CRASHES, IMPACTS, BRAAMS, WHOOSHES, RISERS,
                      IMPLODES, SILENCES, HEARTS, STAB_HITS, SHIMMERS)

N = int(round(DURATION * SR))
rng = np.random.default_rng(11)
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "build")


# ------------------------------------------------------------ primitives ---
def mtof(m):
    return 440.0 * 2 ** ((np.asarray(m, float) - 69) / 12)


def tv(n):
    return np.arange(n) / SR


def ns(n):
    return rng.standard_normal(n)


def saw(freq, n, phase=None):
    """Band-limited (polyBLEP) sawtooth; `freq` may be a scalar or per-sample array."""
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    dt = f / SR
    ph = ((rng.random() if phase is None else phase) + np.cumsum(dt)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    y[m] -= x * x + x + x + 1
    return y


def sine(freq, n, phase=0.0):
    f = np.broadcast_to(np.asarray(freq, float), (n,))
    return np.sin(2 * np.pi * np.cumsum(f) / SR + phase)


def filt(x, fc, btype="low", order=2):
    sos = signal.butter(order, fc, btype, fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=-1)


def sweep(x, fcs, btype="low", order=2, block=256):
    """Time-varying Butterworth filter, coefficients updated every `block` samples."""
    fcs = np.broadcast_to(np.asarray(fcs, float), (x.shape[-1],))
    y = np.empty_like(x)
    zi = None
    for i in range(0, x.shape[-1], block):
        fc = fcs[min(i + block // 2, len(fcs) - 1)]
        if btype == "band":
            fc = (max(fc / 1.6, 30), min(fc * 1.6, SR / 2.2))
        else:
            fc = float(np.clip(fc, 20, SR / 2.2))
        sos = signal.butter(order, fc, btype, fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return y


def env(n, a=0.005, r=0.05, hold=None):
    """Linear attack, flat hold, linear release (hold defaults to the rest)."""
    e = np.ones(n)
    na = max(int(a * SR), 1)
    nr = max(int(r * SR), 1)
    e[:na] = np.linspace(0, 1, na)
    if nr < n:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pan2(x, p):
    """Equal-power pan, p in [-1, 1]."""
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)])


def place(bus, sig, t, gain=1.0, p=0.0):
    i = int(round(t * SR))
    if sig.ndim == 1:
        sig = pan2(sig, p)
    if i < 0:
        sig, i = sig[:, -i:], 0
    n = min(sig.shape[1], N - i)
    if n > 0:
        bus[:, i:i + n] += sig[:, :n] * gain


def make_ir(rt, pre=0.012, lp=7000, seed=0):
    r = np.random.default_rng(seed)
    n = int(rt * 1.3 * SR)
    t = tv(n)
    ir = r.standard_normal((2, n)) * np.exp(-6.9 * t / rt)
    ir = filt(ir, lp)
    ir[:, :int(pre * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum() / 2)


def reverb(x, ir, wet):
    y = np.stack([signal.fftconvolve(x[c], ir[c])[:N] for c in range(2)])
    return x + y * wet


def gate(x, windows, floor=0.0, fade=0.004):
    g = np.ones(N)
    nf = int(fade * SR)
    for a, b in windows:
        i, j = int(round(a * SR)), int(round(b * SR))
        g[i:j] = floor
        g[max(i - nf, 0):i] = np.linspace(1, floor, i - max(i - nf, 0))
        g[j:j + nf] = np.linspace(floor, 1, len(g[j:j + nf]))
    return x * g


def duck(times, depth=0.6, tau=0.11):
    """Sidechain gain curve: dips on every kick and recovers."""
    g = np.ones(N)
    n = int(0.6 * SR)
    att = int(0.006 * SR)
    shape = np.concatenate([np.linspace(0, 1, att), np.exp(-tv(n - att) / tau)]) * depth
    for t in times:
        i = int(round(t * SR))
        m = min(n, N - i)
        if m > 0:
            g[i:i + m] = np.minimum(g[i:i + m], 1 - shape[:m])
    return g


# ------------------------------------------------------------- drum kit ----
def kick():
    n = int(0.5 * SR)
    t = tv(n)
    f = 44 + 130 * np.exp(-t / 0.028)
    body = sine(f, n) * np.exp(-t / 0.24)
    click = filt(ns(n), 2500, "high") * np.exp(-t / 0.003) * 0.5
    return np.tanh(2.4 * (body + click)) * 0.9


def taiko():
    n = int(1.6 * SR)
    t = tv(n)
    body = sine(58 + 75 * np.exp(-t / 0.05), n) * np.exp(-t / 0.5)
    skin = filt(ns(n), 900) * np.exp(-t / 0.05) * 1.2
    return np.tanh(1.8 * (body + skin))


def snare():
    n = int(0.6 * SR)
    t = tv(n)
    tone = sine(190, n) * np.exp(-t / 0.05) * 0.6 + sine(330, n) * np.exp(-t / 0.025) * 0.25
    nz = filt(ns(n), (1300, 9500), "band") * np.exp(-t / 0.15) * 1.6
    clap = np.zeros(n)
    for k, d in enumerate((0.0, 0.011, 0.022)):
        i = int(d * SR)
        m = int(0.02 * SR) if k < 2 else int(0.25 * SR)
        clap[i:i + m] += filt(ns(m), (900, 5000), "band") * np.exp(-tv(m) / (0.006 if k < 2 else 0.09))
    return np.tanh(1.3 * (tone + nz + clap * 1.2)) * 0.8


def hat(open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = tv(n)
    return filt(ns(n), 7500, "high", 4) * np.exp(-t / (0.12 if open_ else 0.022))


def crash(dur=3.0):
    n = int(dur * SR)
    t = tv(n)
    out = []
    for _ in range(2):
        x = filt(ns(n), 3800, "high", 3) * np.exp(-t / 1.0)
        x += filt(ns(n), (5000, 11000), "band") * np.exp(-t / 0.35) * 0.8
        out.append(x)
    return np.stack(out) * 0.5


def tom(f):
    n = int(0.6 * SR)
    t = tv(n)
    return np.tanh(1.5 * sine(f * (1 + 0.6 * np.exp(-t / 0.04)), n) * np.exp(-t / 0.28))


# --------------------------------------------------------- tonal voices ----
def supersaw(midis, dur, voices=7, detune=0.16, fc=4500, a=0.01, r=0.15, width=0.8):
    n = int(dur * SR)
    out = np.zeros((2, n))
    for m in midis:
        for v in range(voices):
            d = (v / (voices - 1) - 0.5) * 2 * detune if voices > 1 else 0
            out += pan2(saw(mtof(m + d), n), (v / (voices - 1) - 0.5) * 2 * width if voices > 1 else 0)
    out = filt(out, fc) * env(n, a, r) / (voices * len(midis)) ** 0.5
    return out


def choir(midis, dur, a=0.45, r=0.9, gain=1.0):
    """Detuned saws through 'aah' formants with slow vibrato."""
    n = int(dur * SR)
    t = tv(n)
    out = np.zeros((2, n))
    vib = 0.08 * np.sin(2 * np.pi * 5.1 * t) * np.clip(t / 0.8, 0, 1)
    for m in midis:
        for v in range(4):
            x = saw(mtof(m + (v - 1.5) * 0.07 + vib), n)
            y = (filt(x, (560, 840), "band") * 1.0 + filt(x, (950, 1300), "band") * 0.55
                 + filt(x, (2400, 3000), "band") * 0.3)
            out += pan2(y, (v - 1.5) / 1.5 * 0.7)
    return out * env(n, a, r) * gain / (4 * len(midis)) ** 0.5 * 2.2


def bass_note(m, dur, fc=520):
    n = int(dur * SR)
    t = tv(n)
    x = saw(mtof(m), n) * 0.7 + sine(mtof(m), n) * 0.8
    x = sweep(x, fc + 1400 * np.exp(-t / 0.05))
    return np.tanh(1.4 * x) * env(n, 0.003, 0.03)


def stacc(m, dur=0.13):
    n = int(dur * SR)
    t = tv(n)
    x = sum(saw(mtof(m + d), n) for d in (-0.08, 0, 0.08)) / 3
    x = sweep(x, 900 + 2600 * np.exp(-t / 0.05))
    return x * np.exp(-t / 0.07) * env(n, 0.002, 0.02)


def lead_note(m, dur):
    n = int(dur * SR)
    t = tv(n)
    vib = 0.13 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
    out = np.zeros((2, n))
    for v, d in enumerate((-0.12, -0.05, 0, 0.05, 0.12)):
        out += pan2(saw(mtof(m + d + vib), n), (v - 2) / 2 * 0.6)
        out += pan2(saw(mtof(m + 12 + d + vib), n), (2 - v) / 2 * 0.6) * 0.35
    out = filt(out, 6000) * env(n, 0.008, min(0.08, dur * 0.4))
    return out / 3.2


def pluck(m, dur=0.9):
    n = int(dur * SR)
    t = tv(n)
    f = mtof(m)
    x = sine(f, n) + 0.35 * sine(2 * f, n) * np.exp(-t / 0.15) + 0.15 * sine(3 * f, n) * np.exp(-t / 0.08)
    return x * np.exp(-t / 0.35) * env(n, 0.002, 0.05)


def braam(midis, dur=4.0):
    n = int(dur * SR)
    t = tv(n)
    out = np.zeros((2, n))
    for m in midis:
        for v in range(5):
            out += pan2(saw(mtof(m + (v - 2) * 0.09), n), (v - 2) / 2 * 0.5)
    fc = 120 + 1900 * (1 - np.exp(-t / 0.18)) * np.exp(-t / 1.4)
    out = np.stack([sweep(out[c], fc) for c in range(2)])
    out = np.tanh(2.2 * out / (5 * len(midis)) ** 0.5)
    return out * env(n, 0.02, 1.2) * np.exp(-t / 2.4)


def stab(midis, dur=0.42):
    n = int(dur * SR)
    t = tv(n)
    out = supersaw(midis, dur, voices=5, detune=0.12, fc=9000, a=0.003, r=0.08)
    out = np.stack([sweep(out[c], 600 + 6000 * np.exp(-t / 0.07)) for c in range(2)])
    return out * np.exp(-t / 0.16)


# ------------------------------------------------------------------ sfx -----
def boom(strength=1.0):
    n = int(3.0 * SR)
    t = tv(n)
    b = sine(30 + 34 * np.exp(-t / 0.18), n) * np.exp(-t / 1.1)
    hit = filt(ns(n), 1800) * np.exp(-t / 0.12) * 1.2
    sub = sine(25 + 70 * np.exp(-t / 0.35), n) * np.exp(-t / 0.9) * 0.7
    return np.tanh(1.6 * (b + hit + sub)) * strength


def riser(dur):
    n = int(dur * SR)
    t = tv(n)
    u = t / dur
    nz = np.stack([sweep(ns(n), 250 * (40 ** u), "high"), sweep(ns(n), 250 * (40 ** u), "high")])
    tone = saw(mtof(50 + 24 * u ** 1.6), n) + saw(mtof(57 + 24 * u ** 1.6), n)
    tone = sweep(tone, 400 + 5000 * u ** 2)
    amp = (u ** 2.2)
    return (nz * 0.45 + pan2(tone, 0) * 0.35) * amp


def reverse_crash(dur=1.6):
    return crash(dur + 0.2)[:, ::-1][:, -int(dur * SR):] * np.linspace(0.2, 1, int(dur * SR)) ** 2 * 1.6


def whoosh(dur=0.7, peak_at=0.8, strength=1.0):
    n = int(dur * SR)
    t = tv(n)
    u = t / dur
    fc = np.where(u < peak_at, 300 * (9 ** (u / peak_at)), 2700 * (0.35 ** ((u - peak_at) / (1 - peak_at))))
    x = sweep(ns(n), fc, "band")
    amp = np.where(u < peak_at, (u / peak_at) ** 2.5, np.exp(-(u - peak_at) / (1 - peak_at) * 4))
    p = np.clip(u * 2 - 1, -1, 1) * 0.85
    a = (p + 1) * np.pi / 4
    return np.stack([x * amp * np.cos(a), x * amp * np.sin(a)]) * 2.2 * strength


def implode(dur):
    n = int(dur * SR)
    u = tv(n) / dur
    x = sweep(ns(n), 200 * (30 ** u), "high")
    b = boom(0.6)[:n][::-1]
    return pan2(x * u ** 3 * 0.9 + b * u ** 2 * 0.8, 0)


def bell(m, dur=1.4):
    n = int(dur * SR)
    t = tv(n)
    f = mtof(m)
    return (sine(f, n) * np.exp(-t / 0.7) + 0.45 * sine(2.76 * f, n) * np.exp(-t / 0.25)
            + 0.2 * sine(5.4 * f, n) * np.exp(-t / 0.1)) * env(n, 0.001, 0.05)


def heart():
    n = int(0.5 * SR)
    t = tv(n)
    one = sine(48 + 20 * np.exp(-t / 0.03), n) * np.exp(-t / 0.11)
    one = np.tanh(2 * one)
    out = one.copy()
    d = int(0.17 * SR)
    out[d:] += one[:n - d] * 0.6
    return out


# ------------------------------------------------------------ arrange ------
def chord_at(bar):
    return CHORDS[PROG[min(int(bar), len(PROG) - 1)]]


def build():
    drums = np.zeros((2, N))
    bass = np.zeros((2, N))
    music = np.zeros((2, N))
    choirb = np.zeros((2, N))
    sfx = np.zeros((2, N))

    # ---- drums
    k = kick()
    for t in KICKS:
        place(drums, k, t, 1.0)
    tk = taiko()
    for t in TAIKOS:
        place(drums, tk, t, 0.9, rng.uniform(-0.15, 0.15))
    sn = snare()
    for t in SNARES:
        g = 0.85
        if T(15) <= t < T(16):
            g = 0.35 + 0.5 * (t - T(15)) / BAR
        elif T(28) <= t < T(32):
            g = 0.3 + 0.6 * (t - T(28)) / (4 * BAR)
        place(drums, sn, t, g, rng.uniform(-0.1, 0.1))
    hc, ho = hat(), hat(True)
    for i, t in enumerate(HATS_CLOSED):
        place(drums, hc, t, 0.18 if i % 2 else 0.26, 0.35)
    for t in HATS_OPEN:
        place(drums, ho, t, 0.22, -0.3)
    for t in CRASHES:
        place(drums, crash(), t, 0.55)
    # tom fills leading into card changes in act I and the final bar of the title
    for b in (9, 11, 13):
        for j, f in enumerate((160, 130, 105, 85)):
            place(drums, tom(f), T(b, 3 + j / 4), 0.5)
    for j, f in enumerate((170, 150, 130, 110, 95, 80, 70, 62)):
        place(drums, tom(f), T(39, 2 + j / 4), 0.55)

    # ---- intro drone + heartbeat
    n0 = int(T(4) * SR)
    t0 = tv(n0)
    drone = saw(mtof(26), n0) + saw(mtof(38.05), n0) * 0.7 + sine(mtof(26), n0) * 1.2
    drone = sweep(drone, 90 + 500 * (t0 / T(4)) ** 2) * np.clip(t0 / 2.5, 0, 1)
    place(bass, drone, 0, 0.16)
    for t in HEARTS:
        place(sfx, heart(), t, 0.9)
    place(choirb, choir([50, 57, 62], T(4) - T(1) + 0.4, a=2.5, r=0.6), T(1), 0.3)

    # ---- title: choir chords per bar + braam
    for b in range(4, 8):
        root, ch = chord_at(b)
        place(choirb, choir([m - 12 for m in ch] + [ch[0]], BAR + 0.3, a=0.08, r=0.5), T(b), 0.9)
        place(bass, bass_note(root, BAR * 0.95, fc=300), T(b), 0.55)

    # ---- pads (supersaw) across act I .. finale
    def pad_span(b0, b1, step, fc0, fc1, gain):
        for b in range(b0, b1, step):
            _, ch = chord_at(b)
            dur = step * BAR + 0.05
            x = supersaw(ch + [ch[0] - 12], dur, fc=1000)
            n = x.shape[1]
            u = ((b - b0) * BAR + tv(n)) / ((b1 - b0) * BAR)
            x = np.stack([sweep(x[c], fc0 * (fc1 / fc0) ** u) for c in range(2)])
            place(music, x, T(b), gain)

    pad_span(8, 16, 2, 700, 3200, 0.4)
    pad_span(16, 24, 2, 5000, 5000, 0.62)
    pad_span(28, 32, 1, 800, 5200, 0.55)
    pad_span(32, 40, 1, 6000, 6000, 0.66)
    pad_span(40, 42, 2, 5000, 5000, 0.6)
    pad_span(42, 44, 1, 3000, 1200, 0.45)

    # ---- staccato ostinato (16ths)
    def ostinato(b0, b1, gain0, gain1, stop=None):
        for b in range(b0, b1):
            root, _ = chord_at(b)
            r = root + 12
            while r < 46:
                r += 12
            pat = [r, r + 12, r + 7, r + 12]
            for i in range(16):
                t = T(b, i / 4)
                if stop is not None and t >= stop - 1e-6:
                    return
                g = gain0 + (gain1 - gain0) * ((b - b0) * 16 + i) / ((b1 - b0) * 16)
                place(music, stacc(pat[i % 4]), t, g * (1.0 if i % 4 == 0 else 0.75), 0.25 if i % 2 else -0.25)

    ostinato(8, 16, 0.18, 0.42, stop=T(15, 3))
    ostinato(16, 24, 0.32, 0.32)
    ostinato(28, 32, 0.2, 0.45, stop=T(31, 3))
    ostinato(32, 40, 0.38, 0.38)

    # ---- bass
    def bass_line(b0, b1, div, gain, octave_jump=True, stop=None):
        for b in range(b0, b1):
            root, _ = chord_at(b)
            step = 4 / div
            for i in range(div):
                t = T(b, i * step)
                if stop is not None and t >= stop - 1e-6:
                    return
                m = root + (12 if (octave_jump and i % 2) else 0)
                place(bass, bass_note(m, step * BEAT * 0.92), t, gain)

    bass_line(12, 16, 4, 0.5, False, stop=T(15, 3))
    bass_line(16, 24, 8, 0.6)
    bass_line(28, 30, 8, 0.5, stop=T(31, 3))
    bass_line(30, 32, 16, 0.45, False, stop=T(31, 3))
    bass_line(32, 40, 8, 0.66)
    bass_line(40, 42, 2, 0.6, False)

    # ---- lead melodies
    mel1 = [(74, 1), (69, .5), (74, .5), (76, 1), (77, 1), (76, 1.5), (74, .5), (69, 2),
            (74, 1), (70, .5), (74, .5), (77, 1), (79, 1), (77, 1.5), (76, .5), (74, 2),
            (72, 1), (77, .5), (79, .5), (81, 1), (79, 1), (77, 1.5), (76, .5), (72, 2),
            (76, 1), (79, 1), (84, 1), (82, .5), (81, .5), (79, 1.5), (77, .5), (76, 2)]
    mel2 = [(74, 1), (69, .5), (74, .5), (77, 1), (76, 1),
            (74, 1), (70, .5), (74, .5), (77, 1), (79, 1),
            (69, 1), (72, .5), (77, .5), (81, 1), (79, 1),
            (79, 1.5), (76, .5), (72, 1), (76, 1),
            (77, 1), (76, .5), (74, .5), (81, 2),
            (79, 1), (77, .5), (74, .5), (82, 2),
            (82, 1), (81, .5), (79, .5), (74, 1), (79, 1),
            (81, 1.5), (79, .5), (76, 1), (73, 1)]

    def play(mel, start, gain):
        t = start
        for m, d in mel:
            place(music, lead_note(m, d * BEAT * 0.96), t, gain)
            t += d * BEAT

    play(mel1, T(16), 0.5)
    play(mel2, T(32), 0.55)
    play([(74, 8), (77, 4), (76, 3)], T(40), 0.5)

    # ---- breakdown: choir + plucked arpeggio with ping-pong echo
    for b in range(24, 28):
        root, ch = chord_at(b)
        place(choirb, choir([m - 12 for m in ch] + [ch[1]], BAR + 0.5, a=0.6, r=0.8), T(b), 0.55)
        place(bass, sine(mtof(root), int(BAR * SR)) * env(int(BAR * SR), 0.2, 0.4), T(b), 0.3)
        arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[2], ch[1], ch[0] + 12, ch[2] + 12]
        for i, m in enumerate(arp):
            for e in range(4):
                place(music, pluck(m), T(b, i / 2 + 0.75 * e), 0.32 * 0.45 ** e, (-0.6, 0.6)[e % 2] if e else 0)

    # ---- choir layers on the big moments
    for b in range(32, 40):
        _, ch = chord_at(b)
        place(choirb, choir(ch + [ch[0] - 12], BAR + 0.2, a=0.04, r=0.4), T(b), 0.45)
    for b in range(40, 44):
        _, ch = chord_at(b)
        dur = (BAR if b != 43 else 3 * BEAT) + 0.15
        place(choirb, choir(ch + [ch[0] - 12, ch[0] + 12], dur, a=0.1, r=0.5), T(b), 0.6)
    place(choirb, choir([50, 62, 66, 69, 74], 6.0, a=0.03, r=3.0), T(44), 1.1)
    place(music, supersaw([50, 62, 66, 69, 74], 5.0, fc=5000, a=0.004, r=3.5), T(44), 0.8)

    # ---- brass stabs on the card / word changes in the drops
    for t in STAB_HITS:
        bar = int(round(t / BAR))
        _, ch = chord_at(bar)
        place(music, stab([m - 12 for m in ch] + [ch[0] - 24]), t, 0.6)

    # ---- sfx
    for t, s in IMPACTS:
        place(sfx, boom(s), t, 0.95)
    for t in BRAAMS:
        final = t >= T(44) - 1e-6
        place(sfx, braam([26, 38, 45, 50] + ([54, 57] if final else [53])), t, 0.9 if final else 0.75)
    for t in WHOOSHES:
        short = T(33) - 1e-6 <= t <= T(39) + 1e-6
        dur = 0.45 if short else 0.75
        place(sfx, whoosh(dur), t - dur * 0.8, 0.35 if short else 0.55)
    for a, b in RISERS:
        place(sfx, riser(b - a), a, 0.6)
    for t in (T(4), T(16), T(32), T(44)):
        rc = reverse_crash(1.6)
        place(sfx, rc, t - rc.shape[1] / SR, 0.4)
    for a, b in IMPLODES:
        place(sfx, implode(b - a), a, 0.5)
    pent = [86, 89, 93, 96, 98, 100, 101, 105]
    for t in SHIMMERS:
        for j in range(6):
            place(sfx, bell(int(rng.choice(pent))), t + j * 0.07, 0.07, rng.uniform(-0.7, 0.7))
    # ignition sparkle at the first frame of light
    for j in range(8):
        place(sfx, bell(pent[j % len(pent)] - 12), T(0) + 0.05 + j * 0.06, 0.05, rng.uniform(-0.5, 0.5))

    # ---- mix
    drop_kicks = [t for t in KICKS if t >= T(16)]
    dk = duck(drop_kicks, 0.55)
    music *= dk
    bass *= duck(drop_kicks, 0.7, 0.09)
    choirb *= duck(drop_kicks, 0.3)

    ir_big, ir_mid = make_ir(3.2, lp=6500, seed=1), make_ir(1.4, lp=8000, seed=2)
    drums = reverb(drums, ir_mid, 0.12)
    music = reverb(music, ir_mid, 0.18)
    choirb = reverb(choirb, ir_big, 0.45)
    sfx = reverb(sfx, ir_big, 0.3)

    mus = drums * 0.95 + bass * 0.85 + music * 0.8 + choirb * 0.75
    mus = gate(mus, SILENCES)
    mus = gate(mus, [(T(15, 3), T(16))], floor=0.3, fade=0.02)
    mix = mus + sfx
    mix = filt(mix, 28, "high")

    # glue compression + soft clip
    lvl = np.sqrt(signal.lfilter([1 - np.exp(-1 / (0.03 * SR))], [1, -np.exp(-1 / (0.03 * SR))],
                                 (mix ** 2).mean(0)))
    peak_ref = np.percentile(lvl, 98)
    thr = peak_ref * 0.7
    gain = np.where(lvl > thr, (thr / np.maximum(lvl, 1e-9)) ** (1 - 1 / 2.0), 1.0)
    mix = mix * gain
    mix = mix / np.max(np.abs(mix)) * 1.4
    mix = np.tanh(mix) / np.tanh(1.4)
    # fade the last two seconds
    fade_n = int(2.0 * SR)
    mix[:, -fade_n:] *= np.linspace(1, 0, fade_n) ** 2
    mix = mix / np.max(np.abs(mix)) * 0.93
    return mix


def write_wav(path, x):
    pcm = (np.clip(x, -1, 1) * 32767).astype("<i2").T.copy()
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    mix = build()
    write_wav(os.path.join(OUT, "audio.wav"), mix)
    print("wrote", os.path.join(OUT, "audio.wav"), mix.shape[1] / SR, "s")
