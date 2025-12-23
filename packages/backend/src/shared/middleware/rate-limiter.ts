import type { Request, Response, NextFunction } from 'express';
import { cacheService } from '../../services/cache.service.js';
import { RateLimitError } from '../errors/custom-errors.js';
import { logger } from '../utils/logger.js';

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  /**
   * Time window in seconds
   */
  windowSeconds: number;
  /**
   * Maximum requests allowed in the window
   */
  maxRequests: number;
  /**
   * Prefix for cache keys
   */
  keyPrefix: string;
  /**
   * Custom error message
   */
  message?: string;
}

/**
 * Get client IP address from request
 * Handles X-Forwarded-For header for reverse proxies
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Generic rate limiter middleware factory
 * Uses Redis INCR with EXPIRE for efficient sliding window rate limiting
 */
export function createRateLimiter(config: RateLimiterConfig) {
  const { windowSeconds, maxRequests, keyPrefix, message } = config;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Determine rate limit key based on prefix
      let identifier: string;
      if (keyPrefix.includes('ip')) {
        identifier = getClientIP(req);
      } else if (keyPrefix.includes('session')) {
        identifier = req.body.sessionId || 'anonymous';
      } else {
        identifier = 'global';
      }

      const key = `${keyPrefix}:${identifier}`;

      // Increment request count (sets TTL on first request)
      const requestCount = await cacheService.increment(key, windowSeconds);

      // If Redis is unavailable, allow the request (graceful degradation)
      if (requestCount === null) {
        logger.warn('Rate limiting unavailable: Redis not connected', { key });
        return next();
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
      res.setHeader('X-RateLimit-Reset', Date.now() + windowSeconds * 1000);

      // Check if rate limit exceeded
      if (requestCount > maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          requestCount,
          maxRequests,
          windowSeconds,
        });

        throw new RateLimitError(
          message || `Too many requests. Please try again in ${windowSeconds} seconds.`,
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * IP-based rate limiter: 20 requests per minute
 * Applies to all endpoints to prevent abuse from a single IP
 */
export const ipRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 20,
  keyPrefix: 'rate-limit:ip',
  message: 'Too many requests from this IP. Please wait a moment and try again.',
});

/**
 * Session-based rate limiter: 10 messages per minute per session
 * Applies to chat message endpoints to prevent spam in a single conversation
 */
export const sessionRateLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 10,
  keyPrefix: 'rate-limit:session',
  message: 'Too many messages. Please wait a moment before sending more.',
});
