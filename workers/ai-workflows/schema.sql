-- AI Workflows Ledger Schema
-- Cloudflare D1 Database

CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT NOT NULL,
    data TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event ON ledger(event);
CREATE INDEX idx_timestamp ON ledger(timestamp);

-- Workflow state tracking
CREATE TABLE IF NOT EXISTS workflow_state (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT NOT NULL UNIQUE,
    issue_id TEXT,
    status TEXT NOT NULL,
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_workflow_id ON workflow_state(workflow_id);
CREATE INDEX idx_issue_id ON workflow_state(issue_id);
CREATE INDEX idx_status ON workflow_state(status);

-- Infrastructure health tracking
CREATE TABLE IF NOT EXISTS infrastructure_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_type TEXT NOT NULL,  -- 'edge', 'droplet', 'pi'
    node_id TEXT NOT NULL,
    status TEXT NOT NULL,     -- 'online', 'offline', 'degraded'
    last_heartbeat DATETIME,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_node_type ON infrastructure_health(node_type);
CREATE INDEX idx_node_id ON infrastructure_health(node_id);
