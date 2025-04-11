---
tags:
- review
---
# Obsidian Search Logger - Setup

1. Install and activate [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887).
2. Setup javascript in your Safari.
3. Setup python script to launch automatically.

### Step 1: Install and activate 'Userscripts'

[Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887) is a Safari extension app. You download it from the AppStore and activate it.
Other user script manager like [Tampermonkey](https://www.tampermonkey.net) also works.

### Step 2: Search logger javascript

You create a user script in [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887) and activate it. You can copy/paste the following script.
This script assumes you use `www.google.com`  or `www.google.co.jp` as your search engine for Safari. To use other search engine, modify `@match` value(s).

```
// ==UserScript==
// @name         Search Logger
// @match        https://www.google.com/*search*
// @match        https://www.google.co.jp/*search*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    const query = new URLSearchParams(window.location.search).get("q");
    if (!query) return;
    const searchUrl = window.location.href;
		
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

You can manually run `obsidian_logger.py` from Terminal.app. Instead, you can automate it using `setup_logger.py`.

In Terminal.app you provide the following commands:

```bash
cd (this folder)
./setup_logger.py
```

This will install a LaunchAgent file in your '~/Libraries/LaunchAgent' folder.

# Security and Privacy settings

To run Obsidian Search Logger correctly, you need to turn ON the following settings:

- **python3** in System Settings.app >> General >> Login items and extensions
- **google.com**, **google.co.jp** in Safari.app >> Settings >> Extensions >> Userscripts
	- Other sites can be turned OFF (unless you need them for other scripts).
	- If you use other search engine(s), do accordingly.

# To uninstall

1. UnInstall [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887). Just move it to trash.
2. Run`uninstall_logger.py`.

```bash
./uninstall_logger.py
```

---
from README