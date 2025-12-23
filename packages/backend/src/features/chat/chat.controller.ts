import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import { ValidationError } from '../../shared/errors/custom-errors.js';
import type { ChatResponse } from './chat.types.js';

/**
 * Chat controller handling message processing logic
 */
export class ChatController {
  constructor(private llmProvider: ILLMProvider) {}

  /**
   * Handle user message and generate AI reply
   * @param message - User's message
   * @returns Chat response with AI reply
   * @throws ValidationError if message is empty
   */
  async handleMessage(message: string): Promise<ChatResponse> {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      throw new ValidationError('Message cannot be empty');
    }

    const reply = await this.llmProvider.generateReply(trimmedMessage);

    return { reply };
  }
}
