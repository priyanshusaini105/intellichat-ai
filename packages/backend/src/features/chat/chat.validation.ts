import { z } from 'zod';
import { VALIDATION, ERROR_MESSAGES } from '../../config/constants.js';
import { ValidationError } from '../../shared/errors/custom-errors.js';

export const ChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(VALIDATION.MESSAGE_MIN_LENGTH, ERROR_MESSAGES.EMPTY_MESSAGE)
    .max(VALIDATION.MESSAGE_MAX_LENGTH, ERROR_MESSAGES.MESSAGE_TOO_LONG),
  
  sessionId: z
    .string()
    .uuid(ERROR_MESSAGES.INVALID_SESSION_ID)
    .optional(),
});

export type ChatMessageRequest = z.infer<typeof ChatMessageSchema>;

/**
 * Validate and parse chat message request
 * Throws ValidationError if invalid
 */
export function validateChatMessage(data: unknown): ChatMessageRequest {
  try {
    return ChatMessageSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Get the first error message
      const firstError = error.issues[0];
      throw new ValidationError(firstError?.message || 'Validation failed');
    }
    throw error;
  }
}
