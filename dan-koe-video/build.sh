#!/usr/bin/env bash
# Builds the whole film: soundtrack -> frames -> final MP4 with loudness-normalised audio.
#   bash build.sh            (about 10-15 min on 4 cores)
set -euo pipefail
cd "$(dirname "$0")"

FONT_BASE="https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/OTF/SimplifiedChinese"
mkdir -p fonts build output
for f in NotoSansCJKsc-Black.otf NotoSansCJKsc-Light.otf; do
  [ -s "fonts/$f" ] || curl -sSL -o "fonts/$f" "$FONT_BASE/$f"
done

python3 music.py
python3 render.py --all --workers "${WORKERS:-4}"

# two-pass EBU R128 loudness normalisation to -14 LUFS / -1 dBTP (streaming level)
stats=$(ffmpeg -hide_banner -nostats -i build/audio.wav \
  -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$stats" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -hide_banner -loglevel error -y -i build/video.mp4 -i build/audio.wav \
  -af "loudnorm=I=-14:TP=-1:LRA=11:linear=true:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset),aresample=48000" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart \
  output/dan_koe_ignite.mp4
echo "done -> output/dan_koe_ignite.mp4"
