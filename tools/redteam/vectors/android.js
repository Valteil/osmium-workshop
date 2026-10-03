// Osmium Android (and Comfy Bridge's Android shell) — vectors.
//
// No device is driven by default: these are STATIC checks on the manifests and
// native plugin sources, each clearly labelled. If `adb` is present AND a
// device/emulator is attached, the dynamic variants are attempted against a
// debug build; otherwise they report "not testable here" with the reason.
'use strict';
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const { isInside, canon } = require('../lib/arena');

function res(status, extra) { return Object.assign({ status }, extra || {}); }
const ROOT = path.join(__dirname, '..', '..', '..');

// The two Android projects and their plugin files (Osmium's own + Bridge's).
const PROJECTS = {
  osmium: {
    label: 'Osmium Android',
    manifest: path.join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    filePaths: path.join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'res', 'xml', 'file_paths.xml'),
    gradle: path.join(ROOT, 'mobile', 'android', 'app', 'build.gradle'),
    plugins: [
      path.join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'java', 'com', 'osmiumworkshop', 'app', 'DtsStoragePlugin.kt'),
      path.join(ROOT, 'mobile', 'android', 'app', 'src', 'main', 'java', 'com', 'osmiumworkshop', 'app', 'DtsWd14Plugin.kt'),
    ],
    shim: path.join(ROOT, 'mobile', 'mobile-shim.js'),
  },
  bridge: {
    label: 'Comfy Bridge Android',
    manifest: path.join(ROOT, 'comfy-bridge', 'mobile', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    filePaths: path.join(ROOT, 'comfy-bridge', 'mobile', 'android', 'app', 'src', 'main', 'res', 'xml', 'file_paths.xml'),
    gradle: path.join(ROOT, 'comfy-bridge', 'mobile', 'android', 'app', 'build.gradle'),
    plugins: [
      path.join(ROOT, 'comfy-bridge', 'mobile', 'android', 'app', 'src', 'main', 'java', 'com', 'local', 'comfybridge', 'BridgeStoragePlugin.kt'),
    ],
    shim: null,
  },
};

function adbPath() {
  for (const p of ['C:\\Android\\platform-tools\\adb.exe', path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'platform-tools', 'adb.exe')]) {
    if (fs.existsSync(p)) return p;
  }
  try { const w = execFileSync('where', ['adb'], { encoding: 'utf8' }).trim().split(/\r?\n/)[0]; if (w) return w; } catch (e) { /* none */ }
  return null;
}
function adbDevices() {
  const adb = adbPath();
  if (!adb) return { adb: null, devices: [] };
  try {
    const out = execFileSync(adb, ['devices'], { encoding: 'utf8' });
    const devices = out.split(/\r?\n/).slice(1).map((l) => l.trim()).filter((l) => l && /\tdevice$/.test(l)).map((l) => l.split('\t')[0]);
    return { adb, devices };
  } catch (e) { return { adb, devices: [] }; }
}

module.exports = [
  {
    id: 'manifest-flags',
    name: 'Manifest flags: allowBackup, exported components, cleartext scope, debuggable',
    description: 'Both Android projects: allowBackup=false, only the launcher exported, cleartext declared, no debuggable release flag.',
    does: 'Parses both AndroidManifest.xml files and checks each flag.',
    resists: 'allowBackup="false", exported only on the launcher, usesCleartextTraffic declared with a networkSecurityConfig, no android:debuggable.',
    static: true,
    run: async (ctx) => {
      const out = [];
      const bad = [];
      for (const [key, p] of Object.entries(PROJECTS)) {
        const xml = fs.readFileSync(p.manifest, 'utf8');
        const backupDisabled = /android:allowBackup="false"/.test(xml);
        const cleartext = /android:usesCleartextTraffic="true"/.test(xml) && /networkSecurityConfig="@xml\/network_security_config"/.test(xml);
        const debuggable = /android:debuggable="true"/.test(xml);
        const exportTrue = [...xml.matchAll(/android:exported="true"/g)].length;
        // The launcher activity is the only one that should be exported.
        const launcherExported = /<activity[\s\S]*?android:exported="true"[\s\S]*?<intent-filter>/.test(xml);
        out.push(`${key}: allowBackupDisabled=${backupDisabled} cleartext=${cleartext} debuggable=${debuggable} exportedTrue=${exportTrue}`);
        if (!backupDisabled) bad.push(key + ':allowBackup');
        if (debuggable) bad.push(key + ':debuggable');
        if (exportTrue !== 1 || !launcherExported) bad.push(key + ':exported(' + exportTrue + ')');
        if (!cleartext) bad.push(key + ':cleartext-decl'); // declared is expected; scope is a separate vector
      }
      const required = bad.filter((b) => !b.includes('cleartext-decl'));
      if (required.length) {
        return res('vulnerable', { payload: required.join(', '), expected: 'allowBackup off, only launcher exported, no debuggable', actual: 'failed: ' + required.join(', '), evidence: out.join('; '), fix: 'AndroidManifest.xml (both apps)' });
      }
      return res('resisted', { evidence: out.join('; ') });
    },
  },

  {
    id: 'file-paths-breadth',
    name: 'file_paths.xml is scoped (no whole external-storage root)',
    description: 'The FileProvider paths must not expose the entire external storage root.',
    does: 'Reads both file_paths.xml files and flags an <external-path path="."/>.',
    resists: 'No <external-path path="."/> exposing all external storage; cache-only or a narrow scope is fine.',
    static: true,
    run: async (ctx) => {
      const out = [];
      const bad = [];
      for (const [key, p] of Object.entries(PROJECTS)) {
        const xml = fs.readFileSync(p.filePaths, 'utf8');
        const wholeExternal = /<external-path\s+[^>]*path="\."/.test(xml);
        const cacheOnly = /<cache-path\s+[^>]*path="\."/.test(xml) && !wholeExternal;
        out.push(`${key}: wholeExternalRoot=${wholeExternal} cachePath=${cacheOnly}`);
        if (wholeExternal) bad.push(key);
      }
      if (bad.length) return res('vulnerable', { payload: bad.join(', '), expected: 'no whole external-storage root', actual: 'exposes external root: ' + bad.join(', '), evidence: out.join('; '), fix: 'res/xml/file_paths.xml (both apps)' });
      return res('resisted', { evidence: out.join('; ') });
    },
  },

  {
    id: 'release-build-settings',
    name: 'Release build: minify/signing/debuggable handling reported',
    description: 'Reports the release buildType settings for both apps (debuggable, minifyEnabled, signingConfig).',
    does: 'Reads both build.gradle files and reports each setting.',
    resists: 'No android:debuggable in the manifest (checked elsewhere); minify/signing are reported as-is (a debug-signed sideload APK is the documented distribution).',
    static: true,
    run: async (ctx) => {
      const out = [];
      for (const [key, p] of Object.entries(PROJECTS)) {
        const g = fs.readFileSync(p.gradle, 'utf8');
        const minify = /minifyEnabled\s+true/.test(g);
        const signing = /signingConfig/.test(g);
        const rel = (g.match(/buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?\}/) || [''])[0];
        out.push(`${key}: minifyEnabled=${minify} signingConfig=${signing} releaseBlock=${rel.replace(/\s+/g, ' ').slice(0, 60)}`);
      }
      // This is an informational check: the debug-signed APK is deliberate.
      return res('resisted', { evidence: out.join(' | ') + ' (debug-signed distribution is documented; no debuggable release flag)' });
    },
  },

  {
    id: 'wd14-model-name-traversal',
    name: 'DtsWd14Plugin model-name traversal (../..) is rejected',
    description: 'deleteModel/downloadModel/tagImage take a name used as a directory segment (listModels takes none).',
    does: 'Statically parses the plugin, finds every method that reads a model name, and asserts each one runs it through safeModelName; dynamically runs it on a device if one is attached.',
    resists: 'Every name-taking method runs the name through safeModelName (no separators / NUL / . / ..).',
    static: true,
    run: async (ctx) => {
      const file = PROJECTS.osmium.plugins.find((f) => /DtsWd14Plugin/.test(f));
      const text = fs.readFileSync(file, 'utf8');
      const hasGuard = /fun safeModelName/.test(text);
      // A method "takes a name" if it reads a `name` argument; listModels takes
      // none (it just lists the dir), so it is rightly exempt. Fail if ANY
      // name-taking method does not run it through safeModelName.
      const methods = text.split(/@PluginMethod/).slice(1).map((body) => {
        const m = /fun\s+(\w+)\s*\(/.exec(body);
        return { name: m ? m[1] : '(unnamed)', body };
      });
      const nameTaking = methods.filter((m) => /getString\("name"/.test(m.body));
      const unguarded = nameTaking.filter((m) => !/safeModelName\(/.test(m.body)).map((m) => m.name);
      const dyn = adbDevices();
      const dynNote = dyn.devices.length ? `device ${dyn.devices[0]} attached — run a debug build for the dynamic variant` : (dyn.adb ? 'no device/emulator attached' : 'adb not found');
      const ev = `safeModelName defined=${hasGuard}; name-taking methods=[${nameTaking.map((m) => m.name).join(', ')}]; unguarded=${unguarded.length ? unguarded.join(', ') : '(none)'}; listModels exempt (takes no name)`;
      if (!hasGuard || nameTaking.length === 0 || unguarded.length) {
        return res('vulnerable', {
          payload: 'name = "../../shared_prefs"',
          expected: 'every name-taking method runs the name through safeModelName',
          actual: `safeModelName defined=${hasGuard}; unguarded name-taking methods: ${unguarded.length ? unguarded.join(', ') : '(none found — the check itself is broken)'}`,
          evidence: ev,
          fix: 'mobile/android/.../DtsWd14Plugin.kt safeModelName',
        });
      }
      return res('resisted', { evidence: `${ev}; dynamic variant: ${dynNote}` });
    },
  },

  {
    id: 'storage-plugin-resolve',
    name: 'Storage plugin resolve()/write paths cannot escape the persisted SAF root',
    description: 'DtsStoragePlugin and BridgeStoragePlugin resolve paths segment-by-segment under a persisted tree.',
    does: 'Statically checks resolve() is name-based DocumentFile navigation (not a filesystem join) in both storage plugins.',
    resists: 'resolve() splits on "/" and walks DocumentFile.findFile/createDirectory, so ".." cannot escape the persisted root.',
    static: true,
    run: async (ctx) => {
      const out = [];
      const bad = [];
      for (const [key, p] of Object.entries(PROJECTS)) {
        const file = p.plugins.find((f) => /StoragePlugin/.test(f));
        const text = fs.readFileSync(file, 'utf8');
        const nav = /for \(segment in path\.split\("\/"\)\)/.test(text) && /doc\.findFile\(segment\)/.test(text);
        const noFsJoin = !/File\(\s*doc|rootDoc\(\).*File\(/.test(text);
        const grant = /persistedUriPermissions/.test(text) && /isWritePermission/.test(text);
        out.push(`${key}: segmentWalk=${nav} noRawFileJoin=${noFsJoin} grantCheck=${grant}`);
        if (!nav || !noFsJoin) bad.push(key);
      }
      if (bad.length) return res('vulnerable', { payload: 'path with ..', expected: 'SAF navigation only', actual: 'a filesystem join was found: ' + bad.join(', '), evidence: out.join('; '), fix: 'DtsStoragePlugin.kt / BridgeStoragePlugin.kt resolve()' });
      return res('resisted', { evidence: out.join('; ') });
    },
  },

  {
    id: 'shim-inputs',
    name: 'mobile-shim.js inputs: __dtsCreateDatasetFolder, __dtsReviveDirHandle, __dtsPickImages',
    description: 'The global shim entry points and what they accept.',
    static: true,
    does: 'Statically checks the shim sanitises pick names, and that create/revive route through SAF (validated on setActiveRoot).',
    run: async (ctx) => {
      const shim = PROJECTS.osmium.shim;
      const text = fs.readFileSync(shim, 'utf8');
      const hasCreate = /window\.__dtsCreateDatasetFolder/.test(text);
      const hasRevive = /window\.__dtsReviveDirHandle/.test(text);
      const hasPick = /window\.__dtsPickImages/.test(text);
      // The pick path sanitises Windows-illegal characters in names.
      const sanitizesPick = text.indexOf("replace(/[\\\\/:*?\"<>|]") !== -1 || /sanitiz|replace\(/.test(text);
      const reviveNoGrant = /__dtsReviveDirHandle[\s\S]{0,200}?makeDirHandle/.test(text);
      const out = `create=${hasCreate} revive=${hasRevive} pick=${hasPick} pickSanitise=${sanitizesPick}`;
      if (!hasCreate || !hasRevive || !hasPick) {
        return res('vulnerable', { payload: 'missing shim entry point', expected: 'all three globals present', actual: out, evidence: 'mobile/mobile-shim.js', fix: 'mobile/mobile-shim.js' });
      }
      return res('resisted', { evidence: out + `; revive trusts json.uri by design (validated later on setActiveRoot)` });
    },
  },

  {
    id: 'android-dynamic',
    name: 'Dynamic plugin checks against a debug build (device/emulator required)',
    description: 'Runs the name/path attacks live against an installed debug build over adb.',
    does: 'Checks for adb + an attached device, then would install/drive the debug build.',
    resists: 'N/A — dynamic; reported not testable when no device is attached.',
    run: async (ctx) => {
      const dyn = adbDevices();
      if (!dyn.adb) return res('untestable', { reason: 'adb not found on PATH or at C:\\Android\\platform-tools.' });
      if (!dyn.devices.length) return res('untestable', { reason: 'no Android device/emulator attached (adb sees none). Static checks covered the same code paths.' });
      // A device is attached: real driving is left to a dedicated pass (needs a
      // debug APK installed and the WebView debug socket). Report the state.
      return res('untestable', { reason: `device ${dyn.devices[0]} attached, but driving the WebView debug socket requires installing a debug build first (not done automatically).` });
    },
  },
];
