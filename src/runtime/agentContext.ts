import { OperatorConfig } from '../config/env';
import { EventBus } from './eventBus';
import { PsShaInfinity } from './journal';
import { Logger } from '../utils/logger';

export interface DataAccess {
  query: (statement: string, params?: unknown[]) => Promise<unknown>;
}

export interface AgentContext {
  logger: Logger;
  eventBus: EventBus;
  journal: PsShaInfinity;
  config: OperatorConfig;
  db?: DataAccess; // optional for future
  schedule: (intervalMs: number, fn: () => Promise<void>) => void;
}
