import type { ILLMClient, LLMConfig } from "@ai-platform/shared";
import { GroqClient } from "./providers/groq.js";
import { AnthropicClient } from "./providers/anthropic.js";
import { OpenAIClient } from "./providers/openai.js";

export function createLLMClient(config: LLMConfig): ILLMClient {
    switch (config.provider) {
        case "groq":
            return new GroqClient(config);
        case "anthropic":
            return new AnthropicClient(config);
        case "openai":
            return new OpenAIClient(config);
        default:
            throw new Error(`Unsupported provider: ${config.provider}`);
    }
}

export function createDefaultClient(): ILLMClient {
    const provider = (process.env.LLM_DEFAULT_PROVIDER ?? "groq") as LLMConfig["provider"];
    const model = process.env.LLM_DEFAULT_MODEL ?? "llama-3.3-70b-versatile";

    return createLLMClient({ provider, model });
}