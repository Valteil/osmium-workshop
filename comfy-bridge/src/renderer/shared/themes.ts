// Theme palettes, ported verbatim from the Osmium Workshop desktop app's
// renderer/styles.css theme blocks (25 palettes: 4 free + 21 shop-tier).
// COLORS ONLY by design — the Bridge deliberately does not carry the
// shop economy's visual flourishes (textures/ambient animations/
// hover-fill effects); only the color set is mapped onto the Bridge's
// own CSS variables. Single source for BOTH shells: the desktop bundles
// this from TS, mobile gets it through shared.js (build:shared). Adding
// a theme = copy the palette here and both apps pick it up.
export interface ThemePalette { name: string; label: string; vars: Record<string, string>; }

const THEME_KEY = 'comfybridge-theme';
let palettes: ThemePalette[] = [];
let defaultTheme = 'studio';

function readSaved(): string {
  try { return localStorage.getItem(THEME_KEY) || defaultTheme; } catch { return defaultTheme; }
}

export function currentThemeName(): string {
  return document.documentElement.dataset.theme || readSaved();
}

export function initTheme(list: ThemePalette[], fallback = 'studio'): void {
  palettes = list;
  defaultTheme = fallback;
  applyTheme(readSaved());
}

export function applyTheme(name: string): void {
  const palette = palettes.find((t) => t.name === name) ||
    palettes.find((t) => t.name === defaultTheme) ||
    palettes[0];
  if (!palette) return;
  const s = document.documentElement.style;
  const v = palette.vars;
  s.setProperty('--bg', v['--bg-base']);
  s.setProperty('--panel', v['--bg-panel']);
  s.setProperty('--panel2', v['--bg-elevated']);
  s.setProperty('--panel3', v['--bg-elevated-2']);
  s.setProperty('--border', v['--border-soft']);
  s.setProperty('--border-strong', v['--border-strong']);
  s.setProperty('--text', v['--text-primary']);
  s.setProperty('--muted', v['--text-muted']);
  s.setProperty('--faint', v['--text-faint']);
  s.setProperty('--accent', v['--accent-manual']);
  s.setProperty('--accent-auto', v['--accent-auto']);
  s.setProperty('--accent-danger', v['--accent-danger']);
  s.setProperty('--accent-ok', v['--accent-success']);
  document.documentElement.dataset.theme = palette.name;
  try { localStorage.setItem(THEME_KEY, palette.name); } catch { /* best effort */ }
}

// Theme picker button + popover menu. The native <select>'s popup refused
// to expand in this Electron window, so this is a hand-rolled popover on
// desktop, and mobile reuses the same control shape. Closes on outside
// click / Escape; the current palette is marked in the list.
export function mountThemePicker(opts: { wrap: string; btn: string; btnLabel: string; menu: string }): void {
  const btn = document.getElementById(opts.btn) as HTMLButtonElement;
  const labelEl = document.getElementById(opts.btnLabel) as HTMLSpanElement;
  const menu = document.getElementById(opts.menu) as HTMLDivElement;
  if (!btn || !labelEl || !menu) return;
  function refresh(): void {
    const cur = palettes.find((t) => t.name === currentThemeName());
    labelEl.textContent = cur ? cur.label : 'Theme';
  }
  function buildMenu(): void {
    menu.innerHTML = '';
    const cur = currentThemeName();
    for (const t of palettes) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'theme-item' + (t.name === cur ? ' current' : '');
      item.textContent = t.label;
      item.addEventListener('click', () => {
        applyTheme(t.name);
        menu.hidden = true;
        refresh();
      });
      menu.appendChild(item);
    }
  }
  btn.addEventListener('click', () => {
    if (!menu.hidden) { menu.hidden = true; return; }
    buildMenu();
    menu.hidden = false;
  });
  document.addEventListener('click', (ev) => {
    const wrap = document.getElementById(opts.wrap);
    if (!menu.hidden && wrap && !wrap.contains(ev.target as Node)) menu.hidden = true;
  });
  menu.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') menu.hidden = true; });
  refresh();
}
