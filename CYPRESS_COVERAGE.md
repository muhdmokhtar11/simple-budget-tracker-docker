# Cypress Code Coverage Setup

This project is now configured with **Cypress code coverage** to measure how much of your application code is being tested by your E2E tests.

## 📊 What is Code Coverage?

Code coverage shows you:

- **What percentage** of your code is being executed during tests
- **Which lines/functions** are covered by tests
- **Which areas** need more testing

## 🚀 How to Run Cypress with Code Coverage

### Method 1: Using the Script (Recommended)

```bash
npm run cypress:coverage
```

This will:

1. ✅ Check if your backend is running
2. 🔧 Start webpack with code instrumentation
3. 🧪 Run all Cypress tests
4. 📈 Generate coverage reports
5. 🌐 Open the HTML coverage report

### Method 2: Manual Steps

```bash
# 1. Start your backend
./mvnw spring-boot:run

# 2. In another terminal, start webpack with coverage
NODE_ENV=test npm run cypress:coverage:serve

# 3. In another terminal, run Cypress tests
NODE_ENV=test cypress run --e2e --browser chrome --config baseUrl=http://localhost:9000

# 4. Generate coverage report
npm run coverage:report
```

## 📋 Viewing Coverage Reports

After running tests, coverage reports are available in multiple formats:

### HTML Report (Visual)

```bash
open target/cypress/coverage/index.html
```

- Interactive HTML report with line-by-line coverage
- Shows covered/uncovered code in green/red
- Includes branch and function coverage

### Terminal Report

```bash
npm run coverage:report
```

Shows a text summary with coverage percentages.

### JSON/LCOV Reports

- `target/cypress/coverage/coverage-final.json` - Machine-readable coverage data
- `target/cypress/coverage/lcov.info` - LCOV format for CI/CD integration

## 📊 Understanding Coverage Metrics

- **Statements**: Percentage of code statements executed
- **Branches**: Percentage of conditional branches taken
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

**Good coverage targets:**

- 🥇 **80%+**: Excellent coverage
- 🥈 **60-80%**: Good coverage
- 🥉 **40-60%**: Fair coverage
- ❌ **<40%**: Needs improvement

## 🎯 What's Covered

The coverage includes all TypeScript/JavaScript files in:

```
src/main/webapp/app/**/*.{ts,tsx}
```

**Excluded from coverage:**

- Test files (`*.spec.ts`, `*.test.ts`)
- Configuration files
- Node modules
- Setup files

## 🐛 Troubleshooting

### Backend Not Running

```
❌ Backend is not running. Please start with: ./mvnw spring-boot:run
```

**Solution**: Start your Spring Boot backend first.

### Port Already in Use

If webpack fails to start, another process might be using port 9000.

```bash
# Check what's using port 9000
lsof -i :9000

# Kill the process if needed
kill -9 <PID>
```

### No Coverage Data

```
⚠️ file has no coverage information
```

**Solution**: Ensure NODE_ENV=test is set and webpack is using the coverage configuration.

## 🔧 Configuration Files

- `babel.config.js` - Babel configuration with Istanbul plugin
- `webpack/webpack.coverage.js` - Webpack configuration for coverage
- `.nycrc.json` - NYC (Istanbul) coverage configuration
- `cypress.config.ts` - Cypress configuration with coverage support

## 🚦 CI/CD Integration

To integrate coverage in your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Cypress with Coverage
  run: npm run cypress:coverage

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v1
  with:
    file: target/cypress/coverage/lcov.info
```

## 📝 Next Steps

1. **Run coverage**: `npm run cypress:coverage`
2. **Review the HTML report** to see what's covered
3. **Identify uncovered areas** that need more tests
4. **Write additional Cypress tests** for uncovered features
5. **Set coverage targets** in your CI/CD pipeline

---

**Happy Testing!** 🎉
