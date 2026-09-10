// Phase B module: Tag Pruner (search-or-browse tag list, supports multiple
// docks). `selectedTags` (the Set backing the whole selection/apply system)
// stays owned by index.ts since it's read by far more than just this panel
// (chips, master tag control, etc.) — this module is handed a reference to
// it once via initTagPruner(), along with callbacks for the two index.ts
// internals it needs (buildTagIndex, refreshRightPanels) that can't be
// exported out of index.ts's IIFE.
// @ts-nocheck
import { tagPrunerList } from './dom';

export let tagPruners = [{ id: 1, filter: '' }];
export let tagPrunerIdCounter = 2;

let selectedTagsRef = null;
let getIndexRef = null;
let onSelectionChangeRef = null;

export function initTagPruner(selectedTagsSet, getIndex, onSelectionChange){
  selectedTagsRef = selectedTagsSet;
  getIndexRef = getIndex;
  onSelectionChangeRef = onSelectionChange;
}

export function renderTagPruners(){
  tagPrunerList.innerHTML = '';
  const index = getIndexRef();
  tagPruners.forEach((pruner) => {
    const instance = document.createElement('div');
    instance.className = 'pruner-instance';

    const head = document.createElement('div');
    head.className = 'pruner-instance-head';
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'power-tool pt-dynamic';
    input.placeholder = 'Search tags, or leave empty to browse all…';
    input.value = pruner.filter;
    input.addEventListener('input', () => {
      pruner.filter = input.value;
      renderPrunerResults(pruner, resultsList, index);
    });
    head.appendChild(input);
    if (tagPruners.length > 1){
      const rmBtn = document.createElement('button');
      rmBtn.className = 'pruner-remove-btn danger-ghost';
      rmBtn.textContent = '✕';
      rmBtn.title = 'Remove this Tag Pruner';
      rmBtn.addEventListener('click', () => {
        tagPruners = tagPruners.filter(p => p.id !== pruner.id);
        renderTagPruners();
      });
      head.appendChild(rmBtn);
    }
    instance.appendChild(head);

    const resultsList = document.createElement('div');
    resultsList.className = 'pruner-instance-list';
    instance.appendChild(resultsList);

    tagPrunerList.appendChild(instance);
    renderPrunerResults(pruner, resultsList, index);
  });
}

export function renderPrunerResults(pruner, resultsList, index){
  const q = pruner.filter.trim().toLowerCase();
  let list = Array.from(index.entries());
  if (q) list = list.filter(([tag]) => tag.toLowerCase().includes(q));
  list.sort((a,b) => q ? (b[1].size - a[1].size) : a[0].localeCompare(b[0]));

  resultsList.innerHTML = '';
  if (list.length === 0){
    resultsList.innerHTML = '<div class="match-row" style="cursor:default; color:var(--text-faint);">No tags match.</div>';
    return;
  }
  for (const [tag, set] of list){
    const row = document.createElement('label');
    row.className = 'match-row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = selectedTagsRef.has(tag);
    cb.addEventListener('change', () => {
      if (cb.checked) selectedTagsRef.add(tag); else selectedTagsRef.delete(tag);
      onSelectionChangeRef();
    });
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = tag;
    const cnt = document.createElement('span');
    cnt.className = 'cnt';
    cnt.textContent = `${set.size}×`;
    row.appendChild(cb);
    row.appendChild(name);
    row.appendChild(cnt);
    resultsList.appendChild(row);
  }
}

export function refreshTagPrunerChecksOnly(){
  tagPrunerList.querySelectorAll('.match-row').forEach(row => {
    const nameEl = row.querySelector('.name');
    const cb = row.querySelector('input[type="checkbox"]');
    if (nameEl && cb) cb.checked = selectedTagsRef.has(nameEl.textContent);
  });
}

export function addTagPruner(){
  tagPruners.push({ id: tagPrunerIdCounter++, filter: '' });
  renderTagPruners();
}
