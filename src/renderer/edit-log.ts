import type { EditLogEntry, EditLogAffected, Entry, DirHandle, ChangeRecord } from './types';
import { hasSaveFilePicker, pickSaveFile, writeBytes } from './fs-access';
import {
  btnLog, logPanel, logPanelTitle, logList, btnExportLog, btnClearLog, logCloseBtn,
  themeCustomPanel, favoritesPanel, achievementsPanel, shopPanel, tagDetailsPanel,
  statsChartWrap, statsLegend, statsTotals, statsViewPie, statsViewBar
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal } from './shared-ui';
import { folderUnlocked } from './achievements';
import { setIconLabel } from './icons';

export let editLog: EditLogEntry[] = [];
export let logIdCounter = 1;
let statsChartMode: 'pie' | 'bar' = 'pie';

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
export const REVIEW_TYPES = new Set(['unflag-review']);

const LOG_FILE_NAME = '_tag_edit_log.json';

interface EditLogDeps {
  getDirHandle: () => DirHandle | null;
  getEntryByBase: (base: string) => Entry | undefined;
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
}

let getDirHandle: () => DirHandle | null = () => null;
let getEntryByBase: (base: string) => Entry | undefined = () => undefined;
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

export function pushLogEntry(partial: { type: string; summary: string; affected?: EditLogAffected[] }): EditLogEntry {
  const entry: EditLogEntry = {
    ...partial,
    id: logIdCounter++,
    ts: Date.now(),
    type: partial.type,
    summary: partial.summary,
    affected: partial.affected || []
  };
  editLog.push(entry);
  updateLogButton();
  saveEditLog();
  if (logPanel.style.display === 'flex') renderLogPanel();
  return entry;
}

export async function saveEditLog(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: true });
    await writeBytes(handle, JSON.stringify(editLog, null, 2));
  } catch {
    // best-effort autosave
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

// ---------------- Editing Stats tab (charts) ----------------

const STAT_CHART_COLORS: Record<string, string> = {
  'add-tag': '#6fb8d1', 'remove-tag': '#e2637a', 'merge': '#e8a33d', 'void': '#c1443c',
  'rename': '#7fbf8f', 'find-replace': '#a683e0', 'disable': '#8a6f57', 'restore': '#4fae7a',
  'undo': '#9791a6', 'redo': '#6b6578', 'unmerge': '#d9b35c', 'unvoid': '#5cb9a8', 'rule-update': '#8a8fd9',
  'delete': '#c1443c', 'rename-files': '#4a9fd1', 'crop-image': '#3aa655', 'rotate-image': '#7a9fd1',
  'isolate-image': '#b57edc', 'unflag-review': '#e8a33d'
};
const STAT_TYPE_LABEL: Record<string, string> = {
  'add-tag': 'Tags added', 'remove-tag': 'Tags removed', 'merge': 'Merges', 'void': 'Voids',
  'rename': 'Renames', 'find-replace': 'Find & replace', 'disable': 'Disabled', 'restore': 'Restored',
  'undo': 'Undos', 'redo': 'Redos', 'unmerge': 'Unmerges', 'unvoid': 'Unvoids', 'rule-update': 'Rule changes',
  'delete': 'Deleted permanently', 'rename-files': 'Files renamed',
  'crop-image': 'Crops', 'rotate-image': 'Rotates', 'isolate-image': 'Isolates',
  'unflag-review': 'Review flags cleared'
};

function computeStatsBreakdown(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of editLog) {
    if (!(entry.type in STAT_TYPE_LABEL)) continue;
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
  if (editLog.length === 0) {
    logList.innerHTML = '<div class="log-empty">No edits logged yet for this folder.</div>';
    return;
  }
  const TAG_TYPES = new Set(['add-tag', 'remove-tag', 'merge', 'void', 'rename', 'find-replace', 'reset-edits', 'unmerge', 'unvoid']);
  const MOVE_TYPES = new Set(['disable', 'restore']);
  const RENAME_TYPES = new Set(['rename-files']);
  const recent = editLog.slice(-150).reverse();
  for (const logEntry of recent) {
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

    if (TAG_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      setIconLabel(undoBtn, '↩ Undo this');
      undoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      setIconLabel(redoBtn, '↪ Redo this');
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    } else if (MOVE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = logEntry.type === 'disable' ? 'Restore image' : 'Disable image again';
      toggleBtn.className = 'primary';
      toggleBtn.addEventListener('click', () => toggleMoveLogEntry(logEntry));
      actions.appendChild(toggleBtn);
      row.appendChild(actions);
    } else if (RENAME_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      setIconLabel(undoBtn, '↩ Undo this');
      undoBtn.addEventListener('click', () => applyRenameLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      setIconLabel(redoBtn, '↪ Redo this');
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyRenameLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    } else if (PIXEL_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      setIconLabel(undoBtn, '↩ Undo this');
      undoBtn.addEventListener('click', () => applyPixelLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      setIconLabel(redoBtn, '↪ Redo this');
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyPixelLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    } else if (ISOLATE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      setIconLabel(undoBtn, '↩ Undo this');
      undoBtn.addEventListener('click', () => applyIsolateLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      setIconLabel(redoBtn, '↪ Redo this');
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyIsolateLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    } else if (REVIEW_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length) {
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      setIconLabel(undoBtn, '↩ Undo this');
      undoBtn.addEventListener('click', () => applyReviewLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      setIconLabel(redoBtn, '↪ Redo this');
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyReviewLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    }

    logList.appendChild(row);
  }
  if (editLog.length > 150) {
    const note = document.createElement('div');
    note.className = 'log-empty';
    note.textContent = `Showing the latest 150 of ${editLog.length} entries — the rest are still in ${LOG_FILE_NAME}.`;
    logList.appendChild(note);
  }
}

function applyLogEntryDirection(logEntry: EditLogEntry, direction: 'undo' | 'redo'): void {
  const count = applyTagDirectionRef(logEntry.affected, direction);
  if (count === 0) { toast('None of the affected images are in the loaded dataset anymore.'); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({
    type: direction,
    summary: `${verb} (from log): ${logEntry.summary}`,
    affected: logEntry.affected
  });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} that edit.`);
  refreshAllUIRef();
  renderLogPanel();
  checkAchievementsRef();
}

async function applyRenameLogEntryDirection(logEntry: EditLogEntry, direction: 'undo' | 'redo'): Promise<void> {
  const count = await applyRenameDirectionRef(logEntry.affected, direction);
  if (count === 0) { toast('None of the affected images are in the loaded dataset anymore.'); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({
    type: direction,
    summary: `${verb} (from log): ${logEntry.summary}`,
    affected: logEntry.affected
  });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} ${count} of ${logEntry.affected.length} rename(s).`);
  refreshAllUIRef();
  renderLogPanel();
  checkAchievementsRef();
}

async function applyPixelLogEntryDirection(logEntry: EditLogEntry, direction: 'undo' | 'redo'): Promise<void> {
  const count = await applyPixelDirectionRef(logEntry.affected, direction);
  if (count === 0) { toast('That image edit can no longer be restored (it was from an earlier session, or the image is gone).'); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({
    type: direction,
    summary: `${verb} (from log): ${logEntry.summary}`,
    affected: logEntry.affected
  });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} that edit.`);
  refreshAllUIRef();
  renderLogPanel();
  checkAchievementsRef();
}

async function applyIsolateLogEntryDirection(logEntry: EditLogEntry, direction: 'undo' | 'redo'): Promise<void> {
  const count = await applyIsolateDirectionRef(logEntry.affected, direction);
  if (count === 0) { toast('That isolated image can no longer be restored (it was from an earlier session, or the file is gone).'); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({
    type: direction,
    summary: `${verb} (from log): ${logEntry.summary}`,
    affected: logEntry.affected
  });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} that edit.`);
  refreshAllUIRef();
  renderLogPanel();
  checkAchievementsRef();
}

function applyReviewLogEntryDirection(logEntry: EditLogEntry, direction: 'undo' | 'redo'): void {
  const count = applyFlaggedReviewDirectionRef(logEntry.affected, direction);
  if (count === 0) { toast('None of the affected images are in the loaded dataset anymore.'); return; }
  const verb = direction === 'undo' ? 'Undid' : 'Redid';
  pushLogEntry({
    type: direction,
    summary: `${verb} (from log): ${logEntry.summary}`,
    affected: logEntry.affected
  });
  trackStatRef(direction === 'undo' ? 'undos' : 'redos');
  toast(`${verb} that edit.`);
  refreshAllUIRef();
  renderLogPanel();
  checkAchievementsRef();
}

async function toggleMoveLogEntry(logEntry: EditLogEntry): Promise<void> {
  const base = logEntry.affected[0]?.base;
  const e = base ? getEntryByBase(base) : null;
  if (!e) { toast('That image is no longer in the loaded dataset.'); return; }
  const shouldBeDisabled = logEntry.type !== 'disable';
  if (e.disabled === shouldBeDisabled) { toast('Already in that state.'); return; }
  await moveEntryRef(e, shouldBeDisabled);
  renderLogPanel();
}

export function initEditLog(deps: EditLogDeps): void {
  getDirHandle = deps.getDirHandle;
  getEntryByBase = deps.getEntryByBase;
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
  statsViewPie.addEventListener('click', () => { statsChartMode = 'pie'; statsViewPie.classList.add('active'); statsViewBar.classList.remove('active'); renderStatsTab(); });
  statsViewBar.addEventListener('click', () => { statsChartMode = 'bar'; statsViewBar.classList.add('active'); statsViewPie.classList.remove('active'); renderStatsTab(); });

  btnLog.addEventListener('click', (ev: MouseEvent) => {
    ev.stopPropagation();
    if (logPanel.style.display === 'flex') { hidePanel(logPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(favoritesPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
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
    editLog = [];
    logIdCounter = 1;
    updateLogButton();
    saveEditLog();
    renderLogPanel();
    toast('Log cleared.');
  });
}
