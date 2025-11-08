//    The MIT License (MIT)
//    Copyright (c) Kiyo Chinzei (kchinzei@gmail.com)
//
//     Permission is hereby granted, free of charge, to any person obtaining a copy
//    of this software and associated documentation files (the "Software"), to deal
//    in the Software without restriction, including without limitation the rights
//    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//    copies of the Software, and to permit persons to whom the Software is
//    furnished to do so, subject to the following conditions:
//    The above copyright notice and this permission notice shall be included in
//    all copies or substantial portions of the Software.
//    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//    THE SOFTWARE.

export {};  // marks this file as an ES module

type LogItem = {
  href: string;
  text: string;
  ts?: string; // ISO timestamp string
};

const SELECTORS = {
  listView: '#list-view',
  btnExport: '#btn-export',
  btnClear: '#btn-clear',
} as const;

function $(sel: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(sel);
}

function assertEl<T extends HTMLElement>(el: T | null, sel: string): T {
  if (!el) throw new Error(`Missing required element: ${sel}`);
  return el;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

function escapeAttr(s: unknown): string {
  return String(s ?? '').replace(/["&<>]/g, c => ({ '"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!));
}

/** Parse one stored HTML line: <div data-ts="2025-11-03T08:31:45.201Z"><a ...> */
function parseLine(line: string): LogItem {
  const box = document.createElement('div');
  box.innerHTML = line.trim();

  const root = box.firstElementChild as HTMLElement | null;
  const a = root?.querySelector('a') as HTMLAnchorElement | null;

  const href = a?.getAttribute('href') ?? '';
  const text = a?.textContent ?? '';
  const ts = root?.getAttribute('data-ts') ?? '';

  return { href, text, ts };   // keep ts as ISO string
}

function makeRow(item: LogItem): HTMLElement {
  const row = document.createElement('div');
  row.className = 'log-row';
  const ts = escapeHtml(item.ts || 'unknown time');
  const text = escapeHtml(item.text || '(no query)');
  const href = escapeAttr(item.href);

  row.innerHTML = `
    <span class="dash">-</span>
    <span class="ts">${ts}</span>
    <span class="sep"> — </span>
    <span class="q-text">${text}</span>
    <a class="q-link" href="${href}" target="_blank" rel="noopener" title="Open search">🔗</a>
  `;
  return row;
}


/** Collect all stored lines across `logHtml` and `logHtml_YYYYMMDD` keys. */
async function getAllLogLines(): Promise<string[]> {
  const all: Record<string, unknown> = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter(k => /^logHtml($|_\d{8}$)/.test(k));
  if (keys.length === 0) return [];

  // Sort: newest first; treat plain "logHtml" as newest
  keys.sort((a, b) => {
    const av = a === 'logHtml' ? Number.MAX_SAFE_INTEGER : Number(a.slice(8));
    const bv = b === 'logHtml' ? Number.MAX_SAFE_INTEGER : Number(b.slice(8));
    return bv - av;
  });

  const lines: string[] = [];
  for (const k of keys) {
    const chunk = String(all[k] ?? '');
    for (const raw of chunk.split('\n')) {
      const trimmed = raw.trim();
      if (trimmed) lines.push(trimmed);
    }
  }
  return lines;
}

async function renderList(listView: HTMLElement): Promise<void> {
  const lines = await getAllLogLines();
  listView.innerHTML = '';
  if (lines.length === 0) {
    listView.innerHTML = `<p style="opacity:.7">No entries.</p>`;
    return;
  }
  const frag = document.createDocumentFragment();
  for (const line of lines) {
    const item = parseLine(line);
    frag.appendChild(makeRow(item));
  }
  listView.appendChild(frag);
}

async function exportLog(): Promise<void> {
  const lines = await getAllLogLines();
  const itemsHtml = lines.map(line => {
    const { href, text, ts } = parseLine(line);
    return `<div class="log-row"><span class="dash">-</span><span class="ts">${escapeHtml(ts)}</span><span class="sep"> — </span><span class="q-text">${escapeHtml(text)}</span><a class="q-link" href="${escapeAttr(href)}" target="_blank" rel="noopener" title="Open search">🔗</a></div>`;
  }).join('\n') || '<p>No entries.</p>';

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <title>SearchLog</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;background:#0d0d0d;color:#eee}
        .container{max-width:900px;margin:0 auto;padding:16px}
        .log-row{padding:6px 0}
        .dash{margin-right:8px;opacity:.7}
        .ts{opacity:.85}
        .sep{margin:0 6px;opacity:.7}
        .q-text{user-select:text}
        .q-link{color:#eee;text-decoration:none;margin-left:.25em;opacity:.8}
        .q-link:hover{opacity:1}
        .q-link:active{opacity:.85}
      </style>
    </head>
    <body>
      <div class="container">
        ${itemsHtml}
      </div>
    </body>
  </html>`;

  const filename = 'SearchLog.html';
  const blob = new Blob([html], { type: 'text/html' });
  const ua = navigator.userAgent || '';
  const isiOS = /iPhone|iPad|iPod/.test(ua);

  if (isiOS) {
    // iOS cannot use Blob. iOS: use Web Share API with a File
    if ('share' in navigator) {
      try {
        // TS doesn’t know about canShare/files, so cast to any
        const navAny = navigator as any;
        const file = new File([blob], filename, { type: 'text/html' });

        if (typeof navAny.canShare === 'function' && navAny.canShare({ files: [file] })) {
          await navAny.share({
            files: [file],
          });
          // At this point user has seen the Share sheet and can choose "Save File"
          return;
        }
      } catch (e) {
        console.error('Search Logger export: Web Share failed', e);
      }
    }
    alert('To use Export, please activate Share.');
  } else {
    // PC can save easy.
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'SearchLog.html';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
}

async function clearAll(listView: HTMLElement): Promise<void> {
  const ok = await showConfirmModal('Erase the entire log?', 'This cannot be undone.');
  if (!ok) return;

  // Ask background to clear logs + dedupe
  chrome.runtime.sendMessage({ action: 'clearAllLogs' });

  // Optimistic UI (optional; storage.onChanged will re-render anyway)
  listView.innerHTML = `<p style="opacity:.7">No entries.</p>`;
}

// If you already have a getBrowser() helper, use that instead.
function getBrowser(): typeof chrome {
  // Safari/Firefox use `browser`, Chromium uses `chrome`
  // `as any` to keep TS happy if only one exists.
  return (typeof (globalThis as any).browser !== 'undefined'
    ? (globalThis as any).browser
    : chrome) as typeof chrome;
}

function setupCloseButton(): void {
  const btn = document.getElementById('close-button') as HTMLButtonElement | null;
  if (!btn) return;

  btn.addEventListener('click', () => {
    // 1) Try normal window.close() (works for popup windows)
    window.close();

    // 2) Ask background to close this tab if window.close() is blocked
    try {
      getBrowser().runtime.sendMessage({ action: 'closeSelf' });
    } catch (e) {
      console.warn('closeSelf message failed', e);
    }
  });
}

function injectMinimalStyles(): void {
  const style = document.createElement('style');
  style.textContent = `
    #list-view{max-width:900px;margin:0 auto;padding:16px}
    .log-row{padding:6px 0}
    .dash{margin-right:8px;opacity:.7}
    .ts{opacity:.85}
    .sep{margin:0 6px;opacity:.7}
    a.q{color:#eee;text-decoration:none}
    a.q:active{opacity:.85}
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', () => {
  const listView = assertEl($(SELECTORS.listView), SELECTORS.listView);
  const btnExport = assertEl($(SELECTORS.btnExport), SELECTORS.btnExport) as HTMLButtonElement;
  const btnClear = assertEl($(SELECTORS.btnClear), SELECTORS.btnClear) as HTMLButtonElement;

  injectMinimalStyles();

  btnExport.addEventListener('click', () => { void exportLog(); });
  btnClear.addEventListener('click', () => { void clearAll(listView); });

  void renderList(listView);

  // 🔄 Auto-refresh when log storage changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return;

    // any key like "logHtml" or "logHtml_YYYYMMDD"
    const touchedLogKey = Object.keys(changes).some(k =>
      /^logHtml($|_\d{8}$)/.test(k)
    );
    if (!touchedLogKey) return;

    void renderList(listView);
  });
  setupCloseButton();
});
/* Alternative modal dialog */

async function showConfirmModal(title: string, message: string): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(message)}</p>
        <div class="modal-btns">
          <button id="modal-ok" class="danger">Erase</button>
          <button id="modal-cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const cleanUp = (result: boolean) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector<HTMLButtonElement>('#modal-ok')?.addEventListener('click', () => cleanUp(true));
    overlay.querySelector<HTMLButtonElement>('#modal-cancel')?.addEventListener('click', () => cleanUp(false));
    overlay.addEventListener('click', e => {
      if (e.target === overlay) cleanUp(false);
    });
  });
}