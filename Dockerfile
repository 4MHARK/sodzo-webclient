# Multi-stage Dockerfile for React + Vite + TypeScript
# Supports both development and production builds

# Base stage with Node.js
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies stage
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM base AS dev-deps
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Build stage for production
FROM base AS builder
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Development stage
FROM base AS development
ENV NODE_ENV=development
COPY --from=dev-deps /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production stage
FROM nginx:alpine AS production
ENV NODE_ENV=production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy environment configuration script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Use custom entrypoint to handle environment variables
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
