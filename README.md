# Obsidian Search Logger

This package helps logging your search queries in an Obsidian vault. It works for Safari on macOS.

Typically the search log looks like;

  **SearchLog**
  - 2025-04-07 13:40 — [hello world](https://www.google.com/search?client=safari&rls=en&q=hello+world&ie=UTF-8&oe=UTF-8)
  - 2025-04-07 13:49 — [how to auto record search history in Obsidian](https://www.google.com/search?q=how+to+auto+record+search+history+in+Obsidian)

### Why logging search queries?

- To examine if I correctively search Internet,
- To play back my think porcess and routes.
### How it works

Obsidian Search Logger has two components.

1. Logger javascript, with aid of browser extension.
2. Python code `obsidian_logger.py` to update a search log file in the vault.

The javascript is to signal to the python code about your search queries. 
The python code receives it then writes in an Obsidian vault folder.

# [Setup](Docs/Setup.md)

See [Setup](Docs/Setup.md) for install / uninstall instructions.
### For other browsers?

I tested Chrome.app + [Tampermonkey](https://www.tampermonkey.net) and it works. Tampermonkey does similar to Userscripts.

### For Linux?

I tested with Firefox + [Tampermonkey](https://www.tampermonkey.net) on Ubuntu 24.04. You can use `setup_logger.py` to automatically launch `obsidian_logger.py` when GUI session starts.
Distribution of Obsidian for Linux is in AppImage, Snap and more. Currently I conded and tested for Snap only.

### For windows?

Not tested...

# Trouble shooting
- [Mac](Trouble_shooting_macos.md)
