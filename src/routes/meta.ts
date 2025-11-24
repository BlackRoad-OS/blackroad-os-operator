import { Router } from "express";
import { OperatorConfig } from "../config";
import { BuildInfo } from "../utils/buildInfo";

interface MetaDeps {
  buildInfo: BuildInfo;
  config: OperatorConfig;
}

export function createMetaRouter({ buildInfo, config }: MetaDeps): Router {
  const router = Router();

  router.get("/version", (_req, res) => {
    res.json({
      ok: true,
      data: {
        ...buildInfo,
        uptimeSeconds: Number(process.uptime().toFixed(3)),
        logLevel: config.logLevel,
      },
    });
  });

  return router;
}
