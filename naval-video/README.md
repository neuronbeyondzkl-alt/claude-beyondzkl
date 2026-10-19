# 纳瓦尔的智慧 · 视频总结

一支约 **5 分 51 秒**、1080p / 30fps 的中文解说视频，总结纳瓦尔·拉维坎特（Naval Ravikant）关于**财富、幸福与人生**的核心观点。
视觉全部使用 Loyel 渐变蓝色板（#F4F7FB → #263B54），带中文配音、逐句字幕和环境配乐。

成片：[`naval-wisdom.mp4`](naval-wisdom.mp4)

## 内容结构

| 时间 | 章节 | 要点 |
|------|------|------|
| 0:00 | 开场 · 纳瓦尔是谁 | AngelList 联合创始人、天使投资人；2018 推文风暴 → 2020《纳瓦尔宝典》 |
| 0:34 | **第一部分 · 财富** | 财富 ≠ 金钱 ≠ 地位；出租时间无法致富，要拥有股权 |
| | 工具 01 · 专长 | 无法被培训的知识；对你像玩，对别人像工作 |
| | 工具 02 · 责任 | 用自己的名字承担风险 |
| | 工具 03 · 杠杆 | 劳动力、资本（需许可）→ 代码、媒体（无需许可） |
| | 判断力 | 杠杆是判断力的放大器 |
| | 财富公式 | 专长 + 责任 + 杠杆 = 产品化你自己；学会销售，学会构建 |
| | 长期游戏 | 与长期主义的人玩长期游戏，一切回报来自复利 |
| 3:30 | **第二部分 · 幸福** | 幸福是技能也是选择；欲望是一份契约；平静是静止的幸福 |
| | 练习 | 冥想、健康、阅读，以及「改变 / 接受 / 离开」 |
| 4:54 | **第三部分 · 人生** | 三大决定（住哪里、和谁、做什么）；无法决定就是不；对行动急切、对结果耐心；退休的定义 |
| 5:27 | 总结 | 一张思维导图串起全部观点 |

### 引文来源

- Naval Ravikant (2018). *How to Get Rich (without getting lucky)* — 推文风暴。
- Eric Jorgenson (2020). *The Almanack of Naval Ravikant: A Guide to Wealth and Happiness*（中译本《纳瓦尔宝典》）。

画面中的英文引句均为纳瓦尔原话；中文旁白为意译与归纳，并非逐字翻译。

## 怎么做出来的

| 文件 | 作用 |
|------|------|
| `script.json` | 旁白脚本，按字幕分句；每个分句的序号同时驱动画面元素出场 |
| `tts.py` | 用 edge-tts（`zh-CN-YunxiNeural`）逐场景合成配音，按词边界对齐字幕，生成 `build/timeline.json` |
| `music.py` | 用 numpy 程序化生成环境配乐（D 大调 pad + 低音 + 五声音阶铃音 + 卷积混响） |
| `fonts.py` | 从 Google Fonts 按实际用到的 553 个字符子集化下载 Noto Serif SC / Noto Sans SC |
| `index.html` | 22 个场景的动画画面，`window.renderAt(t)` 按时间确定性地渲染任意一帧；加 `?play` 可在浏览器里直接预览 |
| `render.mjs` | Playwright 驱动 Chromium 逐帧截图，分 4 路并行编码为 H.264 |
| `build.sh` | 串起整条流水线，最后混音（配乐在人声下自动闪避）并做响度标准化（-16 LUFS） |

重新生成：

```bash
pip install edge-tts numpy      # 另需 node + playwright、ffmpeg
./build.sh                      # 产物：naval-wisdom.mp4
```

预览动画（不出视频）：在仓库根目录 `npx http-server .`，打开 `/naval-video/index.html?play`（需先跑过 `tts.py` 和 `fonts.py`）。
