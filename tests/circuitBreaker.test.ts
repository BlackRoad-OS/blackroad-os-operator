import { describe, it, expect, beforeEach, vi } from 'vitest';

import { CircuitBreaker, getCircuitBreaker } from '../src/utils/circuitBreaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test-breaker', 3, 1000);
  });

  describe('execute', () => {
    it('should execute function successfully when circuit is closed', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await breaker.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState().state).toBe('closed');
    });

    it('should track failures and open circuit after threshold', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Fail 3 times to reach threshold
      await expect(breaker.execute(fn)).rejects.toThrow('failure');
      expect(breaker.getState().state).toBe('closed');
      
      await expect(breaker.execute(fn)).rejects.toThrow('failure');
      expect(breaker.getState().state).toBe('closed');
      
      await expect(breaker.execute(fn)).rejects.toThrow('failure');
      expect(breaker.getState().state).toBe('open');
      expect(breaker.getState().failureCount).toBe(3);
    });

    it('should reject requests when circuit is open', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      // Circuit should now be open
      expect(breaker.getState().state).toBe('open');

      // New request should be rejected immediately
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker test-breaker is open');
      
      // Function should not have been called the 4th time
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should transition to half-open after timeout', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState().state).toBe('open');

      // Wait for timeout (circuit uses 1000ms timeout in test)
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Next request should transition to half-open and succeed
      const result = await breaker.execute(fn);
      expect(result).toBe('success');
      expect(breaker.getState().state).toBe('closed');
      expect(breaker.getState().failureCount).toBe(0);
    });

    it('should reset failure count on success', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('failure'))
        .mockResolvedValueOnce('success');

      // First failure
      await expect(breaker.execute(fn)).rejects.toThrow('failure');
      expect(breaker.getState().failureCount).toBe(1);

      // Success should reset count
      await breaker.execute(fn);
      expect(breaker.getState().failureCount).toBe(0);
    });
  });

  describe('getState', () => {
    it('should return current circuit state', () => {
      const state = breaker.getState();
      
      expect(state).toEqual({
        state: 'closed',
        failureCount: 0,
        lastFailureTime: 0,
        threshold: 3,
        timeout: 1000
      });
    });
  });

  describe('reset', () => {
    it('should manually reset circuit to closed state', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('failure'));

      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await expect(breaker.execute(fn)).rejects.toThrow();
      }

      expect(breaker.getState().state).toBe('open');

      // Manual reset
      breaker.reset();

      const state = breaker.getState();
      expect(state.state).toBe('closed');
      expect(state.failureCount).toBe(0);
      expect(state.lastFailureTime).toBe(0);
    });
  });
});

describe('getCircuitBreaker', () => {
  it('should create and cache circuit breakers by name', () => {
    const breaker1 = getCircuitBreaker('test-1');
    const breaker2 = getCircuitBreaker('test-1');
    const breaker3 = getCircuitBreaker('test-2');

    expect(breaker1).toBe(breaker2);
    expect(breaker1).not.toBe(breaker3);
  });

  it('should use custom threshold and timeout when provided', () => {
    const breaker = getCircuitBreaker('custom', 10, 5000);
    const state = breaker.getState();

    expect(state.threshold).toBe(10);
    expect(state.timeout).toBe(5000);
  });
});
