import { Router } from 'express';
import { SERVICE_ID } from '../config/serviceConfig';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    ok: true,
    service: SERVICE_ID,
    ts: new Date().toISOString(),
  });
});

export default router;
