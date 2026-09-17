import './global-types';
import type { DirHandle } from './types';
import {
  btnFavorites, favoritesPanel, favoritesList, btnAddFavorite, favoritesCloseBtn,
  themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel
} from './dom';
import { toast, showPanel, hidePanel } from './shared-ui';
import { trackStat, checkAchievements } from './achievements';

const FAV_DB_NAME = 'dts-favorites-db';
const FAV_STORE = 'folders';

interface FavoriteRecord {
  id: number;
  name: string;
  handle: FileSystemDirectoryHandle;
  addedAt: number;
}

interface FavoritesDeps {
  getDirHandle: () => DirHandle | null;
  openFolderHandle: (handle: DirHandle) => Promise<void>;
  onFavoriteChanged?: (handle: FileSystemDirectoryHandle, isFav: boolean) => void;
}

let getDirHandle: () => DirHandle | null = () => null;
let openFolderHandle: (handle: DirHandle) => Promise<void> = async () => {};
let onFavoriteChanged: (handle: FileSystemDirectoryHandle, isFav: boolean) => void = () => {};

function openFavDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(FAV_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FAV_STORE)) {
        db.createObjectStore(FAV_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function addFavoriteHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const storedHandle = (handle as unknown as { toJSON?: () => unknown }).toJSON
    ? (handle as unknown as { toJSON: () => unknown }).toJSON()
    : handle;
  return openFavDB().then(db => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readwrite');
    tx.objectStore(FAV_STORE).add({ name: handle.name, handle: storedHandle, addedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

async function findFavoriteMatch(handle: FileSystemDirectoryHandle): Promise<FavoriteRecord | null> {
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

export async function removeFavoriteByHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const match = await findFavoriteMatch(handle);
  if (match) { try { await removeFavorite(match.id); } catch {} }
}

export async function isFavorited(handle: FileSystemDirectoryHandle): Promise<boolean> {
  return !!(await findFavoriteMatch(handle));
}

function listFavorites(): Promise<FavoriteRecord[]> {
  return openFavDB().then(db => new Promise<FavoriteRecord[]>((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readonly');
    const req = tx.objectStore(FAV_STORE).getAll();
    req.onsuccess = () => {
      const favs: FavoriteRecord[] = req.result || [];
      if (window.__dtsReviveDirHandle) {
        for (const fav of favs) {
          if (fav.handle && (fav.handle as unknown as { __dtsMobileHandle?: boolean }).__dtsMobileHandle) {
            fav.handle = window.__dtsReviveDirHandle(fav.handle) as unknown as FileSystemDirectoryHandle;
          }
        }
      }
      resolve(favs);
    };
    req.onerror = () => reject(req.error);
  }));
}

function removeFavorite(id: number): Promise<void> {
  return openFavDB().then(db => new Promise<void>((resolve, reject) => {
    const tx = db.transaction(FAV_STORE, 'readwrite');
    tx.objectStore(FAV_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
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
    const perm = await (fav.handle as unknown as { requestPermission(opts: { mode: string }): Promise<string> }).requestPermission({ mode: 'readwrite' });
    if (perm !== 'granted') {
      toast('Permission was not granted for that folder.');
      return;
    }
    hidePanel(favoritesPanel);
    await openFolderHandle(fav.handle as unknown as DirHandle);
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
    const fsHandle = dirHandle as unknown as FileSystemDirectoryHandle;
    if (await isFavorited(fsHandle)) {
      toast(`"${dirHandle.name}" is already favorited.`);
      return;
    }
    try {
      await addFavoriteHandle(fsHandle);
      onFavoriteChanged(fsHandle, true);
      toast(`Saved "${dirHandle.name}" to favorites.`);
      trackStat('favorited');
      checkAchievements();
      renderFavorites();
    } catch {
      toast('Could not save that favorite.', 3000);
    }
  });
}
