import express from 'express';
import { config } from '../config';
import healthRouter from './routes/health';
import versionRouter from './routes/version';
import { logger } from '../lib/logger';
import { getDbPool } from '../lib/db';
import { getRedis } from '../lib/queue';

const app = express();
app.use(express.json());

app.use(healthRouter);
app.use(versionRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled API error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  logger.info('Starting agents-api server', {
    environment: config.env,
    port: config.port,
    coreApiUrl: config.coreApiUrl,
    publicAgentsUrl: config.publicAgentsUrl,
    redisEnabled: Boolean(config.redisUrl),
  });

  getDbPool();
  getRedis();

  app.listen(config.port, () => {
    logger.info('agents-api listening', { port: config.port });
  });
}

start().catch((err) => {
  logger.error('Failed to start API server', { error: err.message });
  process.exit(1);
});
