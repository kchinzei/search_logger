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

console.log("SearchLogger ↔ content: loaded on", location.href);

chrome.storage.local.get(['port', 'engines'], ({ port = 27123, engines = {} }) => {
  const isGoogle = engines.google ?? false;
  const isMaps = engines.maps ?? false;
  const isBing = engines.bing ?? false;

  const hostname = location.hostname;
  const pathname = location.pathname;

  const isGoogleSearch = isGoogle && hostname.includes('google.') && pathname.includes('/search');
  const isGoogleMaps = isMaps && hostname.includes('google.') && pathname.includes('/maps');
  const isBingSearch = isBing && hostname.includes('bing.com') && pathname.includes('/search');

  if (!(isGoogleSearch || isGoogleMaps || isBingSearch)) return;

  const query = new URLSearchParams(window.location.search).get('q');
  if (!query) return;

  const url = location.href;
  const timestamp = new Date().toISOString();

  chrome.runtime.sendMessage({ query, url, timestamp, port });
});
