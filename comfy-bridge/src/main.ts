// Comfy Bridge — a standalone desktop window onto a single user-configured
// ComfyUI instance, built on the exact same generation workflow as Dataset
// Manager Studio's SynthDat Overseer (same bundled `renderer/data/synthdat-
// workflow.json`, same fixed graph). Unlike SynthDat, this app has no
// dataset and no Accept/Reject step — every generation just gets saved to a
// user-picked output folder, both passes when 2-Pass runs, with an optional
// model-based upscale before saving. See the parent project's
// `notes/SynthDat-Overseer.md` for the workflow's own background — this is
// a copy of its ComfyUI-facing bridge, not a shared module, since the two
// apps otherwise have nothing in common (no dataset, no dirHandle writes).
const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const WS = require('ws');

function createWindow() {
  const windowIcon = path.join(__dirname, 'build', process.platform === 'win32' ? 'icon.ico' : 'icon.png');
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 600,
    backgroundColor: '#16151c',
    autoHideMenuBar: true,
    show: false,
    icon: windowIcon,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.once('ready-to-show', () => win.show());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-app-version', () => app.getVersion());

// ---------------- Output folder + file writes ----------------
// No dataset/dirHandle here — a plain native folder picker plus direct
// fs writes in the main process, same "small explicit bridge" shape as
// everything else in this file.
ipcMain.handle('pick-output-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const res = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths[0]) return { ok: false };
  return { ok: true, path: res.filePaths[0] };
});

ipcMain.handle('save-image', async (event, { folder, filename, bytes }) => {
  try {
    fs.writeFileSync(path.join(folder, filename), Buffer.from(bytes));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Gallery backing — single-level listing + file reads inside the picked
// output folder, so the shared gallery sidebar (src/renderer/shared/) can
// scan it the same way mobile scans SAF/Documents. relDir/relPath are always
// resolved under folder and rejected on traversal outside it.
const GALLERY_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const GALLERY_MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function galleryAbsPath(folder, rel) {
  const base = path.normalize(folder);
  const abs = path.normalize(path.join(base, rel || ''));
  if (abs !== base && !abs.startsWith(base + path.sep)) throw new Error('Invalid path.');
  return abs;
}

ipcMain.handle('gallery-list-dir', async (event, { folder, relDir }) => {
  try {
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    const abs = galleryAbsPath(folder, relDir);
    const dirents = fs.readdirSync(abs, { withFileTypes: true });
    return {
      ok: true,
      entries: dirents.map((e) => {
        let mtime = 0;
        try {
          mtime = fs.statSync(path.join(abs, e.name)).mtimeMs || 0;
        } catch {
          /* best effort — leaves mtime 0 */
        }
        return {
          name: e.name,
          kind: e.isDirectory() ? 'directory' : 'file',
          mtime
        };
      })
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('gallery-read', async (event, { folder, relPath }) => {
  try {
    if (!folder) return { ok: false, error: 'No output folder chosen.' };
    const abs = galleryAbsPath(folder, relPath);
    const data = fs.readFileSync(abs);
    const ext = path.extname(abs).toLowerCase();
    return { ok: true, base64: data.toString('base64'), mime: GALLERY_MIME_BY_EXT[ext] || 'image/png' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Upscale models are listed straight off disk rather than via ComfyUI's
// /object_info (every other model/LoRA dropdown's approach) — this list
// doesn't need a live ComfyUI connection to populate, and the user's actual
// upscale_models folder is this fixed local ComfyUI portable install.
const UPSCALE_MODELS_DIR = 'C:\\CMF\\ComfyUI_Windows_portable\\ComfyUI\\models\\upscale_models';
const UPSCALE_MODEL_EXTENSIONS = new Set(['.pth', '.safetensors', '.pt', '.bin', '.ckpt']);

ipcMain.handle('list-upscale-models', () => {
  try {
    const names = fs.readdirSync(UPSCALE_MODELS_DIR)
      .filter((name) => UPSCALE_MODEL_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort();
    return { ok: true, values: names };
  } catch (err) {
    return { ok: false, error: `Could not read ${UPSCALE_MODELS_DIR}: ${err.message}` };
  }
});

// ---------------- ComfyUI bridge ----------------
// Copied verbatim from Dataset Manager Studio's src/main.ts (SynthDat Overseer
// section) — the renderer can't talk to ComfyUI directly (its server.py
// rejects cross-origin POSTs whose Origin doesn't match Host, and Chromium's
// own CORS would block reading the response anyway), so a plain Node HTTP
// client in this process does the round trip and relays results over IPC.
function comfyRequest(host, urlPath, { method = 'GET', headers = {}, body = null, timeoutMs = 8000 }: any = {}): Promise<{ status: number; body: Buffer }> {
  return new Promise((resolve, reject) => {
    let target;
    try { target = new URL(urlPath, host); } catch (err) { reject(new Error('Invalid ComfyUI host URL.')); return; }
    const lib = target.protocol === 'https:' ? https : http;
    const req = lib.request(target, { method, headers }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', (err) => reject(err));
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request to ComfyUI timed out.')));
    if (body) req.write(body);
    req.end();
  });
}

function buildMultipart(fields, fileField, fileName, fileBuffer) {
  const boundary = '----ComfyBridgeBoundary' + Date.now().toString(16) + Math.random().toString(16).slice(2);
  const parts = [];
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${value}\r\n`));
  }
  const safeName = String(fileName).replace(/"/g, '');
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${fileField}"; filename="${safeName}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
  parts.push(fileBuffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
  return { boundary, body: Buffer.concat(parts) };
}

ipcMain.handle('synthdat-get-object-info', async (event, { host, classType, inputName }) => {
  try {
    const res = await comfyRequest(host, `/object_info/${encodeURIComponent(classType)}`, { timeoutMs: 6000 });
    if (res.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${res.status} looking up ${classType}.` };
    const parsed = JSON.parse(res.body.toString('utf8'));
    const nodeInfo = parsed[classType];
    const values = nodeInfo && nodeInfo.input && nodeInfo.input.required && nodeInfo.input.required[inputName] && nodeInfo.input.required[inputName][0];
    if (!Array.isArray(values)) return { ok: false, error: `Could not find "${inputName}" on ${classType} — is the right custom node installed?` };
    return { ok: true, values };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  }
});

let activeGen: { cancelled: boolean; ws: any } | null = null;

ipcMain.handle('synthdat-stop-generation', async (event, host) => {
  if (activeGen) activeGen.cancelled = true;
  try { await comfyRequest(host, '/interrupt', { method: 'POST', timeoutMs: 5000 }); } catch (err) { /* best effort */ }
  return { ok: true };
});

ipcMain.handle('synthdat-queue-and-fetch', async (event, { host, imageFilename, imageBytes, prompt }) => {
  let ws: any = null;
  try {
    if (imageBytes && prompt['239']) {
      const fileBuffer = Buffer.from(imageBytes);
      const { boundary, body } = buildMultipart({ type: 'input', overwrite: 'true' }, 'image', imageFilename, fileBuffer);
      const uploadRes = await comfyRequest(host, '/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
        body,
        timeoutMs: 20000
      });
      if (uploadRes.status !== 200) return { ok: false, error: `Reference image upload to ComfyUI failed (HTTP ${uploadRes.status}).` };
      const uploaded = JSON.parse(uploadRes.body.toString('utf8'));
      const imageRef = uploaded.subfolder ? `${uploaded.subfolder}/${uploaded.name}` : uploaded.name;
      prompt['239'].inputs.image = imageRef;
    }

    const clientId = `comfy-bridge-${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;

    activeGen = { cancelled: false, ws: null };
    try {
      const wsUrl = `${host.replace(/^http/i, 'ws')}/ws?clientId=${encodeURIComponent(clientId)}`;
      ws = new WS(wsUrl);
      activeGen.ws = ws;
      ws.on('open', () => {
        try { ws.send(JSON.stringify({ type: 'feature_flags', data: { supports_preview_metadata: true } })); }
        catch (err) { /* best effort */ }
      });
      ws.on('message', (data, isBinary) => {
        if (isBinary) {
          if (data.length < 8) return;
          const eventType = data.readUInt32BE(0);
          if (eventType === 1) {
            const imageType = data.readUInt32BE(4);
            event.sender.send('preview-frame', {
              mime: imageType === 1 ? 'image/jpeg' : 'image/png',
              bytes: new Uint8Array(data.subarray(8))
            });
          } else if (eventType === 4) {
            try {
              const metaLen = data.readUInt32BE(4);
              const meta = JSON.parse(data.subarray(8, 8 + metaLen).toString('utf8'));
              event.sender.send('preview-frame', {
                mime: meta.image_type || 'image/jpeg',
                bytes: new Uint8Array(data.subarray(8 + metaLen))
              });
            } catch (err) { /* malformed metadata frame — skip */ }
          }
        } else {
          try {
            const msg = JSON.parse(data.toString('utf8'));
            if (msg.type === 'progress' && msg.data) {
              event.sender.send('gen-progress', msg.data);
            } else if (msg.type === 'progress_state' && msg.data && msg.data.nodes) {
              const running = Object.values(msg.data.nodes).filter((n: any) => n.state === 'running');
              if (running.length) {
                const n: any = running[running.length - 1];
                event.sender.send('gen-progress', { value: n.value, max: n.max });
              }
            }
          } catch (err) { /* ignore malformed frames */ }
        }
      });
      ws.on('error', (err) => console.error('[comfy-bridge] preview websocket error:', err && err.message));
      ws.on('unexpected-response', (req, res) => console.error('[comfy-bridge] preview websocket handshake rejected:', res.statusCode));
      ws.on('close', (code, reason) => { if (code !== 1000) console.error('[comfy-bridge] preview websocket closed:', code, reason && reason.toString()); });
      await new Promise<void>((resolve) => {
        const done = () => { ws.removeListener('open', done); ws.removeListener('error', done); ws.removeListener('unexpected-response', done); resolve(); };
        ws.once('open', done);
        ws.once('error', done);
        ws.once('unexpected-response', done);
        setTimeout(done, 3000);
      });
    } catch (err) { console.error('[comfy-bridge] preview websocket setup failed:', err && err.message); }

    const promptBody = Buffer.from(JSON.stringify({ prompt, client_id: clientId, extra_data: { preview_method: 'taesd' } }), 'utf8');
    const queueRes = await comfyRequest(host, '/prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': promptBody.length },
      body: promptBody,
      timeoutMs: 10000
    });
    let queueParsed: any = {};
    try { queueParsed = JSON.parse(queueRes.body.toString('utf8') || '{}'); } catch (err) { /* fall through with {} */ }
    if (queueRes.status !== 200) {
      const errMsg = queueParsed && queueParsed.error && queueParsed.error.message;
      return { ok: false, error: errMsg ? `ComfyUI rejected the request: ${errMsg}` : `ComfyUI returned HTTP ${queueRes.status} queuing the generation request.` };
    }
    const nodeErrorKeys = queueParsed.node_errors ? Object.keys(queueParsed.node_errors) : [];
    if (nodeErrorKeys.length) {
      return { ok: false, error: `ComfyUI rejected the workflow: ${JSON.stringify(queueParsed.node_errors)}` };
    }
    const promptId = queueParsed.prompt_id;
    if (!promptId) return { ok: false, error: 'ComfyUI did not return a prompt id.' };

    const deadline = Date.now() + 300000;
    while (Date.now() < deadline) {
      if (activeGen && activeGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
      await new Promise((r) => setTimeout(r, 700));
      if (activeGen && activeGen.cancelled) return { ok: false, error: 'Generation stopped.', interrupted: true };
      let histRes;
      try { histRes = await comfyRequest(host, `/history/${promptId}`, { timeoutMs: 8000 }); }
      catch (err) { continue; }
      if (histRes.status !== 200) continue;
      let hist: any = {};
      try { hist = JSON.parse(histRes.body.toString('utf8') || '{}'); } catch (err) { continue; }
      const record = hist[promptId];
      if (!record) continue;
      const saveOutput = record.outputs && record.outputs['192'];
      const image = saveOutput && Array.isArray(saveOutput.images) && saveOutput.images[0];
      if (image) {
        const qs = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || '', type: image.type || 'output' });
        const viewRes = await comfyRequest(host, `/view?${qs.toString()}`, { timeoutMs: 20000 });
        if (viewRes.status !== 200) return { ok: false, error: `ComfyUI returned HTTP ${viewRes.status} fetching the generated image.` };
        const result: any = { ok: true, imageBytes: new Uint8Array(viewRes.body) };
        const pass1Output = record.outputs['192_pass1'];
        const pass1Image = pass1Output && Array.isArray(pass1Output.images) && pass1Output.images[0];
        if (pass1Image) {
          const qs1 = new URLSearchParams({ filename: pass1Image.filename, subfolder: pass1Image.subfolder || '', type: pass1Image.type || 'output' });
          const viewRes1 = await comfyRequest(host, `/view?${qs1.toString()}`, { timeoutMs: 20000 });
          if (viewRes1.status === 200) result.pass1ImageBytes = new Uint8Array(viewRes1.body);
        }
        return result;
      }
      if (record.status && record.status.status_str === 'error') {
        return { ok: false, error: 'ComfyUI reported an error while generating this image — check its console for details.' };
      }
    }
    return { ok: false, error: 'Timed out waiting for ComfyUI to finish generating this image.' };
  } catch (err) {
    return { ok: false, error: `Could not reach ComfyUI at ${host} — is it running? (${err.message})` };
  } finally {
    try { if (ws) ws.close(); } catch (err) { /* already closed */ }
    activeGen = null;
  }
});

// ---------------- Prompt / Negative presets ----------------
// One JSON file in userData, holding two independent named-preset maps.
// Prompt presets snapshot every prompt-side field (a whole character setup);
// Negative presets are kept separate since a negative prompt is often reused
// across many DIFFERENT characters, while a Prompt preset is tied to one
// specific character — coupling them would force re-saving the negative
// every time a character preset changes, or vice versa. Whole-file
// read/modify/write on every save/delete (same pattern as Dataset Tag
// Studio's SynthDat settings file) — this file is tiny, so nothing more
// granular is warranted.
const PRESETS_FILE = () => path.join(app.getPath('userData'), 'comfy-bridge-presets.json');

interface PresetsFile {
  promptPresets: Record<string, Record<string, string | boolean>>;
  negativePresets: Record<string, string>;
}

function readPresetsFile(): PresetsFile {
  try {
    const raw = fs.readFileSync(PRESETS_FILE(), 'utf8');
    const parsed = JSON.parse(raw);
    return {
      promptPresets: (parsed && parsed.promptPresets) || {},
      negativePresets: (parsed && parsed.negativePresets) || {}
    };
  } catch (err) {
    return { promptPresets: {}, negativePresets: {} }; // no file yet — not an error
  }
}

function writePresetsFile(data: PresetsFile): void {
  fs.mkdirSync(path.dirname(PRESETS_FILE()), { recursive: true });
  fs.writeFileSync(PRESETS_FILE(), JSON.stringify(data, null, 2));
}

ipcMain.handle('list-presets', () => {
  const data = readPresetsFile();
  return {
    ok: true,
    promptPresetNames: Object.keys(data.promptPresets).sort(),
    negativePresetNames: Object.keys(data.negativePresets).sort()
  };
});

ipcMain.handle('save-preset', (event, { kind, name, value }) => {
  if (!name || !String(name).trim()) return { ok: false, error: 'Preset name cannot be blank.' };
  const data = readPresetsFile();
  if (kind === 'prompt') data.promptPresets[name] = value;
  else if (kind === 'negative') data.negativePresets[name] = value;
  else return { ok: false, error: `Unknown preset kind: ${kind}` };
  try {
    writePresetsFile(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('load-preset', (event, { kind, name }) => {
  const data = readPresetsFile();
  const value = kind === 'prompt' ? data.promptPresets[name] : kind === 'negative' ? data.negativePresets[name] : undefined;
  if (value === undefined) return { ok: false, error: `Preset "${name}" not found.` };
  return { ok: true, value };
});

ipcMain.handle('delete-preset', (event, { kind, name }) => {
  const data = readPresetsFile();
  if (kind === 'prompt') delete data.promptPresets[name];
  else if (kind === 'negative') delete data.negativePresets[name];
  else return { ok: false, error: `Unknown preset kind: ${kind}` };
  try {
    writePresetsFile(data);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
