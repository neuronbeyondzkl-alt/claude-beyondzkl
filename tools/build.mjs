// 生成单文件版 index.html：把全部 JS（含 three.js）打包成一个普通脚本，CSS 与字体内联。
// 这样下载/解压后直接双击 index.html 就能打开（file:// 下浏览器会拦截 ES Module 的跨文件加载）。
// 用法：npm install && npm run build
//      node tools/build.mjs --artifact <路径>   额外输出一份不含 <html>/<head>/<body> 外壳的版本（用于发布到 claude.ai Artifact）
import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = (p) => resolve(root, p);

const { outputFiles } = await build({
  entryPoints: [r('assets/js/main.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  target: ['es2020'],
  legalComments: 'eof',
});
// 内联到 <script> 里时，避免脚本内容提前结束标签
const js = outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

let css = readFileSync(r('assets/css/style.css'), 'utf8');
css = css.replace(/url\("\.\.\/fonts\/([^"]+\.woff2)"\)/g, (_, f) =>
  `url("data:font/woff2;base64,${readFileSync(r('assets/fonts/' + f)).toString('base64')}")`);

const tpl = readFileSync(r('index.dev.html'), 'utf8');
const swap = (s, from, to) => {
  if (!s.includes(from)) throw new Error('模板中找不到：' + from);
  return s.replace(from, () => to);   // 用函数替换，避免 $& 等特殊替换符
};
let html = tpl;
html = swap(html, '<!--BUILD-NOTE-->', '<!-- 单文件版：由 tools/build.mjs 从 index.dev.html 与 assets/ 生成，可直接双击打开。请修改源文件后重新构建。 -->');
html = swap(html, '<link rel="stylesheet" href="assets/css/style.css">', `<style>\n${css}\n</style>`);
html = swap(html, '<script type="module" src="assets/js/main.js"></script>', `<script>\n${js}\n</script>`);
writeFileSync(r('index.html'), html);
console.log(`index.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB`);

const i = process.argv.indexOf('--artifact');
if (i > 0 && process.argv[i + 1]) {
  const body = html
    .replace(/<!doctype html>\s*/i, '')
    .replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*/i, '')
    .replace(/<head>\s*/i, '').replace(/<\/head>\s*/i, '')
    .replace(/<body>\s*/i, '').replace(/<\/body>\s*/i, '')
    .replace(/<meta charset="utf-8">\s*/i, '')
    .replace(/<meta name="viewport"[^>]*>\s*/i, '')
    .replace(/<meta name="theme-color"[^>]*>\s*/i, '');
  writeFileSync(resolve(process.argv[i + 1]), body);
  console.log(`artifact    ${process.argv[i + 1]}`);
}
