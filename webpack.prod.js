/*eslint-disable*/
const merge = require("webpack-merge");
const baseConfig = require("./webpack.config.js");
const {
  createAllTemplate,
  staticResouceCopy
} = require("./app.js");
// webpack的生产环境配置，从基本配置中合并
// 合并是利用 webpack-merge 完成的： https://github.com/survivejs/webpack-merge
const prodConfig = {
  mode: "production",
  devtool: "none",
  // optimization: {
  //   splitChunks: {
  //     //分包配置
  //     chunks: "all",
  //     cacheGroups: {
  //       styles: {
  //         minSize: 0,
  //         test: /\.css$/,
  //         minChunks: 2,
  //       },
  //     },
  //   },
  // },
  plugins: [
    ...createAllTemplate("production"),
    ...staticResouceCopy("production")
  ],
};

module.exports = merge(baseConfig, prodConfig);
