import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class SupervisoryAgent implements Agent {
  id = 'supervisory_agent';
  domain = AgentDomains.compliance;
  description = 'Oversees compliance workflows and escalations.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('SupervisoryAgent initialized');
  }
}
