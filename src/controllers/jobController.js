import { jobService } from '../services/jobService.js';
import { logger } from '../utils/logger/index.js';

/**
 * Controller: jobs management
 */
export class JobController {
  /**
   * Creates new job
   * @param {import('express').Request} req - Express request
   * @param {import('express').Response} res - Express response
   */
  static createJob(req, res) {
    try {
      const { jobName, args = [] } = req.body;
      
      if (!jobName) {
        logger.warn('Attempt to create job without jobName');
        return res.status(400).json({
          message: 'Job name is required',
          code: 400
        });
      }
      
      const jobArgs = Array.isArray(args) ? args : [args];
      
      logger.info(`Creating job with name: ${jobName}, args: ${jobArgs.join(', ')}`);
      
      const job = jobService.createJob(jobName, jobArgs);
      
      return res.status(201).json({
        message: 'Job created successfully',
        job
      });
    } catch (error) {
      logger.error(`Error creating job: ${error.message}`);
      return res.status(500).json({
        message: `Error creating job: ${error.message}`,
        code: 500
      });
    }
  }
  
  /**
   * Get list of all jobs
   * @param {import('express').Request} req - Express request
   * @param {import('express').Response} res - Express response
   */
  static getAllJobs(req, res) {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      logger.info(`Getting all jobs with filters: status=${status}, limit=${limit}, offset=${offset}`);
      
      const result = jobService.getFilteredJobs({ status, limit, offset });
      
      return res.status(200).json(result);
    } catch (error) {
      logger.error(`Error getting jobs: ${error.message}`);
      return res.status(500).json({
        message: `Error getting jobs: ${error.message}`,
        code: 500
      });
    }
  }
  
  /**
   * Get job by ID
   * @param {import('express').Request} req - Express request
   * @param {import('express').Response} res - Express response
   */
  static getJobById(req, res) {
    try {
      const { id } = req.params;
      
      logger.info(`Getting job with ID: ${id}`);
      
      const job = jobService.getJobById(id);
      
      if (!job) {
        logger.warn(`Job with ID ${id} not found`);
        return res.status(404).json({
          message: `Job with ID ${id} not found`,
          code: 404
        });
      }
      
      return res.status(200).json(job);
    } catch (error) {
      logger.error(`Error getting job: ${error.message}`);
      return res.status(500).json({
        message: `Error getting job: ${error.message}`,
        code: 500
      });
    }
  }
  
  /**
   * Gets job statistics
   * @param {import('express').Request} req - Express request
   * @param {import('express').Response} res - Express response
   */
  static getJobStats(req, res) {
    try {
      logger.info('Getting job statistics');
      
      const stats = jobService.getJobStats();
      
      return res.status(200).json(stats);
    } catch (error) {
      logger.error(`Error getting job statistics: ${error.message}`);
      return res.status(500).json({
        message: `Error getting job statistics: ${error.message}`,
        code: 500
      });
    }
  }
}
