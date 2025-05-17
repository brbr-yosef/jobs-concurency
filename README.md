# Overview
You are building a backend service in Node.js (on Windows) that can launch and monitor
native (C++) processing jobs concurrently. 

Some jobs may fail intermittently. 

Your service needs to expose a REST API for control and monitoring and generate basic statistical insights into job
behavior.

## Requirements:
Your service should:
1. Start and monitor concurrent jobs
2. Track their statuses and handle unexpected exits (watchdog behavior)
3. Expose 3 REST endpoints:
1. POST /jobs
   * Starts a new job
   * Request body (Example) :
```
   {
    "jobName": "my-task-42",
    "arguments": [
        "arg1",
        "Arg2"
    ]
   }
```   
2. GET /jobs
   
    * Returns a list of all submitted jobs and their current statuses (running, completed,
   crashed, retried, etc.)

3. GET /stats

   * Return (imaginary or real) correlations between various job characteristics and job
success.

The goal is to surface interesting patterns — even if artificial — that might suggest a
relationship between a job’s attributes and whether it succeeds or fails.

Your implementation should analyze at least three distinct “job characteristics” — for
example:
* Job name length
* Whether the name includes digits
* Argument count
* Any other feature you find interesting

For each pattern you examine, include an insight that shows how that characteristic
correlates with job outcomes (e.g., higher/lower success rate).

There’s no required output format. You may design any structure that clearly conveys
the insights. However, here’s an example to illustrate a possible output:
```
{
    "totalJobs": 100,
    "overallSuccessRate": 0.68,
    "patterns": [
        {
            "pattern": "Job name length > 10",
            "matchCount": 24,
            "successRate": 0.83,
            "differenceFromAverage": "+15%"
        },
        {
            "pattern": "Job name starts with 'x'",
            "matchCount": 9,
            "successRate": 0.33,
            "differenceFromAverage": "-35%"
        }
    ]
}
```

This is a mere example - you can use whatever pattern characteristic you want, and
whatever metric to reflect the impact of that characteristic on the job success.

## Implementation Details:
* You may simulate the C++ app as a dummy batch or command script that randomly
succeeds or fails (exit code 0 or 1).
* You must run multiple jobs concurrently and maintain the job state in memory.
* Your service should detect process exits and track whether they were successful.
* For extra credit, retry crashed jobs once and track their retry status.