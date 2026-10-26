"""Procedural "epic trailer" score for The Brain That Changes Itself.

120 BPM, D minor, 62 bars (124 s). Every drum hit, impact, riser and note is
written to build/events.json so the visuals can lock to the exact same grid.

    python3 music.py            -> build/score.wav + build/events.json
"""
import json
import os

import numpy as np
import scipy.signal as sg
from scipy.ndimage import maximum_filter1d

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "build")
os.makedirs(OUT, exist_ok=True)

SR = 44100
BPM = 120
BEAT = 60.0 / BPM
BAR = 4 * BEAT
TL = json.load(open(os.path.join(HERE, "timeline.json"), encoding="utf-8"))
LEN = TL["duration"]
N = int(SR * (LEN + 1.0))
rng = np.random.default_rng(20070315)


def T(bar, beat=0.0):
    return bar * BAR + beat * BEAT


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


# ----------------------------------------------------------------- buses
BUSES = ["drums", "taiko", "bass", "ost", "pad", "lead", "braam", "fx", "pluck", "tick"]
bus = {k: np.zeros((2, N)) for k in BUSES}
sends = {k: np.zeros((2, N)) for k in ("room", "hall")}
EV = {k: [] for k in ("kick", "snare", "taiko", "hat", "crash", "impact", "braam",
                      "riser", "whoosh", "ost", "lead", "bass", "glint", "tom", "tick",
                      "heart", "zap", "pluck", "shimmer")}


def place(name, t, sig, pan=0.0, gain=1.0, room=0.0, hall=0.0):
    i0 = int(round(t * SR))
    if sig.ndim == 1:
        a = np.cos((pan + 1) * np.pi / 4)
        b = np.sin((pan + 1) * np.pi / 4)
        st = np.vstack([sig * a * 1.4142, sig * b * 1.4142])
    else:
        st = sig
    st = st * gain
    if i0 < 0:
        st = st[:, -i0:]
        i0 = 0
    n = min(st.shape[1], N - i0)
    if n <= 0:
        return
    bus[name][:, i0:i0 + n] += st[:, :n]
    if room:
        sends["room"][:, i0:i0 + n] += st[:, :n] * room
    if hall:
        sends["hall"][:, i0:i0 + n] += st[:, :n] * hall


# ----------------------------------------------------------------- dsp
def tt(dur):
    return np.arange(int(dur * SR)) / SR


def saw(freq, n, phase=0.0):
    dt = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) / SR
    ph = (phase + np.cumsum(dt)) % 1.0
    s = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]
    s[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]
    s[m] -= x * x + x + x + 1
    return s


def sine(freq, n, phase=0.0):
    dt = np.broadcast_to(np.asarray(freq, dtype=float), (n,)) / SR
    return np.sin(2 * np.pi * (phase + np.cumsum(dt)))


def noise(n):
    return rng.standard_normal(n)


def lp(x, fc, order=2):
    fc = min(fc, SR * 0.45)
    return sg.sosfilt(sg.butter(order, fc / (SR / 2), output="sos"), x)


def hp(x, fc, order=2):
    return sg.sosfilt(sg.butter(order, fc / (SR / 2), "high", output="sos"), x)


def bp(x, lo, hi, order=2):
    hi = min(hi, SR * 0.45)
    return sg.sosfilt(sg.butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos"), x)


def tv_lp(x, fc, block=256):
    """Time-varying 2-pole lowpass; fc is an array the length of x."""
    y = np.zeros_like(x)
    zi = np.zeros((1, 2))
    for i in range(0, len(x), block):
        f = float(np.clip(fc[min(i + block // 2, len(x) - 1)], 30, SR * 0.45))
        sos = sg.butter(2, f / (SR / 2), output="sos")
        y[i:i + block], zi = sg.sosfilt(sos, x[i:i + block], zi=zi)
    return y


def tv_bp(x, fc, q=2.0, block=256):
    y = np.zeros_like(x)
    zi = np.zeros((1, 2))
    for i in range(0, len(x), block):
        f = float(np.clip(fc[min(i + block // 2, len(x) - 1)], 60, SR * 0.4))
        b, a = sg.iirpeak(f / (SR / 2), q)
        sos = sg.tf2sos(b, a)
        y[i:i + block], zi = sg.sosfilt(sos, x[i:i + block], zi=zi)
    return y


def env_ad(n, a, d, curve=4.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-6), np.exp(-(t - a) * curve / max(d, 1e-6)))
    return e


def adsr(n, a, d, s, r, gate):
    t = np.arange(n) / SR
    e = np.ones(n) * s
    e[t < a] = t[t < a] / a
    m = (t >= a) & (t < a + d)
    e[m] = 1 - (1 - s) * (t[m] - a) / d
    m = t >= gate
    e[m] = e[min(int(gate * SR), n - 1)] * np.exp(-(t[m] - gate) / max(r, 1e-4) * 5)
    return e


# ----------------------------------------------------------------- instruments
def kick(vel=1.0, big=False):
    d = 0.7 if big else 0.45
    t = tt(d)
    f = 48 + 150 * np.exp(-t * 32) + 30 * np.exp(-t * 6)
    body = sine(f, len(t)) * np.exp(-t * (5 if big else 8))
    click = hp(noise(len(t)), 2500) * np.exp(-t * 300) * 0.5
    x = np.tanh((body + click) * 2.2) * 0.85
    return x * vel


def snare(vel=1.0, big=False):
    t = tt(0.6 if big else 0.35)
    tone = (sine(185 * (1 + 0.3 * np.exp(-t * 40)), len(t)) * 0.6 + sine(330, len(t)) * 0.25) * np.exp(-t * 22)
    nz = bp(noise(len(t)), 900, 9000) * np.exp(-t * (9 if big else 15))
    clap = np.zeros(len(t))
    for k, off in enumerate((0.0, 0.011, 0.022)):
        i = int(off * SR)
        seg = bp(noise(len(t) - i), 1000, 3500) * np.exp(-np.arange(len(t) - i) / SR * 60)
        clap[i:] += seg * (0.6 if k < 2 else 1.0)
    x = tone + nz * 0.9 + clap * (0.7 if big else 0.4)
    return np.tanh(x * 1.6) * 0.6 * vel


def hat(vel=1.0, open_=False):
    t = tt(0.35 if open_ else 0.06)
    x = hp(noise(len(t)), 7000, 4) * np.exp(-t * (9 if open_ else 70))
    return x * 0.35 * vel


def taiko(vel=1.0, pitch=1.0):
    t = tt(1.4)
    f = (62 + 70 * np.exp(-t * 18)) * pitch
    body = sine(f, len(t)) * np.exp(-t * 3.2)
    skin = bp(noise(len(t)), 120, 900) * np.exp(-t * 14) * 0.8
    slap = bp(noise(len(t)), 1500, 5000) * np.exp(-t * 60) * 0.25
    return np.tanh((body + skin + slap) * 2.0) * 0.8 * vel


def tom(pitch=110, vel=1.0):
    t = tt(0.5)
    f = pitch * (1 + 0.5 * np.exp(-t * 25))
    x = sine(f, len(t)) * np.exp(-t * 7) + bp(noise(len(t)), 200, 2000) * np.exp(-t * 25) * 0.3
    return np.tanh(x * 1.8) * 0.6 * vel


def crash(vel=1.0, dur=3.0):
    t = tt(dur)
    x = hp(noise(len(t)), 3500, 2) * np.exp(-t * 1.6)
    metal = sum(sine(f, len(t)) for f in (3120, 4370, 5410, 6890, 7930)) * 0.04 * np.exp(-t * 2.5)
    return (x * 0.5 + metal) * vel


def reverse_swell(dur, vel=1.0):
    """Reverse cymbal / reverse whoosh that ends exactly at its end time."""
    t = tt(dur)
    x = hp(noise(len(t)), 1500, 2)
    x = tv_bp(x, 600 + 7000 * (t / dur) ** 2, q=0.7)
    e = (t / dur) ** 3
    return x * e * 0.9 * vel


def riser(dur, vel=1.0):
    t = tt(dur)
    p = t / dur
    nz = tv_bp(noise(len(t)), 300 + 9000 * p ** 2.2, q=1.4) * (p ** 2.0)
    tone = sum(saw(110 * 2 ** (3.5 * p ** 1.5) * r, len(t)) for r in (1.0, 1.006, 2.0)) * 0.08 * p ** 2.4
    tone = lp(tone, 6000)
    return (nz * 0.9 + tone) * vel


def boom(vel=1.0, dur=2.6):
    t = tt(dur)
    f = 28 + 110 * np.exp(-t * 9)
    body = sine(f, len(t)) * np.exp(-t * 1.6)
    rumble = lp(noise(len(t)), 180, 4) * np.exp(-t * 2.0) * 2.0
    hit = bp(noise(len(t)), 300, 4000) * np.exp(-t * 18) * 0.9
    return np.tanh((body * 1.2 + rumble + hit) * 1.8) * 0.8 * vel


def braam(root_midi=38, dur=2.6, vel=1.0, minor=True):
    t = tt(dur)
    n = len(t)
    notes = [root_midi - 12, root_midi, root_midi + 7, root_midi + 12, root_midi + (15 if minor else 16)]
    x = np.zeros(n)
    for m in notes:
        for det in (-0.12, 0.0, 0.13):
            x += saw(mtof(m + det) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * t)), n, rng.random())
    x /= len(notes) * 3
    cut = 180 + 2600 * np.exp(-t * 2.2) * (1 - np.exp(-t * 40))
    x = tv_lp(x, cut)
    x = lp(np.tanh(x * 4) * 0.6, 2800)
    e = (1 - np.exp(-t * 60)) * np.exp(-t * 1.1)
    sub = sine(mtof(root_midi - 12), n) * np.exp(-t * 1.3) * 0.5
    return (x * e + sub * (1 - np.exp(-t * 80))) * vel


def glint(freq=2600, vel=1.0):
    t = tt(1.2)
    x = (sine(freq, len(t)) + 0.5 * sine(freq * 2.01, len(t)) + 0.25 * sine(freq * 3.03, len(t))) * np.exp(-t * 5)
    air = hp(noise(len(t)), 6000) * np.exp(-t * 30) * 0.4
    return (x * 0.18 + air * 0.25) * vel


def tick(vel=1.0):
    t = tt(0.05)
    return (sine(2100, len(t)) * 0.5 + hp(noise(len(t)), 3000) * 0.5) * np.exp(-t * 160) * 0.5 * vel


def heart(vel=1.0):
    t = tt(0.5)
    x = sine(48 + 25 * np.exp(-t * 30), len(t)) * np.exp(-t * 12)
    return np.tanh(x * 2.5) * 0.7 * vel


def zap(vel=1.0):
    t = tt(0.25)
    f = 3000 * np.exp(-t * 18) + 200
    x = np.sign(sine(f, len(t))) * 0.3 + bp(noise(len(t)), 2000, 8000) * 0.5
    return lp(x, 7000) * np.exp(-t * 20) * 0.25 * vel


def shimmer(dur=1.6, vel=1.0, seed=0):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    out = np.zeros(n)
    scale = [74, 77, 81, 84, 86, 89, 93, 96, 98]
    for k in range(18):
        st = int(r.random() * dur * 0.8 * SR)
        g = glint(mtof(r.choice(scale)), 0.35 + 0.5 * r.random())
        m = min(len(g), n - st)
        out[st:st + m] += g[:m] * (st / n + 0.2)
    return out * vel


def ost_note(midi, dur=0.16, vel=1.0, bright=1.0):
    t = tt(dur + 0.08)
    n = len(t)
    f = mtof(midi)
    x = saw(f, n, rng.random()) + saw(f * 1.004, n, rng.random()) * 0.8 + saw(f * 0.5, n) * 0.3
    x = lp(x, 900 + 2600 * bright)
    e = env_ad(n, 0.004, dur, curve=5.0)
    return x * e * 0.22 * vel


def bass_note(midi, dur, vel=1.0, bright=1.0):
    t = tt(dur)
    n = len(t)
    f = mtof(midi)
    x = saw(f, n) * 0.6 + saw(f * 1.003, n) * 0.4
    cut = 140 + (500 + 600 * bright) * np.exp(-t * 14)
    x = tv_lp(x, cut, block=128)
    sub = sine(f, n) * 0.7
    e = adsr(n, 0.004, 0.08, 0.8, 0.03, dur - 0.03)
    return np.tanh((x + sub) * 1.6) * e * 0.5 * vel


def pad_chord(midis, dur, vel=1.0, cutoff=2200, attack=0.35):
    n = int((dur + 0.6) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in midis:
        for k, det in enumerate((-0.16, -0.08, 0.0, 0.07, 0.15)):
            v = saw(mtof(m + det), n, rng.random())
            pan = (k - 2) / 2.0 * 0.8
            L += v * np.cos((pan + 1) * np.pi / 4)
            R += v * np.sin((pan + 1) * np.pi / 4)
    sc = 1.0 / (len(midis) * 5)
    L = lp(L * sc, cutoff)
    R = lp(R * sc, cutoff)
    e = adsr(n, attack, 0.5, 0.85, 0.5, dur)
    return np.vstack([L * e, R * e]) * vel * 0.9


def lead_note(midi, dur, vel=1.0):
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    vib = 1 + 0.008 * np.sin(2 * np.pi * 5.4 * t) * np.clip((t - 0.22) * 3, 0, 1)
    f = mtof(midi) * vib
    x = saw(f, n) + saw(f * 1.005, n) * 0.8 + saw(f * 0.995, n) * 0.8 + saw(f * 0.5, n) * 0.35
    cut = 900 + 3200 * (1 - np.exp(-t * 30)) * (0.55 + 0.45 * np.exp(-t * 3))
    x = tv_lp(x / 3.0, cut, block=256)
    e = adsr(n, 0.018, 0.25, 0.75, 0.25, dur)
    return np.tanh(x * 1.8) * e * 0.45 * vel


def pluck(midi, vel=1.0):
    t = tt(1.6)
    f = mtof(midi)
    mod = sine(f * 2, len(t)) * 2.2 * np.exp(-t * 6)
    x = np.sin(2 * np.pi * np.cumsum(np.full(len(t), f)) / SR + mod)
    return x * np.exp(-t * 3.2) * 0.25 * vel


# ----------------------------------------------------------------- harmony
CH = {
    "Dm": dict(bass=38, pad=[50, 62, 65, 69], ost=(50, 53, 57)),
    "Bb": dict(bass=34, pad=[46, 58, 62, 65], ost=(46, 50, 53)),
    "F": dict(bass=41, pad=[53, 60, 65, 69], ost=(53, 57, 60)),
    "C": dict(bass=36, pad=[48, 60, 64, 67], ost=(48, 52, 55)),
    "Gm": dict(bass=43, pad=[43, 55, 58, 62], ost=(55, 58, 62)),
    "A": dict(bass=33, pad=[45, 57, 61, 64], ost=(57, 61, 64)),
}
P1 = ["Dm", "Bb", "F", "C"]
P2 = ["Dm", "Bb", "Gm", "A"]
chords = (["Dm"] * 4 + P1 + P1 + P1 + P1 + P2 + P1 + P2 + ["Bb", "A"]
          + P1 + P2 + P1 + ["Dm", "Bb", "F", "A"] + P1 + P2 + ["Dm"] * 4)
assert len(chords) == 62, len(chords)

# Arrangement intensity per bar: what plays where.
SEC = {}
for b in range(62):
    if b < 4:
        s = "intro"
    elif b < 8:
        s = "title"
    elif b < 16:
        s = "groove"
    elif b < 32:
        s = "story"
    elif b < 34:
        s = "build"
    elif b < 46:
        s = "drop"
    elif b < 50:
        s = "break"
    elif b < 58:
        s = "finale"
    else:
        s = "outro"
    SEC[b] = s

# Silent gaps right before the two biggest downbeats.
GAPS = [(T(33, 3), T(34)), (T(57, 3), T(58))]


def in_gap(t):
    return any(a <= t < b for a, b in GAPS)


# ----------------------------------------------------------------- drums
def drum_hit(kind, t, vel=1.0, **kw):
    if in_gap(t):
        return
    if kind == "kick":
        place("drums", t, kick(vel, kw.get("big", False)), gain=1.0, room=0.12)
        EV["kick"].append([round(t, 4), round(vel, 3)])
    elif kind == "snare":
        place("drums", t, snare(vel, kw.get("big", False)), pan=0.0, room=0.35, hall=0.25 if kw.get("big") else 0.08)
        EV["snare"].append([round(t, 4), round(vel, 3)])
    elif kind == "hat":
        place("drums", t, hat(vel, kw.get("open_", False)), pan=0.25 * np.sin(t * 3.1), room=0.1)
    elif kind == "taiko":
        place("taiko", t, taiko(vel, kw.get("pitch", 1.0)), pan=kw.get("pan", 0.0), room=0.3, hall=0.35)
        EV["taiko"].append([round(t, 4), round(vel, 3)])
    elif kind == "tom":
        place("drums", t, tom(kw.get("pitch", 110), vel), pan=kw.get("pan", 0.0), room=0.3, hall=0.1)
        EV["tom"].append([round(t, 4), round(vel, 3)])


def big_impact(t, size=1.0, braam_root=38, with_braam=True, minor=True):
    place("fx", t, boom(size), gain=0.95, hall=0.45)
    place("fx", t, crash(0.9 * size, 4.0), pan=0.0, hall=0.4)
    if with_braam:
        place("braam", t, braam(braam_root, 3.2, 0.95 * size, minor), hall=0.4)
        EV["braam"].append([round(t, 4), size])
    EV["impact"].append([round(t, 4), size])
    EV["crash"].append([round(t, 4), size])


def crash_at(t, v=0.7):
    place("fx", t, crash(v, 3.0), pan=-0.3 if int(t) % 2 else 0.3, hall=0.25)
    EV["crash"].append([round(t, 4), v])


def whoosh_into(t, dur=1.0, v=0.8):
    place("fx", t - dur, reverse_swell(dur, v), hall=0.2)
    EV["whoosh"].append([round(t - dur, 4), round(t, 4)])


def riser_into(t0, t1, v=0.8):
    place("fx", t0, riser(t1 - t0, v), hall=0.3)
    EV["riser"].append([round(t0, 4), round(t1, 4)])


for b in range(62):
    s = SEC[b]
    t0 = T(b)
    ch = CH[chords[b]]
    if s == "intro":
        for k in range(4):
            place("tick", T(b, k), tick(0.55 + 0.25 * (k == 0)), pan=0.35 if k % 2 else -0.35, room=0.25)
            EV["tick"].append([round(T(b, k), 4), 1.0])
        place("drums", t0, heart(0.8 + 0.1 * b), room=0.2)
        place("drums", T(b, 0.4), heart(0.55 + 0.08 * b), room=0.2)
        EV["heart"] += [[round(t0, 4), 1.0], [round(T(b, 0.4), 4), 0.7]]
    elif s == "title":
        steps = [0, 8] if b < 6 else [0, 6, 8, 11, 14]
        for st in steps:
            drum_hit("taiko", T(b, st / 4), 0.9 if st in (0, 8) else 0.6, pitch=1.0 if st in (0, 8) else 1.25,
                     pan=0.0 if st in (0, 8) else (-0.4 if st % 2 else 0.4))
        if b == 7:
            for k, st in enumerate((12, 13, 14, 15)):
                drum_hit("tom", T(b, st / 4), 0.8, pitch=180 - 25 * k, pan=0.5 - 0.33 * k)
    elif s in ("groove", "story"):
        lighter = s == "story"
        for st in (0, 6, 8) + ((14,) if b % 2 else ()):
            drum_hit("kick", T(b, st / 4), 1.0 if st in (0, 8) else 0.75)
        for st in (4, 12):
            drum_hit("snare", T(b, st / 4), 0.95)
        for st in range(0, 16, 2 if lighter else 1):
            drum_hit("hat", T(b, st / 4), (0.8 if st % 4 == 2 else 0.45) * (0.9 if lighter else 1.0),
                     open_=(st == 14))
        if b % 4 == 0:
            drum_hit("taiko", t0, 0.8)
        if b % 4 == 3:
            drum_hit("taiko", T(b, 3.5), 0.6, pitch=1.2)
    elif s == "build":
        for k in range(4):
            drum_hit("kick", T(b, k), 0.9)
        if b == 32:
            for st in range(0, 16, 2):
                drum_hit("snare", T(b, st / 4), 0.45 + 0.03 * st)
        else:
            for st in range(0, 8):
                drum_hit("snare", T(b, st / 4), 0.7 + 0.02 * st)
            for k in range(8):
                drum_hit("snare", T(b, 2 + k / 8), 0.85 + 0.02 * k)
    elif s in ("drop", "finale"):
        for k in range(4):
            drum_hit("kick", T(b, k), 1.0, big=(k == 0))
        drum_hit("kick", T(b, 3.5), 0.7)
        for st in (4, 12):
            drum_hit("snare", T(b, st / 4), 1.0, big=True)
        for st in range(16):
            drum_hit("hat", T(b, st / 4), 0.85 if st % 2 == 0 else 0.5, open_=(st % 4 == 2))
        for st in (0, 6, 8, 11):
            drum_hit("taiko", T(b, st / 4), 0.85 if st in (0, 8) else 0.6, pitch=1.0 if st in (0, 8) else 1.3,
                     pan=0.0 if st in (0, 8) else 0.4 * (-1) ** st)
        if b % 2 == 1:
            for k, st in enumerate((12, 13, 14, 15)):
                if b in (45, 57) and st >= 12:
                    continue
                drum_hit("tom", T(b, st / 4), 0.85, pitch=190 - 28 * k, pan=0.6 - 0.4 * k)
    elif s == "break":
        drum_hit("kick", t0, 0.75)
        place("drums", t0, heart(0.6), room=0.3)
        place("drums", T(b, 0.4), heart(0.4), room=0.3)
        EV["heart"] += [[round(t0, 4), 0.8], [round(T(b, 0.4), 4), 0.5]]
        if b == 49:
            for k in range(16):
                drum_hit("snare", T(b, k / 4), 0.35 + 0.04 * k)
            drum_hit("taiko", T(b, 3), 0.7)
            drum_hit("taiko", T(b, 3.5), 0.8, pitch=1.2)

# ----------------------------------------------------------------- impacts, risers, whooshes
big_impact(T(4), 1.1)                    # 8 s  : shatter / "错了"
crash_at(T(8), 0.8); place("fx", T(8), boom(0.7), hall=0.4); EV["impact"].append([T(8), 0.6])
riser_into(T(6), T(8), 0.55)
whoosh_into(T(4), 1.5, 0.9)
whoosh_into(T(8), 1.0, 0.6)
for b in (16, 20, 24, 28):
    big_impact(T(b), 0.7, with_braam=(b in (16, 24)))
    whoosh_into(T(b), 1.0, 0.65)
big_impact(T(27), 0.9, braam_root=38)    # 54 s : 97 %
place("fx", T(27), sine(60 * np.exp(-tt(1.6) * 1.8) + 22, int(1.6 * SR)) * np.exp(-tt(1.6) * 1.5) * 0.9, hall=0.2)
riser_into(T(32), T(33, 3), 0.95)
whoosh_into(T(34), 0.5, 1.0)
big_impact(T(34), 1.25)                  # 68 s : DROP
for b in (36, 38, 40, 42, 44):
    big_impact(T(b), 0.75, braam_root=CH[chords[b]]["bass"], minor=chords[b] in ("Dm", "Gm"))
    whoosh_into(T(b), 0.75, 0.55)
big_impact(T(46), 0.6, with_braam=False)  # 92 s : breakdown
riser_into(T(48), T(50), 0.85)
whoosh_into(T(50), 1.0, 0.9)
big_impact(T(50), 1.2)                   # 100 s: finale
big_impact(T(54), 0.85)                  # 108 s: brain forms
riser_into(T(56), T(57, 3), 0.9)
whoosh_into(T(58), 0.5, 1.0)
big_impact(T(58), 1.35)                  # 116 s: final title
place("fx", T(58), boom(1.0, 5.0), hall=0.6)

# Shimmers where particles converge into a form
for t_, sd in ((T(5), 1), (T(7), 2), (T(54), 3), (T(58, 1), 4), (T(16), 5)):
    place("fx", t_, shimmer(1.8, 0.8, sd), hall=0.6, pan=0.0)
    EV["shimmer"].append([round(t_, 4), 1.0])

# Electric zaps where the stroke detour grows (Case 03)
for k in range(8):
    t_ = T(25, k / 2)
    place("fx", t_, zap(0.8), pan=(-1) ** k * 0.4, room=0.3)
    EV["zap"].append([round(t_, 4), 1.0])

# Text glints from the timeline
gl_scale = [86, 89, 93, 91, 98, 96]
for i, c in enumerate(TL["cues"]):
    if c.get("sfx") == "glint" and not in_gap(c["t"]):
        place("fx", c["t"], glint(mtof(gl_scale[i % len(gl_scale)]), 0.8), pan=0.3 * ((-1) ** i), hall=0.5)
        EV["glint"].append([round(c["t"], 4), 1.0])

# ----------------------------------------------------------------- tonal parts
for b in range(62):
    s = SEC[b]
    name = chords[b]
    ch = CH[name]
    t0 = T(b)
    # Pad
    if s == "intro":
        if b == 0:
            dr = pad_chord([26, 38, 45], 8.0, 0.9, cutoff=500, attack=3.0)
            place("pad", 0.0, dr, hall=0.4)
    elif s == "title":
        place("pad", t0, pad_chord(ch["pad"], BAR, 0.8, cutoff=900 + 300 * (b - 4)), hall=0.35)
    elif s in ("groove", "story", "build", "drop", "finale", "break"):
        cut = {"groove": 1600, "story": 1500, "build": 1800, "drop": 2600, "finale": 3000, "break": 1300}[s]
        if s == "build" and b == 33:
            pd = pad_chord(ch["pad"], BAR * 0.75, 0.85, cutoff=cut)
        else:
            pd = pad_chord(ch["pad"], BAR, 0.85 if s != "break" else 1.0, cutoff=cut, attack=0.08 if s in ("drop", "finale") else 0.3)
        place("pad", t0, pd, hall=0.4)
    elif s == "outro" and b == 58:
        place("pad", t0, pad_chord(CH["Dm"]["pad"] + [74], 6.0, 1.0, cutoff=2400, attack=0.02), hall=0.6)

    # Bass (8ths)
    if s in ("groove", "story", "drop", "finale", "build"):
        for k in range(8):
            tk = T(b, k / 2)
            if in_gap(tk):
                continue
            m = ch["bass"] + (12 if (s in ("drop", "finale") and k % 2 == 1) else 0)
            place("bass", tk, bass_note(m, BEAT / 2 * 0.92, 1.0, 1.2 if s in ("drop", "finale") else 0.8))
            EV["bass"].append([round(tk, 4), m])
    elif s == "outro" and b == 58:
        place("bass", t0, bass_note(26, 4.0, 1.0, 0.5))

    # Ostinato (16ths)
    if s in ("groove", "story", "build", "drop", "finale") or (s == "title" and b >= 6):
        r, t3, f5 = ch["ost"]
        pat = [r, r + 12, f5, r + 12, t3, r + 12, f5, r + 12] * 2
        for st in range(16):
            tk = T(b, st / 4)
            if in_gap(tk):
                continue
            if s == "title":
                bright = 0.1 + 0.4 * ((b - 6) * 16 + st) / 32
                vel = 0.4 + 0.5 * ((b - 6) * 16 + st) / 32
            elif s == "build":
                bright = 0.6 + 0.4 * ((b - 32) * 16 + st) / 32
                vel = 0.9
            else:
                bright = {"groove": 0.55, "story": 0.5, "drop": 0.95, "finale": 1.0}[s]
                vel = 0.95 if st % 4 == 0 else 0.75
            place("ost", tk, ost_note(pat[st], 0.13, vel, bright), pan=0.35 if st % 2 else -0.35, room=0.2, hall=0.1)
            EV["ost"].append([round(tk, 4), pat[st]])

    # Breakdown plucks
    if s == "break":
        r, t3, f5 = ch["ost"]
        arp = [r + 12, f5 + 12, t3 + 12, f5 + 12, r + 24, f5 + 12, t3 + 12, f5 + 12]
        for k in range(8):
            tk = T(b, k / 2)
            place("pluck", tk, pluck(arp[k], 0.9), pan=0.4 * np.sin(k), hall=0.5)
            EV["pluck"].append([round(tk, 4), arp[k]])

# Hero lead melody
PH1 = [[(69, 1.5), (74, .5), (77, 2)], [(77, 1), (76, 1), (74, 2)],
       [(72, 1.5), (74, .5), (72, 1), (69, 1)], [(67, 1), (69, 1), (72, 1), (76, 1)]]
PH2 = [[(74, 1.5), (76, .5), (77, 1), (81, 1)], [(81, 1.5), (79, .5), (77, 1), (74, 1)],
       [(79, 1.5), (77, .5), (74, 1), (70, 1)], [(69, 1), (73, 1), (76, 1), (81, 1)]]


def play_phrase(bar0, phrase, octave=0, vel=1.0):
    for i, barnotes in enumerate(phrase):
        beat = 0.0
        for m, d in barnotes:
            tk = T(bar0 + i, beat)
            if not in_gap(tk):
                dur = d * BEAT * 0.97
                if in_gap(tk + dur):
                    dur = max(0.05, GAPS[[a <= tk + dur < b for a, b in GAPS].index(True)][0] - tk)
                place("lead", tk, lead_note(m + octave, dur, vel), pan=0.0, hall=0.55)
                place("lead", tk, lead_note(m + octave - 12, dur, vel * 0.45), pan=0.0, hall=0.4)
                EV["lead"].append([round(tk, 4), round(dur, 4), m + octave])
            beat += d


play_phrase(34, PH1)
play_phrase(38, PH2)
play_phrase(42, PH1)
play_phrase(50, PH1, 12, 0.85)
play_phrase(54, PH2, 12, 0.85)
place("lead", T(58), lead_note(86, 3.5, 0.8), hall=0.7)
place("lead", T(58), lead_note(74, 3.5, 0.6), hall=0.6)
EV["lead"].append([T(58), 3.5, 86])

# ----------------------------------------------------------------- sidechain + mix
sc = np.ones(N)
for tk, v in EV["kick"]:
    i = int(tk * SR)
    L = int(0.22 * SR)
    x = np.arange(min(L, N - i)) / SR
    duck = 1 - 0.55 * v * np.exp(-x / 0.07)
    sc[i:i + len(x)] = np.minimum(sc[i:i + len(x)], duck)


def make_ir(sec, seed, lp_hz=7000, pre=0.015):
    r = np.random.default_rng(seed)
    n = int(sec * SR)
    t = np.arange(n) / SR
    env = 10 ** (-3 * t / sec)
    ir = np.vstack([lp(r.standard_normal(n), lp_hz), lp(r.standard_normal(n), lp_hz)]) * env
    ir[:, :int(pre * SR)] = 0
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def convolve(x, ir):
    return np.vstack([sg.oaconvolve(x[c], ir[c])[:N] for c in range(2)])


room = convolve(sends["room"], make_ir(1.1, 11, 6000)) * 0.35
hall = convolve(sends["hall"], make_ir(3.6, 12, 5000, 0.03)) * 0.42

G = {"drums": 1.0, "taiko": 0.9, "bass": 0.72, "ost": 0.55, "pad": 0.42, "lead": 0.62,
     "braam": 0.75, "fx": 0.7, "pluck": 0.6, "tick": 0.8}
mix = np.zeros((2, N))
for k, g in G.items():
    x = bus[k] * g
    if k in ("bass", "ost", "pad", "lead", "pluck"):
        x = x * sc
    mix += x
mix += room + hall * sc ** 0.5

# Fade the very end
fade_t = np.arange(N) / SR
mix *= np.clip((LEN + 0.6 - fade_t) / 3.0, 0, 1)

# Master: gain-stage on the loudest section, gentle glue, look-ahead limiter
mix = np.vstack([hp(mix[c], 28) for c in range(2)])


def sec_rms(x, a, b):
    s = x[:, int(a * SR):int(b * SR)]
    return float(np.sqrt((s ** 2).mean()))


pre_gain = 10 ** (-13.0 / 20) / sec_rms(mix, T(34), T(46))
mix *= pre_gain
drive = 1.15
mix = np.tanh(mix * drive) / np.tanh(drive)
peak = maximum_filter1d(np.max(np.abs(mix), axis=0), size=int(0.004 * SR) * 2 + 1)
ceil = 0.94
gr = np.clip(1 - ceil / np.maximum(peak, 1e-9), 0, None)
gr = maximum_filter1d(gr, size=int(0.012 * SR))
b_, a_ = sg.butter(1, 10 / (SR / 2))
gr = np.maximum(sg.filtfilt(b_, a_, gr), 0)
gr = np.maximum(gr, np.clip(1 - ceil / np.maximum(peak, 1e-9), 0, None))
print("pre_gain %.2f  max GR %.1f dB  mean GR in drop %.1f dB" % (
    pre_gain, -20 * np.log10(1 - gr.max()),
    -20 * np.log10(1 - gr[int(T(34) * SR):int(T(46) * SR)].mean())))
mix = mix * (1 - gr)
mix = np.clip(mix, -0.98, 0.98)
mix = mix[:, :int(SR * LEN)]

# ----------------------------------------------------------------- write
from scipy.io import wavfile  # noqa: E402

wavfile.write(os.path.join(OUT, "score.wav"), SR, (mix.T * 32767).astype(np.int16))

# Control-rate envelopes for the visuals (120 Hz)
CR = 120
hop = SR // CR
mono = mix.mean(axis=0)
low = lp(mono, 160, 4)
high = hp(mono, 4000, 2)


def rms_env(x):
    n = len(x) // hop
    return np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def norm(e):
    return (e / (np.percentile(e, 99.5) + 1e-9)).clip(0, 1.2)


EV["env"] = {"rate": CR,
             "all": np.round(norm(rms_env(mono)), 3).tolist(),
             "low": np.round(norm(rms_env(low)), 3).tolist(),
             "high": np.round(norm(rms_env(high)), 3).tolist()}
EV["chords"] = chords
EV["sections"] = [SEC[b] for b in range(62)]
EV["bpm"] = BPM
for k in EV:
    if isinstance(EV[k], list) and EV[k] and isinstance(EV[k][0], list):
        EV[k].sort(key=lambda e: e[0])
with open(os.path.join(OUT, "events.json"), "w") as f:
    json.dump(EV, f)
print("peak", float(np.abs(mix).max()), "rms dB", 20 * np.log10(np.sqrt((mix ** 2).mean())))
print({k: len(v) for k, v in EV.items() if isinstance(v, list)})
