// 入口：场景、相机、昼夜、三种模型样式、平面图、拾取讲解、单独查看与漫游
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ROOMS, ROOM, roomArea, roomBounds, roomAt } from './plan.js';
import { buildArchitecture, obstacles as wallObstacles, wallPoche, setPocheTheme, wallCaps, CAP } from './architecture.js';
import { buildFurniture, ITEMS, furnitureObstacles } from './furniture.js';
import { materialFor, setGlow, setLineStyle, planes, clipOf } from './materials.js';
import { buildEdges } from './kit.js';
import { PlanOverlay, RoomTags, buildMiniMap } from './overlay.js';
import { Walker } from './walk.js';

const $ = (s) => document.querySelector(s);
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = THREE.MathUtils.lerp;
const C = (c) => new THREE.Color(c);

const CENTER = new THREE.Vector3(6.6, 0.3, 4.55);
const HOME_POS = new THREE.Vector3(13.4, 16.2, 15.6);
const CUT_H = 1.2;
const SEE_THROUGH = new Set(['glass', 'frosted', 'sheer', 'water']);

const state = {
  mode: 'real', night: false, nightF: 0, furniture: true, labels: true, cut: false,
  plan: false, prevMode: 'real', iso: null, sel: null, walking: false, edges: false,
};

let renderer, scene, persp, ortho, controls, composer, renderPass, bloom;
let model, arch, furn, poche, caps, sky, ground, hemi, sun;
let tags, planOverlay, walker, setMiniMap;
const roomLights = [];
const roomHi = new Map();
let hoverBr, selBr, tween = null, nightTween = null;
let W = 1, H = 1;
const plan = { cx: 6.6, cz: 4.55, half: 7 };
const cutPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), CUT_H);
const isoPlanes = [new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane()];

function setProgress(p, text) {
  $('#loadBar').style.transform = `scaleX(${p})`;
  if (text) $('#loadText').textContent = text;
}

// ———————————————————— 场景搭建 ————————————————————
async function init() {
  const canvas = $('#gl');
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    $('#loadText').textContent = '当前浏览器无法启用 WebGL，请换用新版 Chrome、Edge、Safari 或 Firefox 打开。';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.localClippingEnabled = true;

  scene = new THREE.Scene();
  persp = new THREE.PerspectiveCamera(42, 1, 0.05, 400);
  persp.position.copy(HOME_POS);
  ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
  ortho.up.set(0, 0, -1);

  setProgress(0.12, '生成材质与灯光');
  await nextFrame();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // 天空球与地面光晕
  sky = new THREE.Mesh(new THREE.SphereGeometry(160, 32, 16), new THREE.ShaderMaterial({
    uniforms: { top: { value: C('#c9d8e8') }, bottom: { value: C('#F4F7FB') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float t = smoothstep(-0.05, 0.55, vP.y); gl_FragColor = vec4(mix(bottom, top, t), 1.0);\n#include <colorspace_fragment>\n}',
    side: THREE.BackSide, depthWrite: false, toneMapped: false,
  }));
  sky.position.copy(CENTER);
  sky.renderOrder = -10;
  scene.add(sky);

  const gc = document.createElement('canvas');
  gc.width = gc.height = 256;
  const gx = gc.getContext('2d');
  const grad = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(0.55, 'rgba(255,255,255,0.65)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
  gx.fillStyle = grad; gx.fillRect(0, 0, 256, 256);
  const gt = new THREE.CanvasTexture(gc);
  ground = new THREE.Mesh(new THREE.CircleGeometry(24, 64), new THREE.MeshBasicMaterial({ map: gt, color: '#dfe7f0', transparent: true, depthWrite: false, toneMapped: false }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(CENTER.x, -0.26, CENTER.z);
  ground.raycast = () => {};
  scene.add(ground);

  hemi = new THREE.HemisphereLight('#eef3f8', '#b9a993', 0.75);
  scene.add(hemi);
  sun = new THREE.DirectionalLight('#fff2df', 2.6);
  sun.position.set(CENTER.x - 6, 14, CENTER.z + 9);
  sun.target.position.copy(CENTER);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -10.5, right: 10.5, top: 10.5, bottom: -10.5, near: 2, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);

  setProgress(0.3, '按图纸搭建墙柱与门窗');
  await nextFrame();
  model = new THREE.Group();
  model.name = 'model';
  scene.add(model);
  arch = buildArchitecture(model);
  poche = wallPoche();
  poche.visible = false;
  scene.add(poche);
  caps = wallCaps();
  caps.cut.visible = false;
  scene.add(caps.top, caps.cut);

  setProgress(0.55, '布置家具与软装');
  await nextFrame();
  furn = buildFurniture(model);

  // 夜间室内光源（暖白 2700K）
  for (const room of ROOMS) {
    for (const [x, z, y, I] of room.light) {
      const L = new THREE.PointLight('#ffc78a', 0, 9, 2);
      L.position.set(x / 1000, y / 1000, z / 1000);
      L.userData.base = I * 0.75;
      L.userData.room = room.id;
      roomLights.push(L);
      scene.add(L);
    }
  }

  // 拾取高亮
  hoverBr = brackets('#6C9AC4');
  selBr = brackets('#376392');
  scene.add(hoverBr, selBr);

  // 后期：夜间辉光
  const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
  composer = new EffectComposer(renderer, rt);
  renderPass = new RenderPass(scene, persp);
  bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0, 0.5, 0.86);
  composer.addPass(renderPass);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  controls = new OrbitControls(persp, canvas);
  controls.target.copy(CENTER);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = 1.48;
  controls.minDistance = 1.2;
  controls.maxDistance = 42;
  controls.screenSpacePanning = true;
  controls.update();

  walker = new Walker(persp, canvas);
  walker.bindPad($('#pad'));
  setMiniMap = buildMiniMap($('#miniMap'));
  planOverlay = new PlanOverlay($('#planSvg'));
  tags = new RoomTags($('#tags'), (id) => selectRoom(ROOM[id], true));

  setProgress(0.8, '编译着色器');
  await nextFrame();
  resize();
  applyNight(0);
  setLineStyle('real', false);
  try { await renderer.compileAsync(scene, persp); } catch (e) { renderer.compile(scene, persp); }

  buildUI();
  bindPointer(canvas);
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe($('#app'));
  setProgress(1, '完成');
  $('#loader').classList.add('is-done');
  setTimeout(() => { $('#loader').hidden = true; }, 700);
  requestAnimationFrame(loop);
}

// 选中框：只画八个角的短线，像图纸上的定位角标
function brackets(color) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(48 * 3), 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true }));
  m.renderOrder = 20;
  m.visible = false;
  m.raycast = () => {};
  return m;
}

function setBrackets(br, box) {
  if (!box) { br.visible = false; return; }
  const p = br.geometry.attributes.position;
  const { min, max } = box;
  const s = new THREE.Vector3().subVectors(max, min).multiplyScalar(0.22);
  let i = 0;
  for (const x of [min.x, max.x]) for (const y of [min.y, max.y]) for (const z of [min.z, max.z]) {
    const dx = x === min.x ? s.x : -s.x, dy = y === min.y ? s.y : -s.y, dz = z === min.z ? s.z : -s.z;
    for (const [ax, ay, az] of [[dx, 0, 0], [0, dy, 0], [0, 0, dz]]) {
      p.setXYZ(i++, x, y, z);
      p.setXYZ(i++, x + ax, y + ay, z + az);
    }
  }
  p.needsUpdate = true;
  br.geometry.computeBoundingSphere();
  br.visible = true;
}

function itemBox(o) {
  const b = new THREE.Box3();
  o.traverse((c) => { if (c.isMesh) { c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld)); } });
  return b.expandByScalar(0.03);
}

function roomHighlight(room) {
  if (roomHi.has(room.id)) return roomHi.get(room.id);
  const g = new THREE.Group();
  const fill = new THREE.MeshBasicMaterial({ color: '#376392', transparent: true, opacity: 0.16, depthWrite: false, toneMapped: false });
  const line = new THREE.LineBasicMaterial({ color: '#376392', transparent: true, opacity: 0.9 });
  for (const [x0, z0, x1, z1] of room.rects) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0) / 1000, (z1 - z0) / 1000), fill);
    m.rotation.x = -Math.PI / 2;
    m.position.set((x0 + x1) / 2000, 0.006, (z0 + z1) / 2000);
    m.raycast = () => {};
    g.add(m);
    const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]].map(([x, z]) => new THREE.Vector3(x / 1000, 0.008, z / 1000));
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), line);
    l.raycast = () => {};
    g.add(l);
  }
  g.visible = false;
  g.renderOrder = 5;
  scene.add(g);
  roomHi.set(room.id, g);
  return g;
}

// ———————————————————— 尺寸与相机 ————————————————————
function resize() {
  const app = $('#app');
  W = Math.max(1, app.clientWidth);
  H = Math.max(1, app.clientHeight);
  renderer.setSize(W, H, false);
  composer.setSize(W, H);
  bloom.setSize(W, H);
  persp.aspect = W / H;
  persp.updateProjectionMatrix();
  updateOrtho();
  const svg = $('#planSvg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
}

function updateOrtho() {
  const hh = plan.half, hw = hh * (W / H);
  Object.assign(ortho, { left: -hw, right: hw, top: hh, bottom: -hh });
  ortho.position.set(plan.cx, 40, plan.cz);
  ortho.lookAt(plan.cx, 0, plan.cz);
  ortho.updateProjectionMatrix();
}

// 让图形落在面板之外的可用区域里（左：房间列表，右：讲解卡片，上：工具栏）
function planInsets() {
  const wide = W > 900;
  const vis = (s) => { const e = $(s); return e && !e.hidden && getComputedStyle(e).display !== 'none'; };
  // 窄屏时面板是底部抽屉，图形放在抽屉上方
  let b = 56;
  if (!wide) for (const s of ['#info', '#rooms']) if (vis(s)) b = Math.max(b, H - $(s).getBoundingClientRect().top + 8);
  return {
    l: wide && vis('#rooms') ? $('#rooms').getBoundingClientRect().right + 8 : 8,
    r: wide && vis('#info') ? W - $('#info').getBoundingClientRect().left + 8 : 8,
    t: $('.bar').getBoundingClientRect().bottom + 6,
    b,
  };
}

function fitPlan(x0, z0, x1, z1, pad = 1.04) {
  const ins = planInsets();
  const aw = Math.max(80, W - ins.l - ins.r), ah = Math.max(80, H - ins.t - ins.b);
  // 每像素对应的米数
  const k = Math.max((x1 - x0) / aw, (z1 - z0) / ah) * pad;
  plan.half = (H / 2) * k;
  // 可用区域中心对应的屏幕偏移
  const offX = (ins.l - ins.r) / 2, offY = (ins.t - ins.b) / 2;
  plan.cx = (x0 + x1) / 2 - offX * k;
  plan.cz = (z0 + z1) / 2 - offY * k;
  updateOrtho();
}

const cam = () => (state.plan ? ortho : persp);

function flyTo(pos, target, dur = 0.95) {
  tween = { t: 0, dur, p0: persp.position.clone(), q0: controls.target.clone(), p1: pos.clone(), q1: target.clone() };
}

function roomView(room) {
  const b = roomBounds(room);
  const c = new THREE.Vector3(b.cx / 1000, 0.4, b.cz / 1000);
  const size = Math.max(b.w, b.d) / 1000;
  const sph = new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(persp.position, controls.target));
  sph.radius = size * 1.25 + 3.4;
  // 房间越窄越要俯视，否则 2.8 m 高的墙会挡住室内
  sph.phi = size < 3.5 ? 0.32 : size < 4.5 ? 0.45 : 0.6;
  return { pos: c.clone().add(new THREE.Vector3().setFromSpherical(sph)), target: c };
}

function focusRoom(room) {
  if (state.walking) return;
  if (state.plan) {
    const b = roomBounds(room);
    fitPlan(b.x0 / 1000 - 0.6, b.z0 / 1000 - 0.6, b.x1 / 1000 + 0.6, b.z1 / 1000 + 0.6);
    return;
  }
  const v = roomView(room);
  flyTo(v.pos, v.target);
}

function focusItem(item) {
  if (state.walking) return;
  const box = itemBox(item);
  const c = box.getCenter(new THREE.Vector3());
  const s = box.getSize(new THREE.Vector3());
  if (state.plan) {
    fitPlan(box.min.x - 1, box.min.z - 1, box.max.x + 1, box.max.z + 1);
    return;
  }
  const sph = new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(persp.position, controls.target));
  sph.radius = Math.max(s.x, s.y, s.z) * 1.6 + 1.8;
  sph.phi = 0.95;
  flyTo(c.clone().add(new THREE.Vector3().setFromSpherical(sph)), c);
}

function resetView() {
  if (state.walking) exitWalk();
  if (state.plan) { fitPlan(-3.0, -3.1, 16.5, 12.0); return; }
  flyTo(HOME_POS, CENTER);
}

// ———————————————————— 模式：真实 / 白模 / 线框 ————————————————————
function ensureEdges() {
  if (state.edges) return;
  buildEdges(model);
  state.edges = true;
}

function setMode(mode) {
  state.mode = mode;
  if (mode !== 'real') ensureEdges();
  model.traverse((o) => {
    if (o.isMesh && o.userData.matKey) {
      o.material = materialFor(mode, o.userData.matKey);
      if (o.userData.castDefault === undefined) o.userData.castDefault = o.castShadow;
      o.castShadow = mode !== 'wire' && o.userData.castDefault;
    } else if (o.userData.isEdge) o.visible = mode !== 'real';
  });
  setLineStyle(mode, state.night);
  updateCaps();
  sun.castShadow = mode !== 'wire';
  ground.visible = mode !== 'wire' && !state.plan;
  poche.visible = state.plan && mode === 'wire';
  updateBackground();
  for (const b of document.querySelectorAll('[data-mode]')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
}

// ———————————————————— 昼夜 ————————————————————
function updateBackground() {
  const f = state.nightF;
  const flat = state.mode === 'wire' || state.plan;
  const top = flat ? ['#F4F7FB', '#142030'] : ['#c4d5e7', '#0a1220'];
  const bot = flat ? ['#F4F7FB', '#142030'] : ['#F4F7FB', '#1c2b3e'];
  sky.material.uniforms.top.value.lerpColors(C(top[0]), C(top[1]), f);
  sky.material.uniforms.bottom.value.lerpColors(C(bot[0]), C(bot[1]), f);
  ground.material.color.lerpColors(C('#dfe7f0'), C('#24364c'), f);
  ground.material.opacity = lerp(1, 0.6, f);
}

function applyNight(f) {
  state.nightF = f;
  hemi.intensity = lerp(0.75, 0.06, f);
  hemi.color.lerpColors(C('#eef3f8'), C('#6C9AC4'), f);
  sun.intensity = lerp(2.6, 0.18, f);
  sun.color.lerpColors(C('#fff2df'), C('#9FBDDA'), f);
  scene.environmentIntensity = lerp(0.5, 0.07, f);
  for (const L of roomLights) L.intensity = L.userData.base * f;
  setGlow(f);
  renderer.toneMappingExposure = lerp(0.92, 1.15, f);
  bloom.strength = 0.42 * f;
  updateBackground();
}

function setNight(on) {
  state.night = on;
  nightTween = { from: state.nightF, to: on ? 1 : 0, t: 0 };
  document.documentElement.dataset.mode = on ? 'night' : 'day';
  setLineStyle(state.mode, on);
  setPocheTheme(on);
  $('#btnNight').setAttribute('aria-pressed', String(on));
  $('#btnNight .lbl').textContent = on ? '夜景' : '日景';
  toast(on ? '夜晚：室内灯光已自动开启' : '白天：阳光从南向窗户照入');
}

// ———————————————————— 剖切：单独查看 / 半高墙 ————————————————————
function updateClipping() {
  planes.model.length = 0;
  planes.arch.length = 0;
  if (state.iso) {
    const b = roomBounds(state.iso), m = 160;
    isoPlanes[0].set(new THREE.Vector3(1, 0, 0), -(b.x0 - m) / 1000);
    isoPlanes[1].set(new THREE.Vector3(-1, 0, 0), (b.x1 + m) / 1000);
    isoPlanes[2].set(new THREE.Vector3(0, 0, 1), -(b.z0 - m) / 1000);
    isoPlanes[3].set(new THREE.Vector3(0, 0, -1), (b.z1 + m) / 1000);
    planes.model.push(...isoPlanes);
    planes.arch.push(...isoPlanes);
  }
  if (state.cut && !state.walking) planes.arch.push(cutPlane);
  for (const L of roomLights) L.visible = !state.iso || L.userData.room === state.iso.id;
}

function setIso(room) {
  state.iso = room;
  updateClipping();
  $('#isoBar').hidden = !room;
  if (room) {
    $('#isoName').textContent = room.name;
    focusRoom(room);
  }
  renderInfo();
}

function updateCaps() {
  const show = state.mode !== 'wire';
  const cut = state.cut && !state.walking;
  caps.top.visible = show && !cut;
  caps.cut.visible = show && cut;
  CAP.color.set(state.mode === 'white' ? '#c3cad3' : '#4a4744');
}

function setCut(on) {
  state.cut = on;
  updateClipping();
  updateCaps();
  $('#btnCut').setAttribute('aria-pressed', String(on));
}

function isHidden(hit) {
  const p = hit.point;
  if (state.iso) {
    const b = roomBounds(state.iso), m = 0.16;
    if (p.x < b.x0 / 1000 - m || p.x > b.x1 / 1000 + m || p.z < b.z0 / 1000 - m || p.z > b.z1 / 1000 + m) return true;
  }
  const key = hit.object.userData.matKey;
  if (key && SEE_THROUGH.has(key)) return true;
  if (state.cut && !state.walking && key && clipOf(key) === 'arch' && p.y > CUT_H) return true;
  return false;
}

// ———————————————————— 平面图 ————————————————————
function setPlan(on) {
  if (on === state.plan) return;
  if (on && state.walking) exitWalk();
  state.plan = on;
  if (on) {
    state.prevMode = state.mode;
    setMode('wire');
    fitPlan(-3.0, -3.1, 16.5, 12.0);
    controls.enabled = false;
  } else {
    if (state.mode === 'wire') setMode(state.prevMode);
    controls.enabled = true;
  }
  renderPass.camera = cam();
  updateClipping();
  poche.visible = on && state.mode === 'wire';
  ground.visible = !on && state.mode !== 'wire';
  updateBackground();
  document.documentElement.classList.toggle('is-plan', on);
  $('#btnPlan').setAttribute('aria-pressed', String(on));
  $('#btnPlan .lbl').textContent = on ? '三维' : '平面图';
  toast(on ? '平面图：默认线框显示，标注单位 mm' : '已返回三维视图');
}

// ———————————————————— 漫游 ————————————————————
let savedView = null;
function walkObstacles() {
  const list = [...wallObstacles, ...furnitureObstacles];
  if (state.furniture) {
    for (const it of ITEMS) {
      if (it.userData.noBlock) continue;
      const b = itemBox(it);
      if (b.min.y < 0.45 && b.max.y > 0.3) list.push([b.min.x + 0.06, b.min.z + 0.06, b.max.x - 0.06, b.max.z - 0.06]);
    }
  }
  return list;
}

function enterWalk(room) {
  if (state.plan) setPlan(false);
  if (state.iso) setIso(null);
  savedView = { pos: persp.position.clone(), target: controls.target.clone() };
  tween = null;
  clearSelection();
  state.walking = true;
  controls.enabled = false;
  updateClipping();
  updateCaps();
  walker.setObstacles(walkObstacles());
  const [x, z, h] = room.spawn;
  walker.enter(x / 1000, z / 1000, h);
  document.documentElement.classList.add('is-walking');
  $('#walkHud').hidden = false;
  toast(`进入${room.name}：拖动环视，WASD / 方向键行走，点击地面走过去`);
}

function exitWalk() {
  if (!state.walking) return;
  walker.exit();
  state.walking = false;
  controls.enabled = true;
  if (savedView) { persp.position.copy(savedView.pos); controls.target.copy(savedView.target); }
  persp.up.set(0, 1, 0);
  persp.lookAt(controls.target);
  controls.update();
  updateClipping();
  updateCaps();
  document.documentElement.classList.remove('is-walking');
  $('#walkHud').hidden = true;
}

// ———————————————————— 拾取 ————————————————————
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, cam());
  const targets = [arch.floors, arch.walls, arch.finishes, arch.windows, arch.curtains, ...arch.doors];
  if (state.furniture) targets.push(furn);
  const hits = ray.intersectObjects(targets, true);
  for (const h of hits) {
    if (isHidden(h)) continue;
    let o = h.object;
    while (o && !o.userData.type) o = o.parent;
    if (!o) continue;
    // 家具组由合并网格组成，向上找到登记的家具根
    let f = h.object;
    while (f && f.userData.type !== 'furniture' && f.userData.type !== 'door') f = f.parent;
    if (f) return { kind: f.userData.type, obj: f, point: h.point };
    const t = o.userData.type;
    if (t === 'room') return { kind: 'room', room: ROOM[o.userData.room], point: h.point };
    if (t === 'window' || t === 'curtain') return { kind: 'room', room: ROOM[o.userData.room], point: h.point };
    return { kind: 'wall', point: h.point };
  }
  return null;
}

function bindPointer(canvas) {
  let down = null;
  const pointers = new Map();
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (state.plan) canvas.setPointerCapture(e.pointerId);
    if (tween && !state.plan) tween = null;
  });
  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (state.plan && prev) {
      if (pointers.size === 1) {
        const k = (2 * plan.half) / H;
        plan.cx -= (e.clientX - prev.x) * k;
        plan.cz -= (e.clientY - prev.y) * k;
        updateOrtho();
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const before = Math.hypot(a.x - b.x, a.y - b.y);
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const [c, d] = [...pointers.values()];
        const after = Math.hypot(c.x - d.x, c.y - d.y);
        if (before > 0 && after > 0) zoomPlan(before / after, (c.x + d.x) / 2, (c.y + d.y) / 2);
      }
    }
    if (prev) pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    hoverAt = { x: e.clientX, y: e.clientY };
  });
  const up = (e) => {
    pointers.delete(e.pointerId);
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 450;
    down = null;
    if (moved < 6 && quick && e.type === 'pointerup') onClick(e.clientX, e.clientY);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { hoverAt = null; setBrackets(hoverBr, null); canvas.style.cursor = ''; });
  canvas.addEventListener('wheel', (e) => {
    if (!state.plan) return;
    e.preventDefault();
    zoomPlan(Math.exp(e.deltaY * 0.0012), e.clientX, e.clientY);
  }, { passive: false });
}

function zoomPlan(factor, sx, sy) {
  const r = renderer.domElement.getBoundingClientRect();
  const u = (sx - r.left) / r.width - 0.5, w = (sy - r.top) / r.height - 0.5;
  const hw = plan.half * (W / H);
  const wx = plan.cx + u * 2 * hw, wz = plan.cz + w * 2 * plan.half;
  plan.half = THREE.MathUtils.clamp(plan.half * factor, 0.8, 16);
  const hw2 = plan.half * (W / H);
  plan.cx = wx - u * 2 * hw2;
  plan.cz = wz - w * 2 * plan.half;
  updateOrtho();
}

let hoverAt = null;
function updateHover() {
  if (!hoverAt) return;
  const h = pick(hoverAt.x, hoverAt.y);
  hoverAt = null;
  const canvas = renderer.domElement;
  if (h && (h.kind === 'furniture' || h.kind === 'door')) {
    if (state.sel !== h.obj) setBrackets(hoverBr, itemBox(h.obj)); else setBrackets(hoverBr, null);
    canvas.style.cursor = 'pointer';
  } else {
    setBrackets(hoverBr, null);
    canvas.style.cursor = h && h.kind === 'room' ? (state.walking ? 'crosshair' : 'pointer') : '';
  }
}

function onClick(x, y) {
  const h = pick(x, y);
  if (!h) { if (!state.walking) clearSelection(); return; }
  if (h.kind === 'furniture') selectItem(h.obj);
  else if (h.kind === 'door') toggleDoor(h.obj);
  else if (h.kind === 'room') {
    if (state.walking) walker.walkTo(h.point.x, h.point.z);
    else selectRoom(h.room, false);
  }
}

function toggleDoor(d) {
  d.userData.target = d.userData.target > 0.5 ? 0 : 1;
  state.sel = d;
  state.selRoom = null;
  setBrackets(selBr, itemBox(d));
  renderInfo();
}

// ———————————————————— 选择与讲解 ————————————————————
function clearSelection() {
  state.sel = null;
  state.selRoom = null;
  setBrackets(selBr, null);
  for (const g of roomHi.values()) g.visible = false;
  tags.setActive(null);
  markRoomList(null);
  renderInfo();
}

function selectRoom(room, fly) {
  state.sel = null;
  state.selRoom = room;
  setBrackets(selBr, null);
  for (const [id, g] of roomHi) g.visible = id === room.id;
  roomHighlight(room).visible = true;
  tags.setActive(room.id);
  markRoomList(room.id);
  renderInfo();
  if (fly) focusRoom(room);
}

function selectItem(item) {
  state.sel = item;
  state.selRoom = ROOM[item.userData.room] || null;
  for (const g of roomHi.values()) g.visible = false;
  setBrackets(selBr, itemBox(item));
  setBrackets(hoverBr, null);
  tags.setActive(item.userData.room);
  markRoomList(item.userData.room);
  renderInfo();
}

function markRoomList(id) {
  for (const li of document.querySelectorAll('#roomList button')) li.setAttribute('aria-current', String(li.dataset.room === id));
}

const fmtArea = (a) => a.toFixed(1);

function renderInfo() {
  const panel = $('#info');
  const sel = state.sel, room = state.selRoom;
  if (!sel && !room) { panel.hidden = true; return; }
  panel.hidden = false;
  let html = '';
  if (sel && sel.userData.type === 'door') {
    const d = sel.userData;
    html = `
      <p class="eyebrow">门 · ${d.sliding ? '推拉' : '平开'}</p>
      <h2>${d.name}</h2>
      <dl class="facts"><div><dt>洞口</dt><dd>${d.width} × ${d.height}</dd></div><div><dt>状态</dt><dd>${d.target > 0.5 ? '开启' : '关闭'}</dd></div></dl>
      <p class="note">${d.sliding ? '深古铜细框推拉门，超白玻璃，轨道嵌入地面。' : '胡桃木饰面门扇，深古铜门套，香槟金执手。'}点击门可以开关。</p>
      <div class="actions"><button type="button" class="btn" data-act="door">${d.target > 0.5 ? '关门' : '开门'}</button></div>`;
  } else if (sel) {
    const u = sel.userData, r = ROOM[u.room];
    html = `
      <p class="eyebrow">家具 · <button type="button" class="link" data-act="room">${r ? r.name : ''}</button></p>
      <h2>${u.name}</h2>
      <dl class="facts"><div><dt>尺寸</dt><dd>${u.size}</dd></div><div><dt>材质</dt><dd>${u.mat}</dd></div></dl>
      ${u.note ? `<p class="note">${u.note}</p>` : ''}
      <div class="actions"><button type="button" class="btn" data-act="focusItem">聚焦此件</button>${r ? `<button type="button" class="btn btn--ghost" data-act="room">返回房间</button>` : ''}</div>`;
  } else {
    const items = ITEMS.filter((i) => i.userData.room === room.id);
    const seen = new Set();
    const chips = items.filter((i) => (seen.has(i.userData.name) ? false : seen.add(i.userData.name)))
      .map((i) => `<button type="button" class="chip" data-item="${i.userData.id}">${i.userData.name}</button>`).join('');
    html = `
      <p class="eyebrow">房间 · ${room.en}</p>
      <h2>${room.name}</h2>
      <dl class="facts">
        <div><dt>面积</dt><dd>${fmtArea(roomArea(room))} m²</dd></div>
        <div><dt>尺寸</dt><dd>${room.dims}</dd></div>
        <div><dt>朝向</dt><dd>${room.facing}</dd></div>
      </dl>
      <p class="note">${room.intro}</p>
      <ul class="points">${room.points.map((p) => `<li>${p}</li>`).join('')}</ul>
      ${chips ? `<p class="sub">家具与软装</p><div class="chips">${chips}</div>` : ''}
      <div class="actions">
        <button type="button" class="btn" data-act="walk">进入漫游</button>
        <button type="button" class="btn btn--ghost" data-act="iso" aria-pressed="${state.iso === room}">${state.iso === room ? '显示全屋' : '单独查看'}</button>
        <button type="button" class="btn btn--ghost" data-act="focus">聚焦</button>
      </div>`;
  }
  $('#infoBody').innerHTML = html;
}

// ———————————————————— 界面 ————————————————————
function buildUI() {
  const total = ROOMS.reduce((s, r) => s + roomArea(r), 0);
  $('#totalArea').textContent = total.toFixed(1);
  const list = $('#roomList');
  for (const room of ROOMS) {
    const li = document.createElement('li');
    li.innerHTML = `<button type="button" data-room="${room.id}"><span class="rl-name">${room.name}</span><span class="rl-en">${room.en}</span><span class="rl-area">${fmtArea(roomArea(room))}<small>m²</small></span></button>`;
    li.firstChild.addEventListener('click', () => {
      // 窄屏：房间列表是抽屉，选完就收起，让出讲解卡片
      if (W <= 900) { $('#rooms').classList.remove('is-open'); $('#roomsToggle').setAttribute('aria-expanded', 'false'); }
      selectRoom(room, true);
    });
    list.appendChild(li);
  }
  for (const b of document.querySelectorAll('[data-mode]')) b.addEventListener('click', () => setMode(b.dataset.mode));
  $('#btnPlan').addEventListener('click', () => setPlan(!state.plan));
  $('#btnNight').addEventListener('click', () => setNight(!state.night));
  $('#btnFurn').addEventListener('click', () => setFurniture(!state.furniture));
  $('#btnCut').addEventListener('click', () => setCut(!state.cut));
  $('#btnLabels').addEventListener('click', () => setLabels(!state.labels));
  $('#btnReset').addEventListener('click', resetView);
  $('#infoClose').addEventListener('click', clearSelection);
  $('#isoExit').addEventListener('click', () => setIso(null));
  $('#walkExit').addEventListener('click', exitWalk);
  $('#roomsToggle').addEventListener('click', () => {
    const open = $('#rooms').classList.toggle('is-open');
    $('#roomsToggle').setAttribute('aria-expanded', String(open));
  });
  $('#infoBody').addEventListener('click', (e) => {
    const t = e.target.closest('[data-act],[data-item]');
    if (!t) return;
    if (t.dataset.item) {
      const it = ITEMS.find((i) => i.userData.id === t.dataset.item);
      if (it) { selectItem(it); focusItem(it); }
      return;
    }
    const act = t.dataset.act;
    const room = state.selRoom;
    if (act === 'walk' && room) enterWalk(room);
    else if (act === 'iso' && room) setIso(state.iso === room ? null : room);
    else if (act === 'focus' && room) focusRoom(room);
    else if (act === 'focusItem' && state.sel) focusItem(state.sel);
    else if (act === 'room' && room) selectRoom(room, true);
    else if (act === 'door' && state.sel) toggleDoor(state.sel);
  });
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'Escape') {
      if (state.walking) exitWalk();
      else if (state.iso) setIso(null);
      else clearSelection();
      return;
    }
    if (state.walking || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === '1') setMode('real');
    else if (k === '2') setMode('white');
    else if (k === '3') setMode('wire');
    else if (k === 'p') setPlan(!state.plan);
    else if (k === 'n') setNight(!state.night);
    else if (k === 'f') setFurniture(!state.furniture);
    else if (k === 'c') setCut(!state.cut);
    else if (k === 'l') setLabels(!state.labels);
    else if (k === 'r') resetView();
  });
}

function setFurniture(on) {
  state.furniture = on;
  furn.visible = on;
  if (!on && state.sel && state.sel.userData.type === 'furniture') clearSelection();
  $('#btnFurn').setAttribute('aria-pressed', String(on));
  toast(on ? '已显示家具' : '已隐藏家具，只看空间结构');
}

function setLabels(on) {
  state.labels = on;
  $('#btnLabels').setAttribute('aria-pressed', String(on));
}

let toastTimer = 0;
function toast(text) {
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('is-on'), 2600);
}

// ———————————————————— 主循环 ————————————————————
const timer = new THREE.Timer();
const fwd = new THREE.Vector3();
function loop() {
  requestAnimationFrame(loop);
  timer.update();
  const raw = timer.getDelta();
  // 动画用真实时间（慢设备也按时完成）；移动步长再做上限，避免卡顿时穿墙
  const dt = Math.min(raw, 0.1), adt = Math.min(raw, 0.5);

  if (tween) {
    tween.t += adt;
    const k = ease(Math.min(1, tween.t / tween.dur));
    persp.position.lerpVectors(tween.p0, tween.p1, k);
    controls.target.lerpVectors(tween.q0, tween.q1, k);
    if (k >= 1) tween = null;
  }
  if (nightTween) {
    nightTween.t += adt / 1.2;
    const k = ease(Math.min(1, nightTween.t));
    applyNight(lerp(nightTween.from, nightTween.to, k));
    if (nightTween.t >= 1) nightTween = null;
  }
  for (const d of arch.doors) {
    const u = d.userData;
    if (Math.abs(u.t - u.target) > 1e-3) {
      u.t += Math.sign(u.target - u.t) * Math.min(Math.abs(u.target - u.t), adt * 1.6);
      u.apply(u.t);
      if (state.sel === d) setBrackets(selBr, itemBox(d));
    }
  }
  if (state.walking) {
    walker.update(dt);
    setMiniMap(walker.pos.x, walker.pos.z, walker.heading());
    const r = roomAt(walker.pos.x * 1000, walker.pos.z * 1000);
    $('#walkRoom').textContent = r ? r.name : '—';
  } else if (!state.plan) controls.update();

  updateHover();

  const c = cam();
  tags.update(c, W, H, { plan: state.plan, visible: state.labels && !state.walking, hide: (id) => state.iso && state.iso.id !== id });
  if (state.plan) planOverlay.update(ortho, W, H);
  persp.getWorldDirection(fwd);
  const north = state.plan ? 0 : (Math.atan2(-fwd.x, -fwd.z) * 180) / Math.PI;
  $('#compassNeedle').style.transform = `rotate(${north}deg)`;

  if (bloom.strength > 0.01 && state.mode !== 'wire') {
    renderPass.camera = c;
    composer.render(dt);
  } else {
    renderer.render(scene, c);
  }
}

init();
