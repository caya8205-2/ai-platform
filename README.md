# ai-platform

Monorepo yang menyediakan unified interface untuk berbagai LLM provider (Groq, Anthropic, OpenAI) lengkap dengan REST API, async job queue, dan developer dashboard.

## Packages

| Package | Deskripsi |
|---|---|
| `@ai-platform/shared` | Shared types dan interfaces |
| `@ai-platform/core` | Unified LLM client (Groq, Anthropic, OpenAI) |
| `@ai-platform/api` | REST API server (Express) |
| `@ai-platform/queue` | Async job queue (BullMQ + Redis) |
| `@ai-platform/dashboard` | Developer dashboard (React + Vite) |

## Stack

- **Runtime**: Node.js v20+
- **Bahasa**: TypeScript 5 (ESM, NodeNext)
- **Package Manager**: pnpm (workspace monorepo)
- **API**: Express 4
- **Queue**: BullMQ + Redis
- **Dashboard**: React 18 + Vite 5 + Recharts

## Cara Memulai

### Prasyarat

- Node.js v20+
- pnpm v9+
- Redis (lokal atau via WSL/Docker)

### Instalasi

```bash
git clone https://github.com/your-username/ai-platform.git
cd ai-platform
pnpm install
```

### Environment

Salin `.env.example` ke `packages/api/.env` lalu isi API key kamu:

```bash
cp .env.example packages/api/.env
```

```env
GROQ_API_KEY=your_groq_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
OPENAI_API_KEY=your_openai_api_key

LLM_DEFAULT_PROVIDER=groq
LLM_DEFAULT_MODEL=llama-3.3-70b-versatile

PORT=3000
REDIS_URL=redis://localhost:6379
```

### Menjalankan

Jalankan semua service sekaligus:

```bash
pnpm dev
```

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| Dashboard | http://localhost:5173 |

## API Endpoints

### `POST /v1/chat`

Chat completion secara sinkron.

```json
{
  "messages": [
    { "role": "system", "content": "Kamu adalah asisten yang membantu." },
    { "role": "user", "content": "Halo!" }
  ],
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "temperature": 1,
  "maxTokens": 1024
}
```

Mode async — request masuk ke queue, mengembalikan `jobId`:

```json
{
  "messages": [...],
  "async": true
}
```

### `POST /v1/chat/stream`

Streaming response via Server-Sent Events (SSE).

### `GET /v1/chat/job/:jobId`

Cek status dan hasil job async.

### `GET /health`

Health check.

## Dashboard

Dashboard di `localhost:5173` terdiri dari:

- **Playground** — test semua provider dan model dengan dukungan system prompt, temperature, max tokens, dan streaming
- **Job Queue** — kirim async job dan pantau statusnya secara real-time
- **Stats** — monitor penggunaan token, latency, dan jumlah request per provider

## Struktur Project

```
ai-platform/
├── apps/
│   └── dashboard/          # React + Vite frontend
├── packages/
│   ├── shared/             # Shared types (LLMConfig, LLMMessage, dll)
│   ├── core/               # LLM provider clients + factory
│   ├── api/                # Express REST API
│   └── queue/              # BullMQ worker + queue
├── .env.example
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Lisensi

MIT