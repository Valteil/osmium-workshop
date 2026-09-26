// Theme Studio for Comfy Bridge (desktop shell only) — the Bridge's port of
// Osmium Workshop's Studio (src/renderer/theme-studio.ts at the repo root).
// Same dim-screen layout: scrolling editor on the left, a live miniature of
// the real window on the right with a view switcher under it.
//
// The model is the shared theme-spec.ts (a GENERATED copy — edit the root
// file and run scripts/sync-theme-spec.js), so a theme exported from either
// app imports into the other. compileBridge maps the spec's Osmium var names
// onto the Bridge's; the Bridge surfaces what it has (no tags, cards, image
// mats or tab strip), and it has no Edibits economy, so every effect is free.
//
// Preview: an about:blank iframe holding a static clone of #app plus the
// Bridge's stylesheets — the draft's vars live only there. "Views" zoom onto
// one column by shrinking the iframe's viewport height (so the column still
// scrolls) and scaling it to the stage.
import {
  type ThemeSpec, type FontDef, type Opt, FONTS, fontStack, SHAPES, TINTS, T, FILLS, INK, PATTERNS, PADS, TOPBARS,
  PRIMARIES, COLOR_GROUPS, CONTRAST, HEX_RE, SPEC_COLOR_KEYS, THEME_FILE_KIND,
  defaultSpec, normalizeSpec, compileSpec, luminance, contrast, mixHex, hex6
} from './theme-spec';
import {
  applyTheme, themePalettes, currentThemeName, readCustomVars,
  CUSTOM_VARS_KEY, CUSTOM_SPEC_KEY, CUSTOM_EXTRA_KEYS
} from './shared';

const PALETTE_KEYS = ['--bg', '--panel', '--panel2', '--panel3', '--border', '--border-strong', '--text', '--muted', '--faint',
  '--accent', '--accent-auto', '--accent-danger', '--accent-ok'];
const RENAME: Record<string, string> = {
  '--bg-base': '--bg', '--bg-panel': '--panel', '--bg-elevated': '--panel2', '--bg-elevated-2': '--panel3',
  '--border-soft': '--border', '--text-primary': '--text', '--text-muted': '--muted', '--text-faint': '--faint',
  '--accent-manual': '--accent', '--accent-success': '--accent-ok',
};
const ALLOWED = new Set([...PALETTE_KEYS, ...CUSTOM_EXTRA_KEYS]);

// Spec -> the Bridge's var map. Surfaces step down one level: the Bridge's
// sections sit on the page ground, where the main app's docks sit on a panel.
export function compileBridge(spec: ThemeSpec): Record<string, string> {
  const src = compileSpec(spec);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src)){
    const key = RENAME[k] || k;
    if (ALLOWED.has(key)) out[key] = v;
  }
  const down = (s: string) => s.replace(/var\(--bg-elevated-2\)/g, 'var(--panel2)')
    .replace(/var\(--bg-elevated\)/g, 'var(--panel)').replace(/var\(--bg-panel\)/g, 'var(--bg)');
  if (out['--c-pad-bg']) out['--c-pad-bg'] = down(out['--c-pad-bg']);
  if (out['--c-pad-shadow']) out['--c-pad-shadow'] = down(out['--c-pad-shadow']);
  const first = parseFloat(spec.shape.ctl) || 0;
  out['--r-field'] = /^\d+(\.\d+)?px$/.test(spec.shape.ctl) ? Math.min(first, 10) + 'px' : '6px';
  out['--c-fx-on'] = spec.fx.fill !== 'none' ? '1' : '0';
  return out;
}

export function loadSavedSpec(): ThemeSpec {
  try {
    const raw = localStorage.getItem(CUSTOM_SPEC_KEY);
    if (raw) return normalizeSpec(JSON.parse(raw));
  } catch { /* fall through */ }
  return defaultSpec();
}

// A palette (colors only) as a spec: its colors over Studio's grammar, with
// the two tints the Bridge palettes don't carry derived from their accents.
function specFromPalette(vars: Record<string, string>, label: string): ThemeSpec {
  const d = defaultSpec();
  const colors: Record<string, string> = { ...d.colors };
  for (const k of SPEC_COLOR_KEYS) if (vars[k] && HEX_RE.test(vars[k])) colors[k] = vars[k].toLowerCase();
  const panel = colors['--bg-panel'];
  const light = luminance(panel) > 0.4;
  colors['--accent-manual-dim'] = mixHex(panel, colors['--accent-manual'], light ? 0.16 : 0.22);
  colors['--accent-auto-dim'] = mixHex(panel, colors['--accent-auto'], light ? 0.16 : 0.22);
  return normalizeSpec({ ...d, name: `${label} remix`, colors });
}

// The Bridge has no icon sprite; the Studio's handful of glyphs inline here.
const ICONS: Record<string, string> = {
  upload: '<path d="M12 16V5M7 9.5l5-5 5 5"/><path d="M5 20h14"/>',
  download: '<path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M5 20h14"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  rotate: '<path d="M4 4.5v5h5"/><path d="M4.6 9.5A8 8 0 1 1 4 13"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.9 1.8-1.8 0-1.3-1-1.7-1-2.7 0-.9.7-1.5 1.6-1.5H16a5 5 0 0 0 5-5C21 6.3 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
  caret: '<path d="M7 10l5 5 5-5"/>',
  wand: '<path d="M4 20L15 9M14 4v3M18.5 5.5l-2 2M20 10h-3"/>',
};
function icon(id: string, cls = ''): string {
  return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[id] || ''}</svg>`;
}
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

type View = 'window' | 'left' | 'mid' | 'right';
const VIEWS: { id: View; label: string }[] = [
  { id: 'window', label: 'Whole window' },
  { id: 'left', label: 'Connection & models' },
  { id: 'mid', label: 'Prompt' },
  { id: 'right', label: 'Generate' },
];

let isOpen = false;

export function openThemeStudio(opts: { onSaved: () => void }): void {
  if (isOpen) return;
  isOpen = true;
  let spec: ThemeSpec = loadSavedSpec();
  let dirty = false;
  let view: View = 'window';

  const backdrop = document.createElement('div');
  backdrop.className = 'ts-backdrop';
  const box = document.createElement('div');
  box.className = 'ts-box';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'tsTitle');
  box.tabIndex = -1;
  backdrop.appendChild(box);
  box.innerHTML = `
    <header class="ts-head">
      <div class="ts-title-block">
        <h2 id="tsTitle" class="ts-title">Theme Studio</h2>
        <input class="ts-name" type="text" maxlength="40" spellcheck="false" aria-label="Theme name" placeholder="Name your theme">
      </div>
      <div class="ts-head-actions">
        <button type="button" class="ts-import" title="Load a theme file (from Comfy Bridge or Osmium Workshop)">${icon('upload', 'ic-lead')}Import</button>
        <button type="button" class="ts-export" title="Save this theme to a file you can share">${icon('download', 'ic-lead')}Export</button>
        <button type="button" class="ts-close" title="Close (Esc)" aria-label="Close">${icon('x')}</button>
      </div>
    </header>
    <div class="ts-edit"><nav class="ts-jump" aria-label="Sections"></nav><div class="ts-sections"></div></div>
    <div class="ts-stage">
      <div class="ts-stage-frame"><div class="ts-frame-wrap"><iframe class="ts-frame" title="Live preview" tabindex="-1"></iframe></div></div>
      <div class="ts-preview-tabs" role="tablist" aria-label="Preview view"></div>
      <div class="ts-stage-note">Live preview. Hover the miniature to try buttons; scroll a column to see the rest of it.</div>
    </div>
    <footer class="ts-foot">
      <button type="button" class="ts-reset" title="Start over from the Studio default look">${icon('rotate', 'ic-lead')}Reset to Studio</button>
      <span class="ts-dirty" aria-live="polite"></span>
      <div class="ts-foot-actions">
        <button type="button" class="ts-cancel">Cancel</button>
        <button type="button" class="ts-save primary">Save &amp; apply</button>
      </div>
      <div class="ts-confirm" role="alert">
        <span class="ts-confirm-msg">Discard your unsaved theme changes?</span>
        <button type="button" class="ts-keep">Keep editing</button>
        <button type="button" class="ts-discard ts-danger">Discard</button>
      </div>
    </footer>`;

  const q = <E extends HTMLElement>(sel: string) => box.querySelector<E>(sel)!;
  const nameInput = q<HTMLInputElement>('.ts-name');
  const sectionsEl = q('.ts-sections');
  const jumpEl = q('.ts-jump');
  const editEl = q('.ts-edit');
  const stageFrame = q('.ts-stage-frame');
  const frameWrap = q('.ts-frame-wrap');
  const frame = q<HTMLIFrameElement>('.ts-frame');
  const tabsEl = q('.ts-preview-tabs');
  const dirtyEl = q('.ts-dirty');
  const foot = q('.ts-foot');
  let statusTimer: ReturnType<typeof setTimeout> | null = null;
  function status(msg: string, ms = 3200): void {
    dirtyEl.textContent = msg;
    if (statusTimer) clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { dirtyEl.textContent = dirty ? 'Unsaved changes' : ''; }, ms);
  }

  // ------------------------------------------------------------ preview

  let pdoc: Document | null = null;
  let appliedKeys: string[] = [];
  const W = Math.max(1100, window.innerWidth), H = Math.max(680, window.innerHeight);
  frame.style.width = W + 'px';
  frame.style.height = H + 'px';

  function fitFrame(): void {
    const r = stageFrame.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const col = view !== 'window' && pdoc ? pdoc.getElementById(view) : null;
    if (!col){
      frame.style.height = H + 'px';
      const s = Math.min(r.width / W, r.height / H);
      frame.style.transform = `scale(${s})`;
      frameWrap.style.width = Math.round(W * s) + 'px';
      frameWrap.style.height = Math.round(H * s) + 'px';
      return;
    }
    const pad = 12;
    const cr = col.getBoundingClientRect();
    const cw = cr.width + pad * 2;
    const s = Math.min(r.width / cw, 1.6);
    const vh = Math.floor(r.height / s);
    frame.style.height = vh + 'px';
    frame.style.transform = `scale(${s}) translateX(${-(cr.left - pad)}px)`;
    frameWrap.style.width = Math.round(cw * s) + 'px';
    frameWrap.style.height = Math.round(vh * s) + 'px';
  }
  const resizeObs = new ResizeObserver(fitFrame);
  resizeObs.observe(stageFrame);

  function buildPreviewDoc(): void {
    const doc = frame.contentDocument;
    if (!doc) return;
    const app = document.getElementById('app')!.cloneNode(true) as HTMLElement;
    app.querySelectorAll<HTMLElement>('#themeMenu').forEach(el => el.hidden = true);
    const base = document.baseURI.replace(/"/g, '%22');
    doc.open();
    doc.write(`<!DOCTYPE html><html data-theme="custom"><head><meta charset="utf-8"><base href="${base}">
      <link rel="stylesheet" href="fonts/fonts.css"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="shared.css">
      <style>*{cursor:default !important}</style></head><body>${app.outerHTML}</body></html>`);
    doc.close();
    pdoc = doc;
    for (const type of ['click', 'mousedown', 'dblclick', 'contextmenu', 'keydown', 'submit', 'dragstart', 'auxclick']){
      doc.addEventListener(type, (ev) => { ev.preventDefault(); ev.stopPropagation(); }, true);
    }
    doc.querySelectorAll('input, textarea, select, button, details, summary').forEach(el => el.setAttribute('tabindex', '-1'));
    applyDraft();
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      fitFrame();
      frameWrap.classList.add('ts-ready');
    };
    const sheet = doc.querySelector<HTMLLinkElement>('link[href="styles.css"]');
    if (sheet && !sheet.sheet) sheet.addEventListener('load', reveal, { once: true }); else reveal();
    setTimeout(reveal, 1500);
  }

  function showView(v: View, animate = true): void {
    view = v;
    tabsEl.querySelectorAll<HTMLButtonElement>('.ts-ptab').forEach(b => {
      const on = b.dataset.view === v;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    if (!animate){ fitFrame(); return; }
    frameWrap.classList.add('ts-switching');
    setTimeout(() => { fitFrame(); frameWrap.classList.remove('ts-switching'); }, 110);
  }

  let draftQueued = false;
  function applyDraft(): void {
    if (draftQueued) return;
    draftQueued = true;
    requestAnimationFrame(() => {
      draftQueued = false;
      const vars = compileBridge(spec);
      if (pdoc){
        const st = pdoc.documentElement.style;
        for (const k of appliedKeys) if (!(k in vars)) st.removeProperty(k);
        for (const [k, val] of Object.entries(vars)) st.setProperty(k, val);
        appliedKeys = Object.keys(vars);
        pdoc.documentElement.classList.toggle('bridge-fx', vars['--c-fx-on'] === '1');
      }
      box.querySelectorAll<HTMLElement>('.ts-sample').forEach(el => {
        for (const k of SPEC_COLOR_KEYS) el.style.setProperty(k, spec.colors[k]);
        el.style.setProperty('--c-tint', `var(--accent-${spec.fx.tint})`);
      });
    });
  }

  // ------------------------------------------------------------ editor

  const syncers: (() => void)[] = [];
  function syncAll(): void { nameInput.value = spec.name; syncers.forEach(fn => fn()); applyDraft(); }
  function changed(): void {
    dirty = true;
    dirtyEl.textContent = 'Unsaved changes';
    syncers.forEach(fn => fn());
    applyDraft();
  }

  function section(id: string, title: string, lede: string): HTMLElement {
    const sec = document.createElement('section');
    sec.className = 'ts-section';
    sec.id = 'ts-sec-' + id;
    sec.innerHTML = `<h3 class="ts-sec-title">${esc(title)}</h3><p class="ts-sec-lede">${esc(lede)}</p>`;
    sectionsEl.appendChild(sec);
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.className = 'ts-jump-btn';
    jump.textContent = title;
    jump.dataset.sec = sec.id;
    jump.addEventListener('click', () => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      editEl.scrollTo({ top: sec.offsetTop - jumpEl.offsetHeight - 6, behavior: reduce ? 'auto' : 'smooth' });
    });
    jumpEl.appendChild(jump);
    return sec;
  }
  function field(parent: HTMLElement, label: string, hint?: string): HTMLElement {
    const f = document.createElement('div');
    f.className = 'ts-field';
    f.innerHTML = `<div class="ts-field-label">${esc(label)}${hint ? `<span class="ts-field-hint">${esc(hint)}</span>` : ''}</div>`;
    parent.appendChild(f);
    return f;
  }
  function optionGrid<O extends Opt>(parent: HTMLElement, label: string, opts: O[], get: () => string, set: (id: string) => void,
    sample: (o: O) => string, cls = '', hint?: string): void {
    const f = field(parent, label, hint);
    const grid = document.createElement('div');
    grid.className = 'ts-opts ' + cls;
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', label);
    for (const o of opts){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ts-opt';
      b.dataset.id = o.id;
      b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="ts-sample">${sample(o)}</span><span class="ts-opt-label">${esc(o.label)}</span>`;
      b.addEventListener('click', () => { set(o.id); changed(); });
      grid.appendChild(b);
    }
    f.appendChild(grid);
    syncers.push(() => {
      const cur = get();
      grid.querySelectorAll<HTMLButtonElement>('.ts-opt').forEach(b => {
        const on = b.dataset.id === cur;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', String(on));
      });
    });
  }
  function segmented(parent: HTMLElement, label: string, opts: { id: string; label: string }[], get: () => string, set: (id: string) => void): void {
    const f = field(parent, label);
    const seg = document.createElement('div');
    seg.className = 'ts-seg';
    seg.setAttribute('role', 'radiogroup');
    seg.setAttribute('aria-label', label);
    for (const o of opts){
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.id = o.id;
      b.textContent = o.label;
      b.setAttribute('role', 'radio');
      b.addEventListener('click', () => { set(o.id); changed(); });
      seg.appendChild(b);
    }
    f.appendChild(seg);
    syncers.push(() => {
      const cur = get();
      seg.querySelectorAll<HTMLButtonElement>('button').forEach(b => {
        b.classList.toggle('on', b.dataset.id === cur);
        b.setAttribute('aria-checked', String(b.dataset.id === cur));
      });
    });
  }
  function slider(parent: HTMLElement, label: string, min: number, max: number, get: () => number, set: (n: number) => void): void {
    const f = field(parent, label);
    const row = document.createElement('div');
    row.className = 'ts-slider';
    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min); input.max = String(max); input.step = '1';
    input.setAttribute('aria-label', label);
    const out = document.createElement('output');
    input.addEventListener('input', () => { set(Number(input.value)); changed(); });
    row.append(input, out);
    f.appendChild(row);
    syncers.push(() => { const n = get(); input.value = String(n); out.textContent = n + 'px'; });
  }
  function toggle(parent: HTMLElement, label: string, get: () => boolean, set: (on: boolean) => void): void {
    const row = document.createElement('label');
    row.className = 'ts-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = label;
    cb.addEventListener('change', () => { set(cb.checked); changed(); });
    row.append(cb, span);
    parent.appendChild(row);
    syncers.push(() => { cb.checked = get(); });
  }

  let openPopover: { el: HTMLElement; anchor: HTMLElement } | null = null;
  function closePopover(): void {
    if (!openPopover) return;
    openPopover.anchor.setAttribute('aria-expanded', 'false');
    openPopover.el.remove();
    openPopover = null;
  }
  box.addEventListener('mousedown', (ev) => {
    if (!openPopover) return;
    const t = ev.target as Node;
    if (openPopover.el.contains(t) || openPopover.anchor.contains(t)) return;
    closePopover();
  }, true);

  function fontPicker(parent: HTMLElement, label: string, slot: keyof ThemeSpec['fonts']): void {
    const f = field(parent, label);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ts-font-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    f.appendChild(btn);
    const kind = slot === 'mono' ? 'mono' : 'ui';
    syncers.push(() => {
      const name = spec.fonts[slot];
      btn.innerHTML = `<span class="ts-font-face">${esc(name || 'System')}</span>${icon('caret', 'ts-font-caret')}`;
      (btn.firstElementChild as HTMLElement).style.fontFamily = fontStack(name, kind);
    });
    btn.addEventListener('click', () => {
      if (openPopover && openPopover.anchor === btn){ closePopover(); return; }
      closePopover();
      const pop = document.createElement('div');
      pop.className = 'ts-font-pop';
      pop.setAttribute('role', 'listbox');
      pop.setAttribute('aria-label', label);
      const groups: [string, FontDef['kind'] | 'system'][] = slot === 'mono'
        ? [['Mono', 'mono'], ['Sans', 'sans'], ['Serif', 'serif'], ['Display', 'display'], ['System', 'system']]
        : [['Sans', 'sans'], ['Serif', 'serif'], ['Display', 'display'], ['Mono', 'mono'], ['System', 'system']];
      for (const [title, k] of groups){
        const h = document.createElement('div');
        h.className = 'ts-font-group';
        h.textContent = title;
        pop.appendChild(h);
        const names = k === 'system' ? [''] : FONTS.filter(ft => ft.kind === k).map(ft => ft.name);
        for (const name of names){
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'ts-font-item' + (spec.fonts[slot] === name ? ' on' : '');
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', String(spec.fonts[slot] === name));
          item.textContent = name || (slot === 'mono' ? 'System mono' : 'System UI');
          item.style.fontFamily = fontStack(name, kind);
          item.addEventListener('click', () => { spec.fonts[slot] = name; changed(); closePopover(); btn.focus(); });
          pop.appendChild(item);
        }
      }
      f.appendChild(pop);
      btn.setAttribute('aria-expanded', 'true');
      openPopover = { el: pop, anchor: btn };
      const on = pop.querySelector<HTMLElement>('.ts-font-item.on');
      if (on) pop.scrollTop = on.offsetTop - pop.clientHeight / 2 + on.offsetHeight / 2;
      requestAnimationFrame(() => pop.classList.add('in'));
      (on || pop.querySelector<HTMLElement>('.ts-font-item'))?.focus({ preventScroll: true });
    });
  }

  function colorRow(parent: HTMLElement, key: string, label: string): void {
    const row = document.createElement('div');
    row.className = 'ts-color';
    const swatch = document.createElement('label');
    swatch.className = 'ts-swatch';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.setAttribute('aria-label', label + ' color');
    swatch.appendChild(picker);
    const name = document.createElement('span');
    name.className = 'ts-color-name';
    name.textContent = label;
    const hex = document.createElement('input');
    hex.type = 'text';
    hex.className = 'ts-hex';
    hex.spellcheck = false;
    hex.maxLength = 9;
    hex.setAttribute('aria-label', label + ' hex value');
    const badge = document.createElement('span');
    badge.className = 'ts-contrast';
    row.append(swatch, name, badge, hex);
    parent.appendChild(row);
    picker.addEventListener('input', () => {
      const cur = spec.colors[key];
      spec.colors[key] = cur.length === 9 ? picker.value + cur.slice(7) : picker.value;
      changed();
    });
    hex.addEventListener('input', () => {
      let v = hex.value.trim();
      if (v && v[0] !== '#') v = '#' + v;
      const ok = HEX_RE.test(v);
      hex.classList.toggle('bad', !ok);
      if (ok){ spec.colors[key] = v.toLowerCase(); changed(); }
    });
    hex.addEventListener('blur', () => { hex.classList.remove('bad'); hex.value = spec.colors[key]; });
    syncers.push(() => {
      const v = spec.colors[key];
      picker.value = hex6(v);
      swatch.style.setProperty('--sw', v);
      if (document.activeElement !== hex) hex.value = v;
      const rule = CONTRAST[key];
      if (rule){
        const ratio = contrast(v, spec.colors[rule.against]);
        badge.textContent = ratio.toFixed(1) + ':1';
        badge.classList.toggle('low', ratio < rule.floor);
        badge.title = ratio < rule.floor ? `Below ${rule.floor}:1: hard to read` : 'Contrast';
      }
    });
  }

  // ---- Start from: every palette in the Bridge's list.
  const secStart = section('start', 'Start from', 'Copy any palette as a starting point, then change whatever you like.');
  const presetGrid = document.createElement('div');
  presetGrid.className = 'ts-presets';
  secStart.appendChild(presetGrid);
  for (const p of themePalettes()){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ts-preset';
    b.title = `Start from ${p.label}`;
    const sw = [p.vars['--bg-base'], p.vars['--bg-panel'], p.vars['--accent-manual'], p.vars['--accent-flair']];
    b.innerHTML = `<span class="ts-preset-sw">${sw.map(c => `<i style="background:${esc(c || 'transparent')}"></i>`).join('')}</span><span class="ts-preset-name">${esc(p.label)}</span>`;
    b.addEventListener('click', () => { spec = specFromPalette(p.vars, p.label); changed(); nameInput.value = spec.name; status(`Started from ${p.label}.`); });
    presetGrid.appendChild(b);
  }

  // ---- Colors
  const secColors = section('colors', 'Colors', 'The same sixteen roles as Osmium Workshop. Hex accepts #rgb, #rrggbb and #rrggbbaa.');
  for (const g of COLOR_GROUPS){
    const sub = document.createElement('div');
    sub.className = 'ts-color-group';
    sub.innerHTML = `<div class="ts-sub-title">${esc(g.title)}</div>`;
    for (const [k, l] of g.keys) colorRow(sub, k, l);
    secColors.appendChild(sub);
  }
  const tintBtn = document.createElement('button');
  tintBtn.type = 'button';
  tintBtn.className = 'ts-link-btn';
  tintBtn.innerHTML = `${icon('wand', 'ic-lead')}Match tints to accents`;
  tintBtn.addEventListener('click', () => {
    const panel = spec.colors['--bg-panel'];
    const light = luminance(panel) > 0.4;
    spec.colors['--accent-manual-dim'] = mixHex(panel, spec.colors['--accent-manual'], light ? 0.16 : 0.22);
    spec.colors['--accent-auto-dim'] = mixHex(panel, spec.colors['--accent-auto'], light ? 0.16 : 0.22);
    changed();
  });
  secColors.appendChild(tintBtn);

  // ---- Type
  const secType = section('type', 'Type', 'Bundled faces only, so a theme looks the same on every machine.');
  const fontGrid = document.createElement('div');
  fontGrid.className = 'ts-font-grid';
  secType.appendChild(fontGrid);
  fontPicker(fontGrid, 'Interface', 'ui');
  fontPicker(fontGrid, 'App title', 'display');
  fontPicker(fontGrid, 'Section titles', 'head');
  fontPicker(fontGrid, 'Log & terminal', 'mono');
  slider(secType, 'Title size', 12, 28, () => spec.type.brandSize, n => { spec.type.brandSize = n; });
  segmented(secType, 'Button weight', [{ id: '400', label: 'Regular' }, { id: '500', label: 'Medium' }, { id: '600', label: 'Semibold' }, { id: '700', label: 'Bold' }],
    () => String(spec.type.btnWeight), id => { spec.type.btnWeight = Number(id); });
  const capsField = field(secType, 'Capitals', 'Tracked out automatically');
  const capsWrap = document.createElement('div');
  capsWrap.className = 'ts-toggles';
  capsField.appendChild(capsWrap);
  toggle(capsWrap, 'Section titles', () => spec.type.capsHeads, on => { spec.type.capsHeads = on; });
  toggle(capsWrap, 'Buttons', () => spec.type.capsButtons, on => { spec.type.capsButtons = on; });
  toggle(capsWrap, 'App title', () => spec.type.capsBrand, on => { spec.type.capsBrand = on; });

  // ---- Shape
  const secShape = section('shape', 'Shape', 'Fields follow the button shape, capped so text boxes stay text boxes.');
  optionGrid(secShape, 'Buttons', SHAPES, () => (SHAPES.find(o => o.r === spec.shape.ctl) || { id: '' }).id,
    id => { spec.shape.ctl = SHAPES.find(o => o.id === id)!.r; },
    o => `<span class="ts-s-btn" style="border-radius:${o.r}">Test</span>`, 'ts-opts-shape');
  slider(secShape, 'Sections', 0, 28, () => Math.round(parseFloat(spec.shape.panel) || 0), n => { spec.shape.panel = n + 'px'; });

  // ---- Effects
  const secFx = section('effects', 'Effects', 'A fill that plays when the pointer is over a button.');
  optionGrid(secFx, 'Button fill', FILLS, () => spec.fx.fill === 'preset' ? '' : spec.fx.fill, id => { spec.fx.fill = id; },
    o => `<span class="ts-s-fill"><span class="ts-s-fill-bar" style="width:${Number(o.w) * 100}%;background:${o.fill.split(T).join('var(--c-tint)')};opacity:${o.id === 'none' ? 0 : Math.max(Number(o.o), 0.3)};top:${o.top};height:${o.h}"></span><span class="ts-s-fill-txt">Hover</span></span>`,
    'ts-opts-fill');
  segmented(secFx, 'Fill color', TINTS, () => spec.fx.tint, id => { spec.fx.tint = id; });

  // ---- Surfaces
  const secSurf = section('surfaces', 'Surfaces', 'What sits behind the controls.');
  optionGrid(secSurf, 'Section pads', PADS, () => spec.surface.pad, id => { spec.surface.pad = id; },
    o => `<span class="ts-s-pad" style="background:${o.bg};box-shadow:${o.shadow}"><i></i><i></i></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Window ground', PATTERNS, () => spec.surface.ground, id => { spec.surface.ground = id; },
    o => `<span class="ts-s-pat" style="background:${o.css.split(INK).join('color-mix(in srgb, var(--text-primary) 14%, transparent)')}, var(--bg-base)"></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Top bar edge', TOPBARS, () => spec.surface.topbar, id => { spec.surface.topbar = id; },
    o => `<span class="ts-s-top" style="border-bottom:${o.border};border-image:${o.bimg}"></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Generate button', PRIMARIES, () => spec.surface.primary, id => { spec.surface.primary = id; },
    o => `<span class="ts-s-btn" style="background:${o.bg};color:${o.fg};border-color:${o.bd}">Generate</span>`, 'ts-opts-compact');

  const secEls = Array.from(sectionsEl.querySelectorAll<HTMLElement>('.ts-section'));
  function syncJump(): void {
    const top = editEl.scrollTop + jumpEl.offsetHeight + 24;
    let cur = secEls[0];
    for (const s of secEls) if (s.offsetTop <= top) cur = s;
    if (editEl.scrollTop + editEl.clientHeight >= editEl.scrollHeight - 4) cur = secEls[secEls.length - 1];
    jumpEl.querySelectorAll<HTMLElement>('.ts-jump-btn').forEach(b => b.classList.toggle('on', b.dataset.sec === cur.id));
  }
  editEl.addEventListener('scroll', syncJump, { passive: true });

  // ------------------------------------------------------------ import / export

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;
  box.appendChild(fileInput);
  q('.ts-import').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    if (file.size > 200_000){ status('That file is too large to be a theme.'); return; }
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.kind !== THEME_FILE_KIND || !data.spec){ status('Not a theme file. Export one from Theme Studio first.', 4000); return; }
      spec = normalizeSpec(data.spec);
      changed();
      status(`Imported "${spec.name}". Save & apply to keep it.`, 4000);
    } catch {
      status('Couldn’t read that file as a theme (invalid JSON).', 4000);
    }
  });
  q('.ts-export').addEventListener('click', () => {
    const payload = JSON.stringify({ kind: THEME_FILE_KIND, version: 1, app: 'comfy-bridge', spec }, null, 2);
    const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = `${slug}.theme.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    status(`Exported "${spec.name}".`);
  });

  // ------------------------------------------------------------ footer / close

  nameInput.addEventListener('input', () => { spec.name = nameInput.value.trim().slice(0, 40) || 'My theme'; dirty = true; dirtyEl.textContent = 'Unsaved changes'; });
  q('.ts-reset').addEventListener('click', () => { spec = defaultSpec(); changed(); });
  q('.ts-cancel').addEventListener('click', tryClose);
  q('.ts-close').addEventListener('click', tryClose);
  q('.ts-keep').addEventListener('click', () => { foot.classList.remove('confirming'); q<HTMLButtonElement>('.ts-save').focus(); });
  q('.ts-discard').addEventListener('click', close);
  q('.ts-save').addEventListener('click', () => {
    try {
      localStorage.setItem(CUSTOM_SPEC_KEY, JSON.stringify(spec));
      localStorage.setItem(CUSTOM_VARS_KEY, JSON.stringify(compileBridge(spec)));
    } catch { status('Couldn’t save the theme (storage is unavailable).'); return; }
    applyTheme('custom');
    opts.onSaved();
    close();
  });

  function tryClose(): void {
    if (openPopover){ closePopover(); return; }
    if (foot.classList.contains('confirming')){ foot.classList.remove('confirming'); return; }
    if (!dirty){ close(); return; }
    foot.classList.add('confirming');
    q<HTMLButtonElement>('.ts-keep').focus();
  }
  function onKey(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') return;
    ev.preventDefault();
    if (openPopover){ const a = openPopover.anchor; closePopover(); a.focus(); return; }
    tryClose();
  }
  const prevFocus = document.activeElement as HTMLElement | null;
  function close(): void {
    document.removeEventListener('keydown', onKey, true);
    resizeObs.disconnect();
    backdrop.classList.remove('modal-visible');
    setTimeout(() => { backdrop.remove(); isOpen = false; prevFocus?.focus?.(); }, 180);
  }
  document.addEventListener('keydown', onKey, true);
  backdrop.addEventListener('mousedown', (ev) => { if (ev.target === backdrop) tryClose(); });

  // ------------------------------------------------------------ views + go

  for (const v of VIEWS){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ts-ptab';
    b.dataset.view = v.id;
    b.setAttribute('role', 'tab');
    b.textContent = v.label;
    b.addEventListener('click', () => { if (view !== v.id) showView(v.id); });
    tabsEl.appendChild(b);
  }
  tabsEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    const i = VIEWS.findIndex(v => v.id === view);
    const n = VIEWS[(i + (ev.key === 'ArrowRight' ? 1 : VIEWS.length - 1)) % VIEWS.length];
    showView(n.id);
    tabsEl.querySelector<HTMLElement>(`[data-view="${n.id}"]`)?.focus();
    ev.preventDefault();
  });

  document.body.appendChild(backdrop);
  buildPreviewDoc();
  showView('window', false);
  syncAll();
  syncJump();
  if (currentThemeName() !== 'custom' && !readCustomVars()) status('Pick a palette to start from, or build from scratch.', 4000);
  requestAnimationFrame(() => requestAnimationFrame(() => { backdrop.classList.add('modal-visible'); box.focus(); fitFrame(); }));
}
