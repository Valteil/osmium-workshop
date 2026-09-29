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

// ---- Matrix rain (Terminal theme, only while the scroll option is on) ----
// Falling katakana and digits whose glyphs keep changing, drawn to a canvas that
// sits behind the gallery's content: a zero-height sticky host at the top of
// #gallery keeps it pinned while the gallery scrolls.
const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:.=*+-<>|';
const CELL = 16;

interface Column { head: number; speed: number; len: number; wait: number; glyphs: string[] }

function parseColor(v: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (hex) return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)];
  const rgb = /(\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v);
  return rgb ? [+rgb[1], +rgb[2], +rgb[3]] : [0, 255, 102];
}

function createRain(gallery: HTMLElement) {
  let host: HTMLDivElement | null = null;
  let canvas: HTMLCanvasElement | null = null;
  let timer = 0;
  let ro: ResizeObserver | null = null;
  let cols: Column[] = [];
  let rows = 0;
  let rgb: [number, number, number] = [0, 255, 102];
  let last = 0;
  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const glyph = () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)];

  const reset = (c: Column, first: boolean) => {
    c.speed = rand(3, 6);
    c.len = Math.floor(rand(8, 18));
    c.head = first ? rand(-rows, rows) : -1;
    c.wait = first ? rand(0, 5) : rand(1, 8);
  };
  const resize = () => {
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const w = gallery.clientWidth, h = gallery.clientHeight;
    canvas.width = Math.max(1, Math.floor(w * dpr)); canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    rows = Math.ceil(h / CELL);
    const n = Math.floor(w / CELL);
    while (cols.length < n) {
      const c: Column = { head: 0, speed: 0, len: 0, wait: 0, glyphs: Array.from({ length: 96 }, glyph) };
      reset(c, true); cols.push(c);
    }
    cols.length = n;
  };
  const draw = () => {
    if (!canvas || document.hidden) return;
    const now = performance.now(), dt = Math.min(0.25, (now - last) / 1000); last = now;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${CELL - 3}px "JetBrains Mono", "MS Gothic", monospace`;
    ctx.textBaseline = 'top';
    const [r, g, b] = rgb;
    cols.forEach((c, i) => {
      if (c.wait > 0) { c.wait -= dt; return; }
      c.head += c.speed * dt;
      if (c.head - c.len > rows) { reset(c, false); return; }
      const head = Math.floor(c.head);
      for (let k = 0; k < c.len; k++) {
        const row = head - k;
        if (row < 0 || row > rows) continue;
        const idx = row % c.glyphs.length;
        if (Math.random() < dt * 0.9) c.glyphs[idx] = glyph();
        const a = (k === 0 ? 0.3 : 0.17 * Math.pow(1 - k / c.len, 1.6));
        ctx.fillStyle = `rgba(${r},${g},${b},${a.toFixed(3)})`;
        ctx.fillText(c.glyphs[idx], i * CELL + 1, row * CELL);
      }
    });
  };
  return {
    running: () => !!host,
    start() {
      if (host) return;
      host = document.createElement('div');
      host.id = 'matrixRainHost';
      host.style.cssText = 'position:sticky;top:0;height:0;z-index:-1;pointer-events:none;';
      canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:absolute;top:0;left:0;display:block;';
      host.appendChild(canvas);
      gallery.insertBefore(host, gallery.firstChild);
      gallery.style.isolation = 'isolate';
      rgb = parseColor(getComputedStyle(document.documentElement).getPropertyValue('--accent-manual'));
      cols = [];
      resize();
      ro = new ResizeObserver(resize);
      ro.observe(gallery);
      last = performance.now();
      timer = window.setInterval(draw, 60);
    },
    stop() {
      if (!host) return;
      window.clearInterval(timer);
      ro?.disconnect(); ro = null;
      host.remove(); host = null; canvas = null;
      gallery.style.removeProperty('isolation');
    },
  };
}

export function initGroundScroll(toggle: HTMLInputElement): void {
  const gallery = document.getElementById('gallery');
  if (!gallery) return;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rain = createRain(gallery);
  let anim: Animation | null = null;
  let scheduled = false;

  const syncRain = (restart: boolean) => {
    const want = toggle.checked && !reduced.matches && root.getAttribute('data-theme') === 'terminal'
      && !root.classList.contains('no-flourish-ambient');
    if (!want) rain.stop();
    else if (restart || !rain.running()) { rain.stop(); rain.start(); }
  };

  const stop = () => {
    if (anim) { anim.cancel(); anim = null; }
    gallery.style.removeProperty('background-size');
  };
  const start = () => {
    stop();
    syncRain(true);
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
    if (muts.some(m => m.attributeName === 'class')) {
      if (anim) {
        if (root.classList.contains('no-flourish-ambient')) anim.pause();
        else if (anim.playState === 'paused') anim.play();
      }
      syncRain(false);
    }
    if (muts.some(m => m.attributeName !== 'class')) refresh();
  }).observe(root, { attributes: true, attributeFilter: ['data-theme', 'style', 'class'] });
  start();
}
