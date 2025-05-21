#!/usr/bin/env node
/**
 * Testing parallel jobs execution with different priorities
 * Creates jobs with varying priorities and verifies that higher priority jobs
 * are executed before lower priority ones
 */
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const API_URL = 'http://localhost:3000';
const TOTAL_NUMBER_JOBS_TO_BE_CREATE = 15; // Создаем больше задач для лучшего тестирования приоритетов
const CHECK_INTERVAL = 1000;

// Приоритеты для создания задач (1-5, где 5 - наивысший)
const PRIORITIES = [1, 2, 3, 4, 5];

/**
 * Create new job via API with specified priority
 * @param {number} index - Job index used for unique job name
 * @param {number} priority - Priority level (1-5)
 * @returns {Promise<Object>} - Created job
 */
async function createJob(index, priority) {
  try {
    const response = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jobName: `priority-test-${index}`,
        args: [`arg-${index}`, `${new Date().toISOString()}`],
        priority: priority
      })
    });

    const data = await response.json();
    console.log(`Created job ${index} with priority ${priority}: ${data.job.id}`);
    return data.job;
  } catch (error) {
    console.error(`Error creating job ${index}:`, error.message);
    throw error;
  }
}

/**
 * Update job priority via API
 * @param {string} jobId - ID of the job to update
 * @param {number} priority - New priority level (1-5)
 * @returns {Promise<Object>} - Updated job
 */
async function updateJobPriority(jobId, priority) {
  try {
    const response = await fetch(`${API_URL}/jobs/${jobId}/priority`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        priority: priority
      })
    });

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log(`Updated job ${jobId} priority to ${priority}`);
    return data.job;
  } catch (error) {
    console.error(`Error updating job ${jobId} priority:`, error.message);
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
 * Group jobs by priority
 * @param {Array} jobs - List of jobs
 * @returns {Object} - Jobs grouped by priority
 */
function groupJobsByPriority(jobs) {
  return jobs.reduce((acc, job) => {
    const priority = job.priority || 3; // Default to 3 if not specified
    if (!acc[priority]) {
      acc[priority] = [];
    }
    acc[priority].push(job);
    return acc;
  }, {});
}

/**
 * Calculate completion statistics by priority
 * @param {Array} jobs - List of jobs
 * @returns {Object} - Stats for each priority level
 */
function calculatePriorityStats(jobs) {
  const groupedJobs = groupJobsByPriority(jobs);
  const stats = {};

  for (const priority in groupedJobs) {
    const priorityJobs = groupedJobs[priority];
    const completed = priorityJobs.filter(job => job.status === 'completed').length;
    const running = priorityJobs.filter(job => job.status === 'running').length;
    const pending = priorityJobs.filter(job => job.status === 'pending').length;
    const failed = priorityJobs.filter(job => job.status === 'failed').length;

    stats[priority] = {
      total: priorityJobs.length,
      completed,
      running,
      pending,
      failed,
      completionRate: priorityJobs.length > 0 ? completed / priorityJobs.length : 0
    };
  }

  return stats;
}

/**
 * Main testing function
 */
async function runTest() {
  console.log(`Starting priority-based concurrent jobs test with ${TOTAL_NUMBER_JOBS_TO_BE_CREATE} jobs...`);

  // Creates jobs with varying priorities
  const jobPromises = [];
  for (let i = 0; i < TOTAL_NUMBER_JOBS_TO_BE_CREATE; i++) {
    // Assign a random priority from the PRIORITIES array
    const priority = PRIORITIES[i % PRIORITIES.length];
    jobPromises.push(createJob(i + 1, priority));
  }

  const createdJobs = await Promise.all(jobPromises);
  console.log(`Created ${createdJobs.length} jobs with varying priorities. Monitoring status...`);

  // Monitoring of those statuses up to completion
  let allCompleted = false;
  let checkCount = 0;
  const maxChecks = 30; // Prevent infinite loop

  while (!allCompleted && checkCount < maxChecks) {
    await setTimeout(CHECK_INTERVAL);
    checkCount++;

    const { jobs } = await getAllJobs();
    const stats = await getStats();
    const priorityStats = calculatePriorityStats(jobs);

    console.log('\n--- Current Job Statuses ---');
    console.log(`Running: ${stats.runningJobs}, Completed: ${stats.completedJobs}, Failed: ${stats.failedJobs}, Pending: ${stats.pendingJobs}`);

    console.log('\n--- Priority-based Statistics ---');
    for (const priority in priorityStats) {
      const pStats = priorityStats[priority];
      console.log(`Priority ${priority}: Total: ${pStats.total}, Completed: ${pStats.completed}, Running: ${pStats.running}, Pending: ${pStats.pending}`);
    }

    // Verify priority-based execution
    // Higher priority jobs should have higher completion rates
    if (checkCount > 5 && checkCount % 5 === 0) {
      console.log('\n--- Priority Execution Analysis ---');

      let validPriorityExecution = true;
      for (let i = 5; i > 1; i--) {
        const higherPriority = priorityStats[i];
        const lowerPriority = priorityStats[i-1];

        if (higherPriority && lowerPriority) {
          const higherCompletionRate = higherPriority.completionRate;
          const lowerCompletionRate = lowerPriority.completionRate;

          console.log(`Priority ${i} completion rate: ${(higherCompletionRate * 100).toFixed(2)}%`);
          console.log(`Priority ${i-1} completion rate: ${(lowerCompletionRate * 100).toFixed(2)}%`);

          if (higherCompletionRate < lowerCompletionRate &&
              higherPriority.total > 0 && lowerPriority.total > 0 &&
              higherPriority.completed + higherPriority.running < higherPriority.total &&
              lowerPriority.completed + lowerPriority.running < lowerPriority.total) {
            console.log(`⚠️ WARNING: Priority ${i} jobs are not completing faster than priority ${i-1} jobs!`);
            validPriorityExecution = false;
          }
        }
      }

      if (validPriorityExecution) {
        console.log('✅ Priority-based execution is working correctly!');
      }
    }

    console.log(`Max concurrent jobs limit: ${process.env.MAX_CONCURRENT_JOBS || 'Not set'}`);
    console.log(`Current running jobs: ${stats.runningJobs}`);

    allCompleted = jobs.every(job => job.status === 'completed' || job.status === 'failed');

    if (allCompleted) {
      console.log('\n--- All jobs completed! ---');
      console.log('Final stats:', stats);

      // Final priority analysis
      const finalPriorityStats = calculatePriorityStats(jobs);
      console.log('\n--- Final Priority Statistics ---');

      for (const priority in finalPriorityStats) {
        const pStats = finalPriorityStats[priority];
        console.log(`Priority ${priority}: Total: ${pStats.total}, Completed: ${pStats.completed}, Failed: ${pStats.failed}`);
      }

      // Test updating priority for a completed job (should work but not affect execution)
      if (jobs.length > 0) {
        const completedJob = jobs.find(job => job.status === 'completed');
        if (completedJob) {
          console.log('\n--- Testing priority update for completed job ---');
          const newPriority = completedJob.priority === 5 ? 1 : 5;
          await updateJobPriority(completedJob.id, newPriority);
          console.log(`Updated job ${completedJob.id} priority from ${completedJob.priority} to ${newPriority}`);
        }
      }
    }
  }

  if (!allCompleted) {
    console.log('\n--- Test timeout reached ---');
    console.log('Not all jobs completed within the time limit');
  }
}

runTest().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
