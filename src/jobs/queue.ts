import { Job } from './types';

const queue: Job[] = [];

export function enqueue(job: Job): void {
  queue.push(job);
}

export function dequeue(): Job | undefined {
  return queue.shift();
}

export function getQueueSize(): number {
  return queue.length;
}
