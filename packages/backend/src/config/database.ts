import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import type { PrismaClient as PrismaClientType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

// Singleton pattern - single instance across app
const globalForPrisma = global as unknown as { prisma: PrismaClientType };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to database
 * @throws {Error} If connection fails
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed', error);
    throw error;
  }
}

/**
 * Gracefully disconnect from database
 * Logs errors but doesn't throw to allow clean shutdown
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting database', error);
    // Don't throw - allow graceful shutdown to continue
  }
}

// Cleanup on process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});
