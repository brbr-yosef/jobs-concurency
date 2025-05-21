import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import cmd from 'node-cmd';
import { config } from '../config/index.js';
import { logger } from '../utils/logger/index.js';

/**
 * Depend on OS defines which script to use.
 * @returns {string} Path to script.
 */
const getJobScriptPath = () => {
  const isWindows = os.platform() === 'win32';
  const scriptName = isWindows ? 'dummy-job.bat' : 'dummy-job.sh';
  return path.join(process.cwd(), 'scripts', scriptName);
};

/**
 * Service: jobs management
 */
class JobService {
  #jobs = new Map();
  #runningJobs = new Set();
  #maxConcurrentJobs;
  #jobRetryAttempts;
  #jobScript;

  constructor() {
    this.#maxConcurrentJobs = config.MAX_CONCURRENT_JOBS || 5;
    this.#jobRetryAttempts = config.JOB_RETRY_ATTEMPTS || 3;
    this.#jobScript = getJobScriptPath();
    logger.info(`Job script path: ${this.#jobScript}`);
    logger.info(`Max concurrent jobs: ${this.#maxConcurrentJobs}`);
    logger.info(`Job retry attempts: ${this.#jobRetryAttempts}`);
  }

  /**
   * Creates new job
   * @param {string} jobName - Name of job
   * @param {string[]} jobArgs - Job's args
   * @returns {object} - Object - created job
   */
  createJob(jobName, jobArgs = []) {
    const jobId = uuidv4();
    const job = {
      id: jobId,
      jobName,
      args: jobArgs,
      status: 'pending',
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      exitCode: null,
      retryCount: 0
    };

    this.#jobs.set(jobId, job);
    logger.info(`Created job ${jobId} with name ${jobName}`);

    // Run the job if there are free slots available
    this.#processQueue();

    return job;
  }

  /**
   * Get all jobs
   * @returns {object[]} - Array of jobs
   */
  getAllJobs() {
    return Array.from(this.#jobs.values());
  }
  
  /**
   * Get filtered and paginated jobs
   * @param {object} options - Filter and pagination options
   * @param {string} [options.status] - Filter by status
   * @param {number} [options.limit=50] - Maximum number of jobs to return
   * @param {number} [options.offset=0] - Number of jobs to skip
   * @returns {object} - Object with total count and filtered/paginated jobs
   */
  getFilteredJobs({ status, limit = 50, offset = 0 } = {}) {
    let jobs = this.getAllJobs();
    
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }
    
    const total = jobs.length;
    
    jobs = jobs.slice(offset, offset + parseInt(limit));
    
    return {
      total,
      jobs
    };
  }

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   * @returns {object|null} - Job object or null if not found
   */
  getJobById(jobId) {
    return this.#jobs.get(jobId) || null;
  }

  /**
   * Get Jobs stats
   * @returns {object} - Stats
   */
  getJobStats() {
    const jobs = this.getAllJobs();

    // Basic stats
    const totalJobs = jobs.length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;
    const failedJobs = jobs.filter(job => job.status === 'failed').length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;
    const runningJobs = jobs.filter(job => job.status === 'running').length;

    // Calculate average completion time
    const completedJobsList = jobs.filter(job => job.status === 'completed' && job.startedAt && job.completedAt);
    let averageCompletionTime = 0;

    if (completedJobsList.length > 0) {
      const totalTime = completedJobsList.reduce((acc, job) => {
        const startTime = new Date(job.startedAt).getTime();
        const endTime = new Date(job.completedAt).getTime();
        return acc + (endTime - startTime);
      }, 0);

      averageCompletionTime = totalTime / completedJobsList.length;
    }

    // Calculate percentages of successful jobs
    const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

    // Analyze patterns
    const patterns = [];

    // # 1: Length of job name > 10 chars
    const longNameJobs = jobs.filter(job => job.jobName.length > 10);
    if (longNameJobs.length > 0) {
      const longNameSuccessRate = longNameJobs.filter(job => job.status === 'completed').length / longNameJobs.length;
      patterns.push({
        pattern: 'Job name length > 10',
        matchCount: longNameJobs.length,
        successRate: longNameSuccessRate,
        differenceFromAverage: `${((longNameSuccessRate * 100) - successRate).toFixed(2)}%`
      });
    }

    // # 2: Jobs with vs. without args
    const jobsWithArgs = jobs.filter(job => job.args && job.args.length > 0);
    if (jobsWithArgs.length > 0) {
      const withArgsSuccessRate = jobsWithArgs.filter(job => job.status === 'completed').length / jobsWithArgs.length;
      patterns.push({
        pattern: 'Jobs with arguments',
        matchCount: jobsWithArgs.length,
        successRate: withArgsSuccessRate,
        differenceFromAverage: `${((withArgsSuccessRate * 100) - successRate).toFixed(2)}%`
      });
    }

    // #3: Restarted jobs
    const retriedJobs = jobs.filter(job => job.retryCount > 0);
    if (retriedJobs.length > 0) {
      const retriedSuccessRate = retriedJobs.filter(job => job.status === 'completed').length / retriedJobs.length;
      patterns.push({
        pattern: 'Jobs that were retried',
        matchCount: retriedJobs.length,
        successRate: retriedSuccessRate,
        differenceFromAverage: `${((retriedSuccessRate * 100) - successRate).toFixed(2)}%`
      });
    }

    return {
      totalJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
      runningJobs,
      retriedJobs: retriedJobs.length,
      averageCompletionTime,
      successRate,
      patterns
    };
  }

  /**
   * Processing of jobs queue
   * @private
   */
  #processQueue() {
    if (this.#runningJobs.size >= this.#maxConcurrentJobs) {
      logger.debug(`Max concurrent jobs limit reached (${this.#runningJobs.size}/${this.#maxConcurrentJobs})`);
      return;
    }

    const pendingJobs = Array.from(this.#jobs.values())
      .filter(job => job.status === 'pending');

    if (pendingJobs.length === 0) {
      logger.debug('No pending jobs to process');
      return;
    }

    for (const job of pendingJobs) {
      if (this.#runningJobs.size >= this.#maxConcurrentJobs) {
        break;
      }

      this.#startJob(job.id);
    }
  }

  /**
   * Start job
   * @param {string} jobId - Job ID
   * @private
   */
  #startJob(jobId) {
    const job = this.#jobs.get(jobId);

    if (!job || job.status !== 'pending') {
      return;
    }

    // Refresh job status and start time
    job.status = 'running';
    job.startedAt = new Date().toISOString();
    this.#runningJobs.add(jobId);

    logger.info(`Starting job ${jobId} (${job.jobName})`);

    // Prepare execution command
    const allArgs = [job.jobName, ...job.args];
    const command = `"${this.#jobScript}" ${allArgs.join(' ')}`;

    logger.debug(`Executing command: ${command}`);

    // Run the process
    cmd.run(command, (err, data, stderr) => {
      this.#runningJobs.delete(jobId);

      job.completedAt = new Date().toISOString();

      if (err) {
        logger.error(`Job ${jobId} failed: ${err.message}`);
        job.exitCode = err.code || 1;

        // Restart the task if it failed and if the number of attempts is not exceeded
        if (job.retryCount < this.#jobRetryAttempts) {
          job.retryCount++;
          job.status = 'retried';
          logger.info(`Retrying job ${jobId} (attempt ${job.retryCount}/${this.#jobRetryAttempts})`);

          job.startedAt = null;
          job.completedAt = null;

          setTimeout(() => {
            job.status = 'pending';
            this.#processQueue();
          }, 1000);
        } else {
          job.status = 'failed';
          logger.warn(`Job ${jobId} failed after ${job.retryCount} retry attempts`);
        }
      } else {
        logger.info(`Job ${jobId} completed successfully`);
        job.status = 'completed';
        job.exitCode = 0;
      }

      this.#processQueue();
    });
  }
}

export const jobService = new JobService();
