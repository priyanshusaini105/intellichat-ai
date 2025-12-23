/**
 * Custom error class for validation failures
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Custom error class for LLM service failures
 */
export class LLMServiceError extends Error {
  public originalError?: Error | undefined;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'LLMServiceError';
    if (originalError) {
      this.originalError = originalError;
    }
    Object.setPrototypeOf(this, LLMServiceError.prototype);
  }
}
