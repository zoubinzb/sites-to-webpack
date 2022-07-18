/*eslint-disable*/
const path = require("path");
const merge = require("webpack-merge");
const baseConfig = require("./webpack.config.js");
const webpack = require('webpack')

const {
  createAllTemplate,
  staticResouceCopy
} = require("./app.js");
// webpack的开发环境配置，从基本配置中合并
// 合并是利用 webpack-merge 完成的： https://github.com/survivejs/webpack-merge
const devConfig = {
  mode: "development",
  devtool: "source-map",
  devServer: {
    open: true,
    inline: true,
    hot: true,
    compress: true,
    port: 8080,
    stats: {
      colors: true, // 打包时使用不同的颜色区分信息
      modules: false, // 打包时不显示具体模块信息
      entrypoints: false, // 打包时不显示入口模块信息
      children: false, // 打包时不显示子模块信息
      detailed: true,
      assets: false,
    }
    
  },
  plugins: [
    ...createAllTemplate("development"),
    ...staticResouceCopy("development"),
    new webpack.HotModuleReplacementPlugin()
  ],
};
module.exports = merge(baseConfig, devConfig);