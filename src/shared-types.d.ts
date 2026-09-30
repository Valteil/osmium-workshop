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
  // Comfy Bridge: the upscaled branch, and each SaveImage's path under
  // ComfyUI's output folder (the File Namer's scheme, mirrored on disk).
  upscaledImageBytes?: Uint8Array;
  saveRel?: string | null;
  pass1SaveRel?: string | null;
  upscaledSaveRel?: string | null;
  interrupted?: boolean;
}

// Local ComfyUI (src/comfy-local.ts, synced into Comfy Bridge): the chosen
// folder and whether it resolves to a usable install (ComfyUI + its Python +
// the DSM pack).
export interface ComfyLocalStatus {
  folder: string;
  ok: boolean;
  error?: string;
  python?: string;
  running: boolean;
  // Comfy Bridge's Persist Comfy: the runner stays open after the app closes.
  persist?: boolean;
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

// ---- Aspect-ratio bucketing (src/bucket-local.ts) ----

export interface BucketModelStatus {
  present: boolean;
  sizeBytes?: number;
}

export interface BucketDownloadProgress {
  percent: number;
}

export interface BucketImageResult {
  ok: boolean;
  error?: string;
  pngBytes?: Uint8Array;
  bucket?: [number, number];
  provider?: string;
}

// Trainflow (src/trainflow.ts): Anima LoRA training from the Trainflow tab.
export interface TrainflowSettings {
  trigger: string; datasetPath: string;
  ditPath: string; qwenPath: string; vaePath: string;
  rank: number; lr: string; optimizer: 'Prodigy' | 'AdamW8bit' | 'AdamW';
  steps: number; saveSteps: number; sampleSteps: number; batchSize: number; gradAcc: number; trainSeed: number;
  // The Bucket Images dock's sizes; Start Trainflow buckets with the same ones.
  bucketMin: number; bucketMax: number; bucketStep: number;
  prompt: string; negPrompt: string; width: number; height: number; sampleGenSteps: number; cfg: number; sampleSeed: number;
}
export interface TrainflowRun {
  state: 'running' | 'finished' | 'stopped' | 'failed';
  project: string; outDir: string; startedAt: number;
  step: number; total: number; speed: string; eta: string; elapsed: string; loss?: number;
}
export interface TrainflowStatus {
  folder: string; ok: boolean; error?: string;
  run: TrainflowRun | null;
  // Set while Start Trainflow is bucketing the dataset (before training launches).
  prep?: { message: string; done: number; total: number };
  logTail: string[];
  samples: { name: string; mtime: number }[];
  checkpoints: { name: string; size: number }[];
}
export interface TrainflowDatasetCheck {
  ok: boolean; images: number; unbucketed: number; missingCaptions: number; oversized: number;
  baseRes: number; maxBucket: number; errors: string[];
}
export interface TrainflowStartResult { ok: boolean; errors?: string[]; }
