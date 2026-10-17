// 生成单文件版本（CSS/JS 全部内联），用于发布到 claude.ai Artifact 或任何只接受单个 HTML 的托管环境
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const css = readFileSync('assets/style.css', 'utf8');
const js = readFileSync('assets/app.js', 'utf8').replace(/<\/script/gi, '<\\/script');

const between = (s, a, b) => s.slice(s.indexOf(a) + a.length, s.indexOf(b));
let head = between(html, '<!--HEAD-START-->', '<!--HEAD-END-->');
let body = between(html, '<!--BODY-START-->', '<!--BODY-END-->');
// 用函数作替换值，避免压缩代码里的 $& / $' 被当作替换模式
head = head.replace(/<!--CSS-->[\s\S]*?<!--\/CSS-->/, () => `<style>\n${css}\n</style>`);
body = body.replace(/<!--JS-->[\s\S]*?<!--\/JS-->/, () => `<script>\n${js}\n</script>`);

mkdirSync('dist', { recursive: true });
// 开头保留字符集声明：单独双击打开时中文不会乱码；套进 Artifact 外壳时重复声明会被浏览器忽略
writeFileSync('dist/neuroplasticity.html', `<meta charset="utf-8">\n${head.trim()}\n${body.trim()}\n`);
console.log('dist/neuroplasticity.html written');
