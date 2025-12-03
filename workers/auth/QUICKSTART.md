# QuickStart Guide - BlackRoad Auth

Get started with the BlackRoad Auth system in 5 minutes.

## 1. Deploy (First Time)

```bash
cd /Users/alexa/blackroad-os-operator/workers/auth

# Install dependencies
npm install

# Create KV namespaces
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "API_KEY_METADATA"
wrangler kv:namespace create "RATE_LIMIT"

# Update wrangler.toml with the returned IDs
# (Replace placeholder IDs with actual IDs from above)

# Generate admin key
export ADMIN_KEY=$(openssl rand -hex 32)
echo "Save this admin key: $ADMIN_KEY"

# Set admin key secret
echo $ADMIN_KEY | wrangler secret put ADMIN_API_KEY

# Deploy to production
npm run deploy
```

## 2. Create Your First API Key

```bash
# Save your admin key from step 1
export ADMIN_KEY="your_admin_key_here"

# Create an API key
curl -X POST "https://blackroad-auth.alexa.workers.dev/keys/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{
    "user_id": "user_001",
    "tier": "pro",
    "name": "My First API Key",
    "scopes": ["read", "write"]
  }' | jq .

# Save the returned api_key value!
export API_KEY="br_returned_key_here"
```

## 3. Validate the API Key

```bash
# Test validation
curl -X GET "https://blackroad-auth.alexa.workers.dev/keys/validate" \
  -H "X-API-Key: $API_KEY" | jq .

# Should return:
# {
#   "valid": true,
#   "user_id": "user_001",
#   "tier": "pro",
#   "rate_limit": { ... },
#   "scopes": ["read", "write"]
# }
```

## 4. Use in Your Application

### Browser (JavaScript/TypeScript)

```javascript
const API_KEY = 'br_your_key_here';

async function callApi() {
  const response = await fetch('https://api.blackroad.io/v1/endpoint', {
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });

  // Check rate limit headers
  console.log('Rate limit:', response.headers.get('X-RateLimit-Limit'));
  console.log('Remaining:', response.headers.get('X-RateLimit-Remaining'));

  return response.json();
}
```

### Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'https://api.blackroad.io',
  headers: {
    'X-API-Key': process.env.BLACKROAD_API_KEY
  }
});

client.get('/v1/endpoint')
  .then(response => {
    console.log('Data:', response.data);
    console.log('Rate limit:', response.headers['x-ratelimit-remaining']);
  })
  .catch(error => {
    if (error.response?.status === 429) {
      console.error('Rate limit exceeded');
    }
  });
```

### Python

```python
import os
import requests

API_KEY = os.getenv('BLACKROAD_API_KEY')

headers = {
    'X-API-Key': API_KEY,
    'Content-Type': 'application/json'
}

response = requests.get(
    'https://api.blackroad.io/v1/endpoint',
    headers=headers
)

if response.status_code == 200:
    print('Data:', response.json())
    print('Rate limit:', response.headers.get('X-RateLimit-Remaining'))
elif response.status_code == 429:
    print('Rate limit exceeded')
```

### cURL

```bash
curl -X GET "https://api.blackroad.io/v1/endpoint" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json"
```

## 5. Manage Keys

### List All Keys for a User

```bash
curl -X GET "https://blackroad-auth.alexa.workers.dev/keys/list?user_id=user_001" \
  -H "Authorization: Bearer $ADMIN_KEY" | jq .
```

### Revoke a Key

```bash
curl -X DELETE "https://blackroad-auth.alexa.workers.dev/keys/revoke" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{
    "api_key": "br_key_to_revoke",
    "reason": "Security concern"
  }' | jq .
```

## Common Use Cases

### Create Keys with Restrictions

**IP Restriction** (only allow specific IPs):
```bash
curl -X POST "https://blackroad-auth.alexa.workers.dev/keys/create" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_002",
    "tier": "pro",
    "name": "Server-Only Key",
    "allowed_ips": ["203.0.113.1", "203.0.113.2"]
  }'
```

**Origin Restriction** (only allow specific domains):
```bash
curl -X POST "https://blackroad-auth.alexa.workers.dev/keys/create" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_003",
    "tier": "starter",
    "name": "Browser Key",
    "allowed_origins": ["https://app.blackroad.io", "http://localhost:3000"]
  }'
```

**Limited Scopes**:
```bash
curl -X POST "https://blackroad-auth.alexa.workers.dev/keys/create" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_004",
    "tier": "free",
    "name": "Read-Only Key",
    "scopes": ["read"]
  }'
```

## Rate Limits by Tier

| Tier       | RPM     | Best For                          |
|------------|---------|-----------------------------------|
| Free       | 1,000   | Personal projects, testing        |
| Starter    | 5,000   | Small apps, development           |
| Pro        | 50,000  | Production apps                   |
| Enterprise | 500,000 | High-volume production, B2B APIs  |

## Troubleshooting

### "Invalid API key"
- Verify you're using the correct key
- Check if the key has been revoked
- Ensure you're not using the key hash (starts with the full `br_` prefix)

### "Rate limit exceeded"
- Wait for the rate limit to reset (shown in `X-RateLimit-Reset` header)
- Consider upgrading to a higher tier
- Check if you're making too many requests in parallel

### "IP not allowed"
- Your IP address is not in the allowed list for this key
- Create a new key without IP restrictions or add your IP

### "Origin not allowed"
- Your domain is not in the allowed origins list
- Add your origin when creating the key or create a new key

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide
- See [examples/](./examples/) for integration examples
- Review [src/index.test.ts](./src/index.test.ts) for testing examples

## Support

- Email: blackroad.systems@gmail.com
- Issues: Create a Linear ticket
- GitHub: blackroad-os-operator repository

---

QuickStart Guide for BlackRoad Auth Worker
Last updated: 2025-12-02
