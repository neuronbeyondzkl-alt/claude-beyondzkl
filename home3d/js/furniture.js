// 家具：全部用基本几何体程序化搭建（无外部模型）。
// 局部坐标约定：原点在家具中心的地面上，宽度沿 X，进深沿 Z，正面朝 +Z。
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M, boxGeo, tag, kit, mergeMeshes } from './geo.js';

const PI = Math.PI;

function rand(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// 同材质的小构件合并成一个网格，减少绘制调用（书、衣物、树叶）
function merger(parent, cat = 'furn') {
  const bins = {};
  const push = (role, g) => (bins[role] ||= []).push(g);
  return {
    box(role, w, h, d, x, y, z, ry = 0, rz = 0) {
      const g = boxGeo(w, h, d);
      if (rz) g.rotateZ(rz);
      if (ry) g.rotateY(ry);
      g.translate(x, y + h / 2, z);
      push(role, g);
    },
    leaf(role, r, x, y, z, sx, sy, sz, ry) {
      const g = new THREE.IcosahedronGeometry(r, 0);
      g.scale(sx, sy, sz); g.rotateY(ry); g.translate(x, y, z);
      push(role, g);
    },
    flush(o = {}) {
      for (const [role, list] of Object.entries(bins)) {
        const m = new THREE.Mesh(mergeGeometries(list));
        tag(m, role, { cat, ...o });
        parent.add(m);
      }
    },
  };
}

// —— 卧室 ——
function bed(K, it) {
  const W = M(it.w), L = M(it.d), fab = it.fabric || 'fabricOat';
  const hbH = M(it.h || 1100);
  const z0 = -L / 2;
  // 床头：竖向绗缝软包
  K.box(fab, W + 0.14, hbH, 0.06, 0, 0, z0 + 0.03);
  const n = Math.round(W / 0.16);
  const cw = (W + 0.1) / n;
  for (let i = 0; i < n; i++) {
    K.rbox(fab, cw - 0.008, hbH - 0.2, 0.08, 0.035, -(W + 0.1) / 2 + cw * (i + 0.5), 0.16, z0 + 0.09, { noClayEdges: true });
  }
  K.box('brass', W + 0.16, 0.012, 0.075, 0, hbH, z0 + 0.035);
  // 床架、香槟金踢脚
  K.rbox(fab, W + 0.06, 0.3, L - 0.13, 0.03, 0, 0.07, z0 + 0.13 + (L - 0.13) / 2);
  K.box('brass', W + 0.02, 0.07, L - 0.17, 0, 0, z0 + 0.14 + (L - 0.17) / 2, { noEdges: true });
  // 床垫、被子、搭毯
  const mz0 = z0 + 0.15, Lm = L - 0.2;
  K.rbox('linen', W, 0.2, Lm, 0.05, 0, 0.37, mz0 + Lm / 2, { noClayEdges: true });
  K.rbox('linen', W + 0.06, 0.07, Lm * 0.74, 0.035, 0, 0.55, mz0 + Lm * 0.26 + (Lm * 0.74) / 2 + 0.03, { noClayEdges: true });
  K.rbox('linenGrey', W + 0.07, 0.05, 0.22, 0.02, 0, 0.6, mz0 + Lm * 0.26 + 0.14, { noClayEdges: true });
  K.rbox('throwCaramel', W + 0.1, 0.025, 0.5, 0.01, 0, 0.615, mz0 + Lm - 0.3, { noClayEdges: true });
  // 枕头
  const pw = W > 1.6 ? 0.7 : 0.62;
  for (const s of [-1, 1]) {
    K.rbox('linen', pw, 0.16, 0.42, 0.07, s * (W / 4 + 0.02), 0.56, mz0 + 0.3, { rx: -0.35, noClayEdges: true });
    K.rbox('linenGrey', pw * 0.82, 0.14, 0.36, 0.06, s * (W / 4 + 0.02), 0.6, mz0 + 0.5, { rx: -0.25, noClayEdges: true });
  }
  K.rbox(fab === 'fabricOat' ? 'velvetCaramel' : 'velvetSage', 0.5, 0.12, 0.3, 0.05, 0, 0.6, mz0 + 0.68, { rx: -0.2, noClayEdges: true });
}

function lamp(K, x, y, z, s = 1) {
  K.lathe('ceramic', [[0, 0], [0.07 * s, 0], [0.09 * s, 0.06 * s], [0.085 * s, 0.17 * s], [0.03 * s, 0.24 * s], [0.012 * s, 0.26 * s], [0, 0.26 * s]], x, y, z);
  K.cyl('brass', 0.006, 0.006, 0.12 * s, x, y + 0.26 * s, z);
  K.cyl('lampShade', 0.11 * s, 0.15 * s, 0.2 * s, x, y + 0.33 * s, z, { open: true, noShadow: true });
  K.sphere('bulb', 0.03 * s, x, y + 0.4 * s, z, { noEdges: true, noShadow: true });
}

function nightstand(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  const leg = 0.12;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box('brass', 0.016, leg, 0.016, sx * (w / 2 - 0.03), 0, sz * (d / 2 - 0.03), { noEdges: true });
  K.box('walnut', w, h - leg - 0.02, d, 0, leg, 0);
  K.box('calacatta', w + 0.01, 0.02, d + 0.01, 0, h - 0.02, 0);
  const fh = (h - leg - 0.02) / 2;
  for (let i = 0; i < 2; i++) {
    K.box('walnutDark', w - 0.03, fh - 0.012, 0.006, 0, leg + 0.006 + i * fh, d / 2, { noEdges: true });
    K.box('brass', 0.12, 0.012, 0.014, 0, leg + i * fh + fh / 2, d / 2 + 0.008, { noEdges: true });
  }
  if (it.lamp) lamp(K, -w * 0.12, h, -d * 0.1);
  K.box('book2', 0.16, 0.025, 0.22, w * 0.22, h, 0.03, { ry: 0.2 });
  K.box('book1', 0.15, 0.02, 0.2, w * 0.22, h + 0.025, 0.03, { ry: 0.1 });
}

function wardrobe(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('lacquerDark', w - 0.04, 0.08, d - 0.06, 0, 0, -0.03);
  K.box('lacquerCream', w, h - 0.08, d, 0, 0.08, 0);
  const n = Math.max(2, Math.round(w / 0.5));
  const dw = w / n;
  for (let i = 1; i < n; i++) K.box('lacquerDark', 0.004, h - 0.1, 0.004, -w / 2 + i * dw, 0.09, d / 2 + 0.001, { noEdges: true });
  K.box('lacquerDark', w - 0.01, 0.004, 0.004, 0, 0.08 + (h - 0.08) * 0.78, d / 2 + 0.001, { noEdges: true });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + (i % 2 ? 0.12 : 0.88)) * dw;
    K.box('brass', 0.014, 0.6, 0.02, x, 0.85, d / 2 + 0.01);
  }
}

function walkinWardrobe(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  const mg = merger(K.group(), 'furn');
  // 柜体
  K.box('walnut', w, 0.02, d, 0, 0, 0);
  K.box('walnut', w, 0.02, d, 0, h - 0.02, 0);
  K.box('walnutDark', w, h, 0.02, 0, 0, -d / 2 + 0.01);
  const n = Math.max(2, Math.round(w / 0.6));
  for (let i = 0; i <= n; i++) K.box('walnut', 0.02, h, d, -w / 2 + 0.01 + (i * (w - 0.02)) / n, 0, 0);
  const r = rand(7);
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + ((i + 0.5) * w) / n, cw = w / n - 0.04;
    if (i % 2 === 0) {
      // 挂衣区
      K.cyl('brass', 0.012, 0.012, cw, cx, 1.95, 0, { rz: PI / 2, noEdges: true });
      let x = cx - cw / 2 + 0.04;
      while (x < cx + cw / 2 - 0.04) {
        const th = 0.025 + r() * 0.03, len = 0.7 + r() * 0.5;
        mg.box(['clothes1', 'clothes2', 'clothes3', 'clothes4'][(r() * 4) | 0], th, len, d * 0.82, x, 1.93 - len, 0.02);
        x += th + 0.012;
      }
      K.box('walnut', cw, 0.02, d - 0.04, cx, 0.4, 0);
      for (let k = 0; k < 3; k++) mg.box('clothes4', 0.24, 0.12, 0.3, cx - cw / 2 + 0.16 + k * 0.28, 0.02, 0.02);
    } else {
      // 层板 + 叠放衣物
      for (let s = 0; s < 6; s++) {
        const y = 0.02 + s * 0.38;
        K.box('walnut', cw, 0.02, d - 0.04, cx, y, 0);
        if (s < 5) for (let k = 0; k < 2; k++) {
          const hh = 0.08 + r() * 0.14;
          mg.box(['clothes1', 'clothes2', 'clothes3', 'clothes4'][(r() * 4) | 0], cw / 2 - 0.04, hh, d * 0.7, cx - cw / 4 + k * (cw / 2), y + 0.02, 0);
        }
      }
    }
    K.box('led', 0.01, h - 0.1, 0.01, cx - cw / 2 + 0.012, 0.05, d / 2 - 0.05, { noEdges: true, noShadow: true });
  }
  mg.flush({ noClayEdges: true });
  // 茶色玻璃门
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + ((i + 0.5) * w) / n;
    K.box('glassSmoke', w / n - 0.006, h - 0.04, 0.008, cx, 0.02, d / 2 + 0.006, { noShadow: true });
    K.box('brass', 0.012, 0.5, 0.02, cx + (i % 2 ? -1 : 1) * (w / n / 2 - 0.05), 0.9, d / 2 + 0.02);
  }
}

function tallCabinet(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('lacquerDark', w - 0.04, 0.08, d - 0.06, 0, 0, -0.03);
  K.box('lacquerCream', w, h - 0.08, d, 0, 0.08, 0);
  const n = Math.max(1, Math.round(w / 0.55));
  for (let i = 1; i < n; i++) K.box('lacquerDark', 0.004, h - 0.1, 0.004, -w / 2 + (i * w) / n, 0.09, d / 2 + 0.001, { noEdges: true });
  K.box('lacquerDark', w - 0.01, 0.004, 0.004, 0, 1.35, d / 2 + 0.001, { noEdges: true });
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (i + (i % 2 ? 0.1 : 0.9)) * (w / n);
    if (it.handle === 'edge') K.box('brass', 0.012, 0.012, 0.02, x, 1.3, d / 2 + 0.01, { noEdges: true });
    else K.box('brass', 0.014, 0.5, 0.02, x, 1.05, d / 2 + 0.01);
  }
}

function tv(K, it) {
  const w = M(it.w), h = M(it.h), y = M(it.y) - h / 2;
  K.box('blackMetal', w, h, 0.03, 0, y, 0.0);
  K.box('screen', w - 0.012, h - 0.012, 0.004, 0, y + 0.006, 0.016, { noEdges: true });
}

function floatShelf(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h), y = M(it.y);
  K.box('walnut', w, h, d, 0, y, 0);
  K.box('led', w - 0.06, 0.006, 0.01, 0, y - 0.006, d / 2 - 0.04, { noEdges: true, noShadow: true });
  K.lathe('ceramic', [[0, 0], [0.05, 0], [0.07, 0.08], [0.04, 0.2], [0.03, 0.24], [0, 0.24]], w * 0.3, y + h, 0);
  K.box('book3', 0.22, 0.04, 0.16, -w * 0.3, y + h, 0);
}

function rug(K, it) {
  const w = M(it.w), d = M(it.d);
  const m = K.mesh(it.pattern === 'border' ? 'rugBorder' : 'rugPlain', new THREE.BoxGeometry(w, 0.012, d), { noShadow: true });
  m.position.y = 0.006 + 0.003;
}

function radiator(K, it) {
  const w = M(it.w), h = M(it.h);
  const n = Math.max(4, Math.round(w / 0.05));
  const mg = merger(K.group(), 'furn');
  for (let i = 0; i < n; i++) mg.box('radiator', 0.03, h, 0.075, -w / 2 + 0.025 + (i * (w - 0.05)) / (n - 1), 0.12, 0);
  mg.box('radiator', w, 0.04, 0.05, 0, 0.12, 0);
  mg.box('radiator', w, 0.04, 0.05, 0, 0.12 + h - 0.04, 0);
  mg.flush({ noClayEdges: true });
  K.box('steel', 0.02, 0.12, 0.02, -w / 2 - 0.02, 0, 0, { noEdges: true });
  K.cyl('brass', 0.018, 0.018, 0.05, w / 2 + 0.03, 0.14 + h - 0.1, 0, { noEdges: true });
}

function loungeChair(K, it) {
  const w = M(it.w || 820), d = M(it.d || 840);
  const fab = it.fabric || 'leatherCognac';
  // 弧形扶手与靠背：一圈粗管
  const pts = [];
  for (let i = 0; i <= 14; i++) {
    const a = PI * 0.05 + (i / 14) * PI * 0.9;
    pts.push([Math.cos(a) * w * 0.42, 0.58, -Math.sin(a) * d * 0.42 + 0.06]);
  }
  K.tube(fab, pts.map((p) => [p[0], p[1], p[2]]), 0.07, { seg: 30 });
  // 外壳
  for (let i = 0; i < 7; i++) {
    const a = PI * 0.08 + (i / 6) * PI * 0.84;
    K.rbox(fab, 0.2, 0.36, 0.1, 0.04, Math.cos(a) * w * 0.4, 0.22, -Math.sin(a) * d * 0.4 + 0.06, { ry: a - PI / 2, noClayEdges: true });
  }
  K.rbox(fab, w * 0.7, 0.16, d * 0.62, 0.06, 0, 0.24, 0.04, { noClayEdges: true });
  K.rbox(fab, w * 0.55, 0.3, 0.14, 0.06, 0, 0.4, -d * 0.24, { rx: -0.25, noClayEdges: true });
  K.box('brass', w * 0.6, 0.03, d * 0.5, 0, 0.18, 0.02, { noEdges: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.cyl('brass', 0.012, 0.009, 0.2, sx * w * 0.25, 0, sz * d * 0.2 + 0.02, { noEdges: true });
}

function coffeeTable(K, it) {
  const r = M(it.r), h = M(it.h);
  const top = it.top || 'fishbelly';
  K.cyl(top, r, r, 0.03, 0, h - 0.03, 0, { seg: 64 });
  K.cyl('brass', r + 0.004, r + 0.004, 0.008, 0, h - 0.036, 0, { seg: 64, noEdges: true });
  K.cyl('brass', r * 0.55, r * 0.62, h - 0.04, 0, 0, 0, { seg: 48 });
  if (r > 0.5) {
    K.box('book4', 0.28, 0.035, 0.22, -r * 0.3, h, r * 0.15, { ry: 0.3 });
    K.box('book1', 0.26, 0.03, 0.2, -r * 0.3, h + 0.035, r * 0.15, { ry: 0.45 });
    K.lathe('ceramic', [[0, 0], [0.09, 0], [0.12, 0.05], [0.11, 0.08], [0, 0.08]], r * 0.3, h, -r * 0.2);
    K.sphere('brass', 0.05, r * 0.32, h + 0.11, -r * 0.2);
  }
}

function sideTable(K, it) {
  const r = M(it.r), h = M(it.h);
  K.cyl('marbleDark', r, r, 0.025, 0, h - 0.025, 0, { seg: 48 });
  K.cyl('brass', 0.018, 0.018, h - 0.045, 0, 0.02, 0, { noEdges: true });
  K.cyl('brass', r * 0.7, r * 0.75, 0.02, 0, 0, 0, { seg: 48 });
  K.lathe('ceramic', [[0, 0], [0.05, 0], [0.07, 0.1], [0.03, 0.22], [0.035, 0.26], [0, 0.26]], 0, h, 0);
}

function pouf(K, it) {
  const fab = it.fabric || 'velvetCaramel';
  const w = M(it.w), d = M(it.d), h = M(it.h);
  if (it.round) {
    const r = w / 2;
    K.lathe(fab, [[0, 0], [r - 0.03, 0], [r, 0.03], [r, h - 0.05], [r - 0.05, h], [0, h]], 0, 0, 0, { seg: 40 });
  } else {
    K.rbox(fab, w, h - 0.05, d, 0.06, 0, 0.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box('brass', 0.02, 0.05, 0.02, sx * (w / 2 - 0.06), 0, sz * (d / 2 - 0.06), { noEdges: true });
  }
}

function floorLamp(K, it, lights) {
  K.cyl('marbleDark', 0.17, 0.17, 0.05, 0, 0, 0, { seg: 48 });
  const reach = 1.25;
  K.tube('brass', [[0, 0.05, 0], [0, 0.9, -0.02], [0, 1.6, 0.15], [0, 1.95, 0.6], [0, 1.95, 1.0], [0, 1.82, reach]], 0.013);
  K.lathe('brass', [[0, 0.16], [0.08, 0.15], [0.17, 0.08], [0.22, 0], [0.215, -0.005]], 0, 1.62, reach, { seg: 40 });
  K.lathe('lampShade', [[0, 0.155], [0.075, 0.145], [0.16, 0.078], [0.205, 0.002]], 0, 1.62, reach, { seg: 40, noEdges: true, noShadow: true });
  K.sphere('bulb', 0.04, 0, 1.68, reach, { noEdges: true, noShadow: true });
  lights.push({ x: 0, y: 1.55, z: reach, i: 1.1, d: 4.5 });
}

// —— 餐厅 ——
function diningTable(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.rbox('calacatta', w, 0.03, d, 0.008, 0, h - 0.03, 0);
  for (const sz of [-1, 1]) {
    const z = sz * (d / 2 - 0.28);
    for (const sx of [-1, 1]) K.box('brass', 0.035, h - 0.06, 0.035, sx * (w / 2 - 0.14), 0.02, z, { rz: -sx * 0.18 });
    K.box('brass', w - 0.2, 0.03, 0.04, 0, h - 0.06, z);
    K.box('brass', w * 0.62, 0.02, 0.07, 0, 0, z);
  }
  K.box('brass', 0.04, 0.03, d - 0.56, 0, h - 0.06, 0);
  K.lathe('ceramic', [[0, 0], [0.08, 0], [0.1, 0.03], [0.05, 0.14], [0.03, 0.26], [0.04, 0.3], [0, 0.3]], 0, h, 0.1);
  K.box('walnut', 0.36, 0.02, 0.36, 0, h, -0.3, { ry: 0.785 });
}

function diningChair(K, it) {
  const fab = it.fabric || 'leatherCognac';
  K.rbox(fab, 0.46, 0.08, 0.46, 0.03, 0, 0.4, 0.02, { noClayEdges: true });
  K.rbox(fab, 0.44, 0.42, 0.06, 0.03, 0, 0.47, -0.2, { rx: -0.12, noClayEdges: true });
  for (const sx of [-1, 1]) {
    K.box('blackMetal', 0.018, 0.42, 0.018, sx * 0.19, 0, 0.19, { rx: 0.06, noEdges: true });
    K.box('blackMetal', 0.018, 0.86, 0.018, sx * 0.19, 0, -0.2, { rx: -0.1, noEdges: true });
  }
}

function pendant(K, it, lights) {
  const w = M(it.w), y = M(it.y);
  K.rbox('brass', w, 0.035, 0.07, 0.012, 0, y, 0);
  K.box('lampShade', w - 0.03, 0.01, 0.05, 0, y - 0.008, 0, { noEdges: true, noShadow: true });
  for (const sx of [-1, 1]) K.cyl('blackMetal', 0.002, 0.002, 2.8 - y - 0.035, sx * w * 0.38, y + 0.035, 0, { noEdges: true, noShadow: true });
  for (const sx of [-1, 1]) K.cyl('brass', 0.03, 0.03, 0.012, sx * w * 0.38, 2.788, 0, { noEdges: true });
  lights.push({ x: 0, y: y - 0.2, z: 0, i: 1.0, d: 4 });
}

function sideboard(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.box('brass', 0.02, 0.16, 0.02, sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), { noEdges: true });
  K.box('walnut', w, h - 0.18, d, 0, 0.16, 0);
  K.box('marbleDark', w + 0.01, 0.02, d + 0.01, 0, h - 0.02, 0);
  for (let i = 1; i < 3; i++) K.box('walnutDark', 0.004, h - 0.2, 0.004, -w / 2 + (i * w) / 3, 0.17, d / 2 + 0.001, { noEdges: true });
  for (let i = 0; i < 3; i++) K.box('brass', 0.12, 0.01, 0.015, -w / 3 + (i * w) / 3, 0.62, d / 2 + 0.008, { noEdges: true });
  K.lathe('ceramic', [[0, 0], [0.06, 0], [0.1, 0.12], [0.05, 0.3], [0.035, 0.36], [0, 0.36]], -w * 0.3, h, 0);
  K.lathe('marbleDark', [[0, 0], [0.12, 0], [0.13, 0.04], [0, 0.04]], w * 0.2, h, 0);
  K.sphere('brass', 0.06, w * 0.2, h + 0.1, 0);
}

// —— 书房 ——
function bookcase(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  const mg = merger(K.group(), 'furn');
  K.box('walnutDark', w, h, 0.015, 0, 0, -d / 2 + 0.008);
  const cols = Math.round(w / 0.82);
  const cw = w / cols;
  for (let i = 0; i <= cols; i++) K.box('walnut', 0.025, h, d, -w / 2 + 0.0125 + (i * (w - 0.025)) / cols, 0, 0);
  // 下部柜门
  const base = 0.72;
  K.box('lacquerCream', w - 0.01, base, d - 0.01, 0, 0, 0.004);
  for (let i = 1; i < cols * 2; i++) K.box('lacquerDark', 0.004, base - 0.04, 0.004, -w / 2 + (i * w) / (cols * 2), 0.02, d / 2 + 0.002, { noEdges: true });
  const shelves = [base, 1.1, 1.48, 1.86, 2.24, h - 0.025];
  const r = rand(19);
  const roles = ['book1', 'book2', 'book3', 'book4', 'book5', 'book6'];
  for (let c = 0; c < cols; c++) {
    const cx = -w / 2 + (c + 0.5) * cw;
    for (let s = 0; s < shelves.length; s++) {
      K.box('walnut', cw - 0.025, 0.025, d - 0.02, cx, shelves[s], 0.005);
      K.box('brass', cw - 0.025, 0.006, 0.004, cx, shelves[s] + 0.01, d / 2 + 0.004, { noEdges: true });
      if (s < shelves.length - 1) {
        K.box('led', cw - 0.06, 0.004, 0.008, cx, shelves[s + 1] - 0.006, d / 2 - 0.04, { noEdges: true, noShadow: true });
        const y = shelves[s] + 0.025;
        const room = shelves[s + 1] - shelves[s] - 0.04;
        let x = cx - cw / 2 + 0.04;
        const stop = cx + cw / 2 - 0.04;
        const decorAt = (c + s) % 3 === 0 ? 0.55 : 2;
        while (x < stop) {
          const frac = (x - (cx - cw / 2)) / cw;
          if (frac > decorAt && frac < decorAt + 0.3) {
            if ((c + s) % 2) K.lathe('ceramic', [[0, 0], [0.05, 0], [0.07, 0.07], [0.035, 0.2], [0.03, 0.23], [0, 0.23]], x + 0.06, y, 0);
            else K.sphere('brass', 0.06, x + 0.06, y + 0.06, 0, { noEdges: true });
            x += 0.16;
            continue;
          }
          const t = 0.018 + r() * 0.03, bh = Math.min(room, 0.2 + r() * 0.12), bd = d * (0.7 + r() * 0.2);
          if (r() < 0.06 && x + bh < stop) {
            mg.box(roles[(r() * 6) | 0], t, bh, bd, x + 0.012, y, 0, 0, -0.2);
            x += t + 0.05;
          } else {
            mg.box(roles[(r() * 6) | 0], t, bh, bd, x + t / 2, y, 0);
            x += t + 0.002;
          }
        }
      }
    }
  }
  mg.flush({ noClayEdges: true });
}

function desk(K, it, lights) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.rbox('walnut', w, 0.035, d, 0.008, 0, h - 0.035, 0);
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 - 0.1);
    K.box('brass', 0.03, h - 0.035, 0.03, x, 0, -d / 2 + 0.06);
    K.box('brass', 0.03, h - 0.035, 0.03, x, 0, d / 2 - 0.06);
    K.box('brass', 0.03, 0.03, d - 0.12, x, 0.05, 0);
  }
  K.box('brass', w - 0.2, 0.03, 0.03, 0, h - 0.07, -d / 2 + 0.06);
  K.rbox('leatherDark', 0.8, 0.004, 0.42, 0.002, 0, h, 0, { noEdges: true });
  // 笔记本电脑
  K.box('steel', 0.32, 0.012, 0.22, 0.05, h + 0.004, 0.02);
  K.box('steel', 0.32, 0.21, 0.008, 0.05, h + 0.016, -0.09, { rx: -0.25 });
  K.box('blackGlass', 0.3, 0.19, 0.002, 0.05, h + 0.022, -0.084, { rx: -0.25, noEdges: true });
  // 台灯
  const lx = -w / 2 + 0.2, lz = -d / 2 + 0.16;
  K.cyl('brass', 0.07, 0.08, 0.02, lx, h, lz);
  K.tube('brass', [[lx, h + 0.02, lz], [lx, h + 0.3, lz - 0.02], [lx + 0.12, h + 0.45, lz + 0.05], [lx + 0.25, h + 0.42, lz + 0.1]], 0.007);
  K.cyl('lampShade', 0.035, 0.07, 0.1, lx + 0.27, h + 0.32, lz + 0.1, { open: true, noShadow: true });
  K.sphere('bulb', 0.02, lx + 0.27, h + 0.36, lz + 0.1, { noEdges: true, noShadow: true });
  lights.push({ x: lx + 0.27, y: h + 0.3, z: lz + 0.1, i: 0.4, d: 2 });
  K.box('book5', 0.18, 0.03, 0.24, w / 2 - 0.25, h, -0.05, { ry: -0.2 });
  K.box('book2', 0.17, 0.03, 0.23, w / 2 - 0.25, h + 0.03, -0.05, { ry: -0.1 });
  K.cyl('brass', 0.03, 0.03, 0.1, w / 2 - 0.12, h, 0.12, { open: false });
}

function officeChair(K, it) {
  const fab = 'leatherCognac';
  K.rbox(fab, 0.5, 0.08, 0.48, 0.035, 0, 0.44, 0, { noClayEdges: true });
  K.rbox(fab, 0.48, 0.5, 0.07, 0.035, 0, 0.56, -0.24, { rx: -0.1, noClayEdges: true });
  for (const sx of [-1, 1]) {
    K.box('steel', 0.025, 0.2, 0.025, sx * 0.24, 0.48, -0.02, { noEdges: true });
    K.rbox(fab, 0.05, 0.03, 0.26, 0.012, sx * 0.24, 0.68, 0.0, { noClayEdges: true });
  }
  K.cyl('steel', 0.025, 0.025, 0.32, 0, 0.1, 0, { noEdges: true });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * PI * 2;
    K.box('steel', 0.04, 0.025, 0.32, Math.sin(a) * 0.16, 0.06, Math.cos(a) * 0.16, { ry: a, noEdges: true });
    K.sphere('rubber', 0.025, Math.sin(a) * 0.31, 0.025, Math.cos(a) * 0.31, { noEdges: true });
  }
}

// —— 卫浴 ——
function toilet(K) {
  K.lathe('ceramic', [[0, 0], [0.13, 0], [0.18, 0.08], [0.19, 0.2], [0.18, 0.28], [0, 0.28]], 0, 0.14, 0.04, { seg: 40 });
  K.rbox('ceramic', 0.36, 0.28, 0.24, 0.08, 0, 0.14, -0.15, { noClayEdges: true });
  K.rbox('ceramic', 0.37, 0.03, 0.47, 0.03, 0, 0.42, -0.02, { noClayEdges: true });
  K.box('lacquerWhite', 0.6, 1.0, 0.04, 0, 0, -0.29, { noEdges: true });
  K.box('brass', 0.22, 0.15, 0.012, 0, 0.95, -0.264);
  K.box('ceramic', 0.06, 0.03, 0.005, -0.04, 1.01, -0.257, { noEdges: true });
  K.box('ceramic', 0.06, 0.03, 0.005, 0.04, 1.01, -0.257, { noEdges: true });
  K.cyl('brass', 0.008, 0.008, 0.14, 0.4, 0.75, -0.24, { rz: PI / 2, noEdges: true });
  K.cyl('paper', 0.055, 0.055, 0.11, 0.4, 0.69, -0.2, { rz: PI / 2 });
}

function vanity(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  const zb = -d / 2;
  K.box('walnut', w, 0.42, d - 0.02, 0, h - 0.47, 0.0);
  K.box('walnutDark', w - 0.02, 0.004, 0.004, 0, h - 0.26, d / 2 - 0.009, { noEdges: true });
  K.box('brass', w * 0.4, 0.01, 0.015, 0, h - 0.17, d / 2, { noEdges: true });
  K.box('brass', w * 0.4, 0.01, 0.015, 0, h - 0.38, d / 2, { noEdges: true });
  K.box('calacatta', w + 0.01, 0.03, d, 0, h - 0.03, 0);
  K.lathe('ceramic', [[0, 0], [0.13, 0], [0.18, 0.06], [0.2, 0.13], [0.19, 0.135], [0.16, 0.08], [0, 0.03]], 0, h, 0.02, { seg: 40 });
  K.cyl('brass', 0.012, 0.012, 0.2, 0, h + 0.28, zb + 0.1, { rx: PI / 2, noEdges: true });
  K.cyl('brass', 0.03, 0.03, 0.02, 0, h + 0.28, zb + 0.01, { rx: PI / 2, noEdges: true });
  K.lathe('ceramic', [[0, 0], [0.03, 0], [0.035, 0.12], [0.02, 0.15], [0, 0.15]], w / 2 - 0.12, h, zb + 0.1);
  if (it.mirror) {
    const mw = Math.min(w * 0.9, 0.8), mh = 0.8;
    K.box('led', mw + 0.03, mh + 0.03, 0.01, 0, h + 0.4 - 0.015, zb + 0.012, { noEdges: true, noShadow: true });
    K.box('mirror', mw, mh, 0.012, 0, h + 0.4, zb + 0.022);
  }
}

function shower(K, it) {
  // 本构件直接使用世界坐标（毫米），原点在 (0,0)
  const x0 = M(it.x0), x1 = M(it.x1), zs = M(it.z1);
  const H = 2.0;
  const len = x1 - x0;
  const door = Math.min(0.7, len * 0.5);
  K.box('glass', len - door - 0.01, H, 0.01, x0 + (len - door) / 2, 0.02, zs - 0.02, { cat: 'glass', noShadow: true });
  const dg = K.group(x1 - door, 0, zs - 0.02, -0.5);
  const DK = kit(dg, 'glass');
  DK.box('glass', door, H, 0.01, door / 2, 0.02, 0, { noShadow: true });
  DK.box('brass', 0.016, 0.3, 0.03, door - 0.06, 0.9, 0.02, { noEdges: true });
  for (const [a, b] of [[x0, x0 + 0.015], [x1 - door - 0.01, x1 - door + 0.005], [x1 - 0.015, x1]]) K.box('brass', b - a, H, 0.03, (a + b) / 2, 0.02, zs - 0.02, { cat: 'glass' });
  K.box('brass', len - door, 0.02, 0.02, x0 + (len - door) / 2, H + 0.02, zs - 0.02, { noEdges: true });
  K.box('brass', len - 0.1, 0.006, 0.05, x0 + len / 2, 0.003, zs - 0.12, { noEdges: true, noShadow: true });
  // 花洒
  const [hx, hz, dx, dz] = it.head.map((v, i) => (i < 2 ? M(v) : v));
  K.cyl('brass', 0.014, 0.014, 1.15, hx + dx * 0.04, 0.95, hz + dz * 0.04, { noEdges: true });
  K.box('brass', Math.abs(dx) > 0 ? 0.36 : 0.02, 0.02, Math.abs(dz) > 0 ? 0.36 : 0.02, hx + dx * 0.22, 2.08, hz + dz * 0.22, { noEdges: true });
  K.cyl('brass', 0.13, 0.13, 0.012, hx + dx * 0.38, 2.06, hz + dz * 0.38, { seg: 40 });
  K.box('brass', Math.abs(dx) > 0 ? 0.04 : 0.16, 0.16, Math.abs(dz) > 0 ? 0.04 : 0.16, hx + dx * 0.02, 1.0, hz + dz * 0.02, { noEdges: true });
  // 壁龛
  if (it.niche) {
    const [nx, nz, ndx, ndz] = it.niche;
    K.box('marbleDark', Math.abs(ndx) > 0 ? 0.03 : 0.6, 0.32, Math.abs(ndz) > 0 ? 0.03 : 0.6, M(nx), 1.15, M(nz), { noEdges: true });
    K.lathe('ceramic', [[0, 0], [0.03, 0], [0.032, 0.16], [0.012, 0.19], [0, 0.19]], M(nx) + ndx * 0.06 - (Math.abs(ndz) > 0 ? 0.12 : 0), 1.15, M(nz) + ndz * 0.06 - (Math.abs(ndx) > 0 ? 0.12 : 0));
  }
}

function stoneBench(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('fishbelly', w, h, d, 0, 0, 0);
  K.box('linen', 0.32, 0.06, 0.24, -w * 0.25, h, 0.0);
  K.box('linenGrey', 0.3, 0.05, 0.22, -w * 0.25, h + 0.06, 0.0);
}

function bathShelf(K, it) {
  const w = M(it.w);
  for (const y of [1.0, 1.3]) {
    K.cyl('brass', 0.01, 0.01, w, 0, y, 0.08, { rz: PI / 2, noEdges: true });
    for (const sx of [-1, 1]) K.box('brass', 0.02, 0.02, 0.08, sx * w / 2, y - 0.01, 0.04, { noEdges: true });
  }
  K.box('linen', w * 0.42, 0.5, 0.03, -w * 0.18, 0.55, 0.09, { noClayEdges: true });
  K.box('linenGrey', w * 0.36, 0.42, 0.03, w * 0.2, 0.86, 0.09, { noClayEdges: true });
}

// —— 生活阳台 ——
function washer(K) {
  K.box('appliance', 0.6, 0.85, 0.58, 0, 0.0, 0);
  K.box('steel', 0.6, 0.1, 0.005, 0, 0.73, 0.291, { noEdges: true });
  K.torus('steel', 0.17, 0.022, 0, 0.42, 0.3, { rx: 0 });
  K.cyl('glassSmoke', 0.15, 0.15, 0.02, 0, 0.42, 0.29, { rx: PI / 2, noEdges: true });
  K.cyl('steel', 0.025, 0.025, 0.02, 0.2, 0.78, 0.3, { rx: PI / 2, noEdges: true });
}

function mopSink(K, it) {
  const w = M(it.w), d = M(it.d);
  K.box('ceramic', w, 0.3, d, 0, 0, 0);
  K.box('steel', w - 0.08, 0.004, d - 0.08, 0, 0.298, 0, { noEdges: true });
  K.cyl('steel', 0.012, 0.012, 0.18, 0, 0.75, -d / 2 + 0.09, { rx: PI / 2, noEdges: true });
  K.box('steel', 0.05, 0.08, 0.03, 0, 0.72, -d / 2 + 0.02, { noEdges: true });
}

function wallCabinet(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h), y = M(it.y);
  K.box('lacquerWhite', w, h, d, 0, y, 0);
  const n = Math.max(1, Math.round(w / 0.5));
  for (let i = 1; i < n; i++) K.box('lacquerDark', 0.004, h - 0.02, 0.004, -w / 2 + (i * w) / n, y + 0.01, d / 2 + 0.001, { noEdges: true });
  for (let i = 0; i < n; i++) K.box('brass', 0.1, 0.01, 0.015, -w / 2 + (i + 0.5) * (w / n), y + 0.04, d / 2 + 0.008, { noEdges: true });
}

function dryingRack(K, it) {
  const w = M(it.w);
  for (const z of [-0.18, 0.18]) K.cyl('steel', 0.012, 0.012, w, 0, 2.3, z, { rz: PI / 2, noEdges: true });
  for (const sx of [-1, 1]) {
    K.box('steel', 0.03, 0.03, 0.4, sx * w / 2, 2.29, 0, { noEdges: true });
    K.cyl('steel', 0.004, 0.004, 0.48, sx * w / 2, 2.32, 0, { noEdges: true, noShadow: true });
  }
  const r = rand(23);
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.15 + (i * (w - 0.3)) / 5;
    K.box(['clothes1', 'clothes4', 'linen', 'clothes2'][i % 4], 0.38 + r() * 0.1, 0.55 + r() * 0.2, 0.01, x, 1.65, i % 2 ? 0.18 : -0.18, { noClayEdges: true });
  }
}

// —— 厨房 ——
function kitchenRun(K, it) {
  const w = M(it.w), d = M(it.d);
  const top = 0.88;
  K.box('lacquerDark', w - 0.02, 0.1, d - 0.08, 0, 0, -0.04);
  K.box('lacquerCream', w, top - 0.13, d - 0.02, 0, 0.1, -0.01);
  const n = Math.max(1, Math.round(w / 0.6));
  for (let i = 1; i < n; i++) K.box('lacquerDark', 0.004, top - 0.15, 0.004, -w / 2 + (i * w) / n, 0.11, d / 2 - 0.019, { noEdges: true });
  K.box('brass', w - 0.04, 0.012, 0.016, 0, top - 0.06, d / 2 - 0.01, { noEdges: true });
  K.box('quartz', w + 0.01, 0.03, d + 0.01, 0, top - 0.03, 0);
  if (it.sink !== undefined) {
    const sx = -w / 2 + it.sink * w;
    K.box('steel', 0.72, 0.006, 0.42, sx, top, 0.02, { noEdges: true });
    K.box('blackGlass', 0.68, 0.003, 0.38, sx, top + 0.004, 0.02, { noEdges: true });
    K.cyl('brass', 0.022, 0.025, 0.04, sx, top, -d / 2 + 0.07);
    K.tube('brass', [[sx, top + 0.04, -d / 2 + 0.07], [sx, top + 0.36, -d / 2 + 0.08], [sx, top + 0.42, -d / 2 + 0.17], [sx, top + 0.3, -d / 2 + 0.26]], 0.011);
  }
  if (it.cooktop) {
    K.box('blackGlass', 0.76, 0.006, 0.5, 0, top, 0.0, { noEdges: true });
    for (const [bx, bz, br] of [[-0.18, 0.05, 0.09], [0.18, 0.05, 0.07]]) {
      K.torus('blackMetal', br, 0.008, bx, top + 0.012, bz, { rx: PI / 2, noEdges: true });
      K.cyl('brass', br * 0.45, br * 0.45, 0.012, bx, top + 0.006, bz, { noEdges: true });
    }
    for (const kx of [-0.12, 0.12]) K.cyl('steel', 0.02, 0.02, 0.025, kx, 0.72, d / 2, { rx: PI / 2, noEdges: true });
    // 侧吸油烟机
    K.box('blackGlass', 0.8, 0.5, 0.36, 0, 1.55, -d / 2 + 0.18);
    K.box('steel', 0.8, 0.06, 0.37, 0, 1.55, -d / 2 + 0.185, { noEdges: true });
  }
  // 吊柜与台面挡水
  if (it.uppers) {
    K.box('calacatta', w, 0.62, 0.012, 0, top, -d / 2 + 0.006, { noEdges: true });
    const uw = (w - 0.8) / 2;
    for (const s of [-1, 1]) {
      const cx = s * (0.4 + uw / 2);
      if (uw < 0.15) continue;
      K.box('lacquerCream', uw, 0.8, 0.35, cx, 1.5, -d / 2 + 0.175);
      K.box('led', uw - 0.04, 0.006, 0.01, cx, 1.494, -d / 2 + 0.3, { noEdges: true, noShadow: true });
      K.box('brass', 0.1, 0.01, 0.015, cx, 1.53, -d / 2 + 0.355, { noEdges: true });
    }
  }
  // 台面小物
  K.box('walnut', 0.42, 0.025, 0.28, w / 2 - 0.3, top, 0.02, { ry: 0.15 });
  K.lathe('ceramic', [[0, 0], [0.06, 0], [0.065, 0.16], [0, 0.16]], -w / 2 + 0.16, top, -0.15);
}

function ovenTower(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('lacquerCream', w, h - 0.08, d, 0, 0.08, 0);
  K.box('lacquerDark', w - 0.04, 0.08, d - 0.06, 0, 0, -0.03);
  K.box('blackGlass', w - 0.04, 0.58, 0.02, 0, 0.82, d / 2, { noEdges: true });
  K.box('blackGlass', w - 0.04, 0.45, 0.02, 0, 1.45, d / 2, { noEdges: true });
  K.box('steel', w - 0.12, 0.015, 0.03, 0, 1.36, d / 2 + 0.015, { noEdges: true });
  K.box('steel', w - 0.12, 0.015, 0.03, 0, 1.86, d / 2 + 0.015, { noEdges: true });
}

function fridge(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('steel', w, h, d, 0, 0, 0);
  K.box('blackMetal', w - 0.01, 0.006, 0.004, 0, 1.1, d / 2 + 0.001, { noEdges: true });
  K.box('steel', 0.02, 0.5, 0.04, -w / 2 + 0.06, 1.2, d / 2 + 0.02, { noEdges: true });
  K.box('steel', 0.02, 0.5, 0.04, -w / 2 + 0.06, 0.5, d / 2 + 0.02, { noEdges: true });
  K.box('lacquerCream', w, 2.4 - h, d, 0, h, 0);
}

// —— 玄关 ——
function shoeCabinet(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  const y0 = 0.15, n0 = 1.0, n1 = 1.3;
  K.box('lacquerCream', w, n0 - y0, d, 0, y0, 0);
  K.box('walnut', w, n1 - n0, 0.02, 0, n0, -d / 2 + 0.01);
  K.box('walnut', w, 0.02, d, 0, n0, 0);
  K.box('lacquerCream', w, h - n1, d, 0, n1, 0);
  K.box('led', w - 0.06, 0.006, 0.01, 0, n1 - 0.008, d / 2 - 0.06, { noEdges: true, noShadow: true });
  K.box('led', w - 0.06, 0.006, 0.01, 0, y0 - 0.008, d / 2 - 0.08, { noEdges: true, noShadow: true });
  const n = Math.round(w / 0.45);
  for (let i = 1; i < n; i++) {
    const x = -w / 2 + (i * w) / n;
    K.box('lacquerDark', 0.004, n0 - y0 - 0.02, 0.004, x, y0 + 0.01, d / 2 + 0.001, { noEdges: true });
    K.box('lacquerDark', 0.004, h - n1 - 0.02, 0.004, x, n1 + 0.01, d / 2 + 0.001, { noEdges: true });
  }
  K.box('brass', w, 0.012, 0.016, 0, n0 - 0.012, d / 2 + 0.008, { noEdges: true });
  K.box('brass', w, 0.012, 0.016, 0, n1, d / 2 + 0.008, { noEdges: true });
  K.box('walnut', 0.24, 0.02, 0.16, -w * 0.25, n0 + 0.02, 0.05);
  K.lathe('ceramic', [[0, 0], [0.05, 0], [0.06, 0.12], [0.02, 0.18], [0, 0.18]], w * 0.25, n0 + 0.02, 0);
  K.box('rubber', 0.28, 0.08, 0.1, -w * 0.3, 0.0, d / 2 + 0.1, { ry: 0.1 });
  K.box('leatherCognac', 0.26, 0.09, 0.1, -w * 0.08, 0.0, d / 2 + 0.12, { ry: -0.15 });
}

// —— 会客厅 ——
function tvCabinet(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h), y = M(it.y);
  K.box('walnut', w, h - 0.025, d - 0.01, 0, y, -0.005);
  K.box('marbleDark', w + 0.01, 0.025, d, 0, y + h - 0.025, 0);
  K.box('led', w - 0.1, 0.006, 0.01, 0, y - 0.006, d / 2 - 0.08, { noEdges: true, noShadow: true });
  const n = 4;
  for (let i = 1; i < n; i++) K.box('walnutDark', 0.004, h - 0.05, 0.004, -w / 2 + (i * w) / n, y + 0.01, d / 2 - 0.009, { noEdges: true });
  for (let i = 0; i < n; i++) K.box('brass', 0.16, 0.01, 0.015, -w / 2 + (i + 0.5) * (w / n), y + h - 0.08, d / 2, { noEdges: true });
  const t = y + h;
  K.lathe('ceramic', [[0, 0], [0.07, 0], [0.11, 0.1], [0.07, 0.3], [0.05, 0.4], [0.06, 0.44], [0, 0.44]], -w * 0.36, t, 0);
  K.lathe('marbleDark', [[0, 0], [0.04, 0], [0.05, 0.08], [0.02, 0.22], [0, 0.22]], -w * 0.3, t, 0.05);
  K.box('book1', 0.3, 0.04, 0.22, w * 0.33, t, 0, { ry: 0.1 });
  K.box('book4', 0.28, 0.035, 0.2, w * 0.33, t + 0.04, 0, { ry: -0.05 });
  K.sphere('brass', 0.07, w * 0.33, t + 0.145, 0.0);
  // 音响条
  K.box('blackMetal', 1.1, 0.07, 0.1, 0, t, 0.05);
}

function sofaModule(K, we, d, arm, fab) {
  K.box('brass', we - 0.06, 0.06, d - 0.06, 0, 0, 0, { noEdges: true });
  K.rbox(fab, we, 0.34, d, 0.04, 0, 0.06, 0, { noClayEdges: true });
  K.rbox(fab, we - 0.02, 0.14, d - 0.24, 0.05, 0, 0.4, 0.1, { noClayEdges: true });
  K.rbox(fab, we - 0.04, 0.42, 0.22, 0.08, 0, 0.4, -d / 2 + 0.13, { rx: -0.1, noClayEdges: true });
  if (arm) K.rbox(fab, 0.18, 0.26, d, 0.07, arm * (we / 2 - 0.09), 0.4, 0, { noClayEdges: true });
}

function sofa(K, it) {
  const w = M(it.w), d = M(it.d), we = 1.05, a = 0.62;
  const fab = 'fabricSofa';
  sofaModule(K, w, d, 0, fab);
  for (const s of [1, -1]) {
    const cx = s * (w / 2 + (we / 2) * Math.cos(a) - (d / 2) * Math.sin(a));
    const cz = -d / 2 + (we / 2) * Math.sin(a) + (d / 2) * Math.cos(a);
    const g = K.group(cx, 0, cz, -s * a);
    sofaModule(kit(g, 'furn'), we, d, s, fab);
    // 转角填充
    K.cyl(fab, d * 0.5, d * 0.5, 0.34, s * (w / 2), 0.06, -d / 2 + d * 0.5, { seg: 24, t0: s > 0 ? PI / 2 - a : PI / 2, tl: a, noClayEdges: true });
    K.cyl(fab, d * 0.36, d * 0.36, 0.14, s * (w / 2), 0.4, -d / 2 + d * 0.5, { seg: 24, t0: s > 0 ? PI / 2 - a : PI / 2, tl: a, noClayEdges: true });
  }
  // 抱枕
  const P = [['velvetSage', -0.45, 0.3], ['velvetCaramel', 0.45, -0.3], ['linenGrey', 0, 0]];
  for (const [role, x, rz] of P) K.rbox(role, 0.46, 0.46, 0.13, 0.06, x, 0.5, -d / 2 + 0.3, { rz, rx: -0.2, noClayEdges: true });
  K.rbox('throwCaramel', 0.5, 0.02, 0.7, 0.01, w / 2 - 0.2, 0.545, 0.1, { noClayEdges: true });
}

function plant(K, it) {
  const h = M(it.h || 1700);
  K.lathe('pot', [[0, 0], [0.18, 0], [0.24, 0.08], [0.25, 0.42], [0.23, 0.44], [0, 0.44]], 0, 0, 0, { seg: 40 });
  K.cyl('soil', 0.22, 0.22, 0.01, 0, 0.42, 0, { noEdges: true });
  K.tube('bark', [[0, 0.42, 0], [0.04, 0.8, 0.02], [-0.03, 1.1, -0.02], [0.02, h - 0.4, 0.03]], 0.035);
  K.tube('bark', [[0, 0.95, 0], [0.18, 1.15, 0.05], [0.28, 1.3, 0.1]], 0.018);
  K.tube('bark', [[0, 1.05, 0], [-0.16, 1.25, -0.06], [-0.26, 1.4, -0.1]], 0.016);
  const mg = merger(K.group(), 'furn');
  const r = rand(31);
  for (let i = 0; i < 160; i++) {
    const a = r() * PI * 2, rr = Math.sqrt(r()) * 0.5;
    const y = h - 0.55 + r() * 0.6 - rr * 0.3;
    mg.leaf(r() < 0.5 ? 'plant' : 'plantDark', 0.05, Math.cos(a) * rr, y, Math.sin(a) * rr, 1.6, 0.35, 0.7, r() * PI);
  }
  mg.flush({ noEdges: true });
}

function equipBox(K, it) {
  const w = M(it.w), d = M(it.d), h = M(it.h);
  K.box('lacquerWhite', w, h, d, 0, 0, 0);
  K.box('lacquerDark', w - 0.04, 0.004, 0.004, 0, h * 0.5, d / 2 + 0.001, { noEdges: true });
  K.lathe('pot', [[0, 0], [0.07, 0], [0.09, 0.16], [0, 0.16]], 0, h, 0);
  const mg = merger(K.group(), 'furn');
  const r = rand(5);
  for (let i = 0; i < 26; i++) mg.leaf('plant', 0.04, (r() - 0.5) * 0.18, h + 0.18 + r() * 0.2, (r() - 0.5) * 0.18, 1.4, 0.3, 0.6, r() * PI);
  mg.flush({ noEdges: true });
}

const BUILDERS = {
  bed, nightstand, wardrobe, walkinWardrobe, tallCabinet, tv, floatShelf, rug, radiator, loungeChair,
  coffeeTable, sideTable, pouf, floorLamp, diningTable, diningChair, pendant, sideboard, bookcase, desk, officeChair,
  toilet, vanity, shower, stoneBench, bathShelf, washer, mopSink, wallCabinet, dryingRack, kitchenRun, ovenTower, fridge,
  shoeCabinet, tvCabinet, sofa, plant, equipBox,
};

function buildArt(g, it) {
  const K = kit(g, 'furn');
  const w = M(it.w), h = M(it.h), y = M(it.y) - h / 2;
  const geo = new THREE.BoxGeometry(w - 0.04, h - 0.04, 0.022);
  const m = new THREE.Mesh(geo);
  tag(m, ['paper', 'paper', 'paper', 'paper', it.art, 'paper'], { cat: 'furn' });
  m.position.set(0, y + h / 2, 0.016);
  g.add(m);
  for (const [fw, fh, fx, fy] of [[w, 0.02, 0, y], [w, 0.02, 0, y + h - 0.02], [0.02, h, -w / 2 + 0.01, y], [0.02, h, w / 2 - 0.01, y]]) {
    K.box('brass', fw, fh, 0.032, fx, fy, 0.016);
  }
}

// 额外信息（世界坐标的构件，如淋浴花洒位置）
const EXTRA = {
  'shower-mbath': { x0: 100, x1: 1660, z1: 1550, head: [270, 950, 1, 0], niche: [1655, 1150, -1, 0] },
  'shower-bath2': { x0: 4500, x1: 5690, z1: 1640, head: [5690, 1150, -1, 0], niche: [4505, 1100, 1, 0] },
};

export function buildFurniture(items) {
  const root = new THREE.Group();
  root.name = 'furniture';
  const groups = new Map();
  const lights = [];
  for (const raw of items) {
    const it = { ...raw, ...(EXTRA[raw.id] || {}) };
    const g = new THREE.Group();
    g.name = it.id;
    const worldParts = it.type === 'shower';
    if (!worldParts) {
      g.position.set(M(it.x), 0, M(it.z));
      g.rotation.y = THREE.MathUtils.degToRad(it.rot || 0);
    }
    const local = [];
    if (it.type === 'art') buildArt(g, it);
    else {
      const fn = BUILDERS[it.type];
      if (!fn) { console.warn('未知家具类型', it.type); continue; }
      fn(kit(g, 'furn'), it, local);
    }
    g.updateMatrixWorld(true);
    for (const L of local) {
      const v = new THREE.Vector3(L.x, L.y, L.z).applyMatrix4(g.matrixWorld);
      lights.push({ ...L, x: v.x, y: v.y, z: v.z, item: it.id });
    }
    g.userData.item = raw;
    g.traverse((m) => { if (m.isMesh) m.userData.pick = { type: 'furn', id: it.id }; });
    mergeMeshes(g);
    root.add(g);
    groups.set(it.id, g);
  }
  return { root, groups, lights };
}
