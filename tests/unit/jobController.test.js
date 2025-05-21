/**
 * Unit-tests for jobController
 */
import { jest } from '@jest/globals';

const mockCreateJob = jest.fn();
const mockGetFilteredJobs = jest.fn();
const mockGetJobById = jest.fn();
const mockGetJobStats = jest.fn();
const mockUpdateJobPriority = jest.fn();

jest.unstable_mockModule('../../src/services/jobService.js', () => ({
  jobService: {
    createJob: mockCreateJob,
    getFilteredJobs: mockGetFilteredJobs,
    getJobById: mockGetJobById,
    getJobStats: mockGetJobStats,
    updateJobPriority: mockUpdateJobPriority
  }
}));

const { JobController } = await import('../../src/controllers/jobController.js');

describe('JobController', () => {
  let req, res;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {
      body: {},
      params: {},
      query: {}
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });
  
  describe('createJob', () => {
    test('Have to return code 400 if jobName is not specified', () => {
      req.body = {};
      
      JobController.createJob(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Job name is required'
      }));
      expect(mockCreateJob).not.toHaveBeenCalled();
    });
    
    test('Have to create a job and return code 201', () => {
      const mockJob = {
        id: '123',
        jobName: 'test-job',
        jobArgs: ['arg1'],
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      req.body = { jobName: 'test-job', args: ['arg1'] };
      mockCreateJob.mockReturnValue(mockJob);
      
      JobController.createJob(req, res);
      
      expect(mockCreateJob).toHaveBeenCalledWith('test-job', ['arg1'], expect.any(Number));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        job: mockJob
      }));
    });
    
    test('Have to create a job with specified priority', () => {
      const mockJob = {
        id: '123',
        jobName: 'test-job',
        jobArgs: ['arg1'],
        status: 'pending',
        priority: 5,
        createdAt: new Date().toISOString()
      };
      
      req.body = { jobName: 'test-job', args: ['arg1'], priority: 5 };
      mockCreateJob.mockReturnValue(mockJob);
      
      JobController.createJob(req, res);
      
      expect(mockCreateJob).toHaveBeenCalledWith('test-job', ['arg1'], 5);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        job: mockJob
      }));
    });
    
    test('Have to catch errors and return code 500', () => {
      req.body = { jobName: 'test-job' };
      mockCreateJob.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      JobController.createJob(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Error creating job')
      }));
    });
  });
  
  describe('updateJobPriorityById', () => {
    test('Have to return 400 if priority is not specified', () => {
      req.params = { id: '123' };
      req.body = {};
      
      JobController.updateJobPriorityById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Priority is required'
      }));
      expect(mockUpdateJobPriority).not.toHaveBeenCalled();
    });
    
    test('Have to update job priority and return 200', () => {
      const mockJob = {
        id: '123',
        jobName: 'test-job',
        priority: 4,
        status: 'pending'
      };
      
      req.params = { id: '123' };
      req.body = { priority: 4 };
      mockUpdateJobPriority.mockReturnValue(mockJob);
      
      JobController.updateJobPriorityById(req, res);
      
      expect(mockUpdateJobPriority).toHaveBeenCalledWith('123', 4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Job priority updated successfully',
        job: mockJob
      }));
    });
    
    test('Have to return 404 if job is not found', () => {
      req.params = { id: '999' };
      req.body = { priority: 3 };
      mockUpdateJobPriority.mockReturnValue(null);
      
      JobController.updateJobPriorityById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Job with ID 999 not found')
      }));
    });
    
    test('Have to catch errors and return 500', () => {
      req.params = { id: '123' };
      req.body = { priority: 3 };
      mockUpdateJobPriority.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      JobController.updateJobPriorityById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Error updating job priority')
      }));
    });
  });
  
  describe('getAllJobs', () => {
    test('Have to return filtered jobs', () => {
      const mockResult = {
        jobs: [{ id: '123', jobName: 'job1' }],
        total: 1
      };
      
      req.query = { status: 'completed', limit: '10', offset: '0' };
      mockGetFilteredJobs.mockReturnValue(mockResult);
      
      JobController.getAllJobs(req, res);
      
      expect(mockGetFilteredJobs).toHaveBeenCalledWith(expect.objectContaining({
        status: 'completed',
        limit: '10',
        offset: '0'
      }));
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });
    
    test('Have to catch/manage errors and return code 500', () => {
      mockGetFilteredJobs.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      JobController.getAllJobs(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Error getting jobs')
      }));
    });
  });
  
  describe('getJobById', () => {
    test('Have to return job by its ID', () => {
      const mockJob = { id: '123', jobName: 'job1' };
      
      req.params = { id: '123' };
      mockGetJobById.mockReturnValue(mockJob);
      
      JobController.getJobById(req, res);
      
      expect(mockGetJobById).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockJob);
    });
    
    test('Have to return code 404 if job is not found', () => {
      req.params = { id: '999' };
      mockGetJobById.mockReturnValue(null);
      
      JobController.getJobById(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Job with ID 999 not found')
      }));
    });
  });
  
  describe('getJobStats', () => {
    test('Have to return stats of jobs', () => {
      const mockStats = {
        totalJobs: 10,
        completedJobs: 5,
        failedJobs: 2
      };
      
      mockGetJobStats.mockReturnValue(mockStats);
      
      JobController.getJobStats(req, res);
      
      expect(mockGetJobStats).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockStats);
    });
  });
});
