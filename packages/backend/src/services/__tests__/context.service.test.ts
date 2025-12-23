import { describe, it, expect, beforeEach } from '@jest/globals';
import { ContextService } from '../context.service.js';
import type { Message } from '@prisma/client';

describe('ContextService', () => {
  let service: ContextService;

  beforeEach(() => {
    service = new ContextService();
  });

  describe('formatForLLM', () => {
    it('should format messages in Langchain-compatible format', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Hello', 
          timestamp: new Date() 
        },
        { 
          id: '2', 
          conversationId: 'c1', 
          sender: 'ai', 
          content: 'Hi there!', 
          timestamp: new Date() 
        },
        { 
          id: '3', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'How are you?', 
          timestamp: new Date() 
        },
      ];

      const result = service.formatForLLM(messages);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ]);
    });

    it('should handle empty message history', () => {
      const result = service.formatForLLM([]);
      expect(result).toEqual([]);
    });

    it('should map "ai" sender to "assistant" role', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'ai', 
          content: 'Test', 
          timestamp: new Date() 
        },
      ];

      const result = service.formatForLLM(messages);
      expect(result[0]!.role).toBe('assistant');
    });

    it('should map "user" sender to "user" role', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Test', 
          timestamp: new Date() 
        },
      ];

      const result = service.formatForLLM(messages);
      expect(result[0]!.role).toBe('user');
    });

    it('should preserve message order', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'First', 
          timestamp: new Date() 
        },
        { 
          id: '2', 
          conversationId: 'c1', 
          sender: 'ai', 
          content: 'Second', 
          timestamp: new Date() 
        },
        { 
          id: '3', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Third', 
          timestamp: new Date() 
        },
      ];

      const result = service.formatForLLM(messages);
      
      expect(result[0]!.content).toBe('First');
      expect(result[1]!.content).toBe('Second');
      expect(result[2]!.content).toBe('Third');
    });

    it('should preserve message content exactly', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'What is your return policy?', 
          timestamp: new Date() 
        },
      ];

      const result = service.formatForLLM(messages);
      expect(result[0]!.content).toBe('What is your return policy?');
    });
  });

  describe('limitContext', () => {
    it('should limit messages to specified count', () => {
      const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        conversationId: 'c1',
        sender: i % 2 === 0 ? 'user' : 'ai',
        content: `Message ${i}`,
        timestamp: new Date(Date.now() + i * 1000),
      }));

      const result = service.limitContext(messages, 5);
      expect(result).toHaveLength(5);
    });

    it('should return all messages if under limit', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Test', 
          timestamp: new Date() 
        },
      ];

      const result = service.limitContext(messages, 5);
      expect(result).toHaveLength(1);
    });

    it('should keep most recent messages when limiting', () => {
      const messages: Message[] = [
        { 
          id: '1', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Old', 
          timestamp: new Date('2025-01-01') 
        },
        { 
          id: '2', 
          conversationId: 'c1', 
          sender: 'user', 
          content: 'Recent', 
          timestamp: new Date('2025-01-02') 
        },
      ];

      const result = service.limitContext(messages, 1);
      expect(result[0]!.content).toBe('Recent');
    });

    it('should handle empty array', () => {
      const result = service.limitContext([], 5);
      expect(result).toEqual([]);
    });

    it('should keep last N messages in order', () => {
      const messages: Message[] = [
        { id: '1', conversationId: 'c1', sender: 'user', content: 'Msg 1', timestamp: new Date('2025-01-01T10:00:00Z') },
        { id: '2', conversationId: 'c1', sender: 'ai', content: 'Msg 2', timestamp: new Date('2025-01-01T10:00:01Z') },
        { id: '3', conversationId: 'c1', sender: 'user', content: 'Msg 3', timestamp: new Date('2025-01-01T10:00:02Z') },
        { id: '4', conversationId: 'c1', sender: 'ai', content: 'Msg 4', timestamp: new Date('2025-01-01T10:00:03Z') },
        { id: '5', conversationId: 'c1', sender: 'user', content: 'Msg 5', timestamp: new Date('2025-01-01T10:00:04Z') },
      ];

      const result = service.limitContext(messages, 3);
      
      expect(result).toHaveLength(3);
      expect(result[0]!.content).toBe('Msg 3');
      expect(result[1]!.content).toBe('Msg 4');
      expect(result[2]!.content).toBe('Msg 5');
    });
  });
});
