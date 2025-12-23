import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChatController } from '../chat.controller.js';
import { ValidationError, LLMServiceError } from '../../../shared/errors/custom-errors.js';
import { createMockLLMProvider } from '../../../../tests/helpers/mock-llm.js';
import type { IMessageRepository } from '../../../repositories/message.repository.js';
import type { IConversationRepository } from '../../../repositories/conversation.repository.js';
import type { IContextService } from '../../../services/context.service.js';

// Mock message repository helper
function createMockMessageRepository(): jest.Mocked<IMessageRepository> {
  return {
    create: jest.fn<any>(),
    count: jest.fn<any>(),
    getRecentMessages: jest.fn<any>(),
  };
}

// Mock conversation repository helper
function createMockConversationRepository(): jest.Mocked<IConversationRepository> {
  return {
    create: jest.fn<any>(),
    findBySessionId: jest.fn<any>(),
  };
}

// Mock context service helper
function createMockContextService(): jest.Mocked<IContextService> {
  return {
    formatForLLM: jest.fn<any>(),
    limitContext: jest.fn<any>(),
  };
}

describe('ChatController', () => {
  let controller: ChatController;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;
  let mockConversationRepo: jest.Mocked<IConversationRepository>;
  let mockContextService: jest.Mocked<IContextService>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockMessageRepo = createMockMessageRepository();
    mockConversationRepo = createMockConversationRepository();
    mockContextService = createMockContextService();
    
    controller = new ChatController(
      mockLLMProvider, 
      mockMessageRepo, 
      mockConversationRepo,
      mockContextService
    );
    
    // Default successful responses
    mockMessageRepo.create.mockResolvedValue({
      id: 'msg-id',
      conversationId: 'conv-123',
      sender: 'user',
      content: 'test',
      timestamp: new Date(),
    });

    mockMessageRepo.getRecentMessages.mockResolvedValue([]);

    mockConversationRepo.create.mockResolvedValue({
      id: 'conv-123',
      sessionId: 'session-abc',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockContextService.formatForLLM.mockReturnValue([]);
    mockContextService.limitContext.mockImplementation((messages) => messages);
  });

  describe('handleMessage', () => {
    it('should throw ValidationError for empty message', async () => {
      await expect(controller.handleMessage('')).rejects.toThrow(ValidationError);
      await expect(controller.handleMessage('')).rejects.toThrow('Message cannot be empty');
    });

    it('should throw ValidationError for whitespace-only message', async () => {
      await expect(controller.handleMessage('   ')).rejects.toThrow(ValidationError);
      await expect(controller.handleMessage('   ')).rejects.toThrow('Message cannot be empty');
    });

    it('should throw ValidationError for tab/newline only message', async () => {
      await expect(controller.handleMessage('\t\n')).rejects.toThrow(ValidationError);
    });

    it('should call LLM provider with user message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith('Hello', expect.any(Array));
    });

    it('should call LLM provider with trimmed message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('  Hello  ');

      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith('Hello', expect.any(Array));
    });

    it('should return reply from LLM', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('Test reply');

      const result = await controller.handleMessage('Hello');

      expect(result.reply).toBe('Test reply');
    });

    it('should return object with reply property', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello');

      expect(result).toHaveProperty('reply');
      expect(result).toHaveProperty('sessionId');
      expect(typeof result.reply).toBe('string');
      expect(typeof result.sessionId).toBe('string');
    });

    it('should propagate LLMServiceError from provider', async () => {
      const llmError = new LLMServiceError('LLM failed');
      (mockLLMProvider.generateReply as any).mockRejectedValue(llmError);

      await expect(controller.handleMessage('Hello')).rejects.toThrow(LLMServiceError);
    });

    it('should handle LLM provider throwing generic errors', async () => {
      const genericError = new Error('Unexpected error');
      (mockLLMProvider.generateReply as any).mockRejectedValue(genericError);

      await expect(controller.handleMessage('Hello')).rejects.toThrow(Error);
    });

    it('should only call LLM provider once per message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('Response');

      await controller.handleMessage('Hello');

      expect(mockLLMProvider.generateReply).toHaveBeenCalledTimes(1);
    });
  });

  describe('Session Management', () => {
    it('should create new conversation if no sessionId provided', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello');

      expect(mockConversationRepo.create).toHaveBeenCalled();
      expect(mockConversationRepo.findBySessionId).not.toHaveBeenCalled();
      expect(result.sessionId).toBe('session-abc');
    });

    it('should reuse existing conversation if valid sessionId provided', async () => {
      const existingConversation = {
        id: 'conv-existing',
        sessionId: 'session-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockConversationRepo.findBySessionId.mockResolvedValue(existingConversation);
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello', 'session-123');

      expect(mockConversationRepo.findBySessionId).toHaveBeenCalledWith('session-123');
      expect(mockConversationRepo.create).not.toHaveBeenCalled();
      expect(result.sessionId).toBe('session-123');
    });

    it('should create new conversation if provided sessionId not found', async () => {
      mockConversationRepo.findBySessionId.mockResolvedValue(null);
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello', 'invalid-session');

      expect(mockConversationRepo.findBySessionId).toHaveBeenCalledWith('invalid-session');
      expect(mockConversationRepo.create).toHaveBeenCalled();
      expect(result.sessionId).toBe('session-abc');
    });

    it('should link messages to the conversation', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      const calls = mockMessageRepo.create.mock.calls;
      expect(calls[0]![0]).toBe('conv-123'); // conversationId
      expect(calls[0]![1]).toBe('user');
      expect(calls[0]![2]).toBe('Hello');
      
      expect(calls[1]![0]).toBe('conv-123'); // conversationId
      expect(calls[1]![1]).toBe('ai');
      expect(calls[1]![2]).toBe('AI response');
    });
  });

  describe('Database persistence', () => {
    it('should save user message before calling LLM', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      expect(mockMessageRepo.create).toHaveBeenCalledWith('conv-123', 'user', 'Hello');
    });

    it('should save AI response after LLM returns', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      expect(mockMessageRepo.create).toHaveBeenCalledWith('conv-123', 'ai', 'AI response');
    });

    it('should save both messages in correct order', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      const calls = mockMessageRepo.create.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0]).toEqual(['conv-123', 'user', 'Hello']);
      expect(calls[1]).toEqual(['conv-123', 'ai', 'AI response']);
    });

    it('should still return reply if user message save fails', async () => {
      mockMessageRepo.create
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce({
          id: 'msg-2',
          conversationId: 'conv-123',
          sender: 'ai',
          content: 'AI response',
          timestamp: new Date(),
        });

      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello');

      // Should log error but continue
      expect(result.reply).toBe('AI response');
    });

    it('should handle AI message save failure gracefully', async () => {
      mockMessageRepo.create
        .mockResolvedValueOnce({
          id: 'msg-1',
          conversationId: 'conv-123',
          sender: 'user',
          content: 'Hello',
          timestamp: new Date(),
        })
        .mockRejectedValueOnce(new Error('DB Error'));

      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const result = await controller.handleMessage('Hello');

      // Should still return reply to user
      expect(result.reply).toBe('AI response');
    });
  });
});
