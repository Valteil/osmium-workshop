// Phase B module: the "Dataset" tab — a persistent grid/list of dataset
// folders the user has opened before, shown as themed folder icons.
// Reopening a tracked folder needs to set index.ts's `dirHandle` and call
// its `loadFolder()`, both owned by index.ts's core folder-loading state —
// injected once via initDatasetManager() (deps.openFolderHandle), same
// convention favorites.ts already uses. See CLAUDE.md's Critical
// Constraints / Known Pitfalls for why the folder icon's outline color is a
// plain CSS var (`--accent-flair`) rather than anything computed in JS.
// @ts-nocheck
import {
  datasetManagerTab, dmGrid, dmGridBtn, dmListBtn, dmSortDropdown,
  achievementsPanel, favoritesPanel, themeCustomPanel, logPanel, tagDetailsPanel, shopPanel
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, positionMenu, buildPersistentDropdown } from './shared-ui';
import { renderAchievementsPanel, trackStat, checkAchievements } from './achievements';
import { addFavoriteHandle, removeFavoriteByHandle, isFavorited } from './favorites';

const DB_NAME = 'dts-dataset-manager-db';
const STORE = 'folders';
const ORDER_KEY = 'dts-dataset-folder-order';
const SORT_KEY = 'dts-dataset-folder-sort';
const VIEW_KEY = 'dts-dataset-manager-view';
const SUPPRESS_KEY = 'dts-dataset-tab-prompt-suppressed';

const DM_IMAGE_EXT = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif'];
function isImageFile(name){
  const lower = name.toLowerCase();
  return DM_IMAGE_EXT.some(ext => lower.endsWith(ext));
}

let getDirHandle = () => null;
let openFolderHandle = async () => {};
let switchTab = () => {};

let folderOrder = [];       // array of record ids, manual sort only
let sortMode = 'manual';    // manual | filename | opened | added
let viewMode = 'grid';      // grid | list

// ---------------- IndexedDB ----------------

function openDMDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)){
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function addDatasetFolder(handle){
  // If this folder was already favorited via the header ★ Favorites button
  // before ever being tracked here, it should show up already pinned —
  // sync-on-arrival, the other half of syncPinFromFavoriteChange() below.
  let alreadyFavorited = false;
  try { alreadyFavorited = await isFavorited(handle); } catch(e){}
  const result = await openDMDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const record = {
      name: handle.name, handle, addedAt: Date.now(), lastOpenedAt: Date.now(),
      pinned: alreadyFavorited, iconMode: 'generic', iconImageBase: null, iconImageDataUrl: null
    };
    const req = tx.objectStore(STORE).add(record);
    req.onsuccess = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
  }));
  trackStat('dataset_tab_adds');
  checkAchievements();
  return result;
}

// Called (via initDatasetManager's deps, injected from index.ts) whenever
// the header ★ Favorites button favorites/unfavorites the currently-open
// folder — keeps a tracked Dataset-tab record's `pinned` field in sync
// without dataset-manager.ts and favorites.ts importing each other.
export async function syncPinFromFavoriteChange(handle, isNowFavorited){
  const record = await findTrackedRecord(handle);
  if (!record) return;
  await updateDatasetFolder(record.id, { pinned: isNowFavorited });
  if (datasetManagerTab.style.display !== 'none') renderDatasetManagerTab();
}

function listDatasetFolders(){
  return openDMDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

function removeDatasetFolder(id){
  return openDMDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

function updateDatasetFolder(id, patch){
  return openDMDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const rec = getReq.result;
      if (!rec){ resolve(); return; }
      Object.assign(rec, patch);
      store.put(rec);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

async function findTrackedRecord(handle){
  let records = [];
  try { records = await listDatasetFolders(); } catch(e){ return null; }
  for (const rec of records){
    let same = false;
    try {
      same = rec.handle.isSameEntry ? await rec.handle.isSameEntry(handle) : rec.handle.name === handle.name;
    } catch(e){ same = rec.handle.name === handle.name; }
    if (same) return rec;
  }
  return null;
}

// ---------------- Order / sort / view persistence ----------------

function loadPrefs(){
  try { folderOrder = JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') || []; } catch(e){ folderOrder = []; }
  try { sortMode = localStorage.getItem(SORT_KEY) || 'manual'; } catch(e){ sortMode = 'manual'; }
  try { viewMode = localStorage.getItem(VIEW_KEY) || 'grid'; } catch(e){ viewMode = 'grid'; }
}
function saveOrder(){ try { localStorage.setItem(ORDER_KEY, JSON.stringify(folderOrder)); } catch(e){} }
function saveSortMode(){ try { localStorage.setItem(SORT_KEY, sortMode); } catch(e){} }
function saveViewMode(){ try { localStorage.setItem(VIEW_KEY, viewMode); } catch(e){} }

function reorderFolders(draggedId, targetId, after){
  folderOrder = folderOrder.filter(x => x !== draggedId);
  let idx = folderOrder.indexOf(targetId);
  if (idx === -1) idx = folderOrder.length;
  if (after) idx += 1;
  folderOrder.splice(idx, 0, draggedId);
  saveOrder();
  renderDatasetManagerTab();
}

function sortRecords(records){
  const pinned = records.filter(r => r.pinned);
  const rest = records.filter(r => !r.pinned);
  function applySort(list){
    if (sortMode === 'filename') return [...list].sort((a,b) => a.name.localeCompare(b.name));
    if (sortMode === 'opened') return [...list].sort((a,b) => (b.lastOpenedAt||0) - (a.lastOpenedAt||0));
    if (sortMode === 'added') return [...list].sort((a,b) => (b.addedAt||0) - (a.addedAt||0));
    // manual: follow folderOrder, unknown ids (never reordered yet) keep insertion order at the end
    const byOrder = [...list].sort((a,b) => {
      const ia = folderOrder.indexOf(a.id), ib = folderOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return byOrder;
  }
  return [...applySort(pinned), ...applySort(rest)];
}

// ---------------- Folder icon ----------------

const FOLDER_BACK_PATH = 'M6,10 L24,10 L28,16 L60,16 L60,42 L4,42 L4,14 Z';
// Top edge moved down from the original y=18-22 to y=26-30 — "lower" per
// request — freeing up more of the back pocket's own visible area above it
// for a bigger icon-mode image to occupy/poke out into.
const FOLDER_FRONT_PATH = 'M4,44 L4,30 L14,26 L60,26 L60,44 Z';

function svgEl(pathD){
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 48');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

function buildFolderIcon(record){
  const wrap = document.createElement('div');
  wrap.className = 'dm-folder-icon';
  const back = svgEl(FOLDER_BACK_PATH);
  back.classList.add('dm-folder-back');
  wrap.appendChild(back);
  if (record.iconMode === 'image' && record.iconImageDataUrl){
    const img = document.createElement('img');
    img.className = 'dm-folder-img';
    img.src = record.iconImageDataUrl;
    img.alt = '';
    wrap.appendChild(img);
  }
  const front = svgEl(FOLDER_FRONT_PATH);
  front.classList.add('dm-folder-front');
  wrap.appendChild(front);
  return wrap;
}

// ---------------- Context menu (mirrors view.ts's ctx-menu pattern) ----------------

let dmCtxMenuEl = null;

function closeDmCtxMenu(){
  if (dmCtxMenuEl){ dmCtxMenuEl.remove(); dmCtxMenuEl = null; }
  document.removeEventListener('click', onDmCtxOutsideClick);
  document.removeEventListener('keydown', onDmCtxEscape);
}
function onDmCtxOutsideClick(ev){
  if (!dmCtxMenuEl) return;
  const path = ev.composedPath ? ev.composedPath() : [];
  if (path.includes(dmCtxMenuEl)) return;
  closeDmCtxMenu();
}
function onDmCtxEscape(ev){
  if (ev.key === 'Escape') closeDmCtxMenu();
}
function addDmCtxItem(menu, label, onClick){
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'ctx-item';
  btn.textContent = label;
  btn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onClick();
  });
  menu.appendChild(btn);
}

function openDmContextMenu(record, x, y){
  closeDmCtxMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';

  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = record.name;
  menu.appendChild(header);

  addDmCtxItem(menu, 'Remove from Dataset tab', async () => {
    closeDmCtxMenu();
    const ok = await showConfirmModal(
      `Remove "${record.name}" from the Dataset tab?\nThis only stops tracking it here — the folder and its files are untouched.`,
      { okLabel: 'Remove', danger: true }
    );
    if (!ok) return;
    await removeDatasetFolder(record.id);
    renderDatasetManagerTab();
  });

  addDmCtxItem(menu, record.pinned ? 'Unpin favorite' : 'Pin as favorite', async () => {
    closeDmCtxMenu();
    const nowPinned = !record.pinned;
    await updateDatasetFolder(record.id, { pinned: nowPinned });
    try {
      if (nowPinned) await addFavoriteHandle(record.handle);
      else await removeFavoriteByHandle(record.handle);
    } catch(e){}
    if (nowPinned){ trackStat('favorited'); checkAchievements(); }
    renderDatasetManagerTab();
  });

  addDmCtxItem(menu, 'View achievements', async () => {
    closeDmCtxMenu();
    await openReadOnlyAchievements(record);
  });

  addDmCtxItem(menu, record.iconMode === 'image' ? 'Icon: switch to Generic' : 'Icon: switch to Image', async () => {
    closeDmCtxMenu();
    if (record.iconMode === 'image'){
      await updateDatasetFolder(record.id, { iconMode: 'generic' });
      renderDatasetManagerTab();
    } else {
      await openIconPicker(record);
    }
  });

  addDmCtxItem(menu, 'Select image for icon…', async () => {
    closeDmCtxMenu();
    await openIconPicker(record);
  });

  document.body.appendChild(menu);
  dmCtxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => {
    document.addEventListener('click', onDmCtxOutsideClick);
    document.addEventListener('keydown', onDmCtxEscape);
  }, 0);
}

// ---------------- Read-only achievements view ----------------

async function openReadOnlyAchievements(record){
  try {
    const perm = await record.handle.requestPermission({ mode: 'read' });
    if (perm !== 'granted'){ toast('Permission was not granted for that folder.'); return; }
    let unlocked = [];
    try {
      const fh = await record.handle.getFileHandle('_dts_achievements.json', { create: false });
      const file = await fh.getFile();
      const parsed = JSON.parse(await file.text());
      unlocked = Array.isArray(parsed.unlocked) ? parsed.unlocked : [];
    } catch(e){
      // No achievements file yet for that folder — show an all-locked panel.
      unlocked = [];
    }
    hidePanel(favoritesPanel); hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(tagDetailsPanel); hidePanel(shopPanel);
    renderAchievementsPanel(unlocked);
    showPanel(achievementsPanel);
    trackStat('other_folder_achievements_viewed');
    checkAchievements();
  } catch(err){
    toast('Could not read that folder\'s achievements — it may have been moved or deleted.', 3600);
  }
}

// ---------------- Icon picker (lazy thumbnail scan) ----------------

async function openIconPicker(record){
  let perm;
  try {
    perm = await record.handle.requestPermission({ mode: 'read' });
  } catch(e){ perm = 'denied'; }
  if (perm !== 'granted'){ toast('Permission was not granted for that folder.'); return; }

  const backdrop = document.createElement('div');
  backdrop.className = 'confirm-backdrop modal-visible';
  const box = document.createElement('div');
  box.className = 'confirm-box dm-icon-picker';
  const title = document.createElement('div');
  title.className = 'confirm-message';
  title.textContent = `Choose an image from "${record.name}" for its icon:`;
  box.appendChild(title);
  const grid = document.createElement('div');
  grid.className = 'dm-icon-picker-grid';
  box.appendChild(grid);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  btnRow.appendChild(cancelBtn);
  box.appendChild(btnRow);
  backdrop.appendChild(box);
  document.body.appendChild(backdrop);
  function close(){ backdrop.remove(); }
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (ev) => { if (ev.target === backdrop) close(); });

  grid.textContent = 'Scanning…';
  const thumbs = [];
  try {
    let count = 0;
    for await (const [name, h] of record.handle.entries()){
      if (h.kind !== 'file' || !isImageFile(name)) continue;
      thumbs.push({ base: name, handle: h });
      count++;
      if (count >= 60) break;
    }
  } catch(e){}
  grid.textContent = '';
  if (thumbs.length === 0){
    grid.textContent = 'No images found in that folder.';
    return;
  }
  for (const t of thumbs){
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'dm-icon-picker-cell';
    grid.appendChild(cell);
    t.handle.getFile().then(file => {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.src = url;
      cell.appendChild(img);
      cell.addEventListener('click', async () => {
        try {
          const dataUrl = await downscaleToDataUrl(img);
          await updateDatasetFolder(record.id, { iconMode: 'image', iconImageBase: t.base, iconImageDataUrl: dataUrl });
          close();
          renderDatasetManagerTab();
          trackStat('dataset_icon_images_set');
          checkAchievements();
        } catch(e){
          toast('Could not use that image.', 2600);
        }
      });
    }).catch(() => {});
  }
}

function downscaleToDataUrl(imgEl){
  return new Promise((resolve, reject) => {
    function draw(){
      try {
        const canvas = document.createElement('canvas');
        const size = 120;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const iw = imgEl.naturalWidth || size, ih = imgEl.naturalHeight || size;
        const scale = Math.max(size/iw, size/ih);
        const dw = iw*scale, dh = ih*scale;
        ctx.drawImage(imgEl, (size-dw)/2, (size-dh)/2, dw, dh);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch(err){ reject(err); }
    }
    if (imgEl.complete && imgEl.naturalWidth) draw();
    else imgEl.addEventListener('load', draw, { once: true });
  });
}

// ---------------- Drag-to-reorder (mirrors docks.ts's reorderDock idiom) ----------------

function wireTileDrag(tile, record){
  if (sortMode !== 'manual') return;
  tile.draggable = true;
  tile.addEventListener('dragstart', (ev) => {
    ev.dataTransfer.setData('text/plain', String(record.id));
    ev.dataTransfer.effectAllowed = 'move';
    tile.classList.add('dm-dragging');
  });
  tile.addEventListener('dragend', () => tile.classList.remove('dm-dragging'));
  tile.addEventListener('dragover', (ev) => { ev.preventDefault(); tile.classList.add('dm-drop-target'); });
  tile.addEventListener('dragleave', () => tile.classList.remove('dm-drop-target'));
  tile.addEventListener('drop', (ev) => {
    ev.preventDefault();
    tile.classList.remove('dm-drop-target');
    const draggedId = Number(ev.dataTransfer.getData('text/plain'));
    if (!draggedId || draggedId === record.id) return;
    const rect = tile.getBoundingClientRect();
    const dropAfter = (ev.clientX - rect.left) > rect.width / 2;
    reorderFolders(draggedId, record.id, dropAfter);
  });
}

// ---------------- Opening a tracked folder ----------------

async function openTrackedFolder(record){
  try {
    const perm = await record.handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted'){ toast('Permission was not granted for that folder.'); return; }
    await updateDatasetFolder(record.id, { lastOpenedAt: Date.now() });
    await openFolderHandle(record.handle);
    switchTab('gallery');
  } catch(err){
    toast('Could not reopen that folder — it may have been moved or deleted.', 3600);
  }
}

// ---------------- Add-to-tab prompt ----------------

// Called after opening a brand-new folder via the generic File > Open path.
// Never called for the dashed add-tile's own flow (that always adds
// unconditionally, no prompt — see addFolderViaAddTile below).
export async function maybePromptAddDataset(handle){
  const existing = await findTrackedRecord(handle);
  if (existing) return;
  let suppressed = false;
  try { suppressed = localStorage.getItem(SUPPRESS_KEY) === '1'; } catch(e){}
  if (suppressed) return;
  const add = await showConfirmModal(
    `Add "${handle.name}" to your Dataset tab?\nChoosing No means you won't be asked again — you can still add folders anytime from the Dataset tab's + tile.`,
    { okLabel: 'Yes', cancelLabel: 'No' }
  );
  if (add){
    await addDatasetFolder(handle);
    if (datasetManagerTab.style.display !== 'none') renderDatasetManagerTab();
  } else {
    try { localStorage.setItem(SUPPRESS_KEY, '1'); } catch(e){}
  }
}

async function addFolderViaAddTile(){
  if (!window.showDirectoryPicker){
    toast('Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).', 5000);
    return;
  }
  let picked = null;
  try { picked = await window.showDirectoryPicker({ mode: 'readwrite' }); }
  catch(e){ return; }
  if (!picked) return;
  const existing = await findTrackedRecord(picked);
  if (!existing) await addDatasetFolder(picked);
  renderDatasetManagerTab();
  toast(`Added "${picked.name}" to the Dataset tab.`);
}

// ---------------- Rendering ----------------

function buildAddTile(){
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'dm-tile dm-add-tile';
  tile.title = 'Add a dataset folder';
  tile.textContent = '+';
  tile.addEventListener('click', addFolderViaAddTile);
  return tile;
}

function buildFolderTile(record){
  const tile = document.createElement('div');
  tile.className = 'dm-tile' + (record.pinned ? ' dm-pinned' : '');
  tile.tabIndex = 0;

  if (record.pinned){
    const pin = document.createElement('span');
    pin.className = 'dm-pin-badge';
    pin.textContent = '★';
    tile.appendChild(pin);
  }

  tile.appendChild(buildFolderIcon(record));

  const label = document.createElement('div');
  label.className = 'dm-tile-label';
  label.textContent = record.name;
  label.title = record.name;
  tile.appendChild(label);

  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'dm-menu-btn';
  menuBtn.title = 'Folder options';
  menuBtn.textContent = '⋯';
  menuBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const rect = menuBtn.getBoundingClientRect();
    openDmContextMenu(record, rect.left, rect.bottom + 4);
  });
  tile.appendChild(menuBtn);

  tile.addEventListener('contextmenu', (ev) => {
    ev.preventDefault();
    openDmContextMenu(record, ev.clientX, ev.clientY);
  });
  tile.addEventListener('click', (ev) => {
    if (ev.target === menuBtn) return;
    openTrackedFolder(record);
  });

  wireTileDrag(tile, record);
  return tile;
}

export async function renderDatasetManagerTab(){
  dmGrid.classList.toggle('dm-list-view', viewMode === 'list');
  dmGridBtn.classList.toggle('active', viewMode === 'grid');
  dmListBtn.classList.toggle('active', viewMode === 'list');

  let records = [];
  try { records = await listDatasetFolders(); } catch(e){ records = []; }
  const sorted = sortRecords(records);

  dmGrid.innerHTML = '';
  // Grid view: the add-tile flows with the other tiles (last), so it drifts
  // rightward and wraps to the next row like any other tile as folders are
  // added, instead of permanently pinning the first grid cell. List view
  // keeps it first — a leading "add" row reads better in a vertical list.
  if (viewMode === 'list') dmGrid.appendChild(buildAddTile());
  for (const record of sorted) dmGrid.appendChild(buildFolderTile(record));
  if (viewMode !== 'list') dmGrid.appendChild(buildAddTile());
}

// ---------------- Init ----------------

export function initDatasetManager(deps){
  getDirHandle = deps.getDirHandle;
  openFolderHandle = deps.openFolderHandle;
  switchTab = deps.switchTab;

  loadPrefs();

  dmGridBtn.addEventListener('click', () => {
    viewMode = 'grid'; saveViewMode(); renderDatasetManagerTab();
  });
  dmListBtn.addEventListener('click', () => {
    viewMode = 'list'; saveViewMode(); renderDatasetManagerTab();
  });

  buildPersistentDropdown(dmSortDropdown, [
    { value: 'manual', label: 'Manual order' },
    { value: 'filename', label: 'Filename' },
    { value: 'opened', label: 'Time opened' },
    { value: 'added', label: 'Time added' }
  ], () => sortMode, (val) => {
    sortMode = val;
    saveSortMode();
    renderDatasetManagerTab();
  });
}
