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
  const url = new URL(location.href);

  // Standard search: ?q=...
  if (url.searchParams.has('q')) return url.searchParams.get('q');

  return null;
}

function getG_MapQuery() {
  const url = new URL(location.href);
  const pathname = location.pathname;

  // Google Maps: /maps/(place|search)/something
  const m = pathname.match(/^\/maps\/(place|search)\/([^\/]+)/);
  if (m) return decodeURIComponent(m[2]).replaceAll('+', ' ');

  return null;
}

function getB_MapQuery() {
  const url = new URL(location.href);
  const pathname = location.pathname;

  // Bing Maps: /maps and possibly ?q= or ?where= or ?cp=(lat long)
  if (url.searchParams.has('where')) return url.searchParams.get('where');
  if (url.searchParams.has('cp')) return url.searchParams.get('cp');
  // ?q= is not great as a search term - not updated by clicks.
  if (url.searchParams.has('q')) return url.searchParams.get('q');
  // Also support /maps/POIName/...
  const m = pathname.match(/^\/maps\/([^\/]+)/);
  if (m && m[1] !== 'maps') return decodeURIComponent(m[1]).replaceAll('+', ' ');

  return null;
}

function logSearch(items) {
  var port = (items && items.port) ? items.port : 27123;
  var engines = (items && items.engines) ? items.engines : {};

  var enableGoogle = engines.google || false;
  var enableG_Maps = engines.g_maps || false;
  var enableBing   = engines.bing   || false;
  var enableB_Maps = engines.b_maps || false;

  var hostname = location.hostname;
  var pathname = location.pathname;

  var isGoogle = enableGoogle && hostname.includes('google.') && pathname.startsWith('/search');
  var isG_Maps = enableG_Maps && hostname.includes('google.') && pathname.startsWith('/maps/');
  var isBing   = enableBing   && hostname.includes('bing.com') && pathname.startsWith('/search');
  var isB_Maps = enableB_Maps && hostname.includes('bing.com') && pathname.startsWith('/maps');

  if (!(isGoogle || isG_Maps || isBing || isB_Maps)) return;

  var query = getQuery();
  if (isG_Maps) query = getG_MapQuery();
  if (isB_Maps) query = getB_MapQuery();
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
