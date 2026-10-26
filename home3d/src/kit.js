// 几何工具：毫米 → 米、带“米制 UV”的盒体、零件合并、棱线生成
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { M, lineMat } from './materials.js';

export const k = 0.001;          // mm → m
export const v = (x) => x * k;

// 盒体：各面 UV 按真实尺寸（米）展开，贴图比例在所有家具上一致
export function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const n = f * 4 + i;
      uv.setXY(n, uv.getX(n) * dims[f][0], uv.getY(n) * dims[f][1]);
    }
  }
  return g;
}

export function rboxGeo(w, h, d, r = 0.03, seg = 3) {
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2.01, h / 2.01, d / 2.01));
  const s = Math.max(w, h, d);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s);
  return g;
}

export function cylGeo(rt, rb, h, seg = 32, open = false) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
  const uv = g.attributes.uv;
  const s = Math.max(rt, rb) * 2 * Math.PI;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * h);
  return g;
}

export function latheGeo(pts, seg = 40) {
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), seg);
}

// 往 parent 里加一个零件（单位：米）
export function part(parent, geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, M(key));
  m.userData.matKey = key;
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// 以底面中心定位的盒子（最常用：y 为底面高度）
export function block(parent, key, w, h, d, x, y, z, ry = 0) {
  return part(parent, boxGeo(w, h, d), key, x, y + h / 2, z, 0, ry, 0);
}

export function rblock(parent, key, w, h, d, x, y, z, r = 0.03, ry = 0, rx = 0) {
  return part(parent, rboxGeo(w, h, d, r), key, x, y + h / 2, z, rx, ry, 0);
}

export function cyl(parent, key, r, h, x, y, z, seg = 32, rTop) {
  return part(parent, cylGeo(rTop ?? r, r, h, seg), key, x, y + h / 2, z);
}

// 把一个组内的零件按材质键合并：大幅减少绘制调用
export function compact(group, { cast = true } = {}) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  const remove = [];
  group.traverse((o) => {
    if (!o.isMesh || o.userData.keep) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    const mtx = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
    g.applyMatrix4(mtx);
    for (const name of Object.keys(g.attributes)) {
      if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    }
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups();
    const key = o.userData.matKey;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(g);
    remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const [key, list] of buckets) {
    const merged = list.length === 1 ? list[0] : mergeGeometries(list, false);
    const m = new THREE.Mesh(merged, M(key));
    m.userData.matKey = key;
    m.castShadow = cast && !key.startsWith('glass') && key !== 'sheer';
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
}

// 为某个对象下的所有网格生成棱线（首次切到白模/线框时调用）
export function buildEdges(root, angle = 28) {
  const made = [];
  root.traverse((o) => {
    if (!o.isMesh || o.userData.edges || o.userData.noEdges) return;
    const eg = new THREE.EdgesGeometry(o.geometry, angle);
    const ls = new THREE.LineSegments(eg, lineMat(o.userData.matKey || 'wall'));
    ls.userData.isEdge = true;
    ls.raycast = () => {};
    o.add(ls);
    o.userData.edges = ls;
    made.push(ls);
  });
  return made;
}

// 毫米矩形 → 世界坐标中心与尺寸（米）
export function rectToBox([x0, z0, x1, z1]) {
  return { cx: v((x0 + x1) / 2), cz: v((z0 + z1) / 2), w: v(x1 - x0), d: v(z1 - z0) };
}
