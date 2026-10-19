#!/usr/bin/env bash
# 从脚本一路生成成片：旁白 → 画面 → 配乐混音 → 字幕 → 封装
set -euo pipefail
cd "$(dirname "$0")"
: "${PIPER_DIR:=models}" "${FONT_DIR:=fonts}"
export PIPER_DIR FONT_DIR

python3 tts.py
python3 render.py
python3 audio.py
python3 timeline.py --srt munger-wisdom.srt
ffmpeg -y -v error -i build/video.mp4 -i build/mix.wav -i munger-wisdom.srt \
  -map 0:v -map 1:a -map 2 -c:v copy -c:a aac -b:a 192k -c:s mov_text \
  -metadata title="芒格的宝藏：查理·芒格的智慧与思维模型" -metadata:s:a:0 language=chi -metadata:s:s:0 language=chi \
  -movflags +faststart munger-wisdom.mp4
echo "done: munger-wisdom.mp4"
