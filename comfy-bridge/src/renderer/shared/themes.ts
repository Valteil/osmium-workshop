// Theme palettes, ported verbatim from the Osmium Workshop desktop app's
// renderer/styles.css theme blocks (25 palettes: 4 free + 21 shop-tier).
// The palettes are COLORS ONLY: the Bridge doesn't carry the shop economy's
// per-theme flourishes. The one exception is Custom, built in the desktop
// shell's Theme Studio (src/renderer/theme-studio.ts), which also sets faces,
// shapes, a button fill and surfaces — saved as a compiled var map under
// CUSTOM_VARS_KEY and applied here like a palette. Single source for BOTH
// shells: the desktop bundles this from TS, mobile gets it through shared.js
// (build:shared), so a Custom saved on desktop storage would apply on mobile
// too; only the desktop shell can edit one.
export interface ThemePalette { name: string; label: string; vars: Record<string, string>; }

const THEME_KEY = 'comfybridge-theme';
export const CUSTOM_VARS_KEY = 'comfybridge-custom-theme';
export const CUSTOM_SPEC_KEY = 'comfybridge-custom-theme-spec';
let palettes: ThemePalette[] = [];
let defaultTheme = 'studio';

// Every var a Custom theme may set beyond a palette's colors (the Studio's
// compileBridge filters to this list, so clearing it clears all of it).
export const CUSTOM_EXTRA_KEYS = [
  '--accent-flair', '--accent-manual-dim', '--accent-auto-dim',
  '--sans', '--mono', '--display', '--head-font',
  '--brand-size', '--brand-case', '--brand-track', '--head-case', '--head-track',
  '--btn-weight', '--btn-case', '--btn-track',
  '--r-ctl', '--r-field', '--r-panel',
  '--fx-fill', '--fx-o', '--fx-top', '--fx-h', '--fx-w',
  '--mat', '--c-ground', '--c-pad-bg', '--c-pad-shadow', '--c-top-border', '--c-top-bimg',
  '--c-pri-bg', '--c-pri-fg', '--c-pri-bd', '--c-pri-hover', '--c-fx-on'
];
const PALETTE_KEYS = ['--bg', '--panel', '--panel2', '--panel3', '--border', '--border-strong', '--text', '--muted', '--faint',
  '--accent', '--accent-auto', '--accent-danger', '--accent-ok'];

function readSaved(): string {
  try { return localStorage.getItem(THEME_KEY) || defaultTheme; } catch { return defaultTheme; }
}

export function readCustomVars(): Record<string, string> | null {
  try { return JSON.parse(localStorage.getItem(CUSTOM_VARS_KEY) || 'null'); } catch { return null; }
}
export function customThemeName(): string {
  try { const s = JSON.parse(localStorage.getItem(CUSTOM_SPEC_KEY) || 'null'); return s && s.name ? String(s.name) : 'Custom'; } catch { return 'Custom'; }
}

export function currentThemeName(): string {
  return document.documentElement.dataset.theme || readSaved();
}

export function themePalettes(): ThemePalette[] { return palettes; }

export function initTheme(list: ThemePalette[], fallback = 'studio'): void {
  palettes = list;
  defaultTheme = fallback;
  applyTheme(readSaved());
}

export function applyTheme(name: string): void {
  const root = document.documentElement;
  const s = root.style;
  for (const k of CUSTOM_EXTRA_KEYS) s.removeProperty(k);
  root.classList.remove('bridge-fx');
  const custom = name === 'custom' ? readCustomVars() : null;
  if (custom){
    for (const k of PALETTE_KEYS) s.removeProperty(k);
    for (const [k, v] of Object.entries(custom)) if (k.startsWith('--') && v) s.setProperty(k, v);
    root.classList.toggle('bridge-fx', custom['--c-fx-on'] === '1');
    root.dataset.theme = 'custom';
    try { localStorage.setItem(THEME_KEY, 'custom'); } catch { /* best effort */ }
    return;
  }
  const palette = palettes.find((t) => t.name === name) ||
    palettes.find((t) => t.name === defaultTheme) ||
    palettes[0];
  if (!palette) return;
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
  if (v['--accent-flair']) s.setProperty('--accent-flair', v['--accent-flair']);
  root.dataset.theme = palette.name;
  try { localStorage.setItem(THEME_KEY, palette.name); } catch { /* best effort */ }
}

// Theme picker button + popover menu. The native <select>'s popup refused
// to expand in this Electron window, so this is a hand-rolled popover on
// desktop, and mobile reuses the same control shape. Closes on outside
// click / Escape; the current palette is marked in the list. A saved Custom
// theme is listed by its Studio name; `onStudio` (desktop only) adds a
// "Theme Studio…" entry at the end.
export function mountThemePicker(opts: { wrap: string; btn: string; btnLabel: string; menu: string; onStudio?: () => void }): { refresh: () => void } {
  const btn = document.getElementById(opts.btn) as HTMLButtonElement;
  const labelEl = document.getElementById(opts.btnLabel) as HTMLSpanElement;
  const menu = document.getElementById(opts.menu) as HTMLDivElement;
  if (!btn || !labelEl || !menu) return { refresh: () => {} };
  function refresh(): void {
    const name = currentThemeName();
    if (name === 'custom'){ labelEl.textContent = customThemeName(); return; }
    const cur = palettes.find((t) => t.name === name);
    labelEl.textContent = cur ? cur.label : 'Theme';
  }
  function item(label: string, current: boolean, onPick: () => void, extra = ''): void {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'theme-item' + (current ? ' current' : '') + (extra ? ' ' + extra : '');
    el.textContent = label;
    el.addEventListener('click', () => { onPick(); menu.hidden = true; refresh(); });
    menu.appendChild(el);
  }
  function buildMenu(): void {
    menu.innerHTML = '';
    const cur = currentThemeName();
    for (const t of palettes) item(t.label, t.name === cur, () => applyTheme(t.name));
    if (readCustomVars()) item(customThemeName(), cur === 'custom', () => applyTheme('custom'), 'theme-item-custom');
    if (opts.onStudio){
      const studio = opts.onStudio;
      item('Theme Studio…', false, () => studio(), 'theme-item-studio');
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
  return { refresh };
}
