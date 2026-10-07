// 《REWIRE》—— Web Audio 实时合成的原创史诗配乐（无音频文件、无版权素材）
// D 小调 · 136 BPM · 16 小节循环：Dm–B♭–F–C | Dm–B♭–C–A | B♭–C–Dm–Dm | B♭–C–A–A
// 配器强度 0~5 随滚动层级递进：和弦垫 → 弦乐顿弓 + 太鼓 → 底鼓 + 贝斯 → 军鼓 + 镲 → 英雄主旋律 → 铜管齐奏

const BPM = 136;
const STEP = 60 / BPM / 4; // 16 分音符时长
const LOOKAHEAD = 0.14;

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

const CH = {
  Dm: { root: 38, pad: [57, 62, 65, 69], arp: [50, 57, 62, 65] },
  Bb: { root: 34, pad: [53, 58, 62, 65], arp: [46, 53, 58, 62] },
  F: { root: 41, pad: [57, 60, 65, 69], arp: [53, 60, 65, 69] },
  C: { root: 36, pad: [55, 60, 64, 67], arp: [48, 55, 60, 64] },
  A: { root: 33, pad: [52, 57, 61, 64], arp: [45, 52, 57, 61] },
};
const PROG = ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'A', 'Bb', 'C', 'Dm', 'Dm', 'Bb', 'C', 'A', 'A'];

// 主旋律：[小节, 起始16分步, 长度(步), MIDI]
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
const MELODY_AT = new Map();
for (const [bar, st, ln, n] of MELODY) MELODY_AT.set(bar * 16 + st, [ln, n]);

const OST = [0, 2, 1, 2, 0, 2, 1, 2, 0, 2, 1, 2, 0, 3, 2, 1];

export class Soundtrack {
  constructor() {
    this.ctx = null;
    this.playing = false;
    this.volume = 0.7;
    this.level = 1;
    this.target = 1;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.onBeat = null;
    this.beatQueue = [];
    this.lastImpact = 0;
  }

  _build() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.22;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -3;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.08;
    this.master.connect(comp).connect(limiter).connect(ctx.destination);

    this.bus = ctx.createGain();
    this.bus.gain.value = 0.9;
    this.bus.connect(this.master);
    this.duck = ctx.createGain();
    this.duck.connect(this.bus);
    this.drums = ctx.createGain();
    this.drums.gain.value = 1.0;
    this.drums.connect(this.bus);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this._impulse(3.4, 2.6);
    this.revSend = ctx.createGain();
    this.revSend.gain.value = 0.55;
    this.revSend.connect(this.reverb).connect(this.master);

    this.delay = ctx.createDelay(1.5);
    this.delay.delayTime.value = STEP * 3;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dl = ctx.createBiquadFilter();
    dl.type = 'lowpass';
    dl.frequency.value = 2600;
    this.delay.connect(dl).connect(fb).connect(this.delay);
    this.delSend = ctx.createGain();
    this.delSend.gain.value = 0.5;
    this.delSend.connect(this.delay);
    dl.connect(this.master);

    const len = ctx.sampleRate * 2;
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    this.drive = ctx.createWaveShaper();
    const curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) {
      const x = (i / 1023) * 2 - 1;
      curve[i] = Math.tanh(x * 2.2);
    }
    this.drive.curve = curve;
    this.drive.connect(this.duck);
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx;
    const n = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay);
    }
    return buf;
  }

  async start() {
    if (!this.ctx) this._build();
    if (this.ctx.state !== 'running') await this.ctx.resume();
    if (this.playing) return;
    this.playing = true;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(this.volume, t + 0.6);
    this.step = 0;
    this.nextTime = t + 0.08;
    this.level = this.target;
    this.impact(this.nextTime);
    this._tick();
    this.timer = setInterval(() => this._tick(), 25);
  }

  stop() {
    if (!this.ctx || !this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    this.timer = null;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setValueAtTime(this.master.gain.value, t);
    this.master.gain.linearRampToValueAtTime(0, t + 0.35);
    setTimeout(() => {
      if (!this.playing && this.ctx) this.ctx.suspend();
    }, 420);
  }

  pause() {
    if (this.ctx && this.playing) this.ctx.suspend();
  }

  resume() {
    if (this.ctx && this.playing) {
      this.ctx.resume();
      this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    }
  }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.playing) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  setLevel(l) {
    this.target = Math.max(0, Math.min(5, l));
  }

  // 每帧调用：返回已到时的节拍事件，用于粒子脉动
  pollBeats() {
    if (!this.ctx) return 0;
    const now = this.ctx.currentTime;
    let hit = 0;
    while (this.beatQueue.length && this.beatQueue[0][0] <= now) hit = Math.max(hit, this.beatQueue.shift()[1]);
    return hit;
  }

  _tick() {
    if (!this.playing) return;
    const ctx = this.ctx;
    while (this.nextTime < ctx.currentTime + LOOKAHEAD) {
      this._schedule(this.step, this.nextTime);
      this.nextTime += STEP;
      this.step++;
    }
  }

  _schedule(step, t) {
    const s = step % 16;
    const bar = Math.floor(step / 16) % 16;
    if (s === 0) this.level = this.target;
    const L = this.level;
    const chord = CH[PROG[bar]];
    const barDur = STEP * 16;

    if (s === 0) this.pad(t, chord.pad, barDur, L);
    if (L >= 1) {
      const n = chord.arp[OST[s]];
      this.pluck(t, n, s % 4 === 0 ? 0.32 : 0.22, s % 2 ? 0.35 : -0.35);
      if (L >= 3) this.pluck(t, n + 12, 0.1, s % 2 ? -0.5 : 0.5);
    }
    // 太鼓
    const taikoLo = L >= 3 ? [0, 3, 6, 8, 10, 12, 14, 15] : [0, 6, 8];
    if (L >= 1 && taikoLo.includes(s)) {
      this.taiko(t, s === 0 ? 1 : 0.62, s >= 14 ? 120 : 82);
      if (L < 2 && (s === 0 || s === 8)) this.beatQueue.push([t, 0.7]);
    }
    if (L >= 2 && s % 4 === 0) {
      this.kick(t, 0.95);
      this.beatQueue.push([t, s === 0 ? 1 : 0.75]);
    }
    if (L >= 5 && s === 14) this.kick(t, 0.7);
    if (L >= 2 && s % 2 === 0) {
      const oct = s === 6 || s === 14 ? 12 : 0;
      this.bass(t, chord.root + oct, STEP * 1.8, s === 0 ? 0.55 : 0.42);
    }
    if (L >= 3 && (s === 4 || s === 12)) this.snare(t, 0.7);
    if (L >= 3 && bar % 4 === 3 && s >= 8) this.snare(t, 0.18 + (s - 8) * 0.06);
    if (L >= 3 && s % 4 === 2) this.hat(t, 0.22, s === 14);
    if (L >= 5 && s % 2 === 1) this.hat(t, 0.1, false);
    if (L >= 4) {
      const m = MELODY_AT.get(bar * 16 + s);
      if (m) this.lead(t, m[1], m[0] * STEP, L >= 5 ? 0.3 : 0.24);
    }
    if (L >= 5 && (s === 0 || s === 10)) this.brass(t, chord.pad, s === 0 ? 0.32 : 0.24);
  }

  _env(g, t, peak, a, d, sustain = 0.0001) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(sustain, 0.0001), t + a + d);
  }

  _noiseSrc(t, dur) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur);
    return src;
  }

  _duckAt(t) {
    const g = this.duck.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(0.42, t);
    g.setTargetAtTime(1.0, t + 0.02, 0.09);
  }

  kick(t, v) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(165, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    this._env(g, t, v, 0.003, 0.42);
    o.connect(g).connect(this.drums);
    o.start(t);
    o.stop(t + 0.5);
    const n = this._noiseSrc(t, 0.03);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3500;
    const ng = ctx.createGain();
    this._env(ng, t, v * 0.25, 0.001, 0.02);
    n.connect(hp).connect(ng).connect(this.drums);
    this._duckAt(t);
  }

  taiko(t, v, f0) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(f0 * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.62, t + 0.25);
    this._env(g, t, v * 0.85, 0.004, 0.7);
    o.connect(g).connect(this.drums);
    o.start(t);
    o.stop(t + 0.8);
    const n = this._noiseSrc(t, 0.25);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f0 * 2.4;
    bp.Q.value = 1.2;
    const ng = ctx.createGain();
    this._env(ng, t, v * 0.5, 0.002, 0.2);
    n.connect(bp).connect(ng);
    ng.connect(this.drums);
    ng.connect(this.revSend);
    g.connect(this.revSend);
  }

  snare(t, v) {
    const ctx = this.ctx;
    const n = this._noiseSrc(t, 0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    this._env(g, t, v * 0.8, 0.002, 0.22);
    n.connect(bp).connect(g);
    g.connect(this.drums);
    g.connect(this.revSend);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(200, t);
    o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
    const og = ctx.createGain();
    this._env(og, t, v * 0.5, 0.002, 0.12);
    o.connect(og).connect(this.drums);
    o.start(t);
    o.stop(t + 0.2);
  }

  hat(t, v, open) {
    const ctx = this.ctx;
    const n = this._noiseSrc(t, open ? 0.3 : 0.06);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7600;
    const g = ctx.createGain();
    this._env(g, t, v, 0.001, open ? 0.22 : 0.045);
    n.connect(hp).connect(g).connect(this.drums);
  }

  bass(t, midi, dur, v) {
    const ctx = this.ctx;
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
    this._env(g, t, v, 0.006, dur, 0.0001);
    const m2 = ctx.createGain();
    m2.gain.value = 0.5;
    o1.connect(lp);
    o2.connect(m2).connect(lp);
    lp.connect(g).connect(this.drive);
    o1.start(t);
    o2.start(t);
    o1.stop(t + dur + 0.05);
    o2.stop(t + dur + 0.05);
  }

  pluck(t, midi, v, pan) {
    const ctx = this.ctx;
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
    this._env(g, t, v * 0.5, 0.004, 0.17);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    o1.connect(lp);
    o2.connect(lp);
    lp.connect(g).connect(p).connect(this.duck);
    p.connect(this.delSend);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.25);
    o2.stop(t + 0.25);
  }

  pad(t, notes, dur, L) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.8;
    const cut = 650 + L * 420;
    lp.frequency.setValueAtTime(cut * 0.6, t);
    lp.frequency.linearRampToValueAtTime(cut, t + dur * 0.6);
    const g = ctx.createGain();
    const peak = 0.07 + (L <= 1 ? 0.03 : 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 0.35);
    g.gain.setValueAtTime(peak, t + dur - 0.05);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
    lp.connect(g);
    g.connect(this.duck);
    g.connect(this.revSend);
    for (const n of notes) {
      for (const det of [-11, 0, 11]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 0.6);
      }
    }
  }

  brass(t, notes, v) {
    const ctx = this.ctx;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 3;
    lp.frequency.setValueAtTime(500, t);
    lp.frequency.exponentialRampToValueAtTime(3800, t + 0.05);
    lp.frequency.exponentialRampToValueAtTime(900, t + 0.4);
    const g = ctx.createGain();
    this._env(g, t, v * 0.32, 0.015, 0.45);
    lp.connect(g);
    g.connect(this.bus);
    g.connect(this.revSend);
    for (const n of [notes[0] - 12, ...notes]) {
      for (const det of [-7, 7]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = mtof(n);
        o.detune.value = det;
        o.connect(lp);
        o.start(t);
        o.stop(t + 0.55);
      }
    }
  }

  lead(t, midi, dur, v) {
    const ctx = this.ctx;
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
    const g = ctx.createGain();
    const end = t + dur;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(v * 0.42, t + 0.03);
    g.gain.setValueAtTime(v * 0.36, Math.max(t + 0.04, end - 0.06));
    g.gain.linearRampToValueAtTime(0.0001, end + 0.12);
    const m2 = ctx.createGain();
    m2.gain.value = 0.35;
    const m3 = ctx.createGain();
    m3.gain.value = 0.3;
    o1.connect(lp);
    o2.connect(m2).connect(lp);
    o3.connect(m3).connect(lp);
    lp.connect(g);
    g.connect(this.bus);
    g.connect(this.delSend);
    g.connect(this.revSend);
    for (const o of [o1, o2, o3, vib]) {
      o.start(t);
      o.stop(end + 0.2);
    }
  }

  // 层级切换冲击：次低频下坠 + 噪声扫频
  impact(at) {
    if (!this.ctx || !this.playing) return;
    const ctx = this.ctx;
    const t = at ?? ctx.currentTime + 0.02;
    if (t - this.lastImpact < 0.6) return;
    this.lastImpact = t;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(78, t);
    o.frequency.exponentialRampToValueAtTime(27, t + 1.3);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    o.connect(g).connect(this.bus);
    o.start(t);
    o.stop(t + 1.6);
    const n = this._noiseSrc(t, 1.4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(7000, t);
    lp.frequency.exponentialRampToValueAtTime(180, t + 1.2);
    const ng = ctx.createGain();
    this._env(ng, t, 0.32, 0.005, 1.2);
    n.connect(lp).connect(ng);
    ng.connect(this.bus);
    ng.connect(this.revSend);
    this.beatQueue.push([t, 1]);
    this.beatQueue.sort((a, b) => a[0] - b[0]);
  }
}
