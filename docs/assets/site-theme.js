// Site theming: lets a visitor wear any of the app's 26 themes on the site
// itself. Loaded synchronously in <head> on every page (after
// night-palette.js), so a saved choice paints on the first frame — no flash
// of the default Osmium look on the way to it.
//
// The site's palette is ten tokens (ground, card, ink, lines, red/green/blue
// accents), each with a light (-l) and dark (-d) endpoint that the landing
// page's scroll-driven night mode mixes between. An app theme maps onto them
// 1:1 — its own day values for -l, and for -d exactly what the APP's night
// mode would do to that theme (window.__dtsNightPalette, generated from the
// app's own pre-paint script by scripts/sync-site.js). Faces map the same
// way: the theme's brand face, UI face and mono face.
//
// Osmium IS the site's default look (same tokens as the landing page), so
// picking it clears every override rather than re-applying near-identical
// values. The theme data itself (assets/themes.json) is generated from the
// app's styles.css by the same sync script.
(function(){
  var KEY = 'osmium-site-theme';
  var TOKENS = {
    'ground': '--bg-base', 'ground-dim': '--bg-elevated', 'card': '--bg-panel',
    'ink': '--text-primary', 'ink-soft': '--text-muted',
    'line': '--border-soft', 'line-strong': '--border-strong',
    'red': '--accent-auto', 'green': '--accent-success', 'blue': '--accent-manual'
  };
  var FACES = { '--f-display': '--display', '--f-body': '--sans', '--f-mono': '--mono' };
  var root = document.documentElement;
  // Sub-pages (guide/readme) have no night mode: they read the bare tokens.
  var staticPage = root.hasAttribute('data-static-theme');
  var applied = [];

  function build(theme){
    var v = theme.vars, map = {};
    var night = window.__dtsNightPalette(function(k){ return String(v[k] || '#000000').slice(0, 7); });
    for (var t in TOKENS){
      var src = TOKENS[t], day = v[src];
      // Keep a translucent border's alpha on its night twin too.
      var alpha = day.length === 9 ? day.slice(7) : '';
      map['--' + t + '-l'] = day;
      map['--' + t + '-d'] = night[src] + alpha;
    }
    // Put the width-normalised twin (assets/font-fit.css) first in each stack so no face changes the layout.
    for (var f in FACES) map[f] = v[FACES[f]].replace(/^'([^']+)'/, function(m, fam){ return "'" + fam + ' Fit ' + f.slice(4) + "', " + m; });
    return { id: theme.id, name: theme.name, vars: map, ground: groundOf(theme, night) || {},
      swatch: [v['--bg-base'], v['--accent-manual'], v['--accent-flair']] };
  }
  // ---- animated ground (the app's #gallery background, drifting like its "scroll the gallery
  // background" option). Painted on html::before so no DOM is needed at <head> time.
  var GROUND_VARS = ['--bg-base', '--text-primary', '--accent-auto', '--accent-manual', '--accent-flair', '--accent-success', '--accent-danger', '--border-strong'];
  var st = document.createElement('style');
  st.textContent = 'html[data-site-ground]::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:var(--sg-image);background-size:var(--sg-size);background-position:var(--sg-pos)}';
  document.head.appendChild(st);
  var anim = null, planTimer = 0;
  var SPEED = 6, LOOP_S = 120;
  function splitTop(s){
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++){
      var ch = s[i];
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (ch === ',' && depth === 0){ out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function pxv(t){ return /^-?\d+(\.\d+)?px$/.test(t) ? parseFloat(t) : (t === '0%' || t === '0') ? 0 : null; }
  function isPx(t){ return /^\d+(\.\d+)?px$/.test(t); }
  function num(n){ return (Math.round(n * 100) / 100) + 'px'; }
  function hatchTile(angle, period){
    var sn = Math.abs(Math.sin(angle * Math.PI / 180)), cs = Math.abs(Math.cos(angle * Math.PI / 180)), best = null;
    function dim(trig, k){ return trig < 1e-6 ? period : Math.round((k * period) / trig); }
    for (var k = 1; k <= 12; k++){
      var w = dim(sn, k), h = dim(cs, k);
      var err = Math.max(sn < 1e-6 ? 0 : Math.abs(w * sn - k * period) / (k * period), cs < 1e-6 ? 0 : Math.abs(h * cs - k * period) / (k * period));
      if (!best || err < best.err - 1e-9) best = { w: w, h: h, err: err };
      if (err < 0.004) break;
    }
    return best;
  }
  // Same planner as the app's ground-scroll.ts: every tiled layer travels a whole number of its own tiles per loop.
  function plan(cs){
    var imgs = splitTop(cs.backgroundImage), sizes = splitTop(cs.backgroundSize), poss = splitTop(cs.backgroundPosition);
    var outSize = [], from = [], to = [], moving = false;
    imgs.forEach(function(img, i){
      var size = (sizes[i % sizes.length] || 'auto').split(/\s+/), pos = (poss[i % poss.length] || '0% 0%').split(/\s+/);
      var x0 = pxv(pos[0]), y0 = pxv(pos[1]), sw = size[0], sh = size[1] || size[0], dx = 0, dy = 0;
      var ok = x0 !== null && y0 !== null && img !== 'none';
      if (ok && img.indexOf('repeating-linear-gradient(') === 0 && sw === 'auto' && sh === 'auto'){
        var a = /^repeating-linear-gradient\((-?\d+(?:\.\d+)?)deg/.exec(img), p = /(\d+(?:\.\d+)?)px\)$/.exec(img);
        var tile = a && p ? hatchTile(parseFloat(a[1]), parseFloat(p[1])) : null;
        if (tile){
          sw = num(tile.w); sh = num(tile.h);
          var rad = parseFloat(a[1]) * Math.PI / 180;
          if (Math.abs(Math.sin(rad)) < 1e-6){ sw = 'auto'; dx = -1; } else if (Math.abs(Math.cos(rad)) < 1e-6){ sh = 'auto'; dy = -1; }
        } else ok = false;
      }
      if (ok && (img.indexOf('repeating-radial') === 0 || (sw === 'auto' && sh === 'auto'))) ok = false;
      if (ok){
        var wPx = isPx(sw) ? parseFloat(sw) : 0, hPx = isPx(sh) ? parseFloat(sh) : 0;
        if (!wPx && !hPx) ok = false;
        else {
          dx = wPx && dx !== -1 ? Math.max(1, Math.round((SPEED * LOOP_S) / wPx)) * wPx : 0;
          dy = hPx && dy !== -1 ? Math.max(1, Math.round((SPEED * LOOP_S) / hPx)) * hPx : 0;
          if (dx === 0 && dy === 0) ok = false;
        }
      }
      if (ok){
        outSize.push((sw === 'auto' ? '100%' : sw) + ' ' + (sh === 'auto' ? '100%' : sh));
        from.push(num(x0) + ' ' + num(y0)); to.push(num(x0 + dx) + ' ' + num(y0 + dy));
        moving = true;
      } else {
        outSize.push(sizes[i % sizes.length] || 'auto');
        var keep = poss[i % poss.length] || '0% 0%'; from.push(keep); to.push(keep);
      }
    });
    return { size: outSize.join(', '), from: from.join(', '), to: to.join(', '), moving: moving };
  }
  function stopGround(){
    clearTimeout(planTimer);
    if (anim){ anim.cancel(); anim = null; }
  }
  function startGround(){
    stopGround();
    // 30ms setTimeout, not rAF: a hidden tab pauses rAF.
    planTimer = setTimeout(function(){
      var p = plan(getComputedStyle(root, '::before'));
      if (!p.moving || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
      set('--sg-size', p.size);
      anim = root.animate({ backgroundPosition: [p.from, p.to] }, { duration: LOOP_S * 1000, iterations: Infinity, easing: 'linear', pseudoElement: '::before' });
    }, 30);
  }
  // ---- Terminal's matrix rain: the app's ground-scroll.ts rain, ported to a fixed canvas behind the page.
  // Falling katakana/digits in the theme's accent (--blue, so it follows night mode). Terminal only;
  // skipped under reduced motion. Same cell size, speeds, trail and alphas as the app.
  var GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>|', CELL = 16;
  var rain = null;
  function stopRain(){
    if (!rain) return;
    clearInterval(rain.timer); window.removeEventListener('resize', rain.resize); rain.canvas.remove(); rain = null;
  }
  function startRain(){
    stopRain();
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:-1;pointer-events:none;display:block';
    document.body.insertBefore(canvas, document.body.firstChild);
    var cols = [], rows = 0, rgb = [0, 255, 102], last = performance.now(), frame = 0;
    function rand(a, b){ return a + Math.random() * (b - a); }
    function glyph(){ return GLYPHS[Math.floor(Math.random() * GLYPHS.length)]; }
    function reset(c, first){ c.speed = rand(3, 6); c.len = Math.floor(rand(8, 18)); c.head = first ? rand(-rows, rows) : -1; c.wait = first ? rand(0, 5) : rand(1, 8); }
    function resize(){
      var dpr = window.devicePixelRatio || 1, w = innerWidth, h = innerHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr));
      rows = Math.ceil(h / CELL);
      var n = Math.floor(w / CELL);
      while (cols.length < n){ var c = { head: 0, speed: 0, len: 0, wait: 0, glyphs: [] }; for (var i = 0; i < 96; i++) c.glyphs.push(glyph()); reset(c, true); cols.push(c); }
      cols.length = n;
    }
    // The canvas's own computed `color` resolves var(--blue) (and its night mix) to plain rgb().
    canvas.style.color = 'var(--blue)';
    // Computed color can be rgb() or color(srgb …); a 1px canvas turns either into bytes.
    var probe = document.createElement('canvas'); probe.width = probe.height = 1;
    var pctx = probe.getContext('2d', { willReadFrequently: true });
    function color(){ pctx.clearRect(0, 0, 1, 1); pctx.fillStyle = getComputedStyle(canvas).color; pctx.fillRect(0, 0, 1, 1); var d = pctx.getImageData(0, 0, 1, 1).data; rgb = [d[0], d[1], d[2]]; }
    function draw(){
      if (document.hidden) return;
      var now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now;
      if (frame++ % 16 === 0) color();
      var ctx = canvas.getContext('2d'), dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = (CELL - 3) + 'px "JetBrains Mono", "MS Gothic", monospace';
      ctx.textBaseline = 'top';
      cols.forEach(function(c, i){
        if (c.wait > 0){ c.wait -= dt; return; }
        c.head += c.speed * dt;
        if (c.head - c.len > rows){ reset(c, false); return; }
        var head = Math.floor(c.head);
        for (var k = 0; k < c.len; k++){
          var row = head - k;
          if (row < 0 || row > rows) continue;
          var idx = row % c.glyphs.length;
          if (Math.random() < dt * 0.9) c.glyphs[idx] = glyph();
          var a = k === 0 ? 0.3 : 0.17 * Math.pow(1 - k / c.len, 1.6);
          ctx.fillStyle = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + a.toFixed(3) + ')';
          ctx.fillText(c.glyphs[idx], i * CELL + 1, row * CELL);
        }
      });
    }
    resize(); color();
    window.addEventListener('resize', resize);
    rain = { canvas: canvas, resize: resize, timer: setInterval(draw, 60) };
  }

  function groundOf(theme, night){
    if (!theme.ground) return null;
    var vars = {}, v = theme.vars;
    GROUND_VARS.forEach(function(k){
      var day = v[k]; if (!day) return;
      var nt = night[k] ? night[k] + (day.length === 9 ? day.slice(7) : '') : day;
      vars[k] = 'color-mix(in srgb, ' + day + ' calc((1 - var(--night, 0)) * 100%), ' + nt + ')';
    });
    var g = {};
    theme.ground.split(';').forEach(function(d){
      var i = d.indexOf(':'), k = d.slice(0, i), val = d.slice(i + 1);
      if (k === 'background-image') g['--sg-image'] = val;
      else if (k === 'background-size') g['--sg-size'] = val;
      else if (k === 'background-position') g['--sg-pos'] = val;
      else vars[k] = val;
    });
    for (var k in g) vars[k] = g[k];
    addTiles(theme.id, vars);
    return vars;
  }
  // Themes whose app ground is only a glow/vignette (nothing tiled, so nothing for the diagonal drift to
  // carry) get a few tiled layers underneath it here. Site-only: the app's own grounds are untouched.
  // Each layer is [image, size]; sizes are px with both axes set so plan() moves it down-right, and the
  // sizes are mutually odd so the layers don't line up into a visible grid.
  function dot(c, pct, r, soft, at){ return 'radial-gradient(circle at ' + at + ', color-mix(in srgb, var(' + c + ') ' + pct + '%, transparent) 0 ' + r + 'px, transparent ' + soft + 'px)'; }
  var EXTRA = {
    // plankton: pinpricks and a few soft halos
    bioluminescent: [[dot('--accent-manual', 40, 1.5, 2.5, '20% 30%'), '97px 113px'], [dot('--accent-manual', 28, 1, 2, '70% 65%'), '61px 73px'], [dot('--accent-manual', 15, 2, 8, '45% 85%'), '131px 149px']],
    // embers: warm sparks of two sizes
    solarflare: [[dot('--accent-manual', 34, 1.4, 2.4, '30% 40%'), '83px 101px'], [dot('--accent-auto', 24, 1, 2, '65% 70%'), '67px 59px'], [dot('--accent-manual', 14, 2, 7, '55% 15%'), '139px 127px']],
    // fine diagonal hatching to carry the vignette
    'blood-moon': [['repeating-linear-gradient(135deg, color-mix(in srgb, var(--accent-manual) 8%, transparent) 0 1px, transparent 1px 34px)', 'auto'], ['repeating-linear-gradient(45deg, color-mix(in srgb, var(--text-primary) 4%, transparent) 0 1px, transparent 1px 58px)', 'auto']],
    // twinkling points under the two glows
    'aurora-borealis': [[dot('--text-primary', 38, 1, 1.8, '25% 35%'), '141px 121px'], [dot('--accent-auto', 30, 1.2, 2.2, '70% 70%'), '191px 167px'], [dot('--accent-manual', 24, 1, 2, '50% 10%'), '109px 157px']],
    // spores drifting over the rings
    'forest-moss': [[dot('--accent-manual', 26, 1.5, 2.5, '35% 45%'), '73px 89px'], [dot('--accent-manual', 16, 1, 2, '75% 20%'), '49px 57px'], [dot('--accent-flair', 18, 2, 6, '60% 80%'), '127px 113px']]
  };
  function addTiles(id, vars){
    var more = EXTRA[id];
    if (!more || !vars['--sg-image']) return;
    var n = splitTop(vars['--sg-image']).length;
    var sizes = vars['--sg-size'] ? splitTop(vars['--sg-size']) : [], poss = vars['--sg-pos'] ? splitTop(vars['--sg-pos']) : [];
    while (sizes.length < n) sizes.push('100% 100%');
    while (poss.length < n) poss.push('0 0');
    more.forEach(function(m){ vars['--sg-image'] += ', ' + m[0]; sizes.push(m[1]); poss.push('0 0'); });
    vars['--sg-size'] = sizes.join(', ');
    vars['--sg-pos'] = poss.join(', ');
  }
  function clear(){
    stopGround(); stopRain();
    root.removeAttribute('data-site-ground');
    for (var i = 0; i < applied.length; i++) root.style.removeProperty(applied[i]);
    applied = [];
    delete root.dataset.siteTheme;
  }
  function set(k, v){ root.style.setProperty(k, v); applied.push(k); }
  function paint(rec){
    clear();
    for (var k in rec.vars) set(k, rec.vars[k]);
    // Records are saved from whichever page picked them; a static page reads
    // the bare tokens, so derive those from the day endpoints here.
    if (staticPage) for (var t in TOKENS) if (rec.vars['--' + t + '-l']) set('--' + t, rec.vars['--' + t + '-l']);
    root.dataset.siteTheme = rec.id;
    // <head> has no <body> yet on a saved theme's first paint, so wait for it.
    if (rec.id === 'terminal' && !staticPage){
      if (document.body) startRain(); else document.addEventListener('DOMContentLoaded', function(){ if (root.dataset.siteTheme === 'terminal') startRain(); });
    }
    if (rec.ground){ for (var g in rec.ground) set(g, rec.ground[g]); if (rec.ground['--sg-image']){ root.setAttribute('data-site-ground', ''); startGround(); } }
  }
  // The app's Osmium theme, for the parts the site's own CSS doesn't already carry: its dot-field ground
  // (styles.css, `html[data-theme="osmium"] #gallery`). Colours are the site defaults (index.html :root).
  var OSMIUM = {
    id: 'osmium',
    vars: { '--bg-base': '#f4f4f1', '--text-primary': '#141412', '--accent-auto': '#e14b3a', '--accent-manual': '#3b76d6',
      '--accent-flair': '#3f9d4f', '--accent-success': '#3f9d4f', '--accent-danger': '#c9372a', '--border-strong': '#b7b7ae' },
    ground: 'background-image:radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--text-primary) 8%, transparent) 1px, transparent 1.5px);background-size:26px 26px'
  };
  function paintOsmiumGround(){
    if (staticPage) return;
    var night = window.__dtsNightPalette(function(k){ return String(OSMIUM.vars[k] || '#000000').slice(0, 7); });
    var g = groundOf(OSMIUM, night);
    if (!g) return;
    for (var k in g) set(k, g[k]);
    root.setAttribute('data-site-ground', '');
    startGround();
  }
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}

  // Random theme on every landing-page load, painted synchronously so there is no flash. The theme list
  // is cached in localStorage (refreshed after every load), so the pick happens right here in <head>.
  // Only the landing page opts in (<html data-random-theme>); the guide and readme keep whatever is
  // current. Skipped when framed (the site editor's preview iframe, which starts on the last theme picked
  // there) or with ?keep-theme. A "seen" list makes it a shuffle: no theme repeats until all have been
  // shown, and the first theme of a new round is never the one that just ended the last. A manual pick
  // in the menu changes what the guide and readme show but doesn't disturb the shuffle.
  var CACHE_KEY = 'osmium-site-themes', SEEN_KEY = 'osmium-site-theme-seen';
  var randomize = root.hasAttribute('data-random-theme') && window.self === window.top && !/[?&]keep-theme/.test(location.search);
  function readJSON(k){ try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch(e){ return null; } }
  if (randomize){
    var all = readJSON(CACHE_KEY);
    if (all && all.length > 1){
      var seen = readJSON(SEEN_KEY) || [];
      var pool = all.filter(function(t){ return seen.indexOf(t.id) < 0; });
      if (!pool.length){
        // Every theme has had its turn: start a new round, keeping the last few out of its opening so the
        // one that just ran (or a near neighbour) doesn't come straight back.
        seen = seen.slice(-5);
        pool = all.filter(function(t){ return seen.indexOf(t.id) < 0; });
      }
      var pick = pool[Math.floor(Math.random() * pool.length)];
      seen.push(pick.id);
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch(e){}
      if (pick.id === 'osmium'){
        saved = null;
        try { localStorage.removeItem(KEY); } catch(e){}
      } else {
        saved = build(pick);
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch(e){}
      }
    } else if (!readJSON(SEEN_KEY)){
      // First visit: no list yet, so this load is plain Osmium; it counts as the round's first theme.
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(['osmium'])); } catch(e){}
    }
    // Keep the cached list fresh for the next load (and fill it on the first).
    window.addEventListener('load', function(){
      fetch('assets/themes.json').then(function(r){ return r.json(); }).then(function(list){
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch(e){}
      }).catch(function(){});
    });
  }
  // The guide and readme (data-static-theme) are long-form reading pages: they always keep the site's own
  // Osmium look and never wear a theme, whatever was picked or randomized on the landing page.
  if (staticPage) saved = null;
  // A record saved by an older build of this script can lack a token; drop it.
  if (saved && saved.vars && saved.vars['--ground-l'] && saved.ground) paint(saved); else { saved = null; paintOsmiumGround(); }

  window.OsmiumSiteTheme = {
    current: function(){ return saved; },
    // Apply (and remember) an app theme from themes.json; Osmium resets.
    use: function(theme){
      if (!theme || theme.id === 'osmium'){
        clear(); saved = null; paintOsmiumGround();
        try { localStorage.removeItem(KEY); } catch(e){}
        return null;
      }
      var rec = build(theme);
      paint(rec); saved = rec;
      try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch(e){}
      return rec;
    }
  };
})();
