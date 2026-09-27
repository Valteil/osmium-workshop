// Pre-renders one app icon per theme into build/theme-icons/<theme>.ico,
// for Settings → Appearance → App icon (see main.ts "set-app-icon").
// Run with `npm run build:theme-icons` after adding a theme or changing its
// colours or mark; the .ico files are committed.
//
// Electron is the rasterizer (no extra dependencies): a hidden window loads
// the app's real styles.css plus index.html's inline "Theme mark" script,
// then, per theme, reads the computed theme vars and draws that theme's
// Osmium mark in its ink on a rounded square of its fill. The colour roles
// match the opening flourish: fill = --accent-flair, ink = --bg-base
// (Osmium's mark is solid black).
'use strict';
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'build', 'theme-icons');
const SIZES = [256, 48, 32, 24, 16];

function pngsToIco(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, png }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e); head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(png.length, e + 8); head.writeUInt32LE(offset, e + 12);
    offset += png.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.png)]);
}

// Runs inside the page: one theme → { size: pngDataUrl }.
function renderInPage(theme, sizes) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  const cs = getComputedStyle(root);
  const v = (k) => cs.getPropertyValue(k).trim();
  const fill = v('--accent-flair'), ink = theme === 'osmium' ? '#000' : v('--bg-base');
  const danger = v('--accent-danger'), manual = v('--accent-manual');
  const spec = window.__dtsMarkSpec[theme] || window.__dtsMarkSpec.studio;
  const inner = window.__dtsMarkSVG(spec.L).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const style = `g{stroke:${ink}}.of-nodes{fill:${ink};stroke:none}.of-thin{opacity:.55}`
    + `.of-hollow{fill:${fill};stroke:${ink}}.of-pin{fill:${fill}}.of-split{opacity:.85}`
    + `.of-split-a{stroke:${manual}}.of-split-b{stroke:${danger}}.of-seal{fill:${danger}}`
    + `.of-moon{fill:color-mix(in srgb, ${danger} 55%, ${fill})}`;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">'
    + `<style>${style}</style><rect width="256" height="256" rx="52" fill="${fill}"/>`
    + `<svg x="22" y="22" width="212" height="212" viewBox="-6 -6 262 262">${inner}</svg></svg>`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const out = {};
      for (const size of sizes) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, size, size);
        out[size] = c.toDataURL('image/png');
      }
      resolve(out);
    };
    img.onerror = () => reject(new Error('svg failed to load for ' + theme));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

app.whenReady().then(async () => {
  const html = fs.readFileSync(path.join(ROOT, 'renderer', 'index.html'), 'utf8');
  const start = html.lastIndexOf('<script>', html.indexOf('/* Theme mark.'));
  const end = html.indexOf('</script>', start);
  if (start < 0 || end < 0) throw new Error('Theme mark script not found in renderer/index.html');
  const markScript = html.slice(start, end + '</script>'.length);
  const selAt = html.indexOf('id="themeSelect"');
  const themeSelect = html.slice(selAt, html.indexOf('</select>', selAt));
  const themes = [...themeSelect.matchAll(/<option value="([a-z0-9-]+)"/g)].map((m) => m[1])
    .filter((t, i, a) => t !== 'custom' && a.indexOf(t) === i);
  const cssHref = 'file:///' + path.join(ROOT, 'renderer', 'styles.css').replace(/\\/g, '/');
  const page = path.join(os.tmpdir(), 'osmium-theme-icons.html');
  fs.writeFileSync(page, `<!doctype html><html data-theme="studio"><head><link rel="stylesheet" href="${cssHref}"></head><body>${markScript}</body></html>`);

  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await win.loadFile(page);
  fs.mkdirSync(OUT, { recursive: true });
  for (const theme of themes) {
    const urls = await win.webContents.executeJavaScript(`(${renderInPage})(${JSON.stringify(theme)}, ${JSON.stringify(SIZES)})`);
    const pngs = SIZES.map((size) => ({ size, png: Buffer.from(urls[size].split(',')[1], 'base64') }));
    fs.writeFileSync(path.join(OUT, `${theme}.ico`), pngsToIco(pngs));
  }
  fs.rmSync(page, { force: true });
  console.log(`[theme-icons] wrote ${themes.length} icons to build/theme-icons/`);
  app.quit();
}).catch((err) => { console.error(err); app.exit(1); });
