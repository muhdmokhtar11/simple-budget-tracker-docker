# Complete Cypress Code Coverage Setup Guide

This guide provides step-by-step instructions for setting up comprehensive code coverage for Cypress tests in a web application.

## Prerequisites

- Node.js and npm installed
- Existing Cypress test suite
- React/TypeScript/JavaScript application

## Step 1: Install Required Dependencies

```bash
npm install --save-dev @cypress/code-coverage babel-plugin-istanbul nyc
npm install --save-dev @babel/core @babel/preset-env @babel/preset-typescript @babel/preset-react
```

## Step 2: Create Configuration Files

### 2.1 Babel Configuration (`babel.config.js`)

```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { allowNamespaces: true }],
    '@babel/preset-react',
  ],
  plugins: [
    [
      'babel-plugin-istanbul',
      {
        exclude: [
          '**/*.spec.ts',
          '**/*.spec.tsx',
          '**/*.test.ts',
          '**/*.test.tsx',
          '**/test/**',
          '**/tests/**',
          '**/*.cy.ts',
          '**/*.cy.tsx',
          '**/cypress/**',
          '**/node_modules/**',
        ],
      },
    ],
  ],
};
```

### 2.2 NYC Configuration (`.nycrc.json`)

```json
{
  "extends": "@cypress/code-coverage/nycrc-base",
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.js", "src/**/*.jsx"],
  "exclude": [
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/test/**",
    "**/tests/**",
    "**/*.cy.ts",
    "**/*.cy.tsx",
    "**/cypress/**",
    "**/node_modules/**",
    "coverage/**",
    "dist/**",
    "build/**"
  ],
  "reporter": ["html", "json", "text", "text-summary"],
  "report-dir": "coverage",
  "temp-dir": ".nyc_output"
}
```

### 2.3 Update Cypress Configuration (`cypress.config.ts`)

```typescript
import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:9000',
    specPattern: 'src/test/javascript/cypress/e2e/**/*.cy.ts',
    supportFile: 'src/test/javascript/cypress/support/index.ts',
    fixturesFolder: 'src/test/javascript/cypress/fixtures',
    videosFolder: 'target/cypress/videos',
    screenshotsFolder: 'target/cypress/screenshots',
    video: false,
    setupNodeEvents(on, config) {
      codeCoverageTask(on, config);
      return config;
    },
    env: {
      // Add coverage collection flag
      coverage: true,
      // Add your application-specific environment variables
      E2E_USERNAME: 'user',
      E2E_PASSWORD: 'user',
    },
  },
});
```

## Step 3: Update Cypress Support Files

### 3.1 Update Support Index (`src/test/javascript/cypress/support/index.ts`)

```typescript
import './commands';
import '@cypress/code-coverage/support';

// Add any global configurations here
```

### 3.2 Create Coverage Authentication Helper (`src/test/javascript/cypress/support/coverage-auth.ts`)

```typescript
export const authenticateForCoverage = () => {
  // Simple authentication approach for coverage testing
  cy.visit('/');

  // Wait for the page to load
  cy.get('body').should('be.visible');

  // If login is required, perform it
  cy.get('body').then($body => {
    if ($body.find('[data-cy="login"]').length > 0) {
      cy.get('[data-cy="login"]').click();
      cy.get('[data-cy="username"]').type(Cypress.env('E2E_USERNAME') || 'user');
      cy.get('[data-cy="password"]').type(Cypress.env('E2E_PASSWORD') || 'user');
      cy.get('[data-cy="submit"]').click();
      cy.url().should('not.include', '/login');
    }
  });
};
```

## Step 4: Update Package.json Scripts

Add the following scripts to your `package.json`:

```json
{
  "scripts": {
    "cypress:coverage": "NODE_ENV=test cypress run --env coverage=true",
    "cypress:coverage:open": "NODE_ENV=test cypress open --env coverage=true",
    "cypress:count": "find src/test/javascript/cypress/e2e -name '*.cy.ts' -exec grep -l 'it\\|describe' {} \\; | wc -l",
    "coverage:report": "nyc report --reporter=html --reporter=text-summary",
    "coverage:clean": "rm -rf .nyc_output coverage"
  }
}
```

## Step 5: Create Automation Script

Create `cypress-coverage.sh`:

```bash
#!/bin/bash

# Cypress Coverage Test Runner
# This script runs Cypress tests with code coverage and generates reports

echo "🚀 Starting Cypress Coverage Test Runner"
echo "========================================"

# Clean previous coverage data
echo "🧹 Cleaning previous coverage data..."
rm -rf .nyc_output coverage

# Count test files
echo "📊 Counting test files..."
TEST_FILES=$(find src/test/javascript/cypress/e2e -name "*.cy.ts" | wc -l)
echo "Found $TEST_FILES test files"

# Start the application (if needed)
echo "🚀 Starting application..."
# npm run start & # Uncomment if you need to start your app
# APP_PID=$!
# sleep 30 # Wait for app to start

# Run Cypress tests with coverage
echo "🧪 Running Cypress tests with coverage..."
NODE_ENV=test npx cypress run --env coverage=true

# Generate coverage report
echo "📈 Generating coverage report..."
npx nyc report --reporter=html --reporter=text-summary

# Display results
echo "✅ Coverage test complete!"
echo "📊 Coverage report generated in: coverage/index.html"
echo "📁 Open coverage/index.html in your browser to view detailed results"

# Cleanup (if app was started)
# if [ ! -z "$APP_PID" ]; then
#   echo "🛑 Stopping application..."
#   kill $APP_PID
# fi

echo "🎉 Done!"
```

Make it executable:

```bash
chmod +x cypress-coverage.sh
```

## Step 6: Webpack Configuration for Coverage (Optional)

If you need custom webpack configuration for coverage, create `webpack/webpack.coverage.js`:

```javascript
const { merge } = require('webpack-merge');
const webpackDevConfig = require('./webpack.dev.js');

module.exports = merge(webpackDevConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: /src/,
        exclude: [/node_modules/, /\.spec\.(js|jsx|ts|tsx)$/, /\.test\.(js|jsx|ts|tsx)$/, /\.cy\.(js|jsx|ts|tsx)$/, /cypress/, /test/],
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              ['@babel/preset-typescript', { allowNamespaces: true }],
              '@babel/preset-react',
            ],
            plugins: [
              [
                'babel-plugin-istanbul',
                {
                  exclude: [
                    '**/*.spec.ts',
                    '**/*.spec.tsx',
                    '**/*.test.ts',
                    '**/*.test.tsx',
                    '**/test/**',
                    '**/tests/**',
                    '**/*.cy.ts',
                    '**/*.cy.tsx',
                    '**/cypress/**',
                    '**/node_modules/**',
                  ],
                },
              ],
            ],
          },
        },
      },
    ],
  },
});
```

## Step 7: Running Tests with Coverage

### Quick Test Count

```bash
npm run cypress:count
```

### Run Tests with Coverage

```bash
npm run cypress:coverage
```

### Interactive Coverage Testing

```bash
npm run cypress:coverage:open
```

### Using the Automation Script

```bash
./cypress-coverage.sh
```

## Step 8: Viewing Coverage Reports

After running tests with coverage:

1. **HTML Report**: Open `coverage/index.html` in your browser
2. **Terminal Summary**: Coverage summary is displayed in the terminal
3. **JSON Report**: Available in `coverage/coverage-final.json`

## Troubleshooting Common Issues

### 1. "cy.request() requires a url" Error

**Problem**: Authentication helper fails with URL requirement.

**Solution**: Update your authentication commands to provide proper defaults:

```typescript
// In cypress/support/commands.ts
Cypress.Commands.add('authenticatedRequest', (options = {}) => {
  const defaultOptions = {
    url: options.url || '/',
    method: options.method || 'GET',
    failOnStatusCode: false,
    ...options,
  };

  return cy.request(defaultOptions);
});
```

### 2. Module Resolution Errors

**Problem**: "Module not found: Error: Can't resolve './src'"

**Solution**: Ensure your webpack configuration has proper path resolution and avoid complex webpack overrides. Use environment variables instead:

```javascript
// Use NODE_ENV=test instead of separate webpack config
if (process.env.NODE_ENV === 'test') {
  // Add test-specific configurations
}
```

### 3. No Coverage Data Generated

**Problem**: Tests run but no coverage data is collected.

**Solution**:

- Ensure `@cypress/code-coverage/support` is imported in your support file
- Verify babel-plugin-istanbul is properly configured
- Check that your source files are being instrumented

### 4. Coverage Excluding Too Much Code

**Problem**: Important files not showing in coverage.

**Solution**: Review your `.nycrc.json` include/exclude patterns:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["**/*.spec.*", "**/*.test.*", "**/test/**"]
}
```

## Advanced Configuration

### Custom Coverage Thresholds

Add to `.nycrc.json`:

```json
{
  "check-coverage": true,
  "statements": 80,
  "branches": 80,
  "functions": 80,
  "lines": 80
}
```

### Multiple Report Formats

```json
{
  "reporter": ["html", "json", "text", "lcov", "cobertura"]
}
```

### Environment-Specific Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    env: {
      coverage: process.env.NODE_ENV === 'test',
      codeCoverage: {
        url: process.env.COVERAGE_API_URL || 'http://localhost:9000/__coverage__',
      },
    },
  },
});
```

## Best Practices

1. **Keep Coverage Realistic**: Aim for 70-80% coverage, not 100%
2. **Focus on Critical Paths**: Ensure important user flows are covered
3. **Regular Monitoring**: Set up CI/CD to track coverage trends
4. **Exclude Test Files**: Always exclude test files from coverage
5. **Use Meaningful Metrics**: Look at branch coverage, not just line coverage

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Cypress Coverage
on: [push, pull_request]

jobs:
  cypress-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Cypress with coverage
        run: npm run cypress:coverage
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v1
```

## Summary

This setup provides:

- ✅ **Comprehensive coverage collection** for all source files
- ✅ **Multiple report formats** (HTML, JSON, text)
- ✅ **Automated test execution** with coverage
- ✅ **Configurable thresholds** and exclusions
- ✅ **CI/CD integration** ready
- ✅ **Troubleshooting guides** for common issues

The coverage reports will show you exactly which lines, branches, and functions are covered by your Cypress tests, helping you identify gaps in your test coverage and improve your testing strategy.
