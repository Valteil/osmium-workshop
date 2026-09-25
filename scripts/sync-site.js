// Syncs the GitHub Pages site (docs/) from the app. Run after any renderer or
// docs change that should reach the site:   node scripts/sync-site.js
//
//   1. docs/demo/  <- renderer/ (index.html, styles.css, app.js, fonts/, data/)
//      The demo is the UNCHANGED desktop renderer running in a plain browser
//      tab. Only index.html is edited on the way in, three ways, all asserted:
//      the demo title, a noindex meta, and demo-shim.js loaded BEFORE app.js
//      (see the comment this script writes above it for why the order matters).
//   2. docs/content/README.md + USER_GUIDE.md <- repo root (readme.html /
//      guide.html render these client-side via md-render.js).
//   3. docs/assets/themes.json <- every html[data-theme="…"] block in
//      renderer/styles.css: the 16 color tokens plus the type faces, with the
//      display name from renderer/index.html's #themeSelect options. The
//      landing page's theme picker reads this, so the site can never drift
//      from the app's real palettes.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const R = (...p) => path.join(ROOT, ...p);

function copyDir(src, dst){
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })){
    const s = path.join(src, ent.name), d = path.join(dst, ent.name);
    if (ent.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function mustReplace(text, from, to, what){
  if (!text.includes(from)) throw new Error(`sync-site: couldn't find ${what} in renderer/index.html`);
  return text.replace(from, to);
}

// ---- 1. demo ----
const demo = R('docs', 'demo');
let html = fs.readFileSync(R('renderer', 'index.html'), 'utf8');
html = mustReplace(html, '<title>Osmium Workshop</title>',
  '<title>Osmium Workshop — Live Demo</title>\n<meta name="robots" content="noindex">', 'the <title>');
html = mustReplace(html, '<script src="app.js"></script>',
  `<!-- demo-shim.js MUST load before app.js, not after: SynthDat Overseer's
     tab-init code calls window.electronAPI.onSynthdatPreviewFrame(...)
     unconditionally at startup (no guard, unlike every other electronAPI
     call site), and if electronAPI is still undefined when that runs,
     app.js throws synchronously and aborts the REST of its own init code
     for the rest of the page load — including every button's click
     listener, btnOpen's ("Open dataset folder") among them. Written by
     scripts/sync-site.js; don't hand-edit (re-run the script). -->
<script src="demo-shim.js"></script>
<script src="app.js"></script>`, 'the app.js <script> tag');
fs.writeFileSync(path.join(demo, 'index.html'), html);
for (const f of ['styles.css', 'app.js']) fs.copyFileSync(R('renderer', f), path.join(demo, f));
copyDir(R('renderer', 'fonts'), path.join(demo, 'fonts'));
copyDir(R('renderer', 'data'), path.join(demo, 'data'));

// ---- 2. content ----
for (const f of ['README.md', 'USER_GUIDE.md']) fs.copyFileSync(R(f), R('docs', 'content', f));

// ---- 3. themes.json ----
const css = fs.readFileSync(R('renderer', 'styles.css'), 'utf8');
const names = {};
const rendererIndex = fs.readFileSync(R('renderer', 'index.html'), 'utf8');
const select = rendererIndex.slice(rendererIndex.indexOf('id="themeSelect"'));
for (const m of select.slice(0, select.indexOf('</select>')).matchAll(/<option value="([a-z-]+)"[^>]*>([^<]+)<\/option>/g)){
  names[m[1]] = m[2].replace(/^\s*🔒\s*/, '').trim();
}
const COLOR_VARS = ['--bg-base', '--bg-panel', '--bg-elevated', '--bg-elevated-2', '--border-soft', '--border-strong',
  '--text-primary', '--text-muted', '--text-faint', '--accent-auto', '--accent-auto-dim', '--accent-manual',
  '--accent-manual-dim', '--accent-danger', '--accent-success', '--accent-flair'];
const FACE_VARS = ['--sans', '--mono', '--display', '--head-font'];
function readBlock(body){
  const out = {};
  for (const v of [...COLOR_VARS, ...FACE_VARS]){
    const m = body.match(new RegExp(v.replace(/-/g, '\\-') + '\\s*:\\s*([^;]+);'));
    if (m) out[v] = m[1].trim();
  }
  return out;
}
const themes = [];
const studio = css.match(/:root, html\[data-theme="studio"\]\{([\s\S]*?)\n\s*\}/);
if (!studio) throw new Error('sync-site: Studio block not found');
const studioVars = readBlock(studio[1]);
themes.push({ id: 'studio', name: names.studio || 'Studio', vars: studioVars });
for (const m of css.matchAll(/html\[data-theme="([a-z-]+)"\]\{([\s\S]*?)\n\s*\}/g)){
  if (m[1] === 'studio') continue; // already read from its :root block above
  const vars = readBlock(m[2]);
  if (!vars['--bg-base']) continue;
  // Faces a theme doesn't set fall back the same way the CSS cascade does:
  // --display/--head-font default to its own --sans (Studio's :root chain).
  vars['--display'] = vars['--display'] || vars['--sans'] || studioVars['--sans'];
  vars['--sans'] = vars['--sans'] || studioVars['--sans'];
  vars['--mono'] = vars['--mono'] || studioVars['--mono'];
  themes.push({ id: m[1], name: names[m[1]] || m[1], vars });
}
studioVars['--display'] = studioVars['--sans'];

// ---- 4. night-palette.js <- the app's own night-mode color math ----
// Extracted verbatim from renderer/index.html's pre-paint script, so the
// site's scroll night mode applies exactly what the app's night mode does.
const npBegin = rendererIndex.indexOf('/* night-palette:begin */');
const npEnd = rendererIndex.indexOf('/* night-palette:end */');
if (npBegin < 0 || npEnd < npBegin) throw new Error('sync-site: night-palette markers not found in renderer/index.html');
fs.writeFileSync(R('docs', 'assets', 'night-palette.js'),
  '// GENERATED by scripts/sync-site.js from renderer/index.html — do not edit;\n' +
  '// change the app\'s night mode there and re-run the script. Defines\n' +
  '// window.__dtsNightPalette(readHex) -> { themeVar: nightHex }.\n' +
  '(function(){\n' + rendererIndex.slice(npBegin, npEnd).replace('/* night-palette:begin */', '').trim() + '\n})();\n');
const order = Object.keys(names);
themes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
fs.writeFileSync(R('docs', 'assets', 'themes.json'), JSON.stringify(themes));
console.log(`sync-site: demo synced, content synced, ${themes.length} themes -> docs/assets/themes.json`);
