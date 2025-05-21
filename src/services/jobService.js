import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import os from 'os';
import cmd from 'node-cmd';
import { config } from '../config/index.js';
import { logger } from '../utils/logger/index.js';
import { Job, JobStatus } from '../models/job.js';

/**
 * Depend on OS defines which script to use.
 * @returns {string} Path to script.
 */
const getJobScriptPath = () => {
  const isWindows = os.platform() === 'win32';
  const scriptName = isWindows ? 'dummy-job.bat' : 'dummy-job.sh';
  const scriptPath = path.join(process.cwd(), 'scripts', scriptName);
  return `"${scriptPath}"`;
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
   * @param {number} priority - Priority of job (by default = 3)
   * @returns {Job} - Created job instance
   */
  createJob(jobName, jobArgs = [], priority = 3) {
    try {
      const job = new Job(jobName, jobArgs, { logger, priority });
      this.#jobs.set(job.id, job);
      logger.info(`Created job ${job.id} with name ${jobName}, priority ${priority}`);

      // Run the job if there are free slots available
      this.#processQueue();

      return job;
    } catch (error) {
      logger.error(`Error creating job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all jobs
   * @returns {Job[]} - Array of jobs
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
   * @returns {Job|null} - Job instance or null if not found
   */
  getJobById(jobId) {
    return this.#jobs.get(jobId) || null;
  }
  
  /**
   * Get job statistics
   * @returns {object} - Job statistics
   */
  getJobStats() {
    const allJobs = this.getAllJobs();
    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter(job => job.status === JobStatus.COMPLETED).length;
    const failedJobs = allJobs.filter(job => job.status === JobStatus.FAILED).length;
    const pendingJobs = allJobs.filter(job => job.status === JobStatus.PENDING).length;
    const runningJobs = allJobs.filter(job => job.status === JobStatus.RUNNING).length;
    const retriedJobs = allJobs.filter(job => job.retryCount > 0).length;
    
    // Calculate average completion time for completed jobs
    const completedJobsWithTime = allJobs.filter(job => 
      job.status === JobStatus.COMPLETED && job.startedAt && job.completedAt
    );
    
    let averageCompletionTime = 0;
    
    if (completedJobsWithTime.length > 0) {
      const totalCompletionTime = completedJobsWithTime.reduce((total, job) => {
        const startTime = new Date(job.startedAt).getTime();
        const endTime = new Date(job.completedAt).getTime();
        return total + (endTime - startTime);
      }, 0);
      
      averageCompletionTime = totalCompletionTime / completedJobsWithTime.length;
    }
    
    // Get most common job name
    const jobNameCounts = allJobs.reduce((counts, job) => {
      counts[job.jobName] = (counts[job.jobName] || 0) + 1;
      return counts;
    }, {});
    
    let mostCommonJobName = null;
    let maxCount = 0;
    
    for (const [name, count] of Object.entries(jobNameCounts)) {
      if (count > maxCount) {
        mostCommonJobName = name;
        maxCount = count;
      }
    }
    
    return {
      totalJobs,
      completedJobs,
      failedJobs,
      pendingJobs,
      runningJobs,
      retriedJobs,
      averageCompletionTime,
      mostCommonJobName,
      mostCommonJobCount: maxCount
    };
  }
  
  /**
   * Process the job queue
   * @private
   */
  #processQueue() {
    if (this.#runningJobs.size >= this.#maxConcurrentJobs) {
      logger.debug(`Max concurrent jobs limit reached (${this.#maxConcurrentJobs}). Waiting for jobs to complete.`);
      return;
    }
    
    // Get all pending jobs and sort them by priority (higher priority first)
    const pendingJobs = this.getAllJobs()
      .filter(job => job.status === JobStatus.PENDING)
      .sort((a, b) => b.priority - a.priority);
    
    if (pendingJobs.length === 0) {
      logger.debug('No pending jobs to process');
      return;
    }
    
    // Calculate how many jobs we can start
    const availableSlots = this.#maxConcurrentJobs - this.#runningJobs.size;
    const jobsToStart = Math.min(availableSlots, pendingJobs.length);
    
    logger.debug(`Starting ${jobsToStart} jobs (${availableSlots} slots available, ${pendingJobs.length} pending jobs)`);
    
    // Start the jobs
    for (let i = 0; i < jobsToStart; i++) {
      const job = pendingJobs[i];
      this.#startJob(job);
    }
  }
  
  /**
   * Start a job
   * @param {Job} job - Job to start
   * @private
   */
  #startJob(job) {
    logger.info(`Starting job ${job.id} (${job.jobName})`);
    
    job.updateStatus(JobStatus.RUNNING);
    this.#runningJobs.add(job.id);
    
    const command = `${this.#jobScript} ${job.jobName} ${job.jobArgs.join(' ')}`;
    logger.debug(`Executing command: ${command}`);
    
    try {
      const process = cmd.run(command, (err, data, stderr) => {
        this.#runningJobs.delete(job.id);
        
        if (err) {
          logger.error(`Job ${job.id} failed with error: ${err.message}`);
          
          // Check if we should retry
          if (job.retryCount < this.#jobRetryAttempts) {
            logger.info(`Retrying job ${job.id} (attempt ${job.retryCount + 1}/${this.#jobRetryAttempts})`);
            job.incrementRetry();
            job.updateStatus(JobStatus.PENDING);
            this.#processQueue();
          } else {
            logger.info(`Job ${job.id} failed after ${job.retryCount} retry attempts`);
            job.setExitCode(1);
            job.updateStatus(JobStatus.FAILED);
          }
          
          return;
        }
        
        if (stderr) {
          logger.warn(`Job ${job.id} produced stderr output: ${stderr}`);
        }
        
        logger.info(`Job ${job.id} completed successfully`);
        job.setExitCode(0);
        job.updateStatus(JobStatus.COMPLETED);
        
        // Process the queue again to start any pending jobs
        this.#processQueue();
      });
      
      job.setProcess(process);
    } catch (error) {
      logger.error(`Error starting job ${job.id}: ${error.message}`);
      this.#runningJobs.delete(job.id);
      job.setExitCode(1);
      job.updateStatus(JobStatus.FAILED);
    }
  }
  
  /**
   * For testing purposes only
   */
  clearAllJobs() {
    this.#jobs.clear();
    this.#runningJobs.clear();
    logger.debug('Cleared all jobs (testing only)');
  }

  /**
   * Update the priority of the job with the given ID
   * @param {string} jobId - ID of the job to update
   * @param {number} [priority=3] - New priority of the job (1-5)
   * @throws {Error} - If the priority is invalid
   * @returns {Job} - Updated job instance
   */
  updateJobPriority(jobId, priority = 3) {
    const job = this.#jobs.get(jobId);

    if (!job) {
      return null;
    }

    try {
      job.updatePriority(priority);
      logger.info(`Updated job ${jobId} priority to ${priority}`);

      if (job.status === JobStatus.PENDING) {
        this.#processQueue();
      }

      return job;
    } catch (error) {
      logger.error(`Error updating job ${jobId} priority: ${error.message}`);
      throw error;
    }
  }
}

export const jobService = new JobService();
