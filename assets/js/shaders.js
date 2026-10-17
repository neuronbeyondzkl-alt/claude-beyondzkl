// GLSL 着色器（WebGL2 / GLSL ES 3.00，由 three.js 自动加 #version 与 in/out 映射）

// 形体编号与 creatures.js 中 SHAPES 的顺序一致
const KIND_DEFINES = `
#define K_OCEAN 0
#define K_CORAL 1
#define K_STAR 2
#define K_SEAHORSE 3
#define K_HORSESHOE 4
#define K_TURTLE 5
#define K_MANTA 6
#define K_SHARK 7
#define K_WHALE 8
#define K_JELLY 9
#define K_LANTERN 10
#define K_ANGLER 11
#define K_ABYSS 12
`;

export const particleVert = /* glsl */ `
${KIND_DEFINES}
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uPos;   // xyz + 动作通道（分组 + 权重）
uniform sampler2D uCol;   // 线性 rgb + 尺寸
uniform int uTexW;
uniform int uRows;
uniform int uShapeA;
uniform int uShapeB;
uniform mat4 uMatA;
uniform mat4 uMatB;
uniform float uMix;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uGlow;       // 荧光强度 0..1
uniform float uSatMax;     // 饱和度上限（HSV S）
uniform float uAlphaA;
uniform float uAlphaB;
uniform float uScatter;
uniform float uAspect;
uniform float uTanHalfFov;
uniform vec4 uTrail[16];   // 鼠标尾迹：xy = NDC，z = 年龄（秒），w = 速度（<=0 表示空槽）
uniform vec2 uTrailVel[16];// 尾迹各点的速度（已按宽高比校正的 NDC/秒）
uniform vec4 uClick[8];    // 点击声呐波：xy = NDC，z = 年龄（秒，<0 表示空槽），w = 强度
uniform float uMotion;     // 动作幅度（减少动态效果时降低）
uniform float uIntro;      // 开场汇聚进度 0..1

attribute vec4 aRand;

varying vec3 vColor;
varying float vCore;

const float TAU = 6.2831853;

float jellyPulse(float t) {
  float ph = fract(t / 3.2);
  return ph < 0.28 ? smoothstep(0.0, 1.0, ph / 0.28) : 1.0 - smoothstep(0.0, 1.0, (ph - 0.28) / 0.72);
}

vec3 drift(vec3 p, vec4 r, float t, float a) {
  return p + a * vec3(sin(t * 0.4 + r.x * TAU), sin(t * 0.3 + r.y * TAU), cos(t * 0.35 + r.z * TAU));
}

// 返回 xyz = 动画后的位置，w = 亮度系数
vec4 animate(int kind, vec3 p, float an, float t, vec4 r) {
  float g = floor(an);
  float w = fract(an);
  float br = 1.0;
  float M = uMotion;

  if (kind == K_OCEAN) {
    float h = 0.36 * sin(dot(p.xz, vec2(0.22, 0.17)) + t * 0.9)
            + 0.22 * sin(dot(p.xz, vec2(-0.31, 0.26)) + t * 1.25)
            + 0.12 * sin(dot(p.xz, vec2(0.58, -0.43)) + t * 1.7)
            + 0.06 * sin(dot(p.xz, vec2(-0.9, -1.1)) + t * 2.3);
    p.y += h * M;
    br = 0.7 + 0.65 * smoothstep(0.05, 0.62, h);
  } else if (kind == K_CORAL) {
    if (g == 1.0) { p.x += 0.05 * w * sin(t * 0.8 + p.y * 1.5) * M; p.z += 0.04 * w * cos(t * 0.7 + p.x) * M; }
    else if (g == 2.0) { p.z += 0.16 * w * w * sin(t * 0.6 + p.x * 0.8) * M; p.x += 0.05 * w * sin(t * 0.5) * M; }
    else if (g == 3.0) { p.x += 0.07 * w * sin(t * 1.3 + p.z * 6.0) * M; p.z += 0.07 * w * cos(t * 1.1 + p.x * 6.0) * M; }
    else if (g == 4.0) { p = drift(p, r, t, 0.14 * M); br = 0.55 + 0.45 * sin(t * 1.5 + r.w * TAU); }
  } else if (kind == K_STAR) {
    float a = atan(p.z, p.x);
    if (g == 1.0) p.y += 0.22 * pow(w, 2.5) * sin(t * 0.8 + a) * M;
  } else if (kind == K_SEAHORSE) {
    if (g != 3.0) { p.y += 0.07 * sin(t * 0.9) * M; p.x += 0.03 * sin(t * 0.45) * M; }
    if (g == 1.0) p.x += 0.06 * w * sin(t * 0.9 + 1.0) * M;
    else if (g == 2.0) p.z += 0.05 * w * sin(t * 14.0 + p.y * 20.0) * M;
    else if (g == 3.0) p.x += 0.12 * w * w * sin(t * 0.7 + p.y * 0.6) * M;
  } else if (kind == K_HORSESHOE) {
    p.y += 0.03 * sin(t * 0.7) * M;
    if (g == 1.0) p.y += 0.015 * sin(t * 2.2 + p.x * 3.0) * M;
    else if (g == 2.0) { p.z += 0.22 * w * sin(t * 0.8) * M; p.y += 0.08 * w * sin(t * 0.6 + 1.0) * M; }
  } else if (kind == K_TURTLE) {
    float s = sin(t * 1.3);
    p.y -= 0.06 * s * M;
    if (g == 1.0) { p.y += 0.5 * w * s * M; p.x -= 0.22 * w * cos(t * 1.3) * M; }
    else if (g == 2.0) p.y += 0.1 * w * sin(t * 1.3 + 1.6) * M;
    else if (g == 3.0) p.y += 0.03 * sin(t * 0.65) * M;
  } else if (kind == K_MANTA) {
    p.y -= 0.1 * sin(t * 1.25 + 0.4) * M;
    if (g == 1.0) {
      float ph = t * 1.25 - w * 1.6;
      p.y += 0.85 * pow(w, 1.5) * sin(ph) * M;
      p.x += 0.1 * w * w * cos(ph) * M;
    } else if (g == 2.0) p.y += 0.05 * w * sin(t * 1.25 + 0.5) * M;
    else if (g == 3.0) { p.y += 0.15 * w * sin(t * 1.25 - 2.0) * M; p.z += 0.1 * w * sin(t * 0.7) * M; }
  } else if (kind == K_SHARK) {
    float ph = t * 2.0 + p.x * 1.05;
    p.z += (0.42 * w * sin(ph) + 0.05 * (1.0 - w) * sin(t * 2.0 + 2.6)) * M;
  } else if (kind == K_WHALE) {
    if (g == 4.0) {
      p += 0.18 * M * vec3(sin(t * 0.5 + r.x * TAU + p.y * 3.0), sin(t * 0.4 + r.y * TAU), cos(t * 0.45 + r.z * TAU + p.x * 3.0));
      br = 0.7 + 0.3 * sin(t * 2.0 + r.w * TAU);
    } else {
      p.y += 0.36 * w * sin(t * 1.0 + p.x * 0.55) * M;
    }
  } else if (kind == K_JELLY) {
    float c = jellyPulse(t) * M;
    if (g == 0.0 || g == 3.0) {
      float k = g == 0.0 ? w : 0.5;
      p.xz *= 1.0 - 0.14 * c * k;
      p.y += 0.1 * c * k;
      br = 1.0 + 0.3 * c;
    } else if (g == 1.0) {
      p.xz *= 1.0 - 0.05 * c;
      p.x += 0.14 * w * sin(t * 0.8 + p.y * 1.3 + 1.0) * M;
      p.z += 0.14 * w * cos(t * 0.7 + p.y * 1.2) * M;
    } else if (g == 2.0) {
      float c2 = jellyPulse(t - 0.6 * w - 0.2) * M;
      float ang = atan(p.z, p.x);
      p.xz *= 1.0 - 0.1 * c2 * (1.0 - w * 0.6);
      p.x += 0.22 * w * sin(t * 0.7 + p.y * 0.9 + ang * 2.0) * M;
      p.z += 0.22 * w * cos(t * 0.6 + p.y * 0.8 + ang * 2.0) * M;
    } else if (g == 4.0) {
      p = drift(p, r, t, 0.16 * M);
      br = 0.55 + 0.45 * sin(t * 1.7 + r.w * TAU);
    }
    p.y += 0.12 * sin(TAU * fract(t / 3.2) - 1.0) * M;
  } else if (kind == K_LANTERN) {
    float ph = t * 3.2 + g * 1.7;
    p.z += 0.42 * w * sin(ph - w * 2.0) * M;
    p.y += 0.06 * sin(t * 0.6 + g * 2.1) * M;
    p.x += 0.1 * sin(t * 0.33 + g * 1.3) * M;
  } else if (kind == K_ANGLER) {
    p.y += 0.07 * sin(t * 0.5) * M;
    p.x += 0.05 * sin(t * 0.31) * M;
    if (g == 1.0) p.y -= 0.06 * (0.5 + 0.5 * sin(t * 0.45)) * M;
    else if (g == 2.0) { p.y += 0.12 * w * sin(t * 0.9) * M; p.x += 0.07 * w * sin(t * 0.7 + 1.0) * M; }
    else if (g == 3.0) {
      p.y += 0.12 * sin(t * 0.9) * M; p.x += 0.07 * sin(t * 0.7 + 1.0) * M;
      br = 0.75 + 0.65 * pow(0.5 + 0.5 * sin(t * 1.9), 3.0);
    } else if (g == 4.0) p.z += 0.06 * w * sin(t * 4.0 + p.y * 3.0) * M;
  } else if (kind == K_ABYSS) {
    float ang = t * 0.1 / (0.25 + w) * M;
    float cs = cos(ang), sn = sin(ang);
    p.xz = mat2(cs, -sn, sn, cs) * p.xz;
    br = 0.75 + 0.25 * sin(t * 1.3 + r.w * TAU);
  }
  return vec4(p, br);
}

void main() {
  int id = gl_VertexID;
  int cx = id % uTexW;
  int cy = id / uTexW;
  vec4 pa = texelFetch(uPos, ivec2(cx, uShapeA * uRows + cy), 0);
  vec4 pb = texelFetch(uPos, ivec2(cx, uShapeB * uRows + cy), 0);
  vec4 ca = texelFetch(uCol, ivec2(cx, uShapeA * uRows + cy), 0);
  vec4 cb = texelFetch(uCol, ivec2(cx, uShapeB * uRows + cy), 0);

  vec4 a = animate(uShapeA, pa.xyz, pa.w, uTime, aRand);
  vec4 b = animate(uShapeB, pb.xyz, pb.w, uTime, aRand);
  vec3 wa = (uMatA * vec4(a.xyz, 1.0)).xyz;
  vec3 wb = (uMatB * vec4(b.xyz, 1.0)).xyz;

  // 每个粒子错峰出发，形成“溶解—重组”的过程
  float delay = aRand.x * 0.4;
  float m = clamp((uMix - delay) / 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 pos = mix(wa, wb, m);

  // 变形途中：水流般的涡旋与扰动
  float s = sin(3.14159265 * m) * uScatter;
  float ang = s * (0.6 + aRand.y) * 0.9;
  float cs = cos(ang), sn = sin(ang);
  pos.xz = mat2(cs, -sn, sn, cs) * pos.xz;
  pos += s * (vec3(sin(pos.y * 0.9 + uTime * 0.7 + aRand.y * TAU),
                   0.8 * sin(pos.z * 0.8 + uTime * 0.6 + aRand.z * TAU),
                   sin(pos.x * 0.7 + uTime * 0.5 + aRand.w * TAU)) * 1.2
              + (aRand.xyz - 0.5) * 1.4);

  // 开场：粒子从四散的深处汇聚成形
  float it = clamp((uIntro - aRand.w * 0.45) / 0.55, 0.0, 1.0);
  it = 1.0 - pow(1.0 - it, 3.0);
  vec3 far = (aRand.xyz - 0.5) * vec3(34.0, 22.0, 30.0) + vec3(0.0, 0.0, -10.0);
  pos = mix(far, pos, it);

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);

  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vec2 offs = vec2(0.0);   // 屏幕空间位移（按宽高比校正的 NDC 单位）
  float flash = 0.0;       // 受扰动引发的生物荧光

  // 鼠标划过 = 手掌拨动海水：粒子被尾流拖拽，并卷成左右交替的小涡旋（卡门涡街），同时被“惊扰”发光
  for (int k = 0; k < 16; k++) {
    vec4 tp = uTrail[k];
    if (tp.w <= 0.0) continue;
    vec2 d = ndc - tp.xy;
    d.x *= uAspect;
    float age = tp.z;
    float rad = 0.1 + 0.16 * age;
    float k1 = exp(-dot(d, d) / (rad * rad)) * exp(-age * 1.6);
    offs += uTrailVel[k] * k1 * 0.03;
    float sw = mod(float(k), 2.0) < 1.0 ? 1.0 : -1.0;
    offs += vec2(-d.y, d.x) * k1 * min(tp.w, 4.0) * 0.13 * sw;
    flash += k1 * min(tp.w, 3.0) * 0.45;
  }

  // 点击 = 声呐脉冲：一圈波纹向外推开粒子，波前经过处粒子闪光
  for (int k = 0; k < 8; k++) {
    vec4 c = uClick[k];
    if (c.z < 0.0 || c.z > 3.5) continue;
    vec2 d = ndc - c.xy;
    d.x *= uAspect;
    float dist = length(d);
    float age = c.z;
    float r = age * (0.55 + 0.22 * c.w);
    float w = 0.035 + 0.05 * age;
    float x = (dist - r) / w;
    float ring = exp(-x * x) * exp(-age * 1.25) * c.w;
    offs += (d / max(dist, 1e-3)) * ring * 0.055;
    flash += ring * 1.3 + exp(-dist * dist / 0.01) * exp(-age * 5.0) * c.w * 1.2;
  }

  mv.xy += offs * (-mv.z) * uTanHalfFov * uMotion;
  gl_Position = projectionMatrix * mv;

  // 颜色：插值后做 HSV 饱和度硬钳制 → 任何颜色都只能是低饱和度
  vec3 col = mix(ca.rgb, cb.rgb, m);
  flash = min(flash, 3.0);
  col = mix(col, vec3(0.42, 0.78, 0.82), clamp(flash * 0.3, 0.0, 0.55));
  vec3 sc = pow(max(col, vec3(0.0)), vec3(1.0 / 2.2));
  float mx = max(sc.r, max(sc.g, sc.b));
  float mn = min(sc.r, min(sc.g, sc.b));
  float sat = (mx - mn) / max(mx, 1e-4);
  if (sat > uSatMax) sc = vec3(mx) - (vec3(mx) - sc) * (uSatMax / sat);
  col = pow(sc, vec3(2.2));

  float sz = mix(ca.a, cb.a, m);
  // 荧光闪烁：大尺寸粒子（发光器、拟饵等）脉动更明显
  float tw = 0.86 + 0.14 * sin(uTime * (0.8 + aRand.y * 1.6) + aRand.z * TAU);
  if (sz > 1.9) tw = 0.55 + 0.6 * pow(0.5 + 0.5 * sin(uTime * (0.7 + aRand.y) + aRand.z * TAU), 2.0);
  float br = mix(a.w, b.w, m) * tw * mix(uAlphaA, uAlphaB, m);
  float fog = smoothstep(34.0, 9.0, -mv.z) * (0.35 + 0.65 * it);
  col *= br * (0.34 + 0.2 * uGlow) * mix(0.15, 1.0, fog) * (1.0 + 0.4 * s) * (1.0 + flash * 0.9);
  vColor = col;

  float spread = 1.0 + uGlow * 1.5;
  vCore = 1.0 / spread;
  gl_PointSize = clamp(uSize * sz * uPixelRatio * spread * (12.0 / -mv.z) * (1.0 + flash * 0.25), 1.0, 72.0);
}
`;

export const particleFrag = /* glsl */ `
precision highp float;
uniform float uGlow;
varying vec3 vColor;
varying float vCore;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float r = d / vCore;
  float core = exp(-r * r * 3.2);
  float halo = exp(-r * 1.6) * 0.34 * uGlow;
  float a = core + halo;
  gl_FragColor = vec4(vColor * a, a);
}
`;

// 背景作为后处理：在 Bloom 之后叠加，渐变与光柱不会被辉光放大
export const bgPassVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const bgPassFrag = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform vec3 uTop;
uniform vec3 uBot;
uniform vec3 uRayCol;
uniform vec3 uRingCol;
uniform float uRays;
uniform float uCaus;      // 焦散光纹强度（浅海）
uniform float uSurf;      // 穿越海面后经过的秒数（<0 表示未触发）
uniform float uTime;
uniform vec2 uRes;
uniform vec4 uClick[8];
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// 水面焦散：几层相互扭曲的正弦网格，乘积接近 0 的地方形成明亮细线
float caustic(vec2 p, float t) {
  float v = 0.0;
  vec2 q = p;
  for (int n = 0; n < 3; n++) {
    float fn = float(n);
    q += vec2(sin(q.y * 1.7 + t * 0.6 + fn), cos(q.x * 1.5 - t * 0.5 + fn * 1.3)) * 0.45;
    v += abs(sin(q.x * 2.1 + sin(q.y * 1.3)) * sin(q.y * 2.3 + sin(q.x * 1.1)));
  }
  return pow(1.0 - clamp(v / 3.0, 0.0, 1.0), 7.0);
}

void main() {
  vec2 uv = vUv;
  float asp = uRes.x / uRes.y;
  vec3 col = mix(uBot, uTop, smoothstep(0.0, 1.0, uv.y));
  // 自上而下的光柱（越深越弱）
  float x = uv.x * asp * 0.6 + (1.0 - uv.y) * 0.3;
  float rays = smoothstep(0.62, 1.0, sin(x * 9.0 + uTime * 0.16) * 0.5 + 0.5);
  rays += 0.6 * smoothstep(0.7, 1.0, sin(x * 15.0 - uTime * 0.11 + 1.3) * 0.5 + 0.5);
  rays += 0.4 * smoothstep(0.75, 1.0, sin(x * 26.0 + uTime * 0.23 + 2.1) * 0.5 + 0.5);
  col += uRayCol * rays * uRays * pow(uv.y, 2.4) * 0.035;
  // 焦散光纹，靠近画面上方（海面方向）
  if (uCaus > 0.001) {
    float c = caustic(vec2(uv.x * asp, uv.y) * 3.2, uTime * 0.45);
    col += uRayCol * c * uCaus * smoothstep(0.25, 1.0, uv.y) * 0.05;
  }
  // 穿越海面：一道波动的亮带向上掠过
  if (uSurf >= 0.0 && uSurf < 3.0) {
    float yb = 0.35 + uSurf * 0.42 + 0.018 * sin(uv.x * asp * 18.0 + uTime * 3.0);
    float by = (uv.y - yb) / 0.035;            // 注意：GLSL 的 pow 对负底数无定义，这里用平方
    float band = exp(-by * by) * exp(-uSurf * 0.9);
    col += uRayCol * band * 0.22 * (0.7 + 0.3 * sin(uv.x * asp * 60.0 + uTime * 5.0));
  }
  vec2 q = uv - 0.5;
  q.x *= asp;
  float vig = 1.0 - 0.55 * smoothstep(0.35, 1.15, length(q));
  col *= vig;
  // 声呐波纹在背景上的光圈
  vec2 sp = (uv * 2.0 - 1.0) * vec2(asp, 1.0);
  for (int k = 0; k < 8; k++) {
    vec4 c = uClick[k];
    if (c.z < 0.0 || c.z > 3.5) continue;
    float dist = length(sp - c.xy * vec2(asp, 1.0));
    float r = c.z * (0.55 + 0.22 * c.w);
    float w = 0.012 + 0.03 * c.z;
    float xx = (dist - r) / w;
    float ring = exp(-xx * xx) * exp(-c.z * 1.4) * min(c.w, 3.0);
    col += uRingCol * (ring * 0.09 + exp(-dist * dist / 0.004) * exp(-c.z * 6.0) * c.w * 0.12);
  }
  col += (hash(uv * uRes + fract(uTime)) - 0.5) / 400.0;
  vec3 src = texture2D(tDiffuse, vUv).rgb * mix(1.0, vig, 0.4);
  gl_FragColor = vec4(src + max(col, vec3(0.0)), 1.0);
}
`;

export const snowVert = /* glsl */ `
precision highp float;
attribute vec4 aSeed;
uniform float uTime;
uniform float uScroll;
uniform float uPixelRatio;
uniform float uOpacity;
uniform float uGlow;
varying float vA;
void main() {
  vec3 box = vec3(30.0, 18.0, 20.0);
  vec3 p = aSeed.xyz * box;
  p.y += uScroll * 2.4 + uTime * 0.07;
  p.x += sin(uTime * 0.1 + aSeed.y * 20.0) * 0.4;
  p = mod(p, box) - box * 0.5;
  p.z -= 4.0;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = (1.0 + aSeed.w * 2.2) * uPixelRatio * (1.0 + uGlow * 0.8) * (12.0 / -mv.z);
  vA = uOpacity * (0.25 + 0.75 * aSeed.w) * smoothstep(30.0, 6.0, -mv.z) * (0.6 + 0.4 * sin(uTime * 0.8 + aSeed.x * 40.0));
}
`;

export const snowFrag = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vA;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  if (d > 1.0) discard;
  float a = exp(-d * d * 4.0) * vA;
  gl_FragColor = vec4(uColor * a, a);
}
`;

// 交互特效粒子：0 = 夜光浮游生物火花（尾迹），1 = 气泡，2 = 点击迸发的火花
export const fxVert = /* glsl */ `
precision highp float;
attribute vec3 aP;
attribute vec3 aV;
attribute vec4 aT;   // 出生时间、寿命、尺寸、类型
attribute vec3 aC;
uniform float uTime;
uniform float uPixelRatio;
uniform float uGlow;
varying vec3 vCol;
varying float vA;
varying float vType;
void main() {
  float age = uTime - aT.x;
  float life = aT.y;
  if (age < 0.0 || age > life || life <= 0.0) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    return;
  }
  float u = age / life;
  vec3 p;
  float a;
  if (aT.w == 1.0) {
    // 气泡：浮力加速上升，左右摇摆
    p = aP + aV * age;
    p.y += 0.45 * age * age;
    p.x += sin(age * 6.0 + aP.z * 10.0 + aP.x * 3.0) * 0.05 * (1.0 + age);
    a = smoothstep(0.0, 0.06, u) * (1.0 - smoothstep(0.7, 1.0, u));
  } else {
    // 火花：初速度迅速衰减，随后缓慢漂散
    p = aP + aV * (1.0 - exp(-age * 2.4)) / 2.4;
    p += vec3(sin(age * 1.3 + aP.x * 7.0), cos(age * 1.1 + aP.y * 5.0), 0.0) * 0.06 * age;
    a = smoothstep(0.0, 0.05, u) * pow(1.0 - u, 1.5);
    a *= 0.75 + 0.25 * sin(age * 18.0 + aP.x * 40.0);
  }
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vCol = aC;
  vA = a;
  vType = aT.w;
  float s = aT.w == 1.0 ? 1.0 : (1.0 + uGlow * 0.9);
  gl_PointSize = clamp(aT.z * uPixelRatio * (12.0 / -mv.z) * s, 1.0, 64.0);
}
`;

export const fxFrag = /* glsl */ `
precision highp float;
varying vec3 vCol;
varying float vA;
varying float vType;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c) * 2.0;
  if (d > 1.0) discard;
  float a;
  if (vType == 1.0) {
    // 气泡：亮边 + 左上角高光
    a = smoothstep(0.55, 0.82, d) * (1.0 - smoothstep(0.86, 1.0, d)) * 0.85;
    a += exp(-dot(c - vec2(-0.17, -0.17), c - vec2(-0.17, -0.17)) * 140.0) * 0.9;
  } else {
    a = exp(-d * d * 5.0);
  }
  a *= vA;
  gl_FragColor = vec4(vCol * a, a);
}
`;

// 高速下潜时的速度线：海雪被拉成细长的流线
export const streakVert = /* glsl */ `
precision highp float;
attribute vec4 aSeed;
attribute float aEnd;
uniform float uTime;
uniform float uScroll;
uniform float uVel;
varying float vA;
void main() {
  vec3 box = vec3(30.0, 18.0, 20.0);
  vec3 p = aSeed.xyz * box;
  p.y += uScroll * 2.4 + uTime * 0.07;
  p = mod(p, box) - box * 0.5;
  p.z -= 4.0;
  float len = clamp(abs(uVel), 0.0, 2.5) * (0.5 + aSeed.w);
  p.y -= sign(uVel) * len * aEnd;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  vA = smoothstep(0.35, 2.5, abs(uVel)) * 0.55 * (1.0 - aEnd) * smoothstep(30.0, 6.0, -mv.z) * (0.25 + 0.75 * aSeed.w);
}
`;

export const streakFrag = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying float vA;
void main() {
  gl_FragColor = vec4(uColor * vA, vA);
}
`;
