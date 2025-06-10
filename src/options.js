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

function validatePort(port) {
  return Number.isInteger(port) && port >= 1024 && port <= 65535;
}

function saveSettings() {
  const rawPort = document.getElementById('port').value.trim();
  const parsedPort = parseInt(rawPort, 10);
  const port = Number.isNaN(parsedPort) ? -1 : parsedPort;

  const enableGoogle = document.getElementById('enable-google').checked;
  const enableG_Maps = document.getElementById('enable-g-maps').checked;
  const enableBing   = document.getElementById('enable-bing').checked;
  const enableB_Maps = document.getElementById('enable-b-maps').checked;

  const portError = document.getElementById('port-error');
  if (!validatePort(port)) {
    portError.textContent = 'Port must be between 1024 and 65535.';
    return;
  } else {
    portError.textContent = '';
  }

  chrome.storage.local.set({
    port,
    engines: {
      google: enableGoogle,
      g_maps: enableG_Maps,
      bing: enableBing,
      b_maps: enableB_Maps
    }
  }, () => {
    showNotice();
  });
}

document.getElementById('port').addEventListener('input', saveSettings);
document.getElementById('enable-google').addEventListener('change', saveSettings);
document.getElementById('enable-g-maps').addEventListener('change', saveSettings);
document.getElementById('enable-bing').addEventListener('change', saveSettings);
document.getElementById('enable-b-maps').addEventListener('change', saveSettings);

async function restoreOptions() {
  const result = await chrome.storage.local.get(['port', 'engines']);
  document.getElementById('port').value = result.port || 27123;

  const engines = result.engines || {};
  document.getElementById('enable-google').checked = engines.google ?? true;
  document.getElementById('enable-g-maps').checked = engines.g_maps ?? true;
  document.getElementById('enable-bing').checked   = engines.bing ?? false;
  document.getElementById('enable-b-maps').checked = engines.b_maps ?? true;
}

function showNotice() {
  const el = document.getElementById('notice');
  el.style.opacity = '1';
  setTimeout(() => {
    el.style.opacity = '0';
  }, 1200);
}

restoreOptions();
