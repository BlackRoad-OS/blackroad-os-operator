# BlackRoad OS Operator Engine · Gen-0

Operator-Gen-0 is a lightweight, headless orchestrator for coordinating agents across BlackRoad OS. It exposes a small Fastify API, a BullMQ queue factory backed by Redis, and a cron-driven heartbeat scheduler.

## Tech baseline
- Node.js 20
- TypeScript 5 (strict)
- Fastify 4.x
- BullMQ + Redis
- node-cron
- Vitest for tests
- ESLint + Prettier

## Getting started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start a local Redis instance (e.g., `redis-server`).
3. Run the dev server:
   ```bash
   pnpm dev
   ```
   The API listens on port 4000 by default.

### Environment
Copy the example environment file and adjust as needed:
```bash
cp operator.env.example .env
```

Key variables:
- `PORT` (default: 4000)
- `REDIS_URL` (e.g., `redis://localhost:6379`)
- `COMMIT_SHA` (for `/version`)
- `LOG_LEVEL` (pino log level)

### HTTP API
- `GET /health` → `{ status: 'ok', uptime }`
- `GET /version` → `{ version: '0.0.1', commit }`

### Jobs and schedulers
- Queues are created via a shared Redis connection (`getQueue(name)`).
- `sample.job.ts` registers a stub processor that logs incoming payloads.
- `heartbeat.scheduler.ts` enqueues a `heartbeat` job every 5 minutes with `{ ts }`.

### Docker
Build and run the container:
```bash
docker build -t blackroad/operator:0.0.1 .
docker run -e REDIS_URL=redis://... -p 4000:4000 blackroad/operator:0.0.1
```

### Testing & linting
```bash
pnpm lint
pnpm test
```

### TODOs for next iterations
- TODO(op-next): agent auto-registration
- TODO(op-next): authentication and request signing
- TODO(op-next): multi-queue orchestration policies

