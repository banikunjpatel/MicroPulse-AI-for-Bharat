import { OpenRouter } from '@openrouter/sdk';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { AwsCredentialIdentity, AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { getPrompt } from './prompts';
import type { ChatOptions, ChatResponse } from './types';

type LLMProvider = 'openrouter' | 'bedrock' | 'mock';

const DEFAULT_OPENROUTER_MODEL = 'arcee-ai/trinity-large-preview:free';
const DEFAULT_BEDROCK_MODEL = 'us.amazon.nova-lite-v1:0';
const MOCK_RESPONSE = 'This is a mock response. LLM provider is currently disabled.';

class AIClient {
  private openRouterClient: OpenRouter | null = null;
  private bedrockClient: BedrockRuntimeClient | null = null;
  private provider: LLMProvider = 'mock';
  private model: string = '';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const provider = (process.env.LLM_PROVIDER || 'mock') as LLMProvider;
    this.provider = provider;

    console.log(`[AI Client] Initializing with provider: ${provider}`);

    if (provider === 'openrouter') {
      this.initializeOpenRouter();
    } else if (provider === 'bedrock') {
      this.initializeBedrock();
    }
  }

  private initializeOpenRouter(): void {
    const apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;

    if (apiKey) {
      this.openRouterClient = new OpenRouter({ apiKey });
      console.log('[AI Client] OpenRouter initialized with model:', this.model);
    } else {
      console.warn('[AI Client] OpenRouter API key not found');
    }
  }

  private initializeBedrock(): void {
    const region = process.env.AWS_BEDROCK_REGION || 'us-east-1';
    const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const accessKeyId = process.env.AWS_BEDROCK_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_BEDROCK_SECRET_ACCESS_KEY;
    this.model = process.env.AWS_BEDROCK_MODEL || DEFAULT_BEDROCK_MODEL;

    try {
      // Support both bearer token and access key authentication
      if (bearerToken) {
        // Decode the bearer token to extract credentials
        // The token format is: ABSKQmVkcm9ja0FQSUtleS1...
        // This is a Bedrock API Key that needs to be used as a custom credential
        const credentialProvider: AwsCredentialIdentityProvider = async () => {
          // Parse the bearer token - it's base64 encoded
          const decoded = Buffer.from(bearerToken.replace('ABSK', ''), 'base64').toString('utf-8');
          const [key, secret] = decoded.split(':');
          
          return {
            accessKeyId: key || bearerToken,
            secretAccessKey: secret || bearerToken,
          } as AwsCredentialIdentity;
        };

        this.bedrockClient = new BedrockRuntimeClient({
          region,
          credentials: credentialProvider,
        });
        console.log('[AI Client] AWS Bedrock initialized with bearer token');
        console.log('[AI Client] Model:', this.model);
      } else if (accessKeyId && secretAccessKey) {
        // Use access key authentication
        this.bedrockClient = new BedrockRuntimeClient({
          region,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        });
        console.log('[AI Client] AWS Bedrock initialized with access keys');
        console.log('[AI Client] Model:', this.model);
      } else {
        console.warn('[AI Client] AWS Bedrock credentials not found (need either bearer token or access keys)');
      }
    } catch (error) {
      console.error('[AI Client] Failed to initialize Bedrock:', error);
    }
  }

  isEnabled(): boolean {
    return this.provider !== 'mock';
  }

  getProvider(): LLMProvider {
    return this.provider;
  }

  getModel(): string {
    return this.model;
  }

  async chat(options: ChatOptions): Promise<ChatResponse> {
    if (this.provider === 'mock') {
      console.log('[AI Client] Provider is mock, returning mock response');
      return {
        content: MOCK_RESPONSE,
        usage: undefined,
      };
    }

    if (this.provider === 'openrouter') {
      return this.chatWithOpenRouter(options);
    }

    if (this.provider === 'bedrock') {
      return this.chatWithBedrock(options);
    }

    throw new Error(`Unknown provider: ${this.provider}`);
  }

  private async chatWithOpenRouter(options: ChatOptions): Promise<ChatResponse> {
    if (!this.openRouterClient) {
      throw new Error('OpenRouter client not initialized');
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

    try {
      const result = this.openRouterClient.callModel({
        model,
        input: messages,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      const content = await result.getText();
      const response = await result.getResponse();

      console.log('[AI Client] Response received');
      console.log('[AI Client] Response content length:', content.length);

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

  private async chatWithBedrock(options: ChatOptions): Promise<ChatResponse> {
    if (!this.bedrockClient) {
      throw new Error('Bedrock client not initialized');
    }

    const model = options.model || this.model;
    const messages: ConverseCommandInput['messages'] = [];

    // Add messages (system prompt is handled separately in Bedrock)
    for (const msg of options.messages) {
      if (msg.role !== 'system') {
        messages.push({
          role: msg.role,
          content: [{ text: msg.content }],
        });
      }
    }

    console.log('[AI Client] Sending chat request to AWS Bedrock');
    console.log('[AI Client] Model:', model);
    console.log('[AI Client] Message count:', messages.length);

    try {
      const input: ConverseCommandInput = {
        modelId: model,
        messages,
        inferenceConfig: {
          temperature: options.temperature,
          maxTokens: options.maxTokens,
        },
      };

      // Add system prompt if provided
      if (options.systemPrompt) {
        input.system = [{ text: options.systemPrompt }];
      }

      const command = new ConverseCommand(input);
      const response = await this.bedrockClient.send(command);

      const content = response.output?.message?.content?.[0]?.text || '';

      console.log('[AI Client] Response received');
      console.log('[AI Client] Response content length:', content.length);

      return {
        content,
        usage: response.usage
          ? {
              inputTokens: response.usage.inputTokens || 0,
              outputTokens: response.usage.outputTokens || 0,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[AI Client] Bedrock chat error:', error);
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
    if (this.provider === 'mock') {
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

    if (this.provider === 'openrouter' && this.openRouterClient) {
      const model = options.model || this.model;
      const { maxTokens, ...restOptions } = options;
      return this.openRouterClient.callModel({
        model,
        ...restOptions,
      });
    }

    if (this.provider === 'bedrock') {
      // For Bedrock, convert to chat format
      const messages = Array.isArray(options.input)
        ? options.input
        : [{ role: 'user' as const, content: options.input }];

      const response = await this.chat({
        messages,
        systemPrompt: options.instructions,
        model: options.model,
        temperature: options.temperature,
        maxTokens: options.maxTokens,
      });

      return {
        getText: async () => response.content,
        getResponse: async () => ({ usage: response.usage }),
        getTextStream: async function* () {},
        getReasoningStream: async function* () {},
        getItemsStream: async function* () {},
        getToolCalls: async () => [],
        getToolCallsStream: async function* () {},
      };
    }

    throw new Error(`Provider ${this.provider} not properly initialized`);
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
