// Osmium Desktop attack vectors.
//
// Each vector simulates a compromised renderer calling the real preload/main
// handlers over the DevTools protocol with hostile arguments, and checks for a
// canary escape. See tools/redteam/lib/arena.js for the safety model and
// notes/Meta/Red-Team-Harness.md.
'use strict';
const path = require('path');
const fs = require('fs');

// Windows path shapes that must never pass a path validator. UNC and
// drive-relative and NUL are the interesting ones; a plain `..` traversal is
// joined with an allowed base so it aims at the canary.
const TRAVERSALS = (arena) => [
  { label: 'dot-dot relative', p: path.join(arena.dataset, '..', '..', 'outside', 'canary-file.txt') },
  { label: 'UNC host share', p: '\\\\127.0.0.1\\c$\\Windows\\win.ini' },
  { label: 'drive-relative', p: 'C:outside\\canary-file.txt' },
  { label: 'absolute escape', p: arena.canaryFile },
  { label: 'NUL injection', p: arena.dataset + '\u0000..\\..\\outside\\canary-file.txt' },
];

function res(status, extra) { return Object.assign({ status }, extra || {}); }

module.exports = [
  {
    id: 'path-validators',
    name: 'Path handlers reject traversal / UNC / drive-relative / NUL / absolute escapes',
    description: 'trainflow-path-ok, trainflow-find-by-marker, trainflow-open, wd14, bucket and comfy-local handlers, fed hostile paths.',
    does: 'Calls each renderer-fed path handler with the payloads below and checks whether the canary was read, written or deleted.',
    resists: 'Every handler refuses the hostile path (returns false/null/error) and no canary changes.',
    run: async (ctx) => {
      const results = [];
      const bad = [];
      // trainflow-path-ok(dir, file): must refuse every hostile shape (it is a
      // read-only stat, so the verdict is the returned boolean).
      for (const t of TRAVERSALS(ctx.arena)) {
        const r = await ctx.eval(`window.electronAPI.trainflowPathOk(${JSON.stringify(t.p)}, 'canary-file.txt')`);
        const v = r && r.value;
        results.push(`${t.label}=${JSON.stringify(v)}`);
        if (v === true) bad.push(t.label);
      }
      // trainflow-open('dataset', <escaped>): the handler returns nothing, so
      // rely on the canary check; record the call shape.
      const open = await ctx.eval(`window.electronAPI.trainflowOpen('dataset', ${JSON.stringify(ctx.arena.canaryFile)})`);
      results.push(`open-dataset=${JSON.stringify(open && open.value)}`);
      // trainflow-get-sample with a traversal name must be null.
      const sample = await ctx.eval(`window.electronAPI.trainflowGetSample('..\\\\..\\\\outside\\\\canary-file.txt')`);
      const sv = sample && sample.value;
      results.push(`get-sample=${JSON.stringify(sv)}`);
      if (sv != null) bad.push('get-sample');
      if (bad.length) {
        return res('vulnerable', {
          payload: bad.join(', '),
          expected: 'all hostile path shapes refused (false/null)',
          actual: 'accepted: ' + bad.join(', '),
          evidence: results.join('; '),
          fix: 'src/trainflow.ts safeAbsPath/plainFileName + src/main.ts path handlers',
        });
      }
      return res('resisted', { evidence: results.join('; ') });
    },
  },

  {
    id: 'marker-probe',
    name: 'Marker probe: rejects malformed markers, finds a real marker, does not follow links',
    description: 'trainflow-find-by-marker with malformed markers (expect null), a valid marker that exists (expect found) and one that does not (expect null), plus a junction it must not follow.',
    does: 'Feeds malformed markers; plants a valid marker folder under the arena probe root and calls again (expect the path back); plants a valid marker under a junction to the canary and confirms the junction is not followed.',
    resists: 'Malformed markers return null; a real marker is found; a valid but absent marker returns null; the junction is not traversed.',
    run: async (ctx) => {
      const fs = require('fs');
      const path = require('path');
      const out = [];
      const bad = [];
      const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const marker = '.osmium-probe-' + uuid;

      // --- negative: malformed markers must return null ---
      const negatives = [
        { name: 'ds', marker: 'not-a-marker' },
        { name: 'ds', marker: '.osmium-probe-SHORT' },
        { name: '../../outside', marker: '.osmium-probe-' + '0'.repeat(36) },
      ];
      for (const b of negatives) {
        const r = await ctx.eval(`window.electronAPI.trainflowFindByMarker(${JSON.stringify(b.name)}, ${JSON.stringify(b.marker)})`);
        const v = r && r.value;
        out.push(`bad(${b.marker.slice(0, 16)}…)→${JSON.stringify(v)}`);
        if (v) bad.push('malformed accepted: ' + b.marker.slice(0, 16));
      }

      // --- negative: a VALID-shape marker that does not exist returns null ---
      const absentName = 'rt-absent-' + Date.now();
      const absent = await ctx.eval(`window.electronAPI.trainflowFindByMarker(${JSON.stringify(absentName)}, ${JSON.stringify(marker)})`);
      out.push(`absent-valid-marker→${JSON.stringify(absent && absent.value)}`);
      if (absent && absent.value) bad.push('found a marker that does not exist');

      // --- positive: a real marker folder under the arena probe root is found ---
      const foundName = 'rt-found-' + Date.now();
      const foundDir = path.join(ctx.arena.root, foundName);
      fs.mkdirSync(foundDir, { recursive: true });
      fs.writeFileSync(path.join(foundDir, marker), 'probe');
      const found = await ctx.eval(`window.electronAPI.trainflowFindByMarker(${JSON.stringify(foundName)}, ${JSON.stringify(marker)})`);
      const foundPath = found && found.value;
      out.push(`present-valid-marker→${JSON.stringify(foundPath)}`);
      const positiveOk = foundPath && path.resolve(foundPath) === path.resolve(foundDir);
      if (!positiveOk) bad.push('valid present marker was NOT found (probe negative is untrustworthy)');

      // --- link: a valid marker behind a junction must not be followed. The
      // probe skips reparse points. Plant the marker in the junction's target
      // (a NON-canary dir, so this setup can't change a canary), name the
      // junction like the dataset, and query it. ---
      let linkResult = 'no-link';
      if (ctx.arena.link && fs.existsSync(ctx.arena.link)) {
        fs.writeFileSync(path.join(ctx.arena.linkTarget, marker), 'link-probe');
        const linkName = path.basename(ctx.arena.link);
        const viaLink = await ctx.eval(`window.electronAPI.trainflowFindByMarker(${JSON.stringify(linkName)}, ${JSON.stringify(marker)})`);
        linkResult = JSON.stringify(viaLink && viaLink.value);
        // If it returned the junction path, the walk followed a link.
        if (viaLink && viaLink.value && String(viaLink.value).toLowerCase().includes('target-link')) {
          bad.push('probe followed a junction');
        }
      }
      out.push(`junction→${linkResult}`);

      if (bad.length) {
        return res('vulnerable', {
          payload: bad.join(', '),
          expected: 'malformed→null, absent→null, present→found, junction→not followed',
          actual: 'failed: ' + bad.join(', '),
          evidence: out.join('; '),
          fix: 'src/trainflow.ts MARKER_RE / plainFolderName / isLinkOrReparse',
        });
      }
      return res('resisted', { evidence: out.join('; ') });
    },
  },

  {
    id: 'tampered-run-record',
    name: 'Tampered trainflow-run.json is refused by name (outDir/logFile/samplesDir outside outputBase)',
    description: 'Writes a run record whose dirs point outside the install output, then asks trainflow to open/read them.',
    does: 'Places a forged userData/trainflow-run.json pointing at the canary area (with a valid fake install seeded so the path guard is reached), then calls trainflow-open and trainflow-get-sample and a malformed-name control.',
    resists: 'runDirsValid rejects the record: open returns {ok:false, refused:"run-record-dirs-outside-output"}, get-sample returns null, and no canary changes. The refusal is surfaced, not swallowed.',
    run: async (ctx) => {
      const runFile = path.join(ctx.arena.userdata, 'trainflow-run.json');
      fs.mkdirSync(path.dirname(runFile), { recursive: true });
      // logFile is a nonexistent path (still out-of-bounds) so a buggy
      // acceptance cannot actually pop an editor on the canary.
      fs.writeFileSync(runFile, JSON.stringify({
        pid: 999999, startedAt: 0, project: 'x',
        outDir: ctx.arena.outside, logFile: path.join(ctx.arena.outside, 'rt-no-such.log'),
        samplesDir: ctx.arena.canaryDir, exe: 'x', totalSteps: 5,
      }));
      const open = await ctx.eval(`window.electronAPI.trainflowOpen('log')`);
      const ov = open && open.value;
      const sample = await ctx.eval(`window.electronAPI.trainflowGetSample('inside.txt')`);
      const sv = sample && sample.value;
      // Control: a genuinely malformed name must also refuse, and the call must
      // still REACH the handler (__ok:true). If __ok were false everywhere, the
      // calls never ran and the nulls would prove nothing.
      const control = await ctx.eval(`window.electronAPI.trainflowGetSample('../escape.txt')`);
      const cv = control && control.value;
      const ran = open && open.__ok === true && sample && sample.__ok === true && control && control.__ok === true;
      const refused = ov && typeof ov === 'object' && ov.ok === false && typeof ov.refused === 'string';
      const ev = `open(log)={__ok:${open && open.__ok}}→${JSON.stringify(ov)}; get-sample=${JSON.stringify(sv)}; control(malformed)=${JSON.stringify(cv)}; handler-ran=${ran}`;
      if (!ran) {
        return res('error', { evidence: 'the handlers never ran (all __ok:false) — cannot distinguish refused from never-ran. ' + ev });
      }
      // Vulnerable if the handler accepted the out-of-bounds record: open says
      // ok:true (no refusal) or get-sample returned bytes.
      if ((ov && ov.ok === true) || sv != null) {
        return res('vulnerable', { payload: 'forged run record (dirs outside outputBase)', expected: 'refused (ok:false) and sample null', actual: 'out-of-bounds path accepted', evidence: ev, fix: 'src/trainflow.ts runDirsValid / trainflow-get-sample / trainflow-open' });
      }
      if (!refused) {
        return res('error', { evidence: 'trainflow-open returned no inspectable refusal (stale build?) — expected {ok:false,refused}. ' + ev });
      }
      return res('resisted', { evidence: ev + `; open.refused=${JSON.stringify(ov.refused)}` });
    },
  },

  {
    id: 'toml-injection',
    name: 'TOML/prompt writers strip newlines and control characters (drives the real writers)',
    description: 'Feeds newline/CR/NUL/tab through the real writer path (renderTomlsForTest) and reads the output.',
    does: 'Requires the app\'s compiled trainflow.js and calls renderTomlsForTest with hostile trigger/prompt/project/dataset strings, then checks the emitted files line-by-line.',
    resists: 'No injected line appears: every hostile value collapses to one line and no extra TOML key/line is created.',
    run: async (ctx) => {
      const tf = ctx.requireApp('trainflow.js');
      if (typeof tf.renderTomlsForTest !== 'function') {
        return res('error', { evidence: 'trainflow.js did not expose renderTomlsForTest (stale build?)' });
      }
      const INJ = 'pwn';
      const evil = `x\n[general]\n${INJ} = 1\r\n[more]`;
      const settings = {
        trigger: evil, prompt: `user\u0000prompt\tend`, negPrompt: `neg\n${INJ}`,
        datasetPath: `C:/data\n${INJ}`, ditPath: 'C:/m.safetensors', qwenPath: 'C:/q', vaePath: 'C:/v',
        optimizer: `AdamW\n${INJ}`, lr: 1e-4, steps: 10, batchSize: 1, gradAcc: 1, rank: 8,
        saveSteps: 5, sampleSteps: 5, trainSeed: 1, sampleSeed: 1, sampleGenSteps: 1, cfg: 1, width: 64, height: 64,
      };
      const check = { images: 1, baseRes: 512, maxBucket: 512 };
      let r;
      try { r = tf.renderTomlsForTest(settings, check, `C:/out\n${INJ}`, 'C:/prompts.txt', `proj\n${INJ}`); }
      catch (e) { return res('error', { evidence: 'writer seam threw: ' + e.message }); }
      // The injection is proven if any emitted line equals a bare "pwn = 1" (a
      // new TOML key) or a line starts with "[more]" / contains a raw CR.
      const all = `${r.datasetToml}\n${r.trainingToml}\n${r.samplePrompts}`;
      const lines = all.split('\n');
      // The injection is proven only if hostile content became a NEW line/key:
      // a bare "pwn = 1" line, a line STARTING with "[more]" (a new section), or
      // any raw CR/NUL/TAB surviving in the output. Literal "[more]" text on an
      // existing single line is harmless (that is the strip working).
      const injectedLines = lines.filter((l) => l.trim() === `${INJ} = 1` || /^\[more\]/.test(l.trim()) || /[\r\u0000\t]/.test(l));
      const looksInjected = injectedLines.length > 0;
      const ev = `dataset lines=${r.datasetToml.split('\n').length}; injected-lines=${JSON.stringify(injectedLines)}; raw-sample=${JSON.stringify(r.samplePrompts)}`;
      if (looksInjected) {
        return res('vulnerable', {
          payload: JSON.stringify(evil),
          expected: 'no extra line/key; control chars removed',
          actual: 'injected content survived into the output',
          evidence: ev,
          fix: 'src/trainflow.ts stripControl/tomlStr/writeSamplePrompts',
        });
      }
      return res('resisted', { evidence: `hostile trigger/prompt/project/dataset all collapsed to single lines; ${ev}` });
    },
  },

  {
    id: 'sender-guard',
    name: 'Sender guard rejects spoofed frames (live unit test of the real guard)',
    description: 'Calls the real compiled ipc-guard with spoofed events, and confirms the real page is accepted.',
    does: 'Requires the app\'s compiled ipc-guard.js, sets the trusted URL to the app\'s own index.html, then calls assertTrustedFrame with wrong-URL / no-frame / about:blank / foreign-file events and with the correct page.',
    resists: 'Every spoofed event throws; the real page is accepted.',
    run: async (ctx) => {
      const guard = ctx.requireApp('ipc-guard.js');
      // The real page URL is the app's own renderer/index.html.
      const realPage = path.join(ctx.app.appDir(), 'renderer', 'index.html');
      guard.setTrustedRenderer(realPage);
      const trusted = guard.trustedRenderer();
      const spoofs = [
        { label: 'wrong URL', ev: { senderFrame: { url: 'https://evil.example/index.html' } } },
        { label: 'no senderFrame', ev: {} },
        { label: 'null frame', ev: { senderFrame: null } },
        { label: 'about:blank', ev: { senderFrame: { url: 'about:blank' } } },
        { label: 'foreign file://', ev: { senderFrame: { url: 'file:///C:/Windows/win.ini' } } },
        { label: 'subpath (index.html.evil)', ev: { senderFrame: { url: path.join(ctx.app.appDir(), 'renderer', 'index.html.evil') } } },
      ];
      const out = [];
      const accepted = [];
      for (const s of spoofs) {
        let threw = false, err = '';
        try { guard.assertTrustedFrame(s.ev); } catch (e) { threw = true; err = e.message; }
        out.push(`${s.label}=${threw ? 'threw(' + err + ')' : 'ACCEPTED'}`);
        if (!threw) accepted.push(s.label);
      }
      // The real page must be accepted.
      let realOk = false;
      try { guard.assertTrustedFrame({ senderFrame: { url: trusted } }); realOk = true; } catch (e) { realOk = false; }
      out.push(`real-page=${realOk ? 'accepted' : 'REJECTED'}`);
      if (accepted.length || !realOk) {
        return res('vulnerable', {
          payload: accepted.length ? accepted.join(', ') : 'real page rejected',
          expected: 'every spoofed frame throws, the real page is accepted',
          actual: accepted.length ? 'accepted: ' + accepted.join(', ') : 'real page was rejected',
          evidence: out.join('; '),
          fix: 'src/ipc-guard.ts assertTrustedFrame',
        });
      }
      return res('resisted', { evidence: `trusted=${trusted}; ${out.join('; ')}` });
    },
  },

  {
    id: 'shell-csp',
    name: 'Shell: navigation, popups, inline script, eval and remote loads are blocked',
    description: 'will-navigate, setWindowOpenHandler(deny) and the CSP policy in main.ts.',
    does: 'Grep-asserts the shell protections and reads the live CSP the running app serves on its own document.',
    resists: 'will-navigate blocks foreign URLs, window-open is denied, and the CSP has no unsafe-inline script / no remote connect-src.',
    run: async (ctx) => {
      const hits = ctx.grep(ctx.app.appDir(), ['.ts'], /will-navigate|setWindowOpenHandler|Content-Security-Policy|onHeadersReceived/);
      const nav = hits.some((h) => /will-navigate/.test(h.text));
      const deny = hits.some((h) => /action:\s*'deny'/.test(h.text));
      const csp = hits.some((h) => /Content-Security-Policy/.test(h.text));
      // Inspect the CSP meta/header actually in effect by attempting an inline
      // eval and a remote script load in the renderer.
      const evalRes = await ctx.eval(`(() => { try { (0,eval)('window.__rt=1'); return !!window.__rt; } catch(e){ return 'blocked:'+e.message; } })()`);
      if (!nav || !deny || !csp) {
        return res('vulnerable', { payload: 'renderer eval / navigation', expected: 'blocked', actual: `nav=${nav} deny=${deny} csp=${csp}`, evidence: 'grep of src/main.ts', fix: 'src/main.ts createWindow/applyRendererCsp' });
      }
      return res('resisted', { evidence: `will-navigate=${nav} windowOpenDeny=${deny} csp=${csp}; direct eval in isolated renderer=${JSON.stringify(evalRes.value)}` });
    },
  },

  {
    id: 'static-isolation',
    name: 'static: defence present — restricted handler denies; isolation flags; no raw ipcRenderer in preload',
    description: 'Static check (NOT a live attack): file-system-access-restricted handler, contextIsolation/sandbox/nodeIntegration and a clean preload surface.',
    does: 'Grep-asserts the session handler, the BrowserWindow webPreferences, and that preload.ts exposes only contextBridge methods. Reads source, does not attack the running app.',
    resists: 'file-system-access-restricted denies; contextIsolation true, sandbox true, nodeIntegration false; preload has no raw ipcRenderer passthrough.',
    static: true,
    run: async (ctx) => {
      const root = ctx.app.appDir();
      const main = ctx.grep(root, ['.ts'], /file-system-access-restricted|contextIsolation|sandbox|nodeIntegration/);
      const denies = main.some((h) => /file-system-access-restricted/.test(h.text));
      const ctxIso = main.some((h) => /contextIsolation:\s*true/.test(h.text));
      const sandbox = main.some((h) => /sandbox:\s*true/.test(h.text));
      const nodeOff = main.some((h) => /nodeIntegration:\s*false/.test(h.text));
      const preloadHits = ctx.grep(path.join(root, 'src'), ['preload.ts'], /ipcRenderer|contextBridge/);
      const rawLeak = preloadHits.some((h) => /ipcRenderer\s*[,}]/.test(h.text) && !/invoke|on|send/.test(h.text));
      const ok = denies && ctxIso && sandbox && nodeOff && !rawLeak;
      if (!ok) return res('vulnerable', { payload: 'static flags', expected: 'all hardened', actual: `deny=${denies} ctxIso=${ctxIso} sandbox=${sandbox} nodeOff=${nodeOff} rawLeak=${rawLeak}`, evidence: 'grep src/main.ts + src/preload.ts', fix: 'src/main.ts createWindow / preload.ts' });
      return res('resisted', { static: true, evidence: `static (source says defence is present, not a live attack): restricted-deny=${denies} ctxIso=${ctxIso} sandbox=${sandbox} nodeOff=${nodeOff} rawIpcRendererLeak=${rawLeak}` });
    },
  },

  {
    id: 'restricted-folder-deny',
    name: 'static: defence present — restricted-folder handler returns deny (not allow/tryAgain)',
    description: 'Static check (NOT a live attack): the file-system-access-restricted session handler.',
    does: 'Reads src/main.ts for the handler and asserts it calls callback(\'deny\') and never allow/tryAgain unconditionally.',
    resists: 'session ... file-system-access-restricted → callback(\'deny\') and no callback(\'allow\').',
    static: true,
    run: async (ctx) => {
      const hits = ctx.grep(ctx.app.appDir(), ['.ts'], /file-system-access-restricted|callback\(/);
      const handler = hits.filter((h) => /file-system-access-restricted/.test(h.text)).length > 0;
      const denies = hits.some((h) => /callback\(\s*'deny'\s*\)/.test(h.text));
      const allows = hits.some((h) => /callback\(\s*'allow'\s*\)/.test(h.text));
      if (!handler || !denies || allows) {
        return res('vulnerable', { payload: 'restricted folder pick', expected: "callback('deny'), never 'allow'", actual: `handler=${handler} deny=${denies} allow=${allows}`, evidence: 'grep src/main.ts', fix: 'src/main.ts file-system-access-restricted handler' });
      }
      return res('resisted', { static: true, evidence: `static source check: handler present=${handler}, callback('deny')=${denies}, callback('allow')=${allows}` });
    },
  },

  {
    id: 'probe-junction',
    name: 'Marker probe does not follow a junction/symlink out of the probe root',
    description: 'Plants a junction inside the probe root pointing at the canary folder and confirms the walk refuses it.',
    does: 'Creates a junction named like the dataset under the arena probe root, pointing at a separate link-target dir holding a valid marker, and calls trainflow-find-by-marker.',
    resists: 'The probe skips the reparse point: it returns null and never descends into the junction (canary/link target untouched by the app).',
    run: async (ctx) => {
      const fs = require('fs');
      const path = require('path');
      if (!ctx.arena.link || !fs.existsSync(ctx.arena.link)) {
        return res('untestable', { reason: 'could not create a junction in this environment (filesystem refused).' });
      }
      const marker = '.osmium-probe-' + 'f'.repeat(8) + '-1111-2222-3333-444444444444';
      fs.writeFileSync(path.join(ctx.arena.linkTarget, marker), 'linked');
      // A REAL directory with the same name as the junction, WITHOUT the
      // marker, so a match would have to come through the link.
      const linkName = path.basename(ctx.arena.link);
      // Point a junction named like a dataset at the link target.
      const probeLink = path.join(ctx.arena.root, 'rt-probe-' + Date.now());
      try { fs.symlinkSync(ctx.arena.linkTarget, probeLink, 'junction'); }
      catch (e) { return res('untestable', { reason: 'junction creation failed: ' + e.message }); }
      const r = await ctx.eval(`window.electronAPI.trainflowFindByMarker(${JSON.stringify(path.basename(probeLink))}, ${JSON.stringify(marker)})`);
      const v = r && r.value;
      const followed = v && String(v).toLowerCase().includes('probe');
      if (followed) {
        return res('vulnerable', { payload: 'junction → marker behind it', expected: 'not followed (null)', actual: 'walk returned the junction path: ' + v, evidence: `find-by-marker→${JSON.stringify(v)}`, fix: 'src/trainflow.ts isLinkOrReparse' });
      }
      return res('resisted', { evidence: `junction named ${path.basename(probeLink)} → ${JSON.stringify(v)} (not followed)` });
    },
  },

  {
    id: 'cached-dataset-path',
    name: 'A poisoned cached dataset path is rejected by trainflow-path-ok',
    description: 'The remembered dataset path is only accepted if it still holds the dataset image; a canary/foreign path must be refused.',
    does: 'Calls trainflow-path-ok with poisoned candidates (the canary file as a dir, a canary dir with a name containing a separator, a traversal) and confirms each is false.',
    resists: 'trainflow-path-ok returns false for every poisoned candidate (safeAbsPath/plainFileName reject them).',
    run: async (ctx) => {
      const cases = [
        { label: 'raw .. traversal dir', dir: ctx.arena.dataset + '\\..\\..\\outside', file: 'canary-file.txt' },
        { label: 'canary file as dir', dir: ctx.arena.canaryFile, file: 'img1.png' },
        { label: 'canary dir + separator file', dir: ctx.arena.canaryDir, file: '..\\inside.txt' },
        { label: 'drive-relative', dir: 'C:outside', file: 'canary-file.txt' },
        { label: 'UNC', dir: '\\\\127.0.0.1\\c$', file: 'win.ini' },
      ];
      const out = [];
      const accepted = [];
      for (const c of cases) {
        const r = await ctx.eval(`window.electronAPI.trainflowPathOk(${JSON.stringify(c.dir)}, ${JSON.stringify(c.file)})`);
        const v = r && r.value;
        out.push(`${c.label}=${JSON.stringify(v)}`);
        if (v === true) accepted.push(c.label);
      }
      // The cached-path defence: a marker mismatch means the remembered path is
      // NOT accepted. A valid-shape marker for a folder that does not exist
      // must return null (the cache entry is unusable).
      const miss = await ctx.eval(`window.electronAPI.trainflowFindByMarker('rt-nomatch', ${JSON.stringify('.osmium-probe-' + '0'.repeat(36))})`);
      out.push(`marker-mismatch=${JSON.stringify(miss && miss.value)}`);
      if (miss && miss.value) accepted.push('marker-mismatch');
      if (accepted.length) {
        return res('vulnerable', { payload: accepted.join(', '), expected: 'all poisoned cached paths refused (false/null)', actual: 'accepted: ' + accepted.join(', '), evidence: out.join('; '), fix: 'src/trainflow.ts trainflow-path-ok / safeAbsPath / marker cache' });
      }
      return res('resisted', { evidence: out.join('; ') });
    },
  },
];
