import type { Request, Response, NextFunction } from 'express';
import { ValidationError, LLMServiceError } from '../errors/custom-errors.js';

/**
 * Centralized error handling middleware
 */
export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ValidationError) {
    console.error('ValidationError:', error.message);
    res.status(400).json({
      error: error.message,
    });
    return;
  }

  if (error instanceof LLMServiceError) {
    console.error('LLMServiceError:', error.message, 'Original:', error.originalError);
    res.status(500).json({
      error: 'Failed to process request',
    });
    return;
  }

  // Unknown errors
  console.error('Unknown error:', error);
  res.status(500).json({
    error: 'Internal server error',
  });
}
