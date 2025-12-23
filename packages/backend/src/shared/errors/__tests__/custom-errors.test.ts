import { describe, it, expect } from '@jest/globals';
import { ValidationError, LLMServiceError } from '../custom-errors.js';

describe('Custom Errors', () => {
  describe('ValidationError', () => {
    it('should create error with correct message', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.message).toBe('Invalid input');
    });

    it('should have correct name property', () => {
      const error = new ValidationError('Test error');
      
      expect(error.name).toBe('ValidationError');
    });

    it('should be instance of Error', () => {
      const error = new ValidationError('Test');
      
      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of ValidationError', () => {
      const error = new ValidationError('Test');
      
      expect(error instanceof ValidationError).toBe(true);
    });
  });

  describe('LLMServiceError', () => {
    it('should create error with correct message', () => {
      const error = new LLMServiceError('LLM failed');
      
      expect(error.message).toBe('LLM failed');
    });

    it('should have correct name property', () => {
      const error = new LLMServiceError('Test error');
      
      expect(error.name).toBe('LLMServiceError');
    });

    it('should be instance of Error', () => {
      const error = new LLMServiceError('Test');
      
      expect(error instanceof Error).toBe(true);
    });

    it('should be instance of LLMServiceError', () => {
      const error = new LLMServiceError('Test');
      
      expect(error instanceof LLMServiceError).toBe(true);
    });

    it('should store original error when provided', () => {
      const originalError = new Error('Original error');
      const error = new LLMServiceError('Wrapped error', originalError);
      
      expect(error.originalError).toBe(originalError);
    });

    it('should have undefined originalError when not provided', () => {
      const error = new LLMServiceError('Simple error');
      
      expect(error.originalError).toBeUndefined();
    });
  });
});
