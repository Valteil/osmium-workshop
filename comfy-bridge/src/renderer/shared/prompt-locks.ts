// Locked prompt fields (both shells). A lock button on a prompt box's label
// keeps that box's text through "Clear all prompt fields" and through every
// generation import (full or prompts only; gallery, Import Generation, the
// Metadata tab): the shell snapshots the locked boxes before it writes the
// form (keepLockedPrompts) and puts them back after. Which boxes are locked
// is per device, in localStorage.
import { bridgeIcon } from './icons';

const LOCKS_KEY = 'bridge.promptLocks';
const locked = new Set<string>();
const fields: HTMLTextAreaElement[] = [];

function loadLocks(): void {
  try {
    const v = JSON.parse(localStorage.getItem(LOCKS_KEY) || '[]');
    if (Array.isArray(v)) for (const id of v) if (typeof id === 'string') locked.add(id);
  } catch { /* best effort */ }
}
function saveLocks(): void {
  try { localStorage.setItem(LOCKS_KEY, JSON.stringify([...locked])); } catch { /* best effort */ }
}

// Adds the button to each box's <label> (the element right before it).
export function initPromptLocks(boxes: HTMLTextAreaElement[]): void {
  loadLocks();
  for (const box of boxes) {
    const label = box.previousElementSibling;
    if (!(label instanceof HTMLLabelElement)) continue;
    fields.push(box);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prompt-lock';
    const paint = (): void => {
      const on = locked.has(box.id);
      btn.innerHTML = bridgeIcon(on ? 'lock' : 'unlock');
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', String(on));
      btn.title = on
        ? 'Locked: Clear all and imported generations leave this box alone. Click to unlock.'
        : 'Lock this box so Clear all and imported generations leave its text alone.';
      box.classList.toggle('prompt-locked', on);
    };
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (locked.has(box.id)) locked.delete(box.id); else locked.add(box.id);
      saveLocks();
      paint();
    });
    label.classList.add('prompt-lock-label');
    label.appendChild(btn);
    paint();
  }
}

export function isPromptLocked(box: HTMLTextAreaElement): boolean {
  return locked.has(box.id);
}

// Snapshot the locked boxes now; the returned function writes them back.
export function keepLockedPrompts(): () => void {
  const kept = fields.filter((b) => locked.has(b.id)).map((b) => [b, b.value] as const);
  return () => { for (const [b, v] of kept) b.value = v; };
}
