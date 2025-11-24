# Operator Runtime Overview

The Operator hosts agents and dispatches jobs using in-process primitives. It is intentionally lightweight and stateless so the persistence layers can be swapped later.

## Core Components

### Agent Registry
- File: `src/runtime/agentRegistry.ts`
- Holds registered agents, their metadata, and runtime state.
- Provides helper to register default example agents for local development.

### Job Queue + Worker
- Files: `src/runtime/jobQueue.ts`, `src/runtime/worker.ts`
- `InMemoryJobQueue` stores queued jobs and exposes status lookups.
- `Worker` polls the queue, invokes the appropriate agent, updates job lifecycle, and emits events.

### Event Bus
- File: `src/events/eventBus.ts`
- Emits `DomainEvent` objects for state transitions and keeps a bounded buffer of recent events.
- Subscribers can attach to forward events to the journal store or future sinks.

### Journal Store
- File: `src/integrations/journalStore.ts`
- Defines the `JournalStore` interface and an in-memory implementation used during development.
- Converts emitted events into journal entries that can later be rolled into RoadChain blocks.

## Adding New Agents
1. Implement an agent in `blackroad-os-core` style with `metadata` and an async `run` method.
2. Register it through `AgentRegistry.registerAgent` or extend `createDefaultAgentRegistry` for local defaults.
3. Jobs can target the new agent by specifying `agentId` when enqueuing.

## Internal HTTP API
The Express app mounted in `src/app.ts` exposes `/internal` routes for meta/build info, health, agents, jobs, and events. These endpoints are meant for internal services such as `blackroad-os-api`.
