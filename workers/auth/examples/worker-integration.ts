/**
 * Example: Integrating blackroad-auth validation into another worker
 *
 * This shows how to use the validateApiKey function from the auth worker
 * in your own Cloudflare Workers.
 */

import { validateApiKey } from '../src/index';

interface Env {
  API_KEYS: KVNamespace;
  API_KEY_METADATA: KVNamespace;
  RATE_LIMIT: KVNamespace;
}

// Example Worker: Protected API
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Public endpoint - no auth required
    if (url.pathname === '/public') {
      return new Response(JSON.stringify({
        message: 'This is a public endpoint',
        timestamp: new Date().toISOString(),
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Protected endpoints - require API key
    const validation = await validateApiKey(request, env);

    if (!validation.valid) {
      return new Response(JSON.stringify({
        error: validation.error,
        message: getErrorMessage(validation.error),
      }), {
        status: validation.error === 'rate_limit_exceeded' ? 429 : 401,
        headers: {
          'Content-Type': 'application/json',
          ...(validation.rate_limit && {
            'X-RateLimit-Limit': validation.rate_limit.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': validation.rate_limit.reset.toString(),
          }),
        },
      });
    }

    // Authentication successful - access key data
    const userId = validation.key_data!.user_id;
    const tier = validation.key_data!.tier;
    const scopes = validation.key_data!.metadata.scopes || [];

    // Check if user has required scope
    if (url.pathname.startsWith('/admin') && !scopes.includes('admin')) {
      return new Response(JSON.stringify({
        error: 'insufficient_permissions',
        message: 'Admin scope required for this endpoint',
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Your protected business logic here
    let responseData;

    if (url.pathname === '/protected') {
      responseData = {
        message: 'This is a protected endpoint',
        user_id: userId,
        tier: tier,
        scopes: scopes,
        timestamp: new Date().toISOString(),
      };
    } else if (url.pathname === '/admin') {
      responseData = {
        message: 'This is an admin endpoint',
        user_id: userId,
        admin_actions: ['create', 'update', 'delete'],
        timestamp: new Date().toISOString(),
      };
    } else {
      return new Response(JSON.stringify({
        error: 'not_found',
        message: 'Endpoint not found',
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Return successful response with rate limit headers
    return new Response(JSON.stringify(responseData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': validation.rate_limit!.limit.toString(),
        'X-RateLimit-Remaining': validation.rate_limit!.remaining.toString(),
        'X-RateLimit-Reset': validation.rate_limit!.reset.toString(),
      },
    });
  },
};

function getErrorMessage(error?: string): string {
  const messages: Record<string, string> = {
    'missing_api_key': 'API key is required. Provide it via X-API-Key header or Authorization: Bearer token.',
    'invalid_api_key': 'The provided API key is invalid or does not exist.',
    'revoked_api_key': 'This API key has been revoked and is no longer valid.',
    'ip_not_allowed': 'Your IP address is not authorized to use this API key.',
    'origin_not_allowed': 'Your origin is not authorized to use this API key.',
    'rate_limit_exceeded': 'Rate limit exceeded. Please wait before making more requests.',
    'validation_error': 'An error occurred while validating your API key.',
  };

  return messages[error || ''] || 'Authentication failed.';
}
