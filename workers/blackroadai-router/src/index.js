/**
 * BlackRoad AI Router
 * Routes blackroadai.com traffic to the BlackRoad AI landing page
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

const PAGES_ORIGIN = 'https://blackroad-os-web.pages.dev';
const CONTENT_PATH = '/blackroadai/';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Health check endpoint
    if (path === '/health' || path === '/_health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'blackroadai-router',
        domain: 'blackroadai.com',
        timestamp: new Date().toISOString(),
        edge: request.cf?.colo || 'unknown'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // API info endpoint
    if (path === '/api' || path === '/api/') {
      return new Response(JSON.stringify({
        service: 'blackroadai-router',
        status: 'online',
        version: '1.0.0',
        domain: 'blackroadai.com',
        routes_to: PAGES_ORIGIN + CONTENT_PATH,
        owner: 'Alexa Louise Amundson',
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'blackroadai-router'
        }
      });
    }

    // Serve content from Pages
    let targetPath;
    if (path === '/' || path === '') {
      targetPath = CONTENT_PATH + 'index.html';
    } else {
      targetPath = CONTENT_PATH + path.slice(1);
    }

    try {
      const targetUrl = PAGES_ORIGIN + targetPath + url.search;
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // If 404 from domain path, try from root
      if (response.status === 404 && path !== '/') {
        const rootResponse = await fetch(PAGES_ORIGIN + path + url.search, {
          method: request.method,
          headers: request.headers,
        });
        if (rootResponse.ok) {
          return addHeaders(rootResponse);
        }
      }

      return addHeaders(response);
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        domain: 'blackroadai.com',
        message: e.message
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', 'X-Served-By': 'blackroadai-router' }
      });
    }
  }
};

function addHeaders(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Served-By', 'blackroadai-router');
  newHeaders.set('X-Content-Path', CONTENT_PATH);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
