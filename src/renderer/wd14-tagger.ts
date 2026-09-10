// Phase B module: WD14 Autotagger bridge to a local ComfyUI instance.
// All the actual HTTP work (upload/image, /prompt, /history polling) happens
// in main.ts over IPC — see its "WD14 Autotagger (ComfyUI bridge)" section
// for why this can't be a plain renderer-side fetch(). This module only
// owns: persisted settings (Tag Overseer's "WD14 Autotagger" section is the
// single home for all of them, per project convention — no duplicate
// settings live in the per-image 3-dot menu, which just triggers tagging
// using whatever's configured here), the bulk trigger wired to
// master-tag-control.ts's existing multi-select set, a single-image
// entry point view.ts's 3-dot menu calls directly, and the optional
// review-before-apply step.
// @ts-nocheck
import {
  btnWd14TagSelected, wd14Status, wd14AutoApply, wd14Host, wd14ModelSelect,
  btnWd14RefreshModels, wd14Threshold, wd14CharThreshold, wd14ReplaceUnderscore,
  wd14TrailingComma, wd14ExcludeTags
} from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { trackStat, checkAchievements, folderStats, saveFolderStats } from './achievements';
import { markDirty, recordChange } from './tags-edit';
import { masterSelectedImages, renderMasterSelectionSummary } from './master-tag-control';

const SETTINGS_KEY = 'dts-wd14-settings';
const DEFAULT_SETTINGS = {
  host: 'http://127.0.0.1:8188',
  model: '',
  threshold: 0.35,
  characterThreshold: 0.85,
  replaceUnderscore: false,
  trailingComma: false,
  excludeTags: '',
  autoApply: false
};

let settings = { ...DEFAULT_SETTINGS };
let getEntries = () => [];
let refreshAllUIRef = () => {};
let cancelRequested = false;
let running = false;

function loadSettings(){
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
    if (saved && typeof saved === 'object') settings = { ...DEFAULT_SETTINGS, ...saved };
  } catch(e){ /* keep defaults */ }
}

function saveSettings(){
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch(e){}
}

function applySettingsToUI(){
  wd14Host.value = settings.host;
  wd14Threshold.value = settings.threshold;
  wd14CharThreshold.value = settings.characterThreshold;
  wd14ReplaceUnderscore.checked = !!settings.replaceUnderscore;
  wd14TrailingComma.checked = !!settings.trailingComma;
  wd14ExcludeTags.value = settings.excludeTags;
  wd14AutoApply.checked = !!settings.autoApply;
  if (settings.model){
    if (![...wd14ModelSelect.options].some(o => o.value === settings.model)){
      const opt = document.createElement('option');
      opt.value = settings.model;
      opt.textContent = settings.model;
      wd14ModelSelect.appendChild(opt);
    }
    wd14ModelSelect.value = settings.model;
  }
}

async function refreshModels(silent){
  const host = wd14Host.value.trim() || DEFAULT_SETTINGS.host;
  const res = await window.electronAPI.wd14GetModels(host);
  if (!res.ok){
    if (!silent) toast(res.error || 'Could not fetch the model list from ComfyUI.', 4200);
    return;
  }
  const current = wd14ModelSelect.value || settings.model;
  wd14ModelSelect.innerHTML = '';
  for (const m of res.models){
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    wd14ModelSelect.appendChild(opt);
  }
  if (current && res.models.includes(current)) wd14ModelSelect.value = current;
  if (!silent) toast(`Loaded ${res.models.length} model(s) from ComfyUI.`, 2400);
}

function readSettingsFromUI(){
  settings = {
    host: wd14Host.value.trim() || DEFAULT_SETTINGS.host,
    model: wd14ModelSelect.value,
    threshold: parseFloat(wd14Threshold.value) || 0,
    characterThreshold: parseFloat(wd14CharThreshold.value) || 0,
    replaceUnderscore: wd14ReplaceUnderscore.checked,
    trailingComma: wd14TrailingComma.checked,
    excludeTags: wd14ExcludeTags.value,
    autoApply: wd14AutoApply.checked
  };
  saveSettings();
}

// WD14's raw output is a comma-separated string with `(`/`)` escaped as
// `\(`/`\)` (its own convention, meant for prompt syntax) and underscores
// left in place unless replace_underscore was on. This app's tag storage is
// always space-separated, one-way (see CLAUDE.md Data Flow) — so normalize
// here unconditionally, independent of that ComfyUI-side setting.
function parseWd14Tags(tagsCsv){
  if (!tagsCsv) return [];
  return tagsCsv
    .split(',')
    .map(t => t.replace(/\\\(/g, '(').replace(/\\\)/g, ')').replace(/_/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function setStatus(text){
  if (!text){ wd14Status.style.display = 'none'; return; }
  wd14Status.style.display = 'block';
  wd14Status.querySelector('span').textContent = text;
}

async function tagOneWithRetry(entry){
  while (true){
    if (cancelRequested) return null;
    let bytes;
    try {
      const file = await entry.imgHandle.getFile();
      bytes = new Uint8Array(await file.arrayBuffer());
    } catch(err){
      toast(`Could not read ${entry.imgName} off disk — skipping.`, 3600);
      return null;
    }
    const res = await window.electronAPI.wd14TagImage({
      host: settings.host,
      filename: entry.imgName,
      imageBytes: bytes,
      settings
    });
    if (res.ok) return res.tagsCsv;
    const retry = await showConfirmModal(
      `${res.error || 'WD14 tagging failed.'}\n\nImage: ${entry.imgName}`,
      { okLabel: 'Retry', cancelLabel: 'Skip this image', danger: true }
    );
    if (!retry) return null;
  }
}

// Builds the review UI: one row per successfully-tagged image, thumbnail +
// an editable comma-list of the merged (existing + new) tags, so "manually
// approve" means "review and tweak the exact tag list", not just a yes/no
// per image. Resolves with the accepted {entry, tags}[] list, or null if
// the whole batch was cancelled.
function showWd14ReviewModal(rows){
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'confirm-backdrop';
    const box = document.createElement('div');
    box.className = 'confirm-box wd14-review-box';

    const msg = document.createElement('div');
    msg.className = 'confirm-message';
    msg.textContent = `Review WD14 tags for ${rows.length} image(s) before applying. Edit any row, or uncheck to skip it.`;
    box.appendChild(msg);

    const list = document.createElement('div');
    list.className = 'wd14-review-list';
    const rowState = rows.map(r => ({ ...r, include: true, textEl: null }));

    for (const rs of rowState){
      const rowEl = document.createElement('div');
      rowEl.className = 'wd14-review-row';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.addEventListener('change', () => { rs.include = cb.checked; rowEl.classList.toggle('excluded', !cb.checked); });
      rowEl.appendChild(cb);
      const img = document.createElement('img');
      img.src = rs.entry.objectUrl;
      img.loading = 'lazy';
      rowEl.appendChild(img);
      const colWrap = document.createElement('div');
      colWrap.className = 'wd14-review-col';
      const label = document.createElement('div');
      label.className = 'wd14-review-name';
      label.textContent = rs.entry.imgName;
      colWrap.appendChild(label);
      const textarea = document.createElement('textarea');
      textarea.value = rs.mergedTags.join(', ');
      colWrap.appendChild(textarea);
      rs.textEl = textarea;
      rowEl.appendChild(colWrap);
      list.appendChild(rowEl);
    }
    box.appendChild(list);

    const btnRow = document.createElement('div');
    btnRow.className = 'confirm-btn-row';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    const okBtn = document.createElement('button');
    okBtn.className = 'primary';
    okBtn.textContent = 'Apply checked rows';
    function close(result){
      backdrop.classList.remove('modal-visible');
      setTimeout(() => backdrop.remove(), 160);
      resolve(result);
    }
    cancelBtn.addEventListener('click', () => close(null));
    okBtn.addEventListener('click', () => {
      const accepted = rowState.filter(rs => rs.include).map(rs => ({
        entry: rs.entry,
        tags: rs.textEl.value.split(',').map(t => t.replace(/_/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
      }));
      close(accepted);
    });
    backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(null); });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('modal-visible')));
  });
}

function commitTags(accepted){
  const affected = [];
  for (const { entry, tags } of accepted){
    const prevTags = entry.tags.slice();
    const newTags = Array.from(new Set(tags));
    if (newTags.length === prevTags.length && newTags.every((t, i) => t === prevTags[i])) continue;
    entry.tags = newTags;
    markDirty(entry);
    affected.push({ base: entry.base, prevTags, newTags: newTags.slice() });
  }
  if (affected.length === 0){ toast('No tag changes to apply.'); return; }
  const summary = `WD14-tagged ${affected.length} image(s).`;
  toast(summary);
  recordChange('add-tag', summary, affected);
  folderStats.master_ops = (folderStats.master_ops || 0) + 1;
  trackStat('wd14_images_tagged', affected.length);
  saveFolderStats();
  refreshAllUIRef();
  checkAchievements();
}

async function runBatch(entries){
  if (running){
    cancelRequested = true;
    return;
  }
  if (entries.length === 0){
    toast('Select at least one image first (or right-click a single image and choose "Tag with WD14").');
    return;
  }
  if (!settings.model){
    toast('Pick a WD14 model first — use the 🔄 button in WD14 settings to load the list from ComfyUI.');
    return;
  }
  running = true;
  cancelRequested = false;
  btnWd14TagSelected.textContent = '⏹ Cancel tagging';
  const results = [];
  let failCount = 0;
  for (let i = 0; i < entries.length; i++){
    if (cancelRequested) break;
    const entry = entries[i];
    setStatus(`Tagging ${i + 1}/${entries.length} — ${entry.imgName}…`);
    const tagsCsv = await tagOneWithRetry(entry);
    if (tagsCsv == null){ failCount++; continue; }
    const fresh = parseWd14Tags(tagsCsv);
    const mergedTags = entry.tags.concat(fresh.filter(t => !entry.tags.includes(t)));
    results.push({ entry, mergedTags });
  }
  setStatus('');
  running = false;
  btnWd14TagSelected.textContent = '🐍 Tag selected images with WD14';

  if (cancelRequested && results.length === 0){
    toast('WD14 tagging cancelled.');
    return;
  }
  if (results.length === 0){
    toast(`Could not tag any of the ${entries.length} image(s).`);
    return;
  }
  const failNote = failCount > 0 ? ` (${failCount} skipped)` : '';
  if (settings.autoApply){
    commitTags(results.map(r => ({ entry: r.entry, tags: r.mergedTags })));
    if (failNote) toast(`Applied WD14 tags to ${results.length} image(s)${failNote}.`);
  } else {
    const accepted = await showWd14ReviewModal(results);
    if (!accepted || accepted.length === 0){ toast('WD14 tagging discarded — nothing was applied.'); return; }
    commitTags(accepted);
  }
}

export function tagSingleImageWithWd14(entry){
  if (running){ toast('A WD14 batch is already running.'); return; }
  runBatch([entry]);
}

export function initWd14Tagger(deps){
  getEntries = deps.getEntries;
  refreshAllUIRef = deps.refreshAllUI;

  loadSettings();
  applySettingsToUI();
  refreshModels(true);

  [wd14Host, wd14Threshold, wd14CharThreshold, wd14ReplaceUnderscore, wd14TrailingComma, wd14ExcludeTags, wd14AutoApply, wd14ModelSelect]
    .forEach(el => el.addEventListener('change', readSettingsFromUI));

  btnWd14RefreshModels.addEventListener('click', () => refreshModels(false));

  btnWd14TagSelected.addEventListener('click', () => {
    if (running) { cancelRequested = true; return; }
    const entries = getEntries().filter(e => masterSelectedImages.has(e.base) && !e.disabled);
    runBatch(entries);
  });
}
