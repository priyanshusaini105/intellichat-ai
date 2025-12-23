import { ConversationRepository } from '../conversation.repository.js';
import { prisma } from '../../config/database.js';

jest.mock('../../config/database', () => ({
  prisma: {
    conversation: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

describe('ConversationRepository', () => {
  let repository: ConversationRepository;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

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
});
