/**
 * CapitalBudgetingAgent evaluates internal projects using NPV, IRR, and payback to inform capital allocation decisions.
 * Future logic will model project cash flows, rank initiatives, and run post-implementation reviews.
 */
import { AgentContext, FinanceAgent, FinanceEvent, FinanceReport } from '../types';

export class CapitalBudgetingAgent implements FinanceAgent {
  public readonly id = 'capital_budgeting';

  private ctx!: AgentContext;

  async init(ctx: AgentContext): Promise<void> {
    this.ctx = ctx;
    this.ctx.logger.info({ agentId: this.id }, 'CapitalBudgetingAgent initialized');
    // TODO: wire discount rate inputs and project data sources.
  }

  async handleEvent(event: FinanceEvent): Promise<void> {
    this.ctx.logger.debug({ agentId: this.id, eventType: event.type }, 'CapitalBudgetingAgent.handleEvent');
    // TODO: react to new project proposals and updated cash flow projections.
  }

  async runPeriodic(): Promise<void> {
    this.ctx.logger.debug({ agentId: this.id }, 'CapitalBudgetingAgent.runPeriodic');
    // TODO: refresh rankings and perform post-implementation reviews.
  }

  async generateReports(): Promise<FinanceReport[]> {
    // TODO: output capital allocation recommendations and review summaries.
    return [];
  }
}
