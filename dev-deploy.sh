#!/bin/bash

# Development Deployment Script for Sodzo Web Client
# This script handles development environment setup

set -e

# Configuration
APP_NAME="sodzo-webclient"
CONTAINER_NAME="sodzo-webclient-dev"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Development Environment Setup${NC}"
echo -e "${BLUE}=========================================${NC}"

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

# Build development image
echo -e "${YELLOW}🔨 Building development image...${NC}"
docker-compose build

# Start development container
echo -e "${YELLOW}🚀 Starting development container...${NC}"
docker-compose up -d

# Wait for container to be ready
echo -e "${YELLOW}⏳ Waiting for container to be ready...${NC}"
sleep 15

# Health check
echo -e "${YELLOW}🔍 Running health check...${NC}"
if curl -f http://localhost:5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed${NC}"
else
    echo -e "${RED}❌ Health check failed${NC}"
    echo -e "${YELLOW}📋 Container logs:${NC}"
    docker logs "${CONTAINER_NAME}"
    exit 1
fi

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}🌐 Application is available at: http://localhost:5173${NC}"
echo -e "${BLUE}📝 To view logs: docker logs ${CONTAINER_NAME}${NC}"
echo -e "${BLUE}🛑 To stop: docker-compose down${NC}"
