import { Redis } from 'ioredis';
import { CacheService } from '../cache.service.js';
import * as redisConfig from '../../config/redis.js';

// Mock Redis
jest.mock('../../config/redis.js', () => ({
  getRedis: jest.fn(),
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: Partial<Redis>;

  beforeEach(() => {
    // Create mock Redis client
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      incr: jest.fn(),
      expire: jest.fn(),
      keys: jest.fn(),
    };

    // Default: Redis is available
    jest.mocked(redisConfig.getRedis).mockReturnValue(mockRedis as Redis);

    cacheService = new CacheService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get()', () => {
    it('should return parsed value from cache on hit', async () => {
      const mockData = { id: '123', name: 'Test' };
      jest.mocked(mockRedis.get).mockResolvedValue(JSON.stringify(mockData));

      const result = await cacheService.get<typeof mockData>('conversation:123');

      expect(result).toEqual(mockData);
      expect(mockRedis.get).toHaveBeenCalledWith('spur:conversation:123');
    });

    it('should return null on cache miss', async () => {
      jest.mocked(mockRedis.get).mockResolvedValue(null);

      const result = await cacheService.get('conversation:nonexistent');

      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('spur:conversation:nonexistent');
    });

    it('should return null when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.get('conversation:123');

      expect(result).toBeNull();
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should return null on JSON parse error', async () => {
      jest.mocked(mockRedis.get).mockResolvedValue('invalid json{');

      const result = await cacheService.get('conversation:123');

      expect(result).toBeNull();
    });

    it('should return null on Redis error', async () => {
      jest.mocked(mockRedis.get).mockRejectedValue(new Error('Redis connection lost'));

      const result = await cacheService.get('conversation:123');

      expect(result).toBeNull();
    });
  });

  describe('set()', () => {
    it('should set value in cache with default TTL', async () => {
      const mockData = { id: '123', name: 'Test' };
      jest.mocked(mockRedis.setex).mockResolvedValue('OK');

      const result = await cacheService.set('conversation:123', mockData);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'spur:conversation:123',
        600, // default TTL
        JSON.stringify(mockData),
      );
    });

    it('should set value in cache with custom TTL', async () => {
      const mockData = { id: '123', name: 'Test' };
      jest.mocked(mockRedis.setex).mockResolvedValue('OK');

      const result = await cacheService.set('conversation:123', mockData, 300);

      expect(result).toBe(true);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'spur:conversation:123',
        300,
        JSON.stringify(mockData),
      );
    });

    it('should return false when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.set('conversation:123', { id: '123' });

      expect(result).toBe(false);
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should return false on Redis error', async () => {
      jest.mocked(mockRedis.setex).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.set('conversation:123', { id: '123' });

      expect(result).toBe(false);
    });
  });

  describe('delete()', () => {
    it('should delete key from cache successfully', async () => {
      jest.mocked(mockRedis.del).mockResolvedValue(1); // 1 key deleted

      const result = await cacheService.delete('conversation:123');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('spur:conversation:123');
    });

    it('should return false when key does not exist', async () => {
      jest.mocked(mockRedis.del).mockResolvedValue(0); // 0 keys deleted

      const result = await cacheService.delete('conversation:nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.delete('conversation:123');

      expect(result).toBe(false);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return false on Redis error', async () => {
      jest.mocked(mockRedis.del).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.delete('conversation:123');

      expect(result).toBe(false);
    });
  });

  describe('exists()', () => {
    it('should return true when key exists', async () => {
      jest.mocked(mockRedis.exists).mockResolvedValue(1);

      const result = await cacheService.exists('conversation:123');

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith('spur:conversation:123');
    });

    it('should return false when key does not exist', async () => {
      jest.mocked(mockRedis.exists).mockResolvedValue(0);

      const result = await cacheService.exists('conversation:nonexistent');

      expect(result).toBe(false);
    });

    it('should return false when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.exists('conversation:123');

      expect(result).toBe(false);
      expect(mockRedis.exists).not.toHaveBeenCalled();
    });
  });

  describe('ttl()', () => {
    it('should return remaining TTL for key', async () => {
      jest.mocked(mockRedis.ttl).mockResolvedValue(300); // 5 minutes

      const result = await cacheService.ttl('conversation:123');

      expect(result).toBe(300);
      expect(mockRedis.ttl).toHaveBeenCalledWith('spur:conversation:123');
    });

    it('should return -1 when key has no TTL', async () => {
      jest.mocked(mockRedis.ttl).mockResolvedValue(-1);

      const result = await cacheService.ttl('conversation:123');

      expect(result).toBe(-1);
    });

    it('should return -2 when key does not exist', async () => {
      jest.mocked(mockRedis.ttl).mockResolvedValue(-2);

      const result = await cacheService.ttl('conversation:nonexistent');

      expect(result).toBe(-2);
    });

    it('should return -2 when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.ttl('conversation:123');

      expect(result).toBe(-2);
      expect(mockRedis.ttl).not.toHaveBeenCalled();
    });
  });

  describe('increment()', () => {
    it('should increment counter without TTL', async () => {
      jest.mocked(mockRedis.incr).mockResolvedValue(5);

      const result = await cacheService.increment('rate-limit:ip:192.168.1.1');

      expect(result).toBe(5);
      expect(mockRedis.incr).toHaveBeenCalledWith('spur:rate-limit:ip:192.168.1.1');
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should increment counter and set TTL on first increment', async () => {
      jest.mocked(mockRedis.incr).mockResolvedValue(1); // First increment
      jest.mocked(mockRedis.expire).mockResolvedValue(1);

      const result = await cacheService.increment('rate-limit:ip:192.168.1.1', 60);

      expect(result).toBe(1);
      expect(mockRedis.incr).toHaveBeenCalledWith('spur:rate-limit:ip:192.168.1.1');
      expect(mockRedis.expire).toHaveBeenCalledWith('spur:rate-limit:ip:192.168.1.1', 60);
    });

    it('should not set TTL on subsequent increments', async () => {
      jest.mocked(mockRedis.incr).mockResolvedValue(3); // Not first increment

      const result = await cacheService.increment('rate-limit:ip:192.168.1.1', 60);

      expect(result).toBe(3);
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    it('should return null when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.increment('rate-limit:ip:192.168.1.1');

      expect(result).toBeNull();
      expect(mockRedis.incr).not.toHaveBeenCalled();
    });

    it('should return null on Redis error', async () => {
      jest.mocked(mockRedis.incr).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.increment('rate-limit:ip:192.168.1.1');

      expect(result).toBeNull();
    });
  });

  describe('clearAll()', () => {
    it('should clear all keys with namespace prefix', async () => {
      jest.mocked(mockRedis.keys).mockResolvedValue([
        'spur:conversation:123',
        'spur:conversation:456',
        'spur:rate-limit:ip:192.168.1.1',
      ]);
      jest.mocked(mockRedis.del).mockResolvedValue(3);

      const result = await cacheService.clearAll();

      expect(result).toBe(3);
      expect(mockRedis.keys).toHaveBeenCalledWith('spur:*');
      expect(mockRedis.del).toHaveBeenCalledWith(
        'spur:conversation:123',
        'spur:conversation:456',
        'spur:rate-limit:ip:192.168.1.1',
      );
    });

    it('should return 0 when no keys found', async () => {
      jest.mocked(mockRedis.keys).mockResolvedValue([]);

      const result = await cacheService.clearAll();

      expect(result).toBe(0);
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should return 0 when Redis is unavailable', async () => {
      jest.mocked(redisConfig.getRedis).mockReturnValue(null);

      const result = await cacheService.clearAll();

      expect(result).toBe(0);
      expect(mockRedis.keys).not.toHaveBeenCalled();
    });

    it('should return 0 on Redis error', async () => {
      jest.mocked(mockRedis.keys).mockRejectedValue(new Error('Redis error'));

      const result = await cacheService.clearAll();

      expect(result).toBe(0);
    });
  });
});
