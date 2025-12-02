-- 001_ledger_events_v1.sql
-- Canonical ledger_events schema for BlackRoad OS governance
--
-- This implements the v1 governance contract:
--   - Four-value decision enum: allow | deny | warn | shadow_deny
--   - Four-value ledger_level enum: none | decision | action | full
--   - Four-value layer enum: experience | governance | mesh | infra
--   - Full audit trail with correlation_id and intent_id
--
-- Migration strategy:
--   - For fresh installs: run this script directly
--   - For existing tables: use 001_ledger_events_v1_migrate.sql (companion script)

-- Drop existing table if in dev (comment out for production)
-- DROP TABLE IF EXISTS ledger_events;

CREATE TABLE IF NOT EXISTS ledger_events (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- ============================================
    -- IDENTITY: Correlation and sequencing
    -- ============================================
    correlation_id UUID NOT NULL,          -- Ties related events across services
    intent_id UUID,                         -- If part of a multi-step intent
    sequence_num INTEGER DEFAULT 0,         -- Ordering within an intent

    -- ============================================
    -- LOCATION: Where the event originated
    -- ============================================
    layer TEXT NOT NULL,                    -- 'experience' | 'governance' | 'mesh' | 'infra'
    host TEXT NOT NULL,                     -- e.g., 'edu.blackroad.io'
    service TEXT NOT NULL,                  -- e.g., 'edu-web'
    policy_scope TEXT NOT NULL,             -- e.g., 'edu.*'

    -- ============================================
    -- ACTOR: Who performed the action
    -- ============================================
    actor_user_id TEXT,                     -- Human user ID (null for agents/system)
    actor_role TEXT,                        -- Role at time of action
    actor_agent_id TEXT,                    -- Agent ID if action by agent
    actor_delegation_id UUID,               -- Delegation under which action was taken

    -- ============================================
    -- ACTION: What was done
    -- ============================================
    action TEXT NOT NULL,                   -- e.g., 'assignment:create'
    resource_type TEXT NOT NULL,            -- e.g., 'assignment'
    resource_id TEXT,                       -- Specific resource ID (null for collection actions)

    -- ============================================
    -- DECISION: Policy evaluation result
    -- ============================================
    decision TEXT NOT NULL,                 -- 'allow' | 'deny' | 'warn' | 'shadow_deny'
    policy_id TEXT,                         -- Which policy matched (null if default)
    policy_version TEXT,                    -- Version of policy pack

    -- ============================================
    -- EVIDENCE: Audit trail
    -- ============================================
    asserted_facts JSONB DEFAULT '[]'::jsonb,   -- Facts caller asserted
    fact_evidence JSONB DEFAULT '{}'::jsonb,    -- Evidence for assertions
    claims JSONB DEFAULT '[]'::jsonb,           -- Claims presented

    -- ============================================
    -- METADATA: Additional context
    -- ============================================
    ledger_level TEXT NOT NULL,             -- 'none' | 'decision' | 'action' | 'full'
    metadata JSONB DEFAULT '{}'::jsonb,     -- Action-specific data
    request_context JSONB,                  -- Full request context (if ledger_level='full')
    response_summary JSONB,                 -- Response summary (if ledger_level='full')

    -- ============================================
    -- TIMESTAMPS
    -- ============================================
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- When action occurred
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- When event was recorded

    -- ============================================
    -- CONSTRAINTS
    -- ============================================
    CONSTRAINT valid_layer CHECK (
        layer IN ('experience', 'gateway', 'governance', 'mesh', 'infra')
    ),
    CONSTRAINT valid_decision CHECK (
        decision IN ('allow', 'deny', 'warn', 'shadow_deny')
    ),
    CONSTRAINT valid_ledger_level CHECK (
        ledger_level IN ('none', 'decision', 'action', 'full')
    )
);

-- ============================================
-- INDEXES: Optimized for common queries
-- ============================================

-- Correlation: find all events in a request chain
CREATE INDEX IF NOT EXISTS idx_ledger_correlation
    ON ledger_events(correlation_id);

-- Intent: find all events in a multi-step intent
CREATE INDEX IF NOT EXISTS idx_ledger_intent
    ON ledger_events(intent_id)
    WHERE intent_id IS NOT NULL;

-- Actor: find all events by a specific user
CREATE INDEX IF NOT EXISTS idx_ledger_actor_user
    ON ledger_events(actor_user_id)
    WHERE actor_user_id IS NOT NULL;

-- Actor: find all events by a specific agent
CREATE INDEX IF NOT EXISTS idx_ledger_actor_agent
    ON ledger_events(actor_agent_id)
    WHERE actor_agent_id IS NOT NULL;

-- Action: find events by action type
CREATE INDEX IF NOT EXISTS idx_ledger_action
    ON ledger_events(action);

-- Scope: find events by policy scope
CREATE INDEX IF NOT EXISTS idx_ledger_scope
    ON ledger_events(policy_scope);

-- Time: range queries on event time
CREATE INDEX IF NOT EXISTS idx_ledger_time
    ON ledger_events(occurred_at);

-- Host + Time: find recent events for a specific host
CREATE INDEX IF NOT EXISTS idx_ledger_host_time
    ON ledger_events(host, occurred_at DESC);

-- Decision: find denied/warned actions for review
CREATE INDEX IF NOT EXISTS idx_ledger_decision
    ON ledger_events(decision)
    WHERE decision IN ('deny', 'warn', 'shadow_deny');

-- Policy: find events by policy for impact analysis
CREATE INDEX IF NOT EXISTS idx_ledger_policy
    ON ledger_events(policy_id)
    WHERE policy_id IS NOT NULL;


-- ============================================
-- COMMENTS: Documentation
-- ============================================

COMMENT ON TABLE ledger_events IS
    'Immutable audit log for all governance-relevant actions in BlackRoad OS. '
    'Implements the v1 governance contract with four-value decision enum and '
    'hybrid condition model (claim_check + caller_asserts).';

COMMENT ON COLUMN ledger_events.correlation_id IS
    'UUID that ties related events across services within a single logical request.';

COMMENT ON COLUMN ledger_events.intent_id IS
    'UUID for multi-step intents. Null for single-action requests.';

COMMENT ON COLUMN ledger_events.layer IS
    'System layer: experience (user-facing), governance (Cece), mesh (agents), infra (ops).';

COMMENT ON COLUMN ledger_events.decision IS
    'allow=proceed, deny=block, warn=proceed+flag, shadow_deny=proceed+log-as-denied.';

COMMENT ON COLUMN ledger_events.ledger_level IS
    'Granularity: none (internal), decision, action (+ metadata), full (+ request/response).';

COMMENT ON COLUMN ledger_events.asserted_facts IS
    'Facts the caller asserted were true. Logged for audit even though not verified.';

COMMENT ON COLUMN ledger_events.fact_evidence IS
    'Evidence supporting asserted facts. Structure depends on the fact type.';
