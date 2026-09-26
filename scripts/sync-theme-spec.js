// Copies the canonical src/renderer/theme-spec.ts (Theme Studio's model) into
// Comfy Bridge, so both apps build, validate and export themes identically and
// a theme file made in one imports into the other. Same reason as
// sync-comfy-core.js: the bridge is its own project and can't import across
// the repo root.
//
// Run after editing src/renderer/theme-spec.ts:  node scripts/sync-theme-spec.js
// Edit the ROOT file, never the synced copy.
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'renderer', 'theme-spec.ts');
const dest = path.join(__dirname, '..', 'comfy-bridge', 'src', 'renderer', 'theme-spec.ts');
const banner =
  '// GENERATED FILE — do not edit. Synced from ../../../src/renderer/theme-spec.ts\n' +
  '// by scripts/sync-theme-spec.js. Edit the root file and re-run the sync.\n\n';
fs.writeFileSync(dest, banner + fs.readFileSync(src, 'utf8'));
console.log('Synced src/renderer/theme-spec.ts -> comfy-bridge/src/renderer/theme-spec.ts');
