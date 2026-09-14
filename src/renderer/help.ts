// Phase B module: the in-app Help & Documentation panel (❓ Help, far right
// of the top bar). A table-of-contents on the left picks which section is
// shown, one at a time, in the content pane on the right — the actual
// documentation text lives in help-docs.ts, this module is only the viewer
// (render TOC, swap content, remember the last section, open/close).
// @ts-nocheck
import { btnHelp, helpModal, helpToc, helpContent, helpCloseBtn } from './dom';
import { HELP_SECTIONS } from './help-docs';
import { initInfoButtons } from './shared-ui';

const HELP_LAST_SECTION_KEY = 'dts-help-last-section';

function renderToc(activeId){
  helpToc.innerHTML = '';
  const heading = document.createElement('div');
  heading.className = 'help-toc-title';
  heading.textContent = 'Contents';
  helpToc.appendChild(heading);
  for (const sec of HELP_SECTIONS){
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'help-toc-item' + (sec.id === activeId ? ' active' : '');
    item.textContent = sec.title;
    item.addEventListener('click', () => showSection(sec.id));
    helpToc.appendChild(item);
  }
}

function showSection(id){
  const sec = HELP_SECTIONS.find(s => s.id === id) || HELP_SECTIONS[0];
  helpContent.innerHTML = `<h2>${sec.title}</h2>${sec.html}`;
  helpContent.scrollTop = 0;
  initInfoButtons(helpContent);
  renderToc(sec.id);
  try { localStorage.setItem(HELP_LAST_SECTION_KEY, sec.id); } catch(e){}
}

function openHelp(){
  let last = HELP_SECTIONS[0].id;
  try { last = localStorage.getItem(HELP_LAST_SECTION_KEY) || last; } catch(e){}
  if (!HELP_SECTIONS.some(s => s.id === last)) last = HELP_SECTIONS[0].id;
  showSection(last);
  helpModal.style.display = 'flex';
  requestAnimationFrame(() => requestAnimationFrame(() => helpModal.classList.add('modal-visible')));
}

function closeHelp(){
  helpModal.classList.remove('modal-visible');
  setTimeout(() => { helpModal.style.display = 'none'; }, 160);
}

export function initHelp(){
  btnHelp.addEventListener('click', openHelp);
  helpCloseBtn.addEventListener('click', closeHelp);
  helpModal.addEventListener('click', (ev) => { if (ev.target === helpModal) closeHelp(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && helpModal.style.display !== 'none') closeHelp();
  });
}
