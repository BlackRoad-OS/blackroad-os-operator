# Agent Lifecycle

Agents move through a consistent lifecycle that keeps the runtime predictable and auditable.

1. **Load**: The `AgentLoader` reads `agentsRegistry.yaml` and dynamically imports each agent module.
2. **Init**: `init(ctx)` is called with the shared `AgentContext`, providing logger, event bus, journal, and configuration.
3. **Subscribe**: Agents may subscribe to events via the injected event bus to react to domain events.
4. **Run periodic**: If `runPeriodic` is defined, the scheduler invokes it on a configured cadence to perform routine work.
5. **Handle events**: When events match a subscription, `handleEvent` is invoked to process payloads.
6. **Journal**: Significant lifecycle steps emit PS-SHA∞ journal entries for downstream auditability.
7. **Shutdown**: Future hooks will allow graceful teardown and state persistence.

This lifecycle is intentionally lightweight today to allow rapid expansion of new agent pods without heavy ceremony.
