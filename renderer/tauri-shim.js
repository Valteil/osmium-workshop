// Tauri port of preload.ts's contextBridge surface. This file is shared by
// BOTH the Electron and Tauri builds (same renderer/ folder, same
// index.html) — under Electron, `window.electronAPI` is already defined by
// preload.ts's contextBridge before any page script runs, so the guard
// below is a no-op there. Under Tauri there is no separate preload phase;
// `window.__TAURI__` (exposed globally via tauri.conf.json's
// `app.withGlobalTauri: true`) is what this defines `window.electronAPI` in
// terms of, so every other renderer module can keep calling
// `window.electronAPI.*` exactly as before with zero changes.
//
// Rust command names (src-tauri/src/lib.rs, src-tauri/src/wd14.rs):
// set_zoom_factor, confirm_close, restart_app, wd14_get_models,
// wd14_tag_image. `generateGithubPackage` has no Rust command yet — the
// GitHub-package export feature needs its source files bundled as Tauri
// `resources` first (see main.ts's copyGithubPackageSource() for what it
// ports); it's stubbed to fail cleanly rather than throwing.
(function () {
  if (window.electronAPI || !window.__TAURI__) return;
  const { invoke } = window.__TAURI__.core;
  const { listen } = window.__TAURI__.event;

  // The Quit button (index.ts) just calls the plain DOM `window.close()`,
  // relying on it to trigger the same unsaved-changes guard as the OS close
  // button — true under Electron, but NOT true here: granting the
  // `core:window:allow-close` permission Tauri requires for `window.close()`
  // to do anything at all also lets it close the webview DIRECTLY, bypassing
  // `on_window_event`'s `WindowEvent::CloseRequested` guard entirely (that
  // hook only fires for OS/window-manager-initiated close requests — the
  // native X button, Alt+F4 — not a script's own close command). Confirmed
  // live: with the permission granted, clicking Quit closed the webview
  // immediately with no dirty-check, then left the Rust process running
  // with no window at all afterward (nothing left to call
  // `std::process::exit` from). Fix: override `window.close` to run the
  // SAME stored callback the OS-close path uses, instead of ever calling
  // Tauri's own window-close command.
  let requestCloseCallback = null;
  window.close = () => { if (requestCloseCallback) requestCloseCallback(); };

  window.electronAPI = {
    restartApp: () => invoke('restart_app'),
    setZoomFactor: (factor) => invoke('set_zoom_factor', { factor }),
    generateGithubPackage: () =>
      Promise.resolve({
        ok: false,
        message: 'Generate GitHub package isn\'t available in this build yet.'
      }),
    onRequestClose: (callback) => {
      requestCloseCallback = callback;
      listen('request-close', () => callback());
    },
    confirmClose: () => invoke('confirm_close'),
    wd14GetModels: (host) => invoke('wd14_get_models', { host }),
    wd14TagImage: (payload) => invoke('wd14_tag_image', payload)
  };
})();
