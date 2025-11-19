import { config } from '../config';
import { getDbPool } from '../lib/db';
import { getRedis } from '../lib/queue';
import { logger } from '../lib/logger';
import { URL } from 'url';

function redactDbUrl(dbUrl: string): string {
  try {
    const urlObj = new URL(dbUrl);
    if (urlObj.password) {
      urlObj.password = '[redacted]';
    }
    return urlObj.toString();
  } catch (e) {
    // If parsing fails, return a placeholder
    return '[invalid db url]';
  }
}
  logger.info('Starting agents-worker', {
    environment: config.env,
    dbUrl: redactDbUrl(config.dbUrl),
    redisEnabled: Boolean(config.redisUrl),
  });

  const pool = getDbPool();
  const client = await pool.connect();
  client.release();
  logger.info('Database connection ready for worker');

  if (config.redisUrl) {
    const redis = getRedis();
    await redis?.ping();
    logger.info('Redis connection ready for worker');
  }

  // Placeholder job loop.
  logger.info('Worker idle - awaiting job subscriptions');

  process.on('SIGTERM', async () => {
    logger.warn('Worker received SIGTERM, shutting down');
    await pool.end();
    await getRedis()?.quit();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.warn('Worker received SIGINT (Ctrl+C), shutting down');
    await pool.end();
    await getRedis()?.quit();
    process.exit(0);
  });
}

bootstrapWorker().catch((err) => {
  logger.error('Worker failed to start', { error: err.message });
  process.exit(1);
});
