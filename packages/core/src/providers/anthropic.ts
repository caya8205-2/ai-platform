import Anthropic from "@anthropic-ai/sdk";
import type { ILLMClient, LLMConfig, LLMMessage, LLMResponse } from "@ai-platform/shared";

type AnthropicMessage = { role: "user" | "assistant"; content: string };

function filterMessages(messages: LLMMessage[]): AnthropicMessage[] {
    return messages
        .filter((m) => m.role !== "system")
        .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
}

export class AnthropicClient implements ILLMClient {
    private client: Anthropic;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        this.config = config;
        this.client = new Anthropic({
            apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY,
        });
    }

    async chat(messages: LLMMessage[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
        const start = Date.now();
        const cfg = { ...this.config, ...options };
        const systemMsg = messages.find((m) => m.role === "system")?.content;

        const res = await this.client.messages.create({
            model: cfg.model,
            max_tokens: cfg.maxTokens ?? 1024,
            temperature: cfg.temperature ?? 0.7,
            top_p: cfg.topP ?? 1,
            ...(cfg.stop && { stop_sequences: [cfg.stop] }),
            ...(systemMsg && { system: systemMsg }),
            messages: filterMessages(messages),
        });

        const block = res.content[0];
        const text = block.type === "text" ? block.text : "";

        return {
            id: res.id,
            provider: "anthropic",
            model: res.model,
            message: { role: "assistant", content: text },
            usage: {
                promptTokens: res.usage.input_tokens,
                completionTokens: res.usage.output_tokens,
                totalTokens: res.usage.input_tokens + res.usage.output_tokens,
            },
            latencyMs: Date.now() - start,
        };
    }

    async *stream(messages: LLMMessage[], options?: Partial<LLMConfig>): AsyncGenerator<string> {
        const cfg = { ...this.config, ...options };
        const systemMsg = messages.find((m) => m.role === "system")?.content;

        const stream = await this.client.messages.stream({
            model: cfg.model,
            max_tokens: cfg.maxTokens ?? 1024,
            temperature: cfg.temperature ?? 0.7,
            top_p: cfg.topP ?? 1,
            ...(cfg.stop && { stop_sequences: [cfg.stop] }),
            ...(systemMsg && { system: systemMsg }),
            messages: filterMessages(messages),
        });

        for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                yield chunk.delta.text;
            }
        }
    }
}