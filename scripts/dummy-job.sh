#!/bin/bash
# Dummy job script that simulates a C++ application
# It randomly succeeds or fails with configurable probability

echo "[$(date +%T)] Starting job with arguments: $@"
echo "Job name: $1"
echo "Additional arguments: ${@:2}"

# Simulate processing time (random between 1-5 seconds)
sleep_time=$((RANDOM % 5 + 1))
echo "Processing for $sleep_time seconds..."
sleep $sleep_time

# Randomly decide if the job will succeed or fail (30% chance of failure)
random_num=$((RANDOM % 10))
if [ $random_num -lt 3 ]; then
    echo "[$(date +%T)] Job failed with an error!"
    exit 1
else
    echo "[$(date +%T)] Job completed successfully!"
    exit 0
fi
