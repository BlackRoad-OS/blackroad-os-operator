import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class KycAgent implements Agent {
  id = 'kyc_agent';
  domain = AgentDomains.compliance;
  description = 'Performs KYC verification flows.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('KycAgent initialized');
  }
}
