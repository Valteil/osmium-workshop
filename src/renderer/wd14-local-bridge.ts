import './global-types';
import type { Wd14LocalInterface, Wd14LocalDownloadProgress } from './types';

if (window.electronAPI && window.electronAPI.wd14LocalListModels) {
  let progressListenerAdded = false;
  const progressCallbacks = new Map<string, (ev: Wd14LocalDownloadProgress) => void>();

  const bridge: Wd14LocalInterface = {
    async listModels() {
      return await window.electronAPI.wd14LocalListModels();
    },
    async deleteModel(name: string) {
      await window.electronAPI.wd14LocalDeleteModel(name);
    },
    async downloadModel(opts: { name: string; modelUrl: string; tagsUrl: string }, onProgress?: (ev: Wd14LocalDownloadProgress) => void) {
      if (!progressListenerAdded) {
        progressListenerAdded = true;
        window.electronAPI.onWd14LocalDownloadProgress((_event: unknown, ev: Wd14LocalDownloadProgress) => {
          const cb = progressCallbacks.get(ev.name);
          if (cb) cb(ev);
        });
      }
      if (onProgress) progressCallbacks.set(opts.name, onProgress);
      try {
        await window.electronAPI.wd14LocalDownloadModel(opts);
      } finally {
        progressCallbacks.delete(opts.name);
      }
    },
    async tagImage(payload: { name: string; imageBytes: Uint8Array; threshold: number; characterThreshold: number; preferGpu?: boolean }) {
      return await window.electronAPI.wd14LocalTagImage(payload);
    },
    async pickImportFiles() {
      return await window.electronAPI.wd14LocalPickImportFiles();
    },
    async importModel(payload: { name: string; modelPath: string; tagsPath: string }) {
      await window.electronAPI.wd14LocalImportModel(payload);
    }
  };

  window.Wd14Local = bridge;
}
