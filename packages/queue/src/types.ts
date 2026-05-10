import type { LLMMessage, LLMProvider } from "@ai-platform/shared";

export interface ChatJobData {
    jobId: string;
    messages: LLMMessage[];
    provider?: LLMProvider;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    stop?: string | null;
}

export interface ChatJobResult {
    jobId: string;
    response: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    latencyMs: number;
}