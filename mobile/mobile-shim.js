// Mobile-only shim, loaded before app.js (see sync-web.js). Makes the
// UNCHANGED desktop renderer/*.ts code work under Capacitor by:
//   1. Polyfilling window.showDirectoryPicker() so it returns an object with
//      the same shape as a real FileSystemDirectoryHandle (entries(),
//      getFileHandle(), getDirectoryHandle(), removeEntry(), and file
//      handles with getFile()/createWritable()) — backed by the native
//      DtsStorage plugin (Android SAF), not the browser API.
//   2. Stubbing window.electronAPI with just enough no-op surface that
//      index.ts/synthdat-overseer.ts's UNGUARDED startup calls
//      (onSynthdatPreviewFrame/onSynthdatProgress) don't throw and crash
//      the whole init() IIFE before the app even renders. Guarded call
//      sites (`if (window.electronAPI && ...)`) are left undefined on
//      purpose so those desktop-only features (hardware accel toggle,
//      export app state, zoom) just quietly don't appear on mobile.
// See notes/Mobile-Port.md for the full rationale — this replaces the
// originally-planned DatasetStorage interface refactor across ~10 renderer
// files with a zero-desktop-changes polyfill instead.
(function () {
  'use strict';

  const Storage = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DtsStorage) || null;

  function mimeFor(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    return {
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp',
      gif: 'image/gif', bmp: 'image/bmp', txt: 'text/plain', json: 'application/json'
    }[ext] || 'application/octet-stream';
  }

  function joinPath(base, name) {
    return base ? base + '/' + name : name;
  }

  function base64ToBytes(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function toBytes(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (data instanceof Blob) return new Uint8Array(await data.arrayBuffer());
    if (typeof data === 'string') return new TextEncoder().encode(data);
    if (data && data.type === 'write' && 'data' in data) return toBytes(data.data);
    throw new Error('Unsupported writable chunk type');
  }

  function notFound(kind) {
    const err = new DOMException('Not found', 'NotFoundError');
    err._dtsKind = kind;
    return err;
  }

  function makeFileHandle(relPath, name) {
    return {
      kind: 'file',
      name,
      async getFile() {
        const res = await Storage.getFileBytes({ path: relPath });
        const bytes = base64ToBytes(res.base64);
        return new File([bytes], name, {
          type: res.mimeType || mimeFor(name),
          lastModified: res.lastModified || Date.now()
        });
      },
      async createWritable() {
        const chunks = [];
        return {
          async write(data) { chunks.push(await toBytes(data)); },
          async close() {
            const total = chunks.reduce((n, c) => n + c.length, 0);
            const combined = new Uint8Array(total);
            let offset = 0;
            for (const c of chunks) { combined.set(c, offset); offset += c.length; }
            await Storage.writeFileBytes({
              path: relPath,
              base64: bytesToBase64(combined),
              mimeType: mimeFor(name)
            });
          }
        };
      }
    };
  }

  // `rootUri` is the picked tree's real content:// URI — only meaningful
  // (non-null) for the ROOT handle a given pickFolder()/revive call
  // returns, threaded through to every handle derived from it purely so
  // requestPermission()/isSameEntry()/toJSON() below have something to
  // work with. Nested handles (from getFileHandle/getDirectoryHandle/
  // entries()) never resolve their OWN storage calls against it directly —
  // those still go through the native plugin's own single "current root"
  // pointer (see DtsStoragePlugin.kt's rootDoc()), same as before.
  function makeDirHandle(relPath, name, rootUri) {
    const self = {
      kind: 'directory',
      name: name || '',
      async getFileHandle(childName, opts) {
        const path = joinPath(relPath, childName);
        const create = !!(opts && opts.create);
        const info = await Storage.stat({ path });
        if (!info.exists) {
          if (!create) throw notFound('file');
          await Storage.writeFileBytes({ path, base64: '', mimeType: mimeFor(childName) });
        }
        return makeFileHandle(path, childName);
      },
      async getDirectoryHandle(childName, opts) {
        const path = joinPath(relPath, childName);
        const create = !!(opts && opts.create);
        const info = await Storage.stat({ path });
        if (!info.exists) {
          if (!create) throw notFound('directory');
          await Storage.createDirectory({ path });
        }
        return makeDirHandle(path, childName, rootUri);
      },
      async removeEntry(childName) {
        await Storage.removeEntry({ path: joinPath(relPath, childName) });
      },
      async *entries() {
        const res = await Storage.listEntries({ path: relPath });
        for (const e of res.files) {
          const childPath = joinPath(relPath, e.name);
          yield [e.name, e.kind === 'directory' ? makeDirHandle(childPath, e.name, rootUri) : makeFileHandle(childPath, e.name)];
        }
      },
      // The rest of the real async-iterator trio. Desktop's folder scan
      // (index.ts scanDirInto) and SynthDat's folder listing iterate
      // values(); with only entries() here, every dataset load threw and
      // showed "Could not load that folder…" (2026-09-27).
      async *values() {
        for await (const [, h] of this.entries()) yield h;
      },
      async *keys() {
        for await (const [n] of this.entries()) yield n;
      },
      [Symbol.asyncIterator]() { return this.entries(); },
      // Real FileSystemDirectoryHandle methods desktop's dataset-manager.ts
      // also calls (a narrower method-surface audit earlier in the mobile
      // port missed these two, being specific to that one file) — Android's
      // SAF persisted-permission model has no "ask again" flow the way the
      // browser API's requestPermission() implies, so this just makes sure
      // the native plugin's current root actually points at THIS handle's
      // folder (relevant when reopening a DIFFERENT tracked dataset than
      // whichever is currently active — see setActiveRoot(), the plugin)
      // and resolves 'granted', since the permission itself was already
      // persisted back at pickFolder() time.
      async requestPermission(opts) {
        if (rootUri) {
          try { await Storage.setActiveRoot({ uri: rootUri }); }
          catch (e) { return 'denied'; }
        }
        return 'granted';
      },
      async isSameEntry(other) {
        return !!(rootUri && other && other._dtsRootUri === rootUri && other._dtsRelPath === relPath);
      },
      // NOT part of the real FileSystemDirectoryHandle API — dataset-
      // manager.ts checks for this before IndexedDB-storing a handle
      // (structured clone can't serialize this object at all, full of
      // closures) and stores this plain, serializable shape instead; see
      // window.__dtsReviveDirHandle below for the other half of that
      // round-trip.
      toJSON() {
        return { __dtsMobileHandle: true, uri: rootUri, name: name || '' };
      },
      _dtsRootUri: rootUri,
      _dtsRelPath: relPath
    };
    return self;
  }

  window.showDirectoryPicker = async function () {
    if (!Storage) throw new Error('DtsStorage native plugin not available');
    const res = await Storage.pickFolder();
    // Deliberately NOT 'No folder was chosen.' here — the renderer's own
    // picker-failure toast uses that exact text for user-cancelled picks, and
    // reusing it for a genuine native failure made real errors
    // indistinguishable from cancellations (see index.ts's split).
    if (!res || !res.uri) throw new Error('The folder picker returned without a folder.');
    return makeDirHandle('', res.name || 'dataset', res.uri);
  };

  // The other half of the toJSON() round-trip above — dataset-manager.ts
  // calls this on any record it loads back out of IndexedDB whose stored
  // `handle` is that plain serialized shape, turning it back into a live,
  // fully-functional handle (same requestPermission()/entries()/etc. as
  // one fresh out of the picker) before using it for anything.
  window.__dtsReviveDirHandle = function (json) {
    return makeDirHandle('', json.name || 'dataset', json.uri);
  };

  // Local (on-device) WD14 tagging — backs DtsWd14Plugin.kt (ONNX Runtime
  // Mobile, NNAPI-with-CPU-fallback). Undefined entirely if the native
  // plugin isn't there (older installed build mid-update, etc.) — wd14-
  // tagger.ts only offers the "On-device" mode when window.Wd14Local exists,
  // same guard-on-existence pattern window.electronAPI's own optional
  // methods already use throughout the desktop code.
  const Wd14 = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.DtsWd14) || null;
  if (Wd14) {
    window.Wd14Local = {
      async listModels() {
        const res = await Wd14.listModels();
        return res.models || [];
      },
      async deleteModel(name) {
        await Wd14.deleteModel({ name });
      },
      // onProgress gets called with {name, part, percent} as the native
      // side streams progress for whichever of the two files (model/tags)
      // it's currently downloading.
      async downloadModel(opts, onProgress) {
        let handle = null;
        if (onProgress) {
          handle = await Wd14.addListener('downloadProgress', (ev) => {
            if (ev.name === opts.name) onProgress(ev);
          });
        }
        try {
          await Wd14.downloadModel(opts);
        } finally {
          if (handle) handle.remove();
        }
      },
      // Normalizes to the same {ok, tagsCsv} / {ok:false, error} shape
      // window.electronAPI.wd14TagImage already returns on desktop
      // (wd14-tagger.ts's parseWd14Tags()/tagOneWithRetry() consume both
      // identically) — a rejected native call becomes {ok:false}, not a
      // thrown exception, matching that existing contract exactly.
      async tagImage({ name, imageBytes, threshold, characterThreshold }) {
        try {
          const res = await Wd14.tagImage({
            name, imageBase64: bytesToBase64(imageBytes), threshold, characterThreshold
          });
          return { ok: true, tagsCsv: res.tagsCsv };
        } catch (e) {
          return { ok: false, error: (e && e.message) || String(e) };
        }
      }
    };
  }

  window.electronAPI = {
    onSynthdatPreviewFrame() {},
    onSynthdatProgress() {},
    // Every main-process EVENT hook the renderer subscribes to at boot
    // (preload.ts's on* surface) must exist here: those subscriptions are
    // unguarded, and one missing hook throws and aborts the rest of app.js's
    // init. Bucket Images doesn't ship on Android, but its module still
    // subscribes. When preload.ts gains an on* hook, add it here too.
    onBucketDownloadProgress() {},
    onRequestClose() {},
    synthdatStopGeneration() {}
  };

  // "Add images…" through Android's app chooser (DtsStoragePlugin.pickImages)
  // instead of the WebView's single built-in picker, so any installed
  // gallery/file-manager app can supply the images. index.ts calls this when
  // present. Providers sometimes return a bare id for the name ("1000012345");
  // the extension is restored from the MIME type so the app's image check
  // accepts it.
  const EXT_FOR = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/bmp': '.bmp' };
  if (Storage && Storage.pickImages) {
    window.__dtsPickImages = async () => {
      const res = await Storage.pickImages({ multiple: true, title: 'Add images with…' });
      return (res.files || []).map((f) => {
        let name = String(f.name || 'image').replace(/[\\/:*?"<>|]/g, '_');
        if (!/\.[a-z0-9]{2,5}$/i.test(name) && EXT_FOR[f.mimeType]) name += EXT_FOR[f.mimeType];
        return new File([base64ToBytes(f.base64)], name, { type: f.mimeType || 'image/*' });
      });
    };
  }

  // Hardware/gesture Back (@capacitor/app). Registering any backButton
  // listener replaces Android's default (which finished the activity at
  // once — Back quit the app from anywhere). The renderer owns the logic:
  // window.__dtsHandleBack (index.ts) closes the top layer — menu, dialog,
  // sheet, panel — or steps back a tab, and at the root asks to confirm,
  // then calls __dtsExitApp.
  const AppPlugin = (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) || null;
  if (AppPlugin) {
    window.__dtsExitApp = () => { AppPlugin.exitApp(); };
    AppPlugin.addListener('backButton', () => {
      const handle = window.__dtsHandleBack;
      if (typeof handle !== 'function' || !handle()) AppPlugin.exitApp();
    });
  }

  // electronAPI: everything else (getAppVersion, hardware accel,
  // exportAppState, setZoomFactor, wd14*/synthdat* generation calls) is left
  // undefined on purpose — every other call site in the desktop code guards
  // on `window.electronAPI.xyz` existing first, so those desktop-only
  // features just don't show up on mobile rather than crashing. wd14*/
  // synthdat* generation has its own mobile implementation (direct fetch()
  // to ComfyUI instead of the IPC bridge) — see notes/Apps/Mobile-Networking.md.
})();
