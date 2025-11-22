# BlackRoad OS – Operator

TypeScript/Express service that orchestrates background jobs and automation for BlackRoad OS. It exposes lightweight HTTP endpoints for health and metadata while delegating job handling to the worker runtime.

## Getting Started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

The service binds to `0.0.0.0` and listens on the port defined by `PORT` (default `8080`).

## Production

Build the project then start the compiled server:

```bash
npm run build
npm start
```

## Health

- **Path:** `GET /health`
- **Response:**

```json
{
  "status": "ok",
  "service": "operator"
}
```

`/api/health` is kept as a backward-compatible alias.

## Jobs API

- `POST /jobs/enqueue` – enqueue a job with `{ type, payload }`
- `GET /jobs/status` – check queue size

## Environment Variables

`PORT`, `HOST`, and other service settings are loaded from `.env` (see `src/env.ts`).
