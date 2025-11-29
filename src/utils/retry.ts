/**
 * 🔄 Retry Policy Implementation
 * 
 * Configurable retry logic with backoff strategies for handling
 * transient failures in job execution.
 */

import type { RetryPolicy } from '../types/index.js';

import logger from './logger.js';

/**
 * Default retry policy for most jobs
 */
export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoffStrategy: 'exponential',
  initialDelayMs: 1000,
  maxDelayMs: 30000
};

/**
 * Retry policy for critical operations
 */
export const CRITICAL_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  backoffStrategy: 'exponential',
  initialDelayMs: 2000,
  maxDelayMs: 60000
};

/**
 * Calculate delay for next retry attempt
 */
export function calculateDelay(
  attempt: number,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY
): number {
  let delay: number;

  if (policy.backoffStrategy === 'exponential') {
    // Exponential: initialDelay * 2^(attempt-1)
    delay = policy.initialDelayMs * Math.pow(2, attempt - 1);
  } else {
    // Linear: initialDelay * attempt
    delay = policy.initialDelayMs * attempt;
  }

  // Cap at maxDelay
  return Math.min(delay, policy.maxDelayMs);
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  context?: { jobId?: string; operation?: string }
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      logger.debug(
        { attempt, maxAttempts: policy.maxAttempts, ...context },
        '🔄 attempting operation'
      );
      
      const result = await fn();
      
      if (attempt > 1) {
        logger.info(
          { attempt, ...context },
          '🔄 operation succeeded after retry'
        );
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < policy.maxAttempts) {
        const delay = calculateDelay(attempt, policy);
        
        logger.warn(
          {
            attempt,
            maxAttempts: policy.maxAttempts,
            nextRetryIn: delay,
            error: error instanceof Error ? error.message : String(error),
            ...context
          },
          '🔄 operation failed, will retry'
        );
        
        await sleep(delay);
      } else {
        logger.error(
          {
            attempt,
            maxAttempts: policy.maxAttempts,
            error: error instanceof Error ? error.message : String(error),
            ...context
          },
          '🔄 operation failed after all retry attempts'
        );
      }
    }
  }

  throw lastError;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is retryable (customize based on error types)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Network/connection errors are retryable
    if (
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('network')
    ) {
      return true;
    }
    
    // Rate limiting is retryable
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }
  }
  
  // Default: assume retryable unless we know otherwise
  return true;
}

/**
 * Execute with conditional retry based on error type
 */
export async function withConditionalRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy = DEFAULT_RETRY_POLICY,
  context?: { jobId?: string; operation?: string }
): Promise<T> {
  let lastError: Error | unknown;
  
  for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        logger.error(
          { error, ...context },
          '🔄 non-retryable error encountered'
        );
        throw error;
      }
      
      if (attempt < policy.maxAttempts) {
        const delay = calculateDelay(attempt, policy);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
