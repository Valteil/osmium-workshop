"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerWd14LocalHandlers = registerWd14LocalHandlers;
exports.listModels = listModels;
exports.deleteModel = deleteModel;
exports.downloadModel = downloadModel;
exports.tagImage = tagImage;
exports.pickImportFiles = pickImportFiles;
exports.importModel = importModel;
// Desktop's answer to mobile's DtsWd14Plugin.kt (ONNX Runtime Android) —
// on-device WD14 tagging via onnxruntime-node, so a user never needs
// ComfyUI running just to tag images. Ported from that Kotlin file as
// closely as the two platforms' APIs allow; see this file's own comments
// for the couple of places that genuinely differ (input-size discovery,
// execution provider choice).
//
// The renderer-facing contract (list/delete/download/tagImage, and the
// {ok,tagsCsv}/{ok:false,error} shape tagImage returns) is fixed by
// src/renderer/wd14-tagger.ts and mobile/mobile-shim.js's window.Wd14Local
// — both already exist and work; this module plus wd14-local-bridge.ts on
// the renderer side just need to satisfy the same contract for desktop.
//
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const onnxruntime_node_1 = require("onnxruntime-node");
function modelsDir() {
    const dir = path.join(electron_1.app.getPath('userData'), 'wd14_models');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}
function modelDir(name) { return path.join(modelsDir(), name); }
async function listModels() {
    const dir = modelsDir();
    const names = fs.readdirSync(dir).filter((n) => !n.endsWith('.downloading'));
    const models = [];
    for (const name of names) {
        const modelPath = path.join(modelDir(name), 'model.onnx');
        const tagsPath = path.join(modelDir(name), 'tags.csv');
        if (!fs.existsSync(modelPath) || !fs.existsSync(tagsPath))
            continue;
        let tagCount = 0;
        try {
            tagCount = Math.max(0, fs.readFileSync(tagsPath, 'utf8').split(/\r?\n/).filter(Boolean).length - 1);
        }
        catch (err) { /* leave 0 */ }
        // Reaching here means both files exist, so the pair is complete.
        models.push({ name, sizeBytes: fs.statSync(modelPath).size, tagCount, hasOnnx: true, hasCsv: true });
    }
    return models;
}
function deleteModel(name) {
    sessionCache.delete(name + '|cpu');
    sessionCache.delete(name + '|dml');
    sessionCache.delete(name); // pre-provider cache shape, belt and suspenders
    tagsCache.delete(name);
    fs.rmSync(modelDir(name), { recursive: true, force: true });
}
// Desktop-only escape hatch for a user who already has a WD14 model
// downloaded for their own ComfyUI (e.g. ComfyUI-WD14-Tagger's own models/
// folder) — no reason to make them re-download the same .onnx/.csv pair a
// second time just to use it on-device. Two-step, mirroring downloadModel's
// own shape: this only picks+validates the files and reports back a
// proposed name; the actual copy (importModel below) is a separate call so
// the renderer can run its own name-collision confirm first, the same way
// downloadRepo() in wd14-tagger.ts already does before downloadModel().
async function pickImportFiles(browserWindow) {
    const opts = {
        title: 'Pick this model\'s .onnx file and its tags .csv (select both at once)',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'WD14 model files', extensions: ['onnx', 'csv'] }]
    };
    const res = browserWindow
        ? await electron_1.dialog.showOpenDialog(browserWindow, opts)
        : await electron_1.dialog.showOpenDialog(opts);
    if (res.canceled || !res.filePaths || res.filePaths.length === 0)
        return { canceled: true };
    const modelPath = res.filePaths.find((p) => p.toLowerCase().endsWith('.onnx'));
    const tagsPath = res.filePaths.find((p) => p.toLowerCase().endsWith('.csv'));
    if (!modelPath || !tagsPath || res.filePaths.length !== 2) {
        throw new Error('Pick exactly one .onnx file and one .csv file together.');
    }
    const name = path.basename(modelPath, path.extname(modelPath));
    return { canceled: false, name, modelPath, tagsPath };
}
function importModel({ name, modelPath, tagsPath }) {
    sessionCache.delete(name + '|cpu');
    sessionCache.delete(name + '|dml');
    sessionCache.delete(name); // pre-provider cache shape, belt and suspenders
    tagsCache.delete(name);
    const dir = modelDir(name);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(modelPath, path.join(dir, 'model.onnx'));
    fs.copyFileSync(tagsPath, path.join(dir, 'tags.csv'));
}
// Plain Node http/https (same as main.ts's own comfyRequest) rather than a
// new HTTP dependency. Unlike the Kotlin side's HttpURLConnection, Node's
// http/https do NOT auto-follow redirects — HuggingFace's own
// resolve/main/<file> URLs redirect through a CDN host, so this has to
// chase Location headers by hand.
function fetchToFile(url, destPath, onPercent, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
        const lib = (url.startsWith('https:') ? https : http);
        const req = lib.get(url, (res) => {
            const status = res.statusCode ?? 0;
            if (status >= 300 && status < 400 && res.headers.location) {
                res.resume();
                if (redirectsLeft <= 0) {
                    reject(new Error('Too many redirects.'));
                    return;
                }
                const nextUrl = new URL(res.headers.location, url).toString();
                fetchToFile(nextUrl, destPath, onPercent, redirectsLeft - 1).then(resolve, reject);
                return;
            }
            if (status !== 200) {
                res.resume();
                reject(new Error(`HTTP ${status} downloading ${url}`));
                return;
            }
            const total = parseInt(res.headers['content-length'] || '0', 10);
            let downloaded = 0, lastPercent = -1;
            const file = fs.createWriteStream(destPath);
            res.on('data', (chunk) => {
                downloaded += chunk.length;
                if (total > 0 && onPercent) {
                    const percent = Math.floor((downloaded / total) * 100);
                    if (percent !== lastPercent) {
                        lastPercent = percent;
                        onPercent(percent);
                    }
                }
            });
            res.pipe(file);
            file.on('finish', () => file.close(() => resolve(undefined)));
            file.on('error', reject);
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(30000, () => req.destroy(new Error('Download timed out.')));
    });
}
// Same .downloading-temp-dir-then-rename pattern as the Kotlin plugin.
// Throws on failure (never resolves an {ok:false} shape) — downloadRepo()
// in wd14-tagger.ts wraps its own call in try/catch expecting exactly that.
async function downloadModel({ name, modelUrl, tagsUrl }, onProgress) {
    const tmpDir = modelDir(name) + '.downloading';
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
    try {
        await fetchToFile(modelUrl, path.join(tmpDir, 'model.onnx'), (percent) => {
            if (onProgress)
                onProgress({ name, part: 'model', percent });
        });
        await fetchToFile(tagsUrl, path.join(tmpDir, 'tags.csv'), (percent) => {
            if (onProgress)
                onProgress({ name, part: 'tags', percent });
        });
        fs.rmSync(modelDir(name), { recursive: true, force: true });
        fs.renameSync(tmpDir, modelDir(name));
    }
    catch (err) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        throw err;
    }
}
// SmilingWolf's whole v3 tagger lineup (the entire KNOWN_MODELS catalog in
// wd14-tagger.ts) is 448x448 — same fallback DtsWd14Plugin.kt uses when it
// can't read a session's own input shape. Unlike the Java ONNX Runtime
// binding mobile's plugin reads real shape info from
// (session.inputInfo.values.first().info), onnxruntime-node's JS API only
// exposes inputNames/outputNames — no dims — so per-model discovery isn't
// possible here the way it is on mobile. A manually-added model with a
// different native input size would need this adjusted (or real ONNX
// shape-parsing added as a follow-up); every built-in catalog entry works
// correctly with this default as-is.
const DEFAULT_INPUT_SIZE = 448;
// GPU via DirectML (runs on the NVIDIA card through DirectX 12 — the stock
// onnxruntime-node Windows package bundles DirectML.dll but no CUDA EP, and
// per its own README CUDA is Linux-only, so DirectML is the GPU path here).
// Sessions are cached per model+provider; a failed GPU bring-up falls back
// to CPU inside the same call rather than failing the batch.
const sessionCache = new Map();
async function loadSession(name, preferGpu) {
    const wantGpu = !!preferGpu;
    const key = name + '|' + (wantGpu ? 'dml' : 'cpu');
    const cachedSession = sessionCache.get(key);
    if (cachedSession)
        return cachedSession;
    const modelPath = path.join(modelDir(name), 'model.onnx');
    if (!fs.existsSync(modelPath))
        throw new Error(`Model "${name}" is not downloaded.`);
    let session = null;
    let provider = 'cpu';
    if (wantGpu) {
        try {
            session = await onnxruntime_node_1.InferenceSession.create(modelPath, { executionProviders: ['dml'] });
            provider = 'dml';
        }
        catch (err) {
            session = null; // GPU bring-up failed — fall through to CPU below
        }
    }
    if (!session)
        session = await onnxruntime_node_1.InferenceSession.create(modelPath);
    const entry = { session, provider };
    sessionCache.set(key, entry);
    return entry;
}
const tagsCache = new Map();
function loadTags(name) {
    const cachedTags = tagsCache.get(name);
    if (cachedTags)
        return cachedTags;
    const lines = fs.readFileSync(path.join(modelDir(name), 'tags.csv'), 'utf8').split(/\r?\n/).filter(Boolean);
    const header = lines[0].split(',');
    const nameIdx = header.indexOf('name') !== -1 ? header.indexOf('name') : 1;
    const catIdx = header.indexOf('category') !== -1 ? header.indexOf('category') : 2;
    const tags = lines.slice(1).map((line) => {
        const cols = line.split(',');
        return { name: cols[nameIdx], category: parseInt(cols[catIdx], 10) };
    });
    tagsCache.set(name, tags);
    return tags;
}
// Pad to a centered square on WHITE, resize, write BGR/NHWC/raw-0-255-float
// — matches DtsWd14Plugin.kt's preprocess() exactly. Uses Electron's own
// nativeImage instead of a new image-processing dependency:
// nativeImage.toBitmap() already returns raw BGRA pixels (Skia's native
// format on every Electron platform), which is a more direct match for
// WD14's expected BGR order than an RGB-native library like sharp would be
// — just drop the alpha byte.
function preprocess(imageBuffer, size) {
    const img = electron_1.nativeImage.createFromBuffer(imageBuffer);
    const { width, height } = img.getSize();
    if (!width || !height)
        throw new Error('Could not decode this image.');
    const maxSide = Math.max(width, height);
    const srcBitmap = img.toBitmap(); // BGRA, width*height*4
    const squared = Buffer.alloc(maxSide * maxSide * 4, 0xff); // white BGRA
    const offsetX = Math.floor((maxSide - width) / 2);
    const offsetY = Math.floor((maxSide - height) / 2);
    for (let y = 0; y < height; y++) {
        const srcStart = y * width * 4;
        const destStart = ((y + offsetY) * maxSide + offsetX) * 4;
        srcBitmap.copy(squared, destStart, srcStart, srcStart + width * 4);
    }
    const squaredImg = electron_1.nativeImage.createFromBitmap(squared, { width: maxSide, height: maxSide });
    const resized = squaredImg.resize({ width: size, height: size, quality: 'best' });
    const finalBitmap = resized.toBitmap(); // BGRA, size*size*4
    const floatData = new Float32Array(size * size * 3);
    for (let i = 0, p = 0; i < finalBitmap.length; i += 4, p += 3) {
        floatData[p] = finalBitmap[i]; // B
        floatData[p + 1] = finalBitmap[i + 1]; // G
        floatData[p + 2] = finalBitmap[i + 2]; // R
    }
    return new onnxruntime_node_1.Tensor('float32', floatData, [1, size, size, 3]);
}
// Space -> underscore, literal ( ) escaped — matches the app's own caption-
// file tag format, same as DtsWd14Plugin.kt's escapeTag().
function escapeTag(name) {
    return name.replace(/ /g, '_').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
async function tagImage({ name, imageBytes, threshold, characterThreshold, preferGpu }) {
    const { session, provider } = await loadSession(name, preferGpu);
    const tags = loadTags(name);
    const inputTensor = preprocess(Buffer.from(imageBytes), DEFAULT_INPUT_SIZE);
    const feeds = { [session.inputNames[0]]: inputTensor };
    const results = await session.run(feeds);
    // Model output is ALREADY sigmoid-activated (SmilingWolf's WD14 ONNX
    // exports bake sigmoid into the graph's own final layer) — used as-is,
    // deliberately NOT re-applying sigmoid() here. Re-applying it was a real
    // bug on the mobile plugin: it compresses every score into ~0.5-0.73
    // regardless of real confidence, dumping nearly the whole vocabulary
    // (~8900 tags on one test image) instead of the normal 20-40.
    const scores = results[session.outputNames[0]].data;
    const picked = [];
    for (let i = 0; i < tags.length && i < scores.length; i++) {
        const tag = tags[i];
        if (tag.category === 9)
            continue; // rating — never included
        const cutoff = tag.category === 4 ? characterThreshold : threshold;
        if (scores[i] >= cutoff)
            picked.push(escapeTag(tag.name));
    }
    return { ok: true, tagsCsv: picked.join(', '), provider };
}
function registerWd14LocalHandlers(ipcMain) {
    ipcMain.handle('wd14-local-list-models', async () => listModels());
    ipcMain.handle('wd14-local-delete-model', async (_event, name) => deleteModel(name));
    ipcMain.handle('wd14-local-download-model', async (event, payload) => {
        await downloadModel(payload, (progress) => event.sender.send('wd14-local-download-progress', progress));
    });
    ipcMain.handle('wd14-local-tag-image', async (_event, payload) => {
        try {
            return await tagImage(payload);
        }
        catch (err) {
            return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }
    });
    ipcMain.handle('wd14-local-pick-import-files', async (event) => {
        return pickImportFiles(electron_1.BrowserWindow.fromWebContents(event.sender));
    });
    ipcMain.handle('wd14-local-import-model', async (_event, payload) => {
        importModel(payload);
    });
}
