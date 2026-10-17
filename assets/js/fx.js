// 交互特效：鼠标尾流（生物荧光尾迹）、点击声呐脉冲、火花与气泡。
// 尾迹与点击以 uniform 数组的形式交给粒子着色器和背景后处理；火花与气泡是一套独立的粒子环形缓冲区。
import { BufferGeometry, BufferAttribute, Points, ShaderMaterial, AdditiveBlending, Vector4, Vector2 } from './vendor/three.bundle.min.js';
import { fxVert, fxFrag } from './shaders.js';

const TRAIL = 16;
const CLICKS = 8;
const MAX_FX = 1800;
const TRAIL_LIFE = 1.6;
const CAM_Z = 12;

const hexLin = (h) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
};
// 夜光藻 / 浮游生物的冷色荧光，全部低饱和
const BIO = ['#a9e3da', '#CCDBEB', '#9FBDDA', '#c9bde6', '#dff1ec'].map(hexLin);
const BUBBLE = ['#CCDBEB', '#E8EEF6', '#b9d3e6'].map(hexLin);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rnd = (a, b) => a + Math.random() * (b - a);

export class InteractionFX {
  constructor({ scene, tanHalf, pixelRatio, glow, motion = 1 }) {
    this.tanHalf = tanHalf;
    this.aspect = 1;
    this.motion = motion;
    this.time = 0;

    // ---- 尾迹与点击的 uniform 数组（与粒子 / 背景材质共享同一引用）
    this.uTrail = Array.from({ length: TRAIL }, () => new Vector4(0, 0, 0, 0));
    this.uTrailVel = Array.from({ length: TRAIL }, () => new Vector2(0, 0));
    this.uClick = Array.from({ length: CLICKS }, () => new Vector4(0, 0, -1, 0));
    this.trail = Array.from({ length: TRAIL }, () => ({ x: 0, y: 0, t: -99, speed: 0, vx: 0, vy: 0 }));
    this.clicks = Array.from({ length: CLICKS }, () => ({ x: 0, y: 0, t: -99, s: 0 }));
    this.trailHead = 0;
    this.clickHead = 0;
    this.last = null;      // 上一次指针采样
    this.vel = { x: 0, y: 0 };
    this.energy = 0;       // 连击能量：点得越快越高
    this.shake = 0;
    this.sparkAcc = 0;

    // ---- 火花 / 气泡粒子
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(MAX_FX * 3), 3));
    this.aP = new BufferAttribute(new Float32Array(MAX_FX * 3), 3);
    this.aV = new BufferAttribute(new Float32Array(MAX_FX * 3), 3);
    this.aT = new BufferAttribute(new Float32Array(MAX_FX * 4), 4);
    this.aC = new BufferAttribute(new Float32Array(MAX_FX * 3), 3);
    [['aP', this.aP], ['aV', this.aV], ['aT', this.aT], ['aC', this.aC]].forEach(([n, a]) => g.setAttribute(n, a));
    this.mat = new ShaderMaterial({
      vertexShader: fxVert, fragmentShader: fxFrag,
      transparent: true, depthWrite: false, depthTest: false, blending: AdditiveBlending, premultipliedAlpha: true,
      uniforms: { uTime: { value: 0 }, uPixelRatio: { value: pixelRatio }, uGlow: { value: glow } },
    });
    this.points = new Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    scene.add(this.points);
    this.head = 0;
    this.dirty = false;
  }

  setAspect(a) { this.aspect = a; }
  setGlow(g) { this.mat.uniforms.uGlow.value = g; }

  // 屏幕坐标 → NDC
  ndc(cx, cy) { return [(cx / innerWidth) * 2 - 1, -((cy / innerHeight) * 2 - 1)]; }
  // NDC → 指定深度平面上的世界坐标
  world(nx, ny, z) {
    const d = CAM_Z - z;
    return [nx * this.tanHalf * this.aspect * d, ny * this.tanHalf * d, z];
  }

  spawn(p, v, life, size, col, type) {
    const i = this.head;
    this.head = (this.head + 1) % MAX_FX;
    this.aP.array.set(p, i * 3);
    this.aV.array.set(v, i * 3);
    this.aT.array.set([this.time, life, size, type], i * 4);
    this.aC.array.set(col, i * 3);
    this.dirty = true;
  }

  sparksAt(nx, ny, n, speed, life = [0.9, 1.7], z = 2.5) {
    for (let k = 0; k < n; k++) {
      const p = this.world(nx, ny, z + rnd(-1.2, 1.2));
      const a = Math.random() * Math.PI * 2, s = speed * rnd(0.35, 1);
      this.spawn([p[0] + rnd(-0.08, 0.08), p[1] + rnd(-0.08, 0.08), p[2]], [Math.cos(a) * s, Math.sin(a) * s, rnd(-0.3, 0.3) * s],
        rnd(life[0], life[1]), rnd(2.4, 4.6), pick(BIO), speed > 0.5 ? 2 : 0);
    }
  }

  bubblesAt(nx, ny, n, spread = 0.12, up = [0.25, 0.7], z = 2.5) {
    for (let k = 0; k < n; k++) {
      const p = this.world(nx + rnd(-spread, spread), ny + rnd(-spread, spread) * this.aspect, z + rnd(-1.5, 1.5));
      this.spawn(p, [rnd(-0.15, 0.15), rnd(up[0], up[1]), 0], rnd(1.8, 3.4), rnd(5, 13), pick(BUBBLE), 1);
    }
  }

  // ---- 指针移动：记录尾迹并撒出夜光浮游生物
  // time：渲染时钟（决定尾迹年龄）；stamp：事件时间戳（秒，用来算速度，不受掉帧影响）
  onPointerMove(cx, cy, time, stamp) {
    const [x, y] = this.ndc(cx, cy);
    const L = this.last;
    if (L) {
      const dt = Math.max(stamp - L.s, 1 / 240);
      const vx = ((x - L.x) * this.aspect) / dt, vy = (y - L.y) / dt;
      this.vel.x += (vx - this.vel.x) * 0.5;
      this.vel.y += (vy - this.vel.y) * 0.5;
      const speed = Math.hypot(this.vel.x, this.vel.y);
      const moved = Math.hypot((x - L.x) * this.aspect, y - L.y);
      if (moved > 0.03 || stamp - L.s > 0.06) {
        const s = this.trail[this.trailHead];
        Object.assign(s, { x, y, t: time, speed: Math.min(speed, 6), vx: this.vel.x, vy: this.vel.y });
        this.trailHead = (this.trailHead + 1) % TRAIL;
        this.sparkAcc += Math.min(speed, 5) * 3.2 * Math.min(stamp - L.s, 0.1);
        while (this.sparkAcc >= 1) { this.sparkAcc -= 1; this.sparksAt(x, y, 1, 0.12, [1.0, 2.0]); }
        this.last = { x, y, s: stamp };
      }
    } else this.last = { x, y, s: stamp };
  }

  onPointerLeave() { this.last = null; }

  // ---- 点击：声呐脉冲 + 迸发；返回本次强度（0.35..3）
  onClick(cx, cy, time) {
    const [x, y] = this.ndc(cx, cy);
    this.energy += 1;
    const s = Math.min(3, 0.35 + 0.42 * this.energy);
    this.pulse(x, y, s, time);
    this.sparksAt(x, y, Math.round(10 + 16 * s), 0.9 + 0.5 * s, [0.8, 1.6]);
    this.bubblesAt(x, y, Math.round(3 + 6 * s));
    if (s > 1.3) this.shake = Math.max(this.shake, 0.035 * (s - 1.1));
    return s;
  }

  pulse(x, y, s, time) {
    const c = this.clicks[this.clickHead];
    Object.assign(c, { x, y, t: time, s });
    this.clickHead = (this.clickHead + 1) % CLICKS;
  }

  // ---- 穿越海面：一大片气泡自下而上
  surfaceBreak() {
    for (let k = 0; k < 150; k++) {
      const p = this.world(rnd(-1.1, 1.1), rnd(-1.4, -0.4), rnd(-3, 5));
      this.spawn(p, [rnd(-0.2, 0.2), rnd(1.6, 3.4), 0], rnd(1.6, 2.8), rnd(4, 14), pick(BUBBLE), 1);
    }
  }

  // ---- 返回海面：持续的上升气泡流
  ascend(seconds = 2.2) {
    const n = 300;
    for (let k = 0; k < n; k++) {
      const delay = (k / n) * seconds;
      const p = this.world(rnd(-1.2, 1.2), rnd(-1.5, 0.2), rnd(-4, 5));
      const i = this.head;
      this.spawn(p, [rnd(-0.25, 0.25), rnd(2.2, 4.2), 0], rnd(1.4, 2.4), rnd(4, 15), pick(BUBBLE), 1);
      this.aT.array[i * 4] = this.time + delay;
    }
  }

  update(time, dt) {
    this.time = time;
    this.energy *= Math.exp(-dt / 0.65);
    this.shake *= Math.exp(-dt * 7);
    for (let k = 0; k < TRAIL; k++) {
      const s = this.trail[k], age = time - s.t;
      if (age > TRAIL_LIFE || s.speed < 0.05) this.uTrail[k].set(0, 0, 0, 0);
      else { this.uTrail[k].set(s.x, s.y, age, s.speed); this.uTrailVel[k].set(s.vx, s.vy); }
    }
    for (let k = 0; k < CLICKS; k++) {
      const c = this.clicks[k], age = time - c.t;
      this.uClick[k].set(c.x, c.y, age > 3.5 ? -1 : age, c.s);
    }
    this.mat.uniforms.uTime.value = time;
    if (this.dirty) {
      this.aP.needsUpdate = this.aV.needsUpdate = this.aT.needsUpdate = this.aC.needsUpdate = true;
      this.dirty = false;
    }
    const a = this.shake * this.motion;
    return a > 0.0005 ? [Math.sin(time * 53) * a, Math.cos(time * 47) * a] : [0, 0];
  }
}
