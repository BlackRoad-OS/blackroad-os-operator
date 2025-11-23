import { getOperatorConfig, loadEnv } from '../config/env';
import { createLogger } from '../utils/logger';
import { LocalEventBus } from './eventBus';
import { DevPsShaInfinity } from './journal';
import { AgentContext } from './agentContext';
import { AgentLoader } from './agentLoader';
import { FinanceOrchestrator } from '../orchestrators/financeOrchestrator';
import { RegistryPaths } from '../config/defaults';

async function main() {
  loadEnv();
  const config = getOperatorConfig();
  const logger = createLogger(config.logLevel);

  const eventBus = new LocalEventBus(logger);
  const journal = new DevPsShaInfinity();

  const ctx: AgentContext = {
    logger,
    eventBus,
    journal,
    config,
    schedule: (interval, fn) => setInterval(() => fn().catch(logger.error), interval),
  };

  const loader = new AgentLoader(ctx);
  await loader.loadFromRegistry(RegistryPaths.agents);
  await loader.initAll();

  const financeOrchestrator = new FinanceOrchestrator({ ctx });
  financeOrchestrator.scheduleDefaults();

  logger.info('BlackRoad Operator is running.');
}

main().catch((err) => {
  console.error('Fatal error starting operator:', err);
  process.exit(1);
});
