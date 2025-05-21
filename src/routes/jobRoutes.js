import { Router } from 'express';
import { JobController } from '../controllers/jobController.js';

const router = Router();

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - jobName
 *             properties:
 *               jobName:
 *                 type: string
 *                 description: Name of the job to run
 *               arguments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Arguments to pass to the job
 *     responses:
 *       201:
 *         description: Job created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Job created successfully
 *                 job:
 *                   $ref: '#/components/schemas/Job'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', JobController.createJob);

/**
 * @swagger
 * /jobs:
 *   get:
 *     summary: Get all jobs
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, running, completed, failed, retried]
 *         description: Filter jobs by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 50
 *         description: Maximum number of jobs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of jobs to skip
 *     responses:
 *       200:
 *         description: List of jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   description: Total number of jobs matching the criteria
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Job'
 */
router.get('/', JobController.getAllJobs);

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get job statistics and correlations
 *     tags: [Jobs]
 *     responses:
 *       200:
 *         description: Job statistics and correlations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalJobs:
 *                   type: integer
 *                   description: Total number of jobs
 *                 overallSuccessRate:
 *                   type: number
 *                   description: Overall success rate as a decimal
 *                 patterns:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       pattern:
 *                         type: string
 *                         description: Description of the pattern
 *                       matchCount:
 *                         type: integer
 *                         description: Number of jobs matching this pattern
 *                       successRate:
 *                         type: number
 *                         description: Success rate for jobs matching this pattern
 *                       differenceFromAverage:
 *                         type: string
 *                         description: Difference from average success rate
 */
router.get('/stats', JobController.getJobStats);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Job details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Job'
 *       404:
 *         description: Job not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', JobController.getJobById);

export default router;
