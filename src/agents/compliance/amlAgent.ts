import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class AmlAgent implements Agent {
  id = 'aml_agent';
  domain = AgentDomains.compliance;
  description = 'Monitors transactions for AML risk.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('AmlAgent initialized');
  }
}
