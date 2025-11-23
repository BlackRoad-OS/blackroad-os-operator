# Operator Architecture

The operator is the long-lived orchestration layer that runs every BlackRoad OS agent pod. It relies on a typed configuration surface (`src/config`) and a simple runtime (`src/runtime`) that wires together logging, event delivery, scheduling, and journaling via PS-SHA∞.

## Event-driven runtime

Agents communicate via the local event bus (`LocalEventBus`) that supports lightweight publish/subscribe and maintains a small in-memory buffer of recent events for observability. Orchestrators consume agent outputs and can also emit events for downstream consumers.

## Registries

All agent classes are declared in `src/registry/agentsRegistry.yaml`, while orchestrators live in `src/registry/orchestratorsRegistry.yaml`. The loader reads these YAML manifests to dynamically instantiate and initialize modules at startup. This keeps the runtime declarative and ready for future pods.

## Orchestrator layer

Domain orchestrators live in `src/orchestrators`. They sit above their respective agent pods, coordinating cross-agent workflows and journaling actions for compliance. The finance orchestrator is wired by default and schedules daily, weekly, and monthly tasks.

## Startup sequence

1. Load configuration and bootstrap logger.
2. Initialize event bus and PS-SHA∞ journal implementation.
3. Build an `AgentContext` and hand it to the `AgentLoader`.
4. Load agents from the registry, initialize them, and start orchestrator schedules.
5. Expose internal APIs under `/internal` for inspection and future integrations.
