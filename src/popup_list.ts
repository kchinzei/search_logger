//    The MIT License (MIT)
//    Copyright (c) Kiyo Chinzei (kchinzei@gmail.com)
//
//    Permission is hereby granted, free of charge, to any person obtaining a copy
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

import { parseLine, makeRow } from "./log_common";

const POPUP_MAX_RECENT = 6;

/* ---------------------- Local helper ---------------------- */
async function getAllLogLines(): Promise<string[]> {
  // Read only the active log buffer (max 5 MB)
  const { logHtml = "" } = await chrome.storage.local.get("logHtml");
  return String(logHtml)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/* ---------------------- Main logic ------------------------ */
export async function loadRecentLogs(): Promise<void> {
  const container = document.getElementById("recent-logs");
  const emptyMsg = document.getElementById(
    "label-recent-empty",
  ) as HTMLElement | null;
  if (!container) return;

  const lines = await getAllLogLines();

  if (!lines.length) {
    if (emptyMsg) emptyMsg.hidden = false;
    return;
  }

  // show newest first
  const recentLines = lines.slice(-POPUP_MAX_RECENT).reverse();

  container.innerHTML = "";

  for (const line of recentLines) {
    const { ts, text, href } = parseLine(line);
    container.appendChild(makeRow(ts, text, href));
  }
}

/* ---------------------- UI handlers ----------------------- */
/*
function initButtons(): void {
  const openBtn = document.getElementById("logview");
  const optionsBtn = document.getElementById("options");
  openBtn?.addEventListener("click", async () => {
    chrome.runtime.sendMessage({ action: "openhtml", arg: "logview.html" });
  });
  optionsBtn?.addEventListener("click", async () => {
    if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
    else
      chrome.runtime.sendMessage({ action: "openhtml", arg: "options.html" });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initButtons();
  void loadRecentLogs();
});
*/

// Make it available as a global for non-module environments (iOS popup)
(window as any).searchLoggerLoadRecentLogs = loadRecentLogs;
