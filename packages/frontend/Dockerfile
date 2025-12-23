# Frontend Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Stage 1: Dependencies
FROM base AS dependencies

WORKDIR /app

# Copy workspace files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/frontend/package.json ./packages/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build
FROM base AS build

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/packages/frontend/node_modules ./packages/frontend/node_modules

# Copy source code
COPY packages/frontend ./packages/frontend
COPY pnpm-workspace.yaml package.json ./

# Build SvelteKit app
WORKDIR /app/packages/frontend
RUN pnpm build

# Stage 3: Production
FROM base AS production

WORKDIR /app

# Copy built files
COPY --from=build /app/packages/frontend/build ./build
COPY --from=build /app/packages/frontend/package.json ./
COPY --from=build /app/packages/frontend/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "build"]
