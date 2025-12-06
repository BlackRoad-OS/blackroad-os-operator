# Memory System - Quick Start

## Enable Memory (Railway)

1. Go to Railway project → `blackroad-cece-operator` service
2. Variables → Add: `MEMORY_ENABLED=true`
3. Redeploy

Done! Memory is now active.

## API Endpoints

### Chat with Memory
```bash
POST /chat
{
  "message": "Hello, I'm Alice",
  "userId": "alice123"
}
```

### Get History
```bash
GET /memory/{user_id}?limit=10
```

### Clear History
```bash
DELETE /memory/{user_id}
```

### Check Stats
```bash
GET /memory/stats
```

## Test It

```bash
# Quick test
curl -X POST https://your-operator.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "My name is Bob", "userId": "bob"}'

curl -X POST https://your-operator.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my name?", "userId": "bob"}'
# Should reply: "Your name is Bob"
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MEMORY_ENABLED` | `false` | Enable/disable memory |
| `MEMORY_MAX_TURNS` | `20` | Max turns per user |
| `MEMORY_STORAGE_PATH` | `/tmp/cece_memory` | Storage location |

## How It Works

1. User sends message with `userId`
2. System retrieves last 5 turns
3. Passes history to LLM for context
4. Stores new turn automatically
5. Returns context-aware response

## Privacy

- Anonymous users (no `userId`) → no memory
- User can delete with `DELETE /memory/{user_id}`
- Only keeps last 20 turns (configurable)
- Disabled by default

## Full Documentation

See `/docs/MEMORY_SYSTEM.md` for complete documentation.
