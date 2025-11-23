import { Logger } from './logger';

export function handleAsyncError(logger: Logger, context: string) {
  return (err: unknown) => {
    logger.error(`Error in ${context}:`, err);
  };
}

export class DomainError extends Error {
  constructor(message: string, public readonly domain?: string) {
    super(message);
  }
}
