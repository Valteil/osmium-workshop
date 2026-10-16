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
  // The runner's attention backend (applies the next time it starts).
  attention?: ComfyLocalAttention;
}

// 'auto' = FlashAttention when the install has flash-attn, else ComfyUI's default.
export type ComfyLocalAttention = 'auto' | 'flash' | 'sage' | 'xformers' | 'pytorch';

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
// Twenty of the fields are the JS form; the `adv*` group is the "Advanced"
// section's power-user knobs, written into the generated TOMLs. Each maps to a
// real flag in the bundled Anima-TrainFlow sd-scripts (verified via --help).
export type TfMixedPrecision = 'no' | 'fp16' | 'bf16';
export type TfSavePrecision = 'None' | 'fp16' | 'bf16';
export type TfLrScheduler = '' | 'constant' | 'constant_with_warmup' | 'cosine' | 'cosine_with_restarts' | 'linear' | 'polynomial' | 'adafactor';
export type TfAttn = 'torch' | 'sdpa' | 'xformers' | 'flash';
export type TfTimestepSampling = 'sigmoid' | 'uniform' | 'sigma' | 'shift' | 'flux_shift';
export type TfWeighting = 'uniform' | 'none' | 'sigma_sqrt' | 'logit_normal' | 'mode' | 'cosmap';
export type TfSampleSampler = 'euler' | 'euler_a' | 'ddim' | 'pndm' | 'lms' | 'heun' | 'dpm_2' | 'dpm_2_a' | 'dpmsolver' | 'dpmsolver++' | 'dpmsingle' | 'k_lms' | 'k_euler' | 'k_euler_a' | 'k_dpm_2' | 'k_dpm_2_a';

export interface TrainflowSettings {
  trigger: string; datasetPath: string;
  ditPath: string; qwenPath: string; vaePath: string;
  rank: number; lr: string; optimizer: 'Prodigy' | 'AdamW8bit' | 'AdamW';
  steps: number; saveSteps: number; sampleSteps: number; batchSize: number; gradAcc: number; trainSeed: number;
  // The Bucket Images dock's sizes; Start Trainflow buckets with the same ones.
  bucketMin: number; bucketMax: number; bucketStep: number;
  prompt: string; negPrompt: string; width: number; height: number; sampleGenSteps: number; cfg: number; sampleSeed: number;
  // ---- Advanced (power-user). 0/''/false = "leave the trainer's default". ----
  advAlpha: number;            // network_alpha; 0 => same as rank
  advNetworkDropout: number;   // network_dropout
  advTrainTextEncoder: boolean;// drop network_train_unet_only, add text-encoder training
  advLrScheduler: TfLrScheduler; // '' => constant for Prodigy, cosine otherwise
  advLrWarmup: number;         // lr_warmup_steps
  advMixedPrecision: TfMixedPrecision;
  advSavePrecision: TfSavePrecision;
  advTimestepSampling: TfTimestepSampling;
  advWeighting: TfWeighting;
  advFlowShift: number;        // discrete_flow_shift
  advSigmoidScale: number;     // sigmoid_scale
  advAttn: TfAttn;
  advTorchCompile: boolean;
  advBlocksToSwap: number;
  advMaxGradNorm: number;
  advGradCheckpointing: boolean;
  advDataloaderWorkers: number;// max_data_loader_n_workers
  advVaeChunkSize: number;     // 0 => 32
  advVaeDisableCache: boolean;
  advNoHalfVae: boolean;
  advCaptionDropout: number;   // caption_dropout_rate
  advKeepTokens: number;       // keep_tokens
  advRepeats: number;          // num_repeats; 0 => auto from steps/images
  advSampleSampler: TfSampleSampler;
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
export interface TrainflowBucketReport {
  // Every valid bucket for the current Min/Max/Step, and how many dataset images sit at each.
  buckets: { w: number; h: number; count: number }[];
  images: number;
  offBucket: string[];      // dataset images whose size is not a valid bucket
  withoutOriginal: number;  // images with no copy in original_images/ yet
  toRebucket: number;       // what Start Trainflow would (re)make right now
}
