# Cece Operator - Conversation Memory System

The Cece Operator includes a conversation memory system that stores chat history to provide context-aware responses.

## Features

- Store conversation turns automatically during chat
- Retrieve conversation history for any user
- Clear history for privacy
- Configurable maximum turns (default: 20)
- Simple JSON file storage (suitable for Railway deployment)
- Optional feature via environment variable

## Configuration

### Environment Variables

```bash
# Enable/disable memory (default: false)
MEMORY_ENABLED=true

# Maximum conversation turns to keep per user (default: 20)
MEMORY_MAX_TURNS=20

# Storage path for memory files (default: /tmp/cece_memory)
MEMORY_STORAGE_PATH=/data/cece_memory
```

### Railway Deployment

For Railway, add these environment variables to your service:

1. Go to your Railway project
2. Select the `blackroad-cece-operator` service
3. Click "Variables"
4. Add:
   - `MEMORY_ENABLED=true`
   - `MEMORY_STORAGE_PATH=/data/cece_memory` (Railway persistent disk)

## API Endpoints

### POST /chat

The main chat endpoint now supports conversation memory:

```bash
curl -X POST https://your-operator.railway.app/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello Cece!",
    "userId": "user123"
  }'
```

**Behavior:**
- If `MEMORY_ENABLED=true` and `userId` is provided:
  - Retrieves last 5 conversation turns for context
  - Generates response with conversation history
  - Stores the new turn automatically
- If `MEMORY_ENABLED=false` or `userId` is missing/anonymous:
  - Works as before (no memory)

### POST /memory/store

Manually store a conversation turn:

```bash
curl -X POST https://your-operator.railway.app/memory/store \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "user_message": "What is BlackRoad?",
    "assistant_reply": "BlackRoad OS is an intelligent operating system...",
    "metadata": {"model": "gpt-4", "used_rag": true}
  }'
```

**Response:**
```json
{
  "stored": true,
  "user_id": "user123",
  "turn_count": 5,
  "max_turns": 20
}
```

### GET /memory/{user_id}

Retrieve conversation history:

```bash
curl https://your-operator.railway.app/memory/user123?limit=10
```

**Query Parameters:**
- `limit` (optional): Maximum number of turns to return (1-100)

**Response:**
```json
{
  "user_id": "user123",
  "turns": [
    {
      "timestamp": "2025-12-02T19:30:00Z",
      "user_message": "Hello Cece!",
      "assistant_reply": "Hi! How can I help you today?",
      "metadata": {"model": "gpt-4", "used_rag": false}
    }
  ],
  "total_turns": 1,
  "enabled": true
}
```

Note: Turns are returned with most recent first.

### DELETE /memory/{user_id}

Clear conversation history for a user:

```bash
curl -X DELETE https://your-operator.railway.app/memory/user123
```

**Response:**
```json
{
  "cleared": true,
  "user_id": "user123"
}
```

### GET /memory/stats

Get memory service statistics:

```bash
curl https://your-operator.railway.app/memory/stats
```

**Response:**
```json
{
  "enabled": true,
  "total_users": 42,
  "max_turns_per_user": 20,
  "storage_path": "/data/cece_memory"
}
```

## Storage Format

Memory is stored as JSON files in the configured storage path:

```
/data/cece_memory/
  ├── user123.json
  ├── user456.json
  └── ...
```

Each file contains:

```json
{
  "user_id": "user123",
  "updated_at": "2025-12-02T19:30:00Z",
  "turns": [
    {
      "timestamp": "2025-12-02T19:25:00Z",
      "user_message": "Hello",
      "assistant_reply": "Hi!",
      "metadata": {}
    }
  ]
}
```

## How It Works

### Chat Flow with Memory

1. User sends message with `userId`
2. Operator retrieves last 5 conversation turns from memory
3. Turns are passed to LLM as conversation history
4. LLM generates context-aware response
5. New turn is stored in memory
6. Response returned to user

### Context Window

- Default: Last 5 turns are included in context
- This provides ~10 messages of context (5 user + 5 assistant)
- Configurable in code if needed

### Privacy & Data Retention

- Memory is stored per-user with sanitized file names
- Maximum 20 turns per user (configurable)
- Older turns are automatically removed
- Users can request deletion via DELETE endpoint
- Anonymous users (no userId) don't get memory

## Testing

### Test Memory Storage

```bash
# Enable memory
export MEMORY_ENABLED=true

# Test chat with user ID
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Remember this: my favorite color is blue", "userId": "test-user"}'

# Ask follow-up question
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is my favorite color?", "userId": "test-user"}'

# Expected: Cece should remember it's blue
```

### Test Memory Retrieval

```bash
curl http://localhost:8000/memory/test-user
```

### Test Memory Deletion

```bash
curl -X DELETE http://localhost:8000/memory/test-user
```

## Integration with Cloudflare Workers

The edge worker at `/workers/cece` already passes `user_id` to the backend:

```typescript
body: JSON.stringify({
  message,
  user_id: user_id || 'anonymous',
  model,
  context,
}),
```

No changes needed to the edge worker - memory works automatically when enabled.

## Troubleshooting

### Memory Not Working

1. Check `MEMORY_ENABLED=true` is set
2. Verify storage path exists and is writable
3. Ensure `userId` is provided in requests (not "anonymous")
4. Check logs for errors

### Memory Files Not Persisting

- On Railway, ensure you're using a persistent volume
- Path must be under `/data` or configured persistent path
- Check Railway volume mount configuration

### Out of Disk Space

- Reduce `MEMORY_MAX_TURNS` to use less space per user
- Implement periodic cleanup of old user files
- Monitor storage usage

## Future Enhancements

Potential improvements:

1. **Cloudflare KV Backend**: For edge deployments
2. **Redis Backend**: For high-performance deployments
3. **PostgreSQL Backend**: For persistent, queryable storage
4. **Smart Context Selection**: Use embeddings to select most relevant turns
5. **Memory Compression**: Summarize old conversations
6. **Multi-Agent Memory**: Share memory across agent instances
7. **Memory Search**: Search across conversation history

## Security Considerations

- User IDs are sanitized to prevent directory traversal
- Files are JSON-encoded (no code execution risk)
- No sensitive data should be stored in metadata
- Consider encryption at rest for production
- Implement rate limiting on memory endpoints
- Consider GDPR compliance for EU users

## Performance

- File I/O is lightweight for small turn counts
- JSON parsing is fast for < 100 turns
- Memory lookups are O(1) per user
- No database required
- Suitable for 1000s of active users

For higher scale, consider migrating to Redis or PostgreSQL.
