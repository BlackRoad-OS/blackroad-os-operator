import { Router } from 'express';
import { AgentLoader } from '../runtime/agentLoader';

export function registerAgentsEndpoints(router: Router, loader: AgentLoader) {
  router.get('/agents', (_req, res) => {
    const agents = loader.getAgents().map((agent) => ({
      id: agent.id,
      domain: agent.domain,
      description: agent.description,
    }));
    res.json({ agents });
  });

  router.get('/agents/:id', (req, res) => {
    const agent = loader.getAgent(req.params.id);
    if (!agent) {
      res.status(404).json({ error: 'Agent not found' });
      return;
    }

    res.json({
      id: agent.id,
      domain: agent.domain,
      description: agent.description,
    });
  });
}
