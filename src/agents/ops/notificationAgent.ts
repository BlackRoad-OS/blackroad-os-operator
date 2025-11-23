import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class NotificationAgent implements Agent {
  id = 'notification_agent';
  domain = AgentDomains.ops;
  description = 'Routes notifications to downstream systems.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('NotificationAgent initialized');
  }
}
