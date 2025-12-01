# Railway Cleanup Playbook - Operator Engine v1

> **One-time cleanup to get from chaos → production v1**
> Execute these steps IN ORDER.

---

## Pre-Flight Checks

Before touching anything:

```bash
# 1. Make sure you're logged into Railway CLI
railway login

# 2. Link to the Operator Engine project
railway link
# Select: "Operator Engine – production"
```

---

## Phase 1: DELETE Dead Services (Safe to Remove)

These are orphaned/failed services. Delete them first.

| Service | Action | Railway Dashboard Path |
|---------|--------|------------------------|
| **infra** | DELETE | Services → infra → Settings → Delete Service |
| **Primary-T614** | DELETE | Services → Primary-T614 → Settings → Delete Service |
| **Worker-JIY0** | DELETE | Services → Worker-JIY0 → Settings → Delete Service |

**Verification:** After deletion, these should no longer appear in your service list.

---

## Phase 2: SCALE TO 0 Redundant Services

These might have data - don't delete yet, just disable.

### 2.1 MySQL → Scale to 0

**Check first:**
```bash
# See if anything connects to MySQL
railway run -s primary -- env | grep -i mysql
railway run -s librechat -- env | grep -i mysql
```

**If nothing uses it:**
- Services → MySQL → Settings → Scale to 0 replicas

**If something uses it:**
- Note which service, we'll migrate that to Postgres later

---

### 2.2 Postgres-LxRs → Scale to 0

**Check first:**
```bash
# Get connection strings for both Postgres instances
railway variables -s postgres
railway variables -s postgres-lxrs

# Check what's connected to Postgres-LxRs
railway run -s primary -- env | grep -i lxrs
```

**If Postgres-LxRs has data you need:**
```bash
# Dump from Postgres-LxRs
railway run -s postgres-lxrs -- pg_dump -U postgres > backup-lxrs.sql

# Restore to main Postgres
railway run -s postgres -- psql -U postgres < backup-lxrs.sql
```

**Then:** Services → Postgres-LxRs → Settings → Scale to 0 replicas

---

### 2.3 Redis-4DEX → Scale to 0

**Check first:**
```bash
# See what's using this Redis
railway run -s primary -- env | grep -i 4dex
railway run -s worker -- env | grep -i 4dex
```

**If nothing references it:**
- Services → Redis-4DEX → Settings → Scale to 0 replicas

---

### 2.4 VectorDB → Scale to 0

**Check first:**
```bash
# See if RAG API or anything uses VectorDB
railway run -s rag-api -- env | grep -i vector
railway run -s rag-api -- env | grep -i qdrant
railway run -s rag-api -- env | grep -i pinecone
```

**If RAG API uses Meilisearch (not VectorDB):**
- Services → VectorDB → Settings → Scale to 0 replicas

**If RAG API DOES use VectorDB:**
- Keep it, update the architecture doc

---

## Phase 3: Update Environment Variables

After scaling down services, update any stale env var references.

### Services to Check:

**Primary:**
```bash
railway variables -s primary

# Remove any references to:
# - MYSQL_* (if MySQL disabled)
# - *_LXRS_* (if Postgres-LxRs disabled)
# - REDIS_4DEX_* (if Redis-4DEX disabled)

# Should have:
# DATABASE_URL=postgresql://... (main Postgres)
# REDIS_URL=redis://... (main Redis)
```

**Worker:**
```bash
railway variables -s worker
# Same cleanup as Primary
```

**RAG API:**
```bash
railway variables -s rag-api
# Ensure MEILISEARCH_URL points to meilisearch.railway.internal:7700
# Remove VECTORDB_URL if not using
```

**blackroad-os-operator:**
```bash
railway variables -s blackroad-os-operator
# Ensure LLM config points to GPT-OSS Model
# OLLAMA_URL=http://gpt-oss-model.railway.internal:11434
```

---

## Phase 4: Verify Core Services

After cleanup, verify the v1 stack is healthy:

```bash
# Check each required service
railway status

# Test health endpoints
railway run -s primary -- curl -s localhost:3000/health
railway run -s blackroad-os-operator -- curl -s localhost:8080/health
railway run -s rag-api -- curl -s localhost:8000/health

# Check GPT-OSS Model
railway run -s gpt-oss-model -- ollama list

# Check databases
railway run -s postgres -- psql -U postgres -c "SELECT 1"
railway run -s redis -- redis-cli ping
railway run -s meilisearch -- curl -s localhost:7700/health
```

---

## Cleanup Checklist

Copy this to track progress:

```
[ ] DELETE infra (failed one-shot)
[ ] DELETE Primary-T614 (orphaned)
[ ] DELETE Worker-JIY0 (orphaned)
[ ] SCALE TO 0: MySQL (after checking no deps)
[ ] SCALE TO 0: Postgres-LxRs (after migration if needed)
[ ] SCALE TO 0: Redis-4DEX (after checking no deps)
[ ] SCALE TO 0: VectorDB (if using Meilisearch)
[ ] UPDATE: Primary env vars (remove stale refs)
[ ] UPDATE: Worker env vars (remove stale refs)
[ ] UPDATE: RAG API env vars (confirm Meilisearch)
[ ] UPDATE: Operator env vars (confirm Ollama URL)
[ ] VERIFY: All 9 core services healthy
```

---

## Post-Cleanup State

After running this playbook, your Railway project should show:

**Active Services (9):**
1. Primary
2. Caddy
3. Worker
4. blackroad-os-operator
5. GPT-OSS Model
6. RAG API
7. Postgres
8. Meilisearch
9. Redis

**Optional (your choice):**
- LibreChat (if using)
- Browserless (if using)
- MongoDB (only if LibreChat needs it)

**Scaled to 0 / Deleted:**
- MySQL ❌
- Postgres-LxRs ❌
- Redis-4DEX ❌
- VectorDB ❌
- Primary-T614 ❌
- Worker-JIY0 ❌
- infra ❌

---

## Rollback

If something breaks after cleanup:

1. **Scaled services:** Just scale back to 1 replica
2. **Deleted services:** You'll need to recreate from the architecture doc
3. **Env vars:** Check git history or Railway's variable history

---

*Generated as part of Operator Engine v1 consolidation*
