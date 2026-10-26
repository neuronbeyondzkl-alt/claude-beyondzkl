# 运动 · 重塑大脑 —— 科普短片

**HOW EXERCISE REWIRES YOUR BRAIN** · 3 分 20 秒 · 1920×1080 · 30 fps · 中文字幕

成片：[`运动重塑大脑.mp4`](运动重塑大脑.mp4)

一部以**光、影、粒子**为主要视觉语言的科普短片，讲运动如何从**神经层面**和**分子层面**重塑大脑。所有画面由 Python 逐帧程序化渲染（数十万粒子 + 辉光 + 体积光 + 镜头光晕），配乐也全部由代码合成：D 小调、120 BPM 的史诗管弦风格，包括太鼓、铜管轰鸣、弦乐固定音型、合唱和英雄主题。画面与配乐按同一条时间轴逐拍对齐。

---

## 分镜与科学内容

| 时间 | 段落 | 画面 | 科学要点 | 主要证据 |
|---|---|---|---|---|
| 0:00–0:16 | 序幕 | 黑暗中一颗随心跳明灭的光点，长出一个神经元 | 人脑约 860 亿个神经元 | Azevedo 2009 |
| 0:16–0:32 | 光之跑者 | 粒子凝聚成奔跑的人形，心脏脉动，能量涌向头部，镜头推进到大脑 | 运动使心率与脑血流上升 | — |
| 0:32–0:40 | 片名 | 爆散的粒子聚合成“运动 · 重塑大脑” | — | — |
| 0:40–0:44 | 第一章 | 神经机制 | | |
| 0:44–0:56 | ① 脑血流 · 血管新生 | 光之血管树生长，血流粒子奔涌，新生毛细血管伴 VEGF 闪光 | 运动增加齿状回脑血容量；外周 VEGF 是运动诱导神经发生所必需 | Pereira 2007；Fabel 2003 |
| 0:56–1:12 | ② 海马 · 神经发生 | 粒子大脑成形，海马亮起，镜头推入齿状回，新生神经元诞生并长出树突 | 跑步使小鼠齿状回新生神经元约翻倍；老年人 1 年有氧运动后海马前部体积 +2% | van Praag 1999 (Nat Neurosci)；Erickson 2011 |
| 1:12–1:24 | ③ 突触可塑性 | 动作电位沿轴突传导，突触释放囊泡，树突棘逐个长出 | 运动增强 LTP、增加树突棘；调动多巴胺、去甲肾上腺素、5-HT、内源性大麻素 | van Praag 1999 (PNAS)；Fuss 2015 |
| 1:24–1:36 | ④ 脑网络 | 大脑网络节点与连线脉冲闪烁，前额叶与默认模式网络亮起 | 执行功能提升、DMN 连接增强；单次运动也有小幅短暂获益 | Colcombe & Kramer 2003；Voss 2010；Chang 2012 |
| 1:36–1:44 | 第二章 | 星野穿梭，进入分子尺度 | | |
| 1:44–1:58 | ⑤ 外周 → 大脑 | 骨骼肌收缩、肝脏发光，信使分子随血流奔向大脑，标签随分子流动 | 鸢尾素（FNDC5）、组织蛋白酶 B、乳酸、β-羟丁酸、IGF-1、GPLD1 | Wrann 2013；Moon 2016；Horowitz 2020 |
| 1:58–2:08 | ⑥ 血脑屏障 | 内皮细胞屏障、MCT 转运体放行乳酸，Clusterin 停靠内皮，小胶质细胞由躁动转为静息 | 乳酸入脑并诱导 BDNF；运动血浆中的 Clusterin 抑制神经炎症 | El Hayek 2019；De Miguel 2021 |
| 2:08–2:28 | ⑦ BDNF 信号级联 | BDNF 二聚体结合 TrkB，三条通路（PI3K/Akt、Ras-MAPK/ERK、PLCγ）点亮并汇入细胞核，CREB 激活，DNA 解旋，正反馈环 | BDNF→TrkB→三条通路→CREB→基因转录；β-HB 抑制 HDAC，开放 Bdnf 启动子 | Neeper 1995；Sleiman 2016 |
| 2:28–2:56 | 高潮 | 一切被吸入奇点，再爆发为旋转的三维光之大脑，波前随强拍扫过皮层，关键词环绕 | “每一次心跳加速，都在重塑你的大脑” | — |
| 2:56–3:12 | 运动处方 | 大脑化作心电图光线，扫描头逐拍划过 | 每周 150–300 分钟中等强度或 75–150 分钟高强度有氧运动，外加每周 ≥2 天力量训练 | WHO 2020 |
| 3:12–3:20 | 参考文献 | 18 条文献与声明 | | |

**证据边界（片中已标注）**
- 齿状回神经发生翻倍、GPLD1、Clusterin、β-HB/HDAC、乳酸→BDNF 等结论主要来自**小鼠实验**。人类证据以影像学（海马体积、脑网络）和认知测试为主。
- **人类成年海马神经发生的规模仍有争议**（如 Sorrells 2018 与 Boldrini 2018、Moreno-Jiménez 2019 的结论不一致），片中以“注”标出。
- 本片为科普用途，不构成个体化医疗建议。

---

## 配乐设计

D 小调，120 BPM（1 拍 = 0.5 s，1 小节 = 2 s）。所有冲击点、段落转换和静默空拍都写在 `timeline.py` 里，画面与配乐共用。

| 时间 | 段落 | 编配 |
|---|---|---|
| 0–16 s | 序幕 | 低频持续音、暗色弦乐、心跳（与画面光点同步）、钢琴动机、反向镲 |
| 16–32 s | 点火 | 弦乐十六分固定音型进入，太鼓渐密，通鼓加花、军鼓滚奏、上升音效，31.75 s 静默半拍 |
| 32–40 s | 片名 | **铜管轰鸣 + 太鼓齐奏 + 镲 + 合唱**，36 s 第二次轰鸣 |
| 40–96 s | 第一章 | 驱动型太鼓律动与固定音型；56 s 起圆号奏出英雄主题，72 s 起弦乐接过主题，每个段落交界都有冲击 |
| 96–104 s | 呼吸段 | 回到心跳与钢琴，滤波上升、军鼓滚奏蓄力 |
| 104–148 s | 第二章 | 更密集的打击乐、合唱铺底、BDNF 段落旋律逐级上行 |
| 148–152 s | 吸入 | 反向膨胀，151.5 s 静默半秒 |
| 152–176 s | 高潮 | **全奏**：铜管 + 弦乐 + 合唱齐奏英雄主题，太鼓十六分、每 8 秒一次铜管轰鸣 |
| 176–200 s | 尾声 | 皮卡第三度解决到 **D 大调**，铜管与合唱长音，钢琴动机以大调回归，心跳渐息 |

---

## 视觉规范

- 配色严格使用 **Loyel 渐变蓝** 十档色板（`#F4F7FB` → `#263B54`），粒子按亮度在色板内插值，叠加后自然过渡到近白高光；深色底仅用色板中最深的 `#263B54` 雾化叠加暗角，没有引入其他蓝色或红、绿、橙。
- 深色背景上的标题与正文用白色 / `#E8EEF6`，引用与标注用 `#9FBDDA`。
- 字体：思源宋体 Black（片名）、思源黑体（正文）、Cinzel（英文副标题）、Oswald（编号与英文引用），均为 SIL OFL 授权。

---

## 如何重新生成

依赖：Python 3.10+、`numpy`、`scipy`、`opencv-python-headless`、`Pillow`、`ffmpeg`。

```bash
pip install numpy scipy opencv-python-headless pillow
./fetch_fonts.sh                          # 下载字体到 fonts/（约 46 MB，不纳入版本库）
python3 music.py build/score.wav          # 合成配乐（约 2 分钟）
python3 render.py video --jobs 4          # 多进程渲染画面（4 核约 40 分钟）
python3 render.py mux build/score.wav 运动重塑大脑.mp4

python3 render.py stills 36 163.5         # 预览单帧
python3 render.py sheet 128 152 12        # 预览一段的缩略联系表
```

| 文件 | 作用 |
|---|---|
| `timeline.py` | 段落、冲击点、静默空拍、心跳时刻（画面与配乐共用） |
| `music.py` | 合成器、编曲与母带处理 |
| `engine.py` | 粒子渲染引擎、后期（辉光 / 光晕 / 体积光 / 色调映射）、文字合成 |
| `shapes.py` | 二维 / 三维大脑点云（迷宫纹理脑回）、分支树、跑者骨架 |
| `scenelib.py` | 相机、版式、树状结构绘制 |
| `scenes1.py` / `scenes2.py` | 各段落的画面 |
| `render.py` | 逐帧渲染、分段编码与混流 |

---

## 参考文献

1. Azevedo FAC, et al. Equal numbers of neuronal and nonneuronal cells make the human brain an isometrically scaled-up primate brain. *J Comp Neurol.* 2009;513:532.
2. Neeper SA, et al. Exercise and brain neurotrophins. *Nature.* 1995;373:109.
3. van Praag H, et al. Running increases cell proliferation and neurogenesis in the adult mouse dentate gyrus. *Nat Neurosci.* 1999;2:266.
4. van Praag H, et al. Running enhances neurogenesis, learning, and long-term potentiation in mice. *PNAS.* 1999;96:13427.
5. Fabel K, et al. VEGF is necessary for exercise-induced adult hippocampal neurogenesis. *Eur J Neurosci.* 2003;18:2803.
6. Pereira AC, et al. An in vivo correlate of exercise-induced neurogenesis in the adult dentate gyrus. *PNAS.* 2007;104:5638.
7. Erickson KI, et al. Exercise training increases size of hippocampus and improves memory. *PNAS.* 2011;108:3017.
8. Colcombe S, Kramer AF. Fitness effects on the cognitive function of older adults: a meta-analytic study. *Psychol Sci.* 2003;14:125.
9. Voss MW, et al. Plasticity of brain networks in a randomized intervention trial of exercise training in older adults. *Front Aging Neurosci.* 2010;2:32.
10. Chang YK, et al. The effects of acute exercise on cognitive performance: a meta-analysis. *Brain Res.* 2012;1453:87.
11. Fuss J, et al. A runner's high depends on cannabinoid receptors in mice. *PNAS.* 2015;112:13105.
12. Wrann CD, et al. Exercise induces hippocampal BDNF through a PGC-1α/FNDC5 pathway. *Cell Metab.* 2013;18:649.
13. Moon HY, et al. Running-induced systemic cathepsin B secretion is associated with memory function. *Cell Metab.* 2016;24:332.
14. Sleiman SF, et al. Exercise promotes the expression of brain derived neurotrophic factor (BDNF) through the action of the ketone body β-hydroxybutyrate. *eLife.* 2016;5:e15092.
15. El Hayek L, et al. Lactate mediates the effects of exercise on learning and memory through SIRT1-dependent activation of hippocampal BDNF. *J Neurosci.* 2019;39:2369.
16. Horowitz AM, et al. Blood factors transfer beneficial effects of exercise on neurogenesis and cognition to the aged brain. *Science.* 2020;369:167.
17. De Miguel Z, et al. Exercise plasma boosts memory and dampens brain inflammation via clusterin. *Nature.* 2021;600:494.
18. World Health Organization. *WHO guidelines on physical activity and sedentary behaviour.* Geneva: WHO; 2020.

以上文献的卷号与起始页均已在 PubMed 核对。
