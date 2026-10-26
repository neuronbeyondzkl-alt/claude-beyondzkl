// 屏幕叠加层：平面图尺寸标注（SVG）、房间标签、指北针、漫游小地图
import * as THREE from 'three';
import { AXES, ROOMS, STRUCT, PARTITIONS, FACADE, roomArea, roomBounds } from './plan.js';

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
};
const tmp = new THREE.Vector3();

// 平面图标注：轴网、两道尺寸线（分段 + 总长）、指北针、比例尺
export class PlanOverlay {
  constructor(svg) {
    this.svg = svg;
    this.items = [];
    const X = AXES.x, Z = AXES.z;
    const xMin = -2800, xMax = 16300, zMin = -2900, zMax = 11700;
    const g = el('g', { class: 'plan-g' }, svg);
    this.g = g;
    // 轴线
    for (const [name, x] of X) {
      this.line([x, zMin + 900], [x, zMax - 900], 'axis');
      this.bubble(name, [x, zMin + 400]);
      this.bubble(name, [x, zMax - 400]);
    }
    for (const [name, z] of Z) {
      this.line([xMin + 900, z], [xMax - 900, z], 'axis');
      this.bubble(name, [xMin + 400, z]);
      this.bubble(name, [xMax - 400, z]);
    }
    // 尺寸链：上/下两侧按 X 轴网，左/右两侧按 Z 轴网
    const chain = (axis, list, at, offset) => {
      for (let i = 0; i < list.length - 1; i++) this.dim(axis, list[i][1], list[i + 1][1], at, String(list[i + 1][1] - list[i][1]));
      this.dim(axis, list[0][1], list[list.length - 1][1], at + offset, String(list[list.length - 1][1] - list[0][1]));
    };
    chain('x', X, -1100, -600);
    chain('x', X, 10100, 550);
    chain('z', Z, -1100, -600);
    chain('z', Z, 14700, 550);
  }

  line(a, b, cls) { this.items.push({ kind: 'line', a, b, node: el('line', { class: cls }, this.g) }); }

  bubble(text, p) {
    const c = el('g', { class: 'bubble' }, this.g);
    el('circle', { r: 11 }, c);
    const t = el('text', { 'text-anchor': 'middle', dy: '0.36em' }, c);
    t.textContent = text;
    this.items.push({ kind: 'pt', p, node: c });
  }

  dim(axis, s, e, at, text) {
    const a = axis === 'x' ? [s, at] : [at, s];
    const b = axis === 'x' ? [e, at] : [at, e];
    const node = el('g', { class: 'dim' });
    this.g.appendChild(node);
    const ln = el('line', {}, node);
    const t1 = el('line', { class: 'tick' }, node);
    const t2 = el('line', { class: 'tick' }, node);
    const tx = el('text', { 'text-anchor': 'middle' }, node);
    tx.textContent = text;
    this.items.push({ kind: 'dim', axis, a, b, node, ln, t1, t2, tx });
  }

  update(camera, w, h) {
    const P = (x, z) => {
      tmp.set(x / 1000, 2.9, z / 1000).project(camera);
      return [(tmp.x * 0.5 + 0.5) * w, (-tmp.y * 0.5 + 0.5) * h];
    };
    for (const it of this.items) {
      if (it.kind === 'line') {
        const [x1, y1] = P(...it.a), [x2, y2] = P(...it.b);
        it.node.setAttribute('x1', x1); it.node.setAttribute('y1', y1);
        it.node.setAttribute('x2', x2); it.node.setAttribute('y2', y2);
      } else if (it.kind === 'pt') {
        const [x, y] = P(...it.p);
        it.node.setAttribute('transform', `translate(${x},${y})`);
      } else {
        const [x1, y1] = P(...it.a), [x2, y2] = P(...it.b);
        it.ln.setAttribute('x1', x1); it.ln.setAttribute('y1', y1);
        it.ln.setAttribute('x2', x2); it.ln.setAttribute('y2', y2);
        const tk = 5;
        for (const [t, x, y] of [[it.t1, x1, y1], [it.t2, x2, y2]]) {
          t.setAttribute('x1', x - tk); t.setAttribute('y1', y + tk);
          t.setAttribute('x2', x + tk); t.setAttribute('y2', y - tk);
        }
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const len = Math.hypot(x2 - x1, y2 - y1);
        it.tx.style.display = len < 26 ? 'none' : '';
        if (it.axis === 'x') it.tx.setAttribute('transform', `translate(${mx},${my - 5})`);
        else it.tx.setAttribute('transform', `translate(${mx - 5},${my}) rotate(-90)`);
      }
    }
  }
}

// 房间标签（3D 与平面图共用）
export class RoomTags {
  constructor(root, onPick) {
    this.root = root;
    this.tags = ROOMS.map((room) => {
      const b = roomBounds(room);
      // L 形房间取主矩形中心
      const main = room.rects[0];
      const cx = (main[0] + main[2]) / 2, cz = (main[1] + main[3]) / 2;
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'tag';
      node.innerHTML = `<span class="tag__name">${room.name}</span><span class="tag__meta">${roomArea(room).toFixed(1)} m²</span>`;
      node.addEventListener('click', () => onPick(room.id));
      root.appendChild(node);
      return { room, node, pos: new THREE.Vector3(cx / 1000, 1.5, cz / 1000), b };
    });
  }

  update(camera, w, h, { plan, visible, hide }) {
    this.root.hidden = !visible;
    if (!visible) return;
    for (const t of this.tags) {
      t.pos.y = plan ? 0.2 : 1.5;
      tmp.copy(t.pos).project(camera);
      const off = tmp.z > 1 || Math.abs(tmp.x) > 1.1 || Math.abs(tmp.y) > 1.1 || (hide && hide(t.room.id));
      t.node.style.visibility = off ? 'hidden' : 'visible';
      if (off) continue;
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      t.node.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  setActive(id) {
    for (const t of this.tags) t.node.classList.toggle('is-active', t.room.id === id);
  }
}

// 漫游小地图：房间 + 墙体 + 当前位置与朝向
export function buildMiniMap(svg) {
  svg.setAttribute('viewBox', '-400 -500 14800 10200');
  for (const room of ROOMS) for (const [x0, z0, x1, z1] of room.rects) el('rect', { x: x0, y: z0, width: x1 - x0, height: z1 - z0, class: 'mm-room' }, svg);
  for (const [x0, z0, x1, z1] of STRUCT) el('rect', { x: x0, y: z0, width: x1 - x0, height: z1 - z0, class: 'mm-wall' }, svg);
  for (const p of PARTITIONS) {
    const [x0, z0, x1, z1] = p.r;
    el('rect', { x: x0, y: z0, width: x1 - x0, height: z1 - z0, class: 'mm-part' }, svg);
  }
  for (const f of FACADE) {
    const [x0, z0, x1, z1] = f.r;
    el('rect', { x: x0, y: z0, width: x1 - x0, height: z1 - z0, class: 'mm-wall' }, svg);
    for (const w of f.windows) el('rect', { x: w.a, y: z0, width: w.b - w.a, height: z1 - z0, class: 'mm-win' }, svg);
  }
  const me = el('g', { class: 'mm-me' }, svg);
  el('path', { d: 'M0 -620 L380 260 L0 80 L-380 260 Z' }, me);
  return (x, z, headingDeg) => me.setAttribute('transform', `translate(${x * 1000},${z * 1000}) rotate(${headingDeg})`);
}
