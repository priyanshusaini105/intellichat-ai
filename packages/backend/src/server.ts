import { createApp } from './app.js';
import { getEnvConfig } from './config/env.js';
import { GroqProvider } from './integrations/llm/groq.provider.js';

// Get configuration
const config = getEnvConfig();

// Initialize dependencies
const llmProvider = new GroqProvider(config.groqApiKey);

// Create app with dependencies
const app = createApp({ llmProvider });

// Start server
app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});
