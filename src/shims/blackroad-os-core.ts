export type PsShaInfinity = string;
export type IdentityAnchor = string;

export interface Result<T, E = Error> {
  ok: boolean;
  value?: T;
  error?: E;
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export type EventSeverity = "info" | "warn" | "error";

export interface DomainEvent {
  id: PsShaInfinity;
  type: string;
  timestamp: string;
  severity?: EventSeverity;
  payload?: unknown;
  metadata?: Record<string, unknown>;
  relatedIds?: PsShaInfinity[];
}

export interface JournalEntry {
  id: PsShaInfinity;
  eventId: PsShaInfinity;
  createdAt: string;
  data: DomainEvent;
}

export interface RoadChainBlock {
  id: PsShaInfinity;
  entries: JournalEntry[];
  createdAt: string;
}

export interface AgentContext {
  emitEvent: (event: DomainEvent) => void;
  now: () => string;
}

export interface AgentMetadata {
  id: PsShaInfinity;
  name: string;
  description?: string;
  tags?: string[];
  version?: string;
}

export interface AgentState {
  status: "idle" | "running" | "offline";
  lastSeen?: string;
  lastError?: string;
}

export interface Agent<I = unknown, O = unknown> {
  metadata: AgentMetadata;
  run: (input: I, context: AgentContext) => Promise<Result<O>>;
}

export type JobStatus = "queued" | "running" | "completed" | "failed";

export interface Job<I = unknown, O = unknown> {
  id: PsShaInfinity;
  type: string;
  agentId?: PsShaInfinity;
  input?: I;
  output?: O;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export function startJob<I, O>(job: Job<I, O>): Job<I, O> {
  return { ...job, status: "running", updatedAt: new Date().toISOString() };
}

export function completeJob<I, O>(job: Job<I, O>, output?: O): Job<I, O> {
  return {
    ...job,
    status: "completed",
    output,
    updatedAt: new Date().toISOString(),
  };
}

export function failJob<I, O>(job: Job<I, O>, error: string): Job<I, O> {
  return {
    ...job,
    status: "failed",
    error,
    updatedAt: new Date().toISOString(),
  };
}
