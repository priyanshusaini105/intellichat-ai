import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConversationRepository } from '../conversation.repository.js';
import { prisma } from '../../config/database.js';

jest.mock('../../config/database.js', () => ({
  prisma: {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('ConversationRepository', () => {
  let repository: ConversationRepository;
  const mockPrisma = prisma as unknown as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    repository = new ConversationRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new conversation with UUID sessionId', async () => {
      const mockConversation = {
        id: 'conv-123',
        sessionId: 'session-abc',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.conversation.create.mockResolvedValue(mockConversation);

      const result = await repository.create();

      expect(mockPrisma.conversation.create).toHaveBeenCalledWith({
        data: {},
      });
      expect(result).toEqual(mockConversation);
      expect(result.sessionId).toBe('session-abc');
    });

    it('should handle creation errors gracefully', async () => {
      mockPrisma.conversation.create.mockRejectedValue(new Error('DB Error'));

      await expect(repository.create()).rejects.toThrow('Failed to create conversation');
    });
  });

  describe('findBySessionId', () => {
    it('should return conversation if found', async () => {
      const mockConversation = {
        id: 'conv-123',
        sessionId: 'session-abc',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.findBySessionId('session-abc');

      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'session-abc' },
      });
      expect(result).toEqual(mockConversation);
      expect(result?.id).toBe('conv-123');
    });

    it('should return null if not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const result = await repository.findBySessionId('invalid-session');

      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'invalid-session' },
      });
      expect(result).toBeNull();
    });

    it('should handle query errors gracefully', async () => {
      mockPrisma.conversation.findUnique.mockRejectedValue(new Error('DB Error'));

      await expect(repository.findBySessionId('session-123')).rejects.toThrow(
        'Failed to find conversation'
      );
    });
  });

  describe('getWithMessages', () => {
    it('should return conversation with all messages', async () => {
      const mockConversation = {
        id: 'conv-123',
        sessionId: 'session-abc',
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T10:05:00Z'),
        messages: [
          {
            id: 'msg-1',
            conversationId: 'conv-123',
            sender: 'user',
            content: 'Hello',
            timestamp: new Date('2025-01-01T10:00:00Z'),
          },
          {
            id: 'msg-2',
            conversationId: 'conv-123',
            sender: 'ai',
            content: 'Hi there!',
            timestamp: new Date('2025-01-01T10:00:01Z'),
          },
        ],
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.getWithMessages('session-abc');

      expect(mockPrisma.conversation.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'session-abc' },
        include: {
          messages: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockConversation);
      expect(result?.messages).toHaveLength(2);
    });

    it('should return null if conversation not found', async () => {
      mockPrisma.conversation.findUnique.mockResolvedValue(null);

      const result = await repository.getWithMessages('invalid-session');
      expect(result).toBeNull();
    });

    it('should return conversation with empty messages array', async () => {
      const mockConversation = {
        id: 'conv-new',
        sessionId: 'session-new',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [],
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.getWithMessages('session-new');
      expect(result?.messages).toEqual([]);
    });

    it('should order messages by timestamp ascending', async () => {
      const mockConversation = {
        id: 'conv-123',
        sessionId: 'session-abc',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          {
            id: '1',
            conversationId: 'conv-123',
            timestamp: new Date('2025-01-01T10:00:00Z'),
            sender: 'user',
            content: 'First',
          },
          {
            id: '2',
            conversationId: 'conv-123',
            timestamp: new Date('2025-01-01T10:00:01Z'),
            sender: 'ai',
            content: 'Second',
          },
        ],
      };

      mockPrisma.conversation.findUnique.mockResolvedValue(mockConversation);

      const result = await repository.getWithMessages('session-abc');
      expect(result?.messages[0].content).toBe('First');
      expect(result?.messages[1].content).toBe('Second');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.conversation.findUnique.mockRejectedValue(new Error('DB connection failed'));

      await expect(repository.getWithMessages('session-123')).rejects.toThrow(
        'Failed to retrieve conversation history'
      );
    });
  });
});
