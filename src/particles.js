// WebGL 粒子场：所有形态存于浮点纹理，顶点着色器按滚动进度在两个形态间插值形变，
// 叠加放电脉冲、节拍脉动、鼠标扰动与 Unreal Bloom 荧光辉光。

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
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

  vec3 p = mix(pA.xyz, pB.xyz, m);
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

  // 动作电位：沿路径参数传播的彗星状光点
  float path = m < 0.5 ? pA.w : pB.w;
  float spark = 0.0;
  if (path >= 0.0) {
    spark = pow(fract(path - uTime * 0.55), 22.0);
  }
  spark *= (1.0 - burst) * uMotion;
  vec3 sparkCol = mix(uSparkCool, uSparkWarm, step(0.5, aRand.w) * uAccent);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 dv = ndc - uMouse;
  dv.x *= uAspect;
  float dist = length(dv);
  float force = (1.0 - smoothstep(0.0, 0.3, dist)) * uMouseOn;
  mv.xy += normalize(vec2(dv.x / uAspect, dv.y) + 1e-5) * force * 0.5 * (0.5 + aRand.z);
  gl_Position = projectionMatrix * mv;

  float depth = max(0.5, -mv.z);
  float pulse = 1.0 + uBeat * 0.28 * aRand.y + uFlash * 0.5;
  gl_PointSize = uSize * sizeMul * (0.65 + aRand.y * 0.7) * uPR * (11.0 / depth)
               * (1.0 + spark * 1.8) * pulse * (0.78 + 0.22 * uGlow);
  gl_PointSize = min(gl_PointSize, 48.0 * uPR);

  float bright = (0.28 + 0.72 * uGlow) * (0.9 + uBeat * 0.22 + uFlash * 0.55);
  vColor = col * bright + sparkCol * spark * (0.7 + 1.1 * uGlow);
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
    this.camera.position.set(0, 0, 11);

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

  setShape(index, pos, col) {
    const off = index * this.count * 4;
    this.posData.set(pos, off);
    this.colData.set(col, off);
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
    this.bloom.strength = 0.12 + 0.78 * f;
    this.bloom.radius = 0.45 + 0.2 * Math.min(f, 1.5);
    this.bloom.threshold = 0.015;
  }

  visibleHalfSize() {
    const h = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.position.z;
    return [h * this.camera.aspect, h];
  }

  render() {
    this.composer.render();
  }
}
