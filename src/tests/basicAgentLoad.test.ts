import { describe, expect, it, beforeAll } from 'vitest';
import path from 'path';
import { AgentLoader } from '../runtime/agentLoader';
import { AgentContext } from '../runtime/agentContext';
import { createLogger } from '../utils/logger';
import { LocalEventBus } from '../runtime/eventBus';
import { DevPsShaInfinity } from '../runtime/journal';
import { getOperatorConfig, loadEnv } from '../config/env';

let loader: AgentLoader;

beforeAll(async () => {
  loadEnv();
  const config = getOperatorConfig();
  const logger = createLogger('error');
  const ctx: AgentContext = {
    logger,
    config,
    eventBus: new LocalEventBus(logger),
    journal: new DevPsShaInfinity(),
    schedule: () => undefined,
  };

  loader = new AgentLoader(ctx);
  const registryPath = path.join(process.cwd(), 'src/registry/agentsRegistry.yaml');
  await loader.loadFromRegistry(registryPath);
  await loader.initAll();
});

describe('AgentLoader', () => {
  it('loads all agents from registry', () => {
    const agents = loader.getAgents();
    expect(agents.length).toBeGreaterThanOrEqual(10);
  });
});
