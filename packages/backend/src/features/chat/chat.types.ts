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
