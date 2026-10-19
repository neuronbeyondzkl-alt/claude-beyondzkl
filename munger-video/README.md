# 芒格的宝藏 · 查理·芒格的智慧与思维模型

一支约 9 分 42 秒的中文知识视频（1920×1080，30 fps，带中文旁白、配乐和字幕），用“大航海时代的宝藏传说”做引子，总结查理·芒格（Charlie Munger，1924–2023）的思维模型、投资观与人生观。

- 成片：[`munger-wisdom.mp4`](munger-wisdom.mp4)（内嵌可开关的中文字幕轨，画面里也烧录了字幕）
- 字幕：[`munger-wisdom.srt`](munger-wisdom.srt)
- 配色：全片只用 Loyel 渐变蓝十档色值（`#F4F7FB` → `#263B54`），深色背景上的文字用白色

## 核心论点

网上流传的“芒格 100 个思维模型”并不是芒格本人公布的清单。1994 年他在南加州大学商学院演讲时说的是：**大约八九十个重要模型，就能承担起让你成为“普世智慧”之人九成的工作**；他真正强调的是把模型连成一张**格栅（latticework）**，再把经验挂到格栅上。所以视频的结论是：宝藏不是一张清单，而是**跨学科的格栅 + 反过来想的习惯 + 一辈子做学习机器**。

## 章节

| 时间 | 章节 | 内容 |
|---|---|---|
| 0:00 | 片头 | 两个“宝藏传说”，罗盘与标题 |
| 0:33 | 00 传说与真相 | “100 个”→“八九十个”，格栅而非清单 |
| 1:10 | 01 船长是谁 | 生平时间轴：1924 奥马哈 → 1948 哈佛法学院 → 1959 结识巴菲特 → 1978 伯克希尔副董事长 → 2023 辞世 |
| 1:50 | 02 铁锤人倾向 | 手里只有锤子的人，看什么都像钉子 |
| 2:18 | 03 多元思维格栅 | 数学、物理与工程、生物学、经济学、心理学各自贡献的模型 |
| 2:51 | 04 宝石一 · 复利 | 年化 10% 的 40 年曲线：前 20 年 1→6.7，后 20 年 6.7→45.3 |
| 3:31 | 05 宝石二 · 逆向思考 | 雅可比“反过来想”，1986 年“保证痛苦的处方” |
| 4:25 | 06 宝石三 · 能力圈 | 边界比大小更重要 |
| 4:52 | 07 宝石四 · 激励 | 联邦快递夜班从按小时付薪改为按班次付薪 |
| 5:28 | 08 宝石五 · 人类误判心理学 | 25 种倾向与 Lollapalooza 效应 |
| 6:06 | 09 认知科学视角 | 与 Kahneman 双系统框架的对照（跨学科解读），两步分析法与检查清单 |
| 6:49 | 10 投资之道 | 伟大企业 × 合理价格（1972 喜诗糖果）、少而精、坐等投资法 |
| 7:30 | 11 人生之道 | 配得上、每天更聪明一点、远离嫉妒、职业三原则 |
| 8:06 | 12 把芒格反过来想 | 收集≠智慧、幸存者偏差、芒格也会犯错 |
| 8:49 | 宝藏 | 格栅 · 逆向 · 学习机器 |
| 9:23 | 片尾 | 一句话版本与参考资料 |

## 出处

| 年份 | 来源 | 视频里用到的内容 |
|---|---|---|
| 1986 | 哈佛学校（洛杉矶）毕业典礼演讲 | “保证痛苦的处方” |
| 1994 | 南加州大学商学院演讲 *A Lesson on Elementary, Worldly Wisdom* | 八九十个模型、格栅、铁锤人、天赋与游戏 |
| 1995 | 哈佛演讲 *The Psychology of Human Misjudgment*（2005 年修订为 25 条） | 25 种倾向、Lollapalooza、联邦快递案例、“前 5% 却仍低估激励” |
| 1996 | 巴菲特致股东信 | 能力圈的大小不重要，边界才重要 |
| 1996 | *Practical Thought About Practical Thought?* | 两步分析法 |
| 2005 | 《穷查理宝典》*Poor Charlie's Almanack*（Peter D. Kaufman 编） | 生平与演讲合集 |
| 2007 | 南加州大学法学院毕业典礼演讲 | 配得上、学习机器、每天更聪明一点 |
| 2011 | Kahneman《思考，快与慢》 | 双系统框架（视频中作为跨学科对照，并非芒格本人的说法） |
| 2014 | 巴菲特致股东信（伯克希尔 50 周年） | 芒格推动他从“捡烟蒂”转向“合理价格买伟大企业” |
| 2023 | Daily Journal 股东会 | 芒格称投资阿里巴巴是他最严重的错误之一 |

“复利的第一条规则”“大钱在等待之中”“嫉妒是最蠢的罪”“职业三原则”等语录在多次股东会和访谈中出现，流传版本措辞略有差异，视频采用的是通行的中文译法。

## 重新生成

视频完全由本目录的脚本生成，不含任何素材文件：

| 文件 | 作用 |
|---|---|
| `script.py` | 16 个场景的旁白与字幕（`sub` 显示，`say` 朗读） |
| `tts.py` | 离线中文 TTS，逐句合成并写出 `build/timeline.json` |
| `timeline.py` | 推算每个场景和每句旁白的时间，导出 SRT |
| `render.py` | skia 逐帧绘制，4 进程并行编码 |
| `audio.py` | 旁白排轨、合成配乐、闪避混音 |
| `build.sh` | 串起以上步骤并封装成片 |

依赖（Python 3.13 下验证过）：

```bash
pip install "piper-tts[zh]==1.8.0" unicode-rbnf skia-python scipy numpy pypinyin
apt-get install ffmpeg libegl1 libgl1    # skia-python 需要 libEGL
```

需要放到本目录（均已在 `.gitignore` 中）：

- `models/`：Piper 语音 `zh_CN-xiao_ya-medium.onnx` 与 `.onnx.json`（[rhasspy/piper-voices](https://huggingface.co/rhasspy/piper-voices/tree/main/zh/zh_CN/xiao_ya/medium)），以及 g2pW 多音字模型解压到 `models/g2pW/`（[g2pw.tar.gz](https://huggingface.co/datasets/rhasspy/piper-checkpoints/resolve/main/zh/zh_CN/_resources/g2pw.tar.gz)）
- `fonts/`：Noto Sans SC 与 Noto Serif SC 的各字重 TTF（可从 npm 包 `@expo-google-fonts/noto-sans-sc`、`@expo-google-fonts/noto-serif-sc` 取得）

```bash
./build.sh          # 约 15–20 分钟（4 核）
python3 render.py --still 12,180,400   # 只导出几帧 PNG 预览
python3 tts.py --report                # 列出与 pypinyin 不一致的读音，人工复核
```

## 旁白读音

g2pW 的训练语料以台湾读音为主（“和”读 hàn、“企”读 qì、“期”读 qí……），`tts.py` 在它的输出上按大陆普通话做了一层字级和词级校正，并用 pypinyin 打印剩余分歧供人工复核。合成后又用 Whisper（small）把每句旁白转写回文字做了一遍抽查，剩余的识别差异主要是同音字和专有名词（如“芒格”被识别成“芒阁”），不是读错。

## 授权与说明

- 旁白语音“小雅”（`zh_CN-xiao_ya-medium`）训练自标贝 BZNSYP 数据集，该数据集**仅限非商业用途**；如需商用，请换用 CC0 的 `zh_CN-chaowen-medium` 重新运行 `tts.py`。
- Noto Sans SC / Noto Serif SC 采用 SIL Open Font License。
- 配乐由 `audio.py` 用 numpy 现场合成，没有使用任何外部音频。
- 视频为知识整理与评述，“认知科学视角”和“把芒格反过来想”两章是制作者的解读，已在画面上标注。
