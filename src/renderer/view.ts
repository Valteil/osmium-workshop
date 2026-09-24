// Phase B module: all gallery/single/compact view rendering, the floating
// image card modal, chips + tag context menu, and the image options menu
// (3-dot: text/language, review flag, notes). This is the highest-fan-in
// rendering domain in the app. Several core index.ts internals that stay
// outside this extraction (entries, dirHandle-adjacent state, settings
// toggles, galleryFilter/cardTagSortMode/masterTagModeActive which are
// mutated from dropdowns/tabs that live in index.ts) are injected once via
// initView(), since index.ts's IIFE can't export them.
import type { Entry, EntryMeta, TagSubject, GalleryFilter, CardTagSortMode, DirHandle, FileHandle } from './types';
import { getJSON, setJSON, getBool, setBool } from './storage';
import { writeBytes } from './fs-access';
import {
  viewGridBtn, viewCompactBtn, viewSingleBtn, viewDisabledBtn, viewOriginalsBtn, btnUnlockAll, btnHideTags, btnRenameAllImages, singlePrevBtn, singleNextBtn,
  galleryGrid, compactGrid, compactCompareArea, compareCount, compactCompareTable, btnClearCompare,
  singleViewEl, singleNav, singlePos, imageCardModal, modalCardInner,
  langAutoSelectToggle, filterMatchCount
} from './dom';
import { toast, toastError, showConfirmModal, positionMenu, attachLongPress, attachPinchZoom, showInfoModal, escapeHtml, showImageLightbox, addContextMenuItem, transitionMsOf } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange, recordPixelChange, recordIsolateChange, addTagToEntry, removeTagFromEntry, removeAllTagsFromEntry, resetImageEdits, moveEntry, renameAllEntriesSequentially } from './tags-edit';
import { openTagDetails } from './tag-details';
import { attachTagAutocomplete, closeAutocomplete } from './tags-autocomplete';
import { buildTagIndex, refreshStats, filteredEntries } from './tag-index';
import { categorizeTag, groupTagsByCategory, TAG_CATEGORY_ORDER, TAG_CATEGORY_LABELS } from './tag-categories';
import { masterSelectedImages, renderMasterSelectionSummary, renderMasterMiniGrid } from './master-tag-control';
import { renderTagPruners } from './tag-pruner';
import { tagSingleImageWithWd14 } from './wd14-tagger';

export type ViewMode = 'grid' | 'compact' | 'single' | 'disabled' | 'originals';
export let viewMode: ViewMode = 'grid';
export let stickyCompareImages: string[] = [];

// "Tag Sorting": in Single mode and the card modal, render chips grouped into
// prompt-field categories (see tag-categories.ts). Never affects grid cards.
// Persisted app-wide, same as every other toggle here.
const TAG_SORTING_KEY = 'dts-tag-sorting';
let tagSortingActive = getBool(TAG_SORTING_KEY);

// Shift-click selection in the multi-subject tree (module-level so it survives
// the re-render each selection change triggers). Reset when the entry changes.
let subjectSelectedTags = new Set<string>();
let subjectSelectionBase: string | null = null;

let singleIndex = 0;
let ctxMenuEl: HTMLElement | null = null;
let commonLanguages = ['English'];
let autoSelectNewLanguage = true;

let getEntries: () => Entry[] = () => [];
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
let getDirHandleRef: () => DirHandle | null = () => null;
let addEntryFromNewFileRef: (base: string, imgHandle: FileHandle, imgName: string, txtHandle: FileHandle | null, txtExisted: boolean, tags: string[], disabled: boolean) => Promise<Entry | null> = async () => null;
let getMasterTagModeActive: () => boolean = () => false;
let getCardTagSortMode: () => CardTagSortMode = () => 'default';
let getGalleryFilter: () => GalleryFilter = () => ({ base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false, originalsView: false, exactMatch: false });
let getIsolatedFlagActive: () => boolean = () => false;
let getShowTagCountBadges: () => boolean = () => false;
let getEntryMeta: () => Record<string, EntryMeta> = () => ({});
let saveEntryMetaRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};

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
const VIEW_TRANSITION_ORDER = ['grid', 'compact', 'single', 'disabled', 'originals'];
function viewContainerFor(mode: ViewMode): HTMLElement {
  if (mode === 'compact') return compactGrid;
  if (mode === 'single') return singleViewEl;
  return galleryGrid;
}

export function switchView(mode: ViewMode): void {
  // Leaving Single view abandons any in-progress sequential detail run —
  // the queue is order- and filter-dependent, so resuming it elsewhere would
  // review the wrong images. Re-entering Single later starts clean.
  if (mode !== 'single' && seqActive) { seqActive = false; seqQueue = []; seqIdx = 0; }
  const prevMode = viewMode;
  const applyState = () => {
    viewMode = mode;
    viewGridBtn.classList.toggle('active', mode === 'grid');
    viewCompactBtn.classList.toggle('active', mode === 'compact');
    viewSingleBtn.classList.toggle('active', mode === 'single');
    viewDisabledBtn.classList.toggle('active', mode === 'disabled');
    viewOriginalsBtn.classList.toggle('active', mode === 'originals');
    getGalleryFilter().disabledView = (mode === 'disabled');
    getGalleryFilter().originalsView = (mode === 'originals');
    // '' (not 'grid') when shown: an inline style always beats stylesheet rules,
    // which would otherwise permanently defeat dynamic-cards mode's own
    // `display: block` override (its column-width/fill were applying, but were
    // inert since the container was still actually `display: grid` underneath).
    galleryGrid.style.display = (mode === 'grid' || mode === 'disabled' || mode === 'originals') ? '' : 'none';
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
  }, transitionMsOf(oldEl));
}

// ---------------- Gallery (grid) rendering ----------------

// Large-dataset rendering: the gallery grid builds cards in CHUNKS — the
// first paint only constructs the first GALLERY_CHUNK cards' DOM, and an
// IntersectionObserver on a sentinel appends more as the user scrolls.
// buildCard() is expensive (per-tag chips + several listeners per card), so
// building 5,000 detached nodes in one pass lagged every render (filter
// keystroke, tag click, save). Chunks + full rebuilds only when state
// changes keep interactivity at any dataset size; `content-visibility`
// (styles.css) then skips layout/paint for offscreen cards on top.
let galleryChunkObserver: IntersectionObserver | null = null;
let compactChunkObserver: IntersectionObserver | null = null;
const GALLERY_CHUNK = 250;
const COMPACT_CHUNK = 500;

// Shared progressive-append machinery. cleanUp must disconnect the observer
// before the host grid's innerHTML is cleared, or a queued IntersectionObserver
// callback fires into a detached container.
interface ChunkedList {
  appendChunk: () => void;
  // Build chunks until the given entry's card physically exists in the grid
  // (or everything is built). Note: the ENTRY list and grid children must
  // agree that filtering never deletes the anchor between capture and
  // restore. A tag addition keeps filter membership, so this holds.
  ensureBuilt: (base: string) => boolean;
}
function makeChunkedList(
  host: HTMLElement,
  list: Entry[],
  chunkSize: number,
  buildItem: (e: Entry) => HTMLElement,
  setObserver: (o: IntersectionObserver | null) => void
): ChunkedList {
  let shown = 0;
  const sentinel = document.createElement('div');
  sentinel.style.height = '1px';
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(en => en.isIntersecting)) appendChunkSet();
  }, { rootMargin: '600px' });
  setObserver(observer);

  function appendChunkSet(){
    if (shown >= list.length) return;
    const frag = document.createDocumentFragment();
    for (const e of list.slice(shown, shown + chunkSize)) frag.appendChild(buildItem(e));
    shown += chunkSize;
    host.appendChild(frag);
    if (shown < list.length){
      host.appendChild(sentinel);
    } else {
      sentinel.remove();
      observer.disconnect();
      setObserver(null);
    }
  }

  return {
    appendChunk: () => appendChunkSet(),
    ensureBuilt: (base: string): boolean => {
      // Synchronously keep building chunks until the anchor base is in the
      // DOM (list order is stable between capture and rebuild, so it IS in
      // some chunk).
      while (shown < list.length && !host.querySelector(`.card[data-base="${CSS.escape(base)}"], .compact-card[data-base="${CSS.escape(base)}"]`)){
        appendChunkSet();
      }
      return !!host.querySelector(`.card[data-base="${CSS.escape(base)}"], .compact-card[data-base="${CSS.escape(base)}"]`);
    }
  };
}

// The nearest ancestor with its own vertical scroller (the gallery lives in
// `main`/`aside`, which styles.css makes the scroll container).
function findVerticalScroller(el: HTMLElement): HTMLElement | null {
  let n: HTMLElement | null = el.parentElement;
  while (n){
    const oy = getComputedStyle(n).overflowY;
    if (oy === 'scroll' || oy === 'auto') return n;
    n = n.parentElement;
  }
  return null;
}

// Anchor-restore: instead of trusting scrollTop (which drifts any time
// content ABOVE the current viewport changes height — the exact failure of
// the simpler approach, "11 jumped to 17"), remember which entry straddles
// the top of the viewport and how far into view it sits, then after the
// rebuild align on THAT card. Cards above can grow or shrink rows freely;
// the card you're looking at stays where it is.
interface ScrollAnchor {
  base: string;
  offsetInViewport: number;
}
function captureAnchor(hoster: HTMLElement, scroller: HTMLElement | null): ScrollAnchor | null {
  if (!scroller) return null;
  const scTop = scroller.getBoundingClientRect().top;
  const cards = hoster.children;
  for (const n of Array.from(cards)){
    const el = n as HTMLElement;
    if (!(el.classList.contains('card') || el.classList.contains('compact-card'))) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom > scTop){
      return el.dataset.base ? { base: el.dataset.base, offsetInViewport: r.top - scTop } : null;
    }
  }
  return null;
}
function restoreAnchor(hoster: HTMLElement, scroller: HTMLElement | null, anchor: ScrollAnchor | null): void {
  if (!anchor) return;
  const el = hoster.querySelector<HTMLElement>(`.card[data-base="${CSS.escape(anchor.base)}"], .compact-card[data-base="${CSS.escape(anchor.base)}"]`);
  if (!el || !scroller) return;
  // The anchor card's own top, measured within the scrollable content, minus
  // how far into the viewport it sat before: the rebuilt content puts every
  // changed height ABOVE the anchor in its new place, and you in exactly the
  // same visual spot.
  // content-visibility:auto means offscreen cards sit at placeholder
  // heights until they approach — so a single measure-and-jump can still be
  // off if that settle (real heights replacing placeholders above/below the
  // anchor) lands after the assignment. The self-correcting loop converges
  // across the settle frames: every frame pushes the scroll until the
  // anchor card's viewport position matches the captured one exactly.
  const applyAnchor = () => {
    const err = el.getBoundingClientRect().top - anchor.offsetInViewport - scroller.getBoundingClientRect().top;
    if (Math.abs(err) > 1) scroller.scrollTop += err;
  };
  applyAnchor();
  requestAnimationFrame(() => {
    applyAnchor();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      applyAnchor();
      hoster.classList.remove('anchor-resolving');
    }));
  });
}

// In-place single-card refresh: for pure per-card tag operations (chip
// remove, + Add tag on the card itself) a FULL grid rebuild — aside from
// being ~300 cards of wasted work — recreates every <img>, which flashes all
// visible thumbnails (blob srcs re-decode) and visibly jumps/flickers. Swap
// just the changed card's node: scroll untouched, neighbors untouched, no
// revision flashes. Full renders only when membership/order can change
// (filters, sorts, disable/restore).
function patchGridCard(e: Entry): void {
  if (viewMode === 'compact'){
    const old = compactGrid.querySelector(`.compact-card[data-base="${CSS.escape(e.base)}"]`);
    if (old){ old.replaceWith(buildCompactCard(e)); return; }
  }
  const old = galleryGrid.querySelector(`.card[data-base="${CSS.escape(e.base)}"]`);
  if (!old){ renderCurrentView(); return; }
  old.replaceWith(buildCard(e, buildTagIndex()));
  updateFilterMatchCount();
}

function renderGallery(){
  // Anchor-based scroll preservation (see restoreAnchor for why scrollTop
  // alone drifted, e.g. "11 jumped to 17"): capture which entry straddles
  // the top of the viewport, rebuild, build chunks until it exists, then
  // align on THAT card.
  const scroller = findVerticalScroller(galleryGrid);
  const anchor = scroller ? captureAnchor(galleryGrid, scroller) : null;
  galleryGrid.innerHTML = '';
  if (galleryChunkObserver){ galleryChunkObserver.disconnect(); galleryChunkObserver = null; }
  const list = filteredEntries();
  const tagIndex = buildTagIndex();
  const lister = makeChunkedList(
    galleryGrid, list, GALLERY_CHUNK,
    (e) => buildCard(e, tagIndex),
    (o) => { galleryChunkObserver = o; }
  );
  lister.appendChunk();
  if (scroller && anchor) lister.ensureBuilt(anchor.base);
  restoreAnchor(galleryGrid, scroller, anchor);
}

function renderCompactGrid(){
  // Same anchor-based scroll preservation as renderGallery.
  const scroller = findVerticalScroller(compactGrid);
  const anchor = scroller ? captureAnchor(compactGrid, scroller) : null;
  compactGrid.innerHTML = '';
  if (compactChunkObserver){ compactChunkObserver.disconnect(); compactChunkObserver = null; }
  const list = filteredEntries().filter(e => !stickyCompareImages.includes(e.base));
  // buildCompactCard is small enough per-card that COMPACT_CHUNK is much
  // bigger than GALLERY_CHUNK's worth of work — a few thousand square thumbs
  // is the realistic worst case here.
  const lister = makeChunkedList(
    compactGrid, list, COMPACT_CHUNK,
    (e) => buildCompactCard(e),
    (o) => { compactChunkObserver = o; }
  );
  lister.appendChunk();
  if (scroller && anchor) lister.ensureBuilt(anchor.base);
  restoreAnchor(compactGrid, scroller, anchor);
  renderCompactCompareArea();
}

function buildCompactCard(e: Entry): HTMLElement {
  const card = document.createElement('div');
  card.className = 'compact-card' + (e.dirty ? ' dirty' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
  // Anchor-restore reads this (buildCard sets one on grid cards already).
  card.dataset.base = e.base;
  if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
  if (!e.disabled){
    card.draggable = true;
    card.addEventListener('dragstart', (ev) => {
      ev.dataTransfer!.setData('text/plain', e.base);
      ev.dataTransfer!.effectAllowed = 'move';
    });
  }
  const img = document.createElement('img');
  img.src = e.objectUrl;
  img.loading = 'lazy';
  img.decoding = 'async';
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
  if (e.tags.length && !getHideTagsRef()){
    const hoverTags = document.createElement('div');
    hoverTags.className = 'compact-hover-tags';
    hoverTags.textContent = e.tags.join(', ');
    card.appendChild(hoverTags);
  }
  return card;
}

function toggleStickyCompare(base: string): void {
  const idx = stickyCompareImages.indexOf(base);
  if (idx === -1) stickyCompareImages.push(base);
  else stickyCompareImages.splice(idx, 1);
  renderCompactGrid();
}

function renderCompactCompareArea(): void {
  const stickyEntries = stickyCompareImages.map(b => getEntryByBase(b)).filter((e): e is Entry => !!e);
  if (stickyEntries.length === 0){
    compactCompareArea.style.display = 'none';
    return;
  }
  compactCompareArea.style.display = 'block';
  compareCount.textContent = String(stickyEntries.length);

  const allTags = new Set<string>();
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

type TagIndex = Map<string, Set<string>>;

function buildCard(e: Entry, tagIndex: TagIndex): HTMLElement {
  const isTouchDevice = document.documentElement.classList.contains('touch-device');
  const card = document.createElement('div');
  card.className = 'card' + (e.dirty ? ' dirty' : '') + (e.tags.length===0 ? ' untagged' : '') + (e.disabled ? ' disabled-card' : '') + (e.meta && e.meta.reviewColor ? ' flagged' : '') + (e.meta && e.meta.blurred ? ' manually-blurred' : '');
  card.dataset.base = e.base;
  if (e.meta && e.meta.reviewColor) card.style.setProperty('--card-flag-color', e.meta.reviewColor);
  if (!e.disabled){
    card.draggable = true;
    card.addEventListener('dragstart', (ev) => {
      ev.dataTransfer!.setData('text/plain', e.base);
      ev.dataTransfer!.effectAllowed = 'move';
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
  img.decoding = 'async';
  thumbwrap.appendChild(img);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'img-menu-btn';
  menuBtn.textContent = '⋯';
  menuBtn.title = 'More options';
  menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
  thumbwrap.appendChild(menuBtn);
  // Touch only: these badges are appended to `card` itself further below
  // (before thumbwrap, so they render as a compact strip above the image
  // instead of overlaid on top of it — see the mobile CSS override) rather
  // than absolute-positioned inside thumbwrap the way desktop keeps them.
  const statusIconsEl = buildStatusIconsEl(e);
  if (!isTouchDevice) thumbwrap.appendChild(statusIconsEl);

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
    countBadge.textContent = String(e.tags.length);
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
  fn.textContent = e.imgName || e.base;
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

  // "+ Add tag" field ABOVE the chips: the chips list can be arbitrarily
  // long on a big dataset, so an input at the bottom met it only after
  // scrolling the whole row — the same top-first order the image-card
  // modal already uses.
  let addInput: HTMLInputElement | null = null;
  if (!isTouchDevice && !getHideTagsRef()){
    addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.className = 'addtag-input';
    addInput.placeholder = '+ Add tag';
    addInput.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' && addInput && addInput.value.trim()){
        addTagToEntry(e, addInput.value.trim());
        addInput.value = '';
        closeAutocomplete();
        // Replacement refocus: patchGridCard swaps the card node, so the
        // (top-placed) input that just lost its value gets replaced too.
        // Re-focus the new card's own input so rapid Enter-tagging stays in
        // the same place instead of silently dead-ending mid-typing.
        patchGridCard(e);
        const freshInput = galleryGrid.querySelector<HTMLInputElement>(
          `.card[data-base="${CSS.escape(e.base)}"] .addtag-input`
        );
        if (freshInput){ freshInput.focus(); }
        refreshRightPanels();
      }
    });
    // The card itself is draggable=true (for reordering into Disabled,
    // etc.), which otherwise hijacks any click-drag over this input into a
    // native HTML5 drag instead of a text selection. Suspending it while
    // the input is focused fixes that without affecting the card's own
    // drag behavior.
    addInput.addEventListener('focus', () => { card.draggable = false; });
    addInput.addEventListener('blur', () => { card.draggable = !e.disabled; });
    attachTagAutocomplete(addInput, () => e, () => { renderGallery(); refreshRightPanels(); });
    tagbox.appendChild(addInput);
  }

  const chiprow = document.createElement('div');
  chiprow.className = 'chiprow';
  // Hide-tags mode (user spec): cards render with NO chips so the filter's
  // have/not-have split reads instantly from the cards themselves. Tags are
  // untouched — always still reachable through the card modal.
  if (!getHideTagsRef()){
    for (const tag of orderedTagsForDisplay(e, tagIndex)){
      chiprow.appendChild(buildChip(e, tag, () => { patchGridCard(e); refreshRightPanels(); refreshStats(); }, tagIndex));
    }
  }
  tagbox.appendChild(chiprow);

  if (isTouchDevice){
    // A real (but non-functional — CSS makes it non-interactive, see below)
    // `<input>` here read as a broken control: it looks tappable/typeable
    // but does nothing, since editing on touch always redirects to the
    // image-card modal instead (tagbox's own click handler below). A plain
    // ghost label says what actually happens without implying a text field
    // that isn't really there.
    const ghost = document.createElement('div');
    ghost.className = 'addtag-ghost';
    ghost.textContent = 'Tap to edit';
    tagbox.appendChild(ghost);
  }

  // Touch only: a grid card's own inline tag chips/input (CSS makes them
  // non-interactive there, `.touch-device .card .tagbox`) redirect to the
  // same modal tapping the image already opens, instead of trying to hit a
  // tiny inline chip-delete button or focus a cramped input on a card
  // that's a fraction of the screen wide. Desktop keeps normal inline
  // editing — this only fires the modal on touch devices.
  tagbox.addEventListener('click', () => {
    if (ctxMenuEl) return;
    if (isTouchDevice) openImageCardModal(e);
  });

  if (isTouchDevice) card.appendChild(statusIconsEl);
  card.appendChild(thumbwrap);
  card.appendChild(tagbox);
  return card;
}

// ---------------- Single image view rendering ----------------

let singleZoom = 100;
let singlePanX = 0, singlePanY = 0;
let lastSingleBase: string | null = null;

function renderMultiCompareView(): void {
  singleViewEl.innerHTML = '';
  singlePos.textContent = `${masterSelectedImages.size} selected`;
  singlePrevBtn.disabled = true;
  singleNextBtn.disabled = true;

  const selectedEntries = Array.from(masterSelectedImages).map(b => getEntryByBase(b)).filter((e): e is Entry => !!e);
  const allTags = new Set<string>();
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
      ownerRow.textContent = e.imgName || e.base;
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

function renameTagAcrossEntries(oldTag: string, newTag: string, entriesList: Entry[]): void {
  const affected: { base: string; prevTags: string[]; newTags: string[] }[] = [];
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

function openMultiCompareTagMenu(entry: Entry, tag: string, x: number, y: number): void {
  closeTagContextMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = entry.imgName || entry.base;
  menu.appendChild(header);
  addContextMenuItem(menu, `Remove "${tag}" from this image`, () => {
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

// ---------------- Sequential detail editing (desktop) ----------------
// A guided pass over the gallery in its current sort order (filename, date
// added, whatever the sort dropdown says — filteredEntries() already encodes
// both), reviewing one image at a time for the same status facts the 3-dot
// text panel covers, plus monochrome and censor type. Takes over Single
// view's interface while active: same zoomable image side, but the panel
// becomes a quick-modify form with Confirm at the bottom advancing to the
// next image. Everything already reviewed stays included — this is a review
// pass, not a filter for undefined states. Desktop-only (touch editing lives
// in the card modal instead); the entry buttons don't render on touch.
let seqActive = false;
let seqQueue: Entry[] = [];
let seqIdx = 0;

const PERSPECTIVE_OPTIONS = ['from front', 'from side', 'from below', 'from above', 'from behind'];
// Camera-viewpoint tags the panel can assert that aren't "where is the
// subject's body pointed" angles — POV (subject's-eyes view) and close-up
// (framing) are composition choices, but the user asked for them right in
// the Perspective group, where the checkbox shape already matches.
const PERSPECTIVE_EXTRA_OPTIONS = ['pov', 'close-up'];
function perspectiveOptionTags(): string[] {
  return [...PERSPECTIVE_OPTIONS, ...PERSPECTIVE_EXTRA_OPTIONS];
}
const CENSOR_TYPE_OPTIONS = [
  { tag: 'censored', label: 'Generic' },
  { tag: 'mosaic censoring', label: 'Mosaic' },
  { tag: 'bar censor', label: 'Bar' },
  { tag: 'blur censor', label: 'Blur' },
  { tag: 'heart censor', label: 'Heart' },
  { tag: 'light censor', label: 'Light' }
];

export function startSequentialDetail(from: 'first' | 'selected'): void {
  const list = filteredEntries();
  if (!list.length) { toast('No images match the current filter.'); return; }
  let startIdx = 0;
  if (from === 'selected'){
    if (masterSelectedImages.size === 0) { toast('Select at least one image first.'); return; }
    startIdx = list.findIndex((e) => masterSelectedImages.has(e.base));
    if (startIdx < 0) { toast('No selected images match the current filter.'); return; }
  }
  seqQueue = list;
  seqIdx = startIdx;
  seqActive = true;
  // Collapse the right sidebar for the run so the image + controls own the
  // full width. Remember the pre-run state (only force-expand on exit what
  // WE collapsed) so restoring never fights a user's own choice.
  seqPanelForcedCollapse = !getRightPanelCollapsedRef();
  setRightPanelCollapsedRef(true);
  switchView('single');
}

export function exitSequentialDetail(): void {
  if (!seqActive) return;
  seqActive = false;
  seqQueue = [];
  seqIdx = 0;
  if (seqPanelForcedCollapse) setRightPanelCollapsedRef(false);
  seqPanelForcedCollapse = false;
  if (viewMode !== 'single') return;
  singleNav.style.display = 'flex';
  renderSingleView();
}

interface SeqDraft {
  hasText: boolean;
  isJapanese: boolean;
  foreignLangs: Set<string>;
  censor: 'unspecified' | 'censored' | 'uncensored';
  censorTypes: Set<string>;
  perspectives: Set<string>;
  monochrome: boolean;
  soundEffects: boolean;
  isComic: boolean;
  multipleViews: boolean;
  koma: string;
}

function seqDraftFromEntry(entry: Entry): SeqDraft {
  const censoredTags = entry.tags.filter((t) => /censor/i.test(t) && !/uncensor/i.test(t));
  const uncensored = entry.tags.some((t) => /uncensor/i.test(t));
  // Prefill every known type actually present; a censored state with no
  // known type falls back to generic so nothing silently unchecks.
  const presentTypes = CENSOR_TYPE_OPTIONS.filter((o) => entry.tags.includes(o.tag)).map((o) => o.tag);
  return {
    hasText: entry.tags.includes('text') || getForeignLangTags(entry).length > 0,
    isJapanese: entry.tags.includes('text'),
    foreignLangs: new Set(getForeignLangTags(entry).map((t) => t.replace(/ text$/, ''))),
    censor: censoredTags.length > 0 ? 'censored' : (uncensored ? 'uncensored' : 'unspecified'),
    censorTypes: new Set(presentTypes.length ? presentTypes : (censoredTags.length > 0 ? ['censored'] : [])),
    perspectives: new Set(perspectiveOptionTags().filter((p) => entry.tags.includes(p))),
    monochrome: entry.tags.includes('monochrome'),
    soundEffects: entry.tags.includes('sound effects'),
    isComic: entry.tags.includes('comic'),
    // Independent of comic — a single illustration can show its subject
    // from several angles at once (the multiple views tag, ~30k posts).
    multipleViews: entry.tags.includes('multiple views'),
    koma: entry.tags.find((t) => KOMA_OPTIONS.includes(t)) || ''
  };
}

function applySequentialDraft(entry: Entry, d: SeqDraft): void {
  // Text — same tag shapes as the 3-dot panel: bare "text" for Japanese,
  // "[language] text" per foreign language, all independent.
  if (!d.hasText){
    if (entry.tags.includes('text')) removeTagFromEntry(entry, 'text');
    for (const tag of getForeignLangTags(entry)) removeTagFromEntry(entry, tag);
  } else {
    if (d.isJapanese){ if (!entry.tags.includes('text')) addTagToEntry(entry, 'text'); }
    else if (entry.tags.includes('text')) removeTagFromEntry(entry, 'text');
    for (const tag of getForeignLangTags(entry)){
      if (!d.foreignLangs.has(tag.replace(/ text$/, ''))) removeTagFromEntry(entry, tag);
    }
    for (const lang of d.foreignLangs){
      if (!entry.tags.includes(`${lang} text`)) addTagToEntry(entry, `${lang} text`);
    }
  }
  // Censorship — one regex clears both families ('uncensored' contains
  // 'censor', so a single pass resets the whole tri-state), then the chosen
  // state is written back. Types are NOT mutually exclusive: several may be
  // checked at once; an empty checked set under Censored falls back to the
  // generic tag so the state can't silently unwrite itself.
  for (const tag of entry.tags.filter((t) => /censor/i.test(t))) removeTagFromEntry(entry, tag);
  if (d.censor === 'censored'){
    const types = d.censorTypes.size ? [...d.censorTypes] : ['censored'];
    for (const t of types) addTagToEntry(entry, t);
  }
  else if (d.censor === 'uncensored') addTagToEntry(entry, 'uncensored');
  // Perspective — independent checkboxes, not exclusive: one image can
  // legitimately carry several (e.g. a collage with front and side views).
  // Covers the extra composition options (pov / close-up) too.
  for (const p of perspectiveOptionTags()){
    if (d.perspectives.has(p)) { if (!entry.tags.includes(p)) addTagToEntry(entry, p); }
    else if (entry.tags.includes(p)) removeTagFromEntry(entry, p);
  }
  // Color — untagged implies color; only monochrome is ever written.
  if (d.monochrome && !entry.tags.includes('monochrome')) addTagToEntry(entry, 'monochrome');
  if (!d.monochrome && entry.tags.includes('monochrome')) removeTagFromEntry(entry, 'monochrome');
  // Sound effects (drawn SFX) — same assert-only shape: presence claims it.
  if (d.soundEffects && !entry.tags.includes('sound effects')) addTagToEntry(entry, 'sound effects');
  if (!d.soundEffects && entry.tags.includes('sound effects')) removeTagFromEntry(entry, 'sound effects');
  // Comic / koma — same shapes as the 3-dot panel.
  if (d.isComic && !entry.tags.includes('comic')) addTagToEntry(entry, 'comic');
  if (!d.isComic && entry.tags.includes('comic')) removeTagFromEntry(entry, 'comic');
  if (d.multipleViews && !entry.tags.includes('multiple views')) addTagToEntry(entry, 'multiple views');
  if (!d.multipleViews && entry.tags.includes('multiple views')) removeTagFromEntry(entry, 'multiple views');
  const existingKoma = entry.tags.find((t) => KOMA_OPTIONS.includes(t));
  if (existingKoma && existingKoma !== d.koma) removeTagFromEntry(entry, existingKoma);
  if (d.koma && !entry.tags.includes(d.koma)) addTagToEntry(entry, d.koma);
}

// The panel-governed tags Confirm WILL assert — nothing else. (Deliberately
// NOT the full resulting tag list: the strip answers "what are my selections
// doing", so the image's other, untouched tags stay out of it.) Pure on
// purpose: the real apply goes through add/removeTagFromEntry, which record
// undo entries, mark dirty, and can fire merge-rule toasts — so it can never
// run speculatively. Keep the tag shapes in sync with applySequentialDraft.
function seqPreviewTags(d: SeqDraft): string[] {
  const tags: string[] = [];
  if (d.hasText){
    if (d.isJapanese) tags.push('text');
    for (const lang of d.foreignLangs) tags.push(`${lang} text`);
  }
  if (d.censor === 'censored'){
    for (const t of (d.censorTypes.size ? [...d.censorTypes] : ['censored'])) tags.push(t);
  }
  else if (d.censor === 'uncensored') tags.push('uncensored');
  for (const p of perspectiveOptionTags()) if (d.perspectives.has(p)) tags.push(p);
  if (d.monochrome) tags.push('monochrome');
  if (d.soundEffects) tags.push('sound effects');
  if (d.isComic) tags.push('comic');
  if (d.multipleViews) tags.push('multiple views');
  if (d.koma) tags.push(d.koma);
  return tags;
}

function buildSequentialPanel(panel: HTMLElement, entry: Entry, onPreview?: (tags: string[]) => void): void {
  const d = seqDraftFromEntry(entry);
  // Live preview feed: every checkbox/radio change bubbles a 'change' event
  // to the panel, so one listener keeps the chip strip current (the Add-
  // language button isn't a checkbox, so it emits explicitly instead).
  const emitPreview = () => { if (onPreview) onPreview(seqPreviewTags(d)); };
  panel.addEventListener('change', emitPreview);

  function sectionLabel(text: string): HTMLElement {
    const el = document.createElement('div');
    el.className = 'single-name';
    el.style.marginTop = '10px';
    el.textContent = text;
    return el;
  }
  function toggleRow(labelText: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
    const label = document.createElement('label');
    label.className = 'ach-toggle-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = checked;
    cb.addEventListener('change', () => onChange(cb.checked));
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + labelText));
    return label;
  }
  // N-up grid for checkbox groups — one stacked row per option forces a
  // long scroll; groups of short one-word options fit narrower cells.
  function checkGrid(columns?: number): HTMLElement {
    const grid = document.createElement('div');
    grid.style.cssText = columns
      ? `display:grid; grid-template-columns:repeat(${columns}, minmax(0, 1fr)); gap:4px 6px; margin:2px 0;`
      : 'display:grid; grid-template-columns:repeat(auto-fill, minmax(110px, 1fr)); gap:4px 6px; margin:2px 0;';
    return grid;
  }
  function cap(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function radioRow(group: string, options: { value: string; label: string }[], current: string, onPick: (v: string) => void): HTMLElement {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex; flex-wrap:wrap; gap:4px 12px; margin:4px 0;';
    for (const o of options){
      const label = document.createElement('label');
      label.style.cssText = 'display:flex; align-items:center; gap:4px; font-size:12px;';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = group + '-' + entry.base;
      radio.value = o.value;
      radio.checked = o.value === current;
      radio.addEventListener('change', () => { if (radio.checked) onPick(o.value); });
      label.appendChild(radio);
      label.appendChild(document.createTextNode(o.label));
      wrap.appendChild(label);
    }
    return wrap;
  }

  panel.appendChild(sectionLabel('Text'));
  // Compact two-up rows: most toggles are 1-2 words, so full-width rows
  // wasted half the panel and forced scrolling. Pairs share a line
  // (Has text/Yapanese-class pairs per user spec).
  function togglePair(a: HTMLElement, b?: HTMLElement): HTMLElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:6px; margin:4px 0;';
    a.style.flex = '1';
    row.appendChild(a);
    if (b){ b.style.flex = '1'; row.appendChild(b); }
    return row;
  }
  const hasTextRow = toggleRow('Has text', d.hasText, (v) => {
    d.hasText = v;
    panel.querySelectorAll('.seq-text-sub').forEach((el) => { (el as HTMLElement).style.display = v ? '' : 'none'; });
  });
  // Sound effects sits right beside Has text (per user spec, not buried
  // further down under its own heading).
  const soundRow = toggleRow('Sound effects', d.soundEffects, (v) => { d.soundEffects = v; });
  panel.appendChild(togglePair(hasTextRow, soundRow));
  const textSub = document.createElement('div');
  textSub.className = 'seq-text-sub';
  textSub.style.display = d.hasText ? '' : 'none';
  const jpRow = toggleRow('Japanese', d.isJapanese, (v) => { d.isJapanese = v; });
  textSub.appendChild(togglePair(jpRow));
  const langList = checkGrid();
  textSub.appendChild(langList);
  function refreshLangRows(): void {
    langList.innerHTML = '';
    // One row per LANGUAGE, not per casing: "English" (common list) and a
    // stray "english" previously both rendered because the display names
    // differ while their lowercase keys are the same thing. Dedupe by the
    // key the checkboxes actually toggle on.
    const byKey = new Map<string, string>();
    for (const name of [...commonLanguages, ...d.foreignLangs]){
      const key = name.toLowerCase();
      if (!byKey.has(key)) byKey.set(key, name);
    }
    for (const [key, display] of byKey){
      langList.appendChild(toggleRow(display, d.foreignLangs.has(key), (v) => {
        if (v) d.foreignLangs.add(key);
        else d.foreignLangs.delete(key);
      }));
    }
  }
  refreshLangRows();
  const addLangRow = document.createElement('div');
  addLangRow.style.cssText = 'display:flex; gap:6px; margin-top:4px;';
  const addLangInput = document.createElement('input');
  addLangInput.type = 'text';
  addLangInput.placeholder = 'Add language…';
  addLangInput.style.flex = '1';
  const addLangBtn = document.createElement('button');
  addLangBtn.textContent = 'Add';
  function commitNewLanguage(): void {
    const lang = addLangInput.value.trim();
    if (!lang) return;
    // Same convention as the 3-dot panel: display case joins the common
    // list, the lowercase key joins this image's set (always selected here —
    // adding means wanting it on this image).
    if (!commonLanguages.includes(lang)){ commonLanguages.push(lang); saveCommonLanguages(); }
    d.foreignLangs.add(lang.toLowerCase());
    addLangInput.value = '';
    refreshLangRows();
    emitPreview();
  }
  addLangInput.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') commitNewLanguage(); });
  addLangBtn.addEventListener('click', commitNewLanguage);
  addLangRow.appendChild(addLangInput);
  addLangRow.appendChild(addLangBtn);
  textSub.appendChild(addLangRow);
  panel.appendChild(textSub);

  panel.appendChild(sectionLabel('Censorship'));
  const censorWrap = document.createElement('div');
  panel.appendChild(censorWrap);
  // Censor types are independent checkboxes, not a dropdown — an image can
  // carry several at once (mosaic AND bar, etc.).
  // Explicit two columns for censor types (user spec): five short labels
  // fit two-up with room for the longer "Generic (censored)" label.
  // Types are ALWAYS visible (not gated behind the Censored radio): the
  // fast path is checking a type directly, which implies the Censored
  // state — see the auto-set in the toggle handler below.
  const typeBox = checkGrid(2);
  for (const o of CENSOR_TYPE_OPTIONS){
    typeBox.appendChild(toggleRow(o.label, d.censorTypes.has(o.tag), (v) => {
      if (v){
        d.censorTypes.add(o.tag);
        // Checking a type asserts the image IS censored (mosaic/bar/... can
        // only exist on a censored image), so flip the state radio along
        // with it instead of making the user click Censored separately.
        if (d.censor !== 'censored'){
          d.censor = 'censored';
          renderCensor();
        }
      }
      else d.censorTypes.delete(o.tag);
    }));
  }
  function renderCensor(){
    censorWrap.innerHTML = '';
    censorWrap.appendChild(radioRow('seq-censor', [
      { value: 'unspecified', label: 'Unspecified' },
      { value: 'censored', label: 'Censored' },
      { value: 'uncensored', label: 'Uncensored' }
    ], d.censor, (v) => {
      d.censor = v as SeqDraft['censor'];
    }));
  }
  renderCensor();
  panel.appendChild(typeBox);

  panel.appendChild(sectionLabel('Perspective'));
  const perspBox = checkGrid();
  for (const p of perspectiveOptionTags()){
    // Angles drop their literal "from " prefix for display; the extras are
    // already human labels ("POV", "close-up").
    const label = p === 'close-up' ? 'Close-up' : cap(p.replace(/^from /, ''));
    perspBox.appendChild(toggleRow(label, d.perspectives.has(p), (v) => {
      if (v) d.perspectives.add(p);
      else d.perspectives.delete(p);
    }));
  }
  panel.appendChild(perspBox);

  panel.appendChild(sectionLabel('Indicator'));
  const monoRowOuter = toggleRow('Monochrome', d.monochrome, (v) => { d.monochrome = v; });
  const comicRow = toggleRow('Comic', d.isComic, (v) => { d.isComic = v; });
  panel.appendChild(togglePair(monoRowOuter, comicRow));
  panel.appendChild(toggleRow('Multiple views', d.multipleViews, (v) => { d.multipleViews = v; }));
  panel.appendChild(radioRow('seq-koma', [
    { value: '', label: 'Not koma' },
    ...KOMA_OPTIONS.map((k) => ({ value: k, label: k }))
  ], d.koma, (v) => { d.koma = v; }));

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'primary';
  confirmBtn.style.cssText = 'width:100%; margin-top:12px; padding:12px; font-size:15px; font-weight:600;';
  // Sticky footer: always visible without scrolling, however far down the
  // selections are.
  confirmBtn.classList.add('seq-confirm');
  confirmBtn.textContent = seqIdx >= seqQueue.length - 1 ? 'Confirm (finish)' : 'Confirm (next →)';
  confirmBtn.addEventListener('click', () => {
    applySequentialDraft(entry, d);
    renderCurrentView();
    seqIdx++;
    if (seqIdx >= seqQueue.length){
      exitSequentialDetail();
      toast('Sequential review done.');
    } else {
      renderSingleView();
    }
  });
  panel.appendChild(confirmBtn);
  emitPreview();
}

// The zoomable/pannable image side. Now used only by sequential mode — normal
// Single view shows a small static preview that opens the fullscreen lightbox
// on click (buildSinglePreview). Hooks carry the zoom readout up to whichever
// render owns a slider for it.
function buildSingleImgSide(e: Entry, hooks?: { setZoomUI(z: number): void }, opts?: { clampPan?: boolean }): HTMLElement {
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
    // Sequential-only clamp: the pan can never push an image edge past the
    // container border. Measured from live rects (not natural size × zoom)
    // so CSS fit-sizing is accounted for exactly: undersized axes recenter,
    // oversized axes stop dead at each edge.
    if (opts && opts.clampPan){
      const r = img.getBoundingClientRect();
      if (r.width > 0 && r.height > 0){
        const c = imgSide.getBoundingClientRect();
        let dx = 0, dy = 0;
        if (r.width <= c.width) dx = (c.left + c.width / 2) - (r.left + r.width / 2);
        else if (r.left > c.left) dx = c.left - r.left;
        else if (r.right < c.right) dx = c.right - r.right;
        if (r.height <= c.height) dy = (c.top + c.height / 2) - (r.top + r.height / 2);
        else if (r.top > c.top) dy = c.top - r.top;
        else if (r.bottom < c.bottom) dy = c.bottom - r.bottom;
        if (dx || dy){
          singlePanX += dx; singlePanY += dy;
          img.style.transform = `translate(${singlePanX}px, ${singlePanY}px) scale(${singleZoom/100})`;
        }
      }
    }
  }
  // Stale pan carries between sequential images (no per-image reset); clamp
  // on load so a new image never opens offset out of bounds.
  if (opts && opts.clampPan) img.addEventListener('load', () => applyTransform());

  function zoomBy(delta: number, clientX?: number, clientY?: number): void {
    const prevZoom = singleZoom;
    singleZoom = Math.min(400, Math.max(100, singleZoom + delta));
    if (singleZoom === prevZoom) return;
    if (hooks) hooks.setZoomUI(singleZoom);
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

  return imgSide;
}

// Normal Single view's image: a small static preview (no zoom/pan here) that
// opens the fullscreen zoomable lightbox on click. The same 3-dot menu and
// status/merge badges that used to overlay the big zoomable side ride on it.
function buildSinglePreview(e: Entry): HTMLElement {
  const box = document.createElement('div');
  box.className = 'single-preview';
  box.title = 'Click to view full size';

  const img = document.createElement('img');
  img.src = e.objectUrl;
  img.draggable = false;
  box.appendChild(img);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'img-menu-btn';
  menuBtn.style.left = '10px';
  menuBtn.style.top = '10px';
  menuBtn.textContent = '⋯';
  menuBtn.title = 'More options';
  menuBtn.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  menuBtn.addEventListener('click', (ev) => { ev.stopPropagation(); openImageOptionsMenu(e, ev.clientX, ev.clientY); });
  box.appendChild(menuBtn);

  const statusIconsEl = buildStatusIconsEl(e);
  statusIconsEl.style.left = '10px';
  statusIconsEl.style.top = '38px';
  box.appendChild(statusIconsEl);

  const mvBadges = buildMergeVoidBadgesEl(e);
  if (mvBadges){
    mvBadges.style.position = 'absolute';
    mvBadges.style.left = '10px';
    mvBadges.style.bottom = '10px';
    box.appendChild(mvBadges);
  }

  const hint = document.createElement('div');
  hint.className = 'single-preview-hint';
  hint.textContent = 'Click to view full size';
  box.appendChild(hint);

  box.addEventListener('click', () => showImageLightbox(e.objectUrl));
  return box;
}

// The toolbar's "N / total" indicator. N is an editable field: type a number
// and press Enter (or blur) to jump straight to that image.
function renderSinglePos(total: number): void {
  singlePos.innerHTML = '';
  if (!total){ singlePos.textContent = '0 / 0'; return; }
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'single-pos-input';
  inp.value = String(singleIndex + 1);
  inp.title = 'Type an image number and press Enter to jump';
  inp.setAttribute('inputmode', 'numeric');
  inp.setAttribute('aria-label', 'Image number');
  const commit = (): void => {
    const n = parseInt(inp.value, 10);
    if (!isFinite(n)){ inp.value = String(singleIndex + 1); return; }
    const target = Math.min(total, Math.max(1, n)) - 1;
    if (target !== singleIndex){ singleIndex = target; renderSingleView(); }
    else inp.value = String(singleIndex + 1);
  };
  inp.addEventListener('keydown', (ev) => {
    ev.stopPropagation(); // don't let ←/→ page the image while typing here
    if (ev.key === 'Enter'){ ev.preventDefault(); commit(); inp.blur(); }
    else if (ev.key === 'Escape'){ inp.value = String(singleIndex + 1); inp.blur(); }
  });
  inp.addEventListener('blur', commit);
  const tot = document.createElement('span');
  tot.className = 'single-pos-total';
  tot.textContent = '/ ' + total;
  singlePos.appendChild(inp);
  singlePos.appendChild(tot);
}

function renderSingleView(){
  if (masterSelectedImages.size > 1 && !seqActive){
    renderMultiCompareView();
    return;
  }
  if (seqActive){
    const seqEntry = seqQueue[seqIdx];
    if (!seqEntry){
      exitSequentialDetail();
    } else {
      // Takeover: the same zoomable image side as normal Single view, but
      // the panel becomes the sequential quick-modify form. singleNav stays
      // hidden throughout — Confirm is the only way forward.
      singleNav.style.display = 'none';
      singleViewEl.innerHTML = '';
      const entry = seqEntry;
      const wrap = document.createElement('div');
      wrap.className = 'single-wrap';
      const seqSide = buildSingleImgSide(entry, undefined, { clampPan: true });
      // Column wrapper: the live "will apply" chip strip docks below the
      // image instead of inside it (inside would overlay the artwork; beside
      // it would steal panel width). The side's 60vh floor is lifted so the
      // column still fits the viewport with the strip attached.
      seqSide.style.minHeight = '0';
      const imgCol = document.createElement('div');
      imgCol.style.cssText = 'flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;';
      imgCol.appendChild(seqSide);
      // Filename + resolution live above the chips preview below the image
      // (the panel keeps only the counter per user spec — one top-of-panel
      // position read, file identity where the tags live).
      const nameEl = document.createElement('div');
      nameEl.className = 'single-name';
      nameEl.style.cssText = 'padding:0 2px;';
      nameEl.textContent = entry.imgName + (entry.width ? ` · ${entry.width}×${entry.height}` : '');
      imgCol.appendChild(nameEl);
      const previewBox = document.createElement('div');
      previewBox.style.cssText = 'border:1px solid var(--border-soft); border-radius:8px; padding:8px 10px; background:var(--bg-panel);';
      const previewHead = document.createElement('div');
      previewHead.style.cssText = 'font-size:12px; color:var(--text-faint); margin-bottom:6px;';
      const previewChips = document.createElement('div');
      previewChips.className = 'chiprow';
      previewChips.style.cssText = 'max-height:110px; overflow-y:auto;';
      previewBox.appendChild(previewHead);
      previewBox.appendChild(previewChips);
      imgCol.appendChild(previewBox);
      wrap.appendChild(imgCol);
      // Click (not drag) opens the fullscreen zoomable lightbox for detail
      // inspection — pan-drag threshold separates the two gestures sharing
      // this surface.
      let seqDownX = 0, seqDownY = 0;
      const seqImg = seqSide.querySelector('img');
      if (seqImg){
        seqImg.addEventListener('pointerdown', (ev) => { seqDownX = ev.clientX; seqDownY = ev.clientY; });
        seqImg.addEventListener('click', (ev) => {
          if (Math.hypot(ev.clientX - seqDownX, ev.clientY - seqDownY) > 6) return;
          showImageLightbox(entry.objectUrl);
        });
      }
      const panel = document.createElement('div');
      // seq-panel: sequential-specific compaction CSS (see styles.css) — the
      // whole panel is meant to fit without scrolling at normal window sizes.
      panel.className = 'single-panel seq-panel';
      panel.style.position = 'relative';
      const headRow = document.createElement('div');
      headRow.style.cssText = 'display:flex; align-items:center; gap:8px;';
      const posEl = document.createElement('span');
      posEl.className = 'single-pos';
      posEl.style.flex = '1';
      posEl.textContent = `${seqIdx + 1} / ${seqQueue.length}`;
      const exitBtn = document.createElement('button');
      exitBtn.textContent = 'Exit sequential';
      exitBtn.title = 'Leave sequential review (progress is already saved per Confirm)';
      exitBtn.addEventListener('click', () => exitSequentialDetail());
      // Previous image: navigates without applying anything — Confirm is the
      // only thing that writes, so zig-zagging re-checks options without
      // committing.
      let backBtn: HTMLButtonElement | null = null;
      if (seqIdx > 0){
        backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.title = 'Go back to the previous image (selections already applied by Confirm are saved)';
        backBtn.addEventListener('click', () => {
          seqIdx--;
          renderSingleView();
        });
      }
      headRow.appendChild(posEl);
      if (backBtn) headRow.appendChild(backBtn);
      headRow.appendChild(exitBtn);
      panel.appendChild(headRow);
      // Same .chip/.chiprow classes the gallery cards use, so the preview
      // looks identical — glowing (chip-match) entries are new tags Confirm
      // is about to add, plain ones are already on the image.
      buildSequentialPanel(panel, entry, (tags) => {
        const fresh = new Set(tags.filter((t) => !entry.tags.includes(t)));
        previewHead.textContent = `Will apply on Confirm — ${tags.length} tags${fresh.size ? ` (${fresh.size} new)` : ''}`;
        previewChips.innerHTML = '';
        if (!tags.length){
          const none = document.createElement('span');
          none.style.cssText = 'font-size:12px; color:var(--text-faint);';
          none.textContent = 'No indicator tags selected — Confirm will assert none.';
          previewChips.appendChild(none);
          return;
        }
        for (const t of tags){
          const chip = document.createElement('span');
          // chip-static: same label-centering/read-only modifier the
          // transfer-list viewer uses — these chips have no × button, so
          // the base chip's ×-budgeted padding leaves text lopsided.
          chip.className = 'chip chip-static' + (fresh.has(t) ? ' chip-match' : '');
          const label = document.createElement('span');
          label.textContent = t;
          label.title = fresh.has(t) ? 'New — will be added on Confirm' : 'Already on this image';
          chip.appendChild(label);
          previewChips.appendChild(chip);
        }
      });
      wrap.appendChild(panel);
      singleViewEl.appendChild(wrap);
      return;
    }
  }
  const list = filteredEntries();
  if (singleIndex >= list.length) singleIndex = list.length - 1;
  if (singleIndex < 0) singleIndex = 0;

  renderSinglePos(list.length);
  singlePrevBtn.disabled = list.length === 0 || singleIndex <= 0;
  singleNextBtn.disabled = list.length === 0 || singleIndex >= list.length - 1;

  // Re-rendering the SAME image (a tag edit, Tag Sorting move, …) keeps the
  // scroll where it was; paging to another image starts at the top.
  const restoreScroll = list[singleIndex]?.base === lastSingleBase
    ? captureSingleScroll() : null;
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
  wrap.appendChild(buildSinglePreview(e));

  const panel = document.createElement('div');
  panel.className = 'single-panel single-panel-main';

  const nameEl = document.createElement('div');
  nameEl.className = 'single-name';
  nameEl.textContent = e.imgName + (e.width ? ` · ${e.width}×${e.height}` : '') + ` · ${e.tags.length} tags`;
  panel.appendChild(nameEl);

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
  const singleChipOnChange = () => { renderSingleView(); refreshRightPanels(); refreshStats(); };
  panel.appendChild(buildTagSortBar(e, singleChipOnChange));
  panel.appendChild(buildChipsBlock(e, singleTagIndex, singleChipOnChange));

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
  // Originals live in original_images/ and are a paired copy of a bucketed
  // image — the Bucket Images dock's Revert is what moves them back, so no
  // disable/restore button here.
  if (!e.original){
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
  }
  panel.appendChild(btnRow);

  wrap.appendChild(panel);
  singleViewEl.appendChild(wrap);
  if (restoreScroll) restoreScroll();
}

// Snapshot the Single-view panel's own scroll plus every scrolled ancestor
// (emptying singleViewEl clamps them to 0); returns a restorer to call once
// the new DOM is in place.
function captureSingleScroll(): () => void {
  const panelTop = singleViewEl.querySelector<HTMLElement>('.single-panel')?.scrollTop ?? 0;
  const ancestors: [HTMLElement, number][] = [];
  for (let el = singleViewEl.parentElement; el; el = el.parentElement){
    if (el.scrollTop) ancestors.push([el, el.scrollTop]);
  }
  return () => {
    const panel = singleViewEl.querySelector<HTMLElement>('.single-panel');
    if (panel) panel.scrollTop = panelTop;
    for (const [el, top] of ancestors) el.scrollTop = top;
  };
}

// ---------------- Chips + tag context menu ----------------

function computeIsolatedTagSet(tagIndex: TagIndex): Set<string> {
  const set = new Set<string>();
  for (const [tag, imgs] of tagIndex){
    if (imgs.size <= 2) set.add(tag);
  }
  return set;
}

// The bar above the chip block in Single mode and the card modal: the Tag
// Sorting toggle, plus (while sorting is on) the "+ Add subject" button.
function buildTagSortBar(entry: Entry, onChange: () => void): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'tagcat-bar';
  bar.appendChild(buildTagSortToggle(onChange));
  if (tagSortingActive) bar.appendChild(buildAddSubjectButton(entry, onChange));
  return bar;
}

// Toggle for "Tag Sorting"; clicking flips the persisted preference and re-renders.
function buildTagSortToggle(onToggle: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tagcat-toggle' + (tagSortingActive ? ' active' : '');
  btn.textContent = tagSortingActive ? '🏷 Tag sorting: on' : '🏷 Tag sorting';
  btn.title = tagSortingActive
    ? 'Stop grouping tags by category'
    : 'Group tags by prompt-field category (Character, Body, Face, Clothes, Limbs and Hands, Sexual, Pose, Scene, Effects, Other)';
  btn.addEventListener('click', () => {
    tagSortingActive = !tagSortingActive;
    setBool(TAG_SORTING_KEY, tagSortingActive);
    onToggle();
  });
  return btn;
}

// The chips block shared by Single mode and the card modal.
//  - Tag Sorting off  -> one flat chiprow.
//  - Tag Sorting on   -> category segments ("+ Add subject" lives in buildTagSortBar).
//  - Subjects present -> the multi-subject tree (subject headers with indented
//    category subheaders), where tags are assigned to a subject manually.
// Ordering within a segment follows orderedTagsForDisplay(), so search matches
// still float to the top of their own category.
function buildChipsBlock(entry: Entry, tagIndex: TagIndex, onChange: () => void): HTMLElement {
  const ordered = orderedTagsForDisplay(entry, tagIndex);
  if (!tagSortingActive){
    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    for (const tag of ordered) chiprow.appendChild(buildChip(entry, tag, onChange, tagIndex));
    return chiprow;
  }
  const subjects = entry.meta?.tagSubjects || [];
  if (subjects.length) return buildSubjectTree(entry, ordered, tagIndex, onChange);

  const wrap = document.createElement('div');
  wrap.className = 'tagcat-groups';
  for (const group of groupTagsByCategory(ordered)){
    const seg = document.createElement('div');
    seg.className = 'tagcat-seg';
    const head = document.createElement('div');
    head.className = 'tagcat-head';
    const name = document.createElement('span');
    name.className = 'tagcat-name';
    name.textContent = group.label;
    const count = document.createElement('span');
    count.className = 'tagcat-count';
    count.textContent = String(group.tags.length);
    head.appendChild(name);
    head.appendChild(count);
    seg.appendChild(head);
    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    for (const tag of group.tags) chiprow.appendChild(buildChip(entry, tag, onChange, tagIndex));
    seg.appendChild(chiprow);
    wrap.appendChild(seg);
  }
  return wrap;
}

// ---------------- Multi-subject tree (Tag Sorting) ----------------

function ensureEntryMeta(entry: Entry): EntryMeta {
  if (!entry.meta) entry.meta = {};
  return entry.meta;
}

function persistEntryMeta(entry: Entry): void {
  getEntryMeta()[entry.base] = ensureEntryMeta(entry);
  saveEntryMetaRef();
}

let subjectIdCounter = 1;
function nextSubjectId(): string {
  return 'subj-' + Date.now().toString(36) + '-' + (subjectIdCounter++).toString(36);
}

function buildAddSubjectButton(entry: Entry, onChange: () => void): HTMLElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tagsub-addsubject';
  btn.textContent = '＋ Add subject';
  btn.title = 'Split this image\'s tags into named subjects (e.g. Girl 1, Girl 2)';
  btn.addEventListener('click', () => {
    const meta = ensureEntryMeta(entry);
    const subjects = meta.tagSubjects || (meta.tagSubjects = []);
    subjects.push({ id: nextSubjectId(), name: `Subject ${subjects.length + 1}`, subheaders: [] });
    persistEntryMeta(entry);
    onChange();
  });
  return btn;
}

function assignTagsToSubject(entry: Entry, tags: Iterable<string>, subjectId: string): void {
  const meta = ensureEntryMeta(entry);
  const assign = meta.tagAssign || (meta.tagAssign = {});
  for (const t of tags) assign[t] = subjectId;
  persistEntryMeta(entry);
}

function buildSubjectTree(entry: Entry, ordered: string[], tagIndex: TagIndex, onChange: () => void): HTMLElement {
  const meta = ensureEntryMeta(entry);
  const subjects = meta.tagSubjects as TagSubject[];
  const assign = meta.tagAssign || (meta.tagAssign = {});
  if (subjectSelectionBase !== entry.base){ subjectSelectionBase = entry.base; subjectSelectedTags = new Set(); }

  const validIds = new Set(subjects.map((s) => s.id));
  const defaultId = subjects[0].id;
  const bySubject = new Map<string, Map<string, string[]>>();
  for (const tag of ordered){
    const sid = assign[tag] && validIds.has(assign[tag]) ? assign[tag] : defaultId;
    let cats = bySubject.get(sid);
    if (!cats){ cats = new Map(); bySubject.set(sid, cats); }
    const cat = categorizeTag(tag);
    const list = cats.get(cat);
    if (list) list.push(tag); else cats.set(cat, [tag]);
  }

  const root = document.createElement('div');
  root.className = 'tagsub-tree';
  if (subjectSelectedTags.size) root.appendChild(buildMoveToolbar(entry, subjects, onChange));
  for (const subject of subjects){
    root.appendChild(buildSubjectBlock(entry, subject, bySubject.get(subject.id), tagIndex, onChange));
  }
  return root;
}

function buildMoveToolbar(entry: Entry, subjects: TagSubject[], onChange: () => void): HTMLElement {
  const bar = document.createElement('div');
  bar.className = 'tagsub-movetoolbar';
  const count = document.createElement('span');
  count.className = 'tagsub-movecount';
  count.textContent = `${subjectSelectedTags.size} selected`;
  bar.appendChild(count);

  const flyout = document.createElement('div');
  flyout.className = 'tagsub-moveflyout';
  flyout.style.display = 'none';
  for (const s of subjects){
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s.name || '(unnamed)';
    b.addEventListener('click', () => {
      const tags = Array.from(subjectSelectedTags);
      subjectSelectedTags = new Set();
      assignTagsToSubject(entry, tags, s.id);
      onChange();
    });
    flyout.appendChild(b);
  }

  const moveBtn = document.createElement('button');
  moveBtn.type = 'button';
  moveBtn.className = 'tagsub-movebtn';
  moveBtn.textContent = 'Move tags to: ▾';
  moveBtn.addEventListener('click', () => { flyout.style.display = flyout.style.display === 'none' ? 'flex' : 'none'; });

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'tagsub-moveclear';
  clearBtn.textContent = 'Clear';
  clearBtn.addEventListener('click', () => { subjectSelectedTags = new Set(); onChange(); });

  bar.appendChild(moveBtn);
  bar.appendChild(flyout);
  bar.appendChild(clearBtn);
  return bar;
}

function buildSubjectBlock(entry: Entry, subject: TagSubject, cats: Map<string, string[]> | undefined, tagIndex: TagIndex, onChange: () => void): HTMLElement {
  const block = document.createElement('div');
  block.className = 'tagsub-subject';
  const dropHere = (ev: DragEvent): void => {
    ev.preventDefault();
    ev.stopPropagation();
    block.classList.remove('drop-hover');
    const payload = ev.dataTransfer?.getData('text/plain') || '';
    const tags = payload.split('\n').filter(Boolean);
    if (!tags.length) return;
    subjectSelectedTags = new Set();
    assignTagsToSubject(entry, tags, subject.id);
    onChange();
  };
  block.addEventListener('dragover', (ev) => { ev.preventDefault(); block.classList.add('drop-hover'); });
  block.addEventListener('dragleave', () => block.classList.remove('drop-hover'));
  block.addEventListener('drop', dropHere);

  const head = document.createElement('div');
  head.className = 'tagsub-subject-head';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'tagsub-name';
  nameInput.value = subject.name;
  nameInput.title = 'Name this subject (e.g. Girl 1)';
  nameInput.setAttribute('aria-label', 'Subject name');
  nameInput.addEventListener('keydown', (ev) => ev.stopPropagation());
  nameInput.addEventListener('input', () => { subject.name = nameInput.value; });
  nameInput.addEventListener('change', () => persistEntryMeta(entry));
  nameInput.addEventListener('blur', () => persistEntryMeta(entry));
  head.appendChild(nameInput);

  const actions = document.createElement('div');
  actions.className = 'tagsub-head-actions';
  const addSub = document.createElement('button');
  addSub.type = 'button';
  addSub.textContent = '＋ Subheader';
  addSub.title = 'Add a category subheader under this subject';
  addSub.addEventListener('click', (ev) => { ev.stopPropagation(); openSubheaderPicker(entry, subject, ev.clientX, ev.clientY, onChange); });
  actions.appendChild(addSub);
  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'tagsub-del';
  del.textContent = '✕';
  del.title = 'Remove this subject (its tags fall back to the first subject)';
  del.addEventListener('click', () => removeSubject(entry, subject.id, onChange));
  actions.appendChild(del);
  head.appendChild(actions);
  block.appendChild(head);

  const present = cats || new Map<string, string[]>();
  const catIds = new Set<string>([...present.keys(), ...subject.subheaders]);
  const orderedCats = TAG_CATEGORY_ORDER.filter((c) => catIds.has(c));
  if (!orderedCats.length){
    const empty = document.createElement('div');
    empty.className = 'tagsub-empty';
    empty.textContent = 'No tags here yet — drag chips onto this subject, or add a subheader.';
    block.appendChild(empty);
    return block;
  }
  for (const cat of orderedCats){
    const sub = document.createElement('div');
    sub.className = 'tagsub-sub';
    sub.addEventListener('dragover', (ev) => { ev.preventDefault(); });
    sub.addEventListener('drop', dropHere);
    const subHead = document.createElement('div');
    subHead.className = 'tagsub-sub-head';
    const catName = document.createElement('span');
    catName.className = 'tagsub-cat';
    catName.textContent = TAG_CATEGORY_LABELS[cat] || cat;
    const countEl = document.createElement('span');
    countEl.className = 'tagsub-count';
    const tags = present.get(cat) || [];
    countEl.textContent = String(tags.length);
    subHead.appendChild(catName);
    subHead.appendChild(countEl);
    sub.appendChild(subHead);

    const chiprow = document.createElement('div');
    chiprow.className = 'chiprow';
    if (!tags.length){
      const none = document.createElement('span');
      none.className = 'tagsub-empty';
      none.textContent = '—';
      chiprow.appendChild(none);
    }
    for (const tag of tags){
      const chip = buildChip(entry, tag, onChange, tagIndex);
      chip.classList.add('tagsub-chip');
      if (subjectSelectedTags.has(tag)) chip.classList.add('tagsub-selected');
      chip.draggable = true;
      chip.addEventListener('dragstart', (ev) => {
        const payload = subjectSelectedTags.has(tag) ? Array.from(subjectSelectedTags).join('\n') : tag;
        ev.dataTransfer?.setData('text/plain', payload);
        if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
      });
      // Capture phase so shift-click toggles selection instead of opening the
      // tag's context menu (buildChip's own click handler sits on the label).
      chip.addEventListener('click', (ev) => {
        if (!ev.shiftKey) return;
        ev.preventDefault();
        ev.stopPropagation();
        if (subjectSelectedTags.has(tag)) subjectSelectedTags.delete(tag);
        else subjectSelectedTags.add(tag);
        onChange();
      }, true);
      chiprow.appendChild(chip);
    }
    sub.appendChild(chiprow);
    block.appendChild(sub);
  }
  return block;
}

function openSubheaderPicker(entry: Entry, subject: TagSubject, x: number, y: number, onChange: () => void): void {
  document.querySelectorAll('.tagsub-picker').forEach((el) => el.remove());
  const menu = document.createElement('div');
  menu.className = 'ctx-menu tagsub-picker';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = 'Add subheader';
  menu.appendChild(header);
  let any = false;
  for (const cat of TAG_CATEGORY_ORDER){
    if (subject.subheaders.includes(cat)) continue;
    any = true;
    addContextMenuItem(menu, TAG_CATEGORY_LABELS[cat] || cat, () => {
      subject.subheaders.push(cat);
      persistEntryMeta(entry);
      menu.remove();
      onChange();
    });
  }
  if (!any){
    const none = document.createElement('div');
    none.className = 'ctx-item';
    none.textContent = 'All categories added';
    menu.appendChild(none);
  }
  document.body.appendChild(menu);
  positionMenu(menu, x, y);
  const onOutside = (ev: MouseEvent): void => {
    if (!menu.contains(ev.target as Node)){ menu.remove(); document.removeEventListener('click', onOutside, true); }
  };
  setTimeout(() => document.addEventListener('click', onOutside, true), 0);
}

function removeSubject(entry: Entry, subjectId: string, onChange: () => void): void {
  const meta = ensureEntryMeta(entry);
  const subjects = meta.tagSubjects || [];
  const idx = subjects.findIndex((s) => s.id === subjectId);
  if (idx === -1) return;
  subjects.splice(idx, 1);
  if (meta.tagAssign){
    for (const [tag, sid] of Object.entries(meta.tagAssign)) if (sid === subjectId) delete meta.tagAssign[tag];
  }
  if (!subjects.length){ meta.tagAssign = {}; subjectSelectedTags = new Set(); }
  persistEntryMeta(entry);
  onChange();
}

function orderedTagsForDisplay(entry: Entry, tagIndex: TagIndex): string[] {
  let tags = entry.tags.slice();
  const cardTagSortMode = getCardTagSortMode();
  if (cardTagSortMode === 'alphabetical'){
    tags.sort((a,b) => a.localeCompare(b));
  } else if (cardTagSortMode === 'frequency' && tagIndex){
    tags.sort((a,b) => (tagIndex.get(b) ? tagIndex.get(b)!.size : 0) - (tagIndex.get(a) ? tagIndex.get(a)!.size : 0));
  }

  const searchTerms = (getGalleryFilter().terms || []);
  const isolatedSet = (getIsolatedFlagActive() && tagIndex) ? computeIsolatedTagSet(tagIndex) : null;
  if (searchTerms.length || isolatedSet){
    const matched: string[] = [], isolated: string[] = [], rest: string[] = [];
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

function tagDisplayFlags(tag: string, tagIndex: TagIndex): { isMatch: boolean; isIsolated: boolean } {
  const searchTerms = (getGalleryFilter().terms || []);
  const lower = tag.toLowerCase();
  const isMatch = searchTerms.some(term => lower === term);
  const isIsolated = !!(getIsolatedFlagActive() && tagIndex && (tagIndex.get(tag) ? tagIndex.get(tag)!.size <= 2 : false));
  return { isMatch, isIsolated };
}

function buildChip(entry: Entry, tag: string, onChange: () => void, tagIndex: TagIndex | null): HTMLElement {
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
  let clickTimer: ReturnType<typeof setTimeout> | null = null;
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
function renameTagOnEntry(entry: Entry, oldTag: string, newTag: string): boolean {
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

function startInlineTagRename(chip: HTMLElement, label: HTMLElement, entry: Entry, tag: string, onChange: () => void): void {
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

let modalCloseTimer: ReturnType<typeof setTimeout> | null = null;
let modalLayerTimer: ReturnType<typeof setTimeout> | null = null;
let currentModalBase: string | null = null;

export function openImageCardModal(entry: Entry, opts?: { hover?: boolean }): void {
  const isHoverPreview = !!(opts && opts.hover);
  if (modalCloseTimer){ clearTimeout(modalCloseTimer); modalCloseTimer = null; }
  closeTagContextMenu();
  if (currentModalBase !== entry.base){
    modalZoom = 100; modalPanX = 0; modalPanY = 0;
    renderImageCardModal(entry);
    currentModalBase = entry.base;
  }
  imageCardModal.style.display = 'flex';
  // Swipe-mode slide-up: promote the modal card to its own compositor layer
  // ONLY for the transition (the CSS side declares the transform itself as
  // translate3d). This is the "will-change applied at start, reset at end"
  // discipline — a static rule would keep the large modal resident in GPU
  // memory even while nobody's looking. Reset uses --panel-dur's own value
  // plus the same tiny buffer the close path uses.
  imageCardModal.classList.add('modal-anim-layers');
  if (modalLayerTimer) clearTimeout(modalLayerTimer);
  modalLayerTimer = setTimeout(() => {
    modalLayerTimer = null;
    imageCardModal.classList.remove('modal-anim-layers');
  }, 240);
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

// ---------------- Pixel editing (rotate/crop, desktop modal) ----------------
// Pixel edits rewrite the image file in place: immediate disk writes like
// disable/restore (outside the dirty/save tag lifecycle), confirm-gated, and
// logged as their own undoable edit-log items (crop-image/rotate-image) —
// the before/after bytes live session-only in tags-edit.ts, so undo works
// until the folder is reloaded, while the log row itself persists like any
// other entry.
// PNG/JPG/WebP only — the re-encode keeps the same format; BMP/GIF have no
// canvas round-trip here.

function pixelEditMime(name: string): string | null {
  const lower = (name || '').toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return null;
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), mime, 0.95));
}

async function commitPixelEdit(entry: Entry, canvas: HTMLCanvasElement, mime: string, op: 'crop-image' | 'rotate-image', summary: string): Promise<boolean> {
  const blob = await canvasToBlob(canvas, mime);
  if (!blob) { toast('Could not encode the edited image.', 3600); return false; }
  let prevBytes: Uint8Array;
  try {
    prevBytes = new Uint8Array(await (await entry.imgHandle.getFile()).arrayBuffer());
  } catch (err) {
    toastError('Could not read the image', err);
    return false;
  }
  const prevW = entry.width || 0, prevH = entry.height || 0;
  const bytes = new Uint8Array(await blob.arrayBuffer());
  try {
    await writeBytes(entry.imgHandle, bytes);
  } catch (err) {
    toastError('Could not save the edited image', err);
    return false;
  }
  try { URL.revokeObjectURL(entry.objectUrl); } catch { /* best effort */ }
  entry.objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  entry.width = canvas.width;
  entry.height = canvas.height;
  recordPixelChange(op, summary, entry.base, {
    prev: prevBytes, next: bytes, prevW, prevH, nextW: canvas.width, nextH: canvas.height, mime
  });
  renderImageCardModal(entry);
  renderCurrentView();
  return true;
}

async function rotateEntryImage(entry: Entry, dir: 1 | -1): Promise<void> {
  const mime = pixelEditMime(entry.imgName || '');
  if (!mime) { toast('Rotation is supported for PNG, JPG, and WebP images.', 3600); return; }
  const ok = await showConfirmModal(
    `Rotate ${entry.imgName} 90° ${dir === 1 ? 'clockwise' : 'counter-clockwise'}? This rewrites the image file.`,
    { okLabel: 'Rotate', danger: true }
  );
  if (!ok) return;
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(await entry.imgHandle.getFile());
  } catch (err) {
    toastError('Could not read the image', err);
    return;
  }
  const canvas = document.createElement('canvas');
  canvas.width = bmp.height;
  canvas.height = bmp.width;
  const ctx = canvas.getContext('2d');
  if (!ctx) { bmp.close(); toast('Could not edit the image on this machine.', 3600); return; }
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((dir * Math.PI) / 2);
  ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
  bmp.close();
  if (await commitPixelEdit(entry, canvas, mime, 'rotate-image', `Rotated ${entry.imgName} 90° ${dir === 1 ? 'clockwise' : 'counter-clockwise'}`)) toast('Rotated. Undo is in the toolbar or Log.', 2600);
}

function startCropMode(entry: Entry, imgSide: HTMLElement, img: HTMLImageElement, editRow: HTMLElement, zoomRow: HTMLElement): void {
  const mime = pixelEditMime(entry.imgName || '');
  if (!mime) { toast('Cropping is supported for PNG, JPG, and WebP images.', 3600); return; }
  // Crop math maps overlay pixels straight onto natural pixels, so any modal
  // zoom/pan resets first — and the zoom row hides for the duration, since
  // dragging it mid-crop would silently shift the kept region.
  modalZoom = 100; modalPanX = 0; modalPanY = 0;
  img.style.transform = '';
  editRow.style.display = 'none';
  zoomRow.style.display = 'none';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:absolute; inset:0; cursor:crosshair; touch-action:none; z-index:5;';
  const sel = document.createElement('div');
  sel.style.cssText = 'position:absolute; display:none; border:2px solid #7c6bff; box-shadow:0 0 0 9999px rgba(0,0,0,0.55); cursor:move;';
  const grip = document.createElement('div');
  grip.style.cssText = 'position:absolute; right:-7px; bottom:-7px; width:14px; height:14px; background:#7c6bff; border-radius:50%; cursor:nwse-resize;';
  sel.appendChild(grip);
  overlay.appendChild(sel);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute; left:8px; bottom:8px; display:flex; gap:8px;';
  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply crop';
  const isolateBtn = document.createElement('button');
  isolateBtn.textContent = 'Isolate';
  isolateBtn.title = 'Save the selected region as a new image in this dataset (source untouched)';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  bar.appendChild(applyBtn);
  bar.appendChild(isolateBtn);
  bar.appendChild(cancelBtn);
  overlay.appendChild(bar);
  imgSide.appendChild(overlay);

  // Selection in img-local display px (unzoomed — see the reset above).
  let mode: 'idle' | 'draw' | 'move' | 'resize' = 'idle';
  let startX = 0, startY = 0;
  let selStart = { x: 0, y: 0, w: 0, h: 0 };
  let sx = 0, sy = 0, sw = 0, sh = 0;

  function paintSel(): void {
    const r = img.getBoundingClientRect(), s = imgSide.getBoundingClientRect();
    if (sw < 2 || sh < 2) { sel.style.display = 'none'; return; }
    sel.style.display = 'block';
    sel.style.left = (r.left - s.left + sx) + 'px';
    sel.style.top = (r.top - s.top + sy) + 'px';
    sel.style.width = sw + 'px';
    sel.style.height = sh + 'px';
  }
  function toLocal(ev: PointerEvent): { x: number; y: number } {
    const r = img.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(r.width, ev.clientX - r.left)),
      y: Math.max(0, Math.min(r.height, ev.clientY - r.top))
    };
  }
  function cleanup(): void {
    overlay.remove();
    editRow.style.display = '';
    zoomRow.style.display = '';
  }
  async function renderCropCanvas(): Promise<{ canvas: HTMLCanvasElement; nw: number; nh: number; mime: string } | null> {
    const r = img.getBoundingClientRect();
    if (sw < 8 || sh < 8 || !r.width || !r.height) { toast('Draw a region first.', 2600); return null; }
    const kx = img.naturalWidth / r.width, ky = img.naturalHeight / r.height;
    const nx = Math.round(sx * kx), ny = Math.round(sy * ky);
    const nw = Math.round(sw * kx), nh = Math.round(sh * ky);
    let bmp: ImageBitmap;
    try {
      bmp = await createImageBitmap(await entry.imgHandle.getFile());
    } catch (err) {
      toastError('Could not read the image', err);
      return null;
    }
    const canvas = document.createElement('canvas');
    canvas.width = nw;
    canvas.height = nh;
    const ctx = canvas.getContext('2d');
    if (!ctx) { bmp.close(); toast('Could not edit the image on this machine.', 3600); return null; }
    ctx.drawImage(bmp, nx, ny, nw, nh, 0, 0, nw, nh);
    bmp.close();
    const mt = pixelEditMime(entry.imgName || '');
    if (!mt) { toast('Cropping is supported for PNG, JPG, and WebP images.', 3600); return null; }
    return { canvas, nw, nh, mime: mt };
  }
  async function applyCrop(): Promise<void> {
    const rendered = await renderCropCanvas();
    if (!rendered) return;
    cleanup();
    if (await commitPixelEdit(entry, rendered.canvas, rendered.mime, 'crop-image', `Cropped ${entry.imgName} to ${rendered.nw}×${rendered.nh}`)) toast('Cropped. Undo is in the toolbar or Log.', 2600);
  }
  async function isolateSelection(): Promise<void> {
    const dir = getDirHandleRef();
    if (!dir) { toast('Open a dataset folder first.', 2600); return; }
    const rendered = await renderCropCanvas();
    if (!rendered) return;
    const blob = await canvasToBlob(rendered.canvas, rendered.mime);
    if (!blob) { toast('Could not encode the edited image.', 3600); return; }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const dot = (entry.imgName || '').lastIndexOf('.');
    const ext = dot >= 0 ? (entry.imgName || '').slice(dot) : '.png';
    let base = '', imgName = '';
    for (let n = 1; ; n++) {
      base = `${entry.base}_isolate${n}`;
      imgName = `${base}${ext}`;
      try {
        await dir.getFileHandle(imgName);
      } catch {
        break; // missing → free to use
      }
    }
    const tags = (entry.tags || []).slice();
    try {
      const imgHandle = await dir.getFileHandle(imgName, { create: true });
      await writeBytes(imgHandle, bytes);
      const txtHandle = await dir.getFileHandle(`${base}.txt`, { create: true });
      await writeBytes(txtHandle, tags.map((t) => t.replace(/ /g, '_')).join(','));
      const created = await addEntryFromNewFileRef(base, imgHandle, imgName, txtHandle, true, tags, false);
      if (created) markDirty(created);
    } catch (err) {
      toastError('Could not save the isolated image', err);
      return;
    }
    recordIsolateChange(`Isolated region of ${entry.imgName} as ${imgName}`, base, {
      bytes, mime: rendered.mime, tags, imgName, width: rendered.nw, height: rendered.nh
    });
    cleanup();
    renderCurrentView();
    toast(`Isolated as ${imgName}. Undo is in the toolbar or Log.`, 2600);
  }
  overlay.addEventListener('pointerdown', (ev) => {
    // Stop here FIRST, before the button check below: without this, the press
    // bubbles to imgSide's own pan handler, which pointer-captures to imgSide
    // and steals the subsequent click — Apply/Cancel/Isolate silently die.
    ev.stopPropagation();
    if ((ev.target as HTMLElement).closest('button')) return;
    ev.preventDefault();
    try { overlay.setPointerCapture(ev.pointerId); } catch { /* best effort */ }
    const p = toLocal(ev);
    const onGrip = ev.target === grip;
    const inside = sw > 2 && sh > 2 && p.x >= sx && p.x <= sx + sw && p.y >= sy && p.y <= sy + sh;
    mode = onGrip ? 'resize' : inside ? 'move' : 'draw';
    startX = p.x;
    startY = p.y;
    selStart = { x: sx, y: sy, w: sw, h: sh };
    if (mode === 'draw') { sx = p.x; sy = p.y; sw = 0; sh = 0; }
  });
  overlay.addEventListener('pointermove', (ev) => {
    if (mode === 'idle') return;
    ev.stopPropagation();
    const p = toLocal(ev);
    const r = img.getBoundingClientRect();
    if (mode === 'draw') {
      sx = Math.min(startX, p.x);
      sy = Math.min(startY, p.y);
      sw = Math.abs(p.x - startX);
      sh = Math.abs(p.y - startY);
    } else if (mode === 'move') {
      sx = Math.max(0, Math.min(r.width - selStart.w, selStart.x + (p.x - startX)));
      sy = Math.max(0, Math.min(r.height - selStart.h, selStart.y + (p.y - startY)));
      sw = selStart.w;
      sh = selStart.h;
    } else {
      sw = Math.max(0, Math.min(r.width - selStart.x, p.x - selStart.x));
      sh = Math.max(0, Math.min(r.height - selStart.y, p.y - selStart.y));
    }
    paintSel();
  });
  function endGesture(ev: PointerEvent): void {
    if (mode === 'idle') return;
    mode = 'idle';
    try { overlay.releasePointerCapture(ev.pointerId); } catch { /* best effort */ }
  }
  overlay.addEventListener('pointerup', endGesture);
  overlay.addEventListener('pointercancel', endGesture);
  overlay.addEventListener('wheel', (ev) => ev.stopPropagation(), { passive: true });
  cancelBtn.addEventListener('click', (ev) => { ev.stopPropagation(); cleanup(); });
  applyBtn.addEventListener('click', (ev) => { ev.stopPropagation(); void applyCrop(); });
  isolateBtn.addEventListener('click', (ev) => { ev.stopPropagation(); void isolateSelection(); });
}

function renderImageCardModal(entry: Entry): void {
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

  const isTouchDevice = document.documentElement.classList.contains('touch-device');
  if (isTouchDevice){
    // Mobile: the inline pan/zoom below needs real screen space to be
    // usable, which this modal's ~30%-height image strip doesn't have
    // (styles.css). Tapping the image instead brings it up full-foreground
    // in the same zoomable lightbox every other "expand image" entry point
    // in the app uses (showImageLightbox, shared-ui.ts — now pointer-event/
    // pinch-zoom capable, not mouse-only) — tapping outside the image
    // there returns to this modal.
    imgSide.style.cursor = 'zoom-in';
    imgSide.addEventListener('click', () => showImageLightbox(entry.objectUrl));
  } else {
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
  }

  const panel = document.createElement('div');
  panel.className = 'single-panel';
  panel.style.position = 'relative';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close-btn ghost-close';
  closeBtn.textContent = '✕ Close';
  closeBtn.addEventListener('click', closeImageCardModal);
  panel.appendChild(closeBtn);

  const nameText = entry.imgName + (entry.width ? ` · ${entry.width}×${entry.height}` : '') + ` · ${entry.tags.length} tags`;

  // Mobile only: a long filename/resolution string here would overlap
  // modal-close-btn (absolutely positioned at top-right — text doesn't
  // wrap around an absolutely positioned sibling on its own). Rather than
  // fighting for clearance with padding, the info moves behind an ⓘ
  // button on the opposite side of the panel from Close, shown via the
  // same showInfoModal() every dock's header ⓘ already uses. Desktop keeps
  // the plain inline text (CSS hides one or the other per breakpoint).
  const infoBtn = document.createElement('button');
  infoBtn.className = 'modal-info-btn ghost-close';
  infoBtn.textContent = 'ⓘ';
  infoBtn.title = 'Image info';
  infoBtn.addEventListener('click', () => showInfoModal(`<p>${escapeHtml(nameText)}</p>`, 'Image info'));
  panel.appendChild(infoBtn);

  const nameEl = document.createElement('div');
  nameEl.className = 'single-name';
  nameEl.textContent = nameText;
  panel.appendChild(nameEl);

  // Censored/Has-text/Perspective, spelled out directly in the modal rather
  // than behind the 3-dot context menu's "ⓘ Status details" item — that
  // path cost a tap into the menu AND a tap on the item just to see
  // something worth showing the moment the card opens. The context-menu
  // entry stays too (openImageOptionsMenu, below) for whoever reaches it
  // from the grid without opening this modal at all.
  const statusRow = document.createElement('div');
  statusRow.className = 'modal-status-row';
  for (const { emoji, state, label, matchedTags } of getEntryStatusIndicators(entry)){
    const stateText = state === null ? 'Not indicated' : (state ? 'Yes' : 'No');
    const badge = document.createElement('span');
    badge.className = 'modal-status-badge';
    badge.textContent = `${emoji} ${label}: ${stateText}`;
    badge.title = matchedTags.length ? matchedTags.join(', ') : '';
    statusRow.appendChild(badge);
  }
  panel.appendChild(statusRow);

  // Prev/Next through the same filtered list Single view's own nav uses —
  // added here (not just Single view) since mobile drops Single view
  // entirely (its own tag-editing side panel duplicated what this modal
  // already does) in favor of always editing through this modal instead;
  // these buttons are what replace Single view's own prev/next for that
  // case. Harmless/useful on desktop too — previously the only way to move
  // to another image without closing this modal was none at all.
  const modalNavList = filteredEntries();
  const modalNavIdx = modalNavList.findIndex(x => x.base === entry.base);
  if (modalNavList.length > 1 && modalNavIdx !== -1){
    const navRow = document.createElement('div');
    navRow.className = 'modal-card-nav';
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '‹ Prev';
    prevBtn.disabled = modalNavIdx <= 0;
    prevBtn.addEventListener('click', () => openImageCardModal(modalNavList[modalNavIdx - 1]));
    const posEl = document.createElement('span');
    posEl.className = 'single-pos';
    posEl.textContent = `${modalNavIdx + 1} / ${modalNavList.length}`;
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next ›';
    nextBtn.disabled = modalNavIdx >= modalNavList.length - 1;
    nextBtn.addEventListener('click', () => openImageCardModal(modalNavList[modalNavIdx + 1]));
    navRow.appendChild(prevBtn);
    navRow.appendChild(posEl);
    navRow.appendChild(nextBtn);
    panel.appendChild(navRow);
  }

  const zoomRow = document.createElement('div');
  zoomRow.className = 'modal-zoom-row';
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

  // Desktop-only pixel editing (rotate/crop) — the touch modal redirects
  // image taps to the fullscreen lightbox instead (see above), so these
  // controls live here only, next to the zoom row they compose with.
  if (!isTouchDevice){
    const editRow = document.createElement('div');
    editRow.className = 'modal-edit-row';
    editRow.style.cssText = 'display:flex; gap:8px; align-items:center;';
    const rotLeftBtn = document.createElement('button');
    rotLeftBtn.textContent = '⟲ Rotate';
    rotLeftBtn.title = 'Rotate 90° counter-clockwise (rewrites the file)';
    rotLeftBtn.addEventListener('click', () => { void rotateEntryImage(entry, -1); });
    const rotRightBtn = document.createElement('button');
    rotRightBtn.textContent = '⟳ Rotate';
    rotRightBtn.title = 'Rotate 90° clockwise (rewrites the file)';
    rotRightBtn.addEventListener('click', () => { void rotateEntryImage(entry, 1); });
    const cropBtn = document.createElement('button');
    cropBtn.textContent = '✂ Crop';
    cropBtn.title = 'Select a region to keep (rewrites the file)';
    cropBtn.addEventListener('click', () => startCropMode(entry, imgSide, img, editRow, zoomRow));
    editRow.appendChild(rotLeftBtn);
    editRow.appendChild(rotRightBtn);
    editRow.appendChild(cropBtn);
    panel.appendChild(editRow);
  }

  // Input comes BEFORE the chip list now (not after) — direct feedback:
  // with tag editing moved into this modal as the primary way to edit tags
  // on mobile, having to scroll past a potentially-long chip list just to
  // reach the input every time was the wrong default. Same order on
  // desktop too rather than forking the layout — reaching the input
  // immediately isn't worse there either.
  const modalTagIndex = buildTagIndex();
  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.className = 'addtag-input';
  addInput.placeholder = '+ Add tag, press Enter';
  // The grid card behind this modal was already fully built (its chips are
  // plain rendered text, not live-bound to `entry.tags`) before this modal
  // ever opened — mutating entry.tags here doesn't touch that DOM on its
  // own. Every one of this modal's own tag-mutation callbacks needs its own
  // renderCurrentView() to keep that card in sync, same as buildCard()'s
  // own chip-removal callback already does for itself; previously nothing
  // here called it at all, so the card only ever caught up once autosave
  // (or a manual Save) triggered its own unrelated re-render.
  addInput.addEventListener('keydown', ev => {
    if (ev.key === 'Enter' && addInput.value.trim()){
      addTagToEntry(entry, addInput.value.trim());
      addInput.value = '';
      closeAutocomplete();
      renderImageCardModal(entry);
      renderCurrentView();
      refreshRightPanels();
    }
  });
  attachTagAutocomplete(addInput, () => entry, () => { renderImageCardModal(entry); renderCurrentView(); });
  panel.appendChild(addInput);

  const modalChipOnChange = () => { renderImageCardModal(entry); renderCurrentView(); refreshRightPanels(); refreshStats(); };
  panel.appendChild(buildTagSortBar(entry, modalChipOnChange));
  panel.appendChild(buildChipsBlock(entry, modalTagIndex, modalChipOnChange));

  modalCardInner.appendChild(imgSide);
  modalCardInner.appendChild(panel);
}

function tokenizeTag(tag: string): string[] {
  const parts = tag.split(/[\s_\-]+/).map(p => p.trim()).filter(Boolean);
  const uniq = Array.from(new Set(parts));
  return uniq.length > 1 ? uniq : [];
}

function openTagContextMenu(entry: Entry, tag: string, x: number, y: number): void {
  closeTagContextMenu();
  const index = buildTagIndex();
  const set = index.get(tag) || new Set();

  const menu = document.createElement('div');
  menu.className = 'ctx-menu';

  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = `${tag} · ${set.size} image${set.size===1?'':'s'}`;
  menu.appendChild(header);

  addContextMenuItem(menu, 'Show all images WITH this tag', () => {
    setContainsFilter(tag);
    closeTagContextMenu();
  });
  addContextMenuItem(menu, 'Show all images WITHOUT this tag', () => {
    setExcludesFilter(tag);
    closeTagContextMenu();
  });
  addContextMenuItem(menu, '📖 Tag Details', () => {
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
    addContextMenuItem(menu, flagged ? '🚩 Unflag this tag on this image' : '🚩 Flag this tag for review (this image)', () => {
      if (!entry.meta) entry.meta = {};
      if (!entry.meta.flaggedTags) entry.meta.flaggedTags = [];
      if (flagged) entry.meta.flaggedTags = entry.meta.flaggedTags.filter((t: string) => t !== tag);
      else entry.meta.flaggedTags.push(tag);
      getEntryMeta()[entry.base] = entry.meta;
      saveEntryMetaRef();
      closeTagContextMenu();
      renderCurrentView();
      // Keep the left panel's flagged-for-review list live if it's open.
      refreshStats();
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

function onDocClickCloseMenu(ev: MouseEvent): void {
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

function getForeignLangTags(entry: Entry): string[] {
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
function getEntryStatusIndicators(e: Entry): { emoji: string; state: boolean | null; label: string; matchedTags: string[] }[] {
  const uncensoredTags = e.tags.filter(t => /uncensor/i.test(t));
  const censoredTags = e.tags.filter(t => /censor/i.test(t) && !/uncensor/i.test(t));
  const censored = censoredTags.length ? true : (uncensoredTags.length ? false : null);
  const textTags = e.tags.includes('text') ? ['text', ...getForeignLangTags(e)] : getForeignLangTags(e);
  const hasText = textTags.length > 0;
  // No "unspecified perspective" tag exists to assert a negative here
  // either, and unlike Censored there isn't even a plausible opposite tag
  // to infer one from — so this indicator never shows a red X, only a
  // check (a camera angle was called out) or "not indicated" (it wasn't).
  const perspectiveTags = e.tags.filter(t => t === 'from front' || t === 'from side' || t === 'from below' || t === 'from above' || t === 'from behind');
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
function buildMergeVoidBadgesEl(e: Entry): HTMLElement | null {
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

function buildStatusIconsEl(e: Entry): HTMLElement {
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
  setJSON('dts-common-languages', commonLanguages);
}
(function loadCommonLanguages(){
  const saved = getJSON<string[] | null>('dts-common-languages', null);
  if (Array.isArray(saved) && saved.length) commonLanguages = saved;
})();

const FLAG_COLORS = ['#e8a33d', '#e2637a', '#6fb8d1', '#7fbf8f', '#a683e0'];
const KOMA_OPTIONS = ['1koma', '2koma', '3koma', '4koma'];

function openNoteEditor(entry: Entry): void {
  if (!entry.meta) entry.meta = {};
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
  noteArea.value = entry.meta!.note || '';
  menu.appendChild(noteArea);

  const visRow = document.createElement('label');
  visRow.className = 'ach-toggle-row';
  visRow.style.padding = '6px 8px';
  const visCb = document.createElement('input');
  visCb.type = 'checkbox';
  visCb.checked = !!entry.meta!.noteAlwaysVisible;
  visRow.appendChild(visCb);
  visRow.appendChild(document.createTextNode(' Always show on card'));
  menu.appendChild(visRow);

  addContextMenuItem(menu, 'Save note', () => {
    const wasEmpty = !entry.meta!.note;
    entry.meta!.note = noteArea.value;
    entry.meta!.noteAlwaysVisible = visCb.checked;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    if (wasEmpty && noteArea.value.trim()){
      folderStats.notes_written = (folderStats.notes_written || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
    toast('Note saved.');
    closeTagContextMenu();
    renderCurrentView();
  }, { className: 'primary' });

  document.body.appendChild(menu);
  ctxMenuEl = menu;
  positionMenu(menu, window.innerWidth/2 - 140, window.innerHeight/2 - 100);
  setTimeout(() => document.addEventListener('click', onDocClickCloseMenu), 0);
}

function openImageOptionsMenu(entry: Entry, x: number, y: number): void {
  if (!entry.meta) entry.meta = {};
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
  addContextMenuItem(menu, '🐍 WD14 Tag', () => {
    closeTagContextMenu();
    tagSingleImageWithWd14(entry);
  }, { title: 'Tag this image with WD14 (via ComfyUI)' });

  addContextMenuItem(menu, '▶ Sequential from here', () => {
    closeTagContextMenu();
    const list = filteredEntries();
    let startIdx = list.findIndex((e) => e.base === entry.base);
    // A Disabled image isn't in filteredEntries() — sequential walks the
    // active gallery, so fall back to the top rather than silently doing
    // nothing from an unexpected context.
    if (startIdx < 0){ toast('Sequential walks the current filter — this image is outside it (e.g. Disabled).'); return; }
    seqQueue = list;
    seqIdx = startIdx;
    seqActive = true;
    seqPanelForcedCollapse = !getRightPanelCollapsedRef();
    setRightPanelCollapsedRef(true);
    switchView('single');
  }, { title: 'Enter sequential mode starting at this image (walks the current filter image by image)' });

  // Originals are managed by the Bucket Images dock's Revert, not Disable.
  if (!entry.original){
    addContextMenuItem(menu, entry.disabled ? '↩ Restore' : '🗑 Disable', async () => {
      await moveEntry(entry, !entry.disabled);
      // The image this menu belongs to just moved out of whatever view it was
      // opened from (active <-> Disabled) — leaving the menu open no longer
      // makes sense once the thing it's about is gone from view.
      closeTagContextMenu();
    }, { title: entry.disabled ? 'Restore this image to the dataset root' : 'Move this image to /Disabled' });
  }

  // Unlike Disable above (relocates into Disabled/, fully restorable), this
  // deletes the image + its .txt from disk outright and drops the entry
  // from memory — no undo, nothing left to restore from. Gated behind its
  // own confirm modal (danger-styled) since a single click here is
  // otherwise indistinguishable from Disable in the menu's own layout.
  addContextMenuItem(menu, '❌ Delete permanently', async () => {
    closeTagContextMenu();
    const ok = await showConfirmModal(
      `Permanently delete "${entry.imgName}" and its tags? This cannot be undone — the files are removed from disk, not moved to Disabled/.`,
      { okLabel: 'Delete permanently', danger: true }
    );
    if (!ok) return;
    await deleteEntryPermanentlyRef(entry);
  }, { title: 'Permanently delete this image and its tags from disk — cannot be undone', className: 'ctx-item-danger' });

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
  noneBtn.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = ''; Array.from(komaRow.children).forEach(b=>(b as HTMLElement).style.fontWeight='400'); noneBtn.style.fontWeight='700'; syncTextPanelTags(); });
  komaRow.appendChild(noneBtn);
  for (const k of KOMA_OPTIONS){
    const b = document.createElement('button');
    b.textContent = k;
    b.style.fontWeight = draft.koma === k ? '700' : '400';
    b.addEventListener('click', (ev) => { ev.stopPropagation(); draft.koma = k; Array.from(komaRow.children).forEach(x=>(x as HTMLElement).style.fontWeight='400'); b.style.fontWeight='700'; syncTextPanelTags(); });
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

  // Merge Immunize / Antivoid — a PERMANENT per-image exception to the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts), unlike
  // Lock (below) which only skips mass/automatic tools in general. These
  // stay in effect 24/7 regardless of what mass tool (if any) touches the
  // image. "Antimmunize" is a convenience shortcut toggling both together,
  // not a third independent flag. Icons: 🚫 for Merge Immunize (blocking a
  // merge from applying reads like a "no entry" sign), 🟢 for Antivoid (a
  // safe/protected green, deliberately not reusing void's own danger-red
  // styling), ✋ for Antimmunize (an open hand — "stop, both ways").
  const sepAntimmunize = document.createElement('div');
  sepAntimmunize.className = 'ctx-sep';
  sepAntimmunize.textContent = 'Antimmunize options';
  menu.appendChild(sepAntimmunize);

  function mergeImmuneLabel(){ return entry.meta!.mergeImmune ? '🚫 Un-Merge-Immunize' : '🚫 Merge Immunize'; }
  function antivoidLabel(){ return entry.meta!.antivoid ? '🟢 Un-Antivoid' : '🟢 Antivoid'; }
  function antimmunizeLabel(){ return (entry.meta!.mergeImmune && entry.meta!.antivoid) ? '✋ Un-Antimmunize' : '✋ Antimmunize'; }

  const toggleMergeImmuneBtn = addContextMenuItem(menu, mergeImmuneLabel(), () => {
    entry.meta!.mergeImmune = !entry.meta!.mergeImmune;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  }, { title: 'Merge rules will never rewrite this image\'s tags' });

  const toggleAntivoidBtn = addContextMenuItem(menu, antivoidLabel(), () => {
    entry.meta!.antivoid = !entry.meta!.antivoid;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    toggleAntivoidBtn.textContent = antivoidLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  }, { title: 'Void rules will never remove tags from this image' });

  const toggleAntimmunizeBtn = addContextMenuItem(menu, antimmunizeLabel(), () => {
    const bothOn = entry.meta!.mergeImmune && entry.meta!.antivoid;
    entry.meta!.mergeImmune = !bothOn;
    entry.meta!.antivoid = !bothOn;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    toggleMergeImmuneBtn.textContent = mergeImmuneLabel();
    toggleAntivoidBtn.textContent = antivoidLabel();
    toggleAntimmunizeBtn.textContent = antimmunizeLabel();
    renderCurrentView();
  }, { title: 'Shortcut for toggling Merge Immunize and Antivoid together' });

  // Removes every tag on this image in one click — unlike the chip list's
  // own × buttons (one click per tag), this is the bulk equivalent, gated
  // behind a confirm since it's otherwise a single misclick away from
  // wiping an image's whole tag set. Grouped next to Reset edits below —
  // both are whole-image tag-state actions.
  addContextMenuItem(menu, '🗑️ Remove all tags', async () => {
    if (entry.tags.length === 0){ toast('This image has no tags to remove.'); return; }
    const ok = await showConfirmModal(
      `Remove all ${entry.tags.length} tag(s) from "${entry.imgName}"?`,
      { okLabel: 'Remove all tags', danger: true }
    );
    if (!ok) return;
    removeAllTagsFromEntry(entry);
    header.textContent = `${entry.imgName} · ${entry.tags.length} tag${entry.tags.length===1?'':'s'}`;
    renderCurrentView();
  }, { title: 'Remove every tag from this image at once', className: 'ctx-item-danger' });

  addContextMenuItem(menu, '⏮ Reset edits', () => resetImageEdits(entry), { title: 'Reset this image to its earliest known tag state' });

  // Censored/Has-text/Perspective — the same 3 quick-glance badges the
  // card itself shows (buildStatusIconsEl above), just spelled out with
  // which tags matched. Exists here specifically because mobile's badges
  // aren't hoverable — a long-press/tap can't show a native `title`
  // tooltip the way a mouse hover does on desktop.
  addContextMenuItem(menu, 'ⓘ Status details', () => {
    closeTagContextMenu();
    const rows = getEntryStatusIndicators(entry).map(({ emoji, state, label, matchedTags }) => {
      const stateText = state === null ? 'Not indicated' : (state ? 'Yes' : 'No');
      const matched = matchedTags.length ? ` — ${matchedTags.map(escapeHtml).join(', ')}` : '';
      return `<p>${emoji} <b>${label}:</b> ${stateText}${matched}</p>`;
    }).join('');
    showInfoModal(rows, 'Image status');
  });

  // Locked images are skipped by every mass/automatic tool (Quick Merge,
  // Master Tags, bulk WD14, retroactive catch-up, etc.) — manual per-image
  // actions like this menu's own items are unaffected, since a lock is
  // about protecting an image from being swept up by something the user
  // didn't specifically aim at it.
  function lockLabel(){ return entry.meta!.locked ? '🔓 Unlock' : '🔒 Lock'; }
  const toggleLockBtn = addContextMenuItem(menu, lockLabel(), () => {
    entry.meta!.locked = !entry.meta!.locked;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    toggleLockBtn.textContent = lockLabel();
    renderCurrentView();
  }, { title: 'Skip mass tools (Quick Merge, Master Tags, bulk WD14, etc.) for this image' });

  // --- Review flag (limited palette) ---
  const sep2 = document.createElement('div');
  sep2.className = 'ctx-sep';
  sep2.textContent = 'Flag for review';
  menu.appendChild(sep2);
  const flagRow = document.createElement('div');
  flagRow.style.cssText = 'display:flex; gap:6px; padding:4px 8px 8px; align-items:center; flex-wrap:wrap;';
  const swatchEls: HTMLButtonElement[] = [];
  for (const color of FLAG_COLORS){
    const sw = document.createElement('button');
    sw.style.cssText = `width:22px; height:22px; border-radius:5px; padding:0; background:${color}; border:2px solid ${entry.meta!.reviewColor === color ? 'var(--text-primary)' : 'transparent'};`;
    sw.addEventListener('click', (ev) => {
      ev.stopPropagation();
      entry.meta!.reviewColor = color;
      getEntryMeta()[entry.base] = entry.meta!;
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
    entry.meta!.reviewColor = undefined;
    getEntryMeta()[entry.base] = entry.meta!;
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
  blurCb.checked = !!entry.meta!.blurred;
  blurCb.addEventListener('change', () => {
    entry.meta!.blurred = blurCb.checked;
    getEntryMeta()[entry.base] = entry.meta!;
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
  noteArea.value = entry.meta!.note || '';
  menu.appendChild(noteArea);

  const visRow = document.createElement('label');
  visRow.className = 'ach-toggle-row';
  visRow.style.padding = '6px 8px';
  const visCb = document.createElement('input');
  visCb.type = 'checkbox';
  visCb.checked = !!entry.meta!.noteAlwaysVisible;
  visRow.appendChild(visCb);
  visRow.appendChild(document.createTextNode(' Always show on card'));
  menu.appendChild(visRow);

  addContextMenuItem(menu, 'Save note', () => {
    const wasEmpty = !entry.meta!.note;
    entry.meta!.note = noteArea.value;
    entry.meta!.noteAlwaysVisible = visCb.checked;
    getEntryMeta()[entry.base] = entry.meta!;
    saveEntryMetaRef();
    if (wasEmpty && noteArea.value.trim()){
      folderStats.notes_written = (folderStats.notes_written || 0) + 1;
      saveFolderStats();
      checkAchievements();
    }
    toast('Note saved.');
    closeTagContextMenu();
    renderCurrentView();
  }, { className: 'primary' });

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
let setContainsFilterRef: (tag: string) => void = () => {};
let setExcludesFilterRef: (tag: string) => void = () => {};
function setContainsFilter(tag: string): void { setContainsFilterRef(tag); }
function setExcludesFilter(tag: string): void { setExcludesFilterRef(tag); }
let deleteEntryPermanentlyRef: (entry: Entry) => Promise<void> = async () => {};
let setRightPanelCollapsedRef: (collapsed: boolean) => void = () => {};
let getRightPanelCollapsedRef: () => boolean = () => false;
let getHideTagsRef: () => boolean = () => false;
let seqPanelForcedCollapse = false;

interface ViewDeps {
  getEntries: () => Entry[];
  getEntryByBase: (base: string) => Entry | undefined;
  getDirHandle: () => DirHandle | null;
  addEntryFromNewFile: (base: string, imgHandle: FileHandle, imgName: string, txtHandle: FileHandle | null, txtExisted: boolean, tags: string[], disabled: boolean) => Promise<Entry | null>;
  getMasterTagModeActive: () => boolean;
  getCardTagSortMode: () => CardTagSortMode;
  getGalleryFilter: () => GalleryFilter;
  getIsolatedFlagActive: () => boolean;
  getShowTagCountBadges: () => boolean;
  getEntryMeta: () => Record<string, EntryMeta>;
  saveEntryMeta: () => void;
  refreshAllUI: () => void;
  setContainsFilter: (tag: string) => void;
  setExcludesFilter: (tag: string) => void;
  deleteEntryPermanently: (entry: Entry) => Promise<void>;
  // Sequential mode auto-manages the right sidebar: collapse it while the
  // sequential panel is up (frees the width for the image+controls), restore
  // on exit. Injected since #right's own collapse state lives in index.ts.
  setRightPanelCollapsed: (collapsed: boolean) => void;
  getRightPanelCollapsed: () => boolean;
  // Hide-tags toolbar mode (buildCard/buildCompactCard skip chips + input).
  getHideTags: () => boolean;
}

export function initView(deps: ViewDeps): void {
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getDirHandleRef = deps.getDirHandle;
  addEntryFromNewFileRef = deps.addEntryFromNewFile;
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
  setRightPanelCollapsedRef = deps.setRightPanelCollapsed;
  getRightPanelCollapsedRef = deps.getRightPanelCollapsed;
  getHideTagsRef = deps.getHideTags;

  langAutoSelectToggle.addEventListener('change', () => {
    autoSelectNewLanguage = langAutoSelectToggle.checked;
    setBool('dts-lang-autoselect', autoSelectNewLanguage);
  });
  (function initLangAutoSelectPref(){
    let on = true;
    on = getBool('dts-lang-autoselect', true);
    autoSelectNewLanguage = on;
    langAutoSelectToggle.checked = on;
  })();

  // Hide-tags mode (per user spec): a gallery-toolbar toggle that blanks
  // the chip row + add-field on every card (persisted app-wide) so a
  // filter-driven sort like "everything without 1girl" reads have/not-have
  // at a glance. Tags stay editable through the card modal either way.
  let hideTags = false;
  hideTags = getBool('dts-hide-tags');
  btnHideTags.textContent = hideTags ? '\ud83d\udc41 Show tags' : '\ud83d\ude48 Hide tags';
  btnHideTags.addEventListener('click', () => {
    hideTags = !hideTags;
    setBool('dts-hide-tags', hideTags);
    btnHideTags.textContent = hideTags ? '\ud83d\udc41 Show tags' : '\ud83d\ude48 Hide tags';
    renderCurrentView();
  });

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
  btnRenameAllImages.addEventListener('click', async () => {
    const count = getEntries().length;
    if (count === 0){ toast('No images loaded.'); return; }
    const ok = await showConfirmModal(
      `Rename all ${count} loaded image(s) (+ their .txt files) to a simple zero-padded 1-${count} sequence? Active dataset images are numbered first, then Disabled/ continues the same count. This can be undone from the Log panel.`,
      { okLabel: 'Rename all', danger: true }
    );
    if (!ok) return;
    await renameAllEntriesSequentially();
  });
  viewDisabledBtn.addEventListener('click', () => switchView('disabled'));
  viewOriginalsBtn.addEventListener('click', () => switchView('originals'));
  viewDisabledBtn.addEventListener('dragover', (ev) => { ev.preventDefault(); viewDisabledBtn.classList.add('drag-over'); });
  viewDisabledBtn.addEventListener('dragleave', () => viewDisabledBtn.classList.remove('drag-over'));
  viewDisabledBtn.addEventListener('drop', (ev) => {
    ev.preventDefault();
    viewDisabledBtn.classList.remove('drag-over');
    const base = ev.dataTransfer!.getData('text/plain');
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
  function pageSingle(delta: number): void {
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
    }, transitionMsOf(singleViewEl));
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
