import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { IMessageRepository } from '../../repositories/message.repository.js';
import { ValidationError } from '../../shared/errors/custom-errors.js';
import type { ChatResponse } from './chat.types.js';

/**
 * Chat controller handling message processing logic
 */
export class ChatController {
  constructor(
    private llmProvider: ILLMProvider,
    private messageRepository: IMessageRepository
  ) {}

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

    try {
      // 1. Save user message to database
      await this.saveMessage('user', trimmedMessage);

      // 2. Get AI response from LLM
      const reply = await this.llmProvider.generateReply(trimmedMessage);

      // 3. Save AI response to database
      await this.saveMessage('ai', reply);

      return { reply };
    } catch (error) {
      console.error('Error in chat controller', error);
      throw error;
    }
  }

  /**
   * Save message to database with error handling
   * Non-blocking - continues even if save fails
   */
  private async saveMessage(sender: 'user' | 'ai', content: string): Promise<void> {
    try {
      await this.messageRepository.create(sender, content);
    } catch (error) {
      // Log but don't throw - message persistence failure shouldn't break chat
      console.error(`Failed to persist ${sender} message`, {
        error,
        message: content.slice(0, 100),
      });
    }
  }
}
