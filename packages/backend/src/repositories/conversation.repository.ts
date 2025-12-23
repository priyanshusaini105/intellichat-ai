import { prisma } from '../config/database.js';
import type { Conversation } from '@prisma/client';

/**
 * Interface for Conversation Repository operations
 */
export interface IConversationRepository {
  create(): Promise<Conversation>;
  findBySessionId(sessionId: string): Promise<Conversation | null>;
}

/**
 * Repository for managing Conversation entities
 */
export class ConversationRepository implements IConversationRepository {
  /**
   * Create a new conversation with a generated sessionId
   */
  async create(): Promise<Conversation> {
    try {
      const conversation = await prisma.conversation.create({
        data: {},
      });
      console.log(`Conversation created: ${conversation.sessionId}`);
      return conversation;
    } catch (error) {
      console.error('Failed to create conversation', error);
      throw new Error('Failed to create conversation');
    }
  }

  /**
   * Find a conversation by its sessionId
   */
  async findBySessionId(sessionId: string): Promise<Conversation | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId },
      });
      return conversation;
    } catch (error) {
      console.error('Failed to find conversation', error);
      throw new Error('Failed to find conversation');
    }
  }
}
