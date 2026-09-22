// Copies the canonical src/comfy-core.ts into Comfy Bridge. The bridge is a
// separate Electron project (its own rootDir/package.json), so it can't import
// across the repo root — this sync keeps its copy identical instead.
//
// Run after editing src/comfy-core.ts:  node scripts/sync-comfy-core.js
// Edit the ROOT file, never the synced copy.
const fs = require('fs');
const path = require('path');

const rootSrc = path.join(__dirname, '..', 'src');
const bridgeSrc = path.join(__dirname, '..', 'comfy-bridge', 'src');
const banner =
  '// GENERATED FILE — do not edit. Synced from ../../src/%NAME% by\n' +
  '// scripts/sync-comfy-core.js. Edit the root file and re-run the sync.\n\n';

// comfy-core.ts imports the shared domain types (type-only); both must travel
// together so the bridge copy's import resolves.
for (const file of ['comfy-core.ts', 'shared-types.d.ts']) {
  const body = fs.readFileSync(path.join(rootSrc, file), 'utf8');
  fs.writeFileSync(path.join(bridgeSrc, file), banner.replace('%NAME%', file) + body);
  console.log(`Synced src/${file} -> comfy-bridge/src/${file}`);
}
