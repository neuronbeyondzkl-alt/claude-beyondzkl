# 时间之脑 · THE TEMPORAL BRAIN

一支 3 分 04 秒的 1080p 神经科学视频：用光、影与荧光粒子，构建人类大脑在**回忆过去、想象未来、专注当下**三种情境下的完整神经图景。配乐是“热血 / 燃”的混合史诗预告片风格（D 小调，120 BPM），画面的每一次闪白、冲击波、节点点亮都与鼓点、重击和音效卡在同一帧上。

- 成片：`output/the-temporal-brain.mp4`（H.264 1080p30 + AAC 256k）
- 画面与声音全部由本目录的 Python 代码程序化生成，没有使用任何素材、模型或音频采样。
- 配色只使用 Loyel 渐变蓝十档（`#F4F7FB` … `#263B54`），另加纯白高光。

## 分镜

| 时间 | 段落 | 画面 | 神经科学要点 | 卡点 |
|---|---|---|---|---|
| 0:00–0:12 | 冷开场 | 黑暗中一颗神经元随心跳搏动，荧光尘埃被卷入漩涡 | — | 心跳 lub-dub、钟表滴答；上升音收束在 0:12 |
| 0:12–0:28 | 片名 · 聚形 | 片名重击，粒子炸开后聚成 3D 玻璃脑 | 约 860 亿神经元 | 太鼓每一击都有一道从前往后扫过的光波；“回忆过去 / 想象未来 / 专注当下”三个词落在 0:22、0:23、0:24 的鼓点上 |
| 0:28–1:08 | **01 回忆过去** | 线索 → 海马；模式补全面板每拍点亮一个神经元；海马涟漪；海马向视觉、听觉皮层与杏仁核回放；DMN 节点逐拍点亮；记忆印迹在 1:00 被打散、1:04 被重写 | CA3 模式补全；尖波涟漪先于回忆 1–2 s；皮层复现；默认模式网络；再巩固 | 涟漪落在军鼓上；回放光流从军鼓出发；两次重击 = 打散 / 重组；倒带音效 + 画面向左拖拽 |
| 1:08–1:48 | **02 想象未来** | 三块记忆碎片飞入海马，重组成画面右侧的“未来晶体”；回忆与想象共享网络；海马受损时晶体碎裂；位置细胞沿路径逐个放电；vmPFC 估值、额顶网络耦合；加速冲向未来 | 建构性情景模拟；共享核心网络；遗忘症患者难以想象新情景；海马序列预演；vmPFC 估值与延迟折扣；DMN–FPCN 耦合 | 碎片起飞对齐三声呼啸；16 个位置细胞对齐十六分音符琶音；1:47.5 磁带停转，画面冻结 |
| 1:48–2:32 | **03 专注当下** | 寂静：只剩心跳与滴答；光流从眼睛经丘脑闸门进入视皮层；突显网络闪烁；跷跷板翻转；注意光锥锁定目标；蓝斑增益波；α/γ 波形；走神时画面失焦、声音变闷，2:24 “觉察，然后拉回” | 丘脑门控；突显网络切换；DAN 与 DMN 反相关；蓝斑-去甲肾上腺素增益；α 抑制与 γ 同步；46.9% 的清醒时间在走神；冥想与注意训练 | 丘脑闸门随心跳开合；突显网络随底鼓闪；2:04 重击翻转跷跷板；蓝斑波从每个底鼓出发；γ 爆发对齐底鼓；走神 = 整体低通，觉察 = 重击 + 瞬间清晰 |
| 2:32–2:52 | 合 · 时间机器 | 记忆印迹、未来晶体、当下准星依次回归并汇入大脑；全部网络同时点亮 | 三种时间模式的整合 | 三连重击对齐三句字幕；终止和弦从 D 小调转到 D 大调 |
| 2:52–3:04 | 参考文献 | 31 条文献 | — | 钢琴尾声 |

## 卡点是怎么做到的

`timeline.py` 是唯一的节拍来源（120 BPM：1 拍 = 0.5 s = 30 fps 下正好 15 帧）。它生成全部事件：底鼓、军鼓、太鼓、重击、上升音、反向镲、心跳、滴答、涟漪、琶音、铜管顿音、磁带停转、“走神”低通、重击前 1/4 拍的留白。

- `music.py` 按这些事件逐个合成声音（采样级精确）。
- `scenes.py` 按同一份事件计算画面：重击 → 闪白 + 冲击波 + 震动；底鼓 → 大脑“呼吸”与亮度脉冲；上升音 → 体积光与辉光增强；留白 → 画面压暗。
- 右下角的 **SPIKE TRAIN（神经放电序列）** 把正在发生的鼓点画成放电尖峰，向左滚动，可以直接看到声画同步。

因为两边读的是同一份时间表，画面与声音的偏差不超过半帧（≤16.7 ms）。

## 配乐

全部在 `music.py` 里用 numpy / scipy 合成：

- 鼓组：底鼓（音高包络正弦 + 点击）、军鼓（音调 + 带通噪声 + 拍手）、踩镲、通鼓、太鼓、镲片
- 重击：次低频下潜 + 金属泛音 + 扫频噪声，大重击叠加 BRAAAM（D1/A1/D2/F2 的 supersaw）
- 上升音：带通扫频噪声 + 三个八度的上滑音 + 加速颤音；反向镲；呼啸；倒带；磁带停转（对整个混音做变速重采样）
- 声部：顿弓弦乐十六分音符、带共振峰的合唱铺底、铜管主题（过去 / 未来 / 终章三次变奏）、当下段的铜管顿音、未来段的乒乓延迟琶音、钢琴
- 混音：底鼓侧链、2.8 s 卷积混响、指挥式力度曲线、软拐点限幅器
- 成品响度：−11.7 LUFS，动态范围 14.7 LU，真峰值 −1.2 dBTP

## 画面

- `geometry.py`：用隐式曲面（椭球、胶囊的平滑并集）拼出大脑、颞叶、小脑、脑干，在表面均匀撒约 10 万个粒子；脑回起伏写进距离场，所以法线自带沟回明暗；中央沟、外侧裂单独刻画；内部有海马、丘脑、杏仁核、胼胝体。脑区节点使用近似 MNI 坐标（示意，不是个体扫描数据）。
- `render.py`：双线性粒子泼溅 + 四档景深尺寸、多级辉光、径向体积光、变形镜头横向光斑、冲击波、色调映射、暗角、遮幅。
- `hud.py`：时间轴、神经放电序列、脑区标注、模式补全 / 局部场电位 / 跷跷板 / 估值面板、字幕排版（Noto Sans SC、Oswald、Montserrat）。

## 重新生成

```bash
pip install numpy scipy pillow opencv-python-headless
python3 make_video.py                       # 完整成片（4 核约 25 分钟）
python3 make_video.py --start 28 --end 44   # 只渲染一段预览
python3 music.py output/score.wav           # 只生成配乐
```

首次运行会从 Google Fonts 的 GitHub 仓库下载三种字体到 `cache/fonts/`（SIL OFL 1.1）。需要 `ffmpeg`。

## 科学说明与证据强度

| 论断 | 证据强度 | 主要来源 |
|---|---|---|
| 回忆依赖海马对部分线索的模式补全 | 中等（动物电生理 + 人类 fMRI） | Marr 1971；Horner et al. 2015 |
| 人类自由回忆前 1–2 s，海马涟漪率升高 | 中等（颅内记录，癫痫患者样本） | Norman et al. 2019 |
| 回忆会重新激活编码时的感觉皮层 | 强 | Wheeler et al. 2000；Danker & Anderson 2010 |
| 记忆被提取后进入不稳定期，需要再巩固 | 强（动物）/ 中等（人类） | Nader et al. 2000 |
| 回忆与想象未来共享核心网络 | 强（多项 fMRI 及元分析） | Addis et al. 2007；Szpunar et al. 2007；Benoit & Schacter 2015 |
| 海马受损的遗忘症患者难以想象新情景 | 中等（小样本神经心理学） | Hassabis et al. 2007 |
| 位置细胞序列预演通往目标的路径 | 中等（啮齿类） | Pfeiffer & Foster 2013；Dragoi & Tonegawa 2011 |
| 想象未来降低延迟折扣，与 vmPFC–海马交互有关 | 中等 | Peters & Büchel 2010；Benoit et al. 2011 |
| 注意网络与默认网络在静息态呈反相关 | 强（但全局信号回归会影响结果，【争议】） | Fox et al. 2005 |
| 突显网络在 DMN 与执行网络之间切换 | 中等（以模型与相关性证据为主） | Menon & Uddin 2010；Seeley et al. 2007 |
| 约 46.9% 的清醒时间在走神 | 中等（经验取样，智能手机用户样本） | Killingsworth & Gilbert 2010 |

视频为科普表达，做了简化：例如把“网络”画成少数几个节点，把 γ 振荡画成随鼓点出现的爆发。

## 参考文献

1. Azevedo FAC et al. (2009) J Comp Neurol 513:532–541
2. Marr D (1971) Phil Trans R Soc Lond B 262:23–81
3. Horner AJ et al. (2015) Nat Commun 6:7462
4. Norman Y et al. (2019) Science 365:eaax1030 · [doi:10.1126/science.aax1030](https://doi.org/10.1126/science.aax1030)
5. Wheeler ME, Petersen SE, Buckner RL (2000) PNAS 97:11125–11129
6. Danker JF, Anderson JR (2010) Psychol Bull 136:87–102
7. Raichle ME et al. (2001) PNAS 98:676–682
8. Andrews-Hanna JR et al. (2010) Neuron 65:550–562
9. Nader K, Schafe GE, LeDoux JE (2000) Nature 406:722–726
10. Bartlett FC (1932) *Remembering*. Cambridge University Press
11. Schacter DL, Addis DR (2007) Phil Trans R Soc B 362:773–786
12. Addis DR, Wong AT, Schacter DL (2007) Neuropsychologia 45:1363–1377
13. Szpunar KK, Watson JM, McDermott KB (2007) PNAS 104:642–647
14. Benoit RG, Schacter DL (2015) Neuropsychologia 75:450–457
15. Hassabis D et al. (2007) PNAS 104:1726–1731
16. Pfeiffer BE, Foster DJ (2013) Nature 497:74–79
17. Dragoi G, Tonegawa S (2011) Nature 469:397–401
18. Peters J, Büchel C (2010) Neuron 66:138–148
19. Benoit RG, Gilbert SJ, Burgess PW (2011) J Neurosci 31:6771–6779
20. Spreng RN et al. (2010) NeuroImage 53:303–317
21. Saalmann YB, Kastner S (2011) Neuron 71:209–223 · [doi:10.1016/j.neuron.2011.06.027](https://doi.org/10.1016/j.neuron.2011.06.027)
22. Menon V, Uddin LQ (2010) Brain Struct Funct 214:655–667
23. Seeley WW et al. (2007) J Neurosci 27:2349–2356
24. Fox MD et al. (2005) PNAS 102:9673–9678
25. Corbetta M, Shulman GL (2002) Nat Rev Neurosci 3:201–215
26. Aston-Jones G, Cohen JD (2005) Annu Rev Neurosci 28:403–450
27. Jensen O, Mazaheri A (2010) Front Hum Neurosci 4:186
28. Fries P (2005) Trends Cogn Sci 9:474–480
29. Killingsworth MA, Gilbert DT (2010) Science 330:932
30. Hasenkamp W et al. (2012) NeuroImage 59:750–760 · [doi:10.1016/j.neuroimage.2011.07.008](https://doi.org/10.1016/j.neuroimage.2011.07.008)
31. Brewer JA et al. (2011) PNAS 108:20254–20259
