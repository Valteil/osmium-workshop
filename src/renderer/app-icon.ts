// App icon picker (Settings → Appearance → App icon): the default Osmium icon
// or any owned theme's icon. The icons are pre-rendered .ico files
// (build/theme-icons/<theme>.ico, from scripts/render-theme-icons.js) and the
// main process applies and remembers the choice (main.ts "set-app-icon").
//
// Deliberately a user choice, not tied to the current theme: re-pointing the
// taskbar icon on every theme switch made Windows move the button to the end
// of the taskbar. Desktop only: the web demo and the Android shim have no
// setAppIcon (and Android can't swap its launcher icon at runtime), so the
// row is hidden there.

import { getString, setString } from './storage';
import { buildPersistentDropdown } from './shared-ui';

const APP_ICON_KEY = 'dts-app-icon';

export interface AppIconDeps {
  row: HTMLElement;
  container: HTMLElement;
  themeSelect: HTMLSelectElement;
  isOwned: (theme: string) => boolean;
}

export function initAppIcon(deps: AppIconDeps): { refresh: () => void } {
  const setAppIcon = window.electronAPI?.setAppIcon;
  if (typeof setAppIcon !== 'function') {
    deps.row.style.display = 'none';
    return { refresh: () => {} };
  }
  let current = getString(APP_ICON_KEY) || '';
  function refresh(): void {
    const options = [{ value: '', label: 'Default' }];
    for (const opt of Array.from(deps.themeSelect.options)) {
      if (opt.value === 'custom' || !deps.isOwned(opt.value)) continue;
      options.push({ value: opt.value, label: (opt.textContent || opt.value).replace(/^🔒\s*/, '') });
    }
    buildPersistentDropdown(deps.container, options, () => current, (val) => {
      if (val === current) return;
      current = val;
      setString(APP_ICON_KEY, val);
      void setAppIcon!(val);
    });
  }
  refresh();
  return { refresh };
}
