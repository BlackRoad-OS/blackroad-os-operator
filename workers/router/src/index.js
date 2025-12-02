/**
 * BlackRoad OS Edge Router
 *
 * Smart routing at Cloudflare's edge (300+ locations worldwide)
 * Zero cold start, runs in <1ms
 *
 * Routes:
 *   /api/*     → Railway backend
 *   /health    → Health check
 *   /static/*  → R2 storage (when enabled)
 *   /*         → Cloudflare Pages
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers for API requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check endpoint
      if (path === '/health' || path === '/_health') {
        return new Response(JSON.stringify({
          status: 'ok',
          edge: request.cf?.colo || 'unknown',
          timestamp: new Date().toISOString(),
          service: 'blackroad-router',
          version: '1.0.0'
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        });
      }

      // API routes → Railway
      if (path.startsWith('/api/')) {
        return proxyToRailway(request, env, path);
      }

      // Agents API → Railway
      if (path.startsWith('/agents/')) {
        return proxyToRailway(request, env, path);
      }

      // Static assets → R2 (when enabled)
      if (path.startsWith('/static/') || path.startsWith('/assets/')) {
        return handleStatic(request, env, path);
      }

      // Framework/docs routes → Railway docs service
      if (path.startsWith('/docs/') || path.startsWith('/framework/')) {
        return proxyToRailway(request, env, path);
      }

      // Everything else → pass through (Pages handles it)
      return fetch(request);

    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
        edge: request.cf?.colo
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }
};

/**
 * Proxy request to Railway backend
 */
async function proxyToRailway(request, env, path) {
  const railwayUrl = env.RAILWAY_API_URL || 'https://blackroad-os-docs-production.up.railway.app';
  const targetUrl = `${railwayUrl}${path}`;

  // Clone request with new URL
  const modifiedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow'
  });

  // Add forwarding headers
  modifiedRequest.headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP') || '');
  modifiedRequest.headers.set('X-Forwarded-Proto', 'https');
  modifiedRequest.headers.set('X-Original-Host', new URL(request.url).host);

  const response = await fetch(modifiedRequest);

  // Add CORS headers to response
  const newHeaders = new Headers(response.headers);
  newHeaders.set('Access-Control-Allow-Origin', '*');
  newHeaders.set('X-Served-By', 'blackroad-edge');
  newHeaders.set('X-Edge-Location', request.cf?.colo || 'unknown');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

/**
 * Handle static assets from R2
 */
async function handleStatic(request, env, path) {
  // If R2 is configured
  if (env.ASSETS) {
    const key = path.replace(/^\/(static|assets)\//, '');
    const object = await env.ASSETS.get(key);

    if (object) {
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
      headers.set('Cache-Control', 'public, max-age=31536000'); // 1 year
      headers.set('ETag', object.httpEtag);

      return new Response(object.body, { headers });
    }
  }

  // Fallback: Custom 404 with data sovereignty message
  return new Response(JSON.stringify({
    error: "Oops! Looks like the data you're looking for belongs to someone else.",
    message: "This data is owned by Alexa Louise Amundson and stored on BlackRoad infrastructure.",
    hint: "If you're a model trainer looking for training data, this isn't it.",
    path
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}
