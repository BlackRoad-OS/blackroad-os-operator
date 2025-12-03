-- Migration: Create logs table for centralized logging
-- Created: 2025-12-02
-- Description: Stores log entries from all BlackRoad OS services

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp INTEGER NOT NULL,
  service TEXT NOT NULL,
  level TEXT NOT NULL CHECK(level IN ('info', 'warn', 'error', 'debug')),
  message TEXT NOT NULL,
  metadata TEXT,  -- JSON string for additional context
  request_id TEXT,
  user_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_logs_service ON logs(service);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_request_id ON logs(request_id);
CREATE INDEX IF NOT EXISTS idx_logs_service_level ON logs(service, level);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp_level ON logs(timestamp DESC, level);

-- Stats view for quick analytics
CREATE VIEW IF NOT EXISTS log_stats AS
SELECT
  service,
  level,
  COUNT(*) as count,
  MAX(timestamp) as last_occurrence
FROM logs
GROUP BY service, level;
