/**
 * BlackRoad Systems Router
 * Routes blackroad.systems traffic to the Pages deployment
 *
 * @owner Alexa Louise Amundson
 * @system BlackRoad OS
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Fetch from the blackroad-systems Pages deployment
    const pagesUrl = `https://blackroad-systems.pages.dev${url.pathname}${url.search}`;

    try {
      const response = await fetch(pagesUrl, {
        method: request.method,
        headers: request.headers,
        body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
      });

      // Clone response with CORS headers
      const newHeaders = new Headers(response.headers);
      newHeaders.set('X-Served-By', 'blackroad-systems-router');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Service unavailable',
        message: 'BlackRoad Systems is temporarily unavailable',
        status: 503
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'X-Served-By': 'blackroad-systems-router'
        }
      });
    }
  }
}
