# GPT-OSS Model Volume Fix

> **Fix "gpt-oss-model-volume is FULL" error**

---

## Option A: If You Can Still Exec Into the Container

Copy-paste this entire block:

```bash
# Connect to the service
railway run -s gpt-oss-model -- sh -c '
echo "=== Current disk usage ==="
df -h /root/.ollama

echo ""
echo "=== Models taking up space ==="
du -sh /root/.ollama/models/* 2>/dev/null || echo "No models dir found"

echo ""
echo "=== Currently loaded models ==="
ollama list

echo ""
echo "=== To delete a model, run: ==="
echo "ollama rm <model-name>"
'
```

Then delete the models you don't need:

```bash
# Delete specific models (examples - adjust to your actual models)
railway run -s gpt-oss-model -- ollama rm llama2:70b
railway run -s gpt-oss-model -- ollama rm codellama:34b
railway run -s gpt-oss-model -- ollama rm llama2:13b
railway run -s gpt-oss-model -- ollama rm mixtral:8x7b

# Keep ONLY your production model
railway run -s gpt-oss-model -- ollama pull mistral:7b-instruct
```

Verify the fix:

```bash
railway run -s gpt-oss-model -- sh -c '
echo "=== After cleanup ==="
df -h /root/.ollama
echo ""
ollama list
'
```

---

## Option B: If the Volume is Totally Wedged (Can't Exec)

Do this from the Railway UI:

### Step 1: Delete the Volume

1. Go to Railway Dashboard
2. Click on **GPT-OSS Model** service
3. Go to **Settings** tab
4. Scroll to **Volumes** section
5. Click the **trash icon** next to `gpt-oss-model-volume`
6. Confirm deletion

### Step 2: Recreate the Volume

1. Still in **Settings** → **Volumes**
2. Click **Add Volume**
3. Mount path: `/root/.ollama`
4. Size: **10GB** (don't go bigger unless you need massive models)
5. Save

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Wait for it to come up healthy

### Step 4: Pull Only Your Production Model

```bash
# After the service is back up
railway run -s gpt-oss-model -- ollama pull mistral:7b-instruct

# Verify
railway run -s gpt-oss-model -- ollama list
```

---

## Recommended Model for Cece (Production)

| Model | Size | Use Case |
|-------|------|----------|
| `mistral:7b-instruct` | ~4GB | Best balance of speed/quality |
| `llama3:8b` | ~4.5GB | Alternative if you prefer Llama |
| `phi3:mini` | ~2GB | Lighter option for lower latency |

**DO NOT pull these in production (too big):**
- `llama2:70b` (~40GB)
- `mixtral:8x7b` (~26GB)
- `codellama:34b` (~20GB)

---

## Prevent Future Volume Bloat

Add these env vars to GPT-OSS Model:

```env
# Limit concurrent model loads
OLLAMA_MAX_LOADED_MODELS=1

# Unload models faster
OLLAMA_KEEP_ALIVE=2m

# Limit parallel requests (prevents memory spike)
OLLAMA_NUM_PARALLEL=2
```

Set in Railway:
1. GPT-OSS Model → Variables
2. Add each env var
3. Redeploy

---

## Quick Reference

| Symptom | Fix |
|---------|-----|
| "volume is FULL" | Delete unused models with `ollama rm` |
| Can't exec into container | Delete volume from UI, recreate, redeploy |
| Models keep redownloading | Check `OLLAMA_KEEP_ALIVE` setting |
| Slow inference | Try `phi3:mini` instead of larger models |

---

*Part of Operator Engine v1 documentation*
