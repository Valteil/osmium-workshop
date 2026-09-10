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
    };
  }
}
