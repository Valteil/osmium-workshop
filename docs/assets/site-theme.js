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
    for (var f in FACES) map[f] = v[FACES[f]];
    return { id: theme.id, name: theme.name, vars: map,
      swatch: [v['--bg-base'], v['--accent-manual'], v['--accent-flair']] };
  }
  function clear(){
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
  }
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch(e){}
  // A record saved by an older build of this script can lack a token; drop it.
  if (saved && saved.vars && saved.vars['--ground-l']) paint(saved); else saved = null;

  window.OsmiumSiteTheme = {
    current: function(){ return saved; },
    // Apply (and remember) an app theme from themes.json; Osmium resets.
    use: function(theme){
      if (!theme || theme.id === 'osmium'){
        clear(); saved = null;
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
