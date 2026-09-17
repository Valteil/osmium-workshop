import type {
  ComfyResult, Wd14LocalInterface, Wd14LocalModel, Wd14LocalTagResult,
  Wd14LocalDownloadProgress
} from './types';

export {};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    Wd14Local?: Wd14LocalInterface;
    Capacitor?: { platform: string };
    __dtsReviveDirHandle?: (json: unknown) => FileSystemDirectoryHandle;
    __dtsPreThemed?: boolean;
  }

  interface ElectronAPI {
    restartApp(): Promise<void>;
    getAppVersion(): Promise<string>;
    setZoomFactor(factor: number): Promise<void>;
    exportAppState(text: string): Promise<{ ok: boolean; message?: string; path?: string }>;
    onRequestClose(callback: () => void): void;
    confirmClose(): Promise<void>;

    wd14GetModels(host: string): Promise<ComfyResult>;
    wd14TagImage(payload: {
      host: string;
      filename: string;
      imageBytes: Uint8Array;
      settings: {
        model: string;
        threshold: number;
        characterThreshold: number;
        trailingComma?: boolean;
        excludeTags?: string;
      };
    }): Promise<ComfyResult>;

    getHardwareAcceleration(): Promise<boolean>;
    setHardwareAcceleration(enabled: boolean): Promise<void>;

    synthdatGetObjectInfo(payload: {
      host: string;
      classType: string;
      inputName: string;
    }): Promise<ComfyResult>;
    synthdatQueueAndFetch(payload: {
      host: string;
      imageFilename: string | null;
      imageBytes: Uint8Array | null;
      prompt: Record<string, unknown>;
    }): Promise<ComfyResult>;
    synthdatStopGeneration(host: string): Promise<ComfyResult>;
    onSynthdatPreviewFrame(callback: (event: unknown, data: { mime: string; bytes: Uint8Array }) => void): void;
    onSynthdatProgress(callback: (event: unknown, data: { value: number; max: number }) => void): void;

    wd14LocalListModels(): Promise<Wd14LocalModel[]>;
    wd14LocalDeleteModel(name: string): Promise<void>;
    wd14LocalDownloadModel(payload: { name: string; modelUrl: string; tagsUrl: string }): Promise<void>;
    wd14LocalTagImage(payload: {
      modelName: string;
      imageBytes: Uint8Array;
      threshold: number;
      characterThreshold: number;
    }): Promise<Wd14LocalTagResult>;
    onWd14LocalDownloadProgress(callback: (event: unknown, ev: Wd14LocalDownloadProgress) => void): void;
    wd14LocalPickImportFiles(): Promise<{ canceled: true } | { canceled?: false; name: string; modelPath: string; tagsPath: string }>;
    wd14LocalImportModel(payload: { name: string; modelPath: string; tagsPath: string }): Promise<void>;
  }
}
