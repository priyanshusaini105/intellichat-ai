// Prisma configuration file
// In production (Render/Railway), environment variables are set by the platform
// In development, they're loaded from .env file
import { defineConfig } from "prisma/config";

// Load .env file only in development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATA')).join(', '));
  process.exit(1);
}

console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL?.substring(0, 30) + '...');

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
