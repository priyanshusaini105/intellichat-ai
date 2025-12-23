import type { Message } from '@prisma/client';
import { prisma } from '../config/database.js';

export interface IMessageRepository {
  create(conversationId: string, sender: string, content: string): Promise<Message>;
  count(): Promise<number>;
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
}
