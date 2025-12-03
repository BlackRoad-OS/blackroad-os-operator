import { Worker } from 'bullmq';

import { connection } from '../queues/index.js';
import { getConfig } from '../config.js';
import logger from '../utils/logger.js';

export function registerSampleJobProcessor(): Worker {
  const { sampleWorkerConcurrency } = getConfig();
  const worker = new Worker(
    'sample',
    async (job) => {
      logger.info({ jobId: job.id, payload: job.data }, 'processing sample job');
    },
    { connection, concurrency: sampleWorkerConcurrency }
  );

  worker.on('failed', (job, error) => {
    logger.error({ jobId: job?.id, error }, 'sample job failed');
  });

  logger.info({ concurrency: sampleWorkerConcurrency }, 'sample worker online');

  return worker;
}
