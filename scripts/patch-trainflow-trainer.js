#!/usr/bin/env node
// Applies Osmium's edits to the bundled Anima-TrainFlow trainer (sd-scripts).
//
// Why a script instead of just editing the files: `Anima-TrainFlow/` is
// gitignored (a ~5.4 GB copy of the upstream install, see
// notes/Features/Trainflow.md), so a hand edit to it is invisible to git and is
// silently lost the next time the copy is refreshed or sd-scripts is updated.
// This is the tracked record of every edit; `npm run refresh-app` runs it
// before packaging, and `npm run patch-trainer` runs it on demand (also after
// replacing training/sd-scripts with a newer upstream release).
//
// Each patch is idempotent and knows when upstream already does the same thing
// (then it's skipped). If its anchor text is gone — upstream rewrote that code —
// it fails loudly rather than shipping a trainer without the behaviour.
//
//   1. Janima keys (library/anima_utils.py). The official Anima file prefixes
//      its DiT keys with "net.", a full ComfyUI checkpoint (Janima) with
//      "model.diffusion_model."; sd-scripts <= v0.10.x only stripped "net.", so
//      Janima loaded as 685 missing keys. Upstream fixed it in July 2026
//      (ef9990d, v0.11+), so on newer sd-scripts this is a no-op.
//   2. Cache subfolders (library/strategy_anima.py). Anima-TrainFlow's own
//      modification: latents go to <dataset>/latent_cache/ and text-encoder
//      outputs to <dataset>/cache_text_encoder/ instead of beside each image.
//      Osmium's "Clear training cache" looks exactly there.
//
// Usage: node scripts/patch-trainflow-trainer.js [path-to-Anima-TrainFlow]

const fs = require('fs');
const path = require('path');

const occurrences = (haystack, needle) => haystack.split(needle).length - 1;

const PATCHES = [
  {
    name: 'Janima keys',
    file: 'library/anima_utils.py',
    // Ours (older trainers) or upstream's own fix (v0.11+).
    done: (src) => src.includes('DIT_KEY_PREFIXES') || src.includes('key.startswith("model.diffusion_model.")'),
    edits: [
      {
        anchor: 'def load_anima_model(',
        // Inserted before the anchor.
        insertBefore: `# Checkpoint key layout: the official Anima file (and anything this trainer
# saves) prefixes the DiT keys with "net.", while a full ComfyUI checkpoint --
# Janima, for one -- uses "model.diffusion_model.". Both are the same 685 keys,
# so strip whichever prefix is present instead of assuming "net.".
# Added by Osmium Workshop (scripts/patch-trainflow-trainer.js) -- see the vault's
# Features/Trainflow note before changing it.
DIT_KEY_PREFIXES = ("model.diffusion_model.", "diffusion_model.", "net.")


def normalise_dit_key(key: str) -> str:
    for prefix in DIT_KEY_PREFIXES:
        if key.startswith(prefix):
            return key[len(prefix) :]
    return key


`
      },
      {
        anchor: '    rename_hooks = WeightTransformHooks(rename_hook=lambda k: k[len("net.") :] if k.startswith("net.") else k)',
        replace: '    rename_hooks = WeightTransformHooks(rename_hook=normalise_dit_key)'
      }
    ]
  },
  {
    // Anima-TrainFlow's python_embeded has a ._pth file: Python then ignores
    // PYTHONPATH and doesn't put the script's folder on sys.path, so
    // `import library` fails ("No module named 'library'"). Anima-TrainFlow's
    // own copy inserts the folder itself; this keeps that for newer sd-scripts.
    name: 'sys.path for the embedded Python',
    file: 'anima_train_network.py',
    done: (src) => /sys\.path\.insert\(0, *str\(/.test(src.split('import torch')[0]),
    edits: [
      {
        anchor: '\nimport argparse\n',
        insertBefore: [
          '',
          '# Osmium (scripts/patch-trainflow-trainer.js): the embedded Python ignores PYTHONPATH,',
          '# so put this folder on sys.path for `import library`.',
          'import os',
          'import sys',
          'from pathlib import Path',
          '',
          'current_script_path = Path(__file__).resolve().parent',
          'if str(current_script_path) not in sys.path:',
          '    sys.path.insert(0, str(current_script_path))',
          ''
        ].join('\n')
      }
    ]
  },
  {
    name: 'cache subfolders',
    file: 'library/strategy_anima.py',
    done: (src) => src.includes('"cache_text_encoder"') && src.includes('"latent_cache"'),
    edits: [
      {
        anchor: '        return os.path.splitext(image_abs_path)[0] + self.ANIMA_TEXT_ENCODER_OUTPUTS_NPZ_SUFFIX',
        replace: [
          '        # Osmium (scripts/patch-trainflow-trainer.js): text-encoder caches in <dataset>/cache_text_encoder/.',
          '        cache_dir = os.path.join(os.path.dirname(image_abs_path), "cache_text_encoder")',
          '        os.makedirs(cache_dir, exist_ok=True)',
          '        return os.path.join(cache_dir, os.path.splitext(os.path.basename(image_abs_path))[0] + self.ANIMA_TEXT_ENCODER_OUTPUTS_NPZ_SUFFIX)'
        ].join('\n')
      },
      {
        anchor: '        return os.path.splitext(absolute_path)[0] + f"_{image_size[0]:04d}x{image_size[1]:04d}" + self.ANIMA_LATENTS_NPZ_SUFFIX',
        replace: [
          '        # Osmium (scripts/patch-trainflow-trainer.js): latent caches in <dataset>/latent_cache/.',
          '        cache_dir = os.path.join(os.path.dirname(absolute_path), "latent_cache")',
          '        os.makedirs(cache_dir, exist_ok=True)',
          '        stem = os.path.splitext(os.path.basename(absolute_path))[0]',
          '        return os.path.join(cache_dir, stem + f"_{image_size[0]:04d}x{image_size[1]:04d}" + self.ANIMA_LATENTS_NPZ_SUFFIX)'
        ].join('\n')
      }
    ]
  }
];

// LoKr / LoHa under offloaded checkpointing: unsloth_offload_checkpointing runs
// each block in a custom autograd Function with autocast off, so their float32
// weight difference met bf16 activations and F.linear raised "expected mat1 and
// mat2 to have the same dtype ... BFloat16 != float" (reproduced 2026-10-17,
// LoHa + unsloth). Casting it to the activation's dtype is what autocast would
// have done anyway, so normal runs are unchanged.
for (const [name, file] of [['LoKr dtype under offload', 'networks/lokr.py'], ['LoHa dtype under offload', 'networks/loha.py']]) {
  PATCHES.push({
    name,
    file,
    done: (src) => src.includes('diff_weight = diff_weight.to(x.dtype)'),
    edits: [{
      anchor: '        else:\n            scale = 1.0\n\n        if self.is_conv:\n',
      replace: [
        '        else:',
        '            scale = 1.0',
        '',
        '        # Osmium (scripts/patch-trainflow-trainer.js): match the activations\' dtype — with',
        '        # offloaded checkpointing autocast is off, and fp32 weights met bf16 inputs.',
        '        diff_weight = diff_weight.to(x.dtype)',
        '',
        '        if self.is_conv:',
        ''
      ].join('\n')
    }]
  });
}

function fail(message) {
  console.error(`[patch-trainer] ${message}`);
  process.exitCode = 1;
}

function applyPatch(sdScripts, p) {
  const file = path.join(sdScripts, ...p.file.split('/'));
  if (!fs.existsSync(file)) { fail(`${p.name}: ${file} is missing.`); return; }
  const raw = fs.readFileSync(file, 'utf8');
  // Work in LF, write back in the file's own line endings.
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  let src = raw.replace(/\r\n/g, '\n');
  if (p.done(src)) { console.log(`[patch-trainer] ${p.name}: already in place (${p.file}).`); return; }
  for (const e of p.edits) {
    const n = occurrences(src, e.anchor);
    if (n !== 1) {
      fail(`${p.name}: expected 1 match of an anchor in ${p.file}, found ${n}. Upstream changed this code — re-check it and update scripts/patch-trainflow-trainer.js.`);
      return;
    }
  }
  for (const e of p.edits) {
    src = e.insertBefore !== undefined ? src.replace(e.anchor, e.insertBefore + e.anchor) : src.replace(e.anchor, e.replace);
  }
  if (!p.done(src)) { fail(`${p.name}: the rewrite did not produce the expected result — ${p.file} left unchanged.`); return; }
  fs.writeFileSync(file, src.split('\n').join(eol));
  console.log(`[patch-trainer] ${p.name}: patched ${p.file}.`);
}

function main() {
  const root = path.join(__dirname, '..');
  const target = path.resolve(process.argv[2] || path.join(root, 'Anima-TrainFlow'));
  if (!fs.existsSync(target)) {
    console.log(`[patch-trainer] no trainer folder at ${target} — nothing to patch (source-only checkout?).`);
    return;
  }
  // Accept either the Anima-TrainFlow folder or an sd-scripts folder itself.
  const sdScripts = fs.existsSync(path.join(target, 'training', 'sd-scripts')) ? path.join(target, 'training', 'sd-scripts') : target;
  if (!fs.existsSync(path.join(sdScripts, 'anima_train_network.py'))) {
    fail(`${target} has no training/sd-scripts/anima_train_network.py — is that really an Anima-TrainFlow folder?`);
    return;
  }
  for (const p of PATCHES) applyPatch(sdScripts, p);
}

main();
