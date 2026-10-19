"""旁白排轨 + 生成配乐 + 闪避混音，输出 build/mix.wav（48 kHz 立体声）。

配乐全部由 numpy 合成：D 大调的慢速和弦铺底、低音、零星的钟琴音、
深色场景里的“海浪”噪声，以及每个章节开头的一声提示音；再用合成的
混响冲激响应做卷积。旁白出现时配乐自动压低（ducking）。
"""

import wave
from pathlib import Path

import numpy as np
from scipy.signal import lfilter, oaconvolve, resample_poly

from timeline import build

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"
SR = 48000

# D 大调：Dmaj9 → Bm9 → Gmaj9 → A6sus，每个和弦 8 秒
CHORDS = [
    [50, 57, 61, 64, 66],
    [47, 54, 57, 61, 62],
    [43, 50, 54, 57, 59],
    [45, 52, 54, 59, 62],
]
CHORD_LEN = 8.0


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path)) as w:
        rate = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return data, rate


def narration(scenes, n: int) -> np.ndarray:
    track = np.zeros(n, np.float32)
    for s in scenes:
        for cue, clip in zip(s.cues, s.clips):
            audio, rate = read_wav(clip)
            if rate != SR:
                g = np.gcd(SR, rate)
                audio = resample_poly(audio, SR // g, rate // g).astype(np.float32)
            a = int((s.start + cue) * SR)
            b = min(n, a + len(audio))
            track[a:b] += audio[: b - a]
    return track


def theme_curve(scenes, n: int) -> np.ndarray:
    """深色场景为 1、浅色为 0，场景之间 1.5 秒平滑过渡（用于海浪声音量）。"""
    curve = np.zeros(n, np.float32)
    for s in scenes:
        a, b = int(s.start * SR), min(n, int((s.start + s.dur) * SR))
        curve[a:b] = 1.0 if s.theme == "dark" else 0.0
    k = int(1.5 * SR)
    return np.convolve(curve, np.ones(k, np.float32) / k, mode="same")


def pad(n: int, rng) -> np.ndarray:
    t = np.arange(n, dtype=np.float64) / SR
    out = np.zeros((n, 2), np.float32)
    n_chords = int(np.ceil(n / SR / CHORD_LEN)) + 1
    for ci in range(n_chords):
        notes = CHORDS[ci % len(CHORDS)]
        c0 = ci * CHORD_LEN - 1.5
        a, b = max(0, int(c0 * SR)), min(n, int((c0 + CHORD_LEN + 3.0) * SR))
        if a >= b:
            continue
        tt = t[a:b] - c0
        env = np.sin(np.pi * np.clip(tt / (CHORD_LEN + 3.0), 0, 1)) ** 1.5
        for j, m in enumerate(notes):
            f = midi_hz(m)
            pan = 0.3 + 0.4 * (j / (len(notes) - 1))
            vib = 0.0015 * np.sin(2 * np.pi * (0.13 + 0.03 * j) * tt)
            ph = 2 * np.pi * f * tt * (1 + vib)
            tone = (np.sin(ph) + 0.22 * np.sin(2 * ph + 0.3) + 0.06 * np.sin(3 * ph + 1.1)
                    + 0.6 * np.sin(ph * 1.0025 + j))
            amp = 0.020 * env * (1.1 if j == 0 else 1.0)
            out[a:b, 0] += (tone * amp * (1 - pan)).astype(np.float32)
            out[a:b, 1] += (tone * amp * pan).astype(np.float32)
        bass = 0.05 * env * np.sin(2 * np.pi * midi_hz(notes[0] - 12) * tt)
        out[a:b] += bass[:, None].astype(np.float32)
        # 钟琴：每两秒一个和弦内音，高八度，指数衰减
        for k in range(4):
            bt = c0 + 1.5 + k * 2.0 + rng.uniform(-0.15, 0.15)
            ba, bb = int(bt * SR), int((bt + 3.0) * SR)
            if ba < 0 or bb > n:
                continue
            m = notes[rng.integers(1, len(notes))] + 12
            ttt = np.arange(bb - ba) / SR
            bell = 0.016 * np.exp(-ttt / 0.9) * (np.sin(2 * np.pi * midi_hz(m) * ttt)
                                                 + 0.3 * np.sin(2 * np.pi * midi_hz(m) * 2.01 * ttt))
            p = rng.uniform(0.25, 0.75)
            out[ba:bb, 0] += (bell * (1 - p)).astype(np.float32)
            out[ba:bb, 1] += (bell * p).astype(np.float32)
    return out


def ocean(n: int, rng, dark: np.ndarray) -> np.ndarray:
    noise = rng.standard_normal((n, 2)).astype(np.float32)
    lp = lfilter([0.02], [1, -0.98], noise, axis=0)
    lp = lfilter([0.08], [1, -0.92], lp, axis=0)
    t = np.arange(n) / SR
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / 9.0) * np.sin(2 * np.pi * t / 23.0 + 1.0)
    level = (0.010 + 0.045 * dark) * swell
    return (lp / np.std(lp) * level[:, None]).astype(np.float32)


def chimes(scenes, n: int) -> np.ndarray:
    out = np.zeros((n, 2), np.float32)
    for s in scenes[1:]:
        a = int(s.start * SR)
        tt = np.arange(int(3.0 * SR)) / SR
        bell = 0.045 * np.exp(-tt / 0.8) * (np.sin(2 * np.pi * midi_hz(86) * tt)
                                            + 0.5 * np.sin(2 * np.pi * midi_hz(93) * tt)
                                            + 0.2 * np.sin(2 * np.pi * midi_hz(86) * 2.76 * tt))
        b = min(n, a + len(bell))
        out[a:b] += bell[: b - a, None].astype(np.float32)
    return out


def reverb(x: np.ndarray, rng, seconds=2.6, wet=0.32) -> np.ndarray:
    m = int(seconds * SR)
    t = np.arange(m) / SR
    ir = rng.standard_normal((m, 2)) * np.exp(-t / 0.55)[:, None]
    ir = lfilter([0.3], [1, -0.7], ir, axis=0)
    ir /= np.sqrt(np.sum(ir ** 2, axis=0))
    y = np.stack([oaconvolve(x[:, k], ir[:, k])[: len(x)] for k in range(2)], axis=1)
    return (x * (1 - wet) + y * wet * 1.4).astype(np.float32)


def duck_gain(voice: np.ndarray) -> np.ndarray:
    hop = SR // 100
    frames = len(voice) // hop + 1
    env = np.sqrt(np.add.reduceat(voice ** 2, np.arange(0, len(voice), hop)) / hop)[:frames]
    active = (env > 0.02).astype(np.float32)
    k = 40  # 0.4 秒的平滑
    active = np.convolve(active, np.ones(k) / k, mode="same")
    gain = 1.0 - 0.55 * np.clip(active * 1.6, 0, 1)
    return np.interp(np.arange(len(voice)) / hop, np.arange(len(gain)), gain).astype(np.float32)


def main():
    scenes, total = build()
    n = int((total + 0.5) * SR)
    rng = np.random.default_rng(2024)
    voice = narration(scenes, n)
    music = pad(n, rng) + chimes(scenes, n)
    music = reverb(music, rng)
    music += ocean(n, rng, theme_curve(scenes, n))
    fade = np.ones(n, np.float32)
    fi, fo = int(2.0 * SR), int(3.0 * SR)
    fade[:fi] = np.linspace(0, 1, fi)
    fade[-fo:] = np.linspace(1, 0, fo)
    music *= (duck_gain(voice) * fade)[:, None]
    mix = music + 0.82 * voice[:, None]
    peak = np.max(np.abs(mix))
    if peak > 0.97:
        mix *= 0.97 / peak
    pcm = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
    with wave.open(str(BUILD / "mix.wav"), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(f"mix.wav {total:.1f}s  peak {peak:.2f}  music rms {np.sqrt(np.mean(music ** 2)):.4f}"
          f"  voice rms {np.sqrt(np.mean(voice[voice != 0] ** 2)):.4f}")


if __name__ == "__main__":
    main()
