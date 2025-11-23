import { Request, Router } from "express";
import { AgentRegistry, AgentMetadataWithState } from "../runtime/agentRegistry";

interface AgentsDeps {
  registry: AgentRegistry;
}

function filterAgents(agents: AgentMetadataWithState[], req: Request): AgentMetadataWithState[] {
  const status = req.query.status as string | undefined;
  const q = (req.query.q as string | undefined)?.toLowerCase();

  return agents.filter((agent) => {
    const matchesStatus = status ? agent.status === status : true;
    const matchesQuery = q
      ? agent.name.toLowerCase().includes(q) || agent.tags?.some((tag) => tag.toLowerCase().includes(q))
      : true;
    return matchesStatus && matchesQuery;
  });
}

export function createAgentsRouter({ registry }: AgentsDeps): Router {
  const router = Router();

  router.get("/agents", (req, res) => {
    const agents = filterAgents(registry.listAgents(), req);
    res.json({ ok: true, data: agents });
  });

  router.get("/agents/:id", (req, res) => {
    const agent = registry.getAgent(req.params.id as string);
    if (!agent) {
      return res.status(404).json({
        ok: false,
        error: { code: "AGENT_NOT_FOUND", message: `Agent ${req.params.id} not found` },
      });
    }

    return res.json({ ok: true, data: { ...agent.core.metadata, ...agent.state } });
  });

  return router;
}
