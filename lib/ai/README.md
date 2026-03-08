# AI Client - Multi-Provider Support

This AI client supports multiple LLM providers with easy switching via environment variables.

## Supported Providers

1. **OpenRouter** - Access to multiple models via OpenRouter API
2. **AWS Bedrock** - Amazon Bedrock with Nova Lite model
3. **Mock** - Returns mock responses (no API calls)

## Configuration

### Environment Variables

Set the `LLM_PROVIDER` variable in your `.env.local` file:

```bash
# Options: "openrouter", "bedrock", "mock"
LLM_PROVIDER=openrouter
```

### OpenRouter Setup

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-api-key-here
OPENROUTER_MODEL=arcee-ai/trinity-large-preview:free
```

### AWS Bedrock Setup

You can use either a bearer token (Bedrock API Key) or AWS access keys:

**Option 1: Bearer Token (Simpler)**
```bash
LLM_PROVIDER=bedrock
AW_BEDROCK_REGION=us-east-1
AW_BEARER_TOKEN_BEDROCK=your-bedrock-api-key
AW_BEDROCK_MODEL=amazon.nova-lite-v1:0
```

**Option 2: Access Keys**
```bash
LLM_PROVIDER=bedrock
AW_BEDROCK_REGION=us-east-1
AWS_BEDROCK_ACCESS_KEY_ID=your-access-key-id
AWS_BEDROCK_SECRET_ACCESS_KEY=your-secret-access-key
AW_BEDROCK_MODEL=amazon.nova-lite-v1:0
```

### Mock Mode (No API Calls)

```bash
LLM_PROVIDER=mock
```

## Usage

The AI client automatically uses the configured provider:

```typescript
import { ai } from '@/lib/ai';

// Simple chat
const response = await ai.chat({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: 1000,
});

console.log(response.content);
console.log(response.usage);

// Chat with predefined prompt
const response = await ai.chatWithPrompt(
  'forecast-analysis',
  { productName: 'Widget' },
  'Analyze the sales trend',
);

// Check current provider
console.log('Provider:', ai.getProvider()); // 'openrouter' | 'bedrock' | 'mock'
console.log('Model:', ai.getModel());
console.log('Enabled:', ai.isEnabled()); // false for mock mode
```

## AWS Bedrock Models

Available Nova models:
- `amazon.nova-micro-v1:0` - Fastest, lowest cost
- `amazon.nova-lite-v1:0` - Balanced performance (default)
- `amazon.nova-pro-v1:0` - Highest capability

Note: Model IDs may vary by region. Check your AWS Bedrock console for available models.

## Switching Providers

Simply change the `LLM_PROVIDER` environment variable and restart your application:

```bash
# Switch to Bedrock
LLM_PROVIDER=bedrock pnpm dev

# Switch to OpenRouter
LLM_PROVIDER=openrouter pnpm dev

# Use mock mode (no API calls)
LLM_PROVIDER=mock pnpm dev
```

## Error Handling

The client will throw errors if:
- Provider is not properly configured
- API credentials are missing
- API calls fail

Always wrap AI calls in try-catch blocks:

```typescript
try {
  const response = await ai.chat({ messages: [...] });
} catch (error) {
  console.error('AI request failed:', error);
  // Handle error appropriately
}
```
