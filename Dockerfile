# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_KEY
ARG ADMIN_USERNAME
ARG ADMIN_PASSWORD

# Set environment variables for build time
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_API_KEY=$NEXT_PUBLIC_ADMIN_API_KEY
ENV ADMIN_USERNAME=$ADMIN_USERNAME
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/package.json ./package.json

# Accept runtime environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ADMIN_API_KEY
ARG ADMIN_USERNAME
ARG ADMIN_PASSWORD

# Set runtime environment variables
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ADMIN_API_KEY=$NEXT_PUBLIC_ADMIN_API_KEY
ENV ADMIN_USERNAME=$ADMIN_USERNAME
ENV ADMIN_PASSWORD=$ADMIN_PASSWORD

# Change ownership to nextjs user
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port 4000
EXPOSE 4000

# Set port environment variable
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
