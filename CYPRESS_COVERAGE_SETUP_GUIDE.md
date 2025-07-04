# Cypress Code Coverage Setup Guide for React Applications

## Overview

This guide provides step-by-step instructions for implementing comprehensive Cypress E2E test coverage in your React application. The setup includes code instrumentation, coverage collection, and detailed reporting.

## Prerequisites

- An existing React application
- Node.js and npm installed
- Cypress already set up in your project

## Step 1: Install Required Dependencies

Add these development dependencies to your project:

```bash
npm install --save-dev @cypress/code-coverage@^3.14.5 \
                      @istanbuljs/nyc-config-typescript@^1.0.2 \
                      @jsdevtools/coverage-istanbul-loader@^3.0.5 \
                      nyc@^15.1.0 \
                      babel-plugin-istanbul@^6.1.1
```

## Step 2: Create Configuration Files

### 2.1 Webpack E2E Configuration

Create `webpack/webpack.e2e.js`:

```javascript
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
    // ... rest of webpack config ...
  });
```

### 2.2 NYC Configuration

Create `.nycrc.json` in your project root:

```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "include": ["src/main/webapp/app/**/*.{js,ts,tsx}"],
  "reporter": ["html", "lcov", "json", "text"],
  "report-dir": "target/cypress/coverage",
  "temp-dir": "target/cypress/.nyc_output"
}
```

### 2.3 Cypress Configuration

Update `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Your existing config
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
  component: {
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      return config;
    },
  },
});
```

### 2.4 Cypress Support File

Add to `cypress/support/e2e.ts` or `cypress/support/index.ts`:

```typescript
import '@cypress/code-coverage/support';
```

## Step 3: NPM Scripts Configuration

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "webapp:build:e2e": "npm run webapp:build -- --config webpack/webpack.e2e.js",
    "e2e:cypress:coverage": "npm run webapp:build:e2e && cypress run",
    "e2e:cypress:coverage:open": "npm run webapp:build:e2e && cypress open"
  }
}
```

## Step 4: Directory Structure

The project must follow this exact structure for the coverage setup to work correctly:

```
project/
├── src/
│   ├── main/
│   │   └── webapp/
│   │       └── app/                               # Your application source code
│   └── test/
│       └── javascript/
│           └── cypress/
│               ├── plugins/
│               │   └── index.ts                   # Coverage plugin setup
│               └── support/
│                   └── index.ts                   # Coverage support import
├── webpack/
│   ├── webpack.common.js                         # Common webpack config
│   ├── webpack.dev.js                           # Development config
│   ├── webpack.prod.js                          # Production config
│   └── webpack.e2e.js                           # E2E testing with coverage
├── .nycrc.json                                  # Coverage configuration
├── cypress.config.ts                            # Cypress config with coverage
└── target/cypress/coverage/                     # Coverage reports output
    ├── index.html                               # Interactive HTML report
    ├── lcov.info                                # CI/CD integration format
    └── coverage-final.json                      # Programmatic access
```

### Support File Structure

Your `src/test/javascript/cypress/support/index.ts` should look exactly like this:

```typescript
// ***********************************************************
// This support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import your other support files
import './commands';
// Add any other support imports you need

// Import code coverage support
import '@cypress/code-coverage/support';
```

## Step 5: Usage Guide

### Building with Coverage Instrumentation

```bash
npm run webapp:build:e2e
```

### Running Tests with Coverage Collection

```bash
npm run e2e:cypress:coverage
```

### Opening Cypress GUI with Coverage

```bash
npm run e2e:cypress:coverage:open
```

### Viewing Coverage Reports

1. Open `target/cypress/coverage/index.html` in your browser
2. Check console output for coverage summary
3. Find detailed reports in `target/cypress/coverage/`

## Important Notes

- Coverage reports include all application code without filtering
- Multiple report formats are generated (HTML, LCOV, JSON, text)
- Coverage data is collected for `.js`, `.ts`, and `.tsx` files
- Source maps are enabled for accurate reporting
- Setup is configured for TypeScript/React projects but can be adapted

## Verification Checklist

- [ ] Webpack E2E build compiles successfully
- [ ] Coverage plugin loads without errors
- [ ] Istanbul instrumentation is applied to source files
- [ ] Coverage reports generate in target directory
- [ ] Integration with existing Cypress setup is maintained

## Benefits

1. **Comprehensive Coverage**: Full application code instrumentation
2. **Multiple Report Formats**: HTML, LCOV, JSON, and text outputs
3. **Unfiltered Build Analysis**: Raw view of entire application bundle
4. **Developer Friendly**: Interactive HTML reports with line-by-line coverage
5. **Framework Compatible**: Seamless integration with existing project structure

## Technical Challenges Resolved

1. **Istanbul Loader Compatibility**: Using `@jsdevtools/coverage-istanbul-loader` for TypeScript/JSX support
2. **Integration**: Separate E2E webpack config to avoid conflicts with development builds
3. **Coverage Plugin**: Proper configuration with existing audit tools
4. **TypeScript Support**: NYC TypeScript configuration for proper source mapping

## Troubleshooting

If you encounter issues:

1. Verify all dependencies are installed correctly
2. Check webpack configuration paths match your project structure
3. Ensure Cypress support files are properly configured
4. Verify build scripts are running with correct configuration
5. Check console for any error messages during build or test runs
