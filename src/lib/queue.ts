import Redis from 'ioredis';
import { config, isRedisEnabled } from '../config';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedis(): Redis | null {
  if (!isRedisEnabled) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(config.redisUrl as string);
    redisClient.on('connect', () => logger.info('Connected to Redis', { redis: 'agents-queue' }));
    redisClient.on('error', (err) => logger.error('Redis error', { error: err.message }));
  }
  return redisClient;
}

export async function checkRedisConnection(): Promise<'ok' | 'disabled' | 'error'> {
  if (!isRedisEnabled) return 'disabled';

  try {
    const client = getRedis();
    if (!client) return 'disabled';
    await client.ping();
    return 'ok';
  } catch (err) {
    logger.error('Redis connectivity check failed', { error: (err as Error).message });
    return 'error';
  }
}
