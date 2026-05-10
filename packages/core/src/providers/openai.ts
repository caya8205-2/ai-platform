import OpenAI from "openai";
import type { ILLMClient, LLMConfig, LLMMessage, LLMResponse } from "@ai-platform/shared";

export class OpenAIClient implements ILLMClient {
    private client: OpenAI;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
        this.client = new OpenAI({
            apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
        });
    }

    async chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
        const start = Date.now();
        const cfg = { ...this.config, ...options };

        const res = await this.client.chat.completions.create({
            model: cfg.model,
            messages,
            max_tokens: cfg.maxTokens ?? 1024,
            temperature: cfg.temperature ?? 0.7,
            top_p: cfg.topP ?? 1,
            stop: cfg.stop ?? null,
        });

        const choice = res.choices[0];

        return {
            id: res.id,
            provider: "openai",
            model: res.model,
            message: {
                role: "assistant",
                content: choice.message.content ?? "",
            },
            usage: {
                promptTokens: res.usage?.prompt_tokens ?? 0,
                completionTokens: res.usage?.completion_tokens ?? 0,
                totalTokens: res.usage?.total_tokens ?? 0,
            },
            latencyMs: Date.now() - start,
        };
    }

    async *stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string> {
        const cfg = { ...this.config, ...options };

        const stream = await this.client.chat.completions.create({
            model: cfg.model,
            messages,
            max_tokens: cfg.maxTokens ?? 1024,
            temperature: cfg.temperature ?? 0.7,
            top_p: cfg.topP ?? 1,
            stop: cfg.stop ?? null,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) yield content;
        }
    }
}