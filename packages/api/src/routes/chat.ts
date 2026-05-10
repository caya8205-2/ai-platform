import { Router, type Request, type Response, type Router as RouterType } from "express";
import { z } from "zod";
import { createLLMClient, createDefaultClient } from "@ai-platform/core";
import { chatQueue } from "@ai-platform/queue";
import { randomUUID } from "crypto";

export const chatRouter: RouterType = Router();

const chatSchema = z.object({
    messages: z.array(
        z.object({
            role: z.enum(["user", "assistant", "system"]),
            content: z.string(),
        })
    ),
    provider: z.enum(["groq", "anthropic", "openai"]).optional(),
    model: z.string().optional(),
    maxTokens: z.number().optional(),
    temperature: z.number().optional(),
    topP: z.number().optional(),
    stop: z.string().nullable().optional(),
    async: z.boolean().optional().default(false),
});

// POST /v1/chat — sync response
chatRouter.post("/", async (req: Request, res: Response) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { messages, provider, model, maxTokens, temperature, topP, stop, async: isAsync } = parsed.data;

    // async mode — dispatch ke queue
    if (isAsync) {
        const jobId = randomUUID();
        await chatQueue.add("chat", { jobId, messages, provider, model, maxTokens, temperature, topP, stop });
        res.status(202).json({ jobId, status: "queued" });
        return;
    }

    // sync mode — langsung call LLM
    try {
        const client = provider
            ? createLLMClient({ provider, model: model ?? "llama-3.3-70b-versatile" })
            : createDefaultClient();

        const result = await client.chat(messages, { maxTokens, temperature, topP, stop });
        res.json(result);
    } catch (err) {
        console.error("LLM Call Error:", err);
        const msg = err instanceof Error ? err.message : "Unknown error";
        res.status(500).json({ error: msg });
    }
});

// GET /v1/chat/job/:jobId — cek status job
chatRouter.get("/job/:jobId", async (req: Request, res: Response) => {
    const job = await chatQueue.getJob(req.params.jobId);
    if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
    }

    const state = await job.getState();
    const result = job.returnvalue;

    res.json({ jobId: job.id, state, result: result ?? null });
});

// POST /v1/chat/stream — SSE streaming
chatRouter.post("/stream", async (req: Request, res: Response) => {
    const parsed = chatSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const { messages, provider, model, maxTokens, temperature, topP, stop } = parsed.data;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const client = provider
            ? createLLMClient({ provider, model: model ?? "llama-3.3-70b-versatile" })
            : createDefaultClient();

        for await (const chunk of client.stream(messages, { maxTokens, temperature, topP, stop })) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        res.write("data: [DONE]\n\n");
        res.end();
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
    }
});