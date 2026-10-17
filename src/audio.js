// 《REWIRE》v2 —— 离线预渲染分轨 + 循环播放
// D 小调 · 136 BPM · 16 小节循环：Dm–B♭–F–C | Dm–B♭–C–A | B♭–C–Dm–Dm | B♭–C–A–A
//
// v1 在主线程用 setInterval 实时排程每个音符：WebGL 渲染、粒子生成或 GC 一卡顿，
// 音符就会迟到（卡顿），迟到的包络与侧链 setValueAtTime 阶跃会产生爆音（杂音），
// 冲击音效触发硬限幅器把整段混音压没（消失）。
// v2 改为：用 OfflineAudioContext 把整段编曲按“配器层级”预渲染成 6 条无缝循环分轨，
// 播放时只剩 6 个循环的 AudioBufferSourceNode，完全不依赖主线程计时；
// 层级切换只是平滑地推拉各分轨音量。

const BPM = 136;
const STEP = 15 / BPM; // 16 分音符
const BEAT = 60 / BPM;
const STEPS = 256; // 16 小节 × 16
const LOOP = STEPS * STEP; // ≈ 28.235 s
const TAIL = 4.0; // 混响 / 释音尾巴，渲染后折回循环开头，保证无缝
const SR = 32000;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
// 全部分轨在最高层级叠加的实测峰值约 1.47（渲染是确定性的），据此把音乐总线定在峰值约 0.9
const MUSIC_TRIM = 0.6;
const padCut = (L) => 650 + Math.max(1, L) * 420;

const CH = {
  Dm: { root: 38, pad: [57, 62, 65, 69], arp: [50, 57, 62, 65] },
  Bb: { root: 34, pad: [53, 58, 62, 65], arp: [46, 53, 58, 62] },
  F: { root: 41, pad: [57, 60, 65, 69], arp: [53, 60, 65, 69] },
  C: { root: 36, pad: [55, 60, 64, 67], arp: [48, 55, 60, 64] },
  A: { root: 33, pad: [52, 57, 61, 64], arp: [45, 52, 57, 61] },
};
const PROG = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'A', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'];

// 主旋律：[小节, 起始 16 分步, 长度(步), MIDI]
const MELODY = [
  [0, 0, 6, 74], [0, 6, 2, 69], [0, 8, 4, 74], [0, 12, 2, 76], [0, 14, 2, 77],
  [1, 0, 6, 77], [1, 6, 2, 76], [1, 8, 4, 74], [1, 12, 4, 72],
  [2, 0, 4, 72], [2, 4, 4, 77], [2, 8, 6, 81], [2, 14, 2, 79],
  [3, 0, 8, 79], [3, 8, 4, 76], [3, 12, 4, 72],
  [4, 0, 6, 74], [4, 6, 2, 69], [4, 8, 4, 74], [4, 12, 2, 77], [4, 14, 2, 81],
  [5, 0, 8, 82], [5, 8, 4, 81], [5, 12, 4, 77],
  [6, 0, 6, 79], [6, 6, 2, 76], [6, 8, 4, 72], [6, 12, 4, 79],
  [7, 0, 8, 81], [7, 8, 4, 76], [7, 12, 4, 73],
  [8, 0, 4, 77], [8, 4, 4, 82], [8, 8, 4, 81], [8, 12, 4, 77],
  [9, 0, 6, 79], [9, 6, 2, 81], [9, 8, 4, 79], [9, 12, 4, 76],
  [10, 0, 6, 77], [10, 6, 2, 76], [10, 8, 8, 74],
  [11, 0, 4, 81], [11, 4, 8, 86], [11, 12, 4, 84],
  [12, 0, 6, 82], [12, 6, 2, 81], [12, 8, 4, 79], [12, 12, 4, 77],
  [13, 0, 4, 76], [13, 4, 4, 79], [13, 8, 8, 84],
  [14, 0, 8, 85], [14, 8, 8, 81],
  [15, 0, 4, 76], [15, 4, 4, 81], [15, 8, 4, 85], [15, 12, 4, 88],
];

const OST = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 3, 2, 1];
const TAIKO_LIGHT = [0, 6, 8];
const TAIKO_EXTRA = [3, 10, 12, 14, 15];

// 分轨：level = 从哪个配器强度开始出声（各层严格叠加）
// trim = 混音电平：v1 各层叠加后峰值达 3.2、RMS 0.54，压缩器与限幅器一直被打满，
// 听感会发闷、抽吸甚至像“消失”；按实测 RMS 重新配平，主旋律适当抬高
const STEMS = [
  { key: 'pad', level: 0, label: '和弦垫', trim: 0.8 },
  { key: 'pulse', level: 1, label: '弦乐顿弓 + 太鼓', trim: 0.62 },
  { key: 'drive', level: 2, label: '底鼓 + 贝斯', trim: 0.36 },
  { key: 'groove', level: 3, label: '军鼓 + 镲 + 太鼓齐奏', trim: 0.5 },
  { key: 'hero', level: 4, label: '英雄主旋律', trim: 1.25 },
  { key: 'epic', level: 5, label: '铜管齐奏', trim: 0.72 },
];

// ---------------- 离线乐器（全部写入离线图，渲染时不受主线程影响） ----------------
class Studio {
  constructor(ctx, tOff = 0) {
    this.ctx = ctx;
    this.tOff = tOff;
    this.out = ctx.createGain();
    this.out.connect(ctx.destination);
    // 混响发送先过 250 Hz 高通，避免低频轰鸣糊成一片、把压缩器一直压住
    this.rev = ctx.createGain();
    this.rev.gain.value = 0.55;
    const revHp = ctx.createBiquadFilter();
    revHp.type = 'highpass';
    revHp.frequency.value = 250;
    const conv = ctx.createConvolver();
    conv.buffer = impulse(ctx, 2.8, 2.6);
    this.rev.connect(revHp).connect(conv).connect(ctx.destination);
    this.del = ctx.createGain();
    this.del.gain.value = 0.5;
    const d = ctx.createDelay(1.5);
    d.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    this.del.connect(d);
    d.connect(lp).connect(fb).connect(d);
    lp.connect(ctx.destination);
    this.noise = noiseBuffer(ctx);
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) curve[i] = Math.tanh(((i / 1023) * 2 - 1) * 2.2);
    // 贝斯失真：4 倍过采样 + 降低输入，消除混叠产生的“沙沙”杂音
    this.drivePre = ctx.createGain();
    this.drivePre.gain.value = 0.6;
    this.drive = ctx.createWaveShaper();
    this.drive.curve = curve;
    this.drive.oversample = '4x';
    this.drivePre.connect(this.drive).connect(this.out);
    // 顿弓左右声像：共用两个声像器，而不是每个音符各建一个
    this.pans = [-0.35, 0.35, -0.5, 0.5].map((v) => {
      const p = ctx.createStereoPanner();
      p.pan.value = v;
      p.connect(this.out);
      p.connect(this.del);
      return p;
    });
  }

  // 平滑包络：起音与释音都是斜坡，任何时刻都没有阶跃
  env(g, t, peak, a, d) {
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.setTargetAtTime(0, t + a, d / 4);
  }

  noiseSrc(t, dur) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.start(t, ((t + this.tOff) * 7.31) % 1.2);
    src.stop(t + dur);
    return src;
  }

  kick(t, v) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    this.env(g, t, v, 0.003, 0.42);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + 0.6);
    const n = this.noiseSrc(t, 0.04);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const ng = ctx.createGain();
    this.env(ng, t, v * 0.22, 0.001, 0.02);
    n.connect(hp).connect(ng).connect(this.out);
  }

  taiko(t, v, f0) {
    const { ctx } = this;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(f0 * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.25);
    this.env(g, t, v * 0.85, 0.004, 0.7);
    o.connect(g).connect(this.out);
    o.start(t);
    o.stop(t + 1.0);
    const n = this.noiseSrc(t, 0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f0 * 2.4;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    this.env(ng, t, v * 0.5, 0.002, 0.2);
    n.connect(bp).connect(ng);
    ng.connect(this.out);
    ng.connect(this.rev);
  }

  snare(t, v) {
    const { ctx } = this;
    const n = this.noiseSrc(t, 0.35);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    this.env(g, t, v * 0.8, 0.002, 0.22);
    n.connect(bp).connect(g);
    g.connect(this.out);
    g.connect(this.rev);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const og = ctx.createGain();
    this.env(og, t, v * 0.5, 0.002, 0.12);
    o.connect(og).connect(this.out);
    o.start(t);
    o.stop(t + 0.3);
  }

  hat(t, v, open) {
    const { ctx } = this;
    const n = this.noiseSrc(t, open ? 0.35 : 0.08);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7600;
    const g = ctx.createGain();
    this.env(g, t, v, 0.001, open ? 0.22 : 0.045);
    n.connect(hp).connect(g).connect(this.out);
  }

  bass(t, midi, dur, v) {
    const { ctx } = this;
    const f = mtof(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'square';
    o1.frequency.value = f;
    o2.frequency.value = f * 0.5;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 5;
    lp.frequency.setValueAtTime(260, t);
    lp.frequency.exponentialRampToValueAtTime(1300, t + 0.02);
    lp.frequency.exponentialRampToValueAtTime(320, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v, t + 0.006);
    g.gain.setTargetAtTime(v * 0.55, t + 0.006, dur * 0.4);
    g.gain.setTargetAtTime(0, t + dur, 0.012);
    const m2 = ctx.createGain();
    m2.gain.value = 0.5;
    o1.connect(lp);
    o2.connect(m2).connect(lp);
    lp.connect(g).connect(this.drivePre);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.1);
    o2.stop(t + dur + 0.1);
  }

  pluck(t, midi, v, pan) {
    const { ctx } = this;
    const f = mtof(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'sawtooth';
    o1.frequency.value = f;
    o2.frequency.value = f;
    o2.detune.value = 9;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(3200, t);
    lp.frequency.exponentialRampToValueAtTime(600, t + 0.16);
    const g = ctx.createGain();
    this.env(g, t, v * 0.5, 0.004, 0.17);
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(this.pans[pan]);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.3);
    o2.stop(t + 0.3);
  }

  pad(t, notes, dur) {
    const { ctx } = this;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    lp.frequency.setValueAtTime(1650, t);
    lp.frequency.linearRampToValueAtTime(2750, t + dur * 0.6);
    const g = ctx.createGain();
    const peak = 0.085;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.35);
    g.gain.setValueAtTime(peak, t + dur - 0.05);
    g.gain.linearRampToValueAtTime(0, t + dur + 0.5);
    lp.connect(g);
    g.connect(this.out);
    g.connect(this.rev);
    for (const n of notes) {
      for (const det of [-11, 0, 11]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.55);
      }
    }
  }

  brass(t, notes, v) {
    const { ctx } = this;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 3;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(3800, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(900, t + 0.4);
    const g = ctx.createGain();
    this.env(g, t, v * 0.32, 0.015, 0.45);
    lp.connect(g);
    g.connect(this.out);
    g.connect(this.rev);
    for (const n of [notes[0] - 12, ...notes]) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + 0.7);
      }
    }
  }

  lead(t, midi, dur, v) {
    const { ctx } = this;
    const f = mtof(midi);
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const o3 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o2.type = 'square';
    o3.type = 'sawtooth';
    o1.frequency.value = f;
    o2.frequency.value = f;
    o3.frequency.value = f / 2;
    o2.detune.value = 6;
    const vib = ctx.createOscillator();
    vib.frequency.value = 5.6;
    const vg = ctx.createGain();
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(f * 0.006, t + Math.min(0.35, dur));
    vib.connect(vg);
    vg.connect(o1.frequency);
    vg.connect(o2.frequency);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 1.2;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.linearRampToValueAtTime(3600, t + 0.08);
    // v1 在这里有一个 0.42v → 0.36v 的瞬时阶跃，每个旋律音都会爆一下；改为连续斜坡
    const g = ctx.createGain();
    const end = t + dur;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(v * 0.42, t + 0.03);
    g.gain.linearRampToValueAtTime(v * 0.36, Math.max(t + 0.05, end - 0.06));
    g.gain.linearRampToValueAtTime(0, end + 0.12);
    const m2 = ctx.createGain();
    m2.gain.value = 0.35;
    const m3 = ctx.createGain();
    m3.gain.value = 0.3;
    o1.connect(lp);
    o2.connect(m2).connect(lp);
    o3.connect(m3).connect(lp);
    lp.connect(g);
    g.connect(this.out);
    g.connect(this.del);
    g.connect(this.rev);
    for (const o of [o1, o2, o3, vib]) {
      o.start(t);
      o.stop(end + 0.2);
    }
  }
}

function impulse(ctx, seconds, decay) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  for (let c = 0; c < 2; c++) {
    const ch = buf.getChannelData(c);
    for (let i = 0; i < n; i++) ch[i] = (rnd() * 2 - 1) * Math.pow(1 - i / n, decay);
  }
  return buf;
}

function noiseBuffer(ctx) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 987654;
  for (let i = 0; i < len; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    d[i] = (seed / 4294967296) * 2 - 1;
  }
  return buf;
}

// 每条分轨在 16 小节里要演奏的内容
function scoreStem(key, st, step0 = 0, step1 = STEPS) {
  for (let step = step0; step < step1; step++) {
    const t = step * STEP - st.tOff;
    const s = step % 16;
    const bar = Math.floor(step / 16);
    const chord = CH[PROG[bar]];
    switch (key) {
      case 'pad':
        if (s === 0) st.pad(t, chord.pad, STEP * 16);
        break;
      case 'pulse':
        st.pluck(t, chord.arp[OST[s]], s % 4 === 0 ? 0.32 : 0.22, s % 2 ? 1 : 0);
        if (TAIKO_LIGHT.includes(s)) st.taiko(t, s === 0 ? 1 : 0.62, 82);
        break;
      case 'drive':
        if (s % 4 === 0) st.kick(t, 0.95);
        if (s % 2 === 0) st.bass(t, chord.root + (s === 6 || s === 14 ? 12 : 0), STEP * 1.8, s === 0 ? 0.55 : 0.42);
        break;
      case 'groove':
        if (s === 4 || s === 12) st.snare(t, 0.7);
        if (bar % 4 === 3 && s >= 8) st.snare(t, 0.18 + (s - 8) * 0.06);
        if (s % 4 === 2) st.hat(t, 0.22, s === 14);
        st.pluck(t, chord.arp[OST[s]] + 12, 0.1, s % 2 ? 2 : 3);
        if (TAIKO_EXTRA.includes(s)) st.taiko(t, 0.62, s >= 14 ? 120 : 82);
        break;
      case 'hero':
        for (const [b, st0, ln, n] of MELODY) if (b === bar && st0 === s) st.lead(t, n, ln * STEP, 0.27);
        break;
      case 'epic':
        if (s === 0 || s === 10) st.brass(t, chord.pad, s === 0 ? 0.32 : 0.24);
        if (s % 2 === 1) st.hat(t, 0.1, false);
        if (s === 14) st.kick(t, 0.7);
        break;
    }
  }
}

function makeBuffer(channels, length, sampleRate) {
  try {
    return new AudioBuffer({ numberOfChannels: channels, length, sampleRate });
  } catch (e) {
    return new OfflineAudioContext(channels, 1, sampleRate).createBuffer(channels, length, sampleRate);
  }
}

// 分段渲染：每段 4 小节 + 尾巴，最后叠加成一条循环。
// 混响、延迟都是线性时不变的，分段相加与整段渲染结果一致，但每个音符节点只存在于自己那一段，
// 渲染量约降为原来的 1/3
const SEG_BARS = 4;
async function renderStem(key) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const n = Math.round(LOOP * SR);
  const acc = [new Float32Array(n), new Float32Array(n)];
  const segSteps = SEG_BARS * 16;
  for (let s0 = 0; s0 < STEPS; s0 += segSteps) {
    const tOff = s0 * STEP;
    const ctx = new OAC(2, Math.ceil((segSteps * STEP + TAIL) * SR), SR);
    scoreStem(key, new Studio(ctx, tOff), s0, s0 + segSteps);
    const r = await ctx.startRendering();
    const start = Math.round(tOff * SR);
    for (let c = 0; c < 2; c++) {
      const d = r.getChannelData(c);
      const a = acc[c];
      for (let i = 0; i < d.length; i++) a[(start + i) % n] += d[i];
    }
  }
  const out = makeBuffer(2, n + 2, SR);
  for (let c = 0; c < 2; c++) {
    const dst = out.getChannelData(c);
    dst.set(acc[c]);
    dst[n] = acc[c][0];
    dst[n + 1] = acc[c][1];
  }
  return out;
}

async function renderOneShot(seconds, build) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OAC(2, Math.ceil(seconds * SR), SR);
  build(ctx, new Studio(ctx));
  return ctx.startRendering();
}

// 层级切换冲击：次低频下坠 + 噪声扫频
function buildImpact(ctx, st) {
  // v1 的 27 Hz 次低频手机外放听不到，却会把整段混音压没；改为 80→42 Hz、峰值 0.5 并高通 38 Hz
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 38;
  hp.connect(ctx.destination);
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.setValueAtTime(80, 0);
  o.frequency.exponentialRampToValueAtTime(42, 1.0);
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(0.5, 0.008);
  g.gain.setTargetAtTime(0, 0.01, 0.26);
  o.connect(g).connect(hp);
  o.start(0);
  o.stop(1.69);
  const n = st.noiseSrc(0, 1.4);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(7000, 0);
  lp.frequency.exponentialRampToValueAtTime(180, 1.2);
  const ng = ctx.createGain();
  st.env(ng, 0, 0.22, 0.005, 1.0);
  n.connect(lp).connect(ng);
  ng.connect(ctx.destination);
  ng.connect(st.rev);
}

// 动作电位“哒”声：电生理监听器里尖峰放电的声音（瞬态 + 快速下滑的音调）
function buildSpike(ctx, st) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1500, 0);
  o.frequency.exponentialRampToValueAtTime(320, 0.05);
  g.gain.setValueAtTime(0, 0);
  g.gain.linearRampToValueAtTime(0.5, 0.0015);
  g.gain.setTargetAtTime(0, 0.002, 0.018);
  o.connect(g).connect(ctx.destination);
  o.start(0);
  o.stop(0.15);
  const n = st.noiseSrc(0, 0.02);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 3200;
  bp.Q.value = 1.5;
  const ng = ctx.createGain();
  st.env(ng, 0, 0.35, 0.0008, 0.012);
  n.connect(bp).connect(ng).connect(ctx.destination);
}

// 侧链“抽吸”包络：一拍长的控制信号，循环播放，接到和弦垫的增益参数上（音频速率，无阶跃）
function buildDuckCurve(sampleRate) {
  const n = Math.round(BEAT * sampleRate);
  const buf = makeBuffer(1, n + 2, sampleRate);
  const d = buf.getChannelData(0);
  const attack = 0.006 * sampleRate;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const down = i < attack ? i / attack : Math.exp(-(t - 0.006) / 0.09);
    d[i] = -down; // 0 → -1 → 0
  }
  d[n] = d[0];
  d[n + 1] = d[1];
  return buf;
}

export { STEMS };

export class Soundtrack {
  constructor() {
    this.ctx = null;
    this.desired = false; // 用户意图（是否想听），与 AudioContext 实际状态分开
    this.volume = 0.8;
    this.level = 1;
    this.buffers = {};
    this.sfx = {};
    this.stems = {};
    this.loopT0 = null;
    this.lastPos = -1;
    this.lastAudible = 0;
    this.lastImpact = -10;
    this.clicks = [];
    this.onStatus = null;
    this.status = 'idle';
    this.preparing = null;
    this.op = Promise.resolve();
  }

  // 兼容旧接口：playing = 用户想听
  get playing() {
    return this.desired;
  }

  // UI 状态：off | loading | on | blocked
  get uiState() {
    if (!this.desired) return 'off';
    if (!this.ctx || this.loopT0 == null) return 'loading';
    if (this.ctx.state !== 'running') return 'blocked';
    return 'on';
  }

  _emit(status) {
    if (status) this.status = status;
    if (this.onStatus) this.onStatus(this.uiState);
  }

  _serial(fn) {
    this.op = this.op.then(fn).catch((e) => console.warn('配乐', e));
    return this.op;
  }

  // 预渲染全部分轨（不需要用户手势，可在页面空闲时提前进行）
  prepare() {
    if (this.preparing) return this.preparing;
    this.preparing = (async () => {
      try {
        this.sfx.impact = await renderOneShot(1.7, buildImpact);
        this.sfx.spike = await renderOneShot(0.15, buildSpike);
        for (const s of STEMS) {
          this._emit(`rendering ${s.key}`);
          this.buffers[s.key] = await renderStem(s.key);
          if (this.ctx && this.loopT0 != null) this._startStem(s.key, true);
          await new Promise((r) => setTimeout(r, 30));
        }
        this._emit('ready');
      } catch (e) {
        console.warn('配乐预渲染失败', e);
        this._emit('error');
      }
    })();
    return this.preparing;
  }

  _build() {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx;
    try {
      ctx = new AC({ latencyHint: 'balanced' });
    } catch (e) {
      ctx = new AC();
    }
    this.ctx = ctx;
    // iOS：让静音拨片不再静音网页配乐（Safari 16.4+）
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch (e) {
      /* 不支持则忽略 */
    }
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    // 只保留一个很少介入的安全限幅器；v1 的总线压缩器 + 快速限幅器会抽吸并让低频失真
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.master.connect(limiter).connect(ctx.destination);

    this.music = ctx.createGain();
    this.music.gain.value = MUSIC_TRIM;
    this.music.connect(this.master);
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 0.8;
    this.sfxBus.connect(this.master);

    // 和弦垫：实时低通决定各层级的明暗，再经侧链“抽吸”
    this.padLP = ctx.createBiquadFilter();
    this.padLP.type = 'lowpass';
    this.padLP.Q.value = 0.5;
    this.padLP.frequency.value = padCut(this.level);
    this.duck = ctx.createGain();
    this.duck.gain.value = 1;
    this.padLP.connect(this.duck).connect(this.music);
    this.duckDepth = ctx.createGain();
    this.duckDepth.gain.value = 0;
    this.duckDepth.connect(this.duck.gain);

    for (const s of STEMS) {
      const g = ctx.createGain();
      g.gain.value = 0;
      g.connect(s.key === 'pad' ? this.padLP : this.music);
      this.stems[s.key] = { gain: g, src: null };
    }

    ctx.addEventListener('statechange', () => {
      // 来电、其他应用抢占音频焦点、iOS interrupted 等：标记为“点击恢复”
      this._emit();
    });
    const gesture = () => {
      if (this.desired && !document.hidden && this.ctx.state !== 'running') {
        this.ctx.resume().then(() => this._fadeIn(), () => {});
      }
    };
    for (const ev of ['pointerdown', 'keydown', 'touchend']) addEventListener(ev, gesture, { capture: true, passive: true });
    const hide = () => this._serial(() => this._suspendSoft());
    const show = () => this._serial(() => this._resumeSoft());
    document.addEventListener('visibilitychange', () => (document.hidden ? hide() : show()));
    addEventListener('pagehide', hide);
    addEventListener('pageshow', show);
  }

  _loopPos(when) {
    return (((when - this.loopT0) % LOOP) + LOOP) % LOOP;
  }

  _startStem(key, late = false) {
    const buf = this.buffers[key];
    const stem = this.stems[key];
    if (!buf || !stem || stem.src || this.loopT0 == null) return;
    const ctx = this.ctx;
    // 中途加入的分轨在下一拍对齐进入
    let when = ctx.currentTime + 0.05;
    if (late) when = this.loopT0 + Math.ceil((when - this.loopT0) / BEAT) * BEAT;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = LOOP;
    src.connect(stem.gain);
    src.start(when, this._loopPos(when));
    stem.src = src;
    this._applyLevel(true);
  }

  _startClock() {
    const ctx = this.ctx;
    this.loopT0 = ctx.currentTime + 0.1;
    const duck = ctx.createBufferSource();
    duck.buffer = buildDuckCurve(ctx.sampleRate);
    duck.loop = true;
    duck.loopStart = 0;
    duck.loopEnd = BEAT;
    duck.connect(this.duckDepth);
    duck.start(this.loopT0);
    for (const s of STEMS) this._startStem(s.key);
  }

  _fadeIn() {
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.volume, t, 0.15);
    this._emit();
  }

  async _suspendSoft() {
    if (!this.ctx || !this.desired || this.ctx.state !== 'running') return;
    this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    await new Promise((r) => setTimeout(r, 90));
    if (document.hidden && this.ctx.state === 'running') await this.ctx.suspend();
  }

  async _resumeSoft() {
    if (!this.ctx || !this.desired || document.hidden) return;
    try {
      await this.ctx.resume();
    } catch (e) {
      /* 需要手势 */
    }
    if (this.ctx.state === 'running') this._fadeIn();
    else this._emit();
  }

  start() {
    this.desired = true;
    if (!this.ctx) this._build();
    // 必须在手势调用栈内同步调用 resume
    const resumed = this.ctx.state !== 'running' ? this.ctx.resume().catch(() => {}) : null;
    this.prepare();
    this._emit();
    return this._serial(async () => {
      if (resumed) await resumed;
      if (this.loopT0 == null) {
        // 和弦垫一就绪就起播（约 1 秒内），其余分轨渲染完成后按拍对齐加入
        await new Promise((resolve) => {
          const check = () => (this.buffers.pad || this.status === 'error' || !this.desired ? resolve() : setTimeout(check, 50));
          check();
        });
        if (!this.desired) return;
        this._startClock();
      }
      if (!this.desired) return;
      if (this.ctx.state !== 'running') {
        try {
          await this.ctx.resume();
        } catch (e) {
          /* blocked */
        }
      }
      this._applyLevel(true);
      if (this.ctx.state === 'running') {
        this._fadeIn();
        this.impact();
      } else this._emit();
    });
  }

  stop() {
    this.desired = false;
    this._emit();
    if (!this.ctx) return Promise.resolve();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.08);
    return this._serial(async () => {
      await new Promise((r) => setTimeout(r, 400));
      if (!this.desired && this.ctx.state === 'running') await this.ctx.suspend();
      if (this.desired && this.ctx.state !== 'running') {
        await this.ctx.resume();
        this._fadeIn();
      }
    });
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.desired) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setLevel(l) {
    this.level = Math.max(0, Math.min(5, l));
    this._applyLevel(false);
  }

  _applyLevel(immediate) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // 新层在下一拍进入，旧层立即淡出
    const nextBeat = this.loopT0 == null ? now : this.loopT0 + Math.ceil((now + 0.03 - this.loopT0) / BEAT) * BEAT;
    for (const s of STEMS) {
      const on = s.level <= this.level && !!this.stems[s.key].src;
      const g = this.stems[s.key].gain.gain;
      if (immediate) g.setTargetAtTime(on ? s.trim : 0, now, 0.03);
      else if (on) g.setTargetAtTime(s.trim, Math.max(now, nextBeat - 0.02), 0.06);
      else g.setTargetAtTime(0, now, 0.45);
    }
    this.padLP.frequency.setTargetAtTime(padCut(this.level), now, 0.5);
    this.duckDepth.gain.setTargetAtTime(this.level >= 2 ? 0.42 : 0.1, now, 0.3);
  }

  // 每帧调用：根据循环播放位置推算节拍，驱动粒子脉动（扣除输出延迟，与耳朵听到的同步）
  pollBeats() {
    if (!this.ctx || !this.desired || this.loopT0 == null || this.ctx.state !== 'running') return 0;
    const audible = this.ctx.currentTime - (this.ctx.outputLatency || this.ctx.baseLatency || 0);
    if (audible < this.loopT0) return 0;
    const pos = this._loopPos(audible);
    const jump = audible - this.lastAudible;
    this.lastAudible = audible;
    if (this.lastPos < 0 || jump > 0.25 || jump < 0) {
      this.lastPos = pos;
      return 0;
    }
    let a = Math.floor(this.lastPos / STEP);
    let b = Math.floor(pos / STEP);
    if (b < a) b += STEPS;
    this.lastPos = pos;
    let hit = 0;
    for (let k = a + 1; k <= b; k++) {
      const s = k % 16;
      if (this.level >= 2 && s % 4 === 0) hit = Math.max(hit, s === 0 ? 1 : 0.75);
      else if (this.level >= 1 && (s === 0 || s === 8)) hit = Math.max(hit, 0.7);
      if (this.level >= 5 && s === 14) hit = Math.max(hit, 0.6);
    }
    return hit;
  }

  _playSfx(buf, gain, rate = 1) {
    if (!buf || !this.ctx || !this.desired || this.ctx.state !== 'running') return null;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(this.sfxBus);
    src.start(ctx.currentTime + 0.005);
    src.onended = () => g.disconnect();
    return { src, g };
  }

  impact() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now - this.lastImpact < 0.7) return;
    if (this._playSfx(this.sfx.impact, 0.8)) this.lastImpact = now;
  }

  // 点击触发的动作电位声：频率越高，音调越高、越短促；最多 8 个同时发声，超出时淡出最早的
  spike(rateHz = 0) {
    const v = this._playSfx(this.sfx.spike, 0.38, 1 + Math.min(1, rateHz / 8) * 0.6);
    if (!v) return;
    this.clicks.push(v);
    if (this.clicks.length > 8) {
      const old = this.clicks.shift();
      const t = this.ctx.currentTime;
      old.g.gain.setTargetAtTime(0, t, 0.008);
      try {
        old.src.stop(t + 0.05);
      } catch (e) {
        /* 已结束 */
      }
    }
    v.src.addEventListener('ended', () => {
      const i = this.clicks.indexOf(v);
      if (i >= 0) this.clicks.splice(i, 1);
    });
  }
}
