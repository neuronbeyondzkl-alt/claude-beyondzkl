// 神经主题交互：
//  · 点击 = 超阈值的电流注入：树突上是递减的分级电位，到胞体 / 轴突起始段再生为全或无的动作电位，沿轴突全幅传到下一个神经元
//  · 点击频率用指数核估计（与电生理里估计瞬时放电率的方法相同）；频率越高，在途与全局的电流流速都越快
//  · 悬停 = 阈下分级电位：会时间总和，但永远不越过阈值；只有点击才产生峰电位
//  · 膜电位示波器、导航上的跳跃式传导、刺激点涟漪、高频刺激诱导 LTP 的提示

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const UI_SEL = 'a,button,input,select,label,textarea,.panel,.topbar,.dots,.hud';

export function createInteractions({ field, audio, dots, reduceMotion, accent, shapeMeta, currentShape, onLtp }) {
  const fire = { last: -1, rate: 0, rateSlow: 0, k: 0, M: 0, spikes: [], ltpCool: 0, ltp: 0 };
  const hov = { x: 9, y: 9, on: 0, onTarget: 0, V: 0, speed: 0, lastMove: -10, lastT: 0, phase: 0 };
  let lastMs = -1; // 上一帧的时间戳（毫秒），用于按真实时间衰减放电频率
  let phase = 0;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const wideScreen = matchMedia('(min-width: 821px)');

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
  let arcVal = -1;
  const toast = document.getElementById('ltpToast');
  const vm = document.getElementById('vm');
  const vmRead = document.getElementById('vmRead');
  const vmCtx = vm ? vm.getContext('2d') : null;
  const hoverHist = []; // [t, V]
  const trail = []; // 增强尾迹（短时增强，示意）：[x, y, s0, t]

  // ---------- 指针 ----------
  const toNdc = (e) => [(e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1)];
  const overUi = (e) => !!(e.target && e.target.closest && e.target.closest(UI_SEL));

  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      const [x, y] = toNdc(e);
      const t = performance.now() / 1000;
      const dt = Math.max(1e-3, t - hov.lastT);
      const d = Math.hypot(x - hov.x, y - hov.y);
      hov.speed = hov.speed * 0.7 + (d / dt) * 0.3;
      if (d > 0.02) hov.lastMove = t;
      hov.lastT = t;
      hov.x = x;
      hov.y = y;
      const onT = overUi(e) ? 0 : 1;
      // 光标离开画布（移到按钮/面板上）时截断尾迹，否则回来时会连出一条横跨屏幕的光弦
      if (!onT && hov.onTarget) trail.length = 0;
      hov.onTarget = onT;
      const lastP = trail[0];
      const asp = innerWidth / innerHeight;
      if (hov.onTarget && (!lastP || Math.hypot((x - lastP[0]) * asp, y - lastP[1]) >= 0.03)) {
        trail.unshift([x, y, 0.55 + 0.45 * Math.min(1, hov.speed / 1.5), t]);
        if (trail.length > 16) trail.pop();
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
    trail.length = 0;
    bouton.classList.remove('show');
  });
  addEventListener('blur', () => {
    hov.onTarget = 0;
    trail.length = 0;
  });

  // 首页快速连点时不要选中文字；其他层级的正文与文献仍可双击/三击选中复制
  addEventListener('mousedown', (e) => {
    if (e.detail >= 2 && !overUi(e) && !(e.target.closest && e.target.closest('.sec:not(.hero) .sec-inner'))) e.preventDefault();
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
        hov.lastMove = hov.lastT = performance.now() / 1000; // 触屏没有 pointermove：在这里重置“适应”
        hov.V = Math.max(hov.V, 0.6);
        stimulate(e.clientX, e.clientY);
      }
      touchDown = null;
    },
    { passive: true },
  );
  addEventListener('pointercancel', () => (touchDown = null));

  // ---------- 刺激（点击） ----------
  let quietUntil = 0;
  function stimulate(cx, cy) {
    const now = performance.now() / 1000;
    const isi = now - fire.last;
    if (fire.last > 0 && isi < 0.035) {
      ring(cx, cy, true); // 点击防抖（示意绝对不应期；真实的约 1–2 ms）：没有动作电位
      return;
    }
    fire.last = now;
    quietUntil = now + 3;
    fire.rate = Math.min(14, fire.rate + 1 / 0.9);
    fire.rateSlow += 1 / 3.0;
    // 相对不应期：紧跟上一个峰电位的刺激幅度稍低
    let amp = isi < 1 ? 1 - 0.35 * Math.exp(-isi / 0.15) : 1;
    if (reduceMotion) amp *= 0.6;
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
    if (hit.path >= 0) {
      // 衰减放慢：动作电位在轴突上是全幅、不递减的，强度只随时间缓慢收尾；树突上的递减由着色器按距离计算
      // 点在树突上：分级电位以 3 倍速电紧张性地扩布到本神经元的胞体，再在那里发放
      const toSoma = hit.dend && hit.somaPath > hit.path ? hit.somaPath : -1;
      field.emitWave(hit.p, { strength: amp, seedPath: hit.path, gate: true, decay: 0.16, ceil: field.bandTop(hit.shape, hit.path), fastUntil: toSoma, fastMul: 3 });
    } else {
      field.emitWave(hit.p, { strength: amp, seedPath: -1, gate: true });
    }
  }

  function ring(cx, cy, refractory) {
    const el = stims[stimIdx];
    stimIdx = (stimIdx + 1) % stims.length;
    el.className = refractory ? 'stim refr' : 'stim';
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    if (!el.animate) return;
    if (reduceMotion) {
      el.animate(
        [
          { opacity: 1, transform: 'translate(-50%, -50%) scale(0.3)' },
          { opacity: 0, transform: 'translate(-50%, -50%) scale(0.3)' },
        ],
        { duration: 300 },
      );
      return;
    }
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

  // ---------- 提示 ----------
  let toastTimer = 0;
  function showToast(html, ms) {
    // 提示框始终在无障碍树里（只靠透明度隐藏），内容更新时读屏软件才会播报
    toast.innerHTML = html;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, ms);
  }

  // ---------- 导航：结间髓鞘 + 跳跃式传导 ----------
  const railAp = document.createElement('li');
  railAp.className = 'rail-ap';
  railAp.setAttribute('aria-hidden', 'true');
  dots[0].closest('ol').appendChild(railAp);
  let railAnim = null;
  let railYs = [];
  function measureRail() {
    const ol = railAp.parentElement.getBoundingClientRect();
    railYs = dots.map((d) => {
      const r = d.getBoundingClientRect();
      return r.top + r.height / 2 - ol.top;
    });
  }
  const railTimers = [];
  function hopRail(from, to) {
    if (reduceMotion || !railAp.animate || from === to || from < 0) return;
    if (railYs.length !== dots.length) measureRail();
    const ys = railYs;
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
    while (railTimers.length) clearTimeout(railTimers.pop());
    seq.forEach((i) => {
      frames.push({ transform: `translateY(${ys[i]}px)`, opacity: 1, offset: t / total });
      const node = dots[i];
      railTimers.push(
        setTimeout(() => {
          node.classList.add('node-flash');
          setTimeout(() => node.classList.remove('node-flash'), 140);
        }, t),
      );
      t += hold;
      frames.push({ transform: `translateY(${ys[i]}px)`, opacity: 1, offset: t / total });
      t += jump;
    });
    frames.push({ transform: `translateY(${ys[to]}px)`, opacity: 0, offset: 1 });
    if (railAnim) railAnim.cancel();
    railAnim = railAp.animate(frames, { duration: total, easing: 'linear' });
  }

  // ---------- 膜电位示波器 ----------
  let scopeW = 0;
  let scopeH = 0;
  let lastDrawV = NaN;
  let lastRead = 0;
  function measureScope() {
    if (!vm) return;
    scopeW = vm.clientWidth;
    scopeH = vm.clientHeight;
    const dpr = Math.min(2, devicePixelRatio || 1);
    vm.width = Math.max(1, Math.round(scopeW * dpr));
    vm.height = Math.max(1, Math.round(scopeH * dpr));
    vmCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastDrawV = NaN;
  }
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
  function drawScope(now, hoverV) {
    if (!vmCtx || !wideScreen.matches) return;
    if (!scopeW) measureScope();
    // 只有最近 2.2 秒内有放电，或阈下膜电位变化时才重画
    const recentSpike = fire.spikes.length && now - fire.spikes[fire.spikes.length - 1] < 2.2;
    if (!recentSpike && Math.abs(hoverV - lastDrawV) < 0.002) return;
    lastDrawV = hoverV;
    const c = vmCtx;
    const W = scopeW;
    const H = scopeH;
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
    const vs = [];
    for (let x = W; x >= 0; x--) {
      const t = now - win * (1 - x / W);
      vs.push([x, vmAt(t, hoverAt(t)) + Math.sin(t * 91.7) * 0.25 + Math.sin(t * 57.3) * 0.2]);
    }
    vs.reverse();
    // 两条路径一次画完：0 mV 以下为蓝色，峰电位顶端为琥珀色（色彩丰富度为 0 时为浅蓝）
    c.lineWidth = 1.2;
    c.strokeStyle = '#9fbdda';
    c.beginPath();
    vs.forEach(([x, v], i) => (i ? c.lineTo(x, y(Math.min(v, 0))) : c.moveTo(x, y(Math.min(v, 0)))));
    c.stroke();
    c.lineWidth = 1.5;
    c.strokeStyle = accent() > 0.05 ? '#f0b46a' : '#ccdbeb';
    c.beginPath();
    let pen = false;
    for (const [x, v] of vs) {
      if (v > 0) {
        if (!pen) c.moveTo(x, y(0));
        c.lineTo(x, y(v));
        pen = true;
      } else if (pen) {
        c.lineTo(x, y(0));
        pen = false;
      }
    }
    c.stroke();
    // 放电栅格
    c.strokeStyle = '#6c9ac4';
    c.beginPath();
    for (const s of fire.spikes) {
      const x = W * (1 - (now - s) / win);
      if (x < 0) continue;
      c.moveTo(x, H - 3);
      c.lineTo(x, H);
    }
    c.stroke();
  }
  function updateReadout(now, hoverV) {
    if (!vmRead || !wideScreen.matches || now - lastRead < 0.1) return;
    lastRead = now;
    const v = vmAt(now, hoverV);
    vmRead.textContent = `${v >= 0 ? '+' : '−'}${Math.abs(Math.round(v))} mV · ${fire.rate.toFixed(1)} Hz · 流速 ×${(1 + 2.2 * fire.k).toFixed(1)}`;
  }

  addEventListener('resize', () => {
    railYs = [];
    scopeW = 0;
  });

  // ---------- 形态波：首次放电 / 点火 / LTP ----------
  function sourceWave(idx, opts) {
    const m = shapeMeta(idx);
    if (!field || !m) return;
    if (m.directional) {
      field.emitWave(m.source.p, { gate: true, seedPath: m.source.path, ceil: field.bandTop(idx, m.source.path), ...opts });
    } else {
      field.emitWave(m.centroid || [0, 0, 0], { seedPath: -1, gate: true, ...opts, strength: (opts.strength || 0.75) * 0.8 });
    }
  }

  // ---------- 每帧 ----------
  let nextSpont = 5;
  function update(dt, now) {
    const t = now / 1000;
    // 放电频率按真实时间衰减（帧时间会被截到 50 ms，掉帧时用它会让频率估计偏高、低频区失去分辨）
    const realDt = lastMs < 0 ? dt : Math.min(30, Math.max(0, (now - lastMs) / 1000));
    lastMs = now;
    fire.rate *= Math.exp(-realDt / 0.9);
    fire.rateSlow *= Math.exp(-realDt / 3.0);
    // 兴奋度 k：1 Hz ≈ 0.25，2 Hz ≈ 0.44，4 Hz ≈ 0.68，8 Hz ≈ 0.90；上升快（60 ms）、回落慢（0.5 s）
    let kT = 1 - Math.exp(-fire.rate / 3.5);
    if (reduceMotion) kT = Math.min(kT, 0.5);
    fire.k += (kT - fire.k) * (1 - Math.exp(-dt / (kT > fire.k ? 0.06 : 0.5)));
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
    const presence = hov.onTarget * (stillFor > 2.5 ? 0.3 : 1);
    hov.on += (presence - hov.on) * (1 - Math.exp(-dt / 0.25));
    hov.phase = (hov.phase + dt * 1.8) % 1;
    hoverHist.push([t, hoverV]);
    while (hoverHist.length && hoverHist[0][0] < t - 2.2) hoverHist.shift();
    if (finePointer && boutonArc) {
      const v = Math.round(69.1 * (1 - Math.min(1, hoverV / 0.85)));
      if (v !== arcVal) {
        arcVal = v;
        boutonArc.style.strokeDashoffset = String(v);
      }
    }

    // 高频刺激（示意）→ LTP：神经突整体增强并沿生理方向放电一次，标题短暂增亮；不做全屏闪光
    fire.ltpCool -= dt;
    fire.ltp *= Math.exp(-dt / 2.5);
    if (fire.M > 0.75 && fire.ltpCool <= 0) {
      fire.ltpCool = 8;
      fire.ltp = 1;
      showToast('<b>高频刺激 → 诱导 LTP</b><span>示意：真实实验常用 100 Hz 强直刺激或 θ 节律串刺激</span>', 3200);
      sourceWave(currentShape(), { strength: 0.9, vMul: 2 });
      if (onLtp) onLtp();
    }

    if (field) {
      const U = field.uniforms;
      // 全局电流相位积分：点击越快流速越快，没有跳变；按 256 取模保持浮点精度
      phase = (phase + dt * 0.55 * (1 + 2.2 * k)) % 256;
      U.uPhase.value = phase;
      U.uDrive.value = k;
      U.uSparkGain.value = 1 + 0.8 * k;
      U.uWaveSharp.value = 30 / (1 + 1.2 * k);
      U.uCaGain.value = 0.6 + 0.5 * k;
      U.uLTP.value = fire.ltp;
      U.uHoverV.value = hoverV;
      U.uHovPhase.value = hov.phase;
      U.uMouse.value.set(hov.x, hov.y);
      U.uMouseOn.value = reduceMotion ? hov.on * 0.6 : hov.on;
      // 上传尾迹：强度按 exp(-age/1.6) 衰减，太弱的点丢弃
      while (trail.length && trail[trail.length - 1][2] * Math.exp(-(t - trail[trail.length - 1][3]) / 1.6) < 0.02) trail.pop();
      const TR = U.uTrail.value;
      for (let i = 0; i < TR.length; i++) {
        const p = trail[i];
        if (p) TR[i].set(p[0], p[1], p[2] * Math.exp(-(t - p[3]) / 1.6), 0);
        else TR[i].set(0, 0, 0, 0);
      }
      const shape = currentShape();
      const vPath = 1.6 + 8.4 * k;
      field.stepWaves(dt, vPath, shape === 0 ? 1.0 : 1.3);
      // 自发活动：泊松过程（平均 5 秒一次）；点击后 3 秒内静默；首页从某个胞体发放，其余形态为一圈小的去极化
      nextSpont -= dt;
      if (nextSpont <= 0) {
        nextSpont = -Math.log(1 - Math.random()) * 5;
        if (!reduceMotion && !document.hidden && t > quietUntil) {
          const m = shapeMeta(shape);
          if (shape === 0 && m && m.somata) {
            const sm = m.somata[Math.floor(Math.random() * Math.min(7, m.somata.length))];
            field.emitWave(sm.p, { strength: 0.32, seedPath: sm.path, gate: true, ceil: field.bandTop(0, sm.path) });
          } else field.emitWave(field.randomLocal(), { strength: 0.32, seedPath: -1, gate: true });
        }
      }
    }
    drawScope(t, hoverV);
    updateReadout(t, hoverV);
  }

  return {
    update,
    hopRail,
    // 形态稳定后：结构按自己的生理方向“首次放电”（树突→胞体→轴突、EC→DG→CA3→CA1、脑→脊髓→四肢）
    arrive(idx) {
      sourceWave(idx, { strength: reduceMotion ? 0.38 : 0.75, vMul: 1.6, gateR0: 0.4 });
    },
    // 首页点火：第一束放电从最左上方的 L2/3 神经元出发，依次点燃 L → C → R
    ignite() {
      sourceWave(0, { strength: 0.9, vMul: 3, decay: 0.12, life: 9 });
    },
    get k() {
      return fire.k;
    },
  };
}
