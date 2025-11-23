import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class MarketIntelAgent implements Agent {
  id = 'market_intel_agent';
  domain = AgentDomains.research;
  description = 'Tracks market intelligence and competitor moves.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('MarketIntelAgent initialized');
  }
}
