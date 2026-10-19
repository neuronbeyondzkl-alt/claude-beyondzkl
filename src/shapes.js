// 九个层级的粒子形态：全部程序化生成，不依赖外部模型。
// 每个形态输出 N 个粒子：位置 xyz + 信号路径参数 w（<0 表示不参与放电脉冲），
// 颜色 rgb（线性空间）+ a（尺寸系数，若为点缀色则 +10 作标记，供“色彩丰富度”滑块调节）。

import { Color } from 'three';
import { mulberry32, createNoise3D } from './noise.js';

const lin = (hex) => {
  const c = new Color(hex);
  return [c.r, c.g, c.b];
};

// 主体：Loyel 渐变蓝（低饱和蓝荧光）
// 点缀：每种颜色都有语义——琥珀=动作电位/能量，薰衣草=神经递质/少突，薄荷=星形胶质，
//      珊瑚=受体/血管，水青=髓鞘纤维，兰紫=调制/抑制性中间神经元
export const PAL = {
  c10: lin('#F4F7FB'),
  c20: lin('#E8EEF6'),
  c30: lin('#CCDBEB'),
  c40: lin('#9FBDDA'),
  c50: lin('#6C9AC4'),
  c60: lin('#497DAE'),
  c70: lin('#376392'),
  aqua: lin('#7CCAD6'),
  mint: lin('#8BD3B4'),
  lav: lin('#A7A2E6'),
  orchid: lin('#CF98D6'),
  amber: lin('#F0B46A'),
  coral: lin('#EC8A80'),
};

const ACCENT = 10;
// 树突标记：颜色纹理 a 通道 = 尺寸 + 10×点缀 + 20×树突。点击波在树突上显示为蓝色分级电位，到胞体/轴突才是琥珀色动作电位
const DEND = 20;
// 归属标记：+ 40×(所属接力链神经元序号 + 1)，着色器据此只点亮被点中的神经元及其真实下游
const OWN = 40;
const TAU = Math.PI * 2;

// ---------- 向量小工具 ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

function gauss(R) {
  let u = 0;
  while (u === 0) u = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * R());
}
function onSphere(R) {
  const z = R() * 2 - 1;
  const t = R() * TAU;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(t), z, r * Math.sin(t)];
}
function inSphere(R) {
  const d = onSphere(R);
  return mul(d, Math.cbrt(R()));
}
function perpBasis(t) {
  const a = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const n1 = norm(cross(t, a));
  const n2 = cross(t, n1);
  return [n1, n2];
}
function randPerp(t, R) {
  const [n1, n2] = perpBasis(t);
  const a = R() * TAU;
  return add(mul(n1, Math.cos(a)), mul(n2, Math.sin(a)));
}
// 把方向 d 绕随机垂直轴旋转 ang 弧度
function deviate(d, ang, R) {
  const p = randPerp(d, R);
  return norm(add(mul(d, Math.cos(ang)), mul(p, Math.sin(ang))));
}
function fib(i, n) {
  const y = 1 - (2 * (i + 0.5)) / n;
  const r = Math.sqrt(1 - y * y);
  const t = i * 2.399963229728653;
  return [r * Math.cos(t), y, r * Math.sin(t)];
}
const pick = (R, arr) => arr[Math.floor(R() * arr.length)];

function blue(R) {
  const r = R();
  if (r < 0.4) return PAL.c40;
  if (r < 0.7) return PAL.c50;
  if (r < 0.82) return PAL.c30;
  if (r < 0.94) return PAL.c60;
  if (r < 0.97) return PAL.c20;
  return PAL.c70;
}
function blueBright(R) {
  const r = R();
  if (r < 0.5) return PAL.c30;
  if (r < 0.86) return PAL.c40;
  return PAL.c20;
}
function blueDim(R) {
  const r = R();
  if (r < 0.45) return PAL.c60;
  if (r < 0.8) return PAL.c70;
  return PAL.c50;
}

function alloc(n, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  const out = weights.map((w) => Math.floor((n * w) / total));
  let rest = n - out.reduce((s, c) => s + c, 0);
  for (let i = 0; rest > 0; i = (i + 1) % out.length, rest--) out[i]++;
  return out;
}

function makePicker(weights, R) {
  const cum = new Float64Array(weights.length);
  let s = 0;
  for (let i = 0; i < weights.length; i++) {
    s += weights[i];
    cum[i] = s;
  }
  return () => {
    const x = R() * s;
    let lo = 0;
    let hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };
}

// 折线（按弧长参数化）
class Poly {
  constructor(pts) {
    this.pts = pts;
    this.cum = new Float64Array(pts.length);
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      L += len(sub(pts[i], pts[i - 1]));
      this.cum[i] = L;
    }
    this.len = L || 1e-6;
  }
  _seg(u) {
    const target = Math.min(1, Math.max(0, u)) * this.len;
    let lo = 0;
    let hi = this.pts.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (this.cum[mid] < target) lo = mid;
      else hi = mid;
    }
    const span = this.cum[hi] - this.cum[lo] || 1e-6;
    return [lo, hi, (target - this.cum[lo]) / span];
  }
  at(u) {
    const [lo, hi, f] = this._seg(u);
    return lerp3(this.pts[lo], this.pts[hi], f);
  }
  tangent(u) {
    const [lo, hi] = this._seg(u);
    return norm(sub(this.pts[hi], this.pts[lo]));
  }
}

function catmull(ctrl, perSpan = 12) {
  const out = [];
  const n = ctrl.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = ctrl[Math.max(i - 1, 0)];
    const p1 = ctrl[i];
    const p2 = ctrl[i + 1];
    const p3 = ctrl[Math.min(i + 2, n - 1)];
    for (let j = 0; j < perSpan; j++) {
      const t = j / perSpan;
      const t2 = t * t;
      const t3 = t2 * t;
      const p = [0, 0, 0];
      for (let k = 0; k < 3; k++) {
        p[k] =
          0.5 *
          (2 * p1[k] +
            (-p0[k] + p2[k]) * t +
            (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
            (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      }
      out.push(p);
    }
  }
  out.push(ctrl[n - 1].slice());
  return out;
}
const curve = (ctrl, per = 12) => new Poly(catmull(ctrl, per));

function quadBezier(a, c, b, steps = 24) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    pts.push([
      u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
      u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
      u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
    ]);
  }
  return new Poly(pts);
}

// 平行移动标架：用于纤维束内每根纤维沿中心线扭转
function transportFrames(poly) {
  const n = poly.pts.length;
  const T = [];
  for (let i = 0; i < n; i++) {
    const a = poly.pts[Math.max(0, i - 1)];
    const b = poly.pts[Math.min(n - 1, i + 1)];
    T.push(norm(sub(b, a)));
  }
  let [N] = perpBasis(T[0]);
  const Ns = [N];
  const Bs = [cross(T[0], N)];
  for (let i = 1; i < n; i++) {
    N = norm(sub(N, mul(T[i], dot(N, T[i]))));
    Ns.push(N);
    Bs.push(cross(T[i], N));
  }
  return { T, N: Ns, B: Bs };
}

// ---------- 粒子缓冲 ----------
class Builder {
  constructor(n, seed) {
    this.n = n;
    this.i = 0;
    this.owner = null; // 可选：每个粒子属于哪个胞体（meta.somata 的下标，255 = 不属于）
    this.curOwner = 255;
    this.pos = new Float32Array(n * 4);
    this.col = new Float32Array(n * 4);
    this.R = mulberry32(seed);
    this.noise = createNoise3D(seed * 7 + 3);
    this.off = [0, 0, 0];
    this.s = 1;
  }
  add(x, y, z, path, c, size = 1, accent = false, dend = false) {
    if (this.i >= this.n) return;
    if (this.owner) this.owner[this.i] = this.curOwner;
    const k = this.i++ * 4;
    this.pos[k] = x * this.s + this.off[0];
    this.pos[k + 1] = y * this.s + this.off[1];
    this.pos[k + 2] = z * this.s + this.off[2];
    this.pos[k + 3] = path;
    this.col[k] = c[0];
    this.col[k + 1] = c[1];
    this.col[k + 2] = c[2];
    this.col[k + 3] = size + (accent ? ACCENT : 0) + (dend ? DEND : 0) + (this.curOwner < 255 ? (this.curOwner + 1) * OWN : 0);
  }
  addP(p, path, c, size, accent, dend) {
    this.add(p[0], p[1], p[2], path, c, size, accent, dend);
  }
  reset() {
    this.off = [0, 0, 0];
    this.s = 1;
  }
}

// 背景星尘：每个形态都保留一些，让形变过程始终有“宇宙感”
function addDust(b, count, reject = null) {
  const R = b.R;
  b.reset();
  for (let k = 0; k < count; k++) {
    const x = (R() * 2 - 1) * 7.0;
    const y = (R() * 2 - 1) * 4.4;
    const z = -5.5 + R() * 7.5;
    if (reject && reject(x, y, z)) {
      k--;
      continue;
    }
    const acc = R() < 0.05;
    const c = acc ? pick(R, [PAL.lav, PAL.aqua, PAL.orchid]) : blueDim(R);
    // 环境闪烁放在 400+ 路径带：任何沿结构传播的波前都不会把星尘点亮
    const path = R() < 0.3 ? 400 + R() * 40 : -1;
    b.add(x, y, z, path, c, 0.5 + R() * 0.45, acc);
  }
}

// 沿管道采样一个点（中心线 + 径向偏移）
function tubePoint(poly, u, r, R, shell = 0.8) {
  const c = poly.at(u);
  const t = poly.tangent(u);
  const p = randPerp(t, R);
  const rr = r * (shell + (1 - shell) * R());
  return add(c, mul(p, rr));
}

// ===================================================================
// 0 · 首页：彼此连接的锥体神经元网络（前景 5 个大锥体神经元 + 背景小锥体神经元）
// 锥体神经元的特征：三角形胞体、竖直上行的顶树突与顶端树突簇、四周的基底树突、向下的轴突；
// 轴突侧支末端的突触小体落在相邻神经元的树突上，放电从左向右逐个传递
// ===================================================================
function buildPyramidal(R, S, k, lean = 0, o = {}) {
  const dend = [];
  const axon = [];
  const up = norm([lean, 1, 0]);
  const trunkLen = (o.trunk || 2.5 + R() * 0.5) * k;
  // 顶树突主干 + 斜枝 + 顶端树突簇
  const trunk = growBranch(R, dend, add(S, [0, 0.3 * k, 0]), up, trunkLen, 0.058 * k, 0, 0, 0, 'apical', {
    wiggle: 0.035,
    angle: 0,
  });
  const top = trunk.poly.at(1);
  const nTuft = o.tuft || 3 + (R() < 0.5 ? 1 : 0);
  for (let i = 0; i < nTuft; i++) {
    growBranch(R, dend, top, deviate(up, 0.45 + R() * 0.5, R), 0.6 * k, 0.03 * k, 0, 2, trunk.poly.len, 'tuft', {
      wiggle: 0.18,
      angle: 0.6,
    });
  }
  for (const u of o.obliques || [0.24, 0.4, 0.57, 0.74]) {
    growBranch(R, dend, trunk.poly.at(u), deviate(up, 0.95 + R() * 0.35, R), (0.45 + R() * 0.35) * k, 0.024 * k, 0, 1, u * trunk.poly.len, 'oblique', {
      wiggle: 0.14,
      angle: 0.55,
    });
  }
  // 基底树突：向两侧下垂张开
  const nb = o.basal || 5 + (R() < 0.5 ? 1 : 0);
  for (let i = 0; i < nb; i++) {
    const ph = (i / nb) * TAU + R() * 0.6;
    const dir = norm([Math.cos(ph) * 0.95, -0.5 - R() * 0.5, Math.sin(ph) * 0.7]);
    growBranch(R, dend, add(S, mul(dir, 0.22 * k)), dir, (0.8 + R() * 0.35) * k, 0.036 * k, 0, 2, 0, 'basal', {
      wiggle: 0.12,
      angle: 0.55,
    });
  }
  // 主轴突：自胞体底部（轴丘 / 起始段）向下
  const a0 = add(S, [0, -0.34 * k, 0]);
  const al = (o.axonLen || 2.3) / 2.3;
  const main = curve(
    [a0, add(a0, [0.05 * k, -0.6 * k * al, 0.05]), add(a0, [-0.1 * k, -1.3 * k * al, 0.1]), add(a0, [0.05 * k, -2.3 * k * al, 0])],
    10,
  );
  axon.push({ poly: main, r0: 0.022 * k, r1: 0.016 * k, dist0: 0, kind: 'axon' });
  const dMax = Math.max(...dend.map((sg) => sg.dist0 + sg.poly.len));
  return { S, k, dend, axon, main, trunk, dMax, boutons: [] };
}

// 从神经元 a 的轴突发出侧支，止于神经元 b 的指定部位（基底树突 / 顶树突斜枝），末端形成突触小体
function connect(R, a, bN, target, drop = 0.45) {
  const u = 0.32 + R() * 0.25;
  const p0 = a.main.at(u);
  const mid = add(lerp3(p0, target, 0.5), [0, -drop - R() * 0.3, (R() - 0.5) * 0.4]);
  const side = Math.sign(target[0] - p0[0]) || 1;
  const poly = curve([p0, add(p0, [side * 0.22, -0.18, 0]), mid, target], 16);
  const dist0 = u * a.main.len;
  a.axon.push({ poly, r0: 0.017 * a.k, r1: 0.013 * a.k, dist0, kind: 'collateral' });
  a.boutons.push({ c: target, dist: dist0 + poly.len });
  return dist0 + poly.len;
}

// 篮状细胞（抑制性中间神经元）：多极小胞体 + 包绕锥体细胞胞体的轴突“篮”
function buildBasket(R, S, k, targets) {
  const dend = [];
  for (let i = 0; i < 6; i++) growBranch(R, dend, S, onSphere(R), 0.42 * k, 0.02 * k, 0, 1, 0, 'idend', { wiggle: 0.25, angle: 0.7 });
  const rings = targets.map((t) => {
    const pts = [];
    for (let j = 0; j <= 40; j++) {
      const a = (j / 40) * TAU;
      pts.push(add(t.c, [Math.cos(a) * t.r, 0.12 * Math.sin(a * 3), Math.sin(a) * t.r * 0.8]));
    }
    return { ring: new Poly(pts), link: curve([S, lerp3(S, t.c, 0.5), add(t.c, [t.r, 0, 0])], 10) };
  });
  return { S, k, dend, rings };
}

function shapeHero(b, opts = {}) {
  const { R } = b;
  const portrait = !!opts.portrait;
  const SP = 0.8; // 路径参数间距：每 0.8 个世界单位一个放电周期
  const DELTA = 0.12; // 突触延迟（路径单位）
  // 文字留白区：描述文字背后不放星尘与神经毡，保证可读性
  const clear = (x, y, z) => Math.abs(x) < (portrait ? 1.6 : 2.3) && y > -1.2 && y < 0.1 && z > -2;

  // 皮层分层：L5 巨型锥体神经元（C/L/R，胞体在文字下方，顶树突穿过中空字母）、
  // L2/3 小锥体神经元（U，位于标题上方的顶带）、L6 深层神经元（D）
  const defs = portrait
    ? {
        C: { S: [0.0, -2.55, 0.3], k: 0.95, lean: 0, trunk: 3.9, obl: [0.6, 0.72, 0.84], tuft: 5, basal: 7, w: 0.3 },
        L: { S: [-1.2, -2.15, -0.3], k: 0.66, lean: 0.06, trunk: 3.4, w: 0.17 },
        R: { S: [1.25, -2.3, -0.2], k: 0.64, lean: -0.06, trunk: 3.4, w: 0.17 },
        U1: { S: [-0.85, 2.45, -0.8], k: 0.48, trunk: 1.6, axonLen: 1.1, w: 0.06 },
        U2: { S: [0.95, 2.75, -1.0], k: 0.46, trunk: 1.6, axonLen: 1.1, w: 0.06 },
      }
    : {
        C: { S: [0.35, -2.05, 0.25], k: 1.32, lean: 0, trunk: 3.45, obl: [0.6, 0.72, 0.84], tuft: 5, basal: 7, w: 0.26 },
        L: { S: [-3.85, -0.95, 0.35], k: 0.95, lean: 0.1, trunk: 3.5, w: 0.16 },
        R: { S: [3.75, -0.45, 0.05], k: 0.92, lean: -0.09, trunk: 3.35, w: 0.16 },
        U1: { S: [-1.95, 2.05, -0.9], k: 0.58, trunk: 1.6, axonLen: 1.1, w: 0.032 },
        U2: { S: [1.95, 2.2, -1.1], k: 0.56, trunk: 1.6, axonLen: 1.1, w: 0.032 },
        U3: { S: [-5.3, 1.6, -1.6], k: 0.56, trunk: 2.2, w: 0.028 },
        U4: { S: [5.3, 1.7, -1.9], k: 0.56, trunk: 2.2, w: 0.028 },
        D1: { S: [-1.9, -1.8, -1.9], k: 0.66, trunk: 2.6, w: 0.025 },
        D2: { S: [2.05, -2.35, -2.2], k: 0.64, trunk: 2.6, w: 0.025 },
      };
  const cells = {};
  for (const [id, d] of Object.entries(defs)) {
    cells[id] = buildPyramidal(R, d.S, d.k, d.lean ?? (R() - 0.5) * 0.12, {
      trunk: d.trunk,
      obliques: d.obl,
      tuft: d.tuft,
      basal: d.basal,
      axonLen: d.axonLen,
    });
    cells[id].id = id;
  }
  const { C, L, R: Rn } = cells;
  const basalOf = (n, sx) => add(n.S, [sx * 0.42 * n.k, -0.42 * n.k, (R() - 0.5) * 0.25]);

  // 有向连接链（DAG）：路径参数在突触两侧连续（只差一个突触延迟），波前与环境电流都能“接力”到下一个神经元
  const B = {};
  const edges = []; // 路径连续的接力连接 [突触前, 突触后, 入口离胞体的树突距离]
  const relay = (pre, dBout, post, dEntry) => {
    edges.push([pre.id, post.id, dEntry]);
    return B[pre.id] + (pre.dMax + dBout) / SP + DELTA - (post.dMax - dEntry) / SP;
  };
  const back = (pre, dBout, post, dEntry) => B[post.id] + (post.dMax - dEntry) / SP - DELTA - (pre.dMax + dBout) / SP;
  B.L = 0;
  const dLC = connect(R, L, C, basalOf(C, -1));
  B.C = relay(L, dLC, C, 0.6 * C.k);
  const dCR = connect(R, C, Rn, basalOf(Rn, -1));
  B.R = relay(C, dCR, Rn, 0.6 * Rn.k);
  const sources = [];
  const upTo = (u, post, uu) => {
    const dB = connect(R, u, post, post.trunk.poly.at(uu), 0.15);
    B[u.id] = back(u, dB, post, uu * post.trunk.poly.len);
    edges.push([u.id, post.id, uu * post.trunk.poly.len]);
  };
  if (cells.U3) upTo(cells.U3, L, 0.7);
  upTo(cells.U1, C, 0.72);
  upTo(cells.U2, Rn, 0.72);
  if (cells.U4) {
    const dB = connect(R, cells.U4, Rn, add(Rn.trunk.poly.at(1), [0.2, 0.25, 0]), 0.1);
    B.U4 = back(cells.U4, dB, Rn, Rn.trunk.poly.len + 0.3 * Rn.k);
    edges.push(['U4', 'R', Rn.trunk.poly.len + 0.3 * Rn.k]);
  }
  const shift = 0.25 - Math.min(...Object.values(B));
  for (const k of Object.keys(B)) B[k] += shift;

  // 只画不接力的连接：L5 常见的双向互连（Song et al., 2005）、深层输入、回响环路
  connect(R, C, L, basalOf(L, 1));
  connect(R, Rn, C, basalOf(C, 1));
  if (!portrait) {
    connect(R, cells.D1, L, basalOf(L, 1));
    connect(R, cells.D2, Rn, basalOf(Rn, -1));
    connect(R, C, cells.D2, basalOf(cells.D2, -1));
    // 回响环路（Hebb 1949）：右侧神经元的回返侧支沿右缘上升，从标题上方横越，止于左侧神经元的顶端树突簇
    const p0 = Rn.main.at(0.08);
    const tuftL = add(L.trunk.poly.at(1), [0.3, 0.15, 0]);
    const loop = curve([p0, [4.9, -0.6, -0.6], [5.05, 1.8, -0.9], [2.6, 2.78, -1.1], [0, 2.88, -1.2], [-2.5, 2.78, -0.9], tuftL], 18);
    const d0 = 0.08 * Rn.main.len;
    Rn.axon.push({ poly: loop, r0: 0.016, r1: 0.013, dist0: d0, kind: 'collateral' });
    Rn.boutons.push({ c: tuftL, dist: d0 + loop.len });
    Rn.boutons.push({ c: loop.at(0.55), dist: d0 + loop.len * 0.55 });
    B.D1 = 200;
    B.D2 = 225;
  }

  const sampleNeuron = (nr, count, B0, dim) => {
    const segs = [...nr.dend, ...nr.axon];
    const pk = makePicker(
      segs.map((sg) => sg.poly.len * (0.45 + sg.r0 * 9) * (sg.kind === 'apical' ? 1.35 : sg.kind === 'collateral' ? 1.5 : 1)),
      R,
    );
    const nSoma = Math.round(count * 0.13);
    // 每个突触小体最多约 40 个粒子（按总粒子数缩放），否则会挤成常亮的琥珀/白色光球，被 Bloom 放大
    const nBouton = nr.boutons.length ? Math.min(Math.round(count * 0.05), Math.round((40 * b.n * nr.boutons.length) / 32768)) : 0;
    const nAis = Math.round(count * 0.015);
    for (let k = 0; k < count; k++) {
      if (k < nSoma) {
        // 三角形（锥形）胞体：上窄下宽，外壳为主、内部少量填充；中心是薰衣草色的细胞核
        const d = onSphere(R);
        const taper = d[1] > 0 ? 1 - 0.62 * d[1] : 1 - 0.12 * d[1] * d[1];
        const nucleus = !dim && R() < 0.08;
        const fill = nucleus ? 0.35 * Math.cbrt(R()) : R() < 0.25 ? Math.cbrt(R()) : 1;
        const p = add(nr.S, [d[0] * 0.27 * nr.k * taper * fill, d[1] * 0.36 * nr.k * fill, d[2] * 0.25 * nr.k * taper * fill]);
        const c = nucleus ? PAL.lav : dim ? blueDim(R) : blueBright(R);
        b.addP(p, B0 + nr.dMax / SP + R() * 0.1, c, dim ? 0.8 : 1.2, nucleus);
        continue;
      }
      if (k < nSoma + nAis) {
        // 轴突起始段（动作电位的发起处）
        const u = R() * 0.12;
        const acc = !dim && R() < 0.3;
        b.addP(tubePoint(nr.main, u, 0.03 * nr.k, R, 0.3), B0 + (nr.dMax + u * nr.main.len) / SP, acc ? PAL.amber : PAL.c20, dim ? 0.7 : 1.1, acc);
        continue;
      }
      if (k < nSoma + nAis + nBouton) {
        const bt = nr.boutons[k % nr.boutons.length];
        const r = R();
        const acc = r < 0.32;
        // 路径值略加抖动：放电时小体逐粒闪亮，而不是整团同时爆亮；主体仍为低饱和蓝
        b.addP(add(bt.c, mul(onSphere(R), 0.06 * nr.k * Math.cbrt(R()))), B0 + (nr.dMax + bt.dist) / SP + R() * 0.2, r < 0.2 ? PAL.amber : r < 0.32 ? PAL.lav : r < 0.7 ? PAL.c30 : PAL.c40, 1.0, acc && !dim);
        continue;
      }
      const sg = segs[pk()];
      const u = R();
      let r = lerp(sg.r0, sg.r1, u) * (0.5 + 0.5 * R());
      const isAxon = sg.kind === 'axon' || sg.kind === 'collateral';
      if (!isAxon && R() < 0.15) r += (0.025 + R() * 0.045) * nr.k; // 树突棘
      const p = add(sg.poly.at(u), mul(randPerp(sg.poly.tangent(u), R), r));
      const d = sg.dist0 + u * sg.poly.len;
      const path = isAxon ? B0 + (nr.dMax + d) / SP : B0 + (nr.dMax - d) / SP;
      let c;
      let acc = false;
      if (dim) c = blueDim(R);
      else if (isAxon) {
        // 有髓轴突：间断的髓鞘节段用水青点缀
        const myelin = sg.kind === 'axon' && Math.sin(d * 14) > 0.2;
        acc = myelin && R() < 0.3;
        c = acc ? PAL.aqua : sg.kind === 'collateral' ? PAL.c20 : PAL.c30;
      } else {
        acc = R() < 0.04;
        c = acc ? PAL.lav : sg.kind === 'apical' ? (R() < 0.5 ? PAL.c30 : PAL.c40) : blue(R);
      }
      b.addP(p, path, c, dim ? 0.65 : sg.kind === 'collateral' ? 0.95 : isAxon ? 0.8 : 0.88, acc, !isAxon);
    }
  };

  // 背景“森林”：更小、更暗的锥体神经元（标题区域内的胞体会被重新抽取）
  const forest = [];
  const nF = portrait ? 5 : 10;
  for (let i = 0; i < nF; i++) {
    let x;
    let y;
    for (let t = 0; t < 40; t++) {
      x = portrait ? -2.2 + (4.4 * i) / (nF - 1) + (R() - 0.5) * 0.3 : -6.5 + (13 * i) / (nF - 1) + (R() - 0.5) * 0.6;
      y = -2.8 + R() * 4.6;
      if (Math.abs(x) >= (portrait ? 9 : 5) || y < -0.3 || y > 1.7) break;
    }
    forest.push(buildPyramidal(R, [x, y, -5 + R() * 1.5], 0.38 + R() * 0.12, (R() - 0.5) * 0.2));
  }
  const baskets = portrait
    ? [buildBasket(R, [-0.9, -2.6, 0.6], 0.7, [{ c: C.S, r: 0.42 * C.k }])]
    : [
        buildBasket(R, [-2.5, -2.5, 0.8], 0.85, [{ c: C.S, r: 0.42 * C.k }, { c: L.S, r: 0.4 * L.k }]),
        buildBasket(R, [2.6, -2.6, 0.7], 0.85, [{ c: Rn.S, r: 0.4 * Rn.k }, { c: C.S, r: 0.44 * C.k }]),
      ];

  // 粒子预算：锥体神经元（连同轴突与突触小体）约占 82%
  const ids = Object.keys(defs);
  const wCells = ids.map((id) => defs[id].w);
  const wRest = portrait ? [0.07, 0.025, 0.045, 0.11] : [0.07, 0.025, 0.045, 0.11];
  const counts = alloc(b.n, [...wCells, ...wRest]);
  // 记录每个粒子属于哪个神经元：点击树突时据此找到它的胞体（分级电位在胞体处“再生”为动作电位）
  const order = ['C', 'L', 'R', 'U1', 'U2', 'U3', 'U4', 'D1', 'D2'].filter((id) => cells[id]);
  b.owner = new Uint8Array(b.n).fill(255);
  ids.forEach((id, i) => {
    b.curOwner = order.indexOf(id) < 0 ? 255 : order.indexOf(id);
    sampleNeuron(cells[id], counts[i], B[id], false);
  });
  b.curOwner = 255;
  const [cForest, cBasket, cNeuropil, cDust] = counts.slice(ids.length);
  const fc = alloc(cForest, forest.map(() => 1));
  forest.forEach((n, i) => sampleNeuron(n, fc[i], 300 + 9 * i, true));
  for (let k = 0; k < cBasket; k++) {
    const bk = baskets[k % baskets.length];
    const r = R();
    let p;
    if (r < 0.15) p = add(bk.S, mul(onSphere(R), 0.1 * bk.k));
    else if (r < 0.45) {
      const sg = bk.dend[Math.floor(R() * bk.dend.length)];
      p = tubePoint(sg.poly, R(), 0.015, R, 0.3);
    } else {
      const rg = bk.rings[Math.floor(R() * bk.rings.length)];
      p = r < 0.6 ? tubePoint(rg.link, R(), 0.012, R, 0.3) : add(rg.ring.at(R()), mul(onSphere(R), 0.02));
    }
    b.addP(p, -1, R() < 0.6 ? PAL.orchid : PAL.c40, 0.8, true);
  }
  // 神经毡：树突周围稀疏的微光
  const allDend = ids.flatMap((id) => cells[id].dend);
  const pd = makePicker(
    allDend.map((sg) => sg.poly.len),
    R,
  );
  for (let k = 0; k < cNeuropil; k++) {
    const sg = allDend[pd()];
    const p = add(sg.poly.at(R()), mul(onSphere(R), 0.08 + R() * 0.28));
    if (clear(p[0], p[1], p[2])) {
      k--;
      continue;
    }
    const acc = R() < 0.08;
    b.addP(p, R() < 0.3 ? 400 + R() * 30 : -1, acc ? PAL.lav : blueDim(R), 0.55, acc);
  }
  addDust(b, cDust, clear);

  const src = portrait ? cells.U1 : cells.U3;
  b.meta = {
    somata: order.map((id) => ({ id, p: cells[id].S.slice(), k: cells[id].k, path: B[id] + cells[id].dMax / SP })),
    source: { p: src.S.slice(), path: B[src.id] + src.dMax / SP, owner: order.indexOf(src.id) },
    // 突触后神经元的入口路径 = 突触小体路径 + 突触延迟（relay / back 的定义保证了这一点）
    edges: edges.map(([a, p, dE]) => ({ pre: order.indexOf(a), post: order.indexOf(p), entry: B[p] + (cells[p].dMax - dE) / SP })),
    bands: [
      [0, 200],
      [200, 300],
      [300, 400],
      [400, 440],
    ],
    directional: true,
  };
}

// ===================================================================
// 1 · 大脑：两半球（回/沟纹理）+ 颞叶 + 小脑叶片 + 脑干 + 内部白质纤维
// ===================================================================
function shapeBrain(b) {
  const { R, noise } = b;
  const [cCortex, cCereb, cStem, cFib, cDust] = alloc(b.n, [0.6, 0.12, 0.045, 0.145, 0.09]);
  b.off = [0.05, 0.22, 0];
  const A = 1.72;
  const B = 1.12;
  const C = 0.7;
  const H = [
    { cx: 0, cy: 0.32, cz: 0.73, side: 1 },
    { cx: 0, cy: 0.32, cz: -0.73, side: -1 },
  ];
  const TA = 1.0;
  const TB = 0.46;
  const TC = 0.46;
  const T = [
    { cx: 0.05, cy: -0.4, cz: 0.84, side: 1 },
    { cx: 0.05, cy: -0.4, cz: -0.84, side: -1 },
  ];
  const hemiPoint = (h, d) => {
    const medial = Math.sign(d[2]) !== h.side;
    const x = d[0] * A;
    const y = d[1] * B * (d[1] < 0 ? 0.68 : 1) - 0.1 * Math.max(0, d[0]) ** 2;
    const z = d[2] * C * (medial ? 0.84 : 1) * (1 - 0.16 * d[0] * d[0]);
    return [h.cx + x, h.cy + y, h.cz + z];
  };
  const insideHemi = (p, s) => {
    for (const h of H) {
      const dx = (p[0] - h.cx) / A;
      const ry = p[1] - h.cy;
      const dy = ry / (B * (ry < 0 ? 0.68 : 1));
      const medial = Math.sign(p[2] - h.cz) !== h.side;
      const dz = (p[2] - h.cz) / (C * (medial ? 0.84 : 1) * (1 - 0.16 * Math.min(1, dx * dx)));
      if (dx * dx + dy * dy + dz * dz < s * s) return true;
    }
    return false;
  };
  const insideTemporal = (p, s) => {
    for (const t of T) {
      const dx = (p[0] - t.cx) / TA;
      const dy = (p[1] - t.cy) / TB;
      const dz = (p[2] - t.cz) / TC;
      if (dx * dx + dy * dy + dz * dz < s * s) return true;
    }
    return false;
  };
  const lobeAccent = { frontal: PAL.lav, parietal: PAL.aqua, occipital: PAL.orchid, temporal: PAL.mint };

  let guard = 0;
  for (let k = 0; k < cCortex && guard < cCortex * 40; guard++) {
    const isT = R() < 0.2;
    const side = R() < 0.5 ? 0 : 1;
    const d = onSphere(R);
    let p;
    let cen;
    if (!isT) {
      cen = H[side];
      p = hemiPoint(cen, d);
      if (insideTemporal(p, 0.98)) continue;
    } else {
      cen = T[side];
      if (d[2] * cen.side < -0.25) continue;
      p = [cen.cx + d[0] * TA, cen.cy + d[1] * TB, cen.cz + d[2] * TC];
      if (insideHemi(p, 0.985)) continue;
    }
    const s = 2.5;
    const n1 = noise(p[0] * s, p[1] * s, p[2] * s);
    const n2 = noise(p[0] * s * 2.2 + 11, p[1] * s * 2.2, p[2] * s * 2.2);
    const sulc = smooth(0.02, 0.16, Math.abs(n1)) * (0.55 + 0.45 * smooth(0, 0.12, Math.abs(n2)));
    if (R() > 0.1 + 0.9 * sulc) continue;
    if (!isT && p[1] > -0.1) {
      const xc = 0.38 - 0.34 * p[1] + 0.05 * n2;
      if (Math.abs(p[0] - xc) < 0.035) continue;
    }
    const inward = (1 - sulc) * 0.07;
    p = [p[0] - (p[0] - cen.cx) * inward, p[1] - (p[1] - cen.cy) * inward, p[2] - (p[2] - cen.cz) * inward];
    let lobe = 'parietal';
    if (isT) lobe = 'temporal';
    else if (p[0] < -1.12) lobe = 'occipital';
    else if (p[0] > 0.38 - 0.34 * p[1]) lobe = 'frontal';
    const acc = R() < 0.13;
    const crown = sulc > 0.85 && Math.abs(n1) > 0.32;
    const c = acc ? lobeAccent[lobe] : crown ? blueBright(R) : blue(R);
    const path = R() < 0.4 ? (p[0] + 2.0) * 0.55 + n2 * 0.25 : -1;
    b.addP(p, path, c, crown ? 1.12 : 0.95, acc);
    k++;
  }
  while (b.i < cCortex) b.addP(hemiPoint(H[0], onSphere(R)), -1, blue(R), 0.9, false);

  const CB = { cx: -1.18, cy: -0.72, cz: 0, a: 0.62, b: 0.4, c: 0.98 };
  guard = 0;
  for (let k = 0; k < cCereb && guard < cCereb * 40; guard++) {
    const d = onSphere(R);
    const p = [CB.cx + d[0] * CB.a, CB.cy + d[1] * CB.b, CB.cz + d[2] * CB.c];
    if (insideHemi(p, 1.0)) continue;
    if (Math.abs(p[2]) < 0.045) continue;
    const st = Math.sin((p[1] - p[0] * 0.35) * 48 + noise(p[0] * 3, p[1] * 3, p[2] * 3) * 2.5);
    if (st < -0.15) continue;
    const acc = R() < 0.18;
    b.addP(p, -1, acc ? PAL.lav : st > 0.7 ? PAL.c30 : blue(R), 0.85, acc);
    k++;
  }
  const filled = cCortex + cCereb;
  while (b.i < filled) b.addP([CB.cx, CB.cy - 0.3, 0], -1, PAL.c60, 0.6, false);

  const stem = curve(
    [
      [-0.42, -0.38, 0],
      [-0.5, -0.95, 0],
      [-0.55, -1.5, 0],
      [-0.58, -2.05, 0],
    ],
    12,
  );
  for (let k = 0; k < cStem; k++) {
    const u = R();
    const r = 0.23 - 0.07 * u + 0.08 * Math.exp(-(((u - 0.35) / 0.15) ** 2));
    b.addP(tubePoint(stem, u, r, R, 0.85), (u * stem.len) / 0.7, blue(R), 0.9, false);
  }

  const fibers = [];
  for (let f = 0; f < 84; f++) {
    let ctrl;
    if (f < 38) {
      const x0 = -1.1 + R() * 2.0;
      const a = [x0, 0.1 + R() * 0.55, 0.5 + R() * 0.35];
      const e = [x0 + (R() - 0.5) * 0.4, 0.1 + R() * 0.55, -(0.5 + R() * 0.35)];
      ctrl = [a, [a[0], a[1] + 0.18, 0.3], [(a[0] + e[0]) / 2, 0.62 + R() * 0.2, 0], [e[0], e[1] + 0.18, -0.3], e];
    } else {
      const sd = R() < 0.5 ? 1 : -1;
      const a = [1.15 - R() * 0.35, R() * 0.7 - 0.15, sd * (0.55 + R() * 0.25)];
      const e = [-1.25 + R() * 0.35, R() * 0.6 - 0.05, sd * (0.55 + R() * 0.25)];
      ctrl = [a, [0, 0.55 + R() * 0.35, sd * 0.62], e];
    }
    const acc = R() < 0.26;
    fibers.push({
      poly: curve(ctrl, 10),
      c: acc ? pick(R, [PAL.aqua, PAL.lav, PAL.amber]) : blueBright(R),
      acc,
      off: R() * 4,
    });
  }
  const pfib = makePicker(
    fibers.map((f) => f.poly.len),
    R,
  );
  for (let k = 0; k < cFib; k++) {
    const f = fibers[pfib()];
    const u = R();
    b.addP(add(f.poly.at(u), mul(onSphere(R), 0.012)), (u * f.poly.len) / 0.85 + f.off, f.c, 0.8, f.acc);
  }
  addDust(b, cDust);
}

// ===================================================================
// 2 · 神经元与胶质细胞
// ===================================================================
function growBranch(R, segs, start, dir, length, rad, depth, maxDepth, dist0, kind, opt) {
  const steps = 7;
  const pts = [start.slice()];
  let p = start.slice();
  let d = dir.slice();
  for (let i = 1; i <= steps; i++) {
    d = norm(add(d, mul(onSphere(R), opt.wiggle)));
    p = add(p, mul(d, length / steps));
    pts.push(p.slice());
  }
  const poly = new Poly(pts);
  const seg = { poly, r0: rad, r1: rad * 0.72, dist0, kind, leaf: depth >= maxDepth };
  segs.push(seg);
  if (depth < maxDepth) {
    const nc = depth === 0 && R() < 0.4 ? 3 : 2;
    for (let c = 0; c < nc; c++) {
      growBranch(
        R,
        segs,
        p,
        deviate(d, opt.angle * (0.6 + R() * 0.6), R),
        length * (0.58 + R() * 0.22),
        rad * 0.72,
        depth + 1,
        maxDepth,
        dist0 + poly.len,
        kind,
        opt,
      );
    }
  }
  return seg;
}

function shapeNeuron(b) {
  const { R } = b;
  const [cSoma, cNuc, cDend, cAxon, cMyelin, cTerm, cAstro, cCap, cOligo, cBg, cDust] = alloc(b.n, [
    0.05, 0.008, 0.27, 0.04, 0.09, 0.05, 0.17, 0.055, 0.04, 0.07, 0.087,
  ]);
  b.off = [-0.05, -0.18, 0];
  const D0 = 4.2;
  const S = [-0.75, -0.25, 0];

  // 胞体（锥体形）
  for (let k = 0; k < cSoma; k++) {
    const d = onSphere(R);
    const taper = d[1] > 0 ? 1 - 0.45 * d[1] : 1;
    const p = [S[0] + d[0] * 0.3 * taper, S[1] + d[1] * 0.42, S[2] + d[2] * 0.3 * taper];
    const acc = R() < 0.06;
    b.addP(p, D0 / 0.75 + R() * 0.15, acc ? PAL.amber : blueBright(R), 1.1, acc);
  }
  for (let k = 0; k < cNuc; k++) {
    b.addP(add(S, mul(inSphere(R), 0.13)), -1, PAL.lav, 1.0, true);
  }

  // 树突
  const dend = [];
  const opt = { wiggle: 0.12, angle: 0.55 };
  const apical = growBranch(R, dend, add(S, [0, 0.38, 0]), norm([0.06, 1, 0.02]), 1.85, 0.055, 0, 0, 0, 'dend', {
    wiggle: 0.05,
    angle: 0,
  });
  const top = apical.poly.at(1);
  for (let i = 0; i < 3; i++) {
    growBranch(R, dend, top, deviate([0, 1, 0], 0.5 + R() * 0.4, R), 0.6, 0.03, 0, 2, apical.poly.len, 'dend', {
      wiggle: 0.18,
      angle: 0.6,
    });
  }
  for (const u of [0.28, 0.45, 0.62, 0.78]) {
    growBranch(
      R,
      dend,
      apical.poly.at(u),
      deviate([0, 1, 0], 1.0 + R() * 0.3, R),
      0.55 + R() * 0.25,
      0.025,
      0,
      1,
      u * apical.poly.len,
      'dend',
      opt,
    );
  }
  for (let i = 0; i < 6; i++) {
    const ph = (i / 6) * TAU + R() * 0.5;
    const dir = norm([Math.cos(ph) * 0.9, -0.55 - R() * 0.4, Math.sin(ph) * 0.9]);
    growBranch(R, dend, add(S, mul(dir, 0.28)), dir, 0.75 + R() * 0.25, 0.035, 0, 2, 0, 'dend', opt);
  }
  const pd = makePicker(
    dend.map((s) => s.poly.len * (0.5 + s.r0 * 8)),
    R,
  );
  for (let k = 0; k < cDend; k++) {
    const s = dend[pd()];
    const u = R();
    let r = lerp(s.r0, s.r1, u) * (0.6 + 0.4 * R());
    if (R() < 0.15) r += 0.03 + R() * 0.05; // 树突棘
    const c = s.poly.at(u);
    const p = add(c, mul(randPerp(s.poly.tangent(u), R), r));
    const acc = R() < 0.05;
    b.addP(p, (D0 - (s.dist0 + u * s.poly.len)) / 0.75, acc ? PAL.orchid : blue(R), 0.85, acc, true);
  }

  // 轴突 + 髓鞘（郎飞结间隙）+ 终末
  const axon = curve(
    [
      [-0.75, -0.67, 0],
      [-0.72, -1.2, 0.05],
      [-0.45, -1.75, 0.1],
      [0.3, -2.05, 0.15],
      [1.2, -2.0, 0.1],
      [1.95, -1.65, 0],
    ],
    14,
  );
  for (let k = 0; k < cAxon; k++) {
    const u = R();
    b.addP(tubePoint(axon, u, 0.022, R, 0.3), (D0 + u * axon.len) / 0.75, PAL.c30, 0.85, false);
  }
  const internodes = [];
  {
    let s = 0.16 * axon.len;
    const end = 0.86 * axon.len;
    while (s + 0.3 < end) {
      internodes.push([s / axon.len, (s + 0.36) / axon.len]);
      s += 0.36 + 0.045;
    }
  }
  const O = [0.75, -1.25, 0.6];
  const linked = new Set();
  const byDist = internodes
    .map((iv, i) => [i, len(sub(axon.at((iv[0] + iv[1]) / 2), O))])
    .sort((a, b2) => a[1] - b2[1]);
  for (let i = 0; i < 3; i++) linked.add(byDist[i][0]);
  for (let k = 0; k < cMyelin; k++) {
    const idx = Math.floor(R() * internodes.length);
    const [u0, u1] = internodes[idx];
    const u = lerp(u0, u1, R());
    const edge = Math.min(u - u0, u1 - u) / (u1 - u0);
    const r = 0.075 * smooth(0, 0.12, edge) + 0.025;
    const p = tubePoint(axon, u, r, R, 0.9);
    const acc = linked.has(idx) ? R() < 0.35 : R() < 0.18;
    const c = acc ? (linked.has(idx) ? PAL.lav : PAL.aqua) : R() < 0.5 ? PAL.c20 : PAL.c30;
    b.addP(p, (D0 + u * axon.len) / 0.75, c, 1.0, acc);
  }
  const term = [];
  const aEnd = axon.at(1);
  for (let i = 0; i < 3; i++) {
    growBranch(R, term, aEnd, deviate(axon.tangent(1), 0.5 + R() * 0.4, R), 0.32, 0.015, 0, 2, axon.len, 'term', {
      wiggle: 0.2,
      angle: 0.7,
    });
  }
  const leaves = term.filter((s) => s.leaf).map((s) => s.poly.at(1));
  const pt = makePicker(
    term.map((s) => s.poly.len),
    R,
  );
  for (let k = 0; k < cTerm; k++) {
    if (k % 3 === 0) {
      const lf = leaves[Math.floor(R() * leaves.length)];
      const acc = R() < 0.4;
      b.addP(add(lf, mul(onSphere(R), 0.045)), (D0 + axon.len + 1.2) / 0.75, acc ? PAL.amber : PAL.c30, 1.05, acc);
    } else {
      const s = term[pt()];
      const u = R();
      b.addP(tubePoint(s.poly, u, 0.015, R, 0.3), (D0 + s.dist0 + u * s.poly.len) / 0.75, blue(R), 0.85, false);
    }
  }

  // 星形胶质细胞 + 毛细血管（终足）
  const A0 = [1.3, 1.15, -0.35];
  const cap = curve(
    [
      [0.1, 2.35, -0.9],
      [0.9, 2.05, -0.6],
      [1.8, 1.95, -0.2],
      [2.5, 2.2, 0.2],
    ],
    12,
  );
  const astro = [];
  for (let i = 0; i < 18; i++) {
    const d = norm(add(fib(i, 18), mul(onSphere(R), 0.25)));
    growBranch(R, astro, add(A0, mul(d, 0.15)), d, 0.45 + R() * 0.45, 0.03, 0, 1 + (R() < 0.5 ? 1 : 0), 0, 'astro', {
      wiggle: 0.35,
      angle: 0.7,
    });
  }
  const footU = 0.45;
  const foot = cap.at(footU);
  astro.push({ poly: curve([A0, lerp3(A0, foot, 0.5), foot], 8), r0: 0.03, r1: 0.04, dist0: 0, kind: 'astro' });
  const pa = makePicker(
    astro.map((s) => s.poly.len),
    R,
  );
  for (let k = 0; k < cAstro; k++) {
    if (k < cAstro * 0.12) {
      const acc = R() < 0.4;
      b.addP(add(A0, mul(onSphere(R), 0.17 * (0.85 + 0.15 * R()))), -1, acc ? PAL.mint : blueBright(R), 1.05, acc);
      continue;
    }
    const s = astro[pa()];
    const u = R();
    const fuzzy = R() < 0.45;
    const p = fuzzy ? add(s.poly.at(u), mul(onSphere(R), (0.02 + 0.06 * u) * Math.sqrt(R()) * 1.6)) : tubePoint(s.poly, u, 0.02, R, 0.3);
    const acc = R() < 0.4;
    b.addP(p, (s.dist0 + u * s.poly.len) / 0.5 + 9, acc ? PAL.mint : blue(R), fuzzy ? 0.7 : 0.85, acc);
  }
  for (let k = 0; k < cCap; k++) {
    const u = R();
    const near = Math.abs(u - footU) < 0.07 && R() < 0.5;
    const p = tubePoint(cap, u, near ? 0.16 : 0.14, R, 0.9);
    const acc = near || R() < 0.45;
    b.addP(p, (u * cap.len) / 0.6, near ? PAL.mint : acc ? PAL.coral : blueDim(R), 0.8, acc);
  }

  // 少突胶质细胞：伸出突起包裹邻近的髓鞘节段
  const oligo = [];
  for (const idx of linked) {
    const iv = internodes[idx];
    const target = axon.at((iv[0] + iv[1]) / 2);
    const mid = add(lerp3(O, target, 0.5), [0, 0.15, 0.1]);
    oligo.push(curve([O, mid, target], 8));
  }
  const po = makePicker(
    oligo.map((p) => p.len),
    R,
  );
  for (let k = 0; k < cOligo; k++) {
    const acc = R() < 0.4;
    const c = acc ? PAL.lav : blue(R);
    if (k < cOligo * 0.3) b.addP(add(O, mul(onSphere(R), 0.12)), -1, c, 1.0, acc);
    else {
      const p = oligo[po()];
      b.addP(tubePoint(p, R(), 0.018, R, 0.3), -1, c, 0.85, acc);
    }
  }

  // 远处的背景神经元（营造组织纵深）
  const bg = [];
  for (const [cx, cy, cz] of [
    [-2.25, 1.55, -2.2],
    [2.35, -0.25, -2.6],
    [-1.6, -2.3, -1.8],
  ]) {
    const c0 = [cx, cy, cz];
    for (let i = 0; i < 5; i++) {
      growBranch(R, bg, c0, onSphere(R), 0.45 + R() * 0.3, 0.02, 0, 1, 0, 'bg', { wiggle: 0.2, angle: 0.6 });
    }
    growBranch(R, bg, c0, norm([R() - 0.5, -1, R() - 0.5]), 1.0, 0.015, 0, 0, 0, 'bg', { wiggle: 0.1, angle: 0 });
  }
  const pb = makePicker(
    bg.map((s) => s.poly.len),
    R,
  );
  for (let k = 0; k < cBg; k++) {
    const s = bg[pb()];
    const u = R();
    b.addP(tubePoint(s.poly, u, 0.02, R, 0.2), (u * s.poly.len) / 0.6 + 20, blueDim(R), 0.7, false);
  }
  addDust(b, cDust);
}

// ===================================================================
// 3 · 突触：突触前终扣（囊泡、线粒体）→ 突触间隙 → 树突棘（PSD 受体）
// ===================================================================
function shapeSynapse(b) {
  const { R } = b;
  const [cPre, cAx, cVes, cMito, cCleft, cSpine, cNeck, cShaft, cPsd, cAstro, cNew, cDust] = alloc(b.n, [
    0.17, 0.05, 0.14, 0.06, 0.07, 0.15, 0.03, 0.09, 0.06, 0.05, 0.03, 0.1,
  ]);
  b.off = [0, -0.05, 0];
  const BC = [0, 1.42, 0];
  const BR = 1.15;
  const preSurface = (d) => {
    const y = d[1] >= 0 ? d[1] * BR : -0.82 * BR * Math.pow(-d[1], 0.38);
    return [BC[0] + d[0] * BR, BC[1] + y, BC[2] + d[2] * BR];
  };
  for (let k = 0; k < cPre; k++) {
    const d = onSphere(R);
    if (d[1] > 0.82 && Math.hypot(d[0] + 0.25, d[2]) < 0.3) {
      k--;
      continue;
    }
    const p = add(preSurface(d), mul(onSphere(R), 0.015));
    b.addP(p, -1, R() < 0.12 ? PAL.c20 : blue(R), 0.9, false);
  }
  const ax = curve(
    [
      [-0.2, 2.45, 0],
      [-0.45, 2.9, 0],
      [-0.95, 3.35, 0],
    ],
    10,
  );
  for (let k = 0; k < cAx; k++) {
    const u = R();
    b.addP(tubePoint(ax, u, 0.3 - 0.06 * u, R, 0.9), ((1 - u) * ax.len) / 0.5, blue(R), 0.9, false);
  }
  // 囊泡
  const ves = [];
  for (let t = 0; t < 2000 && ves.length < 46; t++) {
    const y = 0.68 + 1.3 * Math.pow(R(), 1.8);
    const maxR = Math.sqrt(Math.max(0, BR * BR - (y - BC[1]) ** 2)) - 0.2;
    if (maxR <= 0.05) continue;
    const a = R() * TAU;
    const rr = Math.sqrt(R()) * maxR;
    const c = [Math.cos(a) * rr, y, Math.sin(a) * rr];
    if (ves.some((v) => len(sub(v.c, c)) < 0.21)) continue;
    ves.push({ c, r: 0.085 + R() * 0.02, fuse: false });
  }
  for (let i = 0; i < 7; i++) {
    const x = -0.6 + (1.2 * i) / 6 + (R() - 0.5) * 0.05;
    ves.push({ c: [x, 0.6, (R() - 0.5) * 0.4], r: 0.09, fuse: i === 2 || i === 5 });
  }
  for (let k = 0; k < cVes; k++) {
    const v = ves[Math.floor(R() * ves.length)];
    let d = onSphere(R);
    if (v.fuse && d[1] < -0.2) d = [d[0], Math.abs(d[1]) * 0.3, d[2]]; // 胞吐：Ω 形开口
    const acc = R() < 0.5;
    b.addP(add(v.c, mul(d, v.r)), -1, acc ? pick(R, [PAL.lav, PAL.orchid]) : PAL.c30, 0.8, acc);
  }
  // 线粒体（含嵴）
  const mitos = [
    { c: [-0.45, 1.78, 0.25], ax: norm([1, 0.4, 0.1]), L: 0.75, r: 0.17 },
    { c: [0.52, 1.95, -0.3], ax: norm([1, -0.3, 0.3]), L: 0.6, r: 0.14 },
  ];
  for (let k = 0; k < cMito; k++) {
    const m = mitos[k % 2];
    const [n1, n2] = perpBasis(m.ax);
    const s = (R() - 0.5) * m.L;
    const a = R() * TAU;
    let p;
    if (R() < 0.7) {
      const cap = Math.max(0, Math.abs(s) - m.L / 2 + m.r);
      const rr = Math.sqrt(Math.max(0, m.r * m.r - cap * cap));
      p = add(add(m.c, mul(m.ax, s)), add(mul(n1, Math.cos(a) * rr), mul(n2, Math.sin(a) * rr)));
    } else {
      const ridge = Math.round(s / 0.1) * 0.1;
      const w = (R() - 0.5) * 2 * m.r * 0.8;
      p = add(add(m.c, mul(m.ax, ridge + Math.sin(w * 20) * 0.02)), mul(n1, w));
    }
    const acc = R() < 0.45;
    b.addP(p, -1, acc ? PAL.mint : PAL.c40, 0.8, acc);
  }
  // 突触间隙中的递质
  const fuseV = ves.filter((v) => v.fuse);
  for (let k = 0; k < cCleft; k++) {
    let p;
    if (R() < 0.45) {
      const v = fuseV[Math.floor(R() * fuseV.length)];
      p = [v.c[0] + gauss(R) * 0.12, 0.48 - R() * 0.3, v.c[2] + gauss(R) * 0.12];
    } else {
      const a = R() * TAU;
      const rr = Math.sqrt(R()) * 0.9;
      p = [Math.cos(a) * rr, 0.18 + R() * 0.28, Math.sin(a) * rr];
    }
    const r = R();
    const acc = r < 0.6;
    const c = r < 0.42 ? PAL.amber : r < 0.6 ? PAL.lav : PAL.c30;
    b.addP(p, (0.5 - p[1]) / 0.12 + R() * 0.5, c, 0.75, acc);
  }
  // 突触后：蘑菇形树突棘
  const SC = [0, -0.38, 0];
  for (let k = 0; k < cSpine; k++) {
    const d = onSphere(R);
    let y;
    let hr = 0.78;
    if (d[1] >= 0) y = SC[1] + 0.52 * Math.pow(d[1], 0.4);
    else {
      y = SC[1] + 0.6 * d[1];
      hr *= 1 - 0.6 * d[1] * d[1];
    }
    const p = [d[0] * hr, y, d[2] * hr];
    if (y < -0.85 && Math.hypot(p[0], p[2]) < 0.2) {
      k--;
      continue;
    }
    b.addP(add(p, mul(onSphere(R), 0.012)), -1, R() < 0.1 ? PAL.c20 : blue(R), 0.9, false);
  }
  const neck = curve(
    [
      [0, -0.92, 0],
      [0.05, -1.4, 0],
      [0, -1.95, 0],
    ],
    8,
  );
  for (let k = 0; k < cNeck; k++) {
    const u = R();
    b.addP(tubePoint(neck, u, 0.21, R, 0.9), (u * neck.len) / 0.4 + 6, blue(R), 0.85, false);
  }
  for (let k = 0; k < cShaft; k++) {
    const x = (R() * 2 - 1) * 2.3;
    if (R() > 1 - smooth(1.6, 2.3, Math.abs(x)) * 0.85) {
      k--;
      continue;
    }
    const a = R() * TAU;
    const r = 0.45 * (0.92 + 0.08 * R());
    b.add(x, -2.38 + Math.cos(a) * r, Math.sin(a) * r, (2.3 - x) / 0.8, blue(R), 0.85, false);
  }
  // PSD + 受体（AMPA / NMDA）
  const rec = [];
  for (let i = 0; i < 28; i++) {
    const a = R() * TAU;
    const rr = Math.sqrt(R()) * 0.58;
    rec.push({ c: [Math.cos(a) * rr, 0.17, Math.sin(a) * rr], col: R() < 0.55 ? PAL.coral : PAL.orchid });
  }
  for (let k = 0; k < cPsd; k++) {
    if (R() < 0.45) {
      const r = rec[Math.floor(R() * rec.length)];
      b.addP(add(r.c, mul(onSphere(R), 0.035)), 1.2 + R() * 0.3, r.col, 0.9, true);
    } else {
      const a = R() * TAU;
      const rr = Math.pow(R(), 0.7) * 0.62;
      b.add(Math.cos(a) * rr, 0.08 + R() * 0.06, Math.sin(a) * rr, -1, R() < 0.5 ? PAL.c20 : PAL.c30, 0.95, false);
    }
  }
  // 星形胶质突起包绕（三方突触）
  for (let k = 0; k < cAstro; k++) {
    const a = lerp(3.6, 6.0, R());
    const y = lerp(-0.35, 0.95, R());
    const r = 1.38 + 0.1 * Math.sin(a * 5 + y * 4);
    const acc = R() < 0.55;
    b.add(Math.cos(a) * r, y, Math.sin(a) * r, -1, acc ? PAL.mint : PAL.c50, 0.75, acc);
  }
  // 新生树突棘（结构可塑性）
  const nsp = curve(
    [
      [1.55, -1.95, 0.1],
      [1.68, -1.6, 0.12],
      [1.78, -1.2, 0.1],
    ],
    8,
  );
  for (let k = 0; k < cNew; k++) {
    const head = R() < 0.4;
    const p = head ? add(nsp.at(1), mul(onSphere(R), 0.12)) : tubePoint(nsp, R(), 0.05, R, 0.8);
    const acc = R() < 0.5;
    b.addP(p, -1, acc ? PAL.amber : PAL.c30, 0.9, acc);
  }
  addDust(b, cDust);
}

// ===================================================================
// 4 · 神经束：DTI 风格纤维束（胼胝体弓 / 弓状束 S 形 / 放射冠-内囊下行束）
// ===================================================================
function shapeTracts(b) {
  const { R } = b;
  const [cFib, cHalo, cDust] = alloc(b.n, [0.86, 0.04, 0.1]);
  const bundles = [
    {
      ctrl: [
        [-2.1, -1.9, 0.2],
        [-1.75, 0.1, 0.1],
        [-0.9, 1.45, 0],
        [0, 1.75, 0],
        [0.9, 1.45, 0],
        [1.75, 0.1, -0.1],
        [2.1, -1.9, -0.2],
      ],
      fibers: 58,
      r: 0.24,
      fanA: 2.4,
      fanB: 2.4,
      twist: 1.2 * Math.PI,
      tint: PAL.coral,
      tintP: 0.24,
      dir: 1,
    },
    // 左右弓状束：在矢状面上绕外侧裂呈 C 形（额叶 Broca ↔ 颞叶 Wernicke）
    ...[-1, 1].map((sx) => ({
      ctrl: [
        [sx * 1.05, -0.75, 1.55],
        [sx * 1.3, 0.25, 1.05],
        [sx * 1.4, 0.8, 0.0],
        [sx * 1.3, 0.25, -1.1],
        [sx * 1.0, -0.85, -1.55],
      ],
      fibers: 22,
      r: 0.13,
      fanA: 2.2,
      fanB: 2.2,
      twist: Math.PI,
      tint: PAL.mint,
      tintP: 0.26,
      dir: 0,
    })),
    {
      ctrl: [
        [0.25, 2.35, 0.25],
        [0.15, 1.2, 0.2],
        [0, 0, 0.1],
        [-0.1, -1.4, 0],
        [-0.05, -2.7, 0],
      ],
      fibers: 50,
      r: 0.13,
      fanA: 7.0,
      fanB: 1.2,
      twist: 0.8 * Math.PI,
      tint: PAL.aqua,
      tintP: 0.16,
      dir: 1,
    },
  ];
  const fibers = [];
  for (const B of bundles) {
    const center = curve(B.ctrl, 20);
    const fr = transportFrames(center);
    const n = center.pts.length;
    for (let f = 0; f < B.fibers; f++) {
      const phi = R() * TAU;
      const rho = Math.sqrt(R());
      const wob = R() * TAU;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const endA = smooth(0.18, 0, t);
        const endB = smooth(0.82, 1, t);
        const R_ = B.r * (1 + B.fanA * endA * endA + B.fanB * endB * endB);
        const ang = phi + B.twist * t + 0.08 * Math.sin(t * 7 + wob);
        const off = add(mul(fr.N[i], Math.cos(ang) * rho * R_), mul(fr.B[i], Math.sin(ang) * rho * R_));
        pts.push(add(center.pts[i], off));
      }
      const acc = R() < B.tintP;
      const flip = B.dir === 0 && R() < 0.5;
      fibers.push({
        poly: new Poly(pts),
        c: acc ? B.tint : blue(R),
        acc,
        off: R() * 5,
        flip,
        bundle: B,
      });
    }
  }
  const pf = makePicker(
    fibers.map((f) => f.poly.len),
    R,
  );
  for (let k = 0; k < cFib; k++) {
    const f = fibers[pf()];
    const u = R();
    const pu = f.flip ? 1 - u : u;
    const sparkle = R() < 0.06;
    b.addP(
      add(f.poly.at(u), mul(onSphere(R), 0.0035)),
      (pu * f.poly.len) / 1.0 + f.off,
      sparkle ? PAL.c10 : f.c,
      sparkle ? 1.2 : 0.75,
      f.acc && !sparkle,
    );
  }
  const centers = bundles.map((B) => ({ poly: curve(B.ctrl, 20), r: B.r }));
  for (let k = 0; k < cHalo; k++) {
    const C = centers[Math.floor(R() * centers.length)];
    const u = R();
    b.addP(tubePoint(C.poly, u, C.r * (1.4 + R() * 0.8), R, 0.2), -1, blueDim(R), 0.6, false);
  }
  addDust(b, cDust);
}

// ===================================================================
// 5 · 神经环路：海马三突触环路（内嗅皮层 → 齿状回 → CA3 → CA1 → 下托 → 内嗅皮层）
// ===================================================================
function shapeCircuit(b) {
  const { R } = b;
  const [cCA, cDG, cEC, cSub, cPP, cMF, cSC, cOut, cInt, cMod, cDust] = alloc(b.n, [
    0.19, 0.1, 0.06, 0.04, 0.09, 0.08, 0.13, 0.07, 0.03, 0.05, 0.16,
  ]);
  b.off = [-0.25, 0.05, 0];
  b.s = 1.12;
  const deg = Math.PI / 180;
  const caC = [0, 0, 0];
  const caR = 1.5;
  const caAt = (s) => {
    const th = (70 + 240 * s) * deg; // s=0：CA1 顶端；s=1：CA3 卷入齿状回
    const r = caR - (s > 0.85 ? (s - 0.85) * 1.6 : 0);
    return [caC[0] + Math.cos(th) * r, caC[1] + Math.sin(th) * r, 0];
  };
  const caNormal = (s) => {
    const th = (70 + 240 * s) * deg;
    return [Math.cos(th), Math.sin(th), 0];
  };
  const dgC = [0.85, -1.0, 0];
  const dgR = 0.55;
  const dgAt = (s) => {
    const th = (-120 + 240 * s) * deg;
    return [dgC[0] + Math.cos(th) * dgR, dgC[1] + Math.sin(th) * dgR, 0];
  };
  const dgNormal = (s) => {
    const th = (-120 + 240 * s) * deg;
    return [Math.cos(th), Math.sin(th), 0];
  };
  const ecAt = (s) => [1.95 + 0.12 * Math.sin(s * 3), 0.95 - 1.45 * s, 0];
  const subAt = (s) => {
    const a = caAt(0);
    return lerp3(a, [1.55, 1.15, 0], s);
  };

  // CA 锥体细胞层（含向内的顶树突栅栏）
  for (let k = 0; k < cCA; k++) {
    const s = R();
    const base = caAt(s);
    const nrm = caNormal(s);
    const ca1 = s < 0.35;
    if (R() < 0.62) {
      const p = add(add(base, mul(nrm, gauss(R) * 0.05)), [0, 0, gauss(R) * 0.18]);
      const acc = R() < 0.06;
      b.addP(p, s < 0.35 ? 3.6 + R() * 0.2 : 2.5 + R() * 0.2, acc ? PAL.amber : ca1 ? blueBright(R) : PAL.c40, 1.0, acc);
    } else {
      const l = R() * 0.42;
      const p = add(add(base, mul(nrm, -l)), [0, 0, gauss(R) * 0.15]);
      b.addP(p, -1, blueDim(R), 0.7, false);
    }
  }
  // 齿状回颗粒细胞层（分子层树突向外）
  for (let k = 0; k < cDG; k++) {
    const s = R();
    const base = dgAt(s);
    const nrm = dgNormal(s);
    if (R() < 0.65) {
      const acc = R() < 0.15;
      b.addP(add(add(base, mul(nrm, gauss(R) * 0.035)), [0, 0, gauss(R) * 0.16]), 1.5 + R() * 0.2, acc ? PAL.aqua : PAL.c30, 0.95, acc);
    } else {
      b.addP(add(add(base, mul(nrm, R() * 0.3)), [0, 0, gauss(R) * 0.14]), -1, blueDim(R), 0.7, false);
    }
  }
  for (let k = 0; k < cEC; k++) {
    const s = R();
    const layer = R() < 0.5 ? 0 : 0.16;
    const acc = R() < 0.2;
    b.addP(add(ecAt(s), [layer + gauss(R) * 0.04, 0, gauss(R) * 0.2]), 0.2 * R(), acc ? PAL.lav : PAL.c50, 0.95, acc);
  }
  for (let k = 0; k < cSub; k++) {
    b.addP(add(subAt(R()), [gauss(R) * 0.05, gauss(R) * 0.05, gauss(R) * 0.16]), 4.2 + R() * 0.2, PAL.c40, 0.9, false);
  }
  // 通路：每条通路一组纤维，路径参数首尾相接，信号脉冲沿环路依次传播
  const pathway = (count, n, mk, p0, span, tint, tintP) => {
    const fs = [];
    for (let i = 0; i < n; i++) fs.push(mk());
    const pk = makePicker(
      fs.map((f) => f.len),
      R,
    );
    const tinted = fs.map(() => R() < tintP);
    for (let k = 0; k < count; k++) {
      const idx = pk();
      const f = fs[idx];
      const u = R();
      const acc = tinted[idx];
      b.addP(add(f.at(u), mul(onSphere(R), 0.008)), p0 + u * span + (idx % 7) * 0.13, acc ? tint : blue(R), 0.75, acc);
    }
  };
  // 穿通通路 EC → DG
  pathway(cPP, 34, () => {
    const a = add(ecAt(0.35 + R() * 0.6), [0, 0, gauss(R) * 0.15]);
    const e = add(dgAt(0.1 + R() * 0.8), mul(dgNormal(0.5), 0.15));
    return quadBezier(a, add(lerp3(a, e, 0.5), [0.35, 0.25, gauss(R) * 0.2]), e);
  }, 0, 1.4, PAL.lav, 0.34);
  // 苔藓纤维 DG → CA3
  pathway(cMF, 30, () => {
    const a = dgAt(0.15 + R() * 0.7);
    const e = caAt(0.62 + R() * 0.3);
    return quadBezier(a, add(lerp3(a, e, 0.5), [-0.1, 0.05, gauss(R) * 0.15]), e);
  }, 1.5, 1.0, PAL.aqua, 0.34);
  // Schaffer 侧支 CA3 → CA1（横穿 C 形内部）
  pathway(cSC, 46, () => {
    const a = caAt(0.55 + R() * 0.35);
    const e = caAt(0.02 + R() * 0.3);
    return quadBezier(a, [-0.2 + gauss(R) * 0.2, 0.0 + gauss(R) * 0.25, gauss(R) * 0.3], e);
  }, 2.5, 1.1, PAL.amber, 0.28);
  // 输出 CA1 → 下托 → EC
  pathway(cOut, 26, () => {
    const a = caAt(R() * 0.15);
    const e = add(ecAt(R() * 0.4), [0, 0, gauss(R) * 0.15]);
    return quadBezier(a, add(lerp3(a, e, 0.5), [0.1, 0.45, gauss(R) * 0.2]), e);
  }, 3.6, 1.2, PAL.orchid, 0.2);
  // 抑制性中间神经元（星形小簇）
  const ints = [];
  for (let i = 0; i < 12; i++) {
    const s = R();
    ints.push(add(caAt(s), mul(caNormal(s), -0.25 - R() * 0.15)));
  }
  for (let k = 0; k < cInt; k++) {
    const c = ints[Math.floor(R() * ints.length)];
    const dir = onSphere(R);
    b.addP(add(c, mul(dir, Math.pow(R(), 2) * 0.16)), -1, PAL.orchid, 0.8, true);
  }
  // 神经调质输入（多巴胺 / 去甲肾上腺素，自外部投射而来）
  pathway(cMod, 16, () => {
    const a = [-2.4 + R() * 1.4, 1.9 + R() * 0.5, gauss(R) * 0.6];
    const e = R() < 0.5 ? caAt(R() * 0.4) : dgAt(R());
    return quadBezier(a, [lerp(a[0], e[0], 0.3) - 0.3, 1.3 + R() * 0.5, gauss(R) * 0.4], e);
  }, 0.5, 2.2, PAL.amber, 0.4);
  addDust(b, cDust);
}

// ===================================================================
// 6 · 神经网络：连接组（模块化 + 枢纽 + 富人俱乐部长程连接）
// ===================================================================
function shapeNetwork(b) {
  const { R } = b;
  const [cNode, cEdge, cDust] = alloc(b.n, [0.28, 0.64, 0.08]);
  const nodes = [];
  for (let t = 0; t < 20000 && nodes.length < 110; t++) {
    const p = [(R() * 2 - 1) * 2.1, (R() * 2 - 1) * 1.45, (R() * 2 - 1) * 1.6];
    const e = (p[0] / 2.1) ** 2 + (p[1] / 1.45) ** 2 + (p[2] / 1.6) ** 2;
    if (e > 1) continue;
    if (nodes.some((q) => len(sub(q.p, p)) < 0.42)) continue;
    nodes.push({ p, deg: 0, hub: false, mod: 0 });
  }
  // k-means 分模块
  const K = 6;
  let cents = [];
  for (let i = 0; i < K; i++) cents.push(nodes[Math.floor((i / K) * nodes.length)].p.slice());
  for (let it = 0; it < 8; it++) {
    const acc = cents.map(() => [0, 0, 0, 0]);
    for (const nd of nodes) {
      let best = 0;
      let bd = 1e9;
      cents.forEach((c, i) => {
        const d = len(sub(c, nd.p));
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      nd.mod = best;
      acc[best][0] += nd.p[0];
      acc[best][1] += nd.p[1];
      acc[best][2] += nd.p[2];
      acc[best][3]++;
    }
    cents = acc.map((a, i) => (a[3] ? [a[0] / a[3], a[1] / a[3], a[2] / a[3]] : cents[i]));
  }
  const modCol = [PAL.c40, PAL.c30, PAL.c50, PAL.lav, PAL.c40, PAL.aqua];
  const modAcc = [false, false, false, true, false, true];
  const edges = [];
  const has = new Set();
  const link = (i, j, kind) => {
    const key = i < j ? i + '-' + j : j + '-' + i;
    if (i === j || has.has(key)) return;
    has.add(key);
    edges.push({ i, j, kind });
    nodes[i].deg++;
    nodes[j].deg++;
  };
  nodes.forEach((nd, i) => {
    const near = nodes
      .map((q, j) => [j, len(sub(q.p, nd.p))])
      .sort((a, c) => a[1] - c[1])
      .slice(1, 4);
    near.forEach(([j]) => link(i, j, 'local'));
  });
  const hubs = nodes
    .map((nd, i) => [i, nd.deg + R() * 2 - len(nd.p) * 0.6])
    .sort((a, c) => c[1] - a[1])
    .slice(0, 10)
    .map(([i]) => i);
  hubs.forEach((i) => (nodes[i].hub = true));
  for (let a = 0; a < hubs.length; a++) for (let c = a + 1; c < hubs.length; c++) link(hubs[a], hubs[c], 'rich');
  for (let t = 0; t < 22; t++) link(Math.floor(R() * nodes.length), Math.floor(R() * nodes.length), 'long');

  for (let k = 0; k < cNode; k++) {
    const nd = nodes[Math.floor(R() * nodes.length)];
    const rad = nd.hub ? 0.2 : 0.06 + nd.deg * 0.01;
    const p = add(nd.p, mul(onSphere(R), rad * Math.pow(R(), 0.35)));
    let c = modCol[nd.mod];
    let acc = modAcc[nd.mod];
    if (nd.hub && R() < 0.4) {
      c = PAL.amber;
      acc = true;
    } else if (nd.hub) c = PAL.c20;
    b.addP(p, nd.hub ? 0.3 * R() : -1, c, nd.hub ? 1.25 : 1.0, acc);
  }
  const polys = edges.map((e) => {
    const a = nodes[e.i].p;
    const c = nodes[e.j].p;
    const mid = lerp3(a, c, 0.5);
    const bulge = e.kind === 'local' ? 1.06 : 1.35;
    const ctrl = add(mul(mid, bulge), mul(onSphere(R), 0.12));
    return quadBezier(a, ctrl, c, e.kind === 'local' ? 12 : 28);
  });
  const pe = makePicker(
    polys.map((p, i) => p.len * (edges[i].kind === 'local' ? 1 : 0.8)),
    R,
  );
  const eOff = edges.map(() => R() * 4);
  const eFlip = edges.map(() => R() < 0.5);
  for (let k = 0; k < cEdge; k++) {
    const idx = pe();
    const e = edges[idx];
    const poly = polys[idx];
    const u = R();
    const pu = eFlip[idx] ? 1 - u : u;
    let c;
    let acc = false;
    if (e.kind === 'rich') {
      acc = R() < 0.35;
      c = acc ? PAL.amber : PAL.c30;
    } else {
      const ni = nodes[e.i];
      const nj = nodes[e.j];
      if (ni.mod === nj.mod) {
        c = modCol[ni.mod];
        acc = modAcc[ni.mod];
      } else c = R() < 0.5 ? PAL.c50 : PAL.c60;
    }
    b.addP(add(poly.at(u), mul(onSphere(R), 0.007)), (pu * poly.len) / 0.7 + eOff[idx], c, 0.7, acc);
  }
  addDust(b, cDust);
}

// ===================================================================
// 7 · 认知与行为：冲刺的人形（头部发光的大脑 + 脊髓→四肢的运动指令脉冲 + 思维波）
// ===================================================================
function shapeBehavior(b) {
  const { R } = b;
  const [cBody, cBrain, cNerve, cRings, cSpeed, cGround, cDust] = alloc(b.n, [0.36, 0.1, 0.1, 0.08, 0.12, 0.05, 0.09]);
  b.off = [0.45, -0.22, 0];
  const head = [0.58, 1.78, 0];
  const J = {
    neck: [0.42, 1.42, 0],
    chest: [0.34, 1.26, 0],
    pelvis: [0.02, 0.15, 0],
    shN: [0.34, 1.26, 0.2],
    elN: [0.8, 0.86, 0.24],
    wrN: [1.14, 1.22, 0.2],
    shF: [0.3, 1.26, -0.2],
    elF: [-0.22, 1.0, -0.24],
    wrF: [-0.44, 0.62, -0.22],
    hipN: [0.04, 0.12, 0.14],
    knN: [0.74, 0.3, 0.16],
    anN: [0.57, -0.52, 0.14],
    toN: [0.84, -0.62, 0.14],
    hipF: [-0.02, 0.1, -0.14],
    knF: [-0.32, -0.72, -0.16],
    anF: [-0.88, -1.32, -0.14],
    toF: [-0.98, -1.6, -0.14],
  };
  const caps = [
    [J.neck, J.pelvis, 0.25, 0.21],
    [J.shN, J.elN, 0.095, 0.08],
    [J.elN, J.wrN, 0.075, 0.06],
    [J.shF, J.elF, 0.095, 0.08],
    [J.elF, J.wrF, 0.075, 0.06],
    [J.hipN, J.knN, 0.15, 0.11],
    [J.knN, J.anN, 0.1, 0.07],
    [J.anN, J.toN, 0.06, 0.05],
    [J.hipF, J.knF, 0.15, 0.11],
    [J.knF, J.anF, 0.1, 0.07],
    [J.anF, J.toF, 0.06, 0.05],
    [J.neck, head, 0.1, 0.1],
  ];
  const pc = makePicker(
    caps.map((c) => len(sub(c[1], c[0])) * (c[2] + 0.05)),
    R,
  );
  for (let k = 0; k < cBody; k++) {
    if (k < cBody * 0.13) {
      // 头部轮廓
      b.addP(add(head, mul(onSphere(R), 0.3)), -1, blue(R), 0.85, false);
      continue;
    }
    if (k < cBody * 0.25) {
      // 胸廓
      const d = onSphere(R);
      b.addP(add([0.26, 0.98, 0], [d[0] * 0.27, d[1] * 0.38, d[2] * 0.25]), -1, blue(R), 0.85, false);
      continue;
    }
    const c = caps[pc()];
    const u = R();
    const ax = sub(c[1], c[0]);
    const t = norm(ax);
    const r = lerp(c[2], c[3], u) * (0.82 + 0.18 * R());
    const p = add(add(c[0], mul(ax, u)), mul(randPerp(t, R), r));
    b.addP(p, -1, R() < 0.1 ? PAL.c20 : blue(R), 0.85, false);
  }
  for (let k = 0; k < cBrain; k++) {
    const d = onSphere(R);
    const rr = Math.pow(R(), 0.3);
    const p = add([0.56, 1.83, 0], [d[0] * 0.22 * rr, d[1] * 0.15 * rr, d[2] * 0.17 * rr]);
    const r = R();
    const acc = r < 0.38;
    const c = r < 0.2 ? PAL.amber : r < 0.38 ? PAL.lav : blueBright(R);
    b.addP(p, R() * 3, c, 0.85, acc);
  }
  // 神经系统：脑 → 脊髓 → 四肢
  const spine = curve(
    [
      [0.5, 1.68, 0],
      [0.36, 1.35, 0],
      [0.18, 0.75, 0],
      [0.06, 0.25, 0],
    ],
    10,
  );
  const branch = (from, pts) => curve([from, ...pts], 8);
  const nerves = [
    { poly: spine, d0: 0 },
    { poly: branch(spine.at(0.2), [J.shN, J.elN, J.wrN]), d0: spine.len * 0.2 },
    { poly: branch(spine.at(0.2), [J.shF, J.elF, J.wrF]), d0: spine.len * 0.2 },
    { poly: branch(spine.at(1), [J.hipN, J.knN, J.anN, J.toN]), d0: spine.len },
    { poly: branch(spine.at(1), [J.hipF, J.knF, J.anF, J.toF]), d0: spine.len },
  ];
  const pn = makePicker(
    nerves.map((n) => n.poly.len),
    R,
  );
  for (let k = 0; k < cNerve; k++) {
    const n = nerves[pn()];
    const u = R();
    const acc = R() < 0.3;
    b.addP(add(n.poly.at(u), mul(onSphere(R), 0.012)), (n.d0 + u * n.poly.len) / 0.55, acc ? PAL.amber : PAL.c20, 0.85, acc);
  }
  // 思维波环
  for (let k = 0; k < cRings; k++) {
    const ring = Math.floor(R() * 3);
    const r = 0.55 + ring * 0.27;
    const th = R() * TAU;
    if (Math.sin(th * 12 + ring) < -0.25) {
      k--;
      continue;
    }
    const acc = R() < 0.5;
    b.add(
      head[0] + Math.cos(th) * r,
      head[1] + Math.sin(th) * r * 0.92,
      Math.sin(th * 2) * 0.05,
      (th / TAU) * 4 + ring * 0.3,
      acc ? (ring === 1 ? PAL.aqua : PAL.lav) : PAL.c40,
      0.75,
      acc,
    );
  }
  // 速度线
  const lines = [];
  for (let i = 0; i < 26; i++) {
    const y = -1.45 + R() * 3.4;
    const x0 = -0.45 - R() * 0.35 - (y < 0 ? 0.35 : 0);
    lines.push({ y, x0, x1: x0 - 1.4 - R() * 0.9, z: (R() - 0.5) * 0.6, off: R() * 3 });
  }
  for (let k = 0; k < cSpeed; k++) {
    const L = lines[Math.floor(R() * lines.length)];
    const u = Math.pow(R(), 1.6);
    const x = lerp(L.x0, L.x1, u);
    const acc = R() < 0.1;
    b.add(x, L.y + gauss(R) * 0.008, L.z, (-x) / 0.6 + L.off, acc ? PAL.aqua : u < 0.3 ? PAL.c40 : PAL.c50, 0.7 - u * 0.25, acc);
  }
  // 地面冲击波
  for (let k = 0; k < cGround; k++) {
    const ring = Math.floor(R() * 3);
    const r = 0.3 + ring * 0.32 + gauss(R) * 0.015;
    const th = R() * TAU;
    const acc = R() < 0.2;
    b.add(-0.95 + Math.cos(th) * r, -1.63, Math.sin(th) * r * 0.55, r / 0.3, acc ? PAL.aqua : PAL.c50, 0.7, acc);
  }
  addDust(b, cDust);
}

// ===================================================================
// 8 · 尾页：∞ 终身重塑（双纽线纤维束）
// ===================================================================
function shapeInfinity(b) {
  const { R } = b;
  const [cFib, cGlit, cDust] = alloc(b.n, [0.82, 0.07, 0.11]);
  const a = 2.35;
  const center = [];
  const M = 260;
  for (let i = 0; i <= M; i++) {
    const t = (i / M) * TAU;
    const s = Math.sin(t);
    const den = 1 + s * s;
    center.push([(a * Math.cos(t)) / den, (a * s * Math.cos(t)) / den, 0.45 * s]);
  }
  const cpoly = new Poly(center);
  const fr = transportFrames(cpoly);
  const fibers = [];
  for (let f = 0; f < 150; f++) {
    const phi = R() * TAU;
    const rho = Math.sqrt(R());
    const pts = [];
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      const r = 0.26 * (0.8 + 0.4 * Math.sin(t * TAU * 2 + phi));
      const ang = phi + t * TAU * 3;
      pts.push(add(center[i], add(mul(fr.N[i], Math.cos(ang) * rho * r), mul(fr.B[i], Math.sin(ang) * rho * r))));
    }
    const acc = R() < 0.22;
    fibers.push({
      poly: new Poly(pts),
      c: acc ? pick(R, [PAL.amber, PAL.lav, PAL.aqua, PAL.coral, PAL.mint, PAL.orchid]) : blue(R),
      acc,
      off: R() * 0.6,
    });
  }
  const pf = makePicker(
    fibers.map((f) => f.poly.len),
    R,
  );
  for (let k = 0; k < cFib; k++) {
    const f = fibers[pf()];
    const u = R();
    b.addP(add(f.poly.at(u), mul(onSphere(R), 0.006)), u * 9 + f.off, f.c, 0.8, f.acc);
  }
  for (let k = 0; k < cGlit; k++) {
    const u = R();
    const p = add(cpoly.at(u), mul(onSphere(R), 0.35 + R() * 0.5));
    const acc = R() < 0.25;
    b.addP(p, 400 + R() * 30, acc ? pick(R, [PAL.amber, PAL.lav]) : PAL.c30, 0.6 + R() * 0.7, acc);
  }
  addDust(b, cDust);
}

// 旋转方式：spin = 持续自转（rad/s）；sway = 围绕 base 左右摆动
export const SHAPES = [
// fit = 构图缩放，dx = 构图水平微调（世界单位）
  { key: 'hero', gen: shapeHero, sway: 0.16, base: 0, tilt: 0.04, fit: 1.0, dx: 0, par: 0.5, gateK: 1.0, directional: true },
  { key: 'brain', gen: shapeBrain, sway: 0.6, base: -0.25, tilt: 0.16, fit: 1.0, dx: 0 },
  { key: 'neuron', gen: shapeNeuron, sway: 0.45, base: 0.1, tilt: 0.04, fit: 0.9, dx: -0.3, directional: true },
  { key: 'synapse', gen: shapeSynapse, sway: 0.5, base: 0.2, tilt: 0.1, fit: 0.84, dx: 0 },
  { key: 'tracts', gen: shapeTracts, sway: 0.7, base: 0.25, tilt: 0.08, fit: 0.95, dx: -0.1, directional: true },
  { key: 'circuit', gen: shapeCircuit, sway: 0.4, base: 0.0, tilt: 0.05, fit: 1.0, dx: 0, directional: true },
  { key: 'network', gen: shapeNetwork, spin: 0.12, tilt: 0.2, fit: 1.12, dx: 0 },
  { key: 'behavior', gen: shapeBehavior, sway: 0.42, base: 0.0, tilt: 0.04, fit: 1.0, dx: 0, directional: true },
  { key: 'infinity', gen: shapeInfinity, sway: 0.5, base: 0.0, tilt: 0.22, fit: 0.72, dx: 0 },
];

// 生成单个形态，并按 x 坐标排序：相邻形态之间粒子“就近迁移”，形变更流畅
export function generateShape(index, n, opts = {}) {
  const b = new Builder(n, 1000 + index * 97);
  SHAPES[index].gen(b, opts);
  while (b.i < n) addDust(b, 1);
  // 元数据：路径带、最小路径的起点（形态“首次放电”的起点）、质心
  let meta = b.meta;
  if (!meta) {
    let pathMax = 0;
    let minPath = Infinity;
    let srcP = [0, 0, 0];
    const cen = [0, 0, 0];
    let nc = 0;
    for (let i = 0; i < n; i++) {
      const w = b.pos[i * 4 + 3];
      const x = b.pos[i * 4];
      const y = b.pos[i * 4 + 1];
      const z = b.pos[i * 4 + 2];
      if (w >= 0 && w < 400) {
        if (w > pathMax) pathMax = w;
        if (w < minPath) {
          minPath = w;
          srcP = [x, y, z];
        }
      }
      if (Math.abs(x) < 4 && Math.abs(y) < 3.2 && z > -3) {
        cen[0] += x;
        cen[1] += y;
        cen[2] += z;
        nc++;
      }
    }
    meta = {
      bands: [
        [0, pathMax + 0.5],
        [400, 440],
      ],
      source: { p: srcP, path: Number.isFinite(minPath) ? minPath : 0 },
      centroid: nc ? cen.map((v) => v / nc) : [0, 0, 0],
      directional: !!SHAPES[index].directional,
    };
  }
  // 每个路径带里实际最大的路径值：波前越过它就退场（不再白占槽位）
  meta.bandMax = meta.bands.map(([lo, hi]) => {
    let mx = lo;
    for (let i = 0; i < n; i++) {
      const p = b.pos[i * 4 + 3];
      if (p >= lo && p < hi && p > mx) mx = p;
    }
    return mx;
  });
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = i;
  const key = new Float32Array(n);
  for (let i = 0; i < n; i++) key[i] = b.pos[i * 4] + b.pos[i * 4 + 1] * 0.08;
  order.sort((x, y) => key[x] - key[y]);
  const pos = new Float32Array(n * 4);
  const col = new Float32Array(n * 4);
  let accentCount = 0;
  for (let i = 0; i < n; i++) {
    const s = order[i] * 4;
    const d = i * 4;
    for (let k = 0; k < 4; k++) {
      pos[d + k] = b.pos[s + k];
      col[d + k] = b.col[s + k];
    }
    if (col[d + 3] % DEND >= ACCENT) accentCount++;
  }
  if (b.owner) {
    const owner = new Uint8Array(n);
    for (let i = 0; i < n; i++) owner[i] = b.owner[order[i]];
    meta.owner = owner;
  }
  return { pos, col, accentRatio: accentCount / n, meta };
}
