import type { EditLogEntry, EditLogAffected, Entry, DirHandle, ChangeRecord } from './types';
import { hasSaveFilePicker, pickSaveFile, writeBytes } from './fs-access';
import {
  btnLog, logPanel, logPanelTitle, logList, btnExportLog, btnClearLog, logCloseBtn,
  logTypeDropdown, logOrderBtn, logPager,
  favoritesPanel, achievementsPanel, shopPanel, tagDetailsPanel,
  statsChartWrap, statsLegend, statsTotals, statsViewPie, statsViewBar
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, showPromptModal, createModalShell, showImageLightbox, buildPersistentDropdown } from './shared-ui';
import { folderUnlocked } from './achievements';
import { setIconLabel, iconSvg } from './icons';

export let editLog: EditLogEntry[] = [];
export let logIdCounter = 1;
let statsChartMode: 'pie' | 'bar' = 'pie';

// Log-panel view state. `editLog` itself stays append-order (oldest first);
// ordering/filtering is applied per render and never mutates the log.
// - `logTypeFilter`: '' = All edit types, else one raw log type to show.
// - `logOrder`: only recency — newest or oldest first (the separate toggle).
let logTypeFilter = '';
let logOrder: 'newest' | 'oldest' = 'newest';
let logPage = 1;
const LOG_PAGE_SIZE = 25;

// Pixel-edit log types (crop/rotate). Byte payloads live in tags-edit.ts's
// session-only pixelStates map keyed by log entry id — the persisted entries
// carry metadata alone, so the log file never bloats with image data.
export const PIXEL_TYPES = new Set(['crop-image', 'rotate-image']);

// Isolated-file creations. Same session-bytes pattern as PIXEL_TYPES (see
// tags-edit.ts's isolateStates), but undo means deleting the created file
// and redo means re-creating it — a different applier, hence its own set.
export const ISOLATE_TYPES = new Set(['isolate-image']);

// Review-flag clearing ("Mark reviewed" on the left panel's flagged-tags
// list). Swaps entry.meta.flaggedTags, NOT entry.tags — so it can't ride the
// TAG_TYPES/applyTagDirection path; its own applier is injected instead.
// 'ghost-remove' (deleting a past-tag ghost chip) swaps meta.ghostDismissed
// the same way and shares the applier.
export const REVIEW_TYPES = new Set(['unflag-review', 'ghost-remove']);

// The remaining action-bearing types. Every one of these opens the per-image
// stack modal (a log entry is never undone/redone as one bundled batch):
// tag-content swaps / single-entry disable-restore / batch file renames.
const TAG_TYPES = new Set(['add-tag', 'remove-tag', 'merge', 'void', 'rename', 'find-replace', 'reset-edits', 'unmerge', 'unvoid']);
const MOVE_TYPES = new Set(['disable', 'restore']);
const RENAME_TYPES = new Set(['rename-files']);

const LOG_FILE_NAME = '_tag_edit_log.json';

interface EditLogDeps {
  getDirHandle: () => DirHandle | null;
  applyTagDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number;
  applyRenameDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number>;
  applyPixelDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number>;
  applyIsolateDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number>;
  applyFlaggedReviewDirection: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number;
  moveEntry: (entry: Entry, toDisabled: boolean) => Promise<void>;
  trackStat: (key: string, amount?: number) => void;
  checkAchievements: () => void;
  refreshAllUI: () => void;
  getUndoStack: () => ChangeRecord[];
  getRedoStack: () => ChangeRecord[];
  // Resolve an affected row to its loaded image, or undefined when the image
  // is gone (tags-edit.ts entryForAffected). The stack modal greys out a
  // missing image's own undo/redo and shows "Image not found in Dataset".
  resolveAffected: (a: EditLogAffected) => Entry | undefined;
  setUndoRuleTags: (rec: EditLogEntry, active: boolean) => void;
}

let getDirHandle: () => DirHandle | null = () => null;
let applyTagDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number = () => 0;
let applyRenameDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number> = async () => 0;
let applyPixelDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number> = async () => 0;
let applyIsolateDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => Promise<number> = async () => 0;
let applyFlaggedReviewDirectionRef: (affected: EditLogAffected[], direction: 'undo' | 'redo') => number = () => 0;
let moveEntryRef: (entry: Entry, toDisabled: boolean) => Promise<void> = async () => {};
let trackStatRef: (key: string, amount?: number) => void = () => {};
let checkAchievementsRef: () => void = () => {};
let refreshAllUIRef: () => void = () => {};
let getUndoStack: () => ChangeRecord[] = () => [];
let getRedoStack: () => ChangeRecord[] = () => [];
let resolveAffected: (a: EditLogAffected) => Entry | undefined = () => undefined;
let setUndoRuleTagsRef: (rec: EditLogEntry, active: boolean) => void = () => {};

export function pushLogEntry(partial: { type: string; summary: string; affected?: EditLogAffected[] }): EditLogEntry {
  const entry: EditLogEntry = {
    ...partial,
    id: logIdCounter++,
    ts: Date.now(),
    type: partial.type,
    summary: partial.summary,
    // Own a copy of every affected row: callers (and the undo/redo stacks)
    // keep their own references, and undo/redo log entries reuse the source
    // record's array — sharing one mutable object across all of them meant a
    // single later mutation would silently rewrite history everywhere.
    affected: (partial.affected || []).map((a) => ({ ...a }))
  };
  editLog.push(entry);
  updateLogButton();
  saveEditLog();
  if (logPanel.style.display === 'flex') renderLogPanel();
  return entry;
}

// Autosave is fire-and-forget and called on every push, so it coalesces and
// serializes: only one write runs at a time (Chromium's createWritable() is
// exclusive — a concurrent second call rejects and the old empty catch
// swallowed it, so the newest entries could fail to reach disk), and per
// folder only the newest snapshot is kept (each write is the WHOLE log, so
// intermediate snapshots are redundant). Handle + snapshot are captured
// synchronously at call time, keyed by folder, so a mid-write folder switch
// neither redirects one folder's log into another's file nor drops the
// folder it switched away from.
let logSaveInFlight = false;
const pendingLogSaves = new Map<DirHandle, string>();

export function saveEditLog(): void {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  let data: string;
  try { data = JSON.stringify(editLog, null, 2); } catch { return; }
  pendingLogSaves.set(dirHandle, data);
  void flushLogSave();
}

async function flushLogSave(): Promise<void> {
  if (logSaveInFlight) return;
  logSaveInFlight = true;
  try {
    while (pendingLogSaves.size) {
      const next = pendingLogSaves.entries().next();
      if (next.done) break;
      const [dirHandle, data] = next.value;
      pendingLogSaves.delete(dirHandle);
      try {
        const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: true });
        await writeBytes(handle, data);
      } catch {
        // best-effort autosave
      }
    }
  } finally {
    logSaveInFlight = false;
  }
}

export async function loadEditLogForFolder(): Promise<void> {
  editLog = [];
  logIdCounter = 1;
  const dirHandle = getDirHandle();
  if (!dirHandle) {
    updateLogButton();
    return;
  }
  try {
    const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: false });
    const file = await handle.getFile();
    const parsed = JSON.parse((await file.text()).trim() || '[]');
    if (Array.isArray(parsed)) editLog = parsed;
    logIdCounter = editLog.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
  } catch {
    editLog = [];
    logIdCounter = 1;
  }
  updateLogButton();
}

export function updateLogButton(): void {
  setIconLabel(btnLog, getDirHandle() ? `📜 Log (${editLog.length})` : '📜 Log');
}

function formatLogTime(ts: number): string {
  try { return new Date(ts).toLocaleString(); } catch { return ''; }
}

// A log row's "Show affected image" chevron, opening the image in the same
// fullscreen lightbox every other image surface uses. Returns null when the
// image is gone (or has no preview) — nothing to show, so no control.
function affectedImageButton(entry: Entry | undefined): HTMLButtonElement | null {
  if (!entry || !entry.objectUrl) return null;
  const btn = document.createElement('button');
  btn.className = 'log-show-image-btn';
  btn.title = 'Show the image this edit affected in the lightbox';
  setIconLabel(btn, '▸ Show affected image');
  btn.addEventListener('click', () => showImageLightbox(entry.objectUrl));
  return btn;
}

// ---------------- Editing Stats tab (charts) ----------------

const STAT_CHART_COLORS: Record<string, string> = {
  'add-tag': '#6fb8d1', 'remove-tag': '#e2637a', 'merge': '#e8a33d', 'void': '#c1443c',
  'rename': '#7fbf8f', 'find-replace': '#a683e0', 'disable': '#8a6f57', 'restore': '#4fae7a',
  'undo': '#9791a6', 'redo': '#6b6578', 'unmerge': '#d9b35c', 'unvoid': '#5cb9a8', 'rule-update': '#8a8fd9',
  'delete': '#c1443c', 'rename-files': '#4a9fd1', 'crop-image': '#3aa655', 'rotate-image': '#7a9fd1',
  'isolate-image': '#b57edc', 'unflag-review': '#e8a33d', 'ghost-remove': '#9791a6', 'rule-sweep': '#b98fd6',
  'reset-edits': '#c98ed6'
};
const STAT_TYPE_LABEL: Record<string, string> = {
  'add-tag': 'Tags added', 'remove-tag': 'Tags removed', 'merge': 'Merges', 'void': 'Voids',
  'rename': 'Renames', 'find-replace': 'Find & replace', 'disable': 'Disabled', 'restore': 'Restored',
  'undo': 'Undos', 'redo': 'Redos', 'unmerge': 'Unmerges', 'unvoid': 'Unvoids', 'rule-update': 'Rule changes',
  'delete': 'Deleted permanently', 'rename-files': 'Files renamed',
  'crop-image': 'Crops', 'rotate-image': 'Rotates', 'isolate-image': 'Isolates',
  'unflag-review': 'Review flags cleared',
  'ghost-remove': 'Past tags deleted',
  'rule-sweep': 'Rules applied',
  'reset-edits': 'Resets'
};

function computeStatsBreakdown(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of editLog) {
    // hasOwnProperty, not `in`: `in` walks the prototype chain, so a
    // hand-edited/shared _tag_edit_log.json with type "constructor" would
    // otherwise pass and leak an inherited function as the label/color.
    if (!Object.prototype.hasOwnProperty.call(STAT_TYPE_LABEL, entry.type)) continue;
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  }
  return counts;
}

function animateCountUp(el: HTMLElement, target: number, duration = 600): void {
  const start = 0;
  const startTime = performance.now();
  function tick(now: number): void {
    const p = Math.min(1, (now - startTime) / duration);
    el.textContent = String(Math.round(start + (target - start) * p));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function renderStatsTab(): void {
  const counts = computeStatsBreakdown();
  const entriesArr = Object.entries(counts).filter(([, v]) => v > 0);
  const total = entriesArr.reduce((s, [, v]) => s + v, 0);

  statsChartWrap.innerHTML = '';
  statsLegend.innerHTML = '';
  statsTotals.innerHTML = '';

  if (total === 0) {
    statsChartWrap.innerHTML = '<div class="stats-empty">No edits logged yet in this folder — make some changes, then check back here.</div>';
    return;
  }

  entriesArr.sort((a, b) => b[1] - a[1]);

  if (statsChartMode === 'pie') {
    const size = 240, r = 100, cx = size / 2, cy = size / 2;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-elevated)" stroke-width="34"/>`;
    entriesArr.forEach(([type, count], i) => {
      const frac = count / total;
      const dash = frac * circumference;
      const color = STAT_CHART_COLORS[type] || '#888';
      svg += `<circle class="pie-slice" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="34"
        stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}"
        transform="rotate(-90 ${cx} ${cy})" style="animation: pieReveal 0.8s ease ${i * 0.08}s both;"/>`;
      offset += dash;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="${r - 34}" fill="var(--bg-panel)"/>`;
    svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="22" font-weight="600" font-family="var(--mono)">${total}</text>`;
    svg += `<text x="${cx}" y="${cy + 20}" text-anchor="middle" fill="var(--text-faint)" font-size="10">edits</text>`;
    svg += `</svg>`;
    statsChartWrap.innerHTML = svg;
  } else {
    const wrap = document.createElement('div');
    wrap.style.minWidth = '360px';
    const maxCount = entriesArr[0][1];
    entriesArr.forEach(([type, count], i) => {
      const pct = ((count / total) * 100).toFixed(1);
      const barWidthPct = (count / maxCount) * 100;
      const color = STAT_CHART_COLORS[type] || '#888';
      const row = document.createElement('div');
      row.className = 'stat-bar-row';
      row.innerHTML = `
        <div class="stat-bar-label">${STAT_TYPE_LABEL[type] || type}</div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${barWidthPct}%; background:${color}; animation-delay:${i * 0.06}s;"></div></div>
        <div class="stat-bar-value">${count} (${pct}%)</div>
      `;
      wrap.appendChild(row);
    });
    statsChartWrap.appendChild(wrap);
  }

  for (const [type, count] of entriesArr) {
    const pct = ((count / total) * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'stats-legend-row';
    const swatch = document.createElement('span');
    swatch.className = 'stats-legend-swatch';
    swatch.style.background = STAT_CHART_COLORS[type] || '#888';
    const label = document.createElement('span');
    label.className = 'stats-legend-label';
    label.textContent = STAT_TYPE_LABEL[type] || type;
    const value = document.createElement('span');
    value.className = 'stats-legend-value';
    value.textContent = `${count} · ${pct}%`;
    row.appendChild(swatch); row.appendChild(label); row.appendChild(value);
    statsLegend.appendChild(row);
  }

  const totalCards: [string, number][] = [
    ['Total logged edits', total],
    ['Undo stack depth', getUndoStack().length],
    ['Redo stack depth', getRedoStack().length],
    ['Achievements unlocked', folderUnlocked.length]
  ];
  for (const [label, value] of totalCards) {
    const card = document.createElement('div');
    card.className = 'stats-total-card';
    const num = document.createElement('div');
    num.className = 'num';
    const lbl = document.createElement('div');
    lbl.className = 'lbl';
    lbl.textContent = label;
    card.appendChild(num);
    card.appendChild(lbl);
    statsTotals.appendChild(card);
    animateCountUp(num, value);
  }
}

export function renderLogPanel(): void {
  const dirHandle = getDirHandle();
  logPanelTitle.textContent = dirHandle ? `Edit log — ${dirHandle.name}` : 'Edit log';
  logList.innerHTML = '';
  logPager.innerHTML = '';
  if (editLog.length === 0) {
    logList.innerHTML = '<div class="log-empty">No edits logged yet for this folder.</div>';
    return;
  }
  const ordered = orderedLog();
  if (ordered.length === 0) {
    logList.innerHTML = `<div class="log-empty">No ${STAT_TYPE_LABEL[logTypeFilter] || logTypeFilter} edits logged yet.</div>`;
    return;
  }
  const totalPages = Math.max(1, Math.ceil(ordered.length / LOG_PAGE_SIZE));
  if (logPage > totalPages) logPage = totalPages;
  if (logPage < 1) logPage = 1;
  const pageEntries = ordered.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
  for (const logEntry of pageEntries) {
    const row = document.createElement('div');
    row.className = 'log-row';

    const meta = document.createElement('div');
    meta.className = 'log-meta';
    const time = document.createElement('span');
    time.className = 'log-time';
    time.textContent = formatLogTime(logEntry.ts);
    const type = document.createElement('span');
    type.className = 'log-type';
    type.textContent = logEntry.type;
    meta.appendChild(time);
    meta.appendChild(type);

    const summary = document.createElement('div');
    summary.className = 'log-summary';
    summary.textContent = logEntry.summary;

    row.appendChild(meta);
    row.appendChild(summary);

    // Action-bearing entries: a single-image edit keeps the standard inline
    // Undo/Redo pair (greyed, with a warning, when its image is gone). A bulk
    // edit is never bundled — a chevron opens the per-image stack modal.
    if (logEntry.affected && logEntry.affected.length && logEntryHasActions(logEntry)) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      if (logEntry.affected.length === 1) {
        const a = logEntry.affected[0];
        const entry = resolveAffected(a);
        if (MOVE_TYPES.has(logEntry.type)) {
          const toggleBtn = document.createElement('button');
          toggleBtn.textContent = logEntry.type === 'disable' ? 'Restore image' : 'Disable image again';
          toggleBtn.className = 'primary';
          toggleBtn.disabled = !entry;
          toggleBtn.addEventListener('click', async () => {
            if (!entry) return;
            toggleBtn.disabled = true;
            await toggleAffectedMove(logEntry, entry);
            renderLogPanel();
          });
          actions.appendChild(toggleBtn);
        } else {
          const undoBtn = document.createElement('button');
          setIconLabel(undoBtn, '↩ Undo this');
          undoBtn.disabled = !entry;
          undoBtn.addEventListener('click', () => { void runAffected(logEntry, a, 'undo', () => {}); });
          const redoBtn = document.createElement('button');
          setIconLabel(redoBtn, '↪ Redo this');
          redoBtn.className = 'primary';
          redoBtn.disabled = !entry;
          redoBtn.addEventListener('click', () => { void runAffected(logEntry, a, 'redo', () => {}); });
          actions.appendChild(undoBtn);
          actions.appendChild(redoBtn);
        }
        const showImg = affectedImageButton(entry);
        if (showImg) actions.insertBefore(showImg, actions.firstChild);
        row.appendChild(actions);
        if (!entry){
          const warn = document.createElement('div');
          warn.className = 'log-missing-warn';
          setIconLabel(warn, '⚠️ Image not found in Dataset');
          row.appendChild(warn);
        }
      } else {
        const chevron = document.createElement('button');
        chevron.className = 'log-stack-btn';
        chevron.title = 'Show each image in this edit and undo/redo them individually';
        setIconLabel(chevron, `▸ ${logEntry.affected.length} images`);
        chevron.addEventListener('click', () => openLogStackModal(logEntry));
        actions.appendChild(chevron);
        row.appendChild(actions);
      }
    }

    logList.appendChild(row);
  }
  renderPager(totalPages);
}

// A view of the log: filtered to the selected edit type (if any), then ordered
// by recency. Never mutates editLog (append-order = oldest first).
function orderedLog(): EditLogEntry[] {
  const arr = editLog.filter(e => !logTypeFilter || e.type === logTypeFilter);
  return logOrder === 'oldest' ? arr : arr.reverse();
}

// Page buttons: 1..5, then "…", then the last page — the window slides so the
// current page is always among the five; "…" (a gap) opens a jump-to-page
// prompt. At most 7 buttons. -1 marks a gap.
function pagerPages(total: number, current: number): number[] {
  if (total <= 7){
    const all: number[] = [];
    for (let p = 1; p <= total; p++) all.push(p);
    return all;
  }
  const start = Math.min(Math.max(current - 2, 1), total - 4);
  const pages: number[] = [];
  if (start > 1){
    pages.push(1);
    if (start > 2) pages.push(-1);
  }
  for (let p = start; p < start + 5; p++) pages.push(p);
  if (start + 4 < total){
    if (start + 4 < total - 1) pages.push(-1);
    pages.push(total);
  }
  return pages;
}

function renderPager(totalPages: number): void {
  logPager.innerHTML = '';
  if (totalPages <= 1) return;
  for (const p of pagerPages(totalPages, logPage)){
    const btn = document.createElement('button');
    if (p === -1){
      btn.className = 'log-page log-page-gap';
      btn.textContent = '…';
      btn.title = 'Jump to page';
      btn.addEventListener('click', () => { void jumpToLogPage(totalPages); });
    } else {
      btn.className = 'log-page' + (p === logPage ? ' active' : '');
      btn.textContent = String(p);
      btn.title = `Page ${p}`;
      btn.addEventListener('click', () => { logPage = p; renderLogPanel(); });
    }
    logPager.appendChild(btn);
  }
}

async function jumpToLogPage(totalPages: number): Promise<void> {
  const v = await showPromptModal(`Jump to page (1–${totalPages})`, { okLabel: 'Go', value: String(logPage) });
  if (v == null) return;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return;
  const next = Math.min(totalPages, Math.max(1, n));
  if (next === logPage) return;
  logPage = next;
  renderLogPanel();
}

type LogDirection = 'undo' | 'redo';

// Which entries open the per-image stack modal.
function logEntryHasActions(logEntry: EditLogEntry): boolean {
  return TAG_TYPES.has(logEntry.type) || MOVE_TYPES.has(logEntry.type) ||
    RENAME_TYPES.has(logEntry.type) || PIXEL_TYPES.has(logEntry.type) ||
    ISOLATE_TYPES.has(logEntry.type) || REVIEW_TYPES.has(logEntry.type);
}

// Apply one direction to ONE affected row. A whole log entry is never applied
// as a bundle — openLogStackModal() splits it into per-image actions.
async function applyAffectedDirection(logEntry: EditLogEntry, a: EditLogAffected, direction: LogDirection): Promise<number> {
  const one = [a];
  if (PIXEL_TYPES.has(logEntry.type)) return applyPixelDirectionRef(one, direction);
  if (ISOLATE_TYPES.has(logEntry.type)) return applyIsolateDirectionRef(one, direction);
  if (REVIEW_TYPES.has(logEntry.type)) return applyFlaggedReviewDirectionRef(one, direction);
  if (RENAME_TYPES.has(logEntry.type)) return applyRenameDirectionRef(one, direction);
  return applyTagDirectionRef(one, direction);
}

// Move/Restore is a toggle, not a tag swap: a 'disable' entry restores, a
// 'restore' entry disables again.
async function toggleAffectedMove(logEntry: EditLogEntry, e: Entry): Promise<void> {
  const shouldBeDisabled = logEntry.type !== 'disable';
  if (e.disabled === shouldBeDisabled) { toast('Already in that state.'); return; }
  await moveEntryRef(e, shouldBeDisabled);
}

// The per-affected-row action buttons (a Move/Restore toggle, or the ↩/↪
// pair), shared by the per-image stack modal and the per-image history modal.
// `entry` is the resolved image (undefined = gone, so the buttons are disabled).
// `after` runs post-action so each caller can re-render itself.
function buildAffectedActionButtons(logEntry: EditLogEntry, a: EditLogAffected, entry: Entry | undefined, after: () => void): HTMLElement {
  const btns = document.createElement('div');
  btns.className = 'log-stack-actions';
  if (MOVE_TYPES.has(logEntry.type)){
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = logEntry.type === 'disable' ? 'Restore image' : 'Disable image again';
    toggleBtn.className = 'primary';
    toggleBtn.disabled = !entry;
    toggleBtn.addEventListener('click', async () => {
      if (!entry) return;
      toggleBtn.disabled = true;
      await toggleAffectedMove(logEntry, entry);
      renderLogPanel();
      after();
    });
    btns.appendChild(toggleBtn);
  } else {
    const undoBtn = document.createElement('button');
    setIconLabel(undoBtn, '↩ Undo');
    undoBtn.disabled = !entry;
    undoBtn.addEventListener('click', () => { void runAffected(logEntry, a, 'undo', after); });
    const redoBtn = document.createElement('button');
    setIconLabel(redoBtn, '↪ Redo');
    redoBtn.className = 'primary';
    redoBtn.disabled = !entry;
    redoBtn.addEventListener('click', () => { void runAffected(logEntry, a, 'redo', after); });
    btns.appendChild(undoBtn);
    btns.appendChild(redoBtn);
  }
  return btns;
}

// Run one per-image action, log/stat it, then refresh the panel and the open
// modal.
async function runAffected(logEntry: EditLogEntry, a: EditLogAffected, direction: LogDirection, after: () => void): Promise<void> {
  // A Merge/Void's standing rule: paused before an undo, resumed after a redo
  // (canonical-tags.ts setUndoRuleTags), or it re-applies the edit straight away.
  if (direction === 'undo') setUndoRuleTagsRef(logEntry, false);
  const count = await applyAffectedDirection(logEntry, a, direction);
  if (direction === 'redo') setUndoRuleTagsRef(logEntry, true);
  // A missing image's buttons are disabled, so a 0 here means the edit's own
  // data is gone (e.g. a pixel/isolate edit's session-only before/after bytes).
  if (count === 0){ toast(`Nothing changed: this image is already ${direction === 'undo' ? 'without' : 'with'} that edit (or its data is gone).`, 3600); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({ type: direction, summary: `${verb} (from log): ${logEntry.summary}`, affected: [a] });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} that edit.`);
  refreshAllUIRef();
  renderLogPanel();
  after();
  checkAchievementsRef();
}

// The per-image stack modal: every affected image in processing order, each
// with its own undo/redo (disabled, with a warning, when that image is gone).
function openLogStackModal(logEntry: EditLogEntry): void {
  const { box, close } = createModalShell({ boxClassName: 'log-stack-box' });

  const head = document.createElement('div');
  head.className = 'info-modal-title';
  head.textContent = `Edit stack — ${logEntry.type}`;
  box.appendChild(head);

  const sub = document.createElement('div');
  sub.className = 'log-stack-sub';
  sub.textContent = logEntry.summary;
  box.appendChild(sub);

  const list = document.createElement('div');
  list.className = 'log-stack-list';
  box.appendChild(list);

  function renderItems(): void {
    list.innerHTML = '';
    logEntry.affected.forEach((a, i) => {
      const entry = resolveAffected(a);
      const item = document.createElement('div');
      item.className = 'log-stack-item' + (entry ? '' : ' missing');

      const order = document.createElement('span');
      order.className = 'log-stack-order';
      order.textContent = String(i + 1);
      item.appendChild(order);

      const thumb = document.createElement('div');
      thumb.className = 'log-stack-thumb';
      if (entry && entry.objectUrl){
        const img = document.createElement('img');
        img.src = entry.objectUrl;
        img.alt = '';
        img.loading = 'lazy';
        thumb.appendChild(img);
        // The thumbnail is the affected image itself — let it open the same
        // fullscreen lightbox for a bigger look. A missing image keeps the
        // alert icon and no handler (nothing to show).
        thumb.classList.add('clickable');
        thumb.title = 'Show this image in the lightbox';
        thumb.addEventListener('click', () => showImageLightbox(entry.objectUrl));
      } else {
        thumb.innerHTML = iconSvg('alert');
      }
      item.appendChild(thumb);

      const info = document.createElement('div');
      info.className = 'log-stack-info';
      const name = document.createElement('div');
      name.className = 'log-stack-name';
      name.textContent = (entry && (entry.imgName || entry.base)) || a.base;
      info.appendChild(name);
      if (!entry){
        const warn = document.createElement('div');
        warn.className = 'log-missing-warn';
        setIconLabel(warn, '⚠️ Image not found in Dataset');
        info.appendChild(warn);
      }
      item.appendChild(info);

      item.appendChild(buildAffectedActionButtons(logEntry, a, entry, renderItems));
      list.appendChild(item);
    });
  }
  renderItems();

  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', close);
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
}

// Right-click ▸ "Show all edits associated with this image": every log entry
// whose affected rows include this image (matching the original_images/ flag so
// an original's own edits don't leak onto its Gallery twin), newest first.
export function openImageEditsModal(entry: Entry): void {
  const relevant = editLog
    .filter(e => (e.affected || []).some(a => a.base === entry.base && !!a.original === !!entry.original))
    .sort((a, b) => b.id - a.id);

  const { box, close } = createModalShell({ boxClassName: 'log-stack-box' });

  const head = document.createElement('div');
  head.className = 'info-modal-title';
  head.textContent = `Edits for ${entry.imgName || entry.base}`;
  box.appendChild(head);

  const sub = document.createElement('div');
  sub.className = 'log-stack-sub';
  sub.textContent = relevant.length
    ? `${relevant.length} logged edit${relevant.length === 1 ? '' : 's'} — newest first. Undo/Redo reverses that edit for this image.`
    : 'No edits have been logged for this image yet.';
  box.appendChild(sub);

  const list = document.createElement('div');
  list.className = 'log-stack-list';
  box.appendChild(list);

  function renderItems(): void {
    list.innerHTML = '';
    for (const logEntry of relevant) {
      const row = document.createElement('div');
      row.className = 'log-row';
      const meta = document.createElement('div');
      meta.className = 'log-meta';
      const time = document.createElement('span');
      time.className = 'log-time';
      time.textContent = formatLogTime(logEntry.ts);
      const type = document.createElement('span');
      type.className = 'log-type';
      type.textContent = STAT_TYPE_LABEL[logEntry.type] || logEntry.type;
      meta.appendChild(time);
      meta.appendChild(type);
      const rowSummary = document.createElement('div');
      rowSummary.className = 'log-summary';
      rowSummary.textContent = logEntry.summary;
      row.appendChild(meta);
      row.appendChild(rowSummary);

      // This image's own affected row inside that log entry — what its
      // Undo/Redo applies to. Present for every entry here by construction.
      const a = logEntry.affected.find(x => x.base === entry.base && !!x.original === !!entry.original);
      if (a && logEntryHasActions(logEntry)) {
        row.appendChild(buildAffectedActionButtons(logEntry, a, entry, renderItems));
      }
      list.appendChild(row);
    }
  }
  renderItems();

  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const closeBtn = document.createElement('button');
  closeBtn.className = 'primary';
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', close);
  btnRow.appendChild(closeBtn);
  box.appendChild(btnRow);
}

export function initEditLog(deps: EditLogDeps): void {
  getDirHandle = deps.getDirHandle;
  applyTagDirectionRef = deps.applyTagDirection;
  applyRenameDirectionRef = deps.applyRenameDirection;
  applyPixelDirectionRef = deps.applyPixelDirection;
  applyIsolateDirectionRef = deps.applyIsolateDirection;
  applyFlaggedReviewDirectionRef = deps.applyFlaggedReviewDirection;
  moveEntryRef = deps.moveEntry;
  trackStatRef = deps.trackStat;
  checkAchievementsRef = deps.checkAchievements;
  refreshAllUIRef = deps.refreshAllUI;
  getUndoStack = deps.getUndoStack;
  getRedoStack = deps.getRedoStack;
  resolveAffected = deps.resolveAffected;
  setUndoRuleTagsRef = deps.setUndoRuleTags;
  statsViewPie.addEventListener('click', () => { statsChartMode = 'pie'; statsViewPie.classList.add('active'); statsViewBar.classList.remove('active'); renderStatsTab(); });
  statsViewBar.addEventListener('click', () => { statsChartMode = 'bar'; statsViewBar.classList.add('active'); statsViewPie.classList.remove('active'); renderStatsTab(); });

  // Type filter: one human-labelled option per edit type present in this log,
  // plus "All edit types". A themed persistent dropdown (buildPersistentDropdown
  // — the app's own .pdrop pattern), NOT a native <select>, whose OS popup can't
  // carry any theme's material. Rebuilt each time the panel opens, since the
  // set of types present changes as the log grows/shrinks.
  let typeDropdown: { refreshLabel: () => void } | null = null;
  function buildLogTypeDropdown(): void {
    const present = new Set(editLog.map(e => e.type));
    const options = [
      { value: '', label: 'All edit types' },
      ...Array.from(present)
        .sort((a, b) => (STAT_TYPE_LABEL[a] || a).localeCompare(STAT_TYPE_LABEL[b] || b))
        .map(t => ({ value: t, label: STAT_TYPE_LABEL[t] || t }))
    ];
    // A filter for a type no longer present falls back to All before it's built.
    if (logTypeFilter && !present.has(logTypeFilter)) logTypeFilter = '';
    typeDropdown = buildPersistentDropdown(
      logTypeDropdown,
      options,
      () => logTypeFilter,
      (v) => { logTypeFilter = v; logPage = 1; renderLogPanel(); }
    );
  }

  // Recency toggle: one button flipping newest <-> oldest.
  function refreshOrderBtn(): void {
    setIconLabel(logOrderBtn, logOrder === 'newest' ? 'Newest ▾' : 'Oldest ▴');
    logOrderBtn.title = logOrder === 'newest' ? 'Switch to oldest first' : 'Switch to newest first';
  }
  refreshOrderBtn();
  logOrderBtn.addEventListener('click', () => {
    logOrder = logOrder === 'newest' ? 'oldest' : 'newest';
    refreshOrderBtn();
    logPage = 1;
    renderLogPanel();
  });

  btnLog.addEventListener('click', (ev: MouseEvent) => {
    ev.stopPropagation();
    if (logPanel.style.display === 'flex') { hidePanel(logPanel); return; }
    hidePanel(favoritesPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    logPage = 1;
    buildLogTypeDropdown();
    renderLogPanel();
    showPanel(logPanel);
  });
  logCloseBtn.addEventListener('click', () => hidePanel(logPanel));

  btnExportLog.addEventListener('click', async () => {
    if (editLog.length === 0) { toast('Nothing to export yet.'); return; }
    if (!hasSaveFilePicker()) { toast('File export needs Chrome/Edge/Electron.'); return; }
    try {
      const dirHandle = getDirHandle();
      const suggestedName = `tag-edit-log-${(dirHandle?.name) || 'dataset'}-${new Date().toISOString().slice(0, 10)}.json`;
      const handle = await pickSaveFile({
        suggestedName,
        types: [{ description: 'JSON log', accept: { 'application/json': ['.json'] } }]
      });
      await writeBytes(handle, JSON.stringify(editLog, null, 2));
      toast('Log exported.');
    } catch {
      // user cancelled the save dialog
    }
  });

  btnClearLog.addEventListener('click', async () => {
    if (editLog.length === 0) return;
    const ok = await showConfirmModal(`Clear all ${editLog.length} log entries for this folder? This cannot be undone.`, { okLabel: 'Clear log', danger: true });
    if (!ok) return;
    // logIdCounter keeps counting: crop/rotate/isolate undo payloads are keyed by
    // log id and outlive the log on the undo stack, so restarting at 1 would let a
    // new edit's payload overwrite one an older Undo still needs.
    editLog = [];
    updateLogButton();
    saveEditLog();
    renderLogPanel();
    toast('Log cleared.');
  });
}
