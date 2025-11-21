import { InMemoryQueue } from './queue/in-memory-queue';

const HEARTBEAT_INTERVAL_MS = Number(process.env.WORKER_HEARTBEAT_MS ?? 10000);
const queue = new InMemoryQueue<unknown>();

function logHeartbeat(): void {
  console.log(`[worker] heartbeat - queue size: ${queue.size()}`);
}

export function startWorker(): void {
  console.log('Starting worker loop');

  setInterval(() => {
    const job = queue.dequeue();
    if (job) {
      console.log('[worker] processed job placeholder', job);
    }

    logHeartbeat();
  }, HEARTBEAT_INTERVAL_MS);
}

export { queue as operatorQueue };
