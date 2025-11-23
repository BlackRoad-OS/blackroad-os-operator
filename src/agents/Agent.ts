import { AgentContext } from '../runtime/agentContext';
import { Event } from '../runtime/eventBus';

export interface Agent {
  id: string;
  domain: string; // finance, infra, compliance, ops, research
  description?: string;
  init(ctx: AgentContext): Promise<void>;
  handleEvent?(event: Event): Promise<void>;
  runPeriodic?(): Promise<void>;
  generateReports?(): Promise<unknown[]>;
}
