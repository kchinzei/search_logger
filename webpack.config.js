const path = require("path");
const { createSharedParts } = require("./webpack.shared.js");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ZipPlugin = require("zip-webpack-plugin");
const package = require("./package.json");
const webpack = require("webpack");
//const TerserPlugin = require("terser-webpack-plugin");

// Remove .DS_Store files
function removeDSStore(dir) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      removeDSStore(filePath);
    } else if (file === ".DS_Store") {
      fs.unlinkSync(filePath);
    }
  });
}

module.exports = (env, argv) => {
  const isFirefox = env.BROWSER === "firefox";
  const isSafari = env.BROWSER === "safari";
  const isProduction = argv.mode === "production";

  const getOutputDir = () => {
    if (isProduction) {
      return isFirefox
        ? "dist_firefox"
        : isSafari
          ? "dist_safari"
          : "dist_chromium";
    } else {
      return isFirefox ? "dev_firefox" : isSafari ? "dev_safari" : "dev";
    }
  };

  const outputDir = getOutputDir();
  const browserName = isFirefox ? "firefox" : isSafari ? "safari" : "chrome";

  const shared = createSharedParts(isProduction);

  const mainConfig = {
    mode: argv.mode,
    entry: {
      content: "./src/content.ts",
      background: "./src/background.ts",
      logview: "./src/logview.ts",
      options: "./src/options.ts",
      popup: "./src/popup.ts",
    },
    output: {
      path: path.resolve(__dirname, outputDir),
      filename: "[name].js",
      module: false,
    },

    ...shared, // <<— reuse ALL rules, resolve, optimization

    devtool: isProduction ? false : "source-map",
    experiments: {
      outputModule: false,
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: isFirefox
              ? "src/manifest.firefox.json"
              : isSafari
                ? "src/manifest.safari.json"
                : "src/manifest.chromium.json",
            to: "manifest.json",
          },
          { from: "src/logview.html", to: "logview.html" },
          { from: "src/logview.css", to: "logview.css" },
          { from: "src/options.html", to: "options.html" },
          { from: "src/options.css", to: "options.css" },
          { from: "src/popup.html", to: "popup.html" },
          { from: "src/popup.css", to: "popup.css" },
          { from: "src/icons", to: "icons" },
          { from: "src/lang", to: "lang" },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: "[name].css",
      }),
      {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("RemoveDSStore", (_compilation) => {
            removeDSStore(path.resolve(__dirname, outputDir));
          });
        },
      },
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(argv.mode),
        DEBUG_MODE: JSON.stringify(!isProduction),
      }),
      ...(isProduction
        ? [
            new ZipPlugin({
              path: path.resolve(__dirname, "builds"),
              filename: `search-logger-${package.version}-${browserName}.zip`,
            }),
          ]
        : []),
    ],
  };

  return [mainConfig];
};
