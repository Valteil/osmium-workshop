// Typed localStorage helpers. Every persisted pref in this app is a string, a
// JSON blob, an int, or a boolean flag, and the raw localStorage calls were
// wrapped in the same try/catch at ~100 call sites across the renderer. These
// collapse that: reads return the fallback on any failure (storage
// blocked/disabled/private-mode), writes are best-effort and non-fatal.

export function getString(key: string, fallback = ''): string {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; } catch { return fallback; }
}

export function setString(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* non-fatal */ }
}

export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return (parsed === null || parsed === undefined) ? fallback : (parsed as T);
  } catch { return fallback; }
}

export function setJSON(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* non-fatal */ }
}

// Only '0'/'1' are ever written for boolean flags, so one reader covers both
// conventions in this codebase: default-off (`=== '1'`) and default-on
// (`!== '0'`) — the latter by passing `fallback = true`.
export function getBool(key: string, fallback = false): boolean {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v === '1'; } catch { return fallback; }
}

export function setBool(key: string, value: boolean): void {
  try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* non-fatal */ }
}

export function getInt(key: string, fallback: number): number {
  try { const v = parseInt(localStorage.getItem(key) || '', 10); return Number.isNaN(v) ? fallback : v; } catch { return fallback; }
}

export function setInt(key: string, value: number): void {
  try { localStorage.setItem(key, String(value)); } catch { /* non-fatal */ }
}

export function removeKey(key: string): void {
  try { localStorage.removeItem(key); } catch { /* non-fatal */ }
}
