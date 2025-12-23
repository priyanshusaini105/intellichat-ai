import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { ChatController } from './chat.controller.js';
import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { ChatRequest } from './chat.types.js';
import { ValidationError } from '../../shared/errors/custom-errors.js';

/**
 * Create chat router with LLM provider dependency
 */
export function createChatRouter(llmProvider: ILLMProvider): Router {
  const router = Router();
  const controller = new ChatController(llmProvider);

  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = req.body as ChatRequest;

      // Validate message type
      if (typeof message !== 'string') {
        throw new ValidationError('Message must be a string');
      }

      const response = await controller.handleMessage(message);
      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
