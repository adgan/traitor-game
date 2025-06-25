# Secure Dockerfile for Next.js (with Socket.IO API route)
# Use official Node.js LTS image
FROM node:20-alpine AS deps

# Set working directory
WORKDIR /app

# Install dependencies (use package-lock.json for reproducible builds)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app (including serverless API routes)
RUN npm run build

# Production image, copy only necessary files
FROM node:20-alpine AS runner
WORKDIR /app

# Set NODE_ENV to production for security
ENV NODE_ENV=production

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
