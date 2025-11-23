import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class SchedulerAgent implements Agent {
  id = 'scheduler';
  domain = AgentDomains.ops;
  description = 'Coordinates timed tasks across domains.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('SchedulerAgent initialized');
  }
}
