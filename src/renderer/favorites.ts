import './global-types';
import type { DirHandle } from './types';
import {
  btnFavorites, favoritesPanel, favoritesList, btnAddFavorite, favoritesCloseBtn,
  themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel
} from './dom';
import { toast, showPanel, hidePanel } from './shared-ui';
import { trackStat, checkAchievements } from './achievements';
import { serializeHandle, isMobileHandle, reviveHandle, requestPermission } from './fs-access';
import { openDB, idbGetAll, idbAdd, idbDelete } from './idb';

const FAV_DB_NAME = 'dts-favorites-db';
const FAV_STORE = 'folders';

interface FavoriteRecord {
  id: number;
  name: string;
  handle: DirHandle;
  addedAt: number;
}

interface FavoritesDeps {
  getDirHandle: () => DirHandle | null;
  openFolderHandle: (handle: DirHandle) => Promise<void>;
  onFavoriteChanged?: (handle: DirHandle, isFav: boolean) => void;
}

let getDirHandle: () => DirHandle | null = () => null;
let openFolderHandle: (handle: DirHandle) => Promise<void> = async () => {};
let onFavoriteChanged: (handle: DirHandle, isFav: boolean) => void = () => {};

function openFavDB(): Promise<IDBDatabase> {
  return openDB(FAV_DB_NAME, 1, FAV_STORE);
}

export async function addFavoriteHandle(handle: DirHandle): Promise<void> {
  const db = await openFavDB();
  await idbAdd(db, FAV_STORE, { name: handle.name, handle: serializeHandle(handle), addedAt: Date.now() });
}

async function findFavoriteMatch(handle: DirHandle): Promise<FavoriteRecord | null> {
  let favs: FavoriteRecord[] = [];
  try { favs = await listFavorites(); } catch { return null; }
  for (const fav of favs) {
    let same = false;
    try {
      same = fav.handle.isSameEntry ? await fav.handle.isSameEntry(handle) : fav.handle.name === handle.name;
    } catch { same = fav.handle.name === handle.name; }
    if (same) return fav;
  }
  return null;
}

export async function removeFavoriteByHandle(handle: DirHandle): Promise<void> {
  const match = await findFavoriteMatch(handle);
  if (match) { try { await removeFavorite(match.id); } catch {} }
}

export async function isFavorited(handle: DirHandle): Promise<boolean> {
  return !!(await findFavoriteMatch(handle));
}

async function listFavorites(): Promise<FavoriteRecord[]> {
  const db = await openFavDB();
  const favs = await idbGetAll<FavoriteRecord>(db, FAV_STORE);
  for (const fav of favs) {
    if (fav.handle && isMobileHandle(fav.handle)) {
      fav.handle = reviveHandle(fav.handle);
    }
  }
  return favs;
}

async function removeFavorite(id: number): Promise<void> {
  const db = await openFavDB();
  await idbDelete(db, FAV_STORE, id);
}

async function renderFavorites(): Promise<void> {
  let favs: FavoriteRecord[] = [];
  try { favs = await listFavorites(); } catch { favs = []; }
  favoritesList.innerHTML = '';
  if (favs.length === 0) {
    favoritesList.innerHTML = '<div class="fav-empty">No favorites yet. Open a folder, then "Save current folder" below.</div>';
    return;
  }
  favs.sort((a, b) => b.addedAt - a.addedAt);
  for (const fav of favs) {
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

async function openFavorite(fav: FavoriteRecord): Promise<void> {
  try {
    const perm = await requestPermission(fav.handle, 'readwrite');
    if (perm !== 'granted') {
      toast('Permission was not granted for that folder.');
      return;
    }
    hidePanel(favoritesPanel);
    await openFolderHandle(fav.handle);
  } catch {
    toast('Could not reopen that folder — it may have been moved or deleted.', 3600);
  }
}

export function initFavorites(deps: FavoritesDeps): void {
  getDirHandle = deps.getDirHandle;
  openFolderHandle = deps.openFolderHandle;
  onFavoriteChanged = deps.onFavoriteChanged || (() => {});

  btnFavorites.addEventListener('click', (ev: MouseEvent) => {
    ev.stopPropagation();
    if (favoritesPanel.style.display === 'flex') { hidePanel(favoritesPanel); return; }
    hidePanel(themeCustomPanel); hidePanel(logPanel); hidePanel(achievementsPanel); hidePanel(shopPanel); hidePanel(tagDetailsPanel);
    renderFavorites();
    showPanel(favoritesPanel);
  });
  favoritesCloseBtn.addEventListener('click', () => hidePanel(favoritesPanel));

  btnAddFavorite.addEventListener('click', async () => {
    const dirHandle = getDirHandle();
    if (!dirHandle) return;
    if (await isFavorited(dirHandle)) {
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
    } catch {
      toast('Could not save that favorite.', 3000);
    }
  });
}
