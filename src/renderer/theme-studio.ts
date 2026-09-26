// Theme Studio — the Custom theme's builder. A dim-screen modal: the left
// column scrolls through every editable part of a theme (colors, faces,
// shapes, button/card effects, surfaces), the right column holds a live
// miniature of the real app with a tab switcher under it.
//
// Model: a ThemeSpec (ids, hex colors, radius strings, font names — never
// raw CSS from outside) compiles to a flat CSS-var map (compileSpec). That
// map is what's saved as 'dts-custom-theme' and what index.html's pre-paint
// script and themes.ts's applyTheme('custom') set on <html>, so neither of
// those needs to know the spec exists. The spec itself is saved beside it
// ('dts-custom-theme-spec') so the Studio reopens exactly where it left off,
// and it's the export/import format (shared with Comfy Bridge's Studio).
//
// Preview: an about:blank iframe holding a static clone of #app, with the
// app's own stylesheets. A separate document means the draft's vars and
// data-theme="custom" rules apply there and nowhere else — the app behind
// the dim keeps its current theme, and no other theme's selector rules leak
// into the miniature.
import { THEME_VARS, PREMIUM_THEMES, CUSTOM_GRAMMAR_KEYS, toHex6, themeAlreadyHasPremiumEffects, setFirstCustomHandler } from './themes';
import { getJSON, setJSON, setString, getString, removeKey } from './storage';
import { themeSelect } from './dom';
import { createModalShell, showConfirmModal, toast } from './shared-ui';
import { iconSvg } from './icons';
import { hasSaveFilePicker, pickSaveFile, writeBytes } from './fs-access';

import {
  type ThemeSpec, type FontDef, type Opt, type EffectTier, FONTS, fontStack, SHAPES, CHECKS, STROKES, CAPS, TINTS, T, FILLS, CARD_FX, DEPTHS,
  INK, PATTERNS, PADS, TABS, TOPBARS, PRIMARIES, COLOR_GROUPS, CONTRAST, HEX_RE, RAW_KEYS, THEME_FILE_KIND,
  defaultSpec, normalizeSpec, compileSpec, safeRaw, luminance, contrast, mixHex, fixContrast, hex6
} from './theme-spec';

export { THEME_FILE_KIND };
const SPEC_KEY = 'dts-custom-theme-spec';
const VARS_KEY = 'dts-custom-theme';
// The hand-edited night palette of the Custom in use (absent = automatic);
// themes.ts toggleDayNightMode and the pre-paint script read it.
export const NIGHT_KEY = 'dts-custom-theme-night';
// Every saved Custom theme; the one in use is mirrored into the three keys
// above (so nothing that reads them needs to know about the library).
const LIB_KEY = 'dts-custom-library';
const ACTIVE_KEY = 'dts-custom-active';
interface LibItem { id: string; spec: ThemeSpec; }

function readLibrary(): LibItem[] {
  const raw = getJSON<{ id?: unknown; spec?: unknown }[]>(LIB_KEY, []);
  const out: LibItem[] = [];
  for (const it of Array.isArray(raw) ? raw : []){
    if (typeof it?.id === 'string' && it.spec) out.push({ id: it.id, spec: normalizeSpec(it.spec) });
  }
  // A Custom saved before the library existed becomes its first entry.
  if (!out.length && (getJSON<unknown>(SPEC_KEY, null) || getJSON<unknown>(VARS_KEY, null))){
    out.push({ id: newLibId(), spec: loadSavedSpec() });
    setJSON(LIB_KEY, out);
    setString(ACTIVE_KEY, out[0].id);
  }
  return out;
}
function writeLibrary(lib: LibItem[]): void { setJSON(LIB_KEY, lib); }
function newLibId(): string { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function activeLibId(): string { return getString(ACTIVE_KEY, ''); }

// Night colors as the app would show them: the hand-edited set, or the
// automatic flip (index.html's __dtsNightPalette, the one shared
// implementation) computed from the day colors.
export function nightColorsFor(spec: ThemeSpec): Record<string, string> {
  if (spec.night) return { ...spec.night };
  const pal = (window as unknown as { __dtsNightPalette?: (read: (k: string) => string) => Record<string, string> }).__dtsNightPalette;
  const out: Record<string, string> = { ...spec.colors };
  if (pal) Object.assign(out, pal((k) => hex6(spec.colors[k] || '#000000')));
  return out;
}

// Makes a library theme the Custom in use: mirrors it into the keys the
// pre-paint script and applyTheme('custom') read. The caller applies it.
export function activateLibraryTheme(id: string): boolean {
  const item = readLibrary().find(i => i.id === id);
  if (!item) return false;
  persistActive(item);
  return true;
}
function persistActive(item: LibItem): void {
  setJSON(SPEC_KEY, item.spec);
  setJSON(VARS_KEY, compileCustom(item.spec));
  if (item.spec.night) setJSON(NIGHT_KEY, item.spec.night); else removeKey(NIGHT_KEY);
  setString(ACTIVE_KEY, item.id);
  refreshCustomOptionLabel();
}

// compileSpec, limited to what clearCustomOverrides() knows how to clear.
const ALLOWED_KEYS = new Set<string>([...THEME_VARS.map(([k]) => k), ...CUSTOM_GRAMMAR_KEYS]);
export function compileCustom(spec: ThemeSpec): Record<string, string> {
  const v = compileSpec(spec);
  for (const k of Object.keys(v)) if (!ALLOWED_KEYS.has(k)) delete v[k];
  return v;
}

// Saved spec, else a spec rebuilt from an older build's colors-only map.
export function loadSavedSpec(): ThemeSpec {
  const spec = getJSON<unknown>(SPEC_KEY, null);
  if (spec) return normalizeSpec(spec);
  const legacy = getJSON<Record<string, string> | null>(VARS_KEY, null);
  const d = defaultSpec();
  if (legacy) return normalizeSpec({ ...d, colors: { ...d.colors, ...legacy } });
  return d;
}

// ---------------------------------------------------------------- studio

export interface ThemeStudioDeps {
  getOwnedThemes: () => string[];
  getRefinedThemes: () => string[];
  // Renders the lazily-built tabs (Datasets, Editing Stats) so the snapshot
  // the preview clones isn't empty there.
  prepareSnapshot: () => Promise<void> | void;
  onSaved: () => void;
  getWallet: () => number;
  spendEdibits: (amount: number) => boolean;
}

// ---- Effect unlocks
// Fills and card hovers belong to the epic/legendary shop tier (theme-spec.ts
// `tier`). Any of them can be previewed; saving one onto Custom costs that
// tier's theme price once, after which it's owned for every future Custom.
// Effects copied from a theme you already own ("From theme") are free — you
// paid for them with the theme. A Refine Theme bought for Custom before the
// Studio existed covers every epic-tier effect.
const FX_OWNED_KEY = 'dts-custom-fx-owned';
type FxKind = 'fill' | 'card';
function tierPrice(tier: EffectTier): number {
  const t = PREMIUM_THEMES.find(p => p.rarity === tier);
  return t ? t.price : (tier === 'epic' ? 360 : 750);
}
function ownedFx(): string[] { return getJSON<string[]>(FX_OWNED_KEY, []); }
function fxLock(kind: FxKind, id: string): { tier: EffectTier; price: number; label: string } | null {
  const def = kind === 'fill' ? FILLS.find(f => f.id === id) : CARD_FX.find(c => c.id === id);
  if (!def || !def.tier) return null;
  if (ownedFx().includes(`${kind}:${id}`)) return null;
  if (def.tier === 'epic' && deps.getRefinedThemes().includes('custom')) return null;
  return { tier: def.tier, price: tierPrice(def.tier), label: `${def.label} ${kind === 'fill' ? 'button fill' : 'card hover'}` };
}

let deps: ThemeStudioDeps;
let open = false;

export function initThemeStudio(d: ThemeStudioDeps): void {
  deps = d;
  setFirstCustomHandler(() => openThemeStudio());
  refreshCustomOptionLabel();
}

// The theme menu shows Custom by its Studio name once one is saved, and
// every other saved Custom as its own `custom:<id>` entry right after it
// (index.ts's change handler activates one before applying 'custom').
export function refreshCustomOptionLabel(): void {
  const opt = themeSelect.querySelector<HTMLOptionElement>('option[value="custom"]');
  if (!opt) return;
  const saved = getJSON<{ name?: string } | null>(SPEC_KEY, null);
  opt.textContent = saved && saved.name ? `Custom: ${saved.name}` : 'Custom…';
  themeSelect.querySelectorAll('option[value^="custom:"]').forEach(o => o.remove());
  const active = activeLibId();
  let after: HTMLOptionElement = opt;
  for (const item of readLibrary()){
    if (item.id === active) continue;
    const o = document.createElement('option');
    o.value = 'custom:' + item.id;
    o.textContent = `Custom: ${item.spec.name}`;
    after.after(o);
    after = o;
  }
}

type PreviewTab = 'datasets' | 'gallery' | 'master' | 'stats' | 'synthdat';
const PREVIEW_TABS: { id: PreviewTab; label: string; icon: string }[] = [
  { id: 'datasets', label: 'Datasets', icon: 'folder' },
  { id: 'gallery', label: 'Gallery', icon: 'image' },
  { id: 'master', label: 'Tag Overseer', icon: 'telescope' },
  { id: 'stats', label: 'Editing Stats', icon: 'chart' },
  { id: 'synthdat', label: 'SynthDat', icon: 'flask' },
];

function esc(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export async function openThemeStudio(): Promise<void> {
  if (open) return;
  open = true;
  try { await deps.prepareSnapshot(); } catch { /* a missing tab render only thins the preview */ }

  let library = readLibrary();
  let currentId: string | null = library.some(i => i.id === activeLibId()) ? activeLibId() : null;
  const saved = currentId ? library.find(i => i.id === currentId)!.spec : loadSavedSpec();
  let spec: ThemeSpec = normalizeSpec(JSON.parse(JSON.stringify(saved)));
  let dirty = false;
  // Which palette the Colors section edits and the preview shows.
  let palette: 'day' | 'night' = 'day';
  const cols = (): Record<string, string> => palette === 'night' ? (spec.night || nightColorsFor(spec)) : spec.colors;
  let previewTab: PreviewTab = currentAppTab();

  const { backdrop, box, close } = createModalShell({
    className: 'ts-backdrop',
    boxClassName: 'ts-box',
    onDismiss: () => { void tryClose(); },
    onClose: () => { open = false; resizeObs.disconnect(); window.removeEventListener('keydown', onPopoverKey, true); },
  });
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-labelledby', 'tsTitle');

  box.innerHTML = `
    <header class="ts-head">
      <div class="ts-title-block">
        <h2 id="tsTitle" class="ts-title">Theme Studio</h2>
        <input class="ts-name" type="text" maxlength="40" spellcheck="false" aria-label="Theme name" placeholder="Name your theme">
      </div>
      <div class="ts-head-actions">
        <button type="button" class="ts-import" title="Load a theme file someone shared (.json)">${iconSvg('upload', 'ic-lead')}Import</button>
        <button type="button" class="ts-export" title="Save this theme to a file you can share">${iconSvg('download', 'ic-lead')}Export</button>
        <button type="button" class="ts-close ghost-close" title="Close (Esc)" aria-label="Close">${iconSvg('x')}</button>
      </div>
    </header>
    <div class="ts-edit">
      <nav class="ts-jump" aria-label="Sections"></nav>
      <div class="ts-sections"></div>
    </div>
    <div class="ts-stage">
      <div class="ts-stage-frame"><div class="ts-frame-wrap"><iframe class="ts-frame" title="Live preview" tabindex="-1"></iframe></div></div>
      <div class="ts-stage-bar">
        <div class="ts-preview-tabs" role="tablist" aria-label="Preview tab"></div>
        <button type="button" class="ts-compare" aria-pressed="false" title="Hold to see your current theme in the preview (Space or Enter also works)">${iconSvg('swap', 'ic-lead')}Hold to compare</button>
      </div>
      <div class="ts-stage-note">Live preview. Hover the miniature to try buttons and cards.</div>
    </div>
    <footer class="ts-foot">
      <button type="button" class="ts-reset" title="Start over from the Studio default look">${iconSvg('rotate', 'ic-lead')}Reset to Studio</button>
      <span class="ts-dirty" aria-live="polite"></span>
      <span class="ts-wallet" title="Your Edibits">${iconSvg('coins', 'ic-lead')}<b></b></span>
      <div class="ts-foot-actions">
        <button type="button" class="ts-cancel">Cancel</button>
        <button type="button" class="ts-save-copy" title="Keep this as a new theme in My themes, leaving the one you opened unchanged">Save as new</button>
        <button type="button" class="ts-save primary">Save &amp; apply</button>
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
  const walletEl = q('.ts-wallet b');
  const saveBtn = q<HTMLButtonElement>('.ts-save');

  // ------------------------------------------------------------ preview

  let pdoc: Document | null = null;
  let appliedKeys: string[] = [];
  const W = Math.max(1100, window.innerWidth), H = Math.max(680, window.innerHeight);
  frame.style.width = W + 'px';
  frame.style.height = H + 'px';

  function fitFrame(): void {
    const r = stageFrame.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const s = Math.min(r.width / W, r.height / H);
    frame.style.transform = `scale(${s})`;
    frameWrap.style.width = Math.round(W * s) + 'px';
    frameWrap.style.height = Math.round(H * s) + 'px';
  }
  const resizeObs = new ResizeObserver(fitFrame);
  resizeObs.observe(stageFrame);

  function buildPreviewDoc(): void {
    const doc = frame.contentDocument;
    if (!doc) return;
    const app = document.getElementById('app')!.cloneNode(true) as HTMLElement;
    // Big datasets: the miniature only ever shows a screenful of cards.
    for (const grid of Array.from(app.querySelectorAll('#galleryGrid, #compactGrid'))){
      Array.from(grid.children).slice(36).forEach(c => c.remove());
    }
    app.querySelectorAll('.pdrop-menu, .header-cat-flyout').forEach(el => (el as HTMLElement).style.display = 'none');
    seedSampleGallery(app);
    const keep = Array.from(document.documentElement.classList).filter(c => /^motion-|^touch-device$/.test(c));
    const sprite = document.getElementById('iconSprite');
    const base = document.baseURI.replace(/"/g, '%22');
    doc.open();
    doc.write(`<!DOCTYPE html><html data-theme="custom" class="${keep.join(' ')}"><head><meta charset="utf-8"><base href="${base}">
      <link rel="stylesheet" href="fonts/fonts.css"><link rel="stylesheet" href="styles.css">
      <style>html,body{overflow:hidden} *{cursor:default !important} ::-webkit-scrollbar{width:8px;height:8px}</style>
      </head><body class="${esc(document.body.className)}">${sprite ? sprite.outerHTML : ''}${app.outerHTML}</body></html>`);
    doc.close();
    pdoc = doc;
    // Hover stays live (that's how fills and card lifts preview); every
    // action is swallowed, so the clone can't be typed into or toggled.
    for (const type of ['click', 'mousedown', 'dblclick', 'contextmenu', 'keydown', 'submit', 'dragstart', 'auxclick']){
      doc.addEventListener(type, (ev) => { ev.preventDefault(); ev.stopPropagation(); }, true);
    }
    doc.querySelectorAll('input, textarea, select, button').forEach(el => el.setAttribute('tabindex', '-1'));
    showPreviewTab(previewTab, false);
    applyDraft();
    // Presets are read from the preview's own computed styles, so they wait
    // for its stylesheet too.
    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      fillPresetSwatches();
      frameWrap.classList.add('ts-ready');
    };
    const sheet = doc.querySelector<HTMLLinkElement>('link[href="styles.css"]');
    if (sheet && !sheet.sheet) sheet.addEventListener('load', reveal, { once: true }); else reveal();
    setTimeout(reveal, 1500);
  }

  function showPreviewTab(tab: PreviewTab, animate = true): void {
    previewTab = tab;
    tabsEl.querySelectorAll<HTMLButtonElement>('.ts-ptab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    const apply = () => {
      if (!pdoc) return;
      const $p = (id: string) => pdoc!.getElementById(id);
      const set = (id: string, disp: string) => { const el = $p(id); if (el) el.style.display = disp; };
      const map: Record<string, PreviewTab> = { tabDatasetManager: 'datasets', tabGallery: 'gallery', tabMasterTags: 'master', tabStats: 'stats', tabSynthDat: 'synthdat' };
      for (const [id, t] of Object.entries(map)) $p(id)?.classList.toggle('active', t === tab);
      set('datasetManagerTab', tab === 'datasets' ? 'block' : 'none');
      set('galleryTab', (tab === 'gallery' || tab === 'master') ? 'contents' : 'none');
      set('statsTab', tab === 'stats' ? 'block' : 'none');
      set('synthDatTab', tab === 'synthdat' ? 'block' : 'none');
      $p('normalRightTools')?.classList.toggle('rt-hidden', tab === 'master');
      $p('masterTagPanel')?.classList.toggle('rt-hidden', tab !== 'master');
    };
    if (!animate || document.documentElement.classList.contains('motion-off')){ apply(); return; }
    frameWrap.classList.add('ts-switching');
    setTimeout(() => { apply(); frameWrap.classList.remove('ts-switching'); }, 110);
  }

  let draftQueued = false;
  function applyDraft(): void {
    if (draftQueued) return;
    draftQueued = true;
    requestAnimationFrame(() => {
      draftQueued = false;
      if (comparing) return;
      const vars = compileCustom(spec);
      if (palette === 'night') Object.assign(vars, cols());
      if (pdoc){
        const st = pdoc.documentElement.style;
        for (const k of appliedKeys) if (!(k in vars)) st.removeProperty(k);
        for (const [k, val] of Object.entries(vars)) st.setProperty(k, val);
        appliedKeys = Object.keys(vars);
        pdoc.documentElement.classList.toggle('theme-refined', vars['--c-fx-on'] === '1');
      }
      // Option samples in the editor render in the draft's colors (only the
      // samples — the editor chrome itself stays in the app's theme).
      const c = cols();
      box.querySelectorAll<HTMLElement>('.ts-sample').forEach(el => {
        for (const [k] of THEME_VARS) el.style.setProperty(k, c[k]);
        el.style.setProperty('--c-tint', `var(--accent-${spec.fx.tint})`);
      });
    });
  }

  // Hold to compare: the preview briefly shows the theme the app is wearing
  // right now — its data-theme, classes and inline vars (a Custom's, or
  // night mode's) copied off the live <html> — then snaps back to the draft.
  let comparing = false;
  function setCompare(on: boolean): void {
    if (on === comparing || !pdoc) return;
    comparing = on;
    const btn = q<HTMLButtonElement>('.ts-compare');
    btn.setAttribute('aria-pressed', String(on));
    btn.classList.toggle('on', on);
    frameWrap.classList.toggle('ts-comparing', on);
    const root = pdoc.documentElement, live = document.documentElement;
    if (on){
      root.removeAttribute('style');
      root.setAttribute('data-theme', live.getAttribute('data-theme') || 'studio');
      for (const c of ['theme-refined', 'night-mode', 'suppress-theme-flourishes']) root.classList.toggle(c, live.classList.contains(c));
      for (let i = 0; i < live.style.length; i++){
        const k = live.style[i];
        if (k.startsWith('--')) root.style.setProperty(k, live.style.getPropertyValue(k));
      }
    } else {
      root.removeAttribute('style');
      root.setAttribute('data-theme', 'custom');
      root.classList.remove('night-mode', 'suppress-theme-flourishes');
      appliedKeys = [];
      applyDraft();
    }
  }
  {
    const btn = q<HTMLButtonElement>('.ts-compare');
    btn.addEventListener('pointerdown', (ev) => { btn.setPointerCapture(ev.pointerId); setCompare(true); });
    btn.addEventListener('pointerup', () => setCompare(false));
    btn.addEventListener('pointercancel', () => setCompare(false));
    btn.addEventListener('keydown', (ev) => { if ((ev.key === ' ' || ev.key === 'Enter') && !ev.repeat){ ev.preventDefault(); setCompare(true); } });
    btn.addEventListener('keyup', (ev) => { if (ev.key === ' ' || ev.key === 'Enter') setCompare(false); });
    btn.addEventListener('blur', () => setCompare(false));
  }

  // ------------------------------------------------------------ editor

  const syncers: (() => void)[] = [];
  function syncAll(): void { nameInput.value = spec.name; syncers.forEach(fn => fn()); syncFooter(); applyDraft(); }
  function pendingUnlocks(): { key: string; price: number; label: string }[] {
    const out: { key: string; price: number; label: string }[] = [];
    if (spec.fx.fill !== 'preset'){ const l = fxLock('fill', spec.fx.fill); if (l) out.push({ key: 'fill:' + spec.fx.fill, price: l.price, label: l.label }); }
    if (spec.fx.card !== 'preset'){ const l = fxLock('card', spec.fx.card); if (l) out.push({ key: 'card:' + spec.fx.card, price: l.price, label: l.label }); }
    return out;
  }
  function syncFooter(): void {
    const due = pendingUnlocks().reduce((n, u) => n + u.price, 0);
    walletEl.textContent = String(deps.getWallet());
    saveBtn.textContent = due ? `Unlock & apply (${due})` : 'Save & apply';
    saveBtn.classList.toggle('ts-save-paid', due > 0);
    dirtyEl.textContent = dirty ? 'Unsaved changes' : '';
  }
  function changed(): void {
    dirty = true;
    syncers.forEach(fn => fn());
    syncFooter();
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
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('motion-off');
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

  // A row of option tiles, each with a drawn sample. `get`/`set` read and
  // write the spec; 'preset' shows as an extra "From theme" tile.
  function optionGrid<O extends Opt>(parent: HTMLElement, label: string, opts: O[], get: () => string, set: (id: string) => void,
    sample: (o: O) => string, cls = '', hint?: string, lockOf?: (id: string) => { tier: EffectTier; price: number } | null): void {
    const f = field(parent, label, hint);
    const grid = document.createElement('div');
    grid.className = 'ts-opts ' + cls;
    grid.setAttribute('role', 'radiogroup');
    grid.setAttribute('aria-label', label);
    const presetTile = document.createElement('button');
    presetTile.type = 'button';
    presetTile.className = 'ts-opt ts-opt-preset';
    presetTile.innerHTML = `<span class="ts-sample ts-s-preset">${iconSvg('palette')}</span><span class="ts-opt-label">From theme</span>`;
    presetTile.title = 'Kept from the theme you started from';
    presetTile.setAttribute('role', 'radio');
    presetTile.addEventListener('click', () => { /* already active when shown */ });
    grid.appendChild(presetTile);
    for (const o of opts){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ts-opt';
      b.dataset.id = o.id;
      b.setAttribute('role', 'radio');
      b.innerHTML = `<span class="ts-sample">${sample(o)}</span><span class="ts-opt-label">${esc(o.label)}</span>`;
      if (lockOf){
        const badge = document.createElement('span');
        badge.className = 'ts-price';
        badge.setAttribute('aria-hidden', 'true');
        b.querySelector('.ts-sample')!.appendChild(badge);
      }
      b.addEventListener('click', () => { set(o.id); changed(); });
      grid.appendChild(b);
    }
    f.appendChild(grid);
    syncers.push(() => {
      const cur = get();
      presetTile.hidden = cur !== 'preset';
      presetTile.setAttribute('aria-checked', String(cur === 'preset'));
      presetTile.classList.toggle('on', cur === 'preset');
      grid.querySelectorAll<HTMLButtonElement>('.ts-opt[data-id]').forEach(b => {
        const on = b.dataset.id === cur;
        b.classList.toggle('on', on);
        b.setAttribute('aria-checked', String(on));
        if (!lockOf) return;
        const lock = lockOf(b.dataset.id!);
        b.classList.toggle('locked', !!lock);
        const badge = b.querySelector<HTMLElement>('.ts-price')!;
        badge.hidden = !lock;
        if (lock){
          badge.className = `ts-price rarity-${lock.tier}`;
          badge.innerHTML = `${iconSvg('lock')}${lock.price}`;
          b.title = `${lock.tier === 'epic' ? 'Epic' : 'Legendary'} effect: preview free, ${lock.price} Edibits to keep`;
        } else b.removeAttribute('title');
      });
    });
  }

  function segmented(parent: HTMLElement, label: string, opts: { id: string; label: string }[], get: () => string, set: (id: string) => void, editsSpec = true): void {
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
      b.addEventListener('click', () => { set(o.id); if (editsSpec) changed(); else { syncers.forEach(fn => fn()); applyDraft(); } });
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

  function slider(parent: HTMLElement, label: string, min: number, max: number, get: () => number, set: (n: number) => void, unit = 'px'): void {
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
    syncers.push(() => {
      const n = get();
      input.value = String(n);
      out.textContent = n + unit;
      input.style.setProperty('--fill', ((n - min) / (max - min) * 100) + '%');
    });
  }

  function toggle(parent: HTMLElement, label: string, get: () => boolean, set: (on: boolean) => void): void {
    const row = document.createElement('label');
    row.className = 'ach-toggle-row ts-toggle';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    const span = document.createElement('span');
    span.textContent = label;
    cb.addEventListener('change', () => { set(cb.checked); changed(); });
    row.append(cb, span);
    parent.appendChild(row);
    syncers.push(() => { cb.checked = get(); });
  }

  // Font picker: a button in the current face opening a grouped list, each
  // family set in itself.
  let openPopover: { el: HTMLElement; anchor: HTMLElement } | null = null;
  function closePopover(): void {
    if (!openPopover) return;
    openPopover.anchor.setAttribute('aria-expanded', 'false');
    openPopover.el.remove();
    openPopover = null;
    document.removeEventListener('mousedown', onPopoverDown, true);
  }
  function onPopoverDown(ev: MouseEvent): void {
    if (!openPopover) return;
    const t = ev.target as Node;
    if (openPopover.el.contains(t) || openPopover.anchor.contains(t)) return;
    closePopover();
  }
  function onPopoverKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape' && openPopover){
      ev.stopImmediatePropagation();
      ev.preventDefault();
      const a = openPopover.anchor;
      closePopover();
      a.focus();
    }
  }
  window.addEventListener('keydown', onPopoverKey, true);

  function fontPicker(parent: HTMLElement, label: string, slot: keyof ThemeSpec['fonts']): void {
    const f = field(parent, label);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ts-font-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    f.appendChild(btn);
    const sync = () => {
      const name = spec.fonts[slot];
      btn.innerHTML = `<span class="ts-font-face">${esc(name || 'System')}</span>${iconSvg('caret-down', 'ts-font-caret')}`;
      (btn.firstElementChild as HTMLElement).style.fontFamily = fontStack(name, slot === 'mono' ? 'mono' : 'ui');
    };
    syncers.push(sync);
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
      for (const [title, kind] of groups){
        const h = document.createElement('div');
        h.className = 'ts-font-group';
        h.textContent = title;
        pop.appendChild(h);
        const names = kind === 'system' ? [''] : FONTS.filter(ft => ft.kind === kind).map(ft => ft.name);
        for (const name of names){
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'ts-font-item' + (spec.fonts[slot] === name ? ' on' : '');
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', String(spec.fonts[slot] === name));
          item.textContent = name || (slot === 'mono' ? 'System mono' : 'System UI');
          item.style.fontFamily = fontStack(name, slot === 'mono' ? 'mono' : 'ui');
          item.addEventListener('click', () => {
            spec.fonts[slot] = name;
            changed();
            closePopover();
            btn.focus();
          });
          pop.appendChild(item);
        }
      }
      f.appendChild(pop);
      btn.setAttribute('aria-expanded', 'true');
      openPopover = { el: pop, anchor: btn };
      document.addEventListener('mousedown', onPopoverDown, true);
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
    // The contrast readout doubles as the fix: a low ratio turns it into a
    // button that nudges this color's lightness until it passes.
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'ts-contrast';
    badge.tabIndex = -1;
    row.append(swatch, name, badge, hex);
    parent.appendChild(row);
    const editable = () => palette === 'day' || !!spec.night;
    picker.addEventListener('input', () => {
      if (!editable()) return;
      // Keep an authored alpha (#rrggbbaa rules) when only the hue changes.
      const c = cols(), cur = c[key];
      c[key] = cur.length === 9 ? picker.value + cur.slice(7) : picker.value;
      changed();
    });
    hex.addEventListener('input', () => {
      if (!editable()) return;
      let v = hex.value.trim();
      if (v && v[0] !== '#') v = '#' + v;
      const ok = HEX_RE.test(v);
      hex.classList.toggle('bad', !ok);
      if (ok){ cols()[key] = v.toLowerCase(); changed(); }
    });
    hex.addEventListener('blur', () => { hex.classList.remove('bad'); hex.value = cols()[key]; });
    const rule = CONTRAST[key];
    badge.addEventListener('click', () => {
      if (!rule || !badge.classList.contains('low') || !editable()) return;
      const c = cols();
      c[key] = fixContrast(c[key], c[rule.against], rule.floor);
      changed();
    });
    syncers.push(() => {
      const c = cols(), v = c[key];
      const canEdit = editable();
      row.classList.toggle('ts-color-auto', !canEdit);
      picker.disabled = !canEdit;
      hex.readOnly = !canEdit;
      picker.value = toHex6(v);
      swatch.style.setProperty('--sw', v);
      if (document.activeElement !== hex) hex.value = v;
      if (rule){
        const ratio = contrast(v, c[rule.against]);
        const low = ratio < rule.floor;
        const where = rule.against.replace('--', '').replace(/-/g, ' ');
        badge.textContent = low && canEdit ? `${ratio.toFixed(1)}:1 · Fix` : ratio.toFixed(1) + ':1';
        badge.classList.toggle('low', low);
        badge.tabIndex = low && canEdit ? 0 : -1;
        badge.title = low
          ? `Below ${rule.floor}:1 against ${where}: hard to read.${canEdit ? ' Click to adjust its lightness until it passes.' : ''}`
          : `Contrast against ${where}`;
      } else {
        badge.hidden = true;
      }
    });
  }

  // ---- My themes (the saved-theme library)
  const secLib = section('mine', 'My themes', 'Every Custom theme you\'ve saved. Pick one to edit it; the one in use is marked.');
  const libGrid = document.createElement('div');
  libGrid.className = 'ts-presets ts-library';
  secLib.appendChild(libGrid);
  async function confirmDiscard(): Promise<boolean> {
    if (!dirty) return true;
    return showConfirmModal('Discard your unsaved changes to this theme?', { okLabel: 'Discard', cancelLabel: 'Keep editing', danger: true });
  }
  function renderLibrary(): void {
    libGrid.innerHTML = '';
    const active = activeLibId();
    for (const item of library){
      const tile = document.createElement('div');
      tile.className = 'ts-lib-item' + (item.id === currentId ? ' editing' : '');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ts-preset';
      const c = item.spec.colors;
      b.innerHTML = `<span class="ts-preset-sw">${[c['--bg-base'], c['--bg-panel'], c['--accent-manual'], c['--accent-flair']].map(x => `<i style="background:${esc(x)}"></i>`).join('')}</span>`
        + `<span class="ts-preset-name">${esc(item.spec.name)}</span>`
        + (item.id === active ? '<span class="ts-lib-badge">In use</span>' : '');
      b.title = item.id === currentId ? 'Editing this theme' : `Edit ${item.spec.name}`;
      b.addEventListener('click', async () => {
        if (item.id === currentId) return;
        if (!(await confirmDiscard())) return;
        currentId = item.id;
        spec = normalizeSpec(JSON.parse(JSON.stringify(item.spec)));
        dirty = false;
        renderLibrary();
        syncAll();
      });
      tile.appendChild(b);
      const acts = document.createElement('div');
      acts.className = 'ts-lib-acts';
      const dup = document.createElement('button');
      dup.type = 'button';
      dup.className = 'ts-lib-act';
      dup.title = `Duplicate ${item.spec.name}`;
      dup.setAttribute('aria-label', dup.title);
      dup.innerHTML = iconSvg('list');
      dup.addEventListener('click', () => {
        const copy: LibItem = { id: newLibId(), spec: normalizeSpec({ ...JSON.parse(JSON.stringify(item.spec)), name: `${item.spec.name} copy`.slice(0, 40) }) };
        library.splice(library.indexOf(item) + 1, 0, copy);
        writeLibrary(library);
        refreshCustomOptionLabel();
        renderLibrary();
      });
      acts.appendChild(dup);
      if (item.id !== active){
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'ts-lib-act danger';
        del.title = `Delete ${item.spec.name}`;
        del.setAttribute('aria-label', del.title);
        del.innerHTML = iconSvg('trash');
        del.addEventListener('click', async () => {
          if (!(await showConfirmModal(`Delete "${item.spec.name}" from My themes? Export it first if you might want it back.`, { okLabel: 'Delete', danger: true }))) return;
          library = library.filter(i => i.id !== item.id);
          writeLibrary(library);
          refreshCustomOptionLabel();
          if (currentId === item.id){ currentId = null; dirty = true; }
          renderLibrary();
          syncFooter();
        });
        acts.appendChild(del);
      }
      tile.appendChild(acts);
      libGrid.appendChild(tile);
    }
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'ts-preset ts-lib-new' + (currentId === null ? ' editing' : '');
    add.innerHTML = `<span class="ts-preset-sw ts-lib-plus">+</span><span class="ts-preset-name">New theme</span>`;
    add.title = 'Start a new theme from the Studio defaults';
    add.addEventListener('click', async () => {
      if (!(await confirmDiscard())) return;
      currentId = null;
      spec = defaultSpec();
      dirty = false;
      renderLibrary();
      syncAll();
    });
    libGrid.appendChild(add);
  }

  // ---- Start from
  const secStart = section('start', 'Start from', 'Copy any theme you own as a starting point: its colors, faces, shapes, mat and effects.');
  const presetGrid = document.createElement('div');
  presetGrid.className = 'ts-presets';
  secStart.appendChild(presetGrid);
  const owned = deps.getOwnedThemes();
  const presetList: { id: string; name: string; sw: string[] }[] = [];
  for (const opt of Array.from(themeSelect.options)){
    if (opt.value === 'custom') continue;
    const premium = PREMIUM_THEMES.find(p => p.id === opt.value);
    if (premium && !owned.includes(opt.value)) continue;
    presetList.push({ id: opt.value, name: (premium ? premium.name : (opt.textContent || opt.value)).replace(/^🔒\s*/, ''), sw: [] });
  }
  const lockedCount = PREMIUM_THEMES.filter(p => !owned.includes(p.id)).length;
  function renderPresets(): void {
    presetGrid.innerHTML = '';
    for (const p of presetList){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ts-preset';
      b.title = `Start from ${p.name}`;
      b.innerHTML = `<span class="ts-preset-sw">${p.sw.map(c => `<i style="background:${esc(c)}"></i>`).join('')}</span><span class="ts-preset-name">${esc(p.name)}</span>`;
      b.addEventListener('click', () => loadPreset(p.id, p.name));
      presetGrid.appendChild(b);
    }
    if (lockedCount){
      const more = document.createElement('p');
      more.className = 'ts-presets-more';
      more.textContent = `${lockedCount} more theme${lockedCount === 1 ? '' : 's'} unlock in Personalization ▸ Shop.`;
      presetGrid.appendChild(more);
    }
  }

  // ---- Colors
  const secColors = section('colors', 'Colors', 'Sixteen roles every screen reads. Hex accepts #rgb, #rrggbb and #rrggbbaa.');
  // Day / Night: night mode now works on Custom. Automatic flips the day
  // colors the same way every built-in theme is flipped; Hand-edited starts
  // from that flip and lets every role be set by hand.
  segmented(secColors, 'Palette', [{ id: 'day', label: 'Day' }, { id: 'night', label: 'Night' }], () => palette, id => {
    palette = id as 'day' | 'night';
  }, false);
  const nightField = document.createElement('div');
  nightField.className = 'ts-night';
  secColors.appendChild(nightField);
  segmented(nightField, 'Night colors', [{ id: 'auto', label: 'Automatic' }, { id: 'manual', label: 'Hand-edited' }], () => spec.night ? 'manual' : 'auto', id => {
    spec.night = id === 'manual' ? nightColorsFor({ ...spec, night: null }) : null;
  });
  const nightNote = document.createElement('p');
  nightNote.className = 'ts-sec-lede ts-night-note';
  nightNote.textContent = 'Automatic flips each color\'s lightness and keeps text readable. Switch to Hand-edited to change any of them.';
  nightField.appendChild(nightNote);
  syncers.push(() => {
    nightField.hidden = palette !== 'night';
    nightNote.hidden = !!spec.night;
  });
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
  tintBtn.innerHTML = `${iconSvg('wand', 'ic-lead')}Match tints to accents`;
  tintBtn.title = 'Recompute the Manual and Auto tints from their accents and the panel color';
  tintBtn.addEventListener('click', () => {
    if (palette === 'night' && !spec.night) return;
    const c = cols();
    const panel = c['--bg-panel'];
    const light = luminance(panel) > 0.4;
    c['--accent-manual-dim'] = mixHex(panel, c['--accent-manual'], light ? 0.16 : 0.22);
    c['--accent-auto-dim'] = mixHex(panel, c['--accent-auto'], light ? 0.16 : 0.22);
    changed();
  });
  const fixAllBtn = document.createElement('button');
  fixAllBtn.type = 'button';
  fixAllBtn.className = 'ts-link-btn';
  fixAllBtn.innerHTML = `${iconSvg('check-circle', 'ic-lead')}Fix all low contrast`;
  fixAllBtn.title = 'Adjust the lightness of every color below its readability floor';
  fixAllBtn.addEventListener('click', () => {
    if (palette === 'night' && !spec.night) return;
    const c = cols();
    for (const [k, r] of Object.entries(CONTRAST)) c[k] = fixContrast(c[k], c[r.against], r.floor);
    changed();
  });
  syncers.push(() => {
    const c = cols();
    const anyLow = Object.entries(CONTRAST).some(([k, r]) => contrast(c[k], c[r.against]) < r.floor);
    fixAllBtn.hidden = !anyLow || (palette === 'night' && !spec.night);
    tintBtn.hidden = palette === 'night' && !spec.night;
  });
  const colorActs = document.createElement('div');
  colorActs.className = 'ts-color-acts';
  colorActs.append(tintBtn, fixAllBtn);
  secColors.appendChild(colorActs);

  // ---- Type
  const secType = section('type', 'Type', 'Bundled faces only, so a theme looks the same on every machine.');
  const fontGrid = document.createElement('div');
  fontGrid.className = 'ts-font-grid';
  secType.appendChild(fontGrid);
  fontPicker(fontGrid, 'Interface', 'ui');
  fontPicker(fontGrid, 'Brand lockup', 'display');
  fontPicker(fontGrid, 'Panel titles', 'head');
  fontPicker(fontGrid, 'Tabs', 'tab');
  fontPicker(fontGrid, 'Tags & filenames', 'mono');
  slider(secType, 'Brand size', 12, 28, () => spec.type.brandSize, n => { spec.type.brandSize = n; });
  segmented(secType, 'Button weight', [{ id: '400', label: 'Regular' }, { id: '500', label: 'Medium' }, { id: '600', label: 'Semibold' }, { id: '700', label: 'Bold' }],
    () => String(spec.type.btnWeight), id => { spec.type.btnWeight = Number(id); });
  const capsField = field(secType, 'Capitals', 'Tracked out automatically');
  const capsWrap = document.createElement('div');
  capsWrap.className = 'ts-toggles';
  capsField.appendChild(capsWrap);
  toggle(capsWrap, 'Tabs', () => spec.type.capsTabs, on => { spec.type.capsTabs = on; });
  toggle(capsWrap, 'Panel titles', () => spec.type.capsHeads, on => { spec.type.capsHeads = on; });
  toggle(capsWrap, 'Buttons', () => spec.type.capsButtons, on => { spec.type.capsButtons = on; });
  toggle(capsWrap, 'Brand', () => spec.type.capsBrand, on => { spec.type.capsBrand = on; });

  // ---- Shape
  const secShape = section('shape', 'Shape', 'Corners for each kind of element, set independently.');
  const shapeGet = (k: 'ctl' | 'chip') => () => { const s = SHAPES.find(o => o.r === spec.shape[k]); return s ? s.id : 'preset'; };
  optionGrid(secShape, 'Buttons', SHAPES, shapeGet('ctl'), id => { spec.shape.ctl = SHAPES.find(o => o.id === id)!.r; },
    o => `<span class="ts-s-btn" style="border-radius:${o.r}">Save</span>`, 'ts-opts-shape');
  optionGrid(secShape, 'Tags', SHAPES, shapeGet('chip'), id => { spec.shape.chip = SHAPES.find(o => o.id === id)!.r; },
    o => `<span class="ts-s-chip" style="border-radius:${o.r}">red hair</span>`, 'ts-opts-shape');
  const firstPx = (s: string) => Math.round(parseFloat(s) || 0);
  slider(secShape, 'Cards', 0, 24, () => firstPx(spec.shape.card), n => { spec.shape.card = n + 'px'; });
  slider(secShape, 'Panels & menus', 0, 28, () => firstPx(spec.shape.panel), n => { spec.shape.panel = n + 'px'; });
  optionGrid(secShape, 'Checkboxes', CHECKS, () => (CHECKS.find(c => c.r === spec.shape.check) || { id: 'preset' }).id,
    id => { spec.shape.check = CHECKS.find(c => c.id === id)!.r; },
    o => `<span class="ts-s-check" style="border-radius:${o.r}">${iconSvg('check')}</span>`, 'ts-opts-compact');
  segmented(secShape, 'Icon stroke', STROKES, () => spec.icons.stroke, id => { spec.icons.stroke = id; });
  segmented(secShape, 'Icon ends', CAPS, () => spec.icons.cap, id => { spec.icons.cap = id; });

  // ---- Effects
  const secFx = section('effects', 'Effects', 'Motion on hover. The Settings flourish switches still turn these off.');
  const fxNote = document.createElement('p');
  fxNote.className = 'ts-fx-note';
  fxNote.innerHTML = `${iconSvg('lock', 'ic-lead')}Epic and legendary effects preview free. Keeping one costs its tier's price in Edibits, once.`;
  secFx.appendChild(fxNote);
  optionGrid(secFx, 'Button fill', FILLS, () => spec.fx.fill, id => { spec.fx.fill = id; },
    o => `<span class="ts-s-fill"><span class="ts-s-fill-bar" style="width:${Number(o.w) * 100}%;background:${o.fill.split(T).join('var(--c-tint)')};opacity:${o.id === 'none' ? 0 : Math.max(Number(o.o), 0.3)};top:${o.top};height:${o.h}"></span><span class="ts-s-fill-txt">Hover</span></span>`,
    'ts-opts-fill', 'Plays when the pointer is over a button', id => fxLock('fill', id));
  segmented(secFx, 'Fill color', TINTS, () => spec.fx.tint, id => { spec.fx.tint = id; });
  optionGrid(secFx, 'Card hover', CARD_FX, () => spec.fx.card, id => { spec.fx.card = id; },
    o => `<span class="ts-s-card" style="transform:${o.t === 'none' ? 'none' : o.t.replace('-3px', '-2px')};box-shadow:${o.s.split(T).join('var(--c-tint)').replace('var(--card-shadow)', 'none')}"></span>`,
    'ts-opts-compact', undefined, id => fxLock('card', id));
  optionGrid(secFx, 'Card depth', DEPTHS, () => spec.fx.depth, id => { spec.fx.depth = id; },
    o => `<span class="ts-s-card" style="box-shadow:${o.s}"></span>`, 'ts-opts-compact');

  // ---- Surfaces
  const secSurf = section('surfaces', 'Surfaces', 'What sits behind the work: pads, grounds and the frames around images.');
  optionGrid(secSurf, 'Dock pads', PADS, () => spec.surface.pad, id => { spec.surface.pad = id; },
    o => `<span class="ts-s-pad" style="background:${o.bg};box-shadow:${o.shadow}"><i></i><i></i></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Gallery ground', PATTERNS, () => spec.surface.ground, id => { spec.surface.ground = id; },
    o => `<span class="ts-s-pat" style="background:${o.css.split(INK).join('color-mix(in srgb, var(--text-primary) 14%, transparent)')}, var(--bg-base)"></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Image mat', PATTERNS, () => spec.surface.mat, id => { spec.surface.mat = id; },
    o => `<span class="ts-s-pat ts-s-mat" style="background:${o.css.split(INK).join('color-mix(in srgb, var(--text-primary) 20%, transparent)')}, var(--bg-base)"><i></i></span>`,
    'ts-opts-compact', 'Letterbox behind images');
  optionGrid(secSurf, 'Active tab', TABS, () => spec.surface.tab, id => { spec.surface.tab = id; },
    o => `<span class="ts-s-tabs"><span style="background:${o.bg};color:${o.fg};border-bottom-color:${o.line};box-shadow:${o.shadow};border-radius:${o.r}">Gallery</span><span>Stats</span></span>`,
    'ts-opts-wide');
  optionGrid(secSurf, 'Top bar edge', TOPBARS, () => spec.surface.topbar, id => { spec.surface.topbar = id; },
    o => `<span class="ts-s-top" style="border-bottom:${o.border};border-image:${o.bimg}"></span>`, 'ts-opts-compact');
  optionGrid(secSurf, 'Primary buttons', PRIMARIES, () => spec.surface.primary, id => { spec.surface.primary = id; },
    o => `<span class="ts-s-btn" style="background:${o.bg};color:${o.fg};border-color:${o.bd}">Open</span>`, 'ts-opts-compact');

  // Section jump highlight follows the scroll.
  const secEls = Array.from(sectionsEl.querySelectorAll<HTMLElement>('.ts-section'));
  function syncJump(): void {
    const top = editEl.scrollTop + jumpEl.offsetHeight + 24;
    let cur = secEls[0];
    for (const s of secEls) if (s.offsetTop <= top) cur = s;
    if (editEl.scrollTop + editEl.clientHeight >= editEl.scrollHeight - 4) cur = secEls[secEls.length - 1];
    jumpEl.querySelectorAll<HTMLElement>('.ts-jump-btn').forEach(b => b.classList.toggle('on', b.dataset.sec === cur.id));
  }
  editEl.addEventListener('scroll', syncJump, { passive: true });

  // ------------------------------------------------------------ presets

  const PRESET_KEYS = [...THEME_VARS.map(([k]) => k), '--sans', '--mono', '--display', '--head-font', '--tab-font',
    '--brand-size', '--brand-case', '--tab-case', '--head-case', '--btn-case', '--btn-weight',
    '--r-ctl', '--r-chip', '--r-card', '--r-panel', '--r-check', '--icon-stroke', '--icon-cap', ...RAW_KEYS];

  // Reads a theme's real tokens by flipping the preview document's
  // data-theme for one synchronous style read (no paint happens between).
  function readThemeTokens(themeId: string): Record<string, string> | null {
    if (!pdoc) return null;
    const root = pdoc.documentElement;
    const prevStyle = root.getAttribute('style');
    root.removeAttribute('style');
    root.setAttribute('data-theme', themeId);
    const cs = (pdoc.defaultView || window).getComputedStyle(root);
    const out: Record<string, string> = {};
    for (const k of PRESET_KEYS) out[k] = cs.getPropertyValue(k).trim();
    root.setAttribute('data-theme', 'custom');
    if (prevStyle !== null) root.setAttribute('style', prevStyle);
    return out;
  }
  const firstFamily = (stack: string) => (stack.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '');

  function specFromTokens(tok: Record<string, string>, themeId: string, name: string): ThemeSpec {
    const d = defaultSpec();
    const colors: Record<string, string> = {};
    for (const [k] of THEME_VARS){ const c = tok[k]; colors[k] = HEX_RE.test(c) ? c.toLowerCase() : toHex6(c || '#000'); }
    const raw: Record<string, string> = {};
    for (const k of RAW_KEYS){ const s = safeRaw(tok[k]); if (s) raw[k] = s; }
    const premium = themeAlreadyHasPremiumEffects(themeId) || deps.getRefinedThemes().includes(themeId);
    const stroke = parseFloat(tok['--icon-stroke']) || 1.75;
    return normalizeSpec({
      name: `${name} remix`,
      colors,
      fonts: {
        ui: firstFamily(tok['--sans']), display: firstFamily(tok['--display']), head: firstFamily(tok['--head-font']),
        tab: firstFamily(tok['--tab-font']), mono: firstFamily(tok['--mono']),
      },
      type: {
        brandSize: parseFloat(tok['--brand-size']) || d.type.brandSize, btnWeight: parseInt(tok['--btn-weight'], 10) || d.type.btnWeight,
        capsTabs: tok['--tab-case'] === 'uppercase', capsHeads: tok['--head-case'] === 'uppercase',
        capsButtons: tok['--btn-case'] === 'uppercase', capsBrand: tok['--brand-case'] === 'uppercase',
      },
      shape: { ctl: tok['--r-ctl'], chip: tok['--r-chip'], card: tok['--r-card'], panel: tok['--r-panel'], check: tok['--r-check'] },
      icons: { stroke: stroke < 1.5 ? 'thin' : stroke > 2 ? 'bold' : 'regular', cap: tok['--icon-cap'] === 'square' ? 'square' : 'round' },
      fx: { fill: premium && raw['--fx-fill'] ? 'preset' : 'none', tint: 'flair', card: premium && raw['--fx-card-t'] ? 'preset' : 'none', depth: raw['--card-shadow'] ? 'preset' : 'soft' },
      surface: { ...d.surface, mat: raw['--mat'] ? 'preset' : 'dots', pad: 'flat' },
      raw,
    });
  }

  function loadPreset(themeId: string, name: string): void {
    const tok = readThemeTokens(themeId);
    if (!tok) return;
    spec = specFromTokens(tok, themeId, name);
    changed();
    nameInput.value = spec.name;
    toast(`Started from ${name}. Its signature textures stay with the original.`, 3200);
  }

  function fillPresetSwatches(): void {
    for (const p of presetList){
      const tok = readThemeTokens(p.id);
      if (tok) p.sw = [tok['--bg-base'], tok['--bg-panel'], tok['--accent-manual'], tok['--accent-flair']].map(c => c || 'transparent');
    }
    renderPresets();
  }

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
    if (file.size > 200_000){ toast('That file is too large to be a theme.'); return; }
    try {
      const data = JSON.parse(await file.text());
      const payload = data && data.kind === THEME_FILE_KIND ? data.spec : null;
      if (!payload){ toast('Not a theme file. Export one from Theme Studio (Osmium Workshop or Comfy Bridge).', 3600); return; }
      spec = normalizeSpec(payload);
      changed();
      toast(`Imported "${spec.name}". Save & apply to keep it.`);
    } catch {
      toast('Couldn’t read that file as a theme (invalid JSON).', 3200);
    }
  });
  q('.ts-export').addEventListener('click', async () => {
    const payload = JSON.stringify({ kind: THEME_FILE_KIND, version: 1, app: 'osmium-workshop', spec }, null, 2);
    const slug = spec.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theme';
    const suggestedName = `${slug}.theme.json`;
    if (hasSaveFilePicker()){
      try {
        const handle = await pickSaveFile({ suggestedName, types: [{ description: 'Theme file', accept: { 'application/json': ['.json'] } }] });
        await writeBytes(handle, payload);
        toast(`Exported "${spec.name}".`);
      } catch { /* cancelled */ }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    a.download = suggestedName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  // ------------------------------------------------------------ footer

  nameInput.addEventListener('input', () => { spec.name = nameInput.value.trim().slice(0, 40) || 'My theme'; dirty = true; syncFooter(); });
  q('.ts-reset').addEventListener('click', () => { spec = defaultSpec(); changed(); });
  q('.ts-cancel').addEventListener('click', () => { void tryClose(); });
  q('.ts-close').addEventListener('click', () => { void tryClose(); });
  let saveMode: 'save' | 'copy' = 'save';
  q('.ts-save-copy').addEventListener('click', () => { saveMode = 'copy'; saveBtn.click(); });
  saveBtn.addEventListener('click', async () => {
    const asCopy = saveMode === 'copy';
    saveMode = 'save';
    const due = pendingUnlocks();
    if (due.length){
      const total = due.reduce((n, u) => n + u.price, 0);
      const wallet = deps.getWallet();
      const names = due.length === 1 ? `the ${due[0].label}` : due.map(u => `${u.label} (${u.price})`).join(' and ');
      if (wallet < total){
        toast(`${names} needs ${total} Edibits; you have ${wallet}. Pick a free effect, or earn more and come back.`, 4200);
        return;
      }
      const ok = await showConfirmModal(`Unlock ${names} for ${total} Edibits?\nYou have ${wallet}. Once unlocked, it's yours for every Custom theme.`, { okLabel: `Unlock for ${total}` });
      if (!ok) return;
      if (!deps.spendEdibits(total)){ toast('Not enough Edibits for that yet.'); return; }
      setJSON(FX_OWNED_KEY, [...ownedFx(), ...due.map(u => u.key)]);
    }
    if (asCopy || !currentId){
      const item: LibItem = { id: newLibId(), spec: JSON.parse(JSON.stringify(spec)) };
      if (asCopy && currentId && item.spec.name === library.find(i => i.id === currentId)?.spec.name) item.spec.name = `${item.spec.name} copy`.slice(0, 40);
      library.push(item);
      currentId = item.id;
    } else {
      library = library.map(i => i.id === currentId ? { id: i.id, spec: JSON.parse(JSON.stringify(spec)) } : i);
    }
    writeLibrary(library);
    persistActive(library.find(i => i.id === currentId)!);
    setString('dts-theme', 'custom');
    themeSelect.value = 'custom';
    refreshCustomOptionLabel();
    // index.ts's change handler applies it (applyTheme) and refreshes the
    // menu label and the Refine Theme button, same as picking it by hand.
    themeSelect.dispatchEvent(new Event('change'));
    deps.onSaved();
    dirty = false;
    close();
    toast(`"${spec.name}" applied.`);
  });

  async function tryClose(): Promise<void> {
    if (openPopover){ closePopover(); return; }
    if (dirty){
      const ok = await showConfirmModal('Discard your unsaved theme changes?', { okLabel: 'Discard', cancelLabel: 'Keep editing', danger: true });
      if (!ok) return;
    }
    close();
  }

  // ------------------------------------------------------------ tabs + go

  for (const t of PREVIEW_TABS){
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ts-ptab';
    b.dataset.tab = t.id;
    b.setAttribute('role', 'tab');
    b.innerHTML = `${iconSvg(t.icon, 'ic-lead')}${esc(t.label)}`;
    b.addEventListener('click', () => { if (previewTab !== t.id) showPreviewTab(t.id); });
    tabsEl.appendChild(b);
  }
  tabsEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowRight' && ev.key !== 'ArrowLeft') return;
    const i = PREVIEW_TABS.findIndex(t => t.id === previewTab);
    const n = PREVIEW_TABS[(i + (ev.key === 'ArrowRight' ? 1 : PREVIEW_TABS.length - 1)) % PREVIEW_TABS.length];
    showPreviewTab(n.id);
    tabsEl.querySelector<HTMLElement>(`[data-tab="${n.id}"]`)?.focus();
    ev.preventDefault();
  });

  renderLibrary();
  renderPresets();
  buildPreviewDoc();
  syncAll();
  syncJump();
  requestAnimationFrame(fitFrame);
  void backdrop;
}

function currentAppTab(): PreviewTab {
  const on = (id: string) => document.getElementById(id)?.classList.contains('active');
  if (on('tabDatasetManager')) return 'datasets';
  if (on('tabMasterTags')) return 'master';
  if (on('tabStats')) return 'stats';
  if (on('tabSynthDat')) return 'synthdat';
  return 'gallery';
}

// With no dataset loaded, the gallery is only a drop hint — show a handful
// of sample cards instead, so chips, cards, mats and states all have
// something to land on. Images are tiny inline SVG studies (neutral hues so
// they don't argue with the palette being built).
function seedSampleGallery(app: HTMLElement): void {
  const grid = app.querySelector<HTMLElement>('#galleryGrid');
  if (!grid || grid.querySelector('.card')) return;
  const hint = app.querySelector<HTMLElement>('#dropHintWrap');
  if (hint) hint.style.display = 'none';
  const toolbar = app.querySelector<HTMLElement>('#galleryToolbar');
  if (toolbar) toolbar.style.display = 'flex';
  grid.style.display = '';
  const art = (a: string, b: string, shape: string, w = 300, h = 400) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>${shape}</svg>`);
  const samples: { img: string; name: string; tags: string[]; cls?: string; chip?: Record<number, string>; ghosts?: [string, 'void' | 'merge'][] }[] = [
    { img: art('#8d7b6a', '#3d342c', '<circle cx="150" cy="170" r="70" fill="#e9dccb" opacity=".85"/><rect x="60" y="260" width="180" height="110" rx="40" fill="#5d4c3d"/>'), name: 'portrait_014.png',
      tags: ['1girl', 'red hair', 'looking at viewer', 'smile', 'upper body'], chip: { 1: 'chip-match' }, ghosts: [['blurry', 'void'], ['ginger hair', 'merge']] },
    { img: art('#6f8795', '#27343d', '<path d="M0 300 L90 190 L170 260 L240 170 L300 230 L300 400 L0 400Z" fill="#1d262c"/><circle cx="220" cy="90" r="30" fill="#e8e4d8"/>', 300, 220), name: 'landscape_03.png',
      tags: ['scenery', 'mountain', 'night sky', 'moon'], cls: 'dirty' },
    { img: art('#9a9486', '#4b4840', '<rect x="80" y="80" width="140" height="240" rx="70" fill="#d8d2c4" opacity=".8"/>'), name: 'study_22.png',
      tags: ['solo', 'long hair', 'white dress', 'standing', 'full body', 'outdoors'], chip: { 3: 'chip-isolated' } },
    { img: art('#7c8a78', '#2f372d', '<circle cx="110" cy="180" r="60" fill="#cfd8c5" opacity=".7"/><circle cx="200" cy="230" r="45" fill="#a9b59e" opacity=".7"/>', 300, 300), name: 'still_life_08.png',
      tags: ['no humans', 'still life', 'flower'], chip: { 2: 'chip-flagged-review' } },
    { img: art('#8b8196', '#352f3d', '<rect x="40" y="120" width="220" height="160" rx="12" fill="#d9d2e3" opacity=".7"/>'), name: 'interior_11.png', tags: [], cls: 'untagged' },
    { img: art('#94826f', '#443a30', '<circle cx="150" cy="150" r="90" fill="#efe3d0" opacity=".6"/>', 300, 360), name: 'portrait_031.png',
      tags: ['1boy', 'short hair', 'jacket', 'profile'] },
  ];
  grid.innerHTML = samples.map(s => `
    <div class="card${s.cls ? ' ' + s.cls : ''}">
      <div class="thumbwrap"><img src="${s.img}" alt=""><div class="filename">${esc(s.name)}</div>${s.cls === 'dirty' ? '<div class="dirtydot"></div>' : ''}</div>
      <div class="tagbox"><input type="text" class="addtag-input" placeholder="+ Add tag" tabindex="-1">
        <div class="chiprow">${s.tags.map((t, i) => `<span class="chip${s.chip && s.chip[i] ? ' ' + s.chip[i] : ''}${i === 0 && s.tags.length > 4 ? ' selected' : ''}"><span>${esc(t)}</span><button tabindex="-1">×</button></span>`).join('')}${(s.ghosts || []).map(([t, k]) => `<span class="chip chip-ghost chip-ghost-${k}">${k === 'merge' ? '<svg class="ic chip-ghost-ic" aria-hidden="true"><use href="#i-merge-in"></use></svg>' : ''}<span class="chip-ghost-label">${esc(t)}</span><button tabindex="-1">×</button></span>`).join('')}</div>
      </div>
    </div>`).join('');
  const setNum = (id: string, v: string) => { const el = app.querySelector<HTMLElement>('#' + id); if (el) el.textContent = v; };
  setNum('cardImages', '6');
  setNum('cardTags', '24');
}
