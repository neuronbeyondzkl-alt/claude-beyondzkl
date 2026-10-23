// 视角：3D 总览（轨道相机）、平面图（正交俯视）、进入房间（人眼高度环视 + 行走）
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { M } from './geo.js';

const EYE = 1.55;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Views {
  // planBox：平面图要完整显示的范围（米，含轴号与尺寸线）
  constructor(dom, center, planBox) {
    this.dom = dom;
    this.center = center.clone();
    this.planBox = planBox;
    this.planC = new THREE.Vector3((planBox.x0 + planBox.x1) / 2, 0, (planBox.z0 + planBox.z1) / 2);
    this.planShift = 0;         // 底部控制条遮住的部分，平面图整体上移
    this.mode = 'orbit';

    this.cam = new THREE.PerspectiveCamera(40, 1, 0.05, 300);
    this.home = { pos: new THREE.Vector3(center.x + 5.5, 15.5, center.z + 14.5), target: new THREE.Vector3(center.x, 0.2, center.z + 0.3) };
    this.cam.position.copy(this.home.pos);
    this.touched = false;       // 用户动过视角后，窗口尺寸变化不再自动重设总览机位
    this.orbit = new OrbitControls(this.cam, dom);
    this.orbit.addEventListener('start', () => { this.touched = true; });
    this.orbit.target.copy(this.home.target);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle = 1.48;
    this.orbit.minDistance = 1.5;
    this.orbit.maxDistance = 48;
    this.orbit.zoomToCursor = true;
    this.orbit.update();

    this.plan = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 200);
    this.plan.up.set(0, 0, -1);
    this.plan.position.set(this.planC.x, 60, this.planC.z);
    this.plan.lookAt(this.planC.x, 0, this.planC.z);
    this.planCtl = new OrbitControls(this.plan, dom);
    this.planCtl.target.set(this.planC.x, 0, this.planC.z);
    this.planCtl.enableRotate = false;
    this.planCtl.screenSpacePanning = true;
    this.planCtl.zoomToCursor = true;
    this.planCtl.minZoom = 0.5; this.planCtl.maxZoom = 8;
    this.planCtl.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.planCtl.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    this.planCtl.enabled = false;
    this.planCtl.update();

    this.walk = { yaw: 0, pitch: 0, bounds: null, keys: new Set(), drag: null, pinch: null };
    this.tween = null;
    this._bindWalk();
  }

  get camera() { return this.mode === 'plan' ? this.plan : this.cam; }

  resize(w, h) {
    this.w = w; this.h = h;
    this.cam.aspect = w / h;
    this.cam.updateProjectionMatrix();
    this._fitHome();
    this._fitPlan();
  }

  // 总览机位随画面比例调整：竖屏时从东南侧更远处看，让长边沿屏幕纵向展开
  _fitHome() {
    const a = this.w / this.h, c = this.center;
    const off = a >= 1 ? new THREE.Vector3(5.5, 15.5, 14.5) : new THREE.Vector3(13, 17, 8.5);
    const k = a >= 1 ? Math.max(1, 1.45 / a) ** 0.8 : Math.max(1, 0.85 / a) ** 0.85;
    this.home.pos.copy(c).add(off.multiplyScalar(k));
    if (!this.touched && this.mode === 'orbit' && !this.tween) {
      this.cam.position.copy(this.home.pos);
      this.orbit.target.copy(this.home.target);
      this.orbit.update();
    }
  }

  _fitPlan() {
    const B = this.planBox;
    const dock = this.w < 860 ? 96 : 80;                 // 底部控制条高度（像素）
    const usable = Math.max(1, this.h - dock);
    const a = this.w / usable;
    const pad = 1.04;
    let hw = ((B.x1 - B.x0) / 2) * pad, hh = ((B.z1 - B.z0) / 2) * pad;
    if (hw / hh > a) hh = hw / a; else hw = hh * a;
    const full = hh * (this.h / usable);
    Object.assign(this.plan, { left: -hw, right: hw, top: full, bottom: -full });
    this.plan.updateProjectionMatrix();
    const shift = (dock / 2) * ((2 * full) / this.h);
    const moved = shift - this.planShift;
    this.planShift = shift;
    if (this.planCtl) { this.planCtl.target.z += moved; this.plan.position.z += moved; }
  }

  // 竖屏时把相机拉远一些，保证目标完整入画
  _narrow() { return Math.max(1, 1.2 / this.cam.aspect) ** 0.7; }

  // —— 动画 ——
  flyTo(pos, target, dur = 1.1, done, fov = 40) {
    let t0 = this.orbit.target.clone();
    if (this.mode === 'walk') t0 = this.cam.position.clone().add(new THREE.Vector3(0, 0, -1).applyEuler(this.cam.rotation));
    this.tween = {
      t: 0, dur,
      p0: this.cam.position.clone(), p1: pos.clone(),
      t0, t1: target.clone(),
      f0: this.cam.fov, f1: fov,
      done,
    };
  }

  overview() {
    if (this.mode === 'walk') this._leaveWalk();
    if (this.mode === 'plan') return this.resetPlan();
    this.flyTo(this.home.pos, this.home.target, 1.2);
  }

  resetPlan() {
    const z = this.planC.z + this.planShift;
    this.planCtl.target.set(this.planC.x, 0, z);
    this.plan.position.set(this.planC.x, 60, z);
    this.plan.zoom = 1; this.plan.updateProjectionMatrix();
  }

  focusRoom(room, meta) {
    const c = new THREE.Vector3(M(meta.cx), 0.4, M(meta.cz));
    if (this.mode === 'plan') {
      this.planCtl.target.set(c.x, 0, c.z);
      this.plan.position.set(c.x, 60, c.z);
      this.plan.zoom = Math.min(3.2, Math.max(1.4, 9 / Math.max(M(meta.w), M(meta.d))));
      this.plan.updateProjectionMatrix();
      return;
    }
    if (this.mode === 'walk') this._leaveWalk();
    const span = Math.max(M(meta.w), M(meta.d));
    const dist = (span * 1.35 + 3.2) * this._narrow();
    const dir = this.cam.position.clone().sub(this.orbit.target).setY(0);
    if (dir.lengthSq() < 0.01) dir.set(0.3, 0, 1);
    dir.normalize();
    const pos = c.clone().addScaledVector(dir, dist * 0.62).setY(c.y + dist * 0.82);
    this.flyTo(pos, c, 1.0);
  }

  // hint：从哪个水平方向看过去（通常是家具正面 / 房间中心方向），避免相机落在墙后
  focusPoint(p, radius = 1, hint = null) {
    if (this.mode === 'plan') {
      this.planCtl.target.set(p.x, 0, p.z); this.plan.position.set(p.x, 60, p.z);
      this.plan.zoom = 3.5; this.plan.updateProjectionMatrix();
      return;
    }
    if (this.mode === 'walk') {
      const d = p.clone().sub(this.cam.position);
      this.walk.yaw = Math.atan2(-d.x, -d.z);
      this.walk.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      return;
    }
    if (this.mode === 'entering') this._leaveWalk();
    const dir = hint && hint.lengthSq() > 1e-4 ? hint.clone().setY(0) : this.cam.position.clone().sub(this.orbit.target).setY(0);
    if (dir.lengthSq() < 1e-4) dir.set(0.3, 0, 1);
    dir.normalize();
    const dist = Math.max(2.6, radius * 3.0) * this._narrow();
    const el = 0.9;              // 约 52° 俯角：没有天花板，从斜上方看进房间
    const pos = p.clone().addScaledVector(dir, Math.cos(el) * dist);
    pos.y = p.y + Math.sin(el) * dist;
    this.flyTo(pos, p, 0.9);
  }

  enterRoom(room, meta) {
    if (this.mode === 'plan') this.setPlan(false);
    const p = new THREE.Vector3(M(room.view.p[0]), EYE, M(room.view.p[1]));
    const t = new THREE.Vector3(M(room.view.t[0]), 1.1, M(room.view.t[1]));
    const pad = 0.22;
    this.walk.bounds = { x0: M(meta.x0) + pad, x1: M(meta.x1) - pad, z0: M(meta.z0) + pad, z1: M(meta.z1) - pad };
    this.orbit.enabled = false;
    const look = t.clone();
    this.flyTo(p, look, 1.3, () => {
      if (this.mode !== 'entering') return;
      this.cam.up.set(0, 1, 0);
      this.mode = 'walk';
      const d = t.clone().sub(p);
      this.walk.yaw = Math.atan2(-d.x, -d.z);
      this.walk.pitch = Math.atan2(d.y, Math.hypot(d.x, d.z));
      this.cam.rotation.order = 'YXZ';
    }, 66);
    this.mode = 'entering';
  }

  _leaveWalk() {
    this.mode = 'orbit';
    this.orbit.enabled = true;
    const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.cam.rotation);
    this.orbit.target.copy(this.cam.position).addScaledVector(fwd, 2).setY(0.6);
  }

  exitRoom(room, meta) {
    this._leaveWalk();
    if (room) this.focusRoom(room, meta); else this.overview();
  }

  setPlan(on) {
    if (on) {
      if (this.mode === 'walk' || this.mode === 'entering') this._leaveWalk();
      this.tween = null;
      this.mode = 'plan';
      this.orbit.enabled = false;
      this.planCtl.enabled = true;
    } else {
      this.mode = 'orbit';
      this.planCtl.enabled = false;
      this.orbit.enabled = true;
    }
  }

  // —— 房间内环视与行走 ——
  _bindWalk() {
    const el = this.dom;
    el.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'walk') return;
      if (e.pointerType === 'touch') {
        this.walk.touches = this.walk.touches || new Map();
        this.walk.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.walk.touches.size === 2) {
          const [a, b] = [...this.walk.touches.values()];
          this.walk.pinch = Math.hypot(a.x - b.x, a.y - b.y);
          this.walk.drag = null;
          return;
        }
      }
      this.walk.drag = { x: e.clientX, y: e.clientY, id: e.pointerId };
    });
    el.addEventListener('pointermove', (e) => {
      if (this.mode !== 'walk') return;
      if (this.walk.touches && this.walk.touches.has(e.pointerId)) {
        this.walk.touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (this.walk.touches.size === 2 && this.walk.pinch) {
          const [a, b] = [...this.walk.touches.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          this.move((d - this.walk.pinch) * 0.01);
          this.walk.pinch = d;
          return;
        }
      }
      const g = this.walk.drag;
      if (!g || g.id !== e.pointerId) return;
      const k = e.pointerType === 'touch' ? 0.006 : 0.0042;
      this.walk.yaw += (e.clientX - g.x) * k;
      this.walk.pitch = THREE.MathUtils.clamp(this.walk.pitch + (e.clientY - g.y) * k, -1.25, 1.25);
      g.x = e.clientX; g.y = e.clientY;
    });
    const end = (e) => {
      if (this.walk.touches) this.walk.touches.delete(e.pointerId);
      if (this.walk.drag && this.walk.drag.id === e.pointerId) this.walk.drag = null;
      if (!this.walk.touches || this.walk.touches.size < 2) this.walk.pinch = null;
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', (e) => {
      if (this.mode !== 'walk') return;
      e.preventDefault();
      this.move(-e.deltaY * 0.0022);
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.target.closest && e.target.closest('input,textarea')) return;
      this.walk.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.walk.keys.delete(e.code));
    window.addEventListener('blur', () => this.walk.keys.clear());
  }

  move(dist, strafe = 0) {
    const y = this.walk.yaw;
    const fx = -Math.sin(y), fz = -Math.cos(y);
    const p = this.cam.position;
    p.x += fx * dist + -fz * strafe;
    p.z += fz * dist + fx * strafe;
    const b = this.walk.bounds;
    if (b) { p.x = THREE.MathUtils.clamp(p.x, b.x0, b.x1); p.z = THREE.MathUtils.clamp(p.z, b.z0, b.z1); }
  }

  update(dt) {
    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.dur);
      const k = ease(tw.t);
      this.cam.position.lerpVectors(tw.p0, tw.p1, k);
      if (tw.f0 !== tw.f1) { this.cam.fov = tw.f0 + (tw.f1 - tw.f0) * k; this.cam.updateProjectionMatrix(); }
      const tgt = new THREE.Vector3().lerpVectors(tw.t0, tw.t1, k);
      this.orbit.target.copy(tgt);
      this.cam.lookAt(tgt);
      if (tw.t >= 1) { this.tween = null; tw.done && tw.done(); }
      if (this.mode === 'orbit') this.orbit.update();
      return;
    }
    if (this.mode === 'walk') {
      const K = this.walk.keys;
      const sp = 1.5 * dt;
      let f = 0, s = 0;
      if (K.has('KeyW') || K.has('ArrowUp')) f += sp;
      if (K.has('KeyS') || K.has('ArrowDown')) f -= sp;
      if (K.has('KeyA')) s -= sp;
      if (K.has('KeyD')) s += sp;
      if (K.has('ArrowLeft')) this.walk.yaw += dt * 1.4;
      if (K.has('ArrowRight')) this.walk.yaw -= dt * 1.4;
      if (f || s) this.move(f, s);
      this.cam.rotation.order = 'YXZ';
      this.cam.rotation.set(this.walk.pitch, this.walk.yaw, 0);
      return;
    }
    if (this.mode === 'orbit') this.orbit.update();
    if (this.mode === 'plan') this.planCtl.update();
  }
}
