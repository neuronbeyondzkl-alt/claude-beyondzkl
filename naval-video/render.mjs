// Frame-accurate renderer: drives window.renderAt(t) in headless Chromium,
// screenshots every frame, and pipes JPEGs into ffmpeg (one segment per worker).
//
//   node render.mjs                     full render → build/video.mp4
//   node render.mjs --stills 12.5,40    PNG stills → build/stills/
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const BUILD = path.join(HERE, 'build');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('--fps', 30);
const WORKERS = +arg('--workers', 4);
const STILLS = arg('--stills', null);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve() {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.goto(url);
  const total = await page.evaluate(() => window.ready);
  return { page, total };
}

const stage = page => page.locator('#stage');

async function worker(browser, url, k, from, to) {
  const { page } = await openPage(browser, url);
  const out = path.join(BUILD, `seg${k}.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), out],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  const t0 = Date.now();
  for (let f = from; f < to; f++) {
    await page.evaluate(t => window.renderAt(t), f / FPS);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - from) % 300 === 0) {
      const el = (Date.now() - t0) / 1000, n = f - from + 1;
      console.log(`[w${k}] ${n}/${to - from} frames · ${(n / el).toFixed(1)} fps`);
    }
  }
  ff.stdin.end();
  await done;
  await page.close();
  return out;
}

const srv = await serve();
const url = `http://127.0.0.1:${srv.address().port}/naval-video/index.html`;
const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text'] });

try {
  if (STILLS) {
    const dir = path.join(BUILD, arg('--dir', 'stills'));
    fs.mkdirSync(dir, { recursive: true });
    const { page } = await openPage(browser, url);
    for (const t of STILLS.split(',').map(Number)) {
      await page.evaluate(t => window.renderAt(t), t);
      await stage(page).screenshot({ path: path.join(dir, `t${t.toFixed(2).padStart(7, '0')}.png`) });
    }
    console.log(`[stills] ${dir}`);
  } else {
    const { page, total } = await openPage(browser, url);
    await page.close();
    const frames = Math.ceil(total * FPS);
    const per = Math.ceil(frames / WORKERS);
    console.log(`[render] ${frames} frames @ ${FPS}fps, ${WORKERS} workers`);
    const segs = await Promise.all([...Array(WORKERS).keys()].map(k =>
      worker(browser, url, k, k * per, Math.min(frames, (k + 1) * per))));
    const list = path.join(BUILD, 'segments.txt');
    fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n') + '\n');
    await new Promise((res, rej) => spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy',
      path.join(BUILD, 'video.mp4')], { stdio: 'inherit' }).on('close', c => c ? rej(new Error('concat')) : res()));
    console.log('[render] build/video.mp4');
  }
} finally {
  await browser.close();
  srv.close();
}
