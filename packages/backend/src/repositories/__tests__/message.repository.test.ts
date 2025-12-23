import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MessageRepository } from '../message.repository.js';
import { prisma } from '../../config/database.js';

// Mock Prisma client
jest.mock('../../config/database.js', () => ({
  prisma: {
    message: {
      create: jest.fn<any>(),
      findMany: jest.fn<any>(),
      count: jest.fn<any>(),
    },
  },
}));

describe('MessageRepository', () => {
  let repository: MessageRepository;
  const mockPrisma = prisma as any;

  beforeEach(() => {
    repository = new MessageRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const conversationId = 'conv-123';

    it('should save user message to database with conversationId', async () => {
      const mockMessage = {
        id: 'msg-123',
        conversationId: 'conv-123',
        sender: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create(conversationId, 'user', 'Hello');

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          sender: 'user',
          content: 'Hello',
        },
      });
      expect(result.sender).toBe('user');
      expect(result.content).toBe('Hello');
      expect(result.id).toBe('msg-123');
      expect(result.conversationId).toBe('conv-123');
    });

    it('should save AI message to database with conversationId', async () => {
      const mockMessage = {
        id: 'msg-456',
        conversationId: 'conv-123',
        sender: 'ai',
        content: 'How can I help?',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create(conversationId, 'ai', 'How can I help?');

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: 'conv-123',
          sender: 'ai',
          content: 'How can I help?',
        },
      });
      expect(result.sender).toBe('ai');
      expect(result.content).toBe('How can I help?');
    });

    it('should throw error if database save fails', async () => {
      const dbError = new Error('DB Connection Error');
      mockPrisma.message.create.mockRejectedValue(dbError);

      await expect(repository.create(conversationId, 'user', 'Test'))
        .rejects
        .toThrow('Failed to save message');
    });

    it('should handle empty content gracefully', async () => {
      const mockMessage = {
        id: 'msg-789',
        conversationId: 'conv-123',
        sender: 'user',
        content: '',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create(conversationId, 'user', '');

      expect(result.content).toBe('');
    });
  });

  describe('count', () => {
    it('should return total message count', async () => {
      mockPrisma.message.count.mockResolvedValue(42);

      const count = await repository.count();

      expect(count).toBe(42);
      expect(mockPrisma.message.count).toHaveBeenCalledTimes(1);
    });

    it('should return 0 when no messages exist', async () => {
      mockPrisma.message.count.mockResolvedValue(0);

      const count = await repository.count();

      expect(count).toBe(0);
    });

    it('should throw error if count fails', async () => {
      const dbError = new Error('DB Error');
      mockPrisma.message.count.mockRejectedValue(dbError);

      await expect(repository.count())
        .rejects
        .toThrow('Failed to count messages');
    });
  });

  describe('getRecentMessages', () => {
    it('should fetch last N messages for a conversation', async () => {
      const mockMessages = [
        { id: '3', conversationId: 'conv-123', sender: 'user', content: 'Help', timestamp: new Date('2025-01-01T10:00:02Z') },
        { id: '2', conversationId: 'conv-123', sender: 'ai', content: 'Hi!', timestamp: new Date('2025-01-01T10:00:01Z') },
        { id: '1', conversationId: 'conv-123', sender: 'user', content: 'Hello', timestamp: new Date('2025-01-01T10:00:00Z') },
      ];

      mockPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await repository.getRecentMessages('conv-123', 5);

      expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: 'conv-123' },
        orderBy: { timestamp: 'desc' },
        take: 5,
      });
      expect(result).toHaveLength(3);
      // Should be reversed to chronological order (oldest first)
      expect(result[0]!.content).toBe('Hello');
      expect(result[1]!.content).toBe('Hi!');
      expect(result[2]!.content).toBe('Help');
    });

    it('should return empty array if no messages exist', async () => {
      mockPrisma.message.findMany.mockResolvedValue([]);

      const result = await repository.getRecentMessages('conv-new', 5);

      expect(result).toEqual([]);
    });

    it('should limit messages to specified count', async () => {
      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${9 - i}`,
        conversationId: 'conv-123',
        sender: i % 2 === 0 ? 'user' : 'ai',
        content: `Message ${9 - i}`,
        timestamp: new Date(Date.now() - i * 1000),
      }));

      // Take only first 5 (newest)
      mockPrisma.message.findMany.mockResolvedValue(messages.slice(0, 5));

      const result = await repository.getRecentMessages('conv-123', 5);

      expect(result).toHaveLength(5);
    });

    it('should order messages by timestamp ascending after reversal (oldest first)', async () => {
      const messages = [
        { id: '2', conversationId: 'conv-123', sender: 'ai', content: 'Second', timestamp: new Date('2025-01-01T10:00:01Z') },
        { id: '1', conversationId: 'conv-123', sender: 'user', content: 'First', timestamp: new Date('2025-01-01T10:00:00Z') },
      ];

      mockPrisma.message.findMany.mockResolvedValue(messages);

      const result = await repository.getRecentMessages('conv-123', 5);

      expect(result[0]!.content).toBe('First');
      expect(result[1]!.content).toBe('Second');
    });

    it('should return empty array on database error (graceful degradation)', async () => {
      mockPrisma.message.findMany.mockRejectedValue(new Error('DB Error'));

      const result = await repository.getRecentMessages('conv-123', 5);

      expect(result).toEqual([]);
    });
  });
});
