// 生成 3D 户型的单文件版 home3d/index.html：three.js 与全部脚本打包成一个普通脚本，CSS 内联。
// 这样直接双击 home3d/index.html 就能打开（file:// 下浏览器会拦截 ES Module 的跨文件加载）。
// 用法：npm install && npm run home3d:build
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => resolve(root, p);

const { outputFiles } = await build({
  entryPoints: [r('home3d/js/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: ['es2020'],
  legalComments: 'eof',
});
// 内联到 <script> 里时，避免脚本内容提前结束标签
const js = outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = readFileSync(r('home3d/css/style.css'), 'utf8');

const tpl = readFileSync(r('home3d/index.dev.html'), 'utf8');
const swap = (s, from, to) => {
  if (!s.includes(from)) throw new Error('模板中找不到：' + from);
  return s.replace(from, () => to);   // 用函数替换，避免 $& 等特殊替换符
};
const dev = /<!--DEV-SCRIPTS-->[\s\S]*?<!--\/DEV-SCRIPTS-->/;
if (!dev.test(tpl)) throw new Error('模板中找不到 <!--DEV-SCRIPTS--> 区块');

let html = tpl;
html = swap(html, '<!--BUILD-NOTE-->', '<!-- 单文件版：由 tools/build-home3d.mjs 从 home3d/index.dev.html、home3d/js 与 home3d/css 生成，可直接双击打开。请修改源文件后重新构建。 -->');
html = swap(html, '<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);
html = html.replace(dev, () => `<script>\n${js}\n</script>`);
writeFileSync(r('home3d/index.html'), html);
console.log(`home3d/index.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);
