"""Measures audio/picture sync of the finished video.

Correlates the frame-to-frame brightness jumps of the picture with the
onset strength of the soundtrack and reports the best-matching lag, plus
the per-impact offset between each flash and its audio hit.
"""
import subprocess
import sys

import numpy as np

import timeline as TL

path = sys.argv[1] if len(sys.argv) > 1 else "dealing-with-feeling.mp4"
W, H, FPS = 192, 108, TL.FPS

raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-vf", f"scale={W}:{H}",
                      "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
luma = np.frombuffer(raw, np.uint8).reshape(-1, H, W).mean((1, 2))
vis = np.maximum(np.diff(luma, prepend=luma[0]), 0)

SR = 48000
pcm = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                      "-f", "s16le", "-"], capture_output=True).stdout
a = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
hop = SR // FPS
n = min(len(a) // hop, len(vis))
env = np.sqrt((a[:n * hop].reshape(n, hop) ** 2).mean(1))
aud = np.maximum(np.diff(np.log(env + 1e-4), prepend=0), 0)
vis = vis[:n]


def z(x):
    return (x - x.mean()) / (x.std() + 1e-9)


lags = range(-6, 7)
cc = [float(np.mean(z(vis) * np.roll(z(aud), L))) for L in lags]
best = list(lags)[int(np.argmax(cc))]
print(f"frames: {n}  best lag: {best:+d} frames ({best / FPS * 1000:+.0f} ms)")
print("xcorr:", " ".join(f"{L:+d}:{c:.2f}" for L, c in zip(lags, cc)))

offs = []
for ti, size in TL.IMPACTS:
    f0 = int(round(ti * FPS))
    if f0 + 3 >= n:
        continue
    v = f0 - 2 + int(np.argmax(vis[f0 - 2:f0 + 3]))
    s = f0 - 2 + int(np.argmax(aud[f0 - 2:f0 + 3]))
    offs.append(v - s)
offs = np.array(offs)
print(f"impacts checked: {len(offs)}  flash-minus-hit offset (frames): "
      f"mean {offs.mean():+.2f}, |max| {np.abs(offs).max()}, exact {np.mean(offs == 0) * 100:.0f}%")
