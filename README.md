# BlackRoad OS – Operator

The Operator is the automation heart of BlackRoad OS. It exposes a small HTTP surface for orchestration metadata while coordinating workers, queues, and background flows that power the wider platform.

## Stack

- **Runtime:** Node.js 18
- **Language:** TypeScript
- **Framework:** Express
- **Kind:** Backend service (`operator`)

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness probe returning service id and timestamp. |
| `GET` | `/info` | Basic service info with version and environment. |
| `GET` | `/version` | Detailed version/build metadata. |
| `GET` | `/debug/env` | Safe snapshot of environment variables (common secrets redacted). |

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime environment (`development`/`staging`/`production`). |
| `PORT` / `OPERATOR_PORT` | HTTP port (defaults to `8080`). |
| `CORE_API_URL` | URL of the Core backend. |
| `AGENTS_API_URL` | URL of the Agents API. |
| `LOG_LEVEL` | Logging level for existing worker/logger utilities. |
| `QUEUE_POLL_INTERVAL_MS` | Queue polling interval for worker routines. |
| `JOB_MAX_ATTEMPTS` | Maximum attempts per job. |
| `APP_VERSION`, `GIT_COMMIT`, `BUILD_TIME` | Optional build metadata. |
| `DATABASE_URL`, `REDIS_URL` | Optional backing services; if omitted those clients stay disabled. |
| `OS_ROOT` | Root URL for the broader BlackRoad OS (`https://blackroad.systems`). |
| `SERVICE_BASE_URL` | Public base URL for this service (used in service discovery helpers). |

Copy `.env.example` to `.env` and fill in values as needed.

## Running locally

```bash
npm install
npm run dev
```

The service listens on `http://localhost:8080` by default and serves the endpoints above. Existing worker and legacy API entrypoints remain available via `npm run dev:worker` and `npm run dev:api` if needed.

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Deployment (Railway)

Railway expects:

- **Build:** `npm install && npm run build`
- **Start:** `npm start`
- **Port:** `8080`
- **Healthcheck:** `GET /health`

The included `railway.json` matches these defaults. The Dockerfile uses a Node 18 Alpine multi-stage build suitable for Railway or any container runtime.

## Role in BlackRoad OS

The Operator coordinates automation across the platform. It provides a lightweight HTTP surface for status (`/health`, `/info`, `/version`, `/debug/env`) while powering background workers that interact with the Core backend and Agents API. Other BlackRoad OS services can discover it via the shared `OS_ROOT` and `SERVICE_BASE_URL` values.
