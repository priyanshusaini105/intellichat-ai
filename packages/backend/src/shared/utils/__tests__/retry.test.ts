import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { retryWithBackoff, sleep, isLLMErrorRetryable } from '../retry.js';
import { ValidationError } from '../../errors/custom-errors.js';

describe('Retry Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sleep', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await sleep(100);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small margin
      expect(elapsed).toBeLessThan(150); // But not too much over
    });

    it('should work with zero delay', async () => {
      const start = Date.now();
      await sleep(0);
      const elapsed = Date.now() - start;
      
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn<() => Promise<string>>().mockResolvedValue('success');
      const result = await retryWithBackoff(fn, 3);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const fn = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 3, 10); // Fast retry for test
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const fn = jest.fn<() => Promise<string>>().mockRejectedValue(new Error('Always fails'));
      
      await expect(retryWithBackoff(fn, 3, 10))
        .rejects
        .toThrow('Always fails');
      
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const fn = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryWithBackoff(fn, 3, 100); // 100ms base delay
      const elapsed = Date.now() - startTime;
      
      // First retry: 100ms, Second retry: 200ms
      // Total should be >= 300ms
      expect(elapsed).toBeGreaterThanOrEqual(295);
    });

    it('should cap backoff at max delay', async () => {
      const fn = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockRejectedValueOnce(new Error('Fail 3'))
        .mockResolvedValue('success');
      
      // With base 1000ms and max 2000ms, third retry should be capped at 2000ms
      const startTime = Date.now();
      await retryWithBackoff(fn, 4, 1000, () => true, 2000);
      const elapsed = Date.now() - startTime;
      
      // 1st: 1000ms, 2nd: 2000ms (capped), 3rd: 2000ms (capped)
      // Total should be ~5000ms, not 7000ms (1000 + 2000 + 4000)
      expect(elapsed).toBeLessThan(5500);
    });

    it('should not retry on non-retryable errors', async () => {
      const validationError = new ValidationError('Bad input');
      const fn = jest.fn<() => Promise<string>>().mockRejectedValue(validationError);
      
      const isRetryable = (error: Error) => !(error instanceof ValidationError);
      
      await expect(retryWithBackoff(fn, 3, 10, isRetryable))
        .rejects
        .toThrow('Bad input');
      
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('should handle single retry', async () => {
      const fn = jest
        .fn<() => Promise<string>>()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValue('success');
      
      const result = await retryWithBackoff(fn, 2, 10);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should work with custom isRetryable function', async () => {
      const fn = jest
        .fn<() => Promise<string>>()
        .mockRejectedValue(new Error('Temporary error'));
      
      const isRetryable = (error: Error) => error.message.includes('Temporary');
      
      await expect(retryWithBackoff(fn, 2, 10, isRetryable))
        .rejects
        .toThrow('Temporary error');
      
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('isLLMErrorRetryable', () => {
    it('should not retry on invalid errors', () => {
      const error = new Error('Invalid API key');
      expect(isLLMErrorRetryable(error)).toBe(false);
    });

    it('should not retry on unauthorized errors', () => {
      const error = new Error('Unauthorized access');
      expect(isLLMErrorRetryable(error)).toBe(false);
    });

    it('should not retry on forbidden errors', () => {
      const error = new Error('Forbidden resource');
      expect(isLLMErrorRetryable(error)).toBe(false);
    });

    it('should not retry on not found errors', () => {
      const error = new Error('Resource not found');
      expect(isLLMErrorRetryable(error)).toBe(false);
    });

    it('should retry on server errors', () => {
      const error = new Error('Internal server error');
      expect(isLLMErrorRetryable(error)).toBe(true);
    });

    it('should retry on timeout errors', () => {
      const error = new Error('Request timeout');
      expect(isLLMErrorRetryable(error)).toBe(true);
    });

    it('should retry on service unavailable', () => {
      const error = new Error('Service unavailable');
      expect(isLLMErrorRetryable(error)).toBe(true);
    });

    it('should retry on generic network errors', () => {
      const error = new Error('Network connection failed');
      expect(isLLMErrorRetryable(error)).toBe(true);
    });

    it('should be case-insensitive', () => {
      const error1 = new Error('INVALID API KEY');
      const error2 = new Error('Invalid API Key');
      
      expect(isLLMErrorRetryable(error1)).toBe(false);
      expect(isLLMErrorRetryable(error2)).toBe(false);
    });
  });
});
