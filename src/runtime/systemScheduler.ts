import { handleAsyncError } from '../utils/errorHandling';
import { Logger } from '../utils/logger';

export interface ScheduledTask {
  id: string;
  intervalMs: number;
  cancel: () => void;
}

export class SystemScheduler {
  private tasks: Map<string, ScheduledTask> = new Map();
  constructor(private logger: Logger) {}

  schedule(id: string, intervalMs: number, fn: () => Promise<void>): ScheduledTask {
    if (this.tasks.has(id)) {
      this.cancel(id);
    }
    const timer = setInterval(() => fn().catch(handleAsyncError(this.logger, id)), intervalMs);
    const task: ScheduledTask = {
      id,
      intervalMs,
      cancel: () => clearInterval(timer),
    };
    this.tasks.set(id, task);
    return task;
  }

  cancel(id: string): void {
    const existing = this.tasks.get(id);
    if (existing) {
      existing.cancel();
      this.tasks.delete(id);
    }
  }

  shutdown(): void {
    Array.from(this.tasks.values()).forEach((task) => task.cancel());
    this.tasks.clear();
  }
}
