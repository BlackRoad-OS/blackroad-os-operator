/**
 * BlackRoad Domain Router
 *
 * Routes requests based on hostname to the correct landing page.
 * All content is served from blackroad-os-web.pages.dev with path rewriting.
 */

// Map hostnames to their content paths
const DOMAIN_PATHS = {
  // Main domains
  'blackroad.io': '/blackroad-io/',
  'www.blackroad.io': '/blackroad-io/',
  'blackroadai.com': '/blackroadai/',
  'www.blackroadai.com': '/blackroadai/',
  'blackroad.network': '/blackroad-network/',
  'blackroadquantum.com': '/blackroadquantum/',
  'blackroadquantum.net': '/blackroadquantum/',
  'blackroadquantum.info': '/blackroadquantum/',
  'blackroadquantum.shop': '/blackroadquantum/',
  'blackroadquantum.store': '/blackroadquantum/',
  'lucidia.earth': '/lucidia-earth/',
  'lucidia.studio': '/lucidia-studio/',
  'blackroad.me': '/blackroad-me/',
  'blackroadinc.us': '/blackroadinc/',

  // Subdomains
  'app.blackroad.io': '/app/',
  'cece.blackroad.io': '/cece/',
  'docs.blackroad.io': '/docs/',
  'status.blackroad.io': '/status/',
  'console.blackroad.io': '/console/',
  'dashboard.blackroad.io': '/dashboard/',
  'brand.blackroad.io': '/brands/',
  'hello.blackroad.io': '/hello/',
  'portals.blackroad.io': '/portals-unified/',

  // Secondary
  'aliceqi.com': '/blackroad-io/',
  'lucidiaqi.com': '/lucidia-earth/',
  'blackroadqi.com': '/blackroad-io/',
};

const PAGES_ORIGIN = 'https://blackroad-os-web.pages.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname;
    const path = url.pathname;

    // Health check
    if (path === '/health' || path === '/_health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'domain-router',
        hostname,
        timestamp: new Date().toISOString(),
        edge: request.cf?.colo || 'unknown'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the content path for this domain
    const contentPath = DOMAIN_PATHS[hostname];

    if (!contentPath) {
      // Unknown domain - serve default
      return fetch(request);
    }

    // Rewrite the request to fetch from Pages
    let targetPath = contentPath;

    // Handle root path - serve index.html
    if (path === '/' || path === '') {
      targetPath = contentPath + 'index.html';
    } else if (!path.includes('.')) {
      // For paths without extensions, try to serve from the domain's directory
      targetPath = contentPath + path.slice(1);
      if (!targetPath.endsWith('/')) {
        targetPath += '/index.html';
      } else {
        targetPath += 'index.html';
      }
    } else {
      // For assets with extensions, check if they should come from domain path
      targetPath = contentPath + path.slice(1);
    }

    const targetUrl = PAGES_ORIGIN + targetPath;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: request.headers,
    });

    // If not found from domain path, try from root
    if (response.status === 404 && path !== '/') {
      const rootResponse = await fetch(PAGES_ORIGIN + path, {
        method: request.method,
        headers: request.headers,
      });
      if (rootResponse.ok) {
        return addHeaders(rootResponse, hostname);
      }
    }

    return addHeaders(response, hostname);
  }
};

function addHeaders(response, hostname) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set('X-Served-By', 'blackroad-domain-router');
  newHeaders.set('X-Origin-Domain', hostname);
  newHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}
