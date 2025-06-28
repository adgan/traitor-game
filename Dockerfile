
# Secure Dockerfile for Next.js (with Socket.IO API route)
# Use official Node.js LTS image

# Set BUILD_NUMBER to GitHub Actions run number and sha if available, else 'dev'
ARG BUILD_NUMBER
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Install dependencies (use package-lock.json for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .


# Build Next.js app (including serverless API routes)
# Use BUILD_NUMBER if set, else fallback to 'dev'
ARG BUILD_NUMBER
ENV NEXT_PUBLIC_BUILD_NUMBER=${BUILD_NUMBER:-dev}
RUN npm run build

# Production image, copy only necessary files


FROM node:20-alpine AS runner
WORKDIR /app
ARG BUILD_NUMBER
LABEL version=${BUILD_NUMBER:-dev}


# Set NODE_ENV to production for security
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BUILD_NUMBER=${BUILD_NUMBER:-dev}

# Copy built app and node_modules from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.next ./.next
COPY --from=deps /app/public ./public
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/next.config.* ./
COPY --from=deps /app/postcss.config.* ./
COPY --from=deps /app/tailwind.config.* ./
COPY --from=deps /app/src ./src

# Expose port 3000
EXPOSE 3000

# Run as non-root user for security
RUN addgroup -g 1001 -S nextjs && adduser -S nextjs -u 1001 -G nextjs
USER nextjs

# Start the Next.js app
CMD ["npm", "start"]