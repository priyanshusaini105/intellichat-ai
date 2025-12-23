import { Redis } from 'ioredis';
import { getRedis } from '../config/redis.js';
import { logger } from '../shared/utils/logger.js';

/**
 * Cache service for managing Redis-based caching with graceful degradation
 * All methods fail silently when Redis is unavailable
 */
export class CacheService {
  private readonly prefix = 'spur:';
  private readonly defaultTTL = 600; // 10 minutes in seconds

  /**
   * Get Redis client or null if unavailable
   */
  private getClient(): Redis | null {
    return getRedis();
  }

  /**
   * Generate a namespaced cache key
   * @param key - The base key
   * @returns Prefixed key (e.g., 'spur:conversation:abc123')
   */
  private buildKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get value from cache
   * @param key - Cache key (will be prefixed automatically)
   * @returns Parsed value or null if not found/error
   */
  async get<T>(key: string): Promise<T | null> {
    const redis = this.getClient();
    if (!redis) {
      logger.debug('Cache miss: Redis unavailable', { key });
      return null;
    }

    try {
      const value = await redis.get(this.buildKey(key));
      if (!value) {
        logger.debug('Cache miss', { key });
        return null;
      }

      logger.debug('Cache hit', { key });
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', error, { key });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   * @param key - Cache key (will be prefixed automatically)
   * @param value - Value to cache (will be JSON serialized)
   * @param ttl - Time to live in seconds (default: 600s = 10 minutes)
   * @returns true if successful, false otherwise
   */
  async set<T>(key: string, value: T, ttl: number = this.defaultTTL): Promise<boolean> {
    const redis = this.getClient();
    if (!redis) {
      logger.debug('Cache set skipped: Redis unavailable', { key });
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await redis.setex(this.buildKey(key), ttl, serialized);
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', error, { key });
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param key - Cache key (will be prefixed automatically)
   * @returns true if deleted, false otherwise
   */
  async delete(key: string): Promise<boolean> {
    const redis = this.getClient();
    if (!redis) {
      logger.debug('Cache delete skipped: Redis unavailable', { key });
      return false;
    }

    try {
      const result = await redis.del(this.buildKey(key));
      logger.debug('Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Cache delete error', error, { key });
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param key - Cache key (will be prefixed automatically)
   * @returns true if exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    const redis = this.getClient();
    if (!redis) {
      return false;
    }

    try {
      const result = await redis.exists(this.buildKey(key));
      return result > 0;
    } catch (error) {
      logger.error('Cache exists error', error, { key });
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   * @param key - Cache key (will be prefixed automatically)
   * @returns TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  async ttl(key: string): Promise<number> {
    const redis = this.getClient();
    if (!redis) {
      return -2;
    }

    try {
      return await redis.ttl(this.buildKey(key));
    } catch (error) {
      logger.error('Cache TTL error', error, { key });
      return -2;
    }
  }

  /**
   * Increment a counter in cache (useful for rate limiting)
   * @param key - Cache key (will be prefixed automatically)
   * @param ttl - Time to live in seconds (only applied on first increment)
   * @returns New value after increment, or null on error
   */
  async increment(key: string, ttl?: number): Promise<number | null> {
    const redis = this.getClient();
    if (!redis) {
      logger.debug('Cache increment skipped: Redis unavailable', { key });
      return null;
    }

    try {
      const fullKey = this.buildKey(key);
      const newValue = await redis.incr(fullKey);
      
      // Set TTL only if this is the first increment (newValue === 1)
      if (newValue === 1 && ttl) {
        await redis.expire(fullKey, ttl);
      }

      logger.debug('Cache increment', { key, newValue, ttl });
      return newValue;
    } catch (error) {
      logger.error('Cache increment error', error, { key });
      return null;
    }
  }

  /**
   * Clear all keys with the namespace prefix (use with caution!)
   * @returns Number of keys deleted
   */
  async clearAll(): Promise<number> {
    const redis = this.getClient();
    if (!redis) {
      logger.debug('Cache clearAll skipped: Redis unavailable');
      return 0;
    }

    try {
      const keys = await redis.keys(`${this.prefix}*`);
      if (keys.length === 0) {
        return 0;
      }

      const result = await redis.del(...keys);
      logger.info('Cache cleared', { keysDeleted: result });
      return result;
    } catch (error) {
      logger.error('Cache clearAll error', error);
      return 0;
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();
