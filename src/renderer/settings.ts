// Phase B module 5/N: small self-contained settings-panel helpers. Most of
// the actual settings-panel wiring (toggles, tooltips, discrete mode) stays
// in index.ts for now — it's deeply interleaved with state and other
// domains' functions (renderCurrentView, wallet, etc.) and doesn't factor
// cleanly yet. Only the genuinely standalone pieces moved here.
// @ts-nocheck — real types land once index.ts itself is typed.
import { fontSizeSlider, fontSizeVal, settingsPanel } from './dom';
import {
  favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel
} from './dom';

// Native Electron/Chromium page zoom (same mechanism as Ctrl+/Ctrl-/Ctrl+0
// in any Chromium browser) — operates at the compositor level, so vw/vh/%
// all stay consistent automatically. This replaced an earlier CSS `zoom`
// approach that reliably caused overflow no matter how it was compensated,
// since CSS zoom scales an element's own box independently of its parent.
export function applyAppZoom(factor){
  if (window.electronAPI && window.electronAPI.setZoomFactor){
    window.electronAPI.setZoomFactor(factor);
  }
}

export function resetAppZoom(){
  applyAppZoom(1);
  if (fontSizeSlider){
    fontSizeSlider.value = '14';
  }
  if (fontSizeVal){
    fontSizeVal.textContent = '14px';
  }
  try { localStorage.setItem('dts-font-size', '14'); } catch(e){}
}

export function getOutsideClosablePanels(){
  return [favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel, settingsPanel];
}

const SETTINGS_SECTIONS_KEY = 'dts-settings-sections-expanded';
export function saveSettingsSectionState(state){
  try { localStorage.setItem(SETTINGS_SECTIONS_KEY, JSON.stringify(state)); } catch(e){}
}
export { SETTINGS_SECTIONS_KEY };

export function applyCustomFont(fontName){
  if (fontName){
    const currentSans = getComputedStyle(document.documentElement).getPropertyValue('--sans').trim() || 'sans-serif';
    const currentMono = getComputedStyle(document.documentElement).getPropertyValue('--mono').trim() || 'monospace';
    document.documentElement.style.setProperty('--sans', `'${fontName}', ${currentSans}`);
    document.documentElement.style.setProperty('--mono', `'${fontName}', ${currentMono}`);
  } else {
    document.documentElement.style.removeProperty('--sans');
    document.documentElement.style.removeProperty('--mono');
  }
}
