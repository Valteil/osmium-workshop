import { toastEl, pdropCloseOnSelectToggle, flyoutOutsideCloseToggle, outsideClickSwallowToggle } from './dom';

// ---------------- Pdrop-menu "close after selecting" preference ----------------

const PDROP_CLOSE_ON_SELECT_KEY = 'dts-pdrop-close-on-select';
(function initPdropCloseOnSelectPref(): void {
  let on = true;
  try { on = localStorage.getItem(PDROP_CLOSE_ON_SELECT_KEY) !== '0'; } catch {}
  pdropCloseOnSelectToggle.checked = on;
})();
pdropCloseOnSelectToggle.addEventListener('change', () => {
  try { localStorage.setItem(PDROP_CLOSE_ON_SELECT_KEY, pdropCloseOnSelectToggle.checked ? '1' : '0'); } catch {}
});
function pdropClosesOnSelect(): boolean {
  return pdropCloseOnSelectToggle.checked;
}

// ---------------- "Swallow" the click that closes a menu/panel ----------------

const OUTSIDE_CLICK_SWALLOW_KEY = 'dts-outside-click-swallow';
(function initOutsideClickSwallowPref(): void {
  let on = false;
  try { on = localStorage.getItem(OUTSIDE_CLICK_SWALLOW_KEY) === '1'; } catch {}
  outsideClickSwallowToggle.checked = on;
})();
outsideClickSwallowToggle.addEventListener('change', () => {
  try { localStorage.setItem(OUTSIDE_CLICK_SWALLOW_KEY, outsideClickSwallowToggle.checked ? '1' : '0'); } catch {}
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
    btn.textContent = currentLabel() + ' ▾';
    shrinkTextToFit(btn);
  }
  btn.textContent = currentLabel() + ' ▾';
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
      item.textContent = opt.label;
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
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
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

export function showImageLightbox(src: string): void {
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

export function showConfirmModal(message: string, opts: ConfirmModalOpts = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-backdrop';
    const box = document.createElement('div');
    box.className = 'confirm-box';
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
    function close(result: boolean): void {
      backdrop.classList.remove('modal-visible');
      setTimeout(() => backdrop.remove(), 160);
      resolve(result);
    }
    cancelBtn.addEventListener('click', () => close(false));
    okBtn.addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (ev: MouseEvent) => { if (ev.target === backdrop) close(false); });
    document.addEventListener('keydown', function escHandler(ev: KeyboardEvent) {
      if (ev.key === 'Escape') { close(false); document.removeEventListener('keydown', escHandler); }
    });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
  });
}

export function showInfoModal(html: string, title?: string, onBody?: (body: HTMLElement) => void): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-backdrop';
  const box = document.createElement('div');
  box.className = 'confirm-box info-modal-box';
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
  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev: MouseEvent) => { if (ev.target === backdrop) close(); });
  document.addEventListener('keydown', function escHandler(ev: KeyboardEvent) {
    if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  });
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}

export function openDockListModal(title: string, contentEl: HTMLElement): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-backdrop dock-list-modal-backdrop';
  const box = document.createElement('div');
  box.className = 'confirm-box dock-list-modal-box';
  if (title) {
    const head = document.createElement('div');
    head.className = 'info-modal-title';
    head.textContent = title;
    box.appendChild(head);
  }
  const originalParent = contentEl.parentNode!;
  const originalNextSibling = contentEl.nextSibling;
  contentEl.classList.add('dock-list-modal-content');
  box.appendChild(contentEl);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => {
      contentEl.classList.remove('dock-list-modal-content');
      if (originalNextSibling) originalParent.insertBefore(contentEl, originalNextSibling);
      else originalParent.appendChild(contentEl);
      backdrop.remove();
    }, 160);
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev: MouseEvent) => { if (ev.target === backdrop) close(); });
  document.addEventListener('keydown', function escHandler(ev: KeyboardEvent) {
    if (ev.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
  });
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
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
