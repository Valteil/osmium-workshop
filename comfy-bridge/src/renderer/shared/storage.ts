// Shared storage backend + filename helpers for Comfy Bridge gallery/save.
// Platform-agnostic: desktop implements StorageBackend over Electron IPC,
// mobile over SAF (BridgeStorage) or the Capacitor Filesystem plugin. Both
// shells consume scanImages()/nextFileNumber()/groupByFolder() from here so
// numbering, ordering, and grouping stay identical everywhere.
export interface DirEntry {
  name: string;
  kind: 'file' | 'directory';
  mtime?: number;
}

export interface StorageBackend {
  listDir(relDir: string): Promise<DirEntry[]>;
  readImage(relPath: string): Promise<string | null>;
  writeImage(relPath: string, base64: string, mimeType: string): Promise<void>;
}

export const GALLERY_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];

export function joinRel(base: string, rel: string): string {
  if (!rel) return base || '';
  return base ? base + '/' + rel : rel;
}

export function isGalleryImage(name: string): boolean {
  const lower = (name || '').toLowerCase();
  return GALLERY_EXTS.some((ext) => lower.endsWith(ext));
}

// Recursive scan of the backend's root, returning image rel paths
// (subfolders included). Per-directory failures resolve as empty — a folder
// that can't be read simply contributes nothing.
export async function scanImages(backend: StorageBackend): Promise<string[]> {
  const out: string[] = [];
  async function walk(relDir: string): Promise<void> {
    let entries: DirEntry[];
    try {
      entries = await backend.listDir(relDir);
    } catch {
      return;
    }
    const subdirs: string[] = [];
    for (const f of entries) {
      if (!f || !f.name) continue;
      const childRel = relDir ? relDir + '/' + f.name : f.name;
      if (f.kind === 'directory') {
        subdirs.push(childRel);
        continue;
      }
      if (f.kind !== 'file') continue;
      if (isGalleryImage(f.name)) out.push(childRel);
    }
    for (const sub of subdirs) await walk(sub);
  }
  await walk('');
  return out;
}

// Leading number of N.png / N_pass1.png, or -1 for anything else.
export function fileNumber(name: string): number {
  const m = /^(\d+)(_pass1)?\.png$/i.exec(name || '');
  return m ? parseInt(m[1], 10) || 0 : -1;
}

// Next sequential filename number: highest N among the ROOT's own files
// plus one (subfolders have independent numbering). Starts at 1.
export async function nextFileNumber(backend: StorageBackend): Promise<number> {
  let entries: DirEntry[];
  try {
    entries = await backend.listDir('');
  } catch {
    return 1;
  }
  let max = 0;
  for (const f of entries) {
    if (f && f.kind === 'file') {
      const n = fileNumber(f.name);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

export interface FolderGroup {
  key: string;
  items: string[];
}

// Group rel paths by subfolder (root files under ''), root group first then
// alphabetical, newest number first within each group.
export function groupByFolder(rels: string[]): FolderGroup[] {
  const groups = new Map<string, string[]>();
  for (const rel of rels) {
    const slash = rel.lastIndexOf('/');
    const key = slash < 0 ? '' : rel.slice(0, slash);
    const arr = groups.get(key);
    if (arr) arr.push(rel);
    else groups.set(key, [rel]);
  }
  const numOf = (rel: string): number => fileNumber(rel.slice(rel.lastIndexOf('/') + 1));
  const ordered = [...groups.keys()].sort((a, b) => {
    if (!a) return -1;
    if (!b) return 1;
    return a < b ? -1 : 1;
  });
  return ordered.map((key) => ({
    key,
    items: (groups.get(key) || []).sort((a, b) => numOf(b) - numOf(a) || (b < a ? -1 : 1)),
  }));
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}
