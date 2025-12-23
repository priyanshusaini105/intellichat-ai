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
    it('should save user message to database', async () => {
      const mockMessage = {
        id: 'msg-123',
        sender: 'user',
        content: 'Hello',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create('user', 'Hello');

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
          sender: 'user',
          content: 'Hello',
        },
      });
      expect(result.sender).toBe('user');
      expect(result.content).toBe('Hello');
      expect(result.id).toBe('msg-123');
    });

    it('should save AI message to database', async () => {
      const mockMessage = {
        id: 'msg-456',
        sender: 'ai',
        content: 'How can I help?',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create('ai', 'How can I help?');

      expect(mockPrisma.message.create).toHaveBeenCalledWith({
        data: {
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

      await expect(repository.create('user', 'Test'))
        .rejects
        .toThrow('Failed to save message');
    });

    it('should handle empty content gracefully', async () => {
      const mockMessage = {
        id: 'msg-789',
        sender: 'user',
        content: '',
        timestamp: new Date(),
      };

      mockPrisma.message.create.mockResolvedValue(mockMessage);

      const result = await repository.create('user', '');

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
});
