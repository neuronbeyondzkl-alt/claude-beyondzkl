// 建筑：楼板、墙体（按洞口切分）、墙面饰面、踢脚线、门窗、过门石、窗帘
import * as THREE from 'three';
import { WALLS, DOORS, SLIDERS, ROOMS, WALL_H } from './plan-data.js';
import { M, boxGeo, tag, kit, facePanel, mergeMeshes } from './geo.js';

const H = WALL_H;
const TILE_H = 2400;
const WET = new Set(['tileMarble']);
const NO_SKIRT = new Set(['tileMarble', 'marbleSlab']);

export function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
export const roomAt = (x, z) => ROOMS.find((r) => pointInPoly(x, z, r.poly));

export function polyArea(poly) {
  let s = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1];
  return Math.abs(s) / 2 / 1e6;   // m²
}
export function polyBBox(poly) {
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) };
}

function pieces(w) {
  const alongX = w.x[1] - w.x[0] >= w.z[1] - w.z[0];
  const [a0, a1] = alongX ? w.x : w.z;
  const ops = (w.open || []).slice().sort((p, q) => p.a - q.a);
  const out = [];
  let cur = a0;
  const push = (a, b, y0, y1) => out.push(alongX ? { x: [a, b], z: w.z, y: [y0, y1] } : { x: w.x, z: [a, b], y: [y0, y1] });
  for (const o of ops) {
    if (o.a > cur) push(cur, o.a, 0, H);
    if (o.y0 > 0) push(o.a, o.b, 0, o.y0);
    if (o.y1 < H) push(o.a, o.b, o.y1, H);
    cur = o.b;
  }
  if (cur < a1) push(cur, a1, 0, H);
  return { alongX, list: out };
}

// 沿墙面采样，找出这一面墙朝向哪个（些）房间
function faceRuns(face) {
  const { at, range, axis, n } = face;
  const runs = [];
  const step = 50;
  for (let s = range[0] + step / 2; s < range[1]; s += step) {
    const px = axis === 'z' ? at + n[0] * 60 : s;
    const pz = axis === 'z' ? s : at + n[1] * 60;
    const room = roomAt(px, pz);
    const id = room ? room.id : null;
    const last = runs[runs.length - 1];
    if (last && last.id === id) last.b = Math.min(range[1], s + step / 2);
    else runs.push({ id, room, a: Math.max(range[0], s - step / 2), b: Math.min(range[1], s + step / 2) });
  }
  return runs.filter((r) => r.id && r.b - r.a > 20);
}

function faces(p) {
  const [x0, x1] = p.x, [z0, z1] = p.z;
  return [
    { at: x1, range: [z0, z1], axis: 'z', n: [1, 0], side: 'W', idx: 0 },
    { at: x0, range: [z0, z1], axis: 'z', n: [-1, 0], side: 'E', idx: 1 },
    { at: z1, range: [x0, x1], axis: 'x', n: [0, 1], side: 'N', idx: 4 },
    { at: z0, range: [x0, x1], axis: 'x', n: [0, -1], side: 'S', idx: 5 },
  ];
}

function finishSegments(run, side) {
  const segs = [];
  const room = run.room;
  const fs = (room.feature || []).filter((f) => f.side === side && f.to > run.a && f.from < run.b);
  let cur = run.a;
  for (const f of fs.sort((p, q) => p.from - q.from)) {
    const a = Math.max(run.a, f.from), b = Math.min(run.b, f.to);
    if (a > cur) segs.push({ a: cur, b: a, finish: room.wall });
    segs.push({ a, b, finish: f.finish });
    cur = b;
  }
  if (cur < run.b) segs.push({ a: cur, b: run.b, finish: room.wall });
  return segs;
}

export function buildArchitecture() {
  const group = new THREE.Group();
  group.name = 'architecture';
  const K = kit(group, 'arch');
  const floors = new Map();
  const doors = new Map();
  const sliders = new Map();
  const windows = [];
  const windowGroups = [];

  // —— 楼板与室外地面 ——
  K.box('slab', M(13840), 0.22, M(10050), M(6620), -0.22, M(4525), { cat: 'arch' });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80));
  ground.rotation.x = -Math.PI / 2; ground.position.set(M(6620), -0.221, M(4525));
  tag(ground, 'ground', { cat: 'arch', noEdges: true, noShadow: true });
  group.add(ground);

  // —— 房间地面 ——
  for (const r of ROOMS) {
    const shape = new THREE.Shape(r.poly.map(([x, z]) => new THREE.Vector2(M(x), -M(z))));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.Mesh(g);
    m.position.y = 0.002;
    tag(m, r.floor, { cat: 'floor', noShadow: true });
    m.userData.pick = { type: 'room', id: r.id };
    m.userData.isFloor = true;
    group.add(m);
    floors.set(r.id, m);
  }

  // —— 墙体 ——
  for (const w of WALLS) {
    const { list } = pieces(w);
    for (const p of list) {
      const [x0, x1] = p.x, [z0, z1] = p.z, [y0, y1] = p.y;
      const fcs = faces(p);
      const runsByFace = fcs.map((f) => faceRuns(f));
      const roles = ['wallExt', 'wallExt', y1 >= H ? 'cap' : 'wallCore', 'wallCore', 'wallExt', 'wallExt'];
      fcs.forEach((f, i) => { if (runsByFace[i].length) roles[f.idx] = 'wallCore'; });
      const m = new THREE.Mesh(boxGeo(M(x1 - x0), M(y1 - y0), M(z1 - z0)));
      m.position.set(M((x0 + x1) / 2), M((y0 + y1) / 2), M((z0 + z1) / 2));
      tag(m, roles, { cat: 'arch' });
      m.userData.isWall = true;
      group.add(m);

      // 饰面、踢脚线
      fcs.forEach((f, i) => {
        for (const run of runsByFace[i]) {
          for (const seg of finishSegments(run, f.side)) {
            const len = seg.b - seg.a;
            if (len < 10) continue;
            const mid = (seg.a + seg.b) / 2;
            const cx = f.axis === 'z' ? f.at : mid, cz = f.axis === 'z' ? mid : f.at;
            const bands = WET.has(seg.finish)
              ? [[y0, Math.min(y1, TILE_H), seg.finish], [Math.max(y0, TILE_H), y1, 'paintWarm']]
              : [[y0, y1, seg.finish]];
            for (const [b0, b1, fin] of bands) {
              if (b1 - b0 < 5) continue;
              const pm = new THREE.Mesh(facePanel(M(cx), M(cz), f.n[0], f.n[1], M(len), M(b0), M(b1)));
              tag(pm, fin, { cat: 'arch', noEdges: true, noShadow: true });
              pm.userData.isWall = true;
              group.add(pm);
            }
            if (y0 === 0 && run.room.skirting !== false && !NO_SKIRT.has(seg.finish)) {
              const sk = new THREE.Mesh(boxGeo(f.axis === 'z' ? 0.012 : M(len), 0.08, f.axis === 'z' ? M(len) : 0.012));
              sk.position.set(M(cx) + f.n[0] * 0.01, 0.04, M(cz) + f.n[1] * 0.01);
              tag(sk, 'skirting', { cat: 'arch', noEdges: true, noShadow: true });
              group.add(sk);
            }
          }
        }
      });
    }

    // —— 洞口：门、推拉门、窗、垭口 ——
    const alongX = w.x[1] - w.x[0] >= w.z[1] - w.z[0];
    const [t0, t1] = alongX ? w.z : w.x;
    for (const o of w.open || []) {
      const ctx = { w, o, alongX, t0, t1 };
      if (o.type === 'door') doors.set(o.id, buildDoor(group, ctx));
      else if (o.type === 'slide') sliders.set(o.id, buildSlider(group, ctx));
      else if (o.type === 'window') { const meta = buildWindow(group, ctx); windowGroups.push(meta.group); delete meta.group; windows.push(meta); }
      if (o.type !== 'window') threshold(group, ctx);
      if (o.type === 'open') casings(group, ctx, 'lacquerCream');
    }
  }

  // 合并静态构件，减少绘制次数（门扇、推拉门扇各自合并，保持能单独动）
  for (const d of doors.values()) mergeMeshes(d.pivot.children[0]);
  for (const st of sliders.values()) for (const L of st.leaves) mergeMeshes(L.g);
  for (const wg of windowGroups) mergeMeshes(wg);
  mergeMeshes(group, false);

  return { group, floors, doors, sliders, windows };
}

// 局部坐标：u 沿墙长方向，v 沿墙厚方向
function place(obj, ctx, u, v) {
  if (ctx.alongX) obj.position.set(M(u), obj.position.y, M(v));
  else obj.position.set(M(v), obj.position.y, M(u));
}
function uvBox(K, role, ctx, ua, ub, va, vb, y0, y1, o) {
  const [w, d] = ctx.alongX ? [ub - ua, vb - va] : [vb - va, ub - ua];
  const m = K.box(role, M(w), M(y1 - y0), M(d), 0, M(y0), 0, o);
  place(m, ctx, (ua + ub) / 2, (va + vb) / 2);
  return m;
}

function threshold(group, ctx) {
  const K = kit(group, 'arch');
  const m = uvBox(K, 'marbleDark', ctx, ctx.o.a, ctx.o.b, ctx.t0 - 10, ctx.t1 + 10, 0, 8, { noEdges: true, noShadow: true });
  m.userData.isFloor = true;
}

function casings(group, ctx, role) {
  const K = kit(group, 'arch');
  const { o, t0, t1 } = ctx;
  const cw = 60, pr = 16, top = o.y1;
  for (const [va, vb] of [[t0 - pr, t0], [t1, t1 + pr]]) {
    uvBox(K, role, ctx, o.a - cw, o.a, va, vb, 0, top + cw, { noShadow: true });
    uvBox(K, role, ctx, o.b, o.b + cw, va, vb, 0, top + cw, { noShadow: true });
    uvBox(K, role, ctx, o.a - cw, o.b + cw, va, vb, top, top + cw, { noShadow: true });
  }
  // 门洞内侧包套
  uvBox(K, role, ctx, o.a, o.a + 18, t0, t1, 0, top, { noShadow: true, noEdges: true });
  uvBox(K, role, ctx, o.b - 18, o.b, t0, t1, 0, top, { noShadow: true, noEdges: true });
  uvBox(K, role, ctx, o.a, o.b, t0, t1, top - 18, top, { noShadow: true, noEdges: true });
}

function buildDoor(group, ctx) {
  const { o, alongX, t0, t1 } = ctx;
  const spec = DOORS[o.id];
  const entry = spec.style === 'entry';
  casings(group, ctx, entry ? 'walnut' : 'lacquerCream');
  const pivot = new THREE.Group();
  const tc = (t0 + t1) / 2;
  const hingeU = spec.hinge === 'a' ? o.a + 22 : o.b - 22;
  pivot.position.y = 0;
  place(pivot, ctx, hingeU, tc);
  group.add(pivot);
  const leafW = o.b - o.a - 44 - 6;
  const leafH = o.y1 - 22 - 8;
  const th = spec.thick || 45;
  const dir = spec.hinge === 'a' ? 1 : -1;     // 门扇从铰链指向另一端
  const leaf = new THREE.Group();
  pivot.add(leaf);
  const K = kit(leaf, 'arch');
  const role = entry ? 'walnut' : 'lacquerCream';
  // 门扇本体 + 香槟金嵌条
  const body = K.box(role, alongX ? M(leafW) : M(th), M(leafH), alongX ? M(th) : M(leafW), 0, 0.008, 0);
  const off = (dir * leafW) / 2;
  if (alongX) body.position.x = M(off); else body.position.z = M(off);
  const handleU = dir * (leafW - 70);
  // 门扇局部坐标：u 沿门扇宽度，v 垂直门面
  const P = (m, u, y, v) => { if (alongX) m.position.set(M(u), y, M(v)); else m.position.set(M(v), y, M(u)); return m; };
  const dims = (lu, h, lv) => (alongX ? [M(lu), h, M(lv)] : [M(lv), h, M(lu)]);
  for (const s of [-1, 1]) {
    const face = s * th / 2;
    if (entry) {
      P(K.box('brass', ...dims(26, 1.1, 26), 0, 0, 0), handleU, 0.5 + 0.55, face + s * 48);
      for (const yy of [0.62, 1.48]) P(K.box('brass', ...dims(16, 0.016, 48), 0, 0, 0), handleU, yy, face + s * 24);
    } else {
      const rose = K.cyl('brass', 0.026, 0.026, 0.022, 0, 0, 0, { rx: alongX ? Math.PI / 2 : 0, rz: alongX ? 0 : Math.PI / 2 });
      P(rose, handleU, 1.03, face + s * 11);
      P(K.box('brass', ...dims(130, 0.018, 18), 0, 0, 0), handleU - dir * 55, 1.03, face + s * 31);
    }
    // 门板上的装饰嵌条（两道）
    for (const yy of [0.32, 1.62]) {
      P(K.box('brass', ...dims(leafW - 160, 0.006, 4), 0, 0, 0, { noEdges: true, noShadow: true }), off, yy, face + s * 1);
    }
  }
  leaf.traverse((m) => { if (m.isMesh) m.userData.pick = { type: 'door', id: o.id }; });

  // 打开方向
  let sign;
  if (alongX) sign = spec.hinge === 'a' ? -spec.swing : spec.swing;
  else sign = spec.hinge === 'a' ? spec.swing : -spec.swing;
  const openAngle = THREE.MathUtils.degToRad(spec.open || 80);
  const state = {
    id: o.id, spec, pivot, sign, openAngle: openAngle || THREE.MathUtils.degToRad(80),
    open: spec.open > 0, cur: spec.open > 0 ? openAngle : 0,
    width: o.b - o.a, height: o.y1,
  };
  pivot.rotation.y = sign * state.cur;
  return state;
}

function buildSlider(group, ctx) {
  const { o, alongX, t0, t1 } = ctx;
  const spec = SLIDERS[o.id];
  const n = spec.leaves;
  const K = kit(group, 'arch');
  const tc = (t0 + t1) / 2;
  // 上下轨道
  uvBox(K, 'frame', ctx, o.a, o.b, t0 + 10, t1 - 10, o.y1 - 40, o.y1, { noShadow: true });
  uvBox(K, 'frame', ctx, o.a, o.b, t0 + 10, t1 - 10, 0, 10, { noShadow: true, noEdges: true });
  casings(group, ctx, 'lacquerCream');
  const total = o.b - o.a;
  const lw = total / n + 40;
  const leaves = [];
  const glassRole = o.id === 'sd-kitchen' ? 'glassFluted' : 'glass';
  for (let i = 0; i < n; i++) {
    const g = new THREE.Group();
    group.add(g);
    const LK = kit(g, 'glass');
    const fr = 32, th = 30, hh = o.y1 - 50;
    // 框（局部坐标 u 沿门扇宽度）
    const fw = (a, b, y0, y1) => {
      const m = LK.box('frame', alongX ? M(b - a) : M(th), M(y1 - y0), alongX ? M(th) : M(b - a), 0, M(y0), 0, { cat: 'arch' });
      if (alongX) m.position.x = M((a + b) / 2); else m.position.z = M((a + b) / 2);
    };
    fw(-lw / 2, -lw / 2 + fr, 10, hh); fw(lw / 2 - fr, lw / 2, 10, hh);
    fw(-lw / 2, lw / 2, 10, 10 + fr); fw(-lw / 2, lw / 2, hh - fr, hh);
    fw(-lw / 2, lw / 2, 1050, 1050 + 18);
    LK.box(glassRole, alongX ? M(lw - 2 * fr) : 0.008, M(hh - 10 - 2 * fr), alongX ? 0.008 : M(lw - 2 * fr), 0, M(10 + fr), 0, { noShadow: true });
    const track = (i - (n - 1) / 2) * 34;
    const closedU = o.a + (i + 0.5) * (total / n);
    const openU = o.b - lw / 2 + 10;
    g.userData.track = track;
    place(g, ctx, closedU, tc + track);
    g.traverse((m) => { if (m.isMesh) m.userData.pick = { type: 'slide', id: o.id }; });
    leaves.push({ g, track, closedU, openU });
  }
  const st = { id: o.id, spec, leaves, ctx, open: !!spec.open, t: spec.open ? 1 : 0, tc, width: total, height: o.y1 };
  setSlider(st, st.t);
  return st;
}

export function setSlider(st, t) {
  st.t = t;
  for (const L of st.leaves) place(L.g, st.ctx, L.closedU + (L.openU - L.closedU) * t, st.tc + L.track);
}

function buildWindow(group, ctx) {
  const { o, w, alongX, t0, t1 } = ctx;
  const wg = new THREE.Group();
  group.add(wg);
  const K = kit(wg, 'glass');
  const tc = (t0 + t1) / 2;
  // 判断室内在哪一侧
  const mid = (o.a + o.b) / 2;
  const probe = (v) => (alongX ? roomAt(mid, v) : roomAt(v, mid));
  const inSide = probe(t1 + 300) ? 1 : probe(t0 - 300) ? -1 : 1;
  const faceV = inSide > 0 ? t1 : t0;
  const fp = 55, depth = 70;
  const fv0 = tc - depth / 2, fv1 = tc + depth / 2;
  const fb = (ua, ub, y0, y1) => uvBox(K, 'frame', ctx, ua, ub, fv0, fv1, y0, y1, { cat: 'arch' });
  fb(o.a, o.a + fp, o.y0, o.y1); fb(o.b - fp, o.b, o.y0, o.y1);
  fb(o.a, o.b, o.y0, o.y0 + fp); fb(o.a, o.b, o.y1 - fp, o.y1);
  const width = o.b - o.a, height = o.y1 - o.y0;
  const nP = Math.max(1, Math.round(width / 900));
  for (let i = 1; i < nP; i++) {
    const u = o.a + (width * i) / nP;
    fb(u - 22, u + 22, o.y0, o.y1);
  }
  let transom = null;
  if (height > 1600) { transom = o.y1 - 480; fb(o.a, o.b, transom - 20, transom + 20); }
  const glass = uvBox(K, 'glass', ctx, o.a + fp, o.b - fp, tc - 4, tc + 4, o.y0 + fp, o.y1 - fp, { noShadow: true });
  glass.userData.noShadow = true;
  // 执手（每隔一扇）
  for (let i = 0; i < nP; i += 2) {
    const u = o.a + (width * (i + 1)) / nP - 60;
    uvBox(K, 'brass', ctx, u - 8, u + 8, inSide > 0 ? fv1 : fv0 - 25, inSide > 0 ? fv1 + 25 : fv0, o.y0 + Math.min(1100, height * 0.5), o.y0 + Math.min(1100, height * 0.5) + 130, { noEdges: true });
  }
  // 窗台石
  if (o.y0 > 60) {
    uvBox(K, 'calacatta', ctx, o.a - 30, o.b + 30, inSide > 0 ? tc : faceV - 40, inSide > 0 ? faceV + 40 : tc, o.y0 - 20, o.y0, { cat: 'arch' });
  }
  const meta = { id: o.id, name: o.name, width, height, sill: o.y0, wall: w.id, room: (alongX ? roomAt(mid, faceV + inSide * 300) : roomAt(faceV + inSide * 300, mid))?.id };
  wg.traverse((m) => { if (m.isMesh) m.userData.pick = { type: 'window', id: o.id }; });
  if (o.curtain) curtains(group, ctx, inSide, faceV);
  return { ...meta, group: wg };
}

function wavyPanel(len, h, folds, amp) {
  const segX = Math.max(8, Math.round(folds * 8));
  const g = new THREE.PlaneGeometry(len, h, segX, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    p.setZ(i, Math.sin((x / len) * folds * Math.PI * 2) * amp);
  }
  g.computeVertexNormals();
  return g;
}

function curtains(group, ctx, inSide, faceV) {
  const { o, alongX } = ctx;
  const K = kit(group, 'furn');
  const top = 2740, bottom = 15;
  const h = M(top - bottom);
  const v = faceV + inSide * 130;
  const a = o.a - 150, b = o.b + 150;
  const len = b - a;
  // 轨道
  uvBox(K, 'blackMetal', ctx, a - 40, b + 40, v - 12, v + 12, top, top + 25, { noEdges: true });
  const mk = (role, ua, ub, vv, folds, amp, o2) => {
    const L = ub - ua;
    const m = new THREE.Mesh(wavyPanel(M(L), h, folds, amp));
    tag(m, role, { cat: 'furn', noEdges: true, ...o2 });
    m.position.y = M(bottom) + h / 2;
    if (alongX) { m.position.x = M((ua + ub) / 2); m.position.z = M(vv); }
    else { m.rotation.y = Math.PI / 2; m.position.z = M((ua + ub) / 2); m.position.x = M(vv); }
    group.add(m);
    return m;
  };
  mk('curtainSheer', a, b, v, len / 140, 0.025, { noShadow: true });
  const bunch = Math.min(520, len * 0.17);
  mk('curtainHeavy', a, a + bunch, v + inSide * 60, bunch / 70, 0.045);
  mk('curtainHeavy', b - bunch, b, v + inSide * 60, bunch / 70, 0.045);
}
