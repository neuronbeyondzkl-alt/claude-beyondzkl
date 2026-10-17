// WebGL 粒子场：所有形态存于浮点纹理，顶点着色器按滚动进度在两个形态间插值形变，
// 叠加放电脉冲、点击诱发的动作电位波、悬停的赫布连接触须、节拍脉动与 Unreal Bloom 荧光辉光。

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass.js';

export const BASE_Z = 11;
import { PAL } from './shapes.js';

const vertexShader = /* glsl */ `
uniform sampler2D uPos;
uniform sampler2D uCol;
uniform float uRows;
uniform float uFrom;
uniform float uTo;
uniform float uMix;
uniform float uTime;
uniform float uGlow;
uniform float uAccent;
uniform float uSize;
uniform float uPR;
uniform float uIntro;
uniform float uBeat;
uniform float uFlash;
uniform float uScatter;
uniform float uMotion;
uniform vec2 uMouse;
uniform float uMouseOn;
uniform float uAspect;
uniform float uPhase;
uniform float uSparkGain;
uniform vec4 uWaves[8];
uniform vec4 uWaveQ[8];
uniform float uHoverV;
uniform vec3 uDepolCol;
uniform float uCaGain;
uniform float uDrive;
uniform vec4 uTrail[20];
uniform vec3 uBaseBlue;
uniform vec3 uSparkWarm;
uniform vec3 uSparkCool;

attribute vec2 aRef;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;
varying float vSoft;

vec4 fetchTex(sampler2D t, float s) {
  return texelFetch(t, ivec2(int(aRef.x), int(aRef.y + s * uRows)), 0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec3 flow(vec3 p, float t) {
  return vec3(
    sin(p.y * 1.9 + t * 0.83) + sin(p.z * 2.7 - t * 0.61),
    sin(p.z * 2.1 + t * 0.77) + sin(p.x * 2.3 + t * 0.53),
    sin(p.x * 1.7 - t * 0.69) + sin(p.y * 2.9 + t * 0.47)
  ) * 0.5;
}

void main() {
  vec4 pA = fetchTex(uPos, uFrom);
  vec4 pB = fetchTex(uPos, uTo);
  vec4 cA = fetchTex(uCol, uFrom);
  vec4 cB = fetchTex(uCol, uTo);

  // 每个粒子错开出发，形变呈“流动”
  float st = 0.45;
  float m = clamp(uMix * (1.0 + st) - aRand.x * st, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  float burst = sin(m * 3.14159265);

  vec3 pm = mix(pA.xyz, pB.xyz, m);
  vec3 p = pm;
  vec3 rdir = normalize(aRand.yzw * 2.0 - 1.0 + vec3(1e-4));
  p += rdir * burst * uScatter * (0.35 + aRand.x * 1.2);
  p += flow(p * 0.8 + aRand.xyz * 2.0, uTime * 0.6) * burst * 0.55 * uScatter;
  p += flow(p * 1.3, uTime * 0.35 + aRand.y * 6.2831) * 0.018 * uMotion;

  // 开场：从远处星尘汇聚
  float ie = clamp(uIntro * 1.5 - aRand.y * 0.5, 0.0, 1.0);
  ie = 1.0 - pow(1.0 - ie, 3.0);
  vec3 ip = rdir * (5.0 + aRand.x * 5.0);
  ip.z = ip.z * 0.4 - 2.0;
  p = mix(ip, p, ie);

  // 颜色：点缀色可被“色彩丰富度”收回为低饱和蓝
  float accA = step(9.5, cA.a);
  float accB = step(9.5, cB.a);
  vec3 fallback = uBaseBlue * (0.75 + aRand.z * 0.5);
  vec3 colA = mix(cA.rgb, fallback, accA * (1.0 - uAccent));
  vec3 colB = mix(cB.rgb, fallback, accB * (1.0 - uAccent));
  vec3 col = mix(colA, colB, m);
  float sizeMul = mix(cA.a - accA * 10.0, cB.a - accB * 10.0, m);

  // 动作电位：沿路径参数传播的彗星状光点；uPhase 由 CPU 积分，点击越快流速越快
  float path = m < 0.5 ? pA.w : pB.w;
  float spark = 0.0;
  if (path >= 0.0) {
    float e = mix(22.0, 12.0, uDrive);
    spark = (pow(fract(path - uPhase), e) + 0.6 * smoothstep(0.35, 0.8, uDrive) * pow(fract(path - uPhase + 0.5), e)) * uSparkGain;
  }
  spark *= (1.0 - burst) * uMotion;
  // 放电越密，琥珀色（动作电位）的比例越高
  vec3 sparkCol = mix(uSparkCool, uSparkWarm, step(0.5 - 0.12 * uDrive, aRand.w) * uAccent);

  // 点击诱发的动作电位（每个槽位：W = 起点 xyz + 起始时间；Q = 空间门半径, 强度, 起始路径值, 当前波前路径值）
  // 有路径的神经突：波前沿路径参数“顺向”传播（树突→胞体→轴突→下一个神经元），只在随时间扩张的空间门内点亮；
  // 无路径的粒子（膜、星尘）：只感受到一圈径向的去极化环。波前之后是短暂变暗的不应期。
  float wv = 0.0;
  float refr = 0.0;
  for (int i = 0; i < 8; i++) {
    vec4 W = uWaves[i];
    if (W.w < 0.0) continue;
    float age = uTime - W.w;
    if (age < 0.0 || age > 7.0) continue;
    vec4 Q = uWaveQ[i];
    float fade = Q.y * exp(-age * 0.45);
    float d = distance(pm, W.xyz);
    if (Q.z >= 0.0) {
      if (path >= Q.z - 0.02) {
        float gate = 1.0 - smoothstep(Q.x, Q.x + 0.6, d);
        float fp = path - Q.w;
        float head = exp(-fp * fp * 30.0);
        float tail = fp < 0.0 ? exp(fp * 3.0) * 0.3 : 0.0;
        wv = max(wv, (head + tail) * gate * fade);
        refr = max(refr, (fp < -0.3 ? exp((fp + 0.3) * 1.2) : 0.0) * gate * fade * 0.8);
      }
      wv = max(wv, exp(-d * d * 60.0) * exp(-age * 4.0) * Q.y);
    } else {
      float fr = d - Q.x;
      float w = 0.09 + 0.035 * Q.x;
      wv = max(wv, exp(-(fr * fr) / (w * w)) * fade);
      refr = max(refr, fade * smoothstep(0.0, -0.25, fr) * exp(fr * 0.8));
    }
  }
  wv = min(wv, 1.6) * (uMotion * 0.5 + 0.5);

  // 钙成像式的自发闪烁：约 6% 的粒子缓慢地亮起再衰减，放电越频繁越明显
  float caP = 4.0 + aRand.x * 5.0;
  float caPh = fract(uTime / caP + aRand.w * 7.31);
  float ca = step(0.94, aRand.z) * smoothstep(0.0, 0.012, caPh) * exp(-caPh * caP / 0.8) * uCaGain;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 dv = ndc - uMouse;
  dv.x *= uAspect;
  float dm = length(dv);
  // 悬停 = 阈下分级电位场：粒子不移动（不再是放大镜），只按电紧张性衰减变亮；
  // 向外扩散的 EPSP 涟漪 + 离子通道的随机开合闪烁；uHoverV 是会时间总和的膜电位（永远低于阈值）
  float field = exp(-dm / 0.12) * (1.0 - smoothstep(0.26, 0.38, dm)) * uMouseOn;
  float memb = path >= 0.0 ? 1.0 : 0.25;
  float epsp = mix(1.0, 0.6 + 0.4 * cos(6.2831853 * (dm / 0.065 - uTime * 7.0)), uMotion);
  float chan = step(0.84, fract(aRand.w * 91.7 + floor(uTime * (8.0 + 8.0 * aRand.x)) * 0.618034)) * smoothstep(0.16, 0.0, dm) * uMotion;
  float dep = field * memb * (0.35 + 0.65 * uHoverV) * epsp + chan * field * 0.8;
  // 赫布尾迹：光标扫过的路径被短暂“增强”（早期 LTP），发光并传递更强的电流，约 2.5 秒后衰减
  float hebb = 0.0;
  vec2 asp = vec2(uAspect, 1.0);
  for (int i = 0; i < 19; i++) {
    vec4 a = uTrail[i];
    vec4 b = uTrail[i + 1];
    if (b.z <= 0.0) break;
    vec2 pa = (ndc - a.xy) * asp;
    vec2 ba = (b.xy - a.xy) * asp;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    hebb = max(hebb, mix(a.z, b.z, h) * exp(-dot(q, q) / 0.0036));
  }
  hebb *= (path >= 0.0 ? 1.0 : 0.45) * uMotion;
  spark *= 1.0 + 1.4 * hebb;
  gl_Position = projectionMatrix * mv;

  float depth = max(0.5, -mv.z);
  float pulse = 1.0 + uBeat * 0.28 * aRand.y + uFlash * 0.5;
  gl_PointSize = uSize * sizeMul * (0.65 + aRand.y * 0.7) * uPR * (11.0 / depth)
               * (1.0 + spark * 1.8 + wv * 1.5 + dep * 0.3 + hebb * 0.25 + ca * 0.5) * pulse * (0.78 + 0.22 * uGlow);
  gl_PointSize = min(gl_PointSize, 48.0 * uPR);

  float bright = (0.28 + 0.72 * uGlow) * (0.9 + uBeat * 0.22 + uFlash * 0.55) * (1.0 - 0.45 * refr) * (1.0 + 1.0 * hebb);
  col = mix(col, uDepolCol, 0.4 * hebb);
  float hot = 0.7 + 1.1 * uGlow;
  // 峰电位顶端才是琥珀色（全或无），阈下的分级电位始终保持低饱和蓝
  vec3 apCol = mix(uDepolCol, mix(uDepolCol, uSparkWarm, uAccent), smoothstep(0.55, 1.0, wv));
  vColor = col * bright + sparkCol * spark * hot
         + apCol * wv * hot * 0.9
         + uDepolCol * (dep * (0.8 + 0.5 * uGlow) + ca * 0.9 + hebb * 0.35);
  vAlpha = (0.55 + 0.45 * aRand.z) * (0.2 + 0.8 * ie);
  vSoft = uGlow;
}
`;

const fragmentShader = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
varying float vSoft;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d2 = dot(c, c) * 4.0;
  if (d2 > 1.0) discard;
  float k = mix(9.0, 3.6, clamp(vSoft * 0.5, 0.0, 1.0));
  float a = exp(-d2 * k) * vAlpha;
  gl_FragColor = vec4(vColor, a);
}
`;

// 背景渐变在 Bloom 之后叠加，避免被辉光放大成一片灰雾
const BackgroundShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAspect: { value: 1 },
    uInner: { value: new THREE.Color('#0b1728') },
    uOuter: { value: new THREE.Color('#03060b') },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uAspect;
    uniform vec3 uInner;
    uniform vec3 uOuter;
    varying vec2 vUv;
    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      // 保色相的高光压缩：密集处保持低饱和蓝，而不是叠加成白色
      float m = max(c.r, max(c.g, c.b));
      const float knee = 0.5;
      if (m > knee) {
        float t = knee + (1.0 - knee) * (1.0 - exp(-(m - knee) / (1.0 - knee)));
        c *= t / m;
      }
      vec2 p = (vUv - vec2(0.5, 0.46)) * vec2(uAspect, 1.0);
      vec3 bg = mix(uInner, uOuter, smoothstep(0.05, 0.95, length(p)));
      gl_FragColor = vec4(c + bg, 1.0);
    }
  `,
};

export class ParticleField {
  constructor(canvas, { count, width, shapeCount, pixelRatio }) {
    this.count = count;
    this.width = width;
    this.rows = count / width;
    this.shapeCount = shapeCount;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    this.camera.position.set(0, 0, BASE_Z);

    const H = this.rows * shapeCount;
    this.posData = new Float32Array(width * H * 4);
    this.colData = new Float32Array(width * H * 4);
    this.posTex = this._tex(this.posData, width, H);
    this.colTex = this._tex(this.colData, width, H);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const ref = new Float32Array(count * 2);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      ref[i * 2] = i % width;
      ref[i * 2 + 1] = Math.floor(i / width);
      rnd[i * 4] = Math.random();
      rnd[i * 4 + 1] = Math.random();
      rnd[i * 4 + 2] = Math.random();
      rnd[i * 4 + 3] = Math.random();
    }
    geo.setAttribute('aRef', new THREE.BufferAttribute(ref, 2));
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 4));
    this.rnd = rnd;
    // 在 CPU 上镜像一小部分“锚点”粒子的位置，用于确定点击落在哪个粒子上
    this.anchors = new Uint32Array(4096);
    for (let i = 0; i < this.anchors.length; i++) this.anchors[i] = Math.floor(Math.random() * count);
    this.waves = Array.from({ length: 8 }, () => ({ alive: false, t0: -99 }));

    this.uniforms = {
      uPos: { value: this.posTex },
      uCol: { value: this.colTex },
      uRows: { value: this.rows },
      uFrom: { value: 0 },
      uTo: { value: 0 },
      uMix: { value: 0 },
      uTime: { value: 0 },
      uGlow: { value: 1 },
      uAccent: { value: 1 },
      uSize: { value: 2.6 },
      uPR: { value: pixelRatio },
      uIntro: { value: 0 },
      uBeat: { value: 0 },
      uFlash: { value: 0 },
      uScatter: { value: 1 },
      uMotion: { value: 1 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uMouseOn: { value: 0 },
      uPhase: { value: 0 },
      uSparkGain: { value: 1 },
      uWaves: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, -1)) },
      uWaveQ: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -1, 0)) },
      uHoverV: { value: 0 },
      uDepolCol: { value: new THREE.Vector3(...PAL.c30) },
      uCaGain: { value: 0.7 },
      uDrive: { value: 0 },
      uTrail: { value: Array.from({ length: 20 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uAspect: { value: 1 },
      uBaseBlue: { value: new THREE.Vector3(...PAL.c40) },
      uSparkWarm: { value: new THREE.Vector3(1.0, 0.62, 0.28) },
      uSparkCool: { value: new THREE.Vector3(0.78, 0.9, 1.0) },
    };
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.add(this.points);
    this.scene.add(this.group);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    // “穿越组织”：形变炸散时粒子拖出光迹（只在形变过程中启用）
    this.afterimage = new AfterimagePass(0);
    this.afterimage.enabled = false;
    this.composer.addPass(this.afterimage);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 1.0, 0.6, 0.0);
    // 辉光染成 Loyel 低饱和蓝：外圈越大越偏深蓝
    const tint = ['#cfdcec', '#a9c3de', '#8fb0d4', '#6c9ac4', '#5585b6'];
    this.bloom.bloomTintColors = tint.map((h) => {
      const c = new THREE.Color(h);
      return new THREE.Vector3(c.r, c.g, c.b).multiplyScalar(1.35);
    });
    this.bloom.compositeMaterial.uniforms.bloomTintColors.value = this.bloom.bloomTintColors;
    this.composer.addPass(this.bloom);
    this.bgPass = new ShaderPass(BackgroundShader);
    this.composer.addPass(this.bgPass);
    this.composer.addPass(new OutputPass());
    this.setGlow(1);
  }

  _tex(data, w, h) {
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.FloatType);
    t.minFilter = THREE.NearestFilter;
    t.magFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    return t;
  }

  // 只上传这一形态对应的纹理行（v1 每次都整张重传约 9.4 MB，加载时会卡住主线程）
  setShape(index, pos, col) {
    const off = index * this.count * 4;
    this.posData.set(pos, off);
    this.colData.set(col, off);
    const rowFloats = this.width * 4;
    for (let r = 0; r < this.rows; r++) {
      this.posTex.addUpdateRange(off + r * rowFloats, rowFloats);
      this.colTex.addUpdateRange(off + r * rowFloats, rowFloats);
    }
    this.posTex.needsUpdate = true;
    this.colTex.needsUpdate = true;
  }

  resize(w, h, pixelRatio) {
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(pixelRatio);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uniforms.uPR.value = pixelRatio;
    this.uniforms.uAspect.value = w / h;
    this.bgPass.uniforms.uAspect.value = w / h;
  }

  // 荧光强度 f ∈ [0, 2]：同时驱动粒子亮度、光晕柔度与 Bloom
  setGlow(f) {
    this.uniforms.uGlow.value = f;
    this.baseBloom = 0.12 + 0.78 * f;
    this.bloom.strength = this.baseBloom;
    this.bloom.radius = 0.45 + 0.2 * Math.min(f, 1.5);
    this.bloom.threshold = 0.015;
  }

  // 发射一个动作电位 / 去极化波（本地坐标）。seedPath < 0 表示纯径向波；gate = false 表示不限空间范围
  // 波前位置与空间门半径每帧在 CPU 上按“当前速度”积分，所以点击加快时，已经在途的电流也会立刻加速
  emitWave(origin, { strength = 1, seedPath = -1, gate = true } = {}) {
    let i = this.waves.findIndex((w) => !w.alive);
    if (i < 0) i = this.waves.reduce((o, w, k) => (w.t0 < this.waves[o].t0 ? k : o), 0);
    const w = this.waves[i];
    Object.assign(w, { alive: true, t0: this.uniforms.uTime.value, front: seedPath, gateR: gate ? 0 : 99, gate, strength, seedPath });
    this.uniforms.uWaves.value[i].set(origin[0], origin[1], origin[2], w.t0);
    this._syncWave(i);
  }

  _syncWave(i) {
    const w = this.waves[i];
    this.uniforms.uWaveQ.value[i].set(w.gateR, w.strength, w.seedPath, w.front);
  }

  // vPath：路径单位/秒；vWorld：空间门（或径向波）扩张速度，世界单位/秒
  stepWaves(dt, vPath, vWorld) {
    const now = this.uniforms.uTime.value;
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      if (!w.alive) continue;
      if (now - w.t0 > 7) {
        w.alive = false;
        this.uniforms.uWaves.value[i].w = -1;
        continue;
      }
      if (w.seedPath >= 0) w.front += vPath * dt;
      if (w.gate) w.gateR += vWorld * dt;
      this._syncWave(i);
    }
  }

  // 复刻着色器里的形变插值，求某个粒子当前的本地坐标
  _localOf(idx) {
    const U = this.uniforms;
    const st = 0.45;
    let m = Math.min(1, Math.max(0, U.uMix.value * (1 + st) - this.rnd[idx * 4] * st));
    m = m * m * (3 - 2 * m);
    const a = (U.uFrom.value * this.count + idx) * 4;
    const b = (U.uTo.value * this.count + idx) * 4;
    const d = this.posData;
    return [d[a] + (d[b] - d[a]) * m, d[a + 1] + (d[b + 1] - d[a + 1]) * m, d[a + 2] + (d[b + 2] - d[a + 2]) * m, d[b + 3]];
  }

  // 屏幕坐标（NDC）→ 离点击最近的粒子的本地坐标；附近没有粒子时退回到 z=0 平面上的交点
  pickLocal(nx, ny, maxNdc = 0.12) {
    this.group.updateMatrixWorld();
    const mw = this.group.matrixWorld;
    const v = this._v || (this._v = new THREE.Vector3());
    const aspect = this.camera.aspect;
    let best = -1;
    let bestD = maxNdc * maxNdc;
    let bestP = null;
    for (let k = 0; k < this.anchors.length; k++) {
      const lp = this._localOf(this.anchors[k]);
      // 跳过星尘：远离形态主体的粒子不作为起点
      if (Math.abs(lp[0]) > 6.2 || Math.abs(lp[1]) > 4.2 || lp[2] < -4.5) continue;
      v.set(lp[0], lp[1], lp[2]).applyMatrix4(mw).project(this.camera);
      const dx = (v.x - nx) * aspect;
      const dy = v.y - ny;
      // 优先选神经突上的粒子（有路径参数），这样动作电位能沿结构传播
      // 同时偏向离镜头更近的粒子，避免点到远处背景里的小神经元
      const d = (dx * dx + dy * dy) * (lp[3] >= 0 ? 1 : 4) * (1 + Math.max(0, -lp[2]) * 0.35);
      if (d < bestD) {
        bestD = d;
        best = k;
        bestP = lp;
      }
    }
    if (best >= 0) return { p: bestP.slice(0, 3), path: bestP[3] };
    // 射线与本地 z=0 平面求交
    const inv = (this._inv || (this._inv = new THREE.Matrix4())).copy(mw).invert();
    const o = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld).applyMatrix4(inv);
    const t = new THREE.Vector3(nx, ny, 0.5).unproject(this.camera).applyMatrix4(inv);
    const dir = t.sub(o).normalize();
    if (Math.abs(dir.z) < 1e-4) return { p: [0, 0, 0], path: -1 };
    const s = -o.z / dir.z;
    return { p: [o.x + dir.x * s, o.y + dir.y * s, 0], path: -1 };
  }

  // 随机取一个形态主体上的粒子（用于自发放电）
  randomLocal() {
    for (let tries = 0; tries < 20; tries++) {
      const lp = this._localOf(this.anchors[Math.floor(Math.random() * this.anchors.length)]);
      if (Math.abs(lp[0]) < 5.5 && Math.abs(lp[1]) < 3.8 && lp[2] > -3) return lp.slice(0, 3);
    }
    return [0, 0, 0];
  }

  // 形变时镜头轻推向粒子云，并让粒子拖出光迹；burst ∈ [0,1]
  setWarp(burst, enabled = true) {
    const b = enabled ? burst : 0;
    this.camera.position.z = BASE_Z - 0.55 * b;
    this.afterimage.enabled = b > 0.01;
    this.afterimage.uniforms.damp.value = 0.82 * Math.pow(b, 1.5);
    this.bloom.strength = this.baseBloom + 0.22 * b * this.uniforms.uGlow.value;
  }

  visibleHalfSize() {
    const h = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * BASE_Z;
    return [h * this.camera.aspect, h];
  }

  render() {
    this.composer.render();
  }
}
