import { createApp } from './app.js';
import { getEnvConfig } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { GroqProvider } from './integrations/llm/groq.provider.js';
import { MessageRepository } from './repositories/message.repository.js';
import { ConversationRepository } from './repositories/conversation.repository.js';
import { ContextService } from './services/context.service.js';

async function startServer() {
  try {
    // Get configuration
    const config = getEnvConfig();

    // 1. Connect to database
    await connectDatabase();

    // 2. Initialize dependencies
    const llmProvider = new GroqProvider(config.groqApiKey);
    const messageRepository = new MessageRepository();
    const conversationRepository = new ConversationRepository();
    const contextService = new ContextService();

    // 3. Create app with dependencies
    const app = createApp({ 
      llmProvider, 
      messageRepository, 
      conversationRepository,
      contextService
    });

    // 4. Start server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on http://localhost:${config.port}`);
      console.log(`📊 Health check: http://localhost:${config.port}/health`);
    });

    // 5. Graceful shutdown
    const shutdown = async () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed');
      });
      await disconnectDatabase();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

startServer();