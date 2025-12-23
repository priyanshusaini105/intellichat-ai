import { prisma } from '../config/database.js';
import type { Conversation, Message } from '@prisma/client';
import { DatabaseError } from '../shared/errors/custom-errors.js';

/**
 * Conversation with messages included
 */
export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

/**
 * Interface for Conversation Repository operations
 */
export interface IConversationRepository {
  create(): Promise<Conversation>;
  findBySessionId(sessionId: string): Promise<Conversation | null>;
  getWithMessages(sessionId: string): Promise<ConversationWithMessages | null>;
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
      // If it's a validation error (invalid UUID), return null instead of throwing
      console.error('Failed to find conversation', error);
      return null;
    }
  }

  /**
   * Get conversation with all messages
   * Messages ordered chronologically (oldest first)
   */
  async getWithMessages(sessionId: string): Promise<ConversationWithMessages | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { sessionId },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      return conversation;
    } catch (error) {
      console.error('Failed to fetch conversation with messages', { error, sessionId });
      throw new DatabaseError('Failed to retrieve conversation history', error as Error);
    }
  }
}
