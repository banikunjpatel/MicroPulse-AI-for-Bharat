import { OpenRouter } from '@openrouter/sdk';
import { getPrompt } from './prompts';
import type { ChatOptions, ChatResponse } from './types';

const DEFAULT_MODEL = 'arcee-ai/trinity-large-preview:free';
const MOCK_RESPONSE = 'This is a mock response. LLM provider is currently disabled.';

class AIClient {
  private client: OpenRouter | null = null;
  private enabled: boolean = false;
  private model: string = DEFAULT_MODEL;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.OPENROUTER_API_KEY;
    this.enabled = process.env.OPENROUTER_ENABLED === 'true';
    this.model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

    if (this.enabled && apiKey) {
      this.client = new OpenRouter({ apiKey });
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getModel(): string {
    return this.model;
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (!this.enabled || !this.client) {
      console.log('[AI Client] OpenRouter is disabled, returning mock response');
      return {
        content: MOCK_RESPONSE,
        usage: undefined,
      };
    }

    const model = options.model || this.model;
    const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }

    messages.push(...options.messages);

    console.log('[AI Client] Sending chat request to OpenRouter');
    console.log('[AI Client] Model:', model);
    console.log('[AI Client] Message count:', messages.length);
    console.log('[AI Client] System prompt length:', options.systemPrompt?.length || 0);

    try {
      const result = this.client.callModel({
        model,
        input: messages,
      });

      console.log('[AI Client] Waiting for response...');

      const content = await result.getText();
      const response = await result.getResponse();

      console.log('[AI Client] Response received');
      console.log('[AI Client] Response content length:', content.length);
      console.log('[AI Client] Usage:', response.usage);

      return {
        content,
        usage: response.usage
          ? {
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              cachedTokens: response.usage.inputTokensDetails?.cachedTokens,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[AI Client] OpenRouter chat error:', error);
      throw error;
    }
  }

  async callModel(options: {
    input: string | { role: 'user' | 'assistant' | 'system'; content: string }[];
    instructions?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }) {
    if (!this.enabled || !this.client) {
      return {
        getText: async () => MOCK_RESPONSE,
        getResponse: async () => ({ usage: undefined }),
        getTextStream: async function* () {},
        getReasoningStream: async function* () {},
        getItemsStream: async function* () {},
        getToolCalls: async () => [],
        getToolCallsStream: async function* () {},
      };
    }

    const model = options.model || this.model;

    return this.client.callModel({
      model,
      ...options,
    });
  }

  async chatWithPrompt(
    promptName: string,
    promptParams: Record<string, string | number> | undefined,
    userMessage: string,
    options?: Omit<ChatOptions, 'messages' | 'systemPrompt'>
  ): Promise<ChatResponse> {
    const systemPrompt = getPrompt(promptName, promptParams);
    return this.chat({
      ...options,
      systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
  }
}

export const ai = new AIClient();
export { getPrompt };
export default ai;
