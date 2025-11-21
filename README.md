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
