// IPC sender guard — extracted from main.ts so it is a small, dependency-free
// unit that can be required and tested directly (see tools/redteam). It does
// NOT import electron: the guard only needs a frame's URL, so a fake event
// object `{ senderFrame: { url } }` is enough to exercise it.
//
// Ported from the desktop root app's src/ipc-guard.ts (ports, not a shared
// import — Bridge is a separate Electron app). Every ipcMain.handle is wrapped
// once in main.ts, before registerComfyLocalHandlers, so no handler can run for
// a frame that isn't the app's own renderer page. The trusted page URL is the
// exact file:// URL the window loads, compared with query/hash stripped (a
// loose prefix match would let `.../index.html.evil` through).
import { pathToFileURL } from 'url';

let trustedRendererUrl = '';

export function normalizePageUrl(u: string): string {
  try { const parsed = new URL(u); return parsed.origin + parsed.pathname; }
  catch { return u; }
}

export function setTrustedRenderer(pagePath: string): void {
  trustedRendererUrl = normalizePageUrl(pathToFileURL(pagePath).href);
}

export function assertTrustedFrame(event: { senderFrame?: { url?: string } | null } | null | undefined): void {
  const frameUrl = event && event.senderFrame ? normalizePageUrl(event.senderFrame.url || '') : '';
  if (!trustedRendererUrl || frameUrl !== trustedRendererUrl) {
    throw new Error('IPC rejected: untrusted sender frame.');
  }
}

// Test seam: the trusted URL, read-only. Lets a test confirm what was set.
export function trustedRenderer(): string {
  return trustedRendererUrl;
}
