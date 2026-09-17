import type { ThemeName } from './types';
import {
  favoritesPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel,
  themeVarRows, themeCustomPanel, themeSelect
} from './dom';
import { hidePanel, showPanel, toast, shrinkTextToFit } from './shared-ui';

export const THEME_VARS = [
  ['--bg-base','Background'],
  ['--bg-panel','Panel'],
  ['--bg-elevated','Elevated surface'],
  ['--bg-elevated-2','Elevated surface 2'],
  ['--border-soft','Border (soft)'],
  ['--border-strong','Border (strong)'],
  ['--text-primary','Primary text'],
  ['--text-muted','Muted text'],
  ['--text-faint','Faint text'],
  ['--accent-auto','Accent — auto/orange'],
  ['--accent-auto-dim','Accent — auto dim'],
  ['--accent-manual','Accent — manual/blue'],
  ['--accent-manual-dim','Accent — manual dim'],
  ['--accent-danger','Danger accent'],
  ['--accent-success','Success accent'],
  ['--accent-flair','Accent — flair (theme signature)']
];

export const STUDIO_DEFAULTS = {
  '--bg-base':'#16151c', '--bg-panel':'#1c1a24', '--bg-elevated':'#252230', '--bg-elevated-2':'#2d2a38',
  '--border-soft':'#373242', '--border-strong':'#4a4459', '--text-primary':'#ece8f0', '--text-muted':'#9791a6',
  '--text-faint':'#6b6578', '--accent-auto':'#e8a33d', '--accent-auto-dim':'#4a3c22', '--accent-manual':'#6fb8d1',
  '--accent-manual-dim':'#213842', '--accent-danger':'#e2637a', '--accent-success':'#7fbf8f', '--accent-flair':'#c98ed6'
};

export const PREMIUM_THEMES = [
  { id:'terminal', name:'Terminal Green', rarity:'common', price:40, swatches:['#050805','#00ff66','#ffcc00'] },
  { id:'sakura', name:'Sakura Dusk', rarity:'uncommon', price:90, swatches:['#241a20','#c9a6ff','#ffe3ef'] },
  { id:'bioluminescent', name:'Bioluminescent Deep', rarity:'rare', price:180, swatches:['#03080d','#26e0c9','#4fd6ff'] },
  { id:'amethyst', name:'Royal Amethyst', rarity:'epic', price:360, swatches:['#170b26','#c9a6ff','#e8c468'] },
  { id:'solarflare', name:'Solar Flare', rarity:'legendary', price:750, swatches:['#1a0800','#ff6a1f','#ffd166'] },
  { id:'midnight-ocean', name:'Midnight Ocean', rarity:'common', price:40, swatches:['#040c14','#3ddbd9','#f2a65a'] },
  { id:'arctic-frost', name:'Arctic Frost', rarity:'common', price:40, swatches:['#eef5fb','#2f7fb8','#8fd6ff'] },
  { id:'forest-moss', name:'Forest Moss', rarity:'common', price:40, swatches:['#0e130d','#7cb454','#d7b568'] },
  { id:'vintage-paper', name:'Vintage Paper', rarity:'common', price:40, swatches:['#f2e8d5','#6b4a2f','#a5432f'] },
  { id:'obsidian', name:'Obsidian', rarity:'common', price:40, swatches:['#0a0a0c','#7c9cff','#e0b060'] },
  { id:'retrowave', name:'Retro Wave', rarity:'uncommon', price:90, swatches:['#170826','#ff3ec8','#00e5ff'] },
  { id:'rose-gold', name:'Rose Gold', rarity:'uncommon', price:90, swatches:['#fbeef0','#c47a6f','#e0a45c'] },
  { id:'coral-reef', name:'Coral Reef', rarity:'uncommon', price:90, swatches:['#04191c','#ff7f6b','#4fd6a8'] },
  { id:'toxic-waste', name:'Toxic Waste', rarity:'uncommon', price:90, swatches:['#0a0f04','#8aff29','#f5ff3d'] },
  { id:'lavender-fields', name:'Lavender Fields', rarity:'uncommon', price:90, swatches:['#f2eefb','#7b5ea8','#c98ed6'] },
  { id:'candy-pop', name:'Candy Pop', rarity:'uncommon', price:90, swatches:['#fff5fa','#ff5fa2','#ffd23f'] },
  { id:'copper-forge', name:'Copper Forge', rarity:'rare', price:180, swatches:['#120e0b','#b0703f','#c98a4a'] },
  { id:'blood-moon', name:'Blood Moon', rarity:'rare', price:180, swatches:['#0e0505','#ff3b3b','#ffb300'] },
  { id:'twilight-garden', name:'Twilight Garden', rarity:'epic', price:360, swatches:['#0c1210','#4fd68f','#c9a6ff'] },
  { id:'aurora-borealis', name:'Aurora Borealis', rarity:'legendary', price:750, swatches:['#05080f','#7b5bff','#5cffb0'] },
  { id:'celestial-gold', name:'Celestial Gold', rarity:'legendary', price:750, swatches:['#0a0810','#e8c468','#ffd166'] }
];

let _toHex6Ctx: CanvasRenderingContext2D | null = null;
export function toHex6(colorStr: string): string {
  const ctx = _toHex6Ctx || (_toHex6Ctx = document.createElement('canvas').getContext('2d')!);
  ctx.fillStyle = '#000000';
  ctx.fillStyle = colorStr;
  const norm = ctx.fillStyle;
  if (norm[0] === '#') return norm.length >= 7 ? norm.slice(0,7) : norm;
  const m = norm.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m){
    const toH = (n: string) => Number(n).toString(16).padStart(2,'0');
    return '#' + toH(m[1]) + toH(m[2]) + toH(m[3]);
  }
  return '#000000';
}

export function getCurrentVarHex(key: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(key).trim();
  return toHex6(raw || '#000000');
}

export function clearCustomOverrides(): void {
  for (const [key] of THEME_VARS) document.documentElement.style.removeProperty(key);
}

export let dayNightOn = false;

// index.html's pre-paint inline script (see its own comment) applies the
// saved theme AND, if night mode was on, the night-mode inversion itself —
// entirely before any JS module runs, to avoid a flash of the wrong theme.
// index.ts's own startup init still needs to know night mode is "on" (so
// e.g. clicking the toggle afterward turns it OFF, not inverts an
// already-inverted display right back to day colors), but must NOT redo the
// actual inversion — that would double-invert. This syncs just the flag.
export function syncNightModeFromPrePaint(): void {
  dayNightOn = true;
}

export function applyTheme(theme: string): void {
  if (dayNightOn){
    dayNightOn = false;
    document.documentElement.classList.remove('night-mode');
    try { localStorage.setItem('dts-night-mode', '0'); } catch(e){}
  }
  if (theme === 'custom'){
    document.documentElement.setAttribute('data-theme', 'custom');
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('dts-custom-theme') || 'null'); } catch(e){}
    if (saved){
      for (const [key] of THEME_VARS){
        if (saved[key]) document.documentElement.style.setProperty(key, saved[key]);
      }
    } else {
      // first time picking "Custom" with nothing saved — open the editor to set it up
      setTimeout(openThemeCustomPanel, 0);
    }
  } else {
    clearCustomOverrides();
    document.documentElement.setAttribute('data-theme', theme);
  }
  // Refine Theme (achievements.ts's shop) lets ANY theme earn the epic/
  // legendary-tier hover-fill effect individually, without hardcoding a
  // 6th/7th/etc. theme name into the CSS selectors that already list
  // amethyst/solarflare/twilight-garden/aurora-borealis/celestial-gold —
  // this generic class is ORed in alongside those five in styles.css.
  document.documentElement.classList.toggle('theme-refined', refinedThemes.includes(theme));
  try { localStorage.setItem('dts-theme', theme); } catch(e){}
}

export let refinedThemes: string[] = [];
try { refinedThemes = JSON.parse(localStorage.getItem('dts-refined-themes') || '[]') || []; } catch { refinedThemes = []; }

export function saveRefinedThemes(): void {
  try { localStorage.setItem('dts-refined-themes', JSON.stringify(refinedThemes)); } catch(e){}
}

// A theme already at epic/legendary rarity (or already individually
// refined) has these effects for free — Refine Theme has nothing to sell it.
export function themeAlreadyHasPremiumEffects(themeId: string): boolean {
  const premium = PREMIUM_THEMES.find(t => t.id === themeId);
  const rarity = premium ? premium.rarity : 'free';
  return rarity === 'epic' || rarity === 'legendary' || refinedThemes.includes(themeId);
}

export function themeOriginalPrice(themeId: string): number {
  const premium = PREMIUM_THEMES.find(t => t.id === themeId);
  return premium ? premium.price : 0; // free built-in themes (and Custom) cost 0
}

// Derived from PREMIUM_THEMES rather than hardcoded, so a future price
// rebalance only needs to change one place.
export function epicThemePrice(): number {
  const epic = PREMIUM_THEMES.find(t => t.rarity === 'epic');
  return epic ? epic.price : 360;
}

export function refineThemeCost(themeId: string): number {
  return epicThemePrice() - themeOriginalPrice(themeId);
}

export function markThemeRefined(themeId: string): void {
  if (!refinedThemes.includes(themeId)) refinedThemes.push(themeId);
  saveRefinedThemes();
  document.documentElement.classList.add('theme-refined');
}

export function openThemeCustomPanel(): void {
  hidePanel(favoritesPanel);
  hidePanel(logPanel);
  hidePanel(achievementsPanel);
  hidePanel(shopPanel);
  hidePanel(tagDetailsPanel);
  themeVarRows.innerHTML = '';
  for (const [key, label] of THEME_VARS){
    const row = document.createElement('div');
    row.className = 'theme-var-row';
    const lbl = document.createElement('span');
    lbl.className = 'lbl';
    lbl.textContent = label;
    const input = document.createElement('input');
    input.type = 'color';
    input.value = getCurrentVarHex(key);
    input.dataset.varKey = key;
    input.addEventListener('input', () => {
      document.documentElement.style.setProperty(key, input.value);
    });
    row.appendChild(lbl);
    row.appendChild(input);
    themeVarRows.appendChild(row);
  }
  showPanel(themeCustomPanel);
}

export function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h, s, l = (max+min)/2;
  if (max === min){ h = 0; s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h = (g-b)/d + (g<b?6:0); break;
      case g: h = (b-r)/d + 2; break;
      default: h = (r-g)/d + 4;
    }
    h /= 6;
  }
  return [h*360, s*100, l*100];
}

export function hslToHex(h: number, s: number, l: number): string {
  h/=360; s/=100; l/=100;
  let r: number, g: number, b: number;
  if (s === 0){ r = g = b = l; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q-p)*6*t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q-p)*(2/3-t)*6;
      return p;
    };
    const q = l < 0.5 ? l*(1+s) : l+s-l*s;
    const p = 2*l - q;
    r = hue2rgb(p, q, h+1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h-1/3);
  }
  const toHex = (x: number) => Math.round(x*255).toString(16).padStart(2,'0');
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function invertLightness(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, 100 - l);
}

// The theme picker used to be a bare native <select>. Native <select>
// popups are OS-rendered: Chromium dismisses one the instant the mouse
// wheel scrolls anywhere outside it, and there is no JS event to intercept
// or prevent that (it isn't a click/blur our own listeners ever see) — so
// the list closed on scroll no matter what outside-click-detection logic
// index.ts's flyout guard used. #themeSelect stays in the DOM (hidden) as
// the plain value/option store every other module already reads and
// writes via .value / querySelector('option[...]'), and this builds a
// fully custom dropdown next to it — a plain positioned <div>, immune to
// the native-popup scroll-dismissal because nothing here listens for
// scroll at all. It only closes via its own toggle button or a genuine
// mousedown (left or right) outside it. Options are re-read from
// themeSelect.options on every open, so achievements.ts's lock-icon edits
// to those <option> elements (updateThemeSelectLocks()) show up next open
// with no extra wiring.
export function initThemeDropdown(container: HTMLElement): { refreshLabel: () => void } {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pdrop-btn';
  function currentLabel(): string {
    const opt = themeSelect.options[themeSelect.selectedIndex];
    return (opt ? opt.textContent : themeSelect.value) + ' ▾';
  }
  function setLabel(): void {
    btn.textContent = currentLabel();
    shrinkTextToFit(btn);
  }
  btn.textContent = currentLabel();
  let menuEl: HTMLElement | null = null;
  function onOutsideMouseDown(ev: MouseEvent): void {
    // Same html/body exclusion as the header-cat-flyout guard: a select's
    // own OS popup can resolve its click outside the page's element tree.
    if (ev.target === document.documentElement || ev.target === document.body) return;
    if (container.contains(ev.target as Node)) return;
    closeMenu();
  }
  function closeMenu(): void {
    if (!menuEl) return;
    menuEl.remove();
    menuEl = null;
    document.removeEventListener('mousedown', onOutsideMouseDown);
  }
  function openMenu(): void {
    menuEl = document.createElement('div');
    menuEl.className = 'pdrop-menu theme-pdrop-menu';
    for (const opt of Array.from(themeSelect.options)){
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'pdrop-item' + (opt.value === themeSelect.value ? ' active' : '');
      item.textContent = opt.textContent;
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        themeSelect.value = opt.value;
        themeSelect.dispatchEvent(new Event('change'));
        setLabel();
        menuEl!.querySelectorAll('.pdrop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // Deliberately stays open, matching this app's other persistent
        // dropdowns — only the toggle button or an outside click closes it.
      });
      menuEl.appendChild(item);
    }
    container.appendChild(menuEl);
    document.addEventListener('mousedown', onOutsideMouseDown);
    requestAnimationFrame(() => requestAnimationFrame(() => menuEl!.classList.add('menu-in')));
  }
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (menuEl) closeMenu(); else openMenu();
  });
  container.style.position = 'relative';
  container.appendChild(btn);
  shrinkTextToFit(btn);
  return { refreshLabel: setLabel };
}

// Returns true iff this call just turned night mode ON — the caller is
// responsible for any achievement tracking (see the file-header comment).
export function toggleDayNightMode(): boolean {
  if (themeSelect.value === 'custom'){
    toast('Day/Night inversion isn\'t available for the Custom theme — its colors are already fully in your control.');
    return false;
  }
  dayNightOn = !dayNightOn;
  if (dayNightOn){
    for (const [key] of THEME_VARS){
      const dayHex = getCurrentVarHex(key);
      document.documentElement.style.setProperty(key, invertLightness(dayHex));
    }
    document.documentElement.classList.add('night-mode');
  } else {
    clearCustomOverrides();
    document.documentElement.classList.remove('night-mode');
  }
  try { localStorage.setItem('dts-night-mode', dayNightOn ? '1' : '0'); } catch(e){}
  return dayNightOn;
}
