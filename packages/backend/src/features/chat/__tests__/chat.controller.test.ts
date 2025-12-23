import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ChatController } from '../chat.controller.js';
import { ValidationError, LLMServiceError } from '../../../shared/errors/custom-errors.js';
import { createMockLLMProvider } from '../../../../tests/helpers/mock-llm.js';

describe('ChatController', () => {
  let controller: ChatController;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    controller = new ChatController(mockLLMProvider);
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
});
