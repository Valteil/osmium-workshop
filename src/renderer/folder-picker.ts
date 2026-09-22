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

const SHELL_FOLDER_NAMES = new Set([
  'Documents', 'Desktop', 'Downloads', 'Pictures', 'Music', 'Videos',
  '3D Objects', 'Saved Games', 'Links', 'Searches', 'Contacts'
]);

export async function pickDatasetFolder(): Promise<DirHandle | null> {
  if (pickerBusy){
    toast('A folder picker is already open — finish or cancel it first.', 3600);
    return null;
  }
  pickerBusy = true;
  let picked: DirHandle | null = null;
  try {
    picked = await pickDirectory({ mode: 'readwrite' });
  } catch(e){
    const msg = (e as Error)?.message || '';
    const cancelled = (e as DOMException)?.name === 'AbortError' || /cancel/i.test(msg);
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
  if (!picked) return null;
  if (SHELL_FOLDER_NAMES.has(picked.name)){
    await showConfirmModal(
      `"${picked.name}" is a special system location (like This PC ▸ Documents), not a real dataset folder.\n\nPicking it as a dataset triggers a known bug: the file picker stops working until the app restarts — nothing gets loaded.\n\nPick your actual dataset folder (the one containing your images and .txt files) instead.`,
      { okLabel: 'OK, pick another folder', cancelLabel: '', danger: true }
    );
    return null;
  }
  return picked;
}
