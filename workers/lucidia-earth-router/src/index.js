/**
 * Lucidia Earth Router
 * Routes lucidia.earth traffic to blackroad-os-web Pages
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Root path - service info
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(JSON.stringify({
        service: 'lucidia-earth-router',
        status: 'online',
        version: '1.0.0',
        domain: 'lucidia.earth',
        routes_to: 'blackroad-os-web.pages.dev',
        owner: 'Alexa Louise Amundson',
        timestamp: new Date().toISOString()
      }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'lucidia-earth-router'
        }
      });
    }

    const pagesUrl = `https://blackroad-os-web.pages.dev${url.pathname}${url.search}`;
    try {
      const response = await fetch(pagesUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Served-By', 'lucidia-earth-router');
      return new Response(response.body, { status: response.status, headers: newHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Service unavailable', asset: 'lucidia.earth' }), {
        status: 503, headers: { 'Content-Type': 'application/json', 'X-Served-By': 'lucidia-earth-router' }
      });
    }
  }
}
