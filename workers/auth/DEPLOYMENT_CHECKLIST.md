# Deployment Checklist - BlackRoad Auth Worker

Use this checklist to ensure a successful deployment of the BlackRoad Auth worker.

## Pre-Deployment

### 1. Prerequisites
- [ ] Cloudflare account with Workers enabled
- [ ] Wrangler CLI installed (`npm install -g wrangler`)
- [ ] Authenticated with Cloudflare (`wrangler login`)
- [ ] Access to blackroad.io DNS zone
- [ ] Linear account for issue tracking
- [ ] Secure password manager for storing keys

### 2. Local Setup
- [ ] Navigate to `/Users/alexa/blackroad-os-operator/workers/auth/`
- [ ] Run `npm install`
- [ ] Review all configuration files
- [ ] Update any placeholder values

### 3. KV Namespaces
- [ ] Create production KV namespace: `wrangler kv:namespace create "API_KEYS"`
- [ ] Create production KV namespace: `wrangler kv:namespace create "API_KEY_METADATA"`
- [ ] Create production KV namespace: `wrangler kv:namespace create "RATE_LIMIT"`
- [ ] Create preview KV namespace: `wrangler kv:namespace create "API_KEYS" --preview`
- [ ] Create preview KV namespace: `wrangler kv:namespace create "API_KEY_METADATA" --preview`
- [ ] Create preview KV namespace: `wrangler kv:namespace create "RATE_LIMIT" --preview`
- [ ] Copy all namespace IDs

### 4. Configuration
- [ ] Update `wrangler.toml` with production KV namespace IDs
- [ ] Update `wrangler.toml` with preview KV namespace IDs
- [ ] Verify route configuration: `auth.blackroad.io/*`
- [ ] Verify zone_name: `blackroad.io`
- [ ] Review environment-specific variables

### 5. Secrets
- [ ] Generate admin API key: `openssl rand -hex 32`
- [ ] Store admin key in password manager
- [ ] Set production secret: `wrangler secret put ADMIN_API_KEY`
- [ ] Set dev secret: `wrangler secret put ADMIN_API_KEY --env dev`
- [ ] Set staging secret: `wrangler secret put ADMIN_API_KEY --env staging`
- [ ] Create `.dev.vars` file for local development
- [ ] Add `.dev.vars` to `.gitignore` (already done)

## Development Deployment

### 6. Local Testing
- [ ] Start local dev server: `npm run dev`
- [ ] Test health endpoint: `curl http://localhost:8787/health`
- [ ] Test version endpoint: `curl http://localhost:8787/version`
- [ ] Test key creation (with admin key)
- [ ] Test key validation
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Stop dev server

### 7. Development Environment
- [ ] Deploy to dev: `npm run deploy:dev`
- [ ] Verify deployment URL: `blackroad-auth-dev.alexa.workers.dev`
- [ ] Test health: `curl https://blackroad-auth-dev.alexa.workers.dev/health`
- [ ] Create test API key
- [ ] Validate test API key
- [ ] List keys for test user
- [ ] Revoke test API key
- [ ] Test rate limit enforcement (make many requests)
- [ ] Review logs: `wrangler tail --env dev`

## Staging Deployment

### 8. Staging Environment
- [ ] Deploy to staging: `npm run deploy:staging`
- [ ] Verify deployment URL: `blackroad-auth-staging.alexa.workers.dev`
- [ ] Run full test suite: `npm test`
- [ ] Create staging API keys for each tier (free, starter, pro, enterprise)
- [ ] Test all endpoints with each tier
- [ ] Test IP restrictions
- [ ] Test origin restrictions
- [ ] Test scope-based permissions
- [ ] Verify rate limits for each tier
- [ ] Test concurrent requests
- [ ] Monitor staging for 24 hours

### 9. Integration Testing
- [ ] Test integration with API Gateway worker (if applicable)
- [ ] Test validateApiKey function export
- [ ] Test service binding (if used)
- [ ] Test error scenarios
- [ ] Test CORS with different origins
- [ ] Load test with ab or wrk
- [ ] Review all logs for errors

## Production Deployment

### 10. Final Preparation
- [ ] Review all code changes
- [ ] Run type check: `npm run build`
- [ ] Run all tests: `npm test`
- [ ] Review wrangler.toml one final time
- [ ] Backup current production deployment (if exists)
- [ ] Notify team of deployment window
- [ ] Prepare rollback plan

### 11. Production Deploy
- [ ] Deploy to production: `npm run deploy`
- [ ] Verify deployment URL: `blackroad-auth.alexa.workers.dev`
- [ ] Verify custom domain: `auth.blackroad.io`
- [ ] Check DNS propagation: `dig auth.blackroad.io`
- [ ] Test health: `curl https://auth.blackroad.io/health`
- [ ] Test version: `curl https://auth.blackroad.io/version`

### 12. Production Verification
- [ ] Create first production API key (for yourself)
- [ ] Store production API key securely
- [ ] Test validation endpoint
- [ ] Create API keys for each production user
- [ ] Verify rate limiting works correctly
- [ ] Test from different geographic regions
- [ ] Monitor initial traffic
- [ ] Watch for any errors: `npm run tail`

## Post-Deployment

### 13. Monitoring Setup
- [ ] Set up Cloudflare Analytics dashboard
- [ ] Configure alerts for error rates
- [ ] Configure alerts for rate limit hits
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Create Linear project for tracking issues
- [ ] Document all production API keys

### 14. Documentation
- [ ] Update INFRASTRUCTURE_INVENTORY.md with KV namespace IDs
- [ ] Update CLOUDFLARE_INFRA.md with worker details
- [ ] Add admin API key to secure credential store
- [ ] Document production API keys and their owners
- [ ] Share deployment notes with team
- [ ] Update any dependent services

### 15. Security Review
- [ ] Verify admin key is not in code
- [ ] Verify admin key is not in logs
- [ ] Confirm rate limits are appropriate
- [ ] Review IP restriction implementation
- [ ] Review origin restriction implementation
- [ ] Test revocation mechanism
- [ ] Verify no keys are logged in plaintext
- [ ] Review CORS configuration

### 16. Integration Updates
- [ ] Update API Gateway worker (if applicable)
- [ ] Update other dependent workers
- [ ] Test end-to-end flows
- [ ] Update client libraries/SDKs
- [ ] Update API documentation

## Ongoing Maintenance

### 17. Weekly Tasks
- [ ] Review error logs
- [ ] Check rate limit utilization
- [ ] Monitor for unusual patterns
- [ ] Review revoked keys
- [ ] Check KV storage usage
- [ ] Verify backups are working

### 18. Monthly Tasks
- [ ] Review all active API keys
- [ ] Audit user permissions
- [ ] Check for unused keys
- [ ] Review rate limit tiers
- [ ] Update documentation
- [ ] Security review
- [ ] Performance review

### 19. Quarterly Tasks
- [ ] Rotate admin API key
- [ ] Full security audit
- [ ] Review and update dependencies
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Update runbooks

## Rollback Plan

### If Issues Arise
- [ ] Check error logs: `wrangler tail`
- [ ] Review recent deployments: `wrangler deployments list`
- [ ] Rollback if needed: `wrangler rollback --message "Reason"`
- [ ] Notify team of rollback
- [ ] Investigate root cause
- [ ] Create Linear issue
- [ ] Fix and re-deploy

## Verification Commands

```bash
# Health check
curl https://auth.blackroad.io/health

# Version check
curl https://auth.blackroad.io/version

# Create key (admin)
curl -X POST https://auth.blackroad.io/keys/create \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","tier":"free"}' | jq .

# Validate key
curl https://auth.blackroad.io/keys/validate \
  -H "X-API-Key: $API_KEY" | jq .

# List keys
curl https://auth.blackroad.io/keys/list?user_id=test \
  -H "Authorization: Bearer $ADMIN_KEY" | jq .

# Revoke key
curl -X DELETE https://auth.blackroad.io/keys/revoke \
  -H "Authorization: Bearer $ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api_key":"br_...","reason":"test"}' | jq .
```

## Success Criteria

Production deployment is successful when:
- [ ] All health checks pass
- [ ] API keys can be created
- [ ] API keys can be validated
- [ ] Rate limiting works correctly
- [ ] Keys can be revoked
- [ ] Keys can be listed
- [ ] CORS works from allowed origins
- [ ] IP restrictions work (if configured)
- [ ] No errors in logs for 1 hour
- [ ] Response times < 100ms (p95)
- [ ] Custom domain resolves correctly
- [ ] Integration with other workers works

## Emergency Contacts

- **Primary**: Alexa Amundson (amundsonalexa@gmail.com)
- **Company**: blackroad.systems@gmail.com
- **Cloudflare Support**: dashboard.cloudflare.com/support
- **Linear**: Linear project for issues

## Notes

Date deployed: _______________
Deployed by: _______________
Version: 1.0.0
Git commit: _______________
Any issues: _______________

---

Deployment Checklist for BlackRoad Auth Worker
Last updated: 2025-12-02
