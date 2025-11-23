import { UnifiedLedgerAgent } from './implemented/unified_ledger_agent';
import { MarketDataAgent } from './implemented/market_data_agent';
import { AccountingCloseAgent } from './implemented/accounting_close_agent';
import { TreasuryLiquidityAgent } from './implemented/treasury_liquidity_agent';
import { FpnaForecastingAgent } from './implemented/fpna_forecasting_agent';
import { CapitalBudgetingAgent } from './implemented/capital_budgeting_agent';
import { CapitalStructureAgent } from './implemented/capital_structure_agent';
import { WorkingCapitalAgent } from './implemented/working_capital_agent';
import {
  AgentContext,
  ConfigProvider,
  DataAccess,
  EventBus,
  FinanceAgent,
  FinanceAgentRegistry,
  FinanceEvent,
  FinanceReport,
  Logger,
  loadFinanceAgentRegistry,
} from './types';

const agentConstructors: Record<string, new () => FinanceAgent> = {
  unified_ledger: UnifiedLedgerAgent,
  market_data: MarketDataAgent,
  accounting_close: AccountingCloseAgent,
  treasury_liquidity: TreasuryLiquidityAgent,
  fpna_forecasting: FpnaForecastingAgent,
  capital_budgeting: CapitalBudgetingAgent,
  capital_structure: CapitalStructureAgent,
  working_capital: WorkingCapitalAgent,
};

type SubscriptionHandler = (event: FinanceEvent) => Promise<void> | void;

export class SimpleEventBus implements EventBus {
  private subscriptions: Map<string, SubscriptionHandler[]> = new Map();

  subscribe(topic: string, handler: SubscriptionHandler): void {
    const handlers = this.subscriptions.get(topic) ?? [];
    handlers.push(handler);
    this.subscriptions.set(topic, handlers);
  }

  async publish(topic: string, event: FinanceEvent): Promise<void> {
    const handlers: SubscriptionHandler[] = [];

    this.subscriptions.forEach((registeredHandlers, registeredTopic) => {
      if (registeredTopic === topic) {
        handlers.push(...registeredHandlers);
        return;
      }

      if (registeredTopic === '*') {
        handlers.push(...registeredHandlers);
        return;
      }

      if (registeredTopic.endsWith('*')) {
        const prefix = registeredTopic.slice(0, -1);
        if (topic.startsWith(prefix)) {
          handlers.push(...registeredHandlers);
        }
      }
    });

    for (const handler of handlers) {
      await Promise.resolve(handler(event));
    }
  }
}

export function createConsoleLogger(): Logger {
  return {
    info: (payload: unknown, message?: string) => {
      // eslint-disable-next-line no-console
      console.info(message ?? '', payload);
    },
    debug: (payload: unknown, message?: string) => {
      // eslint-disable-next-line no-console
      console.debug(message ?? '', payload);
    },
    error: (payload: unknown, message?: string) => {
      // eslint-disable-next-line no-console
      console.error(message ?? '', payload);
    },
  };
}

export function createEnvConfigProvider(): ConfigProvider {
  return {
    get: <T = unknown>(key: string, defaultValue?: T) =>
      (process.env[key] as unknown as T) ?? defaultValue,
  };
}

export function createNoopDataAccess(): DataAccess {
  return {
    // eslint-disable-next-line @typescript-eslint/require-await
    async query<T = unknown>(): Promise<T> {
      // TODO: replace with database access integration.
      return {} as T;
    },
  };
}

export function createInsecurePsShaInfinity() {
  return {
    hash: (payload: unknown) => JSON.stringify(payload),
    // eslint-disable-next-line @typescript-eslint/require-await
    async journal() {
      // TODO: connect to journal persistence once available.
      return;
    },
  };
}

export class FinanceOrchestrator {
  private ctx: AgentContext;

  private agents: FinanceAgent[] = [];

  private registry?: FinanceAgentRegistry;

  constructor(ctx: AgentContext) {
    this.ctx = ctx;
  }

  getAgents(): FinanceAgent[] {
    return this.agents;
  }

  getRegistry(): FinanceAgentRegistry | undefined {
    return this.registry;
  }

  async init(registryPath?: string): Promise<void> {
    this.registry = loadFinanceAgentRegistry(registryPath);
    this.ctx.logger.info({ registryAgents: this.registry.agents.length }, 'FinanceOrchestrator registry loaded');

    for (const entry of this.registry.agents) {
      const ctor = agentConstructors[entry.id];
      if (!ctor) {
        this.ctx.logger.error({ agentId: entry.id }, 'No constructor registered for finance agent');
        continue;
      }

      const agent = new ctor();
      await agent.init(this.ctx);
      this.agents.push(agent);

      // Subscribe agent to finance-related topics. Wildcard support is implemented in the SimpleEventBus.
      this.ctx.eventBus.subscribe('finance.*', async (event: FinanceEvent) => agent.handleEvent(event));
      this.ctx.eventBus.subscribe(`${agent.id}.*`, async (event: FinanceEvent) => agent.handleEvent(event));
    }
  }

  async broadcastEvent(event: FinanceEvent): Promise<void> {
    const topic = event.type ?? 'finance.event';
    await this.ctx.eventBus.publish(topic, event);
  }

  async runPeriodic(): Promise<void> {
    for (const agent of this.agents) {
      if (agent.runPeriodic) {
        await agent.runPeriodic();
      }
    }
  }

  async collectReports(): Promise<FinanceReport[]> {
    const reports: FinanceReport[] = [];
    for (const agent of this.agents) {
      if (agent.generateReports) {
        const generated = await agent.generateReports();
        reports.push(...generated);
      }
    }

    return reports;
  }
}

export function createDefaultFinanceAgentContext(): AgentContext {
  const eventBus = new SimpleEventBus();
  return {
    logger: createConsoleLogger(),
    config: createEnvConfigProvider(),
    eventBus,
    dataAccess: createNoopDataAccess(),
    psShaInfinity: createInsecurePsShaInfinity(),
  };
}
