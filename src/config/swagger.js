const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { config } = require('./index');

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
        Error: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'error'
            },
            message: {
              type: 'string',
              example: 'Error description'
            }
          }
        },
        Job: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            jobName: {
              type: 'string',
              example: 'my-task-42'
            },
            arguments: {
              type: 'array',
              items: {
                type: 'string'
              },
              example: ['arg1', 'arg2']
            },
            status: {
              type: 'string',
              enum: ['pending', 'running', 'completed', 'failed', 'retried'],
              example: 'running'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:00:00Z'
            },
            startedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:01:00Z'
            },
            completedAt: {
              type: 'string',
              format: 'date-time',
              example: '2025-01-01T12:05:00Z'
            },
            exitCode: {
              type: 'integer',
              example: 0
            },
            retryCount: {
              type: 'integer',
              example: 0
            }
          }
        },
        Stats: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 100
            },
            completed: {
              type: 'integer',
              example: 68
            },
            failed: {
              type: 'integer',
              example: 22
            },
            running: {
              type: 'integer',
              example: 5
            },
            pending: {
              type: 'integer',
              example: 5
            },
            success_rate: {
              type: 'string',
              example: '68%'
            },
            patterns: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  pattern: {
                    type: 'string',
                    example: 'Job name length > 10'
                  },
                  matchCount: {
                    type: 'integer',
                    example: 24
                  },
                  successRate: {
                    type: 'number',
                    format: 'float',
                    example: 0.83
                  },
                  differenceFromAverage: {
                    type: 'string',
                    example: '+15%'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  // Paths to JSDoc annotations
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

function setupSwagger(app) {
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        docExpansion: 'none'
      }
    })
  );

  console.log(`Swagger documentation available at http://localhost:${config.PORT}/api-docs`);
}

module.exports = { setupSwagger };
