// Phase B module 4/N: dockable panels — drag-reorder, collapse, resize,
// layout persistence. Originally built for the right-sidebar power-tool
// docks (Tag Pruner/Unify-Void/Retroactive Merge-Void); generalized into a factory
// (`createDockManager`) so SynthDat Overseer's two columns of tool-sections
// can reuse the exact same tested collapse-animation/drag-reorder code
// (including the "reset every inline style after the transition ends" fix —
// see CLAUDE.md's Known Pitfalls) instead of a second, divergent copy.
// Self-contained: only touches its own dock* state (owned here now) plus DOM
// refs and the generic toast() helper.
import { normalRightTools, rightAside, btnResetDockLayout } from './dom';
import { toast } from './shared-ui';

// Matches --panel-dur in styles.css (kept as a plain constant here rather
// than read from getComputedStyle — this only needs to roughly match, since
// motion-off already short-circuits to the instant path below).
const DOCK_ANIM_MS = 160;

function dockMotionEnabled(){
  return !document.documentElement.classList.contains('motion-off');
}

// Matches renderer/styles.css's own `@media (max-width: 900px)` breakpoint
// (the mobile/narrow-viewport layout switch) — checked live, not captured
// once, because #normalRightTools is the SAME container element on desktop
// and in the mobile bottom panel (repositioned by CSS, not duplicated), so
// its dock manager has to decide vertical-vs-horizontal fresh on every
// collapse/resize rather than being locked into one mode at creation time.
const mobileDockLayoutQuery = matchMedia('(max-width: 900px)');

// One manager = one independent reorder/collapse/resize domain: a single
// container element whose direct `.tool-section[data-dock-id]` children can
// be dragged relative to EACH OTHER (not across managers), plus its own
// localStorage keys and default order. The original right-sidebar dock
// system is just one instance of this; SynthDat Overseer's two columns are
// two more, each scoped to its own column so a drag never moves a section
// out of the column it started in.
//
// `horizontalOnMobile: true` (only ever set for the right-sidebar manager
// below) makes collapse/resize switch from height to width whenever
// `mobileDockLayoutQuery` matches — see the mobile bottom panel design in
// notes/Mobile-Port.md. Every other manager (SynthDat's columns) ignores it
// and always collapses by height, regardless of viewport width.
interface DockManagerConfig {
  container: HTMLElement;
  storageOrderKey: string;
  storageCollapsedKey: string;
  storageHeightsKey: string;
  defaultOrder: string[];
  scrollContainer: HTMLElement | null;
  horizontalOnMobile?: boolean;
}

export function createDockManager({ container, storageOrderKey, storageCollapsedKey, storageHeightsKey, defaultOrder, scrollContainer, horizontalOnMobile }: DockManagerConfig): { init: () => void; reset: () => void } {
  function isHorizontal(): boolean {
    return !!horizontalOnMobile && mobileDockLayoutQuery.matches;
  }
  let dockOrder = defaultOrder.slice();
  let dockCollapsed: Record<string, boolean> = {};
  let dockHeights: Record<string, string> = {};

  function saveDockPrefs(): void {
    try {
      localStorage.setItem(storageOrderKey, JSON.stringify(dockOrder));
      localStorage.setItem(storageCollapsedKey, JSON.stringify(dockCollapsed));
      localStorage.setItem(storageHeightsKey, JSON.stringify(dockHeights));
    } catch(e){}
  }

  function loadDockPrefs(): void {
    try {
      const o = JSON.parse(localStorage.getItem(storageOrderKey) || 'null');
      if (Array.isArray(o) && o.length) dockOrder = o;
      dockCollapsed = JSON.parse(localStorage.getItem(storageCollapsedKey) || '{}') || {};
      dockHeights = JSON.parse(localStorage.getItem(storageHeightsKey) || '{}') || {};
    } catch(e){}
  }

  function applyDockOrder(): void {
    const sections = Array.from(container.querySelectorAll<HTMLElement>('.tool-section[data-dock-id]'));
    for (const id of dockOrder){
      const sec = sections.find(s => s.dataset.dockId === id);
      if (sec) container.appendChild(sec);
    }
    for (const sec of sections){
      if (!dockOrder.includes(sec.dataset.dockId!)) container.appendChild(sec);
    }
  }

  // `animate` is only ever true from the collapse button's own click handler —
  // initial setup and "Reset panel layout" both apply the resting state
  // directly, with no transition to play. Two section shapes exist: some
  // (tagPruner, canonicalTags) have a single `.dock-scroll-body` wrapping
  // their content; others don't, so their direct children (other than the
  // header) are collapsed individually — animating each one in parallel
  // looks the same as animating one combined wrapper would, without needing
  // to introduce a synthetic wrapper div around content another part of this
  // module also reaches into.
  // `horizontal` (per-manager, set only for the mobile bottom panel's
  // instance — see index.ts) swaps every height-axis property for its
  // width-axis equivalent below: same structure/timing/cleanup as the
  // vertical case, just collapsing width instead of height so a dock
  // shrinks sideways rather than vertically. Built from `dim`/`axis`
  // rather than duplicating the function, so the two stay in sync.
  function applyDockCollapse(sec: HTMLElement, id: string, animate = false): void {
    const horizontal = isHorizontal();
    const maxProp = horizontal ? 'maxWidth' : 'maxHeight';
    const scrollProp = horizontal ? 'scrollWidth' : 'scrollHeight';
    const overflowProp = horizontal ? 'overflowX' : 'overflowY';
    const cssProp = horizontal ? 'max-width' : 'max-height';

    const scrollBody = sec.querySelector('.dock-scroll-body') as HTMLElement | null;
    const bodyEls: HTMLElement[] = scrollBody ? [scrollBody] : (Array.from(sec.children) as HTMLElement[]).filter(el =>
      !el.classList.contains('sec-head') && !el.classList.contains('dock-resize-handle')
    );
    const resizeHandle = sec.querySelector('.dock-resize-handle') as HTMLElement | null;
    const resizeTarget = scrollBody || sec;
    const collapsing = !!dockCollapsed[id];
    const finalMaxDim = collapsing ? '' : (dockHeights[id] || '');
    const finalOverflow = collapsing ? '' : (dockHeights[id] ? 'auto' : '');

    // Horizontal mode's outer dock box (`sec`) has a fixed CSS `width`
    // (styles.css) independent of its content — unlike vertical mode,
    // where the box's height is purely content-driven, so collapsing
    // `resizeTarget` (the content body, below) naturally shrinks the whole
    // box for free. Horizontally, that same content-only collapse just
    // hid the list while the box stayed at its full fixed width — this
    // animates `sec`'s own width down to its header strip's width too, in
    // parallel with (not instead of) the existing content fade below, so
    // the dock actually "slims out" rather than just emptying out in place.
    const headEl = horizontal ? sec.querySelector('.sec-head') : null;
    const outerCollapsedWidth = headEl ? (headEl.getBoundingClientRect().width + 24) + 'px' : '100px';

    if (!animate || !dockMotionEnabled()){
      bodyEls.forEach(el => { el.style.display = collapsing ? 'none' : ''; });
      if (resizeHandle) resizeHandle.style.display = collapsing ? 'none' : '';
      resizeTarget.style[maxProp] = finalMaxDim;
      resizeTarget.style[overflowProp] = finalOverflow;
      if (horizontal) sec.style.maxWidth = collapsing ? outerCollapsedWidth : '';
      return;
    }

    if (horizontal){
      sec.style.transition = `max-width ${DOCK_ANIM_MS}ms ease`;
      requestAnimationFrame(() => { sec.style.maxWidth = collapsing ? outerCollapsedWidth : ''; });
      setTimeout(() => { sec.style.transition = ''; }, DOCK_ANIM_MS);
    }

    const trans = `${cssProp} ${DOCK_ANIM_MS}ms ease, opacity ${DOCK_ANIM_MS}ms ease`;
    if (collapsing){
      bodyEls.forEach(el => {
        el.style.overflow = 'hidden';
        el.style[maxProp] = el[scrollProp] + 'px';
        el.style.opacity = '1';
        el.style.transition = trans;
        void el.offsetHeight; // force the browser to register the start state before we change it
        requestAnimationFrame(() => { el.style[maxProp] = '0px'; el.style.opacity = '0'; });
      });
      if (resizeHandle) resizeHandle.style.display = 'none';
      setTimeout(() => {
        bodyEls.forEach(el => {
          el.style.display = 'none';
          el.style.transition = '';
          el.style.overflow = '';
          el.style[maxProp] = '';
          el.style.opacity = '';
        });
        resizeTarget.style[maxProp] = '';
        resizeTarget.style[overflowProp] = '';
      }, DOCK_ANIM_MS);
    } else {
      bodyEls.forEach(el => {
        el.style.display = '';
        el.style.overflow = 'hidden';
        el.style[maxProp] = '0px';
        el.style.opacity = '0';
        el.style.transition = trans;
      });
      if (resizeHandle) resizeHandle.style.display = '';
      void sec.offsetHeight;
      requestAnimationFrame(() => {
        bodyEls.forEach(el => {
          el.style[maxProp] = (el === scrollBody && dockHeights[id]) ? dockHeights[id] : el[scrollProp] + 'px';
          el.style.opacity = '1';
        });
      });
      setTimeout(() => {
        // Each bodyEl's own max-dim/opacity were only ever set to drive
        // this transition — left in place afterward, they never went back to
        // `''` (auto), permanently pinning that row to whatever scroll size
        // happened to be measured mid-animation. That stale max-dim still
        // let content overflow visibly rather than resizing anything, but it's
        // wrong either way and this is the actual fix for it, not just a
        // resizeTarget concern.
        bodyEls.forEach(el => {
          el.style.transition = '';
          el.style.overflow = (el === scrollBody) ? (finalOverflow || '') : '';
          el.style[maxProp] = (el === scrollBody) ? finalMaxDim : '';
          el.style.opacity = '';
        });
        resizeTarget.style[maxProp] = finalMaxDim;
        resizeTarget.style[overflowProp] = finalOverflow;
      }, DOCK_ANIM_MS);
    }
  }

  function reorderDock(draggedId: string, targetId: string, after: boolean): void {
    dockOrder = dockOrder.filter(x => x !== draggedId);
    let idx = dockOrder.indexOf(targetId);
    if (idx === -1) idx = dockOrder.length;
    if (after) idx += 1;
    dockOrder.splice(idx, 0, draggedId);
    saveDockPrefs();
    applyDockOrder();
  }

  function setupDockSection(sec: HTMLElement): void {
    const id = sec.dataset.dockId;
    if (!id || sec.dataset.dockified) return;
    sec.dataset.dockified = '1';
    const resizable = sec.dataset.resizable === 'true';
    const scrollBody = sec.querySelector('.dock-scroll-body') as HTMLElement | null;
    const resizeTarget = scrollBody || sec;

    const head = sec.querySelector('.sec-head') as HTMLElement | null;
    if (head){
      head.style.display = 'flex';
      head.style.alignItems = 'center';
      const controls = document.createElement('span');
      controls.className = 'dock-controls';

      const dragHandle = document.createElement('span');
      dragHandle.className = 'dock-drag-handle';
      dragHandle.textContent = '☰';
      dragHandle.title = 'Drag to reorder this panel';
      dragHandle.draggable = true;
      dragHandle.addEventListener('dragstart', (ev) => {
        ev.dataTransfer!.setData('text/plain', id!);
        ev.dataTransfer!.effectAllowed = 'move';
        sec.classList.add('dock-dragging');
      });
      dragHandle.addEventListener('dragend', () => sec.classList.remove('dock-dragging'));

      const collapseBtn = document.createElement('button');
      collapseBtn.className = 'dock-collapse-btn';
      collapseBtn.title = 'Collapse / expand this panel';
      // Collapsed always points ▶ (the direction the dock would expand
      // back into) — but which way EXPANDED points depends on axis: ▼
      // (collapses downward) vertically, ◀ (collapses back to the right,
      // toward the edge the width shrinks from) horizontally, matching the
      // usual disclosure-triangle convention rotated for a sideways dock.
      const collapseGlyph = () => dockCollapsed[id] ? '▶' : (isHorizontal() ? '◀' : '▼');
      collapseBtn.textContent = collapseGlyph();
      collapseBtn.addEventListener('click', () => {
        dockCollapsed[id] = !dockCollapsed[id];
        saveDockPrefs();
        applyDockCollapse(sec, id, true);
        collapseBtn.textContent = collapseGlyph();
      });

      controls.appendChild(dragHandle);
      controls.appendChild(collapseBtn);
      head.appendChild(controls);
    }

    sec.addEventListener('dragover', (ev: DragEvent) => { ev.preventDefault(); sec.classList.add('dock-drop-target'); });
    sec.addEventListener('dragleave', () => sec.classList.remove('dock-drop-target'));
    sec.addEventListener('drop', (ev: DragEvent) => {
      ev.preventDefault();
      sec.classList.remove('dock-drop-target');
      const draggedId = ev.dataTransfer!.getData('text/plain');
      // Validated against an actual dock currently in the DOM, NOT against
      // `dockOrder.includes(draggedId)` — that used to silently no-op the
      // drop for any dock missing from a stale PERSISTED order (e.g. a
      // saved order captured before this dock existed, or while some
      // other, since-removed dock's id was still in it), even though the
      // dock being dragged was completely valid. `reorderDock()` already
      // handles a dock that isn't yet in `dockOrder` fine (its `filter()`
      // call is just a no-op for it).
      if (!draggedId || draggedId === id || !container.querySelector(`.tool-section[data-dock-id="${draggedId}"]`)) return;
      // Direction comes from the two docks' CURRENT relative order, not cursor
      // position within the target — dropping anywhere on a dock swaps it with
      // the dragged one. Previously this needed the cursor in the correct half
      // of the target (top half to drop before, bottom half to drop after),
      // which meant "drag onto another dock" often silently did nothing or put
      // it in the wrong slot depending on exactly where the mouse was released.
      const draggedIdx = dockOrder.indexOf(draggedId);
      const targetIdx = dockOrder.indexOf(id);
      const dropAfter = draggedIdx !== -1 && targetIdx !== -1 && draggedIdx < targetIdx;
      reorderDock(draggedId, id, dropAfter);
    });

    applyDockCollapse(sec, id);

    if (resizable){
      const resizeHandle = document.createElement('div');
      resizeHandle.className = 'dock-resize-handle';
      resizeHandle.title = 'Drag to resize this panel';
      sec.appendChild(resizeHandle);
      // Pointer events (not mousedown-only) so this is touch-draggable too —
      // matters on the mobile bottom panel, which is the only place
      // `horizontalOnMobile` ever actually goes horizontal, but there's no
      // reason to keep the desktop vertical handle mouse-only either.
      resizeHandle.addEventListener('pointerdown', (ev) => {
        if (dockCollapsed[id!]) return;
        ev.preventDefault();
        const horizontal = isHorizontal();
        const maxProp = horizontal ? 'maxWidth' : 'maxHeight' as const;
        const overflowProp = horizontal ? 'overflowX' : 'overflowY' as const;
        resizeHandle.setPointerCapture(ev.pointerId);
        const startPos = horizontal ? ev.clientX : ev.clientY;
        const startDim = horizontal ? resizeTarget.getBoundingClientRect().width : resizeTarget.getBoundingClientRect().height;
        function onMove(mv: PointerEvent): void {
          const pos = horizontal ? mv.clientX : mv.clientY;
          const newDim = Math.max(90, startDim + (pos - startPos));
          resizeTarget.style[maxProp] = newDim + 'px';
          resizeTarget.style[overflowProp] = 'auto';

          if (scrollContainer){
            const rect = scrollContainer.getBoundingClientRect();
            const edgeMargin = 50;
            if (horizontal){
              if (mv.clientX < rect.left + edgeMargin){
                scrollContainer.scrollLeft -= Math.max(4, (rect.left + edgeMargin - mv.clientX));
              } else if (mv.clientX > rect.right - edgeMargin){
                scrollContainer.scrollLeft += Math.max(4, (mv.clientX - (rect.right - edgeMargin)));
              }
            } else {
              if (mv.clientY < rect.top + edgeMargin){
                scrollContainer.scrollTop -= Math.max(4, (rect.top + edgeMargin - mv.clientY));
              } else if (mv.clientY > rect.bottom - edgeMargin){
                scrollContainer.scrollTop += Math.max(4, (mv.clientY - (rect.bottom - edgeMargin)));
              }
            }
          }
        }
        function onUp(): void {
          resizeHandle.removeEventListener('pointermove', onMove);
          resizeHandle.removeEventListener('pointerup', onUp);
          resizeHandle.removeEventListener('pointercancel', onUp);
          dockHeights[id!] = resizeTarget.style[maxProp];
          saveDockPrefs();
        }
        resizeHandle.addEventListener('pointermove', onMove);
        resizeHandle.addEventListener('pointerup', onUp);
        resizeHandle.addEventListener('pointercancel', onUp);
      });
    }
  }

  function init(): void {
    loadDockPrefs();
    applyDockOrder();
    container.querySelectorAll<HTMLElement>('.tool-section[data-dock-id]').forEach(setupDockSection);
  }

  function reset(): void {
    dockOrder = defaultOrder.slice();
    dockCollapsed = {};
    dockHeights = {};
    saveDockPrefs();
    applyDockOrder();
    const horizontal = isHorizontal();
    container.querySelectorAll<HTMLElement>('.tool-section[data-dock-id]').forEach(sec => {
      const resizeTarget = (sec.querySelector('.dock-scroll-body') || sec) as HTMLElement;
      resizeTarget.style[horizontal ? 'maxWidth' : 'maxHeight'] = '';
      resizeTarget.style[horizontal ? 'overflowX' : 'overflowY'] = '';
      if (horizontal) sec.style.maxWidth = '';
      applyDockCollapse(sec, sec.dataset.dockId!);
      const collapseBtn = sec.querySelector('.dock-collapse-btn');
      if (collapseBtn) collapseBtn.textContent = horizontal ? '◀' : '▼';
    });
  }

  return { init, reset };
}

// ---------------- Right-sidebar power-tool docks (original usage) ----------------
const rightToolsDockManager = createDockManager({
  container: normalRightTools,
  storageOrderKey: 'dts-dock-order',
  storageCollapsedKey: 'dts-dock-collapsed',
  storageHeightsKey: 'dts-dock-heights',
  defaultOrder: ['tagPruner', 'unifyVoid', 'canonicalTags'],
  scrollContainer: rightAside,
  horizontalOnMobile: true
});

export function initDockSystem(): void {
  rightToolsDockManager.init();
}

export function resetDockLayout(): void {
  rightToolsDockManager.reset();
  toast('Panel layout reset to default.');
}

btnResetDockLayout.addEventListener('click', resetDockLayout);

// ---------------- SynthDat Overseer's left column (setup sections) ----------------
// Only the left column (ComfyUI connection / Reference image / Model & LoRA /
// ControlNet / Reference image resize) is collapsible and
// reorderable — the right column (Prompt fields, Generation) is deliberately
// left alone; those two are worked in constantly during a session and
// collapsing/reordering them would just get in the way. No resize handles
// here (not asked for, and there's no dedicated scroll container analogous
// to `rightAside` to auto-scroll during a drag).
let synthDatDockManager: { init: () => void; reset: () => void } | null = null;

export function initSynthDatSectionDocks(container: HTMLElement): void {
  synthDatDockManager = createDockManager({
    container,
    storageOrderKey: 'dts-synthdat-dock-order',
    storageCollapsedKey: 'dts-synthdat-dock-collapsed',
    storageHeightsKey: 'dts-synthdat-dock-heights',
    defaultOrder: Array.from(container.querySelectorAll<HTMLElement>('.tool-section[data-dock-id]')).map(sec => sec.dataset.dockId!),
    scrollContainer: null
  });
  synthDatDockManager.init();
}
