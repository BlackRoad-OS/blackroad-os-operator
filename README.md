# BlackRoad OS — Operator Engine

## Short Description

Background workers, schedulers, and AI agent orchestration engine.

## Long Description

Operator Engine is the automation heart of BlackRoad OS — running jobs, queues, schedulers, system-level background processes, and multi-agent workflows. It integrates with Lucidia, coordinates actions across Core and API, and ensures deterministic task execution.

## Structured Table

| Field          | Value                                      |
| -------------- | ------------------------------------------ |
| **Purpose**    | Background jobs, schedulers, orchestration |
| **Depends On** | API Gateway                                |
| **Used By**    | Core, Prism, Lucidia Agents                |
| **Owner**      | Cece (Operator group)                      |
| **Status**     | High-priority active                       |

## Runtime Layout

This repository now exposes two entrypoints:

- **agents-api** – HTTP surface for webhooks, agent triggers, and control-plane endpoints.
- **agents-worker** – background worker process for queues, flows, and scheduled jobs.

Supporting libraries:

- `src/config.ts` – centralized environment configuration.
- `src/lib/db.ts` – Postgres pool wiring for the `agents-db` database.
- `src/lib/queue.ts` – Redis connector for the optional `agents-queue`.
- `src/lib/logger.ts` – structured JSON logging with level + environment metadata.

## Environment Variables

| Variable            | Description                                                      |
| ------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`          | `development` / `staging` / `production`                         |
| `PORT`              | HTTP port for `agents-api`                                       |
| `DATABASE_URL`      | Postgres connection string for `agents-db`                       |
| `REDIS_URL`         | Redis connection string for `agents-queue` (optional)            |
| `CORE_API_URL`      | URL of the Core backend for the current environment              |
| `PUBLIC_AGENTS_URL` | Public URL of the agents API in the current environment          |
| `LOG_LEVEL`         | `debug` / `info` / `warn` / `error`                              |
| `APP_VERSION`       | Optional override for application version                        |
| `GIT_COMMIT`        | Git commit SHA (Railway also exposes `RAILWAY_GIT_COMMIT_SHA`)    |
| `BUILD_TIME`        | Build timestamp if provided                                      |

## Local Development

```bash
npm install
npm run build
NODE_ENV=development DATABASE_URL=postgres://... CORE_API_URL=http://localhost:4000 PUBLIC_AGENTS_URL=http://localhost:3000 npm run start:api
```

- Health check: `GET /health`
- Version: `GET /version`

Run the worker:

```bash
NODE_ENV=development DATABASE_URL=postgres://... CORE_API_URL=http://localhost:4000 PUBLIC_AGENTS_URL=http://localhost:3000 npm run start:worker
```

## Deployment (Railway)

Project: **blackroad-agents**

Services in this repo:

- `agents-api` (HTTP service)
- `agents-worker` (background worker)

Supporting services:

- `agents-db` (Postgres): stores agent runs, tasks, logs, and state.
- `agents-queue` (Redis, optional): used for job queues, delayed tasks, and flow orchestration.

Environment mapping:

- **dev**
  - `PUBLIC_AGENTS_URL` = dev Railway URL or `https://dev.agents.blackroad.systems`
  - `CORE_API_URL` = core dev Railway URL
- **staging**
  - `PUBLIC_AGENTS_URL` = `https://staging.agents.blackroad.systems`
  - `CORE_API_URL` = `https://staging.core.blackroad.systems`
- **prod**
  - `PUBLIC_AGENTS_URL` = `https://agents.blackroad.systems`
  - `CORE_API_URL` = `https://core.blackroad.systems`

Deployments are handled via GitHub Actions (`.github/workflows/deploy-agents.yml`) using Railway. Each push to `dev`, `staging`, or `main` builds the project, deploys both services, and performs a `/health` check against the environment URL.
