// Phase B module: tag frequency index/left panel + gallery filtering.
// `galleryFilter`/`gallerySortMode`/`gallerySortDir` stay owned by index.ts
// (reassigned wholesale on folder load / from the view-mode dropdowns, which
// aren't part of this extraction) and are injected once via initTagIndex(),
// since index.ts's IIFE can't export them.
// @ts-nocheck
import {
  $, tagFrequencyList, leftSortDropdown, leftSortDirBtn, btnResetFamilyOrder,
  filterInput, filterSuggestions, filterExactToggle, filterAllBtn, filterUntaggedBtn, filterDirtyBtn,
  excludeBadge, excludeBadgeText, excludeBadgeClear, btnClearFilter, allTagsDatalist
} from './dom';
import { toast, escapeHtml, buildPersistentDropdown } from './shared-ui';
import { folderStats, saveFolderStats, checkAchievements } from './achievements';

export let leftSortMode = 'family';
export let leftSortDir = 'desc';
export let familyOrder = []; // manual drag order of keyword families, persists across sort-mode switches

let getEntries = () => [];
let getGalleryFilter = () => ({ base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false, exactMatch: false });
let getGallerySortMode = () => 'filename';
let getGallerySortDir = () => 'asc';
let resetSingleIndex = () => {};
let renderCurrentViewRef = () => {};

// Kept in sync by refreshStats() so the filter-suggestions dropdown doesn't
// need to rebuild the tag index itself on every keystroke.
let lastTagIndex = new Map();

export function buildTagIndex(){
  const index = new Map(); // tag -> Set(base)
  for (const e of getEntries()){
    if (e.disabled) continue;
    for (const t of e.tags){
      if (!index.has(t)) index.set(t, new Set());
      index.get(t).add(e.base);
    }
  }
  return index;
}

function wordsOf(tag){
  return Array.from(new Set(tag.split(' ').filter(Boolean)));
}

// For the filter-suggestions dropdown: given the partial term currently being
// typed, returns { direct, family } — tags that directly match the partial
// text (prefix matches first), plus sibling tags that share a keyword-family
// word (same grouping used by the TAGS panel's "family" sort mode) with the
// closest direct matches, so typing "dr" surfaces "dress" as a direct match
// and e.g. "black dress"/"dress shoes" as family suggestions.
function buildFilterSuggestions(query){
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

function currentFilterTermSpan(value){
  const lastComma = value.lastIndexOf(',');
  const prefix = lastComma === -1 ? '' : value.slice(0, lastComma + 1) + ' ';
  const partial = lastComma === -1 ? value : value.slice(lastComma + 1);
  return { prefix, partial: partial.trim() };
}

function pickFilterSuggestion(tag){
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

function hideFilterSuggestions(){
  filterSuggestions.style.display = 'none';
  filterSuggestions.innerHTML = '';
}

function buildSuggestionRow(tag){
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

function updateFilterSuggestions(){
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

export function renderTagFrequencyList(index){
  const dir = leftSortDir === 'asc' ? 1 : -1;
  tagFrequencyList.innerHTML = '';

  if (leftSortMode === 'family'){
    const families = new Map(); // word -> [tag,...]
    for (const [tag] of index){
      const words = Array.from(new Set(tag.split(' ').filter(Boolean)));
      for (const w of words){
        if (!families.has(w)) families.set(w, []);
        if (!families.get(w).includes(tag)) families.get(w).push(tag);
      }
    }
    let familyList = Array.from(families.entries()).filter(([,tags]) => tags.length >= 2);
    familyList.sort((a,b) => (b[1].length - a[1].length) * dir);
    familyList = applyFamilyOrder(familyList);

    if (familyList.length === 0){
      const empty = document.createElement('div');
      empty.className = 'freq-family-header';
      empty.style.cursor = 'default';
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
      dragHandle.textContent = '☰';
      dragHandle.title = 'Drag to reorder this family';
      header.appendChild(dragHandle);
      const labelSpan = document.createElement('span');
      labelSpan.textContent = ` — ${word} (${tags.length}) —`;
      header.appendChild(labelSpan);

      header.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('text/plain', word);
        ev.dataTransfer.effectAllowed = 'move';
        header.classList.add('family-dragging');
      });
      header.addEventListener('dragend', () => header.classList.remove('family-dragging'));
      header.addEventListener('dragover', (ev) => { ev.preventDefault(); header.classList.add('family-drop-target'); });
      header.addEventListener('dragleave', () => header.classList.remove('family-drop-target'));
      header.addEventListener('drop', (ev) => {
        ev.preventDefault();
        header.classList.remove('family-drop-target');
        const draggedWord = ev.dataTransfer.getData('text/plain');
        if (draggedWord && draggedWord !== word) reorderFamilyBefore(draggedWord, word, familyList.map(f => f[0]));
      });

      tagFrequencyList.appendChild(header);
      tags.sort((a,b) => a.localeCompare(b));
      for (const tag of tags){
        tagFrequencyList.appendChild(buildFreqRow(tag, index.get(tag).size));
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

function buildFreqRow(tag, count){
  const row = document.createElement('div');
  row.className = 'freq-row';
  row.innerHTML = `<span>${escapeHtml(tag)}</span><span class="n">${count}</span>`;
  row.addEventListener('click', () => setContainsFilter(tag));
  return row;
}

function applyFamilyOrder(familyList){
  const words = familyList.map(([w]) => w);
  const known = familyOrder.filter(w => words.includes(w));
  const unknown = words.filter(w => !known.includes(w));
  const finalOrder = [...known, ...unknown];
  return finalOrder.map(w => familyList.find(([fw]) => fw === w));
}

function saveFamilyOrder(){
  try { localStorage.setItem('dts-family-order', JSON.stringify(familyOrder)); } catch(e){}
}
(function loadFamilyOrder(){
  try {
    const saved = JSON.parse(localStorage.getItem('dts-family-order') || 'null');
    if (Array.isArray(saved)) familyOrder = saved;
  } catch(e){}
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
function reorderFamilyBefore(draggedWord, targetWord, currentOrder){
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

export function refreshStats(){
  const index = buildTagIndex();
  lastTagIndex = index;
  const entries = getEntries();
  const activeEntries = entries.filter(e => !e.disabled);
  $('cardImages').textContent = activeEntries.length;
  $('cardTags').textContent = index.size;

  renderTagFrequencyList(index);

  allTagsDatalist.innerHTML = '';
  const allTagNames = Array.from(index.keys()).sort((a,b)=> a.localeCompare(b));
  for (const tag of allTagNames){
    const opt = document.createElement('option');
    opt.value = tag;
    allTagsDatalist.appendChild(opt);
  }

  return index;
}

export function sortEntries(list){
  const gallerySortMode = getGallerySortMode();
  const dir = getGallerySortDir() === 'asc' ? 1 : -1;
  const arr = list.slice();
  arr.sort((a, b) => {
    let cmp = 0;
    if (gallerySortMode === 'filename'){
      cmp = a.imgName.localeCompare(b.imgName, undefined, { numeric: true });
    } else if (gallerySortMode === 'resolution'){
      const ra = (a.width || 0) * (a.height || 0);
      const rb = (b.width || 0) * (b.height || 0);
      cmp = ra - rb;
    } else if (gallerySortMode === 'tagcount'){
      cmp = a.tags.length - b.tags.length;
    } else if (gallerySortMode === 'dirty'){
      cmp = (a.dirty ? 1 : 0) - (b.dirty ? 1 : 0);
    }
    return cmp * dir;
  });
  return arr;
}

export function filteredEntries(){
  return sortEntries(getEntries().filter(passesFilter));
}

export function passesFilter(e){
  const galleryFilter = getGalleryFilter();
  if (galleryFilter.disabledView){
    if (!e.disabled) return false;
  } else {
    if (e.disabled) return false;
    if (galleryFilter.base === 'untagged' && e.tags.length !== 0) return false;
    if (galleryFilter.base === 'dirty' && !e.dirty) return false;
  }
  if (galleryFilter.terms && galleryFilter.terms.length){
    const tagMatches = galleryFilter.exactMatch
      ? (t, term) => t.toLowerCase() === term
      : (t, term) => t.toLowerCase().includes(term);
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

export function setBaseFilter(kind){
  getGalleryFilter().base = kind;
  [filterAllBtn, filterUntaggedBtn, filterDirtyBtn].forEach(b=>b.classList.remove('active'));
  ({all: filterAllBtn, untagged: filterUntaggedBtn, dirty: filterDirtyBtn})[kind].classList.add('active');
  resetSingleIndex();
  renderCurrentViewRef();
}

export function parseFilterTerms(raw){
  return raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
}

export function setContainsFilter(value){
  const galleryFilter = getGalleryFilter();
  galleryFilter.terms = [value.toLowerCase()];
  galleryFilter.mode = 'AND';
  filterInput.value = value;
  hideFilterSuggestions();
  resetSingleIndex();
  renderCurrentViewRef();
}

// Tag Pruner's "Mirror my selections to gallery search" toggle (tag-pruner.ts)
// — replaces the filter terms wholesale with the CURRENT selection set (AND
// mode: an image has to carry every selected tag to show), so the gallery
// shows exactly the overlap a merge/void action is about to touch. An empty
// selection clears the filter terms back to "show everything" rather than
// leaving stale terms behind.
export function setMirroredSelectionFilter(tags){
  const galleryFilter = getGalleryFilter();
  const list = Array.from(tags);
  galleryFilter.terms = list.map(t => t.toLowerCase());
  galleryFilter.mode = 'AND';
  filterInput.value = list.join(', ');
  hideFilterSuggestions();
  resetSingleIndex();
  renderCurrentViewRef();
}

export function setExcludesFilter(value){
  getGalleryFilter().excludes = value.toLowerCase();
  excludeBadgeText.textContent = value;
  excludeBadge.style.display = 'flex';
  resetSingleIndex();
  renderCurrentViewRef();
}

export function initTagIndex(deps){
  getEntries = deps.getEntries;
  getGalleryFilter = deps.getGalleryFilter;
  getGallerySortMode = deps.getGallerySortMode;
  getGallerySortDir = deps.getGallerySortDir;
  resetSingleIndex = deps.resetSingleIndex;
  renderCurrentViewRef = deps.renderCurrentView;

  leftSortDirBtn.addEventListener('click', () => {
    leftSortDir = leftSortDir === 'asc' ? 'desc' : 'asc';
    leftSortDirBtn.textContent = leftSortDir === 'asc' ? '▲' : '▼';
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
    (val) => { leftSortMode = val; refreshStats(); }
  );

  filterInput.addEventListener('input', () => {
    getGalleryFilter().terms = parseFilterTerms(filterInput.value);
    resetSingleIndex();
    renderCurrentViewRef();
    updateFilterSuggestions();
  });
  filterInput.addEventListener('focus', updateFilterSuggestions);
  filterInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') hideFilterSuggestions();
  });
  document.addEventListener('click', (ev) => {
    if (ev.target !== filterInput && !filterSuggestions.contains(ev.target)) hideFilterSuggestions();
  }, true);
  filterExactToggle.addEventListener('change', () => {
    getGalleryFilter().exactMatch = filterExactToggle.checked;
    try { localStorage.setItem('dts-filter-exact-match', filterExactToggle.checked ? '1' : '0'); } catch(e){}
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
    try { on = localStorage.getItem('dts-filter-exact-match') === '1'; } catch(e){}
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
    excludeBadge.style.display = 'none';
    hideFilterSuggestions();
    setBaseFilter('all');
  });
}
