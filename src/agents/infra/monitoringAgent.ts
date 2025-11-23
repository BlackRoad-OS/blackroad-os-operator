import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class MonitoringAgent implements Agent {
  id = 'monitoring_agent';
  domain = AgentDomains.infra;
  description = 'Collects metrics and emits alerts.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('MonitoringAgent initialized');
  }
}
