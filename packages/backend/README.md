# IntelliChat AI Backend - V0

Minimal viable chat API with OpenAI integration and comprehensive test coverage.

## Features

- **POST /api/chat** - Send messages and receive AI-powered responses
- LangChain integration with OpenAI GPT-3.5 Turbo
- Prompt engineering with ChatPromptTemplate
- Hardcoded FAQ knowledge base for QuickShop E-commerce
- Input validation and error handling
- 85%+ test coverage with Jest

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **LLM Integration**: LangChain with OpenAI (GPT-3.5 Turbo)
- **Testing**: Jest, ts-jest, Supertest
- **Package Manager**: pnpm

## Project Structure

```
src/
├── config/                 # Environment configuration
│   ├── env.ts
│   └── __tests__/
├── features/              # Feature-based modules
│   └── chat/
│       ├── chat.routes.ts
│       ├── chat.controller.ts
│       ├── chat.types.ts
│       └── __tests__/
├── integrations/          # External service integrations
│   └── llm/
│       ├── llm.interface.ts
│       ├── openai.provider.ts
│       └── __tests__/
├── shared/                # Shared utilities
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   └── __tests__/
│   └── errors/
│       └── custom-errors.ts
├── app.ts                 # Express app setup
└── server.ts              # Server entry point
```

## Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key:

```
OPENAI_API_KEY=sk-your-actual-api-key-here
PORT=3001
NODE_ENV=development
```

### 3. Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### 4. Start Development Server

```bash
pnpm dev
```

The server will start on `http://localhost:3001`

### 5. Start Production Server

```bash
pnpm start
```

## API Documentation

### Health Check

**GET** `/health`

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": 1703340000000
}
```

### Send Chat Message

**POST** `/api/chat`

Send a message and receive an AI-powered response.

**Request Body:**
```json
{
  "message": "What is your shipping policy?"
}
```

**Success Response (200):**
```json
{
  "reply": "We offer free shipping on orders $50 and above. Standard delivery takes 3-5 business days."
}
```

**Error Response (400 - Validation Error):**
```json
{
  "error": "Message cannot be empty"
}
```

**Error Response (500 - Server Error):**
```json
{
  "error": "Failed to process request"
}
```

## FAQ Knowledge Base

The AI is pre-configured with knowledge about QuickShop E-commerce:

- **Store Name**: QuickShop E-commerce
- **Shipping**: Free on orders $50+, 3-5 business days delivery
- **Returns**: 30-day free return policy
- **Support Hours**: Mon-Fri 9AM-6PM EST
- **Payment**: Visa, Mastercard, PayPal, Apple Pay accepted

## Testing

The project follows Test-Driven Development (TDD) practices:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test API endpoints with mocked dependencies
- **Coverage Target**: 80% minimum

Run tests before committing:

```bash
pnpm test
```

## Example Usage

### Using cURL

```bash
# Send a chat message
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are your payment options?"}'
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    message: 'What is your return policy?',
  }),
});

const data = await response.json();
console.log(data.reply);
```

## Development Workflow

1. Write tests first (TDD)
2. Implement feature to pass tests
3. Refactor while keeping tests green
4. Run full test suite
5. Commit changes

## Error Handling

The API uses custom error classes:

- **ValidationError** (400): Invalid input
- **LLMServiceError** (500): LLM provider failures
- **Unknown Errors** (500): Unexpected errors

All errors are logged to console with context.

## What's Next (Future Iterations)

V0 focuses on core functionality. Future versions will add:

- Database integration (PostgreSQL + Prisma)
- Conversation history and sessions
- Redis caching
- Rate limiting
- Advanced error recovery
- User authentication

## License

ISC
