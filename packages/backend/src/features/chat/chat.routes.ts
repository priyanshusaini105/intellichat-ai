import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ChatController } from './chat.controller.js';
import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { IMessageRepository } from '../../repositories/message.repository.js';
import type { IConversationRepository } from '../../repositories/conversation.repository.js';
import type { IContextService } from '../../services/context.service.js';
import type { ChatRequest } from './chat.types.js';
import { validateRequest } from '../../shared/middleware/validation.js';
import { ChatMessageSchema } from './chat.validation.js';

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

  // Apply validation middleware to POST endpoint
  router.post(
    '/',
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

  return router;
}

