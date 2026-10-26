// 家具与软装：每件家具都是一个独立的组，位置取自图纸（mm），点击可查看讲解
import * as THREE from 'three';
import { v, boxGeo, rboxGeo, cylGeo, latheGeo, part, block, rblock, cyl, compact } from './kit.js';

const D2R = Math.PI / 180;
export const ITEMS = [];

// —— 通用几何 ——
// 圆环扇形（θ 自 +X 转向 +Z），向上挤出 h；bevel 为圆角
function sectorGeo(r0, r1, a0, a1, h, bevel = 0, seg = 48) {
  const s = new THREE.Shape();
  const da = bevel ? bevel / ((r0 + r1) / 2) : 0;
  const R0 = r0 + bevel, R1 = r1 - bevel, A0 = a0 + da, A1 = a1 - da;
  for (let i = 0; i <= seg; i++) {
    const t = A0 + (A1 - A0) * (i / seg);
    if (i === 0) s.moveTo(R1 * Math.cos(t), -R1 * Math.sin(t)); else s.lineTo(R1 * Math.cos(t), -R1 * Math.sin(t));
  }
  for (let i = seg; i >= 0; i--) {
    const t = A0 + (A1 - A0) * (i / seg);
    s.lineTo(R0 * Math.cos(t), -R0 * Math.sin(t));
  }
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, h - 2 * bevel), bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel,
    bevelSegments: 3, curveSegments: 4,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, bevel, 0);
  return g;
}

function sector(parent, key, r0, r1, a0, a1, y, h, bevel = 0) {
  return part(parent, sectorGeo(r0, r1, a0, a1, h, bevel), key, 0, y, 0);
}

function leafGeo(L, W) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(W * 0.7, L * 0.2, W * 0.6, L * 0.75, 0, L);
  s.bezierCurveTo(-W * 0.6, L * 0.75, -W * 0.7, L * 0.2, 0, 0);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), x = p.getX(i);
    p.setZ(i, -((y / L) ** 2) * L * 0.25 + Math.abs(x) * 0.25);
  }
  g.computeVertexNormals();
  return g;
}

// 放置与登记
function place(id, g, meta) {
  const [x, z] = meta.at;
  g.position.set(v(x), meta.y ? v(meta.y) : 0, v(z));
  g.rotation.y = (meta.ry || 0) * D2R;
  g.name = id;
  g.userData = { type: 'furniture', id, room: meta.room, name: meta.name, size: meta.size, mat: meta.mat, note: meta.note, noBlock: !!g.userData.noBlock };
  compact(g);
  ITEMS.push(g);
  return g;
}

// ———————————————————————— 单品构件 ————————————————————————

function tableLamp(parent, x, y, z, s = 1) {
  part(parent, latheGeo([[0, 0], [0.07 * s, 0], [0.085 * s, 0.06 * s], [0.06 * s, 0.22 * s], [0.025 * s, 0.3 * s], [0.012 * s, 0.32 * s], [0, 0.32 * s]], 32), 'ceramic', x, y, z);
  cyl(parent, 'brass', 0.006 * s, 0.12 * s, x, y + 0.3 * s, z, 8);
  part(parent, cylGeo(0.12 * s, 0.15 * s, 0.2 * s, 40, true), 'lampShade', x, y + 0.42 * s, z);
  part(parent, new THREE.SphereGeometry(0.03 * s, 12, 8), 'bulb', x, y + 0.4 * s, z);
}

function plant(g, s = 1, light = false) {
  part(g, latheGeo([[0, 0], [0.16 * s, 0], [0.2 * s, 0.05 * s], [0.22 * s, 0.38 * s], [0.2 * s, 0.4 * s], [0, 0.4 * s]], 40), light ? 'potLight' : 'pot', 0, 0, 0);
  cyl(g, 'soil', 0.195 * s, 0.01, 0, 0.385 * s, 0, 24);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (i % 3) * 0.3;
    const tilt = 0.08 + (i % 4) * 0.08;
    const L = (0.36 + (i % 5) * 0.06) * s, stemH = (0.35 + (i % 3) * 0.25) * s;
    const sx = Math.cos(a) * 0.05 * s, sz = Math.sin(a) * 0.05 * s;
    const t = tilt * 0.6;
    const stem = part(g, cylGeo(0.006 * s, 0.009 * s, stemH, 6), 'leafDark', sx, 0.4 * s + stemH / 2, sz);
    stem.rotation.set(Math.sin(a) * t, 0, -Math.cos(a) * t);
    const off = Math.sin(t) * stemH / 2;
    const lf = part(g, leafGeo(L, L * 0.42), i % 2 ? 'leaf' : 'leafDark', sx + Math.cos(a) * off, 0.4 * s + stemH / 2 + Math.cos(t) * stemH / 2, sz + Math.sin(a) * off);
    lf.rotation.set(-tilt - 0.22, -a - Math.PI / 2, 0, 'YXZ');
    lf.castShadow = true;
  }
}

function frameArt(g, w, h, seed, depth = 0.035) {
  block(g, 'bronze', w + 0.04, h + 0.04, depth, 0, -0.02, 0);
  const art = part(g, new THREE.PlaneGeometry(w, h), `art:${seed}:${Math.round(w * 600)}:${Math.round(h * 600)}`, 0, h / 2, depth / 2 + 0.001);
  art.castShadow = false;
}

function pillow(g, key, w, h, x, y, z, rx, ry) {
  return part(g, rboxGeo(w, h, 0.14, 0.06, 3), key, x, y, z, rx, ry, 0);
}

function tv(g, w, h, shelf) {
  block(g, 'bronze', w, h, 0.03, 0, -h / 2, 0.015);
  const sc = part(g, new THREE.PlaneGeometry(w - 0.012, h - 0.012), 'screen', 0, 0, 0.0311);
  sc.castShadow = false;
  if (shelf) {
    block(g, 'walnut', shelf, 0.12, 0.3, 0, -h / 2 - 0.62, 0.15);
    block(g, 'led', shelf - 0.04, 0.004, 0.01, 0, -h / 2 - 0.625, 0.28);
  }
}

// ———————————————————————— 会客厅 ————————————————————————
function buildLiving() {
  const TC = [8475, 6760];          // 大圆几圆心：电视柜前 1165 + 半径 600
  const rF = 1.59, rB = 2.44;       // 沙发前沿半径（几边到沙发 990）与靠背外沿
  const a0 = -35 * D2R, a1 = 30 * D2R;

  // 弧形组合沙发
  {
    const g = new THREE.Group();
    sector(g, 'bronze', rF + 0.06, rB - 0.04, a0 + 0.01, a1 - 0.01, 0, 0.07);
    sector(g, 'fabricSofa', rF, rB, a0, a1, 0.07, 0.24, 0.02);
    const segs = 3, gapA = 0.006;
    for (let i = 0; i < segs; i++) {
      const s0 = a0 + ((a1 - a0) * i) / segs + gapA, s1 = a0 + ((a1 - a0) * (i + 1)) / segs - gapA;
      sector(g, 'fabricSofa', rF + 0.01, rB - 0.2, s0, s1, 0.31, 0.13, 0.04);
      sector(g, 'fabricSofa', rB - 0.36, rB - 0.19, s0, s1, 0.42, 0.33, 0.06);
    }
    sector(g, 'fabricSofa', rB - 0.2, rB, a0, a1, 0.31, 0.47, 0.03);
    for (const [aa, sign] of [[a0, 1], [a1, -1]]) {
      const w = 0.16 / ((rF + rB) / 2);
      sector(g, 'fabricSofa', rF, rB, sign > 0 ? aa : aa - w, sign > 0 ? aa + w : aa, 0.31, 0.3, 0.03);
    }
    // 抱枕
    const pil = [[-24, 'velvetOlive'], [-14, 'fabricCushion'], [9, 'fabricThrow'], [19, 'velvetBlue']];
    for (const [deg, key] of pil) {
      const a = deg * D2R, r = rB - 0.42;
      const p = pillow(g, key, 0.48, 0.46, Math.cos(a) * r, 0.68, Math.sin(a) * r, 0, 0);
      p.rotation.set(-0.3, Math.atan2(-Math.cos(a), -Math.sin(a)), 0, 'YXZ');
    }
    // 搭毯
    const ta = 22 * D2R;
    part(g, rboxGeo(0.55, 0.03, 0.9, 0.012), 'fabricThrow', Math.cos(ta) * (rF + 0.42), 0.455, Math.sin(ta) * (rF + 0.42), 0, -ta, 0.04);
    place('sofa', g, { at: TC, room: 'living', name: '弧形组合沙发', size: '弧长约 3500 · 座深 895 · 座高 440', mat: '浅燕麦色圈绒面料 · 深古铜踢脚', note: '三段式弧形布局，圆心对准大圆几（图纸：几到沙发 990、座深 895）。靠背贴东墙，两端向西收拢，形成围合的谈话区。' });
  }
  // 大圆几 Ø1200
  {
    const g = new THREE.Group();
    part(g, cylGeo(0.36, 0.36, 0.3, 64), 'fluteWalnut', 0, 0.15, 0);
    cyl(g, 'brass', 0.375, 0.012, 0, 0.3, 0, 64);
    cyl(g, 'marbleNero', 0.6, 0.035, 0, 0.312, 0, 72);
    cyl(g, 'brass', 0.37, 0.01, 0, 0.0, 0, 64);
    // 摆件：托盘、花瓶、书
    cyl(g, 'brass', 0.17, 0.015, -0.18, 0.347, 0.12, 40);
    part(g, latheGeo([[0, 0], [0.05, 0], [0.07, 0.08], [0.045, 0.2], [0.03, 0.26], [0.035, 0.28], [0, 0.28]], 32), 'ceramic', -0.2, 0.362, 0.1);
    for (let i = 0; i < 5; i++) {
      const b = part(g, cylGeo(0.003, 0.004, 0.35, 5), 'leafDark', -0.2 + (i - 2) * 0.012, 0.362 + 0.4, 0.1);
      b.rotation.z = (i - 2) * 0.18;
    }
    block(g, 'leatherDark', 0.3, 0.035, 0.22, 0.2, 0.347, -0.15, 0.3);
    block(g, 'paper', 0.26, 0.03, 0.19, 0.2, 0.382, -0.15, 0.4);
    place('coffeeBig', g, { at: TC, room: 'living', name: '大圆茶几', size: 'Ø1200 × H350', mat: '黑金花大理石台面 · 胡桃木格栅底座 · 香槟金收边', note: '图纸标注 Ø1200，距电视柜 1165、距沙发 990，是客厅的几何中心。' });
  }
  // 小圆几 Ø800（与大几错层叠放）
  {
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      const leg = part(g, cylGeo(0.01, 0.014, 0.42, 12), 'brass', Math.cos(a) * 0.26, 0.21, Math.sin(a) * 0.26);
      leg.rotation.set(Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12);
    }
    cyl(g, 'marbleTop', 0.4, 0.025, 0, 0.405, 0, 64);
    part(g, new THREE.SphereGeometry(0.06, 24, 16), 'brass', 0.1, 0.49, 0.05);
    place('coffeeSmall', g, { at: [8330, 5950], room: 'living', name: '小圆几', size: 'Ø800 × H430', mat: '雅士白大理石 · 香槟金三脚', note: '比大圆几高 80，可部分叠在大几上方，节省面积也更有层次（图纸中两个圆相交）。' });
  }
  // 休闲单椅 ×2
  const lounge = (id, at, ry) => {
    const g = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = part(g, cylGeo(0.012, 0.016, 0.2, 10), 'bronze', Math.cos(a) * 0.26, 0.1, Math.sin(a) * 0.26);
      leg.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2);
    }
    part(g, cylGeo(0.36, 0.34, 0.12, 48), 'leatherCognac', 0, 0.26, 0);
    part(g, rboxGeo(0.62, 0.12, 0.6, 0.05), 'leatherCognac', 0, 0.38, 0.02);
    sector(g, 'leatherCognac', 0.3, 0.4, 160 * D2R, 380 * D2R, 0.2, 0.5, 0.035);
    pillow(g, 'fabricSofa', 0.4, 0.3, 0, 0.6, -0.17, -0.25, 0);
    place(id, g, { at, ry, room: 'living', name: '休闲单椅', size: '800 × 780 × H700', mat: '干邑色植鞣皮 · 深古铜椅脚', note: '圈椅式环抱靠背，两把椅子斜对大圆几摆放，与弧形沙发一起围成完整的会客圆。' });
  };
  lounge('lounge1', [7211, 8069], 136);
  lounge('lounge2', [8991, 7836], -154);
  // 边几（两椅之间）
  {
    const g = new THREE.Group();
    part(g, latheGeo([[0, 0], [0.16, 0], [0.16, 0.02], [0.05, 0.05], [0.04, 0.45], [0.06, 0.48], [0, 0.48]], 40), 'brass', 0, 0, 0);
    cyl(g, 'marbleGreige', 0.275, 0.03, 0, 0.48, 0, 56);
    part(g, latheGeo([[0, 0], [0.04, 0], [0.06, 0.05], [0.03, 0.14], [0, 0.14]], 24), 'potLight', 0.08, 0.51, 0);
    place('sideTable', g, { at: [8075, 8120], room: 'living', name: '边几', size: 'Ø550 × H510', mat: '灰调大理石 · 香槟金立柱', note: '服务两把单椅，放茶杯或书。' });
  }
  // 角几 + 台灯（沙发北端）
  {
    const g = new THREE.Group();
    cyl(g, 'walnut', 0.225, 0.52, 0, 0, 0, 48);
    cyl(g, 'brass', 0.228, 0.01, 0, 0.52, 0, 48);
    tableLamp(g, 0, 0.53, 0, 1.1);
    place('cornerTable', g, { at: [10790, 5390], room: 'living', name: '角几与台灯', size: 'Ø450 × H530（含灯 H1050）', mat: '胡桃木 · 陶瓷灯座 · 亚麻灯罩', note: '填补弧形沙发与墙角之间的三角空间，夜间是沙发区的阅读光源。' });
  }
  // 脚踏
  {
    const g = new THREE.Group();
    part(g, rboxGeo(0.6, 0.36, 0.45, 0.06), 'fabricSofa', 0, 0.2, 0);
    block(g, 'bronze', 0.5, 0.02, 0.35, 0, 0, 0);
    place('ottoman', g, { at: [9947, 8039], ry: -131, room: 'living', name: '脚踏', size: '600 × 450 × H400', mat: '与沙发同款圈绒', note: '位于沙发南端（图纸中弧形沙发尾部的圆角矩形），可作搁脚或临时座位。' });
  }
  // 弧形落地灯
  {
    const g = new THREE.Group();
    part(g, cylGeo(0.13, 0.14, 0.05, 48), 'marbleNero', 0, 0.025, 0);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.05, 0), new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(0.1, 1.85, 0.25),
      new THREE.Vector3(0.1, 2.0, 0.7), new THREE.Vector3(0.05, 1.85, 1.1),
    ]);
    part(g, new THREE.TubeGeometry(curve, 48, 0.012, 8), 'brass', 0, 0, 0);
    part(g, new THREE.SphereGeometry(0.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), 'brass', 0.05, 1.72, 1.15);
    part(g, new THREE.CircleGeometry(0.19, 32), 'bulb', 0.05, 1.721, 1.15, Math.PI / 2, 0, 0);
    place('arcLamp', g, { at: [10830, 7860], ry: -115, room: 'living', name: '弧形落地灯', size: '臂展 1150 × H2000', mat: '黑金花石材底座 · 香槟金灯臂', note: '灯头越过沙发南端，为阅读提供向下的局部照明，不需要天花灯位。' });
  }
  // 大型绿植
  {
    const g = new THREE.Group();
    plant(g, 1.25);
    place('plantLiving', g, { at: [10580, 8200], room: 'living', name: '琴叶榕', size: 'H约 1600', mat: '哑光陶盆', note: '放在窗边角落，享受南向日照，也柔化石材与金属的硬朗感。' });
  }
  // 电视柜（悬浮）
  {
    const g = new THREE.Group();
    const L = 3.0, Dp = 0.4;
    block(g, 'walnut', L, 0.32, Dp - 0.02, 0, 0.16, -0.01);
    block(g, 'fluteWalnut', L - 0.02, 0.3, 0.02, 0, 0.17, Dp / 2 - 0.01);
    block(g, 'marbleNero', L + 0.02, 0.025, Dp + 0.01, 0, 0.48, 0);
    block(g, 'led', L - 0.1, 0.004, 0.01, 0, 0.155, Dp / 2 - 0.05);
    // 摆件
    for (const [x, h, r] of [[-1.1, 0.32, 0.07], [-0.95, 0.22, 0.05]]) part(g, latheGeo([[0, 0], [r, 0], [r * 1.2, h * 0.4], [r * 0.5, h], [0, h]], 32), 'ceramic', x, 0.505, 0);
    block(g, 'leatherDark', 0.3, 0.05, 0.22, 1.05, 0.505, 0);
    part(g, new THREE.TorusGeometry(0.1, 0.012, 12, 48), 'brass', 1.05, 0.67, 0);
    place('tvConsole', g, { at: [6535, 6950], ry: 90, room: 'living', name: '悬浮电视柜', size: '3000 × 400 × H505（离地 150）', mat: '胡桃木格栅门板 · 黑金花台面 · 底部暗藏灯带', note: '图纸标注柜深 400。悬浮安装露出地面石材，配合底部灯带，夜间整面电视墙仿佛浮起。' });
  }
  // 电视（75 寸）
  {
    const g = new THREE.Group();
    tv(g, 1.68, 0.96);
    place('tvLiving', g, { at: [6350, 6760], y: 1350, ry: 90, room: 'living', name: '75 英寸电视', size: '1680 × 960 × 30', mat: '超薄壁挂', note: '中心对准大圆几（Z 向），挂在 1160 宽大板石材之间，接缝处为香槟金嵌条。' });
  }
  // 地毯
  {
    const g = new THREE.Group();
    block(g, 'rugLiving', 3.2, 0.012, 2.4, 0, 0, 0);
    place('rugLiving', g, { at: [8600, 6760], room: 'living', name: '手工羊毛地毯', size: '3200 × 2400', mat: '新西兰羊毛 · 同心圆暗纹', note: '同心圆纹样与弧形沙发、圆茶几的几何语言呼应。' });
  }
  // 沙发背景画
  {
    const g = new THREE.Group();
    frameArt(g, 1.5, 0.95, 4);
    place('artLiving', g, { at: [10982, 6760], y: 1200, ry: -90, room: 'living', name: '沙发背景画', size: '1500 × 950', mat: '布面丙烯 · 古铜画框', note: '以 Loyel 渐变蓝为主调的抽象构成，平衡空间里大面积的暖色。' });
  }
}

// ———————————————————————— 餐厅 ————————————————————————
function diningChair(id, at, ry) {
  const g = new THREE.Group();
  for (const [x, z] of [[-0.19, 0.18], [0.19, 0.18], [-0.19, -0.2], [0.19, -0.2]]) {
    const leg = part(g, cylGeo(0.014, 0.018, 0.45, 10), 'walnut', x, 0.225, z);
    leg.rotation.set(z > 0 ? -0.06 : 0.06, 0, x > 0 ? 0.05 : -0.05);
  }
  part(g, rboxGeo(0.46, 0.08, 0.46, 0.03), 'leatherCognac', 0, 0.45, 0);
  const back = part(g, rboxGeo(0.44, 0.38, 0.05, 0.02), 'leatherCognac', 0, 0.7, -0.22);
  back.rotation.x = -0.12;
  for (const x of [-0.2, 0.2]) {
    const p = part(g, cylGeo(0.012, 0.012, 0.42, 8), 'walnut', x, 0.66, -0.225);
    p.rotation.x = -0.12;
  }
  return place(id, g, { at, ry, room: 'dining', name: '餐椅', size: '460 × 500 × H860', mat: '干邑色皮革 · 胡桃木椅脚', note: '六把餐椅，两侧各留 850 拉椅空间（图纸标注）。' });
}

function buildDining() {
  {
    const g = new THREE.Group();
    // 雪橇式古铜桌腿
    for (const x of [-0.65, 0.65]) {
      block(g, 'bronze', 0.04, 0.03, 0.66, x, 0, 0);
      block(g, 'bronze', 0.04, 0.03, 0.66, x, 0.69, 0);
      for (const z of [-0.31, 0.31]) block(g, 'bronze', 0.04, 0.66, 0.04, x, 0.03, z);
    }
    block(g, 'bronze', 1.3, 0.03, 0.04, 0, 0.69, 0);
    block(g, 'marbleTop', 1.8, 0.03, 0.8, 0, 0.72, 0);
    // 餐具与桌旗
    block(g, 'fabricThrow', 1.5, 0.003, 0.32, 0, 0.75, 0);
    for (const x of [-0.6, 0, 0.6]) for (const z of [-0.27, 0.27]) {
      cyl(g, 'ceramic', 0.135, 0.012, x, 0.752, z, 40);
      cyl(g, 'ceramic', 0.1, 0.012, x, 0.764, z, 40);
      part(g, cylGeo(0.035, 0.03, 0.12, 16, true), 'water', x + 0.17, 0.752, z * 0.75);
    }
    part(g, latheGeo([[0, 0], [0.06, 0], [0.09, 0.08], [0.05, 0.2], [0.04, 0.24], [0, 0.24]], 32), 'potLight', 0, 0.753, 0);
    for (let i = 0; i < 7; i++) {
      const b = part(g, new THREE.SphereGeometry(0.035, 12, 8), i % 2 ? 'paper' : 'fabricThrow', Math.cos(i) * 0.06, 1.0 + (i % 3) * 0.03, Math.sin(i) * 0.06);
      b.castShadow = true;
    }
    place('diningTable', g, { at: [9730, 2900], ry: 90, room: 'dining', name: '餐桌', size: '1800 × 800 × H750', mat: '雅士白大理石台面 · 深古铜雪橇脚', note: '图纸标注 1800 × 800，南北向摆放；北端距阳台隔墙 500，两侧拉椅空间各 850。' });
  }
  for (const [i, z] of [2300, 2900, 3500].entries()) {
    diningChair('chairW' + i, [9100, z], 90);
    diningChair('chairE' + i, [10360, z], -90);
  }
  // 线性吊灯
  {
    const g = new THREE.Group();
    block(g, 'bronze', 1.4, 0.05, 0.06, 0, 0, 0);
    block(g, 'led', 1.36, 0.004, 0.03, 0, -0.004, 0);
    for (const x of [-0.6, 0.6]) cyl(g, 'bronze', 0.0015, 1.1, x, 0.05, 0, 4);
    block(g, 'bronze', 0.12, 0.02, 0.12, -0.6, 1.13, 0);
    block(g, 'bronze', 0.12, 0.02, 0.12, 0.6, 1.13, 0);
    place('pendantDining', g, { at: [9730, 2900], y: 1650, ry: 90, room: 'dining', name: '线性吊灯', size: '1400 × 60 · 吊高 1650', mat: '深古铜灯体 · 下照 LED', note: '与餐桌同向，灯体底距桌面约 900，光线集中在桌面而不刺眼。' });
  }
}

// ———————————————————————— 厨房 ————————————————————————
function counterRun(g, len, { sinkAt, hobAt, hood, wall: wallCab, ledFrom } = {}) {
  const Dp = 0.6;
  block(g, 'bronze', len, 0.1, Dp - 0.08, 0, 0, -0.04);
  block(g, 'lacquer', len, 0.76, Dp - 0.02, 0, 0.1, -0.01);
  // 门板分缝与拉手
  const n = Math.max(1, Math.round(len / 0.45));
  for (let i = 1; i < n; i++) block(g, 'bronze', 0.004, 0.74, 0.005, -len / 2 + (len * i) / n, 0.11, Dp / 2 - 0.01);
  block(g, 'brass', len - 0.06, 0.012, 0.02, 0, 0.83, Dp / 2 - 0.005);
  block(g, 'marbleTop', len + 0.02, 0.03, Dp + 0.02, 0, 0.86, 0);
  if (sinkAt !== undefined) {
    block(g, 'steel', 0.75, 0.005, 0.42, sinkAt, 0.885, 0.02);
    block(g, 'rubber', 0.71, 0.004, 0.38, sinkAt, 0.886, 0.02);
    const tap = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.32, 0), new THREE.Vector3(0, 0.36, 0.08), new THREE.Vector3(0, 0.3, 0.18)]);
    part(g, new THREE.TubeGeometry(tap, 24, 0.012, 8), 'brass', sinkAt, 0.89, -0.22);
    cyl(g, 'brass', 0.025, 0.04, sinkAt, 0.89, -0.22, 16);
  }
  if (hobAt !== undefined) {
    block(g, 'blackGlass', 0.76, 0.008, 0.5, hobAt, 0.89, 0);
    for (const dx of [-0.19, 0.19]) {
      part(g, new THREE.TorusGeometry(0.075, 0.008, 8, 32), 'bronze', hobAt + dx, 0.902, 0, Math.PI / 2, 0, 0);
      cyl(g, 'bronze', 0.04, 0.014, hobAt + dx, 0.897, 0, 24);
    }
  }
  if (hood !== undefined) {
    block(g, 'steel', 0.8, 0.3, 0.5, hood, 1.65, -0.05);
    block(g, 'steel', 0.3, 0.5, 0.3, hood, 1.95, -0.15);
    block(g, 'led', 0.6, 0.004, 0.06, hood, 1.648, 0.1);
  }
  if (wallCab) {
    const [c, w] = wallCab;
    block(g, 'lacquer', w, 0.72, 0.35, c, 1.6, -0.125);
    block(g, 'led', w - 0.05, 0.004, 0.02, c, 1.598, 0.03);
  }
}

function buildKitchen() {
  {
    const g = new THREE.Group();
    counterRun(g, 1.38, { sinkAt: 0.065 });
    // 台面摆件：砧板、碗、水壶
    block(g, 'oak', 0.4, 0.025, 0.28, -0.45, 0.875, 0.05);
    part(g, latheGeo([[0, 0], [0.05, 0], [0.11, 0.07], [0.12, 0.08], [0, 0.08]], 32), 'ceramic', 0.48, 0.875, 0.05);
    for (let i = 0; i < 5; i++) part(g, new THREE.SphereGeometry(0.035, 12, 10), i % 2 ? 'leatherCognac' : 'velvetOlive', 0.48 + Math.cos(i * 1.3) * 0.05, 0.93, 0.05 + Math.sin(i * 1.3) * 0.05);
    place('kitchenSink', g, { at: [11920, 400], room: 'kitchen', name: '水槽区橱柜', size: '1380 × 600 × H890', mat: '暖灰哑光烤漆门板 · 白色石材台面 · 不锈钢单槽 · 香槟金龙头', note: '临北窗布置，水槽宽 750、距西墙 510（图纸标注）。' });
  }
  {
    // 东侧：高柜 730 | 吊柜下台面 940 | 灶台 770 | 烤箱高柜 560 | 收口 180（共 3180）
    const g = new THREE.Group();
    const L = 3.18, x0 = -L / 2;
    const tall = (x, w, key, ovens) => {
      block(g, 'bronze', w, 0.1, 0.48, x, 0, -0.04);
      block(g, key, w, 2.3, 0.56, x, 0.1, -0.01);
      block(g, 'bronze', 0.004, 2.28, 0.005, x, 0.11, 0.27);
      if (ovens) {
        block(g, 'blackGlass', w - 0.06, 0.58, 0.01, x, 0.82, 0.275);
        block(g, 'blackGlass', w - 0.06, 0.38, 0.01, x, 1.46, 0.275);
        block(g, 'brass', w - 0.16, 0.014, 0.03, x, 1.35, 0.29);
      } else {
        block(g, 'brass', 0.014, 0.9, 0.025, x + w / 2 - 0.05, 0.8, 0.29);
      }
    };
    tall(x0 + 0.365, 0.73, 'lacquer');
    const sub = new THREE.Group();
    counterRun(sub, 1.71, { hobAt: 0.47, hood: 0.47, wall: [-0.4, 0.92] });
    sub.position.set(x0 + 0.73 + 0.855, 0, -0.025);
    sub.scale.z = 0.92;
    g.add(sub);
    tall(x0 + 2.44 + 0.28, 0.56, 'lacquerDark', true);
    block(g, 'lacquer', 0.18, 2.4, 0.56, x0 + 3.09, 0, -0.01);
    place('kitchenEast', g, { at: [12885, 1690], ry: -90, room: 'kitchen', name: '灶台与高柜', size: '3180 × 550', mat: '暖灰烤漆 + 深灰高柜 · 黑晶玻璃灶具 · 不锈钢烟机', note: '自北向南：储物高柜、备餐台面（上方吊柜）、双眼灶与烟机、嵌入式蒸烤箱高柜，对应图纸东侧 300/400/800/500 分格。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'steel', 0.9, 1.82, 0.66, 0, 0, 0);
    block(g, 'rubber', 0.004, 1.8, 0.005, 0, 0.01, 0.331);
    for (const x of [-0.04, 0.04]) block(g, 'chrome', 0.018, 0.8, 0.03, x, 0.75, 0.345);
    block(g, 'lacquer', 0.9, 0.58, 0.6, 0, 1.82, -0.03);
    place('fridge', g, { at: [11730, 2940], ry: 180, room: 'kitchen', name: '对开门冰箱', size: '900 × 660 × H1820', mat: '拉丝不锈钢', note: '位于厨房南端（图纸 REF），正对水槽，取用食材的动线最短。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'lacquer', 0.43, 2.4, 0.58, 0, 0, 0);
    block(g, 'brass', 0.014, 0.9, 0.025, 0.16, 0.8, 0.3);
    place('pantry', g, { at: [12395, 2980], ry: 180, room: 'kitchen', name: '储物高柜', size: '430 × 580 × H2400', mat: '暖灰哑光烤漆', note: '冰箱旁的窄高柜，放调料与干货。' });
  }
}

// ———————————————————————— 玄关 / 走廊 ————————————————————————
function buildFoyer() {
  {
    const g = new THREE.Group();
    const W = 1.34, Dp = 0.4;
    block(g, 'walnut', W, 0.75, Dp, 0, 0.15, 0);
    block(g, 'walnut', W, 1.3, Dp, 0, 1.3, 0);
    block(g, 'marbleGreige', W, 0.02, Dp + 0.01, 0, 0.9, 0);
    block(g, 'marbleGreige', W - 0.02, 0.4, 0.02, 0, 0.9, -Dp / 2 + 0.01);
    block(g, 'led', W - 0.06, 0.004, 0.015, 0, 1.296, 0.12);
    block(g, 'led', W - 0.06, 0.004, 0.015, 0, 0.145, 0.12);
    for (const x of [-0.335, 0, 0.335]) {
      block(g, 'bronze', 0.004, 0.73, 0.005, x, 0.16, Dp / 2);
      block(g, 'bronze', 0.004, 1.28, 0.005, x, 1.31, Dp / 2);
    }
    for (const x of [-0.5, -0.17, 0.17, 0.5]) block(g, 'brass', 0.012, 0.3, 0.02, x, 1.35, Dp / 2 + 0.01);
    part(g, latheGeo([[0, 0], [0.12, 0], [0.14, 0.03], [0, 0.03]], 32), 'brass', -0.3, 0.92, 0.02);
    part(g, latheGeo([[0, 0], [0.04, 0], [0.07, 0.12], [0.03, 0.26], [0, 0.26]], 24), 'ceramic', 0.35, 0.92, -0.02);
    place('shoeCabinet', g, { at: [11730, 3585], room: 'foyer', name: '通高鞋柜', size: '1340 × 400 × H2600', mat: '胡桃木饰面 · 灰调石材台面 · 双层灯带', note: '图纸标注柜深 400。下柜悬空 150 可放常穿的鞋，中段 900–1300 为开放台面。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'rugRunner', 0.7, 0.01, 1.0, 0, 0, 0);
    place('entryMat', g, { at: [12150, 4435], room: 'foyer', name: '入户地垫', size: '700 × 1000', mat: '短绒尼龙', note: '内开入户门的开启范围外放置，不影响门扇转动。' });
  }
}

function buildCorridor() {
  {
    const g = new THREE.Group();
    block(g, 'lacquerWhite', 1.0, 2.6, 0.45, 0, 0, 0);
    block(g, 'walnut', 0.9, 0.5, 0.3, 0, 1.05, 0.08);
    block(g, 'led', 0.86, 0.004, 0.02, 0, 1.545, 0.18);
    for (const x of [-0.25, 0.25]) block(g, 'bronze', 0.004, 1.0, 0.005, x, 0.02, 0.226);
    block(g, 'bronze', 0.004, 1.0, 0.005, 0, 1.58, 0.226);
    part(g, latheGeo([[0, 0], [0.05, 0], [0.09, 0.1], [0.04, 0.3], [0.05, 0.34], [0, 0.34]], 32), 'potLight', 0, 1.05, 0.1);
    place('endCabinet', g, { at: [2015, 4600], ry: 90, room: 'corridor', name: '走廊端景柜', size: '1000 × 450 × H2600', mat: '象牙白烤漆 · 胡桃木端景龛 · 灯带', note: '对应图纸走廊西端 500 深的通高柜位，柜体中部开龛作为走廊尽端的视觉焦点。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'rugRunner', 3.2, 0.01, 0.8, 0, 0, 0);
    place('runner', g, { at: [3950, 4600], room: 'corridor', name: '走廊地毯', size: '3200 × 800', mat: '羊毛混纺', note: '降低走廊的脚步声，夜间起夜也更柔和。' });
  }
  {
    const g = new THREE.Group();
    frameArt(g, 0.9, 0.6, 7);
    place('artCorridor', g, { at: [2900, 4068], y: 1200, ry: 0, room: 'corridor', name: '走廊挂画', size: '900 × 600', mat: '布面丙烯 · 古铜画框', note: '挂在次卧一门左侧的整墙上。' });
  }
  {
    const g = new THREE.Group();
    frameArt(g, 1.0, 0.7, 9);
    place('artCorridor2', g, { at: [5250, 5132], y: 1150, ry: 180, room: 'corridor', name: '走廊挂画', size: '1000 × 700', mat: '布面丙烯 · 古铜画框', note: '面向卫生间干区，是走廊东段的端景。' });
  }
}

// ———————————————————————— 卧室 ————————————————————————
function bed(g, W, L, { headKey = 'leatherGreige', baseKey = 'fabricTaupe', throwKey = 'fabricThrow', pillows = ['fabricBed', 'fabricBed', 'velvetOlive'] } = {}) {
  const z0 = -L / 2;
  // 床头（竖向软包条）
  const n = Math.round(W / 0.22);
  for (let i = 0; i < n; i++) {
    const x = -W / 2 - 0.05 + (W + 0.1) * (i + 0.5) / n;
    part(g, rboxGeo((W + 0.1) / n - 0.006, 1.1, 0.1, 0.04), headKey, x, 0.57, z0 + 0.05);
  }
  // 床架与床垫
  block(g, 'bronze', W - 0.2, 0.08, L - 0.3, 0, 0, 0.05);
  part(g, rboxGeo(W, 0.26, L - 0.1, 0.03), baseKey, 0, 0.21, 0.05);
  part(g, rboxGeo(W - 0.04, 0.2, L - 0.16, 0.06), 'fabricBed', 0, 0.44, 0.06);
  // 被子（略大于床垫，垂边）
  part(g, rboxGeo(W + 0.04, 0.08, L * 0.68, 0.04), 'fabricBed', 0, 0.55, L * 0.15);
  block(g, 'fabricBed', W + 0.05, 0.22, 0.03, 0, 0.36, L * 0.15 + L * 0.34);
  // 床尾搭毯
  part(g, rboxGeo(W + 0.08, 0.03, 0.45, 0.012), throwKey, 0, 0.6, L / 2 - 0.35);
  // 枕头
  const pw = W > 1.6 ? 0.7 : 0.6;
  const cols = W > 1.6 ? [-0.42, 0.42] : [-0.33, 0.33];
  for (const x of cols) {
    pillow(g, pillows[0], pw, 0.42, x, 0.68, z0 + 0.22, -0.9, 0);
    pillow(g, pillows[1], pw - 0.06, 0.38, x, 0.63, z0 + 0.36, -1.15, 0);
  }
  pillow(g, pillows[2], 0.45, 0.32, 0, 0.66, z0 + 0.45, -1.2, 0);
}

function nightstand(id, room, at, ry, w = 0.55, d = 0.45) {
  const g = new THREE.Group();
  block(g, 'walnut', w, 0.45, d, 0, 0.1, 0);
  block(g, 'bronze', w - 0.1, 0.1, d - 0.1, 0, 0, 0);
  block(g, 'marbleTop', w + 0.01, 0.02, d + 0.01, 0, 0.55, 0);
  block(g, 'brass', 0.16, 0.012, 0.02, 0, 0.42, d / 2 + 0.005);
  block(g, 'bronze', w - 0.02, 0.004, 0.005, 0, 0.32, d / 2);
  tableLamp(g, -w / 2 + 0.17, 0.57, -0.03);
  block(g, 'leatherDark', 0.18, 0.03, 0.24, 0.1, 0.57, 0.04, 0.2);
  return place(id, g, { at, ry, room, name: '床头柜与台灯', size: `${Math.round(w * 1000)} × ${Math.round(d * 1000)} × H570`, mat: '胡桃木柜体 · 白色石材台面 · 香槟金拉手', note: '台灯为暖白 2700K，夜间模式下自动点亮。' });
}

function wardrobe(id, room, at, ry, W, Dp, name, note) {
  const g = new THREE.Group();
  const H = 2.6;
  block(g, 'bronze', W, 0.08, Dp - 0.06, 0, 0, -0.03);
  block(g, 'lacquerWhite', W, H - 0.08, Dp, 0, 0.08, 0);
  const n = Math.max(2, Math.round(W / 0.45));
  for (let i = 1; i < n; i++) block(g, 'bronze', 0.004, H - 0.1, 0.005, -W / 2 + (W * i) / n, 0.09, Dp / 2);
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (W * (i + 0.5)) / n + (i % 2 ? -1 : 1) * (W / n / 2 - 0.05);
    block(g, 'brass', 0.012, 0.6, 0.025, x, 0.95, Dp / 2 + 0.012);
  }
  block(g, 'bronze', W, 0.004, 0.005, 0, 2.0, Dp / 2);
  return place(id, g, { at, ry, room, name, size: `${Math.round(W * 1000)} × ${Math.round(Dp * 1000)} × H2600`, mat: '象牙白烤漆平板门 · 香槟金长拉手 · 古铜分缝', note });
}

function buildBedrooms() {
  // 主卧
  {
    const g = new THREE.Group();
    bed(g, 1.8, 2.0, { headKey: 'leatherGreige', baseKey: 'leatherGreige', pillows: ['fabricBed', 'fabricBed', 'velvetBlue'] });
    place('bedMaster', g, { at: [1140, 6868], ry: 90, room: 'master', name: '双人床', size: '2000 × 1800（床垫）', mat: '灰褐皮革软包床头 · 埃及棉床品 · 焦糖色羊绒搭毯', note: '图纸标注床长 2000、宽 1800，床头靠西墙；床尾到窗前梁位 700。' });
  }
  nightstand('nsMaster1', 'master', [390, 5648], 90, 0.6, 0.5);
  nightstand('nsMaster2', 'master', [390, 8088], 90, 0.6, 0.5);
  {
    const g = new THREE.Group();
    tv(g, 1.45, 0.83, 1.6);
    place('tvMaster', g, { at: [3340, 6868], y: 1250, ry: -90, room: 'master', name: '65 英寸电视', size: '1450 × 830', mat: '壁挂 · 胡桃木悬浮层板', note: '挂在主卧与次卧二的共用隔墙上（图纸虚线位置），与床正对。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'rugMaster', 2.3, 0.012, 2.9, 0, 0, 0);
    place('rugMaster', g, { at: [2050, 6868], room: 'master', name: '床尾地毯', size: '2300 × 2900', mat: '羊毛 · 素色宽边', note: '压在床的下三分之二，下床时脚踩到的是羊毛而不是地板。' });
  }
  // 衣帽间
  {
    const g = new THREE.Group();
    const W = 1.75, Dp = 0.6;
    for (const x of [-W / 2, -W / 6, W / 6, W / 2]) block(g, 'bronze', 0.03, 2.6, Dp, x, 0, 0);
    block(g, 'bronze', W, 0.03, Dp, 0, 2.57, 0);
    block(g, 'walnut', W, 0.4, Dp, 0, 0, 0);
    for (let i = 0; i < 3; i++) block(g, 'brass', 0.12, 0.012, 0.02, -W / 3 + (W / 3) * i, 0.25, Dp / 2 + 0.01);
    block(g, 'walnut', W, 0.025, Dp, 0, 2.15, 0);
    block(g, 'led', W - 0.05, 0.004, 0.02, 0, 2.145, 0.25);
    part(g, cylGeo(0.012, 0.012, W - 0.04, 12), 'brass', 0, 2.05, 0, 0, 0, Math.PI / 2);
    // 挂衣
    const keys = ['clothes', 'clothesLight', 'clothesDark', 'clothesLight', 'clothes', 'clothesDark'];
    for (let i = 0; i < 26; i++) {
      const x = -W / 2 + 0.08 + i * ((W - 0.16) / 25);
      const len = 0.7 + ((i * 7) % 5) * 0.12;
      part(g, rboxGeo(0.035, len, 0.5, 0.015), keys[i % keys.length], x, 2.02 - len / 2, 0);
    }
    for (let i = 0; i < 4; i++) block(g, i % 2 ? 'leatherCognac' : 'leatherDark', 0.3, 0.12, 0.25, -0.6 + i * 0.4, 2.18, 0.05);
    place('closetSystem', g, { at: [400, 4275], ry: 90, room: 'closet', name: '开放式挂衣系统', size: '1750 × 600 × H2600', mat: '深古铜立柱 · 胡桃木抽屉 · 香槟金挂杆 · 层板灯带', note: '图纸标注挂衣区深 600、长 1800。底部为抽屉，顶部放包与帽盒。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'brass', 0.66, 1.86, 0.02, 0, 0, 0);
    block(g, 'mirror', 0.6, 1.8, 0.01, 0, 0.03, 0.012);
    place('closetMirror', g, { at: [1680, 4300], y: 200, ry: -90, room: 'closet', name: '穿衣镜', size: '600 × 1800', mat: '银镜 · 香槟金边框', note: '挂在衣帽间东墙，正对挂衣区。' });
  }
  // 次卧一
  {
    const g = new THREE.Group();
    bed(g, 1.5, 2.0, { headKey: 'fabricTaupe', baseKey: 'fabricTaupe', throwKey: 'velvetBlue', pillows: ['fabricBed', 'fabricBed', 'fabricThrow'] });
    place('bed1', g, { at: [2815, 1950], ry: 90, room: 'bed1', name: '双人床', size: '2000 × 1500', mat: '灰褐布艺软包 · 纯棉床品', note: '床头靠西墙的胡桃木格栅，床尾留 600 通道到电视墙（图纸标注）。' });
  }
  nightstand('ns1a', 'bed1', [2040, 940], 90, 0.48, 0.45);
  nightstand('ns1b', 'bed1', [2040, 2960], 90, 0.48, 0.45);
  wardrobe('wardrobe1', 'bed1', [2560, 3650], 180, 1.52, 0.6, '衣柜', '图纸中床南侧 600 深衣柜，旁边留 200 墙垛后为房门。');
  {
    const g = new THREE.Group();
    tv(g, 1.23, 0.71);
    place('tvBed1', g, { at: [4440, 1950], y: 1200, ry: -90, room: 'bed1', name: '55 英寸电视', size: '1230 × 710', mat: '壁挂', note: '挂在东墙（图纸虚线位置），与床尾距离约 600。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'rugBed', 1.8, 0.012, 2.4, 0, 0, 0);
    place('rugBed1', g, { at: [3300, 1950], room: 'bed1', name: '地毯', size: '1800 × 2400', mat: '羊毛混纺', note: '' });
  }
  // 次卧二
  {
    const g = new THREE.Group();
    bed(g, 1.5, 2.0, { headKey: 'leatherGreige', baseKey: 'fabricGrey', pillows: ['fabricBed', 'fabricBed', 'velvetOlive'] });
    place('bed2', g, { at: [5050, 7146], ry: -90, room: 'bed2', name: '双人床', size: '2000 × 1500', mat: '皮革软包床头 · 灰色布艺床箱', note: '床头靠东侧剪力墙，床尾到西墙 650（图纸标注）。' });
  }
  nightstand('ns2a', 'bed2', [5825, 6126], -90, 0.5, 0.45);
  nightstand('ns2b', 'bed2', [5825, 8166], -90, 0.5, 0.45);
  wardrobe('wardrobe2', 'bed2', [5255, 5525], 0, 1.67, 0.55, '衣柜', '靠北墙整排布置（图纸中带挂衣符号的衣柜位）。');
  {
    const g = new THREE.Group();
    tv(g, 1.23, 0.71);
    place('tvBed2', g, { at: [3440, 7000], y: 1200, ry: 90, room: 'bed2', name: '55 英寸电视', size: '1230 × 710', mat: '壁挂', note: '与主卧电视背靠背安装在同一道隔墙上。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'rugBed', 1.8, 0.012, 2.4, 0, 0, 0);
    place('rugBed2', g, { at: [4600, 7146], room: 'bed2', name: '地毯', size: '1800 × 2400', mat: '羊毛混纺', note: '' });
  }
}

// ———————————————————————— 书房 ————————————————————————
function buildStudy() {
  {
    const g = new THREE.Group();
    const W = 3.5, Dp = 0.35, H = 2.6;
    block(g, 'walnut', W, 0.8, Dp, 0, 0, 0);
    for (let i = 1; i < 8; i++) block(g, 'bronze', 0.004, 0.76, 0.005, -W / 2 + (W * i) / 8, 0.02, Dp / 2);
    block(g, 'marbleGreige', W, 0.025, Dp + 0.01, 0, 0.8, 0);
    const cols = 5;
    for (let i = 0; i <= cols; i++) block(g, 'bronze', 0.025, H - 0.825, Dp - 0.02, -W / 2 + 0.0125 + ((W - 0.025) * i) / cols, 0.825, -0.01);
    block(g, 'walnut', W, 0.02, Dp - 0.02, 0, 0.825, -0.02);
    block(g, 'walnut', W - 0.02, H - 0.84, 0.02, 0, 0.825, -Dp / 2 + 0.01);
    const shelves = [1.18, 1.53, 1.88, 2.23, H - 0.025];
    for (const y of shelves) block(g, 'bronze', W, 0.02, Dp - 0.02, 0, y, -0.01);
    // 书与摆件
    const bayW = (W - 0.025) / cols;
    let seed = 3;
    for (let r = 0; r < 4; r++) {
      const y = [0.845, 1.2, 1.55, 1.9][r];
      for (let c = 0; c < cols; c++) {
        seed = (seed * 37 + 11) % 97;
        const x0 = -W / 2 + 0.025 + c * bayW;
        const fill = 0.45 + (seed % 5) * 0.1;
        const bw = (bayW - 0.04) * fill;
        const bh = 0.24 + (seed % 3) * 0.03;
        block(g, 'books', bw, bh, 0.22, x0 + 0.02 + bw / 2, y, 0.0);
        if (seed % 3 === 0) part(g, latheGeo([[0, 0], [0.04, 0], [0.06, 0.1], [0.025, 0.2], [0, 0.2]], 24), 'ceramic', x0 + bayW - 0.12, y, 0);
        else if (seed % 3 === 1) part(g, new THREE.SphereGeometry(0.06, 20, 14), 'brass', x0 + bayW - 0.12, y + 0.06, 0);
      }
    }
    block(g, 'led', W - 0.05, 0.004, 0.015, 0, H - 0.03, 0.12);
    place('bookcase', g, { at: [6525, 1950], ry: 90, room: 'study', name: '通高书柜', size: '3500 × 350 × H2600', mat: '胡桃木 · 深古铜层板 · 灰调石材腰线', note: '图纸标注柜深 350。下部 800 为带门储物，上部为开放书架，层板内藏灯带。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'walnut', 1.7, 0.04, 0.6, 0, 0.71, 0);
    block(g, 'leatherDark', 1.3, 0.004, 0.42, 0, 0.75, 0.02);
    for (const x of [-0.78, 0.78]) {
      block(g, 'bronze', 0.03, 0.71, 0.5, x, 0, 0);
    }
    block(g, 'walnut', 1.5, 0.12, 0.02, 0, 0.58, -0.27);
    // 笔记本电脑
    block(g, 'steel', 0.32, 0.012, 0.22, -0.1, 0.754, 0.08);
    const lid = new THREE.Group();
    block(lid, 'steel', 0.32, 0.21, 0.008, 0, 0, 0);
    part(lid, new THREE.PlaneGeometry(0.29, 0.18), 'screen', 0, 0.105, 0.0045);
    lid.position.set(-0.1, 0.766, -0.03);
    lid.rotation.x = -0.25;
    g.add(lid);
    // 台灯
    cyl(g, 'brass', 0.07, 0.015, 0.6, 0.75, -0.12, 32);
    const arm = part(g, cylGeo(0.008, 0.008, 0.42, 8), 'brass', 0.6, 0.96, -0.08);
    arm.rotation.x = 0.25;
    part(g, latheGeo([[0.01, 0], [0.09, -0.1], [0.095, -0.11], [0, -0.11]], 24), 'brass', 0.6, 1.2, 0.0);
    part(g, new THREE.CircleGeometry(0.085, 24), 'bulb', 0.6, 1.09, 0.0, Math.PI / 2, 0, 0);
    block(g, 'paper', 0.21, 0.004, 0.3, 0.25, 0.754, 0.08, 0.2);
    place('desk', g, { at: [7550, 2050], ry: -90, room: 'study', name: '岛式书桌', size: '1700 × 600 × H750', mat: '胡桃木桌面 · 深棕皮革书写垫 · 深古铜板式桌腿', note: '图纸标注 1700 × 600，居中放置，四周都能走动；座位朝东，背靠书柜。' });
  }
  {
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const l = part(g, boxGeo(0.3, 0.025, 0.04), 'bronze', Math.cos(a) * 0.15, 0.06, Math.sin(a) * 0.15, 0, -a, 0);
      l.castShadow = true;
      part(g, new THREE.SphereGeometry(0.025, 10, 8), 'rubber', Math.cos(a) * 0.29, 0.025, Math.sin(a) * 0.29);
    }
    cyl(g, 'bronze', 0.025, 0.35, 0, 0.07, 0, 12);
    part(g, rboxGeo(0.52, 0.1, 0.5, 0.04), 'leatherDark', 0, 0.47, 0);
    const back = part(g, rboxGeo(0.5, 0.58, 0.08, 0.035), 'leatherDark', 0, 0.85, -0.23);
    back.rotation.x = -0.12;
    for (const x of [-0.27, 0.27]) block(g, 'bronze', 0.03, 0.03, 0.4, x, 0.66, -0.02);
    place('deskChair', g, { at: [7000, 2050], ry: 90, room: 'study', name: '书椅', size: '600 × 600 × H1050', mat: '深棕皮革 · 古铜五星脚', note: '书柜与书桌之间 550 宽的座位区（图纸标注）。' });
  }
  {
    const g = new THREE.Group();
    plant(g, 1.1, true);
    place('plantStudy', g, { at: [8150, 480], room: 'study', name: '绿植', size: 'H约 1200', mat: '米白陶盆', note: '' });
  }
  {
    const g = new THREE.Group();
    frameArt(g, 0.7, 0.9, 12);
    place('artStudy', g, { at: [8382, 850], y: 1100, ry: -90, room: 'study', name: '挂画', size: '700 × 900', mat: '布面丙烯 · 古铜画框', note: '挂在书房与阳台之间的实墙段上。' });
  }
}

// ———————————————————————— 卫浴 ————————————————————————
function toilet(id, room, at, ry) {
  const g = new THREE.Group();
  block(g, 'bathWall', 0.6, 1.1, 0.16, 0, 0, -0.27);
  block(g, 'brass', 0.22, 0.14, 0.01, 0, 0.95, -0.185);
  part(g, latheGeo([[0, 0], [0.17, 0.0], [0.19, 0.12], [0.2, 0.28], [0, 0.28]], 40), 'ceramic', 0, 0.12, 0.08).scale.set(0.95, 1, 1.4);
  part(g, rboxGeo(0.36, 0.2, 0.2, 0.06), 'ceramic', 0, 0.28, -0.12);
  part(g, latheGeo([[0, 0], [0.19, 0], [0.2, 0.02], [0, 0.03]], 40), 'lacquerWhite', 0, 0.4, 0.08).scale.set(0.95, 1, 1.4);
  return place(id, g, { at, ry, room, name: '壁挂式坐便器', size: '370 × 560（坐便器）', mat: '白色陶瓷 · 隐藏式水箱 · 香槟金冲水面板', note: '水箱暗藏在 160 厚的石材包墙内，地面无死角便于清洁。' });
}

function vanity(id, room, at, ry, W, note) {
  const g = new THREE.Group();
  const Dp = 0.55;
  block(g, 'walnut', W, 0.45, Dp, 0, 0.4, 0);
  block(g, 'bronze', W - 0.02, 0.004, 0.005, 0, 0.62, Dp / 2);
  block(g, 'marbleTop', W + 0.02, 0.03, Dp + 0.02, 0, 0.85, 0);
  part(g, latheGeo([[0, 0], [0.12, 0], [0.19, 0.06], [0.2, 0.14], [0.19, 0.14], [0.17, 0.07], [0, 0.03]], 48), 'ceramic', 0, 0.88, 0.04).scale.set(1, 1, 0.8);
  const tap = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0.28, 0.07), new THREE.Vector3(0, 0.22, 0.14)]);
  part(g, new THREE.TubeGeometry(tap, 20, 0.01, 8), 'brass', 0, 0.88, -0.2);
  block(g, 'led', W - 0.06, 0.004, 0.02, 0, 0.395, 0.2);
  // 镜柜（背光）
  part(g, rboxGeo(Math.min(W, 0.8), 0.9, 0.02, 0.008), 'mirror', 0, 1.65, -Dp / 2 + 0.025);
  block(g, 'led', Math.min(W, 0.8) - 0.04, 0.006, 0.006, 0, 2.1, -Dp / 2 + 0.02);
  return place(id, g, { at, ry, room, name: '浴室柜', size: `${Math.round(W * 1000)} × 550 × H880`, mat: '胡桃木悬浮柜 · 白色石材台面 · 陶瓷台上盆 · 香槟金龙头 · 背光镜', note });
}

function showerScreen(g, x0, x1, z, doorFrom, doorTo) {
  // 沿 X 的玻璃隔断（mm）
  const a = v(x0), b = v(x1), zz = v(z);
  block(g, 'frame', b - a, 0.02, 0.04, (a + b) / 2, 0, zz);
  block(g, 'frame', b - a, 0.02, 0.04, (a + b) / 2, 2.0, zz);
  block(g, 'glass', b - a, 1.98, 0.01, (a + b) / 2, 0.02, zz);
  if (doorFrom !== undefined) {
    block(g, 'frame', 0.02, 2.0, 0.04, v(doorFrom), 0.02, zz);
    block(g, 'brass', 0.02, 0.3, 0.03, v(doorTo) - 0.06, 0.95, zz + 0.03);
  }
}

function buildBaths() {
  // —— 主卫 ——
  {
    const g = new THREE.Group();
    showerScreen(g, 245, 1675, 1610, 960, 1675);
    // 淋浴：顶喷、手持、龙头（装在东墙）
    const sx = v(1675);
    block(g, 'brass', 0.35, 0.02, 0.02, sx - 0.175, 2.15, v(1150));
    cyl(g, 'brass', 0.13, 0.01, sx - 0.35, 2.12, v(1150), 48);
    block(g, 'brass', 0.03, 0.16, 0.12, sx - 0.015, 1.05, v(1150));
    block(g, 'brass', 0.02, 0.9, 0.02, sx - 0.02, 1.15, v(1450));
    block(g, 'marbleTop', 0.88, 0.45, 0.4, v(1240), 0, v(310));
    block(g, 'bronze', 0.9, 0.01, 0.04, v(1240), 0.001, v(1450));
    obstacle(g, 245, 1595, 1675, 1625);
    g.userData.noBlock = true;
    place('mbathShower', g, { at: [0, 0], room: 'mbath', name: '淋浴区', size: '1350 × 900（不含临窗凹位）', mat: '暖灰石材墙面 · 超白玻璃隔断 · 香槟金顶喷与恒温龙头 · 石材淋浴凳', note: '图纸标注淋浴区 1350 × 900。临北窗的 900 × 600 凹位做成石材淋浴凳，可以坐着冲洗。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'showerWall', 0.145, 2.8, 0.39, 0, 0, 0);
    place('mbathShaft', g, { at: [172, 905], room: 'mbath', name: '管井包封', size: '145 × 390', mat: '石材饰面包封', note: '图纸中带叉的方框为排水立管，需包封并预留检修口。' });
  }
  toilet('mbathToilet', 'mbath', [465, 2015], 90);
  vanity('mbathVanity', 'mbath', [395, 2800], 90, 0.8, '图纸标注台盆 600 宽区；镜柜带背光，夜间可作起夜灯。');
  {
    const g = new THREE.Group();
    for (const x of [-0.24, 0.24]) block(g, 'brass', 0.02, 0.9, 0.02, x, 0, 0);
    for (let i = 0; i < 7; i++) block(g, 'brass', 0.48, 0.015, 0.015, 0, 0.05 + i * 0.13, 0);
    block(g, 'fabricBed', 0.42, 0.5, 0.03, 0, 0.35, 0.03);
    place('mbathTowel', g, { at: [1660, 2650], y: 500, ry: -90, room: 'mbath', name: '电热毛巾架', size: '500 × 900', mat: '香槟金', note: '' });
  }
  // —— 卫生间 ——
  {
    const g = new THREE.Group();
    showerScreen(g, 4555, 5780, 1710, 5160, 5780);
    const sx = v(4555);
    block(g, 'brass', 0.3, 0.02, 0.02, sx + 0.15, 2.1, v(1200));
    cyl(g, 'brass', 0.11, 0.01, sx + 0.3, 2.07, v(1200), 40);
    block(g, 'brass', 0.03, 0.16, 0.12, sx + 0.015, 1.05, v(1200));
    block(g, 'bronze', 0.9, 0.01, 0.04, v(5000), 0.001, v(1550));
    obstacle(g, 4555, 1695, 5780, 1725);
    g.userData.noBlock = true;
    place('gbathShower', g, { at: [0, 0], room: 'gbath', name: '淋浴区', size: '1240 × 950', mat: '暖灰石材 · 玻璃隔断（两扇 620）· 香槟金花洒', note: '图纸标注 1240 × 950，玻璃隔断分为 620 + 620 两扇，其中一扇平开。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'showerWall', 0.26, 2.8, 0.44, 0, 0, 0);
    place('gbathShaft', g, { at: [5910, 930], room: 'gbath', name: '管井包封', size: '260 × 440', mat: '石材饰面包封', note: '' });
  }
  toilet('gbathToilet', 'gbath', [5675, 2250], -90);
  vanity('gbathVanity', 'gbath', [5745, 3390], -90, 1.0, '干区台盆放在卫生间门外的凹位里，访客洗手不必进入卫生间。');
}

// ———————————————————————— 生活阳台 ————————————————————————
function buildBalcony() {
  {
    const g = new THREE.Group();
    block(g, 'lacquerWhite', 0.6, 0.85, 0.6, 0, 0, 0);
    part(g, new THREE.TorusGeometry(0.17, 0.025, 12, 48), 'chrome', 0, 0.47, 0.305);
    part(g, new THREE.CircleGeometry(0.16, 40), 'blackGlass', 0, 0.47, 0.302);
    block(g, 'blackGlass', 0.4, 0.06, 0.005, 0, 0.75, 0.3);
    block(g, 'lacquer', 0.64, 0.6, 0.35, 0, 1.75, -0.125);
    place('washer', g, { at: [10730, 1060], ry: -90, room: 'balcony', name: '滚筒洗衣机', size: '600 × 600 × H850', mat: '白色机身 · 上方吊柜', note: '图纸中东侧凹位 600 × 700 的洗衣机位，机门朝阳台开启。' });
  }
  {
    const g = new THREE.Group();
    block(g, 'lacquer', 0.6, 0.8, 0.6, 0, 0, 0);
    block(g, 'marbleGreige', 0.62, 0.03, 0.62, 0, 0.8, 0);
    block(g, 'ceramic', 0.45, 0.02, 0.38, 0, 0.815, 0.04);
    const tap = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(0, 0.33, 0.1), new THREE.Vector3(0, 0.27, 0.18)]);
    part(g, new THREE.TubeGeometry(tap, 20, 0.01, 8), 'chrome', 0, 0.83, -0.24);
    place('laundrySink', g, { at: [10730, 415], ry: -90, room: 'balcony', name: '洗衣池柜', size: '600 × 600 × H830', mat: '暖灰烤漆柜体 · 石材台面 · 陶瓷深槽', note: '图纸标注 600 × 600，与洗衣机并排，手洗、拖把清洗都在这里。' });
  }
  {
    const g = new THREE.Group();
    for (const z of [-0.2, 0.2]) {
      const bar = part(g, cylGeo(0.012, 0.012, 1.4, 12), 'chrome', 0, 2.35, z);
      bar.rotation.z = Math.PI / 2;
    }
    for (const x of [-0.6, 0.6]) {
      block(g, 'chrome', 0.04, 0.03, 0.44, x, 2.35, 0);
      cyl(g, 'chrome', 0.002, 0.43, x, 2.37, 0, 4);
    }
    for (let i = 0; i < 4; i++) part(g, rboxGeo(0.4, 0.6, 0.01, 0.005), i % 2 ? 'clothesLight' : 'clothes', -0.45 + i * 0.3, 2.03, i % 2 ? 0.2 : -0.2);
    place('dryingRack', g, { at: [9400, 750], room: 'balcony', name: '升降晾衣架', size: '1400 × 450', mat: '不锈钢', note: '安装在阳台中部，北向通风好、不暴晒。' });
  }
  {
    const g = new THREE.Group();
    plant(g, 0.9, true);
    place('plantBalcony', g, { at: [8700, 360], room: 'balcony', name: '绿植', size: 'H约 1000', mat: '米白陶盆', note: '' });
  }
}

// 固定玻璃等需要阻挡漫游的物件
export const furnitureObstacles = [];
function obstacle(g, x0, z0, x1, z1) {
  furnitureObstacles.push([v(x0), v(z0), v(x1), v(z1)]);
}

export function buildFurniture(root) {
  const g = new THREE.Group();
  g.name = 'furniture';
  ITEMS.length = 0;
  buildLiving();
  buildDining();
  buildKitchen();
  buildFoyer();
  buildCorridor();
  buildBedrooms();
  buildStudy();
  buildBaths();
  buildBalcony();
  for (const it of ITEMS) g.add(it);
  root.add(g);
  return g;
}
