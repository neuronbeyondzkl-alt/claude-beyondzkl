// 神经主题交互：
//  · 点击 = 超阈值的电流注入 → 全或无的动作电位，从被点中的神经突出发，沿“树突→胞体→轴突→下一个神经元”顺向传播
//  · 点击频率用指数核估计（与电生理里估计瞬时放电率的方法相同）；频率越高，在途与全局的电流流速都越快
//  · 悬停 = 阈下分级电位：会时间总和，但永远不越过阈值；只有点击才产生峰电位
//  · 膜电位示波器、导航上的跳跃式传导、刺激点涟漪、高频刺激诱导 LTP 的提示

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const UI_SEL = 'a,button,input,select,label,textarea,.panel,.topbar,.dots';

export function createInteractions({ field, audio, sections, dots, reduceMotion, accent }) {
  const fire = { last: -1, rate: 0, rateSlow: 0, k: 0, M: 0, drive: 0, spikes: [], ltpCool: 0 };
  const hov = { x: 9, y: 9, on: 0, onTarget: 0, V: 0, speed: 0, lastMove: 0, still: 0, px: 0, py: 0, lastT: 0 };
  let phase = 0;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // ---------- DOM ----------
  const stimLayer = document.getElementById('stimLayer');
  const stims = Array.from({ length: 8 }, () => {
    const el = document.createElement('i');
    el.className = 'stim';
    stimLayer.appendChild(el);
    return el;
  });
  let stimIdx = 0;
  const bouton = document.getElementById('bouton');
  const boutonArc = bouton.querySelector('.b-arc');
  const toast = document.getElementById('ltpToast');
  const vm = document.getElementById('vm');
  const vmRead = document.getElementById('vmRead');
  const vmCtx = vm ? vm.getContext('2d') : null;
  const hoverHist = []; // [t, V]
  const trail = []; // 赫布尾迹：[x, y, s0, t]

  // ---------- 指针 ----------
  const toNdc = (e) => [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
  const overUi = (e) => !!(e.target && e.target.closest && e.target.closest(UI_SEL));

  addEventListener(
    'pointermove',
    (e) => {
      const [x, y] = toNdc(e);
      hov.px = x;
      hov.py = y;
      if (e.pointerType === 'touch') return;
      const t = performance.now() / 1000;
      const dt = Math.max(1e-3, t - hov.lastT);
      const d = Math.hypot(x - hov.x, y - hov.y);
      hov.speed = hov.speed * 0.7 + (d / dt) * 0.3;
      if (d > 0.02) hov.lastMove = t;
      hov.lastT = t;
      hov.x = x;
      hov.y = y;
      hov.onTarget = overUi(e) ? 0 : 1;
      const lastP = trail[0];
      if (hov.onTarget && (!lastP || Math.hypot(x - lastP[0], y - lastP[1]) > 0.015)) {
        trail.unshift([x, y, 0.55 + 0.45 * Math.min(1, hov.speed / 1.5), t]);
        if (trail.length > 20) trail.pop();
      }
      if (finePointer && !reduceMotion) {
        bouton.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        bouton.classList.toggle('show', hov.onTarget === 1);
      }
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => {
    hov.onTarget = 0;
    bouton.classList.remove('show');
  });
  addEventListener('blur', () => (hov.onTarget = 0));

  // 快速连点时不要选中段落文字
  addEventListener('mousedown', (e) => {
    if (e.detail >= 2 && !overUi(e)) e.preventDefault();
  });

  let touchDown = null;
  addEventListener(
    'pointerdown',
    (e) => {
      if (overUi(e)) return;
      if (e.pointerType === 'touch') {
        touchDown = { x: e.clientX, y: e.clientY, t: performance.now() };
        return;
      }
      if (e.button !== 0) return;
      stimulate(e.clientX, e.clientY);
    },
    { passive: true },
  );
  addEventListener(
    'pointerup',
    (e) => {
      if (e.pointerType !== 'touch' || !touchDown) return;
      const moved = Math.hypot(e.clientX - touchDown.x, e.clientY - touchDown.y);
      if (moved < 10 && performance.now() - touchDown.t < 300) {
        // 触屏轻点：同时在指尖处短暂显示分级电位场
        const [x, y] = toNdc(e);
        hov.x = x;
        hov.y = y;
        hov.on = 1;
        hov.V = Math.max(hov.V, 0.6);
        stimulate(e.clientX, e.clientY);
      }
      touchDown = null;
    },
    { passive: true },
  );
  addEventListener('pointercancel', () => (touchDown = null));

  // ---------- 刺激（点击） ----------
  function stimulate(cx, cy) {
    const now = performance.now() / 1000;
    const isi = now - fire.last;
    if (fire.last > 0 && isi < 0.035) {
      ring(cx, cy, true); // 绝对不应期：没有动作电位
      return;
    }
    fire.last = now;
    fire.rate += 1 / 0.9;
    fire.rateSlow += 1 / 3.0;
    // 相对不应期：紧跟上一个峰电位的刺激幅度稍低
    const amp = isi < 1 ? 1 - 0.35 * Math.exp(-isi / 0.15) : 1;
    fire.spikes.push(now);
    if (fire.spikes.length > 40) fire.spikes.shift();
    ring(cx, cy, false);
    bouton.classList.remove('fire');
    void bouton.offsetWidth;
    bouton.classList.add('fire');
    audio.spike(fire.rate);
    if (!field) return;
    const [nx, ny] = [(cx / innerWidth) * 2 - 1, -((cy / innerHeight) * 2 - 1)];
    const hit = field.pickLocal(nx, ny, 0.14);
    field.emitWave(hit.p, { strength: amp, seedPath: hit.path >= 0 ? hit.path : -1, gate: true });
  }

  function ring(cx, cy, refractory) {
    const el = stims[stimIdx];
    stimIdx = (stimIdx + 1) % stims.length;
    el.className = refractory ? 'stim refr' : 'stim';
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    if (reduceMotion || !el.animate) return;
    const dur = 420 - 200 * fire.k;
    const r = 56 - 16 * fire.k;
    el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 1 },
        { transform: `translate(-50%, -50%) scale(${r / 28})`, opacity: 0 },
      ],
      { duration: dur, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
    );
  }

  // ---------- 高频刺激 → LTP 提示 ----------
  let toastTimer = 0;
  function showToast(html, ms) {
    toast.innerHTML = html;
    toast.hidden = false;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => (toast.hidden = true), 400);
    }, ms);
  }

  // ---------- 导航：结间髓鞘 + 跳跃式传导 ----------
  const railAp = document.createElement('li');
  railAp.className = 'rail-ap';
  railAp.setAttribute('aria-hidden', 'true');
  dots[0].closest('ol').appendChild(railAp);
  let railAnim = null;
  function hopRail(from, to) {
    if (reduceMotion || !railAp.animate || from === to || from < 0) return;
    const ol = railAp.parentElement.getBoundingClientRect();
    const ys = dots.map((d) => {
      const r = d.getBoundingClientRect();
      return r.top + r.height / 2 - ol.top;
    });
    const step = from < to ? 1 : -1;
    const seq = [];
    for (let i = from; ; i += step) {
      seq.push(i);
      if (i === to) break;
    }
    // 动作电位在每个郎飞结停留一瞬，再跳到下一个结；点击越快跳得越快
    const hold = 40 * (1.4 - 0.9 * fire.k);
    const jump = 30 * (1.4 - 0.9 * fire.k);
    const total = seq.length * (hold + jump) + 200;
    const frames = [];
    let t = 0;
    seq.forEach((i) => {
      frames.push({ transform: `translateY(${ys[i]}px)`, opacity: 1, offset: t / total });
      const node = dots[i];
      setTimeout(() => {
        node.classList.add('node-flash');
        setTimeout(() => node.classList.remove('node-flash'), 140);
      }, t);
      t += hold;
      frames.push({ transform: `translateY(${ys[i]}px)`, opacity: 1, offset: t / total });
      t += jump;
    });
    frames.push({ transform: `translateY(${ys[to]}px)`, opacity: 0, offset: 1 });
    if (railAnim) railAnim.cancel();
    railAnim = railAp.animate(frames, { duration: total, easing: 'linear' });
  }

  // ---------- 膜电位示波器 ----------
  function vmAt(t, hoverV) {
    // 最近一次峰电位的模板：上升 25 ms 到 +40 mV，60 ms 复极到 −80 mV，后超极化按 τ = 0.3 s 恢复
    let last = -1;
    for (let i = fire.spikes.length - 1; i >= 0; i--) {
      if (fire.spikes[i] <= t) {
        last = fire.spikes[i];
        break;
      }
    }
    const rest = -70 + 13 * hoverV;
    if (last < 0) return rest;
    const s = t - last;
    if (s < 0.025) return rest + (40 - rest) * (s / 0.025);
    if (s < 0.085) return 40 - 120 * ((s - 0.025) / 0.06);
    return rest + (-80 - rest) * Math.exp(-(s - 0.085) / 0.3);
  }

  function drawScope(now) {
    if (!vmCtx || vm.offsetParent === null) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    const W = vm.clientWidth;
    const H = vm.clientHeight;
    if (vm.width !== Math.round(W * dpr)) {
      vm.width = Math.round(W * dpr);
      vm.height = Math.round(H * dpr);
    }
    const c = vmCtx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    const plotH = H - 5;
    const y = (v) => 1 + ((45 - v) / 135) * (plotH - 2);
    c.lineWidth = 1;
    c.strokeStyle = '#376392';
    c.beginPath();
    c.moveTo(0, y(-70));
    c.lineTo(W, y(-70));
    c.stroke();
    c.setLineDash([3, 3]);
    c.strokeStyle = '#2e5076';
    c.beginPath();
    c.moveTo(0, y(-55));
    c.lineTo(W, y(-55));
    c.stroke();
    c.setLineDash([]);
    const win = 2.0;
    let hi = hoverHist.length - 1;
    const hoverAt = (t) => {
      while (hi > 0 && hoverHist[hi][0] > t) hi--;
      return hoverHist.length ? hoverHist[Math.max(0, hi)][1] : 0;
    };
    const pts = [];
    for (let x = W; x >= 0; x--) {
      const t = now - win * (1 - x / W);
      const noise = Math.sin(t * 91.7) * 0.25 + Math.sin(t * 57.3) * 0.2;
      pts.push([x, vmAt(t, hoverAt(t)) + noise]);
    }
    pts.reverse();
    const warm = accent() > 0.05 ? '#f0b46a' : '#ccdbeb';
    for (let i = 1; i < pts.length; i++) {
      const [x0, v0] = pts[i - 1];
      const [x1, v1] = pts[i];
      c.strokeStyle = v1 > 0 || v0 > 0 ? warm : '#9fbdda';
      c.lineWidth = v1 > 0 || v0 > 0 ? 1.5 : 1.2;
      c.beginPath();
      c.moveTo(x0, y(v0));
      c.lineTo(x1, y(v1));
      c.stroke();
    }
    // 放电栅格
    c.strokeStyle = '#6c9ac4';
    for (const s of fire.spikes) {
      const x = W * (1 - (now - s) / win);
      if (x < 0) continue;
      c.beginPath();
      c.moveTo(x, H - 3);
      c.lineTo(x, H);
      c.stroke();
    }
    const v = vmAt(now, hoverHist.length ? hoverHist[hoverHist.length - 1][1] : 0);
    vmRead.textContent = `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))} mV · ${fire.rate.toFixed(1)} Hz · 流速 ×${(1 + 2.2 * fire.k).toFixed(1)}`;
  }

  // ---------- 每帧 ----------
  let nextSpont = 4;
  function update(dt, now) {
    const t = now / 1000;
    fire.rate *= Math.exp(-dt / 0.9);
    fire.rateSlow *= Math.exp(-dt / 3.0);
    fire.k = smoothstep(0.6, 8.0, fire.rate);
    // 放电驱动：上升快（τ 0.06 s）、回落慢（τ 0.5 s），停止点击约 2.5 秒后回到基线
    const dTarget = 1 - Math.exp(-fire.rate / 3.5);
    fire.drive += (dTarget - fire.drive) * (1 - Math.exp(-dt / (dTarget > fire.drive ? 0.06 : 0.5)));
    fire.M = smoothstep(2.0, 6.0, fire.rateSlow);
    const k = fire.k;

    // 悬停的膜电位：漏积分器（τm = 0.5 s），越静止总和越多，上限为阈值的 0.85；长时间不动会“适应”
    hov.speed *= Math.exp(-dt * 6);
    const inside = hov.onTarget > 0;
    const drive = inside ? 0.85 * Math.exp(-hov.speed / 1.2) : 0;
    hov.V += (drive - hov.V) * (1 - Math.exp(-dt / 0.5));
    const stillFor = t - hov.lastMove;
    const accom = stillFor > 6 ? Math.exp(-(stillFor - 6) / 4) : 1;
    const hoverV = hov.V * (0.3 + 0.7 * accom);
    hov.on += (Math.max(hov.onTarget, 0) - hov.on) * (1 - Math.exp(-dt / 0.25));
    hoverHist.push([t, hoverV]);
    while (hoverHist.length && hoverHist[0][0] < t - 2.2) hoverHist.shift();
    if (finePointer && boutonArc) boutonArc.style.strokeDashoffset = String(69.1 * (1 - Math.min(1, hoverV / 0.85)));

    // 高频刺激（示意）→ LTP
    fire.ltpCool -= dt;
    let ltp = false;
    if (fire.M > 0.75 && fire.ltpCool <= 0) {
      fire.ltpCool = 8;
      ltp = true;
      showToast('<b>高频刺激 → 诱导 LTP</b><span>示意：真实实验常用 100 Hz 强直刺激或 θ 节律串刺激</span>', 3200);
      if (field) field.emitWave([0, 0, 0], { strength: 0.9, seedPath: 0, gate: false });
    }

    if (field) {
      const U = field.uniforms;
      // 全局电流相位积分：点击越快流速越快，没有跳变；按 256 取模保持浮点精度
      phase = (phase + dt * 0.55 * (1 + 2.2 * k)) % 256;
      U.uPhase.value = phase;
      U.uSparkGain.value = 1 + 0.6 * k;
      U.uCaGain.value = 0.6 + 0.5 * k;
      U.uHoverV.value = hoverV;
      U.uDrive.value = fire.drive;
      // 上传尾迹：强度按 exp(-age/1.6) 衰减，太弱的点丢弃
      while (trail.length && trail[trail.length - 1][2] * Math.exp(-(t - trail[trail.length - 1][3]) / 1.6) < 0.02) trail.pop();
      const TR = U.uTrail.value;
      for (let i = 0; i < 20; i++) {
        const p = trail[i];
        if (p) TR[i].set(p[0], p[1], p[2] * Math.exp(-(t - p[3]) / 1.6), 0);
        else TR[i].set(0, 0, 0, 0);
      }
      U.uMouse.value.set(hov.x, hov.y);
      U.uMouseOn.value = reduceMotion ? hov.on * 0.6 : hov.on;
      const vPath = 1.6 + 8.4 * k;
      field.stepWaves(dt, vPath, vPath * 0.9);
      // 自发活动：偶尔在某处出现一次小的去极化
      nextSpont -= dt;
      if (nextSpont <= 0 && !reduceMotion) {
        nextSpont = 3.5 + Math.random() * 3.5;
        field.emitWave(field.randomLocal(), { strength: 0.32, seedPath: -1, gate: true });
      }
    }
    drawScope(t);
    return { ltp, hoverV };
  }

  return {
    update,
    hopRail,
    // 形态稳定后：结构按自己的生理方向“首次放电”
    firstSpike() {
      if (field) field.emitWave([0, 0, 0], { strength: 0.75, seedPath: 0, gate: false });
    },
    get k() {
      return fire.k;
    },
  };
}
