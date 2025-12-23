# Backend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Stage 1: Dependencies
FROM base AS dependencies

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM base AS build

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/backend/node_modules ./packages/backend/node_modules

# Copy source code
COPY packages/backend ./packages/backend
COPY pnpm-workspace.yaml package.json ./

# Generate Prisma Client
WORKDIR /app/packages/backend
RUN pnpm prisma:generate

# Clean previous build and build TypeScript
RUN rm -rf dist && pnpm build

# Stage 3: Production
FROM base AS production

WORKDIR /app

# Copy package files
COPY --from=build /app/packages/backend/package.json ./
COPY --from=build /app/packages/backend/dist ./dist
COPY --from=build /app/packages/backend/prisma ./prisma
COPY --from=build /app/packages/backend/prisma.config.ts ./prisma.config.ts

# Copy entrypoint script
COPY packages/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Install production dependencies with npm
RUN npm install --only=production

# Generate Prisma client in production
RUN npx prisma generate

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start server
CMD ["node", "dist/src/server.js"]
