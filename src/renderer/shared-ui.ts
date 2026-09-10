// Phase B module 2/N: generic UI helpers with zero domain-specific dependencies
// (no tags/themes/power-tools knowledge) — used by nearly every other module,
// so this has to be dependency-free to avoid circular imports.
// @ts-nocheck — real types land once index.ts itself is typed.
import { toastEl } from './dom';

export function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ---------------- Persistent dropdown (stays open until toggled again) ----------------

export function buildPersistentDropdown(container, options, getValue, onSelect){
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pdrop-btn';
  function currentLabel(){
    const found = options.find(o => o.value === getValue());
    return found ? found.label : getValue();
  }
  btn.textContent = currentLabel() + ' ▾';
  let menuEl = null;
  function closeMenu(){
    if (menuEl){ menuEl.remove(); menuEl = null; }
  }
  function openMenu(){
    menuEl = document.createElement('div');
    menuEl.className = 'pdrop-menu';
    for (const opt of options){
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'pdrop-item' + (opt.value === getValue() ? ' active' : '');
      item.textContent = opt.label;
      if (opt.title) item.title = opt.title;
      item.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onSelect(opt.value);
        btn.textContent = currentLabel() + ' ▾';
        menuEl.querySelectorAll('.pdrop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // deliberately stays open — only the toggle button closes it
      });
      menuEl.appendChild(item);
    }
    container.appendChild(menuEl);
    requestAnimationFrame(() => requestAnimationFrame(() => menuEl.classList.add('menu-in')));
  }
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (menuEl) closeMenu(); else openMenu();
  });
  container.style.position = 'relative';
  container.appendChild(btn);
  return { refreshLabel: () => { btn.textContent = currentLabel() + ' ▾'; } };
}

// ---------------- Touch support: pinch-to-zoom + long-press (mobile groundwork) ----------------

export function attachPinchZoom(el, onZoomDelta){
  let startDist = null;
  function dist(touches){
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx*dx + dy*dy);
  }
  el.addEventListener('touchstart', (ev) => {
    if (ev.touches.length === 2) startDist = dist(ev.touches);
  }, { passive: true });
  el.addEventListener('touchmove', (ev) => {
    if (ev.touches.length === 2 && startDist){
      ev.preventDefault();
      const newDist = dist(ev.touches);
      const delta = (newDist - startDist) * 0.5;
      if (Math.abs(delta) > 2){
        onZoomDelta(delta);
        startDist = newDist;
      }
    }
  }, { passive: false });
  el.addEventListener('touchend', (ev) => {
    if (ev.touches.length < 2) startDist = null;
  }, { passive: true });
}

export function attachLongPress(el, callback, ms = 500){
  let timer = null;
  let startX = 0, startY = 0;
  const moveTolerance = 12;
  el.addEventListener('touchstart', (ev) => {
    if (ev.touches.length !== 1) return;
    startX = ev.touches[0].clientX;
    startY = ev.touches[0].clientY;
    timer = setTimeout(() => {
      timer = null;
      callback({ clientX: startX, clientY: startY, preventDefault(){}, stopPropagation(){} });
    }, ms);
  }, { passive: true });
  el.addEventListener('touchmove', (ev) => {
    if (!timer || !ev.touches[0]) return;
    const dx = ev.touches[0].clientX - startX;
    const dy = ev.touches[0].clientY - startY;
    if (Math.sqrt(dx*dx + dy*dy) > moveTolerance){ clearTimeout(timer); timer = null; }
  }, { passive: true });
  el.addEventListener('touchend', () => { if (timer){ clearTimeout(timer); timer = null; } }, { passive: true });
  el.addEventListener('touchcancel', () => { if (timer){ clearTimeout(timer); timer = null; } }, { passive: true });
}

export function toast(msg, ms = 2600) {
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toastEl.classList.remove('show'), ms);
}

// ---------------- Floating panel show/hide animation ----------------

export function showPanel(el) {
  el.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('panel-visible')));
}
export function hidePanel(el) {
  if (el.style.display === 'none') return;
  el.classList.remove('panel-visible');
  setTimeout(() => { el.style.display = 'none'; }, 160);
}

// ---------------- Generic viewport-bounded menu positioning ----------------

export function positionMenu(menu, x, y) {
  const pad = 8;
  const rect = menu.getBoundingClientRect();
  let left = x, top = y;
  if (left + rect.width + pad > window.innerWidth) left = window.innerWidth - rect.width - pad;
  if (top + rect.height + pad > window.innerHeight) top = window.innerHeight - rect.height - pad;
  menu.style.left = Math.max(pad, left) + 'px';
  menu.style.top = Math.max(pad, top) + 'px';
  // Every ctx-menu/pt-choice-menu-style popup funnels through here, so this
  // one spot covers all of them — see styles.css's `.ctx-menu, .pdrop-menu,
  // .pt-choice-menu, .header-cat-flyout` pop-in rule. Starts in the CSS's
  // opacity:0/scaled-down resting state; adding `.menu-in` a frame later is
  // what actually triggers the transition (same double-rAF pattern as
  // showPanel()/showConfirmModal(), needed so the browser paints the
  // pre-transition state at least once before the class change).
  requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('menu-in')));
}

// ---------------- Themed confirm modal (replaces window.confirm) ----------------

export function showConfirmModal(message, opts = {}) {
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
    function close(result) {
      backdrop.classList.remove('modal-visible');
      setTimeout(() => backdrop.remove(), 160);
      resolve(result);
    }
    cancelBtn.addEventListener('click', () => close(false));
    okBtn.addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(false); });
    document.addEventListener('keydown', function escHandler(ev) {
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

// ---------------- Premium hover-fill "click flash" (see styles.css) ----------------
//
// On the epic/legendary shop themes, a button's hover-fill effect normally
// only tracks :hover. Clicking one should ALSO flood it to 100% width and
// fade out, independent of whether the pointer is still over the button
// afterward. That can't be done with :active + a transition alone (it would
// snap back the instant the mouse releases) — the .fx-flash class + its
// flairClickFlash keyframe (styles.css) run the flood-and-fade as a single
// self-contained animation once triggered.
//
// This listener is generic and app-wide (delegated on document, not
// per-theme) on purpose: styles.css only gives `.fx-flash::after` a visible
// box on the specific buttons already carrying the hover-fill `::after` (the
// epic/legendary themes' buttons, already excluding ctx-item/ghost-close/
// etc.) — everywhere else `.fx-flash` has literally nothing to animate, so
// there's no need (or risk) in replicating that exclusion list here.
//
// Registered on the CAPTURE phase, not bubble. Several buttons (e.g. the
// File/Personalization header-cat toggles, setupHeaderCategory() in
// index.ts) call `ev.stopPropagation()` in their own click handler, which
// would silently swallow a bubble-phase document listener before it ever
// saw the click — that's why those buttons showed the hover fill but never
// the click flash. Capture fires top-down, before the target's own
// bubble-phase handler runs, so a later stopPropagation() can't cancel it.
//
// Matches flairClickFlash's own duration (styles.css, 0.6s) — a restart is
// only allowed once the current run has had time to finish, so the cycle
// rate is capped at the animation's own natural pace instead of following
// the click rate. Without this, rapid clicking (e.g. 5+ clicks/sec) kept
// interrupting the animation mid-flight via the remove+reflow+re-add
// restart below, snapping it back to 0% width over and over — jarring and
// "snappy" rather than a smooth repeating fill/fade. Per-button (WeakMap),
// so clicking two different buttons in quick succession still animates
// both independently. Each cycle carries a token so a still-pending cleanup
// `setTimeout` from an earlier cycle can never remove the class out from
// under a newer cycle it wasn't scheduled for — without the token, a click
// landing ~600-650ms after the previous one raced the old cycle's own
// cleanup against the new cycle's restart, occasionally cutting the new
// animation off after only a few ms and leaving the button sitting at its
// plain 75% hover fill instead of visibly flashing.
const FLASH_CYCLE_MS = 600;
const flashState = new WeakMap();

export function initClickFlash(){
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const now = Date.now();
    const prev = flashState.get(btn);
    if (prev && now - prev.lastTrigger < FLASH_CYCLE_MS) return;
    const token = (prev ? prev.token : 0) + 1;
    flashState.set(btn, { lastTrigger: now, token });
    // Restart cleanly if clicked again mid-animation (remove+reflow+re-add,
    // since re-adding the same class name alone wouldn't restart a CSS
    // animation already in progress).
    btn.classList.remove('fx-flash');
    void btn.offsetWidth;
    btn.classList.add('fx-flash');
    setTimeout(() => {
      const cur = flashState.get(btn);
      if (!(cur && cur.token === token)) return;
      // Snap width back to 0% with transitions off (.fx-flash-reset,
      // styles.css) before handing back to the normal :hover-driven width
      // rule, so a still-hovered button fills back in from zero — the same
      // motion a fresh mouseenter would produce — instead of barely moving
      // from the flash's 100%-width end state straight to 75%.
      btn.classList.remove('fx-flash');
      btn.classList.add('fx-flash-reset');
      void btn.offsetWidth;
      btn.classList.remove('fx-flash-reset');
    }, FLASH_CYCLE_MS + 50);
  }, true);
}

// Arrow-key navigation for every dropdown/context-menu style overlay in the
// app — one generic, app-wide handler rather than reimplementing it per
// menu. Deliberately container-selector based, not per-menu code: any
// future menu that reuses one of these container classes gets keyboard nav
// for free. Covers `.ctx-menu` (view.ts's tag/image-options menus,
// dataset-manager.ts's folder menu), `.pdrop-menu` (buildPersistentDropdown
// below, and themes.ts's theme picker), `.pt-choice-menu` (power-tools.ts),
// `.header-cat-flyout` (the static File/Personalization dropdowns), and
// `.confirm-btn-row` (showConfirmModal's Yes/No/Cancel row). Plain Tab
// already cycles focus through visible buttons on its own (browser
// default) — this only adds Up/Down/Home/End inside an open menu, plus
// wrap-around at the ends.
//
// Deliberately moves real DOM focus rather than tracking a separate
// "highlighted index": Enter/Space activating a focused <button> is native
// browser behavior, so it needs no extra code here, and any existing
// :focus-visible styling (see styles.css) shows the highlight for free.
const MENU_CONTAINER_SELECTOR = '.ctx-menu, .pdrop-menu, .pt-choice-menu, .header-cat-flyout, .confirm-btn-row';

// Optional onNavigate callback (achievements tracking lives in
// achievements.ts, a HIGHER-level module that already imports FROM
// shared-ui.ts — this stays a plain injected callback, not an import, so
// shared-ui.ts never imports achievements.ts back and creates a cycle).
export function initMenuKeyboardNav(onNavigate){
  document.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp' && ev.key !== 'Home' && ev.key !== 'End') return;
    // .header-cat-flyout is static markup, always in the DOM and merely
    // display:none-toggled when closed (unlike ctx-menu/pdrop-menu/
    // pt-choice-menu/confirm-btn-row, which are only ever created while
    // actually open) — without this visibility filter, a CLOSED flyout
    // would still count as "a menu is present," hijacking every ArrowUp/
    // Down press app-wide (breaking Single view's image navigation, the
    // zoom/font sliders, etc.) even with nothing open at all.
    const menus = Array.from(document.querySelectorAll(MENU_CONTAINER_SELECTOR))
      .filter(m => getComputedStyle(m).display !== 'none');
    if (!menus.length) return;
    // Multiple such containers can theoretically be open/present at once
    // (e.g. a ctx-menu opened from inside a still-open header-cat-flyout);
    // the most-recently-opened one is reliably the last DOM match, since
    // ctx-menu/pdrop-menu/pt-choice-menu are all freshly appended to
    // document.body at open time, after any static flyout markup.
    const menu = menus[menus.length - 1];
    const items = Array.from(menu.querySelectorAll('button:not(:disabled)'));
    if (!items.length) return;
    ev.preventDefault();
    const current = menu.contains(document.activeElement) ? items.indexOf(document.activeElement) : -1;
    let idx;
    if (current === -1) idx = (ev.key === 'ArrowUp' || ev.key === 'End') ? items.length - 1 : 0;
    else if (ev.key === 'Home') idx = 0;
    else if (ev.key === 'End') idx = items.length - 1;
    else if (ev.key === 'ArrowDown') idx = (current + 1) % items.length;
    else idx = (current - 1 + items.length) % items.length;
    items[idx].focus();
    if (onNavigate) onNavigate();
  });
}
