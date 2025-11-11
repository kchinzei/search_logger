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

export {}; // marks this file as an ES module

import {
  DEFAULT_MAX_RECENT,
  DEFAULT_TTL_DAYS,
  loadSettings,
  saveSettingsPartial,
  type StoredSettings,
} from "./settings";
import { setLanguage, autoTranslate } from './i18n';

// Helper to get typed elements by id
function $<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function validatePort(port: number): boolean {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}

function updatePortUI(): void {
  const useExternalEl = $<HTMLInputElement>("ckbox-use-external");
  const useExternal = !!useExternalEl?.checked;

  const fieldsetExplicit = $<HTMLFieldSetElement>("port-fieldset");
  const portInput = $<HTMLInputElement>("port");
  const portError = $<HTMLDivElement>("port-error");

  const fieldset =
    fieldsetExplicit ||
    (portInput?.closest("fieldset") as HTMLFieldSetElement | null) ||
    null;

  if (fieldset) {
    fieldset.disabled = !useExternal;
    fieldset.classList.toggle("dimmed", !useExternal);
  }
  if (portInput) {
    portInput.disabled = !useExternal;
    portInput.tabIndex = useExternal ? 0 : -1;
  }
  if (!useExternal && portError) {
    portError.textContent = "";
  }
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

async function saveSettings(): Promise<void> {
  const useExternalEl = $<HTMLInputElement>("ckbox-use-external");
  const useExternal = useExternalEl ? useExternalEl.checked : true;

  const portInput = $<HTMLInputElement>("port");
  const rawPort = portInput?.value.trim() ?? "";
  const parsedPort = parseInt(rawPort, 10);
  const port = Number.isNaN(parsedPort) ? -1 : parsedPort;

  const portError = $<HTMLDivElement>("port-error");

  if (useExternal) {
    if (!validatePort(port)) {
      if (portError)
        portError.textContent = "Port must be between 1024 and 65535.";
      return;
    } else {
      if (portError) portError.textContent = "";
    }
  }

  const enableGoogle = $<HTMLInputElement>("ckbox-google")?.checked ?? true;
  const enableG_Maps = $<HTMLInputElement>("ckbox-g-maps")?.checked ?? true;
  const enableBing = $<HTMLInputElement>("ckbox-bing")?.checked ?? false;
  const enableB_Maps = $<HTMLInputElement>("ckbox-b-maps")?.checked ?? true;

  const maxRecentInput = $<HTMLInputElement>("input-max-recent");
  const ttlDaysInput = $<HTMLInputElement>("input-recent-days");

  const rawMaxRecent = maxRecentInput?.value.trim() ?? "";
  const rawTtlDays = ttlDaysInput?.value.trim() ?? "";

  const parsedMaxRecent = parseInt(rawMaxRecent, 10);
  const parsedTtlDays = parseInt(rawTtlDays, 10);

  const maxRecent = clampInt(
    Number.isNaN(parsedMaxRecent) ? DEFAULT_MAX_RECENT : parsedMaxRecent,
    1,
    500,
  );
  const ttlDays = clampInt(
    Number.isNaN(parsedTtlDays) ? DEFAULT_TTL_DAYS : parsedTtlDays,
    1,
    30,
  );

  const payload: StoredSettings = {
    useExternal,
    port,
    engines: {
      google: enableGoogle,
      g_maps: enableG_Maps,
      bing: enableBing,
      b_maps: enableB_Maps,
    },
    maxRecent,
    ttlDays,
  };

  await saveSettingsPartial(payload);
  showNotice();
}

async function restoreOptions(): Promise<void> {
  const settings = await loadSettings();

  const useExternalEl = $<HTMLInputElement>("ckbox-use-external");
  if (useExternalEl) useExternalEl.checked = settings.useExternal;

  const portInput = $<HTMLInputElement>("port");
  if (portInput) portInput.value = String(settings.port);

  const googleEl = $<HTMLInputElement>("ckbox-google");
  const gMapsEl = $<HTMLInputElement>("ckbox-g-maps");
  const bingEl = $<HTMLInputElement>("ckbox-bing");
  const bMapsEl = $<HTMLInputElement>("ckbox-b-maps");

  if (googleEl) googleEl.checked = settings.engines.google;
  if (gMapsEl) gMapsEl.checked = settings.engines.g_maps;
  if (bingEl) bingEl.checked = settings.engines.bing;
  if (bMapsEl) bMapsEl.checked = settings.engines.b_maps;

  const maxRecentInput = $<HTMLInputElement>("input-max-recent");
  const ttlDaysInput = $<HTMLInputElement>("input-recent-days");
  if (maxRecentInput) maxRecentInput.value = String(settings.maxRecent);
  if (ttlDaysInput) ttlDaysInput.value = String(settings.ttlDays);

  updatePortUI();
}

function showNotice(): void {
  const el = $<HTMLDivElement>("notice");
  if (!el) return;
  el.style.opacity = "1";
  setTimeout(() => {
    el.style.opacity = "0";
  }, 1200);
}

// If you already have a getBrowser() helper, use that instead.
function getBrowser(): typeof chrome {
  // Safari/Firefox use `browser`, Chromium uses `chrome`
  // `as any` to keep TS happy if only one exists.
  return (
    typeof (globalThis as any).browser !== "undefined"
      ? (globalThis as any).browser
      : chrome
  ) as typeof chrome;
}

function setupCloseButton(): void {
  const btn = document.getElementById(
    "btn-close",
  ) as HTMLButtonElement | null;
  if (!btn) return;

  btn.addEventListener("click", () => {
    // 1) Try normal window.close() (works for popup windows)
    window.close();

    // 2) Ask background to close this tab if window.close() is blocked
    try {
      getBrowser().runtime.sendMessage({ action: "closeSelf" });
    } catch (e) {
      console.warn("closeSelf message failed", e);
    }
  });
}

function isIOS() {
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const maxTouchPoints = window.navigator.maxTouchPoints || 0;

  if (/iPhone|iPad|iPod/.test(ua)) return true;
  if (platform === "MacIntel" && maxTouchPoints > 1) return true;
  return false;
}

document.addEventListener("DOMContentLoaded", async () => {
  await setLanguage(navigator.language.startsWith('ja') ? 'ja' : 'en');
  autoTranslate('options');

  if (isIOS()) {
    document.body.classList.add("ios");

    const useExternal = document.getElementById(
      "ckbox-use-external",
    ) as HTMLInputElement | null;
    if (useExternal) {
      useExternal.checked = false;
      updatePortUI();
    }
  }
  setupCloseButton();
});

// Wire events
$<HTMLInputElement>("port")?.addEventListener("input", () => {
  void saveSettings();
});
$<HTMLInputElement>("ckbox-google")?.addEventListener("change", () => {
  void saveSettings();
});
$<HTMLInputElement>("ckbox-g-maps")?.addEventListener("change", () => {
  void saveSettings();
});
$<HTMLInputElement>("ckbox-bing")?.addEventListener("change", () => {
  void saveSettings();
});
$<HTMLInputElement>("ckbox-b-maps")?.addEventListener("change", () => {
  void saveSettings();
});

$<HTMLInputElement>("ckbox-use-external")?.addEventListener("change", () => {
  updatePortUI();
  void saveSettings();
});

$<HTMLInputElement>("input-max-recent")?.addEventListener("input", () => {
  void saveSettings();
});
$<HTMLInputElement>("input-recent-days")?.addEventListener("input", () => {
  void saveSettings();
});

void restoreOptions();
