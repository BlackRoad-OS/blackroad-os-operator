import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class CapitalBudgetingAgent implements Agent {
  id = 'capital_budgeting';
  domain = AgentDomains.finance;
  description = 'Evaluates capital allocation and project ROI.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('CapitalBudgetingAgent initialized');
  }

  async runPeriodic(): Promise<void> {
    this.ctx?.logger.debug('CapitalBudgetingAgent running capital checks');
  }
}
