/**
 * Cece Edge Worker - Front door to BlackRoad AI
 *
 * Routes requests to the Railway operator backend
 * Handles /chat, /health, and provides a friendly landing page
 *
 * @owner Alexa Louise Amundson
 * @agent Cece
 */

export interface Env {
  OPERATOR_URL: string;
  CECE_VERSION: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Content-Type': 'application/json',
};

const DEFAULT_OPERATOR_URL = 'https://cozy-dream-all.up.railway.app';

// Cece's personality stamp
function ceceStamp() {
  return {
    agent: 'Cece',
    edge: 'Cloudflare',
    owner: 'Alexa Louise Amundson',
    infrastructure: 'BlackRoad OS',
    timestamp: new Date().toISOString(),
  };
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // Health check
    if (path === '/health' || path === '/') {
      if (request.method === 'GET') {
        return new Response(JSON.stringify({
          status: 'online',
          service: 'cece-edge',
          version: env.CECE_VERSION || '1.0.0',
          ...ceceStamp(),
          endpoints: {
            chat: 'POST /chat',
            health: 'GET /health',
            info: 'GET /info',
          },
          message: "Hi! I'm Cece, your BlackRoad AI assistant. Send me a message!",
        }, null, 2), {
          status: 200,
          headers: CORS_HEADERS,
        });
      }
    }

    // Info endpoint
    if (path === '/info' && request.method === 'GET') {
      return new Response(JSON.stringify({
        name: 'Cece',
        description: 'BlackRoad AI Assistant - Edge Gateway',
        capabilities: [
          'Natural language chat',
          'Multi-model routing (OpenAI, Anthropic, Ollama)',
          'Context-aware responses',
          'RAG support',
        ],
        backend: 'Railway (cozy-dream-all)',
        ...ceceStamp(),
      }, null, 2), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    // Main chat endpoint
    if (path === '/chat') {
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({
          error: 'Method not allowed. Use POST.',
          hint: 'POST /chat with { "message": "your message" }',
        }), {
          status: 405,
          headers: CORS_HEADERS,
        });
      }

      let body: any;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({
          error: 'Invalid JSON body',
          hint: 'Send valid JSON: { "message": "hello" }',
        }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      const { message, user_id, model, context } = body || {};

      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({
          error: "Missing or invalid 'message' field",
          hint: 'Include a "message" string in your request body',
        }), {
          status: 400,
          headers: CORS_HEADERS,
        });
      }

      const operatorUrl = env.OPERATOR_URL || DEFAULT_OPERATOR_URL;
      const startTime = Date.now();

      try {
        const resp = await fetch(`${operatorUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || 'unknown',
            'X-Edge-Location': request.cf?.colo as string || 'unknown',
          },
          body: JSON.stringify({
            message,
            user_id: user_id || 'anonymous',
            model,
            context,
          }),
        });

        const edgeLatency = Date.now() - startTime;

        if (!resp.ok) {
          const text = await resp.text();
          return new Response(JSON.stringify({
            error: 'Backend operator call failed',
            status: resp.status,
            detail: text,
            ...ceceStamp(),
          }), {
            status: 502,
            headers: CORS_HEADERS,
          });
        }

        const data = await resp.json() as any;

        // Enhance response with edge metadata
        return new Response(JSON.stringify({
          ...data,
          edge: {
            location: request.cf?.colo || 'unknown',
            country: request.cf?.country || 'unknown',
            latency_ms: edgeLatency,
            cached: false,
          },
          ...ceceStamp(),
        }, null, 2), {
          status: 200,
          headers: CORS_HEADERS,
        });

      } catch (err: any) {
        console.error('Error in cece worker:', err);
        return new Response(JSON.stringify({
          error: 'Failed to reach backend',
          detail: err.message || 'Unknown error',
          hint: 'The Railway backend may be starting up. Try again in a moment.',
          ...ceceStamp(),
        }), {
          status: 503,
          headers: CORS_HEADERS,
        });
      }
    }

    // 404 for unknown paths
    return new Response(JSON.stringify({
      error: 'Not found',
      path,
      available: ['GET /', 'GET /health', 'GET /info', 'POST /chat'],
      ...ceceStamp(),
    }), {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
};
