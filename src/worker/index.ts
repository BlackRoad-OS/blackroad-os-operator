import { loadEnv } from '../env';
import { InMemoryQueue } from '../queue/in-memory-queue';

const POLL_INTERVAL_MS = 500;
const queue = new InMemoryQueue<string>();

async function handleJob(job: string): Promise<void> {
  // Simulate asynchronous job handling to avoid blocking the event loop
  // eslint-disable-next-line no-console
  console.log(`Processing job: ${job}`);
  await new Promise((resolve) => setTimeout(resolve, 10));
}

async function processNextJob(): Promise<void> {
  const job = queue.dequeue();
  if (!job) {
    return;
  }

  await handleJob(job);
}

function scheduleWorkerLoop(): void {
  setTimeout(async () => {
    try {
      await processNextJob();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Worker loop error:', error);
    } finally {
      scheduleWorkerLoop();
    }
  }, POLL_INTERVAL_MS);
}

function bootstrap(): void {
  loadEnv();
  queue.enqueue('bootstrap');
  scheduleWorkerLoop();
}

if (require.main === module) {
  bootstrap();
}
