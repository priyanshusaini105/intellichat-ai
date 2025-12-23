import type { Request, Response, NextFunction } from 'express';
import { createRateLimiter, ipRateLimiter, sessionRateLimiter } from '../rate-limiter.js';
import { cacheService } from '../../../services/cache.service.js';
import { RateLimitError } from '../../errors/custom-errors.js';

// Mock cacheService
jest.mock('../../../services/cache.service.js', () => ({
  cacheService: {
    increment: jest.fn(),
  },
}));

// Mock logger to avoid console spam
jest.mock('../../utils/logger.js', () => ({
  logger: {
    warn: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Rate Limiter Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '192.168.1.100',
      socket: {
        remoteAddress: '192.168.1.100',
      } as any,
      headers: {},
      body: {},
    };

    mockRes = {
      setHeader: jest.fn(),
    };

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe('createRateLimiter()', () => {
    it('should allow request when under rate limit', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:ip:test', // Use 'ip' in prefix to trigger IP detection
      });

      jest.mocked(cacheService.increment).mockResolvedValue(5); // 5 requests

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:ip:test:192.168.1.100', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 5);
      expect(mockNext).toHaveBeenCalledWith(); // Called without error
    });

    it('should block request when rate limit exceeded', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:test',
        message: 'Too many requests!',
      });

      jest.mocked(cacheService.increment).mockResolvedValue(11); // Over limit

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0]?.[0] as RateLimitError;
      expect(error.message).toBe('Too many requests!');
      expect(error.statusCode).toBe(429);
    });

    it('should allow request when Redis is unavailable (graceful degradation)', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:test',
      });

      jest.mocked(cacheService.increment).mockResolvedValue(null); // Redis unavailable

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(); // Allowed
    });

    it('should use X-Forwarded-For header if present', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:ip',
      });

      mockReq.headers = { 'x-forwarded-for': '10.0.0.5, 192.168.1.1' };
      jest.mocked(cacheService.increment).mockResolvedValue(3);

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:ip:10.0.0.5', 60);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use sessionId from request body for session rate limiter', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:session',
      });

      mockReq.body = { sessionId: 'abc-123-def-456' };
      jest.mocked(cacheService.increment).mockResolvedValue(2);

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:session:abc-123-def-456', 60);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should use "anonymous" when sessionId is not provided', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 10,
        keyPrefix: 'rate-limit:session',
      });

      mockReq.body = {}; // No sessionId
      jest.mocked(cacheService.increment).mockResolvedValue(1);

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:session:anonymous', 60);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should set X-RateLimit-Remaining to 0 when limit exceeded', async () => {
      const rateLimiter = createRateLimiter({
        windowSeconds: 60,
        maxRequests: 5,
        keyPrefix: 'rate-limit:test',
      });

      jest.mocked(cacheService.increment).mockResolvedValue(8); // Over limit

      await rateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 0); // Max(0, 5-8) = 0
    });
  });

  describe('ipRateLimiter', () => {
    it('should have correct configuration', async () => {
      jest.mocked(cacheService.increment).mockResolvedValue(1);

      await ipRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:ip:192.168.1.100', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 20);
    });

    it('should block after 20 requests in 60 seconds', async () => {
      jest.mocked(cacheService.increment).mockResolvedValue(21);

      await ipRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0]?.[0] as RateLimitError;
      expect(error.message).toContain('Too many requests from this IP');
    });
  });

  describe('sessionRateLimiter', () => {
    it('should have correct configuration', async () => {
      mockReq.body = { sessionId: 'test-session-123' };
      jest.mocked(cacheService.increment).mockResolvedValue(5);

      await sessionRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(cacheService.increment).toHaveBeenCalledWith('rate-limit:session:test-session-123', 60);
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
    });

    it('should block after 10 messages in 60 seconds', async () => {
      mockReq.body = { sessionId: 'test-session-123' };
      jest.mocked(cacheService.increment).mockResolvedValue(11);

      await sessionRateLimiter(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(RateLimitError));
      const error = (mockNext as jest.Mock).mock.calls[0]?.[0] as RateLimitError;
      expect(error.message).toContain('Too many messages');
    });
  });
});
