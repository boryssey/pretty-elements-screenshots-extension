/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

const alias = {
  "@src/*": "src/*",
};

if (process.env.NODE_ENV !== "development") {
  process.env.NODE_ENV = "production";
}

const options = {
  mode: process.env.NODE_ENV,
  devServer: {
    hot: false,
  },
  entry: {
    background: path.resolve(__dirname, "src", "Background", "index.ts"),
    popup: path.resolve(__dirname, "src", "Popup", "index.ts"),
    content: path.resolve(__dirname, "src", "ContentScripts", "index.ts"),
  },
  output: {
    path: path.join(__dirname, "./dist"),
    clean: true,
    filename: "[name].js",
  },
  resolve: {
    alias,
    extensions: [".js", ".ts"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: "html-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(css|scss)$/,
        use: [
          {
            loader: "style-loader",
            options: {
              injectType: "lazyStyleTag",
              insert: require.resolve("./insertStyle.js"),
            },
          },
          {
            loader: "css-loader",
          },
          // {
          //   loader: "sass-loader",
          //   options: {
          //     sourceMap: true,
          //   },
          // },
        ],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin({
      verbose: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "./manifest.json",
          to: path.join(__dirname, "dist"),
        },
      ],
    }),
    new CopyPlugin({
      patterns: [
        {
          from: ".",
          to: ".",
          context: "public",
        },
      ],
    }),
  ],
  infrastructureLogging: {
    level: "verbose",
  },
};

if (process.env.NODE_ENV === "development") {
  options.devtool = "cheap-module-source-map";
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
