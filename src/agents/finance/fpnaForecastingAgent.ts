import { Agent } from '../Agent';
import { AgentContext } from '../../runtime/agentContext';
import { AgentDomains } from '../../config/symbols';

export default class FpnaForecastingAgent implements Agent {
  id = 'fpna_forecasting';
  domain = AgentDomains.finance;
  description = 'Builds rolling forecasts and scenario models.';
  private ctx?: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info('FpnaForecastingAgent initialized');
  }

  async runPeriodic(): Promise<void> {
    this.ctx?.logger.info('FpnaForecastingAgent refreshing forecasts');
  }
}
