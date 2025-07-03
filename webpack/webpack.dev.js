const webpackMerge = require('webpack-merge').merge;
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const SimpleProgressWebpackPlugin = require('simple-progress-webpack-plugin');
const WebpackNotifierPlugin = require('webpack-notifier');
const path = require('path');
const sass = require('sass');

const utils = require('./utils.js');
const commonConfig = require('./webpack.common.js');

const ENV = 'development';

module.exports = async options => {
  const isCoverage = process.env.NODE_ENV === 'test';
  const baseConfig = await commonConfig({ env: ENV });

  // Add coverage instrumentation when NODE_ENV=test
  if (isCoverage) {
    const tsRule = baseConfig.module.rules.find(rule => rule.test && rule.test.toString().includes('tsx?'));
    if (tsRule) {
      tsRule.use = [
        {
          loader: 'thread-loader',
          options: {
            workers: require('os').cpus().length - 1,
          },
        },
        {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              ['@babel/preset-typescript', { allowNamespaces: true }],
            ],
            plugins: [
              [
                'babel-plugin-istanbul',
                {
                  extension: ['.js', '.jsx', '.ts', '.tsx'],
                  exclude: [
                    'node_modules/**',
                    'src/test/**',
                    'src/**/*.spec.ts',
                    'src/**/*.spec.tsx',
                    'src/**/*.test.ts',
                    'src/**/*.test.tsx',
                  ],
                },
              ],
            ],
          },
        },
        {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            happyPackMode: true,
          },
        },
      ];
    }
  }

  return webpackMerge(baseConfig, {
    devtool: 'cheap-module-source-map', // https://reactjs.org/docs/cross-origin-errors.html
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
      new BrowserSyncPlugin(
        {
          https: options.tls,
          host: 'localhost',
          port: 9000,
          proxy: {
            target: `http${options.tls ? 's' : ''}://localhost:${options.watch ? '8080' : '9060'}`,
            ws: true,
            proxyOptions: {
              changeOrigin: false, //pass the Host header to the backend unchanged https://github.com/Browsersync/browser-sync/issues/430
            },
          },
          socket: {
            clients: {
              heartbeatTimeout: 60000,
            },
          },
          /*
      ,ghostMode: { // uncomment this part to disable BrowserSync ghostMode; https://github.com/jhipster/generator-jhipster/issues/11116
        clicks: false,
        location: false,
        forms: false,
        scroll: false
      } */
        },
        {
          reload: false,
        },
      ),
      new WebpackNotifierPlugin({
        title: 'Simple Budget Tracker',
        contentImage: path.join(__dirname, 'logo-jhipster.png'),
      }),
    ].filter(Boolean),
  });
};
