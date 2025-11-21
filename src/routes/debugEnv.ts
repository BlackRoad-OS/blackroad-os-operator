import { Router } from 'express';
import { SERVICE_ID } from '../config/serviceConfig';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_ID,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      OS_ROOT: process.env.OS_ROOT,
      LOG_LEVEL: process.env.LOG_LEVEL,
    },
  });
});

export default router;
