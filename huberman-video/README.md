# 光 · 息 · 动 · 专注 · 勇气 —— Andrew Huberman 智慧速览（1 分 46 秒）

一支用代码从零生成的“热血 · 燃”风格短片：光、影、荧光粒子 + 150 BPM D 小调史诗混合配乐。
画面与音乐共用一条时间线（`timeline.py`），每一次鼓点、冲击、字幕落版都卡在同一帧上。

成片：`huberman_wisdom.mp4`（1920×1080 · 30 fps · H.264 + AAC 256 kbps）

## 结构与卡点

| 时间 | 小节 | 段落 | 画面 | 音乐 / 音效 |
|---|---|---|---|---|
| 0:00 | 1–8 | 序章 | 黑暗中一颗随心跳明灭的光点，粒子缓慢聚拢、内爆 | 低频长音 + 心跳 → 加速脉冲 + 上升音效 → 静默 0.2 秒 |
| 0:12.8 | 9–12 | 片名 | 粒子爆散、冲击波环、横向镜头光晕，`ANDREW HUBERMAN` 落版 | BOOM + Braam 铜管 + 太鼓 |
| 0:19.2 | 13–20 | 01 光 | 太阳从山脊后升起，体积光束与光中尘埃，山体剪影即“影” | 半速律动 + 高音晶体闪烁 |
| 0:32.0 | 21–28 | 02 息 | 粒子球随“吸—再吸—长呼”胀缩，呼气时粒子散开 | 抽离段：吸气/呼气噪声与画面同步 |
| 0:44.8 | 29–36 | 03 多巴胺 | 发光曲线：4 次尖峰后跌破基线；冷水暴露后升至约 2.5 倍并持平 | 每个尖峰配一次 zap；冷水段配霜雪与上升音效 |
| 0:57.6 | 37–44 | 04 专注 | 粒子涡旋汇聚成焦点 → 神经网络脉冲 → 新连接“重塑” | 四拍底鼓 + 琶音开滤波 → 军鼓滚奏 → 静默 |
| 1:10.4 | 45–52 | 05 勇气 | 光速跃迁星流（optic flow），尽头一点强光 | Drop：全鼓组 + 弦乐断奏 + 英雄主题旋律 |
| 1:23.2 | 53–60 | 总结 | 六个关键词逐小节砸下并排成一行，最后两句落版 | 每小节一次冲击 + 太鼓 |
| 1:36.0 | 61–64 | 尾声 | 光束从上方洒落，片尾致谢与证据声明 | 最终 BOOM + 合唱长音 + 钟声余韵 |

每一行字幕都在下拍落地（前 0.12 秒放大飞入，落地瞬间闪光 + 扫光），对应音效是落地前 0.45 秒开始的反向气流声和落地时的铜管重音或太鼓；章节切换处是全屏闪白、冲击波环与镜头震动，对应 BOOM。三处 Drop 前（0:12.6、1:10.0、1:35.8）画面与音乐同时“抽空”。

## 配色

所有画面只输出亮度，再经过一条 Loyel 渐变蓝色阶（`#263B54 → #2B4868 → #2E5076 → #376392 → #497DAE → #6C9AC4 → #9FBDDA → #CCDBEB → #E8EEF6 → #F4F7FB`）上色：
阴影端为黑色，高光端为白色，中间严格落在这十档色值之间。

## 内容来源

片中观点整理自 Huberman Lab 公开节目，引用的研究：

- Balban MY, …, Spiegel D, Huberman AD (2023). *Brief structured respiration practices enhance mood and reduce physiological arousal.* Cell Reports Medicine 4:100895.
- Šrámek P, et al. (2000). *Human physiological responses to immersion into water of different temperatures.* Eur J Appl Physiol 81:436–442.
- Salay LD, Ishiko N, Huberman AD (2018). *A midline thalamic circuit determines reactions to visual threat.* Nature 557:183–189.
- de Voogd LD, et al. (2018). *Eye-movement intervention enhances extinction via amygdala deactivation.* J Neurosci 38:8694–8706.

部分建议（如晨光时长、冷暴露的剂量）属于由机制研究外推的经验法则，证据等级不一；片尾已注明“请批判性地使用，不构成医疗建议”。

## 重新生成

```bash
pip install numpy scipy opencv-python-headless pillow
./fetch_fonts.sh                                   # Noto Sans SC（SIL OFL 1.1）
python3 music.py build/music.wav                   # 约 35 秒
python3 render.py stills 22.5 76                   # 可选：先看静帧
python3 render.py video build/music.wav build/huberman_wisdom.mp4 4   # 4 进程约 6 分钟，CRF 20 母版约 97 MB
# 仓库里的成片是两遍编码压到 3.3 Mbps 的版本（约 48 MB，低于 GitHub 单文件限制）
ffmpeg -i build/huberman_wisdom.mp4 -c:v libx264 -preset slow -b:v 3300k -pass 1 -an -f mp4 /dev/null
ffmpeg -i build/huberman_wisdom.mp4 -c:v libx264 -preset slow -b:v 3300k -maxrate 9000k -bufsize 12000k \
       -pass 2 -pix_fmt yuv420p -c:a copy -movflags +faststart huberman_wisdom.mp4
```

| 文件 | 作用 |
|---|---|
| `timeline.py` | 速度、小节、和弦、鼓点、冲击、字幕文案与出现时间——唯一的时间源 |
| `music.py` | 用 numpy/scipy 合成全部声音：底鼓、军鼓、太鼓、冲击、Braam、超级锯齿 Pad、合唱、贝斯、主旋律、弦乐断奏、上升/反向气流、呼吸声；侧链压缩、混响、母带均衡与限幅（−1 dBTP，约 −12 LUFS） |
| `render.py` | 无状态粒子系统（每帧都是时间的纯函数，可多进程并行）：体积光、山体剪影、粒子球、多巴胺曲线、涡旋与神经网络、跃迁星流、文字落版与扫光、辉光、镜头震动、Loyel 色阶 |

拉丁文字使用系统自带的 Inter 字体，中文使用 Noto Sans SC。
