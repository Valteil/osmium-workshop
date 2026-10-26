# Third-party notices

Osmium Workshop and Comfy Bridge are MIT licensed (see `LICENSE`, © 2026 Valteil). They include or
build on the following work by others, under these licenses.

## Bundled in the apps

| Component | Used in | License | Copyright |
|---|---|---|---|
| [Electron](https://www.electronjs.org/) / Chromium | Windows apps | MIT / BSD and others | GitHub Inc. and the Electron contributors; The Chromium Authors. Full texts ship in each zip as `LICENSE.electron.txt` and `LICENSES.chromium.html`. |
| [onnxruntime-node](https://github.com/microsoft/onnxruntime) | Osmium (WD14, Bucket Images) | MIT | Microsoft Corporation |
| [ws](https://github.com/websockets/ws) | Osmium, Comfy Bridge | MIT | 2011 Einar Otto Stangvik; 2013 Arnout Kazemier and contributors; 2016 Luigi Pinca and contributors |
| [Capacitor](https://capacitorjs.com/) (`@capacitor/*`) | Comfy Bridge for Android | MIT | 2017-present Drifty Co.; 2025 Ionic |
| Fonts in `renderer/fonts/` | All apps | SIL Open Font License 1.1 | Their authors; see `renderer/fonts/OFL.md` |
| [Comfyui-Anima-Regional-Conditioning](https://github.com/Sen-sou/Comfyui-Anima-Regional-Conditioning) (`local-comfy/anima_regional/nodes.py`, also in the node pack) | Osmium, Comfy Bridge (Osmium Comfy's regional prompt) | MIT (its `LICENSE` beside it) | 2026 Vikas Vishwakarma |

## Code ported or adapted

- **Bucket Images' crop** (`src/bucket-local.ts`) is ported from the SmartCropper in
  [Anima-TrainFlow](https://github.com/ThetaCursed/Anima-TrainFlow)'s `app.py`.
  MIT License, Copyright (c) 2026 ThetaCursed (full text below).
- **Tag categories** (`src/renderer/tag-categories-data.ts`) are compiled from a snapshot of
  [Danbooru](https://danbooru.donmai.us/)'s tag-group wiki pages.
- Comfy Bridge's **LoRA training metadata** view takes its layout from Xypher7's
  [lora-metadata-viewer](https://github.com/Xypher7/lora-metadata-viewer) (layout only; no code copied).

## Downloaded by the apps when you use a feature

- **u2net** (Bucket Images): Apache License 2.0, Copyright (c) Xuebin Qin et al.
  ([U-2-Net](https://github.com/xuebinqin/U-2-Net)). Mirrored as a release file on v1.8.0.
- **WD14 tagger models**: SmilingWolf's taggers on Hugging Face, Apache License 2.0.
- Comfy Bridge and the local tagging/generation runner work with **your own ComfyUI install**
  (GPL-3.0). No ComfyUI code ships with Osmium or Comfy Bridge.

## Separate release files

- **`ComfyUI-DataSetManagerNodes.zip`**: each node folder keeps its own license and credits (see the
  `LICENSE` files inside).
- **`Anima-TrainFlow-Osmium-<version>.zip`**: Anima-TrainFlow, MIT, Copyright (c) 2026 ThetaCursed
  (its `LICENSE`), with [sd-scripts](https://github.com/kohya-ss/sd-scripts) v0.12.0 (Apache License
  2.0, kohya-ss; `training/sd-scripts/LICENSE.md`) and an embedded Python (PSF License,
  `python_embeded/LICENSE.txt`). Its `Install_Requirements.bat` downloads PyTorch and other packages
  from PyPI and the PyTorch index; each comes with its own license.

## MIT License (Anima-TrainFlow)

```
MIT License

Copyright (c) 2026 ThetaCursed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
