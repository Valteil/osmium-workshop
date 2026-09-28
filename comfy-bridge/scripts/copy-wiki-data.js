// Copies Osmium Workshop's bundled Danbooru data (../renderer/data:
// wiki.json.gzdat definitions + all_tags.json.gzdat vocabulary) into this
// app's desktop renderer/data and mobile www/data, for the Tag wiki window
// (src/renderer/shared/tag-wiki.ts). One source of truth: the copies are
// gitignored and rebuilt by `npm run build:renderer`. Skips a file that's
// already identical in size and age, so repeat builds don't rewrite ~26 MB.
// (.gzdat, not .gz: Android's asset merge would unpack a .gz.)
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'renderer', 'data');
const dests = [
  path.join(__dirname, '..', 'renderer', 'data'),
  path.join(__dirname, '..', 'mobile', 'www', 'data'),
];
for (const dest of dests) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of ['wiki.json.gzdat', 'all_tags.json.gzdat']) {
    const from = path.join(src, name), to = path.join(dest, name);
    const a = fs.statSync(from);
    const b = fs.existsSync(to) ? fs.statSync(to) : null;
    if (b && b.size === a.size && b.mtimeMs >= a.mtimeMs) continue;
    fs.copyFileSync(from, to);
    console.log(`wiki data: ${name} -> ${dest}`);
  }
}
