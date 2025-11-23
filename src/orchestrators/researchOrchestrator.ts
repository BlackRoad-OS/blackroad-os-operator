import { AgentDomains } from '../config/symbols';
import { OrchestratorContext } from './types';

export class ResearchOrchestrator {
  private ctx;

  constructor(context: OrchestratorContext) {
    this.ctx = context.ctx;
  }

  async refreshInsights(): Promise<void> {
    this.ctx.logger.info('[ResearchOrchestrator] refreshing insights');
    this.ctx.journal.record({
      domain: AgentDomains.research,
      message: 'refresh_insights',
      timestamp: Date.now(),
    });
  }
}
