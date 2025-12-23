import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../error-handler.js';
import {
  ValidationError,
  LLMServiceError,
  LLMTimeoutError,
  LLMRateLimitError,
  DatabaseError,
  ConversationNotFoundError,
} from '../../errors/custom-errors.js';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    mockRequest = {
      path: '/api/test',
      method: 'POST',
      body: { test: 'data' },
      ip: '127.0.0.1',
    };
    mockResponse = {
      status: jest.fn<any>().mockReturnThis() as any,
      json: jest.fn<any>().mockReturnThis() as any,
      set: jest.fn<any>().mockReturnThis() as any,
    };
    mockNext = jest.fn() as any;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Operational Errors', () => {
    it('should return 400 for ValidationError', () => {
      const error = new ValidationError('Invalid input');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
      });
    });

    it('should return 404 for ConversationNotFoundError', () => {
      const error = new ConversationNotFoundError('session-123');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Conversation not found',
      });
    });

    it('should return 503 for LLMTimeoutError', () => {
      const error = new LLMTimeoutError('Request timed out');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timed out',
      });
    });

    it('should return 429 for LLMRateLimitError', () => {
      const error = new LLMRateLimitError('Rate limited');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(429);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Rate limited',
      });
    });

    it('should set Retry-After header for LLMRateLimitError with retryAfter', () => {
      const error = new LLMRateLimitError('Rate limited', 60);

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.set).toHaveBeenCalledWith('Retry-After', '60');
      expect(mockResponse.status).toHaveBeenCalledWith(429);
    });

    it('should return 503 for LLMServiceError', () => {
      const error = new LLMServiceError('Service unavailable');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(503);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'AI service is temporarily unavailable. Please try again later.',
      });
    });

    it('should return 500 for DatabaseError', () => {
      const error = new DatabaseError('DB connection failed');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'A temporary issue occurred. Please try again.',
      });
    });
  });

  describe('Programming Errors', () => {
    it('should return 500 for unknown errors', () => {
      const error = new Error('Unexpected error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Something went wrong. Please try again.',
      });
    });

    it('should not expose stack traces to users', () => {
      const error = new Error('Internal bug with stack trace');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
      expect(jsonCall.error).not.toContain('stack');
      expect(jsonCall.error).not.toContain('Internal bug');
    });

    it('should not expose technical details', () => {
      const error = new Error('Cannot read property of undefined');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
      expect(jsonCall.error).toBe('Something went wrong. Please try again.');
    });
  });

  describe('Logging', () => {
    it('should log all errors', () => {
      const error = new ValidationError('Test error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error handled',
        expect.objectContaining({
          error,
          path: '/api/test',
          method: 'POST',
        })
      );
    });

    it('should log programming errors with stack trace', () => {
      const error = new Error('Programming error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Programming error (unexpected)',
        expect.objectContaining({
          error,
          stack: expect.any(String),
        })
      );
    });
  });

  describe('Error Response Format', () => {
    it('should always include success: false', () => {
      const error = new ValidationError('Test');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
      expect(jsonCall.success).toBe(false);
    });

    it('should always include error message', () => {
      const error = new ValidationError('Test message');

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      const jsonCall = (mockResponse.json as jest.Mock).mock.calls[0]?.[0];
      expect(jsonCall.error).toBeDefined();
      expect(typeof jsonCall.error).toBe('string');
    });
  });
});

