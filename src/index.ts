import express from 'express';
import { healthHandler } from './health/health';
import healthRoutes from './routes/healthRoutes';
import jobsRoutes from './routes/jobsRoutes';
import { createInternalRouter } from './api/internalRouter';
import { AgentLoader } from './runtime/agentLoader';
import { LocalEventBus } from './runtime/eventBus';
import { DevPsShaInfinity } from './runtime/journal';
import { createLogger } from './utils/logger';
import { getOperatorConfig, loadEnv } from './config/env';
import { FinanceOrchestrator } from './orchestrators/financeOrchestrator';
import { RegistryPaths } from './config/defaults';
import { AgentContext } from './runtime/agentContext';

const app = express();

app.use(express.json());

app.get('/health', healthHandler);
app.use(healthRoutes);
app.use('/jobs', jobsRoutes);

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
const financeOrchestrator = new FinanceOrchestrator({ ctx });

loader
  .loadFromRegistry(RegistryPaths.agents)
  .then(() => loader.initAll())
  .then(() => financeOrchestrator.scheduleDefaults())
  .then(() => {
    app.use('/internal', createInternalRouter({ loader, financeOrchestrator, eventBus }));
    logger.info('Internal API ready');
  })
  .catch((err) => {
    logger.error('Failed to initialize runtime', err);
  });

export default app;
