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

function openExtensionPage(page) {
  const url = chrome.runtime.getURL(page);
  window.open(url, '_blank');
}

function initPopup() {
    const btnOpen = document.getElementById('btn-logview');
    const btnOptions = document.getElementById('btn-options');
    
    btnOpen?.addEventListener('click', () => {
        openExtensionPage('logview.html');
    });
    btnOptions?.addEventListener('click', () => {
        openExtensionPage('options.html');
    });
    if (window.searchLoggerLoadRecentLogs) {
        console.log('Calling searchLoggerLoadRecentLogs()');
        window.searchLoggerLoadRecentLogs();
    } else {
        console.error('searchLoggerLoadRecentLogs not found on window');
    }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Loading popup_list.js for iOS popup');

  const script = document.createElement('script');
  script.src = 'popup_list.js';   // from dist_safari, inside the extension bundle
  script.onload = () => {
    console.log('popup_list.js loaded');
      initPopup();
    };
    script.onerror = () => {
      console.error('Failed to load popup_list.js');
    };

    document.head.appendChild(script);
});
