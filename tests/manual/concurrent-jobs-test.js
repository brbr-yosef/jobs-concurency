#!/usr/bin/env node
/**
 * Testing parallel jobs execution and restrictions
 * Runs multiple tasks simultaneously and tracks their statuses
 */
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const API_URL = 'http://localhost:3000';
const TOTAL_NUMBER_JOBS_TO_BE_CREATE = 10;
const CHECK_INTERVAL = 1000;

/**
 * Create new job via API
 * @param {number} index - Job index used for unique job name
 * @returns {Promise<Object>} - Created job
 */
async function createJob(index) {
  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobName: `concurrent-test-${index}`,
        args: [`arg-${index}`, `${new Date().toISOString()}`]
      })
    });

    const data = await response.json();
    console.log(`Created job ${index}: ${data.job.id}`);
    return data.job;
  } catch (error) {
    console.error(`Error creating job ${index}:`, error.message);
    throw error;
  }
}

/**
 * Get all jobs via API
 * @returns {Promise<Object>} - Array of jobs and total count
 */
async function getAllJobs() {
  try {
    const response = await fetch(`${API_URL}/jobs`);
    return await response.json();
  } catch (error) {
    console.error('Error getting jobs:', error.message);
    throw error;
  }
}

/**
 * Get job statistics via API
 * @returns {Promise<Object>} - job statistics
 */
async function getStats() {
  try {
    const response = await fetch(`${API_URL}/stats`);
    return await response.json();
  } catch (error) {
    console.error('Error getting stats:', error.message);
    throw error;
  }
}

/**
 * Main testing function
 */
async function runTest() {
  console.log(`Starting concurrent jobs test with ${TOTAL_NUMBER_JOBS_TO_BE_CREATE} jobs...`);

  // Creates jobs in parallel
  const jobPromises = Array.from({ length: TOTAL_NUMBER_JOBS_TO_BE_CREATE }, (_, i) => createJob(i + 1));
  const createdJobs = await Promise.all(jobPromises);

  console.log(`Created ${createdJobs.length} jobs. Monitoring status...`);

  // Monitoring of those statuses up to completion
  let allCompleted = false;
  while (!allCompleted) {
    await setTimeout(CHECK_INTERVAL);

    const { jobs } = await getAllJobs();
    const stats = await getStats();

    console.log('\n--- Current Job Statuses ---');
    console.log(`Running: ${stats.runningJobs}, Completed: ${stats.completedJobs}, Failed: ${stats.failedJobs}, Pending: ${stats.pendingJobs}`);

    console.log(`Max concurrent jobs limit: ${process.env.MAX_CONCURRENT_JOBS || 'Not set'}`);
    console.log(`Current running jobs: ${stats.runningJobs}`);

    allCompleted = jobs.every(job => job.status === 'completed' || job.status === 'failed');

    if (allCompleted) {
      console.log('\n--- All jobs completed! ---');
      console.log('Final stats:', stats);
    }
  }
}

runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
