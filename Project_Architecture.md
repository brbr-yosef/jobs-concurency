# BrBr_JobsConcurency Project Architecture

## Project Overview

BrBr_JobsConcurency is a backend service designed for launching and monitoring native processing jobs with concurrent execution support. The project is built using Node.js and follows a modular architecture with clear separation of concerns between components.

## Key Features

1. **Job Management**:
   - Creating, retrieving, updating, and deleting jobs
   - Tracking job execution status
   - Managing job priorities
   - Automatic retry on failures

2. **Concurrent Execution**:
   - Limiting the number of simultaneously running jobs
   - Priority-based job queue
   - Scalability and efficient resource utilization

3. **REST API**:
   - Full RESTful interface for job management
   - API documentation using Swagger
   - Support for filtering and pagination of results

4. **Cross-platform Compatibility**:
   - Automatic OS detection (Windows/Linux)
   - Selection of appropriate scripts for job execution

## Project Architecture

### Project Structure

```
BrBr_JobsConcurency/
├── docs/                  # Project documentation
├── scripts/               # Scripts for job execution and deployment
├── src/                   # Application source code
│   ├── config/            # Application configuration
│   ├── controllers/       # HTTP request handlers
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── index.js           # Application entry point
├── tests/                 # Tests
│   ├── manual/            # Manual tests
│   └── unit/              # Unit tests
├── .env                   # Environment variables (common)
├── .env.dev               # Environment variables for development
├── .env.prod              # Environment variables for production
├── package.json           # Dependencies and project scripts
└── README.md              # General project description
```

### System Components

#### 1. Job Model

The `Job` model defines the data structure for a job and includes the following fields:
- `id`: Unique job identifier
- `jobName`: Name of the job
- `jobArgs`: Arguments for job execution
- `status`: Current job status (PENDING, RUNNING, COMPLETED, FAILED, RETRIED, PAUSED, STOPPING)
- `priority`: Job priority (1-5, where 5 is the highest)
- `createdAt`: Job creation timestamp
- `startedAt`: Job execution start timestamp
- `completedAt`: Job completion timestamp
- `exitCode`: Job exit code
- `retryCount`: Number of retry attempts

The model also provides methods for updating status, priority, and other job properties.

#### 2. Job Service

`JobService` contains all the business logic for job management:
- Creating new jobs with input validation
- Launching jobs with respect to concurrency limits
- Managing the job queue with priority consideration
- Tracking job execution status
- Automatic job retry on failures
- Collecting job statistics
- Filtering and pagination of job lists
- Deleting jobs with status validation

### Concurrent Job Monitoring Implementation

The concurrent job monitoring system is implemented as follows:

1. **Parallel Job Count Control**:
   - `JobService` maintains a `runningJobs` counter that tracks the number of simultaneously executing jobs
   - The maximum number of parallel jobs is determined by the `MAX_CONCURRENT_JOBS` parameter from the configuration
   - The `processQueue` method checks if the maximum number of jobs has been exceeded before launching a new one

2. **Asynchronous Execution Tracking**:
   - When a job is launched via `node-cmd`, a completion event handler is registered
   - The handler is called asynchronously when the job completes, updating its status and freeing a slot for the next job
   - The Promise mechanism is used for asynchronous processing of job completion events

3. **Status Change Event Handling**:
   - When a job's status changes (e.g., from RUNNING to COMPLETED or FAILED), the `updateStatus` method is called
   - This method updates the job status and records the corresponding timestamps (startedAt, completedAt)
   - After updating the status, if the job is completed, the `runningJobs` counter is decremented and `processQueue` is called to start the next job from the queue

4. **Retry Mechanism (Watchdog)**:
   - If a job completes with an error, the system automatically checks for the possibility of a restart
   - If the number of attempts does not exceed `JOB_RETRY_ATTEMPTS`, the job is marked as RETRIED and added back to the queue with an increased `retryCount`
   - This mechanism ensures fault tolerance and automatic recovery after temporary failures

5. **Execution Metrics Collection and Analysis**:
   - For each job, timestamps for creation, start, and completion are saved
   - The exit code (exitCode) is stored for failure cause analysis
   - The `getStats` method provides aggregated statistics for all jobs (count by status, average duration, etc.)

This architecture ensures efficient management of concurrent job execution, preventing system overload and ensuring maximum utilization of available resources.

#### 3. Job Controller

`JobController` is responsible for handling HTTP requests and forming responses:
- Creating jobs based on request data
- Retrieving job lists with filtering and pagination support
- Getting information about a specific job by ID
- Updating job priority
- Deleting jobs
- Getting job statistics
- Error handling and forming appropriate HTTP responses

#### 4. API Routes

The `jobRoutes` module defines available API endpoints and connects them to the corresponding controller methods:
- `POST /jobs`: Create a new job
- `GET /jobs`: Get a list of jobs with filtering and pagination
- `GET /jobs/:id`: Get information about a job by ID
- `PUT /jobs/:id/priority`: Update job priority
- `DELETE /jobs/:id`: Delete a job
- `GET /stats`: Get job statistics

All endpoints are documented using Swagger for easy API usage.

#### 5. Configuration

The configuration module is responsible for loading and providing application settings from environment variables:
- `PORT`: Server port
- `MAX_CONCURRENT_JOBS`: Maximum number of concurrently running jobs
- `JOB_RETRY_ATTEMPTS`: Number of retry attempts for failed jobs

#### 6. Utilities

Utility modules include:
- Logging using Winston and Morgan
- Error handling
- API response formatting

## Design Principles

### 1. Separation of Concerns

The project follows the principle of separation of concerns:
- **Controllers** are only responsible for handling HTTP requests and forming responses
- **Services** contain all business logic
- **Models** define data structures and methods for working with them
- **Routes** define available API endpoints

### 2. Object-Oriented Approach

The project uses classes and objects for code organization:
- `Job` class for representing a job
- `JobService` class for job management
- `JobController` class for handling HTTP requests

### 3. Asynchronous Programming

The project actively uses asynchronous programming with Promises and async/await for handling parallel operations and preventing main thread blocking.

### 4. Modularity and Reusability

The code is organized into modules with clearly defined interfaces, which ensures component reusability and simplifies testing.

## Design Patterns

The project implements several design patterns:

### 1. Model-View-Controller (MVC)

The project architecture follows the MVC pattern:
- **Model**: The `Job` class and related data handling methods
- **View**: JSON response formatting in controllers and Swagger documentation
- **Controller**: The `JobController` class for handling HTTP requests

### 2. Singleton

The `JobService` is implemented as a singleton, providing a single point of access to job management functionality and ensuring that only one instance of the service exists in the application.

### 3. Factory Method

The `createJob` method in `JobService` acts as a factory method, creating and configuring new job instances with the necessary parameters and initial state.

### 4. Observer

The job status tracking system implements the Observer pattern, where `JobService` observes changes in job states and reacts accordingly (e.g., starting the next job from the queue when a current job completes).

### 5. Command

Each job (`Job`) represents a command that encapsulates all the information needed to perform an operation. `JobService` acts as an invoker that executes commands in a specific order.

### 6. Strategy

The mechanism for selecting the script to run based on the operating system implements the Strategy pattern, allowing dynamic selection of the execution algorithm.

### 7. Repository

Although the project doesn't use an external database, `JobService` acts as a repository for jobs, providing methods for creating, retrieving, updating, and deleting jobs, abstracting the details of data storage.

## Technologies and Libraries Used

### Core Technologies

- **Node.js**: JavaScript runtime environment for server-side execution
- **Express**: Web application framework for building APIs
- **ES Modules**: JavaScript module system

### Libraries

- **node-cmd**: For executing operating system commands
- **winston**: For structured logging
- **morgan**: For HTTP request logging
- **swagger-jsdoc** and **swagger-ui-express**: For API documentation
- **dotenv**: For working with environment variables

### Development Tools

- **Jest**: For unit testing
- **ESLint**: For static code analysis
- **Nodemon**: For automatic server restart during development

## Testing

### Unit Tests

The project includes unit tests for the main components:
- Tests for `JobService` verify job creation, filtering, updating, and deletion
- Tests for `JobController` verify HTTP request handling and response formation

### Manual Tests

The project also includes manual tests for verifying concurrent job execution:
- `concurrent-jobs-test.js`: Checks the limitation on the number of concurrently running jobs
- `concurrent-jobs-priority-test.js`: Verifies job priority functionality

## CI/CD and Deployment

### Continuous Integration

The project is configured for continuous integration using GitHub Actions:
- Automatic test execution on each push and pull request
- Code checking with ESLint
- Project building and dependency verification

### Continuous Deployment

Automatic deployment to test and production servers is configured:
- Using Docker for container creation
- Automatic deployment upon successful test completion
- Version and tag management
- Automatic rollback on failures

### Deployment Scripts

The project includes a `deploy.sh` script for automating the deployment process:
- Environment setup depending on the target environment (dev/prod)
- Docker container management
- Rollback procedures on failures

## Conclusion

The BrBr_JobsConcurency project is a well-structured backend service for managing concurrent job execution. The project architecture is based on the principles of separation of concerns, modularity, and object-oriented programming, which ensures scalability, maintainability, and testability of the code.

The use of modern technologies and libraries, as well as the presence of automated tests and CI/CD processes, makes the project ready for production use and further development.
