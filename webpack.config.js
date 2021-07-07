/**
 * 必须使用CommonJs规范
 */

const path = require("path");
// const uglify = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: {
    // app: "./test/app.js"
    // app: "./src/a.js"
    app: "./src/chainEntry.js"
  },
  output: {
    publicPath: __dirname + "/dist/",
    path: path.resolve(__dirname, "dist"),
    filename: "tetchain.js",
    libraryTarget: 'commonjs2'
  },
  devtool: 'source-map',
  // module: {
  //   rules: [
  //     {
  //       test: /\.js$/,
  //       loader: 'babel-loader',
  //       exclude: /node_modules/
  //     }
  //   ]
  // }
  // plugins:[
  //   new uglify()
  // ]
};
