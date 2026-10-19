"""把 script.py 的旁白逐句合成为 wav，并写出时间轴 build/timeline.json。

离线 TTS：Piper「小雅」(zh_CN-xiao_ya-medium)，多音字由 g2pW 判断。
g2pW 的训练语料以台湾读音为主（“和”读 hàn、“企”读 qì……），这里在它的
输出上按大陆普通话做一层校正，并用 pypinyin 打印剩余分歧供人工复核。

用法：
  python3 tts.py                 # 合成全部旁白
  python3 tts.py --report        # 只打印与 pypinyin 不一致的读音
环境变量：
  PIPER_DIR   放 zh_CN-xiao_ya-medium.onnx(.json) 和 g2pW/ 的目录
"""

import json
import os
import re
import sys
import wave
from pathlib import Path

import numpy as np

from script import SCENES

HERE = Path(__file__).resolve().parent
BUILD = HERE / "build"
PIPER_DIR = Path(os.environ.get("PIPER_DIR", HERE / "models"))
VOICE = PIPER_DIR / "zh_CN-xiao_ya-medium.onnx"
LENGTH_SCALE = 0.96  # 略快于默认语速

DIGITS = "零一二三四五六七八九"

# g2pW 给出台湾读音时，改成大陆普通话读音：(字, g2pW 读音) -> 校正读音
CHAR_FIX = {
    ("和", "han4"): "he2",
    ("期", "qi2"): "qi1",
    ("企", "qi4"): "qi3",
    ("危", "wei2"): "wei1",
    ("微", "wei2"): "wei1",
    ("究", "jiu4"): "jiu1",
    ("质", "zhi2"): "zhi4",
    ("亚", "ya3"): "ya4",
    ("识", "shi4"): "shi2",
    ("击", "ji2"): "ji1",
    ("绩", "ji1"): "ji4",
    ("迹", "ji1"): "ji4",
    ("息", "xi2"): "xi1",
    ("惜", "xi2"): "xi1",
    ("夕", "xi4"): "xi1",
    ("液", "yi4"): "ye4",
    ("谊", "yi2"): "yi4",
    ("档", "dang3"): "dang4",
    ("帆", "fan2"): "fan1",
    ("播", "bo4"): "bo1",
    ("携", "xi1"): "xie2",
    ("寂", "ji2"): "ji4",
    ("崖", "yai2"): "ya2",
    ("癌", "yan2"): "ai2",
    ("拥", "yong3"): "yong1",
    ("熟", "shou2"): "shu2",
    ("跌", "die2"): "die1",
    ("朴", "pu2"): "pu3",
    ("悄", "qiao3"): "qiao1",
    ("怜", "ling2"): "lian2",
}

# 按词校正（g2pW 在这些词上读错或读成台湾音）
WORD_FIX = {
    "得到": ["de2", "dao4"],
    "那儿": ["na4", "er5"],
    "干完": ["gan4", "wan2"],
    "交易得少": ["jiao1", "yi4", "de5", "shao3"],
    "格栅": ["ge2", "zha4"],
    "芒格": ["mang2", "ge2"],
    "便宜的价格": ["pian2", "yi2", "de5", "jia4", "ge2"],
    "一蹶不振": ["yi4", "jue2", "bu2", "zhen4"],
    "迎刃而解": ["ying2", "ren4", "er2", "jie3"],
    "背书": ["bei4", "shu1"],
    "重注": ["zhong4", "zhu4"],
    "调用": ["diao4", "yong4"],
    "长期": ["chang2", "qi1"],
    "处方": ["chu3", "fang1"],
    "伯克希尔": ["bo2", "ke4", "xi1", "er3"],
    "哈撒韦": ["ha1", "sa1", "wei2"],
    "雅可比": ["ya3", "ke3", "bi3"],
    "卡尼曼": ["ka3", "ni2", "man4"],
    "奥马哈": ["ao4", "ma3", "ha1"],
    "内布拉斯加": ["nei4", "bu4", "la1", "si1", "jia1"],
    "密歇根": ["mi4", "xie1", "gen1"],
    "鲁拉帕鲁扎": ["lu3", "la1", "pa4", "lu3", "zha1"],
    "一点点": ["yi4", "dian3", "dian3"],
    "一颗一颗地": ["yi4", "ke1", "yi4", "ke1", "de5"],
    "一句": ["yi2", "ju4"],
    "一门": ["yi4", "men2"],
    "一样": ["yi2", "yang4"],
    "一路": ["yi2", "lu4"],
    "一目了然": ["yi2", "mu4", "liao3", "ran2"],
    "一辈子": ["yi2", "bei4", "zi5"],
}


def to_say(sub: str) -> str:
    """字幕文字 -> 朗读文字：四位数年份逐位读，去掉引号与英文空格。"""
    s = re.sub(r"(\d{4})年", lambda m: "".join(DIGITS[int(d)] for d in m.group(1)) + "年", sub)
    s = re.sub(r"[“”\"]", "", s)
    return s


def line_say(line: dict) -> str:
    return line.get("say") or to_say(line["sub"])


def make_phonemizer():
    from piper.phonemize_chinese import (
        ChinesePhonemizer, PHONEME_TO_ID, _normalize_g2pw_syllable, _split_initial_final_tone,
    )
    from sentence_stream import stream_to_sentences

    class FixedPhonemizer(ChinesePhonemizer):
        """在 g2pW 输出上套用 CHAR_FIX / WORD_FIX 的拼音音素器。"""

        def syllables(self, sentence: str) -> list:
            sylls = list(self.g2p(sentence)[0])
            for i, (ch, syl) in enumerate(zip(sentence, sylls)):
                if syl and (ch, syl) in CHAR_FIX:
                    sylls[i] = CHAR_FIX[(ch, syl)]
            for word, fix in WORD_FIX.items():
                for m in re.finditer(re.escape(word), sentence):
                    for k, syl in enumerate(fix):
                        sylls[m.start() + k] = syl
            return sylls

        def phonemize(self, text: str) -> list:
            text = re.sub('[“”"]', "", text)
            out = []
            for sentence in stream_to_sentences([text]):
                sentence = self._numbers_to_words(sentence)
                phonemes = []
                for syl, ch in zip(self.syllables(sentence), sentence):
                    if syl is None:
                        if ch in PHONEME_TO_ID:
                            phonemes.append(ch)
                        continue
                    syl = _normalize_g2pw_syllable(syl)
                    ini, fin, tone = _split_initial_final_tone(syl)
                    if not fin:
                        phonemes.append(syl)
                        continue
                    phonemes.extend((ini or "Ø", fin, tone))
                out.append(phonemes)
            return out

    return FixedPhonemizer(PIPER_DIR / "g2pW")


def report(phonemizer) -> None:
    """列出校正后读音仍与 pypinyin（大陆词典）不同的字，供人工复核。"""
    from pypinyin import Style, pinyin

    for scene in SCENES:
        for line in scene["lines"]:
            text = phonemizer._numbers_to_words(line_say(line))
            ours = phonemizer.syllables(text)
            ref = pinyin(text, style=Style.TONE3, neutral_tone_with_five=True, errors=lambda x: [None] * len(x))
            diffs = []
            for i, (ch, a, b) in enumerate(zip(text, ours, ref)):
                b = b[0] if b else None
                if a and b and a.replace("u:", "v") != b.replace("ü", "v"):
                    diffs.append(f"{text[max(0, i - 2):i + 3]}[{ch}] {a}≠{b}")
            if diffs:
                print(scene["id"], " | ".join(diffs))


def synthesize() -> None:
    from piper import PiperVoice, SynthesisConfig

    voice = PiperVoice.load(VOICE)
    voice._chinese_phonemizer = make_phonemizer()
    cfg = SynthesisConfig(length_scale=LENGTH_SCALE, normalize_audio=True, volume=0.95)

    out_dir = BUILD / "voice"
    out_dir.mkdir(parents=True, exist_ok=True)
    timeline = []
    for si, scene in enumerate(SCENES):
        clips = []
        for li, line in enumerate(scene["lines"]):
            chunks = list(voice.synthesize(line_say(line), cfg))
            rate = chunks[0].sample_rate
            gap = np.zeros(int(rate * 0.12), np.float32)  # 句内分句之间的短停顿
            audio = np.concatenate([np.concatenate([c.audio_float_array, gap]) for c in chunks])
            path = out_dir / f"{si:02d}_{scene['id']}_{li}.wav"
            with wave.open(str(path), "wb") as w:
                w.setnchannels(1)
                w.setsampwidth(2)
                w.setframerate(rate)
                w.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
            clips.append(dict(file=str(path.relative_to(HERE)), dur=round(len(audio) / rate, 3)))
            print(f"{path.name}  {len(audio) / rate:5.2f}s  {line['sub'][:24]}")
        timeline.append(dict(id=scene["id"], clips=clips))
    (BUILD / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if "--report" in sys.argv:
        report(make_phonemizer())
    else:
        synthesize()
