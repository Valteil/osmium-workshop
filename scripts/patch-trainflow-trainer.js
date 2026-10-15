#!/usr/bin/env node
// Teaches the bundled Anima-TrainFlow trainer to read any Anima checkpoint key
// layout, not just the official "net." one.
//
// The official Anima file (and anything the trainer itself saves) prefixes its
// DiT keys with "net.". A full ComfyUI checkpoint — **Janima**, for one — uses
// "model.diffusion_model." instead. They are the same 685 keys with identical
// shapes, but the trainer builds one fixed rename hook that only knows "net.",
// so a Janima DiT loads as if every weight were missing:
//
//   RuntimeError: Missing keys in checkpoint: ['x_embedder.proj.1.weight', ...]
//
// after ~85 s of successful VAE/Qwen3/latent caching. This script rewrites that
// hook to strip whichever prefix is present.
//
// Why a script instead of just editing the file: `Anima-TrainFlow/` is
// gitignored (a ~5.4 GB robocopy of the upstream install, see
// notes/Features/Trainflow.md), so a hand edit to it is invisible to git and is
// silently lost the next time the copy is refreshed — exactly how this bug would
// come back. This is the tracked record of the edit, `npm run refresh-app` runs
// it before packaging, and `npm run patch-trainer` runs it on demand.
//
// Idempotent (a patched trainer is left alone), and quiet when there is no
// trainer folder at all (a source-only checkout). If it finds a trainer whose
// anima_utils.py is neither patched nor patchable it fails loudly rather than
// shipping a trainer that can't train on Janima.
//
// Usage: node scripts/patch-trainflow-trainer.js [path-to-Anima-TrainFlow]

const fs = require('fs');
const path = require('path');

const MARKER = 'DIT_KEY_PREFIXES';

// The upstream line, verbatim (4-space indented method body).
const ORIGINAL =
  '    rename_hooks = WeightTransformHooks(rename_hook=lambda k: k[len("net.") :] if k.startswith("net.") else k)';
const PATCHED = '    rename_hooks = WeightTransformHooks(rename_hook=normalise_dit_key)';

const ANCHOR = 'def load_anima_model(';

const HELPER = `# Checkpoint key layout: the official Anima file (and anything this trainer
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


`;

function fail(message) {
  console.error(`[patch-trainer] ${message}`);
  process.exitCode = 1;
}

function main() {
  const root = path.join(__dirname, '..');
  const target = path.resolve(process.argv[2] || path.join(root, 'Anima-TrainFlow'));
  const file = path.join(target, 'training', 'sd-scripts', 'library', 'anima_utils.py');

  if (!fs.existsSync(target)) {
    console.log(`[patch-trainer] no trainer folder at ${target} — nothing to patch (source-only checkout?).`);
    return;
  }
  if (!fs.existsSync(file)) {
    fail(`${target} exists but has no training/sd-scripts/library/anima_utils.py — is that really an Anima-TrainFlow folder?`);
    return;
  }

  const src = fs.readFileSync(file, 'utf8');
  if (src.includes(MARKER)) {
    console.log(`[patch-trainer] already patched: ${file}`);
    return;
  }

  // Both anchors must be present exactly once, or we're looking at a trainer
  // whose model loading was rewritten upstream and we must not guess.
  const occurrences = (haystack, needle) => haystack.split(needle).length - 1;
  if (occurrences(src, ORIGINAL) !== 1) {
    fail(`the rename hook in ${file} is not the expected line (${occurrences(src, ORIGINAL)} matches). Upstream changed model loading — re-check load_anima_model and update this script.`);
    return;
  }
  if (occurrences(src, ANCHOR) !== 1) {
    fail(`could not find "${ANCHOR}" in ${file} (${occurrences(src, ANCHOR)} matches). Upstream changed model loading — re-check load_anima_model and update this script.`);
    return;
  }

  // Keep the file's own line endings rather than mixing LF into a CRLF file.
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const helper = HELPER.split('\n').join(eol);

  const out = src.replace(ANCHOR, helper + ANCHOR).replace(ORIGINAL, PATCHED);
  if (!out.includes(MARKER) || !out.includes(PATCHED)) {
    fail('the rewrite did not produce the expected result — file left unchanged.');
    return;
  }

  fs.writeFileSync(file, out);
  console.log(`[patch-trainer] patched ${file} (prefix-agnostic DiT keys, so Janima and other ComfyUI checkpoints load).`);
}

main();
