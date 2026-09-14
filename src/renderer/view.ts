// Phase B module: all gallery/single/compact view rendering, the floating
// image card modal, chips + tag context menu, and the image options menu
// (3-dot: text/language, review flag, notes). This is the highest-fan-in
// rendering domain in the app. Several core index.ts internals that stay
// outside this extraction (entries, dirHandle-adjacent state, settings
// toggles, galleryFilter/cardTagSortMode/masterTagModeActive which are
// mutated from dropdowns/tabs that live in index.ts) are injected once via
// initView(), since index.ts's IIFE can't export them.
// @ts-nocheck
import {
  viewGridBtn, viewCompactBtn, viewSingleBtn, viewDisabledBtn, btnUnlockAll, singlePrevBtn, singleNextBtn,
  galleryGrid, compactGrid, compactCompareArea, compareCount, compactCompareTable, btnClearCompare,
  singleViewEl, singleNav, singlePos, imageCardModal, modalCardInner,
  langAutoSelectToggle, filterMatchCount
} from './dom';
import { toast, showConfirmModal, positionMenu, attachLongPress, attachPinchZoom } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange, addTagToEntry, removeTagFromEntry, resetImageEdits, moveEntry } from './tags-edit';
import { openTagDetails } from './tag-details';
import { attachTagAutocomplete, closeAutocomplete } from './tags-autocomplete';
import { buildTagIndex, refreshStats, filteredEntries } from './tag-index';
import { masterSelectedImages, renderMasterSelectionSummary, renderMasterMiniGrid } from './master-tag-control';
import { renderTagPruners } from './tag-pruner';
import { tagSingleImageWithWd14 } from './wd14-tagger';

export let viewMode = 'grid'; // 'grid' | 'compact' | 'single' | 'disabled'
export let stickyCompareImages = [];

let singleIndex = 0;
let ctxMenuEl = null;
let commonLanguages = ['English'];
let autoSelectNewLanguage = true;

let getEntries = () => [];
let getEntryByBase = () => undefined;
let getMasterTagModeActive = () => false;
let getCardTagSortMode = () => 'default';
let getGalleryFilter = () => ({ terms: [] });
let getIsolatedFlagActive = () => false;
let getShowTagCountBadges = () => false;
let getEntryMeta = () => ({});
let saveEntryMetaRef = () => {};
let refreshAllUIRef = () => {};

export function resetSingleIndex(){
  singleIndex = 0;
}

export function resetStickyCompare(){
  stickyCompareImages = [];
}

export function renderCurrentView(){
  if (viewMode === 'single') renderSingleView();
  else if (viewMode === 'compact') renderCompactGrid();
  else renderGallery();
  if (getMasterTagModeActive()) renderMasterMiniGrid();
  updateFilterMatchCount();
}

// Shows how many images the active tag filter currently matches, to the left
// of the sort controls in the gallery toolbar — only while a tag filter is
// actually active (base 'all'/'untagged'/'dirty' quick-filters alone don't
// count, only real search terms typed into filterInput).
function updateFilterMatchCount(){
  const gf = getGalleryFilter();
  if (gf.terms && gf.terms.length && !gf.disabledView){
    const n = filteredEntries().length;
    filterMatchCount.textContent = `${n} match${n === 1 ? '' : 'es'}`;
    filterMatchCount.style.display = '';
  } else {
    filterMatchCount.style.display = 'none';
  }
}

// ---------------- View mode (grid / compact / single) ----------------

// Grid and Disabled share #galleryGrid (getGalleryFilter().disabledView is
// what actually distinguishes them), so a switch between the two never needs
// a transition — the container never disappears/reappears.
const VIEW_TRANSITION_ORDER = ['grid', 'compact', 'single', 'disabled'];
function viewContainerFor(mode){
  if (mode === 'compact') return compactGrid;
  if (mode === 'single') return singleViewEl;
  return galleryGrid;
}

export function switchView(mode){
  const prevMode = viewMode;
  const applyState = () => {
    viewMode = mode;
    viewGridBtn.classList.toggle('active', mode === 'grid');
    viewCompactBtn.classList.toggle('active', mode === 'compact');
    viewSingleBtn.classList.toggle('active', mode === 'single');
    viewDisabledBtn.classList.toggle('active', mode === 'disabled');
    getGalleryFilter().disabledView = (mode === 'disabled');
    // '' (not 'grid') when shown: an inline style always beats stylesheet rules,
    // which would otherwise permanently defeat dynamic-cards mode's own
    // `display: block` override (its column-width/fill were applying, but were
    // inert since the container was still actually `display: grid` underneath).
    galleryGrid.style.display = (mode === 'grid' || mode === 'disabled') ? '' : 'none';
    compactGrid.style.display = mode === 'compact' ? 'grid' : 'none';
    compactCompareArea.style.display = (mode === 'compact' && stickyCompareImages.length > 0) ? 'block' : 'none';
    singleViewEl.style.display = mode === 'single' ? 'block' : 'none';
    singleNav.style.display = mode === 'single' ? 'flex' : 'none';
    if (mode === 'single') renderSingleView();
    else if (mode === 'compact') renderCompactGrid();
    else renderGallery();
  };

  const html = document.documentElement;
  const oldEl = viewContainerFor(prevMode);
  const newEl = viewContainerFor(mode);
  if (html.classList.contains('motion-off') || prevMode === mode || oldEl === newEl){ applyState(); return; }

  const swipe = html.classList.contains('motion-swipe');
  const movingForward = VIEW_TRANSITION_ORDER.indexOf(mode) > VIEW_TRANSITION_ORDER.indexOf(prevMode);
  const outClass = swipe ? (movingForward ? 'view-swipe-out-left' : 'view-swipe-out-right') : 'view-fade-out';
  const inClass = swipe ? (movingForward ? 'view-swipe-in-right' : 'view-swipe-in-left') : 'view-fade-out';

  oldEl.classList.add(outClass);
  setTimeout(() => {
    oldEl.classList.remove(outClass);
    applyState();
    const shownEl = viewContainerFor(mode);
    shownEl.classList.add(inClass);
    requestAnimationFrame(() => requestAnimationFrame(() => shownEl.classList.remove(inClass)));
  }, 100);
}

// ---------------- Gallery (grid) rendering ----------------

function renderGallery(){
  galleryGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  const tagIndex = buildTagIndex();
  for (const e of filteredEntries()){
    frag.appendChild(buildCard(e, tagIndex));
  }
  galleryGrid.appendChild(frag);
}

function renderCompactGrid(){
  compactGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  const list = filteredEntries().filter(e => !stickyCompareImages.includes(e.base));
  list.forEach((e, idx) => {
    const card = document.createElement('div');
    card.className = 'compact-card' + (e.dirty ? ' dirty' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
    if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
    if (!e.disabled){
      card.draggable = true;
      card.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', e.base);
        ev.dataTransfer.effectAllowed = 'move';
      });
    }
    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.loading = 'lazy';
    card.appendChild(img);
    if (e.meta && e.meta.reviewColor){
      const badge = document.createElement('div');
      badge.className = 'flag-badge';
      badge.style.background = e.meta.reviewColor;
      card.appendChild(badge);
    }
    card.addEventListener('click', (ev) => {
      if (ctxMenuEl) return;
      if (ev.shiftKey){ toggleStickyCompare(e.base); return; }
      openImageCardModal(e);
    });
    card.addEventListener('contextmenu', (ev) => { ev.preventDefault(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
    attachLongPress(card, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));
    if (e.tags.length){
      const hoverTags = document.createElement('div');
      hoverTags.className = 'compact-hover-tags';
      hoverTags.textContent = e.tags.join(', ');
      card.appendChild(hoverTags);
    }
    frag.appendChild(card);
  });
  compactGrid.appendChild(frag);
  renderCompactCompareArea();
}

function toggleStickyCompare(base){
  const idx = stickyCompareImages.indexOf(base);
  if (idx === -1) stickyCompareImages.push(base);
  else stickyCompareImages.splice(idx, 1);
  renderCompactGrid();
}

function renderCompactCompareArea(){
  const stickyEntries = stickyCompareImages.map(b => getEntryByBase(b)).filter(Boolean);
  if (stickyEntries.length === 0){
    compactCompareArea.style.display = 'none';
    return;
  }
  compactCompareArea.style.display = 'block';
  compareCount.textContent = stickyEntries.length;

  const allTags = new Set();
  stickyEntries.forEach(e => e.tags.forEach(t => allTags.add(t)));
  const tagList = Array.from(allTags).sort((a,b) => a.localeCompare(b));

  compactCompareTable.innerHTML = '';

  const headerRow = document.createElement('div');
  headerRow.className = 'compare-row compare-header-row';
  const corner = document.createElement('div');
  corner.className = 'compare-cell compare-corner';
  headerRow.appendChild(corner);
  stickyEntries.forEach(e => {
    const cell = document.createElement('div');
    cell.className = 'compare-cell compare-img-cell';
    const img = document.createElement('img');
    img.src = e.objectUrl;
    const rm = document.createElement('button');
    rm.textContent = '✕';
    rm.title = 'Remove from comparison';
    rm.addEventListener('click', () => toggleStickyCompare(e.base));
    cell.appendChild(img);
    cell.appendChild(rm);
    headerRow.appendChild(cell);
  });
  compactCompareTable.appendChild(headerRow);

  for (const tag of tagList){
    const row = document.createElement('div');
    row.className = 'compare-row';
    const labelCell = document.createElement('div');
    labelCell.className = 'compare-cell compare-label-cell';
    labelCell.textContent = tag;
    row.appendChild(labelCell);
    stickyEntries.forEach(e => {
      const cell = document.createElement('div');
      cell.className = 'compare-cell';
      if (e.tags.includes(tag)){
        cell.appendChild(buildChip(e, tag, () => renderCompactCompareArea(), null));
      } else {
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ add';
        addBtn.title = `Add "${tag}" to this image`;
        addBtn.addEventListener('click', () => {
          addTagToEntry(e, tag);
          renderCompactCompareArea();
          refreshRightPanels();
        });
        cell.appendChild(addBtn);
      }
      row.appendChild(cell);
    });
    compactCompareTable.appendChild(row);
  }
}

function buildCard(e, tagIndex){
  const card = document.createElement('div');
  card.className = 'card' + (e.dirty ? ' dirty' : '') + (e.tags.length===0 ? ' untagged' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.reviewColor ? ' flagged' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
  card.dataset.base = e.base;
  if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
  if (!e.disabled){
    card.draggable = true;
    card.addEventListener('dragstart', (ev) => {
      ev.dataTransfer.setData('text/plain', e.base);
      ev.dataTransfer.effectAllowed = 'move';
    });
  }

  const thumbwrap = document.createElement('div');
  thumbwrap.className = 'thumbwrap';

  if (getMasterTagModeActive()){
    const selCb = document.createElement('input');
    selCb.type = 'checkbox';
    selCb.className = 'master-select-cb';
    selCb.checked = masterSelectedImages.has(e.base);
    selCb.addEventListener('click', (ev) => ev.stopPropagation());
    selCb.addEventListener('change', () => {
      if (selCb.checked) masterSelectedImages.add(e.base);
      else masterSelectedImages.delete(e.base);
      renderMasterSelectionSummary();
    });
    thumbwrap.appendChild(selCb);
  }
  const img = document.createElement('img');
  img.src = e.objectUrl;
  img.loading = 'lazy';
  thumbwrap.appendChild(img);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'img-menu-btn';
  menuBtn.textContent = '⋯';
  menuBtn.title = 'More options';
  menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
  thumbwrap.appendChild(menuBtn);
  thumbwrap.appendChild(buildStatusIconsEl(e));

  if (e.meta && e.meta.reviewColor){
    const badge = document.createElement('div');
    badge.className = 'flag-badge';
    badge.style.background = e.meta.reviewColor;
    thumbwrap.appendChild(badge);
  }
  if (e.meta && e.meta.locked){
    const lockBadge = document.createElement('div');
    lockBadge.className = 'lock-badge';
    lockBadge.textContent = '🔒';
    lockBadge.title = 'Locked — mass tools (Quick Merge, Master Tags, bulk WD14, etc.) skip this image';
    thumbwrap.appendChild(lockBadge);
  }
  const mvBadges = buildMergeVoidBadgesEl(e);
  if (mvBadges) thumbwrap.appendChild(mvBadges);
  if (getShowTagCountBadges()){
    const countBadge = document.createElement('div');
    countBadge.className = 'tagcount-badge';
    countBadge.textContent = e.tags.length;
    thumbwrap.appendChild(countBadge);
  }
  if (e.meta && e.meta.note){
    const noteBadge = document.createElement('div');
    noteBadge.className = 'note-badge';
    noteBadge.textContent = '📝';
    noteBadge.title = 'Click to edit note';
    noteBadge.addEventListener('click', (ev) => { ev.stopPropagation(); openNoteEditor(e); });
    thumbwrap.appendChild(noteBadge);
  }

  const fn = document.createElement('div');
  fn.className = 'filename';
  fn.textContent = e.imgName;
  thumbwrap.appendChild(fn);

  if (e.dirty){
    const dot = document.createElement('div');
    dot.className = 'dirtydot';
    thumbwrap.appendChild(dot);
  }

  thumbwrap.addEventListener('click', () => {
    if (ctxMenuEl) return;
    openImageCardModal(e);
  });
  thumbwrap.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    openImageOptionsMenu(e, ev.clientX, ev.clientY);
  });
  attachLongPress(thumbwrap, (ev) => openImageOptionsMenu(e, ev.clientX, ev.clientY));

  const tagbox = document.createElement('div');
  tagbox.className = 'tagbox';

  if (e.meta && e.meta.noteAlwaysVisible && e.meta.note){
    const noteVis = document.createElement('div');
    noteVis.className = 'card-note-visible';
    noteVis.textContent = e.meta.note;
    tagbox.appendChild(noteVis);
  }

  const chiprow = document.createElement('div');
  chiprow.className = 'chiprow';
  for (const tag of orderedTagsForDisplay(e, tagIndex)){
    chiprow.appendChild(buildChip(e, tag, () => { renderGallery(); refreshRightPanels(); refreshStats(); }, tagIndex));
  }
  tagbox.appendChild(chiprow);

  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.className = 'addtag-input';
  addInput.placeholder = '+ Add tag';
  addInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && addInput.value.trim()){
      addTagToEntry(e, addInput.value.trim());
      addInput.value = '';
      closeAutocomplete();
      renderGallery();
      refreshRightPanels();
    }
  });
  // The card itself is draggable=true (for reordering into Disabled, etc.),
  // which otherwise hijacks any click-drag over this input into a native
  // HTML5 drag instead of a text selection. Suspending it while the input
  // is focused fixes that without affecting the card's own drag behavior.
  addInput.addEventListener('focus', () => { card.draggable = false; });
  addInput.addEventListener('blur', () => { card.draggable = !e.disabled; });
  attachTagAutocomplete(addInput, () => e, () => { renderGallery(); refreshRightPanels(); });
  tagbox.appendChild(addInput);

  card.appendChild(thumbwrap);
  card.appendChild(tagbox);
  return card;
}

// ---------------- Single image view rendering ----------------

let singleZoom = 100;
let singlePanX = 0, singlePanY = 0;
let lastSingleBase = null;

function renderMultiCompareView(){
  singleViewEl.innerHTML = '';
  singlePos.textContent = `${masterSelectedImages.size} selected`;
  singlePrevBtn.disabled = true;
  singleNextBtn.disabled = true;

  const selectedEntries = Array.from(masterSelectedImages).map(b => getEntryByBase(b)).filter(Boolean);
  const allTags = new Set();
  selectedEntries.forEach(e => e.tags.forEach(t => allTags.add(t)));
  const tagList = Array.from(allTags).sort((a,b) => a.localeCompare(b));

  const wrap = document.createElement('div');
  wrap.className = 'multicompare-wrap';

  const header = document.createElement('div');
  header.className = 'multicompare-header';
  header.innerHTML = `<span>Comparing ${selectedEntries.length} selected image(s) — ${tagList.length} unique tag(s)</span>`;
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear selection';
  clearBtn.addEventListener('click', () => {
    masterSelectedImages.clear();
    renderMasterSelectionSummary();
    renderCurrentView();
  });
  header.appendChild(clearBtn);
  wrap.appendChild(header);

  if (tagList.length === 0){
    const empty = document.createElement('div');
    empty.className = 'single-empty';
    empty.textContent = 'None of the selected images have any tags yet.';
    wrap.appendChild(empty);
    singleViewEl.appendChild(wrap);
    return;
  }

  const table = document.createElement('div');
  table.className = 'multicompare-table';

  const headRow = document.createElement('div');
  headRow.className = 'mc-row mc-head-row';
  const headName = document.createElement('div');
  headName.className = 'mc-cell mc-tagname';
  headName.textContent = 'Tag';
  const headOwners = document.createElement('div');
  headOwners.className = 'mc-cell mc-owners';
  headOwners.textContent = `Images with this tag (of ${selectedEntries.length})`;
  headRow.appendChild(headName);
  headRow.appendChild(headOwners);
  table.appendChild(headRow);

  for (const tag of tagList){
    const owners = selectedEntries.filter(e => e.tags.includes(tag));
    const row = document.createElement('div');
    row.className = 'mc-row';

    const nameCell = document.createElement('div');
    nameCell.className = 'mc-cell mc-tagname';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = tag;
    nameInput.title = 'Change this to rename the tag across all selected images that have it';
    nameInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter'){
        const newName = nameInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
        if (newName && newName !== tag) renameTagAcrossEntries(tag, newName, owners);
      }
    });
    nameCell.appendChild(nameInput);
    row.appendChild(nameCell);

    const ownersCell = document.createElement('div');
    ownersCell.className = 'mc-cell mc-owners';
    const nonOwners = selectedEntries.filter(e => !e.tags.includes(tag));
    owners.forEach(e => {
      const ownerRow = document.createElement('div');
      ownerRow.className = 'mc-owner-row';
      ownerRow.textContent = e.imgName;
      ownerRow.title = 'Click to remove or replace this tag on this image';
      ownerRow.addEventListener('click', (ev) => {
        openMultiCompareTagMenu(e, tag, ev.clientX, ev.clientY);
      });
      ownersCell.appendChild(ownerRow);
    });
    nonOwners.forEach(e => {
      const missingRow = document.createElement('div');
      missingRow.className = 'mc-owner-row mc-owner-missing';
      missingRow.textContent = `+ add to ${e.imgName}`;
      missingRow.title = `Add "${tag}" to this image too`;
      missingRow.addEventListener('click', () => {
        addTagToEntry(e, tag);
        renderMultiCompareView();
        refreshRightPanels();
      });
      ownersCell.appendChild(missingRow);
    });
    row.appendChild(ownersCell);
    table.appendChild(row);
  }

  wrap.appendChild(table);
  singleViewEl.appendChild(wrap);
}

function renameTagAcrossEntries(oldTag, newTag, entriesList){
  const affected = [];
  for (const e of entriesList){
    if (!e.tags.includes(oldTag)) continue;
    const prevTags = e.tags.slice();
    let newTags = e.tags.map(t => t === oldTag ? newTag : t);
    newTags = Array.from(new Set(newTags));
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
  }
  if (affected.length === 0) return;
  const summary = `Renamed "${oldTag}" → "${newTag}" across ${affected.length} selected image(s).`;
  toast(summary);
  recordChange('rename', summary, affected);
  folderStats.master_ops = (folderStats.master_ops || 0) + 1;
  saveFolderStats();
  refreshAllUIRef();
  checkAchievements();
}

function openMultiCompareTagMenu(entry, tag, x, y){
  closeTagContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = entry.imgName;
  menu.appendChild(header);
  addCtxItem(menu, `Remove "${tag}" from this image`, () => {
    removeTagFromEntry(entry, tag);
    closeTagContextMenu();
    renderMultiCompareView();
  });
  const sep = document.createElement('div');
  sep.className = 'ctx-sep';
  sep.textContent = 'Or replace it on this image:';
  menu.appendChild(sep);
  const replaceRow = document.createElement('div');
  replaceRow.style.cssText = 'display:flex; gap:6px; padding:2px 8px 8px;';
  const replaceInput = document.createElement('input');
  replaceInput.type = 'text';
  replaceInput.placeholder = 'Replace with…';
  replaceInput.style.flex = '1';
  replaceInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && replaceInput.value.trim()){
      removeTagFromEntry(entry, tag);
      addTagToEntry(entry, replaceInput.value.trim());
      closeTagContextMenu();
      renderMultiCompareView();
    }
  });
  replaceRow.appendChild(replaceInput);
  menu.appendChild(replaceRow);
  document.body.appendChild(menu);
  ctxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
}

function renderSingleView(){
  if (masterSelectedImages.size > 1){
    renderMultiCompareView();
    return;
  }
  const list = filteredEntries();
  if (singleIndex >= list.length) singleIndex = list.length - 1;
  if (singleIndex < 0) singleIndex = 0;

  singlePos.textContent = list.length ? `${singleIndex + 1} / ${list.length}` : '0 / 0';
  singlePrevBtn.disabled = list.length === 0 || singleIndex <= 0;
  singleNextBtn.disabled = list.length === 0 || singleIndex >= list.length - 1;

  singleViewEl.innerHTML = '';
  if (list.length === 0){
    const empty = document.createElement('div');
    empty.className = 'single-empty';
    empty.textContent = 'No images match the current filter.';
    singleViewEl.appendChild(empty);
    return;
  }

  const e = list[singleIndex];
  if (e.base !== lastSingleBase){
    singleZoom = 100; singlePanX = 0; singlePanY = 0;
    lastSingleBase = e.base;
  }

  const wrap = document.createElement('div');
  wrap.className = 'single-wrap';

  const imgSide = document.createElement('div');
  imgSide.className = 'single-img-side';
  imgSide.style.position = 'relative';
  imgSide.style.overflow = 'hidden';

  const img = document.createElement('img');
  img.src = e.objectUrl;
  img.draggable = false;
  img.style.transformOrigin = 'center center';
  img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom/100})`;
  img.style.cursor = 'grab';
  imgSide.appendChild(img);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'img-menu-btn';
  menuBtn.style.left = '10px';
  menuBtn.style.top = '10px';
  menuBtn.textContent = '⋯';
  menuBtn.title = 'More options';
  menuBtn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
  imgSide.appendChild(menuBtn);
  const statusIconsEl = buildStatusIconsEl(e);
  statusIconsEl.style.left = '10px';
  statusIconsEl.style.top = '38px';
  imgSide.appendChild(statusIconsEl);
  const mvBadgesSingle = buildMergeVoidBadgesEl(e);
  if (mvBadgesSingle){
    mvBadgesSingle.style.position = 'absolute';
    mvBadgesSingle.style.left = '10px';
    mvBadgesSingle.style.bottom = '10px';
    imgSide.appendChild(mvBadgesSingle);
  }

  function applyTransform(){
    img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom/100})`;
  }

  function zoomBy(delta, clientX, clientY){
    const prevZoom = singleZoom;
    singleZoom = Math.max(100, Math.min(400, singleZoom + delta));
    if (singleZoom === prevZoom) return;
    zoomSlider.value = String(singleZoom);
    zoomVal.textContent = singleZoom + '%';
    applyTransform();
    if (singleZoom > (folderStats.zoom_max || 0)){
      folderStats.zoom_max = singleZoom;
      saveFolderStats();
      checkAchievements();
    }
  }

  let isPanning = false, panStartX = 0, panStartY = 0, panOrigX = 0, panOrigY = 0;

  imgSide.addEventListener('contextmenu', (ev) => ev.preventDefault());
  imgSide.addEventListener('pointerdown', (ev) => {
    if (ev.button === 0 || ev.button === 2){
      isPanning = true;
      panStartX = ev.clientX; panStartY = ev.clientY;
      panOrigX = singlePanX; panOrigY = singlePanY;
      imgSide.setPointerCapture(ev.pointerId);
      img.style.cursor = 'grabbing';
      ev.preventDefault();
    }
  });
  imgSide.addEventListener('pointermove', (ev) => {
    if (isPanning){
      singlePanX = panOrigX + (ev.clientX - panStartX);
      singlePanY = panOrigY + (ev.clientY - panStartY);
      applyTransform();
    }
  });
  imgSide.addEventListener('pointerup', (ev) => {
    if (isPanning){ isPanning = false; img.style.cursor = 'grab'; try { imgSide.releasePointerCapture(ev.pointerId); } catch(err){} }
  });
  imgSide.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const delta = ev.deltaY < 0 ? 20 : -20;
    zoomBy(delta, ev.clientX, ev.clientY);
  }, { passive: false });
  attachPinchZoom(imgSide, (delta) => zoomBy(delta));

  const panel = document.createElement('div');
  panel.className = 'single-panel';

  const nameEl = document.createElement('div');
  nameEl.className = 'single-name';
  nameEl.textContent = e.imgName + (e.width ? ` · ${e.width}×${e.height}` : '') + ` · ${e.tags.length} tags`;
  panel.appendChild(nameEl);

  const zoomRow = document.createElement('div');
  zoomRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
  const zoomLabel = document.createElement('span');
  zoomLabel.style.cssText = 'font-size:11px; color:var(--text-faint);';
  zoomLabel.textContent = 'Zoom';
  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range'; zoomSlider.min = '100'; zoomSlider.max = '400'; zoomSlider.step = '10';
  zoomSlider.value = String(singleZoom);
  zoomSlider.style.flex = '1';
  const zoomVal = document.createElement('span');
  zoomVal.style.cssText = 'font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;';
  zoomVal.textContent = singleZoom + '%';
  zoomSlider.addEventListener('input', () => {
    singleZoom = parseInt(zoomSlider.value, 10);
    zoomVal.textContent = singleZoom + '%';
    applyTransform();
    if (singleZoom > (folderStats.zoom_max || 0)){
      folderStats.zoom_max = singleZoom;
      saveFolderStats();
      checkAchievements();
    }
  });
  const zoomResetBtn = document.createElement('button');
  zoomResetBtn.textContent = 'Reset';
  zoomResetBtn.addEventListener('click', () => {
    singleZoom = 100; singlePanX = 0; singlePanY = 0;
    zoomSlider.value = '100'; zoomVal.textContent = '100%';
    applyTransform();
  });
  zoomRow.appendChild(zoomLabel);
  zoomRow.appendChild(zoomSlider);
  zoomRow.appendChild(zoomVal);
  zoomRow.appendChild(zoomResetBtn);
  panel.appendChild(zoomRow);
  const zoomHint = document.createElement('div');
  zoomHint.style.cssText = 'font-size:10.5px; color:var(--text-faint);';
  zoomHint.textContent = 'Click and drag (either button) to pan. Scroll the mouse wheel over the image to zoom.';
  panel.appendChild(zoomHint);

  if (e.disabled){
    const badge = document.createElement('div');
    badge.className = 'single-disabled-badge';
    badge.textContent = 'Disabled — hidden from active dataset';
    panel.appendChild(badge);
  }

  if (e.meta && e.meta.noteAlwaysVisible && e.meta.note){
    const noteVis = document.createElement('div');
    noteVis.className = 'card-note-visible';
    noteVis.textContent = e.meta.note;
    panel.appendChild(noteVis);
  }

  const singleTagIndex = buildTagIndex();
  const chiprow = document.createElement('div');
  chiprow.className = 'chiprow';
  for (const tag of orderedTagsForDisplay(e, singleTagIndex)){
    chiprow.appendChild(buildChip(e, tag, () => { renderSingleView(); refreshRightPanels(); refreshStats(); }, singleTagIndex));
  }
  panel.appendChild(chiprow);

  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.className = 'addtag-input';
  addInput.placeholder = '+ Add tag, press Enter';
  addInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && addInput.value.trim()){
      addTagToEntry(e, addInput.value.trim());
      addInput.value = '';
      closeAutocomplete();
      renderSingleView();
      refreshRightPanels();
    }
  });
  attachTagAutocomplete(addInput, () => e, () => { renderSingleView(); refreshRightPanels(); });
  panel.appendChild(addInput);

  const btnRow = document.createElement('div');
  btnRow.className = 'single-btn-row';
  const toggleBtn = document.createElement('button');
  if (e.disabled){
    toggleBtn.textContent = 'Restore to dataset';
    toggleBtn.className = 'primary';
  } else {
    toggleBtn.textContent = 'Disable (move to /Disabled)';
    toggleBtn.className = 'danger-ghost';
  }
  toggleBtn.addEventListener('click', () => moveEntry(e, !e.disabled));
  btnRow.appendChild(toggleBtn);
  panel.appendChild(btnRow);

  wrap.appendChild(imgSide);
  wrap.appendChild(panel);
  singleViewEl.appendChild(wrap);
}

// ---------------- Chips + tag context menu ----------------

function computeIsolatedTagSet(tagIndex){
  const set = new Set();
  for (const [tag, imgs] of tagIndex){
    if (imgs.size <= 2) set.add(tag);
  }
  return set;
}

function orderedTagsForDisplay(entry, tagIndex){
  let tags = entry.tags.slice();
  const cardTagSortMode = getCardTagSortMode();
  if (cardTagSortMode === 'alphabetical'){
    tags.sort((a,b) => a.localeCompare(b));
  } else if (cardTagSortMode === 'frequency' && tagIndex){
    tags.sort((a,b) => (tagIndex.get(b) ? tagIndex.get(b).size : 0) - (tagIndex.get(a) ? tagIndex.get(a).size : 0));
  }

  const searchTerms = (getGalleryFilter().terms || []);
  const isolatedSet = (getIsolatedFlagActive() && tagIndex) ? computeIsolatedTagSet(tagIndex) : null;
  if (searchTerms.length || isolatedSet){
    const matched = [], isolated = [], rest = [];
    for (const t of tags){
      const lower = t.toLowerCase();
      // Exact tag equality, not substring — searching "dress" should only
      // push/highlight a tag that IS "dress", not "black dress" (which the
      // gallery filter itself can still substring-match into view; this is
      // just about which tag on the card gets called out as the reason).
      const isSearchMatch = searchTerms.some(term => lower === term);
      const isIsolated = isolatedSet && isolatedSet.has(t);
      if (isSearchMatch) matched.push(t);
      else if (isIsolated) isolated.push(t);
      else rest.push(t);
    }
    tags = matched.concat(isolated, rest);
  }
  return tags;
}

function tagDisplayFlags(tag, tagIndex){
  const searchTerms = (getGalleryFilter().terms || []);
  const lower = tag.toLowerCase();
  const isMatch = searchTerms.some(term => lower === term);
  const isIsolated = getIsolatedFlagActive() && tagIndex && (tagIndex.get(tag) ? tagIndex.get(tag).size <= 2 : false);
  return { isMatch, isIsolated };
}

function buildChip(entry, tag, onChange, tagIndex){
  const chip = document.createElement('span');
  chip.className = 'chip';
  const isFlaggedForReview = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
  if (isFlaggedForReview){
    chip.classList.add('chip-flagged-review');
  } else if (tagIndex){
    const flags = tagDisplayFlags(tag, tagIndex);
    if (flags.isMatch) chip.classList.add('chip-match');
    else if (flags.isIsolated) chip.classList.add('chip-isolated');
  }
  const label = document.createElement('span');
  label.textContent = tag;
  label.title = 'Click (or right-click) for tag options, double-click to edit';
  label.style.cursor = 'pointer';
  // Single click is delayed slightly so a second click arriving within the
  // window can upgrade it to a dblclick instead — without this, dblclick
  // still fires on top of two already-handled single clicks (each of which
  // opens the context menu, so the menu would flicker open/closed right
  // before the rename input replaced the label).
  let clickTimer = null;
  label.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const x = ev.clientX, y = ev.clientY;
    if (clickTimer) clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
      clickTimer = null;
      openTagContextMenu(entry, tag, x, y);
    }, 220);
  });
  label.addEventListener('dblclick', (ev) => {
    ev.stopPropagation();
    if (clickTimer){ clearTimeout(clickTimer); clickTimer = null; }
    closeTagContextMenu();
    startInlineTagRename(chip, label, entry, tag, onChange);
  });
  label.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    if (clickTimer){ clearTimeout(clickTimer); clickTimer = null; }
    openTagContextMenu(entry, tag, ev.clientX, ev.clientY);
  });
  attachLongPress(label, (ev) => openTagContextMenu(entry, tag, ev.clientX, ev.clientY));
  const rm = document.createElement('button');
  rm.textContent = '×';
  rm.title = 'Remove this tag from this image';
  rm.addEventListener('click', (ev) => {
    ev.stopPropagation();
    removeTagFromEntry(entry, tag);
    onChange();
  });
  chip.appendChild(label);
  chip.appendChild(rm);
  return chip;
}

// Renames a tag on ONE image only — unlike Master Tags' "Rename everywhere"
// or Quick Merge (which both intentionally touch every image sharing that
// tag), this is scoped to the single entry the chip belongs to, since tags
// on other images may be correct as-is.
function renameTagOnEntry(entry, oldTag, newTag){
  if (!entry.tags.includes(oldTag) || oldTag === newTag) return false;
  const prevTags = entry.tags.slice();
  let newTags = entry.tags.map(t => t === oldTag ? newTag : t);
  newTags = Array.from(new Set(newTags));
  entry.tags = newTags;
  markDirty(entry);
  const summary = `Renamed "${oldTag}" → "${newTag}" on ${entry.imgName}.`;
  recordChange('rename', summary, [{ base: entry.base, prevTags, newTags: newTags.slice() }]);
  trackStat('renames');
  checkAchievements();
  return true;
}

function startInlineTagRename(chip, label, entry, tag, onChange){
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'chip-rename-input';
  input.value = tag;
  chip.replaceChild(input, label);
  input.focus();
  input.select();
  let done = false;
  function commit(){
    if (done) return;
    done = true;
    const cleaned = input.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (cleaned && cleaned !== tag) renameTagOnEntry(entry, tag, cleaned);
    onChange();
  }
  input.addEventListener('click', (ev) => ev.stopPropagation());
  input.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Enter'){ ev.preventDefault(); commit(); }
    else if (ev.key === 'Escape'){ ev.preventDefault(); done = true; onChange(); }
  });
  input.addEventListener('blur', commit);
}

// ---------------- Floating image card modal (grid click) ----------------

let modalZoom = 100, modalPanX = 0, modalPanY = 0;

let modalCloseTimer = null;
let currentModalBase = null;

export function openImageCardModal(entry, opts){
  const isHoverPreview = !!(opts && opts.hover);
  if (modalCloseTimer){ clearTimeout(modalCloseTimer); modalCloseTimer = null; }
  closeTagContextMenu();
  if (currentModalBase !== entry.base){
    modalZoom = 100; modalPanX = 0; modalPanY = 0;
    renderImageCardModal(entry);
    currentModalBase = entry.base;
  }
  imageCardModal.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => imageCardModal.classList.add('modal-visible')));
  if (!isHoverPreview){
    folderStats.card_modal_opens = (folderStats.card_modal_opens || 0) + 1;
    saveFolderStats();
    checkAchievements();
  }
}

export function closeImageCardModal(){
  if (modalCloseTimer) clearTimeout(modalCloseTimer);
  imageCardModal.classList.remove('modal-visible');
  modalCloseTimer = setTimeout(() => {
    imageCardModal.style.display = 'none';
    modalCardInner.innerHTML = '';
    currentModalBase = null;
    modalCloseTimer = null;
  }, 180);
}

function renderImageCardModal(entry){
  modalCardInner.innerHTML = '';

  const imgSide = document.createElement('div');
  imgSide.className = 'single-img-side';
  imgSide.style.position = 'relative';
  imgSide.style.overflow = 'hidden';
  imgSide.style.flex = '1';

  const img = document.createElement('img');
  img.src = entry.objectUrl;
  img.draggable = false;
  img.style.transformOrigin = 'center center';
  img.style.cursor = 'grab';
  function applyModalTransform(){
    img.style.transform = `translate(${modalPanX}px, ${modalPanY}px) scale(${modalZoom/100})`;
  }
  applyModalTransform();
  imgSide.appendChild(img);

  let panning = false, sx = 0, sy = 0, ox = 0, oy = 0;
  imgSide.addEventListener('contextmenu', ev => ev.preventDefault());
  imgSide.addEventListener('pointerdown', ev => {
    if (ev.button === 0 || ev.button === 2){
      panning = true; sx = ev.clientX; sy = ev.clientY; ox = modalPanX; oy = modalPanY;
      imgSide.setPointerCapture(ev.pointerId);
      img.style.cursor = 'grabbing';
      ev.preventDefault();
    }
  });
  imgSide.addEventListener('pointermove', ev => {
    if (panning){
      modalPanX = ox + (ev.clientX - sx);
      modalPanY = oy + (ev.clientY - sy);
      applyModalTransform();
    }
  });
  imgSide.addEventListener('pointerup', ev => {
    if (panning){ panning = false; img.style.cursor = 'grab'; try { imgSide.releasePointerCapture(ev.pointerId); } catch(err){} }
  });
  imgSide.addEventListener('wheel', ev => {
    ev.preventDefault();
    modalZoom = Math.max(100, Math.min(400, modalZoom + (ev.deltaY < 0 ? 20 : -20)));
    zoomSlider.value = String(modalZoom);
    zoomVal.textContent = modalZoom + '%';
    applyModalTransform();
  }, { passive: false });
  attachPinchZoom(imgSide, (delta) => {
    modalZoom = Math.max(100, Math.min(400, modalZoom + delta));
    zoomSlider.value = String(modalZoom);
    zoomVal.textContent = modalZoom + '%';
    applyModalTransform();
  });

  const panel = document.createElement('div');
  panel.className = 'single-panel';
  panel.style.position = 'relative';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn ghost-close';
  closeBtn.textContent = '✕ Close';
  closeBtn.addEventListener('click', closeImageCardModal);
  panel.appendChild(closeBtn);

  const nameEl = document.createElement('div');
  nameEl.className = 'single-name';
  nameEl.textContent = entry.imgName + (entry.width ? ` · ${entry.width}×${entry.height}` : '') + ` · ${entry.tags.length} tags`;
  panel.appendChild(nameEl);

  const zoomRow = document.createElement('div');
  zoomRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
  const zoomSlider = document.createElement('input');
  zoomSlider.type = 'range'; zoomSlider.min = '100'; zoomSlider.max = '400'; zoomSlider.step = '10';
  zoomSlider.value = String(modalZoom);
  zoomSlider.style.flex = '1';
  const zoomVal = document.createElement('span');
  zoomVal.style.cssText = 'font-family:var(--mono); font-size:11px; min-width:42px; text-align:right;';
  zoomVal.textContent = modalZoom + '%';
  zoomSlider.addEventListener('input', () => {
    modalZoom = parseInt(zoomSlider.value, 10);
    zoomVal.textContent = modalZoom + '%';
    applyModalTransform();
  });
  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reset';
  resetBtn.addEventListener('click', () => {
    modalZoom = 100; modalPanX = 0; modalPanY = 0;
    zoomSlider.value = '100'; zoomVal.textContent = '100%';
    applyModalTransform();
  });
  zoomRow.appendChild(zoomSlider);
  zoomRow.appendChild(zoomVal);
  zoomRow.appendChild(resetBtn);
  panel.appendChild(zoomRow);

  const modalTagIndex = buildTagIndex();
  const chiprow = document.createElement('div');
  chiprow.className = 'chiprow';
  for (const tag of orderedTagsForDisplay(entry, modalTagIndex)){
    chiprow.appendChild(buildChip(entry, tag, () => { renderImageCardModal(entry); refreshRightPanels(); refreshStats(); }, modalTagIndex));
  }
  panel.appendChild(chiprow);

  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.className = 'addtag-input';
  addInput.placeholder = '+ Add tag, press Enter';
  addInput.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && addInput.value.trim()){
      addTagToEntry(entry, addInput.value.trim());
      addInput.value = '';
      closeAutocomplete();
      renderImageCardModal(entry);
      refreshRightPanels();
    }
  });
  attachTagAutocomplete(addInput, () => entry, () => renderImageCardModal(entry));
  panel.appendChild(addInput);

  modalCardInner.appendChild(imgSide);
  modalCardInner.appendChild(panel);
}

function tokenizeTag(tag){
  const parts = tag.split(/[\s_\-]+/).map(p => p.trim()).filter(Boolean);
  const uniq = Array.from(new Set(parts));
  return uniq.length > 1 ? uniq : [];
}

function addCtxItem(menu, label, onClick){
  const btn = document.createElement('button');
  btn.className = 'ctx-item';
  btn.textContent = label;
  btn.addEventListener('click', (ev) => {
    // Without this, the click bubbles to the document-level listener that
    // closes panels on an outside click — which would immediately close
    // whatever panel this item just opened (e.g. Tag Details), since the
    // click's target is this menu button, not the panel.
    ev.stopPropagation();
    onClick(ev);
  });
  menu.appendChild(btn);
}

function openTagContextMenu(entry, tag, x, y){
  closeTagContextMenu();
  const index = buildTagIndex();
  const set = index.get(tag) || new Set();

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';

  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = `${tag} · ${set.size} image${set.size===1?'':'s'}`;
  menu.appendChild(header);

  addCtxItem(menu, 'Show all images WITH this tag', () => {
    setContainsFilter(tag);
    closeTagContextMenu();
  });
  addCtxItem(menu, 'Show all images WITHOUT this tag', () => {
    setExcludesFilter(tag);
    closeTagContextMenu();
  });
  addCtxItem(menu, '📖 Tag Details', () => {
    closeTagContextMenu();
    openTagDetails(tag);
  });

  if (entry){
    const renameSep = document.createElement('div');
    renameSep.className = 'ctx-sep';
    renameSep.textContent = 'Rename on this image:';
    menu.appendChild(renameSep);
    const renameRow = document.createElement('div');
    renameRow.className = 'ctx-rename-row';
    const renameInput = document.createElement('input');
    renameInput.type = 'text';
    renameInput.value = tag;
    renameInput.addEventListener('click', (ev) => ev.stopPropagation());
    renameInput.addEventListener('keydown', (ev) => {
      ev.stopPropagation();
      if (ev.key === 'Enter'){
        const cleaned = renameInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
        if (cleaned && cleaned !== tag) renameTagOnEntry(entry, tag, cleaned);
        closeTagContextMenu();
        refreshAllUIRef();
      }
    });
    renameRow.appendChild(renameInput);
    menu.appendChild(renameRow);

    const flagged = entry.meta && entry.meta.flaggedTags && entry.meta.flaggedTags.includes(tag);
    addCtxItem(menu, flagged ? '🚩 Unflag this tag on this image' : '🚩 Flag this tag for review (this image)', () => {
      if (!entry.meta.flaggedTags) entry.meta.flaggedTags = [];
      if (flagged) entry.meta.flaggedTags = entry.meta.flaggedTags.filter(t => t !== tag);
      else entry.meta.flaggedTags.push(tag);
      getEntryMeta()[entry.base] = entry.meta;
      saveEntryMetaRef();
      closeTagContextMenu();
      renderCurrentView();
    });
  }

  const words = tokenizeTag(tag);
  if (words.length > 1){
    const sep = document.createElement('div');
    sep.className = 'ctx-sep';
    sep.textContent = 'View keyword family within this tag:';
    menu.appendChild(sep);
    const wordsRow = document.createElement('div');
    wordsRow.className = 'ctx-words';
    for (const w of words){
      const b = document.createElement('button');
      b.textContent = w;
      b.addEventListener('click', () => {
        setContainsFilter(w);
        closeTagContextMenu();
      });
      wordsRow.appendChild(b);
    }
    menu.appendChild(wordsRow);
  }

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
}

function onDocClickCloseMenu(ev){
  if (!ctxMenuEl) return;
  const path = typeof ev.composedPath === 'function' ? ev.composedPath() : [];
  if (path.includes(ctxMenuEl)) return; // click landed inside the menu, even if that node was rebuilt mid-click
  closeTagContextMenu();
}

function closeTagContextMenu(){
  if (ctxMenuEl){ ctxMenuEl.remove(); ctxMenuEl = null; }
  document.removeEventListener('click', onDocClickCloseMenu);
}

// ---------------- Image options menu (3-dot): text/language, review flag, notes ----------------

function getForeignLangTags(entry){
  return entry.tags.filter(t => / text$/.test(t) && t !== 'text');
}

// ---------------- Grid/single card status icons (censored / has-text) ----------------
// Censored/uncensored is a tri-state, unlike Has Text below: the tag set
// only ever *asserts* a fact, it never records "checked, and no" — so the
// absence of a "censored" tag isn't itself proof the image is uncensored,
// only that nobody's tagged it either way yet. Reading that absence as a
// confident "no" (a red X) was the bug being fixed here; it's only a
// confident "no" once an explicit "uncensored" tag says so. Has Text has
// no such counter-tag (there's no "no text" tag), so its absence really
// does mean no — it stays a plain boolean.
function getEntryStatusIndicators(e){
  const uncensoredTags = e.tags.filter(t => /uncensor/i.test(t));
  const censoredTags = e.tags.filter(t => /censor/i.test(t) && !/uncensor/i.test(t));
  const censored = censoredTags.length ? true : (uncensoredTags.length ? false : null);
  const textTags = e.tags.includes('text') ? ['text', ...getForeignLangTags(e)] : getForeignLangTags(e);
  const hasText = textTags.length > 0;
  // No "unspecified perspective" tag exists to assert a negative here
  // either, and unlike Censored there isn't even a plausible opposite tag
  // to infer one from — so this indicator never shows a red X, only a
  // check (a camera angle was called out) or "not indicated" (it wasn't).
  const perspectiveTags = e.tags.filter(t => t === 'from front' || t === 'from side' || t === 'from below' || t === 'from above');
  const perspective = perspectiveTags.length > 0 ? true : null;
  return [
    { emoji: '👁️', state: censored, label: 'Censored', matchedTags: censored ? censoredTags : (censored === false ? uncensoredTags : []) },
    { emoji: '🗨️', state: hasText, label: 'Has text', matchedTags: textTags },
    { emoji: '🧭', state: perspective, label: 'Perspective', matchedTags: perspectiveTags }
  ];
}

// Hovering shows which exact tags produced the result — e.g. an image
// tagged "censor" and "bar censor" but with actual bar censorship not
// reflected precisely: seeing both tags listed next to "Censored: Yes"
// surfaces that kind of tagging discrepancy at a glance, not just the
// yes/no verdict.
// Merge Immunize / Antivoid badges — shown in every view (Grid, Compact,
// Single) so the permanent per-image exemption from the Retroactive Merge/
// Void dock's standing rules is visible without opening the 3-dot menu (see
// canonical-tags.ts). Returns null when neither flag is set, so callers can
// skip appending an empty wrapper.
function buildMergeVoidBadgesEl(e){
  const meta = e.meta || {};
  if (!meta.mergeImmune && !meta.antivoid) return null;
  const wrap = document.createElement('div');
  wrap.className = 'mv-badges';
  if (meta.mergeImmune && meta.antivoid){
    const b = document.createElement('div');
    b.className = 'mv-badge';
    b.textContent = '✋';
    b.title = 'Antimmunized — exempt from BOTH merge and void rules';
    wrap.appendChild(b);
  } else if (meta.mergeImmune){
    const b = document.createElement('div');
    b.className = 'mv-badge';
    b.textContent = '🚫';
    b.title = 'Merge Immunized — merge rules never rewrite this image\'s tags';
    wrap.appendChild(b);
  } else {
    const b = document.createElement('div');
    b.className = 'mv-badge';
    b.textContent = '🟢';
    b.title = 'Antivoid — void rules never remove tags from this image';
    wrap.appendChild(b);
  }
  return wrap;
}

function buildStatusIconsEl(e){
  const wrap = document.createElement('div');
  wrap.className = 'card-status-icons';
  for (const { emoji, state, label, matchedTags } of getEntryStatusIndicators(e)){
    const glyph = state === null ? '❓' : (state ? '✅' : '❌');
    const statusText = state === null ? 'Not indicated' : (state ? 'Yes' : 'No');
    const badge = document.createElement('div');
    badge.className = 'status-icon-badge';
    badge.textContent = `${emoji}${glyph}`;
    badge.title = `${label}: ${statusText}` + (matchedTags.length ? `: ${matchedTags.join(', ')}` : '');
    wrap.appendChild(badge);
  }
  return wrap;
}

function saveCommonLanguages(){
  try { localStorage.setItem('dts-common-languages', JSON.stringify(commonLanguages)); } catch(e){}
}
(function loadCommonLanguages(){
  try {
    const saved = JSON.parse(localStorage.getItem('dts-common-languages') || 'null');
    if (Array.isArray(saved) && saved.length) commonLanguages = saved;
  } catch(e){}
})();

const FLAG_COLORS = ['#e8a33d', '#e2637a', '#6fb8d1', '#7fbf8f', '#a683e0'];
const KOMA_OPTIONS = ['1koma', '2koma', '3koma', '4koma'];

function openNoteEditor(entry){
  closeTagContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.style.minWidth = '260px';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = `Note — ${entry.imgName}`;
  menu.appendChild(header);

  const noteArea = document.createElement('textarea');
  noteArea.style.cssText = 'width:calc(100% - 16px); margin:0 8px; min-height:80px; background:var(--bg-elevated); color:var(--text-primary); border:1px solid var(--border-strong); border-radius:var(--radius); font-family:var(--sans); font-size:12px; padding:6px;';
  noteArea.value = entry.meta.note || '';
  menu.appendChild(noteArea);

  const visRow = document.createElement('label');
  visRow.className = 'ach-toggle-row';
  visRow.style.padding = '6px 8px';
  const visCb = document.createElement('input');
  visCb.type = 'checkbox';
  visCb.checked = !!entry.meta.noteAlwaysVisible;
  visRow.appendChild(visCb);
  visRow.appendChild(document.createTextNode(' Always show on card'));
  menu.appendChild(visRow);

  const saveBtn = document.createElement('button');
  saveBtn.className = 'primary ctx-item';
  saveBtn.textContent = 'Save note';
  saveBtn.addEventListener('click', () => {
    const wasEmpty = !entry.meta.note;
    entry.meta.note = noteArea.value;
    entry.meta.noteAlwaysVisible = visCb.checked;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    if (wasEmpty && noteArea.value.trim()){
      folderStats.notes_written = (folderStats.notes_written || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
    toast('Note saved.');
    closeTagContextMenu();
    renderCurrentView();
  });
  menu.appendChild(saveBtn);

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  positionMenu(menu, window.innerWidth/2 - 140, window.innerHeight/2 - 100);
  setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
}

function openImageOptionsMenu(entry, x, y){
  closeTagContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  menu.style.minWidth = '270px';

  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = `${entry.imgName} · ${entry.tags.length} tag${entry.tags.length===1?'':'s'}`;
  menu.appendChild(header);

  // Every item below keeps its label to just the action name — the full
  // explanation lives in `title` (native hover tooltip) instead of being
  // crammed into the visible button text, which was making this menu read
  // as a wall of text.
  const toggleDisableBtn = document.createElement('button');
  toggleDisableBtn.className = 'ctx-item';
  toggleDisableBtn.textContent = entry.disabled ? '↩ Restore' : '🗑 Disable';
  toggleDisableBtn.title = entry.disabled ? 'Restore this image to the dataset root' : 'Move this image to /Disabled';
  toggleDisableBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    await moveEntry(entry, !entry.disabled);
    // The image this menu belongs to just moved out of whatever view it was
    // opened from (active <-> Disabled) — leaving the menu open no longer
    // makes sense once the thing it's about is gone from view.
    closeTagContextMenu();
  });
  menu.appendChild(toggleDisableBtn);

  // Unlike Disable above (relocates into Disabled/, fully restorable), this
  // deletes the image + its .txt from disk outright and drops the entry
  // from memory — no undo, nothing left to restore from. Gated behind its
  // own confirm modal (danger-styled) since a single click here is
  // otherwise indistinguishable from Disable in the menu's own layout.
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'ctx-item ctx-item-danger';
  deleteBtn.textContent = '❌ Delete permanently';
  deleteBtn.title = 'Permanently delete this image and its tags from disk — cannot be undone';
  deleteBtn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    closeTagContextMenu();
    const ok = await showConfirmModal(
      `Permanently delete "${entry.imgName}" and its tags? This cannot be undone — the files are removed from disk, not moved to Disabled/.`,
      { okLabel: 'Delete permanently', danger: true }
    );
    if (!ok) return;
    await deleteEntryPermanentlyRef(entry);
  });
  menu.appendChild(deleteBtn);

  // Locked images are skipped by every mass/automatic tool (Quick Merge,
  // Master Tags, bulk WD14, retroactive catch-up, etc.) — manual per-image
  // actions like this menu's own items are unaffected, since a lock is
  // about protecting an image from being swept up by something the user
  // didn't specifically aim at it.
  const toggleLockBtn = document.createElement('button');
  toggleLockBtn.className = 'ctx-item';
  function lockLabel(){ return entry.meta.locked ? '🔓 Unlock' : '🔒 Lock'; }
  toggleLockBtn.textContent = lockLabel();
  toggleLockBtn.title = 'Skip mass tools (Quick Merge, Master Tags, bulk WD14, etc.) for this image';
  toggleLockBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    entry.meta.locked = !entry.meta.locked;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    toggleLockBtn.textContent = lockLabel();
    renderCurrentView();
  });
  menu.appendChild(toggleLockBtn);

  // Merge Immunize / Antivoid — a PERMANENT per-image exception to the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts), unlike
  // Lock (above) which only skips mass/automatic tools in general. These
  // stay in effect 24/7 regardless of what mass tool (if any) touches the
  // image. "Antimmunize" is a convenience shortcut toggling both together,
  // not a third independent flag. Icons: 🚫 for Merge Immunize (blocking a
  // merge from applying reads like a "no entry" sign), 🟢 for Antivoid (a
  // safe/protected green, deliberately not reusing void's own danger-red
  // styling), ✋ for Antimmunize (an open hand — "stop, both ways").
  const toggleMergeImmuneBtn = document.createElement('button');
  toggleMergeImmuneBtn.className = 'ctx-item';
  function mergeImmuneLabel(){ return entry.meta.mergeImmune ? '🚫 Un-Merge-Immunize' : '🚫 Merge Immunize'; }
  toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
  toggleMergeImmuneBtn.title = 'Merge rules will never rewrite this image\'s tags';
  toggleMergeImmuneBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    entry.meta.mergeImmune = !entry.meta.mergeImmune;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  });
  menu.appendChild(toggleMergeImmuneBtn);

  const toggleAntivoidBtn = document.createElement('button');
  toggleAntivoidBtn.className = 'ctx-item';
  function antivoidLabel(){ return entry.meta.antivoid ? '🟢 Un-Antivoid' : '🟢 Antivoid'; }
  toggleAntivoidBtn.textContent = antivoidLabel();
  toggleAntivoidBtn.title = 'Void rules will never remove tags from this image';
  toggleAntivoidBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    entry.meta.antivoid = !entry.meta.antivoid;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    toggleAntivoidBtn.textContent = antivoidLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  });
  menu.appendChild(toggleAntivoidBtn);

  const toggleAntimmunizeBtn = document.createElement('button');
  toggleAntimmunizeBtn.className = 'ctx-item';
  function antimmunizeLabel(){ return (entry.meta.mergeImmune && entry.meta.antivoid) ? '✋ Un-Antimmunize' : '✋ Antimmunize'; }
  toggleAntimmunizeBtn.title = 'Shortcut for toggling Merge Immunize and Antivoid together';
  toggleAntimmunizeBtn.textContent = antimmunizeLabel();
  toggleAntimmunizeBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const bothOn = entry.meta.mergeImmune && entry.meta.antivoid;
    entry.meta.mergeImmune = !bothOn;
    entry.meta.antivoid = !bothOn;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
    toggleAntivoidBtn.textContent = antivoidLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  });
  menu.appendChild(toggleAntimmunizeBtn);

  const resetEditsBtn = document.createElement('button');
  resetEditsBtn.className = 'ctx-item';
  resetEditsBtn.textContent = '⏮ Reset edits';
  resetEditsBtn.title = 'Reset this image to its earliest known tag state';
  resetEditsBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    resetImageEdits(entry);
  });
  menu.appendChild(resetEditsBtn);

  const wd14Btn = document.createElement('button');
  wd14Btn.className = 'ctx-item';
  wd14Btn.textContent = '🐍 WD14 Tag';
  wd14Btn.title = 'Tag this image with WD14 (via ComfyUI)';
  wd14Btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    closeTagContextMenu();
    tagSingleImageWithWd14(entry);
  });
  menu.appendChild(wd14Btn);

  // --- Text / language / comic / koma / speech bubble (draft, applied on demand) ---
  // Japanese and any number of foreign languages are independent, non-exclusive
  // selections — a page can legitimately have Japanese AND English AND Russian
  // text on it at once. Japanese is still the assumed default (a bare "text"
  // tag with no language prefix), so it gets its own toggle; each foreign
  // language gets its own "[language] text" tag, added/removed independently.
  const draft = {
    hasText: entry.tags.includes('text') || getForeignLangTags(entry).length > 0,
    isJapanese: entry.tags.includes('text'),
    foreignLangs: new Set(getForeignLangTags(entry).map(t => t.replace(/ text$/, ''))),
    isComic: entry.tags.includes('comic'),
    koma: entry.tags.find(t => KOMA_OPTIONS.includes(t)) || '',
    speechBubble: entry.tags.includes('speech bubble')
  };

  // Every control below applies to the image's actual tags the instant it's
  // toggled — no separate "Apply" confirmation step. Just being selected (or
  // deselected) is enough.
  function syncTextPanelTags(){
    if (draft.hasText){
      // Japanese and any number of foreign languages coexist independently —
      // a page can have Japanese AND English AND Russian text on it at once.
      // Japanese is the bare "text" tag (assumed default, no prefix); each
      // foreign language gets its own "[language] text" tag.
      if (draft.isJapanese){ if (!entry.tags.includes('text')) addTagToEntry(entry, 'text'); }
      else { if (entry.tags.includes('text')) removeTagFromEntry(entry, 'text'); }

      for (const tag of getForeignLangTags(entry)){
        const lang = tag.replace(/ text$/, '');
        if (!draft.foreignLangs.has(lang)) removeTagFromEntry(entry, tag);
      }
      for (const lang of draft.foreignLangs){
        if (!entry.tags.includes(`${lang} text`)) addTagToEntry(entry, `${lang} text`);
      }
      if (draft.foreignLangs.size){
        folderStats.foreign_languages = Array.from(new Set([...(folderStats.foreign_languages||[]), ...draft.foreignLangs]));
        saveFolderStats();
      }
    } else {
      if (entry.tags.includes('text')) removeTagFromEntry(entry, 'text');
      for (const tag of getForeignLangTags(entry)) removeTagFromEntry(entry, tag);
    }
    if (draft.isComic && !entry.tags.includes('comic')) addTagToEntry(entry, 'comic');
    if (!draft.isComic && entry.tags.includes('comic')) removeTagFromEntry(entry, 'comic');
    const existingKoma = entry.tags.find(t => KOMA_OPTIONS.includes(t));
    if (existingKoma && existingKoma !== draft.koma) removeTagFromEntry(entry, existingKoma);
    if (draft.koma && !entry.tags.includes(draft.koma)) addTagToEntry(entry, draft.koma);
    if (draft.speechBubble && !entry.tags.includes('speech bubble')) addTagToEntry(entry, 'speech bubble');
    if (!draft.speechBubble && entry.tags.includes('speech bubble')) removeTagFromEntry(entry, 'speech bubble');
    checkAchievements();
    header.textContent = `${entry.imgName} · ${entry.tags.length} tag${entry.tags.length===1?'':'s'}`;
    renderCurrentView();
  }

  const sepText = document.createElement('div');
  sepText.className = 'ctx-sep';
  sepText.textContent = 'Text & panel options (applies instantly)';
  menu.appendChild(sepText);

  const textLabel = document.createElement('label');
  textLabel.className = 'ach-toggle-row';
  textLabel.style.padding = '6px 8px';
  const textCb = document.createElement('input');
  textCb.type = 'checkbox';
  textCb.checked = draft.hasText;
  textCb.addEventListener('change', () => {
    draft.hasText = textCb.checked;
    renderTextSubOptions();
    syncTextPanelTags();
  });
  textLabel.appendChild(textCb);
  textLabel.appendChild(document.createTextNode(' Has text'));
  menu.appendChild(textLabel);

  const textSubBlock = document.createElement('div');
  menu.appendChild(textSubBlock);

  function renderTextSubOptions(){
    textSubBlock.innerHTML = '';
    if (!draft.hasText) return;

    const jpLabel = document.createElement('label');
    jpLabel.className = 'ach-toggle-row';
    jpLabel.style.padding = '6px 8px';
    const jpCb = document.createElement('input');
    jpCb.type = 'checkbox';
    jpCb.checked = draft.isJapanese;
    jpCb.addEventListener('change', () => { draft.isJapanese = jpCb.checked; syncTextPanelTags(); });
    jpLabel.appendChild(jpCb);
    jpLabel.appendChild(document.createTextNode(' Japanese (default — plain "text" tag)'));
    textSubBlock.appendChild(jpLabel);

    const foreignSep = document.createElement('div');
    foreignSep.className = 'ctx-sep';
    foreignSep.textContent = draft.foreignLangs.size
      ? `Foreign language(s): ${Array.from(draft.foreignLangs).join(', ')}`
      : 'Foreign language(s) — click to select, multiple allowed';
    textSubBlock.appendChild(foreignSep);

    renderLangChips();
  }

  function renderLangChips(){
    let chipsRow = textSubBlock.querySelector('.lang-picker-block');
    if (chipsRow) chipsRow.remove();
    const block = document.createElement('div');
    block.className = 'lang-picker-block';
    const row = document.createElement('div');
    row.style.padding = '2px 8px 6px';
    for (const lang of commonLanguages){
      const langKey = lang.toLowerCase();
      const chip = document.createElement('span');
      chip.className = 'lang-common-chip' + (draft.foreignLangs.has(langKey) ? ' active' : '');
      const nameSpan = document.createElement('span');
      nameSpan.textContent = lang;
      nameSpan.style.cursor = 'pointer';
      nameSpan.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (draft.foreignLangs.has(langKey)) draft.foreignLangs.delete(langKey);
        else draft.foreignLangs.add(langKey);
        renderTextSubOptions();
        syncTextPanelTags();
      });
      const rm = document.createElement('button');
      rm.textContent = '✕';
      rm.title = 'Remove from common languages';
      rm.addEventListener('click', (ev) => {
        ev.stopPropagation();
        commonLanguages = commonLanguages.filter(l => l !== lang);
        saveCommonLanguages();
        renderTextSubOptions();
      });
      chip.appendChild(nameSpan);
      chip.appendChild(rm);
      row.appendChild(chip);
    }
    block.appendChild(row);
    const addRow = document.createElement('div');
    addRow.style.cssText = 'display:flex; gap:6px; padding:0 8px 8px;';
    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = 'Add language…';
    addInput.style.cssText = 'flex:1; font-size:12px;';
    addInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && addInput.value.trim()){
        const lang = addInput.value.trim();
        if (!commonLanguages.includes(lang)){ commonLanguages.push(lang); saveCommonLanguages(); }
        if (autoSelectNewLanguage) draft.foreignLangs.add(lang.toLowerCase());
        renderTextSubOptions();
        syncTextPanelTags();
      }
    });
    addRow.appendChild(addInput);
    block.appendChild(addRow);
    textSubBlock.appendChild(block);
  }

  renderTextSubOptions();

  const sepPanel = document.createElement('div');
  sepPanel.className = 'ctx-sep';
  sepPanel.textContent = 'Comic / panels';
  menu.appendChild(sepPanel);

  const comicLabel = document.createElement('label');
  comicLabel.className = 'ach-toggle-row';
  comicLabel.style.padding = '6px 8px';
  const comicCb = document.createElement('input');
  comicCb.type = 'checkbox';
  comicCb.checked = draft.isComic;
  comicCb.addEventListener('change', () => { draft.isComic = comicCb.checked; syncTextPanelTags(); });
  comicLabel.appendChild(comicCb);
  comicLabel.appendChild(document.createTextNode(' Comic'));
  menu.appendChild(comicLabel);

  const komaRow = document.createElement('div');
  komaRow.className = 'ctx-words';
  const noneBtn = document.createElement('button');
  noneBtn.textContent = 'None';
  noneBtn.style.fontWeight = draft.koma === '' ? '700' : '400';
  noneBtn.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = ''; Array.from(komaRow.children).forEach(b=>b.style.fontWeight='400'); noneBtn.style.fontWeight='700'; syncTextPanelTags(); });
  komaRow.appendChild(noneBtn);
  for (const k of KOMA_OPTIONS){
    const b = document.createElement('button');
    b.textContent = k;
    b.style.fontWeight = draft.koma === k ? '700' : '400';
    b.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = k; Array.from(komaRow.children).forEach(x=>x.style.fontWeight='400'); b.style.fontWeight='700'; syncTextPanelTags(); });
    komaRow.appendChild(b);
  }
  menu.appendChild(komaRow);

  const bubbleLabel = document.createElement('label');
  bubbleLabel.className = 'ach-toggle-row';
  bubbleLabel.style.padding = '6px 8px';
  const bubbleCb = document.createElement('input');
  bubbleCb.type = 'checkbox';
  bubbleCb.checked = draft.speechBubble;
  bubbleCb.addEventListener('change', () => { draft.speechBubble = bubbleCb.checked; syncTextPanelTags(); });
  bubbleLabel.appendChild(bubbleCb);
  bubbleLabel.appendChild(document.createTextNode(' Speech bubble'));
  menu.appendChild(bubbleLabel);

  // --- Review flag (limited palette) ---
  const sep2 = document.createElement('div');
  sep2.className = 'ctx-sep';
  sep2.textContent = 'Flag for review';
  menu.appendChild(sep2);
  const flagRow = document.createElement('div');
  flagRow.style.cssText = 'display:flex; gap:6px; padding:4px 8px 8px; align-items:center; flex-wrap:wrap;';
  const swatchEls = [];
  for (const color of FLAG_COLORS){
    const sw = document.createElement('button');
    sw.style.cssText = `width:22px; height:22px; border-radius:5px; padding:0; background:${color}; border:2px solid ${entry.meta.reviewColor === color ? 'var(--text-primary)' : 'transparent'};`;
    sw.addEventListener('click', (ev) => {
      ev.stopPropagation();
      entry.meta.reviewColor = color;
      getEntryMeta()[entry.base] = entry.meta;
      saveEntryMetaRef();
      folderStats.review_flags = (folderStats.review_flags || 0) + 1;
      saveFolderStats();
      checkAchievements();
      renderCurrentView();
      swatchEls.forEach(s => { s.style.borderColor = 'transparent'; });
      sw.style.borderColor = 'var(--text-primary)';
    });
    swatchEls.push(sw);
    flagRow.appendChild(sw);
  }
  const clearFlagBtn = document.createElement('button');
  clearFlagBtn.textContent = 'Clear';
  clearFlagBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    entry.meta.reviewColor = null;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    renderCurrentView();
    swatchEls.forEach(s => { s.style.borderColor = 'transparent'; });
  });
  flagRow.appendChild(clearFlagBtn);
  menu.appendChild(flagRow);

  // --- Discrete mode (per-image blur) ---
  const blurLabel = document.createElement('label');
  blurLabel.className = 'ach-toggle-row';
  blurLabel.style.padding = '6px 8px';
  const blurCb = document.createElement('input');
  blurCb.type = 'checkbox';
  blurCb.checked = !!entry.meta.blurred;
  blurCb.addEventListener('change', () => {
    entry.meta.blurred = blurCb.checked;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    renderCurrentView();
  });
  blurLabel.appendChild(blurCb);
  blurLabel.appendChild(document.createTextNode(' Blur this image (discrete mode)'));
  menu.appendChild(blurLabel);

  // --- Notes ---
  const sep3 = document.createElement('div');
  sep3.className = 'ctx-sep';
  sep3.textContent = 'Note';
  menu.appendChild(sep3);
  const noteArea = document.createElement('textarea');
  noteArea.style.width = 'calc(100% - 16px)';
  noteArea.style.margin = '0 8px';
  noteArea.style.minHeight = '60px';
  noteArea.style.background = 'var(--bg-elevated)';
  noteArea.style.color = 'var(--text-primary)';
  noteArea.style.border = '1px solid var(--border-strong)';
  noteArea.style.borderRadius = 'var(--radius)';
  noteArea.style.fontFamily = 'var(--sans)';
  noteArea.style.fontSize = '12px';
  noteArea.style.padding = '6px';
  noteArea.value = entry.meta.note || '';
  menu.appendChild(noteArea);

  const visRow = document.createElement('label');
  visRow.className = 'ach-toggle-row';
  visRow.style.padding = '6px 8px';
  const visCb = document.createElement('input');
  visCb.type = 'checkbox';
  visCb.checked = !!entry.meta.noteAlwaysVisible;
  visRow.appendChild(visCb);
  visRow.appendChild(document.createTextNode(' Always show on card'));
  menu.appendChild(visRow);

  const saveNoteBtn = document.createElement('button');
  saveNoteBtn.className = 'primary ctx-item';
  saveNoteBtn.textContent = 'Save note';
  saveNoteBtn.addEventListener('click', () => {
    const wasEmpty = !entry.meta.note;
    entry.meta.note = noteArea.value;
    entry.meta.noteAlwaysVisible = visCb.checked;
    getEntryMeta()[entry.base] = entry.meta;
    saveEntryMetaRef();
    if (wasEmpty && noteArea.value.trim()){
      folderStats.notes_written = (folderStats.notes_written || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
    toast('Note saved.');
    closeTagContextMenu();
    renderCurrentView();
  });
  menu.appendChild(saveNoteBtn);

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
}

// ---------------- Selection summary + apply ----------------
// Per-tag selection (for the Unify/Void tool) and its summary/apply UI now
// live entirely in tag-pruner.ts — each Tag Pruner instance owns its own
// independent selection Set and renders its own summary + Apply/Void row,
// see renderUnifyVoidRows() there. This function is now just an alias kept
// for the many refreshRightPanels() call sites scattered through this file
// (every tag add/remove needs the Tag Pruner tag-count list to catch up).

export function refreshRightPanels(){
  renderTagPruners();
}

// setContainsFilter/setExcludesFilter are wired in from index.ts (they live in
// ./tag-index.ts) since importing them directly here would be fine too, but
// they're threaded through initView for consistency with the rest of this
// module's dependency injection.
let setContainsFilterRef = () => {};
let setExcludesFilterRef = () => {};
function setContainsFilter(tag){ setContainsFilterRef(tag); }
function setExcludesFilter(tag){ setExcludesFilterRef(tag); }
let deleteEntryPermanentlyRef = () => {};

export function initView(deps){
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getMasterTagModeActive = deps.getMasterTagModeActive;
  getCardTagSortMode = deps.getCardTagSortMode;
  getGalleryFilter = deps.getGalleryFilter;
  getIsolatedFlagActive = deps.getIsolatedFlagActive;
  getShowTagCountBadges = deps.getShowTagCountBadges;
  getEntryMeta = deps.getEntryMeta;
  saveEntryMetaRef = deps.saveEntryMeta;
  refreshAllUIRef = deps.refreshAllUI;
  setContainsFilterRef = deps.setContainsFilter;
  setExcludesFilterRef = deps.setExcludesFilter;
  deleteEntryPermanentlyRef = deps.deleteEntryPermanently;

  langAutoSelectToggle.addEventListener('change', () => {
    autoSelectNewLanguage = langAutoSelectToggle.checked;
    try { localStorage.setItem('dts-lang-autoselect', autoSelectNewLanguage ? '1' : '0'); } catch(e){}
  });
  (function initLangAutoSelectPref(){
    let on = true;
    try { on = localStorage.getItem('dts-lang-autoselect') !== '0'; } catch(e){}
    autoSelectNewLanguage = on;
    langAutoSelectToggle.checked = on;
  })();

  viewGridBtn.addEventListener('click', () => switchView('grid'));
  viewCompactBtn.addEventListener('click', () => {
    switchView('compact');
    folderStats.compact_used = true;
    saveFolderStats();
    checkAchievements();
  });
  viewSingleBtn.addEventListener('click', () => switchView('single'));
  btnUnlockAll.addEventListener('click', () => {
    const meta = getEntryMeta();
    let count = 0;
    for (const e of getEntries()){
      if (!e.meta || !e.meta.locked) continue;
      e.meta.locked = false;
      meta[e.base] = e.meta;
      count++;
    }
    if (count === 0){ toast('No locked images in this dataset.'); return; }
    saveEntryMetaRef();
    toast(`Unlocked ${count} image(s).`);
    renderCurrentView();
  });
  viewDisabledBtn.addEventListener('click', () => switchView('disabled'));
  viewDisabledBtn.addEventListener('dragover', (ev) => { ev.preventDefault(); viewDisabledBtn.classList.add('drag-over'); });
  viewDisabledBtn.addEventListener('dragleave', () => viewDisabledBtn.classList.remove('drag-over'));
  viewDisabledBtn.addEventListener('drop', (ev) => {
    ev.preventDefault();
    viewDisabledBtn.classList.remove('drag-over');
    const base = ev.dataTransfer.getData('text/plain');
    const target = getEntryByBase(base);
    if (target && !target.disabled){
      moveEntry(target, true);
      folderStats.drag_disabled_used = true;
      saveFolderStats();
      checkAchievements();
    }
  });
  // Swipe mode only — paging in Grid/Compact/Fade mode stays instant, same
  // as before this feature existed; only Swipe gets the physical slide.
  function pageSingle(delta){
    const html = document.documentElement;
    if (!html.classList.contains('motion-swipe') || html.classList.contains('motion-off')){
      singleIndex += delta;
      renderSingleView();
      return;
    }
    const outClass = delta > 0 ? 'view-swipe-out-left' : 'view-swipe-out-right';
    const inClass = delta > 0 ? 'view-swipe-in-right' : 'view-swipe-in-left';
    singleViewEl.classList.add(outClass);
    setTimeout(() => {
      singleViewEl.classList.remove(outClass);
      singleIndex += delta;
      renderSingleView();
      singleViewEl.classList.add(inClass);
      requestAnimationFrame(() => requestAnimationFrame(() => singleViewEl.classList.remove(inClass)));
    }, 100);
  }
  singlePrevBtn.addEventListener('click', () => pageSingle(-1));
  singleNextBtn.addEventListener('click', () => pageSingle(1));

  btnClearCompare.addEventListener('click', () => {
    stickyCompareImages = [];
    renderCompactGrid();
  });

  imageCardModal.addEventListener('click', (ev) => {
    if (ev.target === imageCardModal) closeImageCardModal();
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape'){
      if (imageCardModal.style.display === 'flex'){ closeImageCardModal(); return; }
      if (ctxMenuEl){ closeTagContextMenu(); return; }
      if (viewMode === 'single'){ switchView('grid'); return; }
    }
    if (viewMode === 'single' && !ctxMenuEl){
      if (ev.key === 'ArrowLeft' && !singlePrevBtn.disabled){ pageSingle(-1); }
      if (ev.key === 'ArrowRight' && !singleNextBtn.disabled){ pageSingle(1); }
    }
  });
}
