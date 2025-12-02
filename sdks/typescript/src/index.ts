/**
 * BlackRoad OS TypeScript SDK
 * AI Governance Platform
 *
 * @blackroad_name TypeScript SDK
 * @operator alexa.operator.v1
 *
 * @example
 * ```typescript
 * import { BlackRoad } from '@blackroad/sdk';
 *
 * const client = new BlackRoad({ apiKey: 'your-api-key' });
 *
 * // Chat with an agent
 * const response = await client.chat('Hello, how can you help me?');
 * console.log(response.message);
 *
 * // List agents
 * const agents = await client.agents.list();
 * agents.data.forEach(agent => console.log(agent.name));
 *
 * // Evaluate a policy
 * const result = await client.governance.evaluate({
 *   action: 'agents:invoke',
 *   subject: { userId: 'user-123' },
 *   resource: { type: 'agent', id: 'agent-456' },
 * });
 * console.log(`Decision: ${result.decision}`);
 * ```
 */

// Types
export * from './types';

// Client
export { BlackRoad, type BlackRoadConfig } from './client';

// Resources
export { AgentsResource } from './client/agents';
export { GovernanceResource } from './client/governance';
export { LedgerResource } from './client/ledger';
export { CollaborationResource } from './client/collaboration';
