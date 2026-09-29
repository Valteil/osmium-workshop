// Optional slow scroll of the gallery's background pattern (Settings > Visual
// flourishes). Works on whatever #gallery paints for the active theme, Custom
// included, by reading its computed background layers: every tiled layer moves
// a whole number of its own tiles per loop, so the wrap is invisible and layers
// of different tile sizes still travel at about the same speed. Glows and
// other element-sized layers stay put, and so do concentric-ring patterns,
// which can't tile.

import { getBool, setBool } from './storage';

const KEY = 'dts-ground-scroll';
const SPEED = 6;          // px per second per axis
const LOOP_S = 120;

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

const px = (t: string): number | null => (/^-?\d+(\.\d+)?px$/.test(t) ? parseFloat(t) : t === '0%' || t === '0' ? 0 : null);
const isPx = (t: string): boolean => /^\d+(\.\d+)?px$/.test(t);
const num = (n: number): string => `${Math.round(n * 100) / 100}px`;

// A hatch layer has no tile of its own, so give it one exactly k periods wide
// along each axis, picking the k whose rounded size drifts least.
function hatchTile(angle: number, period: number): { w: number; h: number } | null {
  const s = Math.abs(Math.sin(angle * Math.PI / 180)), c = Math.abs(Math.cos(angle * Math.PI / 180));
  const dim = (trig: number, k: number) => (trig < 1e-6 ? period : Math.round((k * period) / trig));
  let best: { w: number; h: number; err: number } | null = null;
  for (let k = 1; k <= 12; k++) {
    const w = dim(s, k), h = dim(c, k);
    const err = Math.max(s < 1e-6 ? 0 : Math.abs(w * s - k * period) / (k * period), c < 1e-6 ? 0 : Math.abs(h * c - k * period) / (k * period));
    if (!best || err < best.err - 1e-9) best = { w, h, err };
    if (err < 0.004) break;
  }
  return best;
}

interface Plan { sizes: string[]; from: string; to: string; moving: boolean }

function plan(cs: CSSStyleDeclaration): Plan {
  const imgs = splitTop(cs.backgroundImage), sizes = splitTop(cs.backgroundSize), poss = splitTop(cs.backgroundPosition);
  const outSize: string[] = [], from: string[] = [], to: string[] = [];
  let moving = false;
  imgs.forEach((img, i) => {
    const size = (sizes[i % sizes.length] || 'auto').split(/\s+/);
    const pos = (poss[i % poss.length] || '0% 0%').split(/\s+/);
    const x0 = px(pos[0]), y0 = px(pos[1]);
    let sw = size[0], sh = size[1] || size[0];
    let dx = 0, dy = 0, ok = x0 !== null && y0 !== null && img !== 'none';
    if (ok && img.startsWith('repeating-linear-gradient(') && sw === 'auto' && sh === 'auto') {
      const a = /^repeating-linear-gradient\((-?\d+(?:\.\d+)?)deg/.exec(img);
      const p = /(\d+(?:\.\d+)?)px\)$/.exec(img);
      const tile = a && p ? hatchTile(parseFloat(a[1]), parseFloat(p[1])) : null;
      if (tile) {
        sw = num(tile.w); sh = num(tile.h);
        const rad = parseFloat(a![1]) * Math.PI / 180;
        if (Math.abs(Math.sin(rad)) < 1e-6) sw = 'auto', dx = -1; else if (Math.abs(Math.cos(rad)) < 1e-6) sh = 'auto', dy = -1;
      } else ok = false;
    }
    if (ok && (img.startsWith('repeating-radial') || (sw === 'auto' && sh === 'auto'))) ok = false;
    if (ok) {
      const wPx = isPx(sw) ? parseFloat(sw) : 0, hPx = isPx(sh) ? parseFloat(sh) : 0;
      if (!wPx && !hPx) ok = false;
      else {
        dx = wPx && dx !== -1 ? Math.max(1, Math.round((SPEED * LOOP_S) / wPx)) * wPx : 0;
        dy = hPx && dy !== -1 ? Math.max(1, Math.round((SPEED * LOOP_S) / hPx)) * hPx : 0;
        if (dx === 0 && dy === 0) ok = false;
      }
    }
    if (ok) {
      // A hatch that only varies along one axis still needs a size on the other.
      const useW = sw === 'auto' ? '100%' : sw, useH = sh === 'auto' ? '100%' : sh;
      outSize.push(`${useW} ${useH}`);
      from.push(`${num(x0!)} ${num(y0!)}`); to.push(`${num(x0! + dx)} ${num(y0! + dy)}`);
      moving = true;
    } else {
      outSize.push(sizes[i % sizes.length] || 'auto');
      const keep = poss[i % poss.length] || '0% 0%';
      from.push(keep); to.push(keep);
    }
  });
  return { sizes: outSize, from: from.join(', '), to: to.join(', '), moving };
}

export function initGroundScroll(toggle: HTMLInputElement): void {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let anim: Animation | null = null;
  let scheduled = false;

  const stop = () => {
    if (anim) { anim.cancel(); anim = null; }
    gallery.style.removeProperty('background-size');
  };
  const start = () => {
    stop();
    if (!toggle.checked || reduced.matches) return;
    const p = plan(getComputedStyle(gallery));
    if (!p.moving) return;
    gallery.style.backgroundSize = p.sizes.join(', ');
    anim = gallery.animate(
      [{ backgroundPosition: p.from }, { backgroundPosition: p.to }],
      { duration: LOOP_S * 1000, iterations: Infinity, easing: 'linear' },
    );
    if (root.classList.contains('no-flourish-ambient')) anim.pause();
  };
  const refresh = () => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => { scheduled = false; start(); }, 30);
  };

  toggle.checked = getBool(KEY);
  toggle.addEventListener('change', () => {
    setBool(KEY, toggle.checked);
    start();
  });
  reduced.addEventListener('change', start);
  new MutationObserver((muts) => {
    if (muts.some(m => m.attributeName === 'class') && anim) {
      if (root.classList.contains('no-flourish-ambient')) anim.pause();
      else if (anim.playState === 'paused') anim.play();
    }
    if (muts.some(m => m.attributeName !== 'class')) refresh();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
  start();
}
