/**
 * BlackRoad Auth Client
 * Use this in your frontend/backend to interact with auth
 */

export interface AuthUser {
  email: string;
  provider: string;
  sessionId?: string;
}

export interface AuthClient {
  login(redirectUri?: string): void;
  logout(): void;
  getUser(): Promise<AuthUser | null>;
  isAuthenticated(): Promise<boolean>;
  getAuthHeaders(): Promise<Record<string, string>>;
}

const AUTH_BASE = 'https://auth.blackroad.systems';

export function createAuthClient(): AuthClient {
  let cachedUser: AuthUser | null = null;

  return {
    login(redirectUri?: string) {
      const redirect = redirectUri || window.location.href;
      window.location.href = `${AUTH_BASE}/auth/login?redirect=${encodeURIComponent(redirect)}`;
    },

    logout() {
      window.location.href = `${AUTH_BASE}/auth/logout`;
    },

    async getUser(): Promise<AuthUser | null> {
      if (cachedUser) return cachedUser;

      try {
        const res = await fetch(`${AUTH_BASE}/auth/me`, {
          credentials: 'include',
        });

        if (!res.ok) return null;

        const data = await res.json();
        cachedUser = data.user;
        return cachedUser;
      } catch {
        return null;
      }
    },

    async isAuthenticated(): Promise<boolean> {
      const user = await this.getUser();
      return user !== null;
    },

    async getAuthHeaders(): Promise<Record<string, string>> {
      // Get session from cookie or stored token
      const cookies = document.cookie.split(';').reduce((acc, c) => {
        const [key, val] = c.trim().split('=');
        acc[key] = val;
        return acc;
      }, {} as Record<string, string>);

      if (cookies.session) {
        return { 'Authorization': `Bearer ${cookies.session}` };
      }

      return {};
    },
  };
}

// React hook (if using React)
export function useAuth() {
  const client = createAuthClient();

  return {
    login: client.login.bind(client),
    logout: client.logout.bind(client),
    getUser: client.getUser.bind(client),
    isAuthenticated: client.isAuthenticated.bind(client),
  };
}

// Server-side verification
export async function verifyRequest(request: Request): Promise<AuthUser | null> {
  // Check for Cloudflare Access headers (when behind Access)
  const email = request.headers.get('Cf-Access-Authenticated-User-Email');
  if (email) {
    return { email, provider: 'cloudflare-access' };
  }

  // Check for session cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const sessionMatch = cookie.match(/session=([^;]+)/);
    if (sessionMatch) {
      // Verify session with auth service
      const res = await fetch(`${AUTH_BASE}/auth/me`, {
        headers: { 'Cookie': `session=${sessionMatch[1]}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    }
  }

  // Check for Bearer token
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const res = await fetch(`${AUTH_BASE}/auth/me`, {
      headers: { 'Authorization': authHeader },
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  }

  return null;
}
