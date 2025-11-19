import { Router } from 'express';
import { config } from '../../config';

const router = Router();

router.get('/version', (_req, res) => {
  res.json({
    service: 'agents-api',
    appVersion: config.appVersion,
    commit: config.gitCommit,
    buildTime: config.buildTime,
    environment: config.env,
  });
});

export default router;
