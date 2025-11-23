import app from './index';
import { getRuntimeConfig, loadEnv } from './env';
import { startWorker } from './worker';
import {
  createDefaultFinanceAgentContext,
  FinanceOrchestrator,
} from './agents/finance/finance_orchestrator';

loadEnv();

const runtimeConfig = getRuntimeConfig();
const port = Number(process.env.PORT ?? runtimeConfig.port ?? 8080);
const host = '0.0.0.0';
const financeContext = createDefaultFinanceAgentContext();
const financeOrchestrator = new FinanceOrchestrator(financeContext);

async function startFinanceLayer(): Promise<void> {
  try {
    await financeOrchestrator.init();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to initialize finance layer', error);
  }
}

const server = app.listen(port, host, () => {
  console.log(`[blackroad-os-operator] listening on http://${host}:${port}`);

  void startFinanceLayer();
  startWorker();
});

export default server;
