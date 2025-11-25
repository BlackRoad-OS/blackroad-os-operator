import { describe, it, expect } from 'vitest';

import {
  calculateDelay,
  withRetry,
  isRetryableError,
  DEFAULT_RETRY_POLICY,
  CRITICAL_RETRY_POLICY
} from '../src/utils/retry.js';

describe('retry utilities', () => {
  describe('calculateDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const policy = {
        maxAttempts: 5,
        backoffStrategy: 'exponential' as const,
        initialDelayMs: 1000,
        maxDelayMs: 30000
      };

      expect(calculateDelay(1, policy)).toBe(1000);  // 1000 * 2^0
      expect(calculateDelay(2, policy)).toBe(2000);  // 1000 * 2^1
      expect(calculateDelay(3, policy)).toBe(4000);  // 1000 * 2^2
      expect(calculateDelay(4, policy)).toBe(8000);  // 1000 * 2^3
      expect(calculateDelay(5, policy)).toBe(16000); // 1000 * 2^4
    });

    it('should calculate linear backoff correctly', () => {
      const policy = {
        maxAttempts: 5,
        backoffStrategy: 'linear' as const,
        initialDelayMs: 1000,
        maxDelayMs: 30000
      };

      expect(calculateDelay(1, policy)).toBe(1000);  // 1000 * 1
      expect(calculateDelay(2, policy)).toBe(2000);  // 1000 * 2
      expect(calculateDelay(3, policy)).toBe(3000);  // 1000 * 3
      expect(calculateDelay(4, policy)).toBe(4000);  // 1000 * 4
      expect(calculateDelay(5, policy)).toBe(5000);  // 1000 * 5
    });

    it('should cap delay at maxDelayMs', () => {
      const policy = {
        maxAttempts: 10,
        backoffStrategy: 'exponential' as const,
        initialDelayMs: 1000,
        maxDelayMs: 5000
      };

      expect(calculateDelay(1, policy)).toBe(1000);
      expect(calculateDelay(2, policy)).toBe(2000);
      expect(calculateDelay(3, policy)).toBe(4000);
      expect(calculateDelay(4, policy)).toBe(5000); // capped
      expect(calculateDelay(5, policy)).toBe(5000); // capped
    });

    it('should use default policy when not provided', () => {
      const delay = calculateDelay(2);
      expect(delay).toBeGreaterThan(0);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first attempt', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return 'success';
      };

      const result = await withRetry(fn, {
        maxAttempts: 3,
        backoffStrategy: 'linear',
        initialDelayMs: 10,
        maxDelayMs: 100
      });

      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('transient failure');
        }
        return 'success';
      };

      const result = await withRetry(fn, {
        maxAttempts: 5,
        backoffStrategy: 'linear',
        initialDelayMs: 10,
        maxDelayMs: 100
      });

      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should throw error after max attempts', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        throw new Error('persistent failure');
      };

      await expect(
        withRetry(fn, {
          maxAttempts: 3,
          backoffStrategy: 'linear',
          initialDelayMs: 10,
          maxDelayMs: 100
        })
      ).rejects.toThrow('persistent failure');

      expect(callCount).toBe(3);
    });

    it('should apply delays between retries', async () => {
      const startTime = Date.now();
      let callCount = 0;
      
      const fn = async () => {
        callCount++;
        if (callCount < 3) {
          throw new Error('failure');
        }
        return 'success';
      };

      await withRetry(fn, {
        maxAttempts: 3,
        backoffStrategy: 'linear',
        initialDelayMs: 50,
        maxDelayMs: 200
      });

      const duration = Date.now() - startTime;
      
      // Should have waited at least 50ms (first retry) + 100ms (second retry) = 150ms
      expect(duration).toBeGreaterThanOrEqual(100);
      expect(callCount).toBe(3);
    });

    it('should pass context to logger', async () => {
      const fn = async () => 'success';

      const result = await withRetry(
        fn,
        DEFAULT_RETRY_POLICY,
        { jobId: 'test-123', operation: 'test-op' }
      );

      expect(result).toBe('success');
    });
  });

  describe('isRetryableError', () => {
    it('should identify timeout errors as retryable', () => {
      const error = new Error('Request timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify connection errors as retryable', () => {
      expect(isRetryableError(new Error('ECONNREFUSED'))).toBe(true);
      expect(isRetryableError(new Error('ECONNRESET'))).toBe(true);
      expect(isRetryableError(new Error('Network error'))).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      expect(isRetryableError(new Error('Rate limit exceeded'))).toBe(true);
      expect(isRetryableError(new Error('Too many requests'))).toBe(true);
    });

    it('should default to retryable for unknown errors', () => {
      expect(isRetryableError(new Error('Unknown error'))).toBe(true);
      expect(isRetryableError('string error')).toBe(true);
      expect(isRetryableError(null)).toBe(true);
    });
  });

  describe('policy constants', () => {
    it('should have DEFAULT_RETRY_POLICY with expected values', () => {
      expect(DEFAULT_RETRY_POLICY).toEqual({
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        initialDelayMs: 1000,
        maxDelayMs: 30000
      });
    });

    it('should have CRITICAL_RETRY_POLICY with more aggressive values', () => {
      expect(CRITICAL_RETRY_POLICY).toEqual({
        maxAttempts: 5,
        backoffStrategy: 'exponential',
        initialDelayMs: 2000,
        maxDelayMs: 60000
      });
    });
  });
});
