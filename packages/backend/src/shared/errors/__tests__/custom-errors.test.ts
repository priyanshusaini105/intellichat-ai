import { describe, it, expect } from '@jest/globals';
import {
  AppError,
  ValidationError,
  LLMTimeoutError,
  LLMRateLimitError,
  LLMServiceError,
  DatabaseError,
  ConversationNotFoundError,
} from '../custom-errors.js';

describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create operational error', () => {
      const error = new AppError('Test error', 400);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
    });

    it('should default to 500 status code', () => {
      const error = new AppError('Test');
      expect(error.statusCode).toBe(500);
    });

    it('should allow non-operational errors', () => {
      const error = new AppError('Programming error', 500, false);
      expect(error.isOperational).toBe(false);
    });

    it('should have correct name', () => {
      const error = new AppError('Test');
      expect(error.name).toBe('AppError');
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    it('should set 400 status code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    it('should be operational', () => {
      const error = new ValidationError('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('should preserve error message', () => {
      const error = new ValidationError('Message cannot be empty');
      expect(error.message).toBe('Message cannot be empty');
    });

    it('should be instance of Error', () => {
      const error = new ValidationError('Test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('LLMTimeoutError', () => {
    it('should set 503 status code', () => {
      const error = new LLMTimeoutError('Timeout');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('LLMTimeoutError');
    });

    it('should use default message if none provided', () => {
      const error = new LLMTimeoutError();
      expect(error.message).toBe('LLM request timed out');
    });

    it('should accept custom message', () => {
      const error = new LLMTimeoutError('Custom timeout message');
      expect(error.message).toBe('Custom timeout message');
    });

    it('should be operational', () => {
      const error = new LLMTimeoutError();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('LLMRateLimitError', () => {
    it('should set 429 status code', () => {
      const error = new LLMRateLimitError('Rate limited');
      expect(error.statusCode).toBe(429);
      expect(error.name).toBe('LLMRateLimitError');
    });

    it('should support retry-after seconds', () => {
      const error = new LLMRateLimitError('Rate limited', 60);
      expect(error.retryAfter).toBe(60);
    });

    it('should work without retry-after', () => {
      const error = new LLMRateLimitError('Rate limited');
      expect(error.retryAfter).toBeUndefined();
    });

    it('should use default message if none provided', () => {
      const error = new LLMRateLimitError();
      expect(error.message).toBe('Rate limit exceeded');
    });

    it('should be operational', () => {
      const error = new LLMRateLimitError();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('LLMServiceError', () => {
    it('should set 503 status code', () => {
      const error = new LLMServiceError('Service error');
      expect(error.statusCode).toBe(503);
      expect(error.name).toBe('LLMServiceError');
    });

    it('should store original error', () => {
      const originalError = new Error('Network error');
      const error = new LLMServiceError('Service failed', originalError);
      expect(error.originalError).toBe(originalError);
    });

    it('should work without original error', () => {
      const error = new LLMServiceError('Service failed');
      expect(error.originalError).toBeUndefined();
    });

    it('should use default message if none provided', () => {
      const error = new LLMServiceError();
      expect(error.message).toBe('LLM service error');
    });

    it('should be operational', () => {
      const error = new LLMServiceError();
      expect(error.isOperational).toBe(true);
    });

    it('should be instance of Error', () => {
      const error = new LLMServiceError('Test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('DatabaseError', () => {
    it('should set 500 status code', () => {
      const error = new DatabaseError('DB failed');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it('should store original error', () => {
      const originalError = new Error('Connection timeout');
      const error = new DatabaseError('DB connection failed', originalError);
      expect(error.originalError).toBe(originalError);
    });

    it('should work without original error', () => {
      const error = new DatabaseError('DB failed');
      expect(error.originalError).toBeUndefined();
    });

    it('should have correct name', () => {
      const error = new DatabaseError('DB failed');
      expect(error.name).toBe('DatabaseError');
    });
  });

  describe('ConversationNotFoundError', () => {
    it('should set 404 status code', () => {
      const error = new ConversationNotFoundError('session-123');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('ConversationNotFoundError');
    });

    it('should include sessionId in message', () => {
      const error = new ConversationNotFoundError('session-abc-123');
      expect(error.message).toContain('session-abc-123');
      expect(error.message).toContain('Conversation not found');
    });

    it('should be operational', () => {
      const error = new ConversationNotFoundError('session-123');
      expect(error.isOperational).toBe(true);
    });
  });

  describe('Error Inheritance', () => {
    it('should all extend AppError', () => {
      expect(new ValidationError('test')).toBeInstanceOf(AppError);
      expect(new LLMTimeoutError()).toBeInstanceOf(AppError);
      expect(new LLMRateLimitError()).toBeInstanceOf(AppError);
      expect(new LLMServiceError()).toBeInstanceOf(AppError);
      expect(new DatabaseError('test')).toBeInstanceOf(AppError);
      expect(new ConversationNotFoundError('test')).toBeInstanceOf(AppError);
    });

    it('should all extend Error', () => {
      expect(new AppError('test')).toBeInstanceOf(Error);
      expect(new ValidationError('test')).toBeInstanceOf(Error);
      expect(new LLMTimeoutError()).toBeInstanceOf(Error);
    });

    it('should preserve instanceof checks', () => {
      const error = new ValidationError('test');
      expect(error instanceof ValidationError).toBe(true);
      expect(error instanceof AppError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });
});
