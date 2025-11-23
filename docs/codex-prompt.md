# Codex Prompt — blackroad-os-operator

Copy/paste this into Copilot/Codex with the `BlackRoad-OS/blackroad-os-operator` repo open. It reflects the current TypeScript/Express runtime, agent registry, and finance scaffolding already in this codebase.

```
### SYSTEM INSTRUCTIONS FOR CODEX

You are updating the GitHub repo:

  BlackRoad-OS/blackroad-os-operator

This repo is the **agent runtime + orchestrator** for BlackRoad OS. It loads and manages agents, wires them to the local event bus and PS-SHA∞ journal, schedules recurring workflows, and exposes internal HTTP endpoints.

Stay focused on **runtime + orchestration scaffolding**. Do **NOT** implement full finance/compliance math or external integrations yet—create safe placeholders and TODOs instead.

---

## Current layout (keep paths accurate)
- Entrypoint server: `src/server.ts` boots `src/index.ts` (Express), which mounts health + job routes and lazily mounts the internal API once agents load.
- Config: `src/config/env.ts` (typed `OperatorConfig`, dotenv-backed), plus `src/config/defaults.ts` and `src/config/symbols.ts` for scheduler/agent constants.
- Runtime plumbing: `src/runtime/agentContext.ts` (shared context), `src/runtime/agentLoader.ts` (YAML-based loader), `src/runtime/eventBus.ts` (LocalEventBus with wildcard subscribe), `src/runtime/journal.ts` (DevPsShaInfinity), `src/runtime/systemScheduler.ts` (setInterval scheduler).
- Registries: `src/registry/agentsRegistry.yaml` (agent manifests) and `src/registry/orchestratorsRegistry.yaml` (orchestrators). Finance-specific registry lives at `config/finance_agent_registry.yaml`.
- Agent contract: `src/agents/Agent.ts` (id/domain/init/handleEvent/runPeriodic/generateReports?).
- Agents: stubs in `src/agents/finance/*.ts` (plus `/implemented` folder for richer finance stubs), infra/compliance/ops/research under `src/agents/*`. Keep ids aligned with the YAML registry.
- Orchestrators:
  - `src/orchestrators/financeOrchestrator.ts` uses `SchedulerDefaults` to schedule daily/weekly/monthly finance routines against the shared `AgentContext`/journal/event bus.
  - `src/agents/finance/finance_orchestrator.ts` is the finance-layer runtime that loads finance agents via `config/finance_agent_registry.yaml`, wires a `SimpleEventBus`, and exposes helpers like `collectReports`.
- Internal API: `src/api/internalRouter.ts` mounts `/internal` endpoints via `financeEndpoints.ts` and `agentsEndpoints.ts`, plus `/events` for recent bus events. Health + job routes live under `src/routes`.
- Docs worth keeping consistent: `docs/operator-architecture.md`, `docs/orchestrators.md`, `docs/finance-layer-v1.md`.

---

## What to build now
1) Strengthen runtime scaffolding (AgentContext, AgentLoader, event bus, journaling, scheduler) and keep it declarative via the YAML registries.
2) Keep finance layer wired but stubby: agents log/journal/subscribe to events; orchestrators schedule and expose summaries/placeholders.
3) Expose/extend internal API endpoints for health, agents list, finance summaries, and recent events. Keep them internal-only; no public business logic.
4) Add light tests (Vitest) when touching runtime/orchestrator code; prefer fast unit-style checks.

## Conventions
- Language: TypeScript (Node 20+). Express server. Tests via `vitest`.
- Imports: prefer existing utilities (`createLogger`, `LocalEventBus`, `DevPsShaInfinity`, `SystemScheduler`). Do not wrap imports in try/catch.
- Keep IDs/names in sync with `src/registry/agentsRegistry.yaml` and `config/finance_agent_registry.yaml`.
- Mark unfinished domain logic with `TODO:` and avoid binding to real external systems.

## Safe starting points
- `src/index.ts` for wiring new middleware/routes after agents load.
- `src/runtime/agentLoader.ts` / `src/registry/agentsRegistry.yaml` for adding or adjusting agents.
- `src/orchestrators/financeOrchestrator.ts` for schedule tweaks; `src/agents/finance/finance_orchestrator.ts` for finance-specific orchestration and registry parsing.
- `src/api/financeEndpoints.ts` / `src/api/agentsEndpoints.ts` for new internal endpoints.
- `src/runtime/systemScheduler.ts` for background cadence utilities.

---

If you need more prompts for sibling repos (`blackroad-os-core`, `blackroad-os-api`, etc.), ask before assuming structure.
```
