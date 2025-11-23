import { readFileSync } from 'fs';
import path from 'path';

// TODO: Replace these placeholder interfaces with shared implementations once available in the codebase.
export interface Logger {
  info(payload: unknown, message?: string): void;
  debug(payload: unknown, message?: string): void;
  error(payload: unknown, message?: string): void;
}

export interface ConfigProvider {
  get<T = unknown>(key: string, defaultValue?: T): T | undefined;
}

export interface EventBus {
  subscribe(topic: string, handler: (event: FinanceEvent) => Promise<void> | void): void;
  publish(topic: string, event: FinanceEvent): Promise<void>;
}

export interface DataAccess {
  query<T = unknown>(queryText: string, params?: unknown[]): Promise<T>;
}

export interface JournalEntry {
  id: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  currency: string;
  memo?: string;
  timestamp: string;
}

export interface AgentContext {
  logger: Logger;
  config: ConfigProvider;
  eventBus: EventBus;
  dataAccess: DataAccess;
  psShaInfinity: {
    hash: (payload: unknown) => string;
    journal: (entry: JournalEntry) => Promise<void>;
  };
}

export interface FinanceEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  payload: unknown;
}

export interface FinanceReport {
  id: string;
  agentId: string;
  type: string;
  period?: string;
  createdAt: string;
  data: unknown;
  metadata?: Record<string, unknown>;
}

export interface FinanceAgent {
  id: string;
  init(ctx: AgentContext): Promise<void>;
  handleEvent(event: FinanceEvent): Promise<void>;
  runPeriodic?(): Promise<void>;
  generateReports?(): Promise<FinanceReport[]>;
}

export interface FinanceAgentRegistryEntry {
  id: string;
  name: string;
  description: string;
  mandate: string[];
  inputs: string[];
  outputs: string[];
  critical_reports: string[];
  escalation_rules: string[];
  dependencies: string[];
  data_sources: string[];
  status: string;
}

export interface FinanceAgentRegistry {
  agents: FinanceAgentRegistryEntry[];
}

export function loadFinanceAgentRegistry(configPath?: string): FinanceAgentRegistry {
  const resolvedPath =
    configPath ?? path.resolve(__dirname, '../../../config/finance_agent_registry.yaml');
  const fileContents = readFileSync(resolvedPath, 'utf-8');
  // Lazy import to avoid requiring YAML parser globally in environments that do not need it.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { parse } = require('yaml') as { parse: (input: string) => FinanceAgentRegistry };
  return parse(fileContents);
}
