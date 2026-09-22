import type { DirHandle, FileHandle } from './types';

// The DOM lib doesn't declare the File System Access pickers (showDirectoryPicker
// / showOpenFilePicker / showSaveFilePicker), so every call site used to
// hand-write the same `(window as unknown as {...})` cast — and the same
// "is it available?" guard, twice per API. This module keeps both in one place
// and exposes plain typed functions. The mobile shim polyfills
// showDirectoryPicker, so these work unchanged on Android too.
interface FsaWindow {
  showDirectoryPicker?(opts?: { mode?: 'read' | 'readwrite' }): Promise<DirHandle>;
  showOpenFilePicker?(opts?: unknown): Promise<FileHandle[]>;
  showSaveFilePicker?(opts?: unknown): Promise<FileHandle>;
}

const fsa = window as unknown as FsaWindow;

export function hasDirectoryPicker(): boolean { return typeof fsa.showDirectoryPicker === 'function'; }
export function hasOpenFilePicker(): boolean { return typeof fsa.showOpenFilePicker === 'function'; }
export function hasSaveFilePicker(): boolean { return typeof fsa.showSaveFilePicker === 'function'; }

export function pickDirectory(opts: { mode?: 'read' | 'readwrite' } = {}): Promise<DirHandle> {
  return fsa.showDirectoryPicker!(opts);
}

export function pickOpenFiles(opts: unknown): Promise<FileHandle[]> {
  return fsa.showOpenFilePicker!(opts);
}

export function pickSaveFile(opts: unknown): Promise<FileHandle> {
  return fsa.showSaveFilePicker!(opts);
}

// The real FileSystemDirectoryHandle exposes requestPermission(); the mobile
// shim adds it too. Optional in types.ts, so this guards before calling.
export async function requestPermission(handle: DirHandle, mode: 'read' | 'readwrite'): Promise<string> {
  const h = handle as DirHandle & { requestPermission?(opts: { mode: string }): Promise<string> };
  return h.requestPermission ? h.requestPermission({ mode }) : 'granted';
}

// Mobile shim handles serialize to a plain {__dtsMobileHandle:true,...} object
// (the polyfill is full of closures and can't be structured-cloned into
// IndexedDB); desktop's real handles have no toJSON and pass through unchanged.
export function serializeHandle(handle: DirHandle): unknown {
  const h = handle as DirHandle & { toJSON?(): unknown };
  return h.toJSON ? h.toJSON() : handle;
}

export function isMobileHandle(value: unknown): boolean {
  return !!(value && (value as { __dtsMobileHandle?: boolean }).__dtsMobileHandle);
}

export function reviveHandle(value: unknown): DirHandle {
  return window.__dtsReviveDirHandle ? (window.__dtsReviveDirHandle(value) as unknown as DirHandle) : (value as DirHandle);
}

// Collapses the createWritable() -> write() -> close() sequence repeated at
// every file write in the renderer.
export async function writeBytes(handle: FileHandle, data: Blob | Uint8Array | string): Promise<void> {
  const writable = await handle.createWritable();
  await writable.write(data);
  await writable.close();
}
