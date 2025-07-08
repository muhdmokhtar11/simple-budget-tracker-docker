const path = require('path');
const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common');

const webpackConfig = {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)$/,
        use: [
          {
            loader: '@jsdevtools/coverage-istanbul-loader',
            options: {
              // Instrument only the source files, not test files
              exclude: [/\.(e2e|spec|test)\.(ts|tsx|js)$/, /node_modules/, /test\/javascript/],
            },
          },
        ],
        enforce: 'post',
        include: path.resolve('src/main/webapp/'),
      },
    ],
  },
};

module.exports = merge(commonConfig, webpackConfig);
