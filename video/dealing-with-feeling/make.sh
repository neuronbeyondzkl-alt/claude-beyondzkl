#!/usr/bin/env bash
# Builds dealing-with-feeling.mp4 from scratch: fonts -> score -> picture -> mux.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build fonts

fetch() {  # fetch <file> <google-fonts css2 family query>
  [ -s "fonts/$1" ] && return
  url=$(curl -sS -A "Wget/1.20" "https://fonts.googleapis.com/css2?family=$2" |
        grep -o 'https://[^)]*\.ttf' | head -1)
  curl -sS -o "fonts/$1" "$url"
}
fetch NotoSansSC-400.ttf  "Noto+Sans+SC:wght@400"
fetch NotoSansSC-700.ttf  "Noto+Sans+SC:wght@700"
fetch NotoSansSC-900.ttf  "Noto+Sans+SC:wght@900"
fetch NotoSerifSC-900.ttf "Noto+Serif+SC:wght@900"
fetch Cinzel-700.ttf      "Cinzel:wght@700"
fetch Cinzel-900.ttf      "Cinzel:wght@900"
fetch Montserrat-500.ttf  "Montserrat:wght@500"
fetch Montserrat-700.ttf  "Montserrat:wght@700"

python3 music.py build/audio.wav
python3 render.py video build/video.mp4
ffmpeg -y -loglevel error -i build/video.mp4 -i build/audio.wav \
  -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -c:a aac -b:a 256k \
  -shortest -movflags +faststart dealing-with-feeling.mp4
echo "-> dealing-with-feeling.mp4"
