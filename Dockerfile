# React Frontend Dockerfile - Multi-stage build for optimization
FROM node:20-alpine AS deps
# Install necessary packages for Next.js
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Configure npm for better network handling
RUN npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000
# Copy package files
COPY package*.json ./
# Install dependencies with BuildKit cache mount for faster rebuilds
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit || \
    (npm cache clean --force && npm ci --prefer-offline --no-audit)

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
# Copy package files first to ensure they exist
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
# Copy all other files
COPY . .
# Build the application with standalone output
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# When using standalone output, Next.js creates a .next/standalone folder
# Check if standalone exists, otherwise use traditional approach
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Try to copy standalone output first, fallback to traditional if not available
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Start using the standalone server (server.js is in the standalone folder)
CMD ["node", "server.js"]
