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
- `BR_OS_OPERATOR_VERSION` (for `/version`)
- `BR_OS_OPERATOR_COMMIT` (for `/version`)
- `BR_OS_ENV` (environment name: `local`, `staging`, `prod`)
- `LOG_LEVEL` (pino log level)

### HTTP API
- `GET /health` → liveness check
- `GET /ready` → readiness check
- `GET /version` → build metadata

### Jobs and schedulers
- Queues are created via a shared Redis connection (`getQueue(name)`).
- `sample.job.ts` registers a stub processor that logs incoming payloads.
- `heartbeat.scheduler.ts` enqueues a `heartbeat` job every 5 minutes with `{ ts }`.

### Docker
Build and run the container:
```bash
docker build -f Dockerfile -t blackroad/operator:0.0.1 .
docker run -e REDIS_URL=redis://... -p 4000:4000 blackroad/operator:0.0.1
```

### Testing & linting
```bash
pnpm lint
pnpm test
```

## Internal HTTP API
All routes are prefixed with `/internal`:

- `GET /internal/health` – runtime health including worker status and queue stats
- `GET /internal/version` – build metadata (service, version, git SHA, uptime)
- `GET /internal/agents` – list registered agents (supports `status` and `q` filters)
- `GET /internal/agents/:id` – fetch a single agent
- `POST /internal/jobs` – enqueue a job `{ type, agentId?, input? }`
- `GET /internal/jobs/:id` – fetch job status
- `GET /internal/events` – recent domain events (optional `limit`)

## Architecture
- **Express app** defined in `src/app.ts` wires middleware and routes.
- **Config** in `src/config.ts` reads typed settings from the environment.
- **AgentRegistry** (`src/runtime/agentRegistry.ts`) hosts agents with metadata/state.
- **Job queue + worker** (`src/runtime/jobQueue.ts`, `src/runtime/worker.ts`) handle job lifecycle and dispatch.
- **Event bus** (`src/events/eventBus.ts`) emits and buffers recent events.
- **Journal store** (`src/integrations/journalStore.ts`) currently uses an in-memory implementation.

See `docs/OPERATOR_RUNTIME_OVERVIEW.md` for a brief runtime walkthrough.

### Production build
```bash
pnpm build
pnpm start
```

### TODOs for next iterations
- TODO(op-next): agent auto-registration
- TODO(op-next): authentication and request signing
- TODO(op-next): multi-queue orchestration policies


## Agent catalog operator

The operator now sources agent registrations from `agent-catalog/agents.yaml` (override via `CATALOG_PATH`). The catalog file is parsed on startup and hot-reloaded on changes. Key HTTP routes:

- `GET /agents` – returns the full catalog JSON.
- `GET /agents/{id}` – returns a single agent or 404 when missing.
- `GET /health` – includes `catalog: "ok"` when the YAML parses without errors.

Each response includes version headers:
- `X-Agent-Operator-Version` – git SHA for this service.
- `X-Catalog-Version` – first seven characters of the catalog file SHA.

When running in containers, the default catalog path is `/app/agent-catalog/agents.yaml`; mount an override directory at `/app/agent-catalog` to supply a different catalog in production deployments.
