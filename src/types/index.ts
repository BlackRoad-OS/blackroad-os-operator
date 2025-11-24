export type QueueName = 'heartbeat' | 'sample';

export interface AgentMeta {
  id: string;
  role?: string;
  version?: string;
}

export interface JobPayload {
  ts: number;
  meta?: AgentMeta;
  [key: string]: unknown;
}

export type HeartbeatPayload = JobPayload;
