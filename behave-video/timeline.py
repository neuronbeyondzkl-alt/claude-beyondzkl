"""《Behave》浓缩视频的时间轴：配乐、音效、粒子形体与字幕共用这一份数据。

所有时间都落在 120 BPM 的节拍网格上：1 拍 = 0.5 秒 = 15 帧（30 fps），
1 小节 = 2 秒 = 60 帧，所以每一个重音、转场和字幕弹出都能精确到帧。
"""

BPM = 120
BEAT = 60.0 / BPM          # 0.5 s
BAR = 4 * BEAT             # 2.0 s
FPS = 30
SR = 48000
W, H = 1920, 1080
TOTAL_BARS = 62
DURATION = TOTAL_BARS * BAR  # 124 s


def T(bar, beat=0.0):
    """小节/拍 → 秒。"""
    return (bar * 4 + beat) * BEAT


# ---------------------------------------------------------------- 配色
# Loyel 渐变蓝（唯一合法的蓝色），加上封面上的绿/橙：绿 = 最好的一面，橙 = 最坏的一面。
LOYEL = {
    10: "#F4F7FB", 20: "#E8EEF6", 30: "#CCDBEB", 40: "#9FBDDA", 50: "#6C9AC4",
    60: "#497DAE", 70: "#376392", 80: "#2E5076", 90: "#2B4868", 100: "#263B54",
}
GREEN = "#9CC448"   # 取自封面绿色粒子
ORANGE = "#E08A3C"  # 取自封面橙色粒子
WHITE = "#FFFFFF"

# ---------------------------------------------------------------- 段落
SECTIONS = [
    # name,        start bar, end bar
    ("intro",       0,  4),
    ("title",       4,  8),
    ("question",    8, 12),
    ("ladder",     12, 30),
    ("converge",   30, 32),
    ("montage",    32, 36),
    ("usthem",     36, 40),
    ("hope",       40, 48),
    ("finale",     48, 56),
    ("end",        56, 62),
]

# ---------------------------------------------------------------- 倒带阶梯（全书前半部分）
LADDER = [
    # 计时器, 英文章节名, 主题, 一句话
    ("1 秒前", "CH.2 · ONE SECOND BEFORE", "神经系统",
     "杏仁核点燃恐惧与攻击，\n前额叶负责踩下刹车", "brain"),
    ("几秒到几分钟前", "CH.3 · SECONDS TO MINUTES BEFORE", "感官线索",
     "一闪而过的面孔、气味和声音，\n在你察觉之前改写反应", "eye"),
    ("几小时到几天前", "CH.4 · HOURS TO DAYS BEFORE", "激素",
     "睾酮、催产素、皮质醇\n不制造行为，只放大倾向", "steroid"),
    ("几天到几个月前", "CH.5 · DAYS TO MONTHS BEFORE", "神经可塑性",
     "经历重塑神经元：\n长期压力让杏仁核更敏感", "neuron"),
    ("青春期", "CH.6 · ADOLESCENCE", "前额叶最后成熟",
     "大脑的“刹车”\n要到二十五岁前后才完全装好", "brain_mature"),
    ("童年与子宫", "CH.7 · BACK TO THE CRIB, BACK TO THE WOMB", "早期环境",
     "童年的逆境与母体环境，\n为成年的你埋下伏笔", "womb"),
    ("受精卵", "CH.8 · BACK TO WHEN YOU WERE JUST A FERTILIZED EGG", "基因",
     "基因不是命运，\n而是不同环境下的“如果—那么”", "dna"),
    ("数百到数千年前", "CH.9 · HUNDREDS TO THOUSANDS OF YEARS BEFORE", "文化",
     "集体或个人、游牧或农耕，\n祖先的生态塑造你的直觉", "crowd"),
    ("数百万年前", "CH.10 · THE EVOLUTION OF BEHAVIOR", "进化",
     "亲缘选择、互惠利他：\n合作与竞争都写进了物种", "tree"),
]
LADDER_START = 12          # 每一级占 2 小节
LADDER_NODES = ["1 秒", "分钟", "小时", "月", "青春期", "子宫", "受精卵", "千年", "百万年"]

MONTAGE = [  # 全书后半部分：每 2 拍一个主题词
    ("我们与他们", "US VS. THEM"), ("等级", "HIERARCHY"), ("服从", "OBEDIENCE"),
    ("道德", "MORALITY"), ("共情", "EMPATHY"), ("隐喻", "METAPHOR"),
    ("自由意志", "FREE WILL"), ("战争与和平", "WAR AND PEACE"),
]

FINALE_WORDS = ["神经", "感官", "激素", "经验", "基因", "文化", "进化"]

# ---------------------------------------------------------------- 重音（画面闪光、震动、粒子爆发都挂在这里）
# kind: big = 主冲击；step = 阶梯冲击；word = 蒙太奇字；pulse = 轻拍
HITS = [(T(4), "big", 1.0), (T(30), "big", 1.0), (T(32), "big", 1.0),
        (T(48), "big", 1.0), (T(56), "big", 1.15), (T(58), "button", 0.8)]
HITS += [(T(LADDER_START + 2 * i), "step", 0.75 + 0.03 * i) for i in range(len(LADDER))]
HITS += [(T(32 + i // 2, 2 * (i % 2)), "word", 0.7) for i in range(1, len(MONTAGE))]
HITS += [(T(36), "step", 0.8), (T(38), "step", 0.6)]
HITS += [(T(50 + i // 4, i % 4), "pulse", 0.55) for i in range(len(FINALE_WORDS))]
HITS += [(T(51, 3), "pulse", 0.7), (T(52), "step", 0.8), (T(54), "step", 0.9)]
HITS.sort()

# ---------------------------------------------------------------- 粒子形体时间线
# (开始秒, 形体名, 过渡秒, 过渡方式, 参数)
SHAPES = [
    (0.0,          "seed",        0.1,  "swarm", {}),
    (T(0, 2),      "dust",        1.6,  "swarm", {}),
    (T(1, 2),      "figure",      1.8,  "swarm", {"side": 0}),
    (T(4),         "title",       0.9,  "burst", {}),
    (T(8),         "clock",       1.0,  "burst", {}),
]
for i, step in enumerate(LADDER):
    SHAPES.append((T(LADDER_START + 2 * i), step[4], 0.75, "burst", {"x": 0.62}))
SHAPES += [
    (T(30),        "figure_rings", 0.8, "burst", {}),
    (T(31, 2),     "implode",     0.35, "swarm", {}),
]
for i, (cn, en) in enumerate(MONTAGE):
    SHAPES.append((T(32 + i // 2, 2 * (i % 2)), f"word:{cn}", 0.22, "snap", {}))
SHAPES += [
    (T(36),        "two_groups",  0.8,  "burst", {}),
    (T(38),        "circle_of_us", 1.6, "swarm", {}),
    (T(40),        "troop",       1.6,  "swarm", {}),
    (T(48),        "figure_rings", 0.8, "burst", {"big": 1}),
    (T(52),        "figure",      1.2,  "swarm", {"side": 0, "scale": 1.15}),
    (T(54),        "figure_light", 1.0, "swarm", {}),
    (T(56),        "title",       0.8,  "burst", {"final": 1}),
    (T(59, 2),     "drift",       2.5,  "swarm", {}),
]

# ---------------------------------------------------------------- 字幕
# style: line（中文主句）/ big（大标题）/ sub（副句）/ en（英文小字）/ word（蒙太奇大字）
#        tag（主题词）/ counter（倒带计时器）/ tagline（英文斜体）/ note（小注）
# pos: (x, y) 为画面比例坐标，anchor 为对齐方式；color 为字体主色
TEXTS = [
    dict(t0=T(0, 2), t1=T(2), text="同一个动作", style="line", pos=(0.5, 0.80)),
    dict(t0=T(2), t1=T(3), text="可能来自我们最坏的一面", style="line", pos=(0.5, 0.80), color=ORANGE),
    dict(t0=T(3), t1=T(3, 3.75), text="也可能来自我们最好的一面", style="line", pos=(0.5, 0.80), color=GREEN),

    dict(t0=T(5), t1=T(7, 3.5), text="人类最好与最坏行为背后的生物学", style="sub", pos=(0.5, 0.66)),
    dict(t0=T(5, 1), t1=T(7, 3.5), text="THE BIOLOGY OF HUMANS AT OUR BEST AND WORST", style="en", pos=(0.5, 0.715)),
    dict(t0=T(6), t1=T(7, 3.5), text="ROBERT M. SAPOLSKY  ·  罗伯特·M.萨波尔斯基", style="en", pos=(0.5, 0.82), color=LOYEL[40]),

    dict(t0=T(8), t1=T(9, 3.5), text="一个行为发生了。", style="big", pos=(0.5, 0.44)),
    dict(t0=T(9), t1=T(9, 3.5), text="它为什么会发生？", style="sub", pos=(0.5, 0.56)),
    dict(t0=T(10), t1=T(11, 3.5), text="答案不止一个——", style="big", pos=(0.5, 0.44)),
    dict(t0=T(11), t1=T(11, 3.5), text="我们得一路倒带", style="sub", pos=(0.5, 0.56)),

    dict(t0=T(30), t1=T(31, 2), text="所有这些，都汇聚在同一秒", style="big", pos=(0.5, 0.86)),

    dict(t0=T(36), t1=T(37, 3.6), text="不到十分之一秒，\n大脑就把人分成“我们”和“他们”", style="line", pos=(0.5, 0.80)),
    dict(t0=T(38), t1=T(39, 3.6), text="但“我们”的边界，\n可以被重新划定", style="line", pos=(0.5, 0.80)),

    dict(t0=T(40), t1=T(41, 3.6), text="肯尼亚，一个狒狒群", style="line", pos=(0.5, 0.82)),
    dict(t0=T(40, 1), t1=T(41, 3.6), text="FOREST TROOP · SAPOLSKY & SHARE, 2004", style="en", pos=(0.5, 0.885), color=LOYEL[40]),
    dict(t0=T(42), t1=T(43, 3.6), text="最好斗的雄性，因一场结核病相继死去", style="line", pos=(0.5, 0.82)),
    dict(t0=T(44), t1=T(45, 3.6), text="群体变得平和，\n新来的成员也继承了这种文化", style="line", pos=(0.5, 0.80)),
    dict(t0=T(46), t1=T(47, 3.7), text="狒狒能改变，我们也能。", style="big", pos=(0.5, 0.82)),

    dict(t0=T(48), t1=T(49, 3.6), text="行为，从来没有单一的原因", style="big", pos=(0.5, 0.86)),
    dict(t0=T(52), t1=T(53, 3.6), text="理解它，才能少一些最坏，多一些最好", style="line", pos=(0.5, 0.86)),
    dict(t0=T(54), t1=T(55, 3.7), text="去做那件更难、但正确的事", style="big", pos=(0.5, 0.86)),

    dict(t0=T(56, 1), t1=T(61, 2), text="《行为》 · 人类最好与最坏行为背后的生物学", style="sub", pos=(0.5, 0.67)),
    dict(t0=T(56, 2), t1=T(61, 2), text="ROBERT M. SAPOLSKY", style="en", pos=(0.5, 0.725), color=LOYEL[40]),
    dict(t0=T(58), t1=T(61, 2), text="It’s complicated.", style="tagline", pos=(0.5, 0.82)),
    dict(t0=T(59), t1=T(61, 2), text="读书浓缩视频 · 内容依据 Robert M. Sapolsky《Behave》(2017)，非官方作品",
         style="note", pos=(0.5, 0.93)),
]

for i, (counter, en, tag, line, _) in enumerate(LADDER):
    b = LADDER_START + 2 * i
    TEXTS += [
        dict(t0=T(b), t1=T(b + 1, 3.5), text=en, style="en", pos=(0.085, 0.30), anchor="l", color=LOYEL[40]),
        dict(t0=T(b), t1=T(b + 1, 3.5), text=counter, style="counter", pos=(0.085, 0.395), anchor="l"),
        dict(t0=T(b, 1), t1=T(b + 1, 3.5), text=tag, style="tag", pos=(0.085, 0.50), anchor="l",
             color=ORANGE if i in (0, 3) else GREEN if i in (4, 6) else LOYEL[30]),
        dict(t0=T(b, 2), t1=T(b + 1, 3.5), text=line, style="body", pos=(0.085, 0.60), anchor="l"),
    ]

for i, (cn, en) in enumerate(MONTAGE):
    t0 = T(32 + i // 2, 2 * (i % 2))
    TEXTS.append(dict(t0=t0, t1=t0 + 2 * BEAT - 0.04, text=en, style="en", pos=(0.5, 0.72),
                      color=LOYEL[30], anim="slam"))

for i, w in enumerate(FINALE_WORDS):
    t0 = T(50 + i // 4, i % 4)
    x = 0.5 + (i - 3) * 0.118
    TEXTS.append(dict(t0=t0, t1=T(51, 3.75), text=w, style="tag", pos=(x, 0.86), anim="slam",
                      color=GREEN if i % 2 == 0 else LOYEL[30]))


def all_text():
    chars = set()
    for t in TEXTS:
        chars |= set(t["text"])
    for step in LADDER:
        chars |= set("".join(step[:4]))
    for cn, en in MONTAGE:
        chars |= set(cn + en)
    chars |= set("".join(FINALE_WORDS) + "".join(LADDER_NODES)) | set("BEHAVE")
    return "".join(sorted(c for c in chars if c not in "\n"))
