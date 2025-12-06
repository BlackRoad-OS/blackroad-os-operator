/**
 * BlackRoad OS - API Gateway Worker
 * Edge routing, rate limiting, and request handling
 *
 * @blackroad_name API Gateway
 * @operator alexa.operator.v1
 */

import { Router, IRequest } from 'itty-router';

// Types
interface Env {
  ENVIRONMENT: string;
  LOG_LEVEL: string;
  RATE_LIMIT: KVNamespace;
  CACHE: KVNamespace;
  SESSIONS: DurableObjectNamespace;
  RESPONSE_CACHE: R2Bucket;
  ANALYTICS: AnalyticsEngineDataset;

  // Backend URLs (set via secrets)
  OPERATOR_URL?: string;
  GOVERNANCE_URL?: string;
  COLLABORATION_URL?: string;
}

interface RateLimitConfig {
  rpm: number;
  burst: number;
}

// Rate limit tiers
const RATE_LIMITS: Record<string, RateLimitConfig> = {
  anonymous: { rpm: 100, burst: 10 },
  free: { rpm: 1000, burst: 50 },
  starter: { rpm: 5000, burst: 100 },
  pro: { rpm: 50000, burst: 500 },
  enterprise: { rpm: 500000, burst: 5000 },
};

// Backend routing
const BACKENDS: Record<string, string> = {
  '/v1/agents': 'operator',
  '/v1/tasks': 'operator',
  '/v1/chat': 'operator',
  '/v1/governance': 'governance',
  '/v1/policy': 'governance',
  '/v1/ledger': 'governance',
  '/v1/collab': 'collaboration',
  '/v1/sessions': 'collaboration',
};

// Router
const router = Router();

// ============================================
// MIDDLEWARE
// ============================================

async function withCors(request: IRequest, env: Env): Promise<Response | void> {
  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders(request),
    });
  }
}

function corsHeaders(request: IRequest): Headers {
  const origin = request.headers.get('Origin') || '*';
  const headers = new Headers();

  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  headers.set('Access-Control-Max-Age', '86400');
  headers.set('Access-Control-Allow-Credentials', 'true');

  return headers;
}

async function withRateLimit(
  request: IRequest,
  env: Env,
): Promise<Response | void> {
  const apiKey = request.headers.get('X-API-Key');
  const authHeader = request.headers.get('Authorization');

  // Determine rate limit tier
  let tier = 'anonymous';
  let identifier = request.headers.get('CF-Connecting-IP') || 'unknown';

  if (apiKey) {
    // Look up API key tier (simplified - would check database)
    const keyData = await env.CACHE.get(`apikey:${apiKey}`);
    if (keyData) {
      const parsed = JSON.parse(keyData);
      tier = parsed.tier || 'free';
      identifier = `key:${apiKey}`;
    }
  } else if (authHeader?.startsWith('Bearer ')) {
    // JWT auth - extract user ID
    tier = 'free';
    identifier = `jwt:${authHeader.slice(7, 20)}`;
  }

  const config = RATE_LIMITS[tier] || RATE_LIMITS.anonymous;
  const key = `ratelimit:${identifier}:${Math.floor(Date.now() / 60000)}`;

  // Check rate limit
  const current = parseInt(await env.RATE_LIMIT.get(key) || '0');

  if (current >= config.rpm) {
    return new Response(JSON.stringify({
      error: 'rate_limit_exceeded',
      message: `Rate limit of ${config.rpm} requests per minute exceeded`,
      retry_after: 60 - (Date.now() % 60000) / 1000,
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': config.rpm.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': Math.ceil(Date.now() / 60000).toString(),
        'Retry-After': Math.ceil(60 - (Date.now() % 60000) / 1000).toString(),
      },
    });
  }

  // Increment counter
  await env.RATE_LIMIT.put(key, (current + 1).toString(), { expirationTtl: 120 });

  // Add rate limit headers to request for downstream
  request.rateLimit = {
    limit: config.rpm,
    remaining: config.rpm - current - 1,
    reset: Math.ceil(Date.now() / 60000),
  };
}

async function withRequestId(request: IRequest): Promise<void> {
  const requestId = request.headers.get('X-Request-ID') || crypto.randomUUID();
  request.requestId = requestId;
}

async function withAnalytics(
  request: IRequest,
  env: Env,
  startTime: number,
  response: Response,
): Promise<void> {
  if (!env.ANALYTICS) return;

  const duration = Date.now() - startTime;
  const url = new URL(request.url);

  env.ANALYTICS.writeDataPoint({
    blobs: [
      request.method,
      url.pathname,
      response.status.toString(),
      request.headers.get('CF-Connecting-IP') || '',
    ],
    doubles: [duration, response.headers.get('Content-Length') || 0],
    indexes: [request.requestId || ''],
  });
}

// ============================================
// ROUTES
// ============================================

// Root path - service info
router.get('/', () => {
  return new Response(JSON.stringify({
    service: 'blackroad-api-gateway',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    owner: 'Alexa Louise Amundson',
    endpoints: ['/health', '/version', '/v1/*'],
    rate_limits: {
      anonymous: '100 rpm',
      free: '1000 rpm',
      starter: '5000 rpm',
      pro: '50000 rpm',
      enterprise: '500000 rpm'
    }
  }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// Version
router.get('/version', () => {
  return new Response(JSON.stringify({
    version: '1.0.0',
    service: 'blackroad-api-gateway',
    runtime: 'cloudflare-workers',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// API routes - proxy to backends
router.all('/v1/*', async (request: IRequest, env: Env) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Find matching backend
  let backendKey = 'operator'; // default
  for (const [prefix, backend] of Object.entries(BACKENDS)) {
    if (path.startsWith(prefix)) {
      backendKey = backend;
      break;
    }
  }

  // Get backend URL - consolidated to single operator
  const backendUrls: Record<string, string | undefined> = {
    operator: env.OPERATOR_URL || 'https://blackroad-cece-operator-production.up.railway.app',
    governance: env.GOVERNANCE_URL || 'https://blackroad-cece-operator-production.up.railway.app',
    collaboration: env.COLLABORATION_URL || 'https://blackroad-cece-operator-production.up.railway.app',
  };

  const backendUrl = backendUrls[backendKey];
  if (!backendUrl) {
    return new Response(JSON.stringify({
      error: 'backend_not_configured',
      message: `Backend ${backendKey} is not configured`,
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build proxied request
  const targetUrl = new URL(path + url.search, backendUrl);

  const headers = new Headers(request.headers);
  headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  headers.set('X-Forwarded-Proto', 'https');
  headers.set('X-Request-ID', request.requestId || crypto.randomUUID());
  headers.set('X-Gateway-Region', request.cf?.colo || 'unknown');

  // Remove Cloudflare-specific headers
  headers.delete('CF-Connecting-IP');
  headers.delete('CF-IPCountry');
  headers.delete('CF-Ray');

  try {
    const backendResponse = await fetch(targetUrl.toString(), {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD'
        ? request.body
        : undefined,
    });

    // Copy response with CORS and rate limit headers
    const responseHeaders = new Headers(backendResponse.headers);

    // Add CORS
    for (const [key, value] of corsHeaders(request).entries()) {
      responseHeaders.set(key, value);
    }

    // Add rate limit headers
    if (request.rateLimit) {
      responseHeaders.set('X-RateLimit-Limit', request.rateLimit.limit.toString());
      responseHeaders.set('X-RateLimit-Remaining', request.rateLimit.remaining.toString());
      responseHeaders.set('X-RateLimit-Reset', request.rateLimit.reset.toString());
    }

    // Add gateway headers
    responseHeaders.set('X-Gateway', 'cloudflare-workers');
    responseHeaders.set('X-Request-ID', request.requestId || '');

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Backend error:', error);

    return new Response(JSON.stringify({
      error: 'backend_error',
      message: 'Failed to connect to backend service',
      request_id: request.requestId,
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({
    error: 'not_found',
    message: 'The requested endpoint does not exist',
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ============================================
// MAIN HANDLER
// ============================================

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const startTime = Date.now();

    try {
      // Run middleware
      await withRequestId(request as IRequest);

      const corsResponse = await withCors(request as IRequest, env);
      if (corsResponse) return corsResponse;

      const rateLimitResponse = await withRateLimit(request as IRequest, env);
      if (rateLimitResponse) return rateLimitResponse;

      // Route request
      const response = await router.handle(request, env);

      // Analytics (non-blocking)
      ctx.waitUntil(
        withAnalytics(request as IRequest, env, startTime, response)
      );

      return response;

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

// ============================================
// DURABLE OBJECT: Session State
// ============================================

export class SessionDO {
  state: DurableObjectState;
  sessions: Map<string, any>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('session_id');

    if (!sessionId) {
      return new Response('session_id required', { status: 400 });
    }

    if (request.method === 'GET') {
      const session = await this.state.storage.get(sessionId);
      return new Response(JSON.stringify(session || null), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'PUT') {
      const data = await request.json();
      await this.state.storage.put(sessionId, data);
      return new Response(JSON.stringify({ success: true }));
    }

    if (request.method === 'DELETE') {
      await this.state.storage.delete(sessionId);
      return new Response(JSON.stringify({ success: true }));
    }

    return new Response('Method not allowed', { status: 405 });
  }
}
