"""Procedural ambient bed: slow detuned pad chords, a soft bass, sparse
pentatonic bells, and a synthetic convolution reverb. Writes build/bgm.wav
sized to the timeline."""
import json
import os
import subprocess

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
SR = 48000
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


# D major colour: Dmaj9 → Bm9 → Gmaj7 → Asus(add6), each held 9 s.
CHORDS = [
    [50, 57, 61, 64, 66],
    [47, 54, 57, 61, 62],
    [43, 50, 54, 59, 62],
    [45, 50, 52, 57, 59],
]
HOLD = 9.0
BELLS = [74, 76, 78, 81, 83, 86]  # D-major pentatonic, upper register


def pad_voice(f, n, phase_seed):
    t = np.arange(n) / SR
    out = np.zeros((n, 2))
    for ch, cents in enumerate((-5, 5)):
        ff = f * 2 ** (cents / 1200)
        ph = rng.uniform(0, 2 * np.pi, 3) + phase_seed
        # gentle slow tremolo keeps the pad breathing
        trem = 1 + 0.08 * np.sin(2 * np.pi * 0.11 * t + ph[0])
        out[:, ch] = trem * (np.sin(2 * np.pi * ff * t + ph[1])
                             + 0.18 * np.sin(2 * np.pi * 2 * ff * t + ph[2])
                             + 0.05 * np.sin(2 * np.pi * 3 * ff * t))
    return out


def envelope(n, attack, release):
    e = np.ones(n)
    a, r = min(int(attack * SR), n // 2), min(int(release * SR), n // 2)
    e[:a] = np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    e[-r:] = np.cos(np.linspace(0, np.pi / 2, r)) ** 2
    return e


def reverb(x, seconds=4.0):
    n_ir = int(seconds * SR)
    t = np.arange(n_ir) / SR
    ir = rng.standard_normal((n_ir, 2)) * np.exp(-t / (seconds / 5.5))[:, None]
    ir[:, 0] *= np.linspace(1, 0.9, n_ir)
    size = 1 << int(np.ceil(np.log2(len(x) + n_ir)))
    y = np.zeros((len(x) + n_ir, 2))
    for c in range(2):
        Y = np.fft.rfft(x[:, c], size) * np.fft.rfft(ir[:, c], size)
        y[:, c] = np.fft.irfft(Y, size)[: len(x) + n_ir]
    return y[: len(x)] / np.max(np.abs(y)) * np.max(np.abs(x))


def lowpass(x, cutoff):
    # one-pole smoothing, vectorised via an IIR-equivalent exponential filter in FFT
    n = len(x)
    size = 1 << int(np.ceil(np.log2(n)))
    freqs = np.fft.rfftfreq(size, 1 / SR)
    H = 1 / np.sqrt(1 + (freqs / cutoff) ** 4)
    out = np.empty_like(x)
    for c in range(x.shape[1]):
        out[:, c] = np.fft.irfft(np.fft.rfft(x[:, c], size) * H, size)[:n]
    return out


def main():
    total = json.load(open(os.path.join(BUILD, "timeline.json")))["total"] + 1.0
    N = int(total * SR)
    mix = np.zeros((N, 2))

    # Pad + bass, chords overlapping by the release so changes stay seamless.
    seg = int(HOLD * SR)
    tail = int(4.0 * SR)
    i = 0
    for start in range(0, N, seg):
        chord = CHORDS[i % len(CHORDS)]
        n = min(seg + tail, N - start)
        env = envelope(n, 3.0, min(4.5, n / SR / 2))[:, None]
        layer = np.zeros((n, 2))
        for k, m in enumerate(chord):
            layer += pad_voice(hz(m), n, k) * (0.9 if k else 1.0)
        bass = np.sin(2 * np.pi * hz(chord[0] - 12) * np.arange(n) / SR)
        layer += 0.55 * bass[:, None]
        mix[start:start + n] += layer * env * 0.10
        i += 1

    # Sparse bells with a little stereo placement.
    t = 2.0
    while t < total - 3:
        f = hz(rng.choice(BELLS))
        n = int(3.5 * SR)
        s = int(t * SR)
        n = min(n, N - s)
        tt = np.arange(n) / SR
        tone = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2.01 * f * tt)) * np.exp(-tt * 1.6)
        tone *= np.minimum(1, tt / 0.01)
        pan = rng.uniform(0.25, 0.75)
        mix[s:s + n, 0] += tone * (1 - pan) * 0.055
        mix[s:s + n, 1] += tone * pan * 0.055
        t += rng.uniform(2.2, 4.8)

    mix = lowpass(mix, 3200)
    wet = reverb(mix)
    out = 0.6 * mix + 0.55 * wet

    fade_in, fade_out = int(3 * SR), int(5 * SR)
    out[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    out[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    out = out / np.max(np.abs(out)) * 0.5

    pcm = (out * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-",
                    os.path.join(BUILD, "bgm.wav")], input=pcm, check=True)
    print(f"[music] {total:.1f}s bed written")


if __name__ == "__main__":
    main()
