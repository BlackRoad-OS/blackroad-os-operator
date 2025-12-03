# Integration Guide - Using BlackRoad Auth in Other Workers

This guide shows how to integrate the BlackRoad Auth worker into your existing Cloudflare Workers.

## Method 1: Direct Function Import (Recommended)

The cleanest approach is to import the `validateApiKey` function directly and share KV namespaces.

### Step 1: Update Your Worker's wrangler.toml

Add the same KV namespace bindings to your worker:

```toml
# In your worker's wrangler.toml (e.g., api-gateway/wrangler.toml)

# Add these KV namespaces (use the same IDs as the auth worker)
[[kv_namespaces]]
binding = "API_KEYS"
id = "abc123..."  # Same ID from auth worker

[[kv_namespaces]]
binding = "API_KEY_METADATA"
id = "def456..."  # Same ID from auth worker

[[kv_namespaces]]
binding = "RATE_LIMIT"
id = "ghi789..."  # Same ID from auth worker
```

### Step 2: Install Auth Package (if using npm workspace)

```bash
# If using npm workspaces
npm install ../auth

# Or add to package.json
{
  "dependencies": {
    "@blackroad/auth": "file:../auth"
  }
}
```

### Step 3: Import and Use in Your Worker

```typescript
// In your worker (e.g., api-gateway/src/index.ts)
import { validateApiKey } from '@blackroad/auth';

interface Env {
  // ... your existing bindings
  API_KEYS: KVNamespace;
  API_KEY_METADATA: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

// Middleware for authentication
async function withAuth(request: Request, env: Env): Promise<Response | void> {
  const validation = await validateApiKey(request, env);

  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: validation.error,
      message: getAuthErrorMessage(validation.error),
    }), {
      status: validation.error === 'rate_limit_exceeded' ? 429 : 401,
      headers: {
        'Content-Type': 'application/json',
        ...(validation.rate_limit && {
          'X-RateLimit-Limit': validation.rate_limit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': validation.rate_limit.reset.toString(),
        }),
      },
    });
  }

  // Store validation result for later use
  (request as any).auth = {
    userId: validation.key_data!.user_id,
    tier: validation.key_data!.tier,
    scopes: validation.key_data!.metadata.scopes || [],
    rateLimit: validation.rate_limit,
  };
}

// Use in your router
router.get('/v1/protected-endpoint', async (request, env) => {
  // Authenticate
  const authError = await withAuth(request, env);
  if (authError) return authError;

  // Access auth data
  const auth = (request as any).auth;

  // Your business logic
  return new Response(JSON.stringify({
    message: 'Authenticated!',
    user_id: auth.userId,
    tier: auth.tier,
  }));
});
```

## Method 2: HTTP API Calls

If you can't share KV namespaces or prefer separation, call the auth worker's API.

### Step 1: Configure Service Binding (Optional)

```toml
# In your worker's wrangler.toml
[[service_bindings]]
binding = "AUTH_SERVICE"
service = "blackroad-auth"
environment = "production"
```

### Step 2: Call Auth Service

```typescript
interface Env {
  AUTH_SERVICE: Fetcher;  // If using service binding
  // OR
  AUTH_URL: string;  // If using HTTP
}

async function validateWithAuthService(
  request: Request,
  env: Env
): Promise<ValidationResult> {
  // Copy relevant headers
  const authRequest = new Request('http://internal/keys/validate', {
    method: 'GET',
    headers: {
      'X-API-Key': request.headers.get('X-API-Key') || '',
      'Authorization': request.headers.get('Authorization') || '',
      'Origin': request.headers.get('Origin') || '',
      'CF-Connecting-IP': request.headers.get('CF-Connecting-IP') || '',
    },
  });

  // Call auth service (via service binding)
  const response = await env.AUTH_SERVICE.fetch(authRequest);

  // OR call via HTTP
  // const response = await fetch(`${env.AUTH_URL}/keys/validate`, authRequest);

  const data = await response.json();

  return {
    valid: data.valid,
    userId: data.user_id,
    tier: data.tier,
    scopes: data.scopes,
    rateLimit: data.rate_limit,
  };
}
```

## Method 3: Durable Object Stub (Advanced)

For high-performance validation with session state.

```typescript
// Define the auth interface
interface AuthDO {
  validate(apiKey: string, ip: string): Promise<ValidationResult>;
}

// In your worker
const authId = env.AUTH_DO.idFromName('singleton');
const authStub = env.AUTH_DO.get(authId);

const result = await authStub.validate(apiKey, clientIp);
```

## Integration Example: API Gateway

Here's how to integrate auth into the existing `api-gateway` worker:

```typescript
// api-gateway/src/index.ts

import { Router, IRequest } from 'itty-router';
import { validateApiKey } from '@blackroad/auth';

interface Env {
  // ... existing bindings
  API_KEYS: KVNamespace;
  API_KEY_METADATA: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

// Enhanced middleware with auth
async function withAuth(request: IRequest, env: Env): Promise<Response | void> {
  const url = new URL(request.url);

  // Skip auth for public endpoints
  if (PUBLIC_ENDPOINTS.includes(url.pathname)) {
    return;
  }

  // Validate API key
  const validation = await validateApiKey(request, env);

  if (!validation.valid) {
    return new Response(JSON.stringify({
      error: validation.error,
      message: AUTH_ERROR_MESSAGES[validation.error || ''] || 'Authentication failed',
    }), {
      status: validation.error === 'rate_limit_exceeded' ? 429 : 401,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': validation.rate_limit?.limit.toString() || '0',
        'X-RateLimit-Remaining': validation.rate_limit?.remaining.toString() || '0',
        'X-RateLimit-Reset': validation.rate_limit?.reset.toString() || '0',
      },
    });
  }

  // Store auth data on request
  request.auth = {
    userId: validation.key_data!.user_id,
    tier: validation.key_data!.tier,
    scopes: validation.key_data!.metadata.scopes || [],
    rateLimit: validation.rate_limit!,
  };

  // Add rate limit info for logging
  request.rateLimit = validation.rate_limit!;
}

// Main handler with auth middleware
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    try {
      // Run middleware in order
      await withRequestId(request as IRequest);

      const corsResponse = await withCors(request as IRequest, env);
      if (corsResponse) return corsResponse;

      // NEW: Auth middleware (replaces the old rate limit middleware)
      const authResponse = await withAuth(request as IRequest, env);
      if (authResponse) return authResponse;

      // Route request
      const response = await router.handle(request, env);

      // Add rate limit headers from auth
      const headers = new Headers(response.headers);
      const req = request as IRequest;
      if (req.rateLimit) {
        headers.set('X-RateLimit-Limit', req.rateLimit.limit.toString());
        headers.set('X-RateLimit-Remaining', req.rateLimit.remaining.toString());
        headers.set('X-RateLimit-Reset', req.rateLimit.reset.toString());
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

    } catch (error) {
      console.error('Gateway error:', error);
      return new Response(JSON.stringify({
        error: 'internal_error',
        message: 'An unexpected error occurred',
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};

const PUBLIC_ENDPOINTS = [
  '/health',
  '/version',
  '/docs',
];

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  'missing_api_key': 'API key required. Provide via X-API-Key header or Authorization: Bearer token.',
  'invalid_api_key': 'The provided API key is invalid.',
  'revoked_api_key': 'This API key has been revoked.',
  'ip_not_allowed': 'Your IP address is not authorized for this API key.',
  'origin_not_allowed': 'Your origin is not authorized for this API key.',
  'rate_limit_exceeded': 'Rate limit exceeded. Check X-RateLimit-Reset header.',
};
```

## Scope-Based Authorization

Implement fine-grained permissions based on scopes:

```typescript
function requireScope(scope: string) {
  return (request: IRequest) => {
    const scopes = request.auth?.scopes || [];

    if (!scopes.includes(scope) && !scopes.includes('admin')) {
      return new Response(JSON.stringify({
        error: 'insufficient_permissions',
        message: `Required scope: ${scope}`,
        user_scopes: scopes,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

// Use in routes
router.post('/v1/write-data',
  requireScope('write'),
  async (request, env) => {
    // Only users with 'write' or 'admin' scope can access
    // ...
  }
);

router.delete('/v1/admin/users/:id',
  requireScope('admin'),
  async (request, env) => {
    // Only users with 'admin' scope can access
    // ...
  }
);
```

## Tier-Based Features

Restrict features based on API key tier:

```typescript
function requireTier(minTier: 'free' | 'starter' | 'pro' | 'enterprise') {
  const tierLevels = { free: 0, starter: 1, pro: 2, enterprise: 3 };

  return (request: IRequest) => {
    const userTier = request.auth?.tier || 'free';
    const userLevel = tierLevels[userTier];
    const requiredLevel = tierLevels[minTier];

    if (userLevel < requiredLevel) {
      return new Response(JSON.stringify({
        error: 'tier_upgrade_required',
        message: `This endpoint requires ${minTier} tier or higher`,
        current_tier: userTier,
        required_tier: minTier,
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  };
}

// Use in routes
router.get('/v1/pro-feature',
  requireTier('pro'),
  async (request, env) => {
    // Only pro and enterprise users can access
    // ...
  }
);
```

## Testing Integration

```typescript
// test/integration.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import worker from '../src/index';

describe('Auth Integration', () => {
  let testApiKey: string;

  beforeAll(async () => {
    // Create a test API key via admin endpoint
    const response = await fetch('http://localhost:8787/keys/create', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test_admin_key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: 'test_user',
        tier: 'pro',
        scopes: ['read', 'write'],
      }),
    });

    const data = await response.json();
    testApiKey = data.api_key;
  });

  it('should allow authenticated request', async () => {
    const request = new Request('http://localhost:8787/v1/protected', {
      headers: { 'X-API-Key': testApiKey },
    });

    const response = await worker.fetch(request, testEnv, testCtx);
    expect(response.status).toBe(200);
  });

  it('should reject unauthenticated request', async () => {
    const request = new Request('http://localhost:8787/v1/protected');
    const response = await worker.fetch(request, testEnv, testCtx);

    expect(response.status).toBe(401);
  });

  it('should enforce rate limits', async () => {
    // Make requests until rate limit is hit
    // ...
  });
});
```

## Common Patterns

### Pattern 1: Optional Authentication

Allow both authenticated and anonymous requests, with different capabilities:

```typescript
router.get('/v1/data', async (request: IRequest, env: Env) => {
  // Try to authenticate, but don't require it
  const validation = await validateApiKey(request, env);

  if (validation.valid) {
    // Authenticated - return full data
    return jsonResponse({
      data: fullData,
      tier: validation.key_data!.tier,
    });
  } else {
    // Anonymous - return limited data
    return jsonResponse({
      data: limitedData,
      message: 'Authenticate for full access',
    });
  }
});
```

### Pattern 2: Multi-Factor Auth

Combine API key with other auth methods:

```typescript
async function withMultiFactorAuth(request: IRequest, env: Env) {
  // First: validate API key
  const apiKeyValidation = await validateApiKey(request, env);
  if (!apiKeyValidation.valid) {
    return errorResponse('api_key_invalid', 'Invalid API key', 401);
  }

  // Second: validate JWT token
  const jwt = request.headers.get('Authorization')?.split(' ')[1];
  const jwtValidation = await validateJWT(jwt, env);
  if (!jwtValidation.valid) {
    return errorResponse('token_invalid', 'Invalid JWT token', 401);
  }

  // Both valid - proceed
  request.auth = {
    ...apiKeyValidation.key_data,
    ...jwtValidation.user_data,
  };
}
```

### Pattern 3: Delegated Auth

Allow users to create sub-keys with restricted scopes:

```typescript
// User with 'admin' scope can create sub-keys with limited scopes
router.post('/v1/auth/create-subkey', async (request: IRequest, env: Env) {
  const authError = await withAuth(request, env);
  if (authError) return authError;

  // Check if user has admin scope
  if (!request.auth.scopes.includes('admin')) {
    return errorResponse('forbidden', 'Admin scope required', 403);
  }

  const body = await request.json();

  // Create sub-key with subset of parent scopes
  const allowedScopes = body.scopes.filter(
    (scope: string) => request.auth.scopes.includes(scope)
  );

  // Call auth worker to create the key
  // ...
});
```

## Troubleshooting

### Issue: "Binding API_KEYS not found"

**Solution**: Ensure you've added the KV namespace bindings to `wrangler.toml` with the same IDs as the auth worker.

### Issue: Rate limits not working correctly

**Solution**: Verify the RATE_LIMIT KV namespace is shared between workers.

### Issue: CORS errors when validating

**Solution**: Ensure the Origin header is being passed through to the validateApiKey function.

## Best Practices

1. **Always validate on the edge**: Don't pass unvalidated requests to origin servers
2. **Cache validation results**: For the duration of a request, not across requests
3. **Log auth failures**: Track patterns of failed authentication
4. **Use scopes granularly**: Prefer many specific scopes over few broad ones
5. **Set appropriate tiers**: Match rate limits to actual usage patterns
6. **Monitor rate limit usage**: Alert when users consistently hit limits
7. **Rotate admin keys**: Change the ADMIN_API_KEY periodically
8. **Use IP restrictions**: For server-to-server keys
9. **Use origin restrictions**: For browser-based keys
10. **Document scopes**: Keep a registry of what each scope allows

## Next Steps

1. Update your worker's `wrangler.toml` with KV bindings
2. Install or link the auth package
3. Import `validateApiKey` into your worker
4. Add authentication middleware
5. Test with example API keys
6. Deploy and monitor

## Support

- Documentation: See README.md, DEPLOYMENT.md, and QUICKSTART.md
- Email: blackroad.systems@gmail.com
- Issues: Create a Linear ticket

---

Integration Guide for BlackRoad Auth Worker
Last updated: 2025-12-02
