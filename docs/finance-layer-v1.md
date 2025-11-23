# Finance Layer v1

## Purpose
The finance layer provides a structured home for finance-oriented agents in BlackRoad OS, including lifecycle management, orchestration, and a registry-backed source of truth for capabilities. This first version prioritizes scaffolding, interfaces, and orchestration hooks over full accounting logic.

## Agents
- **unified_ledger** — Maintains general, management, and regulatory ledgers; turns events into balanced journal entries.
- **market_data** — Centralizes instrument master data and market prices.
- **accounting_close** — Runs accrual accounting and period close processes to produce financial statements.
- **treasury_liquidity** — Manages rolling cash forecasts, liquidity, and treasury actions.
- **fpna_forecasting** — Maintains rolling forecasts and budgets with scenario analysis.
- **capital_budgeting** — Evaluates projects with NPV/IRR/payback to recommend allocations.
- **capital_structure** — Manages funding mix, WACC, and capital raise recommendations.
- **working_capital** — Optimizes cash conversion cycle via AR/AP/credit monitoring.

## Registry
- Located at `config/finance_agent_registry.yaml`.
- Contains metadata per agent: id, name, description, mandate, inputs, outputs, critical reports, escalation rules, dependencies, data sources, and status.
- Acts as the single source of truth for orchestration and documentation.

## Adding a New Finance Agent
1. Add a new entry to `config/finance_agent_registry.yaml` with the required fields.
2. Create a stub implementation in `src/agents/finance/implemented/<agent_id>_agent.ts` implementing `FinanceAgent`.
3. Register the constructor in `agentConstructors` inside `src/agents/finance/finance_orchestrator.ts`.
4. Extend tests under `src/agents/finance/__tests__` to cover registry parsing and orchestrator behavior.

## Future Work
- GAAP rules engine and accounting policy store.
- FX and multi-currency handling across ledger and reporting.
- Direct integrations with banking APIs and billing/AP systems.
- Project valuation math (NPV/IRR), funding optimization, and dilution modeling.
- Regulatory and tax layers, including compliance-driven escalation workflows.
- Hardened config loading and shared event-bus abstraction across operator components.
