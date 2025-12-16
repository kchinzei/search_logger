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

export {}; // marks this file as an ES module

import { loadSettings } from "./settings";
import { INVALID_PORT } from "./const";

interface EnginesSettings {
  google?: boolean;
  g_maps?: boolean;
  bing?: boolean;
  b_maps?: boolean;
}

interface StoredSettings {
  useExternal?: boolean;
  port?: number;
  engines?: EnginesSettings;
}

function getQuery(): string | null {
  const url = new URL(location.href);

  // Standard search: ?q=...
  if (url.searchParams.has("q")) return url.searchParams.get("q");

  return null;
}

function getG_MapQuery(): string | null {
  const pathname = location.pathname;

  // Google Maps: /maps/(place|search)/something
  // eslint-disable-next-line no-useless-escape
  const m = pathname.match(/^\/maps\/(place|search)\/([^\/]+)/);
  if (m) return decodeURIComponent(m[2]).replace(/\+/g, " ");

  return null;
}

function getB_MapQuery(): string | null {
  const url = new URL(location.href);
  const pathname = location.pathname;

  // Bing Maps: /maps and possibly ?q= or ?where= or ?cp=(lat long)
  if (url.searchParams.has("where")) return url.searchParams.get("where");
  if (url.searchParams.has("cp")) return url.searchParams.get("cp");
  // ?q= is not great as a search term - not updated by clicks.
  if (url.searchParams.has("q")) return url.searchParams.get("q");

  // Also support /maps/POIName/...
  // eslint-disable-next-line no-useless-escape
  const m = pathname.match(/^\/maps\/([^\/]+)/);
  if (m && m[1] !== "maps") return decodeURIComponent(m[1]).replace(/\+/g, " ");

  return null;
}

function localISOString(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}

function logSearch(items: StoredSettings): void {
  let port =
    items && typeof items.port === "number" ? items.port : INVALID_PORT;
  const engines: EnginesSettings = items && items.engines ? items.engines : {};

  // When useExternal is disabled, set port to -1 to disable sending it external.
  const useExternal = items && items.useExternal;
  if (useExternal === false) port = INVALID_PORT;

  const enableGoogle = !!engines.google;
  const enableG_Maps = !!engines.g_maps;
  const enableBing = !!engines.bing;
  const enableB_Maps = !!engines.b_maps;

  const hostname = location.hostname;
  const pathname = location.pathname;

  const isGoogle =
    enableGoogle &&
    hostname.includes("google.") &&
    pathname.startsWith("/search");
  const isG_Maps =
    enableG_Maps &&
    hostname.includes("google.") &&
    pathname.startsWith("/maps/");
  const isBing =
    enableBing &&
    hostname.includes("bing.com") &&
    pathname.startsWith("/search");
  const isB_Maps =
    enableB_Maps &&
    hostname.includes("bing.com") &&
    pathname.startsWith("/maps");

  if (!(isGoogle || isG_Maps || isBing || isB_Maps)) return;

  let query: string | null = getQuery();
  if (isG_Maps) query = getG_MapQuery();
  if (isB_Maps) query = getB_MapQuery();
  if (!query) return;

  const url = location.href;
  const timestamp = localISOString();

  chrome.runtime.sendMessage({ query, url, timestamp, port });
  // chrome.runtime.sendMessage({ action: "log", arg: { query, url, timestamp, port } });
}

function monitorUrlChange(callback: () => void): void {
  let lastUrl = location.href;

  // Poll every 500ms to catch all URL changes (SPA, etc)
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback();
    }
  }, 500);

  // Listen to popstate (back/forward)
  window.addEventListener("popstate", () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback();
    }
  });

  // Patch pushState and replaceState to call callback after navigation
  (
    ["pushState", "replaceState"] as Array<"pushState" | "replaceState">
  ).forEach((type) => {
    const orig = (history as any)[type] as (...args: any[]) => any;
    (history as any)[type] = function (...args: any[]) {
      const rv = orig.apply(this, args);
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        callback();
      }
      return rv;
    };
  });
}

// Main logic
(async () => {
  const settings = await loadSettings();

  // console.log('[SearchLogger contents] settings:', settings);
  logSearch(settings);

  monitorUrlChange(() => {
    logSearch(settings);
  });
})();
