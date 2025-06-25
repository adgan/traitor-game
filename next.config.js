// next.config.js for Next.js standalone output
/** @type {import('next').NextConfig} */

/**
 * Next.js configuration for best practices in Docker/production:
 * - Standalone output for minimal Docker images
 * - Remove legacy next.config.ts if present
 * - No custom port logic: use PORT env variable in Dockerfile/scripts
 */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true, // Enable React strict mode for highlighting potential problems
  swcMinify: true,       // Use the fastest minifier for production
  experimental: {
    // Enable recommended Next.js experimental features for production if needed
    // appDir: true, // Uncomment if using the /app directory
  },
  // Optionally, set images domains or other production-specific settings here
};

module.exports = nextConfig;
