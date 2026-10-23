// 程序化贴图：全部用 Canvas 现场绘制，不加载任何图片文件（单文件版离线也能用）。
// 每张贴图都是无缝平铺的，size 记录贴图对应的真实尺寸（米），用于按房间尺寸设置重复次数。
import * as THREE from 'three';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (...n) => {
  let h = 2166136261;
  for (const v of n) { h ^= (v | 0) + 0x9e3779b9; h = Math.imul(h, 16777619); }
  return (h >>> 0);
};

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function toTexture(c, size, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  t.userData.size = size;   // 米
  return t;
}

// 在 9 个平移位置重复绘制，保证跨边界的笔画也无缝
function wrapDraw(S, fn) {
  for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) fn(dx, dy);
}

function grain(ctx, S, r, amount) {
  const img = ctx.getImageData(0, 0, S, S);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * amount;
    d[i] += n; d[i + 1] += n; d[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

function clouds(ctx, S, r, colors, count, rad) {
  for (let i = 0; i < count; i++) {
    const x = r() * S, y = r() * S, R = rad * (0.4 + r());
    const c = colors[(r() * colors.length) | 0];
    wrapDraw(S, (dx, dy) => {
      const g = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, R);
      // 渐变终点用同色透明，避免向透明黑过渡时发灰
      g.addColorStop(0, c); g.addColorStop(1, c.replace(/[\d.]+\)$/, '0)'));
      ctx.fillStyle = g;
      ctx.fillRect(x + dx - R, y + dy - R, R * 2, R * 2);
    });
  }
}

function veins(ctx, S, r, { count, color, width, blur, steps = 70, step = 14, turn = 0.5, dir = 0.8, alpha = 1 }) {
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < count; i++) {
    const pts = [];
    let x = r() * S, y = r() * S, a = dir + (r() - 0.5) * 1.2;
    const n = steps * (0.5 + r());
    for (let k = 0; k < n; k++) {
      a += (r() - 0.5) * turn;
      x += Math.cos(a) * step; y += Math.sin(a) * step;
      pts.push([x, y, 0.3 + r() * 0.9]);
    }
    const w = width * (0.4 + r());
    // 一条脉络一笔画完（逐段描边会在接头处叠出珠子状的深点）
    wrapDraw(S, (dx, dy) => {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color; ctx.shadowColor = color; ctx.shadowBlur = blur;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(pts[0][0] + dx, pts[0][1] + dy);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0] + dx, pts[k][1] + dy);
      ctx.stroke();
    });
    // 主脉分出的细枝
    if (r() < 0.5) {
      const s = pts[(r() * pts.length) | 0];
      let bx = s[0], by = s[1], ba = r() * Math.PI * 2;
      const seg = [];
      for (let k = 0; k < 25; k++) { ba += (r() - 0.5) * 0.5; bx += Math.cos(ba) * step * 0.6; by += Math.sin(ba) * step * 0.6; seg.push([bx, by]); }
      wrapDraw(S, (dx, dy) => {
        ctx.globalAlpha = alpha * 0.7; ctx.lineWidth = w * 0.35; ctx.shadowBlur = blur * 0.5;
        ctx.beginPath(); ctx.moveTo(s[0] + dx, s[1] + dy);
        for (const p of seg) ctx.lineTo(p[0] + dx, p[1] + dy);
        ctx.stroke();
      });
    }
  }
  ctx.restore();
}

// 宽度、模糊半径按 1024 像素贴图给出，其他尺寸按比例缩放；turn 越小纹路越舒展
const MARBLE = {
  calacatta:  { base: '#F4F1EC', cloud: ['rgba(214,206,196,0.22)', 'rgba(255,255,255,0.45)'], veins: [
    { count: 4, color: 'rgba(150,142,134,0.18)', width: 10, blur: 24, turn: 0.22 },
    { count: 5, color: 'rgba(118,110,102,0.55)', width: 1.4, blur: 2, turn: 0.25 },
    { count: 3, color: 'rgba(184,152,104,0.5)', width: 1.2, blur: 3, turn: 0.25 } ] },
  fishbelly:  { base: '#F2EFEA', cloud: ['rgba(206,199,190,0.22)', 'rgba(255,255,255,0.45)'], veins: [
    { count: 5, color: 'rgba(165,158,150,0.16)', width: 11, blur: 26, turn: 0.2 },
    { count: 5, color: 'rgba(135,128,122,0.42)', width: 1.2, blur: 2, turn: 0.22 } ] },
  arabescato: { base: '#F1EEEA', cloud: ['rgba(190,186,182,0.22)', 'rgba(255,255,255,0.4)'], veins: [
    { count: 5, color: 'rgba(122,118,114,0.2)', width: 13, blur: 26, turn: 0.32 },
    { count: 6, color: 'rgba(92,88,86,0.5)', width: 1.7, blur: 2, turn: 0.36 },
    { count: 3, color: 'rgba(176,146,98,0.45)', width: 1.3, blur: 2, turn: 0.3 } ] },
  nero:       { base: '#1F1D1C', cloud: ['rgba(60,56,52,0.5)', 'rgba(10,10,10,0.5)'], veins: [
    { count: 7, color: 'rgba(230,226,220,0.5)', width: 1.6, blur: 3, turn: 0.4 },
    { count: 5, color: 'rgba(200,164,104,0.65)', width: 2.2, blur: 4, turn: 0.35 } ] },
};

function marbleCanvas(kind, S, seed) {
  const spec = MARBLE[kind];
  const [c, ctx] = canvas(S);
  const r = rng(seed);
  ctx.fillStyle = spec.base; ctx.fillRect(0, 0, S, S);
  clouds(ctx, S, r, spec.cloud, 40, S * 0.25);
  const k = S / 1024;
  for (const v of spec.veins) veins(ctx, S, r, { ...v, width: v.width * Math.max(0.6, k), blur: v.blur * k, step: S / 70 });
  grain(ctx, S, r, kind === 'nero' ? 8 : 6);
  return [c, ctx];
}

function groutLines(ctx, S, cols, rows, color, w) {
  ctx.fillStyle = color;
  for (let i = 0; i <= cols; i++) ctx.fillRect((i * S) / cols - w / 2, 0, w, S);
  for (let j = 0; j <= rows; j++) ctx.fillRect(0, (j * S) / rows - w / 2, S, w);
}

export function makeTextures(maxSize = 1024) {
  const S = maxSize;
  const T = {};

  // 大理石板材（家具台面、背景墙），每张贴图对应 1.6 m
  for (const [k, seed] of [['calacatta', 11], ['fishbelly', 23], ['arabescato', 37], ['nero', 51]]) {
    const [c] = marbleCanvas(k, S, seed);
    T[k] = toTexture(c, 1.6);
  }

  // 客餐厅地面：鱼肚白大理石 600 × 1200 mm 砖，贴图 1.2 m 见方 = 2 列 × 1 行
  {
    const [c, ctx] = marbleCanvas('fishbelly', S, 77);
    groutLines(ctx, S, 2, 1, 'rgba(160,150,140,0.55)', 2);
    T.floorMarble = toTexture(c, 1.2);
  }
  // 玄关：600 mm 菱形铺贴 + 黑金花小方块嵌花
  {
    const [c, ctx] = marbleCanvas('calacatta', S, 91);
    ctx.save();
    ctx.strokeStyle = 'rgba(150,140,130,0.6)'; ctx.lineWidth = 2;
    for (const k of [-1, 0, 1, 2]) {
      ctx.beginPath(); ctx.moveTo(k * S, 0); ctx.lineTo(k * S + S, S); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(k * S + S, 0); ctx.lineTo(k * S, S); ctx.stroke();
    }
    const [nc] = marbleCanvas('nero', 256, 5);
    const q = S * 0.075;
    for (const [x, y] of [[0, 0], [S, 0], [0, S], [S, S], [S / 2, S / 2]]) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4);
      ctx.drawImage(nc, -q, -q, q * 2, q * 2);
      ctx.strokeStyle = 'rgba(200,164,104,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(-q, -q, q * 2, q * 2);
      ctx.restore();
    }
    ctx.restore();
    T.floorMarbleInlay = toTexture(c, 0.85);
  }

  // 卧室 / 书房：橡木人字拼（板宽 100 mm，长 600 mm），贴图对应 2√2 × 0.6 m
  {
    const [c, ctx] = canvas(S);
    const L = S / (2 * Math.SQRT2), W = L / 6;
    const tones = ['#B48A5C', '#BE946A', '#A98053', '#C59E72', '#B18660', '#A47B50', '#BA8F63'];
    ctx.fillStyle = '#9C7449'; ctx.fillRect(0, 0, S, S);
    ctx.save();
    ctx.rotate(Math.PI / 4);
    for (let n = -40; n <= 40; n++) {
      for (let m = -6; m <= 6; m++) {
        const u = n * W + m * L, v = n * W - m * L;
        const cx = (u - v) * Math.SQRT1_2, cy = (u + v) * Math.SQRT1_2;
        if (cx < -L * 1.5 || cx > S + L * 1.5 || cy < -L * 1.5 || cy > S + L * 1.5) continue;
        for (const t of [0, 1]) {
          const key = hash(((n % 12) + 12) % 12, ((m % 2) + 2) % 2, t);
          const r = rng(key);
          const [x, y, w, h] = t === 0 ? [u, v, L, W] : [u, v + W, W, L];
          ctx.save();
          ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
          ctx.fillStyle = tones[(r() * tones.length) | 0];
          ctx.fillRect(x, y, w, h);
          // 木纹：沿板长方向的细线
          const along = t === 0;
          for (let g = 0; g < 9; g++) {
            const off = r() * (along ? h : w);
            ctx.strokeStyle = `rgba(${r() < 0.5 ? '90,60,35' : '220,190,150'},${0.12 + r() * 0.18})`;
            ctx.lineWidth = 0.6 + r() * 1.4;
            ctx.beginPath();
            const segs = 10;
            for (let s = 0; s <= segs; s++) {
              const p = (s / segs) * (along ? w : h);
              const wob = Math.sin(s * 0.9 + r() * 6) * 1.6;
              const px = along ? x + p : x + off + wob;
              const py = along ? y + off + wob : y + p;
              s ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
            }
            ctx.stroke();
          }
          // 偶尔有木节
          if (r() < 0.18) {
            const kx = x + r() * w, ky = y + r() * h;
            ctx.fillStyle = 'rgba(80,52,30,0.35)';
            ctx.beginPath(); ctx.ellipse(kx, ky, along ? 6 : 3, along ? 3 : 6, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
          ctx.strokeStyle = 'rgba(70,46,26,0.55)'; ctx.lineWidth = 1.2;
          ctx.strokeRect(x, y, w, h);
        }
      }
    }
    ctx.restore();
    grain(ctx, S, rng(3), 7);
    T.floorWood = toTexture(c, 2 * Math.SQRT2 * 0.6);
  }

  // 胡桃木饰面（竖向木纹）
  {
    const s = 512;
    const [c, ctx] = canvas(s);
    const r = rng(17);
    const g = ctx.createLinearGradient(0, 0, s, 0);
    g.addColorStop(0, '#5A3E2B'); g.addColorStop(0.5, '#664632'); g.addColorStop(1, '#5A3E2B');
    ctx.fillStyle = g; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 160; i++) {
      const x = r() * s, a = 0.05 + r() * 0.16;
      ctx.strokeStyle = r() < 0.6 ? `rgba(40,26,16,${a})` : `rgba(140,100,70,${a})`;
      ctx.lineWidth = 0.5 + r() * 2.2;
      wrapDraw(s, (dx) => {
        ctx.beginPath();
        for (let y = 0; y <= s; y += 16) {
          const px = x + dx + Math.sin(y * 0.02 + i) * (2 + r() * 2);
          y ? ctx.lineTo(px, y) : ctx.moveTo(px, y);
        }
        ctx.stroke();
      });
    }
    grain(ctx, s, r, 6);
    T.walnut = toTexture(c, 0.8);
  }

  // 卫浴地面：浅灰石材 600 × 600
  {
    const [c, ctx] = canvas(S);
    const r = rng(29);
    ctx.fillStyle = '#C9C4BD'; ctx.fillRect(0, 0, S, S);
    clouds(ctx, S, r, ['rgba(180,174,166,0.4)', 'rgba(220,216,210,0.4)'], 60, S * 0.15);
    grain(ctx, S, r, 14);
    groutLines(ctx, S, 2, 2, 'rgba(120,114,108,0.7)', 3);
    T.floorTileBath = toTexture(c, 1.2);
  }
  // 卫浴墙面：卡拉卡塔大理石纹 600 × 1200 竖贴
  {
    const [c, ctx] = marbleCanvas('calacatta', S, 131);
    groutLines(ctx, S, 2, 1, 'rgba(170,160,150,0.6)', 2);
    T.tileMarble = toTexture(c, 1.2);
  }
  // 厨房地面：暖灰 800 × 800
  {
    const [c, ctx] = canvas(S);
    const r = rng(41);
    ctx.fillStyle = '#D8D2C9'; ctx.fillRect(0, 0, S, S);
    clouds(ctx, S, r, ['rgba(196,188,178,0.35)', 'rgba(236,232,226,0.4)'], 50, S * 0.2);
    grain(ctx, S, r, 10);
    groutLines(ctx, S, 2, 2, 'rgba(140,132,124,0.6)', 2);
    T.floorTileKitchen = toTexture(c, 1.6);
  }
  // 阳台地面：防滑砖 300 × 300
  {
    const [c, ctx] = canvas(512);
    const r = rng(43);
    ctx.fillStyle = '#BDB6AC'; ctx.fillRect(0, 0, 512, 512);
    grain(ctx, 512, r, 22);
    groutLines(ctx, 512, 2, 2, 'rgba(110,104,98,0.7)', 3);
    T.floorTileBalcony = toTexture(c, 0.6);
  }

  // 软包墙板：竖向凹槽 + 香槟金细线
  {
    const s = 512;
    const [c, ctx] = canvas(s);
    const r = rng(61);
    ctx.fillStyle = '#D9CFC2'; ctx.fillRect(0, 0, s, s);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x0 = (i * s) / n, w = s / n;
      const g = ctx.createLinearGradient(x0, 0, x0 + w, 0);
      g.addColorStop(0, 'rgba(120,104,88,0.28)'); g.addColorStop(0.18, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.0)'); g.addColorStop(0.85, 'rgba(120,104,88,0.10)'); g.addColorStop(1, 'rgba(90,76,64,0.35)');
      ctx.fillStyle = g; ctx.fillRect(x0, 0, w, s);
    }
    ctx.fillStyle = '#B8975E'; ctx.fillRect(0, 0, 3, s);
    grain(ctx, s, r, 10);
    T.panelFabric = toTexture(c, 0.6);
  }

  // 面料凹凸（灰度噪声）
  {
    const s = 256;
    const [c, ctx] = canvas(s);
    const r = rng(71);
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, s, s);
    for (let y = 0; y < s; y += 2) {
      ctx.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.06})`; ctx.fillRect(0, y, s, 1);
    }
    for (let x = 0; x < s; x += 2) {
      ctx.fillStyle = `rgba(255,255,255,${0.04 + r() * 0.05})`; ctx.fillRect(x, 0, 1, s);
    }
    grain(ctx, s, r, 40);
    T.fabricBump = toTexture(c, 0.08, { srgb: false });
  }

  // 地毯
  for (const [k, border] of [['rugBorder', true], ['rugPlain', false]]) {
    const s = 1024;
    const [c, ctx] = canvas(s);
    const r = rng(border ? 81 : 83);
    ctx.fillStyle = border ? '#D7CFC4' : '#CFC6BA'; ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(90,80,70,0.08)';
      ctx.fillRect(r() * s, r() * s, 1 + r() * 3, 1);
    }
    if (border) {
      const lines = [[0.035, 10, '#9FBDDA'], [0.07, 3, '#6C9AC4'], [0.085, 2, '#B8975E']];
      for (const [p, w, col] of lines) {
        ctx.strokeStyle = col; ctx.lineWidth = w;
        ctx.strokeRect(p * s, p * s, s - 2 * p * s, s - 2 * p * s);
      }
    }
    const t = toTexture(c, 1, { repeat: false });
    T[k] = t;
  }

  // 装饰画
  T.art = {};
  const ART = {
    abstract1: ['#E8E2D8', [['#9FBDDA', 0.32, 0.45, 0.32], ['#B8975E', 0.66, 0.4, 0.18], ['#2B4868', 0.55, 0.7, 0.22]]],
    abstract2: ['#DCD3C6', [['#376392', 0.5, 0.35, 0.3], ['#E8EEF6', 0.42, 0.62, 0.26], ['#B8975E', 0.6, 0.72, 0.1]]],
    abstract3: ['#EFEAE2', [['#CCDBEB', 0.25, 0.5, 0.35], ['#6C9AC4', 0.55, 0.45, 0.25], ['#C9A46B', 0.78, 0.55, 0.15]]],
  };
  for (const [k, [bg, blobs]] of Object.entries(ART)) {
    const s = 512;
    const [c, ctx] = canvas(s);
    const r = rng(hash(k.length, k.charCodeAt(8)));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, s, s);
    for (const [col, x, y, rad] of blobs) {
      ctx.fillStyle = col; ctx.globalAlpha = 0.9;
      ctx.beginPath();
      const N = 9;
      for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2, rr = rad * s * (0.8 + r() * 0.35);
        const px = x * s + Math.cos(a) * rr, py = y * s + Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#263B54'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(s * 0.1, s * (0.3 + r() * 0.4));
    ctx.bezierCurveTo(s * 0.4, s * r(), s * 0.6, s * r(), s * 0.9, s * (0.3 + r() * 0.4)); ctx.stroke();
    grain(ctx, s, r, 12);
    T.art[k] = toTexture(c, 1, { repeat: false });
  }

  return T;
}
