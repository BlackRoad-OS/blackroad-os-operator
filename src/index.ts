import 'dotenv/config';

import Fastify from 'fastify';

import { registerSampleJobProcessor } from './jobs/sample.job.js';
import { startHeartbeatScheduler } from './schedulers/heartbeat.scheduler.js';
import logger from './utils/logger.js';

const app = Fastify({ logger });
const port = Number(process.env.PORT ?? 4000);

app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

app.get('/version', async () => ({ version: '0.0.1', commit: process.env.COMMIT_SHA ?? 'unknown' }));

registerSampleJobProcessor();
startHeartbeatScheduler();

async function startServer(): Promise<void> {
  try {
    await app.listen({ port, host: '0.0.0.0' });
    logger.info({ port }, 'operator engine started');
  } catch (error) {
    logger.error({ error }, 'failed to start operator engine');
    process.exit(1);
  }
}

startServer();

// TODO(op-next): add auth middleware and request signing
// TODO(op-next): expose agent registration endpoints
