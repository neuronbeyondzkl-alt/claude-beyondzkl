#!/usr/bin/env bash
# 下载渲染所需字体到 mindfulness-video/.cache/fonts/（不入库，约 95 MB）。
#   Noto Sans/Serif CJK SC：从 notofonts/noto-cjk 仓库下载（SIL OFL 1.1）
#   Oswald / Montserrat：把仓库 assets/fonts 里的 woff2 解包成 TTF（SIL OFL 1.1）
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$HERE")"
DST="$ROOT/.cache/fonts"
PY="${PYTHON:-python3}"
mkdir -p "$DST"

BASE="https://raw.githubusercontent.com/notofonts/noto-cjk/main"
for f in Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf \
         Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf \
         Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Light.otf \
         Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Black.otf \
         Serif/OTF/SimplifiedChinese/NotoSerifCJKsc-Bold.otf; do
  out="$DST/$(basename "$f")"
  if [ ! -s "$out" ]; then
    echo "下载 $(basename "$f")"
    curl -sS -L --fail -o "$out" "$BASE/$f"
  fi
done

"$PY" - "$ROOT/../assets/fonts" "$DST" <<'EOF'
import os, sys
from fontTools.ttLib import TTFont
src, dst = sys.argv[1], sys.argv[2]
for name, out in [("oswald-latin-wght.woff2", "Oswald-VF.ttf"), ("montserrat-latin-wght.woff2", "Montserrat-VF.ttf")]:
    p = os.path.join(dst, out)
    if os.path.exists(p):
        continue
    f = TTFont(os.path.join(src, name))
    f.flavor = None
    f.save(p)
    print("转换", out)
EOF
echo "字体就绪：$DST"
