const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  pickOutputFolder: () => ipcRenderer.invoke('pick-output-folder'),
  importWorkflow: () => ipcRenderer.invoke('import-workflow-file'),
  saveImage: (payload) => ipcRenderer.invoke('save-image', payload),
  galleryListDir: (payload) => ipcRenderer.invoke('gallery-list-dir', payload),
  galleryRead: (payload) => ipcRenderer.invoke('gallery-read', payload),
  listPresets: () => ipcRenderer.invoke('list-presets'),
  savePreset: (payload) => ipcRenderer.invoke('save-preset', payload),
  loadPreset: (payload) => ipcRenderer.invoke('load-preset', payload),
  deletePreset: (payload) => ipcRenderer.invoke('delete-preset', payload),
  synthdatGetObjectInfo: (payload) => ipcRenderer.invoke('synthdat-get-object-info', payload),
  synthdatQueueAndFetch: (payload) => ipcRenderer.invoke('synthdat-queue-and-fetch', payload),
  synthdatStopGeneration: (host) => ipcRenderer.invoke('synthdat-stop-generation', host),
  comfyFetchLogs: (payload) => ipcRenderer.invoke('comfy-fetch-logs', payload),
  // Local ComfyUI (comfy-local.ts)
  comfyLocalStatus: () => ipcRenderer.invoke('comfy-local-status'),
  comfyLocalPickFolder: () => ipcRenderer.invoke('comfy-local-pick-folder'),
  comfyLocalConnect: () => ipcRenderer.invoke('comfy-local-connect'),
  comfyLocalShutdown: () => ipcRenderer.invoke('comfy-local-shutdown'),
  comfyLocalSetPersist: (on) => ipcRenderer.invoke('comfy-local-set-persist', on),
  // Network relay for the Android app (local-relay.ts)
  comfyRelayStatus: () => ipcRenderer.invoke('comfy-relay-status'),
  comfyRelaySet: (payload) => ipcRenderer.invoke('comfy-relay-set', payload),
  onPreviewFrame: (callback) => ipcRenderer.on('preview-frame', callback),
  onGenProgress: (callback) => ipcRenderer.on('gen-progress', callback),
  onComfyLog: (callback) => ipcRenderer.on('comfy-log', callback)
});
