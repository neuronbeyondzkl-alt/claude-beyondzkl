// WebGL 粒子场：所有形态存于浮点纹理，顶点着色器按滚动进度在两个形态间插值形变，
// 叠加放电脉冲、点击诱发的动作电位波、悬停的阈下分级电位与增强尾迹、节拍脉动与 Unreal Bloom 荧光辉光。

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
uniform vec4 uTrail[16];
uniform float uHovPhase;
uniform float uWaveSharp;
uniform float uLTP;
uniform vec4 uTextBox[2];
uniform float uTextDim;
uniform float uGrow;
uniform vec4 uSoma[9];
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
  // 首页“神经发生”：锥体神经元的树突与轴突从各自胞体向外生长，末端是明亮的生长锥
  float born = 1.0;
  float cone = 0.0;
  if (uGrow < 1.0 && uFrom < 0.5 && pA.w >= 0.0 && pA.w < 300.0) {
    float g = 99.0;
    for (int i = 0; i < 9; i++) {
      vec4 sm = uSoma[i];
      if (sm.w > 0.0) g = min(g, distance(pA.xyz, sm.xyz) / sm.w);
    }
    float G = uGrow * 5.2;
    born = 1.0 - smoothstep(G, G + 0.12, g);
    cone = exp(-abs(G - g) / 0.08) * (1.0 - uGrow);
    ie = 1.0;
  }
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
  float neur = (path >= 0.0 && path < 400.0) ? 1.0 : 0.0;
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
    if (W.w < -1e5) continue;
    float age = uTime - W.w;
    if (age < 0.0 || age > 7.0) continue;
    vec4 Q = uWaveQ[i];
    float fade = Q.y; // 振幅在 CPU 上按各自的衰减率计算
    if (fade <= 0.0) continue;
    float d = distance(pm, W.xyz);
    if (Q.z >= 0.0) {
      if (path >= Q.z - 0.02 && neur > 0.5) {
        float gate = 1.0 - smoothstep(Q.x, Q.x + 0.6, d);
        float fp = path - Q.w;
        float head = exp(-fp * fp * uWaveSharp);
        float tail = fp < 0.0 ? exp(fp * 3.0) * 0.3 : 0.0;
        wv = max(wv, (head + tail) * gate * fade);
        refr = max(refr, (fp < -0.3 ? exp((fp + 0.3) * 1.2) : 0.0) * gate * fade * 0.8);
      }
      wv = max(wv, exp(-d * d * 60.0) * exp(-age * 4.0) * fade);
    } else {
      float fr = d - Q.x;
      float w = 0.09 + 0.035 * Q.x;
      wv = max(wv, exp(-(fr * fr) / (w * w)) * fade);
      refr = max(refr, fade * (1.0 - smoothstep(-0.25, 0.0, fr)) * exp(fr * 0.8));
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
  // EPSP 光带沿神经突（按路径参数）流向胞体，而不是屏幕上的同心圆；离子通道随机开合闪烁；
  // uHoverV 是会时间总和的膜电位（永远低于阈值，只有点击才产生峰电位）
  float field = exp(-dm / 0.11) * (1.0 - smoothstep(0.24, 0.36, dm)) * uMouseOn;
  float memb = neur > 0.5 ? 1.0 : 0.2;
  float epsp = mix(1.0, 0.55 + 0.45 * cos(6.2831853 * (path * 2.0 - uHovPhase)), uMotion * neur);
  float chan = neur * step(0.84, fract(aRand.w * 91.7 + floor(uTime * (8.0 + 8.0 * aRand.x)) * 0.618034)) * (1.0 - smoothstep(0.0, 0.16, dm)) * uMotion;
  float dep = field * memb * (0.35 + 0.65 * uHoverV) * epsp + chan * field * 0.5;
  // 增强尾迹（短时增强，示意）：光标扫过的路径被短暂“增强”，发光并传递更强的电流，约 2.5 秒后衰减
  float trailB = 0.0;
  vec2 asp = vec2(uAspect, 1.0);
  for (int i = 0; i < 15; i++) {
    vec4 a = uTrail[i];
    vec4 b = uTrail[i + 1];
    if (b.z <= 0.0) break;
    vec2 pa = (ndc - a.xy) * asp;
    vec2 ba = (b.xy - a.xy) * asp;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    vec2 q = pa - ba * h;
    trailB = max(trailB, mix(a.z, b.z, h) * exp(-dot(q, q) / 0.0036));
  }
  trailB *= (neur > 0.5 ? 1.0 : 0.2) * uMotion;
  spark *= (1.0 + 1.4 * trailB) * (1.0 + 0.5 * uLTP);

  // 首页文字背后的“遮罩”：标题与描述区域内的粒子略微变暗，保证可读性
  float inT = smoothstep(0.0, 0.04, min(min(ndc.x - uTextBox[0].x, uTextBox[0].z - ndc.x), min(ndc.y - uTextBox[0].y, uTextBox[0].w - ndc.y)));
  float inC = smoothstep(0.0, 0.04, min(min(ndc.x - uTextBox[1].x, uTextBox[1].z - ndc.x), min(ndc.y - uTextBox[1].y, uTextBox[1].w - ndc.y)));
  float veil = 1.0 - uTextDim * (0.25 * inT + 0.45 * inC);
  float vz = 1.0 - 0.25 * uTextDim * max(inT, inC);
  spark *= vz;
  wv *= vz;
  gl_Position = projectionMatrix * mv;

  float depth = max(0.5, -mv.z);
  float pulse = 1.0 + uBeat * 0.28 * aRand.y + uFlash * 0.5;
  // 尺寸增益封顶（×3），避免高荧光 + 密集放电时的填充率爆炸
  float boost = min(spark * 1.8 + wv * 1.5 + dep * 0.25 + trailB * 0.25 + ca * 0.5 + cone * 1.2, 2.0);
  gl_PointSize = uSize * sizeMul * (0.65 + aRand.y * 0.7) * uPR * (11.0 / depth) * (1.0 + boost) * pulse * (0.78 + 0.22 * uGlow) * born;
  gl_PointSize = min(gl_PointSize, 40.0 * uPR);

  float bright = (0.28 + 0.72 * uGlow) * (0.9 + uBeat * 0.22 + uFlash * 0.55) * (1.0 - 0.45 * refr) * (1.0 + 0.6 * trailB)
               * (1.0 + 0.25 * uLTP * neur) * veil;
  col = mix(col, uDepolCol, 0.3 * trailB);
  float hot = 0.7 + 1.1 * uGlow;
  // 峰电位顶端才是琥珀色（全或无），阈下的分级电位始终保持低饱和蓝
  vec3 apCol = mix(uDepolCol, mix(uDepolCol, uSparkWarm, uAccent), smoothstep(0.55, 1.0, wv));
  vColor = col * bright + sparkCol * spark * hot
         + apCol * wv * hot * 0.9
         + uDepolCol * (dep * (0.8 + 0.5 * uGlow) + ca * 0.9 + trailB * 0.35 + cone * 0.9);
  vAlpha = (0.55 + 0.45 * aRand.z) * (0.2 + 0.8 * ie) * born;
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
    this.anchors = new Uint32Array(count > 20000 ? 2400 : 1600);
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
      uWaves: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, -1e6)) },
      uWaveQ: { value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, -1, 0)) },
      uHoverV: { value: 0 },
      uDepolCol: { value: new THREE.Vector3(...PAL.c30) },
      uCaGain: { value: 0.7 },
      uDrive: { value: 0 },
      uTrail: { value: Array.from({ length: 16 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uHovPhase: { value: 0 },
      uWaveSharp: { value: 30 },
      uLTP: { value: 0 },
      uTextBox: { value: [new THREE.Vector4(9, 9, 9, 9), new THREE.Vector4(9, 9, 9, 9)] },
      uTextDim: { value: 0 },
      uGrow: { value: 1 },
      uSoma: { value: Array.from({ length: 9 }, () => new THREE.Vector4(0, 0, 0, 0)) },
      uAspect: { value: 1 },
      uBaseBlue: { value: new THREE.Vector3(...PAL.c40) },
      uSparkWarm: { value: new THREE.Vector3(...PAL.amber) },
      uSparkCool: { value: new THREE.Vector3(...PAL.c30) },
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
    // 原版按 RGB 各通道分别截断，红色先归零会让拖尾变成高饱和青蓝；改为按最亮通道整体截断，保持 Loyel 低饱和色相
    this.afterimage.compFsMaterial.fragmentShader = this.afterimage.compFsMaterial.fragmentShader.replace(
      'texelOld *= damp * when_gt( texelOld, 0.1 );',
      'texelOld *= damp * step( 0.1, max( texelOld.r, max( texelOld.g, texelOld.b ) ) );'
    );
    this.composer.addPass(this.afterimage);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 1.0, 0.6, 0.0);
    // 辉光染成 Loyel 低饱和蓝：外圈越大越偏深蓝
    const tint = ['#ccdbeb', '#9fbdda', '#9fbdda', '#6c9ac4', '#497dae'];
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
  // 波前位置与空间门半径每帧在 CPU 上按“当前速度”积分，所以点击加快时，已经在途的电流也会立刻加速；
  // 波前到达所在路径带的上限（ceil）就退场，不会窜到别的结构或星尘上
  emitWave(origin, { strength = 1, seedPath = -1, gate = true, vMul = 1, decay = 0.45, life = 7, ceil = Infinity, gateR0 = 0 } = {}) {
    let i = this.waves.findIndex((w) => !w.alive);
    if (i < 0) i = this.waves.reduce((o, w, k) => (w.t0 < this.waves[o].t0 ? k : o), 0);
    const w = this.waves[i];
    Object.assign(w, { alive: true, t0: this.uniforms.uTime.value, front: seedPath, gateR: gate ? gateR0 : 99, gate, strength, seedPath, vMul, decay, life, ceil, amp: strength });
    this.uniforms.uWaves.value[i].set(origin[0], origin[1], origin[2], w.t0);
    this._syncWave(i);
  }

  _syncWave(i) {
    const w = this.waves[i];
    this.uniforms.uWaveQ.value[i].set(w.gateR, w.alive ? w.amp : 0, w.seedPath, w.front);
  }

  // vPath：路径单位/秒；gateK：空间门扩张速度与路径速度之比
  stepWaves(dt, vPath, gateK = 1.1) {
    const now = this.uniforms.uTime.value;
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      if (!w.alive) continue;
      const age = now - w.t0;
      w.amp = w.strength * Math.exp(-age * w.decay);
      if (age > w.life || w.amp < 0.02 || (w.seedPath >= 0 && w.front > w.ceil)) {
        w.alive = false;
        this.uniforms.uWaves.value[i].w = -1e6;
        this._syncWave(i);
        continue;
      }
      if (w.seedPath >= 0) w.front += vPath * w.vMul * dt;
      if (w.gate) w.gateR += gateK * vPath * w.vMul * dt;
      this._syncWave(i);
    }
  }

  // 每个形态的元数据（路径带、胞体位置等），由 main 在生成形态后写入
  setMeta(index, meta) {
    this.metas = this.metas || [];
    this.metas[index] = meta;
  }

  // 着色器时间周期性回卷（避免 float32 在大数值下让高频项变得断续），在途的波按同样的偏移平移
  rebaseTime(shift) {
    for (let i = 0; i < this.waves.length; i++) {
      const w = this.waves[i];
      w.t0 -= shift;
      if (w.alive) this.uniforms.uWaves.value[i].w = w.t0;
    }
  }

  bandTop(index, path) {
    const m = this.metas && this.metas[index];
    if (!m || path < 0) return Infinity;
    for (const [a, b] of m.bands) if (path >= a && path < b) return b;
    return Infinity;
  }

  // 复刻着色器里的形变插值，把某个粒子当前的本地坐标与路径写入 out（不分配内存）
  _localInto(idx, out) {
    const U = this.uniforms;
    const st = 0.45;
    let m = Math.min(1, Math.max(0, U.uMix.value * (1 + st) - this.rnd[idx * 4] * st));
    m = m * m * (3 - 2 * m);
    const a = (U.uFrom.value * this.count + idx) * 4;
    const b = (U.uTo.value * this.count + idx) * 4;
    const d = this.posData;
    out[0] = d[a] + (d[b] - d[a]) * m;
    out[1] = d[a + 1] + (d[b + 1] - d[a + 1]) * m;
    out[2] = d[a + 2] + (d[b + 2] - d[a + 2]) * m;
    out[3] = m < 0.5 ? d[a + 3] : d[b + 3];
    return out;
  }

  // 屏幕坐标（NDC）→ 被点击的神经元。优先级：点在胞体（屏幕上）附近 → 直接从胞体发放；
  // 范围内有神经突粒子 → 从最近的那一段发放；只有附近全是膜/星尘时才退化为径向波。
  // 一次乘好 投影 × 视图 × 模型 矩阵，手动做透视除法，整个过程没有任何临时对象
  pickLocal(nx, ny, maxNdc = 0.14) {
    this.group.updateMatrixWorld();
    this.camera.updateMatrixWorld();
    const M = (this._M || (this._M = new THREE.Matrix4()))
      .multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse)
      .multiply(this.group.matrixWorld);
    const e = M.elements;
    const aspect = this.camera.aspect;
    const shape = this.uniforms.uMix.value < 0.5 ? this.uniforms.uFrom.value : this.uniforms.uTo.value;
    // 屏幕距离²（横向按宽高比校正）；w <= 0 表示在镜头后面
    const scr2 = (x, y, z) => {
      const w = e[3] * x + e[7] * y + e[11] * z + e[15];
      if (w <= 0.01) return Infinity;
      const dx = ((e[0] * x + e[4] * y + e[8] * z + e[12]) / w - nx) * aspect;
      const dy = (e[1] * x + e[5] * y + e[9] * z + e[13]) / w - ny;
      return dx * dx + dy * dy;
    };
    const meta = this.metas && this.metas[shape];
    if (meta && meta.somata && this.uniforms.uMix.value < 0.02) {
      let pick = null;
      let pd = Infinity;
      for (const sm of meta.somata) {
        const r = 0.085 * sm.k;
        const d = scr2(sm.p[0], sm.p[1], sm.p[2]);
        if (d < r * r && d < pd) {
          pd = d;
          pick = sm;
        }
      }
      if (pick) return { p: pick.p.slice(), path: pick.path, shape };
    }
    const lp = this._lp || (this._lp = new Float32Array(4));
    const best = this._best || (this._best = new Float32Array(4));
    const bestN = this._bestN || (this._bestN = new Float32Array(4));
    let bd = maxNdc * maxNdc;
    let bdN = bd * 2.9; // 神经突的搜索半径放宽到 1.7 倍：点在神经元旁边的空隙里，也由最近的神经突发放
    let found = false;
    let foundN = false;
    for (let k = 0; k < this.anchors.length; k++) {
      this._localInto(this.anchors[k], lp);
      const z = lp[2];
      if (Math.abs(lp[0]) > 6.2 || Math.abs(lp[1]) > 4.2 || z < -4.5) continue;
      // 偏向离镜头更近的粒子，避免点到远处背景里的小神经元
      const d = scr2(lp[0], lp[1], z) * (1 + Math.max(0, -z) * 0.35);
      if (lp[3] >= 0 && lp[3] < 400) {
        if (d < bdN) {
          bdN = d;
          bestN.set(lp);
          foundN = true;
        }
      } else if (d < bd) {
        bd = d;
        best.set(lp);
        found = true;
      }
    }
    if (foundN) return { p: [bestN[0], bestN[1], bestN[2]], path: bestN[3], shape };
    if (found) return { p: [best[0], best[1], best[2]], path: -1, shape };
    // 附近没有粒子：射线与本地 z=0 平面求交
    const inv = (this._inv || (this._inv = new THREE.Matrix4())).copy(this.group.matrixWorld).invert();
    const o = new THREE.Vector3().setFromMatrixPosition(this.camera.matrixWorld).applyMatrix4(inv);
    const t = new THREE.Vector3(nx, ny, 0.5).unproject(this.camera).applyMatrix4(inv);
    const dir = t.sub(o).normalize();
    if (Math.abs(dir.z) < 1e-4) return { p: [0, 0, 0], path: -1, shape };
    const s = -o.z / dir.z;
    return { p: [o.x + dir.x * s, o.y + dir.y * s, 0], path: -1, shape };
  }

  // 随机取一个形态主体上的粒子（用于自发放电）
  randomLocal() {
    const lp = this._lp || (this._lp = new Float32Array(4));
    for (let tries = 0; tries < 20; tries++) {
      this._localInto(this.anchors[Math.floor(Math.random() * this.anchors.length)], lp);
      if (Math.abs(lp[0]) < 5.5 && Math.abs(lp[1]) < 3.8 && lp[2] > -3) return [lp[0], lp[1], lp[2]];
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
