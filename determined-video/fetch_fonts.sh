#!/usr/bin/env bash
# Download the fonts the renderer needs (all SIL OFL 1.1, via the Google Fonts CSS API).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p fonts
get() {  # family spec, output file
  url=$(curl -fsS "https://fonts.googleapis.com/css2?family=$1" | grep -o 'https://[^)]*\.ttf' | head -1)
  curl -fsS -o "fonts/$2" "$url"
  echo "fonts/$2"
}
get "Noto+Serif+SC:wght@900" NotoSerifSC-Black.ttf
get "Noto+Sans+SC:wght@900" NotoSansSC-Black.ttf
get "Noto+Sans+SC:wght@300" NotoSansSC-Light.ttf
get "Oswald:wght@700" Oswald-Bold.ttf
get "Montserrat:wght@300" Montserrat-Light.ttf
get "Montserrat:wght@800" Montserrat-ExtraBold.ttf
