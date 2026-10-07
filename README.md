# NEUROPLASTICITY · 神经可塑性粒子叙事网页

参考 [usta.agency](https://usta.agency/) 的「滚动驱动粒子形变」叙事形式，把主题换成神经科学中的**神经可塑性**。
随着页面向下滚动，32,768 个低饱和蓝荧光粒子依次重组为 7 个层级的结构，配乐的配器也逐层加厚。

## 运行

- **直接打开**：双击 `index.html` 即可（脚本已打包为普通 `<script>`，不依赖本地服务器）。
- **本地服务器**：`npm run serve`，然后访问 `http://localhost:8080`。
- **单文件版**：`npm run build:single` 生成 `dist/neuroplasticity.html`，CSS/JS 全部内联，便于发布到只接受单个 HTML 的环境。

浏览器需支持 WebGL2（Chrome / Edge / Firefox / Safari 15+）。配乐需点击「点燃配乐」或右上角「开启配乐」后才会播放（浏览器自动播放策略）。

## 九个画面与对应形态

| 序号 | 英文标题 | 层级 | 粒子形态 | 尺度 |
|---|---|---|---|---|
| 首页 | NEUROPLASTICITY | — | 神经火种：光核 + 放射状突起 + 轨道环 | — |
| 01 | BRAIN | 大脑 | 两半球（回/沟纹理、中央沟）、颞叶、小脑叶片、脑干、内部白质纤维 | ≈ 15 cm |
| 02 | NEURON & GLIA | 神经元与胶质细胞 | 锥体神经元（顶树突、基底树突、树突棘、有髓轴突与郎飞结、终末）、星形胶质细胞与毛细血管终足、少突胶质细胞 | 4–100 μm |
| 03 | SYNAPSE | 突触 | 突触前终扣（囊泡、Ω 形胞吐、线粒体）、突触间隙递质、蘑菇形树突棘与 PSD 受体、星形胶质包绕、新生树突棘 | ≈ 20 nm |
| 04 | TRACTS | 神经束 | DTI 风格纤维束：胼胝体弓、左右弓状束、放射冠-内囊下行束 | 1 μm – 10 cm |
| 05 | CIRCUIT | 神经环路 | 海马三突触环路：EC → DG → CA3 → CA1 → 下托 → EC，含抑制性中间神经元与神经调质输入 | mm |
| 06 | NETWORK | 神经网络 | 连接组：模块化节点、局部连接、枢纽之间的富人俱乐部长程连接 | 全脑 |
| 07 | COGNITION & BEHAVIOR | 认知与行为 | 冲刺的人形：头部大脑、脑 → 脊髓 → 四肢的运动指令脉冲、思维波环、速度线、地面冲击波 | ms – 一生 |
| 尾页 | KEEP REWIRING | — | ∞ 双纽线纤维束（终身可塑） | — |

所有形态都在 `src/shapes.js` 中程序化生成，没有外部 3D 模型。沿轴突、纤维、通路流动的亮点是动作电位脉冲，方向符合生理走向，例如树突 → 胞体 → 轴突，以及海马环路的顺序传递。

## 配色

- **主体（每个形态占 76%–87%）**：Loyel 渐变蓝 `#CCDBEB` `#9FBDDA` `#6C9AC4` `#497DAE` `#376392`，以及少量 `#E8EEF6` 高光。Bloom 辉光也染成同色系的蓝。
- **语义点缀（每个形态占 13%–24%）**：琥珀 = 动作电位 / 能量，薰衣草 = 神经递质 / 少突胶质，薄荷 = 星形胶质，珊瑚 = 受体 / 血管，水青 = 髓鞘纤维，兰紫 = 抑制性中间神经元 / 调制。
- 后处理采用**保色相的高光压缩**，粒子密集处保持低饱和蓝，不会叠加成白色。

## 页面内可调（右上角「荧光调节」）

| 控件 | 作用 |
|---|---|
| 荧光强度 0–200%（预设：微光 / 标准 / 炽燃） | 同时调节粒子亮度、光晕柔度、Bloom 强度与半径、英文标题的霓虹外发光 |
| 色彩丰富度 0–100% | 0% 时所有点缀色收回为低饱和蓝 |
| 粒子尺寸 50–160% | — |
| 配乐音量 0–100% | — |
| 英文标题字体 | 在 6 款静态展示字体间切换 |

设置会记在浏览器本地；其他交互：鼠标靠近粒子会把它们推开，右侧菱形导航可跳转层级，`Esc` 关闭控制台。

## 英文字体

大标题和层级名是**中空描边 + 外层蓝色荧光**（`-webkit-text-stroke` 加三层 `drop-shadow`）。
原站字体因网络限制未能直接核实，默认使用 **Anton**。如果已知原站字体，在 `assets/style.css` 中修改一行即可：

```css
--font-display: 'Anton', 'Bebas Neue', Impact, 'Arial Narrow Bold', sans-serif;
```

字体面板只列出静态字体（非可变字体）。可变字体的字形轮廓有重叠，描边时会露出内部交叉线。

## 配乐《REWIRE》

`src/audio.js` 用 Web Audio API 实时合成，没有音频文件，也不涉及版权。

- D 小调，136 BPM，16 小节循环：Dm–B♭–F–C | Dm–B♭–C–A | B♭–C–Dm–Dm | B♭–C–A–A
- 乐器：太鼓、底鼓（带侧链压缩感）、军鼓与滚奏、镲、失真贝斯、弦乐顿弓（16 分音符）、超锯齿和弦垫、英雄主旋律、铜管齐奏，另有卷积混响和延迟
- 配器强度随层级递进（1 → 5）：首页只有和弦垫、顿弓和太鼓，到「认知与行为」时全编制齐奏
- 每次切换层级触发一次冲击音效，底鼓同步驱动粒子脉动

## 目录结构

```
index.html            页面结构与全部文字内容
assets/style.css      样式（Loyel 色板 token、中空霓虹字、响应式）
assets/app.js         打包产物（由 src/ 构建，已提交，可直接使用）
src/main.js           滚动、布局、控制台、主循环
src/particles.js      Three.js 粒子场：形态纹理、形变着色器、Bloom、背景与色调映射
src/shapes.js         9 种形态的程序化生成
src/audio.js          实时合成配乐
src/noise.js          种子随机数与 Simplex 噪声
scripts/build-artifact.mjs  单文件版构建脚本
```

## 开发

```bash
npm install
npm run build          # 打包 src/ → assets/app.js
npm run dev            # 监听模式
npm run build:single   # 额外生成 dist/neuroplasticity.html
```

## 性能与无障碍

- 小屏幕或 CPU 核数 ≤ 4 的设备自动减半粒子数（16,384），并限制像素比。
- `prefers-reduced-motion` 时减弱形变炸散、自转和脉冲。
- 标签页隐藏时暂停配乐。
- 不支持 WebGL2 时，文字内容与配乐仍可正常使用。

## 文中引用的研究

- Azevedo et al., 2009, *J Comp Neurol*：人脑约 860 亿个神经元
- Draganski et al., 2004, *Nature*：学习杂耍后灰质暂时增加
- Maguire et al., 2000, *PNAS*：出租车司机海马后部体积与驾龄相关
- Araque et al., 1999, *Trends Neurosci*：三方突触
- McKenzie et al., 2014, *Science*：运动技能学习需要新生髓鞘
- Sorrells et al., 2018, *Nature*：成年人海马神经发生的争议
- Hebb, 1949, *The Organization of Behavior*
- Bliss & Lømo, 1973, *J Physiol*：长时程增强（LTP）
- Matsuzaki et al., 2004, *Nature*：单个树突棘的 LTP 结构基础
- Scholz et al., 2009, *Nat Neurosci*：训练引起白质结构变化
- Fields, 2015, *Nat Rev Neurosci*：活动依赖性髓鞘化
- Liu et al., 2012, *Nature*：海马记忆印迹细胞
- Watts & Strogatz, 1998, *Nature*：小世界网络
- van den Heuvel & Sporns, 2011, *J Neurosci*：人类连接组的富人俱乐部
- Murphy & Corbett, 2009, *Nat Rev Neurosci*：卒中康复中的可塑性
- Erickson et al., 2011, *PNAS*：有氧运动增加海马体积
- Walker & Stickgold, 2006, *Annu Rev Psychol*：睡眠、记忆与可塑性

内容为科普性质，不构成医疗建议。
