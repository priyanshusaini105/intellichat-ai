import dotenv from 'dotenv';

// Load environment variables from .env file (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

export interface EnvConfig {
  groqApiKey: string;
  port: number;
  nodeEnv: string;
  databaseUrl: string;
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

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL is required');
  }

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    groqApiKey: groqApiKey.trim(),
    databaseUrl: databaseUrl.trim(),
    port,
    nodeEnv,
  };
}
