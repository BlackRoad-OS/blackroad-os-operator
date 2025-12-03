/**
 * Tests for BlackRoad Auth Worker
 *
 * Run with: npm test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker, { validateApiKey } from './index';

// Mock environment
const mockEnv = {
  ENVIRONMENT: 'test',
  LOG_LEVEL: 'error',
  ADMIN_API_KEY: 'test_admin_key_12345',
  API_KEYS: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  API_KEY_METADATA: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  RATE_LIMIT: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
} as any;

const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
} as any;

describe('BlackRoad Auth Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Health Endpoint', () => {
    it('should return health status', async () => {
      const request = new Request('http://localhost/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('ok');
      expect(data.service).toBe('blackroad-auth');
    });
  });

  describe('Version Endpoint', () => {
    it('should return version info', async () => {
      const request = new Request('http://localhost/version');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.version).toBe('1.0.0');
      expect(data.service).toBe('blackroad-auth');
    });
  });

  describe('Create Key Endpoint', () => {
    it('should reject without admin auth', async () => {
      const request = new Request('http://localhost/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'test_user' }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('should create key with valid admin auth', async () => {
      const request = new Request('http://localhost/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_admin_key_12345',
        },
        body: JSON.stringify({
          user_id: 'test_user',
          tier: 'pro',
          name: 'Test Key',
        }),
      });

      mockEnv.API_KEYS.put.mockResolvedValue(undefined);
      mockEnv.API_KEY_METADATA.get.mockResolvedValue(null);
      mockEnv.API_KEY_METADATA.put.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.api_key).toMatch(/^br_/);
      expect(data.key_data.tier).toBe('pro');
      expect(mockEnv.API_KEYS.put).toHaveBeenCalled();
    });

    it('should reject without user_id', async () => {
      const request = new Request('http://localhost/keys/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_admin_key_12345',
        },
        body: JSON.stringify({ tier: 'pro' }),
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('invalid_request');
    });
  });

  describe('Validate Key Endpoint', () => {
    it('should reject without API key', async () => {
      const request = new Request('http://localhost/keys/validate');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('missing_api_key');
    });

    it('should reject invalid API key', async () => {
      const request = new Request('http://localhost/keys/validate', {
        headers: { 'X-API-Key': 'br_invalid_key' },
      });

      mockEnv.API_KEYS.get.mockResolvedValue(null);

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('invalid_api_key');
    });

    it('should validate valid API key', async () => {
      const validKeyData = {
        key: 'br_test_key',
        user_id: 'test_user',
        tier: 'pro',
        created_at: new Date().toISOString(),
        rate_limit: { rpm: 50000, burst: 500 },
        metadata: { scopes: ['read', 'write'] },
        revoked: false,
      };

      const request = new Request('http://localhost/keys/validate', {
        headers: { 'X-API-Key': 'br_test_key' },
      });

      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(validKeyData));
      mockEnv.RATE_LIMIT.get.mockResolvedValue('0');
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.API_KEYS.put.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.user_id).toBe('test_user');
      expect(data.tier).toBe('pro');
    });

    it('should reject revoked key', async () => {
      const revokedKeyData = {
        key: 'br_revoked_key',
        user_id: 'test_user',
        tier: 'pro',
        created_at: new Date().toISOString(),
        rate_limit: { rpm: 50000, burst: 500 },
        metadata: {},
        revoked: true,
        revoked_at: new Date().toISOString(),
      };

      const request = new Request('http://localhost/keys/validate', {
        headers: { 'X-API-Key': 'br_revoked_key' },
      });

      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(revokedKeyData));

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('revoked_api_key');
    });

    it('should enforce rate limits', async () => {
      const validKeyData = {
        key: 'br_test_key',
        user_id: 'test_user',
        tier: 'free',
        created_at: new Date().toISOString(),
        rate_limit: { rpm: 1000, burst: 50 },
        metadata: {},
        revoked: false,
      };

      const request = new Request('http://localhost/keys/validate', {
        headers: { 'X-API-Key': 'br_test_key' },
      });

      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(validKeyData));
      mockEnv.RATE_LIMIT.get.mockResolvedValue('1000'); // At limit

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.valid).toBe(false);
      expect(data.error).toBe('rate_limit_exceeded');
    });
  });

  describe('Revoke Key Endpoint', () => {
    it('should require admin auth', async () => {
      const request = new Request('http://localhost/keys/revoke', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: 'br_test_key' }),
      });

      mockEnv.API_KEYS.get.mockResolvedValue(null);

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('not_found');
    });

    it('should revoke key with admin auth', async () => {
      const keyData = {
        key: 'br_test_key',
        user_id: 'test_user',
        tier: 'pro',
        created_at: new Date().toISOString(),
        rate_limit: { rpm: 50000, burst: 500 },
        metadata: {},
        revoked: false,
      };

      const request = new Request('http://localhost/keys/revoke', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test_admin_key_12345',
        },
        body: JSON.stringify({
          api_key: 'br_test_key',
          reason: 'Test revocation',
        }),
      });

      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(keyData));
      mockEnv.API_KEYS.put.mockResolvedValue(undefined);

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockEnv.API_KEYS.put).toHaveBeenCalled();
    });
  });

  describe('List Keys Endpoint', () => {
    it('should require user_id parameter', async () => {
      const request = new Request('http://localhost/keys/list', {
        headers: { 'Authorization': 'Bearer test_admin_key_12345' },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('invalid_request');
    });

    it('should list keys for admin', async () => {
      const keysList = [
        { hash: 'hash1', created_at: '2025-12-02', name: 'Key 1', tier: 'pro' },
      ];

      const keyData = {
        key: 'br_test_key',
        user_id: 'test_user',
        tier: 'pro',
        created_at: '2025-12-02',
        rate_limit: { rpm: 50000, burst: 500 },
        metadata: { name: 'Key 1', scopes: [] },
        revoked: false,
      };

      const request = new Request('http://localhost/keys/list?user_id=test_user', {
        headers: { 'Authorization': 'Bearer test_admin_key_12345' },
      });

      mockEnv.API_KEY_METADATA.get.mockResolvedValue(JSON.stringify(keysList));
      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(keyData));

      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user_id).toBe('test_user');
      expect(data.keys).toHaveLength(1);
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS preflight', async () => {
      const request = new Request('http://localhost/keys/validate', {
        method: 'OPTIONS',
        headers: { 'Origin': 'https://app.blackroad.io' },
      });

      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://app.blackroad.io');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });

  describe('validateApiKey function', () => {
    it('should export validateApiKey for external use', () => {
      expect(typeof validateApiKey).toBe('function');
    });

    it('should validate key correctly when called directly', async () => {
      const validKeyData = {
        key: 'br_test_key',
        user_id: 'test_user',
        tier: 'pro',
        created_at: new Date().toISOString(),
        rate_limit: { rpm: 50000, burst: 500 },
        metadata: {},
        revoked: false,
      };

      const request = new Request('http://localhost/test', {
        headers: { 'X-API-Key': 'br_test_key' },
      });

      mockEnv.API_KEYS.get.mockResolvedValue(JSON.stringify(validKeyData));
      mockEnv.RATE_LIMIT.get.mockResolvedValue('0');
      mockEnv.RATE_LIMIT.put.mockResolvedValue(undefined);
      mockEnv.API_KEYS.put.mockResolvedValue(undefined);

      const result = await validateApiKey(request, mockEnv);

      expect(result.valid).toBe(true);
      expect(result.key_data?.user_id).toBe('test_user');
      expect(result.rate_limit).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for unknown routes', async () => {
      const request = new Request('http://localhost/unknown');
      const response = await worker.fetch(request, mockEnv, mockCtx);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('not_found');
    });

    it('should include request ID in responses', async () => {
      const request = new Request('http://localhost/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.headers.get('X-Request-ID')).toBeTruthy();
    });

    it('should include response time in headers', async () => {
      const request = new Request('http://localhost/health');
      const response = await worker.fetch(request, mockEnv, mockCtx);

      expect(response.headers.get('X-Response-Time')).toMatch(/\d+ms/);
    });
  });
});
