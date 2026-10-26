"""逐帧渲染与编码。

  python3 render.py stills 18 33 60            # 输出单帧 PNG 到 build/
  python3 render.py sheet 44 56 12              # 12 帧缩略联系表 build/sheet_44_56.png
  python3 render.py video --jobs 4              # 多进程分段渲染 → build/video_noaudio.mp4
  python3 render.py mux build/score.wav out.mp4 # 混入配乐
"""
import argparse
import os
import subprocess
import sys
import time
from multiprocessing import Pool

import cv2
import numpy as np

from engine import Frame, finish, hit_level
from timeline import DURATION, FPS, GAPS, W, H
import scenes1 as S1

try:
    import scenes2 as S2
except ImportError:  # 开发期
    S2 = None

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")


def scene_fns():
    fns = [S1.s_intro, S1.s_ignite, S1.s_title, S1.s_ch1, S1.s_vessels, S1.s_hippo, S1.s_synapse, S1.s_network]
    if S2 is not None:
        fns += [S2.s_ch2, S2.s_messenger, S2.s_bbb, S2.s_bdnf, S2.s_climax, S2.s_outro, S2.s_refs]
    return fns


def render(t):
    fr = Frame(t)
    for fn in scene_fns():
        fn(fr, t)
    lk = fr.look
    lk["flash"] += hit_level(t, 0.07) ** 1.5 * 0.4
    lk["bloom"] *= 1 + 0.6 * hit_level(t, 0.35)
    lk["exposure"] *= 1 + 0.2 * hit_level(t, 0.15)
    for a, b in GAPS:
        if a <= t < b:
            lk["exposure"] *= max(0.0, 1 - (t - a) / 0.06)
    return finish(fr)


def _segment(args):
    i, f0, f1, crf = args
    out = os.path.join(BUILD, f"seg_{i:03d}.mp4")
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", str(crf),
           "-pix_fmt", "yuv420p", "-g", str(FPS * 2), "-bf", "2", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    t0 = time.time()
    for f in range(f0, f1):
        p.stdin.write(render(f / FPS).tobytes())
    p.stdin.close()
    p.wait()
    return i, out, time.time() - t0


def video(jobs, crf, start, end, segs):
    os.makedirs(BUILD, exist_ok=True)
    f_start, f_end = int(round(start * FPS)), int(round(end * FPS))
    edges = np.linspace(f_start, f_end, segs + 1).astype(int)
    tasks = [(i, edges[i], edges[i + 1], crf) for i in range(segs)]
    t0 = time.time()
    outs = {}
    with Pool(jobs) as pool:
        for i, out, dt in pool.imap_unordered(_segment, tasks):
            outs[i] = out
            print(f"segment {i} done in {dt:.0f}s  (elapsed {time.time() - t0:.0f}s)", flush=True)
    lst = os.path.join(BUILD, "segments.txt")
    with open(lst, "w") as f:
        for i in range(segs):
            f.write(f"file '{outs[i]}'\n")
    out = os.path.join(BUILD, "video_noaudio.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", out],
                   check=True)
    print("wrote", out, f"total {time.time() - t0:.0f}s")


def mux(audio, out):
    src = os.path.join(BUILD, "video_noaudio.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-i", audio, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", out],
                   check=True)
    print("wrote", out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd")
    ap.add_argument("args", nargs="*")
    ap.add_argument("--jobs", type=int, default=os.cpu_count())
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=DURATION)
    ap.add_argument("--segs", type=int, default=16)
    a = ap.parse_args()
    os.makedirs(BUILD, exist_ok=True)
    if a.cmd == "stills":
        for s in a.args:
            t = float(s)
            t0 = time.time()
            img = render(t)
            path = os.path.join(BUILD, f"still_{t:07.2f}.png")
            cv2.imwrite(path, img[..., ::-1])
            print(path, f"{time.time() - t0:.2f}s")
    elif a.cmd == "sheet":
        t0, t1, n = float(a.args[0]), float(a.args[1]), int(a.args[2])
        cols = 4
        rows = (n + cols - 1) // cols
        sw, sh = W // 4, H // 4
        sheet = np.zeros((rows * sh, cols * sw, 3), np.uint8)
        for k, t in enumerate(np.linspace(t0, t1, n)):
            img = cv2.resize(render(float(t)), (sw, sh), interpolation=cv2.INTER_AREA)
            cv2.putText(img, f"{t:.2f}", (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
            sheet[(k // cols) * sh:(k // cols + 1) * sh, (k % cols) * sw:(k % cols + 1) * sw] = img
        path = os.path.join(BUILD, f"sheet_{t0:g}_{t1:g}.png")
        cv2.imwrite(path, sheet[..., ::-1])
        print(path)
    elif a.cmd == "video":
        video(a.jobs, a.crf, a.start, a.end, a.segs)
    elif a.cmd == "mux":
        mux(a.args[0], a.args[1])
    else:
        sys.exit("unknown command")


if __name__ == "__main__":
    main()
