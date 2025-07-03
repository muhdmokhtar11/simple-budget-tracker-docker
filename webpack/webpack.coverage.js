// Coverage webpack configuration that extends the dev configuration
// with code instrumentation for coverage reporting

const path = require('path');

// Set NODE_ENV to test to ensure babel applies Istanbul instrumentation
process.env.NODE_ENV = 'test';

// Simply export the dev configuration since we've modified webpack.dev.js
// to handle coverage instrumentation when NODE_ENV=test
module.exports = require('./webpack.dev.js');
