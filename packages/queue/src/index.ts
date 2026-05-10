import "dotenv/config";
import { Queue } from "bullmq";
import { createChatWorker } from "./worker.js";
import type { ChatJobData, ChatJobResult } from "./types.js";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const chatQueue = new Queue<ChatJobData, ChatJobResult>("chat", {
    connection: { url: REDIS_URL },
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
    },
});

export { createChatWorker };
export type { ChatJobData, ChatJobResult };

// jalanin worker kalo ini entry point langsung
if (process.env.RUN_WORKER === "true") {
    createChatWorker(REDIS_URL);
    console.log(`Chat worker running on port ${process.env.PORT}`);
}