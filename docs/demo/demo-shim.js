// Browser-demo shim, loaded before app.js. Runs the UNCHANGED desktop
// renderer in a plain browser tab as a self-contained mockup:
//
//   - No access to the visitor's own folders, ever. showDirectoryPicker is
//     replaced by one built-in sample dataset ("Chromatic Void", served from
//     ./dataset/). It opens automatically, and every write (tags, the edit
//     log, Disabled/, accepted SynthDat images) lives in memory only.
//   - Nothing persists: every reload starts fresh. The app's own saved state
//     (localStorage dts-* keys and its IndexedDB folder lists) is wiped
//     before app.js runs. dts-theme survives on purpose: the site's theme
//     picker hands its choice to the demo through it.
//   - The images start untagged. "WD14" answers with each image's real tags
//     from dataset/manifest.json (no inference happens: nobody is behind a
//     web page to run a model).
//   - SynthDat talks to a pretend ComfyUI: fake model lists, prompt fields
//     prefilled and locked, and each Generate returns a plain solid-color
//     image carrying those same preset tags.
//   - window.electronAPI also keeps the no-op event hooks the renderer
//     subscribes to at startup (preload.js's on* surface); an unguarded
//     missing hook throws and aborts app.js's init. Add new on* hooks here
//     when preload.js grows one.
(function () {
  'use strict';

  // ---------- fresh start on every load ----------
  try {
    Object.keys(localStorage).forEach(function (k) {
      if (k.indexOf('dts-') === 0 && k !== 'dts-theme') localStorage.removeItem(k);
    });
    localStorage.setItem('dts-tag-autocomplete', '1');
    localStorage.setItem('dts-wd14-settings', JSON.stringify({
      host: 'http://127.0.0.1:8188', model: 'wd-eva02-large-tagger-v3', threshold: 0.35,
      characterThreshold: 0.85, trailingComma: false, excludeTags: '', autoApply: false,
      mode: 'comfyui', localModel: '', gpu: true
    }));
  } catch (e) {}
  ['dts-dataset-manager-db', 'dts-favorites-db'].forEach(function (n) {
    try { indexedDB.deleteDatabase(n); } catch (e) {}
  });

  // ---------- the sample dataset, as an in-memory folder ----------
  var BASE = 'dataset/';
  var manifestP = fetch(BASE + 'manifest.json').then(function (r) { return r.json(); });
  var MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', txt: 'text/plain', json: 'application/json' };
  function mime(name) { return MIME[(name.split('.').pop() || '').toLowerCase()] || ''; }
  function notFound() { var e = new Error('A requested file or directory could not be found.'); e.name = 'NotFoundError'; return e; }

  // Tree nodes: {kind:'dir', children:Map} or {kind:'file', url?, blob?}.
  function dirNode() { return { kind: 'dir', children: new Map() }; }
  var rootNode = null;
  var rootHandle = null;

  function fileHandle(node, name) {
    return {
      kind: 'file', name: name, _node: node,
      async getFile() {
        if (!node.blob && node.url) node.blob = await fetch(node.url).then(function (r) { return r.blob(); });
        return new File([node.blob || new Blob([])], name, { type: mime(name), lastModified: node.mtime || 0 });
      },
      async createWritable() {
        var parts = [];
        return {
          async write(d) {
            if (d && typeof d === 'object' && d.type === 'write') d = d.data;
            parts.push(d instanceof ArrayBuffer || ArrayBuffer.isView(d) || d instanceof Blob ? d : String(d));
          },
          async truncate() {}, async abort() {},
          async close() { node.blob = new Blob(parts, { type: mime(name) }); node.url = null; node.mtime = Date.now(); }
        };
      },
      async isSameEntry(o) { return !!o && o._node === node; },
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; }
    };
  }
  function dirHandle(node, name) {
    var self = {
      kind: 'directory', name: name, _node: node,
      async getFileHandle(n, o) {
        var c = node.children.get(n);
        if (!c) {
          if (!(o && o.create)) throw notFound();
          c = { kind: 'file', blob: new Blob([]), mtime: Date.now() };
          node.children.set(n, c);
        }
        if (c.kind !== 'file') throw notFound();
        return fileHandle(c, n);
      },
      async getDirectoryHandle(n, o) {
        var c = node.children.get(n);
        if (!c) {
          if (!(o && o.create)) throw notFound();
          c = dirNode();
          node.children.set(n, c);
        }
        if (c.kind !== 'dir') throw notFound();
        return dirHandle(c, n);
      },
      async removeEntry(n) {
        if (!node.children.delete(n)) throw notFound();
      },
      entries: async function* () {
        for (var pair of Array.from(node.children.entries())) {
          var n = pair[0], c = pair[1];
          yield [n, c.kind === 'dir' ? dirHandle(c, n) : fileHandle(c, n)];
        }
      },
      values: async function* () { for await (var p of self.entries()) yield p[1]; },
      keys: async function* () { for await (var p of self.entries()) yield p[0]; },
      async resolve() { return null; },
      async isSameEntry(o) { return !!o && o._node === node; },
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; },
      // IndexedDB can't store this object; the Datasets tab stores this shape
      // instead and revives it through __dtsReviveDirHandle below.
      toJSON() { return { __dtsMobileHandle: true, name: name }; }
    };
    self[Symbol.asyncIterator] = self.entries;
    return self;
  }

  function synthSettings() {
    // Preset SynthDat prompt: the sample set's own tags, sorted into fields.
    return {
      host: 'http://127.0.0.1:8188', unifiedPromptMode: false, unifiedPrompt: '',
      global: 'chromatic void', character: '1girl, solo', characterTrigger: '', rating: 'general',
      hair: 'white hair, medium hair, blunt bangs, hair intakes, rabbit hair ornament',
      face: 'green eyes, smile, closed mouth, colored eyelashes',
      chest: '', body: '',
      clothes: 'white jacket, puffy long sleeves, high collar, zipper, belt pouch',
      limbs: 'own hands together, interlocked fingers', sexual: '', pose: 'standing',
      scene: 'upper body, from below, simple background, white background', effects: 'sparkle', extra: '',
      negative: 'lowres, bad anatomy, watermark',
      diffModel: 'anima-preview.safetensors', clip: 'qwen_3_06b_base.safetensors', vae: 'qwen_image_vae.safetensors',
      mainLora: 'chromatic_void_v1.safetensors',
      loraRows: [{ lora: 'detail_tweaker.safetensors', strength: '0.6' }],
      lliteStrength: '1', lliteStartPercent: '0', lliteEndPercent: '0.3', llitePreserveWrapper: true,
      resizeFit: 'pad', resizeMethod: 'lanczos', sampler: 'res_multistep', scheduler: 'beta',
      steps1: '25', cfg1: '4.04', steps2: '15', width: '832', height: '1216', use2Pass: false,
      seed1: '15', seed2: '15', denoise2: '0.6', stripHairFace: true, skipRefImage: true
    };
  }

  function buildRoot(manifest) {
    var root = dirNode();
    manifest.images.forEach(function (f) { root.children.set(f, { kind: 'file', url: BASE + f, mtime: 0 }); });
    root.children.set('_dts_synthdat_settings.json', {
      kind: 'file', blob: new Blob([JSON.stringify(synthSettings(), null, 2)], { type: 'application/json' }), mtime: 0
    });
    return root;
  }

  window.showDirectoryPicker = async function () {
    if (!rootHandle) {
      var m = await manifestP;
      rootNode = buildRoot(m);
      rootHandle = dirHandle(rootNode, m.name);
    }
    return rootHandle;
  };
  window.__dtsReviveDirHandle = function () { return rootHandle || dirHandle(dirNode(), 'Chromatic Void'); };

  // Track the sample set in the Datasets tab from the start (so the
  // "add to Dataset tab?" prompt never appears for it).
  manifestP.then(function (m) {
    var req = indexedDB.open('dts-dataset-manager-db', 1);
    req.onupgradeneeded = function () {
      if (!req.result.objectStoreNames.contains('folders')) req.result.createObjectStore('folders', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = function () {
      var db = req.result;
      var tx = db.transaction('folders', 'readwrite');
      tx.objectStore('folders').add({
        name: m.name, handle: { __dtsMobileHandle: true, name: m.name }, addedAt: Date.now(), lastOpenedAt: Date.now(),
        pinned: false, iconMode: 'generic', iconImageBase: null, iconImageDataUrl: null, groupId: 0
      });
      tx.oncomplete = function () { db.close(); };
    };
  });

  // ---------- pretend ComfyUI / WD14 ----------
  var lastSynthTags = null;
  function csvFromSettingsTags() {
    var s = synthSettings();
    return ['character', 'rating', 'clothes', 'limbs', 'pose', 'scene', 'effects']
      .map(function (k) { return s[k]; }).filter(Boolean).join(', ');
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function solidPng(w, h) {
    var tones = ['#b8c4d8', '#c9bfd9', '#a9c7c2', '#d6c3c9', '#bfc8b5', '#c2cbe0'];
    var c = document.createElement('canvas');
    c.width = w; c.height = h;
    var x = c.getContext('2d');
    x.fillStyle = tones[Math.floor(Math.random() * tones.length)];
    x.fillRect(0, 0, w, h);
    return new Promise(function (res) {
      c.toBlob(function (b) { b.arrayBuffer().then(function (buf) { res(new Uint8Array(buf)); }); }, 'image/png');
    });
  }

  window.electronAPI = {
    onSynthdatPreviewFrame() {},
    onSynthdatProgress() {},
    onBucketDownloadProgress() {},
    onWd14LocalDownloadProgress() {},
    onRequestClose() {},
    async synthdatStopGeneration() { return { ok: true }; },
    async bucketModelStatus() { return { present: false }; },

    async wd14GetModels() {
      return { ok: true, models: ['wd-eva02-large-tagger-v3', 'wd-vit-large-tagger-v3', 'wd-swinv2-tagger-v3'] };
    },
    async wd14TagImage(p) {
      await wait(450);
      var m = await manifestP;
      var base = String(p.filename || '').replace(/\.[^.]+$/, '');
      var tags = m.tags[base] || (lastSynthTags || csvFromSettingsTags());
      return { ok: true, tagsCsv: tags, provider: 'demo' };
    },

    async synthdatGetObjectInfo(p) {
      var lists = {
        UNETLoader: ['anima-preview.safetensors'],
        CLIPLoader: ['qwen_3_06b_base.safetensors'],
        VAELoader: ['qwen_image_vae.safetensors'],
        'DSM Lora Name': ['chromatic_void_v1.safetensors'],
        'DSM Lora Loader Stack': ['None', 'detail_tweaker.safetensors']
      };
      return { ok: true, values: lists[p && p.classType] || [] };
    },
    async synthdatQueueAndFetch() {
      await wait(1400);
      lastSynthTags = csvFromSettingsTags();
      return { ok: true, imageBytes: await solidPng(832, 1216) };
    }
  };

  // ---------- open the sample set, lock SynthDat's inputs ----------
  var LOCKED = '#synthDatTab textarea, #synthDatHost, #synthDatDiffModel, #synthDatClip, #synthDatVae, #synthDatMainLora,' +
    ' #synthDatLoraStackRows input, #synthDatSkipRefImage, #synthDatUnifiedPromptMode, #btnSynthDatAddLora,' +
    ' #btnSynthDatPickImage, #btnSynthDatInterrogate, #btnSynthDatMigratePose, #btnSynthDatSwapReso, #synthDatWidth, #synthDatHeight';
  var style = document.createElement('style');
  style.textContent = LOCKED.split(',').map(function (s) { return s.trim(); }).join(', ') +
    '{ pointer-events:none !important; opacity:.72; }';
  document.documentElement.appendChild(style);

  function lockInputs() {
    document.querySelectorAll(LOCKED).forEach(function (el) {
      if ('readOnly' in el && el.tagName !== 'BUTTON' && el.type !== 'checkbox') el.readOnly = true;
      else el.disabled = true;
      el.title = 'Locked in the web demo';
      el.setAttribute('tabindex', '-1');
    });
  }

  window.addEventListener('load', function () {
    lockInputs();
    // LoRA rows are rebuilt whenever settings load; keep them locked too.
    var rows = document.getElementById('synthDatLoraStackRows');
    if (rows) new MutationObserver(lockInputs).observe(rows, { childList: true, subtree: true });
    setTimeout(function () {
      var open = document.getElementById('btnOpen');
      if (open) open.click();
    }, 150);
  });
})();
