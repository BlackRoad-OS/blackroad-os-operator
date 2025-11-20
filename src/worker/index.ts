import express from 'express';
import { config } from '../config';
import { logger } from '../lib/logger';
import { enqueueJob, getJobQueueState, startJobLoop, JobType } from './job-runner';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', queue: getJobQueueState(), timestamp: new Date().toISOString() });
});

app.get('/version', (_req, res) => {
  res.json({
    appVersion: config.appVersion,
    commit: config.gitCommit,
    buildTime: config.buildTime,
    environment: config.env,
  });
});

app.get('/jobs/health', (_req, res) => {
  const queue = getJobQueueState();
  res.json({
    status: queue.pending === 0 && !queue.running ? 'idle' : 'processing',
    queue,
    timestamp: new Date().toISOString(),
  });
});

app.post('/jobs/enqueue', (req, res) => {
  const { type, payload } = req.body ?? {};
  try {
    if (!type) {
      return res.status(400).json({ error: 'Job type is required' });
    }
    const job = enqueueJob(type as JobType, payload);
    res.status(202).json({ job });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled worker API error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

async function bootstrapWorker() {
  logger.info('Starting operator worker', {
    environment: config.env,
    coreApiUrl: config.coreApiUrl,
    agentsApiUrl: config.agentsApiUrl,
    queuePollIntervalMs: config.queuePollIntervalMs,
  });

  startJobLoop();

  app.listen(config.operatorPort, () => {
    logger.info('Operator worker listening', { port: config.operatorPort });
  });
}

bootstrapWorker().catch((err) => {
  logger.error('Worker failed to start', { error: err.message });
  process.exit(1);
});
