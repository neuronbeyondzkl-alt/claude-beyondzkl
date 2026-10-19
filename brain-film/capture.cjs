// 用无界面 Chromium 逐帧渲染 scene.html，并交给 ffmpeg 编码、混入配乐。
//   node capture.cjs                         → 渲染整片，输出 最会用脑.mp4
//   node capture.cjs --stills 5,30,60 DIR    → 只导出这些秒数的静帧（预览用）
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const here = __dirname;
const timeline = JSON.parse(fs.readFileSync(path.join(here, 'timeline.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => { console.error('[page error]', e); process.exit(1); });
  await page.goto('file://' + path.join(here, 'scene.html'));
  const { frames } = await page.evaluate((tl) => window.initScene(tl), timeline);

  const si = process.argv.indexOf('--stills');
  if (si > 0) {
    const secs = process.argv[si + 1].split(',').map(Number).sort((a, b) => a - b);
    const out = process.argv[si + 2] || here;
    fs.mkdirSync(out, { recursive: true });
    for (const s of secs) {
      const f = Math.round(s * timeline.fps);
      const b64 = await page.evaluate((i) => { window.renderFrame(i - 1, false); return window.renderFrame(i); }, f);
      const file = path.join(out, `still-${String(s).replace('.', '_')}.jpg`);
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      console.log(file);
    }
    await browser.close();
    return;
  }

  const outFile = path.join(here, '最会用脑.mp4');
  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(timeline.fps), '-c:v', 'mjpeg', '-i', '-',
    '-i', path.join(here, 'music.wav'),
    '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-tune', 'film', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '256k',
    '-shortest', '-movflags', '+faststart', outFile,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const b64 = await page.evaluate((k) => window.renderFrame(k), i);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${frames}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
  console.log('done →', outFile);
})();
