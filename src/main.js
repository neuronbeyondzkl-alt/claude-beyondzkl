import { ParticleField } from './particles.js';
import { SHAPES, generateShape } from './shapes.js';
import { Soundtrack } from './audio.js';
import { createInteractions } from './interact.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const lerpAngle = (a, b, t) => a + wrapAngle(b - a) * t;

document.documentElement.classList.add('js');
let heroBoxes = [];

const sections = $$('.sec');
const S = SHAPES.length;
const LEVELS = [1, 2, 2, 3, 3, 4, 4, 5, 5]; // 每个层级对应的配器强度
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 设置（本地记忆，失败时用默认值） ----------
const defaults = { glow: 100, tglow: 100, accent: 100, psize: 100, vol: 80, font: 'Oswald' };
let settings = { ...defaults };
try {
  const raw = localStorage.getItem('np-settings-v2');
  if (raw) settings = { ...defaults, ...JSON.parse(raw) };
  else {
    // 迁移 v1 的设置：保留荧光、粒子大小、音量等，只丢掉旧的默认字体
    const old = JSON.parse(localStorage.getItem('np-settings') || 'null');
    if (old) {
      delete old.font;
      settings = { ...defaults, ...old, tglow: old.glow ?? defaults.tglow };
      localStorage.setItem('np-settings-v2', JSON.stringify(settings));
      localStorage.removeItem('np-settings');
    }
  }
} catch (e) {
  /* 隐私模式等情况下无法读取 */
}
const saveSettings = () => {
  try {
    localStorage.setItem('np-settings-v2', JSON.stringify(settings));
  } catch (e) {
    /* 忽略 */
  }
};

// ---------- 标题：拆字 + 自适应字号 ----------
function splitTitles() {
  for (const line of $$('.neon .line')) {
    const text = line.textContent;
    line.setAttribute('aria-label', text);
    line.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = ch === ' ' ? 'ch sp' : 'ch';
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.setProperty('--i', i);
      s.setAttribute('aria-hidden', 'true');
      line.appendChild(s);
    });
  }
}

function fitTitles() {
  const vh = innerHeight;
  for (const title of $$('.title.fit')) {
    const lines = $$('.line', title);
    const avail = title.parentElement.clientWidth;
    if (!avail) continue;
    const kind = title.dataset.size;
    const maxPx =
      kind === 'hero' ? Math.min(vh * 0.24, 250) : kind === 'outro' ? Math.min(vh * 0.12, 130) : Math.min(vh * 0.2, 190);
    const first = lines[0];
    first.style.fontSize = '100px';
    const w = first.getBoundingClientRect().width || 1;
    const size = Math.max(28, Math.min(maxPx, (100 * avail * 0.98) / w));
    title.style.fontSize = size + 'px';
    first.style.fontSize = '';
    for (const ln of lines.slice(1)) {
      const k = parseFloat(ln.dataset.follow || '1');
      ln.style.fontSize = size * k + 'px';
      const lw = ln.getBoundingClientRect().width;
      if (lw > avail) ln.style.fontSize = (size * k * avail * 0.98) / lw + 'px';
    }
  }
  measureTextBoxes();
}

// ---------- 霓虹描边强度 ----------
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',') + ')';
}
// 标题霓虹：只用 Loyel 色板 —— 描边 #6C9AC4 → #9FBDDA（100%）→ 略偏 #CCDBEB（200%），
// 外发光三层依次为 #6C9AC4 / #497DAE / #376392（由内到外越来越深的蓝），整体比 v1 明显更蓝、不发白
let neonBase = 1;
let neonBoost = 1;
let neonRaf = 0;
function applyNeon(g) {
  neonBase = g;
  if (neonRaf) return;
  neonRaf = requestAnimationFrame(() => {
    neonRaf = 0;
    writeNeon(Math.min(2, neonBase * neonBoost));
  });
}
function writeNeon(g) {
  const st = document.documentElement.style;
  st.setProperty('--tglow', g.toFixed(2));
  const stroke = g < 1 ? mixHex('#6c9ac4', '#9fbdda', g) : mixHex('#9fbdda', '#ccdbeb', (g - 1) * 0.45);
  st.setProperty('--neon-stroke', stroke);
  if (g < 0.02) {
    st.setProperty('--neon-filter', 'none');
    return;
  }
  const m = Math.min(g, 1.7);
  st.setProperty(
    '--neon-filter',
    `drop-shadow(0 0 ${(0.6 + 1.2 * g).toFixed(1)}px rgba(108,154,196,${(0.3 + 0.3 * m).toFixed(2)})) ` +
      `drop-shadow(0 0 ${(3 + 9 * g).toFixed(1)}px rgba(73,125,174,${(0.28 + 0.32 * m).toFixed(2)})) ` +
      `drop-shadow(0 0 ${(10 + 26 * g).toFixed(1)}px rgba(55,99,146,${(0.22 + 0.34 * m).toFixed(2)}))`,
  );
}
// LTP 时标题短暂增亮 1.2 秒
function boostTitles() {
  neonBoost = 1.25;
  applyNeon(neonBase);
  document.documentElement.classList.add('ltp');
  setTimeout(() => {
    neonBoost = 1;
    applyNeon(neonBase);
    document.documentElement.classList.remove('ltp');
  }, 1200);
}

// ---------- 导航 ----------
const dotsEl = $('#dots');
const dots = sections.map((sec, i) => {
  const li = document.createElement('li');
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span>${sec.dataset.label}</span>`;
  b.setAttribute('aria-label', `跳到：${sec.dataset.label}`);
  b.addEventListener('click', () => sec.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }));
  li.appendChild(b);
  dotsEl.appendChild(li);
  return b;
});
const hudIdx = $('#hudIdx');
const hudName = $('#hudName');
const hudBar = $('#hudBar');

// ---------- 音乐 ----------
const audio = new Soundtrack();
audio.setVolume(settings.vol / 100);
const soundBtn = $('#soundBtn');
const heroPlay = $('#heroPlay');
const SOUND_LABELS = {
  off: ['开启配乐', '▶ 点燃配乐'],
  loading: ['配乐载入中…', '配乐载入中…'],
  on: ['配乐：开', '❚❚ 暂停配乐'],
  blocked: ['点击恢复配乐', '▶ 点击恢复配乐'],
  error: ['配乐不可用 · 重试', '▶ 重试配乐'],
};
function syncSoundUI() {
  const st = audio.uiState;
  soundBtn.setAttribute('aria-pressed', String(audio.playing));
  soundBtn.dataset.state = st;
  $('.label', soundBtn).textContent = SOUND_LABELS[st][0];
  heroPlay.textContent = SOUND_LABELS[st][1];
}
audio.onStatus = syncSoundUI;
function toggleSound() {
  const st = audio.uiState;
  // “点击恢复”状态下再点一次是恢复，而不是关闭
  if (st === 'off' || st === 'blocked' || st === 'error') audio.start();
  else audio.stop();
  syncSoundUI();
}
soundBtn.addEventListener('click', toggleSound);
heroPlay.addEventListener('click', toggleSound);

// ---------- 控制台 ----------
const panel = $('#panel');
const panelBtn = $('#panelBtn');
function setPanel(open) {
  panel.hidden = !open;
  panelBtn.setAttribute('aria-expanded', String(open));
  if (open) $('#glow').focus({ preventScroll: true });
}
panelBtn.addEventListener('click', () => setPanel(panel.hidden));
$('#panelClose').addEventListener('click', () => {
  setPanel(false);
  panelBtn.focus();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.hidden) {
    setPanel(false);
    panelBtn.focus();
  }
});

let field = null;
const BASE_SIZE = 2.6;

function paintRange(input) {
  const p = ((input.value - input.min) / (input.max - input.min)) * 100;
  input.style.setProperty('--fill', p + '%');
}
function bindRange(id, onChange) {
  const input = $('#' + id);
  const out = $('#' + id + 'Out');
  input.value = settings[id];
  const update = () => {
    settings[id] = Number(input.value);
    if (out) out.textContent = input.value + '%';
    paintRange(input);
    onChange(settings[id]);
  };
  input.addEventListener('input', () => {
    update();
    saveSettings();
  });
  update();
  return { input, update };
}
const presetsOf = (id) => $$(`.presets[data-target="${id}"] button`);
const markPreset = (id, v) => presetsOf(id).forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.value) === v)));
const ctls = {};
ctls.glow = bindRange('glow', (v) => {
  const g = v / 100;
  if (field) field.setGlow(g);
  document.documentElement.style.setProperty('--glow', g.toFixed(2));
  markPreset('glow', v);
});
ctls.tglow = bindRange('tglow', (v) => {
  applyNeon(v / 100);
  markPreset('tglow', v);
});
for (const id of ['glow', 'tglow']) {
  presetsOf(id).forEach((b) =>
    b.addEventListener('click', () => {
      ctls[id].input.value = b.dataset.value;
      ctls[id].update();
      saveSettings();
    }),
  );
}
bindRange('accent', (v) => {
  if (field) field.uniforms.uAccent.value = v / 100;
  // 色彩丰富度为 0 时，界面里的峰电位也收回为低饱和蓝
  document.documentElement.style.setProperty('--ap', v > 5 ? '#f0b46a' : '#ccdbeb');
});
bindRange('psize', (v) => {
  if (field) field.uniforms.uSize.value = BASE_SIZE * (v / 100);
});
bindRange('vol', (v) => audio.setVolume(v / 100));

const fontSel = $('#font');
fontSel.value = settings.font;
// 只有 Oswald 加载 600、Syncopate 加载 700，其余字体只有 400：按字体设置字重，避免浏览器伪加粗
const FONT_WEIGHT = { Oswald: 600, Syncopate: 700 };
function applyFont(name) {
  document.documentElement.style.setProperty('--display-weight', String(FONT_WEIGHT[name] || 400));
  document.documentElement.style.setProperty(
    '--font-display',
    `'${name}', 'Oswald', 'Anton', Impact, 'Arial Narrow Bold', sans-serif`,
  );
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`${FONT_WEIGHT[name] || 400} 100px "${name}"`).then(fitTitles, fitTitles);
  }
  fitTitles();
}
fontSel.addEventListener('change', () => {
  settings.font = fontSel.value;
  saveSettings();
  applyFont(settings.font);
});

// ---------- 布局 ----------
splitTitles();
applyFont(settings.font);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);

let tops = [];
let layout = [];
function measure() {
  tops = sections.map((s) => s.offsetTop);
  fitTitles();
  measureTextBoxes();
  if (!field) return;
  const [hw, hh] = field.visibleHalfSize();
  const portrait = innerWidth <= 820 || hw / hh < 1.05;
  layout = sections.map((sec, i) => {
    const side = sec.dataset.side;
    const fit = SHAPES[i].fit || 1;
    const outro = i === S - 1;
    if (portrait) {
      if (i === 0) return { x: 0, y: hh * 0.12, s: Math.min(1, hw / 1.9) };
      const s = Math.min(1, hw / 2.6) * fit;
      return { x: 0, y: outro ? hh * 0.5 : hh * 0.36, s: s * 0.92 };
    }
    const s = Math.min(1.05, hh / 3.5) * fit;
    const dx = (SHAPES[i].dx || 0) * s;
    if (side === 'left') return { x: hw * 0.43 + dx, y: 0, s };
    if (side === 'right') return { x: -hw * 0.43 + dx, y: 0, s };
    return { x: 0, y: outro ? hh * 0.5 : 0, s };
  });
}

// 首页文字的位置（文档坐标），每帧只按 scrollY 换算成 NDC，不读取布局
function measureTextBoxes() {
  const pad = 8;
  const union = (els) => {
    const rs = els.filter(Boolean).map((e) => e.getBoundingClientRect());
    if (!rs.length) return null;
    return [
      Math.min(...rs.map((r) => r.left)) - pad,
      Math.min(...rs.map((r) => r.top)) + scrollY - pad,
      Math.max(...rs.map((r) => r.right)) + pad,
      Math.max(...rs.map((r) => r.bottom)) + scrollY + pad,
    ];
  };
  const h = $('#hero');
  heroBoxes = [union([$('.kicker', h), $('.title', h)]), union([$('.desc', h), $('.hero-cta', h), $('.tap-hint', h)])];
}
function updateTextBoxes(U) {
  const W = innerWidth;
  const H = innerHeight;
  heroBoxes.forEach((b, i) => {
    if (!b) return;
    const top = b[1] - scrollY;
    const bottom = b[3] - scrollY;
    U.uTextBox.value[i].set((b[0] / W) * 2 - 1, 1 - (bottom / H) * 2, (b[2] / W) * 2 - 1, 1 - (top / H) * 2);
  });
}

function scrollTarget() {
  const y = scrollY;
  let i = 0;
  while (i < tops.length - 1 && tops[i + 1] <= y + 1) i++;
  if (i >= tops.length - 1) return tops.length - 1;
  return i + clamp((y - tops[i]) / (tops[i + 1] - tops[i]), 0, 1);
}

// ---------- 启动粒子 ----------
const canvas = $('#gl');
const loading = $('#loading');
const small = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
const COUNT = small ? 16384 : 32768;
const WIDTH = 256;
const prOf = () => Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);

try {
  field = new ParticleField(canvas, { count: COUNT, width: WIDTH, shapeCount: S, pixelRatio: prOf() });
  field.setGlow(settings.glow / 100);
  field.uniforms.uAccent.value = settings.accent / 100;
  field.uniforms.uSize.value = BASE_SIZE * (settings.psize / 100);
  if (/[?&]debug\b/.test(location.search)) window.__np = { field, audio };
  if (reduceMotion) {
    field.uniforms.uMotion.value = 0.35;
    field.uniforms.uScatter.value = 0.35;
  }
} catch (e) {
  console.error(e);
  document.documentElement.classList.add('no-webgl');
  loading.textContent = '当前浏览器无法启用 WebGL2，粒子无法显示；文字内容与配乐仍可使用。';
}

function resize() {
  if (field) field.resize(innerWidth, innerHeight, prOf());
  measure();
}
addEventListener('resize', resize);
resize();

const isPortrait = () => innerWidth <= 820 || innerWidth / innerHeight < 1.05;
let heroPortrait = isPortrait();
let ready = 0; // 已生成的形态数量
let introT = -1;
function loadShape(i) {
  const { pos, col, meta } = generateShape(i, COUNT, { portrait: heroPortrait });
  field.setShape(i, pos, col);
  field.setMeta(i, meta);
  metas[i] = meta;
  if (i === 0) {
    // 胞体位置用于“神经发生”生长动画（w = 胞体尺度）
    const SU = field.uniforms.uSoma.value;
    SU.forEach((v, k) => {
      const sm = meta.somata && meta.somata[k];
      if (sm) v.set(sm.p[0], sm.p[1], sm.p[2], sm.k);
      else v.set(0, 0, 0, 0);
    });
  }
}
async function generateAll() {
  for (let i = 0; i < S; i++) {
    loadShape(i);
    ready = i + 1;
    loading.textContent = `正在生成神经粒子 ${ready} / ${S} · ${COUNT.toLocaleString('en-US')} 个粒子`;
    if (i === 0) introT = performance.now();
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
  }
  loading.textContent = `${COUNT.toLocaleString('en-US')} 个粒子已就绪 · ${S} 种形态`;
  setTimeout(() => {
    loading.style.opacity = '0';
  }, 2600);
}
// 横竖屏切换时重新生成首页（构图不同）
let regenTimer = 0;
addEventListener('resize', () => {
  if (!field || ready < 1 || isPortrait() === heroPortrait) return;
  clearTimeout(regenTimer);
  regenTimer = setTimeout(() => {
    heroPortrait = isPortrait();
    loadShape(0);
  }, 400);
});

// ---------- 首页“点火”：神经元生长完成后，第一束放电从左上方的神经元出发，依次点亮标题字母 ----------
let ignited = false;
function igniteTitles() {
  if (ignited) return;
  ignited = true;
  document.documentElement.classList.add('ignite');
  // 点火之后再在空闲时离线渲染配乐分轨，避免与开场动画争抢主线程
  const prep = () => audio.prepare();
  if (window.requestIdleCallback) requestIdleCallback(prep, { timeout: 4000 });
  else setTimeout(prep, 1500);
}
setTimeout(igniteTitles, reduceMotion ? 0 : 4500);

// ---------- 指针视差 ----------
const mouse = { px: 0, py: 0 };
addEventListener(
  'pointermove',
  (e) => {
    mouse.px = (e.clientX / innerWidth) * 2 - 1;
    mouse.py = -((e.clientY / innerHeight) * 2 - 1);
  },
  { passive: true },
);

const metas = [];
let shapeNow = 0;
const neuro = createInteractions({
  field,
  audio,
  dots,
  reduceMotion,
  accent: () => settings.accent / 100,
  shapeMeta: (i) => metas[i],
  currentShape: () => shapeNow,
  onLtp: boostTitles,
});

// ---------- 主循环 ----------
let cur = 0;
let active = -1;
let last = performance.now();
let time = 0;
let stime = 0; // 传给着色器的时间，约每 68 分钟回卷一次
let beat = 0;
let flash = 0;
let par = { x: 0, y: 0 };

function shapeAngle(i, t) {
  const m = SHAPES[i];
  const rm = reduceMotion ? 0.3 : 1;
  if (m.spin) return wrapAngle(t * m.spin * rm + i);
  return m.base + m.sway * rm * Math.sin(t * 0.22 + i * 1.7);
}

let pendingFirstSpike = false;
function onSection(i) {
  neuro.hopRail(active, i);
  pendingFirstSpike = true;
  sections.forEach((s, k) => s.classList.toggle('is-active', k === i));
  document.documentElement.classList.toggle('at-hero', i === 0);
  dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  const sec = sections[i];
  hudIdx.textContent = String(i === S - 1 ? 7 : i).padStart(2, '0') + ' / 07';
  hudName.textContent = `${sec.dataset.label} · ${sec.dataset.scale}`;
  hudBar.style.setProperty('--p', (i / (S - 1)) * 100 + '%');
  audio.setLevel(LEVELS[i]);
  if (active !== -1) {
    audio.impact();
    flash = 0.5;
  }
  active = i;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;
  stime += dt;
  if (stime > 4096) {
    stime -= 4096;
    if (field) field.rebaseTime(4096);
  }

  const target = scrollTarget();
  const sec = Math.round(target);
  if (sec !== active) onSection(sec);
  beat = Math.max(beat * Math.exp(-dt * 7), audio.pollBeats());
  neuro.update(dt, now);

  if (field) {
    cur += (target - cur) * (1 - Math.exp(-dt * 5));
    if (Math.abs(target - cur) < 1e-4) cur = target;
    const maxIdx = Math.max(0, ready - 1);
    const c = Math.min(cur, maxIdx);
    const from = Math.floor(c);
    const to = Math.min(maxIdx, from + 1);
    const mix = to === from ? 0 : smoothstep(0.08, 0.92, c - from);
    const U = field.uniforms;
    U.uFrom.value = from;
    U.uTo.value = to;
    U.uMix.value = mix;
    U.uTime.value = stime;

    const it = introT < 0 ? 0 : Math.min(1, (now - introT) / (reduceMotion ? 800 : 3200));
    U.uIntro.value = 1 - Math.pow(1 - it, 2);
    // 神经发生：首页加载后 0.2–3.2 秒内，树突与轴突从胞体向外生长；生长完成即点火
    let grow = introT < 0 ? 0 : clamp((now - introT - 200) / 3000, 0, 1);
    grow = 1 - Math.pow(1 - grow, 2);
    if (reduceMotion || cur > 0.05 || ignited) grow = 1;
    if (grow >= 1 && !ignited && introT >= 0) {
      if (!reduceMotion && cur <= 0.05) neuro.ignite();
      igniteTitles();
      pendingFirstSpike = false;
    }
    U.uGrow.value = grow;
    shapeNow = mix < 0.5 ? from : to;
    // 首页文字区域的粒子略微变暗（随滚动离开首页而消失）
    U.uTextDim.value = 1 - smoothstep(0, 0.6, cur);
    if (U.uTextDim.value > 0) updateTextBoxes(U);

    flash *= Math.exp(-dt * 3.2);
    U.uBeat.value = beat;
    U.uFlash.value = flash;

    // 形态稳定下来后，让它按自己的生理方向“首次放电”（树突→胞体→轴突、EC→DG→CA3→CA1、脑→脊髓→四肢…）
    if (pendingFirstSpike && ignited && it >= 1 && Math.abs(target - cur) < 0.03 && ready > Math.round(target)) {
      pendingFirstSpike = false;
      neuro.arrive(Math.round(target));
    }
    par.x += (mouse.px - par.x) * (1 - Math.exp(-dt * 2));
    par.y += (mouse.py - par.y) * (1 - Math.exp(-dt * 2));

    const la = layout[from] || { x: 0, y: 0, s: 1 };
    const lb = layout[to] || la;
    const g = field.group;
    g.position.x = lerp(la.x, lb.x, mix);
    g.position.y = lerp(la.y, lb.y, mix);
    g.scale.setScalar(lerp(la.s, lb.s, mix) * (1 + beat * 0.012));
    const parK = lerp(SHAPES[from].par ?? 1, SHAPES[to].par ?? 1, mix);
    g.rotation.y = lerpAngle(shapeAngle(from, time), shapeAngle(to, time), mix) + par.x * 0.22 * parK;
    g.rotation.x = lerp(SHAPES[from].tilt, SHAPES[to].tilt, mix) - par.y * 0.12 * parK;

    // 光迹多两次全分辨率半浮点 pass：只在像素量适中的设备上启用
    const cv = field.renderer.domElement;
    field.setWarp(Math.sin(Math.PI * mix), !reduceMotion && !small && cv.width * cv.height < 4.2e6);
    field.render();
  }
  requestAnimationFrame(frame);
}

onSection(0);
syncSoundUI();
requestAnimationFrame(frame);
if (field) {
  generateAll().catch((e) => {
    console.error(e);
    loading.textContent = '粒子生成失败，请刷新页面重试。';
  });
}
