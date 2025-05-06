# Obsidian Search Logger - Setup

Please find detailed explanation for your OS/browser combination.

- [macOS : Safari + Userscripts](<Setup - Safari + Userscripts on macOS.md>)
- [macOS : Chrome + Tampermonkey](<Setup - Chrome + Tampermonkey.md>)

# Step by step

- [Step 1 Install a browser extension](<#Step 1 Install a browser extension>)
- [Step 2 Activate javascript](<#Step 2 Activate javascript>)
- [Step 3 Setup python script](<#Step 3 Setup python script>)
- [Step 4 Tune OS and browser settings](<#Step 4 Tune OS and browser settings>) - See here for your OS + browser

## Step 1: Install a browser extension

A browser extension is necessary to run a javascript. Two extensions are available for major browsers.
- [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887) is a Safari extension for macOS. Free.
- [Tampermonkey](https://www.tampermonkey.net) is a multi-platform extension. It's a choice for Chrome, Firefox, and Edge.

## Step 2: Activate javascript

You create a user script and activate it. You can copy/paste the following script.
- [search_logger.js](search_logger.js) <-- (External editor may open)
This script assumes you use `www.google.com`  or `www.google.co.jp`. To use other search engine, modify or add `@match` value(s).

You can also log google map search terms by adding following script.
- [search_map_logger.js](search_map_logger.js) <-- (External editor may open)

These scripts work for both Userscripts and Tampermonkey.

## Step 3: Setup python script

A python script `obsidian_logger.py` receives the search keywords from the javascript and records in a markdown file. For daily use, you can automate it using `setup_logger.py`.

In Terminal.app you run the following commands:

```bash
cd (this folder)
./setup_logger.py
```

You run it once at the beginning, or when updating Search Logger.

## Step 4: Tune OS and browser settings

To run Search Logger correctly, you need to tune the OS setting and browser extension settings.
# To uninstall

1. UnInstall [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887). Just move it to trash.
2. Run`uninstall_logger.py`.

```bash
./uninstall_logger.py
```

---
from README
