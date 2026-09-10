#!/usr/bin/env node
// Copies a fresh `electron-builder --dir` build (dist/win-unpacked, which
// gets fully wiped and regenerated on every rebuild) into the project root
// itself — our long-lived dev instance lives right alongside the source —
// WITHOUT touching its `data/` folder or anything else at the root that
// isn't part of the electron-builder output (src/, node_modules/,
// package.json, docs, etc.). That's what lets the root build behave like a
// real installed app: rebuilding the app code (main.js/preload.js changes)
// never wipes its accumulated settings/themes/achievements. Run via
// `npm run refresh-app` (which builds first, then this).
//
// data/tool/ is the one exception: main.js only ever seeds it from the
// bundled renderer/ on first run and otherwise leaves it alone. For OUR OWN
// dev instance that protection just means renderer edits go stale silently,
// which is worse — so this script deletes data/tool/ specifically (not the
// rest of data/, which still holds localStorage/achievements/etc.) to force
// a clean reseed from the fresh build on next launch. Renderer changes are
// always current after `npm run refresh-app`, no separate step needed.

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const BUILD_DIR = path.join(PROJECT_ROOT, 'dist', 'win-unpacked');
const PERSISTENT_DIR = PROJECT_ROOT;
const PRESERVE = new Set(['data']);

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
  const exePath = path.join(PERSISTENT_DIR, 'Dataset Tag Studio.exe');
  const firstTime = !fs.existsSync(exePath);
  copyDirSyncFiltered(BUILD_DIR, PERSISTENT_DIR, PRESERVE);

  const toolDir = path.join(PERSISTENT_DIR, 'data', 'tool');
  const rezeeded = fs.existsSync(toolDir);
  if (rezeeded) fs.rmSync(toolDir, { recursive: true, force: true });

  console.log(`[refresh] App code refreshed at ${PERSISTENT_DIR}${firstTime ? ' (first-time setup)' : ''}.`);
  if (rezeeded) console.log('[refresh] data/tool/ cleared so it reseeds fresh with the latest renderer/ on next launch (rest of data/ — settings, achievements — kept).');
  if (firstTime) {
    console.log('[refresh] Launch it once to seed data/, then use run-portable-dev.bat from now on.');
  } else {
    console.log('[refresh] Fully quit and relaunch it to pick up the new app code (main-process code can\'t hot-reload).');
  }
}

main();
