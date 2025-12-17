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

import { setLanguage, makePrefixer2 } from "./i18n"; // assume setLanguage() already called.

interface LogItem {
  ts?: string; // ISO timestamp string
  text?: string;
  href?: string;
  map?: boolean;
}

setLanguage(navigator.language.startsWith("ja") ? "ja" : "en");
const tp = makePrefixer2("log-common");

function escapeAttr(str: string | undefined): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/*
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
*/

// --- exported API ---

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Parse one stored HTML line: <div ts="2025-11-03T08:31:45.201Z" map-log="1"><a ...> */
export function parseLine(line: string): LogItem {
  const box = document.createElement("div");
  box.innerHTML = line.trim();

  const root = box.firstElementChild as HTMLElement | null;
  const a = root?.querySelector("a") as HTMLAnchorElement | null;

  const href = a?.getAttribute("href") ?? "";
  const text = a?.textContent ?? "";
  const ts = root?.getAttribute("ts") ?? "";
  const map = root?.getAttribute("map-log") === "1";

  return { ts, text, href, map }; // keep ts as ISO string
}

/**
 * Return HTML for a single log row.
 * This is the single source of markup for popup, logview, and export.
 */
export function rowHtmlFromItem(
  ts?: string,
  text?: string,
  href?: string,
  map?: boolean,
): string {
  const tsEsc = escapeHtml(ts || tp("missing-ts"));
  const textEsc = escapeHtml(text || tp("missing-query"));
  const hrefEsc = escapeAttr(href);
  const linkIcon = map ? "✴️" : "↗️";

  return `<div class="log-row">
    <span class="ts">${tsEsc}</span>
    <span class="sep"></span>
    <span class="q-text">${textEsc}</span>
    <a class="q-link" href="${hrefEsc}" target="_blank" rel="noopener" title="Open search">${linkIcon}</a>
  </div>`;
}

/**
 * Return a DOM element for UI rendering.
 */
export function makeRow(
  ts?: string,
  text?: string,
  href?: string,
  map?: boolean,
): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = rowHtmlFromItem(ts, text, href, map);
  return wrapper.firstElementChild as HTMLElement;
}
