import { AgentContext, Job, completeJob, failJob, startJob } from "blackroad-os-core";
import { EventBus } from "../events/eventBus";
import { OperatorConfig } from "../config";
import { Logger } from "../utils/logger";
import { AgentRegistry } from "./agentRegistry";
import { InMemoryJobQueue, QueuedJob } from "./jobQueue";

export class Worker {
  private running = false;
  private activeJobs = 0;
  private interval?: NodeJS.Timeout;

  constructor(
    private registry: AgentRegistry,
    private queue: InMemoryJobQueue,
    private eventBus: EventBus,
    private config: OperatorConfig,
    private logger: Logger,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.interval = setInterval(() => void this.tick(), 100);
    this.logger.info("Worker runtime started");
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.interval) clearInterval(this.interval);
  }

  isRunning(): boolean {
    return this.running;
  }

  getActiveJobs(): number {
    return this.activeJobs;
  }

  private async tick(): Promise<void> {
    if (!this.running) return;
    if (this.activeJobs >= this.config.maxConcurrentJobs) return;

    const job = this.queue.dequeue();
    if (!job) return;

    this.activeJobs += 1;
    await this.execute(job).catch((err) => this.logger.error("Worker execution failed", err));
    this.activeJobs -= 1;
  }

  private async execute(job: QueuedJob): Promise<void> {
    const agentId = job.agentId ?? job.type;
    const handle = this.registry.getAgent(agentId);

    if (!handle) {
      const failed = failJob(job, `Agent ${agentId} not found`);
      Object.assign(job, failed);
      this.eventBus.emit({
        id: `event:${Date.now()}:job.failed`,
        type: "job.failed",
        timestamp: new Date().toISOString(),
        severity: "error",
        payload: { jobId: job.id, reason: failed.error },
        relatedIds: [job.id],
      });
      return;
    }

    this.registry.updateState(agentId, { status: "running", lastSeen: new Date().toISOString() });
    const started = startJob(job as Job);
    Object.assign(job, started);
    this.eventBus.emit({
      id: `event:${Date.now()}:job.started`,
      type: "job.started",
      timestamp: new Date().toISOString(),
      payload: { jobId: job.id, agentId },
      relatedIds: [job.id, agentId],
    });

    const context: AgentContext = {
      emitEvent: (event) => this.eventBus.emit(event),
      now: () => new Date().toISOString(),
    };

    try {
      const result = await handle.core.run(job.input, context);
      if (result.ok) {
        const completed = completeJob(job as Job, result.value);
        Object.assign(job, completed);
        this.eventBus.emit({
          id: `event:${Date.now()}:job.completed`,
          type: "job.completed",
          timestamp: new Date().toISOString(),
          payload: { jobId: job.id, agentId },
          relatedIds: [job.id, agentId],
        });
      } else {
        const failed = failJob(job as Job, String(result.error));
        Object.assign(job, failed);
        this.eventBus.emit({
          id: `event:${Date.now()}:job.failed`,
          type: "job.failed",
          timestamp: new Date().toISOString(),
          severity: "error",
          payload: { jobId: job.id, agentId, error: result.error },
          relatedIds: [job.id, agentId],
        });
      }
    } catch (err) {
      const failed = failJob(job as Job, (err as Error).message);
      Object.assign(job, failed);
      this.eventBus.emit({
        id: `event:${Date.now()}:job.failed`,
        type: "job.failed",
        timestamp: new Date().toISOString(),
        severity: "error",
        payload: { jobId: job.id, agentId, error: (err as Error).message },
        relatedIds: [job.id, agentId],
      });
    } finally {
      this.registry.updateState(agentId, { status: "idle", lastSeen: new Date().toISOString() });
    }
  }
}
