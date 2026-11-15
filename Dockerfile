# Production Next.js Dockerfile for Easypanel VPS deployment
FROM node:20-alpine AS base

# 1. Install dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Build Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# 3. Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/cluster.js ./cluster.js

# Ensure high-concurrency Node.js threadpool and memory headroom
ENV UV_THREADPOOL_SIZE=64
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Ensure the app working directory and persistent volume mount are writable by nextjs user
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "cluster.js"]
