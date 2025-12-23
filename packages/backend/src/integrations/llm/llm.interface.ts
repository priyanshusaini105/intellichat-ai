/**
 * Interface for LLM providers
 */
export interface ILLMProvider {
  /**
   * Generate a reply to a user message
   * @param message - User's message
   * @returns AI-generated reply
   */
  generateReply(message: string): Promise<string>;
}
