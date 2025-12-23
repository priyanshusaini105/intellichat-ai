import type { Message } from '@prisma/client';

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface IContextService {
  formatForLLM(messages: Message[]): LLMMessage[];
  limitContext(messages: Message[], maxCount: number): Message[];
}

export class ContextService implements IContextService {
  /**
   * Convert database messages to LLM-compatible format
   * Maps: "user" -> "user", "ai" -> "assistant"
   */
  formatForLLM(messages: Message[]): LLMMessage[] {
    return messages.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));
  }

  /**
   * Limit conversation history to most recent N messages
   * Prevents token overflow and reduces costs
   */
  limitContext(messages: Message[], maxCount: number): Message[] {
    if (messages.length <= maxCount) {
      return messages;
    }

    // Keep last N messages
    return messages.slice(-maxCount);
  }
}
