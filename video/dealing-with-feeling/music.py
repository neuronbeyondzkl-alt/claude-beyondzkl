"""Synthesises the score + sound design for the video, cue-locked to timeline.py.

Epic / "燃" trailer style at 120 BPM in D minor: braams, taiko, four-on-the-floor
drops, supersaw chords, string ostinato, risers, whooshes and impacts.
Everything is generated from scratch with numpy/scipy (no samples).
"""
import sys
import numpy as np
from scipy import signal
from scipy.io import wavfile
from scipy.ndimage import maximum_filter1d, uniform_filter1d

import timeline as TL

SR = 44100
N = int(SR * TL.DURATION)
rng = np.random.default_rng(2025)

BUSES = {k: np.zeros((2, N), np.float32)
         for k in ("drums", "bass", "pads", "keys", "lead", "sfx", "rev")}


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


NOTE = {"C": 0, "C#": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "G": 7,
        "Ab": 8, "A": 9, "Bb": 10, "B": 11}
CHORDS = {  # pad voicings (MIDI)
    "Dm": [50, 57, 62, 65, 69],
    "Bb": [46, 53, 58, 62, 65],
    "F":  [53, 57, 60, 65, 69],
    "C":  [48, 55, 60, 64, 67],
    "D":  [50, 57, 62, 66, 69],
}
ROOT = {"Dm": 38, "Bb": 34, "F": 41, "C": 36, "D": 38}
TONES = {"Dm": [62, 65, 69], "Bb": [58, 62, 65], "F": [60, 65, 69],
         "C": [60, 64, 67], "D": [62, 66, 69]}


# ------------------------------------------------------------------ helpers
def tt(dur):
    return np.arange(int(dur * SR)) / SR


def butter(sig, kind, f, order=2):
    if kind == "band":
        wn = [max(f[0], 10) / (SR / 2), min(f[1], SR / 2 - 100) / (SR / 2)]
    else:
        wn = min(max(f, 10), SR / 2 - 100) / (SR / 2)
    sos = signal.butter(order, wn, btype=kind, output="sos")
    return signal.sosfilt(sos, sig, axis=-1)


def noise(n):
    return rng.standard_normal(n)


def saw(freq, n, phase=None):
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    dt = f / SR
    ph0 = rng.random() if phase is None else phase
    ph = (ph0 + np.cumsum(dt)) % 1.0
    y = 2.0 * ph - 1.0
    m = ph < dt
    x = ph[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = ph > 1.0 - dt
    x = (ph[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def adsr(n, a=0.01, d=0.1, s=0.8, r=0.2, hold=None):
    """hold = seconds before release starts (default: n - r)."""
    t = np.arange(n) / SR
    total = n / SR
    hold = total - r if hold is None else hold
    env = np.where(t < a, t / max(a, 1e-4),
                   s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = t > hold
    if rel.any():
        lvl = env[np.argmax(rel)] if rel.any() else s
        env[rel] = lvl * np.exp(-(t[rel] - hold) / max(r / 4, 1e-4))
    return env


def pan2(sig, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([sig * np.cos(a), sig * np.sin(a)])


def place(bus, sig, t, gain=1.0, pan=0.0, rev=0.0):
    if sig.ndim == 1:
        sig = pan2(sig, pan)
    i0 = int(round(t * SR))
    if i0 >= N:
        return
    if i0 < 0:
        sig = sig[:, -i0:]
        i0 = 0
    n = min(sig.shape[1], N - i0)
    BUSES[bus][:, i0:i0 + n] += gain * sig[:, :n]
    if rev:
        BUSES["rev"][:, i0:i0 + n] += gain * rev * sig[:, :n]


def shaped_noise(dur, fc_fn, bw_oct=0.6, amp_fn=None, stereo=True):
    """Noise whose spectrum is a moving log-gaussian bump centred at fc_fn(u)."""
    nper = 1024
    n = int(dur * SR)
    chans = []
    for c in range(2 if stereo else 1):
        _, _, Z = signal.stft(noise(n), SR, nperseg=nper)
        freqs = np.fft.rfftfreq(nper, 1 / SR)[:, None]
        u = np.linspace(0, 1, Z.shape[1])[None, :]
        fc = fc_fn(u)
        lf = np.log2(np.maximum(freqs, 20) / fc)
        Z = Z * np.exp(-0.5 * (lf / bw_oct) ** 2)
        _, x = signal.istft(Z, SR, nperseg=nper)
        x = x[:n]
        if len(x) < n:
            x = np.pad(x, (0, n - len(x)))
        chans.append(x)
    y = np.stack(chans) if stereo else chans[0]
    if amp_fn is not None:
        y = y * amp_fn(np.linspace(0, 1, n))
    return y / (np.abs(y).max() + 1e-9)


# ------------------------------------------------------------------ drums
def kick(v=1.0, big=False):
    t = tt(0.9 if big else 0.55)
    f = 44 + (190 if big else 150) * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (0.5 if big else 0.3))
    clk = butter(noise(len(t)), "high", 2500) * np.exp(-t / 0.004) * 0.35
    return np.tanh(1.8 * (body + clk)) * v


def snare(v=1.0):
    t = tt(0.4)
    tone = (np.sin(2 * np.pi * 185 * t) + 0.5 * np.sin(2 * np.pi * 330 * t)) * np.exp(-t / 0.05)
    nz = butter(noise(len(t)), "band", (900, 9000)) * np.exp(-t / 0.13)
    return (0.6 * tone + 1.1 * nz) * v


def clap(v=1.0):
    t = tt(0.45)
    env = np.zeros_like(t)
    for d in (0.0, 0.011, 0.023):
        env += np.where(t >= d, np.exp(-(t - d) / 0.007), 0)
    env += np.where(t >= 0.03, 0.8 * np.exp(-(t - 0.03) / 0.13), 0)
    return butter(noise(len(t)), "band", (900, 4200)) * env * 1.4 * v


def hat(v=1.0, open_=False):
    t = tt(0.35 if open_ else 0.08)
    nz = butter(noise(len(t)), "high", 7500)
    return nz * np.exp(-t / (0.16 if open_ else 0.022)) * v


def taiko(v=1.0):
    t = tt(1.2)
    f = 58 + 45 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    body += 0.4 * np.sin(2 * np.pi * np.cumsum(f * 1.52) / SR) * np.exp(-t / 0.25)
    skin = butter(noise(len(t)), "low", 900) * np.exp(-t / 0.04) * 0.9
    return np.tanh(1.4 * (body + skin)) * v


def tom(v=1.0, f0=110):
    t = tt(0.5)
    f = f0 + f0 * 0.7 * np.exp(-t / 0.04)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.28)
    skin = butter(noise(len(t)), "band", (200, 2500)) * np.exp(-t / 0.03) * 0.5
    return np.tanh(1.3 * (body + skin)) * v


def heart(v=1.0):
    t = tt(0.6)
    out = np.zeros_like(t)
    for d, a in ((0.0, 1.0), (0.19, 0.65)):
        tau = np.clip(t - d, 0, None)
        f = 38 + 50 * np.exp(-tau / 0.04)
        out += np.where(t >= d, a * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tau / 0.13), 0)
    return np.tanh(2.0 * out) * v


def crash(dur=3.0):
    t = tt(dur)
    out = []
    for c in range(2):
        nz = butter(noise(len(t)), "high", 3500) * np.exp(-t / 1.1)
        met = np.zeros_like(t)
        for f in rng.uniform(380, 9000, 24):
            met += np.sin(2 * np.pi * f * t + rng.random() * 6.28)
        met = butter(met, "high", 2000) * np.exp(-t / 0.7) * 0.05
        out.append(nz + met)
    s = np.stack(out)
    return s / np.abs(s).max()


# ------------------------------------------------------------------ synths
def supersaw(notes, dur, cutoff=2500, voices=7, detune=0.22, a=0.05, r=0.35,
             s=0.9, d=0.4, width=0.8):
    n = int(dur * SR)
    out = np.zeros((2, n))
    for m in notes:
        f = midi(m)
        for v in range(voices):
            cents = (v - (voices - 1) / 2) / ((voices - 1) / 2) * detune * 100
            x = saw(f * 2 ** (cents / 1200), n)
            p = width * ((v / (voices - 1)) * 2 - 1)
            out += pan2(x, p)
    out = butter(out, "low", cutoff)
    env = adsr(n, a=a, d=d, s=s, r=r)
    return out * env / (len(notes) * voices) ** 0.5 * 0.5


def pluck(m, dur=0.25, bright=4000, decay=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(midi(m), n) + 0.6 * saw(midi(m) * 1.004, n)
    dark = butter(x, "low", 500)
    br = butter(x, "low", bright)
    k = np.exp(-t / 0.05)
    y = dark * (1 - k) + br * k
    return y * np.exp(-t / decay) * np.minimum(1, t / 0.003)


def bass_note(m, dur, cutoff=700):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = saw(midi(m), n) + 0.5 * saw(midi(m) * 1.007, n)
    k = np.exp(-t / 0.06)
    y = butter(x, "low", 220) * (1 - k) + butter(x, "low", cutoff * 2.2) * k
    sub = np.sin(2 * np.pi * midi(m - 12) * t)
    env = np.minimum(1, t / 0.004) * np.exp(-t / (dur * 1.4))
    return np.tanh(1.5 * (0.7 * y + 0.9 * sub)) * env


def lead_note(m, dur):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.5 * t) * np.clip((t - 0.18) / 0.2, 0, 1)
    f = midi(m) * vib
    x = np.zeros((2, n))
    for c, p in zip((-0.11, 0.0, 0.12), (-0.6, 0, 0.6)):
        x += pan2(saw(f * 2 ** (c / 12 / 8), n), p)
    x = butter(x, "low", 5200)
    env = adsr(n, a=0.012, d=0.25, s=0.75, r=0.25, hold=dur)
    return x * env * 0.45


def choir(notes, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    src = np.zeros(n)
    for m in notes:
        for c in (-0.08, 0.08):
            f = midi(m) * 2 ** (c / 12) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t + rng.random() * 6))
            src += saw(f, n)
    y = (butter(src, "band", (650, 950)) * 1.0 + butter(src, "band", (1050, 1300)) * 0.6 +
         butter(src, "band", (2600, 3100)) * 0.25)
    env = adsr(n, a=0.35, d=0.5, s=0.9, r=0.6)
    y = y * env / len(notes) ** 0.5
    return np.stack([y, np.roll(y, 300)]) * 0.9


def piano(m, dur=2.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = midi(m)
    y = np.zeros(n)
    for k in range(1, 9):
        fk = f * k * (1 + 0.0004 * k * k)
        if fk > SR / 2.2:
            break
        y += (1 / k ** 1.3) * np.sin(2 * np.pi * fk * t) * np.exp(-t * (0.9 + 0.7 * k))
    hammer = butter(noise(n), "band", (1000, 5000)) * np.exp(-t / 0.006) * 0.05
    return (y + hammer) * np.minimum(1, t / 0.002)


def bell(m, dur=2.5, index=2.5):
    t = tt(dur)
    f = midi(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * index * np.exp(-t / 0.4)
    return np.sin(2 * np.pi * f * t + mod) * np.exp(-t / 0.9) * np.minimum(1, t / 0.002)


# ------------------------------------------------------------------ fx
def braam(dur=3.5, notes=(26, 38, 45, 50, 53), major=False):
    if major:
        notes = (26, 38, 45, 50, 54)
    n = int(dur * SR)
    t = np.arange(n) / SR
    src = np.zeros((2, n))
    for m in notes:
        for c, p in ((-0.12, -0.5), (0.0, 0.0), (0.13, 0.5)):
            src += pan2(saw(midi(m) * 2 ** (c / 12 / 4), n), p)
    dark = butter(src, "low", 260)
    mid = butter(src, "low", 1200)
    bright = butter(src, "low", 4200)
    b = np.exp(-t / 0.35)
    m_ = np.clip(1 - b, 0, 1)
    y = bright * b + mid * m_ * np.exp(-t / 1.4) + dark * m_ * (1 - np.exp(-t / 1.4))
    y = np.tanh(2.2 * y / len(notes) ** 0.5)
    env = np.minimum(1, t / 0.015) * np.exp(-t / 1.6)
    sub_f = 37 + 30 * np.exp(-t / 0.12)
    sub = np.sin(2 * np.pi * np.cumsum(sub_f) / SR) * np.exp(-t / 1.3)
    return (y * env * 0.8 + pan2(sub, 0) * 0.9)


def sub_drop(dur=1.6, f0=95, f1=30):
    t = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-t / 0.35)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8) * np.minimum(1, t / 0.005)


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    nz = shaped_noise(dur, lambda u: 300 * (9000 / 300) ** (u ** 1.3), bw_oct=0.7,
                      amp_fn=lambda u: u ** 2.2)
    f = 110 * 2 ** (2.5 * u ** 1.6)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(2 + 14 * u ** 2) / SR)
    tone = (saw(f, n) + saw(f * 1.5, n) * 0.5)
    tone = butter(tone, "low", 3000) * u ** 2 * trem * 0.35
    return nz * 0.8 + pan2(tone, 0)


def whoosh(dur):
    n = int(dur * SR)
    bell_ = lambda u: np.sin(np.pi * np.clip(u, 0, 1)) ** 1.5
    nz = shaped_noise(dur, lambda u: 350 * (4500 / 350) ** np.sin(np.pi * u * 0.85),
                      bw_oct=0.8, amp_fn=lambda u: bell_(u ** 0.7))
    p = np.linspace(-0.8, 0.8, n)
    a = (p + 1) * np.pi / 4
    return np.stack([nz[0] * np.cos(a), nz[1] * np.sin(a)]) * 1.4


def reverse_cymbal(dur):
    c = crash(dur + 0.5)[:, ::-1]
    c = c[:, -int(dur * SR):]
    u = np.linspace(0, 1, c.shape[1])
    return c * u ** 2.5


def tick():
    t = tt(0.35)
    y = (np.sin(2 * np.pi * 1760 * t) + 0.5 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t / 0.05)
    y += butter(noise(len(t)), "high", 4000) * np.exp(-t / 0.008) * 0.4
    thud = np.sin(2 * np.pi * np.cumsum(70 + 60 * np.exp(-t / 0.02)) / SR) * np.exp(-t / 0.08)
    return y * 0.35 + thud * 0.55


def shimmer():
    out = np.zeros((2, int(3.0 * SR)))
    for i, (m, p) in enumerate(((86, -0.5), (93, 0.4), (98, -0.2), (105, 0.6))):
        b = bell(m, 2.6, index=1.4) * (0.9 - 0.15 * i)
        i0 = int(i * 0.045 * SR)
        out[:, i0:i0 + len(b)] += pan2(b, p)[:, :out.shape[1] - i0]
    return out * 0.5


# ------------------------------------------------------------------ reverb
def reverb(x, decay=2.8, predelay=0.02):
    n = int(decay * 1.4 * SR)
    t = np.arange(n) / SR
    irs = []
    for c in range(2):
        ir = noise(n) * np.exp(-t * 6.9 / decay)
        # high frequencies die faster
        ir = butter(ir, "low", 6000) * 0.6 + butter(ir, "low", 1800) * 0.4
        ir[:int(predelay * SR)] = 0
        irs.append(ir / np.sqrt(np.sum(ir ** 2)))
    return np.stack([signal.oaconvolve(x[c], irs[c])[:x.shape[1]] for c in range(2)])


# ------------------------------------------------------------------ arrange
def drums():
    D = TL.DRUMS
    for t, v in D["kick"]:
        big = any(abs(t - it) < 1e-3 for it, s in TL.IMPACTS if s == "huge")
        place("drums", kick(v, big), t, 0.82, rev=0.05)
    for t, v in D["snare"]:
        place("drums", snare(v), t, 0.36, pan=0.05, rev=0.25)
    for t, v in D["clap"]:
        place("drums", clap(v), t, 0.5, pan=-0.05, rev=0.3)
    for i, (t, v) in enumerate(D["hat"]):
        place("drums", hat(v * (1.0 if i % 4 == 0 else 0.7)), t, 0.28, pan=0.35)
    for t, v in D["ohat"]:
        place("drums", hat(v, True), t, 0.22, pan=-0.3, rev=0.1)
    for t, v in D["taiko"]:
        place("drums", taiko(v), t, 0.8, pan=rng.uniform(-0.2, 0.2), rev=0.35)
    for i, (t, v) in enumerate(D["tom"]):
        place("drums", tom(v, f0=150 - 12 * (i % 4)), t, 0.6, pan=0.4 - 0.25 * (i % 4), rev=0.25)
    for t, v in D["heart"]:
        place("drums", heart(v), t, 0.42, rev=0.15)


def music():
    # intro drone + dark pad
    t = tt(8.2)
    drone = butter(saw(midi(26), len(t)) + saw(midi(38) * 1.003, len(t)), "low", 180)
    drone *= np.minimum(1, t / 3.0) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.25 * t))
    drone[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
    place("pads", drone * 0.16, 0.0, rev=0.3)
    for b in range(1, 5):
        c = ["Dm", "Dm", "Bb", "C"][b - 1]
        dur = TL.BAR + (0.3 if b < 4 else -0.15)
        place("pads", supersaw(CHORDS[c], dur, cutoff=500 + 150 * b, a=0.6, r=0.4),
              TL.bar(b), 0.28 + 0.07 * b, rev=0.4)

    for b in range(5, 68):
        t0 = TL.bar(b)
        c = TL.chord_at(b)
        sec = section_of(t0)
        if sec == "break":
            continue
        # pads
        cutoff = {"title": 1400, "premise": 1600, "build1": 1200 + 400 * (b - 17),
                  "wheel": 3000, "areas": 2800, "build2": 1200 + 450 * (b - 57),
                  "finale": 3400}.get(sec, 2000)
        g = {"title": 0.8, "premise": 0.7, "build1": 0.75, "wheel": 0.9,
             "areas": 0.85, "build2": 0.8, "finale": 1.0}.get(sec, 0.8)
        dur = TL.BAR + 0.25
        if b in (20, 60):
            dur = TL.BAR * 0.75 - 0.02
        place("pads", supersaw(CHORDS[c], dur, cutoff=cutoff), t0, g, rev=0.3)
        # string ostinato (16ths)
        if b >= 6 and sec in ("title", "premise", "build1", "build2", "areas", "wheel", "finale"):
            r = ROOT[c] + 12
            pat = [r, r, r + 12, r, r + 7, r, r + 12, r + 7] * 2
            nsteps = 16 if b not in (20, 60) else 12
            for i in range(nsteps):
                acc = 1.0 if i % 4 == 0 else 0.7
                place("keys", pluck(pat[i], 0.2, bright=2600, decay=0.07) * acc,
                      t0 + i * TL.STEP, 0.21, pan=-0.35, rev=0.15)
        # arp (16ths, chord tones over two octaves)
        if (sec == "premise" and b >= 13) or sec in ("wheel", "areas", "finale"):
            tones = TONES[c]
            seq = tones + [x + 12 for x in tones] + [tones[2] + 12, tones[1] + 12, tones[0] + 12,
                                                      tones[2], tones[1], tones[0]]
            seq = (seq * 2)[:16]
            octv = 12 if sec == "finale" else 0
            for i in range(16):
                place("keys", pluck(seq[i] + octv, 0.22, bright=5200, decay=0.09),
                      t0 + i * TL.STEP, 0.145, pan=0.4 if i % 2 else 0.2, rev=0.25)
        # bass
        if sec in ("premise", "wheel", "areas", "finale", "build1", "build2"):
            r = ROOT[c]
            if sec in ("premise", "build1", "build2"):
                steps = [0, 2, 4, 6, 8, 10, 12, 14]
            else:
                steps = [0, 2, 3, 4, 6, 8, 10, 11, 12, 14]
            if b in (20, 60):
                steps = [s for s in steps if s < 12]
            for s in steps:
                m = r + (12 if s in (6, 14) else 0)
                place("bass", bass_note(m, TL.STEP * 1.8), t0 + s * TL.STEP, 0.5)
        # choir in the finale and the last two areas
        if sec == "finale" or (sec == "areas" and b >= 45):
            place("pads", choir([n + 12 for n in CHORDS[c][1:4]], TL.BAR + 0.3), t0,
                  0.55 if sec == "finale" else 0.4, rev=0.5)

    # lead hook
    hook = HOOK
    for start_bar, octv, g in ((33, 0, 0.5), (45, 12, 0.42), (61, 12, 0.55)):
        nbars = 6 if start_bar == 61 else 8
        for beat, m, d in hook:
            if beat >= nbars * 4:
                continue
            place("lead", lead_note(m + octv, d * TL.BEAT * 0.95),
                  TL.bar(start_bar) + beat * TL.BEAT, g, rev=0.25)
            if start_bar == 61:
                place("lead", lead_note(m, d * TL.BEAT * 0.95),
                      TL.bar(start_bar) + beat * TL.BEAT, g * 0.6, rev=0.25)

    # breakdown: soft pad + piano hook
    for b in range(53, 57):
        c = TL.chord_at(b)
        place("pads", supersaw(CHORDS[c], TL.BAR + 0.6, cutoff=900, a=0.4, r=0.6), TL.bar(b), 0.42,
              rev=0.5)
        place("bass", np.sin(2 * np.pi * midi(ROOT[c]) * tt(TL.BAR)) * adsr(int(TL.BAR * SR), 0.2, 0.5, 0.8, 0.4),
              TL.bar(b), 0.35)
    for beat, m, d in HOOK:
        if beat < 16:
            place("keys", piano(m, 2.5), TL.bar(53) + beat * TL.BEAT, 0.12, pan=0.1, rev=0.6)

    # final chord stabs and the ending
    for t in TL.FINAL_STABS:
        place("pads", supersaw(CHORDS["Dm"], 0.45, cutoff=5000, a=0.005, r=0.2, s=0.5, d=0.15), t, 1.3,
              rev=0.4)
    place("pads", supersaw(CHORDS["D"], 4.0, cutoff=4200, a=0.01, r=2.5, s=0.7, d=1.2), TL.FINAL_HIT,
          1.2, rev=0.6)
    place("pads", choir([62, 66, 69, 74], 4.0), TL.FINAL_HIT, 0.7, rev=0.7)
    # countdown hits
    for i, t in enumerate(TL.COUNTDOWN):
        place("pads", supersaw([m + i * 2 for m in CHORDS["C"]], 0.42, cutoff=4500, a=0.004, r=0.15,
                               s=0.4, d=0.12), t, 1.1, rev=0.4)


HOOK = [
    (0, 74, 1), (1, 69, .5), (1.5, 74, .5), (2, 77, 1), (3, 76, .5), (3.5, 74, .5),
    (4, 74, 1), (5, 70, .5), (5.5, 74, .5), (6, 77, 1.5), (7.5, 79, .5),
    (8, 81, 1.5), (9.5, 79, .5), (10, 77, 1), (11, 72, 1),
    (12, 76, 1), (13, 79, 1), (14, 76, 1), (15, 72, 1),
    (16, 74, 1), (17, 69, .5), (17.5, 74, .5), (18, 77, 1), (19, 81, 1),
    (20, 82, 1.5), (21.5, 81, .5), (22, 77, 1), (23, 74, 1),
    (24, 81, 1), (25, 77, .5), (25.5, 81, .5), (26, 84, 1.5), (27.5, 81, .5),
    (28, 79, 1), (29, 76, 1), (30, 79, 1), (31, 72, .5), (31.5, 76, .5),
]


def section_of(t):
    for name, a, b in TL.SECTIONS:
        if a <= t < b:
            return name
    return TL.SECTIONS[-1][0]


def sfx():
    for t, size in TL.IMPACTS:
        g = {"huge": 1.0, "big": 0.75, "med": 0.6, "small": 0.45, "soft": 0.4}[size]
        if size == "huge":
            place("sfx", braam(4.0, major=(t == TL.FINAL_HIT)), t, 0.9, rev=0.45)
            place("sfx", crash(4.0), t, 0.55, rev=0.3)
            place("sfx", sub_drop(2.2, 110, 28), t, 0.8)
        elif size == "soft":
            place("sfx", sub_drop(2.0, 70, 30), t, 0.6)
            place("sfx", crash(3.0) * 0.4, t, 0.3, rev=0.6)
        else:
            place("sfx", crash(2.5 if size == "big" else 1.6), t, 0.42 * g + 0.08, rev=0.25)
            place("sfx", sub_drop(1.2, 90, 32), t, 0.55 * g)
            place("sfx", taiko(1.0), t, 0.45 * g, rev=0.4)
            if size == "big":
                place("sfx", braam(1.6), t, 0.32, rev=0.35)
    for t0, t1 in TL.WHOOSHES:
        dur = (t1 - t0) + 0.25
        place("sfx", whoosh(dur), t0, 0.32, rev=0.2)
    for t0, t1 in TL.RISERS:
        place("sfx", riser(t1 - t0), t0, 0.42, rev=0.25)
    for t0, t1 in TL.REVERSE_CYMBALS:
        place("sfx", reverse_cymbal(t1 - t0), t0, 0.45, rev=0.2)
    for t in TL.TICKS:
        place("sfx", tick(), t, 0.5, pan=0.25, rev=0.2)
    for t in TL.SHIMMERS:
        place("sfx", shimmer(), t, 0.4, rev=0.5)
    for i, t in enumerate(TL.STABS):
        m = [62, 65, 69, 74, 77, 81, 86][i]
        place("sfx", bell(m, 1.6, index=3.0), t, 0.28, pan=-0.6 + 0.2 * i, rev=0.5)
        place("sfx", tom(0.9, f0=90 + 8 * i), t, 0.45, rev=0.3)


def sidechain_env():
    env = np.ones(N, np.float32)
    t = np.arange(int(0.35 * SR)) / SR
    shape = 1 - 0.62 * np.exp(-t / 0.11) * np.minimum(1, t / 0.004 + 0.3)
    for k in TL.KICKS:
        sec = section_of(k)
        if sec not in ("wheel", "areas", "finale", "build1", "build2", "premise"):
            continue
        depth = 1.0 if sec in ("wheel", "areas", "finale") else 0.5
        i0 = int(k * SR)
        n = min(len(shape), N - i0)
        env[i0:i0 + n] = np.minimum(env[i0:i0 + n], 1 - depth * (1 - shape[:n]))
    return env


def master():
    sc = sidechain_env()
    for k in ("pads", "bass", "keys"):
        BUSES[k] *= sc
    mix = (BUSES["drums"] * 0.30 + BUSES["bass"] * 0.42 + BUSES["pads"] * 0.50 +
           BUSES["keys"] * 1.0 + BUSES["lead"] * 0.70 + BUSES["sfx"] * 0.50)
    mix = butter(mix, "high", 28)
    mix = mix + 0.33 * butter(mix, "high", 2500)   # ~+2.5 dB presence shelf
    mix += reverb(BUSES["rev"].astype(np.float64), 3.0) * 0.22

    # pre-drop silences: hard duck everything except tails of the reverse swells
    gate = np.ones(N)
    for a, b in TL.SILENCE:
        i0, i1 = int(a * SR), int(b * SR)
        ramp = int(0.02 * SR)
        gate[i0:i0 + ramp] = np.minimum(gate[i0:i0 + ramp], np.linspace(1, 0.08, ramp))
        gate[i0 + ramp:i1] = 0.08
    mix *= gate

    # section volume automation: keep the intro and breakdown intimate
    auto = [(0, 0.5), (7.8, 0.72), (8.0, 1.0), (103.9, 1.0), (104.2, 0.62),
            (111.9, 0.75), (112.0, 1.0), (TL.DURATION, 1.0)]
    ts = np.arange(N) / SR
    mix *= np.interp(ts, [a for a, _ in auto], [g for _, g in auto])
    mix *= 1.9   # drive into the glue compressor / limiter

    # glue compressor (stereo linked, RMS)
    lvl = np.sqrt(uniform_filter1d((mix ** 2).mean(0), int(0.02 * SR)) + 1e-9)
    db = 20 * np.log10(lvl)
    thr, ratio = -18.0, 2.5
    gr = np.where(db > thr, (db - thr) * (1 - 1 / ratio), 0.0)
    gr = signal.sosfilt(signal.butter(1, 6 / (SR / 2), output="sos"), gr)
    mix *= 10 ** (-gr / 20)

    # brickwall-ish lookahead limiter
    peak = np.abs(mix).max(0)
    look = int(0.004 * SR)
    pk = maximum_filter1d(peak, size=2 * look + 1)
    ceiling = 0.89
    g = np.minimum(1.0, ceiling / (pk + 1e-9))
    g = uniform_filter1d(g, look)
    g = np.minimum(g, ceiling / (pk + 1e-9) * 1.05)
    mix *= g
    a = np.abs(mix)
    knee = 0.8
    mix = np.where(a < knee, mix, np.sign(mix) * (knee + (ceiling - knee) * np.tanh((a - knee) / (ceiling - knee))))

    # fade the tail
    tail = int(1.2 * SR)
    mix[:, -tail:] *= np.linspace(1, 0, tail) ** 2
    mix *= 0.89 / np.abs(mix).max()
    return mix


def main(out="build/audio.wav"):
    drums()
    music()
    sfx()
    mix = master()
    wavfile.write(out, SR, (mix.T * 32767).astype(np.int16))
    rms = np.sqrt((mix ** 2).mean())
    print(f"wrote {out}: {mix.shape[1] / SR:.1f}s peak={np.abs(mix).max():.3f} rms={20 * np.log10(rms):.1f} dBFS")


if __name__ == "__main__":
    main(*sys.argv[1:])
