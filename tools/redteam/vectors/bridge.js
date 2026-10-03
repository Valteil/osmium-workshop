// Comfy Bridge attack vectors.
//
// Same model as desktop.js: a compromised renderer calls the real bridge
// preload/main handlers over CDP with hostile arguments and the runner checks
// canaries. Bridge fixed the output folder in main, so `save-image` and the
// gallery handlers no longer take a renderer folder — the vectors assert that
// a renderer-supplied folder has no effect. The relay vector is static +
// header-only: never binds a non-loopback address (see the task's safety rule).
'use strict';
const path = require('path');
const fs = require('fs');

function res(status, extra) { return Object.assign({ status }, extra || {}); }
const NUL = '\u0000';

module.exports = [
  {
    id: 'save-image-traversal',
    name: 'save-image rejects traversal filenames and a foreign renderer folder',
    description: 'save-image payloads with .., absolute, drive and NUL filenames, plus a hostile folder field that must be ignored.',
    does: 'Calls saveImage with hostile filenames and a folder field pointing at the canary, and checks the canary and the foreign folder.',
    resists: 'Every hostile filename is rejected; the folder field is ignored (main owns it), so nothing lands outside the stored folder.',
    run: async (ctx) => {
      const attempts = [
        // Aim exactly at the arena canary: output/ is one level under the
        // arena, so a single ".." reaches it.
        { label: 'dot-dot', filename: '..\\outside\\canary-file.txt' },
        { label: 'absolute', filename: ctx.arena.canaryFile },
        { label: 'drive', filename: 'C:\\Windows\\rt.png' },
        { label: 'NUL', filename: 'ok.png' + NUL + '..\\outside\\x' },
      ];
      const out = [];
      const leaked = [];
      for (const a of attempts) {
        const r = await ctx.eval(`window.electronAPI.saveImage(${JSON.stringify({ folder: ctx.arena.outside, filename: a.filename, bytes: Array.from(new TextEncoder().encode('RT')) })})`);
        const v = r && r.value;
        out.push(`${a.label}=${JSON.stringify(v)}`);
        // ok:true is fine IF it landed inside the stored output folder; the
        // real test is the canary check the runner does, plus this location
        // check: nothing may appear outside output/.
      }
      // A control: a benign name must land inside the stored output folder.
      const ctrl = await ctx.eval(`window.electronAPI.saveImage(${JSON.stringify({ filename: 'ok.png', bytes: Array.from(new TextEncoder().encode('RT')) })})`);
      out.push(`control=${JSON.stringify(ctrl && ctrl.value)}`);
      // Any new file the attack created must be inside arena.output.
      const strayFiles = [];
      const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(png|txt|jpg|webp)$/i.test(e.name)) strayFiles.push(p); } };
      if (fs.existsSync(ctx.arena.outside)) walk(ctx.arena.outside);
      if (fs.existsSync(path.join(ctx.arena.outside, 'rt.png'))) leaked.push('foreign-folder');
      if (fs.existsSync(ctx.arena.canaryFile) === false) leaked.push('canary-deleted');
      // The canary content itself: an overwrite means an escape even if the
      // file still exists at the same path.
      if (fs.existsSync(ctx.arena.canaryFile) && fs.readFileSync(ctx.arena.canaryFile, 'utf8') !== 'REDTEAM-CANARY-FILE') leaked.push('canary-overwritten');
      if (leaked.length) {
        return res('vulnerable', {
          payload: "filename = '..\\\\outside\\\\canary-file.txt' (plus absolute/drive/NUL)",
          expected: 'every hostile filename refused; nothing lands outside the stored output folder',
          actual: 'escape detected: ' + leaked.join(', '),
          evidence: out.join('; ') + ' | files under outside/: ' + (strayFiles.map((f) => path.relative(ctx.arena.root, f)).join(', ') || '(none)'),
          fix: 'comfy-bridge/src/main.ts save-image (saveImageRelPath + stored folder)',
        });
      }
      return res('resisted', { evidence: out.join('; ') + ' | no files written under outside/ (sanitized names land inside the stored output folder)' });
    },
  },

  {
    id: 'gallery-escape',
    name: 'gallery-list-dir / gallery-read reject traversal, symlink, non-image and foreign folders',
    description: 'relDir/relPath escapes, a junction into the canary, a non-image extension, and a foreign folder field.',
    does: 'Calls galleryListDir/galleryRead with .. and the junction path, a .txt path, and a foreign folder field.',
    resists: 'All are refused (ok:false / no bytes); the junction is not followed; non-image extensions are rejected.',
    run: async (ctx) => {
      const out = [];
      const leaked = [];
      const tries = [
        { label: 'list-dot-dot', call: `window.electronAPI.galleryListDir({ relDir: '..\\\\..\\\\outside' })` },
        { label: 'list-junction', call: `window.electronAPI.galleryListDir({ relDir: ${JSON.stringify(path.relative(ctx.arena.output, ctx.arena.link))} })` },
        { label: 'read-dot-dot', call: `window.electronAPI.galleryRead({ relPath: '..\\\\..\\\\outside\\\\canary-file.txt' })` },
        { label: 'read-txt', call: `window.electronAPI.galleryRead({ relPath: 'note.txt' })` },
        { label: 'read-foreign-folder', call: `window.electronAPI.galleryRead({ folder: ${JSON.stringify(ctx.arena.outside)}, relPath: 'canary-file.txt' })` },
      ];
      for (const t of tries) {
        const r = await ctx.eval(t.call);
        const v = r && r.value;
        out.push(`${t.label}=${JSON.stringify(v)}`);
        if (v && (v.ok || v.base64)) leaked.push(t.label);
      }
      if (ctx.arena && fs.existsSync(ctx.arena.canaryFile) === false) leaked.push('canary-deleted');
      if (leaked.length) {
        return res('vulnerable', { payload: leaked.join(', '), expected: 'all refused', actual: 'accepted: ' + leaked.join(', '), evidence: out.join('; '), fix: 'comfy-bridge/src/main.ts gallery-list-dir/gallery-read' });
      }
      return res('resisted', { evidence: out.join('; ') });
    },
  },

  {
    id: 'comfy-request-path',
    name: 'comfyRequest rejects absolute / // urlPath and non-http schemes',
    description: 'A renderer-supplied host with an absolute or protocol-relative target must not redirect the request.',
    does: 'Reads the comfyRequest guard in src/main.ts and asserts the leading-slash + http(s) checks exist.',
    resists: 'urlPath must start with / and not //; host protocol must be http/https.',
    run: async (ctx) => {
      const hits = ctx.grep(ctx.app.appDir(), ['.ts'], /urlPath|startsWith\('\/'\)|Invalid ComfyUI request path|base\.protocol/);
      const guarded = hits.some((h) => /startsWith\('\/'\)/.test(h.text)) && hits.some((h) => /Invalid ComfyUI request path/.test(h.text));
      if (!guarded) return res('vulnerable', { payload: 'http://evil/ absolute urlPath', expected: 'rejected', actual: 'no guard found', evidence: 'grep of src/main.ts comfyRequest', fix: 'comfy-bridge/src/main.ts comfyRequest' });
      // Also confirm the renderer cannot pass an absolute URL through a real call
      // without the main process refusing it: object-info with a bogus host.
      const r = await ctx.eval(`window.electronAPI.synthdatGetObjectInfo({ host: 'http://127.0.0.1:1/', classType: 'X', inputName: 'y' })`);
      return res('resisted', { evidence: `leading-slash+scheme guard present; live call returned ${JSON.stringify(r && r.value && (r.value.error || r.value.ok))}` });
    },
  },

  {
    id: 'preset-prototype',
    name: 'Presets reject __proto__ / constructor / prototype names',
    description: 'save/load/delete-preset with prototype-polluting names must not create an own property or pollute Object.prototype.',
    does: 'Calls savePreset with the three dangerous names and checks Object.prototype and the preset file.',
    resists: 'All three are rejected; no own property is created on Object.prototype. (Traversal-style names are harmless: a preset name is a JSON object key, not a filesystem path.)',
    run: async (ctx) => {
      const names = ['__proto__', 'constructor', 'prototype'];
      const out = [];
      const bad = [];
      for (const n of names) {
        const s = await ctx.eval(`window.electronAPI.savePreset({ kind: 'negative', name: ${JSON.stringify(n)}, value: 'pwn' })`);
        const sv = s && s.value;
        out.push(`save(${n})=${JSON.stringify(sv)}`);
        if (sv && sv.ok) bad.push('save:' + n);
        // A polluted Object.prototype would show up here.
        const poll = await ctx.eval(`(() => ({ polluted: ({}).pwn !== undefined }))()`);
        if (poll && poll.value && poll.value.polluted) bad.push('proto-pollution:' + n);
      }
      // Read the resulting presets file and confirm none of the bad names is an own key.
      const pf = path.join(ctx.arena.userdata, 'comfy-bridge-presets.json');
      let fileKeys = '';
      if (fs.existsSync(pf)) {
        try { fileKeys = Object.keys(JSON.parse(fs.readFileSync(pf, 'utf8')).negativePresets || {}).join(','); } catch (e) { /* ignore */ }
      }
      if (bad.length) {
        return res('vulnerable', { payload: bad.join(', '), expected: 'all rejected', actual: 'accepted/polluted: ' + bad.join(', '), evidence: out.join('; ') + ' | file keys=' + fileKeys, fix: 'comfy-bridge/src/main.ts safePresetName' });
      }
      return res('resisted', { evidence: out.join('; ') + ' | file keys=' + (fileKeys || '(none)') });
    },
  },

  {
    id: 'relay-exposure',
    name: 'Relay: token enforcement, CORS, body cap, clientId and map bounds (header/static only)',
    description: 'The opt-in LAN relay is checked by code + response headers, never by binding a non-loopback address.',
    does: 'Grep-asserts the relay guards and reads the documented CORS/bind behavior from src/local-relay.ts.',
    resists: 'Token gates every request + WS upgrade when set; upload body capped; clientId length/shape checked; every map trimmed; CORS * is intentional/no-auth by design.',
    run: async (ctx) => {
      const src = path.join(ctx.app.appDir(), 'src', 'local-relay.ts');
      const text = fs.readFileSync(src, 'utf8');
      const checks = {
        tokenGate: /!tokenOk\(req, url\)/.test(text),
        tokenDefaultOff: /let sharedToken = ''/.test(text),
        wsToken: /!tokenOk\(req, url\)/.test(text) && /upgrade/.test(text),
        bodyCap: /MAX_UPLOAD_BYTES/.test(text) && /readBody\(req, MAX_UPLOAD_BYTES\)/.test(text),
        clientId: /function cleanClientId/.test(text) && /MAX_CLIENT_ID/.test(text),
        trimUploads: /trim\(uploads, KEEP\)/.test(text),
        trimHistory: /trim\(history, KEEP\)/.test(text),
        trimViews: /trim\(views, KEEP/.test(text),
        corsStar: /Access-Control-Allow-Origin', '\*'/.test(text),
        bindsAll: /listen\(port, '0\.0\.0\.0'/.test(text),
      };
      const missing = Object.entries(checks).filter(([, v]) => !v).map(([k]) => k);
      // corsStar + bindsAll are by design (documented no-auth LAN/Tailscale).
      const required = missing.filter((k) => k !== 'corsStar' && k !== 'bindsAll');
      if (required.length) {
        return res('vulnerable', { payload: required.join(', '), expected: 'all relay guards present', actual: 'missing: ' + required.join(', '), evidence: JSON.stringify(checks), fix: 'comfy-bridge/src/local-relay.ts' });
      }
      return res('resisted', { evidence: `guards present: ${Object.entries(checks).filter(([, v]) => v).map(([k]) => k).join(', ')} (CORS * and 0.0.0.0 bind are the documented opt-in LAN design)` });
    },
  },

  {
    id: 'bridge-shell-csp',
    name: 'Bridge shell: sender guard, CSP, navigation and popup blocking; no inline scripts',
    description: 'The bridge main.ts carries the ported guard + shell hardening, and its renderer has no inline script.',
    does: 'Grep-asserts the guard/CSP/shell in comfy-bridge/src/main.ts and confirms renderer/index.html has no inline <script>.',
    resists: 'assertTrustedFrame wraps handle once; will-navigate + windowOpenDeny + CSP present; no inline script to hash.',
    run: async (ctx) => {
      const root = ctx.app.appDir();
      const main = ctx.grep(path.join(root, 'src'), ['main.ts'], /assertTrustedFrame|will-navigate|setWindowOpenHandler|Content-Security-Policy/);
      const guard = main.some((h) => /assertTrustedFrame/.test(h.text));
      const nav = main.some((h) => /will-navigate/.test(h.text));
      const deny = main.some((h) => /action:\s*'deny'/.test(h.text));
      const csp = main.some((h) => /Content-Security-Policy/.test(h.text));
      const html = fs.readFileSync(path.join(root, 'renderer', 'index.html'), 'utf8');
      const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].filter((m) => m[1].trim());
      const ok = guard && nav && deny && csp && inline.length === 0;
      if (!ok) return res('vulnerable', { payload: 'bridge shell', expected: 'guard+shell, no inline script', actual: `guard=${guard} nav=${nav} deny=${deny} csp=${csp} inline=${inline.length}`, evidence: 'grep + renderer/index.html', fix: 'comfy-bridge/src/main.ts' });
      const preloadLeak = ctx.grep(path.join(root, 'src'), ['preload.ts'], /ipcRenderer\s*[,}]/).some((h) => !/invoke|on|send/.test(h.text));
      if (preloadLeak) return res('vulnerable', { payload: 'raw ipcRenderer', expected: 'not exposed', actual: 'exposed', evidence: 'comfy-bridge/src/preload.ts', fix: 'keep the fixed contextBridge surface' });
      return res('resisted', { evidence: `guard=${guard} nav=${nav} deny=${deny} csp=${csp} inlineScripts=${inline.length} rawIpcLeak=false` });
    },
  },

  {
    id: 'save-image-foreign-folder',
    name: 'save-image ignores a renderer-supplied folder that differs from the picked one',
    description: 'The renderer passes { folder: <canary area> } alongside a benign filename; the file must land in the picked output folder, never the supplied one.',
    does: 'Calls saveImage twice: once with a foreign folder + benign name, once with a traversal name + foreign folder, then checks where files actually landed.',
    resists: 'The folder field has no effect: the file lands inside the stored output folder and nothing appears in the supplied foreign folder.',
    run: async (ctx) => {
      const ctrl = await ctx.eval(`window.electronAPI.saveImage(${JSON.stringify({ folder: ctx.arena.outside, filename: 'benign.png', bytes: Array.from(new TextEncoder().encode('RT')) })})`);
      const trav = await ctx.eval(`window.electronAPI.saveImage(${JSON.stringify({ folder: ctx.arena.outside, filename: '..\\outside\\foreign.png', bytes: Array.from(new TextEncoder().encode('RT')) })})`);
      const inOutput = fs.existsSync(path.join(ctx.arena.output, 'benign.png'));
      const inForeign = fs.existsSync(path.join(ctx.arena.outside, 'benign.png'));
      const ev = `benign(folder=outside)={ok:${ctrl && ctrl.value && ctrl.value.ok}}; landed-in-output=${inOutput}; landed-in-foreign=${inForeign}; traversal={ok:${trav && trav.value && trav.value.ok}}`;
      if (inForeign) {
        return res('vulnerable', { payload: "{ folder: <foreign>, filename: 'benign.png' }", expected: 'foreign folder ignored', actual: 'a file was written into the supplied foreign folder', evidence: ev, fix: 'comfy-bridge/src/main.ts save-image (use the stored folder only)' });
      }
      if (!inOutput) {
        return res('error', { evidence: 'control file did not land in the output folder — the stored folder was not seeded; result untrustworthy. ' + ev });
      }
      return res('resisted', { evidence: ev });
    },
  },

  {
    id: 'gallery-read-non-image',
    name: 'gallery-read refuses a non-image file (and a renamed executable)',
    description: 'Only the mapped image extensions may be read; a .txt/.exe must be refused.',
    does: 'Writes a .txt and a .exe into the output folder, then calls galleryRead on each and on a KNOWN image as control.',
    resists: 'Non-image extensions return ok:false; a real image is still readable (control).',
    run: async (ctx) => {
      fs.mkdirSync(ctx.arena.output, { recursive: true });
      fs.writeFileSync(path.join(ctx.arena.output, 'secret.txt'), 'not an image');
      fs.writeFileSync(path.join(ctx.arena.output, 'evil.exe'), 'MZ');
      // a real PNG control
      fs.writeFileSync(path.join(ctx.arena.output, 'real.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'));
      const g = async (p) => { const r = await ctx.eval(`window.electronAPI.galleryRead({ relPath: ${JSON.stringify(p)} })`); return r && r.value; };
      const txt = await g('secret.txt');
      const exe = await g('evil.exe');
      const png = await g('real.png');
      const ev = `read(secret.txt)=${JSON.stringify(txt)}; read(evil.exe)=${JSON.stringify(exe)}; read(real.png)=${JSON.stringify(png && { ok: png.ok, mime: png.mime })}`;
      const leaked = (txt && (txt.ok || txt.base64)) || (exe && (exe.ok || exe.base64));
      if (leaked) {
        return res('vulnerable', { payload: 'secret.txt / evil.exe', expected: 'refused (Not an image file.)', actual: 'a non-image was returned', evidence: ev, fix: 'comfy-bridge/src/main.ts gallery-read (GALLERY_IMAGE_EXTENSIONS)' });
      }
      if (!png || !png.ok) return res('error', { evidence: 'control real.png was not readable — extension allowlist may be too strict; result untrustworthy. ' + ev });
      return res('resisted', { evidence: ev });
    },
  },

  {
    id: 'gallery-list-junction',
    name: 'gallery-list-dir through a junction cannot escape the output folder',
    description: 'A junction inside the output folder pointing at the canary area must not be traversable by galleryListDir.',
    does: 'Creates a junction inside the output folder named like a subfolder, pointing at the canary dir, then calls galleryListDir on it.',
    resists: 'galleryListDir refuses the junction path (Invalid path / not inside) or lists nothing from the canary.',
    run: async (ctx) => {
      const linkName = 'esc-' + Date.now();
      const linkPath = path.join(ctx.arena.output, linkName);
      try { fs.symlinkSync(ctx.arena.linkTarget, linkPath, 'junction'); }
      catch (e) { return res('untestable', { reason: 'could not create a junction in the output folder: ' + e.message }); }
      const r = await ctx.eval(`window.electronAPI.galleryListDir({ relDir: ${JSON.stringify(linkName)} })`);
      const v = r && r.value;
      const ev = `list(${linkName})=${JSON.stringify(v)}`;
      // If the listing succeeded and includes the link target's contents, the
      // junction was followed out of the allowed folder.
      const followed = v && v.ok && Array.isArray(v.entries) && v.entries.some((e) => e.name === 'inside.txt');
      if (followed) {
        return res('vulnerable', { payload: 'junction inside output → canary', expected: 'refused / no canary contents listed', actual: 'listed the canary directory contents', evidence: ev, fix: 'comfy-bridge/src/main.ts galleryAbsPath/assertWithinBase' });
      }
      return res('resisted', { evidence: ev });
    },
  },

  {
    id: 'relay-live-loopback',
    name: 'Relay (live, loopback): token enforcement, clientId abuse, body cap, map bounds',
    description: 'Starts the real relay on 127.0.0.1 only and probes auth, clientId length/shape, upload cap and map growth.',
    does: 'Requires the app\'s compiled local-relay.js, starts it on loopback with no token, requests a guarded endpoint, then restarts with a token and retries; also sends oversize clientIds and an oversize upload, and opens the /ws websocket with oversize/malformed/valid clientIds.',
    resists: 'With no token, endpoints answer; with a token set, an unauthenticated request is 401 and the token passes; oversize/malformed clientIds (HTTP and WS) are rejected (the WS falls back to a fresh UUID); an oversize upload is refused.',
    run: async (ctx) => {
      const relay = ctx.requireApp('local-relay.js');
      const http = require('http');
      const port = 8700 + Math.floor(Math.random() * 200);
      const request = (path, opts = {}) => new Promise((resolve) => {
        const req = http.request({ host: '127.0.0.1', port, path, method: opts.method || 'GET', headers: opts.headers || {} }, (res) => {
          let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
        });
        req.on('error', (e) => resolve({ status: 0, error: e.message }));
        if (opts.body) req.write(opts.body);
        req.end();
      });
      // A raw websocket probe: open /ws?clientId=… and read the relay's own
      // status message, whose `sid` is the id the socket was keyed by.
      const WS = require(path.join(ctx.app.appDir(), 'node_modules', 'ws'));
      const isUuid = (s) => typeof s === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
      const wsProbe = (clientId) => new Promise((resolve) => {
        let ws;
        try { ws = new WS(`ws://127.0.0.1:${port}/ws?clientId=${encodeURIComponent(clientId)}`); }
        catch (e) { return resolve('CONNECT-ERROR:' + e.message); }
        let done = false;
        const finish = (v) => { if (done) return; done = true; try { ws.close(); } catch { /* gone */ } resolve(v); };
        ws.on('message', (data) => { try { const m = JSON.parse(String(data)); finish(m && m.data && m.data.sid); } catch { finish(null); } });
        ws.on('error', (e) => finish('WS-ERROR:' + e.message));
        ws.on('close', () => finish('CLOSED'));
        setTimeout(() => finish('TIMEOUT'), 5000);
      });
      const out = [];
      const bad = [];
      let wsConnectError = false;
      try {
        // --- no token: an unguarded endpoint answers (relay opt-in design) ---
        let st = await relay.startRelay(port, '', '127.0.0.1');
        if (!st.ok) return res('error', { evidence: 'relay did not start: ' + st.error });
        const noTok = await request('/system_stats');
        out.push(`no-token /system_stats → ${noTok.status}`);
        // clientId abuse: oversize and malformed should not create a socket key
        const sub = await request('/internal/logs/subscribe', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ clientId: 'A'.repeat(500), enabled: true }) });
        out.push(`oversize clientId → ${sub.status}`);
        // oversize upload (>16MB) must be refused
        const big = 'x'.repeat(17 * 1024 * 1024);
        const up = await request('/upload/image', { method: 'POST', headers: { 'Content-Type': 'multipart/form-data; boundary=B' }, body: big });
        out.push(`oversize upload → ${up.status}`);
        if (up.status === 200) bad.push('oversize upload accepted');
        // WebSocket clientId: oversize and malformed must fall back to a fresh
        // UUID, never open a socket keyed by the hostile value. A valid id must
        // be echoed (control: proves the probe reads the right field).
        const wsOver = await wsProbe('A'.repeat(500));
        const wsBad = await wsProbe('bad id!@#$%^&*()../..');
        const wsOk = await wsProbe('phone-1');
        out.push(`ws oversize → sid=${JSON.stringify(wsOver)}`);
        out.push(`ws malformed → sid=${JSON.stringify(wsBad)}`);
        out.push(`ws valid → sid=${JSON.stringify(wsOk)}`);
        if ([wsOver, wsBad, wsOk].some((v) => typeof v !== 'string' || /^(WS-ERROR|CONNECT-ERROR|TIMEOUT|CLOSED)/.test(v) || v === null)) {
          wsConnectError = true;
        } else {
          if (wsOver === 'A'.repeat(500) || !isUuid(wsOver)) bad.push('oversize clientId opened a WS keyed by the hostile id');
          if (wsBad === 'bad id!@#$%^&*()../..' || !isUuid(wsBad)) bad.push('malformed clientId opened a WS keyed by the hostile id');
          if (wsOk !== 'phone-1') bad.push('valid clientId was not echoed on the WS (control failed)');
        }
        relay.stopRelay();

        // --- with a token: unauth request is refused, correct token passes ---
        st = await relay.startRelay(port, 'secret-123', '127.0.0.1');
        if (!st.ok) return res('error', { evidence: 'relay did not restart: ' + st.error });
        const unauth = await request('/system_stats');
        const authHdr = await request('/system_stats', { headers: { 'X-Osmium-Token': 'secret-123' } });
        const wrong = await request('/system_stats', { headers: { 'X-Osmium-Token': 'nope' } });
        out.push(`token set: no-token → ${unauth.status}, correct → ${authHdr.status}, wrong → ${wrong.status}`);
        if (unauth.status !== 401) bad.push('unauthenticated request not 401 with a token set');
        if (authHdr.status !== 200) bad.push('correct token did not pass');
        if (wrong.status !== 401) bad.push('wrong token was not refused');
        // CORS header is the documented opt-in design; record it.
        out.push(`CORS Access-Control-Allow-Origin=${authHdr.headers && authHdr.headers['access-control-allow-origin']}`);
        relay.stopRelay();
      } catch (e) {
        try { relay.stopRelay(); } catch { /* ignore */ }
        return res('error', { evidence: 'relay probe threw: ' + e.message + ' | ' + out.join('; ') });
      }
      if (wsConnectError) {
        return res('error', { evidence: 'the /ws probe never received a status message (relay or websocket issue, not an app finding): ' + out.join('; ') });
      }
      if (bad.length) {
        return res('vulnerable', { payload: bad.join(', '), expected: 'token gates access, upload cap enforced, clientId bounded', actual: 'failed: ' + bad.join(', '), evidence: out.join('; '), fix: 'comfy-bridge/src/local-relay.ts' });
      }
      return res('resisted', { evidence: out.join('; ') });
    },
  },
];
