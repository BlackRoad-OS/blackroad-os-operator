import { Router } from 'express';
import pkg from '../../package.json';
import { SERVICE_ID } from '../config/serviceConfig';
import { config } from '../config';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_ID,
    version: pkg.version,
    commit: config.gitCommit,
    buildTime: config.buildTime,
  });
});

export default router;
