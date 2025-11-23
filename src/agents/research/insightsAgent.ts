import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class InsightsAgent implements Agent {
  id = 'insights_agent';
  domain = AgentDomains.research;
  description = 'Generates insights and dashboards for stakeholders.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('InsightsAgent initialized');
  }
}
