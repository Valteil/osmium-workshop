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
  // Comfy Bridge: the upscaled branch, and each SaveImage's path under
  // ComfyUI's output folder (the File Namer's scheme, mirrored on disk).
  upscaledImageBytes?: Uint8Array;
  // Text outputs by node id (the local runner's `_meta.capture` text nodes).
  texts?: Record<string, string>;
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
// sd-scripts' optimizer_type. A dotted name is imported as module.Class; any
// name ending in "ScheduleFree" gets sd-scripts' schedule-free handling.
export type TfOptimizer = 'Prodigy' | 'AdamW8bit' | 'AdamW' | 'AdamWScheduleFree' | 'prodigyplus.ProdigyPlusScheduleFree' | 'Lion8bit' | 'Adafactor';
// LoRA = networks.lora_anima; LoKr / LoHa = sd-scripts' own networks.lokr / networks.loha.
export type TfNetworkType = 'lora' | 'lokr' | 'loha';
export type TfSampleSampler = 'euler' | 'euler_a' | 'ddim' | 'pndm' | 'lms' | 'heun' | 'dpm_2' | 'dpm_2_a' | 'dpmsolver' | 'dpmsolver++' | 'dpmsingle' | 'k_lms' | 'k_euler' | 'k_euler_a' | 'k_dpm_2' | 'k_dpm_2_a';

export interface TrainflowSettings {
  trigger: string; datasetPath: string;
  ditPath: string; qwenPath: string; vaePath: string;
  rank: number; lr: string; optimizer: TfOptimizer;
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
  // ---- Network type (2026-10-17). Unset = LoRA, the old TOML. ----
  netType?: TfNetworkType;
  netFactor?: number;           // LoKr factor (-1 = auto balanced; 4 = the common Anima LoKr)
  netTrainLlmAdapter?: boolean; // train_llm_adapter: also the LLM adapter blocks
  netTrainModulation?: boolean; // include the adaLN modulation layers (excluded by default)
  // ---- VRAM / speed (audited against the Anima path; fp8_base/fp8_scaled are
  // force-disabled by anima_train_network.py, so they aren't offered) ----
  advOffloadCkpt?: '' | 'cpu' | 'unsloth'; // unsloth_offload_checkpointing ('cpu' is legacy and runs as unsloth: v0.12's cpu offload is broken for Anima)
  advSplitAttn?: boolean;       // split_attn
  advCompile?: '' | 'block' | 'model'; // per-block --compile (sd-scripts >= v0.11) / --torch_compile; replaces advTorchCompile
  keepStates?: number;          // keep only the newest N resume states (save_last_n_steps_state); 0 = all
  // ---- Dataset ----
  extraFolders?: { path: string; repeats: number }[]; // more image folders (repeats 0 = auto)
  captionShuffle?: boolean;     // shuffle_caption (keeps the first keep_tokens); turns TE output caching off
  captionTagDropout?: number;   // caption_tag_dropout_rate; > 0 turns TE output caching off
  validationSplit?: number;     // 0..0.5 of the images held out for validation loss
  validateEvery?: number;       // validate_every_n_steps (0 = each epoch)
  // ---- Continue training (2026-10-17) ----
  // save_state: the optimizer/scheduler/RNG state beside each checkpoint, so a
  // run can be resumed exactly later. Off (undefined) = the old TOML.
  saveState?: boolean;
  // Where Start begins: unset = a fresh LoRA. 'weights:<file>' = load that
  // checkpoint's weights and train `continueSteps` more as a new run;
  // 'state:<dir>' = resume that saved state exactly with the run's own configs.
  // Names are plain entries of the project's output folder. Not persisted.
  continueFrom?: string;
  continueSteps?: number;
}
// One thing Start can continue from, listed from the project's output folder.
export interface TrainflowContinueOption {
  id: string;            // 'weights:<file>' | 'state:<dir>'
  kind: 'weights' | 'state';
  name: string;          // the file or folder name
  run: string;           // the output name it belongs to
  step: number;          // 0 = unknown (a final file without configs)
  mtime: number;
  outputName: string;    // what the continued run is saved as
}
export interface TrainflowRun {
  state: 'running' | 'finished' | 'stopped' | 'failed';
  project: string; outDir: string; startedAt: number;
  step: number; total: number; speed: string; eta: string; elapsed: string; loss?: number;
  valLoss?: number;  // the last validation average (validation split on)
}
export interface TrainflowStatus {
  folder: string; ok: boolean; error?: string;
  // What the chosen install's sd-scripts can do (read from its source).
  trainer?: { blockCompile: boolean };
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
// The trainer's caches inside the dataset (latent_cache/, cache_text_encoder/).
export interface TrainflowCacheInfo { files: number; bytes: number; }
export interface TrainflowCacheClearResult { ok: boolean; files: number; bytes: number; message?: string; }
export interface TrainflowBucketReport {
  // Every valid bucket for the current Min/Max/Step, and how many dataset images sit at each.
  buckets: { w: number; h: number; count: number }[];
  images: number;
  offBucket: string[];      // dataset images whose size is not a valid bucket
  withoutOriginal: number;  // images with no copy in original_images/ yet
  toRebucket: number;       // what Start Trainflow would (re)make right now
}
