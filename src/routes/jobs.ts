import { randomUUID } from "crypto";
import { Router } from "express";
import { Job, PsShaInfinity } from "blackroad-os-core";
import { EventBus } from "../events/eventBus";
import { InMemoryJobQueue } from "../runtime/jobQueue";

interface JobsDeps {
  queue: InMemoryJobQueue;
  eventBus: EventBus;
}

export function createJobsRouter({ queue, eventBus }: JobsDeps): Router {
  const router = Router();

  router.post("/jobs", (req, res) => {
    const { type, agentId, input } = req.body ?? {};
    if (!type || typeof type !== "string") {
      return res.status(400).json({ ok: false, error: { code: "INVALID_JOB", message: "Job type is required" } });
    }

    const id: PsShaInfinity = req.body?.id ?? `job:${randomUUID()}`;
    const now = new Date().toISOString();
    const job: Job = {
      id,
      type,
      agentId,
      input,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };

    queue.enqueue(job);
    eventBus.emit({
      id: `event:${Date.now()}:job.queued`,
      type: "job.queued",
      timestamp: now,
      payload: { jobId: id, type, agentId },
      relatedIds: [id, agentId].filter(Boolean) as PsShaInfinity[],
    });

    return res.status(202).json({
      ok: true,
      data: {
        jobId: id,
        status: job.status,
      },
    });
  });

  router.get("/jobs/:id", (req, res) => {
    const job = queue.getJob(req.params.id as string);
    if (!job) {
      return res.status(404).json({
        ok: false,
        error: { code: "JOB_NOT_FOUND", message: `Job ${req.params.id} not found` },
      });
    }

    return res.json({ ok: true, data: job });
  });

  return router;
}
