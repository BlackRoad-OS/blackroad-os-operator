import { Router } from 'express';
import { enqueue, getQueueSize } from '../jobs/queue';
import { Job } from '../jobs/types';

const router = Router();

router.post('/enqueue', (req, res) => {
  const { type, payload } = req.body ?? {};

  if (!type || typeof type !== 'string') {
    res.status(400).json({ error: 'type is required and must be a string' });
    return;
  }

  const jobPayload: Record<string, unknown> =
    payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : {};

  const job: Job = {
    id: Date.now().toString(),
    type,
    payload: jobPayload,
    createdAt: new Date().toISOString(),
  };

  enqueue(job);

  res.status(201).json(job);
});

router.get('/status', (_req, res) => {
  res.json({ service: 'operator', queueSize: getQueueSize() });
});

export default router;
