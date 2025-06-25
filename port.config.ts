// This file is not needed for Next.js port configuration. Use the PORT env variable directly in your scripts and Dockerfile.
// See .env.example for usage.

// This file loads environment variables from .env and sets the port for Next.js
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const port = process.env.PORT || 3000;

export default port;
