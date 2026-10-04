/* Applies the saved theme before first paint, so opening the Bridge never
   flashes the default Osmium palette before initTheme() runs in app.js.
   Palette data is renderer/theme-data.js (generated from the shared
   src/renderer/shared/theme-data.ts by build:renderer); the var mapping below
   mirrors applyTheme() in shared/themes.ts — if that mapping changes, change
   this too. External, not inline, so script-src 'self' needs no hashes (the
   main app's CRLF-vs-LF hash mismatch showed that's easy to get wrong). */
(function () {
  try {
    var root = document.documentElement;
    var name = localStorage.getItem('comfybridge-theme') || 'studio';
    if (name === 'custom') {
      var custom = JSON.parse(localStorage.getItem('comfybridge-custom-theme') || 'null');
      if (custom) {
        for (var ck in custom) if (ck.indexOf('--') === 0 && custom[ck]) root.style.setProperty(ck, custom[ck]);
        if (custom['--c-fx-on'] === '1') root.classList.add('bridge-fx');
      }
      root.setAttribute('data-theme', 'custom');
      window.__bridgePreThemed = true;
      return;
    }
    var data = window.BridgeThemeData || {};
    var themes = data.THEMES || [];
    var p = null, i;
    for (i = 0; i < themes.length; i++) if (themes[i].name === name) { p = themes[i]; break; }
    if (!p) { name = data.DEFAULT_THEME || 'studio'; for (i = 0; i < themes.length; i++) if (themes[i].name === name) { p = themes[i]; break; } }
    if (!p) return;
    var v = p.vars, set = function (k, val) { if (val) root.style.setProperty(k, val); };
    set('--bg', v['--bg-base']); set('--panel', v['--bg-panel']);
    set('--panel2', v['--bg-elevated']); set('--panel3', v['--bg-elevated-2']);
    set('--border', v['--border-soft']); set('--border-strong', v['--border-strong']);
    set('--text', v['--text-primary']); set('--muted', v['--text-muted']); set('--faint', v['--text-faint']);
    set('--accent', v['--accent-manual']); set('--accent-auto', v['--accent-auto']);
    set('--accent-danger', v['--accent-danger']); set('--accent-ok', v['--accent-success']);
    set('--accent-flair', v['--accent-flair']);
    set('--sans', v['--sans']); set('--mono', v['--mono']);
    set('--display', v['--display']); set('--head-font', v['--head-font']);
    root.setAttribute('data-theme', p.name || name);
    window.__bridgePreThemed = true;
  } catch (e) { /* worst case: one flash of the default palette */ }
})();
