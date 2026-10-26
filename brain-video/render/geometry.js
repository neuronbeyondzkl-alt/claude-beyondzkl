// Geometry precomputed once: brain silhouettes + gyri, neurons, fibres, network, hill.
'use strict';

const GEO = {};

// Marching squares: field sampled on (gw+1) x (gh+1) grid → segments [x1,y1,x2,y2]
function marching(field, gw, gh, iso, toX, toY, keep) {
  const segs = [];
  const at = (i, j) => field[j * (gw + 1) + i];
  for (let j = 0; j < gh; j++) {
    for (let i = 0; i < gw; i++) {
      const a = at(i, j) - iso, b = at(i + 1, j) - iso, c = at(i + 1, j + 1) - iso, d = at(i, j + 1) - iso;
      let idx = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
      if (idx === 0 || idx === 15) continue;
      const top = [i + a / (a - b), j], right = [i + 1, j + b / (b - c)];
      const bottom = [i + d / (d - c), j + 1], left = [i, j + a / (a - d)];
      const L = [];
      switch (idx) {
        case 1: case 14: L.push([left, bottom]); break;
        case 2: case 13: L.push([bottom, right]); break;
        case 3: case 12: L.push([left, right]); break;
        case 4: case 11: L.push([top, right]); break;
        case 5: L.push([left, top], [bottom, right]); break;
        case 6: case 9: L.push([top, bottom]); break;
        case 7: case 8: L.push([left, top]); break;
        case 10: L.push([top, right], [left, bottom]); break;
      }
      for (const [p, q] of L) {
        const x1 = toX(p[0]), y1 = toY(p[1]), x2 = toX(q[0]), y2 = toY(q[1]);
        if (!keep || keep((x1 + x2) / 2, (y1 + y2) / 2)) segs.push([x1, y1, x2, y2]);
      }
    }
  }
  return segs;
}

const ell = (u, v, cx, cy, rx, ry) => 1 - ((u - cx) / rx) ** 2 - ((v - cy) / ry) ** 2;
function capsule(u, v, ax, ay, bx, by, r) {
  const px = u - ax, py = v - ay, dx = bx - ax, dy = by - ay;
  const h = clamp((px * dx + py * dy) / (dx * dx + dy * dy));
  const ex = px - dx * h, ey = py - dy * h;
  return 1 - (ex * ex + ey * ey) / (r * r);
}
// Side view: frontal lobe on the left. Returns parts so gyri/folia can differ.
function brainSideParts(u, v) {
  const cer = Math.max(ell(u, v, 0.02, -0.1, 0.97, 0.64), ell(u, v, -0.12, 0.2, 0.66, 0.33) * 1.0, ell(u, v, 0.55, 0.02, 0.42, 0.42));
  const cbl = ell(u, v, 0.56, 0.4, 0.3, 0.165);
  const stem = capsule(u, v, 0.33, 0.25, 0.28, 0.7, 0.085);
  return { cer, cbl, stem, all: Math.max(cer, cbl, stem) };
}

function buildBrainSide(cx, cy, S, seed = 0, cell = 0.014) {
  const u0 = -1.08, u1 = 1.08, v0 = -0.82, v1 = 0.92;
  const gw = Math.ceil((u1 - u0) / cell), gh = Math.ceil((v1 - v0) / cell);
  const fAll = new Float32Array((gw + 1) * (gh + 1));
  const fGyri = new Float32Array((gw + 1) * (gh + 1));
  const fFol = new Float32Array((gw + 1) * (gh + 1));
  for (let j = 0; j <= gh; j++) {
    for (let i = 0; i <= gw; i++) {
      const u = u0 + i * cell, v = v0 + j * cell;
      const p = brainSideParts(u, v);
      const k = j * (gw + 1) + i;
      fAll[k] = p.all;
      const wx = Noise.fbm(u * 1.3 + 11 + seed, v * 1.3, 2) * 0.55, wy = Noise.fbm(u * 1.3 - 7, v * 1.3 + 3 + seed, 2) * 0.55;
      fGyri[k] = p.cer > 0.06 && p.cbl < 0 && p.stem < 0.2 ? Noise.fbm(u * 3.1 + wx + seed, v * 3.6 + wy, 3) : 1;
      fFol[k] = p.cbl > 0.08 ? Math.sin((v - 0.4) * 95 + Noise.n2(u * 4, v * 4) * 2.4 + u * 6) : 1;
    }
  }
  const toX = (i) => cx + (u0 + i * cell) * S, toY = (j) => cy + (v0 + j * cell) * S;
  const outline = marching(fAll, gw, gh, 0, toX, toY);
  const gyri = marching(fGyri, gw, gh, 0, toX, toY);
  const folia = marching(fFol, gw, gh, 0, toX, toY);
  const all = [];
  const tag = (arr, kind) => arr.forEach((s) => {
    const mx = (s[0] + s[2]) / 2, my = (s[1] + s[3]) / 2;
    const r = Math.hypot((mx - cx) / S, (my - cy) / S);
    all.push({ s, kind, r, rv: r + 0.25 * hash(all.length, 5 + seed), ang: Math.atan2(my - cy, mx - cx) });
  });
  tag(outline, 0); tag(gyri, 1); tag(folia, 2);
  const inside = (x, y) => brainSideParts((x - cx) / S, (y - cy) / S).all > 0;
  return { cx, cy, S, segs: all, inside, parts: (x, y) => brainSideParts((x - cx) / S, (y - cy) / S) };
}

function buildBrainTop(cx, cy, S, cell = 0.016) {
  const hemi = (u, v, side) => {
    const sx = side * 0.5;
    const taper = 1 - 0.14 * Math.max(0, -v); // narrower frontal pole
    return ell(u, v, sx, 0.02, 0.46 * taper, 0.8);
  };
  const u0 = -1.05, u1 = 1.05, v0 = -0.9, v1 = 0.9;
  const gw = Math.ceil((u1 - u0) / cell), gh = Math.ceil((v1 - v0) / cell);
  const fO = new Float32Array((gw + 1) * (gh + 1)), fG = new Float32Array((gw + 1) * (gh + 1));
  for (let j = 0; j <= gh; j++) for (let i = 0; i <= gw; i++) {
    const u = u0 + i * cell, v = v0 + j * cell, k = j * (gw + 1) + i;
    const h = Math.max(hemi(u, v, -1), hemi(u, v, 1));
    fO[k] = h;
    const wx = Noise.fbm(u * 1.4 + 3, v * 1.4, 2) * 0.5;
    fG[k] = h > 0.07 ? Noise.fbm(u * 3.4 + wx + 40, v * 3.0 - wx, 3) : 1;
  }
  const toX = (i) => cx + (u0 + i * cell) * S, toY = (j) => cy + (v0 + j * cell) * S;
  const segs = [];
  marching(fO, gw, gh, 0, toX, toY).forEach((s) => segs.push({ s, kind: 0 }));
  marching(fG, gw, gh, 0, toX, toY).forEach((s) => segs.push({ s, kind: 1 }));
  segs.forEach((o) => { const mx = (o.s[0] + o.s[2]) / 2; o.side = mx < cx ? -1 : 1; o.d = Math.abs(mx - cx) / S + 0.15 * hash(segs.indexOf(o), 9); });
  return { cx, cy, S, segs };
}

// Recursive dendrite tree → segments with depth and arrival distance from the root
function growTree(x, y, ang, len, depth, rnd, out, dist = 0, maxDepth = 6, spreadK = 0.55) {
  if (depth > maxDepth || len < 6) return;
  const steps = 4;
  let px = x, py = y, a = ang;
  for (let s = 0; s < steps; s++) {
    a += (rnd() - 0.5) * 0.5;
    const nx = px + Math.cos(a) * len / steps, ny = py + Math.sin(a) * len / steps;
    out.push({ s: [px, py, nx, ny], depth, d0: dist, d1: dist + len / steps });
    dist += len / steps; px = nx; py = ny;
  }
  const n = rnd() < 0.7 ? 2 : 3;
  for (let k = 0; k < n; k++) {
    growTree(px, py, a + (k - (n - 1) / 2) * spreadK * (0.7 + rnd() * 0.6), len * (0.62 + rnd() * 0.15), depth + 1, rnd, out, dist, maxDepth, spreadK);
  }
}

function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
}
function polyline(fn, n) { const pts = []; for (let i = 0; i <= n; i++) pts.push(fn(i / n)); return pts; }
function polyLen(pts) { let L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return L; }
function polyAt(pts, L, s) { // s in [0,1] by arc length
  const target = s * L[L.length - 1];
  let i = upper(L, target) - 1; i = clamp(i, 0, pts.length - 2);
  const f = (target - L[i]) / Math.max(1e-6, L[i + 1] - L[i]);
  return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
}
function strokePoly(ctx, pts, upto = 1) {
  const n = Math.max(1, Math.floor((pts.length - 1) * clamp(upto)));
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= n; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.stroke();
}

function initGeometry() {
  // Side-view brain used in several scenes
  GEO.brain = buildBrainSide(960, 430, 400, 0);
  GEO.brainBig = buildBrainSide(960, 420, 430, 0);
  GEO.brainSmall = buildBrainSide(960, 330, 140, 0, 0.03);
  GEO.top = buildBrainTop(960, 380, 300);

  const pointsFrom = (segs, filter) => segs.filter(filter || (() => true)).map((o) => [(o.s[0] + o.s[2]) / 2, (o.s[1] + o.s[3]) / 2]);
  GEO.brainPts = pointsFrom(GEO.brain.segs);
  GEO.brainBigPts = pointsFrom(GEO.brainBig.segs);
  GEO.brainSmallPts = pointsFrom(GEO.brainSmall.segs);
  GEO.topRightPts = pointsFrom(GEO.top.segs, (o) => o.side > 0);
  GEO.topAllPts = pointsFrom(GEO.top.segs);

  // "Machine" grid for the intro: square cells inside the silhouette
  const B = GEO.brain, cs = 34;
  GEO.cells = [];
  for (let y = B.cy - 0.84 * B.S; y < B.cy + 0.92 * B.S; y += cs) {
    for (let x = B.cx - 1.05 * B.S; x < B.cx + 1.05 * B.S; x += cs) {
      const p = B.parts(x + cs / 2, y + cs / 2);
      if (p.all > 0.02) GEO.cells.push({ x, y, s: cs, order: hash(GEO.cells.length, 31) });
    }
  }
  GEO.cellPts = [];
  GEO.cells.forEach((c) => { for (let k = 0; k < 4; k++) { const e = k / 4; GEO.cellPts.push([c.x + e * c.s, c.y], [c.x, c.y + e * c.s]); } });
  GEO.modules = [
    { u: -0.02, v: -0.5, w: 0.42, h: 0.18, zh: '运动', en: 'MOTOR' },
    { u: 0.72, v: -0.08, w: 0.34, h: 0.2, zh: '视觉', en: 'VISION' },
    { u: -0.55, v: -0.02, w: 0.38, h: 0.18, zh: '语言', en: 'LANGUAGE' },
    { u: 0.02, v: 0.3, w: 0.4, h: 0.15, zh: '听觉', en: 'HEARING' },
    { u: -0.62, v: -0.42, w: 0.36, h: 0.18, zh: '决策', en: 'PLANNING' },
    { u: 0.4, v: -0.45, w: 0.36, h: 0.17, zh: '感觉', en: 'TOUCH' },
  ];

  // Hebb neurons
  const r = mulberry32(42);
  GEO.nA = [600, 470]; GEO.nB = [1320, 470];
  GEO.dendA = []; GEO.dendB = [];
  for (let k = 0; k < 7; k++) growTree(GEO.nA[0], GEO.nA[1], Math.PI * (0.55 + 0.9 * k / 6) + (r() - 0.5) * 0.2, 90, 0, r, GEO.dendA, 0, 4);
  for (let k = 0; k < 7; k++) growTree(GEO.nB[0], GEO.nB[1], Math.PI * (-0.45 + 0.9 * k / 6) + (r() - 0.5) * 0.2, 90, 0, r, GEO.dendB, 0, 4);
  GEO.strands = [];
  for (let k = 0; k < 9; k++) {
    const off = (k - 4) * 15, w1 = (r() - 0.5) * 60, w2 = (r() - 0.5) * 60;
    const pts = polyline((s) => bezier([GEO.nA[0] + 30, GEO.nA[1]], [800, GEO.nA[1] + off * 3 + w1], [1120, GEO.nB[1] - off * 3 + w2], [GEO.nB[0] - 30, GEO.nB[1]], s), 60);
    GEO.strands.push({ pts, L: polyLen(pts) });
  }
  GEO.hebbPts = [];
  GEO.strands.forEach((st) => { for (let i = 0; i < 80; i++) GEO.hebbPts.push(polyAt(st.pts, st.L, i / 79)); });

  // Hand silhouettes (mirror therapy)
  const hand = (cx, cy, flip) => {
    const pts = [];
    const fingers = [[-66, -170, 15], [-22, -205, 16], [24, -195, 16], [66, -160, 14]];
    const inHand = (x, y) => {
      const lx = (x - cx) * flip, ly = y - cy;
      if (Math.abs(lx) < 84 && ly > -85 && ly < 120 && !(Math.abs(lx) > 70 && ly < -60)) return true; // palm
      if (Math.abs(lx) < 55 && ly >= 120 && ly < 230) return true; // wrist
      for (const [fx, fy, fr] of fingers) if (capsule(lx, ly, fx, -90, fx + fx * 0.08, fy, fr) > 0) return true;
      return capsule(lx, ly, -78, 50, -150, -40, 17) > 0; // thumb
    };
    for (let y = cy - 200; y < cy + 240; y += 7) for (let x = cx - 180; x < cx + 180; x += 7) if (inHand(x, y)) pts.push([x, y]);
    return pts;
  };
  GEO.handL = hand(660, 400, 1);
  GEO.handR = hand(1260, 400, -1);

  // OCD loop
  GEO.ring = { cx: 960, cy: 390, r: 190 };
  const ringPts = polyline((s) => [GEO.ring.cx + Math.cos(-Math.PI / 2 + s * TAU) * GEO.ring.r, GEO.ring.cy + Math.sin(-Math.PI / 2 + s * TAU) * GEO.ring.r], 120);
  const exitStart = ringPts[30];
  const exitPts = polyline((s) => bezier(exitStart, [exitStart[0] + 220, exitStart[1] + 10], [1500, 120], [2050, 260], s), 80);
  GEO.escape = ringPts.slice(0, 31).concat(exitPts.slice(1));
  GEO.escapeL = polyLen(GEO.escape);
  GEO.exitPts = exitPts; GEO.exitL = polyLen(exitPts);

  // Stroke fibres: cortex arc → spinal cord
  GEO.fibres = [];
  const nF = 34;
  for (let k = 0; k < nF; k++) {
    const a = Math.PI * (1.12 + 0.76 * k / (nF - 1));
    const p0 = [960 + Math.cos(a) * 520, 470 + Math.sin(a) * 290];
    const p3 = [960 + (k - nF / 2) * 2.2, 780];
    const pts = polyline((s) => bezier(p0, [p0[0] * 0.6 + 960 * 0.4, p0[1] + 160], [960 + (k - nF / 2) * 6, 600], p3, s), 50);
    const gaps = [];
    for (let g = 0; g < 4; g++) { const c = 0.15 + 0.75 * hash(k, 50 + g); gaps.push([c - 0.03 - 0.04 * hash(k, 60 + g), c + 0.03]); }
    GEO.fibres.push({ pts, L: polyLen(pts), gaps, alive: k === 21 });
  }
  GEO.sprouts = [];
  const live = GEO.fibres[21];
  const targets = [17, 25, 14, 28, 19, 23, 11, 31];
  targets.forEach((tk, n) => {
    const sFrom = 0.25 + 0.06 * n, sTo = sFrom + 0.12;
    const a = polyAt(live.pts, live.L, sFrom), f = GEO.fibres[tk];
    const b = polyAt(f.pts, f.L, sTo);
    const mid = [(a[0] + b[0]) / 2 + (hash(n, 70) - 0.5) * 80, (a[1] + b[1]) / 2 - 30 - 40 * hash(n, 71)];
    const pts = polyline((s) => { const u = 1 - s; return [u * u * a[0] + 2 * u * s * mid[0] + s * s * b[0], u * u * a[1] + 2 * u * s * mid[1] + s * s * b[1]]; }, 24);
    GEO.sprouts.push({ pts, L: polyLen(pts), fibre: tk, from: sTo });
  });

  // Neurogenesis trees from a hippocampus-like arc
  GEO.trees = [];
  for (let k = 0; k < 7; k++) {
    const x = 520 + k * 147, y = 650 - 60 * Math.sin((k / 6) * Math.PI);
    const out = [];
    growTree(x, y, -Math.PI / 2 + (hash(k, 80) - 0.5) * 0.4, 120, 0, mulberry32(300 + k), out, 0, 5, 0.6);
    GEO.trees.push({ x, y, segs: out, born: 84 + k * 0.5 });
  }
  GEO.treePts = [];
  GEO.trees.forEach((tr) => tr.segs.forEach((s) => GEO.treePts.push([s.s[2], s.s[3]])));

  // Ghosts → ancestors constellation
  const cr = mulberry32(77);
  GEO.stars = [];
  const levels = [1, 2, 4, 8];
  levels.forEach((n, L) => {
    for (let i = 0; i < n; i++) GEO.stars.push({ x: 960 + (i - (n - 1) / 2) * (760 / Math.max(1, n - 1 || 1)) * (n === 1 ? 0 : 1), y: 640 - L * 140 + (cr() - 0.5) * 20, L, i });
  });
  GEO.starLinks = [];
  GEO.stars.forEach((s, idx) => { if (s.L > 0) { const parent = GEO.stars.find((p) => p.L === s.L - 1 && p.i === Math.floor(s.i / 2)); GEO.starLinks.push([GEO.stars.indexOf(parent), idx]); } });
  GEO.starPts = [];
  GEO.starLinks.forEach(([a, b]) => { const A = GEO.stars[a], Bs = GEO.stars[b]; for (let i = 0; i <= 40; i++) GEO.starPts.push([lerp(A.x, Bs.x, i / 40), lerp(A.y, Bs.y, i / 40)]); });
  GEO.stars.forEach((s) => { for (let i = 0; i < 30; i++) GEO.starPts.push([s.x, s.y]); });

  // Snowy hill + sled tracks
  GEO.hill = polyline((s) => [lerp(-40, 1960, s), 820 - 520 * Math.exp(-((s - 0.22) ** 2) / 0.05) + 140 * s + 18 * Noise.n2(s * 9, 2)], 120);
  GEO.tracks = [];
  for (let k = 0; k < 6; k++) {
    const p0 = [418 + 16 * k, 350 + 6 * k];
    const pts = polyline((s) => {
      const b = bezier(p0, [470 + 45 * k, 560], [360 + 150 * k, 820], [230 + 205 * k, 1130], s);
      return [b[0] + Math.sin(s * 8 + k * 1.3) * 22 * s, b[1]];
    }, 70);
    GEO.tracks.push({ pts, L: polyLen(pts) });
  }
  const sr = mulberry32(808);
  GEO.snow = [];
  for (let i = 0; i < 420; i++) {
    const x = sr() * W, y = 300 + sr() * 800;
    const s = clamp((x + 40) / 2000), ridge = 820 - 520 * Math.exp(-((s - 0.22) ** 2) / 0.05) + 140 * s;
    if (y > ridge + 6) GEO.snow.push([x, y, sr()]);
  }

  // 3D network for the finale
  const nr = mulberry32(2024);
  GEO.nodes = [];
  for (let i = 0; i < 150; i++) {
    const th = nr() * TAU, ph = Math.acos(2 * nr() - 1), rr = Math.cbrt(nr());
    GEO.nodes.push([Math.sin(ph) * Math.cos(th) * rr * 1.25, Math.cos(ph) * rr * 0.75, Math.sin(ph) * Math.sin(th) * rr * 0.9]);
  }
  GEO.edges = [];
  GEO.nodes.forEach((p, i) => {
    const d = GEO.nodes.map((q, j) => [j, (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2 + (p[2] - q[2]) ** 2]).sort((a, b) => a[1] - b[1]);
    for (let k = 1; k <= 3; k++) { const j = d[k][0]; if (!GEO.edges.some((e) => (e[0] === j && e[1] === i))) GEO.edges.push([i, j]); }
  });
}
