// Phase B module: tag frequency index/left panel + gallery filtering.
// `galleryFilter`/`gallerySortMode`/`gallerySortDir` stay owned by index.ts
// (reassigned wholesale on folder load / from the view-mode dropdowns, which
// aren't part of this extraction) and are injected once via initTagIndex(),
// since index.ts's IIFE can't export them.
// @ts-nocheck
import {
  $, tagFrequencyList, leftSortDropdown, leftSortDirBtn, btnResetFamilyOrder,
  filterInput, filterAllBtn, filterUntaggedBtn, filterDirtyBtn,
  excludeBadge, excludeBadgeText, excludeBadgeClear, btnClearFilter, allTagsDatalist
} from './dom';
import { toast, escapeHtml, buildPersistentDropdown } from './shared-ui';

export let leftSortMode = 'family';
export let leftSortDir = 'desc';
export let familyOrder = []; // manual drag order of keyword families, persists across sort-mode switches

let getEntries = () => [];
let getGalleryFilter = () => ({ base: 'all', terms: [], mode: 'AND', excludes: '', disabledView: false });
let getGallerySortMode = () => 'filename';
let getGallerySortDir = () => 'asc';
let resetSingleIndex = () => {};
let renderCurrentViewRef = () => {};

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
  const entries = getEntries();
  const activeEntries = entries.filter(e => !e.disabled);
  const untaggedCount = activeEntries.filter(e => e.tags.length === 0).length;
  const disabledCount = entries.filter(e => e.disabled).length;
  $('statImages').textContent = activeEntries.length;
  $('statTags').textContent = index.size;
  $('statUntagged').textContent = untaggedCount;
  $('statDisabled').textContent = disabledCount;
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
    const matchCount = galleryFilter.terms.filter(term => e.tags.some(t => t.toLowerCase().includes(term))).length;
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
  });
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
    setBaseFilter('all');
  });
}
