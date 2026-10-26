#!/usr/bin/env bash
# Score → frames → final MP4. Needs python3 (numpy, scipy), node + playwright, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
python3 music.py
node render.mjs video --workers "${WORKERS:-4}"
cp build/video.mp4 the-brain-that-changes-itself.mp4
echo "done: the-brain-that-changes-itself.mp4"
