// Phase B module: Tag Pruner (search-or-browse tag list, supports multiple
// independent docks). Each instance owns its OWN tag-selection Set — a tag
// selected in one instance is hidden from every other instance's results
// (so the same tag can't be double-claimed), letting a user browse/select
// several unrelated keyword families side by side without them colliding.
// Each instance also renders its own Unify/Void row (see
// renderUnifyVoidRows()) and its own "Clear selection". This module is
// handed a couple of index.ts internals it can't import directly
// (buildTagIndex, refreshRightPanels) once via initTagPruner().
// @ts-nocheck
import { tagPrunerList, unifyVoidRows } from './dom';
import { applyUnifyToTags, applyVoidToTags } from './tags-edit';

export let tagPruners = [{ id: 1, filter: '', selected: new Set(), unifiedName: '' }];
export let tagPrunerIdCounter = 2;

let getIndexRef = null;
let onSelectionChangeRef = null;
let mirrorToGalleryRef = () => {};

// "Mirror to gallery search" — radio-button style across instances: at most
// one Tag Pruner's OWN selection drives the gallery filter at a time (each
// instance's own checkbox, checking one unchecks the others). Not persisted
// — tagPruners itself resets to one blank instance on every launch, so
// there's no stable instance id to reattach a saved preference to.
export let mirrorSourcePrunerId = null;

export function initTagPruner(getIndex, onSelectionChange, mirrorToGallery){
  getIndexRef = getIndex;
  onSelectionChangeRef = onSelectionChange;
  mirrorToGalleryRef = mirrorToGallery;
}

// Every OTHER instance's selected tags — used to hide a tag from this
// instance's own results once claimed elsewhere.
function tagsClaimedByOthers(pruner){
  const claimed = new Set();
  for (const p of tagPruners){
    if (p.id === pruner.id) continue;
    for (const t of p.selected) claimed.add(t);
  }
  return claimed;
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

    const mirrorLabel = document.createElement('label');
    mirrorLabel.className = 'pruner-mirror-toggle';
    mirrorLabel.title = 'Mirror this Tag Pruner\'s selection to the gallery search on the left, so you can see the images you\'re about to modify. Only one Tag Pruner can drive the gallery search at a time.';
    const mirrorCb = document.createElement('input');
    mirrorCb.type = 'checkbox';
    mirrorCb.checked = mirrorSourcePrunerId === pruner.id;
    mirrorCb.addEventListener('change', () => {
      mirrorSourcePrunerId = mirrorCb.checked ? pruner.id : null;
      renderTagPruners(); // rebuild so every OTHER instance's checkbox reflects the new exclusive state
      if (mirrorSourcePrunerId !== null) mirrorToGalleryRef(pruner.selected);
    });
    mirrorLabel.appendChild(mirrorCb);
    mirrorLabel.appendChild(document.createTextNode('🔍'));
    head.appendChild(mirrorLabel);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'pruner-clear-btn';
    clearBtn.textContent = 'Clear';
    clearBtn.title = 'Deselect every tag in THIS Tag Pruner (other Tag Pruners are unaffected)';
    clearBtn.disabled = pruner.selected.size === 0;
    clearBtn.addEventListener('click', () => {
      pruner.selected.clear();
      onSelectionChangeRef();
      renderTagPruners();
      if (mirrorSourcePrunerId === pruner.id) mirrorToGalleryRef(pruner.selected);
    });
    head.appendChild(clearBtn);

    if (tagPruners.length > 1){
      const rmBtn = document.createElement('button');
      rmBtn.className = 'pruner-remove-btn danger-ghost';
      rmBtn.textContent = '✕';
      rmBtn.title = 'Remove this Tag Pruner';
      rmBtn.addEventListener('click', () => {
        if (mirrorSourcePrunerId === pruner.id) mirrorSourcePrunerId = null;
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
  renderUnifyVoidRows();
}

export function renderPrunerResults(pruner, resultsList, index){
  const q = pruner.filter.trim().toLowerCase();
  const claimed = tagsClaimedByOthers(pruner);
  let list = Array.from(index.entries()).filter(([tag]) => !claimed.has(tag));
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
    cb.checked = pruner.selected.has(tag);
    cb.addEventListener('change', () => {
      if (cb.checked) pruner.selected.add(tag); else pruner.selected.delete(tag);
      onSelectionChangeRef();
      // Full rebuild, not just this instance's own list — another instance
      // may now need to hide (or reveal) this exact tag, and the Unify/Void
      // rows need to reflect the new selection either way.
      renderTagPruners();
      if (mirrorSourcePrunerId === pruner.id) mirrorToGalleryRef(pruner.selected);
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

// One row per Tag Pruner that currently has a non-empty selection — each
// with its own tag-chip summary, its own "unified tag name" input, and its
// own Apply/Void buttons (tags-edit.ts's applyUnifyToTags()/applyVoidToTags(),
// parameterized per-Set so each row acts only on ITS OWN pruner's selection).
export function renderUnifyVoidRows(){
  if (!unifyVoidRows) return;
  unifyVoidRows.innerHTML = '';
  const active = tagPruners.filter(p => p.selected.size > 0);
  if (active.length === 0){
    const empty = document.createElement('div');
    empty.className = 'selection-summary';
    empty.textContent = 'No tags selected yet — pick some in a Tag Pruner box above.';
    unifyVoidRows.appendChild(empty);
    return;
  }
  const index = getIndexRef();
  active.forEach((pruner) => {
    const row = document.createElement('div');
    row.className = 'unify-void-row';

    const summary = document.createElement('div');
    summary.className = 'selection-summary';
    for (const tag of pruner.selected){
      const span = document.createElement('span');
      span.className = 'tk';
      span.textContent = tag;
      summary.appendChild(span);
    }
    const totalImages = new Set();
    for (const tag of pruner.selected){
      const set = index.get(tag);
      if (set) set.forEach(b => totalImages.add(b));
    }
    const footer = document.createElement('div');
    footer.style.marginTop = '6px';
    footer.style.color = 'var(--text-faint)';
    footer.textContent = `${pruner.selected.size} tag${pruner.selected.size===1?'':'s'} selected · affects ${totalImages.size} image${totalImages.size===1?'':'s'}`;
    summary.appendChild(footer);
    row.appendChild(summary);

    const applyRow = document.createElement('div');
    applyRow.className = 'apply-row';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.className = 'power-tool pt-dynamic';
    nameInput.placeholder = 'Unified_tag_name';
    nameInput.value = pruner.unifiedName;
    nameInput.addEventListener('input', () => { pruner.unifiedName = nameInput.value; });
    const applyBtn = document.createElement('button');
    applyBtn.className = 'primary power-tool pt-dynamic';
    applyBtn.textContent = 'Apply';
    applyBtn.title = 'Merge all selected tags into this one name';
    applyBtn.addEventListener('click', () => {
      const ok = applyUnifyToTags(pruner.selected, pruner.unifiedName);
      if (!ok) return; // e.g. no name entered yet — leave the row as-is so nothing typed is lost
      pruner.unifiedName = '';
      renderTagPruners();
    });
    applyRow.appendChild(nameInput);
    applyRow.appendChild(applyBtn);
    row.appendChild(applyRow);

    const actionsRow = document.createElement('div');
    actionsRow.className = 'selection-actions-row';
    const voidBtn = document.createElement('button');
    voidBtn.className = 'danger-ghost power-tool pt-dynamic';
    voidBtn.textContent = 'Void';
    voidBtn.title = 'Permanently delete the selected tags from every image — nothing is merged into a replacement';
    voidBtn.addEventListener('click', async () => {
      const ok = await applyVoidToTags(pruner.selected);
      if (ok) renderTagPruners();
    });
    actionsRow.appendChild(voidBtn);
    row.appendChild(actionsRow);

    unifyVoidRows.appendChild(row);
  });
}

export function addTagPruner(){
  tagPruners.push({ id: tagPrunerIdCounter++, filter: '', selected: new Set(), unifiedName: '' });
  renderTagPruners();
}
