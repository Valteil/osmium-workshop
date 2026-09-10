// Phase B module 4/N: dockable right-sidebar panels — drag-reorder, collapse,
// resize, layout persistence. Self-contained: only touches its own dock*
// state (owned here now) plus DOM refs and the generic toast() helper.
// @ts-nocheck — real types land once index.ts itself is typed.
import { normalRightTools, rightAside, btnResetDockLayout } from './dom';
import { toast } from './shared-ui';

export let dockOrder = ['tagPruner', 'unifyVoid'];
export let dockCollapsed = {};
export let dockHeights = {};

export function saveDockPrefs(){
  try {
    localStorage.setItem('dts-dock-order', JSON.stringify(dockOrder));
    localStorage.setItem('dts-dock-collapsed', JSON.stringify(dockCollapsed));
    localStorage.setItem('dts-dock-heights', JSON.stringify(dockHeights));
  } catch(e){}
}

export function loadDockPrefs(){
  try {
    const o = JSON.parse(localStorage.getItem('dts-dock-order') || 'null');
    if (Array.isArray(o) && o.length) dockOrder = o;
    dockCollapsed = JSON.parse(localStorage.getItem('dts-dock-collapsed') || '{}') || {};
    dockHeights = JSON.parse(localStorage.getItem('dts-dock-heights') || '{}') || {};
  } catch(e){}
}

export function applyDockOrder(){
  const sections = Array.from(normalRightTools.querySelectorAll('.tool-section[data-dock-id]'));
  for (const id of dockOrder){
    const sec = sections.find(s => s.dataset.dockId === id);
    if (sec) normalRightTools.appendChild(sec);
  }
  // append any dock ids not yet known (future-proofing)
  for (const sec of sections){
    if (!dockOrder.includes(sec.dataset.dockId)) normalRightTools.appendChild(sec);
  }
}

// Matches --panel-dur in styles.css (kept as a plain constant here rather
// than read from getComputedStyle — this only needs to roughly match, since
// motion-off already short-circuits to the instant path below).
const DOCK_ANIM_MS = 160;

function dockMotionEnabled(){
  return !document.documentElement.classList.contains('motion-off');
}

// `animate` is only ever true from the collapse button's own click handler —
// initial setup and "Reset panel layout" both apply the resting state
// directly, with no transition to play. Two section shapes exist: quickMerge
// has a single `.dock-scroll-body` wrapping its content; tagPruner/unifyVoid
// don't, so their direct children (other than the header) are collapsed
// individually — animating each one in parallel looks the same as animating
// one combined wrapper would, without needing to introduce a synthetic
// wrapper div around content another part of this module also reaches into.
export function applyDockCollapse(sec, id, animate){
  const scrollBody = sec.querySelector('.dock-scroll-body');
  const bodyEls = scrollBody ? [scrollBody] : Array.from(sec.children).filter(el =>
    !el.classList.contains('sec-head') && !el.classList.contains('dock-resize-handle')
  );
  const resizeHandle = sec.querySelector('.dock-resize-handle');
  const resizeTarget = scrollBody || sec;
  const collapsing = !!dockCollapsed[id];
  const finalMaxHeight = collapsing ? '' : (dockHeights[id] || '');
  const finalOverflowY = collapsing ? '' : (dockHeights[id] ? 'auto' : '');

  if (!animate || !dockMotionEnabled()){
    bodyEls.forEach(el => { el.style.display = collapsing ? 'none' : ''; });
    if (resizeHandle) resizeHandle.style.display = collapsing ? 'none' : '';
    resizeTarget.style.maxHeight = finalMaxHeight;
    resizeTarget.style.overflowY = finalOverflowY;
    return;
  }

  const trans = `max-height ${DOCK_ANIM_MS}ms ease, opacity ${DOCK_ANIM_MS}ms ease`;
  if (collapsing){
    bodyEls.forEach(el => {
      el.style.overflow = 'hidden';
      el.style.maxHeight = el.scrollHeight + 'px';
      el.style.opacity = '1';
      el.style.transition = trans;
      void el.offsetHeight; // force the browser to register the start state before we change it
      requestAnimationFrame(() => { el.style.maxHeight = '0px'; el.style.opacity = '0'; });
    });
    if (resizeHandle) resizeHandle.style.display = 'none';
    setTimeout(() => {
      bodyEls.forEach(el => {
        el.style.display = 'none';
        el.style.transition = '';
        el.style.overflow = '';
        el.style.maxHeight = '';
        el.style.opacity = '';
      });
      resizeTarget.style.maxHeight = '';
      resizeTarget.style.overflowY = '';
    }, DOCK_ANIM_MS);
  } else {
    bodyEls.forEach(el => {
      el.style.display = '';
      el.style.overflow = 'hidden';
      el.style.maxHeight = '0px';
      el.style.opacity = '0';
      el.style.transition = trans;
    });
    if (resizeHandle) resizeHandle.style.display = '';
    void sec.offsetHeight;
    requestAnimationFrame(() => {
      bodyEls.forEach(el => {
        el.style.maxHeight = (el === scrollBody && dockHeights[id]) ? dockHeights[id] : el.scrollHeight + 'px';
        el.style.opacity = '1';
      });
    });
    setTimeout(() => {
      // Each bodyEl's own max-height/opacity were only ever set to drive
      // this transition — left in place afterward, they never went back to
      // `''` (auto), permanently pinning that row to whatever scrollHeight
      // happened to be measured mid-animation. That stale max-height still
      // let content overflow visibly rather than resizing anything, but it's
      // wrong either way and this is the actual fix for it, not just a
      // resizeTarget concern.
      bodyEls.forEach(el => {
        el.style.transition = '';
        el.style.overflow = (el === scrollBody) ? (finalOverflowY || '') : '';
        el.style.maxHeight = (el === scrollBody) ? finalMaxHeight : '';
        el.style.opacity = '';
      });
      resizeTarget.style.maxHeight = finalMaxHeight;
      resizeTarget.style.overflowY = finalOverflowY;
    }, DOCK_ANIM_MS);
  }
}

export function reorderDock(draggedId, targetId, after){
  dockOrder = dockOrder.filter(x => x !== draggedId);
  let idx = dockOrder.indexOf(targetId);
  if (idx === -1) idx = dockOrder.length;
  if (after) idx += 1;
  dockOrder.splice(idx, 0, draggedId);
  saveDockPrefs();
  applyDockOrder();
}

export function setupDockSection(sec){
  const id = sec.dataset.dockId;
  if (!id || sec.dataset.dockified) return;
  sec.dataset.dockified = '1';
  const resizable = sec.dataset.resizable === 'true';
  const scrollBody = sec.querySelector('.dock-scroll-body');
  const resizeTarget = scrollBody || sec;

  const head = sec.querySelector('.sec-head');
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
      ev.dataTransfer.setData('text/plain', id);
      ev.dataTransfer.effectAllowed = 'move';
      sec.classList.add('dock-dragging');
    });
    dragHandle.addEventListener('dragend', () => sec.classList.remove('dock-dragging'));

    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'dock-collapse-btn';
    collapseBtn.title = 'Collapse / expand this panel';
    collapseBtn.textContent = dockCollapsed[id] ? '▶' : '▼';
    collapseBtn.addEventListener('click', () => {
      dockCollapsed[id] = !dockCollapsed[id];
      saveDockPrefs();
      applyDockCollapse(sec, id, true);
      collapseBtn.textContent = dockCollapsed[id] ? '▶' : '▼';
    });

    controls.appendChild(dragHandle);
    controls.appendChild(collapseBtn);
    head.appendChild(controls);
  }

  sec.addEventListener('dragover', (ev) => { ev.preventDefault(); sec.classList.add('dock-drop-target'); });
  sec.addEventListener('dragleave', () => sec.classList.remove('dock-drop-target'));
  sec.addEventListener('drop', (ev) => {
    ev.preventDefault();
    sec.classList.remove('dock-drop-target');
    const draggedId = ev.dataTransfer.getData('text/plain');
    if (!draggedId || draggedId === id) return;
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
    resizeHandle.addEventListener('mousedown', (ev) => {
      if (dockCollapsed[id]) return;
      ev.preventDefault();
      const startY = ev.clientY;
      const startHeight = resizeTarget.getBoundingClientRect().height;
      function onMove(mv){
        const newHeight = Math.max(90, startHeight + (mv.clientY - startY));
        resizeTarget.style.maxHeight = newHeight + 'px';
        resizeTarget.style.overflowY = 'auto';

        // Auto-scroll the right sidebar so the cursor never drifts off-screen mid-drag
        const rightRect = rightAside.getBoundingClientRect();
        const edgeMargin = 50;
        if (mv.clientY < rightRect.top + edgeMargin){
          rightAside.scrollTop -= Math.max(4, (rightRect.top + edgeMargin - mv.clientY));
        } else if (mv.clientY > rightRect.bottom - edgeMargin){
          rightAside.scrollTop += Math.max(4, (mv.clientY - (rightRect.bottom - edgeMargin)));
        }
      }
      function onUp(){
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        dockHeights[id] = resizeTarget.style.maxHeight;
        saveDockPrefs();
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
}

export function initDockSystem(){
  loadDockPrefs();
  applyDockOrder();
  normalRightTools.querySelectorAll('.tool-section[data-dock-id]').forEach(setupDockSection);
}

export function resetDockLayout(){
  dockOrder = ['tagPruner', 'unifyVoid'];
  dockCollapsed = {};
  dockHeights = {};
  saveDockPrefs();
  applyDockOrder();
  normalRightTools.querySelectorAll('.tool-section[data-dock-id]').forEach(sec => {
    const resizeTarget = sec.querySelector('.dock-scroll-body') || sec;
    resizeTarget.style.maxHeight = '';
    resizeTarget.style.overflowY = '';
    applyDockCollapse(sec, sec.dataset.dockId);
    const collapseBtn = sec.querySelector('.dock-collapse-btn');
    if (collapseBtn) collapseBtn.textContent = '▼';
  });
  toast('Panel layout reset to default.');
}

btnResetDockLayout.addEventListener('click', resetDockLayout);
