"""渲染入口。

    python render.py still 75.5 [--scale 0.5] [--out x.png]     单帧
    python render.py preview 60 90 [--scale 0.5] [--fps 15]      片段预览 mp4
    python render.py full [--workers 4]                           全片 1080p30，混入配乐
"""
import argparse
import os
import subprocess
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "output")
AUDIO = os.path.join(ROOT, "music", "bgm.wav")


def _scene(scale):
    from scene import Scene
    return Scene(int(1920 * scale), int(1080 * scale))


def still(t, scale, out):
    import cv2
    sc = _scene(scale)
    t0 = time.time()
    img = sc.frame(t)
    cv2.imwrite(out, img[..., ::-1])
    print(f"{out}  ({time.time() - t0:.2f}s)")


def _encode_cmd(path, w, h, fps, crf=18, preset="medium"):
    return ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}",
            "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", preset, "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-tune", "film", path]


def chunk(args):
    t_start, t_end, fps, scale, path, crf, preset = args
    sc = _scene(scale)
    w, h = sc.R.w, sc.R.h
    p = subprocess.Popen(_encode_cmd(path, w, h, fps, crf, preset), stdin=subprocess.PIPE)
    n0, n1 = int(round(t_start * fps)), int(round(t_end * fps))
    for i in range(n0, n1):
        p.stdin.write(sc.frame(i / fps).tobytes())
    p.stdin.close()
    p.wait()
    return path


def run(t0, t1, fps, scale, out, workers, crf=18, preset="medium", audio=True):
    from multiprocessing import Pool
    tmp = os.path.join(ROOT, ".cache", "chunks")
    os.makedirs(tmp, exist_ok=True)
    # 每段 6 秒，按块并行
    edges = list(np.arange(t0, t1, 6.0)) + [t1]
    jobs = [(a, b, fps, scale, os.path.join(tmp, f"c{k:04d}.mp4"), crf, preset) for k, (a, b) in enumerate(zip(edges[:-1], edges[1:]))]
    t_start = time.time()
    with Pool(workers) as pool:
        for k, _ in enumerate(pool.imap(chunk, jobs)):
            el = time.time() - t_start
            print(f"chunk {k + 1}/{len(jobs)}  {el / 60:.1f} min", flush=True)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as f:
        for j in jobs:
            f.write(f"file '{j[4]}'\n")
    video = out if not (audio and os.path.exists(AUDIO)) else out + ".video.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", video], check=True)
    if video != out:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", video, "-ss", str(t0), "-t", str(t1 - t0), "-i", AUDIO,
                        "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart",
                        "-shortest", out], check=True)
        os.remove(video)
    for j in jobs:
        os.remove(j[4])
    print("wrote", out, f"{(time.time() - t_start) / 60:.1f} min")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("mode", choices=["still", "preview", "full"])
    ap.add_argument("t", nargs="*", type=float)
    ap.add_argument("--scale", type=float, default=None)
    ap.add_argument("--fps", type=int, default=None)
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    ap.add_argument("--out", default=None)
    ap.add_argument("--crf", type=int, default=None)
    a = ap.parse_args()
    sys.path.insert(0, HERE)
    os.makedirs(OUT, exist_ok=True)
    if a.mode == "still":
        still(a.t[0], a.scale or 1.0, a.out or os.path.join(ROOT, ".cache", f"still_{a.t[0]:.2f}.png"))
    elif a.mode == "preview":
        t0, t1 = a.t
        run(t0, t1, a.fps or 15, a.scale or 0.5, a.out or os.path.join(ROOT, ".cache", f"preview_{t0:.0f}_{t1:.0f}.mp4"),
            a.workers, crf=a.crf or 23, preset="veryfast")
    else:
        from scene import DURATION, FPS
        run(0.0, DURATION, a.fps or FPS, a.scale or 1.0, a.out or os.path.join(OUT, "mindfulness_particles.mp4"), a.workers,
            crf=a.crf or 20, preset="slow")


if __name__ == "__main__":
    main()
