#!/bin/bash

echo "🚀 Starting Cypress Code Coverage Setup..."

# Set NODE_ENV for coverage
export NODE_ENV=test

# Clean up any existing coverage data
rm -rf target/cypress/coverage target/cypress/.nyc_output

# Create coverage directories
mkdir -p target/cypress/coverage target/cypress/.nyc_output

echo "📊 Starting application with code coverage instrumentation..."
# Start the backend (make sure it's running)
if ! curl -s http://localhost:8080/management/health > /dev/null; then
    echo "❌ Backend is not running. Please start with: ./mvnw spring-boot:run"
    exit 1
fi

# Start webpack dev server with coverage configuration
echo "🔧 Starting webpack dev server with coverage..."
NODE_ENV=test npm run cypress:coverage:serve &
WEBPACK_PID=$!

# Wait for webpack dev server to start
echo "⏳ Waiting for webpack dev server to start..."
sleep 15

# Check if webpack dev server is running
if ! curl -s http://localhost:9000 > /dev/null; then
    echo "❌ Webpack dev server failed to start"
    kill $WEBPACK_PID 2>/dev/null
    exit 1
fi

echo "✅ Running Cypress tests with coverage..."
# Run Cypress tests with mochawesome reporter for test metrics
cypress run --e2e --browser chrome --config baseUrl=http://localhost:9000 --reporter mochawesome

CYPRESS_EXIT_CODE=$?

echo ""
echo "📈 Generating coverage reports..."
# Generate coverage reports
npm run coverage:report

echo ""
echo "📊 TEST CASE SUMMARY:"
echo "===================="

# Count test files
TEST_FILES=$(find src/test/javascript/cypress/e2e -name "*.cy.ts" | wc -l | tr -d ' ')
echo "📁 Test Files: $TEST_FILES"

# Parse mochawesome report if it exists
if [ -f "mochawesome-report/mochawesome.json" ]; then
    # Extract test metrics from mochawesome JSON
    TOTAL_TESTS=$(node -e "
        try {
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
            console.log(report.stats.tests || 0);
        } catch (e) {
            console.log('0');
        }
    ")
    
    PASSING_TESTS=$(node -e "
        try {
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
            console.log(report.stats.passes || 0);
        } catch (e) {
            console.log('0');
        }
    ")
    
    FAILING_TESTS=$(node -e "
        try {
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
            console.log(report.stats.failures || 0);
        } catch (e) {
            console.log('0');
        }
    ")
    
    PENDING_TESTS=$(node -e "
        try {
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('mochawesome-report/mochawesome.json', 'utf8'));
            console.log(report.stats.pending || 0);
        } catch (e) {
            console.log('0');
        }
    ")
    
    echo "🧪 Total Tests: $TOTAL_TESTS"
    echo "✅ Passing: $PASSING_TESTS"
    echo "❌ Failing: $FAILING_TESTS"
    echo "⏸️  Pending: $PENDING_TESTS"
    
    if [ $TOTAL_TESTS -gt 0 ]; then
        PASS_PERCENTAGE=$(node -e "console.log(Math.round(($PASSING_TESTS / $TOTAL_TESTS) * 100))")
        echo "📊 Pass Rate: $PASS_PERCENTAGE%"
    fi
else
    echo "⚠️  Test report not found. Using file count estimation:"
    # Estimate based on file patterns
    ESTIMATED_TESTS=$(grep -r "it(" src/test/javascript/cypress/e2e/ | wc -l | tr -d ' ')
    echo "🧪 Estimated Tests: ~$ESTIMATED_TESTS"
fi

echo ""
echo "🎉 Analysis Complete!"
echo "📋 Test Report: mochawesome-report/mochawesome.html"
echo "📈 Coverage Report: target/cypress/coverage/index.html"

# Clean up
kill $WEBPACK_PID 2>/dev/null

# Open both reports
if command -v open &> /dev/null; then
    echo "🌐 Opening reports..."
    open target/cypress/coverage/index.html
    open mochawesome-report/mochawesome.html
fi

exit $CYPRESS_EXIT_CODE 