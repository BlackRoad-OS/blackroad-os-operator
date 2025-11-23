import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class HealthcheckAgent implements Agent {
  id = 'healthcheck_agent';
  domain = AgentDomains.ops;
  description = 'Performs system health checks across agents.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('HealthcheckAgent initialized');
  }
}
