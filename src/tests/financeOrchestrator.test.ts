import { describe, expect, it } from 'vitest';
import { FinanceOrchestrator } from '../orchestrators/financeOrchestrator';
import { AgentContext } from '../runtime/agentContext';
import { createLogger } from '../utils/logger';
import { LocalEventBus } from '../runtime/eventBus';
import { DevPsShaInfinity } from '../runtime/journal';
import { getOperatorConfig, loadEnv } from '../config/env';

function buildContext(): AgentContext {
  loadEnv();
  const config = getOperatorConfig();
  const logger = createLogger('error');
  return {
    logger,
    eventBus: new LocalEventBus(logger),
    journal: new DevPsShaInfinity(),
    config,
    schedule: () => undefined,
  };
}

describe('FinanceOrchestrator', () => {
  it('runs orchestrations without throwing', async () => {
    const orchestrator = new FinanceOrchestrator({ ctx: buildContext() });
    await expect(orchestrator.runDailyDataSync()).resolves.toBeUndefined();
    await expect(orchestrator.runWeeklyLiquidity()).resolves.toBeUndefined();
    await expect(orchestrator.runMonthlyClose()).resolves.toBeUndefined();
  });
});
