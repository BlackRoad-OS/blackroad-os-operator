export type QueueName = 'heartbeat' | 'sample' | 'events';

// ⚙️ Job Status Tracking 📊
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'retrying';

export interface JobStatusInfo {
  jobId: string;
  status: JobStatus;
  startedAt?: number;
  completedAt?: number;
  duration?: number;
  attempts: number;
  error?: string;
}

// 🤖 Agent Metadata
export interface AgentMeta {
  id: string;
  role?: string;
  version?: string;
  capabilities?: string[];
}

export type AgentStatus = 'online' | 'offline' | 'busy';

export interface AgentRegistration {
  id: string;
  hostname: string;
  displayName?: string;
  roles?: string[];
  tags?: string[];
  capabilities?: {
    docker: boolean;
    python?: string;
  };
  workspaces?: string[];
  status?: AgentStatus;
}

export interface RegisteredAgent extends AgentRegistration {
  lastHeartbeat: number;
  status: AgentStatus;
  capabilities: {
    docker: boolean;
    python?: string;
  };
  tags: string[];
  roles: string[];
  workspaces: string[];
}

// 🔁 Idempotency
export interface IdempotencyKey {
  operationId: string;
  operationType: string;
  resourceId?: string;
  createdAt: number;
}

// ⚙️ Job Payloads
export interface JobPayload {
  ts: number;
  meta?: AgentMeta;
  idempotencyKey?: IdempotencyKey;
  [key: string]: unknown;
}

export type HeartbeatPayload = JobPayload;

// 🧵 Workflow Types
export interface WorkflowStep {
  id: string;
  jobName: string;
  input: Record<string, unknown>;
  nextOnSuccess?: string;
  nextOnFailure?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  complianceSensitive?: boolean;
  category?: 'finance' | 'identity' | 'policy' | 'general';
}

export interface WorkflowExecution {
  workflowId: string;
  definitionId: string;
  status: 'running' | 'completed' | 'failed' | 'partial';
  currentStep?: string;
  startedAt: number;
  completedAt?: number;
  results: Record<string, unknown>;
}

// 🔄 Retry Policy
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  initialDelayMs: number;
  maxDelayMs: number;
}

// 🚧 Circuit Breaker State
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  threshold: number;
  timeout: number;
}

// 📡 Event Types
export type EventType = 
  | 'job.started'
  | 'job.completed'
  | 'job.failed'
  | 'workflow.started'
  | 'workflow.completed'
  | 'workflow.failed'
  | 'agent.registered'
  | 'agent.deregistered';

export interface DomainEvent {
  id: string;
  type: EventType;
  timestamp: number;
  payload: Record<string, unknown>;
  metadata?: {
    source: string;
    correlationId?: string;
    userId?: string;
    agentId?: string;
  };
}
