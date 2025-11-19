import { URL } from 'url';
import { config } from '../config';
import { getDbPool } from '../lib/db';
import { getRedis } from '../lib/queue';
import { logger } from '../lib/logger';

function redactDbUrl(dbUrl: string): string {
  try {
    const urlObj = new URL(dbUrl);
    if (urlObj.password) {
      urlObj.password = '[redacted]';
    }
    return urlObj.toString();
  } catch (e) {
    return '[invalid db url]';
  }
}

async function bootstrapWorker() {
  logger.info('Starting agents-worker', {
    environment: config.env,
    dbUrl: redactDbUrl(config.dbUrl),
    redisEnabled: Boolean(config.redisUrl),
  });

  const pool = getDbPool();
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('Database connection ready for worker');

  const redis = getRedis();
  if (redis) {
    await redis.ping();
    logger.info('Redis connection ready for worker');
  } else {
    logger.info('Redis disabled - skipping connection');
  }

  logger.info('Worker ready - awaiting job subscriptions');

  const heartbeat = setInterval(() => {
    logger.debug('Worker heartbeat');
  }, 60_000);

  const shutdown = async (signal: string) => {
    logger.warn(`Worker received ${signal}, shutting down`);
    clearInterval(heartbeat);
    await pool.end();
    if (redis) {
      await redis.quit();
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrapWorker().catch((err) => {
  logger.error('Worker failed to start', { error: err.message });
  process.exit(1);
});
