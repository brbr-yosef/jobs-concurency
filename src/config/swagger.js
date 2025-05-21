import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { config } from './index.js';

/**
 * Swagger configuration
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Job Concurrency Manager API',
      version: '1.0.0',
      description: 'API for managing and controlling of parallel jobs.',
      contact: {
        name: 'API Support',
        email: 'yosef.trrachtenberg@gmail.com'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'Unique identifier for the job'
            },
            jobName: {
              type: 'string',
              example: 'my-task-42',
              description: 'Name of the job'
            },
            arguments: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['arg1', 'arg2'],
              description: 'Arguments passed to the job'
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'retried'],
              example: 'running',
              description: 'Current status of the job'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:00:00Z',
              description: 'Timestamp the job was created'
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:01:00Z',
              description: 'Timestamp the job started running'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:05:00Z',
              description: 'Timestamp the job completed'
            },
            exitCode: {
              type: 'integer',
              example: 0,
              description: 'Exit code of the job'
            },
            retryCount: {
              type: 'integer',
              example: 0,
              description: 'Number of times the job has been retried'
            }
          }
        },
        JobStats: {
          type: 'object',
          properties: {
            totalJobs: {
              type: 'integer',
              example: 100,
              description: 'Total number of jobs'
            },
            completedJobs: {
              type: 'integer',
              example: 68,
              description: 'Number of completed jobs'
            },
            failedJobs: {
              type: 'integer',
              example: 22,
              description: 'Number of failed jobs'
            },
            pendingJobs: {
              type: 'integer',
              example: 5,
              description: 'Number of pending jobs'
            },
            runningJobs: {
              type: 'integer',
              example: 5,
              description: 'Number of running jobs'
            },
            averageCompletionTime: {
              type: 'number',
              description: 'Average time to complete a job in milliseconds'
            },
            successRate: {
              type: 'number',
              description: 'Success rate as a percentage'
            },
            patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pattern: {
                    type: 'string',
                    example: 'Job name length > 10',
                    description: 'Description of the pattern'
                  },
                  matchCount: {
                    type: 'integer',
                    example: 24,
                    description: 'Number of jobs matching this pattern'
                  },
                  successRate: {
                    type: 'number',
                    format: 'float',
                    example: 0.83,
                    description: 'Success rate for jobs matching this pattern'
                  },
                  differenceFromAverage: {
                    type: 'string',
                    description: 'Difference from average success rate'
                  }
                }
              }
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'integer',
              description: 'Error code'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

/**
 * Sets up Swagger documentation for the Express app
 * @param {import('express').Application} app - Express application
 */
const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      docExpansion: 'none'
    }
  }));
  
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log(`Swagger documentation available at http://localhost:${config.PORT}/api-docs`);
};

export { setupSwagger };
