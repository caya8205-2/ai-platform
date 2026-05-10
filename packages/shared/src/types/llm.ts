export type LLMProvider = "groq" | "anthropic" | "openai";

export interface LLMMessage {
    role: "user" | "assistant" | "system";
    content: string;
}

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string | null;
}

export interface LLMResponse {
    id: string;
    provider: LLMProvider;
    model: string;
    message: LLMMessage;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
}

export interface ILLMClient {
    chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse>;
    stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string>;
}