// 入口：搭建场景，把点选讲解、渲染模式、昼夜、家具显隐、平面图和进入房间串起来
import * as THREE from 'three';
import { ROOMS, FURNITURE, ROOM_LIGHTS, WALLS, AXES, WALL_H } from './plan-data.js';
import { makeTextures } from './textures.js';
import { MaterialLibrary, applyMode, LOYEL } from './materials.js';
import { buildArchitecture, setSlider, polyArea, polyBBox, roomAt } from './architecture.js';
import { buildFurniture } from './furniture.js';
import { Lighting } from './lighting.js';
import { Views } from './views.js';
import { UI } from './ui.js';
import { M } from './geo.js';

const $ = (id) => document.getElementById(id);
const frame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
const ROOM_BY_ID = new Map(ROOMS.map((r) => [r.id, r]));
const FURN_BY_ID = new Map(FURNITURE.map((f) => [f.id, f]));
const MODE_NAMES = { real: '真实材质', clay: '白模', wire: '线框' };
const smooth = (t) => t * t * (3 - 2 * t);

// 外包范围（毫米）：承重墙外皮
const BOUNDS = { x0: -200, x1: 13440, z0: -400, z1: 9450 };
const CENTER = new THREE.Vector3(M(BOUNDS.x0 + BOUNDS.x1) / 2, 0, M(BOUNDS.z0 + BOUNDS.z1) / 2 - 0.1);

function roomMeta() {
  const meta = new Map();
  for (const r of ROOMS) {
    const b = polyBBox(r.poly);
    meta.set(r.id, {
      ...b, area: polyArea(r.poly), w: b.x1 - b.x0, d: b.z1 - b.z0,
      cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, lx: r.label[0], lz: r.label[1], rect: r.poly.length === 4,
    });
  }
  return meta;
}

// 每个洞口两侧各是哪个房间
function openingSides() {
  const map = new Map();
  for (const w of WALLS) {
    const alongX = w.x[1] - w.x[0] >= w.z[1] - w.z[0];
    const [t0, t1] = alongX ? w.z : w.x;
    for (const o of w.open || []) {
      const mid = (o.a + o.b) / 2;
      const at = (v) => (alongX ? roomAt(mid, v) : roomAt(v, mid));
      map.set(o.id, [at(t0 - 250), at(t1 + 250)].map((r) => (r ? r.name : '公共走道')));
    }
  }
  return map;
}

// —— 选中 / 悬停高亮 ——
class Highlighter {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.name = 'highlight';
    scene.add(this.group);
    const flat = (color, opacity) => new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    });
    this.mat = {
      sel: { fill: flat(LOYEL.c50, 0.3), band: flat(LOYEL.c70, 0.95), line: new THREE.LineBasicMaterial({ color: LOYEL.c60, depthTest: false, transparent: true }), box: flat(LOYEL.c50, 0.1) },
      hov: { fill: flat(LOYEL.c40, 0.16), band: flat(LOYEL.c50, 0.6), line: new THREE.LineBasicMaterial({ color: LOYEL.c40, depthTest: false, transparent: true, opacity: 0.85 }), box: flat(LOYEL.c40, 0.06) },
    };
    this.slots = { sel: null, hov: null };
    this.walk = false;
  }

  // 进入房间后不再给整块地面上色（站在房间里看会整片发蓝）
  setWalk(on) {
    this.walk = on;
    for (const o of Object.values(this.slots)) if (o && o.userData.isRoom) o.visible = !on;
  }

  clear(kind) {
    const o = this.slots[kind];
    if (!o) return;
    this.group.remove(o);
    o.traverse((m) => { if (m.geometry) m.geometry.dispose(); });
    this.slots[kind] = null;
  }

  _set(kind, obj) {
    this.clear(kind);
    obj.renderOrder = kind === 'sel' ? 12 : 11;
    obj.traverse((m) => { m.renderOrder = obj.renderOrder; });
    this.group.add(obj);
    this.slots[kind] = obj;
  }

  room(room, kind) {
    const m = this.mat[kind];
    const g = new THREE.Group();
    g.userData.isRoom = true;
    g.visible = !this.walk;
    const shape = new THREE.Shape(room.poly.map(([x, z]) => new THREE.Vector2(M(x), -M(z))));
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), m.fill);
    fill.rotation.x = -Math.PI / 2;
    fill.position.y = 0.006;
    g.add(fill);
    const P = room.poly;
    for (let i = 0; i < P.length; i++) {
      const [ax, az] = P[i], [bx, bz] = P[(i + 1) % P.length];
      const len = Math.hypot(bx - ax, bz - az);
      const band = new THREE.Mesh(new THREE.PlaneGeometry(M(len) + 0.06, 0.06), m.band);
      band.rotation.set(-Math.PI / 2, 0, -Math.atan2(bz - az, bx - ax));
      band.position.set(M(ax + bx) / 2, 0.009, M(az + bz) / 2);
      g.add(band);
    }
    this._set(kind, g);
  }

  // oriented = 按第一个对象自身坐标系画包围盒（家具、平开门）；否则画世界坐标轴对齐的盒子
  box(objs, kind, oriented = true) {
    objs = Array.isArray(objs) ? objs : [objs];
    const m = this.mat[kind];
    const b = new THREE.Box3();
    const ref = objs[0];
    ref.updateMatrixWorld(true);
    const inv = oriented ? ref.matrixWorld.clone().invert() : new THREE.Matrix4();
    const m4 = new THREE.Matrix4();
    for (const obj of objs) {
      obj.updateMatrixWorld(true);
      obj.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        m4.multiplyMatrices(inv, o.matrixWorld);
        b.union(o.geometry.boundingBox.clone().applyMatrix4(m4));
      });
    }
    if (b.isEmpty()) return;
    const size = b.getSize(new THREE.Vector3()).addScalar(0.05);
    const c = b.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    if (oriented) { holder.matrixAutoUpdate = false; holder.matrix.copy(ref.matrixWorld); }
    const bg = new THREE.BoxGeometry(size.x, size.y, size.z);
    const line = new THREE.LineSegments(new THREE.EdgesGeometry(bg), m.line);
    line.position.copy(c);
    const fill = new THREE.Mesh(bg, m.box);
    fill.position.copy(c);
    holder.add(line, fill);
    this._set(kind, holder);
  }

  setNight(night) {
    this.mat.sel.line.color.set(night ? LOYEL.c30 : LOYEL.c60);
    this.mat.hov.line.color.set(night ? LOYEL.c40 : LOYEL.c40);
    this.mat.sel.band.color.set(night ? LOYEL.c40 : LOYEL.c70);
  }
}

// —— 平面图：轴线、轴号、尺寸线 ——
function buildPlanOverlay(ui) {
  const g = new THREE.Group();
  g.name = 'plan-overlay';
  g.visible = false;
  const Y = 0.03;
  const axisMat = new THREE.LineDashedMaterial({ color: LOYEL.c50, dashSize: 0.32, gapSize: 0.1, transparent: true, opacity: 0.85 });
  const dimMat = new THREE.LineBasicMaterial({ color: LOYEL.c70 });
  const line = (pts, mat) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(([x, z]) => new THREE.Vector3(M(x), Y, M(z))));
    const l = new THREE.LineSegments(geo, mat);
    if (mat.isLineDashedMaterial) l.computeLineDistances();
    l.raycast = () => {};
    g.add(l);
  };
  const P = (x, z, y = Y) => new THREE.Vector3(M(x), y, M(z));

  const xs = AXES.x, zs = AXES.z;
  const top = BOUNDS.z0 - 1250, left = BOUNDS.x0 - 1250, bottom = BOUNDS.z1 + 900, right = BOUNDS.x1 + 900;
  // 轴线
  for (const a of xs) line([[a.v, top - 350], [a.v, bottom]], axisMat);
  for (const a of zs) line([[left - 350, a.v], [right, a.v]], axisMat);
  // 轴号
  for (const a of xs) { ui.addAnno(a.id, P(a.v, top - 650), 'anno--axis'); ui.addAnno(a.id, P(a.v, bottom + 300), 'anno--axis'); }
  for (const a of zs) { ui.addAnno(a.id, P(left - 650, a.v), 'anno--axis'); ui.addAnno(a.id, P(right + 300, a.v), 'anno--axis'); }

  // 尺寸链（分尺寸 + 总尺寸）
  const chain = (vals, at, horizontal) => {
    const segs = [];
    const tick = 130;
    for (let i = 0; i < vals.length; i++) {
      const v = vals[i];
      if (horizontal) segs.push([v - tick, at + tick], [v + tick, at - tick], [v, at - 220], [v, at + 220]);
      else segs.push([at - tick, v + tick], [at + tick, v - tick], [at - 220, v], [at + 220, v]);
    }
    segs.push(horizontal ? [vals[0] - 200, at] : [at, vals[0] - 200], horizontal ? [vals.at(-1) + 200, at] : [at, vals.at(-1) + 200]);
    line(segs, dimMat);
    for (let i = 0; i + 1 < vals.length; i++) {
      const mid = (vals[i] + vals[i + 1]) / 2, len = vals[i + 1] - vals[i];
      ui.addAnno(String(len), horizontal ? P(mid, at - 190) : P(at - 190, mid), horizontal ? 'anno--dim' : 'anno--dim anno--v');
    }
  };
  const xv = xs.map((a) => a.v), zv = zs.map((a) => a.v);
  chain(xv, top + 450, true);
  chain([xv[0], xv.at(-1)], top, true);
  chain(zv, left + 450, false);
  chain([zv[0], zv.at(-1)], left, false);
  return { group: g, axisMat, dimMat };
}

async function boot() {
  const stage = $('stage');
  const canvas = $('scene');
  const loader = $('loader');
  const step = async (text, pct) => {
    $('loaderText').textContent = text;
    $('loaderBar').style.width = `${pct}%`;
    await frame();
  };

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    $('loaderText').textContent = '当前浏览器无法启用 WebGL，请换用新版 Chrome、Edge、Safari 或 Firefox 打开。';
    loader.classList.add('is-error');
    return;
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);
  const small = Math.min(window.innerWidth, window.innerHeight) < 720;

  await step('生成大理石、木纹与面料贴图…', 8);
  const T = makeTextures(small ? 512 : 1024);
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  for (const t of [...Object.values(T), ...Object.values(T.art)]) if (t && t.isTexture) t.anisotropy = aniso;
  const lib = new MaterialLibrary(T);

  await step('按户型图尺寸搭建墙体、门窗…', 30);
  const scene = new THREE.Scene();
  const arch = buildArchitecture();
  scene.add(arch.group);

  await step(`摆放 ${FURNITURE.length} 件家具与软装…`, 52);
  const furn = buildFurniture(FURNITURE);
  scene.add(furn.root);
  applyMode(arch.group, lib);
  applyMode(furn.root, lib);

  await step('布置灯光与相机…', 70);
  const lighting = new Lighting(scene, renderer, CENTER, ROOM_LIGHTS, furn.lights);
  if (small) lighting.setShadowQuality(1024);
  // 平面图范围：外墙 + 两道尺寸线 + 轴号圈
  const views = new Views(canvas, CENTER, { x0: M(BOUNDS.x0 - 2400), x1: M(BOUNDS.x1 + 1500), z0: M(BOUNDS.z0 - 2600), z1: M(BOUNDS.z1 + 1500) });
  const meta = roomMeta();
  const sides = openingSides();
  const ui = new UI(ROOMS, meta);
  const hl = new Highlighter(scene);
  const plan = buildPlanOverlay(ui);
  scene.add(plan.group);

  // 窗：按洞口 id 找到窗的构件组，用于高亮
  const windowGroups = new Map();
  arch.group.traverse((o) => {
    const p = o.userData.pick;
    if (o.isMesh && p && p.type === 'window' && !windowGroups.has(p.id)) windowGroups.set(p.id, o.parent);
  });
  const windowMeta = new Map(arch.windows.map((w) => [w.id, w]));
  for (const s of arch.sliders.values()) s.p = s.t;

  const state = {
    mode3d: 'real', modePlan: 'wire', night: false, furniture: true, labels: true,
    sel: null, walkRoom: null, lastViewMode: null,
  };

  // —— 尺寸 ——
  let W = 1, H = 1;
  const prMax = Math.min(window.devicePixelRatio || 1, 2);
  let pr = prMax;
  renderer.setPixelRatio(pr);
  const resize = () => {
    const r = stage.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    renderer.setSize(W, H, false);
    views.resize(W, H);
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // —— 提示条 ——
  let toastTimer = 0;
  const toast = (text) => {
    const el = $('toast');
    el.textContent = text;
    el.hidden = false;
    el.classList.remove('is-out');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.classList.add('is-out'); toastTimer = setTimeout(() => { el.hidden = true; }, 300); }, 2400);
  };

  const segActive = (segId, value) => {
    for (const b of $(segId).querySelectorAll('button')) {
      const on = b.dataset.value === value;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
  };
  const toggleBtn = (id, on) => { const b = $(id); b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); };

  // —— 渲染模式 ——
  const isPlan = () => views.mode === 'plan';
  const applyCurrentMode = () => {
    const m = isPlan() ? state.modePlan : state.mode3d;
    lib.mode = m;
    applyMode(arch.group, lib);
    applyMode(furn.root, lib);
    document.body.dataset.mode = m;
    segActive('modeSeg', m);
    lighting.setStyle(m);
    renderer.toneMappingExposure = m === 'real' ? (state.night ? 1.1 : 1.0) : 1.0;
  };
  const setMode = (m) => {
    if (isPlan()) state.modePlan = m; else state.mode3d = m;
    applyCurrentMode();
    toast(`已切换为${MODE_NAMES[m]}模式`);
  };

  const setNight = (on) => {
    state.night = on;
    document.body.classList.toggle('night', on);
    lib.setNight(on);
    lighting.setNight(on);
    hl.setNight(on);
    plan.axisMat.color.set(on ? LOYEL.c40 : LOYEL.c50);
    plan.dimMat.color.set(on ? LOYEL.c30 : LOYEL.c70);
    toggleBtn('tglNight', on);
    applyCurrentMode();
    toast(on ? '夜晚：室内灯、台灯与灯带已自动点亮' : '白天：自然光照明，室内灯已关闭');
  };

  const setFurniture = (on) => {
    state.furniture = on;
    furn.root.visible = on;
    lighting.setAccent(on);
    if (!on && state.sel && state.sel.type === 'furn') clearSel();
    toggleBtn('tglFurn', on);
    toast(on ? '已显示家具' : '已隐藏家具，只看空间与硬装');
  };

  const setLabels = (on) => { state.labels = on; toggleBtn('tglLabels', on); };

  const setPlan = (on) => {
    if (on === isPlan()) return;
    if (on) state.walkRoom = null;
    views.setPlan(on);
    plan.group.visible = on;
    document.body.classList.toggle('is-plan', on);
    segActive('viewSeg', on ? 'plan' : '3d');
    applyCurrentMode();
    if (on) toast(state.modePlan === 'wire' ? '平面图：默认线框模式，可在下方切换材质' : '平面图');
  };

  // —— 选择与讲解 ——
  const clearSel = () => {
    state.sel = null;
    hl.clear('sel');
    ui.hideInfo();
    ui.markRoom(null);
  };
  ui.onClose = clearSel;

  const focusFurn = (id) => {
    const g = furn.groups.get(id);
    const it = FURN_BY_ID.get(id);
    if (!g || !it) return;
    const b = new THREE.Box3().setFromObject(g);
    const c = b.getCenter(new THREE.Vector3());
    // 从家具正面、偏向房间中心的方向看过去
    const m = meta.get(it.room);
    const toRoom = m ? new THREE.Vector3(M(m.cx) - c.x, 0, M(m.cz) - c.z) : new THREE.Vector3();
    if (toRoom.lengthSq() > 0.01) toRoom.normalize();
    const hint = it.type === 'shower' ? toRoom : new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(it.rot || 0)), 0, Math.cos(THREE.MathUtils.degToRad(it.rot || 0))).addScaledVector(toRoom, 0.7);
    views.focusPoint(c, b.getSize(new THREE.Vector3()).length() / 2, hint);
  };

  const showRoom = (id, { fly = false } = {}) => {
    const room = ROOM_BY_ID.get(id);
    if (!room) return;
    state.sel = { type: 'room', id };
    hl.room(room, 'sel');
    hl.clear('hov');
    ui.markRoom(id);
    ui.showRoom(room, FURNITURE.filter((f) => f.room === id), {
      onEnter: () => enterRoom(id),
      onFocus: () => views.focusRoom(room, meta.get(id)),
      onItem: (fid) => showFurn(fid, { fly: true }),
    });
    if (fly) views.focusRoom(room, meta.get(id));
  };

  const showFurn = (id, { fly = false } = {}) => {
    const it = FURN_BY_ID.get(id);
    const g = furn.groups.get(id);
    if (!it || !g) return;
    if (!state.furniture) setFurniture(true);
    state.sel = { type: 'furn', id };
    hl.box(g, 'sel', it.type !== 'shower');
    hl.clear('hov');
    ui.markRoom(it.room);
    const roomName = ROOM_BY_ID.get(it.room)?.name || '';
    ui.showFurniture(it, roomName, {
      onFocus: () => focusFurn(id),
      onRoom: () => showRoom(it.room, { fly: views.mode === 'orbit' || isPlan() }),
    });
    if (fly) focusFurn(id);
  };

  const doorPanel = (id) => {
    const d = arch.doors.get(id);
    ui.showDoor(d, (sides.get(id) || []).join(' ↔ '), {
      isOpen: d.open,
      onToggle: () => { d.open = !d.open; doorPanel(id); },
    });
  };
  const showDoor = (id) => {
    const d = arch.doors.get(id);
    if (!d) return;
    if (state.sel && state.sel.type === 'door' && state.sel.id === id) d.open = !d.open;
    state.sel = { type: 'door', id };
    hl.box(d.pivot, 'sel', true);
    ui.markRoom(null);
    doorPanel(id);
  };

  const sliderPanel = (id) => {
    const s = arch.sliders.get(id);
    ui.showSlider(s, (sides.get(id) || []).join(' ↔ '), {
      isOpen: s.open,
      onToggle: () => { s.open = !s.open; sliderPanel(id); },
    });
  };
  const showSlider = (id) => {
    const s = arch.sliders.get(id);
    if (!s) return;
    if (state.sel && state.sel.type === 'slide' && state.sel.id === id) s.open = !s.open;
    state.sel = { type: 'slide', id };
    hl.box(s.leaves.map((L) => L.g), 'sel', false);
    ui.markRoom(null);
    sliderPanel(id);
  };

  const showWindow = (id) => {
    const w = windowMeta.get(id);
    if (!w) return;
    state.sel = { type: 'window', id };
    const g = windowGroups.get(id);
    if (g) hl.box(g, 'sel', false);
    ui.markRoom(w.room || null);
    ui.showWindow(w, ROOM_BY_ID.get(w.room)?.name);
  };

  // —— 进入房间 ——
  const enterRoom = (id) => {
    const room = ROOM_BY_ID.get(id);
    if (!room) return;
    if (isPlan()) setPlan(false);
    showRoom(id);
    views.enterRoom(room, meta.get(id));
    state.walkRoom = id;
    $('walkName').textContent = room.name;
  };
  const exitRoom = () => {
    const id = state.walkRoom;
    state.walkRoom = null;
    views.exitRoom(id ? ROOM_BY_ID.get(id) : null, id ? meta.get(id) : null);
  };
  const stepRoom = (k) => {
    const i = ROOMS.findIndex((r) => r.id === state.walkRoom);
    enterRoom(ROOMS[(i + k + ROOMS.length) % ROOMS.length].id);
  };

  // —— 点选 ——
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, views.camera);
    const targets = state.furniture ? [arch.group, furn.root] : [arch.group];
    for (const hit of ray.intersectObjects(targets, true)) {
      const o = hit.object;
      if (!o.isMesh) continue;
      if (o.userData.pick) return { ...o.userData.pick, point: hit.point };
      if (o.userData.isWall || o.userData.isFloor) {
        // 墙面：先看相机这一侧是哪个房间；点在外墙外皮或墙顶时，取墙另一侧的房间
        // 过门石：取所在位置（或旁边一点）的房间
        const at = (k) => { const q = hit.point.clone().addScaledVector(ray.ray.direction, k); return roomAt(q.x * 1000, q.z * 1000); };
        const room = o.userData.isWall ? at(-0.18) || at(0.45) : at(0) || roomAt(hit.point.x * 1000 + 60, hit.point.z * 1000 + 60);
        if (room) return { type: 'room', id: room.id, point: hit.point };
        if (o.userData.isWall) return null;
      }
      // 窗帘、楼板、地面：继续往后找
    }
    return null;
  };
  const pickKey = (p) => (p ? `${p.type}:${p.id}` : '');

  let last = null;
  const handleClick = (x, y) => {
    const p = pick(x, y);
    const now = performance.now();
    const dbl = !!(p && last && now - last.t < 360 && Math.hypot(x - last.x, y - last.y) < 26 && last.key === pickKey(p));
    last = dbl ? null : { t: now, x, y, key: pickKey(p) };
    if (!p) { clearSel(); return; }
    if (dbl && p.type === 'room') { enterRoom(p.id); return; }
    if (dbl && p.type === 'furn') { focusFurn(p.id); return; }
    if (p.type === 'room') showRoom(p.id);
    else if (p.type === 'furn') showFurn(p.id);
    else if (p.type === 'door') showDoor(p.id);
    else if (p.type === 'slide') showSlider(p.id);
    else if (p.type === 'window') showWindow(p.id);
  };

  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, multi: !!down };
    ui.hideTip();
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) { down = null; return; }
    const ok = !down.multi && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6 && performance.now() - down.t < 650;
    down = null;
    if (ok) handleClick(e.clientX, e.clientY);
  });
  canvas.addEventListener('pointercancel', () => { down = null; });

  // 悬停提示（只对鼠标）
  let hover = null, hoverKey = '';
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    hover = { x: e.clientX, y: e.clientY, buttons: e.buttons, dirty: true };
  });
  canvas.addEventListener('pointerleave', () => { hover = null; hoverKey = ''; ui.hideTip(); hl.clear('hov'); });

  const tipText = (p) => {
    if (p.type === 'room') { const r = ROOM_BY_ID.get(p.id); return `${r.name} · ${meta.get(p.id).area.toFixed(2)} m²`; }
    if (p.type === 'furn') return `${FURN_BY_ID.get(p.id).name} · ${ROOM_BY_ID.get(FURN_BY_ID.get(p.id).room)?.name || ''}`;
    if (p.type === 'door') { const d = arch.doors.get(p.id); return `${d.spec.name} · 点击查看，再点一次${d.open ? '关门' : '开门'}`; }
    if (p.type === 'slide') { const s = arch.sliders.get(p.id); return `${s.spec.name} · 点击查看，再点一次${s.open ? '关上' : '推开'}`; }
    if (p.type === 'window') return windowMeta.get(p.id)?.name || '窗';
    return '';
  };

  const updateHover = () => {
    if (!hover || !hover.dirty) return;
    hover.dirty = false;
    if (hover.buttons || views.tween || down) { ui.hideTip(); return; }
    const p = pick(hover.x, hover.y);
    const key = pickKey(p);
    canvas.style.cursor = p ? 'pointer' : views.mode === 'walk' ? 'grab' : '';
    if (!p) { ui.hideTip(); hl.clear('hov'); hoverKey = ''; return; }
    ui.showTip(tipText(p), hover.x, hover.y);
    if (key === hoverKey) return;
    hoverKey = key;
    const selKey = state.sel ? `${state.sel.type}:${state.sel.id}` : '';
    if (key === selKey) { hl.clear('hov'); return; }
    if (p.type === 'room') hl.room(ROOM_BY_ID.get(p.id), 'hov');
    else if (p.type === 'furn') hl.box(furn.groups.get(p.id), 'hov', FURN_BY_ID.get(p.id).type !== 'shower');
    else if (p.type === 'door') hl.box(arch.doors.get(p.id).pivot, 'hov', true);
    else if (p.type === 'slide') hl.box(arch.sliders.get(p.id).leaves.map((L) => L.g), 'hov', false);
    else if (p.type === 'window' && windowGroups.get(p.id)) hl.box(windowGroups.get(p.id), 'hov', false);
  };

  // —— 门的开合动画 ——
  const animateOpenings = (dt) => {
    let moved = null;
    for (const d of arch.doors.values()) {
      const target = d.open ? d.openAngle : 0;
      if (Math.abs(d.cur - target) < 1e-4) continue;
      const stepA = 2.4 * dt;
      d.cur = Math.abs(target - d.cur) <= stepA ? target : d.cur + Math.sign(target - d.cur) * stepA;
      d.pivot.rotation.y = d.sign * d.cur;
      moved = moved || (state.sel && state.sel.type === 'door' && state.sel.id === d.id ? d : null);
    }
    for (const s of arch.sliders.values()) {
      const target = s.open ? 1 : 0;
      if (Math.abs(s.p - target) < 1e-4) continue;
      const k = 1.5 * dt;
      s.p = Math.abs(target - s.p) <= k ? target : s.p + Math.sign(target - s.p) * k;
      setSlider(s, smooth(s.p));
      if (state.sel && state.sel.type === 'slide' && state.sel.id === s.id) moved = s;
    }
    if (moved) {
      if (moved.pivot) hl.box(moved.pivot, 'sel', true);
      else hl.box(moved.leaves.map((L) => L.g), 'sel', false);
      hl.clear('hov'); hoverKey = '';
    }
  };

  // —— 界面绑定 ——
  ui.buildRoomList(
    (id) => { if (views.mode === 'walk' || views.mode === 'entering') enterRoom(id); else showRoom(id, { fly: true }); document.body.classList.remove('rooms-open'); },
    (id) => { enterRoom(id); document.body.classList.remove('rooms-open'); },
  );
  ui.buildLabels((id) => showRoom(id));
  $('statFurn').textContent = String(FURNITURE.length);

  for (const b of $('viewSeg').querySelectorAll('button')) b.addEventListener('click', () => setPlan(b.dataset.value === 'plan'));
  for (const b of $('modeSeg').querySelectorAll('button')) b.addEventListener('click', () => setMode(b.dataset.value));
  $('tglFurn').addEventListener('click', () => setFurniture(!state.furniture));
  $('tglNight').addEventListener('click', () => setNight(!state.night));
  $('tglLabels').addEventListener('click', () => setLabels(!state.labels));
  $('btnReset').addEventListener('click', () => { state.walkRoom = null; views.overview(); });
  $('walkPrev').addEventListener('click', () => stepRoom(-1));
  $('walkNext').addEventListener('click', () => stepRoom(1));
  $('walkExit').addEventListener('click', exitRoom);
  $('roomsBtn').addEventListener('click', () => document.body.classList.toggle('rooms-open'));
  $('roomsClose').addEventListener('click', () => document.body.classList.remove('rooms-open'));
  const help = $('help');
  $('helpBtn').addEventListener('click', () => { help.hidden = !help.hidden; });
  $('helpClose').addEventListener('click', () => { help.hidden = true; });

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const k = e.code;
    if (k === 'Digit1') setMode('real');
    else if (k === 'Digit2') setMode('clay');
    else if (k === 'Digit3') setMode('wire');
    else if (k === 'KeyF') setFurniture(!state.furniture);
    else if (k === 'KeyN') setNight(!state.night);
    else if (k === 'KeyP') setPlan(!isPlan());
    else if (k === 'KeyL') setLabels(!state.labels);
    else if (k === 'KeyR') { state.walkRoom = null; views.overview(); }
    else if (k === 'Escape') {
      if (!help.hidden) help.hidden = true;
      else if (views.mode === 'walk' || views.mode === 'entering') exitRoom();
      else if (state.sel) clearSel();
      else if (isPlan()) setPlan(false);
    } else return;
    if (k.startsWith('Arrow') || k === 'Space') e.preventDefault();
  });

  // 画布上下文丢失：提示刷新
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    $('loaderText').textContent = '显卡上下文丢失（可能是切到后台太久或显存不足），点击这里重新加载。';
    loader.hidden = false;
    loader.classList.add('is-error');
    loader.onclick = () => location.reload();
  });

  // —— 预编译着色器（白天 + 夜晚）后再显示 ——
  await step('预编译着色器…', 86);
  try { await renderer.compileAsync(scene, views.cam); } catch { /* 不支持并行编译时直接渲染 */ }
  setNight(false);
  applyCurrentMode();
  $('toast').hidden = true;

  // —— 主循环 ——
  let prev = performance.now(), acc = 0, frames = 0;
  const syncWalk = () => {
    if (views.mode === state.lastViewMode) return;
    state.lastViewMode = views.mode;
    const inside = views.mode === 'walk' || views.mode === 'entering';
    if (!inside) state.walkRoom = null;
    $('walkbar').hidden = !inside;
    hl.setWalk(inside);
    document.body.classList.toggle('is-walk', inside);
  };
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.1, Math.max(0, (now - prev) / 1000));
    prev = now;
    views.update(dt);
    animateOpenings(dt);
    updateHover();
    syncWalk();
    ui.updateLabels(views.camera, W, H, {
      show: state.labels && views.mode !== 'walk' && views.mode !== 'entering',
      plan: isPlan(),
      selected: state.sel && state.sel.type === 'room' ? state.sel.id : null,
    });
    renderer.render(scene, views.camera);

    // 帧率自适应：卡顿时降低像素比，流畅时恢复
    acc += dt; frames++;
    if (acc > 2) {
      const avg = acc / frames;
      const next = avg > 1 / 30 ? Math.max(0.75, pr - 0.25) : avg < 1 / 55 ? Math.min(prMax, pr + 0.25) : pr;
      if (next !== pr) { pr = next; renderer.setPixelRatio(pr); renderer.setSize(W, H, false); }
      acc = 0; frames = 0;
    }
  });

  await step('完成', 100);
  loader.classList.add('is-done');
  setTimeout(() => { loader.hidden = true; }, 450);

  // 调试 / 自动化验证用
  window.home3d = { pick, scene, views, lib, state, setMode, setNight, setFurniture, setPlan, enterRoom, exitRoom, showRoom, showFurn, showDoor, renderer, WALL_H };
}

boot().catch((err) => {
  console.error(err);
  const t = document.getElementById('loaderText');
  if (t) t.textContent = `加载失败：${err.message}`;
  document.getElementById('loader')?.classList.add('is-error');
});
