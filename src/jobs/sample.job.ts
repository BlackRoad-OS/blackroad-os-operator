import { Worker } from 'bullmq';

import { connection } from '../queues/index.js';
import logger from '../utils/logger.js';

export function registerSampleJobProcessor(): Worker {
  const worker = new Worker(
    'sample',
    async (job) => {
      logger.info({ jobId: job.id, payload: job.data }, 'processing sample job');
    },
    { connection }
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'sample job failed');
  });

  // TODO(op-next): dynamic worker discovery and scaling

  return worker;
}
