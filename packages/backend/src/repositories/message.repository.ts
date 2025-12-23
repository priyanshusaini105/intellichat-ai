import type { Message } from '@prisma/client';
import { prisma } from '../config/database.js';

export interface IMessageRepository {
  create(conversationId: string, sender: string, content: string): Promise<Message>;
  count(): Promise<number>;
  getRecentMessages(conversationId: string, limit: number): Promise<Message[]>;
}

export class MessageRepository implements IMessageRepository {
  /**
   * Save a message (user or AI) to database
   */
  async create(conversationId: string, sender: 'user' | 'ai', content: string): Promise<Message> {
    try {
      const message = await prisma.message.create({
        data: {
          conversationId,
          sender,
          content,
        },
      });

      console.log(`Message saved: ${sender} - ${content.slice(0, 50)}...`);
      return message;
    } catch (error) {
      console.error('Failed to save message to database', { error, sender, content: content.slice(0, 100) });
      throw new Error('Failed to save message');
    }
  }

  /**
   * Get total message count (for health check)
   */
  async count(): Promise<number> {
    try {
      return await prisma.message.count();
    } catch (error) {
      console.error('Failed to count messages', error);
      throw new Error('Failed to count messages');
    }
  }

  /**
   * Fetch the last N messages from a conversation
   * Ordered chronologically (oldest first) for LLM context
   */
  async getRecentMessages(conversationId: string, limit: number): Promise<Message[]> {
    try {
      // Fetch last N messages in reverse order (newest first)
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      // Reverse to get chronological order (oldest first)
      return messages.reverse();
    } catch (error) {
      console.error('Failed to fetch recent messages', { error, conversationId, limit });
      return []; // Return empty array on error (graceful degradation)
    }
  }
}
