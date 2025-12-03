import { schedule, type ScheduledTask } from 'node-cron';

import { getQueue } from '../queues/index.js';
import type { HeartbeatPayload } from '../types/index.js';
import logger from '../utils/logger.js';

const DEFAULT_HEARTBEAT_CRON = '*/5 * * * *';

export type HeartbeatTask = ScheduledTask & {
  fireOnTick?: () => Promise<void> | void;
};

async function enqueueHeartbeat(): Promise<void> {
  const payload: HeartbeatPayload = { ts: Date.now() };
  await getQueue('heartbeat').add('heartbeat', payload);
  logger.info({ payload }, 'heartbeat queued');
}

export function startHeartbeatScheduler(cronExpression: string = DEFAULT_HEARTBEAT_CRON): HeartbeatTask {
  const task = schedule(cronExpression, async () => {
    await enqueueHeartbeat();
  });

  logger.info({ cron: cronExpression }, 'heartbeat scheduler started');

  return { ...task, fireOnTick: enqueueHeartbeat } as HeartbeatTask;
}
