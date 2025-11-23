import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';
import { Event } from '../../runtime/eventBus';

export default class UnifiedLedgerAgent implements Agent {
  id = 'unified_ledger';
  domain = AgentDomains.finance;
  description = 'Maintains general ledger, subledgers, and journal events.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('UnifiedLedgerAgent initialized');
  }

  async handleEvent(event: Event): Promise<void> {
    this.ctx?.logger.debug('UnifiedLedgerAgent handling event', event.type);
  }

  async runPeriodic(): Promise<void> {
    this.ctx?.logger.info('UnifiedLedgerAgent periodic check');
    this.ctx?.journal.record({
      domain: this.domain,
      message: 'Ledger periodic maintenance',
      timestamp: Date.now(),
    });
  }
}
