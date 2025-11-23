import { Router } from "express";
import { OperatorConfig } from "../config";
import { InMemoryJobQueue } from "../runtime/jobQueue";
import { Worker } from "../runtime/worker";

interface HealthDeps {
  worker: Worker;
  queue: InMemoryJobQueue;
  config: OperatorConfig;
}

export function createHealthRouter({ worker, queue, config }: HealthDeps): Router {
  const router = Router();

  router.get("/health", (_req, res) => {
    const now = new Date().toISOString();

    const services = [
      {
        id: "operator",
        name: "Operator",
        status: "healthy",
        lastChecked: now,
      },
      {
        id: "worker",
        name: "Worker Runtime",
        status: worker.isRunning() ? "healthy" : "down",
        lastChecked: now,
      },
    ];

    const anyDown = services.some((s) => s.status === "down");
    const status = anyDown ? "degraded" : "healthy";

    res.json({
      ok: true,
      data: {
        status,
        services,
        queue: {
          queued: queue.sizeByStatus("queued"),
          running: queue.sizeByStatus("running"),
          completed: queue.sizeByStatus("completed"),
          failed: queue.sizeByStatus("failed"),
        },
        config,
      },
    });
  });

  return router;
}
