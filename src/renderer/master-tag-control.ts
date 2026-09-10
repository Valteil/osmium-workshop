// Phase B module: Master Tag Control (bulk apply/remove/conditional/rename/
// find-replace across the whole dataset, plus the selection mini-grid).
// `filteredEntries` and `renderCurrentView` stay owned by index.ts's core
// filtering/view code and are injected once via initMasterTagControl(),
// since index.ts's IIFE can't export them.
// @ts-nocheck
import {
  masterSelectionSummary, masterMiniGrid, btnMasterSelectAll, btnMasterClearSelection,
  masterApplyTagInput, btnMasterApplyToSelected, masterRemoveTagInput, btnMasterRemoveFromSelected,
  condSourceTag, condAddTag, btnCondApply, massApplyInput, btnMassApply,
  massRemoveInput, btnMassRemove, masterRenameFrom, masterRenameTo, btnMasterRename,
  masterFRFind, masterFRReplace, btnMasterFR
} from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange } from './tags-edit';

export let masterSelectedImages = new Set();

let getEntries = () => [];
let getEntryByBase = () => undefined;
let filteredEntriesRef = () => [];
let renderCurrentViewRef = () => {};
let refreshAllUIRef = () => {};

export function updateMasterSelectionText(){
  if (masterSelectedImages.size === 0){
    masterSelectionSummary.textContent = 'No images selected yet.';
    return;
  }
  masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
}

export function renderMasterMiniGrid(){
  masterMiniGrid.innerHTML = '';
  const list = filteredEntriesRef();
  list.forEach(e => {
    const cell = document.createElement('div');
    cell.className = 'master-mini-cell' + (masterSelectedImages.has(e.base) ? ' selected' : '');
    cell.dataset.base = e.base;
    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.loading = 'lazy';
    cell.appendChild(img);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'master-mini-cb';
    cb.checked = masterSelectedImages.has(e.base);
    cb.addEventListener('click', (ev) => ev.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) masterSelectedImages.add(e.base);
      else masterSelectedImages.delete(e.base);
      cell.classList.toggle('selected', cb.checked);
      updateMasterSelectionText();
      renderCurrentViewRef();
    });
    cell.appendChild(cb);
    cell.addEventListener('click', () => {
      cb.checked = !cb.checked;
      cb.dispatchEvent(new Event('change'));
    });
    masterMiniGrid.appendChild(cell);
  });
}

export function syncMasterMiniGrid(){
  masterMiniGrid.querySelectorAll('.master-mini-cell').forEach(cell => {
    const base = cell.dataset.base;
    const selected = masterSelectedImages.has(base);
    cell.classList.toggle('selected', selected);
    const cb = cell.querySelector('.master-mini-cb');
    if (cb) cb.checked = selected;
  });
}

export function renderMasterSelectionSummary(){
  updateMasterSelectionText();
  syncMasterMiniGrid();
}

export function initMasterTagControl(deps){
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  filteredEntriesRef = deps.filteredEntries;
  renderCurrentViewRef = deps.renderCurrentView;
  refreshAllUIRef = deps.refreshAllUI;

  btnMasterSelectAll.addEventListener('click', () => {
    for (const e of filteredEntriesRef()) masterSelectedImages.add(e.base);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });
  btnMasterClearSelection.addEventListener('click', () => {
    masterSelectedImages.clear();
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  btnMasterApplyToSelected.addEventListener('click', () => {
    const tag = masterApplyTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Nothing to apply — selected images already have that tag.'); return; }
    const summary = `Applied "${tag}" to ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterApplyTagInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterRemoveFromSelected.addEventListener('click', () => {
    const tag = masterRemoveTagInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const affected = [];
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('None of the selected images have that tag.'); return; }
    const summary = `Removed "${tag}" from ${affected.length} selected image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    masterRemoveTagInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnCondApply.addEventListener('click', () => {
    const sourceTag = condSourceTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const addTag = condAddTag.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled) continue;
      if (!e.tags.includes(sourceTag) || e.tags.includes(addTag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(addTag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast(`No images with "${sourceTag}" are missing "${addTag}".`); return; }
    const summary = `Added "${addTag}" to every image with "${sourceTag}" (${affected.length} image(s)).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    condSourceTag.value = ''; condAddTag.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMassApply.addEventListener('click', async () => {
    const tag = massApplyInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to apply.'); return; }
    const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: 'Apply to all' });
    if (!ok) return;
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags.push(tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('Every image already has that tag.'); return; }
    const summary = `Added "${tag}" to all ${affected.length} image(s).`;
    toast(summary);
    recordChange('add-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massApplyInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMassRemove.addEventListener('click', async () => {
    const tag = massRemoveInput.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    if (!tag){ toast('Enter a tag to remove.'); return; }
    const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: 'Remove from all', danger: true });
    if (!ok) return;
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || !e.tags.includes(tag)) continue;
      const prevTags = e.tags.slice();
      e.tags = e.tags.filter(t => t !== tag);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0){ toast('No images have that tag.'); return; }
    const summary = `Removed "${tag}" from all ${affected.length} image(s).`;
    toast(summary);
    recordChange('remove-tag', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    massRemoveInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterRename.addEventListener('click', () => {
    const from = masterRenameFrom.value.trim();
    const to = masterRenameTo.value.trim();
    if (!from || !to){ toast('Enter both a tag to rename and its replacement.'); return; }
    if (from === to){ toast('New name is the same as the old one.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || !e.tags.includes(from)) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t === from ? to : t);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No active images currently have the tag "${from}".`); return; }
    const summary = `Renamed "${from}" → "${to}" across ${affected.length} image(s).`;
    toast(summary);
    recordChange('rename', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('renames');
    masterRenameFrom.value = ''; masterRenameTo.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnMasterFR.addEventListener('click', () => {
    const find = masterFRFind.value;
    const repl = masterFRReplace.value;
    if (!find){ toast('Enter a substring to find.'); return; }
    const affected = [];
    for (const e of getEntries()){
      if (e.disabled || !e.tags.some(t => t.includes(find))) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.map(t => t.includes(find) ? t.split(find).join(repl) : t);
      newTags = newTags.map(t => t.trim()).filter(Boolean);
      newTags = Array.from(new Set(newTags));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }
    if (affected.length === 0){ toast(`No tags contain "${find}".`); return; }
    const summary = `Replaced "${find}" → "${repl}" inside tags across ${affected.length} image(s).`;
    toast(summary);
    recordChange('find-replace', summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    trackStat('find_replaces');
    masterFRFind.value = ''; masterFRReplace.value = '';
    refreshAllUIRef();
    checkAchievements();
  });
}
