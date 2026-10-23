// 灯光：白天 = 天空光 + 太阳（投影）+ 环境反射；夜晚 = 月光 + 每个房间的室内灯 + 台灯 / 吊灯 / 落地灯
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { M } from './geo.js';
import { LOYEL } from './materials.js';

export class Lighting {
  constructor(scene, renderer, center, roomLights, accentLights) {
    this.scene = scene;
    const pm = new THREE.PMREMGenerator(renderer);
    this.env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    scene.environment = this.env;

    this.hemi = new THREE.HemisphereLight('#EEF3F9', '#BDB2A4', 1.1);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight('#FFF3E2', 2.8);
    this.sun.position.set(center.x - 6, 15, center.z + 10);
    this.sun.target.position.copy(center);
    this.sun.castShadow = true;
    const s = this.sun.shadow;
    s.mapSize.set(2048, 2048);
    s.camera.left = -10; s.camera.right = 10; s.camera.top = 9; s.camera.bottom = -9;
    s.camera.near = 2; s.camera.far = 40;
    s.bias = -0.0004; s.normalBias = 0.025; s.radius = 3;
    scene.add(this.sun, this.sun.target);

    this.moon = new THREE.DirectionalLight(LOYEL.c40, 0.35);
    this.moon.position.set(center.x + 8, 14, center.z - 6);
    this.moon.target.position.copy(center);
    scene.add(this.moon, this.moon.target);

    this.interior = new THREE.Group();
    scene.add(this.interior);
    for (const L of roomLights) {
      const p = new THREE.PointLight('#FFD2A0', 7.5 * L.i, 7.5, 2);
      p.position.set(M(L.x), 2.45, M(L.z));
      p.userData.base = p.intensity;
      this.interior.add(p);
    }
    // 台灯 / 吊灯 / 落地灯随家具一起显隐
    this.accent = new THREE.Group();
    this.interior.add(this.accent);
    for (const L of accentLights) {
      const p = new THREE.PointLight('#FFC88A', 3.2 * L.i, L.d || 3, 2);
      p.position.set(L.x, L.y, L.z);
      p.userData.base = p.intensity;
      this.accent.add(p);
    }
    this.setNight(false);
  }

  // 白模需要更明显的明暗关系：减弱天空光和环境光，让太阳的方向光主导
  setStyle(mode) {
    this.style = mode;
    this.setNight(!!this.night);
  }

  setNight(night) {
    this.night = night;
    const clay = this.style === 'clay';
    this.hemi.intensity = night ? 0.12 : clay ? 0.7 : 1.1;
    this.hemi.color.set(night ? LOYEL.c80 : '#EEF3F9');
    this.hemi.groundColor.set(night ? '#1C2430' : '#BDB2A4');
    this.sun.visible = !night;
    this.moon.visible = night;
    this.interior.visible = night;
    this.scene.environmentIntensity = night ? 0.1 : clay ? 0.28 : 0.55;
  }

  setAccent(on) { this.accent.visible = on; }

  setShadowQuality(size) {
    this.sun.shadow.mapSize.set(size, size);
    if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; }
  }
}
