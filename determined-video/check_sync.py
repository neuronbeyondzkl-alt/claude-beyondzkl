"""Measure how well picture and sound line up on the big hits.

For every impact / layer hit in timeline.py it finds the frame where the
picture brightens the most and the frame where the audio onset is
strongest, then prints both offsets from the planned time.

    python3 check_sync.py build/determined_master.mp4
"""
import subprocess
import sys

import numpy as np

import timeline as TL

FPS = TL.FPS


def video_luma(path):
    w, h = 192, 108
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={w}:{h},format=gray",
                          "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h * w).mean(axis=1)


def audio_onsets(path):
    sr = 48000
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vn", "-ac", "1", "-ar", str(sr),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    x = np.frombuffer(raw, "<i2").astype(float) / 32768
    hop = sr // FPS
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    spec = np.abs(np.fft.rfft(fr * np.hanning(hop), axis=1))
    freqs = np.fft.rfftfreq(hop, 1 / sr)
    low = spec[:, (freqs > 25) & (freqs < 220)]       # body of booms, taiko, thuds; ignores whooshes
    flux = np.maximum(0, np.diff(np.log1p(low * 10), axis=0)).sum(axis=1)
    return np.concatenate([[0], flux])


def main(path):
    luma = video_luma(path)
    flux = audio_onsets(path)
    dl = np.concatenate([[0], np.diff(luma)])
    rows = []
    for kind, times in (("impact", TL.IMPACTS), ("hit", sorted(TL.HITS))):
        for t in times:
            f0 = int(round(t * FPS))
            lo, hi = max(0, f0 - 4), min(len(dl), f0 + 5)
            fv = lo + int(np.argmax(dl[lo:hi]))
            fa = lo + int(np.argmax(flux[lo:hi]))
            rows.append((kind, t, (fv - f0) * 1000 / FPS, (fa - f0) * 1000 / FPS, (fv - fa) * 1000 / FPS))
    print(f"{'kind':7s} {'time':>7s} {'video':>8s} {'audio':>8s} {'v-a':>8s}   (ms)")
    for k, t, v, a, d in rows:
        print(f"{k:7s} {t:7.2f} {v:8.0f} {a:8.0f} {d:8.0f}")
    d = np.array([r[4] for r in rows])
    print(f"\n{len(rows)} sync points · |picture - sound| mean {np.abs(d).mean():.0f} ms · max {np.abs(d).max():.0f} ms"
          f" · within one frame: {(np.abs(d) <= 1000 / FPS + 1).mean() * 100:.0f}%")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "build/determined_master.mp4")
