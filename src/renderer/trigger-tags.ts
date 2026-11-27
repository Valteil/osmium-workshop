// Trigger tags, per dataset (_dts_triggers.json): tags marked as the LoRA's
// trigger words. They get a green chip on every image, and Trainflow's Send
// puts them in the sent checkpoint's name and its safetensors metadata
// (modelspec.trigger_phrase). Written straight to disk on every change, like
// the saved characters file.
import type { DirHandle } from './types';
import { writeBytes } from './fs-access';

const TRIGGERS_FILE_NAME = '_dts_triggers.json';

let triggers: string[] = [];
let getDirHandle: () => DirHandle | null = () => null;

export function initTriggerTags(deps: { getDirHandle: () => DirHandle | null }): void {
  getDirHandle = deps.getDirHandle;
}

export async function loadTriggerTagsForFolder(): Promise<void> {
  triggers = [];
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(TRIGGERS_FILE_NAME, { create: false });
    const parsed = JSON.parse((await (await handle.getFile()).text()).trim() || '[]');
    if (Array.isArray(parsed)) triggers = parsed.filter((t: unknown): t is string => typeof t === 'string' && !!t.trim());
  } catch(err){ /* no triggers marked in this dataset yet */ }
}

async function saveTriggerTags(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(TRIGGERS_FILE_NAME, { create: true });
    await writeBytes(handle, JSON.stringify(triggers, null, 2));
  } catch(err){ /* best-effort, same as the presets file */ }
}

export function isTriggerTag(tag: string): boolean {
  return triggers.includes(tag);
}

// In the order they were marked.
export function getTriggerTags(): string[] {
  return triggers.slice();
}

export function toggleTriggerTag(tag: string): boolean {
  const on = !triggers.includes(tag);
  triggers = on ? [...triggers, tag] : triggers.filter(t => t !== tag);
  void saveTriggerTags();
  return on;
}
