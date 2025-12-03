# BlackRoad Auth - API Key Authentication System

A production-ready Cloudflare Worker for managing API key authentication across BlackRoad OS services.

## Features

- **Secure API Key Generation**: Cryptographically secure key generation with SHA-256 hashing
- **Rate Limiting**: Per-key rate limiting with configurable tiers (free, starter, pro, enterprise)
- **Access Control**: IP and origin restrictions per API key
- **Key Management**: Create, validate, revoke, and list API keys
- **Metadata Tracking**: Track usage, last used timestamps, and IP addresses
- **Exportable Validation**: `validateApiKey()` function for use in other workers
- **Admin Controls**: Admin-only endpoints for key creation and management
- **CORS Support**: Full CORS support for browser-based applications

## Architecture

### Storage Structure

#### API_KEYS KV Namespace
Stores hashed keys with full metadata:
```
Key: SHA-256(api_key)
Value: {
  key: "br_...",           // Original key (stored for display once)
  user_id: "user_123",
  tier: "pro",
  created_at: "2025-12-02T...",
  last_used: "2025-12-02T...",
  last_used_ip: "1.2.3.4",
  rate_limit: { rpm: 50000, burst: 500 },
  metadata: {
    name: "Production API Key",
    description: "Key for production services",
    scopes: ["read", "write"],
    allowed_origins: ["https://app.blackroad.io"],
    allowed_ips: ["1.2.3.4"]
  },
  revoked: false
}
```

#### API_KEY_METADATA KV Namespace
Stores user -> keys mapping for listing:
```
Key: user:{user_id}:keys
Value: [
  { hash: "abc123...", created_at: "...", name: "Key 1", tier: "pro" },
  { hash: "def456...", created_at: "...", name: "Key 2", tier: "free" }
]
```

#### RATE_LIMIT KV Namespace
Stores per-minute rate limit counters:
```
Key: ratelimit:{key_hash}:{minute_timestamp}
Value: "42"  // request count
TTL: 120 seconds
```

## API Endpoints

### POST /keys/create
Create a new API key (admin only)

**Authentication**: Admin API key required

**Request**:
```json
{
  "user_id": "user_123",
  "tier": "pro",
  "name": "Production API Key",
  "description": "Key for production services",
  "scopes": ["read", "write", "admin"],
  "allowed_origins": ["https://app.blackroad.io"],
  "allowed_ips": ["1.2.3.4", "5.6.7.8"]
}
```

**Response**:
```json
{
  "success": true,
  "api_key": "br_a1b2c3d4e5f6...",
  "key_data": {
    "hash": "sha256hash...",
    "user_id": "user_123",
    "tier": "pro",
    "created_at": "2025-12-02T10:00:00.000Z",
    "rate_limit": { "rpm": 50000, "burst": 500 },
    "metadata": { ... }
  },
  "warning": "Store this API key securely. It will not be shown again."
}
```

### GET /keys/validate
Validate an API key

**Authentication**: API key in header

**Headers**:
```
X-API-Key: br_a1b2c3d4e5f6...
# OR
Authorization: Bearer br_a1b2c3d4e5f6...
```

**Response**:
```json
{
  "valid": true,
  "user_id": "user_123",
  "tier": "pro",
  "rate_limit": {
    "limit": 50000,
    "remaining": 49999,
    "reset": 1733140860
  },
  "scopes": ["read", "write", "admin"]
}
```

### DELETE /keys/revoke
Revoke an API key

**Authentication**: Admin API key OR the key being revoked

**Request**:
```json
{
  "api_key": "br_a1b2c3d4e5f6...",
  "reason": "Security breach"
}
```

**Response**:
```json
{
  "success": true,
  "message": "API key revoked successfully",
  "revoked_at": "2025-12-02T10:00:00.000Z"
}
```

### GET /keys/list?user_id=user_123
List all API keys for a user

**Authentication**: Admin API key OR user's own API key

**Response**:
```json
{
  "user_id": "user_123",
  "keys": [
    {
      "hash": "a1b2c3d4e5f6...",
      "name": "Production Key",
      "tier": "pro",
      "created_at": "2025-12-02T10:00:00.000Z",
      "last_used": "2025-12-02T11:00:00.000Z",
      "rate_limit": { "rpm": 50000, "burst": 500 },
      "revoked": false,
      "scopes": ["read", "write"]
    }
  ]
}
```

## Rate Limit Tiers

| Tier       | Requests/Min | Burst |
|------------|--------------|-------|
| Free       | 1,000        | 50    |
| Starter    | 5,000        | 100   |
| Pro        | 50,000       | 500   |
| Enterprise | 500,000      | 5,000 |

## Using in Other Workers

Export the `validateApiKey` function to use in other Cloudflare Workers:

```typescript
import { validateApiKey } from '@blackroad/auth';

// In your worker
export default {
  async fetch(request: Request, env: Env) {
    // Validate the API key
    const validation = await validateApiKey(request, env);

    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: validation.error,
        message: 'Invalid or missing API key'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Access key data
    const userId = validation.key_data.user_id;
    const tier = validation.key_data.tier;
    const scopes = validation.key_data.metadata.scopes;

    // Add rate limit headers to response
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', validation.rate_limit.limit.toString());
    headers.set('X-RateLimit-Remaining', validation.rate_limit.remaining.toString());
    headers.set('X-RateLimit-Reset', validation.rate_limit.reset.toString());

    // Your business logic here...
    return new Response('Success', { headers });
  }
};
```

## Setup & Deployment

### 1. Create KV Namespaces

```bash
# Create production KV namespaces
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "API_KEY_METADATA"
wrangler kv:namespace create "RATE_LIMIT"

# Create preview KV namespaces
wrangler kv:namespace create "API_KEYS" --preview
wrangler kv:namespace create "API_KEY_METADATA" --preview
wrangler kv:namespace create "RATE_LIMIT" --preview
```

### 2. Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml` with the IDs from step 1.

### 3. Set Admin API Key Secret

```bash
# Generate a secure admin key
openssl rand -hex 32

# Set as secret
wrangler secret put ADMIN_API_KEY
# Paste the generated key when prompted
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Deploy

```bash
# Development
npm run deploy:dev

# Staging
npm run deploy:staging

# Production
npm run deploy
```

## Development

```bash
# Start local dev server
npm run dev

# Type check
npm run build

# Watch logs
npm run tail
```

## Security Considerations

1. **API Key Storage**: Keys are hashed with SHA-256 before storage
2. **One-Time Display**: Raw API keys are only shown once during creation
3. **Admin Authentication**: Admin endpoints require ADMIN_API_KEY secret
4. **Rate Limiting**: Automatic rate limiting prevents abuse
5. **IP Restrictions**: Optional IP whitelisting per key
6. **Origin Restrictions**: Optional origin whitelisting for CORS
7. **Revocation**: Keys can be instantly revoked with audit trail
8. **No Key Logging**: Raw keys are never logged

## Monitoring

The worker includes:
- Request ID tracking (`X-Request-ID` header)
- Response time tracking (`X-Response-Time` header)
- Structured logging with levels (debug, info, warn, error)
- Cloudflare Analytics integration (via observability settings)

## Error Codes

| Error Code            | Description                                    |
|-----------------------|------------------------------------------------|
| `missing_api_key`     | No API key provided in request                 |
| `invalid_api_key`     | API key not found or invalid                   |
| `revoked_api_key`     | API key has been revoked                       |
| `ip_not_allowed`      | Request IP not in allowed list                 |
| `origin_not_allowed`  | Request origin not in allowed list             |
| `rate_limit_exceeded` | Rate limit exceeded for this key               |
| `unauthorized`        | Admin authentication required                  |
| `invalid_request`     | Missing or invalid request parameters          |
| `not_found`           | Resource not found                             |
| `validation_error`    | Internal validation error                      |
| `creation_failed`     | Failed to create API key                       |
| `revocation_failed`   | Failed to revoke API key                       |
| `list_failed`         | Failed to list API keys                        |
| `internal_error`      | Unexpected server error                        |

## License

UNLICENSED - BlackRoad OS, Inc. - Private/Proprietary

## Author

BlackRoad OS, Inc.
Operator: alexa.operator.v1
