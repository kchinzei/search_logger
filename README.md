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

1. Logger javascript (below), with aid of Safari extension [Userscripts](https://apps.apple.com/jp/app/userscripts/id1463298887).
2. Python code `obsidian_logger.py` to update a search log file in the vault.

The javascript is to signal to the python code about your search queries. 
The python code receives it then writes in an Obsidian vault folder.

# [Setup](Docs/Setup.md)

See [Setup](Docs/Setup.md) for install / uninstall instructions.
### For other browsers?

I tested Chrome.app + [Tampermonkey](https://www.tampermonkey.net) and it works. Tampermonkey does similar to Userscripts.

### For Linux?

The javascript and `obsidian_logger.py` should work also on browsers + [Tampermonkey](https://www.tampermonkey.net) on Linux. You can use `setup_logger.py` to automatically launch `obsidian_logger.py` when GUI session starts.
Distribution of Obsidian for Linux can be in AppImage, Snap and more. Currently I conded and tested for Snap only.

### For windows?

Not tested...

# [Trouble shooting](Docs/Trouble_shooting.md)