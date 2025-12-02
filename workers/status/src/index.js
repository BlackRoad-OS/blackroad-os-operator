/**
 * BlackRoad OS Status API
 *
 * Lightweight status endpoint running at Cloudflare's edge
 * Monitors all BlackRoad services and provides unified status
 *
 * Endpoints:
 *   GET /         → Full status
 *   GET /health   → Quick health check
 *   GET /services → List all services
 */

const SERVICES = {
  // Cloudflare Pages (static sites)
  pages: {
    'blackroad-os-web': 'https://blackroad-os-web.pages.dev',
    'blackroad-os-docs': 'https://blackroad-os-docs.pages.dev',
    'blackroad-hello': 'https://blackroad-hello.pages.dev',
    'blackroad-console': 'https://blackroad-console.pages.dev',
  },

  // Railway (dynamic backends)
  railway: {
    'docs-api': 'https://blackroad-os-docs-production.up.railway.app',
  },

  // Custom domains
  domains: {
    'blackroad.io': 'https://blackroad.io',
    'lucidia.earth': 'https://lucidia.earth',
    'blackroadai.com': 'https://blackroadai.com',
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Quick health check
    if (path === '/health' || path === '/_health') {
      return json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        edge: request.cf?.colo || 'unknown',
      }, corsHeaders);
    }

    // List services
    if (path === '/services') {
      return json({
        services: SERVICES,
        count: Object.values(SERVICES).reduce((acc, cat) => acc + Object.keys(cat).length, 0)
      }, corsHeaders);
    }

    // Full status check
    if (path === '/' || path === '/status') {
      const status = await checkAllServices(request);
      return json(status, corsHeaders);
    }

    // Check specific service
    if (path.startsWith('/check/')) {
      const serviceName = path.replace('/check/', '');
      const result = await checkService(serviceName);
      return json(result, corsHeaders);
    }

    return json({ error: 'Not Found', path }, corsHeaders, 404);
  }
};

function json(data, headers, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers
  });
}

async function checkAllServices(request) {
  const results = {
    status: 'operational',
    timestamp: new Date().toISOString(),
    edge_location: request.cf?.colo || 'unknown',
    edge_country: request.cf?.country || 'unknown',
    services: {},
    summary: {
      total: 0,
      healthy: 0,
      degraded: 0,
      down: 0
    }
  };

  // Check each category
  for (const [category, services] of Object.entries(SERVICES)) {
    results.services[category] = {};

    for (const [name, url] of Object.entries(services)) {
      const check = await checkUrl(url);
      results.services[category][name] = check;
      results.summary.total++;

      if (check.status === 'healthy') {
        results.summary.healthy++;
      } else if (check.status === 'degraded') {
        results.summary.degraded++;
      } else {
        results.summary.down++;
      }
    }
  }

  // Overall status
  if (results.summary.down > 0) {
    results.status = 'partial_outage';
  } else if (results.summary.degraded > 0) {
    results.status = 'degraded';
  }

  return results;
}

async function checkService(name) {
  // Find service URL
  for (const [category, services] of Object.entries(SERVICES)) {
    if (services[name]) {
      return {
        name,
        category,
        ...await checkUrl(services[name])
      };
    }
  }

  return { error: 'Service not found', name };
}

async function checkUrl(url) {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'BlackRoad-Status-Check/1.0'
      }
    });

    clearTimeout(timeout);
    const latency = Date.now() - start;

    return {
      url,
      status: response.ok ? 'healthy' : 'degraded',
      http_status: response.status,
      latency_ms: latency,
      checked_at: new Date().toISOString()
    };
  } catch (error) {
    return {
      url,
      status: 'down',
      error: error.message,
      latency_ms: Date.now() - start,
      checked_at: new Date().toISOString()
    };
  }
}
