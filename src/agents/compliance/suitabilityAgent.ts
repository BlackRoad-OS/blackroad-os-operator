import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class SuitabilityAgent implements Agent {
  id = 'suitability_agent';
  domain = AgentDomains.compliance;
  description = 'Reviews suitability and appropriateness for offerings.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('SuitabilityAgent initialized');
  }
}
