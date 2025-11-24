import 'dotenv/config';

import Fastify from 'fastify';

import { getConfig } from './config.js';
import { registerSampleJobProcessor } from './jobs/sample.job.js';
import { startHeartbeatScheduler } from './schedulers/heartbeat.scheduler.js';
import logger from './utils/logger.js';

const config = getConfig();
const app = Fastify({ logger });

// Health endpoint - liveness check
app.get('/health', async () => ({
  ok: true,
  service: 'blackroad-os-operator',
  timestamp: new Date().toISOString()
}));

// Ready endpoint - readiness check
app.get('/ready', async () => {
  // Perform lightweight checks
  const checks = {
    config: true,
    queue: true // TODO: add actual queue connectivity check if needed
  };

  return {
    ready: Object.values(checks).every((check) => check === true),
    service: 'blackroad-os-operator',
    checks
  };
});

// Version endpoint - build metadata
app.get('/version', async () => ({
  service: 'blackroad-os-operator',
  version: config.version,
  commit: config.commit,
  env: config.brOsEnv
}));

registerSampleJobProcessor();
startHeartbeatScheduler();

async function startServer(): Promise<void> {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    logger.info(
      {
        port: config.port,
        env: config.brOsEnv,
        version: config.version,
        commit: config.commit
      },
      'operator engine started'
    );
  } catch (error) {
    logger.error({ error }, 'failed to start operator engine');
    process.exit(1);
  }
}

startServer();

// TODO(op-next): add auth middleware and request signing
// TODO(op-next): expose agent registration endpoints
