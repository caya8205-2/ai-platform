import { Worker } from "bullmq";
import { createLLMClient, createDefaultClient } from "@ai-platform/core";
import type { ChatJobData, ChatJobResult } from "./types.js";

export function createChatWorker(redisUrl: string) {
    const worker = new Worker<ChatJobData, ChatJobResult>(
        "chat",
        async (job) => {
            const { messages, provider, model, maxTokens, temperature, topP, stop } = job.data;

            const client = provider
                ? createLLMClient({ provider, model: model ?? "llama-3.3-70b-versatile" })
                : createDefaultClient();

            const result = await client.chat(messages, { maxTokens, temperature, topP, stop });

            return {
                jobId: job.data.jobId,
                response: result.message.content,
                usage: result.usage,
                latencyMs: result.latencyMs,
            };
        },
        {
            connection: { url: redisUrl },
            concurrency: 5,
        }
    );

    worker.on("completed", (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
        console.error(`Job ${job?.id} failed:`, err.message);
    });

    return worker;
}