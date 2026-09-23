// Shared IPC contract between the main process, the preload bridge, and the
// renderer's ambient `window.electronAPI` declaration. A .d.ts on purpose:
// both tsconfigs pull it in via `import type`, and declaration files emit no
// JS (a plain .ts would land an ipc-types.js in the build output).
//
// Keeping the contract here means preload.ts can assert its exposed object
// against `ElectronAPI`, and main.ts's handlers can reuse the same payload
// types, instead of three hand-maintained copies silently drifting apart.
import type {
  ComfyResult, Wd14LocalModel, Wd14LocalTagResult, Wd14LocalDownloadProgress, SynthDatPrompt,
  BucketModelStatus, BucketImageResult, BucketDownloadProgress
} from './shared-types';

export interface Wd14TagSettings {
  model: string;
  threshold: number;
  characterThreshold: number;
  trailingComma?: boolean;
  excludeTags?: string;
}

export interface Wd14TagImagePayload {
  host: string;
  filename: string;
  imageBytes: Uint8Array;
  settings: Wd14TagSettings;
}

export interface SynthdatObjectInfoPayload {
  host: string;
  classType: string;
  inputName: string;
}

export interface SynthdatQueuePayload {
  host: string;
  imageFilename: string | null;
  imageBytes: Uint8Array | null;
  prompt: SynthDatPrompt;
}

export interface ExportAppStateResult {
  ok: boolean;
  message?: string;
  path?: string;
}

export type Wd14LocalPickImportResult =
  | { canceled: true }
  | { canceled?: false; name: string; modelPath: string; tagsPath: string };

export interface Wd14LocalDownloadPayload {
  name: string;
  modelUrl: string;
  tagsUrl: string;
}

export interface Wd14LocalImportPayload {
  name: string;
  modelPath: string;
  tagsPath: string;
}

export interface Wd14LocalTagImagePayload {
  name: string;
  imageBytes: Uint8Array;
  threshold: number;
  characterThreshold: number;
  preferGpu?: boolean;
}

export interface BucketImagePayload {
  imageBytes: Uint8Array;
  sideMin: number;
  sideMax: number;
  step: number;
}

export interface ElectronAPI {
  restartApp(): Promise<void>;
  getAppVersion(): Promise<string>;
  setZoomFactor(factor: number): Promise<void>;
  exportAppState(text: string): Promise<ExportAppStateResult>;
  onRequestClose(callback: () => void): void;
  confirmClose(): Promise<void>;

  wd14GetModels(host: string): Promise<ComfyResult>;
  wd14TagImage(payload: Wd14TagImagePayload): Promise<ComfyResult>;

  getHardwareAcceleration(): Promise<boolean>;
  setHardwareAcceleration(enabled: boolean): Promise<void>;

  synthdatGetObjectInfo(payload: SynthdatObjectInfoPayload): Promise<ComfyResult>;
  synthdatQueueAndFetch(payload: SynthdatQueuePayload): Promise<ComfyResult>;
  synthdatStopGeneration(host: string): Promise<ComfyResult>;
  onSynthdatPreviewFrame(callback: (event: unknown, data: { mime: string; bytes: Uint8Array }) => void): void;
  onSynthdatProgress(callback: (event: unknown, data: { value: number; max: number }) => void): void;

  wd14LocalListModels(): Promise<Wd14LocalModel[]>;
  wd14LocalDeleteModel(name: string): Promise<void>;
  wd14LocalDownloadModel(payload: Wd14LocalDownloadPayload): Promise<void>;
  wd14LocalTagImage(payload: Wd14LocalTagImagePayload): Promise<Wd14LocalTagResult>;
  onWd14LocalDownloadProgress(callback: (event: unknown, ev: Wd14LocalDownloadProgress) => void): void;
  wd14LocalPickImportFiles(): Promise<Wd14LocalPickImportResult>;
  wd14LocalImportModel(payload: Wd14LocalImportPayload): Promise<void>;

  bucketModelStatus(): Promise<BucketModelStatus>;
  bucketDownloadModel(): Promise<void>;
  bucketImage(payload: BucketImagePayload): Promise<BucketImageResult>;
  onBucketDownloadProgress(callback: (event: unknown, ev: BucketDownloadProgress) => void): void;
}
