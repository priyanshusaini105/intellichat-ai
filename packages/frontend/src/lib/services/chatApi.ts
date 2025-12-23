/**
 * API Service for IntelliChat AI Backend
 * Handles all HTTP communication with the chat API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ChatMessage {
	id: string;
	sender: 'user' | 'ai';
	content: string;
	timestamp: string;
}

export interface ChatResponse {
	reply: string;
	sessionId: string;
}

export interface ConversationHistory {
	success: boolean;
	data: {
		conversationId: string;
		sessionId: string;
		messageCount: number;
		messages: ChatMessage[];
		createdAt: string;
		updatedAt: string;
	};
}

export interface ApiError {
	success: false;
	error: string;
}

class ChatApiService {
	private sessionId: string | null = null;

	/**
	 * Initialize session from localStorage
	 */
	constructor() {
		if (typeof window !== 'undefined') {
			this.sessionId = localStorage.getItem('chatSessionId');
		}
	}

	/**
	 * Get current session ID
	 */
	getSessionId(): string | null {
		return this.sessionId;
	}

	/**
	 * Clear session (start new conversation)
	 */
	clearSession(): void {
		this.sessionId = null;
		if (typeof window !== 'undefined') {
			localStorage.removeItem('chatSessionId');
		}
	}

	/**
	 * Save session ID to localStorage
	 */
	private saveSession(sessionId: string): void {
		this.sessionId = sessionId;
		if (typeof window !== 'undefined') {
			localStorage.setItem('chatSessionId', sessionId);
		}
	}

	/**
	 * Send a message to the chat API
	 * @param message - User's message
	 * @returns AI response with sessionId
	 */
	async sendMessage(message: string): Promise<ChatResponse> {
		try {
			const response = await fetch(`${API_BASE_URL}/api/chat`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					message,
					...(this.sessionId && { sessionId: this.sessionId })
				})
			});

			if (!response.ok) {
				const error: ApiError = await response.json();
				throw new Error(error.error || 'Failed to send message');
			}

			const data: ChatResponse = await response.json();

			// Save session ID for continuing conversation
			if (data.sessionId) {
				this.saveSession(data.sessionId);
			}

			return data;
		} catch (error) {
			console.error('Error sending message:', error);
			throw error instanceof Error ? error : new Error('Failed to send message');
		}
	}

	/**
	 * Get conversation history for current session
	 * @returns Conversation history with all messages
	 */
	async getHistory(): Promise<ConversationHistory | null> {
		if (!this.sessionId) {
			return null;
		}

		try {
			const response = await fetch(`${API_BASE_URL}/api/chat/history/${this.sessionId}`);

			if (!response.ok) {
				if (response.status === 404) {
					// Session doesn't exist, clear it
					this.clearSession();
					return null;
				}
				const error: ApiError = await response.json();
				throw new Error(error.error || 'Failed to get history');
			}

			const data: ConversationHistory = await response.json();
			return data;
		} catch (error) {
			console.error('Error getting history:', error);
			throw error instanceof Error ? error : new Error('Failed to get history');
		}
	}

	/**
	 * Check if backend is healthy
	 */
	async checkHealth(): Promise<boolean> {
		try {
			const response = await fetch(`${API_BASE_URL}/health`);
			return response.ok;
		} catch (error) {
			console.error('Health check failed:', error);
			return false;
		}
	}
}

// Export singleton instance
export const chatApi = new ChatApiService();
