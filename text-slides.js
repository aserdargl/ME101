(function (root) {
  const MAX_ROWS = 30;
  const MAX_COLUMNS = 12;
  const ALLOWED = new Set('P DIV BR STRONG B EM I U S UL OL LI H2 H3 BLOCKQUOTE TABLE THEAD TBODY TFOOT TR TH TD'.split(' '));
  const DROP = new Set('SCRIPT STYLE IFRAME OBJECT EMBED SVG MATH TEMPLATE FORM INPUT BUTTON IMG LINK META'.split(' '));
  const escape = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  /** Keeps editable text and tables while removing pasted scripts, styles and attributes. */
  function sanitize(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    function clean(node) {
      if (node.nodeType === 3) return escape(node.textContent);
      if (node.nodeType !== 1 || DROP.has(node.tagName)) return '';
      const content = Array.from(node.childNodes, clean).join('');
      if (!ALLOWED.has(node.tagName)) return content;
      const tag = node.tagName.toLowerCase();
      const spans = ['TD', 'TH'].includes(node.tagName) ? ['colspan', 'rowspan'].map(name => {
        const value = Number(node.getAttribute(name));
        return Number.isInteger(value) && value > 1 && value <= MAX_ROWS ? ` ${name}="${value}"` : '';
      }).join('') : '';
      return tag === 'br' ? '<br>' : `<${tag}${spans}>${content}</${tag}>`;
    }
    return Array.from(template.content.childNodes, clean).join('');
  }

  function isTextSlide(slide) { return typeof slide?.textSlideHtml === 'string'; }

  /** Produces a complete slide page using the existing isolated HTML renderer. */
  function documentFor(content, title, kicker) {
    return `<!doctype html><html lang="tr"><meta charset="utf-8"><title>${escape(title)}</title>
<style>body{margin:0;color:#263445;font:24px/1.5 system-ui;background:#fff}.page{box-sizing:border-box;width:960px;min-height:540px;padding:40px 48px}small{color:#786c5b;font-size:16px}h1{font-size:36px;line-height:1.2;margin:12px 0 28px}.text-slide-content{overflow-wrap:anywhere;white-space:pre-wrap}.text-slide-content p{margin:0 0 16px}table{width:100%;border-collapse:collapse;margin:16px 0;table-layout:fixed;white-space:normal}td,th{border:1px solid #b9c4ce;padding:10px;vertical-align:top;overflow-wrap:anywhere}th{background:#edf2f6;text-align:left}h2,h3{line-height:1.3}</style>
<body><main class="page"><small>${escape(kicker)}</small><h1>${escape(title)}</h1><div class="text-slide-content">${sanitize(content)}</div></main></body></html>`;
  }

  function create(week) {
    const slide = { title: 'Metin ve Tablo', kicker: week, defaultViewMode: 'web', html: '', textSlideHtml: '', pptSummaryBullets: [] };
    slide.htmlDocument = documentFor('', slide.title, week);
    return slide;
  }

  /** Binds a single visual editor; injected callback updates the surrounding preview. */
  function bind(editor, toolbar, onChange) {
    let savedRange = null;
    const status = toolbar.querySelector('[role="status"]');
    const changed = () => { status.textContent = ''; onChange(); };
    document.addEventListener('selectionchange', () => {
      const selection = window.getSelection();
      if (selection.rangeCount && editor.contains(selection.anchorNode) && editor.contains(selection.focusNode)) {
        savedRange = selection.getRangeAt(0).cloneRange();
      }
    });
    function restore() {
      editor.focus();
      const selection = window.getSelection();
      if (!savedRange || !editor.contains(savedRange.commonAncestorContainer)) {
        savedRange = document.createRange();
        savedRange.selectNodeContents(editor);
        savedRange.collapse(false);
      }
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    function insert(html) {
      restore();
      document.execCommand('insertHTML', false, html);
      changed();
    }
    toolbar.addEventListener('mousedown', event => {
      if (event.target.closest('button')) event.preventDefault();
    });
    toolbar.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      if (button.dataset.command) {
        restore();
        document.execCommand(button.dataset.command, false);
        changed();
      } else if (button.dataset.table === 'insert') {
        const rows = Number(toolbar.querySelector('[name="rows"]').value);
        const columns = Number(toolbar.querySelector('[name="columns"]').value);
        if (!Number.isInteger(rows) || rows < 1 || rows > MAX_ROWS || !Number.isInteger(columns) || columns < 1 || columns > MAX_COLUMNS) {
          status.textContent = `1–${MAX_ROWS} satır ve 1–${MAX_COLUMNS} sütun seçin.`;
          return;
        }
        insert(`<table><tbody>${Array.from({ length: rows }, () => `<tr>${'<td><br></td>'.repeat(columns)}</tr>`).join('')}</tbody></table><p><br></p>`);
      } else if (button.dataset.table) {
        restore();
        const node = window.getSelection().anchorNode;
        const cell = (node.nodeType === 1 ? node : node.parentElement).closest('td,th');
        const table = cell?.closest('table');
        if (!table || !editor.contains(table)) { status.textContent = 'Önce bir tablo hücresine tıklayın.'; return; }
        if (button.dataset.table === 'remove') table.remove();
        else if (button.dataset.table === 'row' && table.rows.length < MAX_ROWS) {
          const row = table.insertRow(cell.parentElement.rowIndex + 1);
          for (let index = 0; index < cell.parentElement.cells.length; index++) row.insertCell().innerHTML = '<br>';
        } else if (button.dataset.table === 'column' && Array.from(table.rows).every(row => row.cells.length < MAX_COLUMNS)) {
          for (const row of table.rows) row.insertCell(Math.min(cell.cellIndex + 1, row.cells.length)).innerHTML = '<br>';
        } else { status.textContent = 'Tablo boyutu sınırına ulaşıldı.'; return; }
        changed();
      }
    });
    editor.addEventListener('input', changed);
    editor.addEventListener('paste', event => {
      event.preventDefault();
      const html = event.clipboardData.getData('text/html');
      const text = event.clipboardData.getData('text/plain');
      if (html) insert(sanitize(html));
      else if (text.includes('\t')) {
        const rows = text.replace(/\r/g, '').replace(/\n$/, '').split('\n');
        insert(`<table><tbody>${rows.map(row => `<tr>${row.split('\t').map(cell => `<td>${escape(cell) || '<br>'}</td>`).join('')}</tr>`).join('')}</tbody></table><p><br></p>`);
      } else insert(escape(text).replace(/\r?\n/g, '<br>'));
    });
    // Drops use the same plain-text path; never allow external markup or files into the editor.
    editor.addEventListener('dragover', event => event.preventDefault());
    editor.addEventListener('drop', event => { event.preventDefault(); insert(escape(event.dataTransfer.getData('text/plain')).replace(/\r?\n/g, '<br>')); });
    return { reset() { savedRange = null; status.textContent = ''; } };
  }

  function thumbnail(slide) {
    return `<div class="html-slide-thumbnail"><strong>Aa · ▦</strong><span>${escape(slide.title)}</span></div>`;
  }

  root.TextSlides = { isTextSlide, create, sanitize, documentFor, bind, thumbnail };
})(typeof window !== 'undefined' ? window : globalThis);
