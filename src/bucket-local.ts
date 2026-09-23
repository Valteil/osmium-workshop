// Aspect-ratio bucketing for the Gallery's "Bucket Images" dock: crop each
// image to its closest training bucket (Anima-TrainFlow's scheme) using u2net
// saliency for a head-first crop, then resize to the bucket. Ported from
// Anima-TrainFlow's app.py SmartCropper.
//
// The main process holds NO path to the dataset — the folder is a
// FileSystemDirectoryHandle owned by the renderer — so the renderer reads each
// image's bytes, calls bucketImage() for the compute, and writes the returned
// PNG itself. Same split as wd14-local.ts.
//
// Decode/crop/resize/encode all go through Electron's nativeImage (Skia), so
// this needs no image library; onnxruntime-node runs the model.
// nativeImage.toBitmap() returns raw BGRA, which matches the BGR channel order
// Anima-TrainFlow's cv2-based preprocessing feeds u2net.
import { app, nativeImage } from 'electron';
import type { IpcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { InferenceSession, Tensor } from 'onnxruntime-node';
import { fetchToFile } from './http-download';
import { getValidBuckets, getBestBucket } from './bucket-core';
import type { BucketImagePayload } from './ipc-types';
import type { BucketImageResult, BucketModelStatus, BucketDownloadProgress } from './shared-types';

// GitHub's latest-release asset redirect. u2net.onnx is uploaded to the repo's
// releases as an asset named exactly "u2net.onnx"; fetchToFile follows the 302
// to the CDN by hand.
const U2NET_URL = 'https://github.com/Valteil/osmium-workshop/releases/latest/download/u2net.onnx';
const U2NET_INPUT = 320;

function modelsDir(): string { return path.join(app.getPath('userData'), 'bucket_models'); }
function modelPath(): string { return path.join(modelsDir(), 'u2net.onnx'); }

function modelStatus(): BucketModelStatus {
  try { return { present: true, sizeBytes: fs.statSync(modelPath()).size }; }
  catch { return { present: false }; }
}

async function downloadModel(onProgress?: (ev: BucketDownloadProgress) => void): Promise<void> {
  fs.mkdirSync(modelsDir(), { recursive: true });
  const tmp = modelPath() + '.downloading';
  fs.rmSync(tmp, { force: true });
  try {
    await fetchToFile(U2NET_URL, tmp, (percent) => { if (onProgress) onProgress({ percent }); });
    fs.rmSync(modelPath(), { force: true });
    fs.renameSync(tmp, modelPath());
  } catch (err) {
    fs.rmSync(tmp, { force: true });
    throw err;
  }
}

let session: InferenceSession | null = null;

// CPU only. A DirectML attempt was the first choice, for parity with
// wd14-local's GPU path — but u2net's graph hangs DirectML's session build in
// onnxruntime-node: it burns CPU instead of erroring, freezing the whole main
// process. u2net at 320x320 is fast enough on CPU for a one-off bucket batch.
async function loadSession(): Promise<InferenceSession> {
  if (session) return session;
  const p = modelPath();
  if (!fs.existsSync(p)) throw new Error('The u2net model has not been downloaded yet.');
  session = await InferenceSession.create(p);
  return session;
}

// One u2net forward pass over the downscaled image, returning the raw 320x320
// saliency mask. Preprocessing matches the trainer: resize to 320x320, /255,
// ImageNet mean/std applied in BGR order, NCHW.
async function saliencyMask(small: Electron.NativeImage): Promise<Float32Array> {
  const bmp = small.resize({ width: U2NET_INPUT, height: U2NET_INPUT, quality: 'good' }).toBitmap(); // BGRA
  const mean = [0.485, 0.456, 0.406], std = [0.229, 0.224, 0.225];
  const data = new Float32Array(3 * U2NET_INPUT * U2NET_INPUT);
  for (let i = 0, p = 0; i < bmp.length; i += 4, p += 3) {
    data[p] = (bmp[i] / 255 - mean[0]) / std[0];         // B
    data[p + 1] = (bmp[i + 1] / 255 - mean[1]) / std[1]; // G
    data[p + 2] = (bmp[i + 2] / 255 - mean[2]) / std[2]; // R
  }
  const sess = await loadSession();
  const tensor = new Tensor('float32', data, [1, 3, U2NET_INPUT, U2NET_INPUT]);
  const out = await sess.run({ [sess.inputNames[0]]: tensor });
  return out[sess.outputNames[0]].data as Float32Array;
}

// The trainer's SmartCropper.process_image crop box: threshold the mask, take
// the topmost salient row and the mean salient column, then centre a
// target-aspect window there (nudged down by 5% of its height). The mask's
// salient coordinates are mapped straight to the ORIGINAL image (mask row /
// 320 * h) — algebraically the same as the trainer's "resize the mask to the
// downscaled image, then divide by low_res_scale", minus a bilinear mask
// resize that only shifts the threshold by a pixel or two.
async function cropRect(img: Electron.NativeImage, w: number, h: number, tw: number, th: number): Promise<{ x: number; y: number; width: number; height: number }> {
  const lowResScale = 1024 / Math.max(h, w);
  const smallW = Math.max(1, Math.round(w * lowResScale));
  const smallH = Math.max(1, Math.round(h * lowResScale));
  const mask = await saliencyMask(img.resize({ width: smallW, height: smallH, quality: 'good' }));

  let minY = Infinity, sumX = 0, n = 0;
  for (let i = 0; i < U2NET_INPUT * U2NET_INPUT; i++) {
    if (mask[i] > 0.15) {
      const y = Math.floor(i / U2NET_INPUT), x = i % U2NET_INPUT;
      if (y < minY) minY = y;
      sumX += x;
      n++;
    }
  }
  let topY: number, centerX: number;
  if (n > 0) { topY = (minY / U2NET_INPUT) * h; centerX = (sumX / n / U2NET_INPUT) * w; }
  else { topY = Math.floor(h / 4); centerX = Math.floor(w / 2); } // trainer's no-salient-pixels fallback

  const scale = Math.max(tw / w, th / h);
  const cw = Math.min(w, Math.max(1, Math.round(tw / scale)));
  const ch = Math.min(h, Math.max(1, Math.round(th / scale)));
  const y = Math.max(0, Math.min(Math.round(topY - ch * 0.05), h - ch));
  const x = Math.max(0, Math.min(Math.round(centerX - cw / 2), w - cw));
  return { x, y, width: cw, height: ch };
}

async function bucketImage({ imageBytes, sideMin, sideMax, step }: BucketImagePayload): Promise<BucketImageResult> {
  try {
    const img = nativeImage.createFromBuffer(Buffer.from(imageBytes));
    const { width: w, height: h } = img.getSize();
    if (!w || !h) return { ok: false, error: 'Could not decode this image.' };

    const buckets = getValidBuckets(sideMin, sideMax, step);
    const [tw, th] = getBestBucket(w, h, buckets);

    let out: Electron.NativeImage;
    if (Math.abs((w / h) - (tw / th)) < 0.01) {
      out = img.resize({ width: tw, height: th, quality: 'best' });
    } else {
      out = img.crop(await cropRect(img, w, h, tw, th)).resize({ width: tw, height: th, quality: 'best' });
    }
    return { ok: true, pngBytes: new Uint8Array(out.toPNG()), bucket: [tw, th], provider: 'CPU' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function registerBucketLocalHandlers(ipcMain: IpcMain): void {
  ipcMain.handle('bucket-model-status', async () => modelStatus());
  ipcMain.handle('bucket-download-model', async (event) => {
    await downloadModel((progress) => event.sender.send('bucket-download-progress', progress));
  });
  ipcMain.handle('bucket-image', async (_event, payload: BucketImagePayload) => bucketImage(payload));
}

export { registerBucketLocalHandlers, modelStatus, downloadModel, bucketImage, U2NET_URL };
