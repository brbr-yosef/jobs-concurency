import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { logger, createHttpLogger } from './utils/logger/index.js';
import { setupSwagger } from './config/swagger.js';
import jobRoutes from './routes/jobRoutes.js';
import { JobController } from './controllers/jobController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(createHttpLogger(logger));

// Swagger documentation
setupSwagger(app);

// Routes
app.use('/jobs', jobRoutes);

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
 *                 completedJobs:
 *                   type: integer
 *                   description: Number of completed jobs
 *                 failedJobs:
 *                   type: integer
 *                   description: Number of failed jobs
 *                 pendingJobs:
 *                   type: integer
 *                   description: Number of pending jobs
 *                 runningJobs:
 *                   type: integer
 *                   description: Number of running jobs
 *                 retriedJobs:
 *                   type: integer
 *                   description: Number of retried jobs
 *                 averageCompletionTime:
 *                   type: number
 *                   description: Average time to complete a job in milliseconds
 *                 successRate:
 *                   type: number
 *                   description: Success rate as a percentage
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
// Stats route at root level as per requirements
app.get('/stats', JobController.getJobStats);

app.get('/', (req, res) => {
  logger.info('Root endpoint accessed');
  res.json({ message: 'Job Concurrency Manager API' });
});

app.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}.`);
});
