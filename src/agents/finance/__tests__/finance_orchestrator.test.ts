import path from 'path';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  AgentContext,
  FinanceAgent,
  FinanceEvent,
  FinanceReport,
  loadFinanceAgentRegistry,
} from '../types';
import { FinanceOrchestrator, SimpleEventBus } from '../finance_orchestrator';

const registryPath = path.resolve(process.cwd(), 'config/finance_agent_registry.yaml');

function createMockContext(): AgentContext {
  const logger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  };

  return {
    logger,
    config: {
      get: vi.fn(),
    },
    eventBus: new SimpleEventBus(),
    dataAccess: {
      query: vi.fn(async () => ({})),
    },
    psShaInfinity: {
      hash: vi.fn(() => 'hash'),
      journal: vi.fn(async () => undefined),
    },
  };
}

describe('finance agent registry', () => {
  it('parses registry yaml and exposes expected agent ids', () => {
    const registry = loadFinanceAgentRegistry(registryPath);
    const ids = registry.agents.map((entry) => entry.id);
    expect(ids).toEqual([
      'unified_ledger',
      'market_data',
      'accounting_close',
      'treasury_liquidity',
      'fpna_forecasting',
      'capital_budgeting',
      'capital_structure',
      'working_capital',
    ]);
  });
});

describe('FinanceOrchestrator', () => {
  let ctx: AgentContext;
  let orchestrator: FinanceOrchestrator;

  beforeEach(async () => {
    ctx = createMockContext();
    orchestrator = new FinanceOrchestrator(ctx);
    await orchestrator.init(registryPath);
  });

  it('initializes all agents without throwing', () => {
    const agentIds = orchestrator.getAgents().map((agent) => agent.id);
    expect(agentIds).toContain('unified_ledger');
    expect(agentIds).toHaveLength(8);
  });

  it('routes periodic execution to agents implementing runPeriodic', async () => {
    const spies = orchestrator
      .getAgents()
      .filter((agent) => agent.runPeriodic)
      .map((agent) => vi.spyOn(agent, 'runPeriodic'));

    await orchestrator.runPeriodic();

    spies.forEach((spy) => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('collects reports from agents that generate them', async () => {
    const agents = orchestrator.getAgents();
    const sampleReport: FinanceReport = {
      id: 'report-1',
      agentId: agents[0]?.id ?? 'unknown',
      type: 'test',
      createdAt: new Date().toISOString(),
      data: {},
    };

    const spy = vi.spyOn(agents[0] as FinanceAgent, 'generateReports');
    spy.mockResolvedValueOnce([sampleReport]);

    const reports = await orchestrator.collectReports();

    expect(reports).toContainEqual(sampleReport);
  });

  it('dispatches events to subscribed agents', async () => {
    const event: FinanceEvent = {
      id: 'evt-1',
      type: 'finance.test',
      source: 'test',
      timestamp: new Date().toISOString(),
      payload: {},
    };

    const agents = orchestrator.getAgents();
    const spy = vi.spyOn(agents[0], 'handleEvent');

    await orchestrator.broadcastEvent(event);

    expect(spy).toHaveBeenCalledWith(event);
  });
});
