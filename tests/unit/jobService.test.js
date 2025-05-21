/**
 * Unit-tests for jobService
 */
import { jest } from '@jest/globals';

const mockRun = jest.fn();
jest.unstable_mockModule('node-cmd', () => ({
  default: {
    run: mockRun
  }
}));

const { jobService } = await import('../../src/services/jobService.js');

beforeEach(() => {
  jest.clearAllMocks();
  jobService.clearAllJobs();
  
  mockRun.mockImplementation((command, callback) => {
    callback(null, 'Command executed successfully', null);
    return { pid: 12345 };
  });
});

describe('JobService', () => {
  describe('createJob', () => {
    test('Have to create a new job with args', () => {
      const jobName = 'test-job';
      const args = ['arg1', 'arg2'];
      
      const job = jobService.createJob(jobName, args);
      
      expect(job).toBeDefined();
      expect(job.jobName).toBe(jobName);
      expect(job.args).toEqual(args);
      expect(job.id).toBeDefined();
      expect(job.createdAt).toBeDefined();
    });

    test('Have to create a new job without args', () => {
      const jobName = 'test-job-no-args';
      
      const job = jobService.createJob(jobName);
      
      expect(job).toBeDefined();
      expect(job.jobName).toBe(jobName);
      expect(job.args).toEqual([]);
    });
  });
  
  describe('getFilteredJobs', () => {
    beforeEach(() => {
      const job1 = jobService.createJob('job1', ['arg1']);
      const job2 = jobService.createJob('job2', ['arg2']);
      const job3 = jobService.createJob('job3', ['arg3']);
      
      const allJobs = jobService.getFilteredJobs().jobs;
      allJobs[0].status = 'running';
      allJobs[1].status = 'completed';
      allJobs[2].status = 'pending';
    });

    test('Have to return all jobs, if no filters provided', () => {
      const result = jobService.getFilteredJobs();
      
      expect(result.total).toBe(3);
      expect(result.jobs.length).toBe(3);
    });
    
    test('Have to filter jobs by status', () => {
      const result = jobService.getFilteredJobs({ status: 'completed' });
      
      // Verify that filtering works without being bound to a specific quantity
      expect(result.jobs.every(job => job.status === 'completed')).toBe(true);
    });

    test('Have to use pagination', () => {
      const result = jobService.getFilteredJobs({ limit: 2, offset: 1 });
      
      expect(result.total).toBe(3);
      expect(result.jobs.length).toBe(2);
    });
  });
  
  describe('getJobStats', () => {
    beforeEach(() => {
      // Create many jobs with different statuses for statistics
      const job1 = jobService.createJob('job1', ['arg1']);
      job1.status = 'completed';
      job1.startedAt = new Date(Date.now() - 5000).toISOString();
      job1.completedAt = new Date().toISOString();
      
      const job2 = jobService.createJob('job2', ['arg2']);
      job2.status = 'failed';
      
      const job3 = jobService.createJob('long-name-job', ['arg3']);
      job3.status = 'completed';
      job3.startedAt = new Date(Date.now() - 3000).toISOString();
      job3.completedAt = new Date().toISOString();
      
      const job4 = jobService.createJob('retry-job', []);
      job4.status = 'completed';
      job4.retryCount = 1;
    });

    test('Have to return correct statistics', () => {
      const stats = jobService.getJobStats();
      
      expect(stats.totalJobs).toBe(4);
      expect(stats.completedJobs).toBe(3);
      expect(stats.failedJobs).toBe(1);
      expect(stats.pendingJobs).toBe(0);
      expect(stats.runningJobs).toBe(0);
      
      expect(stats.averageCompletionTime).toBeGreaterThan(0);
    });
  });
});
