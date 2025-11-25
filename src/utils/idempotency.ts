/**
 * 🔁 Idempotency Store
 * 
 * Tracks operation IDs to prevent duplicate execution of jobs/workflows.
 * Uses Redis for distributed deduplication.
 */

import { connection } from '../queues/index.js';
import type { IdempotencyKey } from '../types/index.js';

import logger from './logger.js';

const IDEMPOTENCY_TTL = 86400; // 24 hours in seconds

/**
 * Check if an operation has already been processed
 */
export async function isProcessed(key: IdempotencyKey): Promise<boolean> {
  const redisKey = buildRedisKey(key);
  const exists = await connection.exists(redisKey);
  
  if (exists) {
    logger.debug({ key }, '🔁 operation already processed (idempotent)');
  }
  
  return exists === 1;
}

/**
 * Mark an operation as processed
 */
export async function markProcessed(
  key: IdempotencyKey,
  result?: Record<string, unknown>
): Promise<void> {
  const redisKey = buildRedisKey(key);
  const value = JSON.stringify({
    ...key,
    processedAt: Date.now(),
    result
  });

  await connection.setex(redisKey, IDEMPOTENCY_TTL, value);
  logger.info({ key }, '🔁 operation marked as processed');
}

/**
 * Get the result of a previously processed operation
 */
export async function getProcessedResult(
  key: IdempotencyKey
): Promise<Record<string, unknown> | null> {
  const redisKey = buildRedisKey(key);
  const value = await connection.get(redisKey);

  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed.result || null;
  } catch (error) {
    logger.error({ error, key }, '🔁 failed to parse idempotency result');
    return null;
  }
}

/**
 * Clear an idempotency record (for testing or manual override)
 */
export async function clearProcessed(key: IdempotencyKey): Promise<void> {
  const redisKey = buildRedisKey(key);
  await connection.del(redisKey);
  logger.info({ key }, '🔁 idempotency record cleared');
}

/**
 * Build Redis key from idempotency key
 */
function buildRedisKey(key: IdempotencyKey): string {
  const parts = [
    'idempotency',
    key.operationType,
    key.operationId
  ];

  if (key.resourceId) {
    parts.push(key.resourceId);
  }

  return parts.join(':');
}

/**
 * Generate a new idempotency key
 */
export function createIdempotencyKey(
  operationType: string,
  operationId: string,
  resourceId?: string
): IdempotencyKey {
  return {
    operationType,
    operationId,
    resourceId,
    createdAt: Date.now()
  };
}
