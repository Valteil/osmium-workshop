import type { DirHandle } from './types';
import { toast, showConfirmModal } from './shared-ui';
import { pickDirectory } from './fs-access';

// Both folder-picker entry points (File ▸ Load Dataset in index.ts, the
// Dataset tab's + tile here) share the renderer's ONE native picker session.
// Two hazards live at that shared boundary, so both call sites go through
// this wrapper instead of calling showDirectoryPicker directly:
//
// 1. A second pick while the first is still in flight is exactly what trips
//    Chromium's one-picker-at-a-time guard — blocked here with a proper
//    message instead of an instant throw.
// 2. Picking a Windows special shell location ("This PC ▸ Documents", etc.)
//    bricks the picker for the rest of the session: every later
//    showDirectoryPicker call throws "File picker already active" immediately
//    and only a full app restart clears it (verified live — restart resolved
//    it). Nothing in-renderer can clear that state, so the fix is refusal:
//    bounce back BEFORE assigning dirHandle/scanning, with an explanation
//    naming what will happen if they continue. Names are the only signal a
//    FileSystemDirectoryHandle exposes (no path), so the English shell
//    folder names stand in for the location; a non-system folder per chance
//    named one of these and NOT directly used as a dataset would be rare,
//    and a dataset living bare inside Documents itself is its own hazard.

let pickerBusy = false;
// Set when the last pick was refused by Chromium's FSA blocklist (main.ts's
// fs_last_restricted read). Only used by pickDatasetFolder's post-pick guard.
let lastPickRestrictedPath: string | null = null;

const SHELL_FOLDER_NAMES = new Set([
  'Documents', 'Desktop', 'Downloads', 'Pictures', 'Music', 'Videos',
  '3D Objects', 'Saved Games', 'Links', 'Searches', 'Contacts'
]);

// The raw picker call, with the shared reentry guard and stuck-picker
// recovery. Callers decide whether the picked folder gets the shell-location
// check (see pickDatasetFolder / pickParentFolder).
async function runDirectoryPicker(): Promise<DirHandle | null> {
  if (pickerBusy){
    toast('A folder picker is already open — finish or cancel it first.', 3600);
    return null;
  }
  pickerBusy = true;
  try {
    const picked = await pickDirectory({ mode: 'readwrite' });
    lastPickRestrictedPath = null; // clear any stale restricted path on success
    return picked;
  } catch(e){
    const msg = (e as Error)?.message || '';
    const name = (e as DOMException)?.name || '';
    // Chromium's File System Access blocklist refuses Desktop/Documents/
    // Downloads/profile root for write access. main.ts's
    // 'file-system-access-restricted' handler denies it, so the promise
    // rejects here (as AbortError) instead of hanging forever. Surface the
    // real reason; the folder is simply not writable by design. See
    // notes/Pitfalls/Chromium-Restricted-Folder-Picker.md.
    // try/catch: if the sender guard ever rejects this IPC (untrusted frame),
    // fall back to null so the picker's own error handling below still runs and
    // the "pick a subfolder" toast isn't lost.
    let restrictedPath: string | null = null;
    try { restrictedPath = await (window.electronAPI?.fsaLastRestricted?.() ?? Promise.resolve(null)); }
    catch { restrictedPath = null; }
    if (restrictedPath){
      lastPickRestrictedPath = restrictedPath;
      const leaf = restrictedPath.replace(/[\\/]+$/, '').split(/[\\/]/).filter(Boolean).pop() || restrictedPath;
      toast(`Windows blocks apps from using "${leaf}" directly for write access. Pick (or create) a subfolder inside it instead, e.g. "${leaf}\\Datasets".`, 7000);
      return null;
    }
    const cancelled = name === 'AbortError' || /cancel/i.test(msg);
    if (cancelled){ toast('No folder was chosen.', 2400); return null; }
    if (/already active/i.test(msg)){
      console.error('[pick] picker session stuck:', e);
      toast('The folder picker is stuck in a busy state and cannot open. Use Settings ▸ Updates & Sharing ▸ Restart app to clear it, then try again.', 7200);
      return null;
    }
    console.error('[pick] folder picker failed:', e);
    toast(`Could not open the folder picker: ${msg || 'unknown error'}. Try again.`, 5000);
    return null;
  } finally {
    pickerBusy = false;
  }
}

export async function pickDatasetFolder(): Promise<DirHandle | null> {
  const picked = await runDirectoryPicker();
  if (!picked) return null;
  // Belt-and-suspenders: normally Chromium refuses these before the promise
  // resolves (handled in runDirectoryPicker), but if a handle ever does come
  // through for one, reject it here too.
  if (lastPickRestrictedPath || SHELL_FOLDER_NAMES.has(picked.name)){
    await showConfirmModal(
      `"${picked.name}" is a special system location (like This PC ▸ Documents), not a real dataset folder.\n\nPicking it as a dataset triggers a known bug: the file picker stops working until the app restarts — nothing gets loaded.\n\nPick your actual dataset folder (the one containing your images and .txt files) instead.`,
      { okLabel: 'OK, pick another folder', cancelLabel: '', danger: true }
    );
    return null;
  }
  return picked;
}

// Parent pick for "create a new dataset here" (File ▸ Add images with nothing
// open). The picked folder is only a CONTAINER for the new dataset folder,
// never loaded as a dataset itself — so a shell-location name (Desktop,
// Documents, …) is a normal, legit choice here and must NOT be refused the way
// pickDatasetFolder() refuses those names. The new child folder is created
// inside it, and that child is what gets loaded.
export async function pickParentFolder(): Promise<DirHandle | null> {
  return runDirectoryPicker();
}

// A tracked folder (Favorites ★ or the Datasets tab) resolves to a stored
// handle that stops working when the folder is moved, renamed or deleted.
// favorites.ts / dataset-manager.ts catch that open failure and call this:
// instead of a dead-end error, offer to pick the folder again so a moved
// dataset is one prompt away. Returns the newly-picked folder, or null if
// the user declined / nothing was picked.
export async function promptRelinkFolder(name: string): Promise<DirHandle | null> {
  const go = await showConfirmModal(
    `Couldn't open "${name}" — it may have been moved, renamed or deleted.\n\nLocate the folder again to re-link it?`,
    {
      okLabel: 'Locate folder…', cancelLabel: 'Not now',
      warnings: [{ text: 'If the folder picker seems to freeze on first load, that\'s normal — just wait a bit.', tone: 'info' }]
    }
  );
  if (!go) return null;
  return pickDatasetFolder();
}
