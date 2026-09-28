// Tag Sorting's saved character presets, per dataset (_dts_subject_presets.json).
// A preset is a named subject plus the tags that were in its section when it
// was saved; loading it onto an image vacuums those tags into a new section
// (see view.ts's loadSubjectPreset). Written straight to disk on every change,
// like the achievements file — it's a small library, not a tag edit.
import type { DirHandle, SubjectPreset } from './types';
import { writeBytes } from './fs-access';

const PRESETS_FILE_NAME = '_dts_subject_presets.json';

export let subjectPresets: SubjectPreset[] = [];

let getDirHandle: () => DirHandle | null = () => null;

export interface SubjectPresetsDeps {
  getDirHandle: () => DirHandle | null;
}

export function initSubjectPresets(deps: SubjectPresetsDeps): void {
  getDirHandle = deps.getDirHandle;
}

export async function loadSubjectPresetsForFolder(): Promise<void> {
  subjectPresets = [];
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(PRESETS_FILE_NAME, { create: false });
    const parsed = JSON.parse((await (await handle.getFile()).text()).trim() || '[]');
    if (Array.isArray(parsed)) subjectPresets = parsed
      .filter(p => p && typeof p.name === 'string' && Array.isArray(p.tags))
      .map(p => ({ id: String(p.id || p.name), name: p.name, tags: p.tags.filter((t: unknown) => typeof t === 'string') }));
  } catch(err){ /* no presets saved for this dataset yet */ }
}

async function saveSubjectPresets(): Promise<void> {
  const dirHandle = getDirHandle();
  if (!dirHandle) return;
  try {
    const handle = await dirHandle.getFileHandle(PRESETS_FILE_NAME, { create: true });
    await writeBytes(handle, JSON.stringify(subjectPresets, null, 2));
  } catch(err){ /* best-effort, same as the rules file */ }
}

// Saving under a name that already exists (case-insensitive) overwrites it,
// so re-saving a character updates its preset instead of duplicating it.
export function upsertSubjectPreset(name: string, tags: string[]): SubjectPreset {
  const key = name.trim().toLowerCase();
  let preset = subjectPresets.find(p => p.name.trim().toLowerCase() === key);
  if (preset){ preset.name = name.trim(); preset.tags = tags.slice(); }
  else {
    preset = { id: 'preset-' + Date.now().toString(36), name: name.trim(), tags: tags.slice() };
    subjectPresets.push(preset);
  }
  void saveSubjectPresets();
  return preset;
}

export function deleteSubjectPreset(id: string): void {
  subjectPresets = subjectPresets.filter(p => p.id !== id);
  void saveSubjectPresets();
}

export function subjectPresetById(id: string | undefined): SubjectPreset | undefined {
  return id ? subjectPresets.find(p => p.id === id) : undefined;
}
