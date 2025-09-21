# FROM node:18-alpine AS base

# # Dependencies stage
# FROM base AS deps
# WORKDIR /app

# # Install system dependencies
# RUN apk add --no-cache libc6-compat python3 make g++

# # Install Node.js dependencies
# COPY package*.json ./
# RUN npm ci --build-from-source

# # Building stage
# FROM base AS builder
# WORKDIR /app

# # Copy dependencies from deps stage
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .

# # Set environment variables
# ENV NEXT_TELEMETRY_DISABLED 1
# ENV NODE_ENV production

# # Build application
# RUN npm run build

# # Production stage
# FROM base AS runner
# WORKDIR /app

# # Set environment variables for production
# ENV NODE_ENV production
# ENV NEXT_TELEMETRY_DISABLED 1

# # Create non-root user for security
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

# # Copy necessary files
# COPY --from=builder /app/public ./public
# COPY --from=builder /app/package.json ./package.json

# # Set up .next directory with correct permissions
# COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# # Switch to non-root user
# USER nextjs

# # Expose port
# EXPOSE 3000

# # Set host and port
# ENV PORT 3000
# ENV HOSTNAME "0.0.0.0"

# # Start the application
# CMD ["node", "server.js"]
from node:18-alpine AS base

WORKDIR /app

COPY source dest package*.json ./