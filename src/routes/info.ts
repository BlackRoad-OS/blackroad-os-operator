import { Router } from 'express';
import pkg from '../../package.json';
import { SERVICE_ID, SERVICE_NAME } from '../config/serviceConfig';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    name: SERVICE_NAME,
    id: SERVICE_ID,
    version: pkg.version,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  });
});

export default router;
