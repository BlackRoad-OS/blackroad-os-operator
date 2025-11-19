import { Router } from 'express';
import { checkDbConnection } from '../../lib/db';
import { checkRedisConnection } from '../../lib/queue';
import { config } from '../../config';

const router = Router();

router.get('/health', async (_req, res) => {
  const [db, redis] = await Promise.all([checkDbConnection(), checkRedisConnection()]);

  res.json({
    status: db === 'ok' && (redis === 'ok' || redis === 'disabled') ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    environment: config.env,
    checks: {
      db,
      redis,
    },
  });
});

export default router;
