import { Router } from 'express';
import { FinanceOrchestrator } from '../orchestrators/financeOrchestrator';
import { AgentLoader } from '../runtime/agentLoader';
import { EventBus } from '../runtime/eventBus';
import { registerFinanceEndpoints } from './financeEndpoints';
import { registerAgentsEndpoints } from './agentsEndpoints';

export interface InternalApiDeps {
  loader: AgentLoader;
  financeOrchestrator: FinanceOrchestrator;
  eventBus: EventBus;
}

export function createInternalRouter(deps: InternalApiDeps): Router {
  const router = Router();
  registerFinanceEndpoints(router, deps.financeOrchestrator);
  registerAgentsEndpoints(router, deps.loader);

  router.get('/events', (_req, res) => {
    res.json({ events: deps.eventBus.getRecentEvents() });
  });

  return router;
}
