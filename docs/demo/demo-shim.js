// Browser-demo shim, loaded before app.js. Lets the UNCHANGED desktop
// renderer run in a plain browser tab (no Electron, no Capacitor):
//
//   - window.showDirectoryPicker() needs no polyfill here — desktop
//     Chrome/Edge implement the File System Access API natively, so folder
//     access is real, local, and never touches a server. (See
//     mobile/mobile-shim.js for the Android case, which DOES need a
//     polyfill since WebView has no native implementation.)
//   - window.electronAPI is stubbed with just the same bare no-op surface
//     mobile-shim.js uses, so index.ts/synthdat-overseer.ts's unguarded
//     startup calls (onSynthdatPreviewFrame/onSynthdatProgress) don't throw
//     and crash init() before the app renders. Every other electronAPI
//     method is left undefined on purpose: every other call site in the
//     desktop code already guards on `window.electronAPI.xyz` existing
//     first (getAppVersion, hardware accel, WD14/SynthDat network calls,
//     export app state, zoom), so those desktop- and ComfyUI-dependent
//     features just quietly don't appear here, same as on mobile today.
(function () {
  'use strict';
  window.electronAPI = {
    // Every main-process EVENT hook the renderer subscribes to at startup
    // (preload.js's on* surface) needs a no-op here, or the unguarded
    // subscription throws and aborts app.js's init — Bucket Images'
    // onBucketDownloadProgress did exactly that once it shipped, silently
    // breaking the whole demo until this list caught up. Add new on* hooks
    // here when preload.js grows one.
    onSynthdatPreviewFrame() {},
    onSynthdatProgress() {},
    onBucketDownloadProgress() {},
    onWd14LocalDownloadProgress() {},
    onRequestClose() {},
    synthdatStopGeneration() {},
    // SynthDat Overseer's model-list refresh runs unconditionally at tab
    // init (unlike every other ComfyUI/ WD14 call, which is guarded behind
    // a user-clicked button) — synthdat-workflow-map.ts wasn't written with
    // a no-ComfyUI environment in mind. Answering "no models" instead of
    // leaving this undefined avoids an unhandled rejection on page load;
    // the SynthDat tab itself still isn't usable here since every other
    // ComfyUI call stays unstubbed.
    async synthdatGetObjectInfo() {
      return { ok: true, values: [] };
    }
  };
})();
