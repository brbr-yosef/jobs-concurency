/**
 * App configuration
 */
const dotenv = require('dotenv');

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  MAX_CONCURRENT_JOBS: process.env.MAX_CONCURRENT_JOBS || 5,
  JOB_RETRY_ATTEMPTS: process.env.JOB_RETRY_ATTEMPTS || 3,
  JOB_TIMEOUT_MS: process.env.JOB_TIMEOUT_MS || 30000,
  EXECUTABLE_PATH: process.env.EXECUTABLE_PATH || './scripts/dummy-app.js',
};

module.exports = { config };
