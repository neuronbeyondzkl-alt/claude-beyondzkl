// 第一人称漫游：拖动环视、WASD/方向键行走、点击地面走过去；与墙体、固定玻璃、家具做二维碰撞
import * as THREE from 'three';

const EYE = 1.6;
const R = 0.2;

export class Walker {
  constructor(camera, dom) {
    this.camera = camera;
    this.dom = dom;
    this.active = false;
    this.yaw = 0;
    this.pitch = -0.05;
    this.pos = new THREE.Vector3();
    this.keys = new Set();
    this.hold = { f: 0, s: 0 };
    this.obstacles = [];
    this.goal = null;
    this.drag = null;
    this._bind();
  }

  setObstacles(list) { this.obstacles = list; }

  enter(x, z, headingDeg) {
    this.active = true;
    this.pos.set(x, EYE, z);
    this.yaw = -headingDeg * Math.PI / 180;
    this.pitch = -0.08;
    this.goal = null;
    this.camera.fov = 68;
    this.camera.near = 0.05;
    this.camera.updateProjectionMatrix();
    this._apply();
  }

  exit() {
    this.active = false;
    this.keys.clear();
    this.hold = { f: 0, s: 0 };
    this.goal = null;
    this.camera.fov = 42;
    this.camera.updateProjectionMatrix();
  }

  heading() { return -this.yaw * 180 / Math.PI; }

  walkTo(x, z) { this.goal = new THREE.Vector2(x, z); }

  blocked(x, z) {
    for (const [x0, z0, x1, z1] of this.obstacles) {
      const cx = Math.max(x0, Math.min(x, x1)), cz = Math.max(z0, Math.min(z, z1));
      if ((x - cx) ** 2 + (z - cz) ** 2 < R * R) return true;
    }
    return false;
  }

  _move(dx, dz) {
    const p = this.pos;
    if (!this.blocked(p.x + dx, p.z + dz)) { p.x += dx; p.z += dz; return true; }
    let moved = false;
    if (!this.blocked(p.x + dx, p.z)) { p.x += dx; moved = true; }
    if (!this.blocked(p.x, p.z + dz)) { p.z += dz; moved = true; }
    return moved;
  }

  update(dt) {
    if (!this.active) return;
    const k = this.keys;
    let f = this.hold.f, s = this.hold.s;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyA')) s -= 1;
    if (k.has('KeyD')) s += 1;
    if (k.has('ArrowLeft')) this.yaw += 1.8 * dt;
    if (k.has('ArrowRight')) this.yaw -= 1.8 * dt;
    const speed = (k.has('ShiftLeft') || k.has('ShiftRight') ? 2.6 : 1.4) * dt;
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    if (f || s) {
      this.goal = null;
      const len = Math.hypot(f, s);
      this._move((fx * f - fz * s) / len * speed, (fz * f + fx * s) / len * speed);
    } else if (this.goal) {
      const dx = this.goal.x - this.pos.x, dz = this.goal.y - this.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.05) this.goal = null;
      else {
        const st = Math.min(d, speed * 1.2);
        // 转向目标
        const want = Math.atan2(-dx, -dz);
        let diff = want - this.yaw;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.yaw += diff * Math.min(1, dt * 5);
        if (!this._move(dx / d * st, dz / d * st)) this.goal = null;
      }
    }
    this._apply();
  }

  _apply() {
    const c = this.camera;
    c.position.copy(this.pos);
    c.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  _bind() {
    const dom = this.dom;
    dom.addEventListener('pointerdown', (e) => {
      if (!this.active) return;
      this.drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.active || !this.drag || e.pointerId !== this.drag.id) return;
      const s = 0.0042;
      this.yaw = this.drag.yaw + (e.clientX - this.drag.x) * s;
      this.pitch = Math.max(-1.2, Math.min(1.0, this.drag.pitch + (e.clientY - this.drag.y) * s));
      this._apply();
    });
    window.addEventListener('pointerup', () => { this.drag = null; });
    dom.addEventListener('wheel', (e) => {
      if (!this.active) return;
      e.preventDefault();
      const st = -Math.sign(e.deltaY) * 0.35;
      this._move(-Math.sin(this.yaw) * st, -Math.cos(this.yaw) * st);
      this._apply();
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight'].includes(e.code)) {
        this.keys.add(e.code);
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  // 屏幕方向键（手机）
  bindPad(root) {
    for (const b of root.querySelectorAll('[data-pad]')) {
      const [axis, val] = b.dataset.pad.split(':');
      const on = (e) => { e.preventDefault(); this.hold[axis] = Number(val); b.setPointerCapture?.(e.pointerId); };
      const off = () => { this.hold[axis] = 0; };
      b.addEventListener('pointerdown', on);
      b.addEventListener('pointerup', off);
      b.addEventListener('pointercancel', off);
      b.addEventListener('lostpointercapture', off);
    }
  }
}
