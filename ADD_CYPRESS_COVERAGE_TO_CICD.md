# Add Cypress Code Coverage to CI/CD Pipeline

## Problem Statement

Add Cypress E2E code coverage to the main.yaml CI/CD pipeline. The coverage setup may work locally but shows `100% (0/0)` in CI/CD because:

1. **Wrong execution order** - JAR packaged before coverage build
2. **Wrong script execution** - CI uses regular Cypress instead of coverage-enabled version
3. **Missing coverage data collection** - Coverage plugin not properly collecting data

## Root Cause Analysis

### The Problem Chain:

1. **CI/CD runs**: `npm run ci:e2e:run`
2. **Which executes**: `concurrently npm:ci:e2e:server:start npm:e2e:headless`
3. **npm:e2e:headless executes**: `npm run e2e:cypress` (regular, no coverage)
4. **Result**: Server runs with non-instrumented code = `100% (0/0)`

### What We Need:

1. **Coverage-enabled build** → **Coverage-enabled JAR** → **Coverage-enabled tests**
2. **Proper script execution**: Use `npm:e2e:cypress` with coverage-instrumented JAR
3. **Coverage data collection**: Ensure NYC can find and process coverage data

## Required Execution Order

**CRITICAL**: The steps must follow this exact order to ensure coverage instrumentation is included in the E2E JAR:

1. ✅ **Build production JAR** (`npm run java:jar:prod`)
2. ✅ **Build with coverage** (`npm run webapp:build:e2e`) - Creates instrumented files in `target/classes/static/`
3. ✅ **Package E2E JAR** (`npm run ci:e2e:package`) - Packages the coverage-instrumented files
4. ✅ **Run coverage-enabled tests** - Server uses JAR with coverage instrumentation

## Complete Implementation Guide

### Step 1: Add Coverage-Enabled CI Script

Add this script to your `package.json`:

```json
{
  "scripts": {
    "ci:e2e:coverage": "concurrently -k -s first -n application,e2e -c red,blue npm:ci:e2e:server:start npm:e2e:cypress"
  }
}
```

**Key Difference**: Uses `npm:e2e:cypress` instead of `npm:e2e:headless` to ensure coverage collection.

### Step 2: Update CI/CD Pipeline

Replace your entire E2E section in `.github/workflows/main.yml`:

```yaml
- name: Package application
  run: npm run java:jar:prod
- name: 'E2E: Build with Coverage'
  run: npm run webapp:build:e2e
- name: 'E2E: Package'
  run: npm run ci:e2e:package
- name: 'E2E: Prepare'
  run: npm run ci:e2e:prepare
- name: 'E2E: Setup Coverage Directories'
  run: |
    mkdir -p target/cypress/.nyc_output
    mkdir -p target/cypress/coverage
    echo "Coverage directories created"
- name: 'E2E: Run with Coverage'
  run: npm run ci:e2e:coverage
  env:
    CYPRESS_ENABLE_RECORD: false
    CYPRESS_PROJECT_ID: ${{ secrets.CYPRESS_PROJECT_ID }}
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
- name: 'E2E: Debug Coverage Data'
  run: |
    echo "Checking for coverage data..."
    ls -la target/cypress/ || echo "No target/cypress directory"
    ls -la target/cypress/.nyc_output/ || echo "No .nyc_output directory"
    find . -name "coverage*.json" -o -name "*.coverage" -o -name "__coverage__" 2>/dev/null || echo "No coverage files found"
  if: always()
- name: 'E2E: Generate Coverage Report'
  run: npx nyc report --reporter=html --reporter=text --reporter=lcov --reporter=json
  if: always()
- name: 'E2E: Upload Coverage Reports'
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: cypress-coverage-report
    path: target/cypress/coverage/
    retention-days: 30
- name: 'E2E: Upload Coverage to Codecov'
  uses: codecov/codecov-action@v4
  if: always()
  with:
    files: target/cypress/coverage/lcov.info
    flags: cypress-e2e
    name: cypress-coverage
    fail_ci_if_error: false
- name: 'E2E: Teardown'
  run: npm run ci:e2e:teardown
```

## Prerequisites (Verify These Exist)

Ensure your project has these coverage configuration files:

### 1. **`.nycrc.json`** - Coverage configuration

```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  "all": true,
  "check-coverage": true,
  "include": ["src/main/webapp/app/**/*.{js,ts,tsx}"],
  "exclude": ["src/main/webapp/app/**/*.spec.{js,ts,tsx}", "src/main/webapp/app/**/*.test.{js,ts,tsx}", "src/main/webapp/app/**/*.d.ts"],
  "reporter": ["html", "text", "text-summary", "lcov", "json"],
  "report-dir": "target/cypress/coverage",
  "temp-dir": "target/cypress/.nyc_output",
  "statements": 80,
  "branches": 80,
  "functions": 80,
  "lines": 80
}
```

### 2. **`webpack/webpack.e2e.js`** - Webpack config with Istanbul instrumentation

```javascript
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
}
```

### 3. **`cypress.config.ts`** - Coverage environment setup

```typescript
env: {
  codeCoverage: {
    url: 'http://localhost:8080/__coverage__',
  },
}
```

### 4. **`src/test/javascript/cypress/plugins/index.ts`** - Coverage plugin registration

```typescript
require('@cypress/code-coverage/task')(on, config);
```

### 5. **`src/test/javascript/cypress/support/index.ts`** - Coverage support import

```typescript
import '@cypress/code-coverage/support';
```

## Key Package.json Scripts Required

```json
{
  "scripts": {
    "webapp:build:e2e": "npm run clean-www && webpack --config webpack/webpack.e2e.js --env stats=minimal",
    "e2e:cypress": "cypress run --e2e --browser chrome",
    "ci:e2e:package": "npm run java:$npm_package_config_packaging:$npm_package_config_default_environment -- -Pe2e -Denforcer.skip=true",
    "ci:e2e:coverage": "concurrently -k -s first -n application,e2e -c red,blue npm:ci:e2e:server:start npm:e2e:cypress",
    "ci:e2e:server:start": "java -jar target/e2e.$npm_package_config_packaging --spring.profiles.active=e2e,$npm_package_config_default_environment"
  }
}
```

## Required Dependencies

```json
{
  "devDependencies": {
    "@cypress/code-coverage": "^3.14.5",
    "@istanbuljs/nyc-config-typescript": "^1.0.2",
    "@jsdevtools/coverage-istanbul-loader": "^3.0.5",
    "nyc": "^17.1.0",
    "babel-plugin-istanbul": "^7.0.0"
  }
}
```

## Why This Solution Works

### ❌ **Wrong Execution Flow (Before)**:

```
1. Package JAR (no coverage)
2. Build with coverage (too late!)
3. Run tests with non-instrumented JAR
4. Result: 100% (0/0)
```

### ✅ **Correct Execution Flow (After)**:

```
1. Build production JAR
2. Build with coverage (creates instrumented files)
3. Package E2E JAR (includes instrumented files)
4. Run coverage-enabled tests
5. Result: Real coverage data!
```

### ❌ **Wrong Script Execution (Before)**:

```
ci:e2e:run → e2e:headless → e2e:cypress (regular)
```

### ✅ **Correct Script Execution (After)**:

```
ci:e2e:coverage → e2e:cypress (with coverage-instrumented JAR)
```

## Expected Results

After implementation, coverage should show actual percentages:

```
=============================== Coverage summary ===============================
Statements   : 85.23% ( 1234/1448 )
Branches     : 79.45% ( 987/1243 )
Functions    : 88.12% ( 567/643 )
Lines        : 84.67% ( 1198/1415 )
```

## Coverage Outputs

- **HTML Report**: `target/cypress/coverage/index.html`
- **LCOV Report**: `target/cypress/coverage/lcov.info`
- **JSON Report**: `target/cypress/coverage/coverage-final.json`
- **GitHub Artifacts**: Coverage reports retained for 30 days
- **Codecov Integration**: Historical coverage tracking

## Troubleshooting

### Coverage Still Shows 0/0

1. **Check Debug Step Output**: Look for coverage data files in CI logs
2. **Verify Script Execution**: Ensure `ci:e2e:coverage` uses `npm:e2e:cypress`
3. **Check JAR Contents**: Verify E2E JAR contains instrumented files
4. **Validate Plugin Setup**: Ensure coverage plugin is properly registered

### Debug Commands for Local Testing

```bash
# Test coverage-enabled build
npm run webapp:build:e2e

# Check instrumented files
ls -la target/classes/static/

# Test coverage collection
npm run e2e:cypress:coverage

# Check coverage data
ls -la target/cypress/.nyc_output/
```

### No Coverage Reports Generated

- **Cause**: Missing NYC configuration or dependencies
- **Fix**: Verify `.nycrc.json` exists and `@cypress/code-coverage` is installed

### Coverage Plugin Not Working

- **Cause**: Missing plugin registration in Cypress config
- **Fix**: Check `cypress/plugins/index.ts` has `require('@cypress/code-coverage/task')(on, config)`

### Instrumentation Not Applied

- **Cause**: Webpack E2E config missing Istanbul loader
- **Fix**: Verify `webpack/webpack.e2e.js` has `@jsdevtools/coverage-istanbul-loader`

## Validation Checklist

Before running in CI/CD, verify locally:

- [ ] `npm run webapp:build:e2e` builds successfully
- [ ] `npm run e2e:cypress:coverage` collects coverage
- [ ] Coverage files exist in `target/cypress/.nyc_output/`
- [ ] `npx nyc report` generates reports
- [ ] Coverage shows actual percentages, not 0/0

---

This guide ensures comprehensive Cypress E2E coverage integration with proper execution order, correct script usage, and complete CI/CD pipeline configuration that actually works!
