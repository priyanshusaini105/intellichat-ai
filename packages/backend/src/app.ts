import express from 'express';
import cors from 'cors';
import { createChatRouter } from './features/chat/chat.routes.js';
import { errorHandler } from './shared/middleware/error-handler.js';
import type { ILLMProvider } from './integrations/llm/llm.interface.js';
import type { IMessageRepository } from './repositories/message.repository.js';
import type { IConversationRepository } from './repositories/conversation.repository.js';
import { prisma } from './config/database.js';

export interface AppDependencies {
  llmProvider: ILLMProvider;
  messageRepository: IMessageRepository;
  conversationRepository: IConversationRepository;
}

/**
 * Create Express application with all middleware and routes
 */
export function createApp(dependencies: AppDependencies): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check with database status
  app.get('/health', async (_req, res) => {
    const health = {
      status: 'ok',
      timestamp: Date.now(),
      database: await checkDatabase(),
    };
    
    const statusCode = health.database === 'connected' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Routes
  app.use('/api/chat', createChatRouter(
    dependencies.llmProvider,
    dependencies.messageRepository,
    dependencies.conversationRepository
  ));

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
}

/**
 * Check database connectivity
 */
async function checkDatabase(): Promise<string> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return 'connected';
  } catch (error) {
    console.error('Database health check failed', error);
    return 'disconnected';
  }
}
