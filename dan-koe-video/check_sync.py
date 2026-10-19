"""Measures audio/visual sync of the finished film.

Compares the audio onset strength (positive spectral flux) with the frame-to-
frame brightness rise of the video, and reports the lag that lines them up
best, plus the brightness jump on each scripted impact frame.

    python check_sync.py output/dan_koe_ignite.mp4
"""
import subprocess
import sys

import numpy as np

from timeline import FPS, IMPACTS, KICKS

path = sys.argv[1] if len(sys.argv) > 1 else "output/dan_koe_ignite.mp4"
w, h = 192, 108

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo",
                      "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
frames = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
lum = frames.mean((1, 2))
vis = np.maximum(np.diff(lum, prepend=lum[0]), 0)

sr = 48000
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
a = np.frombuffer(pcm, "<i2").astype(np.float32) / 32768
hop = sr // FPS
n = min(len(a) // hop, len(vis))
spec = np.abs(np.fft.rfft(a[:n * hop].reshape(n, hop) * np.hanning(hop), axis=1))
flux = np.maximum(np.diff(np.log1p(spec * 10), axis=0, prepend=0), 0).sum(1)
vis = vis[:n]


def z(x):
    return (x - x.mean()) / (x.std() + 1e-9)


lags = range(-6, 7)
corr = [np.mean(z(flux)[max(0, -l):n - max(0, l)] * z(vis)[max(0, l):n - max(0, -l)]) for l in lags]
best = list(lags)[int(np.argmax(corr))]
print("audio-onset vs brightness-rise correlation by lag (frames, + = picture later):")
print("  " + "  ".join(f"{l:+d}:{c:.2f}" for l, c in zip(lags, corr)))
print(f"best lag: {best:+d} frames ({best / FPS * 1000:+.0f} ms)")

print("impact frames (brightness jump, audio flux rank percentile):")
for t, s in IMPACTS:
    f = int(round(t * FPS))
    jump = lum[min(f + 1, len(lum) - 1)] - lum[max(f - 1, 0)]
    pct = (flux < flux[f]).mean() * 100 if f < n else float("nan")
    print(f"  t={t:6.2f}s frame {f:4d}: luma {lum[max(f - 1, 0)]:5.1f} -> {lum[min(f + 1, len(lum) - 1)]:5.1f} "
          f"({jump:+5.1f}), audio onset at {pct:4.1f}th pct")
kf = [int(round(t * FPS)) for t in KICKS if int(round(t * FPS)) < n]
print(f"mean audio flux on {len(kf)} kick frames vs all frames: {flux[kf].mean() / flux.mean():.2f}x")
