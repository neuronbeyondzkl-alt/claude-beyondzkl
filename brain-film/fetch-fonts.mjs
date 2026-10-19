// 从 render.js 收集用到的全部字符，向 Google Fonts 请求只含这些字的子集字体（OFL 授权）。
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'render.js'), 'utf8');
const chars = new Set([...src].filter((c) => c.codePointAt(0) > 0x7f));
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));
const text = [...chars].join('');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

for (const [family, weight, out] of [
  ['Noto Serif SC', 900, 'NotoSerifSC-900.woff2'],
  ['Noto Sans SC', 300, 'NotoSansSC-300.woff2'],
  ['Noto Sans SC', 500, 'NotoSansSC-500.woff2'],
]) {
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text();
  const m = css.match(/src: url\(([^)]+)\) format\('woff2'\)/);
  if (!m) throw new Error(`no woff2 for ${family} ${weight}:\n${css.slice(0, 300)}`);
  const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
  writeFileSync(join(here, 'fonts', out), buf);
  console.log(out, buf.length, 'bytes,', chars.size, 'chars');
}
