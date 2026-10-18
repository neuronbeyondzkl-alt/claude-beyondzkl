import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  DataTexture, RGBAFormat, FloatType, NearestFilter, Vector2, Matrix4, Quaternion, Euler, Vector3,
  AdditiveBlending, SRGBColorSpace, NoToneMapping, LineSegments,
  EffectComposer, RenderPass, UnrealBloomPass, OutputPass, ShaderPass,
} from './vendor/three.bundle.min.js';
import { N, TEX_W, ROWS, SHAPES, buildAll } from './creatures.js';
import { particleVert, particleFrag, bgPassVert, bgPassFrag, snowVert, snowFrag, streakVert, streakFrag } from './shaders.js';
import { OceanAudio } from './audio.js';
import { InteractionFX } from './fx.js';
import { store, initTunePanel, autoCollapseTune, splitNeon, startNeonFlicker, initCursor, showZoneBanner, toast } from './ui.js';

// ---------------------------------------------------------------------------
// 场景表：与 creatures.js 的 SHAPES、页面中 .sec 的顺序一一对应
// span / h：生物在默认朝向下的大致横向跨度与高度（用于自适应缩放）；depth：叙事用的下潜深度（米）；yaw/pitch/roll：生物朝向；alpha：亮度补偿
// bg：[顶部颜色, 亮度系数, 底部颜色, 亮度系数]，全部取自 Loyel 色板再压暗
// rays / caus：背景光柱与水面焦散的强度（只在浅海出现）
// ---------------------------------------------------------------------------
const SCENE = [
  { span: 0, h: 0, depth: 0, yaw: 0, pitch: 0, alpha: 0.85, bg: ['#263B54', 0.09, '#2B4868', 0.85], rays: 0, caus: 0 },
  { span: 7.0, h: 4.2, depth: 10, yaw: -0.5, pitch: 0.25, alpha: 0.72, bg: ['#376392', 0.61, '#263B54', 0.32], rays: 1, caus: 1 },
  { span: 6.0, h: 3.2, depth: 18, yaw: 0.3, pitch: 1.0, alpha: 0.5, bg: ['#376392', 0.58, '#263B54', 0.3], rays: 0.9, caus: 0.9 },
  { span: 3.2, h: 5.6, depth: 25, yaw: Math.PI + 0.35, pitch: 0.05, alpha: 0.48, bg: ['#376392', 0.54, '#263B54', 0.28], rays: 0.85, caus: 0.85 },
  { span: 6.6, h: 2.8, depth: 30, yaw: -0.35, pitch: 0.75, alpha: 0.62, bg: ['#2E5076', 0.58, '#263B54', 0.26], rays: 0.75, caus: 0.75 },
  { span: 6.0, h: 2.8, depth: 60, yaw: Math.PI + 0.4, pitch: 0.6, alpha: 0.55, bg: ['#2E5076', 0.52, '#263B54', 0.23], rays: 0.65, caus: 0.6 },
  { span: 7.2, h: 3.2, depth: 120, yaw: -0.9, pitch: 0.55, roll: -0.15, alpha: 0.6, bg: ['#2E5076', 0.43, '#263B54', 0.19], rays: 0.5, caus: 0.4 },
  { span: 6.9, h: 3.4, depth: 180, yaw: Math.PI + 0.3, pitch: 0.12, alpha: 0.6, bg: ['#2B4868', 0.36, '#263B54', 0.15], rays: 0.35, caus: 0.2 },
  { span: 7.8, h: 2.8, depth: 300, yaw: -0.45, pitch: 0.15, alpha: 0.62, bg: ['#2B4868', 0.29, '#263B54', 0.11], rays: 0.2, caus: 0.05 },
  { span: 4.8, h: 6.5, depth: 550, yaw: 0, pitch: 0.12, alpha: 0.85, bg: ['#263B54', 0.2, '#263B54', 0.07], rays: 0.05, caus: 0 },
  { span: 7.8, h: 4.4, depth: 800, yaw: -0.25, pitch: 0.05, alpha: 0.42, bg: ['#263B54', 0.12, '#263B54', 0.05], rays: 0, caus: 0 },
  { span: 6.4, h: 3.8, depth: 2000, yaw: Math.PI + 0.45, pitch: 0.1, alpha: 0.95, bg: ['#263B54', 0.06, '#263B54', 0.03], rays: 0, caus: 0 },
  { span: 7.2, h: 3.0, depth: 4000, yaw: 0, pitch: 0.42, alpha: 0.26, bg: ['#263B54', 0.04, '#263B54', 0.02], rays: 0, caus: 0 },
];

const ZONES = [
  { max: 200, name: '透光层', en: 'EPIPELAGIC' },
  { max: 1000, name: '弱光层', en: 'MESOPELAGIC' },
  { max: 4000, name: '无光层', en: 'BATHYPELAGIC' },
  { max: Infinity, name: '深渊层', en: 'ABYSSOPELAGIC' },
];
const zoneOf = (d) => ZONES.findIndex((z) => d < z.max);

const $ = (s) => document.querySelector(s);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hexLin = (h, k = 1) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = (v / 255) * k;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
};
const BG = SCENE.map((s) => ({ top: hexLin(s.bg[0], s.bg[1]), bot: hexLin(s.bg[2], s.bg[3]) }));

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

// ---------------------------------------------------------------------------
// 界面
// ---------------------------------------------------------------------------
const sections = [...document.querySelectorAll('.sec')];
const loader = $('#loader'), loadBar = $('#loadBar'), loadText = $('#loadText');
const soundBtn = $('#sound');
const depthVal = $('#depthVal'), depthZone = $('#depthZone'), depthFill = $('#depthFill');
const secIdx = $('#secIdx'), secName = $('#secName'), pagerSep = $('.pager__sep');
const heroInner = $('.hero__inner');
const bignums = sections.map((s) => s.querySelector('.bignum'));

const audio = new OceanAudio();
let glow = store.get('glow', 0.65);
let titleGlow = store.get('tglow', 0.6);
let volume = store.get('vol', 0.7);
audio.setVolume(volume);

// 粒子荧光：粒子光晕、尺寸扩散、Bloom 辉光
function setGlow(g) {
  glow = g;
  document.documentElement.style.setProperty('--glow', g.toFixed(3));
  if (gl.ready) {
    gl.pMat.uniforms.uGlow.value = g;
    gl.snowMat.uniforms.uGlow.value = g;
    gl.fx.setGlow(g);
    gl.bloom.strength = 0.08 + 0.82 * g;
    gl.bloom.radius = 0.25 + 0.4 * g;
  }
}
// 标题荧光：中空英文标题外层的蓝色辉光
function setTitleGlow(g) {
  titleGlow = g;
  document.documentElement.style.setProperty('--tglow', g.toFixed(3));
}

function renderSoundState() {
  soundBtn.setAttribute('aria-pressed', String(audio.isOn));
  soundBtn.querySelector('.label').textContent = audio.isOn ? '配乐 开' : '配乐 关';
  document.body.classList.toggle('is-sound', audio.isOn);
}
soundBtn.addEventListener('click', async () => { await audio.toggle(); renderSoundState(); });
$('#start').addEventListener('click', async () => {
  await audio.start();
  renderSoundState();
  sections[1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});
$('#silent').addEventListener('click', () => sections[1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
$('#backTop').addEventListener('click', () => ascendToSurface());
document.addEventListener('visibilitychange', () => (document.hidden ? audio.pause() : audio.resume()));

initTunePanel({
  glow, titleGlow, volume,
  onGlow: (v) => { setGlow(v); store.set('glow', v); },
  onTitleGlow: (v) => { setTitleGlow(v); store.set('tglow', v); },
  onVolume: (v) => { volume = v; audio.setVolume(v); store.set('vol', v); },
});
splitNeon();
startNeonFlicker(reduceMotion);
const cursor = initCursor(reduceMotion);

// 文案进出场
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.intersectionRatio > 0.4) e.target.classList.add('is-in');
    else if (e.intersectionRatio < 0.08) e.target.classList.remove('is-in');
  });
}, { threshold: [0, 0.08, 0.4, 0.6] });
sections.forEach((s) => io.observe(s));
sections[0].classList.add('is-in');

// ---------------------------------------------------------------------------
// WebGL
// ---------------------------------------------------------------------------
const gl = { ready: false };
const canvas = $('#gl');
// 画布按“大视口”高度（100lvh）铺满：手机地址栏收起/展开时画布尺寸不变，不必重建渲染目标
const view = { w: innerWidth, h: innerHeight };
const pickDpr = () => Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);

function initGL(data) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 unavailable');
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  const dpr = pickDpr();
  view.w = canvas.clientWidth || innerWidth;
  view.h = canvas.clientHeight || innerHeight;
  renderer.setPixelRatio(dpr);
  renderer.setSize(view.w, view.h, false);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, view.w / view.h, 0.1, 100);
  camera.position.set(0, 0, 12);

  const S = SHAPES.length;
  const mkTex = (arr) => {
    const t = new DataTexture(arr, TEX_W, ROWS * S, RGBAFormat, FloatType);
    t.minFilter = t.magFilter = NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  };

  // 生物粒子
  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(new Float32Array(N * 3), 3));
  const rand = new Float32Array(N * 4);
  for (let i = 0; i < rand.length; i++) rand[i] = Math.random();
  geo.setAttribute('aRand', new BufferAttribute(rand, 4));
  const count = isMobile ? 22000 : N;
  geo.setDrawRange(0, count);
  const pMat = new ShaderMaterial({
    vertexShader: particleVert, fragmentShader: particleFrag,
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, premultipliedAlpha: true,
    uniforms: {
      uPos: { value: mkTex(data.pos) }, uCol: { value: mkTex(data.col) },
      uTexW: { value: TEX_W }, uRows: { value: ROWS },
      uShapeA: { value: 0 }, uShapeB: { value: 0 },
      uMatA: { value: new Matrix4() }, uMatB: { value: new Matrix4() },
      uMix: { value: 0 }, uTime: { value: 0 },
      uSize: { value: 2.0 }, uPixelRatio: { value: dpr },
      uGlow: { value: glow }, uSatMax: { value: 0.42 },
      uAlphaA: { value: 1 }, uAlphaB: { value: 1 },
      uScatter: { value: reduceMotion ? 0.35 : 1 },
      uAspect: { value: view.w / view.h },
      uMotion: { value: reduceMotion ? 0.35 : 1 },
      uIntro: { value: reduceMotion ? 1 : 0 },
    },
  });
  const points = new Points(geo, pMat);
  points.frustumCulled = false;
  scene.add(points);

  // 海雪
  const SN = isMobile ? 900 : 1800;
  const sg = new BufferGeometry();
  sg.setAttribute('position', new BufferAttribute(new Float32Array(SN * 3), 3));
  const seeds = new Float32Array(SN * 4);
  for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  sg.setAttribute('aSeed', new BufferAttribute(seeds, 4));
  const snowMat = new ShaderMaterial({
    vertexShader: snowVert, fragmentShader: snowFrag,
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, premultipliedAlpha: true,
    uniforms: {
      uTime: { value: 0 }, uScroll: { value: 0 }, uPixelRatio: { value: dpr }, uOpacity: { value: 0.5 },
      uGlow: { value: glow }, uColor: { value: new Vector3(...hexLin('#CCDBEB')) },
    },
  });
  const snow = new Points(sg, snowMat);
  snow.frustumCulled = false;
  scene.add(snow);

  // 高速滚动时的速度线
  const SL = isMobile ? 500 : 900;
  const lg = new BufferGeometry();
  lg.setAttribute('position', new BufferAttribute(new Float32Array(SL * 2 * 3), 3));
  const lseed = new Float32Array(SL * 2 * 4), lend = new Float32Array(SL * 2);
  for (let i = 0; i < SL; i++) {
    const r = [Math.random(), Math.random(), Math.random(), Math.random()];
    lseed.set(r, i * 8); lseed.set(r, i * 8 + 4);
    lend[i * 2 + 1] = 1;
  }
  lg.setAttribute('aSeed', new BufferAttribute(lseed, 4));
  lg.setAttribute('aEnd', new BufferAttribute(lend, 1));
  const streakMat = new ShaderMaterial({
    vertexShader: streakVert, fragmentShader: streakFrag,
    transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, premultipliedAlpha: true,
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uVel: { value: 0 }, uColor: { value: new Vector3(...hexLin('#9FBDDA')) } },
  });
  const streaks = new LineSegments(lg, streakMat);
  streaks.frustumCulled = false;
  scene.add(streaks);

  // 鼠标尾流 / 点击声呐 / 火花与气泡
  const fx = new InteractionFX({ scene, tanHalf: Math.tan((17.5 * Math.PI) / 180), pixelRatio: dpr, glow, motion: reduceMotion ? 0.3 : 1 });
  Object.assign(pMat.uniforms, {
    uTanHalfFov: { value: Math.tan((17.5 * Math.PI) / 180) },
    uTrail: { value: fx.uTrail }, uTrailVel: { value: fx.uTrailVel }, uClick: { value: fx.uClick },
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(view.w / 2, view.h / 2), 1, 0.6, 0.0);
  composer.addPass(bloom);
  // 背景渐变在辉光之后叠加（粒子本就是加色混合，先后顺序等价）
  const bgPass = new ShaderPass({
    vertexShader: bgPassVert, fragmentShader: bgPassFrag,
    uniforms: {
      tDiffuse: { value: null },
      uTop: { value: new Vector3(...BG[0].top) }, uBot: { value: new Vector3(...BG[0].bot) },
      uRayCol: { value: new Vector3(...hexLin('#CCDBEB')) }, uRingCol: { value: new Vector3(...hexLin('#9FBDDA')) },
      uRays: { value: 0 }, uCaus: { value: 0 }, uSurf: { value: -1 },
      uTime: { value: 0 }, uRes: { value: new Vector2(view.w, view.h) },
      uClick: { value: fx.uClick },
    },
  });
  // ShaderPass 会克隆 uniforms；把点击数组重新指回 fx 的同一份引用
  bgPass.material.uniforms.uClick.value = fx.uClick;
  composer.addPass(bgPass);
  composer.addPass(new OutputPass());
  const bgMat = bgPass.material;

  // 粒子数少于 N 时（移动端）按比例补偿亮度
  const countComp = N / count;
  Object.assign(gl, { renderer, scene, camera, composer, bloom, pMat, bgMat, snowMat, streakMat, fx, dpr, countComp, bornAt: performance.now(), ready: true });
  setGlow(glow);
  resize(true);
  // 刷新时若已停在页面中段，不要再触发“穿越海面”
  surfArmed = scrollY < innerHeight * 0.4;
  if (!surfArmed) autoCollapseTune();

  // 上下文丢失后 three.js 会在恢复时自行重建 GPU 资源（DataTexture 保留着数组）；这里只需暂停 / 恢复渲染
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gl.ready = false; });
  canvas.addEventListener('webglcontextrestored', () => { gl.ready = true; resize(true); });
}

// ---------------------------------------------------------------------------
// 布局：根据视口决定生物所在位置与缩放
// ---------------------------------------------------------------------------
let centers = [];
let layoutMode = 'wide';
let slots = [];   // 每个章节里，文案卡片旁边留给生物的空白区域（像素）
let mids = [];    // 每个章节中线的绝对位置（像素），供视差使用，避免每帧读 offsetTop
function measure() {
  const vh = innerHeight, vw = innerWidth;
  mids = sections.map((s) => s.offsetTop + s.offsetHeight / 2);
  centers = mids.map((m) => m - vh / 2);
  centers[0] = 0;
  const maxScroll = document.documentElement.scrollHeight - vh;
  centers[centers.length - 1] = Math.min(centers[centers.length - 1], maxScroll);
  const gaugeW = Math.min(150, vw * 0.1);
  slots = sections.map((sec) => {
    const card = sec.querySelector('.card');
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return sec.dataset.side === 'right'
      ? { center: r.left / 2, width: r.left }
      : { center: (r.right + vw - gaugeW) / 2, width: vw - gaugeW - r.right };
  });
}
function resize(force = false) {
  measure();
  // 与 CSS 断点一致：窄于 760px（含横屏手机）或竖屏时，文案卡片铺满底部，生物放到上半屏
  layoutMode = innerWidth <= 760 || innerWidth / innerHeight < 0.9 ? 'tall' : 'wide';
  if (!gl.ready) return;
  const { renderer, camera, composer, pMat, bgMat, snowMat, fx } = gl;
  const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight, dpr = pickDpr();
  if (force || w !== view.w || h !== view.h || dpr !== gl.dpr) {
    view.w = w; view.h = h;
    if (dpr !== gl.dpr) {
      gl.dpr = dpr;
      renderer.setPixelRatio(dpr);
      composer.setPixelRatio(dpr);
      pMat.uniforms.uPixelRatio.value = dpr;
      snowMat.uniforms.uPixelRatio.value = dpr;
      fx.mat.uniforms.uPixelRatio.value = dpr;
    }
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pMat.uniforms.uAspect.value = camera.aspect;
    bgMat.uniforms.uRes.value.set(w, h);
  }
  fx.setViewport(canvas.getBoundingClientRect(), camera.aspect);
  // 粒子像素尺寸随视口高度略微缩放；竖屏时生物被缩小，粒子也相应变细
  pMat.uniforms.uSize.value = layoutMode === 'tall' ? 1.45 : 2.0 * clamp(h / 900, 0.8, 1.5);
}
// 合并同一帧内的多次 resize；屏幕缩放比例变化（拖到另一块显示器、浏览器缩放）也重新计算
let resizeQueued = false;
const queueResize = () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => { resizeQueued = false; resize(); });
};
addEventListener('resize', queueResize);
const watchDpr = () => {
  const mq = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
  mq.addEventListener?.('change', () => { queueResize(); watchDpr(); }, { once: true });
};
watchDpr();
document.fonts?.ready?.then(() => queueResize());

function placement(i) {
  if (i === 0) return { x: 0, y: 0, s: 1 };
  const halfH = 12 * Math.tan((17.5 * Math.PI) / 180);
  const halfW = halfH * (view.w / view.h);
  if (i === SCENE.length - 1) return layoutMode === 'tall' ? { x: 0, y: halfH * 0.5, s: clamp(halfW / 2.6, 0.45, 1) } : { x: 0, y: -2.0, s: clamp(halfW / 4.2, 0.65, 1.3) };
  if (layoutMode === 'tall' || !slots[i]) {
    // 竖屏：生物放在上半屏，按宽、高两个方向取较小的缩放
    const s = Math.min((2 * halfW * 1.0) / SCENE[i].span, (2 * halfH * 0.5) / SCENE[i].h);
    return { x: 0, y: halfH * 0.38, s: clamp(s, 0.32, 1.1) };
  }
  // 生物居中放进文案旁的空白区域，并按可用宽度缩放
  const upp = (2 * halfW) / view.w;
  const sl = slots[i];
  const s = Math.min((sl.width * upp * 1.06) / SCENE[i].span, (2 * halfH * 0.9) / SCENE[i].h);
  return { x: (sl.center - view.w / 2) * upp, y: 0, s: clamp(s, 0.45, 1.3) };
}

const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(), _p = new Vector3(), _s = new Vector3();
// 亮度补偿：同样数量的粒子挤进更小的屏幕面积会过曝，按“缩放 × 每单位像素数”的平方反向补偿
function densityComp(i) {
  if (i === 0) return gl.countComp;
  const ppu = view.h / (2 * 12 * Math.tan((17.5 * Math.PI) / 180));
  const k = (placement(i).s * ppu) / (0.9 * 119);
  return clamp(gl.countComp * k * k, 0.2, 1.6);
}

function sceneMatrix(i, off, out, t, mouse) {
  const c = SCENE[i], L = placement(i);
  const k = i === 0 ? 0.25 : 1;
  const yaw = c.yaw + off * 0.55 * k + mouse.x * 0.28 * k + Math.sin(t * 0.12 + i) * 0.06 * k;
  const pitch = c.pitch - mouse.y * 0.14 * k - off * 0.1 * k;
  _e.set(pitch, yaw, c.roll || 0, 'XYZ');
  _q.setFromEuler(_e);
  _p.set(L.x, L.y + off * (i === 0 ? 1.2 : 0.9), 0);
  _s.setScalar(L.s);
  return out.compose(_p, _q, _s);
}

// ---------------------------------------------------------------------------
// 主循环
// ---------------------------------------------------------------------------
let sCur = scrollY, prevS = scrollY, velS = 0, time = 0, last = performance.now(), lastIdx = -1;
let lastZone = -1, bannerZone = -1, pendingZone = null, zoneT = -9, surfT = -99, surfArmed = true, ascending = false, lastExit = -1;
let hudDepth = -1, hudZone = -1, hudFill = '';
const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
let lastPointerType = 'mouse';
const isUi = (el) => !!el.closest?.('button, a, input, label, output, .tune, .hud-top');

addEventListener('pointermove', (e) => {
  lastPointerType = e.pointerType;
  mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  if (gl.ready) gl.fx.onPointerMove(e.clientX, e.clientY, time, e.timeStamp / 1000);
}, { passive: true });
document.addEventListener('pointerleave', () => gl.ready && gl.fx.onPointerLeave());

// 点击：鼠标用 pointerdown（更跟手）；触屏 / 手写笔用“轻点”判定（按下与抬起位置相近、时间很短），
// 滑动滚动会触发 pointercancel 或位移过大，不会误发。iOS Safari 不会为 window 上的 click 监听合成点击事件，所以不依赖 click。
function sonar(e) {
  if (!gl.ready || isUi(e.target)) return;
  const s = gl.fx.onClick(e.clientX, e.clientY, time);
  cursor.pulse(s);
  audio.click?.(s, clamp((e.clientX / innerWidth) * 2 - 1, -1, 1));
}
let tap = null;
addEventListener('pointerdown', (e) => {
  lastPointerType = e.pointerType;
  if (e.pointerType === 'mouse') { if (e.button === 0) sonar(e); }
  else tap = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
}, { passive: true });
addEventListener('pointerup', (e) => {
  if (!tap || e.pointerId !== tap.id) return;
  const ok = Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 12 && e.timeStamp - tap.t < 450;
  tap = null;
  if (ok) sonar(e);
}, { passive: true });
addEventListener('pointercancel', () => { tap = null; }, { passive: true });

// 返回海面：一路上浮，粒子倒放所有生物，气泡涌起。上浮途中用户一滚动 / 触摸 / 按键就把控制权交还
let ascentRaf = 0, ascentTimer = 0;
function endAscent() {
  cancelAnimationFrame(ascentRaf);
  clearTimeout(ascentTimer);
  ascentRaf = 0;
  ascending = false;
  pendingZone = null;
  bannerZone = lastZone;      // 上浮途中经过的水层不再补发横幅
}
function ascendToSurface() {
  if (ascentRaf) return;
  if (reduceMotion || scrollY < 10) { scrollTo(0, 0); return; }
  clearTimeout(ascentTimer);
  ascending = true;
  audio.ascend?.();
  if (gl.ready) gl.fx.ascend(2.4);
  const y0 = scrollY, dur = 2600, t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    scrollTo(0, y0 * (1 - e));
    if (k < 1) ascentRaf = requestAnimationFrame(step);
    else { ascentRaf = 0; ascentTimer = setTimeout(endAscent, 600); }
  };
  ascentRaf = requestAnimationFrame(step);
}
['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, () => { if (ascentRaf) endAscent(); }, { passive: true }));

function sectionFloat(s) {
  if (s <= centers[0]) return 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (s < centers[i + 1]) return i + (s - centers[i]) / (centers[i + 1] - centers[i]);
  }
  return centers.length - 1;
}

const NAMES = sections.map((s) => s.dataset.name);
function updateHud(F) {
  const A = Math.floor(F), B = Math.min(A + 1, SCENE.length - 1), f = F - A;
  const depth = lerp(SCENE[A].depth, SCENE[B].depth, smooth(0.15, 0.85, f));
  const zi = zoneOf(depth);
  const dr = Math.round(depth);
  if (dr !== hudDepth) { hudDepth = dr; depthVal.textContent = dr.toLocaleString('en-US'); }
  if (zi !== hudZone) { hudZone = zi; depthZone.textContent = `${ZONES[zi].name} · ${ZONES[zi].en}`; }
  const fill = `scaleY(${clamp(Math.log10(1 + depth) / Math.log10(4001), 0, 1).toFixed(3)})`;
  if (fill !== hudFill) { hudFill = fill; depthFill.style.transform = fill; }
  const idx = Math.round(F);
  if (idx !== lastIdx) {
    lastIdx = idx;
    const edge = idx === 0 || idx === SCENE.length - 1;
    secIdx.textContent = edge ? '' : String(idx).padStart(2, '0');
    pagerSep.hidden = edge;
    secName.textContent = NAMES[idx];
    audio.setScene(idx, SCENE[idx].depth);
  }
  audio.setDepth?.(depth);
  // 穿越水层：横幅 + 一圈从中心扩散的声呐波 + 音效。
  // 两次穿越间隔太近时不丢弃，而是排队，等上一条横幅播放一段后显示“最终所在”的水层
  if (lastZone === -1) { lastZone = bannerZone = zi; return; }
  if (zi !== lastZone) {
    lastZone = zi;
    pendingZone = ascending ? null : { zi, deeper: zi > bannerZone };
    if (ascending) bannerZone = zi;
  }
  if (pendingZone && time - zoneT > 1.2) {
    const { zi: z, deeper } = pendingZone;
    pendingZone = null;
    if (z !== bannerZone) {
      bannerZone = z;
      zoneT = time;
      showZoneBanner(z, deeper);
      if (gl.ready) gl.fx.pulse(0, 0, 2.2, time);
      audio.zoneCross?.(z, deeper);
    }
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dtReal = Math.max((now - last) / 1000, 1e-3);   // 真实间隔（算滚动速度用，掉帧时不会高估）
  const dt = Math.min(dtReal, 0.05);                     // 动画步长（掉帧时限幅，避免跳变）
  last = now;
  time += dt;

  sCur += (scrollY - sCur) * (1 - Math.exp(-dt * (reduceMotion ? 20 : 6.5)));
  if (Math.abs(scrollY - sCur) < 0.1) sCur = scrollY;
  const F = sectionFloat(sCur);
  updateHud(F);
  if (!gl.ready) return;

  mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2.5));
  mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2.5));

  // 滚动速度（屏/秒），驱动速度线
  const vel = (sCur - prevS) / dtReal / innerHeight;
  prevS = sCur;
  velS += (vel - velS) * (1 - Math.exp(-dt * 8));

  // 首页出场：标题像穿过海面一样放大、虚化、淡出
  const ex = clamp(sCur / (innerHeight * 0.9), 0, 1);
  if (Math.abs(ex - lastExit) > 0.002) { lastExit = ex; heroInner.style.setProperty('--exit', ex.toFixed(3)); }
  // 穿越海面：向下滚过首页约 40% 时触发一次气泡潮与亮带（同时收起首次自动展开的调节面板，避免遮挡文案）
  if (surfArmed && sCur > innerHeight * 0.4 && !ascending) {
    autoCollapseTune();
    surfArmed = false; surfT = time;
    gl.fx.surfaceBreak();
    audio.click?.(1.1, 0);
  }
  if (sCur < innerHeight * 0.1) surfArmed = true;

  // 背景大号章节数字的视差（章节位置在 measure() 里缓存，这里不读布局）
  const vh = innerHeight;
  for (let i = 0; i < bignums.length; i++) {
    const el = bignums[i];
    if (!el) continue;
    const p = (mids[i] - sCur - vh / 2) / vh;
    if (Math.abs(p) > 1.6) continue;
    const tf = `translate3d(0, ${(p * 22).toFixed(1)}vh, 0)`;
    if (el._tf !== tf) { el._tf = tf; el.style.transform = tf; }
  }

  const [shx, shy] = gl.fx.update(time, dt);
  gl.camera.position.set(shx, shy, 12);

  const A = Math.floor(F), B = Math.min(A + 1, SCENE.length - 1), f = F - A;
  const mix = A === B ? 0 : smooth(0.2, 0.8, f);
  const u = gl.pMat.uniforms;
  u.uShapeA.value = A; u.uShapeB.value = B; u.uMix.value = mix; u.uTime.value = time;
  u.uAlphaA.value = SCENE[A].alpha * densityComp(A); u.uAlphaB.value = SCENE[B].alpha * densityComp(B);
  if (u.uIntro.value < 1) u.uIntro.value = Math.min(1, (now - gl.bornAt) / 3200);
  sceneMatrix(A, f, u.uMatA.value, time, mouse);
  sceneMatrix(B, f - 1, u.uMatB.value, time, mouse);

  const bf = smooth(0, 1, f), b = gl.bgMat.uniforms;
  const tA = BG[A].top, tB = BG[B].top, bA = BG[A].bot, bB = BG[B].bot;
  b.uTop.value.set(lerp(tA[0], tB[0], bf), lerp(tA[1], tB[1], bf), lerp(tA[2], tB[2], bf));
  b.uBot.value.set(lerp(bA[0], bB[0], bf), lerp(bA[1], bB[1], bf), lerp(bA[2], bB[2], bf));
  b.uRays.value = lerp(SCENE[A].rays, SCENE[B].rays, bf);
  b.uCaus.value = reduceMotion ? 0 : lerp(SCENE[A].caus, SCENE[B].caus, bf);
  b.uSurf.value = time - surfT < 3 ? time - surfT : -1;
  b.uTime.value = time;

  const st = gl.streakMat.uniforms;
  st.uTime.value = time; st.uScroll.value = F; st.uVel.value = reduceMotion ? 0 : velS * 1.6;

  const sn = gl.snowMat.uniforms;
  sn.uTime.value = time; sn.uScroll.value = F;
  sn.uOpacity.value = 0.35 + 0.35 * clamp(F / 10, 0, 1);

  gl.composer.render(dt);
}

// ---------------------------------------------------------------------------
// 启动
// ---------------------------------------------------------------------------
const CN = { ocean: '海面', coral: '珊瑚', starfish: '海星', seahorse: '海马', horseshoe: '鲎', turtle: '海龟', manta: '魔鬼鱼', shark: '鲨鱼', whale: '蓝鲸', jellyfish: '水母', lanternfish: '灯笼鱼', anglerfish: '鮟鱇', abyss: '深渊' };

async function boot() {
  setGlow(glow);
  setTitleGlow(titleGlow);
  renderSoundState();
  measure();
  requestAnimationFrame(frame);
  try {
    const data = await buildAll((i, id) => {
      loadBar.style.transform = `scaleX(${(i / SHAPES.length).toFixed(3)})`;
      loadText.textContent = id ? `正在用粒子塑造：${CN[id]}（${i + 1} / ${SHAPES.length}）` : '准备下潜';
    });
    initGL(data);
    if (location.hash === '#debug') window.__deep = { gl, audio, SCENE };
    loader.classList.add('is-done');
    if (!store.get('seenHint', false)) {
      setTimeout(() => toast('右上角「荧光调节」可以分别调节粒子和标题的荧光强度；点击画面会发出声呐脉冲，点得越快越强。', 7000), 1600);
      store.set('seenHint', true);
    }
    setTimeout(() => loader.remove(), 1400);
  } catch (err) {
    console.error(err);
    loadText.textContent = '当前浏览器无法运行 WebGL2，粒子效果不可用。文字内容仍可滚动浏览。';
    loader.classList.add('is-error');
    setTimeout(() => loader.classList.add('is-done'), 2600);
  }
}
boot();
