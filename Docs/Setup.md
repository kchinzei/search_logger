---
tags: []
---
# Obsidian Search Logger - Setup

- [[#Step 1 Install a browser extension]]
- [[#Step 2 Activate javascript]]
- [[#Step 3 Setup python script]]
- [[#Step 4 Tune OS and browser settings]] - See here for your OS + browser

- [[#To uninstall]]
### Step 1: Install a browser extension

A browser extension is necessary to run a javascript. Two extensions are available for major browsers.
- [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887) is a Safari extension for macOS. Free.
- [Tampermonkey](https://www.tampermonkey.net) is a multi-platform extension. It's a choice for Chrome, Firefox, and Edge.

### Step 2: Activate javascript

You create a user script and activate it. You can copy/paste the following script.
This script assumes you use `www.google.com`  or `www.google.co.jp`. To use other search engine, modify or add `@match` value(s).

```
// ==UserScript==
// @name         Search Logger
// @description  https://github.com/kchinzei/search_logger.git
// @version      0.4.1
// @match        https://www.google.com/*search*
// @match        https://www.google.co.jp/*search*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    const query = new URLSearchParams(window.location.search).get("q");
    if (!query) return;
    const searchUrl = `${window.location.protocol}//${window.location.host}/search?q=${encodeURIComponent(query)}`;
		
    GM_xmlhttpRequest({
        method: "POST",
        url: "http://localhost:27123",
        headers: {
            "Content-Type": "application/json"
        },
        data: JSON.stringify({
            query: query,
            url: searchUrl
        }),
        onload: function(res) {
            console.log("[Userscript] Sent search to Python:", res.status);
        },
        onerror: function(err) {
            console.error("[Userscript] Failed to send:", err);
        }
    });
})();
```

### Step 3: Setup python script

A python script `obsidian_logger.py` receives the search keywords from the javascript and records in a markdown file. For daily use, you can automate it using `setup_logger.py`.

In Terminal.app you run the following commands:

```bash
cd (this folder)
./setup_logger.py
```

You run it once at the beginning, or when updating Search Logger.

### Step 4: Tune OS and browser settings

To run Search Logger correctly, you need to tune the OS setting and browser extension settings.

- [macOS : Safari + Userscripts](<Setup - Safari + Userscripts on macOS>)
- macOS : Chrome + Tampermonkey
# To uninstall

1. UnInstall [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887). Just move it to trash.
2. Run`uninstall_logger.py`.

```bash
./uninstall_logger.py
```

---
from README
