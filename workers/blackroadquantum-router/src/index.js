/**
 * BlackRoad Quantum Router
 * Routes blackroadquantum.com traffic to the BlackRoad Quantum landing page
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

const PAGES_ORIGIN = 'https://blackroad-os-web.pages.dev';
const CONTENT_PATH = '/blackroadquantum/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === '/health' || path === '/_health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'blackroadquantum-router',
        domain: url.hostname,
        timestamp: new Date().toISOString(),
        edge: request.cf?.colo || 'unknown'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // API info
    if (path === '/api' || path === '/api/') {
      return new Response(JSON.stringify({
        service: 'blackroadquantum-router',
        status: 'online',
        version: '1.0.0',
        domain: url.hostname,
        routes_to: PAGES_ORIGIN + CONTENT_PATH,
        owner: 'Alexa Louise Amundson',
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: { 'Content-Type': 'application/json', 'X-Served-By': 'blackroadquantum-router' }
      });
    }

    // Serve content from Pages
    const targetPath = (path === '/' || path === '') ? CONTENT_PATH + 'index.html' : CONTENT_PATH + path.slice(1);

    try {
      const response = await fetch(PAGES_ORIGIN + targetPath + url.search, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      if (response.status === 404 && path !== '/') {
        const rootResponse = await fetch(PAGES_ORIGIN + path + url.search);
        if (rootResponse.ok) {
          const newHeaders = new Headers(rootResponse.headers);
          newHeaders.set('X-Served-By', 'blackroadquantum-router');
          return new Response(rootResponse.body, { status: rootResponse.status, headers: newHeaders });
        }
      }

      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Served-By', 'blackroadquantum-router');
      return new Response(response.body, { status: response.status, headers: newHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Service unavailable', domain: url.hostname }), {
        status: 503, headers: { 'Content-Type': 'application/json', 'X-Served-By': 'blackroadquantum-router' }
      });
    }
  }
}
