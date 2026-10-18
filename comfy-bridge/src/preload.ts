const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Text size slider (shared/ui-zoom.ts): Chromium page zoom, applied in this
  // renderer directly (webFrame works in a sandboxed preload; no IPC needed).
  setZoomFactor: (factor) => webFrame.setZoomFactor(factor),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  pickOutputFolder: () => ipcRenderer.invoke('pick-output-folder'),
  openSaveFolder: (which) => ipcRenderer.invoke('open-save-folder', which),
  // Upscale tab: its own save folder (kept in main, like the output folder).
  usduSaveFolder: () => ipcRenderer.invoke('usdu-save-folder'),
  usduPickSaveFolder: () => ipcRenderer.invoke('usdu-pick-save-folder'),
  usduSaveToFolder: (payload) => ipcRenderer.invoke('usdu-save-to-folder', payload),
  importWorkflow: () => ipcRenderer.invoke('import-workflow-file'),
  // LoRA lookup (Metadata tab): file metadata via the runner, online search
  // through main's two-site allowlist, links opened only for those sites.
  loraFileInfo: (name) => ipcRenderer.invoke('lora-file-info', name),
  loraOnlineLookup: (payload) => ipcRenderer.invoke('lora-online-lookup', payload),
  openLookupLink: (url) => ipcRenderer.invoke('open-lookup-link', url),
  loraPreviewImage: (url) => ipcRenderer.invoke('lora-preview-image', url),
  loraOp: (payload) => ipcRenderer.invoke('lora-op', payload),
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  galleryListDir: (payload) => ipcRenderer.invoke('gallery-list-dir', payload),
  galleryRead: (payload) => ipcRenderer.invoke('gallery-read', payload),
  moveImage: (payload) => ipcRenderer.invoke('move-image', payload),
  listPresets: () => ipcRenderer.invoke('list-presets'),
  savePreset: (payload) => ipcRenderer.invoke('save-preset', payload),
  loadPreset: (payload) => ipcRenderer.invoke('load-preset', payload),
  deletePreset: (payload) => ipcRenderer.invoke('delete-preset', payload),
  synthdatGetObjectInfo: (payload) => ipcRenderer.invoke('synthdat-get-object-info', payload),
  synthdatQueueAndFetch: (payload) => ipcRenderer.invoke('synthdat-queue-and-fetch', payload),
  synthdatStopGeneration: (host) => ipcRenderer.invoke('synthdat-stop-generation', host),
  wd14Tag: (payload) => ipcRenderer.invoke('wd14-tag', payload),
  wd14PickImage: () => ipcRenderer.invoke('wd14-pick-image'),
  wd14SaveTxtBeside: (payload) => ipcRenderer.invoke('wd14-save-txt-beside', payload),
  comfyFetchLogs: (payload) => ipcRenderer.invoke('comfy-fetch-logs', payload),
  // Local ComfyUI (comfy-local.ts)
  comfyLocalStatus: () => ipcRenderer.invoke('comfy-local-status'),
  comfyLocalPickFolder: () => ipcRenderer.invoke('comfy-local-pick-folder'),
  comfyLocalConnect: () => ipcRenderer.invoke('comfy-local-connect'),
  comfyLocalShutdown: () => ipcRenderer.invoke('comfy-local-shutdown'),
  comfyLocalSetPersist: (on) => ipcRenderer.invoke('comfy-local-set-persist', on),
  comfyLocalSetAttention: (mode) => ipcRenderer.invoke('comfy-local-set-attention', mode),
  // Network relay for the Android app (local-relay.ts)
  comfyRelayStatus: () => ipcRenderer.invoke('comfy-relay-status'),
  comfyRelaySet: (payload) => ipcRenderer.invoke('comfy-relay-set', payload),
  onPreviewFrame: (callback) => ipcRenderer.on('preview-frame', callback),
  onGenProgress: (callback) => ipcRenderer.on('gen-progress', callback),
  onComfyLog: (callback) => ipcRenderer.on('comfy-log', callback)
});
