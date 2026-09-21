// Small hand-written Markdown -> HTML renderer for the two sister pages
// (guide.html, readme.html). Not a general CommonMark implementation —
// covers exactly the subset README.md/USER_GUIDE.md actually use (headings,
// paragraphs, bold/italic/code spans, links, images, unordered/ordered
// lists, fenced code blocks, tables, blockquotes, hr) so the site can
// render the repo's own source-of-truth docs directly instead of a
// hand-copied transcription that drifts stale the next time either file
// changes. No CDN dependency, matching the rest of this site.
(function(){
  function escapeHtml(s){
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Inline spans: code, bold, italic, images, links — order matters (code
  // first so markup inside a code span isn't itself interpreted).
  function renderInline(text){
    let out = escapeHtml(text);
    out = out.replace(/`([^`]+)`/g, (m, code) => `<code>${code}</code>`);
    out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, src) => {
      const resolved = /^https?:\/\//.test(src) ? src : 'assets/' + src.replace(/^build\//, '');
      return `<img src="${resolved}" alt="${alt}" loading="lazy" />`;
    });
    out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
      // Relative .md links between the two sister docs resolve to their
      // sibling page; in-page #anchors and external links pass through.
      let resolved = href;
      if (/^README\.md/.test(href)) resolved = 'readme.html' + href.slice('README.md'.length);
      else if (/^USER_GUIDE\.md/.test(href)) resolved = 'guide.html' + href.slice('USER_GUIDE.md'.length);
      const external = /^https?:\/\//.test(resolved);
      return `<a href="${resolved}"${external ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
    });
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
    return out;
  }

  function slugify(text){
    return text.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
  }

  function renderTable(rows){
    const header = rows[0];
    const body = rows.slice(2); // rows[1] is the |---|---| separator
    let html = '<table><thead><tr>';
    for (const cell of header) html += `<th>${renderInline(cell)}</th>`;
    html += '</tr></thead><tbody>';
    for (const row of body){
      html += '<tr>';
      for (const cell of row) html += `<td>${renderInline(cell)}</td>`;
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  function splitTableRow(line){
    return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
  }

  function render(md){
    const lines = md.replace(/\r\n/g, '\n').split('\n');
    let html = '';
    let i = 0;
    let listStack = null; // 'ul' | 'ol' | null — single-level lists only (matches source files)

    function closeList(){
      if (listStack){ html += `</${listStack}>`; listStack = null; }
    }

    while (i < lines.length){
      const line = lines[i];

      if (/^```/.test(line)){
        closeList();
        const lang = line.slice(3).trim();
        const codeLines = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i])){ codeLines.push(lines[i]); i++; }
        i++; // skip closing fence
        html += `<pre><code${lang ? ` class="lang-${lang}"` : ''}>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
        continue;
      }

      if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1])){
        closeList();
        const rows = [splitTableRow(line)];
        i++;
        rows.push(splitTableRow(lines[i])); // separator, kept as rows[1] for renderTable's slice
        i++;
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])){ rows.push(splitTableRow(lines[i])); i++; }
        html += renderTable(rows);
        continue;
      }

      const h = line.match(/^(#{1,4})\s+(.*)$/);
      if (h){
        closeList();
        const level = h[1].length;
        const text = h[2].trim();
        html += `<h${level} id="${slugify(text)}">${renderInline(text)}</h${level}>`;
        i++;
        continue;
      }

      if (/^-{3,}\s*$/.test(line)){
        closeList();
        html += '<hr>';
        i++;
        continue;
      }

      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ul || ol){
        const kind = ul ? 'ul' : 'ol';
        if (listStack !== kind){ closeList(); html += `<${kind}>`; listStack = kind; }
        const itemLines = [(ul || ol)[1]];
        i++;
        // A source line that wraps a list item onto the next physical line
        // (indented continuation text, no bullet/number of its own) belongs
        // to THIS <li>, not a fresh paragraph — without this, a wrapped
        // bullet like USER_GUIDE.md's multi-line entries split into a
        // truncated list item followed by a stray floating <p>.
        while (
          i < lines.length &&
          !/^\s*$/.test(lines[i]) &&
          !/^\s*[-*]\s+/.test(lines[i]) &&
          !/^\s*\d+\.\s+/.test(lines[i]) &&
          !/^#{1,4}\s/.test(lines[i]) &&
          !/^```/.test(lines[i])
        ){
          itemLines.push(lines[i].trim());
          i++;
        }
        html += `<li>${itemLines.map(renderInline).join(' ')}</li>`;
        continue;
      }

      const bq = line.match(/^>\s?(.*)$/);
      if (bq){
        closeList();
        const bqLines = [bq[1]];
        i++;
        while (i < lines.length && /^>\s?/.test(lines[i])){ bqLines.push(lines[i].replace(/^>\s?/, '')); i++; }
        html += `<blockquote><p>${bqLines.map(renderInline).join('<br>')}</p></blockquote>`;
        continue;
      }

      if (/^\s*$/.test(line)){ closeList(); i++; continue; }

      // Plain paragraph — consume until a blank line or the start of a
      // block-level construct, so a multi-line paragraph in the source
      // renders as one <p> instead of one per physical line.
      closeList();
      const paraLines = [line];
      i++;
      while (
        i < lines.length &&
        !/^\s*$/.test(lines[i]) &&
        !/^#{1,4}\s/.test(lines[i]) &&
        !/^```/.test(lines[i]) &&
        !/^\s*[-*]\s+/.test(lines[i]) &&
        !/^\s*\d+\.\s+/.test(lines[i]) &&
        !/^-{3,}\s*$/.test(lines[i]) &&
        !/^>\s?/.test(lines[i]) &&
        !/^\s*\|.*\|\s*$/.test(lines[i])
      ){
        paraLines.push(lines[i]);
        i++;
      }
      html += `<p>${paraLines.map(renderInline).join(' ')}</p>`;
    }
    closeList();
    return html;
  }

  window.renderMarkdown = render;
})();
