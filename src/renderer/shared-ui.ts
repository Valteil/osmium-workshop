// Phase B module 2/N: generic UI helpers with zero domain-specific dependencies
// (no tags/themes/power-tools knowledge) — used by nearly every other module,
// so this has to be dependency-free to avoid circular imports.
// @ts-nocheck — real types land once index.ts itself is typed.
import { toastEl, pdropCloseOnSelectToggle, flyoutOutsideCloseToggle, outsideClickSwallowToggle } from './dom';

// ---------------- Pdrop-menu "close after selecting" preference ----------------
// Default on (closes after a pick) — matches ordinary dropdown expectations.
// Off lets someone try several options in a row without reopening the menu
// each time. Either way this only ever closes the pdrop-menu itself, never
// whatever floating panel it happens to live inside (see buildPersistentDropdown()).
const PDROP_CLOSE_ON_SELECT_KEY = 'dts-pdrop-close-on-select';
(function initPdropCloseOnSelectPref(){
  let on = true;
  try { on = localStorage.getItem(PDROP_CLOSE_ON_SELECT_KEY) !== '0'; } catch(e){}
  pdropCloseOnSelectToggle.checked = on;
})();
pdropCloseOnSelectToggle.addEventListener('change', () => {
  try { localStorage.setItem(PDROP_CLOSE_ON_SELECT_KEY, pdropCloseOnSelectToggle.checked ? '1' : '0'); } catch(e){}
});
function pdropClosesOnSelect(){
  return pdropCloseOnSelectToggle.checked;
}

// ---------------- "Swallow" the click that closes a menu/panel ----------------
// Off by default — most users want a click to feel responsive (close AND
// still hit whatever it landed on, e.g. a button that happened to be behind
// an open dropdown), not maximally safe. On, a click that closes something
// does ONLY that — it never also activates whatever element it was over.
//
// The three "click outside closes X" mechanisms in this app use two
// different trigger events: header-cat-flyout (File/Personalization) closes
// on 'mousedown' (a hard-won fix for a native <select> scroll-dismiss
// phantom-click bug — see CLAUDE.md's Known Pitfalls, do not change that
// trigger), while floating panels and pdrop-menus close on 'click'. A click
// and its own preceding mousedown are two SEPARATE event dispatches — you
// cannot swallow a click by calling stopPropagation() on its mousedown, and
// by the time any BUBBLE-phase 'click' listener would notice something just
// closed, the click has already reached its target and fired that target's
// own handlers (capture always finishes before target-phase). So: panels
// and pdrop-menus swallow directly, in the CAPTURE phase, at the exact
// moment they decide to close (see hidePanel()/buildPersistentDropdown()
// below); header-cat-flyout can't decide-and-swallow in the same event, so
// its mousedown handler (index.ts) calls markSwallowNextClick() instead,
// and this single capture-phase 'click' listener consumes that mark on
// the very next click, wherever the flyout's own close logic already ran.
const OUTSIDE_CLICK_SWALLOW_KEY = 'dts-outside-click-swallow';
(function initOutsideClickSwallowPref(){
  let on = false;
  try { on = localStorage.getItem(OUTSIDE_CLICK_SWALLOW_KEY) === '1'; } catch(e){}
  outsideClickSwallowToggle.checked = on;
})();
outsideClickSwallowToggle.addEventListener('change', () => {
  try { localStorage.setItem(OUTSIDE_CLICK_SWALLOW_KEY, outsideClickSwallowToggle.checked ? '1' : '0'); } catch(e){}
});
export function shouldSwallowOutsideClick(){
  return outsideClickSwallowToggle.checked;
}
let swallowNextClick = false;
export function markSwallowNextClick(){
  swallowNextClick = true;
}
document.addEventListener('click', (ev) => {
  if (!swallowNextClick) return;
  swallowNextClick = false;
  ev.stopPropagation();
  ev.preventDefault();
}, true);

export function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Shrinks an element's own font-size (inline style) just enough for its
// content to fit its current box width, instead of losing characters to
// `text-overflow: ellipsis` — used for compact controls (dropdown buttons)
// where a clipped label reads as broken rather than intentional. Always
// re-measures from the CSS-authored font-size first (never the previously
// shrunk value), so a shorter label or a wider box restores the normal size
// instead of ratcheting smaller forever. `el.clientWidth` is 0 before the
// element is actually in the DOM/laid out, so callers must invoke this
// AFTER appending, not before.
export function shrinkTextToFit(el, minFontPx = 9){
  el.style.fontSize = '';
  const baseFontPx = parseFloat(getComputedStyle(el).fontSize);
  if (!baseFontPx || el.scrollWidth <= el.clientWidth) return;
  let fontPx = baseFontPx;
  while (fontPx > minFontPx && el.scrollWidth > el.clientWidth){
    fontPx -= 0.5;
    el.style.fontSize = fontPx + 'px';
  }
}

// ---------------- Persistent dropdown (stays open until toggled again) ----------------

// A pdrop-menu is appended to document.body (position:fixed) rather than
// living inside its own small `.pdrop` container — necessary so it can't be
// clipped by a scrollable/overflow:hidden ancestor like the Settings panel
// (see buildPersistentDropdown()'s own comment below) — but that also means
// it's no longer a DOM descendant of whatever floating panel it visually
// belongs to, so closing that panel no longer implicitly closes the menu
// too. This one shared tracking slot is how the two stay in sync: whichever
// pdrop-menu is currently open registers its own close function here, and
// closeAllFloatingPanels()/opening a different pdrop-menu both call it
// before doing anything else — otherwise you can end up with an orphaned
// dropdown floating alone on screen after its parent panel is long gone.
let openPdropClose = null;
let openPdropOwnerPanel = null; // the .theme-panel this pdrop-menu's button lives inside, if any
let openPdropMenuEl = null; // the reparented .pdrop-menu element itself
function closeAnyOpenPdrop(){
  if (openPdropClose){ const fn = openPdropClose; openPdropClose = null; openPdropOwnerPanel = null; openPdropMenuEl = null; fn(); }
}
// Closes the currently-open pdrop-menu ONLY if it belongs to `panelEl` —
// used by hidePanel() so closing one panel (its own ✕ button, say) doesn't
// reach out and close an unrelated pdrop-menu open elsewhere on screen, but
// still cleans up the orphan case: a pdrop-menu left open inside a panel
// that then closes some other way than selecting from that same dropdown.
function closeOwnedPdropIfPanel(panelEl){
  if (openPdropOwnerPanel === panelEl) closeAnyOpenPdrop();
}
// A pdrop-menu that belongs to `panelEl` lives in document.body, not inside
// `panelEl`'s own DOM subtree (see the reparenting comment above) — so a
// panel's own "click outside closes it" check (getOutsideClosablePanels()'s
// consumer in index.ts) sees a click on one of ITS OWN dropdown's items as
// happening outside the panel, and closes the panel before the item's own
// click handler ever runs. This is how that check tells the two apart:
// treat a click as "still inside the panel" if it landed in a currently-open
// pdrop-menu this exact panel owns.
export function isClickInsideOwnedPdrop(panelEl, target){
  return !!(openPdropMenuEl && openPdropOwnerPanel === panelEl && openPdropMenuEl.contains(target));
}

// Closes every currently-visible floating panel (Settings, Favorites, Log,
// Achievements, Shop, Theme Custom, Tag Details — anything using the shared
// `.theme-panel` class, see CLAUDE.md's Critical Constraints) plus any open
// pdrop-menu. Opening ANY of those things should dismiss whatever else was
// already open — a dropdown or a different panel showing up ontop of/behind
// an already-open panel is confusing, not additive, in this app's UI.
export function closeAllFloatingPanels(exceptEl){
  closeAnyOpenPdrop();
  document.querySelectorAll('.theme-panel.panel-visible').forEach(el => {
    if (el !== exceptEl) hidePanel(el);
  });
}

export function buildPersistentDropdown(container, options, getValue, onSelect){
  container.innerHTML = '';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pdrop-btn';
  function currentLabel(){
    const found = options.find(o => o.value === getValue());
    return found ? found.label : getValue();
  }
  function setLabel(){
    btn.textContent = currentLabel() + ' ▾';
    shrinkTextToFit(btn);
  }
  btn.textContent = currentLabel() + ' ▾';
  let menuEl = null;
  function closeMenu(){
    if (menuEl){ menuEl.remove(); menuEl = null; }
    if (openPdropClose === closeMenu){ openPdropClose = null; openPdropOwnerPanel = null; openPdropMenuEl = null; }
  }
  function openMenu(){
    // Opening this dropdown closes any other open pdrop-menu AND any open
    // floating panel that isn't the one this dropdown itself lives inside —
    // e.g. opening the gallery filter's AND/OR dropdown should dismiss an
    // open Settings panel, the same way opening a different panel would.
    const ownPanel = container.closest('.theme-panel');
    closeAllFloatingPanels(ownPanel);
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
        setLabel();
        menuEl.querySelectorAll('.pdrop-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        // Closes the dropdown itself by default (Settings' own toggle can
        // turn this off, for trying several options in a row without
        // reopening the menu each time) — but NEVER closes any floating
        // panel this dropdown happens to live inside (e.g. Settings' own
        // "Panel arrangement"). Closing the menu and closing its ancestor
        // panel are two separate, independent things.
        if (pdropClosesOnSelect()) closeMenu();
      });
      menuEl.appendChild(item);
    }
    // Appended to document.body with position:fixed (not `container`, which
    // may sit inside a scrollable/overflow:hidden panel like Settings) — a
    // container-relative popup silently clips once it doesn't fit, with no
    // boundary awareness. positionMenu() clamps it on-screen from the
    // button's own position instead, same as every ctx-menu in the app.
    document.body.appendChild(menuEl);
    const rect = btn.getBoundingClientRect();
    positionMenu(menuEl, rect.left, rect.bottom + 4);
    openPdropClose = closeMenu;
    openPdropOwnerPanel = ownPanel;
    openPdropMenuEl = menuEl;
  }
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (menuEl) closeMenu(); else openMenu();
  });
  // Clicking anywhere outside this menu closes it — dead space, some other
  // unrelated control, or the toggle button of a DIFFERENT dropdown/panel
  // that itself calls stopPropagation (that case is instead handled by
  // closeAllFloatingPanels() inside openMenu(), unconditionally — this is
  // specifically the plain "clicked elsewhere" case). Gated by the same
  // Settings toggle that governs the File/Personalization flyouts, since
  // both are "does clicking off a menu close it" in the user's mind.
  // Capture phase so this can swallow the click when that Settings toggle is
  // on — see shouldSwallowOutsideClick()'s own comment above for why that
  // requires deciding-and-stopping before the click ever reaches its target.
  document.addEventListener('click', (ev) => {
    if (!menuEl || !flyoutOutsideCloseToggle.checked) return;
    if (menuEl.contains(ev.target) || container.contains(ev.target)) return;
    closeMenu();
    if (shouldSwallowOutsideClick()){ ev.stopPropagation(); ev.preventDefault(); }
  }, true);
  container.appendChild(btn);
  // Only meaningful once `btn` is actually in the DOM (clientWidth is 0
  // before layout) — this is the first point that's true for the initial
  // label set above.
  shrinkTextToFit(btn);
  return { refreshLabel: setLabel };
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
  closeOwnedPdropIfPanel(el);
  if (el.style.display === 'none') return;
  el.classList.remove('panel-visible');
  setTimeout(() => { el.style.display = 'none'; }, 160);
}

// ---------------- Generic full-screen image lightbox ----------------
// A bare "click to inspect closer" viewer for an arbitrary <img> src — not
// tied to a gallery `entry` the way openImageCardModal() (view.ts) is, so it
// lives here as a small reusable utility instead (first user: SynthDat
// Overseer's reference/output previews).
export function showImageLightbox(src) {
  if (!src) return;
  const backdrop = document.createElement('div');
  backdrop.className = 'lightbox-backdrop';
  const img = document.createElement('img');
  img.src = src;
  img.style.transformOrigin = 'center center';
  backdrop.appendChild(img);

  // Scroll-to-zoom past the image's own fit-to-screen size (clamped so it
  // can't shrink below normal or grow absurdly large), plus drag-to-pan once
  // zoomed in — panning only engages when scale > 1, and pan is rescaled
  // proportionally as zoom changes so it doesn't jump when you zoom further
  // while already panned. `didDrag` distinguishes an actual drag gesture
  // from a plain click: mouseup after dragging still fires a native 'click'
  // on the same target, which would otherwise close the lightbox the moment
  // you finish panning.
  let scale = 1, panX = 0, panY = 0;
  let dragging = false, didDrag = false, dragStartX = 0, dragStartY = 0, panStartX = 0, panStartY = 0;
  const MIN_SCALE = 1, MAX_SCALE = 6;
  function applyTransform(){
    img.style.transform = (scale === 1 && panX === 0 && panY === 0) ? '' : `translate(${panX}px, ${panY}px) scale(${scale})`;
    img.style.cursor = scale > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-out';
  }
  function onWheel(ev){
    ev.preventDefault();
    ev.stopPropagation();
    const prevScale = scale;
    const delta = -ev.deltaY * 0.0015;
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + scale * delta));
    if (scale === MIN_SCALE){ panX = 0; panY = 0; }
    else { const ratio = scale / prevScale; panX *= ratio; panY *= ratio; }
    applyTransform();
  }
  function onMouseDown(ev){
    if (scale <= 1) return;
    ev.preventDefault();
    ev.stopPropagation();
    dragging = true; didDrag = false;
    dragStartX = ev.clientX; dragStartY = ev.clientY;
    panStartX = panX; panStartY = panY;
    applyTransform();
  }
  function onMouseMove(ev){
    if (!dragging) return;
    const dx = ev.clientX - dragStartX, dy = ev.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
    panX = panStartX + dx;
    panY = panStartY + dy;
    applyTransform();
  }
  function onMouseUp(){
    if (!dragging) return;
    dragging = false;
    applyTransform();
  }
  img.addEventListener('wheel', onWheel, { passive: false });
  img.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  function close() {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }
  function onKey(ev) { if (ev.key === 'Escape') close(); }
  backdrop.addEventListener('click', () => {
    if (didDrag){ didDrag = false; return; }
    close();
  });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
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

// For a long instructional block that's better tucked behind an ⓘ button
// than shown inline all the time — content is trusted static HTML from this
// app's own <template> elements (see initInfoButtons() below), never
// user/external input, so innerHTML here is safe.
export function showInfoModal(html, title){
  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-backdrop';
  const box = document.createElement('div');
  box.className = 'confirm-box info-modal-box';
  if (title){
    const head = document.createElement('div');
    head.className = 'info-modal-title';
    head.textContent = title;
    box.appendChild(head);
  }
  const body = document.createElement('div');
  body.className = 'info-modal-body';
  body.innerHTML = html;
  box.appendChild(body);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  function close(){
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });
  document.addEventListener('keydown', function escHandler(ev){
    if (ev.key === 'Escape'){ close(); document.removeEventListener('keydown', escHandler); }
  });
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
}

// Wires every `.info-btn` on the page to open showInfoModal() with the
// content of its matching `#info<Id>Content` <template> — a fixed naming
// convention (button id "infoFoo" ↔ template id "infoFooContent") so adding
// a new one elsewhere needs no new JS wiring, just those two elements in the
// HTML. Safe to call once at startup since it's a static document scan, not
// per-panel setup.
// `scope` restricts the scan to one container's own `.info-btn`s — needed
// for content that gets re-inserted after startup (e.g. the Help panel
// swapping sections via innerHTML): re-scanning the whole `document` every
// time would re-wire every OTHER already-wired button too, stacking a
// duplicate click listener onto each one every time. Defaults to the whole
// document for the one-time startup call that covers everything static.
export function initInfoButtons(scope){
  (scope || document).querySelectorAll('.info-btn').forEach(btn => {
    if (btn.dataset.infoWired) return;
    const tpl = document.getElementById(btn.id + 'Content');
    if (!tpl) return;
    btn.dataset.infoWired = '1';
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      showInfoModal(tpl.innerHTML, btn.title || '');
    });
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
