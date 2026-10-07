// 深海配乐：全部由 Web Audio 实时合成，不加载任何音频文件。
// 层次：海浪噪声 + 持续和弦铺底 + 低音 + 生物荧光般的钟琴 + 气泡 + 鲸歌 + 深渊声呐。
// 随着下潜，和弦、滤波截止频率与各层密度跟随水层与当前生物变化。

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const rnd = (a, b) => a + Math.random() * (b - a);
const expWait = (mean) => -Math.log(1 - Math.random()) * mean;

// 三个水层的和声（MIDI 音高）
const ZONES = [
  { // 透光层：D 大调 / 利底亚色彩，明亮开阔
    chords: [[50, 57, 61, 64, 66], [47, 54, 57, 62, 64], [43, 50, 54, 57, 61], [45, 52, 57, 59, 64]],
    subs: [38, 35, 31, 33],
    scale: [74, 76, 78, 81, 83, 86, 88, 90],
    cutoff: 1500, noiseCut: 700, hiss: 0.5,
  },
  { // 弱光层：E 多利亚，朦胧
    chords: [[52, 59, 62, 66, 67], [48, 55, 59, 62, 66], [45, 52, 55, 59, 60], [47, 54, 57, 59, 64]],
    subs: [40, 36, 33, 35],
    scale: [76, 79, 81, 83, 86, 88, 91],
    cutoff: 950, noiseCut: 420, hiss: 0.15,
  },
  { // 无光层：D 小调，低沉幽暗
    chords: [[50, 57, 60, 64, 65], [46, 53, 57, 58, 62], [43, 50, 53, 57, 58], [45, 52, 55, 59, 61]],
    subs: [38, 34, 31, 33],
    scale: [62, 65, 67, 69, 72, 74, 77],
    cutoff: 620, noiseCut: 260, hiss: 0,
  },
];

export class OceanAudio {
  constructor() {
    this.ctx = null;
    this.on = false;
    this.volume = 0.7;
    this.zone = 0;
    this.mood = { bells: 2.4, bubbles: 0, whale: 0.02, arp: 0, pings: 0, bellOct: 0 };
    this.chordIdx = 0;
    this.timers = [];
    this.next = { bell: 0, bubble: 0, whale: 0, ping: 0, chord: 0 };
  }

  get isOn() { return this.on; }

  _init() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
    this.ctx = ctx;
    const now = ctx.currentTime;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.02; comp.release.value = 0.4;
    this.master.connect(comp).connect(ctx.destination);

    // 混响：程序生成的脉冲响应
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(4.8, 2.4);
    this.wet = ctx.createGain(); this.wet.gain.value = 0.85;
    this.verb.connect(this.wet).connect(this.master);
    this.dry = ctx.createGain(); this.dry.gain.value = 0.9;
    this.dry.connect(this.master);

    // 海浪：褐噪声 → 低通 → 慢速起伏
    const noise = ctx.createBufferSource();
    noise.buffer = this._brownNoise(8);
    noise.loop = true;
    this.noiseLP = ctx.createBiquadFilter();
    this.noiseLP.type = 'lowpass'; this.noiseLP.frequency.value = ZONES[0].noiseCut; this.noiseLP.Q.value = 0.4;
    const swell = ctx.createGain(); swell.gain.value = 0.32;
    const swellLfo = ctx.createOscillator(); swellLfo.frequency.value = 0.075;
    const swellDepth = ctx.createGain(); swellDepth.gain.value = 0.2;
    swellLfo.connect(swellDepth).connect(swell.gain);
    noise.connect(this.noiseLP).connect(swell).connect(this.dry);
    // 近海面的细碎水声
    this.hissHP = ctx.createBiquadFilter(); this.hissHP.type = 'highpass'; this.hissHP.frequency.value = 2400;
    this.hiss = ctx.createGain(); this.hiss.gain.value = 0.03;
    noise.connect(this.hissHP).connect(this.hiss).connect(swell);
    noise.start(now); swellLfo.start(now);

    // 和弦铺底
    this.padLP = ctx.createBiquadFilter();
    this.padLP.type = 'lowpass'; this.padLP.frequency.value = ZONES[0].cutoff; this.padLP.Q.value = 0.6;
    const padLfo = ctx.createOscillator(); padLfo.frequency.value = 0.045;
    const padLfoAmt = ctx.createGain(); padLfoAmt.gain.value = 260;
    padLfo.connect(padLfoAmt).connect(this.padLP.frequency);
    padLfo.start(now);
    this.padGain = ctx.createGain(); this.padGain.gain.value = 0.16;
    this.padLP.connect(this.padGain);
    this.padGain.connect(this.dry);
    const padSend = ctx.createGain(); padSend.gain.value = 0.7;
    this.padGain.connect(padSend).connect(this.verb);

    this.voices = [];
    const chord = ZONES[0].chords[0];
    for (let i = 0; i < 5; i++) {
      const g = ctx.createGain(); g.gain.value = 0.11;
      const pan = ctx.createStereoPanner(); pan.pan.value = (i - 2) * 0.32;
      const o1 = ctx.createOscillator(); o1.type = 'triangle';
      const o2 = ctx.createOscillator(); o2.type = 'sine';
      o1.frequency.value = mtof(chord[i]); o2.frequency.value = mtof(chord[i]);
      o2.detune.value = 7 + i * 2; o1.detune.value = -4;
      // 每个声部独立的缓慢音量起伏，让铺底“呼吸”
      const trem = ctx.createOscillator(); trem.frequency.value = rnd(0.03, 0.09);
      const tremAmt = ctx.createGain(); tremAmt.gain.value = 0.045;
      trem.connect(tremAmt).connect(g.gain);
      o1.connect(g); o2.connect(g); g.connect(pan).connect(this.padLP);
      o1.start(now); o2.start(now); trem.start(now);
      this.voices.push({ o1, o2 });
    }
    this.sub = ctx.createOscillator(); this.sub.type = 'sine';
    this.sub.frequency.value = mtof(ZONES[0].subs[0]);
    this.subGain = ctx.createGain(); this.subGain.gain.value = 0.13;
    this.sub.connect(this.subGain).connect(this.dry);
    this.sub.start(now);
    this._applyZone(0.05);
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        lp = lp * 0.6 + (Math.random() * 2 - 1) * 0.4;
        d[i] = (i < ctx.sampleRate * 0.015 ? 0 : lp) * Math.pow(1 - t, decay);
      }
    }
    return buf;
  }

  _brownNoise(seconds) {
    const ctx = this.ctx, len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
        d[i] = last * 3.2;
      }
      // 首尾淡接，避免循环处的爆音
      const fade = Math.floor(ctx.sampleRate * 0.05);
      for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
    }
    return buf;
  }

  async start() {
    if (!this.ctx) this._init();
    if (this.ctx.state !== 'running') await this.ctx.resume();
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.volume * 1.9, t, 1.2);
    this.on = true;
    const now = t + 0.2;
    this.next = { bell: now + 1.2, bubble: now + rnd(1, 3), whale: now + rnd(4, 8), ping: now + rnd(3, 6), chord: now + 10 };
    if (!this.timers.length) this.timers.push(setInterval(() => this._tick(), 120));
  }

  stop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.35);
    this.on = false;
    this.timers.forEach(clearInterval);
    this.timers = [];
    clearTimeout(this._suspendTimer);
    this._suspendTimer = setTimeout(() => { if (!this.on && this.ctx) this.ctx.suspend(); }, 1800);
  }

  async toggle() { if (this.on) this.stop(); else await this.start(); return this.on; }

  setVolume(v) {
    this.volume = v;
    if (this.ctx && this.on) this.master.gain.setTargetAtTime(v * 1.9, this.ctx.currentTime, 0.15);
  }

  pause() { if (this.ctx && this.on) this.ctx.suspend(); }
  resume() { if (this.ctx && this.on) this.ctx.resume(); }

  // 场景切换：zone = 水层，mood = 各层密度
  setScene(zone, mood) {
    this.mood = mood;
    if (zone === this.zone) return;
    this.zone = zone;
    if (this.ctx) this._applyZone(2.5);
  }

  _applyZone(glide) {
    const t = this.ctx.currentTime, Z = ZONES[this.zone];
    this.padLP.frequency.setTargetAtTime(Z.cutoff, t, glide);
    this.noiseLP.frequency.setTargetAtTime(Z.noiseCut, t, glide);
    this.hiss.gain.setTargetAtTime(0.06 * Z.hiss, t, glide);
    this.chordIdx = 0;
    this._applyChord(Math.min(glide, 2.2));
    this.next.chord = t + 12;
  }

  _applyChord(glide = 3) {
    const t = this.ctx.currentTime, Z = ZONES[this.zone];
    const ch = Z.chords[this.chordIdx % Z.chords.length];
    this.voices.forEach((v, i) => {
      const f = mtof(ch[i]);
      v.o1.frequency.setTargetAtTime(f, t, glide);
      v.o2.frequency.setTargetAtTime(f, t, glide);
    });
    this.sub.frequency.setTargetAtTime(mtof(Z.subs[this.chordIdx % Z.subs.length]), t, glide);
  }

  _tick() {
    if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime, horizon = t + 0.4, M = this.mood;
    if (t > this.next.chord) {
      this.chordIdx++;
      this._applyChord(3);
      this.next.chord = t + rnd(10, 14);
    }
    while (this.next.bell < horizon) {
      if (M.arp && Math.random() < M.arp) this._arp(this.next.bell);
      else this._bell(this.next.bell);
      this.next.bell += Math.max(0.25, expWait(M.bells));
    }
    if (M.bubbles > 0) {
      while (this.next.bubble < horizon) {
        this._bubbles(this.next.bubble);
        this.next.bubble += rnd(0.6, 1.4) * M.bubbles;
      }
    } else this.next.bubble = Math.max(this.next.bubble, t + 2);
    if (M.whale > 0) {
      while (this.next.whale < horizon) {
        if (Math.random() < M.whale) this._whale(this.next.whale);
        this.next.whale += rnd(7, 12);
      }
    } else this.next.whale = Math.max(this.next.whale, t + 4);
    if (M.pings > 0) {
      while (this.next.ping < horizon) {
        if (Math.random() < M.pings) this._ping(this.next.ping);
        this.next.ping += rnd(8, 14);
      }
    } else this.next.ping = Math.max(this.next.ping, t + 4);
  }

  _note() {
    const Z = ZONES[this.zone], ch = Z.chords[this.chordIdx % Z.chords.length];
    // 偏向当前和弦内的音
    if (Math.random() < 0.45) return ch[Math.floor(Math.random() * ch.length)] + 24 + (this.mood.bellOct || 0);
    return Z.scale[Math.floor(Math.random() * Z.scale.length)] + (this.mood.bellOct || 0);
  }

  // 玻璃感的 FM 钟琴，大量送入混响
  _bell(time, midi = this._note(), vel = rnd(0.05, 0.12)) {
    const ctx = this.ctx, f = mtof(midi);
    const car = ctx.createOscillator(), mod = ctx.createOscillator();
    const modAmt = ctx.createGain(), amp = ctx.createGain(), pan = ctx.createStereoPanner();
    car.frequency.value = f; mod.frequency.value = f * 3.5;
    modAmt.gain.setValueAtTime(f * 1.4, time);
    modAmt.gain.exponentialRampToValueAtTime(f * 0.02, time + 1.6);
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(vel, time + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + rnd(2.6, 4.2));
    pan.pan.value = rnd(-0.8, 0.8);
    mod.connect(modAmt).connect(car.frequency);
    car.connect(amp).connect(pan);
    pan.connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 1.1;
    pan.connect(send).connect(this.verb);
    car.start(time); mod.start(time);
    car.stop(time + 4.5); mod.stop(time + 4.5);
  }

  // 水母段：竖琴般的上行琶音
  _arp(time) {
    const Z = ZONES[this.zone];
    const start = Math.floor(Math.random() * 3);
    const n = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const m = Z.scale[(start + i) % Z.scale.length] + (start + i >= Z.scale.length ? 12 : 0) + (this.mood.bellOct || 0);
      this._bell(time + i * 0.13, m, 0.05 + 0.012 * i);
    }
  }

  _bubbles(time) {
    const ctx = this.ctx, n = 3 + Math.floor(Math.random() * 7);
    let t = time;
    const pan = rnd(-0.7, 0.7);
    for (let i = 0; i < n; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner();
      const f0 = rnd(380, 1100), dur = rnd(0.05, 0.11);
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(f0 * rnd(2.2, 3.2), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(rnd(0.012, 0.03), t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      p.pan.value = pan + rnd(-0.2, 0.2);
      o.connect(g).connect(p).connect(this.dry);
      const s = ctx.createGain(); s.gain.value = 0.4; p.connect(s).connect(this.verb);
      o.start(t); o.stop(t + dur + 0.05);
      t += rnd(0.03, 0.14);
    }
  }

  // 鲸歌：低频滑音 + 颤音 + 共振峰滤波
  _whale(time) {
    const ctx = this.ctx;
    const patterns = [
      [[0, 150], [1.3, 108], [2.5, 96], [3.4, 150], [4.4, 82]],
      [[0, 92], [1.0, 128], [2.2, 176], [3.3, 120], [4.6, 70]],
      [[0, 210], [0.9, 150], [2.0, 160], [3.1, 100], [4.0, 88]],
    ];
    const pat = patterns[Math.floor(Math.random() * patterns.length)];
    const dur = pat[pat.length - 1][0];
    const o = ctx.createOscillator(), o2 = ctx.createOscillator();
    o.type = 'sine'; o2.type = 'triangle';
    const vib = ctx.createOscillator(), vibAmt = ctx.createGain();
    vib.frequency.value = rnd(4, 5.5); vibAmt.gain.value = 2.6;
    vib.connect(vibAmt); vibAmt.connect(o.frequency); vibAmt.connect(o2.frequency);
    o.frequency.setValueAtTime(pat[0][1], time); o2.frequency.setValueAtTime(pat[0][1] * 2, time);
    pat.slice(1).forEach(([dt, f]) => {
      o.frequency.exponentialRampToValueAtTime(f, time + dt);
      o2.frequency.exponentialRampToValueAtTime(f * 2, time + dt);
    });
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    const bp = ctx.createBiquadFilter(); bp.type = 'lowpass'; bp.frequency.value = 760; bp.Q.value = 5;
    const amp = ctx.createGain(), pan = ctx.createStereoPanner();
    amp.gain.setValueAtTime(0.0001, time);
    amp.gain.exponentialRampToValueAtTime(0.11 * (this.mood.whaleVol || 1), time + 0.8);
    amp.gain.setValueAtTime(0.11 * (this.mood.whaleVol || 1), time + dur - 1.0);
    amp.gain.exponentialRampToValueAtTime(0.0001, time + dur + 0.6);
    pan.pan.value = rnd(-0.5, 0.5);
    o.connect(bp); o2.connect(g2).connect(bp);
    bp.connect(amp).connect(pan);
    const dryG = ctx.createGain(); dryG.gain.value = 0.35;
    pan.connect(dryG).connect(this.dry);
    const send = ctx.createGain(); send.gain.value = 1.3;
    pan.connect(send).connect(this.verb);
    [o, o2, vib].forEach((n) => { n.start(time); n.stop(time + dur + 0.8); });
  }

  // 深渊：柔和的声呐回响
  _ping(time) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(), g = ctx.createGain(), pan = ctx.createStereoPanner();
    o.frequency.setValueAtTime(rnd(840, 920), time);
    o.frequency.exponentialRampToValueAtTime(rnd(780, 820), time + 1.2);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.045, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 1.6);
    pan.pan.value = rnd(-0.6, 0.6);
    o.connect(g).connect(pan);
    const send = ctx.createGain(); send.gain.value = 1.6;
    pan.connect(send).connect(this.verb);
    const d = ctx.createGain(); d.gain.value = 0.25; pan.connect(d).connect(this.dry);
    o.start(time); o.stop(time + 1.8);
  }
}
