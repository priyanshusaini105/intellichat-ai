import { jest } from '@jest/globals';

/**
 * Test Setup
 * Global configuration and mocks for Jest test suite
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.GROQ_API_KEY = 'test-api-key';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test?schema=public';

// Global test timeout
jest.setTimeout(10000);
