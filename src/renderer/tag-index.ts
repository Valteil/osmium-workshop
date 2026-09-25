import type { Entry, GalleryFilter, GallerySortMode, GallerySortDir, LeftSortMode, LeftSortDir } from './types';
import { getJSON, setJSON, getBool, setBool } from './storage';
import {
  $, tagFrequencyList, leftSortDropdown, leftSortDirBtn, btnResetFamilyOrder,
  filterInput, filterSuggestions, filterExactToggle, filterAllBtn, filterUntaggedBtn, filterDirtyBtn,
  excludeBadge, excludeBadgeText, excludeBadgeClear, btnClearFilter,
  btnReviewFlagged, tagListTitle, tagFamilyListArea
} from './dom';
import { toast, escapeHtml, buildPersistentDropdown } from './shared-ui';
import { folderStats, saveFolderStats, checkAchievements } from './achievements';
import { setIconLabel } from './icons';

export let leftSortMode: LeftSortMode = 'family';
export let leftSortDir: LeftSortDir = 'desc';
export let familyOrder: string[] = [];

let getEntries: () => Entry[] = () => [];
let getGalleryFilter: () => GalleryFilter = () => ({ base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false, originalsView: false, exactMatch: false });
let getGallerySortMode: () => GallerySortMode = () => 'filename';
let getGallerySortDir: () => GallerySortDir = () => 'asc';
let resetSingleIndex: () => void = () => {};
let renderCurrentViewRef: () => void = () => {};
// The filter-mode dropdown (AND/OR/XOR/NOT) is a persistent custom control
// (buildPersistentDropdown) whose displayed label only updates when ITS OWN
// click handler fires — every place here that changes galleryFilter.mode
// programmatically (mirror search, Clear filter) must call this afterward,
// or the dropdown keeps showing the mode the user picked even after it's
// silently been overridden. isFilterModeLocked() is the "Lock" checkbox
// next to it — when on, those same call sites leave the user's chosen mode
// alone instead of forcing AND.
let refreshFilterModeUI: () => void = () => {};
let isFilterModeLocked: () => boolean = () => false;
let markTagReviewedRef: (tag: string) => number = () => 0;

let lastTagIndex: Map<string, Set<string>> = new Map();

// Left-panel "flagged for review" mode: btnReviewFlagged swaps the TAGS list
// for the union of every entry's meta.flaggedTags (see view.ts's tag-chip 🚩
// menu, which is the only thing that sets them). `reviewedFlaggedTags` is a
// session-only memory of tags the user cleared from this list, so a cleared row
// stays visible (struck through) instead of vanishing; a tag that has since
// been re-flagged (e.g. via Undo) is never shown struck — currently-flagged
// always wins. Cleared per dataset via resetReviewFlagged().
export let reviewFlaggedActive = false;
let reviewedFlaggedTags = new Set<string>();

export function resetReviewFlagged(): void {
  reviewFlaggedActive = false;
  reviewedFlaggedTags = new Set();
  btnReviewFlagged.classList.remove('active');
  tagFamilyListArea.classList.remove('review-mode');
}

export function buildTagIndex(): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const e of getEntries()){
    if (e.disabled) continue;
    for (const t of e.tags){
      if (!index.has(t)) index.set(t, new Set<string>());
      index.get(t)!.add(e.base);
    }
  }
  return index;
}

function wordsOf(tag: string): string[] {
  return Array.from(new Set(tag.split(' ').filter(Boolean)));
}

// For the filter-suggestions dropdown: given the partial term currently being
// typed, returns { direct, family } — tags that directly match the partial
// text (prefix matches first), plus sibling tags that share a keyword-family
// word (same grouping used by the TAGS panel's "family" sort mode) with the
// closest direct matches, so typing "dr" surfaces "dress" as a direct match
// and e.g. "black dress"/"dress shoes" as family suggestions.
function buildFilterSuggestions(query: string): { direct: string[]; family: string[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { direct: [], family: [] };
  const allTags = Array.from(lastTagIndex.keys());
  const starts = allTags.filter(t => t.toLowerCase().startsWith(q));
  const contains = allTags.filter(t => !starts.includes(t) && t.toLowerCase().includes(q));
  const direct = starts.concat(contains).slice(0, 12);

  const familyWords = new Set();
  for (const t of (starts.length ? starts : direct).slice(0, 5)){
    for (const w of wordsOf(t)) familyWords.add(w);
  }
  const directSet = new Set(direct);
  const family = allTags
    .filter(t => !directSet.has(t) && wordsOf(t).some(w => familyWords.has(w)))
    .slice(0, 8);

  return { direct, family };
}

function currentFilterTermSpan(value: string): { prefix: string; partial: string } {
  const lastComma = value.lastIndexOf(',');
  const prefix = lastComma === -1 ? '' : value.slice(0, lastComma + 1) + ' ';
  const partial = lastComma === -1 ? value : value.slice(lastComma + 1);
  return { prefix, partial: partial.trim() };
}

function pickFilterSuggestion(tag: string): void {
  const { prefix } = currentFilterTermSpan(filterInput.value);
  filterInput.value = prefix + tag;
  getGalleryFilter().terms = parseFilterTerms(filterInput.value);
  hideFilterSuggestions();
  folderStats.filter_suggestions_used = true;
  saveFolderStats();
  checkAchievements();
  resetSingleIndex();
  renderCurrentViewRef();
  filterInput.focus();
}

function hideFilterSuggestions(): void {
  filterSuggestions.style.display = 'none';
  filterSuggestions.innerHTML = '';
}

function buildSuggestionRow(tag: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'ac-row';
  row.innerHTML = `<span class="ac-row-name">${escapeHtml(tag)}</span>`;
  // mousedown (not click) fires before filterInput's blur, so the input
  // never loses focus and the outside-click-close handler never gets a
  // chance to hide this row out from under the click.
  row.addEventListener('mousedown', (ev) => {
    ev.preventDefault();
    pickFilterSuggestion(tag);
  });
  return row;
}

function updateFilterSuggestions(): void {
  const { partial } = currentFilterTermSpan(filterInput.value);
  if (partial.length < 2){ hideFilterSuggestions(); return; }
  const { direct, family } = buildFilterSuggestions(partial);
  if (direct.length === 0 && family.length === 0){ hideFilterSuggestions(); return; }

  filterSuggestions.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'ac-list';
  for (const tag of direct) list.appendChild(buildSuggestionRow(tag));
  if (family.length){
    const header = document.createElement('div');
    header.className = 'filter-suggestion-family';
    header.textContent = 'Same keyword family';
    list.appendChild(header);
    for (const tag of family) list.appendChild(buildSuggestionRow(tag));
  }
  filterSuggestions.appendChild(list);
  filterSuggestions.style.display = '';
}

// The flagged-for-review list that HIJACKS the normal TAGS list while
// btnReviewFlagged is active. Unlike the frequency list, rows do nothing on
// click — each carries a "Reviewed" button that unflags that tag from every
// image (one undoable edit-log entry, via the injected markTagReviewed) and
// leaves the row struck through for the rest of the session.
function renderFlaggedReviewList(): void {
  tagListTitle.textContent = 'FLAGGED FOR REVIEW';
  const counts = new Map<string, number>();
  for (const e of getEntries()){
    const flagged = e.meta && e.meta.flaggedTags;
    if (!flagged) continue;
    for (const t of flagged) counts.set(t, (counts.get(t) || 0) + 1);
  }
  const tags = new Set<string>(counts.keys());
  for (const t of reviewedFlaggedTags) tags.add(t);

  tagFrequencyList.innerHTML = '';
  if (tags.size === 0){
    const empty = document.createElement('div');
    empty.className = 'freq-empty';
    setIconLabel(empty, 'No tags flagged for review. Use a tag chip\'s 🚩 menu to flag one.');
    tagFrequencyList.appendChild(empty);
    return;
  }

  const sorted = Array.from(tags).sort((a, b) => a.localeCompare(b));
  for (const tag of sorted){
    const stillFlagged = counts.has(tag);
    const row = document.createElement('div');
    row.className = 'freq-row review-flag-row' + (stillFlagged ? '' : ' reviewed');
    const label = document.createElement('span');
    label.className = 'review-flag-tag';
    label.textContent = tag;
    row.appendChild(label);
    const btn = document.createElement('button');
    btn.className = 'review-done-btn';
    btn.textContent = 'Reviewed';
    btn.title = stillFlagged
      ? 'Unflag this tag from every image (undoable)'
      : 'Already cleared — no image lists this tag anymore';
    btn.disabled = !stillFlagged;
    btn.addEventListener('click', () => {
      reviewedFlaggedTags.add(tag);
      const n = markTagReviewedRef(tag);
      if (n === 0) toast(`No loaded image still lists "${tag}" as flagged for review.`);
      refreshStats();
    });
    row.appendChild(btn);
    tagFrequencyList.appendChild(row);
  }
}

export function renderTagFrequencyList(index: Map<string, Set<string>>): void {
  if (reviewFlaggedActive){ renderFlaggedReviewList(); return; }
  tagListTitle.textContent = 'TAGS';
  const dir = leftSortDir === 'asc' ? 1 : -1;
  tagFrequencyList.innerHTML = '';

  if (leftSortMode === 'family'){
    const families = new Map<string, string[]>();
    for (const [tag] of index){
      const words = Array.from(new Set(tag.split(' ').filter(Boolean)));
      for (const w of words){
        if (!families.has(w)) families.set(w, []);
        if (!families.get(w)!.includes(tag)) families.get(w)!.push(tag);
      }
    }
    let familyList: [string, string[]][] = Array.from(families.entries()).filter(([,tags]) => tags.length >= 2);
    familyList.sort((a,b) => (b[1].length - a[1].length) * dir);
    familyList = applyFamilyOrder(familyList);

    if (familyList.length === 0){
      const empty = document.createElement('div');
      empty.className = 'freq-empty';
      empty.textContent = 'No tags share a common word yet.';
      tagFrequencyList.appendChild(empty);
      return;
    }

    for (const [word, tags] of familyList){
      const header = document.createElement('div');
      header.className = 'freq-family-header';
      header.draggable = true;
      header.dataset.word = word;
      const dragHandle = document.createElement('span');
      dragHandle.className = 'family-drag-handle';
      setIconLabel(dragHandle, '☰');
      dragHandle.title = 'Drag to reorder this family';
      header.appendChild(dragHandle);
      const labelSpan = document.createElement('span');
      labelSpan.textContent = ` — ${word} (${tags.length}) —`;
      header.appendChild(labelSpan);

      header.addEventListener('dragstart', (ev) => {
        ev.dataTransfer!.setData('text/plain', word);
        ev.dataTransfer!.effectAllowed = 'move';
        header.classList.add('family-dragging');
      });
      header.addEventListener('dragend', () => header.classList.remove('family-dragging'));
      header.addEventListener('dragover', (ev) => { ev.preventDefault(); header.classList.add('family-drop-target'); });
      header.addEventListener('dragleave', () => header.classList.remove('family-drop-target'));
      header.addEventListener('drop', (ev) => {
        ev.preventDefault();
        header.classList.remove('family-drop-target');
        const draggedWord = ev.dataTransfer!.getData('text/plain');
        if (draggedWord && draggedWord !== word) reorderFamilyBefore(draggedWord, word, familyList.map(f => f[0]));
      });

      tagFrequencyList.appendChild(header);
      tags.sort((a,b) => a.localeCompare(b));
      for (const tag of tags){
        tagFrequencyList.appendChild(buildFreqRow(tag, index.get(tag)!.size));
      }
    }
    return;
  }

  let list = Array.from(index.entries());
  if (leftSortMode === 'alphabetical'){
    list.sort((a,b) => a[0].localeCompare(b[0]) * dir);
  } else {
    list.sort((a,b) => (b[1].size - a[1].size) * dir);
  }
  for (const [tag, set] of list){
    tagFrequencyList.appendChild(buildFreqRow(tag, set.size));
  }
}

function buildFreqRow(tag: string, count: number): HTMLElement {
  const row = document.createElement('div');
  row.className = 'freq-row';
  row.innerHTML = `<span>${escapeHtml(tag)}</span><span class="n">${count}</span>`;
  row.addEventListener('click', () => setContainsFilter(tag));
  return row;
}

function applyFamilyOrder(familyList: [string, string[]][]): [string, string[]][] {
  const words = familyList.map(([w]: [string, string[]]) => w);
  const known = familyOrder.filter(w => words.includes(w));
  const unknown = words.filter(w => !known.includes(w));
  const finalOrder = [...known, ...unknown];
  return finalOrder.map(w => familyList.find(([fw]: [string, string[]]) => fw === w)!);
}

function saveFamilyOrder(): void {
  setJSON('dts-family-order', familyOrder);
}
(function loadFamilyOrder(){
  const saved = getJSON<string[] | null>('dts-family-order', null);
  if (Array.isArray(saved)) familyOrder = saved;
})();

// Direction-aware: "insert before target" always, regardless of drag
// direction, meant dropping a family onto the very next one below it did
// nothing (it was already right before that target), and dropping further
// down only ever moved it one slot at a time instead of all the way to
// where it was dropped — dragging UP worked fine (an earlier target's index
// doesn't shift when the dragged item is removed from later in the list),
// dragging DOWN didn't (the target's index shifts left by one once the
// dragged item is removed from earlier in the list, so "insert before" always
// landed one short). Fix: insert after the target instead, whenever the
// dragged family started out ABOVE it — same asymmetry fix as docks.ts's
// reorderDock().
function reorderFamilyBefore(draggedWord: string, targetWord: string, currentOrder: string[]): void {
  const draggedIdx = currentOrder.indexOf(draggedWord);
  const targetIdxOriginal = currentOrder.indexOf(targetWord);
  const movingDown = draggedIdx !== -1 && targetIdxOriginal !== -1 && draggedIdx < targetIdxOriginal;
  let order = currentOrder.slice();
  order = order.filter(w => w !== draggedWord);
  let insertIdx = order.indexOf(targetWord);
  if (movingDown) insertIdx += 1;
  order.splice(insertIdx, 0, draggedWord);
  familyOrder = order;
  saveFamilyOrder();
  refreshStats();
}

export function refreshStats(): Map<string, Set<string>> {
  const index = buildTagIndex();
  lastTagIndex = index;
  const entries = getEntries();
  const activeEntries = entries.filter(e => !e.disabled);
  $('cardImages').textContent = String(activeEntries.length);
  $('cardTags').textContent = String(index.size);

  renderTagFrequencyList(index);

  return index;
}

export function sortEntries(list: Entry[]): Entry[] {
  const gallerySortMode = getGallerySortMode();
  const dir = getGallerySortDir() === 'asc' ? 1 : -1;
  const arr = list.slice();
  arr.sort((a, b) => {
    let cmp = 0;
    if (gallerySortMode === 'filename'){
      cmp = (a.imgName || '').localeCompare(b.imgName || '', undefined, { numeric: true });
    } else if (gallerySortMode === 'resolution'){
      const ra = (a.width || 0) * (a.height || 0);
      const rb = (b.width || 0) * (b.height || 0);
      cmp = ra - rb;
    } else if (gallerySortMode === 'tagcount'){
      cmp = a.tags.length - b.tags.length;
    } else if (gallerySortMode === 'dirty'){
      cmp = (a.dirty ? 1 : 0) - (b.dirty ? 1 : 0);
    } else if (gallerySortMode === 'dateadded'){
      cmp = ((a.meta && a.meta.dateAdded) || 0) - ((b.meta && b.meta.dateAdded) || 0);
    }
    return cmp * dir;
  });
  return arr;
}

export function filteredEntries(): Entry[] {
  return sortEntries(getEntries().filter(passesFilter));
}

export function passesFilter(e: Entry): boolean {
  const galleryFilter = getGalleryFilter();
  if (galleryFilter.originalsView){
    if (!e.original) return false;
  } else if (galleryFilter.disabledView){
    if (!e.disabled || e.original) return false;
  } else {
    if (e.disabled) return false;
    if (galleryFilter.base === 'untagged' && e.tags.length !== 0) return false;
    if (galleryFilter.base === 'dirty' && !e.dirty) return false;
  }
  if (galleryFilter.terms && galleryFilter.terms.length){
    const tagMatches = galleryFilter.exactMatch
      ? (t: string, term: string) => t.toLowerCase() === term
      : (t: string, term: string) => t.toLowerCase().includes(term);
    const matchCount = galleryFilter.terms.filter(term => e.tags.some(t => tagMatches(t, term))).length;
    const mode = galleryFilter.mode || 'AND';
    if (mode === 'AND' && matchCount !== galleryFilter.terms.length) return false;
    if (mode === 'OR' && matchCount === 0) return false;
    if (mode === 'XOR' && matchCount !== 1) return false;
    if (mode === 'NOT' && matchCount > 0) return false;
  }
  if (galleryFilter.excludes && e.tags.some(t => t.toLowerCase().includes(galleryFilter.excludes))) return false;
  return true;
}

export function setBaseFilter(kind: string): void {
  getGalleryFilter().base = kind;
  [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
  ({all: filterAllBtn, untagged: filterUntaggedBtn, dirty: filterDirtyBtn} as Record<string, HTMLElement>)[kind].classList.add('active');
  resetSingleIndex();
  renderCurrentViewRef();
}

export function parseFilterTerms(raw: string): string[] {
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function setContainsFilter(value: string): void {
  const galleryFilter = getGalleryFilter();
  galleryFilter.terms = [value.toLowerCase()];
  if (!isFilterModeLocked()) galleryFilter.mode = 'AND';
  filterInput.value = value;
  hideFilterSuggestions();
  resetSingleIndex();
  refreshFilterModeUI();
  renderCurrentViewRef();
}

// Tag Pruner's "Mirror my selections to gallery search" toggle (tag-pruner.ts)
// — replaces the filter terms wholesale with the CURRENT selection set (AND
// mode: an image has to carry every selected tag to show), so the gallery
// shows exactly the overlap a merge/void action is about to touch. An empty
// selection clears the filter terms back to "show everything" rather than
// leaving stale terms behind.
export function setMirroredSelectionFilter(tags: Iterable<string>): void {
  const galleryFilter = getGalleryFilter();
  const list = Array.from(tags);
  galleryFilter.terms = list.map((t: string) => t.toLowerCase());
  if (!isFilterModeLocked()) galleryFilter.mode = 'AND';
  filterInput.value = list.join(', ');
  hideFilterSuggestions();
  resetSingleIndex();
  refreshFilterModeUI();
  renderCurrentViewRef();
}

export function setExcludesFilter(value: string): void {
  getGalleryFilter().excludes = value.toLowerCase();
  excludeBadgeText.textContent = value;
  excludeBadge.style.display = 'flex';
  resetSingleIndex();
  renderCurrentViewRef();
}

interface TagIndexDeps {
  getEntries: () => Entry[];
  getGalleryFilter: () => GalleryFilter;
  getGallerySortMode: () => GallerySortMode;
  getGallerySortDir: () => GallerySortDir;
  resetSingleIndex: () => void;
  renderCurrentView: () => void;
  refreshFilterModeUI: () => void;
  isFilterModeLocked: () => boolean;
  markTagReviewed: (tag: string) => number;
}

export function initTagIndex(deps: TagIndexDeps): void {
  getEntries = deps.getEntries;
  getGalleryFilter = deps.getGalleryFilter;
  getGallerySortMode = deps.getGallerySortMode;
  getGallerySortDir = deps.getGallerySortDir;
  resetSingleIndex = deps.resetSingleIndex;
  renderCurrentViewRef = deps.renderCurrentView;
  refreshFilterModeUI = deps.refreshFilterModeUI;
  isFilterModeLocked = deps.isFilterModeLocked;
  markTagReviewedRef = deps.markTagReviewed;

  leftSortDirBtn.addEventListener('click', () => {
    leftSortDir = leftSortDir === 'asc' ? 'desc' : 'asc';
    setIconLabel(leftSortDirBtn, leftSortDir === 'asc' ? '▲' : '▼');
    refreshStats();
  });
  btnResetFamilyOrder.addEventListener('click', () => {
    familyOrder = [];
    saveFamilyOrder();
    refreshStats();
    toast('Keyword family order reset.');
  });

  buildPersistentDropdown(leftSortDropdown,
    [
      { value: 'family', label: 'Keyword family' },
      { value: 'frequency', label: 'Frequency' },
      { value: 'alphabetical', label: 'Alphabetical' }
    ],
    () => leftSortMode,
    (val: string) => { leftSortMode = val as LeftSortMode; refreshStats(); }
  );

  // Typing a filter re-runs the full gallery render (filtered card list) on
  // EVERY keystroke — at thousands of images that lagged between keystrokes.
  // 120ms debounce: typing still feels instant (suggestions update live),
  // the heavy render only fires once you've paused.
  let filterRenderTimer: ReturnType<typeof setTimeout> | null = null;
  filterInput.addEventListener('input', () => {
    getGalleryFilter().terms = parseFilterTerms(filterInput.value);
    resetSingleIndex();
    if (filterRenderTimer) clearTimeout(filterRenderTimer);
    filterRenderTimer = setTimeout(() => { filterRenderTimer = null; renderCurrentViewRef(); }, 120);
    updateFilterSuggestions();
  });
  filterInput.addEventListener('focus', updateFilterSuggestions);
  filterInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hideFilterSuggestions();
  });
  document.addEventListener('click', (ev) => {
    if (ev.target !== filterInput && !filterSuggestions.contains(ev.target as Node)) hideFilterSuggestions();
  }, true);
  filterExactToggle.addEventListener('change', () => {
    getGalleryFilter().exactMatch = filterExactToggle.checked;
    setBool('dts-filter-exact-match', filterExactToggle.checked);
    if (filterExactToggle.checked){
      folderStats.exact_match_used = true;
      saveFolderStats();
      checkAchievements();
    }
    resetSingleIndex();
    renderCurrentViewRef();
  });
  (function initExactMatchPref(){
    let on = false;
    on = getBool('dts-filter-exact-match');
    filterExactToggle.checked = on;
    getGalleryFilter().exactMatch = on;
  })();
  filterAllBtn.addEventListener('click', () => setBaseFilter('all'));
  filterUntaggedBtn.addEventListener('click', () => setBaseFilter('untagged'));
  filterDirtyBtn.addEventListener('click', () => setBaseFilter('dirty'));
  excludeBadgeClear.addEventListener('click', () => {
    getGalleryFilter().excludes = '';
    excludeBadge.style.display = 'none';
    renderCurrentViewRef();
  });

  btnClearFilter.addEventListener('click', () => {
    filterInput.value = '';
    const galleryFilter = getGalleryFilter();
    galleryFilter.terms = [];
    galleryFilter.excludes = '';
    if (!isFilterModeLocked()) galleryFilter.mode = 'AND';
    excludeBadge.style.display = 'none';
    hideFilterSuggestions();
    refreshFilterModeUI();
    setBaseFilter('all');
  });

  // Toggle the flagged-for-review list in place of the normal TAGS list.
  // Reviewed tags start fresh each time the mode is switched on.
  btnReviewFlagged.addEventListener('click', () => {
    reviewFlaggedActive = !reviewFlaggedActive;
    btnReviewFlagged.classList.toggle('active', reviewFlaggedActive);
    tagFamilyListArea.classList.toggle('review-mode', reviewFlaggedActive);
    if (reviewFlaggedActive) reviewedFlaggedTags = new Set();
    refreshStats();
  });
}
