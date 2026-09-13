// Phase B module: the per-folder edit log (undo/redo history persisted to
// disk) and the Stats tab charts built from it. A handful of core index.ts
// internals (dirHandle, entryByBase, applyTagDirection, moveEntry, trackStat,
// checkAchievements, refreshAllUI, the undo/redo stacks) are injected once via
// initEditLog() since index.ts's IIFE can't export them.
// @ts-nocheck
import {
  btnLog, logPanel, logPanelTitle, logList, btnExportLog, btnClearLog, logCloseBtn,
  themeCustomPanel, favoritesPanel, achievementsPanel, shopPanel, tagDetailsPanel,
  statsChartWrap, statsLegend, statsTotals, statsViewPie, statsViewBar
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal } from './shared-ui';
import { folderUnlocked } from './achievements';

export let editLog = [];       // [{id, ts, type, summary, affected:[{base, prevTags, newTags}]}]
export let logIdCounter = 1;
let statsChartMode = 'pie';

const LOG_FILE_NAME = '_tag_edit_log.json';

let getDirHandle = () => null;
let getEntryByBase = () => undefined;
let applyTagDirectionRef = () => 0;
let moveEntryRef = async () => {};
let trackStatRef = () => {};
let checkAchievementsRef = () => {};
let refreshAllUIRef = () => {};
let getUndoStack = () => [];
let getRedoStack = () => [];

export function pushLogEntry(partial){
  const entry = {
    ...partial,
    id: logIdCounter++,
    ts: Date.now(),
    type: partial.type,
    summary: partial.summary,
    affected: partial.affected || []
  };
  editLog.push(entry);
  updateLogButton();
  saveEditLog(); // fire-and-forget; dataset folder is the source of truth on disk
  if (logPanel.style.display === 'flex') renderLogPanel();
  return entry;
}

export async function saveEditLog(){
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(editLog, null, 2));
    await writable.close();
  } catch(err){
    // best-effort autosave; don't interrupt the user's edit flow
  }
}

export async function loadEditLogForFolder(){
  editLog = [];
  logIdCounter = 1;
  const dirHandle = getDirHandle();
  if (!dirHandle){
    // Unloading a dataset (dataset-manager.ts / index.ts's unloadDataset())
    // routes through here with dirHandle already null specifically to reset
    // editLog — it must still refresh the topbar button, not just bail
    // before ever calling updateLogButton().
    updateLogButton();
    return;
  }
  try {
    const handle = await dirHandle.getFileHandle(LOG_FILE_NAME, { create: false });
    const file = await handle.getFile();
    const parsed = JSON.parse((await file.text()).trim() || '[]');
    if (Array.isArray(parsed)) editLog = parsed;
    logIdCounter = editLog.reduce((max, e) => Math.max(max, e.id || 0), 0) + 1;
  } catch(err){
    editLog = [];
    logIdCounter = 1;
  }
  updateLogButton();
}

// No dataset loaded -> plain "Log", no count at all (not even "(0)") —
// distinct from an actively loaded folder that just happens to have zero
// edits yet, which still shows "(0)".
export function updateLogButton(){
  btnLog.textContent = getDirHandle() ? `📜 Log (${editLog.length})` : '📜 Log';
}

function formatLogTime(ts){
  try { return new Date(ts).toLocaleString(); } catch(e){ return ''; }
}

// ---------------- Editing Stats tab (charts) ----------------

const STAT_CHART_COLORS = {
  'add-tag': '#6fb8d1', 'remove-tag': '#e2637a', 'merge': '#e8a33d', 'void': '#c1443c',
  'rename': '#7fbf8f', 'find-replace': '#a683e0', 'disable': '#8a6f57', 'restore': '#4fae7a',
  'undo': '#9791a6', 'redo': '#6b6578', 'unmerge': '#d9b35c', 'unvoid': '#5cb9a8', 'rule-update': '#8a8fd9'
};
const STAT_TYPE_LABEL = {
  'add-tag': 'Tags added', 'remove-tag': 'Tags removed', 'merge': 'Merges', 'void': 'Voids',
  'rename': 'Renames', 'find-replace': 'Find & replace', 'disable': 'Disabled', 'restore': 'Restored',
  'undo': 'Undos', 'redo': 'Redos', 'unmerge': 'Unmerges', 'unvoid': 'Unvoids', 'rule-update': 'Rule changes'
};

function computeStatsBreakdown(){
  const counts = {};
  for (const entry of editLog){
    if (!(entry.type in STAT_TYPE_LABEL)) continue;
    counts[entry.type] = (counts[entry.type] || 0) + 1;
  }
  return counts;
}

function animateCountUp(el, target, duration = 600){
  const start = 0;
  const startTime = performance.now();
  function tick(now){
    const p = Math.min(1, (now - startTime) / duration);
    el.textContent = Math.round(start + (target - start) * p);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function renderStatsTab(){
  const counts = computeStatsBreakdown();
  const entriesArr = Object.entries(counts).filter(([,v]) => v > 0);
  const total = entriesArr.reduce((s,[,v]) => s+v, 0);

  statsChartWrap.innerHTML = '';
  statsLegend.innerHTML = '';
  statsTotals.innerHTML = '';

  if (total === 0){
    statsChartWrap.innerHTML = '<div class="stats-empty">No edits logged yet in this folder — make some changes, then check back here.</div>';
    return;
  }

  entriesArr.sort((a,b) => b[1] - a[1]);

  if (statsChartMode === 'pie'){
    const size = 240, r = 100, cx = size/2, cy = size/2;
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
        transform="rotate(-90 ${cx} ${cy})" style="animation: pieReveal 0.8s ease ${i*0.08}s both;"/>`;
      offset += dash;
    });
    svg += `<circle cx="${cx}" cy="${cy}" r="${r-34}" fill="var(--bg-panel)"/>`;
    svg += `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="var(--text-primary)" font-size="22" font-weight="600" font-family="var(--mono)">${total}</text>`;
    svg += `<text x="${cx}" y="${cy+20}" text-anchor="middle" fill="var(--text-faint)" font-size="10">edits</text>`;
    svg += `</svg>`;
    statsChartWrap.innerHTML = svg;
  } else {
    const wrap = document.createElement('div');
    wrap.style.minWidth = '360px';
    const maxCount = entriesArr[0][1];
    entriesArr.forEach(([type, count], i) => {
      const pct = ((count/total)*100).toFixed(1);
      const barWidthPct = (count / maxCount) * 100;
      const color = STAT_CHART_COLORS[type] || '#888';
      const row = document.createElement('div');
      row.className = 'stat-bar-row';
      row.innerHTML = `
        <div class="stat-bar-label">${STAT_TYPE_LABEL[type] || type}</div>
        <div class="stat-bar-track"><div class="stat-bar-fill" style="width:${barWidthPct}%; background:${color}; animation-delay:${i*0.06}s;"></div></div>
        <div class="stat-bar-value">${count} (${pct}%)</div>
      `;
      wrap.appendChild(row);
    });
    statsChartWrap.appendChild(wrap);
  }

  for (const [type, count] of entriesArr){
    const pct = ((count/total)*100).toFixed(1);
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

  const totalCards = [
    ['Total logged edits', total],
    ['Undo stack depth', getUndoStack().length],
    ['Redo stack depth', getRedoStack().length],
    ['Achievements unlocked', folderUnlocked.length]
  ];
  for (const [label, value] of totalCards){
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

export function renderLogPanel(){
  const dirHandle = getDirHandle();
  logPanelTitle.textContent = dirHandle ? `Edit log — ${dirHandle.name}` : 'Edit log';
  logList.innerHTML = '';
  if (editLog.length === 0){
    logList.innerHTML = '<div class="log-empty">No edits logged yet for this folder.</div>';
    return;
  }
  const TAG_TYPES = new Set(['add-tag','remove-tag','merge','void','rename','find-replace','reset-edits','unmerge','unvoid']);
  const MOVE_TYPES = new Set(['disable','restore']);
  const recent = editLog.slice(-150).reverse();
  for (const logEntry of recent){
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

    if (TAG_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length){
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const undoBtn = document.createElement('button');
      undoBtn.textContent = '↩ Undo this';
      undoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'undo'));
      const redoBtn = document.createElement('button');
      redoBtn.textContent = '↪ Redo this';
      redoBtn.className = 'primary';
      redoBtn.addEventListener('click', () => applyLogEntryDirection(logEntry, 'redo'));
      actions.appendChild(undoBtn);
      actions.appendChild(redoBtn);
      row.appendChild(actions);
    } else if (MOVE_TYPES.has(logEntry.type) && logEntry.affected && logEntry.affected.length){
      const actions = document.createElement('div');
      actions.className = 'log-actions';
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = logEntry.type === 'disable' ? 'Restore image' : 'Disable image again';
      toggleBtn.className = 'primary';
      toggleBtn.addEventListener('click', () => toggleMoveLogEntry(logEntry));
      actions.appendChild(toggleBtn);
      row.appendChild(actions);
    }

    logList.appendChild(row);
  }
  if (editLog.length > 150){
    const note = document.createElement('div');
    note.className = 'log-empty';
    note.textContent = `Showing the latest 150 of ${editLog.length} entries — the rest are still in ${LOG_FILE_NAME}.`;
    logList.appendChild(note);
  }
}

function applyLogEntryDirection(logEntry, direction){
  const count = applyTagDirectionRef(logEntry.affected, direction);
  if (count === 0){ toast('None of the affected images are in the loaded dataset anymore.'); return; }
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

async function toggleMoveLogEntry(logEntry){
  const base = logEntry.affected[0] && logEntry.affected[0].base;
  const e = base ? getEntryByBase(base) : null;
  if (!e){ toast('That image is no longer in the loaded dataset.'); return; }
  const shouldBeDisabled = logEntry.type === 'disable' ? false : true;
  if (e.disabled === shouldBeDisabled){ toast('Already in that state.'); return; }
  await moveEntryRef(e, shouldBeDisabled);
  renderLogPanel();
}

export function initEditLog(deps){
  getDirHandle = deps.getDirHandle;
  getEntryByBase = deps.getEntryByBase;
  applyTagDirectionRef = deps.applyTagDirection;
  moveEntryRef = deps.moveEntry;
  trackStatRef = deps.trackStat;
  checkAchievementsRef = deps.checkAchievements;
  refreshAllUIRef = deps.refreshAllUI;
  getUndoStack = deps.getUndoStack;
  getRedoStack = deps.getRedoStack;
  statsViewPie.addEventListener('click', () => { statsChartMode = 'pie'; statsViewPie.classList.add('active'); statsViewBar.classList.remove('active'); renderStatsTab(); });
  statsViewBar.addEventListener('click', () => { statsChartMode = 'bar'; statsViewBar.classList.add('active'); statsViewPie.classList.remove('active'); renderStatsTab(); });

  btnLog.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (logPanel.style.display === 'flex'){ hidePanel(logPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(favoritesPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    renderLogPanel();
    showPanel(logPanel);
  });
  logCloseBtn.addEventListener('click', () => hidePanel(logPanel));

  btnExportLog.addEventListener('click', async () => {
    if (editLog.length === 0){ toast('Nothing to export yet.'); return; }
    if (!window.showSaveFilePicker){ toast('File export needs Chrome/Edge/Electron.'); return; }
    try {
      const dirHandle = getDirHandle();
      const suggestedName = `tag-edit-log-${(dirHandle && dirHandle.name) || 'dataset'}-${new Date().toISOString().slice(0,10)}.json`;
      const handle = await window.showSaveFilePicker({
        suggestedName,
        types: [{ description: 'JSON log', accept: { 'application/json': ['.json'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(JSON.stringify(editLog, null, 2));
      await writable.close();
      toast('Log exported.');
    } catch(err){
      // user cancelled the save dialog — no toast needed
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
