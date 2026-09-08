#!/usr/bin/env node
// Copies a fresh `electron-builder --dir` build (dist/win-unpacked, which
// gets fully wiped and regenerated on every rebuild) into portable-dev/ —
// our long-lived dev instance — WITHOUT touching its `data/` or
// `DROP_UPDATES_HERE` folders. That's what lets portable-dev/ behave like a
// real installed app: rebuilding the app code (main.js/preload.js changes)
// never wipes its accumulated settings/themes/achievements or a pending
// drop. Run via `npm run refresh-app` (which builds first, then this).
//
// For renderer-only changes, you don't need this at all — use
// `npm run push-update` instead, exactly like a real end-user update.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'dist', 'win-unpacked');
const PERSISTENT_DIR = path.join(PROJECT_ROOT, 'portable-dev');
const PRESERVE = new Set(['data', 'DROP_UPDATES_HERE']);

function copyDirSyncFiltered(src, dest, skip) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (skip && skip.has(entry.name)) continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(destPath, { recursive: true, force: true });
      copyDirSyncFiltered(srcPath, destPath, null);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  if (!fs.existsSync(BUILD_DIR)) {
    console.error(`[refresh] ${BUILD_DIR} not found — run "npm run dist:dir" first (or just use "npm run refresh-app", which does both).`);
    process.exitCode = 1;
    return;
  }
  const firstTime = !fs.existsSync(PERSISTENT_DIR);
  copyDirSyncFiltered(BUILD_DIR, PERSISTENT_DIR, PRESERVE);
  console.log(`[refresh] App code refreshed at ${PERSISTENT_DIR}${firstTime ? ' (first-time setup)' : ' — its data/ and DROP_UPDATES_HERE were left untouched'}.`);
  if (firstTime) {
    console.log('[refresh] Launch it once to seed data/, then use run-portable-dev.bat from now on.');
  } else {
    console.log('[refresh] Fully quit and relaunch it to pick up the new app code (main-process code can\'t hot-reload).');
  }
}

main();
