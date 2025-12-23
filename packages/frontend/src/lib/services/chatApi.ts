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

export interface ConversationSummary {
	sessionId: string;
	messageCount: number;
	lastMessage: string;
	createdAt: string;
	updatedAt: string;
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
	 * Save conversation summary to localStorage
	 */
	private saveConversationSummary(
		sessionId: string,
		messageCount: number,
		lastMessage: string
	): void {
		if (typeof window === 'undefined') return;

		const conversations = this.getAllConversations();
		const existingIndex = conversations.findIndex((c) => c.sessionId === sessionId);

		const summary: ConversationSummary = {
			sessionId,
			messageCount,
			lastMessage: lastMessage.slice(0, 100), // Truncate to 100 chars
			createdAt:
				existingIndex >= 0 ? conversations[existingIndex].createdAt : new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		if (existingIndex >= 0) {
			conversations[existingIndex] = summary;
		} else {
			conversations.unshift(summary); // Add new conversations at the start
		}

		// Keep only last 50 conversations
		const trimmed = conversations.slice(0, 50);
		localStorage.setItem('chatConversations', JSON.stringify(trimmed));
	}

	/**
	 * Get all saved conversations
	 */
	getAllConversations(): ConversationSummary[] {
		if (typeof window === 'undefined') return [];

		try {
			const stored = localStorage.getItem('chatConversations');
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	}

	/**
	 * Load a specific conversation by sessionId
	 */
	async loadConversation(sessionId: string): Promise<ConversationHistory | null> {
		this.sessionId = sessionId;
		this.saveSession(sessionId);
		return this.getHistory();
	}

	/**
	 * Delete a conversation from history
	 */
	deleteConversation(sessionId: string): void {
		if (typeof window === 'undefined') return;

		const conversations = this.getAllConversations();
		const filtered = conversations.filter((c) => c.sessionId !== sessionId);
		localStorage.setItem('chatConversations', JSON.stringify(filtered));

		// If deleted conversation was current, clear session
		if (this.sessionId === sessionId) {
			this.clearSession();
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

				// Save conversation summary (get message count from current state)
				// We'll pass the user message as lastMessage for now
				this.saveConversationSummary(data.sessionId, 0, message);
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
