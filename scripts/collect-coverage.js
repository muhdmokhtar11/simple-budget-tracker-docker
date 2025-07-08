#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Create coverage directory if it doesn't exist
const coverageDir = path.join(__dirname, '../coverage');
if (!fs.existsSync(coverageDir)) {
  fs.mkdirSync(coverageDir, { recursive: true });
}

// Create .nyc_output directory if it doesn't exist
const nycOutputDir = path.join(__dirname, '../.nyc_output');
if (!fs.existsSync(nycOutputDir)) {
  fs.mkdirSync(nycOutputDir, { recursive: true });
}

// Check if coverage data exists
const coverageDataPath = path.join(__dirname, '../target/classes/static/coverage.json');
const cypressCoveragePath = path.join(__dirname, '../target/cypress/coverage');

if (fs.existsSync(coverageDataPath)) {
  try {
    const coverageData = JSON.parse(fs.readFileSync(coverageDataPath, 'utf8'));
    if (Object.keys(coverageData).length > 0) {
      console.log('Coverage data found and processed');
      // Copy to coverage directory for nyc
      fs.writeFileSync(path.join(coverageDir, 'coverage.json'), JSON.stringify(coverageData, null, 2));
      // Also create a basic .nyc_output file for nyc to work with
      fs.writeFileSync(path.join(nycOutputDir, 'out.json'), JSON.stringify(coverageData, null, 2));
    } else {
      console.log('No coverage data available');
      // Create empty coverage files to prevent nyc errors
      fs.writeFileSync(path.join(coverageDir, 'coverage.json'), '{}');
      fs.writeFileSync(path.join(nycOutputDir, 'out.json'), '{}');
    }
  } catch (error) {
    console.log('Error processing coverage data:', error.message);
    // Create empty coverage files to prevent nyc errors
    fs.writeFileSync(path.join(coverageDir, 'coverage.json'), '{}');
    fs.writeFileSync(path.join(nycOutputDir, 'out.json'), '{}');
  }
} else if (fs.existsSync(cypressCoveragePath)) {
  console.log('Cypress coverage data found');
  // Copy Cypress coverage files to our coverage directory
  try {
    const cypressCoverageFiles = fs.readdirSync(cypressCoveragePath);
    cypressCoverageFiles.forEach(file => {
      const sourcePath = path.join(cypressCoveragePath, file);
      const destPath = path.join(coverageDir, file);
      if (fs.statSync(sourcePath).isFile()) {
        fs.copyFileSync(sourcePath, destPath);
      }
    });
    console.log('Cypress coverage files copied successfully');
  } catch (error) {
    console.log('Error copying Cypress coverage files:', error.message);
  }
} else {
  console.log('No coverage data file found');
  // Create empty coverage files to prevent nyc errors
  fs.writeFileSync(path.join(coverageDir, 'coverage.json'), '{}');
  fs.writeFileSync(path.join(nycOutputDir, 'out.json'), '{}');
}
