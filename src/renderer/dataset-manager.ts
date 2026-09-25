// Phase B module: the "Dataset" tab — a persistent grid/list of dataset
// folders the user has opened before, shown as themed folder icons.
// Reopening a tracked folder needs to set index.ts's `dirHandle` and call
// its `loadFolder()`, both owned by index.ts's core folder-loading state —
// injected once via initDatasetManager() (deps.openFolderHandle), same
// convention favorites.ts already uses. See CLAUDE.md's Critical
// Constraints / Known Pitfalls for why the folder icon's outline color is a
// plain CSS var (`--accent-flair`) rather than anything computed in JS.
import type { DirHandle } from './types';
import { hasDirectoryPicker, serializeHandle, isMobileHandle, reviveHandle, requestPermission } from './fs-access';
import { getJSON, setJSON, getInt, setInt, getString, setString, getBool, setBool } from './storage';
import { openDB, idbGetAll, idbAdd, idbDelete, idbUpdate } from './idb';
import { isImageFile } from './file-types';
import {
  datasetManagerTab, dmGrid, dmGridBtn, dmListBtn, dmSortDropdown, dmTabBar,
  achievementsPanel, favoritesPanel, themeCustomPanel, logPanel, tagDetailsPanel, shopPanel
} from './dom';
import { toast, showPanel, hidePanel, showConfirmModal, positionMenu, buildPersistentDropdown, addContextMenuItem, createModalShell } from './shared-ui';
import { pickDatasetFolder } from './folder-picker';
import { renderAchievementsPanel, trackStat, checkAchievements } from './achievements';
import { addFavoriteHandle, removeFavoriteByHandle, isFavorited } from './favorites';
import { setIconLabel } from './icons';

interface DMRecord {
  id: number;
  name: string;
  handle: DirHandle & { toJSON?(): unknown; requestPermission?(opts: { mode: string }): Promise<string>; entries?(): AsyncIterable<[string, { kind: string; getFile(): Promise<File> }]> };
  addedAt: number;
  lastOpenedAt: number;
  pinned: boolean;
  iconMode: string;
  iconImageBase: string | null;
  iconImageDataUrl: string | null;
  // Added alongside dataset-folder tabs — absent on every record created
  // before that feature shipped, which IndexedDB just returns as
  // `undefined` for (no migration pass needed). recordGroupId() below is
  // the one place that turns "undefined or null" into DEFAULT_GROUP_ID, so
  // nothing else in this file needs to know the field used to not exist.
  groupId?: number | null;
}

// ---------------- Dataset folder tabs (groups) ----------------
// The whole point: someone other than you opens the app, and the Dataset
// tab's grid shouldn't flash them every folder you've ever tracked. Folders
// live in one of these groups; the built-in Default group (id 0, not
// stored — see DEFAULT_GROUP_ID) is always visible with no lock option, and
// any custom group can carry an optional password. A password only ever
// hides folder NAMES/thumbnails from the *Dataset tab's own grid* — see
// renderDatasetManagerTab()'s lock-screen branch, which renders nothing
// from a locked group's contents at all, not even behind a blur. It does
// NOT also hide a locked group's folders from the separate ★ Favorites
// panel if one happens to be pinned there too; that's a real, deliberate
// scope boundary (favorites.ts is a different feature with its own list),
// not an oversight — mentioned here so it isn't "discovered" as a bug
// later.
interface DMGroup {
  id: number;
  name: string;
  passwordSalt: string | null;
  passwordHash: string | null;
}

const DEFAULT_GROUP_ID = 0;
const GROUPS_KEY = 'dts-dataset-groups';
const ACTIVE_GROUP_KEY = 'dts-dataset-active-group';

let groups: DMGroup[] = [];
let activeGroupId: number = DEFAULT_GROUP_ID;
// Session-only, deliberately never persisted to localStorage or anywhere
// else — the entire privacy guarantee of this feature is that a locked
// group re-locks on every app launch. Persisting "unlocked" across
// restarts would silently defeat the one thing this was built for.
const unlockedGroupIds = new Set<number>();

function recordGroupId(rec: DMRecord): number {
  return rec.groupId == null ? DEFAULT_GROUP_ID : rec.groupId;
}

function loadGroups(): void {
  groups = getJSON<DMGroup[]>(GROUPS_KEY, []);
  const saved = getInt(ACTIVE_GROUP_KEY, DEFAULT_GROUP_ID);
  // Never land on a locked group right at launch — nothing has been
  // unlocked yet this session by definition, so this would otherwise force
  // an immediate password prompt (or worse, a flash of its contents) before
  // the user has done anything. Falls back to Default; re-picking the tab
  // is an explicit, deliberate action instead.
  const savedGroup = groups.find(g => g.id === saved);
  activeGroupId = (savedGroup && savedGroup.passwordHash) ? DEFAULT_GROUP_ID : saved;
}
function saveGroups(){ setJSON(GROUPS_KEY, groups); }
function saveActiveGroup(){ setInt(ACTIVE_GROUP_KEY, activeGroupId); }

function getGroup(id: number): DMGroup | undefined {
  return groups.find(g => g.id === id);
}
function isGroupLocked(id: number): boolean {
  if (id === DEFAULT_GROUP_ID) return false;
  const g = getGroup(id);
  return !!(g && g.passwordHash && !unlockedGroupIds.has(id));
}

// SHA-256 over a random per-group salt, not a KDF like bcrypt/scrypt/
// argon2 — deliberately. The threat model this feature defends against is
// someone else glancing at or briefly using the app on your machine, not
// an attacker with a copy of localStorage and time to brute-force it; a
// slow KDF buys real security against the second threat at the cost of
// meaningfully slower unlock, for a feature that was never claiming to
// solve the second problem.
async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomHex(byteLen: number): string {
  const arr = new Uint8Array(byteLen);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(salt + ':' + password);
}

// Small single-field modal built on the shared modal shell (shared-ui.ts).
function promptText(message: string, opts: { okLabel?: string; password?: boolean; placeholder?: string } = {}): Promise<string | null> {
  return new Promise((resolve) => {
    const { box, close } = createModalShell({
      onDismiss: () => { resolve(null); close(); },
      onShow: () => input.focus()
    });
    const msg = document.createElement('div');
    msg.className = 'confirm-message';
    msg.textContent = message;
    box.appendChild(msg);
    const input = document.createElement('input');
    input.type = opts.password ? 'password' : 'text';
    input.className = 'dm-prompt-input';
    if (opts.placeholder) input.placeholder = opts.placeholder;
    box.appendChild(input);
    const btnRow = document.createElement('div');
    btnRow.className = 'confirm-btn-row';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    const okBtn = document.createElement('button');
    okBtn.textContent = opts.okLabel || 'OK';
    okBtn.className = 'primary';
    cancelBtn.addEventListener('click', () => { resolve(null); close(); });
    okBtn.addEventListener('click', () => { resolve(input.value); close(); });
    input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { resolve(input.value); close(); } });
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(okBtn);
    box.appendChild(btnRow);
  });
}

// ---------------- Group CRUD ----------------

async function createGroupFlow(): Promise<void> {
  const name = await promptText('Name this new tab:', { okLabel: 'Create', placeholder: 'e.g. Private' });
  if (!name || !name.trim()) return;
  const group: DMGroup = { id: Date.now(), name: name.trim(), passwordSalt: null, passwordHash: null };
  groups.push(group);
  saveGroups();
  activeGroupId = group.id;
  saveActiveGroup();
  renderTabBar();
  renderDatasetManagerTab();
}

async function renameGroupFlow(group: DMGroup): Promise<void> {
  const name = await promptText(`Rename "${group.name}" to:`, { okLabel: 'Rename', placeholder: group.name });
  if (!name || !name.trim()) return;
  group.name = name.trim();
  saveGroups();
  renderTabBar();
}

async function setGroupPasswordFlow(group: DMGroup): Promise<void> {
  const isFirstLock = !group.passwordHash;
  if (isFirstLock) {
    const ack = await showConfirmModal(
      `This app has no "forgot password" recovery — if you forget the password for "${group.name}", the only way back in is deleting the tab itself. Continue setting a password?`,
      { okLabel: 'I understand, continue' }
    );
    if (!ack) return;
  } else {
    // Changing an existing password must prove the old one first — otherwise
    // anyone with the tab bar's context menu could relock it with a password
    // of their own choosing and shut the actual owner out.
    const oldPw = await promptText(
      `Enter the current password for "${group.name}" to change it:`,
      { okLabel: 'Verify', password: true, placeholder: 'Current password' }
    );
    if (oldPw === null) return;
    const attemptHash = await hashPassword(oldPw, group.passwordSalt!);
    if (attemptHash !== group.passwordHash){ toast('Wrong password — nothing changed.', 2600); return; }
  }
  const pw = await promptText(
    group.passwordHash ? `Set a new password for "${group.name}":` : `Set a password for "${group.name}" — it'll lock every time the app starts, until you enter this again:`,
    { okLabel: 'Set password', password: true, placeholder: 'Password' }
  );
  if (pw === null) return;
  if (!pw){ toast('Password cannot be empty.', 2600); return; }
  const confirmPw = await promptText('Confirm the password:', { okLabel: 'Confirm', password: true, placeholder: 'Password' });
  if (confirmPw === null) return;
  if (pw !== confirmPw){ toast('Passwords did not match — nothing changed.', 3200); return; }
  const salt = randomHex(16);
  group.passwordSalt = salt;
  group.passwordHash = await hashPassword(pw, salt);
  unlockedGroupIds.add(group.id); // setting it counts as knowing it — no need to immediately re-lock the tab you're sitting in
  saveGroups();
  renderTabBar();
  toast(`"${group.name}" is now password-protected.`, 2600);
}

async function removeGroupPasswordFlow(group: DMGroup): Promise<void> {
  const pw = await promptText(
    `Enter the password for "${group.name}" to remove it:`,
    { okLabel: 'Verify', password: true, placeholder: 'Password' }
  );
  if (pw === null) return;
  const attemptHash = await hashPassword(pw, group.passwordSalt!);
  if (attemptHash !== group.passwordHash){ toast('Wrong password — nothing changed.', 2600); return; }
  const ok = await showConfirmModal(`Remove the password from "${group.name}"? Its folders will be visible to anyone who opens this app.`, { okLabel: 'Remove password', danger: true });
  if (!ok) return;
  group.passwordSalt = null;
  group.passwordHash = null;
  unlockedGroupIds.add(group.id);
  saveGroups();
  renderTabBar();
}

async function deleteGroupFlow(group: DMGroup): Promise<void> {
  let moveToDefault = true;
  if (group.passwordHash) {
    // Deleting a locked tab must not silently dump its folders into Default —
    // that would let anyone delete the tab they can't unlock to see its
    // contents anyway. Proving the password is what unlocks the choice to
    // bring the folders back; forgetting it still lets you delete the tab
    // (there's no recovery — see setGroupPasswordFlow), but only ever onto
    // the untracked path, never onto Default.
    const pw = await promptText(
      `"${group.name}" is password-protected. Enter the password to delete it — leave it blank if you've forgotten it:`,
      { okLabel: 'Continue', password: true, placeholder: 'Password (optional if forgotten)' }
    );
    if (pw === null) return;
    if (pw) {
      const attemptHash = await hashPassword(pw, group.passwordSalt!);
      if (attemptHash === group.passwordHash) {
        moveToDefault = await showConfirmModal(
          `Password verified. Move "${group.name}"'s folders back to the Default tab, or leave them untracked so they never resurface anywhere?`,
          { okLabel: 'Move to Default', cancelLabel: 'Leave untracked', danger: true }
        );
      } else {
        const forgot = await showConfirmModal(
          `Wrong password. Forgot it? You can still delete "${group.name}", but its folders will stay untracked instead of moving to Default — that's what stops someone from deleting a tab they can't unlock just to get its folders back that way.`,
          { okLabel: 'Delete without folders', cancelLabel: 'Cancel', danger: true }
        );
        if (!forgot) return;
        moveToDefault = false;
      }
    } else {
      const forgot = await showConfirmModal(
        `Delete "${group.name}" without the password? Its folders will stay untracked instead of moving to Default — that's what stops someone from deleting a tab they can't unlock just to get its folders back that way.`,
        { okLabel: 'Delete without folders', cancelLabel: 'Cancel', danger: true }
      );
      if (!forgot) return;
      moveToDefault = false;
    }
  } else {
    const ok = await showConfirmModal(
      `Delete the "${group.name}" tab? Its folders move back to Default — nothing about the folders themselves or their tracking is deleted.`,
      { okLabel: 'Delete tab', danger: true }
    );
    if (!ok) return;
  }
  let records: DMRecord[] = [];
  try { records = await listDatasetFolders(); } catch(e){}
  if (moveToDefault) {
    for (const rec of records){
      if (recordGroupId(rec) === group.id) await updateDatasetFolder(rec.id, { groupId: DEFAULT_GROUP_ID });
    }
  }
  groups = groups.filter(g => g.id !== group.id);
  unlockedGroupIds.delete(group.id);
  saveGroups();
  if (activeGroupId === group.id){ activeGroupId = DEFAULT_GROUP_ID; saveActiveGroup(); }
  renderTabBar();
  renderDatasetManagerTab();
}

// Prompts for the group's password, verifying against its stored hash;
// returns true (and marks it unlocked for the rest of this session) only
// on a correct match. Wrong password shows a toast and leaves it locked —
// no lockout/attempt-limit, matching this feature's stated threat model
// (see sha256Hex's own comment above).
async function unlockGroupFlow(group: DMGroup): Promise<boolean> {
  const pw = await promptText(`"${group.name}" is password-protected. Enter the password:`, { okLabel: 'Unlock', password: true, placeholder: 'Password' });
  if (pw === null) return false;
  const attemptHash = await hashPassword(pw, group.passwordSalt!);
  if (attemptHash !== group.passwordHash){ toast('Wrong password.', 2600); return false; }
  unlockedGroupIds.add(group.id);
  return true;
}

async function selectGroup(id: number): Promise<void> {
  if (id !== DEFAULT_GROUP_ID){
    const group = getGroup(id);
    if (group && isGroupLocked(id)){
      const unlocked = await unlockGroupFlow(group);
      if (!unlocked) return;
    }
  }
  activeGroupId = id;
  saveActiveGroup();
  renderTabBar();
  renderDatasetManagerTab();
}

// ---------------- Tab bar ----------------

function renderTabBar(): void {
  dmTabBar.innerHTML = '';

  function buildTab(id: number, name: string, group: DMGroup | null): HTMLElement {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'dm-tab' + (id === activeGroupId ? ' active' : '');
    const label = document.createElement('span');
    label.textContent = name;
    tab.appendChild(label);
    if (group && group.passwordHash){
      const lock = document.createElement('span');
      lock.className = 'dm-tab-lock';
      setIconLabel(lock, isGroupLocked(id) ? '🔒' : '🔓');
      lock.title = isGroupLocked(id) ? 'Locked' : 'Unlocked for this session';
      tab.appendChild(lock);
    }
    tab.addEventListener('click', () => selectGroup(id));
    if (group){
      const menuBtn = document.createElement('button');
      menuBtn.type = 'button';
      menuBtn.className = 'dm-tab-menu-btn';
      menuBtn.title = 'Tab options';
      menuBtn.textContent = '⋯';
      menuBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const rect = menuBtn.getBoundingClientRect();
        openTabContextMenu(group, rect.left, rect.bottom + 4);
      });
      tab.appendChild(menuBtn);
    }
    return tab;
  }

  dmTabBar.appendChild(buildTab(DEFAULT_GROUP_ID, 'Default', null));
  for (const group of groups) dmTabBar.appendChild(buildTab(group.id, group.name, group));

  const addTab = document.createElement('button');
  addTab.type = 'button';
  addTab.className = 'dm-tab dm-tab-add';
  addTab.title = 'Add a new tab';
  addTab.textContent = '+';
  addTab.addEventListener('click', () => createGroupFlow());
  dmTabBar.appendChild(addTab);
}

let dmTabCtxMenuEl: HTMLElement | null = null;
function closeDmTabCtxMenu(): void {
  if (dmTabCtxMenuEl){ dmTabCtxMenuEl.remove(); dmTabCtxMenuEl = null; }
  document.removeEventListener('click', onDmTabCtxOutsideClick);
}
function onDmTabCtxOutsideClick(ev: MouseEvent): void {
  if (!dmTabCtxMenuEl) return;
  const path = ev.composedPath ? ev.composedPath() : [];
  if (path.includes(dmTabCtxMenuEl)) return;
  closeDmTabCtxMenu();
}
function openTabContextMenu(group: DMGroup, x: number, y: number): void {
  closeDmTabCtxMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = group.name;
  menu.appendChild(header);
  addContextMenuItem(menu, 'Rename tab', () => { closeDmTabCtxMenu(); renameGroupFlow(group); });
  addContextMenuItem(menu, group.passwordHash ? 'Change password' : 'Set password…', () => { closeDmTabCtxMenu(); setGroupPasswordFlow(group); });
  if (group.passwordHash) addContextMenuItem(menu, 'Remove password', () => { closeDmTabCtxMenu(); removeGroupPasswordFlow(group); });
  addContextMenuItem(menu, 'Delete tab', () => { closeDmTabCtxMenu(); deleteGroupFlow(group); });
  document.body.appendChild(menu);
  dmTabCtxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => document.addEventListener('click', onDmTabCtxOutsideClick), 0);
}

// ---------------- Move a folder between tabs ----------------

async function openMoveToTabModal(record: DMRecord): Promise<void> {
  const { box, close } = createModalShell({ instant: true });
  const title = document.createElement('div');
  title.className = 'confirm-message';
  title.textContent = `Move "${record.name}" to which tab?`;
  box.appendChild(title);
  const list = document.createElement('div');
  list.className = 'dm-move-tab-list';
  box.appendChild(list);
  const btnRow = document.createElement('div');
  btnRow.className = 'confirm-btn-row';
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', close);
  btnRow.appendChild(cancelBtn);
  box.appendChild(btnRow);

  const current = recordGroupId(record);
  const options: { id: number; name: string }[] = [{ id: DEFAULT_GROUP_ID, name: 'Default' }, ...groups.map(g => ({ id: g.id, name: g.name }))];
  for (const opt of options){
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'dm-move-tab-row' + (opt.id === current ? ' active' : '');
    row.textContent = opt.name + (opt.id === current ? ' (current)' : '');
    row.disabled = opt.id === current;
    row.addEventListener('click', async () => {
      await updateDatasetFolder(record.id, { groupId: opt.id });
      close();
      renderDatasetManagerTab();
      toast(`Moved "${record.name}" to "${opt.name}".`, 2200);
    });
    list.appendChild(row);
  }
}

const DB_NAME = 'dts-dataset-manager-db';
const STORE = 'folders';
const ORDER_KEY = 'dts-dataset-folder-order';
const SORT_KEY = 'dts-dataset-folder-sort';
const VIEW_KEY = 'dts-dataset-manager-view';
const SUPPRESS_KEY = 'dts-dataset-tab-prompt-suppressed';


let getDirHandle: () => DirHandle | null = () => null;
let openFolderHandle: (h: DirHandle) => Promise<void> = async () => {};
let switchTab: (tab: string) => void = () => {};

let folderOrder: number[] = [];
let sortMode = 'manual';
let viewMode = 'grid';

// ---------------- IndexedDB ----------------

function openDMDB(): Promise<IDBDatabase> {
  return openDB(DB_NAME, 1, STORE);
}

async function addDatasetFolder(handle: DMRecord['handle']): Promise<IDBValidKey> {
  // If this folder was already favorited via the header ★ Favorites button
  // before ever being tracked here, it should show up already pinned —
  // sync-on-arrival, the other half of syncPinFromFavoriteChange() below.
  let alreadyFavorited = false;
  try { alreadyFavorited = await isFavorited(handle); } catch(e){}
  // On mobile, `handle` is mobile-shim.js's polyfill object — full of
  // closures (native-plugin calls), which IndexedDB's structured clone
  // can't store at all (a real browser FileSystemDirectoryHandle has
  // special structured-clone support; this plain object doesn't). Its own
  // toJSON() (present only there, real handles have no such method) gives
  // back a small serializable shape instead — see
  // window.__dtsReviveDirHandle's use in listDatasetFolders() below for
  // the other half of this round-trip.
  const storedHandle = serializeHandle(handle);
  const db = await openDMDB();
  const result = await idbAdd(db, STORE, {
    name: handle.name, handle: storedHandle, addedAt: Date.now(), lastOpenedAt: Date.now(),
    pinned: alreadyFavorited, iconMode: 'generic', iconImageBase: null, iconImageDataUrl: null,
    // Lands in whichever tab is currently open, not always Default — add
    // a folder while sitting in a locked tab and it should actually show
    // up there, not silently reappear in the tab anyone can see.
    groupId: activeGroupId
  });
  trackStat('dataset_tab_adds');
  checkAchievements();
  return result;
}

// Called (via initDatasetManager's deps, injected from index.ts) whenever
// the header ★ Favorites button favorites/unfavorites the currently-open
// folder — keeps a tracked Dataset-tab record's `pinned` field in sync
// without dataset-manager.ts and favorites.ts importing each other.
export async function syncPinFromFavoriteChange(handle: DMRecord['handle'], isNowFavorited: boolean): Promise<void> {
  const record = await findTrackedRecord(handle);
  if (!record) return;
  await updateDatasetFolder(record.id, { pinned: isNowFavorited });
  if (datasetManagerTab.style.display !== 'none') renderDatasetManagerTab();
}

async function listDatasetFolders(): Promise<DMRecord[]> {
  const db = await openDMDB();
  const records = await idbGetAll<DMRecord>(db, STORE);
  // The one place every other function in this file gets records from
  // — reviving a mobile-shim-serialized `handle` back into a live one
  // here means nothing downstream (findTrackedRecord/openDataset/etc.)
  // needs to know serialization happened at all. See addDatasetFolder()
  // for the other half.
  for (const rec of records){
    if (rec.handle && isMobileHandle(rec.handle)){
      rec.handle = reviveHandle(rec.handle);
    }
  }
  return records;
}

async function removeDatasetFolder(id: number): Promise<void> {
  const db = await openDMDB();
  await idbDelete(db, STORE, id);
}

async function updateDatasetFolder(id: number, patch: Partial<DMRecord>): Promise<void> {
  const db = await openDMDB();
  await idbUpdate(db, STORE, id, patch as Record<string, unknown>);
}

async function findTrackedRecord(handle: DMRecord['handle']): Promise<DMRecord | null> {
  let records: DMRecord[] = [];
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

function loadPrefs(): void {
  folderOrder = getJSON<number[]>(ORDER_KEY, []);
  sortMode = getString(SORT_KEY, 'manual');
  viewMode = getString(VIEW_KEY, 'grid');
}
function saveOrder(){ setJSON(ORDER_KEY, folderOrder); }
function saveSortMode(){ setString(SORT_KEY, sortMode); }
function saveViewMode(){ setString(VIEW_KEY, viewMode); }

function reorderFolders(draggedId: number, targetId: number, after: boolean): void {
  folderOrder = folderOrder.filter(x => x !== draggedId);
  let idx = folderOrder.indexOf(targetId);
  if (idx === -1) idx = folderOrder.length;
  if (after) idx += 1;
  folderOrder.splice(idx, 0, draggedId);
  saveOrder();
  renderDatasetManagerTab();
}

function sortRecords(records: DMRecord[]): DMRecord[] {
  const pinned = records.filter(r => r.pinned);
  const rest = records.filter(r => !r.pinned);
  function applySort(list: DMRecord[]): DMRecord[] {
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

function svgEl(pathD: string): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 64 48');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', pathD);
  svg.appendChild(path);
  return svg;
}

function buildFolderIcon(record: DMRecord): HTMLElement {
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

let dmCtxMenuEl: HTMLElement | null = null;

function closeDmCtxMenu(): void {
  if (dmCtxMenuEl){ dmCtxMenuEl.remove(); dmCtxMenuEl = null; }
  document.removeEventListener('click', onDmCtxOutsideClick);
  document.removeEventListener('keydown', onDmCtxEscape);
}
function onDmCtxOutsideClick(ev: MouseEvent): void {
  if (!dmCtxMenuEl) return;
  const path = ev.composedPath ? ev.composedPath() : [];
  if (path.includes(dmCtxMenuEl)) return;
  closeDmCtxMenu();
}
function onDmCtxEscape(ev: KeyboardEvent): void {
  if (ev.key === 'Escape') closeDmCtxMenu();
}
function openDmContextMenu(record: DMRecord, x: number, y: number): void {
  closeDmCtxMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';

  const header = document.createElement('div');
  header.className = 'ctx-header';
  header.textContent = record.name;
  menu.appendChild(header);

  addContextMenuItem(menu, 'Remove from Dataset tab', async () => {
    closeDmCtxMenu();
    const ok = await showConfirmModal(
      `Remove "${record.name}" from the Dataset tab?\nThis only stops tracking it here — the folder and its files are untouched.`,
      { okLabel: 'Remove', danger: true }
    );
    if (!ok) return;
    await removeDatasetFolder(record.id);
    renderDatasetManagerTab();
  });

  addContextMenuItem(menu, record.pinned ? 'Unpin favorite' : 'Pin as favorite', async () => {
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

  addContextMenuItem(menu, 'View achievements', async () => {
    closeDmCtxMenu();
    await openReadOnlyAchievements(record);
  });

  addContextMenuItem(menu, 'Select image for icon…', async () => {
    closeDmCtxMenu();
    await openIconPicker(record);
  });

  // Only worth offering once a second tab actually exists — with just
  // Default, there's nowhere to move a folder to.
  if (groups.length > 0){
    addContextMenuItem(menu, 'Move to tab…', async () => {
      closeDmCtxMenu();
      await openMoveToTabModal(record);
    });
  }

  document.body.appendChild(menu);
  dmCtxMenuEl = menu;
  positionMenu(menu, x, y);
  setTimeout(() => {
    document.addEventListener('click', onDmCtxOutsideClick);
    document.addEventListener('keydown', onDmCtxEscape);
  }, 0);
}

// ---------------- Read-only achievements view ----------------

async function openReadOnlyAchievements(record: DMRecord): Promise<void> {
  try {
    const perm = await requestPermission(record.handle, 'read');
    if (perm !== 'granted'){ toast('Permission was not granted for that folder.'); return; }
    let unlocked: string[] = [];
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

async function openIconPicker(record: DMRecord): Promise<void> {
  let perm: string;
  try {
    perm = await requestPermission(record.handle, 'read');
  } catch(e){ perm = 'denied'; }
  if (perm !== 'granted'){ toast('Permission was not granted for that folder.'); return; }

  const { box, close } = createModalShell({ instant: true, boxClassName: 'dm-icon-picker' });
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
  cancelBtn.addEventListener('click', close);
  btnRow.appendChild(cancelBtn);
  box.appendChild(btnRow);

  const noImageCell = document.createElement('button');
  noImageCell.type = 'button';
  noImageCell.className = 'dm-icon-picker-cell dm-icon-picker-noimage';
  noImageCell.textContent = '(No image)';
  noImageCell.addEventListener('click', async () => {
    await updateDatasetFolder(record.id, { iconMode: 'generic' });
    close();
    renderDatasetManagerTab();
  });
  grid.appendChild(noImageCell);

  const scanning = document.createElement('div');
  scanning.className = 'dm-icon-picker-scanning';
  scanning.textContent = 'Scanning…';
  grid.appendChild(scanning);
  const thumbs = [];
  try {
    let count = 0;
    for await (const [name, h] of record.handle.entries!()){
      if (h.kind !== 'file' || !isImageFile(name)) continue;
      thumbs.push({ base: name, handle: h });
      count++;
      if (count >= 60) break;
    }
  } catch(e){}
  scanning.remove();
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

function downscaleToDataUrl(imgEl: HTMLImageElement): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    function draw(): void {
      try {
        const canvas = document.createElement('canvas');
        const size = 120;
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const iw = imgEl.naturalWidth || size, ih = imgEl.naturalHeight || size;
        const scale = Math.max(size/iw, size/ih);
        const dw = iw*scale, dh = ih*scale;
        ctx!.drawImage(imgEl, (size-dw)/2, (size-dh)/2, dw, dh);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } catch(err){ reject(err); }
    }
    if (imgEl.complete && imgEl.naturalWidth) draw();
    else imgEl.addEventListener('load', draw, { once: true });
  });
}

// ---------------- Drag-to-reorder (mirrors docks.ts's reorderDock idiom) ----------------

function wireTileDrag(tile: HTMLElement, record: DMRecord): void {
  if (sortMode !== 'manual') return;
  tile.draggable = true;
  tile.addEventListener('dragstart', (ev) => {
    ev.dataTransfer!.setData('text/plain', String(record.id));
    ev.dataTransfer!.effectAllowed = 'move';
    tile.classList.add('dm-dragging');
  });
  tile.addEventListener('dragend', () => tile.classList.remove('dm-dragging'));
  tile.addEventListener('dragover', (ev) => { ev.preventDefault(); tile.classList.add('dm-drop-target'); });
  tile.addEventListener('dragleave', () => tile.classList.remove('dm-drop-target'));
  tile.addEventListener('drop', (ev) => {
    ev.preventDefault();
    tile.classList.remove('dm-drop-target');
    const draggedId = Number(ev.dataTransfer!.getData('text/plain'));
    if (!draggedId || draggedId === record.id) return;
    const rect = tile.getBoundingClientRect();
    const dropAfter = (ev.clientX - rect.left) > rect.width / 2;
    reorderFolders(draggedId, record.id, dropAfter);
  });
}

// ---------------- Opening a tracked folder ----------------

async function openTrackedFolder(record: DMRecord): Promise<void> {
  try {
    const perm = await requestPermission(record.handle, 'readwrite');
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
export async function maybePromptAddDataset(handle: DMRecord['handle']): Promise<void> {
  const existing = await findTrackedRecord(handle);
  if (existing) return;
  const suppressed = getBool(SUPPRESS_KEY);
  if (suppressed) return;
  const add = await showConfirmModal(
    `Add "${handle.name}" to your Dataset tab?\nChoosing No means you won't be asked again — you can still add folders anytime from the Dataset tab's + tile.`,
    { okLabel: 'Yes', cancelLabel: 'No' }
  );
  if (add){
    await addDatasetFolder(handle);
    if (datasetManagerTab.style.display !== 'none') renderDatasetManagerTab();
  } else {
    setBool(SUPPRESS_KEY, true);
  }
}

async function addFolderViaAddTile(){
  if (!hasDirectoryPicker()){
    toast('Your browser does not support folder access. Use Chrome or Edge, opened as a normal tab (not an embedded preview).', 5000);
    return;
  }
  // Shared picker wrapper (folder-picker.ts) — same reentry guard, stuck-
  // picker recovery, and special-folder bounce-back as File > Load Dataset,
  // since both calls exercise the renderer's one native picker session.
  const picked = await pickDatasetFolder();
  if (!picked) return;
  try {
    const existing = await findTrackedRecord(picked);
    if (!existing) await addDatasetFolder(picked);
    renderDatasetManagerTab();
    toast(`Added "${picked.name}" to the Dataset tab.`);
  } catch(e){
    console.error('[datasets] add folder failed:', e);
    toast(`Could not add that folder: ${(e as Error)?.message || 'unknown error'}`, 4200);
  }
}

// ---------------- Rendering ----------------

function buildAddTile(): HTMLElement {
  const tile = document.createElement('button');
  tile.type = 'button';
  tile.className = 'dm-tile dm-add-tile';
  tile.title = 'Add a dataset folder';
  tile.textContent = '+';
  tile.addEventListener('click', addFolderViaAddTile);
  return tile;
}

function buildFolderTile(record: DMRecord): HTMLElement {
  const tile = document.createElement('div');
  tile.className = 'dm-tile' + (record.pinned ? ' dm-pinned' : '');
  tile.tabIndex = 0;

  if (record.pinned){
    const pin = document.createElement('span');
    pin.className = 'dm-pin-badge';
    setIconLabel(pin, '★');
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

export async function renderDatasetManagerTab(): Promise<void> {
  dmGrid.classList.toggle('dm-list-view', viewMode === 'list');
  dmGridBtn.classList.toggle('active', viewMode === 'grid');
  dmListBtn.classList.toggle('active', viewMode === 'list');
  renderTabBar();

  dmGrid.innerHTML = '';

  // The actual privacy guarantee: a locked, not-yet-unlocked group renders
  // NOTHING of its contents — not blurred thumbnails, not folder names
  // behind a scrim, nothing queried from IndexedDB into the DOM at all.
  // Anyone glancing at the screen sees a lock icon and a name they already
  // knew existed (the tab label itself isn't hidden), never what's inside.
  if (isGroupLocked(activeGroupId)){
    const group = getGroup(activeGroupId)!;
    const lockScreen = document.createElement('div');
    lockScreen.className = 'dm-lock-screen';
    const icon = document.createElement('div');
    icon.className = 'dm-lock-icon';
    setIconLabel(icon, '🔒');
    const msg = document.createElement('div');
    msg.className = 'dm-lock-msg';
    msg.textContent = `"${group.name}" is locked.`;
    const unlockBtn = document.createElement('button');
    unlockBtn.className = 'primary';
    unlockBtn.textContent = 'Unlock';
    unlockBtn.addEventListener('click', () => selectGroup(group.id));
    lockScreen.appendChild(icon);
    lockScreen.appendChild(msg);
    lockScreen.appendChild(unlockBtn);
    dmGrid.appendChild(lockScreen);
    return;
  }

  let records: DMRecord[] = [];
  try { records = await listDatasetFolders(); } catch(e){ records = []; }
  const inGroup = records.filter(r => recordGroupId(r) === activeGroupId);
  const sorted = sortRecords(inGroup);

  // Grid view: the add-tile flows with the other tiles (last), so it drifts
  // rightward and wraps to the next row like any other tile as folders are
  // added, instead of permanently pinning the first grid cell. List view
  // keeps it first — a leading "add" row reads better in a vertical list.
  if (viewMode === 'list') dmGrid.appendChild(buildAddTile());
  for (const record of sorted) dmGrid.appendChild(buildFolderTile(record));
  if (viewMode !== 'list') dmGrid.appendChild(buildAddTile());
}

// ---------------- Init ----------------

interface DatasetManagerDeps {
  getDirHandle: () => DirHandle | null;
  openFolderHandle: (h: DirHandle) => Promise<void>;
  switchTab: (tab: string) => void;
}

export function initDatasetManager(deps: DatasetManagerDeps): void {
  getDirHandle = deps.getDirHandle;
  openFolderHandle = deps.openFolderHandle;
  switchTab = deps.switchTab;

  loadPrefs();
  loadGroups();

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
