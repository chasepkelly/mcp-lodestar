# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy TypeScript files and configuration
COPY tsconfig.json ./
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy any additional files needed at runtime
COPY LICENSE ./
COPY README.md ./

# Change ownership to non-root user
RUN chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# The actual command will be provided by smithery.yaml
CMD ["node", "dist/index.js"]
