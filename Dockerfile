
# Secure Dockerfile for Next.js (with Socket.IO API route)
# Use official Node.js LTS image


# Multi-stage Dockerfile for Next.js (build outside Docker, copy in artifacts)
FROM node:20-alpine AS runner
WORKDIR /app
ARG BUILD_NUMBER
LABEL version=${BUILD_NUMBER:-dev}

# Set NODE_ENV to production for security
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BUILD_NUMBER=${BUILD_NUMBER:-dev}


# Copy built app and node_modules from build artifacts
COPY .next ./.next
COPY node_modules ./node_modules
COPY public ./public
COPY package.json ./package.json
COPY next.config.* ./
COPY postcss.config.* ./
COPY tailwind.config.* ./
COPY src ./src

# Fix permissions for node_modules and .next
RUN chmod -R 755 node_modules/.bin && chmod -R 755 .next && chmod -R 755 node_modules

# Expose port 3000
EXPOSE 3000

# Run as non-root user for security
RUN addgroup -g 1001 -S nextjs && adduser -S nextjs -u 1001 -G nextjs
USER nextjs

# Start the Next.js app
CMD ["npm", "start"]
