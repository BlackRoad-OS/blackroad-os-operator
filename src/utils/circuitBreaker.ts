/**
 * 🚧 Circuit Breaker Implementation
 * 
 * Prevents cascading failures by temporarily blocking requests
 * to a failing service/operation.
 */

import type { CircuitBreakerState } from '../types/index.js';

import logger from './logger.js';

export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private name: string,
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {
    logger.info(
      { name, threshold, timeout },
      '🚧 circuit breaker initialized'
    );
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        logger.info({ name: this.name }, '🚧 circuit breaker half-open, attempting recovery');
        this.state = 'half-open';
      } else {
        logger.warn(
          { name: this.name, lastFailure: this.lastFailureTime },
          '🚧 circuit breaker open, rejecting request'
        );
        throw new Error(`Circuit breaker ${this.name} is open`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      threshold: this.threshold,
      timeout: this.timeout
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info({ name: this.name }, '🚧 circuit breaker manually reset');
    this.failureCount = 0;
    this.state = 'closed';
    this.lastFailureTime = 0;
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      logger.info({ name: this.name }, '🚧 circuit breaker closed after successful recovery');
    }
    this.failureCount = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    // In half-open state, any failure should immediately reopen the circuit
    if (this.state === 'half-open') {
      logger.error(
        { name: this.name, lastFailure: this.lastFailureTime },
        '🚧 circuit breaker reopened after failed recovery attempt'
      );
      this.state = 'open';
      this.failureCount = this.threshold; // mark as at threshold for observability
      return;
    }

    if (this.failureCount >= this.threshold) {
      logger.error(
        { name: this.name, failureCount: this.failureCount },
        '🚧 circuit breaker opened due to repeated failures'
      );
      this.state = 'open';
    }
  }
}

// Global circuit breaker registry
const breakers = new Map<string, CircuitBreaker>();

/**
 * Get or create a circuit breaker by name
 */
export function getCircuitBreaker(
  name: string,
  threshold?: number,
  timeout?: number
): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, threshold, timeout));
  }
  return breakers.get(name)!;
}
