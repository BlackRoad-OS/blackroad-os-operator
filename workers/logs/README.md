# BlackRoad OS Centralized Logging Service

Centralized logging system for all BlackRoad OS services using Cloudflare D1.

## Features

- Centralized log storage using Cloudflare D1
- RESTful API for log ingestion and querying
- Support for multiple log levels (info, warn, error, debug)
- Flexible querying with filters
- Statistics and analytics
- Automatic cleanup of old logs (90-day retention by default)
- CORS support for cross-origin requests
- Simple client library for easy integration

## Setup

### 1. Create D1 Database

```bash
wrangler d1 create blackroad-logs
```

Copy the database ID from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "blackroad-logs"
database_id = "YOUR_D1_DATABASE_ID"  # Replace with actual ID
```

### 2. Run Migrations

```bash
# For local development
npm run migrate:local

# For production
npm run migrate
```

### 3. Deploy

```bash
npm run deploy
```

## API Endpoints

### POST /log

Write a log entry.

**Request:**
```json
{
  "service": "api-gateway",
  "level": "info",
  "message": "Request processed successfully",
  "metadata": {
    "path": "/api/users",
    "duration_ms": 45
  },
  "request_id": "req_abc123",
  "user_id": "user_xyz"
}
```

**Response:**
```json
{
  "success": true,
  "log_id": 12345,
  "timestamp": 1733184000000
}
```

### GET /logs

Query logs with optional filters.

**Query Parameters:**
- `service` - Filter by service name
- `level` - Filter by log level (info, warn, error, debug)
- `start_time` - Unix timestamp (ms) for start of time range
- `end_time` - Unix timestamp (ms) for end of time range
- `request_id` - Filter by request ID
- `user_id` - Filter by user ID
- `limit` - Number of results (default: 100, max: 1000)
- `offset` - Pagination offset (default: 0)

**Example:**
```
GET /logs?service=api-gateway&level=error&limit=50
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "logs": [
    {
      "id": 12345,
      "timestamp": 1733184000000,
      "service": "api-gateway",
      "level": "error",
      "message": "Database connection failed",
      "metadata": { "error": "timeout" },
      "request_id": "req_abc123",
      "user_id": null,
      "created_at": "2025-12-02T12:00:00Z"
    }
  ]
}
```

### GET /logs/stats

Get log statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150000,
    "by_service_level": [
      {
        "service": "api-gateway",
        "level": "info",
        "count": 75000,
        "last_occurrence": 1733184000000
      }
    ],
    "last_24h": [
      {
        "service": "api-gateway",
        "level": "error",
        "count": 12
      }
    ]
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "blackroad-logs",
  "timestamp": 1733184000000
}
```

## Client Usage

### Using the LogClient class

```typescript
import { LogClient } from './src/client';

const logger = new LogClient({
  logsEndpoint: 'https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev',
  serviceName: 'api-gateway',
  defaultMetadata: {
    environment: 'production',
    version: '1.0.0',
  },
});

// In your request handler
const requestId = crypto.randomUUID();

await logger.info('Request received', {
  request_id: requestId,
  metadata: { path: request.url, method: request.method },
});

await logger.error('Database error', {
  request_id: requestId,
  metadata: { error: error.message, stack: error.stack },
});
```

### Using the quickLog function

```typescript
import { quickLog } from './src/client';

await quickLog(
  'https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev',
  'cece',
  'info',
  'Agent response generated',
  {
    request_id: requestId,
    metadata: { agent: 'CECE', tokens: 1250 },
  }
);
```

## Database Schema

```sql
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  service TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata TEXT,  -- JSON string
  request_id TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Automatic Cleanup

The worker runs a daily cron job (00:00 UTC) to delete logs older than the retention period (default: 90 days). Configure retention in `wrangler.toml`:

```toml
[vars]
MAX_LOG_RETENTION_DAYS = "90"
```

## Integration Examples

### API Gateway
```typescript
import { LogClient } from '@blackroad/logs/client';

const logger = new LogClient({
  logsEndpoint: env.LOGS_ENDPOINT,
  serviceName: 'api-gateway',
});

export default {
  async fetch(request: Request, env: Env) {
    const requestId = crypto.randomUUID();

    await logger.info('Request received', {
      request_id: requestId,
      metadata: { url: request.url },
    });

    try {
      // Your logic here
      const response = await handleRequest(request);

      await logger.info('Request completed', {
        request_id: requestId,
        metadata: { status: response.status },
      });

      return response;
    } catch (error) {
      await logger.error('Request failed', {
        request_id: requestId,
        metadata: { error: error.message },
      });
      throw error;
    }
  }
};
```

## Query Examples

### Get all errors from last hour
```bash
curl "https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev/logs?level=error&start_time=$(($(date +%s) * 1000 - 3600000))"
```

### Get logs for specific request
```bash
curl "https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev/logs?request_id=req_abc123"
```

### Get statistics
```bash
curl "https://blackroad-logs.YOUR-SUBDOMAIN.workers.dev/logs/stats"
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Deploy to production
npm run deploy
```

## Architecture

- **Storage**: Cloudflare D1 (SQLite)
- **Indexes**: Optimized for timestamp, service, and level queries
- **Retention**: Configurable automatic cleanup via cron
- **Performance**: Indexed queries, pagination support
- **Reliability**: Non-blocking log writes, graceful error handling

## License

MIT
