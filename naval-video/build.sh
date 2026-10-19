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

# Voice up front; the music bed ducks under it. Two-pass linear loudnorm keeps that
# balance intact (single-pass dynamic mode would lift the music in every pause).
ffmpeg -v error -y -i build/narration.wav -i build/bgm.wav -filter_complex "\
[0:a]aformat=channel_layouts=stereo,asplit=2[v][key];\
[1:a]volume=0.12[m];\
[m][key]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=600[bed];\
[v][bed]amix=inputs=2:duration=first:normalize=0[a]" -map "[a]" -c:a pcm_s24le build/mix.wav
# Reach -16 LUFS with one static gain plus a peak limiter. (loudnorm's linear mode
# falls back to dynamic AGC whenever the gain would overshoot true peak, and that
# lifts the music in every pause.)
I=$(ffmpeg -hide_banner -i build/mix.wav -af "loudnorm=print_format=json" -f null - 2>&1 | sed -n 's/.*"input_i" : "\([^"]*\)".*/\1/p')
GAIN=$(awk -v i="$I" 'BEGIN{printf "%.2f", -16 - i}')
ffmpeg -v error -y -i build/video.mp4 -i build/mix.wav \
  -af "volume=${GAIN}dB,alimiter=limit=0.84:attack=3:release=60:level=false,aresample=48000" \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -tune animation -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -shortest naval-wisdom.mp4
echo "→ naval-wisdom.mp4 (gain ${GAIN} dB)"
