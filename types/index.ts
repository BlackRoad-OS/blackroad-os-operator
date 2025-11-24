export type EnvStatus = 'healthy' | 'degraded' | 'down';

export interface Deploy {
  id: string;
  version: string;
  committedAt: string;
  status: 'in-progress' | 'success' | 'failed';
}

export interface Agent {
  id: string;
  role: string;
  lastSeen: string;
  status: EnvStatus;
}

export interface Env {
  id: string;
  name: string;
  region: string;
  status: EnvStatus;
  lastDeploy?: Deploy;
  agentCount?: number;
}

export interface HealthResponse {
  status: string;
  uptime: number;
}

export interface VersionResponse {
  version: string;
  commit: string;
}
