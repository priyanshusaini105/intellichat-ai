// Prisma configuration file
// In production (Render/Railway), environment variables are set by the platform
// In development, they're loaded from .env file
import { defineConfig } from "prisma/config";

// Load .env file only in development
if (process.env.NODE_ENV !== 'production') {
  await import('dotenv/config');
}

// For frontend builds on Vercel, DATABASE_URL won't be set - that's okay
// Prisma Client generation will use a dummy URL
const databaseUrl = process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

// Only log in non-Vercel environments
if (!process.env.VERCEL) {
  if (process.env.DATABASE_URL) {
    console.log('✅ DATABASE_URL found:', process.env.DATABASE_URL?.substring(0, 30) + '...');
  } else {
    console.log('⚠️  DATABASE_URL not set, using dummy URL for Prisma generation');
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
