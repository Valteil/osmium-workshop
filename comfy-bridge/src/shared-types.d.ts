// GENERATED FILE — do not edit. Synced from ../../src/shared-types.d.ts by
// scripts/sync-comfy-core.js. Edit the root file and re-run the sync.

// Cross-boundary types shared by the renderer and the main process. Kept as a
// .d.ts on purpose: both tsconfigs `import type` from it, and a declaration
// file is never emitted as JS (a plain .ts here would drop a stray
// shared-types.js into the build output). The renderer's own types.ts
// re-exports these so existing `from './types'` imports keep working.

export interface ComfyResult<T = unknown> {
  ok: boolean;
  error?: string;
  models?: string[];
  values?: string[];
  tagsCsv?: string;
  imageBytes?: Uint8Array;
  pass1ImageBytes?: Uint8Array;
  interrupted?: boolean;
}

export interface SynthDatPromptNode {
  class_type: string;
  inputs: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

export type SynthDatPrompt = Record<string, SynthDatPromptNode>;

export interface Wd14LocalModel {
  name: string;
  hasOnnx: boolean;
  hasCsv: boolean;
  tagCount?: number;
  sizeBytes?: number;
}

export interface Wd14LocalTagResult {
  ok: boolean;
  tagsCsv?: string;
  error?: string;
  provider?: string;
}

export interface Wd14LocalDownloadProgress {
  name: string;
  part: string;
  percent: number;
}
