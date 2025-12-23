import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import { validateChatMessage, ChatMessageSchema } from '../chat.validation.js';
import { ValidationError } from '../../../shared/errors/custom-errors.js';

describe('Chat Validation', () => {
  describe('ChatMessageSchema', () => {
    it('should accept valid message', () => {
      const data = { message: 'Hello, how are you?' };
      const result = ChatMessageSchema.parse(data);
      expect(result.message).toBe('Hello, how are you?');
    });

    it('should accept message with optional sessionId', () => {
      const data = {
        message: 'Hello',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = ChatMessageSchema.parse(data);
      expect(result.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should trim whitespace from message', () => {
      const data = { message: '  Hello  ' };
      const result = ChatMessageSchema.parse(data);
      expect(result.message).toBe('Hello');
    });

    it('should reject empty message', () => {
      expect(() => ChatMessageSchema.parse({ message: '' }))
        .toThrow();
    });

    it('should reject whitespace-only message', () => {
      expect(() => ChatMessageSchema.parse({ message: '   ' }))
        .toThrow();
    });

    it('should reject message exceeding max length', () => {
      const longMessage = 'a'.repeat(2001);
      expect(() => ChatMessageSchema.parse({ message: longMessage }))
        .toThrow();
    });

    it('should accept message at max length', () => {
      const message = 'a'.repeat(2000);
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toHaveLength(2000);
    });

    it('should reject invalid UUID sessionId', () => {
      expect(() => ChatMessageSchema.parse({ 
        message: 'Hello', 
        sessionId: 'invalid-uuid' 
      })).toThrow();
    });

    it('should accept emoji and special characters', () => {
      const message = 'Hello 👋 测试 café!';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should reject missing message field', () => {
      expect(() => ChatMessageSchema.parse({}))
        .toThrow();
    });

    it('should accept message with minimum length', () => {
      const message = 'a';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe('a');
    });

    it('should handle multiline messages', () => {
      const message = 'Line 1\nLine 2\nLine 3';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should handle messages with tabs and newlines', () => {
      const message = 'Hello\tworld\nNew line';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should sessionId be optional', () => {
      const data = { message: 'Hello' };
      const result = ChatMessageSchema.parse(data);
      expect(result.sessionId).toBeUndefined();
    });
  });

  describe('validateChatMessage', () => {
    it('should return parsed data for valid message', () => {
      const data = { message: 'Hello' };
      const result = validateChatMessage(data);
      expect(result.message).toBe('Hello');
    });

    it('should throw ValidationError for invalid message', () => {
      expect(() => validateChatMessage({ message: '' }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError with appropriate message', () => {
      try {
        validateChatMessage({ message: '' });
        // If we get here, test should fail
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('empty');
      }
    });

    it('should handle non-object input gracefully', () => {
      expect(() => validateChatMessage(null))
        .toThrow();
    });

    it('should handle undefined input', () => {
      expect(() => validateChatMessage(undefined))
        .toThrow();
    });

    it('should trim whitespace before validation', () => {
      const result = validateChatMessage({ message: '  Hello  ' });
      expect(result.message).toBe('Hello');
    });

    it('should accept valid sessionId in validated data', () => {
      const data = {
        message: 'Hello',
        sessionId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = validateChatMessage(data);
      expect(result.sessionId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with only numbers', () => {
      const message = '12345';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe('12345');
    });

    it('should handle message with special characters', () => {
      const message = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should handle message with URLs', () => {
      const message = 'Check this out: https://example.com';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should handle message with email addresses', () => {
      const message = 'Contact me at test@example.com';
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toBe(message);
    });

    it('should handle message exactly at boundary (1999 chars)', () => {
      const message = 'a'.repeat(1999);
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toHaveLength(1999);
    });

    it('should handle message exactly at boundary (2000 chars)', () => {
      const message = 'a'.repeat(2000);
      const result = ChatMessageSchema.parse({ message });
      expect(result.message).toHaveLength(2000);
    });
  });
});
