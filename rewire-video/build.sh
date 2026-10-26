#!/usr/bin/env bash
# Build out/rewire.mp4 from scratch: fonts -> music -> frames + mux.
set -euo pipefail
cd "$(dirname "$0")"

pip install -q numpy scipy pillow opencv-python-headless

mkdir -p fonts out
fetch() {  # Noto Sans SC (OFL) from Google Fonts; the CSS API hands out TTF links
  local wght=$1 out=fonts/NotoSansSC-$1.ttf
  [ -s "$out" ] && return
  url=$(curl -sS "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@${wght}" | grep -o 'https://[^)]*\.ttf' | head -1)
  curl -sS -o "$out" "$url"
}
fetch 500
fetch 900

python3 music.py
python3 render.py --out out/rewire.mp4
