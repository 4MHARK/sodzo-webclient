#!/bin/bash

# Production Deployment Script for Sodzo Web Client
# This script handles deployment to production server

set -e

# Configuration
APP_NAME="sodzo-webclient"
CONTAINER_NAME="sodzo-webclient-prod"
IMAGE_TAG="latest"
REGISTRY="ghcr.io"
FULL_IMAGE_NAME="${REGISTRY}/${APP_NAME}:${IMAGE_TAG}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Production Deployment${NC}"
echo -e "${BLUE}================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists docker; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    exit 1
fi

if ! command_exists docker-compose; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Pull latest image
echo -e "${YELLOW}📥 Pulling latest image...${NC}"
docker pull "${FULL_IMAGE_NAME}"

# Stop existing container
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Start new container
echo -e "${YELLOW}🚀 Starting new container...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for container to be ready...${NC}"
sleep 10

# Health check
echo -e "${YELLOW}🔍 Running health check...${NC}"
if curl -f http://localhost/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker logs "${CONTAINER_NAME}"
    exit 1
fi

# Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${BLUE}🌐 Application is available at: http://localhost${NC}"
echo -e "${BLUE}🔍 Health check: http://localhost/health${NC}"
