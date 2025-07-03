# Add Cypress Code Coverage to CI/CD Pipeline

## Problem Statement

Add Cypress E2E code coverage to the main.yaml CI/CD pipeline. The coverage setup is already configured locally but shows `100% (0/0)` in CI/CD because the pipeline execution order prevents coverage instrumentation from being included in the E2E JAR.

## Required Execution Order

**CRITICAL**: The steps must follow this exact order to ensure coverage instrumentation is included in the E2E JAR:

1. ✅ **Build production JAR** (`npm run java:jar:prod`)
2. ✅ **Build with coverage** (`npm run webapp:build:e2e`) - Creates instrumented files in `target/classes/static/`
3. ✅ **Package E2E JAR** (`npm run ci:e2e:package`) - Packages the coverage-instrumented files
4. ✅ **Run E2E tests** - Server uses JAR with coverage instrumentation

## Implementation Instructions

### Step 1: Update the CI/CD Pipeline Order

In `.github/workflows/main.yml`, modify the E2E section to follow this sequence:

```yaml
- name: Package application
  run: npm run java:jar:prod
- name: 'E2E: Build with Coverage'
  run: npm run webapp:build:e2e
- name: 'E2E: Package'
  run: npm run ci:e2e:package
- name: 'E2E: Prepare'
  run: npm run ci:e2e:prepare
- name: 'E2E: Run with Coverage'
  run: npm run ci:e2e:run
  env:
    CYPRESS_ENABLE_RECORD: false
    CYPRESS_PROJECT_ID: ${{ secrets.CYPRESS_PROJECT_ID }}
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### Step 2: Add Coverage Reporting Steps

Add these steps after the E2E run to generate and upload coverage reports:

```yaml
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

1. **`.nycrc.json`** - Coverage configuration with thresholds
2. **`webpack/webpack.e2e.js`** - Webpack config with Istanbul instrumentation
3. **`cypress.config.ts`** - Cypress config with coverage environment
4. **`src/test/javascript/cypress/plugins/index.ts`** - Coverage plugin registration
5. **`src/test/javascript/cypress/support/index.ts`** - Coverage support import

## Key Package.json Scripts Required

```json
{
  "scripts": {
    "webapp:build:e2e": "npm run clean-www && webpack --config webpack/webpack.e2e.js --env stats=minimal",
    "ci:e2e:package": "npm run java:$npm_package_config_packaging:$npm_package_config_default_environment -- -Pe2e -Denforcer.skip=true",
    "ci:e2e:run": "concurrently -k -s first -n application,e2e -c red,blue npm:ci:e2e:server:start npm:e2e:headless"
  }
}
```

## Why This Order Matters

- **Wrong Order**: Package JAR → Build Coverage → Run Tests = Coverage shows `0/0`
- **Right Order**: Build Coverage → Package JAR → Run Tests = Real coverage data

The E2E JAR must contain the coverage-instrumented files for the server to serve instrumented code during testing.

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

## Complete Example Pipeline

Here's the complete E2E section for your `.github/workflows/main.yml`:

```yaml
- name: Package application
  run: npm run java:jar:prod
- name: 'E2E: Build with Coverage'
  run: npm run webapp:build:e2e
- name: 'E2E: Package'
  run: npm run ci:e2e:package
- name: 'E2E: Prepare'
  run: npm run ci:e2e:prepare
- name: 'E2E: Run with Coverage'
  run: npm run ci:e2e:run
  env:
    CYPRESS_ENABLE_RECORD: false
    CYPRESS_PROJECT_ID: ${{ secrets.CYPRESS_PROJECT_ID }}
    CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
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

## Troubleshooting

### Coverage Shows 0/0

- **Cause**: Wrong execution order - JAR packaged before coverage build
- **Fix**: Ensure `webapp:build:e2e` runs before `ci:e2e:package`

### No Coverage Reports Generated

- **Cause**: Missing NYC configuration or dependencies
- **Fix**: Verify `.nycrc.json` exists and `@cypress/code-coverage` is installed

### Coverage Plugin Not Working

- **Cause**: Missing plugin registration in Cypress config
- **Fix**: Check `cypress/plugins/index.ts` has `require('@cypress/code-coverage/task')(on, config)`

### Instrumentation Not Applied

- **Cause**: Webpack E2E config missing Istanbul loader
- **Fix**: Verify `webpack/webpack.e2e.js` has `@jsdevtools/coverage-istanbul-loader`

---

This guide ensures comprehensive Cypress E2E coverage integration with proper execution order and complete CI/CD pipeline configuration.
