# BlackRoad / Cece – Main Dev Checkpoints

> Source of truth for "run tests while we code"
>
> Pattern: Alexa types ideas → Cece does ops + tests → System tends toward self-running

## Active Stack

| Layer | Service | URL |
|-------|---------|-----|
| Edge | Cece Worker | `https://cece.amundsonalexa.workers.dev` |
| Backend | Cece Operator | `https://blackroad-cece-operator-production.up.railway.app` |
| Secrets | Alias System | `config/secrets.aliases.yaml` → Railway env |

### Key Endpoints

```
GET  /health          → System health
GET  /version         → Version info
POST /chat            → Chat with Cece
GET  /llm/health      → LLM provider health
GET  /governance/health → Policy engine health
```

---

## Local Dev Checkpoints

From `blackroad-os-operator` root:

### 1. Environment Setup

```bash
# Create/activate venv
python -m venv .venv
source .venv/bin/activate

# Install deps
pip install -r requirements.txt

# Set secrets (create ~/.blackroad/secrets.env)
export OPENAI_API_KEY="sk-..."
```

### 2. Secrets Status

```bash
./scripts/br-secrets status
./scripts/br-secrets get openai.default
```

Expected output:
```
✓ Available (3):
  openai.default                 Primary OpenAI key for Cece operator
```

### 3. Unit Tests

```bash
pytest
```

All tests should pass before pushing.

### 4. Local Smoke Test

```bash
# Terminal 1: Start server
uvicorn br_operator.main:app --reload --port 8000

# Terminal 2: Test /health
curl http://127.0.0.1:8000/health

# Terminal 2: Test /chat
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "smoke test", "userId": "dev"}'
```

Expected `/health` response:
```json
{"status": "ok", "catalog": "ok", "uptime_seconds": 1.234}
```

Expected `/chat` response:
```json
{
  "reply": "...",
  "trace": {
    "llm_provider": "openai",
    "model": "gpt-4o-mini",
    "response_time_ms": 1234.5,
    "used_rag": false
  }
}
```

### 5. PS-SHA∞ Identity Check

```bash
python -m br_operator.ps_sha_infinity
```

Should show Cece's identity fingerprint.

---

## Prod Checkpoints (Cece)

### 1. Edge → Operator Connection

```bash
curl https://cece.amundsonalexa.workers.dev/health
```

Expected:
```json
{
  "status": "online",
  "service": "cece-edge",
  "agent": "Cece",
  "owner": "Alexa Louise Amundson"
}
```

### 2. Full Chat Flow

```bash
curl -X POST https://cece.amundsonalexa.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Cece!","user_id":"ops"}'
```

Expected response includes:
- `reply`: Cece's response
- `trace.llm_provider`: "openai"
- `trace.model`: model name
- `trace.response_time_ms`: latency
- `edge.location`: Cloudflare POP (e.g., "ORD")

### 3. Backend Health

```bash
curl https://blackroad-cece-operator-production.up.railway.app/health
```

Expected:
```json
{"status": "ok", "catalog": "ok", "uptime_seconds": 12345.678}
```

### 4. LLM Health

```bash
curl https://blackroad-cece-operator-production.up.railway.app/llm/health
```

Expected:
```json
{"healthy": true, "provider": "openai", "configured_model": "gpt-4o-mini"}
```

---

## Deploy Workflow

### Push to Production

```bash
# 1. Run local tests
pytest

# 2. Run local smoke test
curl http://127.0.0.1:8000/health

# 3. Commit & push
git add -A
git commit -m "Description of changes"
git push origin main

# 4. Railway auto-deploys from main
# Watch: https://railway.com/project/d8eed902-91eb-44f6-aa5c-68acf0328ace

# 5. Verify prod
curl https://blackroad-cece-operator-production.up.railway.app/health
curl -X POST https://cece.amundsonalexa.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"deploy check","user_id":"ops"}'
```

### Deploy Cloudflare Workers

```bash
cd workers/cece && wrangler deploy
```

---

## When Making Changes

Every time code changes:

| Step | Command | Pass Criteria |
|------|---------|---------------|
| 1 | `pytest` | All tests pass |
| 2 | `curl localhost:8000/health` | `{"status": "ok"}` |
| 3 | `curl localhost:8000/chat ...` | Valid reply + trace |
| 4 | `git push` | CI passes |
| 5 | `curl prod/health` | `{"status": "ok"}` |
| 6 | `curl cece.../chat` | Valid reply |

**If any step fails, STOP and fix before next change.**

---

## Secrets Sync

When adding new integrations:

```bash
# 1. Add alias to config/secrets.aliases.yaml
# 2. Set locally
export NEW_SECRET_KEY="..."

# 3. Check it works
./scripts/br-secrets get new_provider.default

# 4. Sync to Railway (once service is linked)
./scripts/br-secrets sync new_provider.default --to railway

# Or manually:
# Railway Dashboard → Service → Variables → Add
```

---

## Emergency Rollback

```bash
# Railway CLI
railway rollback

# Or via dashboard:
# https://railway.com/project/d8eed902-91eb-44f6-aa5c-68acf0328ace
# → Deployments → Click older deployment → Rollback
```

---

## Links

- **Railway Project**: https://railway.com/project/d8eed902-91eb-44f6-aa5c-68acf0328ace
- **Cece Worker**: https://cece.amundsonalexa.workers.dev
- **GitHub Repo**: https://github.com/BlackRoad-OS/blackroad-os-operator
- **Cloudflare Dashboard**: https://dash.cloudflare.com

---

*Last updated: 2025-12-02*
*Owner: Alexa Louise Amundson*
*System: BlackRoad OS / Cece Operator*
