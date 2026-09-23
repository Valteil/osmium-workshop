// Gallery right-panel "Bucket Images" dock — aspect-ratio bucketing, ported
// from Anima-TrainFlow's SmartCropper.
//
// The renderer owns ALL file I/O (the dataset folder is a
// FileSystemDirectoryHandle, so the main process has no path to it); the main
// process (bucket-local.ts) does the u2net crop + resize and returns PNG bytes.
// Same split as WD14's on-device tagging.
//
// Flow: every Gallery image NOT already at a valid bucket size is moved into
// original_images/ (with a copy of its .txt) and a bucketed PNG is written
// back to the dataset root under the same name stem, so the copy inherits the
// caption. Revert undoes exactly that.
import {
  btnBucketRun, btnBucketRevert, btnBucketDownloadModel, bucketModelStatusText,
  bucketSideMin, bucketSideMax, bucketSideStep, bucketLog
} from './dom';
import { toast, showConfirmModal } from './shared-ui';
import { writeBytes } from './fs-access';
import { getValidBuckets, isBucketSize } from '../bucket-core';
import type { Entry, DirHandle } from './types';

interface BucketImagesDeps {
  getDirHandle: () => DirHandle | null;
  getEntries: () => Entry[];
  reload: () => Promise<void>;
  saveAllDirty: (silent?: boolean) => Promise<void>;
}

const ORIGINAL_DIR = 'original_images';

let getDirHandle: () => DirHandle | null = () => null;
let getEntries: () => Entry[] = () => [];
let reload: () => Promise<void> = async () => {};
let saveAllDirty: (silent?: boolean) => Promise<void> = async () => {};
let busy = false;

function log(line: string, isErr = false): void {
  const el = document.createElement('div');
  el.className = 'bucket-log-line' + (isErr ? ' err' : '');
  el.textContent = line;
  bucketLog.appendChild(el);
  bucketLog.scrollTop = bucketLog.scrollHeight;
}
function clearLog(): void { bucketLog.textContent = ''; }

function params(): { sideMin: number; sideMax: number; step: number } {
  const sideMin = Math.max(64, parseInt(bucketSideMin.value, 10) || 256);
  const sideMax = Math.max(sideMin, parseInt(bucketSideMax.value, 10) || 1024);
  const step = Math.max(16, parseInt(bucketSideStep.value, 10) || 64);
  return { sideMin, sideMax, step };
}

async function imageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bmp = await createImageBitmap(file);
  const dims = { width: bmp.width, height: bmp.height };
  bmp.close();
  return dims;
}

async function originalDir(create: boolean): Promise<DirHandle | null> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return null;
  try { return await dirHandle.getDirectoryHandle(ORIGINAL_DIR, { create }); }
  catch { return null; }
}

function setBusy(on: boolean): void {
  busy = on;
  btnBucketRun.disabled = on;
  btnBucketRevert.disabled = on;
}

// ---------------- model ----------------

async function refreshModelStatus(): Promise<void> {
  try {
    const st = await window.electronAPI.bucketModelStatus();
    if (st.present) {
      bucketModelStatusText.textContent = `u2net ready (${Math.round((st.sizeBytes || 0) / 1048576)} MB).`;
      btnBucketDownloadModel.style.display = 'none';
    } else {
      bucketModelStatusText.textContent = 'u2net model not downloaded yet.';
      btnBucketDownloadModel.style.display = '';
    }
  } catch {
    bucketModelStatusText.textContent = 'Could not read the model status.';
  }
}

async function downloadModel(): Promise<void> {
  if (busy) return;
  setBusy(true);
  btnBucketDownloadModel.disabled = true;
  try {
    bucketModelStatusText.textContent = 'Downloading u2net… 0%';
    await window.electronAPI.bucketDownloadModel();
    toast('u2net model downloaded.', 2600);
  } catch (err) {
    toast(`Could not download the u2net model: ${err instanceof Error ? err.message : String(err)}`, 5000);
  } finally {
    btnBucketDownloadModel.disabled = false;
    setBusy(false);
    await refreshModelStatus();
  }
}

// ---------------- bucket ----------------

async function run(): Promise<void> {
  if (busy) return;
  const dirHandle = getDirHandle();
  if (!dirHandle) { toast('Open a dataset folder first.'); return; }
  const active = getEntries().filter((e) => !e.disabled && !e.original);
  if (!active.length) { toast('No Gallery images to bucket.'); return; }

  const { sideMin, sideMax, step } = params();
  const buckets = getValidBuckets(sideMin, sideMax, step);

  const ok = await showConfirmModal(
    `Bucket ${active.length} Gallery image(s) at ${sideMin}–${sideMax} (step ${step})?\n\n` +
    `Each image is moved into original_images/ (treated as disabled — the new Originals view), ` +
    `and a cropped + resized PNG is written back to the dataset root under the same name. ` +
    `Images already at a valid bucket size are left alone.`,
    { okLabel: 'Bucket images' }
  );
  if (!ok) return;

  if (!(await window.electronAPI.bucketModelStatus()).present) {
    toast('Download the u2net model first (the button above).');
    return;
  }

  // Bucketing moves files on disk and then reloads the folder, so any in-memory
  // tag edits have to hit disk first or the reload silently discards them.
  await saveAllDirty(true);

  setBusy(true);
  clearLog();
  const origDir = await originalDir(true);
  if (!origDir) { log(`Could not create ${ORIGINAL_DIR}/.`, true); setBusy(false); return; }

  let processed = 0, skipped = 0, failed = 0;
  const counts: Record<string, number> = {};
  const bump = (w: number, h: number) => { const k = `${w}x${h}`; counts[k] = (counts[k] || 0) + 1; };

  try {
    for (const entry of active) {
      const filename = entry.imgName || entry.base;
      let file: File;
      try { file = await entry.imgHandle.getFile(); }
      catch { log(`${filename}: could not read the file.`, true); failed++; continue; }

      let dims: { width: number; height: number };
      try { dims = await imageDimensions(file); }
      catch { log(`${filename}: could not read its dimensions (unsupported format?).`, true); failed++; continue; }

      if (isBucketSize(dims.width, dims.height, buckets)) {
        skipped++; bump(dims.width, dims.height);
        log(`${filename}: already ${dims.width}x${dims.height} — left as-is.`);
        continue;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const res = await window.electronAPI.bucketImage({ imageBytes: bytes, sideMin, sideMax, step });
      if (!res.ok || !res.pngBytes || !res.bucket) {
        log(`${filename}: ${res.error || 'bucketing failed'}`, true);
        failed++;
        continue;
      }
      try {
        // 1) original image + a copy of its .txt into original_images/
        const origImg = await origDir.getFileHandle(filename, { create: true });
        await writeBytes(origImg, bytes);
        if (entry.txtHandle && entry.txtName) {
          try {
            const txtBlob = await entry.txtHandle.getFile();
            const origTxt = await origDir.getFileHandle(entry.txtName, { create: true });
            await writeBytes(origTxt, txtBlob);
          } catch { /* caption copy is best-effort */ }
        }
        // 2) bucketed PNG back to the root under the same stem (inherits the caption)
        const stemPng = entry.base + '.png';
        const outHandle = await dirHandle.getFileHandle(stemPng, { create: true });
        await writeBytes(outHandle, res.pngBytes);
        // 3) drop the original from the root when its name differs from the output
        //    (a .png original is overwritten in place by step 2 instead)
        if (filename !== stemPng) { try { await dirHandle.removeEntry(filename); } catch { /* already gone */ } }
      } catch (err) {
        log(`${filename}: ${err instanceof Error ? err.message : String(err)}`, true);
        failed++;
        continue;
      }
      processed++;
      bump(res.bucket[0], res.bucket[1]);
      log(`${filename} → ${res.bucket[0]}x${res.bucket[1]}${res.provider ? ` (${res.provider})` : ''}`);
    }

    log('');
    log(`Done. Bucketed ${processed}, already-bucketed ${skipped}, failed ${failed}.`);
    for (const k of Object.keys(counts).sort()) log(`  ${k}: ${counts[k]}`);
    toast(`Bucketed ${processed} image(s) — originals are in the Originals view.`, 3600);
  } catch (err) {
    log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, true);
    toast('Bucketing failed — see the dock log.', 4200);
  } finally {
    setBusy(false);
    await reload();
  }
}

// ---------------- revert ----------------

async function revert(): Promise<void> {
  if (busy) return;
  const dirHandle = getDirHandle();
  if (!dirHandle) { toast('Open a dataset folder first.'); return; }
  const originals = getEntries().filter((e) => e.original);
  if (!originals.length) { toast('No originals to restore — nothing has been bucketed.'); return; }

  const { sideMin, sideMax, step } = params();
  const buckets = getValidBuckets(sideMin, sideMax, step);

  // Root images that are already bucket-sized but have NO saved original — the
  // user is asked whether to keep or delete these (they can't be "restored").
  const originalBases = new Set(originals.map((e) => e.base));
  const orphans: Entry[] = [];
  for (const e of getEntries().filter((x) => !x.disabled && !x.original)) {
    if (originalBases.has(e.base)) continue;
    try {
      const dims = await imageDimensions(await e.imgHandle.getFile());
      if (isBucketSize(dims.width, dims.height, buckets)) orphans.push(e);
    } catch { /* unreadable — not a candidate */ }
  }

  const ok = await showConfirmModal(
    `Revert bucketing for ${originals.length} image(s)?\n\n` +
    `This deletes the bucketed copy in the dataset root and moves the original ` +
    `back from original_images/ into the Gallery.`,
    { okLabel: 'Revert bucketing', danger: true }
  );
  if (!ok) return;

  setBusy(true);
  clearLog();
  const origDir = await originalDir(false);
  let restored = 0, failed = 0;
  try {
    for (const entry of originals) {
      const imgName = entry.imgName || entry.base;
      const stemPng = entry.base + '.png';
      try {
        // delete the bucketed copy in the root (skipped if the original itself
        // is the .png we're about to move back over it)
        if (origDir) {
          try { await dirHandle.removeEntry(stemPng); } catch { /* not present */ }
          const file = await entry.imgHandle.getFile();
          const back = await dirHandle.getFileHandle(imgName, { create: true });
          await writeBytes(back, file);
          try { await origDir.removeEntry(imgName); } catch { /* already gone */ }
          if (entry.txtName) { try { await origDir.removeEntry(entry.txtName); } catch { /* no caption copy */ } }
        }
        restored++;
        log(`restored ${imgName}`);
      } catch (err) {
        log(`${imgName}: ${err instanceof Error ? err.message : String(err)}`, true);
        failed++;
      }
    }

    if (orphans.length) {
      const del = await showConfirmModal(
        `${orphans.length} image(s) in the dataset are already bucket-sized but have no saved original ` +
        `(they were never moved to original_images/).\n\nDelete them too? "Keep them" leaves them in the Gallery.`,
        { okLabel: 'Delete them too', cancelLabel: 'Keep them', danger: true }
      );
      if (del) {
        for (const e of orphans) {
          try { await dirHandle.removeEntry(e.imgName || e.base); } catch { /* gone */ }
          if (e.txtName) { try { await dirHandle.removeEntry(e.txtName); } catch { /* no caption */ } }
        }
        log(`deleted ${orphans.length} bucketed image(s) with no original`);
      }
    }

    // the folder has served its purpose — drop it so the Originals view empties
    try { await dirHandle.removeEntry(ORIGINAL_DIR, { recursive: true }); } catch { /* leave it */ }

    log('');
    log(`Done. Restored ${restored}, failed ${failed}.`);
    toast(`Reverted bucketing — restored ${restored} original(s).`, 3600);
  } catch (err) {
    log(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`, true);
    toast('Revert failed — see the dock log.', 4200);
  } finally {
    setBusy(false);
    await reload();
  }
}

export function initBucketImages(deps: BucketImagesDeps): void {
  getDirHandle = deps.getDirHandle;
  getEntries = deps.getEntries;
  reload = deps.reload;
  saveAllDirty = deps.saveAllDirty;

  btnBucketRun.addEventListener('click', () => { void run(); });
  btnBucketRevert.addEventListener('click', () => { void revert(); });
  btnBucketDownloadModel.addEventListener('click', () => { void downloadModel(); });

  window.electronAPI.onBucketDownloadProgress((_event, ev) => {
    bucketModelStatusText.textContent = `Downloading u2net… ${ev.percent}%`;
  });

  void refreshModelStatus();
}
