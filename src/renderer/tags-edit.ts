// Phase B module: core tag mutation (add/remove/reset), the undo/redo
// history stack, Unify/Void apply, disable/restore, and save-to-disk. This is
// the highest-fan-in domain in the app — nearly everything else calls into
// it — so several index.ts core internals (entries, dirHandle,
// disabledDirHandle, singleIndex, refreshStats/refreshAllUI/renderCurrentView)
// are injected once via initTagsEdit() rather than imported, since index.ts's
// IIFE can't export them.
// @ts-nocheck
import { btnUndo, btnRedo, btnApplyUnify, btnVoidSelected, unifiedTagInput, btnSave, dirtyCountEl, includeDisabledToggle, autosaveToggle } from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, checkVoidThemeAchievements, folderStats, saveFolderStats } from './achievements';
import { pushLogEntry, editLog } from './edit-log';
import { applyCanonicalRules, registerMergeRule, registerVoidRule, findBlockingRule, saveCanonicalRules } from './canonical-tags';

export let undoStack = []; // [{type, summary, affected:[{base,prevTags,newTags}]}]
export let redoStack = [];

let selectedTagsRef = null;
let getEntries = () => [];
let getEntryByBase = () => undefined;
let getDirHandle = () => null;
let getDisabledDirHandle = () => null;
let setDisabledDirHandle = () => {};
let getUnsavedApprovedDirHandle = () => null;
let setUnsavedApprovedDirHandle = () => {};
let resetSingleIndex = () => {};
let refreshStatsRef = () => {};
let refreshAllUIRef = () => {};
let renderCurrentViewRef = () => {};

// ---------------- Autosave ----------------
// Off by default. When on, every markDirty() schedules a debounced
// saveAllDirty(silent) a moment after the user stops editing, instead of
// waiting for a manual Save click — safe to rely on since every change is
// already in the Edit Log with its own undo regardless of whether the
// underlying .txt has been physically written yet (see Settings' own
// wording for this toggle).
const AUTOSAVE_KEY = 'dts-autosave';
(function initAutosavePref(){
  let on = false;
  try { on = localStorage.getItem(AUTOSAVE_KEY) === '1'; } catch(e){}
  autosaveToggle.checked = on;
})();
autosaveToggle.addEventListener('change', () => {
  try { localStorage.setItem(AUTOSAVE_KEY, autosaveToggle.checked ? '1' : '0'); } catch(e){}
});
let autosaveTimer = null;
const AUTOSAVE_DEBOUNCE_MS = 1200;
function scheduleAutosave(){
  if (!autosaveToggle.checked) return;
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { saveAllDirty(true); }, AUTOSAVE_DEBOUNCE_MS);
}

export function markDirty(entry){
  // Every tag-mutating action in the app — add/remove, Quick Merge, Unify/
  // Void, Master Tags, WD14, undo/redo — calls markDirty() right after
  // changing entry.tags, making this THE single funnel point where the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts) can
  // catch a child tag showing up "by any means" and rewrite it, without
  // needing a call threaded into every one of those sites individually.
  applyCanonicalRules(entry);
  entry.dirty = true;
  updateDirtyUI();
  scheduleAutosave();
}

// Whether the Retroactive Merge/Void dock's rules file
// (_dts_canonical_tags.json) has changes not yet written to disk. Rule edits
// used to save immediately on every toggle, bypassing the app's own Save/
// autosave system entirely — now they're a dirty action like any tag edit:
// markRulesDirty() (called from canonical-tags.ts via the same deps-injection
// pattern as markDirty above, since that module can't import this one back)
// just flags it and folds into the SAME dirty indicator, Save button, and
// autosave debounce as everything else, actually persisted by saveAllDirty()
// below.
export let rulesDirty = false;
export function markRulesDirty(){
  rulesDirty = true;
  updateDirtyUI();
  scheduleAutosave();
}
// Called from index.ts right after loadCanonicalRulesForFolder() (folder
// load/unload) — that call replaces `canonicalRules` wholesale with the new
// dataset's own (already-saved) rules, so any pending rulesDirty from the
// PREVIOUS dataset (e.g. the user chose "switch anyway" and discarded it)
// must not linger and misrepresent the new dataset's actual save state.
export function resetRulesDirty(){
  rulesDirty = false;
  updateDirtyUI();
}

export function updateDirtyUI(){
  const dirtyCount = getEntries().filter(e=>e.dirty).length;
  let label;
  if (rulesDirty && dirtyCount > 0) label = `(${dirtyCount} + rules)`;
  else if (rulesDirty) label = '(rules)';
  else label = `(${dirtyCount})`;
  dirtyCountEl.textContent = label;
  btnSave.disabled = dirtyCount === 0 && !rulesDirty;
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
  // A standing Retroactive Merge/Void rule affecting this exact tag on this
  // exact entry (respecting that rule's own enabled/child-toggle state and
  // this entry's Merge Immunize/Antivoid flags) blocks the add outright
  // instead of silently rewriting it after the fact — typing a tag by hand
  // is a deliberate action, and swapping in something else the user didn't
  // type is more confusing than just saying no. Typing the rule's own
  // canonical tag is never blocked (see findBlockingRule()'s own comment).
  if (findBlockingRule(tag, entry)){
    toast('This tag is affected by a merge/void rule; please check the dock area for details.', 3600);
    return;
  }
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

// SynthDat Overseer's "accept" staging folder — an accepted-but-not-yet-saved
// image lives here (not the dataset root) for its entire dirty lifetime, so
// the generated file itself survives a crash/close-without-saving even
// though its tags (memory-only until saved, like any dirty entry) don't.
// promotePendingApproval() below moves it into the root once actually saved.
export async function ensureUnsavedApprovedDir(){
  let h = getUnsavedApprovedDirHandle();
  if (!h){
    h = await getDirHandle().getDirectoryHandle('Unsaved Approved', { create: true });
    setUnsavedApprovedDirHandle(h);
  }
  return h;
}

// Moves a still-pending (never-saved) entry out of Unsaved Approved/ and
// into the dataset root, writing its CURRENT in-memory tags for the first
// time — this is what "saving" actually means for one of these, since it
// never had a .txt file (or a root-folder home) until now. Called from
// saveAllDirty() instead of that function's normal in-place write.
async function promotePendingApproval(entry){
  const dirHandle = getDirHandle();
  if (!dirHandle) return false;
  try {
    const stagingDir = getUnsavedApprovedDirHandle();
    const file = await entry.imgHandle.getFile();
    const newImgHandle = await dirHandle.getFileHandle(entry.imgName, { create: true });
    const iw = await newImgHandle.createWritable();
    await iw.write(file);
    await iw.close();

    const newTxtHandle = await dirHandle.getFileHandle(entry.txtName, { create: true });
    const tw = await newTxtHandle.createWritable();
    await tw.write(entry.tags.join(', '));
    await tw.close();

    if (stagingDir){
      try { await stagingDir.removeEntry(entry.imgName); } catch(e){}
      try { await stagingDir.removeEntry(entry.txtName); } catch(e){}
    }
    entry.imgHandle = newImgHandle;
    entry.txtHandle = newTxtHandle;
    entry.txtExisted = true;
    entry.pendingApproval = false;
    entry.dirty = false;
    return true;
  } catch(err){
    return false;
  }
}

export async function moveEntry(entry, toDisabled){
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
    // A still-pending entry's CURRENT location is Unsaved Approved/, not the
    // root, regardless of which direction it's being moved (this only
    // happens if the user manually disables/restores it via the 3-dot menu
    // before it was ever saved/promoted).
    const sourceDir = entry.pendingApproval ? getUnsavedApprovedDirHandle() : (toDisabled ? dirHandle : getDisabledDirHandle());

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
    entry.pendingApproval = false;

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

// Retroactive merge/void catch-up (checkbox-driven, per-log-entry replay)
// was replaced by canonical-tags.ts's standing-rules dock — see its own
// header comment for why (this old system gave no visibility into what it
// was actually doing, and only caught up Disabled images retroactively at
// all if the user remembered to go find and click a replay button).

export function initTagsEdit(deps){
  selectedTagsRef = deps.selectedTags;
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getDirHandle = deps.getDirHandle;
  getDisabledDirHandle = deps.getDisabledDirHandle;
  setDisabledDirHandle = deps.setDisabledDirHandle;
  getUnsavedApprovedDirHandle = deps.getUnsavedApprovedDirHandle;
  setUnsavedApprovedDirHandle = deps.setUnsavedApprovedDirHandle;
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
      if (e.meta.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
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
    // Turns this one-off merge into a standing rule — see canonical-tags.ts.
    // Its own resweep also catches any Disabled image the loop above skipped
    // (e.g. "Also apply to Disabled images right now" was left unchecked).
    registerMergeRule(mergedTagsList, unified);
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
      if (e.meta.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
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
    // Turns this one-off void into a standing rule — see canonical-tags.ts.
    registerVoidRule(tagList);
    selectedTagsRef.clear();
    refreshAllUIRef();
    checkAchievements();
  });

  btnSave.addEventListener('click', () => saveAllDirty());
}

// Extracted from btnSave's own click handler so autosave (settings.ts) can
// call the exact same logic programmatically instead of dispatching a fake
// click. `silent` skips the toast — autosave firing after every keystroke-
// driven edit would otherwise spam one every time, unlike a deliberate
// manual Save click.
export async function saveAllDirty(silent = false){
  const dirHandle = getDirHandle();
  const disabledDirHandle = getDisabledDirHandle();
  const dirty = getEntries().filter(e => e.dirty);
  if (dirty.length === 0 && !rulesDirty) return;
  let ok = 0, fail = 0;
  if (rulesDirty){
    await saveCanonicalRules();
    rulesDirty = false;
  }
  for (const e of dirty){
    try {
      if (e.pendingApproval){
        // Never had a .txt or a root-folder home — "saving" it means moving
        // it out of Unsaved Approved/ into the root for the first time, not
        // an in-place write (see promotePendingApproval()).
        if (await promotePendingApproval(e)) ok++; else fail++;
        continue;
      }
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
  if (!silent){
    const savedParts = [];
    if (ok > 0 || fail > 0) savedParts.push(fail === 0 ? `${ok} caption file(s)` : `${ok} caption file(s), failed ${fail}`);
    toast(savedParts.length ? `Saved ${savedParts.join(' and ')}.` : 'Saved Retroactive Merge/Void rule changes.', 3400);
  }
}
