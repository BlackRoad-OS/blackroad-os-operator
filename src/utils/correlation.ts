import { randomUUID } from "crypto";
import { Request, Response, NextFunction } from "express";

export const CORRELATION_HEADER = "x-correlation-id";

export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existing = req.headers[CORRELATION_HEADER] as string | undefined;
  const id = existing ?? randomUUID();
  req.headers[CORRELATION_HEADER] = id;
  res.setHeader(CORRELATION_HEADER, id);
  next();
}
