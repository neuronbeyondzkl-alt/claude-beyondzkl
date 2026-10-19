"""一键生成《时间之脑》：配乐 → 多进程逐帧渲染 → 拼接并封装为 MP4。

用法：
    python3 make_video.py                      # 完整 1080p 成片
    python3 make_video.py --start 24 --end 40  # 只渲染一段预览
"""
import argparse
import multiprocessing as mp
import os
import shutil
import subprocess
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, "cache")
FONT_DIR = os.path.join(CACHE, "fonts")
FONTS = {
    "NotoSansSC.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf",
    "Oswald.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/oswald/Oswald%5Bwght%5D.ttf",
    "Montserrat.ttf": "https://raw.githubusercontent.com/google/fonts/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf",
}


def ensure_fonts():
    os.makedirs(FONT_DIR, exist_ok=True)
    for name, url in FONTS.items():
        path = os.path.join(FONT_DIR, name)
        if not os.path.exists(path):
            print(f"下载字体 {name} …")
            urllib.request.urlretrieve(url, path)


def render_segment(job):
    idx, f0, f1, out, crf, preset = job
    import cv2
    cv2.setNumThreads(1)
    import render
    import scenes
    import timeline as TL
    R = render.Renderer(CACHE, FONT_DIR)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{render.W}x{render.H}", "-r", str(TL.FPS), "-i", "-",
           "-c:v", "libx264", "-preset", preset, "-crf", str(crf), "-pix_fmt", "yuv420p",
           "-threads", "1", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fr in range(f0, f1):
        img = R.render(scenes.state(fr / TL.FPS))
        p.stdin.write(img.tobytes())
    p.stdin.close()
    p.wait()
    return idx, f1 - f0


def main():
    import timeline as TL
    ap = argparse.ArgumentParser()
    ap.add_argument("--start", type=float, default=0.0)
    ap.add_argument("--end", type=float, default=TL.DURATION)
    ap.add_argument("--workers", type=int, default=os.cpu_count())
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--preset", default="slow")
    ap.add_argument("--out", default=os.path.join(HERE, "output", "the-temporal-brain.mp4"))
    a = ap.parse_args()

    ensure_fonts()
    os.makedirs(os.path.dirname(a.out), exist_ok=True)
    wav = os.path.join(HERE, "output", "score.wav")
    if not os.path.exists(wav):
        import music
        t = time.time()
        music.render(wav)
        print(f"配乐完成 {time.time() - t:.0f}s")
    import geometry
    geometry.load(CACHE)

    f0, f1 = int(round(a.start * TL.FPS)), int(round(a.end * TL.FPS))
    tmp = os.path.join(CACHE, "segments")
    shutil.rmtree(tmp, ignore_errors=True)
    os.makedirs(tmp)
    n_seg = max(1, a.workers * 4)
    step = -(-(f1 - f0) // n_seg)
    jobs = [(i, s, min(s + step, f1), os.path.join(tmp, f"seg{i:03d}.mp4"), a.crf, a.preset)
            for i, s in enumerate(range(f0, f1, step))]
    t = time.time()
    done = 0
    with mp.Pool(a.workers) as pool:
        for idx, n in pool.imap_unordered(render_segment, jobs):
            done += n
            el = time.time() - t
            print(f"  {done}/{f1 - f0} 帧  {done / el:.1f} fps  剩余约 {(f1 - f0 - done) / max(done / el, 1e-3) / 60:.1f} min",
                  flush=True)
    lst = os.path.join(tmp, "list.txt")
    with open(lst, "w") as fh:
        for j in jobs:
            fh.write(f"file '{j[3]}'\n")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-ss", f"{a.start:.3f}", "-t", f"{a.end - a.start:.3f}", "-i", wav,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k",
                    "-movflags", "+faststart", "-shortest", a.out], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f"完成：{a.out}  用时 {(time.time() - t) / 60:.1f} min")


if __name__ == "__main__":
    main()
