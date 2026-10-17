// The Gallery tab (both shells): a large browser of the output folder, with
// a folded Compare section above it (image slots + a two-up stage).
//
// Gallery: click an image to open it in the lightbox (zoom, ← / →, its
// generation details). Shift-click (desktop) or long-press (phone) adds it to
// a Compare slot instead — the page never scrolls for that; a toast and the
// Compare header's count say where it went.
// Slots: any number, each an image or an empty dotted box with a ⊕. Click an
// empty slot to target it for the next add. On a filled slot: click = show it
// left, right-click = right; with Shift the other way round (Shift-click =
// right, Shift-right-click = left). The phone: tap = left, long-press = right.
// Overlay calls the sides bottom (left) and top (right).
// Stage, side by side: click an image to zoom it (lightbox); Shift-click (or
// long-press) slides its prompt panel up on its side while both images slide
// the other way. Overlay: B stacked on A; press and hold to see through B.
// Motion: one switch in the Compare bar (`comfybridge-compare-motion`; the
// default follows prefers-reduced-motion). Off = every change is instant.
import type { StorageBackend } from './storage';
import { isGalleryImage, fileNumber } from './storage';
import { showImageLightbox, closeLightbox, type LightboxInfo } from './lightbox';

export interface CompareSource {
  label: string;
  backend(): StorageBackend;
  thumbSrc?: (rel: string) => Promise<string | null>;
  fullSrc?: (rel: string) => Promise<string | null>;
}
export interface CompareDeps {
  sources: CompareSource[];
  // An image from disk as a data URL, or null when cancelled.
  pickFile(): Promise<string | null>;
  // The generation details panel for an image (gen-info's, with the shell's
  // "Use these settings" wiring; `close` closes the lightbox showing it).
  details(src: string, relPath: string, close?: () => void): HTMLElement | null;
  // The lightbox's details behind a Details button (the phone).
  lazyInfo?: boolean;
}
export interface CompareHandle {
  // The tab became visible: first render, or re-list the folder if it changed.
  onShow(): void;
}

// Android's Back: close the open prompt panel first. False when none is open.
let compareBackStep: (() => boolean) | null = null;
export function compareBack(): boolean {
  return compareBackStep ? compareBackStep() : false;
}

interface Slot { id: number; src: string | null; rel: string; name: string; }
type Side = 'a' | 'b';

const MOTION_KEY = 'comfybridge-compare-motion';
const MODE_KEY = 'comfybridge-compare-mode';
const OPEN_KEY = 'comfybridge-compare-open';
const PEEK_KEY = 'comfybridge-compare-peek';
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const EASE_IN_OUT = 'cubic-bezier(0.77, 0, 0.175, 1)';
const PAGE = 60;
const HOLD_MS = 260;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text;
  return e;
}
function btn(cls: string, text: string, title = ''): HTMLButtonElement {
  const b = el('button', cls, text);
  b.type = 'button';
  if (title) { b.title = title; b.setAttribute('aria-label', title); }
  return b;
}
function loadFlag(key: string, fallback: boolean): boolean {
  try {
    const v = localStorage.getItem(key);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* best effort */ }
  return fallback;
}
function saveFlag(key: string, on: boolean): void {
  try { localStorage.setItem(key, on ? '1' : '0'); } catch { /* best effort */ }
}

// Where an object-fit:contain image actually paints inside its box.
function paintedRect(img: HTMLImageElement): DOMRect {
  const box = img.getBoundingClientRect();
  const nw = img.naturalWidth, nh = img.naturalHeight;
  if (!nw || !nh || !box.width || !box.height) return box;
  const s = Math.min(box.width / nw, box.height / nh);
  const w = nw * s, h = nh * s;
  return new DOMRect(box.left + (box.width - w) / 2, box.top + (box.height - h) / 2, w, h);
}

// Keep a slot card in view inside the horizontal row only — never scrolls the
// page (scrollIntoView would).
function revealInRow(row: HTMLElement, card: HTMLElement): void {
  const l = card.offsetLeft - row.offsetLeft;
  if (l < row.scrollLeft) row.scrollLeft = l - 8;
  else if (l + card.offsetWidth > row.scrollLeft + row.clientWidth) row.scrollLeft = l + card.offsetWidth - row.clientWidth + 8;
}

export function mountCompareTab(root: HTMLElement, deps: CompareDeps): CompareHandle {
  root.replaceChildren();
  root.classList.add('cmp');
  // No hover = a touch screen: long-press stands in for Shift / right-click.
  const touch = !!(window.matchMedia && window.matchMedia('(hover: none)').matches);
  let motion = loadFlag(MOTION_KEY, !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches));
  const still = (): boolean => !motion;
  const anim = (node: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation | null =>
    still() || !node.animate ? null : node.animate(frames, opts);

  // ---- state ----
  let nextId = 1;
  const slots: Slot[] = [];
  const newSlot = (): Slot => ({ id: nextId++, src: null, rel: '', name: '' });
  slots.push(newSlot(), newSlot());
  let target: number | null = null; // slot id targeted for the next add
  const shown: Record<Side, number | null> = { a: null, b: null }; // slot ids
  let mode: 'side' | 'overlay' = 'side';
  try { if (localStorage.getItem(MODE_KEY) === 'overlay') mode = 'overlay'; } catch { /* best effort */ }
  let focus: Side | null = null;

  // ---- Compare (folded) ----
  const fold = el('details', 'cmp-fold');
  fold.open = loadFlag(OPEN_KEY, false);
  const sum = el('summary', 'cmp-fold-sum');
  const sumTitle = el('span', 'd', 'Compare');
  const sumCount = el('span', 'cmp-count');
  const sumHint = el('span', 'muted small cmp-sum-hint', touch ? 'Long-press a gallery image to add it' : 'Shift-click a gallery image to add it');
  sum.append(sumTitle, sumCount, sumHint);
  const foldBody = el('div', 'cmp-fold-body');
  fold.append(sum, foldBody);

  const bar = el('div', 'cmp-bar');
  const seg = el('div', 'cmp-seg');
  seg.setAttribute('role', 'tablist');
  const segSide = btn('cmp-seg-btn', 'Side by side');
  const segOver = btn('cmp-seg-btn', 'Overlay');
  const segPill = el('span', 'cmp-seg-pill');
  seg.append(segPill, segSide, segOver);
  const swapBtn = btn('cmp-tool', '⇄ Swap', 'Swap the two images');
  const fileBtn = btn('cmp-tool', 'Open file…', 'Add an image from disk to a slot');
  const motionLbl = el('label', 'cmp-motion');
  const motionBox = el('input');
  motionBox.type = 'checkbox';
  motionBox.checked = motion;
  motionLbl.append(motionBox, document.createTextNode(' Animations'));
  // Overlay only: how see-through the top image gets while held (5–95 %
  // opacity, `comfybridge-compare-peek`). Dragging previews it.
  const peekLbl = el('label', 'cmp-peek');
  peekLbl.title = 'How visible the top image stays while you hold it';
  const peekRange = el('input');
  peekRange.type = 'range';
  peekRange.min = '5';
  peekRange.max = '95';
  peekRange.step = '1';
  let peekPct = 42;
  try { const v = Number(localStorage.getItem(PEEK_KEY)); if (v >= 5 && v <= 95) peekPct = v; } catch { /* best effort */ }
  peekRange.value = String(peekPct);
  const peekVal = el('span', 'cmp-peek-val');
  peekLbl.append(document.createTextNode('Top image when held '), peekRange, peekVal);
  bar.append(seg, swapBtn, fileBtn, peekLbl, el('span', 'cmp-spacer'), motionLbl);

  const slotHint = el('div', 'muted small cmp-hint');
  const slotRow = el('div', 'cmp-slots');

  const stage = el('div', 'cmp-stage');
  const sideEls: Record<Side, { box: HTMLDivElement; img: HTMLImageElement; label: HTMLDivElement; panel: HTMLDivElement }> = {} as never;
  for (const s of ['a', 'b'] as Side[]) {
    const box = el('div', 'cmp-side cmp-side-' + s);
    const img = el('img', 'cmp-img');
    img.draggable = false;
    img.alt = s === 'a' ? 'Left image' : 'Right image';
    const label = el('div', 'cmp-side-label');
    box.append(img, label);
    const panel = el('div', 'cmp-panel cmp-panel-' + s);
    stage.append(box, panel);
    sideEls[s] = { box, img, label, panel };
  }
  const stageHint = el('div', 'cmp-stage-hint');
  const holdHint = el('div', 'cmp-hold-hint', touch ? 'Touch and hold to see through' : 'Hold the mouse down to see through');
  const stageTip = el('div', 'muted small cmp-hint');
  stage.append(stageHint, holdHint);
  foldBody.append(bar, slotHint, slotRow, stage, stageTip);

  // ---- gallery ----
  const browser = el('section', 'cmp-browser');
  const bHead = el('div', 'cmp-bhead');
  const srcRow = el('div', 'cmp-src-row');
  const refreshBtn = btn('cmp-tool', '↻', 'Refresh the folder');
  const crumb = el('div', 'cmp-crumb');
  bHead.append(crumb, el('span', 'cmp-spacer'), srcRow, refreshBtn);
  const grid = el('div', 'cmp-grid');
  const empty = el('div', 'muted small cmp-bempty');
  browser.append(bHead, grid, empty);

  const toast = el('div', 'cmp-toast');
  toast.setAttribute('role', 'status');
  root.append(fold, browser, toast);

  // ---- helpers ----
  const slotById = (id: number | null): Slot | undefined => (id == null ? undefined : slots.find((x) => x.id === id));
  const filled = (): Slot[] => slots.filter((x) => x.src);
  const slotEl = (id: number): HTMLElement | null => slotRow.querySelector<HTMLElement>(`[data-slot="${id}"]`);
  const sideName = (s: Side): string => (mode === 'overlay' ? (s === 'a' ? 'bottom' : 'top') : (s === 'a' ? 'left' : 'right'));

  function applyMotion(): void { root.classList.toggle('cmp-still', still()); }

  let toastTimer = 0;
  function notify(text: string): void {
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function renderHints(): void {
    const l = sideName('a'), r = sideName('b');
    slotHint.textContent = touch
      ? `Tap a slot to show it ${l}, long-press to show it ${r}. Tap an empty slot to fill it next.`
      : `Click a slot to show it ${l}, right-click to show it ${r} (Shift swaps them). Click an empty slot to fill it next.`;
    stageTip.textContent = mode === 'overlay'
      ? (touch ? 'Tap the image to zoom it.' : 'Click the image to zoom it.')
      : (touch ? 'Tap an image to zoom it, long-press it for its prompt.' : 'Click an image to zoom it, Shift-click it for its prompt.');
    sumCount.textContent = filled().length ? String(filled().length) : '';
  }

  // ---- slot row ----
  function renderSlots(): void {
    slotRow.replaceChildren();
    slots.forEach((s, i) => {
      const card = el('div', 'cmp-slot' + (s.src ? ' filled' : ' empty') + (target === s.id ? ' target' : ''));
      card.dataset.slot = String(s.id);
      card.tabIndex = 0;
      card.setAttribute('role', 'button');
      if (s.src) {
        const im = el('img', 'cmp-slot-img');
        im.src = s.src;
        im.alt = s.name;
        im.draggable = false;
        card.title = s.name;
        card.appendChild(im);
        const badges: string[] = [];
        if (shown.a === s.id) badges.push(mode === 'overlay' ? 'Bottom' : 'Left');
        if (shown.b === s.id) badges.push(mode === 'overlay' ? 'Top' : 'Right');
        if (badges.length) card.appendChild(el('span', 'cmp-badge', badges.join(' · ')));
      } else {
        card.title = 'Empty slot: click it, then add an image';
        const plus = el('span', 'cmp-plus');
        plus.setAttribute('aria-hidden', 'true');
        card.appendChild(plus);
      }
      card.appendChild(el('span', 'cmp-slot-n', String(i + 1)));
      const rm = btn('cmp-slot-x', '×', s.src ? 'Empty this slot' : 'Remove this slot');
      rm.addEventListener('click', (e) => { e.stopPropagation(); removeSlot(s.id); });
      rm.addEventListener('contextmenu', (e) => e.stopPropagation());
      card.appendChild(rm);
      // Left button = left side, right button / long-press = right; Shift swaps.
      card.addEventListener('click', (e) => onSlotPick(s.id, e.shiftKey ? 'b' : 'a'));
      card.addEventListener('contextmenu', (e) => { e.preventDefault(); onSlotPick(s.id, e.shiftKey ? 'a' : 'b'); });
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlotPick(s.id, e.shiftKey ? 'b' : 'a'); } });
      slotRow.appendChild(card);
    });
    const add = btn('cmp-slot cmp-slot-add', '', 'Add a slot');
    add.appendChild(el('span', 'cmp-plus'));
    add.addEventListener('click', () => {
      const s = newSlot();
      slots.push(s);
      target = s.id;
      renderSlots();
      const c = slotEl(s.id);
      if (c) {
        revealInRow(slotRow, c);
        anim(c, [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE_OUT });
      }
    });
    slotRow.appendChild(add);
    renderHints();
  }

  function onSlotPick(id: number, side: Side): void {
    const s = slotById(id);
    if (!s) return;
    if (!s.src) {
      target = target === id ? null : id;
      renderSlots();
      return;
    }
    if (shown[side] === id) return;
    const other: Side = side === 'a' ? 'b' : 'a';
    // Already on the other side: the two trade places.
    if (shown[other] === id) shown[other] = shown[side];
    setSide(side, id);
  }

  function removeSlot(id: number): void {
    const s = slotById(id);
    if (!s) return;
    const finish = (): void => {
      if (s.src) { s.src = null; s.rel = ''; s.name = ''; }
      else if (slots.length > 1) slots.splice(slots.indexOf(s), 1);
      if (target === id) target = null;
      for (const side of ['a', 'b'] as Side[]) if (shown[side] === id) shown[side] = null;
      if (focus && !slotById(shown[focus])?.src) focus = null;
      autoFill();
      renderSlots();
      renderStage();
    };
    const c = slotEl(id);
    const a = c ? anim(c, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 150, easing: EASE_OUT, fill: 'forwards' }) : null;
    if (a) a.onfinish = finish; else finish();
  }

  // Put an image into the target / first empty / a new slot. The page stays
  // where it is: the thumbnail flies to the slot when the slot is on screen,
  // and a toast + the header count confirm it either way.
  function fill(src: string, rel: string, from: Element | null): void {
    let s = slotById(target);
    if (!s || s.src) s = slots.find((x) => !x.src);
    if (!s) { s = newSlot(); slots.push(s); }
    s.src = src;
    s.rel = rel;
    s.name = rel ? rel.slice(rel.lastIndexOf('/') + 1) : 'Opened image';
    target = null;
    autoFill();
    renderSlots();
    renderStage();
    const n = slots.indexOf(s) + 1;
    notify(`Added to Compare, slot ${n}` + (fold.open ? '' : ' (open Compare above to see it)'));
    if (!fold.open) {
      anim(sumCount, [{ transform: 'scale(1.35)' }, { transform: 'none' }], { duration: 260, easing: EASE_OUT });
      return;
    }
    const card = slotEl(s.id);
    if (!card) return;
    revealInRow(slotRow, card);
    if (still()) return;
    const cardImg = card.querySelector('img');
    const r1 = card.getBoundingClientRect();
    const onScreen = r1.bottom > 0 && r1.top < window.innerHeight;
    if (from && cardImg && onScreen) {
      const r0 = from.getBoundingClientRect();
      if (r0.width && r1.width) {
        const ghost = el('img', 'cmp-ghost');
        ghost.src = src;
        Object.assign(ghost.style, { left: r1.left + 'px', top: r1.top + 'px', width: r1.width + 'px', height: r1.height + 'px' });
        document.body.appendChild(ghost);
        const dx = r0.left - r1.left, dy = r0.top - r1.top;
        const sx = r0.width / r1.width, sy = r0.height / r1.height;
        cardImg.style.opacity = '0';
        const a = ghost.animate(
          [{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.9 }, { transform: 'none', opacity: 1 }],
          { duration: 280, easing: EASE_IN_OUT }
        );
        const done = (): void => { ghost.remove(); cardImg.style.opacity = ''; };
        a.onfinish = done;
        a.oncancel = done;
        return;
      }
    }
    anim(card, [{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE_OUT });
  }

  // Empty stage sides take the first filled slots not already shown.
  function autoFill(): void {
    for (const side of ['a', 'b'] as Side[]) {
      if (slotById(shown[side])?.src) continue;
      const other = shown[side === 'a' ? 'b' : 'a'];
      const pick = filled().find((x) => x.id !== other);
      shown[side] = pick ? pick.id : null;
    }
  }

  // ---- stage ----
  function setSide(side: Side, id: number | null): void {
    shown[side] = id;
    if (focus) fillPanel(focus);
    renderSlots();
    renderStage();
    anim(sideEls[side].img, [{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE_OUT });
  }

  function renderStage(): void {
    stage.dataset.mode = mode;
    stage.dataset.focus = focus || '';
    segSide.classList.toggle('active', mode === 'side');
    segOver.classList.toggle('active', mode === 'overlay');
    peekLbl.hidden = mode !== 'overlay';
    segSide.setAttribute('aria-selected', String(mode === 'side'));
    segOver.setAttribute('aria-selected', String(mode === 'overlay'));
    seg.classList.toggle('right', mode === 'overlay');
    const n = filled().length;
    for (const side of ['a', 'b'] as Side[]) {
      const s = slotById(shown[side]);
      const e = sideEls[side];
      if (s && s.src) {
        if (e.img.getAttribute('src') !== s.src) e.img.src = s.src;
        e.img.hidden = false;
        e.label.textContent = `Slot ${slots.indexOf(s) + 1}` + (s.name ? ' · ' + s.name : '');
      } else {
        e.img.removeAttribute('src');
        e.img.hidden = true;
        e.label.textContent = '';
      }
    }
    swapBtn.disabled = !(shown.a && shown.b);
    stageHint.hidden = n > 0;
    stageHint.textContent = touch ? 'Long-press an image in the gallery below to add it here.' : 'Shift-click an image in the gallery below to add it here.';
    holdHint.hidden = !(mode === 'overlay' && shown.a && shown.b);
    renderHints();
  }

  // The prompt panel (side by side): slides up on the image's side.
  function fillPanel(side: Side): void {
    const p = sideEls[side].panel;
    p.replaceChildren();
    const s = slotById(shown[side]);
    if (!s || !s.src) return;
    const head = el('div', 'cmp-panel-head');
    const x = btn('cmp-panel-x', '×', 'Close the prompt panel');
    x.addEventListener('click', () => setFocus(null));
    head.append(el('span', 'd', 'Prompt'), x);
    const body = el('div', 'cmp-panel-body');
    body.appendChild(deps.details(s.src, s.rel) || el('div', 'gen-info-empty', 'No generation settings in this image.'));
    p.append(head, body);
  }
  function setFocus(side: Side | null): void {
    if (mode !== 'side') side = null;
    if (side && !slotById(shown[side])?.src) side = null;
    if (side) fillPanel(side);
    focus = side;
    renderStage();
  }
  // Zoom a stage image: the lightbox steps through the filled slots.
  function zoom(side: Side): void {
    const s = slotById(shown[side]);
    if (!s || !s.src) return;
    const list = (): string[] => filled().map((x) => x.src as string);
    const relOf = (src: string): string => filled().find((x) => x.src === src)?.rel || '';
    const info: LightboxInfo = (src, close) => deps.details(src, relOf(src), close);
    showImageLightbox(s.src, list, info, deps.lazyInfo);
  }

  // Overlay hold: press and hold to see through the top image. A hold that
  // fired doesn't also count as a click (no zoom on release).
  let holdTimer = 0;
  let held = false;
  const endHold = (): void => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    stage.classList.remove('peek');
  };
  stage.addEventListener('pointerdown', (ev) => {
    held = false;
    if (mode !== 'overlay' || (ev.target as Element).closest('button')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    endHold();
    holdTimer = window.setTimeout(() => { held = true; stage.classList.add('peek'); }, HOLD_MS);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) stage.addEventListener(t, endHold);

  for (const side of ['a', 'b'] as Side[]) {
    const e = sideEls[side];
    e.img.addEventListener('click', (ev) => {
      if (held) { held = false; return; }
      if (mode === 'overlay') { zoom('b'); return; }
      if (ev.shiftKey) { setFocus(focus === side ? null : side); return; }
      // The dimmed, pushed-aside image just brings the pair back.
      if (focus && focus !== side) { setFocus(null); return; }
      zoom(side);
    });
    // Right-click / long-press: the prompt on touch (no Shift there).
    e.img.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();
      if (mode === 'side' && touch) setFocus(focus === side ? null : side);
    });
  }
  stage.addEventListener('contextmenu', (ev) => { if (mode === 'overlay') ev.preventDefault(); });
  stage.addEventListener('click', (ev) => {
    if (focus && ev.target === stage) setFocus(null);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && focus && root.offsetParent && !document.querySelector('.lightbox-backdrop')) setFocus(null);
  });
  compareBackStep = (): boolean => {
    if (!root.offsetParent) return false;
    if (closeLightbox()) return true;
    if (!focus) return false;
    setFocus(null);
    return true;
  };

  // Mode switch: each image glides from where it painted to its new place.
  function setMode(m: 'side' | 'overlay'): void {
    if (m === mode) return;
    const before: Record<Side, DOMRect | null> = { a: null, b: null };
    for (const side of ['a', 'b'] as Side[]) if (!sideEls[side].img.hidden) before[side] = paintedRect(sideEls[side].img);
    focus = null;
    mode = m;
    try { localStorage.setItem(MODE_KEY, m); } catch { /* best effort */ }
    stage.classList.add('cmp-switching');
    renderStage();
    renderSlots();
    for (const side of ['a', 'b'] as Side[]) {
      const r0 = before[side];
      if (!r0) continue;
      const r1 = paintedRect(sideEls[side].img);
      if (!r1.width) continue;
      const dx = (r0.left + r0.width / 2) - (r1.left + r1.width / 2);
      const dy = (r0.top + r0.height / 2) - (r1.top + r1.height / 2);
      anim(sideEls[side].box, [{ transform: `translate(${dx}px, ${dy}px) scale(${r0.width / r1.width})` }, { transform: 'none' }], { duration: 300, easing: EASE_IN_OUT });
    }
    requestAnimationFrame(() => stage.classList.remove('cmp-switching'));
  }
  segSide.addEventListener('click', () => setMode('side'));
  segOver.addEventListener('click', () => setMode('overlay'));
  swapBtn.addEventListener('click', () => {
    const a = shown.a;
    shown.a = shown.b;
    shown.b = a;
    if (focus) { focus = focus === 'a' ? 'b' : 'a'; fillPanel(focus); }
    renderSlots();
    renderStage();
    if (mode === 'side') {
      anim(sideEls.a.img, [{ opacity: 0.4, transform: 'translateX(40%)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE_OUT });
      anim(sideEls.b.img, [{ opacity: 0.4, transform: 'translateX(-40%)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE_OUT });
    } else {
      anim(sideEls.b.img, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
    }
  });
  let peekPreview = 0;
  const applyPeek = (): void => {
    stage.style.setProperty('--cmp-peek', String(peekPct / 100));
    peekVal.textContent = peekPct + '%';
  };
  peekRange.addEventListener('input', () => {
    peekPct = Number(peekRange.value);
    applyPeek();
    // Show the setting on the stage while dragging, then let go.
    stage.classList.add('peek');
    window.clearTimeout(peekPreview);
    peekPreview = window.setTimeout(() => { if (!holdTimer) stage.classList.remove('peek'); }, 700);
  });
  peekRange.addEventListener('change', () => {
    try { localStorage.setItem(PEEK_KEY, String(peekPct)); } catch { /* best effort */ }
  });
  applyPeek();
  motionBox.addEventListener('change', () => {
    motion = motionBox.checked;
    saveFlag(MOTION_KEY, motion);
    applyMotion();
  });
  fold.addEventListener('toggle', () => {
    saveFlag(OPEN_KEY, fold.open);
    if (fold.open) anim(foldBody, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE_OUT });
    else if (focus) setFocus(null);
  });
  fileBtn.addEventListener('click', async () => {
    const url = await deps.pickFile();
    if (url) fill(url, '', null);
  });

  // Shift held (desktop): the gallery shows that a click adds to Compare.
  if (!touch) {
    const sync = (ev: KeyboardEvent): void => { root.classList.toggle('shift', ev.shiftKey); };
    document.addEventListener('keydown', sync);
    document.addEventListener('keyup', sync);
    window.addEventListener('blur', () => root.classList.remove('shift'));
  }

  // ---- gallery browser ----
  let srcIdx = 0;
  let relDir = '';
  let token = 0;
  let sig = '';
  let rendered = false;
  const src = (): CompareSource => deps.sources[srcIdx];

  function renderSources(): void {
    srcRow.replaceChildren();
    if (deps.sources.length < 2) return;
    deps.sources.forEach((s, i) => {
      const b = btn('gallery-source-btn' + (i === srcIdx ? ' active' : ''), s.label);
      b.addEventListener('click', () => {
        if (i === srcIdx) return;
        srcIdx = i;
        relDir = '';
        renderSources();
        void list();
      });
      srcRow.appendChild(b);
    });
  }
  function renderCrumb(): void {
    crumb.replaceChildren();
    const go = (d: string) => () => { relDir = d; void list(); };
    const root0 = btn('gallery-crumb-btn', src().label);
    root0.addEventListener('click', go(''));
    crumb.appendChild(root0);
    let acc = '';
    for (const p of relDir ? relDir.split('/') : []) {
      acc = acc ? acc + '/' + p : p;
      crumb.appendChild(el('span', 'gallery-crumb-sep', '›'));
      const b = btn('gallery-crumb-btn', p);
      b.addEventListener('click', go(acc));
      crumb.appendChild(b);
    }
  }

  async function list(keep = false): Promise<void> {
    const my = ++token;
    renderCrumb();
    let entries;
    let err = '';
    try {
      entries = await src().backend().listDir(relDir);
    } catch (e) {
      entries = null;
      if (e instanceof Error && (e as Error & { userFacing?: boolean }).userFacing) err = e.message;
    }
    if (my !== token) return;
    const nextSig = entries ? entries.map((e) => e.kind[0] + e.name + ':' + (e.mtime || 0)).sort().join('|') : '';
    if (keep && rendered && entries && nextSig === sig) return;
    // The tab's scroller: the desktop's view box, or the phone's page.
    const scroller = root.parentElement && getComputedStyle(root.parentElement).overflowY === 'auto' ? root.parentElement : document.scrollingElement;
    const scroll = keep && scroller ? scroller.scrollTop : 0;
    const wasShown = keep ? grid.querySelectorAll('.cmp-thumb').length : 0;
    sig = nextSig;
    rendered = true;
    grid.replaceChildren();
    empty.hidden = true;
    if (!entries) {
      empty.hidden = false;
      empty.textContent = err ? `Couldn't list ${src().label}: ${err}` : 'No output folder yet — pick one on the Generate tab.';
      return;
    }
    const dirs = entries.filter((e) => e.kind === 'directory').map((e) => e.name).sort((a, b) => a.localeCompare(b));
    const mt = new Map<string, number>(entries.map((e) => [e.name, e.mtime || 0]));
    const imgs = entries.filter((e) => e.kind === 'file' && isGalleryImage(e.name)).map((e) => e.name).sort((a, b) => {
      const d = (mt.get(b) || 0) - (mt.get(a) || 0);
      if (d) return d;
      const na = fileNumber(a), nb = fileNumber(b);
      return na >= 0 && nb >= 0 ? nb - na : b.localeCompare(a);
    });
    if (!dirs.length && !imgs.length) {
      empty.hidden = false;
      empty.textContent = 'This folder is empty.';
      return;
    }
    for (const d of dirs) {
      const b = btn('cmp-folder', '📁 ' + d);
      b.addEventListener('click', () => { relDir = relDir ? relDir + '/' + d : d; void list(); });
      grid.appendChild(b);
    }
    let shownN = 0;
    const more = btn('gallery-more-btn cmp-more', '');
    const page = async (): Promise<void> => {
      more.remove();
      const slice = imgs.slice(shownN, shownN + PAGE);
      shownN += slice.length;
      await renderThumbs(slice, my);
      if (my !== token) return;
      if (shownN < wasShown && shownN < imgs.length) return page();
      if (shownN < imgs.length) {
        more.textContent = `Show more (${imgs.length - shownN} remaining)`;
        grid.appendChild(more);
      }
    };
    more.addEventListener('click', () => void page());
    await page();
    if (keep && my === token && scroller) scroller.scrollTop = scroll;
  }

  // The lightbox's ← / → list and the details' path, read live from the grid.
  const gridSrcs = (): string[] => Array.from(grid.querySelectorAll<HTMLImageElement>('.cmp-thumb img')).map((i) => i.src).filter(Boolean);
  const gridRel = (src: string): string => {
    for (const i of Array.from(grid.querySelectorAll<HTMLImageElement>('.cmp-thumb img'))) if (i.src === src) return i.dataset.rel || '';
    return '';
  };

  async function renderThumbs(names: string[], my: number): Promise<void> {
    const s = src();
    const cells = names.map((name) => {
      const rel = relDir ? relDir + '/' + name : name;
      const cell = btn('cmp-thumb', '', touch ? `${name}\nTap to open · long-press to add to Compare` : `${name}\nClick to open · Shift-click to add to Compare`);
      const im = el('img');
      im.alt = name;
      im.dataset.rel = rel;
      im.decoding = 'async';
      im.draggable = false;
      im.addEventListener('load', () => cell.classList.add('loaded'), { once: true });
      cell.appendChild(im);
      const full = async (): Promise<string | null> => {
        let u: string | null = null;
        try { u = s.fullSrc ? await s.fullSrc(rel) : null; } catch { u = null; }
        return u || im.src || null;
      };
      const add = async (): Promise<void> => {
        const u = await full();
        if (u) fill(u, rel, im);
      };
      // Shift-click stops the browser's text selection before it starts.
      cell.addEventListener('mousedown', (e) => { if (e.shiftKey) e.preventDefault(); });
      cell.addEventListener('click', async (e) => {
        if (e.shiftKey) { void add(); return; }
        const u = await full();
        if (!u) return;
        const info: LightboxInfo = (srcUrl, close) => deps.details(srcUrl, gridRel(srcUrl) || rel, close);
        showImageLightbox(u, gridSrcs, info, deps.lazyInfo);
      });
      // Long-press on a touch screen adds; desktop right-click keeps its menu.
      cell.addEventListener('contextmenu', (e) => {
        if (!touch) return;
        e.preventDefault();
        void add();
      });
      grid.appendChild(cell);
      return { rel, im, cell };
    });
    let i = 0;
    const worker = async (): Promise<void> => {
      while (i < cells.length) {
        const c = cells[i++];
        if (my !== token) return;
        let url: string | null = null;
        try { url = s.thumbSrc ? await s.thumbSrc(c.rel) : await s.backend().readImage(c.rel); } catch { url = null; }
        if (my !== token) return;
        if (url) c.im.src = url; else c.cell.remove();
      }
    };
    await Promise.all(Array.from({ length: Math.min(4, cells.length) }, worker));
  }

  refreshBtn.addEventListener('click', () => void list(true));

  applyMotion();
  renderSlots();
  renderStage();
  renderSources();
  return {
    onShow(): void {
      void list(rendered);
    },
  };
}
