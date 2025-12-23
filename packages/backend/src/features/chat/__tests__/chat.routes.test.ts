import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { createChatRouter } from '../chat.routes.js';
import { createMockLLMProvider } from '../../../../tests/helpers/mock-llm.js';
import { LLMServiceError } from '../../../shared/errors/custom-errors.js';
import { errorHandler } from '../../../shared/middleware/error-handler.js';
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

describe('Chat Routes', () => {
  let app: express.Application;
  let mockLLMProvider: ReturnType<typeof createMockLLMProvider>;
  let mockMessageRepo: jest.Mocked<IMessageRepository>;
  let mockConversationRepo: jest.Mocked<IConversationRepository>;
  let mockContextService: jest.Mocked<IContextService>;

  beforeEach(() => {
    mockLLMProvider = createMockLLMProvider();
    mockMessageRepo = createMockMessageRepository();
    mockConversationRepo = createMockConversationRepository();
    mockContextService = createMockContextService();
    
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
    
    // Create minimal Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/chat', createChatRouter(
      mockLLMProvider, 
      mockMessageRepo, 
      mockConversationRepo,
      mockContextService
    ));
    app.use(errorHandler);
  });

  describe('POST /api/chat', () => {
    it('should return 200 with valid message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(200);

      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body.sessionId).toBe('session-abc');
    });

    it('should return 400 for empty message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('empty');
    });

    it('should return 400 for missing message field', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for whitespace-only message', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: '   ' })
        .expect(400);

      expect(response.body.error).toContain('empty');
    });

    it('should return 500 when LLM service fails', async () => {
      (mockLLMProvider.generateReply as any).mockRejectedValue(
        new LLMServiceError('LLM failed')
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(500);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Failed to process request');
    });

    it('should have correct response structure', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('AI response');

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' });

      expect(response.body).toEqual({
        reply: 'AI response',
        sessionId: 'session-abc',
      });
    });

    it('should return FAQ answer for shipping policy question', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue(
        'We offer free shipping on orders $50 and above. Standard delivery takes 3-5 business days.'
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'What is your shipping policy?' })
        .expect(200);

      expect(response.body.reply).toContain('shipping');
      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith(
        'What is your shipping policy?',
        expect.any(Array)
      );
    });

    it('should return FAQ answer for return policy question', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue(
        'We have a 30-day free return policy. You can return any item within 30 days of purchase.'
      );

      const response = await request(app)
        .post('/api/chat')
        .send({ message: 'What is your return policy?' })
        .expect(200);

      expect(response.body.reply).toContain('return');
      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith(
        'What is your return policy?',
        expect.any(Array)
      );
    });

    it('should call LLM provider with user message', async () => {
      (mockLLMProvider.generateReply as any).mockResolvedValue('Response');

      await request(app)
        .post('/api/chat')
        .send({ message: 'Test message' });

      expect(mockLLMProvider.generateReply).toHaveBeenCalledWith(
        'Test message',
        expect.any(Array)
      );
    });

    it('should handle non-string message type', async () => {
      const response = await request(app)
        .post('/api/chat')
        .send({ message: 123 })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
