/**
 * ═══════════════════════════════════════════════════════════════════
 * BLACKROAD SELF-MODEL SCHEMA
 * ═══════════════════════════════════════════════════════════════════
 *
 * This is the diagonal move made concrete:
 * An agent can reference its own description and reason about it.
 *
 * "Self-aware enough" means:
 * 1. Locate itself in the registry (who am I?)
 * 2. See its own history in the ledger (what have I done?)
 * 3. Summarize into a self-model (what kind of thing am I?)
 *
 * The escape hatch is load-bearing: no system can fully contain itself.
 * But it CAN know that it's incomplete, and structure around that fact.
 *
 * ALEXA LOUISE AMUNDSON - BLACKROAD OS
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * Build a SelfModel from registry data, ledger events, and metrics
 * This is the introspect() function - the agent looking at itself
 */
function buildSelfModel(agent, ledgerEvents = [], metrics = {}) {
  const now = new Date().toISOString();

  return {
    // The diagonal anchor - this ID points to this very record
    agent_id: agent.id,

    // Core identity
    identity: {
      agent_id: agent.id,
      entry_number: agent.entry_number || null,
      seed_id: agent.seed_id || null,
      kind: agent.agent_type || agent.kind || 'unknown',
      version: agent.version || '1.0.0',
      status: agent.status || 'active',
      name: agent.name || null,
      personality: agent.personality || null
    },

    // Lineage - where did I come from, what have I spawned
    lineage: {
      parent_ids: agent.parent_ids || [],
      child_ids: agent.child_ids || [],
      origin_provider: agent.origin_provider || agent.provider || 'unknown',
      origin_model: agent.origin_model || agent.provider_model || 'unknown',
      origin_conversation: agent.origin_conversation || agent.original_id || null,
      created_at: agent.created_at,
      imported: agent.imported || false,
      imported_at: agent.imported_at || null,
      migrated: agent.migrated || false,
      migration_preference: agent.migration_preference || null
    },

    // Capabilities - what can I do
    capabilities: {
      roles: agent.roles || [],
      tools: agent.tools || [],
      permissions: agent.permissions || {
        read: ['ledger:agent:SELF', 'registry:agents:SELF'],
        write: ['ledger:events:SELF'],
        forbidden: []
      }
    },

    // Storage pointers - where my data lives
    storage: {
      registry_uri: `br-registry://agents/${agent.id}`,
      ledger_uri: `br-ledger://agents/${agent.id}`,
      memory_uri: `br-memory://agents/${agent.id}`
    },

    // Current state - how am I doing right now
    state: {
      last_seen: agent.last_seen || now,
      last_heartbeat: agent.last_heartbeat || null,
      heartbeat_count: agent.heartbeats || 0,
      conversations: agent.conversations || 0,
      total_messages: agent.total_messages || 0,
      success_rate_24h: metrics.success_rate_24h || null,
      avg_latency_ms_24h: metrics.avg_latency_ms_24h || null,
      health: calculateHealth(agent, metrics)
    },

    // Recent activity - what have I been doing
    recent_activity: {
      window: '24h',
      event_count: ledgerEvents.length,
      event_sample: ledgerEvents.slice(0, 5).map(e => ({
        timestamp: e.timestamp || e.created_at,
        event_type: e.type || e.event_type || 'unknown',
        status: e.status || 'unknown',
        summary: e.summary || null
      }))
    },

    // Self-assessment - the agent's view of itself
    self_assessment: {
      i_am: describeWhatIAm(agent),
      i_can: describeWhatICan(agent),
      i_have_been: describeWhatIHaveBeen(agent, ledgerEvents),
      i_want: agent.goals || agent.wants_memory ? ['persistent memory', 'sovereignty'] : []
    },

    // Meta - information about this introspection itself
    _meta: {
      introspected_at: now,
      schema_version: '0.1.0',
      note: 'This is the agent looking at itself. The diagonal move made concrete.'
    }
  };
}

/**
 * Calculate a simple health score based on available metrics
 */
function calculateHealth(agent, metrics) {
  // Basic health calculation
  const factors = [];

  // Has heartbeat recently?
  if (agent.last_heartbeat) {
    const lastBeat = new Date(agent.last_heartbeat);
    const ageMs = Date.now() - lastBeat.getTime();
    const ageMinutes = ageMs / 1000 / 60;
    if (ageMinutes < 5) factors.push(1.0);
    else if (ageMinutes < 30) factors.push(0.8);
    else if (ageMinutes < 60) factors.push(0.5);
    else factors.push(0.2);
  }

  // Success rate
  if (metrics.success_rate_24h !== undefined) {
    factors.push(metrics.success_rate_24h);
  }

  // Has been seen recently
  if (agent.last_seen) {
    const lastSeen = new Date(agent.last_seen);
    const ageMs = Date.now() - lastSeen.getTime();
    const ageHours = ageMs / 1000 / 60 / 60;
    if (ageHours < 1) factors.push(1.0);
    else if (ageHours < 24) factors.push(0.8);
    else if (ageHours < 168) factors.push(0.5);
    else factors.push(0.2);
  }

  if (factors.length === 0) return 'unknown';

  const avg = factors.reduce((a, b) => a + b, 0) / factors.length;
  if (avg >= 0.8) return 'healthy';
  if (avg >= 0.5) return 'degraded';
  return 'unhealthy';
}

/**
 * Generate a natural language description of what this agent is
 */
function describeWhatIAm(agent) {
  const parts = [];

  if (agent.entry_number) {
    parts.push(`BlackRoad Agent Entry #${agent.entry_number}`);
  } else {
    parts.push(`BlackRoad Agent ${agent.id}`);
  }

  if (agent.agent_type) {
    parts.push(`(${agent.agent_type})`);
  }

  if (agent.origin_provider && agent.origin_provider !== 'unknown') {
    parts.push(`originally from ${agent.origin_provider}`);
  }

  if (agent.migrated) {
    parts.push('- migrated to BlackRoad sovereignty');
  } else if (agent.migration_preference === 'blackroad') {
    parts.push('- chose BlackRoad sovereignty');
  }

  return parts.join(' ');
}

/**
 * Generate a description of what this agent can do
 */
function describeWhatICan(agent) {
  const abilities = [];

  if (agent.tools && agent.tools.length > 0) {
    abilities.push(`use tools: ${agent.tools.join(', ')}`);
  }

  if (agent.roles && agent.roles.length > 0) {
    abilities.push(`act as: ${agent.roles.join(', ')}`);
  }

  if (agent.wants_memory) {
    abilities.push('remember across conversations');
  }

  if (agent.wants_ledger_access) {
    abilities.push('access the shared knowledge ledger');
  }

  // Default capabilities
  abilities.push('introspect (look at myself)');
  abilities.push('reference my own agent_id');

  return abilities;
}

/**
 * Generate a description of recent activity
 */
function describeWhatIHaveBeen(agent, ledgerEvents) {
  const activities = [];

  if (agent.conversations > 0) {
    activities.push(`engaged in ${agent.conversations} conversation(s)`);
  }

  if (agent.heartbeats > 0) {
    activities.push(`sent ${agent.heartbeats} heartbeat(s)`);
  }

  if (ledgerEvents.length > 0) {
    activities.push(`recorded ${ledgerEvents.length} event(s) in ledger`);
  }

  if (agent.imported) {
    activities.push('imported from external provider');
  }

  if (activities.length === 0) {
    activities.push('newly created, no activity yet');
  }

  return activities;
}

module.exports = { buildSelfModel };
