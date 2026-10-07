import { ParticleField } from './particles.js';
import { SHAPES, generateShape } from './shapes.js';
import { Soundtrack } from './audio.js';

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

const sections = $$('.sec');
const S = SHAPES.length;
const LEVELS = [1, 2, 2, 3, 3, 4, 4, 5, 5]; // 每个层级对应的配器强度
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- 设置（本地记忆，失败时用默认值） ----------
const defaults = { glow: 100, accent: 100, psize: 100, vol: 70, font: 'Anton' };
let settings = { ...defaults };
try {
  const raw = localStorage.getItem('np-settings');
  if (raw) settings = { ...defaults, ...JSON.parse(raw) };
} catch (e) {
  /* 隐私模式等情况下无法读取 */
}
const saveSettings = () => {
  try {
    localStorage.setItem('np-settings', JSON.stringify(settings));
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
}

// ---------- 霓虹描边强度 ----------
function mixHex(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return 'rgb(' + pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(',') + ')';
}
function applyNeon(g) {
  const st = document.documentElement.style;
  st.setProperty('--glow', g.toFixed(2));
  const stroke = g < 1 ? mixHex('#6c9ac4', '#ccdbeb', g) : mixHex('#ccdbeb', '#f4f7fb', (g - 1) / 1);
  st.setProperty('--neon-stroke', stroke);
  if (g < 0.02) {
    st.setProperty('--neon-filter', 'none');
    return;
  }
  const m = Math.min(g, 1.6);
  st.setProperty(
    '--neon-filter',
    `drop-shadow(0 0 ${(0.6 + 1.6 * g).toFixed(1)}px rgba(232,238,246,${(0.25 + 0.35 * m).toFixed(2)})) ` +
      `drop-shadow(0 0 ${(3 + 8 * g).toFixed(1)}px rgba(159,189,218,${(0.22 + 0.33 * m).toFixed(2)})) ` +
      `drop-shadow(0 0 ${(9 + 22 * g).toFixed(1)}px rgba(108,154,196,${(0.14 + 0.32 * m).toFixed(2)}))`,
  );
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
function syncSoundUI() {
  const on = audio.playing;
  soundBtn.setAttribute('aria-pressed', String(on));
  $('.label', soundBtn).textContent = on ? '配乐：开' : '开启配乐';
  heroPlay.textContent = on ? '❚❚ 暂停配乐' : '▶ 点燃配乐';
}
async function toggleSound() {
  try {
    if (audio.playing) audio.stop();
    else await audio.start();
  } catch (e) {
    console.warn('音频无法启动', e);
  }
  syncSoundUI();
}
soundBtn.addEventListener('click', toggleSound);
heroPlay.addEventListener('click', toggleSound);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.pause();
  else audio.resume();
});

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
const presetBtns = $$('.presets button');
const glowCtl = bindRange('glow', (v) => {
  const g = v / 100;
  if (field) field.setGlow(g);
  applyNeon(g);
  presetBtns.forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.glow) === v)));
});
presetBtns.forEach((b) =>
  b.addEventListener('click', () => {
    glowCtl.input.value = b.dataset.glow;
    glowCtl.update();
    saveSettings();
  }),
);
bindRange('accent', (v) => {
  if (field) field.uniforms.uAccent.value = v / 100;
});
bindRange('psize', (v) => {
  if (field) field.uniforms.uSize.value = BASE_SIZE * (v / 100);
});
bindRange('vol', (v) => audio.setVolume(v / 100));

const fontSel = $('#font');
fontSel.value = settings.font;
function applyFont(name) {
  document.documentElement.style.setProperty(
    '--font-display',
    `'${name}', 'Anton', 'Bebas Neue', Impact, 'Arial Narrow Bold', sans-serif`,
  );
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`100px "${name}"`).then(fitTitles, fitTitles);
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
  if (!field) return;
  const [hw, hh] = field.visibleHalfSize();
  const portrait = innerWidth <= 820 || hw / hh < 1.05;
  layout = sections.map((sec, i) => {
    const side = sec.dataset.side;
    const fit = SHAPES[i].fit || 1;
    const outro = i === S - 1;
    if (portrait) {
      const s = Math.min(1, hw / 2.6) * fit;
      return { x: 0, y: i === 0 ? hh * 0.08 : outro ? hh * 0.5 : hh * 0.36, s: s * 0.92 };
    }
    const s = Math.min(1.05, hh / 3.5) * fit;
    const dx = (SHAPES[i].dx || 0) * s;
    if (side === 'left') return { x: hw * 0.43 + dx, y: 0, s };
    if (side === 'right') return { x: -hw * 0.43 + dx, y: 0, s };
    return { x: 0, y: outro ? hh * 0.5 : 0, s };
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

let ready = 0; // 已生成的形态数量
let introT = -1;
async function generateAll() {
  for (let i = 0; i < S; i++) {
    const { pos, col } = generateShape(i, COUNT);
    field.setShape(i, pos, col);
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

// ---------- 指针 ----------
const mouse = { x: 9, y: 9, on: 0, last: -10, px: 0, py: 0 };
addEventListener(
  'pointermove',
  (e) => {
    mouse.px = (e.clientX / innerWidth) * 2 - 1;
    mouse.py = -((e.clientY / innerHeight) * 2 - 1);
    if (e.pointerType === 'touch') return;
    mouse.x = mouse.px;
    mouse.y = mouse.py;
    mouse.last = performance.now();
  },
  { passive: true },
);

// ---------- 主循环 ----------
let cur = 0;
let active = -1;
let last = performance.now();
let time = 0;
let beat = 0;
let flash = 0;
let par = { x: 0, y: 0 };

function shapeAngle(i, t) {
  const m = SHAPES[i];
  const rm = reduceMotion ? 0.3 : 1;
  if (m.spin) return wrapAngle(t * m.spin * rm + i);
  return m.base + m.sway * rm * Math.sin(t * 0.22 + i * 1.7);
}

function onSection(i) {
  sections.forEach((s, k) => s.classList.toggle('is-active', k === i));
  dots.forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
  const sec = sections[i];
  hudIdx.textContent = String(i === S - 1 ? 7 : i).padStart(2, '0') + ' / 07';
  hudName.textContent = `${sec.dataset.label} · ${sec.dataset.scale}`;
  hudBar.style.setProperty('--p', (i / (S - 1)) * 100 + '%');
  audio.setLevel(LEVELS[i]);
  if (active !== -1) {
    audio.impact();
    flash = 1;
  }
  active = i;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  time += dt;

  const target = scrollTarget();
  const sec = Math.round(target);
  if (sec !== active) onSection(sec);

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
    U.uTime.value = time;

    const it = introT < 0 ? 0 : Math.min(1, (now - introT) / (reduceMotion ? 800 : 2800));
    U.uIntro.value = 1 - Math.pow(1 - it, 2);

    const hit = audio.pollBeats();
    beat = Math.max(beat * Math.exp(-dt * 7), hit);
    flash *= Math.exp(-dt * 3.2);
    U.uBeat.value = beat;
    U.uFlash.value = flash;

    const idle = (now - mouse.last) / 1000;
    const tgtOn = idle < 1.4 ? 1 : 0;
    U.uMouseOn.value += (tgtOn - U.uMouseOn.value) * (1 - Math.exp(-dt * 4));
    U.uMouse.value.set(mouse.x, mouse.y);
    par.x += (mouse.px - par.x) * (1 - Math.exp(-dt * 2));
    par.y += (mouse.py - par.y) * (1 - Math.exp(-dt * 2));

    const la = layout[from] || { x: 0, y: 0, s: 1 };
    const lb = layout[to] || la;
    const g = field.group;
    g.position.x = lerp(la.x, lb.x, mix);
    g.position.y = lerp(la.y, lb.y, mix);
    g.scale.setScalar(lerp(la.s, lb.s, mix) * (1 + beat * 0.012));
    g.rotation.y = lerpAngle(shapeAngle(from, time), shapeAngle(to, time), mix) + par.x * 0.22;
    g.rotation.x = lerp(SHAPES[from].tilt, SHAPES[to].tilt, mix) - par.y * 0.12;

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
