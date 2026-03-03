'use strict';

// ═══════════════════════════════════════
// CONVERSION MAP
// Defines which target formats are available for each source extension.
// ═══════════════════════════════════════
const FORMAT_MAP = {
  jpg:  ['png', 'webp', 'gif', 'bmp', 'ico'],
  jpeg: ['png', 'webp', 'gif', 'bmp', 'ico'],
  png:  ['jpg', 'webp', 'gif', 'bmp', 'ico'],
  webp: ['jpg', 'png', 'gif', 'bmp'],
  gif:  ['jpg', 'png', 'webp', 'bmp'],
  bmp:  ['jpg', 'png', 'webp', 'gif'],
  ico:  ['jpg', 'png'],
  txt:  ['json', 'html', 'md', 'csv'],
  json: ['txt', 'xml', 'csv'],
  csv:  ['json', 'txt', 'html', 'xml'],
  xml:  ['json', 'txt', 'html'],
  html: ['txt', 'md'],
  md:   ['html', 'txt'],
};

// ═══════════════════════════════════════
// FORMAT ACCENT COLOURS
// Each format gets a distinct colour used in its icon badge.
// ═══════════════════════════════════════
const FORMAT_COLOR = {
  jpg:  '#f59e0b',
  jpeg: '#f59e0b',
  png:  '#3b82f6',
  webp: '#10b981',
  gif:  '#f43f5e',
  bmp:  '#8b5cf6',
  ico:  '#6366f1',
  txt:  '#94a3b8',
  json: '#fbbf24',
  csv:  '#34d399',
  xml:  '#60a5fa',
  html: '#f97316',
  md:   '#a78bfa',
};

// ═══════════════════════════════════════
// STATE
// All queued files are stored here as item objects.
// ═══════════════════════════════════════

/**
 * @typedef {Object} FileItem
 * @property {string}      id    - Unique identifier
 * @property {File}        file  - Original File object
 * @property {string}      ext   - Source extension (lowercase)
 * @property {string|null} to    - Selected target format
 * @property {'ready'|'going'|'done'|'err'} st - Current status
 * @property {string|null} url   - Object URL of the converted output
 * @property {string|null} err   - Error message (only when st === 'err')
 */

/** @type {FileItem[]} */
let items = [];

// ═══════════════════════════════════════
// DOM REFERENCES
// ═══════════════════════════════════════
const dz  = document.getElementById('dz');
const fi  = document.getElementById('fi');
const lst = document.getElementById('lst');
const act = document.getElementById('act');
const pil = document.getElementById('pil');

// ═══════════════════════════════════════
// DROP ZONE EVENT LISTENERS
// ═══════════════════════════════════════
dz.addEventListener('dragover',  e => { e.preventDefault(); dz.classList.add('over'); });
dz.addEventListener('dragleave', ()  => dz.classList.remove('over'));
dz.addEventListener('drop', e => {
  e.preventDefault();
  dz.classList.remove('over');
  addFiles(e.dataTransfer.files);
});
fi.addEventListener('change', e => addFiles(e.target.files));

// ═══════════════════════════════════════
// FILE MANAGEMENT
// ═══════════════════════════════════════

/**
 * Adds a FileList to the items array and re-renders the list.
 * Unsupported formats are still added but will show a "not supported" badge.
 * @param {FileList} fileList
 */
function addFiles(fileList) {
  for (const file of fileList) {
    const ext  = file.name.split('.').pop().toLowerCase();
    const opts = FORMAT_MAP[ext];
    items.push({
      id:   Math.random().toString(36).slice(2),
      file,
      ext,
      to:   opts ? opts[0] : null,
      st:   'ready',
      url:  null,
      err:  null,
    });
  }
  render();
}

/**
 * Updates the target format for a specific item and resets its status to 'ready'.
 * @param {string} id   - Item ID
 * @param {string} fmt  - New target format
 */
function setFmt(id, fmt) {
  const item = items.find(x => x.id === id);
  if (item) { item.to = fmt; item.st = 'ready'; item.url = null; }
  render();
}

/**
 * Removes a single item from the queue.
 * @param {string} id - Item ID
 */
function del(id) {
  items = items.filter(x => x.id !== id);
  render();
}

/** Removes all items from the queue. */
function clrAll() {
  items = [];
  render();
}

/** Converts all items that have not yet been converted. */
async function convAll() {
  for (const item of items) {
    if (item.to && item.st !== 'done') await go(item.id);
  }
}

// ═══════════════════════════════════════
// RENDERING
// Rebuilds the file list and action bar from the current items array.
// ═══════════════════════════════════════
function render() {
  lst.innerHTML = '';

  if (!items.length) {
    act.style.display = 'none';
    return;
  }

  act.style.display = 'flex';
  pil.textContent   = `${items.length} file${items.length !== 1 ? 's' : ''}`;

  for (const item of items) {
    const opts  = FORMAT_MAP[item.ext] || [];
    const color = FORMAT_COLOR[item.ext] || '#7878a0';
    const card  = document.createElement('div');
    card.className = 'card';

    // ── Status row HTML ──
    let statusHTML = '';
    if (item.st === 'ready') {
      statusHTML = `<div class="srow">
        <div class="dot ready"></div>
        <span style="color:var(--muted)">Ready</span>
      </div>`;
    } else if (item.st === 'going') {
      statusHTML = `<div class="srow">
        <div class="dot going"></div>
        <span style="color:var(--yellow)">Converting...</span>
      </div>`;
    } else if (item.st === 'done') {
      const outName = item.file.name.replace(/\.[^.]+$/, '') + '.' + item.to;
      statusHTML = `<div class="srow">
        <div class="dot done"></div>
        <span style="color:var(--green)">Done</span>
      </div>
      <a class="download-link" href="${item.url}" download="${outName}">Download .${item.to}</a>`;
    } else if (item.st === 'err') {
      statusHTML = `<div class="srow">
        <div class="dot err"></div>
        <span style="color:var(--red)">${item.err}</span>
      </div>`;
    }

    // ── Format selector HTML ──
    const selectorHTML = opts.length
      ? `<select class="select-format" onchange="setFmt('${item.id}', this.value)">
          ${opts.map(o => `<option value="${o}"${o === item.to ? ' selected' : ''}>${o.toUpperCase()}</option>`).join('')}
        </select>`
      : `<span class="badge" style="color:var(--red)">Not supported</span>`;

    // ── Convert button HTML ──
    const convertHTML = (opts.length && item.st !== 'done')
      ? `<button class="btn-go" onclick="go('${item.id}')"${item.st === 'going' ? ' disabled' : ''}>Convert</button>`
      : '<div></div>';

    card.innerHTML = `
      <div class="ficon" style="background:${color}22;color:${color};border:1px solid ${color}44">
        ${item.ext.toUpperCase()}
      </div>
      <div class="finfo">
        <h3 title="${item.file.name}">${item.file.name}</h3>
        <div class="meta">${formatSize(item.file.size)}</div>
        ${statusHTML}
      </div>
      ${selectorHTML}
      ${convertHTML}
      <button class="btn-delete" onclick="del('${item.id}')" title="Remove">x</button>
    `;

    lst.appendChild(card);
  }
}

// ═══════════════════════════════════════
// CONVERSION DISPATCHER
// Routes to the correct converter based on the source extension.
// ═══════════════════════════════════════

/**
 * Converts a single item by ID.
 * Updates item state reactively and re-renders on each transition.
 * @param {string} id
 */
async function go(id) {
  const item = items.find(x => x.id === id);
  if (!item || !item.to) return;

  item.st = 'going';
  render();

  try {
    const imageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'ico'];
    if (imageExts.includes(item.ext)) {
      item.url = await convertImage(item.file, item.to);
    } else {
      item.url = await convertText(item.file, item.ext, item.to);
    }
    item.st = 'done';
  } catch (e) {
    item.st  = 'err';
    item.err = e.message || 'Conversion failed';
  }

  render();
}

// ═══════════════════════════════════════
// IMAGE CONVERTER
// Uses a hidden <canvas> to rasterise and re-encode images.
// Formats that don't support transparency (JPG, BMP, ICO) receive a
// white background fill before drawing.
// ═══════════════════════════════════════

/**
 * Converts an image File to the specified format via canvas.
 * @param {File}   file    - Source image file
 * @param {string} toFmt   - Target format key
 * @returns {Promise<string>} Object URL of the converted blob
 */
function convertImage(file, toFmt) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));

    reader.onload = ev => {
      const img    = new Image();
      img.onerror  = () => reject(new Error('Could not open image'));

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        // Fill white background for formats that do not support alpha
        if (['jpg', 'jpeg', 'bmp', 'ico'].includes(toFmt)) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0);

        const MIME_MAP = {
          jpg:  'image/jpeg',
          jpeg: 'image/jpeg',
          png:  'image/png',
          webp: 'image/webp',
          gif:  'image/gif',
          bmp:  'image/bmp',
          ico:  'image/png',   // ICO output uses PNG encoding
        };

        // Use 0.92 quality for lossy formats; let the browser decide for lossless
        const quality = ['jpg', 'jpeg', 'webp'].includes(toFmt) ? 0.92 : undefined;

        canvas.toBlob(blob => {
          if (!blob) return reject(new Error('Canvas conversion failed'));
          resolve(URL.createObjectURL(blob));
        }, MIME_MAP[toFmt] || 'image/png', quality);
      };

      img.src = ev.target.result;
    };

    reader.readAsDataURL(file);
  });
}

// ═══════════════════════════════════════
// TEXT / DATA CONVERTER
// Reads the source file as UTF-8 text and applies a format-specific
// transformation to produce the target string, then wraps it in a Blob.
// ═══════════════════════════════════════

/**
 * Converts a text/data File between supported text formats.
 * @param {File}   file  - Source file
 * @param {string} from  - Source extension
 * @param {string} to    - Target extension
 * @returns {Promise<string>} Object URL of the output blob
 */
function convertText(file, from, to) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));

    reader.onload = ev => {
      try {
        const text   = ev.target.result;
        const result = transformText(text, from, to);

        const MIME_MAP = {
          json: 'application/json',
          csv:  'text/csv',
          xml:  'application/xml',
          html: 'text/html',
          txt:  'text/plain',
          md:   'text/markdown',
        };

        const blob = new Blob([result], { type: MIME_MAP[to] || 'text/plain' });
        resolve(URL.createObjectURL(blob));
      } catch (e) {
        reject(new Error('Transform error: ' + e.message));
      }
    };

    reader.readAsText(file, 'utf-8');
  });
}

// ═══════════════════════════════════════
// TEXT TRANSFORMATION ENGINE
// Pure function — takes raw text + source/target pair, returns converted string.
// ═══════════════════════════════════════

/**
 * Applies the appropriate in-memory transformation for the given format pair.
 * @param {string} text  - Raw source text
 * @param {string} from  - Source format key
 * @param {string} to    - Target format key
 * @returns {string}     - Converted text
 */
function transformText(text, from, to) {

  // ── HTML entity escaping ──
  function esc(s) {
    return s
      .replace(/&/g,  '&amp;')
      .replace(/</g,  '&lt;')
      .replace(/>/g,  '&gt;');
  }

  // ── CSV line parser (handles quoted fields with embedded commas) ──
  function parseCSVLine(line) {
    const cols  = [];
    let   col   = '';
    let   inQ   = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"')              { inQ = !inQ; continue; }
      if (ch === ',' && !inQ)      { cols.push(col); col = ''; continue; }
      col += ch;
    }
    cols.push(col);
    return cols;
  }

  // ── CSV → array of row objects ──
  function csvToArray(raw) {
    const lines   = raw.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    return lines.slice(1).map(line => {
      const vals = parseCSVLine(line);
      const row  = {};
      headers.forEach((k, i) => { row[k.trim()] = vals[i] !== undefined ? vals[i].trim() : ''; });
      return row;
    });
  }

  // ── JSON value → XML string (recursive) ──
  function jsonToXML(val, rootTag = 'root') {
    function convert(v) {
      if (typeof v === 'object' && v !== null) {
        if (Array.isArray(v)) return v.map(x => `<item>${convert(x)}</item>`).join('');
        return Object.entries(v).map(([k, vv]) => `<${k}>${convert(vv)}</${k}>`).join('');
      }
      return esc(String(v));
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootTag}>${convert(val)}</${rootTag}>`;
  }

  // ── XML DOM node → plain object (recursive) ──
  function xmlNodeToJSON(node) {
    if (node.nodeType === 3) return node.nodeValue.trim();
    const obj = {};
    for (const child of node.childNodes) {
      const key = child.nodeName;
      const val = xmlNodeToJSON(child);
      if (!val) continue;
      if (obj[key]) {
        if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
        obj[key].push(val);
      } else {
        obj[key] = val;
      }
    }
    return obj;
  }

  // ── Conversion matrix ──
  if (from === 'json' && to === 'csv') {
    let data = JSON.parse(text);
    if (!Array.isArray(data)) data = [data];
    const keys = [...new Set(data.flatMap(Object.keys))];
    return [
      keys.join(','),
      ...data.map(row =>
        keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');
  }

  if (from === 'json' && to === 'xml') {
    return jsonToXML(JSON.parse(text));
  }

  if (from === 'json' && to === 'txt') {
    return JSON.stringify(JSON.parse(text), null, 2);
  }

  if (from === 'csv' && to === 'json') {
    return JSON.stringify(csvToArray(text), null, 2);
  }

  if (from === 'csv' && to === 'html') {
    const lines   = text.trim().split('\n');
    const headers = parseCSVLine(lines[0]);
    let html = `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; padding: 20px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
  th { background: #f4f4f4; font-weight: 600; }
</style>
</head>
<body>
<table>
<thead><tr>${headers.map(h => `<th>${esc(h.trim())}</th>`).join('')}</tr></thead>
<tbody>`;
    lines.slice(1).forEach(line => {
      html += '<tr>' + parseCSVLine(line).map(c => `<td>${esc(c.trim())}</td>`).join('') + '</tr>';
    });
    return html + '</tbody></table></body></html>';
  }

  if (from === 'csv' && to === 'txt') {
    return text.replace(/,/g, '\t');
  }

  if (from === 'csv' && to === 'xml') {
    const rows = csvToArray(text);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n` +
      rows.map(r =>
        `  <row>\n${Object.entries(r).map(([k, v]) => `    <${k}>${esc(v)}</${k}>`).join('\n')}\n  </row>`
      ).join('\n') +
      `\n</data>`;
  }

  if (from === 'xml' && to === 'json') {
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    return JSON.stringify(xmlNodeToJSON(doc.documentElement), null, 2);
  }

  if (from === 'xml' && to === 'txt') {
    return new DOMParser().parseFromString(text, 'text/xml').documentElement.textContent || '';
  }

  if (from === 'xml' && to === 'html') {
    return `<!DOCTYPE html><html><body><pre style="white-space:pre-wrap;font-family:monospace;padding:20px">${esc(text)}</pre></body></html>`;
  }

  if (from === 'html' && to === 'txt') {
    return new DOMParser().parseFromString(text, 'text/html').body.innerText || '';
  }

  if (from === 'html' && to === 'md') {
    return text
      .replace(/<h1>(.*?)<\/h1>/gi,            '# $1\n')
      .replace(/<h2>(.*?)<\/h2>/gi,            '## $1\n')
      .replace(/<h3>(.*?)<\/h3>/gi,            '### $1\n')
      .replace(/<strong>(.*?)<\/strong>/gi,    '**$1**')
      .replace(/<b>(.*?)<\/b>/gi,              '**$1**')
      .replace(/<em>(.*?)<\/em>/gi,            '*$1*')
      .replace(/<i>(.*?)<\/i>/gi,              '*$1*')
      .replace(/<a href="(.*?)">(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<code>(.*?)<\/code>/gi,        '`$1`')
      .replace(/<li>(.*?)<\/li>/gi,            '- $1\n')
      .replace(/<br\s*\/?>/gi,                 '\n')
      .replace(/<p>/gi,                        '\n')
      .replace(/<\/p>/gi,                      '\n')
      .replace(/<[^>]+>/g,                     '')
      .replace(/&amp;/g,                       '&')
      .replace(/&lt;/g,                        '<')
      .replace(/&gt;/g,                        '>')
      .replace(/&nbsp;/g,                      ' ')
      .trim();
  }

  if (from === 'md' && to === 'html') {
    const body = text
      .replace(/^### (.*)/gm,     '<h3>$1</h3>')
      .replace(/^## (.*)/gm,      '<h2>$1</h2>')
      .replace(/^# (.*)/gm,       '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g,  '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,      '<em>$1</em>')
      .replace(/`(.*?)`/g,        '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/^- (.*)/gm,       '<li>$1</li>')
      .replace(/\n\n/g,           '</p><p>');
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; max-width: 700px; margin: 40px auto; padding: 20px; line-height: 1.6; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
</style>
</head>
<body><p>${body}</p></body>
</html>`;
  }

  if (from === 'md' && to === 'txt') {
    return text
      .replace(/[#*`_~>]/g,        '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/^-\s/gm,           '- ')
      .trim();
  }

  if (from === 'txt' && to === 'html') {
    return `<!DOCTYPE html><html><body><pre style="font-family:sans-serif;white-space:pre-wrap;line-height:1.6;padding:20px">${esc(text)}</pre></body></html>`;
  }

  if (from === 'txt' && to === 'json') {
    return JSON.stringify(text.split('\n').filter(Boolean), null, 2);
  }

  if (from === 'txt' && to === 'md') {
    return text; // Plain text is valid Markdown as-is
  }

  if (from === 'txt' && to === 'csv') {
    return text.split('\n').map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
  }

  // Fallback: return source text unchanged
  return text;
}

// ═══════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════

/**
 * Formats a byte count into a human-readable string.
 * @param {number} bytes
 * @returns {string}  e.g. "1.4 MB", "320 KB", "512 B"
 */
function formatSize(bytes) {
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1_048_576)   return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1_048_576).toFixed(1) + ' MB';
}
