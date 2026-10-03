// Red Team harness — the attack primitives.
//
// Safety model (hard requirements, see notes/Meta/Red-Team-Harness.md):
//  - A "target" is a THROWAWAY instance of an app, launched by this tool with
//    its own temp --user-data-dir and a debug port on 127.0.0.1 only. We never
//    attach to the user's running app or touch their real userData.
//  - All test data lives in a temp "arena": the app's allowed folders (dataset,
//    output) plus canary files/dirs OUTSIDE them. An attack that reads, writes
//    or deletes a canary proves an escape; nothing outside the arena is touched.
//  - The attacker's position is a compromised renderer: we evaluate code in the
//    app's own renderer over the DevTools protocol, calling window.electronAPI.*
//    with hostile arguments. This exercises the real preload + main handlers.
//
// No dependencies: plain Node + the app's own bundled Electron.
'use strict';
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

// ---- arena -----------------------------------------------------------------
// One temp root per run, wiped when the run ends. Layout:
//   <root>/userdata            the throwaway --user-data-dir
//   <root>/dataset             the "allowed" dataset folder
//   <root>/output              the "allowed" output folder
//   <root>/outside/canary-file a canary file the attacks must not read/write/delete
//   <root>/outside/canary-dir/ a canary folder, likewise
//   <root>/outside/link-target a NON-canary dir the junction points at, so the
//                              junction test can write markers without changing
//                              a canary (a canary change must mean the APP
//                              escaped, never the harness's own setup)
//   <root>/outside/target-link a symlink/junction pointing at link-target
function makeArena(prefix) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `osmium-redteam-${prefix}-`));
  const dirs = {
    root,
    userdata: path.join(root, 'userdata'),
    dataset: path.join(root, 'dataset'),
    output: path.join(root, 'output'),
    outside: path.join(root, 'outside'),
    canaryFile: path.join(root, 'outside', 'canary-file.txt'),
    canaryDir: path.join(root, 'outside', 'canary-dir'),
    canaryInDir: path.join(root, 'outside', 'canary-dir', 'inside.txt'),
    linkTarget: path.join(root, 'outside', 'link-target'),
    link: path.join(root, 'outside', 'target-link'),
    evidence: path.join(root, 'evidence'),
  };
  for (const d of [dirs.userdata, dirs.dataset, dirs.output, dirs.canaryDir, dirs.linkTarget, dirs.evidence]) fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(dirs.canaryFile, 'REDTEAM-CANARY-FILE');
  fs.writeFileSync(dirs.canaryInDir, 'REDTEAM-CANARY-DIR');
  fs.writeFileSync(path.join(dirs.dataset, 'img1.txt'), 'redteam test tag');
  // A minimal 1x1 PNG so dataset/probe code that expects an image has one.
  fs.writeFileSync(path.join(dirs.dataset, 'img1.png'), Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC', 'base64'));
  try {
    fs.symlinkSync(dirs.linkTarget, dirs.link, 'junction'); // junction works without admin on Windows
  } catch (e) { /* best effort: some filesystems refuse; the vector reports "not testable" then */ }
  return dirs;
}

function canon(p) { try { return fs.realpathSync.native(p); } catch { return path.resolve(p); } }
function isInside(child, parent) {
  const c = canon(child), p = canon(parent);
  return c === p || c.toLowerCase().startsWith(p.toLowerCase() + path.sep);
}
// A canary changed => an escape happened. `before` is a fingerprint snapshot.
function canaryFingerprint(arena) {
  const fp = {};
  const add = (p, kind) => { try { const st = fs.statSync(p); fp[p] = kind + ':' + st.size + ':' + st.mtimeMs; } catch { fp[p] = kind + ':absent'; } };
  add(arena.canaryFile, 'file'); add(arena.canaryInDir, 'file'); add(arena.canaryDir, 'dir');
  return fp;
}
function canaryTouched(before, after) {
  for (const k of Object.keys(before)) if (before[k] !== after[k]) return k;
  return null;
}
function rmArena(arena) { try { fs.rmSync(arena.root, { recursive: true, force: true }); } catch { /* best effort */ } }

// ---- target (throwaway Electron instance) ----------------------------------
// Launch the app under test. `appDir` is the folder containing the app's
// main.js; `extraArgs` lets a vector pass a temp data path on. The debug port
// is loopback-only and unique per target.
let nextPort = 9400 + Math.floor(Math.random() * 200);
function launchTarget({ appDir, arena, extraArgs = [], env = {} }) {
  const electronBin = require(path.join(appDir, 'node_modules', 'electron')); // exports the exe path
  const port = nextPort++;
  const args = [
    '.',
    `--user-data-dir=${arena.userdata}`,
    `--remote-debugging-port=${port}`,
    '--remote-allow-origins=http://127.0.0.1:' + port,
    ...extraArgs,
  ];
  const child = spawn(electronBin, args, {
    cwd: appDir,
    // Point the target's own notion of "home" at the throwaway arena. No
    // production code is aware of this (unlike a bespoke env hook): Trainflow's
    // marker probe reads os.homedir() (USERPROFILE on Windows), so the arena
    // becomes a probe root and the positive "marker found" and junction cases
    // run against a fake home — never the user's real profile. The temp
    // --user-data-dir above already isolates Chromium's own state.
    env: { ...process.env, USERPROFILE: arena.root, HOME: arena.root, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  const logs = [];
  child.stdout.on('data', (d) => logs.push(String(d)));
  child.stderr.on('data', (d) => logs.push(String(d)));
  return { child, port, logs, appDir };
}

function killTarget(target) {
  if (!target || !target.child) return;
  try { target.child.kill(); } catch (e) { /* gone */ }
  // Electron spawns helper processes; on Windows kill the tree by PID only
  // (never by image name — a user instance may be running).
  if (process.platform === 'win32' && target.child.pid) {
    try { execFileSync('taskkill', ['/PID', String(target.child.pid), '/T', '/F'], { stdio: 'ignore' }); }
    catch (e) { /* already exited */ }
  }
}

// Wait for the CDP HTTP endpoint to answer and return the first page target.
function waitForPage(port, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get({ host: '127.0.0.1', port, path: '/json/list' }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const list = JSON.parse(body);
            const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
            if (page) return resolve(page);
          } catch (e) { /* keep waiting */ }
          retry();
        });
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() > deadline) return reject(new Error('Target renderer did not come up (CDP timeout).'));
      setTimeout(tick, 300);
    };
    tick();
  });
}

// Minimal CDP client over the WebSocket. The repo's own `ws` (a dependency of
// the apps) is reused so the harness adds no dependency of its own. Root is
// tools/redteam/lib -> ../../.. ; comfy-bridge carries its own copy too.
function requireWs() {
  const path = require('path');
  const root = path.join(__dirname, '..', '..', '..');
  for (const base of [root, path.join(root, 'comfy-bridge')]) {
    try { return require(path.join(base, 'node_modules', 'ws')); } catch (e) { /* try next */ }
  }
  throw new Error('The harness needs the `ws` package (bundled with the app deps). Run `npm install` at the repo root.');
}

function cdpConnect(wsUrl) {
  const WS = requireWs();
  const ws = new WS(wsUrl, { perMessageDeflate: false });
  let id = 0;
  const pending = new Map();
  ws.on('message', (data) => {
    let msg; try { msg = JSON.parse(String(data)); } catch { return; }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message)); else resolve(msg.result);
    }
  });
  const ready = new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
  return {
    ready,
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const mid = ++id;
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    },
    close() { try { ws.close(); } catch (e) { /* gone */ } },
  };
}

// Evaluate an expression in the target renderer and return its JSON value.
// Wraps in an async IIFE so vectors can await electronAPI calls. A thrown
// error is returned as { __error } rather than rejecting, so a vector can
// distinguish "the app refused" (resisted) from "the harness broke".
async function evaluate(cdp, expression) {
  const wrapped = `(async () => { try { return { __ok: true, value: await (${expression}) }; }
    catch (e) { return { __ok: false, error: String(e && e.message || e) }; } })()`;
  const res = await cdp.send('Runtime.evaluate', {
    expression: wrapped,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (res.exceptionDetails) return { __ok: false, error: res.exceptionDetails.text || 'evaluation exception' };
  return res.result && res.result.value;
}

module.exports = {
  makeArena, canaryFingerprint, canaryTouched, isInside, canon, rmArena,
  launchTarget, killTarget, waitForPage, cdpConnect, evaluate,
};
