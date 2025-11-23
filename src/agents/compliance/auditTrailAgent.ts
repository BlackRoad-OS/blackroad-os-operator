import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class AuditTrailAgent implements Agent {
  id = 'audit_trail_agent';
  domain = AgentDomains.compliance;
  description = 'Creates supervisory audit trails and evidence.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('AuditTrailAgent initialized');
  }
}
