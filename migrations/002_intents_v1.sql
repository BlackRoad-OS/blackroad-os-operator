-- 002_intents_v1.sql
-- Stage 3: Intent Chains - Multi-Step Governance
--
-- Intents represent coordinated multi-step workflows where each step
-- is governed by policies and logged to the ledger.
--
-- @amundson 0.1.0
-- @governor alice.governor.v1
-- @operator alexa.operator.v1

-- ============================================
-- INTENT TEMPLATES
-- ============================================
-- Templates define the structure of valid workflows

CREATE TABLE IF NOT EXISTS intent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identity
    name VARCHAR(255) NOT NULL UNIQUE,
    version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    description TEXT,

    -- Template Definition
    template_type VARCHAR(100) NOT NULL,  -- deployment, assignment, agent_register, secret_rotate
    steps JSONB NOT NULL,                  -- Ordered list of step definitions

    -- Governance
    policy_scope VARCHAR(100) NOT NULL,    -- intents.deployment.*, intents.assignment.*
    required_role VARCHAR(100),            -- Role required to create this intent type

    -- Rollback Configuration
    rollback_enabled BOOLEAN DEFAULT true,
    rollback_on_failure JSONB,             -- Steps that trigger rollback

    -- Timeout
    timeout_seconds INTEGER DEFAULT 1800,  -- 30 minutes default

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by VARCHAR(255),

    -- Amundson metadata
    amundson_version VARCHAR(20) DEFAULT '0.1.0'
);

-- ============================================
-- INTENTS
-- ============================================
-- Active intent instances

CREATE TYPE intent_state AS ENUM (
    'pending',      -- Created, not started
    'in_progress',  -- At least one step started
    'completed',    -- All steps completed successfully
    'failed',       -- A step failed
    'rolled_back',  -- Rollback completed
    'cancelled',    -- Cancelled by user/operator
    'timed_out'     -- Exceeded timeout
);

CREATE TABLE IF NOT EXISTS intents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Template Reference
    template_id UUID REFERENCES intent_templates(id),
    template_name VARCHAR(255) NOT NULL,
    template_version VARCHAR(50) NOT NULL,

    -- State
    state intent_state NOT NULL DEFAULT 'pending',
    current_step INTEGER DEFAULT 0,

    -- Actor
    created_by_user_id VARCHAR(255),
    created_by_agent_id VARCHAR(255),
    created_by_role VARCHAR(100) NOT NULL,

    -- Correlation
    correlation_id UUID NOT NULL DEFAULT gen_random_uuid(),
    parent_intent_id UUID REFERENCES intents(id),  -- For nested intents

    -- Context
    context JSONB DEFAULT '{}',      -- Input parameters for the intent
    result JSONB,                     -- Final result/output
    error_message TEXT,

    -- Governance
    policy_scope VARCHAR(100) NOT NULL,

    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    timeout_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    CONSTRAINT intent_actor_check CHECK (
        created_by_user_id IS NOT NULL OR created_by_agent_id IS NOT NULL
    )
);

-- ============================================
-- INTENT STEPS
-- ============================================
-- Individual steps within an intent

CREATE TYPE step_status AS ENUM (
    'pending',      -- Not yet started
    'in_progress',  -- Currently executing
    'completed',    -- Finished successfully
    'failed',       -- Failed
    'skipped',      -- Skipped (e.g., conditional step)
    'rolled_back'   -- Rolled back
);

CREATE TABLE IF NOT EXISTS intent_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent Intent
    intent_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,

    -- Step Identity
    sequence_num INTEGER NOT NULL,
    action VARCHAR(255) NOT NULL,        -- deployment:request, deployment:approve, etc.
    name VARCHAR(255),                   -- Human-readable name

    -- Status
    status step_status NOT NULL DEFAULT 'pending',

    -- Actor (who executed this step)
    executed_by_user_id VARCHAR(255),
    executed_by_agent_id VARCHAR(255),
    executed_by_role VARCHAR(100),

    -- Policy Decision
    policy_decision VARCHAR(50),         -- allow, deny, warn, shadow_deny
    policy_id VARCHAR(255),
    ledger_event_id UUID,                -- Reference to ledger event

    -- Step Data
    input JSONB DEFAULT '{}',
    output JSONB,
    error_message TEXT,

    -- Timing
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Retry tracking
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,

    UNIQUE (intent_id, sequence_num)
);

-- ============================================
-- INTENT EVENTS
-- ============================================
-- Audit trail of all intent-related events

CREATE TYPE intent_event_type AS ENUM (
    'created',
    'started',
    'step_started',
    'step_completed',
    'step_failed',
    'step_retried',
    'completed',
    'failed',
    'rollback_started',
    'rollback_completed',
    'cancelled',
    'timed_out'
);

CREATE TABLE IF NOT EXISTS intent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    intent_id UUID NOT NULL REFERENCES intents(id) ON DELETE CASCADE,
    step_id UUID REFERENCES intent_steps(id) ON DELETE SET NULL,
    ledger_event_id UUID,                -- Link to main ledger

    -- Event
    event_type intent_event_type NOT NULL,

    -- Actor
    actor_user_id VARCHAR(255),
    actor_agent_id VARCHAR(255),
    actor_role VARCHAR(100),

    -- Data
    previous_state intent_state,
    new_state intent_state,
    payload JSONB DEFAULT '{}',

    -- Timing
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Correlation
    correlation_id UUID NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Intent Templates
CREATE INDEX idx_intent_templates_type ON intent_templates(template_type);
CREATE INDEX idx_intent_templates_scope ON intent_templates(policy_scope);

-- Intents
CREATE INDEX idx_intents_state ON intents(state);
CREATE INDEX idx_intents_template ON intents(template_id);
CREATE INDEX idx_intents_correlation ON intents(correlation_id);
CREATE INDEX idx_intents_created_by_user ON intents(created_by_user_id);
CREATE INDEX idx_intents_created_by_agent ON intents(created_by_agent_id);
CREATE INDEX idx_intents_created_at ON intents(created_at DESC);
CREATE INDEX idx_intents_timeout ON intents(timeout_at) WHERE state = 'in_progress';
CREATE INDEX idx_intents_parent ON intents(parent_intent_id) WHERE parent_intent_id IS NOT NULL;

-- Intent Steps
CREATE INDEX idx_intent_steps_intent ON intent_steps(intent_id);
CREATE INDEX idx_intent_steps_status ON intent_steps(status);
CREATE INDEX idx_intent_steps_action ON intent_steps(action);
CREATE INDEX idx_intent_steps_ledger ON intent_steps(ledger_event_id) WHERE ledger_event_id IS NOT NULL;

-- Intent Events
CREATE INDEX idx_intent_events_intent ON intent_events(intent_id);
CREATE INDEX idx_intent_events_type ON intent_events(event_type);
CREATE INDEX idx_intent_events_occurred ON intent_events(occurred_at DESC);
CREATE INDEX idx_intent_events_correlation ON intent_events(correlation_id);

-- ============================================
-- TRIGGER: Update timestamps
-- ============================================

CREATE OR REPLACE FUNCTION update_intent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intent_templates_updated
    BEFORE UPDATE ON intent_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_intent_timestamp();

-- ============================================
-- TRIGGER: Calculate timeout_at on intent start
-- ============================================

CREATE OR REPLACE FUNCTION set_intent_timeout()
RETURNS TRIGGER AS $$
DECLARE
    template_timeout INTEGER;
BEGIN
    IF NEW.state = 'in_progress' AND OLD.state = 'pending' THEN
        NEW.started_at = now();

        -- Get timeout from template
        SELECT timeout_seconds INTO template_timeout
        FROM intent_templates
        WHERE id = NEW.template_id;

        IF template_timeout IS NOT NULL THEN
            NEW.timeout_at = now() + (template_timeout || ' seconds')::INTERVAL;
        ELSE
            NEW.timeout_at = now() + INTERVAL '30 minutes';
        END IF;
    END IF;

    IF NEW.state IN ('completed', 'failed', 'rolled_back', 'cancelled') AND NEW.completed_at IS NULL THEN
        NEW.completed_at = now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER intent_state_change
    BEFORE UPDATE ON intents
    FOR EACH ROW
    EXECUTE FUNCTION set_intent_timeout();

-- ============================================
-- DEFAULT INTENT TEMPLATES
-- ============================================

INSERT INTO intent_templates (name, version, description, template_type, steps, policy_scope, required_role, rollback_on_failure) VALUES

-- Deployment Intent
('deployment', '1.0.0', 'Deploy a service to production', 'deployment',
'[
  {"sequence": 1, "action": "deployment:request", "name": "Request Deployment", "required": true},
  {"sequence": 2, "action": "deployment:approve", "name": "Approve Deployment", "required": true, "requires_role": "operator"},
  {"sequence": 3, "action": "deployment:pre-check", "name": "Pre-flight Checks", "required": true},
  {"sequence": 4, "action": "deployment:execute", "name": "Execute Deployment", "required": true},
  {"sequence": 5, "action": "deployment:validate", "name": "Validate Deployment", "required": true}
]'::JSONB,
'intents.deployment.*', 'operator', '["deployment:execute", "deployment:validate"]'::JSONB),

-- Database Migration Intent
('db-migration', '1.0.0', 'Run database migration', 'db_migration',
'[
  {"sequence": 1, "action": "migration:request", "name": "Request Migration", "required": true},
  {"sequence": 2, "action": "migration:backup", "name": "Backup Database", "required": true},
  {"sequence": 3, "action": "migration:approve", "name": "Approve Migration", "required": true, "requires_role": "operator"},
  {"sequence": 4, "action": "migration:execute", "name": "Execute Migration", "required": true},
  {"sequence": 5, "action": "migration:validate", "name": "Validate Schema", "required": true}
]'::JSONB,
'intents.migration.*', 'operator', '["migration:execute"]'::JSONB),

-- Agent Registration Intent
('agent-register', '1.0.0', 'Register a new agent in the mesh', 'agent_register',
'[
  {"sequence": 1, "action": "agent:request-registration", "name": "Request Registration", "required": true},
  {"sequence": 2, "action": "agent:verify-capabilities", "name": "Verify Capabilities", "required": true},
  {"sequence": 3, "action": "agent:approve-registration", "name": "Approve Registration", "required": true, "requires_role": "operator"},
  {"sequence": 4, "action": "agent:activate", "name": "Activate Agent", "required": true}
]'::JSONB,
'intents.agent.*', 'operator', '["agent:activate"]'::JSONB),

-- Secret Rotation Intent
('secret-rotation', '1.0.0', 'Rotate a secret or credential', 'secret_rotate',
'[
  {"sequence": 1, "action": "secret:request-rotation", "name": "Request Rotation", "required": true},
  {"sequence": 2, "action": "secret:backup-current", "name": "Backup Current Secret", "required": true},
  {"sequence": 3, "action": "secret:generate-new", "name": "Generate New Secret", "required": true},
  {"sequence": 4, "action": "secret:validate-new", "name": "Validate New Secret", "required": true},
  {"sequence": 5, "action": "secret:activate", "name": "Activate New Secret", "required": true, "requires_role": "operator"},
  {"sequence": 6, "action": "secret:cleanup-old", "name": "Cleanup Old Secret", "required": false}
]'::JSONB,
'intents.secret.*', 'operator', '["secret:activate"]'::JSONB),

-- Assignment Flow Intent (Education)
('assignment-flow', '1.0.0', 'Complete assignment lifecycle', 'assignment',
'[
  {"sequence": 1, "action": "assignment:create", "name": "Create Assignment", "required": true, "requires_role": "teacher"},
  {"sequence": 2, "action": "assignment:publish", "name": "Publish to Students", "required": true, "requires_role": "teacher"},
  {"sequence": 3, "action": "assignment:submit", "name": "Student Submission", "required": true, "requires_role": "student"},
  {"sequence": 4, "action": "assignment:grade", "name": "Grade Submission", "required": true, "requires_role": "teacher"},
  {"sequence": 5, "action": "assignment:release", "name": "Release Grade", "required": true, "requires_role": "teacher"}
]'::JSONB,
'intents.assignment.*', 'teacher', '[]'::JSONB),

-- Mesh Connection Intent
('mesh-connect', '1.0.0', 'Establish mesh network connection', 'mesh_connect',
'[
  {"sequence": 1, "action": "mesh:request-connect", "name": "Request Connection", "required": true},
  {"sequence": 2, "action": "mesh:verify-delegation", "name": "Verify Delegation", "required": true},
  {"sequence": 3, "action": "mesh:establish", "name": "Establish Connection", "required": true},
  {"sequence": 4, "action": "mesh:health-check", "name": "Health Check", "required": true}
]'::JSONB,
'intents.mesh.*', null, '["mesh:establish"]'::JSONB),

-- Infrastructure Scale Intent
('infra-scale', '1.0.0', 'Scale infrastructure component', 'infra_scale',
'[
  {"sequence": 1, "action": "infra:request-scale", "name": "Request Scale", "required": true},
  {"sequence": 2, "action": "infra:approve-scale", "name": "Approve Scale", "required": true, "requires_role": "operator"},
  {"sequence": 3, "action": "infra:pre-check", "name": "Pre-Scale Check", "required": true},
  {"sequence": 4, "action": "infra:execute-scale", "name": "Execute Scale", "required": true},
  {"sequence": 5, "action": "infra:verify-scale", "name": "Verify Scale", "required": true}
]'::JSONB,
'intents.infra.*', 'operator', '["infra:execute-scale"]'::JSONB)

ON CONFLICT (name) DO UPDATE SET
    version = EXCLUDED.version,
    description = EXCLUDED.description,
    steps = EXCLUDED.steps,
    updated_at = now();

-- ============================================
-- VIEWS
-- ============================================

-- Active intents view
CREATE OR REPLACE VIEW active_intents AS
SELECT
    i.id,
    i.template_name,
    i.state,
    i.current_step,
    i.created_by_user_id,
    i.created_by_agent_id,
    i.created_by_role,
    i.created_at,
    i.started_at,
    i.timeout_at,
    i.correlation_id,
    COUNT(s.id) as total_steps,
    COUNT(s.id) FILTER (WHERE s.status = 'completed') as completed_steps,
    COUNT(s.id) FILTER (WHERE s.status = 'failed') as failed_steps
FROM intents i
LEFT JOIN intent_steps s ON s.intent_id = i.id
WHERE i.state IN ('pending', 'in_progress')
GROUP BY i.id;

-- Intent audit trail view
CREATE OR REPLACE VIEW intent_audit_trail AS
SELECT
    ie.id as event_id,
    ie.intent_id,
    i.template_name,
    ie.event_type,
    ie.previous_state,
    ie.new_state,
    ie.actor_user_id,
    ie.actor_agent_id,
    ie.actor_role,
    ie.occurred_at,
    ie.correlation_id,
    s.action as step_action,
    s.sequence_num as step_sequence
FROM intent_events ie
JOIN intents i ON i.id = ie.intent_id
LEFT JOIN intent_steps s ON s.id = ie.step_id
ORDER BY ie.occurred_at DESC;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get next pending step for an intent
CREATE OR REPLACE FUNCTION get_next_step(p_intent_id UUID)
RETURNS TABLE (
    step_id UUID,
    sequence_num INTEGER,
    action VARCHAR,
    name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT s.id, s.sequence_num, s.action, s.name
    FROM intent_steps s
    WHERE s.intent_id = p_intent_id
      AND s.status = 'pending'
    ORDER BY s.sequence_num
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Check if intent can proceed to next step
CREATE OR REPLACE FUNCTION can_proceed_to_step(p_intent_id UUID, p_sequence_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    prev_step_status step_status;
    intent_state_val intent_state;
BEGIN
    -- Check intent state
    SELECT state INTO intent_state_val FROM intents WHERE id = p_intent_id;
    IF intent_state_val NOT IN ('pending', 'in_progress') THEN
        RETURN FALSE;
    END IF;

    -- If first step, always OK
    IF p_sequence_num = 1 THEN
        RETURN TRUE;
    END IF;

    -- Check previous step is completed
    SELECT status INTO prev_step_status
    FROM intent_steps
    WHERE intent_id = p_intent_id AND sequence_num = p_sequence_num - 1;

    RETURN prev_step_status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE intent_templates IS 'Defines valid multi-step workflow structures';
COMMENT ON TABLE intents IS 'Active intent instances representing in-flight workflows';
COMMENT ON TABLE intent_steps IS 'Individual governed steps within an intent';
COMMENT ON TABLE intent_events IS 'Audit trail of all intent state changes';

COMMENT ON COLUMN intents.correlation_id IS 'Links all ledger events in this intent chain';
COMMENT ON COLUMN intent_steps.ledger_event_id IS 'Reference to the ledger event for this step';
