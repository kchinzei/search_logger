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

console.log('SearchLogger ↔ content: loaded on', location.href);

function getQuery() {
  var url = new URL(location.href);
  return url.searchParams.get('q');
}

function logSearch(items) {
  var port = (items && items.port) ? items.port : 27123;
  var engines = (items && items.engines) ? items.engines : {};

  var isGoogle = engines.google || false;
  var isMaps = engines.maps || false;
  var isBing = engines.bing || false;

  var hostname = location.hostname;
  var pathname = location.pathname;

  var isGoogleSearch = isGoogle && hostname.includes('google.') && pathname.includes('/search');
  var isGoogleMaps = isMaps && hostname.includes('google.') && pathname.includes('/maps');
  var isBingSearch = isBing && hostname.includes('bing.com') && pathname.includes('/search');

  if (!(isGoogleSearch || isGoogleMaps || isBingSearch)) return;

  var query = getQuery();
  if (!query) return;

  var url = location.href;
  var timestamp = new Date().toISOString();

  chrome.runtime.sendMessage({ query: query, url: url, timestamp: timestamp, port: port });
}

function monitorUrlChange(callback) {
  var lastUrl = location.href;

  // Poll every 500ms to catch all URL changes (SPA, etc)
  setInterval(function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback();
    }
  }, 500);

  // Listen to popstate (back/forward)
  window.addEventListener('popstate', function() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      callback();
    }
  });

  // Patch pushState and replaceState to call callback after navigation
  ['pushState', 'replaceState'].forEach(function(type) {
    var orig = history[type];
    history[type] = function() {
      var rv = orig.apply(this, arguments);
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        callback();
      }
      return rv;
    };
  });
}

// Main logic
chrome.storage.local.get(['port', 'engines'], function(items) {
  logSearch(items);

  monitorUrlChange(function() {
    logSearch(items);
  });
});
