import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import type { QueueName } from '../types/index.js';
import logger from '../utils/logger.js';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null
});

const queues = new Map<QueueName | string, Queue>();

export function getQueue(name: QueueName | string): Queue {
  if (!queues.has(name)) {
    queues.set(
      name,
      new Queue(name, {
        connection
      })
    );
    logger.info({ queue: name }, 'queue initialized');
  }

  return queues.get(name)!;
}
