import { Router } from 'express';
import pkg from '../../package.json';
import { OS_ROOT, SERVICE_BASE_URL, SERVICE_ID, SERVICE_NAME } from '../config/serviceConfig';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: SERVICE_NAME,
    id: SERVICE_ID,
    baseUrl: SERVICE_BASE_URL,
    version: pkg.version,
    osRoot: OS_ROOT,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

export default router;
