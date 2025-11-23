# BlackRoad OS – Operator

`blackroad-os-operator` is the automation runtime for BlackRoad OS. It supervises agents, manages jobs, and emits domain events / journal entries through an internal HTTP API that is consumed by `blackroad-os-api`.

## Purpose
- Run and supervise agents from `blackroad-os-core`
- Enqueue and dispatch jobs with a lightweight worker runtime
- Emit `DomainEvent` objects and journal entries for RoadChain pipelines
- Provide internal-only HTTP endpoints under `/internal/*`

This service participates in the shared GitHub project **"BlackRoad OS - Master Orchestration"** alongside sibling repos such as `blackroad-os-core` (upstream) and `blackroad-os-api` (downstream).

## Getting Started
Install dependencies and start the development server:

```bash
npm install
npm run dev
```

### Environment Variables
- `PORT` (default `4100`)
- `LOG_LEVEL` (default `info`)
- `MAX_CONCURRENT_JOBS` (default `4`)
- `EVENT_BUFFER_SIZE` (default `200`)

## Running in Production
Build then start the compiled server:

```bash
npm run build
npm start
```

## Internal HTTP API
All routes are prefixed with `/internal`:

- `GET /internal/health` – runtime health including worker status and queue stats
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
