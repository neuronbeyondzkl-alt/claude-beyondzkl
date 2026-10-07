// 程序化生成每一种海洋生物的粒子点云。
// 不依赖任何外部 3D 模型：每个生物由放样体、管道、膜面、穹顶等“部件”组合而成，
// 每个部件按面积比例分到一定数量的粒子，并为每个粒子写入：
//   位置 xyz、动作通道（整数部分 = 部件分组，小数部分 = 动作权重）、
//   颜色 rgb（sRGB 设计 → 线性存储）、尺寸。
// 最终每个形体都是恰好 N 个粒子，打乱顺序后写入 GPU 纹理，供着色器在形体间插值变形。

export const N = 40000;          // 每个形体的粒子数
export const TEX_W = 400;        // 数据纹理宽度
export const ROWS = N / TEX_W;   // 每个形体占用的纹理行数

export const SHAPES = [
  'ocean', 'coral', 'starfish', 'seahorse', 'horseshoe', 'turtle', 'manta',
  'shark', 'whale', 'jellyfish', 'lanternfish', 'anglerfish', 'abyss',
];

const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const fract = (x) => x - Math.floor(x);

// ---------- 随机数 ----------
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function gauss(R) {
  let u = 0;
  while (u === 0) u = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * R());
}
function onSphere(R) {
  const y = 2 * R() - 1, a = TAU * R(), r = Math.sqrt(1 - y * y);
  return [r * Math.cos(a), y, r * Math.sin(a)];
}

// ---------- 值噪声 ----------
function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1103515245);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise3(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (dx, dy, dz) => hash3(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
const fbm = (x, y, z) => (noise3(x, y, z) * 0.62 + noise3(x * 2.1 + 7.3, y * 2.1, z * 2.1 - 3.1) * 0.38);

// ---------- 颜色（sRGB 0..1） ----------
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const dim = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
// 在若干颜色之间按 t∈[0,1] 渐变
function ramp(cols, t) {
  t = clamp(t, 0, 0.9999) * (cols.length - 1);
  const i = Math.floor(t);
  return mixc(cols[i], cols[i + 1], t - i);
}

// ---------- 向量 ----------
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function perpFrame(d) {
  const up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const n = norm3(cross3(d, up));
  return [n, cross3(d, n)];
}
function rotY(p, a) { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]]; }
function rotZ(p, a) { const c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1], p[2]]; }
function rotX(p, a) { const c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; }

// ---------- 曲线与剖面 ----------
// Catmull-Rom 样条：pts 为 2D/3D 点数组，返回 u∈[0,1] 的函数
function spline(pts, closed = false) {
  const n = pts.length, segs = closed ? n : n - 1;
  const g = (k) => (closed ? pts[((k % n) + n) % n] : pts[clamp(k, 0, n - 1)]);
  return (u) => {
    const f = clamp(u, 0, 1) * segs;
    const i = Math.min(Math.floor(f), segs - 1), t = f - i, t2 = t * t, t3 = t2 * t;
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    return p1.map((_, d) => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3));
  };
}
// 1D 剖面：[[u, v], ...]，平滑插值
function profile(pts) {
  return (u) => {
    u = clamp(u, pts[0][0], pts[pts.length - 1][0]);
    let i = 0;
    while (i < pts.length - 2 && u > pts[i + 1][0]) i++;
    const t = (u - pts[i][0]) / (pts[i + 1][0] - pts[i][0] || 1);
    const v0 = pts[Math.max(0, i - 1)][1], v1 = pts[i][1], v2 = pts[i + 1][1], v3 = pts[Math.min(pts.length - 1, i + 2)][1];
    const t2 = t * t, t3 = t2 * t;
    return Math.max(0, 0.5 * (2 * v1 + (v2 - v0) * t + (2 * v0 - 5 * v1 + 4 * v2 - v3) * t2 + (3 * v1 - v0 - 3 * v2 + v3) * t3));
  };
}
function smoothPoly(ctrl, sub = 8) {
  const f = spline(ctrl, true), out = [];
  const n = ctrl.length * sub;
  for (let i = 0; i < n; i++) out.push(f(i / n));
  return out;
}

// 二分查找累积表
function pickIndex(cum, R) {
  const t = R() * cum[cum.length - 1];
  let lo = 1, hi = cum.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < t) lo = m + 1; else hi = m; }
  return [lo, (t - cum[lo - 1]) / (cum[lo] - cum[lo - 1] || 1)];
}

// 沿任意 3D 曲线的管道：curve(u)->[x,y,z]，radius(u)->r；flat 压扁副法线方向
function makeTube(curve, radius, { segs = 160, flat = 1, byArea = true, up = null } = {}) {
  const P = [], Rr = [], T = [], Nn = [], B = [], cum = [0];
  for (let i = 0; i <= segs; i++) { P.push(curve(i / segs)); Rr.push(radius(i / segs)); }
  for (let i = 0; i <= segs; i++) T.push(norm3(sub3(P[Math.min(segs, i + 1)], P[Math.max(0, i - 1)])));
  let n0 = up ? norm3(sub3(up, mul3(T[0], dot3(up, T[0])))) : perpFrame(T[0])[0];
  Nn.push(n0); B.push(cross3(T[0], n0));
  for (let i = 1; i <= segs; i++) {
    const n = norm3(sub3(Nn[i - 1], mul3(T[i], dot3(Nn[i - 1], T[i]))));
    Nn.push(n); B.push(cross3(T[i], n));
  }
  let tot = 0;
  for (let i = 1; i <= segs; i++) {
    const L = len3(sub3(P[i], P[i - 1]));
    tot += L * (byArea ? (Rr[i] + Rr[i - 1]) * 0.5 + 0.002 : 1);
    cum.push(tot);
  }
  return (R, thFixed, rScale = 1) => {
    const [i, f] = pickIndex(cum, R);
    const p = lerp3(P[i - 1], P[i], f), r = lerp(Rr[i - 1], Rr[i], f) * rScale;
    const th = thFixed ?? R() * TAU, c = Math.cos(th), s = Math.sin(th);
    const n = Nn[i], b = B[i];
    return {
      p: [p[0] + (n[0] * c + b[0] * s * flat) * r, p[1] + (n[1] * c + b[1] * s * flat) * r, p[2] + (n[2] * c + b[2] * s * flat) * r],
      u: (i - 1 + f) / segs, th, r, center: p,
    };
  };
}

// 沿 x 轴的放样体（鱼身/鲸身）：prof(u) -> {x, yc, zc, ryT, ryB, rz}
// θ=0 为背部，θ=π 为腹部，θ=±π/2 为两侧
function makeLoft(prof, segs = 200) {
  const S = [], cum = [0];
  for (let i = 0; i <= segs; i++) S.push(prof(i / segs));
  let tot = 0;
  for (let i = 1; i <= segs; i++) {
    const a = S[i - 1], b = S[i];
    const L = Math.hypot(b.x - a.x, b.yc - a.yc, (b.zc || 0) - (a.zc || 0));
    tot += L * Math.PI * ((a.ryT + a.ryB) * 0.5 + a.rz + (b.ryT + b.ryB) * 0.5 + b.rz) * 0.5 + 1e-5;
    cum.push(tot);
  }
  return (R, thFixed) => {
    const [i, f] = pickIndex(cum, R);
    const u = (i - 1 + f) / segs, pr = prof(u);
    const th = thFixed ?? (R() * 2 - 1) * Math.PI;
    const c = Math.cos(th), s = Math.sin(th);
    return { p: [pr.x, pr.yc + (c > 0 ? pr.ryT : pr.ryB) * c, (pr.zc || 0) + pr.rz * s], u, th, pr };
  };
}

// 平面多边形内均匀采样，返回 [a, b, 离边界距离]
function makePoly(poly) {
  let minA = Infinity, maxA = -Infinity, minB = Infinity, maxB = -Infinity;
  for (const [a, b] of poly) { minA = Math.min(minA, a); maxA = Math.max(maxA, a); minB = Math.min(minB, b); maxB = Math.max(maxB, b); }
  const inside = (x, y) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  };
  const edge = (x, y) => {
    let d = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [x1, y1] = poly[j], [x2, y2] = poly[i];
      const dx = x2 - x1, dy = y2 - y1;
      const t = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1), 0, 1);
      d = Math.min(d, Math.hypot(x - x1 - dx * t, y - y1 - dy * t));
    }
    return d;
  };
  return (R) => {
    for (;;) {
      const a = lerp(minA, maxA, R()), b = lerp(minB, maxB, R());
      if (inside(a, b)) return [a, b, edge(a, b)];
    }
  };
}

// 由前缘 LE(a) 与后缘 TE(a) 定义的鳍面；返回 {p, a, b}，b 为从前缘到后缘的比例
function makeFin(LE, TE, segs = 64) {
  const cum = [0];
  let tot = 0;
  for (let i = 1; i <= segs; i++) {
    const a0 = (i - 1) / segs, a1 = i / segs;
    const chord = (len3(sub3(TE(a0), LE(a0))) + len3(sub3(TE(a1), LE(a1)))) * 0.5;
    const span = (len3(sub3(LE(a1), LE(a0))) + len3(sub3(TE(a1), TE(a0)))) * 0.5;
    tot += chord * span + 1e-6;
    cum.push(tot);
  }
  return (R) => {
    const [i, f] = pickIndex(cum, R);
    const a = (i - 1 + f) / segs, b = R();
    return { p: lerp3(LE(a), TE(a), b), a, b };
  };
}

// ---------- 点云容器 ----------
class Cloud {
  constructor() { this.pos = new Float32Array(N * 4); this.col = new Float32Array(N * 4); this.n = 0; }
  push(o) {
    const i = this.n++ * 4, p = o.p, c = o.c;
    this.pos[i] = p[0]; this.pos[i + 1] = p[1]; this.pos[i + 2] = p[2]; this.pos[i + 3] = o.a || 0;
    this.col[i] = c[0]; this.col[i + 1] = c[1]; this.col[i + 2] = c[2]; this.col[i + 3] = o.s ?? 1;
  }
}
// 动作通道：分组 g（整数）+ 权重 w（0..1）
const anim = (g, w) => g + clamp(w, 0, 0.999);

function realize(spec, R) {
  const cloud = new Cloud();
  const total = spec.parts.reduce((s, p) => s + p[0], 0);
  let acc = 0;
  spec.parts.forEach(([w, fn], k) => {
    acc += w;
    const target = k === spec.parts.length - 1 ? N : Math.round((acc / total) * N);
    while (cloud.n < target) cloud.push(fn(R));
  });
  if (spec.fit) {
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < N; i++) for (let d = 0; d < 3; d++) {
      const v = cloud.pos[i * 4 + d]; if (v < mn[d]) mn[d] = v; if (v > mx[d]) mx[d] = v;
    }
    const ext = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]);
    const s = spec.fit / ext, c = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    for (let i = 0; i < N; i++) for (let d = 0; d < 3; d++) cloud.pos[i * 4 + d] = (cloud.pos[i * 4 + d] - c[d]) * s;
  }
  // 打乱：保证任意前缀子集都是均匀抽样（便于按设备性能裁剪粒子数），也让变形时粒子随机配对
  for (let i = N - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    for (let d = 0; d < 4; d++) {
      let t = cloud.pos[i * 4 + d]; cloud.pos[i * 4 + d] = cloud.pos[j * 4 + d]; cloud.pos[j * 4 + d] = t;
      t = cloud.col[i * 4 + d]; cloud.col[i * 4 + d] = cloud.col[j * 4 + d]; cloud.col[j * 4 + d] = t;
    }
  }
  for (let i = 0; i < N; i++) for (let d = 0; d < 3; d++) cloud.col[i * 4 + d] = toLin(clamp(cloud.col[i * 4 + d], 0, 1));
  return cloud;
}

// =====================================================================
// 0 · 海面（首页）：夜海中的“蓝眼泪”波浪
// =====================================================================
function ocean(R) {
  const cols = 250, rows = 160;
  let k = 0;
  const deep = ['#376392', '#497DAE', '#6C9AC4', '#9FBDDA'].map(hex);
  const lav = hex('#b9b3da'), aqua = hex('#a3d6d4'), foam = hex('#E8EEF6'), rose = hex('#dcb5cc');
  return {
    fit: 0,
    parts: [[1, () => {
      const i = k % cols, j = Math.floor(k / cols) % rows; k++;
      const x = lerp(-16, 16, i / (cols - 1)) + (R() - 0.5) * 0.06;
      const z = lerp(-34, 6.5, j / (rows - 1)) + (R() - 0.5) * 0.06;
      let c = ramp(deep, fbm(x * 0.11, 0.3, z * 0.11));
      const r = R();
      if (r < 0.08) c = mixc(c, lav, 0.75);
      else if (r < 0.15) c = mixc(c, aqua, 0.8);
      else if (r < 0.18) c = foam;
      else if (r < 0.2) c = mixc(c, rose, 0.7);
      return { p: [x, -2.3, z], c, s: 0.8 + R() * 0.5, a: anim(0, 1) };
    }]],
  };
}

// =====================================================================
// 1 · 珊瑚礁：鹿角珊瑚 + 脑珊瑚 + 柳珊瑚扇 + 桌形珊瑚 + 海葵
// =====================================================================
function coral(R) {
  const sand = hex('#c4b394'), rubble = hex('#ab9fbb');
  const pinkC = hex('#eaa8a4'), peach = hex('#f3c6a3'), tip = hex('#fdeadb'), lilacB = hex('#d2b2db');
  const mint = hex('#a8d0b6'), sage = hex('#9db88f'), cream = hex('#eee6c6');
  const fanCols = ['#c9a4d9', '#e6aac5', '#b8b6e2', '#dcb0d6'].map(hex);
  const gold = hex('#e8d39b'), sage2 = hex('#bccd9d');
  const aq = hex('#9fd8d0'), rose = hex('#f2b6c9');
  const pastel = ['#9FBDDA', '#CCDBEB', '#a7d9d3', '#c8b7e3', '#edb9c9', '#efdcae'].map(hex);

  // 鹿角珊瑚：递归分枝
  const br = [];
  const grow = (p, d, len, r, depth) => {
    const e = add3(p, mul3(d, len));
    br.push({ a: p, b: e, r0: r, r1: r * 0.74, depth, d });
    if (depth === 4) return;
    const kids = depth === 0 ? 3 : 2;
    for (let k = 0; k < kids; k++) {
      const nd = norm3([d[0] + (R() - 0.5) * 1.25, d[1] + 0.3 + R() * 0.25, d[2] + (R() - 0.5) * 1.25]);
      grow(e, nd, len * (0.72 + R() * 0.12), r * 0.74, depth + 1);
    }
  };
  for (let k = 0; k < 3; k++) {
    const a = (k * TAU) / 3 + R();
    grow([1.15 + Math.cos(a) * 0.28, -1.62, -0.15 + Math.sin(a) * 0.28], norm3([Math.cos(a) * 0.5, 1, Math.sin(a) * 0.5]), 0.75, 0.13, 0);
  }
  const brCum = [0];
  br.forEach((b) => brCum.push(brCum[brCum.length - 1] + len3(sub3(b.b, b.a)) * (b.r0 + b.r1)));
  const brTint = br.map(() => (R() < 0.18 ? lilacB : null));

  // 柳珊瑚扇：平面分枝网络
  const fan = [];
  const growFan = (p, ang, len, depth) => {
    ang = clamp(ang, -1.3, 1.3);
    const e = [p[0] + Math.sin(ang) * len, p[1] + Math.cos(ang) * len];
    fan.push({ a: p, b: e, depth });
    if (depth >= 7) return;
    const sp = 0.32 + R() * 0.22;
    growFan(e, ang - sp * (0.5 + R() * 0.7), len * 0.8, depth + 1);
    if (R() < 0.88) growFan(e, ang + sp * (0.5 + R() * 0.7), len * 0.8, depth + 1);
  };
  growFan([0, 0], 0, 0.45, 0);
  let fmn = Infinity, fmx = -Infinity, fh = 0;
  fan.forEach((f) => { fmn = Math.min(fmn, f.b[0]); fmx = Math.max(fmx, f.b[0]); fh = Math.max(fh, f.b[1]); });
  const fanS = 2.7 / Math.max(fmx - fmn, fh), fanCx = (fmn + fmx) / 2;
  const fanCum = [0];
  fan.forEach((f) => fanCum.push(fanCum[fanCum.length - 1] + Math.hypot(f.b[0] - f.a[0], f.b[1] - f.a[1]) * (1.2 - f.depth * 0.1)));
  const fanPos = (x, y) => {
    const X = (x - fanCx) * fanS, Y = y * fanS;
    return [-0.45 + X, -1.55 + Y, -1.05 + 0.22 * (X / 1.35) ** 2];
  };

  const T = [2.45, -0.3, 0.75];
  const tubeStalk = makeTube((u) => [T[0], lerp(-1.65, T[1] - 0.04, u), T[2]], (u) => lerp(0.2, 0.14, u), { segs: 20 });
  const A = [0.3, -1.48, 1.25];
  const tent = [];
  for (let k = 0; k < 46; k++) {
    const ring = k < 26 ? 0.25 : 0.14, phi = (k * TAU) / (k < 26 ? 26 : 20) + (k < 26 ? 0 : 0.15);
    tent.push({ phi, ring, L: 0.5 + R() * 0.3 });
  }

  return {
    fit: 7,
    parts: [
      [12, () => { // 礁石底座
        let x, z;
        do { x = (R() * 2 - 1) * 3.7; z = (R() * 2 - 1) * 1.8; } while ((x / 3.7) ** 2 + (z / 1.8) ** 2 > 1);
        const n = fbm(x * 1.4, 0, z * 1.4);
        const y = -1.75 + 0.3 * (1 - (x / 3.7) ** 2 - (z / 1.8) ** 2) + 0.18 * (n - 0.5);
        return { p: [x, y, z], c: dim(mixc(sand, rubble, n), 0.72), s: 0.75, a: 0 };
      }],
      [14, () => { // 脑珊瑚
        let d; do { d = onSphere(R); } while (d[1] < -0.12);
        const m = Math.sin(9 * (d[0] + 0.35 * Math.sin(5 * d[2])) + 7 * Math.sin(3 * d[2] + 2 * d[1]));
        const rr = 0.95 * (1 + 0.045 * m), ridge = m > 0.3;
        return {
          p: [-2.1 + d[0] * rr * 1.05, -1.45 + d[1] * rr * 0.82, 0.45 + d[2] * rr],
          c: ridge ? mixc(cream, mint, R() * 0.4) : mixc(sage, mint, R()), s: ridge ? 1.1 : 0.8, a: 0,
        };
      }],
      [26, () => { // 鹿角珊瑚
        const [i] = pickIndex(brCum, R);
        const b = br[i - 1], t = R();
        const [n1, n2] = perpFrame(b.d), th = R() * TAU, r = lerp(b.r0, b.r1, t);
        const c0 = lerp3(b.a, b.b, t);
        const p = add3(c0, add3(mul3(n1, Math.cos(th) * r), mul3(n2, Math.sin(th) * r)));
        const isTip = b.depth === 4 && t > 0.78;
        let c = mixc(pinkC, peach, b.depth / 4 + (R() - 0.5) * 0.3);
        if (brTint[i - 1]) c = mixc(c, brTint[i - 1], 0.7);
        if (isTip) c = mixc(c, tip, 0.8);
        return { p, c, s: isTip ? 1.45 : 0.95, a: anim(1, (p[1] + 1.6) / 3) };
      }],
      [22, () => { // 柳珊瑚扇
        if (R() < 0.72) {
          const [i] = pickIndex(fanCum, R);
          const f = fan[i - 1], t = R();
          const x = lerp(f.a[0], f.b[0], t) + gauss(R) * 0.004, y = lerp(f.a[1], f.b[1], t) + gauss(R) * 0.004;
          const p = fanPos(x, y);
          p[2] += gauss(R) * 0.012;
          const c = mixc(fanCols[f.depth % 4], fanCols[(f.depth + 1) % 4], R());
          return { p, c, s: f.depth > 5 ? 1.05 : 0.9, a: anim(2, (p[1] + 1.55) / 2.8) };
        }
        let x, y;
        do { x = (R() * 2 - 1) * 1.35; y = R() * 2.6; } while ((x / 1.35) ** 2 + ((y - 1.3) / 1.3) ** 2 > 1);
        const p = [-0.45 + x, -1.55 + y, -1.05 + 0.22 * (x / 1.35) ** 2 + gauss(R) * 0.01];
        return { p, c: dim(pick(R, fanCols), 0.55), s: 0.55, a: anim(2, y / 2.8) };
      }],
      [10, () => { // 桌形珊瑚
        if (R() < 0.15) {
          const o = tubeStalk(R);
          return { p: o.p, c: dim(sage2, 0.7), s: 0.8, a: 0 };
        }
        const rr = 1.05 * Math.sqrt(R()), th = R() * TAU, under = R() < 0.25;
        const rib = Math.pow(Math.abs(Math.cos(th * 36 + rr * 3)), 6);
        const y = T[1] + 0.08 * (1 - (rr / 1.05) ** 2) + (rr > 0.95 ? 0.06 : 0) - (under ? 0.07 : 0);
        let c = mixc(gold, sage2, fbm(rr * 3, th, 1));
        c = mixc(c, cream, rib * 0.6);
        return { p: [T[0] + Math.cos(th) * rr, y, T[2] + Math.sin(th) * rr], c: under ? dim(c, 0.55) : c, s: rib > 0.6 ? 1.05 : 0.85, a: 0 };
      }],
      [10, () => { // 海葵
        if (R() < 0.18) {
          const th = R() * TAU, h = R() * 0.32;
          return { p: [A[0] + Math.cos(th) * 0.24, A[1] + h, A[2] + Math.sin(th) * 0.24], c: dim(rose, 0.75), s: 0.85, a: 0 };
        }
        const tt = pick(R, tent), v = R();
        const out = [Math.cos(tt.phi), 0, Math.sin(tt.phi)];
        const S = [A[0] + out[0] * tt.ring, A[1] + 0.32, A[2] + out[2] * tt.ring];
        const dir = norm3([out[0] * 0.85, 1, out[2] * 0.85]);
        const p = add3(add3(S, mul3(dir, tt.L * v)), [out[0] * 0.16 * v * v, -0.14 * v * v, out[2] * 0.16 * v * v]);
        p[0] += gauss(R) * 0.012; p[2] += gauss(R) * 0.012;
        const isTip = v > 0.85;
        return { p, c: isTip ? rose : mixc(aq, rose, v * 0.5), s: isTip ? 1.4 : 0.9, a: anim(3, v) };
      }],
      [6, () => { // 浮游微光
        const p = [(R() * 2 - 1) * 3.6, -0.6 + R() * 3.2, (R() * 2 - 1) * 1.6];
        return { p, c: pick(R, pastel), s: 0.5 + R() * 0.7, a: anim(4, R()) };
      }],
    ],
  };
}

// =====================================================================
// 2 · 海星
// =====================================================================
function starfish(R) {
  const RA = 2.6;
  const apricot = hex('#efb58d'), salmon = hex('#e99b8b'), cream = hex('#f8e2c6'), rose = hex('#eba0b6');
  const lilac = hex('#cbaada'), sandC = hex('#cfbc9f'), under = hex('#e9cba9'), eye = hex('#f3a7a7');
  const angs = [], bend = [], curl = [];
  for (let k = 0; k < 5; k++) { angs.push(-Math.PI / 2 + (k * TAU) / 5); bend.push((R() - 0.5) * 0.55); curl.push((R() - 0.3) * 0.7); }
  const W = (d) => lerp(0.58, 0.07, Math.pow(d / RA, 0.85));
  const H = (d) => lerp(0.44, 0.07, Math.pow(d / RA, 0.8));
  const place = (k, d, l, y) => {
    const t = d / RA, ang = angs[k] + bend[k] * t * t;
    return [Math.cos(ang) * d - Math.sin(ang) * l, y + curl[k] * t * t * t, Math.sin(ang) * d + Math.cos(ang) * l];
  };
  // 五条腕在中央盘重叠，靠近中心时按比例拒绝采样，避免中心过曝
  const sampleD = () => { let d; do { d = R() * RA; } while (R() > W(d) / W(0) || (d < 0.6 && R() > 0.22 + d * 0.9)); return d; };
  return {
    fit: 5.8,
    parts: [
      [74, () => { // 背面
        const k = Math.floor(R() * 5), d = sampleD(), w = W(d), l = (R() * 2 - 1) * w, ln = l / w, t = d / RA;
        const cd = fract(d / 0.23) - 0.5, cl = fract((ln + 1) * 1.6) - 0.5;
        const knob = Math.exp(-(cd * cd + cl * cl) * 28) * (1 - t * 0.6);
        const p = place(k, d, l, H(d) * Math.sqrt(Math.max(0, 1 - ln * ln)) + knob * 0.06);
        let c = mixc(apricot, salmon, fbm(p[0] * 1.3, p[1], p[2] * 1.3));
        if (knob > 0.55) c = mixc(c, cream, 0.75);
        if (t > 0.86) c = mixc(c, rose, ((t - 0.86) / 0.14) * 0.85);
        if (d < 0.55) {
          const star = Math.cos(5 * Math.atan2(p[2], p[0]) + Math.PI / 2);
          if (star * (1 - d / 0.55) > 0.25) c = mixc(c, lilac, 0.65);
        }
        return { p, c, s: knob > 0.55 ? 1.3 : 0.9, a: anim(1, t) };
      }],
      [12, () => { // 腹面与管足
        const k = Math.floor(R() * 5), d = sampleD(), w = W(d), l = (R() * 2 - 1) * w, t = d / RA;
        const feet = Math.abs(l / w) < 0.25 && fract(d / 0.08) < 0.4;
        const p = place(k, d, l, -0.05 - R() * 0.03);
        return { p, c: feet ? cream : dim(under, 0.6), s: feet ? 1.0 : 0.7, a: anim(1, t) };
      }],
      [0.6, () => { // 腕端眼点
        const k = Math.floor(R() * 5), o = onSphere(R);
        const p = place(k, RA - 0.02, 0, 0.06);
        return { p: add3(p, mul3(o, 0.05)), c: eye, s: 1.7, a: anim(1, 0.999) };
      }],
      [1, () => { // 筛板
        const a = angs[0] + Math.PI / 5, r = Math.sqrt(R()) * 0.075, th = R() * TAU;
        return { p: [Math.cos(a) * 0.32 + Math.cos(th) * r, 0.4, Math.sin(a) * 0.32 + Math.sin(th) * r], c: cream, s: 1.4, a: 0 };
      }],
      [11, () => { // 沙地
        const r = 2.0 + Math.sqrt(R()) * 1.6, th = R() * TAU;
        const x = Math.cos(th) * r, z = Math.sin(th) * r;
        return { p: [x, -0.14 + (fbm(x, 0, z) - 0.5) * 0.12, z], c: dim(sandC, 0.42), s: 0.6, a: 0 };
      }],
    ],
  };
}

// =====================================================================
// 3 · 海马（附一根海草）
// =====================================================================
function seahorse(R) {
  const gold = hex('#e9c791'), amber = hex('#dcaa79'), peach = hex('#f1bea2'), cream = hex('#f7e7c8');
  const lilacS = hex('#cfb7da'), white = hex('#fcf4e7'), finC = hex('#efd3b0'), grass = hex('#a9c49b'), grass2 = hex('#c0d1a0');
  const ctrl = [[0.10, 2.20, 0], [0.00, 1.80, 0], [0.12, 1.30, 0], [0.32, 0.75, 0], [0.38, 0.15, 0], [0.22, -0.45, 0], [0.00, -0.95, 0],
    [-0.10, -1.45, 0], [0.00, -1.90, 0], [0.30, -2.12, 0], [0.55, -1.98, 0], [0.58, -1.70, 0], [0.42, -1.55, 0], [0.28, -1.66, 0]];
  const rad = profile([[0, 0.25], [0.08, 0.27], [0.2, 0.38], [0.3, 0.45], [0.4, 0.38], [0.5, 0.25], [0.6, 0.17], [0.7, 0.12], [0.85, 0.075], [1, 0.03]]);
  const body = makeTube(spline(ctrl), rad, { segs: 260, flat: 0.8, up: [-1, 0, 0] });
  const snout = makeTube((u) => [lerp(0.5, 1.2, u), lerp(2.36, 2.24, u), 0], (u) => (u > 0.85 ? lerp(0.08, 0.105, (u - 0.85) / 0.15) : 0.08), { segs: 30 });
  const dorsal = makePoly(smoothPoly([[0.0, 0.2], [-0.32, 0.18], [-0.5, 0.0], [-0.52, -0.25], [-0.4, -0.48], [-0.08, -0.55]], 8));
  const pect = makePoly(smoothPoly([[0, 0.06], [-0.16, 0.12], [-0.22, 0.0], [-0.15, -0.11], [0, -0.06]], 8));
  return {
    fit: 5.6,
    parts: [
      [50, () => {
        const o = body(R);
        const ring = Math.pow(Math.abs(Math.cos(o.u * Math.PI * 42)), 12);
        const p = add3(o.center, mul3(sub3(o.p, o.center), 1 + 0.07 * ring));
        let c = mixc(gold, amber, fbm(p[0] * 2, p[1] * 2, p[2] * 2));
        c = mixc(c, cream, ring * 0.7);
        const r = R();
        if (r < 0.04) c = white; else if (r < 0.1) c = mixc(c, lilacS, 0.6);
        return { p, c, s: r < 0.04 ? 1.35 : ring > 0.6 ? 1.1 : 0.9, a: anim(1, smooth(0.55, 1, o.u)) };
      }],
      [12, () => { // 头部
        const d = onSphere(R);
        let p = [d[0] * 0.37, d[1] * 0.27, d[2] * 0.22];
        p = rotZ(p, -0.2);
        p = add3(p, [0.24, 2.43, 0]);
        return { p, c: mixc(gold, peach, R() * 0.7), s: 0.95, a: 0 };
      }],
      [6, () => { const o = snout(R); return { p: o.p, c: o.u > 0.9 ? cream : mixc(gold, peach, o.u), s: 0.9, a: 0 }; }],
      [2.5, () => { // 冠
        const k = Math.floor(R() * 5), a = (k / 5) * TAU, h = R(), th = R() * TAU;
        const base = [0.1 + Math.cos(a) * 0.08, 2.66, Math.sin(a) * 0.08];
        const r = 0.045 * (1 - h);
        return { p: [base[0] + Math.cos(th) * r, base[1] + h * 0.15, base[2] + Math.sin(th) * r], c: cream, s: 1.1, a: 0 };
      }],
      [1.5, () => { // 眼
        const side = R() < 0.5 ? 1 : -1, r = lerp(0.03, 0.065, Math.sqrt(R())), th = R() * TAU;
        return { p: [0.36 + Math.cos(th) * r, 2.5 + Math.sin(th) * r, side * 0.21], c: r < 0.04 ? dim(white, 0.5) : white, s: 1.3, a: 0 };
      }],
      [9, () => { // 背鳍
        const [x, y] = dorsal(R);
        const ang = Math.atan2(y + 0.18, x - 0.05);
        const ray = Math.pow(Math.abs(Math.cos(ang * 14)), 10);
        return { p: [x, y, gauss(R) * 0.01], c: ray > 0.5 ? finC : dim(finC, 0.5), s: ray > 0.5 ? 1.0 : 0.6, a: anim(2, clamp(-x / 0.52, 0, 1)) };
      }],
      [3, () => { // 胸鳍
        const side = R() < 0.5 ? 1 : -1, [a, b] = pect(R);
        return { p: [-0.02 + a * 0.8, 2.02 + b, side * (0.24 - a * 0.35)], c: dim(finC, 0.8), s: 0.7, a: anim(2, -a / 0.22) };
      }],
      [8, () => { // 海草
        const y = lerp(-2.7, 0.9, R()), l = (R() * 2 - 1);
        const x = 0.3 + 0.07 * Math.sin((y + 1.85) * 1.3) + l * 0.07 * Math.cos(y * 0.9);
        return { p: [x, y, -0.32 + l * 0.05 * Math.sin(y * 0.9)], c: dim(mixc(grass, grass2, R()), 0.85), s: 0.8, a: anim(3, (y + 2.7) / 3.6) };
      }],
    ],
  };
}

// =====================================================================
// 4 · 鲎
// =====================================================================
function horseshoe(R) {
  const amber = hex('#cba571'), ochre = hex('#ba935f'), olive = hex('#a89c6e'), sandR = hex('#dfc99f');
  const ridgeC = hex('#ead7ad'), eyeC = hex('#b2e2df'), seam = hex('#a8d9d7'), telC = hex('#d6b583');
  const xb = (z) => -0.25 + 0.38 * (1 - (z / 1.75) ** 2);
  const inPro = (x, z) => ((x + 0.15) / 1.85) ** 2 + (z / 1.75) ** 2 <= 1 && x >= xb(z);
  const Wo = (x) => lerp(1.12, 0.42, clamp((0.05 - x) / 1.55, 0, 1));
  const genal = makePoly([[-0.05, 1.18], [0.05, 1.68], [-0.85, 1.62]]);
  const telson = makeTube((u) => [lerp(-1.45, -3.95, u), 0.08 + 0.14 * Math.sin(Math.PI * u) - 0.18 * u, 0], (u) => 0.085 * Math.pow(1 - u, 0.6) + 0.012, { segs: 60, flat: 0.7 });
  const spinesX = [-0.3, -0.48, -0.66, -0.84, -1.02, -1.2];
  return {
    fit: 6.3,
    parts: [
      [48, () => { // 头胸甲
        let x, z;
        do { x = lerp(-0.25, 1.7, R()); z = (R() * 2 - 1) * 1.75; } while (!inPro(x, z));
        const rho = Math.sqrt(((x + 0.15) / 1.85) ** 2 + (z / 1.75) ** 2);
        let h = 0.62 * Math.pow(Math.max(0, 1 - rho * rho), 0.55);
        const med = Math.exp(-((z / 0.1) ** 2)) * (x < 1.25 ? 1 : 0);
        const zr = 0.78 + 0.05 * x, lat = Math.exp(-(((Math.abs(z) - zr) / 0.08) ** 2)) * (x > -0.1 && x < 1.0 ? 1 : 0);
        h += 0.07 * med + 0.05 * lat;
        const eyeD = ((x - 0.38) / 0.17) ** 2 + ((Math.abs(z) - 0.8) / 0.08) ** 2;
        const ocel = ((x - 1.05) / 0.05) ** 2 + ((Math.abs(z) - 0.05) / 0.04) ** 2;
        let c = ramp([amber, ochre, olive], fbm(x * 1.5, 0, z * 1.5));
        let s = 0.9;
        if (med > 0.5 || lat > 0.5) c = mixc(c, ridgeC, 0.7);
        if (rho > 0.93) c = mixc(c, sandR, 0.75);
        if (eyeD < 1) { c = eyeC; s = 1.5; h += 0.03; }
        if (ocel < 1) { c = eyeC; s = 1.4; }
        return { p: [x, h, z], c, s, a: 0 };
      }],
      [4, () => { // 颊刺
        const side = R() < 0.5 ? 1 : -1, [a, b] = genal(R);
        return { p: [a, 0.03 + gauss(R) * 0.01, side * b], c: mixc(ochre, sandR, 0.4), s: 0.85, a: 0 };
      }],
      [25, () => { // 后体
        let x, z;
        do { x = lerp(-1.5, 0.1, R()); z = (R() * 2 - 1) * 1.15; } while (Math.abs(z) > Wo(x) || x > xb(z) + 0.06);
        const zn = z / Wo(x);
        let h = 0.36 * Math.pow(Math.max(0, 1 - zn * zn), 0.6) * lerp(1, 0.55, clamp((0.05 - x) / 1.55, 0, 1));
        const med = Math.exp(-((z / 0.08) ** 2));
        h += 0.06 * med;
        let c = ramp([ochre, amber, olive], fbm(x * 1.7 + 4, 0, z * 1.7));
        if (med > 0.5) c = mixc(c, ridgeC, 0.6);
        if (Math.abs(x - xb(z)) < 0.05) c = seam;
        if (Math.abs(zn) > 0.9) c = mixc(c, sandR, 0.6);
        return { p: [x, h, z], c, s: Math.abs(x - xb(z)) < 0.05 ? 1.3 : 0.9, a: anim(1, clamp(-x / 1.5, 0, 1)) };
      }],
      [4, () => { // 侧缘活动刺
        const side = R() < 0.5 ? 1 : -1, x0 = pick(R, spinesX), t = R(), w = Wo(x0);
        const p = [x0 - 0.12 * t, 0.02, side * (w + 0.3 * t)];
        return { p: add3(p, mul3(onSphere(R), 0.025 * (1 - t))), c: sandR, s: 0.9, a: anim(1, clamp(-x0 / 1.5, 0, 1)) };
      }],
      [13, () => { // 尾剑
        const o = telson(R);
        return { p: o.p, c: mixc(telC, sandR, o.u), s: 0.9, a: anim(2, o.u) };
      }],
      [6, () => { // 甲缘厚度
        const th = R() * Math.PI - Math.PI / 2;
        const x = -0.15 + 1.85 * Math.cos(th) * 0.995, z = 1.75 * Math.sin(th) * 0.995;
        if (x < xb(z)) return { p: [xb(z), R() * 0.05, z], c: dim(sandR, 0.8), s: 0.8, a: 0 };
        return { p: [x, -R() * 0.08, z], c: dim(sandR, 0.85), s: 0.8, a: 0 };
      }],
    ],
  };
}

// =====================================================================
// 5 · 海龟（绿海龟）
// =====================================================================
function turtle(R) {
  const plates = ['#b6a376', '#aa9365', '#c5b184', '#a0af8b', '#b99b7b'].map(hex);
  const seamC = hex('#f0e4c5'), light = hex('#e3cf9d'), plastron = hex('#eadeb9');
  const skin = hex('#b9ab7c'), skin2 = hex('#a6ae88'), scaleEdge = hex('#efe2bd'), eyeC = hex('#f4f0e2');
  const centers = [];
  [0.88, 0.45, 0.02, -0.42, -0.85].forEach((x) => centers.push([x, 0]));
  [0.62, 0.2, -0.24, -0.66].forEach((x) => { centers.push([x, 0.56]); centers.push([x, -0.56]); });
  const plateCol = centers.map(() => pick(R, plates));
  const taper = (x) => 1 - 0.2 * smooth(-0.2, -1.45, x);
  // 前鳍肢：桨状，中段最宽，向后掠
  const frontLE = (side) => (a) => [0.82 - 0.95 * a + 0.22 * Math.sin(Math.PI * a), -0.02 - 0.2 * a, side * (0.8 + 1.7 * a)];
  const fChord = (a) => lerp(0.42, 0.07, a) + 0.2 * Math.sin(Math.PI * a);
  const frontTE = (side) => (a) => { const p = frontLE(side)(a); return [p[0] - fChord(a), p[1] - 0.02, p[2] - side * 0.06 * Math.sin(Math.PI * a)]; };
  const finF = [makeFin(frontLE(1), frontTE(1)), makeFin(frontLE(-1), frontTE(-1))];
  const rearLE = (side) => (a) => [-1.0 - 0.45 * a, -0.06, side * (0.56 + 0.42 * a)];
  const rearTE = (side) => (a) => [-1.28 - 0.25 * a, -0.06, side * (0.42 + 0.5 * a)];
  const finR = [makeFin(rearLE(1), rearTE(1)), makeFin(rearLE(-1), rearTE(-1))];
  const neck = makeTube((u) => [lerp(0.95, 1.5, u), lerp(0.0, 0.08, u), 0], (u) => lerp(0.27, 0.22, u), { segs: 20, flat: 1.1 });
  const scalePat = (p, f) => Math.abs(Math.sin(p[0] * f) * Math.sin(p[2] * f + p[1] * f * 0.7)) < 0.18;
  return {
    fit: 5.8,
    parts: [
      [44, () => { // 背甲
        const d = onSphere(R); d[1] = Math.abs(d[1]);
        const x = -0.1 + 1.35 * d[0], z = 1.0 * d[2] * taper(x), y = 0.58 * Math.pow(d[1], 0.9);
        let c, s = 0.9;
        if (d[1] < 0.2) {
          const seg = Math.floor(((Math.atan2(z, x) + Math.PI) / TAU) * 26);
          const segEdge = fract(((Math.atan2(z, x) + Math.PI) / TAU) * 26) < 0.12;
          c = segEdge ? seamC : seg % 2 ? plates[0] : plates[2];
          if (segEdge) s = 1.1;
        } else {
          let d1 = Infinity, d2 = Infinity, k1 = 0;
          centers.forEach(([cx, cz], k) => {
            const dd = Math.hypot(x - cx, z - cz * taper(x));
            if (dd < d1) { d2 = d1; d1 = dd; k1 = k; } else if (dd < d2) d2 = dd;
          });
          const [cx, cz] = centers[k1];
          const streak = 0.5 + 0.5 * Math.sin(Math.atan2(z - cz, x - cx) * 7 + fbm(x * 3, 0, z * 3) * 4);
          c = mixc(plateCol[k1], light, streak * 0.45);
          if (d2 - d1 < 0.055) { c = seamC; s = 1.1; }
        }
        return { p: [x, y, z], c, s, a: 0 };
      }],
      [7, () => { // 腹甲
        const d = onSphere(R); d[1] = -Math.abs(d[1]);
        const x = -0.1 + 1.25 * d[0], z = 0.9 * d[2] * taper(x);
        return { p: [x, 0.2 * d[1] - 0.02, z], c: dim(plastron, 0.7), s: 0.8, a: 0 };
      }],
      [9, () => { // 头颈
        if (R() < 0.4) { const o = neck(R); return { p: o.p, c: dim(skin, 0.9), s: 0.9, a: anim(3, 0.5) }; }
        const d = onSphere(R);
        const p = [1.78 + d[0] * 0.42 * (d[0] > 0 ? 0.9 : 1), 0.12 + d[1] * 0.25, d[2] * 0.27];
        const eyeD = Math.min(Math.hypot(p[0] - 1.9, p[1] - 0.2, p[2] - 0.21), Math.hypot(p[0] - 1.9, p[1] - 0.2, p[2] + 0.21));
        if (eyeD < 0.07) return { p, c: eyeC, s: 1.5, a: anim(3, 1) };
        return { p, c: scalePat(p, 16) ? scaleEdge : mixc(skin, skin2, R()), s: 0.9, a: anim(3, 1) };
      }],
      [28, () => { // 前鳍肢
        const side = R() < 0.5 ? 0 : 1, o = finF[side](R);
        const p = o.p; p[1] += gauss(R) * 0.015;
        const edge = o.b < 0.08;
        let c = scalePat(p, 13) ? scaleEdge : mixc(skin, skin2, fbm(p[0] * 3, 0, p[2] * 3));
        if (edge) c = scaleEdge;
        return { p, c, s: edge ? 1.15 : 0.9, a: anim(1, o.a) };
      }],
      [8, () => { // 后鳍肢
        const side = R() < 0.5 ? 0 : 1, o = finR[side](R);
        const p = o.p; p[1] += gauss(R) * 0.012;
        return { p, c: o.b < 0.1 ? scaleEdge : mixc(skin, skin2, R()), s: 0.85, a: anim(2, o.a) };
      }],
      [4, () => { // 甲缘厚度 + 尾
        if (R() < 0.15) { const t = R(); return { p: [-1.38 - 0.25 * t, -0.04, gauss(R) * 0.05 * (1 - t)], c: skin, s: 0.8, a: 0 }; }
        const th = R() * TAU, x = -0.1 + 1.35 * Math.cos(th), z = Math.sin(th) * taper(x);
        return { p: [x, (R() - 0.6) * 0.1, z], c: dim(seamC, 0.85), s: 0.85, a: 0 };
      }],
    ],
  };
}

// =====================================================================
// 6 · 魔鬼鱼（巨型蝠鲼）
// =====================================================================
function manta(R) {
  const SP = 3.5;
  const xle = (s) => 0.9 - 2.05 * Math.pow(s, 1.5), xte = (s) => -1.4 + 0.5 * s - 0.25 * s * s;
  const chord = (s) => xle(s) - xte(s);
  const T = (s) => 0.42 * Math.pow(1 - s, 2.2) + 0.02;
  const dorsalCols = ['#376392', '#497DAE', '#8f8bab', '#7b8197'].map(hex);
  const patch = hex('#E8EEF6'), patch2 = hex('#CCDBEB'), edgeC = hex('#9FBDDA');
  const belly = hex('#eef1f5'), spot = hex('#8d93a6'), gill = hex('#f2e8ee'), lobe = hex('#a9a6c6');
  const lobeTube = [1, -1].map((side) => makeTube(spline([[0.82, 0, side * 0.46], [1.22, -0.05, side * 0.5], [1.55, -0.2, side * 0.36]]), (u) => lerp(0.1, 0.06, u), { segs: 40, flat: 0.45 }));
  const tail = makeTube((u) => [lerp(-1.35, -3.3, u), -0.1 * u, 0], (u) => lerp(0.045, 0.008, u), { segs: 50 });
  const sampleS = () => { let s; do { s = R(); } while (R() > chord(s) / chord(0)); return s; };
  return {
    fit: 6.8,
    parts: [
      [62, () => { // 背面
        const s = sampleS(), xc = R(), side = R() < 0.5 ? 1 : -1;
        const x = xte(s) + xc * chord(s), z = side * s * SP;
        const camber = -0.12 * s * s + 0.05 * Math.sin(Math.PI * xc) * (1 - s);
        const y = camber + (T(s) * Math.pow(Math.sin(Math.PI * xc), 0.7)) / 2;
        let c = ramp(dorsalCols, fbm(x * 0.9, 1, z * 0.9));
        let sz = 0.9;
        const pd = ((s - 0.27) / 0.16) ** 2 + ((xc - 0.72) / 0.2) ** 2;
        if (pd < 1) c = mixc(patch, patch2, R());
        else if (pd < 1.3) c = mixc(c, patch2, 0.5);
        if (xc > 0.93) { c = edgeC; sz = 1.1; }
        return { p: [x, y, z], c, s: sz, a: anim(1, s) };
      }],
      [24, () => { // 腹面
        const s = sampleS(), xc = R(), side = R() < 0.5 ? 1 : -1;
        const x = xte(s) + xc * chord(s), z = side * s * SP;
        const camber = -0.12 * s * s + 0.05 * Math.sin(Math.PI * xc) * (1 - s);
        const y = camber - (T(s) * Math.pow(Math.sin(Math.PI * xc), 0.7)) / 2;
        const sp = fbm(x * 3.2, 5, z * 3.2) > 0.68;
        return { p: [x, y, z], c: sp ? spot : belly, s: 0.85, a: anim(1, s) };
      }],
      [3, () => { // 腹面鳃裂
        const side = R() < 0.5 ? 1 : -1, k = Math.floor(R() * 5), t = R();
        const x = 0.62 - k * 0.11 - 0.05 * t, z = side * (0.24 + 0.24 * t);
        return { p: [x, -0.24, z], c: gill, s: 1.2, a: anim(1, Math.abs(z) / SP) };
      }],
      [4, () => { // 头鳍
        const side = R() < 0.5 ? 0 : 1, o = lobeTube[side](R);
        return { p: o.p, c: mixc(lobe, edgeC, o.u), s: 0.95, a: anim(2, o.u) };
      }],
      [1.5, () => { // 口缘与眼
        if (R() < 0.6) { const z = (R() * 2 - 1) * 0.4; return { p: [0.92 + 0.02 * gauss(R), -0.03, z], c: patch, s: 1.2, a: 0 }; }
        const side = R() < 0.5 ? 1 : -1, o = onSphere(R);
        return { p: add3([0.72, 0.06, side * 0.52], mul3(o, 0.045)), c: patch, s: 1.4, a: 0 };
      }],
      [3, () => { const o = tail(R); return { p: o.p, c: dim(edgeC, 0.85), s: 0.8, a: anim(3, o.u) }; }],
      [1.5, () => { // 尾基小背鳍
        const t = R(), h = R() * (1 - t);
        return { p: [-1.25 - t * 0.3, 0.05 + h * 0.18, gauss(R) * 0.01], c: edgeC, s: 0.9, a: anim(3, 0.05) };
      }],
    ],
  };
}

// =====================================================================
// 7 · 鲨鱼（大白鲨）
// =====================================================================
function shark(R) {
  const f = (u) => (u < 0.33 ? Math.pow(Math.sin(((u / 0.33) * Math.PI) / 2), 0.8) : 1 - 0.83 * Math.pow((u - 0.33) / 0.67, 1.15));
  const prof = (u) => ({ x: 3.0 - 5.35 * u, yc: 0.04 * (1 - u), ryT: 0.66 * f(u) + 0.01, ryB: 0.55 * f(u) + 0.01, rz: 0.57 * f(u) + 0.01 });
  const body = makeLoft(prof, 240);
  const greys = ['#9aa3b5', '#9FBDDA', '#a9a7be', '#7f889c'].map(hex);
  const whiteC = hex('#f1f3f6'), warm = hex('#f6f2ec'), gillC = hex('#f2d9de'), poreC = hex('#CCDBEB'), finEdge = hex('#CCDBEB');
  const wOf = (x) => Math.pow(clamp((1.3 - x) / 4.5, 0, 1), 1.6);
  const dorsal = makePoly(smoothPoly([[0.95, 0.52], [0.6, 1.02], [0.25, 1.52], [0.02, 1.85], [-0.12, 1.83], [-0.08, 1.5], [-0.06, 1.1], [-0.2, 0.66], [-0.3, 0.55]], 6));
  const caudal = makePoly(smoothPoly([[-2.25, 0.2], [-2.62, 0.72], [-3.0, 1.15], [-3.38, 1.5], [-3.28, 1.1], [-3.0, 0.62], [-2.8, 0.06], [-3.02, -0.5], [-3.12, -1.12], [-2.85, -0.75], [-2.55, -0.35], [-2.25, -0.15]], 6));
  const pect = [1, -1].map((side) => makeFin(
    (a) => [lerp(1.25, -0.4, a) + 0.25 * Math.sin(Math.PI * a), lerp(-0.22, -0.95, a), side * lerp(0.42, 2.1, a)],
    (a) => [lerp(0.5, -0.4, Math.pow(a, 0.8)), lerp(-0.3, -0.95, a), side * lerp(0.4, 2.1, Math.pow(a, 1.1))]));
  const small = (bx0, bx1, by, ax, ay, side = 0) => makeFin(
    (a) => [lerp(bx0, ax, a), lerp(by, ay, a), side * a * 0.35],
    (a) => [lerp(bx1, ax, a), lerp(by, ay, a), side * a * 0.35]);
  const smallFins = [small(-1.75, -2.0, 0.28, -2.08, 0.55), small(-1.85, -2.05, -0.22, -2.12, -0.45),
    small(-1.05, -1.4, -0.32, -1.55, -0.62, 1), small(-1.05, -1.4, -0.32, -1.55, -0.62, -1)];
  const thB = (x) => Math.PI / 2 + 0.32 + 0.12 * Math.sin(x * 6.5) + 0.06 * Math.sin(x * 15.2);
  return {
    fit: 6.7,
    parts: [
      [64, () => {
        const o = body(R), p = o.p, x = p[0], ath = Math.abs(o.th);
        let c = ath < thB(x) ? ramp(greys, fbm(x * 1.6, p[1] * 2, p[2] * 2)) : mixc(whiteC, warm, R());
        let s = 0.9;
        // 鳃裂
        for (let k = 0; k < 5; k++) if (Math.abs(x - (1.62 - k * 0.11)) < 0.018 && ath > 0.95 && ath < 2.0) { c = gillC; s = 1.2; }
        // 口
        const dth = Math.abs(ath - Math.PI);
        if (dth < 0.85 && Math.abs(x - (2.42 - 0.45 * (1 - Math.cos(dth * 1.7)))) < 0.02) { c = gillC; s = 1.15; }
        // 劳伦氏壶腹（吻部感电孔）
        if (o.u < 0.12 && R() < 0.06) { c = poreC; s = 1.6; }
        return { p, c, s, a: anim(0, wOf(x)) };
      }],
      [1.2, () => { // 眼
        const side = R() < 0.5 ? 1 : -1, pr = prof(0.115), th = side * 1.2;
        const ctr = [pr.x, pr.yc + pr.ryT * Math.cos(th), pr.rz * Math.sin(th)];
        const r = lerp(0.035, 0.06, Math.sqrt(R())), a = R() * TAU;
        return { p: [ctr[0] + Math.cos(a) * r, ctr[1] + Math.sin(a) * r, ctr[2] + side * 0.01], c: whiteC, s: 1.3, a: anim(0, wOf(ctr[0])) };
      }],
      [9, () => { // 第一背鳍
        const [x, y, e] = dorsal(R);
        const p = [x, y, gauss(R) * 0.03 * (1.9 - y)];
        return { p, c: e < 0.03 ? finEdge : ramp(greys, fbm(x * 2, y * 2, 0)), s: e < 0.03 ? 1.1 : 0.85, a: anim(0, wOf(x)) };
      }],
      [11, () => { // 胸鳍
        const side = R() < 0.5 ? 0 : 1, o = pect[side](R);
        const p = o.p; p[1] += gauss(R) * 0.012;
        const edge = o.b < 0.05 || o.b > 0.96;
        return { p, c: edge ? finEdge : ramp(greys, fbm(p[0] * 2, 3, p[2] * 2)), s: edge ? 1.1 : 0.85, a: anim(0, wOf(p[0]) * 0.4) };
      }],
      [4, () => { // 小鳍
        const o = pick(R, smallFins)(R);
        return { p: [o.p[0], o.p[1], o.p[2] + gauss(R) * 0.01], c: ramp(greys, R()), s: 0.85, a: anim(0, wOf(o.p[0])) };
      }],
      [11, () => { // 尾鳍
        const [x, y, e] = caudal(R);
        return { p: [x, y, gauss(R) * 0.02], c: e < 0.03 ? finEdge : ramp(greys, fbm(x * 2, y * 2, 1)), s: e < 0.03 ? 1.1 : 0.85, a: anim(0, wOf(x)) };
      }],
    ],
  };
}

// =====================================================================
// 8 · 蓝鲸（附磷虾群）
// =====================================================================
function whale(R) {
  const rz = profile([[0, 0.05], [0.03, 0.32], [0.1, 0.56], [0.22, 0.7], [0.4, 0.68], [0.6, 0.52], [0.78, 0.3], [0.9, 0.16], [1, 0.09]]);
  const ry = profile([[0, 0.04], [0.03, 0.2], [0.1, 0.38], [0.22, 0.62], [0.4, 0.66], [0.6, 0.56], [0.78, 0.36], [0.9, 0.22], [1, 0.12]]);
  const throat = (u) => smooth(0.02, 0.1, u) * (1 - smooth(0.35, 0.55, u));
  const prof = (u) => {
    const top = u < 0.18 ? lerp(0.55, 1, u / 0.18) : 1;
    return { x: 3.9 - 7.0 * u, yc: -0.08 * Math.sin(Math.PI * Math.min(u / 0.5, 1)), ryT: ry(u) * top + 0.01, ryB: ry(u) * (1 + 0.15 * throat(u)) + 0.01, rz: rz(u) + 0.01 };
  };
  const body = makeLoft(prof, 260);
  const skinCols = ['#6C9AC4', '#9FBDDA', '#7e8fb5', '#CCDBEB'].map(hex);
  const spotC = hex('#a8abc6'), pleatC = hex('#E8EEF6'), pleatBase = hex('#b9cade'), mouthC = hex('#e6edf5');
  const krill = ['#f2bfae', '#ebaaa1', '#f2d9c1', '#e9b9c7'].map(hex);
  const wOf = (x) => Math.pow(clamp((1.0 - x) / 5.2, 0, 1), 1.8);
  const flipper = [1, -1].map((side) => makeFin(
    (a) => [lerp(2.25, 1.15, a), lerp(-0.3, -0.85, a), side * lerp(0.62, 1.6, a)],
    (a) => [lerp(1.9, 1.15, Math.pow(a, 0.7)), lerp(-0.32, -0.85, a), side * lerp(0.6, 1.6, a)]));
  const fluke = makePoly(smoothPoly([[-3.0, 0], [-3.25, 0.45], [-3.6, 0.95], [-4.02, 1.4], [-4.1, 1.25], [-3.95, 0.75], [-4.12, 0.22], [-3.98, 0],
    [-4.12, -0.22], [-3.95, -0.75], [-4.1, -1.25], [-4.02, -1.4], [-3.6, -0.95], [-3.25, -0.45]], 6));
  const dfin = makeFin((a) => [lerp(-1.48, -1.98, a), lerp(0.42, 0.66, a), 0], (a) => [lerp(-1.85, -1.98, a), lerp(0.36, 0.66, a), 0]);
  const mouthTh = (u) => Math.PI / 2 + 0.55 - 0.4 * (u / 0.21);
  return {
    fit: 7.8,
    parts: [
      [70, () => {
        const o = body(R), p = o.p, ath = Math.abs(o.th);
        let c = ramp(skinCols, fbm(p[0] * 1.6, p[1] * 2, p[2] * 2));
        let s = 0.9;
        if (fbm(p[0] * 4 + 9, p[1] * 4, p[2] * 4) > 0.66) c = mixc(c, spotC, 0.7);
        if (ath > Math.PI - 1.2 && o.u > 0.03 && o.u < 0.52) {
          const pl = Math.pow(Math.abs(Math.cos(o.th * 26)), 8);
          c = mixc(pleatBase, pleatC, pl); s = pl > 0.5 ? 1.05 : 0.85;
        }
        if (o.u < 0.21 && Math.abs(ath - mouthTh(o.u)) < 0.04) { c = mouthC; s = 1.2; }
        if (o.u > 0.14 && o.u < 0.17 && Math.abs(ath - 0.12) < 0.06) { c = pleatC; s = 1.3; }
        return { p, c, s, a: anim(0, wOf(p[0])) };
      }],
      [1, () => { // 眼
        const side = R() < 0.5 ? 1 : -1, pr = prof(0.215), th = side * (Math.PI / 2 + 0.25);
        const ctr = [pr.x, pr.yc + pr.ryB * Math.cos(th), pr.rz * Math.sin(th)];
        const r = lerp(0.03, 0.055, Math.sqrt(R())), a = R() * TAU;
        return { p: [ctr[0] + Math.cos(a) * r, ctr[1] + Math.sin(a) * r, ctr[2] + side * 0.01], c: pleatC, s: 1.3, a: anim(0, wOf(ctr[0])) };
      }],
      [6, () => { // 胸鳍
        const side = R() < 0.5 ? 0 : 1, o = flipper[side](R);
        return { p: [o.p[0], o.p[1] + gauss(R) * 0.012, o.p[2]], c: o.b < 0.08 ? pleatC : ramp(skinCols, R()), s: 0.9, a: anim(0, wOf(o.p[0])) };
      }],
      [2, () => { const o = dfin(R); return { p: [o.p[0], o.p[1], gauss(R) * 0.015], c: skinCols[1], s: 0.9, a: anim(0, wOf(o.p[0])) }; }],
      [12, () => { // 尾鳍（水平）
        const [x, z, e] = fluke(R);
        return { p: [x, 0.0 + gauss(R) * 0.015, z], c: e < 0.035 ? pleatC : ramp(skinCols, fbm(x * 2, 0, z * 2)), s: e < 0.035 ? 1.15 : 0.85, a: anim(0, 1) };
      }],
      [7, () => { // 磷虾群
        const p = [4.35 + gauss(R) * 0.42, 0.95 + gauss(R) * 0.32, 0.6 + gauss(R) * 0.42];
        return { p, c: pick(R, krill), s: 0.6 + R() * 0.5, a: anim(4, R()) };
      }],
    ],
  };
}

// =====================================================================
// 9 · 水母（海月水母的伞盖与生殖腺 + 海刺水母般的长触手与口腕）
// =====================================================================
function jellyfish(R) {
  const phiMax = 1.42;
  const bellA = hex('#acd8da'), bellB = hex('#c4b9e2'), canal = hex('#E8EEF6'), margin = hex('#eab8cb');
  const gon = ['#f1bdd3', '#dab7ea'].map(hex);
  const armA = hex('#ceb8e4'), armB = hex('#efb8cd'), armEdge = hex('#f4d8e7');
  const tenA = hex('#CCDBEB'), tenB = hex('#a9dcd6'), tenTip = hex('#cbb4e0'), bead = hex('#f4f1f9');
  const motes = ['#a9dcd6', '#CCDBEB', '#d9c6ee', '#f2c4d4'].map(hex);
  const tents = [];
  for (let k = 0; k < 30; k++) tents.push({ a: (k / 30) * TAU + (R() - 0.5) * 0.08, L: 2.9 + R() * 1.7, ph: R() * TAU, amp: 0.15 + R() * 0.2 });
  const arms = [0, 1, 2, 3].map((k) => (k * Math.PI) / 2 + Math.PI / 4 + 0.2);
  const bellPt = (phi, al, k = 1) => {
    let rad = 1.55 * Math.sin(phi) * k, y = 0.3 + 1.2 * Math.cos(phi) * k;
    if (phi > 1.25) { rad += 0.05 * Math.abs(Math.sin(al * 8)); y -= ((phi - 1.25) / 0.17) * 0.05; }
    return [rad * Math.cos(al), y, rad * Math.sin(al)];
  };
  return {
    fit: 6.5,
    parts: [
      [26, () => { // 伞盖
        const phi = Math.acos(1 - R() * (1 - Math.cos(phiMax))), al = R() * TAU, inner = R() < 0.3;
        const p = bellPt(phi, al, inner ? 0.9 : 1);
        if (inner) p[1] -= 0.1;
        const can = Math.pow(Math.abs(Math.cos(al * 8)), 60) > 0.4;
        const ring = phi > 1.32 && phi < 1.37;
        let c = mixc(bellA, bellB, fbm(p[0] * 1.5, p[1] * 1.5, p[2] * 1.5));
        let s = 0.85;
        if (can || ring) { c = canal; s = 1.15; }
        if (phi > 1.38) { c = margin; s = 1.1; }
        if (inner) { c = dim(c, 0.5); s = 0.7; }
        return { p, c, s, a: anim(0, Math.sin(phi)) };
      }],
      [8, () => { // 四叶生殖腺
        const k = Math.floor(R() * 4), b = Math.PI / 4 + (k * Math.PI) / 2;
        const psi = lerp(0.35 * Math.PI, 1.65 * Math.PI, R()) + b + Math.PI, th = R() * TAU;
        const cx = Math.cos(b) * 0.55, cz = Math.sin(b) * 0.55, rr = 0.3 + 0.07 * Math.cos(th);
        return { p: [cx + Math.cos(psi) * rr, 1.12 + 0.07 * Math.sin(th), cz + Math.sin(psi) * rr], c: gon[k % 2], s: 1.25, a: anim(3, 0.5) };
      }],
      [22, () => { // 口腕
        const a0 = pick(R, arms), v = Math.pow(R(), 0.85), l = R() * 2 - 1;
        const ang = a0 + 1.2 * v;
        const C = [0.12 * Math.cos(a0) + 0.28 * v * Math.cos(ang), 0.45 - 3.0 * v, 0.12 * Math.sin(a0) + 0.28 * v * Math.sin(ang)];
        const Bv = [Math.cos(ang), 0, Math.sin(ang)], Nv = [-Math.sin(ang), 0, Math.cos(ang)];
        const W = 0.28 * (1 - 0.5 * v) + 0.04;
        const fr = 0.15 * Math.sin(v * 26 + l * 3) * Math.abs(l);
        const p = add3(C, add3(mul3(Bv, l * W), mul3(Nv, fr)));
        const edge = Math.abs(l) > 0.86;
        return { p, c: edge ? armEdge : mixc(armA, armB, v), s: edge ? 1.15 : 0.85, a: anim(1, v) };
      }],
      [37, () => { // 触手
        const t = pick(R, tents), v = R();
        const b = [1.5 * Math.cos(t.a), 0.45, 1.5 * Math.sin(t.a)];
        const out = 1 + 0.12 * v, sw = t.amp * Math.sin(v * 4 + t.ph) * v;
        const p = [b[0] * out + sw * Math.cos(t.a + 1.3) + gauss(R) * 0.012, 0.45 - v * t.L, b[2] * out + sw * Math.sin(t.a + 1.3) + gauss(R) * 0.012];
        const isBead = Math.pow(Math.abs(Math.sin(v * 46 + t.ph)), 24) > 0.5;
        let c = mixc(mixc(tenA, tenB, Math.sin(t.ph) * 0.5 + 0.5), tenTip, smooth(0.5, 1, v));
        if (isBead) c = bead;
        return { p, c, s: isBead ? 1.15 : 0.7, a: anim(2, v) };
      }],
      [3, () => { // 环绕的生物光点
        const p = add3([0, 0.3, 0], mul3(onSphere(R), 1.9 + R() * 1.4));
        p[1] = 0.3 + (p[1] - 0.3) * 1.3;
        return { p, c: pick(R, motes), s: 0.5 + R() * 0.8, a: anim(4, R()) };
      }],
    ],
  };
}

// =====================================================================
// 10 · 灯笼鱼（一小群，身侧带发光器）
// =====================================================================
function lanternfish(R) {
  const dorsalC = ['#6C9AC4', '#8a8fb0'].map(hex), silver = ['#d4d5e4', '#c7cede', '#dcd6e4'].map(hex);
  const irid = ['#e4d5b8', '#dcc5d8', '#c9dfe0'].map(hex), eyeC = hex('#E8EEF6'), mouthC = hex('#efe9f4');
  const photo = ['#b8ede5', '#c7eff1', '#CCDBEB', '#c9eccb'].map(hex), finC = hex('#c3c6da');
  const ryP = profile([[0, 0.02], [0.04, 0.1], [0.12, 0.135], [0.3, 0.14], [0.6, 0.1], [0.85, 0.055], [1, 0.04]]);
  const rzP = profile([[0, 0.015], [0.04, 0.06], [0.15, 0.075], [0.35, 0.075], [0.7, 0.045], [1, 0.02]]);
  const prof = (u) => ({ x: 0.5 - 0.8 * u, yc: 0, ryT: ryP(u) + 0.004, ryB: ryP(u) * 1.05 + 0.004, rz: rzP(u) + 0.004 });
  const body = makeLoft(prof, 120);
  const caudal = makePoly(smoothPoly([[-0.28, 0.035], [-0.4, 0.12], [-0.48, 0.17], [-0.44, 0.06], [-0.39, 0.0], [-0.44, -0.06], [-0.48, -0.17], [-0.4, -0.12], [-0.28, -0.035]], 6));
  const dfin = makePoly(smoothPoly([[0.12, 0.12], [0.06, 0.22], [-0.04, 0.2], [-0.07, 0.11]], 6));
  const afin = makePoly(smoothPoly([[-0.05, -0.1], [-0.1, -0.18], [-0.22, -0.15], [-0.24, -0.06]], 6));
  // 发光器：(u, |θ|) 位置表
  const P = [];
  for (let i = 0; i < 5; i++) P.push([0.12 + i * 0.075, Math.PI - 0.35]);
  P.push([0.2, Math.PI - 0.9], [0.24, Math.PI - 0.95]);
  for (let i = 0; i < 4; i++) P.push([0.48 + i * 0.045, Math.PI - 0.45]);
  for (let i = 0; i < 7; i++) P.push([0.65 + i * 0.04, Math.PI - 0.6]);
  for (let i = 0; i < 3; i++) P.push([0.5 + i * 0.05, Math.PI - 1.3]);
  const photoPos = (u, th) => { const pr = prof(u), c = Math.cos(th); return [pr.x, pr.yc + (c > 0 ? pr.ryT : pr.ryB) * c, pr.rz * Math.sin(th)]; };
  const fish = [
    { pos: [0.2, 0.15, 1.0], s: 3.4, yaw: 0.12, pitch: 0.05 },
    { pos: [-2.3, 1.55, -1.2], s: 1.5, yaw: -0.25, pitch: 0.12 },
    { pos: [2.5, 1.7, -0.6], s: 1.3, yaw: 0.3, pitch: -0.1 },
    { pos: [-2.6, -1.4, 0.2], s: 1.7, yaw: 0.2, pitch: -0.06 },
    { pos: [1.9, -1.75, -1.6], s: 1.2, yaw: -0.15, pitch: 0.15 },
    { pos: [-0.6, 2.3, -2.2], s: 1.1, yaw: 0.05, pitch: 0.02 },
    { pos: [3.1, 0.2, -2.6], s: 1.0, yaw: -0.3, pitch: 0.0 },
  ];
  const place = (f, p) => add3(rotY(rotZ(mul3(p, f.s), f.pitch), f.yaw), f.pos);
  const wl = (x, f) => Math.pow(clamp((0.25 - x) / 0.75, 0, 1), 1.5) * (f.s / 3.6);
  const fishPart = (gi) => {
    const f = fish[gi];
    return () => {
      const r = R();
      if (r < 0.6) {
        const o = body(R), p = o.p, ath = Math.abs(o.th);
        let c = ath < 0.75 ? mixc(dim(dorsalC[0], 0.75), dorsalC[1], R()) : pick(R, silver);
        if (R() < 0.08) c = pick(R, irid);
        // 大眼
        const ed = Math.hypot(p[0] - 0.4, p[1] - 0.03);
        if (ed < 0.06 && Math.abs(p[2]) > 0.03) c = ed > 0.04 ? eyeC : dim(eyeC, 0.35);
        // 口
        if (Math.abs(p[1] - (0 - (0.5 - p[0]) * 0.47)) < 0.008 && p[0] > 0.33 && ath > 0.9) c = mouthC;
        return { p: place(f, p), c, s: ed < 0.06 ? 1.15 : 0.8, a: anim(gi, wl(p[0], f)) };
      }
      if (r < 0.7) { // 发光器
        const [u, th] = pick(R, P), side = R() < 0.5 ? 1 : -1;
        const p = add3(photoPos(u, side * th), mul3(onSphere(R), 0.012));
        return { p: place(f, p), c: pick(R, photo), s: 1.95 + R() * 0.4, a: anim(gi, wl(p[0], f)) };
      }
      if (r < 0.72) { // 尾柄发光腺
        const t = R();
        const p = [-0.2 - t * 0.08, (R() < 0.5 ? 1 : -1) * 0.045, gauss(R) * 0.008];
        return { p: place(f, p), c: photo[0], s: 1.95, a: anim(gi, wl(p[0], f)) };
      }
      if (r < 0.86) { // 叉形尾鳍
        const [x, y, e] = caudal(R);
        return { p: place(f, [x, y, gauss(R) * 0.004]), c: e < 0.008 ? eyeC : dim(finC, 0.7), s: 0.75, a: anim(gi, wl(x, f)) };
      }
      const [x, y] = R() < 0.5 ? dfin(R) : afin(R);
      return { p: place(f, [x, y, gauss(R) * 0.004]), c: dim(finC, 0.65), s: 0.7, a: anim(gi, wl(x, f)) };
    };
  };
  return {
    fit: 6.6,
    parts: fish.map((f, i) => [Math.pow(f.s, 1.6), fishPart(i)]),
  };
}

// =====================================================================
// 11 · 鮟鱇（深海角鮟鱇，头顶“灯笼”）
// =====================================================================
function anglerfish(R) {
  const ryP = profile([[0, 0.88], [0.06, 1.0], [0.18, 1.12], [0.35, 1.15], [0.55, 0.95], [0.75, 0.6], [0.9, 0.32], [1, 0.2]]);
  const prof = (u) => ({ x: 1.25 - 3.0 * u, yc: 0.1 * Math.sin(Math.PI * u), ryT: ryP(u), ryB: ryP(u) * 0.95, rz: ryP(u) * 0.8 });
  const body = makeLoft(prof, 200);
  const skin = ['#7f707f', '#8b766a', '#706c82', '#86727d'].map(hex);
  const wart = hex('#b9a4ab'), pore = hex('#cbbcc8'), tooth = hex('#f5efe2'), rod = hex('#a9919c');
  const esca = ['#e3f7ef', '#bfeadc', '#cbf1d8', '#dff3f6'].map(hex), finC = hex('#9c8a96'), ray = hex('#c4b2b9');
  const rodTube = makeTube(spline([[0.55, 1.0, 0], [0.85, 1.75, 0], [1.55, 2.05, 0], [2.05, 1.75, 0], [2.2, 1.38, 0]]), (u) => lerp(0.03, 0.02, u), { segs: 80 });
  const ESCA = [2.22, 1.25, 0];
  const teeth = [];
  for (let k = 0; k < 22; k++) { // 上颌
    const a = lerp(0.12, Math.PI - 0.12, (k + 0.5) / 22);
    teeth.push({ b: [1.27, 0.85 * Math.sin(a) * 0.95, 0.72 * Math.cos(a)], dir: norm3([0.15, -1, -0.25 * Math.cos(a)]), L: 0.16 + R() * 0.24, low: false });
  }
  const jaw = (t) => { const a = lerp(0.1, Math.PI - 0.1, t); return [1.32 + 0.25 * Math.sin(a), -0.62 * Math.sin(a) - 0.12, 0.78 * Math.cos(a)]; };
  for (let k = 0; k < 18; k++) {
    const b = jaw((k + 0.5) / 18);
    teeth.push({ b, dir: norm3([-0.1, 1, -0.2 * Math.sign(b[2]) * (Math.abs(b[2]) > 0.3 ? 1 : 0)]), L: 0.22 + R() * 0.3, low: true });
  }
  const pect = [1, -1].map((side) => makeFin(
    (a) => [lerp(-0.15, -0.55, a), lerp(-0.1, 0.12, a), side * lerp(0.86, 1.15, a)],
    (a) => [lerp(-0.15, -0.65, a), lerp(-0.35, -0.38, a), side * lerp(0.86, 1.1, a)]));
  const caudal = makePoly(smoothPoly([[-1.7, 0.22], [-2.2, 0.55], [-2.55, 0.42], [-2.62, 0.0], [-2.55, -0.42], [-2.2, -0.55], [-1.7, -0.22]], 6));
  const dfin = makeFin((a) => [lerp(-0.95, -1.4, a), lerp(0.92, 0.55, a), 0], (a) => [lerp(-0.95, -1.4, a), lerp(1.2, 0.85, a), 0]);
  const afin = makeFin((a) => [lerp(-1.05, -1.45, a), lerp(-0.85, -0.52, a), 0], (a) => [lerp(-1.05, -1.45, a), lerp(-1.1, -0.78, a), 0]);
  return {
    fit: 6.0,
    parts: [
      [55, () => { // 身体
        const o = body(R), p = o.p;
        let c = dim(ramp(skin, fbm(p[0] * 1.3, p[1] * 1.3, p[2] * 1.3)), 0.85), s = 0.8;
        if (R() < 0.05) { c = wart; s = 1.05; }
        const ll = Math.abs(p[1] - 0.15 - 0.2 * Math.sin(p[0])) < 0.02 && fract(p[0] * 6) < 0.25;
        if (ll) { c = pore; s = 1.2; }
        return { p, c, s, a: 0 };
      }],
      [5, () => { // 下颌
        const t = R(), b = jaw(t), th = R() * TAU;
        return { p: add3(b, [Math.cos(th) * 0.05, Math.sin(th) * 0.05, 0]), c: dim(skin[1], 0.95), s: 0.85, a: anim(1, 0.999) };
      }],
      [8, () => { // 利齿
        const tt = pick(R, teeth), v = R();
        const p = add3(tt.b, add3(mul3(tt.dir, tt.L * v), [0.03 * v * v, 0, 0]));
        return { p, c: tooth, s: lerp(1.15, 0.8, v), a: tt.low ? anim(1, 0.999) : 0 };
      }],
      [2, () => { // 口腔深处
        const p = [lerp(0.4, 1.2, R()), (R() - 0.6) * 0.9, (R() * 2 - 1) * 0.6];
        return { p, c: dim(skin[2], 0.35), s: 0.6, a: 0 };
      }],
      [1, () => { // 小眼
        const side = R() < 0.5 ? 1 : -1, r = lerp(0.02, 0.04, Math.sqrt(R())), a = R() * TAU;
        return { p: [0.82 + Math.cos(a) * r, 0.62 + Math.sin(a) * r, side * 0.66], c: pore, s: 1.2, a: 0 };
      }],
      [3, () => { const o = rodTube(R); return { p: o.p, c: rod, s: 0.85, a: anim(2, o.u) }; }],
      [8, () => { // 拟饵（发光球）
        const r = R();
        if (r < 0.55) return { p: add3(ESCA, mul3(onSphere(R), 0.14 * Math.cbrt(R()))), c: pick(R, esca), s: 1.7 + R() * 0.6, a: anim(3, 1) };
        if (r < 0.7) { // 垂下的发光丝
          const k = Math.floor(R() * 3), v = R(), a = k * 0.9 - 0.9;
          return { p: add3(ESCA, [0.06 * Math.sin(a) + 0.05 * v, -0.12 - 0.32 * v, 0.07 * Math.cos(a) * v]), c: esca[k], s: 1.2, a: anim(3, 1) };
        }
        return { p: add3(ESCA, [gauss(R) * 0.32, gauss(R) * 0.32, gauss(R) * 0.32]), c: pick(R, esca), s: 0.9 + R() * 0.6, a: anim(3, 1) };
      }],
      [7, () => { // 胸鳍
        const side = R() < 0.5 ? 0 : 1, o = pect[side](R);
        const rr = Math.pow(Math.abs(Math.cos(o.b * Math.PI * 5)), 8) > 0.5;
        return { p: o.p, c: rr ? ray : dim(finC, 0.6), s: rr ? 0.95 : 0.65, a: anim(4, o.a) };
      }],
      [11, () => { // 背鳍、臀鳍、尾鳍
        const r = R();
        if (r < 0.6) {
          const [x, y] = caudal(R);
          const rr = Math.pow(Math.abs(Math.cos(Math.atan2(y, x + 1.7) * 9)), 8) > 0.5;
          return { p: [x, y, gauss(R) * 0.015], c: rr ? ray : dim(finC, 0.6), s: rr ? 0.95 : 0.65, a: anim(4, clamp((-1.7 - x) / 0.9, 0, 1)) };
        }
        const o = (r < 0.8 ? dfin : afin)(R);
        return { p: [o.p[0], o.p[1], gauss(R) * 0.012], c: o.b > 0.85 ? ray : dim(finC, 0.6), s: 0.75, a: anim(4, o.b) };
      }],
    ],
  };
}

// =====================================================================
// 12 · 深渊：生物荧光浮游生物旋涡
// =====================================================================
function abyss(R) {
  const cols = ['#9FBDDA', '#CCDBEB', '#a7d9d3', '#c8b7e3', '#edb9c9', '#efdcae', '#6C9AC4'].map(hex);
  return {
    fit: 7.2,
    parts: [
      [82, () => {
        const arm = Math.floor(R() * 3), r = 0.35 + Math.pow(R(), 0.8) * 3.2;
        const a = (arm * TAU) / 3 + r * 1.55 + (gauss(R) * 0.32) / Math.sqrt(r);
        const y = gauss(R) * 0.1 * (1 + r * 0.12);
        const c = mixc(pick(R, cols), cols[1], R() * 0.3);
        return { p: [Math.cos(a) * r, y, Math.sin(a) * r], c, s: 0.6 + R() * 0.9, a: anim(0, r / 3.6) };
      }],
      [18, () => {
        const p = [gauss(R) * 0.45, gauss(R) * 0.3, gauss(R) * 0.45];
        return { p, c: mixc(cols[1], cols[5], R() * 0.5), s: 0.8 + R() * 0.6, a: anim(0, len3(p) / 3.6) };
      }],
    ],
  };
}

const BUILDERS = { ocean, coral, starfish, seahorse, horseshoe, turtle, manta, shark, whale, jellyfish, lanternfish, anglerfish, abyss };

export function buildShape(id, seed = 1) {
  const R = mulberry32(seed * 7919 + 13);
  return realize(BUILDERS[id](R), R);
}

// 逐个生成全部形体，写入两张大数组（位置/颜色），每生成一个就让出主线程以刷新进度
export async function buildAll(onProgress) {
  const S = SHAPES.length;
  const pos = new Float32Array(N * 4 * S), col = new Float32Array(N * 4 * S);
  for (let i = 0; i < S; i++) {
    onProgress?.(i, SHAPES[i]);
    await new Promise((r) => setTimeout(r, 0));
    const c = buildShape(SHAPES[i], i + 1);
    pos.set(c.pos, i * N * 4);
    col.set(c.col, i * N * 4);
  }
  onProgress?.(S, null);
  return { pos, col };
}
