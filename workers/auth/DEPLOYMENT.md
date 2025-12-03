# Deployment Guide - BlackRoad Auth Worker

Step-by-step guide to deploy the BlackRoad Auth worker to Cloudflare.

## Prerequisites

- Cloudflare account with Workers enabled
- `wrangler` CLI installed (`npm install -g wrangler`)
- Authenticated with Cloudflare (`wrangler login`)

## Step 1: Create KV Namespaces

Run these commands to create the required KV namespaces:

```bash
# Navigate to the auth worker directory
cd /Users/alexa/blackroad-os-operator/workers/auth

# Create production namespaces
wrangler kv:namespace create "API_KEYS"
wrangler kv:namespace create "API_KEY_METADATA"
wrangler kv:namespace create "RATE_LIMIT"

# Create preview namespaces for development
wrangler kv:namespace create "API_KEYS" --preview
wrangler kv:namespace create "API_KEY_METADATA" --preview
wrangler kv:namespace create "RATE_LIMIT" --preview
```

You'll receive output like:
```
{ binding = "API_KEYS", id = "abc123..." }
{ binding = "API_KEYS", preview_id = "def456..." }
```

## Step 2: Update wrangler.toml

Replace the placeholder IDs in `wrangler.toml` with the IDs from Step 1:

```toml
[[kv_namespaces]]
binding = "API_KEYS"
id = "YOUR_PRODUCTION_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"

[[kv_namespaces]]
binding = "API_KEY_METADATA"
id = "YOUR_PRODUCTION_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "YOUR_PRODUCTION_ID_HERE"
preview_id = "YOUR_PREVIEW_ID_HERE"
```

## Step 3: Generate and Set Admin API Key

```bash
# Generate a secure random key
openssl rand -hex 32

# Set it as a Cloudflare secret
wrangler secret put ADMIN_API_KEY
# Paste the generated key when prompted
```

**IMPORTANT**: Save this admin key securely! You'll need it to create API keys.

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Test Locally

```bash
# Create .dev.vars file for local development
cp .dev.vars.example .dev.vars

# Edit .dev.vars and add your admin key
# ADMIN_API_KEY=<your_generated_key>

# Start local dev server
npm run dev
```

Test the health endpoint:
```bash
curl http://localhost:8787/health
```

## Step 6: Deploy to Development

```bash
npm run deploy:dev
```

This deploys to `blackroad-auth-dev.alexa.workers.dev`

## Step 7: Test Development Deployment

```bash
# Set your admin key
export ADMIN_KEY="your_admin_key_here"

# Test health endpoint
curl https://blackroad-auth-dev.alexa.workers.dev/health

# Create a test API key
./examples/create-key.sh $ADMIN_KEY test_user_1 free

# Save the returned API key
export TEST_KEY="br_returned_key_here"

# Validate the key
./examples/validate-key.sh $TEST_KEY

# List keys for user
./examples/list-keys.sh $ADMIN_KEY test_user_1
```

## Step 8: Deploy to Staging

```bash
npm run deploy:staging
```

This deploys to `blackroad-auth-staging.alexa.workers.dev`

## Step 9: Deploy to Production

```bash
npm run deploy
```

This deploys to `blackroad-auth.alexa.workers.dev` and routes to `auth.blackroad.io/*`

## Step 10: Configure Custom Domain (Optional)

If you want to use a custom domain like `auth.blackroad.io`:

1. Ensure `blackroad.io` is added to your Cloudflare account
2. The route is already configured in `wrangler.toml`:
   ```toml
   routes = [
     { pattern = "auth.blackroad.io/*", zone_name = "blackroad.io" },
   ]
   ```
3. DNS will be automatically configured when you deploy

## Step 11: Create Your First Production API Key

```bash
# Set your admin key
export ADMIN_KEY="your_production_admin_key"

# Create a production API key
curl -X POST "https://auth.blackroad.io/keys/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -d '{
    "user_id": "production_user_1",
    "tier": "pro",
    "name": "Production API Key",
    "description": "Main production key",
    "scopes": ["read", "write"],
    "allowed_origins": ["https://app.blackroad.io"]
  }' | jq .
```

**IMPORTANT**: Save the returned `api_key` value - it will never be shown again!

## Monitoring & Maintenance

### View Logs

```bash
# Tail production logs
npm run tail

# Tail development logs
wrangler tail --env dev
```

### Check KV Storage Usage

```bash
# List all keys in API_KEYS namespace
wrangler kv:key list --binding API_KEYS

# Get a specific key (by hash)
wrangler kv:key get <key_hash> --binding API_KEYS
```

### Update Admin Key

```bash
# Generate new key
openssl rand -hex 32

# Update secret
wrangler secret put ADMIN_API_KEY
```

### Rollback Deployment

```bash
# View deployment history
wrangler deployments list

# Rollback to previous version
wrangler rollback --message "Rollback to previous version"
```

## Integration with Other Workers

To use the auth worker in other workers, you need to share the KV namespaces:

### Option 1: Direct Import (Recommended)

Export the `validateApiKey` function and import it in other workers. Both workers need access to the same KV namespaces.

Add to your other worker's `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "API_KEYS"
id = "SAME_ID_AS_AUTH_WORKER"

[[kv_namespaces]]
binding = "API_KEY_METADATA"
id = "SAME_ID_AS_AUTH_WORKER"

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "SAME_ID_AS_AUTH_WORKER"
```

### Option 2: Service Bindings (Alternative)

Use Cloudflare Service Bindings to call the auth worker from other workers:

```toml
# In your other worker's wrangler.toml
[[service_bindings]]
binding = "AUTH"
service = "blackroad-auth"
environment = "production"
```

Then in your worker:
```typescript
const authResponse = await env.AUTH.fetch(
  new Request('http://internal/keys/validate', {
    headers: request.headers
  })
);
```

## Troubleshooting

### "KV Namespace not found"
- Verify namespace IDs in `wrangler.toml` match the output from `wrangler kv:namespace create`
- Ensure namespaces are created in the correct Cloudflare account

### "Unauthorized" when creating keys
- Verify `ADMIN_API_KEY` secret is set correctly
- Check that you're using the correct admin key in requests

### Rate limit not working
- Verify `RATE_LIMIT` KV namespace is properly bound
- Check that TTL is set on rate limit entries (should be 120 seconds)

### CORS errors
- Verify origin is in `allowed_origins` for the API key
- Check that CORS headers are being set correctly

## Security Checklist

- [ ] Admin API key is stored securely (not in code)
- [ ] Production API keys are generated with appropriate tiers
- [ ] IP restrictions are configured for sensitive keys
- [ ] Origin restrictions are configured for browser keys
- [ ] Logs are monitored for suspicious activity
- [ ] Rate limits are appropriate for each tier
- [ ] Revoked keys are properly marked in KV storage

## Next Steps

1. **Integrate with API Gateway**: Update the `api-gateway` worker to use this auth worker
2. **Add to Monitoring**: Set up alerts for failed auth attempts
3. **Document for Team**: Share API key creation process with team
4. **Create Admin UI**: Build a dashboard for managing API keys
5. **Add Analytics**: Track API key usage patterns

## Support

For issues or questions:
- Email: blackroad.systems@gmail.com
- Linear: Create a ticket in the BlackRoad project
- GitHub: Check blackroad-os-operator repository

---

Deployment guide for BlackRoad Auth Worker
Operator: alexa.operator.v1
Last updated: 2025-12-02
