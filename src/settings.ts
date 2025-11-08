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

// settings.ts

export const DEFAULT_MAX_RECENT = 50;
export const DEFAULT_TTL_DAYS = 1;

export interface EnginesSettings {
  google?: boolean;
  g_maps?: boolean;
  bing?: boolean;
  b_maps?: boolean;
}

export interface StoredSettings {
  useExternal?: boolean;
  port?: number;
  engines?: EnginesSettings;
  maxRecent?: number;
  ttlDays?: number;
}

// Fully-populated shape used by the rest of the code
export type NormalizedSettings = {
  useExternal: boolean;
  port: number;
  engines: {
    google: boolean;
    g_maps: boolean;
    bing: boolean;
    b_maps: boolean;
  };
  maxRecent: number;
  ttlDays: number;
};

export const DEFAULT_SETTINGS: NormalizedSettings = {
  useExternal: true,
  port: 27123,
  engines: {
    google: true,
    g_maps: true,
    bing: false,
    b_maps: true,
  },
  maxRecent: DEFAULT_MAX_RECENT,
  ttlDays: DEFAULT_TTL_DAYS,
};

// Merge raw storage values with defaults
export function normalizeSettings(raw: StoredSettings): NormalizedSettings {
  const engines = raw.engines ?? {};
  return {
    useExternal: raw.useExternal ?? DEFAULT_SETTINGS.useExternal,
    port:
      typeof raw.port === 'number' && Number.isFinite(raw.port)
        ? raw.port
        : DEFAULT_SETTINGS.port,
    engines: {
      google: engines.google ?? DEFAULT_SETTINGS.engines.google,
      g_maps: engines.g_maps ?? DEFAULT_SETTINGS.engines.g_maps,
      bing: engines.bing ?? DEFAULT_SETTINGS.engines.bing,
      b_maps: engines.b_maps ?? DEFAULT_SETTINGS.engines.b_maps,
    },
    maxRecent: raw.maxRecent ?? DEFAULT_SETTINGS.maxRecent,
    ttlDays: raw.ttlDays ?? DEFAULT_SETTINGS.ttlDays,
  };
}

// Load settings safely even on first run (when storage is empty)
export function loadSettings(): Promise<NormalizedSettings> {
   return new Promise((resolve) => {
    chrome.storage.local.get(null, (resultRaw) => {
      const normalized = normalizeSettings(resultRaw as StoredSettings);

      // Backfill storage so everyone sees a full tree from now on
      chrome.storage.local.set(normalized, () => {
        resolve(normalized);
      });
    });
  });
}

// Save a partial object (like from options UI), normalized + persisted
export function saveSettingsPartial(partial: StoredSettings): Promise<NormalizedSettings> {
  return new Promise((resolve) => {
    const normalized = normalizeSettings(partial);
    chrome.storage.local.set(normalized, () => {
      resolve(normalized);
    });
  });
}