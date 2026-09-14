// Phase B module 6/N: power-tool marking (which fields/buttons get
// highlighted) — builtin + custom lists, the settings-list checkboxes, and
// the manual picker (click any input/button to mark it). Self-contained:
// only touches its own customPowerTools/powerToolPickerActive state, DOM
// refs, and generic shared-ui helpers.
// @ts-nocheck — real types land once index.ts itself is typed.
import {
  $, powerToolList, btnStartPowerToolPicker, btnResetCustomPowerTools, settingsPanel
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, positionMenu } from './shared-ui';

export let customPowerTools = [];
export let powerToolPickerActive = false;

// The highlight itself is a single `.power-tool` class (styled in CSS, gated
// by the two toggles above). What differs per-tool is WHICH elements carry
// that class: built-ins are fixed pairs of {field(s), button}, and users can
// mark their own on top. Tag Pruner's search inputs are dynamic (new ones
// can be added), so those get the class directly at creation time instead
// of going through this id-based system.
export const BUILTIN_POWER_TOOLS = [
  { id:'builtin-unify-void', infoOnly:true, label:'Unify/Void selected tags (always marked, dynamic — one row per Tag Pruner)' },
  { id:'builtin-master-apply', field:['masterApplyTagInput'], button:'btnMasterApplyToSelected', mode:'both', label:'Master Tags: apply to selected' },
  { id:'builtin-master-remove', field:['masterRemoveTagInput'], button:'btnMasterRemoveFromSelected', mode:'both', label:'Master Tags: remove from selected' },
  { id:'builtin-cond-apply', field:['condSourceTag','condAddTag'], button:'btnCondApply', mode:'both', label:'Master Tags: conditional apply' },
  { id:'builtin-mass-apply', field:['massApplyInput'], button:'btnMassApply', mode:'both', label:'Master Tags: mass apply' },
  { id:'builtin-mass-remove', field:['massRemoveInput'], button:'btnMassRemove', mode:'both', label:'Master Tags: mass remove' },
  { id:'builtin-purge', button:'btnPurgeAllTags', mode:'button', label:'Purge all tags' },
  { id:'builtin-tag-pruner', infoOnly:true, label:'Tag Pruner search filters (always marked, dynamic)' }
];

// Known-good candidates that aren't power tools by default but are
// reasonable to flip on — shown in the Settings list as unchecked
// checkboxes the user can toggle directly, no picker needed.
export const OPTIONAL_POWER_TOOL_CANDIDATES = [
  { id:'candidate-master-rename', field:['masterRenameFrom','masterRenameTo'], button:'btnMasterRename', mode:'both', label:'Master Tags: rename everywhere' },
  { id:'candidate-master-fr', field:['masterFRFind','masterFRReplace'], button:'btnMasterFR', mode:'both', label:'Master Tags: find & replace substring' },
  { id:'candidate-flag-isolated', button:'btnFlagIsolated', mode:'button', label:'Flag isolated tags' }
];

export function powerToolIdsFor(entry){
  const fieldIds = entry.field ? (Array.isArray(entry.field) ? entry.field : [entry.field]) : [];
  const buttonIds = entry.button ? [entry.button] : [];
  return { fieldIds, buttonIds };
}

export function applyPowerToolMarks(){
  document.querySelectorAll('.power-tool').forEach(el => {
    if (!el.classList.contains('pt-dynamic')) el.classList.remove('power-tool');
  });
  for (const entry of BUILTIN_POWER_TOOLS.concat(customPowerTools)){
    if (entry.infoOnly) continue;
    const { fieldIds, buttonIds } = powerToolIdsFor(entry);
    if (entry.mode === 'field' || entry.mode === 'both'){
      for (const fid of fieldIds){ const el = $(fid); if (el) el.classList.add('power-tool'); }
    }
    if (entry.mode === 'button' || entry.mode === 'both'){
      for (const bid of buttonIds){ const el = $(bid); if (el) el.classList.add('power-tool'); }
    }
  }
}

export function saveCustomPowerTools(){
  try { localStorage.setItem('dts-custom-power-tools', JSON.stringify(customPowerTools)); } catch(e){}
}
export function loadCustomPowerTools(){
  try {
    const saved = JSON.parse(localStorage.getItem('dts-custom-power-tools') || 'null');
    if (Array.isArray(saved)) customPowerTools = saved;
  } catch(e){}
}

// Finds whether an element id already belongs to a power tool, and where —
// used both by the picker (to toggle off on a second click) and to decide
// what a settings-list checkbox should do.
export function findPowerToolMatch(elId){
  for (const entry of BUILTIN_POWER_TOOLS){
    if (entry.infoOnly) continue;
    const { fieldIds, buttonIds } = powerToolIdsFor(entry);
    if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope:'builtin', entry };
  }
  for (const entry of customPowerTools){
    const { fieldIds, buttonIds } = powerToolIdsFor(entry);
    if (fieldIds.includes(elId) || buttonIds.includes(elId)) return { scope:'custom', entry };
  }
  return null;
}

export function setCustomPowerToolActive(entrySpec, active){
  if (active){
    if (!customPowerTools.some(c => c.id === entrySpec.id)){
      customPowerTools.push({ id: entrySpec.id, field: entrySpec.field, button: entrySpec.button, mode: entrySpec.mode, label: entrySpec.label });
    }
  } else {
    customPowerTools = customPowerTools.filter(c => c.id !== entrySpec.id);
  }
  saveCustomPowerTools();
  applyPowerToolMarks();
  renderPowerToolList();
}

function buildPowerToolRow(entry, opts){
  const row = document.createElement('div');
  row.className = 'pt-list-row';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = opts.checked;
  cb.disabled = opts.locked || !!entry.infoOnly;
  row.appendChild(cb);
  const label = document.createElement('span');
  label.className = 'pt-list-label';
  label.textContent = entry.label + (opts.locked ? ' (built-in, always on)' : '');
  row.appendChild(label);
  const tagEl = document.createElement('span');
  tagEl.className = 'pt-list-tag';
  tagEl.textContent = entry.infoOnly ? '' : (entry.mode === 'both' ? 'field + button' : entry.mode);
  row.appendChild(tagEl);
  if (!opts.locked && !entry.infoOnly){
    cb.addEventListener('change', () => {
      setCustomPowerToolActive(entry, cb.checked);
      toast(cb.checked ? `Marked "${entry.label}" as a power tool.` : `Unmarked "${entry.label}".`);
    });
  }
  return row;
}

export function renderPowerToolList(){
  powerToolList.innerHTML = '';
  for (const entry of BUILTIN_POWER_TOOLS){
    powerToolList.appendChild(buildPowerToolRow(entry, { checked:true, locked:true }));
  }
  for (const candidate of OPTIONAL_POWER_TOOL_CANDIDATES){
    powerToolList.appendChild(buildPowerToolRow(candidate, { checked: customPowerTools.some(c => c.id === candidate.id), locked:false }));
  }
  const candidateIds = new Set(OPTIONAL_POWER_TOOL_CANDIDATES.map(c => c.id));
  for (const custom of customPowerTools){
    if (candidateIds.has(custom.id)) continue; // already rendered above as a curated candidate
    powerToolList.appendChild(buildPowerToolRow(custom, { checked:true, locked:false }));
  }
}

function addCustomPowerTool(fieldIds, buttonIds, mode, label){
  const entry = {
    id: 'custom-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    field: fieldIds, button: buttonIds[0], mode, label
  };
  customPowerTools.push(entry);
  saveCustomPowerTools();
  applyPowerToolMarks();
  renderPowerToolList();
  toast(`Marked "${label}" as a power tool.`);
}

let pickerBrowsingSuspended = false;

// Settings is hidden for the whole picker session (it would otherwise sit
// on top of and block whatever the user is trying to click) and comes back
// only once the session is genuinely over — a mark was made, it was
// cancelled, or the click didn't land on anything markable. While the
// field/button mode-choice submenu is open, that "genuinely over" point is
// deferred until the submenu itself resolves (see openPowerToolModeChoice).
function finishPowerToolPicking(){
  showPanel(settingsPanel);
}

function exitPowerToolPicker(){
  powerToolPickerActive = false;
  pickerBrowsingSuspended = false;
  document.body.classList.remove('pt-picking');
  document.removeEventListener('click', onPowerToolPickerClick, true);
  document.removeEventListener('keydown', onPowerToolPickerKeydown, true);
  document.removeEventListener('keyup', onPowerToolPickerKeyup, true);
}

// Holding Shift lets you freely click around the app (switch tabs, open
// panels, scroll) to go find where a field actually lives, without that
// click being swallowed as a mark attempt or ending the picker session —
// release Shift and the next click resumes normal picking behavior.
function onPowerToolPickerKeydown(ev){
  if (ev.key === 'Escape'){
    exitPowerToolPicker();
    toast('Cancelled.');
    finishPowerToolPicking();
    return;
  }
  if (ev.key === 'Shift' && !pickerBrowsingSuspended){
    pickerBrowsingSuspended = true;
    document.body.classList.remove('pt-picking');
    document.removeEventListener('click', onPowerToolPickerClick, true);
    toast('Browsing freely — release Shift to resume marking.', 3000);
  }
}

function onPowerToolPickerKeyup(ev){
  if (ev.key === 'Shift' && pickerBrowsingSuspended){
    pickerBrowsingSuspended = false;
    document.body.classList.add('pt-picking');
    document.addEventListener('click', onPowerToolPickerClick, true);
  }
}

function onPowerToolPickerClick(ev){
  const el = ev.target.closest('input, textarea, select, button');
  exitPowerToolPicker();
  if (!el || !el.id || el.classList.contains('tab-btn')){
    ev.preventDefault();
    ev.stopPropagation();
    toast('That spot isn\'t a markable field or button — try again.');
    finishPowerToolPicking();
    return;
  }
  ev.preventDefault();
  ev.stopPropagation();

  // Clicking something already marked toggles it off instead of re-marking
  // it — built-ins are protected, custom marks (curated or ad-hoc) come off.
  const existing = findPowerToolMatch(el.id);
  if (existing && existing.scope === 'builtin'){
    toast('That\'s already a built-in power tool and can\'t be unmarked.');
    finishPowerToolPicking();
    return;
  }
  if (existing && existing.scope === 'custom'){
    setCustomPowerToolActive(existing.entry, false);
    toast(`Unmarked "${existing.entry.label}".`);
    finishPowerToolPicking();
    return;
  }

  const container = el.closest('.apply-row, .gtt-row');
  let fields = [], buttons = [];
  if (container){
    fields = Array.from(container.querySelectorAll('input, textarea, select')).filter(x => x.id);
    buttons = Array.from(container.querySelectorAll('button')).filter(x => x.id);
  }
  const isField = el.matches('input, textarea, select');
  if (fields.length === 0) fields = isField ? [el] : [];
  if (buttons.length === 0) buttons = !isField ? [el] : [];
  const fieldIds = fields.map(f => f.id);
  const buttonIds = buttons.map(b => b.id);

  // If this exact pair matches a curated candidate, toggle that candidate
  // on by its fixed id instead of creating a redundant ad-hoc duplicate.
  const matchedCandidate = OPTIONAL_POWER_TOOL_CANDIDATES.find(cand => {
    const ids = powerToolIdsFor(cand);
    return ids.fieldIds.length === fieldIds.length && ids.fieldIds.every(id => fieldIds.includes(id)) &&
           ids.buttonIds.length === buttonIds.length && ids.buttonIds.every(id => buttonIds.includes(id));
  });
  if (matchedCandidate){
    setCustomPowerToolActive(matchedCandidate, true);
    toast(`Marked "${matchedCandidate.label}" as a power tool.`);
    finishPowerToolPicking();
    return;
  }

  if (fields.length && buttons.length){
    openPowerToolModeChoice(el, fields, buttons, ev.clientX, ev.clientY);
  } else {
    const mode = fieldIds.length ? 'field' : 'button';
    const label = (buttons[0] && buttons[0].textContent.trim()) || (fields[0] && (fields[0].placeholder || fields[0].id)) || el.id;
    addCustomPowerTool(fieldIds, buttonIds, mode, label.slice(0, 60));
    finishPowerToolPicking();
  }
}

function openPowerToolModeChoice(el, fields, buttons, x, y){
  const menu = document.createElement('div');
  menu.className = 'pt-choice-menu';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = 'Highlight which part?';
  menu.appendChild(header);
  const fieldIds = fields.map(f => f.id);
  const buttonIds = buttons.map(b => b.id);
  const label = ((buttons[0] && buttons[0].textContent.trim()) || (fields[0] && (fields[0].placeholder || fields[0].id)) || el.id).slice(0, 60);
  const choices = [
    ['field', 'Highlight the field' + (fields.length > 1 ? 's' : '')],
    ['button', 'Highlight the button'],
    ['both', 'Highlight both']
  ];
  for (const [mode, text] of choices){
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.addEventListener('click', () => {
      menu.remove();
      document.removeEventListener('click', onOutsideCloseChoiceMenu, true);
      addCustomPowerTool(fieldIds, buttonIds, mode, label);
      finishPowerToolPicking();
    });
    menu.appendChild(btn);
  }
  document.body.appendChild(menu);
  positionMenu(menu, x, y);
  function onOutsideCloseChoiceMenu(ev){
    if (!menu.contains(ev.target)){
      menu.remove();
      document.removeEventListener('click', onOutsideCloseChoiceMenu, true);
      finishPowerToolPicking();
    }
  }
  setTimeout(() => document.addEventListener('click', onOutsideCloseChoiceMenu, true), 0);
}

btnStartPowerToolPicker.addEventListener('click', () => {
  powerToolPickerActive = true;
  document.body.classList.add('pt-picking');
  hidePanel(settingsPanel); // it would otherwise sit on top of whatever you're trying to click
  toast('Click any input or button to mark it as a power tool — Esc to cancel, hold Shift to browse freely.', 5000);
  setTimeout(() => {
    document.addEventListener('click', onPowerToolPickerClick, true);
    document.addEventListener('keydown', onPowerToolPickerKeydown, true);
    document.addEventListener('keyup', onPowerToolPickerKeyup, true);
  }, 0);
});

btnResetCustomPowerTools.addEventListener('click', async () => {
  if (customPowerTools.length === 0){ toast('No custom power tool marks to reset.'); return; }
  const ok = await showConfirmModal(`Remove all ${customPowerTools.length} custom power tool mark(s)? Built-in ones are unaffected.`, { okLabel: 'Reset', danger: true });
  if (!ok) return;
  customPowerTools = [];
  saveCustomPowerTools();
  applyPowerToolMarks();
  renderPowerToolList();
  toast('Custom power tool marks reset.');
});

export function initPowerTools(){
  loadCustomPowerTools();
  applyPowerToolMarks();
  renderPowerToolList();
}
