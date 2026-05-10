ai-platform/
├── packages/
│   ├── core/           → Unified LLM client (Anthropic, OpenAI, Groq)
│   ├── api/            → REST API / Express server
│   ├── queue/          → Job queue (BullMQ + Redis)
│   └── shared/         → Types, utils, constants (shared semua package)
├── apps/
│   └── dashboard/      → Minimal FE (plain HTML atau simple React)
├── pnpm-workspace.yaml
├── package.json        → root (dev dependencies, scripts)
├── tsconfig.base.json  → shared TS config
├── .env.example
└── README.md