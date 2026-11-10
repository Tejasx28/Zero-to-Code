import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Visual snapshot. Code execution also requires HTTP-served public/runners assets.
let html = await readFile('dist/index.html', 'utf8');
const js = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/);
const css = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/);
if (!js || !css) throw new Error('Production JS or CSS bundle was not found.');
const rawScript = await readFile(resolve('dist', js[1].replace(/^\//,'')), 'utf8');
const portrait = await readFile('public/art/cc-guide.png');
const script = `const __questCCPortrait="data:image/png;base64,${portrait.toString('base64')}";\n` + rawScript.replaceAll('"./art/cc-guide.png"', '__questCCPortrait').replaceAll('"/art/cc-guide.png"', '__questCCPortrait');
const art = await readFile('public/art/cc-emotions.png');
const studyArt = await readFile('public/art/cc-study-practice.png');
let style = (await readFile(resolve('dist', css[1].replace(/^\//,'')), 'utf8'))
  .replaceAll('/art/cc-emotions.png', `data:image/png;base64,${art.toString('base64')}`)
  .replaceAll('/art/cc-study-practice.png', `data:image/png;base64,${studyArt.toString('base64')}`);
for (const match of [...style.matchAll(/url\(([^)]+\.woff2?)\)/g)]) {
  const path=match[1].replace(/[\"']/g,'');
  const bytes=await readFile(resolve('dist',path.replace(/^\//,'')));
  style=style.replaceAll(match[1],`data:font/${path.endsWith('woff2')?'woff2':'woff'};base64,${bytes.toString('base64')}`);
}
const icon = await readFile('public/favicon.svg', 'utf8');
html = html.replace(js[0], () => `<script type="module">${script.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace(css[0], () => `<style>${style}</style>`)
  .replace('href="/favicon.svg"', () => `href="data:image/svg+xml,${encodeURIComponent(icon)}"`);
await writeFile('PLAY-DSA-QUEST.html', html);
console.log('HTML snapshot ready: PLAY-DSA-QUEST.html (use the Vite server for code execution).');
