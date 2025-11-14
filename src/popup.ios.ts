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

export {}; // mark this file as an ES module

import { loadRecentLogs } from './popup_list';
import { setLanguage, autoTranslate } from './i18n';

// If you don't already have @types/chrome, this keeps TS happy
declare const chrome: {
  runtime: {
    getURL(path: string): string;
  };
};

function openExtensionPage(page: string): void {
  const url = chrome.runtime.getURL(page);
  window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', async () => {
  const btnOpen = document.getElementById('btn-logview');
  const btnOptions = document.getElementById('btn-options');

  btnOpen?.addEventListener('click', () => {
    openExtensionPage('logview.html');
  });

  btnOptions?.addEventListener('click', () => {
    openExtensionPage('options.html');
  });

  await setLanguage(navigator.language.startsWith('ja') ? 'ja' : 'en');
  autoTranslate('popup');

  loadRecentLogs();
});