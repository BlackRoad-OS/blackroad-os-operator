# BlackRoad OS — Operator Engine

## Short Description

Background workers, schedulers, and AI agent orchestration engine.

## Long Description

Operator Engine is the automation heart of BlackRoad OS — running jobs, queues, schedulers, system-level background processes, and multi-agent workflows. It integrates with Lucidia, coordinates actions across Core and API, and ensures deterministic task execution.

## What lives here?

- **Operator (this repo)** – long-lived worker with a simple in-memory queue and HTTP surface for health, version, and job management.
- **Agents API** – external orchestration/control-plane facade that triggers work on the operator.

## Environment Variables

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` / `staging` / `production` |
| `OPERATOR_PORT` | HTTP port for the operator (defaults to `PORT` or `3001`) |
| `CORE_API_URL` | URL of the Core backend for the current environment |
| `AGENTS_API_URL` | URL of the Agents API triggering work on the operator |
| `QUEUE_POLL_INTERVAL_MS` | How frequently to poll the in-memory queue for new jobs |
| `JOB_MAX_ATTEMPTS` | Max attempts per job before marking it failed |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` |
| `APP_VERSION` | Optional override for application version |
| `GIT_COMMIT` | Git commit SHA (Railway also exposes `RAILWAY_GIT_COMMIT_SHA`) |
| `BUILD_TIME` | Build timestamp if provided |
| `DATABASE_URL` | Optional Postgres connection string (disabled if absent) |
| `REDIS_URL` | Optional Redis connection string (disabled if absent) |

## Local Development

Install dependencies and build:

```bash
npm install
npm run build
```

Start the operator with sensible defaults:

```bash
NODE_ENV=development OPERATOR_PORT=3001 CORE_API_URL=http://localhost:4000 AGENTS_API_URL=http://localhost:4100 npm run start:worker
```

HTTP surface:

- `GET /health` – process + queue status
- `GET /version` – version/build metadata
- `GET /jobs/health` – queue status snapshot
- `POST /jobs/enqueue` – enqueue a job: `{"type":"health-check","payload":{"targetUrl":"http://localhost:4000"}}`

## Enqueue a test job

```bash
curl -X POST http://localhost:3001/jobs/enqueue \
  -H "Content-Type: application/json" \
  -d '{"type":"health-check","payload":{"targetUrl":"http://localhost:4000"}}'
```

## Deployment (Railway)

Project: **blackroad-os-operator**

- Service: `operator`
- Build: `npm install && npm run build`
- Start: `npm run start:worker`
- Health check: `/health`

Deployments are handled via GitHub Actions (`.github/workflows/operator-deploy.yaml`). Each push to `dev`, `staging`, or `main` builds the project, deploys the `operator` service, and performs a `/health` check against the environment URL.
