/* 最会用脑 · 短片逐帧渲染器
 * 确定性渲染：capture.cjs 按顺序调用 renderFrame(i)，每帧返回一张 JPEG（base64）。
 * 全片只用 Loyel 渐变蓝十档色值，叠加混合（lighter）让粒子“发光”。 */
'use strict';

const W = 1920, H = 1080, FPS = 30, DT = 1 / FPS, TAU = Math.PI * 2;
const N = 7200;

const C = {
  c10: '#F4F7FB', c20: '#E8EEF6', c30: '#CCDBEB', c40: '#9FBDDA', c50: '#6C9AC4',
  c60: '#497DAE', c70: '#376392', c80: '#2E5076', c90: '#2B4868', c100: '#263B54',
};
const SPRITE_COLORS = [C.c10, C.c30, C.c40, C.c50, C.c60];
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
};

const SERIF = '"Noto Serif SC", serif';
const SANS = '"Noto Sans SC", sans-serif';
const OSWALD = '"Oswald", "Noto Sans SC", sans-serif';
const MONT = '"Montserrat", "Noto Sans SC", sans-serif';

/* ---------- 数学工具 ---------- */
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (a, b = 0) => {
  let h = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul(b + 0x632BE5AB, 0xC2B2AE35);
  h ^= h >>> 16; h = Math.imul(h, 0x7FEB352D); h ^= h >>> 15; h = Math.imul(h, 0x846CA68B); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = (t) => Math.pow(clamp(t), 3);
const lerp = (a, b, t) => a + (b - a) * t;
const win = (t, a, b, fi = 0.6, fo = 0.6) => Math.min(sstep(a, a + fi, t), 1 - sstep(b - fo, b, t));

const perm = new Uint8Array(512);
{
  const r = mulberry32(7), p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
function grad(h, x, y, z) {
  const u = h < 8 ? x : y, v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
  return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
}
function noise3(x, y, z) {
  const fx = Math.floor(x), fy = Math.floor(y), fz = Math.floor(z);
  const X = fx & 255, Y = fy & 255, Z = fz & 255;
  x -= fx; y -= fy; z -= fz;
  const u = fade(x), v = fade(y), w = fade(z);
  const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
  const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(perm[AA] & 15, x, y, z), grad(perm[BA] & 15, x - 1, y, z), u),
      lerp(grad(perm[AB] & 15, x, y - 1, z), grad(perm[BB] & 15, x - 1, y - 1, z), u), v),
    lerp(lerp(grad(perm[AA + 1] & 15, x, y, z - 1), grad(perm[BA + 1] & 15, x - 1, y, z - 1), u),
      lerp(grad(perm[AB + 1] & 15, x, y - 1, z - 1), grad(perm[BB + 1] & 15, x - 1, y - 1, z - 1), u), v), w);
}

/* ---------- 大脑点云：椭球平滑并集 + 噪声沟回 ---------- */
const BX = new Float32Array(N), BY = new Float32Array(N), BZ = new Float32Array(N), BR = new Uint8Array(N);
const NX = new Float32Array(N), NY = new Float32Array(N), NZ = new Float32Array(N);
const ELL = [
  [0.00, 0.10, 0.40, 0.98, 0.66, 0.40], [0.00, 0.10, -0.40, 0.98, 0.66, 0.40], // 两侧半球
  [0.30, 0.06, 0.38, 0.66, 0.64, 0.41], [0.30, 0.06, -0.38, 0.66, 0.64, 0.41], // 额叶
  [0.12, -0.36, 0.46, 0.56, 0.27, 0.30], [0.12, -0.36, -0.46, 0.56, 0.27, 0.30], // 颞叶
  [-0.66, -0.46, 0.22, 0.36, 0.23, 0.28], [-0.66, -0.46, -0.22, 0.36, 0.23, 0.28], // 小脑
  [-0.28, -0.72, 0.00, 0.13, 0.36, 0.13], // 脑干
];
function sdEll(x, y, z, e) {
  x -= e[0]; y -= e[1]; z -= e[2];
  const k0 = Math.hypot(x / e[3], y / e[4], z / e[5]);
  const k1 = Math.hypot(x / (e[3] * e[3]), y / (e[4] * e[4]), z / (e[5] * e[5]));
  return k1 === 0 ? -0.1 : (k0 * (k0 - 1)) / k1;
}
function smin(a, b, k) { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
let brainRegion = 0;
function brainSDF(x, y, z) {
  const e = ELL.map((q) => sdEll(x, y, z, q));
  const dl = smin(smin(e[0], e[2], 0.15), e[4], 0.05);
  const dr = smin(smin(e[1], e[3], 0.15), e[5], 0.05);
  const cer = smin(dl, dr, 0.02);
  const cbl = smin(e[6], e[7], 0.04);
  let d = smin(cer, cbl, 0.03);
  d = smin(d, e[8], 0.08);
  brainRegion = d === cer || cer < Math.min(cbl, e[8]) ? 0 : (cbl < e[8] ? 1 : 2);
  return d;
}
function genBrain() {
  const rnd = mulberry32(42);
  let n = 0;
  while (n < N) {
    let x = -1.1 + rnd() * 2.2, y = -1.15 + rnd() * 2.0, z = -0.95 + rnd() * 1.9;
    const d = brainSDF(x, y, z);
    if (Math.abs(d) > 0.02) continue;
    const reg = brainRegion, e = 0.004;
    let gx = brainSDF(x + e, y, z) - brainSDF(x - e, y, z);
    let gy = brainSDF(x, y + e, z) - brainSDF(x, y - e, z);
    let gz = brainSDF(x, y, z + e) - brainSDF(x, y, z - e);
    const gl = Math.hypot(gx, gy, gz) || 1;
    x -= (gx / gl) * d; y -= (gy / gl) * d; z -= (gz / gl) * d;
    let keep = 1;
    if (reg === 0) {
      const nn = noise3(x * 4.2 + 11, y * 4.2 + 3, z * 4.2 + 7) + 0.45 * noise3(x * 9 + 1, y * 9 + 2, z * 9 + 3);
      if (Math.abs(nn) < 0.1) keep = 0.05;
    } else if (reg === 1) {
      if (Math.sin(y * 70 + noise3(x * 3, y * 3, z * 3) * 4) < -0.3) keep = 0.12;
    } else keep = 0.5;
    if (rnd() > keep) continue;
    BX[n] = x; BY[n] = y; BZ[n] = z; BR[n] = reg;
    NX[n] = gx / gl; NY[n] = gy / gl; NZ[n] = gz / gl; n++;
  }
}

/* ---------- 粒子状态 ---------- */
const px = new Float32Array(N), py = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N);
const TX = new Float32Array(N), TY = new Float32Array(N), TS = new Float32Array(N), TB = new Float32Array(N);
const bri = new Float32Array(N), szc = new Float32Array(N), sz = new Float32Array(N), kS = new Float32Array(N);
const col = new Uint8Array(N);
const rA = new Float32Array(N), rB = new Float32Array(N), rC = new Float32Array(N), rD = new Float32Array(N);

function initParticles() {
  const r = mulberry32(1234);
  const weights = [0.12, 0.25, 0.3, 0.23, 0.1];
  for (let i = 0; i < N; i++) {
    rA[i] = r(); rB[i] = r(); rC[i] = r(); rD[i] = r();
    let u = r(), c = 0;
    while (c < weights.length - 1 && u > weights[c]) { u -= weights[c]; c++; }
    col[i] = c;
    sz[i] = 6 + Math.pow(r(), 2.2) * 16;
    kS[i] = 10 + r() * 22;
    px[i] = W / 2 + (r() - 0.5) * 8; py[i] = H / 2 + (r() - 0.5) * 8;
    bri[i] = 0; szc[i] = 0.6;
  }
}

/* ---------- 画布 ---------- */
let cv, ctx, P, pctx, B1, b1, B2, b2;
const SPR = [], GRAIN = [];
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function initCanvases() {
  cv = document.getElementById('c'); cv.width = W; cv.height = H;
  ctx = cv.getContext('2d');
  P = mkCanvas(W, H); pctx = P.getContext('2d');
  B1 = mkCanvas(W / 4, H / 4); b1 = B1.getContext('2d');
  B2 = mkCanvas(W / 8, H / 8); b2 = B2.getContext('2d');
  for (const hex of SPRITE_COLORS) {
    const s = mkCanvas(64, 64), g = s.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.1, rgba(hex, 1));
    gr.addColorStop(0.3, rgba(hex, 0.38));
    gr.addColorStop(0.65, rgba(hex, 0.07));
    gr.addColorStop(1, rgba(hex, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    SPR.push(s);
  }
  const r = mulberry32(99);
  for (let k = 0; k < 3; k++) {
    const s = mkCanvas(512, 512), g = s.getContext('2d'), im = g.createImageData(512, 512);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255;
    }
    g.putImageData(im, 0, 0); GRAIN.push(s);
  }
}

/* ---------- 文字点阵（粒子拼字） ---------- */
const textCache = new Map();
function textPoints(str, font, cx, cy, ls) {
  const key = str + font + cx + cy + ls;
  if (textCache.has(key)) return textCache.get(key);
  const c = mkCanvas(W, H), g = c.getContext('2d');
  g.font = font; g.letterSpacing = ls + 'px'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff'; g.fillText(str, cx + ls / 2, cy);
  const d = g.getImageData(0, 0, W, H).data, pts = [];
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 150) pts.push(x, y);
  const r = mulberry32(str.length * 31 + 5), n = pts.length / 2;
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    const ax = pts[2 * i], ay = pts[2 * i + 1];
    pts[2 * i] = pts[2 * j]; pts[2 * i + 1] = pts[2 * j + 1]; pts[2 * j] = ax; pts[2 * j + 1] = ay;
  }
  const out = Float32Array.from(pts);
  textCache.set(key, out);
  return out;
}

/* ---------- 时间轴信号 ---------- */
let TL = null;
function beatPulse(t) {
  let amp = 0;
  for (const [a, b, k] of TL.drums) if (t >= a && t < b) amp = k;
  if (!amp) return 0;
  const beat = 60 / TL.bpm, ph = t - Math.floor(t / beat) * beat;
  const down = Math.floor(t / beat + 1e-6) % 2 === 0 ? 1 : 0.55;
  return amp * down * Math.exp(-ph * 9);
}
function lastHit(t, list) { let h = -1e9; for (const x of list) if (t >= x && x > h) h = x; return h; }
function heartbeat(t) {
  let v = 0;
  for (const b of [1, 2, 3]) {
    if (t >= b) v = Math.max(v, Math.exp(-(t - b) * 10));
    if (t >= b + 0.22) v = Math.max(v, 0.7 * Math.exp(-(t - b - 0.22) * 10));
  }
  return v;
}

/* ---------- 队形（formation）：写入 TX/TY/TS/TB ---------- */
function fPoint(i0, i1, cx, cy, r, b) {
  for (let i = i0; i < i1; i++) {
    const a = rA[i] * TAU, ph = Math.acos(2 * rB[i] - 1), rr = r * Math.cbrt(rC[i]);
    TX[i] = cx + rr * Math.sin(ph) * Math.cos(a); TY[i] = cy + rr * Math.cos(ph); TS[i] = 0.55; TB[i] = b;
  }
}
function fDust(t, i0, i1, b, mask) {
  for (let i = i0; i < i1; i++) {
    const x = -0.05 * W + rA[i] * 1.1 * W + noise3(i * 0.031, t * 0.05, 1.7) * 140 + (rD[i] - 0.5) * t * 10;
    const y = -0.05 * H + rB[i] * 1.1 * H + noise3(i * 0.031, t * 0.05, 9.3) * 140 - rC[i] * t * 6;
    TX[i] = x; TY[i] = y; TS[i] = 0.35 + rC[i] * 0.5;
    TB[i] = b * (0.35 + 0.65 * rD[i]) * (mask ? mask(x, y) : 1);
  }
}
const fx = { lines: [], orbs: [], nets: null, eye: null };
const LIGHT = [-0.45, 0.6, 0.66];
function brainXY(j, o) {
  const cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw), cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
  const x = BX[j], y = BY[j], z = BZ[j];
  const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
  const y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
  const persp = 3.4 / (3.4 - z2 * 0.9);
  // 法线同样旋转：正对镜头的面更亮，掠射的轮廓不再堆成一圈亮边
  const nx1 = NX[j] * cyw + NZ[j] * syw, nz1 = -NX[j] * syw + NZ[j] * cyw;
  const ny1 = NY[j] * cp - nz1 * sp, nz2 = NY[j] * sp + nz1 * cp;
  const lit = Math.max(0, nx1 * LIGHT[0] + ny1 * LIGHT[1] + nz2 * LIGHT[2]);
  const shade = nz2 > 0 ? 0.3 + 0.45 * Math.sqrt(nz2) + 0.55 * lit : 0.12 + 0.1 * lit;
  return [o.cx + x1 * o.s * persp, o.cy - y1 * o.s * persp, persp, shade];
}
function fBrain(t, i0, i1, o) {
  for (let i = i0; i < i1; i++) {
    const j = i % N;
    const [x, y, persp, shade] = brainXY(j, o);
    TX[i] = x; TY[i] = y; TS[i] = persp * 0.8;
    let b = o.b * shade;
    if (o.bf) b *= o.bf(j, t);
    if (o.spark) {
      const slot = Math.floor(t * 3 + rD[i]);
      if (hash(i, slot) > 1 - o.spark) b += 1.4 * Math.exp(-((t * 3 + rD[i]) - slot) * 4);
    }
    if (o.wave) {
      const ph = ((t * 0.55) % 1.6) * 2 - 1.6;
      const s = BX[j] * 0.8 + BY[j] * 0.6;
      b += o.wave * Math.exp(-Math.pow((s - ph) * 5, 2));
    }
    TB[i] = b;
  }
}
function fText(i0, i1, pts, b, jit = 1.2) {
  const n = pts.length / 2;
  for (let i = i0; i < i1; i++) {
    const k = (i - i0) % n;
    TX[i] = pts[2 * k] + (hash(i, 1) - 0.5) * jit * 2; TY[i] = pts[2 * k + 1] + (hash(i, 2) - 0.5) * jit * 2;
    TS[i] = 0.42 + rC[i] * 0.2; TB[i] = b;
  }
}
function fRing(t, i0, i1, cx, cy, rx, ry, rot, b) {
  for (let i = i0; i < i1; i++) {
    const a = rA[i] * TAU + rot * (0.6 + rD[i] * 0.8);
    const th = (rB[i] - 0.5) * 2, rr = 1 + th * th * th * 0.09 + noise3(a * 2, t * 0.4, i * 0.01) * 0.03;
    TX[i] = cx + Math.cos(a) * rx * rr; TY[i] = cy + Math.sin(a) * ry * rr;
    const depth = Math.sin(a);
    TS[i] = 0.5 + 0.25 * (depth + 1) * 0.5 + rC[i] * 0.3; TB[i] = b * (0.45 + 0.55 * (depth + 1) * 0.5);
  }
}
function fOrb(t, i0, i1, cx, cy, r, b, spin = 0.6) {
  const cs = Math.cos(t * spin), sn = Math.sin(t * spin);
  for (let i = i0; i < i1; i++) {
    const a = rA[i] * TAU, ph = Math.acos(2 * rB[i] - 1), rr = r * (0.55 + 0.45 * Math.cbrt(rC[i]));
    const x = rr * Math.sin(ph) * Math.cos(a), y = rr * Math.cos(ph), z = rr * Math.sin(ph) * Math.sin(a);
    const x1 = x * cs + z * sn, z1 = -x * sn + z * cs;
    TX[i] = cx + x1; TY[i] = cy + y; TS[i] = 0.5 + 0.25 * (z1 / r + 1); TB[i] = b * (0.55 + 0.45 * (z1 / r + 1) * 0.5);
  }
}

/* 01 聚光：散乱的“干扰”粒子 → 聚光灯下的焦点 */
const FCX = 1370, FCY = 600;
function fFocus(t, t0) {
  const ph = t - t0, on = sstep(1.0, 2.4, ph);
  for (let i = 0; i < N; i++) {
    const sx = FCX + (rA[i] - 0.5) * 900 + noise3(i * 0.02, t * 0.3, 3) * 120;
    const sy = FCY + (rB[i] - 0.5) * 700 + noise3(i * 0.02, t * 0.3, 8) * 120;
    const sel = i % 5 === 0 && on > rD[i] * 0.85;
    if (sel) {
      const a = rA[i] * TAU + t * 0.8, p2 = Math.acos(2 * rB[i] - 1), rr = 85 * (0.35 + 0.65 * Math.cbrt(rC[i])) * (1 + beatPulse(t) * 0.12);
      TX[i] = FCX + rr * Math.sin(p2) * Math.cos(a); TY[i] = FCY + rr * Math.cos(p2);
      TS[i] = 0.7; TB[i] = 1.0;
    } else {
      TX[i] = sx; TY[i] = sy; TS[i] = 0.5 + rC[i] * 0.4;
      const inBeam = Math.abs(sx - FCX) < 60 + (sy + 80) * 0.18 ? 1 : 0;
      TB[i] = lerp(0.55, 0.06 + inBeam * 0.12, on) * (0.5 + 0.5 * rD[i]);
      // 走神时粒子还会“闪烁”——干扰
      if (on < 0.5 && hash(i, Math.floor(t * 6)) > 0.97) TB[i] += 0.9;
    }
  }
  return on;
}

/* 02 切换：执行控制网络 ⇄ 默认模式网络，突显网络做开关 */
const ECN = [1150, 500], DMN = [1610, 640], SN = [1390, 280];
function fSwitch(t, t0) {
  const ph = t - t0;
  const k = Math.floor(ph / 2), f = ph - k * 2;
  const actE = k % 2 === 0 ? 1 - sstep(1.75, 2, f) : sstep(1.75, 2, f);
  const e = sstep(0, 1.2, ph);
  const cs = Math.cos(t * 0.5), sn = Math.sin(t * 0.5);
  for (let i = 0; i < N; i++) {
    const g = i % 20;
    if (g < 9) { // ECN：规整的球壳，代表有秩序的专注
      const m = (i / 20) | 0;
      const idx = m + 0.5, tot = N / 20;
      const yy = 1 - (2 * idx) / tot, rr = Math.sqrt(1 - yy * yy), th = idx * 2.39996 + g * 0.7;
      const R = 150 * (1 + 0.03 * g) * (1 + beatPulse(t) * 0.06 * actE);
      const x = Math.cos(th) * rr * R, z = Math.sin(th) * rr * R;
      TX[i] = ECN[0] + x * cs + z * sn; TY[i] = ECN[1] + yy * R; TS[i] = 0.55 + 0.2 * ((-x * sn + z * cs) / R + 1);
      TB[i] = e * (0.12 + 0.95 * actE) * (0.55 + 0.45 * ((-x * sn + z * cs) / R + 1) * 0.5);
    } else if (g < 18) { // DMN：松散漂流的云，代表放空与联想
      const a = rA[i] * TAU, rr = 190 * Math.sqrt(-2 * Math.log(1 - rB[i] * 0.98)) * 0.5;
      TX[i] = DMN[0] + Math.cos(a + t * 0.15) * rr * 1.25 + noise3(i * 0.05, t * 0.25, 1) * 70;
      TY[i] = DMN[1] + Math.sin(a + t * 0.15) * rr * 0.85 + noise3(i * 0.05, t * 0.25, 4) * 70;
      TS[i] = 0.6 + rC[i] * 0.4; TB[i] = e * (0.12 + 0.95 * (1 - actE)) * (0.5 + 0.5 * rD[i]);
    } else { // 突显网络 + 流向当前活跃网络的光流
      if (rD[i] < 0.25) {
        const a = rA[i] * TAU + t;
        TX[i] = SN[0] + Math.cos(a) * 28; TY[i] = SN[1] + Math.sin(a) * 28; TS[i] = 0.6; TB[i] = e * (0.9 + beatPulse(t));
      } else {
        const tgt = actE > 0.5 ? ECN : DMN;
        const u = (rA[i] + t * 0.7) % 1;
        const mx = (SN[0] + tgt[0]) / 2 + (tgt === ECN ? -60 : 60), my = (SN[1] + tgt[1]) / 2 - 40;
        TX[i] = (1 - u) * (1 - u) * SN[0] + 2 * u * (1 - u) * mx + u * u * tgt[0] + (rB[i] - 0.5) * 14;
        TY[i] = (1 - u) * (1 - u) * SN[1] + 2 * u * (1 - u) * my + u * u * tgt[1] + (rC[i] - 0.5) * 14;
        TS[i] = 0.45; TB[i] = e * 0.85 * Math.sin(u * Math.PI);
      }
    }
  }
  return actE;
}

/* 03 觉察：一只由粒子组成、向内凝视的眼睛 */
const EYE = [1370, 560], EW = 390, EH = 170;
function eyeOpen(ph) {
  let o = easeOut((ph - 0.3) / 1.4);
  const bl = ph - 4.6; // 眨眼
  if (bl > 0 && bl < 0.45) o *= 1 - Math.sin((bl / 0.45) * Math.PI);
  return o;
}
function fEye(t, t0) {
  const ph = t - t0, open = eyeOpen(ph), rot = t * 0.25, beat = beatPulse(t);
  const lookX = Math.sin(ph * 0.7) * 30;
  for (let i = 0; i < N; i++) {
    const g = i % 20;
    if (g < 12) { // 上下眼睑
      const u = rA[i] * 2 - 1, up = g < 6;
      const lid = EH * Math.pow(1 - u * u, 0.85) * (up ? 1 : 0.8) * open;
      const fold = up && rB[i] < 0.25 ? 26 * Math.pow(1 - u * u, 0.9) : 0;
      TX[i] = EYE[0] + u * EW * (fold ? 0.92 : 1);
      TY[i] = EYE[1] + (up ? -lid - fold : lid) + (rC[i] - 0.5) * 6;
      TS[i] = 0.5 + rD[i] * 0.3; TB[i] = (fold ? 0.45 : 0.9) * sstep(0, 0.6, ph);
    } else if (g < 18) { // 虹膜：放射状纹理
      const spoke = Math.floor(rA[i] * 90) / 90 * TAU + rot;
      const isPupilEdge = g === 17;
      const r0 = isPupilEdge ? 46 * (1 + beat * 0.15) : 60 + rB[i] * 80;
      const a = spoke + (rC[i] - 0.5) * 0.03;
      let x = EYE[0] + lookX + Math.cos(a) * r0, y = EYE[1] + Math.sin(a) * r0;
      const lu = clamp((x - EYE[0]) / EW, -1, 1), lim = EH * Math.pow(1 - lu * lu, 0.85) * open * 0.92;
      const vis = Math.abs(y - EYE[1]) < lim ? 1 : 0;
      if (!vis) y = EYE[1] + Math.sign(y - EYE[1]) * lim;
      TX[i] = x; TY[i] = y; TS[i] = 0.45 + rD[i] * 0.3;
      TB[i] = vis * (isPupilEdge ? 1 : 0.4 + 0.5 * (1 - (r0 - 60) / 80)) * sstep(0.6, 1.6, ph);
    } else { // 高光与外层光晕
      if (g === 18) {
        TX[i] = EYE[0] + lookX + 30 + (rA[i] - 0.5) * 18; TY[i] = EYE[1] - 32 + (rB[i] - 0.5) * 18;
        TS[i] = 0.5; TB[i] = 1.2 * open * sstep(1, 2, ph);
      } else {
        const a = rA[i] * TAU, rr = 470 + rB[i] * 120;
        TX[i] = EYE[0] + Math.cos(a + t * 0.05) * rr; TY[i] = EYE[1] + Math.sin(a + t * 0.05) * rr * 0.62;
        TS[i] = 0.4; TB[i] = 0.18 * sstep(0, 1, ph);
      }
    }
  }
}

/* 04 重塑：神经网络生长，常用的连接变亮，不用的连接消退 */
let NET = null;
function buildNet() {
  const r = mulberry32(2024), nodes = [];
  while (nodes.length < 44) {
    const x = 1010 + r() * 760, y = 230 + r() * 640;
    if (nodes.every(([a, b]) => Math.hypot(a - x, b - y) > 82)) nodes.push([x, y]);
  }
  const edges = [], seen = new Set();
  nodes.forEach(([x, y], a) => {
    const near = nodes.map(([u, v], b) => [Math.hypot(u - x, v - y), b]).sort((p, q) => p[0] - q[0]).slice(1, 4);
    for (const [, b] of near) {
      const key = Math.min(a, b) + '-' + Math.max(a, b);
      if (seen.has(key)) continue;
      seen.add(key);
      const birth = r() < 0.18 ? -1 : 0.4 + r() * 5.2;
      const death = r() < 0.14 && birth < 3 ? 4.6 + r() * 1.8 : 99;
      edges.push({ a, b, birth, death, seed: r() });
    }
  });
  NET = { nodes, edges };
}
function edgeGrowth(e, ph) {
  const g = clamp((ph - e.birth) / 0.9);
  const d = 1 - clamp((ph - e.death) / 0.8);
  return easeOut(g) * d;
}
function fNet(t, t0) {
  const ph = t - t0, { nodes, edges } = NET, appear = sstep(0, 0.8, ph);
  fx.lines.length = 0;
  for (const e of edges) {
    const g = edgeGrowth(e, ph);
    if (g <= 0.01) continue;
    const [ax, ay] = nodes[e.a], [bx, by] = nodes[e.b];
    const dying = ph > e.death ? 0.35 : 1;
    fx.lines.push([ax, ay, ax + (bx - ax) * g, ay + (by - ay) * g, 0.32 * dying * appear]);
  }
  for (let i = 0; i < N; i++) {
    if (i % 4 === 0) {
      const nd = nodes[Math.floor(rA[i] * nodes.length)];
      const a = rB[i] * TAU, rr = 9 * Math.sqrt(rC[i]) * (1 + beatPulse(t) * 0.3);
      TX[i] = nd[0] + Math.cos(a) * rr; TY[i] = nd[1] + Math.sin(a) * rr; TS[i] = 0.55; TB[i] = 0.95 * appear;
    } else {
      const e = edges[Math.floor(rA[i] * edges.length)];
      const [ax, ay] = nodes[e.a], [bx, by] = nodes[e.b];
      const g = edgeGrowth(e, ph), u = Math.min(rB[i], g);
      const nx = -(by - ay), ny = bx - ax, nl = Math.hypot(nx, ny) || 1;
      const off = (rC[i] - 0.5) * 3;
      TX[i] = ax + (bx - ax) * u + (nx / nl) * off; TY[i] = ay + (by - ay) * u + (ny / nl) * off;
      TS[i] = 0.38;
      const q = (t * 0.8 + e.seed) % 1;
      const pulse = 1.3 * Math.exp(-Math.pow((u - q) * 10, 2));
      const tip = rB[i] > g ? 0.9 : 0; // 生长锥
      const dying = ph > e.death ? 0.3 : 1;
      TB[i] = appear * (g > 0.01 ? (0.4 + pulse + tip) * dying : 0);
    }
  }
}

/* 05 充电：慢波（深睡眠） */
function fWaves(t, t0) {
  const ph = t - t0, e = sstep(0, 1.5, ph);
  for (let i = 0; i < N; i++) {
    const b = i % 6, u = rA[i];
    const x = -60 + u * (W + 120);
    const amp = 80 * (1 - Math.abs(b - 2.5) / 4);
    const y = 600 + (b - 2.5) * 40 + amp * Math.sin(TAU * (u * 1.25 - t * 0.12 * (1 + b * 0.06)) + b * 0.8)
      + (rB[i] - 0.5) * 10;
    TX[i] = x; TY[i] = y; TS[i] = 0.55 + rC[i] * 0.5;
    TB[i] = e * (0.35 + 0.4 * rD[i]) * (0.07 + 0.93 * sstep(650, 1250, x));
  }
}

/* 收束：五束光绕着大脑旋转，最后汇入 */
const ORB_NAMES = ['聚光', '切换', '觉察', '重塑', '充电'];
function orbPositions(t, t0, cx, cy) {
  const ph = t - t0, conv = easeIn((ph - 4.2) / 3.4);
  const ang = ph * 0.55 + ph * ph * 0.035;
  return ORB_NAMES.map((name, k) => {
    const a = ang + (k / 5) * TAU;
    const depth = Math.sin(a);
    return { name, x: cx + Math.cos(a) * 580 * (1 - conv), y: cy + depth * 150 * (1 - conv), depth, conv };
  });
}

/* ---------- 每帧的总编排 ---------- */
const BRAIN_LEFT_TEXT = { cx: 1450, cy: 540, s: 245 };
function targets(t) {
  const env = { noise: 30, swirl: 0, stiff: 1, damp: 0.78, briMul: 1, sizeMul: 1, beams: 0.25, glow: 1 };
  fx.lines.length = 0; fx.orbs = []; fx.focus = 0; fx.act = -1;

  if (t < 4) { // 黑暗中的一颗光点，随心跳搏动
    const hb = heartbeat(t);
    fPoint(0, N, W / 2, H / 2, 5 + hb * 16, 0.035 + hb * 0.03);
    env.noise = 4; env.beams = 0.05 + hb * 0.05; env.stiff = 3;
  } else if (t < 8) { // 爆开成星尘：860 亿个神经元
    fDust(t, 0, N, 0.75, (x, y) => 0.25 + 0.75 * sstep(120, 420, Math.hypot((x - 960) / 1.6, y - 540)));
    env.noise = 45; env.beams = 0.25; env.stiff = 0.8;
  } else if (t < 16) { // 星尘汇成大脑
    const dim = 1 - 0.7 * sstep(12, 13, t);
    const s = lerp(310, 280, sstep(12, 14, t));
    fBrain(t, 0, N, { cx: 960, cy: lerp(470, 520, sstep(12, 14, t)), s, yaw: 0.28 + Math.sin(t * 0.3) * 0.3, pitch: -0.22, b: 0.9 * dim, spark: 0.012 });
    env.noise = 20; env.swirl = t < 10 ? 2.5 : 0; env.beams = 0.3;
  } else if (t < 40) { // 三个误区
    const k = Math.floor((t - 16) / 8), t0 = 16 + k * 8, ph = t - t0, strike = t0 + 2;
    const o = { ...BRAIN_LEFT_TEXT, yaw: 0.28 + Math.sin(t * 0.3) * 0.3, pitch: -0.22, b: 0.85, spark: 0.01 };
    if (k === 0) { // 更大的脑？变大 → 被划掉后回落
      const grow = sstep(t0 + 0.2, t0 + 1.6, t) * (1 - sstep(strike, strike + 0.6, t));
      o.s = 245 * (1 + 0.45 * grow); o.b = 0.85 + 0.3 * grow;
    } else if (k === 1) { // 10% → 100%
      const all = sstep(strike, strike + 0.5, t);
      o.bf = (j) => {
        const lit = noise3(BX[j] * 2.2 + 5, BY[j] * 2.2, BZ[j] * 2.2) > 0.3 ? 1 : 0;
        return lerp(0.08 + lit * 1.3, 1.15, all);
      };
      o.spark = all * 0.03;
    } else { // 疯狂空转 → 平静、高效
      const calm = sstep(strike, strike + 1.2, t), frantic = sstep(t0, t0 + 0.6, t) * (1 - calm);
      o.yaw = 0.28 + Math.sin(t * 0.3) * 0.3 + frantic * Math.sin(t * 9) * 0.2;
      o.b = 0.85 * (1 - calm * 0.25);
      o.bf = (j, tt) => 1 + frantic * (hash(j, Math.floor(tt * 14)) > 0.7 ? 1.2 : -0.4);
      env.noise = 30 + frantic * 520;
      o.spark = 0.01 + calm * 0.01;
    }
    void ph;
    fBrain(t, 0, N, o);
    env.beams = 0.35;
  } else if (t < 48) { // 转折：大脑塌缩成一点
    if (t < 44) {
      fBrain(t, 0, N, { cx: lerp(1450, 960, easeOut((t - 40) / 2)), cy: lerp(540, 470, easeOut((t - 40) / 2)), s: lerp(245, 300, easeOut((t - 40) / 2)), yaw: 0.28 + Math.sin(t * 0.3) * 0.3 - (t - 40) * (t - 40) * 0.05, pitch: -0.22, b: 0.9, spark: 0.02, wave: 0.6 });
      env.beams = 0.35;
    } else {
      const c = easeIn((t - 44) / 3.4);
      fPoint(0, N, 960, 520, lerp(260, 6, c), lerp(0.35, 0.05, c));
      env.swirl = 4 + c * 6; env.noise = 30; env.stiff = 1.3; env.beams = 0.2 * (1 - c);
      if (t > 47.5) env.briMul = 0.6;
    }
  } else if (t < 52) { // 爆发：大脑的指挥家
    const pts = textPoints('大脑的指挥家', `900 210px ${SERIF}`, 960, 560, 24);
    fText(0, N, pts, 0.42);
    env.noise = 10; env.stiff = 1.25; env.beams = 1; env.damp = 0.6;
  } else if (t < 56) { // 光环
    if (t < 55) fRing(t, 0, N, 960, 545, 760, 300, t * 0.35, 0.8);
    else {
      const ring = (k) => ({ x: 960 + Math.cos(k / 5 * TAU - Math.PI / 2 + t * 0.35) * 760, y: 545 + Math.sin(k / 5 * TAU - Math.PI / 2 + t * 0.35) * 300 });
      const per = Math.floor(N / 5);
      for (let k = 0; k < 5; k++) { const p = ring(k); fOrb(t, k * per, k === 4 ? N : (k + 1) * per, p.x, p.y, 46, 1.0); }
    }
    env.beams = 0.7; env.swirl = 1.5;
  } else if (t < 64) { fx.focus = fFocus(t, 56); env.beams = 0.25; env.noise = 25; }
  else if (t < 72) { fx.act = fSwitch(t, 64); env.beams = 0.25; env.noise = 18; }
  else if (t < 80) { fEye(t, 72); env.beams = 0.3; env.noise = 10; env.stiff = 1.4; }
  else if (t < 88) { fNet(t, 80); env.beams = 0.25; env.noise = 8; env.stiff = 1.3; }
  else if (t < 96) { fWaves(t, 88); env.beams = 0.12; env.noise = 12; env.stiff = 0.7; }
  else if (t < 104) { // 五束光汇入大脑
    const orbs = orbPositions(t, 96, 960, 470), conv = orbs[0].conv, per = Math.floor(N * 0.1);
    orbs.forEach((o, k) => fOrb(t, k * per, (k + 1) * per, o.x, o.y, 40 * (1 + 0.25 * o.depth), 0.95 * (0.6 + 0.4 * (o.depth + 1) / 2), 1.2));
    fBrain(t, per * 5, N, { cx: 960, cy: 470, s: lerp(170, 300, conv), yaw: 0.1 + (t - 96) * 0.06, pitch: -0.22, b: lerp(0.45, 1, conv), spark: 0.02 });
    fx.orbs = orbs; env.beams = 0.3 + conv * 0.4; env.swirl = conv * 2;
    if (t > 103.75) env.briMul = 0.75;
  } else if (t < 116) { // 高潮：燃烧的大脑
    const yaw = 0.3 + Math.sin((t - 104) * 0.45) * 0.4;
    fBrain(t, 0, N, { cx: 960, cy: 440, s: 300 * (1 + beatPulse(t) * 0.04), yaw, pitch: -0.2, b: 1.0, spark: 0.035, wave: 1.0 });
    env.beams = 1; env.noise = 18;
  } else if (t < 120) { // 光环包围最终答案
    fRing(t, 0, N, 960, 540, 820, 330, (t - 116) * 0.5, 0.75);
    env.beams = 0.9; env.swirl = 2;
  } else { // 结尾：粒子拼出「最会用脑」，最后随风散去
    const pts = textPoints('最会用脑', `900 250px ${SERIF}`, 960, 470, 40);
    if (t < 128) fText(0, N, pts, 0.45);
    else {
      const e = sstep(128, 131, t);
      fText(0, N, pts, 0.45 * (1 - e));
      for (let i = 0; i < N; i++) { TY[i] -= e * (80 + rA[i] * 260); TX[i] += e * (rB[i] - 0.5) * 200; }
      env.noise = 40 + e * 120;
    }
    env.beams = lerp(0.8, 0.15, sstep(122, 130, t)); env.stiff = 1.2;
  }
  return env;
}

/* ---------- 物理：弹簧 + 噪声流 + 涡旋 ---------- */
function kick(cx, cy, vmin, vmax) {
  for (let i = 0; i < N; i++) {
    let dx = px[i] - cx, dy = py[i] - cy; const d = Math.hypot(dx, dy) || 1;
    if (d < 2) { dx = Math.cos(rA[i] * TAU); dy = Math.sin(rA[i] * TAU); } else { dx /= d; dy /= d; }
    const v = lerp(vmin, vmax, Math.pow(rB[i], 0.7));
    vx[i] += dx * v; vy[i] += dy * v;
  }
}
const KICKS = [[4, 960, 540, 300, 2200], [48, 960, 520, 600, 3200], [104, 960, 470, 200, 900], [116, 960, 440, 500, 1800]];
function step(t, env) {
  for (const [kt, cx, cy, a, b] of KICKS) if (t - DT < kt && t >= kt) kick(cx, cy, a, b);
  const ns = env.noise, sw = env.swirl;
  for (let i = 0; i < N; i++) {
    const dx = TX[i] - px[i], dy = TY[i] - py[i];
    const k = kS[i] * env.stiff, c = 2 * Math.sqrt(k) * env.damp;
    const a = noise3(px[i] * 0.0025, py[i] * 0.0025, t * 0.15 + rD[i] * 0.3) * TAU * 2;
    const ax = dx * k - vx[i] * c + Math.cos(a) * ns - dy * sw;
    const ay = dy * k - vy[i] * c + Math.sin(a) * ns + dx * sw;
    vx[i] += ax * DT; vy[i] += ay * DT; px[i] += vx[i] * DT; py[i] += vy[i] * DT;
    bri[i] += (TB[i] - bri[i]) * Math.min(1, DT * 5);
    szc[i] += (TS[i] - szc[i]) * Math.min(1, DT * 5);
  }
}

/* ---------- 光：背景、光柱、闪光 ---------- */
function drawBackground(t, env) {
  ctx.fillStyle = '#000'; ctx.fillRect(-50, -50, W + 100, H + 100);
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, 1150);
  const breathe = 0.42 + 0.08 * Math.sin(t * 0.6) + env.beams * 0.18;
  g.addColorStop(0, rgba(C.c100, breathe));
  g.addColorStop(0.55, rgba(C.c100, breathe * 0.35));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 体积光柱
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const inten = env.beams * (1 + beatPulse(t) * 0.6);
  for (let k = 0; k < 6; k++) {
    const x0 = W * (0.12 + 0.152 * k) + Math.sin(t * 0.13 + k * 2.1) * 90;
    const ang = (k - 2.5) * 0.11 + Math.sin(t * 0.09 + k * 1.7) * 0.12;
    const len = 1500, wTop = 26, wBot = 300 + 120 * Math.sin(k * 3.3);
    ctx.save(); ctx.translate(x0, -120); ctx.rotate(ang);
    const lg = ctx.createLinearGradient(0, 0, 0, len);
    const a = 0.13 * inten * (0.6 + 0.4 * Math.sin(t * 0.4 + k));
    lg.addColorStop(0, rgba(k % 2 ? C.c50 : C.c60, a)); lg.addColorStop(0.7, rgba(C.c70, a * 0.25)); lg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(-wTop, 0); ctx.lineTo(wTop, 0); ctx.lineTo(wBot, len); ctx.lineTo(-wBot, len); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  if (fx.focus > 0) { // 聚光灯
    const a = fx.focus;
    const lg = ctx.createLinearGradient(0, -80, 0, H);
    lg.addColorStop(0, rgba(C.c30, 0.30 * a)); lg.addColorStop(0.55, rgba(C.c40, 0.12 * a)); lg.addColorStop(1, rgba(C.c50, 0));
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.moveTo(FCX - 30, -80); ctx.lineTo(FCX + 30, -80); ctx.lineTo(FCX + 260, H); ctx.lineTo(FCX - 260, H); ctx.closePath(); ctx.fill();
    const pool = ctx.createRadialGradient(FCX, FCY, 0, FCX, FCY, 260);
    pool.addColorStop(0, rgba(C.c40, 0.22 * a)); pool.addColorStop(1, rgba(C.c40, 0));
    ctx.fillStyle = pool; ctx.fillRect(FCX - 300, FCY - 300, 600, 600);
  }
  ctx.restore();
}

function drawParticles(t, env) {
  pctx.setTransform(1, 0, 0, 1, 0, 0);
  pctx.globalCompositeOperation = 'source-over'; pctx.globalAlpha = 1;
  pctx.clearRect(0, 0, W, H);
  pctx.globalCompositeOperation = 'lighter';
  for (const [x1, y1, x2, y2, a] of fx.lines) {
    pctx.globalAlpha = a; pctx.strokeStyle = C.c50; pctx.lineWidth = 1.4;
    pctx.beginPath(); pctx.moveTo(x1, y1); pctx.lineTo(x2, y2); pctx.stroke();
  }
  const pulse = beatPulse(t);
  const bm = env.briMul * (1 + pulse * 0.45), sm = env.sizeMul * (1 + pulse * 0.2);
  for (let i = 0; i < N; i++) {
    const a = bri[i] * bm;
    if (a < 0.012) continue;
    const s = sz[i] * szc[i] * sm, x = px[i], y = py[i];
    if (x < -s || y < -s || x > W + s || y > H + s) continue;
    pctx.globalAlpha = a > 1 ? 1 : a;
    pctx.drawImage(SPR[col[i]], x - s / 2, y - s / 2, s, s);
    if (a > 1) { pctx.globalAlpha = Math.min(1, a - 1); pctx.drawImage(SPR[0], x - s * 0.35, y - s * 0.35, s * 0.7, s * 0.7); }
  }
  pctx.globalAlpha = 1;
  // 辉光（bloom）：两级降采样模糊后叠加
  b1.globalCompositeOperation = 'copy'; b1.filter = 'blur(3px)'; b1.drawImage(P, 0, 0, W / 4, H / 4); b1.filter = 'none';
  b2.globalCompositeOperation = 'copy'; b2.filter = 'blur(4px)'; b2.drawImage(B1, 0, 0, W / 8, H / 8); b2.filter = 'none';
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.85 * env.glow; ctx.drawImage(B2, 0, 0, W, H);
  ctx.globalAlpha = 0.9 * env.glow; ctx.drawImage(B1, 0, 0, W, H);
  ctx.globalAlpha = 1; ctx.drawImage(P, 0, 0);
  ctx.restore();
}

function drawImpacts(t) {
  const bh = lastHit(t, TL.bigHits), dh = t - bh;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (dh >= 0 && dh < 1.6) {
    const cx = 960, cy = bh === 104 ? 470 : 540;
    // 冲击波光环
    const r = dh * 1500, a = Math.max(0, 1 - dh / 1.2);
    ctx.strokeStyle = rgba(C.c30, 0.55 * a); ctx.lineWidth = 3 + 24 * a;
    ctx.shadowColor = C.c50; ctx.shadowBlur = 40;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.92, 0, 0, TAU); ctx.stroke();
    ctx.shadowBlur = 0;
    // 横向镜头光晕
    const fa = Math.exp(-dh * 2.2);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(9, 0.35);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
    g.addColorStop(0, rgba(C.c10, 0.9 * fa)); g.addColorStop(0.3, rgba(C.c40, 0.4 * fa)); g.addColorStop(1, rgba(C.c60, 0));
    ctx.fillStyle = g; ctx.fillRect(-160, -160, 320, 320); ctx.restore();
    // 闪白
    ctx.fillStyle = rgba(C.c20, 0.55 * Math.exp(-dh * 5)); ctx.fillRect(0, 0, W, H);
  }
  const h = lastHit(t, TL.hits), d2 = t - h;
  if (d2 >= 0 && d2 < 0.8) { ctx.fillStyle = rgba(C.c40, 0.13 * Math.exp(-d2 * 7)); ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

/* ---------- 文字 ---------- */
function setFont(g, o) { g.font = `${o.w || 400} ${o.z}px ${o.f}`; g.letterSpacing = (o.ls || 0) + 'px'; }
function txt(t, o) {
  if (t < o.t0 - 0.05 || t > o.t1) return;
  const fi = o.fi ?? 0.7, fo = o.fo ?? 0.5, st = o.st ?? 0.045;
  const outA = 1 - sstep(o.t1 - fo, o.t1, t);
  const dimA = o.strike !== undefined ? lerp(1, 0.38, sstep(o.strike + 0.15, o.strike + 0.6, t)) : 1;
  ctx.save();
  setFont(ctx, o);
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const chars = [...o.s];
  const full = ctx.measureText(o.s).width - (o.ls || 0);
  const x0 = o.align === 'left' ? o.x : o.x - full / 2;
  const color = o.c || '#FFFFFF';
  const drawAll = (fill, glowMul) => {
    let acc = '';
    chars.forEach((ch, k) => {
      const xk = x0 + (acc ? ctx.measureText(acc).width : 0);
      acc += ch;
      const p = o.perChar === false ? clamp((t - o.t0) / fi) : clamp((t - o.t0 - k * st) / fi);
      if (p <= 0) return;
      const e = easeOut(p);
      const a = e * outA * dimA * (o.a ?? 1);
      if (a <= 0.003) return;
      ctx.globalAlpha = a;
      const blur = (1 - e) * 10 + (1 - outA) * 6;
      ctx.filter = blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : 'none';
      ctx.fillStyle = fill;
      if (o.glow) { ctx.shadowColor = rgba(C.c50, 0.95); ctx.shadowBlur = o.glow * glowMul; } else ctx.shadowBlur = 0;
      ctx.fillText(ch, xk, o.y + (1 - e) * 22 - (1 - outA) * 10);
    });
  };
  if (o.perChar === false) {
    const p = clamp((t - o.t0) / fi), e = easeOut(p);
    ctx.globalAlpha = e * outA * dimA * (o.a ?? 1);
    ctx.fillStyle = color;
    if (o.glow) { ctx.shadowColor = rgba(C.c50, 0.9); ctx.shadowBlur = o.glow; }
    ctx.fillText(o.s, x0, o.y + (1 - e) * 12);
  } else {
    drawAll(color, 1);
    if (o.glow) drawAll(color, 0.35);
  }
  ctx.filter = 'none';
  // 扫光
  if (o.sweep !== undefined && t > o.sweep && t < o.sweep + 1.3) {
    const sp = (t - o.sweep) / 1.3, bx = x0 - 200 + sp * (full + 400);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(bx - 40, o.y - o.z); ctx.lineTo(bx + 60, o.y - o.z); ctx.lineTo(bx + 10, o.y + o.z); ctx.lineTo(bx - 90, o.y + o.z); ctx.clip();
    ctx.globalAlpha = outA * Math.sin(sp * Math.PI);
    ctx.fillStyle = '#FFFFFF'; ctx.shadowColor = C.c10; ctx.shadowBlur = 30;
    ctx.fillText(o.s, x0, o.y);
    ctx.restore();
  }
  // 划线（误区被排除）
  if (o.strike !== undefined && t > o.strike) {
    const sp = easeOut((t - o.strike) / 0.35);
    ctx.globalAlpha = outA; ctx.filter = 'none';
    ctx.strokeStyle = C.c20; ctx.lineWidth = 5; ctx.shadowColor = C.c40; ctx.shadowBlur = 22;
    ctx.beginPath(); ctx.moveTo(x0 - 16, o.y + 4); ctx.lineTo(x0 - 16 + (full + 32) * sp, o.y + 4); ctx.stroke();
  }
  ctx.restore();
}
function divider(t, x, y, w, t0, t1) {
  if (t < t0 || t > t1) return;
  const p = easeOut((t - t0) / 0.7), a = 1 - sstep(t1 - 0.45, t1, t);
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, rgba(C.c40, 0.9 * a)); g.addColorStop(1, rgba(C.c60, 0));
  ctx.fillStyle = g; ctx.fillRect(x, y, w * p, 2);
}
function band(t, y, h, t0, t1, a = 0.55) { // 文字下方的暗带，保证可读
  const k = win(t, t0, t1, 0.6, 0.6) * a;
  if (k <= 0) return;
  const g = ctx.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, y - h, W, h * 2);
}
function sidePanel(t, t0, t1) { // 左侧文字区的暗部
  const k = win(t, t0, t1, 0.8, 0.8);
  if (k <= 0) return;
  const g = ctx.createLinearGradient(0, 0, 1150, 0);
  g.addColorStop(0, `rgba(0,0,0,${0.55 * k})`); g.addColorStop(0.7, `rgba(0,0,0,${0.25 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1150, H);
}

const MYTHS = [
  { main: '脑子最大的人？', d: ['脑容量与智力只有弱相关（r ≈ 0.24）', '大，不等于会用'], cite: 'Pietschnig et al., 2015 · Neuroscience & Biobehavioral Reviews' },
  { main: '「开发了 100% 大脑」的人？', d: ['“人只用了 10% 的大脑”是流传最广的神经谣言', '你本来就在使用整个大脑'], cite: 'Beyerstein, 1999 · Mind Myths' },
  { main: '一刻不停、拼命运转的人？', d: ['大脑只占体重的 2%，却消耗约 20% 的能量', '高手做同样的事，大脑往往更「省电」'], cite: 'Raichle & Gusnard, 2002 · PNAS   |   Haier et al., 1988 · Intelligence' },
];
const ABILITIES = [
  { zh: '聚光', en: 'FOCUS', sub: '把有限的注意力，打在最重要的事上', m: ['前额叶皮层（PFC）自上而下地分配注意，', '放大目标、压住干扰'], cite: 'Miller & Cohen, 2001 · Annual Review of Neuroscience' },
  { zh: '切换', en: 'SWITCH', sub: '该专注时专注，该放空时放空', m: ['突显网络像一个开关，在「执行控制网络」', '与「默认模式网络」之间灵活切换'], cite: 'Menon & Uddin, 2010 · Brain Struct Funct   |   Beaty et al., 2018 · PNAS' },
  { zh: '觉察', en: 'METACOGNITION', sub: '知道自己知道什么，也知道自己不知道什么', m: ['前额叶前部像一位「内在裁判」，', '为自己的判断打分、及时纠错'], cite: 'Fleming et al., 2010 · Science' },
  { zh: '重塑', en: 'PLASTICITY', sub: '大脑会被经历改写——用进废退', m: ['伦敦出租车司机的后部海马体更大；', '练习杂耍 3 个月，相关脑区灰质增加'], cite: 'Maguire et al., 2000 · PNAS   |   Draganski et al., 2004 · Nature' },
  { zh: '充电', en: 'RECHARGE', sub: '休息不是浪费，睡眠在为记忆「存档」', m: ['深睡眠巩固白天学到的东西；睡眠时，', '大脑清除代谢废物更高效（小鼠研究）'], cite: 'Diekelmann & Born, 2010 · Nat Rev Neurosci   |   Xie et al., 2013 · Science' },
];
const W_ = '#FFFFFF';

function drawOverlay(t) {
  // 序章
  txt(t, { s: '你的颅骨里，藏着约', x: 960, y: 420, f: SANS, w: 300, z: 40, c: C.c30, ls: 6, t0: 4.4, t1: 7.8 });
  txt(t, { s: '860 亿个神经元', x: 960, y: 548, f: SERIF, w: 900, z: 120, c: W_, glow: 40, ls: 4, t0: 4.8, t1: 7.8, sweep: 5.9 });
  txt(t, { s: 'Azevedo et al., 2009 · J Comp Neurol', x: 960, y: 652, f: MONT, w: 400, z: 20, c: C.c50, ls: 2, t0: 5.4, t1: 7.8, perChar: false });
  band(t, 905, 90, 8.9, 11.9, 0.5);
  txt(t, { s: '每个人，都有一颗大脑', x: 960, y: 905, f: SERIF, w: 900, z: 56, c: W_, glow: 24, ls: 8, t0: 9.0, t1: 11.9 });
  txt(t, { s: '但——', x: 960, y: 395, f: SERIF, w: 900, z: 54, c: C.c40, ls: 10, t0: 12.2, t1: 15.6 });
  txt(t, { s: '什么样的人，', x: 960, y: 522, f: SERIF, w: 900, z: 96, c: W_, glow: 30, ls: 6, t0: 12.8, t1: 15.6 });
  txt(t, { s: '才算「最会用脑」？', x: 960, y: 655, f: SERIF, w: 900, z: 110, c: W_, glow: 46, ls: 6, t0: 13.4, t1: 15.6, sweep: 14.4 });

  // 三个误区
  sidePanel(t, 16, 39.7);
  txt(t, { s: '先排除三个误区', x: 150, y: 250, f: SANS, w: 500, z: 26, c: C.c50, ls: 10, align: 'left', t0: 16.2, t1: 39.6 });
  MYTHS.forEach((m, k) => {
    const t0 = 16 + k * 8, t1 = t0 + 7.65;
    txt(t, { s: `误区 0${k + 1}`, x: 150, y: 370, f: SANS, w: 500, z: 28, c: C.c40, ls: 10, align: 'left', t0: t0 + 0.2, t1 });
    txt(t, { s: m.main, x: 150, y: 468, f: SERIF, w: 900, z: 70, c: W_, glow: 26, ls: 4, align: 'left', t0: t0 + 0.4, t1, strike: t0 + 2 });
    txt(t, { s: m.d[0], x: 150, y: 570, f: SANS, w: 300, z: 34, c: C.c30, ls: 2, align: 'left', t0: t0 + 2.4, t1, st: 0.02 });
    txt(t, { s: m.d[1], x: 150, y: 624, f: SANS, w: 500, z: 34, c: C.c10, ls: 2, align: 'left', t0: t0 + 2.9, t1, st: 0.025 });
    txt(t, { s: m.cite, x: 150, y: 700, f: MONT, w: 400, z: 19, c: C.c50, ls: 1, align: 'left', t0: t0 + 3.4, t1, perChar: false });
  });

  // 转折
  band(t, 880, 90, 40.4, 43.7, 0.5);
  txt(t, { s: '那么，答案是——', x: 960, y: 880, f: SERIF, w: 900, z: 60, c: W_, glow: 30, ls: 12, t0: 40.5, t1: 43.6 });

  // 定义
  txt(t, { s: '最会用脑的人，是', x: 960, y: 360, f: SANS, w: 500, z: 44, c: C.c30, ls: 10, t0: 48.3, t1: 51.8 });
  txt(t, { s: '大脑的指挥家', x: 960, y: 560, f: SERIF, w: 900, z: 210, c: W_, glow: 50, ls: 24, t0: 49.2, t1: 51.8, a: 0.3, st: 0.08, fi: 1.0, sweep: 50.2 });
  txt(t, { s: 'THE CONDUCTOR OF YOUR OWN BRAIN', x: 960, y: 738, f: OSWALD, w: 300, z: 34, c: C.c40, ls: 18, t0: 48.9, t1: 51.8, st: 0.025 });
  txt(t, { s: '不是用得最多，', x: 960, y: 470, f: SERIF, w: 900, z: 76, c: C.c40, glow: 16, ls: 6, t0: 52.2, t1: 55.8 });
  txt(t, { s: '而是用得最「对」。', x: 960, y: 602, f: SERIF, w: 900, z: 104, c: W_, glow: 44, ls: 6, t0: 52.8, t1: 55.8, sweep: 53.8 });
  txt(t, { s: '五种能力 · 五束光', x: 960, y: 800, f: SANS, w: 500, z: 32, c: C.c40, ls: 14, t0: 54.3, t1: 55.8 });

  // 五种能力
  ABILITIES.forEach((ab, k) => {
    const t0 = 56 + k * 8, t1 = t0 + 7.7;
    if (t < t0 - 0.1 || t > t1) return;
    sidePanel(t, t0, t1 + 0.1);
    txt(t, { s: `0${k + 1} / 05`, x: 150, y: 300, f: OSWALD, w: 400, z: 30, c: C.c50, ls: 6, align: 'left', t0: t0 + 0.25, t1 });
    txt(t, { s: ab.zh, x: 146, y: 440, f: SERIF, w: 900, z: 150, c: W_, glow: 50, ls: 16, align: 'left', t0: t0 + 0.35, t1, st: 0.12, sweep: t0 + 1.4 });
    txt(t, { s: ab.en, x: 152, y: 562, f: OSWALD, w: 300, z: 38, c: C.c40, ls: 22, align: 'left', t0: t0 + 0.7, t1, st: 0.03 });
    divider(t, 152, 604, 440, t0 + 0.9, t1);
    txt(t, { s: ab.sub, x: 150, y: 672, f: SANS, w: 500, z: 40, c: C.c10, ls: 2, align: 'left', t0: t0 + 1.1, t1, st: 0.03 });
    txt(t, { s: ab.m[0], x: 150, y: 738, f: SANS, w: 300, z: 28, c: C.c30, ls: 1, align: 'left', t0: t0 + 1.7, t1, st: 0.015 });
    txt(t, { s: ab.m[1], x: 150, y: 782, f: SANS, w: 300, z: 28, c: C.c30, ls: 1, align: 'left', t0: t0 + 1.9, t1, st: 0.015 });
    txt(t, { s: ab.cite, x: 150, y: 850, f: MONT, w: 400, z: 19, c: C.c50, ls: 1, align: 'left', t0: t0 + 2.4, t1, perChar: false });
  });
  // 切换场景里的网络标签
  if (t >= 64 && t < 72) {
    const a = fx.act;
    txt(t, { s: '专注 · 执行控制网络', x: ECN[0], y: ECN[1] + 215, f: SANS, w: 500, z: 22, c: C.c30, ls: 4, t0: 65, t1: 71.6, a: 0.35 + 0.65 * a });
    txt(t, { s: '放空 · 默认模式网络', x: DMN[0], y: DMN[1] + 215, f: SANS, w: 500, z: 22, c: C.c30, ls: 4, t0: 65.2, t1: 71.6, a: 0.35 + 0.65 * (1 - a) });
    txt(t, { s: '开关 · 突显网络', x: SN[0], y: SN[1] - 62, f: SANS, w: 500, z: 22, c: C.c40, ls: 4, t0: 65.4, t1: 71.6 });
  }
  txt(t, { s: 'δ 慢波 · 深睡眠', x: 1520, y: 860, f: SANS, w: 300, z: 24, c: C.c40, ls: 6, t0: 90, t1: 95.6 });

  // 收束
  if (t >= 96 && t < 104) {
    for (const o of fx.orbs) {
      const a = (0.45 + 0.55 * (o.depth + 1) / 2) * (1 - sstep(0.15, 0.55, o.conv));
      txt(t, { s: o.name, x: o.x, y: o.y - 78, f: SANS, w: 500, z: 26, c: C.c20, ls: 6, t0: 96.4, t1: 103.6, a, perChar: false });
    }
  }
  band(t, 880, 90, 96.5, 103.5, 0.55);
  txt(t, { s: '所以，最会用脑的人——', x: 960, y: 880, f: SERIF, w: 900, z: 72, c: W_, glow: 36, ls: 10, t0: 96.6, t1: 103.4, st: 0.09 });

  // 高潮
  const lines = [['知道何时聚焦，何时放空', 104.3], ['知道自己不知道', 108.3], ['敢于被改变，也懂得停下来', 112.3]];
  band(t, 880, 100, 104.2, 115.9, 0.6);
  for (const [s, t0] of lines) txt(t, { s, x: 960, y: 880, f: SERIF, w: 900, z: 70, c: W_, glow: 34, ls: 8, t0, t1: t0 + 3.5, st: 0.06, sweep: t0 + 1.4 });
  txt(t, { s: '不是用脑最多的人', x: 960, y: 470, f: SERIF, w: 900, z: 72, c: C.c40, glow: 16, ls: 8, t0: 116.2, t1: 119.8 });
  txt(t, { s: '而是把脑用得最「对」的人', x: 960, y: 610, f: SERIF, w: 900, z: 100, c: W_, glow: 50, ls: 6, t0: 116.7, t1: 119.8, sweep: 117.6 });

  // 结尾
  txt(t, { s: '最会用脑', x: 960, y: 470, f: SERIF, w: 900, z: 250, c: W_, glow: 60, ls: 40, t0: 121.0, t1: 130.2, a: 0.28, st: 0.1, fi: 1.2, fo: 1.5 });
  txt(t, { s: '成为你自己大脑的指挥家', x: 960, y: 720, f: SERIF, w: 900, z: 52, c: C.c20, glow: 20, ls: 14, t0: 121.8, t1: 130.4, fo: 1.2 });
  txt(t, { s: 'BE THE CONDUCTOR OF YOUR OWN MIND', x: 960, y: 798, f: OSWALD, w: 300, z: 26, c: C.c50, ls: 16, t0: 122.6, t1: 130.4, fo: 1.2, st: 0.02 });
}

function drawVignette() {
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = v; ctx.fillRect(-50, -50, W + 100, H + 100);
}
function drawPost(t, frame) {
  ctx.save();
  // 胶片颗粒：减少暗部色带
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.07;
  const gimg = GRAIN[frame % 3], ox = Math.floor(hash(frame, 5) * 512), oy = Math.floor(hash(frame, 6) * 512);
  for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(gimg, x, y);
  ctx.restore();
  const fade = Math.max(1 - sstep(0, 0.8, t), sstep(130.2, 131.9, t));
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}

/* ---------- 对外接口 ---------- */
let simFrame = -1;
function advanceTo(frame) {
  while (simFrame < frame) {
    simFrame++;
    const t = simFrame / FPS;
    const env = targets(t);
    step(t, env);
    lastEnv = env;
  }
}
let lastEnv = null;
window.initScene = async (timeline) => {
  TL = timeline;
  await Promise.all([
    document.fonts.load(`900 100px ${SERIF}`, '脑'),
    document.fonts.load(`300 40px ${SANS}`, '脑'),
    document.fonts.load(`500 40px ${SANS}`, '脑'),
    document.fonts.load(`300 40px ${OSWALD}`, 'A'),
    document.fonts.load(`400 40px ${OSWALD}`, 'A'),
    document.fonts.load(`400 20px ${MONT}`, 'A'),
  ]);
  initCanvases(); genBrain(); initParticles(); buildNet();
  return { frames: Math.round(TL.duration * FPS) };
};
window.renderFrame = (frame, encode = true) => {
  advanceTo(frame);
  if (!encode) return '';
  const t = frame / FPS, env = lastEnv;
  const bh = lastHit(t, TL.bigHits), dh = t - bh;
  const shake = dh >= 0 && dh < 0.8 ? 14 * Math.exp(-dh * 5) : 0;
  ctx.setTransform(1, 0, 0, 1, (hash(frame, 11) - 0.5) * shake, (hash(frame, 12) - 0.5) * shake);
  drawBackground(t, env);
  drawParticles(t, env);
  drawImpacts(t);
  drawVignette();
  drawOverlay(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawPost(t, frame);
  return cv.toDataURL('image/jpeg', 0.95).slice(23);
};
