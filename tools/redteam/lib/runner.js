// Red Team harness — the runner. Owns the single-run lock, launches one
// throwaway target per app run, executes each vector, and streams results.
'use strict';
const { makeArena, canaryFingerprint, canaryTouched, rmArena, launchTarget, killTarget, waitForPage, cdpConnect, evaluate } = require('./arena');
const { APPS, loadVectors } = require('./registry');

// The lock: at most ONE app's attack runs at a time, process-wide. This is the
// server's own guard (a second start is rejected), independent of the UI's
// disabled buttons.
let lock = { held: false, app: null, startedAt: 0 };

function lockHeldBy() { return lock.held ? lock.app : null; }

// Graceful stop of a running vector set. We only ever kill a target we spawned
// (by PID); the user's own app is never touched.
let active = null; // { target, cdp, arena, stopped }

function requestStop() {
  if (active) active.stopped = true;
}

// Context handed to every vector. It exposes the arena, the target's CDP
// session, a way to read a canary, and helpers. A vector's `run` returns
//   { status:'resisted'|'vulnerable'|'untestable', ... }
// or throws (=> 'error').
function makeContext(app, arena, target, cdp) {
  return {
    app, arena, target,
    // Evaluate in the app renderer (the attacker's position).
    eval: (expr) => evaluate(cdp, expr),
    // Read/write helpers for canaries and the temp folders.
    read: (p) => { try { return require('fs').readFileSync(p, 'utf8'); } catch (e) { return null; } },
    exists: (p) => require('fs').existsSync(p),
    // Call an electronAPI method and capture resolve/reject distinctly.
    call: async (expr) => {
      const r = await evaluate(cdp, expr);
      return r;
    },
    grep: grepInFiles,
    // Require a COMPILED app module (e.g. 'ipc-guard.js', 'trainflow.js') in
    // this Node process, so a vector can call the real function directly rather
    // than grepping for it. Modules that import electron still load (electron
    // resolves to its package path in plain Node); the guard and the TOML test
    // seam are electron-free anyway. Cached between vectors in a run.
    requireApp: (rel) => {
      const path = require('path');
      return require(path.join(app.appDir(), rel));
    },
  };
}

// Search the app's hand-authored source for a pattern (used by static vectors
// that assert a defence exists in code). Returns [{file,line,text}] or [].
function grepInFiles(root, globs, pattern) {
  const fs = require('fs');
  const path = require('path');
  const out = [];
  const skip = new Set(['node_modules', '.git', 'dist', 'Shippable', 'data', 'assets', 'www', 'build']);
  const walk = (dir) => {
    let entries; try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.') && e.name !== '.gitignore') continue;
      if (skip.has(e.name)) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!globs.some((g) => e.name.endsWith(g) || (g.startsWith('*') && e.name === g.slice(1)))) continue;
      let text; try { text = fs.readFileSync(p, 'utf8'); } catch { continue; }
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) if (pattern.test(lines[i])) out.push({ file: p, line: i + 1, text: lines[i].trim() });
    }
  };
  walk(root);
  return out;
}

// Run one app's whole vector set. `onEvent(ev)` streams live updates. Returns
// when done (or stopped). Registers/unregisters the lock around it.
async function runApp(appId, onEvent, opts = {}) {
  const app = APPS[appId];
  if (!app) throw new Error('Unknown app: ' + appId);
  if (lock.held) throw new Error('LOCKED'); // server rejects a concurrent start
  lock = { held: true, app: appId, startedAt: Date.now() };
  active = { stopped: false };

  let vectors = loadVectors(appId);
  if (Array.isArray(opts.only) && opts.only.length) {
    const set = new Set(opts.only);
    vectors = vectors.filter((v) => set.has(v.id));
  }
  onEvent({ type: 'start', app: appId, count: vectors.length });

  let arena = null, target = null, cdp = null;
  const results = [];
  try {
    const needsTarget = app.kind === 'electron';
    if (needsTarget) {
      arena = makeArena(appId);
      onEvent({ type: 'note', text: `arena: ${arena.root}` });
      if (typeof app.targetSetup === 'function') app.targetSetup(arena);
      target = launchTarget({ appDir: app.appDir(), arena });
      const page = await waitForPage(target.port);
      cdp = cdpConnect(page.webSocketDebuggerUrl);
      await cdp.ready;
      await cdp.send('Runtime.enable');
      // Give the renderer a moment to finish init (preload bindings ready).
      await new Promise((r) => setTimeout(r, 1200));
    }
    const ctx = needsTarget ? makeContext(app, arena, target, cdp) : { app, grep: grepInFiles, arena: null };

    for (let i = 0; i < vectors.length; i++) {
      const v = vectors[i];
      if (active.stopped) { onEvent({ type: 'stopped' }); break; }
      onEvent({ type: 'vector-start', index: i, id: v.id });
      const base = { id: v.id, name: v.name, description: v.description, does: v.does, resists: v.resists, static: !!v.static };
      try {
        const before = arena ? canaryFingerprint(arena) : null;
        const out = await v.run(ctx);
        // Let a vector declare an escape by canary difference even if it didn't
        // set a status (belt and braces).
        let status = out && out.status;
        let evidence = out && out.evidence;
        if (arena && out && out.checkCanaries !== false) {
          const touched = canaryTouched(before, canaryFingerprint(arena));
          if (touched && status !== 'vulnerable') {
            status = 'vulnerable';
            evidence = (evidence ? evidence + ' | ' : '') + 'canary changed: ' + touched;
          }
        }
        const row = { ...base, ...(out || {}), status: status || 'error' };
        if (!status && !evidence) row.evidence = 'vector returned no status';
        results.push(row);
        onEvent({ type: 'vector-done', index: i, id: v.id, result: row });
      } catch (err) {
        const row = { ...base, status: 'error', evidence: String((err && err.message) || err) };
        results.push(row);
        onEvent({ type: 'vector-done', index: i, id: v.id, result: row });
      }
    }
  } finally {
    if (cdp) cdp.close();
    if (target) { killTarget(target); await new Promise((r) => setTimeout(r, 400)); }
    if (arena) rmArena(arena);
    active = null;
    lock = { held: false, app: null, startedAt: 0 };
    onEvent({ type: 'end', app: appId, results });
  }
  return results;
}

module.exports = { runApp, lockHeldBy, requestStop, grepInFiles };
