// Exact resume for Trainflow (src/trainflow.ts): the in-memory edit that makes
// sd-scripts continue its step count. Kept free of Electron imports so a plain
// Node script can write the same bootstrap the app does (the resume test).
import * as fs from 'fs';
import * as path from 'path';

// sd-scripts' --resume restores the optimizer, LR scheduler and RNG, but starts
// its step counter at 0 again (checkpoints re-numbered from step 100, overwriting
// the old ones, and the run going max_train_steps MORE steps) unless
// --skip_until_initial_step is given — and that path sets global_step to a batch
// count, wrong with gradient accumulation (2x at grad-acc 2) and past the first
// epoch. So an exact resume runs the trainer through a small bootstrap that edits
// train_network.py's source in memory before running it (nothing on disk changes,
// so it works on any Anima-TrainFlow install): the counter continues from the
// saved step, the run stops at max_train_steps, and the progress bar reads
// "650/1000". Each anchor must match exactly once, checked before launching
// (resumePatchError) and again by the bootstrap.
export const RESUME_PATCHES: [string, string][] = [
  ['        epoch_to_start = 0\n', '        epoch_to_start = 0\n        osmium_resumed_step = 0\n'],
  ['                initial_step = 0  # do not skip\n', '                osmium_resumed_step = initial_step\n                initial_step = 0  # do not skip\n'],
  ['            global_step = initial_step\n', '            global_step = initial_step\n        if osmium_resumed_step:\n            global_step = osmium_resumed_step\n'],
  ['range(args.max_train_steps - initial_step), smoothing=0,', 'range(args.max_train_steps - initial_step), initial=osmium_resumed_step, smoothing=0,']
];
export function resumePatchError(scriptsDir: string): string {
  let src = '';
  try { src = fs.readFileSync(path.join(scriptsDir, 'train_network.py'), 'utf8').replace(/\r\n/g, '\n'); } catch { return 'train_network.py not found in the trainer.'; }
  const bad = RESUME_PATCHES.filter(([a]) => src.split(a).length !== 2);
  return bad.length ? 'This Anima-TrainFlow\'s train_network.py differs from the one exact resume was built for, so it can\'t continue the step count. Continue from the checkpoint\'s weights instead.' : '';
}
export function writeResumeBootstrap(file: string): void {
  const py = [
    '# Written by Osmium Workshop for an exact resume (src/trainflow-resume.ts):',
    '# runs the trainer with train_network.py edited in memory so the step count continues.',
    'import json, os, runpy, sys, types',
    'scripts_dir, script = sys.argv[1], sys.argv[2]',
    'sys.argv = sys.argv[2:]',
    'sys.path.insert(0, scripts_dir)',
    "src_path = os.path.join(scripts_dir, 'train_network.py')",
    "with open(src_path, encoding='utf-8') as f:",
    '    src = f.read()',
    `for old, new in json.loads(${JSON.stringify(JSON.stringify(RESUME_PATCHES))}):`,
    '    if src.count(old) != 1:',
    "        sys.exit('[osmium] train_network.py changed; exact resume cannot continue the step count.')",
    '    src = src.replace(old, new)',
    "mod = types.ModuleType('train_network')",
    'mod.__file__ = src_path',
    "sys.modules['train_network'] = mod",
    "exec(compile(src, src_path, 'exec'), mod.__dict__)",
    "runpy.run_path(script, run_name='__main__')",
    ''
  ];
  fs.writeFileSync(file, py.join('\n'));
}
