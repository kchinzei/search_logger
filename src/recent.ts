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
//
// Recent-queries circular buffer with robust `from` detection.
// Sources (priority order):
//  1) explicit param
//  2) URL ?from=... or #from=...
//  3) document.referrer ?from=...
//  4) <meta name="x-search-logger-from" content="...">
//  5) <html data-from="...">
//  6) localStorage['search_logger_from']
//  7) sessionStorage['search_logger_from']
//  8) window.name (pattern: "from=VALUE" or JSON containing {from:...})
//
// Works in both content-scripts (DOM available) and service worker (DOM absent).

import {
  FROM_PARAM_KEY,
  DEFAULT_RECENT_ITEMS,
  DEFAULT_RECENT_DAYS,
  MIN_RECENT_ITEMS,
  MIN_RECENT_DAYS,
} from "./const";

export type RecentParams = {
  query: string;
  url: string;
  engine?: string;
  from?: string; // optional explicit value (preferred)
  ttlMs?: number; // optional override, otherwise "one day"
  recentItems?: number; // optional override for buffer length
};

type RecentItem = { key: string; ts: number };

const DEFAULT_TTL_MS = DEFAULT_RECENT_DAYS * 24 * 60 * 60 * 1000; // 1 day

let recent: RecentItem[] = [];
let inited = false;
let cachedSettings: { recentItems: number; ttlMs: number } | null = null;

/* ---------------------- Safe helpers ---------------------- */
function safeURL(u: string): URL | null {
  try {
    return new URL(u);
  } catch {
    return null;
  }
}

function fromQuery(u: URL | null): string | undefined {
  if (!u) return;
  const v = u.searchParams.get(FROM_PARAM_KEY) || "";
  if (v.trim()) return v.trim();
  const h = u.hash ? new URLSearchParams(u.hash.replace(/^#/, "")) : null;
  const hv = h?.get(FROM_PARAM_KEY) || "";
  return hv.trim() || undefined;
}

function normalizeQuery(q: string): string {
  return (q || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Deterministic `from` for the dedupe key:
 * - Prefer explicit argument
 * - Else only use URL ?from= or #from=
 * (No referrer/meta/storage/window.name here to keep key stable across reloads.)
 */
function stableFromForKey(url: string, explicit?: string): string | undefined {
  const viaArg = (explicit || "").trim();
  if (viaArg) return viaArg;
  const viaUrl = fromQuery(safeURL(url)) || "";
  return viaUrl.trim() || undefined;
}

function normalizeKey(
  query: string,
  url: string,
  engine?: string,
  fromForKey?: string,
): string {
  const u = safeURL(url);
  // normalize google hosts like www.google.co.jp vs www.google.com
  const hostRaw = (u?.host || "").toLowerCase();
  const host = hostRaw.replace(/^www\./, ""); // treat www.* same as bare domain
  const e = (engine || "").toLowerCase();
  const f = (fromForKey || "").toLowerCase();
  const q = normalizeQuery(query);
  return `${e}::${host}::${f}::${q}`;
}

/* ---------------------- Settings ---------------------- */
async function getSettings(): Promise<{ recentItems: number; ttlMs: number }> {
  if (cachedSettings) return cachedSettings;

  let recentItems = DEFAULT_RECENT_ITEMS;
  let ttlMs = DEFAULT_TTL_MS;

  try {
    // Read from the same place options.ts writes
    const { recentItems: storedMax, ttlDays: storedDays } =
      await chrome.storage.local.get({
        recentItems: DEFAULT_RECENT_ITEMS,
        ttlDays: DEFAULT_RECENT_DAYS,
      });

    if (typeof storedMax === "number" && storedMax >= MIN_RECENT_ITEMS) {
      recentItems = Math.trunc(storedMax);
    }

    let days = DEFAULT_RECENT_DAYS;
    if (typeof storedDays === "number" && storedDays >= MIN_RECENT_DAYS) {
      days = Math.trunc(storedDays);
    }
    ttlMs = days * 24 * 60 * 60 * 1000;
  } catch {
    // ignore errors, keep defaults
  }

  cachedSettings = { recentItems, ttlMs };
  return cachedSettings;
}

/* ---------------------- Persistence ---------------------- */
// Use storage.local so buffer survives service worker restarts and browser restarts.
async function loadLocal(): Promise<void> {
  try {
    const { recentQueries = [] } = await chrome.storage.local.get({
      recentQueries: [],
    });
    if (Array.isArray(recentQueries)) recent = recentQueries as RecentItem[];
  } catch {
    /* ignore */
  }
}

async function saveLocal(): Promise<void> {
  try {
    await chrome.storage.local.set({ recentQueries: recent });
  } catch {
    /* ignore */
  }
}

/* ---------------------- Prune & init ---------------------- */
function prune(ttlMs: number, recentItems: number): void {
  const now = Date.now();
  // Drop anything older than ttlMs
  recent = recent.filter((r) => now - r.ts <= ttlMs);
  // Keep only the newest recentItems entries
  if (recent.length > recentItems) recent = recent.slice(0, recentItems);
}

async function initIfNeeded(): Promise<void> {
  if (inited) return;
  inited = true;

  await loadLocal();
  const { recentItems, ttlMs } = await getSettings();
  prune(ttlMs, recentItems);
  await saveLocal();
}

/* ---------------------- Public API ---------------------- */

export async function isRecentDuplicate(
  params: RecentParams,
): Promise<boolean> {
  await initIfNeeded();
  const { recentItems, ttlMs } = await getSettings();

  const fromKey = stableFromForKey(params.url, params.from);
  const key = normalizeKey(params.query, params.url, params.engine, fromKey);

  const effectiveTtl = params.ttlMs ?? ttlMs;
  const effectiveMax = params.recentItems ?? recentItems;

  // Clean the buffer first
  prune(effectiveTtl, effectiveMax);
  await saveLocal();

  const now = Date.now();
  const hit = recent.find((r) => r.key === key && now - r.ts <= effectiveTtl);
  return Boolean(hit);
}

export async function recordRecent(params: RecentParams): Promise<void> {
  await initIfNeeded();
  const { recentItems, ttlMs } = await getSettings();

  const fromKey = stableFromForKey(params.url, params.from);
  const key = normalizeKey(params.query, params.url, params.engine, fromKey);

  const effectiveTtl = params.ttlMs ?? ttlMs;
  const effectiveMax = params.recentItems ?? recentItems;

  recent.unshift({ key, ts: Date.now() });
  prune(effectiveTtl, effectiveMax);
  await saveLocal();
}

export async function clearRecent(): Promise<void> {
  recent = [];
  cachedSettings = null;
  try {
    await chrome.storage.local.set({ recentQueries: [] });
  } catch {
    /* ignore */
  }
}

export function snapshotRecent(): RecentItem[] {
  return recent.slice();
}
