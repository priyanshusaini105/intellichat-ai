import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ChatController } from './chat.controller.js';
import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { IMessageRepository } from '../../repositories/message.repository.js';
import type { IConversationRepository } from '../../repositories/conversation.repository.js';
import type { IContextService } from '../../services/context.service.js';
import type { ChatRequest, ApiResponse, ConversationHistoryResponse } from './chat.types.js';
import { validateRequest } from '../../shared/middleware/validation.js';
import { validateParams } from '../../shared/middleware/validate-params.js';
import { ipRateLimiter, sessionRateLimiter } from '../../shared/middleware/rate-limiter.js';
import { ChatMessageSchema } from './chat.validation.js';

// Session ID validation schema for path parameters
const SessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID format'),
});

/**
 * Create chat router with dependencies
 */
export function createChatRouter(
  llmProvider: ILLMProvider,
  messageRepository: IMessageRepository,
  conversationRepository: IConversationRepository,
  contextService: IContextService
): Router {
  const router = Router();
  const controller = new ChatController(
    llmProvider, 
    messageRepository, 
    conversationRepository,
    contextService
  );

  // Apply IP-based rate limiting to all chat routes
  router.use(ipRateLimiter);

  // POST /api/chat - Send message endpoint with session-based rate limiting
  router.post(
    '/',
    sessionRateLimiter, // Limit messages per session
    validateRequest(ChatMessageSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { message, sessionId } = req.body as ChatRequest;
        const response = await controller.handleMessage(message, sessionId);
        res.json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/chat/history/:sessionId - Retrieve conversation history
  router.get(
    '/history/:sessionId',
    validateParams(SessionIdSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { sessionId } = req.params;
        
        // TypeScript guard - validateParams ensures this exists
        if (!sessionId) {
          throw new Error('Session ID is required');
        }
        
        const historyData = await controller.getHistory(sessionId);
        
        const response: ApiResponse<ConversationHistoryResponse> = {
          success: true,
          data: historyData,
        };
        
        res.status(200).json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

