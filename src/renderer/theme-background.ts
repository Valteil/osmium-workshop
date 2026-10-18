// Frutiger Aero's own gallery background: the user picks any image and it
// replaces the painted sky-over-hill ground (a photo of a hillside under a
// blue sky fits it best). The image is downscaled to at most MAX px on its
// long side and kept as a JPEG data URL in localStorage, so it survives
// restarts on every platform (desktop, Android, the site demo) with no file
// path to go stale. styles.css paints it through `--fa-user-bg` while
// `html.fa-user-bg` is set; the row only shows on Frutiger Aero.
import { getString, removeKey } from './storage';
import { toast } from './shared-ui';

const KEY = 'dts-fa-bg';
const MAX = 2560;

function apply(url: string): void {
  const root = document.documentElement;
  if (url){
    root.style.setProperty('--fa-user-bg', `url("${url}")`);
    root.classList.add('fa-user-bg');
  } else {
    root.style.removeProperty('--fa-user-bg');
    root.classList.remove('fa-user-bg');
  }
}

// Decoded from the file's bytes (not an object URL), the way the Android
// WebView pickers need it.
async function toDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, MAX / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)), h = Math.max(1, Math.round(bmp.height * k));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return c.toDataURL('image/jpeg', 0.86);
}

export function initThemeBackground(pickBtn: HTMLButtonElement, clearBtn: HTMLButtonElement, input: HTMLInputElement): void {
  const sync = () => { clearBtn.disabled = !getString(KEY); };
  apply(getString(KEY));
  sync();

  pickBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.value = ''; // so picking the same file again still fires
    if (!file) return;
    try {
      const url = await toDataUrl(file);
      try { localStorage.setItem(KEY, url); }
      catch { toast('That image is too large to keep. Try a smaller one.'); return; }
      apply(url);
      sync();
      toast('Frutiger Aero background set');
    } catch {
      toast("Couldn't read that image");
    }
  });
  clearBtn.addEventListener('click', () => {
    removeKey(KEY);
    apply('');
    sync();
    toast('Back to the hillside');
  });
}
