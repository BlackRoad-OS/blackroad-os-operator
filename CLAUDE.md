# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BlackRoad OS Operator Engine - a dual-runtime orchestration system for coordinating agents, jobs, and workflows across BlackRoad OS. The operator handles behind-the-scenes automation: agent orchestration, scheduled jobs, background workers, and multi-service workflows.

**Two Runtimes:**
- **Python (FastAPI)** - Primary operator API (`br_operator/`) running on Railway
- **TypeScript (Node.js)** - Job queue workers with BullMQ + Redis (`src/`)

## Common Commands

### Python Runtime (Primary)
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server (port 8080)
make dev
# or: uvicorn br_operator.main:app --host 0.0.0.0 --port 8080 --reload

# Run tests
make test
# or: pytest tests/ -v

# Lint
make lint
# or: ruff check br_operator/
```

### TypeScript Runtime (Workers)
```bash
# Install dependencies
pnpm install

# Run development server (port 4000)
pnpm dev

# Build production
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

### Cloudflare Workers
```bash
# Deploy a worker (from workers/<name>/ directory)
wrangler deploy
```

## Architecture

### Python Operator (`br_operator/`)
- `main.py` - FastAPI app with agent catalog, chat, policy, and ledger endpoints
- `catalog.py` - Agent catalog loader with hot-reload from `agent-catalog/agents.yaml`
- `policy_engine.py` - Policy evaluation engine using YAML policies from `config/policies.*.yaml`
- `ledger_service.py` + `ledger_builder.py` - Governance ledger for audit trails
- `llm_service.py` - LLM integration with RAG support
- `intent_service.py` - Intent chain processing
- `ps_sha_infinity.py` - PS-SHA-∞ cryptographic identity verification
- `secrets.py` - Secrets management with alias resolution

### TypeScript Workers (`src/`)
- `index.ts` - Express app entry point
- `jobs/` - BullMQ job processors
- `schedulers/` - node-cron based scheduled tasks
- `queues/` - Redis queue factory
- `workflows/` - Multi-step workflow orchestration

### Cloudflare Workers (`workers/`)
- `api-gateway/` - Edge routing, rate limiting, proxies to Railway backend
- `cece/` - Chat interface worker
- `router/` - Request routing
- `status/`, `identity/`, `billing/`, `cipher/`, `sovereignty/`, `intercept/` - Domain-specific edge workers

### Configuration (`config/`)
- `agent-routing.yaml` - Agent routing rules
- `policies.*.yaml` - Policy definitions (mesh, infra, education, intents)
- `infrastructure.yaml` - Infrastructure definitions
- `service_registry.yaml` - Service registry
- `secrets.aliases.yaml` - Secret alias mappings

## Key Endpoints

**Python Operator:**
- `GET /health` - Health check with catalog status
- `GET /agents` - List all agents from catalog
- `GET /agents/{id}` - Get specific agent
- `POST /chat` - Chat with Cece (canonical operator entrypoint)
- `POST /policies/evaluate` - Evaluate policy
- `GET /ledger/events` - Query ledger events

**TypeScript Workers:**
- `GET /health`, `/ready`, `/version` - Health and metadata
- `GET /internal/agents` - List registered agents
- `POST /internal/jobs` - Enqueue a job

## Testing

```bash
# Python tests
pytest tests/ -v

# Run specific test file
pytest tests/test_operator.py -v

# TypeScript tests
pnpm test
```

## Deployment

- **Railway**: Python operator deploys via `railway.toml`
- **Cloudflare Workers**: Each worker has its own `wrangler.toml`
- **Docker**: `docker build -t blackroad-os-operator .`

## Agent Catalog

Agents are defined in `agent-catalog/agents.yaml` and hot-reloaded on changes. Operator-level agents include:
- `deploy-bot` - Railway deployment rollouts
- `sweep-bot` - Merge-ready sweeps
- `policy-bot` - Compliance enforcement
- `sync-agent` - Cross-service state sync
- `health-monitor` - Service health monitoring
- `archive-bot` - Audit trail archival

## Environment Variables

Key variables (see `operator.env.example`):
- `PORT` - API port (Python: 8080, TypeScript: 4000)
- `REDIS_URL` - Redis connection for job queues
- `CATALOG_PATH` - Override agent catalog location
- `OPENAI_API_KEY` - For LLM features
- `COMMIT_SHA` - Git SHA for versioning
