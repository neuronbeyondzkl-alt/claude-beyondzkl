// 材质库：每个网格只记录一个材质键（userData.matKey），切换模式时按键替换材质。
//   real  真实材质（意式轻奢）   white 白模   wire 线框（隐藏面，只留棱线）
import * as THREE from 'three';
import * as T from './textures.js';

// 两组剖切面：model 用于“单独查看”房间；arch 额外包含“半高墙”的水平剖切面
export const planes = { model: [], arch: [] };

const rep = (tex, r, rot) => {
  const t = tex.clone();
  t.repeat.set(r, r);
  if (rot !== undefined) { t.center.set(0.5, 0.5); t.rotation = rot; }
  t.needsUpdate = true;
  return t;
};

const std = (o) => new THREE.MeshStandardMaterial(o);

// cat：arch 建筑 / floor 地面 / furn 家具 / soft 软装 / glass 玻璃 / glow 发光体
// glow：夜间自发光强度
const DEF = {
  // —— 建筑 ——
  wall: { cat: 'arch', make: () => std({ color: '#ebe6df', roughness: 0.92 }) },
  wallStruct: { cat: 'arch', make: () => std({ color: '#e6e0d8', roughness: 0.92 }) },
  shaft: { cat: 'arch', make: () => std({ color: '#ddd6cc', roughness: 0.95 }) },
  slab: { cat: 'floor', make: () => std({ map: rep(T.concreteTex(), 0.5), color: '#b9bcbf', roughness: 0.96 }) },
  marbleFloor: { cat: 'floor', make: () => std({ map: rep(T.marbleTex('calacatta', { tiles: 2 }), 1 / 1.8), roughness: 0.16, envMapIntensity: 0.9 }) },
  woodFloor: { cat: 'floor', make: () => std({ map: rep(T.herringboneTex(), 1 / 1.2, Math.PI / 4), roughness: 0.48, envMapIntensity: 0.7 }) },
  bathFloor: { cat: 'floor', make: () => std({ map: rep(T.marbleTex('pietra', { tiles: 2 }), 1 / 1.2), roughness: 0.4 }) },
  kitchenFloor: { cat: 'floor', make: () => std({ map: rep(T.marbleTex('greige', { tiles: 2 }), 1 / 1.2), color: '#e7e1d9', roughness: 0.34 }) },
  balconyFloor: { cat: 'floor', make: () => std({ map: rep(T.marbleTex('pietra', { tiles: 2 }), 1 / 1.2), color: '#d2ccc5', roughness: 0.75 }) },
  marbleWall: { cat: 'arch', make: () => std({ map: rep(T.marbleTex('greige'), 1 / 2.4), roughness: 0.18, envMapIntensity: 0.9 }) },
  bathWall: { cat: 'arch', make: () => std({ map: rep(T.marbleTex('calacatta', { tiles: 1 }), 1 / 1.2), color: '#f1ece6', roughness: 0.2 }) },
  showerWall: { cat: 'arch', make: () => std({ map: rep(T.marbleTex('greige', { tiles: 2 }), 1 / 1.2), roughness: 0.22 }) },
  wallPanel: { cat: 'arch', make: () => std({ map: rep(T.fabricTex('#b9ab9a', { seed: 8, weave: 6 }), 4), roughness: 0.95 }) },
  fluteWall: { cat: 'arch', make: () => std({ map: rep(T.flutedTex('#6a4a34', '#3d2a1e'), 6), roughness: 0.5 }) },
  frame: { cat: 'arch', make: () => std({ color: '#3f362e', metalness: 0.7, roughness: 0.38 }) },
  glass: { cat: 'glass', make: () => std({ color: '#dbe7ef', metalness: 0.1, roughness: 0.04, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.4 }) },
  frosted: { cat: 'glass', make: () => std({ color: '#eef2f4', roughness: 0.55, transparent: true, opacity: 0.6, depthWrite: false }) },
  doorLeaf: { cat: 'arch', make: () => std({ map: rep(T.veneerTex('walnut'), 1.2), roughness: 0.42 }) },
  entryDoor: { cat: 'arch', make: () => std({ color: '#2f2a26', metalness: 0.55, roughness: 0.42 }) },
  curtain: { cat: 'soft', clip: 'arch', make: () => std({ map: rep(T.fabricTex('#d6ccbf', { seed: 4, weave: 3 }), 6), roughness: 1, side: THREE.DoubleSide }) },
  sheer: { cat: 'glass', clip: 'arch', make: () => std({ color: '#f6f2ec', roughness: 1, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }) },

  // —— 家具 ——
  fabricSofa: { cat: 'furn', make: () => std({ map: rep(T.fabricTex('#ddd5c9', { seed: 2, weave: 2, grain: 0.18 }), 6), roughness: 1 }) },
  fabricGrey: { cat: 'furn', make: () => std({ map: rep(T.fabricTex('#8e8a85', { seed: 5 }), 6), roughness: 1 }) },
  fabricTaupe: { cat: 'furn', make: () => std({ map: rep(T.fabricTex('#a5998a', { seed: 6 }), 6), roughness: 1 }) },
  fabricBed: { cat: 'soft', make: () => std({ map: rep(T.fabricTex('#f3f0ea', { seed: 9, grain: 0.05 }), 6), roughness: 0.95 }) },
  fabricThrow: { cat: 'soft', make: () => std({ map: rep(T.fabricTex('#9a6b45', { seed: 10, weave: 6 }), 6), roughness: 1 }) },
  fabricCushion: { cat: 'soft', make: () => std({ map: rep(T.fabricTex('#4a4643', { seed: 12 }), 6), roughness: 1 }) },
  velvetOlive: { cat: 'soft', make: () => std({ color: '#5f6548', roughness: 0.75 }) },
  velvetBlue: { cat: 'soft', make: () => std({ color: '#2B4868', roughness: 0.7 }) },
  leatherCognac: { cat: 'furn', make: () => std({ color: '#8b5734', roughness: 0.48, envMapIntensity: 0.8 }) },
  leatherGreige: { cat: 'furn', make: () => std({ color: '#b6a897', roughness: 0.55 }) },
  leatherDark: { cat: 'furn', make: () => std({ color: '#3a2f29', roughness: 0.5 }) },
  walnut: { cat: 'furn', make: () => std({ map: rep(T.veneerTex('walnut'), 1.5), roughness: 0.42 }) },
  oak: { cat: 'furn', make: () => std({ map: rep(T.veneerTex('oak'), 1.5), roughness: 0.5 }) },
  fluteWalnut: { cat: 'furn', make: () => std({ map: rep(T.flutedTex('#6a4a34', '#3d2a1e'), 8), roughness: 0.45 }) },
  lacquer: { cat: 'furn', make: () => std({ color: '#cbc3b8', roughness: 0.55 }) },
  lacquerDark: { cat: 'furn', make: () => std({ color: '#4a4541', roughness: 0.5 }) },
  lacquerWhite: { cat: 'furn', make: () => std({ color: '#efece6', roughness: 0.45 }) },
  marbleTop: { cat: 'furn', make: () => std({ map: rep(T.marbleTex('calacatta'), 1 / 1.6), roughness: 0.12, envMapIntensity: 1 }) },
  marbleNero: { cat: 'furn', make: () => std({ map: rep(T.marbleTex('nero'), 1 / 1.4), roughness: 0.1, envMapIntensity: 1.1 }) },
  marbleGreige: { cat: 'furn', make: () => std({ map: rep(T.marbleTex('greige'), 1 / 1.4), roughness: 0.15 }) },
  brass: { cat: 'furn', make: () => std({ color: '#c2a36b', metalness: 1, roughness: 0.3 }) },
  bronze: { cat: 'furn', make: () => std({ color: '#4a3e33', metalness: 0.85, roughness: 0.4 }) },
  chrome: { cat: 'furn', make: () => std({ color: '#e2e2e2', metalness: 1, roughness: 0.12 }) },
  steel: { cat: 'furn', make: () => std({ color: '#b7babc', metalness: 0.9, roughness: 0.3 }) },
  ceramic: { cat: 'furn', make: () => std({ color: '#f7f6f3', roughness: 0.1, envMapIntensity: 1 }) },
  blackGlass: { cat: 'furn', make: () => std({ color: '#0d0f12', metalness: 0.3, roughness: 0.08, envMapIntensity: 1.2 }) },
  mirror: { cat: 'furn', make: () => std({ color: '#eef2f4', metalness: 1, roughness: 0.03, envMapIntensity: 1.3 }) },
  rubber: { cat: 'furn', make: () => std({ color: '#2a2a2a', roughness: 0.9 }) },
  rugLiving: { cat: 'soft', make: () => std({ map: T.rugTex('living'), roughness: 1 }) },
  rugMaster: { cat: 'soft', make: () => std({ map: T.rugTex('master'), roughness: 1 }) },
  rugBed: { cat: 'soft', make: () => std({ map: T.rugTex('bed'), roughness: 1 }) },
  rugRunner: { cat: 'soft', make: () => std({ map: T.rugTex('runner'), roughness: 1 }) },
  books: { cat: 'soft', make: () => { const t = rep(T.booksTex(), 1); t.repeat.set(1.2, 3.6); return std({ map: t, roughness: 0.8 }); } },
  paper: { cat: 'soft', make: () => std({ color: '#f4f1ea', roughness: 0.9 }) },
  leaf: { cat: 'soft', make: () => std({ color: '#5a7041', roughness: 0.7, side: THREE.DoubleSide }) },
  leafDark: { cat: 'soft', make: () => std({ color: '#3f5530', roughness: 0.7, side: THREE.DoubleSide }) },
  pot: { cat: 'furn', make: () => std({ color: '#3b3734', roughness: 0.55 }) },
  potLight: { cat: 'furn', make: () => std({ color: '#d9d2c7', roughness: 0.65 }) },
  soil: { cat: 'furn', make: () => std({ color: '#3a2c22', roughness: 1 }) },
  clothes: { cat: 'soft', make: () => std({ map: rep(T.fabricTex('#8f877d', { seed: 21, weave: 2 }), 3), roughness: 1 }) },
  clothesLight: { cat: 'soft', make: () => std({ color: '#e6ded2', roughness: 1 }) },
  clothesDark: { cat: 'soft', make: () => std({ color: '#2f3640', roughness: 1 }) },
  water: { cat: 'glass', make: () => std({ color: '#bcd3dc', roughness: 0.05, transparent: true, opacity: 0.5, depthWrite: false }) },

  // —— 发光体：夜间点亮 ——
  lampShade: { cat: 'furn', glow: 1.6, glowColor: '#ffcf96', make: () => std({ color: '#f1e7d6', roughness: 0.9, side: THREE.DoubleSide }) },
  bulb: { cat: 'furn', glow: 5, glowColor: '#ffe0b0', make: () => std({ color: '#fff4e0', roughness: 0.2 }) },
  led: { cat: 'furn', glow: 3.2, glowColor: '#ffd59e', make: () => std({ color: '#f3ece0', roughness: 0.6 }) },
  screen: { cat: 'furn', glow: 0.22, glowColor: '#6C9AC4', make: () => std({ color: '#1a2230', roughness: 0.2 }) },
};

const REAL = new Map();
const glowMats = [];

export function catOf(key) {
  if (key.startsWith('art:')) return 'soft';
  return (DEF[key] || DEF.wall).cat;
}

// 哪些材质参与“半高墙”剖切：建筑、玻璃、窗帘与墙上挂画；家具保持完整
export function clipOf(key) {
  if (key.startsWith('art:')) return 'arch';
  const def = DEF[key] || DEF.wall;
  return def.clip || (def.cat === 'arch' || def.cat === 'glass' ? 'arch' : 'model');
}

export function M(key) {
  if (REAL.has(key)) return REAL.get(key);
  let m, def;
  if (key.startsWith('art:')) {
    const [, seed, w, h] = key.split(':').map(Number);
    m = std({ map: T.artTex(seed, w || 600, h || 800), roughness: 0.85 });
    def = { cat: 'soft' };
  } else {
    def = DEF[key];
    if (!def) throw new Error('未定义的材质：' + key);
    m = def.make();
  }
  m.name = key;
  m.clippingPlanes = planes[clipOf(key)];
  if (def.glow) {
    m.emissive = new THREE.Color(def.glowColor);
    m.emissiveIntensity = 0;
    m.userData.glow = def.glow;
    glowMats.push(m);
  }
  REAL.set(key, m);
  return m;
}

// —— 白模 ——
const WHITE = {};
function white(key) {
  const def = DEF[key];
  const clip = clipOf(key);
  if (def && def.glow) {
    const k = 'glow:' + key;
    if (!WHITE[k]) {
      WHITE[k] = std({ color: '#ffffff', roughness: 0.6, emissive: new THREE.Color(def.glowColor), emissiveIntensity: 0 });
      WHITE[k].userData.glow = def.glow;
      WHITE[k].clippingPlanes = planes.model;
      glowMats.push(WHITE[k]);
    }
    return WHITE[k];
  }
  const cat = key === 'mirror' ? 'mirror' : catOf(key);
  const k = cat + ':' + clip;
  if (!WHITE[k]) {
    const o = {
      arch: { color: '#f6f5f2', roughness: 0.9 },
      floor: { color: '#e4e3df', roughness: 0.9 },
      furn: { color: '#fbfaf8', roughness: 0.75 },
      soft: { color: '#f1f0ec', roughness: 0.95, side: THREE.DoubleSide },
      glass: { color: '#e6eef5', roughness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide },
      mirror: { color: '#dfe5ea', roughness: 0.15, metalness: 0.6 },
    }[cat];
    WHITE[k] = std(o);
    WHITE[k].clippingPlanes = planes[clip];
  }
  return WHITE[k];
}

// —— 线框：面只写深度（消隐线），透明体不渲染 ——
const depthMat = (clip) => {
  const m = new THREE.MeshBasicMaterial({ colorWrite: false, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  m.clippingPlanes = planes[clip];
  return m;
};
const DEPTH = { arch: depthMat('arch'), model: depthMat('model'), none: new THREE.MeshBasicMaterial({ visible: false }) };

// 棱线材质（线框模式与白模共用，颜色随模式/昼夜切换）
const LINES = new Map();
export function lineMat(key) {
  const cat = catOf(key), clip = clipOf(key), k = cat + ':' + clip;
  if (!LINES.has(k)) {
    const m = new THREE.LineBasicMaterial({ color: '#376392', transparent: true });
    m.clippingPlanes = planes[clip];
    m.userData.cat = cat;
    LINES.set(k, m);
  }
  return LINES.get(k);
}

// Loyel 渐变蓝色板
const LINE_COLORS = {
  day: { arch: '#263B54', floor: '#9FBDDA', furn: '#376392', soft: '#6C9AC4', glass: '#9FBDDA' },
  night: { arch: '#E8EEF6', floor: '#497DAE', furn: '#9FBDDA', soft: '#6C9AC4', glass: '#497DAE' },
};

export function setLineStyle(mode, night) {
  const pal = LINE_COLORS[night ? 'night' : 'day'];
  for (const m of LINES.values()) {
    const cat = m.userData.cat;
    if (mode === 'wire') { m.color.set(pal[cat]); m.opacity = cat === 'glass' ? 0.7 : 1; }
    else { m.color.set(night ? '#6C9AC4' : '#9FBDDA'); m.opacity = night ? 0.22 : 0.4; }
  }
}

export function materialFor(mode, key) {
  if (mode === 'real') return M(key);
  if (mode === 'white') return white(key);
  return catOf(key) === 'glass' ? DEPTH.none : DEPTH[clipOf(key)];
}

export function setGlow(f) {
  for (const m of glowMats) m.emissiveIntensity = m.userData.glow * f;
}
