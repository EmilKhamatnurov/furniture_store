# =============================================================================
# Furniture Shop — Dockerfile
# Multi-stage build: deps → builder → runner
# =============================================================================

# Stage 1: Install dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# Stage 2: Build the application
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Drizzle migrations (schema must be complete)
# Actual migration runs at container start via entrypoint, not here
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy migration files for startup migration
COPY --from=builder /app/db/migrations ./db/migrations
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Entrypoint runs migrations then starts the app
COPY infra/docker/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]

# =============================================================================
# Stage 4: Worker / migrate runtime
# Runs the BullMQ worker (and DB migrations) via tsx with the react-server
# condition so `server-only` resolves to a no-op outside Next's runtime.
# Carries full deps + TS source (not bundled) — simplest robust setup.
# =============================================================================
FROM node:22-alpine AS worker
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Full node_modules (incl. tsx, drizzle-kit) + the source the worker needs
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json drizzle.config.ts ./
COPY worker ./worker
COPY src ./src
COPY db ./db

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 worker
USER worker

# Default command — overridden by the `migrate` service in docker-compose
CMD ["npm", "run", "start:worker"]
