import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class AccountingCloseAgent implements Agent {
  id = 'accounting_close';
  domain = AgentDomains.finance;
  description = 'Coordinates month-end accounting close activities.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('AccountingCloseAgent initialized');
  }

  async runPeriodic(): Promise<void> {
    this.ctx?.logger.info('AccountingCloseAgent running close tasks');
    this.ctx?.journal.record({
      domain: this.domain,
      message: 'Ran accounting close periodic tasks',
      timestamp: Date.now(),
    });
  }
}
