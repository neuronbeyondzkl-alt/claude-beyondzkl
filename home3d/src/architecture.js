// 建筑本体：楼板、地面、墙柱、隔墙洞口、外窗、门、窗帘、墙面饰面
import * as THREE from 'three';
import { CEIL, STRUCT, FACADE, PARTITIONS, DOORS, SLIDERS, ROOMS } from './plan.js';
import { v, boxGeo, part, block, compact } from './kit.js';
import { M, planes } from './materials.js';

const H = v(CEIL);

// 走动碰撞用的二维矩形（米），由墙体与固定玻璃登记
export const obstacles = [];

function addPiece(group, key, x0, x1, y0, y1, z0, z1, collide = true) {
  if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4 || z1 - z0 < 1e-4) return null;
  const m = part(group, boxGeo(x1 - x0, y1 - y0, z1 - z0), key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (collide && y0 < 0.9) obstacles.push([x0, z0, x1, z1]);
  return m;
}

// 一段墙：openings 沿长边，{a, b, top, sill}（mm）
function wall(group, r, key, openings = []) {
  const [x0, z0, x1, z1] = r.map(v);
  const alongX = x1 - x0 >= z1 - z0;
  const lo = alongX ? x0 : z0, hi = alongX ? x1 : z1;
  const piece = (a, b, y0, y1) => (alongX
    ? addPiece(group, key, a, b, y0, y1, z0, z1)
    : addPiece(group, key, x0, x1, y0, y1, a, b));
  let cur = lo;
  for (const o of [...openings].sort((p, q) => p.a - q.a)) {
    const a = v(o.a), b = v(o.b);
    piece(cur, a, 0, H);
    if (o.top < CEIL) piece(a, b, v(o.top), H);
    if (o.sill) piece(a, b, 0, v(o.sill));
    cur = b;
  }
  piece(cur, hi, 0, H);
}

// —— 地面 ——
function floors(root) {
  const g = new THREE.Group();
  g.name = 'floors';
  for (const room of ROOMS) {
    for (const r of room.rects) {
      const [x0, z0, x1, z1] = r.map(v);
      const geo = boxGeo(x1 - x0, 0.03, z1 - z0);
      geo.translate((x0 + x1) / 2, -0.015, (z0 + z1) / 2);
      // 顶面 UV 用世界坐标：相邻房间同材质时分缝连续
      const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
      for (let i = 0; i < pos.count; i++) if (nor.getY(i) > 0.5) uv.setXY(i, pos.getX(i), -pos.getZ(i));
      const m = new THREE.Mesh(geo, M(room.floor));
      m.userData = { matKey: room.floor, type: 'room', room: room.id };
      m.receiveShadow = true;
      g.add(m);
    }
  }
  root.add(g);
  return g;
}

// —— 楼板与室外（外飘板、公共走道）——
function slab(root) {
  const g = new THREE.Group();
  g.name = 'slab';
  const geo = boxGeo(14.8, 0.2, 10.7);
  geo.translate(6.8, -0.13, 4.55);
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) if (nor.getY(i) > 0.5) uv.setXY(i, pos.getX(i), -pos.getZ(i));
  const m = new THREE.Mesh(geo, M('slab'));
  m.userData = { matKey: 'slab', type: 'outside' };
  m.receiveShadow = true;
  g.add(m);
  // 入户门外的公共走道（图中斜线范围，非本户）
  const corridor = block(g, 'kitchenFloor', v(1235), 0.02, v(1290), v(13282), -0.03, v(4455));
  corridor.userData.type = 'outside';
  root.add(g);
  return g;
}

// —— 墙柱 ——
function walls(root) {
  const g = new THREE.Group();
  g.name = 'walls';
  for (const r of STRUCT) wall(g, r, 'wallStruct');
  for (const p of PARTITIONS) wall(g, p.r, p.shaft ? 'shaft' : 'wall', p.open || []);
  for (const f of FACADE) wall(g, f.r, 'wallStruct', f.windows.map((w) => ({ a: w.a, b: w.b, top: w.head, sill: w.sill })));
  g.traverse((o) => { if (o.isMesh) o.userData.type = 'wall'; });
  root.add(g);
  return g;
}

// —— 外窗：铝合金框（深古铜）+ 中梃 + 玻璃 + 石材窗台 ——
function windows(root) {
  const g = new THREE.Group();
  g.name = 'windows';
  const FW = 0.06, FD = 0.08;
  for (const f of FACADE) {
    const [fx0, fz0, fx1, fz1] = f.r.map(v);
    const zc = (fz0 + fz1) / 2;
    const inner = f.side === 'N' ? fz1 : fz0; // 室内一侧墙面
    const dirIn = f.side === 'N' ? 1 : -1;
    for (const w of f.windows) {
      const a = v(w.a), b = v(w.b), y0 = v(w.sill), y1 = v(w.head);
      const win = new THREE.Group();
      win.userData = { type: 'window', room: w.room, w: w.b - w.a, h: w.head - w.sill, sill: w.sill };
      // 外框
      block(win, 'frame', b - a, FW, FD, (a + b) / 2, y0, zc);
      block(win, 'frame', b - a, FW, FD, (a + b) / 2, y1 - FW, zc);
      block(win, 'frame', FW, y1 - y0, FD, a + FW / 2, y0, zc);
      block(win, 'frame', FW, y1 - y0, FD, b - FW / 2, y0, zc);
      // 中梃
      for (const mx of w.mull) block(win, 'frame', 0.05, y1 - y0, FD, v(mx), y0, zc);
      // 亮子横档：窗高超过 2 m 时在 2100 处分格
      if (w.head - w.sill > 2000) block(win, 'frame', b - a, 0.05, FD, (a + b) / 2, v(2100) - 0.025, zc);
      // 玻璃
      block(win, w.room === 'mbath' || w.room === 'gbath' ? 'frosted' : 'glass', b - a - 2 * FW, y1 - y0 - 2 * FW, 0.012, (a + b) / 2, y0 + FW, zc);
      // 内窗台石
      if (w.sill > 0) {
        const depth = Math.abs(inner - zc) + 0.04;
        block(win, 'marbleTop', b - a + 0.06, 0.02, depth, (a + b) / 2, y0, inner - dirIn * (depth / 2) + dirIn * 0.04);
      }
      compact(win);
      win.children.forEach((c) => { if (c.userData.matKey !== 'glass' && c.userData.matKey !== 'frosted') c.castShadow = true; });
      g.add(win);
    }
  }
  root.add(g);
  return g;
}

// —— 平开门 ——
function hingedDoor(d) {
  const g = new THREE.Group();
  const along = d.axis === 'x';
  const a = v(d.a), b = v(d.b), c = v(d.at), top = v(d.top);
  const frameW = 0.02, gap = 0.004;
  const wallT = along
    ? PARTITIONS.find((p) => p.open && p.open.some((o) => o.a === d.a)).r
    : PARTITIONS.find((p) => p.id === 'p17').r;
  const T = along ? v(wallT[3] - wallT[1]) : v(wallT[2] - wallT[0]);
  // 门套（深古铜细框）
  const frame = new THREE.Group();
  const lining = (p0, p1, y0, y1) => (along
    ? block(frame, 'frame', p1 - p0, y1 - y0, T + 0.01, (p0 + p1) / 2, y0, c)
    : block(frame, 'frame', T + 0.01, y1 - y0, p1 - p0, c, y0, (p0 + p1) / 2));
  lining(a, a + frameW, 0, top);
  lining(b - frameW, b, 0, top);
  lining(a, b, top - frameW, top);
  compact(frame);
  g.add(frame);

  // 门扇：绕合页转动的枢轴组
  const leafW = b - a - 2 * frameW - 2 * gap;
  const leafH = top - frameW - 0.012;
  const thick = d.kind === 'entry' ? 0.07 : 0.045;
  const pivot = new THREE.Group();
  const leaf = new THREE.Group();
  const leafKey = d.kind === 'entry' ? 'entryDoor' : 'doorLeaf';
  block(leaf, leafKey, leafW, leafH, thick, leafW / 2, 0.008, 0);
  if (d.kind === 'entry') {
    // 入户门：竖向香槟金嵌条 + 通高拉手
    for (const t of [0.22, 0.5, 0.78]) block(leaf, 'brass', 0.012, leafH - 0.4, thick + 0.004, leafW * t, 0.2, 0);
    for (const s of [-1, 1]) {
      block(leaf, 'brass', 0.03, 1.2, 0.03, leafW - 0.12, 0.45, s * (thick / 2 + 0.05));
      block(leaf, 'brass', 0.03, 0.03, 0.05, leafW - 0.12, 0.5, s * (thick / 2 + 0.025));
      block(leaf, 'brass', 0.03, 0.03, 0.05, leafW - 0.12, 1.6, s * (thick / 2 + 0.025));
    }
  } else {
    // 胡桃木门扇：隐形门缝线 + 香槟金执手
    block(leaf, 'bronze', leafW - 0.16, 0.006, thick + 0.002, leafW / 2, 1.0, 0);
    for (const s of [-1, 1]) {
      block(leaf, 'brass', 0.05, 0.05, 0.012, leafW - 0.07, 1.0, s * (thick / 2 + 0.006));
      block(leaf, 'brass', 0.14, 0.018, 0.018, leafW - 0.12, 1.016, s * (thick / 2 + 0.05));
      block(leaf, 'brass', 0.018, 0.018, 0.05, leafW - 0.07, 1.016, s * (thick / 2 + 0.03));
    }
  }
  compact(leaf);
  pivot.add(leaf);
  // 枢轴位置与开启方向
  const hingeAt = d.hinge === 'a' ? a + frameW + gap : b - frameW - gap;
  const dirAlong = d.hinge === 'a' ? 1 : -1;     // 关闭时门扇从合页伸出的方向
  if (along) pivot.position.set(hingeAt, 0, c);
  else pivot.position.set(c, 0, hingeAt);
  g.add(pivot);

  const d0 = along ? new THREE.Vector3(dirAlong, 0, 0) : new THREE.Vector3(0, 0, dirAlong);
  const n = along ? new THREE.Vector3(0, 0, d.swing) : new THREE.Vector3(d.swing, 0, 0);
  const max = THREE.MathUtils.degToRad(95);
  g.userData = {
    type: 'door', id: d.id, name: d.name, width: d.b - d.a, height: d.top,
    t: d.open, target: d.open,
    apply(t) {
      const ang = max * t;
      const dir = d0.clone().multiplyScalar(Math.cos(ang)).add(n.clone().multiplyScalar(Math.sin(ang)));
      pivot.rotation.y = Math.atan2(-dir.z, dir.x);
    },
  };
  g.userData.apply(d.open);
  return g;
}

// —— 推拉门：古铜细框 + 玻璃 ——
function slidingDoor(s) {
  const g = new THREE.Group();
  const along = s.axis === 'x';
  const a = v(s.a), b = v(s.b), c = v(s.at), top = v(s.top);
  const n = s.panels;
  const span = b - a;
  const pw = n === 1 ? span + 0.04 : span / n + 0.03;
  const panels = [];
  const makePanel = () => {
    const p = new THREE.Group();
    const F = 0.03, D = 0.035, h = top - 0.02;
    block(p, 'frame', pw, F, D, 0, 0.005, 0);
    block(p, 'frame', pw, F, D, 0, h - F, 0);
    block(p, 'frame', F, h, D, -pw / 2 + F / 2, 0.005, 0);
    block(p, 'frame', F, h, D, pw / 2 - F / 2, 0.005, 0);
    block(p, 'frame', pw - 2 * F, 0.02, D, 0, 1.05, 0);
    block(p, 'glass', pw - 2 * F, h - 2 * F, 0.008, 0, F, 0);
    compact(p);
    if (!along) p.rotation.y = Math.PI / 2;
    g.add(p);
    return p;
  };
  // 轨道
  if (along) block(g, 'frame', span, 0.012, 0.09, (a + b) / 2, 0, c);
  else block(g, 'frame', 0.09, 0.012, span, c, 0, (a + b) / 2);
  for (let i = 0; i < n; i++) panels.push(makePanel());
  const place = (p, u, off) => {
    if (along) p.position.set(u, 0, c + off);
    else p.position.set(c + off, 0, u);
  };
  g.userData = {
    type: 'door', id: s.id, name: s.name, width: s.b - s.a, height: s.top, sliding: true,
    t: s.open, target: s.open,
    apply(t) {
      if (n === 1) {
        // 单扇明装推拉门，装在墙的一侧，打开时滑出洞口
        place(panels[0], a + span / 2 + v(s.travel) * t, (s.side || 1) * 0.11);
      } else {
        place(panels[0], a + pw / 2 - 0.015, -0.02);
        place(panels[1], a + pw * 1.5 - 0.045 - (pw - 0.03) * t, 0.02);
      }
    },
  };
  g.userData.apply(s.open);
  return g;
}

function doors(root) {
  const g = new THREE.Group();
  g.name = 'doors';
  const list = [];
  for (const d of DOORS) { const o = hingedDoor(d); g.add(o); list.push(o); }
  for (const s of SLIDERS) { const o = slidingDoor(s); g.add(o); list.push(o); }
  root.add(g);
  return list;
}

// —— 窗帘：遮光帘（两侧收拢）+ 纱帘（通长）——
function curtainGeo(width, height, amp, wave) {
  const seg = Math.max(8, Math.round(width / (wave / 6)));
  const geo = new THREE.PlaneGeometry(width, height, seg, 1);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    pos.setZ(i, Math.sin((x / wave) * Math.PI * 2) * amp);
  }
  geo.computeVertexNormals();
  return geo;
}

const CURTAINS = [
  // [房间, 轴向, 墙内侧位置 mm, 起点, 终点]
  ['living', 'x', 8560, 6350, 10350],
  ['master', 'x', 8960, 760, 3330],
  ['bed2', 'x', 8960, 3450, 5380],
  ['bed1', 'x', 220, 1800, 4430],
  ['study', 'x', 220, 6700, 8390],
];

function curtains(root) {
  const g = new THREE.Group();
  g.name = 'curtains';
  for (const [room, , at, s, e] of CURTAINS) {
    const z = v(at), x0 = v(s), x1 = v(e);
    const top = H - 0.06, hgt = top - 0.02;
    const cg = new THREE.Group();
    cg.userData = { type: 'curtain', room };
    // 轨道盒
    block(cg, 'frame', x1 - x0, 0.04, 0.12, (x0 + x1) / 2, H - 0.05, z);
    // 纱帘
    const sheer = part(cg, curtainGeo(x1 - x0, hgt, 0.025, 0.14), 'sheer', (x0 + x1) / 2, 0.02 + hgt / 2, z + (at > 4000 ? -0.03 : 0.03));
    sheer.castShadow = false;
    // 遮光帘
    const pw = Math.min(0.75, (x1 - x0) * 0.22);
    for (const cx of [x0 + pw / 2 + 0.02, x1 - pw / 2 - 0.02]) {
      part(cg, curtainGeo(pw, hgt, 0.06, 0.16), 'curtain', cx, 0.02 + hgt / 2, z + (at > 4000 ? -0.1 : 0.1));
    }
    compact(cg);
    g.add(cg);
  }
  root.add(g);
  return g;
}

// —— 墙面饰面：电视墙大板石材、床头软包、卫浴石材、厨房背板 ——
function finishes(root) {
  const g = new THREE.Group();
  g.name = 'finishes';
  const clad = (key, x0, z0, x1, z1, y0 = 0, y1 = CEIL) => {
    const m = block(g, key, v(x1 - x0), v(y1 - y0), v(z1 - z0), v((x0 + x1) / 2), v(y0), v((z0 + z1) / 2));
    m.castShadow = false;
    return m;
  };
  // 会客厅电视墙：1200 宽大板 + 香槟金竖向嵌条
  clad('marbleWall', 6310, 5160, 6335, 8450);
  for (let zz = 5160 + 1160; zz < 8450; zz += 1160) clad('brass', 6335, zz - 6, 6340, zz + 6);
  // 主卧床头软包（四联）
  for (let i = 0; i < 4; i++) {
    const z0 = 5560 + i * 655;
    clad('wallPanel', 100, z0, 140, z0 + 640, 0, 2500);
  }
  clad('brass', 100, 5550, 146, 8190, 2500, 2512);
  // 次卧一床头：胡桃木格栅
  clad('fluteWall', 1790, 640, 1815, 3260, 0, 2600);
  // 次卧二床头：软包
  for (let i = 0; i < 3; i++) {
    const z0 = 6050 + i * 700;
    clad('wallPanel', 6050, z0, 6090, z0 + 690, 0, 2400);
  }
  // 主卫
  clad('bathWall', 100, 1100, 115, 3280);
  clad('showerWall', 1675, 100, 1690, 1610);
  clad('bathWall', 1675, 1610, 1690, 3280);
  clad('showerWall', 245, 710, 790, 725);
  clad('showerWall', 790, 100, 805, 710);
  clad('bathWall', 100, 3265, 760, 3280);
  clad('bathWall', 1560, 3265, 1675, 3280);
  // 卫生间
  clad('showerWall', 4540, 100, 4555, 1710);
  clad('bathWall', 4540, 1710, 4555, 2730);
  clad('showerWall', 5375, 100, 5390, 710);
  clad('bathWall', 5390, 710, 5780, 725);
  clad('bathWall', 6025, 1150, 6040, 2730);
  clad('bathWall', 5380, 2715, 6025, 2730);
  // 干区台盆背墙
  clad('marbleWall', 6025, 2830, 6040, 3950);
  // 厨房背板
  clad('marbleGreige', 13145, 830, 13160, 2540, 900, 1600);
  clad('marbleGreige', 11230, 100, 12610, 115, 900, 1050);
  g.traverse((o) => { if (o.isMesh) o.userData.type = 'wall'; });
  root.add(g);
  return g;
}

export function buildArchitecture(root) {
  const arch = new THREE.Group();
  arch.name = 'architecture';
  root.add(arch);
  const out = {
    group: arch,
    slab: slab(arch),
    floors: floors(arch),
    walls: walls(arch),
    finishes: finishes(arch),
    windows: windows(arch),
    curtains: curtains(arch),
  };
  out.doors = doors(arch);
  return out;
}

// 墙体矩形清单：section=true 时扣除门窗洞口（1.2 m 剖切面），否则为墙顶全长
function wallRects(section) {
  const out = [];
  for (const r of STRUCT) out.push([r, 'struct']);
  for (const p of PARTITIONS) {
    const [x0, z0, x1, z1] = p.r;
    const role = p.shaft ? 'shaft' : 'part';
    if (!section || !p.open) { out.push([p.r, role]); continue; }
    const alongX = x1 - x0 >= z1 - z0;
    let cur = alongX ? x0 : z0;
    for (const o of [...p.open].sort((m, n) => m.a - n.a)) {
      if (o.a - cur > 1) out.push([alongX ? [cur, z0, o.a, z1] : [x0, cur, x1, o.a], role]);
      cur = o.b;
    }
    const end = alongX ? x1 : z1;
    if (end - cur > 1) out.push([alongX ? [cur, z0, end, z1] : [x0, cur, x1, end], role]);
  }
  for (const f of FACADE) {
    const [x0, z0, x1, z1] = f.r;
    if (!section) { out.push([f.r, 'struct']); continue; }
    let cur = x0;
    for (const w of f.windows) { out.push([[cur, z0, w.a, z1], 'struct']); cur = w.b; }
    out.push([[cur, z0, x1, z1], 'struct']);
  }
  return out;
}

function capGroup(list, matFor, y, name) {
  const g = new THREE.Group();
  g.name = name;
  for (const [r, role] of list) {
    const [x0, z0, x1, z1] = r.map(v);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), matFor(role));
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    m.raycast = () => {};
    g.add(m);
  }
  return g;
}

// 平面图用：结构墙与隔墙的填充（墙体剖切面，始终画在最上层）
export function wallPoche() {
  const g = capGroup(wallRects(true), (role) => POCHE[role], H + 0.02, 'poche');
  g.children.forEach((m) => { m.renderOrder = 10; });
  return g;
}

// 三维视图用：墙顶封口（深色，像剖开的模型）；cut 为 1.2 m 剖切时的封口
export const CAP = new THREE.MeshBasicMaterial({ color: '#4a4744' });
CAP.clippingPlanes = planes.model;
export function wallCaps() {
  return {
    top: capGroup(wallRects(false), () => CAP, H + 0.002, 'capsTop'),
    cut: capGroup(wallRects(true), () => CAP, 1.2 + 0.002, 'capsCut'),
  };
}

// 墙体填充色：白天深蓝实心（仿 CAD 涂黑），夜晚浅蓝
export const POCHE = {
  struct: new THREE.MeshBasicMaterial({ color: '#263B54', depthTest: false }),
  part: new THREE.MeshBasicMaterial({ color: '#6C9AC4', depthTest: false }),
  shaft: new THREE.MeshBasicMaterial({ color: '#9FBDDA', depthTest: false }),
};
export function setPocheTheme(night) {
  POCHE.struct.color.set(night ? '#CCDBEB' : '#263B54');
  POCHE.part.color.set(night ? '#6C9AC4' : '#6C9AC4');
  POCHE.shaft.color.set(night ? '#497DAE' : '#CCDBEB');
}
