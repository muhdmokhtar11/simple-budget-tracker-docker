#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create coverage directory if it doesn't exist
const coverageDir = path.join(__dirname, '../coverage');
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

// Check if coverage data exists
const coverageDataPath = path.join(__dirname, '../target/classes/static/coverage.json');
if (fs.existsSync(coverageDataPath)) {
  try {
    const coverageData = JSON.parse(fs.readFileSync(coverageDataPath, 'utf8'));
    if (Object.keys(coverageData).length > 0) {
      console.log('Coverage data found and processed');
      // Copy to coverage directory for nyc
      fs.writeFileSync(path.join(coverageDir, 'coverage.json'), JSON.stringify(coverageData, null, 2));
    } else {
      console.log('No coverage data available');
    }
  } catch (error) {
    console.log('Error processing coverage data:', error.message);
  }
} else {
  console.log('No coverage data file found');
}
