// Phase B module: Favorite folders, persisted via IndexedDB. Opening a
// favorite needs to set index.ts's `dirHandle` and call its `loadFolder()` —
// both stay owned by index.ts's core folder-loading state, so they're
// injected once via initFavorites() instead of imported.
// @ts-nocheck
import {
  btnFavorites, favoritesPanel, favoritesList, btnAddFavorite, favoritesCloseBtn,
  themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel
} from './dom';
import { toast, showPanel, hidePanel } from './shared-ui';
import { trackStat, checkAchievements } from './achievements';

const FAV_DB_NAME = 'dts-favorites-db';
const FAV_STORE = 'folders';

let getDirHandle = () => null;
let openFolderHandle = async () => {};
let onFavoriteChanged = () => {};

function openFavDB(){
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FAV_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FAV_STORE)){
        db.createObjectStore(FAV_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function addFavoriteHandle(handle){
  return openFavDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readwrite');
    tx.objectStore(FAV_STORE).add({ name: handle.name, handle, addedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// Shared best-effort matcher for the dataset-manager.ts pin-sync below —
// isSameEntry() where the browser supports it (Electron's Chromium does),
// falling back to a name match otherwise.
async function findFavoriteMatch(handle){
  let favs = [];
  try { favs = await listFavorites(); } catch(e){ return null; }
  for (const fav of favs){
    let same = false;
    try {
      same = fav.handle.isSameEntry ? await fav.handle.isSameEntry(handle) : fav.handle.name === handle.name;
    } catch(e){ same = fav.handle.name === handle.name; }
    if (same) return fav;
  }
  return null;
}

export async function removeFavoriteByHandle(handle){
  const match = await findFavoriteMatch(handle);
  if (match){ try { await removeFavorite(match.id); } catch(e){} }
}

export async function isFavorited(handle){
  return !!(await findFavoriteMatch(handle));
}

function listFavorites(){
  return openFavDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readonly');
    const req = tx.objectStore(FAV_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  }));
}

function removeFavorite(id){
  return openFavDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readwrite');
    tx.objectStore(FAV_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

async function renderFavorites(){
  let favs = [];
  try { favs = await listFavorites(); } catch(e){ favs = []; }
  favoritesList.innerHTML = '';
  if (favs.length === 0){
    favoritesList.innerHTML = '<div class="fav-empty">No favorites yet. Open a folder, then "Save current folder" below.</div>';
    return;
  }
  favs.sort((a,b) => b.addedAt - a.addedAt);
  for (const fav of favs){
    const row = document.createElement('div');
    row.className = 'fav-row';
    const name = document.createElement('span');
    name.className = 'fav-name';
    name.textContent = fav.name || '(folder)';
    name.title = fav.name || '';
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    openBtn.className = 'primary';
    openBtn.addEventListener('click', () => openFavorite(fav));
    const rmBtn = document.createElement('button');
    rmBtn.textContent = '✕';
    rmBtn.className = 'danger-ghost';
    rmBtn.addEventListener('click', async () => {
      await removeFavorite(fav.id);
      onFavoriteChanged(fav.handle, false);
      renderFavorites();
    });
    row.appendChild(name);
    row.appendChild(openBtn);
    row.appendChild(rmBtn);
    favoritesList.appendChild(row);
  }
}

async function openFavorite(fav){
  try {
    const perm = await fav.handle.requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted'){
      toast('Permission was not granted for that folder.');
      return;
    }
    hidePanel(favoritesPanel);
    await openFolderHandle(fav.handle);
  } catch(err){
    toast('Could not reopen that folder — it may have been moved or deleted.', 3600);
  }
}

export function initFavorites(deps){
  getDirHandle = deps.getDirHandle;
  openFolderHandle = deps.openFolderHandle;
  onFavoriteChanged = deps.onFavoriteChanged || (() => {});

  btnFavorites.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (favoritesPanel.style.display === 'flex'){ hidePanel(favoritesPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    renderFavorites();
    showPanel(favoritesPanel);
  });
  favoritesCloseBtn.addEventListener('click', () => hidePanel(favoritesPanel));

  btnAddFavorite.addEventListener('click', async () => {
    const dirHandle = getDirHandle();
    if (!dirHandle) return;
    if (await isFavorited(dirHandle)){
      toast(`"${dirHandle.name}" is already favorited.`);
      return;
    }
    try {
      await addFavoriteHandle(dirHandle);
      onFavoriteChanged(dirHandle, true);
      toast(`Saved "${dirHandle.name}" to favorites.`);
      trackStat('favorited');
      checkAchievements();
      renderFavorites();
    } catch(err){
      toast('Could not save that favorite.', 3000);
    }
  });
}
