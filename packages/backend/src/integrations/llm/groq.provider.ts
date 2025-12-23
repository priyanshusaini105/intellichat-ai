import { ChatGroq } from '@langchain/groq';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import type { ILLMProvider } from './llm.interface.js';
import type { LLMMessage } from '../../services/context.service.js';
import { LLMServiceError } from '../../shared/errors/custom-errors.js';

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
      // Format history for LangChain (convert to HumanMessage/AIMessage format)
      const formattedHistory = conversationHistory.map(msg => [
        msg.role === 'user' ? 'human' : 'ai',
        msg.content
      ]);

      const response = await this.chain.invoke({ 
        input: message,
        chat_history: formattedHistory
      });

      const reply = response?.content;

      if (!reply || typeof reply !== 'string' || reply.trim() === '') {
        throw new LLMServiceError('No response from LLM');
      }

      return reply;
    } catch (error) {
      if (error instanceof LLMServiceError) {
        throw error;
      }
      throw new LLMServiceError(
        'Failed to generate reply from LLM',
        error as Error
      );
    }
  }
}
