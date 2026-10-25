# 正念：重塑大脑的力量 · MINDFULNESS · REWIRE YOUR BRAIN

一支 4 分 48 秒的中文科普短片（1920×1080，30 fps）。约 6 万颗发光粒子在「思绪风暴 → 文字 → 真实人脑 → 呼吸球 → 神经元 → 打坐的人 → 星系」之间溶解重组，配一段原创的史诗管弦配乐，讲清四件事：

1. **正念是什么**：Kabat-Zinn 的操作性定义，以及 MBSR 的起源；
2. **它怎样改变大脑**：前额叶、前扣带回（ACC）、杏仁核、海马、岛叶、默认模式网络（DMN），每条都标出处，结构性改变单列【争议】并给出 2022 年的阴性 RCT；
3. **为什么值得练**：焦虑、抑郁、疼痛的效应量，以及 MBCT 预防抑郁复发；
4. **怎样正确地练**：觉察呼吸的四步循环（走神 → 觉察 → 回到呼吸 → 专注）、起步时长、8 周课程、注意事项。

| 文件 | 内容 |
|---|---|
| `output/mindfulness_particles.mp4` | 成片（H.264 + AAC，可直接播放）。为了放进 GitHub 的 100 MB 单文件上限，这里是 2.3 Mbps 两遍编码版；`render.py full` 直接输出的是 CRF 20 高画质版（约 160 MB） |
| `script.md` | 完整脚本、分镜、音乐结构表、18 条文献与证据强度 |
| `render/` | 粒子渲染器与全片时间线（Python） |
| `music/bgm.m4a` | 配乐单独的音频文件（AAC 256 kbps） |
| `music/bgm.py` | 配乐合成器，运行后生成渲染用的 `music/bgm.wav`（无损，不入库） |
| `tools/fetch_fonts.sh` | 下载渲染所需的字体 |

## 重新渲染

需要 Python 3.10+ 和 ffmpeg。

```bash
cd mindfulness-video
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
PYTHON=python tools/fetch_fonts.sh   # 约 95 MB 字体，放到 .cache/fonts/（不入库）
python music/bgm.py                  # 约 1–2 分钟，生成 music/bgm.wav
cd render
python render.py still 75.5          # 渲染单帧，检查效果 → .cache/still_75.50.png
python render.py preview 60 90       # 半分辨率片段预览
python render.py full --workers 4    # 全片 1080p，自动混入配乐 → output/
```

第一次运行会通过 nilearn 下载 MNI152 模板（几 MB），并把提取好的大脑点云缓存到 `.cache/`。在 4 核机器上，全片渲染约 20–25 分钟。

## 怎么做的

**全部是 t 的纯函数。** 每一帧只由时间 t 决定，没有帧间状态，所以可以把全片切成 6 秒一段，多进程并行渲染后再拼接。画面和音乐共用 `render/timeline.py` 里的重击时间表，保证每一记鼓点和画面冲击波对齐。

**粒子形体**（`render/forms.py`）。每种形体都返回同样 6 万颗粒子的位置、颜色、亮度和模糊量，切换时按每颗粒子的随机延迟溶解、旋转、重组。

- 大脑（`render/brain.py`）来自 MNI ICBM152 2009a 灰质/白质模板。先用 marching cubes 提取皮层表面，再按面积均匀采样，用表面法线做边缘光，用多尺度「暴露度」区分脑回（亮）和脑沟（暗）。杏仁核、海马、岛叶、ACC、mPFC、PCC、角回、DLPFC 都按文献里的 MNI 坐标定位，所以解剖位置是真实的。
- 打坐的人由头、颈、躯干、手臂、盘腿和坐垫的参数曲面拼成。胸前的呼吸球按 8 秒周期涨落（吸 4 秒、呼 4 秒），观众可以跟着画面一起呼吸。

**渲染器**（`render/engine.py`）。透视投影后，把粒子用双线性方式溅射到 4 个分辨率层上，模拟景深；然后依次做辉光、色调映射 `1 − e^(−x)` 和暗角，最后用 Loyel 十档色阶做亮度渐变映射，叠加发光后的颜色也不会泛成灰白。

**文字**（`render/text.py`）。中文用思源宋体/黑体，拉丁字母和数字用 Oswald / Montserrat，逐字按基线混排；支持关键词高亮、逐行擦入、荧光、文字背后的压暗，以及跟随三维脑区的标注引线。

**配乐**（`music/bgm.py`）。D 小调，120 BPM，144 小节，全部由 numpy/scipy 从振荡器开始合成，没有用任何采样：

- 太鼓群、铜管 Braam、弦乐顽固音型、合唱共振峰、定音鼓、钢片琴、上升音效和倒放镲片；
- 合成卷积混响，分段响度自动化，压缩与软削波；
- 成品约 −14 LUFS，真峰值约 −1 dBFS。

## 配色

画面里的每一种颜色都来自 Loyel 渐变蓝十档色板，没有使用任何通用高饱和蓝，也没有红、绿、橙：

`#F4F7FB` `#E8EEF6` `#CCDBEB` `#9FBDDA` `#6C9AC4` `#497DAE` `#376392` `#2E5076` `#2B4868` `#263B54`

背景是 Color 90 / 100 按亮度系数压暗后的径向渐变，与仓库里的《深蓝潜行》一致。

## 科学表述

- 横断面研究只写成「冥想者与非冥想者不同」，不写成因果；
- 杏仁核写「灰质密度下降与压力下降相关」，不写「杏仁核缩小」；
- 结构性脑变化单列【争议】卡，同时给出 Fox 2014 的发表偏倚分析和 Kral 2022（n = 218）的阴性 RCT；
- 「每天 5–10 分钟起步」标明是入门建议，不是某项研究的剂量结论；
- 片尾声明：科普内容，不替代专业医疗或心理诊疗建议。

全部 18 条文献、DOI 和证据强度见 `script.md` 第四节。

## 版权与许可

- **配乐**：本仓库代码原创合成，无采样、无第三方素材，可自由用于商业用途。
- **字体**：Noto Sans CJK SC、Noto Serif CJK SC（© Google / Adobe）、Oswald、Montserrat，均为 SIL Open Font License 1.1，允许商用和嵌入视频。
- **脑模板**：MNI ICBM152 2009a 非线性对称模板，许可要求保留以下声明：

  > Copyright (C) 1993–2009 Louis Collins, McConnell Brain Imaging Centre, Montreal Neurological Institute, McGill University. Permission to use, copy, modify, and distribute this software and its documentation for any purpose and without fee is hereby granted, provided that the above copyright notice appear in all copies. The authors and McGill University make no representations about the suitability of this software for any purpose. It is provided "as is" without express or implied warranty. The authors are not responsible for any data loss, equipment damage, property loss, or injury to subjects or patients resulting from the use or misuse of this software package.

  参考：Fonov V et al. (2011) *NeuroImage* 54:313–327；Fonov V et al. (2009) *NeuroImage* 47:S102。
