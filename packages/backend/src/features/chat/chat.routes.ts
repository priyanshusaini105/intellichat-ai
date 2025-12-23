import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ChatController } from './chat.controller.js';
import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { IMessageRepository } from '../../repositories/message.repository.js';
import type { IConversationRepository } from '../../repositories/conversation.repository.js';
import type { ChatRequest } from './chat.types.js';
import { ValidationError } from '../../shared/errors/custom-errors.js';

/**
 * Create chat router with LLM provider, message repository, and conversation repository dependencies
 */
export function createChatRouter(
  llmProvider: ILLMProvider,
  messageRepository: IMessageRepository,
  conversationRepository: IConversationRepository
): Router {
  const router = Router();
  const controller = new ChatController(llmProvider, messageRepository, conversationRepository);

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, sessionId } = req.body as ChatRequest;

      // Validate message type
      if (typeof message !== 'string') {
        throw new ValidationError('Message must be a string');
      }

      const response = await controller.handleMessage(message, sessionId);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
