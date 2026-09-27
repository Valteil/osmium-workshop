// Image Quicktagging: while Single view shows one image, the left panel's
// filter/dataset tools are swapped for a panel of common attribute tags as
// checkboxes, so they're one click instead of typed again and again (the same
// idea as Sequential tagging's panel). Every box is independent: ticking adds
// the tag to the current image, unticking removes it, and none is required
// or exclusive within its group. Changes go through addTagToEntry /
// removeTagFromEntry, so they're dirty-tracked and undoable like any edit.
//
// It isn't collapsible. It slides in from the left when Single view takes
// over the panel (#left.quicktag-on) and gives the panel back on leaving
// Single view, or during multi-compare / a sequential run. Desktop only in
// practice: touch has no Single view.

import type { Entry } from './types';

// Label = what the box says; tag = what gets written.
const QUICK_TAG_GROUPS: { label: string; items: [string, string][] }[] = [
  { label: 'Hair length', items: [['Short', 'short hair'], ['Medium', 'medium hair'], ['Long', 'long hair']] },
  { label: 'Breast size', items: [['Flat', 'flat chest'], ['Small', 'small breasts'], ['Medium', 'medium breasts'], ['Large', 'large breasts'], ['Gigantic', 'gigantic breasts']] },
  { label: 'Build', items: [['Slim', 'slim'], ['Plump', 'plump']] },
  { label: 'Legs', items: [['Thick thighs', 'thick thighs'], ['Slim legs', 'slim legs']] },
  { label: 'Gaze', items: [['Looking at viewer', 'looking at viewer'], ['Looking away', 'looking away']] }
];

const BREAST_SIZES = ['small breasts', 'medium breasts', 'large breasts', 'gigantic breasts'];

interface QuickTagDeps {
  leftPanel: HTMLElement;
  addTagToEntry: (entry: Entry, tag: string) => void;
  removeTagFromEntry: (entry: Entry, tag: string) => void;
  onChange: () => void;
}

let deps: QuickTagDeps | null = null;
let panel: HTMLElement | null = null;

export function initQuickTag(d: QuickTagDeps): void {
  deps = d;
  panel = document.createElement('div');
  panel.id = 'quickTagPanel';
  panel.className = 'quicktag-panel';
  deps.leftPanel.appendChild(panel);
}

export function showQuickTag(entry: Entry): void {
  if (!deps || !panel) return;
  deps.leftPanel.classList.add('quicktag-on');
  panel.innerHTML = '';

  const title = document.createElement('h3');
  title.className = 'panel-title';
  title.textContent = 'IMAGE QUICKTAGGING';
  panel.appendChild(title);
  const note = document.createElement('div');
  note.className = 'quicktag-note';
  note.textContent = 'Tick to add the tag to this image, untick to remove it.';
  panel.appendChild(note);

  const has = new Set(entry.tags);
  for (const group of QUICK_TAG_GROUPS){
    const block = document.createElement('div');
    block.className = 'quicktag-group';
    const head = document.createElement('div');
    head.className = 'quicktag-group-head';
    head.textContent = group.label;
    block.appendChild(head);
    const row = document.createElement('div');
    row.className = 'quicktag-options';
    for (const [label, tag] of group.items){
      const opt = document.createElement('label');
      opt.className = 'ach-toggle-row quicktag-option';
      opt.title = `Writes "${tag}"`;
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = has.has(tag);
      cb.addEventListener('change', () => {
        // A breast size ("small breasts" … "gigantic breasts") also writes the
        // general "breasts" tag, in the same undo step; "flat chest" doesn't.
        // Unticking removes only the size tag, unless that leaves no size and
        // Flat ticked: then "breasts" goes too (a flat chest isn't "breasts").
        if (cb.checked) deps!.addTagToEntry(entry, / breasts$/.test(tag) ? `${tag},breasts` : tag);
        else deps!.removeTagFromEntry(entry, tag);
        const sizes = BREAST_SIZES.some((t) => entry.tags.includes(t));
        if (!sizes && entry.tags.includes('flat chest') && entry.tags.includes('breasts')) deps!.removeTagFromEntry(entry, 'breasts');
        deps!.onChange(); // re-renders Single view, which redraws this panel from the real tags
      });
      const span = document.createElement('span');
      span.textContent = label;
      opt.append(cb, span);
      row.appendChild(opt);
    }
    block.appendChild(row);
    panel.appendChild(block);
  }
}

export function hideQuickTag(): void {
  if (!deps) return;
  deps.leftPanel.classList.remove('quicktag-on');
}
