const { merge } = require('webpack-merge');
const prodConfig = require('./webpack.prod');

module.exports = merge(prodConfig, {
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: '@jsdevtools/coverage-istanbul-loader',
            options: { esModules: true },
          },
        ],
        enforce: 'post',
      },
    ],
  },
});
