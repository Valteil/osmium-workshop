// Ambient types for the preload bridge exposed via contextBridge (see src/preload.ts).
// Used once Phase B splits index.ts into typed modules and removes @ts-nocheck.
export {};

declare global {
  interface Window {
    electronAPI: {
      restartApp: () => Promise<void>;
      setZoomFactor: (factor: number) => Promise<void>;
      generateGithubPackage: () => Promise<{ ok: boolean; message: string; path?: string }>;
      onRequestClose: (callback: () => void) => void;
      confirmClose: () => Promise<void>;
      wd14GetModels: (host: string) => Promise<{ ok: boolean; models?: string[]; error?: string }>;
      wd14TagImage: (payload: { host: string; filename: string; imageBytes: Uint8Array; settings: any }) => Promise<{ ok: boolean; tagsCsv?: string; error?: string }>;
    };
  }
}
