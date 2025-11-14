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

export {};  // marks this file as an ES module

import { loadRecentLogs } from './popup_list';
import { setLanguage, autoTranslate } from './i18n';

// Minimal chrome typing so you don't *have* to install @types/chrome
declare const chrome: {
  runtime: {
    sendMessage(message: unknown): void;
    openOptionsPage?: () => void;
  };
};

document.addEventListener('DOMContentLoaded', async () => {
  const openBtn = document.getElementById('btn-logview') as HTMLButtonElement | null;
  const optionsBtn = document.getElementById('btn-options') as HTMLButtonElement | null;

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'openhtml', arg: 'logview.html' });
    });
  }

  if (optionsBtn) {
    optionsBtn.addEventListener('click', () => {
      if (chrome.runtime.openOptionsPage) {
        chrome.runtime.openOptionsPage();
      } else {
        chrome.runtime.sendMessage({ action: 'openhtml', arg: 'options.html' });
      }
    });
  }

  await setLanguage(navigator.language.startsWith('ja') ? 'ja' : 'en');
  autoTranslate('popup');

  loadRecentLogs();
});