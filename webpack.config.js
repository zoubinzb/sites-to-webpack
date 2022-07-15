const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin"); // 处理模板页面
const {
  CleanWebpackPlugin
} = require("clean-webpack-plugin"); // 清除 dist 目录
const CopyPlugin = require("copy-webpack-plugin"); // 处理静态资源
const MiniCssExtractPlugin = require("mini-css-extract-plugin"); // 打包css文件
const {
  createEntry
} = require("./app.js");

module.exports = {
  entry: createEntry(),
  output: {
    filename: 'static/js/[hash:5].[name].bundle.js',
    path: path.resolve(__dirname, `sites`),
  },
  stats: {
    colors: true, // 打包时使用不同的颜色区分信息
    modules: false, // 打包时不显示具体模块信息
    entrypoints: false, // 打包时不显示入口模块信息
    children: false, // 打包时不显示子模块信息
  },
  module: {
    rules: [{
        // 各种图片、字体文件，均交给 url-loader 处理
        test: /\.(png)|(gif)|(jpg)|(svg)|(bmp)|(eot)|(woff)|(ttf)$/i,
        use: [{
          loader: "url-loader",
          options: {
            limit: 10 * 1024, //只要文件不超过 100*1024 字节，则使用base64编码，否则，交给file-loader进行处理
            name: "static/[name].[hash:5].[ext]",
          },
        }, ],
      },
      {
        // 所有的 css 和 pcss 文件均交给 postcss 处理
        test: /\.(css)|(pcss)$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.js$/,
        use: "babel-loader"
      },
      {
        test: /\.pug$/,
        loader: [{
            loader: "raw-loader"
          },
          {
            loader: path.resolve(__dirname, './loader/pug-mugua-html-loader.js'),
            query: {
              data: [],
            }
          }
        ]
      }
    ],
  },
  plugins: [
    new CleanWebpackPlugin(), // 应用 清除输出目录 插件
    new CopyPlugin({
      // 应用 复制文件 插件
      patterns: [{
        from: path.resolve(__dirname, "template/static"), // 将public目录中的所有文件
        to: "./static", // 复制到 输出目录 的根目录
      }, ],
    }),
    new CopyPlugin({
      // 应用 复制文件 插件
      patterns: [{
        from: path.resolve(__dirname, "images/imgCover"), // 将public目录中的所有文件
        to: "./static/imgCover", // 复制到 输出目录 的根目录
      }, ],
    }),
    new MiniCssExtractPlugin({
      // 打包 css 代码 到文件中
      filename: "static/css/[hash:5].[name].css",
    }),
  ],
};