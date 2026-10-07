import {
  WebGLRenderer, Scene, PerspectiveCamera, BufferGeometry, BufferAttribute, Points, ShaderMaterial,
  DataTexture, RGBAFormat, FloatType, NearestFilter, Vector2, Matrix4, Quaternion, Euler, Vector3,
  AdditiveBlending, SRGBColorSpace, NoToneMapping,
  EffectComposer, RenderPass, UnrealBloomPass, OutputPass, ShaderPass,
} from './vendor/three.bundle.min.js';
import { N, TEX_W, ROWS, SHAPES, buildAll } from './creatures.js';
import { particleVert, particleFrag, bgPassVert, bgPassFrag, snowVert, snowFrag } from './shaders.js';
import { OceanAudio } from './audio.js';

// ---------------------------------------------------------------------------
// 场景表：与 creatures.js 的 SHAPES、页面中 .sec 的顺序一一对应
// span / h：生物在默认朝向下的大致横向跨度与高度（用于自适应缩放）；depth：叙事用的下潜深度（米）；yaw/pitch/roll：生物朝向；alpha：亮度补偿
// bg：[顶部颜色, 亮度系数, 底部颜色, 亮度系数]，全部取自 Loyel 色板再压暗
// mood：配乐各层密度（bells = 钟琴平均间隔秒数）
// ---------------------------------------------------------------------------
const SCENE = [
  { span: 0, h: 0, depth: 0, yaw: 0, pitch: 0, alpha: 0.85, bg: ['#263B54', 0.09, '#2B4868', 0.85], rays: 0, mood: { bells: 2.6, bubbles: 0, whale: 0.05 } },
  { span: 7.0, h: 4.2, depth: 10, yaw: -0.5, pitch: 0.25, alpha: 0.72, bg: ['#376392', 0.61, '#263B54', 0.32], rays: 1, mood: { bells: 1.5, bubbles: 4 } },
  { span: 6.0, h: 3.2, depth: 18, yaw: 0.3, pitch: 1.0, alpha: 0.5, bg: ['#376392', 0.58, '#263B54', 0.3], rays: 0.9, mood: { bells: 1.9, bubbles: 6 } },
  { span: 3.2, h: 5.6, depth: 25, yaw: Math.PI + 0.35, pitch: 0.05, alpha: 0.48, bg: ['#376392', 0.54, '#263B54', 0.28], rays: 0.85, mood: { bells: 1.7, bubbles: 5 } },
  { span: 6.6, h: 2.8, depth: 30, yaw: -0.35, pitch: 0.75, alpha: 0.62, bg: ['#2E5076', 0.58, '#263B54', 0.26], rays: 0.75, mood: { bells: 2.3, bubbles: 7 } },
  { span: 6.0, h: 2.8, depth: 60, yaw: Math.PI + 0.4, pitch: 0.6, alpha: 0.55, bg: ['#2E5076', 0.52, '#263B54', 0.23], rays: 0.65, mood: { bells: 2.0, bubbles: 6, whale: 0.08 } },
  { span: 7.2, h: 3.2, depth: 120, yaw: -0.9, pitch: 0.55, roll: -0.15, alpha: 0.6, bg: ['#2E5076', 0.43, '#263B54', 0.19], rays: 0.5, mood: { bells: 2.2, bubbles: 12, whale: 0.1 } },
  { span: 6.9, h: 3.4, depth: 180, yaw: Math.PI + 0.3, pitch: 0.12, alpha: 0.6, bg: ['#2B4868', 0.36, '#263B54', 0.15], rays: 0.35, mood: { bells: 3.0, bubbles: 0, whale: 0.1 } },
  { span: 7.8, h: 2.8, depth: 300, yaw: -0.45, pitch: 0.15, alpha: 0.62, bg: ['#2B4868', 0.29, '#263B54', 0.11], rays: 0.2, mood: { bells: 3.4, bubbles: 0, whale: 0.9, whaleVol: 1.2 } },
  { span: 4.8, h: 6.5, depth: 550, yaw: 0, pitch: 0.12, alpha: 0.85, bg: ['#263B54', 0.2, '#263B54', 0.07], rays: 0.05, mood: { bells: 1.1, arp: 0.35, bubbles: 0 } },
  { span: 7.0, h: 4.4, depth: 800, yaw: -0.25, pitch: 0.05, alpha: 0.42, bg: ['#263B54', 0.12, '#263B54', 0.05], rays: 0, mood: { bells: 0.75, bubbles: 0, bellOct: 12 } },
  { span: 6.4, h: 3.8, depth: 2000, yaw: Math.PI + 0.45, pitch: 0.1, alpha: 0.95, bg: ['#263B54', 0.06, '#263B54', 0.03], rays: 0, mood: { bells: 3.6, bubbles: 0, pings: 0.6, bellOct: -12 } },
  { span: 7.2, h: 3.0, depth: 4000, yaw: 0, pitch: 0.42, alpha: 0.26, bg: ['#263B54', 0.04, '#263B54', 0.02], rays: 0, mood: { bells: 2.8, bubbles: 0, pings: 0.5 } },
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

const store = {
  get(k, d) { try { const v = localStorage.getItem('deep.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('deep.' + k, JSON.stringify(v)); } catch { /* 私密模式等情况下忽略 */ } },
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 760px), (pointer: coarse)').matches;

// ---------------------------------------------------------------------------
// 界面
// ---------------------------------------------------------------------------
const sections = [...document.querySelectorAll('.sec')];
const loader = $('#loader'), loadBar = $('#loadBar'), loadText = $('#loadText');
const glowInput = $('#glow'), glowOut = $('#glowOut');
const volInput = $('#vol'), soundBtn = $('#sound');
const depthVal = $('#depthVal'), depthZone = $('#depthZone'), depthFill = $('#depthFill');
const secIdx = $('#secIdx'), secName = $('#secName'), pagerSep = $('.pager__sep');

const audio = new OceanAudio();
let glow = store.get('glow', 0.65);
let volume = store.get('vol', 0.7);
glowInput.value = Math.round(glow * 100);
volInput.value = Math.round(volume * 100);
audio.setVolume(volume);

function setGlow(g) {
  glow = g;
  glowOut.textContent = Math.round(g * 100) + '%';
  document.documentElement.style.setProperty('--glow', g.toFixed(3));
  if (gl.ready) {
    gl.pMat.uniforms.uGlow.value = g;
    gl.snowMat.uniforms.uGlow.value = g;
    gl.bloom.strength = 0.08 + 0.82 * g;
    gl.bloom.radius = 0.25 + 0.4 * g;
  }
}
glowInput.addEventListener('input', () => { setGlow(glowInput.value / 100); store.set('glow', glow); });

function renderSoundState() {
  soundBtn.setAttribute('aria-pressed', String(audio.isOn));
  soundBtn.querySelector('.label').textContent = audio.isOn ? '配乐 开' : '配乐 关';
  document.body.classList.toggle('is-sound', audio.isOn);
}
soundBtn.addEventListener('click', async () => { await audio.toggle(); renderSoundState(); });
volInput.addEventListener('input', () => { volume = volInput.value / 100; audio.setVolume(volume); store.set('vol', volume); });
$('#start').addEventListener('click', async () => {
  await audio.start();
  renderSoundState();
  sections[1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});
$('#silent').addEventListener('click', () => sections[1].scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
$('#backTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
document.addEventListener('visibilitychange', () => (document.hidden ? audio.pause() : audio.resume()));

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

function initGL(data) {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  if (!renderer.capabilities.isWebGL2) throw new Error('WebGL2 unavailable');
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NoToneMapping;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight, false);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, innerWidth / innerHeight, 0.1, 100);
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
      uAspect: { value: innerWidth / innerHeight },
      uMouse: { value: new Vector3(9, 9, 0) },
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

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(innerWidth / 2, innerHeight / 2), 1, 0.6, 0.0);
  composer.addPass(bloom);
  // 背景渐变在辉光之后叠加（粒子本就是加色混合，先后顺序等价）
  const bgPass = new ShaderPass({
    vertexShader: bgPassVert, fragmentShader: bgPassFrag,
    uniforms: {
      tDiffuse: { value: null },
      uTop: { value: new Vector3(...BG[0].top) }, uBot: { value: new Vector3(...BG[0].bot) },
      uRayCol: { value: new Vector3(...hexLin('#CCDBEB')) }, uRays: { value: 0 },
      uTime: { value: 0 }, uRes: { value: new Vector2(innerWidth, innerHeight) },
    },
  });
  composer.addPass(bgPass);
  composer.addPass(new OutputPass());
  const bgMat = bgPass.material;

  // 粒子数少于 N 时（移动端）按比例补偿亮度
  const countComp = N / count;
  Object.assign(gl, { renderer, scene, camera, composer, bloom, pMat, bgMat, snowMat, dpr, countComp, bornAt: performance.now(), ready: true });
  setGlow(glow);
  resize();

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); gl.ready = false; });
}

// ---------------------------------------------------------------------------
// 布局：根据视口决定生物所在位置与缩放
// ---------------------------------------------------------------------------
let centers = [];
let layoutMode = 'wide';
let slots = [];   // 每个章节里，文案卡片旁边留给生物的空白区域（像素）
function measure() {
  const vh = innerHeight, vw = innerWidth;
  centers = sections.map((s) => s.offsetTop + s.offsetHeight / 2 - vh / 2);
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
function resize() {
  measure();
  layoutMode = innerWidth / innerHeight < 0.9 ? 'tall' : 'wide';
  if (!gl.ready) return;
  const { renderer, camera, composer, pMat, bgMat } = gl;
  renderer.setSize(innerWidth, innerHeight, false);
  composer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  pMat.uniforms.uAspect.value = camera.aspect;
  // 粒子像素尺寸随视口高度略微缩放；竖屏时生物被缩小，粒子也相应变细
  pMat.uniforms.uSize.value = layoutMode === 'tall' ? 1.45 : 2.0 * clamp(innerHeight / 900, 0.8, 1.5);
  bgMat.uniforms.uRes.value.set(innerWidth, innerHeight);
}
addEventListener('resize', resize);

function placement(i) {
  if (i === 0) return { x: 0, y: 0, s: 1 };
  const halfH = 12 * Math.tan((17.5 * Math.PI) / 180);
  const halfW = halfH * (innerWidth / innerHeight);
  if (i === SCENE.length - 1) return layoutMode === 'tall' ? { x: 0, y: halfH * 0.5, s: clamp(halfW / 2.6, 0.45, 1) } : { x: 0, y: -2.0, s: clamp(halfW / 4.6, 0.6, 1.2) };
  if (layoutMode === 'tall' || !slots[i]) {
    // 竖屏：生物放在上半屏，按宽、高两个方向取较小的缩放
    const s = Math.min((2 * halfW * 0.9) / SCENE[i].span, (2 * halfH * 0.44) / SCENE[i].h);
    return { x: 0, y: halfH * 0.4, s: clamp(s, 0.3, 0.95) };
  }
  // 生物居中放进文案旁的空白区域，并按可用宽度缩放
  const upp = (2 * halfW) / innerWidth;
  const sl = slots[i];
  return { x: (sl.center - innerWidth / 2) * upp, y: 0, s: clamp((sl.width * upp * 0.92) / SCENE[i].span, 0.4, 1.0) };
}

const _m = new Matrix4(), _q = new Quaternion(), _e = new Euler(), _p = new Vector3(), _s = new Vector3();
// 亮度补偿：同样数量的粒子挤进更小的屏幕面积会过曝，按“缩放 × 每单位像素数”的平方反向补偿
function densityComp(i) {
  if (i === 0) return gl.countComp;
  const ppu = innerHeight / (2 * 12 * Math.tan((17.5 * Math.PI) / 180));
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
let sCur = scrollY, time = 0, last = performance.now(), lastIdx = -1;
const mouse = { x: 0, y: 0, tx: 0, ty: 0, nx: 9, ny: 9, str: 0, tstr: 0 };
addEventListener('pointermove', (e) => {
  mouse.tx = (e.clientX / innerWidth) * 2 - 1;
  mouse.ty = -((e.clientY / innerHeight) * 2 - 1);
  mouse.nx = mouse.tx; mouse.ny = mouse.ty;
  mouse.tstr = e.pointerType === 'touch' ? 0.6 : 1;
});
document.addEventListener('pointerleave', () => { mouse.tstr = 0; });

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
  const z = ZONES[zoneOf(depth)];
  depthVal.textContent = Math.round(depth).toLocaleString('en-US');
  depthZone.textContent = `${z.name} · ${z.en}`;
  depthFill.style.transform = `scaleY(${clamp(Math.log10(1 + depth) / Math.log10(4001), 0, 1).toFixed(4)})`;
  const idx = Math.round(F);
  if (idx !== lastIdx) {
    lastIdx = idx;
    const edge = idx === 0 || idx === SCENE.length - 1;
    secIdx.textContent = edge ? '' : String(idx).padStart(2, '0');
    pagerSep.hidden = edge;
    secName.textContent = NAMES[idx];
    audio.setScene(Math.min(zoneOf(SCENE[idx].depth), 2), SCENE[idx].mood);
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  time += dt;

  sCur += (scrollY - sCur) * (1 - Math.exp(-dt * (reduceMotion ? 20 : 6.5)));
  if (Math.abs(scrollY - sCur) < 0.1) sCur = scrollY;
  const F = sectionFloat(sCur);
  updateHud(F);
  if (!gl.ready) return;

  mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * 2.5));
  mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * 2.5));
  mouse.str += (mouse.tstr - mouse.str) * (1 - Math.exp(-dt * 4));

  const A = Math.floor(F), B = Math.min(A + 1, SCENE.length - 1), f = F - A;
  const mix = A === B ? 0 : smooth(0.2, 0.8, f);
  const u = gl.pMat.uniforms;
  u.uShapeA.value = A; u.uShapeB.value = B; u.uMix.value = mix; u.uTime.value = time;
  u.uAlphaA.value = SCENE[A].alpha * densityComp(A); u.uAlphaB.value = SCENE[B].alpha * densityComp(B);
  if (u.uIntro.value < 1) u.uIntro.value = Math.min(1, (now - gl.bornAt) / 3200);
  sceneMatrix(A, f, u.uMatA.value, time, mouse);
  sceneMatrix(B, f - 1, u.uMatB.value, time, mouse);
  u.uMouse.value.set(mouse.nx, mouse.ny, mouse.str * (reduceMotion ? 0.3 : 1));

  const bf = smooth(0, 1, f), b = gl.bgMat.uniforms;
  b.uTop.value.set(...BG[A].top.map((v, k) => lerp(v, BG[B].top[k], bf)));
  b.uBot.value.set(...BG[A].bot.map((v, k) => lerp(v, BG[B].bot[k], bf)));
  b.uRays.value = lerp(SCENE[A].rays, SCENE[B].rays, bf);
  b.uTime.value = time;

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
  renderSoundState();
  measure();
  requestAnimationFrame(frame);
  try {
    const data = await buildAll((i, id) => {
      loadBar.style.transform = `scaleX(${(i / SHAPES.length).toFixed(3)})`;
      loadText.textContent = id ? `正在用粒子塑造：${CN[id]}（${i + 1} / ${SHAPES.length}）` : '准备下潜';
    });
    initGL(data);
    loader.classList.add('is-done');
    setTimeout(() => loader.remove(), 1400);
  } catch (err) {
    console.error(err);
    loadText.textContent = '当前浏览器无法运行 WebGL2，粒子效果不可用。文字内容仍可滚动浏览。';
    loader.classList.add('is-error');
    setTimeout(() => loader.classList.add('is-done'), 2600);
  }
}
boot();
