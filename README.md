# ai-platform

Monorepo yang menyediakan unified interface untuk berbagai LLM provider (Groq, Anthropic, OpenAI) lengkap dengan REST API, async job queue, dan developer dashboard.

## Fitur Utama

- **Unified LLM Interface**: Satu standar untuk Groq, Anthropic, dan OpenAI.
- **Persistent Playground**:
  - **Chat History**: Manajemen sesi otomatis (tersimpan di browser).
  - **Session Management**: Rename, Delete, dan Pin chat penting ke posisi atas.
  - **Bubble Actions**: Fitur Copy, Edit pesan lama, dan Retry request yang gagal langsung dari bubble chat.
  - **Rich Config**: Kendali penuh atas System Prompt, Temperature, Max Tokens, dan Streaming mode.
- **Async Automation**: Sistem antrean (Queue) berbasis BullMQ untuk pemrosesan background task skala besar.
- **Real-time Analytics**: Monitoring penggunaan token, latency, dan distribusi request per provider dengan sistem database JSON yang ringan dan portable.
- **Modern UI/UX**: Desain dashboard 3-kolom yang premium dengan icon SVG minimalis dan dark mode.

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
git clone https://github.com/caya8205-2/ai-platform.git
cd ai-platform
pnpm i
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

> (Kalo error ECONNREFUSED itu berarti redis nya mati, start dulu pake Docker atau WSL)

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

Streaming response via Server-Sent Events (SSE) untuk interaksi real-time.

### `GET /v1/chat/stats`

Ambil data statistik penggunaan (token, latency, provider distribution) dari database JSON.

### `GET /v1/chat/job/:jobId`

Cek status (`waiting`, `active`, `completed`, `failed`) dan hasil dari job asinkron.

### `GET /health`

Health check.

## Dashboard

Dashboard di `localhost:5173` terdiri dari:

- **Playground** — Interface chat interaktif dengan riwayat sesi yang persisten dan fitur edit/retry pesan.
- **Job Queue** — Dashboard antrean untuk memantau proses background task yang sedang berjalan.
- **Stats** — Visualisasi data analitik sistem menggunakan grafik interaktif (Recharts).

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