# Search Logger browser extension for Obsidian 

It is a part of Search Logger for Obsidian. It stays in your browser (Chrome, Edge, Safar, Firefox) to capture the search terms while Obsidian is running.

Due to the nature of two-pieces software, you need to install and setup both extension and plugin.

## Installation

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run build` to start compilation.

For detail, see [[#Developers]].

## Setup

- Go Extensions of your browser.
  Find 'Search Logger' and turn on.
- Go 'Search Logger Settings'
	- Log note name: Filename of a note. '.md' is automatically appeded.
	- Listener port: local server port number, match with that in the browser extension.
	- Prepend mode: When on, new entries are inserted at the top of the note. It can make Obsidian slow the the log growing very long.

## Developers

To build the extension:

```
npm run build
```

This will create three directories:
- `dist_chromium/` for the Chromium version
- `dist_firefox/` for the Firefox version
- `dist_safari/` for the Safari version
  For Safari on macOS and iOS, you need Xcode to compile.

### Install the extension locally

For Chromium browsers, such as Chrome, Brave, Edge, and Arc:

1. Open your browser and navigate to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** and select the `dist_chromium` folder

For Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate to the `dist_firefox` directory and select the `manifest.json` file.

For Safari on macOS:

1. Open `Search Logger.xcodeproj` using Xcode.
2. Build and run the project.
3. Open Safari and navigate to Safari menu >> Preferences >> Extensions.
4. Find 'Search Logger'.
