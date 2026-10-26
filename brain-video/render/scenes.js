// Scenes, particle swarm choreography, text cues and the per-frame compositor.
'use strict';

let CV, CTX, FPS = 30, CUES = [];
const CAM = { zoom: 1, roll: 0, sx: 0, sy: 0 };

// ================================================================== swarm
const NP = 3400;
const SW = {};
function initSwarm() {
  for (const k of ['a', 'b', 'c', 'd']) { SW[k] = new Float32Array(NP); for (let i = 0; i < NP; i++) SW[k][i] = hash(i, k.charCodeAt(0)); }
  SW.col = new Uint8Array(NP);
  for (let i = 0; i < NP; i++) { const r = hash(i, 91); SW.col[i] = r < 0.3 ? 0 : r < 0.55 ? 1 : r < 0.75 ? 2 : r < 0.9 ? 3 : 4; }
  for (const k of ['X0', 'Y0', 'S0', 'A0', 'X1', 'Y1', 'S1', 'A1', 'X', 'Y', 'S', 'A']) SW[k] = new Float32Array(NP);
}

// Formation constructors: each returns { ev(t, X, Y, S, A) }
function fPoints(pts, o = {}) {
  const size = o.size || 2, alpha = o.alpha == null ? 0.9 : o.alpha, jit = o.jitter == null ? 1.5 : o.jitter;
  const n = pts.length;
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const k = Math.floor(SW.a[i] * n) % n, p = pts[k];
        const ph = SW.d[i] * TAU;
        X[i] = p[0] + Math.sin(t * (1.1 + SW.c[i]) + ph) * jit + (SW.b[i] - 0.5) * (o.spread || 0);
        Y[i] = p[1] + Math.cos(t * (0.9 + SW.b[i]) + ph) * jit + (SW.c[i] - 0.5) * (o.spread || 0);
        S[i] = size * (0.55 + 0.9 * SW.c[i]);
        A[i] = (o.alphaFn ? o.alphaFn(i, p, t) : alpha) * (0.55 + 0.45 * Math.sin(t * (2 + 4 * SW.c[i]) + ph));
      }
    },
  };
}
function fDust(o = {}) {
  const alpha = o.alpha == null ? 0.35 : o.alpha, size = o.size || 1.6;
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const a = SW.a[i], b = SW.b[i], c = SW.c[i], d = SW.d[i];
        X[i] = (a * 1.2 - 0.1) * W + 90 * Math.sin(t * 0.13 * (0.5 + c) + d * TAU) + 30 * Math.sin(t * 0.41 + a * 9);
        Y[i] = (b * 1.2 - 0.1) * H + 70 * Math.cos(t * 0.11 * (0.5 + d) + c * TAU) - 25 * Math.sin(t * 0.05 + a * 5);
        S[i] = size * (0.4 + 1.2 * c * c);
        A[i] = alpha * (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * (0.7 + 2 * d) + a * TAU)));
      }
    },
  };
}
function fExplodeFrom(src, t0, o = {}) {
  let cache = null;
  return {
    ev(t, X, Y, S, A) {
      if (!cache) { cache = { X: new Float32Array(NP), Y: new Float32Array(NP), S: new Float32Array(NP), A: new Float32Array(NP) }; src.ev(t0, cache.X, cache.Y, cache.S, cache.A); }
      const dt = Math.max(0, t - t0);
      const k = (1 - Math.exp(-dt * 4)) * 0.6 + dt * 0.04;
      for (let i = 0; i < NP; i++) {
        let dx = cache.X[i] - (o.cx || 960), dy = cache.Y[i] - (o.cy || 470);
        const l = Math.hypot(dx, dy) + 1e-3;
        const ang = Math.atan2(dy, dx) + (SW.d[i] - 0.5) * 0.9;
        const sp = (o.speed || 1) * (250 + 1500 * SW.b[i] * SW.b[i]) * (o.radial ? 1 : 0.5 + l / 600);
        X[i] = cache.X[i] + Math.cos(ang) * sp * k;
        Y[i] = cache.Y[i] + Math.sin(ang) * sp * k + 60 * dt * dt * (SW.c[i] - 0.3);
        S[i] = (1.0 + 2.0 * SW.c[i]) * (1 + 0.6 * Math.exp(-dt * 4));
        A[i] = (0.22 + 0.4 * Math.exp(-dt * 1.2)) * (0.4 + 0.6 * SW.a[i]);
      }
    },
  };
}
function fCenter(cx, cy, o = {}) {
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const ang = SW.a[i] * TAU + t * 3, r = (o.r || 6) * SW.b[i];
        X[i] = cx + Math.cos(ang) * r; Y[i] = cy + Math.sin(ang) * r; S[i] = 1.2 + SW.c[i]; A[i] = 0.6;
      }
    },
  };
}
function fExplodeCenter(cx, cy, t0) { return fExplodeFrom(fCenter(cx, cy, { r: 90 }), t0, { cx, cy, radial: true, speed: 2.2 }); }
function fFall() {
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const sp = 0.25 + 0.45 * SW.c[i];
        X[i] = SW.a[i] * W + 50 * Math.sin(t * 2.1 + SW.d[i] * TAU);
        Y[i] = fract(SW.b[i] + t * sp) * (H + 200) - 100;
        S[i] = 1 + 1.8 * SW.c[i]; A[i] = 0.45 * (0.5 + 0.5 * SW.d[i]);
      }
    },
  };
}
function fStream(pts, L, o = {}) {
  const width = o.width || 20, speed = o.speed || 0.5;
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const s = fract(SW.b[i] + t * speed * (0.6 + 0.8 * SW.c[i]));
        const p = polyAt(pts, L, s), q = polyAt(pts, L, Math.min(1, s + 0.01));
        let nx = -(q[1] - p[1]), ny = q[0] - p[0]; const l = Math.hypot(nx, ny) + 1e-6; nx /= l; ny /= l;
        const off = (SW.d[i] - 0.5) * width * (o.taper ? (0.3 + s) : 1);
        X[i] = p[0] + nx * off; Y[i] = p[1] + ny * off;
        S[i] = (o.size || 1.8) * (0.5 + SW.a[i]);
        A[i] = (o.alpha || 0.85) * (o.fadeEnds ? Math.min(1, s * 8, (1 - s) * 8) : 1);
      }
    },
  };
}
function fVortex(cx, cy, R, t0) {
  return {
    ev(t, X, Y, S, A) {
      const lt = Math.max(0, t - t0);
      for (let i = 0; i < NP; i++) {
        const shrink = 1 - 0.7 * smooth(lt / 3.4);
        const r = R * (0.12 + 0.88 * SW.b[i]) * shrink;
        const ang = SW.a[i] * TAU + lt * lt * (0.25 + 0.5 * SW.c[i]) * (1.4 - SW.b[i]) + lt * 0.8;
        X[i] = cx + Math.cos(ang) * r; Y[i] = cy + Math.sin(ang) * r * 0.62;
        S[i] = 1.1 + 1.7 * SW.c[i]; A[i] = 0.32 + 0.4 * smooth(lt / 3);
      }
    },
  };
}
function fRing(cx, cy, R) {
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const ang = SW.a[i] * TAU + t * (2.6 + 1.2 * SW.c[i]), r = R + (SW.b[i] - 0.5) * 26;
        X[i] = cx + Math.cos(ang) * r; Y[i] = cy + Math.sin(ang) * r; S[i] = 1.3 + 1.6 * SW.d[i]; A[i] = 0.8;
      }
    },
  };
}
function fGhost() {
  return {
    ev(t, X, Y, S, A) {
      for (let i = 0; i < NP; i++) {
        const a = SW.a[i], b = SW.b[i];
        X[i] = 260 + a * 1400 + 120 * Noise.n2(a * 7, t * 0.35 + b * 5);
        Y[i] = 120 + b * 560 + 90 * Noise.n2(b * 7 + 30, t * 0.35 + a * 5);
        S[i] = 1.6 + 2.6 * SW.c[i]; A[i] = 0.05 + 0.09 * (0.5 + 0.5 * Math.sin(t * 2 + SW.d[i] * TAU));
      }
    },
  };
}
function netProject(p, t) {
  const ang = 0.28 * (t - 100) + 0.5, tilt = 0.32;
  const x = p[0] * Math.cos(ang) - p[2] * Math.sin(ang), z0 = p[0] * Math.sin(ang) + p[2] * Math.cos(ang);
  const y = p[1] * Math.cos(tilt) - z0 * Math.sin(tilt), z = p[1] * Math.sin(tilt) + z0 * Math.cos(tilt);
  const s = 1300 / (z + 3.5);
  return [960 + x * s, 420 + y * s, z];
}
function fNetwork() {
  return {
    ev(t, X, Y, S, A) {
      const E = GEO.edges;
      for (let i = 0; i < NP; i++) {
        const e = E[Math.floor(SW.a[i] * E.length) % E.length];
        const p = GEO.nodes[e[0]], q = GEO.nodes[e[1]], s = SW.b[i];
        const P = netProject([lerp(p[0], q[0], s), lerp(p[1], q[1], s), lerp(p[2], q[2], s)], t);
        X[i] = P[0]; Y[i] = P[1];
        const depth = clamp((1.4 - P[2]) / 2.8);
        S[i] = (0.7 + 1.2 * SW.c[i]) * (0.6 + depth); A[i] = 0.12 + 0.42 * depth;
      }
    },
  };
}
function fTracks(t0) {
  return {
    ev(t, X, Y, S, A) {
      const share = 0.35 + 0.6 * smooth((t - t0) / 6);
      for (let i = 0; i < NP; i++) {
        const k = SW.c[i] < share ? 2 : Math.floor(SW.d[i] * 6);
        const tr = GEO.tracks[k];
        const s = fract(SW.b[i] + t * 0.11 * (0.6 + SW.a[i]));
        const p = polyAt(tr.pts, tr.L, s);
        X[i] = p[0] + (SW.a[i] - 0.5) * (k === 2 ? 10 : 6); Y[i] = p[1];
        S[i] = 1 + 1.5 * SW.a[i]; A[i] = (k === 2 ? 0.85 : 0.4) * Math.min(1, s * 10);
      }
    },
  };
}

let KF = [];
function initChoreo() {
  const titlePts = textPoints('重塑大脑', FONTS.zh900(200), 36, 960, 470, 4);
  const titlePts2 = textPoints('重塑大脑', FONTS.zh900(200), 36, 960, 460, 4);
  const pct = textPoints('97%', FONTS.osw(420), 12, 960, 600, 5);
  const machine = fPoints(GEO.cellPts, { size: 1.1, alpha: 0.22, jitter: 0.2 });
  const tongue = polyline((s) => bezier([960, 820], [1080, 660], [840, 500], [960, 410], s), 60);
  const tongueL = polyLen(tongue);
  const handPts = GEO.handL.concat(GEO.handR);
  const nL = GEO.handL.length;
  const hands = fPoints(handPts, {
    size: 1.7, jitter: 1,
    alphaFn: (i, p, t) => (p[0] < 960 ? 0.9 : (0.18 + 0.7 * smooth((t - 69.6) / 1.2)) * (0.6 + 0.4 * Math.sin(t * 23 + SW.d[i] * 9))),
  });
  KF = [
    { t: 0, f: machine },
    { t: 8.0, f: fExplodeFrom(machine, 8.0, { cx: 960, cy: 430 }) },
    { t: 10.0, f: fPoints(titlePts, { size: 1.5, alpha: 0.38, jitter: 1.2 }), dur: 1.3, stg: 0.5, swirl: 140 },
    { t: 14.4, f: fPoints(GEO.brainPts, { size: 1.7, alpha: 0.7, jitter: 1.2 }), dur: 1.4, stg: 0.4, swirl: 90 },
    { t: 24.0, f: fDust({ alpha: 0.28 }), dur: 1.4, stg: 0.4 },
    { t: 32.0, f: fFall(), dur: 0.8, stg: 0.3 },
    { t: 36.0, f: fStream(tongue, tongueL, { width: 26, speed: 0.55, alpha: 0.8, fadeEnds: true }), dur: 0.7, stg: 0.3 },
    { t: 39.4, f: fDust({ alpha: 0.22 }), dur: 1.0, stg: 0.4 },
    { t: 53.85, f: fPoints(pct, { size: 2.0, alpha: 0.9, jitter: 0.8 }), dur: 0.3, stg: 0.12, swirl: 60 },
    { t: 55.7, f: fDust({ alpha: 0.25 }), dur: 0.9, stg: 0.3 },
    { t: 64.0, f: fVortex(960, 470, 1000, 64.0), dur: 1.2, stg: 0.4 },
    { t: 67.25, f: fCenter(960, 540, { r: 12 }), dur: 0.22, stg: 0.05 },
    { t: 68.0, f: fExplodeCenter(960, 540, 68.0) },
    { t: 68.5, f: hands, dur: 0.8, stg: 0.4, swirl: 120 },
    { t: 72.0, f: fRing(GEO.ring.cx, GEO.ring.cy, GEO.ring.r), dur: 0.5, stg: 0.25, swirl: 80 },
    { t: 74.0, f: fStream(GEO.escape, GEO.escapeL, { width: 14, speed: 0.35, alpha: 0.85 }), dur: 0.5, stg: 0.2 },
    { t: 76.0, f: fPoints(GEO.topRightPts, { size: 1.6, alpha: 0.8 }), dur: 0.5, stg: 0.25, swirl: 80 },
    { t: 78.0, f: fPoints(GEO.topAllPts, { size: 1.6, alpha: 0.8 }), dur: 0.9, stg: 0.4, swirl: 60 },
    { t: 80.0, f: fPoints(GEO.cellPts, { size: 1.3, alpha: 0.45, jitter: 0.4 }), dur: 0.5, stg: 0.25 },
    { t: 84.0, f: fPoints(GEO.treePts, { size: 1.2, alpha: 0.32 }), dur: 0.6, stg: 0.3 },
    { t: 88.0, f: fGhost(), dur: 0.5, stg: 0.2 },
    { t: 90.0, f: fPoints(GEO.starPts, { size: 1.3, alpha: 0.4, jitter: 2 }), dur: 0.9, stg: 0.4, swirl: 100 },
    { t: 92.0, f: fTracks(92.0), dur: 1.0, stg: 0.5 },
    { t: 99.6, f: fCenter(960, 460, { r: 20 }), dur: 0.4, stg: 0.1 },
    { t: 100.0, f: fNetwork(), dur: 0.7, stg: 0.3, swirl: 200 },
    { t: 108.0, f: fPoints(GEO.brainBigPts, { size: 1.7, alpha: 0.75, jitter: 1.4 }), dur: 1.0, stg: 0.4, swirl: 120 },
    { t: 115.3, f: fCenter(960, 470, { r: 10 }), dur: 0.2, stg: 0.05 },
    { t: 116.0, f: fExplodeCenter(960, 470, 116.0) },
    { t: 117.0, f: fPoints(titlePts2, { size: 1.5, alpha: 0.32, jitter: 1.0 }), dur: 1.4, stg: 0.6, swirl: 160 },
    { t: 121.5, f: fDust({ alpha: 0.2 }), dur: 1.5, stg: 0.5 },
  ];
}

function drawSwarm(ctx, t, gain) {
  let k = 0;
  while (k + 1 < KF.length && KF[k + 1].t <= t) k++;
  const cur = KF[k], prev = KF[k - 1];
  const dur = cur.dur || 0, stg = cur.stg || 0;
  cur.f.ev(t, SW.X1, SW.Y1, SW.S1, SW.A1);
  const inTrans = prev && dur > 0 && t < cur.t + dur + stg;
  if (inTrans) prev.f.ev(t, SW.X0, SW.Y0, SW.S0, SW.A0);
  const kick = pulse('kick', t, 0.09);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < NP; i++) {
    let x = SW.X1[i], y = SW.Y1[i], s = SW.S1[i], a = SW.A1[i];
    if (inTrans) {
      const p = easeInOutCubic((t - cur.t - stg * SW.d[i]) / dur);
      const sw = Math.sin(Math.PI * p) * (cur.swirl || 40) * (SW.a[i] - 0.5) * 2;
      const dx = x - SW.X0[i], dy = y - SW.Y0[i], l = Math.hypot(dx, dy) + 1e-6;
      x = lerp(SW.X0[i], x, p) - dy / l * sw;
      y = lerp(SW.Y0[i], y, p) + dx / l * sw;
      s = lerp(SW.S0[i], s, p) * (1 + 0.8 * Math.sin(Math.PI * p));
      a = lerp(SW.A0[i], a, p);
    }
    a *= gain * (1 + 0.6 * kick);
    if (a <= 0.01 || x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
    const r = s * 3.2 * (1 + 0.25 * kick);
    ctx.globalAlpha = clamp(a);
    ctx.drawImage(SPR.list[SW.col[i]], x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}

// ================================================================== scene helpers
function strokeSegs(ctx, segs, filter, color, width) {
  ctx.beginPath();
  for (let i = 0; i < segs.length; i++) {
    const o = segs[i];
    if (filter && !filter(o, i)) continue;
    ctx.moveTo(o.s[0], o.s[1]); ctx.lineTo(o.s[2], o.s[3]);
  }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke();
}
function glowSprite(ctx, x, y, r, a, idx = 0) {
  if (a <= 0.003) return;
  ctx.globalAlpha = clamp(a);
  ctx.drawImage(SPR.soft[idx], x - r, y - r, r * 2, r * 2);
}
function dot(ctx, x, y, r, a, idx = 0) {
  if (a <= 0.003) return;
  ctx.globalAlpha = clamp(a);
  ctx.drawImage(SPR.list[idx], x - r, y - r, r * 2, r * 2);
}

// Generic gyri renderer used for the side-view brain
function drawGyri(ctx, B, t, o) {
  const prog = o.reveal;            // radius (0..1.6) revealed so far
  const k = o.k;                    // overall intensity
  if (k <= 0.003) return;
  const kick = pulse('kick', t, 0.12), sn = lastEvent('snare', t);
  const wave = o.wave ? (t - (lastEvent('kick', t) || { t: -9 }).t) * 1.8 : -9;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const vis = (s) => s.rv < prog;
  // glow pass
  ctx.globalAlpha = 0.22 * k * (1 + kick * 0.6);
  strokeSegs(ctx, B.segs, (s) => vis(s) && s.kind !== 2, PAL.c60, 6);
  ctx.globalAlpha = 0.85 * k;
  strokeSegs(ctx, B.segs, (s) => vis(s) && s.kind === 0, PAL.c30, 2.4);
  ctx.globalAlpha = 0.6 * k * (1 + 0.4 * kick);
  strokeSegs(ctx, B.segs, (s) => vis(s) && s.kind === 1, PAL.c50, 1.6);
  ctx.globalAlpha = 0.5 * k;
  strokeSegs(ctx, B.segs, (s) => vis(s) && s.kind === 2, PAL.c60, 1.2);
  // reveal front: bright leading edge
  ctx.globalAlpha = 0.9 * k;
  strokeSegs(ctx, B.segs, (s) => s.rv < prog && s.rv > prog - 0.06, PAL.c20, 2.2);
  // snare flashes: random gyri light up
  if (sn && t - sn.t < 0.5) {
    ctx.globalAlpha = k * Math.exp(-(t - sn.t) / 0.14);
    strokeSegs(ctx, B.segs, (s, i) => vis(s) && hash(i, sn.i) < 0.12, PAL.c10, 2.4);
  }
  if (o.wave && wave < 2) {
    ctx.globalAlpha = k * 0.9 * (1 - wave / 2);
    strokeSegs(ctx, B.segs, (s) => vis(s) && Math.abs(s.r - wave) < 0.06, PAL.c20, 2.6);
  }
  ctx.restore();
}

function blobPath(ctx, cx, cy, R, t, seed) {
  ctx.beginPath();
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * TAU;
    const r = R * (1 + 0.12 * Noise.n2(Math.cos(a) * 1.5 + seed, Math.sin(a) * 1.5 + t * 0.4));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// ================================================================== scenes
function sceneBackground(ctx, t) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const e = envAt('all', t);
  const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, H * 0.95);
  g.addColorStop(0, rgba('c100', 0.55 + 0.25 * e)); g.addColorStop(0.55, rgba('c100', 0.18)); g.addColorStop(1, rgba('c100', 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // slow light leak drifting across
  const lx = W * (0.5 + 0.45 * Math.sin(t * 0.07)), ly = H * (0.3 + 0.2 * Math.cos(t * 0.05));
  const g2 = ctx.createRadialGradient(lx, ly, 0, lx, ly, 700);
  g2.addColorStop(0, rgba('c80', 0.22)); g2.addColorStop(1, rgba('c80', 0));
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
}

function sceneMachine(ctx, t) {
  const a = smooth(t / 1.2) * (t < 8 ? 1 : 0);
  if (a <= 0) return;
  godRays(ctx, 960, -260, 0.75 * a, t, { n: 9, spread: 0.55, dir: Math.PI / 2, len: 1400, speed: 0.01, width: 1.4 });
  const B = GEO.brain;
  const tick = lastEvent('tick', t);
  const jitter = smooth((t - 6.8) / 1.2);
  ctx.save();
  ctx.lineWidth = 1;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < GEO.cells.length; i++) {
    const c = GEO.cells[i];
    const vis = smooth((t * 0.42 - c.order) / 0.08);
    if (vis <= 0) continue;
    const fl = 1 + jitter * 1.5 * Math.max(0, Math.sin(t * 37 + i * 1.7));
    ctx.strokeStyle = rgba('c60', 0.32 * a * vis * fl);
    ctx.strokeRect(c.x + 2, c.y + 2, c.s - 4, c.s - 4);
  }
  GEO.modules.forEach((m, k) => {
    const x = B.cx + (m.u - m.w / 2) * B.S, y = B.cy + (m.v - m.h / 2) * B.S, w = m.w * B.S, h = m.h * B.S;
    const vis = smooth((t - 1.2 - k * 0.35) / 0.4) * a;
    if (vis <= 0) return;
    let hl = 0;
    if (tick && tick.i % GEO.modules.length === k) hl = Math.exp(-(t - tick.t) / 0.35);
    ctx.fillStyle = rgba('c70', (0.12 + 0.35 * hl) * vis);
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = rgba('c40', (0.55 + 0.45 * hl) * vis); ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, w, h);
    drawText(ctx, textImg(m.zh, FONTS.zh500(20), 2, PAL.c20, 'c50', 6), x + w / 2, y + h / 2 + 2, vis * (0.75 + 0.25 * hl), 1, 0.4);
    drawText(ctx, textImg(m.en, FONTS.en800(11), 3, PAL.c40, 'c50', 4), x + w / 2, y + h / 2 + 20, vis * 0.8, 1, 0.3);
  });
  ctx.restore();
}

function sceneTitle(ctx, t) {
  const k = win(t, 9.8, 15.6, 0.8, 1.0);
  godRays(ctx, 960, 430, 0.8 * k, t, { n: 16, len: 1300, speed: 0.05 });
  flare(ctx, 960, 430, 0.9 * Math.exp(-Math.max(0, t - 10.5) / 0.5) * (t > 10.5 ? 1 : 0));
}

function sceneBrain(ctx, t) {
  const k = win(t, 14.6, 24.6, 0.6, 0.7);
  if (k <= 0) return;
  godRays(ctx, 960, 440, 0.35 * k * (0.7 + envAt('low', t)), t, { n: 12, len: 1100 });
  drawGyri(ctx, GEO.brain, t, { reveal: (t - 15.2) * 0.75, k });
}

function sceneHebb(ctx, t) {
  const k = win(t, 24.0, 32.0, 0.6, 0.5);
  if (k <= 0) return;
  const n = countIn('snare', 23.99, t), sn = lastEvent('snare', t);
  const tf = sn && sn.t >= 24 ? sn.t : -9, dt = t - tf;
  const fire = Math.exp(-dt / 0.16);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  const grow = (t - 24.0) * 520;
  for (const [segs] of [[GEO.dendA], [GEO.dendB]]) {
    ctx.globalAlpha = k * (0.55 + 0.45 * fire);
    for (let d = 0; d <= 4; d++) strokeSegs(ctx, segs, (s) => s.depth === d && s.d0 < grow, d < 2 ? PAL.c40 : PAL.c50, 3.2 - d * 0.55);
    ctx.globalAlpha = k * 0.25;
    strokeSegs(ctx, segs, (s) => s.d0 < grow, PAL.c60, 7);
  }
  const strength = clamp(n / 8);
  GEO.strands.forEach((st, i) => {
    const born = i === 0 ? 24.3 : (EVT.snare.t[upper(EVT.snare.t, 23.99) + i - 1] || 999);
    if (t < born) return;
    const g = easeOutCubic((t - born) / 0.35);
    ctx.globalAlpha = k * (0.18 + 0.55 * strength) * (0.7 + 0.3 * fire);
    ctx.strokeStyle = i === 4 ? PAL.c30 : PAL.c50;
    ctx.lineWidth = 1 + 2.2 * strength * (i === 4 ? 1.4 : 0.7);
    strokePoly(ctx, st.pts, g);
    ctx.globalAlpha = k * 0.2 * strength; ctx.lineWidth = 10; ctx.strokeStyle = PAL.c60;
    strokePoly(ctx, st.pts, g);
  });
  // pulses travelling from both sides
  if (dt >= 0 && dt < 0.45) {
    const p = clamp(dt / 0.28);
    GEO.strands.forEach((st, i) => {
      if (i > n) return;
      const P1 = polyAt(st.pts, st.L, p * 0.5), P2 = polyAt(st.pts, st.L, 1 - p * 0.5);
      dot(ctx, P1[0], P1[1], 10, k * (1 - p * 0.3), 5); dot(ctx, P2[0], P2[1], 10, k * (1 - p * 0.3), 5);
    });
    if (p >= 1) { const mid = polyAt(GEO.strands[4].pts, GEO.strands[4].L, 0.5); glowSprite(ctx, mid[0], mid[1], 120 * (1 + (dt - 0.28) * 4), k * Math.exp(-(dt - 0.28) / 0.1), 0); }
  }
  for (const [x, y] of [GEO.nA, GEO.nB]) {
    glowSprite(ctx, x, y, 90 + 140 * fire, k * (0.45 + 0.55 * fire), 0);
    dot(ctx, x, y, 22 + 10 * fire, k, 5);
  }
  ctx.restore();
}

function sceneFalling(ctx, t) {
  const k = win(t, 32.0, 40.0, 0.3, 0.5);
  if (k <= 0) return;
  const st = smooth((t - 36.2) / 1.3);
  const th = (0.24 * Math.sin(t * 1.9) + 0.13 * Math.sin(t * 3.3 + 1)) * (1 - st);
  const bob = 50 * Math.sin(t * 2.4) * (1 - st);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(960, 500 + bob); ctx.rotate(th);
  const lg = ctx.createLinearGradient(-1400, 0, 1400, 0);
  lg.addColorStop(0, rgba('c40', 0)); lg.addColorStop(0.5, rgba('c20', 0.95)); lg.addColorStop(1, rgba('c40', 0));
  ctx.strokeStyle = lg; ctx.globalAlpha = k; ctx.lineWidth = 2.5 + 3 * st;
  ctx.beginPath(); ctx.moveTo(-1400, 0); ctx.lineTo(1400, 0); ctx.stroke();
  ctx.lineWidth = 1;
  for (let i = -14; i <= 14; i++) {
    ctx.strokeStyle = rgba('c60', 0.28 * k);
    ctx.beginPath(); ctx.moveTo(0 + i * 4, 0); ctx.lineTo(i * 190, 900); ctx.stroke();
  }
  const scroll = fract(t * (1.6 - 1.2 * st));
  for (let j = 0; j < 8; j++) {
    const yy = 14 * Math.pow(1.55, j + scroll);
    ctx.strokeStyle = rgba('c60', 0.3 * k * clamp(yy / 60));
    ctx.beginPath(); ctx.moveTo(-1400, yy); ctx.lineTo(1400, yy); ctx.stroke();
  }
  ctx.restore();
  // signal from tongue sensor up to the brain
  if (t > 35.9) {
    const s = win(t, 36.0, 40.0, 0.5, 0.5);
    const path = polyline((u) => bezier([960, 820], [1080, 660], [840, 500], [960, 410], u), 60);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    ctx.globalAlpha = 0.7 * s; ctx.strokeStyle = PAL.c40; ctx.lineWidth = 2;
    strokePoly(ctx, path, easeOutCubic((t - 36.0) / 0.6));
    ctx.globalAlpha = 0.2 * s; ctx.lineWidth = 12; strokePoly(ctx, path, easeOutCubic((t - 36.0) / 0.6));
    glowSprite(ctx, 960, 822, 70 + 40 * pulse('kick', t, 0.1), s, 0);
    ctx.restore();
    drawGyri(ctx, GEO.brainSmall, t, { reveal: (t - 36.3) * 2.5, k: s });
    const lock = t - 37.5;
    if (lock > 0 && lock < 1.2) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba('c30', 0.8 * (1 - lock / 1.2) * k); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(960, 500, 120 + lock * 700, 20 + lock * 90, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
}

const MAP = { w: 600, h: 250, x: 360, y: 205 };
function sceneMaps(ctx, t) {
  const k = win(t, 40.0, 48.0, 0.4, 0.4);
  if (k <= 0) return;
  if (!MAP.c) {
    MAP.c = mk(MAP.w, MAP.h); MAP.g = MAP.c.getContext('2d'); MAP.id = MAP.g.createImageData(MAP.w, MAP.h);
    MAP.lab = new Uint8Array(MAP.w * MAP.h);
    const r = mulberry32(5);
    MAP.sites = [];
    for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) MAP.sites.push([70 + i * 155 + (r() - 0.5) * 60, 42 + j * 82 + (r() - 0.5) * 34, r()]);
    MAP.grow = 5;
    MAP.cols = ['c80', 'c90', 'c70', 'c100', 'c60', 'c80', 'c90', 'c70', 'c100', 'c80', 'c60', 'c90'].map((c) => RGB[c]);
  }
  const kc = countIn('kick', 40.0, t), lk = lastEvent('kick', t);
  const g = Math.max(0, kc - 1 + easeOutCubic((t - (lk ? lk.t : 0)) / 0.25));
  const grow = 1500 * Math.min(g, 24) * (1 - 0.018 * Math.min(g, 24));
  const S = MAP.sites.map((s, i) => [s[0] + 8 * Math.sin(t * 0.7 + i), s[1] + 6 * Math.cos(t * 0.6 + i * 2), i === MAP.grow ? 900 + grow : 900 - 20 * Math.min(g, 24) * (i % 3)]);
  const lab = MAP.lab, d = MAP.id.data;
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    let best = 1e12, bi = 0;
    for (let i = 0; i < S.length; i++) { const dx = x - S[i][0], dy = y - S[i][1]; const v = dx * dx + dy * dy - S[i][2]; if (v < best) { best = v; bi = i; } }
    lab[y * MAP.w + x] = bi;
  }
  const kp = pulse('kick', t, 0.12);
  for (let y = 0; y < MAP.h; y++) for (let x = 0; x < MAP.w; x++) {
    const p = y * MAP.w + x, l = lab[p];
    const edge = (x < MAP.w - 1 && lab[p + 1] !== l) || (y < MAP.h - 1 && lab[p + MAP.w] !== l) || x === 0 || y === 0 || x === MAP.w - 1 || y === MAP.h - 1;
    const o = p * 4;
    if (edge) { d[o] = 159; d[o + 1] = 189; d[o + 2] = 218; d[o + 3] = 235; }
    else if (l === MAP.grow) { const c = RGB.c60; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 55 + 45 * kp; }
    else { const c = MAP.cols[l]; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 70; }
  }
  MAP.g.putImageData(MAP.id, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = k;
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(MAP.c, MAP.x, MAP.y, MAP.w * 2, MAP.h * 2);
  S.forEach((s, i) => dot(ctx, MAP.x + s[0] * 2, MAP.y + s[1] * 2, i === MAP.grow ? 9 + 6 * kp : 5, k * 0.9, i === MAP.grow ? 5 : 0));
  const gs = S[MAP.grow];
  drawText(ctx, textImg('练习的手指', FONTS.zh500(22), 4, PAL.c10, 'c50', 8), MAP.x + gs[0] * 2, MAP.y + gs[1] * 2 - 22, k, 1, 0.6);
  drawText(ctx, textImg('PRACTICED FINGER', FONTS.en800(11), 4, PAL.c30, 'c50', 4), MAP.x + gs[0] * 2, MAP.y + gs[1] * 2 + 34, k * 0.9, 1, 0.3);
  ctx.restore();
}

function sceneStroke(ctx, t) {
  const k = win(t, 48.0, 56.0, 0.4, 0.4);
  if (k <= 0) return;
  const dead = smooth((t - 48.35) / 0.7);
  const reveal = t > 53.95 ? 0.45 + 0.55 * smooth((t - 55.0) / 0.8) : 1;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  // cortex arc + spinal cord
  ctx.strokeStyle = PAL.c40; ctx.globalAlpha = 0.8 * k * reveal; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(960, 470, 520, 290, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  ctx.globalAlpha = 0.18 * k; ctx.lineWidth = 16; ctx.stroke();
  ctx.globalAlpha = 0.8 * k * reveal; ctx.lineWidth = 3; ctx.strokeStyle = PAL.c40;
  ctx.beginPath(); ctx.moveTo(938, 775); ctx.lineTo(938, 830); ctx.moveTo(982, 775); ctx.lineTo(982, 830); ctx.stroke();
  const sproutDone = GEO.sprouts.map((sp, n) => (t - (50 + n * 0.5)) / 0.4);
  GEO.fibres.forEach((f, idx) => {
    if (f.alive) return;
    // healthy before the stroke, then broken + dim
    ctx.lineWidth = 1.7;
    ctx.strokeStyle = PAL.c50;
    ctx.globalAlpha = k * lerp(0.85, 0.34, dead) * reveal;
    const pts = f.pts, n = pts.length - 1;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const s = i / n;
      if (dead > 0.05 && f.gaps.some((gp) => s > gp[0] && s < gp[1])) continue;
      ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    }
    ctx.stroke();
    // re-lit lower part once a sprout reaches it
    const si = GEO.sprouts.findIndex((sp) => sp.fibre === idx);
    if (si >= 0 && sproutDone[si] > 1) {
      const sp = GEO.sprouts[si];
      const lit = clamp((sproutDone[si] - 1) * 0.6);
      const i0 = Math.floor(sp.from * n), i1 = Math.floor(lerp(sp.from, 1, lit) * n);
      ctx.strokeStyle = PAL.c30; ctx.lineWidth = 2.8; ctx.globalAlpha = k * reveal;
      ctx.beginPath(); ctx.moveTo(pts[i0][0], pts[i0][1]);
      for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
      ctx.globalAlpha = k * reveal * 0.25; ctx.lineWidth = 12; ctx.strokeStyle = PAL.c50; ctx.stroke();
    }
  });
  const live = GEO.fibres[21];
  ctx.strokeStyle = PAL.c20; ctx.lineWidth = 2.6; ctx.globalAlpha = k * reveal;
  strokePoly(ctx, live.pts, 1);
  ctx.globalAlpha = 0.25 * k; ctx.lineWidth = 12; ctx.strokeStyle = PAL.c50; strokePoly(ctx, live.pts, 1);
  GEO.sprouts.forEach((sp, n) => {
    const g = sproutDone[n];
    if (g <= 0) return;
    ctx.strokeStyle = PAL.c20; ctx.lineWidth = 3; ctx.globalAlpha = k * reveal;
    strokePoly(ctx, sp.pts, easeOutCubic(g));
    ctx.globalAlpha = k * reveal * 0.3; ctx.lineWidth = 14; ctx.strokeStyle = PAL.c50;
    strokePoly(ctx, sp.pts, easeOutCubic(g));
    if (g < 1.4) { const p = polyAt(sp.pts, sp.L, clamp(g)); dot(ctx, p[0], p[1], 16, k, 5); }
  });
  // pulses down the living path on each kick
  for (let j = 0; j < 3; j++) {
    const e = EVT.kick, i = upper(e.t, t) - 1 - j;
    if (i < 0 || e.t[i] < 48) continue;
    const s = (t - e.t[i]) / 0.7;
    if (s > 1) continue;
    const p = polyAt(live.pts, live.L, s);
    dot(ctx, p[0], p[1], 14, k * (1 - s * 0.5), 5);
  }
  ctx.restore();
}

function scenePiano(ctx, t) {
  const k = win(t, 56.0, 64.0, 0.4, 0.4);
  if (k <= 0) return;
  const panels = [{ cx: 620, a: k, ghost: false, zh: '真实弹奏', en: 'PLAYED' }, { cx: 1300, a: win(t, 58.0, 64.0, 0.4, 0.4), ghost: true, zh: '仅凭想象', en: 'IMAGINED' }];
  const kw = 56, gap = 10, top = 560, kh = 180;
  const e = EVT.ost, i1 = upper(e.t, t);
  const keyLight = new Float32Array(8);
  for (let i = i1 - 1; i >= 0 && t - e.t[i] < 0.6; i--) {
    const idx = clamp(Math.round((e.v[i][0] - 46) / 26 * 7), 0, 7);
    keyLight[idx] = Math.max(keyLight[idx], Math.exp(-(t - e.t[i]) / 0.16));
  }
  const growth = easeOutBack((t - 60.0) / 1.2) * 90 + 14 * pulse('kick', t, 0.12) * (t > 60 ? 1 : 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  panels.forEach((P) => {
    if (P.a <= 0) return;
    const x0 = P.cx - (8 * kw + 7 * gap) / 2;
    for (let j = 0; j < 8; j++) {
      const x = x0 + j * (kw + gap), L = keyLight[j];
      if (P.ghost) ctx.setLineDash([6, 6]); else ctx.setLineDash([]);
      ctx.strokeStyle = rgba('c40', (0.5 + 0.5 * L) * P.a); ctx.lineWidth = 1.5;
      ctx.strokeRect(x, top, kw, kh);
      const g = ctx.createLinearGradient(0, top, 0, top + kh);
      g.addColorStop(0, rgba(P.ghost ? 'c60' : 'c40', (P.ghost ? 0.35 : 0.65) * L * P.a)); g.addColorStop(1, rgba('c70', 0.05 * P.a));
      ctx.fillStyle = g; ctx.fillRect(x, top, kw, kh);
      if (L > 0.05) glowSprite(ctx, x + kw / 2, top + kh * 0.3, 80, L * P.a * (P.ghost ? 0.6 : 0.9), 0);
    }
    ctx.setLineDash([]);
    const R = 70 + Math.max(0, growth);
    const g2 = ctx.createRadialGradient(P.cx, 330, 0, P.cx, 330, R * 1.2);
    g2.addColorStop(0, rgba('c50', 0.45 * P.a)); g2.addColorStop(1, rgba('c70', 0));
    blobPath(ctx, P.cx, 330, R, t, P.ghost ? 7 : 3);
    ctx.fillStyle = g2; ctx.fill();
    ctx.strokeStyle = rgba('c30', 0.85 * P.a); ctx.lineWidth = 2; ctx.stroke();
    drawText(ctx, textImg('运动皮层', FONTS.zh500(18), 4, PAL.c20, 'c50', 6), P.cx, 336, P.a * 0.9, 1, 0.4);
    drawText(ctx, textImg(P.zh, FONTS.zh500(26), 6, PAL.c10, 'c50', 8), P.cx, top - 28, P.a, 1, 0.5);
    drawText(ctx, textImg(P.en, FONTS.en800(13), 6, PAL.c40, 'c50', 4), P.cx, top + kh + 36, P.a * 0.85, 1, 0.3);
  });
  ctx.restore();
}

function sceneBuild(ctx, t) {
  const k = win(t, 63.6, 67.5, 0.6, 0.05);
  if (k <= 0) return;
  const lt = t - 64;
  godRays(ctx, 960, 470, k * (0.4 + 1.0 * smooth(lt / 3.4)), t * (1 + lt), { n: 20, len: 1500, speed: 0.08 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let j = 0; j < 10; j++) {
    const z = fract(j / 10 - lt * (0.35 + 0.25 * lt));
    const r = 40 / Math.max(0.04, z);
    ctx.strokeStyle = rgba('c40', 0.4 * k * (1 - z) * clamp(r / 200));
    ctx.lineWidth = 1 + 3 * (1 - z);
    ctx.beginPath(); ctx.ellipse(960, 470, r, r * 0.6, 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

function sceneWarp(ctx, t, k) {
  if (k <= 0) return;
  const boost = 1 + 1.5 * pulse('kick', t, 0.12);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < 420; i++) {
    const a = hash(i, 1) * TAU, sp = 0.18 + 0.25 * hash(i, 3);
    const z = fract(hash(i, 2) - t * sp);
    const r1 = 60 / Math.pow(z + 0.02, 0.9), r2 = 60 / Math.pow(Math.min(1.02, z + 0.035 * boost) + 0.02, 0.9);
    if (r2 > 1500) continue;
    const al = k * (1 - z) * 0.55 * clamp(r1 / 150);
    ctx.strokeStyle = rgba(['c40', 'c30', 'c50', 'c20'][i % 4], al);
    ctx.lineWidth = 0.6 + 2.2 * (1 - z);
    const c = Math.cos(a), s = Math.sin(a);
    ctx.beginPath(); ctx.moveTo(960 + c * r2, 460 + s * r2); ctx.lineTo(960 + c * r1, 460 + s * r1); ctx.stroke();
  }
  ctx.restore();
}

function sceneCards(ctx, t) {
  if (t < 68 || t > 92.2) return;
  const lb = envAt('low', t);
  sceneWarp(ctx, t, win(t, 68.0, 92.0, 0.05, 0.4) * (0.45 + 0.6 * lb));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  // mirror
  let k = win(t, 68.3, 72.0, 0.4, 0.25);
  if (k > 0) {
    const g = ctx.createLinearGradient(0, 120, 0, 700);
    g.addColorStop(0, rgba('c30', 0)); g.addColorStop(0.5, rgba('c10', 0.95)); g.addColorStop(1, rgba('c30', 0));
    ctx.strokeStyle = g; ctx.globalAlpha = k; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(960, 120); ctx.lineTo(960, 700); ctx.stroke();
    ctx.globalAlpha = k * 0.25; ctx.lineWidth = 24; ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // OCD loop and escape
  k = win(t, 72.0, 76.0, 0.3, 0.25);
  if (k > 0) {
    const R = GEO.ring;
    ctx.globalAlpha = k * (0.6 + 0.4 * pulse('kick', t, 0.1)); ctx.strokeStyle = PAL.c50; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(R.cx, R.cy, R.r, 0, TAU); ctx.stroke();
    ctx.globalAlpha = k * 0.18; ctx.lineWidth = 30; ctx.stroke();
    if (t > 74.0) {
      ctx.globalAlpha = k; ctx.strokeStyle = PAL.c20; ctx.lineWidth = 3;
      strokePoly(ctx, GEO.exitPts, easeOutCubic((t - 74.0) / 0.6));
      ctx.globalAlpha = k * 0.25; ctx.lineWidth = 16; ctx.strokeStyle = PAL.c40;
      strokePoly(ctx, GEO.exitPts, easeOutCubic((t - 74.0) / 0.6));
      flare(ctx, GEO.exitPts[0][0], GEO.exitPts[0][1], k * Math.exp(-(t - 74.0) / 0.4), 900);
    }
    ctx.globalAlpha = 1;
  }
  // half a brain (top view)
  k = win(t, 76.0, 80.0, 0.3, 0.25);
  if (k > 0) {
    const T2 = GEO.top;
    const rr = (t - 76.0) * 1.6, lr = (t - 78.0) * 0.9;
    ctx.globalAlpha = k * 0.85;
    strokeSegs(ctx, T2.segs, (s) => s.side > 0 && s.kind === 0 && s.d < rr + 0.5, PAL.c30, 2.2);
    strokeSegs(ctx, T2.segs, (s) => s.side > 0 && s.kind === 1 && s.d < rr, PAL.c50, 1.5);
    ctx.globalAlpha = k * 0.35 * (1 - smooth(lr)); ctx.setLineDash([5, 7]);
    strokeSegs(ctx, T2.segs, (s) => s.side < 0 && s.kind === 0, PAL.c60, 1.4);
    ctx.setLineDash([]);
    if (lr > 0) {
      ctx.globalAlpha = k * 0.9;
      strokeSegs(ctx, T2.segs, (s) => s.side < 0 && s.kind === 0 && s.d < lr, PAL.c30, 2.2);
      strokeSegs(ctx, T2.segs, (s) => s.side < 0 && s.kind === 1 && s.d < lr, PAL.c40, 1.5);
      ctx.globalAlpha = k;
      strokeSegs(ctx, T2.segs, (s) => s.side < 0 && Math.abs(s.d - lr) < 0.05, PAL.c10, 2.4);
    }
    ctx.globalAlpha = k * 0.22; ctx.lineWidth = 8;
    strokeSegs(ctx, T2.segs, (s) => (s.side > 0 && s.d < rr) || (s.side < 0 && s.d < lr), PAL.c60, 7);
    ctx.globalAlpha = 1;
  }
  // rebuilding: cells light up on every 16th note
  k = win(t, 80.0, 84.0, 0.25, 0.25);
  if (k > 0) {
    const lit = countIn('ost', 79.99, t) * 9;
    const cs = GEO.cells.slice().sort((a, b) => a.order - b.order);
    const lastOst = lastEvent('ost', t);
    cs.forEach((c, i) => {
      const on = i < lit;
      ctx.strokeStyle = rgba(on ? 'c40' : 'c80', (on ? 0.85 : 0.35) * k); ctx.lineWidth = 1.2;
      ctx.strokeRect(c.x + 2, c.y + 2, c.s - 4, c.s - 4);
      if (on) {
        const fresh = i >= lit - 9 && lastOst ? Math.exp(-(t - lastOst.t) / 0.12) : 0;
        ctx.fillStyle = rgba('c60', (0.3 + 0.6 * fresh) * k);
        ctx.fillRect(c.x + 3, c.y + 3, c.s - 6, c.s - 6);
      }
    });
  }
  // neurogenesis
  k = win(t, 84.0, 88.0, 0.25, 0.25);
  if (k > 0) {
    GEO.trees.forEach((tr) => {
      const g = (t - tr.born) * 330;
      if (g <= 0) return;
      for (let d = 0; d <= 5; d++) { ctx.globalAlpha = k * (0.75 - d * 0.11); strokeSegs(ctx, tr.segs, (s) => s.depth === d && s.d1 < g, d < 2 ? PAL.c30 : PAL.c50, 2.6 - d * 0.35); }
      ctx.globalAlpha = k * 0.12; strokeSegs(ctx, tr.segs, (s) => s.d1 < g, PAL.c60, 8);
      const birth = Math.exp(-(t - tr.born) / 0.2);
      glowSprite(ctx, tr.x, tr.y, 50 + 160 * birth, k * (0.5 + 0.5 * birth), 0);
      dot(ctx, tr.x, tr.y, 14 + 10 * birth, k, 5);
    });
    ctx.globalAlpha = k * 0.6; ctx.strokeStyle = PAL.c50; ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 470; x <= 1450; x += 10) { const s = (x - 520) / 882; const y = 650 - 60 * Math.sin(clamp(s) * Math.PI) + 8; if (x === 470) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // ghosts → ancestors
  k = win(t, 89.9, 92.0, 0.3, 0.3);
  if (k > 0) {
    GEO.starLinks.forEach(([a, b], n) => {
      const A = GEO.stars[a], B = GEO.stars[b];
      const g = easeOutCubic((t - 90.0 - A.L * 0.25) / 0.4);
      if (g <= 0) return;
      ctx.globalAlpha = k * 0.7; ctx.strokeStyle = PAL.c40; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(lerp(A.x, B.x, g), lerp(A.y, B.y, g)); ctx.stroke();
    });
    GEO.stars.forEach((s) => { const g = smooth((t - 90.0 - s.L * 0.25) / 0.3); glowSprite(ctx, s.x, s.y, 60, k * g * 0.8, 0); dot(ctx, s.x, s.y, 10, k * g, 5); });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function sceneHill(ctx, t) {
  const k = win(t, 92.0, 100.0, 0.4, 0.3);
  if (k <= 0) return;
  const p = smooth((t - 92.5) / 6.5);
  // moonlight from the upper right
  glowSprite(ctx, 1520, 170, 420, 0.9 * k, 0);
  dot(ctx, 1520, 170, 40, k, 5);
  godRays(ctx, 1520, 170, 0.7 * k, t, { n: 10, spread: 1.4, dir: Math.PI * 0.8, len: 1700, speed: 0.01, width: 1.3 });
  // shadowed hill body with rim light
  const hill = GEO.hill;
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath(); ctx.moveTo(hill[0][0], hill[0][1]);
  hill.forEach((q) => ctx.lineTo(q[0], q[1]));
  ctx.lineTo(W + 50, H + 50); ctx.lineTo(-50, H + 50); ctx.closePath();
  const g = ctx.createLinearGradient(400, 300, 1200, 1100);
  g.addColorStop(0, `rgba(38,59,84,${0.95 * k})`); g.addColorStop(0.5, `rgba(20,31,44,${0.96 * k})`); g.addColorStop(1, `rgba(4,6,9,${0.98 * k})`);
  ctx.fillStyle = g; ctx.fill();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = PAL.c40; ctx.globalAlpha = 0.9 * k; ctx.lineWidth = 2.5;
  ctx.beginPath(); hill.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.stroke();
  ctx.globalAlpha = 0.25 * k; ctx.lineWidth = 14; ctx.stroke();
  GEO.snow.forEach(([x, y, r]) => { const tw = 0.5 + 0.5 * Math.sin(t * (1 + 3 * r) + r * 40); ctx.globalAlpha = k * 0.35 * tw; ctx.fillStyle = PAL.c30; ctx.fillRect(x, y, 1.6, 1.6); });
  ctx.lineCap = 'round';
  GEO.tracks.forEach((tr, i) => {
    const deep = i === 2;
    ctx.globalAlpha = k * (deep ? 0.35 + 0.6 * p : 0.3 * (1 - 0.6 * p));
    ctx.strokeStyle = deep ? PAL.c30 : PAL.c60;
    ctx.lineWidth = deep ? 1.5 + 6 * p : 1.2;
    strokePoly(ctx, tr.pts, 1);
    if (deep) { ctx.globalAlpha = k * 0.22 * p; ctx.lineWidth = 26 * p + 2; ctx.strokeStyle = PAL.c50; strokePoly(ctx, tr.pts, 1); }
  });
  ctx.restore();
}

function sceneNetwork(ctx, t) {
  const k = win(t, 100.0, 108.4, 0.05, 0.6);
  if (k <= 0) return;
  sceneWarp(ctx, t, k * (0.35 + 0.5 * envAt('low', t)));
  const P = GEO.nodes.map((p) => netProject(p, t));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  GEO.edges.forEach(([a, b]) => {
    const d = clamp((1.4 - (P[a][2] + P[b][2]) / 2) / 2.8);
    ctx.strokeStyle = rgba('c50', k * (0.1 + 0.3 * d)); ctx.lineWidth = 0.6 + 1.4 * d;
    ctx.beginPath(); ctx.moveTo(P[a][0], P[a][1]); ctx.lineTo(P[b][0], P[b][1]); ctx.stroke();
  });
  const flashN = new Float32Array(P.length);
  const step = 0.25, n0 = Math.floor((t - 100) / step);
  for (let n = n0; n > n0 - 3 && n >= 0; n--) {
    const dt = t - (100 + n * step);
    const p = clamp(dt / 0.32);
    for (let j = 0; j < 12; j++) {
      const e = GEO.edges[Math.floor(hash(n, 400 + j) * GEO.edges.length)];
      const A = P[e[0]], B = P[e[1]];
      if (p < 1) dot(ctx, lerp(A[0], B[0], p), lerp(A[1], B[1], p), 9, k, 5);
      if (dt > 0.32) flashN[e[1]] = Math.max(flashN[e[1]], Math.exp(-(dt - 0.32) / 0.2));
      ctx.strokeStyle = rgba('c30', k * 0.6 * (1 - p * 0.5)); ctx.lineWidth = 1.8;
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], p), lerp(A[1], B[1], p)); ctx.stroke();
    }
  }
  P.forEach((q, i) => {
    const d = clamp((1.4 - q[2]) / 2.8);
    dot(ctx, q[0], q[1], (4 + 7 * d) * (1 + flashN[i]), k * (0.4 + 0.6 * d), i % 4);
    if (flashN[i] > 0.05) glowSprite(ctx, q[0], q[1], 60, k * flashN[i], 0);
  });
  ctx.restore();
}

function sceneBrainFinal(ctx, t) {
  const k = win(t, 107.8, 115.4, 0.4, 0.15);
  if (k <= 0) return;
  godRays(ctx, 960, 420, 0.7 * k * (0.6 + envAt('low', t)), t, { n: 18, len: 1500, speed: 0.06 });
  drawGyri(ctx, GEO.brainBig, t, { reveal: (t - 108.0) * 2.2, k, wave: true });
}

function sceneFinal(ctx, t) {
  const k = win(t, 116.0, 124.0, 0.02, 1.5);
  if (k <= 0) return;
  godRays(ctx, 960, 440, k * (0.5 + 0.9 * Math.exp(-(t - 116) / 1.2)), t, { n: 22, len: 1600, speed: 0.03 });
}

// ================================================================== text cues
const RUNS = new Map();
function run(key, str, font, fill, glow, gp) { if (!RUNS.has(key)) RUNS.set(key, glyphRun(str, font, fill, glow, gp)); return RUNS.get(key); }
// Soft shadow band behind captions so they read over bright particles
function shade(ctx, y, w, h, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.translate(960, y); ctx.scale(w / 100, h / 100);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 100);
  g.addColorStop(0, `rgba(0,0,0,${0.62 * a})`); g.addColorStop(0.6, `rgba(0,0,0,${0.35 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(-100, -100, 200, 200);
  ctx.restore();
}
function drawCue(ctx, c, idx, t) {
  const lt = t - c.t, rem = c.t + c.d - t;
  if (lt < 0 || rem < 0) return;
  const out = smooth(rem / 0.25);
  const flash = Math.exp(-lt / 0.3);
  const sa = smooth(lt / 0.25) * out;
  if (c.kind === 'main') shade(ctx, c.y + 10, 900, 110, sa);
  else if (c.kind === 'hero') shade(ctx, c.y - 10, 820, 150, sa);
  else if (c.kind === 'card') shade(ctx, c.y - 40, 980, 230, sa);
  switch (c.kind) {
    case 'main': {
      const big = !!c.big;
      const dy = (1 - easeOutCubic(lt / 0.45)) * 18;
      const a = smooth(lt / 0.2) * out;
      const zh = textImg(c.zh, big ? FONTS.zh900(76) : FONTS.zh500(50), big ? 6 : 3, PAL.c10, 'c50', big ? 18 : 12);
      drawText(ctx, zh, 960, c.y + dy, a, 1, 0.45 + 0.9 * flash, big ? lt / 0.9 : -1);
      if (c.en) drawText(ctx, textImg(c.en, FONTS.en300(23), 2, PAL.c40, 'c60', 6), 960, c.y + (big ? 66 : 54) + dy * 1.4, smooth((lt - 0.12) / 0.3) * out * 0.9, 1, 0.25);
      break;
    }
    case 'hero': {
      const sc = 1 + 0.32 * (1 - easeOutExpo(lt / 0.32)) + 0.03 * (1 - out);
      const a = smooth(lt / 0.05) * out;
      drawText(ctx, textImg(c.zh, FONTS.zh900(116), 8, PAL.c10, 'c50', 22), 960, c.y, a, sc, 0.55 + 1.2 * flash, lt / 0.85);
      if (c.en) drawText(ctx, textImg(c.en, FONTS.osw(34), 16, PAL.c30, 'c50', 8), 960, c.y + 74, smooth((lt - 0.12) / 0.3) * out, 1, 0.35);
      break;
    }
    case 'title': {
      const r = run('t' + idx, c.zh, FONTS.zh900(200), PAL.c10, 'c50', 26);
      drawRun(ctx, r, 960, c.y, 36, (i) => smooth((lt - i * 0.12) / 0.35) * out, (i) => 1.22 - 0.22 * easeOutExpo((lt - i * 0.12) / 0.5), 0.8);
      break;
    }
    case 'enHero': {
      const r = run('e' + idx, c.en, FONTS.osw(52), PAL.c20, 'c50', 10);
      const sp = 18 + 46 * (1 - easeOutCubic(lt / 1.8));
      drawRun(ctx, r, 960, c.y, sp, () => smooth(lt / 0.6) * out, null, 0.5);
      break;
    }
    case 'tag': {
      const r = run('g' + idx, c.zh, FONTS.zh500(24), PAL.c40, 'c60', 6);
      const dim = c.dim ? 0.7 : 1;
      drawRun(ctx, r, 960, c.y, 7, (i) => smooth((lt - i * 0.022) / 0.08) * out * dim, null, 0.35);
      break;
    }
    case 'card': {
      const y = c.y;
      const lr = run('l' + idx, c.label, FONTS.zh500(22), PAL.c40, 'c60', 6);
      drawRun(ctx, lr, 960, y - 178, 8, (i) => smooth((lt - i * 0.025) / 0.08) * out, null, 0.35);
      const lw = 140 * easeOutCubic(lt / 0.5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = rgba('c40', 0.7 * out); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(960 - 200, y - 186); ctx.lineTo(960 - 200 - lw, y - 186); ctx.moveTo(960 + 200, y - 186); ctx.lineTo(960 + 200 + lw, y - 186); ctx.stroke(); ctx.restore();
      const sc = 1 + 0.35 * (1 - easeOutExpo(lt / 0.3));
      drawText(ctx, textImg(c.zh, FONTS.zh900(118), 10, PAL.c10, 'c50', 22), 960, y - 60, smooth(lt / 0.05) * out, sc, 0.55 + 1.2 * flash, lt / 0.8);
      const dy = (1 - easeOutCubic((lt - 0.18) / 0.45)) * 16;
      drawText(ctx, textImg(c.sub, FONTS.zh500(42), 3, PAL.c10, 'c50', 10), 960, y + 22 + dy, smooth((lt - 0.18) / 0.25) * out, 1, 0.45);
      drawText(ctx, textImg(c.en, FONTS.en300(22), 2, PAL.c40, 'c60', 6), 960, y + 70 + dy, smooth((lt - 0.32) / 0.3) * out * 0.9, 1, 0.25);
      break;
    }
    case 'credit': {
      drawText(ctx, textImg(c.zh, FONTS.zh300(20), 4, PAL.c40, 'c60', 4), 960, c.y, smooth(lt / 0.8) * out * 0.75, 1, 0.2);
      break;
    }
  }
}

// ================================================================== compositor
let MAIN, WORLD, WG;
function renderFrame(frame) {
  const t = frame / FPS;
  const ctx = CTX;
  CAM.zoom = 1; CAM.roll = 0;
  // camera: impact shake + kick punch
  let shake = 0;
  const imp = EVT.impact; const ii = upper(imp.t, t) - 1;
  for (let j = ii; j >= 0 && j > ii - 2; j--) shake += 18 * imp.v[j][0] * Math.exp(-(t - imp.t[j]) / 0.16);
  shake += 2.2 * pulse('kick', t, 0.05);
  const sx = (hash(frame, 11) - 0.5) * 2 * shake, sy = (hash(frame, 12) - 0.5) * 2 * shake;
  const kp = pulse('kick', t, 0.1);

  // ---- world layer
  const g = WG;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  sceneBackground(g, t);
  // scenes may tweak CAM, so evaluate them inside a transform computed after a dry pass
  g.save();
  const zoomBase = 1 + 0.014 * kp + 0.015 * Math.sin(t * 0.17);
  // pre-compute scene-driven camera parameters
  if (t >= 32 && t < 40) { const st = smooth((t - 36.2) / 1.3); CAM.roll = (0.24 * Math.sin(t * 1.9) + 0.13 * Math.sin(t * 3.3 + 1)) * (1 - st) * 0.2; }
  if (t >= 64 && t < 67.5) CAM.zoom = 1 + 0.12 * smooth((t - 64) / 3.5);
  const z = zoomBase * CAM.zoom;
  g.translate(W / 2 + sx, H / 2 + sy); g.rotate(CAM.roll); g.scale(z, z); g.translate(-W / 2, -H / 2);
  const camZoom = CAM.zoom;
  sceneMachine(g, t);
  sceneTitle(g, t);
  sceneBrain(g, t);
  sceneHebb(g, t);
  sceneFalling(g, t);
  sceneMaps(g, t);
  sceneStroke(g, t);
  scenePiano(g, t);
  if (t >= 63.6 && t < 67.5) sceneBuild(g, t);
  sceneCards(g, t);
  sceneHill(g, t);
  sceneNetwork(g, t);
  sceneBrainFinal(g, t);
  sceneFinal(g, t);
  drawSwarm(g, t, 1);
  g.restore();
  CAM.zoom = camZoom;

  // ---- composite
  ctx.globalCompositeOperation = 'copy';
  ctx.globalAlpha = 1;
  ctx.drawImage(WORLD, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  bloom(ctx, WORLD, 0.72 + 0.3 * kp, 0.55 + 0.25 * envAt('low', t));

  // impact flash + anamorphic flare
  let fl = 0;
  for (let j = ii; j >= 0 && j > ii - 2; j--) fl += imp.v[j][0] * Math.exp(-(t - imp.t[j]) / 0.08);
  if (fl > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = clamp(0.3 * fl); ctx.fillStyle = PAL.c40; ctx.fillRect(0, 0, W, H); ctx.restore();
    flare(ctx, W / 2 + sx, 470 + sy, 0.9 * fl);
  }
  const sn = pulse('snare', t, 0.06);
  if (t > 68 && t < 92 || t > 100 && t < 116) flare(ctx, W / 2, 470, 0.25 * sn, 1300);

  ctx.drawImage(POST.vig, 0, 0);

  // ---- text (light camera follow)
  ctx.save();
  ctx.translate(sx * 0.4, sy * 0.4);
  CUES.forEach((c, i) => drawCue(ctx, c, i, t));
  ctx.restore();

  // letterbox
  let lb = 0;
  if (t < 8.0) lb = 132; else if (t < 8.6) lb = 132 * (1 - easeOutExpo((t - 8.0) / 0.6));
  if (t > 121.0) lb = Math.max(lb, 132 * easeInOutCubic((t - 121.0) / 1.4));
  if (lb > 0.5) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb); }

  grain(ctx, frame, 0.07);

  // silences before the drops cut to black; global fade in/out
  let black = 0;
  if ((t >= 67.5 && t < 68.0) || (t >= 115.5 && t < 116.0)) black = 1;
  black = Math.max(black, 1 - smooth(t / 0.6), smooth((t - 122.4) / 1.4));
  if (black > 0.001) { ctx.globalAlpha = black; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

async function loadFonts() {
  const faces = [
    ['NotoSC', 'noto-sans-sc-chinese-simplified-300-normal.woff2', '300'],
    ['NotoSC', 'noto-sans-sc-chinese-simplified-500-normal.woff2', '500'],
    ['NotoSC', 'noto-sans-sc-chinese-simplified-900-normal.woff2', '900'],
    ['NotoSCL', 'noto-sans-sc-latin-300-normal.woff2', '300'],
    ['NotoSCL', 'noto-sans-sc-latin-500-normal.woff2', '500'],
    ['NotoSCL', 'noto-sans-sc-latin-900-normal.woff2', '900'],
    ['Oswald', 'oswald-latin-700-normal.woff2', '700'],
    ['Montserrat', 'montserrat-latin-300-normal.woff2', '300'],
    ['Montserrat', 'montserrat-latin-800-normal.woff2', '800'],
  ];
  for (const [fam, file, w] of faces) {
    const f = new FontFace(fam, `url(../fonts/${file})`, { weight: w });
    await f.load(); document.fonts.add(f);
  }
  await document.fonts.ready;
}

async function boot() {
  CV = document.getElementById('c'); CTX = CV.getContext('2d');
  WORLD = mk(W, H); WG = WORLD.getContext('2d');
  FPS = window.TL.fps;
  CUES = window.TL.cues;
  initEvents(window.EV);
  await loadFonts();
  initSprites(); initPost(); initGeometry(); initSwarm(); initChoreo();
  // warm text caches so frame timing is even
  CUES.forEach((c, i) => drawCue(mk(4, 4).getContext('2d'), c, i, c.t + 0.5));
  window.READY = true;
}
window.renderFrame = renderFrame;
window.frameJPEG = (f, q) => { renderFrame(f); return CV.toDataURL('image/jpeg', q || 0.94); };
boot().catch((e) => { window.BOOT_ERROR = String(e && e.stack || e); });
