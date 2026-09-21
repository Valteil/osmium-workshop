// Shared model/option picker modal — same tap-to-pick UI Comfy Bridge uses
// for its model fields. Model inputs here are readonly tap-targets, not
// free-text fields: attachListAutocomplete's inline dropdown only ever
// triggered on typed input, so clicking an empty field showed nothing.
// A modal with its own search box sidesteps that entirely and matches the
// picker pattern users already know from Comfy Bridge.
export function openPickerModal(
  title: string,
  options: string[],
  current: string,
  onPick: (val: string) => void
): void {
  const backdrop = document.createElement('div');
  backdrop.className = 'picker-backdrop';
  const box = document.createElement('div');
  box.className = 'picker-box';
  const head = document.createElement('div');
  head.className = 'picker-head';
  const titleEl = document.createElement('span');
  titleEl.textContent = title;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'picker-close';
  closeBtn.textContent = '×';
  closeBtn.title = 'Close';
  head.appendChild(titleEl);
  head.appendChild(closeBtn);
  const search = document.createElement('input');
  search.type = 'text';
  search.placeholder = 'Search…';
  search.className = 'picker-search';
  const list = document.createElement('div');
  list.className = 'picker-list';
  box.appendChild(head);
  box.appendChild(search);
  box.appendChild(list);
  backdrop.appendChild(box);

  function close(): void {
    backdrop.classList.remove('modal-visible');
    setTimeout(() => backdrop.remove(), 160);
    document.removeEventListener('keydown', onKey);
  }
  function onKey(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') close();
  }
  function renderRows(): void {
    const raw = search.value.trim().toLowerCase();
    let matches: string[];
    if (!raw) {
      matches = options.slice();
    } else {
      const starts: string[] = [];
      const subs: string[] = [];
      for (const o of options) {
        const lower = o.toLowerCase();
        if (lower.startsWith(raw)) starts.push(o);
        else if (lower.includes(raw)) subs.push(o);
      }
      matches = starts.concat(subs);
    }
    list.innerHTML = '';
    const clearRow = document.createElement('div');
    clearRow.className = 'picker-row picker-clear';
    clearRow.textContent = '— Clear —';
    clearRow.addEventListener('click', () => {
      onPick('');
      close();
    });
    list.appendChild(clearRow);
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'picker-empty';
      empty.textContent = raw ? 'No matches.' : 'No options yet — try refreshing model lists.';
      list.appendChild(empty);
    } else {
      for (const val of matches) {
        const row = document.createElement('div');
        row.className = 'picker-row' + (val === current ? ' picked' : '');
        row.textContent = val;
        row.addEventListener('click', () => {
          onPick(val);
          close();
        });
        list.appendChild(row);
      }
    }
  }
  search.addEventListener('input', renderRows);
  backdrop.addEventListener('click', (ev: MouseEvent) => {
    if (ev.target === backdrop) close();
  });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', onKey);
  renderRows();
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.classList.add('modal-visible');
    search.focus();
  }));
}

export function attachPickerModal(
  inputEl: HTMLInputElement,
  title: string,
  getOptions: () => string[]
): void {
  inputEl.readOnly = true;
  inputEl.addEventListener('click', () => {
    openPickerModal(title, getOptions() || [], inputEl.value, (v: string) => {
      inputEl.value = v;
      inputEl.dispatchEvent(new Event('input', { bubbles: true }));
      inputEl.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}
