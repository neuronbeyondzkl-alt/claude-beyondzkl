# 《Dealing with Feeling》· 2 分 18 秒浓缩视频

把 Marc Brackett 的 *Dealing with Feeling: Use Your Emotions to Create the Life You Want*（2025）浓缩成一支 1080p / 30fps、时长 2:18 的“热血、燃”风格短片。画面以光、影和荧光粒子为主，配乐与音效全部由代码合成，并与画面逐拍对齐。

- 成片：`dealing-with-feeling.mp4`（H.264 + AAC 256k）
- 配色：只用 Loyel 渐变蓝十档（`#F4F7FB` … `#263B54`）加白色，没有使用其他蓝色
- 配乐：120 BPM，D 小调，i–VI–III–VII 和弦进行，结尾落在 D 大调

## 内容结构

| 时间 | 小节 | 段落 | 画面与内容 | 音乐与卡点 |
|---|---|---|---|---|
| 0:00–0:08 | 1–4 | 冷开场 | 星云粒子盘旋后坍缩成光核；“你如何对待自己的情绪，决定了你将过怎样的人生” | 心跳、低频长音、上升音效，冲击前留 0.14 秒静音 |
| 0:08–0:16 | 5–8 | 片名 | 光核爆炸，粒子拼出 DEALING WITH FEELING；作者 Marc Brackett | BRAAM 铜管冲击、镲片、太鼓 |
| 0:16–0:32 | 9–16 | 前言 | 粒子依次拼成 100% → 1/3 → 10%，最后是“没有坏情绪” | 每个数字落定都对准小节强拍，带冲击和 whoosh |
| 0:32–0:40 | 17–20 | 定义 | 情绪调节、共同调节；粒子球越转越快后坍缩 | 军鼓滚奏从四分音符加速到 32 分音符，上升音效，最后 0.5 秒静音 |
| 0:40–0:48 | 21–24 | 情绪调节轮 | 粒子炸开成 7 段光环，每段在拍手声上依次点亮 | Drop：底鼓四拍、侧链压缩、7 次点亮各配一个音效 |
| 0:48–1:44 | 25–52 | 七大领域 | 每个领域 8 秒：左侧是粒子图标，右侧标题砸入，三条要点依次在拍点上滑入 | 每个领域开头一记冲击，要点各配一个 tick；从第 3 个领域起加入主旋律 |
| 1:44–1:52 | 53–56 | 留白 | “不是控制情绪，而是管理它／不是消除情绪，而是接纳并善用它” | 鼓组退出，只留钢琴和心跳 |
| 1:52–2:00 | 57–60 | 再起 | Practice Makes Permanent；光环高速旋转，倒数 3·2·1 | 第二次滚奏，倒数每个数字都打在拍点上 |
| 2:00–2:18 | 61–69 | 终章 | 片名重现，7 段光环全部点亮，最后粒子散成星尘 | 最强的 drop 加合唱，ba-ba-BAM 三连击后落在 D 大调 |

七大领域与图标的对应如下。图标会对每条要点做出反应，比如预算柱在三个拍点上依次充满，台阶逐级点亮。

| # | 领域（书中章节） | 粒子图标 | 要点 |
|---|---|---|---|
| 01 | The Hidden Driver: Your Beliefs About Emotion | 心形 | 允许自己“去感受”；所有情绪都有意义；以好奇代替评判 |
| 02 | From Chaos to Clarity: Labeling Your Emotions | 混沌粒子瞬间排成点阵 | 先识别再回应；区分愤怒与挫败、快乐与满足；词汇越精确，调节越有效 |
| 03 | Quieting Your Mind and Body | 随呼吸缩放的光环 | 深呼吸是“主策略”；从战或逃切换到休息与消化；必要，但不充分 |
| 04 | Redirecting Your Thoughts | 每个拍点转 45° 的框 | 积极自我对话；心理距离；用重构代替责怪 |
| 05 | Cultivating Emotional Strength Through Relationships | 两个互相靠近的环 | 共同调节；别独自担忧；一起回忆美好经历 |
| 06 | Optimizing Your Emotion Regulation Budget | 三根依次充满的柱子 | 睡眠 7–8 小时；每天运动 20–30 分钟；吃天然食物、喝够水 |
| 07 | Becoming the Best Version of Yourself | 台阶和星 | 行动与价值观一致；失败时复盘、善待自己；Practice makes permanent |

## 卡点怎么做到的

`timeline.py` 是唯一的时间表，节拍网格、文字、粒子编队、冲击、whoosh 和鼓谱都定义在这里。`music.py` 和 `render.py` 读同一份数据，所以画面里的每次冲击、粒子落定、文字砸入和屏幕震动，与对应的音效落在同一个采样点上，不需要事后手动对齐。

- 粒子编队的时间安排成“落定即强拍”：whoosh 从拍前 0.5 秒开始，粒子在强拍那一帧到位，同一刻触发冲击音效。
- 爆炸式编队（0:08、0:40、2:00）正好相反：冲击就是起爆点，粒子先飞散，再重新拼成文字。
- Drop 段的每个底鼓都会给粒子一次径向脉冲和轻微的镜头推近，画面会跟着鼓点“呼吸”。

## 重新生成

```bash
pip install numpy scipy pillow opencv-python-headless
./make.sh        # 下载字体 → 合成配乐 → 渲染画面（4 核约 8 分钟）→ 混流
```

单独预览某几秒的静帧：

```bash
python3 render.py preview 8.5 42 60   # 输出到 build/preview/
```

字体使用 Noto Sans SC、Noto Serif SC、Cinzel 和 Montserrat（均为 SIL OFL 许可），由 `make.sh` 从 Google Fonts 下载，不随仓库提交。

## 内容来源

- 目录与七大领域：书中的 “Dealing with Feeling Wheel” 练习页（pp. 270–276，作者官网公开）和公共图书馆书目
- 情绪调节的定义与各领域的具体建议：耶鲁情绪智力中心发布的 “Dealing with Feeling: Tips for Healthy Emotion Regulation”
- “100% 后天习得”“约三分之一的人童年被允许去感受”“约 10% 受过扎实教育”“呼吸是主策略”“重构而非责怪”“共同调节”：Brackett 本人在 Next Big Idea Club 发表的 5 个要点文章
- “从控制到管理、从消除到接纳并善用”：出版社的图书介绍

视频是对书中框架的浓缩概括，不是原文引用。
