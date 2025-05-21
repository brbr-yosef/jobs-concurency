import { v4 as uuidv4 } from 'uuid';

/**
 * @typedef {Object} JobStatus
 * @property {string} PENDING - Job is waiting to be started
 * @property {string} RUNNING - Job is currently running
 * @property {string} COMPLETED - Job completed successfully
 * @property {string} FAILED - Job failed
 * @property {string} RETRIED - Job failed and was retried
 */
const JobStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRIED: 'retried',
  PAUSED: 'paused',
  STOPPING: 'stopping'
};

/**
 * @class Job
 * @description Represents a processing job
 */
class Job {
  #id;
  #jobName;
  #jobArgs;
  #status;
  #createdAt;
  #startedAt;
  #completedAt;
  #exitCode;
  #retryCount;
  #process;
  #logger;
  #priority;

  /**
   * Creates a new Job instance
   * @param {string} jobName - Name of the job
   * @param {string[]} [jobArgs=[]] - Arguments to pass to the job
   * @param {Object} [options={}] - Additional options
   * @param {Object} [options.logger=console] - Logger instance
   * @throws {Error} - If jobName is not a string or jobArgs is not an array
   */
  constructor(jobName, jobArgs = [], { logger = console, priority = 3 } = {}) {
    if (typeof jobName !== 'string' || !jobName.trim()) {
      throw new Error('Job name must be a non-empty string');
    }

    if (!Array.isArray(jobArgs)) {
      throw new Error('Job arguments must be an array');
    }

    this.#id = uuidv4();
    this.#jobName = jobName;
    this.#jobArgs = jobArgs;
    this.#status = JobStatus.PENDING;
    this.#createdAt = new Date().toISOString();
    this.#startedAt = null;
    this.#completedAt = null;
    this.#exitCode = null;
    this.#retryCount = 0;
    this.#process = null;
    this.#logger = logger;

    if (typeof priority !=='number' || priority < 1 || priority > 5) {
      const errorMsg = `Invalid priority: ${priority}. Must be a number between 1 and 5`;
      this.#logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    this.#priority = priority;

    this.#logger.debug(`Job created: ${this.#id} (${this.#jobName}), jobs priority: ${this.#priority}`);
  }

  get id() { return this.#id; }
  get jobName() { return this.#jobName; }
  get jobArgs() { return this.#jobArgs; }
  get status() { return this.#status; }
  get createdAt() { return this.#createdAt; }
  get startedAt() { return this.#startedAt; }
  get completedAt() { return this.#completedAt; }
  get exitCode() { return this.#exitCode; }
  get retryCount() { return this.#retryCount; }
  get priority() { return this.#priority; }

  /**
   * Updates the job status
   * @param {string} status - New status
   * @returns {Job} - Updated job instance
   * @throws {Error} - If status is invalid
   */
  updateStatus(status) {
    const validStatuses = Object.values(JobStatus);
    if (!validStatuses.includes(status)) {
      const errorMsg = `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`;
      this.#logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    const oldStatus = this.#status;
    this.#status = status;
    
    if (status === JobStatus.RUNNING && !this.#startedAt) {
      this.#startedAt = new Date().toISOString();
    }
    
    if ((status === JobStatus.COMPLETED || status === JobStatus.FAILED) && !this.#completedAt) {
      this.#completedAt = new Date().toISOString();
    }

    this.#logger.debug(`Job ${this.#id} status changed: ${oldStatus} -> ${status}`);

    return this;
  }

  /**
   * Updates the job status
   * @param {number} priority - New priority
   * @returns {Job} - Updated job instance
   * @throws {Error} - If status is invalid
   */
  updatePriority(priority) {
    if (typeof priority !== 'number' || priority < 1 || priority > 5) {
      const errorMsg = `Invalid new priority: ${priority}. Must be a number between 1 and 5`;
      this.#logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    this.#logger.debug(`Job ${this.#id} priority changed: ${this.#priority} -> ${priority}`);

    this.#priority = priority;

    return this;
  }

    /**
   * Increments the retry count
   * @returns {Job} - Updated job instance
   */
  incrementRetry() {
    this.#retryCount++;
    this.#logger.debug(`Job ${this.#id} retry count incremented to ${this.#retryCount}`);
    return this;
  }

  /**
   * Sets the exit code of the job
   * @param {number} code - Exit code
   * @returns {Job} - Updated job instance
   * @throws {Error} - If code is not a number
   */
  setExitCode(code) {
    if (typeof code !== 'number') {
      const errorMsg = `Exit code must be a number, got ${typeof code}`;
      this.#logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.#exitCode = code;
    this.#logger.debug(`Job ${this.#id} exit code set to ${code}`);
    return this;
  }

  /**
   * Sets the process reference
   * @param {import('child_process').ChildProcess} process - Process reference
   * @returns {Job} - Updated job instance
   * @throws {Error} - If process is not valid
   */
  setProcess(process) {
    if (!process || typeof process !== 'object' || !process.pid) {
      const errorMsg = 'Invalid process object';
      this.#logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    this.#process = process;
    this.#logger.debug(`Job ${this.#id} process set with PID ${process.pid}`);

    return this;
  }

  /**
   * Converts the job to a plain object for API responses
   * @returns {Object} - Plain object representation
   */
  toJSON() {
    return {
      id: this.#id,
      jobName: this.#jobName,
      jobArgs: this.#jobArgs,
      status: this.#status,
      createdAt: this.#createdAt,
      startedAt: this.#startedAt,
      completedAt: this.#completedAt,
      exitCode: this.#exitCode,
      retryCount: this.#retryCount,
      priority: this.#priority
    };
  }
}

export { Job, JobStatus };
