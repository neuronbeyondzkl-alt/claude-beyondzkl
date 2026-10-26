// Core: math, noise, audio-event lookup, glow sprites, text, post-processing.
'use strict';

const W = 1920, H = 1080;
const PAL = {
  c10: '#F4F7FB', c20: '#E8EEF6', c30: '#CCDBEB', c40: '#9FBDDA', c50: '#6C9AC4',
  c60: '#497DAE', c70: '#376392', c80: '#2E5076', c90: '#2B4868', c100: '#263B54',
};
const RGB = {};
for (const k in PAL) {
  const h = PAL[k];
  RGB[k] = [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
}
const rgba = (k, a) => `rgba(${RGB[k][0]},${RGB[k][1]},${RGB[k][2]},${a})`;

// ------------------------------------------------------------------ math
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
const easeInCubic = (t) => Math.pow(clamp(t), 3);
const easeInOutCubic = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOutExpo = (t) => { t = clamp(t); return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); };
const easeOutBack = (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const fract = (x) => x - Math.floor(x);
const TAU = Math.PI * 2;
// window: 0 before a, ramps to 1 by a+fi, holds, ramps out to 0 at b
const win = (t, a, b, fi = 0.4, fo = 0.4) => Math.min(smooth((t - a) / fi), smooth((b - t) / fo));

function hash(i, s = 0) {
  let h = (i * 374761393 + s * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 2D simplex noise (Gustavson), seeded permutation
const Noise = (() => {
  const grad = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
  const r = mulberry32(1234);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;
  function n2(x, y) {
    const s = (x + y) * F2;
    const i = Math.floor(x + s), j = Math.floor(y + s);
    const t = (i + j) * G2;
    const x0 = x - (i - t), y0 = y - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { const g = grad[perm[ii + perm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { const g = grad[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { const g = grad[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
    return 70 * n;
  }
  function fbm(x, y, oct = 4) {
    let a = 0.5, f = 1, s = 0;
    for (let o = 0; o < oct; o++) { s += a * n2(x * f, y * f); f *= 2.03; a *= 0.5; }
    return s;
  }
  return { n2, fbm };
})();

// ------------------------------------------------------------------ audio events
const EVT = {};
function initEvents(EV) {
  for (const k in EV) {
    const v = EV[k];
    if (Array.isArray(v) && v.length && Array.isArray(v[0])) {
      EVT[k] = { t: Float64Array.from(v.map((e) => e[0])), v: v.map((e) => e.slice(1)) };
    }
  }
  EVT.env = EV.env;
}
function upper(arr, t) { // first index with arr[i] > t
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= t) lo = m + 1; else hi = m; }
  return lo;
}
// Decaying pulse summed over the most recent events of a track
function pulse(name, t, decay, lookback = 4) {
  const e = EVT[name];
  if (!e) return 0;
  const i = upper(e.t, t) - 1;
  let s = 0;
  for (let k = i; k >= 0 && k > i - lookback; k--) {
    const dt = t - e.t[k];
    if (dt > decay * 8) break;
    const vel = typeof e.v[k][0] === 'number' && name !== 'ost' && name !== 'bass' && name !== 'lead' && name !== 'pluck' ? e.v[k][0] : 1;
    s += vel * Math.exp(-dt / decay);
  }
  return s;
}
function lastEvent(name, t) {
  const e = EVT[name];
  const i = upper(e.t, t) - 1;
  return i >= 0 ? { i, t: e.t[i], v: e.v[i] } : null;
}
function countIn(name, a, b) {
  const e = EVT[name];
  return upper(e.t, b) - upper(e.t, a);
}
function envAt(name, t) {
  const e = EVT.env; const a = e[name];
  const x = t * e.rate; const i = Math.floor(x);
  if (i < 0) return a[0] || 0;
  if (i >= a.length - 1) return a[a.length - 1] || 0;
  return lerp(a[i], a[i + 1], x - i);
}

// ------------------------------------------------------------------ canvases
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

const SPR = {};
function initSprites() {
  const make = (key, size, core) => {
    const c = mk(size, size), g = c.getContext('2d');
    const r = size / 2;
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    const [R, G, B] = RGB[key];
    gr.addColorStop(0, `rgba(255,255,255,${core})`);
    gr.addColorStop(0.12, `rgba(${R},${G},${B},0.95)`);
    gr.addColorStop(0.35, `rgba(${R},${G},${B},0.32)`);
    gr.addColorStop(1, `rgba(${R},${G},${B},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, size, size);
    return c;
  };
  SPR.list = ['c40', 'c30', 'c50', 'c20', 'c60', 'c10'].map((k) => make(k, 64, 1));
  SPR.soft = ['c40', 'c50', 'c60', 'c70'].map((k) => {
    const c = mk(128, 128), g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, rgba(k, 0.55)); gr.addColorStop(0.5, rgba(k, 0.14)); gr.addColorStop(1, rgba(k, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
  });
  // anamorphic flare
  const f = mk(512, 64), fg = f.getContext('2d');
  const lg = fg.createLinearGradient(0, 0, 512, 0);
  lg.addColorStop(0, rgba('c40', 0)); lg.addColorStop(0.35, rgba('c40', 0.35)); lg.addColorStop(0.5, 'rgba(255,255,255,0.95)');
  lg.addColorStop(0.65, rgba('c40', 0.35)); lg.addColorStop(1, rgba('c40', 0));
  fg.fillStyle = lg; fg.fillRect(0, 0, 512, 64);
  fg.globalCompositeOperation = 'destination-in';
  const vg = fg.createLinearGradient(0, 0, 0, 64);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(0.5, 'rgba(0,0,0,1)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  fg.fillStyle = vg; fg.fillRect(0, 0, 512, 64);
  SPR.flare = f;
  // film grain tiles
  SPR.grain = [0, 1, 2].map((s) => {
    const c = mk(256, 256), g = c.getContext('2d');
    const id = g.createImageData(256, 256); const r = mulberry32(99 + s);
    for (let i = 0; i < id.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255;
    }
    g.putImageData(id, 0, 0); return c;
  });
}

// ------------------------------------------------------------------ text
const FONTS = {
  zh900: (px) => `900 ${px}px NotoSC, NotoSCL, sans-serif`,
  zh500: (px) => `500 ${px}px NotoSC, NotoSCL, sans-serif`,
  zh300: (px) => `300 ${px}px NotoSC, NotoSCL, sans-serif`,
  en300: (px) => `300 ${px}px Montserrat, NotoSCL, sans-serif`,
  en800: (px) => `800 ${px}px Montserrat, NotoSCL, sans-serif`,
  osw: (px) => `700 ${px}px Oswald, NotoSCL, sans-serif`,
};
const TXT = new Map();
// Rasterise a line once: crisp copy + blurred glow copy.
function textImg(str, font, spacing, fill, glowKey, glowPx = 14) {
  const key = [str, font, spacing, fill, glowKey, glowPx].join('|');
  if (TXT.has(key)) return TXT.get(key);
  const m = mk(4, 4).getContext('2d');
  m.font = font; m.letterSpacing = spacing + 'px';
  const mt = m.measureText(str);
  const pad = glowPx * 3 + 8;
  const asc = mt.fontBoundingBoxAscent || 0.9 * parseFloat(font.match(/(\d+)px/)[1]);
  const desc = mt.fontBoundingBoxDescent || 0.3 * parseFloat(font.match(/(\d+)px/)[1]);
  const w = Math.ceil(mt.width + pad * 2), h = Math.ceil(asc + desc + pad * 2);
  const c = mk(w, h), g = c.getContext('2d');
  g.font = font; g.letterSpacing = spacing + 'px'; g.textBaseline = 'alphabetic';
  g.fillStyle = fill; g.fillText(str, pad, pad + asc);
  const gl = mk(w, h), gg = gl.getContext('2d');
  gg.filter = `blur(${glowPx}px)`;
  gg.font = font; gg.letterSpacing = spacing + 'px';
  gg.fillStyle = PAL[glowKey]; gg.fillText(str, pad, pad + asc);
  gg.filter = `blur(${glowPx * 0.35}px)`; gg.fillText(str, pad, pad + asc);
  const o = { c, gl, w, h, pad, asc, tw: mt.width - spacing };
  TXT.set(key, o);
  return o;
}
// Draw a cached line centred at (cx, baseline y)
function drawText(ctx, img, cx, y, alpha, scale = 1, glow = 0.6, sweep = -1) {
  if (alpha <= 0.002) return;
  const x0 = cx - (img.pad + img.tw / 2) * scale;
  const y0 = y - (img.pad + img.asc) * scale;
  ctx.save();
  ctx.globalAlpha = alpha * glow;
  ctx.globalCompositeOperation = 'lighter';
  ctx.drawImage(img.gl, x0, y0, img.w * scale, img.h * scale);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  ctx.drawImage(img.c, x0, y0, img.w * scale, img.h * scale);
  if (sweep >= 0 && sweep <= 1) {
    const s = SWEEP.ctx;
    if (SWEEP.c.width < img.w || SWEEP.c.height < img.h) { SWEEP.c.width = Math.max(SWEEP.c.width, img.w); SWEEP.c.height = Math.max(SWEEP.c.height, img.h); }
    s.globalCompositeOperation = 'source-over';
    s.clearRect(0, 0, img.w, img.h);
    s.drawImage(img.c, 0, 0);
    s.globalCompositeOperation = 'source-in';
    const px = lerp(-0.2, 1.2, sweep) * img.w;
    const lg = s.createLinearGradient(px - 160, 0, px + 160, 0);
    lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(0.5, 'rgba(255,255,255,1)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    s.fillStyle = lg; s.fillRect(0, 0, img.w, img.h);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = alpha * 0.9;
    ctx.drawImage(SWEEP.c, 0, 0, img.w, img.h, x0, y0, img.w * scale, img.h * scale);
  }
  ctx.restore();
}
const SWEEP = { c: null, ctx: null };

// Per-character run, for letter-by-letter reveals and tracking animation
function glyphRun(str, font, fill, glowKey, glowPx) {
  const m = mk(4, 4).getContext('2d'); m.font = font;
  return Array.from(str).map((ch) => ({ ch, img: textImg(ch, font, 0, fill, glowKey, glowPx), adv: m.measureText(ch).width }));
}
function drawRun(ctx, run, cx, y, spacing, alphaFn, scaleFn, glow = 0.7) {
  let total = 0;
  for (const g of run) total += g.adv;
  total += spacing * (run.length - 1);
  let x = cx - total / 2;
  run.forEach((g, i) => {
    const a = alphaFn(i), s = scaleFn ? scaleFn(i) : 1;
    if (g.ch !== ' ' && a > 0.002) drawText(ctx, g.img, x + g.adv / 2, y, a, s, glow);
    x += g.adv + spacing;
  });
}

// Sample particle targets from a rasterised string
function textPoints(str, font, spacing, cx, cy, step) {
  const img = textImg(str, font, spacing, '#fff', 'c40', 1);
  const g = img.c.getContext('2d');
  const d = g.getImageData(0, 0, img.w, img.h).data;
  const pts = [];
  const x0 = cx - (img.pad + img.tw / 2), y0 = cy - (img.pad + img.asc);
  for (let y = 0; y < img.h; y += step) {
    for (let x = 0; x < img.w; x += step) {
      if (d[(y * img.w + x) * 4 + 3] > 140) pts.push([x0 + x, y0 + y]);
    }
  }
  return pts;
}

// ------------------------------------------------------------------ post
const POST = {};
function initPost() {
  POST.b1 = mk(480, 270); POST.g1 = POST.b1.getContext('2d');
  POST.b2 = mk(240, 135); POST.g2 = POST.b2.getContext('2d');
  POST.vig = mk(W, H);
  const g = POST.vig.getContext('2d');
  const r = g.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 1.05);
  r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(0.65, 'rgba(0,0,0,0.38)'); r.addColorStop(1, 'rgba(0,0,0,0.88)');
  g.fillStyle = r; g.fillRect(0, 0, W, H);
  SWEEP.c = mk(1600, 400); SWEEP.ctx = SWEEP.c.getContext('2d');
}
function bloom(ctx, src, k1, k2) {
  POST.g1.globalCompositeOperation = 'copy'; POST.g1.filter = 'blur(3px)';
  POST.g1.drawImage(src, 0, 0, 480, 270);
  POST.g2.globalCompositeOperation = 'copy'; POST.g2.filter = 'blur(6px)';
  POST.g2.drawImage(POST.b1, 0, 0, 240, 135);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.imageSmoothingQuality = 'high';
  ctx.globalAlpha = k1; ctx.drawImage(POST.b1, 0, 0, W, H);
  ctx.globalAlpha = k2; ctx.drawImage(POST.b2, 0, 0, W, H);
  ctx.restore();
}
function flare(ctx, x, y, k, width = 1700) {
  if (k <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = clamp(k);
  ctx.drawImage(SPR.flare, x - width / 2, y - 18 * (0.6 + k), width, 36 * (0.6 + k));
  ctx.globalAlpha = clamp(k * 0.8);
  const s = 260 * (0.5 + k);
  ctx.drawImage(SPR.soft[0], x - s / 2, y - s / 2, s, s);
  ctx.restore();
}
// Volumetric god rays fanning from (x, y)
function godRays(ctx, x, y, k, t, opts = {}) {
  if (k <= 0.003) return;
  const n = opts.n || 14, len = opts.len || 1500, spread = opts.spread || TAU, dir = opts.dir || 0;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const rot = t * (opts.speed || 0.04);
  for (let i = 0; i < n; i++) {
    const a = dir + (spread === TAU ? (i / n) * TAU : (i / (n - 1) - 0.5) * spread) + rot + 0.12 * Math.sin(t * 0.3 + i * 1.7);
    const w = (0.035 + 0.05 * hash(i, 7)) * (opts.width || 1);
    const flick = 0.55 + 0.45 * Math.sin(t * (0.6 + hash(i, 3)) + i * 2.1);
    const g = ctx.createRadialGradient(x, y, 0, x, y, len);
    g.addColorStop(0, rgba('c30', 0.22 * k * flick));
    g.addColorStop(0.35, rgba('c50', 0.09 * k * flick));
    g.addColorStop(1, rgba('c70', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.arc(x, y, len, a - w, a + w);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
function grain(ctx, frame, k) {
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = k;
  const g = SPR.grain[frame % 3];
  const ox = Math.floor(hash(frame, 1) * 256), oy = Math.floor(hash(frame, 2) * 256);
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(g, x, y);
  ctx.restore();
}
