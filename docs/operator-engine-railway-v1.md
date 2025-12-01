# Operator Engine - Railway Production v1

> **Canonical Reference Document**
> Last Updated: 2024-11-30
> Status: PRODUCTION

---

## Overview

The Operator Engine is BlackRoad OS's core orchestration layer. This document defines the v1 production architecture deployed on Railway.

### Hero Path (Request Flow)

```
User Request
    ↓
┌─────────┐
│  Caddy  │  ← TLS termination, reverse proxy
└────┬────┘
     ↓
┌─────────┐
│ Primary │  ← Main API application
└────┬────┘
     ↓
┌──────────────────────┐
│ blackroad-os-operator │  ← Agent orchestration brain
└────┬─────────────────┘
     ↓
┌─────────────────────────────┐
│ RAG API ←→ GPT-OSS Model    │  ← Context retrieval + LLM inference
└─────────────────────────────┘
     ↓
Response back through stack
```

---

## Architecture Table

### REQUIRED Services (V1 Core)

| Service | Role | Port | Dependencies | Critical ENV Vars |
|---------|------|------|--------------|-------------------|
| **Primary** | Main API/Application | 3000 | Postgres, Redis, Operator | `DATABASE_URL`, `REDIS_URL`, `OPERATOR_URL` |
| **Caddy** | Reverse proxy, TLS | 80, 443 | Primary | `DOMAIN`, `UPSTREAM_URL` |
| **Worker** | Background job processor | - | Postgres, Redis | `DATABASE_URL`, `REDIS_URL`, `QUEUE_NAME` |
| **blackroad-os-operator** | Agent orchestration | 8080 | RAG API, GPT-OSS Model | `LLM_PROVIDER`, `OLLAMA_URL`, `RAG_API_URL` |
| **GPT-OSS Model** | LLM Gateway (Ollama) | 11434 | - | `OLLAMA_HOST`, `OLLAMA_MODEL` |
| **RAG API** | Retrieval/context service | 8000 | Meilisearch, Postgres | `MEILISEARCH_URL`, `DATABASE_URL` |
| **Postgres** | Primary relational DB | 5432 | - | (Railway auto-provisions) |
| **Meilisearch** | Search + vector store | 7700 | - | `MEILI_MASTER_KEY` |
| **Redis** | Cache + job queue | 6379 | - | (Railway auto-provisions) |

### OPTIONAL Services (Enable as Needed)

| Service | Role | When to Enable | Dependencies |
|---------|------|----------------|--------------|
| **LibreChat** | Chat UI for testing | Development/demo | MongoDB, GPT-OSS Model |
| **Browserless** | Headless Chrome | Web scraping workflows | - |
| **MongoDB** | Document store | If LibreChat enabled | - |

### DISABLED Services (Remove or Scale to 0)

| Service | Reason | Action |
|---------|--------|--------|
| **MySQL** | Redundant - use Postgres | Scale to 0 or delete |
| **Postgres-LxRs** | Duplicate Postgres | Migrate data, then delete |
| **Redis-4DEX** | Duplicate Redis | Consolidate, then delete |
| **Primary-T614** | Old/duplicate instance | Delete after confirming unused |
| **Worker-JIY0** | Old/duplicate worker | Delete after confirming unused |
| **VectorDB** | Redundant if using Meilisearch | Disable unless specific embedding needs |
| **infra** | Failed one-shot job | Delete |

---

## Service Configuration

### GPT-OSS Model (Cece LLM Gateway)

```env
# Core Ollama Config
OLLAMA_HOST=0.0.0.0
OLLAMA_PORT=11434
OLLAMA_ORIGINS=*
OLLAMA_KEEP_ALIVE=5m

# Model Management
OLLAMA_MODEL=mistral:7b-instruct
OLLAMA_NUM_PARALLEL=2
OLLAMA_MAX_LOADED_MODELS=2

# Memory (prevent volume bloat)
OLLAMA_MAX_VRAM=0
OLLAMA_NUM_GPU=0
```

**Volume Management:**
- Volume path: `/root/.ollama`
- Max recommended size: 10GB
- Prune command: `ollama rm <unused-model>`
- If full: Delete volume in Railway → Redeploy → Re-pull only needed models

### blackroad-os-operator

```env
# LLM Connection
LLM_PROVIDER=ollama
OLLAMA_URL=http://gpt-oss-model.railway.internal:11434
OLLAMA_MODEL=mistral:7b-instruct

# RAG Connection
RAG_API_URL=http://rag-api.railway.internal:8000

# Database
DATABASE_URL=postgresql://...  # Railway Postgres connection string

# Agent Config
AGENT_ID=cece
AGENT_MODE=production
LOG_LEVEL=info
```

### Primary

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPERATOR_URL=http://blackroad-os-operator.railway.internal:8080
NODE_ENV=production
PORT=3000
```

### RAG API

```env
DATABASE_URL=postgresql://...
MEILISEARCH_URL=http://meilisearch.railway.internal:7700
MEILI_MASTER_KEY=<your-key>
EMBEDDING_MODEL=all-MiniLM-L6-v2
PORT=8000
```

---

## V1 Recreation Checklist

If this entire Railway project is deleted, follow these steps to recreate v1:

### Phase 1: Data Layer (5 min)

- [ ] **Create Postgres**
  - Railway → New Service → Database → PostgreSQL
  - Note the `DATABASE_URL`

- [ ] **Create Redis**
  - Railway → New Service → Database → Redis
  - Note the `REDIS_URL`

- [ ] **Create Meilisearch**
  - Railway → New Service → Docker Image
  - Image: `getmeili/meilisearch:latest`
  - Add volume: `/meili_data`
  - Set ENV: `MEILI_MASTER_KEY=<generate-secure-key>`

### Phase 2: LLM Layer (10 min)

- [ ] **Create GPT-OSS Model (Ollama)**
  - Railway → New Service → Docker Image
  - Image: `ollama/ollama:latest`
  - Add volume: `/root/.ollama` (10GB)
  - Set ENV vars from config above
  - After deploy: `railway run -s gpt-oss-model -- ollama pull mistral:7b-instruct`

- [ ] **Create RAG API**
  - Railway → New Service → GitHub Repo
  - Connect to `BlackRoad-OS/blackroad-os-rag-api` (or your RAG repo)
  - Set ENV vars from config above

### Phase 3: Orchestration Layer (5 min)

- [ ] **Create blackroad-os-operator**
  - Railway → New Service → GitHub Repo
  - Connect to `BlackRoad-OS/blackroad-os-operator`
  - Set ENV vars from config above

### Phase 4: Application Layer (5 min)

- [ ] **Create Primary**
  - Railway → New Service → GitHub Repo
  - Connect to your main app repo
  - Set ENV vars from config above

- [ ] **Create Worker**
  - Railway → New Service → GitHub Repo
  - Same repo as Primary, different start command
  - Start command: `npm run worker` or equivalent

- [ ] **Create Caddy**
  - Railway → New Service → Docker Image
  - Image: `caddy:latest`
  - Add volume: `/data`
  - Configure Caddyfile for reverse proxy

### Phase 5: Networking (2 min)

- [ ] **Generate domain for Caddy**
  - Railway → Caddy service → Settings → Generate Domain
  - Or connect custom domain

- [ ] **Verify internal networking**
  - All services should communicate via `.railway.internal` hostnames
  - Test: `railway run -s primary -- curl http://blackroad-os-operator.railway.internal:8080/health`

### Phase 6: Validation (5 min)

- [ ] Primary responds to health check
- [ ] Operator can reach GPT-OSS Model
- [ ] RAG API can query Meilisearch
- [ ] Worker processes jobs from Redis queue
- [ ] End-to-end test: User request → Response

---

## Immediate Actions for Current Project

### Scale Down NOW:

```bash
# In Railway dashboard, set replicas to 0 for:
- MySQL
- Postgres-LxRs
- Redis-4DEX
- Primary-T614
- Worker-JIY0
- VectorDB
- infra (delete entirely)
```

### Fix GPT-OSS Model Volume:

```bash
# SSH into the service
railway run -s gpt-oss-model -- sh

# Check disk usage
du -sh /root/.ollama/models/*

# Remove unused models (examples)
ollama rm codellama:34b
ollama rm llama2:70b
ollama rm <any-model-over-10GB>

# Keep only
ollama list
# Should show only: mistral:7b-instruct (or your chosen model)
```

### Verify Core Services:

```bash
# Test each required service
railway run -s primary -- curl localhost:3000/health
railway run -s blackroad-os-operator -- curl localhost:8080/health
railway run -s rag-api -- curl localhost:8000/health
railway run -s gpt-oss-model -- ollama list
```

---

## Architecture Diagram

```
                    ┌──────────────────────────────────────────────────────┐
                    │              RAILWAY PROJECT                         │
                    │           "Operator Engine - Production"              │
                    │                                                      │
    Internet        │  ┌─────────┐                                         │
        │           │  │  Caddy  │ ← Public endpoint                       │
        └──────────────┤  :443   │                                         │
                    │  └────┬────┘                                         │
                    │       │                                              │
                    │  ┌────┴────┐      ┌─────────┐                       │
                    │  │ Primary │──────│  Worker │                       │
                    │  │  :3000  │      │  (bg)   │                       │
                    │  └────┬────┘      └────┬────┘                       │
                    │       │                │                            │
                    │       ├────────────────┤                            │
                    │       │                │                            │
                    │  ┌────┴────────────────┴────┐                       │
                    │  │   blackroad-os-operator   │                       │
                    │  │         :8080             │                       │
                    │  └────┬─────────────────┬───┘                       │
                    │       │                 │                            │
                    │  ┌────┴────┐      ┌─────┴──────┐                    │
                    │  │ RAG API │      │ GPT-OSS    │                    │
                    │  │  :8000  │      │ Model:11434│                    │
                    │  └────┬────┘      └────────────┘                    │
                    │       │                                              │
                    │  ┌────┴──────┐                                      │
                    │  │Meilisearch│                                      │
                    │  │   :7700   │                                      │
                    │  └───────────┘                                      │
                    │                                                      │
                    │  ┌──────────┐  ┌───────┐                            │
                    │  │ Postgres │  │ Redis │  ← Shared data layer       │
                    │  │  :5432   │  │ :6379 │                            │
                    │  └──────────┘  └───────┘                            │
                    │                                                      │
                    └──────────────────────────────────────────────────────┘
```

---

## Hero Flow #1 — Operator /chat Endpoint

The `/chat` endpoint is the **canonical entry point** for users to talk to Cece through the Operator Engine.

### Request Flow

```
User Request
    ↓
┌──────────────────────────┐
│ blackroad-os-operator    │  POST /chat
│ (FastAPI :8080)          │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│ GPT-OSS Model            │  /api/generate
│ (Ollama :11434)          │
│ Model: llama3.2:1b       │
└────────────┬─────────────┘
             ↓
Response back to user
```

### API Contract

**Endpoint:** `POST /chat`

**Request:**
```json
{
  "message": "string (required)",
  "userId": "string (optional)",
  "model": "string (optional, overrides default)"
}
```

**Response (200 OK):**
```json
{
  "reply": "Cece's response text",
  "trace": {
    "llm_provider": "ollama",
    "model": "llama3.2:1b",
    "used_rag": false,
    "response_time_ms": 9253
  }
}
```

**Error Responses:**
- `400 Bad Request` — Empty or missing message
- `500 Internal Server Error` — LLM API failure

### Services Involved

| Service | Role | Internal URL |
|---------|------|--------------|
| blackroad-os-operator | Receives request, forwards to LLM | `:8080` |
| GPT-OSS Model | Ollama LLM inference | `gpt-oss-model.railway.internal:11434` |

### Sample Successful Response

```json
{
  "reply": "Hello! I'm delighted to help. In the Operator Engine v1, I can display my current state and provide information on its capabilities. As an AI assistant, I'm currently logged in and visible within the Operator Engine...",
  "trace": {
    "llm_provider": "ollama",
    "model": "llama3.2:1b",
    "used_rag": false,
    "response_time_ms": 9253
  }
}
```

### Manual Test

Run the test script:
```bash
./scripts/hero-flow-test.sh
```

Or use curl directly:
```bash
curl -X POST "https://blackroad-os-operator-production-8d28.up.railway.app/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Cece!"}'
```

**What a "pass" looks like:**
- HTTP 200 status code
- Response contains `reply` string (non-empty)
- Response contains `trace` object with timing

**Expected latency:** ~8-12 seconds on `llama3.2:1b`

### Additional Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/llm/health` | GET | Check if Ollama is reachable and has models |
| `/health` | GET | General operator health check |

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2024-12-01 | Added Hero Flow #1 documentation | Cece |
| 2024-11-30 | Initial v1 architecture defined | Cece |

---

*This is a living document. Update as architecture evolves.*
