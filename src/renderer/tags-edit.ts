// Phase B module: core tag mutation (add/remove/reset), the undo/redo
// history stack, Unify/Void apply, disable/restore, and save-to-disk. This is
// the highest-fan-in domain in the app — nearly everything else calls into
// it — so several index.ts core internals (entries, dirHandle,
// disabledDirHandle, singleIndex, refreshStats/refreshAllUI/renderCurrentView)
// are injected once via initTagsEdit() rather than imported, since index.ts's
// IIFE can't export them.
import type { Entry, EditLogAffected, DirHandle, ChangeRecord } from './types';
import { getBool, setBool } from './storage';
import { writeBytes } from './fs-access';
import { btnUndo, btnRedo, btnSave, dirtyCountEl, includeDisabledToggle, autosaveToggle } from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, checkVoidThemeAchievements, folderStats, saveFolderStats } from './achievements';
import { pushLogEntry, editLog, PIXEL_TYPES, ISOLATE_TYPES, REVIEW_TYPES } from './edit-log';
import { applyCanonicalRules, registerMergeRule, registerVoidRule, findBlockingRule, saveCanonicalRules } from './canonical-tags';

export let undoStack: ChangeRecord[] = [];
export let redoStack: ChangeRecord[] = [];

// Session-only pixel-edit payloads (crop/rotate), keyed by owning log entry
// id. multi-MB by nature — deliberately NOT part of any persisted shape
// (EditLogAffected carries just the logId pointer). Cleared with the stacks
// on folder load, since log ids restart at 1 per folder.
interface PixelState {
  prev: Uint8Array;
  next: Uint8Array;
  prevW: number;
  prevH: number;
  nextW: number;
  nextH: number;
  mime: string;
}

const pixelStates = new Map<number, PixelState>();

// Session-only isolate payloads (new-file creations), same keying rules as
// pixelStates above: bytes never touch the persisted log.
interface IsolateState {
  bytes: Uint8Array;
  mime: string;
  tags: string[];
  imgName: string;
  width: number;
  height: number;
}

const isolateStates = new Map<number, IsolateState>();

export function getIsolateState(id: number): IsolateState | undefined {
  return isolateStates.get(id);
}

export function recordIsolateChange(summary: string, base: string, state: IsolateState): void {
  const affected: EditLogAffected[] = [{ base }];
  const logEntry = pushLogEntry({ type: 'isolate-image', summary, affected });
  affected[0].logId = logEntry.id;
  isolateStates.set(logEntry.id, state);
  undoStack.push({ type: 'isolate-image', summary, affected });
  redoStack = [];
  updateUndoRedoButtons();
}

export function recordPixelChange(type: string, summary: string, base: string, state: PixelState): void {
  const affected: EditLogAffected[] = [{ base }];
  const logEntry = pushLogEntry({ type, summary, affected });
  // Same array/object refs the log entry holds (pushLogEntry keeps the
  // passed affected array), so this tiny pointer persists with it — set
  // synchronously here, before saveEditLog's awaits serialize anything.
  affected[0].logId = logEntry.id;
  pixelStates.set(logEntry.id, state);
  undoStack.push({ type, summary, affected });
  redoStack = [];
  updateUndoRedoButtons();
}

export async function applyPixelDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): Promise<number> {
  let count = 0;
  for (const a of affected){
    const e = getEntryByBase(a.base);
    const st = typeof a.logId === 'number' ? pixelStates.get(a.logId) : undefined;
    if (!e || !st) continue;
    const bytes = direction === 'undo' ? st.prev : st.next;
    try {
      await writeBytes(e.imgHandle, bytes);
    } catch {
      continue;
    }
    try { URL.revokeObjectURL(e.objectUrl); } catch { /* best effort */ }
    e.objectUrl = URL.createObjectURL(new Blob([bytes as BlobPart], { type: st.mime }));
    if (direction === 'undo') { e.width = st.prevW; e.height = st.prevH; }
    else { e.width = st.nextW; e.height = st.nextH; }
    count++;
  }
  // Grid refreshes; an open card modal keeps showing its own copy until it
  // re-renders — same staleness tag-undo already has there, not a new gap.
  if (count) renderCurrentViewRef();
  return count;
}

let getEntries: () => Entry[] = () => [];
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
let getDirHandle: () => DirHandle | null = () => null;
let getDisabledDirHandle: () => DirHandle | null = () => null;
let setDisabledDirHandle: (h: DirHandle) => void = () => {};
let getOriginalDirHandle: () => DirHandle | null = () => null;
let reindexEntry: (oldBase: string, newBase: string) => void = () => {};
let resetSingleIndex: () => void = () => {};
let refreshStatsRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};
let renderCurrentViewRef: () => void = () => {};
let applyIsolateDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number> = async () => 0;
let applyFlaggedReviewDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number = () => 0;

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
  on = getBool(AUTOSAVE_KEY);
  autosaveToggle.checked = on;
})();
autosaveToggle.addEventListener('change', () => {
  setBool(AUTOSAVE_KEY, autosaveToggle.checked);
});
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;
const AUTOSAVE_DEBOUNCE_MS = 1200;
function scheduleAutosave(): void {
  if (!autosaveToggle.checked) return;
  if (autosaveTimer !== null) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => { saveAllDirty(true); }, AUTOSAVE_DEBOUNCE_MS);
}

export function markDirty(entry: Entry): void {
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
export function markRulesDirty(): void {
  rulesDirty = true;
  updateDirtyUI();
  scheduleAutosave();
}
// Called from index.ts right after loadCanonicalRulesForFolder() (folder
// load/unload) — that call replaces `canonicalRules` wholesale with the new
// dataset's own (already-saved) rules, so any pending rulesDirty from the
// PREVIOUS dataset (e.g. the user chose "switch anyway" and discarded it)
// must not linger and misrepresent the new dataset's actual save state.
export function resetRulesDirty(): void {
  rulesDirty = false;
  updateDirtyUI();
}

export function updateDirtyUI(): void {
  const dirtyCount = getEntries().filter(e=>e.dirty).length;
  let label;
  if (rulesDirty && dirtyCount > 0) label = `(${dirtyCount} + rules)`;
  else if (rulesDirty) label = '(rules)';
  else label = `(${dirtyCount})`;
  dirtyCountEl.textContent = label;
  btnSave.disabled = dirtyCount === 0 && !rulesDirty;
}

export function resetImageEdits(entry: Entry): void {
  const relevant = editLog.filter(le =>
    le.affected && le.affected.some(a => a.base === entry.base && a.prevTags) &&
    le.type !== 'restore' && le.type !== 'disable' && le.type !== 'undo' && le.type !== 'redo' && le.type !== 'reset-edits'
  );
  if (relevant.length === 0){ toast('No edit history found for this image yet.'); return; }
  const first = relevant[0];
  const affectedItem = first.affected.find(a => a.base === entry.base);
  const prevTags = entry.tags.slice();
  entry.tags = affectedItem!.prevTags!.slice();
  markDirty(entry);
  recordChange('reset-edits', `Reset ${entry.imgName} to its earliest known tag state.`,
    [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
  refreshAllUIRef();
  toast('Reverted this image to its earliest known state.');
}

// Commas separate tags: "1girl, red eyes, plump" adds three. Captions are
// stored comma-separated, so a comma can never be part of a real tag —
// splitting here covers every "+ add tag" field (cards, modal, Single,
// sequential) in one place. All the new tags land as ONE edit (one
// undo step, one log row).
export function addTagToEntry(entry: Entry, raw: string): void {
  const parts = raw.split(',').map(t => t.trim().replace(/_/g, ' ').replace(/\s+/g, ' ')).filter(Boolean);
  if (!parts.length) return;
  // A standing Retroactive Merge/Void rule affecting this exact tag on this
  // exact entry (respecting that rule's own enabled/child-toggle state and
  // this entry's Merge Immunize/Antivoid flags) blocks the add outright
  // instead of silently rewriting it after the fact — typing a tag by hand
  // is a deliberate action, and swapping in something else the user didn't
  // type is more confusing than just saying no. Typing the rule's own
  // canonical tag is never blocked (see findBlockingRule()'s own comment).
  const blocked: string[] = [];
  const added: string[] = [];
  const prevTags = entry.tags.slice();
  for (const tag of parts){
    if (findBlockingRule(tag, entry)){ blocked.push(tag); continue; }
    if (entry.tags.includes(tag) || added.includes(tag)) continue;
    entry.tags.push(tag);
    added.push(tag);
  }
  if (blocked.length){
    toast(blocked.length === 1 && parts.length === 1
      ? 'This tag is affected by a merge/void rule; please check the dock area for details.'
      : `Skipped ${blocked.map(t => `"${t}"`).join(', ')}: affected by a merge/void rule (see the dock area).`, 3600);
  }
  if (!added.length) return;
  markDirty(entry);
  refreshStatsRef();
  const what = added.length === 1 ? `tag "${added[0]}"` : `${added.length} tags (${added.join(', ')})`;
  recordChange('add-tag', `Added ${what} to ${entry.imgName}`,
    [{ base: entry.base, prevTags, newTags: entry.tags.slice() }]);
  trackStat('tags_added', added.length);
  checkAchievements();
}

export function removeTagFromEntry(entry: Entry, tag: string): void {
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

export function removeAllTagsFromEntry(entry: Entry): void {
  if (entry.tags.length === 0){ toast('This image has no tags to remove.'); return; }
  const prevTags = entry.tags.slice();
  const count = prevTags.length;
  entry.tags = [];
  markDirty(entry);
  refreshStatsRef();
  recordChange('remove-tag', `Removed all ${count} tag(s) from ${entry.imgName}`,
    [{ base: entry.base, prevTags, newTags: [] }]);
  trackStat('tags_removed', count);
  checkAchievements();
}

export function recordChange(type: string, summary: string, affected: EditLogAffected[], extra: Record<string, unknown> = {}): ChangeRecord {
  const record = { type, summary, affected, ...extra };
  undoStack.push(record);
  redoStack = [];
  updateUndoRedoButtons();
  pushLogEntry({ type, summary, affected, ...extra });
  return record;
}

export function applyTagDirection(affected: EditLogAffected[], direction: string): number {
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

export function updateUndoRedoButtons(): void {
  btnUndo.disabled = undoStack.length === 0;
  btnRedo.disabled = redoStack.length === 0;
}

export function resetUndoRedo(): void {
  undoStack = [];
  redoStack = [];
  pixelStates.clear();
  isolateStates.clear();
}

async function ensureDisabledDir(): Promise<DirHandle> {
  let disabledDirHandle = getDisabledDirHandle();
  if (!disabledDirHandle){
    disabledDirHandle = await getDirHandle()!.getDirectoryHandle('Disabled', { create: true });
    setDisabledDirHandle(disabledDirHandle);
  }
  return disabledDirHandle;
}

export async function moveEntry(entry: Entry, toDisabled: boolean, opts?: { silent?: boolean }): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  // Originals live in original_images/, not Disabled/, and are a paired copy of
  // a bucketed image — disable/restore is meaningless for them (the Bucket
  // Images dock's Revert is what moves them back).
  if (entry.original){ toast('Originals are managed by the Bucket Images tool.'); return; }
  const silent = !!opts?.silent;
  try {
    const targetDir = toDisabled ? await ensureDisabledDir() : dirHandle;
    const sourceDir = toDisabled ? dirHandle : getDisabledDirHandle();

    const file = await entry.imgHandle.getFile();
    const newImgHandle = await targetDir.getFileHandle(entry.imgName!, { create: true });
    await writeBytes(newImgHandle, file);

    if (sourceDir){
      try { await sourceDir.removeEntry(entry.imgName!); } catch(e){}
      try { await sourceDir.removeEntry(entry.txtName!); } catch(e){}
    }
    entry.imgHandle = newImgHandle;

    if (entry.tags.length > 0){
      const newTxtHandle = await targetDir.getFileHandle(entry.txtName!, { create: true });
      await writeBytes(newTxtHandle, entry.tags.join(', '));
      entry.txtHandle = newTxtHandle;
      entry.txtExisted = true;
    } else {
      entry.txtHandle = null;
      entry.txtExisted = false;
    }

    entry.dirty = false;
    entry.disabled = toDisabled;

    if (!silent){
      toast(toDisabled
        ? `Moved "${entry.imgName}" to Disabled/. Filename kept as-is, so restoring slots it right back in.`
        : `Restored "${entry.imgName}" to the dataset root.`, 3200);
      pushLogEntry({
        type: toDisabled ? 'disable' : 'restore',
        summary: toDisabled ? `Disabled ${entry.imgName}` : `Restored ${entry.imgName}`,
        affected: [{ base: entry.base }]
      });
    }
    trackStat(toDisabled ? 'disables' : 'restores');
    const mc = folderStats.moveCounts || {};
    mc[entry.base] = (mc[entry.base] || 0) + 1;
    folderStats.moveCounts = mc;
    if (mc[entry.base] >= 6) folderStats.flag_indecisive = true;
    saveFolderStats();

    if (!silent){
      resetSingleIndex();
      refreshAllUIRef();
      checkAchievements();
    }
  } catch(err){
    if (silent) throw err;
    toast('Could not move that file — check folder permissions.', 3600);
  }
}

async function renameFileInPlace(dir: DirHandle, oldName: string, newName: string): Promise<import('./types').FileHandle> {
  const oldHandle = await dir.getFileHandle(oldName, { create: false });
  const file = await oldHandle.getFile();
  const newHandle = await dir.getFileHandle(newName, { create: true });
  await writeBytes(newHandle, file);
  await dir.removeEntry(oldName);
  return newHandle;
}

// Renames every currently-loaded image (+ its .txt, if any) to a simple
// zero-padded sequence — one continuous count across the active dataset
// root and Disabled/ (active first, each ordered by current filename,
// numeric-aware, matching the same comparator scanDirInto() (index.ts)
// already sorts a folder scan with) rather than two independently-numbered
// sequences, since "1" meaning two different things depending on which
// folder it's in would be confusing. Two-phase (real name -> a throwaway
// __dts_rename_tmp_N__ name -> final zero-padded name) so a target name
// can never collide with a not-yet-renamed original name or another
// entry's own target — the standard safe technique for a bulk in-place
// rename, and simpler than reasoning case-by-case about which collisions
// are actually possible.
export async function renameAllEntriesSequentially(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle){ toast('Open a dataset folder first.'); return; }
  const disabledDirHandle = getDisabledDirHandle();
  const byFilename = (a: Entry, b: Entry) => a.base.localeCompare(b.base, undefined, { numeric: true });
  // Originals are excluded: they're a paired copy of a bucketed image in the
  // root, so renumbering them independently would break that pairing.
  const active = getEntries().filter(e => !e.disabled && !e.original).sort(byFilename);
  const disabled = getEntries().filter(e => e.disabled && !e.original).sort(byFilename);
  const ordered = [...active, ...disabled];
  if (ordered.length === 0){ toast('No images to rename.'); return; }

  const width = String(ordered.length).length;
  const extOf = (name: string): string => {
    const i = name.lastIndexOf('.');
    return i === -1 ? '' : name.slice(i);
  };

  interface RenamePlanItem {
    entry: Entry;
    dir: DirHandle;
    oldBase: string;
    oldImgName: string;
    oldTxtName: string | null;
    newBase: string;
    newImgName: string;
    newTxtName: string | null;
  }
  const plan: RenamePlanItem[] = ordered.map((entry, i) => {
    const newBase = String(i + 1).padStart(width, '0');
    return {
      entry,
      dir: entry.disabled ? disabledDirHandle! : dirHandle,
      oldBase: entry.base,
      oldImgName: entry.imgName || entry.base,
      oldTxtName: entry.txtHandle ? (entry.txtName || `${entry.base}.txt`) : null,
      newBase,
      newImgName: newBase + extOf(entry.imgName || entry.base),
      newTxtName: entry.txtHandle ? `${newBase}.txt` : null
    };
  });

  try {
    // Phase 1: every file to a unique temp name.
    for (let i = 0; i < plan.length; i++){
      const p = plan[i];
      p.entry.imgHandle = await renameFileInPlace(p.dir, p.oldImgName, `__dts_rename_tmp_${i}__${extOf(p.oldImgName)}`);
      if (p.entry.txtHandle && p.oldTxtName){
        p.entry.txtHandle = await renameFileInPlace(p.dir, p.oldTxtName, `__dts_rename_tmp_${i}__.txt`);
      }
    }
    // Phase 2: every temp name to its real final name.
    const affected: EditLogAffected[] = [];
    for (const p of plan){
      p.entry.imgHandle = await renameFileInPlace(p.dir, p.entry.imgHandle.name, p.newImgName);
      if (p.entry.txtHandle){
        p.entry.txtHandle = await renameFileInPlace(p.dir, p.entry.txtHandle.name, p.newTxtName!);
      }
      reindexEntry(p.oldBase, p.newBase);
      p.entry.base = p.newBase;
      p.entry.imgName = p.newImgName;
      p.entry.txtName = `${p.newBase}.txt`;
      affected.push({
        base: p.newBase, prevBase: p.oldBase,
        prevImgName: p.oldImgName, newImgName: p.newImgName,
        prevTxtName: p.oldTxtName || undefined, newTxtName: p.newTxtName || undefined
      });
    }
    pushLogEntry({
      type: 'rename-files',
      summary: `Renamed ${affected.length} image(s) to a simple 1-${ordered.length} sequence.`,
      affected
    });
    toast(`Renamed ${affected.length} image(s).`, 3200);
    resetSingleIndex();
    refreshAllUIRef();
  } catch(err){
    toast('Something went wrong partway through — check folder permissions. Some files may already be renamed; check the Log panel for what completed.', 4600);
    refreshAllUIRef();
  }
}

// Batch undo/redo for a 'rename-files' log entry (edit-log.ts, injected the
// same way applyTagDirection/moveEntry already are there — this file can't
// be imported back from edit-log.ts, which this file itself imports
// pushLogEntry/editLog from). Unlike the forward rename, no two-phase temp
// names are needed: every target name on either direction is one that was
// already proven unique at the time renameAllEntriesSequentially() ran (the
// original filenames going into 'undo', the "01".."NN" sequence going into
// 'redo'), so a plain one-at-a-time rename can't collide with another
// affected entry's own target.
export async function applyRenameDirection(affected: EditLogAffected[], direction: 'undo' | 'redo'): Promise<number> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return 0;
  const disabledDirHandle = getDisabledDirHandle();
  let count = 0;
  for (const a of affected){
    if (!a.prevBase || !a.prevImgName || !a.newImgName) continue;
    const fromBase = direction === 'undo' ? a.base : a.prevBase;
    const toBase = direction === 'undo' ? a.prevBase : a.base;
    const entry = getEntryByBase(fromBase);
    if (!entry) continue;
    const dir = entry.disabled ? disabledDirHandle : dirHandle;
    if (!dir) continue;
    const fromImgName = direction === 'undo' ? a.newImgName : a.prevImgName;
    const toImgName = direction === 'undo' ? a.prevImgName : a.newImgName;
    try {
      entry.imgHandle = await renameFileInPlace(dir, fromImgName, toImgName);
      if (entry.txtHandle && a.prevTxtName && a.newTxtName){
        const fromTxtName = direction === 'undo' ? a.newTxtName : a.prevTxtName;
        const toTxtName = direction === 'undo' ? a.prevTxtName : a.newTxtName;
        entry.txtHandle = await renameFileInPlace(dir, fromTxtName, toTxtName);
        entry.txtName = toTxtName;
      }
      reindexEntry(fromBase, toBase);
      entry.base = toBase;
      entry.imgName = toImgName;
      count++;
    } catch(err){ /* skip this one, keep going with the rest of the batch */ }
  }
  return count;
}

// Retroactive merge/void catch-up (checkbox-driven, per-log-entry replay)
// was replaced by canonical-tags.ts's standing-rules dock — see its own
// header comment for why (this old system gave no visibility into what it
// was actually doing, and only caught up Disabled images retroactively at
// all if the user remembered to go find and click a replay button).

interface TagsEditDeps {
  getEntries: () => Entry[];
  getEntryByBase: (base: string) => Entry | undefined;
  getDirHandle: () => DirHandle | null;
  getDisabledDirHandle: () => DirHandle | null;
  setDisabledDirHandle: (h: DirHandle) => void;
  getOriginalDirHandle: () => DirHandle | null;
  reindexEntry: (oldBase: string, newBase: string) => void;
  resetSingleIndex: () => void;
  refreshStats: () => void;
  refreshAllUI: () => void;
  renderCurrentView: () => void;
  applyIsolateDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number>;
  applyFlaggedReviewDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number;
}

export function initTagsEdit(deps: TagsEditDeps): void {
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  getDirHandle = deps.getDirHandle;
  getDisabledDirHandle = deps.getDisabledDirHandle;
  setDisabledDirHandle = deps.setDisabledDirHandle;
  getOriginalDirHandle = deps.getOriginalDirHandle;
  reindexEntry = deps.reindexEntry;
  resetSingleIndex = deps.resetSingleIndex;
  refreshStatsRef = deps.refreshStats;
  refreshAllUIRef = deps.refreshAllUI;
  renderCurrentViewRef = deps.renderCurrentView;
  applyIsolateDirectionRef = deps.applyIsolateDirection;
  applyFlaggedReviewDirectionRef = deps.applyFlaggedReviewDirection;

  btnUndo.addEventListener('click', async () => {
    const record = undoStack.pop();
    if (!record) return;
    const count = PIXEL_TYPES.has(record.type)
      ? await applyPixelDirection(record.affected, 'undo')
      : ISOLATE_TYPES.has(record.type)
        ? await applyIsolateDirectionRef(record.affected, 'undo')
        : REVIEW_TYPES.has(record.type)
          ? applyFlaggedReviewDirectionRef(record.affected, 'undo')
          : applyTagDirection(record.affected, 'undo');
    redoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Undid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to undo on the currently loaded images.');
    pushLogEntry({ type: 'undo', summary, affected: record.affected });
    trackStat('undos');
    refreshAllUIRef();
    checkAchievements();
  });

  btnRedo.addEventListener('click', async () => {
    const record = redoStack.pop();
    if (!record) return;
    const count = PIXEL_TYPES.has(record.type)
      ? await applyPixelDirection(record.affected, 'redo')
      : ISOLATE_TYPES.has(record.type)
        ? await applyIsolateDirectionRef(record.affected, 'redo')
        : REVIEW_TYPES.has(record.type)
          ? applyFlaggedReviewDirectionRef(record.affected, 'redo')
          : applyTagDirection(record.affected, 'redo');
    undoStack.push(record);
    updateUndoRedoButtons();
    const summary = `Redid: ${record.summary}`;
    toast(count > 0 ? summary : 'Nothing to redo on the currently loaded images.');
    pushLogEntry({ type: 'redo', summary, affected: record.affected });
    trackStat('redos');
    refreshAllUIRef();
    checkAchievements();
  });

  btnSave.addEventListener('click', () => saveAllDirty());
}

// ---------------- Unify/Void, parameterized per-caller ----------------
// Each Tag Pruner instance owns its own independent selection Set (see
// tag-pruner.ts) and renders its own Apply/Void row — these two functions
// used to be single click handlers closed over ONE shared selectedTagsRef;
// now the caller passes in whichever Set + name apply to its own row, and
// clears/re-renders on success. Logic itself is unchanged from before the
// per-pruner split.
export function applyUnifyToTags(tagsSet: Set<string>, unified: string): boolean {
  unified = (unified || '').trim();
  if (!unified){ toast('Enter a name for the unified tag first.'); return false; }
  if (tagsSet.size === 0){ toast('Select at least one tag to merge.'); return false; }

  const affected = [];
  for (const e of getEntries()){
    if (e.meta?.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
    const hasAny = e.tags.some(t => tagsSet.has(t));
    if (!hasAny) continue;
    const prevTags = e.tags.slice();
    let newTags = e.tags.filter(t => !tagsSet.has(t));
    if (!newTags.includes(unified)) newTags.push(unified);
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
  }

  const mergedTagsList = Array.from(tagsSet);
  const mergeSummary = `Merged ${tagsSet.size} tag(s) into "${unified}" across ${affected.length} image(s).`;
  toast(mergeSummary);
  recordChange('merge', mergeSummary, affected, { mergedTags: mergedTagsList, unifiedTag: unified });
  trackStat('merges');
  // Turns this one-off merge into a standing rule — see canonical-tags.ts.
  // Its own resweep also catches any Disabled image the loop above skipped
  // (e.g. "Also apply to Disabled images right now" was left unchecked).
  registerMergeRule(mergedTagsList, unified);
  tagsSet.clear();
  refreshAllUIRef();
  checkAchievements();
  return true;
}

export async function applyVoidToTags(tagsSet: Set<string>): Promise<boolean> {
  if (tagsSet.size === 0){ toast('Select at least one tag to void.'); return false; }
  const tagList = Array.from(tagsSet);
  const preview = tagList.length > 4
    ? `${tagList.slice(0,4).join(', ')}, +${tagList.length - 4} more`
    : tagList.join(', ');
  const ok = await showConfirmModal(
    `Permanently remove ${tagList.length} tag(s) from every image?\n\n${preview}\n\n` +
    `This deletes them outright — nothing is merged into a replacement tag. Use Undo right after if you change your mind.`,
    { okLabel: 'Void tags', danger: true }
  );
  if (!ok) return false;

  const affected = [];
  let voidedTagInstances = 0;
  for (const e of getEntries()){
    if (e.meta?.locked || (e.disabled && !includeDisabledToggle.checked)) continue;
    const hasAny = e.tags.some(t => tagsSet.has(t));
    if (!hasAny) continue;
    const prevTags = e.tags.slice();
    voidedTagInstances += e.tags.filter(t => tagsSet.has(t)).length;
    const newTags = e.tags.filter(t => !tagsSet.has(t));
    e.tags = newTags;
    markDirty(e);
    affected.push({ base: e.base, prevTags, newTags: newTags.slice() });
  }

  const voidSummary = `Voided ${tagsSet.size} tag(s), removed from ${affected.length} image(s).`;
  toast(voidSummary);
  recordChange('void', voidSummary, affected, { voidedTags: tagList });
  trackStat('voids');
  trackStat('voided_tag_instances', voidedTagInstances);
  checkVoidThemeAchievements(tagList, voidedTagInstances);
  // Turns this one-off void into a standing rule — see canonical-tags.ts.
  registerVoidRule(tagList);
  tagsSet.clear();
  refreshAllUIRef();
  checkAchievements();
  return true;
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
      const targetDir = e.original ? getOriginalDirHandle() : (e.disabled ? disabledDirHandle : dirHandle);
      if (!targetDir) { fail++; continue; }
      if (!e.txtHandle){
        e.txtHandle = await targetDir.getFileHandle(e.txtName!, { create: true });
      }
      await writeBytes(e.txtHandle, e.tags.join(', '));
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
