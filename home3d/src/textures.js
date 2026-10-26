// 程序化贴图：全部用 Canvas 现场绘制，不依赖外部图片，单文件即可离线打开。
import * as THREE from 'three';

const cache = new Map();

function rng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function canvas(w, h = w, read = false) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  // 需要逐像素读写的贴图用 CPU 画布，避免从显存回读
  return [c, c.getContext('2d', read ? { willReadFrequently: true } : undefined)];
}

function toTex(c, { repeat = 1, srgb = true, rotation = 0, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  if (rotation) { t.center.set(0.5, 0.5); t.rotation = rotation; }
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function memo(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

// 大理石：云雾底 + 随机游走的叶脉
function paintMarble(ctx, W, H, o) {
  const r = rng(o.seed);
  ctx.fillStyle = o.base;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) {
    const x = r() * W, y = r() * H, rad = 40 + r() * W * 0.25;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const c = r() > 0.5 ? o.cloudA : o.cloudB;
    g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.07 + r() * 0.09;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  for (let v = 0; v < o.veins; v++) {
    let x = r() * W, y = r() * H;
    let a = o.angle + (r() - 0.5) * 0.9;
    const steps = 40 + r() * 90;
    const w0 = o.width * (0.35 + r() * 1.2);
    const pts = [[x, y]];
    for (let s = 0; s < steps; s++) {
      a += (r() - 0.5) * 0.55;
      x += Math.cos(a) * W * 0.012;
      y += Math.sin(a) * W * 0.012;
      pts.push([x, y]);
    }
    for (const pass of [[w0 * 3.2, 0.06, 6], [w0, 0.32, 1.5], [w0 * 0.35, 0.55, 0]]) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) ctx.lineTo(p[0], p[1]);
      ctx.strokeStyle = o.vein;
      ctx.globalAlpha = pass[1];
      ctx.lineWidth = pass[0];
      ctx.filter = pass[2] ? `blur(${pass[2]}px)` : 'none';
      ctx.stroke();
    }
    // 分叉的细脉
    if (r() > 0.4) {
      const p = pts[Math.floor(r() * pts.length)];
      let bx = p[0], by = p[1], ba = a + (r() - 0.5) * 2;
      ctx.beginPath(); ctx.moveTo(bx, by);
      for (let s = 0; s < 30; s++) { ba += (r() - 0.5) * 0.7; bx += Math.cos(ba) * 6; by += Math.sin(ba) * 6; ctx.lineTo(bx, by); }
      ctx.globalAlpha = 0.35; ctx.lineWidth = w0 * 0.3; ctx.filter = 'none'; ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.filter = 'none';
}

const MARBLES = {
  // 暖白大理石（地面、台面）
  calacatta: { base: '#ece7e0', cloudA: '#f7f4ef', cloudB: '#d9d1c6', vein: '#8c8279', veins: 26, width: 2.4, angle: 0.6, seed: 11 },
  // 暖灰石（电视墙、卫浴墙）
  greige: { base: '#d6cdc2', cloudA: '#e6dfd6', cloudB: '#bfb3a5', vein: '#f4efe8', veins: 30, width: 2.0, angle: -0.4, seed: 23 },
  // 黑金花（茶几、点缀）
  nero: { base: '#1d1b1a', cloudA: '#2a2725', cloudB: '#111010', vein: '#d8c9ac', veins: 22, width: 1.6, angle: 0.9, seed: 37 },
  // 卫生间地面灰石
  pietra: { base: '#8f8780', cloudA: '#9d958e', cloudB: '#7a736d', vein: '#c9c1b8', veins: 18, width: 1.4, angle: 0.2, seed: 51 },
};

export function marbleTex(name, { tiles = 0, size = 1024, repeat = 1 } = {}) {
  return memo(`marble:${name}:${tiles}`, () => {
    const [c, ctx] = canvas(size);
    paintMarble(ctx, size, size, MARBLES[name]);
    if (tiles) {
      // 石材分缝（2 mm 级）；贴图覆盖 tiles × tiles 块
      const step = size / tiles;
      ctx.strokeStyle = 'rgba(70,60,50,0.55)';
      ctx.lineWidth = 2;
      for (let i = 0; i <= tiles; i++) {
        ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
      }
    }
    return toTex(c, { repeat });
  });
}

// 人字拼橡木：600 × 150 板，晶格向量 (W,W) 与 (L,−L)，贴图周期 8W = 1.2 m
export function herringboneTex() {
  return memo('herringbone', () => {
    const S = 1024, W = S / 8, L = W * 4;
    const [c, ctx] = canvas(S);
    const tones = ['#a77c55', '#b08660', '#9c7350', '#b98f69', '#a37a52', '#93694a'];
    let r;
    const plank = (x, y, w, h, vertical, cls) => {
      // 同一块板跨贴图边界时必须同色同纹：按晶格等价类 (i − 4j) mod 8 取种子
      r = rng(cls * 977 + 13);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.fillStyle = tones[Math.floor(r() * tones.length)];
      ctx.fillRect(x, y, w, h);
      // 木纹
      const n = 10 + r() * 8;
      for (let i = 0; i < n; i++) {
        ctx.strokeStyle = `rgba(${60 + r() * 30},${38 + r() * 20},${20 + r() * 10},${0.08 + r() * 0.16})`;
        ctx.lineWidth = 0.6 + r() * 1.6;
        ctx.beginPath();
        if (vertical) {
          const gx = x + r() * w, amp = r() * 4;
          ctx.moveTo(gx, y);
          for (let t = 0; t <= 1.001; t += 0.1) ctx.lineTo(gx + Math.sin(t * 6 + i) * amp, y + t * h);
        } else {
          const gy = y + r() * h, amp = r() * 4;
          ctx.moveTo(x, gy);
          for (let t = 0; t <= 1.001; t += 0.1) ctx.lineTo(x + t * w, gy + Math.sin(t * 6 + i) * amp);
        }
        ctx.stroke();
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(45,30,18,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    };
    for (let i = -16; i <= 16; i++) {
      for (let j = -6; j <= 6; j++) {
        const x = i * W + j * L, y = i * W - j * L;
        const cls = (((i - 4 * j) % 8) + 8) % 8;
        if (!(x > S || x + L < 0 || y > S || y + W < 0)) plank(x, y, L, W, false, cls);
        const vx = x + L, vy = y + W - L;
        if (!(vx > S || vx + W < 0 || vy > S || vy + L < 0)) plank(vx, vy, W, L, true, cls + 8);
      }
    }
    return toTex(c, { rotation: Math.PI / 4 });
  });
}

// 木皮（家具、门扇）
export function veneerTex(name) {
  const tone = { walnut: ['#5b3d2a', '#4a3122', '#6a4831'], oak: ['#b58d63', '#a37c55', '#c29a70'] }[name];
  return memo(`veneer:${name}`, () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    const r = rng(name.length * 97);
    ctx.fillStyle = tone[0]; ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 160; i++) {
      const x = r() * S, amp = 2 + r() * 10, fr = 2 + r() * 4;
      ctx.strokeStyle = r() > 0.5 ? tone[1] : tone[2];
      ctx.globalAlpha = 0.15 + r() * 0.35;
      ctx.lineWidth = 0.6 + r() * 2.4;
      ctx.beginPath(); ctx.moveTo(x, 0);
      for (let y = 0; y <= S; y += 8) ctx.lineTo(x + Math.sin((y / S) * Math.PI * 2 * fr + i) * amp, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return toTex(c, {});
  });
}

// 织物：细密噪点 + 经纬纹
export function fabricTex(base, { seed = 3, weave = 4, grain = 0.1 } = {}) {
  return memo(`fabric:${base}:${seed}`, () => {
    const S = 256;
    const [c, ctx] = canvas(S, S, true);
    ctx.fillStyle = base; ctx.fillRect(0, 0, S, S);
    const img = ctx.getImageData(0, 0, S, S), d = img.data, r = rng(seed);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 4;
      const w = ((x % weave) < weave / 2) !== ((y % weave) < weave / 2) ? 1 : -1;
      const n = (r() - 0.5) * 255 * grain + w * 6;
      d[i] = Math.max(0, Math.min(255, d[i] + n));
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);
    return toTex(c, { aniso: 4 });
  });
}

// 竖向格栅（护墙板、柜门凹槽）
export function flutedTex(base, dark) {
  return memo(`flute:${base}`, () => {
    const S = 256;
    const [c, ctx] = canvas(S);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const g = ctx.createLinearGradient(i * S / n, 0, (i + 1) * S / n, 0);
      g.addColorStop(0, dark); g.addColorStop(0.18, base); g.addColorStop(0.75, base); g.addColorStop(1, dark);
      ctx.fillStyle = g;
      ctx.fillRect(i * S / n, 0, S / n, S);
    }
    return toTex(c, {});
  });
}

// 地毯：羊毛底 + 简洁边框/几何纹
export function rugTex(kind) {
  return memo(`rug:${kind}`, () => {
    const S = 1024;
    const [c, ctx] = canvas(S);
    const r = rng(kind.length * 31);
    const P = {
      living: { base: '#cfc6b9', line: '#9b8f80', accent: '#6C9AC4' },
      master: { base: '#b9ad9f', line: '#8f8273', accent: '#d9cfc2' },
      bed: { base: '#d8d0c4', line: '#b2a696', accent: '#9FBDDA' },
      runner: { base: '#5d544c', line: '#8a7e71', accent: '#b89a67' },
    }[kind];
    ctx.fillStyle = P.base; ctx.fillRect(0, 0, S, S);
    // 羊毛绒感
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(r() * S, r() * S, 2, 2);
    }
    ctx.strokeStyle = P.line; ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, S - 80, S - 80);
    ctx.lineWidth = 3;
    ctx.strokeRect(70, 70, S - 140, S - 140);
    if (kind === 'living') {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = P.accent; ctx.lineWidth = 6;
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(S * 0.5, S * 0.5, 120 + k * 70, 0, Math.PI * 2); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (kind === 'runner') {
      ctx.strokeStyle = P.accent; ctx.lineWidth = 4;
      for (let k = 120; k < S - 100; k += 60) { ctx.beginPath(); ctx.moveTo(120, k); ctx.lineTo(S - 120, k + 30); ctx.stroke(); }
    } else {
      ctx.fillStyle = P.accent; ctx.globalAlpha = 0.35;
      for (let k = 0; k < 6; k++) ctx.fillRect(140 + k * 130, 140, 40, S - 280);
      ctx.globalAlpha = 1;
    }
    const t = toTex(c, {});
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// 装饰画：Loyel 渐变蓝为主调的抽象构成
const LOYEL = ['#F4F7FB', '#E8EEF6', '#CCDBEB', '#9FBDDA', '#6C9AC4', '#497DAE', '#376392', '#2E5076', '#2B4868', '#263B54'];
export function artTex(seed, w = 600, h = 800) {
  return memo(`art:${seed}:${w}:${h}`, () => {
    const [c, ctx] = canvas(w, h);
    const r = rng(seed * 131 + 7);
    ctx.fillStyle = r() > 0.5 ? '#efe9df' : LOYEL[1];
    ctx.fillRect(0, 0, w, h);
    const kind = seed % 3;
    if (kind === 0) {
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = LOYEL[3 + Math.floor(r() * 7)];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(w * (0.2 + r() * 0.6), h * (0.2 + r() * 0.6), w * (0.08 + r() * 0.25), r() * 6, r() * 6 + 2 + r() * 3);
        ctx.lineTo(w / 2, h / 2);
        ctx.fill();
      }
    } else if (kind === 1) {
      let y = h * 0.1;
      while (y < h * 0.9) {
        const hh = h * (0.04 + r() * 0.12);
        const g = ctx.createLinearGradient(0, y, w, y + hh);
        g.addColorStop(0, LOYEL[2 + Math.floor(r() * 4)]);
        g.addColorStop(1, LOYEL[5 + Math.floor(r() * 5)]);
        ctx.fillStyle = g;
        ctx.fillRect(w * 0.12, y, w * 0.76, hh);
        y += hh + h * 0.02;
      }
    } else {
      ctx.strokeStyle = LOYEL[8]; ctx.lineWidth = w * 0.012;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        const y0 = h * (0.15 + i * 0.08);
        ctx.moveTo(w * 0.1, y0);
        ctx.bezierCurveTo(w * 0.4, y0 - h * 0.15 * r(), w * 0.6, y0 + h * 0.2 * r(), w * 0.9, y0 + h * 0.05);
        ctx.globalAlpha = 0.3 + r() * 0.6;
        ctx.stroke();
      }
    }
    // 一笔香槟金
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#c2a36b';
    ctx.fillRect(w * (0.15 + r() * 0.6), h * (0.15 + r() * 0.6), w * 0.05, h * 0.18);
    ctx.globalAlpha = 1;
    const t = toTex(c, {});
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// 书脊
export function booksTex() {
  return memo('books', () => {
    const W = 512, H = 128;
    const [c, ctx] = canvas(W, H);
    const r = rng(99);
    const cols = ['#2B4868', '#376392', '#8b5a36', '#d8cfc2', '#3e3a37', '#6C9AC4', '#a79b8c', '#5a3d2b', '#c2a36b', '#263B54'];
    let x = 0;
    while (x < W) {
      const bw = 8 + r() * 18, bh = H * (0.7 + r() * 0.3);
      ctx.fillStyle = cols[Math.floor(r() * cols.length)];
      ctx.fillRect(x, H - bh, bw - 1, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 2, H - bh + 10, bw - 5, 2);
      x += bw;
    }
    const t = toTex(c, {});
    t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

// 地台/庭院：浅灰水泥
export function concreteTex() {
  return memo('concrete', () => {
    const S = 512;
    const [c, ctx] = canvas(S);
    ctx.fillStyle = '#c9c8c4'; ctx.fillRect(0, 0, S, S);
    const r = rng(5);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.035)`;
      ctx.fillRect(r() * S, r() * S, 1 + r() * 3, 1 + r() * 3);
    }
    return toTex(c, {});
  });
}

// 天空：竖向渐变（用于背景球）
export function gradientTex(stops) {
  const [c, ctx] = canvas(4, 256);
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  stops.forEach(([o, col]) => g.addColorStop(o, col));
  ctx.fillStyle = g; ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
