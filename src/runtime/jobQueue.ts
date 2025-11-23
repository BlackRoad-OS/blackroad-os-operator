import { Job, JobStatus, PsShaInfinity } from "blackroad-os-core";

export type QueuedJob<I = unknown, O = unknown> = Job<I, O>;

export class InMemoryJobQueue {
  private queue: QueuedJob[] = [];
  private jobsById = new Map<PsShaInfinity, QueuedJob>();

  enqueue(job: QueuedJob): void {
    this.queue.push(job);
    this.jobsById.set(job.id, job);
  }

  dequeue(): QueuedJob | undefined {
    const job = this.queue.shift();
    if (!job) return undefined;
    this.jobsById.set(job.id, job);
    return job;
  }

  getJob(id: PsShaInfinity): QueuedJob | undefined {
    return this.jobsById.get(id);
  }

  allJobs(): QueuedJob[] {
    return [...this.jobsById.values()];
  }

  sizeByStatus(status: JobStatus): number {
    return this.allJobs().filter((job) => job.status === status).length;
  }
}
