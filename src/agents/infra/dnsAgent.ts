import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class DnsAgent implements Agent {
  id = 'dns_agent';
  domain = AgentDomains.infra;
  description = 'Manages DNS records and routing updates.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('DnsAgent initialized');
  }
}
