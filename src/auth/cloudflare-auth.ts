/**
 * BlackRoad OS - Cloudflare Auth System
 *
 * Uses existing Cloudflare infrastructure:
 * - Workers for auth endpoints
 * - KV for session storage
 * - Access for identity (One-Time PIN + future Google/GitHub)
 * - Tunnel for secure routing
 *
 * Auth Domain: blackroad-systems.cloudflareaccess.com
 */

export interface CloudflareConfig {
  accountId: string;
  authDomain: string;
  apiToken: string;
  kvNamespaceId: string;
}

export interface Session {
  id: string;
  email: string;
  created: number;
  expires: number;
  accessToken?: string;
  provider: 'onetimepin' | 'google' | 'github';
}

export interface AccessJWT {
  email: string;
  exp: number;
  iat: number;
  sub: string;
  iss: string;
  aud: string[];
}

// Default config using existing infrastructure
export const DEFAULT_CONFIG: CloudflareConfig = {
  accountId: '848cf0b18d51e0170e0d1537aec3505a',
  authDomain: 'blackroad-systems.cloudflareaccess.com',
  apiToken: '', // Set via environment variable in wrangler.toml
  kvNamespaceId: 'ac869d3a3ae54cd4a4956df1ef9564b0', // blackroad-api-CLAIMS
};

/**
 * Verify Cloudflare Access JWT from request headers
 * This is set by Cloudflare Access when user authenticates
 */
export async function verifyAccessJWT(request: Request): Promise<AccessJWT | null> {
  const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!jwt) return null;

  try {
    // Cloudflare Access JWTs are already verified by the edge
    // We just decode and extract claims
    const parts = jwt.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));

    // Verify not expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload as AccessJWT;
  } catch {
    return null;
  }
}

/**
 * Get authenticated user email from Access headers
 */
export function getAccessEmail(request: Request): string | null {
  return request.headers.get('Cf-Access-Authenticated-User-Email');
}

/**
 * Create a session in KV
 */
export async function createSession(
  kv: KVNamespace,
  email: string,
  provider: Session['provider'] = 'onetimepin',
  ttl: number = 86400 // 24 hours
): Promise<Session> {
  const session: Session = {
    id: crypto.randomUUID(),
    email,
    created: Date.now(),
    expires: Date.now() + (ttl * 1000),
    provider,
  };

  await kv.put(`session:${session.id}`, JSON.stringify(session), {
    expirationTtl: ttl,
  });

  // Also index by email for lookup
  await kv.put(`email:${email}:session`, session.id, {
    expirationTtl: ttl,
  });

  return session;
}

/**
 * Get session from KV
 */
export async function getSession(kv: KVNamespace, sessionId: string): Promise<Session | null> {
  const data = await kv.get(`session:${sessionId}`);
  if (!data) return null;

  const session = JSON.parse(data) as Session;

  // Check expiry
  if (session.expires < Date.now()) {
    await kv.delete(`session:${sessionId}`);
    return null;
  }

  return session;
}

/**
 * Delete session
 */
export async function deleteSession(kv: KVNamespace, sessionId: string): Promise<void> {
  const session = await getSession(kv, sessionId);
  if (session) {
    await kv.delete(`session:${sessionId}`);
    await kv.delete(`email:${session.email}:session`);
  }
}

/**
 * Auth middleware for Workers
 */
export function authMiddleware(kv: KVNamespace) {
  return async (request: Request): Promise<{ user: AccessJWT | Session | null; error?: string }> => {
    // First try Cloudflare Access JWT (set by Access proxy)
    const accessJwt = await verifyAccessJWT(request);
    if (accessJwt) {
      return { user: accessJwt };
    }

    // Fall back to Access email header
    const accessEmail = getAccessEmail(request);
    if (accessEmail) {
      // Create/get session for this email
      const existingSessionId = await kv.get(`email:${accessEmail}:session`);
      if (existingSessionId) {
        const session = await getSession(kv, existingSessionId);
        if (session) {
          return { user: session };
        }
      }
      // Create new session
      const session = await createSession(kv, accessEmail);
      return { user: session };
    }

    // Check for Bearer token (API key)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const session = await getSession(kv, token);
      if (session) {
        return { user: session };
      }
    }

    // Check for session cookie
    const cookie = request.headers.get('Cookie');
    if (cookie) {
      const sessionMatch = cookie.match(/session=([^;]+)/);
      if (sessionMatch) {
        const session = await getSession(kv, sessionMatch[1]);
        if (session) {
          return { user: session };
        }
      }
    }

    return { user: null, error: 'Unauthorized' };
  };
}

/**
 * Generate login URL for Cloudflare Access
 */
export function getLoginUrl(redirectUri: string): string {
  const authDomain = DEFAULT_CONFIG.authDomain;
  return `https://${authDomain}/cdn-cgi/access/login?redirect_uri=${encodeURIComponent(redirectUri)}`;
}

/**
 * Generate logout URL
 */
export function getLogoutUrl(): string {
  const authDomain = DEFAULT_CONFIG.authDomain;
  return `https://${authDomain}/cdn-cgi/access/logout`;
}

// ==============================================
// Worker Export
// ==============================================

export default {
  async fetch(request: Request, env: { SESSIONS: KVNamespace }): Promise<Response> {
    const url = new URL(request.url);
    const auth = authMiddleware(env.SESSIONS);

    // Auth endpoints
    if (url.pathname === '/auth/login') {
      const redirectUri = url.searchParams.get('redirect') || url.origin;
      return Response.redirect(getLoginUrl(redirectUri), 302);
    }

    if (url.pathname === '/auth/logout') {
      // Clear session cookie and redirect to Access logout
      const response = Response.redirect(getLogoutUrl(), 302);
      return new Response(response.body, {
        status: 302,
        headers: {
          'Location': getLogoutUrl(),
          'Set-Cookie': 'session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        },
      });
    }

    if (url.pathname === '/auth/me') {
      const { user, error } = await auth(request);
      if (error || !user) {
        return new Response(JSON.stringify({ error: error || 'Not authenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ user }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname === '/auth/callback') {
      // After Access login, user lands here
      const email = getAccessEmail(request);
      if (!email) {
        return new Response('Auth failed', { status: 401 });
      }

      const session = await createSession(env.SESSIONS, email);
      const redirect = url.searchParams.get('redirect') || '/';

      return new Response(null, {
        status: 302,
        headers: {
          'Location': redirect,
          'Set-Cookie': `session=${session.id}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
        },
      });
    }

    // Protected route example
    if (url.pathname.startsWith('/api/')) {
      const { user, error } = await auth(request);
      if (error || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // Continue to API handler...
    }

    return new Response('BlackRoad Auth', { status: 200 });
  },
};
