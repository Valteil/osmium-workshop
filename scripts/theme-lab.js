// Theme Lab: a local page for checking every theme against the app's real
// components, and for replaying the opening flourish (with slow motion and a
// live "% of normal duration" readout). Started by "Theme Lab.cmd".
//
// The page is built fresh from renderer/index.html on every request, so it
// always uses the app's current stylesheet, icon sprite, theme list, markup
// (topbar, tab bar, a real dock) and opening-flourish script. It's served
// over http rather than opened from disk because Chrome blocks the bundled
// fonts on file:// pages. No dependencies.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8761;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
};

// Outer HTML of the first element opened by `startTag` (balanced by tag name).
function extract(html, startTag){
  const at = html.indexOf(startTag);
  if (at < 0) throw new Error('theme-lab: not found in renderer/index.html: ' + startTag);
  const name = startTag.match(/^<([a-z0-9]+)/i)[1];
  const re = new RegExp('<' + name + '\\b|</' + name + '>', 'gi');
  re.lastIndex = at;
  let depth = 0, m;
  while ((m = re.exec(html))){
    depth += m[0][1] === '/' ? -1 : 1;
    if (depth === 0) return html.slice(at, m.index + m[0].length);
  }
  throw new Error('theme-lab: unbalanced ' + startTag);
}
function between(html, a, b){
  const i = html.indexOf(a), j = html.indexOf(b, i + a.length);
  if (i < 0 || j < 0) throw new Error('theme-lab: markers not found: ' + a);
  return html.slice(i + a.length, j);
}

function buildPage(){
  const src = fs.readFileSync(path.join(ROOT, 'renderer', 'index.html'), 'utf8');
  const sprite = extract(src, '<svg id="iconSprite"');
  const topbar = extract(src, '<header id="topbar">');
  const tabBar = extract(src, '<nav id="tabBar">');
  const dock = extract(src, '<div class="tool-section" data-dock-id="unifyVoid">');
  const nightFn = between(src, '/* night-palette:begin */', '/* night-palette:end */');
  // The flourish's logo builder + per-theme table (window.__dtsMarkSVG /
  // __dtsMarkSpec) is its own inline script, loaded once into the page.
  const markStart = src.indexOf('/* Theme mark.');
  const markScript = src.slice(markStart, src.indexOf('</script>', markStart));
  const flourishStart = src.indexOf('/* Opening flourish.');
  const flourish = src.slice(flourishStart, src.indexOf('</script>', flourishStart));
  const select = extract(src, '<select id="themeSelect"');
  const themes = [...select.matchAll(/<option value="([a-z-]+)"[^>]*>([^<]+)<\/option>/g)]
    .filter((m) => m[1] !== 'custom').map((m) => [m[1], m[2].replace(/^\s*🔒\s*/, '').trim()]);
  const imgs = fs.readdirSync(path.join(ROOT, 'docs', 'demo', 'dataset')).filter((f) => /\.png$/i.test(f)).slice(0, 4)
    .map((f) => '/docs/demo/dataset/' + f);

  const chip = (tag, cls) => `<span class="chip${cls ? ' ' + cls : ''}"><span>${tag}</span><button>×</button></span>`;
  const card = (img, name, tags, cls) => `
      <div class="card${cls ? ' ' + cls : ''}">
        <div class="card-status-icons">
          <div class="status-icon-badge" title="Censored: Not indicated"><svg class="ic status-topic"><use href="#i-eye"></use></svg><svg class="ic status-state status-unknown"><use href="#i-help"></use></svg></div>
          <div class="status-icon-badge" title="Has text: No"><svg class="ic status-topic"><use href="#i-message"></use></svg><svg class="ic status-state status-no"><use href="#i-x-circle"></use></svg></div>
          <div class="status-icon-badge" title="Perspective: Yes"><svg class="ic status-topic"><use href="#i-compass"></use></svg><svg class="ic status-state status-yes"><use href="#i-check-circle"></use></svg></div>
        </div>
        <div class="thumbwrap"><img src="${img}" alt=""><button class="img-menu-btn" title="More options">⋯</button><div class="filename">${name}</div></div>
        <div class="tagbox"><div class="chiprow">${tags}</div><input class="addtag-input" type="text" placeholder="+ add tag"></div>
      </div>`;

  const sections = {
    buttons: ['Buttons', `
      <div class="lab-row">
        <button>Default</button><button class="primary">Primary</button><button class="danger-ghost">Danger</button>
        <button disabled>Disabled</button><button><svg class="ic ic-lead"><use href="#i-settings"></use></svg>With icon</button>
        <button title="Icon only"><svg class="ic"><use href="#i-wrench"></use></svg></button>
      </div>
      <p class="lab-note">Hover them for the theme's hover state. Premium hover-fill shows on epic/legendary themes, or turn on <b>Refined</b> above.</p>
      <div class="lab-row"><div class="viewToggle" id="labViewToggle">
        <button class="active">Grid</button><button>Compact</button><button>Single</button><button>Disabled</button>
      </div></div>`],
    chrome: ['Top bar & tabs', `
      <div class="lab-frame">${topbar}</div>
      <div class="lab-frame">${tabBar}</div>`],
    chips: ['Chips & tags', `
      <div class="lab-chips">
        <div><span class="lab-cap">Plain</span><div class="chiprow">${chip('1girl')}${chip('red eyes')}${chip('long hair')}</div></div>
        <div><span class="lab-cap">Selected</span><div class="chiprow">${chip('smile', 'selected')}${chip('blush', 'selected')}</div></div>
        <div><span class="lab-cap">Search match</span><div class="chiprow">${chip('school uniform', 'chip-match')}</div></div>
        <div><span class="lab-cap">Isolated</span><div class="chiprow">${chip('lens flare', 'chip-isolated')}</div></div>
        <div><span class="lab-cap">Flagged for review</span><div class="chiprow">${chip('hand on hip', 'chip-flagged-review')}</div></div>
      </div>`],
    cards: ['Gallery cards', `
      <main id="gallery" class="lab-gallery"><div id="galleryGrid" class="lab-grid">
        ${card(imgs[0], 'chromatic_01.png', chip('1girl') + chip('white hair') + chip('smile', 'selected') + chip('school uniform', 'chip-match'))}
        ${card(imgs[1], 'chromatic_02.png', chip('1boy') + chip('skeleton') + chip('lens flare', 'chip-isolated'), 'dirty')}
        ${card(imgs[2] || imgs[0], 'chromatic_03.png', '', 'untagged')}
        ${card(imgs[3] || imgs[1], 'chromatic_04.png', chip('hand on hip', 'chip-flagged-review') + chip('sky'))}
      </div></main>
      <p class="lab-note">Plain, dirty (unsaved, amber border), untagged, and a flagged tag. Hover a card for premium card lift.</p>`],
    docks: ['Docks', `
      <aside id="right" class="lab-right">${dock}</aside>`],
    inputs: ['Inputs & toggles', `
      <div class="lab-col" style="max-width:420px">
        <input type="text" placeholder="Show images containing tag(s)…">
        <input type="text" value="Typed text">
        <textarea rows="3" placeholder="A note…"></textarea>
        <label class="ach-toggle-row"><input type="checkbox" checked><span>A checked toggle row</span></label>
        <label class="ach-toggle-row"><input type="checkbox"><span>An unchecked toggle row</span></label>
      </div>`],
    menus: ['Menus & dialogs', `
      <div class="lab-row" style="align-items:flex-start">
        <div class="ctx-menu lab-static" style="min-width:220px">
          <div class="ctx-header">red eyes · 3 images</div>
          <button class="ctx-item">Select for merge</button><button class="ctx-item">Filter to this tag</button>
          <button class="ctx-item">Tag details</button><button class="ctx-item">Flag for review</button>
        </div>
        <div class="confirm-box lab-static" style="max-width:360px">
          <div>Delete 3 images permanently? This can't be undone.</div>
          <div class="confirm-actions" style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px">
            <button>Cancel</button><button class="danger-ghost">Delete</button>
          </div>
        </div>
      </div>
      <div class="lab-row"><button id="labToast">Show a toast</button></div>
      <div id="toast"></div>`],
    brand: ['Brand', `
      <div class="lab-row"><div class="brand-block"><div class="brand">Osmium Workshop <span class="tag">Dataset Manager</span></div></div></div>`],
  };
  const nav = Object.entries(sections).map(([k, v], i) => `<button data-sec="${k}"${i ? '' : ' class="on"'}>${v[0]}</button>`).join('');
  const panes = Object.entries(sections).map(([k, v], i) => `<section class="lab-pane" data-sec="${k}"${i ? ' hidden' : ''}><h2 class="lab-h">${v[0]}</h2>${v[1]}</section>`).join('');
  const options = themes.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');

  return `<!doctype html>
<html lang="en" data-theme="studio">
<head>
<meta charset="utf-8">
<title>Osmium Theme Lab</title>
<link rel="stylesheet" href="/renderer/fonts/fonts.css">
<link rel="stylesheet" href="/renderer/fonts/font-fit.css">
<link rel="stylesheet" href="/renderer/styles.css">
<script>(function(){ ${nightFn} })();</script>
<script>${markScript}</script>
<style>
  /* The lab's own chrome is neutral so it never competes with the theme. */
  html, body{ height: auto; overflow: auto; }
  body{ margin: 0; }
  #labBar{
    position: sticky; top: 0; z-index: 1000; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    padding: 8px 14px; background: #121216; color: #d6d6dc; border-bottom: 1px solid #2a2a31;
    font: 13px/1.3 system-ui, "Segoe UI", sans-serif;
  }
  #labBar .grp{ display: flex; align-items: center; gap: 8px; }
  #labBar .sep{ width: 1px; align-self: stretch; background: #2a2a31; }
  #labBar select, #labBar button{
    all: unset; box-sizing: border-box; font: inherit; color: #e8e8ee; background: #1d1d23; border: 1px solid #34343c;
    border-radius: 6px; padding: 5px 10px; cursor: pointer;
  }
  #labBar select{ padding-right: 24px; background-image: linear-gradient(45deg, transparent 50%, #999 50%), linear-gradient(135deg, #999 50%, transparent 50%);
    background-position: calc(100% - 13px) 50%, calc(100% - 9px) 50%; background-size: 4px 4px; background-repeat: no-repeat; }
  #labBar button:hover, #labBar select:hover{ border-color: #55555f; }
  #labBar button.on{ background: #e8e8ee; color: #121216; border-color: #e8e8ee; }
  #labBar button:focus-visible, #labBar select:focus-visible, #labNav button:focus-visible{ outline: 2px solid #7aa7ff; outline-offset: 1px; }
  #labBar label{ display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; }
  #labBar input[type=checkbox]{ accent-color: #e8e8ee; }
  #labBar .muted{ color: #8a8a94; }
  #labPlay{ font-weight: 600; }
  #labBody{ display: flex; align-items: flex-start; }
  #labNav{
    position: sticky; top: 45px; flex: 0 0 200px; height: calc(100vh - 45px); overflow: auto; box-sizing: border-box;
    padding: 12px 8px; background: #16161b; border-right: 1px solid #2a2a31; font: 13px/1.3 system-ui, "Segoe UI", sans-serif;
  }
  #labNav[hidden]{ display: none; }
  #labNav button{ all: unset; box-sizing: border-box; display: block; width: 100%; padding: 8px 12px; border-radius: 6px; color: #b9b9c2; cursor: pointer; }
  #labNav button:hover{ background: #1f1f26; color: #e8e8ee; }
  #labNav button.on{ background: #25252d; color: #fff; }
  #labMain{ flex: 1; min-width: 0; padding: 28px 32px 60px; }
  .lab-h{ margin: 0 0 18px; font: 600 15px/1.2 system-ui, "Segoe UI", sans-serif; color: var(--text-muted); }
  .lab-row{ display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 18px; }
  .lab-col{ display: flex; flex-direction: column; gap: 12px; }
  .lab-note{ margin: 0 0 18px; max-width: 62ch; font-size: 12.5px; color: var(--text-muted); line-height: 1.5; }
  .lab-cap{ display: block; margin-bottom: 6px; font-size: 12px; color: var(--text-faint); }
  .lab-chips{ display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 18px 24px; }
  .lab-frame{ position: relative; margin-bottom: 18px; border: 1px dashed color-mix(in srgb, var(--text-faint) 40%, transparent); }
  .lab-frame #topbar, .lab-frame #tabBar{ position: static; }
  .lab-gallery{ display: block; height: auto !important; overflow: visible !important; padding: 16px; border-radius: 10px; }
  .lab-grid{ display: grid !important; grid-template-columns: repeat(auto-fill, 220px); gap: 14px; }
  .lab-grid .card{ content-visibility: visible; }
  .lab-right{ display: block !important; position: static !important; width: 340px; height: auto !important; overflow: visible !important; transform: none !important; }
  .lab-static{ position: static !important; display: block !important; opacity: 1 !important; transform: none !important; }
  #toast{ z-index: 1001; }
</style>
</head>
<body>
${sprite}
<div id="labBar">
  <button id="labMenu" title="Show or hide the categories" aria-label="Categories">☰</button>
  <div class="grp"><span class="muted">Theme</span><select id="labTheme">${options}</select></div>
  <div class="grp"><label><input type="checkbox" id="labNight"> Night</label><label><input type="checkbox" id="labRefined"> Refined</label></div>
  <div class="sep"></div>
  <div class="grp">
    <button id="labPlay">▶ Play opening flourish</button>
    <span class="muted">Speed</span>
    <button class="labSpeed on" data-rate="1">100%</button><button class="labSpeed" data-rate="0.5">50%</button><button class="labSpeed" data-rate="0.25">25%</button>
  </div>
  <div class="grp">
    <span class="muted">Axis</span>
    <select id="labAxis"><option value="auto">Auto (by width)</option><option value="h">Desktop (left→right)</option><option value="v">Phone (top→bottom)</option></select>
    <label><input type="checkbox" id="labReduce"> Reduced motion</label>
  </div>
</div>
<div id="labBody">
  <nav id="labNav" aria-label="Categories">${nav}</nav>
  <div id="labMain">${panes}</div>
</div>
<script>
(function(){
  var root = document.documentElement;
  var themeSel = document.getElementById('labTheme'), night = document.getElementById('labNight'), refined = document.getElementById('labRefined');
  var nightKeys = [];
  function toHex6(c){
    var cv = toHex6.cv || (toHex6.cv = document.createElement('canvas').getContext('2d'));
    cv.fillStyle = '#000000'; cv.fillStyle = c;
    var n = cv.fillStyle;
    if (n[0] === '#') return n.length >= 7 ? n.slice(0, 7) : n;
    var m = n.match(/rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)/);
    if (m){ var h = function(x){ return Number(x).toString(16).padStart(2, '0'); }; return '#' + h(m[1]) + h(m[2]) + h(m[3]); }
    return '#000000';
  }
  // Same order the app uses: theme first, then night mode's inversion of it.
  function applyTheme(){
    nightKeys.forEach(function(k){ root.style.removeProperty(k); }); nightKeys = [];
    root.setAttribute('data-theme', themeSel.value);
    root.classList.toggle('theme-refined', refined.checked);
    if (night.checked && window.__dtsNightPalette){
      var cs = getComputedStyle(root);
      var pal = window.__dtsNightPalette(function(k){ return toHex6((cs.getPropertyValue(k) || '#000000').trim()); });
      for (var k in pal){ root.style.setProperty(k, pal[k]); nightKeys.push(k); }
    }
    try { localStorage.setItem('lab-theme', JSON.stringify({t: themeSel.value, n: night.checked, r: refined.checked})); } catch(e){}
  }
  try { var saved = JSON.parse(localStorage.getItem('lab-theme') || 'null'); if (saved){ themeSel.value = saved.t; night.checked = saved.n; refined.checked = saved.r; } } catch(e){}
  [themeSel, night, refined].forEach(function(n){ n.addEventListener('change', applyTheme); });
  applyTheme();

  // Categories.
  var nav = document.getElementById('labNav');
  document.getElementById('labMenu').addEventListener('click', function(){ nav.hidden = !nav.hidden; });
  nav.addEventListener('click', function(ev){
    var b = ev.target.closest('button[data-sec]'); if (!b) return;
    nav.querySelectorAll('button').forEach(function(x){ x.classList.toggle('on', x === b); });
    document.querySelectorAll('.lab-pane').forEach(function(p){ p.hidden = p.dataset.sec !== b.dataset.sec; });
    window.scrollTo(0, 0);
  });
  document.getElementById('labToast').addEventListener('click', function(){
    var t = document.getElementById('toast'); t.textContent = 'Added "Chromatic Void" to the Datasets tab.';
    t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function(){ t.classList.remove('show'); }, 2600);
  });

  // ---- Opening flourish: the app's own script, replayed on demand ----
  var rate = 1;
  document.querySelectorAll('.labSpeed').forEach(function(b){
    b.addEventListener('click', function(){
      rate = +b.dataset.rate;
      document.querySelectorAll('.labSpeed').forEach(function(x){ x.classList.toggle('on', x === b); });
      flourishAnims().forEach(function(a){ a.playbackRate = rate; });
    });
  });
  // The flourish builds its teeth and trail when it starts (a couple of
  // frames after Play), so apply the lab's speed to every flourish
  // animation as it's created, not just the ones that exist at Play.
  var realAnimate = Element.prototype.animate;
  Element.prototype.animate = function(){
    var a = realAnimate.apply(this, arguments);
    if (this.closest && this.closest('#openFlourish')) a.playbackRate = rate;
    return a;
  };
  function flourishAnims(){
    var el = document.getElementById('openFlourish');
    return el ? document.getAnimations().filter(function(a){ return a.effect && a.effect.target && el.contains(a.effect.target); }) : [];
  }
  document.getElementById('labPlay').addEventListener('click', function(){
    var old = document.getElementById('openFlourish'); if (old) old.remove();
    var axis = document.getElementById('labAxis').value, reduce = document.getElementById('labReduce').checked;
    var realMM = window.matchMedia, realAdd = window.addEventListener, realFocus = document.hasFocus;
    // The app waits for its window to be shown and focused; the lab page
    // already is, so skip that gate.
    document.hasFocus = function(){ return true; };
    // Force the axis / reduced motion the script reads, and keep its
    // "any press speeds it up" listeners out so clicks here don't hurry it.
    window.matchMedia = function(q){
      if (q.indexOf('max-width: 900px') >= 0 && axis !== 'auto') return {matches: axis === 'v'};
      if (q.indexOf('prefers-reduced-motion') >= 0) return {matches: reduce};
      return realMM.call(window, q);
    };
    window.addEventListener = function(type){ if (type === 'pointerdown' || type === 'keydown') return; return realAdd.apply(window, arguments); };
    try { window.__dtsNoOpenFlourish = false; localStorage.removeItem('dts-disable-open-flourish'); (0, eval)(document.getElementById('labFlourishSrc').textContent); }
    finally { window.matchMedia = realMM; window.addEventListener = realAdd; document.hasFocus = realFocus; }
    flourishAnims().forEach(function(a){ a.playbackRate = rate; });
  });
})();
</script>
<script type="text/plain" id="labFlourishSrc">${flourish.replace(/<\/script/gi, '<\\/script')}</script>
</body>
</html>`;
}

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/' || url === '/lab') {
    try {
      const html = buildPage();
      res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
      return res.end(html);
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end(String(e && e.stack || e));
    }
  }
  const file = path.normalize(path.join(ROOT, url));
  const allowed = [path.join(ROOT, 'renderer'), path.join(ROOT, 'docs', 'demo', 'dataset')];
  if (!allowed.some((dir) => file.startsWith(dir + path.sep))) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(file, (err, body) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  });
}).listen(PORT, '127.0.0.1', () => {
  const url = 'http://localhost:' + PORT + '/';
  console.log('Osmium Theme Lab: ' + url + '  (close this window to stop)');
  if (!process.env.NO_OPEN && !process.argv.includes('--no-open')) exec((process.platform === 'win32' ? 'start "" ' : process.platform === 'darwin' ? 'open ' : 'xdg-open ') + '"' + url + '"');
});
