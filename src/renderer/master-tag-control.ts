// Phase B module: Master Tag Control (bulk apply/remove/conditional/rename/
// find-replace across the whole dataset, plus the selection mini-grid).
// `filteredEntries` and `renderCurrentView` stay owned by index.ts's core
// filtering/view code and are injected once via initMasterTagControl(),
// since index.ts's IIFE can't export them.
import type { Entry, EntryMeta, EditLogAffected } from './types';
import { getInt, setInt } from './storage';
import {
  masterSelectionSummary, masterMiniGrid, btnMasterSelectAll, btnMasterClearSelection,
  btnMasterLockSelected, btnMasterUnlockSelected, btnMasterDeleteSelected, btnMasterDisableSelected,
  btnMasterMergeImmunizeToggle, btnMasterAntivoidToggle, btnMasterAntimmunizeToggle,
  masterApplyTagInput, btnMasterApplyToSelected, masterRemoveTagInput, btnMasterRemoveFromSelected,
  condSourceTag, condAddTag, btnCondApply,
  condWithoutSourceTag, condWithoutAddTag, btnCondApplyWithout,
  massApplyInput, btnMassApply,
  massRemoveInput, btnMassRemove, masterRenameFrom, masterRenameTo, btnMasterRename,
  masterFRFind, masterFRReplace, btnMasterFR
} from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange } from './tags-edit';
import { attachFillAutocomplete } from './tags-autocomplete';
import { setIconLabel, plainLabel } from './icons';

export let masterSelectedImages = new Set<string>();

// A button whose label is too long to have a short form that still reads
// as a sentence ("Select all visible", "Sequential from first", etc.) gets
// wrapped in a full-text span + an icon-only span; styles.css's
// .icon-fallback-btn container query (keyed to #right's own resized width,
// not the viewport) swaps which one shows once the panel's dragged
// narrower than the full label needs. aria-label carries the real meaning
// in both states — takes the button's existing text as-is, so this can
// hydrate either a plain static HTML button or one just built in JS.
function attachIconFallback(btn: HTMLButtonElement, icon: string): void {
  const label = (btn.dataset.iconLabel || btn.textContent || '').trim();
  btn.classList.add('icon-fallback-btn');
  btn.setAttribute('aria-label', plainLabel(label));
  btn.textContent = '';
  const full = document.createElement('span');
  full.className = 'label-full';
  full.setAttribute('aria-hidden', 'true');
  setIconLabel(full, label);
  const iconEl = document.createElement('span');
  iconEl.className = 'label-icon';
  iconEl.setAttribute('aria-hidden', 'true');
  setIconLabel(iconEl, icon);
  btn.appendChild(full);
  btn.appendChild(iconEl);
}

// ---------------- Mini-grid drag-to-select ----------------
// Held mouse button "painting" across cells — mousedown on a cell decides
// the paint mode (select if it was off, deselect if it was on, same as a
// plain click would have done), then dragging over other cells while still
// held applies that SAME mode to each one, instead of each cell toggling
// independently. A single click-no-drag still just toggles that one cell,
// since paint is applied once on pointerdown regardless of what happens
// after. The pointerup listener lives at module scope, attached once, not
// per-render — renderMasterMiniGrid() rebuilds every cell on every call, so
// anything attached inside it would otherwise pile up a new document-level
// listener per re-render.
let miniGridDragging = false;
let miniGridPaintMode = false;
document.addEventListener('pointerup', () => { miniGridDragging = false; });
document.addEventListener('pointercancel', () => { miniGridDragging = false; });

// ---------------- Mini-grid size (modal only — see .mini-grid-size-row's
// own CSS, hidden in the docked panel) ----------------
const MINI_GRID_SIZE_KEY = 'dts-mini-grid-size';
let miniGridSize = 1;
try {
  const saved = getInt(MINI_GRID_SIZE_KEY, NaN);
  if (saved >= 1 && saved <= 4) miniGridSize = saved;
} catch(e){}

function buildMiniGridSizeRow(): HTMLElement {
  const row = document.createElement('div');
  row.className = 'mini-grid-size-row';
  const label = document.createElement('span');
  label.textContent = 'Size';
  row.appendChild(label);
  for (let n = 1; n <= 4; n++){
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = n + 'x';
    btn.className = n === miniGridSize ? 'active' : '';
    btn.title = `${n}x thumbnail size`;
    btn.addEventListener('click', () => {
      miniGridSize = n;
      setInt(MINI_GRID_SIZE_KEY, n);
      masterMiniGrid.style.setProperty('--mini-grid-size', String(n));
      row.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    });
    row.appendChild(btn);
  }
  return row;
}

let getEntries: () => Entry[] = () => [];
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
let filteredEntriesRef: () => Entry[] = () => [];
let renderCurrentViewRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};
let getEntryMeta: () => Record<string, EntryMeta> = () => ({});
let saveEntryMetaRef: () => void = () => {};
let deleteEntriesPermanentlyRef: (entries: Entry[]) => Promise<number> = async () => 0;
let disableEntriesRef: (entries: Entry[]) => Promise<number> = async () => 0;
// Set inside initMasterTagControl once the immunize toggle buttons exist —
// updateMasterSelectionText runs before that on the very first call in some
// init orders, so this starts as a no-op rather than referencing buttons
// that aren't wired yet.
let refreshImmunizeTogglesRef: () => void = () => {};

export function updateMasterSelectionText(): void {
  if (masterSelectedImages.size === 0){
    masterSelectionSummary.textContent = 'No images selected yet.';
  } else {
    masterSelectionSummary.textContent = `${masterSelectedImages.size} image(s) selected.`;
  }
  refreshImmunizeTogglesRef();
}

export function renderMasterMiniGrid(): void {
  masterMiniGrid.innerHTML = '';
  masterMiniGrid.style.setProperty('--mini-grid-size', String(miniGridSize));
  masterMiniGrid.appendChild(buildMiniGridSizeRow());
  const list = filteredEntriesRef();
  list.forEach(e => {
    const cell = document.createElement('div');
    cell.className = 'master-mini-cell' + (masterSelectedImages.has(e.base) ? ' selected' : '');
    cell.dataset.base = e.base;
    const img = document.createElement('img');
    img.src = e.objectUrl;
    img.loading = 'lazy';
    img.draggable = false; // otherwise the browser's own "drag this image" ghost hijacks the drag-select gesture
    cell.appendChild(img);
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'master-mini-cb';
    cb.checked = masterSelectedImages.has(e.base);
    cb.addEventListener('click', (ev) => ev.stopPropagation());
    // Also stop pointerdown specifically — the cell's own pointerdown
    // (below) starts a drag-paint using cb.checked's CURRENT value as its
    // basis; without this, a direct click on the checkbox would both let
    // paint() flip it AND let the browser's native checkbox-click toggle
    // it back, landing on the wrong state and firing two conflicting
    // 'change' events.
    cb.addEventListener('pointerdown', (ev) => ev.stopPropagation());
    cb.addEventListener('change', () => {
      if (cb.checked) masterSelectedImages.add(e.base);
      else masterSelectedImages.delete(e.base);
      cell.classList.toggle('selected', cb.checked);
      updateMasterSelectionText();
      renderCurrentViewRef();
    });
    cell.appendChild(cb);
    function paint(): void {
      if (cb.checked === miniGridPaintMode) return;
      cb.checked = miniGridPaintMode;
      cb.dispatchEvent(new Event('change'));
    }
    cell.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return; // left button / primary touch only
      ev.preventDefault(); // suppress native text/image-drag so it can't hijack the gesture
      miniGridDragging = true;
      miniGridPaintMode = !cb.checked;
      paint();
    });
    cell.addEventListener('pointerenter', () => {
      if (!miniGridDragging) return;
      paint();
    });
    masterMiniGrid.appendChild(cell);
  });
}

export function syncMasterMiniGrid(): void {
  masterMiniGrid.querySelectorAll<HTMLElement>('.master-mini-cell').forEach(cell => {
    const base = cell.dataset.base!;
    const selected = masterSelectedImages.has(base);
    cell.classList.toggle('selected', selected);
    const cb = cell.querySelector('.master-mini-cb') as HTMLInputElement | null;
    if (cb) cb.checked = selected;
  });
}

export function renderMasterSelectionSummary(): void {
  updateMasterSelectionText();
  syncMasterMiniGrid();
}

interface MasterTagControlDeps {
  getEntries: () => Entry[];
  getEntryByBase: (base: string) => Entry | undefined;
  filteredEntries: () => Entry[];
  renderCurrentView: () => void;
  refreshAllUI: () => void;
  getEntryMeta: () => Record<string, EntryMeta>;
  saveEntryMeta: () => void;
  deleteEntriesPermanently: (entries: Entry[]) => Promise<number>;
  disableEntries: (entries: Entry[]) => Promise<number>;
  onStartSequential: (from: 'first' | 'selected') => void;
}

let onStartSequentialRef: (from: 'first' | 'selected') => void = () => {};

export function initMasterTagControl(deps: MasterTagControlDeps): void {
  getEntries = deps.getEntries;
  getEntryByBase = deps.getEntryByBase;
  filteredEntriesRef = deps.filteredEntries;
  renderCurrentViewRef = deps.renderCurrentView;
  refreshAllUIRef = deps.refreshAllUI;
  getEntryMeta = deps.getEntryMeta;
  saveEntryMetaRef = deps.saveEntryMeta;
  deleteEntriesPermanentlyRef = deps.deleteEntriesPermanently;
  disableEntriesRef = deps.disableEntries;
  onStartSequentialRef = deps.onStartSequential;

  // Both "Select all visible" and "Clear selection" hit the exact same
  // clip/wrap-against-#right's-overflow-x:hidden problem the sequential
  // buttons below were built to avoid from the start — hydrate these two
  // static HTML buttons with the same full-text/icon-only span pair instead
  // of leaving them as plain text nodes.
  attachIconFallback(btnMasterSelectAll, '☑');
  attachIconFallback(btnMasterClearSelection, '✖');

  // Sequential detail editing entry points — desktop-only (touch editing
  // lives in the card modal instead). Built in JS so neither shell's markup
  // changes; the shared .mtc-btn-row class keeps the spacing consistent.
  // Each button carries both a full-text label and an icon-only fallback —
  // "Sequential from first/selected" has no short form that still reads as
  // a sentence, so rather than let it clip against #right's own
  // overflow-x:hidden when the panel's dragged narrow (see styles.css's
  // #right container-type), CSS swaps to the icon-only span below a width
  // threshold instead. aria-label carries the real meaning either way, since
  // a screen reader shouldn't announce a different label depending on how
  // much pixel width happened to be available.
  if (!document.documentElement.classList.contains('touch-device')){
    const seqRow = document.createElement('div');
    seqRow.className = 'mtc-btn-row';
    function makeSeqBtn(label: string, icon: string, title: string, from: 'first' | 'selected'): HTMLButtonElement {
      const btn = document.createElement('button');
      btn.title = title;
      btn.dataset.iconLabel = '▶ ' + label;
      attachIconFallback(btn, icon);
      btn.addEventListener('click', () => onStartSequentialRef(from));
      return btn;
    }
    const seqFirstBtn = makeSeqBtn('Sequential from first', '⏮', 'Review every gallery image in sort order, confirming detail tags one by one', 'first');
    const seqSelBtn = makeSeqBtn('Sequential from selected', '🎯', 'Review from the first selected image in sort order', 'selected');
    seqRow.appendChild(seqFirstBtn);
    seqRow.appendChild(seqSelBtn);
    masterSelectionSummary.after(seqRow);
  }

  // These 9 plain "type a tag name" fields used to rely on a native
  // <datalist> (dataset-scoped only — no global vocabulary, no
  // definitions, and this WebView's own rendering of it was reported
  // covering the field on mobile) — see notes/Mobile-Port.md. Same styled,
  // global-vocabulary autocomplete every other tag input in the app uses.
  for (const inp of [
    masterApplyTagInput, masterRemoveTagInput, condSourceTag, condAddTag,
    condWithoutSourceTag, condWithoutAddTag, massApplyInput, massRemoveInput, masterRenameFrom
  ]) attachFillAutocomplete(inp);

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

  // Locking is the one selection-based action that's exempt from the
  // lock/mass-tool relationship it's managing — mass-LOCKING a hand-picked
  // selection is exactly how you'd want to lock a batch in the first place,
  // so this doesn't skip already-locked (or, for unlock, already-unlocked)
  // entries the way every other mass tool skips locked ones.
  function setLockedForSelection(locked: boolean): void {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const meta = getEntryMeta();
    let changed = 0;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) continue;
      if (!e.meta) e.meta = {};
      if (!!e.meta?.locked === locked) continue;
      e.meta.locked = locked;
      meta[e.base] = e.meta;
      changed++;
    }
    if (changed === 0){ toast(`Nothing to ${locked ? 'lock' : 'unlock'} — already ${locked ? 'locked' : 'unlocked'}.`); return; }
    saveEntryMetaRef();
    toast(`${locked ? 'Locked' : 'Unlocked'} ${changed} image(s).`);
    renderCurrentViewRef();
  }
  btnMasterLockSelected.addEventListener('click', () => setLockedForSelection(true));
  btnMasterUnlockSelected.addEventListener('click', () => setLockedForSelection(false));

  // Disable moves selected images to Disabled/ (soft, restorable — same
  // move the single-card 3-dot menu does, view.ts's moveEntry(e, true)).
  // Paired with Delete below since both are "get this out of my active set"
  // actions, just at different permanence levels. Locked images are
  // silently skipped, same convention as every other mass tool.
  btnMasterDisableSelected.addEventListener('click', async () => {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const total = masterSelectedImages.size;
    const entriesList = selectedEntries();
    const moved = await disableEntriesRef(entriesList);
    if (moved === 0){ toast('Nothing to disable — every selected image is already disabled or locked.'); return; }
    const skipped = total - moved;
    toast(skipped > 0
      ? `Disabled ${moved} image(s) — ${skipped} skipped (locked or already disabled).`
      : `Disabled ${moved} image(s).`, 3600);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  // Permanently deletes every selected image + its tags from disk — unlike
  // every other mass action here, there's no Undo for this one, so the
  // confirm modal names the exact count and is danger-styled. Locked images
  // are silently skipped (see deleteEntriesPermanently() in index.ts) same
  // as any other mass tool; the toast reports that split if it happened.
  btnMasterDeleteSelected.addEventListener('click', async () => {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const total = masterSelectedImages.size;
    const ok = await showConfirmModal(
      `Permanently delete ${total} selected image(s) and their tags? This cannot be undone — the files are removed from disk, not moved to Disabled/. Locked images will be skipped.`,
      { okLabel: `Delete ${total} permanently`, danger: true }
    );
    if (!ok) return;
    const entriesList = selectedEntries();
    const deleted = await deleteEntriesPermanentlyRef(entriesList);
    if (deleted === 0){ toast('Nothing deleted — every selected image is locked.'); return; }
    const skipped = total - deleted;
    toast(skipped > 0
      ? `Permanently deleted ${deleted} image(s) — ${skipped} skipped (locked).`
      : `Permanently deleted ${deleted} image(s).`, 3600);
    renderMasterSelectionSummary();
    renderCurrentViewRef();
  });

  // Merge Immunize / Antivoid — a PERMANENT per-image exception to the
  // Retroactive Merge/Void dock's standing rules (canonical-tags.ts), unlike
  // Lock which only skips mass tools in general. "Antimmunize" is a
  // convenience shortcut that sets/clears both flags together, not a third
  // independent flag — see canonical-tags.ts's applyCanonicalRules() for
  // where these are actually checked.
  function setEntryFlagsForSelection(flags: Record<string, boolean>, actionLabel: string): void {
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    const meta = getEntryMeta();
    let changed = 0;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) continue;
      if (!e.meta) e.meta = {};
      const keys = Object.keys(flags);
      if (keys.every(k => !!(e.meta as Record<string, unknown>)[k] === flags[k])) continue;
      for (const k of keys) (e.meta as Record<string, unknown>)[k] = flags[k];
      meta[e.base] = e.meta;
      changed++;
    }
    if (changed === 0){ toast(`Nothing to change — already ${actionLabel}.`); return; }
    saveEntryMetaRef();
    toast(`${actionLabel[0].toUpperCase()}${actionLabel.slice(1)} ${changed} image(s).`);
    renderCurrentViewRef();
  }

  // Each pair of "Merge Immunize"/"Un-immunize" style buttons collapsed into
  // one toggle: label and title flip based on whether every CURRENTLY
  // selected image already carries the flag(s), same tri-state-checkbox
  // convention as most mass toggles. Mixed selections (some flagged, some
  // not) read as "off" — clicking sets the flag on all of them, which is the
  // useful behavior for a mixed batch (a second click then clears it once
  // they're uniform). refreshImmunizeToggles() re-evaluates the labels on
  // every selection change (called from updateMasterSelectionText below),
  // so they stay accurate as the user clicks through the gallery.
  function computeAllHaveFlags(flags: string[]): boolean {
    if (masterSelectedImages.size === 0) return false;
    for (const base of masterSelectedImages){
      const e = getEntryByBase(base);
      if (!e) return false;
      for (const f of flags){
        if (!(e.meta as Record<string, unknown> | undefined)?.[f]) return false;
      }
    }
    return true;
  }
  interface ImmunizeToggle {
    btn: HTMLButtonElement;
    flags: string[];
    offLabel: string; onLabel: string;
    offTitle: string; onTitle: string;
    onActionLabel: string; offActionLabel: string;
  }
  const immunizeToggles: ImmunizeToggle[] = [
    {
      btn: btnMasterMergeImmunizeToggle, flags: ['mergeImmune'],
      offLabel: '🚫 Merge Immunize', onLabel: '↩ Un-immunize',
      offTitle: 'Merge rules will never rewrite tags on the selected images',
      onTitle: 'Remove Merge Immunize from the selected images',
      onActionLabel: 'merge immunized', offActionLabel: 'un-merge-immunized'
    },
    {
      btn: btnMasterAntivoidToggle, flags: ['antivoid'],
      offLabel: '🟢 Antivoid', onLabel: '↩ Un-antivoid',
      offTitle: 'Void rules will never remove tags from the selected images',
      onTitle: 'Remove Antivoid from the selected images',
      onActionLabel: 'antivoided', offActionLabel: 'un-antivoided'
    },
    {
      btn: btnMasterAntimmunizeToggle, flags: ['mergeImmune', 'antivoid'],
      offLabel: '✋ Antimmunize', onLabel: '↩ Un-antimmunize',
      offTitle: 'Shortcut for both Merge Immunize AND Antivoid at once, on the selected images',
      onTitle: 'Clear both Merge Immunize and Antivoid from the selected images',
      onActionLabel: 'antimmunized', offActionLabel: 'un-antimmunized'
    }
  ];
  function refreshImmunizeToggles(): void {
    for (const t of immunizeToggles){
      const allOn = computeAllHaveFlags(t.flags);
      setIconLabel(t.btn, allOn ? t.onLabel : t.offLabel);
      t.btn.title = allOn ? t.onTitle : t.offTitle;
      t.btn.classList.toggle('ghost-secondary', allOn);
    }
  }
  refreshImmunizeTogglesRef = refreshImmunizeToggles;
  for (const t of immunizeToggles){
    t.btn.addEventListener('click', () => {
      const turnOn = !computeAllHaveFlags(t.flags);
      const flagsObj: Record<string, boolean> = {};
      for (const f of t.flags) flagsObj[f] = turnOn;
      setEntryFlagsForSelection(flagsObj, turnOn ? t.onActionLabel : t.offActionLabel);
      refreshImmunizeToggles();
    });
  }
  refreshImmunizeToggles();

  function selectedEntries(): Entry[] {
    return Array.from(masterSelectedImages).map(base => getEntryByBase(base)).filter((e): e is Entry => !!e);
  }

  // Tag inputs are normalized the same way on every bulk op (underscores ->
  // spaces, collapse runs, trim) — one reader keeps them consistent.
  const readTag = (el: HTMLInputElement): string => el.value.trim().replace(/_/g, ' ').replace(/\s+/g, ' ');

  // The shared skeleton every bulk tag op below follows: filter the target
  // entries, snapshot + mutate + markDirty each, then report ONCE (one toast,
  // one edit-log/undo entry, one master_ops stat bump) and refresh. Collapsing
  // the eight handlers onto this keeps their reporting identical and stops the
  // skip-predicate/summary logic from drifting between near-duplicate copies.
  function runMassTagOp(opts: {
    entries: Entry[];
    skip: (e: Entry) => boolean;
    apply: (e: Entry) => void;
    logType: string;
    summary: (count: number) => string;
    emptyMsg: string;
    clearInputs?: () => void;
    statKey?: string;
  }): void {
    const affected: EditLogAffected[] = [];
    for (const e of opts.entries) {
      if (opts.skip(e)) continue;
      const prevTags = e.tags.slice();
      opts.apply(e);
      markDirty(e);
      affected.push({ base: e.base, prevTags, newTags: e.tags.slice() });
    }
    if (affected.length === 0) { toast(opts.emptyMsg); return; }
    const summary = opts.summary(affected.length);
    toast(summary);
    recordChange(opts.logType, summary, affected);
    folderStats.master_ops = (folderStats.master_ops || 0) + 1;
    saveFolderStats();
    if (opts.statKey) trackStat(opts.statKey);
    if (opts.clearInputs) opts.clearInputs();
    refreshAllUIRef();
    checkAchievements();
  }

  btnMasterApplyToSelected.addEventListener('click', () => {
    const tag = readTag(masterApplyTagInput);
    if (!tag){ toast('Enter a tag to apply.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    runMassTagOp({
      entries: selectedEntries(),
      skip: e => !!e.meta?.locked || e.tags.includes(tag),
      apply: e => { e.tags.push(tag); },
      logType: 'add-tag',
      summary: n => `Applied "${tag}" to ${n} selected image(s).`,
      emptyMsg: 'Nothing to apply — selected images already have that tag.',
      clearInputs: () => { masterApplyTagInput.value = ''; }
    });
  });

  btnMasterRemoveFromSelected.addEventListener('click', () => {
    const tag = readTag(masterRemoveTagInput);
    if (!tag){ toast('Enter a tag to remove.'); return; }
    if (masterSelectedImages.size === 0){ toast('Select at least one image first.'); return; }
    runMassTagOp({
      entries: selectedEntries(),
      skip: e => !!e.meta?.locked || !e.tags.includes(tag),
      apply: e => { e.tags = e.tags.filter(t => t !== tag); },
      logType: 'remove-tag',
      summary: n => `Removed "${tag}" from ${n} selected image(s).`,
      emptyMsg: 'None of the selected images have that tag.',
      clearInputs: () => { masterRemoveTagInput.value = ''; }
    });
  });

  btnCondApply.addEventListener('click', () => {
    const sourceTag = readTag(condSourceTag);
    const addTag = readTag(condAddTag);
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || !e.tags.includes(sourceTag) || e.tags.includes(addTag),
      apply: e => { e.tags.push(addTag); },
      logType: 'add-tag',
      summary: n => `Added "${addTag}" to every image with "${sourceTag}" (${n} image(s)).`,
      emptyMsg: `No images with "${sourceTag}" are missing "${addTag}".`,
      clearInputs: () => { condSourceTag.value = ''; condAddTag.value = ''; }
    });
  });

  btnCondApplyWithout.addEventListener('click', () => {
    const sourceTag = readTag(condWithoutSourceTag);
    const addTag = readTag(condWithoutAddTag);
    if (!sourceTag || !addTag){ toast('Fill in both tags.'); return; }
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || e.tags.includes(sourceTag) || e.tags.includes(addTag),
      apply: e => { e.tags.push(addTag); },
      logType: 'add-tag',
      summary: n => `Added "${addTag}" to every image WITHOUT "${sourceTag}" (${n} image(s)).`,
      emptyMsg: `No images without "${sourceTag}" are missing "${addTag}".`,
      clearInputs: () => { condWithoutSourceTag.value = ''; condWithoutAddTag.value = ''; }
    });
  });

  btnMassApply.addEventListener('click', async () => {
    const tag = readTag(massApplyInput);
    if (!tag){ toast('Enter a tag to apply.'); return; }
    const ok = await showConfirmModal(`Add "${tag}" to EVERY active image in this folder?`, { okLabel: 'Apply to all' });
    if (!ok) return;
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || e.tags.includes(tag),
      apply: e => { e.tags.push(tag); },
      logType: 'add-tag',
      summary: n => `Added "${tag}" to all ${n} image(s).`,
      emptyMsg: 'Every image already has that tag.',
      clearInputs: () => { massApplyInput.value = ''; }
    });
  });

  btnMassRemove.addEventListener('click', async () => {
    const tag = readTag(massRemoveInput);
    if (!tag){ toast('Enter a tag to remove.'); return; }
    const ok = await showConfirmModal(`Remove "${tag}" from EVERY active image in this folder?`, { okLabel: 'Remove from all', danger: true });
    if (!ok) return;
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || !e.tags.includes(tag),
      apply: e => { e.tags = e.tags.filter(t => t !== tag); },
      logType: 'remove-tag',
      summary: n => `Removed "${tag}" from all ${n} image(s).`,
      emptyMsg: 'No images have that tag.',
      clearInputs: () => { massRemoveInput.value = ''; }
    });
  });

  btnMasterRename.addEventListener('click', () => {
    const from = masterRenameFrom.value.trim();
    const to = masterRenameTo.value.trim();
    if (!from || !to){ toast('Enter both a tag to rename and its replacement.'); return; }
    if (from === to){ toast('New name is the same as the old one.'); return; }
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || !e.tags.includes(from),
      apply: e => { e.tags = Array.from(new Set(e.tags.map(t => t === from ? to : t))); },
      logType: 'rename',
      summary: n => `Renamed "${from}" → "${to}" across ${n} image(s).`,
      emptyMsg: `No active images currently have the tag "${from}".`,
      statKey: 'renames',
      clearInputs: () => { masterRenameFrom.value = ''; masterRenameTo.value = ''; }
    });
  });

  btnMasterFR.addEventListener('click', () => {
    const find = masterFRFind.value;
    const repl = masterFRReplace.value;
    if (!find){ toast('Enter a substring to find.'); return; }
    runMassTagOp({
      entries: getEntries(),
      skip: e => e.disabled || !!e.meta?.locked || !e.tags.some(t => t.includes(find)),
      apply: e => {
        const replaced = e.tags.map(t => t.includes(find) ? t.split(find).join(repl) : t);
        e.tags = Array.from(new Set(replaced.map(t => t.trim()).filter(Boolean)));
      },
      logType: 'find-replace',
      summary: n => `Replaced "${find}" → "${repl}" inside tags across ${n} image(s).`,
      emptyMsg: `No tags contain "${find}".`,
      statKey: 'find_replaces',
      clearInputs: () => { masterFRFind.value = ''; masterFRReplace.value = ''; }
    });
  });
}
