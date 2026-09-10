// electron-builder afterPack hook: strips Chromium's bundled locale files
// down to just English. The app has no UI translations of its own, so the
// other ~55 languages' .pak files (~40MB total) are pure dead weight in
// every build. Scoped to win/linux, where they sit flat in a `locales/`
// folder next to the exe — not touched on mac, whose locale layout differs
// and isn't covered by our current build/test setup.

const fs = require('fs');
const path = require('path');

const KEEP_LOCALES = new Set(['en-US.pak']);

exports.default = async function (context) {
  const localesDir = path.join(context.appOutDir, 'locales');
  if (!fs.existsSync(localesDir)) return;

  let removed = 0;
  let savedBytes = 0;
  for (const file of fs.readdirSync(localesDir)) {
    if (file.endsWith('.pak') && !KEEP_LOCALES.has(file)) {
      const filePath = path.join(localesDir, file);
      savedBytes += fs.statSync(filePath).size;
      fs.unlinkSync(filePath);
      removed++;
    }
  }
  console.log(`[after-pack] Removed ${removed} unused locale file(s), saving ${(savedBytes / 1024 / 1024).toFixed(1)}MB.`);
};
