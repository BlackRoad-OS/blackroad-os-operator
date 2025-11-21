# BlackRoad OS – Operator

Backend service that powers background workers, queues, and agent automation tasks for BlackRoad OS. It also exposes a minimal HTTP surface for health and metadata.

## Running locally

```bash
npm install
npm run dev
```

The service listens on port `8080` by default.

## Build & start

```bash
npm run build
npm start
```

## System endpoints

- `GET /health`
- `GET /info`
- `GET /version`
- `GET /debug/env`

## Deployment (Railway)

- Port: `8080`
- Healthcheck: `GET /health`
- Build: `npm install && npm run build`
- Start: `npm start`
- Configure environment variables using `.env.example` as a reference

## Environment variables

See `.env.example` for required and optional values, including `OS_ROOT`, `SERVICE_BASE_URL`, `LOG_LEVEL`, and `PORT`.
# blackroad-os-operator

Operator engine for BlackRoad OS — runs jobs, schedulers, background workers, and coordinates agent workflows across OS, Prism, and Lucidia. Handles automation, task orchestration, and system-level operations.

## Structure

- **app/**: FastAPI application with health check endpoint
- **workers/**: Background job and agent orchestration modules
- **infra/**: Infrastructure configuration (Dockerfile, requirements, Railway config)

## Quick Start

### Local Development

1. Install dependencies:
```bash
pip install -r infra/requirements.txt
```

2. Run the application:
```bash
uvicorn app.main:app --reload
```

3. Access the service:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Docker

Build and run with Docker:

```bash
docker build -f infra/Dockerfile -t blackroad-os-operator .
docker run -p 8000:8000 blackroad-os-operator
```

### Deployment

The service can be deployed to Railway using the provided `infra/railway.toml` configuration.
