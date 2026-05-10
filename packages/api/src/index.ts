import "dotenv/config";
import express from "express";
import { chatRouter } from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.get("/health", (_, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/v1/chat", chatRouter);

app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
});