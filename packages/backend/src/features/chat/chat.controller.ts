import type { ILLMProvider } from '../../integrations/llm/llm.interface.js';
import type { IMessageRepository } from '../../repositories/message.repository.js';
import type { IConversationRepository } from '../../repositories/conversation.repository.js';
import type { IContextService } from '../../services/context.service.js';
import type { Message } from '@prisma/client';
import { ValidationError, ConversationNotFoundError } from '../../shared/errors/custom-errors.js';
import type { ChatResponse, ConversationHistoryResponse, MessageDTO } from './chat.types.js';
import { cacheService } from '../../services/cache.service.js';

const MAX_CONTEXT_MESSAGES = 5;
const CONVERSATION_CACHE_TTL = 600; // 10 minutes

/**
 * Chat controller handling message processing logic
 */
export class ChatController {
  constructor(
    private llmProvider: ILLMProvider,
    private messageRepository: IMessageRepository,
    private conversationRepository: IConversationRepository,
    private contextService: IContextService
  ) {}

  /**
   * Handle user message and generate AI reply
   * @param message - User's message
   * @param sessionId - Optional sessionId to continue existing conversation
   * @returns Chat response with AI reply and sessionId
   * @throws ValidationError if message is empty
   */
  async handleMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      throw new ValidationError('Message cannot be empty');
    }

    try {
      // 1. Resolve Conversation (find existing or create new)
      let conversation;
      
      if (sessionId) {
        conversation = await this.conversationRepository.findBySessionId(sessionId);
        if (!conversation) {
          console.log(`Conversation not found for sessionId: ${sessionId}, creating new conversation`);
        }
      }

      if (!conversation) {
        conversation = await this.conversationRepository.create();
      }

      // 2. Fetch conversation history (last 5 messages)
      const history = await this.fetchHistory(conversation.id);

      // 3. Save user message to database (linked to conversation)
      await this.saveMessage(conversation.id, 'user', trimmedMessage);

      // 4. Get AI response with context
      const formattedHistory = this.contextService.formatForLLM(history);
      const reply = await this.llmProvider.generateReply(trimmedMessage, formattedHistory);

      // 5. Save AI response to database (linked to conversation)
      await this.saveMessage(conversation.id, 'ai', reply);

      // 6. Invalidate cache since conversation was updated
      await cacheService.delete(`conversation:${conversation.sessionId}`);

      return { reply, sessionId: conversation.sessionId };
    } catch (error) {
      console.error('Error in chat controller', error);
      throw error;
    }
  }

  /**
   * Fetch recent conversation history
   * Gracefully handles errors by returning empty array
   */
  private async fetchHistory(conversationId: string) {
    try {
      const messages = await this.messageRepository.getRecentMessages(
        conversationId,
        MAX_CONTEXT_MESSAGES
      );
      return this.contextService.limitContext(messages, MAX_CONTEXT_MESSAGES);
    } catch (error) {
      console.error('Failed to fetch conversation history', { error, conversationId });
      return []; // Continue with no context on error
    }
  }

  /**
   * Save message to database with error handling
   * Non-blocking - continues even if save fails
   */
  private async saveMessage(conversationId: string, sender: 'user' | 'ai', content: string): Promise<void> {
    try {
      await this.messageRepository.create(conversationId, sender, content);
    } catch (error) {
      // Log but don't throw - message persistence failure shouldn't break chat
      console.error(`Failed to persist ${sender} message`, {
        error,
        message: content.slice(0, 100),
      });
    }
  }

  /**
   * Get conversation history by sessionId
   * @param sessionId - Session identifier (UUID)
   * @returns Conversation history with all messages
   * @throws ConversationNotFoundError if conversation doesn't exist
   */
  async getHistory(sessionId: string): Promise<ConversationHistoryResponse> {
    // Try to get from cache first
    const cacheKey = `conversation:${sessionId}`;
    const cached = await cacheService.get<ConversationHistoryResponse>(cacheKey);

    if (cached) {
      return cached;
    }

    // Cache miss - fetch from database
    const conversation = await this.conversationRepository.getWithMessages(sessionId);

    if (!conversation) {
      throw new ConversationNotFoundError(sessionId);
    }

    const response: ConversationHistoryResponse = {
      conversationId: conversation.id,
      sessionId: conversation.sessionId,
      messageCount: conversation.messages.length,
      messages: conversation.messages.map(this.formatMessage),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    };

    // Cache for 10 minutes
    await cacheService.set(cacheKey, response, CONVERSATION_CACHE_TTL);

    return response;
  }

  /**
   * Format message for API response
   */
  private formatMessage(message: Message): MessageDTO {
    return {
      id: message.id,
      sender: message.sender as 'user' | 'ai',
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    };
  }
}
