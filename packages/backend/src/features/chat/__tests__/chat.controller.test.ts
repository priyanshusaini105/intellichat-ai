import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChatController } from '../chat.controller.js';
import { ValidationError, LLMServiceError } from '../../../shared/errors/custom-errors.js';
import { createMockLLMProvider } from '../../../../tests/helpers/mock-llm.js';
import type { IMessageRepository } from '../../../repositories/message.repository.js';

// Mock message repository helper
function createMockMessageRepository(): jest.Mocked<IMessageRepository> {
  return {
    create: jest.fn<any>(),
    count: jest.fn<any>(),
  };
}

describe('ChatController', () => {
  let controller: ChatController;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockMessageRepo = createMockMessageRepository();
    controller = new ChatController(mockLLMProvider, mockMessageRepo);
    
    // Default successful responses
    mockMessageRepo.create.mockResolvedValue({
      id: 'msg-id',
      sender: 'user',
      content: 'test',
      timestamp: new Date(),
    });
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

      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith('Hello');
    });

    it('should call LLM provider with trimmed message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('  Hello  ');

      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith('Hello');
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
      expect(typeof result.reply).toBe('string');
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

  describe('Database persistence', () => {
    it('should save user message before calling LLM', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      expect(mockMessageRepo.create).toHaveBeenCalledWith('user', 'Hello');
    });

    it('should save AI response after LLM returns', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      expect(mockMessageRepo.create).toHaveBeenCalledWith('ai', 'AI response');
    });

    it('should save both messages in correct order', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      await controller.handleMessage('Hello');

      const calls = mockMessageRepo.create.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0]).toEqual(['user', 'Hello']);
      expect(calls[1]).toEqual(['ai', 'AI response']);
    });

    it('should still return reply if user message save fails', async () => {
      mockMessageRepo.create
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce({
          id: 'msg-2',
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
