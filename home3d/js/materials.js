// 材质库：同一个「角色」（role）在三种显示模式下对应不同材质。
//   real：真实材质（意式轻奢：鱼肚白 / 卡拉卡塔大理石、胡桃木、奶咖烤漆、香槟金、丝绒与皮革）
//   clay：白模
//   wire：线框（面隐藏，只画边线；地面保留一层很淡的底色便于读图）
import * as THREE from 'three';

// Loyel 渐变蓝色板
export const LOYEL = {
  c10: '#F4F7FB', c20: '#E8EEF6', c30: '#CCDBEB', c40: '#9FBDDA', c50: '#6C9AC4',
  c60: '#497DAE', c70: '#376392', c80: '#2E5076', c90: '#2B4868', c100: '#263B54',
};

const EMISSIVE_ROLES = ['lampShade', 'led', 'bulb', 'screen'];

export class MaterialLibrary {
  constructor(T) {
    this.T = T;
    this.mode = 'real';
    this.night = false;
    for (const t of [T.floorMarble, T.floorMarbleInlay, T.floorWood, T.floorTileBath, T.floorTileKitchen, T.floorTileBalcony,
      T.tileMarble, T.panelFabric, T.walnut, T.calacatta, T.fishbelly, T.arabescato, T.nero]) {
      const s = t.userData.size;
      t.repeat.set(1 / s, 1 / s);
    }
    T.fabricBump.repeat.set(10, 10);

    const std = (o) => new THREE.MeshStandardMaterial(o);
    const fabric = (color, extra = {}) => std({ color, roughness: 0.95, bumpMap: T.fabricBump, bumpScale: 0.6, ...extra });
    const velvet = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.35), bumpMap: T.fabricBump, bumpScale: 0.3 });

    this.real = {
      wallCore: std({ color: '#EDE8E1', roughness: 0.92 }),
      wallExt: std({ color: '#E3DFDA', roughness: 0.95 }),
      cap: std({ color: '#3B3631', roughness: 0.85 }),
      slab: std({ color: '#CFCAC3', roughness: 0.95 }),
      paintWarm: std({ color: '#EFEAE3', roughness: 0.9 }),
      paintGreige: std({ color: '#E3DACF', roughness: 0.9 }),
      marbleSlab: std({ map: T.arabescato, roughness: 0.14 }),
      panelFabric: std({ map: T.panelFabric, roughness: 0.85 }),
      tileMarble: std({ map: T.tileMarble, roughness: 0.16 }),
      floorMarble: std({ map: T.floorMarble, roughness: 0.14 }),
      floorMarbleInlay: std({ map: T.floorMarbleInlay, roughness: 0.14 }),
      floorWood: std({ map: T.floorWood, roughness: 0.5 }),
      floorTileBath: std({ map: T.floorTileBath, roughness: 0.55 }),
      floorTileKitchen: std({ map: T.floorTileKitchen, roughness: 0.35 }),
      floorTileBalcony: std({ map: T.floorTileBalcony, roughness: 0.85 }),
      calacatta: std({ map: T.calacatta, roughness: 0.12 }),
      fishbelly: std({ map: T.fishbelly, roughness: 0.12 }),
      arabescato: std({ map: T.arabescato, roughness: 0.12 }),
      marbleDark: std({ map: T.nero, roughness: 0.1 }),
      quartz: std({ color: '#F1EEE9', roughness: 0.22 }),
      walnut: std({ map: T.walnut, roughness: 0.42 }),
      walnutDark: std({ map: T.walnut, color: '#9A8A80', roughness: 0.45 }),
      lacquerCream: std({ color: '#D9CCBC', roughness: 0.5 }),
      lacquerTaupe: std({ color: '#A79888', roughness: 0.5 }),
      lacquerDark: std({ color: '#3A3632', roughness: 0.45 }),
      lacquerWhite: std({ color: '#EEEBE6', roughness: 0.45 }),
      skirting: std({ color: '#4A3E34', roughness: 0.45 }),
      brass: std({ color: '#C9A56B', metalness: 1, roughness: 0.3 }),
      steel: std({ color: '#C8CBCD', metalness: 1, roughness: 0.28 }),
      blackMetal: std({ color: '#1E1D1C', metalness: 0.6, roughness: 0.4 }),
      frame: std({ color: '#3B3835', metalness: 0.55, roughness: 0.45 }),
      fabricOat: fabric('#D8CDBF'),
      fabricBlue: fabric('#8EA2B6'),
      fabricSage: fabric('#A4AB97'),
      fabricSofa: fabric('#D4CABD'),
      velvetSage: velvet('#7F8C74'),
      velvetCaramel: velvet('#A9734A'),
      leatherCognac: std({ color: '#8E5532', roughness: 0.48, bumpMap: T.fabricBump, bumpScale: 0.15 }),
      leatherDark: std({ color: '#3B2C24', roughness: 0.5 }),
      linen: fabric('#F3EFE8'),
      linenGrey: fabric('#CBC3B8'),
      throwCaramel: fabric('#B4825A'),
      ceramic: std({ color: '#F7F6F3', roughness: 0.1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: '#E6EEF2', transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, depthWrite: false, side: THREE.DoubleSide }),
      glassSmoke: new THREE.MeshPhysicalMaterial({ color: '#5E5852', transparent: true, opacity: 0.5, roughness: 0.08, depthWrite: false }),
      glassFluted: new THREE.MeshPhysicalMaterial({ color: '#EEF2F2', transparent: true, opacity: 0.55, roughness: 0.35, depthWrite: false, side: THREE.DoubleSide }),
      mirror: std({ color: '#DCE2E6', metalness: 1, roughness: 0.03 }),
      screen: std({ color: '#0C0D0F', roughness: 0.12, metalness: 0.3, emissive: '#5A7FA6', emissiveIntensity: 0 }),
      blackGlass: std({ color: '#141414', roughness: 0.08, metalness: 0.3 }),
      lampShade: std({ color: '#F2E7D5', roughness: 0.9, emissive: '#FFD49A', emissiveIntensity: 0, side: THREE.DoubleSide }),
      led: std({ color: '#EFE2CC', emissive: '#FFC982', emissiveIntensity: 0 }),
      bulb: std({ color: '#F5EBDD', emissive: '#FFD8A6', emissiveIntensity: 0, roughness: 0.3 }),
      radiator: std({ color: '#E8E5E0', roughness: 0.45, metalness: 0.15 }),
      appliance: std({ color: '#F2F1EE', roughness: 0.35 }),
      rugBorder: std({ map: T.rugBorder, roughness: 1 }),
      rugPlain: std({ map: T.rugPlain, roughness: 1 }),
      curtainSheer: std({ color: '#F5F2ED', transparent: true, opacity: 0.6, roughness: 1, side: THREE.DoubleSide, depthWrite: false }),
      curtainHeavy: fabric('#B3A390', { side: THREE.DoubleSide }),
      plant: std({ color: '#6F7F57', roughness: 0.8, side: THREE.DoubleSide }),
      plantDark: std({ color: '#53633F', roughness: 0.8, side: THREE.DoubleSide }),
      bark: std({ color: '#6B5A48', roughness: 0.9 }),
      pot: std({ color: '#B58A68', roughness: 0.9 }),
      soil: std({ color: '#4A3C30', roughness: 1 }),
      paper: std({ color: '#F4F0E8', roughness: 0.95 }),
      book1: std({ color: '#2B4868', roughness: 0.8 }), book2: std({ color: '#C9BBA6', roughness: 0.8 }),
      book3: std({ color: '#8E5532', roughness: 0.8 }), book4: std({ color: '#E8E2D6', roughness: 0.8 }),
      book5: std({ color: '#6C9AC4', roughness: 0.8 }), book6: std({ color: '#3B3632', roughness: 0.8 }),
      clothes1: fabric('#D9D2C7'), clothes2: fabric('#8D8478'), clothes3: fabric('#3D4B5C'), clothes4: fabric('#B79B7E'),
      rubber: std({ color: '#2A2A2A', roughness: 0.9 }),
      ground: new THREE.ShadowMaterial({ opacity: 0.16 }),
      highlight: new THREE.MeshBasicMaterial({ color: LOYEL.c50, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }),
    };
    this.art = {};
    for (const [k, t] of Object.entries(T.art)) this.art[k] = std({ map: t, roughness: 0.85 });

    const clay = std({ color: '#F3F2EF', roughness: 0.88 });
    const clayFloor = std({ color: '#ECEBE7', roughness: 0.9 });
    const clayCap = std({ color: LOYEL.c40, roughness: 0.8 });
    const clayGlass = new THREE.MeshStandardMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.22, roughness: 0.2, depthWrite: false, side: THREE.DoubleSide });
    const clayLamp = std({ color: '#FFFFFF', roughness: 0.6, emissive: '#FFE2B8', emissiveIntensity: 0, side: THREE.DoubleSide });
    const clayScreen = std({ color: '#E6E6E3', roughness: 0.6, emissive: '#9FBDDA', emissiveIntensity: 0 });
    this.clay = { _default: clay, cap: clayCap, glass: clayGlass, glassSmoke: clayGlass, glassFluted: clayGlass, curtainSheer: clayGlass,
      lampShade: clayLamp, led: clayLamp, bulb: clayLamp, screen: clayScreen, ground: this.real.ground, highlight: this.real.highlight };
    for (const k of Object.keys(this.real)) if (k.startsWith('floor')) this.clay[k] = clayFloor;

    const hidden = new THREE.MeshBasicMaterial({ visible: false });
    this.wireFloor = new THREE.MeshBasicMaterial({ color: LOYEL.c20, transparent: true, opacity: 0.55, depthWrite: false });
    this.wire = { _default: hidden, ground: hidden, highlight: this.real.highlight };
    for (const k of Object.keys(this.real)) if (k.startsWith('floor')) this.wire[k] = this.wireFloor;

    // 边线
    this.lines = {
      arch: new THREE.LineBasicMaterial({ color: LOYEL.c70 }),
      furn: new THREE.LineBasicMaterial({ color: LOYEL.c50 }),
      glass: new THREE.LineBasicMaterial({ color: LOYEL.c40 }),
      floor: new THREE.LineBasicMaterial({ color: LOYEL.c60 }),
      clay: new THREE.LineBasicMaterial({ color: '#A8A6A1', transparent: true, opacity: 0.7 }),
    };
  }

  get(role) {
    if (this.mode === 'real') return this.real[role] || this.art[role] || this.real.wallCore;
    const table = this.mode === 'clay' ? this.clay : this.wire;
    return table[role] || table._default;
  }

  setNight(night) {
    this.night = night;
    const k = night ? 1 : 0;
    this.real.lampShade.emissiveIntensity = 1.6 * k;
    this.real.led.emissiveIntensity = 2.2 * k;
    this.real.bulb.emissiveIntensity = 3 * k;
    this.real.screen.emissiveIntensity = 0.12 * k;
    this.clay.lampShade.emissiveIntensity = 1.2 * k;
    this.clay.screen.emissiveIntensity = 0.15 * k;
    this.wireFloor.color.set(night ? LOYEL.c90 : LOYEL.c20);
    this.wireFloor.opacity = night ? 0.6 : 0.55;
    this.lines.arch.color.set(night ? LOYEL.c30 : LOYEL.c70);
    this.lines.furn.color.set(night ? LOYEL.c40 : LOYEL.c50);
    this.lines.glass.color.set(night ? LOYEL.c50 : LOYEL.c40);
    this.lines.floor.color.set(night ? LOYEL.c40 : LOYEL.c60);
    this.real.ground.opacity = night ? 0.0 : 0.16;
  }

  isEmissive(role) { return EMISSIVE_ROLES.includes(role); }
}

// 给一个对象树里所有带 role 的网格换上当前模式的材质，并按需生成 / 显示边线
export function applyMode(root, lib) {
  const mode = lib.mode;
  root.traverse((o) => {
    if (!o.isMesh || !o.userData.role) return;
    const r = o.userData.role;
    o.material = Array.isArray(r) ? r.map((x) => lib.get(x)) : lib.get(r);
    const wantEdges = (mode === 'wire' || (mode === 'clay' && !o.userData.noClayEdges)) && !o.userData.noEdges;
    if (wantEdges && !o.userData.edges) {
      const g = new THREE.EdgesGeometry(o.geometry, o.userData.edgeAngle || 28);
      const line = new THREE.LineSegments(g, lib.lines.arch);
      line.raycast = () => {};
      line.userData.isEdge = true;
      o.add(line);
      o.userData.edges = line;
    }
    if (o.userData.edges) {
      o.userData.edges.visible = wantEdges;
      o.userData.edges.material = mode === 'clay' ? lib.lines.clay : lib.lines[o.userData.cat || 'arch'];
    }
    o.castShadow = mode !== 'wire' && !o.userData.noShadow;
    o.receiveShadow = mode !== 'wire';
  });
}
