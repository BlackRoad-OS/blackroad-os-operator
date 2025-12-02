# Railway Setup Guide

> **Governance**
> - amundson: 0.1.0
> - governor: alice.governor.v1
> - operator: alexa.operator.v1

This document describes how to set up and manage Railway services for BlackRoad OS.

## Quick Start

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link to project
railway link

# 4. Deploy
railway up
```

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EXPERIENCE LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  web-app (Next.js)                                          │ │
│  │  - app.blackroad.io                                         │ │
│  │  - edu.blackroad.io                                         │ │
│  │  - homework.blackroad.io                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        GATEWAY LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  api-gateway (Fastify)                                      │ │
│  │  - api.blackroad.io                                         │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GOVERNANCE LAYER                            │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  gov-api (FastAPI) - Cece's brain                           │ │
│  │  - gov.api.blackroad.io                                     │ │
│  │  - ledger.blackroad.systems                                 │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MESH LAYER                               │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  operator-ws         │  │  mesh-router                     │ │
│  │  - ws.blackroad.io   │  │  - mesh.blackroad.network        │ │
│  │  - agents.blackroad  │  │  - pi.mesh.blackroad.network     │ │
│  │    .network          │  │  - edge.blackroad.network        │ │
│  └──────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         INFRA LAYER                              │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  postgres-db                                                │ │
│  │  - db.blackroad.systems                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Service Details

### 1. web-app (Next.js)

**Purpose:** Multi-tenant web app serving user-facing experiences.

```yaml
Repo: blackroad-os-home
Stack: Node 20 + Next.js 14
Build: npm install && npm run build
Start: npm run start

Domains:
  - app.blackroad.io
  - edu.blackroad.io
  - homework.blackroad.io

Env Vars:
  - PORT=3000
  - NODE_ENV=production
  - DATABASE_URL=<from railway>
  - GOV_API_URL=http://gov-api.railway.internal:8000
  - NEXT_PUBLIC_GOV_API_URL=https://gov.api.blackroad.io
```

### 2. gov-api (FastAPI)

**Purpose:** Cece governance engine - policy evaluation, ledger, intents.

```yaml
Repo: blackroad-os-api
Stack: Python 3.11 + FastAPI
Build: pip install -r requirements.txt
Start: uvicorn app.main:app --host 0.0.0.0 --port 8000

Domains:
  - gov.api.blackroad.io
  - ledger.blackroad.systems
  - policies.blackroad.systems

Env Vars:
  - PORT=8000
  - DATABASE_URL=<from railway>
  - POLICY_STORE_PATH=policies/
  - LANGUAGE_VERSION=0.1.0
  - CORS_ORIGINS=https://app.blackroad.io,https://edu.blackroad.io
```

### 3. operator-ws (FastAPI)

**Purpose:** Operator engine with WebSocket support, agent routing.

```yaml
Repo: blackroad-os-operator
Stack: Python 3.11 + FastAPI
Build: pip install -r requirements.txt
Start: uvicorn br_operator.main:app --host 0.0.0.0 --port 8000

Domains:
  - ws.blackroad.io
  - agents.blackroad.network

Env Vars:
  - PORT=8000
  - DATABASE_URL=<from railway>
  - GOV_API_URL=http://gov-api.railway.internal:8000
  - CATALOG_PATH=agent-catalog/agents.yaml
  - OLLAMA_BASE_URL=<ollama endpoint>
  - LLM_MODEL=llama3.2
```

### 4. postgres-db

**Purpose:** Managed PostgreSQL for all services.

```yaml
Provider: Railway Postgres
Version: 15

DNS: db.blackroad.systems

Tables:
  - ledger_events (governance audit log)
  - users, assignments, submissions (RoadWork)
```

## Environment Management

### Environments

| Env | Domain Prefix | BR_ENV |
|-----|---------------|--------|
| dev | dev. | dev |
| stg | stg. | stg |
| prod | (none) | prod |

### Sharing Variables

Railway supports variable sharing between services:

```bash
# Set a variable that other services can reference
railway variables --set DATABASE_URL=${{postgres.DATABASE_URL}}

# Reference in another service
railway variables --set GOV_API_URL=${{gov-api.RAILWAY_PRIVATE_DOMAIN}}:8000
```

## Deployment Order

Due to dependencies, deploy services in this order:

1. **postgres-db** (no dependencies)
2. **gov-api** (depends on postgres)
3. **api-gateway**, **operator-ws**, **mesh-router** (depend on gov-api)
4. **web-app** (depends on gov-api, api-gateway)

## CLI Workflows

### Initial Setup

```bash
# Login and link
railway login
railway link

# Create project if needed
railway init

# Add services
railway add --name gov-api
railway add --name operator-ws
railway add --name web-app
```

### Daily Development

```bash
# Check status
railway status

# Deploy current branch
railway up

# Follow logs
railway logs -f

# Open shell in service
railway shell

# Run one-off command
railway run python -c "print('hello')"
```

### Database Migrations

```bash
# Run migration via Railway
railway run psql $DATABASE_URL -f migrations/001_ledger_events_v1.sql

# Or open a shell and run manually
railway shell
$ psql $DATABASE_URL
```

### Environment Variables

```bash
# List all variables
railway variables

# Set a variable
railway variables --set LOG_LEVEL=debug

# Set multiple
railway variables --set KEY1=val1 --set KEY2=val2

# Copy from file
cat .env.production | xargs railway variables --set
```

## Local Development

Use the provided dev stack script:

```bash
# Start everything
./scripts/dev-stack.sh up

# Check status
./scripts/dev-stack.sh status

# Stop everything
./scripts/dev-stack.sh down

# Run migrations
./scripts/dev-stack.sh migrate
```

### Local Environment

The script sets these defaults:

```bash
BR_ENV=dev
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/blackroad_dev
GOV_API_URL=http://localhost:8001
OPERATOR_PORT=8000
```

## Monitoring & Observability

### Health Endpoints

| Service | Health Endpoint |
|---------|-----------------|
| operator-ws | `/health`, `/governance/health` |
| gov-api | `/health` |
| web-app | `/api/health` |
| api-gateway | `/health` |

### Checking Governance Health

```bash
curl https://ws.blackroad.io/governance/health
```

Returns:
```json
{
  "policy_engine": "ok",
  "ledger_service": "ok",
  "policy_packs_loaded": 1,
  "services_registered": 33,
  "ledger_event_count": 42
}
```

## Governance Integration

All Railway services are subject to BlackRoad OS governance:

1. **Policy Scope:** Each service has a `policy_scope` (e.g., `mesh.*`, `edu.*`)
2. **Ledger Level:** Each service must emit ledger events at the required level
3. **Invariants:** Mesh/agent services enforce delegation requirements

See `config/service_registry.yaml` for the complete mapping.

## Troubleshooting

### Service won't start

1. Check logs: `railway logs`
2. Verify env vars: `railway variables`
3. Check build output: `railway logs --build`

### Database connection issues

1. Verify DATABASE_URL is set
2. Check Railway's postgres is running
3. Try connecting manually: `railway run psql $DATABASE_URL`

### Governance errors

1. Check `/governance/health` endpoint
2. Verify `POLICY_STORE_PATH` points to valid policies
3. Check ledger events: `GET /ledger/events`

## References

- [Railway CLI Docs](https://docs.railway.app/develop/cli)
- [BlackRoad OS Governance Spec](./GOVERNANCE.md)
- [Service Registry](../config/service_registry.yaml)
- [Railway Services Manifest](../config/railway-services.yaml)
