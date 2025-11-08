# Search Logger browser extension; Installation


## Installation (Developer)

You need to do it from command line.

- Clone the repo (`git clone https://github.com/kchinzei/search_logger.git`).
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run build` to start compilation.

This will create three directories:
- `dist_chromium/` for the Chromium version
- `dist_firefox/` for the Firefox version
- `dist_safari/` for the Safari version;
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
