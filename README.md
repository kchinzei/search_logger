# Search Logger for Obsidian

This package helps logging your search terms in Google, Bing.
It works for Chrome, Edge, Safari, Firefox on Windows and macOS.

Typically the search log looks like;

  **SearchLog**
  - 2025-04-07 13:40 — [hello world](https://www.google.com/search?client=safari&rls=en&q=hello+world&ie=UTF-8&oe=UTF-8)
  - 2025-04-07 13:49 — [how to auto record search history in Obsidian](https://www.google.com/search?q=how+to+auto+record+search+history+in+Obsidian)
  - 2025-04-07 13:53 — [Yellowstone National Park](https://www.google.com/maps/search/Yellowstone+National+Park)

You can also log Google Map search terms

### Why logging search queries?

- To examine if I correctively search Internet,
- To play back my thinking process.
### How it works

Search Logger has two components.

1. Browser extension
2. Obsidian plugin

The browser extension transmits the search terms and the Obsidian plugin receives it and write in an Obsidian note.

# Setup