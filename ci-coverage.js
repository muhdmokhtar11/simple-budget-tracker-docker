#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Starting E2E tests with coverage...');

// Set environment variables for CI
process.env.NODE_ENV = 'test';
process.env.TERM = 'xterm';
process.env.CI = 'true';

// Create coverage directory if it doesn't exist
const coverageDir = path.join(__dirname, 'target', 'cypress', 'coverage');
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

try {
  // Run E2E tests with coverage
  console.log('📦 Building application with coverage instrumentation...');
  execSync('npm run webapp:build:e2e', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  console.log('🧪 Running E2E tests...');
  execSync('npm run e2e:cypress', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  console.log('✅ E2E tests with coverage completed successfully!');

  // Check if coverage was generated
  if (fs.existsSync(path.join(coverageDir, 'coverage-final.json'))) {
    console.log('📊 Coverage report generated successfully!');
    console.log(`📁 Coverage reports available at: ${coverageDir}`);
  } else {
    console.log('⚠️  Coverage report not found, but tests passed');
  }
} catch (error) {
  console.error('❌ E2E tests failed:', error.message);

  // Try to provide helpful debugging information
  if (error.status === 8) {
    console.error('💡 Exit code 8 typically means some tests failed. Check the test output above.');
  }

  if (error.message.includes('tput')) {
    console.error('💡 Terminal capability warnings can usually be ignored.');
  }

  // Exit with the same code as the failed process
  process.exit(error.status || 1);
}
