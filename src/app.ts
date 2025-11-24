import express, { Request, Response, NextFunction } from "express";
import { OperatorConfig } from "./config";
import { EventBus } from "./events/eventBus";
import { AgentRegistry } from "./runtime/agentRegistry";
import { InMemoryJobQueue } from "./runtime/jobQueue";
import { Worker } from "./runtime/worker";
import { Logger } from "./utils/logger";
import { correlationIdMiddleware } from "./utils/correlation";
import { createAgentsRouter } from "./routes/agents";
import { createJobsRouter } from "./routes/jobs";
import { createEventsRouter } from "./routes/events";
import { createHealthRouter } from "./routes/health";
import { BuildInfo } from "./utils/buildInfo";
import { createMetaRouter } from "./routes/meta";

export interface AppDependencies {
  config: OperatorConfig;
  registry: AgentRegistry;
  queue: InMemoryJobQueue;
  worker: Worker;
  eventBus: EventBus;
  logger: Logger;
  buildInfo: BuildInfo;
}

export function createApp({ config, registry, queue, worker, eventBus, logger, buildInfo }: AppDependencies) {
  const app = express();

  app.use(express.json());
  if (config.nodeEnv === "development") {
    app.use((req, _res, next) => {
      logger.debug(`${req.method} ${req.path}`);
      next();
    });
  }

  app.use(correlationIdMiddleware);

  const internalRouter = express.Router();
  internalRouter.use(createMetaRouter({ buildInfo, config }));
  internalRouter.use(createHealthRouter({ worker, queue, config }));
  internalRouter.use(createAgentsRouter({ registry }));
  internalRouter.use(createJobsRouter({ queue, eventBus }));
  internalRouter.use(createEventsRouter({ eventBus }));

  internalRouter.use("*", (_req, res) => {
    res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use("/internal", internalRouter);

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    logger.error("Unhandled error", err);
    const status = 500;
    return res.status(status).json({
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: config.nodeEnv === "production" ? "Unexpected error" : err.message,
      },
    });
  });

  return app;
}
