/**
 * Chat feature types
 */

export interface ChatRequest {
  message: string;
  sessionId?: string; // Optional sessionId for continuing conversation
}

export interface ChatResponse {
  reply: string;
  sessionId: string; // Always return the sessionId
}

/**
 * Data Transfer Objects (DTOs) for API responses
 */

export interface MessageDTO {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string; // ISO 8601 string
}

export interface ConversationHistoryResponse {
  conversationId: string;
  sessionId: string;
  messageCount: number;
  messages: MessageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface SendMessageResponse {
  reply: string;
  sessionId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
