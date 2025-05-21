/**
 * App configuration
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const NODE_ENV = process.env.NODE_ENV || 'development';

const loadEnvFile = () => {
  let envFile = '.env';
  
  if (NODE_ENV === 'development') {
    envFile = '.env.dev';
  } else if (NODE_ENV === 'production') {
    envFile = '.env.prod';
  }
  
  const envPath = path.resolve(process.cwd(), envFile);

  let config = { parsed: {} };
  if (fs.existsSync(envPath)) {
    console.log(`Loading environment from ${envFile}`);
    config = dotenv.config({ path: envPath });
  } else if (fs.existsSync(path.resolve(process.cwd(), '.env'))){
    console.log('Loading environment from .env');
    config = dotenv.config();
  } else if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))){
    console.warn('Using example environment file. This should not be used in production!');
    config = dotenv.config({ path: '.env.example' });
  } else {
    console.warn('No environment file found. Using default values.');
  }
  
  return config;
};

loadEnvFile();

const config = {
  PORT: process.env.PORT || 3000,
  NODE_ENV,

  MAX_CONCURRENT_JOBS: parseInt(process.env.MAX_CONCURRENT_JOBS || '5', 10),
  JOB_RETRY_ATTEMPTS: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3', 10),
  JOB_TIMEOUT_MS: parseInt(process.env.JOB_TIMEOUT_MS || '30000', 10),
  EXECUTABLE_PATH: process.env.EXECUTABLE_PATH || './scripts/dummy-job.sh',
};

export { config };
