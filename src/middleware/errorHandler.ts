import type { Request, Response, NextFunction } from 'express';
import { SERVICE_ID } from '../config/serviceConfig';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const status = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(status).json({
    ok: false,
    error: err.message,
    service: SERVICE_ID,
  });
}
