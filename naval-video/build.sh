#!/usr/bin/env bash
# Full pipeline: narration → music → fonts → frames → final mix.
# Needs: python3 with edge-tts + numpy, node with playwright, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
PY=${PY:-python3}
FPS=${FPS:-30}

$PY tts.py
$PY music.py
$PY fonts.py
node render.mjs --fps "$FPS" --workers "${WORKERS:-4}"

# Voice up front; the music bed ducks under it, then the whole mix is loudness-normalised.
ffmpeg -v error -y -i build/video.mp4 -i build/narration.wav -i build/bgm.wav -filter_complex "\
[1:a]aformat=channel_layouts=stereo,asplit=2[v][key];\
[2:a]volume=0.30[m];\
[m][key]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=600[bed];\
[v][bed]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart -shortest naval-wisdom.mp4
echo "→ naval-wisdom.mp4"
