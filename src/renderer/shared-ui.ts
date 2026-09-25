import { toastEl, pdropCloseOnSelectToggle, flyoutOutsideCloseToggle, outsideClickSwallowToggle } from './dom';
import { getBool, setBool } from './storage';
import { setIconLabel } from './icons';

// ---------------- Pdrop-menu "close after selecting" preference ----------------

const PDROP_CLOSE_ON_SELECT_KEY = 'dts-pdrop-close-on-select';
(function initPdropCloseOnSelectPref(): void {
  let on = true;
  try { on = getBool(PDROP_CLOSE_ON_SELECT_KEY, true); } catch {}
  pdropCloseOnSelectToggle.checked = on;
})();
pdropCloseOnSelectToggle.addEventListener('change', () => {
  try { setBool(PDROP_CLOSE_ON_SELECT_KEY, pdropCloseOnSelectToggle.checked); } catch {}
});
function pdropClosesOnSelect(): boolean {
  return pdropCloseOnSelectToggle.checked;
}

// ---------------- "Swallow" the click that closes a menu/panel ----------------

const OUTSIDE_CLICK_SWALLOW_KEY = 'dts-outside-click-swallow';
(function initOutsideClickSwallowPref(): void {
  let on = false;
  try { on = getBool(OUTSIDE_CLICK_SWALLOW_KEY); } catch {}
  outsideClickSwallowToggle.checked = on;
})();
outsideClickSwallowToggle.addEventListener('change', () => {
  try { setBool(OUTSIDE_CLICK_SWALLOW_KEY, outsideClickSwallowToggle.checked); } catch {}
});
export function shouldSwallowOutsideClick(): boolean {
  return outsideClickSwallowToggle.checked;
}
let swallowNextClick = false;
export function markSwallowNextClick(): void {
  swallowNextClick = true;
}
document.addEventListener('click', (ev: MouseEvent) => {
  if (!swallowNextClick) return;
  swallowNextClick = false;
  ev.stopPropagation();
  ev.preventDefault();
}, true);

const HTML_ESCAPE_MAP: Record<string, string> = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => HTML_ESCAPE_MAP[c]);
}

export function shrinkTextToFit(el: HTMLElement, minFontPx = 9): void {
  el.style.fontSize = '';
  const baseFontPx = parseFloat(getComputedStyle(el).fontSize);
  if (!baseFontPx || el.scrollWidth <= el.clientWidth) return;
  let fontPx = baseFontPx;
  while (fontPx > minFontPx && el.scrollWidth > el.clientWidth) {
    fontPx -= 0.5;
    el.style.fontSize = fontPx + 'px';
  }
}

// Every shrinkTextToFit() caller is a .pdrop-btn label. Theme faces are
// bundled webfonts (renderer/fonts, font-display: swap), so a label fitted
// at startup or right after a theme switch was measured against the
// fallback face — once the real face lands it can be wider and clip. Re-fit
// them all whenever a font finishes loading (initFontRefit) and on every
// theme change (applyTheme, themes.ts).
export function refitShrunkText(): void {
  document.querySelectorAll<HTMLElement>('.pdrop-btn').forEach(b => shrinkTextToFit(b));
}

export function initFontRefit(): void {
  document.fonts.addEventListener('loadingdone', refitShrunkText);
}

// ---------------- Persistent dropdown ----------------

interface DropdownOption {
  value: string;
  label: string;
  title?: string;
}

let openPdropClose: (() => void) | null = null;
let openPdropOwnerPanel: Element | null = null;
let openPdropMenuEl: HTMLElement | null = null;

function closeAnyOpenPdrop(): void {
  if (openPdropClose) { const fn = openPdropClose; openPdropClose = null; openPdropOwnerPanel = null; openPdropMenuEl = null; fn(); }
}

function closeOwnedPdropIfPanel(panelEl: Element): void {
  if (openPdropOwnerPanel === panelEl) closeAnyOpenPdrop();
}

export function isClickInsideOwnedPdrop(panelEl: Element, target: EventTarget | null): boolean {
  return !!(openPdropMenuEl && openPdropOwnerPanel === panelEl && target instanceof Node && openPdropMenuEl.contains(target));
}

export function closeAllFloatingPanels(exceptEl?: Element): void {
  closeAnyOpenPdrop();
  document.querySelectorAll('.theme-panel.panel-visible').forEach(el => {
    if (el !== exceptEl) hidePanel(el as HTMLElement);
  });
}

export function buildPersistentDropdown(
  container: HTMLElement,
  options: DropdownOption[],
  getValue: () => string,
  onSelect: (value: string) => void
): { refreshLabel: () => void } {
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pdrop-btn';
  function currentLabel(): string {
    const found = options.find(o => o.value === getValue());
    return found ? found.label : getValue();
  }
  function setLabel(): void {
    setIconLabel(btn, currentLabel() + ' ▾');
    shrinkTextToFit(btn);
  }
  setIconLabel(btn, currentLabel() + ' ▾');
  let menuEl: HTMLElement | null = null;
  function closeMenu(): void {
    if (menuEl) { menuEl.remove(); menuEl = null; }
    if (openPdropClose === closeMenu) { openPdropClose = null; openPdropOwnerPanel = null; openPdropMenuEl = null; }
  }
  function openMenu(): void {
    const ownPanel = container.closest('.theme-panel');
    closeAllFloatingPanels(ownPanel ?? undefined);
    menuEl = document.createElement('div');
    menuEl.className = 'pdrop-menu';
    for (const opt of options) {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'pdrop-item' + (opt.value === getValue() ? ' active' : '');
      setIconLabel(item, opt.label);
      if (opt.title) item.title = opt.title;
      item.addEventListener('click', (ev: MouseEvent) => {
        ev.stopPropagation();
        onSelect(opt.value);
        setLabel();
        menuEl!.querySelectorAll('.pdrop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        if (pdropClosesOnSelect()) closeMenu();
      });
      menuEl.appendChild(item);
    }
    document.body.appendChild(menuEl);
    const rect = btn.getBoundingClientRect();
    positionMenu(menuEl, rect.left, rect.bottom + 4);
    openPdropClose = closeMenu;
    openPdropOwnerPanel = ownPanel;
    openPdropMenuEl = menuEl;
  }
  btn.addEventListener('click', (ev: MouseEvent) => {
    ev.stopPropagation();
    if (menuEl) closeMenu(); else openMenu();
  });
  document.addEventListener('click', (ev: MouseEvent) => {
    if (!menuEl || !flyoutOutsideCloseToggle.checked) return;
    const target = ev.target as Node;
    if (menuEl.contains(target) || container.contains(target)) return;
    closeMenu();
    if (shouldSwallowOutsideClick()) { ev.stopPropagation(); ev.preventDefault(); }
  }, true);
  container.appendChild(btn);
  shrinkTextToFit(btn);
  return { refreshLabel: setLabel };
}

// ---------------- Touch support ----------------

export function attachPinchZoom(el: HTMLElement, onZoomDelta: (delta: number) => void): void {
  let startDist: number | null = null;
  function dist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
  el.addEventListener('touchstart', (ev: TouchEvent) => {
    if (ev.touches.length === 2) startDist = dist(ev.touches);
  }, { passive: true });
  el.addEventListener('touchmove', (ev: TouchEvent) => {
    if (ev.touches.length === 2 && startDist) {
      ev.preventDefault();
      const newDist = dist(ev.touches);
      const delta = (newDist - startDist) * 0.5;
      if (Math.abs(delta) > 2) {
        onZoomDelta(delta);
        startDist = newDist;
      }
    }
  }, { passive: false });
  el.addEventListener('touchend', (ev: TouchEvent) => {
    if (ev.touches.length < 2) startDist = null;
  }, { passive: true });
}

interface LongPressEvent {
  clientX: number;
  clientY: number;
  preventDefault(): void;
  stopPropagation(): void;
}

export function attachLongPress(el: HTMLElement, callback: (ev: LongPressEvent) => void, ms = 500): void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0, startY = 0;
  const moveTolerance = 12;
  el.addEventListener('touchstart', (ev: TouchEvent) => {
    if (ev.touches.length !== 1) return;
    startX = ev.touches[0].clientX;
    startY = ev.touches[0].clientY;
    timer = setTimeout(() => {
      timer = null;
      callback({ clientX: startX, clientY: startY, preventDefault() {}, stopPropagation() {} });
    }, ms);
  }, { passive: true });
  el.addEventListener('touchmove', (ev: TouchEvent) => {
    if (!timer || !ev.touches[0]) return;
    const dx = ev.touches[0].clientX - startX;
    const dy = ev.touches[0].clientY - startY;
    if (Math.sqrt(dx * dx + dy * dy) > moveTolerance) { clearTimeout(timer); timer = null; }
  }, { passive: true });
  el.addEventListener('touchend', () => { if (timer) { clearTimeout(timer); timer = null; } }, { passive: true });
  el.addEventListener('touchcancel', () => { if (timer) { clearTimeout(timer); timer = null; } }, { passive: true });
}

let _toastTimer: ReturnType<typeof setTimeout> | undefined;
export function toast(msg: string, ms = 2600): void {
  setIconLabel(toastEl, msg);
  toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// Error-toast convenience — the `Could not X: <message>` shape used across the
// renderer for a caught error.
export function toastError(prefix: string, err: unknown, ms = 4200): void {
  const msg = err instanceof Error ? (err.message || String(err)) : String(err);
  toast(`${prefix}: ${msg}`, ms);
}

// The `.ctx-item` button shared by every context menu. The stopPropagation is
// load-bearing: without it the click bubbles to the document-level
// outside-click listener and immediately closes whatever panel this item just
// opened (e.g. Tag Details), since the click target is this menu button.
export function addContextMenuItem(menu: HTMLElement, label: string, onClick: (ev: MouseEvent) => void, opts: { title?: string; className?: string } = {}): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ctx-item' + (opts.className ? ' ' + opts.className : '');
  setIconLabel(btn, label);
  if (opts.title) btn.title = opts.title;
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onClick(ev);
  });
  menu.appendChild(btn);
  return btn;
}

// ---------------- Floating panel show/hide animation ----------------

export function showPanel(el: HTMLElement): void {
  el.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('panel-visible')));
}
export function hidePanel(el: HTMLElement): void {
  closeOwnedPdropIfPanel(el);
  if (el.style.display === 'none') return;
  el.classList.remove('panel-visible');
  setTimeout(() => { el.style.display = 'none'; }, 160);
}

// ---------------- Generic full-screen image lightbox ----------------

// onZoom (optional) receives the zoom level as a percentage after each change.
export function showImageLightbox(src: string, onZoom?: (pct: number) => void): void {
  if (!src) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  const img = document.createElement('img');
  img.src = src;
  img.draggable = false;
  img.style.transformOrigin = 'center center';
  backdrop.appendChild(img);

  let scale = 1, panX = 0, panY = 0;
  let dragging = false, didDrag = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
  const MIN_SCALE = 1, MAX_SCALE = 6;
  function clampPan(): void {
    const maxX = Math.max(0, img.offsetWidth * (scale - 1) / 2);
    const maxY = Math.max(0, img.offsetHeight * (scale - 1) / 2);
    panX = Math.max(-maxX, Math.min(maxX, panX));
    panY = Math.max(-maxY, Math.min(maxY, panY));
  }
  function applyTransform(): void {
    img.style.transform = (scale === 1 && panX === 0 && panY === 0) ? '' : `translate(${panX}px, ${panY}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-out';
  }
  function zoomBy(delta: number): void {
    const prevScale = scale;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + scale * delta));
    if (scale === MIN_SCALE) { panX = 0; panY = 0; }
    else { const ratio = scale / prevScale; panX *= ratio; panY *= ratio; }
    clampPan();
    applyTransform();
    if (onZoom && scale !== prevScale) onZoom(Math.round(scale * 100));
  }
  function onWheel(ev: WheelEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    zoomBy(-ev.deltaY * 0.0015);
  }
  function onPointerDown(ev: PointerEvent): void {
    if (scale <= 1) return;
    ev.preventDefault();
    ev.stopPropagation();
    dragging = true; didDrag = false;
    dragStartX = ev.clientX; dragStartY = ev.clientY;
    panStartX = panX; panStartY = panY;
    img.setPointerCapture(ev.pointerId);
    applyTransform();
  }
  function onPointerMove(ev: PointerEvent): void {
    if (!dragging) return;
    const dx = ev.clientX - dragStartX, dy = ev.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    clampPan();
    applyTransform();
  }
  function onPointerUp(ev: PointerEvent): void {
    if (!dragging) return;
    dragging = false;
    try { img.releasePointerCapture(ev.pointerId); } catch {}
    applyTransform();
  }
  img.addEventListener('wheel', onWheel, { passive: false });
  img.addEventListener('pointerdown', onPointerDown);
  img.addEventListener('pointermove', onPointerMove);
  img.addEventListener('pointerup', onPointerUp);
  attachPinchZoom(img, (delta: number) => zoomBy(delta * 0.02));

  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev: KeyboardEvent): void { if (ev.key === 'Escape') close(); }
  backdrop.addEventListener('click', (ev: MouseEvent) => {
    if (didDrag) { didDrag = false; return; }
    if (ev.target !== backdrop) return;
    close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}

// ---------------- Generic viewport-bounded menu positioning ----------------

// The real duration (ms) of an element's own CSS transition, read from the
// computed style so a JS swap delay can never drift from the stylesheet — the
// swipe drivers used to hardcode 100ms against a 110ms --tab-dur, and would
// have missed --swipe-dur entirely. Falls back to 160ms if unparseable;
// returns 0 under html.motion-off, where the transition vars are zeroed.
export function transitionMsOf(el: HTMLElement): number {
  const raw = getComputedStyle(el).transitionDuration.split(',')[0].trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return 160;
  return raw.endsWith('ms') ? n : n * 1000;
}

// ---------------- Swipe map ----------------
// Swipe mode treats the app as one horizontal map: tabs in tab-bar order,
// Gallery's views in view-button order inside the Gallery chunk, images in
// order inside Single view / the image modal. A move pans the camera: the
// outgoing region and the incoming one travel TOGETHER by exactly one region
// width (a View Transition, so both states are on screen at once), which
// reads as one continuous sheet sliding under a fixed frame — not two panes
// taking turns. Only the region that actually differs is named and panned;
// everything else (topbar, tab bar, shared panels) holds still, like the
// parts of the map both chunks share. CSS: "Swipe map" in styles.css.
//
// Returns false when it didn't handle the move (not Swipe mode, motion off,
// or no View Transitions) so the caller runs its own fallback path.
type ViewTransitionLike = { finished: Promise<void>; skipTransition: () => void };
type ViewTransitionDoc = Document & {
  startViewTransition?: (update: () => void) => ViewTransitionLike;
};
let mapPanSeq = 0;
let mapNamed: HTMLElement[] = [];
let activePan: ViewTransitionLike | null = null;

// While a View Transition runs, Chromium hit-tests the whole page as <html>
// (pointer-events on ::view-transition doesn't change that), so every click
// during a pan was swallowed, which locked users out of rapid tab switching
// until each pan finished. This relays such a click instead: it skips the
// running pan, and once the live DOM is back it re-hit-tests the same point
// and clicks what's really there, one frame late rather than never.
// Only a click PRESSED during the pan is relayed: a press that started the
// pan (tabs switch on pointerdown) releases mid-pan, and that trailing click
// must not replay the switch.
let panClickRelayInstalled = false;
let pressHitRoot = false;
function installPanClickRelay(): void {
  if (panClickRelayInstalled) return;
  panClickRelayInstalled = true;
  document.addEventListener('pointerdown', (ev: PointerEvent) => {
    pressHitRoot = !!activePan && ev.target === document.documentElement;
  }, true);
  document.addEventListener('click', (ev: MouseEvent) => {
    const pan = activePan;
    if (!pan || ev.target !== document.documentElement || !pressHitRoot) return;
    pressHitRoot = false;
    ev.stopPropagation();
    ev.preventDefault();
    const { clientX: x, clientY: y } = ev;
    pan.skipTransition();
    pan.finished.finally(() => {
      const hit = document.elementFromPoint(x, y) as HTMLElement | null;
      if (!hit || hit === document.documentElement) return;
      (hit.closest<HTMLElement>('button, a, label, [role="button"]') || hit).click();
    });
  }, true);
}
export function mapPan(
  dir: number, kind: 'tab' | 'view' | 'page',
  from: Element | null, to: () => Element | null, update: () => void,
  after?: () => void // deferred work, run once the pan lands (or is cut short by the next one)
): boolean {
  const html = document.documentElement;
  const doc = document as ViewTransitionDoc;
  if (!dir || !doc.startViewTransition || !html.classList.contains('motion-swipe') || html.classList.contains('motion-off')) return false;
  installPanClickRelay();
  const seq = ++mapPanSeq;
  // A pan started mid-pan skips the running one; drop its names first, or the
  // same view-transition-name on two rendered elements aborts this capture.
  for (const el of mapNamed) el.style.viewTransitionName = '';
  mapNamed = [];
  const name = (el: Element | null) => {
    if (!(el instanceof HTMLElement)) return;
    el.style.viewTransitionName = 'map-pane';
    mapNamed.push(el);
  };
  html.dataset.mapDir = dir > 0 ? 'fwd' : 'back';
  html.dataset.mapKind = kind;
  name(from);
  const t = doc.startViewTransition(() => {
    // Old state is captured; hand the name to the incoming region.
    if (from instanceof HTMLElement) from.style.viewTransitionName = '';
    update();
    name(to());
  });
  activePan = t;
  t.finished.finally(() => {
    if (after) after();
    if (seq !== mapPanSeq) return;
    activePan = null;
    for (const el of mapNamed) el.style.viewTransitionName = '';
    mapNamed = [];
    delete html.dataset.mapDir;
    delete html.dataset.mapKind;
  });
  return true;
}

export function positionMenu(menu: HTMLElement, x: number, y: number): void {
  const pad = 8;
  const width = menu.offsetWidth, height = menu.offsetHeight;
  let left = x, top = y;
  if (left + width + pad > window.innerWidth) left = window.innerWidth - width - pad;
  if (top + height + pad > window.innerHeight) top = window.innerHeight - height - pad;
  menu.style.left = Math.max(pad, left) + 'px';
  menu.style.top = Math.max(pad, top) + 'px';
  requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('menu-in')));
}

// ---------------- Themed confirm modal ----------------

interface ConfirmModalOpts {
  cancelLabel?: string;
  okLabel?: string;
  danger?: boolean;
}

// The shared backdrop/box shell every modal in the renderer is built on:
// creates the `.confirm-backdrop` + `.confirm-box`, wires outside-click and
// Escape to dismiss, appends to the body, and fades in. Callers append their
// own content to `box` (synchronously, before the next paint, so an empty box
// never flashes) and call `close()` to tear it down. `instant` skips the fade
// (the two dataset-manager pickers are visible from creation).
export interface ModalShellOpts {
  className?: string;      // extra classes on the backdrop
  boxClassName?: string;   // extra classes on the box
  instant?: boolean;       // no fade: visible immediately, removed on close
  onDismiss?: () => void;  // Escape / backdrop-click; defaults to close()
  onClose?: () => void;    // after teardown (post-fade unless instant)
  onShow?: () => void;     // inside the reveal frame
}
export interface ModalShell { backdrop: HTMLDivElement; box: HTMLDivElement; close: () => void; }

export function createModalShell(opts: ModalShellOpts = {}): ModalShell {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-backdrop' + (opts.className ? ' ' + opts.className : '') + (opts.instant ? ' modal-visible' : '');
  const box = document.createElement('div');
  box.className = 'confirm-box' + (opts.boxClassName ? ' ' + opts.boxClassName : '');
  backdrop.appendChild(box);
  let closed = false;
  function close(): void {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    if (opts.instant) {
      backdrop.remove();
      if (opts.onClose) opts.onClose();
    } else {
      backdrop.classList.remove('modal-visible');
      setTimeout(() => { backdrop.remove(); if (opts.onClose) opts.onClose(); }, 160);
    }
  }
  function onKey(ev: KeyboardEvent): void { if (ev.key === 'Escape') (opts.onDismiss || close)(); }
  backdrop.addEventListener('click', (ev: MouseEvent) => { if (ev.target === backdrop) (opts.onDismiss || close)(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  if (opts.instant) {
    if (opts.onShow) opts.onShow();
  } else {
    requestAnimationFrame(() => requestAnimationFrame(() => { backdrop.classList.add('modal-visible'); if (opts.onShow) opts.onShow(); }));
  }
  return { backdrop, box, close };
}

export function showConfirmModal(message: string, opts: ConfirmModalOpts = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const { box, close } = createModalShell({ onDismiss: () => { resolve(false); close(); } });
    const msg = document.createElement('div');
    msg.className = 'confirm-message';
    msg.textContent = message;
    box.appendChild(msg);
    const btnRow = document.createElement('div');
    btnRow.className = 'confirm-btn-row';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = opts.cancelLabel || 'Cancel';
    const okBtn = document.createElement('button');
    okBtn.textContent = opts.okLabel || 'Confirm';
    okBtn.className = opts.danger ? 'danger-ghost' : 'primary';
    cancelBtn.addEventListener('click', () => { resolve(false); close(); });
    okBtn.addEventListener('click', () => { resolve(true); close(); });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);
  });
}

export function showInfoModal(html: string, title?: string, onBody?: (body: HTMLElement) => void): void {
  const { box, close } = createModalShell({ boxClassName: 'info-modal-box' });
  if (title) {
    const head = document.createElement('div');
    head.className = 'info-modal-title';
    head.textContent = title;
    box.appendChild(head);
  }
  const body = document.createElement('div');
  body.className = 'info-modal-body';
  body.innerHTML = html;
  box.appendChild(body);
  if (onBody) onBody(body);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', close);
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
}

export function openDockListModal(title: string, contentEl: HTMLElement): void {
  const originalParent = contentEl.parentNode!;
  const originalNextSibling = contentEl.nextSibling;
  const { box, close } = createModalShell({
    className: 'dock-list-modal-backdrop',
    boxClassName: 'dock-list-modal-box',
    onClose: () => {
      contentEl.classList.remove('dock-list-modal-content');
      if (originalNextSibling) originalParent.insertBefore(contentEl, originalNextSibling);
      else originalParent.appendChild(contentEl);
    }
  });
  if (title) {
    const head = document.createElement('div');
    head.className = 'info-modal-title';
    head.textContent = title;
    box.appendChild(head);
  }
  contentEl.classList.add('dock-list-modal-content');
  box.appendChild(contentEl);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', close);
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
}

export function initInfoButtons(scope?: Element | Document): void {
  (scope || document).querySelectorAll('.info-btn').forEach(btn => {
    const el = btn as HTMLElement;
    if (el.dataset.infoWired) return;
    const tpl = document.getElementById(el.id + 'Content');
    if (!tpl) return;
    el.dataset.infoWired = '1';
    el.addEventListener('click', (ev: Event) => {
      ev.stopPropagation();
      showInfoModal(tpl.innerHTML, (el as HTMLButtonElement).title || '');
    });
  });
}

// ---------------- Premium hover-fill "click flash" ----------------

const FLASH_CYCLE_MS = 600;
const flashState = new WeakMap<HTMLElement, { lastTrigger: number; token: number }>();

export function initClickFlash(): void {
  document.addEventListener('click', (ev: MouseEvent) => {
    const target = ev.target as HTMLElement;
    const btn = target.closest('button') as HTMLButtonElement | null;
    if (!btn) return;
    const now = Date.now();
    const prev = flashState.get(btn);
    if (prev && now - prev.lastTrigger < FLASH_CYCLE_MS) return;
    const token = (prev ? prev.token : 0) + 1;
    flashState.set(btn, { lastTrigger: now, token });
    btn.classList.remove('fx-flash');
    void btn.offsetWidth;
    btn.classList.add('fx-flash');
    setTimeout(() => {
      const cur = flashState.get(btn);
      if (!(cur && cur.token === token)) return;
      btn.classList.remove('fx-flash');
      btn.classList.add('fx-flash-reset');
      void btn.offsetWidth;
      btn.classList.remove('fx-flash-reset');
    }, FLASH_CYCLE_MS + 50);
  }, true);
}

// ---------------- Arrow-key navigation for menus ----------------

const MENU_CONTAINER_SELECTOR = '.ctx-menu, .pdrop-menu, .pt-choice-menu, .header-cat-flyout, .confirm-btn-row';

export function initMenuKeyboardNav(onNavigate?: () => void): void {
  document.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp' && ev.key !== 'Home' && ev.key !== 'End') return;
    const menus = Array.from(document.querySelectorAll(MENU_CONTAINER_SELECTOR))
      .filter(m => getComputedStyle(m).display !== 'none');
    if (!menus.length) return;
    const menu = menus[menus.length - 1];
    const items = Array.from(menu.querySelectorAll('button:not(:disabled)')) as HTMLButtonElement[];
    if (!items.length) return;
    ev.preventDefault();
    const current = menu.contains(document.activeElement) ? items.indexOf(document.activeElement as HTMLButtonElement) : -1;
    let idx: number;
    if (current === -1) idx = (ev.key === 'ArrowUp' || ev.key === 'End') ? items.length - 1 : 0;
    else if (ev.key === 'Home') idx = 0;
    else if (ev.key === 'End') idx = items.length - 1;
    else if (ev.key === 'ArrowDown') idx = (current + 1) % items.length;
    else idx = (current - 1 + items.length) % items.length;
    items[idx].focus();
    if (onNavigate) onNavigate();
  });
}
