#!/usr/bin/env bash
# Downloads the Noto Sans SC variable font (SIL OFL 1.1) used for Chinese text.
# Latin text uses the system Inter font (/usr/share/fonts/opentype/inter).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .fonts
[ -s .fonts/NotoSansSC.ttf ] || curl -fsSL -o .fonts/NotoSansSC.ttf \
  "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf"
echo "fonts ready in .fonts/"
