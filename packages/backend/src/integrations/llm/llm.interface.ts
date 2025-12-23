import type { LLMMessage } from '../../services/context.service.js';

/**
 * Interface for LLM providers
 */
export interface ILLMProvider {
  /**
   * Generate a reply to a user message
   * @param message - User's message
   * @param conversationHistory - Previous messages for context (optional)
   * @returns AI-generated reply
   */
  generateReply(message: string, conversationHistory?: LLMMessage[]): Promise<string>;
}
