import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getEnvConfig', () => {
    it('should return config with all required environment variables', () => {
      process.env.GROQ_API_KEY = 'test-key-123';
      process.env.PORT = '3000';
      process.env.NODE_ENV = 'development';

      const { getEnvConfig } = require('../env');
      const config = getEnvConfig();

      expect(config.groqApiKey).toBe('test-key-123');
      expect(config.port).toBe(3000);
      expect(config.nodeEnv).toBe('development');
    });

    it('should throw error if GROQ_API_KEY is missing', () => {
      const originalKey = process.env.GROQ_API_KEY;
      delete process.env.GROQ_API_KEY;
      delete process.env.OPENAI_API_KEY;

      // Force module reload to pick up env changes
      jest.resetModules();
      const { getEnvConfig } = require('../env');
      
      expect(() => getEnvConfig()).toThrow('GROQ_API_KEY is required');
      
      // Restore
      process.env.GROQ_API_KEY = originalKey;
    });

    it('should throw error if GROQ_API_KEY is empty string', () => {
      process.env.GROQ_API_KEY = '';

      const { getEnvConfig } = require('../env');
      
      expect(() => getEnvConfig()).toThrow('GROQ_API_KEY is required');
    });

    it('should use default port 3001 if PORT not specified', () => {
      process.env.GROQ_API_KEY = 'test-key';
      delete process.env.PORT;

      const { getEnvConfig } = require('../env');
      const config = getEnvConfig();

      expect(config.port).toBe(3001);
    });

    it('should use default NODE_ENV as development', () => {
      process.env.GROQ_API_KEY = 'test-key';
      delete process.env.NODE_ENV;

      const { getEnvConfig } = require('../env');
      const config = getEnvConfig();

      expect(config.nodeEnv).toBe('development');
    });

    it('should parse PORT as number', () => {
      process.env.GROQ_API_KEY = 'test-key';
      process.env.PORT = '8080';

      const { getEnvConfig } = require('../env');
      const config = getEnvConfig();

      expect(typeof config.port).toBe('number');
      expect(config.port).toBe(8080);
    });
  });
});
