import { AgentDomains } from '../config/symbols';
import { OrchestratorContext } from './types';

export class InfraOrchestrator {
  private ctx;

  constructor(context: OrchestratorContext) {
    this.ctx = context.ctx;
  }

  async reconcileInfrastructure(): Promise<void> {
    this.ctx.logger.info('[InfraOrchestrator] reconciling infra state');
    this.ctx.journal.record({
      domain: AgentDomains.infra,
      message: 'reconcile_infra',
      timestamp: Date.now(),
    });
  }
}
