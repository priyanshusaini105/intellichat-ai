import type { Request, Response, NextFunction } from 'express';
import {
  AppError,
  ValidationError,
  LLMTimeoutError,
  LLMRateLimitError,
  LLMServiceError,
  DatabaseError,
  ConversationNotFoundError,
} from '../errors/custom-errors.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '../../config/constants.js';

/**
 * Centralized error handling middleware
 * Handles operational errors with user-friendly messages
 * Hides technical details from users for security
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log all errors server-side
  console.error('Error handled', {
    error,
    path: req.path,
    method: req.method,
    body: req.body,
    ip: req.ip,
  });

  // Handle operational errors
  if (error instanceof AppError && error.isOperational) {
    handleOperationalError(error, res);
    return;
  }

  // Handle programming errors (unexpected)
  handleProgrammingError(error, res);
}

/**
 * Handle operational errors (expected errors that should be surfaced to users)
 */
function handleOperationalError(error: AppError, res: Response): void {
  // Validation errors
  if (error instanceof ValidationError) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Conversation not found
  if (error instanceof ConversationNotFoundError) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      success: false,
      error: ERROR_MESSAGES.CONVERSATION_NOT_FOUND,
    });
    return;
  }

  // LLM timeout
  if (error instanceof LLMTimeoutError) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Rate limiting
  if (error instanceof LLMRateLimitError) {
    if (error.retryAfter) {
      res.set('Retry-After', String(error.retryAfter));
    }
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // LLM service errors
  if (error instanceof LLMServiceError) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      error: ERROR_MESSAGES.LLM_UNAVAILABLE,
    });
    return;
  }

  // Database errors
  if (error instanceof DatabaseError) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: ERROR_MESSAGES.DATABASE_ERROR,
    });
    return;
  }

  // Generic operational error
  res.status(error.statusCode).json({
    success: false,
    error: error.message,
  });
}

/**
 * Handle programming errors (unexpected errors - bugs)
 * Never expose technical details to users
 */
function handleProgrammingError(error: Error, res: Response): void {
  // Never expose technical details to users
  res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: ERROR_MESSAGES.INTERNAL_ERROR,
  });

  // Log full stack trace for debugging
  console.error('Programming error (unexpected)', {
    error,
    stack: error.stack,
  });
}

