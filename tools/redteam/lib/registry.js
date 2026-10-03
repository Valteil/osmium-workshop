// Red Team harness — vector registry.
//
// A vector describes ONE attack: what it does, what resisting looks like, and
// how to run it. The runner turns the result into one of:
//   'resisted'     this specific attack failed (the app's defence held)
//   'vulnerable'   the attack succeeded (payload/expected/actual/evidence/fix)
//   'error'        the harness itself failed (a bug in the harness, not the app)
//   'untestable'   cannot be exercised in this environment (with a reason)
//
// "resisted" means exactly this attack failed — never "this app is secure".
// See notes/Meta/Red-Team-Harness.md.
'use strict';

// App ids and their human labels + the target project folder.
const path = require('path');
// A test hook (used only to prove the harness can fail — see the verify pass):
// REDTEAM_<APP>_DIR points a target at a mutated COPY of an app instead of the
// real source. Never set in normal use.
function appDirOverride(id, fallback) {
  const env = process.env['REDTEAM_' + id.toUpperCase() + '_DIR'];
  return env ? () => path.resolve(env) : fallback;
}
const APPS = {
  desktop: {
    id: 'desktop', label: 'Osmium Desktop', kind: 'electron',
    appDir: appDirOverride('desktop', () => path.join(__dirname, '..', '..', '..')),
    // A fake Anima-TrainFlow install in the throwaway userData, so the
    // tampered-run-record vector exercises runDirsValid's real path check
    // (resolveInstall needs the train script + its Python; without them the
    // record is refused for "no install", which proves nothing about the dir
    // guard). outputBase is <install>/training/output; the forged run record
    // points outside it.
    targetSetup: (arena) => {
      const fs = require('fs');
      const pathm = require('path');
      const install = pathm.join(arena.root, 'fake-install');
      const scripts = pathm.join(install, 'training', 'sd-scripts');
      fs.mkdirSync(scripts, { recursive: true });
      fs.writeFileSync(pathm.join(scripts, 'anima_train_network.py'), '# redteam fake trainer');
      fs.mkdirSync(pathm.join(install, 'python_embeded'), { recursive: true });
      fs.writeFileSync(pathm.join(install, 'python_embeded', 'python.exe'), 'fake');
      fs.writeFileSync(pathm.join(arena.userdata, 'trainflow.json'), JSON.stringify({ folder: install }));
    },
  },
  bridge: {
    id: 'bridge', label: 'Comfy Bridge (desktop + Android shell)', kind: 'electron',
    appDir: appDirOverride('bridge', () => path.join(__dirname, '..', '..', '..', 'comfy-bridge')),
    // Bridge reads its picked output folder from userData at startup (the
    // native picker is the only other way to set it). Seed it into the
    // throwaway userData so save/gallery vectors exercise the real path with a
    // known allowed folder.
    targetSetup: (arena) => {
      require('fs').writeFileSync(require('path').join(arena.userdata, 'comfy-bridge-output-folder.txt'), arena.output);
    },
  },
  android: { id: 'android', label: 'Osmium Android (+ Bridge Android shell)', kind: 'static' },
};

// Vector sets are loaded from ./vectors/<app>.js so each app's pass is one file.
function loadVectors(appId) {
  const file = require('path').join(__dirname, '..', 'vectors', appId + '.js');
  if (!require('fs').existsSync(file)) return [];
  return require(file);
}

module.exports = { APPS, loadVectors };
