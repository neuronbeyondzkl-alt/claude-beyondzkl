// Headless renderer: serves the project locally, drives Chromium frame by frame
// and pipes JPEG frames into ffmpeg.
//
//   node render.mjs stills 8.0 16.5 54.2        -> build/stills/*.png
//   node render.mjs video [--workers 4] [--from 0 --to 124]
//                                               -> build/video.mp4 (with score.wav)
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BUILD = path.join(ROOT, 'build');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'timeline.json'), 'utf8'));
const EV = JSON.parse(fs.readFileSync(path.join(BUILD, 'events.json'), 'utf8'));
const FPS = TL.fps;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2', '.json': 'application/json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', (e) => console.error('[page]', e.message));
  await page.addInitScript(`window.TL = ${JSON.stringify(TL)}; window.EV = ${JSON.stringify(EV)};`);
  await page.goto(`http://127.0.0.1:${port}/render/index.html`);
  await page.waitForFunction('window.READY || window.BOOT_ERROR', null, { timeout: 120000 });
  const err = await page.evaluate('window.BOOT_ERROR');
  if (err) throw new Error(err);
  return page;
}

async function stills(times) {
  const srv = await serve();
  const browser = await chromium.launch();
  const page = await openPage(browser, srv.address().port);
  fs.mkdirSync(path.join(BUILD, 'stills'), { recursive: true });
  for (const t of times) {
    const f = Math.round(t * FPS);
    const t0 = Date.now();
    const url = await page.evaluate((fr) => { window.renderFrame(fr); return document.getElementById('c').toDataURL('image/png'); }, f);
    const out = path.join(BUILD, 'stills', `t${t.toFixed(2).padStart(6, '0')}.png`);
    fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
    console.log(out, `${Date.now() - t0} ms`);
  }
  await browser.close(); srv.close();
}

function ffmpeg(args) {
  const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c)))));
  return { p, done };
}

async function video(opts) {
  const total = Math.round(TL.duration * FPS);
  const f0 = Math.round((opts.from ?? 0) * FPS), f1 = Math.min(total, Math.round((opts.to ?? TL.duration) * FPS));
  const n = opts.workers || 4;
  const srv = await serve();
  const port = srv.address().port;
  const segDir = path.join(BUILD, 'segments');
  fs.rmSync(segDir, { recursive: true, force: true });
  fs.mkdirSync(segDir, { recursive: true });
  const chunk = Math.ceil((f1 - f0) / n);
  const started = Date.now();
  let doneFrames = 0;
  const browser = await chromium.launch();
  const jobs = [];
  for (let w = 0; w < n; w++) {
    const a = f0 + w * chunk, b = Math.min(f1, a + chunk);
    if (a >= b) break;
    jobs.push((async () => {
      const page = await openPage(browser, port);
      const seg = path.join(segDir, `seg${String(w).padStart(2, '0')}.mp4`);
      const ff = ffmpeg(['-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '10', '-pix_fmt', 'yuv420p', '-threads', '1', seg]);
      for (let f = a; f < b; f++) {
        const url = await page.evaluate((fr) => window.frameJPEG(fr, 0.95), f);
        const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
        if (!ff.p.stdin.write(buf)) await new Promise((r) => ff.p.stdin.once('drain', r));
        doneFrames++;
        if (doneFrames % 150 === 0) {
          const el = (Date.now() - started) / 1000;
          console.log(`${doneFrames}/${f1 - f0} frames, ${(doneFrames / el).toFixed(1)} fps, eta ${((f1 - f0 - doneFrames) / (doneFrames / el)).toFixed(0)} s`);
        }
      }
      ff.p.stdin.end();
      await ff.done;
      await page.close();
      return seg;
    })());
  }
  const segs = await Promise.all(jobs);
  await browser.close(); srv.close();
  const list = path.join(segDir, 'list.txt');
  fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
  const silent = path.join(BUILD, 'video_noaudio.mp4');
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]).done;
  console.log('frames rendered in', ((Date.now() - started) / 1000).toFixed(0), 's');
  if (opts.from == null && opts.to == null) {
    const out = path.join(BUILD, 'video.mp4');
    await ffmpeg(['-i', silent, '-i', path.join(BUILD, 'score.wav'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-tune', 'film', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-x264-params', 'aq-mode=3:deblock=-1,-1',
      '-c:a', 'aac', '-b:a', '256k', '-ar', '44100',
      '-movflags', '+faststart', '-shortest', out]).done;
    console.log('wrote', out);
  }
}

const [, , mode, ...rest] = process.argv;
if (mode === 'stills') {
  await stills(rest.map(Number));
} else if (mode === 'video') {
  const o = {};
  for (let i = 0; i < rest.length; i += 2) o[rest[i].replace(/^--/, '')] = Number(rest[i + 1]);
  await video(o);
} else {
  console.log('usage: node render.mjs stills <t...> | video [--workers n] [--from s --to s]');
}
