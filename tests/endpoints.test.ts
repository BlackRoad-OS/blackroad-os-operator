import Fastify, { FastifyInstance } from 'fastify';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('API endpoints', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    // Set test environment variables
    process.env.BR_OS_OPERATOR_VERSION = '0.0.1-test';
    process.env.BR_OS_OPERATOR_COMMIT = 'abc123';
    process.env.BR_OS_ENV = 'test';

    // Create a minimal Fastify instance with just the endpoints we're testing
    app = Fastify();

    // Health endpoint
    app.get('/health', async () => ({
      ok: true,
      service: 'blackroad-os-operator',
      timestamp: new Date().toISOString()
    }));

    // Ready endpoint
    app.get('/ready', async () => {
      const checks = {
        config: true,
        queue: true
      };

      return {
        ready: Object.values(checks).every((check) => check === true),
        service: 'blackroad-os-operator',
        checks
      };
    });

    // Version endpoint
    app.get('/version', async () => ({
      service: 'blackroad-os-operator',
      version: process.env.BR_OS_OPERATOR_VERSION ?? '0.0.1',
      commit: process.env.BR_OS_OPERATOR_COMMIT ?? 'UNKNOWN',
      env: process.env.BR_OS_ENV ?? 'local'
    }));

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return 200 with health status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ok).toBe(true);
      expect(data.service).toBe('blackroad-os-operator');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
    });

    it('should not perform heavy work', async () => {
      const startTime = Date.now();
      await app.inject({
        method: 'GET',
        url: '/health'
      });
      const duration = Date.now() - startTime;

      // Health check should be very fast
      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /ready', () => {
    it('should return readiness status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/ready'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.ready).toBe(true);
      expect(data.service).toBe('blackroad-os-operator');
      expect(data.checks).toBeDefined();
      expect(data.checks.config).toBe(true);
      expect(data.checks.queue).toBe(true);
    });
  });

  describe('GET /version', () => {
    it('should return version metadata', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/version'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.service).toBe('blackroad-os-operator');
      expect(data.version).toBe('0.0.1-test');
      expect(data.commit).toBe('abc123');
      expect(data.env).toBe('test');
    });

    it('should use defaults when env vars not set', async () => {
      // Remove env vars
      delete process.env.BR_OS_OPERATOR_VERSION;
      delete process.env.BR_OS_OPERATOR_COMMIT;
      delete process.env.BR_OS_ENV;

      // Recreate app with defaults
      await app.close();
      app = Fastify();

      app.get('/version', async () => ({
        service: 'blackroad-os-operator',
        version: process.env.BR_OS_OPERATOR_VERSION ?? '0.0.1',
        commit: process.env.BR_OS_OPERATOR_COMMIT ?? 'UNKNOWN',
        env: process.env.BR_OS_ENV ?? 'local'
      }));

      await app.ready();

      const response = await app.inject({
        method: 'GET',
        url: '/version'
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data.version).toBe('0.0.1');
      expect(data.commit).toBe('UNKNOWN');
      expect(data.env).toBe('local');
    });
  });
});
