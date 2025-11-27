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

import { isRecentDuplicate, recordRecent, clearRecent } from "./recent";
import { loadSettings } from "./settings";

type QuotaErrorKind = "quota" | "item-too-large" | "unknown";

interface StorageError extends Error {
  kind: QuotaErrorKind;
}

interface LogMessage {
  query?: string;
  url?: string;
  timestamp?: string;
  port?: number;
}

interface ActionMessage {
  action: string;
  arg?: string;
}

const FROM_PARAM_KEY = "from";
const FROM_PARAM_VALUE = "search-logger";

// console.log('SearchLogger ↔ background: script started');

const QUOTA_TOTAL: number =
  chrome.storage &&
  chrome.storage.local &&
  typeof chrome.storage.local.QUOTA_BYTES === "number"
    ? chrome.storage.local.QUOTA_BYTES
    : 5_000_000;

const QUOTA_SAFE_BYTES = Math.floor(QUOTA_TOTAL * 0.8);
const MAX_RETRIES = 500;
const MIN_LINES_TO_KEEP = 2;

// --- helpers: classify storage.set errors reliably ---
function classifyStorageError(
  message?: string,
  err?: Error | chrome.runtime.LastError | null,
): QuotaErrorKind {
  const fallbackMsg =
    message || (err && (err as { message?: string }).message) || "";
  const msg = String(fallbackMsg).toLowerCase();

  const quotaHints = [
    "quota",
    "quotaexceedederror",
    "exceeded the quota",
    "bytes in use",
  ];
  const itemTooLargeHints = [
    "quota_bytes_per_item",
    "per item quota",
    "exceeds the maximum size",
    "too large",
  ];

  if (quotaHints.some((h) => msg.includes(h))) return "quota";
  if (itemTooLargeHints.some((h) => msg.includes(h))) return "item-too-large";
  return "unknown";
}

// Wrap chrome.storage.local.set to capture chrome.runtime.lastError consistently
function setLocalSafe(obj: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(obj, () => {
      const le = chrome.runtime && chrome.runtime.lastError;
      if (le) {
        const kind = classifyStorageError(le.message, le);
        const e = new Error(le.message || "storage.set failed") as StorageError;
        e.kind = kind;
        return reject(e);
      }
      resolve();
    });
  });
}

async function saveLocal(
  query: string,
  url: string,
  timestamp: string,
): Promise<void> {
  const { logHtml = "" } = await chrome.storage.local.get({ logHtml: "" });
  const newLine = `<div ts="${timestamp}"><a href="${url}">${query}</a></div>`;
  const lines = String(logHtml).split("\n").filter(Boolean);
  lines.unshift(newLine);

  const encoder = new TextEncoder();
  let data = lines.join("\n") + "\n";
  let bytes = encoder.encode(JSON.stringify({ logHtml: data })).length;

  // proactive trim
  while (bytes > QUOTA_SAFE_BYTES && lines.length > 10) {
    lines.pop();
    data = lines.join("\n") + "\n";
    bytes = encoder.encode(JSON.stringify({ logHtml: data })).length;
  }

  let attempts = 0;
  const originalCount = String(logHtml).split("\n").filter(Boolean).length;
  const result: {
    ok: boolean;
    kept: number;
    trimmed: number;
    error: { kind: string; message: string } | null;
  } = { ok: false, kept: lines.length, trimmed: 0, error: null };

  while (attempts < MAX_RETRIES) {
    attempts++;
    try {
      await setLocalSafe({ logHtml: data });
      result.ok = true;
      result.kept = lines.length;
      result.trimmed = Math.max(0, originalCount + 1 - lines.length);
      break;
    } catch (err) {
      const e = err as StorageError;
      console.log("[SearchLogger BG] error when saving:\n", e);

      if (
        (e.kind === "quota" || e.kind === "item-too-large") &&
        lines.length > MIN_LINES_TO_KEEP
      ) {
        lines.pop();
        data = lines.join("\n") + "\n";
        continue;
      }
      result.error = {
        kind: e.kind || "unknown",
        message: e.message || String(e),
      };
      break;
    }
  }

  if (!result.ok && !result.error) {
    result.error = {
      kind: "quota-retry-exhausted",
      message: `Exceeded MAX_RETRIES=${MAX_RETRIES} while trimming.`,
    };
  }
  // console.log('[SearchLogger BG] Save data:\n', data);
  // console.log('[SearchLogger BG] Status: ', result);
}

function saveRemote(
  query: string,
  url: string,
  timestamp: string,
  port: number,
): void {
  if (port > 0) {
    fetch(`http://localhost:${port}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, url, timestamp }),
    })
      .then((res) => {
        console.log("[SearchLogger BG] HTTP POST done. Status:", res.status);
      })
      .catch((err) => {
        console.error("[SearchLogger BG] Fetch failed:", err);
      });
  }
}

export async function clearAllLogs(): Promise<void> {
  const all: Record<string, unknown> = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((k) => /^logHtml($|_\d{8}$)/.test(k));

  if (keys.length) {
    await chrome.storage.local.remove(keys);
  }

  await clearRecent();
}

// Used in desktop only.
export function openOrFocusPage(page: string): void {
  const url = chrome.runtime.getURL(page);

  chrome.tabs.query({ url }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn(
        "[SearchLogger BG] tabs.query error:",
        chrome.runtime.lastError,
      );
      return;
    }

    if (tabs.length > 0) {
      const tab = tabs[0];
      if (tab.windowId != null)
        chrome.windows.update(tab.windowId, { focused: true });
      if (tab.id != null) chrome.tabs.update(tab.id, { active: true });
    } else {
      chrome.tabs.create({ url });
    }
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  const _settings = await loadSettings();
  // optional: log or use them
});

/*
chrome.runtime.onMessage.addListener((msg: ActionMessage) => {
  const { action, arg } = msg;
  if (action === 'openhtml') openOrFocusPage(arg as string);
  if (action === 'clearAllLogs') clearAllLogs();
  //if (msg.action === 'openLogview') openOrFocusPage('logview.html');
  //if (msg.action === 'openOptions') openOrFocusPage('options.html');
  //if (msg.action === 'clearAllLogs') clearAllLogs();
});
*/

chrome.runtime.onMessage.addListener(
  (msg: ActionMessage & LogMessage, _sender, _sendResponse) => {
    const { action, arg } = msg;
    if (action === "openhtml") {
      openOrFocusPage(arg as string);
      return;
    }
    if (action === "clearAllLogs") {
      clearAllLogs();
      return;
    }

    const { query, url, timestamp, port } = msg;
    if (!query || !url || !port) {
      console.warn("[SearchLogger BG] Incomplete message:", msg);
      return;
    }

    // --- from=obsidian handling ---
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      console.warn("[SearchLogger BG] Invalid URL in message:", url);
      return;
    }

    const from = parsed.searchParams.get(FROM_PARAM_KEY);

    // If this navigation already has ?from=search-logger, skip logging entirely.
    if (from === FROM_PARAM_VALUE) {
      // console.log('[SearchLogger BG] Skipping query from Obsidian/log click');
      return;
    }

    // Otherwise, add ?from=obsidian for the stored/logged URL only.
    parsed.searchParams.set(FROM_PARAM_KEY, FROM_PARAM_VALUE);
    const urlForLog = parsed.toString();

    isRecentDuplicate({ query, url }).then(async (dup) => {
      if (dup) return; // skip spammy repeats
      await recordRecent({ query, url });
      await saveLocal(query, urlForLog, timestamp!);
      saveRemote(query, urlForLog, timestamp!, port);
    });
  },
);
