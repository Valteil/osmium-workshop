// Copies the canonical SynthDat workflow template (renderer/data/
// synthdat-workflow.json) into the separate projects that each ship their own
// copy: Comfy Bridge desktop + mobile, the docs/demo build, and the generated
// Capacitor Android asset. Each is its own app with its own renderer/data/, so
// none can import across the repo root — this keeps the template identical
// instead of letting the copies drift (they had: the Android asset was stale).
//
// Run after editing renderer/data/synthdat-workflow.json:
//   node scripts/sync-synthdat-workflow.js
// Edit the ROOT file, never the synced copies.
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const src = path.join(repoRoot, 'renderer', 'data', 'synthdat-workflow.json');

const targets = [
  path.join(repoRoot, 'comfy-bridge', 'renderer', 'data', 'synthdat-workflow.json'),
  path.join(repoRoot, 'comfy-bridge', 'mobile', 'www', 'data', 'synthdat-workflow.json'),
  path.join(repoRoot, 'docs', 'demo', 'data', 'synthdat-workflow.json'),
  // Generated Capacitor asset (gitignored; normally refreshed by `npx cap
  // sync`) — synced too so the Android build can't ship a stale template.
  path.join(repoRoot, 'comfy-bridge', 'mobile', 'android', 'app', 'src', 'main', 'assets', 'public', 'data', 'synthdat-workflow.json')
];

if (!fs.existsSync(src)) {
  console.error('Canonical template not found at ' + src + '.');
  process.exit(1);
}
const body = fs.readFileSync(src);

for (const dest of targets) {
  if (!fs.existsSync(path.dirname(dest))) {
    console.log('Skipped (no such dir): ' + path.relative(repoRoot, path.dirname(dest)));
    continue;
  }
  fs.writeFileSync(dest, body);
  console.log('Synced -> ' + path.relative(repoRoot, dest));
}
