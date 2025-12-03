/**
 * BlackRoad OS - API Key Authentication System
 * Cloudflare Worker for managing and validating API keys
 *
 * @blackroad_name BlackRoad Auth
 * @operator alexa.operator.v1
 */

import { Router, IRequest } from 'itty-router';

// ============================================
// TYPES & INTERFACES
// ============================================

interface Env {
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  ADMIN_API_KEY: string;
  API_KEYS: KVNamespace;
  API_KEY_METADATA: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

interface ApiKeyData {
  key: string;
  user_id: string;
  tier: 'free' | 'starter' | 'pro' | 'enterprise';
  created_at: string;
  last_used?: string;
  last_used_ip?: string;
  rate_limit: RateLimitConfig;
  metadata: {
    name?: string;
    description?: string;
    scopes?: string[];
    allowed_origins?: string[];
    allowed_ips?: string[];
  };
  revoked: boolean;
  revoked_at?: string;
  revoked_reason?: string;
}

interface RateLimitConfig {
  rpm: number;  // requests per minute
  burst: number;  // burst allowance
}

interface CreateKeyRequest {
  user_id: string;
  tier?: 'free' | 'starter' | 'pro' | 'enterprise';
  name?: string;
  description?: string;
  scopes?: string[];
  allowed_origins?: string[];
  allowed_ips?: string[];
}

interface ValidationResult {
  valid: boolean;
  key_data?: ApiKeyData;
  error?: string;
  rate_limit?: {
    limit: number;
    remaining: number;
    reset: number;
  };
}

// ============================================
// CONSTANTS
// ============================================

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: { rpm: 1000, burst: 50 },
  starter: { rpm: 5000, burst: 100 },
  pro: { rpm: 50000, burst: 500 },
  enterprise: { rpm: 500000, burst: 5000 },
};

const KEY_PREFIX = 'br_';
const KEY_LENGTH = 32;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a cryptographically secure API key
 */
function generateApiKey(): string {
  const array = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(array);
  const key = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${KEY_PREFIX}${key}`;
}

/**
 * Hash an API key for storage (using SHA-256)
 */
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify admin authentication
 */
function verifyAdmin(request: IRequest, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');
  const apiKey = request.headers.get('X-API-Key');

  if (!authHeader && !apiKey) {
    return false;
  }

  const providedKey = authHeader?.replace('Bearer ', '') || apiKey || '';
  return providedKey === env.ADMIN_API_KEY;
}

/**
 * CORS headers
 */
function corsHeaders(origin?: string): Headers {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', origin || '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

/**
 * JSON response helper
 */
function jsonResponse(data: any, status = 200, additionalHeaders?: HeadersInit): Response {
  const headers = new Headers(additionalHeaders);
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers,
  });
}

/**
 * Error response helper
 */
function errorResponse(error: string, message: string, status = 400): Response {
  return jsonResponse({ error, message }, status);
}

/**
 * Log with level
 */
function log(env: Env, level: string, message: string, data?: any): void {
  const levels: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[env.LOG_LEVEL?.toLowerCase()] || 1;
  const logLevel = levels[level] || 1;

  if (logLevel >= currentLevel) {
    const timestamp = new Date().toISOString();
    const logData = data ? ` ${JSON.stringify(data)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}${logData}`);
  }
}

// ============================================
// CORE VALIDATION FUNCTION (Exported)
// ============================================

/**
 * Validate an API key and check rate limits
 * This function can be imported by other workers for authentication
 */
export async function validateApiKey(
  request: Request,
  env: Env
): Promise<ValidationResult> {
  try {
    // Extract API key from request
    const authHeader = request.headers.get('Authorization');
    const apiKeyHeader = request.headers.get('X-API-Key');

    let apiKey = apiKeyHeader;
    if (authHeader?.startsWith('Bearer ')) {
      apiKey = authHeader.replace('Bearer ', '');
    }

    if (!apiKey) {
      return {
        valid: false,
        error: 'missing_api_key',
      };
    }

    // Hash the key to look it up
    const keyHash = await hashApiKey(apiKey);
    const keyDataStr = await env.API_KEYS.get(keyHash);

    if (!keyDataStr) {
      return {
        valid: false,
        error: 'invalid_api_key',
      };
    }

    const keyData: ApiKeyData = JSON.parse(keyDataStr);

    // Check if revoked
    if (keyData.revoked) {
      return {
        valid: false,
        error: 'revoked_api_key',
      };
    }

    // Check IP restrictions
    const clientIp = request.headers.get('CF-Connecting-IP') || '';
    if (keyData.metadata.allowed_ips && keyData.metadata.allowed_ips.length > 0) {
      if (!keyData.metadata.allowed_ips.includes(clientIp)) {
        return {
          valid: false,
          error: 'ip_not_allowed',
        };
      }
    }

    // Check origin restrictions
    const origin = request.headers.get('Origin') || '';
    if (keyData.metadata.allowed_origins && keyData.metadata.allowed_origins.length > 0) {
      if (!keyData.metadata.allowed_origins.includes(origin)) {
        return {
          valid: false,
          error: 'origin_not_allowed',
        };
      }
    }

    // Check rate limit
    const rateLimitKey = `ratelimit:${keyHash}:${Math.floor(Date.now() / 60000)}`;
    const currentCount = parseInt(await env.RATE_LIMIT.get(rateLimitKey) || '0');

    if (currentCount >= keyData.rate_limit.rpm) {
      return {
        valid: false,
        error: 'rate_limit_exceeded',
        key_data: keyData,
        rate_limit: {
          limit: keyData.rate_limit.rpm,
          remaining: 0,
          reset: Math.ceil(Date.now() / 60000) * 60,
        },
      };
    }

    // Increment rate limit counter
    await env.RATE_LIMIT.put(
      rateLimitKey,
      (currentCount + 1).toString(),
      { expirationTtl: 120 }
    );

    // Update last_used metadata (async, non-blocking)
    const updatedKeyData = {
      ...keyData,
      last_used: new Date().toISOString(),
      last_used_ip: clientIp,
    };

    // Store update asynchronously
    env.API_KEYS.put(keyHash, JSON.stringify(updatedKeyData));

    return {
      valid: true,
      key_data: updatedKeyData,
      rate_limit: {
        limit: keyData.rate_limit.rpm,
        remaining: keyData.rate_limit.rpm - currentCount - 1,
        reset: Math.ceil(Date.now() / 60000) * 60,
      },
    };

  } catch (error) {
    console.error('Validation error:', error);
    return {
      valid: false,
      error: 'validation_error',
    };
  }
}

// ============================================
// ROUTER & ENDPOINTS
// ============================================

const router = Router();

/**
 * Health check
 */
router.get('/health', () => {
  return jsonResponse({
    status: 'ok',
    service: 'blackroad-auth',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Version info
 */
router.get('/version', () => {
  return jsonResponse({
    version: '1.0.0',
    service: 'blackroad-auth',
    runtime: 'cloudflare-workers',
  });
});

/**
 * POST /keys/create - Create a new API key
 * Requires admin authentication
 */
router.post('/keys/create', async (request: IRequest, env: Env) => {
  // Verify admin
  if (!verifyAdmin(request, env)) {
    return errorResponse('unauthorized', 'Admin authentication required', 401);
  }

  try {
    const body: CreateKeyRequest = await request.json();

    // Validate required fields
    if (!body.user_id) {
      return errorResponse('invalid_request', 'user_id is required', 400);
    }

    // Generate API key
    const apiKey = generateApiKey();
    const keyHash = await hashApiKey(apiKey);

    // Determine tier and rate limit
    const tier = body.tier || 'free';
    const rateLimit = RATE_LIMITS[tier] || RATE_LIMITS.free;

    // Create key data
    const keyData: ApiKeyData = {
      key: apiKey,  // Store for one-time display
      user_id: body.user_id,
      tier,
      created_at: new Date().toISOString(),
      rate_limit: rateLimit,
      metadata: {
        name: body.name,
        description: body.description,
        scopes: body.scopes || [],
        allowed_origins: body.allowed_origins || [],
        allowed_ips: body.allowed_ips || [],
      },
      revoked: false,
    };

    // Store in KV (hashed key as the key, data as value)
    await env.API_KEYS.put(keyHash, JSON.stringify(keyData));

    // Store user -> keys mapping for listing
    const userKeysKey = `user:${body.user_id}:keys`;
    const existingKeys = await env.API_KEY_METADATA.get(userKeysKey);
    const keysList = existingKeys ? JSON.parse(existingKeys) : [];
    keysList.push({
      hash: keyHash,
      created_at: keyData.created_at,
      name: body.name,
      tier,
    });
    await env.API_KEY_METADATA.put(userKeysKey, JSON.stringify(keysList));

    log(env, 'info', 'API key created', { user_id: body.user_id, tier, hash: keyHash.slice(0, 8) });

    // Return key data (key is only shown once!)
    return jsonResponse({
      success: true,
      api_key: apiKey,
      key_data: {
        hash: keyHash,
        user_id: keyData.user_id,
        tier: keyData.tier,
        created_at: keyData.created_at,
        rate_limit: keyData.rate_limit,
        metadata: keyData.metadata,
      },
      warning: 'Store this API key securely. It will not be shown again.',
    }, 201);

  } catch (error) {
    log(env, 'error', 'Failed to create API key', { error: String(error) });
    return errorResponse('creation_failed', 'Failed to create API key', 500);
  }
});

/**
 * GET /keys/validate - Validate an API key
 * Public endpoint (rate limited)
 */
router.get('/keys/validate', async (request: IRequest, env: Env) => {
  const result = await validateApiKey(request, env);

  if (!result.valid) {
    return jsonResponse({
      valid: false,
      error: result.error,
    }, 401);
  }

  return jsonResponse({
    valid: true,
    user_id: result.key_data?.user_id,
    tier: result.key_data?.tier,
    rate_limit: result.rate_limit,
    scopes: result.key_data?.metadata.scopes || [],
  });
});

/**
 * DELETE /keys/revoke - Revoke an API key
 * Requires admin authentication OR the key owner
 */
router.delete('/keys/revoke', async (request: IRequest, env: Env) => {
  const isAdmin = verifyAdmin(request, env);

  try {
    const body = await request.json() as { api_key?: string; reason?: string };

    if (!body.api_key) {
      return errorResponse('invalid_request', 'api_key is required', 400);
    }

    // Hash and lookup key
    const keyHash = await hashApiKey(body.api_key);
    const keyDataStr = await env.API_KEYS.get(keyHash);

    if (!keyDataStr) {
      return errorResponse('not_found', 'API key not found', 404);
    }

    const keyData: ApiKeyData = JSON.parse(keyDataStr);

    // Check authorization (admin or key owner)
    if (!isAdmin) {
      const providedKey = request.headers.get('X-API-Key') ||
                         request.headers.get('Authorization')?.replace('Bearer ', '');

      if (providedKey !== body.api_key) {
        return errorResponse('unauthorized', 'You can only revoke your own keys', 403);
      }
    }

    // Already revoked?
    if (keyData.revoked) {
      return jsonResponse({
        success: true,
        message: 'API key was already revoked',
        revoked_at: keyData.revoked_at,
      });
    }

    // Revoke the key
    keyData.revoked = true;
    keyData.revoked_at = new Date().toISOString();
    keyData.revoked_reason = body.reason || 'User requested';

    await env.API_KEYS.put(keyHash, JSON.stringify(keyData));

    log(env, 'info', 'API key revoked', {
      user_id: keyData.user_id,
      hash: keyHash.slice(0, 8),
      reason: keyData.revoked_reason,
    });

    return jsonResponse({
      success: true,
      message: 'API key revoked successfully',
      revoked_at: keyData.revoked_at,
    });

  } catch (error) {
    log(env, 'error', 'Failed to revoke API key', { error: String(error) });
    return errorResponse('revocation_failed', 'Failed to revoke API key', 500);
  }
});

/**
 * GET /keys/list - List all API keys for a user
 * Requires admin authentication OR user authentication
 */
router.get('/keys/list', async (request: IRequest, env: Env) => {
  const isAdmin = verifyAdmin(request, env);
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  if (!userId) {
    return errorResponse('invalid_request', 'user_id query parameter is required', 400);
  }

  // If not admin, validate that the requester owns the keys
  if (!isAdmin) {
    const validation = await validateApiKey(request, env);
    if (!validation.valid || validation.key_data?.user_id !== userId) {
      return errorResponse('unauthorized', 'You can only list your own keys', 403);
    }
  }

  try {
    const userKeysKey = `user:${userId}:keys`;
    const keysListStr = await env.API_KEY_METADATA.get(userKeysKey);

    if (!keysListStr) {
      return jsonResponse({
        user_id: userId,
        keys: [],
      });
    }

    const keysList = JSON.parse(keysListStr);

    // Fetch full details for each key
    const keysWithDetails = await Promise.all(
      keysList.map(async (keyRef: any) => {
        const keyDataStr = await env.API_KEYS.get(keyRef.hash);
        if (!keyDataStr) return null;

        const keyData: ApiKeyData = JSON.parse(keyDataStr);

        return {
          hash: keyRef.hash.slice(0, 16) + '...',  // Partial hash for reference
          name: keyData.metadata.name,
          tier: keyData.tier,
          created_at: keyData.created_at,
          last_used: keyData.last_used,
          rate_limit: keyData.rate_limit,
          revoked: keyData.revoked,
          revoked_at: keyData.revoked_at,
          scopes: keyData.metadata.scopes,
        };
      })
    );

    return jsonResponse({
      user_id: userId,
      keys: keysWithDetails.filter(k => k !== null),
    });

  } catch (error) {
    log(env, 'error', 'Failed to list API keys', { error: String(error) });
    return errorResponse('list_failed', 'Failed to list API keys', 500);
  }
});

/**
 * OPTIONS handler for CORS preflight
 */
router.options('*', (request: IRequest) => {
  const origin = request.headers.get('Origin') || '*';
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
});

/**
 * 404 handler
 */
router.all('*', () => {
  return errorResponse('not_found', 'Endpoint not found', 404);
});

// ============================================
// MAIN HANDLER
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    try {
      // Add request metadata
      const enrichedRequest = request as IRequest;
      enrichedRequest.requestId = requestId;

      // Route the request
      const response = await router.handle(enrichedRequest, env);

      // Add common headers
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

      // Add CORS headers
      const origin = request.headers.get('Origin');
      if (origin) {
        for (const [key, value] of corsHeaders(origin).entries()) {
          headers.set(key, value);
        }
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });

    } catch (error) {
      log(env, 'error', 'Unhandled error', {
        error: String(error),
        request_id: requestId,
      });

      return errorResponse(
        'internal_error',
        'An unexpected error occurred',
        500
      );
    }
  },
};
