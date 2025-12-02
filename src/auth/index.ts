/**
 * BlackRoad OS Auth Module
 *
 * Complete authentication system using Cloudflare infrastructure:
 * - Cloudflare Access for identity (OTP, Google, GitHub)
 * - Workers for auth endpoints
 * - KV for session storage
 * - Tunnel for secure routing
 *
 * Usage:
 *
 * ```typescript
 * // Client-side (browser)
 * import { createAuthClient } from '@blackroad/auth/client';
 * const auth = createAuthClient();
 * auth.login(); // Redirects to Cloudflare Access
 *
 * // Server-side (Worker/Node)
 * import { verifyRequest, authMiddleware } from '@blackroad/auth';
 * const user = await verifyRequest(request);
 * ```
 */

// Server exports
export {
  verifyAccessJWT,
  getAccessEmail,
  createSession,
  getSession,
  deleteSession,
  authMiddleware,
  getLoginUrl,
  getLogoutUrl,
  DEFAULT_CONFIG,
  type CloudflareConfig,
  type Session,
  type AccessJWT,
} from './cloudflare-auth';

// Client exports
export {
  createAuthClient,
  useAuth,
  verifyRequest,
  type AuthUser,
  type AuthClient,
} from './client';

// Worker handler
export { default } from './cloudflare-auth';
