import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from '../error-handler.js';
import { ValidationError, LLMServiceError } from '../../errors/custom-errors.js';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn<any>().mockReturnThis() as any,
      json: jest.fn<any>().mockReturnThis() as any,
    };
    mockNext = jest.fn() as any;
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 400 for ValidationError', () => {
    const error = new ValidationError('Invalid input');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Invalid input',
    });
  });

  it('should return 500 for LLMServiceError', () => {
    const error = new LLMServiceError('LLM service failed');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Failed to process request',
    });
  });

  it('should return 500 for unknown errors', () => {
    const error = new Error('Unknown error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
  });

  it('should log ValidationError to console', () => {
    const error = new ValidationError('Invalid input');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleErrorSpy).toHaveBeenCalledWith('ValidationError:', error.message);
  });

  it('should log LLMServiceError with original error', () => {
    const originalError = new Error('OpenAI timeout');
    const error = new LLMServiceError('Failed to generate reply', originalError);

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'LLMServiceError:',
      error.message,
      'Original:',
      originalError
    );
  });

  it('should log unknown errors', () => {
    const error = new Error('Unknown error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Unknown error:', error);
  });

  it('should not expose internal error details for LLMServiceError', () => {
    const error = new LLMServiceError('API key invalid');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Failed to process request',
    });
    expect(mockResponse.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: 'API key invalid' })
    );
  });

  it('should not expose internal error details for unknown errors', () => {
    const error = new Error('Database connection failed');

    errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
    expect(mockResponse.json).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Database connection failed' })
    );
  });
});
