// 几何小工具：毫米 → 米、带真实尺寸 UV 的盒子、圆角盒、按角色打标签的网格
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const M = (v) => v / 1000;

// UV 以米为单位，平铺贴图在任何尺寸的盒子上都保持真实比例
export function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1]);
    }
  }
  return g;
}

export function tag(m, role, o = {}) {
  m.userData.role = role;
  m.userData.cat = o.cat || 'furn';
  if (o.noEdges) m.userData.noEdges = true;
  if (o.noClayEdges) m.userData.noClayEdges = true;
  if (o.noShadow) m.userData.noShadow = true;
  if (o.edgeAngle) m.userData.edgeAngle = o.edgeAngle;
  return m;
}

// 在 parent 下快速搭建构件；y 一律指构件底面标高（米）
export function kit(parent, cat = 'furn') {
  const add = (m, o) => { tag(m, m.userData.role, { cat, ...o }); parent.add(m); return m; };
  return {
    box(role, w, h, d, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(boxGeo(w, h, d));
      m.userData.role = role;
      m.position.set(x, y + h / 2, z);
      if (o.ry) m.rotation.y = o.ry;
      if (o.rx) m.rotation.x = o.rx;
      if (o.rz) m.rotation.z = o.rz;
      return add(m, o);
    },
    rbox(role, w, h, d, r, x = 0, y = 0, z = 0, o = {}) {
      const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
      const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, o.seg || 3, rr));
      m.userData.role = role;
      m.position.set(x, y + h / 2, z);
      if (o.ry) m.rotation.y = o.ry;
      if (o.rx) m.rotation.x = o.rx;
      if (o.rz) m.rotation.z = o.rz;
      return add(m, { edgeAngle: 35, ...o });
    },
    cyl(role, rt, rb, h, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, o.seg || 32, 1, !!o.open, o.t0 || 0, o.tl || Math.PI * 2));
      m.userData.role = role;
      m.position.set(x, y + h / 2, z);
      if (o.rx) m.rotation.x = o.rx;
      if (o.rz) m.rotation.z = o.rz;
      if (o.ry) m.rotation.y = o.ry;
      return add(m, { edgeAngle: 40, ...o });
    },
    sphere(role, r, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 24, Math.max(8, (o.seg || 24) / 2)));
      m.userData.role = role;
      m.position.set(x, y, z);
      if (o.sx) m.scale.set(o.sx, o.sy || 1, o.sz || 1);
      return add(m, { edgeAngle: 50, ...o });
    },
    torus(role, R, r, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(new THREE.TorusGeometry(R, r, o.rs || 10, o.ts || 40, o.arc || Math.PI * 2));
      m.userData.role = role;
      m.position.set(x, y, z);
      if (o.rx !== undefined) m.rotation.x = o.rx;
      if (o.ry) m.rotation.y = o.ry;
      if (o.rz) m.rotation.z = o.rz;
      return add(m, { edgeAngle: 50, ...o });
    },
    lathe(role, pts, x = 0, y = 0, z = 0, o = {}) {
      const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), o.seg || 32));
      m.userData.role = role;
      m.position.set(x, y, z);
      return add(m, { edgeAngle: 50, ...o });
    },
    tube(role, points, r, o = {}) {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      const m = new THREE.Mesh(new THREE.TubeGeometry(curve, o.seg || 40, r, 10, false));
      m.userData.role = role;
      return add(m, { edgeAngle: 60, ...o });
    },
    mesh(role, geo, o = {}) {
      const m = new THREE.Mesh(geo);
      m.userData.role = role;
      return add(m, o);
    },
    group(x = 0, y = 0, z = 0, ry = 0) {
      const g = new THREE.Group();
      g.position.set(x, y, z); g.rotation.y = ry;
      parent.add(g);
      return g;
    },
  };
}

// 朝向房间一侧的饰面四边形：UV 用世界坐标（米），相邻饰面纹理连续
export function facePanel(cx, cz, nx, nz, len, y0, y1, offset = 0.004) {
  const rx = nz, rz = -nx;           // 站在房间里看墙时的「右」方向
  const px = cx + nx * offset, pz = cz + nz * offset;
  const h = len / 2;
  const P = [
    [px - rx * h, y0, pz - rz * h], [px + rx * h, y0, pz + rz * h],
    [px + rx * h, y1, pz + rz * h], [px - rx * h, y1, pz - rz * h],
  ];
  const pos = new Float32Array(P.flat());
  const uv = new Float32Array(P.flatMap((p) => [p[0] * rx + p[2] * rz, p[1]]));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  return g;
}

// 合并静态网格以减少绘制次数：角色、标记、点选对象都相同的网格烘焙到 root 的坐标系里合成一个。
// deep = false 只合并 root 的直接子网格（建筑里门扇、推拉门要单独动，不能一起合并）。
const KEEP = ['position', 'normal', 'uv'];
export function mergeMeshes(root, deep = true) {
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert();
  const list = [];
  if (deep) root.traverse((o) => { if (o !== root) list.push(o); });
  else list.push(...root.children);
  const buckets = new Map();
  for (const m of list) {
    const u = m.userData;
    if (!m.isMesh || Array.isArray(u.role) || !u.role || m.children.length || u.noMerge) continue;
    const key = [u.role, u.cat, u.noEdges, u.noClayEdges, u.noShadow, u.edgeAngle, u.isWall, u.isFloor,
      u.pick ? u.pick.type + ':' + u.pick.id : ''].join('|');
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(m);
  }
  const mat = new THREE.Matrix4();
  for (const ms of buckets.values()) {
    if (ms.length < 2) continue;
    const geos = ms.map((m) => {
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
      if (!g.attributes.normal) g.computeVertexNormals();
      g.clearGroups();
      return g.applyMatrix4(mat.multiplyMatrices(inv, m.matrixWorld));
    });
    if (!geos.every((g) => !!g.attributes.uv === !!geos[0].attributes.uv)) continue;
    const merged = mergeGeometries(geos);
    if (!merged) continue;
    const out = new THREE.Mesh(merged);
    out.userData = { ...ms[0].userData };
    root.add(out);
    for (const m of ms) { m.removeFromParent(); m.geometry.dispose(); }
  }
  // 去掉合并后变空的子组
  if (deep) {
    const empty = [];
    root.traverse((o) => { if (o !== root && !o.isMesh && o.children.length === 0 && o.type === 'Group') empty.push(o); });
    for (const o of empty) o.removeFromParent();
  }
  return root;
}
