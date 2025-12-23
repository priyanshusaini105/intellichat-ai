import { jest } from '@jest/globals';
import type { ILLMProvider } from '../../src/integrations/llm/llm.interface.js';

/**
 * Create a mocked LLM provider for testing
 */
export function createMockLLMProvider(): jest.Mocked<ILLMProvider> {
  return {
    generateReply: jest.fn<any>(),
  };
}
