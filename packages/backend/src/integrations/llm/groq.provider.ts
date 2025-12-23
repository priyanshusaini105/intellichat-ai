import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import type { ILLMProvider } from './llm.interface.js';
import type { LLMMessage } from '../../services/context.service.js';
import {
  LLMServiceError,
  LLMTimeoutError,
  LLMRateLimitError,
} from '../../shared/errors/custom-errors.js';
import { retryWithBackoff, isLLMErrorRetryable } from '../../shared/utils/retry.js';
import { LLM_CONFIG, ERROR_MESSAGES } from '../../config/constants.js';

const FAQ_KNOWLEDGE = `You are a helpful customer support agent for QuickShop E-commerce.

Store Information:
- Store Name: QuickShop E-commerce
- Shipping: Free on orders $50+, 3-5 business days delivery
- Returns: 30-day free return policy
- Support Hours: Mon-Fri 9AM-6PM EST
- Payment: Visa, Mastercard, PayPal, Apple Pay accepted

Answer customer questions based on this information. Be friendly and helpful.`;

/**
 * Groq LLM provider implementation using LangChain
 * Includes timeout handling, retry logic, and comprehensive error handling
 */
export class GroqProvider implements ILLMProvider {
  private chain: any;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Groq API key is required');
    }

    // Initialize ChatGroq model
    const model = new ChatGroq({
      apiKey: apiKey,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      timeout: LLM_CONFIG.TIMEOUT_MS,
    });

    // Create prompt template with system message, conversation history, and user input
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', FAQ_KNOWLEDGE],
      new MessagesPlaceholder('chat_history'),
      ['human', '{input}'],
    ]);

    // Create chain by piping prompt to model
    this.chain = prompt.pipe(model);
  }

  async generateReply(message: string, conversationHistory: LLMMessage[] = []): Promise<string> {
    try {
      // Retry with exponential backoff
      const response = await retryWithBackoff(
        () => this.callLLM(message, conversationHistory),
        LLM_CONFIG.MAX_RETRIES,
        LLM_CONFIG.RETRY_DELAY_MS,
        isLLMErrorRetryable
      );

      return response;
    } catch (error) {
      console.error('LLM generation failed after retries', {
        error,
        userMessage: message.slice(0, 100),
        historyLength: conversationHistory.length,
      });
      throw this.handleLLMError(error as Error);
    }
  }

  /**
   * Make actual LLM API call with timeout
   */
  private async callLLM(message: string, conversationHistory: LLMMessage[]): Promise<string> {
    // Format history for LangChain (convert to HumanMessage/AIMessage format)
    const formattedHistory = conversationHistory.map(msg => [
      msg.role === 'user' ? 'human' : 'ai',
      msg.content
    ]);

    // Create timeout promise with cleanup
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new LLMTimeoutError(ERROR_MESSAGES.LLM_TIMEOUT));
      }, LLM_CONFIG.TIMEOUT_MS);
    });

    try {
      // Race between LLM call and timeout
      const response = await Promise.race([
        this.chain.invoke({ 
          input: message,
          chat_history: formattedHistory
        }),
        timeoutPromise,
      ]);

      const reply = response?.content;

      if (!reply || typeof reply !== 'string' || reply.trim() === '') {
        throw new LLMServiceError('Empty response from LLM');
      }

      return reply;
    } finally {
      // Clear timeout if it hasn't fired yet
      clearTimeout(timeoutId!);
    }
  }

  /**
   * Convert generic errors to specific error types
   */
  private handleLLMError(error: Error): Error {
    // Already a custom error
    if (
      error instanceof LLMTimeoutError ||
      error instanceof LLMRateLimitError ||
      error instanceof LLMServiceError
    ) {
      return error;
    }

    const errorMessage = error.message.toLowerCase();
    const statusCode = (error as any).status;

    // Rate limiting
    if (statusCode === 429 || errorMessage.includes('rate limit')) {
      const retryAfter = (error as any).headers?.['retry-after'];
      return new LLMRateLimitError(
        ERROR_MESSAGES.LLM_RATE_LIMIT,
        retryAfter ? parseInt(retryAfter) : undefined
      );
    }

    // Authentication
    if (statusCode === 401 || errorMessage.includes('unauthorized')) {
      return new LLMServiceError(
        ERROR_MESSAGES.LLM_UNAVAILABLE,
        error
      );
    }

    // Timeout
    if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
      return new LLMTimeoutError(ERROR_MESSAGES.LLM_TIMEOUT);
    }

    // Generic service error
    return new LLMServiceError(ERROR_MESSAGES.LLM_GENERIC_ERROR, error);
  }
}

