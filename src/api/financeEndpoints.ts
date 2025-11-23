import { Router } from 'express';
import { FinanceOrchestrator } from '../orchestrators/financeOrchestrator';

export function registerFinanceEndpoints(router: Router, orchestrator: FinanceOrchestrator) {
  router.get('/finance/summary', async (_req, res) => {
    res.json({ status: 'ok', message: 'Finance summary placeholder' });
  });

  router.get('/finance/cash-forecast', async (_req, res) => {
    const reports = await orchestrator
      .runWeeklyLiquidity()
      .then(() => ({ forecast: 'stub', generatedAt: Date.now() }));
    res.json(reports);
  });

  router.get('/finance/statements/:period', async (req, res) => {
    const { period } = req.params;
    await orchestrator.runMonthlyClose();
    res.json({ period, status: 'stub', generatedAt: Date.now() });
  });
}
