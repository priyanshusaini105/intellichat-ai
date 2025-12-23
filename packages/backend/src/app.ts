import express from 'express';
import cors from 'cors';
import { createChatRouter } from './features/chat/chat.routes.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import type { ILLMProvider } from './integrations/llm/llm.interface.js';

export interface AppDependencies {
  llmProvider: ILLMProvider;
}

/**
 * Create Express application with all middleware and routes
 */
export function createApp(dependencies: AppDependencies): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Routes
  app.use('/api/chat', createChatRouter(dependencies.llmProvider));

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}
