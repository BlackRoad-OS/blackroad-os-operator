import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class InfraProvisionAgent implements Agent {
  id = 'infra_provision';
  domain = AgentDomains.infra;
  description = 'Provisions compute, storage, and network resources.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('InfraProvisionAgent initialized');
  }
}
