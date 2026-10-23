// 界面：房间列表、讲解面板、悬停提示、房间标签、平面图轴号与尺寸
import * as THREE from 'three';

export function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'text') el.textContent = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat(Infinity)) if (c !== null && c !== undefined && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c)));
  return el;
}

const fmtA = (a) => a.toFixed(2);
const fmtM = (mm) => (mm / 1000).toFixed(2);

export class UI {
  constructor(rooms, meta) {
    this.rooms = rooms;
    this.meta = meta;
    this.info = document.getElementById('info');
    this.tip = document.getElementById('tip');
    this.labelsEl = document.getElementById('labels');
    this.labels = new Map();
    this.annos = [];
    this.v = new THREE.Vector3();
  }

  // —— 左侧房间列表 ——
  buildRoomList(onSelect, onEnter) {
    const groups = { public: document.getElementById('listPublic'), private: document.getElementById('listPrivate') };
    let total = 0;
    for (const r of this.rooms) {
      const m = this.meta.get(r.id);
      total += m.area;
      const li = h('li', { 'data-room': r.id },
        h('button', { class: 'room-row', type: 'button', onclick: () => onSelect(r.id) },
          h('span', { class: 'room-row__name', text: r.name }),
          h('span', { class: 'room-row__area', text: `${fmtA(m.area)} m²` })),
        h('button', { class: 'room-enter', type: 'button', title: `进入${r.name}`, 'aria-label': `进入${r.name}`, onclick: () => onEnter(r.id) }, '进入'));
      groups[r.zone].append(li);
    }
    document.getElementById('totalArea').textContent = fmtA(total);
    const s = document.getElementById('statArea');
    if (s) s.textContent = fmtA(total);
    return total;
  }

  markRoom(id) {
    document.querySelectorAll('#roomPanel li').forEach((li) => li.classList.toggle('is-active', li.dataset.room === id));
  }

  // —— 讲解面板 ——
  _panel(kicker, title, en, rows, desc, actions, extra) {
    this.info.replaceChildren(...[
      h('div', { class: 'info__head' },
        h('div', {},
          h('p', { class: 'info__kicker', text: kicker }),
          h('h2', { class: 'info__title' }, title, en ? h('span', { class: 'info__en', text: en }) : null)),
        h('button', { class: 'info__close', type: 'button', 'aria-label': '关闭讲解', onclick: () => this.onClose && this.onClose() }, '×')),
      rows.length ? h('dl', { class: 'info__facts' }, rows.map(([k, v]) => [h('dt', { text: k }), h('dd', { text: v })])) : null,
      h('p', { class: 'info__desc', text: desc }),
      extra || null,
      actions.length ? h('div', { class: 'info__actions' }, actions.map(([label, fn, primary]) =>
        h('button', { type: 'button', class: primary ? 'btn btn--primary' : 'btn', onclick: fn }, label))) : null,
    ].filter(Boolean));
    this.info.hidden = false;
    this.info.scrollTop = 0;
  }

  showRoom(room, furn, { onEnter, onFocus, onItem }) {
    const m = this.meta.get(room.id);
    const FLOOR = { floorMarble: '鱼肚白大理石 600 × 1200', floorMarbleInlay: '卡拉卡塔大理石菱形铺 + 黑金花嵌花', floorWood: '橡木人字拼', floorTileBath: '浅灰石材砖 600 × 600', floorTileKitchen: '暖灰岩板 800 × 800', floorTileBalcony: '防滑砖 300 × 300' };
    const WALL = { paintWarm: '暖白乳胶漆', paintGreige: '燕麦灰乳胶漆', tileMarble: '大理石纹瓷砖 600 × 1200（2.4 m 以下）' };
    const feat = (room.feature || []).map((f) => ({ marbleSlab: '大理石背景墙', panelFabric: '床头软包墙', tileMarble: '台盆区大理石墙砖' }[f.finish])).filter(Boolean);
    const chips = furn.length ? h('div', { class: 'info__chips' },
      h('p', { class: 'info__sub', text: `房间内 ${furn.length} 件家具（点击查看讲解）` }),
      h('div', { class: 'chips' }, furn.map((f) => h('button', { type: 'button', class: 'chip', onclick: () => onItem(f.id) }, f.name)))) : null;
    this._panel(room.zone === 'public' ? '公共区' : '私密区', room.name, room.en, [
      ['使用面积', `${fmtA(m.area)} m²`],
      [m.rect ? '开间 × 进深' : '外包尺寸', `${fmtM(m.w)} × ${fmtM(m.d)} m`],
      ['地面', FLOOR[room.floor] || '—'],
      ['墙面', [WALL[room.wall], ...feat].filter(Boolean).join('，')],
    ], room.desc, [['进入房间', onEnter, true], ['俯视聚焦', onFocus]], chips);
  }

  showFurniture(it, roomName, { onFocus, onRoom }) {
    let size = it.size, key = '尺寸 (mm)';
    if (!size) {
      if (['tv', 'art', 'radiator'].includes(it.type) && it.w && it.h) { size = `${it.w} × ${it.h}`; key = '宽 × 高 (mm)'; }
      else if (it.r) { size = `Ø ${it.r * 2}${it.h ? ` × ${it.h}` : ''}`; key = it.h ? '直径 × 高 (mm)' : '直径 (mm)'; }
      else if (it.w && it.d && it.h) { size = `${it.w} × ${it.d} × ${it.h}`; key = '宽 × 深 × 高 (mm)'; }
      else if (it.w && it.d) { size = `${it.w} × ${it.d}`; key = '长 × 宽 (mm)'; }
      else if (it.w) { size = String(it.w); key = '宽 (mm)'; }
      else if (it.h) { size = String(it.h); key = '高 (mm)'; }
    }
    const rows = [['所在房间', roomName], ['材质', it.mat || '—']];
    if (size) rows.splice(1, 0, [key, size]);
    this._panel('家具 · 软装', it.name, null, rows, it.desc, [['定位', onFocus, true], [`回到${roomName}`, onRoom]]);
  }

  showDoor(d, roomNames, { onToggle, isOpen }) {
    this._panel('门', d.spec.name, null, [
      ['洞口', `${d.width} × ${d.height} mm`],
      ['连接', roomNames],
      ['开启', d.spec.style === 'entry' ? '平开 · 内开' : '平开'],
    ], d.spec.desc, [[isOpen ? '关门' : '开门', onToggle, true]]);
  }

  showSlider(s, roomNames, { onToggle, isOpen }) {
    this._panel('推拉门', s.spec.name, null, [
      ['洞口', `${s.width} × ${s.height} mm`],
      ['连接', roomNames],
      ['门扇', `${s.spec.leaves} 扇`],
    ], s.spec.desc, [[isOpen ? '关上' : '推开', onToggle, true]]);
  }

  showWindow(w, roomName) {
    const desc = w.sill <= 150
      ? '落地窗，窗台几乎贴地，白天整面采光。外框为深古铜色铝合金，内侧挂纱帘与遮光帘两层。'
      : `窗台高 ${w.sill} mm，内侧窗台铺大理石台面。外框为深古铜色铝合金，香槟金执手。`;
    this._panel('窗', w.name, null, [
      ['洞口', `${w.width} × ${w.height} mm`],
      ['窗台高度', `${w.sill} mm`],
      ['所在房间', roomName || '—'],
    ], desc, []);
  }

  hideInfo() { this.info.hidden = true; }

  // —— 悬停提示 ——
  showTip(text, x, y) {
    this.tip.textContent = text;
    this.tip.hidden = false;
    const r = this.tip.getBoundingClientRect();
    const W = window.innerWidth;
    let left = x + 14, top = y + 16;
    if (left + r.width > W - 8) left = x - r.width - 14;
    this.tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }
  hideTip() { this.tip.hidden = true; }

  // —— 房间标签 ——
  buildLabels(onClick) {
    for (const r of this.rooms) {
      const m = this.meta.get(r.id);
      const el = h('button', { class: 'rlabel', type: 'button', 'data-room': r.id, onclick: () => onClick(r.id) },
        h('span', { class: 'rlabel__name', text: r.name }),
        h('span', { class: 'rlabel__area', text: `${fmtA(m.area)} m²` }),
        h('span', { class: 'rlabel__dims', text: `${fmtM(m.w)} × ${fmtM(m.d)} m` }));
      this.labelsEl.append(el);
      this.labels.set(r.id, { el, p: new THREE.Vector3(m.lx / 1000, 0.05, m.lz / 1000) });
    }
  }

  addAnno(text, p, cls) {
    const el = h('span', { class: `anno ${cls || ''}`, text });
    this.labelsEl.append(el);
    this.annos.push({ el, p });
  }

  updateLabels(camera, w, h2, { show, plan, selected }) {
    const place = (el, p, extraHide) => {
      this.v.copy(p).project(camera);
      const vis = show && !extraHide && this.v.z < 1 && Math.abs(this.v.x) < 1.1 && Math.abs(this.v.y) < 1.1;
      el.style.visibility = vis ? 'visible' : 'hidden';
      if (vis) el.style.transform = `translate(${((this.v.x + 1) / 2) * w}px, ${((1 - this.v.y) / 2) * h2}px) translate(-50%, -50%)`;
    };
    for (const [id, L] of this.labels) {
      L.el.classList.toggle('is-plan', plan);
      L.el.classList.toggle('is-active', selected === id);
      place(L.el, L.p, false);
    }
    for (const a of this.annos) place(a.el, a.p, !plan);
  }
}
