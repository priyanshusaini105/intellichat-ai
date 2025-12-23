/**
 * Sleep for a specified duration
 * @param ms - Milliseconds to sleep
 */
export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum retry attempts
 * @param baseDelayMs - Base delay in milliseconds
 * @param isRetryable - Function to determine if error is retryable
 * @param maxDelayMs - Maximum delay cap for exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number,
  baseDelayMs: number = 1000,
  isRetryable: (error: Error) => boolean = () => true,
  maxDelayMs: number = 10000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryable(lastError)) {
        throw lastError;
      }

      // Don't wait after last attempt
      if (attempt < maxRetries - 1) {
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt),
          maxDelayMs
        );

        console.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
          error: lastError.message,
        });

        await sleep(delay);
      }
    }
  }

  throw lastError!;
}

/**
 * Determine if an LLM error is retryable
 * Returns false for client errors (4xx), true for server errors (5xx) and timeouts
 */
export function isLLMErrorRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry client errors (400, 401, 403, 404)
  if (
    message.includes('invalid') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('not found')
  ) {
    return false;
  }

  // Retry server errors (500, 503) and timeouts
  return true;
}
