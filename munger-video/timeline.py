"""由 build/timeline.json（每句旁白时长）推出全片时间轴，并导出 SRT 字幕。"""

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

from script import SCENES
from tts import line_say

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"

LEAD = 0.8        # 场景开始到第一句旁白
FIRST_LEAD = 2.6  # 片头留给罗盘入场
GAP = 0.45        # 句与句之间
TAIL = 1.0        # 最后一句之后
XFADE = 0.6       # 场景交叉淡化时长（落在下一场景的开头）


@dataclass
class Scene:
    index: int
    id: str
    theme: str
    chapter: tuple | None
    lines: list
    start: float = 0.0
    dur: float = 0.0
    cues: list = field(default_factory=list)   # 每句开始（场景内时间）
    lens: list = field(default_factory=list)   # 每句时长
    clips: list = field(default_factory=list)  # 每句 wav 路径

    def end(self, i: int) -> float:
        return self.cues[i] + self.lens[i]

    def word(self, i: int, word: str) -> float:
        """估算第 i 句里 word 开始被念出的时刻（按汉字/数字数量比例）。"""
        say = line_say(self.lines[i])
        idx = say.find(word)
        if idx < 0:
            raise ValueError(f"{word!r} not in {say!r}")
        count = lambda s: len(re.findall(r"[一-鿿0-9A-Za-z]", s)) + 0.6 * len(re.findall(r"[，。；：、？！—]", s))
        return self.cues[i] + self.lens[i] * count(say[:idx]) / max(1.0, count(say))


def build() -> tuple[list[Scene], float]:
    data = {d["id"]: d for d in json.loads((BUILD / "timeline.json").read_text())}
    scenes, t = [], 0.0
    for i, sc in enumerate(SCENES):
        clips = data[sc["id"]]["clips"]
        s = Scene(i, sc["id"], sc["theme"], sc.get("chapter"), sc["lines"], start=t)
        cur = FIRST_LEAD if i == 0 else LEAD
        for clip in clips:
            s.cues.append(cur)
            s.lens.append(clip["dur"])
            s.clips.append(HERE / clip["file"])
            cur += clip["dur"] + GAP
        s.dur = s.cues[-1] + s.lens[-1] + sc.get("tail", TAIL)
        scenes.append(s)
        t += s.dur
    return scenes, t


def subtitle_events(scenes: list[Scene]) -> list[tuple[float, float, str]]:
    events = []
    for s in scenes:
        for i, line in enumerate(s.lines):
            a = s.start + s.cues[i] - 0.08
            b = s.start + s.end(i) + 0.3
            events.append([a, b, line["sub"]])
    for e, nxt in zip(events, events[1:]):
        e[1] = min(e[1], nxt[0] - 0.02)
    return [tuple(e) for e in events]


def write_srt(scenes: list[Scene], path: Path) -> None:
    def ts(x: float) -> str:
        ms = int(round(x * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"

    out = []
    for n, (a, b, text) in enumerate(subtitle_events(scenes), 1):
        out.append(f"{n}\n{ts(a)} --> {ts(b)}\n{text}\n")
    path.write_text("\n".join(out), encoding="utf-8")


if __name__ == "__main__":
    import sys

    scenes, total = build()
    if len(sys.argv) == 3 and sys.argv[1] == "--srt":
        write_srt(scenes, Path(sys.argv[2]))
        raise SystemExit
    for s in scenes:
        print(f"{s.id:12s} start {s.start:7.2f}  dur {s.dur:6.2f}")
    print(f"total {total:.2f}s ({total / 60:.1f} min)")
