export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  role: MessageRole;
  content: string;
}

export interface ChatOptions {
  messages: Message[];
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface ChatResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
  };
}

export interface PromptTemplate {
  name: string;
  description?: string;
  getPrompt: (params?: Record<string, string | number>) => string;
}

export interface AIClientConfig {
  apiKey: string;
  model?: string;
}

export type PromptParams = Record<string, string | number>;
