import { schedule, type ScheduledTask } from 'node-cron';

import { getQueue } from '../queues/index.js';
import type { HeartbeatPayload } from '../types/index.js';
import logger from '../utils/logger.js';

const HEARTBEAT_CRON = '*/5 * * * *';

export type HeartbeatTask = ScheduledTask & {
  fireOnTick?: () => Promise<void> | void;
};

async function enqueueHeartbeat(): Promise<void> {
  const payload: HeartbeatPayload = { ts: Date.now() };
  await getQueue('heartbeat').add('heartbeat', payload);
  logger.info({ payload }, 'heartbeat queued');
}

export function startHeartbeatScheduler(): HeartbeatTask {
  const task = schedule(HEARTBEAT_CRON, async () => {
    await enqueueHeartbeat();
  });

  logger.info({ cron: HEARTBEAT_CRON }, 'heartbeat scheduler started');

  return { ...task, fireOnTick: enqueueHeartbeat } as HeartbeatTask;
}

// TODO(op-next): allow dynamic cadence overrides per environment
