import { AgentDomains } from '../config/symbols';
import { OrchestratorContext } from './types';

export class OpsOrchestrator {
  private ctx;

  constructor(context: OrchestratorContext) {
    this.ctx = context.ctx;
  }

  async performHeartbeat(): Promise<void> {
    this.ctx.logger.info('[OpsOrchestrator] heartbeat check');
    this.ctx.journal.record({
      domain: AgentDomains.ops,
      message: 'ops_heartbeat',
      timestamp: Date.now(),
    });
  }
}
