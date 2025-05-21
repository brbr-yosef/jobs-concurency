#!/bin/bash

# Automated deployment script for the Job Concurrency API project
# Using: ./deploy.sh [environment]
# environment: prod, dev (по умолчанию: prod)

set -e  # Stop running on error

ENVIRONMENT=${1:-prod}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
APP_NAME="jobs-concurrency-api"
ENV_FILE=".env.${ENVIRONMENT}"

echo "Start deployment to [ $ENVIRONMENT ] environment (use file [ $ENV_FILE ])..."

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: File $ENV_FILE not found"
    echo "Available environment files: "
    ls -la .env*
    exit 1
fi

if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "Error: No Docker and/or Docker Compose installed"
    exit 1
fi

if [ -d "./backup" ]; then
    echo "Create backup of current version..."
    mkdir -p ./backup/$TIMESTAMP
    cp -r ./src ./scripts ./package.json ./package-lock.json ./docker-compose.yml ./Dockerfile ./.env* ./backup/$TIMESTAMP/ 2>/dev/null || true
fi

echo "Run tests before deployment..."
npm test || { echo "Test(-s) failed, deployment canceled."; exit 1; }

echo "Copy environment file and rename it to .env..."
cp $ENV_FILE .env

echo "Building and running Docker containers..."
docker-compose -f docker-compose.yml --env-file $ENV_FILE build
docker-compose -f docker-compose.yml --env-file $ENV_FILE up -d

echo "Checking if the application is running correctly..."
sleep 10

PORT=$(grep -E "^PORT=" $ENV_FILE | cut -d= -f2 || echo "3000")
echo "Checking if the application is available on port $PORT..."

if curl -s http://localhost:$PORT/api-docs > /dev/null; then
    echo "Application is running successfully. Available on http://localhost:$PORT"
else
    echo "Error: Application is not availabled. Check containers logs:"
    docker logs $APP_NAME

    echo "Rollback to previous version..."
    docker-compose down

    if [ -f "./backup/$TIMESTAMP/.env" ]; then
        cp ./backup/$TIMESTAMP/.env .env
    fi

    exit 1
fi

echo "Deployment to $ENVIRONMENT environment completed successfully! "
