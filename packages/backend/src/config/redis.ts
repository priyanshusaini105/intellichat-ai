import { Redis } from 'ioredis';
import { logger } from '../shared/utils/logger.js';

/**
 * Redis client instance (singleton)
 * Gracefully handles connection failures - app continues without Redis
 */
let redis: Redis | null = null;

/**
 * Initialize Redis connection with graceful degradation
 * @returns Redis client or null if connection fails
 */
export async function connectRedis(): Promise<Redis | null> {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        if (times > 3) {
          logger.warn('⚠️  Redis connection failed after 3 retries. Continuing without cache.');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true, // Don't connect immediately
    });

    // Attempt connection
    await redis.connect();

    // Test connection
    await redis.ping();

    logger.info('✅ Redis connected successfully');

    // Handle connection errors
    redis.on('error', (err: Error) => {
      logger.error('❌ Redis connection error:', err.message);
    });

    redis.on('reconnecting', () => {
      logger.info('🔄 Redis reconnecting...');
    });

    return redis;
  } catch (error) {
    logger.warn('⚠️  Redis unavailable. Continuing without cache.', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    redis = null;
    return null;
  }
}

/**
 * Get Redis client instance
 * @returns Redis client or null if not connected
 */
export function getRedis(): Redis | null {
  return redis;
}

/**
 * Close Redis connection gracefully
 */
export async function disconnectRedis(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      logger.info('✅ Redis disconnected successfully');
    } catch (error) {
      logger.error('❌ Error disconnecting Redis:', error);
    } finally {
      redis = null;
    }
  }
}

/**
 * Check if Redis is available
 * @returns true if connected, false otherwise
 */
export function isRedisAvailable(): boolean {
  return redis !== null && redis.status === 'ready';
}
