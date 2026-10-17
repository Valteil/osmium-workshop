// The Compare tab (both shells): image slots, a two-up stage (side by side or
// overlay) and a large browser of the output folder that fills the slots.
//
// Slots: any number, each an image or an empty dotted box with a ⊕. Tap an
// empty slot to target it, then a gallery image (or Open file…) fills it; a
// gallery tap with no target fills the first empty slot, else adds one.
// Stage: two of the slots, A (left / bottom) and B (right / top). Each side
// cycles through the filled slots with ‹ ›; tapping a filled slot puts it on
// the side changed least recently.
//   - Side by side: tap an image and its prompt panel slides up on that side
//     while both images slide the other way (the other one mostly off-stage).
//   - Overlay: B stacked on A; press and hold to see through B.
// Motion: one switch in the tab's bar (`comfybridge-compare-motion`; the
// default follows prefers-reduced-motion). Off = every change is instant.
import type { StorageBackend } from './storage';
import { isGalleryImage, fileNumber } from './storage';
import { showImageLightbox } from './lightbox';

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
  // "Use these settings" wiring), or null.
  details(src: string, relPath: string): HTMLElement | null;
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

function loadMotion(): boolean {
  try {
    const v = localStorage.getItem(MOTION_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch { /* best effort */ }
  return !(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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

export function mountCompareTab(root: HTMLElement, deps: CompareDeps): CompareHandle {
  root.replaceChildren();
  root.classList.add('cmp');
  let motion = loadMotion();
  const still = (): boolean => !motion;
  const anim = (node: Element, frames: Keyframe[], opts: KeyframeAnimationOptions): Animation | null =>
    still() || !node.animate ? null : node.animate(frames, opts);

  // ---- state ----
  let nextId = 1;
  const slots: Slot[] = [];
  const newSlot = (): Slot => ({ id: nextId++, src: null, rel: '', name: '' });
  slots.push(newSlot(), newSlot());
  let target: number | null = null; // slot id targeted for the next pick
  const shown: Record<Side, number | null> = { a: null, b: null }; // slot ids
  let lastSet: Side = 'b'; // the side changed most recently
  let mode: 'side' | 'overlay' = 'side';
  try { if (localStorage.getItem(MODE_KEY) === 'overlay') mode = 'overlay'; } catch { /* best effort */ }
  let focus: Side | null = null;

  // ---- bar ----
  const bar = el('div', 'cmp-bar');
  const seg = el('div', 'cmp-seg');
  seg.setAttribute('role', 'tablist');
  const segSide = btn('cmp-seg-btn', 'Side by side');
  const segOver = btn('cmp-seg-btn', 'Overlay');
  const segPill = el('span', 'cmp-seg-pill');
  seg.append(segPill, segSide, segOver);
  const swapBtn = btn('cmp-tool', '⇄ Swap', 'Swap the two images');
  const spacer = el('span', 'cmp-spacer');
  const motionLbl = el('label', 'cmp-motion');
  const motionBox = el('input');
  motionBox.type = 'checkbox';
  motionBox.checked = motion;
  motionLbl.append(motionBox, document.createTextNode(' Animations'));
  bar.append(seg, swapBtn, spacer, motionLbl);

  // ---- slots ----
  const slotRow = el('div', 'cmp-slots');

  // ---- stage ----
  const stage = el('div', 'cmp-stage');
  const sideEls: Record<Side, { box: HTMLDivElement; img: HTMLImageElement; label: HTMLDivElement; prev: HTMLButtonElement; next: HTMLButtonElement; panel: HTMLDivElement }> = {} as never;
  for (const s of ['a', 'b'] as Side[]) {
    const box = el('div', 'cmp-side cmp-side-' + s);
    const img = el('img', 'cmp-img');
    img.draggable = false;
    img.alt = s === 'a' ? 'Left image' : 'Right image';
    const label = el('div', 'cmp-side-label');
    const prev = btn('cmp-nav cmp-prev', '‹', 'Previous slot on this side');
    const next = btn('cmp-nav cmp-next', '›', 'Next slot on this side');
    box.append(img, label, prev, next);
    const panel = el('div', 'cmp-panel cmp-panel-' + s);
    stage.append(box, panel);
    sideEls[s] = { box, img, label, prev, next, panel };
  }
  const stageHint = el('div', 'cmp-stage-hint');
  const holdHint = el('div', 'cmp-hold-hint', 'Hold to see through');
  stage.append(stageHint, holdHint);

  // ---- browser ----
  const browser = el('section', 'cmp-browser');
  const bHead = el('div', 'cmp-bhead');
  const bTitle = el('span', 'd', 'Gallery');
  const srcRow = el('div', 'cmp-src-row');
  const fileBtn = btn('cmp-tool', 'Open file…', 'Put an image from disk into a slot');
  const refreshBtn = btn('cmp-tool', '↻', 'Refresh the folder');
  bHead.append(bTitle, srcRow, el('span', 'cmp-spacer'), fileBtn, refreshBtn);
  const crumb = el('div', 'cmp-crumb');
  const grid = el('div', 'cmp-grid');
  const empty = el('div', 'muted small cmp-bempty');
  browser.append(bHead, crumb, grid, empty);

  root.append(bar, slotRow, stage, browser);

  // ---- helpers ----
  const slotById = (id: number | null): Slot | undefined => (id == null ? undefined : slots.find((x) => x.id === id));
  const filled = (): Slot[] => slots.filter((x) => x.src);
  const slotEl = (id: number): HTMLElement | null => slotRow.querySelector<HTMLElement>(`[data-slot="${id}"]`);

  function applyMotion(): void {
    root.classList.toggle('cmp-still', still());
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
        card.title = s.name + ' — tap to show it on the stage';
        card.appendChild(im);
        const badges: string[] = [];
        if (shown.a === s.id) badges.push(mode === 'overlay' ? 'Bottom' : 'Left');
        if (shown.b === s.id) badges.push(mode === 'overlay' ? 'Top' : 'Right');
        if (badges.length) card.appendChild(el('span', 'cmp-badge', badges.join(' · ')));
      } else {
        card.title = 'Empty slot — tap, then pick an image below (or Open file…)';
        const plus = el('span', 'cmp-plus');
        plus.setAttribute('aria-hidden', 'true');
        card.appendChild(plus);
      }
      card.appendChild(el('span', 'cmp-slot-n', String(i + 1)));
      const rm = btn('cmp-slot-x', '×', s.src ? 'Empty this slot' : 'Remove this slot');
      rm.addEventListener('click', (e) => { e.stopPropagation(); removeSlot(s.id); });
      card.appendChild(rm);
      card.addEventListener('click', () => onSlotTap(s.id));
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSlotTap(s.id); } });
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
        c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        anim(c, [{ opacity: 0, transform: 'scale(0.92)' }, { opacity: 1, transform: 'none' }], { duration: 200, easing: EASE_OUT });
      }
    });
    slotRow.appendChild(add);
  }

  function onSlotTap(id: number): void {
    const s = slotById(id);
    if (!s) return;
    if (!s.src) {
      target = target === id ? null : id;
      renderSlots();
      if (target != null) browser.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' });
      return;
    }
    if (shown.a === id || shown.b === id) return;
    const side: Side = lastSet === 'a' ? 'b' : 'a';
    setSide(side, id, 0);
  }

  function removeSlot(id: number): void {
    const s = slotById(id);
    if (!s) return;
    const finish = (): void => {
      if (s.src) { s.src = null; s.rel = ''; s.name = ''; }
      else if (slots.length > 1) slots.splice(slots.indexOf(s), 1);
      if (target === id) target = null;
      for (const side of ['a', 'b'] as Side[]) if (shown[side] === id) shown[side] = null;
      autoFill();
      renderSlots();
      renderStage();
    };
    const c = slotEl(id);
    const a = c ? anim(c, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.92)' }], { duration: 150, easing: EASE_OUT, fill: 'forwards' }) : null;
    if (a) a.onfinish = finish; else finish();
  }

  // Put an image into the target / first empty / a new slot, flying the
  // tapped thumbnail there.
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
    const card = slotEl(s.id);
    if (!card) return;
    card.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (still()) return;
    const cardImg = card.querySelector('img');
    if (from && cardImg) {
      const r0 = from.getBoundingClientRect();
      const r1 = card.getBoundingClientRect();
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
  function setSide(side: Side, id: number | null, dir: number): void {
    shown[side] = id;
    lastSet = side;
    if (focus === side) fillPanel(side);
    renderSlots();
    renderStage();
    const img = sideEls[side].img;
    const dx = dir === 0 ? 0 : dir * 28;
    anim(img, [{ opacity: 0, transform: `translateX(${dx}px) scale(${dir === 0 ? 0.97 : 1})` }, { opacity: 1, transform: 'none' }], { duration: 220, easing: EASE_OUT });
  }

  function cycle(side: Side, dir: 1 | -1): void {
    const list = filled();
    if (!list.length) return;
    const other = shown[side === 'a' ? 'b' : 'a'];
    const cur = list.findIndex((x) => x.id === shown[side]);
    for (let k = 1; k <= list.length; k++) {
      const cand = list[(((cur < 0 ? 0 : cur) + dir * k) % list.length + list.length) % list.length];
      if (cand.id !== other || list.length === 1) { setSide(side, cand.id, dir); return; }
    }
  }

  function renderStage(): void {
    stage.dataset.mode = mode;
    stage.dataset.focus = focus || '';
    segSide.classList.toggle('active', mode === 'side');
    segOver.classList.toggle('active', mode === 'overlay');
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
        const pos = slots.indexOf(s) + 1;
        e.label.textContent = `Slot ${pos}` + (s.name ? ' · ' + s.name : '');
      } else {
        e.img.removeAttribute('src');
        e.img.hidden = true;
        e.label.textContent = '';
      }
      const navOn = n > 2 || (n === 2 && !shown[side]);
      e.prev.hidden = !navOn;
      e.next.hidden = !navOn;
    }
    swapBtn.disabled = !(shown.a && shown.b);
    stageHint.hidden = n > 0;
    stageHint.textContent = 'Fill a slot to compare: tap an image in the gallery below.';
    holdHint.hidden = !(mode === 'overlay' && shown.a && shown.b);
  }

  // The prompt panel (side by side): slides up on the tapped image's side.
  function fillPanel(side: Side): void {
    const p = sideEls[side].panel;
    p.replaceChildren();
    const s = slotById(shown[side]);
    if (!s || !s.src) return;
    const head = el('div', 'cmp-panel-head');
    head.append(el('span', 'd', 'Prompt'), btn('cmp-panel-x', '×', 'Close the prompt panel'));
    head.lastElementChild!.addEventListener('click', () => setFocus(null));
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
  for (const side of ['a', 'b'] as Side[]) {
    const e = sideEls[side];
    e.prev.addEventListener('click', (ev) => { ev.stopPropagation(); cycle(side, -1); });
    e.next.addEventListener('click', (ev) => { ev.stopPropagation(); cycle(side, 1); });
    e.img.addEventListener('click', () => {
      if (mode !== 'side') return;
      setFocus(focus ? null : side);
    });
    e.img.addEventListener('dblclick', () => { if (e.img.src) showImageLightbox(e.img.src); });
  }
  stage.addEventListener('click', (ev) => {
    if (focus && ev.target === stage) setFocus(null);
  });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && focus && root.offsetParent) setFocus(null);
  });
  compareBackStep = (): boolean => {
    if (!focus || !root.offsetParent) return false;
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
      const box = sideEls[side].box;
      if (!r0) continue;
      const r1 = paintedRect(sideEls[side].img);
      if (!r1.width) continue;
      const dx = (r0.left + r0.width / 2) - (r1.left + r1.width / 2);
      const dy = (r0.top + r0.height / 2) - (r1.top + r1.height / 2);
      const sc = r0.width / r1.width;
      anim(box, [{ transform: `translate(${dx}px, ${dy}px) scale(${sc})` }, { transform: 'none' }], { duration: 300, easing: EASE_IN_OUT });
    }
    requestAnimationFrame(() => stage.classList.remove('cmp-switching'));
  }
  segSide.addEventListener('click', () => setMode('side'));
  segOver.addEventListener('click', () => setMode('overlay'));
  swapBtn.addEventListener('click', () => {
    const a = shown.a;
    shown.a = shown.b;
    shown.b = a;
    if (focus) focus = focus === 'a' ? 'b' : 'a';
    if (focus) fillPanel(focus);
    renderSlots();
    renderStage();
    if (mode === 'side') {
      anim(sideEls.a.img, [{ opacity: 0.4, transform: 'translateX(40%)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE_OUT });
      anim(sideEls.b.img, [{ opacity: 0.4, transform: 'translateX(-40%)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: EASE_OUT });
    } else {
      anim(sideEls.b.img, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: EASE_OUT });
    }
  });
  motionBox.addEventListener('change', () => {
    motion = motionBox.checked;
    try { localStorage.setItem(MOTION_KEY, motion ? '1' : '0'); } catch { /* best effort */ }
    applyMotion();
  });

  // Overlay: press and hold to see through the top image.
  let holdTimer = 0;
  const endHold = (): void => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
    stage.classList.remove('peek');
  };
  stage.addEventListener('pointerdown', (ev) => {
    if (mode !== 'overlay' || (ev.target as Element).closest('button')) return;
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    endHold();
    holdTimer = window.setTimeout(() => stage.classList.add('peek'), HOLD_MS);
  });
  for (const t of ['pointerup', 'pointercancel', 'pointerleave']) stage.addEventListener(t, endHold);
  stage.addEventListener('contextmenu', (ev) => { if (mode === 'overlay') ev.preventDefault(); });

  // ---- browser ----
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
    const parts = relDir ? relDir.split('/') : [];
    const go = (d: string) => () => { relDir = d; void list(); };
    const root0 = btn('gallery-crumb-btn', src().label);
    root0.addEventListener('click', go(''));
    crumb.appendChild(root0);
    let acc = '';
    for (const p of parts) {
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

  async function renderThumbs(names: string[], my: number): Promise<void> {
    const s = src();
    const cells = names.map((name) => {
      const rel = relDir ? relDir + '/' + name : name;
      const cell = btn('cmp-thumb', '', name);
      const im = el('img');
      im.alt = name;
      im.decoding = 'async';
      im.draggable = false;
      im.addEventListener('load', () => cell.classList.add('loaded'), { once: true });
      cell.appendChild(im);
      cell.addEventListener('click', async () => {
        let full: string | null = null;
        try { full = s.fullSrc ? await s.fullSrc(rel) : await s.backend().readImage(rel); } catch { full = null; }
        if (!full) full = im.src || null;
        if (full) fill(full, rel, im);
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

  fileBtn.addEventListener('click', async () => {
    const url = await deps.pickFile();
    if (url) fill(url, '', null);
  });
  refreshBtn.addEventListener('click', () => void list(true));

  applyMotion();
  renderSlots();
  renderStage();
  renderSources();
  return {
    onShow(): void {
      if (!rendered) void list();
      else void list(true);
    },
  };
}
