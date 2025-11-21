import { dequeue, getQueueSize } from './jobs/queue';

const HEARTBEAT_INTERVAL_MS = Number(process.env.WORKER_HEARTBEAT_MS ?? 10000);

function logHeartbeat(): void {
  console.log(`[worker] heartbeat - queue size: ${getQueueSize()}`);
}

export function startWorker(): void {
  console.log('Starting worker loop');

  setInterval(() => {
    const job = dequeue();

    if (job) {
      console.log(`[worker] processing job ${job.id} of type ${job.type}`);
      return;
    }

    logHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}
