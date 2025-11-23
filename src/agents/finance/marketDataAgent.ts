import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class MarketDataAgent implements Agent {
  id = 'market_data';
  domain = AgentDomains.finance;
  description = 'Retrieves and normalizes market/instrument data.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('MarketDataAgent initialized');
  }

  async runPeriodic(): Promise<void> {
    this.ctx?.logger.debug('MarketDataAgent fetching market data');
  }
}
