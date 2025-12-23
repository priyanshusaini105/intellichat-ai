import dotenv from 'dotenv';

// Load environment variables from .env file (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

export interface EnvConfig {
  groqApiKey: string;
  port: number;
  nodeEnv: string;
}

/**
 * Get and validate environment configuration
 * @throws {Error} If required environment variables are missing
 */
export function getEnvConfig(): EnvConfig {
  const groqApiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

  if (!groqApiKey || groqApiKey.trim() === '') {
    throw new Error('GROQ_API_KEY is required');
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    groqApiKey: groqApiKey.trim(),
    port,
    nodeEnv,
  };
}
