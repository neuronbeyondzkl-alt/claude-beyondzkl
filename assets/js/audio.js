// 深蓝潜行 · Into the Deep —— 生成式水下电影配乐
// 全部由原生 Web Audio API 实时合成：不加载音频文件、不用 AudioWorklet、不依赖外部库，
// 因此可以直接从 file:// 打开，也能在严格 CSP 的沙箱 iframe 中运行。
//
// 音乐设计
//   调性 / 速度：D 小调，56 BPM，4/4 拍；固定节拍网格 + 前瞻调度器（每 100 ms 向前排 0.3 s）。
//   和声：透光/弱光层  Dm9 – B♭maj9 – Fmaj9 – Cadd9   （i–VI–III–VII，每个和弦 2 小节，8 小节一轮）
//         无光层       Dm(add9) – B♭maj7 – Gm9 – A7sus4（i–VI–iv–v，更暗的小调色彩、更低的声部）
//         深渊层       同上，但每个和弦 4 小节，节奏更“辽阔”。
//         两组持久振荡器轮流承担和弦，交叉淡入淡出——换和弦时没有任何滑音。
//   动机：8 小节旋律 A–D–E–F | E–D | F–D–C–A | C–F–G–A | G–E | G–E–D | E（第三句是第一句上移三度的模进），
//         由柔和的玻璃/卡林巴音色演奏，经过附点八分音符的乒乓延迟与混响；每隔一轮完整出现一次，
//         浅层的空档轮只留下四个长音作为远处的回声。
//         透光层第二遍“问答”时第 2、4 句升高八度；弱光层第二遍整体降八度；
//         无光层只奏首句且降八度；深渊层把首句按两倍时值“增值”演奏。
//   层次：铺底和弦 + 高空泛音（透光层的微光）+ 次低音（根音、缓慢膨胀）+ 海浪褐噪声 + 海面细碎水声
//         + 弱光层八分音符琶音 + 无光/深渊层的闷心跳、稀疏声呐、深海低鸣与长音
//         + 场景点缀：蓝鲸鲸歌、水母竖琴琶音、灯笼鱼光点、鮟鱇诱饵光、深渊长音。
//   深度：主“水下”低通滤波器的截止频率随下潜深度连续下降（9.5 kHz → 650 Hz），是整首曲子的粘合剂。
//
// 安全：一次性声音全部 stop() 并在 onended 时断开；每类声音都有并发上限；
// 输出链 粘合压缩 → 软削波 → master → 限幅器，保证疯狂点击也不会削顶。

const AC = typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : undefined;

const BPM = 56;
const BEAT = 60 / BPM;            // ≈1.071 s
const STEP = BEAT / 4;            // 十六分音符 ≈0.268 s
const BAR = 16;                   // 每小节 16 格
const LOOKAHEAD = 0.3;            // 每次调度向前看的时长（秒）
const TICK_MS = 100;              // 调度器周期
const DELAY_T = BEAT * 0.75;      // 附点八分音符 ≈0.804 s
const VOL_REF = 0.7;              // 在这个音量下校准响度（master 上 RMS ≈ -16 dBFS）

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pc = (m) => ((m % 12) + 12) % 12;
const zoneOfDepth = (d) => (d < 200 ? 0 : d < 1000 ? 1 : d < 4000 ? 2 : 3);

// ---------------------------------------------------------------------------
// 和声（MIDI 音高）：root = 次低音根音；pad = 五声部铺底；air = 两个高空泛音
// 相邻和弦之间保留共同音、其余声部级进，交叉淡化时听起来是连贯的。
// ---------------------------------------------------------------------------
const PROG_LIGHT = [
  { name: 'Dm9', root: 38, pad: [50, 53, 60, 64, 69], air: [76, 81] },     // D2 | D3 F3 C4 E4 A4 | E5 A5
  { name: 'B♭maj9', root: 34, pad: [46, 53, 60, 62, 69], air: [74, 81] },  // B♭1 | B♭2 F3 C4 D4 A4
  { name: 'Fmaj9', root: 41, pad: [48, 53, 57, 64, 67], air: [76, 79] },   // F2 | C3 F3 A3 E4 G4
  { name: 'Cadd9', root: 36, pad: [48, 55, 62, 64, 67], air: [74, 79] },   // C2 | C3 G3 D4 E4 G4
];
const PROG_DARK = [
  { name: 'Dm(add9)', root: 38, pad: [45, 50, 53, 57, 64], air: [69, 76] }, // A2 D3 F3 A3 E4
  { name: 'B♭maj7', root: 34, pad: [46, 50, 53, 57, 62], air: [69, 74] },   // B♭2 D3 F3 A3 D4
  { name: 'Gm9', root: 31, pad: [43, 46, 53, 57, 62], air: [70, 74] },      // G2 B♭2 F3 A3 D4
  { name: 'A7sus4', root: 33, pad: [45, 52, 55, 62, 64], air: [69, 76] },   // A2 E3 G3 D4 E4
];
for (const c of [...PROG_LIGHT, ...PROG_DARK]) {
  c.pcs = new Set([c.root, ...c.pad, ...c.air].map(pc));
  c.arp = c.pad.map((m) => m + 12);  // 琶音用的五个和弦音（铺底上移八度）
}

// 动机：[拍, MIDI, 时值(拍)]，共 8 小节 = 32 拍，每两小节对应一个和弦，所有长音都是当时的和弦音
const MOTIF = [
  [0, 69, 1.5], [1.5, 74, 0.5], [2, 76, 1], [3, 77, 2.5], [5.5, 76, 0.5], [6, 74, 2],      // Dm9：   A D E F · E D
  [8, 77, 1.5], [9.5, 74, 0.5], [10, 72, 1], [11, 69, 3],                                 // B♭maj9：F D C A
  [16, 72, 1.5], [17.5, 77, 0.5], [18, 79, 1], [19, 81, 2.5], [21.5, 79, 0.5], [22, 76, 2], // Fmaj9： C F G A · G E（模进）
  [24, 79, 1.5], [25.5, 76, 0.5], [26, 74, 2], [28, 76, 4],                               // Cadd9： G E D · E
];

// 琶音型（八分音符，2 小节 16 个），数字为和弦音序号，null 为休止（留给延迟回声）
const ARP_PAT = [0, 2, 4, 3, 1, 3, 2, null, 0, 2, 4, 3, 2, null, 1, null];

// 水层：铺底滤波、动机形态、出现间隔（轮）、湿声比例
const ZONE = [
  { padCut: 2600, motif: 'full', every: 2, verb: 0.85, delay: 0.5 },   // 透光层
  { padCut: 1650, motif: 'full', every: 2, verb: 1.0, delay: 0.68 },   // 弱光层
  { padCut: 980, motif: 'head', every: 2, verb: 1.05, delay: 0.55 },   // 无光层
  { padCut: 720, motif: 'aug', every: 1, verb: 1.15, delay: 0.5 },     // 深渊层
];

// 每个场景的编配（0..1 电平 / 概率）。缺省项见 DEF。gain = 场景响度补偿（按实测校准）。
// bub：每小节气泡簇数；ping：每小节声呐概率；whale：每个和弦鲸歌概率；jelly：每小节水母琶音概率；lantern：每格光点概率
const DEF = { pad: 0, air: 0, bass: 0, hiss: 0, bub: 0, arp: 0, heart: 0, hb: 1, ping: 0, drone: 0, lure: 0, whale: 0, whaleVol: 1, jelly: 0, lantern: 0, gain: 1 };
const ARR = [
  /* 0 夜海海面 */ { pad: 0.9, air: 1.0, bass: 0.8, hiss: 1.0, bub: 0.3 },
  /* 1 珊瑚礁   */ { pad: 0.9, air: 0.9, bass: 0.8, hiss: 0.7, bub: 1.4 },
  /* 2 海星     */ { pad: 0.9, air: 0.85, bass: 0.8, hiss: 0.55, bub: 1.0 },
  /* 3 海马     */ { pad: 0.9, air: 0.85, bass: 0.8, hiss: 0.45, bub: 0.9 },
  /* 4 鲎       */ { pad: 0.95, air: 0.7, bass: 0.85, hiss: 0.35, bub: 0.8 },
  /* 5 海龟     */ { pad: 0.95, air: 0.65, bass: 0.85, hiss: 0.25, bub: 0.6, whale: 0.18, whaleVol: 0.45 },
  /* 6 蝠鲼     */ { pad: 0.95, air: 0.55, bass: 0.9, bub: 0.9, whale: 0.22, whaleVol: 0.5 },
  /* 7 鲨鱼     */ { pad: 1.0, air: 0.3, bass: 1.0, arp: 0.45, heart: 0.35 },
  /* 8 蓝鲸     */ { pad: 0.95, air: 0.25, bass: 0.95, arp: 0.3, whale: 0.85, gain: 0.94 },
  /* 9 水母     */ { pad: 0.95, air: 0.4, bass: 0.85, arp: 0.5, jelly: 0.6 },
  /* 10 灯笼鱼  */ { pad: 0.95, air: 0.3, bass: 0.85, arp: 0.6, lantern: 0.24 },
  /* 11 鮟鱇    */ { pad: 1.0, bass: 1.0, heart: 0.5, ping: 0.3, drone: 0.35, lure: 1.0, gain: 0.88 },
  /* 12 深渊    */ { pad: 0.9, bass: 1.0, heart: 0.5, hb: 2, ping: 0.5, drone: 1.0, lure: 0.12, gain: 0.85 },
].map((r) => Object.assign({}, DEF, r));
const SCENE_DEPTH = [0, 10, 18, 25, 30, 60, 120, 180, 300, 550, 800, 2000, 4000];

// 各层的基础电平（与 ARR 相乘），按实测响度校准
const LV = {
  pad: 1, air: 1, bass: 1, waves: 0.32, hiss: 0.38, rumble: 0.28, drone: 1, lure: 1.3, heart: 0.45,
  bell: 0.15, pluck: 0.085, harp: 0.07, blip: 0.06, ping: 0.075, whale: 0.55, bubble: 0.024,
};

// 软削波曲线：|x| < 0.6 完全线性，之后平滑地逼近 0.85（WaveShaper 会把输入夹在 ±1）
function softClipCurve() {
  const n = 4096, c = new Float32Array(n), k = 0.6, h = 0.25;
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1, a = Math.abs(x);
    c[i] = Math.sign(x) * (a < k ? a : k + h * Math.tanh((a - k) / h));
  }
  return c;
}

export class OceanAudio {
  constructor() {
    // 注意：这里不创建 AudioContext（还没有用户手势）
    this.ctx = null;
    this.master = null;
    this.on = false;
    this.volume = 0.7;
    this.scene = 0;
    this.arr = ARR[0];
    this.zone = 0;
    this.chord = PROG_LIGHT[0];
    this._depth = 0;
    this._depthApplied = -1;
    this._depthT = -1;
    this._needReset = true;
    this._wantOn = false;
    this._timer = null;
    this._suspendTimer = null;
    this._starting = null;
    this.active = { bell: 0, pluck: 0, harp: 0, blip: 0, ping: 0, whale: 0, bub: 0, click: 0, sting: 0, fx: 0 };
    this._clickT = -10; this._clickK = 0; this._whumpT = -10; this._ascendUntil = 0;
    this._tgt = new Map();    // 各混音参数最近一次的目标值（_glide 用来去重）
  }

  get isOn() { return this.on; }

  _live() { return this.on && !!this.ctx && this.ctx.state === 'running'; }

  // 老版 Safari 的 suspend()/resume() 可能不返回 Promise
  _suspend() { try { const p = this.ctx.suspend(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* 忽略 */ } }
  _resume() { try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); return p; } catch (e) { return null; } }

  // -------------------------------------------------------------------------
  // 节点小工具
  // -------------------------------------------------------------------------
  _gain(v = 1) { const g = this.ctx.createGain(); g.gain.value = v; return g; }
  _filter(type, freq, q = 0.7) { const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; return f; }
  _osc(type, freq) {
    const o = this.ctx.createOscillator();
    if (type === 'warm') { if (this._warm) o.setPeriodicWave(this._warm); else o.type = 'triangle'; } else o.type = type;
    o.frequency.value = freq;
    return o;
  }
  // 立体声声像；老版 Safari 没有 StereoPanner 时退化为普通增益（单声道居中）
  _panner(v = 0) {
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(v, -1, 1); return p; }
    return this.ctx.createGain();
  }
  // 持久的发送总线：in → 干声 / 乒乓延迟 / 混响
  _send(dest, dry, dly, verb) {
    const input = this._gain(1);
    if (dry) { const g = this._gain(dry); input.connect(g); g.connect(dest); }
    if (dly) { const g = this._gain(dly); input.connect(g); g.connect(this.delayIn); }
    if (verb) { const g = this._gain(verb); input.connect(g); g.connect(this.verbIn); }
    return input;
  }
  // 平滑地把参数推向目标（只用于“混音层”参数，调度器拥有的包络参数不走这里）
  // eps > 0：与上一次目标值的相对差不超过 eps 时直接跳过（setDepth 每帧调用，避免无意义的自动化事件）
  _glide(param, v, tau, eps = 0) {
    const last = this._tgt.get(param);
    if (eps > 0 && last !== undefined && Math.abs(v - last) <= eps * Math.max(Math.abs(last), 1e-3)) return;
    this._tgt.set(param, v);
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setTargetAtTime(v, t, Math.max(0.01, tau));
  }
  // 一次性声音收尾：所有声源结束后断开全部节点，并归还并发计数
  _done(kind, srcs, nodes, weight = 1) {
    this.active[kind] += weight;
    let left = srcs.length;
    const end = () => {
      if (--left > 0) return;
      this.active[kind] = Math.max(0, this.active[kind] - weight);
      for (const n of nodes) { try { n.disconnect(); } catch (e) { /* 已断开 */ } }
    };
    for (const s of srcs) s.onended = end;
  }

  // -------------------------------------------------------------------------
  // 构建音频图（第一次 start() 时调用）
  // -------------------------------------------------------------------------
  _init() {
    let ctx;
    // 'balanced'：比 'playback' 的缓冲小得多，点击音效能跟上画面里的声呐波；又比 'interactive' 更省电、更不易爆音
    try { ctx = new AC({ latencyHint: 'balanced' }); } catch (e) { ctx = new AC(); }
    this.ctx = ctx;
    const t0 = ctx.currentTime;
    try {
      const amps = [0, 1, 0.42, 0.22, 0.13, 0.08, 0.05, 0.03, 0.02];   // 温暖的谐波（比锯齿柔，比三角丰满）
      this._warm = ctx.createPeriodicWave(new Float32Array(amps.length), new Float32Array(amps));
    } catch (e) { this._warm = null; }

    // —— 输出链：粘合压缩 → 软削波（硬性保证峰值）→ master（音量）→ 限幅器 → 扬声器
    const comp = (c, thr, knee, ratio, atk, rel) => {
      c.threshold.value = thr; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = atk; c.release.value = rel;
      return c;
    };
    this.glue = comp(ctx.createDynamicsCompressor(), -12, 6, 3, 0.004, 0.25);
    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = softClipCurve();
    this.shaper.oversample = '2x';
    this.master = this._gain(0);
    this.limiter = comp(ctx.createDynamicsCompressor(), -1.5, 0, 20, 0.002, 0.12);
    this.glue.connect(this.shaper); this.shaper.connect(this.master);
    this.master.connect(this.limiter); this.limiter.connect(ctx.destination);

    // —— 子总线：音乐（经过“水下”低通）、生物光（较轻的低通）、交互音效
    this.sceneMix = this._gain(1); this.sceneMix.connect(this.glue);
    this.musicIn = this._gain(1); this.uwLP = this._filter('lowpass', 9500, 0.55);
    this.musicIn.connect(this.uwLP); this.uwLP.connect(this.sceneMix);
    this.bioIn = this._gain(1); this.bioLP = this._filter('lowpass', 14000, 0.5);
    this.bioIn.connect(this.bioLP); this.bioLP.connect(this.sceneMix);
    this.sfxIn = this._gain(1); this.sfxLP = this._filter('lowpass', 16000, 0.5);
    this.sfxIn.connect(this.sfxLP); this.sfxLP.connect(this.glue);

    // —— 混响：程序生成的约 4.4 s 脉冲响应（尾部越来越暗）
    this.verbIn = this._gain(1);
    const verbHP = this._filter('highpass', 110, 0.5);
    const verb = ctx.createConvolver(); verb.buffer = this._impulse(4.4);
    this.verbOut = this._gain(0.85);
    this.verbIn.connect(verbHP); verbHP.connect(verb); verb.connect(this.verbOut); this.verbOut.connect(this.musicIn);

    // —— 附点八分音符乒乓延迟：左 → 右 → 反馈（反馈环里低通，回声越来越暗）
    this.delayIn = this._gain(1);
    const dHP = this._filter('highpass', 260, 0.5);
    const dl = ctx.createDelay(2), dr = ctx.createDelay(2);
    dl.delayTime.value = DELAY_T; dr.delayTime.value = DELAY_T;
    const fbLP = this._filter('lowpass', 2600, 0.5), fb = this._gain(0.42);
    const merge = ctx.createChannelMerger(2);
    this.delayOut = this._gain(0.5);
    this.delayIn.connect(dHP); dHP.connect(dl); dl.connect(dr); dr.connect(fbLP); fbLP.connect(fb); fb.connect(dl);
    dl.connect(merge, 0, 0); dr.connect(merge, 0, 1);
    merge.connect(this.delayOut); this.delayOut.connect(this.musicIn);
    const dv = this._gain(0.3); this.delayOut.connect(dv); dv.connect(this.verbIn);

    // —— 各类一次性声音的发送总线（干 / 延迟 / 混响）
    this.sends = {
      bell: this._send(this.musicIn, 0.75, 0.34, 0.6),
      pluck: this._send(this.musicIn, 0.6, 0.45, 0.45),
      harp: this._send(this.bioIn, 0.65, 0.35, 0.7),
      blip: this._send(this.bioIn, 0.55, 0.5, 0.65),
      ping: this._send(this.bioIn, 0.45, 0.35, 1.0),
      whale: this._send(this.musicIn, 0.28, 0.12, 1.1),
      bubble: this._send(this.musicIn, 0.8, 0, 0.3),
      click: this._send(this.sfxIn, 0.8, 0.3, 0.6),
      clickBub: this._send(this.sfxIn, 0.85, 0, 0.35),
      sting: this._send(this.sfxIn, 0.7, 0.35, 0.9),
    };

    // —— 铺底和弦：两组持久振荡器（A/B）轮流承担和弦，交叉淡化
    this.padBus = this._gain(0);
    this.padLP = this._filter('lowpass', ZONE[0].padCut, 0.6);
    const padOut = this._gain(1), padVerb = this._gain(0.5);
    this.padBus.connect(this.padLP); this.padLP.connect(padOut); padOut.connect(this.musicIn);
    padOut.connect(padVerb); padVerb.connect(this.verbIn);
    const padLfo = this._osc('sine', 0.043), padLfoAmt = this._gain(180);   // 滤波器缓慢“呼吸”
    padLfo.connect(padLfoAmt); padLfoAmt.connect(this.padLP.frequency); padLfo.start(t0);

    this.airBus = this._gain(0);
    const airOut = this._gain(1), airVerb = this._gain(0.8);
    this.airBus.connect(airOut); airOut.connect(this.musicIn); airOut.connect(airVerb); airVerb.connect(this.verbIn);
    const airLfo = [0.13, 0.19].map((f) => {          // 高空泛音的缓慢明暗闪烁
      const o = this._osc('sine', f), g = this._gain(0.027); o.connect(g); o.start(t0); return g;
    });

    this.bassBus = this._gain(0);
    const bassLP = this._filter('lowpass', 240, 0.6);
    this.bassBus.connect(bassLP); bassLP.connect(this.musicIn);

    const PAD_W = [0.062, 0.056, 0.052, 0.048, 0.044];   // 低声部略重
    this.banks = [0, 1].map(() => {
      const padEnv = this._gain(0), airEnv = this._gain(0), bassEnv = this._gain(0);
      padEnv.connect(this.padBus); airEnv.connect(this.airBus); bassEnv.connect(this.bassBus);
      const voices = PAD_W.map((w, i) => {
        const a = this._osc('warm', 220), b = this._osc('warm', 220);
        a.detune.value = -3 - i; b.detune.value = 6 + i * 1.5;          // 轻微失谐的合唱感
        const g = this._gain(w), p = this._panner((i - 2) * 0.3);
        a.connect(g); b.connect(g); g.connect(p); p.connect(padEnv);
        a.start(t0); b.start(t0);
        return { a, b };
      });
      const air = [0, 1].map((i) => {
        const o = this._osc('sine', 660), g = this._gain(0.04), p = this._panner(i ? 0.6 : -0.6);
        airLfo[i].connect(g.gain);
        o.connect(g); g.connect(p); p.connect(airEnv); o.start(t0);
        return o;
      });
      const sub = this._osc('sine', 73), subG = this._gain(0.13);
      const tri = this._osc('triangle', 146), triG = this._gain(0.035);
      sub.connect(subG); subG.connect(bassEnv); tri.connect(triG); triG.connect(bassEnv);
      sub.start(t0); tri.start(t0);
      return { padEnv, airEnv, bassEnv, voices, air, sub, tri };
    });
    this.cur = 0;

    // —— 噪声床：褐噪声（海浪、深海低鸣）+ 白噪声（海面水声、上浮呼啸）
    this.brown = this._noiseBuf(6, true);
    this.white = this._noiseBuf(4, false);
    const bn = ctx.createBufferSource(); bn.buffer = this.brown; bn.loop = true; bn.start(t0);
    const wn = ctx.createBufferSource(); wn.buffer = this.white; wn.loop = true; wn.start(t0);

    this.wavesLP = this._filter('lowpass', 700, 0.4);
    const swell = this._gain(0.55);                      // 两个慢速 LFO 叠加成不规则的涌浪
    [[0.071, 0.33], [0.113, 0.12]].forEach(([f, a]) => {
      const o = this._osc('sine', f), g = this._gain(a); o.connect(g); g.connect(swell.gain); o.start(t0);
    });
    this.wavesMix = this._gain(0);
    const wavesVerb = this._gain(0.25);
    bn.connect(this.wavesLP); this.wavesLP.connect(swell); swell.connect(this.wavesMix);
    this.wavesMix.connect(this.musicIn); this.wavesMix.connect(wavesVerb); wavesVerb.connect(this.verbIn);

    const hissBP = this._filter('bandpass', 3200, 0.6), hissTrem = this._gain(0.5);
    [[0.29, 0.3], [0.47, 0.16]].forEach(([f, a]) => {
      const o = this._osc('sine', f), g = this._gain(a); o.connect(g); g.connect(hissTrem.gain); o.start(t0);
    });
    this.hissMix = this._gain(0);
    wn.connect(hissBP); hissBP.connect(hissTrem); hissTrem.connect(this.hissMix); this.hissMix.connect(this.musicIn);

    const rumbleLP = this._filter('lowpass', 85, 0.7);
    this.rumbleMix = this._gain(0);
    bn.connect(rumbleLP); rumbleLP.connect(this.rumbleMix); this.rumbleMix.connect(this.musicIn);

    // —— 深渊长音：D1 + D2 + A2 + D3，经过缓慢开合的低通
    this.droneMix = this._gain(0);
    const droneLP = this._filter('lowpass', 320, 0.8);
    const droneLfo = this._osc('sine', 0.031), droneLfoAmt = this._gain(130);
    droneLfo.connect(droneLfoAmt); droneLfoAmt.connect(droneLP.frequency); droneLfo.start(t0);
    [['sine', 26, 0.075], ['sawtooth', 38, 0.024], ['triangle', 45, 0.024], ['sawtooth', 50, 0.011]].forEach(([type, m, a], i) => {
      const o = this._osc(type, mtof(m)), g = this._gain(a);
      o.detune.value = i === 3 ? -7 : 0;
      o.connect(g); g.connect(droneLP); o.start(t0);
    });
    const droneVerb = this._gain(0.6);
    droneLP.connect(this.droneMix); this.droneMix.connect(this.musicIn); this.droneMix.connect(droneVerb); droneVerb.connect(this.verbIn);

    // —— 鮟鱇诱饵光：一个缓慢“呼吸”的 A5 长音（A 是无光层四个和弦共有的和弦音），微弱拍频与颤动
    this.lureMix = this._gain(0);
    const lureAmp = this._gain(0.5);
    const lurePulse = this._osc('sine', 1 / (2 * BEAT)), lurePulseAmt = this._gain(0.5);   // 每两拍一次明暗
    lurePulse.connect(lurePulseAmt); lurePulseAmt.connect(lureAmp.gain); lurePulse.start(t0);
    const l1 = this._osc('sine', mtof(81)), l2 = this._osc('sine', mtof(81) + 0.8), l3 = this._osc('sine', mtof(69));
    const lVib = this._osc('sine', 0.37), lVibAmt = this._gain(4);
    lVib.connect(lVibAmt); lVibAmt.connect(l1.frequency); lVibAmt.connect(l2.frequency); lVib.start(t0);
    const lMod = this._osc('sine', mtof(81) * 2.005), lModAmt = this._gain(45);     // 极轻的 FM，带一点诡异的金属光泽
    lMod.connect(lModAmt); lModAmt.connect(l1.frequency); lMod.start(t0);
    const lg1 = this._gain(0.05), lg2 = this._gain(0.035), lg3 = this._gain(0.025);
    l1.connect(lg1); l2.connect(lg2); l3.connect(lg3);
    [lg1, lg2, lg3].forEach((g) => g.connect(lureAmp));
    [l1, l2, l3].forEach((o) => o.start(t0));
    lureAmp.connect(this.lureMix);
    const lureDly = this._gain(0.25), lureVerb = this._gain(0.8);
    this.lureMix.connect(this.bioIn); this.lureMix.connect(lureDly); lureDly.connect(this.delayIn);
    this.lureMix.connect(lureVerb); lureVerb.connect(this.verbIn);

    // —— 心跳：一个持久的低频三角波，由调度器写入“咚-哒”包络（不新建节点）
    this.heartOsc = this._osc('triangle', 50);
    this.heartEnv = this._gain(0);
    this.heartMix = this._gain(0);
    const heartLP = this._filter('lowpass', 170, 0.9);
    this.heartOsc.connect(heartLP); heartLP.connect(this.heartEnv); this.heartEnv.connect(this.heartMix);
    this.heartMix.connect(this.musicIn);
    this.heartOsc.start(t0);
  }

  // 程序生成的混响脉冲：指数衰减（RT60 ≈ 4 s）+ 随时间变暗的单极点低通 + 少量早期反射
  _impulse(sec) {
    const ctx = this.ctx, sr = ctx.sampleRate, len = Math.floor(sr * sec), pre = Math.floor(sr * 0.022);
    const buf = ctx.createBuffer(2, len, sr);
    const dec = Math.pow(10, -3 / (sec * 0.92 * sr)), fadeIn = sr * 0.012;
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0, env = 1;
      for (let i = pre; i < len; i++) {
        const k = i / len, a = 0.78 - 0.7 * k;          // 越往后越暗：像水吸收高频
        lp += (Math.random() * 2 - 1 - lp) * a;
        d[i] = lp * env * Math.min(1, (i - pre) / fadeIn);
        env *= dec;
      }
      for (let r = 0; r < 7; r++) {
        const j = pre + Math.floor(sr * (0.008 + Math.random() * 0.07));
        if (j < len) d[j] += (Math.random() * 2 - 1) * 0.45 * (1 - r / 8);
      }
      const fade = Math.floor(sr * 0.08);
      for (let i = 0; i < fade; i++) d[len - 1 - i] *= i / fade;
    }
    return buf;
  }

  // 可无缝循环的噪声：多生成一段，与开头做等功率交叉淡化
  _noiseBuf(sec, brown) {
    const ctx = this.ctx, sr = ctx.sampleRate, n = Math.floor(sr * sec), f = Math.floor(sr * 0.25);
    const buf = ctx.createBuffer(2, n, sr), tmp = new Float32Array(n + f);
    for (let ch = 0; ch < 2; ch++) {
      let last = 0;
      for (let i = 0; i < n + f; i++) {
        const w = Math.random() * 2 - 1;
        if (brown) { last = (last + 0.02 * w) / 1.02; tmp[i] = last * 3.5; } else tmp[i] = w * 0.5;
      }
      const d = buf.getChannelData(ch);
      for (let i = 0; i < n; i++) d[i] = tmp[i];
      for (let i = 0; i < f; i++) { const k = i / f; d[i] = tmp[i] * Math.sqrt(k) + tmp[n + i] * Math.sqrt(1 - k); }
    }
    return buf;
  }

  // -------------------------------------------------------------------------
  // 公共接口
  // -------------------------------------------------------------------------
  async start() {
    // 先记下“想要开启”，再判断是否已有一次 start 在进行：
    // 否则 start() → stop() → start() 落在同一次启动等待期间时，最后的 start 会被吞掉（最终是关的）
    this._wantOn = true;
    if (this.on) return;
    if (this._starting) {
      try { await this._starting; } catch (e) { /* 忽略 */ }
      if (this._wantOn && !this.on && !this._starting && this.ctx) return this.start();
      return;
    }
    this._starting = (async () => {
      if (!AC) return;
      if (!this.ctx) this._init();
      clearTimeout(this._suspendTimer);
      if (this.ctx.state !== 'running') { try { await this._resume(); } catch (e) { /* 浏览器拒绝 */ } }
      if (!this._wantOn) { if (!this.on) this._suspend(); return; }   // 等待期间又被关掉了
      const now = this.ctx.currentTime;
      const fresh = this._needReset;
      const g = this.master.gain;
      g.cancelScheduledValues(now);
      if (fresh) {
        // 从引子重新开始：master 保持 0，先把上一次残留的和弦包络在 70 ms 内淡到 0，再从 t0 起淡入
        const t0 = now + 0.1;
        g.setValueAtTime(0, now);
        this._resetMusic(now, t0);
        g.setTargetAtTime(this._volGain(), t0, 0.8);
      } else {
        if (this.nextT < now) this.nextT = now + 0.05;
        g.setValueAtTime(g.value, now);                  // 先锚定当前值（可能正处在 stop 的淡出斜坡上）
        g.setTargetAtTime(this._volGain(), now, 0.8);
      }
      this.on = true;
      this._applyScene(fresh ? 0.05 : 1.2);
      this._depthApplied = this._depth; this._depthT = now;
      this._applyDepth(this._depth, fresh ? 0.05 : 0.4);
      if (!this._timer) this._timer = setInterval(() => this._tick(), TICK_MS);
      this._tick();
    })();
    try { await this._starting; } finally { this._starting = null; }
  }

  stop() {
    this._wantOn = false;
    if (!this.on || !this.ctx) { this.on = false; return; }
    this.on = false;
    clearInterval(this._timer); this._timer = null;
    const t = this.ctx.currentTime, g = this.master.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + 0.5);
    clearTimeout(this._suspendTimer);
    this._suspendTimer = setTimeout(() => {
      if (this.on || !this.ctx) return;
      this._needReset = true;                           // 下次开启时从引子重新开始
      this._suspend();
    }, 650);
  }

  async toggle() {
    if (this.on) this.stop(); else await this.start();
    return this.on;
  }

  setVolume(v) {
    this.volume = clamp(Number.isFinite(+v) ? +v : 0.7, 0, 1);
    if (this.ctx && this.on) this._glide(this.master.gain, this._volGain(), 0.12);
  }

  _volGain() { return this.volume / VOL_REF; }

  pause() { if (this.ctx && this.on && this.ctx.state === 'running') this._suspend(); }
  resume() { if (this.ctx && this.on && this.ctx.state !== 'running') this._resume(); }

  // 场景切换：index = 场景序号（决定点缀与编配），depthMeters = 叙事深度（决定水层与和声）
  setScene(index, depthMeters) {
    const i = clamp(Math.round(+index) || 0, 0, ARR.length - 1);
    if (i === this.scene) return;
    this.scene = i;
    this.arr = ARR[i];
    const d = Number.isFinite(+depthMeters) ? +depthMeters : SCENE_DEPTH[i];
    this.zone = zoneOfDepth(d);
    if (this.ctx && this.on) this._applyScene(2.2);
  }

  // 每帧调用：内部节流，只有深度明显变化且距上次至少 60 ms 才写 AudioParam
  setDepth(depthMeters) {
    const d = +depthMeters >= 0 ? +depthMeters : 0;
    this._depth = d;
    if (!this.on) return;
    const t = this.ctx.currentTime;
    if (t - this._depthT < 0.06) return;
    const last = this._depthApplied;
    if (Math.abs(d - last) < 0.3 + last * 0.004) return;
    this._depthT = t; this._depthApplied = d;
    this._applyDepth(d, 0.25);
  }

  // 编配：各层电平与水层参数
  _applyScene(tau) {
    const A = this.arr, Z = ZONE[this.zone];
    this._glide(this.padBus.gain, LV.pad * A.pad, tau);
    this._glide(this.airBus.gain, LV.air * A.air, tau);
    this._glide(this.bassBus.gain, LV.bass * A.bass, tau);
    this._glide(this.padLP.frequency, Z.padCut, tau);
    this._glide(this.heartMix.gain, LV.heart * A.heart, tau);
    this._glide(this.droneMix.gain, LV.drone * A.drone, tau * 1.6);
    this._glide(this.lureMix.gain, LV.lure * A.lure, tau * 1.2);
    this._glide(this.verbOut.gain, Z.verb, tau);
    this._glide(this.delayOut.gain, Z.delay, tau);
    this._glide(this.sceneMix.gain, A.gain, tau);
    this._hiss(tau);
  }

  // 深度：水下低通、海浪、深海低鸣
  _applyDepth(d, tau) {
    const L = clamp(Math.log10(1 + d) / Math.log10(4001), 0, 1);
    const uw = 9500 * Math.pow(650 / 9500, Math.pow(L, 1.4));   // 0 m 9.5 kHz → 300 m ≈1.9 kHz → 4000 m 650 Hz
    this._L = L;
    const e = 0.006;                                   // 相对变化 < 0.6% 的参数不重写
    this._glide(this.uwLP.frequency, uw, tau, e);
    this._glide(this.bioLP.frequency, clamp(uw * 2.6, 2200, 14000), tau, e);
    this._glide(this.sfxLP.frequency, clamp(uw * 3.5, 3000, 16000), tau, e);
    this._glide(this.wavesMix.gain, LV.waves * lerp(1, 0.12, smooth(0.2, 0.85, L)), tau, e);
    this._glide(this.wavesLP.frequency, 700 * Math.pow(160 / 700, L), tau, e);
    this._glide(this.rumbleMix.gain, LV.rumble * smooth(0.55, 1, L), tau, e);
    this._hiss(tau, e);
  }

  _hiss(tau, eps = 0) {
    const L = this._L || 0;
    this._glide(this.hissMix.gain, LV.hiss * this.arr.hiss * (1 - smooth(0, 0.45, L)), tau, eps);
  }

  // -------------------------------------------------------------------------
  // 调度器
  // -------------------------------------------------------------------------
  // now：当前时刻；t：第一个和弦（引子）开始的时刻。
  // 旧版在 t 处 setValueAtTime(0)，但紧接着 _setChord(t) 的 cancelScheduledValues(t) 会把它删掉，
  // 结果上一次停止前的和弦以满电平“挂”在引子下面再慢慢衰减。这里改为：锚定当前值 → 在 t 之前线性淡到 0。
  _resetMusic(now, t) {
    const fadeEnd = Math.max(now + 0.02, t - 0.03);
    for (const b of this.banks) {
      for (const p of [b.padEnv.gain, b.airEnv.gain, b.bassEnv.gain]) {
        p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(0, fadeEnd);
      }
    }
    const he = this.heartEnv.gain;
    he.cancelScheduledValues(now); he.setValueAtTime(he.value, now); he.linearRampToValueAtTime(0, fadeEnd);
    this.heartOsc.frequency.cancelScheduledValues(now);
    this.ci = -1;            // -1：先用一小节 VII 级和弦做引子，再进入 i 级与动机
    this.step = 0;
    this.nextT = t;
    this.chordStart = 0;
    this.chordEnd = 0;
    this.cycle = -1;
    this.motif = null;
    this.motifCount = 0;
    this._needReset = false;
  }

  _tick() {
    if (!this._live()) return;
    const now = this.ctx.currentTime, safe = now + 0.012;
    // 主线程卡顿 / 计时器被节流（> 0.2 s）时，下一格可能已经落在“过去”。
    // 绝不把音符排在过去：那样声源会立即开始、包络却从中途算起 → 没有起音的“咔”声。
    // 轻微迟到（≤ 80 ms）的那一格推迟到 safe 时刻演奏；更晚的格子整体跳过、不补发。
    if (this.nextT < safe - 0.08) {
      const n = Math.ceil((safe - this.nextT) / STEP);
      this.step += n; this.nextT += n * STEP;          // 跨过和弦边界时，由 _step → _nextChord 按小节线对齐
    }
    while (this.nextT < now + LOOKAHEAD) {
      const s = this.step, t = Math.max(this.nextT, safe);
      this.step++;
      this.nextT += STEP;
      try { this._step(s, t); } catch (e) {            // 单个音符出错也不能让调度器卡死在同一格
        if (!this._warned) { this._warned = true; console.warn('[OceanAudio] step error:', e); }
      }
    }
    // setDepth 停止调用（例如页面停在某处）时，把最后的深度补上
    if (Math.abs(this._depth - this._depthApplied) > 0.3 + this._depthApplied * 0.004) {
      this._depthApplied = this._depth; this._depthT = now;
      this._applyDepth(this._depth, 0.25);
    }
  }

  _step(s, t) {
    if (s >= this.chordEnd) this._nextChord(s, t);
    const A = this.arr, rel = s - this.chordStart, ch = this.chord;

    if (this.motif) this._motifStep(s, t);

    // 心跳（持久节点上的包络，开销极小，电平由 heartMix 决定）
    if (s % (4 * A.hb) === 0) this._heartbeat(t);

    // 弱光层琶音：八分音符和弦音，留出休止给附点八分延迟
    if (A.arp > 0 && (s & 1) === 0) {
      const k = (rel >> 1) % 16, idx = ARP_PAT[k];
      if (idx != null) {
        const vel = LV.pluck * A.arp * (k % 4 === 0 ? 1 : 0.72) * (this.motif ? 0.6 : 1) * rnd(0.9, 1.05);
        this._pluck(t, ch.arp[idx], vel, Math.sin(s * 0.7) * 0.5);
      }
    }

    // 环境气泡
    if (A.bub > 0 && Math.random() < A.bub / BAR) {
      this._bubbles(t + rnd(0, STEP), 3 + Math.floor(Math.random() * 5), 420, 1250, LV.bubble, rnd(-0.75, 0.75), this.sends.bubble, 0.12, 24);
    }

    // 灯笼鱼：高处闪烁的光点（和弦音，两到三个八度之上）
    if (A.lantern > 0 && Math.random() < A.lantern) {
      const tones = this._tonesIn(86, 100), k = Math.floor(Math.random() * tones.length), tt = t + rnd(0, STEP * 0.5), pan = rnd(-0.9, 0.9);
      const vel = LV.blip * rnd(0.55, 1);
      this._blip(tt, tones[k], vel, pan);
      // 一部分光点成对闪烁：紧接着亮起上方相邻的和弦音
      if (Math.random() < 0.35 && k + 1 < tones.length) this._blip(tt + STEP * 0.25, tones[k + 1], vel * 0.6, clamp(pan + 0.2, -1, 1));
    }

    if (rel % BAR === 0) {
      // 深层声呐：稀疏、协和（A5 / D6 / E6 中属于当前和弦的音）
      if (A.ping > 0 && Math.random() < A.ping) {
        const tones = [81, 86, 88].filter((m) => ch.pcs.has(pc(m)));
        this._ping(t + STEP * pick([0, 2, 6]), pick(tones.length ? tones : [81]), LV.ping * rnd(0.75, 1), this.sends.ping, rnd(-0.7, 0.7));
      }
      // 水母：竖琴般的上行琶音
      if (A.jelly > 0 && Math.random() < A.jelly) this._flourish(t + (rel === 0 ? STEP : 0), LV.harp * A.jelly / 0.6);
    }

    // 蓝鲸：和弦开始时的鲸歌
    if (rel === 0 && A.whale > 0 && Math.random() < A.whale) this._whale(t + BEAT * pick([0, 0.5, 1]), A.whaleVol);
  }

  _nextChord(s, t) {
    if (this.ci < 0) { this.ci = 3; this.len = BAR; }                       // 引子：从 VII（或 v）级进入
    else { this.ci = (this.ci + 1) % 4; this.len = (this.zone === 3 ? 4 : 2) * BAR; }
    // 和弦边界始终落在小节线上（step 0 起每 16 格一小节）。正常情况下 s 本身就在小节线上；
    // 卡顿跳格后 s 可能落在小节中间——仍把和弦起点对齐到所在小节的开头，
    // 这样琶音型、心跳、每小节事件和动机都不会相对小节线错位（错过的动机音符会被跳过）。
    const start = s - (s % BAR);
    this.chordStart = start;
    this.chordEnd = start + this.len;
    this.chord = (this.zone >= 2 ? PROG_DARK : PROG_LIGHT)[this.ci];
    this._setChord(this.chord, t, (this.chordEnd - s) * STEP, this.len * STEP > 12);
    if (this.ci === 0) this._newCycle(start);
  }

  // 交叉淡化：新和弦写入已经静音一个和弦长度的那组振荡器，再把两组的包络交换
  // dur：从 t 起本和弦还剩的时长；slow：深渊层的 4 小节长和弦（更慢的起音与释放）
  _setChord(c, t, dur, slow) {
    const inB = this.banks[1 - this.cur], outB = this.banks[this.cur];
    this.cur = 1 - this.cur;
    inB.voices.forEach((v, i) => {
      const f = mtof(c.pad[i]);
      v.a.frequency.setValueAtTime(f, t); v.b.frequency.setValueAtTime(f, t);
    });
    inB.air.forEach((o, i) => o.frequency.setValueAtTime(mtof(c.air[i]), t));
    inB.sub.frequency.setValueAtTime(mtof(c.root), t);
    inB.tri.frequency.setValueAtTime(mtof(c.root + 12), t);
    const atk = slow ? 2.0 : 1.15, rel = slow ? 2.4 : 1.45;
    // 清掉 t 之后残留的包络事件（例如卡顿后提前换和弦时，旧和弦尚未执行的低音膨胀）
    for (const b of [inB, outB]) for (const p of [b.padEnv.gain, b.airEnv.gain, b.bassEnv.gain]) p.cancelScheduledValues(t);
    inB.padEnv.gain.setTargetAtTime(1, t, atk);
    inB.airEnv.gain.setTargetAtTime(1, t + 0.5, atk * 1.4);
    // 次低音：进入后缓慢膨胀到最强，再回落
    inB.bassEnv.gain.setTargetAtTime(0.7, t, 0.6);
    inB.bassEnv.gain.setTargetAtTime(1, t + dur * 0.22, dur * 0.12);
    inB.bassEnv.gain.setTargetAtTime(0.6, t + dur * 0.6, dur * 0.18);
    outB.padEnv.gain.setTargetAtTime(0, t + 0.1, rel);
    outB.airEnv.gain.setTargetAtTime(0, t, rel * 0.9);
    outB.bassEnv.gain.setTargetAtTime(0, t, 0.55);
  }

  // 每 4 个和弦一轮；按水层决定这一轮是否出现动机、以什么形态出现
  _newCycle(s) {
    this.cycle++;
    this.motif = null;
    const Z = ZONE[this.zone], zone = this.zone;
    let notes, gain = [1, 0.95, 0.9, 0.85][zone];
    if (this.cycle % Z.every !== 0) {
      // 浅层的“空档”轮：只留四个长音作为远处的回声（透光层高八度），很轻
      if (zone > 1) return;
      notes = MOTIF.filter(([, , d]) => d >= 2.5).map(([b, m, d]) => [b, m + (zone === 0 ? 12 : 0), d]);
      gain *= 0.5;
      this.motif = { start: s, i: 0, gain, notes: notes.map(([b, m, d]) => ({ step: Math.round(b * 4), m, d })) };
      return;
    }
    const v = this.motifCount++ % 2;
    if (Z.motif === 'full') {
      notes = MOTIF.map(([b, m, d]) => {
        let o = 0;
        if (zone === 0 && v === 1 && ((b >= 8 && b < 16) || b >= 24)) o = 12;   // 问答：第 2、4 句升八度
        if (zone === 1 && v === 1) o = -12;                                     // 弱光层：低八度的卡林巴
        return [b, m + o, d];
      });
    } else if (Z.motif === 'head') {
      notes = MOTIF.filter(([b]) => b < 8).map(([b, m, d]) => [b, m - 12, d]);
    } else {
      notes = MOTIF.filter(([b]) => b < 8).map(([b, m, d]) => [b * 2, m - 12, d * 2]);   // 增值
    }
    this.motif = { start: s, i: 0, gain, notes: notes.map(([b, m, d]) => ({ step: Math.round(b * 4), m, d })) };
  }

  _motifStep(s, t) {
    const M = this.motif;
    while (M.i < M.notes.length && M.start + M.notes[M.i].step <= s) {
      const n = M.notes[M.i++];
      if (M.start + n.step < s) continue;                  // 已错过
      if (!this.chord.pcs.has(pc(n.m))) continue;          // 中途换了水层（和声变了），跳过不协和的音
      const accent = n.d >= 1.5 ? 1 : 0.78;
      const decay = clamp(n.d * BEAT * 1.3 + 1.4, 1.8, 6);
      const pan = clamp((n.m - 74) / 16, -0.55, 0.55);
      this._bell(t + rnd(0, 0.012), n.m, LV.bell * M.gain * accent * rnd(0.92, 1.04), decay, pan);
    }
    if (M.i >= M.notes.length) this.motif = null;
  }

  // 把音高吸附到当前和弦最近的和弦音（优先向下半音、其次向上，最多 ±2 半音）
  _snap(m) {
    const pcs = this.chord.pcs;
    for (const d of [0, -1, 1, -2, 2]) if (pcs.has(pc(m + d))) return m + d;
    return m;
  }

  _tonesIn(lo, hi) {
    const out = [], pcs = this.chord.pcs;
    for (let m = lo; m <= hi; m++) if (pcs.has(pc(m))) out.push(m);
    return out;
  }

  // -------------------------------------------------------------------------
  // 乐器（一次性声音）
  // -------------------------------------------------------------------------
  // 动机音色：柔和的 FM 槌击（比值 1:1，起音明亮迅速变圆）+ 一个玻璃般的高泛音
  _bell(t, midi, vel, decay, pan) {
    if (this.active.bell >= 8) return;
    const ctx = this.ctx, f = mtof(midi);
    const car = this._osc('sine', f), mod = this._osc('sine', f), tine = this._osc('sine', f * 4.02);
    const modAmt = ctx.createGain(), amp = ctx.createGain(), tAmp = ctx.createGain(), p = this._panner(pan);
    modAmt.gain.setValueAtTime(f * 1.2, t);
    modAmt.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.5);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(vel * 0.4, t + 0.45);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    tAmp.gain.setValueAtTime(0.0001, t);
    tAmp.gain.exponentialRampToValueAtTime(vel * 0.16, t + 0.004);
    tAmp.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    mod.connect(modAmt); modAmt.connect(car.frequency);
    car.connect(amp); tine.connect(tAmp); amp.connect(p); tAmp.connect(p); p.connect(this.sends.bell);
    const end = t + decay + 0.05;
    [car, mod, tine].forEach((o) => { o.start(t); o.stop(end); });
    this._done('bell', [car, mod, tine], [car, mod, tine, modAmt, amp, tAmp, p]);
  }

  // 琶音拨弦：三角波 + 快速闭合的低通
  _pluck(t, midi, vel, pan) {
    if (this.active.pluck >= 10) return;
    const ctx = this.ctx, f = mtof(midi);
    const o = this._osc('triangle', f), lp = ctx.createBiquadFilter(), amp = ctx.createGain(), p = this._panner(pan);
    lp.type = 'lowpass'; lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(Math.min(f * 7, 7000), t);
    lp.frequency.setTargetAtTime(f * 1.6, t + 0.01, 0.2);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vel, t + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    o.connect(lp); lp.connect(amp); amp.connect(p); p.connect(this.sends.pluck);
    o.start(t); o.stop(t + 1.65);
    this._done('pluck', [o], [o, lp, amp, p]);
  }

  // 竖琴：三角波 + 二倍频正弦
  _harp(t, midi, vel, pan) {
    if (this.active.harp >= 16) return;
    const ctx = this.ctx, f = mtof(midi);
    const o1 = this._osc('triangle', f), o2 = this._osc('sine', f * 2), g2 = ctx.createGain(), amp = ctx.createGain(), p = this._panner(pan);
    g2.gain.value = 0.28;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vel, t + 0.004);
    amp.gain.exponentialRampToValueAtTime(vel * 0.3, t + 0.5);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 2.3);
    o1.connect(amp); o2.connect(g2); g2.connect(amp); amp.connect(p); p.connect(this.sends.harp);
    [o1, o2].forEach((o) => { o.start(t); o.stop(t + 2.35); });
    this._done('harp', [o1, o2], [o1, o2, g2, amp, p]);
  }

  // 水母：从当前和弦音上行两个八度，渐强再渐弱，略带加速
  _flourish(t, vel) {
    const tones = this._tonesIn(62, 91);
    const st = Math.floor(Math.random() * 3), n = Math.min(8, tones.length - st);
    let tt = t;
    for (let i = 0; i < n; i++) {
      const shape = 0.55 + 0.45 * Math.sin(Math.PI * (i + 0.5) / n);
      this._harp(tt, tones[st + i], vel * shape, -0.6 + 1.2 * (i / Math.max(1, n - 1)));
      tt += STEP * 0.5 * (1 - i * 0.035);
    }
  }

  // 灯笼鱼光点：极短的高音正弦
  _blip(t, midi, vel, pan) {
    if (this.active.blip >= 12) return;
    const ctx = this.ctx, o = this._osc('sine', mtof(midi)), amp = ctx.createGain(), p = this._panner(pan);
    const dur = rnd(0.12, 0.26);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vel, t + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(amp); amp.connect(p); p.connect(this.sends.blip);
    o.start(t); o.stop(t + dur + 0.02);
    this._done('blip', [o], [o, amp, p]);
  }

  // 声呐：纯净正弦，极轻微的下滑，长混响
  _ping(t, midi, vel, send, pan = 0, cap = 4, kind = 'ping') {
    if (this.active[kind] >= cap) return;
    const ctx = this.ctx, f = mtof(midi), o = this._osc('sine', f), amp = ctx.createGain(), p = this._panner(pan);
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.993, t + 1.4);
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(vel, t + 0.006);
    amp.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.3);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    o.connect(amp); amp.connect(p); p.connect(send);
    o.start(t); o.stop(t + 2.45);
    this._done(kind, [o], [o, amp, p]);
  }

  // 气泡簇：每个气泡是一个音高快速上扬的短正弦（米纳尔特共振）
  _bubbles(t, n, lo, hi, vel, pan, send, spread = 0.12, cap = 32) {
    n = Math.min(n, cap - this.active.bub);
    if (n <= 0) return;
    const ctx = this.ctx, p = this._panner(pan), srcs = [], nodes = [p];
    p.connect(send);
    let tt = t;
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      const f0 = rnd(lo, hi), dur = rnd(0.045, 0.1) * Math.sqrt(700 / f0);
      o.frequency.setValueAtTime(f0, tt);
      o.frequency.exponentialRampToValueAtTime(f0 * rnd(1.6, 2.5), tt + dur);
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(vel * rnd(0.55, 1), tt + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
      o.connect(g); g.connect(p);
      o.start(tt); o.stop(tt + dur + 0.02);
      srcs.push(o); nodes.push(o, g);
      tt += rnd(0.015, spread);
    }
    this._done('bub', srcs, nodes, n);
  }

  // 鲸歌：锯齿波 + 次八度正弦，经两个移动的共振峰带通，音高在当前和弦的根音/五度/八度之间滑动，带颤音
  _whale(t, vol = 1) {
    if (this.active.whale >= 2) return;
    const ctx = this.ctx, base = this.chord.root + 12;
    // 轮廓用相对根音的半音数写（0 根音 / 7 五度 / 5 四度 / 12 八度 / 2 九度 / -5 下方四度），
    // 每个停留音再吸附到当前和弦最近的和弦音——旧版固定用 4/3 的“四度”，
    // 在 B♭maj9 上是调外的 E♭、在 Fmaj9 上是与 A 冲突的 B♭、在 Cadd9 上是与 E 冲突的 F，并停留近一秒。
    const CONTOURS = [
      [[0, 0], [1.3, 7], [2.4, 5], [3.3, 7], [4.7, 0], [5.8, -5]],
      [[0, -5], [1.0, 0], [2.1, 7], [2.8, 12], [4.0, 7], [5.4, 0]],
      [[0, 7], [0.9, 12], [1.9, 7], [3.1, 0], [4.3, 2], [5.5, -5]],
    ];
    const pat = pick(CONTOURS), dur = pat[pat.length - 1][0] + 0.8;
    const hz = pat.map(([, off]) => mtof(this._snap(base + off)));
    const o = this._osc('sawtooth', hz[0]), sub = this._osc('sine', hz[0] * 0.5);
    pat.forEach(([dt], k) => {
      o.frequency.setTargetAtTime(hz[k], t + dt, 0.22);
      sub.frequency.setTargetAtTime(hz[k] * 0.5, t + dt, 0.22);
    });
    const vib = this._osc('sine', rnd(3.8, 4.8)), vibAmt = ctx.createGain();
    vibAmt.gain.setValueAtTime(0, t);
    vibAmt.gain.linearRampToValueAtTime(24, t + dur * 0.45);
    vibAmt.gain.linearRampToValueAtTime(8, t + dur);
    vib.connect(vibAmt); vibAmt.connect(o.detune); vibAmt.connect(sub.detune);
    const bp1 = this._filter('bandpass', 380, 4.5), bp2 = this._filter('bandpass', 950, 5), g2 = this._gain(0.5);
    bp1.frequency.setValueAtTime(320, t);
    bp1.frequency.linearRampToValueAtTime(620, t + dur * 0.5);         // “呜——哇——呜”的元音变化
    bp1.frequency.linearRampToValueAtTime(360, t + dur);
    const subG = this._gain(0.25), amp = ctx.createGain(), p = this._panner(rnd(-0.5, 0.5));
    const v = LV.whale * vol;
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(v, t + 0.9);
    amp.gain.setValueAtTime(v, t + dur - 1.2);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.8);
    o.connect(bp1); o.connect(bp2); bp2.connect(g2); sub.connect(subG);
    bp1.connect(amp); g2.connect(amp); subG.connect(amp); amp.connect(p); p.connect(this.sends.whale);
    const end = t + dur + 0.9;
    [o, sub, vib].forEach((n) => { n.start(t); n.stop(end); });
    this._done('whale', [o, sub, vib], [o, sub, vib, vibAmt, bp1, bp2, g2, subG, amp, p]);
  }

  // 心跳：“咚——哒”，写在持久节点的包络上
  _heartbeat(t) {
    const e = this.heartEnv.gain, f = this.heartOsc.frequency, t2 = t + STEP;
    f.setValueAtTime(68, t); f.setTargetAtTime(44, t + 0.01, 0.07);
    e.setTargetAtTime(1, t, 0.008); e.setTargetAtTime(0, t + 0.05, 0.075);
    f.setValueAtTime(62, t2); f.setTargetAtTime(42, t2 + 0.01, 0.07);
    e.setTargetAtTime(0.6, t2, 0.008); e.setTargetAtTime(0, t2 + 0.05, 0.09);
  }

  // -------------------------------------------------------------------------
  // 交互音效
  // -------------------------------------------------------------------------
  // 鼠标点击：一次“生物荧光迸发”——和弦内的玻璃声呐音 + 一簇气泡；
  // 连续快速点击时音高沿和弦音逐级上行（形成闪烁的琶音），力度越大越亮、气泡越多。
  click(strength = 1, pan = 0) {
    if (!this._live()) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.008;
    const s = clamp(Number.isFinite(+strength) ? +strength : 1, 0.3, 3);
    const pn = clamp(Number.isFinite(+pan) ? +pan : 0, -1, 1);
    if (t - this._clickT > 1.1) this._clickK = 0;
    this._clickT = t;
    const tones = this._tonesIn(72, 96);
    const base = Math.round(((s - 0.3) / 2.7) * 4);
    const m = tones[(base + this._clickK++) % tones.length];
    const crowd = 1 / (1 + 0.14 * this.active.click);      // 同时发声越多，单个越轻
    if (this.active.click < 10) {
      const f = mtof(m), vel = (0.046 + 0.031 * s) * crowd, decay = 0.9 + 0.38 * s;
      const car = this._osc('sine', f), mod = this._osc('sine', f * 2), modAmt = ctx.createGain(), amp = ctx.createGain(), p = this._panner(pn);
      modAmt.gain.setValueAtTime(f * (0.35 + 0.3 * s), t);
      modAmt.gain.exponentialRampToValueAtTime(f * 0.02, t + 0.35);
      amp.gain.setValueAtTime(0.0001, t);
      amp.gain.exponentialRampToValueAtTime(vel, t + 0.004);
      amp.gain.exponentialRampToValueAtTime(vel * 0.3, t + 0.25);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + decay);
      mod.connect(modAmt); modAmt.connect(car.frequency); car.connect(amp); amp.connect(p); p.connect(this.sends.click);
      const srcs = [car, mod], nodes = [car, mod, modAmt, amp, p];
      if (s >= 1.6) {                                       // 强击：再叠一个高八度的光晕
        // 注意：GainNode 默认增益为 1——必须从 t 起就把它压到 0.0001，
        // 否则 t..t+20 ms 之间会漏出一段满幅正弦（曾导致强击峰值 ≈0.66 的“咔”声）
        const hi = this._osc('sine', f * 2), hg = this._gain(0.0001);
        hg.gain.setValueAtTime(0.0001, t);
        hg.gain.setValueAtTime(0.0001, t + 0.02);
        hg.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.03);
        hg.gain.exponentialRampToValueAtTime(0.0001, t + decay * 0.8);
        hi.connect(hg); hg.connect(p); hi.start(t); hi.stop(t + decay + 0.05);
        srcs.push(hi); nodes.push(hi, hg);
      }
      car.start(t); mod.start(t); car.stop(t + decay + 0.05); mod.stop(t + decay + 0.05);
      this._done('click', srcs, nodes);
    }
    // 气泡：数量与音高随力度增加
    this._bubbles(t + 0.01, 2 + Math.round(s * 2.2), 520, 900 + 380 * s, (0.02 + 0.008 * s) * crowd, pn, this.sends.clickBub, 0.07, 40);
    // 很强的点击：一记柔和的低频“涌动”（限频，避免连击时低频堆积）
    if (s >= 2.4 && t - this._whumpT > 0.35 && this.active.fx < 3) {
      this._whumpT = t;
      const o = this._osc('sine', 110), g = ctx.createGain();
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.35);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09 * crowd, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      o.connect(g); g.connect(this.sfxIn); o.start(t); o.stop(t + 0.55);
      this._done('fx', [o], [o, g]);
    }
  }

  // 跨越水层：低音膨胀（当前和弦根音 + 五度，低通张开再合上）+ 声呐扫频 + 一声确认的声呐
  zoneCross(zoneIndex, goingDeeper) {
    if (!this._live() || this.active.sting >= 2) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.03, deeper = goingDeeper !== false;
    const r = this.chord.root;
    const s1 = this._osc('sawtooth', mtof(r)), s2 = this._osc('sawtooth', mtof(r + 7)), s3 = this._osc('sine', mtof(r));
    s2.detune.value = 5;
    const lp = this._filter('lowpass', 120, 1.1), g = ctx.createGain();
    lp.frequency.setValueAtTime(120, t);
    lp.frequency.exponentialRampToValueAtTime(deeper ? 650 : 1300, t + 1.6);
    lp.frequency.exponentialRampToValueAtTime(130, t + 4.4);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.11, t + 1.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 4.6);
    const s3g = this._gain(1.6);
    s1.connect(lp); s2.connect(lp); s3.connect(s3g); s3g.connect(lp); lp.connect(g); g.connect(this.sends.sting);
    // 声呐扫频：下潜时由高向低，上浮时由低向高
    const sw = this._osc('sine', 880), swg = ctx.createGain(), p = this._panner(deeper ? 0.3 : -0.3);
    const [fa, fb] = deeper ? [mtof(93), mtof(74)] : [mtof(74), mtof(93)];
    sw.frequency.setValueAtTime(fa, t + 0.8);
    sw.frequency.exponentialRampToValueAtTime(fb, t + 2.3);
    swg.gain.setValueAtTime(0.0001, t + 0.8);
    swg.gain.exponentialRampToValueAtTime(0.045, t + 0.86);
    swg.gain.setValueAtTime(0.045, t + 2.1);
    swg.gain.exponentialRampToValueAtTime(0.0001, t + 2.5);
    sw.connect(swg); swg.connect(p); p.connect(this.sends.sting);
    const end = t + 4.7;
    [s1, s2, s3].forEach((o) => { o.start(t); o.stop(end); });
    sw.start(t + 0.8); sw.stop(t + 2.6);
    this._done('sting', [s1, s2, s3, sw], [s1, s2, s3, s3g, lp, g, sw, swg, p]);
    const tones = [81, 86].filter((m) => this.chord.pcs.has(pc(m)));
    this._ping(t + 2.5, pick(tones.length ? tones : [81]), 0.075, this.sends.sting, deeper ? -0.2 : 0.2, 3, 'fx');
  }

  // 返回海面：上升的滤波噪声呼啸 + 越来越密、越来越高的气泡云 + 一串上行的竖琴光
  ascend() {
    if (!this._live()) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.02, D = 2.5;
    if (t < this._ascendUntil) return;
    this._ascendUntil = t + D * 0.8;
    const src = ctx.createBufferSource(); src.buffer = this.white; src.loop = true;
    const bp = this._filter('bandpass', 200, 1.1), g = ctx.createGain(), p = this._panner(0);
    bp.frequency.setValueAtTime(200, t);
    bp.frequency.exponentialRampToValueAtTime(4200, t + D);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.75, t + D * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.5);
    if (p.pan) { p.pan.setValueAtTime(-0.45, t); p.pan.linearRampToValueAtTime(0.45, t + D); }
    src.connect(bp); bp.connect(g); g.connect(p); p.connect(this.sends.sting);
    src.start(t, Math.random() * 2); src.stop(t + D + 0.6);
    this._done('fx', [src], [src, bp, g, p]);
    for (let k = 0; k < 6; k++) {
      const lo = 300 * Math.pow(1.35, k);
      this._bubbles(t + (k * D) / 6 + rnd(0, 0.1), 5 + k, lo, lo * 2, 0.026, rnd(-0.7, 0.7), this.sends.clickBub, 0.07, 64);
    }
    const tones = this._tonesIn(62, 93);
    const n = Math.min(10, tones.length);
    for (let i = 0; i < n; i++) {
      const idx = Math.round((i / (n - 1)) * (tones.length - 1));
      this._harp(t + 0.5 + i * (D - 0.6) / n, tones[idx], 0.035 + 0.02 * (i / n), -0.5 + i / n);
    }
  }
}
