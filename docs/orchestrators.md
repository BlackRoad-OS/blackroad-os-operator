# Orchestrators

Orchestrators coordinate workflows across agent pods. They bundle ordered calls to agents, emit events, and journal important decisions.

## FinanceOrchestrator

`src/orchestrators/financeOrchestrator.ts` demonstrates the pattern:

- `runDailyDataSync` – refreshes market data and ledger snapshots (placeholder).
- `runWeeklyLiquidity` – drives cash and liquidity analysis.
- `runMonthlyClose` – coordinates accounting close and reporting.
- `scheduleDefaults` – attaches default cadences so the orchestrator runs automatically when the operator starts.

## Adding a new orchestrator

1. Create a class in `src/orchestrators` that accepts an `OrchestratorContext`.
2. Register it in `src/registry/orchestratorsRegistry.yaml`.
3. Wire schedules using `AgentContext.schedule` to run on the desired cadence.
4. Expose any internal API endpoints through `src/api` to make results observable.

This structure keeps orchestrations modular and domain-focused while sharing the same runtime primitives.
