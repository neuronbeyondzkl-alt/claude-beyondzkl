// 界面层：荧光调节面板、逐字点亮的霓虹标题、自定义光标、水层穿越横幅、首次提示。
const $ = (s, r = document) => r.querySelector(s);

export const store = {
  get(k, d) { try { const v = localStorage.getItem('deep.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('deep.' + k, JSON.stringify(v)); } catch { /* 私密模式等情况下忽略 */ } },
};

// ---------------------------------------------------------------------------
// 荧光调节面板
// ---------------------------------------------------------------------------
const tuneState = { collapse() {} };
export function autoCollapseTune() { tuneState.collapse(); }

export function initTunePanel({ glow, titleGlow, volume, onGlow, onTitleGlow, onVolume }) {
  const btn = $('#tuneBtn'), panel = $('#tunePanel');
  const rows = [
    ['#glow', '#glowOut', glow, onGlow],
    ['#tglow', '#tglowOut', titleGlow, onTitleGlow],
    ['#vol', '#volOut', volume, onVolume],
  ];
  rows.forEach(([inSel, outSel, v, cb]) => {
    const input = $(inSel), out = $(outSel);
    const paint = () => {
      out.textContent = input.value + '%';
      input.style.setProperty('--fill', input.value + '%');
    };
    input.value = Math.round(v * 100);
    paint();
    input.addEventListener('input', () => { paint(); cb(input.value / 100); });
  });

  const narrow = matchMedia('(max-width: 760px)').matches;
  const setOpen = (open, remember = true) => {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (remember) store.set('panelOpen', open);
  };
  // 首次访问：宽屏在首页默认展开；没碰过面板的话，下潜离开首页时自动收起，避免遮挡文案
  const saved = store.get('panelOpen', null);
  setOpen(saved ?? !narrow, saved != null);
  let touched = saved != null;
  tuneState.collapse = () => { if (!touched && !panel.hidden) setOpen(false, false); };
  btn.addEventListener('click', () => { touched = true; setOpen(panel.hidden); });
  panel.addEventListener('input', () => { touched = true; });
  $('#tuneClose').addEventListener('click', () => { touched = true; setOpen(false); btn.focus(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) setOpen(false); });

  // 首次访问时让按钮呼吸发光，提示这里可以调节
  if (!store.get('seenTune', false)) {
    btn.classList.add('is-hint');
    const stop = () => { btn.classList.remove('is-hint'); store.set('seenTune', true); };
    setTimeout(stop, 9000);
    panel.addEventListener('input', stop, { once: true });
    btn.addEventListener('click', stop, { once: true });
  }
}

// ---------------------------------------------------------------------------
// 霓虹标题逐字拆分：每个字母像一支独立的灯管，进入视野时随机次序闪烁点亮
// ---------------------------------------------------------------------------
export function splitNeon() {
  document.querySelectorAll('.neon').forEach((el) => {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((ch) => {
            if (ch === ' ' || ch === '\n') { frag.appendChild(document.createTextNode(' ')); return; }
            const s = document.createElement('span');
            s.className = 'ch';
            s.textContent = ch;
            s.style.setProperty('--r', (Math.random() * 0.9).toFixed(2));
            s.style.setProperty('--i', String(i++));
            s.setAttribute('aria-hidden', 'true');
            frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  });
}

// 偶尔让某一支“灯管”接触不良地闪一下
export function startNeonFlicker(reduceMotion) {
  if (reduceMotion) return;
  const tick = () => {
    const live = [...document.querySelectorAll('.sec.is-in .neon .ch, .zone-banner.show .neon .ch')];
    if (live.length) {
      const c = live[Math.floor(Math.random() * live.length)];
      c.classList.remove('blink');
      void c.offsetWidth;
      c.classList.add('blink');
    }
    setTimeout(tick, 1800 + Math.random() * 3200);
  };
  setTimeout(tick, 3000);
}

// ---------------------------------------------------------------------------
// 自定义光标：一圈潜水灯般的光环 + 中心光点，点击时随连击能量放大
// ---------------------------------------------------------------------------
export function initCursor(reduceMotion) {
  const fine = matchMedia('(pointer: fine)').matches;
  if (!fine) return { pulse() {} };
  const ring = $('#cursorRing'), dot = $('#cursorDot');
  document.body.classList.add('has-cursor');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, shown = false;
  addEventListener('pointermove', (e) => {
    x = e.clientX; y = e.clientY;
    if (!shown) { shown = true; rx = x; ry = y; document.body.classList.add('cursor-on'); }
    const ui = e.target.closest?.('button, a, input, label, .tune');
    ring.classList.toggle('is-ui', !!ui);
    dot.classList.toggle('is-ui', !!ui);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { shown = false; document.body.classList.remove('cursor-on'); });
  const loop = () => {
    const k = reduceMotion ? 1 : 0.22;
    rx += (x - rx) * k; ry += (y - ry) * k;
    ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
    dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    requestAnimationFrame(loop);
  };
  loop();
  return {
    pulse(strength) {
      ring.style.setProperty('--s', (1 + strength * 0.45).toFixed(2));
      ring.classList.remove('pulse');
      void ring.offsetWidth;
      ring.classList.add('pulse');
    },
  };
}

// ---------------------------------------------------------------------------
// 水层穿越横幅
// ---------------------------------------------------------------------------
const ZONE_TEXT = [
  { cn: '透光层', en: 'Epipelagic Zone', range: '0 – 200 m', note: '阳光充足，海洋里的光合作用几乎都发生在这里' },
  { cn: '弱光层', en: 'Mesopelagic Zone', range: '200 – 1,000 m', note: '只剩微弱的蓝光，许多生物开始自己发光' },
  { cn: '无光层', en: 'Bathypelagic Zone', range: '1,000 – 4,000 m', note: '永久黑暗，唯一的光来自生物发光' },
  { cn: '深渊层', en: 'Abyssopelagic Zone', range: '4,000 m 以下', note: '水温接近 0–4 °C，水压超过 400 个大气压' },
];
export function showZoneBanner(zone, deeper) {
  const el = $('#zoneBanner'), z = ZONE_TEXT[zone];
  if (!el || !z) return;
  $('.zb-kicker', el).textContent = deeper ? '下潜进入' : '上浮回到';
  $('.zb-cn', el).textContent = z.cn;
  const en = $('.zb-en', el);
  en.textContent = z.en;
  delete en.dataset.split;
  splitNeon();
  $('.zb-range', el).textContent = z.range;
  $('.zb-note', el).textContent = z.note;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(showZoneBanner.t);
  showZoneBanner.t = setTimeout(() => el.classList.remove('show'), 3200);
}

// 首次提示条
export function toast(text, ms = 5200) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), ms);
}
