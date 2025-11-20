import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import { config } from '../config';
import { logger } from '../lib/logger';

export type JobType = 'health-check' | 'sync-metadata';

export interface JobPayloadMap {
  'health-check': { targetUrl: string };
  'sync-metadata': Record<string, unknown>;
}

type JobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface Job<T extends JobType = JobType> {
  id: string;
  type: T;
  payload: JobPayloadMap[T];
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

interface JobQueueState {
  pending: number;
  running: Job | null;
  recent: Job[];
}

const pendingQueue: Job[] = [];
let runningJob: Job | null = null;
const recentJobs: Job[] = [];
let loopStarted = false;

function normalizeUrl(targetUrl: string): string {
  const sanitized = targetUrl.replace(/\/$/, '');
  return `${sanitized}/health`;
}

async function executeHealthCheck(payload: JobPayloadMap['health-check']) {
  const url = normalizeUrl(payload.targetUrl);
  const started = Date.now();

  try {
    const response = await fetch(url, { method: 'GET' });
    const durationMs = Date.now() - started;
    const body = await response.text();

    return {
      target: url,
      ok: response.ok,
      status: response.status,
      durationMs,
      body,
    };
  } catch (err) {
    const durationMs = Date.now() - started;
    logger.warn('Health check failed', { target: url, error: (err as Error).message, durationMs });
    throw err;
  }
}

async function executeSyncMetadata(payload: JobPayloadMap['sync-metadata']) {
  logger.info('sync-metadata job triggered', { payload });
  return { status: 'noop', payload };
}

async function executeJob(job: Job): Promise<unknown> {
  switch (job.type) {
    case 'health-check':
      return executeHealthCheck(job.payload as JobPayloadMap['health-check']);
    case 'sync-metadata':
      return executeSyncMetadata(job.payload as JobPayloadMap['sync-metadata']);
    default:
      throw new Error(`Unsupported job type: ${job.type}`);
  }
}

function validatePayload(type: JobType, payload: unknown): JobPayloadMap[JobType] {
  if (type === 'health-check') {
    if (!payload || typeof payload !== 'object' || typeof (payload as { targetUrl?: unknown }).targetUrl !== 'string') {
      throw new Error('health-check job requires a payload.targetUrl string');
    }
    return { targetUrl: (payload as { targetUrl: string }).targetUrl } as JobPayloadMap[JobType];
  }

  if (type === 'sync-metadata') {
    return (payload && typeof payload === 'object' ? payload : {}) as JobPayloadMap[JobType];
  }

  throw new Error(`Invalid job type: ${type}`);
}

function recordRecentJob(job: Job) {
  recentJobs.unshift(job);
  if (recentJobs.length > 20) {
    recentJobs.pop();
  }
}

async function processNextJob() {
  if (runningJob || pendingQueue.length === 0) return;

  const job = pendingQueue.shift() as Job;
  runningJob = { ...job, status: 'running', startedAt: new Date().toISOString() };
  logger.info('Processing job', { id: runningJob.id, type: runningJob.type, attempts: runningJob.attempts + 1 });

  try {
    runningJob.attempts += 1;
    const result = await executeJob(runningJob);
    runningJob.status = 'completed';
    runningJob.result = result;
    runningJob.completedAt = new Date().toISOString();
    logger.info('Job completed', { id: runningJob.id, type: runningJob.type });
  } catch (err) {
    runningJob.error = (err as Error).message;
    if (runningJob.attempts < runningJob.maxAttempts) {
      runningJob.status = 'queued';
      logger.warn('Job failed, re-queuing', { id: runningJob.id, attempts: runningJob.attempts, error: runningJob.error });
      pendingQueue.push(runningJob);
      runningJob = null;
      return;
    }
    runningJob.status = 'failed';
    runningJob.completedAt = new Date().toISOString();
    logger.error('Job failed permanently', { id: runningJob.id, error: runningJob.error });
  }

  recordRecentJob(runningJob);
  runningJob = null;
}

export function enqueueJob(type: JobType, payload: unknown): Job {
  const validatedPayload = validatePayload(type, payload);

  const job: Job = {
    id: randomUUID(),
    type,
    payload: validatedPayload,
    status: 'queued',
    attempts: 0,
    maxAttempts: config.jobMaxAttempts,
    enqueuedAt: new Date().toISOString(),
  };

  pendingQueue.push(job);
  logger.info('Enqueued job', { id: job.id, type: job.type });
  return job;
}

export function getJobQueueState(): JobQueueState {
  return {
    pending: pendingQueue.length,
    running: runningJob,
    recent: [...recentJobs],
  };
}

export function startJobLoop(): void {
  if (loopStarted) return;
  loopStarted = true;
  logger.info('Starting in-memory job loop', { intervalMs: config.queuePollIntervalMs });
  setInterval(() => {
    void processNextJob();
  }, config.queuePollIntervalMs);
}
