// webpack.ios.config.js
const path = require("path");
const { createSharedParts } = require("./webpack.shared.js");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";
  const outputDir = isProduction ? "dist_ios" : "dev_ios";

  const shared = createSharedParts(isProduction);

  return {
    mode: argv.mode,
    entry: {
      popup: "./src/popup.ios.ts",
    },

    output: {
      path: path.resolve(__dirname, outputDir),
      filename: "[name].js",
      module: false
    },

    ...shared,  // <<— reuse ALL rules, resolve, optimization
  };
};