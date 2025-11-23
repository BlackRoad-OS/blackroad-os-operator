import { AgentDomains, TaskTypes } from '../config/symbols';
import { SchedulerDefaults } from '../config/defaults';
import { Agent } from '../agents/Agent';
import { OrchestratorContext } from './types';

export class FinanceOrchestrator {
  private ctx;

  constructor(context: OrchestratorContext) {
    this.ctx = context.ctx;
  }

  private getAgent(id: string): Agent | undefined {
    // Placeholder for future agent discovery
    return undefined;
  }

  async runMonthlyClose(): Promise<void> {
    this.ctx.logger.info('[FinanceOrchestrator] runMonthlyClose');
    // TODO: Trigger accounting close flows and reporting
    this.ctx.journal.record({
      domain: AgentDomains.finance,
      message: TaskTypes.monthlyClose,
      timestamp: Date.now(),
    });
  }

  async runWeeklyLiquidity(): Promise<void> {
    this.ctx.logger.info('[FinanceOrchestrator] runWeeklyLiquidity');
    // TODO: Trigger treasury and cash positioning workflows
    this.ctx.journal.record({
      domain: AgentDomains.finance,
      message: TaskTypes.weeklyLiquidity,
      timestamp: Date.now(),
    });
  }

  async runDailyDataSync(): Promise<void> {
    this.ctx.logger.info('[FinanceOrchestrator] runDailyDataSync');
    // TODO: Trigger market data syncs and ledger refreshes
    this.ctx.journal.record({
      domain: AgentDomains.finance,
      message: TaskTypes.dailySync,
      timestamp: Date.now(),
    });
  }

  scheduleDefaults(): void {
    this.ctx.schedule(SchedulerDefaults.finance.dailyDataSyncMs, () => this.runDailyDataSync());
    this.ctx.schedule(SchedulerDefaults.finance.weeklyLiquidityMs, () => this.runWeeklyLiquidity());
    this.ctx.schedule(SchedulerDefaults.finance.monthlyCloseMs, () => this.runMonthlyClose());
  }
}
