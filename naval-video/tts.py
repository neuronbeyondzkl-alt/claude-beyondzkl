"""Narration: synthesize each scene with edge-tts, align subtitle chunks to
word boundaries, and lay out the master timeline.

Outputs (in build/):
  audio/<scene>.mp3   raw TTS per scene
  narration.wav       full narration track, 48 kHz mono
  timeline.json/.js   scene start/duration + per-chunk cue times
"""
import asyncio
import json
import os
import re
import ssl
import subprocess
import sys

import numpy as np
import edge_tts
import edge_tts.communicate as _comm

# The sandbox proxy re-signs TLS; trust its bundle when present.
CA = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if os.path.exists(CA):
    _comm._SSL_CTX = ssl.create_default_context(cafile=CA)

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, "build")
AUDIO = os.path.join(BUILD, "audio")
SR = 48000

PAD_PRE, PAD_POST = 0.55, 0.95
CARD_PRE, CARD_POST, CARD_MIN = 0.7, 1.4, 3.4
END_TAIL = 3.2

KEEP = re.compile(r"[一-鿿A-Za-z0-9]")


def norm(s):
    return "".join(KEEP.findall(s))


async def synth(text, voice, rate, out_mp3):
    words = []
    for attempt in range(5):
        try:
            words.clear()
            comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
            with open(out_mp3, "wb") as f:
                async for ch in comm.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append((ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]))
            return words
        except Exception as e:  # network hiccup: back off and retry
            print(f"  retry {attempt + 1}: {e}", file=sys.stderr)
            await asyncio.sleep(2 ** attempt)
    raise RuntimeError(f"TTS failed for: {text[:20]}")


def decode(path):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def align(chunks, words, total):
    """Map each subtitle chunk to [t0, t1] using cumulative character positions."""
    bounds, acc = [], 0
    for c in chunks:
        acc += len(norm(c))
        bounds.append(acc)
    t0 = [None] * len(chunks)
    t1 = [None] * len(chunks)
    pos = 0
    for (ws, we, wt) in words:
        n = len(norm(wt))
        if n == 0:
            continue
        k = next((i for i, b in enumerate(bounds) if pos < b), len(chunks) - 1)
        if t0[k] is None:
            t0[k] = ws
        t1[k] = we
        pos += n
    # Fill any gaps (alignment drift) by interpolation.
    for i in range(len(chunks)):
        if t0[i] is None:
            t0[i] = t1[i - 1] if i else 0.0
        if t1[i] is None:
            t1[i] = t0[i + 1] if i + 1 < len(chunks) and t0[i + 1] is not None else total
    return t0, t1


async def main():
    os.makedirs(AUDIO, exist_ok=True)
    spec = json.load(open(os.path.join(HERE, "script.json"), encoding="utf-8"))
    voice, rate = spec["voice"], spec["rate"]
    scenes, clips, t = [], [], 0.0
    for i, sc in enumerate(spec["scenes"]):
        text = "".join(sc["chunks"])
        mp3 = os.path.join(AUDIO, f"{sc['id']}.mp3")
        print(f"[tts] {sc['id']}: {text[:24]}…")
        words = await synth(text, voice, rate, mp3)
        pcm = decode(mp3)
        speech = len(pcm) / SR
        card = sc.get("card", False)
        pre, post = (CARD_PRE, CARD_POST) if card else (PAD_PRE, PAD_POST)
        if i == len(spec["scenes"]) - 1:
            post = END_TAIL
        dur = max(pre + speech + post, CARD_MIN if card else 0)
        a0, a1 = align(sc["chunks"], words, speech)
        cues = [{"t0": round(pre + x, 3), "t1": round(pre + y, 3), "text": c}
                for x, y, c in zip(a0, a1, sc["chunks"])]
        scenes.append({"id": sc["id"], "theme": sc["theme"], "chapter": sc["chapter"],
                       "card": card, "start": round(t, 3), "dur": round(dur, 3), "cues": cues})
        clips.append((t + pre, pcm))
        t += dur

    total = t
    track = np.zeros(int(total * SR) + SR, dtype=np.float32)
    for start, pcm in clips:
        s = int(start * SR)
        track[s:s + len(pcm)] += pcm
    pcm16 = (np.clip(track, -1, 1) * 32767).astype("<i2").tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    os.path.join(BUILD, "narration.wav")], input=pcm16, check=True)

    tl = {"total": round(total, 3), "scenes": scenes}
    with open(os.path.join(BUILD, "timeline.json"), "w", encoding="utf-8") as f:
        json.dump(tl, f, ensure_ascii=False, indent=1)
    with open(os.path.join(BUILD, "timeline.js"), "w", encoding="utf-8") as f:
        f.write("window.TIMELINE = " + json.dumps(tl, ensure_ascii=False) + ";\n")
    print(f"[tts] total {total:.1f}s across {len(scenes)} scenes")


if __name__ == "__main__":
    asyncio.run(main())
