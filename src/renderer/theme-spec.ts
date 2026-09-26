// Theme Studio's model — pure data and functions, no DOM, no app imports.
// Shared by Osmium Workshop (src/renderer/theme-studio.ts) and Comfy Bridge,
// which gets a GENERATED copy (scripts/sync-theme-spec.js — edit this file,
// then re-run the sync). A spec only ever holds ids, hex colors, radius
// strings and bundled font names (plus sanitized passthrough from a copied
// theme), so a shared theme file can't smuggle in arbitrary CSS or url()s.
// compileSpec emits Osmium Workshop's var names; the Bridge maps them onto
// its own.

// The 16 color roles (Osmium Workshop's THEME_VARS order) and Studio's values.
export const SPEC_COLOR_KEYS = [
  '--bg-base', '--bg-panel', '--bg-elevated', '--bg-elevated-2', '--border-soft', '--border-strong',
  '--text-primary', '--text-muted', '--text-faint', '--accent-auto', '--accent-auto-dim', '--accent-manual',
  '--accent-manual-dim', '--accent-danger', '--accent-success', '--accent-flair'
];
export const SPEC_DEFAULT_COLORS: Record<string, string> = {
  '--bg-base': '#16151c', '--bg-panel': '#1c1a24', '--bg-elevated': '#252230', '--bg-elevated-2': '#2d2a38',
  '--border-soft': '#37324277', '--border-strong': '#4a4459', '--text-primary': '#ece8f0', '--text-muted': '#9791a6',
  '--text-faint': '#6b6578', '--accent-auto': '#e8a33d', '--accent-auto-dim': '#4a3c22', '--accent-manual': '#6fb8d1',
  '--accent-manual-dim': '#213842', '--accent-danger': '#e2637a', '--accent-success': '#7fbf8f', '--accent-flair': '#b98fd6'
};

// #rgb / #rgba / #rrggbb / #rrggbbaa -> #rrggbb.
export function hex6(hex: string): string {
  let h = (hex || '').trim().replace('#', '');
  if (h.length === 3 || h.length === 4) h = h.slice(0, 3).split('').map(c => c + c).join('');
  h = h.slice(0, 6);
  return /^[0-9a-f]{6}$/i.test(h) ? '#' + h.toLowerCase() : '#000000';
}

export interface ThemeSpec {
  name: string;
  colors: Record<string, string>;
  fonts: { ui: string; display: string; head: string; tab: string; mono: string };
  type: { brandSize: number; btnWeight: number; capsTabs: boolean; capsHeads: boolean; capsButtons: boolean; capsBrand: boolean };
  shape: { ctl: string; chip: string; card: string; panel: string; check: string };
  icons: { stroke: string; cap: string };
  fx: { fill: string; tint: string; card: string; depth: string };
  surface: { mat: string; ground: string; pad: string; tab: string; topbar: string; primary: string };
  // Copied-theme passthrough (fill, card lift, card depth, mat) for tokens
  // that don't reduce to one of the Studio's own options. Sanitized.
  raw: Record<string, string>;
}

export const THEME_FILE_KIND = 'osmium-theme';

export interface FontDef { name: string; kind: 'sans' | 'serif' | 'display' | 'mono'; }
export const FONTS: FontDef[] = [
  ...['Schibsted Grotesk', 'IBM Plex Sans', 'Albert Sans', 'Alegreya Sans', 'Anybody', 'Archivo', 'Barlow', 'Barlow Condensed',
    'Barlow Semi Condensed', 'Chakra Petch', 'Epilogue', 'Exo 2', 'Figtree', 'Fredoka', 'Jost', 'Karla', 'Nunito', 'Overpass',
    'Oxanium', 'Sora', 'Zen Kaku Gothic New', 'Zen Maru Gothic'].map(name => ({ name, kind: 'sans' as const })),
  ...['Alegreya', 'Cinzel', 'Eczar', 'Gilda Display', 'Gloock', 'IM Fell English SC', 'Libre Caslon Text', 'Marcellus SC',
    'Shippori Mincho'].map(name => ({ name, kind: 'serif' as const })),
  ...['Audiowide', 'Big Shoulders Display', 'Michroma', 'Pirata One', 'Poiret One', 'Saira Stencil One', 'VT323']
    .map(name => ({ name, kind: 'display' as const })),
  ...['JetBrains Mono', 'Courier Prime'].map(name => ({ name, kind: 'mono' as const })),
];
export const FALLBACK: Record<FontDef['kind'], string> = {
  sans: "'Segoe UI', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  display: "'Segoe UI', system-ui, sans-serif",
  mono: "'SFMono-Regular', Consolas, monospace",
};
export function fontStack(name: string, slot: 'ui' | 'mono'): string {
  const def = FONTS.find(f => f.name === name);
  if (!def) return slot === 'mono' ? FALLBACK.mono : FALLBACK.sans; // '' = the system face
  return `'${def.name}', ${FALLBACK[def.kind]}`;
}

export interface Opt { id: string; label: string; }
export const SHAPES: (Opt & { r: string })[] = [
  { id: 'square', label: 'Square', r: '0px' },
  { id: 'soft', label: 'Soft', r: '4px' },
  { id: 'rounded', label: 'Rounded', r: '9px' },
  { id: 'pill', label: 'Pill', r: '999px' },
  { id: 'leaf', label: 'Leaf', r: '12px 2px 12px 2px' },
  { id: 'tab', label: 'Tab', r: '9px 9px 2px 2px' },
];
export const CHECKS: (Opt & { r: string })[] = [
  { id: 'square', label: 'Square', r: '1px' },
  { id: 'soft', label: 'Soft', r: '4px' },
  { id: 'round', label: 'Round', r: '50%' },
];
export const STROKES: (Opt & { w: string })[] = [
  { id: 'thin', label: 'Fine', w: '1.25' }, { id: 'regular', label: 'Regular', w: '1.75' }, { id: 'bold', label: 'Heavy', w: '2.3' },
];
export const CAPS: Opt[] = [{ id: 'round', label: 'Rounded' }, { id: 'square', label: 'Sharp' }];
export const TINTS: Opt[] = [{ id: 'flair', label: 'Flair' }, { id: 'manual', label: 'Manual' }, { id: 'auto', label: 'Auto' }];

export const T = 'var(--c-tint)'; // placeholder, swapped for the chosen accent at compile time
// `tier`: the shop tier an effect belongs to. Hover-fills and card hovers are
// natively an epic/legendary-theme feature, so in Osmium Workshop each one
// costs that tier's theme price in Edibits, once, to save onto Custom
// (theme-studio.ts). Comfy Bridge has no economy and ignores it.
export type EffectTier = 'epic' | 'legendary';
export interface FillDef extends Opt { fill: string; o: string; top: string; h: string; w: string; tier?: EffectTier; }
export const FILLS: FillDef[] = [
  { id: 'none', label: 'None', fill: 'none', o: '0', top: '0', h: '100%', w: '0' },
  { id: 'wash', label: 'Wash', fill: T, o: '0.22', top: '0', h: '100%', w: '0.75', tier: 'epic' },
  { id: 'flood', label: 'Flood', fill: T, o: '0.32', top: '0', h: '100%', w: '1', tier: 'epic' },
  { id: 'underline', label: 'Underline', fill: T, o: '1', top: 'calc(100% - 2px)', h: '2px', w: '1', tier: 'epic' },
  { id: 'sweep', label: 'Sweep', fill: `linear-gradient(90deg, color-mix(in srgb, ${T} 8%, transparent), ${T})`, o: '0.42', top: '0', h: '100%', w: '1', tier: 'legendary' },
  { id: 'glint', label: 'Glint', fill: `linear-gradient(115deg, transparent 25%, ${T} 50%, transparent 75%)`, o: '0.36', top: '0', h: '100%', w: '1', tier: 'legendary' },
  { id: 'glow', label: 'Glow', fill: `radial-gradient(ellipse at 0% 50%, ${T}, transparent 75%)`, o: '0.4', top: '0', h: '100%', w: '1', tier: 'legendary' },
  { id: 'scan', label: 'Scanlines', fill: `repeating-linear-gradient(0deg, ${T} 0 1px, transparent 1px 3px)`, o: '0.5', top: '0', h: '100%', w: '1', tier: 'epic' },
  { id: 'stripes', label: 'Stripes', fill: `repeating-linear-gradient(-45deg, ${T} 0 6px, transparent 6px 12px)`, o: '0.3', top: '0', h: '100%', w: '1', tier: 'epic' },
];
export interface CardFxDef extends Opt { t: string; s: string; tier?: EffectTier; }
export const CARD_FX: CardFxDef[] = [
  { id: 'none', label: 'Still', t: 'none', s: 'var(--card-shadow)' },
  { id: 'lift', label: 'Lift', t: 'translateY(-3px)', s: '0 12px 24px color-mix(in srgb, var(--bg-base) 55%, transparent)', tier: 'epic' },
  { id: 'tilt', label: 'Tilt', t: 'translateY(-3px) rotate(-0.6deg)', s: '0 12px 24px color-mix(in srgb, var(--bg-base) 55%, transparent)', tier: 'epic' },
  { id: 'ring', label: 'Ring', t: 'none', s: `0 0 0 1px ${T}, 0 8px 20px color-mix(in srgb, var(--bg-base) 45%, transparent)`, tier: 'legendary' },
];
export const DEPTHS: (Opt & { s: string })[] = [
  { id: 'flat', label: 'Flat', s: 'none' },
  { id: 'soft', label: 'Soft', s: '0 1px 2px rgba(0,0,0,0.25)' },
  { id: 'raised', label: 'Raised', s: '0 6px 16px color-mix(in srgb, var(--bg-base) 60%, transparent)' },
  { id: 'rim', label: 'Rim', s: 'inset 0 1px 0 color-mix(in srgb, var(--text-primary) 9%, transparent)' },
];

// Patterns share one vocabulary between the image mat and the gallery ground;
// INK is swapped for a color-mix of --text-primary at each use's own weight.
export const INK = 'var(--c-ink)';
export const PATTERNS: (Opt & { css: string })[] = [
  { id: 'plain', label: 'Plain', css: 'none' },
  { id: 'dots', label: 'Pegboard', css: `radial-gradient(circle, ${INK} 1.1px, transparent 1.6px) 0 0 / 16px 16px` },
  { id: 'field', label: 'Dot field', css: `radial-gradient(circle at 1px 1px, ${INK} 1px, transparent 1.5px) 0 0 / 9px 9px` },
  { id: 'grid', label: 'Grid', css: `linear-gradient(${INK} 1px, transparent 1px) 0 0 / 20px 20px, linear-gradient(90deg, ${INK} 1px, transparent 1px) 0 0 / 20px 20px` },
  { id: 'hatch', label: 'Hatch', css: `repeating-linear-gradient(-45deg, ${INK} 0 1px, transparent 1px 7px)` },
  { id: 'lattice', label: 'Lattice', css: `repeating-linear-gradient(45deg, ${INK} 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, ${INK} 0 1px, transparent 1px 14px)` },
  { id: 'scan', label: 'Scanlines', css: `repeating-linear-gradient(0deg, ${INK} 0 1px, transparent 1px 3px)` },
  { id: 'rings', label: 'Rings', css: `repeating-radial-gradient(circle at 50% 50%, ${INK} 0 1px, transparent 1px 11px)` },
  { id: 'checker', label: 'Checker', css: `conic-gradient(${INK} 25%, transparent 0 50%, ${INK} 0 75%, transparent 0) 0 0 / 16px 16px` },
];
export interface PadDef extends Opt { bg: string; shadow: string; }
export const PADS: PadDef[] = [
  { id: 'flat', label: 'Flat', bg: 'var(--bg-elevated)', shadow: 'none' },
  { id: 'lit', label: 'Lit edge', bg: 'var(--bg-elevated)', shadow: 'inset 0 1px 0 color-mix(in srgb, var(--text-primary) 7%, transparent), 0 1px 0 rgba(0,0,0,0.25)' },
  { id: 'gradient', label: 'Gradient', bg: 'linear-gradient(180deg, var(--bg-elevated-2), var(--bg-elevated) 70%)', shadow: 'none' },
  { id: 'sunken', label: 'Sunken', bg: 'var(--bg-panel)', shadow: 'inset 0 1px 4px color-mix(in srgb, var(--bg-base) 70%, transparent)' },
  { id: 'glass', label: 'Outline', bg: 'transparent', shadow: 'none' },
  { id: 'tinted', label: 'Tinted', bg: 'color-mix(in srgb, var(--accent-flair) 7%, var(--bg-elevated))', shadow: 'none' },
];
export interface TabDef extends Opt { bg: string; fg: string; line: string; shadow: string; r: string; }
export const TABS: TabDef[] = [
  { id: 'underline', label: 'Underline', bg: 'transparent', fg: 'var(--accent-flair)', line: 'var(--accent-flair)', shadow: 'none', r: '0' },
  { id: 'pill', label: 'Pill', bg: 'color-mix(in srgb, var(--accent-flair) 18%, transparent)', fg: 'var(--text-primary)', line: 'transparent', shadow: 'none', r: '999px' },
  { id: 'block', label: 'Block', bg: 'var(--accent-flair)', fg: 'var(--bg-base)', line: 'var(--accent-flair)', shadow: 'none', r: '6px 6px 0 0' },
  { id: 'dot', label: 'Dot', bg: 'radial-gradient(circle at 50% calc(100% - 5px), var(--accent-flair) 2.5px, transparent 3px)', fg: 'var(--text-primary)', line: 'transparent', shadow: 'none', r: '0' },
  { id: 'overline', label: 'Overline', bg: 'color-mix(in srgb, var(--accent-flair) 8%, transparent)', fg: 'var(--text-primary)', line: 'transparent', shadow: 'inset 0 2px 0 var(--accent-flair)', r: '0' },
];
export interface TopDef extends Opt { border: string; bimg: string; }
export const TOPBARS: TopDef[] = [
  { id: 'flair', label: 'Flair rule', border: '2px solid var(--accent-flair)', bimg: 'none' },
  { id: 'manual', label: 'Accent rule', border: '2px solid var(--accent-manual)', bimg: 'none' },
  { id: 'strip', label: 'Tri-strip', border: '3px solid var(--accent-flair)', bimg: 'linear-gradient(90deg, var(--accent-auto) 0 33.3%, var(--accent-manual) 33.3% 66.6%, var(--accent-flair) 66.6%) 1' },
  { id: 'fade', label: 'Fade', border: '2px solid var(--accent-flair)', bimg: 'linear-gradient(90deg, transparent, var(--accent-flair) 30%, var(--accent-flair) 70%, transparent) 1' },
  { id: 'hairline', label: 'Hairline', border: '1px solid var(--border-strong)', bimg: 'none' },
];
export interface PriDef extends Opt { bg: string; fg: string; bd: string; hover: string; }
export const PRIMARIES: PriDef[] = [
  { id: 'tinted', label: 'Tinted', bg: 'var(--accent-manual-dim)', fg: 'var(--accent-manual)', bd: 'var(--accent-manual)', hover: 'color-mix(in srgb, var(--accent-manual) 35%, var(--bg-panel))' },
  { id: 'solid', label: 'Solid', bg: 'var(--accent-manual)', fg: 'var(--bg-base)', bd: 'var(--accent-manual)', hover: 'color-mix(in srgb, var(--accent-manual) 82%, var(--text-primary))' },
  { id: 'outline', label: 'Outline', bg: 'transparent', fg: 'var(--accent-manual)', bd: 'var(--accent-manual)', hover: 'color-mix(in srgb, var(--accent-manual) 14%, transparent)' },
  { id: 'ink', label: 'Ink', bg: 'var(--text-primary)', fg: 'var(--bg-base)', bd: 'var(--text-primary)', hover: 'color-mix(in srgb, var(--text-primary) 82%, var(--bg-base))' },
];

export const COLOR_GROUPS: { title: string; keys: [string, string][] }[] = [
  { title: 'Surfaces', keys: [['--bg-base', 'Ground'], ['--bg-panel', 'Panels'], ['--bg-elevated', 'Raised'], ['--bg-elevated-2', 'Raised, hover']] },
  { title: 'Rules', keys: [['--border-soft', 'Soft rule'], ['--border-strong', 'Strong rule']] },
  { title: 'Text', keys: [['--text-primary', 'Ink'], ['--text-muted', 'Muted'], ['--text-faint', 'Faint']] },
  { title: 'Accents', keys: [['--accent-manual', 'Manual'], ['--accent-manual-dim', 'Manual tint'], ['--accent-auto', 'Auto'],
    ['--accent-auto-dim', 'Auto tint'], ['--accent-flair', 'Flair'], ['--accent-danger', 'Danger'], ['--accent-success', 'Success']] },
];
// Contrast floors mirror the night-mode guard in index.html (7 / 4.5 / 3).
export const CONTRAST: Record<string, { against: string; floor: number }> = {
  '--text-primary': { against: '--bg-panel', floor: 7 },
  '--text-muted': { against: '--bg-panel', floor: 4.5 },
  '--text-faint': { against: '--bg-panel', floor: 3 },
  '--accent-manual': { against: '--accent-manual-dim', floor: 4.5 },
  '--accent-auto': { against: '--accent-auto-dim', floor: 4.5 },
};

export function defaultSpec(): ThemeSpec {
  return {
    name: 'My theme',
    colors: { ...SPEC_DEFAULT_COLORS },
    fonts: { ui: 'Schibsted Grotesk', display: 'Schibsted Grotesk', head: 'Schibsted Grotesk', tab: 'Schibsted Grotesk', mono: 'JetBrains Mono' },
    type: { brandSize: 17, btnWeight: 500, capsTabs: false, capsHeads: false, capsButtons: false, capsBrand: false },
    shape: { ctl: '6px', chip: '5px', card: '8px', panel: '10px', check: '4px' },
    icons: { stroke: 'regular', cap: 'round' },
    fx: { fill: 'none', tint: 'flair', card: 'none', depth: 'soft' },
    surface: { mat: 'dots', ground: 'plain', pad: 'lit', tab: 'underline', topbar: 'flair', primary: 'tinted' },
    raw: {},
  };
}

// ---------------------------------------------------------------- validation

export const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
export const RADIUS_RE = /^\d{1,3}(?:\.\d+)?(?:px|%)(?: \d{1,3}(?:\.\d+)?(?:px|%)){0,3}$/;
// Raw passthrough values come from our own stylesheet (a copied theme) or a
// shared file. Custom properties can't escape their declaration, but a url()
// would fetch — so: a narrow character set, no url/image functions, capped.
export function safeRaw(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s || s.length > 700) return null;
  if (!/^[\w\s#%().,\-/:+*]+$/.test(s)) return null;
  if (/url|image|src|expression|attr/i.test(s)) return null;
  return s;
}
export const RAW_KEYS = ['--fx-fill', '--fx-o', '--fx-top', '--fx-h', '--fx-w', '--fx-card-t', '--fx-card-s', '--card-shadow', '--mat'];

export function pick<T extends Opt>(list: T[], id: unknown, fallback: string): string {
  return typeof id === 'string' && list.some(o => o.id === id) ? id : fallback;
}
export function pickOrPreset<T extends Opt>(list: T[], id: unknown, fallback: string, raw: Record<string, string>, rawKey: string): string {
  if (id === 'preset' && raw[rawKey]) return 'preset';
  return pick(list, id, fallback);
}
export function num(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
}
export function radius(v: unknown, fallback: string): string {
  return typeof v === 'string' && RADIUS_RE.test(v.trim()) ? v.trim() : fallback;
}
export function fontName(v: unknown, fallback: string): string {
  if (v === '') return '';
  return typeof v === 'string' && FONTS.some(f => f.name === v) ? v : fallback;
}

// Anything (a saved spec, an imported file, an older build's output) → a
// complete, valid spec. Unknown keys are dropped; bad values fall back.
export function normalizeSpec(input: unknown): ThemeSpec {
  const d = defaultSpec();
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, any>;
  const raw: Record<string, string> = {};
  if (o.raw && typeof o.raw === 'object'){
    for (const k of RAW_KEYS){ const s = safeRaw(o.raw[k]); if (s) raw[k] = s; }
  }
  const colors: Record<string, string> = { ...d.colors };
  if (o.colors && typeof o.colors === 'object'){
    for (const k of SPEC_COLOR_KEYS){ const c = o.colors[k]; if (typeof c === 'string' && HEX_RE.test(c.trim())) colors[k] = c.trim().toLowerCase(); }
  }
  const f = o.fonts || {}, t = o.type || {}, sh = o.shape || {}, ic = o.icons || {}, fx = o.fx || {}, su = o.surface || {};
  return {
    name: typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 40) : d.name,
    colors,
    fonts: {
      ui: fontName(f.ui, d.fonts.ui), display: fontName(f.display, d.fonts.display), head: fontName(f.head, d.fonts.head),
      tab: fontName(f.tab, d.fonts.tab), mono: fontName(f.mono, d.fonts.mono),
    },
    type: {
      brandSize: num(t.brandSize, 12, 28, d.type.brandSize), btnWeight: Math.round(num(t.btnWeight, 300, 800, d.type.btnWeight) / 100) * 100,
      capsTabs: !!t.capsTabs, capsHeads: !!t.capsHeads, capsButtons: !!t.capsButtons, capsBrand: !!t.capsBrand,
    },
    shape: {
      ctl: radius(sh.ctl, d.shape.ctl), chip: radius(sh.chip, d.shape.chip), card: radius(sh.card, d.shape.card),
      panel: radius(sh.panel, d.shape.panel), check: radius(sh.check, d.shape.check),
    },
    icons: { stroke: pick(STROKES, ic.stroke, d.icons.stroke), cap: pick(CAPS, ic.cap, d.icons.cap) },
    fx: {
      fill: pickOrPreset(FILLS, fx.fill, d.fx.fill, raw, '--fx-fill'), tint: pick(TINTS, fx.tint, d.fx.tint),
      card: pickOrPreset(CARD_FX, fx.card, d.fx.card, raw, '--fx-card-t'), depth: pickOrPreset(DEPTHS, fx.depth, d.fx.depth, raw, '--card-shadow'),
    },
    surface: {
      mat: pickOrPreset(PATTERNS, su.mat, d.surface.mat, raw, '--mat'), ground: pick(PATTERNS, su.ground, d.surface.ground),
      pad: pick(PADS, su.pad, d.surface.pad), tab: pick(TABS, su.tab, d.surface.tab),
      topbar: pick(TOPBARS, su.topbar, d.surface.topbar), primary: pick(PRIMARIES, su.primary, d.surface.primary),
    },
    raw,
  };
}

// ---------------------------------------------------------------- compile

export function compileSpec(spec: ThemeSpec): Record<string, string> {
  const v: Record<string, string> = { ...spec.colors };
  const tint = `var(--accent-${spec.fx.tint})`;
  const tinted = (s: string) => s.split(T).join(tint);
  const inked = (s: string, pct: number) => s.split(INK).join(`color-mix(in srgb, var(--text-primary) ${pct}%, transparent)`);

  v['--sans'] = fontStack(spec.fonts.ui, 'ui');
  v['--display'] = fontStack(spec.fonts.display, 'ui');
  v['--head-font'] = fontStack(spec.fonts.head, 'ui');
  v['--tab-font'] = fontStack(spec.fonts.tab, 'ui');
  v['--mono'] = fontStack(spec.fonts.mono, 'mono');

  const caps = (on: boolean, track: string) => on ? ['uppercase', track] : ['none', '0'];
  [v['--tab-case'], v['--tab-track']] = caps(spec.type.capsTabs, '0.07em');
  [v['--head-case'], v['--head-track']] = caps(spec.type.capsHeads, '0.08em');
  [v['--btn-case'], v['--btn-track']] = caps(spec.type.capsButtons, '0.05em');
  [v['--brand-case'], v['--brand-track']] = caps(spec.type.capsBrand, '0.06em');
  if (!spec.type.capsBrand) v['--brand-track'] = '-0.015em';
  v['--brand-size'] = `${spec.type.brandSize}px`;
  v['--brand-weight'] = '800';
  v['--btn-weight'] = String(spec.type.btnWeight);

  v['--r-ctl'] = spec.shape.ctl;
  v['--r-chip'] = spec.shape.chip;
  v['--r-card'] = spec.shape.card;
  v['--r-panel'] = spec.shape.panel;
  v['--r-check'] = spec.shape.check;
  v['--r-scroll'] = spec.shape.ctl === '999px' ? '999px' : '6px';

  v['--icon-stroke'] = (STROKES.find(s => s.id === spec.icons.stroke) || STROKES[1]).w;
  v['--icon-cap'] = spec.icons.cap;
  v['--icon-join'] = spec.icons.cap === 'square' ? 'miter' : 'round';

  if (spec.fx.fill === 'preset'){
    for (const k of ['--fx-fill', '--fx-o', '--fx-top', '--fx-h', '--fx-w']) if (spec.raw[k]) v[k] = spec.raw[k];
  } else {
    const fill = FILLS.find(f => f.id === spec.fx.fill) || FILLS[0];
    v['--fx-fill'] = tinted(fill.fill); v['--fx-o'] = fill.o; v['--fx-top'] = fill.top; v['--fx-h'] = fill.h; v['--fx-w'] = fill.w;
  }
  if (spec.fx.card === 'preset'){
    for (const k of ['--fx-card-t', '--fx-card-s']) if (spec.raw[k]) v[k] = spec.raw[k];
  } else {
    const card = CARD_FX.find(c => c.id === spec.fx.card) || CARD_FX[0];
    v['--fx-card-t'] = card.t; v['--fx-card-s'] = tinted(card.s);
  }
  v['--card-shadow'] = spec.fx.depth === 'preset' ? (spec.raw['--card-shadow'] || 'none')
    : (DEPTHS.find(d => d.id === spec.fx.depth) || DEPTHS[1]).s;
  v['--c-fx-on'] = (spec.fx.fill !== 'none' || spec.fx.card !== 'none') ? '1' : '0';

  v['--mat'] = spec.surface.mat === 'preset' ? (spec.raw['--mat'] || 'none')
    : inked((PATTERNS.find(p => p.id === spec.surface.mat) || PATTERNS[1]).css, 12);
  v['--c-ground'] = inked((PATTERNS.find(p => p.id === spec.surface.ground) || PATTERNS[0]).css, 6);
  const pad = PADS.find(p => p.id === spec.surface.pad) || PADS[0];
  v['--c-pad-bg'] = pad.bg; v['--c-pad-shadow'] = pad.shadow;
  const tab = TABS.find(t => t.id === spec.surface.tab) || TABS[0];
  v['--c-tab-bg'] = tab.bg; v['--c-tab-fg'] = tab.fg; v['--c-tab-line'] = tab.line; v['--c-tab-shadow'] = tab.shadow; v['--c-tab-r'] = tab.r;
  const top = TOPBARS.find(t => t.id === spec.surface.topbar) || TOPBARS[0];
  v['--c-top-border'] = top.border; v['--c-top-bimg'] = top.bimg;
  const pri = PRIMARIES.find(p => p.id === spec.surface.primary) || PRIMARIES[0];
  v['--c-pri-bg'] = pri.bg; v['--c-pri-fg'] = pri.fg; v['--c-pri-bd'] = pri.bd; v['--c-pri-hover'] = pri.hover;

  return v;
}

// ---------------------------------------------------------------- color math

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex6(hex).slice(1);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
export function luminance(hex: string): number {
  const c = hexToRgb(hex).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string): number {
  const A = luminance(a), B = luminance(b);
  return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05);
}
export function mixHex(a: string, b: string, t: number): string {
  const A = hexToRgb(a), B = hexToRgb(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

