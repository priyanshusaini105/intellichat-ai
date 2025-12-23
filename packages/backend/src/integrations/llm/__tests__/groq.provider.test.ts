import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GroqProvider } from '../groq.provider.js';
import { LLMServiceError } from '../../../shared/errors/custom-errors.js';

// Mock LangChain modules
jest.mock('@langchain/groq');
jest.mock('@langchain/core/prompts');

describe('GroqProvider', () => {
  const mockApiKey = 'test-api-key';
  let provider: GroqProvider;
  let mockInvoke: jest.Mock<any>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock for LangChain ChatGroq invoke
    mockInvoke = jest.fn<any>();
    
    // Mock the ChatGroq class
    const { ChatGroq } = require('@langchain/groq');
    ChatGroq.mockImplementation(() => ({
      invoke: mockInvoke,
    }));

    // Mock the ChatPromptTemplate
    const { ChatPromptTemplate } = require('@langchain/core/prompts');
    ChatPromptTemplate.fromMessages = jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        invoke: mockInvoke,
      }),
    });

    provider = new GroqProvider(mockApiKey);
  });

  describe('constructor', () => {
    it('should initialize with API key', () => {
      expect(() => new GroqProvider(mockApiKey)).not.toThrow();
    });

    it('should throw error if API key is empty', () => {
      expect(() => new GroqProvider('')).toThrow('Groq API key is required');
    });
  });

  describe('generateReply', () => {
    it('should call LangChain with correct parameters', async () => {
      mockInvoke.mockResolvedValue({ content: 'AI response' });

      await provider.generateReply('Hello');

      expect(mockInvoke).toHaveBeenCalledWith({ 
        input: 'Hello',
        chat_history: []
      });
    });

    it('should include FAQ knowledge in system prompt', async () => {
      mockInvoke.mockResolvedValue({ content: 'AI response' });

      await provider.generateReply('What is your shipping policy?');

      // Verify ChatPromptTemplate was created with system message
      const { ChatPromptTemplate } = require('@langchain/core/prompts');
      expect(ChatPromptTemplate.fromMessages).toHaveBeenCalled();
      
      const callArgs = (ChatPromptTemplate.fromMessages as jest.Mock).mock.calls[0]?.[0] as any[];
      const systemMessage = callArgs?.find((msg: any) => msg[0] === 'system');
      
      expect(systemMessage).toBeDefined();
      expect(systemMessage[1]).toContain('QuickShop E-commerce');
      expect(systemMessage[1]).toContain('Free on orders $50+');
      expect(systemMessage[1]).toContain('30-day free return policy');
    });

    it('should return string response from LLM', async () => {
      mockInvoke.mockResolvedValue({ content: 'Test reply from AI' });

      const result = await provider.generateReply('Hello');

      expect(result).toBe('Test reply from AI');
    });

    it('should handle API timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      mockInvoke.mockRejectedValue(timeoutError);

      await expect(provider.generateReply('Hello')).rejects.toThrow(LLMServiceError);
    });

    it('should handle invalid API key errors', async () => {
      const authError = new Error('Invalid API key');
      mockInvoke.mockRejectedValue(authError);

      await expect(provider.generateReply('Hello')).rejects.toThrow(LLMServiceError);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      mockInvoke.mockRejectedValue(rateLimitError);

      await expect(provider.generateReply('Hello')).rejects.toThrow(LLMServiceError);
    });

    it('should wrap errors in LLMServiceError', async () => {
      const originalError = new Error('LangChain error');
      mockInvoke.mockRejectedValue(originalError);

      try {
        await provider.generateReply('Hello');
        throw new Error('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(LLMServiceError);
        if (error instanceof LLMServiceError) {
          expect(error.originalError).toBe(originalError);
        }
      }
    });

    it('should handle missing response content', async () => {
      mockInvoke.mockResolvedValue({ content: undefined });

      await expect(provider.generateReply('Hello')).rejects.toThrow(LLMServiceError);
    });

    it('should handle empty response content', async () => {
      mockInvoke.mockResolvedValue({ content: '' });

      await expect(provider.generateReply('Hello')).rejects.toThrow(LLMServiceError);
    });
  });

  describe('generateReply with Context', () => {
    it('should include conversation history in LLM call', async () => {
      const history = [
        { role: 'user' as const, content: 'What is your return policy?' },
        { role: 'assistant' as const, content: 'We offer 30-day returns.' },
      ];

      mockInvoke.mockResolvedValue({ content: 'Anything else?' });

      await provider.generateReply('Do you ship to Canada?', history);

      expect(mockInvoke).toHaveBeenCalledWith({ 
        input: 'Do you ship to Canada?',
        chat_history: [
          ['human', 'What is your return policy?'],
          ['ai', 'We offer 30-day returns.']
        ]
      });
    });

    it('should work without conversation history (empty array)', async () => {
      mockInvoke.mockResolvedValue({ content: 'Hello!' });

      await provider.generateReply('Hi', []);

      expect(mockInvoke).toHaveBeenCalledWith({ 
        input: 'Hi',
        chat_history: [] 
      });
    });

    it('should work when history is undefined (backwards compatibility)', async () => {
      mockInvoke.mockResolvedValue({ content: 'Hello!' });

      await provider.generateReply('Hi');

      expect(mockInvoke).toHaveBeenCalledWith({ 
        input: 'Hi',
        chat_history: [] 
      });
    });

    it('should preserve message roles in history', async () => {
      const history = [
        { role: 'user' as const, content: 'First question' },
        { role: 'assistant' as const, content: 'First answer' },
        { role: 'user' as const, content: 'Second question' },
        { role: 'assistant' as const, content: 'Second answer' },
      ];

      mockInvoke.mockResolvedValue({ content: 'Response' });

      await provider.generateReply('Third question', history);

      const callArgs = mockInvoke.mock.calls[0]?.[0];
      expect((callArgs as any).chat_history).toEqual([
        ['human', 'First question'],
        ['ai', 'First answer'],
        ['human', 'Second question'],
        ['ai', 'Second answer']
      ]);
    });

    it('should handle context with multiple exchanges', async () => {
      const history = [
        { role: 'user' as const, content: 'Q1' },
        { role: 'assistant' as const, content: 'A1' },
        { role: 'user' as const, content: 'Q2' },
        { role: 'assistant' as const, content: 'A2' },
        { role: 'user' as const, content: 'Q3' },
        { role: 'assistant' as const, content: 'A3' },
      ];

      mockInvoke.mockResolvedValue({ content: 'Response' });

      await provider.generateReply('Q4', history);

      expect(mockInvoke).toHaveBeenCalledWith({ 
        input: 'Q4',
        chat_history: [
          ['human', 'Q1'],
          ['ai', 'A1'],
          ['human', 'Q2'],
          ['ai', 'A2'],
          ['human', 'Q3'],
          ['ai', 'A3']
        ]
      });
    });
  });
});
