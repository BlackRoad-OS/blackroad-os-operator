import type { Request, Response, NextFunction } from 'express';
import { SERVICE_ID } from '../config/serviceConfig';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const logPayload = {
      ts: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      duration_ms: Number(durationMs.toFixed(3)),
      service_id: SERVICE_ID,
    };

    if (res.statusCode >= 500) {
      console.error(JSON.stringify(logPayload));
    } else if (res.statusCode >= 400) {
      console.warn(JSON.stringify(logPayload));
    } else {
      console.log(JSON.stringify(logPayload));
    }
  });

  next();
}
