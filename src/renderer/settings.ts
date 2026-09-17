import './global-types';
import { fontSizeSlider, fontSizeVal, settingsPanel } from './dom';
import {
  favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel
} from './dom';

export function applyAppZoom(factor: number): Promise<void> {
  if (window.electronAPI && window.electronAPI.setZoomFactor) {
    return window.electronAPI.setZoomFactor(factor);
  }
  return Promise.resolve();
}

export function resetAppZoom(): void {
  applyAppZoom(1);
  if (fontSizeSlider) {
    fontSizeSlider.value = '14';
  }
  if (fontSizeVal) {
    fontSizeVal.textContent = '14px';
  }
  try { localStorage.setItem('dts-font-size', '14'); } catch {}
}

export function getOutsideClosablePanels(): HTMLElement[] {
  return [favoritesPanel, themeCustomPanel, logPanel, achievementsPanel, shopPanel, tagDetailsPanel, settingsPanel];
}

export const SETTINGS_SECTIONS_KEY = 'dts-settings-sections-expanded';
export function saveSettingsSectionState(state: Record<string, boolean>): void {
  try { localStorage.setItem(SETTINGS_SECTIONS_KEY, JSON.stringify(state)); } catch {}
}
