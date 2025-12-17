// webpack.shared.js
const path = require("path");
//const fs = require("fs");
//const CopyPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
//const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

/**
 * Build module.rules, resolve, and optimization configs.
 * Reused by desktop and ios configs.
 */
function createSharedParts(isProduction) {
  return {
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: { compilerOptions: { module: "ES2020" } },
            },
          ],
          exclude: /node_modules/,
        },
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: { sourceMap: !isProduction },
            },
            {
              loader: "sass-loader",
              options: { sourceMap: !isProduction },
            },
          ],
        },
      ],
    },

    resolve: {
      extensions: [".ts", ".js"],
      alias: {
        "./utils/browser-polyfill": path.resolve(
          __dirname,
          "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
        ),
        "../utils/browser-polyfill": path.resolve(
          __dirname,
          "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
        ),
      },
    },

    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            mangle: false,
            compress: {
              defaults: true,
              global_defs: {
                DEBUG_MODE: !isProduction,
              },
              unused: true,
              dead_code: true,
              passes: 2,
              ecma: 2020,
              module: false,
            },
            format: { ascii_only: true, comments: false, ecma: 2020 },
            toplevel: true,
            keep_classnames: true,
            keep_fnames: true,
          },
          extractComments: false,
        }),
      ],
      moduleIds: "named",
      chunkIds: "named",
    },
  };
}

module.exports = { createSharedParts };
