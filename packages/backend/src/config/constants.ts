/**
 * Application-wide constants
 * Centralized configuration for validation, LLM settings, error messages, and HTTP status codes
 */

export const VALIDATION = {
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 2000,
  MAX_CONTEXT_MESSAGES: 5,
} as const;

export const LLM_CONFIG = {
  TIMEOUT_MS: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000, // Initial delay
  MAX_RETRY_DELAY_MS: 10000, // Max backoff delay
} as const;

export const ERROR_MESSAGES = {
  // Client Errors (4xx)
  EMPTY_MESSAGE: 'Message cannot be empty',
  MESSAGE_TOO_SHORT: 'Message is too short (minimum 1 character)',
  MESSAGE_TOO_LONG: 'Message is too long (maximum 2000 characters)',
  INVALID_SESSION_ID: 'Invalid session ID format',
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  
  // Server Errors (5xx)
  LLM_TIMEOUT: 'The AI is taking longer than usual. Please try again.',
  LLM_RATE_LIMIT: 'Our AI is experiencing high demand. Please wait a moment and try again.',
  LLM_UNAVAILABLE: 'AI service is temporarily unavailable. Please try again later.',
  LLM_GENERIC_ERROR: 'Failed to generate response. Please try again.',
  DATABASE_ERROR: 'A temporary issue occurred. Please try again.',
  INTERNAL_ERROR: 'Something went wrong. Please try again.',
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;
