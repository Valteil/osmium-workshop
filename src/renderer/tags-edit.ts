// Phase B module: core tag mutation (add/remove/reset), the undo/redo
// history stack, Unify/Void apply, disable/restore, and save-to-disk. This is
// the highest-fan-in domain in the app — nearly everything else calls into
// it — so several index.ts core internals (entries, dirHandle,
// disabledDirHandle, singleIndex, refreshStats/refreshAllUI/renderCurrentView)
// are injected once via initTagsEdit() rather than imported, since index.ts's
// IIFE can't export them.
// @ts-nocheck
import { btnUndo, btnRedo, btnApplyUnify, btnVoidSelected, unifiedTagInput, btnSave, dirtyCountEl, includeDisabledToggle } from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, checkVoidThemeAchievements, folderStats, saveFolderStats } from './achievements';
import { pushLogEntry, editLog } from './edit-log';

export let undoStack = []; // [{type, summary, affected:[{base,prevTags,newTags}]}]
export let redoStack = [];

let selectedTagsRef = null;
let getEntries = () => [];
let getEntryByBase = () => undefined;
let getDirHandle = () => null;
let getDisabledDirHandle = () => null;
let setDisabledDirHandle = () => {};
let resetSingleIndex = () => {};
let refreshStatsRef = () => {};
let refreshAllUIRef = () => {};
let renderCurrentViewRef = () => {};

export function markDirty(entry){
  entry.dirty = true;
  updateDirtyUI();
}

export function updateDirtyUI(){
  const dirtyCount = getEntries().filter(e=>e.dirty).length;
  dirtyCountEl.textContent = `(${dirtyCount})`;
  btnSave.disabled = dirtyCount === 0;
}

export function resetImageEdits(entry){
  const relevant = editLog.filter(le =>
    le.affected && le.affected.some(a => a.base === entry.base && a.prevTags) &&
    le.type !== 'restore' && le.type !== 'disable' && le.type !== 'undo' && le.type !== 'redo' && le.type !== 'reset-edits'
  );
  if (relevant.length === 0){ toast('No edit history found for this image yet.'); return; }
  const first = relevant[0];
  const affectedItem = first.affected.find(a => a.base === entry.base);
  const prevTags = entry.tags.slice();
  entry.tags = affectedItem.prevTags.slice();
  markDirty(entry);
  recordChange('reset-edits', `Reset ${entry.imgName} to its earliest known tag state.`,
    [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
  refreshAllUIRef();
  toast('Reverted this image to its earliest known state.');
}

export function addTagToEntry(entry, tag){
  tag = tag.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
  if (!tag) return;
  if (!entry.tags.includes(tag)){
    const prevTags = entry.tags.slice();
    entry.tags.push(tag);
    markDirty(entry);
    refreshStatsRef();
    recordChange('add-tag', `Added tag "${tag}" to ${entry.imgName}`,
      [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
    trackStat('tags_added');
    checkAchievements();
  }
}

export function removeTagFromEntry(entry, tag){
  const i = entry.tags.indexOf(tag);
  if (i !== -1){
    const prevTags = entry.tags.slice();
    entry.tags.splice(i, 1);
    markDirty(entry);
    refreshStatsRef();
    recordChange('remove-tag', `Removed tag "${tag}" from ${entry.imgName}`,
      [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
    trackStat('tags_removed');
    checkAchievements();
  }
}

export function recordChange(type, summary, affected, extra = {}){
  const record = { type, summary, affected, ...extra };
  undoStack.push(record);
  redoStack = [];
  updateUndoRedoButtons();
  pushLogEntry({ type, summary, affected, ...extra });
  return record;
}

export function applyTagDirection(affected, direction){
  let count = 0;
  for (const a of affected){
    const e = getEntryByBase(a.base);
    if (!e) continue;
    const target = direction === 'undo' ? a.prevTags : a.newTags;
    if (!target) continue;
    e.tags = target.slice();
    markDirty(e);
    count++;
  }
  return count;
}

export function updateUndoRedoButtons(){
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

export function resetUndoRedo(){
  undoStack = [];
  redoStack = [];
}

async function ensureDisabledDir(){
  let disabledDirHandle = getDisabledDirHandle();
  if (!disabledDirHandle){
    disabledDirHandle = await getDirHandle().getDirectoryHandle('Disabled', { create: true });
    setDisabledDirHandle(disabledDirHandle);
  }
  return disabledDirHandle;
}

export async function moveEntry(entry, toDisabled){
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
    const sourceDir = toDisabled ? dirHandle : getDisabledDirHandle();

    const file = await entry.imgHandle.getFile();
    const newImgHandle = await targetDir.getFileHandle(entry.imgName, { create: true });
    const iw = await newImgHandle.createWritable();
    await iw.write(file);
    await iw.close();

    if (sourceDir){
      try { await sourceDir.removeEntry(entry.imgName); } catch(e){}
      try { await sourceDir.removeEntry(entry.txtName); } catch(e){}
    }
    entry.imgHandle = newImgHandle;

    if (entry.tags.length > 0){
      const newTxtHandle = await targetDir.getFileHandle(entry.txtName, { create: true });
      const tw = await newTxtHandle.createWritable();
      await tw.write(entry.tags.join(', '));
      await tw.close();
      entry.txtHandle = newTxtHandle;
      entry.txtExisted = true;
    } else {
      entry.txtHandle = null;
      entry.txtExisted = false;
    }

    entry.dirty = false;
    entry.disabled = toDisabled;

    toast(toDisabled
      ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.`
      : `Restored "${entry.imgName}" to the dataset root.`, 3200);
    pushLogEntry({
      type: toDisabled ? 'disable' : 'restore',
      summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
      affected: [{ base: entry.base }]
    });
    trackStat(toDisabled ? 'disables' : 'restores');
    folderStats.moveCounts = folderStats.moveCounts || {};
    folderStats.moveCounts[entry.base] = (folderStats.moveCounts[entry.base] || 0) + 1;
    if (folderStats.moveCounts[entry.base] >= 6) folderStats.flag_indecisive = true;
    saveFolderStats();

    resetSingleIndex();
    refreshAllUIRef();
    checkAchievements();
  } catch(err){
    toast('Could not move that file — check folder permissions.', 3600);
  }
}

// ---------------- Retroactive merge/void (catch up disabled images) ----------------
//
// A merge or void applied while an image was disabled (and "Also apply to
// disabled images" wasn't checked) never touched that image's tags. These
// let the user catch specific disabled images up later, either by replaying
// one past merge/void log entry or by replaying all of them in original order.

export function retroApplyToDisabled(logEntry){
  if (logEntry.type !== 'merge' && logEntry.type !== 'void') return { count: 0, reason: 'unsupported' };
  const targetTags = logEntry.type === 'merge' ? logEntry.mergedTags : logEntry.voidedTags;
  if (!targetTags || targetTags.length === 0) return { count: 0, reason: 'no-data' };

  const affected = [];
  for (const e of getEntries()){
    if (!e.disabled) continue;
    const hasAny = e.tags.some(t => targetTags.includes(t));
    if (!hasAny) continue;
    const prevTags = e.tags.slice();
    let newTags = e.tags.filter(t => !targetTags.includes(t));
    if (logEntry.type === 'merge' && logEntry.unifiedTag && !newTags.includes(logEntry.unifiedTag)){
      newTags.push(logEntry.unifiedTag);
    }
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
  }
  if (affected.length === 0) return { count: 0, reason: 'no-match' };

  const verb = logEntry.type === 'merge' ? 'Retroactively merged' : 'Retroactively voided';
  const summary = `${verb} (replaying log #${logEntry.id}) on ${affected.length} disabled image(s): ${logEntry.summary}`;
  const extra = logEntry.type === 'merge'
    ? { mergedTags: targetTags, unifiedTag: logEntry.unifiedTag, retro: true }
    : { voidedTags: targetTags, retro: true };
  recordChange(logEntry.type, summary, affected, extra);
  trackStat(logEntry.type === 'merge' ? 'merges' : 'voids');
  refreshStatsRef();
  refreshAllUIRef();
  checkAchievements();
  return { count: affected.length };
}

export function retroApplyAllToDisabled(){
  const candidates = editLog.filter(le => (le.type === 'merge' || le.type === 'void') && !le.retro);
  let totalImages = 0, totalTasks = 0;
  for (const logEntry of candidates){
    const result = retroApplyToDisabled(logEntry);
    if (result.count > 0){ totalImages += result.count; totalTasks++; }
  }
  return { totalImages, totalTasks, consideredTasks: candidates.length };
}

export function initTagsEdit(deps){
  selectedTagsRef = deps.selectedTags;
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getDirHandle = deps.getDirHandle;
  getDisabledDirHandle = deps.getDisabledDirHandle;
  setDisabledDirHandle = deps.setDisabledDirHandle;
  resetSingleIndex = deps.resetSingleIndex;
  refreshStatsRef = deps.refreshStats;
  refreshAllUIRef = deps.refreshAllUI;
  renderCurrentViewRef = deps.renderCurrentView;

  btnUndo.addEventListener('click', () => {
    const record = undoStack.pop();
    if (!record) return;
    const count = applyTagDirection(record.affected, 'undo');
    redoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Undid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to undo on the currently loaded images.');
    pushLogEntry({ type: 'undo', summary, affected: record.affected });
    trackStat('undos');
    refreshAllUIRef();
    checkAchievements();
  });

  btnRedo.addEventListener('click', () => {
    const record = redoStack.pop();
    if (!record) return;
    const count = applyTagDirection(record.affected, 'redo');
    undoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Redid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to redo on the currently loaded images.');
    pushLogEntry({ type: 'redo', summary, affected: record.affected });
    trackStat('redos');
    refreshAllUIRef();
    checkAchievements();
  });

  btnApplyUnify.addEventListener('click', () => {
    const unified = unifiedTagInput.value.trim();
    if (!unified){
      toast('Enter a name for the unified tag first.');
      return;
    }
    if (selectedTagsRef.size === 0){
      toast('Select at least one tag to merge.');
      return;
    }

    const affected = [];
    for (const e of getEntries()){
      if (e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some(t => selectedTagsRef.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      let newTags = e.tags.filter(t => !selectedTagsRef.has(t));
      if (!newTags.includes(unified)) newTags.push(unified);
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }

    const mergedTagsList = Array.from(selectedTagsRef);
    const mergeSummary = `Merged ${selectedTagsRef.size} tag(s) into "${unified}" across ${affected.length} image(s).`;
    toast(mergeSummary);
    recordChange('merge', mergeSummary, affected, { mergedTags: mergedTagsList, unifiedTag: unified });
    trackStat('merges');
    selectedTagsRef.clear();
    unifiedTagInput.value = '';
    refreshAllUIRef();
    checkAchievements();
  });

  btnVoidSelected.addEventListener('click', async () => {
    if (selectedTagsRef.size === 0){
      toast('Select at least one tag to void.');
      return;
    }
    const tagList = Array.from(selectedTagsRef);
    const preview = tagList.length > 4
      ? `${tagList.slice(0,4).join(', ')}, +${tagList.length - 4} more`
      : tagList.join(', ');
    const ok = await showConfirmModal(
      `Permanently remove ${tagList.length} tag(s) from every image?\n\n${preview}\n\n` +
      `This deletes them outright — nothing is merged into a replacement tag. Use Undo right after if you change your mind.`,
      { okLabel: 'Void tags', danger: true }
    );
    if (!ok) return;

    const affected = [];
    let voidedTagInstances = 0;
    for (const e of getEntries()){
      if (e.disabled && !includeDisabledToggle.checked) continue;
      const hasAny = e.tags.some(t => selectedTagsRef.has(t));
      if (!hasAny) continue;
      const prevTags = e.tags.slice();
      voidedTagInstances += e.tags.filter(t => selectedTagsRef.has(t)).length;
      const newTags = e.tags.filter(t => !selectedTagsRef.has(t));
      e.tags = newTags;
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
    }

    const voidSummary = `Voided ${selectedTagsRef.size} tag(s), removed from ${affected.length} image(s).`;
    toast(voidSummary);
    recordChange('void', voidSummary, affected, { voidedTags: tagList });
    trackStat('voids');
    trackStat('voided_tag_instances', voidedTagInstances);
    checkVoidThemeAchievements(tagList, voidedTagInstances);
    selectedTagsRef.clear();
    refreshAllUIRef();
    checkAchievements();
  });

  btnSave.addEventListener('click', async () => {
    const dirHandle = getDirHandle();
    const disabledDirHandle = getDisabledDirHandle();
    const dirty = getEntries().filter(e => e.dirty);
    if (dirty.length === 0) return;
    let ok = 0, fail = 0;
    for (const e of dirty){
      try {
        const targetDir = e.disabled ? disabledDirHandle : dirHandle;
        if (!targetDir) { fail++; continue; }
        if (!e.txtHandle){
          e.txtHandle = await targetDir.getFileHandle(e.txtName, { create: true });
        }
        const writable = await e.txtHandle.createWritable();
        await writable.write(e.tags.join(', '));
        await writable.close();
        e.dirty = false;
        e.txtExisted = true;
        ok++;
      } catch(err){
        fail++;
      }
    }
    updateDirtyUI();
    renderCurrentViewRef();
    if (ok > 0){
      trackStat('saves');
      checkAchievements();
    }
    toast(fail === 0 ? `Saved ${ok} caption file(s).` : `Saved ${ok}, failed ${fail}. Check folder permissions.`, 3400);
  });
}
