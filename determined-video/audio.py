"""Procedural trailer score for the Determined video.

Every sound is synthesised with numpy/scipy. All timing comes from
timeline.py, which render.py also reads, so music, sound effects and
pictures share one beat grid.

Output: build/score.wav (48 kHz stereo) and build/envelope.npz
(per-frame loudness / low / high energy that render.py uses for the
audio-reactive glow).
"""
import os
import wave

import numpy as np
from scipy import signal

import timeline as TL

SR = 48000
N = int(TL.DURATION * SR)
OUT = os.path.join(os.path.dirname(__file__), "build")
rng = np.random.default_rng(20231017)


# ================================================================ helpers
def hz(m):
    return 440.0 * 2.0 ** ((np.asarray(m, float) - 69.0) / 12.0)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def noise(n):
    return rng.standard_normal(n)


def sos(kind, f, order=2):
    return signal.butter(order, f, btype=kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x, axis=-1)


def tv_filter(x, fc, kind="lowpass", block=256, bw=1.6):
    """Time-varying Butterworth: coefficients updated every `block` samples."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(fc[min(i + block // 2, len(x) - 1)], 25.0, SR * 0.45))
        if kind == "bandpass":
            s = sos("bandpass", [max(20.0, c / bw), min(SR * 0.47, c * bw)])
        else:
            s = sos(kind, c)
        if zi is None:
            zi = np.zeros((s.shape[0], 2))
        y[i:i + block], zi = signal.sosfilt(s, x[i:i + block], zi=zi)
    return y


def phase(f, n):
    f = np.broadcast_to(np.asarray(f, float), (n,))
    return (np.cumsum(f) / SR + rng.random()) % 1.0


def saw(f, n):
    """PolyBLEP band-limited sawtooth."""
    f = np.broadcast_to(np.asarray(f, float), (n,))
    p = phase(f, n)
    dt = np.clip(f / SR, 1e-6, 0.5)
    y = 2.0 * p - 1.0
    m = p < dt
    x = p[m] / dt[m]
    y[m] -= x + x - x * x - 1.0
    m = p > 1.0 - dt
    x = (p[m] - 1.0) / dt[m]
    y[m] -= x * x + x + x + 1.0
    return y


def sine(f, n):
    return np.sin(2 * np.pi * phase(f, n))


def env_ar(n, a, r_tau):
    t = np.arange(n) / SR
    e = np.exp(-t / r_tau)
    na = max(1, int(a * SR))
    e[:na] *= np.linspace(0, 1, na)
    return e


def env_adsr(dur, a, d, s, r):
    """Attack/decay/sustain held for `dur`, then release `r`; returns (n,)."""
    pts_t = [0, a, a + d, max(a + d, dur), max(a + d, dur) + r]
    pts_v = [0, 1, s, s, 0]
    t = tvec(pts_t[-1])
    return np.interp(t, pts_t, pts_v)


def stereo(x, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)]) * np.sqrt(2)


def soft(x, drive):
    return np.tanh(drive * x) / np.tanh(drive)


class Bus:
    def __init__(self):
        self.x = np.zeros((2, N))

    def add(self, sig, t, gain=1.0, pan=0.0):
        if sig.ndim == 1:
            sig = stereo(sig, pan)
        i0 = int(round(t * SR))
        if i0 < 0:
            sig = sig[:, -i0:]
            i0 = 0
        if i0 >= N or sig.shape[1] == 0:
            return
        n = min(sig.shape[1], N - i0)
        self.x[:, i0:i0 + n] += gain * sig[:, :n]


drums, music, sfx = Bus(), Bus(), Bus()
send_room, send_hall = Bus(), Bus()


# ================================================================ drums
def kick(v):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    f = 44 + 120 * np.exp(-t / 0.032)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.30)
    click = filt(noise(n), "highpass", 2500) * np.exp(-t / 0.004) * 0.35
    return soft(body + click, 1.8) * v


def snare(v):
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    tone = (np.sin(2 * np.pi * 182 * t) * np.exp(-t / 0.07) * 0.55
            + np.sin(2 * np.pi * 331 * t) * np.exp(-t / 0.045) * 0.3)
    nz = filt(noise(n), "bandpass", [1400, 9500]) * np.exp(-t / 0.15)
    return soft(tone + nz * 1.1, 1.3) * v


def hat(v):
    n = int(0.12 * SR)
    t = np.arange(n) / SR
    metal = sum(np.sign(np.sin(2 * np.pi * 317 * r * t)) for r in (2.0, 3.0, 4.16, 5.43, 6.79, 8.21))
    x = filt(noise(n) * 0.6 + metal * 0.12, "highpass", 7200) * np.exp(-t / 0.03)
    return x * v * 0.5


def tick(v):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    x = filt(noise(n), "bandpass", [2800, 4600]) * np.exp(-t / 0.006)
    x += np.sin(2 * np.pi * 2350 * t) * np.exp(-t / 0.012) * 0.4
    return x * v * 0.45


def taiko(v):
    n = int(1.8 * SR)
    t = np.arange(n) / SR
    f = 58 + 46 * np.exp(-t / 0.07)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.5)
    skin = filt(noise(n), "lowpass", 1100) * np.exp(-t / 0.045) * 0.9
    return soft(body * 1.1 + skin, 2.0) * v


def tom(v):
    n = int(0.7 * SR)
    t = np.arange(n) / SR
    f = 92 + 70 * np.exp(-t / 0.05)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.26)
    skin = filt(noise(n), "lowpass", 2200) * np.exp(-t / 0.03) * 0.5
    return soft(body + skin, 1.6) * v


def heart(v, f0=48):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = f0 + 26 * np.exp(-t / 0.03)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    x = filt(x, "lowpass", 180)
    return soft(x * 1.6, 1.5) * v


def crash(v, dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    out = []
    for _ in range(2):
        metal = sum(np.sign(np.sin(2 * np.pi * rng.uniform(300, 900) * r * t + rng.random() * 6))
                    for r in (1.0, 1.47, 2.13, 2.71, 3.89))
        x = filt(noise(n) + metal * 0.2, "highpass", 3800) * np.exp(-t / (dur / 3.2))
        x[: int(0.003 * SR)] *= np.linspace(0, 1, int(0.003 * SR))
        out.append(x)
    return np.stack(out) * v * 0.32


DRUM_FN = {"kick": (kick, 0.0, 1.0), "snare": (snare, 0.0, 0.62), "hat": (hat, 0.25, 0.55),
           "tick": (tick, None, 0.6), "taiko": (taiko, 0.0, 0.95), "tom": (tom, None, 0.7),
           "heart": (heart, 0.0, 0.9), "heart2": (lambda v: heart(v, 58), 0.0, 0.75)}


def render_drums():
    tick_side = 1
    for t0, inst, v in TL.DRUMS:
        fn, pan, g = DRUM_FN[inst]
        if pan is None:
            tick_side = -tick_side
            pan = 0.45 * tick_side if inst == "tick" else rng.uniform(-0.5, 0.5)
        x = fn(v)
        drums.add(x, t0, g, pan)
        if inst in ("snare", "taiko", "tom"):
            send_hall.add(x, t0, 0.35 * g, pan)
        elif inst in ("kick", "heart", "heart2"):
            send_room.add(x, t0, 0.08 * g, pan)
    for t0 in TL.CRASHES:
        c = crash(1.0)
        drums.add(c, t0, 0.9)
        send_hall.add(c, t0, 0.3)


# ================================================================ big hits
def sub_boom(v=1.0, dur=3.2):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 27 + 48 * np.exp(-t / 0.18)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9)
    burst = filt(noise(n), "lowpass", 500) * np.exp(-t / 0.12) * 0.8
    return soft(x * 1.3 + burst, 2.2) * v


def braam(root_midi, v=1.0, dur=4.0, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    notes = [root_midi - 12, root_midi, root_midi + 7, root_midi + 12]
    L = np.zeros(n)
    R = np.zeros(n)
    for k, m in enumerate(notes):
        for d in (-9, 0, 9):
            f = hz(m + d / 100.0) * (1 + 0.003 * np.sin(2 * np.pi * 5.1 * t + k))
            s = saw(f, n) * (0.9 if k < 2 else 0.55)
            pan = d / 14.0
            L += s * np.cos((pan + 1) * np.pi / 4)
            R += s * np.sin((pan + 1) * np.pi / 4)
    fc = 140 + bright * 2400 * np.minimum(1, t / 0.07) * np.exp(-np.maximum(0, t - 0.07) / 0.9)
    amp = env_ar(n, 0.025, 1.6) * (1 + 0.12 * np.sin(2 * np.pi * 7.5 * t))
    out = np.stack([tv_filter(L, fc), tv_filter(R, fc)]) * amp
    return soft(out * 0.35, 2.4) * v


def whoosh(dur=0.7, up=True):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = noise(n)
    u = t / dur
    fc = (300 * (30 ** u)) if up else (9000 * (1 / 30) ** u)
    y = tv_filter(x, fc, "bandpass", bw=1.8)
    amp = np.sin(np.pi * np.clip(u, 0, 1)) ** 2 * (u ** 0.7)
    pans = np.linspace(-0.8, 0.8, n)
    return np.stack([y * amp * np.cos((pans + 1) * np.pi / 4), y * amp * np.sin((pans + 1) * np.pi / 4)]) * 0.9


def riser(dur, root_midi=50):
    n = int(dur * SR)
    t = np.arange(n) / SR
    u = t / dur
    nz = tv_filter(noise(n), 250 * (40 ** u), "bandpass", bw=2.2) * (u ** 2.2)
    trem = 0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(4 + 28 * u ** 2) / SR)
    f = hz(root_midi) * 2 ** (2.0 * u ** 1.5)
    tone = (saw(f, n) + saw(f * 1.006, n) + saw(f * 2.0, n) * 0.5) * (u ** 2.5) * trem
    tone = tv_filter(tone, 400 + 6000 * u ** 2)
    x = nz * 0.9 + tone * 0.22
    fade = np.ones(n)
    k = int(0.004 * SR)
    fade[-k:] = np.linspace(1, 0, k)
    return x * fade


def reverse_swell(dur):
    c = crash(1.0, dur + 0.6)[:, : int(dur * SR)]
    return c[:, ::-1] * np.linspace(0, 1, c.shape[1]) ** 1.5 * 1.6


def chime(v=0.4, count=6, spread=0.45):
    n = int(2.2 * SR)
    out = np.zeros((2, n))
    pent = [74, 77, 79, 81, 84, 86, 89, 93]
    for _ in range(count):
        m = pent[rng.integers(len(pent))] + 12 * rng.integers(0, 2)
        off = int(rng.uniform(0, spread) * SR)
        t = np.arange(n - off) / SR
        x = (np.sin(2 * np.pi * hz(m) * t) + 0.3 * np.sin(2 * np.pi * hz(m) * 2.76 * t)) * np.exp(-t / 0.45)
        x[: 64] *= np.linspace(0, 1, 64)
        out[:, off:] += stereo(x, rng.uniform(-0.8, 0.8)) * rng.uniform(0.5, 1.0)
    return out * v * 0.2


def dissolve_grains(v=0.35, dur=0.9):
    n = int(dur * SR)
    out = np.zeros((2, n))
    for _ in range(70):
        g = int(rng.uniform(0.004, 0.02) * SR)
        off = int(rng.uniform(0, dur) ** 1.4 / dur ** 0.4 * SR)
        off = min(off, n - g - 1)
        x = filt(noise(g), "highpass", rng.uniform(3000, 9000)) * np.hanning(g)
        out[:, off:off + g] += stereo(x, rng.uniform(-1, 1)) * rng.uniform(0.2, 1.0)
    return out * v * (np.linspace(1, 0.2, n) ** 1.5)


def glitch(dur=0.22):
    n = int(dur * SR)
    t = np.arange(n) / SR
    step = int(SR / 64)
    f = np.repeat(rng.uniform(180, 2400, n // step + 1), step)[:n]
    sq = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    gate = (np.repeat(rng.random(n // (step // 2) + 1) > 0.35, step // 2)[:n]).astype(float)
    x = np.round((sq * 0.6 + noise(n) * 0.4) * 4) / 4 * gate
    x = filt(x, "bandpass", [300, 7000]) * np.exp(-t / (dur * 0.7))
    return stereo(x, rng.uniform(-0.6, 0.6)) * 0.55


def thud(v=0.6):
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    f = 40 + 60 * np.exp(-t / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.25)
    x += filt(noise(n), "lowpass", 900) * np.exp(-t / 0.03) * 0.4
    return soft(x, 1.8) * v


def render_sfx():
    root_of = lambda t: TL.ROOT[TL.chord_at_bar(t / TL.BAR)] + 12
    for t0 in TL.IMPACTS:
        sfx.add(sub_boom(1.0), t0, 0.95)
        send_hall.add(sub_boom(0.5), t0, 0.25)
    for t0 in TL.BRAAMS:
        root = 38 if t0 >= TL.T(60) else root_of(t0)
        b = braam(root, 1.0, 4.2 if t0 not in (TL.T(32),) else 3.0, 1.0 if t0 != TL.T(32) else 0.6)
        music.add(b, t0, 0.95 if t0 != TL.T(32) else 0.55)
        send_hall.add(b, t0, 0.35)
    for t0 in TL.HITS:
        sfx.add(whoosh(0.55), t0 - 0.5, 0.55)
        sfx.add(thud(0.7), t0, 0.7)
    for a, b in TL.RISERS:
        r = riser(b - a, 50 if b < TL.T(40) else 45)
        g = 0.75 if (b - a) > 3 else 0.5
        sfx.add(r, a, g, 0.0)
        send_hall.add(r, a, 0.25 * g)
    for a, b in ((TL.T(3), TL.T(4)), (TL.T(43), TL.T(44)), (TL.T(59), TL.T(60))):
        sfx.add(reverse_swell(b - a), a, 0.7)
    for t0 in TL.GLITCHES:
        sfx.add(glitch(), t0, 0.8)
    # text events: whoosh into slams, chime on soft entrances, grains on dissolves
    impact_times = set(round(x, 3) for x in TL.IMPACTS + TL.HITS)
    for c in TL.CUES:
        if c["style"] == "slam":
            sfx.add(whoosh(0.45), c["t0"] - 0.42, 0.45)
            if round(c["t0"], 3) not in impact_times:
                sfx.add(thud(0.55), c["t0"], 0.6)
        elif c["style"] == "assemble":
            sfx.add(chime(0.9, 14, 1.0), c["t0"] + 0.1, 0.9)
            send_hall.add(chime(0.6, 10, 1.0), c["t0"] + 0.1, 0.5)
        else:
            ch = chime(0.45, 3, 0.25)
            sfx.add(ch, c["t0"], 0.5)
            send_hall.add(ch, c["t0"], 0.4)
        if c["out"] == "dissolve":
            sfx.add(dissolve_grains(0.4), c["t1"] - 0.45, 0.5)


# ================================================================ instruments
def pluck_string(m, v, dur, bright):
    n = int((dur + 0.25) * SR)
    t = np.arange(n) / SR
    x = sum(saw(hz(m + d / 100.0), n) for d in (-7, 0, 7)) / 3
    x = filt(x, "lowpass", 700 + 3800 * bright)
    e = np.minimum(1, t / 0.004) * np.exp(-t / (0.06 + 0.06 * dur / 0.25))
    return x * e * v


def bass_note(m, v, dur):
    n = int((dur + 0.1) * SR)
    t = np.arange(n) / SR
    x = saw(hz(m), n) * 0.6 + sine(hz(m - 12), n) * 0.9
    x = filt(x, "lowpass", 420)
    e = np.minimum(1, t / 0.005) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.03)) * np.exp(-t / 0.9)
    return soft(x * e * 1.2, 1.5) * v


def pad_chord(notes, dur, v, bright=0.5, attack=0.5):
    n = int((dur + 1.2) * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for i, m in enumerate(notes):
        for d in (-11, -4, 4, 11):
            s = saw(hz(m + d / 100.0), n)
            pan = d / 13.0 * (0.6 + 0.4 * (i % 2))
            L += s * np.cos((pan + 1) * np.pi / 4)
            R += s * np.sin((pan + 1) * np.pi / 4)
    fc = 500 + 1600 * bright
    e = env_adsr(dur, attack, 0.3, 0.85, 1.1)[:n]
    e = np.pad(e, (0, n - len(e)))
    out = np.stack([filt(L, "lowpass", fc), filt(R, "lowpass", fc)]) * e
    return out * v * 0.06


FORMANTS = [(730, 1.0, 80), (1090, 0.5, 90), (2440, 0.25, 120), (3400, 0.1, 150)]


def choir_chord(notes, dur, v, attack=0.6):
    n = int((dur + 1.4) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for i, m in enumerate(notes):
        for k in range(3):
            vib = 1 + 0.004 * np.sin(2 * np.pi * (5.2 + 0.4 * k) * t + rng.random() * 6) * np.minimum(1, t / 0.6)
            src = saw(hz(m + rng.uniform(-8, 8) / 100.0) * vib, n)
            y = sum(g * filt(src, "bandpass", [f - bw, f + bw]) for f, g, bw in FORMANTS)
            pan = rng.uniform(-0.7, 0.7)
            L += y * np.cos((pan + 1) * np.pi / 4)
            R += y * np.sin((pan + 1) * np.pi / 4)
    e = env_adsr(dur, attack, 0.2, 0.9, 1.3)[:n]
    e = np.pad(e, (0, n - len(e)))
    return np.stack([L, R]) * e * v * 0.16


def piano(m, v, dur=2.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f0 = hz(m)
    x = np.zeros(n)
    for k in range(1, 11):
        fk = f0 * k * np.sqrt(1 + 0.0004 * k * k)
        if fk > SR * 0.45:
            break
        x += np.sin(2 * np.pi * fk * t + rng.random()) * (1 / k ** 1.15) * np.exp(-t * (0.9 + 0.55 * k))
    x += filt(noise(n), "bandpass", [800, 4000]) * np.exp(-t / 0.006) * 0.15
    x[:48] *= np.linspace(0, 1, 48)
    return x * v * 0.35


def lead_note(m, v, dur):
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.006 * np.sin(2 * np.pi * 5.6 * t) * np.clip((t - 0.18) / 0.3, 0, 1)
    f = hz(m) * vib
    x = saw(f, n) + saw(f * 1.004, n) * 0.8 + saw(f * 0.5, n) * 0.35
    fc = 900 + 2600 * np.minimum(1, t / 0.08) * np.exp(-t / 1.2) + 900
    x = tv_filter(x, fc)
    e = np.minimum(1, t / 0.03) * np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.12))
    return soft(x * e * 0.5, 1.8) * v


def brass_stab(notes, v):
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    x = sum(saw(hz(m), n) + saw(hz(m + 0.08), n) for m in notes)
    fc = 300 + 2600 * np.exp(-t / 0.08)
    x = tv_filter(x, fc)
    e = np.minimum(1, t / 0.008) * np.exp(-t / 0.16)
    return soft(x * e * 0.25, 2.0) * v


def drone(dur, root=26, v=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = sine(hz(root), n) * 0.7 + sine(hz(root + 12), n) * 0.35
    wind = tv_filter(noise(n), 300 + 250 * np.sin(2 * np.pi * 0.11 * t), "bandpass", bw=2.5) * 0.35
    e = np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 1.5)
    return (x + wind) * e * v


OST_PATTERN = [0, 2, 1, 2, 3, 2, 1, 2, 0, 2, 1, 2, 4, 3, 2, 1]
LEAD = [  # (bar, beat, beats, midi)
    (52, 0, 1, 69), (52, 1, 1, 74), (52, 2, 2, 77),
    (53, 0, 1, 77), (53, 1, 1, 76), (53, 2, 2, 74),
    (54, 0, 1, 72), (54, 1, 1, 77), (54, 2, 2, 81),
    (55, 0, 2, 79), (55, 2, 1, 76), (55, 3, 1, 72),
    (56, 0, 1, 74), (56, 1, 1, 77), (56, 2, 2, 81),
    (57, 0, 2, 82), (57, 2, 1, 81), (57, 3, 1, 77),
    (58, 0, 2, 79), (58, 2, 1, 76), (58, 3, 1, 79),
    (59, 0, 2, 81), (59, 2, 1, 76), (59, 3, 1, 73),
    (60, 0, 7, 74),
]
SCHOP_MEL = [
    (32, 0, 1, 69), (32, 1, 1, 74), (32, 2, 1, 77), (32, 3, 1, 76),
    (33, 0, 2, 74), (33, 2, 1, 70), (33, 3, 1, 74),
    (34, 0, 1, 72), (34, 1, 1, 69), (34, 2, 2, 77),
    (35, 0, 1, 76), (35, 1, 1, 73), (35, 2, 2, 69),
]
BREAK_MEL = [
    (36, 0, 1.5, 74), (36, 1.5, 0.5, 72), (36, 2, 2, 70),
    (37, 0, 2, 69), (37, 2, 1, 72), (37, 3, 1, 77),
    (38, 0, 1.5, 76), (38, 1.5, 0.5, 74), (38, 2, 2, 72),
    (39, 0, 3, 74), (39, 3, 1, 69),
    (40, 0, 1.5, 77), (40, 1.5, 0.5, 76), (40, 2, 2, 74),
    (41, 0, 2, 72), (41, 2, 1, 69), (41, 3, 1, 72),
    (42, 0, 1.5, 70), (42, 1.5, 0.5, 74), (42, 2, 2, 79),
    (43, 0, 2, 76), (43, 2, 2, 73),
]


def in_silence(t):
    return any(a <= t < b for a, b in TL.SILENCES)


def render_music():
    T = TL.T
    # --- drones
    music.add(stereo(drone(T(4) + 1.0, 26, 0.55)), 0.0, 1.0)
    music.add(stereo(drone(T(42) - T(36), 26, 0.45)), T(36), 1.0)
    music.add(stereo(drone(T(64) - T(60), 26, 0.5)), T(60), 1.0)

    # --- pads & choir per bar
    for bar in range(TL.BARS):
        name = TL.chord_at_bar(bar)
        notes = TL.VOICING[name]
        sec, _ = TL.section_at(T(bar))
        if sec == "intro":
            if bar == 0:
                music.add(pad_chord([n + 12 for n in TL.VOICING["Dm"][2:]], T(4) - 0.6, 0.6, 0.25, 2.5), 0, 1.0)
            continue
        dur = TL.BAR
        if bar in (23, 51):
            dur = TL.BEAT * 3     # leave the pre-drop silence clean
        if sec == "outro":
            if bar == 60:
                p = pad_chord(notes, T(63, 2) - T(60), 1.0, 0.55, 0.05)
                music.add(p, T(60), 1.0)
                send_hall.add(p, T(60), 0.5)
                c = choir_chord([n + 12 for n in notes[1:]], T(63) - T(60), 1.0, 0.4)
                music.add(c, T(60), 1.0)
                send_hall.add(c, T(60), 0.6)
            continue
        bright = {"title": 0.35, "thesis": 0.4, "chain": 0.35 + 0.04 * (bar - 12), "turtles": 0.8,
                  "drop1": 0.9, "schop": 0.35, "breakdown": 0.3, "build2": 0.4 + 0.06 * (bar - 44),
                  "final": 1.0}[sec]
        pv = 0.75 if sec in ("breakdown", "schop") else 0.9
        p = pad_chord(notes, dur, pv, bright, 0.25 if sec not in ("breakdown",) else 0.6)
        music.add(p, T(bar), 1.0)
        send_hall.add(p, T(bar), 0.35)
        choir_on = (sec in ("title", "drop1", "breakdown", "final") or (sec == "chain" and bar >= 16)
                    or (sec == "build2" and bar >= 48) or sec == "turtles")
        if choir_on:
            cv = {"title": 0.55, "chain": 0.55, "turtles": 0.7, "drop1": 0.75, "breakdown": 0.6,
                  "build2": 0.65, "final": 1.0}[sec]
            c = choir_chord([n + 12 for n in notes[1:]], dur, cv, 0.35)
            music.add(c, T(bar), 1.0)
            send_hall.add(c, T(bar), 0.55)

    # --- ostinato strings
    ost = {}
    for bar in range(6, 8):
        ost[bar] = (2, 0.35, 0.2)
    for bar in range(8, 10):
        ost[bar] = (2, 0.5, 0.3)
    for bar in range(10, 12):
        ost[bar] = (1, 0.55, 0.35)
    for bar in range(12, 22):
        ost[bar] = (1, 0.6 + 0.03 * (bar - 12), 0.35 + 0.06 * (bar - 12))
    for bar in range(22, 24):
        ost[bar] = (1, 0.9, 0.95)
    for bar in range(24, 32):
        ost[bar] = (1, 0.95, 1.0)
    for bar in range(32, 36):
        ost[bar] = (2, 0.45, 0.3)
    for bar in range(42, 44):
        ost[bar] = (2, 0.4, 0.25)
    for bar in range(44, 52):
        ost[bar] = (1, 0.55 + 0.05 * (bar - 44), 0.3 + 0.09 * (bar - 44))
    for bar in range(52, 60):
        ost[bar] = (1, 1.0, 1.0)
    for bar, (step, v, br) in ost.items():
        notes = TL.VOICING[TL.chord_at_bar(bar)]
        for s in range(0, 16, step):
            t0 = T(bar, s / 4.0)
            if in_silence(t0):
                continue
            m = notes[OST_PATTERN[s]] + 12
            acc = 1.15 if s % 4 == 0 else 0.85
            x = pluck_string(m, v * acc, 0.11 * step, br)
            pan = -0.35 if s % 2 == 0 else 0.35
            music.add(x, t0, 0.42, pan)
            send_room.add(x, t0, 0.12, pan)

    # --- bass
    for bar in range(10, 60):
        sec, _ = TL.section_at(T(bar))
        if sec == "breakdown":
            continue
        r = TL.ROOT[TL.chord_at_bar(bar)]
        if sec in ("drop1", "final"):
            pat = "x.xx.xx.x.xx.xx."
        elif sec == "schop":
            pat = "x..............."
        else:
            pat = "x.x.x.x.x.x.x.x."
        for s, ch in enumerate(pat):
            if ch != "x":
                continue
            t0 = T(bar, s / 4.0)
            if in_silence(t0):
                continue
            dur = TL.BAR * 0.9 if sec == "schop" else 0.2
            music.add(bass_note(r + 12, 0.9, dur), t0, 0.55)
    music.add(bass_note(38, 0.9, 5.5), T(60), 0.5)

    # --- brass stabs in drops
    for bar in list(range(24, 32)) + list(range(52, 60)):
        notes = [n + 12 for n in TL.VOICING[TL.chord_at_bar(bar)][1:4]]
        for s in (0, 6, 10):
            x = brass_stab(notes, 0.8 if s == 0 else 0.55)
            music.add(x, T(bar, s / 4.0), 0.5)
            send_hall.add(x, T(bar, s / 4.0), 0.2)

    # --- piano
    for bar in range(5, 8):
        notes = TL.VOICING[TL.chord_at_bar(bar)]
        for k, m in enumerate([notes[2] + 12, notes[3] + 12, notes[4] + 12, notes[3] + 12]):
            x = piano(m, 0.55)
            music.add(x, T(bar, k), 0.8, -0.2 + 0.13 * k)
            send_hall.add(x, T(bar, k), 0.45)
    for bar, beat, beats, m in SCHOP_MEL + BREAK_MEL:
        x = piano(m, 0.85, max(2.0, beats * TL.BEAT + 1.5))
        music.add(x, T(bar, beat), 0.9, 0.1)
        send_hall.add(x, T(bar, beat), 0.55)
    for bar in range(36, 44):       # left hand
        notes = TL.VOICING[TL.chord_at_bar(bar)]
        for k in range(8):
            m = notes[[0, 1, 2, 1, 3, 1, 2, 1][k]]
            x = piano(m, 0.32, 1.6)
            music.add(x, T(bar, k / 2.0), 0.8, -0.25)
            send_hall.add(x, T(bar, k / 2.0), 0.4)
    for k, m in enumerate([86, 81, 78, 74]):   # outro farewell
        x = piano(m, 0.6, 3.0)
        music.add(x, T(61, k * 1.5), 0.8)
        send_hall.add(x, T(61, k * 1.5), 0.7)

    # --- lead (final drop) with ping-pong delay
    for bar, beat, beats, m in LEAD:
        x = lead_note(m, 0.9, beats * TL.BEAT * 0.95)
        t0 = T(bar, beat)
        music.add(x, t0, 0.42)
        music.add(lead_note(m - 12, 0.6, beats * TL.BEAT * 0.95), t0, 0.22)
        send_hall.add(x, t0, 0.35)
        for k in range(1, 4):
            music.add(x * (0.33 ** k), t0 + k * 0.375, 0.42, -0.7 if k % 2 else 0.7)


# ================================================================ mix
def make_ir(sec, decay, seed):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = np.empty((2, n))
    for c in range(2):
        x = r.standard_normal(n) * np.exp(-t * 6.9 / decay)
        lo = filt(x, "lowpass", 2500)
        mix = np.exp(-t / (decay * 0.35))
        ir[c] = x * mix + lo * (1 - mix)
    ir = filt(ir, "bandpass", [120, 7500])
    pre = int(0.018 * SR)
    ir = np.concatenate([np.zeros((2, pre)), ir[:, :-pre]], axis=1)
    return ir / np.sqrt((ir ** 2).sum(axis=1, keepdims=True))


def sidechain():
    g = np.ones(N)
    t = np.arange(N) / SR
    pump_secs = {"drop1", "final", "turtles"}
    for t0, inst, v in TL.DRUMS:
        if inst != "kick":
            continue
        sec, _ = TL.section_at(t0)
        depth = 0.5 if sec in pump_secs else (0.3 if sec in ("chain", "build2") else 0.15)
        i0 = int(t0 * SR)
        i1 = min(N, i0 + int(0.45 * SR))
        tt = t[i0:i1] - t0
        e = 1 - depth * v * np.minimum(1, tt / 0.004) * np.exp(-tt / 0.13)
        g[i0:i1] = np.minimum(g[i0:i1], e)
    return g


def gate():
    g = np.ones(N)
    k = int(0.006 * SR)
    for a, b in TL.SILENCES:
        i0, i1 = int(a * SR), int(b * SR)
        g[i0:i1] = 0
        g[i0 - k:i0] = np.linspace(1, 0, k)
    return g


def main():
    os.makedirs(OUT, exist_ok=True)
    print("drums…")
    render_drums()
    print("sfx…")
    render_sfx()
    print("music…")
    render_music()
    print("reverb…")
    room = np.stack([signal.oaconvolve(send_room.x[c], make_ir(1.2, 1.0, 1)[c])[:N] for c in range(2)])
    ir_h = make_ir(4.5, 3.6, 2)
    hall = np.stack([signal.oaconvolve(send_hall.x[c], ir_h[c])[:N] for c in range(2)])

    sc = sidechain()
    mix = drums.x * 1.0 + music.x * sc * 0.85 + sfx.x * 0.9 + room * 0.5 + hall * 0.55 * (0.4 + 0.6 * sc)
    mix *= gate()
    mix = filt(mix, "highpass", 26)
    # outro fade
    t = np.arange(N) / SR
    mix *= np.clip((TL.DURATION - t) / 4.0, 0, 1) ** 1.2
    # master: normalise, glue, limit
    mix /= np.percentile(np.abs(mix), 99.95) + 1e-9
    mix = soft(mix * 0.9, 1.7)
    mix *= 0.93 / (np.abs(mix).max() + 1e-9)
    pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2").T.copy()
    path = os.path.join(OUT, "score.wav")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", path)

    # per-frame features for audio-reactive glow
    mono = mix.mean(axis=0)
    low = filt(mono, "lowpass", 150)
    high = filt(mono, "highpass", 5000)
    nf = int(TL.DURATION * TL.FPS)
    spf = SR // TL.FPS
    def frame_rms(x):
        x = x[: nf * spf].reshape(nf, spf)
        return np.sqrt((x ** 2).mean(axis=1))
    feats = {k: frame_rms(v) for k, v in (("rms", mono), ("low", low), ("high", high))}
    for k in feats:
        feats[k] = feats[k] / (np.percentile(feats[k], 98) + 1e-9)
    np.savez(os.path.join(OUT, "envelope.npz"), **feats)
    print("rms dBFS:", 20 * np.log10(np.sqrt((mix ** 2).mean()) + 1e-12))


if __name__ == "__main__":
    main()
