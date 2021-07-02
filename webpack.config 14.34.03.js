let path = require('path');

module.exports = {
    mode: "production",
    entry: {
        app: "./src/index.js"
    },
    output: {
        filename: "bundle.[hash:8].js",
        path: path.resolve(__dirname ,"dist"),  // 路径必须是绝对路径
    },
};
