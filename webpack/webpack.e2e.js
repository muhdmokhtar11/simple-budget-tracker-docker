const webpackMerge = require('webpack-merge').merge;
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const path = require('path');
const sass = require('sass');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';

module.exports = async options =>
  webpackMerge(await commonConfig({ env: ENV }), {
    devtool: 'cheap-module-source-map',
    mode: ENV,
    entry: ['./src/main/webapp/app/index'],
    output: {
      path: utils.root('target/classes/static/'),
      filename: '[name].[contenthash:8].js',
      chunkFilename: '[name].[chunkhash:8].chunk.js',
    },
    optimization: {
      moduleIds: 'named',
    },
    module: {
      rules: [
        {
          test: /\.(sa|sc|c)ss$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: { url: false },
            },
            {
              loader: 'postcss-loader',
            },
            {
              loader: 'sass-loader',
              options: { implementation: sass },
            },
          ],
        },
        // Add Istanbul instrumenter for code coverage
        {
          test: /\.(js|ts|tsx)$/,
          use: {
            loader: '@jsdevtools/coverage-istanbul-loader',
            options: {
              esModules: true,
              produceSourceMap: true,
            },
          },
          enforce: 'post',
          include: path.join(__dirname, '..', 'src/main/webapp/app'),
          exclude: [/\.(e2e|spec)\.ts$/, /node_modules/, /(ngfactory|ngstyle)\.js/],
        },
      ],
    },
    devServer: {
      hot: true,
      static: {
        directory: './target/classes/static/',
      },
      port: 9060,
      proxy: [
        {
          context: ['/api', '/services', '/management', '/v3/api-docs', '/h2-console'],
          target: `http${options.tls ? 's' : ''}://localhost:8080`,
          secure: false,
          changeOrigin: options.tls,
        },
        {
          context: ['/websocket'],
          target: 'ws://127.0.0.1:8080',
          ws: true,
        },
      ],
      historyApiFallback: true,
    },
    stats: process.env.JHI_DISABLE_WEBPACK_LOGS ? 'none' : options.stats,
    plugins: [
      process.env.JHI_DISABLE_WEBPACK_LOGS
        ? null
        : new SimpleProgressWebpackPlugin({
            format: options.stats === 'minimal' ? 'compact' : 'expanded',
          }),
    ].filter(Boolean),
  });
