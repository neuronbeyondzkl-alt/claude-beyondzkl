#!/usr/bin/env bash
# 一键重新生成：先合成配乐，再并行渲染画面并封装成 mp4
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build
python3 music.py build/music.wav
python3 render.py --out build/thinking_fast_slow.mp4 --audio build/music.wav --workers "${WORKERS:-4}"
