// Comfy Bridge for Android — plain JS, no build step (this is a staged
// Capacitor app, not part of the desktop TS build). Ports comfy-bridge's
// desktop src/renderer/app.ts to run directly in a Capacitor WebView:
//   - ComfyUI calls use fetch()/WebSocket directly (same approach as the
//     parent Osmium Workshop project's src/renderer/comfy-client.ts) —
//     no Electron main-process IPC bridge needed at all on mobile.
//   - Reference image comes from a plain <input type="file"> (no
//     showOpenFilePicker in a WebView).
//   - Generated images save via the Capacitor Filesystem plugin into this
//     device's Pictures/ComfyBridge folder — no output-folder picker; that's
//     a fixed, predictable location instead (see README.md for why a full
//     SAF folder picker, like the main app's DtsStorage plugin, was left
//     for later rather than staged here).
//   - Presets persist to localStorage instead of a userData JSON file.
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  const host = $('host');
  const btnConnect = $('btnConnect');
  const connStatus = $('connStatus');
  const saveLocationLabel = $('saveLocationLabel');
  const btnPickFolder = $('btnPickFolder');
  const btnDefaultFolder = $('btnDefaultFolder');

  const skipRefImage = $('skipRefImage');
  const refImageSection = $('refImageSection');
  const btnPickImage = $('btnPickImage');
  const refFileInput = $('refFileInput');
  const refFileName = $('refFileName');
  const refPreview = $('refPreview');

  const diffModel = $('diffModel'), diffModelList = $('diffModelList');
  const clip = $('clip'), clipList = $('clipList');
  const vae = $('vae'), vaeList = $('vaeList');
  const mainLora = $('mainLora'), mainLoraList = $('mainLoraList');
  const btnRefreshModels = $('btnRefreshModels');

  const loraStackRows = $('loraStackRows');
  const loraList = $('loraList');
  const btnAddLora = $('btnAddLora');

  const lliteSection = $('lliteSection');
  const lliteStrength = $('lliteStrength');
  const lliteStartPercent = $('lliteStartPercent');
  const lliteEndPercent = $('lliteEndPercent');
  const llitePreserveWrapper = $('llitePreserveWrapper');
  const resizeFit = $('resizeFit');
  const resizeMethod = $('resizeMethod');

  const unifiedPromptMode = $('unifiedPromptMode');
  const unifiedPromptRow = $('unifiedPromptRow');
  const unifiedPrompt = $('unifiedPrompt');
  const splitFieldsGroup = $('splitFieldsGroup');
  const global_ = $('global'), character = $('character'), rating = $('rating');
  const hair = $('hair'), face = $('face'), chest = $('chest'), body_ = $('body');
  const clothes = $('clothes'), limbs = $('limbs'), sexual = $('sexual'), pose = $('pose');
  const scene = $('scene'), effects = $('effects'), extra = $('extra');
  const characterTrigger = $('characterTrigger'), negative = $('negative');

  const width = $('width'), height = $('height'), btnSwapReso = $('btnSwapReso');
  const sampler = $('sampler'), scheduler = $('scheduler');
  const steps1 = $('steps1'), cfg1 = $('cfg1'), seed1 = $('seed1');
  const use2Pass = $('use2Pass'), pass2Fields = $('pass2Fields');
  const steps2 = $('steps2'), denoise2 = $('denoise2'), seed2 = $('seed2');

  const upscaleEnabled = $('upscaleEnabled');
  const upscaleModelRow = $('upscaleModelRow');
  const upscaleModel = $('upscaleModel');
  const upscaleModelList = $('upscaleModelList');
  const upscaleScaleBy = $('upscaleScaleBy');

  const btnGenerate = $('btnGenerate');
  const btnStop = $('btnStop');
  const genStatus = $('genStatus');
  const livePreviewWrap = $('livePreviewWrap');
  const livePreview = $('livePreview');
  const preview = $('preview');
  const previewEmpty = $('previewEmpty');
  const logBox = $('log');

  const promptPresetSelect = $('promptPresetSelect');
  const promptPresetName = $('promptPresetName');
  const btnSavePromptPreset = $('btnSavePromptPreset');
  const btnLoadPromptPreset = $('btnLoadPromptPreset');
  const btnDeletePromptPreset = $('btnDeletePromptPreset');
  const negativePresetSelect = $('negativePresetSelect');
  const negativePresetName = $('negativePresetName');
  const btnSaveNegativePreset = $('btnSaveNegativePreset');
  const btnLoadNegativePreset = $('btnLoadNegativePreset');
  const btnDeleteNegativePreset = $('btnDeleteNegativePreset');

  function log(msg) {
    const line = document.createElement('div');
    line.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    logBox.appendChild(line);
    logBox.scrollTop = logBox.scrollHeight;
  }

  // Remote URL: any reachable ComfyUI base URL works as-is — LAN IP
  // (http://192.168.x.x:8188), hotspot gateway IP, or Tailscale IP/hostname
  // (http://100.x.y.z:8188 or http://mymachine.tailnet.ts.net:8188). A bare
  // IP/hostname gets http:// prepended; a trailing slash is stripped so
  // `new URL('/prompt', host)` below never produces a double-slash. The host
  // is persisted so the field survives app restarts.
  var HOST_KEY = 'comfybridge-host';
  try {
    var savedHost = localStorage.getItem(HOST_KEY);
    if (savedHost) host.value = savedHost;
  } catch (e) { /* best effort */ }
  host.addEventListener('change', function () {
    try { localStorage.setItem(HOST_KEY, (host.value || '').trim()); } catch (e) { /* best effort */ }
  });

  function getHost() {
    let h = (host.value || '').trim() || 'http://127.0.0.1:8188';
    if (!/^https?:\/\//i.test(h)) h = 'http://' + h;
    return h.replace(/\/+$/, '');
  }

  function fillDatalist(el, values) {
    el.innerHTML = '';
    for (const v of values) {
      const opt = document.createElement('option');
      opt.value = v;
      el.appendChild(opt);
    }
  }

  function fieldValue(el) { return (el.value || '').trim(); }

  // ---------------- Save location: SAF folder or Documents fallback ----------------
  // "Pick folder…" opens Android's Storage Access Framework picker (any
  // folder on the device) via the BridgeStorage native plugin — same
  // approach as the parent app's DtsStorage plugin. The grant persists
  // across restarts (re-applied at boot via setActiveRoot); "Use default"
  // clears it back to Documents via the Filesystem plugin. Generations save
  // directly into the active root — the app never creates its own subfolder;
  // subfolders are only ever READ (gallery groups by them, numbering counts
  // the root's own files).
  var SAF_KEY = 'comfybridge-saf-folder';
  function safPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BridgeStorage;
  }
  let safRoot = null; // {uri, name} once a SAF folder is picked and active
  function saveLocationLabelText() {
    return safRoot ? safRoot.name : 'Documents';
  }
  function refreshSaveLocationLabel() { saveLocationLabel.textContent = saveLocationLabelText(); }
  async function initSafRoot() {
    refreshSaveLocationLabel();
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(SAF_KEY) || 'null'); } catch (e) { /* no saved folder */ }
    if (!saved || !saved.uri || !safPlugin()) return;
    try {
      const res = await safPlugin().setActiveRoot({ uri: saved.uri });
      safRoot = { uri: saved.uri, name: (res && res.name) || saved.name || 'folder' };
    } catch (e) {
      try { localStorage.removeItem(SAF_KEY); } catch (e2) { /* best effort */ }
      safRoot = null;
      log('Saved folder permission lost — pick it again or keep the default.');
    }
    refreshSaveLocationLabel();
  }
  btnPickFolder.addEventListener('click', async () => {
    if (!safPlugin()) { log('Folder picker not available in this build.'); return; }
    try {
      const res = await safPlugin().pickFolder();
      safRoot = { uri: res.uri, name: res.name || 'folder' };
      try { localStorage.setItem(SAF_KEY, JSON.stringify(safRoot)); } catch (e) { /* best effort */ }
      refreshSaveLocationLabel();
      log('Save location: ' + saveLocationLabelText());
    } catch (e) {
      if ((e && e.message) !== 'User cancelled') log('Folder pick failed: ' + (e && e.message));
    }
  });
  btnDefaultFolder.addEventListener('click', () => {
    safRoot = null;
    try { localStorage.removeItem(SAF_KEY); } catch (e) { /* best effort */ }
    refreshSaveLocationLabel();
    log('Save location: ' + saveLocationLabelText());
  });

  function fsPlugin() {
    return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Filesystem;
  }

  // Public shared storage root for saves. NOTE: 'DIRECTORY_PICTURES' is not
  // a valid @capacitor/filesystem Directory (valid: DOCUMENTS, DATA,
  // LIBRARY, CACHE, EXTERNAL, EXTERNAL_STORAGE, ...) — passing it made every
  // writeFile/readFile reject, so nothing ever saved. DOCUMENTS is public,
  // survives uninstall, needs no permission for the app's own files on
  // Android 11+, and is visible in file manager apps.
  const FS_DIR = 'DOCUMENTS';

  // ---------------- Shared UI + mobile storage backend ----------------
  // Gallery sidebar, model picker modal, and image lightbox live in the
  // shared modules (src/renderer/shared/*, bundled to shared.js) so desktop
  // and mobile run byte-identical UI. Only the storage backend below is
  // mobile-specific (SAF folder or Documents fallback) — desktop injects its
  // own IPC-backed one instead, and mobile-only features (SAF picker,
  // Documents fallback, direct-fetch ComfyUI) never appear in the desktop
  // bundle.
  function mobileBackend() {
    if (safRoot && safPlugin()) {
      const S = safPlugin();
      return {
        async listDir(relDir) {
          const res = await S.listEntries({ path: relDir });
          return ((res && res.files) || []).map((f) => ({ name: f.name, kind: f.kind, mtime: Number(f.lastModified) || 0 }));
        },
        async readImage(relPath) {
          try {
            const r = await S.getFileBytes({ path: relPath });
            return 'data:' + (r.mimeType || 'image/png') + ';base64,' + r.base64;
          } catch (e) { return null; }
        },
        async writeImage(relPath, base64, mimeType) {
          await S.writeFileBytes({ path: relPath, base64, mimeType });
        }
      };
    }
    const Filesystem = fsPlugin();
    return {
      async listDir(relDir) {
        if (!Filesystem) throw new Error('Filesystem plugin not available.');
        const res = await Filesystem.readdir({ path: relDir, directory: FS_DIR });
        return ((res && res.files) || []).map((f) => ({ name: f.name, kind: f.type, mtime: f.mtime || 0 }));
      },
      async readImage(relPath) {
        if (!Filesystem) return null;
        try {
          const r = await Filesystem.readFile({ path: relPath, directory: FS_DIR });
          return 'data:image/png;base64,' + r.data;
        } catch (e) { return null; }
      },
      async writeImage(relPath, base64) {
        if (!Filesystem) throw new Error('Filesystem plugin not available.');
        await Filesystem.writeFile({ path: relPath, data: base64, directory: FS_DIR, recursive: true });
      }
    };
  }
  const gallery = BridgeShared.mountGallerySidebar(mobileBackend, saveLocationLabelText);


  // ---------------- ComfyUI bridge (fetch/WebSocket, no IPC) ----------------

  function isLikelyCorsFailure(err) { return err instanceof TypeError; }
  // A CORS block and a genuine network failure both surface as the same
  // generic TypeError from fetch(), and loading the address in the phone's
  // browser proves nothing about the app — a top-level navigation needs no
  // CORS headers and no mixed-content allowance, while a fetch() from this
  // app's https://localhost WebView needs both. So the hint has to name all
  // three server-side requirements, not just --listen.
  function corsHint() { return ' — could not reach it from inside the app (this can happen even when the same address loads in the phone browser). Make sure: (1) ComfyUI was started with --listen 0.0.0.0 --enable-cors-header --port 8188, (2) Windows Firewall allows inbound TCP 8188 on this network (Private/Domain for LAN, and re-allow if a hotspot flips it to Public), (3) Tailscale is connected on BOTH devices if using a 100.x address.'; }

  async function comfyGetObjectInfo(classType, inputName) {
    try {
      const res = await fetch(new URL('/object_info/' + encodeURIComponent(classType), getHost()));
      if (!res.ok) return { ok: false, error: 'ComfyUI returned HTTP ' + res.status + ' looking up ' + classType + '.' };
      const parsed = await res.json();
      const nodeInfo = parsed[classType];
      const values = nodeInfo && nodeInfo.input && nodeInfo.input.required && nodeInfo.input.required[inputName] && nodeInfo.input.required[inputName][0];
      if (!Array.isArray(values)) return { ok: false, error: 'Could not find "' + inputName + '" on ' + classType + '.' };
      return { ok: true, values };
    } catch (err) {
      return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + (isLikelyCorsFailure(err) ? corsHint() : ' (' + err.message + ')') };
    }
  }

  let activeGen = null;

  async function comfyStopGeneration() {
    if (activeGen) activeGen.cancelled = true;
    try { await fetch(new URL('/interrupt', getHost()), { method: 'POST' }); } catch (e) { /* best effort */ }
  }

  async function fetchViewImage(image) {
    const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
    const res = await fetch(new URL('/view?' + qs.toString(), getHost()));
    if (!res.ok) throw new Error('ComfyUI returned HTTP ' + res.status + ' fetching the generated image.');
    return new Uint8Array(await res.arrayBuffer());
  }

  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  async function comfyQueueAndFetch(imageFilename, imageBytes, prompt) {
    let ws = null;
    try {
      if (imageBytes && prompt['239']) {
        const form = new FormData();
        form.append('type', 'input');
        form.append('overwrite', 'true');
        form.append('image', new Blob([imageBytes]), imageFilename);
        let uploadRes;
        try { uploadRes = await fetch(new URL('/upload/image', getHost()), { method: 'POST', body: form }); }
        catch (err) { return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + (isLikelyCorsFailure(err) ? corsHint() : ' (' + err.message + ')') }; }
        if (!uploadRes.ok) return { ok: false, error: 'Reference image upload to ComfyUI failed (HTTP ' + uploadRes.status + ').' };
        const uploaded = await uploadRes.json();
        prompt['239'].inputs.image = uploaded.subfolder ? (uploaded.subfolder + '/' + uploaded.name) : uploaded.name;
      }

      const clientId = 'comfy-bridge-mobile-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
      activeGen = { cancelled: false };

      try {
        const wsUrl = getHost().replace(/^http/i, 'ws') + '/ws?clientId=' + encodeURIComponent(clientId);
        ws = new WebSocket(wsUrl);
        ws.binaryType = 'arraybuffer';
        ws.addEventListener('open', () => {
          try { ws.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); } catch (e) { /* best effort */ }
        });
        ws.addEventListener('message', (ev) => {
          if (ev.data instanceof ArrayBuffer) {
            const data = new DataView(ev.data);
            if (ev.data.byteLength < 8) return;
            const eventType = data.getUint32(0, false);
            if (eventType === 1) {
              const imageType = data.getUint32(4, false);
              const blob = new Blob([ev.data.slice(8)], { type: imageType === 1 ? 'image/jpeg' : 'image/png' });
              livePreview.src = URL.createObjectURL(blob);
              livePreviewWrap.style.display = 'flex';
            } else if (eventType === 4) {
              try {
                const metaLen = data.getUint32(4, false);
                const meta = JSON.parse(new TextDecoder().decode(new Uint8Array(ev.data.slice(8, 8 + metaLen))));
                const blob = new Blob([ev.data.slice(8 + metaLen)], { type: meta.image_type || 'image/jpeg' });
                livePreview.src = URL.createObjectURL(blob);
                livePreviewWrap.style.display = 'flex';
              } catch (e) { /* malformed metadata frame — skip */ }
            }
          } else {
            try {
              const msg = JSON.parse(ev.data);
              if (msg.type === 'progress' && msg.data && msg.data.max) {
                genStatus.textContent = 'Generating… step ' + msg.data.value + '/' + msg.data.max;
              } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
                const running = Object.values(msg.data.nodes).filter((n) => n.state === 'running');
                if (running.length) {
                  const n = running[running.length - 1];
                  genStatus.textContent = 'Generating… step ' + n.value + '/' + n.max;
                }
              }
            } catch (e) { /* ignore malformed frames */ }
          }
        });
        await new Promise((resolve) => {
          const timer = setTimeout(resolve, 3000);
          ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
          ws.addEventListener('error', () => { clearTimeout(timer); resolve(); }, { once: true });
        });
      } catch (err) { console.error('[comfy-bridge] preview websocket setup failed:', err); }

      const queueRes = await fetch(new URL('/prompt', getHost()), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, client_id: clientId, extra_data: { preview_method: 'taesd' } })
      });
      let queueParsed = {};
      try { queueParsed = await queueRes.json(); } catch (e) { /* fall through with {} */ }
      if (!queueRes.ok) {
        const errMsg = queueParsed.error && queueParsed.error.message;
        return { ok: false, error: errMsg ? ('ComfyUI rejected the request: ' + errMsg) : ('ComfyUI returned HTTP ' + queueRes.status + ' queuing the generation request.') };
      }
      const nodeErrorKeys = queueParsed.node_errors ? Object.keys(queueParsed.node_errors) : [];
      if (nodeErrorKeys.length) return { ok: false, error: 'ComfyUI rejected the workflow: ' + JSON.stringify(queueParsed.node_errors) };
      const promptId = queueParsed.prompt_id;
      if (!promptId) return { ok: false, error: 'ComfyUI did not return a prompt id.' };

      const deadline = Date.now() + 300000;
      while (Date.now() < deadline) {
        if (activeGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
        await sleep(700);
        if (activeGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
        let histRes;
        try { histRes = await fetch(new URL('/history/' + promptId, getHost())); } catch (e) { continue; }
        if (!histRes.ok) continue;
        let hist = {};
        try { hist = await histRes.json(); } catch (e) { continue; }
        const record = hist[promptId];
        if (!record) continue;
        const saveOutput = record.outputs && record.outputs['192'];
        const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
        if (image) {
          const result = { ok: true, imageBytes: await fetchViewImage(image) };
          const pass1Output = record.outputs['192_pass1'];
          const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
          if (pass1Image) { try { result.pass1ImageBytes = await fetchViewImage(pass1Image); } catch (e) { /* optional */ } }
          return result;
        }
        if (record.status && record.status.status_str === 'error') {
          return { ok: false, error: 'ComfyUI reported an error while generating this image — check its console for details.' };
        }
      }
      return { ok: false, error: 'Timed out waiting for ComfyUI to finish generating this image.' };
    } catch (err) {
      return { ok: false, error: 'Could not reach ComfyUI at ' + getHost() + ' (' + err.message + ')' };
    } finally {
      try { if (ws) ws.close(); } catch (e) { /* already closed */ }
      activeGen = null;
    }
  }

  // ---------------- Reference image ----------------

  let refFile = null;
  let refFilename = '';

  function applySkipRefImageUI() {
    refImageSection.classList.toggle('section-disabled', skipRefImage.checked);
    lliteSection.classList.toggle('section-disabled', skipRefImage.checked);
  }
  skipRefImage.addEventListener('change', applySkipRefImageUI);
  applySkipRefImageUI();

  btnPickImage.addEventListener('click', () => refFileInput.click());
  refFileInput.addEventListener('change', () => {
    const file = refFileInput.files && refFileInput.files[0];
    if (!file) return;
    refFile = file;
    refFilename = file.name;
    refFileName.textContent = file.name;
    refPreview.src = URL.createObjectURL(file);
    refPreview.style.display = 'block';
  });

  // ---------------- Toggles ----------------

  function applyUnifiedPromptModeUI() {
    const unified = unifiedPromptMode.checked;
    unifiedPromptRow.style.display = unified ? '' : 'none';
    splitFieldsGroup.style.display = unified ? 'none' : '';
  }
  unifiedPromptMode.addEventListener('change', applyUnifiedPromptModeUI);
  applyUnifiedPromptModeUI();

  use2Pass.addEventListener('change', () => { pass2Fields.style.display = use2Pass.checked ? '' : 'none'; });
  pass2Fields.style.display = use2Pass.checked ? '' : 'none';

  upscaleEnabled.addEventListener('change', () => { upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none'; });
  upscaleModelRow.style.display = upscaleEnabled.checked ? '' : 'none';

  btnSwapReso.addEventListener('click', () => {
    const w = width.value;
    width.value = height.value;
    height.value = w;
  });

  // ---------------- Connection test ----------------

  btnConnect.addEventListener('click', async () => {
    try { localStorage.setItem(HOST_KEY, (host.value || '').trim()); } catch (e) { /* best effort */ }
    connStatus.style.display = 'block';
    connStatus.style.color = '';
    connStatus.textContent = 'Connecting…';
    const res = await comfyGetObjectInfo('UNETLoader', 'unet_name');
    if (res.ok) {
      connStatus.style.color = 'var(--accent-ok)';
      connStatus.textContent = '✓ Connected to ' + getHost();
    } else {
      connStatus.style.color = '';
      connStatus.textContent = res.error;
    }
  });

  // ---------------- Model lists ----------------

  btnRefreshModels.addEventListener('click', async () => {
    const [unetValues, clipValues, vaeValues, mainLoraValues, loraValues, upscaleValues] = await Promise.all([
      comfyGetObjectInfo('UNETLoader', 'unet_name'),
      comfyGetObjectInfo('CLIPLoader', 'clip_name'),
      comfyGetObjectInfo('VAELoader', 'vae_name'),
      comfyGetObjectInfo('DSM Lora Name', 'lora_name'),
      comfyGetObjectInfo('DSM Lora Loader Stack', 'lora_01'),
      comfyGetObjectInfo('UpscaleModelLoader', 'model_name')
    ]);
    if (unetValues.ok) fillDatalist(diffModelList, unetValues.values);
    if (clipValues.ok) fillDatalist(clipList, clipValues.values);
    if (vaeValues.ok) fillDatalist(vaeList, vaeValues.values);
    if (mainLoraValues.ok) fillDatalist(mainLoraList, mainLoraValues.values);
    if (loraValues.ok) fillDatalist(loraList, loraValues.values);
    if (upscaleValues.ok) fillDatalist(upscaleModelList, upscaleValues.values);
    log('Model lists refreshed from ComfyUI.');
  });

  // ---------------- LoRA stack rows ----------------

  let loraRows = [];
  function addLoraRow(defaultLora, defaultStrength) {
    const row = document.createElement('div');
    row.className = 'synthdat-lora-row';
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Tap to choose…';
    input.readOnly = true;
    input.value = defaultLora || '';
    BridgeShared.attachPickerModal(input, 'LoRA', () => BridgeShared.optionsFromDatalist(loraList));
    const strength = document.createElement('input');
    strength.type = 'number';
    strength.step = '0.05';
    strength.value = String(defaultStrength != null ? defaultStrength : 1);
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => { loraRows = loraRows.filter((r) => r.row !== row); row.remove(); });
    row.appendChild(input);
    row.appendChild(strength);
    row.appendChild(removeBtn);
    loraStackRows.appendChild(row);
    loraRows.push({ row, input, strength });
  }
  btnAddLora.addEventListener('click', () => addLoraRow('', 1));
  addLoraRow('', 1);
  addLoraRow('', 0.8);

  // ---------------- Presets (localStorage) ----------------

  const PRESETS_KEY = 'comfy-bridge-presets';
  function readPresets() {
    try {
      const parsed = JSON.parse(localStorage.getItem(PRESETS_KEY) || 'null');
      return { promptPresets: (parsed && parsed.promptPresets) || {}, negativePresets: (parsed && parsed.negativePresets) || {} };
    } catch (e) { return { promptPresets: {}, negativePresets: {} }; }
  }
  function writePresets(data) {
    try { localStorage.setItem(PRESETS_KEY, JSON.stringify(data)); } catch (e) { /* best effort */ }
  }

  function snapshotPromptFields() {
    return {
      unifiedPromptMode: unifiedPromptMode.checked, unifiedPrompt: unifiedPrompt.value,
      global: global_.value, character: character.value, characterTrigger: characterTrigger.value,
      rating: rating.value, hair: hair.value, face: face.value, chest: chest.value, body: body_.value,
      clothes: clothes.value, limbs: limbs.value, sexual: sexual.value, pose: pose.value,
      scene: scene.value, effects: effects.value, extra: extra.value
    };
  }
  function applyPromptFields(fields) {
    unifiedPromptMode.checked = !!fields.unifiedPromptMode;
    unifiedPrompt.value = fields.unifiedPrompt || '';
    global_.value = fields.global || ''; character.value = fields.character || '';
    characterTrigger.value = fields.characterTrigger || ''; rating.value = fields.rating || '';
    hair.value = fields.hair || ''; face.value = fields.face || ''; chest.value = fields.chest || '';
    body_.value = fields.body || ''; clothes.value = fields.clothes || ''; limbs.value = fields.limbs || '';
    sexual.value = fields.sexual || ''; pose.value = fields.pose || ''; scene.value = fields.scene || '';
    effects.value = fields.effects || ''; extra.value = fields.extra || '';
    applyUnifiedPromptModeUI();
  }

  function refreshPresetLists() {
    const data = readPresets();
    const fillSelect = (el, names) => {
      const current = el.value;
      el.innerHTML = '<option value="">(choose a preset)</option>';
      for (const name of names) {
        const opt = document.createElement('option');
        opt.value = name; opt.textContent = name;
        el.appendChild(opt);
      }
      if (names.includes(current)) el.value = current;
    };
    fillSelect(promptPresetSelect, Object.keys(data.promptPresets).sort());
    fillSelect(negativePresetSelect, Object.keys(data.negativePresets).sort());
  }

  btnSavePromptPreset.addEventListener('click', () => {
    const name = promptPresetName.value.trim();
    if (!name) { log('Type a name for this prompt preset first.'); return; }
    const data = readPresets();
    data.promptPresets[name] = snapshotPromptFields();
    writePresets(data);
    promptPresetName.value = '';
    refreshPresetLists();
    promptPresetSelect.value = name;
    log('Saved prompt preset "' + name + '".');
  });
  btnLoadPromptPreset.addEventListener('click', () => {
    const name = promptPresetSelect.value;
    if (!name) { log('Pick a prompt preset to load first.'); return; }
    const data = readPresets();
    if (!data.promptPresets[name]) { log('Preset not found.'); return; }
    applyPromptFields(data.promptPresets[name]);
    log('Loaded prompt preset "' + name + '".');
  });
  btnDeletePromptPreset.addEventListener('click', () => {
    const name = promptPresetSelect.value;
    if (!name) return;
    const data = readPresets();
    delete data.promptPresets[name];
    writePresets(data);
    refreshPresetLists();
    log('Deleted prompt preset "' + name + '".');
  });

  btnSaveNegativePreset.addEventListener('click', () => {
    const name = negativePresetName.value.trim();
    if (!name) { log('Type a name for this negative preset first.'); return; }
    const data = readPresets();
    data.negativePresets[name] = negative.value;
    writePresets(data);
    negativePresetName.value = '';
    refreshPresetLists();
    negativePresetSelect.value = name;
    log('Saved negative preset "' + name + '".');
  });
  btnLoadNegativePreset.addEventListener('click', () => {
    const name = negativePresetSelect.value;
    if (!name) { log('Pick a negative preset to load first.'); return; }
    const data = readPresets();
    if (data.negativePresets[name] === undefined) { log('Preset not found.'); return; }
    negative.value = data.negativePresets[name];
    log('Loaded negative preset "' + name + '".');
  });
  btnDeleteNegativePreset.addEventListener('click', () => {
    const name = negativePresetSelect.value;
    if (!name) return;
    const data = readPresets();
    delete data.negativePresets[name];
    writePresets(data);
    refreshPresetLists();
    log('Deleted negative preset "' + name + '".');
  });

  // ---------------- Prompt building (same node ids as desktop) ----------------

  let template = null;
  async function loadTemplate() {
    if (template) return template;
    const res = await fetch('./data/synthdat-workflow.json');
    template = await res.json();
    return template;
  }

  function buildPrompt() {
    const prompt = JSON.parse(JSON.stringify(template));
    const unified = unifiedPromptMode.checked;
    const characterVal = [unified ? fieldValue(unifiedPrompt) : fieldValue(character), fieldValue(characterTrigger)].filter(Boolean).join(', ');

    prompt['21'].inputs.value = fieldValue(global_);
    prompt['8'].inputs.value = unified ? '' : fieldValue(rating);
    prompt['19'].inputs.value = '';
    prompt['11'].inputs.value = characterVal;
    prompt['12'].inputs.value = unified ? '' : fieldValue(hair);
    prompt['15'].inputs.value = unified ? '' : fieldValue(face);
    prompt['18'].inputs.value = unified ? '' : fieldValue(chest);
    prompt['9'].inputs.value = unified ? '' : fieldValue(body_);
    prompt['6'].inputs.value = unified ? '' : fieldValue(clothes);
    prompt['20'].inputs.value = unified ? '' : fieldValue(limbs);
    prompt['14'].inputs.value = unified ? '' : fieldValue(sexual);
    prompt['7'].inputs.value = unified ? '' : fieldValue(pose);
    prompt['10'].inputs.value = unified ? '' : fieldValue(extra);
    prompt['13'].inputs.value = unified ? '' : fieldValue(effects);
    prompt['17'].inputs.value = unified ? '' : fieldValue(scene);
    prompt['16'].inputs.text = fieldValue(negative);

    prompt['41'].inputs.unet_name = diffModel.value;
    prompt['51'].inputs.lora_name = mainLora.value.trim() || 'None';
    if (clip.value) { prompt['249'].inputs.clip_name = clip.value; prompt['47:45'].inputs.clip_name = clip.value; }
    if (vae.value) prompt['47:46'].inputs.vae_name = vae.value;

    const chunks = [];
    for (let i = 0; i < loraRows.length; i += 4) chunks.push(loraRows.slice(i, i + 4));
    function fillStackInputs(inputs, chunk) {
      for (let i = 0; i < 4; i++) {
        const slot = String(i + 1).padStart(2, '0');
        const r = chunk[i];
        inputs['lora_' + slot] = r ? (r.input.value.trim() || 'None') : 'None';
        inputs['strength_' + slot] = r ? (parseFloat(r.strength.value) || 0) : 0;
      }
    }
    let lastStackId = '237';
    fillStackInputs(prompt['237'].inputs, chunks[0] || []);
    for (let c = 1; c < chunks.length; c++) {
      const newId = '237_extra_' + c;
      const newInputs = { model: [lastStackId, 0], clip: ['47:45', 0] };
      fillStackInputs(newInputs, chunks[c]);
      prompt[newId] = { class_type: 'DSM Lora Loader Stack', inputs: newInputs, _meta: { title: 'DSM Lora Loader Stack' } };
      lastStackId = newId;
    }
    if (lastStackId !== '237') {
      prompt['243'].inputs.input1 = [lastStackId, 0];
      prompt['240'].inputs.model = [lastStackId, 0];
      prompt['195'].inputs.model = [lastStackId, 0];
    }

    if (skipRefImage.checked) {
      delete prompt['239']; delete prompt['240']; delete prompt['243']; delete prompt['238']; delete prompt['246'];
      prompt['158:53'].inputs.model = [lastStackId, 0];
      prompt['158:54'].inputs.model = [lastStackId, 0];
    } else {
      prompt['240'].inputs.strength = parseFloat(lliteStrength.value) || 0;
      prompt['240'].inputs.start_percent = parseFloat(lliteStartPercent.value) || 0;
      prompt['240'].inputs.end_percent = parseFloat(lliteEndPercent.value) || 0;
      prompt['240'].inputs.preserve_wrapper = llitePreserveWrapper.checked;
      prompt['243'].inputs.select = 2;
      prompt['238'].inputs.fit = resizeFit.value;
      prompt['238'].inputs.method = resizeMethod.value;
      prompt['240'].inputs.image = ['238', 0];
    }

    prompt['168:167'].inputs.sampler_name = sampler.value;
    prompt['158:53'].inputs.scheduler = scheduler.value;
    prompt['158:53'].inputs.steps = parseInt(steps1.value, 10) || 1;
    prompt['158:54'].inputs.cfg = parseFloat(cfg1.value) || 1;
    prompt['174:171'].inputs.value = parseInt(width.value, 10) || 920;
    prompt['174:172'].inputs.value = parseInt(height.value, 10) || 1244;
    prompt['165'].inputs.noise_seed = parseInt(seed1.value, 10) || 0;

    if (use2Pass.checked) {
      prompt['227'].inputs.noise_seed = parseInt(seed2.value, 10) || 0;
      prompt['195'].inputs.denoise = parseFloat(denoise2.value) || 0;
      prompt['195'].inputs.scheduler = scheduler.value;
      prompt['195'].inputs.steps = parseInt(steps2.value, 10) || 1;
      prompt['192_pass1'] = { class_type: 'SaveImage', inputs: { filename_prefix: prompt['192'].inputs.filename_prefix, images: ['176', 0] }, _meta: { title: 'Pass 1 preview' } };
    } else {
      delete prompt['190']; delete prompt['191']; delete prompt['195']; delete prompt['227']; delete prompt['224'];
      prompt['192'].inputs.images = ['176', 0];
    }

    if (upscaleEnabled.checked && upscaleModel.value.trim()) {
      prompt['upscale_model_loader'] = { class_type: 'UpscaleModelLoader', inputs: { model_name: upscaleModel.value.trim() }, _meta: { title: 'Upscale Model Loader' } };
      const scaleBy = parseFloat(upscaleScaleBy.value) || 1;
      for (const saveId of ['192', '192_pass1']) {
        if (!prompt[saveId]) continue;
        const upscaleId = 'upscale_model_' + saveId;
        const scaleId = 'upscale_scale_' + saveId;
        prompt[upscaleId] = { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['upscale_model_loader', 0], image: prompt[saveId].inputs.images }, _meta: { title: 'Upscale' } };
        prompt[scaleId] = { class_type: 'ImageScaleBy', inputs: { upscale_method: 'lanczos', scale_by: scaleBy, image: [upscaleId, 0] }, _meta: { title: 'Upscale scale-by' } };
        prompt[saveId].inputs.images = [scaleId, 0];
      }
    }

    return prompt;
  }

  // ---------------- Save to device (active backend) ----------------

  async function saveBytes(bytes, filename) {
    try {
      await mobileBackend().writeImage(filename, BridgeShared.bytesToBase64(bytes), 'image/png');
      log('Saved ' + saveLocationLabelText() + '/' + filename);
      return { file: filename };
    } catch (err) {
      log('Failed to save ' + filename + ': ' + (err && err.message));
      return null;
    }
  }

  // ---------------- Generate ----------------

  let generating = false;

  async function generate() {
    if (generating) return;
    if (!skipRefImage.checked && !refFile) { log('Pick a reference image first (or check "No reference image").'); return; }
    await loadTemplate();
    generating = true;
    btnGenerate.disabled = true;
    btnStop.disabled = false;
    livePreview.src = '';
    livePreviewWrap.style.display = 'none';
    genStatus.style.display = 'block';
    genStatus.textContent = 'Generating… this can take a while.';

    const prompt = buildPrompt();
    const bytes = skipRefImage.checked ? null : new Uint8Array(await refFile.arrayBuffer());

    const res = await comfyQueueAndFetch(skipRefImage.checked ? null : refFilename, bytes, prompt);

    generating = false;
    btnGenerate.disabled = false;
    btnStop.disabled = true;
    livePreviewWrap.style.display = 'none';

    if (!res.ok) {
      if (res.interrupted) { genStatus.style.display = 'none'; log('Generation stopped.'); }
      else { genStatus.textContent = res.error; log(res.error); }
      return;
    }
    genStatus.style.display = 'none';

    const n = await BridgeShared.nextFileNumber(mobileBackend());
    let saveFailed = false;
    if (res.pass1ImageBytes) {
      const s1 = await saveBytes(res.pass1ImageBytes, n + '_pass1.png');
      const s2 = await saveBytes(res.imageBytes, n + '.png');
      if (!s1 || !s2) saveFailed = true;
    } else if (res.imageBytes) {
      const s = await saveBytes(res.imageBytes, n + '.png');
      if (!s) saveFailed = true;
    }
    if (saveFailed) {
      genStatus.style.display = 'block';
      genStatus.textContent = 'Generated, but saving failed — see Log for details.';
    }
    if (res.imageBytes) {
      preview.src = URL.createObjectURL(new Blob([res.imageBytes], { type: 'image/png' }));
      preview.style.display = 'block';
      previewEmpty.style.display = 'none';
    }
  }

  btnGenerate.addEventListener('click', generate);
  btnStop.addEventListener('click', comfyStopGeneration);

  // ---------------- Init ----------------

  BridgeShared.attachPickerModal(diffModel, 'Diffusion model', () => BridgeShared.optionsFromDatalist(diffModelList));
  BridgeShared.attachPickerModal(clip, 'CLIP', () => BridgeShared.optionsFromDatalist(clipList));
  BridgeShared.attachPickerModal(vae, 'VAE', () => BridgeShared.optionsFromDatalist(vaeList));
  BridgeShared.attachPickerModal(mainLora, 'Main LoRA', () => BridgeShared.optionsFromDatalist(mainLoraList));
  BridgeShared.attachPickerModal(upscaleModel, 'Upscale model', () => BridgeShared.optionsFromDatalist(upscaleModelList));
  preview.addEventListener('click', () => { if (preview.src) BridgeShared.showImageLightbox(preview.src); });
  initSafRoot();
  refreshPresetLists();
  log('Comfy Bridge (mobile) ready. Enter your PC\'s ComfyUI address and Generate.');
})();
