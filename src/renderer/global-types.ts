// Ambient types for the preload bridge exposed via contextBridge (see src/preload.ts).
// Used once Phase B splits index.ts into typed modules and removes @ts-nocheck.
export {};

declare global {
  interface Window {
    electronAPI: {
      restartApp: () => Promise<void>;
      getAppVersion: () => Promise<string>;
      setZoomFactor: (factor: number) => Promise<void>;
      exportAppState: (text: string) => Promise<{ ok: boolean; message?: string; path?: string }>;
      onRequestClose: (callback: () => void) => void;
      confirmClose: () => Promise<void>;
      wd14GetModels: (host: string) => Promise<{ ok: boolean; models?: string[]; error?: string }>;
      wd14TagImage: (payload: { host: string; filename: string; imageBytes: Uint8Array; settings: any }) => Promise<{ ok: boolean; tagsCsv?: string; error?: string }>;
      getHardwareAcceleration: () => Promise<boolean>;
      setHardwareAcceleration: (enabled: boolean) => Promise<void>;
      synthdatGetObjectInfo: (payload: { host: string; classType: string; inputName: string }) => Promise<{ ok: boolean; values?: string[]; error?: string }>;
      synthdatQueueAndFetch: (payload: { host: string; imageFilename: string; imageBytes: Uint8Array; prompt: any }) => Promise<{ ok: boolean; imageBytes?: Uint8Array; error?: string; interrupted?: boolean }>;
      synthdatStopGeneration: (host: string) => Promise<{ ok: boolean }>;
      onSynthdatPreviewFrame: (callback: (event: any, data: { mime: string; bytes: Uint8Array }) => void) => void;
      onSynthdatProgress: (callback: (event: any, data: { value: number; max: number }) => void) => void;
    };
  }
}
