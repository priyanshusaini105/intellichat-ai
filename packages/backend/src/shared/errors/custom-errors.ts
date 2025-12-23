/**
 * Base class for all application errors
 * Distinguishes operational errors (expected, handle gracefully) from programming errors (bugs)
 */
export class AppError extends Error {
  public readonly isOperational: boolean;

  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Custom error class for validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Custom error class for LLM timeout errors
 */
export class LLMTimeoutError extends AppError {
  constructor(message: string = 'LLM request timed out') {
    super(message, 503);
    this.name = 'LLMTimeoutError';
    Object.setPrototypeOf(this, LLMTimeoutError.prototype);
  }
}

/**
 * Custom error class for LLM rate limit errors
 */
export class LLMRateLimitError extends AppError {
  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number
  ) {
    super(message, 429);
    this.name = 'LLMRateLimitError';
    Object.setPrototypeOf(this, LLMRateLimitError.prototype);
  }
}

/**
 * Custom error class for LLM service failures
 */
export class LLMServiceError extends AppError {
  public originalError?: Error | undefined;

  constructor(message: string = 'LLM service error', originalError?: Error) {
    super(message, 503);
    this.name = 'LLMServiceError';
    if (originalError) {
      this.originalError = originalError;
    }
    Object.setPrototypeOf(this, LLMServiceError.prototype);
  }
}

/**
 * Custom error class for database failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, public readonly originalError?: Error) {
    super(message, 500);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Custom error class for conversation not found errors
 */
export class ConversationNotFoundError extends AppError {
  constructor(sessionId: string) {
    super(`Conversation not found: ${sessionId}`, 404);
    this.name = 'ConversationNotFoundError';
    Object.setPrototypeOf(this, ConversationNotFoundError.prototype);
  }
}

/**
 * Custom error class for general rate limit errors (IP, session-based)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}
