import { btnHelp, helpModal, helpToc, helpTocToggle, helpContent, helpCloseBtn } from './dom';
import { getString, setString } from './storage';
import { HELP_SECTIONS } from './help-docs';
import { initInfoButtons, positionMenu, addContextMenuItem } from './shared-ui';
import { iconize } from './icons';

const HELP_LAST_SECTION_KEY = 'dts-help-last-section';

function renderToc(activeId: string): void {
  helpToc.innerHTML = '';
  const heading = document.createElement('div');
  heading.className = 'help-toc-title';
  heading.textContent = 'Contents';
  helpToc.appendChild(heading);
  for (const sec of HELP_SECTIONS) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'help-toc-item' + (sec.id === activeId ? ' active' : '');
    item.textContent = sec.title;
    item.addEventListener('click', () => showSection(sec.id));
    helpToc.appendChild(item);
  }
}

function showSection(id: string): void {
  const sec = HELP_SECTIONS.find(s => s.id === id) || HELP_SECTIONS[0];
  helpContent.innerHTML = `<h2>${sec.title}</h2>${sec.html}`;
  iconize(helpContent);
  helpContent.scrollTop = 0;
  initInfoButtons(helpContent);
  renderToc(sec.id);
  try { setString(HELP_LAST_SECTION_KEY, sec.id); } catch {}
}

function openHelp(): void {
  let last = HELP_SECTIONS[0].id;
  try { last = getString(HELP_LAST_SECTION_KEY) || last; } catch {}
  if (!HELP_SECTIONS.some(s => s.id === last)) last = HELP_SECTIONS[0].id;
  showSection(last);
  helpModal.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => helpModal.classList.add('modal-visible')));
}

function closeHelp(): void {
  helpModal.classList.remove('modal-visible');
  setTimeout(() => { helpModal.style.display = 'none'; }, 160);
}

let tocMenuEl: HTMLElement | null = null;
function closeTocMenu(): void {
  if (tocMenuEl) { tocMenuEl.remove(); tocMenuEl = null; }
  document.removeEventListener('click', onTocMenuOutsideClick, true);
}
function onTocMenuOutsideClick(ev: MouseEvent): void {
  if (tocMenuEl && !tocMenuEl.contains(ev.target as Node) && ev.target !== helpTocToggle) closeTocMenu();
}
function openTocMenu(activeId: string): void {
  closeTocMenu();
  const menu = document.createElement('div');
  menu.className = 'ctx-menu';
  for (const sec of HELP_SECTIONS) {
    addContextMenuItem(menu, sec.title, () => {
      closeTocMenu();
      showSection(sec.id);
    }, { className: sec.id === activeId ? 'active' : '' });
  }
  document.body.appendChild(menu);
  tocMenuEl = menu;
  const rect = helpTocToggle.getBoundingClientRect();
  positionMenu(menu, rect.left, rect.bottom + 4);
  setTimeout(() => document.addEventListener('click', onTocMenuOutsideClick, true), 0);
}

export function initHelp(): void {
  btnHelp.addEventListener('click', openHelp);
  helpCloseBtn.addEventListener('click', closeHelp);
  helpTocToggle.addEventListener('click', (ev: MouseEvent) => {
    ev.stopPropagation();
    if (tocMenuEl) { closeTocMenu(); return; }
    let last = HELP_SECTIONS[0].id;
    try { last = getString(HELP_LAST_SECTION_KEY) || last; } catch {}
    openTocMenu(last);
  });
  helpModal.addEventListener('click', (ev: MouseEvent) => { if (ev.target === helpModal) closeHelp(); });
  document.addEventListener('keydown', (ev: KeyboardEvent) => {
    if (ev.key === 'Escape' && helpModal.style.display !== 'none') closeHelp();
  });
}
